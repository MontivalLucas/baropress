import { normalizeMatrixOrientation } from '@/services/acquisition/parser';
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  computeAverageMatrix,
  processExamSample,
} from "@/features/exams/examProcessing";

import { useNewExamStore } from "@/features/exams/examStore";
import { MockSensorDevice } from "@/services/acquisition";
import { DEFAULT_HEATMAP_SETTINGS } from "@/services/baropodometry";
import type { PatientSummary } from "@/types";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useVisualizationStore } from "@/stores/visualization";
import { api } from "@/services/database/api";
import { startExamRuntime } from "@/features/exams/examRuntime";

const originalAcquisitionActions = {
  connect: useAcquisitionStore.getState().connect,
  startAcquisition: useAcquisitionStore.getState().startAcquisition,
};

describe("Fase 5 — Processamento e Amostragem de Exames Estáticos", () => {
  it("deve retornar uma matriz com exatamente 225 zeros quando nenhum quadro for fornecido", () => {
    const avg = computeAverageMatrix([]);
    expect(avg).toHaveLength(225);
    expect(avg.every((v) => v === 0)).toBe(true);
  });

  it("deve calcular a média temporal exata dos sensores para quadros válidos", () => {
    const frame1 = new Array(225).fill(100);
    const frame2 = new Array(225).fill(200);
    const frame3 = new Array(225).fill(300);

    const avg = computeAverageMatrix([frame1, frame2, frame3]);
    expect(avg).toHaveLength(225);
    expect(avg[0]).toBe(200);
    expect(avg[112]).toBe(200);
    expect(avg[224]).toBe(200);
  });

  it("deve ignorar quadros corrompidos ou com contagem diferente de 225", () => {
    const validFrame = new Array(225).fill(500);
    const corruptedFrame = new Array(100).fill(1000); // quadro incompleto

    const avg = computeAverageMatrix([validFrame, corruptedFrame]);
    expect(avg).toHaveLength(225);
    expect(avg[0]).toBe(500);
  });

  it("processExamSample deve gerar payload completo com 225 valores e métricas finitas", () => {
    const frames = [
      new Array(225).fill(0),
      new Array(225).fill(0),
    ];
    // Simula pressão acima do threshold no centro (sensel 112: linha 7, col 7)
    frames[0][112] = 1500;
    frames[1][112] = 1700;

    const result = processExamSample({
      patientId: 42,
      frames,
      durationSeconds: 10,
      fps: 30,
      settings: DEFAULT_HEATMAP_SETTINGS,
      tareApplied: true,
      source: "SIMULATION",
    });

    expect(result.averageMatrix).toHaveLength(225);
    expect(result.averageMatrix[112]).toBe(1600);
    expect(result.metrics.maxPressure).toBe(1600);
    expect(result.metrics.contactSensorCount).toBe(1);
    expect(result.examInput.patientId).toBe(42);
    expect(result.examInput.source).toBe("SIMULATION");
    expect(result.examInput.matrix).toHaveLength(225);
    expect(result.examInput.tareApplied).toBe(true);
    expect(result.examInput.duration).toBe(10);
    expect(result.examInput.type).toBe("static");
  });

  it("processExamSample deve respeitar identificação estrita de source REAL vs SIMULATION", () => {
    const dummyFrames = [new Array(225).fill(0)];

    const resReal = processExamSample({
      patientId: 1,
      frames: dummyFrames,
      durationSeconds: 10,
      fps: 30,
      settings: DEFAULT_HEATMAP_SETTINGS,
      tareApplied: false,
      source: "REAL",
    });
    expect(resReal.examInput.source).toBe("REAL");

    const resSim = processExamSample({
      patientId: 1,
      frames: dummyFrames,
      durationSeconds: 10,
      fps: 30,
      settings: DEFAULT_HEATMAP_SETTINGS,
      tareApplied: false,
      source: "SIMULATION",
    });
    expect(resSim.examInput.source).toBe("SIMULATION");
  });
});

