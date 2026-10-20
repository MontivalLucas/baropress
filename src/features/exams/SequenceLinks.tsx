import { useEffect, useState } from 'react';
import { api } from '@/services/database/api';
import type { ExamDetails } from '@/types';
import { FOOT_LABELS } from '@/services/examProtocol';
import { useSession } from '@/stores/session';

export function SequenceLinks({exam}: {exam: ExamDetails}) {
  const [stages, setStages] = useState<ExamDetails[]>([]);
  const [error, setError] = useState('');
  const openReport = useSession(s => s.openReport);
  const sequenceId = exam.analysis?.acquisition?.sequenceId;
  useEffect(() => {
    let active = true;
    setStages([]); setError('');
    if (sequenceId) api.exams.sequence(exam.id).then(data => { if (active) setStages(data); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [exam.id, sequenceId]);
  if (!sequenceId) return null;
  return <div className="no-print text-xs space-y-2"><p>Etapas da sequência:</p>{stages.map(stage => <button type="button" key={stage.id} onClick={() => openReport(stage.id)} className="mr-3 underline">{FOOT_LABELS[stage.analysis!.acquisition!.foot]} · #{stage.id} · {stage.duration} s</button>)}{stages.length === 1 && <p>A outra etapa não está mais disponível no histórico.</p>}{error && <p role="alert">{error}</p>}</div>;
}
