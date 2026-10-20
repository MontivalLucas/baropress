import type { AnswerValue, Question, Questionnaire } from "@/types";
export const questionTypes = { text: "Aberta", single: "Seleção única", multi: "Múltipla seleção", number: "Número", yesno: "Sim/Não" } as const;
export function blankQuestion(): Question { return { id: null, groupName: "Geral", question: "", type: "text", options: [], required: false, active: true }; }
export function validateAnswer(q: Question, value: AnswerValue | undefined): string | null {
    if (!q.active)
        return null;
    const empty = value == null || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && !value.length);
    if (empty)
        return q.required ? `Responda: ${q.question}` : null;
    const valid = q.type === "text" ? typeof value === "string" : q.type === "number" ? typeof value === "number" && Number.isFinite(value) : q.type === "yesno" ? typeof value === "boolean" : q.type === "single" ? typeof value === "string" && q.options.includes(value) : Array.isArray(value) && value.every((v) => q.options.includes(v)) && new Set(value).size === value.length;
    return valid ? null : `Resposta inválida: ${q.question}`;
}
export function validateTemplate(q: Questionnaire): string | null {
    if (!q.name.trim() || !q.questions.length)
        return "Informe o nome e pelo menos uma pergunta.";
    for (const p of q.questions) {
        if (!p.question.trim() || !p.groupName.trim())
            return "Preencha o grupo e o texto de cada pergunta.";
        if ((p.type === "single" || p.type === "multi") && (p.options.length < 2 || p.options.some((s) => !s.trim()) || new Set(p.options.map((s) => s.trim())).size !== p.options.length))
            return "Informe pelo menos duas opções distintas por seleção.";
    }
    return null;
}
export function formatAnswer(value: AnswerValue | undefined) { return value == null || value === "" ? "Não respondido" : typeof value === "boolean" ? (value ? "Sim" : "Não") : Array.isArray(value) ? value.join(", ") : String(value); }
