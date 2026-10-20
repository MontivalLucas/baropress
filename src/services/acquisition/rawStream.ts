import type { SensorFrame } from "./types";
type Listener = (frame: SensorFrame, receivedMs: number) => void;
const listeners = new Set<Listener>();
const invalidListeners = new Set<(receivedMs: number) => void>();
export function subscribeInvalidFrames(listener: (receivedMs: number) => void) { invalidListeners.add(listener); return () => { invalidListeners.delete(listener); }; }
export function publishInvalidFrame() { const now = performance.now(); invalidListeners.forEach(fn => fn(now)); }
let lease: {
    owner: "calibration" | "exam";
    token: symbol;
} | null = null;
export function subscribeRawFrames(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function publishRawFrame(frame: SensorFrame) {
    const now = performance.now();
    for (const listener of listeners) {
        try {
            listener({ ...frame, values: [...frame.values] }, now);
        }
        catch (e) {
            console.error("Falha no consumidor de aquisição", e);
        }
    }
}
export function acquireLease(owner: "calibration" | "exam") {
    if (lease)
        throw new Error("Há uma coleta em andamento. Conclua ou interrompa antes de iniciar outra.");
    const token = Symbol(owner);
    lease = { owner, token };
    return () => { if (lease?.token === token)
        lease = null; };
}
export function acquisitionOwner() { return lease?.owner ?? null; }
export function assertConfigurationUnlocked() { if (lease)
    throw new Error("Configuração congelada durante a coleta."); }
