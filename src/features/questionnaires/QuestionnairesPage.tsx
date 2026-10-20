import { useEffect, useRef, useState } from "react";
import { api, clearDatabaseCache } from "@/services/database/api";
import { Button, Field } from "@/components/ui/controls";
import type { AnswerValue, PatientSummary, Questionnaire, QuestionnaireSession, Question } from "@/types";
import { blankQuestion, questionTypes, validateAnswer, validateTemplate } from "./questionnaireUtils";
import { QuestionnaireHistory } from "./QuestionnaireHistory";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";
import { requestNavigation } from "@/services/navigationGuard";
const control = "w-full p-2 border border-line rounded-lg bg-surface text-sm";
export function QuestionnairesPage() {
    const [models, setModels] = useState<Questionnaire[]>([]);
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [patientId, setPatientId] = useState(0);
    const [selected, setSelected] = useState<Questionnaire | null>(null);
    const [editor, setEditor] = useState<Questionnaire | null>(null);
    const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
    const [history, setHistory] = useState<QuestionnaireSession[]>([]);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const [loadingModels, setLoadingModels] = useState(true);
    const editorInitial = useRef("");
    const answersDirty = Object.values(answers).some(value => value !== null && value !== "" && (!Array.isArray(value) || value.length > 0));
    useUnsavedChanges((selected !== null && answersDirty) || (editor !== null && JSON.stringify(editor) !== editorInitial.current), "O questionário tem respostas ou alterações que ainda não foram salvas.", busy);
    function openEditor(model: Questionnaire) {
        requestNavigation(() => { editorInitial.current = JSON.stringify(model); setAnswers({}); setSelected(null); setEditor(model); setError(""); setMessage(""); });
    }
    useEffect(() => {
        let live = true;
        setLoadingModels(true);
        Promise.all([api.questionnaires.list(), api.patients.list()]).then(([q, p]) => {
            if (live) {
                setModels(q);
                setPatients(p);
            }
        }).catch((e) => {
            if (live)
                setError(e.message);
        }).finally(() => { if (live) setLoadingModels(false); });
        return () => { live = false; };
    }, [revision]);
    useEffect(() => {
        let live = true;
        setHistory([]);
        setAnswers({});
        if (patientId)
            api.questionnaires.history(patientId).then((h) => {
                if (live)
                    setHistory(h);
            }).catch((e) => {
                if (live)
                    setError(e.message);
            });
        return () => { live = false; };
    }, [patientId, revision]);
    function updateQuestion(index: number, partial: Partial<Question>) {
        if (editor)
            setEditor({ ...editor, questions: editor.questions.map((q, i) => i === index ? { ...q, ...partial } : q) });
    }
    async function saveModel() {
        if (!editor || busy)
            return;
        const invalid = validateTemplate(editor);
        if (invalid) {
            setError(invalid);
            return;
        }
        setBusy(true);
        setError('');
        try {
            await api.questionnaires.save(editor);
            setEditor(null);
            setSelected(null);
            setRevision((r) => r + 1);
            setMessage('Modelo salvo. Respostas anteriores foram preservadas.');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function submitAnswers() {
        if (!selected?.id || !patientId || busy)
            return;
        for (const q of selected.questions) {
            const invalid = validateAnswer(q, answers[q.id!]);
            if (invalid) {
                setError(invalid);
                return;
            }
        }
        setBusy(true);
        setError('');
        try {
            await api.questionnaires.answer(selected.id, patientId, selected.questions.filter((q) => q.active).map((q) => ({ questionId: q.id!, value: answers[q.id!] ?? null })));
            setAnswers({});
            setSelected(null);
            setRevision((r) => r + 1);
            setMessage('Respostas salvas no histórico do paciente.');
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5">
    <header className="flex justify-between flex-wrap gap-3"><div><h1 className="text-2xl font-semibold">Questionários e anamnese</h1><p className="text-sm text-mute">Modelos configuráveis e respostas por paciente e data.</p></div><div className="flex gap-2"><Button variant="ghost" disabled={busy || loadingModels || editor !== null || selected !== null} title="Conclua ou cancele o formulário antes de atualizar a lista" onClick={() => { clearDatabaseCache(); setError(''); setRevision((r) => r + 1); }}>Atualizar lista</Button><Button disabled={busy} onClick={() => openEditor({ id: null, name: '', description: '', active: true, questions: [blankQuestion()] })}>Novo modelo</Button></div></header>
    {error && <p role="alert" className="text-danger">{error}</p>}{message && <p role="status" className="text-ok">{message}</p>}
    {loadingModels && <p role="status" className="text-mute">Carregando questionários...</p>}
    {editor ? <form onSubmit={(e) => { e.preventDefault(); void saveModel(); }} className="space-y-4 bg-surface border border-line rounded-xl p-4">
      <h2 className="text-lg font-semibold">{editor.id ? 'Editar modelo' : 'Criar modelo'}</h2><Field label="Nome do questionário" required maxLength={120} disabled={busy} value={editor.name} onChange={(e) => setEditor({ ...editor, name: e.target.value })}/><Field label="Descrição" maxLength={5000} disabled={busy} value={editor.description ?? ''} onChange={(e) => setEditor({ ...editor, description: e.target.value })}/><label className="flex gap-2 text-sm"><input type="checkbox" disabled={busy} checked={editor.active} onChange={(e) => setEditor({ ...editor, active: e.target.checked })}/>Modelo ativo</label>
      {editor.questions.map((q, index) => <fieldset key={q.id ?? `new-${index}`} className="border border-line rounded-xl p-3 space-y-3"><legend className="px-2 text-sm">Pergunta {index + 1}</legend><div className="grid md:grid-cols-2 gap-3"><label className="text-sm">Grupo<input className={control} disabled={busy} maxLength={120} required value={q.groupName} onChange={(e) => updateQuestion(index, { groupName: e.target.value })}/></label><label className="text-sm">Tipo<select className={control} disabled={busy} value={q.type} onChange={(e) => updateQuestion(index, { type: e.target.value as Question['type'] })}>{Object.entries(questionTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div><label className="block text-sm">Texto da pergunta<input className={control} required disabled={busy} maxLength={2000} value={q.question} onChange={(e) => updateQuestion(index, { question: e.target.value })}/></label>
        {(q.type === 'single' || q.type === 'multi') && <label className="block text-sm">Opções (uma por linha)<textarea className={control} disabled={busy} value={q.options.join('\n')} onChange={(e) => updateQuestion(index, { options: e.target.value.split('\n') })}/></label>}
        <div className="flex flex-wrap gap-4 text-sm"><label><input disabled={busy} type="checkbox" checked={q.required} onChange={(e) => updateQuestion(index, { required: e.target.checked })}/> Obrigatória</label><label><input disabled={busy} type="checkbox" checked={q.active} onChange={(e) => updateQuestion(index, { active: e.target.checked })}/> Ativa</label><Button type="button" variant="ghost" disabled={busy || editor.questions.length <= 1} onClick={() => setEditor({ ...editor, questions: editor.questions.filter((_, i) => i !== index) })}>Remover do modelo</Button></div>
      </fieldset>)}<div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" disabled={busy || editor.questions.length >= 200} onClick={() => setEditor({ ...editor, questions: [...editor.questions, blankQuestion()] })}>Adicionar pergunta</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => requestNavigation(() => setEditor(null))}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar modelo'}</Button></div>
    </form> : <>
      <div className="grid md:grid-cols-2 gap-3">{models.map((q) => <section key={q.id} className="p-4 bg-surface border border-line rounded-xl space-y-2"><h2 className="font-semibold">{q.name}{!q.active ? ' · Inativo' : ''}</h2><p className="text-sm text-mute">{q.description} · {q.questions.filter((p) => p.active).length} perguntas ativas</p><div className="flex gap-2"><Button variant="ghost" disabled={busy} onClick={() => openEditor(structuredClone(q))}>Editar</Button><Button disabled={!q.active || busy || !q.questions.some((p) => p.active)} onClick={() => requestNavigation(() => { setSelected(q); setAnswers({}); setError(''); setMessage(''); })}>Responder</Button></div></section>)}</div>{!loadingModels && models.length === 0 && <p className="text-mute">Crie o primeiro modelo para registrar a anamnese.</p>}
      <label className="block text-sm">Paciente<select aria-label="Paciente do questionário" className={control} disabled={busy} value={patientId} onChange={(e) => { const next = Number(e.target.value); e.target.value = String(patientId); requestNavigation(() => { setPatientId(next); setMessage(''); }); }}><option value="0">Selecione</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      {selected && <form className="space-y-4 bg-surface border border-line rounded-xl p-4" onSubmit={(e) => { e.preventDefault(); void submitAnswers(); }}><h2 className="text-lg font-semibold">Responder: {selected.name}</h2>
        {Array.from(new Set(selected.questions.filter((q) => q.active).map((q) => q.groupName))).map((group) => <fieldset key={group} className="border border-line rounded-lg p-3 space-y-3"><legend className="px-2 font-medium">{group}</legend>{selected.questions.filter((q) => q.active && q.groupName === group).map((q) => {
                        const id = q.id!;
                        const value = answers[id];
                        return <div key={id} className="space-y-1"><label htmlFor={`answer-${id}`} className="text-sm font-medium">{q.question}{q.required ? ' *' : ''}</label>
          {q.type === 'text' ? <textarea id={`answer-${id}`} className={control} disabled={busy} required={q.required} maxLength={10000} value={typeof value === 'string' ? value : ''} onChange={(e) => setAnswers({ ...answers, [id]: e.target.value })}/> : q.type === 'number' ? <input id={`answer-${id}`} className={control} type="number" step="any" disabled={busy} required={q.required} value={typeof value === 'number' ? value : ''} onChange={(e) => setAnswers({ ...answers, [id]: e.target.value === '' ? null : Number(e.target.value) })}/> : q.type === 'single' || q.type === 'yesno' ? <select id={`answer-${id}`} className={control} required={q.required} disabled={busy} value={value == null ? '' : String(value)} onChange={(e) => setAnswers({ ...answers, [id]: e.target.value === '' ? null : q.type === 'yesno' ? e.target.value === 'true' : e.target.value })}><option value="">Selecione</option>{q.type === 'yesno' ? <><option value="true">Sim</option><option value="false">Não</option></> : q.options.map((o) => <option key={o} value={o}>{o}</option>)}</select> : <div role="group" aria-label={q.question} className="space-y-1">{q.options.map((o) => <label className="block text-sm" key={o}><input type="checkbox" disabled={busy} checked={Array.isArray(value) && value.includes(o)} onChange={() => { const prev = Array.isArray(value) ? value : []; setAnswers({ ...answers, [id]: prev.includes(o) ? prev.filter((v) => v !== o) : [...prev, o] }); }}/> {o}</label>)}</div>}
        </div>;
                    })}</fieldset>)}<div className="flex gap-2"><Button type="button" variant="ghost" disabled={busy} onClick={() => requestNavigation(() => setSelected(null))}>Cancelar</Button><Button type="submit" disabled={busy || !patientId}>{busy ? 'Salvando...' : 'Salvar respostas'}</Button></div>
      </form>}
      {patientId > 0 && <section className="space-y-3"><h2 className="text-lg font-semibold">Histórico de respostas</h2><QuestionnaireHistory sessions={history}/></section>}
    </>}
  </div>;
}
