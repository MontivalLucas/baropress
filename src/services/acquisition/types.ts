export type TransportType = "SERIAL" | "BLUETOOTH" | "MOCK" | "NONE";
export type FrameSource = "REAL" | "SIMULATION";
export type MockPattern = "uniform" | "center" | "left" | "right" | "both" | "dynamic";

export interface SensorConfig {
  readonly rows: number;
  readonly columns: number;
  readonly sensorCount: number;
  readonly adcMin: number;
  readonly adcMax: number;
  readonly defaultBaudRate: number;
}

export const SENSOR_CONFIG: SensorConfig = {
  rows: 15,
  columns: 15,
  sensorCount: 225,
  adcMin: 0,
  adcMax: 4095,
  defaultBaudRate: 115200,
};

export interface SensorFrame {
  timestamp: number;
  values: number[]; // Deve conter exatamente 225 valores (0 a 4095)
  sequence?: number;
  source: FrameSource;
}

export interface DeviceStatus {
  connected: boolean;
  acquiring: boolean;
  transport: TransportType;
  port?: string;
  deviceName?: string;
  baudRate?: number;
  framesReceived: number;
  invalidFrames: number;
  fps: number;
  lastError?: string;
}

export interface PortInfo {
  name: string;
  description?: string;
  manufacturer?: string;
  product?: string;
  isBluetooth: boolean;
}

export interface DeviceConfig {
  port?: string;
  baudRate?: number;
  mockPattern?: MockPattern;
}

export interface TareState {
  baseline: number[] | null; // 225 valores
  active: boolean;
  isZeroing: boolean;
  zeroingProgress: number; // 0 a 100
  message: string | null;
}

export interface AcquisitionLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
}
