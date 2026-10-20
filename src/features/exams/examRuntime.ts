import { useAcquisitionStore } from "@/stores/acquisition";
import { useNewExamStore } from "./examStore";
import { applyTare, normalizeMatrixOrientation, type SensorDevice } from "@/services/acquisition";
import { acquireLease, subscribeRawFrames, subscribeInvalidFrames } from "@/services/acquisition/rawStream";
import { correctedFrame } from '@/services/examAnalysis/calculations';

/** Relógio independente dos renders e coleta somente quadros novos do dispositivo. */
export function startExamRuntime(): () => void {
  let device: SensorDevice | null = null;
  let unsubscribeFrames: (() => void) | undefined;
  let release: (() => void) | undefined;
  let origin = 0;
  const syncDevice = () => {
    const exam = useNewExamStore.getState();
    const current = useAcquisitionStore.getState();
    if (exam.step === "PREPARING" || exam.step === "ACQUIRING") {
      if (!release) { try { release = acquireLease("exam"); } catch (e) { exam.abortAcquisition(e instanceof Error ? e.message : String(e)); return; } }
    } else { release?.(); release = undefined; }
    if ((exam.step === "ACQUIRING" || exam.step === "PREPARING") &&
      (!current.status.connected || !current.status.acquiring)) {
      exam.abortAcquisition("Aquisição interrompida. Verifique a conexão e repita o exame.");
      return;
    }
    const nextDevice = exam.step === "ACQUIRING" ? current.activeDevice : null;
    if (nextDevice === device) return;
    unsubscribeFrames?.();
    device = nextDevice;
    origin = performance.now();
    unsubscribeFrames = device ? subscribeRawFrames((frame, receivedMs) => {
      const state = useNewExamStore.getState();
      const elapsed = receivedMs - origin;
      if (state.step !== "ACQUIRING" || state.stageStartedAt === null || elapsed > state.durationSeconds * 1000) return;
      if (frame.source !== state.acquisitionSource) { state.abortAcquisition("Origem alterada durante exame."); return; }
      if(frame.values.length!==225 || frame.values.some(v=>!Number.isInteger(v) || v<0 || v>4095)) {state.collectInvalidFrame();return;}
      const tare = useAcquisitionStore.getState().tareState;
      const raw = { values: [...frame.values], sequence: frame.sequence ?? null, receivedMs: elapsed };
      const values = state.seriesMetadata ? correctedFrame(raw,state.seriesMetadata) : normalizeMatrixOrientation(applyTare(frame.values,tare.baseline,tare.active));
      const before = state.framesCollected.length;
      state.collectFrame(values, elapsed);
      if (useNewExamStore.getState().framesCollected.length === before + 1) useNewExamStore.getState().collectRawFrame(raw);
    }) : undefined;
  };
  const unsubscribeDevice = useAcquisitionStore.subscribe(syncDevice);
  const unsubscribeExam = useNewExamStore.subscribe(syncDevice);
  syncDevice();
  const unsubscribeInvalid = subscribeInvalidFrames(time => { const exam = useNewExamStore.getState(); if (exam.step === 'ACQUIRING' && time-origin <= exam.durationSeconds*1000) exam.collectInvalidFrame(); });
  const timer = setInterval(() => {
    const exam = useNewExamStore.getState();
    if (exam.step === "PREPARING") exam.tickPrep();
    if (exam.step === "ACQUIRING" && exam.stageStartedAt !== null) {
      const lastValidMs = exam.frameTimestampsMs[exam.frameTimestampsMs.length - 1] ?? 0;
      if (performance.now() - origin - lastValidMs > 2000) {
        exam.abortAcquisition("Sem quadros válidos por mais de 2 segundos. Verifique a conexão e repita a coleta completa.");
      } else exam.tickAcquisition(performance.now() - origin);
    }
  }, 100);

  return () => {
    clearInterval(timer);
    unsubscribeDevice();
    unsubscribeExam();
    unsubscribeFrames?.();
    unsubscribeInvalid();
    release?.(); release = undefined;
    const exam = useNewExamStore.getState();
    if (exam.step === "PREPARING" || exam.step === "ACQUIRING" || exam.isStarting) {
      exam.abortAcquisition("Exame interrompido ao sair da tela. Repita a aquisição.");
    }
  };
}
