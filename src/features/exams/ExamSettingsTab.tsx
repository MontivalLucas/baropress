import React, { useEffect, useMemo, useRef } from "react";
import { BaropodometricHeatmap } from "@/features/baropodometry/BaropodometricHeatmap";
import { ExamVisualizationControls } from "./ExamVisualizationControls";
import { PressureLegend } from "@/features/baropodometry/PressureLegend";
import { calculateMetrics, computeAutoParameters } from "@/services/baropodometry";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useNewExamStore } from "./examStore";

export const ExamSettingsTab: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { settings, updateSettings, startPreview, isStarting } = useNewExamStore();
  const { displayValues, status, tareState, startZeroing, toggleTareActive } = useAcquisitionStore();
  const temporal = useRef({ smoothedVmax: settings.vmax, smoothedThreshold: settings.threshold });
  const metrics = useMemo(() => calculateMetrics(displayValues, settings.threshold), [displayValues, settings.threshold]);

  useEffect(() => {
    if (settings.mode !== "AUTO" || !status.acquiring) {
      temporal.current = { smoothedVmax: settings.vmax, smoothedThreshold: settings.threshold };
      return;
    }
    const result = computeAutoParameters(displayValues, settings, temporal.current);
    temporal.current = result.nextState;
    updateSettings(result.settings);
  }, [displayValues, settings.mode, status.acquiring, updateSettings]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-mute">Confira o mapa antes de iniciar. Os parâmetros ficam fixos durante a coleta. No resultado, você pode ajustar a aparência antes de salvar.</p>
      <ExamVisualizationControls values={displayValues} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        <div className="space-y-3 min-w-0">
          <div className="aspect-square max-h-[360px] flex items-center justify-center">
            <BaropodometricHeatmap values={displayValues} config={settings} cop={metrics.cop} />
          </div>
          <PressureLegend vmax={settings.vmax} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => { void startPreview().catch(() => {}); }} disabled={isStarting || status.acquiring}
              className="px-3 py-2 rounded-lg bg-brand text-brand-fg text-xs font-semibold disabled:opacity-50">
              {isStarting ? "Conectando..." : status.acquiring ? "Prévia ao vivo ativa" : "Ativar prévia ao vivo"}
            </button>
            <button type="button" onClick={startZeroing} disabled={!status.acquiring || tareState.isZeroing || isStarting}
              className="px-3 py-2 rounded-lg border border-line text-xs disabled:opacity-50">
              {tareState.isZeroing ? `Tara: ${tareState.zeroingProgress}%` : "Zerar tara"}
            </button>
            <button type="button" onClick={toggleTareActive} disabled={tareState.isZeroing || isStarting || !tareState.baseline}
              className="px-3 py-2 rounded-lg border border-line text-xs disabled:opacity-50">
              Tara {tareState.active ? "ativada" : "desativada"}
            </button>
          </div>
          <p className="text-xs text-mute">Para zerar a tara, deixe a plataforma sem carga. Posicione o paciente depois da conclusão.</p>
        </div>
        <div className="space-y-3 text-sm text-mute">
          <p>VMAX define o valor que chega ao vermelho. Se o mapa estiver todo vermelho, aumente o VMAX ou use “Ajustar VMAX ao pico”.</p>
          <p>Gamma regula o contraste das intensidades intermediárias. Para comparar exames, mantenha a mesma escala e os mesmos parâmetros.</p>
          <button type="button" disabled={isStarting} onClick={onDone} className="px-3 py-2 rounded-lg border border-line text-foreground">Concluir ajustes</button>
        </div>
      </div>
    </div>
  );
};
