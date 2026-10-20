use crate::AppDb;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Visualization {
    pub gamma: f64,
    pub vmax: u32,
    pub threshold: u32,
    pub smoothing: f64,
    pub render_fps: u32,
    pub resolution: u32,
    pub mode: String,
    pub show_cop: bool,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Preferences {
    pub duration_seconds: u32,
    pub visualization: Visualization,
    pub device_type: String,
    pub selected_port: String,
    pub baud_rate: u32,
    pub theme: String,
}
impl Default for Preferences {
    fn default() -> Self {
        Self {
            duration_seconds: 30,
            visualization: Visualization {
                gamma: 1.3,
                vmax: 2200,
                threshold: 150,
                smoothing: 0.35,
                render_fps: 30,
                resolution: 300,
                mode: "MANUAL".into(),
                show_cop: true,
            },
            device_type: "SERIAL".into(),
            selected_port: String::new(),
            baud_rate: 115200,
            theme: "light".into(),
        }
    }
}
pub fn validate_visualization(v: &Visualization) -> Result<(), String> {
    if !v.gamma.is_finite()
        || !(0.5..=3.0).contains(&v.gamma)
        || !(500..=4095).contains(&v.vmax)
        || v.threshold > 1000
        || !v.smoothing.is_finite()
        || !(0.0..=1.0).contains(&v.smoothing)
        || !(10..=60).contains(&v.render_fps)
        || ![150, 300, 450].contains(&v.resolution)
        || !["AUTO", "MANUAL"].contains(&v.mode.as_str())
    {
        return Err("Configurações de visualização fora dos limites permitidos.".into());
    }
    Ok(())
}
fn validate(p: &Preferences) -> Result<(), String> {
    let v = &p.visualization;
    validate_visualization(v)?;
    if !(3..=60).contains(&p.duration_seconds)
        || !["MOCK", "SERIAL"].contains(&p.device_type.as_str())
        || p.selected_port.len() > 200
        || !(1200..=2_000_000).contains(&p.baud_rate)
        || !["light", "dark"].contains(&p.theme.as_str())
        || !v.gamma.is_finite()
        || !(0.5..=3.0).contains(&v.gamma)
        || !(500..=4095).contains(&v.vmax)
        || v.threshold > 1000
        || !v.smoothing.is_finite()
        || !(0.0..=1.0).contains(&v.smoothing)
        || !(10..=60).contains(&v.render_fps)
        || ![150, 300, 450].contains(&v.resolution)
        || !["AUTO", "MANUAL"].contains(&v.mode.as_str())
    {
        return Err("Configurações fora dos limites permitidos.".into());
    }
    Ok(())
}
pub fn get_preferences(c: &Connection) -> Result<Preferences, String> {
    let text: Option<String> = c
        .query_row(
            "SELECT value FROM settings WHERE key='app.preferences'",
            [],
            |r| r.get(0),
        )
        .optional()
        .map_err(|e| e.to_string())?;
    match text {
        Some(text) => {
            let p =
                serde_json::from_str(&text).map_err(|e| format!("Configurações inválidas: {e}"))?;
            validate(&p)?;
            Ok(p)
        }
        None => Ok(Preferences::default()),
    }
}
pub fn save_preferences(c: &Connection, p: Preferences) -> Result<(), String> {
    validate(&p)?;
    let text = serde_json::to_string(&p).map_err(|e| e.to_string())?;
    c.execute("INSERT INTO settings(key,value) VALUES('app.preferences',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[text]).map_err(|e|e.to_string())?;
    Ok(())
}
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemLog {
    pub id: i64,
    pub level: String,
    pub category: String,
    pub message: String,
    pub created_at: String,
}
pub fn add_log(c: &Connection, level: &str, category: &str, message: &str) -> Result<(), String> {
    if !["debug", "info", "warn", "error"].contains(&level)
        || category.is_empty()
        || category.len() > 80
        || message.is_empty()
        || message.len() > 2000
    {
        return Err("Registro de log inválido.".into());
    }
    c.execute(
        "INSERT INTO system_logs(level,category,message) VALUES(?1,?2,?3)",
        params![level, category, message],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}
pub fn save_preferences_for_role(
    c: &Connection,
    data: Preferences,
    role: &str,
) -> Result<(), String> {
    let previous = get_preferences(c)?;
    if role != "admin"
        && (data.device_type != previous.device_type
            || data.selected_port != previous.selected_port
            || data.baud_rate != previous.baud_rate)
    {
        return Err("Somente o administrador altera o Arduino.".into());
    }
    if role == "assistant"
        && (data.duration_seconds != previous.duration_seconds
            || serde_json::to_string(&data.visualization).map_err(|e| e.to_string())?
                != serde_json::to_string(&previous.visualization).map_err(|e| e.to_string())?)
    {
        return Err("Seu perfil não altera configurações clínicas.".into());
    }
    save_preferences(c, data)
}
#[tauri::command]
pub fn app_settings_get(db: State<AppDb>) -> Result<Preferences, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    get_preferences(&c)
}
#[tauri::command]
pub fn app_settings_save(
    db: State<AppDb>,
    auth: State<crate::auth::AuthState>,
    data: Preferences,
) -> Result<(), String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let user = crate::auth::current(&c, &auth)?;
    save_preferences_for_role(&c, data, &user.role)
}
#[tauri::command]
pub fn system_logs_add(
    db: State<AppDb>,
    level: String,
    category: String,
    message: String,
) -> Result<(), String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    add_log(&c, &level, &category, &message)
}
#[tauri::command]
pub fn system_logs_list(db: State<AppDb>, level: Option<String>) -> Result<Vec<SystemLog>, String> {
    let c = db.0.lock().map_err(|_| "Banco indisponível")?;
    let mut q=c.prepare("SELECT id,level,category,message,created_at FROM system_logs WHERE (?1 IS NULL OR level=?1) ORDER BY id DESC LIMIT 500").map_err(|e|e.to_string())?;
    let rows = q
        .query_map([level], |r| {
            Ok(SystemLog {
                id: r.get(0)?,
                level: r.get(1)?,
                category: r.get(2)?,
                message: r.get(3)?,
                created_at: r.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn hardware_default_and_explicit_simulation_preferences_are_preserved() {
        let c = Connection::open_in_memory().unwrap();
        crate::db::migrate(&c).unwrap();
        assert_eq!(get_preferences(&c).unwrap().device_type, "SERIAL");
        let mut p = Preferences::default();
        p.device_type = "MOCK".into();
        p.selected_port = "COM7".into();
        p.baud_rate = 230400;
        save_preferences(&c, p).unwrap();
        let saved = get_preferences(&c).unwrap();
        assert_eq!(saved.device_type, "MOCK");
        assert_eq!(saved.selected_port, "COM7");
        assert_eq!(saved.baud_rate, 230400);
    }
    #[test]
    fn preferences_are_persistent_and_invalid_write_preserves_previous() {
        let c = Connection::open_in_memory().unwrap();
        crate::db::migrate(&c).unwrap();
        let mut p = Preferences::default();
        p.duration_seconds = 15;
        p.visualization.gamma = 2.0;
        p.theme = "dark".into();
        save_preferences(&c, p.clone()).unwrap();
        assert_eq!(get_preferences(&c).unwrap().duration_seconds, 15);
        assert_eq!(get_preferences(&c).unwrap().visualization.gamma, 2.0);
        p.visualization.resolution = 999;
        assert!(save_preferences(&c, p).is_err());
        assert_eq!(get_preferences(&c).unwrap().visualization.resolution, 300);
    }
    #[test]
    fn logs_record_without_accepting_invalid_levels() {
        let c = Connection::open_in_memory().unwrap();
        crate::db::migrate(&c).unwrap();
        add_log(&c, "info", "exams_create", "Operação concluída.").unwrap();
        assert!(add_log(&c, "unknown", "category", "message").is_err());
        assert_eq!(
            c.query_row("SELECT COUNT(*) FROM system_logs", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
    }
}
