import { create } from "zustand";
import { DEFAULT_HEATMAP_SETTINGS, sanitizeSettings, type HeatmapSettings } from "@/services/baropodometry";

// Compartilha os últimos ajustes entre Análise e a configuração do próximo exame.
export const useVisualizationStore = create<{
  settings: HeatmapSettings;
  setSettings: (settings: HeatmapSettings | ((previous: HeatmapSettings) => HeatmapSettings)) => void;
}>((set) => ({
  settings: { ...DEFAULT_HEATMAP_SETTINGS },
  setSettings: (update) => set((state) => ({
    settings: sanitizeSettings(typeof update === "function" ? update(state.settings) : update),
  })),
}));
