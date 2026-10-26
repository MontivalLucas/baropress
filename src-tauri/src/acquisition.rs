use serde::{Deserialize, Serialize};
use std::io::{self, BufRead, BufReader};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::{Duration, Instant};
use tauri::Manager;
use tauri::{AppHandle, Emitter};

pub const EXPECTED_SENSORS: usize = 225;
pub const MAX_ADC_VALUE: u16 = 4095;
// Um quadro de 225 ADCs (ate quatro digitos, virgulas e CRLF) cabe com folga.
const MAX_FRAME_LINE_BYTES: usize = 4096;
// O worker verifica cancelamento/sessao entre blocos, mesmo sem nova linha.
const SERIAL_CHUNK_BYTES: usize = 1024;

#[derive(Debug, PartialEq, Eq)]
enum FrameLineStatus {
    Pending,
    Complete,
    TooLong,
    EndOfStream,
}

/// Processa apenas um bloco pequeno; descarta uma linha excedente ate o LF.
/// O buffer permanece limitado e sobrevive a timeouts entre fragmentos.
fn read_bounded_frame_chunk<R: BufRead>(
    reader: &mut R,
    line: &mut Vec<u8>,
    discarding: &mut bool,
) -> io::Result<FrameLineStatus> {
    let available = reader.fill_buf()?;
    if available.is_empty() {
        return Ok(FrameLineStatus::EndOfStream);
    }
    let portion = &available[..available.len().min(SERIAL_CHUNK_BYTES)];
    let newline = portion.iter().position(|byte| *byte == b'\n');
    let count = newline.map_or(portion.len(), |index| index + 1);
    if !*discarding {
        if line.len().saturating_add(count) > MAX_FRAME_LINE_BYTES {
            line.clear();
            *discarding = true;
        } else {
            line.extend_from_slice(&portion[..count]);
        }
    }
    reader.consume(count);
    if newline.is_none() {
        return Ok(FrameLineStatus::Pending);
    }
    if std::mem::take(discarding) {
        line.clear();
        Ok(FrameLineStatus::TooLong)
    } else {
        Ok(FrameLineStatus::Complete)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortInfoDto {
    pub name: String,
    pub description: Option<String>,
    pub manufacturer: Option<String>,
    pub product: Option<String>,
    pub is_bluetooth: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SensorFramePayload {
    pub timestamp: f64,
    pub sequence: u64,
    pub values: Vec<u16>,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStatusDto {
    pub connected: bool,
    pub acquiring: bool,
    pub transport: String,
    pub port: Option<String>,
    pub baud_rate: Option<u32>,
    pub frames_received: u64,
    pub invalid_frames: u64,
    pub fps: f32,
    pub last_error: Option<String>,
}

/// Faz o parse estrito de uma linha de texto contendo 225 inteiros entre 0 e 4095.
pub fn parse_csv_frame(line: &str) -> Result<Vec<u16>, String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Err("Linha vazia".into());
    }

    let tokens: Vec<&str> = trimmed.split(',').collect();
    if tokens.len() != EXPECTED_SENSORS {
        return Err(format!(
            "Quantidade de valores inválida: esperados {}, recebidos {}",
            EXPECTED_SENSORS,
            tokens.len()
        ));
    }

    let mut values = Vec::with_capacity(EXPECTED_SENSORS);
    for (i, tok) in tokens.iter().enumerate() {
        let t = tok.trim();
        let val: i64 = t
            .parse::<i64>()
            .map_err(|_| format!("Valor não numérico no sensor {}: '{}'", i + 1, t))?;

        if val < 0 {
            return Err(format!("Valor negativo no sensor {}: {}", i + 1, val));
        }
        if val > MAX_ADC_VALUE as i64 {
            return Err(format!(
                "Valor excede o limite ADC (4095) no sensor {}: {}",
                i + 1,
                val
            ));
        }

        values.push(val as u16);
    }

    Ok(values)
}

struct AcquisitionInner {
    connected: bool,
    acquiring: bool,
    transport: String,
    port: Option<String>,
    baud_rate: Option<u32>,
    frames_received: u64,
    invalid_frames: u64,
    fps: f32,
    last_error: Option<String>,
}

pub struct AcquisitionState {
    inner: Arc<Mutex<AcquisitionInner>>,
    stop_signal: Arc<AtomicBool>,
    worker_handle: Mutex<Option<JoinHandle<()>>>,
}

impl AcquisitionState {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(AcquisitionInner {
                connected: false,
                acquiring: false,
                transport: "NONE".into(),
                port: None,
                baud_rate: None,
                frames_received: 0,
                invalid_frames: 0,
                fps: 0.0,
                last_error: None,
            })),
            stop_signal: Arc::new(AtomicBool::new(false)),
            worker_handle: Mutex::new(None),
        }
    }
}

