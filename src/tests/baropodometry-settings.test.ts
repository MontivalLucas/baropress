import { describe, it, expect } from "vitest";
import {
  DEFAULT_HEATMAP_SETTINGS,
  SETTINGS_LIMITS,
  clampValue,
  sanitizeSettings,
  resetSettings,
  computePercentile,
  computeAutoParameters,
  fitVmaxToValues,
  normalizeValue,
  applyGamma,
  type TemporalAutoState,
} from "@/services/baropodometry";

describe("Escala compartilhada entre Análise e Exame", () => {
  it("reduz a saturação pelo VMAX; Gamma não recupera valores já cortados", () => {
    const values = [0, 110, 616, 1817];
    const vmax = fitVmaxToValues(values, 110)!;
    expect(vmax).toBe(1850);
    expect(applyGamma(normalizeValue(616, 500), 3)).toBe(1);
    expect(applyGamma(normalizeValue(616, vmax), 1.25)).toBeLessThan(0.3);
    expect(normalizeValue(1817, vmax)).toBeLessThan(1);
    expect(values).toEqual([0, 110, 616, 1817]);
  });

  it("não sugere escala sem contato e respeita os limites ADC", () => {
    expect(fitVmaxToValues([0, 100, NaN, Infinity], 110)).toBeNull();
    expect(fitVmaxToValues([110], 110)).toBe(500);
    expect(fitVmaxToValues([4095], 150)).toBe(4095);
  });
});

describe("Fase 4.1 — Testes de Configuração Central e Padrões", () => {
  it("DEFAULT_HEATMAP_SETTINGS deve conter valores padrão exatos", () => {
    expect(DEFAULT_HEATMAP_SETTINGS.gamma).toBe(1.3);
    expect(DEFAULT_HEATMAP_SETTINGS.vmax).toBe(2200);
    expect(DEFAULT_HEATMAP_SETTINGS.threshold).toBe(150);
    expect(DEFAULT_HEATMAP_SETTINGS.smoothing).toBe(0.35);
    expect(DEFAULT_HEATMAP_SETTINGS.renderFps).toBe(30);
    expect(DEFAULT_HEATMAP_SETTINGS.resolution).toBe(300);
    expect(DEFAULT_HEATMAP_SETTINGS.mode).toBe("MANUAL");
    expect(DEFAULT_HEATMAP_SETTINGS.showCop).toBe(true);
  });

  it("resetSettings deve retornar cópia idêntica a DEFAULT_HEATMAP_SETTINGS", () => {
    const res = resetSettings();
    expect(res).toEqual(DEFAULT_HEATMAP_SETTINGS);
  });
});

describe("Fase 4.1 — Testes de Limites e Sanitização de Parâmetros", () => {
  it("clampValue deve limitar valores abaixo do mínimo e acima do máximo", () => {
    expect(clampValue(0.2, 0.5, 3.0)).toBe(0.5);
    expect(clampValue(4.5, 0.5, 3.0)).toBe(3.0);
    expect(clampValue(1.8, 0.5, 3.0)).toBe(1.8);
    expect(clampValue(NaN, 0.5, 3.0)).toBe(0.5);
  });

  it("gamma: deve limitar dentro de [0.5, 3.0]", () => {
    const low = sanitizeSettings({ gamma: 0.1 });
    expect(low.gamma).toBe(SETTINGS_LIMITS.gamma.min);

    const high = sanitizeSettings({ gamma: 5.0 });
    expect(high.gamma).toBe(SETTINGS_LIMITS.gamma.max);

    const valid = sanitizeSettings({ gamma: 1.85 });
    expect(valid.gamma).toBe(1.85);
  });

  it("vmax: deve limitar dentro de [500, 4095]", () => {
    const low = sanitizeSettings({ vmax: 200 });
    expect(low.vmax).toBe(SETTINGS_LIMITS.vmax.min);

    const high = sanitizeSettings({ vmax: 6000 });
    expect(high.vmax).toBe(SETTINGS_LIMITS.vmax.max);

    const valid = sanitizeSettings({ vmax: 1800 });
    expect(valid.vmax).toBe(1800);
  });

  it("threshold: deve limitar dentro de [0, 1000]", () => {
    const low = sanitizeSettings({ threshold: -50 });
    expect(low.threshold).toBe(SETTINGS_LIMITS.threshold.min);

    const high = sanitizeSettings({ threshold: 2500 });
    expect(high.threshold).toBe(SETTINGS_LIMITS.threshold.max);

    const valid = sanitizeSettings({ threshold: 280 });
    expect(valid.threshold).toBe(280);
  });

  it("smoothing: deve limitar dentro de [0.0, 1.0]", () => {
    const low = sanitizeSettings({ smoothing: -0.2 });
    expect(low.smoothing).toBe(SETTINGS_LIMITS.smoothing.min);

    const high = sanitizeSettings({ smoothing: 1.8 });
    expect(high.smoothing).toBe(SETTINGS_LIMITS.smoothing.max);

    const valid = sanitizeSettings({ smoothing: 0.65 });
    expect(valid.smoothing).toBe(0.65);
  });

  it("renderFps: deve limitar dentro de [10, 60]", () => {
    const low = sanitizeSettings({ renderFps: 5 });
    expect(low.renderFps).toBe(SETTINGS_LIMITS.renderFps.min);

    const high = sanitizeSettings({ renderFps: 120 });
    expect(high.renderFps).toBe(SETTINGS_LIMITS.renderFps.max);

    const valid = sanitizeSettings({ renderFps: 45 });
    expect(valid.renderFps).toBe(45);
  });

  it("resolution: deve limitar dentro de [150, 450]", () => {
    const low = sanitizeSettings({ resolution: 50 });
    expect(low.resolution).toBe(150);

    const high = sanitizeSettings({ resolution: 800 });
    expect(high.resolution).toBe(450);

    const valid = sanitizeSettings({ resolution: 300 });
    expect(valid.resolution).toBe(300);
  });
});

