import React, { useState } from "react";
import { Activity, Gauge, MapPin, Percent, Scale, Info } from "lucide-react";
import { type BaropodometricMetrics } from "@/services/baropodometry";

interface MetricsPanelProps {
  metrics: BaropodometricMetrics;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const [showInfo, setShowInfo] = useState(false);

  const {
    maxPressure,
    meanPressure,
    totalPressure,
    contactSensorCount,
    contactPercentage,
    leftPercentage,
    rightPercentage,
    leftLoad,
    rightLoad,
    cop,
  } = metrics;

  return (
    <div className="space-y-2.5 select-none">
      {/* 4 Cards em Grade 2x2 Compacta */}
      <div className="grid grid-cols-2 gap-2">
        {/* Pressão Máxima */}
        <div className="bg-surface/90 border border-line rounded-xl p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-mute mb-1 leading-none">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pressão Máxima
            </span>
            <Gauge size={14} className="text-rose-500" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground leading-none font-mono">
              {maxPressure.toLocaleString("pt-BR")}
            </div>
            <div className="text-[10px] text-mute mt-1 leading-none">ADC relativo</div>
          </div>
        </div>

        {/* Pressão Média */}
        <div className="bg-surface/90 border border-line rounded-xl p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-mute mb-1 leading-none">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Pressão Média
            </span>
            <Activity size={14} className="text-brand" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground leading-none font-mono">
              {meanPressure !== null ? meanPressure.toLocaleString("pt-BR") : "—"}
            </div>
            <div className="text-[10px] text-mute mt-1 leading-none">ADC em contato</div>
          </div>
        </div>

        {/* Centro de Pressão (CoP) */}
        <div className="bg-surface/90 border border-line rounded-xl p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-mute mb-1 leading-none">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Centro de Pressão
            </span>
            <MapPin size={14} className="text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground leading-none font-mono">
              {cop ? (
                <span>
                  {cop.x.toFixed(1)}{" "}
                  <span className="text-xs font-normal text-mute">/</span>{" "}
                  {cop.y.toFixed(1)}
                </span>
              ) : (
                <span className="text-mute text-sm font-normal italic">Sem carga</span>
              )}
            </div>
            <div className="text-[10px] text-mute mt-1 leading-none">
              Coordenadas X / Y (0–14)
            </div>
          </div>
        </div>

        {/* Área de Contato Relativa */}
        <div className="bg-surface/90 border border-line rounded-xl p-2.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-[11px] text-mute mb-1 leading-none">
            <span className="font-semibold uppercase tracking-wider text-[10px]">
              Área de Contato
            </span>
            <Percent size={14} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight text-foreground leading-none font-mono">
              {contactPercentage.toFixed(1)}%
            </div>
            <div className="text-[10px] text-mute mt-1 leading-none">
              {contactSensorCount} de 225 sensels
            </div>
          </div>
        </div>
      </div>

      {/* Distribuição Bilateral de Carga (Esquerda vs Direita) Compacta */}
      <div className="bg-surface/90 border border-line rounded-xl p-2.5 space-y-1.5 shadow-sm">
        <div className="flex items-center justify-between text-xs leading-none">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-mute flex items-center gap-1">
            <Scale size={13} /> Distribuição de Carga
          </span>
          <span className="text-mute text-[10px] font-mono">
            Soma: {totalPressure.toLocaleString("pt-BR")} ADC
          </span>
        </div>

        {leftPercentage !== null && rightPercentage !== null ? (
          <div className="space-y-1.5">
            {/* Barra Bi-colorida */}
            <div className="h-3 w-full rounded-full overflow-hidden flex bg-canvas border border-line">
              <div
                style={{ width: `${leftPercentage}%` }}
                className="bg-brand transition-all duration-150 flex items-center justify-center text-[9px] font-bold text-white leading-none"
                title={`Esquerda: ${leftPercentage}% (${leftLoad} ADC)`}
              >
                {leftPercentage > 15 ? `${leftPercentage.toFixed(0)}%` : ""}
              </div>
              <div
                style={{ width: `${rightPercentage}%` }}
                className="bg-indigo-500 transition-all duration-150 flex items-center justify-center text-[9px] font-bold text-white leading-none"
                title={`Direita: ${rightPercentage}% (${rightLoad} ADC)`}
              >
                {rightPercentage > 15 ? `${rightPercentage.toFixed(0)}%` : ""}
              </div>
            </div>

            {/* Rótulos Esquerda / Direita */}
            <div className="flex items-center justify-between text-[11px] leading-tight">
              <div className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-brand" />
                <span className="font-semibold text-foreground">Esq:</span>
                <span className="font-mono font-medium">{leftPercentage.toFixed(1)}%</span>
                <span className="text-[10px] text-mute font-mono">({leftLoad})</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-mute font-mono">({rightLoad})</span>
                <span className="font-mono font-medium">{rightPercentage.toFixed(1)}%</span>
                <span className="font-semibold text-foreground">:Dir</span>
                <span className="size-2 rounded-full bg-indigo-500" />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-1 text-center text-[11px] text-mute italic">
            Sem carga acima do threshold.
          </div>
        )}
      </div>

      {/* Linha Compacta de Calibração com Tooltip (Seção 14) */}
      <div className="relative bg-surface/60 border border-line/80 rounded-lg px-2.5 py-1 flex items-center justify-between text-[10px] text-mute">
        <span className="truncate">
          Valores em ADC relativo — sem calibração física em kg/cm².
        </span>
        <button
          type="button"
          aria-label="Informações sobre calibração"
          onClick={() => setShowInfo((v) => !v)}
          className="text-mute hover:text-brand transition-colors ml-1 p-0.5 rounded focus:outline-none"
        >
          <Info size={12} />
        </button>

        {showInfo && (
          <div
            role="tooltip"
            className="absolute bottom-full left-0 right-0 mb-1 p-2 bg-surface border border-line rounded-lg shadow-xl text-[10px] text-foreground z-30 animate-in fade-in zoom-in-95 leading-relaxed"
          >
            <div className="font-semibold text-brand mb-0.5 uppercase tracking-wider text-[9px]">
              Nota sobre Calibração:
            </div>
            O sistema opera com leituras relativas do conversor analógico-digital (ADC 0–4095).
            Nenhum valor é convertido para kg, N ou kgf/cm² sem procedimento metrológico validado com célula de carga.
            <div className="text-right mt-1">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="text-brand font-semibold hover:underline"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