pub fn list_ports() -> Vec<PortInfoDto> {
    let mut result = Vec::new();
    if let Ok(ports) = serialport::available_ports() {
        for p in ports {
            let mut description = None;
            let mut manufacturer = None;
            let mut product = None;
            let is_bluetooth = p.port_name.to_lowercase().contains("bth")
                || p.port_name.to_lowercase().contains("bluetooth");

            match p.port_type {
                serialport::SerialPortType::UsbPort(info) => {
                    manufacturer = info.manufacturer;
                    product = info.product;
                }
                serialport::SerialPortType::BluetoothPort => {
                    description = Some("Dispositivo Bluetooth SPP".into());
                }
                _ => {}
            }

            result.push(PortInfoDto {
                name: p.port_name,
                description,
                manufacturer,
                product,
                is_bluetooth,
            });
        }
    }
    result
}

#[tauri::command]
pub fn acquisition_list_ports() -> Result<Vec<PortInfoDto>, String> {
    Ok(list_ports())
}

#[tauri::command]
pub fn acquisition_connect(
    db: tauri::State<crate::AppDb>,
    auth: tauri::State<crate::auth::AuthState>,
    state: tauri::State<AcquisitionState>,
    port: String,
    baud_rate: u32,
) -> Result<(), String> {
    {
        let c = db.0.lock().map_err(|_| "Banco indisponível")?;
        let user = crate::auth::current(&c, &auth)?;
        let p = crate::support::get_preferences(&c)?;
        if user.role != "admin"
            && (p.device_type != "SERIAL" || p.selected_port != port || p.baud_rate != baud_rate)
        {
            return Err("Solicite ao administrador a configuração do Arduino.".into());
        }
    }
    let mut inner = state.inner.lock().map_err(|_| "Erro ao obter lock")?;
    if inner.connected {
        return Err("Dispositivo já conectado".into());
    }

    // Testa abertura preliminar da porta para validar
    match serialport::new(&port, baud_rate)
        .timeout(Duration::from_millis(1500))
        .open()
    {
        Ok(_) => {
            let is_bt = port.to_lowercase().contains("bluetooth");
            inner.connected = true;
            inner.acquiring = false;
            inner.transport = if is_bt {
                "BLUETOOTH".into()
            } else {
                "SERIAL".into()
            };
            inner.port = Some(port);
            inner.baud_rate = Some(baud_rate);
            inner.last_error = None;
            inner.frames_received = 0;
            inner.invalid_frames = 0;
            inner.fps = 0.0;
            Ok(())
        }
        Err(e) => {
            let msg = format!("Não foi possível abrir a porta {}: {}", port, e);
            inner.last_error = Some(msg.clone());
            Err(msg)
        }
    }
}

#[tauri::command]
pub fn acquisition_disconnect(state: tauri::State<AcquisitionState>) -> Result<(), String> {
    state.stop_signal.store(true, Ordering::SeqCst);

    if let Ok(mut handle_guard) = state.worker_handle.lock() {
        if let Some(handle) = handle_guard.take() {
            let _ = handle.join();
        }
    }

    let mut inner = state.inner.lock().map_err(|_| "Erro ao obter lock")?;
    inner.connected = false;
    inner.acquiring = false;
    inner.transport = "NONE".into();
    inner.port = None;
    inner.baud_rate = None;
    inner.fps = 0.0;
    inner.last_error = None;

    Ok(())
}

