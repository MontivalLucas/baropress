import React, { useState, useMemo } from "react";
import clsx from "clsx";
import { SENSOR_CONFIG } from "@/services/acquisition";

interface MatrixPreviewProps {
  values: number[]; // 225 valores (0 a 4095)
  tareActive: boolean;
  isSimulated: boolean;
}

/**
 * Mapeia valor ADC (0 a 4095) para uma cor térmica suave e profissional.
 */
function getAdcColor(val: number): string {
  if (val <= 20) return "rgba(30, 41, 59, 0.4)"; // Fundo neutro apagado
  const t = Math.min(1, Math.max(0, val / 3800));

  if (t < 0.2) {
    // Azul escuro a ciano
    const r = Math.round(15 + t * 5 * 10);
    const g = Math.round(50 + t * 5 * 160);
    const b = Math.round(160 + t * 5 * 95);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t < 0.4) {
    // Ciano a verde
    const f = (t - 0.2) / 0.2;
    const r = Math.round(25 + f * 20);
    const g = Math.round(210 + f * 30);
    const b = Math.round(255 - f * 170);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (t < 0.7) {
    // Verde a amarelo/laranja
    const f = (t - 0.4) / 0.3;
    const r = Math.round(45 + f * 200);
    const g = Math.round(240 - f * 60);
    const b = Math.round(85 - f * 70);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Laranja a vermelho/magenta intenso
    const f = (t - 0.7) / 0.3;
    const r = Math.round(245 + f * 10);
    const g = Math.round(180 - f * 150);
    const b = Math.round(15 + f * 40);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export const MatrixPreview15x15: React.FC<MatrixPreviewProps> = ({
  values,
  tareActive,
  isSimulated,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    let max = 0;
    let sum = 0;
    let activeSensors = 0;

    for (let i = 0; i < values.length; i++) {
      const v = values[i] ?? 0;
      if (v > max) max = v;
      sum += v;
      if (v > 40) activeSensors++;
    }

    const avg = values.length > 0 ? Math.round(sum / values.length) : 0;
    return { max, avg, activeSensors };
  }, [values]);

  const hoveredInfo = useMemo(() => {
    if (hoveredIdx === null || hoveredIdx < 0 || hoveredIdx >= values.length) {
      return null;
    }
    const row = Math.floor(hoveredIdx / SENSOR_CONFIG.columns);
    const col = hoveredIdx % SENSOR_CONFIG.columns;
    const val = values[hoveredIdx] ?? 0;
    return { row: row + 1, col: col + 1, index: hoveredIdx + 1, val };
  }, [hoveredIdx, values]);

  return (
    <div className="bg-surface border border-line rounded-card p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-base font-semibold">Preview Técnico da Matriz 15×15</h2>
          <p className="text-xs text-mute">
            Grade com 225 sensels relativos (ADC 0–4095). Sem conversões físicas fictícias.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSimulated && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
              SIMULAÇÃO
            </span>
          )}
          {tareActive && (
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              Tara Ativa
            </span>
          )}
        </div>
      </div>

      {/* Grid 15x15 */}
      <div className="flex justify-center items-center p-3 bg-canvas/60 rounded-xl border border-line/60 overflow-hidden">
        <div
          className="grid gap-[2px] w-full max-w-[460px] aspect-square select-none"
          style={{
            gridTemplateColumns: `repeat(${SENSOR_CONFIG.columns}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${SENSOR_CONFIG.rows}, minmax(0, 1fr))`,
          }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {Array.from({ length: SENSOR_CONFIG.sensorCount }).map((_, idx) => {
            const val = values[idx] ?? 0;
            const bg = getAdcColor(val);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                style={{ backgroundColor: bg }}
                className={clsx(
                  "rounded-[2px] transition-transform duration-75 relative cursor-crosshair",
                  isHovered && "ring-2 ring-brand scale-110 z-10 shadow-lg"
                )}
                title={`Sensor #${idx + 1} (L:${Math.floor(idx / 15) + 1}, C:${(idx % 15) + 1}): ${val} ADC`}
              />
            );
          })}
        </div>
      </div>

      {/* Barra de Inspeção e Métricas Técnicas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2.5 rounded-lg bg-surface-hover/50 border border-line">
          <span className="text-[11px] text-mute uppercase tracking-wider block">Leitura Máxima</span>
          <span className="text-lg font-bold text-brand">{stats.max}</span>
          <span className="text-[10px] text-mute block">ADC (0–4095)</span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-hover/50 border border-line">
          <span className="text-[11px] text-mute uppercase tracking-wider block">Leitura Média</span>
          <span className="text-lg font-bold text-foreground">{stats.avg}</span>
          <span className="text-[10px] text-mute block">Valor relativo</span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-hover/50 border border-line">
          <span className="text-[11px] text-mute uppercase tracking-wider block">Sensores Ativos</span>
          <span className="text-lg font-bold text-foreground">
            {stats.activeSensors} <span className="text-xs text-mute font-normal">/ 225</span>
          </span>
          <span className="text-[10px] text-mute block">&gt; 40 ADC</span>
        </div>

        <div className="p-2.5 rounded-lg bg-surface-hover/50 border border-line">
          <span className="text-[11px] text-mute uppercase tracking-wider block">Inspeção Sensel</span>
          {hoveredInfo ? (
            <div className="min-w-0">
              <span className="text-base font-bold text-foreground">
                {hoveredInfo.val} <span className="text-xs font-normal text-mute">ADC</span>
              </span>
              <span className="text-[10px] text-mute block truncate">
                L:{hoveredInfo.row} C:{hoveredInfo.col} (#{hoveredInfo.index})
              </span>
            </div>
          ) : (
            <span className="text-xs text-mute italic flex items-center justify-center h-full">
              Passe o mouse
            </span>
          )}
        </div>
      </div>

      {/* Escala de Cores de Referência */}
      <div className="flex items-center justify-between text-[11px] text-mute pt-1 border-t border-line">
        <span>0 (Sem pressão / baseline)</span>
        <div className="h-2 flex-1 mx-3 rounded-full bg-gradient-to-r from-slate-800 via-cyan-500 via-emerald-400 via-amber-400 to-rose-600" />
        <span>4095 (Saturação ADC)</span>
      </div>
    </div>
  );
};
