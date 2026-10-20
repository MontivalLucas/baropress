import { create } from "zustand";
import { acquisitionOwner } from "@/services/acquisition/rawStream";
import type { RawFrame } from "@/services/calibration/types";
import { DEFAULT_HEATMAP_SETTINGS, sanitizeSettings, type HeatmapSettings } from "@/services/baropodometry";
import { api } from "@/services/database/api";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useVisualizationStore } from "@/stores/visualization";
import { usePreferencesStore } from "@/stores/preferences";
import type { ExamDetails, Patient, PatientSummary } from "@/types";
import { processExamSample, type ProcessExamResult } from "./examProcessing";
import { unknownConditions, ANALYSIS_VERSION, type ExamConditions, type ExamEvent, type SeriesMetadata } from '@/services/examAnalysis/types';
import { acquisitionQuality } from '@/services/examAnalysis/calculations';
import { calculateCop } from '@/services/baropodometry';
import type { TemporalPoint } from '@/services/examAnalysis/types';
import type { ExamFoot } from '@/services/examProtocol';

export type ExamStep =
  | "SELECT_PATIENT"
  | "CONFIRM"
  | "NEXT_FOOT"
  | "PREPARING"
  | "ACQUIRING"
  | "RESULT"
  | "SAVED";

interface NewExamState {
  foot: ExamFoot;
  separateFeet: boolean;
  sequenceId: string | null;
  completedStages: ProcessExamResult[];
  savedExams: ExamDetails[];
  liveTrajectory: TemporalPoint[];
  setModality: (foot: ExamFoot, separateFeet?: boolean) => void;
  nextFoot: () => void;
  conditions: ExamConditions;
  frozenConditions: ExamConditions | null;
  events: ExamEvent[];
  invalidFrameCount: number;
  seriesMetadata: SeriesMetadata | null;
  setConditions: (changes: Partial<ExamConditions>) => void;
  addEvent: (event: ExamEvent) => void;
  collectInvalidFrame: () => void;
  step: ExamStep;
  selectedPatient: Patient | PatientSummary | null;
  durationSeconds: number; // Padrão: 30 segundos
  prepSeconds: number; // Padrão: 5 segundos
  countdown: number;
  framesCollected: number[][];
  frameTimestampsMs: number[];
  physicalProfileId: string | null;
  frozenPhysicalProfileId: string | null;
  rawFrames: RawFrame[];
  setPhysicalProfileId: (id: string | null) => void;
  collectRawFrame: (frame: RawFrame) => void;
  startedAt: string | null;
  stageStartedAt: number | null;
  isStarting: boolean;
  acquisitionSource: "REAL" | "SIMULATION";
  acquisitionTare: boolean;
  isSaving: boolean;
  error: string | null;
  cancelModalOpen: boolean;

  // Resultado processado
  processedResult: ProcessExamResult | null;
  savedExam: ExamDetails | null;

  // Configurações do heatmap para o exame
  settings: HeatmapSettings;

  // Ações
  selectPatient: (patient: Patient | PatientSummary) => void;
  clearPatient: () => void;
  goToConfirm: () => void;
  startPreview: () => Promise<boolean>;
  startPreparation: () => Promise<void>;
  startAcquisition: () => Promise<void>;
  abortAcquisition: (reason?: string) => void;
  tickPrep: () => void;
  collectFrame: (frameValues: number[], timestampMs?: number) => void;
  tickAcquisition: (elapsedMs?: number) => void;
  finishAcquisition: () => void;
  saveExam: () => Promise<ExamDetails>;
  openCancelModal: () => void;
  closeCancelModal: () => void;
  confirmCancel: () => void;
  resetExam: () => void;
  setDurationSeconds: (sec: number) => void;
  updateSettings: (partial: Partial<HeatmapSettings>) => void;
}

let startOperation = 0;
const errorMessage = (err: unknown) => err instanceof Error ? err.message : String(err);

