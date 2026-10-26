import { acquisitionLabel, FOOT_LABELS } from '@/services/examProtocol';
import { savedNumber, lateralDistribution } from "./savedValues";
import { physicalLines } from "@/services/calibration/formatting";
import { analysisLines } from '@/services/examAnalysis/report';
import { temporalPoints, temporalGapLimit } from '@/services/examAnalysis/calculations';
import type { RawFrame } from '@/services/examAnalysis/types';
import { jsPDF } from "jspdf";
import {
  DEFAULT_HEATMAP_SETTINGS,
  type HeatmapConfig,
} from "@/services/baropodometry";
import {
  calculateAge,
  calculateBmi,
  formatHeight,
  formatCpf,
  formatDate,
} from "@/features/patients/patientUtils";

import type { ExamDetails } from "@/types";
import {
  generateReportFileName,
  renderHeatmapToDataUrl,
  validateExamForReport,
} from "./reportUtils";

export interface GeneratePdfOptions {
  acquisitions?: {exam: ExamDetails; frames?: RawFrame[]}[];
  frames?: RawFrame[];
  includeAnalysis?: boolean;
  includeTemporal?: boolean;
  observations?: string;
  evaluatorName?: string;
}

/**
 * Gera o documento PDF oficial em padrão A4 Retrato (2 páginas estruturadas).
 * Reutiliza os dados reais do exame, os parâmetros gravados e o mapa contínuo interpolado.
 */
export async function generateExamReportPdf(
  exam: ExamDetails,
  options?: GeneratePdfOptions
): Promise<jsPDF> {
  const acquisitions = options?.acquisitions ?? [{exam, frames: options?.frames}];
  if (!acquisitions.length) throw new Error('Nenhuma aquisição disponível para o relatório.');
  let document: jsPDF | undefined;
  for (const acquisition of acquisitions) {
    document = await appendExamReport(acquisition.exam, {...options, frames: acquisition.frames}, document, exam.id);
  }
  return document!;
}

