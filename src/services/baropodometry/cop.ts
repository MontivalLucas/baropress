import { type CopPoint } from "./types";

const GRID_SIZE = 15;

/**
 * Calcula o Centro de Pressão (CoP) da matriz 15x15:
 * COPx = Σ(x × P) / ΣP
 * COPy = Σ(y × P) / ΣP
 * onde P é a pressão acima do threshold.
 * Se ΣP <= 0, retorna null (nenhuma carga detectada).
 */
export function calculateCop(values: number[], threshold: number): CopPoint | null {
  if (values.length !== GRID_SIZE * GRID_SIZE) {
    return null;
  }

  let sumP = 0;
  let sumXP = 0;
  let sumYP = 0;

  for (let i = 0; i < values.length; i++) {
    const p = values[i];
    if (p >= threshold) {
      const x = i % GRID_SIZE; // Coluna (0 a 14)
      const y = Math.floor(i / GRID_SIZE); // Linha (0 a 14)

      sumP += p;
      sumXP += x * p;
      sumYP += y * p;
    }
  }

  if (sumP <= 0) {
    return null;
  }

  return {
    x: sumXP / sumP,
    y: sumYP / sumP,
  };
}

/**
 * Converte as coordenadas contínuas de matriz do CoP (0..14) para coordenadas em pixels do Canvas.
 * Considera que o centro de cada célula da matriz 15x15 está localizado em (x + 0.5) / 15.
 */
export function copToCanvas(
  cop: CopPoint,
  canvasWidth: number,
  canvasHeight: number,
  padding = 0
): { x: number; y: number } {
  const usableW = Math.max(1, canvasWidth - padding * 2);
  const usableH = Math.max(1, canvasHeight - padding * 2);

  const normX = (cop.x + 0.5) / GRID_SIZE;
  const normY = (cop.y + 0.5) / GRID_SIZE;

  return {
    x: padding + normX * usableW,
    y: padding + normY * usableH,
  };
}
