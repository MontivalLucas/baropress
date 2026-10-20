import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  type DeviceConfig,
  type DeviceStatus,
  type PortInfo,
  type SensorFrame,
  type TransportType,
} from "./types";
import { type SensorDevice } from "./SensorDevice";
import { publishInvalidFrame } from './rawStream';

interface BackendStatusDto {
  connected: boolean;
  acquiring: boolean;
  transport: string;
  port?: string;
  baudRate?: number;
  framesReceived: number;
  invalidFrames: number;
  fps: number;
  lastError?: string;
}

export class SerialSensorDevice implements SensorDevice {
  public readonly id = "esp32-serial-device";
  public type: TransportType = "SERIAL";

  private currentPort: string = "";
  private currentBaud: number = 115200;
  private status: DeviceStatus = {
    connected: false,
    acquiring: false,
    transport: "NONE",
    framesReceived: 0,
    invalidFrames: 0,
    fps: 0,
  };

  private frameListeners = new Set<(frame: SensorFrame) => void>();
  private errorListeners = new Set<(err: string) => void>();
  private statusListeners = new Set<(status: DeviceStatus) => void>();

  private unlistenFrame: UnlistenFn | null = null;
  private unlistenError: UnlistenFn | null = null;
  private unlistenInvalid: UnlistenFn | null = null;
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private statusRefreshInFlight = false;
  private statusGeneration = 0;

  public async connect(config?: DeviceConfig): Promise<void> {
    const port = config?.port;
    if (!port) {
      throw new Error("Porta COM não selecionada.");
    }

    const baud = config?.baudRate ?? 115200;
    this.currentPort = port;
    this.currentBaud = baud;

    const isBt =
      port.toLowerCase().includes("bluetooth") ||
      port.toLowerCase().includes("bth") ||
      port.toLowerCase().includes("esteira");

    this.type = isBt ? "BLUETOOTH" : "SERIAL";

    try {
      await invoke("acquisition_connect", { port, baudRate: baud });
      await this.setupEventListeners();
      await this.refreshStatus();
    } catch (err) {
      const msg = typeof err === "string" ? err : (err as Error).message;
      this.cleanupEventListeners();
      await invoke("acquisition_disconnect").catch(() => {});
      this.status.connected = false;
      this.status.acquiring = false;
      this.status.lastError = msg;
      this.notifyStatus();
      throw new Error(msg);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await invoke("acquisition_disconnect");
    } catch {
      // Ignora erro no disconnect
    } finally {
      this.cleanupEventListeners();
      this.status = {
        connected: false,
        acquiring: false,
        transport: "NONE",
        port: undefined,
        baudRate: undefined,
        framesReceived: 0,
        invalidFrames: 0,
        fps: 0,
      };
      this.notifyStatus();
    }
  }

  public getStatus(): DeviceStatus {
    return { ...this.status };
  }

  public async startAcquisition(): Promise<void> {
    if (!this.status.connected) {
      throw new Error("Dispositivo não está conectado.");
    }
    try {
      await invoke("acquisition_start");
      this.status.acquiring = true;
      this.notifyStatus();
    } catch (err) {
      const msg = typeof err === "string" ? err : (err as Error).message;
      this.notifyError(msg);
      throw new Error(msg);
    }
  }

  public async stopAcquisition(): Promise<void> {
    try {
      await invoke("acquisition_stop");
      this.status.acquiring = false;
      this.status.fps = 0;
      this.notifyStatus();
    } catch {
      // Ignora erro
    }
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

  public static async listAvailablePorts(): Promise<PortInfo[]> {
    try {
      const raw = await invoke<PortInfo[]>("acquisition_list_ports");
      return raw || [];
    } catch {
      return [];
    }
  }

  private async setupEventListeners(): Promise<void> {
    this.cleanupEventListeners();

    this.unlistenFrame = await listen<SensorFrame>("sensor-frame", (event) => {
      const frame = event.payload;
      this.status.framesReceived++;
      this.frameListeners.forEach((fn) => fn(frame));
    });
    this.unlistenInvalid = await listen('acquisition-invalid-frame', () => publishInvalidFrame());

    this.unlistenError = await listen<string>("acquisition-error", (event) => {
      const msg = event.payload;
      this.status.connected = false;
      this.status.acquiring = false;
      this.status.lastError = msg;
      this.notifyError(msg);
      this.notifyStatus();
    });

    // Polling leve a cada 1s para sincronizar métricas (FPS, invalidFrames) do Rust
    this.pollIntervalId = setInterval(async () => {
      if (this.status.connected) {
        await this.refreshStatus();
      }
    }, 1000);
  }

  private cleanupEventListeners(): void {
    this.statusGeneration++;
    this.statusRefreshInFlight = false;
    if (this.unlistenFrame) {
      this.unlistenFrame();
      this.unlistenFrame = null;
    }
    if (this.unlistenError) {
      this.unlistenError();
      this.unlistenError = null;
    }
    this.unlistenInvalid?.(); this.unlistenInvalid = null;
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  private async refreshStatus(): Promise<void> {
    if (this.statusRefreshInFlight) return;
    this.statusRefreshInFlight = true;
    const generation = this.statusGeneration;
    try {
      const res = await invoke<BackendStatusDto>("acquisition_get_status");
      if (generation !== this.statusGeneration) return;
      this.status = {
        connected: res.connected,
        acquiring: res.acquiring,
        transport: (res.transport as TransportType) || this.type,
        port: res.port || this.currentPort,
        baudRate: res.baudRate || this.currentBaud,
        framesReceived: res.framesReceived,
        invalidFrames: res.invalidFrames,
        fps: res.fps,
        lastError: res.lastError,
      };
      this.notifyStatus();
    } catch {
      // Ignora erro de status
    } finally {
      if (generation === this.statusGeneration) this.statusRefreshInFlight = false;
    }
  }

  private notifyStatus(): void {
    const s = this.getStatus();
    this.statusListeners.forEach((fn) => fn(s));
  }

  private notifyError(msg: string): void {
    this.errorListeners.forEach((fn) => fn(msg));
  }
}
