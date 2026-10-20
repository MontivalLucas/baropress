import type { QuestionnaireSession } from "@/types";
import { formatDateTime } from "@/features/patients/patientUtils";
import { formatAnswer } from "./questionnaireUtils";
export function QuestionnaireHistory({ sessions }: {
    sessions: QuestionnaireSession[];
}) {
    return <div className="space-y-3">{sessions.length === 0 && <p className="text-sm text-mute">Nenhum questionário respondido.</p>}{sessions.map((s) => <details key={s.id} className="bg-surface border border-line rounded-xl p-3"><summary className="cursor-pointer font-medium">{s.questionnaire.name} · {formatDateTime(s.answeredAt)}</summary><dl className="mt-3 space-y-3">{s.questionnaire.questions.filter((q) => q.active).map((q) => <div key={q.id}><dt className="text-xs text-mute">{q.groupName} · {q.question}</dt><dd className="text-sm whitespace-pre-wrap break-words">{formatAnswer(s.answers.find((a) => a.questionId === q.id)?.value)}</dd></div>)}</dl></details>)}</div>;
}
