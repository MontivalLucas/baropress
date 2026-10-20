import { useShallow } from "zustand/react/shallow";
import type { PhysicalResult } from "@/services/calibration/types";
import { physicalLines, physicalNumber } from "@/services/calibration/formatting";
import { useEffect, useState } from "react";
import { api } from "@/services/database/api";
import { useNewExamStore } from "@/features/exams/examStore";
import { useAcquisitionStore } from "@/stores/acquisition";
import type { Profile } from "@/services/calibration/types";
import { convertFrame } from "@/services/calibration/math";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
export function PhysicalResults({ result }: {
    result: PhysicalResult | null | undefined;
}) {
    if (!result)
        return <p className="text-xs text-mute">Sem calibração física neste registro. Mapa e métricas originais em ADC relativo.</p>;
    const mat = result.profile.mat, values = result.mean.pressureKPa, vmax = Math.max(1, ...values.filter((n): n is number => n !== null));
    return <section className="rounded-xl border border-line p-4 space-y-3 bg-surface"><h2 className="font-bold">Resultados físicos · {result.quality === "COMPLETE" ? "perfil validado no escopo experimental" : "dados parciais"}</h2><div className="grid md:grid-cols-2 gap-4"><div className="space-y-1 text-sm">{physicalLines(result).map(line => <p key={line}>{line}</p>)}{result.profile.scope === "TOTAL_FORCE_ONLY" && <p>Este perfil estima somente força total. O mapa plantar permanece ADC.</p>}{result.warnings.map(w => <p className="text-xs text-mute" key={w}>{w}</p>)}</div>{result.profile.scope === "LOCAL_PRESSURE" && mat.widthMm && mat.heightMm && <figure><figcaption className="text-sm">Pressão média por ponto · 0 a {physicalNumber(vmax, "kPa")} · cinza: indisponível</figcaption><svg className="w-full max-h-96 rounded-lg bg-slate-950" viewBox={`0 0 ${mat.widthMm} ${mat.heightMm}`} role="img" aria-label="Mapa de pressão física nos centros medidos">{mat.cells.map((cell, i) => cell.xMm !== null && cell.yMm !== null ? <circle key={i} cx={cell.xMm} cy={cell.yMm} r={Math.min(mat.widthMm!, mat.heightMm!) / 40} fill={values[i] === null ? "#71717a" : values[i] === 0 ? "#0f172a" : `hsl(${220 - 220 * values[i]! / vmax},85%,50%)`}><title>Ponto {i}: {physicalNumber(values[i], "kPa")}</title></circle> : null)}{result.mean.copMm && <circle cx={result.mean.copMm.x} cy={result.mean.copMm.y} r={Math.min(mat.widthMm, mat.heightMm) / 70} fill="white" stroke="black"/>}</svg><p className="text-xs text-mute">Marcadores representam pontos discretos; tamanho do desenho não representa área real de contato.</p></figure>}</div></section>;
}
export function PhysicalProfilePicker() {
    const exam = useNewExamStore(useShallow(s => ({ step: s.step, setPhysicalProfileId: s.setPhysicalProfileId })));
    const deviceType = useAcquisitionStore(s => s.deviceType);
    const [profiles, setProfiles] = useState<Profile[]>([]), [error, setError] = useState(""), [candidate, setCandidate] = useState(""), [confirmed, setConfirmed] = useState(false);
    useEffect(() => { void api.clinicalProfiles().then(setProfiles).catch(e => setError(e.message)); }, []);
    useEffect(() => { setConfirmed(false); exam.setPhysicalProfileId(null); }, [candidate, deviceType]);
    if (exam.step !== "CONFIRM")
        return null;
    return <div className="rounded-lg border border-line p-3 text-sm space-y-2"><h2 className="font-semibold">Calibração física do exame (opcional)</h2><select className="rounded-lg border border-line bg-surface p-2 w-full" value={candidate} disabled={deviceType === "MOCK"} onChange={e => setCandidate(e.target.value)}><option value="">Exame em ADC relativo</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.mat.identity} · {p.mat.revision} · firmware {p.mat.firmware} · {p.name}</option>)}</select>{candidate && deviceType !== "MOCK" && <label className="flex gap-2"><input type="checkbox" checked={confirmed} onChange={e => { setConfirmed(e.target.checked); exam.setPhysicalProfileId(e.target.checked ? candidate : null); }}/>Confirmo que o tapete conectado, firmware, geometria e montagem correspondem à revisão deste perfil. O resultado será calculado a partir dos quadros brutos, sem normalização pelo peso.</label>}<p className="text-xs text-mute">Sem confirmação, o exame continua em ADC. Perfis simulados não habilitam unidades físicas.</p>{error && <p role="alert">{error}</p>}</div>;
}
export function LivePhysicalDialog({ onClose }: {
    onClose: () => void;
}) {
    const acq = useAcquisitionStore();
    const [profiles, setProfiles] = useState<Profile[]>([]), [id, setId] = useState(""), [confirmed, setConfirmed] = useState(false), [error, setError] = useState("");
    useDialogFocus(true, onClose);
    useEffect(() => { void api.clinicalProfiles().then(setProfiles).catch(e => setError(e.message)); }, []);
    const profile = profiles.find(p => p.id === id);
    const frame = profile && confirmed && acq.deviceType === "SERIAL" && acq.status.connected && acq.status.acquiring && acq.latestFrame?.source === "REAL" ? convertFrame(acq.latestFrame.values, profile) : null;
    const result: PhysicalResult | null = profile && frame ? { schemaVersion: 1, profile, matId: profile.matId, source: "REAL", averaging: "frame", frameCount: 1, rawRetained: false, mean: frame, peakPressureKPa: frame.maxPressureKPa, quality: frame.complete ? "COMPLETE" : "PARTIAL", warnings: ["Prévia instantânea, sem gravação. Perfil validado no protocolo estático; conversão dinâmica não validada. Neste painel os valores são do quadro atual, não de um exame médio."] } : null;
    return <div className="fixed inset-0 z-50 bg-black/60 p-5 flex items-center justify-center"><div role="dialog" aria-modal="true" aria-labelledby="live-physical-title" tabIndex={-1} className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-xl bg-surface p-5 space-y-4"><div className="flex justify-between"><h2 id="live-physical-title" className="font-bold">Conversão física instantânea</h2><button className="px-3 py-2 border border-line rounded-lg" onClick={onClose}>Fechar</button></div><select className="w-full p-2 rounded-lg border border-line bg-surface" value={id} onChange={e => { setId(e.target.value); setConfirmed(false); }}><option value="">Selecione um perfil ativo</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.mat.identity} · {p.mat.revision} · firmware {p.mat.firmware} · {p.name}</option>)}</select>{profile && <label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/>Confirmo que o tapete, montagem, firmware e geometria correspondem à revisão selecionada.</label>}{error && <p role="alert">{error}</p>}{acq.deviceType === "MOCK" && <p>SIMULAÇÃO: a conversão física real permanece desabilitada.</p>}{!acq.status.acquiring && <p>Inicie aquisição real para visualizar o quadro atual.</p>}{result && <PhysicalResults result={result}/>}</div></div>;
}