function collectTestFrame(values:number[]) {
  const state=useNewExamStore.getState(), before=state.framesCollected.length;
  state.collectFrame(values);
  if(useNewExamStore.getState().framesCollected.length===before+1) state.collectRawFrame({values:normalizeMatrixOrientation(values),receivedMs:Date.now()-state.stageStartedAt!,sequence:before+1});
}
describe("Fase 5 — Máquina de Estados do Exame (examStore)", () => {
  const dummyPatient: PatientSummary = {
    id: 10,
    name: "Maria Santos",
    socialName: null,
    birthDate: "1994-03-20",
    sex: "F",
    cpf: "11122233344",
    phone: "11999998888",
    email: "maria@teste.com",
    lastExamAt: null,
    createdAt: "2026-10-06",
  };

  beforeEach(() => {
    vi.useFakeTimers();
    useVisualizationStore.getState().setSettings({ ...DEFAULT_HEATMAP_SETTINGS });
    useAcquisitionStore.setState({
      deviceType: "MOCK",
      status: { connected: true, acquiring: true, transport: "MOCK", framesReceived: 0, invalidFrames: 0, fps: 30 },
      tareState: { baseline: null, active: false, isZeroing: false, zeroingProgress: 0, message: null },
    });
    useNewExamStore.getState().resetExam();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Zustand cria snapshots novos; restaura também as ações copiadas dos spies.
    useAcquisitionStore.setState(originalAcquisitionActions);
    vi.useRealTimers();
  });

  it("inicia no estado SELECT_PATIENT com estado limpo", () => {
    const state = useNewExamStore.getState();
    expect(state.step).toBe("SELECT_PATIENT");
    expect(state.selectedPatient).toBeNull();
    expect(state.framesCollected).toHaveLength(0);
    expect(state.processedResult).toBeNull();
  });

  it("muda para CONFIRM ao selecionar paciente", () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);

    const updated = useNewExamStore.getState();
    expect(updated.step).toBe("CONFIRM");
    expect(updated.selectedPatient).toEqual(dummyPatient);
  });

  it("não permite avançar para PREPARING sem paciente selecionado", async () => {
    const store = useNewExamStore.getState();
    store.clearPatient();
    await store.startPreparation();

    const updated = useNewExamStore.getState();
    expect(updated.step).toBe("SELECT_PATIENT");
    expect(updated.error).toBeTruthy();
  });

  it("avança para PREPARING e inicia countdown de estabilização", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startPreparation();

    const updated = useNewExamStore.getState();
    expect(updated.step).toBe("PREPARING");
    expect(updated.countdown).toBe(5);
  });

  it("coleta quadros válidos de 225 valores durante a aquisição", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();

    expect(useNewExamStore.getState().step).toBe("ACQUIRING");

    const validFrame = new Array(225).fill(250);
    collectTestFrame(validFrame);

    expect(useNewExamStore.getState().framesCollected).toHaveLength(1);
    expect(useNewExamStore.getState().framesCollected[0]).toHaveLength(225);
  });

  it("rejeita quadros incompletos durante a aquisição", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();

    const invalidFrame = new Array(220).fill(100);
    collectTestFrame(invalidFrame);

    expect(useNewExamStore.getState().framesCollected).toHaveLength(0);
  });

  it("cancelamento de exame descarta os quadros e retorna para CONFIRM", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();

    collectTestFrame(new Array(225).fill(300));
    expect(useNewExamStore.getState().framesCollected.length).toBeGreaterThan(0);

    store.confirmCancel();

    const updated = useNewExamStore.getState();
    expect(updated.step).toBe("CONFIRM");
    expect(updated.framesCollected).toHaveLength(0);
  });

  it("finalização da aquisição calcula a média e gera resultado representativo", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();

    // Simula 10 frames coletados
    for (let i = 0; i < 10; i++) {
      const f = new Array(225).fill(50);
      f[112] = 2000;
      collectTestFrame(f);
    }

    store.finishAcquisition();

    const updated = useNewExamStore.getState();
    expect(updated.step).toBe("RESULT");
    expect(updated.processedResult).not.toBeNull();
    expect(updated.processedResult?.averageMatrix).toHaveLength(225);
    expect(updated.processedResult?.averageMatrix[112]).toBe(2000);
    expect(updated.processedResult?.metrics.maxPressure).toBe(2000);
  });

  it("não gera resultado salvável sem quadros novos e válidos", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();
    collectTestFrame(new Array(225).fill(NaN));
    collectTestFrame(new Array(225).fill(Infinity));
    collectTestFrame(new Array(225).fill(-1));
    vi.advanceTimersByTime(30_000);
    store.tickAcquisition();
    expect(useNewExamStore.getState().step).toBe("CONFIRM");
    expect(useNewExamStore.getState().processedResult).toBeNull();
    expect(useNewExamStore.getState().error).toContain("Nenhum quadro válido");
  });

  it("herda ajustes da Análise e congela os parâmetros e duração durante a coleta", async () => {
    useVisualizationStore.getState().setSettings({ ...DEFAULT_HEATMAP_SETTINGS, gamma: 2, vmax: 3000, resolution: 450, renderFps: 20, showCop: false });
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    expect(useNewExamStore.getState().settings.gamma).toBe(2);
    await store.startAcquisition();
    store.updateSettings({ gamma: 1, threshold: 999 });
    store.setDurationSeconds(5);
    collectTestFrame(new Array(225).fill(500));
    vi.advanceTimersByTime(30_000);
    store.tickAcquisition();
    const result = useNewExamStore.getState().processedResult!;
    expect(result.examInput.duration).toBe(30);
    expect(result.examInput.visualizationSettings).toMatchObject({ gamma: 2, vmax: 3000, resolution: 450, renderFps: 20, showCop: false });
  });

  it("preserva a amostra após erro de SQLite e permite salvar novamente sem duplicar", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();
    collectTestFrame(new Array(225).fill(500));
    vi.advanceTimersByTime(30_000);
    store.tickAcquisition();
    const sample = useNewExamStore.getState().processedResult!;
    const saved = { ...sample.examInput, id: 123, patientName: dummyPatient.name } as import("@/types").ExamDetails;
    const create = vi.spyOn(api.exams, "create").mockRejectedValueOnce(new Error("Banco ocupado")).mockResolvedValueOnce(saved);
    await expect(store.saveExam()).rejects.toThrow("Banco ocupado");
    expect(useNewExamStore.getState().step).toBe("RESULT");
    expect(useNewExamStore.getState().processedResult).toBe(sample);
    expect(useNewExamStore.getState().isSaving).toBe(false);
    await expect(store.saveExam()).resolves.toBe(saved);
    expect(useNewExamStore.getState().step).toBe("SAVED");
    await expect(store.saveExam()).resolves.toBe(saved);
    expect(create).toHaveBeenCalledTimes(2);
    expect(create).toHaveBeenLastCalledWith(sample.examInput);
  });

  it("acompanha ajustes da Análise até a preparação e congela a coleta", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    useVisualizationStore.getState().setSettings({ ...DEFAULT_HEATMAP_SETTINGS, threshold: 480, vmax: 1150, gamma: 1.25 });
    expect(useNewExamStore.getState().settings).toMatchObject({ threshold: 480, vmax: 1150, gamma: 1.25 });
    await store.startPreparation();
    useVisualizationStore.getState().setSettings({ ...DEFAULT_HEATMAP_SETTINGS, threshold: 100, gamma: 2 });
    store.updateSettings({ gamma: 3 });
    expect(useNewExamStore.getState().settings).toMatchObject({ threshold: 480, vmax: 1150, gamma: 1.25 });
    await store.startAcquisition();
    collectTestFrame(new Array(225).fill(700));
    store.finishAcquisition();
    expect(useNewExamStore.getState().processedResult!.examInput.visualizationSettings).toMatchObject({ threshold: 480, vmax: 1150, gamma: 1.25 });
  });

  it("salva aparência ajustada no resultado preservando métricas, trajetória e bruto físico", async () => {
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    store.updateSettings({ threshold: 110, vmax: 500, gamma: 1.1 });
    store.setPhysicalProfileId("perfil-sintetico");
    await store.startAcquisition();
    const values = new Array(225).fill(0);
    values[105] = 1817; values[119] = 616;
    store.collectFrame(values);
    store.collectRawFrame({ values: [...values], sequence: 1, receivedMs: 0 });
    store.finishAcquisition();
    const before = useNewExamStore.getState().processedResult!;
    useVisualizationStore.getState().setSettings({ ...DEFAULT_HEATMAP_SETTINGS, threshold: 480 });
    store.updateSettings({ gamma: 1.25, vmax: 1850, smoothing: 0.35, showCop: false, resolution: 450, renderFps: 60, threshold: 999, mode: "AUTO" });
    const after = useNewExamStore.getState().processedResult!;
    expect(after.metrics).toBe(before.metrics);
    expect(after.averageMatrix).toBe(before.averageMatrix);
    expect(after.examInput.copTrajectory).toBe(before.examInput.copTrajectory);
    expect(after.examInput.rawFrames).toBe(before.examInput.rawFrames);
    expect(after.examInput.physicalProfileId).toBe("perfil-sintetico");
    expect(after.examInput).toMatchObject({ threshold: 110, gamma: 1.25, vmax: 1850, smoothing: 0.35 });
    expect(after.examInput.visualizationSettings).toEqual(useNewExamStore.getState().settings);
    expect(after.examInput.visualizationSettings).toMatchObject({ threshold: 110, mode: "MANUAL", showCop: false, resolution: 450, renderFps: 60 });
    expect(useVisualizationStore.getState().settings).toMatchObject({ threshold: 480, gamma: 1.25, vmax: 1850 });
    const saved = { ...after.examInput, id: 321, patientName: dummyPatient.name } as import("@/types").ExamDetails;
    let completeSave!: (value: import("@/types").ExamDetails) => void;
    const create = vi.spyOn(api.exams, "create").mockImplementation(() => new Promise((resolve) => { completeSave = resolve; }));
    const saving = store.saveExam();
    store.updateSettings({ gamma: 3, vmax: 500 });
    expect(useNewExamStore.getState().processedResult).toBe(after);
    completeSave(saved);
    await saving;
    expect(create).toHaveBeenCalledWith(after.examInput);
    store.updateSettings({ gamma: 3 });
    useVisualizationStore.getState().setSettings(DEFAULT_HEATMAP_SETTINGS);
    expect(useNewExamStore.getState().savedExam).toBe(saved);
    expect(useNewExamStore.getState().settings.gamma).toBe(1.25);
  });

  it("descarta coleta parcial quando o fluxo para por mais de dois segundos", async () => {
    vi.useFakeTimers();
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();
    const stop = startExamRuntime();
    try {
      collectTestFrame(new Array(225).fill(700));
      vi.advanceTimersByTime(2100);
      expect(useNewExamStore.getState().step).toBe("CONFIRM");
      expect(useNewExamStore.getState().processedResult).toBeNull();
      expect(useNewExamStore.getState().error).toContain("2 segundos");
    } finally { stop(); vi.useRealTimers(); }
  });

  it("aguarda conexão e início do dispositivo antes de contar os segundos", async () => {
    useAcquisitionStore.setState((state) => ({ status: { ...state.status, connected: false, acquiring: false } }));
    let completeConnection!: () => void;
    vi.spyOn(useAcquisitionStore.getState(), "connect").mockImplementation(() => new Promise<void>((resolve) => {
      completeConnection = () => {
        useAcquisitionStore.setState((state) => ({ status: { ...state.status, connected: true } }));
        resolve();
      };
    }));
    vi.spyOn(useAcquisitionStore.getState(), "startAcquisition").mockImplementation(async () => {
      useAcquisitionStore.setState((state) => ({ status: { ...state.status, acquiring: true } }));
    });
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    const starting = store.startAcquisition();
    vi.advanceTimersByTime(30_000);
    expect(useNewExamStore.getState().step).toBe("CONFIRM");
    expect(useNewExamStore.getState().isStarting).toBe(true);
    completeConnection();
    await starting;
    expect(useNewExamStore.getState().step).toBe("ACQUIRING");
    expect(useNewExamStore.getState().countdown).toBe(30);
  });

  it("informa falha de conexão sem entrar em coleta", async () => {
    useAcquisitionStore.setState((state) => ({ status: { ...state.status, connected: false, acquiring: false } }));
    vi.spyOn(useAcquisitionStore.getState(), "connect").mockRejectedValueOnce(new Error("Porta indisponível"));
    const store = useNewExamStore.getState();
    store.selectPatient(dummyPatient);
    await store.startAcquisition();
    expect(useNewExamStore.getState().step).toBe("CONFIRM");
    expect(useNewExamStore.getState().error).toBe("Porta indisponível");
    expect(useNewExamStore.getState().isStarting).toBe(false);
  });
});

