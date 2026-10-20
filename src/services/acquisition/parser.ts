import { SENSOR_CONFIG, type SensorFrame, type FrameSource } from "./types";

/**
 * Valida e converte uma linha CSV de texto em um SensorFrame com 225 valores.
 * Rejeita frames com mais/menos de 225 valores, valores não numéricos, negativos ou > 4095.
 */
export function parseSensorFrame(
  line: string,
  sequence?: number,
  source: FrameSource = "REAL"
): SensorFrame {
  const trimmed = line.trim();
  if (!trimmed) {
    throw new Error("Linha de dados vazia.");
  }

  const parts = trimmed.split(",");
  if (parts.length !== SENSOR_CONFIG.sensorCount) {
    throw new Error(
      `Quantidade inválida de sensores: esperados ${SENSOR_CONFIG.sensorCount}, recebidos ${parts.length}.`
    );
  }

  const values = new Array<number>(SENSOR_CONFIG.sensorCount);

  for (let i = 0; i < parts.length; i++) {
    const raw = parts[i].trim();
    if (raw === "") {
      throw new Error(`Sensor ${i + 1} contém valor vazio.`);
    }

    const num = Number(raw);
    if (!Number.isInteger(num)) {
      throw new Error(`Sensor ${i + 1} com valor não inteiro: '${raw}'.`);
    }

    if (num < SENSOR_CONFIG.adcMin) {
      throw new Error(
        `Sensor ${i + 1} com valor negativo (${num}) abaixo do mínimo (${SENSOR_CONFIG.adcMin}).`
      );
    }

    if (num > SENSOR_CONFIG.adcMax) {
      throw new Error(
        `Sensor ${i + 1} com valor (${num}) acima do limite máximo ADC (${SENSOR_CONFIG.adcMax}).`
      );
    }

    values[i] = num;
  }

  return {
    timestamp: Date.now(),
    sequence,
    values,
    source,
  };
}

/**
 * Normaliza a orientação espacial da matriz 15x15.
 * O hardware físico do projeto possui espelhamento horizontal (fliplr)
 * devido à montagem física dos multiplexadores em relação à vista plantar.
 * Esta função isola completamente essa transformação geométrica.
 */
export function normalizeMatrixOrientation(
  values: number[],
  rows = SENSOR_CONFIG.rows,
  cols = SENSOR_CONFIG.columns
): number[] {
  if (values.length !== rows * cols) {
    return values;
  }

  const normalized = new Array<number>(values.length);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const srcIdx = r * cols + c;
      // Espelhamento horizontal das colunas: c -> (cols - 1 - c)
      const targetCol = cols - 1 - c;
      const destIdx = r * cols + targetCol;
      normalized[destIdx] = values[srcIdx];
    }
  }

  return normalized;
}

/**
 * Aplica o baseline de tara aos valores brutos do sensor:
 * corrected[i] = max(0, raw[i] - baseline[i])
 */
export function applyTare(
  rawValues: number[],
  baseline: number[] | null,
  active: boolean
): number[] {
  if (!active || !baseline || baseline.length !== rawValues.length) {
    return rawValues;
  }

  const out = new Array<number>(rawValues.length);
  for (let i = 0; i < rawValues.length; i++) {
    const b = baseline[i] ?? 0;
    out[i] = Math.max(0, rawValues[i] - b);
  }
  return out;
}

/**
 * Calcula o índice linear no vetor de 225 a partir da linha e coluna (0 a 14).
 */
export function matrixIndex(row: number, col: number, cols = SENSOR_CONFIG.columns): number {
  return row * cols + col;
}

/**
 * Retorna as coordenadas {row, col} a partir do índice linear (0 a 224).
 */
export function getMatrixCoords(index: number, cols = SENSOR_CONFIG.columns): { row: number; col: number } {
  return {
    row: Math.floor(index / cols),
    col: index % cols,
  };
}
