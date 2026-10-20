import { describe, expect, it } from "vitest";
import { calculateMetrics, DEFAULT_HEATMAP_SETTINGS } from "@/services/baropodometry";
import { processExamSample } from "@/features/exams/examProcessing";
import { normalizeMatrixOrientation } from "@/services/acquisition";
describe("Auditoria — integridade científica", () => {
  it("ajustes visuais não alteram matriz média nem métricas", () => {
    const frames=[Array(225).fill(300),Array(225).fill(500)];const before=frames.map(f=>[...f]);
    const params={patientId:1,frames,durationSeconds:10,fps:30,settings:{...DEFAULT_HEATMAP_SETTINGS},tareApplied:false,source:"SIMULATION" as const};
    const first=processExamSample(params),second=processExamSample({...params,settings:{...params.settings,gamma:2.5,vmax:4000,smoothing:0.8,renderFps:10,resolution:450,showCop:false}});
    expect(second.averageMatrix).toEqual(first.averageMatrix);expect(second.metrics).toEqual(first.metrics);expect(frames).toEqual(before);
  });
  it("espelha uma vez e exclui a coluna central apenas do denominador lateral", () => {
    const raw=Array(225).fill(0);raw[3]=1000;raw[7]=500;
    const oriented=normalizeMatrixOrientation(raw);expect(oriented[11]).toBe(1000);expect(raw[3]).toBe(1000);
    const metrics=calculateMetrics(oriented,150);expect(metrics.rightPercentage).toBe(100);expect(metrics.leftPercentage).toBe(0);expect(metrics.totalPressure).toBe(1500);expect(metrics.contactSensorCount).toBe(2);
  });
});
