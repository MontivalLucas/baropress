import { describe, expect, it } from "vitest";
import { lateralDistribution, savedNumber } from "@/features/reports/savedValues";
import { validateExamForReport } from "@/features/reports/reportUtils";
import type { ExamDetails } from "@/types";
import { formatHeight } from "@/features/patients/patientUtils";
describe("Auditoria — fidelidade dos dados exibidos", () => {
  it("exibe centímetros sem rotular altura de 175 cm como 175 m", () => { expect(formatHeight(175)).toBe("175 cm"); expect(formatHeight(1.75)).toBe("175 cm"); expect(formatHeight(null)).toBe("Não disponível"); });
  it("não inventa equilíbrio para ausência de carga", () => expect(lateralDistribution(null, null)).toMatchObject({available:false,leftWidth:0,rightWidth:0,leftText:"Não disponível",rightText:"Não disponível"}));
  it("preserva zero real e indica metadado ausente", () => { expect(savedNumber(0,1," FPS")).toBe("0.0 FPS"); expect(savedNumber(null,1," s")).toBe("Não disponível"); });
  it("preserva percentuais existentes", () => expect(lateralDistribution(42.5,57.5)).toMatchObject({available:true,leftWidth:42.5,rightWidth:57.5}));
  it("recusa matriz inválida dentro de um exame salvo", () => { const exam={id:1,patientId:1,status:"completed",source:"SIMULATION",maxPressure:100,matrix:Array(225).fill(100)} as ExamDetails; expect(validateExamForReport(exam).valid).toBe(true); exam.matrix[0]=NaN; expect(validateExamForReport(exam).valid).toBe(false); exam.matrix[0]=4096; expect(validateExamForReport(exam).valid).toBe(false); });
});
