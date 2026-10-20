import { useEffect, useState } from "react";
import { api } from "@/services/database/api";
import type { Appointment, QuestionnaireSession } from "@/types";
import { QuestionnaireHistory } from "@/features/questionnaires/QuestionnaireHistory";
import { appointmentStatuses } from "@/features/agenda/calendarUtils";
import { formatDate } from "./patientUtils";
export function PatientCareHistory({ patientId }: {
    patientId: number;
}) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [sessions, setSessions] = useState<QuestionnaireSession[]>([]);
    const [error, setError] = useState('');
    useEffect(() => {
        let live = true;
        Promise.all([api.appointments.list('1900-01-01', '2999-12-31', patientId), api.questionnaires.history(patientId)]).then(([a, s]) => {
            if (live) {
                setAppointments([...a].reverse());
                setSessions(s);
            }
        }).catch((e) => {
            if (live)
                setError(e.message);
        });
        return () => { live = false; };
    }, [patientId]);
    return <section className="bg-surface border border-line rounded-card p-5 space-y-4"><h2 className="font-semibold">Consultas e anamnese</h2>{error && <p role="alert" className="text-danger">{error}</p>}<details><summary className="cursor-pointer">Consultas ({appointments.length})</summary><ul className="space-y-2 mt-2 text-sm">{appointments.map((a) => <li key={a.id}>{formatDate(a.date)} · {a.startTime} · {appointmentStatuses[a.status]} · {a.professionalName ?? 'Sem profissional'}{a.notes && <p className="text-xs text-mute whitespace-pre-wrap">{a.notes}</p>}</li>)}</ul>{appointments.length === 0 && <p className="text-sm text-mute">Nenhuma consulta registrada.</p>}</details><h3 className="text-sm font-semibold">Questionários respondidos</h3><QuestionnaireHistory sessions={sessions}/></section>;
}
