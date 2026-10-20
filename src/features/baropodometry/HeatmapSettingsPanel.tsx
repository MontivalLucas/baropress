import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  HelpCircle,
  RotateCcw,
  Sparkles,
  Sliders,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  type HeatmapSettings,
  SETTINGS_LIMITS,
  RESOLUTION_PRESETS,
  resetSettings,
  sanitizeSettings,
} from "@/services/baropodometry";

interface HeatmapSettingsPanelProps {
  settings: HeatmapSettings;
  onChange: (newSettings: HeatmapSettings) => void;
  onClose: () => void;
  thresholdLocked?: boolean;
  disabled?: boolean;
}

interface TooltipItemProps {
  id: string;
  title: string;
  text: string;
  activeId: string | null;
  onToggle: (id: string) => void;
}

const TooltipTrigger: React.FC<TooltipItemProps> = ({
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
        id={`tooltip-btn-${id}`}
        aria-label={`Ajuda sobre ${title}`}
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(id);
        }}
        onKeyDown={(e) => { if (e.key === "Escape" && isOpen) onToggle(id); }}
        aria-describedby={isOpen ? `tooltip-content-${id}` : undefined}
        className={clsx(
          "size-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ml-1 focus:outline-none focus:ring-1 focus:ring-brand",
          isOpen
            ? "bg-brand text-brand-fg ring-1 ring-brand"
            : "text-mute hover:text-foreground hover:bg-surface-hover"
        )}
      >
        <HelpCircle size={12} />
      </button>

      {isOpen && (
        <div
          role="tooltip"
          id={`tooltip-content-${id}`}
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface border border-line rounded-lg shadow-xl text-xs text-foreground animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-brand text-[11px] uppercase tracking-wider mb-1">
            {title}
          </div>
          <p className="text-[11px] text-mute leading-relaxed">{text}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface" />
        </div>
      )}
    </div>
  );
};

