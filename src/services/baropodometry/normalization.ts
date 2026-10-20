/**
 * Normaliza o valor corrigido pelo vmax configurado, limitando no intervalo [0, 1].
 */
export function normalizeValue(value: number, vmax: number): number {
  if (vmax <= 0) return 0;
  if (value <= 0) return 0;
  const ratio = value / vmax;
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Aplica transformação de gamma para ajuste de contraste visual da escala de calor.
 * Fórmula: visual = normalized ^ gamma, garantindo resultado estritamente em [0, 1].
 */
export function applyGamma(normalized: number, gamma: number): number {
  if (normalized <= 0) return 0;
  if (normalized >= 1) return 1;
  if (gamma <= 0) return normalized;
  const val = Math.pow(normalized, gamma);
  return Math.min(1, Math.max(0, val));
}

/**
 * Aplica corte de threshold estrito.
 * Valores abaixo do limiar retornam 0 (sem contato).
 */
export function applyThreshold(value: number, threshold: number): number {
  return value >= threshold ? value : 0;
}

/**
 * Calcula fator de opacidade suave (0.0 a 1.0) ao redor do threshold
 * para evitar bordas visuais serrilhadas ou cortes artificiais bruscos.
 */
export function smoothThresholdAlpha(
  value: number,
  threshold: number,
  transitionWidth = 50
): number {
  if (value <= threshold - transitionWidth) {
    return 0;
  }
  if (value >= threshold + transitionWidth) {
    return 1;
  }

  // Interpolação cúbica suave (Smoothstep) no intervalo da transição
  const t = (value - (threshold - transitionWidth)) / (2 * transitionWidth);
  return t * t * (3 - 2 * t);
}
