import type { Trial } from "./types";
/** Describe variation across independent reapplications, without assigning local truth. */
export function characterizeTrials(trials: Trial[], sensor: number) {
    const groups = new Map<string, Trial[]>();
    for (const t of trials.filter(t => t.state === "ACCEPTED" && t.summary)) {
        const s = t.spec;
        const key = JSON.stringify([t.source, s.kind, s.inputValue, s.inputUnit, s.applicatorKg, s.areaMm2, s.position, s.baselineTrialId, s.protocol]);
        groups.set(key, [...(groups.get(key) ?? []), t]);
    }
    return [...groups.values()].map(items => {
        const values = items.map(t => t.summary!.means[sensor]), mean = values.reduce((a, b) => a + b, 0) / values.length;
        const sd = values.length > 1 ? Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1)) : null;
        const direction = (d: string) => { const subset = items.filter(t => t.spec.direction === d); return subset.length ? subset.reduce((s, t) => s + t.summary!.means[sensor], 0) / subset.length : null; };
        const up = direction("UP"), down = direction("DOWN");
        return { source: items[0].source, reference: items[0].spec.inputValue, unit: items[0].spec.inputUnit, position: items[0].spec.position, repetitions: items.length, meanAdc: mean, reapplicationSdAdc: sd, hysteresisAdc: up === null || down === null ? null : Math.abs(up - down), driftMaxAdc: Math.max(...items.map(t => Math.abs(t.summary!.drift[sensor]))), trialIds: items.map(t => t.id) };
    });
}
