import { describe, it, expect } from "vitest";
import {
  normalizeValue,
  applyGamma,
  applyThreshold,
  smoothThresholdAlpha,
  calculateCop,
  copToCanvas,
  calculateMetrics,
  interpolateGrid,
  sampleBicubic,
} from "@/services/baropodometry";
import { normalizeMatrixOrientation, matrixIndex } from "@/services/acquisition";

describe("Fase 4 — Testes de Orientação da Matriz", () => {
  it("deve produzir espelhamento horizontal determinístico e manter coerência com CoP", () => {
    // Matriz 15x15 vazia com excitação única em linha 7, coluna 2
    const raw = new Array(225).fill(0);
    const targetRow = 7;
    const targetCol = 2;
    raw[matrixIndex(targetRow, targetCol)] = 2500;

    // Aplica a normalização oficial da esteira (fliplr)
    const normalized = normalizeMatrixOrientation(raw);

    // Na convenção, coluna 2 espelhada (15 - 1 - 2) deve estar na coluna 12
    const expectedCol = 12;
    expect(normalized[matrixIndex(targetRow, expectedCol)]).toBe(2500);
    expect(normalized[matrixIndex(targetRow, targetCol)]).toBe(0);

    // O CoP calculado sobre a matriz normalizada deve refletir perfeitamente a coluna 12
    const cop = calculateCop(normalized, 150);
    expect(cop).not.toBeNull();
    expect(cop!.x).toBeCloseTo(expectedCol, 4);
    expect(cop!.y).toBeCloseTo(targetRow, 4);
  });
});

describe("Fase 4 — Testes de Normalização, Vmax e Gamma", () => {
  it("normalizeValue: 0 -> 0, vmax -> 1, >vmax -> 1 e valor proporcional", () => {
    const vmax = 2200;
    expect(normalizeValue(0, vmax)).toBe(0);
    expect(normalizeValue(-50, vmax)).toBe(0);
    expect(normalizeValue(2200, vmax)).toBe(1.0);
    expect(normalizeValue(3500, vmax)).toBe(1.0);
    expect(normalizeValue(1100, vmax)).toBe(0.5);
    expect(normalizeValue(550, vmax)).toBe(0.25);
  });

  it("applyGamma: 0 -> 0, 1 -> 1 e valores intermediários estritamente em [0, 1]", () => {
    const gamma = 1.3;
    expect(applyGamma(0, gamma)).toBe(0);
    expect(applyGamma(1, gamma)).toBe(1);

    const val = applyGamma(0.5, gamma);
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThan(1);
    expect(val).toBeCloseTo(Math.pow(0.5, 1.3), 4);
  });

  it("applyThreshold e smoothThresholdAlpha: corte correto e transição suave", () => {
    const threshold = 150;
    expect(applyThreshold(100, threshold)).toBe(0);
    expect(applyThreshold(149, threshold)).toBe(0);
    expect(applyThreshold(150, threshold)).toBe(150);
    expect(applyThreshold(200, threshold)).toBe(200);

    // Alpha suave
    expect(smoothThresholdAlpha(50, threshold, 50)).toBe(0);
    expect(smoothThresholdAlpha(250, threshold, 50)).toBe(1);
    const alphaMid = smoothThresholdAlpha(150, threshold, 50);
    expect(alphaMid).toBeCloseTo(0.5, 2);
  });
});

describe("Fase 4 — Testes do Centro de Pressão (CoP)", () => {
  it("Caso 1: Carga uniforme em toda a esteira deve ter CoP no centro (7.0, 7.0)", () => {
    const uniformGrid = new Array(225).fill(1000);
    const cop = calculateCop(uniformGrid, 150);

    expect(cop).not.toBeNull();
    expect(cop!.x).toBeCloseTo(7.0, 3);
    expect(cop!.y).toBeCloseTo(7.0, 3);
  });

  it("Caso 2: Carga somente à esquerda deve ter COPx < 7.0", () => {
    const grid = new Array(225).fill(0);
    // Aplica carga nas colunas 1 e 2
    for (let r = 0; r < 15; r++) {
      grid[matrixIndex(r, 1)] = 1500;
      grid[matrixIndex(r, 2)] = 1500;
    }

    const cop = calculateCop(grid, 150);
    expect(cop).not.toBeNull();
    expect(cop!.x).toBeLessThan(7.0);
    expect(cop!.x).toBeCloseTo(1.5, 2);
    expect(cop!.y).toBeCloseTo(7.0, 2);
  });

  it("Caso 3: Carga somente à direita deve ter COPx > 7.0", () => {
    const grid = new Array(225).fill(0);
    // Aplica carga nas colunas 12 e 13
    for (let r = 0; r < 15; r++) {
      grid[matrixIndex(r, 12)] = 1500;
      grid[matrixIndex(r, 13)] = 1500;
    }

    const cop = calculateCop(grid, 150);
    expect(cop).not.toBeNull();
    expect(cop!.x).toBeGreaterThan(7.0);
    expect(cop!.x).toBeCloseTo(12.5, 2);
    expect(cop!.y).toBeCloseTo(7.0, 2);
  });

  it("Caso 4: Sem carga (todos os valores abaixo do threshold) deve retornar null", () => {
    const emptyGrid = new Array(225).fill(80); // Abaixo de 150
    const cop = calculateCop(emptyGrid, 150);
    expect(cop).toBeNull();
  });

  it("Conversão de CoP para pixels do Canvas deve mapear proporcionalmente", () => {
    const cop = { x: 7.0, y: 7.0 }; // Centro exato
    const canvasSize = 450;
    const pixel = copToCanvas(cop, canvasSize, canvasSize, 0);

    // Centro da célula 7: (7 + 0.5) / 15 * 450 = 7.5 / 15 * 450 = 225
    expect(pixel.x).toBeCloseTo(225, 1);
    expect(pixel.y).toBeCloseTo(225, 1);
  });
});

