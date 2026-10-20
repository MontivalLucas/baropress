import {
  SENSOR_CONFIG,
  type DeviceConfig,
  type DeviceStatus,
  type MockPattern,
  type SensorFrame,
} from "./types";
import { type SensorDevice } from "./SensorDevice";

export class MockSensorDevice implements SensorDevice {
  public readonly id = "mock-sensor-15x15";
  public readonly type = "MOCK" as const;

  private connected = false;
  private acquiring = false;
  private pattern: MockPattern = "center";
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private sequence = 0;
  private framesReceived = 0;
  private invalidFrames = 0;
  private fps = 0;
  private lastFpsTime = Date.now();
  private fpsFrameCount = 0;

  private frameListeners = new Set<(frame: SensorFrame) => void>();
  private errorListeners = new Set<(err: string) => void>();
  private statusListeners = new Set<(status: DeviceStatus) => void>();

  constructor(initialPattern: MockPattern = "center") {
    this.pattern = initialPattern;
  }

  public setPattern(pattern: MockPattern): void {
    this.pattern = pattern;
  }

  public async connect(config?: DeviceConfig): Promise<void> {
    if (this.connected) return;
    if (config?.mockPattern) {
      this.pattern = config.mockPattern;
    }
    this.connected = true;
    this.framesReceived = 0;
    this.invalidFrames = 0;
    this.sequence = 0;
    this.notifyStatus();
  }

  public async disconnect(): Promise<void> {
    await this.stopAcquisition();
    this.connected = false;
    this.notifyStatus();
  }

  public getStatus(): DeviceStatus {
    return {
      connected: this.connected,
      acquiring: this.acquiring,
      transport: "MOCK",
      deviceName: "Simulador ESP32 15x15",
      baudRate: 115200,
      framesReceived: this.framesReceived,
      invalidFrames: this.invalidFrames,
      fps: this.fps,
    };
  }

  public async startAcquisition(): Promise<void> {
    if (!this.connected) {
      throw new Error("Simulador não está conectado.");
    }
    if (this.acquiring) return;

    this.acquiring = true;
    this.lastFpsTime = Date.now();
    this.fpsFrameCount = 0;

    // ~30 FPS -> intervalo de 33 ms
    this.intervalId = setInterval(() => {
      this.generateFrame();
    }, 33);

    this.notifyStatus();
  }

  public async stopAcquisition(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.acquiring = false;
    this.fps = 0;
    this.notifyStatus();
  }

  public onFrame(callback: (frame: SensorFrame) => void): () => void {
    this.frameListeners.add(callback);
    return () => this.frameListeners.delete(callback);
  }

  public onError(callback: (error: string) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  public onStatusChange(callback: (status: DeviceStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus(): void {
    const s = this.getStatus();
    this.statusListeners.forEach((fn) => fn(s));
  }

  private generateFrame(): void {
    this.sequence++;
    this.framesReceived++;
    this.fpsFrameCount++;

    const now = Date.now();
    const elapsed = now - this.lastFpsTime;
    if (elapsed >= 1000) {
      this.fps = Math.round((this.fpsFrameCount / (elapsed / 1000)) * 10) / 10;
      this.fpsFrameCount = 0;
      this.lastFpsTime = now;
      this.notifyStatus();
    }

    const values = this.generatePatternValues(this.pattern, this.sequence);

    const frame: SensorFrame = {
      timestamp: now,
      sequence: this.sequence,
      values,
      source: "SIMULATION",
    };

    this.frameListeners.forEach((fn) => fn(frame));
  }

  /**
   * Gera exatamente 225 valores (0 a 4095) conforme o padrão selecionado.
   */
  public generatePatternValues(pattern: MockPattern, step = 0): number[] {
    const total = SENSOR_CONFIG.sensorCount;
    const values = new Array<number>(total);
    const rows = SENSOR_CONFIG.rows;
    const cols = SENSOR_CONFIG.columns;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        let val = 0;

        switch (pattern) {
          case "uniform": {
            val = 1500;
            break;
          }
          case "center": {
            // Pico centralizado em (7, 7)
            const dr = r - 7;
            const dc = c - 7;
            const distSq = dr * dr + dc * dc;
            val = Math.max(0, Math.round(3400 * Math.exp(-distSq / 12)));
            break;
          }
          case "left": {
            // Pico nas colunas esquerdas (cols 0-6), centrado em col 3, row 7
            const dr = r - 7;
            const dc = c - 3;
            const distSq = dr * dr + dc * dc * 1.5;
            val = Math.max(0, Math.round(3200 * Math.exp(-distSq / 10)));
            break;
          }
          case "right": {
            // Pico nas colunas direitas (cols 8-14), centrado em col 11, row 7
            const dr = r - 7;
            const dc = c - 11;
            const distSq = dr * dr + dc * dc * 1.5;
            val = Math.max(0, Math.round(3200 * Math.exp(-distSq / 10)));
            break;
          }
          case "both": {
            // Dois pés simultâneos (esquerdo col 3 + direito col 11)
            const drL = r - 7;
            const dcL = c - 3;
            const distSqL = drL * drL + dcL * dcL * 1.5;
            const valL = Math.max(0, Math.round(3000 * Math.exp(-distSqL / 10)));

            const drR = r - 7;
            const dcR = c - 11;
            const distSqR = drR * drR + dcR * dcR * 1.5;
            const valR = Math.max(0, Math.round(3000 * Math.exp(-distSqR / 10)));

            val = Math.max(valL, valR);
            break;
          }
          case "dynamic": {
            // Onda ou centro oscilante simulando deslocamento de peso
            const phase = step * 0.1;
            const centerR = 7 + 3 * Math.sin(phase);
            const centerC = 7 + 4 * Math.cos(phase);
            const dr = r - centerR;
            const dc = c - centerC;
            const distSq = dr * dr + dc * dc;
            val = Math.max(0, Math.round(3300 * Math.exp(-distSq / 10)));
            break;
          }
        }


        // Ruído leve simulando ruído elétrico real (±15 ADC)
        const noise = Math.floor((Math.random() - 0.5) * 30);
        val = Math.min(4095, Math.max(0, val + noise));
        values[idx] = val;
      }
    }

    return values;
  }
}
