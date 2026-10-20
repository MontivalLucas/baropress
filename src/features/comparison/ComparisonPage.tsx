import { acquisitionLabel } from '@/services/examProtocol';
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/database/api";
import { Button } from "@/components/ui/controls";
import { BaropodometricHeatmap } from "@/features/baropodometry/BaropodometricHeatmap";
import { PressureLegend } from "@/features/baropodometry/PressureLegend";
import { DEFAULT_HEATMAP_SETTINGS } from "@/services/baropodometry";
import { formatDateTime } from "@/features/patients/patientUtils";
import type { ExamDetails, ExamSummary, PatientSummary } from "@/types";
import { comparisonLimits,regionalComparisonLimits,chronologicalExams, commonMapSettings, metricDelta, validateComparison } from "./comparisonUtils";
import { ListPagination } from "@/components/ui/ListPagination";
import { AnalysisReview } from '@/features/exams/AnalysisReview';
import { analysisLines } from '@/services/examAnalysis/report';
import { regionIndicators } from '@/services/examAnalysis/calculations';
const colors = ["#60a5fa", "#f59e0b", "#10b981", "#a78bfa"];
const metrics: {
    label: string;
    key: keyof ExamDetails;
    unit: string;
}[] = [
    { label: "Leitura máxima", key: "maxPressure", unit: "ADC" }, { label: "Leitura média", key: "meanPressure", unit: "ADC" },
    { label: "Sensores em contato", key: "contactAreaPercent", unit: "%" }, { label: "Carga na metade esquerda", key: "leftPercent", unit: "%" },
    { label: "Carga na metade direita", key: "rightPercent", unit: "%" }, { label: "Centro ADC X", key: "copX", unit: "coluna" }, { label: "Centro ADC Y", key: "copY", unit: "linha" },
];
function EvolutionChart({ exams, metric }: {
    exams: ExamDetails[];
    metric: typeof metrics[number];
}) {
    const values = exams.map((e) => typeof e[metric.key] === "number" ? e[metric.key] as number : null);
    const max = Math.max(1, ...values.map((v) => v ?? 0));
    const dates = exams.map((e) => { const t = Date.parse(e.startedAt ?? ''); return Number.isFinite(t) ? t : Date.parse(e.createdAt); });
    const useDates = dates.every(Number.isFinite) && new Set(dates).size > 1;
    const times = useDates ? dates : exams.map((_, i) => i);
    const span = Math.max(1, times[times.length - 1] - times[0]);
    const points = values.map((v, i) => v === null ? null : [40 + (times[i] - times[0]) / span * 520, 130 - v / max * 100]);
    const delta = comparisonLimits(exams).length ? null : metricDelta(values[0], values[values.length - 1]);
    return <section className="bg-surface border border-line rounded-xl p-4 space-y-2">
    <h3 className="font-semibold">{metric.label} ({metric.unit})</h3>
    <svg role="img" aria-label={`Evolução de ${metric.label} por data; valores na tabela comparativa`} viewBox="0 0 610 170" className="w-full">
      <path d="M40 20V130H575" fill="none" stroke="currentColor" opacity="0.3"/>
      <text x="4" y="28" fill="currentColor" fontSize="12">{max.toFixed(0)}</text><text x="20" y="132" fill="currentColor" fontSize="12">0</text>
      {points.map((p, i) => p && <g key={exams[i].id}>
        {i > 0 && points[i - 1] && <line x1={points[i - 1]![0]} y1={points[i - 1]![1]} x2={p[0]} y2={p[1]} stroke="currentColor"/>}
        <circle cx={p[0]} cy={p[1]} r="5" fill={colors[i]}/><text x={p[0]} y={p[1] - 10} textAnchor="middle" fill="currentColor" fontSize="12">{values[i]?.toFixed(1)}</text>
        <text x={p[0]} y="154" textAnchor="middle" fill="currentColor" fontSize="11">#{exams[i].id}</text>
      </g>)}
    </svg>
    <p className="text-xs text-mute">{useDates ? 'Eixo horizontal por data.' : 'Eixo horizontal por ordem dos exames; datas ausentes ou iguais.'} Variação entre primeiro e último: {delta ? `${delta.absolute >= 0 ? "+" : ""}${delta.absolute.toFixed(1)} ${metric.unit}${delta.percent !== null ? ` (${delta.percent.toFixed(1)}%)` : ""}` : "indisponível"}. A variação não constitui diagnóstico.</p>
  </section>;
}
export function ComparisonPage({ initialPatientId }: {
    initialPatientId?: number | null;
}) {
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [patientId, setPatientId] = useState(initialPatientId ?? 0);
    const [list, setList] = useState<ExamSummary[]>([]);
    const [ids, setIds] = useState<number[]>([]);
    const [exams, setExams] = useState<ExamDetails[]>([]);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [commonScale, setCommonScale] = useState(true);
    const [listPage, setListPage] = useState(0);
    const ordered = useMemo(() => chronologicalExams(exams), [exams]);
    const common = commonMapSettings(ordered);
    useEffect(() => {
        let live = true;
        api.patients.list().then((p) => {
            if (live)
                setPatients(p);
        }).catch((e) => {
            if (live)
                setError(e.message);
        });
        return () => { live = false; };
    }, []);
    useEffect(() => {
        let live = true;
        setList([]);
        setError("");
        if (patientId) {
            setBusy(true);
            api.exams.list(undefined, { limit: 51, offset: listPage * 50, patientId }).then((data) => {
                if (live)
                    setList(data.filter((e) => e.patientId === patientId && e.status === "completed"));
            }).catch((e) => {
                if (live)
                    setError(e.message);
            }).finally(() => {
                if (live)
                    setBusy(false);
            });
        } else setBusy(false);
        return () => { live = false; };
    }, [patientId, listPage]);
    async function compare() {
        setBusy(true);
        setError("");
        setExams([]);
        try {
            const data = await Promise.all(ids.map(api.exams.get));
            const validation = validateComparison(data);
            if (validation)
                throw new Error(validation);
            setExams(data);
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
    <header><h1 className="text-2xl font-semibold">Comparação e evolução</h1><p className="text-sm text-mute">Selecione de 2 a 4 exames do mesmo paciente para comparar dados registrados.</p></header>
    {error && <p role="alert" className="text-danger">{error}</p>}
    <label className="block text-sm space-y-1">Paciente<select aria-label="Paciente para comparação" disabled={busy} value={patientId} onChange={(e) => { setIds([]); setExams([]); setListPage(0); setPatientId(Number(e.target.value)); }} className="block w-full max-w-xl border border-line rounded-lg p-2 bg-surface"><option value="0">Selecione</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">{list.slice(0, 50).map((e) => <label key={e.id} className="bg-surface border border-line rounded-lg p-3 text-sm flex items-start gap-2"><input type="checkbox" checked={ids.includes(e.id)} disabled={busy || (!ids.includes(e.id) && ids.length >= 4)} onChange={() => { setIds((prev) => prev.includes(e.id) ? prev.filter((id) => id !== e.id) : [...prev, e.id]); setExams([]); }}/><span>#{e.id} · {formatDateTime(e.startedAt)}<small className="block text-mute">{e.source} · {e.type === "static" ? "Estático" : "Dinâmico"}</small></span></label>)}</div>
    {patientId > 0 && <ListPagination page={listPage} count={Math.min(50, list.length)} hasNext={list.length > 50} loading={busy} onChange={setListPage} />}
    {patientId > 0 && !busy && listPage === 0 && list.length < 2 && <p className="text-mute">São necessários pelo menos dois exames concluídos deste paciente.</p>}
    <Button onClick={compare} disabled={busy || ids.length < 2}>{busy ? "Carregando..." : `Comparar ${ids.length} exames`}</Button>
    {ordered.length > 0 && <>
      {comparisonLimits(ordered).length>0 && <p role="status" className="text-warn text-sm">Deltas quantitativos indisponíveis: {comparisonLimits(ordered).join(' ')}</p>}
      <details><summary>Condições, qualidade e regiões de cada exame</summary>{ordered.map(e=><div className="p-3 border border-line text-xs" key={e.id}><h3>Exame #{e.id}</h3>{analysisLines(e).map((line,i)=><p key={i}>{line}</p>)}</div>)}</details>
      {regionalComparisonLimits(ordered).length===0?<div className="overflow-x-auto text-xs"><table><caption>Comparação regional compatível · mapa médio ADC · mesmos sensores atribuídos</caption><thead><tr><th>Exame</th><th>Esquerdo (% atribuído)</th><th>Direito (% atribuído)</th><th>Não atribuído (% geral)</th></tr></thead><tbody>{ordered.map(e=>{const r=regionIndicators(e.matrix,e.threshold!,e.analysis!.regions.slice(-1)[0]);return <tr key={e.id}><td>#{e.id}</td><td>{r.leftAssignedPercent?.toFixed(2)??'—'}</td><td>{r.rightAssignedPercent?.toFixed(2)??'—'}</td><td>{r.unassignedPercent?.toFixed(2)??'—'}</td></tr>})}</tbody></table></div>:<p className="text-xs">Comparação regional indisponível: {regionalComparisonLimits(ordered).join(' ')}</p>}
      {(new Set(ordered.map((e) => e.source)).size > 1 || new Set(ordered.map((e) => e.type)).size > 1 || new Set(ordered.map((e) => e.threshold)).size > 1) && <p role="status" className="text-warn">Os exames têm origens, protocolos ou limiares diferentes. Considere essas diferenças ao interpretar as métricas.</p>}
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={commonScale} onChange={(e) => setCommonScale(e.target.checked)}/>Usar a mesma escala visual nos mapas (métricas originais preservadas)</label>
      <div className={`grid gap-4 md:grid-cols-2 ${ordered.length > 2 ? "xl:grid-cols-4" : ""}`}>{ordered.map((e, i) => {
                const config = commonScale ? {...common,threshold:e.threshold??150} : { ...DEFAULT_HEATMAP_SETTINGS, ...e.visualizationSettings, gamma: e.gamma ?? 1.3, vmax: e.vmax ?? 2200, threshold: e.threshold ?? 150, smoothing: e.smoothing ?? 0.35 };
                return <section key={e.id} className="border border-line bg-surface rounded-xl p-3 space-y-2">
        <h2 className="font-semibold" style={{ color: colors[i] }}>#{e.id} · {e.source}</h2><p className="text-xs text-mute">{formatDateTime(e.startedAt)}</p><p className="text-xs break-words">{acquisitionLabel(e.analysis?.acquisition)} · {e.duration ?? "—"} s</p>
        <div className="aspect-square"><BaropodometricHeatmap values={e.matrix} config={config} cop={e.copX != null && e.copY != null ? { x: e.copX, y: e.copY } : null}/></div><PressureLegend vmax={config.vmax}/>
        <details><summary className="text-xs">Revisar série e trajetória</summary><AnalysisReview exam={e}/></details>
      </section>;
            })}</div>
      <div className="overflow-x-auto"><table className="w-full text-sm text-left"><caption className="text-left font-semibold pb-2">Métricas salvas por exame, em ordem cronológica</caption><thead><tr><th className="p-2">Indicador</th>{ordered.map((e) => <th className="p-2" key={e.id}>#{e.id}</th>)}</tr></thead><tbody>{metrics.map((m) => <tr key={m.key} className="border-t border-line"><th className="p-2 font-medium">{m.label} ({m.unit})</th>{ordered.map((e) => <td className="p-2" key={e.id}>{typeof e[m.key] === "number" ? (e[m.key] as number).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : "—"}</td>)}</tr>)}</tbody></table></div>
      <div className="grid md:grid-cols-2 gap-4">{metrics.map((m) => <EvolutionChart key={m.key} exams={ordered} metric={m}/>)}</div>
    </>}
  </div>;
}
