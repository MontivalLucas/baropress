import { useSession } from "@/stores/session";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/services/database/api";
import { Button, Field } from "@/components/ui/controls";
import type { Appointment, AppointmentInput, PatientSummary, Professional } from "@/types";
import { appointmentStatuses, calendarDays, localDate, shiftCalendar, validAppointmentTimes, type CalendarView } from "./calendarUtils";
import { useDialogFocus } from "@/components/ui/useDialogFocus";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";
import { requestNavigation } from "@/services/navigationGuard";
const selectClass = "w-full p-2 border border-line rounded-lg bg-surface";
export function AgendaPage() {
    const secretary = useSession(s=>s.user?.role === "assistant");
    const [view, setView] = useState<CalendarView>("week");
    const [date, setDate] = useState(localDate());
    const days = useMemo(() => calendarDays(date, view), [date, view]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [form, setForm] = useState<AppointmentInput | null>(null);
    const [editing, setEditing] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");
    const [busy, setBusy] = useState(false);
    const [revision, setRevision] = useState(0);
    const [professionalForm, setProfessionalForm] = useState(false);
    const [newProfessional, setNewProfessional] = useState({ name: "", profession: "", registration: "" });
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const readOnly = secretary && editing !== null;
    const formInitial = useRef("");
    useUnsavedChanges((form !== null && JSON.stringify(form) !== formInitial.current) || (professionalForm && Object.values(newProfessional).some(Boolean)), "A consulta ou o cadastro do profissional tem alterações não salvas.", busy);
    useDialogFocus(!!form || professionalForm, () => requestNavigation(() => { setForm(null); setProfessionalForm(false); }), busy);
    useEffect(() => {
        let live = true;
        setError("");
        Promise.all([api.appointments.list(days[0], days[days.length - 1]), api.patients.list(), api.professionals.list()]).then(([a, p, pr]) => {
            if (live) {
                setAppointments(a);
                setPatients(p);
                setProfessionals(pr);
            }
        }).catch((e) => {
            if (live)
                setError(e.message);
        });
        return () => { live = false; };
    }, [days, revision]);
    function open(day: string, appointment?: Appointment) { setEditing(appointment?.id ?? null); const next: AppointmentInput = appointment ? { patientId: appointment.patientId, professionalId: appointment.professionalId, date: appointment.date, startTime: appointment.startTime, endTime: appointment.endTime ?? "", type: appointment.type ?? "Avaliação", status: appointment.status, notes: appointment.notes } : { patientId: 0, professionalId: null, date: day, startTime: "09:00", endTime: "09:30", type: "Avaliação", status: "scheduled", notes: "" }; formInitial.current = JSON.stringify(next); setForm(next); setFormError(""); setDeleteConfirm(false); }
    async function save() {
        if (!form || busy || readOnly)
            return;
        if (!form.patientId || !validAppointmentTimes(form.startTime, form.endTime)) {
            setFormError("Escolha o paciente e um horário de término posterior ao início.");
            return;
        }
        setBusy(true);
        setFormError("");
        try {
            await api.appointments.save(editing, form);
            setForm(null);
            setRevision((r) => r + 1);
        }
        catch (e) {
            setFormError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    async function remove() {
        if (!editing || busy)
            return;
        setBusy(true);
        try {
            await api.appointments.delete(editing);
            setForm(null);
            setRevision((r) => r + 1);
        }
        catch (e) {
            setFormError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
    <header className="flex flex-wrap justify-between gap-3"><div><h1 className="text-2xl font-semibold">Agenda</h1><p className="text-sm text-mute">Consultas e acompanhamento do consultório.</p></div><div className="flex gap-2">{!secretary && <Button variant="ghost" onClick={() => { setProfessionalForm(true); setFormError(""); }}>Novo profissional</Button>}<Button onClick={() => open(date)}>Nova consulta</Button></div></header>
    {error && <p role="alert" className="text-danger">{error}</p>}
    <div className="flex flex-wrap items-center gap-2"><Button variant="ghost" onClick={() => setDate(shiftCalendar(date, view, -1))} aria-label="Período anterior">←</Button><Button variant="ghost" onClick={() => setDate(localDate())}>Hoje</Button><Button variant="ghost" onClick={() => setDate(shiftCalendar(date, view, 1))} aria-label="Próximo período">→</Button><input type="date" aria-label="Data da agenda" value={date} onChange={(e) => {
            if (e.target.value)
                setDate(e.target.value);
        }} className="p-2 bg-surface border border-line rounded-lg"/>{([['day', 'Dia'], ['week', 'Semana'], ['month', 'Mês']] as const).map(([id, label]) => <Button key={id} variant={view === id ? "primary" : "ghost"} aria-pressed={view === id} onClick={() => setView(id)}>{label}</Button>)}</div>
    <div className={view === "day" ? "space-y-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2"}>
      {days.map((day) => <section key={day} className={`border rounded-xl bg-surface p-2 min-h-[130px] ${day === localDate() ? 'border-brand' : 'border-line'}`}>
        <button className="w-full text-left text-sm font-semibold pb-2 hover:text-brand" onClick={() => open(day)} aria-label={`Nova consulta em ${day}`}>{new Date(`${day}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })} +</button>
        <div className="space-y-2">{appointments.filter((a) => a.date === day).map((a) => <button key={a.id} onClick={() => open(day, a)} className={`w-full text-left border border-line rounded-lg p-2 text-xs hover:bg-line/40 ${a.status === 'cancelled' ? 'opacity-60' : ''}`}><strong className="block">{a.startTime}–{a.endTime ?? '—'}</strong><span className="block break-words">{a.patientName}</span><span className="block text-mute">{a.professionalName ?? 'Sem profissional'}</span><span className="block text-brand">{appointmentStatuses[a.status]}</span></button>)}</div>
      </section>)}
    </div>
    {form && <div role="dialog" aria-modal="true" aria-labelledby="appointment-title" className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><form onSubmit={(e) => { e.preventDefault(); void save(); }} className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-surface border border-line rounded-xl p-5 space-y-3">
      <h2 id="appointment-title" className="text-xl font-semibold">{readOnly ? 'Detalhes do agendamento' : editing ? 'Editar consulta' : 'Nova consulta'}</h2>{formError && <p role="alert" className="text-danger">{formError}</p>}
      <label className="block text-sm">Paciente<select required disabled={busy || readOnly} className={selectClass} value={form.patientId} onChange={(e) => setForm({ ...form, patientId: Number(e.target.value) })}><option value="0">Selecione</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="block text-sm">Profissional<select disabled={busy || readOnly} className={selectClass} value={form.professionalId ?? 0} onChange={(e) => setForm({ ...form, professionalId: Number(e.target.value) || null })}><option value="0">Não informado</option>{professionals.map((p) => <option key={p.id} value={p.id}>{p.name}{p.registration ? ` · ${p.registration}` : ''}</option>)}</select></label>
      <Field label="Data" type="date" required disabled={busy || readOnly} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}/><div className="grid grid-cols-2 gap-3"><Field label="Início" type="time" required disabled={busy || readOnly} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}/><Field label="Término" type="time" required disabled={busy || readOnly} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}/></div>
      <Field label="Tipo da consulta" required maxLength={120} disabled={busy || readOnly} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}/>
      <label className="block text-sm">Status<select className={selectClass} disabled={busy || readOnly} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AppointmentInput['status'] })}>{Object.entries(appointmentStatuses).filter(([id])=>!secretary||readOnly||['scheduled','confirmed'].includes(id)).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="block text-sm">Observações<textarea disabled={busy || readOnly} maxLength={10000} className={selectClass} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}/></label>
      {deleteConfirm && <p role="alert" className="text-danger">Excluir esta consulta? Essa ação remove o agendamento da agenda.</p>}
      <div className="sticky bottom-0 bg-surface py-3 flex flex-wrap gap-2 justify-end">{editing && !secretary && <Button type="button" variant="ghost" disabled={busy} onClick={() => {
                    if (deleteConfirm)
                        void remove();
                    else
                        setDeleteConfirm(true);
                }}>{deleteConfirm ? 'Confirmar exclusão' : 'Excluir consulta'}</Button>}<Button type="button" variant="ghost" disabled={busy} onClick={() => requestNavigation(() => setForm(null))}>{readOnly?'Fechar':'Cancelar'}</Button>{!readOnly&&<Button type="submit" disabled={busy}>{busy ? 'Salvando...' : 'Salvar consulta'}</Button>}</div>
    </form></div>}
    {professionalForm && <div role="dialog" aria-modal="true" aria-labelledby="professional-title" className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4"><form className="max-w-md w-full bg-surface rounded-xl p-5 space-y-3" onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                    await api.professionals.create(newProfessional.name, newProfessional.profession || null, newProfessional.registration || null);
                    setProfessionalForm(false);
                    setNewProfessional({ name: '', profession: '', registration: '' });
                    setRevision((r) => r + 1);
                }
                catch (err) {
                    setFormError((err as Error).message);
                }
                finally {
                    setBusy(false);
                }
            }}>
      <h2 id="professional-title" className="text-lg font-semibold">Novo profissional</h2>{formError && <p role="alert" className="text-danger">{formError}</p>}{(['name', 'profession', 'registration'] as const).map((key) => <Field key={key} label={{ name: 'Nome', profession: 'Profissão', registration: 'Registro profissional' }[key]} required={key === 'name'} maxLength={120} disabled={busy} value={newProfessional[key]} onChange={(e) => setNewProfessional({ ...newProfessional, [key]: e.target.value })}/>)}<div className="flex justify-end gap-2"><Button type="button" variant="ghost" disabled={busy} onClick={() => requestNavigation(() => setProfessionalForm(false))}>Cancelar</Button><Button type="submit" disabled={busy}>Salvar profissional</Button></div>
    </form></div>}
  </div>;
}
