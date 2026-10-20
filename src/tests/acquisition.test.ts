import { describe, it, expect, beforeEach } from "vitest";
import {
  parseSensorFrame,
  normalizeMatrixOrientation,
  applyTare,
  matrixIndex,
  getMatrixCoords,
  FrameBuffer,
  TareManager,
  MockSensorDevice,
} from "@/services/acquisition";

describe("Fase 3 — Parser de Frames do Sensor", () => {
  it("deve aceitar e parsear linha CSV válida com exatamente 225 valores", () => {
    const raw = Array.from({ length: 225 }, (_, i) => i % 4096).join(",");
    const frame = parseSensorFrame(raw, 1, "REAL");

    expect(frame.values).toHaveLength(225);
    expect(frame.values[0]).toBe(0);
    expect(frame.values[224]).toBe(224);
    expect(frame.source).toBe("REAL");
    expect(frame.sequence).toBe(1);
  });

  it("deve aceitar espaços adicionais e quebras de linha CRLF", () => {
    const raw = Array.from({ length: 225 }, (_, i) => `  ${i * 10}  `).join(",") + "\r\n";
    const frame = parseSensorFrame(raw);

    expect(frame.values).toHaveLength(225);
    expect(frame.values[0]).toBe(0);
    expect(frame.values[1]).toBe(10);
  });

  it("deve rejeitar linha com menos de 225 valores", () => {
    const raw = Array.from({ length: 224 }, (_, i) => i).join(",");
    expect(() => parseSensorFrame(raw)).toThrow(/esperados 225, recebidos 224/);
  });

  it("deve rejeitar linha com mais de 225 valores", () => {
    const raw = Array.from({ length: 226 }, (_, i) => i).join(",");
    expect(() => parseSensorFrame(raw)).toThrow(/esperados 225, recebidos 226/);
  });

  it("deve rejeitar valores não numéricos", () => {
    const parts = Array.from({ length: 224 }, (_, i) => `${i}`);
    parts.push("XYZ");
    expect(() => parseSensorFrame(parts.join(","))).toThrow(/não inteiro/);
  });

  it("deve rejeitar valores negativos", () => {
    const parts = Array.from({ length: 224 }, (_, i) => `${i}`);
    parts.push("-5");
    expect(() => parseSensorFrame(parts.join(","))).toThrow(/negativo/);
  });

  it("deve rejeitar valores acima do limite ADC (4095)", () => {
    const parts = Array.from({ length: 224 }, (_, i) => `${i}`);
    parts.push("4096");
    expect(() => parseSensorFrame(parts.join(","))).toThrow(/acima do limite máximo ADC/);
  });

  it("deve rejeitar linha vazia ou só com espaços", () => {
    expect(() => parseSensorFrame("   \r\n")).toThrow(/vazia/);
  });
});

describe("Fase 3 — Matriz 15x15 e Orientação", () => {
  it("deve converter corretamente índices e coordenadas bidimensionais", () => {
    expect(matrixIndex(0, 0)).toBe(0);
    expect(matrixIndex(0, 14)).toBe(14);
    expect(matrixIndex(1, 0)).toBe(15);
    expect(matrixIndex(14, 14)).toBe(224);

    expect(getMatrixCoords(0)).toEqual({ row: 0, col: 0 });
    expect(getMatrixCoords(14)).toEqual({ row: 0, col: 14 });
    expect(getMatrixCoords(15)).toEqual({ row: 1, col: 0 });
    expect(getMatrixCoords(224)).toEqual({ row: 14, col: 14 });
  });

  it("deve aplicar espelhamento horizontal (fliplr) na normalização da matriz", () => {
    const grid = new Array(225).fill(0);
    // Coloca valor marcador na coluna 0 da linha 2
    grid[matrixIndex(2, 0)] = 3500;
    // Coloca valor marcador na coluna 14 da linha 5
    grid[matrixIndex(5, 14)] = 2000;

    const normalized = normalizeMatrixOrientation(grid);

    // Na normalização, coluna 0 deve ir para a coluna 14
    expect(normalized[matrixIndex(2, 14)]).toBe(3500);
    expect(normalized[matrixIndex(2, 0)]).toBe(0);

    // E coluna 14 deve ir para a coluna 0
    expect(normalized[matrixIndex(5, 0)]).toBe(2000);
    expect(normalized[matrixIndex(5, 14)]).toBe(0);
  });
});

