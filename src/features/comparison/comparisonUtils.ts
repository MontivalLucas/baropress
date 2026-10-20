import { DEFAULT_HEATMAP_SETTINGS } from "@/services/baropodometry";
import type { ExamDetails } from "@/types";
export function validateComparison(exams: ExamDetails[]): string | null {
    if (exams.length < 2 || exams.length > 4)
        return "Selecione de 2 a 4 exames.";
    if (new Set(exams.map((e) => e.id)).size !== exams.length)
        return "Selecione exames diferentes.";
    if (exams.some((e) => e.patientId !== exams[0].patientId))
        return "Os exames devem ser do mesmo paciente.";
    if (exams.some((e) => e.status !== "completed" || e.matrix.length !== 225 || e.matrix.some((v) => !Number.isFinite(v) || v < 0 || v > 4095)))
        return "Um dos exames não possui uma amostra completa e válida.";
    return null;
}
export function commonMapSettings(exams: ExamDetails[]) {
    return { ...DEFAULT_HEATMAP_SETTINGS, vmax: Math.max(500, ...exams.map((e) => e.vmax ?? DEFAULT_HEATMAP_SETTINGS.vmax)), threshold: exams[0]?.threshold ?? DEFAULT_HEATMAP_SETTINGS.threshold };
}
export function metricDelta(first: number | null, last: number | null) {
    if (first === null || last === null || !Number.isFinite(first) || !Number.isFinite(last))
        return null;
    return { absolute: last - first, percent: first === 0 ? null : (last - first) / Math.abs(first) * 100 };
}
export function chronologicalExams(exams: ExamDetails[]) {
    const timestamp = (e: ExamDetails) => { const start = Date.parse(e.startedAt ?? ''); const created = Date.parse(e.createdAt); return Number.isFinite(start) ? start : Number.isFinite(created) ? created : Number.MAX_SAFE_INTEGER; };
    return [...exams].sort((a, b) => timestamp(a) - timestamp(b) || a.id - b.id);
}
export function comparisonLimits(exams: ExamDetails[]): string[] {
    if (!exams.length) return [];
    const reasons: string[]=[];
    if (exams.some(e=>!e.analysis)) reasons.push('Metadados de método/condições ausentes em exame legado.');
    for (const key of ['source','type','threshold'] as const) if (new Set(exams.map(e=>e[key])).size>1) reasons.push(`Diferença de ${key}: comparação quantitativa indisponível.`);
    if(new Set(exams.map(e=>e.analysis?.version)).size>1) reasons.push('Versões de análise diferentes.');
    if (new Set(exams.map(e => e.analysis?.acquisition?.foot ?? 'unknown')).size > 1) reasons.push('Modalidades/pés diferentes: comparação quantitativa indisponível.');
    if (new Set(exams.map(e => e.duration)).size > 1) reasons.push('Durações de coleta diferentes: equivalência não estabelecida.');
    const conditions=exams.map(e=>e.analysis?.conditions);
    if(conditions.some(c=>!c || c.visual==='unknown' || c.posture==='unknown' || c.support==='unknown' || !c.protocol || !c.protocolVersion || !c.positioning)) reasons.push('Condições ou protocolo não informados; equivalência não estabelecida.');
    if(new Set(conditions.map(c=>JSON.stringify(c && {visual:c.visual,posture:c.posture,support:c.support,positioning:c.positioning,protocol:c.protocol,version:c.protocolVersion}))).size>1) reasons.push('Condições de coleta diferentes.');
    return reasons;
}
export function regionalComparisonLimits(exams:ExamDetails[]):string[] {
    const reasons=comparisonLimits(exams), revisions=exams.map(e=>e.analysis?.regions.slice(-1)[0]);
    if(revisions.some(r=>!r)) reasons.push('Regiões não definidas em todos os exames.');
    if(new Set(revisions.map(r=>r && JSON.stringify({mode:r.mode,version:r.version,masks:r.masks}))).size>1) reasons.push('Modo, método ou máscaras de regiões diferentes.');
    if(revisions.some(r=>r?.mode!=='mean')) reasons.push('Comparação regional disponível somente no modo médio; revisar quadros/máximos individualmente.');
    return reasons;
}
