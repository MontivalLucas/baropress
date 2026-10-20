import { useEffect, useState } from 'react';
import type { ExamDetails } from '@/types';
import type { TemporalPoint } from '@/services/examAnalysis/types';
import { temporalPoints } from '@/services/examAnalysis/calculations';
import { api } from '@/services/database/api';

export function useExamTrajectory(exam: ExamDetails | null) {
  const [state, setState] = useState<{id: number; points: TemporalPoint[]; error?: string} | null>(null);
  useEffect(() => {
    let active = true;
    if (!exam?.analysis) return;
    const analysis = exam.analysis;
    api.exams.rawFrames(exam.id).then(frames => {
      if (frames.length !== analysis.series.frameCount) throw new Error('Série incompleta.');
      if (active) setState({id: exam.id, points: temporalPoints(frames, analysis.series)});
    }).catch(e => { if (active) setState({id: exam.id, points: [], error: `Trajeto indisponível: ${e.message}`}); });
    return () => { active = false; };
  }, [exam?.id, exam?.analysis]);
  return exam?.analysis ? state?.id === exam.id ? state : null : {points: exam?.copTrajectory ?? []};
}
