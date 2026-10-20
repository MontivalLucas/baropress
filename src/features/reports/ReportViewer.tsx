import { acquisitionLabel } from '@/services/examProtocol';
import { SequenceLinks } from '@/features/exams/SequenceLinks';
import { isClinical } from "@/features/auth/permissions";
import { useSession } from "@/stores/session";
import { AnalysisGraphs } from '@/features/exams/AnalysisGraphs';
import { analysisLines } from '@/services/examAnalysis/report';
import { temporalPoints,temporalGapLimit } from '@/services/examAnalysis/calculations';
import type { RawFrame } from '@/services/examAnalysis/types';
import { PhysicalResults } from "@/features/calibration/PhysicalResults";
import { savedNumber, lateralDistribution } from "./savedValues";
import React, { useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Download,
  Footprints,
  Percent,
  Printer,
  User,
} from "lucide-react";
import { BaropodometricHeatmap } from "@/features/baropodometry/BaropodometricHeatmap";
import { PressureLegend } from "@/features/baropodometry/PressureLegend";
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
  formatDateTime,
} from "@/features/patients/patientUtils";
import type { ExamDetails } from "@/types";
import { downloadExamReportPdf } from "./reportPdfGenerator";
import { api } from "@/services/database/api";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";

interface ReportViewerProps {
  exam: ExamDetails;
  onBack: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ exam, onBack }) => {
  const [frames,setFrames]=useState<RawFrame[]|undefined>();
  const [includeAnalysis,setIncludeAnalysis]=useState(true),[includeTemporal,setIncludeTemporal]=useState(true);
  const clinical=useSession(s=>isClinical(s.user?.role));
  const [observations, setObservations] = useState(exam.notes || "");
  const [savedObservations, setSavedObservations] = useState(exam.notes || "");
  const [saving, setSaving] = useState(false);
  const dirty = observations !== savedObservations;
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  useUnsavedChanges(dirty, "As observações do documento ainda não foram salvas no exame.", saving || exporting);

  async function saveObservations() {
    if (saving || exporting) return;
    setSaving(true); setExportMessage(null);
    try {
      const saved = await api.exams.updateNotes(exam.id, observations);
      setObservations(saved.notes || ""); setSavedObservations(saved.notes || "");
      setExportMessage("✓ Observações salvas no exame.");
    } catch (error) { setExportMessage(`Erro ao salvar: ${(error as Error).message}`); }
    finally { setSaving(false); }
  }

  const isSim = exam.source === "SIMULATION";
  const age = calculateAge(exam.patientBirthDate, new Date(exam.startedAt ?? exam.createdAt));
  const bmiInfo = calculateBmi(exam.patientWeight, exam.patientHeight);

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

  const handleExportPdf = async () => {
    setExporting(true);
    setExportMessage(null);
    try {
      const series=includeTemporal && exam.analysis ? frames ?? await api.exams.rawFrames(exam.id) : undefined;
      if(series && series.length!==exam.analysis?.series.frameCount)throw new Error('Série incompleta; exportação interrompida.');
      setFrames(series);
      const fileName = await downloadExamReportPdf(exam, { observations,frames:series,includeAnalysis,includeTemporal });
      setExportMessage(`✓ Arquivo exportado com sucesso: ${fileName}`);
    } catch (err) {
      setExportMessage(`Erro ao exportar PDF: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = async () => {
    setExporting(true);try { if(includeTemporal && exam.analysis && !frames){const series=await api.exams.rawFrames(exam.id);if(series.length!==exam.analysis.series.frameCount)throw new Error('Série incompleta; impressão interrompida.');setFrames(series);}requestAnimationFrame(()=>requestAnimationFrame(()=>window.print())); }catch(e){setExportMessage((e as Error).message);}finally{setExporting(false);}
  };

  const nowFormatted = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const lateral = lateralDistribution(exam.leftPercent, exam.rightPercent);
  const leftPct = lateral.leftWidth;
  const rightPct = lateral.rightWidth;

  return (
    <div className="report-viewer h-full flex flex-col bg-[#0b101b] overflow-y-auto">
      {/* 1. Barra de Ferramentas Superior (Oculta na impressão) */}
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-line px-4 py-3 shrink-0 no-print flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="size-8 rounded-lg grid place-items-center hover:bg-line/50 text-mute hover:text-foreground transition-colors"
            title="Voltar para Histórico de Exames"
            aria-label="Voltar para Histórico de Exames"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Visualização do Relatório Baropodométrico</span>
              <span className="text-xs font-mono text-mute">
                #{String(exam.id).padStart(6, "0")}
              </span>
            </h1>
            <p className="text-[11px] text-mute">
              Paciente: <strong className="text-foreground">{exam.patientName}</strong> • {formatDate(exam.startedAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {clinical && <button type="button" disabled={!dirty || saving || exporting} onClick={() => void saveObservations()}
            className="px-3 py-2 rounded-lg border border-line text-xs disabled:opacity-50">
            {saving ? "Salvando..." : dirty ? "Salvar observações" : "Observações salvas"}
          </button>}
          {exportMessage && (
            <span
              className={`text-xs px-2.5 py-1 rounded-lg font-medium animate-in fade-in ${
                exportMessage.startsWith("✓")
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}
            >
              {exportMessage}
            </span>
          )}

          <button
            type="button"
            onClick={()=>void handlePrint()}
            disabled={saving || exporting}
            className="h-8 px-3 rounded-lg text-xs font-semibold border border-line bg-surface hover:bg-surface-hover text-foreground flex items-center gap-1.5 transition-colors shadow-xs"
            title="Imprimir documento formatado A4"
          >
            <Printer size={14} />
            <span>Imprimir</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || saving}
            className="h-8 px-3.5 rounded-lg text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity disabled:opacity-50"
            title="Exportar documento como arquivo PDF vetorial"
          >
            <Download size={14} />
            <span>{exporting ? "Gerando PDF..." : "Exportar PDF"}</span>
          </button>
        </div>
      </header>

      <div className="no-print p-3 flex flex-wrap gap-4 text-xs"><label><input type="checkbox" checked={includeAnalysis} onChange={e=>setIncludeAnalysis(e.target.checked)}/> Condições, qualidade e regiões</label><label><input type="checkbox" checked={includeTemporal} onChange={e=>setIncludeTemporal(e.target.checked)}/> Oscilação temporal</label>{exam.analysis && <button type="button" disabled={exporting||saving} className="underline" onClick={async()=>{setExporting(true);try{const series=await api.exams.rawFrames(exam.id);if(series.length!==exam.analysis?.series.frameCount)throw new Error('Série incompleta.');setFrames(series);}catch(e){setExportMessage((e as Error).message);}finally{setExporting(false);}}}>Carregar gráficos para prévia e impressão</button>}</div>
      {/* 2. Área do Documento A4 (Página 1 e Página 2) */}
      <main className="flex-1 p-4 md:p-8 flex flex-col items-center gap-8">
        <div className="w-full max-w-[820px]"><PhysicalResults result={exam.physicalResult} /></div>
        {!exam.patientSnapshotPreserved && <p className="w-full max-w-[820px] text-sm text-warn">Registro antigo: os dados cadastrais exibidos são atuais; não foram preservados na data do exame.</p>}
        {/* =========================================================================
            PÁGINA 1 — A4 (210mm x 297mm proporcional)
           ========================================================================= */}
        <article className="print-page w-full max-w-[820px] bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-10 flex flex-col justify-between space-y-6 border border-slate-200">
          <div className="space-y-5">
            {/* Cabeçalho Oficial */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-slate-950 font-sans">
                  BAROPRESS
                </h2>
                <p className="text-[10px] tracking-wider uppercase font-semibold text-slate-500">
                  Sistema de Análise Baropodométrica — TCC
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 block">
                  Relatório Baropodométrico Estático
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Exame #{String(exam.id).padStart(6, "0")} • {formatDateTime(exam.startedAt)}
                </span>
              </div>
            </div>

            {/* Banner de Identificação da Origem (Requisitos 10 e 41) */}
            {isSim ? (
              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold flex items-center justify-center gap-2">
                <AlertTriangle size={15} />
                <span>⚠ ATENÇÃO: EXAME DE SIMULAÇÃO (DADOS GERADOS POR SIMULADOR DE HARDWARE 15×15)</span>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={15} />
                <span>✓ ORIGEM: HARDWARE REAL (AQUISIÇÃO VIA ESP32 / SENSORES FÍSICOS)</span>
              </div>
            )}

            {/* Dados do Paciente (Requisito 9) */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-sky-600" />
                <span>Identificação do Paciente</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Nome:</span>
                  <span className="font-bold text-slate-900">{exam.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">CPF:</span>
                  <span className="font-semibold text-slate-900">
                    {exam.patientCpf ? formatCpf(exam.patientCpf) : "Não informado"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nascimento / Idade:</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(exam.patientBirthDate)}{" "}
                    {age !== null ? `(${age} anos)` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Estatura / Peso:</span>
                  <span className="font-semibold text-slate-900">
                    {formatHeight(exam.patientHeight)} •{" "}
                    {exam.patientWeight ? `${exam.patientWeight.toFixed(1)} kg` : "—"}
                  </span>
                </div>
              </div>
              {bmiInfo && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-4 text-xs text-slate-600">
                  <span>
                    IMC: <strong className="text-slate-900">{bmiInfo.value} kg/m²</strong> ({bmiInfo.label})
                  </span>
                  {exam.patientShoeSize && (
                    <span>
                      Calçado: <strong className="text-slate-900">{exam.patientShoeSize}</strong>
                    </span>
                  )}
                </div>
              )}
            </section>

            <p className="text-xs font-semibold break-words">{acquisitionLabel(exam.analysis?.acquisition)} · {exam.duration ?? "—"} s</p><SequenceLinks exam={exam}/>{exam.analysis?.acquisition?.foot !== "both" && exam.analysis?.acquisition && <p className="text-xs">Aquisição individual: a distribuição representa as metades do tapete.</p>}
            {/* Grade Principal: Mapa de Calor Contínuo + Indicadores */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Mapa de Calor Plantar Contínuo (7 cols) */}
              <div className="md:col-span-7 flex flex-col justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-300">
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex justify-between px-1">
                  <span>Superfície Contínua Interpolada</span>
                  <span>15×15 Transdutores</span>
                </div>

                <div className="aspect-square w-full max-h-[360px] mx-auto flex items-center justify-center">
                  <BaropodometricHeatmap
                    values={exam.matrix}
                    config={heatmapConfig}
                    cop={copPoint}
                    trajectory={includeTemporal && frames && exam.analysis ? temporalPoints(frames, exam.analysis.series) : undefined}
                    trajectoryGapMs={exam.analysis ? temporalGapLimit(exam.analysis.quality) : undefined}
                    className="w-full h-full"
                  />
                </div>

                <PressureLegend vmax={heatmapConfig.vmax} />
              </div>


              {/* Indicadores Quantitativos Objetivos (5 cols) */}
              <div className="md:col-span-5 flex flex-col justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Indicadores Quantitativos
                  </h3>

                  {/* Cards de Pressão */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                        <Footprints size={12} className="text-rose-500" />
                        Leitura Máx.
                      </span>
                      <div className="text-base font-bold text-rose-600 tabular-nums">
                        {Math.round(exam.maxPressure ?? 0)}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">ADC</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                      <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                        <Footprints size={12} className="text-amber-500" />
                        Leitura Média
                      </span>
                      <div className="text-base font-bold text-amber-600 tabular-nums">
                        {savedNumber(exam.meanPressure, 0)}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">ADC</span>
                      </div>
                    </div>
                  </div>

                  {/* Centro relativo (ADC) */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Compass size={12} className="text-sky-600" />
                      Centro relativo (ADC)
                    </span>
                    <div className="text-xs font-bold text-slate-900 tabular-nums">
                      {copPoint ? (
                        <>
                          X: {copPoint.x.toFixed(1)} <span className="text-slate-300">|</span> Y: {copPoint.y.toFixed(1)}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (matriz 0–14)
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400 font-normal">Não disponível</span>
                      )}
                    </div>
                  </div>

                  {/* Sensores em contato */}
                  <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-0.5">
                    <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                      <Percent size={12} className="text-emerald-600" />
                      Sensores em contato
                    </span>
                    <div className="text-xs font-bold text-emerald-700 tabular-nums">
                      {(exam.contactAreaPercent ?? 0).toFixed(1)}%
                      <span className="text-[10px] text-slate-400 font-normal ml-1.5">
                        ({exam.contactSensors ?? 0} de 225 sensels)
                      </span>
                    </div>
                  </div>

                  {/* Distribuição Lateral de Carga (Requisitos 17 e 18) */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                      Distribuição por metades do tapete
                    </span>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-sky-600">Esq: {lateral.leftText}</span>
                      <span className="text-amber-600">Dir: {lateral.rightText}</span>
                    </div>
                    {/* Barra Proporcional */}
                    <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className="bg-sky-500 transition-all"
                        style={{ width: `${leftPct}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${rightPct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Cargas: {Math.round(exam.leftLoad ?? 0)} ADC (Esq) • {Math.round(exam.rightLoad ?? 0)} ADC (Dir)
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 border-t border-slate-200 pt-2">
                  Duração: {savedNumber(exam.duration, 1, " s")} • {exam.frameCount ?? 0} frames • {savedNumber(exam.fps, 1, " FPS")}
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé da Página 1 */}
          <footer className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>BAROPRESS • Sistema de Análise Baropodométrica</span>
            <span>Relatório gerado em {nowFormatted}</span>
            <span>Página 1 de 2</span>
          </footer>
        </article>

        {/* =========================================================================
            PÁGINA 2 — A4 (210mm x 297mm proporcional)
           ========================================================================= */}
        <article className="print-page w-full max-w-[820px] bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-10 flex flex-col justify-between space-y-6 border border-slate-200">
          <div className="space-y-5">
            {/* Cabeçalho Secundário */}
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-slate-950 font-sans">
                  BAROPRESS
                </h2>
                <p className="text-[10px] uppercase font-semibold text-slate-500">
                  Detalhamento Técnico e Observações Clínicas
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 font-mono">
                Exame #{String(exam.id).padStart(6, "0")} • {exam.patientName}
              </div>
            </div>

            {/* Parâmetros da Análise & Metadados (Requisitos 20 e 21) */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Parâmetros Utilizados na Análise & Dados da Aquisição
              </h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400 text-[10px]">Limiar (Threshold):</span>{" "}
                  <strong className="text-slate-900">{exam.threshold ?? 150} ADC</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Duração da Coleta:</span>{" "}
                  <strong className="text-slate-900">{savedNumber(exam.duration, 1, " s")}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Limite de cor (VMAX):</span>{" "}
                  <strong className="text-slate-900">{exam.vmax ?? 2200} ADC</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Quadros Coletados:</span>{" "}
                  <strong className="text-slate-900">{exam.frameCount ?? "—"} frames</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Gamma de Contraste:</span>{" "}
                  <strong className="text-slate-900">{exam.gamma ?? 1.3}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Quadros/s na janela:</span>{" "}
                  <strong className="text-slate-900">{savedNumber(exam.fps, 1)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Fator de Suavização:</span>{" "}
                  <strong className="text-slate-900">{exam.smoothing ?? 0.35}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Dimensão da Matriz:</span>{" "}
                  <strong className="text-slate-900">15 × 15 (225 sensores)</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Tara Instrumental:</span>{" "}
                  <strong className="text-slate-900">{exam.tareApplied ? "Aplicada (compensação de zero)" : "Não aplicada"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px]">Origem Técnica:</span>{" "}
                  <strong className="text-slate-900">{isSim ? "Simulação (Mock)" : "Hardware Real (ESP32)"}</strong>
                </div>
              </div>
            </section>

            {/* Nota Estrita sobre Calibração e Unidades (Requisito 22) */}
            <section className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-1">
              <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                Nota sobre Calibração e Unidades
              </h4>
              <p className="text-xs text-amber-950 leading-relaxed">
                As leituras apresentadas neste relatório correspondem a valores relativos do conversor
                analógico-digital (ADC 0–4095). Não representam unidades físicas de força ou pressão.
                A conversão para unidades físicas depende de procedimento de calibração validado com
                referência apropriada.
              </p>
            </section>

            {/* Observações Clínicas Editáveis (Requisito 23) */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Observações Clínicas (Preenchimento Manual)
              </h3>
              <p className="text-[10px] text-slate-400">
                Espaço destinado para anotações do profissional habilitado. Nenhum diagnóstico é gerado automaticamente.
                Use “Salvar observações” para guardar o texto neste exame. O mapa e as métricas originais são preservados.
              </p>
              <p className="report-print-notes hidden whitespace-pre-wrap break-words text-xs">{observations || "Sem observações adicionais."}</p>
              <textarea readOnly={!clinical}
                aria-label="Observações adicionais do relatório"
                maxLength={10000}
                disabled={saving || exporting}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Insira as observações clínicas do paciente aqui..."
                rows={5}
                className="no-print w-full text-xs p-3 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-sky-500 leading-relaxed resize-none shadow-xs"
              />
            </section>

            {/* Responsável pela Avaliação & Linha de Assinatura (Requisitos 24 e 25) */}
            <section className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-xs">
                <span className="text-slate-400 uppercase text-[10px] font-bold block">
                  Responsável pela Avaliação
                </span>
                <p className="font-bold text-slate-900">
                  {exam.professionalName || "Responsável não informado"}
                </p>
                <p className="text-[10px] text-slate-400">
                  Data de emissão: {nowFormatted}
                </p>
              </div>

              <div className="text-center space-y-1 min-w-[240px]">
                <div className="border-b border-slate-400 w-full mb-1" />
                <span className="text-[10px] text-slate-500 block">
                  Assinatura do Responsável Técnico
                </span>
              </div>
            </section>

            {/* Aviso Técnico Obrigatório (Requisito 27) */}
            <section className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-[10px] text-slate-600 leading-relaxed">
              <strong className="text-slate-800 block mb-0.5">AVISO TÉCNICO:</strong>
              Este relatório apresenta dados instrumentais obtidos pelo sistema BAROPRESS. Os valores são
              relativos ao ADC e não constituem diagnóstico médico. A interpretação clínica dos resultados deve
              ser realizada por profissional habilitado.
            </section>
          </div>

          {/* Rodapé da Página 2 (Requisito 26) */}
          <footer className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>BAROPRESS • Sistema de Análise Baropodométrica</span>
            <span>Relatório gerado em {nowFormatted}</span>
            <span>Página 2 de 2</span>
          </footer>
        </article>
        {includeAnalysis && <article className="print-page w-full max-w-[820px] bg-white text-slate-900 p-8 rounded-xl space-y-2"><h2 className="text-lg font-bold">Condições, qualidade e análise derivada</h2>{analysisLines(exam,includeTemporal?frames:undefined).map((line,i)=><p key={i} className="text-xs break-words">{line}</p>)}</article>}
        {includeTemporal && <article className="print-page w-full max-w-[820px] bg-white text-slate-900 p-8 rounded-xl">{frames && exam.analysis?<AnalysisGraphs points={temporalPoints(frames,exam.analysis.series)} gapLimitMs={temporalGapLimit(exam.analysis.quality)} events={exam.analysis.events}/>:exam.analysis?<p className="text-sm">Carregue a série para exibir os gráficos temporais. PDF e impressão carregam os quadros salvos.</p>:exam.copTrajectory?<AnalysisGraphs points={exam.copTrajectory} gapLimitMs={0} legacy/>:<p className="text-sm">Série temporal indisponível.</p>}</article>}
      </main>
    </div>
  );
};