describe("Fase 5 — Relógio integrado ao dispositivo", () => {
  let stopRuntime: (() => void) | undefined;
  const patient: PatientSummary = { id: 1, name: "Paciente de teste", socialName: null, birthDate: null, sex: null, cpf: null, phone: null, email: null, lastExamAt: null, createdAt: "2026-10-06" };

  beforeEach(async () => {
    vi.useFakeTimers();
    // UI lenta: a coleta deve receber todos os frames mesmo com renders a cada 250ms.
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 250));
    useNewExamStore.getState().resetExam();
    await useAcquisitionStore.getState().disconnect();
    useAcquisitionStore.getState().setDeviceType("MOCK");
    useAcquisitionStore.getState().setMockPattern("both");
    useNewExamStore.getState().selectPatient(patient);
    stopRuntime = startExamRuntime();
  });

  afterEach(async () => {
    stopRuntime?.();
    await useAcquisitionStore.getState().disconnect();
    await vi.advanceTimersByTimeAsync(300);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("conclui 5s de preparação e exatamente 30s de coleta com sensores a 30 FPS", async () => {
    await useNewExamStore.getState().startPreparation();
    await vi.advanceTimersByTimeAsync(4_000);
    expect(useNewExamStore.getState().countdown).toBe(1);
    expect(useNewExamStore.getState().framesCollected).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(useNewExamStore.getState().step).toBe("ACQUIRING");
    expect(useNewExamStore.getState().countdown).toBe(30);
    await vi.advanceTimersByTimeAsync(29_000);
    expect(useNewExamStore.getState().step).toBe("ACQUIRING");
    expect(useNewExamStore.getState().countdown).toBe(1);
    expect(useNewExamStore.getState().framesCollected.length).toBeGreaterThan(870);
    await vi.advanceTimersByTimeAsync(1_000);
    const state = useNewExamStore.getState();
    expect(state.step).toBe("RESULT");
    expect(state.countdown).toBe(0);
    expect(state.processedResult?.examInput.duration).toBe(30);
    expect(state.processedResult?.examInput.frameCount).toBe(909);
    expect(state.processedResult?.averageMatrix).toHaveLength(225);
    expect(state.processedResult?.metrics.maxPressure).toBeGreaterThan(0);
    expect(state.processedResult?.examInput.source).toBe("SIMULATION");
    await vi.advanceTimersByTimeAsync(2_000);
    expect(useNewExamStore.getState().framesCollected).toHaveLength(909);
  });

  it("interrompe e descarta a coleta ao desconectar o dispositivo", async () => {
    await useNewExamStore.getState().startAcquisition();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(useNewExamStore.getState().framesCollected.length).toBeGreaterThan(0);
    await useAcquisitionStore.getState().disconnect();
    expect(useNewExamStore.getState().step).toBe("CONFIRM");
    expect(useNewExamStore.getState().framesCollected).toHaveLength(0);
    expect(useNewExamStore.getState().error).toContain("interrompida");
  });

  it("cancelar ou sair da tela encerra o relógio e não produz resultado", async () => {
    await useNewExamStore.getState().startAcquisition();
    await vi.advanceTimersByTimeAsync(1_000);
    useNewExamStore.getState().confirmCancel();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(useNewExamStore.getState().step).toBe("CONFIRM");
    expect(useNewExamStore.getState().processedResult).toBeNull();
    await useNewExamStore.getState().startAcquisition();
    stopRuntime?.();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(useNewExamStore.getState().step).toBe("CONFIRM");
    expect(useNewExamStore.getState().processedResult).toBeNull();
    expect(useNewExamStore.getState().error).toContain("sair da tela");
  });
});

describe("Fase 5 — Simulador Bilateral (Mock both pattern)", () => {
  it("padrão both deve gerar exatamente 225 valores com distribuição bilateral", () => {
    const mock = new MockSensorDevice("both");
    const values = mock.generatePatternValues("both", 0);

    expect(values).toHaveLength(225);
    expect(values.every((v) => v >= 0 && v <= 4095)).toBe(true);

    // Deve ter pressão tanto na metade esquerda (cols 0-6) quanto na metade direita (cols 8-14)
    let leftCount = 0;
    let rightCount = 0;
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const val = values[r * 15 + c];
        if (val > 200) {
          if (c <= 6) leftCount++;
          if (c >= 8) rightCount++;
        }
      }
    }

    expect(leftCount).toBeGreaterThan(0);
    expect(rightCount).toBeGreaterThan(0);
  });
});
