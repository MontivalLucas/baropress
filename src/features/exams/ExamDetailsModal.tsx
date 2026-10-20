import { acquisitionLabel } from '@/services/examProtocol';
import { useExamTrajectory } from './useExamTrajectory';
import { SequenceLinks } from './SequenceLinks';
import { temporalGapLimit } from '@/services/examAnalysis/calculations';
import { isClinical } from "@/features/auth/permissions";
import { savedNumber } from "@/features/reports/savedValues";
import { AnalysisReview } from './AnalysisReview';
import { PhysicalResults } from "@/features/calibration/PhysicalResults";
import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Footprints,
  Percent,
  Sliders,
  User,
  X,
  FileText,
} from "lucide-react";
import {
  DEFAULT_HEATMAP_SETTINGS,
  type HeatmapConfig,
} from "@/services/baropodometry";
import { BaropodometricHeatmap } from "@/features/baropodometry/BaropodometricHeatmap";
import { PressureLegend } from "@/features/baropodometry/PressureLegend";
import { api } from "@/services/database/api";
import { useSession } from "@/stores/session";


import { calculateAge, formatCpf, formatDateTime, formatHeight } from "@/features/patients/patientUtils";
import type { ExamDetails } from "@/types";
import { ExamExportActions } from "./ExamExportActions";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

interface ExamDetailsModalProps {
  examId: number | null;
  initialExam?: ExamDetails | null;
  onClose: () => void;
}