describe("Fase 4.1 — Testes de Modos AUTO e MANUAL", () => {
  it("deve permitir comutar entre AUTO e MANUAL", () => {
    const manual = sanitizeSettings({ mode: "MANUAL" });
    expect(manual.mode).toBe("MANUAL");

    const auto = sanitizeSettings({ mode: "AUTO" });
    expect(auto.mode).toBe("AUTO");
  });

  it("alteração manual de slider deve definir mode como MANUAL", () => {
    const initialSettings = { ...DEFAULT_HEATMAP_SETTINGS, mode: "AUTO" as const };
    const updated = sanitizeSettings({ gamma: 2.0, mode: "MANUAL" }, initialSettings);
    expect(updated.gamma).toBe(2.0);
    expect(updated.mode).toBe("MANUAL");
  });
});

describe("Fase 4.1 — Testes do Modo Automático (Percentil e Estabilidade Temporal)", () => {
  it("computePercentile deve calcular percentis corretamente", () => {
    const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    expect(computePercentile(values, 0.5)).toBe(500);
    expect(computePercentile(values, 0.9)).toBe(900);
    expect(computePercentile(values, 1.0)).toBe(1000);
    expect(computePercentile([], 0.95)).toBe(0);
  });

  it("auto VMAX e auto Threshold em repouso (sem contato) devem retornar valores seguros padrão", () => {
    const emptyGrid = new Array(225).fill(0);
    const { settings } = computeAutoParameters(emptyGrid, DEFAULT_HEATMAP_SETTINGS);

    expect(settings.vmax).toBe(2200);
    expect(settings.threshold).toBe(150);
    expect(settings.gamma).toBe(1.3);
    expect(settings.smoothing).toBe(0.35);
  });

  it("auto VMAX com carga deve calcular escala proporcional ao P95/P98", () => {
    const grid = new Array(225).fill(0);
    // Simula 20 sensores ativos com leituras de 1000 a 2500
    for (let i = 0; i < 20; i++) {
      grid[i] = 1000 + i * 75; // 1000 a 2425
    }

    const { settings } = computeAutoParameters(grid, DEFAULT_HEATMAP_SETTINGS, {
      smoothedVmax: 2000,
      smoothedThreshold: 150,
    });

    expect(settings.vmax).toBeGreaterThanOrEqual(1500);
    expect(settings.vmax).toBeLessThanOrEqual(3600);
    expect(settings.threshold).toBeGreaterThanOrEqual(100);
    expect(settings.threshold).toBeLessThanOrEqual(220);
  });

  it("estabilidade temporal (EMA): auto VMAX não deve saltar bruscamente em um único frame", () => {
    const baseGrid = new Array(225).fill(0);
    for (let i = 0; i < 15; i++) {
      gridValue: baseGrid[i] = 1500;
    }

    const state: TemporalAutoState = {
      smoothedVmax: 1800,
      smoothedThreshold: 150,
    };

    // Frame com pico súbito muito alto em um único sensor
    const spikeGrid = [...baseGrid];
    spikeGrid[0] = 3800;

    const res1 = computeAutoParameters(spikeGrid, DEFAULT_HEATMAP_SETTINGS, state);
    // Graças ao P95 e ao filtro EMA de 20%, o vmax não deve dar salto de 2000 pontos
    const deltaVmax = Math.abs(res1.settings.vmax! - state.smoothedVmax);
    expect(deltaVmax).toBeLessThan(350); // Mudança amortecida e estável

    // Múltiplos frames consistentes convergem suavemente
    let currentState = res1.nextState;
    for (let f = 0; f < 10; f++) {
      const step = computeAutoParameters(spikeGrid, DEFAULT_HEATMAP_SETTINGS, currentState);
      currentState = step.nextState;
    }

    // O pico isolado foi rejeitado pelo P95/P98, convergindo estavelmente para o platô de carga real (1500 * 1.15 = 1725)
    expect(currentState.smoothedVmax).toBeGreaterThan(1600);
    expect(currentState.smoothedVmax).toBeLessThan(1850);
  });
});
