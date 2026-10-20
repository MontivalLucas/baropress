import { calculateMetrics, type BaropodometricMetrics, type HeatmapSettings } from "@/services/baropodometry";
import type { ExamInput } from "@/types";

export const EXAM_SENSOR_COUNT = 225;

/**
 * Calcula a matriz média temporal de uma sequência de quadros estáticos coletados na memória.
 * Respeita a regra de 225 sensores e valores não-negativos.
 */
export function computeAverageMatrix(frames: number[][]): number[] {
  if (frames.length === 0) {
    return new Array(EXAM_SENSOR_COUNT).fill(0);
  }

  const avg = new Array<number>(EXAM_SENSOR_COUNT).fill(0);

  for (const frame of frames) {
    if (frame.length !== EXAM_SENSOR_COUNT) continue;
    for (let i = 0; i < EXAM_SENSOR_COUNT; i++) {
      avg[i] += frame[i] || 0;
    }
  }

  const validFrameCount = frames.filter((f) => f.length === EXAM_SENSOR_COUNT).length || 1;

  for (let i = 0; i < EXAM_SENSOR_COUNT; i++) {
    // Arredonda para 1 casa decimal relativa
    avg[i] = Math.max(0, Math.round((avg[i] / validFrameCount) * 10) / 10);
  }

  return avg;
}

export interface ProcessExamParams {
  patientId: number;
  frames: number[][];
  frameTimestampsMs?: number[];
  durationSeconds: number;
  fps: number;
  settings: HeatmapSettings;
  tareApplied: boolean;
  source: "REAL" | "SIMULATION";
  startedAt?: string;
  notes?: string;
}

export interface ProcessExamResult {
  averageMatrix: number[];
  metrics: BaropodometricMetrics;
  examInput: ExamInput;
}

/**
 * Processa a janela de quadros coletada no exame estático, gerando a matriz média
 * e o payload completo pronto para persistência no SQLite.
 */
export function processExamSample(params: ProcessExamParams): ProcessExamResult {
  const {
    patientId,
    frames,
    durationSeconds,
    fps,
    settings,
    tareApplied,
    source,
    startedAt,
    notes,
  } = params;

  const averageMatrix = computeAverageMatrix(frames);
  const metrics = calculateMetrics(averageMatrix, settings.threshold);

  const examInput: ExamInput = {
    copTrajectory: frames.flatMap((frame, index) => {
      if (frame.length !== EXAM_SENSOR_COUNT) return [];
      const cop = calculateMetrics(frame, settings.threshold).cop;
      return cop ? [{ timestampMs: params.frameTimestampsMs?.[index] ?? Math.round(index * durationSeconds * 1000 / frames.length), ...cop }] : [];
    }),
    visualizationSettings: { ...settings },
    patientId,
    type: "static",
    source,
    status: "completed",
    startedAt: startedAt || new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    duration: Math.max(0, durationSeconds),
    frameCount: frames.length,
    fps: Math.max(0, fps),
    threshold: settings.threshold,
    vmax: settings.vmax,
    gamma: settings.gamma,
    smoothing: settings.smoothing,
    tareApplied,
    matrix: averageMatrix,
    maxPressure: metrics.maxPressure,
    meanPressure: metrics.meanPressure,
    contactAreaPercent: metrics.contactPercentage,
    contactSensors: metrics.contactSensorCount,
    copX: metrics.cop ? metrics.cop.x : null,
    copY: metrics.cop ? metrics.cop.y : null,
    leftLoad: metrics.leftLoad,
    rightLoad: metrics.rightLoad,
    leftPercent: metrics.leftPercentage,
    rightPercent: metrics.rightPercentage,
    notes: notes || null,
  };

  return {
    averageMatrix,
    metrics,
    examInput,
  };
}
