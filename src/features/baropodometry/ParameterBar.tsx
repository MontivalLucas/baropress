import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  HelpCircle,
  RotateCcw,
  Sparkles,
  Sliders,
  MapPin,
} from "lucide-react";
import {
  type HeatmapSettings,
  SETTINGS_LIMITS,
  resetSettings,
  sanitizeSettings,
  fitVmaxToValues,
} from "@/services/baropodometry";

interface ParameterBarProps {
  settings: HeatmapSettings;
  onChange: (newSettings: HeatmapSettings) => void;
  thresholdLocked?: boolean;
  disabled?: boolean;
  values?: number[];
}

interface MiniTooltipProps {
  id: string;
  title: string;
  text: string;
  activeId: string | null;
  onToggle: (id: string) => void;
}

const MiniTooltip: React.FC<MiniTooltipProps> = ({
  id,
  title,
  text,
  activeId,
  onToggle,
}) => {
  const isOpen = activeId === id;

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id={`param-tooltip-btn-${id}`}
        aria-label={`Ajuda sobre ${title}`}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
        onKeyDown={(e) => { if (e.key === "Escape" && isOpen) onToggle(id); }}
        aria-describedby={isOpen ? `param-tooltip-content-${id}` : undefined}
        className={clsx(
          "size-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors ml-0.5 focus:outline-none focus:ring-1 focus:ring-brand",
          isOpen
            ? "bg-brand text-brand-fg ring-1 ring-brand"
            : "text-mute hover:text-foreground hover:bg-surface-hover"
        )}
      >
        <HelpCircle size={10} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          id={`param-tooltip-content-${id}`}
          className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1.5 w-60 p-2.5 bg-surface border border-line rounded-lg shadow-xl text-xs text-foreground animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-brand text-[10px] uppercase tracking-wider mb-0.5">
            {title}
          </div>
          <p className="text-[11px] text-mute leading-relaxed">{text}</p>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-surface" />
        </div>
      )}
    </div>
  );
};

