import { drawTrajectory } from '@/services/baropodometry/trajectory';
import type { TemporalPoint } from '@/services/examAnalysis/types';
import {
  copToCanvas,
  interpolateGrid,
  renderInterpolatedToImageData,
  type CopPoint,
  type HeatmapConfig,
} from "@/services/baropodometry";
import type { ExamDetails } from "@/types";

/**
 * Remove acentos e caracteres proibidos pelo sistema de arquivos do Windows (/ \ : * ? " < > |).
 */
export function sanitizeFileName(name: string): string {
  if (!name) return "Paciente";
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[/\\:*?"<>|]/g, "_")   // remove caracteres proibidos no Windows
    .replace(/\s+/g, "_")           // substitui espaços por underscores
    .replace(/_+/g, "_")            // remove múltiplos underscores consecutivos
    .replace(/^_+|_+$/g, "")        // remove underscores nas bordas
    .trim() || "Paciente";
}

/**
 * Gera o nome padrão do arquivo conforme Requisito 33:
 * BAROPRESS_Relatorio_{NomePaciente}_{YYYY-MM-DD}.pdf
 */
export function generateReportFileName(
  patientName: string,
  dateIsoOrFormatted?: string | null
): string {
  const safeName = sanitizeFileName(patientName);
  let dateStr = new Date().toISOString().slice(0, 10);

  if (dateIsoOrFormatted) {
    const d = new Date(dateIsoOrFormatted);
    if (!Number.isNaN(d.getTime())) {
      dateStr = d.toISOString().slice(0, 10);
    }
  }

  return `BAROPRESS_Relatorio_${safeName}_${dateStr}.pdf`;
}

export interface ExamValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validação prévia de integridade conforme Requisito 34.
 */
export function validateExamForReport(
  exam: ExamDetails | null | undefined
): ExamValidationResult {
  if (!exam) {
    return {
      valid: false,
      error: "Este exame não possui dados suficientes para gerar um relatório.",
    };
  }

  if (!exam.id || exam.id <= 0) {
    return {
      valid: false,
      error: "Identificador do exame inválido.",
    };
  }

  if (!exam.patientId || exam.patientId <= 0) {
    return {
      valid: false,
      error: "Paciente não vinculado ao exame.",
    };
  }

  if (!exam.matrix || exam.matrix.length !== 225 || exam.matrix.some((v) => !Number.isFinite(v) || v < 0 || v > 4095)) {
    return {
      valid: false,
      error: `A matriz de pressão deve conter exatamente 225 sensores (recebidos: ${exam.matrix ? exam.matrix.length : 0}).`,
    };
  }

  if (
    exam.maxPressure === null ||
    exam.maxPressure === undefined ||
    !Number.isFinite(exam.maxPressure)
  ) {
    return {
      valid: false,
      error: "Métricas do exame ausentes ou com valores inválidos.",
    };
  }

  return { valid: true };
}

/**
 * Renderiza o mapa de pressão contínuo em alta resolução para uma imagem PNG (Data URL).
 * Reutiliza os exatos algoritmos de interpolação bicúbica (Catmull-Rom), LUT e CoP da Fase 4.
 */
export function renderHeatmapToDataUrl(
  matrix: number[],
  config: HeatmapConfig,
  cop: CopPoint | null,
  size = 600,
  trajectory?: readonly TemporalPoint[],
  trajectoryGapMs?: number
): string {
  if (typeof document === "undefined") {
    return "";
  }

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "";

  // 1. Fundo profissional médico escuro (reutilizando a estética oficial da Fase 4)
  ctx.fillStyle = "#0a0f1d";
  ctx.fillRect(0, 0, size, size);

  // 2. Interpolação bicúbica contínua da matriz 15x15
  const interpolated = interpolateGrid(matrix, size, size, config.smoothing ?? 0.35);
  const imgData = ctx.createImageData(size, size);
  renderInterpolatedToImageData(interpolated, size, size, config, imgData);
  ctx.putImageData(imgData, 0, 0);

  // 3. Indicadores sutis de orientação anatômica
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("ANTERIOR / SUPERIOR", size / 2, 10);

  ctx.textBaseline = "bottom";
  ctx.fillText("POSTERIOR / INFERIOR", size / 2, size - 10);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("ESQ (E)", 12, size / 2);

  ctx.textAlign = "right";
  ctx.fillText("DIR (D)", size - 12, size / 2);

  if (trajectory) drawTrajectory(ctx, trajectory, size, size, trajectoryGapMs);

  // 4. Marcador de CoP (se presente e ativo)
  if (config.showCop !== false && cop) {
    const copPos = copToCanvas(cop, size, size);

    ctx.save();
    ctx.translate(copPos.x, copPos.y);

    // Círculo externo
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Retículo
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(7, 0);
    ctx.moveTo(0, -7);
    ctx.lineTo(0, 7);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ponto focal central âmbar
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();

    // Badge "CoP"
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.beginPath();
    ctx.roundRect(12, -12, 34, 18, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CoP", 29, -3);

    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}
