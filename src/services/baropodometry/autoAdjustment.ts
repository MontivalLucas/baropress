import { type HeatmapSettings } from "./types";
import { clampValue, SETTINGS_LIMITS } from "./settings";

export interface TemporalAutoState {
  smoothedVmax: number;
  smoothedThreshold: number;
}

/**
 * Calcula um percentil específico (ex: 0.95 ou 0.98) de uma lista ordenada de números.
 */
export function computePercentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const idx = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor(p * (sortedValues.length - 1)))
  );
  return sortedValues[idx];
}

/**
 * Calcula os parâmetros adaptativos automáticos baseados na distribuição de pressão atual.
 *
 * Princípios do Modo Automático (Fase 4.1):
 * 1. Robustez contra picos isolados: utiliza P95/P98 dos sensels em contato ativo,
 *    evitando que um único sensor ruidoso sature toda a escala.
 * 2. Estabilidade temporal (Flicker-Free): utiliza filtro exponencial (EMA) com
 *    80% peso histórico e 20% novo valor, garantindo transição suave e sem tremulações.
 * 3. Margens de segurança: limites de saturação protegidos entre 800 e 3800 ADC.
 * 4. Gamma mantido em 1.30 e Suavização em 0.35 para preservar fidelidade morfológica.
 */
export function computeAutoParameters(
  values: number[],
  current: HeatmapSettings,
  temporalState: TemporalAutoState = {
    smoothedVmax: current.vmax,
    smoothedThreshold: current.threshold,
  }
): { settings: Partial<HeatmapSettings>; nextState: TemporalAutoState } {
  // 1. Isola os valores dos sensores com leitura significativa (> 80 ADC)
  const activeValues: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v > 80) {
      activeValues.push(v);
    }
  }

  activeValues.sort((a, b) => a - b);

  let targetVmax = current.vmax;
  let targetThreshold = current.threshold;

  if (activeValues.length >= 3) {
    // Calcula P95 e P98 dos sensores ativos
    const p95 = computePercentile(activeValues, 0.95);
    const p98 = computePercentile(activeValues, 0.98);

    // Margem de folga de 15% acima do P95 para evitar saturação excessiva em vermelho
    const estimatedVmax = Math.max(p98, p95 * 1.15);

    // Limites de segurança do modo automático
    targetVmax = clampValue(estimatedVmax, 800, 3600);

    // Auto threshold adaptativo suave: ~15% do P95 dos ativos, delimitado entre 100 e 220 ADC
    const estimatedThreshold = clampValue(Math.round(p95 * 0.15), 100, 220);
    targetThreshold = estimatedThreshold;
  } else {
    // Sem carga suficiente: converge suavemente para valores de repouso confortáveis
    targetVmax = 2200;
    targetThreshold = 150;
  }

  // 2. Filtro Temporal Exponencial (EMA)
  // Vmax_t = 0.80 * Vmax_{t-1} + 0.20 * Vmax_target
  const alphaVmax = 0.2;
  const newSmoothedVmax = Math.round(
    (1 - alphaVmax) * temporalState.smoothedVmax + alphaVmax * targetVmax
  );

  // Threshold_t = 0.85 * Threshold_{t-1} + 0.15 * Threshold_target
  const alphaThresh = 0.15;
  const newSmoothedThreshold = Math.round(
    (1 - alphaThresh) * temporalState.smoothedThreshold + alphaThresh * targetThreshold
  );

  const finalVmax = clampValue(
    newSmoothedVmax,
    SETTINGS_LIMITS.vmax.min,
    SETTINGS_LIMITS.vmax.max
  );
  const finalThreshold = clampValue(
    newSmoothedThreshold,
    SETTINGS_LIMITS.threshold.min,
    SETTINGS_LIMITS.threshold.max
  );

  return {
    settings: {
      vmax: finalVmax,
      threshold: finalThreshold,
      gamma: 1.3,
      smoothing: 0.35,
    },
    nextState: {
      smoothedVmax: finalVmax,
      smoothedThreshold: finalThreshold,
    },
  };
}