export const ParameterBar: React.FC<ParameterBarProps> = ({
  settings,
  onChange,
  thresholdLocked = false,
  disabled = false,
  values,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const barRef = useRef<HTMLFieldSetElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveTooltip(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleTooltipToggle = (id: string) => {
    setActiveTooltip((prev) => (prev === id ? null : id));
  };

  const handleSliderChange = (partial: Partial<HeatmapSettings>) => {
    const updated = sanitizeSettings(
      {
        ...partial,
        mode: "MANUAL",
      },
      settings
    );
    onChange(updated);
  };

  const toggleMode = () => {
    onChange({
      ...settings,
      mode: settings.mode === "AUTO" ? "MANUAL" : "AUTO",
    });
  };

  const handleReset = () => {
    onChange(thresholdLocked ? { ...resetSettings(), threshold: settings.threshold, mode: "MANUAL" } : resetSettings());
  };

  const fittedVmax = values ? fitVmaxToValues(values, settings.threshold) : null;
  const saturatedCount = values?.filter((value) => Number.isFinite(value) && value >= settings.threshold && value >= settings.vmax).length ?? 0;

  return (
    <fieldset
      ref={barRef}
      disabled={disabled}
      aria-label="Parâmetros do mapa de calor"
      className="bg-surface/90 border border-line rounded-xl px-3 py-1.5 shadow-sm text-foreground select-none"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-center">
        {/* 1. THRESHOLD */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
            <span className="font-medium text-mute truncate flex items-center">
              Threshold
              <MiniTooltip
                id="threshold"
                title="Threshold (Corte)"
                text="Define o valor mínimo de ADC para contato. Leituras abaixo deste limiar são ausência de carga. Afeta o CoP e a área de contato."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </span>
            <span className="font-mono text-brand font-semibold text-[11px]">
              {settings.threshold}
            </span>
          </div>
          <input
            type="range"
            aria-label="Threshold"
            disabled={thresholdLocked}
            title={thresholdLocked ? "Limiar fixado na coleta para preservar as métricas" : undefined}
            min={SETTINGS_LIMITS.threshold.min}
            max={SETTINGS_LIMITS.threshold.max}
            step={SETTINGS_LIMITS.threshold.step}
            value={settings.threshold}
            onChange={(e) =>
              handleSliderChange({ threshold: parseInt(e.target.value, 10) })
            }
            className="w-full accent-brand cursor-pointer h-1.5 bg-line rounded-lg"
          />
        </div>

        {/* 2. VMAX */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
            <span className="font-medium text-mute truncate flex items-center">
              VMAX
              <MiniTooltip
                id="vmax"
                title="VMAX (Escala Máxima)"
                text="Valor ADC que atinge o vermelho máximo da escala térmica. Diminuir aumenta o contraste; aumentar reduz a saturação."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </span>
            <span className="font-mono text-brand font-semibold text-[11px]">
              {settings.vmax}
            </span>
          </div>
          <input
            type="range"
            aria-label="VMAX"
            min={SETTINGS_LIMITS.vmax.min}
            max={SETTINGS_LIMITS.vmax.max}
            step={SETTINGS_LIMITS.vmax.step}
            value={settings.vmax}
            onChange={(e) =>
              handleSliderChange({ vmax: parseInt(e.target.value, 10) })
            }
            className="w-full accent-brand cursor-pointer h-1.5 bg-line rounded-lg"
          />
        </div>

        {/* 3. GAMMA */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
            <span className="font-medium text-mute truncate flex items-center">
              Gamma
              <MiniTooltip
                id="gamma"
                title="Gamma Visual"
                text="Controle não-linear do contraste visual (visual = normalizado ^ gamma). Não altera métricas numéricas nem o CoP."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </span>
            <span className="font-mono text-brand font-semibold text-[11px]">
              {settings.gamma.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            aria-label="Gamma"
            min={SETTINGS_LIMITS.gamma.min}
            max={SETTINGS_LIMITS.gamma.max}
            step={SETTINGS_LIMITS.gamma.step}
            value={settings.gamma}
            onChange={(e) =>
              handleSliderChange({ gamma: parseFloat(e.target.value) })
            }
            className="w-full accent-brand cursor-pointer h-1.5 bg-line rounded-lg"
          />
        </div>

        {/* 4. SUAVIZAÇÃO */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
            <span className="font-medium text-mute truncate flex items-center">
              Suavização
              <MiniTooltip
                id="smoothing"
                title="Suavização / Bordas"
                text="Controla o filtro binomial espacial. Em 0.00 as bordas são nítidas sem halos; em 1.00 as transições são aveludadas."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </span>
            <span className="font-mono text-brand font-semibold text-[11px]">
              {settings.smoothing.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            aria-label="Suavização"
            min={SETTINGS_LIMITS.smoothing.min}
            max={SETTINGS_LIMITS.smoothing.max}
            step={SETTINGS_LIMITS.smoothing.step}
            value={settings.smoothing}
            onChange={(e) =>
              handleSliderChange({ smoothing: parseFloat(e.target.value) })
            }
            className="w-full accent-brand cursor-pointer h-1.5 bg-line rounded-lg"
          />
        </div>

        {/* 5. ATUALIZAÇÃO (FPS) */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
            <span className="font-medium text-mute truncate flex items-center">
              Atualização
              <MiniTooltip
                id="renderFps"
                title="Atualização Visual"
                text="Taxa de redesenho do Canvas em FPS. Não altera a frequência física de amostragem serial do ESP32."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </span>
            <span className="font-mono text-brand font-semibold text-[11px]">
              {settings.renderFps} FPS
            </span>
          </div>
          <input
            type="range"
            aria-label="Atualização Visual"
            min={SETTINGS_LIMITS.renderFps.min}
            max={SETTINGS_LIMITS.renderFps.max}
            step={SETTINGS_LIMITS.renderFps.step}
            value={settings.renderFps}
            onChange={(e) =>
              handleSliderChange({ renderFps: parseInt(e.target.value, 10) })
            }
            className="w-full accent-brand cursor-pointer h-1.5 bg-line rounded-lg"
          />
        </div>

        {/* 6. MARCADO COP */}
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[11px] leading-tight mb-0.5">
            <span className="font-medium text-mute truncate flex items-center">
              CoP
              <MiniTooltip
                id="showCop"
                title="Marcador de CoP"
                text="Exibe o Centro de Pressão sobre a superfície do mapa em tempo real."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </span>
            <span className="text-[10px] text-mute font-mono">
              {settings.showCop ? "ON" : "OFF"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleSliderChange({ showCop: !settings.showCop })}
            className={clsx(
              "h-6 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1 transition-colors w-full",
              settings.showCop
                ? "bg-brand/10 text-brand border-brand/40 hover:bg-brand/20"
                : "bg-surface-hover text-mute border-line hover:text-foreground"
            )}
          >
            <MapPin size={11} />
            <span>{settings.showCop ? "Visível" : "Oculto"}</span>
          </button>
        </div>

        {/* 7. MODO (AUTO/MANUAL) & RESTAURAR */}
        <div className="flex items-center gap-1.5 justify-end col-span-2 sm:col-span-4 lg:col-span-1 pt-1 lg:pt-0">
          <button
            type="button"
            onClick={toggleMode}
            disabled={thresholdLocked}
            className={clsx(
              "h-7 px-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-all flex-1 lg:flex-none justify-center",
              settings.mode === "AUTO"
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20"
                : "bg-surface border-line text-mute hover:text-foreground hover:bg-surface-hover"
            )}
            title={
              settings.mode === "AUTO"
                ? "Modo Automático ativo (clique para fixar em Manual)"
                : "Modo Manual ativo (clique para ativar Automático)"
            }
          >
            {settings.mode === "AUTO" ? (
              <>
                <Sparkles size={12} className="animate-pulse" />
                <span>Auto</span>
              </>
            ) : (
              <>
                <Sliders size={12} />
                <span>Manual</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="size-7 rounded-lg border border-line text-mute hover:text-brand hover:bg-surface-hover grid place-items-center transition-colors"
            title="Restaurar padrões de fábrica"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
      {settings.threshold === 0 && <p role="status" className="text-xs text-amber-500 border-t border-line mt-2 pt-1.5">
        Limiar zero: a regra atual inclui sensores com leitura zero na área de contato. Confira o limiar antes de interpretar essa medida.
      </p>}
      {values && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line mt-2 pt-1.5 text-xs">
          <button type="button" disabled={fittedVmax === null}
            onClick={() => { if (fittedVmax !== null) handleSliderChange({ vmax: fittedVmax }); }}
            className="text-brand underline disabled:opacity-50"
            title="Ajusta somente a escala visual ao maior ADC em contato; mantém Gamma e limiar">
            Ajustar VMAX ao pico
          </button>
          <span className={saturatedCount > 0 ? "text-amber-500" : "text-mute"}>
            {saturatedCount > 0 ? `${saturatedCount} sensores no máximo da escala. Aumente o VMAX para reduzir a saturação.` : "Sem sensores no máximo da escala."}
          </span>
        </div>
      )}
    </fieldset>
  );
};