#[tauri::command]
pub fn acquisition_start(
    app: AppHandle,
    state: tauri::State<AcquisitionState>,
) -> Result<(), String> {
    let owner = {
        let db = app.state::<crate::AppDb>();
        let c = db.0.lock().map_err(|_| "Banco indisponível")?;
        crate::auth::current(&c, &app.state::<crate::auth::AuthState>())?
    };
    let (port_name, baud) = {
        let mut inner = state.inner.lock().map_err(|_| "Erro ao obter lock")?;
        if !inner.connected {
            return Err("Nenhum dispositivo conectado para iniciar aquisição".into());
        }
        if inner.acquiring {
            return Ok(());
        }
        inner.acquiring = true;
        inner.last_error = None;
        (
            inner.port.clone().ok_or("Porta não especificada")?,
            inner.baud_rate.unwrap_or(115200),
        )
    };

    state.stop_signal.store(false, Ordering::SeqCst);
    let stop_signal = Arc::clone(&state.stop_signal);
    let inner_arc = Arc::clone(&state.inner);

    let handle = thread::spawn(move || {
        let port_result = serialport::new(&port_name, baud)
            .timeout(Duration::from_millis(2000))
            .open();

        let mut port = match port_result {
            Ok(p) => p,
            Err(e) => {
                if let Ok(mut l) = inner_arc.lock() {
                    l.acquiring = false;
                    l.connected = false;
                    l.last_error = Some(format!("Falha ao iniciar leitura serial: {}", e));
                }
                return;
            }
        };

        let mut reader = BufReader::new(&mut port);
        let mut line_buffer = Vec::with_capacity(2048);
        let mut discarding_line = false;
        let mut sequence: u64 = 0;

        let mut fps_counter: u32 = 0;
        let mut fps_timer = Instant::now();

        let mut auth_checked = Instant::now();
        while !stop_signal.load(Ordering::SeqCst) {
            if auth_checked.elapsed() >= Duration::from_secs(1) {
                auth_checked = Instant::now();
                let valid = {
                    let db = app.state::<crate::AppDb>();
                    let valid = db
                        .0
                        .lock()
                        .ok()
                        .and_then(|c| {
                            crate::auth::current(&c, &app.state::<crate::auth::AuthState>()).ok()
                        })
                        .is_some_and(|u| {
                            u.id == owner.id
                                && u.session_version == owner.session_version
                                && u.role != "assistant"
                        });
                    valid
                };
                if !valid {
                    if let Ok(mut inner) = inner_arc.lock() {
                        inner.acquiring = false;
                        inner.connected = false;
                        inner.last_error = Some("Sessão encerrada. Entre novamente.".into());
                    }
                    break;
                }
            }
            match read_bounded_frame_chunk(&mut reader, &mut line_buffer, &mut discarding_line) {
                Ok(FrameLineStatus::EndOfStream) => {
                    // Fim de stream / timeout momentâneo
                    thread::sleep(Duration::from_millis(5));
                }
                Ok(FrameLineStatus::Pending) => {}
                Ok(FrameLineStatus::TooLong) => {
                    let _ = app.emit("acquisition-invalid-frame", ());
                    if let Ok(mut l) = inner_arc.lock() {
                        l.invalid_frames += 1;
                    }
                }
                Ok(FrameLineStatus::Complete) => {
                    let parsed = std::str::from_utf8(&line_buffer)
                        .map_err(|_| "Quadro com UTF-8 inválido".to_string())
                        .and_then(parse_csv_frame);
                    line_buffer.clear();
                    match parsed {
                        Ok(values) => {
                            sequence += 1;
                            fps_counter += 1;

                            let now_elapsed = fps_timer.elapsed();
                            let current_fps = if now_elapsed >= Duration::from_secs(1) {
                                let f = (fps_counter as f32) / now_elapsed.as_secs_f32();
                                fps_counter = 0;
                                fps_timer = Instant::now();
                                Some(f)
                            } else {
                                None
                            };

                            let payload = SensorFramePayload {
                                timestamp: (js_sys_time() as f64) / 1000.0,
                                sequence,
                                values,
                                source: "REAL".into(),
                            };

                            // Envia evento Tauri assíncrono para o frontend
                            let _ = app.emit("sensor-frame", &payload);

                            if let Ok(mut l) = inner_arc.lock() {
                                l.frames_received += 1;
                                if let Some(fps_val) = current_fps {
                                    l.fps = (fps_val * 10.0).round() / 10.0;
                                }
                            }
                        }
                        Err(_parse_err) => {
                            let _ = app.emit("acquisition-invalid-frame", ());
                            if let Ok(mut l) = inner_arc.lock() {
                                l.invalid_frames += 1;
                            }
                        }
                    }
                }
                Err(ref e)
                    if matches!(
                        e.kind(),
                        std::io::ErrorKind::TimedOut | std::io::ErrorKind::WouldBlock
                    ) =>
                {
                    // Timeout esperado na ausência de novos dados
                    continue;
                }
                Err(e) => {
                    // Erro fatal de comunicação (ex.: dispositivo desconectado fisicamente)
                    if let Ok(mut l) = inner_arc.lock() {
                        l.connected = false;
                        l.acquiring = false;
                        l.last_error = Some(format!("Conexão com o dispositivo perdida: {}", e));
                    }
                    let _ = app.emit("acquisition-error", "Conexão perdida com o dispositivo.");
                    break;
                }
            }
        }

        if let Ok(mut l) = inner_arc.lock() {
            l.acquiring = false;
        }
    });

    if let Ok(mut handle_guard) = state.worker_handle.lock() {
        *handle_guard = Some(handle);
    }

    Ok(())
}

