export interface CopPoint {
  x: number; // 0.0 a 14.0 (coluna)
  y: number; // 0.0 a 14.0 (linha)
}

export interface BaropodometricMetrics {
  maxPressure: number; // Maior leitura ADC acima do threshold
  meanPressure: number | null; // Média das leituras ADC em contato
  totalPressure: number; // Soma de todas as leituras em contato
  contactSensorCount: number; // Quantidade de sensels em contato (>= threshold)
  contactPercentage: number; // Porcentagem de área (0 a 100%)
  leftLoad: number; // Carga absoluta relativa na metade esquerda (cols 0-6)
  rightLoad: number; // Carga absoluta relativa na metade direita (cols 8-14)
  leftPercentage: number | null; // % de distribuição esquerda (0 a 100%)
  rightPercentage: number | null; // % de distribuição direita (0 a 100%)
  cop: CopPoint | null; // Centro de Pressão
}

export type HeatmapMode = "AUTO" | "MANUAL";

export interface HeatmapSettings {
  gamma: number; // 0.50 a 3.00 (padrão: 1.30)
  vmax: number; // 500 a 4095 ADC (padrão: 2200)
  threshold: number; // 0 a 1000 ADC (padrão: 150)
  smoothing: number; // 0.00 a 1.00 (padrão: 0.35)
  renderFps: number; // 10 a 60 FPS (padrão: 30)
  resolution: number; // 150, 300, 450 (padrão: 300)
  mode: HeatmapMode; // "AUTO" | "MANUAL" (padrão: "MANUAL")
  showCop: boolean; // Exibir marcador de CoP (padrão: true)
}

export const DEFAULT_HEATMAP_SETTINGS: HeatmapSettings = {
  gamma: 1.3,
  vmax: 2200,
  threshold: 150,
  smoothing: 0.35,
  renderFps: 30,
  resolution: 300,
  mode: "MANUAL",
  showCop: true,
};

// Aliases para compatibilidade contínua com a Fase 4
export type HeatmapConfig = HeatmapSettings;
export const DEFAULT_HEATMAP_CONFIG = DEFAULT_HEATMAP_SETTINGS;
