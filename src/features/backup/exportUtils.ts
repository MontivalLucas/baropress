import type { ExamDetails } from "@/types";
export function examMatrixCsv(exam: ExamDetails): string {
    if (exam.matrix.length !== 225 || exam.matrix.some((v) => !Number.isFinite(v) || v < 0 || v > 4095))
        throw new Error("Matriz incompleta ou inválida para exportação.");
    return "sensor_index,row,column,adc,exam_id,patient_id,source,matrix_type\r\n" + exam.matrix.map((v, i) => [i, Math.floor(i / 15), i % 15, v, exam.id, exam.patientId, exam.source, "temporal_mean"].join(",")).join("\r\n") + "\r\n";
}
export function downloadTextFile(content: string, name: string, type = "application/json") {
    const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function backupFileName(patientId?: number, date = new Date()) { return `BAROPRESS_${patientId ? `paciente_${patientId}` : "completo"}_${date.toISOString().replace(/[:.]/g, "-")}.baropress.json`; }
