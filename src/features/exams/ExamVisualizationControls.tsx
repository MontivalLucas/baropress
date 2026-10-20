import React, { useState } from "react";
import { ParameterBar } from "@/features/baropodometry/ParameterBar";
import { HeatmapSettingsPanel } from "@/features/baropodometry/HeatmapSettingsPanel";
import { useNewExamStore } from "./examStore";

/** Mesmos controles e limites usados na Análise, com snapshot por exame. */
export const ExamVisualizationControls: React.FC<{ values: number[]; result?: boolean }> = ({ values, result = false }) => {
  const { settings, updateSettings, isStarting, isSaving } = useNewExamStore();
  const [advanced, setAdvanced] = useState(false);
  const disabled = isStarting || isSaving;
  return (
    <section aria-label="Visualização do exame" className="space-y-2">
      <ParameterBar settings={settings} onChange={updateSettings} values={values} thresholdLocked={result} disabled={disabled} />
      <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
        <p className="text-mute flex-1">
          {result
            ? "Ajuste a aparência antes de salvar. Limiar fixado na coleta; métricas e calibração física preservadas."
            : "Ajustes compartilhados com a Análise e aplicados ao próximo exame."}
        </p>
        <button type="button" aria-expanded={advanced} aria-controls="exam-advanced-settings" disabled={disabled}
          onClick={() => setAdvanced((open) => !open)} className="text-brand underline disabled:opacity-50">
          {advanced ? "Fechar ajustes avançados" : "Ajustes avançados e resolução"}
        </button>
      </div>
      {advanced && (
        <div id="exam-advanced-settings">
          <HeatmapSettingsPanel settings={settings} onChange={updateSettings} onClose={() => setAdvanced(false)} thresholdLocked={result} disabled={disabled} />
        </div>
      )}
    </section>
  );
};
