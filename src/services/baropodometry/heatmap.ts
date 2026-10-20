import { applyGamma, normalizeValue, smoothThresholdAlpha } from "./normalization";
import { type HeatmapConfig } from "./types";

interface ColorStop {
  pos: number; // 0.0 a 1.0
  r: number;
  g: number;
  b: number;
  a: number; // 0 a 255
}

/**
 * Paleta contínua inspirada nos padrões de baropodometria clínica internacional:
 * Azul Profundo -> Azul Claro -> Ciano -> Verde -> Amarelo -> Laranja -> Vermelho Intenso.
 */
const COLOR_STOPS: ColorStop[] = [
  { pos: 0.0, r: 15, g: 23, b: 42, a: 0 }, // Transparente/neutro em zero
  { pos: 0.08, r: 29, g: 78, b: 216, a: 160 }, // Azul cobalto
  { pos: 0.22, r: 2, g: 132, b: 199, a: 220 }, // Azul piscina
  { pos: 0.38, r: 6, g: 182, b: 212, a: 240 }, // Ciano
  { pos: 0.52, r: 16, g: 185, b: 129, a: 250 }, // Verde esmeralda
  { pos: 0.68, r: 234, g: 179, b: 8, a: 255 }, // Amarelo ouro
  { pos: 0.82, r: 249, g: 115, b: 22, a: 255 }, // Laranja vibrante
  { pos: 1.0, r: 225, g: 29, b: 72, a: 255 }, // Vermelho rubi intenso
];

/**
 * Cria tabela de busca (LUT) pré-calculada com 256 cores RGBA para renderização ultra-rápida.
 */
function createColorLut(): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256 * 4);

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let stopIdx = 0;
    while (stopIdx < COLOR_STOPS.length - 1 && COLOR_STOPS[stopIdx + 1].pos < t) {
      stopIdx++;
    }

    const s0 = COLOR_STOPS[stopIdx];
    const s1 = COLOR_STOPS[Math.min(COLOR_STOPS.length - 1, stopIdx + 1)];
    const range = Math.max(0.0001, s1.pos - s0.pos);
    const factor = Math.min(1, Math.max(0, (t - s0.pos) / range));

    const r = Math.round(s0.r + factor * (s1.r - s0.r));
    const g = Math.round(s0.g + factor * (s1.g - s0.g));
    const b = Math.round(s0.b + factor * (s1.b - s0.b));
    const a = Math.round(s0.a + factor * (s1.a - s0.a));

    const idx = i * 4;
    lut[idx] = r;
    lut[idx + 1] = g;
    lut[idx + 2] = b;
    lut[idx + 3] = a;
  }

  return lut;
}

export const PRECOMPUTED_COLOR_LUT = createColorLut();

/**
 * Converte a grade contínua interpolada em pixels RGBA no ImageData de destino.
 * Aplica threshold com transição suave, normalização por vmax e gamma visual.
 */
export function renderInterpolatedToImageData(
  interpolated: Float32Array,
  width: number,
  height: number,
  config: HeatmapConfig,
  targetImageData: ImageData
): void {
  const { threshold, vmax, gamma } = config;
  const smoothing = config.smoothing ?? 0.35;
  const data = targetImageData.data;
  const lut = PRECOMPUTED_COLOR_LUT;
  const totalPixels = width * height;

  // Largura de transição suave em torno do limiar (dependente da suavização configurada):
  // smoothing baixo (0.0) -> borda firme e nítida sem halos periféricos
  // smoothing alto (1.0)  -> borda difusa e aveludada
  const transitionWidth = Math.max(10, Math.round(15 + smoothing * 35));
  const cutoffLow = threshold - transitionWidth;

  for (let i = 0; i < totalPixels; i++) {
    const val = interpolated[i];
    const pixelIdx = i * 4;

    if (val <= cutoffLow) {
      // Área sem contato: totalmente transparente
      data[pixelIdx] = 0;
      data[pixelIdx + 1] = 0;
      data[pixelIdx + 2] = 0;
      data[pixelIdx + 3] = 0;
      continue;
    }

    const norm = normalizeValue(val, vmax);
    const vis = applyGamma(norm, gamma);
    const lutIdx = Math.min(255, Math.max(0, Math.round(vis * 255))) * 4;

    const alphaFactor = smoothThresholdAlpha(val, threshold, transitionWidth);

    data[pixelIdx] = lut[lutIdx];
    data[pixelIdx + 1] = lut[lutIdx + 1];
    data[pixelIdx + 2] = lut[lutIdx + 2];
    data[pixelIdx + 3] = Math.round(lut[lutIdx + 3] * alphaFactor);
  }
}

/**
 * Gera string de estilo CSS para a legenda do mapa de calor.
 */
export function getHeatmapGradientCss(): string {
  const parts = COLOR_STOPS.map((s) => `rgba(${s.r}, ${s.g}, ${s.b}, 1) ${Math.round(s.pos * 100)}%`);
  return `linear-gradient(to right, ${parts.join(", ")})`;
}
