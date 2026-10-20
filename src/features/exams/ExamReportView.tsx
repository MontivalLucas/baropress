import React, { lazy, Suspense, useEffect, useState } from "react";
import { api } from "@/services/database/api";
import type { ExamDetails } from "@/types";

const ReportViewer = lazy(() => import("@/features/reports/ReportViewer").then((module) => ({ default: module.ReportViewer })));

/** Relatório do exame selecionado, sem uma segunda listagem ou aba. */
export const ExamReportView: React.FC<{ examId: number; onBack: () => void }> = ({ examId, onBack }) => {
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setExam(null);
    api.exams.get(examId)
      .then((data) => { if (live) setExam(data); })
      .catch((failure) => { if (live) setError(failure instanceof Error ? failure.message : "Erro ao carregar relatório do exame."); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [examId, revision]);

  if (exam && !loading) {
    return (
      <Suspense fallback={<p role="status" className="p-6 text-mute">Carregando visualização do relatório...</p>}>
        <ReportViewer exam={exam} onBack={onBack} />
      </Suspense>
    );
  }

  return (
    <section className="p-4 md:p-6 space-y-4">
      <button type="button" onClick={onBack} className="text-sm text-brand underline">Voltar para Histórico de Exames</button>
      {loading && <p role="status" className="text-sm text-mute">Carregando relatório do exame...</p>}
      {error && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-danger">{error}</p>
          <button type="button" onClick={() => setRevision((value) => value + 1)} className="text-sm text-brand underline">Tentar novamente</button>
        </div>
      )}
    </section>
  );
};