async function appendExamReport(
  exam: ExamDetails,
  options: GeneratePdfOptions | undefined,
  document: jsPDF | undefined,
  reportExamId: number,
): Promise<jsPDF> {
  const validation = validateExamForReport(exam);
  if (!validation.valid) {
    throw new Error(validation.error || "Exame inválido para geração de relatório.");
  }

  const doc = document ?? new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  if (document) doc.addPage();

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  const isSim = exam.source === "SIMULATION";

  const heatmapConfig: HeatmapConfig = {
    ...DEFAULT_HEATMAP_SETTINGS,
    ...exam.visualizationSettings,
    gamma: exam.gamma ?? DEFAULT_HEATMAP_SETTINGS.gamma,
    vmax: exam.vmax ?? DEFAULT_HEATMAP_SETTINGS.vmax,
    threshold: exam.threshold ?? DEFAULT_HEATMAP_SETTINGS.threshold,
    smoothing: exam.smoothing ?? DEFAULT_HEATMAP_SETTINGS.smoothing,
  };

  const copPoint =
    exam.copX !== null &&
    exam.copX !== undefined &&
    exam.copY !== null &&
    exam.copY !== undefined
      ? { x: exam.copX, y: exam.copY }
      : null;

  // Renderiza imagem do mapa contínuo em alta resolução
  const heatmapDataUrl = renderHeatmapToDataUrl(
    exam.matrix,
    heatmapConfig,
    copPoint,
    600,
    options?.includeTemporal !== false && options?.frames && exam.analysis ? temporalPoints(options.frames, exam.analysis.series) : undefined,
    exam.analysis ? temporalGapLimit(exam.analysis.quality) : undefined
  );

  const nowFormatted = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // =========================================================================
  // PÁGINA 1
  // =========================================================================

  let y = margin;

  if (!exam.analysis) {
    doc.setFontSize(7);doc.setTextColor(100,116,139);
    doc.text('Exame legado: condicoes, qualidade e serie temporal indisponiveis.',margin,10);
  }
  // 1. Top Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 22, 2.5, 2.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("BAROPRESS", margin + 6, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("SISTEMA DE ANÁLISE BAROPODOMÉTRICA — TCC", margin + 6, y + 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text("RELATÓRIO BAROPODOMÉTRICO", pageWidth - margin - 6, y + 9, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `Exame #${String(reportExamId).padStart(6, "0")} • ${exam.analysis?.acquisition ? FOOT_LABELS[exam.analysis.acquisition.foot] + ' • ' : ''}${formatDate(exam.startedAt)}`,
    pageWidth - margin - 6,
    y + 15,
    { align: "right" }
  );

  y += 25;

  // 2. Banner de Origem (REAL vs SIMULAÇÃO) — Requisito 10 e 41
  if (isSim) {
    doc.setFillColor(250, 245, 255); // purple-50
    doc.setDrawColor(216, 180, 254); // purple-300
    doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(147, 51, 234); // purple-600
    doc.text(
      "ATENÇÃO: EXAME DE SIMULAÇÃO (DADOS GERADOS POR SIMULADOR DE HARDWARE 15×15)",
      pageWidth / 2,
      y + 5,
      { align: "center" }
    );
  } else {
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-300
    doc.roundedRect(margin, y, contentWidth, 7.5, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(
      "ORIGEM: HARDWARE REAL (AQUISIÇÃO VIA ESP32 / SENSORES FÍSICOS)",
      pageWidth / 2,
      y + 5,
      { align: "center" }
    );
  }

  y += 10.5;

  // 3. Bloco: Dados do Paciente (Requisito 9)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("IDENTIFICAÇÃO DO PACIENTE", margin + 4, y + 5);

  const age = calculateAge(exam.patientBirthDate, new Date(exam.startedAt ?? exam.createdAt));
  const bmiInfo = calculateBmi(exam.patientWeight, exam.patientHeight);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  // Linha 1 do paciente
  doc.text(`Nome: ${exam.patientName}`, margin + 4, y + 11);
  doc.text(`CPF: ${exam.patientCpf ? formatCpf(exam.patientCpf) : "Não informado"}`, margin + 95, y + 11);
  doc.text(
    `Idade: ${age !== null ? `${age} anos` : "—"} (${formatDate(exam.patientBirthDate)})`,
    margin + 140,
    y + 11
  );

  // Linha 2 do paciente
  doc.text(`Altura: ${formatHeight(exam.patientHeight)}`, margin + 4, y + 17);
  doc.text(`Peso: ${exam.patientWeight ? `${exam.patientWeight.toFixed(1)} kg` : "—"}`, margin + 45, y + 17);
  doc.text(
    `IMC: ${bmiInfo ? `${bmiInfo.value} kg/m² (${bmiInfo.label})` : "—"}`,
    margin + 95,
    y + 17
  );
  doc.text(`Calçado: ${exam.patientShoeSize ?? "—"}`, margin + 155, y + 17);

  y += 26;
  if (!exam.patientSnapshotPreserved) {
    doc.setFontSize(7);
    doc.text("Registro antigo: dados cadastrais atuais; sem snapshot demográfico da data do exame.", margin, y);
    y += 5;
  }

  // 4. Seção Central: Mapa de Pressão Contínuo (Esquerda) + Indicadores (Direita)
  const mapBoxWidth = 84;
  const mapBoxHeight = 84;
  const rightColX = margin + mapBoxWidth + 6;
  const rightColWidth = contentWidth - mapBoxWidth - 6;

  // Moldura do Mapa
  doc.setFillColor(10, 15, 29); // Fundo escuro oficial da Fase 4
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, mapBoxWidth, mapBoxHeight, 2, 2, "FD");

  if (heatmapDataUrl) {
    doc.addImage(heatmapDataUrl, "PNG", margin + 1.5, y + 1.5, mapBoxWidth - 3, mapBoxHeight - 3);
  }

  // Coluna Direita: Indicadores Baropodométricos Quantitativos (Requisitos 15, 16, 17, 18, 19)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightColX, y, rightColWidth, mapBoxHeight, 2, 2, "FD");

  let ry = y + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("INDICADORES QUANTITATIVOS", rightColX + 4, ry);

  ry += 6;
  // Card Leitura Máxima
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(rightColX + 3, ry, (rightColWidth - 8) / 2, 14, 1.5, 1.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("LEITURA MÁXIMA ADC", rightColX + 5, ry + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(`${Math.round(exam.maxPressure ?? 0)}`, rightColX + 5, ry + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(" ADC", rightColX + 26, ry + 10.5);

  // Card Leitura Média
  const card2X = rightColX + 3 + (rightColWidth - 8) / 2 + 2;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(card2X, ry, (rightColWidth - 8) / 2, 14, 1.5, 1.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("LEITURA MÉDIA ADC", card2X + 2, ry + 4.5);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`${savedNumber(exam.meanPressure, 0)}`, card2X + 2, ry + 10.5);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(" ADC", card2X + 23, ry + 10.5);

  ry += 17;

  // Centro relativo (ADC)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX + 3, ry, rightColWidth - 6, 12, 1.5, 1.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("CENTRO RELATIVO ADC", rightColX + 5, ry + 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(14, 116, 144); // cyan-700
  if (copPoint) {
    doc.text(`X: ${copPoint.x.toFixed(1)}  |  Y: ${copPoint.y.toFixed(1)}`, rightColX + 5, ry + 9.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text("(coords matriz: 0–14)", rightColX + 52, ry + 9.5);
  } else {
    doc.text("Não disponível (sem contato)", rightColX + 5, ry + 9.5);
  }

  ry += 15;

  // Sensores em contato
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightColX + 3, ry, rightColWidth - 6, 12, 1.5, 1.5, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("SENSORES EM CONTATO", rightColX + 5, ry + 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`${(exam.contactAreaPercent ?? 0).toFixed(1)}%`, rightColX + 5, ry + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`(${exam.contactSensors ?? 0} de 225 sensels)`, rightColX + 28, ry + 9.5);

  ry += 15;

  // Distribuição Lateral de Carga (Requisitos 17 e 18)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("CARGA POR METADES DO TAPETE (E / D)", rightColX + 3, ry + 2);

  ry += 5;
  const lateral = lateralDistribution(exam.leftPercent, exam.rightPercent);
  const leftPct = lateral.leftWidth;
  const rightPct = lateral.rightWidth;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.text(`Esq: ${lateral.leftText}`, rightColX + 3, ry + 3);

  doc.setTextColor(217, 119, 6); // amber-600
  doc.text(`Dir: ${lateral.rightText}`, rightColX + rightColWidth - 3, ry + 3, { align: "right" });

  ry += 5;
  // Barra Horizontal Proporcional
  const barWidth = rightColWidth - 6;
  const barHeight = 4.5;
  const leftBarW = (barWidth * Math.min(100, Math.max(0, leftPct))) / 100;
  const rightBarW = (barWidth * Math.min(100, Math.max(0, rightPct))) / 100;

  doc.setFillColor(2, 132, 199);
  doc.roundedRect(rightColX + 3, ry, leftBarW, barHeight, 1, 1, "F");

  doc.setFillColor(217, 119, 6);
  doc.roundedRect(rightColX + 3 + leftBarW, ry, rightBarW, barHeight, 1, 1, "F");

  ry += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Carga Absoluta: ${Math.round(exam.leftLoad ?? 0)} ADC (Esq)  |  ${Math.round(exam.rightLoad ?? 0)} ADC (Dir)`,
    rightColX + 3,
    ry
  );

  y += mapBoxHeight + 3;

  // 5. Legenda de Intensidade Térmica (Requisito 14)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, mapBoxWidth, 12, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text("ESCALA BAROPODOMÉTRICA (ADC RELATIVO)", margin + mapBoxWidth / 2, y + 3.5, { align: "center" });

  // Gradiente simulado em faixas
  const legendBarY = y + 5;
  const legendBarW = mapBoxWidth - 8;
  const segW = legendBarW / 5;
  const segColors = [
    [29, 78, 216],  // azul
    [6, 182, 212],  // ciano
    [16, 185, 129], // verde
    [234, 179, 8],  // amarelo
    [225, 29, 72],  // vermelho
  ];
  for (let s = 0; s < 5; s++) {
    doc.setFillColor(segColors[s][0], segColors[s][1], segColors[s][2]);
    doc.rect(margin + 4 + s * segW, legendBarY, segW, 2.5, "F");
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text("0 (Baixa)", margin + 4, legendBarY + 5.5);
  doc.text(`VMAX: ${heatmapConfig.vmax} ADC (Alta)`, margin + mapBoxWidth - 4, legendBarY + 5.5, {
    align: "right",
  });

  y += 16;

  // 6. Resumo Rápido da Sessão na Página 1
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("DADOS DA SESSÃO DE AVALIAÇÃO", margin + 4, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tipo: Exame Estático (Plataforma 15×15)`, margin + 4, y + 10);
  doc.text(`Duração: ${savedNumber(exam.duration, 1, " s")}`, margin + 95, y + 10);
  doc.text(`Quadros Coletados: ${exam.frameCount ?? "—"}`, margin + 4, y + 15);
  doc.text(`Quadros/s na janela: ${savedNumber(exam.fps)}`, margin + 95, y + 15);

  doc.text(
    `Parâmetros: Limiar ${exam.threshold ?? 150} ADC • VMAX ${exam.vmax ?? 2200} ADC • Gamma ${exam.gamma ?? 1.3} • Tara ${exam.tareApplied ? "Ativa" : "Inativa"}`,
    margin + 4,
    y + 20
  );

  // Rodapé da Página 1
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `BAROPRESS • Relatório gerado em ${nowFormatted} • Página 1 de 2`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  // =========================================================================
  // PÁGINA 2
  // =========================================================================
  doc.addPage();
  y = margin;

  // 1. Cabeçalho Secundário
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("BAROPRESS — DETALHAMENTO TÉCNICO E OBSERVAÇÕES", margin + 5, y + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Exame #${String(reportExamId).padStart(6, "0")} • Paciente: ${exam.patientName}`,
    margin + 5,
    y + 11
  );

  y += 18;

  // 2. Tabela de Parâmetros da Análise (Requisito 21) & Dados de Aquisição (Requisito 20)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("PARÂMETROS DA ANÁLISE E METADADOS DA AQUISIÇÃO", margin + 4, y + 5.5);

  // Grade de 2 colunas
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 4;
  const col2X = margin + 95;
  let py = y + 12;

  // Coluna 1: Parâmetros do Mapa
  doc.text(`Threshold (Limiar): ${exam.threshold !== null ? `${exam.threshold} ADC` : "Não informado"}`, col1X, py);
  doc.text(`VMAX (limite de cor): ${exam.vmax !== null ? `${exam.vmax} ADC` : "Não informado"}`, col1X, py + 5.5);
  doc.text(`Gamma de Contraste: ${exam.gamma !== null ? `${exam.gamma}` : "Não informado"}`, col1X, py + 11);
  doc.text(`Suavização Gaussiana: ${exam.smoothing !== null ? `${exam.smoothing}` : "Não informado"}`, col1X, py + 16.5);
  doc.text(`Compensação de Tara: ${exam.tareApplied ? "Aplicada (zero)" : "Não aplicada"}`, col1X, py + 22);

  // Coluna 2: Dados da Aquisição
  doc.text(`Duração Total: ${exam.duration !== null ? `${exam.duration.toFixed(1)} segundos` : "Não informado"}`, col2X, py);
  doc.text(`Quadros Coletados: ${savedNumber(exam.frameCount,0)} quadros válidos`, col2X, py + 5.5);
  doc.text(`Quadros/s na janela: ${savedNumber(exam.fps,1)}`, col2X, py + 11);
  doc.text(`Dimensão da Matriz: 15 × 15 (225 transdutores resistivos)`, col2X, py + 16.5);
  doc.text(`Origem dos Dados: ${isSim ? "Simulador Virtual (MOCK)" : "Hardware Serial ESP32 (REAL)"}`, col2X, py + 22);

  y += 42;

  // 3. Nota Estrita sobre Calibração e Unidades Físicas (Requisito 22)
  doc.setFillColor(254, 252, 232); // yellow-50
  doc.setDrawColor(254, 240, 138); // yellow-200
  doc.roundedRect(margin, y, contentWidth, 23, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(161, 98, 7); // yellow-800
  doc.text("NOTA SOBRE CALIBRAÇÃO E UNIDADES DE MEDIDA", margin + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  doc.setTextColor(113, 63, 18);
  const calibText =
    "As leituras apresentadas neste relatório correspondem a valores relativos do conversor analógico-digital (ADC 0–4095). Não representam unidades físicas de força ou pressão. A conversão para unidades físicas depende de procedimento de calibração validado com referência apropriada.";
  doc.text(doc.splitTextToSize(calibText, contentWidth - 8), margin + 4, y + 10.5);

  y += 27;

  // 4. Observações Clínicas Editáveis (Requisito 23)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 68, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("ANOTAÇÕES E OBSERVAÇÕES CLÍNICAS (PREENCHIMENTO MANUAL)", margin + 4, y + 5.5);

  const observations =
    options?.observations ?? exam.notes ?? "";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.8);
  doc.setTextColor(51, 65, 85);

  let remainingObservations: string[] = [];
  if (observations.trim()) {
    const splitObs = doc.splitTextToSize(observations, contentWidth - 8);
    doc.text(splitObs.slice(0, 16), margin + 4, y + 12);
    remainingObservations = splitObs.slice(16);
  } else {
    // Linhas pautadas elegantes para anotação manuscrita
    for (let l = 0; l < 7; l++) {
      const lineY = y + 14 + l * 7.5;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin + 4, lineY, margin + contentWidth - 4, lineY);
    }
  }

  y += 72;

  // 5. Responsável pela Avaliação e Assinatura (Requisitos 24 e 25)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("RESPONSÁVEL PELA AVALIAÇÃO", margin + 4, y + 5.5);

  const evaluator =
    options?.evaluatorName ?? exam.professionalName ?? "Responsável não informado";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Profissional: ${evaluator}`, margin + 4, y + 11.5);

  // Linha de assinatura
  const sigLineX = margin + 100;
  const sigLineW = contentWidth - 105;
  doc.setDrawColor(100, 116, 139);
  doc.line(sigLineX, y + 23, sigLineX + sigLineW, y + 23);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Assinatura do Responsável Técnico", sigLineX + sigLineW / 2, y + 27.5, {
    align: "center",
  });

  y += 38;

  // 6. Aviso Técnico Obrigatório (Requisito 27)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 19, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text("AVISO TÉCNICO", margin + 4, y + 4.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  const disclaimer =
    "Este relatório apresenta dados instrumentais obtidos pelo sistema BAROPRESS. Os valores são relativos ao ADC e não constituem diagnóstico médico. A interpretação clínica dos resultados deve ser realizada por profissional habilitado.";
  doc.text(doc.splitTextToSize(disclaimer, contentWidth - 8), margin + 4, y + 9.5);

  // Rodapé da Página 2 (Requisito 26)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `BAROPRESS Sistema de Análise Baropodométrica • Relatório gerado em ${nowFormatted} • Página 2 de 2`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  while (remainingObservations.length) {
    doc.addPage("a4", "portrait");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`BAROPRESS — Observações (continuação) — Exame #${reportExamId}`, margin, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.text(remainingObservations.slice(0, 60), margin + 4, 32);
    remainingObservations = remainingObservations.slice(60);
  }
  if (exam.physicalResult) {
    const result = exam.physicalResult;
    doc.addPage();
    doc.setTextColor(15,23,42); doc.setFontSize(13); doc.setFont("helvetica","bold");
    doc.text("BAROPRESS - Resultados fisicos experimentais", margin, 20);
    doc.setFont("helvetica","normal"); doc.setFontSize(9);
    let physicalY = 30;
    for (const line of physicalLines(result)) { const lines = doc.splitTextToSize(line, contentWidth); doc.text(lines,margin,physicalY); physicalY += lines.length*5+2; }
    doc.setFontSize(8);
    const warningLines = doc.splitTextToSize(result.warnings.join(" ")+" As paginas anteriores preservam o mapa e as metricas ADC. Este anexo usa a conversao quadro a quadro e o perfil salvo no exame.",contentWidth);
    doc.text(warningLines,margin,physicalY); physicalY+=warningLines.length*4+6;
    const mat=result.profile.mat;
    if (result.profile.scope === "LOCAL_PRESSURE" && mat.widthMm && mat.heightMm) {
      const values=result.mean.pressureKPa;
      const vmax=Math.max(1,...values.filter((v):v is number=>v!==null));
      doc.text(`Mapa discreto medio (kPa): 0 a ${vmax.toFixed(2)}; cinza: indisponivel`,margin,physicalY);
      physicalY+=5;
      const size=Math.min(100,270-physicalY);
      for (let i=0;i<225;i++) { const cell=mat.cells[i];if(cell.xMm===null||cell.yMm===null)continue;const v=values[i];if(v===null)doc.setFillColor(120,120,120);else doc.setFillColor(255*(v/vmax),50,255*(1-v/vmax));doc.circle(margin+size*cell.xMm/mat.widthMm,physicalY+size*cell.yMm/mat.heightMm,1.6,"F"); }
    }
  }
  if (exam.analysis?.acquisition && options?.includeAnalysis === false) {
  doc.addPage(); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(15,23,42);
  doc.text('BAROPRESS - Modalidade de aquisicao', margin, 20);
  doc.setFont('helvetica','normal'); doc.setFontSize(9);
  const modalityLines = [acquisitionLabel(exam.analysis?.acquisition), 'Duracao desta etapa: ' + (exam.duration ?? 'indisponivel') + ' segundos.', 'Trajeto em ciano: centro relativo ponderado pelas leituras ADC.'];
  if (exam.analysis?.acquisition?.foot && exam.analysis.acquisition.foot !== 'both') modalityLines.push('Aquisicao individual. A distribuicao por metades do tapete nao representa a carga entre os dois pes simultaneamente.');
  if (exam.analysis?.acquisition?.totalStages === 2) modalityLines.push('Coletas individuais reunidas no mesmo exame. Cada pe preserva sua matriz e serie temporal.');
  let modalityY = 32;
  for (const line of modalityLines) { const wrapped = doc.splitTextToSize(line.replaceAll('→',' / '),contentWidth); doc.text(wrapped,margin,modalityY); modalityY += wrapped.length*5+3; }
  }
  if (options?.includeAnalysis !== false && exam.analysis) {
    doc.addPage(); doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(15,23,42);
    doc.text(`BAROPRESS - Condicoes e analise - Exame #${reportExamId}`,margin,20);
    doc.setFont('helvetica','normal'); doc.setFontSize(9); let y=30;
    for(const line of analysisLines(exam,options?.includeTemporal===false?undefined:options?.frames)) {
      const wrapped=doc.splitTextToSize(line.replaceAll('≤','<=').replaceAll('≥','>=').replaceAll('·',' / ').replaceAll('–','-'),contentWidth) as string[];
      for(const part of wrapped){if(y>270){doc.addPage();y=20;}doc.text(part,margin,y);y+=5;}y+=2;
    }
  }
  if(options?.includeTemporal!==false && options?.frames && exam.analysis) {
    const points=temporalPoints(options.frames,exam.analysis.series), gap=temporalGapLimit(exam.analysis.quality), end=Math.max(1,exam.analysis.quality.plannedMs);
    doc.addPage();doc.setTextColor(15,23,42);doc.setFontSize(12);doc.text('BAROPRESS - Centro ADC relativo - sem filtro',margin,20);doc.setFontSize(8);
    doc.text(`Recepcao no computador; lacunas > ${gap.toFixed(1)} ms e ausencia de contato separam segmentos.`,margin,28);
    for(const [graph,top] of [['trajectory',40],['x',120],['y',200]] as const) {
      const bottom=top+55, left=margin+12,width=160;
      doc.setDrawColor(148,163,184);doc.line(left,top,left,bottom);doc.line(left,bottom,left+width,bottom);
      doc.text(graph==='trajectory'?'Trajetoria X/Y (celulas)':`${graph.toUpperCase()}(t) - celulas / tempo (s)`,left,top-3);
      doc.text('14',margin,top+2);doc.text('0',margin,bottom);doc.text(graph==='trajectory'?'0 a 14 celulas':`0 a ${(end/1000).toFixed(3)} s`,left+110,bottom+6);
      doc.setDrawColor(2,132,199);
      const position=(p:typeof points[number])=>[left+(graph==='trajectory'?p.x!/14:p.timestampMs/end)*width,bottom-(graph==='x'?p.x!:p.y!)/14*55];
      for(let i=0;i<points.length;i++){const p=points[i],prev=points[i-1];if(p.x===null||p.y===null)continue;const xy=position(p);if(prev && prev.x!==null&&prev.y!==null&&p.timestampMs>prev.timestampMs&&p.timestampMs-prev.timestampMs<=gap){const a=position(prev);doc.line(a[0],a[1],xy[0],xy[1]);}else doc.circle(xy[0],xy[1],0.3,'S');}
      if(graph!=='trajectory'){doc.setDrawColor(245,158,11);for(const event of exam.analysis.events){const x=left+event.timestampMs/end*width;doc.line(x,top,x,bottom);}}
    }
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFillColor(255, 255, 255);
    doc.rect(0, pageHeight - 13, pageWidth, 13, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`BAROPRESS • Gerado em ${nowFormatted} • Página ${page} de ${pages}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  }
  return doc;
}

/**
 * Gera e dispara o download/salvamento do arquivo PDF com nome sanitizado no padrão Windows.
 */
export async function downloadExamReportPdf(
  exam: ExamDetails,
  options?: GeneratePdfOptions
): Promise<string> {
  const doc = await generateExamReportPdf(exam, options);
  const fileName = generateReportFileName(exam.patientName, exam.startedAt);

  // doc.save() aciona o download local transparente no ambiente desktop (WebView2)
  doc.save(fileName);
  return fileName;
}
