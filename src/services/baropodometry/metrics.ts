import { calculateCop } from "./cop";
import { type BaropodometricMetrics } from "./types";

const SENSOR_COUNT = 225;
const GRID_COLS = 15;

/**
 * Calcula todas as métricas baropodométricas relativas a partir dos 225 valores corrigidos.
 * Requisito estrito: Não inventa unidades físicas (kg, N, kgf/cm²). Todas as métricas são expressas
 * em valores ADC relativos, contagem de sensels e porcentagens.
 */
export function calculateMetrics(
  values: number[],
  threshold: number
): BaropodometricMetrics {
  let maxPressure = 0;
  let totalPressure = 0;
  let contactSensorCount = 0;

  let leftLoad = 0;
  let rightLoad = 0;

  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val >= threshold) {
      contactSensorCount++;
      totalPressure += val;

      if (val > maxPressure) {
        maxPressure = val;
      }

      const col = i % GRID_COLS;
      if (col <= 6) {
        // Metade esquerda (colunas 0 a 6)
        leftLoad += val;
      } else if (col >= 8) {
        // Metade direita (colunas 8 a 14)
        rightLoad += val;
      }
      // Coluna 7 é a linha média sagital / centro
    }
  }

  const contactPercentage =
    SENSOR_COUNT > 0
      ? Math.round((contactSensorCount / SENSOR_COUNT) * 1000) / 10
      : 0;

  const meanPressure =
    contactSensorCount > 0
      ? Math.round((totalPressure / contactSensorCount) * 10) / 10
      : null;

  const totalLr = leftLoad + rightLoad;
  let leftPercentage: number | null = null;
  let rightPercentage: number | null = null;

  if (totalLr > 0) {
    leftPercentage = Math.round((leftLoad / totalLr) * 1000) / 10;
    rightPercentage = Math.round((rightLoad / totalLr) * 1000) / 10;
  }

  const cop = calculateCop(values, threshold);

  return {
    maxPressure,
    meanPressure,
    totalPressure,
    contactSensorCount,
    contactPercentage,
    leftLoad,
    rightLoad,
    leftPercentage,
    rightPercentage,
    cop,
  };
}