#[tauri::command]
pub fn acquisition_stop(state: tauri::State<AcquisitionState>) -> Result<(), String> {
    state.stop_signal.store(true, Ordering::SeqCst);

    if let Ok(mut handle_guard) = state.worker_handle.lock() {
        if let Some(handle) = handle_guard.take() {
            let _ = handle.join();
        }
    }

    let mut inner = state.inner.lock().map_err(|_| "Erro ao obter lock")?;
    inner.acquiring = false;
    inner.fps = 0.0;
    Ok(())
}

#[tauri::command]
pub fn acquisition_get_status(
    state: tauri::State<AcquisitionState>,
) -> Result<DeviceStatusDto, String> {
    let inner = state.inner.lock().map_err(|_| "Erro ao obter lock")?;
    Ok(DeviceStatusDto {
        connected: inner.connected,
        acquiring: inner.acquiring,
        transport: inner.transport.clone(),
        port: inner.port.clone(),
        baud_rate: inner.baud_rate,
        frames_received: inner.frames_received,
        invalid_frames: inner.invalid_frames,
        fps: inner.fps,
        last_error: inner.last_error.clone(),
    })
}

fn js_sys_time() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{BufRead, BufReader, Cursor, Read};

    struct TimeoutOnce<R> {
        reader: R,
        calls: usize,
    }

    impl<R: BufRead> Read for TimeoutOnce<R> {
        fn read(&mut self, bytes: &mut [u8]) -> io::Result<usize> {
            self.reader.read(bytes)
        }
    }

    impl<R: BufRead> BufRead for TimeoutOnce<R> {
        fn fill_buf(&mut self) -> io::Result<&[u8]> {
            self.calls += 1;
            if self.calls == 3 {
                return Err(io::Error::new(io::ErrorKind::TimedOut, "sem novos bytes"));
            }
            self.reader.fill_buf()
        }

        fn consume(&mut self, amount: usize) {
            self.reader.consume(amount);
        }
    }

    #[test]
    fn serial_timeout_between_fragments_does_not_lose_frame() {
        let frame = (0..EXPECTED_SENSORS)
            .map(|v| v.to_string())
            .collect::<Vec<_>>()
            .join(",");
        let reader = BufReader::with_capacity(11, Cursor::new(format!("{frame}\n").into_bytes()));
        let mut reader = TimeoutOnce { reader, calls: 0 };
        let mut line = Vec::new();
        let mut discarding = false;
        let mut timeouts = 0;
        let mut accepted = 0;
        loop {
            match read_bounded_frame_chunk(&mut reader, &mut line, &mut discarding) {
                Ok(FrameLineStatus::Pending) => {}
                Ok(FrameLineStatus::Complete) => {
                    assert_eq!(
                        parse_csv_frame(std::str::from_utf8(&line).unwrap())
                            .unwrap()
                            .len(),
                        EXPECTED_SENSORS
                    );
                    line.clear();
                    accepted += 1;
                }
                Ok(FrameLineStatus::EndOfStream) => break,
                Err(e) if e.kind() == io::ErrorKind::TimedOut => timeouts += 1,
                other => panic!("Resultado inesperado: {other:?}"),
            }
        }
        assert_eq!((timeouts, accepted), (1, 1));
    }

    #[test]
    fn bounded_serial_line_accepts_fragmented_frame_and_keeps_next_frame() {
        let frame = (0..EXPECTED_SENSORS)
            .map(|v| v.to_string())
            .collect::<Vec<_>>()
            .join(",");
        let input = format!("{frame}\r\n{frame}\n");
        let mut reader = BufReader::with_capacity(17, Cursor::new(input.as_bytes()));
        let mut line = Vec::new();
        let mut discarding = false;
        let mut parsed = 0;
        loop {
            match read_bounded_frame_chunk(&mut reader, &mut line, &mut discarding).unwrap() {
                FrameLineStatus::Pending => assert!(line.len() <= MAX_FRAME_LINE_BYTES),
                FrameLineStatus::Complete => {
                    assert_eq!(
                        parse_csv_frame(std::str::from_utf8(&line).unwrap())
                            .unwrap()
                            .len(),
                        EXPECTED_SENSORS
                    );
                    line.clear();
                    parsed += 1;
                }
                FrameLineStatus::EndOfStream => break,
                FrameLineStatus::TooLong => panic!("Quadro valido rejeitado"),
            }
        }
        assert_eq!(parsed, 2);
    }

    #[test]
    fn serial_line_without_delimiter_is_bounded_and_resynchronizes() {
        let frame = (0..EXPECTED_SENSORS)
            .map(|v| v.to_string())
            .collect::<Vec<_>>()
            .join(",");
        let input = format!("{}\n{frame}\n", "9".repeat(1_048_576));
        let mut reader = BufReader::new(Cursor::new(input.as_bytes()));
        let mut line = Vec::new();
        let mut discarding = false;
        let mut too_long = 0;
        let mut recovered = 0;
        let mut steps = 0;
        loop {
            steps += 1;
            match read_bounded_frame_chunk(&mut reader, &mut line, &mut discarding).unwrap() {
                FrameLineStatus::Pending => assert!(line.len() <= MAX_FRAME_LINE_BYTES),
                FrameLineStatus::TooLong => {
                    too_long += 1;
                    assert!(line.is_empty());
                }
                FrameLineStatus::Complete => {
                    recovered += 1;
                    assert_eq!(
                        parse_csv_frame(std::str::from_utf8(&line).unwrap())
                            .unwrap()
                            .len(),
                        EXPECTED_SENSORS
                    );
                    line.clear();
                }
                FrameLineStatus::EndOfStream => break,
            }
        }
        assert!(steps > 1000, "Leitura deve ceder controle entre blocos");
        assert_eq!((too_long, recovered), (1, 1));
    }

    #[test]
    fn test_parse_valid_225_frame() {
        let frame_str = (0..225)
            .map(|i| i.to_string())
            .collect::<Vec<_>>()
            .join(",");
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_ok());
        let vals = res.unwrap();
        assert_eq!(vals.len(), 225);
        assert_eq!(vals[0], 0);
        assert_eq!(vals[224], 224);
    }

    #[test]
    fn test_parse_frame_with_spaces_and_crlf() {
        let frame_str = (0..225)
            .map(|i| format!(" {} ", i))
            .collect::<Vec<_>>()
            .join(",")
            + "\r\n";
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_ok());
        assert_eq!(res.unwrap().len(), 225);
    }

    #[test]
    fn test_reject_fewer_than_225_values() {
        let frame_str = (0..224)
            .map(|i| i.to_string())
            .collect::<Vec<_>>()
            .join(",");
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("esperados 225"));
    }

    #[test]
    fn test_reject_more_than_225_values() {
        let frame_str = (0..226)
            .map(|i| i.to_string())
            .collect::<Vec<_>>()
            .join(",");
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("esperados 225"));
    }

    #[test]
    fn test_reject_non_numeric_token() {
        let mut tokens = (0..224).map(|i| i.to_string()).collect::<Vec<_>>();
        tokens.push("ABC".into());
        let frame_str = tokens.join(",");
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("não numérico"));
    }

    #[test]
    fn test_reject_negative_value() {
        let mut tokens = (0..224).map(|i| i.to_string()).collect::<Vec<_>>();
        tokens.push("-10".into());
        let frame_str = tokens.join(",");
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("Valor negativo"));
    }

    #[test]
    fn test_reject_value_above_4095() {
        let mut tokens = (0..224).map(|i| i.to_string()).collect::<Vec<_>>();
        tokens.push("4096".into());
        let frame_str = tokens.join(",");
        let res = parse_csv_frame(&frame_str);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("excede o limite ADC"));
    }

    #[test]
    fn test_parse_empty_line() {
        let res = parse_csv_frame("   \r\n");
        assert!(res.is_err());
    }
}