describe("Fase 4 — Testes de Pressão e Métricas Baropodométricas", () => {
  it("maxPressure, meanPressure e totalPressure com valores matemáticos conhecidos", () => {
    const grid = new Array(225).fill(0);
    grid[0] = 500;
    grid[1] = 1000;
    grid[2] = 1500;

    const metrics = calculateMetrics(grid, 150);

    expect(metrics.maxPressure).toBe(1500);
    expect(metrics.totalPressure).toBe(3000);
    expect(metrics.contactSensorCount).toBe(3);
    // Média de [500, 1000, 1500] = 1000
    expect(metrics.meanPressure).toBe(1000);
  });

  it("meanPressure deve retornar null quando não houver contato", () => {
    const emptyGrid = new Array(225).fill(0);
    const metrics = calculateMetrics(emptyGrid, 150);

    expect(metrics.maxPressure).toBe(0);
    expect(metrics.totalPressure).toBe(0);
    expect(metrics.contactSensorCount).toBe(0);
    expect(metrics.meanPressure).toBeNull();
    expect(metrics.cop).toBeNull();
  });
});

describe("Fase 4 — Testes de Distribuição de Carga Esquerda / Direita", () => {
  it("carga somente nas colunas 0–6 deve resultar em leftPercentage = 100% e rightPercentage = 0%", () => {
    const grid = new Array(225).fill(0);
    grid[matrixIndex(5, 2)] = 1200;
    grid[matrixIndex(6, 4)] = 1800;

    const metrics = calculateMetrics(grid, 150);

    expect(metrics.leftLoad).toBe(3000);
    expect(metrics.rightLoad).toBe(0);
    expect(metrics.leftPercentage).toBe(100);
    expect(metrics.rightPercentage).toBe(0);
  });

  it("carga somente nas colunas 8–14 deve resultar em leftPercentage = 0% e rightPercentage = 100%", () => {
    const grid = new Array(225).fill(0);
    grid[matrixIndex(5, 10)] = 2000;
    grid[matrixIndex(8, 12)] = 2000;

    const metrics = calculateMetrics(grid, 150);

    expect(metrics.leftLoad).toBe(0);
    expect(metrics.rightLoad).toBe(4000);
    expect(metrics.leftPercentage).toBe(0);
    expect(metrics.rightPercentage).toBe(100);
  });

  it("carga equilibrada (mesmo valor na esquerda e na direita) deve resultar em 50% / 50%", () => {
    const grid = new Array(225).fill(0);
    grid[matrixIndex(7, 3)] = 1500; // Esquerda
    grid[matrixIndex(7, 11)] = 1500; // Direita

    const metrics = calculateMetrics(grid, 150);

    expect(metrics.leftPercentage).toBe(50);
    expect(metrics.rightPercentage).toBe(50);
  });
});

describe("Fase 4 — Testes de Área de Contato Relativa", () => {
  it("quantidade conhecida de sensels em contato deve refletir na porcentagem", () => {
    const grid = new Array(225).fill(0);
    // Ativa 45 sensores (45 / 225 = 20%)
    for (let i = 0; i < 45; i++) {
      grid[i] = 800;
    }

    const metrics = calculateMetrics(grid, 150);

    expect(metrics.contactSensorCount).toBe(45);
    expect(metrics.contactPercentage).toBe(20.0);
  });
});

describe("Fase 4 — Testes de Interpolação e Continuidade da Superfície", () => {
  it("interpolateGrid deve gerar grade com dimensões solicitadas e sem NaN", () => {
    const grid = new Array(225).fill(500);
    const res = 100;
    const interpolated = interpolateGrid(grid, res, res, 1);

    expect(interpolated.length).toBe(res * res);
    for (let i = 0; i < interpolated.length; i++) {
      expect(Number.isNaN(interpolated[i])).toBe(false);
      expect(interpolated[i]).toBeGreaterThan(450);
      expect(interpolated[i]).toBeLessThan(550);
    }
  });

  it("amostragem bicúbica deve preservar valor no vértice do sensor", () => {
    const grid = new Array(225).fill(0);
    grid[matrixIndex(7, 7)] = 3000;

    // Amostra exatamente no centro (7.0, 7.0)
    const valCenter = sampleBicubic(grid, 7.0, 7.0);
    expect(valCenter).toBe(3000);

    // Amostra a 2 sensores de distância deve ser 0
    const valFar = sampleBicubic(grid, 2.0, 2.0);
    expect(valFar).toBe(0);
  });
});
