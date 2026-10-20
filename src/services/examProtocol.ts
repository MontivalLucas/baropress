export const EXAM_DURATIONS = [30, 45] as const;
export function examDuration(value?: number): number { return value === 45 ? 45 : 30; }
export type ExamFoot = 'both' | 'left' | 'right';
export interface ExamAcquisition {
  foot: ExamFoot;
  sequenceId: string | null;
  stage: number;
  totalStages: number;
  order: ExamFoot[];
}
export const FOOT_LABELS: Record<ExamFoot, string> = { both: 'Ambos os pés', left: 'Pé esquerdo', right: 'Pé direito' };
export function acquisitionLabel(a?: ExamAcquisition | null): string {
  if (!a) return 'Modalidade não registrada (exame anterior)';
  return `${FOOT_LABELS[a.foot]}${a.totalStages === 2 ? ` · etapa ${a.stage}/2 · ${a.order.map(f => FOOT_LABELS[f]).join(' → ')} · sequência ${a.sequenceId}` : ' · aquisição única'}`;
}
