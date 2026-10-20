import { useShallow } from "zustand/react/shallow";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "@/services/database/api";
import { useCalibrationStore } from "@/stores/calibration";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useSession } from "@/stores/session";
import { convertFrame, kpaToKgfCm2, nToKgf } from "@/services/calibration/math";
import { ClassificationCorrection, CorrectionHistory, purposeLabel } from "./ClassificationCorrection";
import { characterizeTrials } from "@/services/calibration/characterization";
import type { Mat, MatCell, Profile, RawFrame, Scope, Trial, TrialSpec } from "@/services/calibration/types";
import { CalibrationField, FormSection, HelpBubble } from "./CalibrationHelp";
import { fieldHelp } from "./fieldHelp";
import { createMatDefaults } from "./matDefaults";
const inputClass = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
const buttonClass = "rounded-lg bg-brand text-brand-fg px-3 py-2 text-sm disabled:opacity-40";
const fmt = (n: number | null | undefined, digits = 2) => n === null || n === undefined ? "Indisponível" : n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const numberOrNull = (s: string) => s.trim() ? Number(s) : null;
function Field({ label, help, children }: {
    label: string;
    help?: string;
    children: ReactNode;
}) { return <CalibrationField label={label} help={help ?? fieldHelp[label]}>{children}</CalibrationField>; }
function download(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function Plot({ values, label }: {
    values: number[];
    label: string;
}) {
    const min = Math.min(0, ...values), max = Math.max(1, ...values), span = Math.max(1, max - min);
    const points = values.map((v, i) => `${10 + 580 * i / Math.max(1, values.length - 1)},${140 - 120 * (v - min) / span}`).join(" ");
    return <figure className="rounded-lg border border-line p-3"><figcaption className="text-sm">{label} · mín. {fmt(min)} · máx. {fmt(max)}</figcaption><svg viewBox="0 0 600 155" role="img" aria-label={label}><path d="M10 10 V140 H590" stroke="currentColor" opacity=".25" fill="none"/><polyline points={points} stroke="#0ea5e9" strokeWidth="2" fill="none"/></svg></figure>;
}
function Matrix({ values, mat, selected, onSelect, region = [] }: {
    values: number[];
    mat?: Mat;
    selected: number;
    onSelect: (i: number) => void;
    region?: number[];
}) {
    return <div className="grid gap-px border border-line rounded-lg overflow-hidden" style={{ gridTemplateColumns: "repeat(15,minmax(0,1fr))" }}>
    {Array.from({ length: 225 }, (_, index) => {
            const row = Math.floor(index / 15), col = index % 15, rawIndex = row * 15 + 14 - col;
            const cell = mat?.cells[rawIndex];
            return <button key={rawIndex} type="button" aria-pressed={selected === rawIndex} onClick={() => onSelect(rawIndex)} title={`Índice bruto ${rawIndex} · linha ${row + 1}, coluna física ${col + 1} · ${fmt(cell?.xMm)} / ${fmt(cell?.yMm)} mm · ${fmt(cell?.areaMm2)} mm²`} className={`aspect-square text-[10px] ${selected === rawIndex ? "ring-2 ring-inset ring-white" : ""} ${region.includes(rawIndex) ? "outline outline-1 -outline-offset-2 outline-yellow-400" : ""}`} style={{ backgroundColor: cell?.enabled === false ? "#52525b" : `hsl(${220 - Math.min(1, (values[rawIndex] ?? 0) / 4095) * 220},75%,${25 + Math.min(1, (values[rawIndex] ?? 0) / 4095) * 25}%)`, color: "white" }}>{fmt(values[rawIndex] ?? 0, 0)}</button>;
        })}
  </div>;
}
function MatForm({ onSave, existing }: {
    onSave: (m: Mat) => Promise<void>;
    existing?: Mat;
}) {
    const [mat, setMat] = useState<Mat>(() => createMatDefaults(existing));
    const [regular, setRegular] = useState(false), [custom, setCustom] = useState(""), [error, setError] = useState("");
    const numeric = [["widthMm", "Largura ativa (mm)"], ["heightMm", "Comprimento ativo (mm)"], ["pitchXMm", "Espaçamento X medido (mm)"], ["pitchYMm", "Espaçamento Y medido (mm)"], ["stripWidthMm", "Largura das fitas (mm)"], ["capacityKg", "Capacidade mecânica verificada (kg)"]] as const;
    return <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            try {
                let cells = mat.cells;
                if (regular) {
                    if (!mat.widthMm || !mat.heightMm || !mat.pitchXMm || !mat.pitchYMm || Math.abs(mat.widthMm / 15 - mat.pitchXMm) > .01 || Math.abs(mat.heightMm / 15 - mat.pitchYMm) > .01)
                        throw new Error("Para células iguais, confirme que largura/15 e comprimento/15 coincidem com os espaçamentos medidos. Use geometria personalizada caso contrário.");
                    cells = Array.from({ length: 225 }, (_, i) => ({ xMm: (14 - i % 15 + .5) * mat.widthMm! / 15, yMm: (Math.floor(i / 15) + .5) * mat.heightMm! / 15, areaMm2: mat.widthMm! * mat.heightMm! / 225, enabled: true, reason: "" }));
                }
                else if (custom.trim()) {
                    cells = JSON.parse(custom) as MatCell[];
                }
                await onSave({ ...mat, id: crypto.randomUUID(), cells });
                setError("Revisão salva. Alterações futuras devem ser cadastradas como nova revisão.");
            }
            catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            }
        }}>
    <p className="text-sm text-mute">As medidas já estão carregadas. Abra Alterar medidas apenas se precisar. Uma mudança na montagem é salva como nova revisão. Campos com * são obrigatórios.</p>
    <MatSummary mat={mat} />
    <FormSection title="Identificação da montagem"><div className="grid sm:grid-cols-3 gap-3">{([["identity", "Identificação do tapete"], ["revision", "Revisão física"], ["firmware", "Versão do firmware"]] as const).map(([key, label]) => <Field key={key} label={label}><input required maxLength={200} className={inputClass} value={mat[key]} onChange={e => setMat({ ...mat, [key]: e.target.value })}/></Field>)}</div></FormSection>
    <details className="rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-semibold">Alterar medidas e montagem</summary><div className="space-y-4 mt-3">
    <FormSection title="Medidas do tapete" description="Use milímetros. Medidas em branco permanecem desconhecidas."><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
    {numeric.map(([key, label]) => <Field key={key} label={label}><input type="number" min="0" step="any" className={inputClass} value={mat[key] ?? ""} onChange={e => setMat({ ...mat, [key]: numberOrNull(e.target.value) })}/></Field>)}</div></FormSection>
    <FormSection title="Área dos sensores" description="A área de cada célula é necessária para pressão por ponto. Só confirme células iguais se a geometria foi medida.">
    <div className="relative flex items-start gap-2 text-sm"><label className="flex gap-2"><input type="checkbox" checked={regular} onChange={e => setRegular(e.target.checked)}/>As 225 células são retangulares e iguais, inclusive nas bordas.</label><HelpBubble label="Células iguais" text="Confirme somente após medir centros e espaçamentos. Neste modelo, largura ÷ 15 deve coincidir com espaçamento X e comprimento ÷ 15 com espaçamento Y. A opção calcula centros e áreas; não serve para estimar uma geometria desconhecida." /></div>
    {!regular && <details className="rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-medium">Geometria personalizada — opção técnica</summary><div className="mt-3"><Field label="Geometria personalizada"><textarea rows={4} className={inputClass} placeholder='[{"xMm":null,"yMm":null,"areaMm2":null,"enabled":true,"reason":""}, ...]' value={custom} onChange={e => setCustom(e.target.value)}/></Field><p className="text-xs text-mute mt-2">Vazio mantém áreas desconhecidas. Pontos excluídos precisam de motivo e tornam as métricas físicas incompletas.</p></div></details>}
    </FormSection>
    <details className="rounded-lg border border-line p-3"><summary className="cursor-pointer text-sm font-medium">Detalhes da montagem</summary><div className="mt-3"><Field label="Camadas, resistores e montagem"><textarea className={inputClass} value={mat.layers} onChange={e => setMat({ ...mat, layers: e.target.value })}/></Field></div></details>
    </div></details>
    <button className={buttonClass}>Salvar nova revisão</button>{error && <p role="status">{error}</p>}
  </form>;
}
function MatSummary({ mat }: { mat: Mat }) {
  return <div className="rounded-lg bg-brand/5 border border-brand/20 p-3 text-sm space-y-1">
    <p className="font-semibold">Medidas carregadas · matriz 15 × 15</p>
    <p>Região sensora: {fmt(mat.widthMm)} × {fmt(mat.heightMm)} mm · Fitas: {fmt(mat.stripWidthMm)} mm</p>
    <p>Espaçamento entre centros: X {fmt(mat.pitchXMm)} mm · Y {fmt(mat.pitchYMm)} mm</p>
  </div>;
}
const initialSpec: TrialSpec = { kind: "BASELINE", purpose: "CHARACTERIZATION", protocol: "bancada-v1", group: "", repetition: 1, cycle: "1", direction: "HOLD", inputValue: 0, inputUnit: "kg", applicatorKg: 0, areaMm2: null, uniformConfirmed: false, region: [], position: "", instrument: "", referenceResolution: null, referenceUncertainty: null, participantCode: "", staticConditionsConfirmed: false, settleSeconds: 5, durationSeconds: 10, baselineTrialId: null, notes: "", transport: "", port: "", baudRate: 115200 };
function TrialForm({ mat, baselines, selected, values }: {
    mat: Mat; baselines: Trial[]; selected: number; values: number[];
}) {
    const [spec, setSpec] = useState<TrialSpec>({ ...initialSpec }), [error, setError] = useState("");
    const store = useCalibrationStore(), deviceType = useAcquisitionStore(s => s.deviceType);
    const set = <K extends keyof TrialSpec>(key: K, value: TrialSpec[K]) => setSpec(s => ({ ...s, [key]: value }));
    const local = spec.kind === "LOCAL" || spec.kind === "UNIFORM";
    const zero = spec.kind === "BASELINE", person = spec.kind === "PERSON";
    const mass = spec.inputUnit === "kg" || spec.inputUnit === "g";
    const needsArea = local || spec.inputUnit === "kPa" || spec.inputUnit === "kgf/cm2";
    return <form onSubmit={async (e) => {
        e.preventDefault(); setError("");
        try { await store.begin(mat.id, spec); }
        catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); }
    }} className="space-y-4">
      <p className="text-sm text-mute">Comece pelo zero sem carga. Depois faça as coletas de referência. Use os ícones de ajuda para saber o que preencher. Campos com * são obrigatórios.</p>
      <fieldset disabled={store.busy} className="space-y-4">
        <FormSection title="1. Escolha a coleta"><div className="grid sm:grid-cols-2 gap-3">
          <Field label="Tipo de coleta"><select className={inputClass} value={spec.kind} onChange={e => {
            const kind = e.target.value as TrialSpec["kind"];
            setSpec(s => ({ ...s, kind, purpose: kind === "BASELINE" ? "CHARACTERIZATION" : kind === "PERSON" ? "VALIDATION" : "FIT", inputValue: 0, inputUnit: "kg", applicatorKg: 0, areaMm2: null, region: [], uniformConfirmed: false, staticConditionsConfirmed: false, participantCode: "", baselineTrialId: kind === "BASELINE" ? null : s.baselineTrialId }));
          }}>{[["BASELINE", "Zero sem carga — primeiro passo"], ["TOTAL", "Pesos — força total"], ["LOCAL", "Aplicação em uma região"], ["UNIFORM", "Pressão uniforme comprovada"], ["PERSON", "Pessoa parada — verificar força"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label="Usar esta coleta para"><select disabled={zero || person} className={inputClass} value={spec.purpose} onChange={e => set("purpose", e.target.value as TrialSpec["purpose"])}><option value="CHARACTERIZATION">Conhecer o sensor (caracterização)</option><option value="FIT">Criar a curva (ajuste)</option><option value="VALIDATION">Conferir a curva (validação independente)</option></select></Field>
        </div>
        <p className="text-sm rounded-lg bg-brand/5 border border-line p-3">{zero ? "Deixe a plataforma sem carga. Esta coleta registra a leitura de repouso e deve ser revisada e aceita antes das próximas." : person ? "Use a massa medida em kg. Esta coleta verifica a força total de uma pessoa parada; não é usada para criar a curva." : spec.purpose === "VALIDATION" ? "Use grupos novos, que não participaram do ajuste. Eles vão conferir a curva já criada." : "Use uma referência medida e registre cada repetição. Separe os grupos que criarão a curva dos grupos que vão conferi-la."}</p>
        </FormSection>
        <FormSection title="2. Identifique a coleta"><div className="grid sm:grid-cols-3 gap-3">
          <Field label="Grupo da coleta"><input required maxLength={500} placeholder="Ex.: centro-sessao01" className={inputClass} value={spec.group} onChange={e => set("group", e.target.value)}/></Field>
          <Field label="Repetição"><input type="number" min="1" required className={inputClass} value={spec.repetition} onChange={e => set("repetition", Number(e.target.value))}/></Field>
          {!zero && <Field label="Zero de referência"><select required className={inputClass} value={spec.baselineTrialId ?? ""} onChange={e => set("baselineTrialId", e.target.value || null)}><option value="">Selecione o zero aceito</option>{baselines.filter(t => t.source === (deviceType === "MOCK" ? "SIMULATION" : "REAL")).map(t => <option key={t.id} value={t.id}>{new Date(t.createdAt).toLocaleString("pt-BR")} · {t.spec.group}</option>)}</select></Field>}
        </div>{!zero && !baselines.some(t => t.source === (deviceType === "MOCK" ? "SIMULATION" : "REAL")) && <p className="text-sm text-warn">Faça uma coleta Zero sem carga e aceite-a no histórico antes de continuar nesta origem.</p>}</FormSection>
        {!zero && <FormSection title="3. Informe a referência" description="Use o valor conhecido pelo instrumento, não a leitura do tapete."><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Valor medido de referência"><input required type="number" min="0" step="any" className={inputClass} value={spec.inputValue} onChange={e => set("inputValue", Number(e.target.value))}/></Field>
          <Field label="Unidade da referência"><select disabled={person} className={inputClass} value={spec.inputUnit} onChange={e => setSpec(s => ({ ...s, inputUnit: e.target.value as TrialSpec["inputUnit"], applicatorKg: 0 }))}>{["kg", "g", "N", "kPa", "kgf/cm2"].map(u => <option key={u} value={u}>{u === "kgf/cm2" ? "kgf/cm²" : u}</option>)}</select></Field>
          {mass && !person && <Field label="Massa do aplicador (kg)"><input type="number" min="0" step="any" className={inputClass} value={spec.applicatorKg} onChange={e => set("applicatorKg", Number(e.target.value))}/></Field>}
          <Field label="Instrumento de referência"><input required={spec.purpose !== "CHARACTERIZATION"} maxLength={500} placeholder="Identificação da balança ou dos pesos" className={inputClass} value={spec.instrument} onChange={e => set("instrument", e.target.value)}/></Field>
          {needsArea && <Field label="Área de aplicação (mm²)"><input required type="number" min="0" step="any" className={inputClass} value={spec.areaMm2 ?? ""} onChange={e => set("areaMm2", numberOrNull(e.target.value))}/></Field>}
          <Field label="Posição da aplicação"><input maxLength={500} placeholder="Ex.: centro" className={inputClass} value={spec.position} onChange={e => set("position", e.target.value)}/></Field>
        </div>
        {local && <div className="space-y-3"><p className="text-sm font-medium">Marque na matriz as células inteiras cobertas pela aplicação.</p><div className="max-w-lg"><Matrix values={values} mat={mat} selected={selected} region={spec.region} onSelect={i => set("region", spec.region.includes(i) ? spec.region.filter(n => n !== i) : [...spec.region, i])}/></div><button type="button" className={buttonClass} onClick={() => set("region", Array.from({ length: 225 }, (_, i) => i))}>Selecionar todas as células</button><p className="text-sm">{spec.region.length} células · área representada {spec.region.some(i => mat.cells[i].areaMm2 === null) ? "desconhecida" : fmt(spec.region.reduce((s, i) => s + (mat.cells[i].areaMm2 ?? 0), 0))} mm²</p>
          <div className="relative flex items-start gap-2"><label className="flex gap-2 text-sm"><input type="checkbox" checked={spec.uniformConfirmed} onChange={e => set("uniformConfirmed", e.target.checked)}/>Confirmei pressão uniforme e contato completo nas células selecionadas.</label><HelpBubble label="Uniformidade da aplicação" text="Marque apenas se o método comprovou distribuição uniforme e contato integral nas células selecionadas. Descreva o método nas observações. Uma placa rígida, sozinha, não comprova uniformidade." /></div>
        </div>}
        {person && <div className="space-y-3"><Field label="Código do participante"><input required maxLength={500} className={inputClass} value={spec.participantCode} onChange={e => set("participantCode", e.target.value)}/></Field><div className="relative flex items-start gap-2"><label className="flex gap-2 text-sm"><input type="checkbox" checked={spec.staticConditionsConfirmed} onChange={e => set("staticConditionsConfirmed", e.target.checked)}/>Capacidade verificada, pés inteiros na plataforma, pessoa parada e sem apoio externo; autorizações do estudo conferidas.</label><HelpBubble label="Condições da verificação com pessoa" text="Confirme as condições do protocolo antes de coletar. A revisão do tapete deve ter capacidade mecânica verificada suficiente para a massa informada. Essa verificação é estática, com referência em kg." /></div></div>}
        </FormSection>}
        <FormSection title={zero ? "3. Defina o tempo" : "4. Defina o tempo"}><div className="grid sm:grid-cols-2 gap-3">
          <Field label="Espera antes de medir (s)"><input type="number" min="0" max="300" className={inputClass} value={spec.settleSeconds} onChange={e => set("settleSeconds", Number(e.target.value))}/></Field>
          <Field label="Tempo de coleta (s)"><input type="number" min="1" max="600" className={inputClass} value={spec.durationSeconds} onChange={e => set("durationSeconds", Number(e.target.value))}/></Field>
        </div></FormSection>
        <details className="rounded-lg border border-line p-3"><summary className="cursor-pointer font-medium text-sm">Detalhes do protocolo e do instrumento</summary><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          <Field label="Protocolo versionado"><input required maxLength={500} className={inputClass} value={spec.protocol} onInvalid={e => { const details = e.currentTarget.closest("details"); if (details) details.open = true; }} onChange={e => set("protocol", e.target.value)}/></Field>
          <Field label="Ciclo"><input maxLength={500} className={inputClass} value={spec.cycle} onChange={e => set("cycle", e.target.value)}/></Field>
          <Field label="Sentido da carga"><select className={inputClass} value={spec.direction} onChange={e => set("direction", e.target.value as TrialSpec["direction"])}><option value="UP">Carga crescente</option><option value="DOWN">Carga decrescente</option><option value="HOLD">Carga mantida</option></select></Field>
          {zero && <Field label="Instrumento de referência"><input maxLength={500} className={inputClass} value={spec.instrument} onChange={e => set("instrument", e.target.value)}/></Field>}
          <Field label="Resolução da referência"><input type="number" min="0" step="any" className={inputClass} value={spec.referenceResolution ?? ""} onChange={e => set("referenceResolution", numberOrNull(e.target.value))}/></Field>
          <Field label="Incerteza da referência"><input type="number" min="0" step="any" className={inputClass} value={spec.referenceUncertainty ?? ""} onChange={e => set("referenceUncertainty", numberOrNull(e.target.value))}/></Field>
        </div></details>
        <Field label="Método e observações"><textarea required={local} maxLength={10000} className={inputClass} rows={3} value={spec.notes} onChange={e => set("notes", e.target.value)}/></Field>
        <div className="sticky bottom-0 z-10 bg-surface border-t border-line py-3 flex flex-wrap justify-between items-center gap-3"><p className="text-xs text-mute">{spec.settleSeconds} s de espera + {spec.durationSeconds} s de coleta</p><button className={buttonClass}>Iniciar coleta</button></div>
      </fieldset>
      {store.busy && <div role="status" className="rounded-lg bg-brand/10 p-4"><p>{store.elapsed < spec.settleSeconds ? "Acomodando" : "Capturando"} · {fmt(store.elapsed, 1)} s · {store.captured} quadros recebidos</p><button type="button" className={buttonClass} onClick={() => void store.finish("Interrompido pelo operador")}>Interromper coleta</button></div>}
      {error && <p role="alert" className="text-danger">{error}</p>}
    </form>;
}
const calibrationTabs = [
  { key: "Tapete", label: "1. Tapete", title: "Identifique a plataforma", help: "Cadastre uma revisão da montagem. Medidas e geometria descrevem o tapete usado nas coletas." },
  { key: "Ensaios", label: "2. Coletas", title: "Registre o zero e as referências", help: "Faça o zero sem carga, revise e aceite a coleta no histórico. Depois registre as referências, separando ajuste e validação." },
  { key: "Curvas", label: "3. Criar curva", title: "Transforme referências em uma curva candidata", help: "Marque coletas aceitas de Ajuste no histórico de Coletas. Aqui você escolhe o zero, o que calibrar e os critérios do protocolo." },
  { key: "Validação", label: "4. Conferir curva", title: "Confira com coletas independentes", help: "Selecione no histórico coletas aceitas de Validação que não participaram do ajuste. O teste usa os critérios já gravados na curva." },
  { key: "Perfis", label: "5. Usar calibração", title: "Consulte e ative uma versão validada", help: "Escolha o perfil e confira sua origem e validação. Somente um administrador pode ativar um perfil real aprovado com cobertura completa." },
  { key: "Diagnóstico", label: "Diagnóstico", title: "Observe as leituras do sensor", help: "Clique em uma célula para acompanhar sua leitura bruta. Este painel ajuda a investigar ruído e resposta à carga; não cria nem ativa uma curva." },
  { key: "Protocolo", label: "Guia de bancada", title: "Consulte o procedimento completo", help: "Use este guia para planejar montagem, referências, coletas e conferência. Os campos com ajuda explicam como registrar cada parte." },
];
function Protocol() { return <article className="space-y-4 text-sm max-w-3xl"><h2 className="text-lg font-semibold">Protocolo inicial de bancada</h2><ol className="list-decimal pl-6 space-y-3"><li>Registre montagem, dimensões, área das células e capacidade mecânica. Mantenha as mesmas camadas usadas no exame.</li><li>Confira pesos e massa do aplicador em uma balança. Registre instrumento, resolução, área e posição.</li><li>Capture o zero sem carga; revise ruído, deriva e retorno ao zero.</li><li>Faça ciclos preliminares dentro da capacidade segura; observe acomodação antes de escolher a janela.</li><li>Planeje cinco níveis não nulos como início exploratório e três reaplicações por condição. Esses números não garantem precisão.</li><li>Teste cargas crescentes, decrescentes e mantidas; centro, bordas e cantos. Depois amplie a cobertura dos 225 pontos.</li><li>Separe grupos/sessões de ajuste e validação antes de coletar. Defina o máximo erro aceitável em N ou kPa antes da validação.</li><li>Uma placa rígida não assegura pressão uniforme. Referências locais exigem aplicação conhecida cobrindo células inteiras no modelo atual.</li><li>Use pessoas somente em verificação estática da força total, com massa medida. Não force a soma para coincidir com o peso.</li><li>Repita em outro dia e com reposicionamento. Registre saturação, deriva, erros e limites; alterações físicas requerem nova revisão.</li></ol><p>Pressão: kgf/cm² = kPa / 98,0665. Força: N = kg × 9,80665 na condição estática. Não usar o peso corporal como referência dinâmica.</p><p>O CSV de 225 valores a 115200 baud não garante 30 FPS; valores de quatro dígitos limitam a taxa teórica a cerca de 10,2 quadros/s. Use a frequência medida.</p><p>Consulte o guia em Sprint/Treinamento para as etapas completas. Ensaio real aprovado não comprova equivalência clínica com BaroScan.</p></article>; }
export function CalibrationPage() {
    const data = useCalibrationStore(), user = useSession(s => s.user);
    const [tab, setTab] = useState("Tapete"), [matId, setMatId] = useState(""), [selected, setSelected] = useState(112), [trialId, setTrialId] = useState(""), [profileId, setProfileId] = useState("");
    const liveTab = tab === "Diagnóstico" || tab === "Ensaios" || tab === "Perfis";
    const acq = useAcquisitionStore(useShallow(s => ({ deviceType: s.deviceType, latestFrame: liveTab ? s.latestFrame : null, connected: s.status.connected, fps: s.status.fps })));
    const [frames, setFrames] = useState<RawFrame[]>([]), [history, setHistory] = useState<number[]>([]), [chosen, setChosen] = useState<string[]>([]), [search, setSearch] = useState("");
    const [message, setMessage] = useState(""), [working, setWorking] = useState(false), [scope, setScope] = useState<Scope>("TOTAL_FORCE_ONLY"), [profileName, setProfileName] = useState("");
    const [maxError, setMaxError] = useState(""), [minValidation, setMinValidation] = useState(3), [minFitLevels, setMinFitLevels] = useState(5), [reason, setReason] = useState("");
    const mat = data.mats.find(m => m.id === matId), trial = data.trials.find(t => t.id === trialId), profile = data.profiles.find(p => p.id === profileId);
    const trials = data.trials.filter(t => t.matId === matId), profiles = data.profiles.filter(p => p.matId === matId), baselines = trials.filter(t => t.spec.kind === "BASELINE" && t.state === "ACCEPTED");
    const [baselineId, setBaselineId] = useState("");
    const run = async (task: () => Promise<unknown>) => { setWorking(true); setMessage(""); try {
        await task();
        await data.refresh();
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : String(e));
    }
    finally {
        setWorking(false);
    } };
    const exportTrial = async (t: Trial, m: Mat) => {
        const ids = t.spec.baselineTrialId ? [t.spec.baselineTrialId, t.id] : [t.id];
        const records = [];
        for (const id of ids) {
            const trial = data.trials.find(item => item.id === id);
            if (!trial)
                throw new Error("Baseline ausente no histórico.");
            records.push({ trial, frames: await api.calibration.frames(id) });
        }
        download(`BAROPRESS_ensaio_${t.id}.json`, { format: "BAROPRESS_CALIBRATION_TRIALS", schemaVersion: 1, mat: m, records });
    };
    useEffect(() => { void data.refresh().catch(e => setMessage(e.message)); }, []); // store action is stable
    useEffect(() => { if (!matId && data.mats[0])
        setMatId(data.mats[0].id); }, [data.mats, matId]);
    useEffect(() => { if (tab === "Diagnóstico" && acq.latestFrame) setHistory(h => [...h.slice(-179), acq.latestFrame!.values[selected] ?? 0]); }, [acq.latestFrame, selected, tab]);
    useEffect(() => { setHistory([]); setFrames([]); }, [selected, trialId]);
    const snapshot = useMemo(() => profile && acq.latestFrame ? convertFrame(acq.latestFrame.values, profile) : null, [profile, acq.latestFrame]);
    const currentValues = trial?.summary?.means ?? acq.latestFrame?.values ?? Array(225).fill(0);
    const curve = profile?.curves[profile.scope === "TOTAL_FORCE_ONLY" ? 0 : selected];
    return <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
    <div><h1 className="text-2xl font-bold">Testes e calibração</h1><p className="text-mute text-sm">Siga as etapas de 1 a 5. Os ícones de ajuda explicam os campos de cada etapa.</p></div>
    <div className="flex flex-wrap gap-3 items-center rounded-xl bg-surface border border-line p-3"><span className={acq.deviceType === "MOCK" ? "text-purple-500 font-bold" : "font-bold"}>{acq.deviceType === "MOCK" ? "SIMULAÇÃO" : "REAL — não calibrado até validar perfil"}</span><span className="text-sm">{acq.connected ? "Conectado" : "Desconectado"} · {fmt(acq.fps, 1)} FPS medidos</span><div className="w-full sm:w-80"><Field label="Revisão selecionada" help="Selecione a montagem usada nestas coletas. Cada revisão tem seu próprio zero, histórico e curvas. Trocar a revisão limpa apenas as seleções da tela, preservando os registros."><select disabled={data.busy} className={inputClass} value={matId} onChange={e => { setMatId(e.target.value); setProfileId(""); setTrialId(""); setChosen([]); setBaselineId(""); }}><option value="">Selecione uma revisão</option>{data.mats.map(m => <option key={m.id} value={m.id}>{m.identity} · {m.revision} · {m.firmware}</option>)}</select></Field></div><button disabled={data.busy || working} className={buttonClass} onClick={() => void run(() => data.refresh())}>Atualizar</button><button disabled={data.busy} className={buttonClass} onClick={() => useSession.getState().openArduinoSettings()}>Configurar dispositivo</button></div>
    {(message || data.error) && <p role="alert" className="rounded-lg border border-line p-3 text-danger">{message || data.error}</p>}
    {data.busy && tab !== "Ensaios" && <div role="status">Coleta continua ao navegar: {fmt(data.elapsed, 1)} s · {data.captured} quadros. <button className={buttonClass} onClick={() => void data.finish("Interrompido pelo operador")}>Interromper</button></div>}
    <nav aria-label="Seções de calibração" className="flex flex-wrap gap-2">{calibrationTabs.map(t => <button key={t.key} type="button" aria-current={tab === t.key ? "page" : undefined} className={`px-3 py-2 rounded-lg border text-sm ${tab === t.key ? "border-brand bg-brand/10 text-brand font-semibold" : "border-line"}`} onClick={() => setTab(t.key)}>{t.label}</button>)}</nav>
    <div className="rounded-xl bg-brand/5 border border-brand/20 px-4 py-3"><h2 className="font-semibold">{calibrationTabs.find(t => t.key === tab)?.title}</h2><p className="text-sm text-mute mt-1">{calibrationTabs.find(t => t.key === tab)?.help}</p></div>
    <section className="rounded-xl border border-line bg-surface p-4 space-y-4">
    {tab === "Ensaios" && <Field label="Importar coletas (JSON)"><input type="file" accept=".json" disabled={working || data.busy} onChange={e => { const file = e.target.files?.[0]; e.target.value = ""; if (file)
        void run(async () => { if (file.size > 64 * 1024 * 1024)
            throw new Error("Arquivo excede 64 MB."); const count = await api.calibration.importTrials(await file.text()); setMessage(`${count} registros importados; origem e bruto preservados. Nenhum perfil foi ativado.`); }); }}/></Field>}
    {tab === "Tapete" && <>{mat && <MatSummary mat={mat} />}<details open={!mat} className="rounded-lg border border-line p-3"><summary className="cursor-pointer font-semibold text-sm">{mat ? "Alterar cadastro / criar nova revisão" : "Usar as medidas padrão do BAROPRESS"}</summary><fieldset className="mt-4" disabled={data.busy}><MatForm key={mat?.id ?? "padrao"} existing={mat} onSave={async (m) => { await api.calibration.saveMat(m); await data.refresh(); setMatId(m.id); }}/></fieldset></details>{mat && <details><summary>Geometria da revisão selecionada (JSON para nova revisão)</summary><pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(mat, null, 2)}</pre><button className={buttonClass} onClick={() => download(`BAROPRESS_geometria_${mat.id}.json`, mat)}>Exportar geometria</button></details>}</>}
    {tab === "Protocolo" && <Protocol />}
    {tab !== "Tapete" && tab !== "Protocolo" && !mat && <p>Cadastre e selecione uma revisão do tapete para continuar.</p>}
    {mat && tab === "Diagnóstico" && <div className="grid lg:grid-cols-2 gap-5"><div><Matrix values={acq.latestFrame?.values ?? Array(225).fill(0)} mat={mat} selected={selected} onSelect={setSelected}/><p className="text-xs text-mute mt-2">Matriz ADC sem interpolação, espelhada uma vez. Azul = leitura baixa; vermelho = alta. Clique em um ponto.</p></div><div className="space-y-3"><h2 className="font-semibold">Ponto bruto {selected} · X {fmt(mat.cells[selected].xMm)} / Y {fmt(mat.cells[selected].yMm)} mm</h2><Plot values={history} label="Últimos valores de diagnóstico (ADC; atualização visual)"/><p className="text-sm">O gráfico ao vivo é visual. As estatísticas dos ensaios usam todos os quadros recebidos.</p><button className={buttonClass} onClick={() => setTab("Ensaios")}>Capturar zero / diagnóstico</button><p className="text-sm">Procure deriva, saturação e ativação de vizinhos sob carga localizada. Constância em repouso não comprova sensor defeituoso.</p></div></div>}
    {mat && tab === "Ensaios" && <><TrialForm mat={mat} baselines={baselines} selected={selected} values={acq.latestFrame?.values ?? Array(225).fill(0)}/><hr className="border-line"/><ClassificationCorrection trials={trials} profiles={profiles} selected={chosen} disabled={working || data.busy} onCorrected={async ids => { await data.refresh(); setChosen(ids); setMessage(`${ids.length} ensaios corrigidos para Validação independente. Leituras e revisão preservadas; selecione somente estes ensaios para validar.`); }}/><button type="button" disabled={working || data.busy} className={buttonClass} onClick={() => setChosen([])}>Limpar seleção</button><Field label="Buscar no histórico"><input className={inputClass} value={search} onChange={e => setSearch(e.target.value)}/></Field><div className="overflow-auto max-h-80"><table className="w-full text-sm text-left"><thead><tr><th>Selecionar</th><th>Data / grupo</th><th>Origem / conjunto</th><th>Referência</th><th>Estado</th></tr></thead><tbody>{trials.filter(t => `${t.spec.group} ${t.spec.kind} ${t.spec.position} ${t.source} ${t.spec.purpose} ${purposeLabel(t.spec.purpose)}`.toLowerCase().includes(search.toLowerCase())).map(t => <tr key={t.id} className="border-t border-line"><td className="p-2"><input aria-label={`Selecionar ${t.spec.group}`} type="checkbox" checked={chosen.includes(t.id)} onChange={e => setChosen(e.target.checked ? [...chosen, t.id] : chosen.filter(id => id !== t.id))}/></td><td><button className="underline" onClick={() => { setTrialId(t.id); setReason(""); }}>{new Date(t.createdAt).toLocaleString("pt-BR")} · {t.spec.group} · rep. {t.spec.repetition}</button></td><td>{t.source} · {purposeLabel(t.spec.purpose)}{t.spec.classificationCorrection ? " · CORRIGIDO" : ""}{t.importedAt ? " · IMPORTADO" : ""}</td><td>{fmt(t.spec.inputValue)} {t.spec.inputUnit}</td><td>{t.state}</td></tr>)}</tbody></table></div>
    {trial && <div className="space-y-3 border-t border-line pt-3"><h2 className="font-semibold">Ensaio {trial.spec.group} · {trial.source} · {trial.state}</h2>{trial.reason && <p>{trial.reason}</p>}<p>{trial.summary?.count ?? 0} quadros aceitos · {fmt(trial.summary?.fps, 1)} FPS · intervalo {fmt(trial.summary?.intervalMeanMs)} ± {fmt(trial.summary?.intervalSdMs)} ms</p><div className="grid lg:grid-cols-2 gap-4"><Matrix values={currentValues} mat={mat} selected={selected} onSelect={setSelected}/><div className="space-y-2"><p>Ponto {selected}: média {fmt(trial.summary?.means[selected])}, desvio {fmt(trial.summary?.sd[selected])}, deriva {fmt(trial.summary?.drift[selected])} ADC; {trial.summary?.saturated[selected] ?? 0} quadros ≥4090.</p>{frames.length > 0 && <Plot values={frames.filter((_, i) => i % Math.max(1, Math.floor(frames.length / 600)) === 0).map(f => f.values[selected])} label="Série bruta salva (ADC; pontos reduzidos para visualização)"/>}<button disabled={working} className={buttonClass} onClick={() => void run(async () => setFrames(await api.calibration.frames(trial.id)))}>Carregar série bruta</button><button disabled={working} className={buttonClass} onClick={() => void run(async () => exportTrial(trial, mat))}>Exportar ensaio completo</button></div></div><details><summary>Referência e condições completas</summary><pre className="overflow-auto text-xs">{JSON.stringify(trial.spec, null, 2)}</pre></details><CorrectionHistory trial={trial}/>{trial.state === "REVIEW" && <><Field label="Observação da revisão"><input className={inputClass} value={reason} onChange={e => setReason(e.target.value)}/></Field><div className="flex gap-3"><button disabled={working} className={buttonClass} onClick={() => void run(() => api.calibration.review(trial.id, true, reason))}>Aceitar ensaio</button><button disabled={working || !reason.trim()} className={buttonClass} onClick={() => void run(() => api.calibration.review(trial.id, false, reason))}>Rejeitar mantendo bruto</button></div></>}</div>}
    <details className="space-y-2"><summary>Reaplicações e histerese no ponto {selected}</summary><p className="text-xs text-mute">Agrupado por referência, posição, baseline e protocolo. Histerese é a diferença absoluta entre médias em subida/descida, em ADC; não é pressão física. Uma repetição não define desvio entre reaplicações.</p><div className="overflow-auto"><table className="text-sm w-full"><thead><tr><th>Origem / referência</th><th>Posição</th><th>Repetições</th><th>Média ADC</th><th>Desvio reaplicações</th><th>Histerese ADC</th><th>Deriva máx.</th></tr></thead><tbody>{characterizeTrials(trials, selected).map((r, i) => <tr key={i}><td>{r.source} · {fmt(r.reference)} {r.unit}</td><td>{r.position}</td><td>{r.repetitions}</td><td>{fmt(r.meanAdc)}</td><td>{fmt(r.reapplicationSdAdc)}</td><td>{fmt(r.hysteresisAdc)}</td><td>{fmt(r.driftMaxAdc)}</td></tr>)}</tbody></table></div><button className={buttonClass} onClick={() => download(`BAROPRESS_caracterizacao_${mat.id}_ponto_${selected}.json`, { matId: mat.id, sensor: selected, results: characterizeTrials(trials, selected), uncertainty: "não determinada" })}>Exportar caracterização</button></details>
    <p className="text-xs text-mute">Os ensaios ficam preservados no banco. Exporte antes de arquivar; o backup integral inclui bruto e perfis. Seleções de ajuste e teste são feitas por ensaio inteiro.</p></>}
    {mat && tab === "Curvas" && <><p>Selecione coletas aceitas de AJUSTE na etapa 2. Coletas. O baseline e os critérios ficam congelados ao gerar o perfil.</p><div className="grid sm:grid-cols-3 gap-3"><Field label="Nome da versão"><input className={inputClass} value={profileName} onChange={e => setProfileName(e.target.value)}/></Field><Field label="O que calibrar"><select className={inputClass} value={scope} onChange={e => setScope(e.target.value as Scope)}><option value="TOTAL_FORCE_ONLY">Somente força total (N)</option><option value="LOCAL_PRESSURE">Pressão por ponto (kPa)</option></select></Field><Field label="Zero usado na curva"><select className={inputClass} value={baselineId} onChange={e => setBaselineId(e.target.value)}><option value="">Selecione</option>{baselines.map(t => <option key={t.id} value={t.id}>{t.source} · {t.spec.group}</option>)}</select></Field><Field label={`Erro máximo aceito (${scope === "LOCAL_PRESSURE" ? "kPa" : "N"})`} help="Defina, conforme o protocolo, a maior diferença absoluta permitida entre a estimativa e a referência. O valor fica gravado na curva antes da validação e não pode ser aumentado depois para aprovar o teste."><input type="number" min="0" step="any" className={inputClass} value={maxError} onChange={e => setMaxError(e.target.value)}/></Field><Field label="Níveis diferentes de carga"><input type="number" min="2" max="100" className={inputClass} value={minFitLevels} onChange={e => setMinFitLevels(Number(e.target.value))}/></Field><Field label="Grupos independentes para conferir"><input type="number" min="3" max="100" className={inputClass} value={minValidation} onChange={e => setMinValidation(Number(e.target.value))}/></Field></div><p>{chosen.length} ensaios selecionados. Níveis suficientes não comprovam por si só precisão.</p><button disabled={working || data.busy || !profileName || !baselineId || !maxError} className={buttonClass} onClick={() => void run(async () => { const p = await api.calibration.fit({ id: crypto.randomUUID(), matId, name: profileName, scope, baselineTrialId: baselineId, trialIds: chosen, maxError: Number(maxError), minValidationTrials: minValidation, minFitLevels }); setProfileId(p.id); })}>Gerar perfil candidato</button>{profile && <><ProfileSelector profiles={profiles} selected={profileId} onSelect={setProfileId}/><p>{profile.curves.filter(c => c !== null).length}/{profile.curves.length} curvas · {profile.source} · algoritmo {profile.algorithm}</p><div className="max-w-lg"><Matrix values={profile.scope === "LOCAL_PRESSURE" ? profile.curves.map(c => c ? 2500 : 0) : Array(225).fill(0)} mat={mat} selected={selected} onSelect={setSelected}/></div><CurvePlot profile={profile} selected={selected}/><pre className="text-xs overflow-auto">{JSON.stringify(curve ?? "Sem curva suficiente", null, 2)}</pre></>}</>}
    {mat && tab === "Validação" && <><ProfileSelector profiles={profiles} selected={profileId} onSelect={setProfileId}/><p>{chosen.length} ensaios selecionados.</p><p>Selecione coletas aceitas de VALIDAÇÃO na etapa 2. Coletas. Critérios são os gravados no perfil; não podem ser aumentados para aprovar o teste.</p><button disabled={working || data.busy || !profile || !chosen.length} className={buttonClass} onClick={() => void run(() => api.calibration.validate(profileId, crypto.randomUUID(), chosen))}>Executar validação independente</button>{profile && <><p>Critério: erro máximo {fmt(profile.maxError)} {profile.scope === "LOCAL_PRESSURE" ? "kPa" : "N"}; {profile.minValidationTrials} condições por curva.</p>{profile.validations.map(v => <div className="border border-line rounded-lg p-3 space-y-2" key={v.id}><h3 className="font-bold">{v.outcome} · {new Date(v.createdAt).toLocaleString("pt-BR")}</h3><p>{v.reason}</p><p>MAE {fmt(v.mae)} · RMSE {fmt(v.rmse)} · viés {fmt(v.bias)} · máximo {fmt(v.maxError)} {v.unit}</p><div className="max-h-60 overflow-auto"><table className="w-full text-sm"><thead><tr><th>Ponto</th><th>Referência</th><th>Estimativa</th><th>Erro</th><th>Erro %</th></tr></thead><tbody>{v.rows.map((r, i) => <tr key={i}><td>{r.sensor ?? "Total"}</td><td>{fmt(r.reference)}</td><td>{fmt(r.estimated)}</td><td>{fmt(r.error)}</td><td>{fmt(r.percent)}</td></tr>)}</tbody></table></div><button className={buttonClass} onClick={() => download(`BAROPRESS_validacao_${v.id}.json`, { profile, validation: v })}>Exportar resultado</button></div>)}</>}</>}
    {mat && tab === "Perfis" && <><ProfileSelector profiles={profiles} selected={profileId} onSelect={setProfileId}/>{profile && <div className="space-y-3"><h2 className="font-bold">{profile.name} · {profile.source} · {profile.state} {profile.active ? "· ATIVO" : ""}</h2><p>{profile.scope === "TOTAL_FORCE_ONLY" ? "Força total calibrável; mapa permanece ADC." : "Pressão local por curva e área de cada célula."} Faixa por curva; nenhuma extrapolação.</p><div className="flex flex-wrap gap-3"><button className={buttonClass} disabled={working || data.busy || user?.role !== "admin" || profile.source !== "REAL" || profile.state !== "VALIDATED"} onClick={() => void run(() => api.calibration.activate(profile.id))}>Ativar para esta revisão</button><button className={buttonClass} disabled={working || data.busy || user?.role !== "admin" || !profile.active} onClick={() => void run(() => api.calibration.deactivate(matId))}>Retirar seleção ativa</button><button className={buttonClass} onClick={() => download(`BAROPRESS_perfil_${profile.id}.json`, profile)}>Exportar perfil e validações</button></div><p className="text-xs text-mute">Ativação exige administrador, dados reais, validação e cobertura completa. Para levar a base a outro computador, use Backup integral; após restauração, verifique a identidade do tapete antes de ativar.</p>{snapshot && <div className="rounded-lg border border-line p-3"><h3>Prévia do candidato · {acq.deviceType === "MOCK" ? "SIMULAÇÃO" : "estimativa experimental"}</h3><p>Força {fmt(snapshot.totalForceN)} N · {fmt(snapshot.totalForceN === null ? null : nToKgf(snapshot.totalForceN))} kgf; massa equivalente com g padrão {fmt(snapshot.totalForceN === null ? null : nToKgf(snapshot.totalForceN))} kg.</p><p>Pressão média {fmt(snapshot.meanPressureKPa)} kPa · {fmt(snapshot.meanPressureKPa === null ? null : kpaToKgfCm2(snapshot.meanPressureKPa))} kgf/cm².</p><p>{snapshot.complete ? "Quadro dentro do domínio do candidato" : "Dados parciais, saturados ou fora da faixa; total indisponível"} · CoP {fmt(snapshot.copMm?.x)} / {fmt(snapshot.copMm?.y)} mm.</p></div>}</div>}</>}
    </section>
  </div>;
}
function ProfileSelector({ profiles, selected, onSelect }: {
    profiles: Profile[];
    selected: string;
    onSelect: (id: string) => void;
}) { return <Field label="Perfil / versão"><select className={inputClass} value={selected} onChange={e => onSelect(e.target.value)}><option value="">Selecione</option>{profiles.map(p => <option key={p.id} value={p.id}>{p.name} · {p.source} · {p.state} {p.active ? "· ATIVO" : ""}</option>)}</select></Field>; }
function CurvePlot({ profile, selected }: {
    profile: Profile;
    selected: number;
}) { const knots = profile.curves[profile.scope === "LOCAL_PRESSURE" ? selected : 0]; if (!knots)
    return <p>Sem curva nesse ponto. Colete referências suficientes.</p>; const xmax = Math.max(1, knots[knots.length - 1].x), ymax = Math.max(1, knots[knots.length - 1].y); return <figure><figcaption>ADC após baseline/ruído → {profile.scope === "LOCAL_PRESSURE" ? "kPa" : "N"}. Limite ADC: {fmt(xmax)}.</figcaption><svg viewBox="0 0 600 200" role="img" aria-label="Curva de calibração por trechos"><path d="M20 10 V180 H580" stroke="currentColor" opacity=".3" fill="none"/><polyline points={knots.map(k => `${20 + 560 * k.x / xmax},${180 - 160 * k.y / ymax}`).join(" ")} stroke="#0ea5e9" strokeWidth="2" fill="none"/>{knots.map((k, i) => <circle key={i} cx={20 + 560 * k.x / xmax} cy={180 - 160 * k.y / ymax} r="4" fill="#0ea5e9"><title>{fmt(k.x)} ADC → {fmt(k.y)}</title></circle>)}</svg></figure>; }