export const ExamDetailsModal: React.FC<ExamDetailsModalProps> = ({
  examId,
  initialExam,
  onClose,
}) => {
  useDialogFocus(!!examId||!!initialExam,onClose);
  const { openReport } = useSession();
  const clinical=useSession(s=>isClinical(s.user?.role));
  const [exam, setExam] = useState<ExamDetails | null>(initialExam || null);
  const trajectory = useExamTrajectory(exam);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (initialExam) {
      setExam(initialExam);
      return;
    }
    if (!examId) return;

    let active = true;
    setLoading(true);
    setError(null);

    api.exams
      .get(examId)
      .then((data) => {
        if (active) setExam(data);
      })
      .catch((err) => {
        if (active) setError(err.message || "Erro ao carregar detalhes do exame.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [examId, initialExam]);

  if (!examId && !initialExam) return null;

  const age = exam ? calculateAge(exam.patientBirthDate, new Date(exam.startedAt ?? exam.createdAt)) : null;
  const isSim = exam?.source === "SIMULATION";

  const heatmapConfig: HeatmapConfig = {
    ...DEFAULT_HEATMAP_SETTINGS,
    ...exam?.visualizationSettings,
    gamma: exam?.gamma ?? DEFAULT_HEATMAP_SETTINGS.gamma,
    vmax: exam?.vmax ?? DEFAULT_HEATMAP_SETTINGS.vmax,
    threshold: exam?.threshold ?? DEFAULT_HEATMAP_SETTINGS.threshold,
    smoothing: exam?.smoothing ?? DEFAULT_HEATMAP_SETTINGS.smoothing,
  };

  const copPoint =
    exam?.copX !== null && exam?.copX !== undefined && exam?.copY !== null && exam?.copY !== undefined
      ? { x: exam.copX, y: exam.copY }
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-labelledby="exam-details-title" tabIndex={-1} className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-surface border border-line shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-line flex items-center justify-between shrink-0 bg-surface">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-brand/10 text-brand grid place-items-center">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="exam-details-title" className="text-base font-bold text-foreground">
                  Exame Baropodométrico #{exam?.id ? String(exam.id).padStart(6, "0") : "..."}
                </h2>
                {isSim ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                    <AlertTriangle size={11} /> SIMULAÇÃO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={11} /> REAL
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-line/60 text-mute uppercase font-medium">
                  {exam?.type === "static" ? "Estático" : "Dinâmico"}
                </span>
              </div>
              <p className="text-xs text-mute mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formatDateTime(exam?.startedAt ?? null)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} /> Duração: {savedNumber(exam?.duration)}s ({exam?.frameCount ?? 0} frames)
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-lg grid place-items-center text-mute hover:text-foreground hover:bg-line/50 transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {loading && (
            <div className="py-20 text-center text-sm text-mute">
              Carregando dados do exame...
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
              {error}
            </div>
          )}

          {exam && !loading && (
            <>
              <PhysicalResults result={exam.physicalResult} />
              {clinical && <AnalysisReview key={exam.id} exam={exam} onUpdated={setExam}/>}
              {!exam.patientSnapshotPreserved && <p className="text-xs text-warn">Registro antigo: dados cadastrais atuais; não há cópia demográfica da data do exame.</p>}
              {/* Patient Banner */}
              <div className="p-3.5 rounded-xl bg-surface-hover border border-line flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-line/60 grid place-items-center text-mute">
                    <User size={16} />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">{exam.patientName}</span>
                    <span className="text-xs text-mute ml-2">
                      CPF: {exam.patientCpf ? formatCpf(exam.patientCpf) : "—"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-mute">
                  {age !== null && <span>Idade: <strong className="text-foreground">{age} anos</strong></span>}
                  {exam.patientHeight && <span>Altura: <strong className="text-foreground">{formatHeight(exam.patientHeight)}</strong></span>}
                  {exam.patientWeight && <span>Peso: <strong className="text-foreground">{exam.patientWeight} kg</strong></span>}
                  {exam.patientShoeSize && <span>Calçado: <strong className="text-foreground">{exam.patientShoeSize}</strong></span>}
                </div>
              </div>

              <p className="text-xs font-semibold">{acquisitionLabel(exam.analysis?.acquisition)} · {exam.duration ?? '—'} s</p><SequenceLinks exam={exam} />{trajectory && 'error' in trajectory && trajectory.error && <p className="text-xs">{trajectory.error}</p>}
              {/* Main Analysis Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                {/* Left Column: Heatmap (7 cols) */}
                <div className="md:col-span-7 flex flex-col justify-between gap-2 bg-black/20 p-3 rounded-2xl border border-line">
                  <div className="aspect-square w-full max-h-[380px] mx-auto flex items-center justify-center">
                    <BaropodometricHeatmap
                      values={exam.matrix}
                      config={heatmapConfig}
                      cop={copPoint}
                      trajectory={trajectory?.points}
                      trajectoryGapMs={exam.analysis ? temporalGapLimit(exam.analysis.quality) : undefined}
                      className="w-full h-full"
                    />
                  </div>
                  <PressureLegend vmax={heatmapConfig.vmax} />
                  <ExamExportActions exam={exam} />
                </div>

                {/* Right Column: Quantitative Metrics (5 cols) */}
                <div className="md:col-span-5 flex flex-col justify-between gap-3">
                  {/* Indicators Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Leitura Máxima */}
                    <div className="p-3 rounded-xl bg-surface border border-line">
                      <div className="flex items-center gap-1.5 text-xs text-mute">
                        <Footprints size={14} className="text-rose-400" />
                        <span>Leitura Máxima</span>
                      </div>
                      <div className="mt-1 font-bold text-lg text-foreground tabular-nums">
                        {Math.round(exam.maxPressure ?? 0)}
                        <span className="text-[11px] font-normal text-mute ml-1">ADC</span>
                      </div>
                    </div>

                    {/* Leitura Média */}
                    <div className="p-3 rounded-xl bg-surface border border-line">
                      <div className="flex items-center gap-1.5 text-xs text-mute">
                        <Footprints size={14} className="text-amber-400" />
                        <span>Leitura Média</span>
                      </div>
                      <div className="mt-1 font-bold text-lg text-foreground tabular-nums">
                        {savedNumber(exam.meanPressure, 0)}
                        <span className="text-[11px] font-normal text-mute ml-1">ADC</span>
                      </div>
                    </div>

                    {/* Centro de Pressão CoP */}
                    <div className="p-3 rounded-xl bg-surface border border-line">
                      <div className="flex items-center gap-1.5 text-xs text-mute">
                        <Compass size={14} className="text-cyan-400" />
                        <span>Centro relativo (ADC)</span>
                      </div>
                      <div className="mt-1 font-bold text-base text-foreground tabular-nums">
                        {copPoint ? (
                          <>
                            X: {copPoint.x.toFixed(1)} <span className="text-mute font-normal">|</span> Y: {copPoint.y.toFixed(1)}
                          </>
                        ) : (
                          <span className="text-mute font-normal text-xs">Sem contato</span>
                        )}
                      </div>
                    </div>

                    {/* Sensores em contato */}
                    <div className="p-3 rounded-xl bg-surface border border-line">
                      <div className="flex items-center gap-1.5 text-xs text-mute">
                        <Percent size={14} className="text-emerald-400" />
                        <span>Sensores em contato</span>
                      </div>
                      <div className="mt-1 font-bold text-base text-foreground tabular-nums">
                        {exam.contactAreaPercent?.toFixed(1) ?? "0.0"}%
                        <span className="text-[11px] font-normal text-mute ml-1">
                          ({exam.contactSensors ?? 0} sensels)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Distribuição Esquerda / Direita */}
                  <div className="p-3.5 rounded-xl bg-surface border border-line space-y-2">
                    <span className="text-xs font-semibold text-mute block uppercase tracking-wider">
                      Distribuição por metades do tapete
                    </span>
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-cyan-400">
                        Metade E: {exam.leftPercent !== null && exam.leftPercent !== undefined ? `${exam.leftPercent.toFixed(1)}%` : "—"}
                      </span>
                      <span className="text-amber-400">
                        Metade D: {exam.rightPercent !== null && exam.rightPercent !== undefined ? `${exam.rightPercent.toFixed(1)}%` : "—"}
                      </span>
                    </div>
                    {/* Barra de distribuição */}
                    <div className="h-2.5 rounded-full bg-line/60 overflow-hidden flex">
                      <div
                        className="bg-cyan-500 transition-all"
                        style={{ width: `${exam.leftPercent ?? 0}%` }}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ width: `${exam.rightPercent ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Configuração Utilizada */}
                  <div className="p-3 rounded-xl bg-surface border border-line space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-mute">
                      <Sliders size={13} />
                      <span>Configuração da Análise</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-mute pt-1">
                      <span>Threshold: <strong className="text-foreground">{exam.threshold ?? 150} ADC</strong></span>
                      <span>VMAX: <strong className="text-foreground">{exam.vmax ?? 2200} ADC</strong></span>
                      <span>Gamma: <strong className="text-foreground">{exam.gamma ?? 1.3}</strong></span>
                      <span>Suavização: <strong className="text-foreground">{exam.smoothing ?? 0.35}</strong></span>
                      <span>Tara: <strong className="text-foreground">{exam.tareApplied ? "Ativa" : "Inativa"}</strong></span>
                      <span>Frequência: <strong className="text-foreground">{savedNumber(exam.fps)} FPS</strong></span>
                    </div>
                  </div>

                  {/* Disclaimer / Nota Técnica Estrita */}
                  <div className="p-2.5 rounded-xl bg-line/20 border border-line/40 text-[11px] text-mute leading-snug">
                    <strong className="text-foreground block mb-0.5">Nota de Medição:</strong>
                    Valores em leituras relativas do conversor ADC (0 a 4095) da matriz 15×15 (225 sensores). Sistema sem calibração física em unidades de massa (kg/N).
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line flex items-center justify-between shrink-0 bg-surface">
          <span className="text-xs text-mute font-mono">
            {exam ? `Matriz: 225 sensels | Status: ${exam.status}` : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!exam}
              onClick={() => {
                if (exam?.id) {
                  openReport(exam.id);
                  onClose();
                }
              }}
              title="Emitir relatório em padrão A4, exportar PDF e imprimir"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 hover:bg-sky-500/25 text-sky-400 border border-sky-500/30 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <FileText size={14} />
              <span>Relatório PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity"
            >
              Fechar
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