describe("Fase 3 — Calibração e Aplicação de Tara", () => {
  it("deve calcular a média por sensor e subtrair com corte inferior em zero", () => {
    const raw = [100, 50, 20];
    const baseline = [80, 70, 10];

    const corrected = applyTare(raw, baseline, true);
    expect(corrected[0]).toBe(20); // 100 - 80 = 20
    expect(corrected[1]).toBe(0); // 50 - 70 = -20 -> clamp para 0
    expect(corrected[2]).toBe(10); // 20 - 10 = 10
  });

  it("não deve alterar os valores quando a tara estiver desativada", () => {
    const raw = [100, 50, 20];
    const baseline = [80, 70, 10];

    const corrected = applyTare(raw, baseline, false);
    expect(corrected).toEqual([100, 50, 20]);
  });

  it("TareManager deve coletar frames, calcular baseline e finalizar", () => {
    const mgr = new TareManager();
    mgr.startZeroing(5);

    for (let f = 0; f < 5; f++) {
      const frameValues = new Array(225).fill(100 + f * 10);
      mgr.feedFrame({
        timestamp: Date.now(),
        values: frameValues,
        source: "SIMULATION",
      });
    }

    const state = mgr.getState();
    expect(state.active).toBe(true);
    expect(state.isZeroing).toBe(false);
    expect(state.baseline).toHaveLength(225);
    // Média de [100, 110, 120, 130, 140] = 120
    expect(state.baseline![0]).toBe(120);
    expect(state.message).toContain("Tara realizada com sucesso");
  });
});

describe("Fase 3 — Simulador MockSensorDevice", () => {
  let mock: MockSensorDevice;

  beforeEach(() => {
    mock = new MockSensorDevice("center");
  });

  it("deve gerar exatamente 225 valores dentro da faixa 0 a 4095", () => {
    const values = mock.generatePatternValues("center");
    expect(values).toHaveLength(225);
    values.forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(4095);
    });
  });

  it("padrão uniforme deve manter valores homogêneos", () => {
    const values = mock.generatePatternValues("uniform");
    expect(values).toHaveLength(225);
    // Deve oscilar muito pouco ao redor de 1500 (ruído de ±15)
    values.forEach((v) => {
      expect(v).toBeGreaterThan(1450);
      expect(v).toBeLessThan(1550);
    });
  });

  it("padrão centro deve concentrar maior pressão no centro do que nas bordas", () => {
    const values = mock.generatePatternValues("center");
    const centerVal = values[matrixIndex(7, 7)];
    const cornerVal = values[matrixIndex(0, 0)];
    expect(centerVal).toBeGreaterThan(2500);
    expect(cornerVal).toBeLessThan(100);
  });

  it("padrão esquerda deve ter maior intensidade nas colunas esquerdas que nas direitas", () => {
    const values = mock.generatePatternValues("left");
    const leftVal = values[matrixIndex(7, 3)];
    const rightVal = values[matrixIndex(7, 11)];
    expect(leftVal).toBeGreaterThan(2000);
    expect(rightVal).toBeLessThan(200);
  });

  it("padrão direita deve ter maior intensidade nas colunas direitas que nas esquerdas", () => {
    const values = mock.generatePatternValues("right");
    const leftVal = values[matrixIndex(7, 3)];
    const rightVal = values[matrixIndex(7, 11)];
    expect(rightVal).toBeGreaterThan(2000);
    expect(leftVal).toBeLessThan(200);
  });
});

describe("Fase 3 — FrameBuffer e Teste de Integração", () => {
  it("FrameBuffer deve armazenar frames e calcular FPS", () => {
    const buffer = new FrameBuffer(10);
    const now = Date.now();

    for (let i = 0; i < 5; i++) {
      buffer.push({
        timestamp: now + i * 33,
        sequence: i + 1,
        values: new Array(225).fill(i),
        source: "SIMULATION",
      });
    }

    expect(buffer.size()).toBe(5);
    expect(buffer.getLatest()?.sequence).toBe(5);
    const recent = buffer.getRecent(3);
    expect(recent).toHaveLength(3);
    expect(recent[0].sequence).toBe(5);
    expect(recent[1].sequence).toBe(4);
    expect(recent[2].sequence).toBe(3);
  });

  it("Integração: MockSensorDevice -> onFrame -> Buffer -> Tara", async () => {
    const mock = new MockSensorDevice("dynamic");
    const buffer = new FrameBuffer(30);
    const tare = new TareManager();
    tare.startZeroing(2);

    await mock.connect();
    expect(mock.getStatus().connected).toBe(true);

    const receivedFrames: number[] = [];

    const unlisten = mock.onFrame((frame) => {
      expect(frame.values).toHaveLength(225);
      expect(frame.source).toBe("SIMULATION");
      buffer.push(frame);
      tare.feedFrame(frame);
      receivedFrames.push(frame.sequence || 0);
    });

    await mock.startAcquisition();
    expect(mock.getStatus().acquiring).toBe(true);

    // Aguarda ~100ms para receber pelo menos 2 frames (taxa de 33ms)
    await new Promise((res) => setTimeout(res, 120));

    await mock.stopAcquisition();
    unlisten();
    await mock.disconnect();

    expect(receivedFrames.length).toBeGreaterThanOrEqual(2);
    expect(buffer.size()).toBeGreaterThanOrEqual(2);
    expect(mock.getStatus().connected).toBe(false);
  });
});
