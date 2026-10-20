import { create } from "zustand";
import { api } from "@/services/database/api";
import type { CalibrationData, Trial, TrialSpec } from "@/services/calibration/types";
import { TrialRecorder } from "@/services/calibration/recorder";
import { acquireLease, subscribeRawFrames } from "@/services/acquisition/rawStream";
import { useAcquisitionStore } from "./acquisition";
interface Store extends CalibrationData {
    busy: boolean;
    activeTrial: Trial | null;
    elapsed: number;
    captured: number;
    error: string;
    refresh: () => Promise<void>;
    begin: (matId: string, spec: TrialSpec) => Promise<void>;
    finish: (reason?: string) => Promise<void>;
}
let recorder: TrialRecorder | null = null;
let release: (() => void) | null = null;
let stopFrames: (() => void) | null = null;
let stopStatus: (() => void) | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let finishing: Promise<void> | null = null;
export const useCalibrationStore = create<Store>((set, get) => ({
    mats: [], trials: [], profiles: [], busy: false, activeTrial: null, elapsed: 0, captured: 0, error: "",
    refresh: async () => { const data = await api.calibration.list(); set(data); },
    begin: async (matId, spec) => {
        if (get().busy)
            throw new Error("Coleta já ativa.");
        const unlock = acquireLease("calibration");
        release = unlock;
        set({ busy: true, error: "", elapsed: 0, captured: 0 });
        try {
            if (!useAcquisitionStore.getState().status.connected)
                await useAcquisitionStore.getState().connect();
            if (!useAcquisitionStore.getState().status.acquiring)
                await useAcquisitionStore.getState().startAcquisition();
            const acq = useAcquisitionStore.getState();
            if (!acq.status.connected || !acq.status.acquiring || acq.tareState.isZeroing)
                throw new Error("Dispositivo não está adquirindo ou tara em andamento.");
            const source = acq.deviceType === "MOCK" ? "SIMULATION" : "REAL";
            const trial = await api.calibration.begin(crypto.randomUUID(), matId, source, { ...spec, transport: acq.status.transport, port: acq.selectedPort, baudRate: acq.selectedBaud });
            const current = useAcquisitionStore.getState();
            if (!current.status.connected || !current.status.acquiring || current.activeDevice !== acq.activeDevice) {
                await api.calibration.finish(trial.id, "Dispositivo alterado durante a abertura da sessão");
                throw new Error("Dispositivo alterado antes de começar a captura.");
            }
            const start = performance.now();
            set({ activeTrial: trial });
            recorder = new TrialRecorder(trial, start, api.calibration.append, message => { void get().finish(message); });
            stopFrames = subscribeRawFrames((frame, now) => recorder?.push(frame, now));
            const baselineInvalid = acq.status.invalidFrames;
            stopStatus = useAcquisitionStore.subscribe(state => {
                if (!state.status.connected || !state.status.acquiring || state.activeDevice !== acq.activeDevice)
                    void get().finish("Dispositivo desconectado, parado ou alterado.");
                else if (state.status.invalidFrames > baselineInvalid)
                    void get().finish("Quadros inválidos recebidos. Repita a coleta.");
            });
            timer = setInterval(() => {
                const elapsed = (performance.now() - start) / 1000;
                set({ elapsed, captured: recorder?.count ?? 0 });
                void recorder?.flush();
                if (elapsed >= spec.settleSeconds + spec.durationSeconds)
                    void get().finish();
            }, 250);
        }
        catch (e) {
            unlock();
            release = null;
            set({ busy: false, error: e instanceof Error ? e.message : String(e) });
            throw e;
        }
    },
    finish: (reason = "") => {
        if (finishing)
            return finishing;
        const trial = get().activeTrial;
        if (!trial || !get().busy)
            return Promise.resolve();
        finishing = (async () => {
            stopFrames?.();
            stopStatus?.();
            if (timer)
                clearInterval(timer);
            stopFrames = null;
            stopStatus = null;
            timer = null;
            try {
                const failure = await recorder?.stop();
                const result = await api.calibration.finish(trial.id, reason || failure || "");
                set({ activeTrial: result, captured: recorder?.count ?? 0, error: result.state === "INTERRUPTED" ? result.reason : "" });
                await get().refresh();
            }
            catch (e) {
                set({ error: `Coleta incompleta: ${e instanceof Error ? e.message : String(e)}. Reabra o aplicativo se a gravação não puder ser finalizada.` });
            }
            finally {
                recorder = null;
                release?.();
                release = null;
                set({ busy: false });
                finishing = null;
            }
        })();
        return finishing;
    },
}));
