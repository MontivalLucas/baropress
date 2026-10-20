import { acquisitionLabel, FOOT_LABELS } from "@/services/examProtocol";
import { isClinical } from "@/features/auth/permissions";
import React, { lazy, Suspense, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  GitCompare,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
} from "lucide-react";

import { api, clearDatabaseCache } from "@/services/database/api";
import { useSession } from "@/stores/session";
import { formatCpf, formatDateTime } from "@/features/patients/patientUtils";
import type { ExamSummary } from "@/types";
import { LIST_PAGE_SIZE, usePagedSearch } from "@/components/ui/usePagedSearch";
import { ListPagination } from "@/components/ui/ListPagination";
import { ExamReportView } from "./ExamReportView";

const ExamDetailsModal = lazy(() => import("./ExamDetailsModal").then((m) => ({ default: m.ExamDetailsModal })));

export const ExamsPage: React.FC = () => {
  const clinical = useSession(s=>isClinical(s.user?.role));
  const { go, openReport, openComparison, reportExamId, clearReportExamId } = useSession();

  const [exams, setExams] = useState<ExamSummary[]>([]);
  const { search, setSearch, query, page, setPage } = usePagedSearch();
  const [loading, setLoading] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [error,setError]=useState('');
  const [revision,setRevision]=useState(0);

  useEffect(() => {
    let live=true;setLoading(true);setError('');
    api.exams.list(query, { limit: LIST_PAGE_SIZE + 1, offset: page * LIST_PAGE_SIZE }).then((data)=>{if(live)setExams(data);}).catch((e)=>{if(live){setError(e.message);setExams([]);}}).finally(()=>{if(live)setLoading(false);});
    return()=>{live=false;};
  }, [query,page,revision]);

  if (reportExamId !== null) {
    return <ExamReportView key={reportExamId} examId={reportExamId} onBack={clearReportExamId} />;
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Activity size={22} className="text-brand" />
            <span>Histórico de Exames</span>
          </h1>
          <p className="text-xs text-mute mt-0.5">
            Histórico de exames, resultados, relatórios em PDF e impressão
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { clearDatabaseCache(); setRevision((r)=>r+1); }}
            disabled={loading}
            className="size-9 rounded-xl border border-line bg-surface hover:bg-surface-hover grid place-items-center text-mute hover:text-foreground transition-colors"
            title="Atualizar lista de exames"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>

          {clinical && <button
            type="button"
            onClick={() => go("new-exam")}
            className="h-9 px-4 rounded-xl text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 flex items-center gap-1.5 shadow-xs transition-opacity"
          >
            <Plus size={16} />
            <span>Novo Exame</span>
          </button>}
        </div>
      </div>

      {error&&<p role="alert" className="text-sm text-danger">{error}</p>}
      {/* Barra de Filtros */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute size-4" />
          <input
            type="text"
            placeholder="Pesquisar por paciente ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface border border-line text-sm text-foreground focus:outline-none focus:border-brand shadow-xs"
          />
        </div>
        <span className="text-xs text-mute font-medium">
          {Math.min(exams.length, LIST_PAGE_SIZE)} exame{exams.length !== 1 ? "s" : ""} nesta página
        </span>
      </div>

      {/* Tabela de Exames */}
      <div className="flex-1 min-h-0 bg-surface border border-line rounded-2xl overflow-hidden shadow-xs flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm" aria-label="Tabela de exames baropodométricos">
            <thead>
              <tr className="border-b border-line bg-surface-hover/70 text-xs font-semibold text-mute uppercase tracking-wider">
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Pressão Máx.</th>
                <th className="py-3 px-4">Área Contato</th>
                <th className="py-3 px-4">CoP (X, Y)</th>
                <th className="py-3 px-4">Origem</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && exams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-xs text-mute">
                    Carregando histórico de exames...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="space-y-3 max-w-sm mx-auto">
                      <div className="size-12 mx-auto rounded-2xl bg-brand/10 text-brand grid place-items-center">
                        <Stethoscope size={24} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          Nenhum exame cadastrado
                        </p>
                        <p className="text-xs text-mute">
                          Realize a primeira aquisição estática com a plataforma 15×15 para iniciar o histórico clínico.
                        </p>
                      </div>
                      {clinical && <button
                        type="button"
                        onClick={() => go("new-exam")}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand text-brand-fg hover:opacity-90 inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Realizar Primeiro Exame</span>
                      </button>}
                    </div>
                  </td>
                </tr>
              ) : (
                exams.slice(0, LIST_PAGE_SIZE).map((exam) => {
                  const isSim = exam.source === "SIMULATION";
                  return (
                    <tr
                      key={exam.id}
                      className="hover:bg-line/20 transition-colors group"
                    >
                      {/* Data / Hora */}
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-mute" />
                          <span>{formatDateTime(exam.startedAt)}</span>
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">
                          {exam.patientName}
                        </div>
                        {exam.patientCpf && (
                          <div className="text-xs text-mute">
                            {formatCpf(exam.patientCpf)}
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-4 whitespace-nowrap capitalize text-mute">
                        {exam.type === "static" ? "Estático" : "Dinâmico"}<div title={acquisitionLabel(exam.acquisition)} className="text-xs normal-case">{exam.acquisition ? FOOT_LABELS[exam.acquisition.foot] + (exam.acquisition.totalStages === 2 ? ' · etapa ' + exam.acquisition.stage + '/2' : '') : 'Modalidade não registrada'} · {exam.duration ?? '—'} s</div>
                      </td>

                      {/* Pressão Máxima */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums font-mono font-medium text-foreground">
                        {exam.maxPressure !== null && exam.maxPressure !== undefined ? (
                          <>
                            {Math.round(exam.maxPressure)}
                            <span className="text-[11px] text-mute font-normal ml-1">ADC</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Área de Contato */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums font-mono text-foreground">
                        {exam.contactAreaPercent !== null && exam.contactAreaPercent !== undefined ? (
                          `${exam.contactAreaPercent.toFixed(1)}%`
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* CoP */}
                      <td className="py-3 px-4 whitespace-nowrap tabular-nums font-mono text-xs text-mute">
                        {exam.copX !== null && exam.copX !== undefined && exam.copY !== null && exam.copY !== undefined ? (
                          `${exam.copX.toFixed(1)}, ${exam.copY.toFixed(1)}`
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Origem */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isSim ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/25 inline-flex items-center gap-1">
                            <AlertTriangle size={10} /> SIMULAÇÃO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 inline-flex items-center gap-1">
                            <CheckCircle2 size={10} /> REAL
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedExamId(exam.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 flex items-center gap-1 transition-colors"
                            title="Visualizar mapa de calor e resultados"
                          >
                            <Eye size={13} />
                            <span>Visualizar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openReport(exam.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/25 flex items-center gap-1 transition-colors"
                            title="Emitir relatório em PDF e impressão"
                          >
                            <FileText size={13} />
                            <span>Relatório</span>
                          </button>

                          {clinical && <button
                            type="button"
                            onClick={() => openComparison(exam.patientId)}
                            className="p-1 rounded-lg text-brand hover:bg-brand/10"
                            title="Comparar exames deste paciente"
                          >
                            <GitCompare size={15} />
                          </button>}
                        </div>

                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalhes do Exame */}
      <ListPagination page={page} count={Math.min(exams.length, LIST_PAGE_SIZE)} hasNext={exams.length > LIST_PAGE_SIZE} loading={loading} onChange={setPage} />
      {selectedExamId !== null && (
        <Suspense fallback={<p role="status" className="text-mute">Carregando detalhes...</p>}><ExamDetailsModal
          examId={selectedExamId}
          onClose={() => setSelectedExamId(null)}
        /></Suspense>
      )}
    </div>
  );
};
