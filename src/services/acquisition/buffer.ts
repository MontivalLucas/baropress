import { type SensorFrame } from "./types";

export class FrameBuffer {
  private buffer: SensorFrame[];
  private capacity: number;
  private head: number = 0;
  private count: number = 0;
  private latest: SensorFrame | null = null;

  // Rastreamento de FPS por janela móvel de timestamps
  private timestamps: number[] = [];

  constructor(capacity = 120) {
    this.capacity = capacity;
    this.buffer = new Array<SensorFrame>(capacity);
  }

  /**
   * Adiciona um frame validado ao buffer.
   */
  public push(frame: SensorFrame): void {
    this.buffer[this.head] = frame;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
    this.latest = frame;

    const now = frame.timestamp || Date.now();
    this.timestamps.push(now);

    // Mantém somente timestamps dos últimos 1000ms para cálculo preciso de FPS
    const threshold = now - 1000;
    while (this.timestamps.length > 0 && this.timestamps[0] < threshold) {
      this.timestamps.shift();
    }
  }

  /**
   * Retorna o frame mais recente disponível em memória.
   */
  public getLatest(): SensorFrame | null {
    return this.latest;
  }

  /**
   * Retorna os últimos N frames armazenados.
   */
  public getRecent(limit = 30): SensorFrame[] {
    const n = Math.min(limit, this.count);
    const result: SensorFrame[] = [];
    let idx = (this.head - 1 + this.capacity) % this.capacity;
    for (let i = 0; i < n; i++) {
      result.push(this.buffer[idx]);
      idx = (idx - 1 + this.capacity) % this.capacity;
    }
    return result;
  }

  /**
   * Retorna a taxa instantânea de frames por segundo (FPS) recebidos.
   */
  public getFPS(): number {
    const now = Date.now();
    const threshold = now - 1000;
    while (this.timestamps.length > 0 && this.timestamps[0] < threshold) {
      this.timestamps.shift();
    }

    if (this.timestamps.length < 2) {
      return this.timestamps.length;
    }

    const durationSec = (this.timestamps[this.timestamps.length - 1] - this.timestamps[0]) / 1000;
    if (durationSec <= 0) return this.timestamps.length;

    const fps = (this.timestamps.length - 1) / durationSec;
    return Math.round(fps * 10) / 10;
  }

  /**
   * Limpa o buffer interno.
   */
  public clear(): void {
    this.head = 0;
    this.count = 0;
    this.latest = null;
    this.timestamps = [];
  }

  public size(): number {
    return this.count;
  }
}
