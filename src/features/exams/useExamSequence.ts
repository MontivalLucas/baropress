import { useEffect, useState } from 'react';
import { api } from '@/services/database/api';
import type { ExamDetails } from '@/types';

export function useExamSequence(exam: ExamDetails | null) {
  const [result, setResult] = useState<{id: number; stages: ExamDetails[]; error: string} | null>(null);
  const [revision, setRevision] = useState(0);
  const id = exam?.id;
  const sequenceId = exam?.analysis?.acquisition?.sequenceId;
  useEffect(() => {
    if (!id || !sequenceId) return;
    let active = true;
    setResult(null);
    api.exams.sequence(id).then(stages => {
      if (active) setResult({id, stages, error: stages.length === 2 ? '' : 'A outra aquisição não está disponível. Confira o histórico antes de exportar.'});
    }).catch(error => {
      if (active) setResult({id, stages: [], error: error instanceof Error ? error.message : 'Não foi possível carregar as aquisições.'});
    });
    return () => { active = false; };
  }, [id, sequenceId, revision]);
  return {
    stages: sequenceId && result && result.id === id ? result.stages : [],
    loading: !!sequenceId && result?.id !== id,
    error: sequenceId && result && result.id === id ? result.error : '',
    retry: () => { setResult(null); setRevision(value => value + 1); },
  };
}
