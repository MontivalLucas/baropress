import { describe, expect, it } from "vitest";
import { chronologicalExams, commonMapSettings, metricDelta, validateComparison, comparisonLimits } from "@/features/comparison/comparisonUtils";
import { fixture } from '../../scripts/barosys-fixture';
import { processExamSample } from "@/features/exams/examProcessing";
import { DEFAULT_HEATMAP_SETTINGS } from "@/services/baropodometry";
import type { ExamDetails } from "@/types";
const exam = (id: number, patientId = 1): ExamDetails => ({ id, patientId, status: "completed", matrix: new Array(225).fill(100), startedAt: `2026-10-0${id}T12:00:00Z`, createdAt: "2026-10-01", vmax: id * 1000, maxPressure: 100 } as ExamDetails);
describe("Fase 7 — comparação", () => {
  it('bloqueia diferenças quantitativas entre pés/modalidades ou durações diferentes', () => {
    const first = structuredClone(fixture), second = structuredClone(fixture);
    first.analysis!.acquisition={foot:'left',stage:1,totalStages:1,order:['left'],sequenceId:null};
    second.analysis!.acquisition={foot:'right',stage:1,totalStages:1,order:['right'],sequenceId:null};
    second.duration=45;
    expect(comparisonLimits([first,second]).join(' ')).toContain('Modalidades/pés diferentes');
    expect(comparisonLimits([first,second]).join(' ')).toContain('Durações de coleta diferentes');
  });
  it("aceita de 2 a 4 exames completos do mesmo paciente", () => { expect(validateComparison([exam(1), exam(2)])).toBeNull(); expect(validateComparison([exam(1), exam(2), exam(3), exam(4)])).toBeNull(); });
  it("rejeita duplicados, outro paciente, matriz incompleta e quantidade inválida", () => {
    expect(validateComparison([exam(1)])).toBeTruthy(); expect(validateComparison([exam(1), exam(1)])).toBeTruthy();
    expect(validateComparison([exam(1), exam(2, 2)])).toContain("mesmo paciente");
    const invalid = exam(2); invalid.matrix = [NaN]; expect(validateComparison([exam(1), invalid])).toBeTruthy();
    expect(validateComparison([1, 2, 3, 4, 5].map((id) => exam(id)))).toBeTruthy();
  });
  it("não divide por zero e preserva ausência de métricas", () => { expect(metricDelta(0, 100)).toEqual({ absolute: 100, percent: null }); expect(metricDelta(null, 100)).toBeNull(); expect(metricDelta(100, 80)?.percent).toBe(-20); });
  it("ordena por data e fixa uma escala comum sem modificar os exames", () => { const input = [exam(3), exam(1), exam(2)]; expect(chronologicalExams(input).map((e) => e.id)).toEqual([1, 2, 3]); expect(commonMapSettings(input).vmax).toBe(3000); expect(input[0].id).toBe(3); });
  it("ordena instantes com fusos diferentes pelo tempo real",()=>{const first=exam(1),second=exam(2);first.startedAt='2026-10-07T13:00:00-03:00';second.startedAt='2026-10-07T15:00:00Z';expect(chronologicalExams([first,second]).map((e)=>e.id)).toEqual([2,1]);});
  it("usa os tempos de captura e omite CoP quando não há contato", () => {
    const frame = new Array(225).fill(0); frame[112] = 1000;
    const result = processExamSample({ patientId: 1, frames: [new Array(225).fill(0), frame], frameTimestampsMs: [30, 72], durationSeconds: 10, fps: 30, settings: DEFAULT_HEATMAP_SETTINGS, tareApplied: false, source: "REAL" });
    expect(result.examInput.copTrajectory).toEqual([{ timestampMs: 72, x: 7, y: 7 }]);
  });
});
