import { BaropodometricHeatmap } from '@/features/baropodometry/BaropodometricHeatmap';
import { DEFAULT_HEATMAP_SETTINGS } from '@/services/baropodometry';
import { FOOT_LABELS } from '@/services/examProtocol';
import type { ExamDetails } from '@/types';
import { PhysicalResults } from '@/features/calibration/PhysicalResults';
import { AnalysisReview } from './AnalysisReview';

export function SequenceReview({stages, loading, error, onRetry}: {
  stages: ExamDetails[]; loading: boolean; error: string; onRetry: () => void;
}) {
  if (!stages.length && !loading && !error) return null;
  return <section className="space-y-3" aria-label="Aquisições do mesmo exame">
    <h2 className="font-semibold">Dois pés · exame único</h2>
    {loading && <p role="status" className="text-sm text-mute">Carregando as duas aquisições...</p>}
    {error && <div className="text-sm text-danger no-print"><p role="alert">{error}</p><button type="button" className="underline" onClick={onRetry}>Tentar novamente</button></div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {stages.map(stage => {
        const config = {...DEFAULT_HEATMAP_SETTINGS, ...stage.visualizationSettings, threshold: stage.threshold ?? 150, vmax: stage.vmax ?? 2200, gamma: stage.gamma ?? 1.3, smoothing: stage.smoothing ?? 0.35};
        return <article key={stage.id} className="space-y-2 min-w-0">
          <h3 className="text-sm font-semibold">{FOOT_LABELS[stage.analysis!.acquisition!.foot]}</h3>
          <div className="aspect-square max-w-[320px] mx-auto"><BaropodometricHeatmap values={stage.matrix} config={config} cop={stage.copX != null && stage.copY != null ? {x: stage.copX, y: stage.copY} : null} className="w-full h-full" /></div>
          <p className="text-xs">{stage.duration} s · {stage.frameCount} quadros · máximo {stage.maxPressure?.toFixed(0) ?? '—'} ADC · média {stage.meanPressure?.toFixed(0) ?? '—'} ADC</p>
          <details className="no-print text-xs"><summary className="cursor-pointer">Análise deste pé</summary><div className="pt-2 space-y-2"><PhysicalResults result={stage.physicalResult}/><AnalysisReview key={stage.id} exam={stage}/></div></details>
        </article>;
      })}
    </div>
  </section>;
}
