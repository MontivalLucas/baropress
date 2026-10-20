import React from "react";
import clsx from "clsx";
import { getHeatmapGradientCss } from "@/services/baropodometry";

interface PressureLegendProps {
  vmax: number;
  className?: string;
}

export const PressureLegend: React.FC<PressureLegendProps> = ({ vmax, className }) => {
  const gradientCss = getHeatmapGradientCss();

  // Marcas de escala numérica proporcional a vmax
  const ticks = [
    0,
    Math.round(vmax * 0.25),
    Math.round(vmax * 0.5),
    Math.round(vmax * 0.75),
    vmax,
  ];

  return (
    <div
      className={clsx(
        "bg-surface/90 border border-line rounded-xl px-3 py-1.5 space-y-1 shadow-sm select-none",
        className
      )}
    >
      <div className="flex items-center justify-between text-[11px] text-mute font-medium leading-none">
        <span>Baixa Intensidade</span>
        <span className="font-semibold text-foreground text-[10px] uppercase tracking-wider">
          Escala Térmica (ADC Relativo)
        </span>
        <span>Alta Intensidade</span>
      </div>

      {/* Barra de Gradiente Contínuo */}
      <div
        className="w-full h-2 rounded-full shadow-inner border border-line/40"
        style={{ background: gradientCss }}
      />

      {/* Rótulos Numéricos */}
      <div className="flex justify-between text-[10px] text-mute font-mono leading-none">
        {ticks.map((t, idx) => (
          <span
            key={idx}
            className={idx === ticks.length - 1 ? "text-rose-500 font-bold" : ""}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
};

