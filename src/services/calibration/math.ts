import type { Knot, PhysicalFrame, Profile, RawFrame, Summary } from "./types";
export const G0 = 9.80665;
export const kgToN = (kg: number) => kg * G0;
export const nToKgf = (n: number) => n / G0;
export const kpaToKgfCm2 = (kpa: number) => kpa / 98.0665;
export function interpolateCurve(knots: Knot[] | null, x: number): number | null {
    if (!knots || knots.length < 2 || !Number.isFinite(x) || x < knots[0].x || x > knots[knots.length - 1].x)
        return null;
    for (let i = 1; i < knots.length; i++) {
        const a = knots[i - 1], b = knots[i];
        if (b.x <= a.x || b.y < a.y)
            return null;
        if (x <= b.x)
            return a.y + (b.y - a.y) * (x - a.x) / (b.x - a.x);
    }
    return null;
}
export function summarizeFrames(frames: RawFrame[]): Summary {
    const n = frames.length;
    if (!n)
        throw new Error("Nenhum quadro recebido.");
    const means = Array(225).fill(0), sd = Array(225).fill(0), min = Array(225).fill(Infinity), max = Array(225).fill(-Infinity);
    const saturated = Array(225).fill(0), drift = Array(225).fill(0);
    const intervals: number[] = [];
    let sequenceGaps = 0, duplicates = 0;
    frames.forEach((f, k) => {
        if (f.values.length !== 225 || f.values.some(v => !Number.isInteger(v) || v < 0 || v > 4095) || !Number.isFinite(f.receivedMs) || f.receivedMs < 0)
            throw new Error("Quadro bruto inválido.");
        if (k) {
            if (f.receivedMs < frames[k - 1].receivedMs)
                throw new Error("Tempo não monotônico.");
            intervals.push(f.receivedMs - frames[k - 1].receivedMs);
            const prev = frames[k - 1].sequence;
            if (f.sequence !== null && prev !== null) {
                if (f.sequence <= prev)
                    duplicates++;
                else
                    sequenceGaps += Math.max(0, f.sequence - prev - 1);
            }
        }
        f.values.forEach((v, i) => { const d = v - means[i]; means[i] += d / (k + 1); sd[i] += d * (v - means[i]); min[i] = Math.min(min[i], v); max[i] = Math.max(max[i], v); if (v >= 4090)
            saturated[i]++; });
    });
    const window = Math.max(1, Math.floor(n / 4));
    for (let i = 0; i < 225; i++) {
        sd[i] = Math.sqrt(sd[i] / Math.max(1, n - 1));
        drift[i] = (frames.slice(-window).reduce((s, f) => s + f.values[i], 0) - frames.slice(0, window).reduce((s, f) => s + f.values[i], 0)) / window;
    }
    const durationMs = frames[n - 1].receivedMs - frames[0].receivedMs;
    const intervalMeanMs = intervals.reduce((s, v) => s + v, 0) / Math.max(1, intervals.length);
    const intervalSdMs = Math.sqrt(intervals.reduce((s, v) => s + (v - intervalMeanMs) ** 2, 0) / Math.max(1, intervals.length - 1));
    return { count: n, durationMs, fps: durationMs > 0 ? (n - 1) * 1000 / durationMs : 0, intervalMeanMs, intervalSdMs, means, sd, min, max, drift, saturated, sequenceGaps, duplicates };
}
export function convertFrame(values: number[], profile: Profile): PhysicalFrame {
    const pressureKPa: (number | null)[] = Array(225).fill(null), statuses = Array(225).fill("INVALID");
    const empty: PhysicalFrame = { pressureKPa, statuses, totalForceN: null, partialForceN: null, meanPressureKPa: null, maxPressureKPa: null, contactAreaCm2: null, copMm: null, complete: false };
    if (values.length !== 225 || values.some(v => !Number.isFinite(v) || v < 0 || v > 4095))
        return empty;
    if (profile.scope === "TOTAL_FORCE_ONLY") {
        if (values.some(v => v >= 4090))
            return empty;
        if (values.some((v, i) => v - profile.baseline[i] < -profile.noise[i]))
            return empty;
        const x = values.reduce((s, v, i) => s + Math.max(0, v - profile.baseline[i] - profile.noise[i]), 0);
        const totalForceN = interpolateCurve(profile.curves[0], x);
        return { ...empty, totalForceN, complete: totalForceN !== null };
    }
    let force = 0, area = 0, peak = 0, mx = 0, my = 0, complete = true;
    values.forEach((raw, i) => {
        const cell = profile.mat.cells[i];
        if (!cell?.enabled || cell.areaMm2 === null || cell.xMm === null || cell.yMm === null || !profile.curves[i]) {
            complete = false;
            return;
        }
        const x = raw - profile.baseline[i];
        if (raw >= 4090) {
            statuses[i] = "SATURATED";
            complete = false;
            return;
        }
        if (x < -profile.noise[i]) {
            statuses[i] = "BASELINE_DRIFT";
            complete = false;
            return;
        }
        const p = x <= profile.noise[i] ? 0 : interpolateCurve(profile.curves[i], x - profile.noise[i]);
        if (p === null) {
            statuses[i] = "OUT_OF_RANGE";
            complete = false;
            return;
        }
        pressureKPa[i] = p;
        statuses[i] = p > 0 ? "VALID" : "NO_CONTACT";
        const f = p * cell.areaMm2 / 1000;
        force += f;
        mx += cell.xMm * f;
        my += cell.yMm * f;
        if (p > 0) {
            area += cell.areaMm2;
            peak = Math.max(peak, p);
        }
    });
    return { pressureKPa, statuses, totalForceN: complete ? force : null, partialForceN: force, complete, meanPressureKPa: complete && area ? force * 1000 / area : null, maxPressureKPa: complete ? peak : null, contactAreaCm2: complete ? area / 100 : null, copMm: complete && force > 0 ? { x: mx / force, y: my / force } : null };
}
