import { SENSOR_CONFIG, type SensorFrame, type TareState } from "./types";

export class TareManager {
  private baseline: number[] | null = null;
  private active: boolean = false;
  private isZeroing: boolean = false;
  private collectedFrames: number[][] = [];
  private targetFrames: number = 20;
  private message: string | null = null;

  public getState(): TareState {
    const progress = this.isZeroing
      ? Math.min(100, Math.round((this.collectedFrames.length / this.targetFrames) * 100))
      : 0;

    return {
      baseline: this.baseline ? [...this.baseline] : null,
      active: this.active,
      isZeroing: this.isZeroing,
      zeroingProgress: progress,
      message: this.message,
    };
  }

  /**
   * Inicia a coleta de amostras para zeramento da tara.
   */
  public startZeroing(targetFrames = 20): void {
    this.targetFrames = Math.max(5, targetFrames);
    this.collectedFrames = [];
    this.isZeroing = true;
    this.message = "Calibrando zero: mantenha a plataforma sem carga...";
  }

  /**
   * Alimenta um frame para o procedimento de zeramento.
   * Retorna true quando o zeramento foi concluído.
   */
  public feedFrame(frame: SensorFrame): boolean {
    if (!this.isZeroing) return false;

    this.collectedFrames.push([...frame.values]);

    if (this.collectedFrames.length >= this.targetFrames) {
      this.finalizeZeroing();
      return true;
    }
    return false;
  }

  private finalizeZeroing(): void {
    const n = this.collectedFrames.length;
    if (n === 0) {
      this.isZeroing = false;
      this.message = "Falha ao zerar tara: nenhum frame recebido.";
      return;
    }

    const baseline = new Array<number>(SENSOR_CONFIG.sensorCount).fill(0);
    let maxOffset = 0;

    for (let s = 0; s < SENSOR_CONFIG.sensorCount; s++) {
      let sum = 0;
      for (let f = 0; f < n; f++) {
        sum += this.collectedFrames[f][s];
      }
      const avg = Math.round(sum / n);
      baseline[s] = avg;
      if (avg > maxOffset) maxOffset = avg;
    }

    this.baseline = baseline;
    this.active = true;
    this.isZeroing = false;
    this.collectedFrames = [];

    if (maxOffset > 1500) {
      this.message = `Tara realizada com sucesso (Aviso: offset alto de ${maxOffset} ADC detectado; certifique-se de que não havia peso sobre a plataforma).`;
    } else {
      this.message = "Tara realizada com sucesso.";
    }
  }

  public setActive(active: boolean): void {
    this.active = active;
  }

  public clearBaseline(): void {
    this.baseline = null;
    this.active = false;
    this.message = "Tara desativada e baseline removido.";
  }

  public setBaseline(baseline: number[]): void {
    if (baseline.length === SENSOR_CONFIG.sensorCount) {
      this.baseline = [...baseline];
      this.active = true;
      this.message = "Baseline de tara definido.";
    }
  }
}