export const useNewExamStore = create<NewExamState>((set, get) => ({
  foot: 'both', separateFeet: false, sequenceId: null, completedStages: [], savedExams: [], liveTrajectory: [],
  setModality: (foot, separateFeet = false) => {
    if (get().step !== 'CONFIRM' || get().isStarting || get().completedStages.length) return;
    set({ foot, separateFeet: foot !== 'both' && separateFeet, sequenceId: null });
  },
  nextFoot: () => {
    const state = get();
    if (state.step !== 'RESULT' || !state.separateFeet || state.completedStages.length || !state.processedResult || state.isSaving) return;
    if (state.processedResult.examInput.analysis) state.processedResult.examInput.analysis.events = [...state.events];
    set({ completedStages: [structuredClone(state.processedResult)], foot: state.foot === 'left' ? 'right' : 'left', step: 'NEXT_FOOT', processedResult: null, framesCollected: [], rawFrames: [], liveTrajectory: [], frameTimestampsMs: [], events: [], error: null });
  },
  conditions: unknownConditions(), frozenConditions: null, events: [], invalidFrameCount: 0, seriesMetadata: null,
  setConditions: changes => { if (get().step === 'CONFIRM' && !get().isStarting) set(s => ({conditions: {...s.conditions,...changes}})); },
  addEvent: event => { if (['ACQUIRING','RESULT'].includes(get().step)) set(s => ({events:[...s.events,event]})); },
  collectInvalidFrame: () => { if (get().step === 'ACQUIRING') set(s => ({invalidFrameCount:s.invalidFrameCount+1})); },
  step: "SELECT_PATIENT",
  selectedPatient: null,
  durationSeconds: 30,
  prepSeconds: 5,
  countdown: 5,
  framesCollected: [],
  frameTimestampsMs: [],
  physicalProfileId: null,
  frozenPhysicalProfileId: null,
  rawFrames: [],
  setPhysicalProfileId: (physicalProfileId) => { if (["SELECT_PATIENT", "CONFIRM"].includes(get().step)) set({ physicalProfileId }); },
  collectRawFrame: (frame) => {
    if (get().step !== "ACQUIRING") return;
    if (get().rawFrames.length >= 10000) { get().abortAcquisition("Limite de 10.000 quadros atingido. Reduza a duração e repita."); return; }
    set(state => ({ rawFrames: [...state.rawFrames, frame] }));
  },
  startedAt: null,
  stageStartedAt: null,
  isStarting: false,
  acquisitionSource: "SIMULATION",
  acquisitionTare: false,
  isSaving: false,
  error: null,
  cancelModalOpen: false,

  processedResult: null,
  savedExam: null,
  settings: { ...DEFAULT_HEATMAP_SETTINGS },

  selectPatient: (patient) => {
    set({ foot: 'both', separateFeet: false, sequenceId: null, completedStages: [], savedExams: [], liveTrajectory: [], selectedPatient: patient, conditions: unknownConditions(), frozenConditions: null, events: [], error: null, step: "CONFIRM", durationSeconds: usePreferencesStore.getState().durationSeconds, settings: { ...useVisualizationStore.getState().settings } });
  },

  clearPatient: () => {
    if (get().isSaving) return;
    ++startOperation;
    set({ completedStages: [], sequenceId: null, liveTrajectory: [], selectedPatient: null, step: "SELECT_PATIENT", isStarting: false, error: null, stageStartedAt: null });
  },

  goToConfirm: () => {
    if (!get().selectedPatient) {
      set({ error: "Selecione um paciente para continuar." });
      return;
    }
    set({ step: "CONFIRM", error: null });
  },

  startPreview: async () => {
    if (acquisitionOwner() === "calibration") { set({ error: "Conclua a coleta de calibração antes do exame." }); return false; }
    if (get().isStarting) return false;
    const operation = ++startOperation;
    set({ isStarting: true, error: null });
    try {
      if (!useAcquisitionStore.getState().status.connected) {
        await useAcquisitionStore.getState().connect();
      }
      if (operation !== startOperation) return false;
      if (!useAcquisitionStore.getState().status.acquiring) {
        await useAcquisitionStore.getState().startAcquisition();
      }
      if (operation !== startOperation) return false;
      const acq = useAcquisitionStore.getState();
      if (!acq.status.connected || !acq.status.acquiring) {
        throw new Error("O dispositivo não iniciou a aquisição. Verifique a conexão.");
      }
      if (acq.tareState.isZeroing) {
        throw new Error("Aguarde a conclusão da tara antes de iniciar o exame.");
      }
      return true;
    } catch (err) {
      if (operation === startOperation) set({ error: errorMessage(err) });
      return false;
    } finally {
      if (operation === startOperation) set({ isStarting: false });
    }
  },

  startPreparation: async () => {
    if (!get().selectedPatient) {
      set({ error: "Selecione um paciente antes de iniciar a preparação." });
      return;
    }
    if (get().isSaving || get().isStarting || !["CONFIRM", "RESULT", "NEXT_FOOT"].includes(get().step)) return;
    if (!await get().startPreview()) return;
    set({
      step: "PREPARING",
      sequenceId: get().separateFeet ? get().sequenceId ?? crypto.randomUUID() : null,
      frozenConditions: structuredClone(get().conditions), events: [], liveTrajectory: [],
      countdown: get().prepSeconds,
      stageStartedAt: Date.now(),
      framesCollected: [],
      frameTimestampsMs: [],
      processedResult: null,
      savedExam: null,
      error: null,
    });
  },

  startAcquisition: async () => {
    if (get().isStarting || get().isSaving || !["CONFIRM", "PREPARING"].includes(get().step)) return;
    if (!get().selectedPatient) {
      set({ error: "Selecione um paciente antes de iniciar o exame." });
      return;
    }
    if (!await get().startPreview()) {
      if (get().step === "PREPARING") get().abortAcquisition(get().error || undefined);
      return;
    }
    const acqStore = useAcquisitionStore.getState();

    set({
      step: "ACQUIRING",
      frozenConditions: get().step === 'PREPARING' ? get().frozenConditions : structuredClone(get().conditions),
      events: [], invalidFrameCount: 0,
      seriesMetadata: { frameCount: 0, representation: 'raw-adc-u16', clock: 'pc-monotonic-reception', sequenceOrigin: 'pc-reception', orientation: 'RAW_FLIP_X', tareBaseline: acqStore.tareState.baseline ? [...acqStore.tareState.baseline] : null, tareActive: acqStore.tareState.active, threshold: get().settings.threshold, acquisitionVmax: get().settings.vmax, source: acqStore.deviceType === 'MOCK' ? 'SIMULATION' : 'REAL', transformation: 'tare-then-flip-v1' },
      frozenPhysicalProfileId: get().physicalProfileId,
      rawFrames: [], liveTrajectory: [],
      sequenceId: get().separateFeet ? get().sequenceId ?? crypto.randomUUID() : null,
      countdown: get().durationSeconds,
      framesCollected: [],
      frameTimestampsMs: [],
      startedAt: new Date().toISOString(),
      stageStartedAt: Date.now(),
      acquisitionSource: acqStore.deviceType === "MOCK" ? "SIMULATION" : "REAL",
      acquisitionTare: acqStore.tareState.active,
      processedResult: null,
      savedExam: null,
      error: null,
    });
  },

  abortAcquisition: (reason) => {
    ++startOperation;
    set({
      step: get().completedStages.length ? 'NEXT_FOOT' : 'CONFIRM',
      liveTrajectory: [],
      isStarting: false,
      stageStartedAt: null,
      cancelModalOpen: false,
      framesCollected: [],
      rawFrames: [],
      frameTimestampsMs: [],
      error: reason || "Aquisição interrompida. Verifique a conexão com o dispositivo.",
    });
  },

  tickPrep: () => {
    const { step, stageStartedAt, prepSeconds, countdown } = get();
    if (step !== "PREPARING" || stageStartedAt === null) return;
    const remaining = Math.max(0, Math.ceil(prepSeconds - (Date.now() - stageStartedAt) / 1000));
    if (remaining !== countdown) set({ countdown: remaining });
    if (remaining === 0) void get().startAcquisition();
  },

  collectFrame: (frameValues, timestampMs) => {
    const { step, stageStartedAt, durationSeconds } = get();
    if (step !== "ACQUIRING" || stageStartedAt === null) return;
    const time = timestampMs ?? Date.now() - stageStartedAt;
    if (time > durationSeconds * 1000 || time < 0) return;
    if (frameValues.length !== 225 || frameValues.some((v) => !Number.isFinite(v) || v < 0)) return;
    if (get().framesCollected.length >= 10000) { get().abortAcquisition('Limite de 10.000 quadros atingido. Repita com duração menor.'); return; }
    const cop = calculateCop(frameValues, get().settings.threshold);
    set((state) => ({ liveTrajectory: [...state.liveTrajectory, {timestampMs: time, x: cop?.x ?? null, y: cop?.y ?? null}], framesCollected: [...state.framesCollected, [...frameValues]], frameTimestampsMs: [...state.frameTimestampsMs, time] }));
  },

  tickAcquisition: (elapsedMs) => {
    const { step, stageStartedAt, durationSeconds, countdown } = get();
    if (step !== "ACQUIRING" || stageStartedAt === null) return;
    const remaining = Math.max(0, Math.ceil(durationSeconds - (elapsedMs ?? Date.now() - stageStartedAt) / 1000));
    if (remaining !== countdown) set({ countdown: remaining });
    if (remaining === 0) get().finishAcquisition();
  },

  finishAcquisition: () => {
    const { step, selectedPatient, framesCollected, frameTimestampsMs, durationSeconds, settings, startedAt, acquisitionSource, acquisitionTare } = get();
    if (step !== "ACQUIRING" || !selectedPatient) return;
    if (!framesCollected.length) {
      get().abortAcquisition("Nenhum quadro válido recebido durante o exame. Verifique o dispositivo e repita.");
      return;
    }
    const fps = framesCollected.length / durationSeconds;

    const processed = processExamSample({
      patientId: selectedPatient.id,
      frames: framesCollected,
      frameTimestampsMs,
      durationSeconds,
      fps: Math.round(fps * 10) / 10,
      settings,
      tareApplied: acquisitionTare,
      source: acquisitionSource,
      startedAt: startedAt || new Date().toISOString(),
    });
    if (get().frozenPhysicalProfileId) {
      if (get().rawFrames.length !== framesCollected.length) { get().abortAcquisition("Coleta física incompleta. Repita o exame."); return; }
      processed.examInput.physicalProfileId = get().frozenPhysicalProfileId;
      processed.examInput.rawFrames = get().rawFrames;
    }
    const meta = get().seriesMetadata;
    if (meta) {
      if (get().rawFrames.length !== framesCollected.length) { get().abortAcquisition('Série temporal incompleta. Repita o exame.'); return; }
      processed.examInput.analysis = { version: ANALYSIS_VERSION, acquisition: { foot: get().foot, sequenceId: get().sequenceId, stage: get().completedStages.length + 1, totalStages: get().separateFeet ? 2 : 1, order: get().separateFeet ? (get().completedStages.length ? [get().foot === 'left' ? 'right' : 'left', get().foot] : [get().foot, get().foot === 'left' ? 'right' : 'left']) : [get().foot] }, conditions: structuredClone(get().frozenConditions ?? unknownConditions()), events: [...get().events], regions: [], series: {...meta, frameCount: framesCollected.length}, quality: acquisitionQuality(get().rawFrames, meta, durationSeconds * 1000, get().invalidFrameCount) };
      if (!get().frozenPhysicalProfileId) processed.examInput.seriesFrames = get().rawFrames;
    }

    set({
      step: "RESULT",
      countdown: 0,
      stageStartedAt: null,
      cancelModalOpen: false,
      processedResult: processed,
      error: null,
    });
  },

  saveExam: async () => {
    if (get().savedExam && get().step === "SAVED") return get().savedExam!;
    const { processedResult, isSaving } = get();
    if (isSaving) throw new Error("Salvamento em andamento.");
    if (!processedResult) {
      throw new Error("Nenhum resultado processado para salvar.");
    }

    set({ isSaving: true, error: null });

    try {
      if (processedResult.examInput.analysis) processedResult.examInput.analysis.events = [...get().events];
      if (get().separateFeet && get().completedStages.length !== 1) throw new Error('Adquira o segundo pé antes de salvar a sequência.');
      const savedExams = get().separateFeet
        ? await api.exams.createSequence([...get().completedStages.map(r => r.examInput), processedResult.examInput])
        : [await api.exams.create(processedResult.examInput)];
      const saved = savedExams[savedExams.length - 1];
      set({ savedExams });
      set({
        step: "SAVED",
        savedExam: saved,
        isSaving: false,
        error: null,
      });
      return saved;
    } catch (err) {
      const msg = errorMessage(err) || "O exame foi processado, mas não pôde ser salvo. Tente novamente.";
      set({ isSaving: false, error: msg });
      throw err;
    }
  },

  openCancelModal: () => set({ cancelModalOpen: true }),
  closeCancelModal: () => set({ cancelModalOpen: false }),

  confirmCancel: () => {
    ++startOperation;
    set({
      step: "CONFIRM",
      foot: get().completedStages[0]?.examInput.analysis?.acquisition?.foot ?? get().foot,
      completedStages: [], sequenceId: null, liveTrajectory: [],
      cancelModalOpen: false,
      framesCollected: [],
      rawFrames: [],
      frameTimestampsMs: [],
      processedResult: null,
      stageStartedAt: null,
      isStarting: false,
      error: null,
    });
  },

  resetExam: () => {
    if (get().isSaving) return;
    ++startOperation;
    set({
      step: "SELECT_PATIENT",
      foot: 'both', separateFeet: false, sequenceId: null, completedStages: [], savedExams: [], liveTrajectory: [],
      conditions: unknownConditions(), frozenConditions: null, events: [], invalidFrameCount: 0, seriesMetadata: null,
      physicalProfileId: null,
      frozenPhysicalProfileId: null,
      rawFrames: [],
      selectedPatient: null,
      durationSeconds: usePreferencesStore.getState().durationSeconds,
      prepSeconds: 5,
      countdown: 5,
      framesCollected: [],
      frameTimestampsMs: [],
      startedAt: null,
      stageStartedAt: null,
      isStarting: false,
      settings: { ...useVisualizationStore.getState().settings },
      isSaving: false,
      error: null,
      cancelModalOpen: false,
      processedResult: null,
      savedExam: null,
    });
  },

  setDurationSeconds: (sec) => {
    if (get().step !== "CONFIRM" || get().completedStages.length || get().isStarting || !Number.isFinite(sec)) return;
    set({ durationSeconds: sec === 45 ? 45 : 30 });
  },

  updateSettings: (partial) => {
    const state = get();
    if (state.isStarting || state.isSaving) return;
    if (state.step === "CONFIRM") {
      const settings = sanitizeSettings(partial, state.settings);
      set({ settings });
      useVisualizationStore.getState().setSettings(settings);
    } else if (state.step === "RESULT" && state.processedResult) {
      // O contato e as métricas pertencem à coleta. Editar a aparência não
      // reprocessa amostras, trajetória nem dados de calibração física.
      const settings = sanitizeSettings({
        ...partial,
        threshold: state.processedResult.examInput.threshold,
        mode: "MANUAL",
      }, state.settings);
      const processedResult = {
        ...state.processedResult,
        examInput: {
          ...state.processedResult.examInput,
          gamma: settings.gamma,
          vmax: settings.vmax,
          smoothing: settings.smoothing,
          visualizationSettings: { ...settings },
        },
      };
      set({ settings, processedResult });
      const visual = useVisualizationStore.getState();
      // Preserva o limiar atual dos próximos exames, mesmo se a Análise
      // tiver sido ajustada após esta coleta.
      visual.setSettings({ ...settings, threshold: visual.settings.threshold });
    }
  },
}));

// Configuração compartilhada também quando o usuário vai à Análise e
// retorna a um exame ainda em preparação. A coleta e o histórico ficam fixos.
useVisualizationStore.subscribe(({ settings }) => {
  const state = useNewExamStore.getState();
  if (state.step === "CONFIRM" && !state.isStarting && !state.isSaving) {
    useNewExamStore.setState({ settings: { ...settings } });
  }
});
