import {
  type HeatmapSettings,
  DEFAULT_HEATMAP_SETTINGS,
} from "./types";

export const SETTINGS_LIMITS = {
  gamma: { min: 0.5, max: 3.0, step: 0.05, default: 1.3 },
  vmax: { min: 500, max: 4095, step: 50, default: 2200 },
  threshold: { min: 0, max: 1000, step: 10, default: 150 },
  smoothing: { min: 0.0, max: 1.0, step: 0.05, default: 0.35 },
  renderFps: { min: 10, max: 60, step: 1, default: 30 },
  resolution: { min: 150, max: 450, step: 150, default: 300 },
} as const;

export const RESOLUTION_PRESETS = [
  { value: 150, label: "150×150", name: "Baixa" },
  { value: 300, label: "300×300", name: "Média (Padrão)" },
  { value: 450, label: "450×450", name: "Alta" },
] as const;

/**
 * Garante que um valor numérico permaneça estritamente dentro dos limites definidos.
 */
export function clampValue(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Sanitiza e valida um objeto parcial de configurações, garantindo que
 * nenhum parâmetro ultrapasse as faixas seguras do sistema.
 */
export function sanitizeSettings(
  partial: Partial<HeatmapSettings>,
  current: HeatmapSettings = DEFAULT_HEATMAP_SETTINGS
): HeatmapSettings {
  return {
    gamma:
      partial.gamma !== undefined
        ? clampValue(partial.gamma, SETTINGS_LIMITS.gamma.min, SETTINGS_LIMITS.gamma.max)
        : current.gamma,
    vmax:
      partial.vmax !== undefined
        ? Math.round(clampValue(partial.vmax, SETTINGS_LIMITS.vmax.min, SETTINGS_LIMITS.vmax.max))
        : current.vmax,
    threshold:
      partial.threshold !== undefined
        ? Math.round(
            clampValue(partial.threshold, SETTINGS_LIMITS.threshold.min, SETTINGS_LIMITS.threshold.max)
          )
        : current.threshold,
    smoothing:
      partial.smoothing !== undefined
        ? clampValue(partial.smoothing, SETTINGS_LIMITS.smoothing.min, SETTINGS_LIMITS.smoothing.max)
        : current.smoothing,
    renderFps:
      partial.renderFps !== undefined
        ? Math.round(
            clampValue(partial.renderFps, SETTINGS_LIMITS.renderFps.min, SETTINGS_LIMITS.renderFps.max)
          )
        : current.renderFps,
    resolution:
      partial.resolution !== undefined
        ? Math.round(
            clampValue(
              partial.resolution,
              SETTINGS_LIMITS.resolution.min,
              SETTINGS_LIMITS.resolution.max
            )
          )
        : current.resolution,
    mode: partial.mode !== undefined ? partial.mode : current.mode,
    showCop: partial.showCop !== undefined ? partial.showCop : current.showCop,
  };
}

/**
 * Retorna as configurações padrão do sistema.
 */
export function resetSettings(): HeatmapSettings {
  return { ...DEFAULT_HEATMAP_SETTINGS };
}

/** Escala visual com pico em contato, sem alterar o limiar ou as métricas. */
export function fitVmaxToValues(values: number[], threshold: number): number | null {
  const contact = values.filter((value) => Number.isFinite(value) && value >= threshold && value > 0);
  if (contact.length === 0) return null;
  const peak = contact.reduce((max, value) => Math.max(max, value), 0);
  const { min, max, step } = SETTINGS_LIMITS.vmax;
  return clampValue(Math.ceil(peak / step) * step, min, max);
}