export const HeatmapSettingsPanel: React.FC<HeatmapSettingsPanelProps> = ({
  settings,
  onChange,
  onClose,
  thresholdLocked = false,
  disabled = false,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const panelRef = useRef<HTMLFieldSetElement | null>(null);

  // Fecha tooltips ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setActiveTooltip(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleTooltipToggle = (id: string) => {
    setActiveTooltip((prev) => (prev === id ? null : id));
  };

  // Ao mover qualquer slider manualmente, comuta para modo MANUAL
  const handleSliderChange = (partial: Partial<HeatmapSettings>) => {
    const updated = sanitizeSettings({
      ...partial,
      mode: "MANUAL",
    }, settings);
    onChange(updated);
  };

  const handleModeChange = (mode: "AUTO" | "MANUAL") => {
    onChange({
      ...settings,
      mode,
    });
  };

  const handleReset = () => {
    onChange(thresholdLocked ? { ...resetSettings(), threshold: settings.threshold, mode: "MANUAL" } : resetSettings());
  };

  return (
    <fieldset
      ref={panelRef}
      disabled={disabled}
      role="dialog"
      aria-labelledby="settings-panel-title"
      className="w-full max-w-md bg-surface/95 backdrop-blur-md border border-line rounded-2xl shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150 select-none text-foreground"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
            <Sliders size={16} />
          </div>
          <div>
            <h2 id="settings-panel-title" className="text-sm font-bold tracking-tight">
              Ajustes do Mapa de Calor
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={clsx(
                  "size-2 rounded-full",
                  settings.mode === "AUTO" ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
                )}
              />
              <span className="text-[11px] font-semibold text-mute">
                Modo: {settings.mode === "AUTO" ? "Automático" : "Manual"}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel de ajustes"
          className="size-7 rounded-lg text-mute hover:text-foreground hover:bg-surface-hover grid place-items-center transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Seletor de Modo: AUTOMÁTICO vs MANUAL */}
      <div className="flex items-center gap-2 bg-surface-hover p-1 rounded-xl border border-line">
        <button
          type="button"
          onClick={() => handleModeChange("AUTO")}
          disabled={thresholdLocked}
          title={thresholdLocked ? "Modo automático indisponível: limiar fixado na coleta" : undefined}
          className={clsx(
            "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
            settings.mode === "AUTO"
              ? "bg-brand text-brand-fg shadow-sm"
              : "text-mute hover:text-foreground"
          )}
        >
          <Sparkles size={14} />
          Automático
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("MANUAL")}
          className={clsx(
            "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
            settings.mode === "MANUAL"
              ? "bg-surface text-foreground border border-line shadow-sm"
              : "text-mute hover:text-foreground"
          )}
        >
          <Sliders size={14} />
          Manual
        </button>
      </div>

      {/* Controles de Sliders */}
      <div className="space-y-3.5 pt-1">
        {/* 1. GAMMA */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center font-medium">
              <span>Gamma Visual</span>
              <TooltipTrigger
                id="gamma"
                title="Gamma Visual"
                text="Controla como os níveis de pressão aparecem visualmente. Valores menores realçam regiões de pressão mais baixa. Valores maiores concentram mais o contraste nos valores altos. Isso altera somente a aparência do mapa."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </div>
            <span className="font-mono text-brand font-semibold">
              {settings.gamma.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            aria-label="Gamma Visual"
            min={SETTINGS_LIMITS.gamma.min}
            max={SETTINGS_LIMITS.gamma.max}
            step={SETTINGS_LIMITS.gamma.step}
            value={settings.gamma}
            onChange={(e) => handleSliderChange({ gamma: parseFloat(e.target.value) })}
            className="w-full accent-brand cursor-pointer h-2 bg-line rounded-lg"
          />
        </div>

        {/* 2. ESCALA MÁXIMA / VMAX */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center font-medium">
              <span>Escala Máxima (VMAX)</span>
              <TooltipTrigger
                id="vmax"
                title="Escala Máxima (VMAX)"
                text="Define qual valor relativo de ADC representa a intensidade máxima da escala. Diminuir aumenta o contraste. Aumentar reduz a saturação. Não altera os valores reais dos sensores."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </div>
            <span className="font-mono text-brand font-semibold">
              {settings.vmax} ADC
            </span>
          </div>
          <input
            type="range"
            aria-label="Escala Máxima VMAX"
            min={SETTINGS_LIMITS.vmax.min}
            max={SETTINGS_LIMITS.vmax.max}
            step={SETTINGS_LIMITS.vmax.step}
            value={settings.vmax}
            onChange={(e) => handleSliderChange({ vmax: parseInt(e.target.value, 10) })}
            className="w-full accent-brand cursor-pointer h-2 bg-line rounded-lg"
          />
        </div>

        {/* 3. THRESHOLD */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center font-medium">
              <span>Threshold (Contato)</span>
              <TooltipTrigger
                id="threshold"
                title="Threshold (Limiar de Contato)"
                text="Define o valor mínimo considerado como contato. Valores abaixo dele são tratados como ausência de contato. Também influencia a área de contato e o cálculo do Centro de Pressão."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </div>
            <span className="font-mono text-brand font-semibold">
              {settings.threshold} ADC
            </span>
          </div>
          <input
            type="range"
            aria-label="Threshold de Contato"
            disabled={thresholdLocked}
            title={thresholdLocked ? "Limiar fixado na coleta para preservar as métricas" : undefined}
            min={SETTINGS_LIMITS.threshold.min}
            max={SETTINGS_LIMITS.threshold.max}
            step={SETTINGS_LIMITS.threshold.step}
            value={settings.threshold}
            onChange={(e) => handleSliderChange({ threshold: parseInt(e.target.value, 10) })}
            className="w-full accent-brand cursor-pointer h-2 bg-line rounded-lg"
          />
        </div>

        {/* 4. SUAVIZAÇÃO */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center font-medium">
              <span>Suavização / Bordas</span>
              <TooltipTrigger
                id="smoothing"
                title="Suavização / Bordas"
                text="Controla o quanto a distribuição entre os sensores é suavizada. Valores baixos deixam as regiões mais definidas e com bordas nítidas. Valores altos deixam as transições mais suaves. Evite valores muito altos para não espalhar artificialmente a pressão."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </div>
            <span className="font-mono text-brand font-semibold">
              {settings.smoothing.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            aria-label="Suavização de Bordas"
            min={SETTINGS_LIMITS.smoothing.min}
            max={SETTINGS_LIMITS.smoothing.max}
            step={SETTINGS_LIMITS.smoothing.step}
            value={settings.smoothing}
            onChange={(e) => handleSliderChange({ smoothing: parseFloat(e.target.value) })}
            className="w-full accent-brand cursor-pointer h-2 bg-line rounded-lg"
          />
        </div>

        {/* 5. ATUALIZAÇÃO VISUAL (RENDER FPS) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center font-medium">
              <span>Atualização Visual</span>
              <TooltipTrigger
                id="renderFps"
                title="Atualização Visual (FPS)"
                text="Define quantas vezes por segundo o mapa visual é redesenhado no Canvas. Isso não altera a taxa de aquisição serial do ESP32."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </div>
            <span className="font-mono text-brand font-semibold">
              {settings.renderFps} FPS
            </span>
          </div>
          <input
            type="range"
            aria-label="Atualização Visual FPS"
            min={SETTINGS_LIMITS.renderFps.min}
            max={SETTINGS_LIMITS.renderFps.max}
            step={SETTINGS_LIMITS.renderFps.step}
            value={settings.renderFps}
            onChange={(e) => handleSliderChange({ renderFps: parseInt(e.target.value, 10) })}
            className="w-full accent-brand cursor-pointer h-2 bg-line rounded-lg"
          />
        </div>

        {/* 6. RESOLUÇÃO DE RENDERIZAÇÃO */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center font-medium">
              <span>Resolução da Superfície</span>
              <TooltipTrigger
                id="resolution"
                title="Resolução da Superfície"
                text="Define a resolução usada para interpolar e desenhar o mapa. Resoluções maiores deixam o mapa mais detalhado, mas podem consumir mais processamento."
                activeId={activeTooltip}
                onToggle={handleTooltipToggle}
              />
            </div>
            <span className="font-mono text-xs text-mute">
              {settings.resolution}×{settings.resolution}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {RESOLUTION_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleSliderChange({ resolution: p.value })}
                className={clsx(
                  "py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all",
                  settings.resolution === p.value
                    ? "bg-brand/10 text-brand border-brand font-semibold shadow-sm"
                    : "bg-surface border-line text-mute hover:text-foreground hover:bg-surface-hover"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 7. VISIBILIDADE DO CoP */}
        <div className="pt-1 flex items-center justify-between border-t border-line/60 pt-2.5">
          <div className="flex items-center text-xs font-medium">
            <span>Marcador de CoP</span>
            <TooltipTrigger
              id="showCop"
              title="Marcador de CoP"
              text="Exibe o Centro de Pressão (baricentro de carga) em tempo real sobre a esteira de pressão."
              activeId={activeTooltip}
              onToggle={handleTooltipToggle}
            />
          </div>
          <button
            type="button"
            onClick={() => handleSliderChange({ showCop: !settings.showCop })}
            className={clsx(
              "h-7 px-2.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors",
              settings.showCop
                ? "bg-brand/10 text-brand border-brand/30"
                : "bg-surface-hover text-mute border-line"
            )}
          >
            {settings.showCop ? <Eye size={12} /> : <EyeOff size={12} />}
            {settings.showCop ? "Visível" : "Oculto"}
          </button>
        </div>
      </div>

      {/* Ações do Rodapé */}
      <div className="pt-2 border-t border-line flex items-center justify-between">
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-mute hover:text-brand flex items-center gap-1.5 transition-colors py-1 px-2 rounded hover:bg-surface-hover"
        >
          <RotateCcw size={13} />
          Restaurar padrão
        </button>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover border border-line text-foreground transition-colors"
        >
          Concluir
        </button>
      </div>
    </fieldset>
  );
};
