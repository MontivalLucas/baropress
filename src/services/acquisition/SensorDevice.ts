import {
  type DeviceConfig,
  type DeviceStatus,
  type SensorFrame,
  type TransportType,
} from "./types";

export interface SensorDevice {
  readonly id: string;
  readonly type: TransportType;

  connect(config?: DeviceConfig): Promise<void>;
  disconnect(): Promise<void>;

  getStatus(): DeviceStatus;

  startAcquisition(): Promise<void>;
  stopAcquisition(): Promise<void>;

  onFrame(callback: (frame: SensorFrame) => void): () => void;
  onError(callback: (error: string) => void): () => void;
  onStatusChange(callback: (status: DeviceStatus) => void): () => void;
}
