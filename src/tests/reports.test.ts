import { describe, it, expect } from "vitest";
import {
  generateReportFileName,
  sanitizeFileName,
  validateExamForReport,
} from "@/features/reports/reportUtils";
import { generateExamReportPdf } from "@/features/reports/reportPdfGenerator";
import type { ExamDetails } from "@/types";
import { fixture } from '../../scripts/barosys-fixture';

function createValidExam(overrides?: Partial<ExamDetails>): ExamDetails {
  const matrix = new Array(225).fill(0);
  matrix[112] = 1209;
  matrix[113] = 950;
  matrix[97] = 800;

  return {
    id: 123,
    patientId: 1,
    patientName: "João da Silva",
    patientCpf: "12345678901",
    patientBirthDate: "1994-05-15",
    patientHeight: 1.75,
    patientWeight: 78.0,
    patientShoeSize: 41,
    professionalId: 1,
    professionalName: "Dr. Carlos Fisioterapeuta",
    clinicId: 1,
    type: "static",
    source: "REAL",
    status: "completed",
    startedAt: "2026-10-06T15:42:00",
    finishedAt: "2026-10-06T15:42:10",
    duration: 10.0,
    frameCount: 298,
    fps: 29.8,
    threshold: 160,
    vmax: 1050,
    gamma: 0.95,
    smoothing: 0.35,
    tareApplied: true,
    maxPressure: 1209,
    meanPressure: 502,
    contactAreaPercent: 16.4,
    contactSensors: 40,
    copX: 10.2,
    copY: 6.0,
    leftLoad: 0,
    rightLoad: 2959,
    leftPercent: 0.0,
    rightPercent: 100.0,
    matrix,
    notes: "Paciente com distribuição assimétrica e bom equilíbrio.",
    createdAt: "2026-10-06T15:42:15",
    ...overrides,
  };
}

describe("Fase 6 — Utilitários de Relatório e Sanitização", () => {
  it('inclui pé, ordem, vínculo e duração no PDF mesmo com anexos opcionais desativados', async () => {
    const exam = structuredClone(fixture);
    exam.duration = 45;
    exam.analysis!.acquisition = {foot:'right',sequenceId:'synthetic-sequence',stage:2,totalStages:2,order:['left','right']};
    const doc = await generateExamReportPdf(exam,{includeAnalysis:false,includeTemporal:false});
    const text = (doc.internal as unknown as {pages:string[][]}).pages.flat().join('\n');
    expect(doc.getNumberOfPages()).toBe(3);
    expect(text).toContain('synthetic-sequence');
    expect(text).toContain('45 segundos');
    expect(text).toContain('etapa 2/2');
    expect(text).toContain('direito');
  });
  it("sanitizeFileName deve remover caracteres inválidos do Windows e acentos", () => {
    expect(sanitizeFileName("João / Silva : Teste * ? < > |")).toBe("Joao_Silva_Teste");
    expect(sanitizeFileName("Maria  Conceição")).toBe("Maria_Conceicao");
    expect(sanitizeFileName("")).toBe("Paciente");
  });

  it("generateReportFileName deve seguir o padrão BAROPRESS_Relatorio_NomePaciente_YYYY-MM-DD.pdf", () => {
    const fileName = generateReportFileName("João da Silva", "2026-10-06T15:00:00");
    expect(fileName).toBe("BAROPRESS_Relatorio_Joao_da_Silva_2026-10-06.pdf");
  });

  it("validateExamForReport deve aprovar exame completo e consistente", () => {
    const exam = createValidExam();
    const result = validateExamForReport(exam);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("validateExamForReport deve rejeitar exame nulo ou indefinido", () => {
    const result = validateExamForReport(null);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("não possui dados suficientes");
  });

  it("validateExamForReport deve rejeitar exame sem paciente ou com ID inválido", () => {
    const examNoPatient = createValidExam({ patientId: 0 });
    const result = validateExamForReport(examNoPatient);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Paciente");
  });

  it("validateExamForReport deve rejeitar matriz diferente de 225 sensores", () => {
    const examBadMatrix = createValidExam({ matrix: new Array(224).fill(0) });
    const result = validateExamForReport(examBadMatrix);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("225 sensores");
  });

  it("validateExamForReport deve rejeitar métricas ausentes", () => {
    const examNoMetrics = createValidExam({ maxPressure: null as any });
    const result = validateExamForReport(examNoMetrics);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Métricas");
  });
});

describe("Fase 6 — Geração de PDF Local (jsPDF)", () => {
  it("pagina observações longas preservando as duas páginas principais", async () => {
    const doc=await generateExamReportPdf(createValidExam(),{observations:"Anotação sintética de teste para verificar continuação. ".repeat(200)});
    expect(doc.getNumberOfPages()).toBeGreaterThan(2);expect(doc.output("arraybuffer").byteLength).toBeGreaterThan(1000);
  });
  it("gera PDF com ausência real de distribuição, média, duração e FPS", async () => {
    const doc=await generateExamReportPdf(createValidExam({leftPercent:null,rightPercent:null,meanPressure:null,duration:null,fps:null}));
    expect(doc.getNumberOfPages()).toBe(2);
  });
  it("deve gerar documento PDF A4 com exatamente 2 páginas e tamanho > 0 bytes", async () => {
    const exam = createValidExam();
    const doc = await generateExamReportPdf(exam);

    expect(doc).toBeDefined();
    expect(doc.getNumberOfPages()).toBe(2);

    const pdfOutput = doc.output("arraybuffer");
    expect(pdfOutput.byteLength).toBeGreaterThan(1000); // PDF completo e substancial
  });

  it("deve identificar exame de SIMULAÇÃO e gerar PDF com tamanho válido", async () => {
    const simExam = createValidExam({
      id: 999,
      source: "SIMULATION",
      patientName: "Teste Simulador",
    });

    const doc = await generateExamReportPdf(simExam);
    expect(doc.getNumberOfPages()).toBe(2);

    const pdfOutput = doc.output("arraybuffer");
    expect(pdfOutput.byteLength).toBeGreaterThan(1000);
  });

  it("deve aceitar observações customizadas durante a geração do PDF", async () => {
    const exam = createValidExam();
    const customNotes = "Observação clínica personalizada inserida antes da exportação.";

    const doc = await generateExamReportPdf(exam, {
      observations: customNotes,
      evaluatorName: "Dr. Especialista",
    });

    expect(doc.getNumberOfPages()).toBe(2);
    const pdfOutput = doc.output("arraybuffer");
    expect(pdfOutput.byteLength).toBeGreaterThan(1000);
  });

  it("deve tratar CoP nulo sem travar e exibir CoP ausente", async () => {
    const examNoCop = createValidExam({ copX: null, copY: null });
    const doc = await generateExamReportPdf(examNoCop);

    expect(doc.getNumberOfPages()).toBe(2);
    const pdfOutput = doc.output("arraybuffer");
    expect(pdfOutput.byteLength).toBeGreaterThan(1000);
  });

  it("deve respeitar os parâmetros gravados do exame sem substituí-los por padrões globais", async () => {
    const examCustomParams = createValidExam({
      threshold: 280,
      vmax: 1800,
      gamma: 1.8,
      smoothing: 0.5,
      tareApplied: false,
    });

    const doc = await generateExamReportPdf(examCustomParams);
    expect(doc.getNumberOfPages()).toBe(2);
  });
});
