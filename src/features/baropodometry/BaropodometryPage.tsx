import React, { useState, useMemo, useRef, useEffect } from "react";
import { LivePhysicalDialog } from "@/features/calibration/PhysicalResults";
import clsx from "clsx";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  Scale,
  Settings2,
  Square,
  Usb,
} from "lucide-react";
import { useAcquisitionStore } from "@/stores/acquisition";
import { BaropodometricHeatmap } from "./BaropodometricHeatmap";
import { MetricsPanel } from "./MetricsPanel";
import { PressureLegend } from "./PressureLegend";
import { ParameterBar } from "./ParameterBar";
import { HeatmapSettingsPanel } from "./HeatmapSettingsPanel";
import {
  calculateMetrics,
  DEFAULT_HEATMAP_SETTINGS,
  computeAutoParameters,
  type TemporalAutoState,
} from "@/services/baropodometry";
import { type MockPattern } from "@/services/acquisition";
import { useVisualizationStore } from "@/stores/visualization";

const PATTERN_OPTIONS: { id: MockPattern; label: string }[] = [
  { id: "center", label: "Centro" },
  { id: "left", label: "Esquerda" },
  { id: "right", label: "Direita" },
  { id: "dynamic", label: "Dinâmico" },
  { id: "uniform", label: "Uniforme" },
];

export const BaropodometryPage: React.FC = () => {
  const [physicalOpen,setPhysicalOpen] = useState(false);
  const {
    displayValues,
    status,
    deviceType,
    mockPattern,
    tareState,
    startAcquisition,
    stopAcquisition,
    startZeroing,
    setMockPattern,
    connect,
  } = useAcquisitionStore();

  const { settings, setSettings } = useVisualizationStore();
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  // Estado temporal do modo automático (suavização EMA para evitar flickering)
  const autoTemporalState = useRef<TemporalAutoState>({
    smoothedVmax: DEFAULT_HEATMAP_SETTINGS.vmax,
    smoothedThreshold: DEFAULT_HEATMAP_SETTINGS.threshold,
  });

  // Loop de adaptação automática em tempo real (quando mode === "AUTO")
  useEffect(() => {
    if (settings.mode !== "AUTO") return;

    const { settings: autoPartial, nextState } = computeAutoParameters(
      displayValues,
      settings,
      autoTemporalState.current
    );
    autoTemporalState.current = nextState;

    if (
      autoPartial.vmax !== settings.vmax ||
      autoPartial.threshold !== settings.threshold
    ) {
      setSettings((prev) => ({
        ...prev,
        ...autoPartial,
      }));
    }
  }, [displayValues, settings.mode]);

  // Calcula métricas em tempo real sobre os 225 valores normalizados
  const metrics = useMemo(() => {
    return calculateMetrics(displayValues, settings.threshold);
  }, [displayValues, settings.threshold]);

  const handleAcquisitionToggle = async () => {
    if (actionBusy) return; setActionBusy(true); setActionError("");
    try {
    if (!status.connected) {
      await connect();
      await startAcquisition();
    } else if (status.acquiring) {
      await stopAcquisition();
    } else {
      await startAcquisition();
    }
    } catch (e) { setActionError((e as Error).message); } finally { setActionBusy(false); }
  };

  return (
    <div className="h-full flex flex-col p-2.5 sm:p-3.5 gap-2 min-h-0 overflow-y-auto lg:overflow-hidden select-none relative max-w-[1600px] w-full mx-auto">
      {physicalOpen && <LivePhysicalDialog onClose={()=>setPhysicalOpen(false)} />}
      <button className="self-start text-xs text-brand underline" onClick={()=>setPhysicalOpen(true)}>Abrir conversão física com perfil ativo</button>
      {actionError && <p role="alert" className="text-xs text-danger">{actionError}</p>}
      {/* 1. Header Compacto (Altura ~42–46px) */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border-b border-line/60 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="text-brand shrink-0" size={22} />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-none">
            Análise Baropodométrica
          </h1>
          <span className="text-xs text-mute hidden md:inline ml-2 border-l border-line pl-2.5 leading-none">
            Mapa de calor plantar contínuo e distribuição de carga
          </span>
        </div>

        {/* Controles de Status e Aquisição Rápidos */}
        <div className="flex items-center flex-wrap gap-1.5 shrink-0">
          {/* Badge de Dispositivo / Modo */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface border border-line leading-none">
            {deviceType === "MOCK" ? (
              <span className="flex items-center gap-1 text-amber-500">
                <Cpu size={13} /> Mock (15×15)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-brand">
                <Usb size={13} /> Hardware Serial
              </span>
            )}
          </div>

          {/* Badge Conexão */}
          <div
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border leading-none",
              status.connected
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-surface-hover text-mute border-line"
            )}
          >
            {status.connected ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {status.connected ? `Ativo (${status.fps} FPS)` : "Desconectado"}
          </div>

          {/* Botão de Tara Rápida */}
          <button
            type="button"
            onClick={() => { try { startZeroing(); } catch (e) { setActionError((e as Error).message); } }}
            disabled={!status.acquiring || tareState.isZeroing}
            className="h-7 px-2.5 rounded-lg bg-surface hover:bg-surface-hover border border-line text-[11px] font-medium flex items-center gap-1 disabled:opacity-50 transition-colors shadow-xs"
            title="Capturar baseline sem carga sobre a esteira"
          >
            <Scale size={13} />
            <span>{tareState.isZeroing ? `${tareState.zeroingProgress}%` : "Zerar Tara"}</span>
          </button>

          {/* Botão Iniciar / Pausar */}
          <button
            type="button"
            onClick={handleAcquisitionToggle}
            disabled={actionBusy}
            className={clsx(
              "h-7 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-xs",
              status.acquiring
                ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20"
                : "bg-brand text-brand-fg hover:opacity-90"
            )}
          >
            {status.acquiring ? (
              <>
                <Square size={12} /> Pausar
              </>
            ) : (
              <>
                <Play size={12} /> Iniciar
              </>
            )}
          </button>

          {/* Botão Ajustes Avançados (Popover) */}
          <button
            type="button"
            onClick={() => setShowAdvancedSettings((v) => !v)}
            className={clsx(
              "size-7 rounded-lg grid place-items-center border transition-colors shadow-xs",
              showAdvancedSettings
                ? "bg-brand text-brand-fg border-brand"
                : "bg-surface border-line text-mute hover:text-foreground hover:bg-surface-hover"
            )}
            title="Ajustes Avançados do Mapa (Resolução e Painel Flutuante)"
          >
            <Settings2 size={14} />
          </button>
        </div>
      </header>

      {/* 2. Barra Horizontal Compacta de Parâmetros (Altura ~48–54px) */}
      <section className="shrink-0" aria-label="Parâmetros de Visualização">
        <ParameterBar settings={settings} onChange={setSettings} values={displayValues} />
      </section>

      {/* 3. Grade Principal de Análise (Ocupa Todo o Restante da Viewport: flex-1 min-h-0) */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
        {/* Coluna Esquerda: Mapa de Calor Contínuo + Legenda Térmica (7 colunas / ~60%) */}
        <section
          className="lg:col-span-7 flex flex-col h-full min-h-0 min-w-0 justify-between gap-1.5 overflow-hidden"
          aria-label="Mapa de Calor Plantar"
        >
          {/* Área do Mapa: Centralizado, estritamente proporcional 1:1, nunca causa overflow vertical */}
          <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center overflow-hidden py-0.5">
            <BaropodometricHeatmap
              values={displayValues}
              config={settings}
              cop={metrics.cop}
              className="h-full w-full"
            />
          </div>

          {/* Legenda de Intensidade Compacta */}
          <div className="shrink-0 w-full max-w-[500px] mx-auto">
            <PressureLegend vmax={settings.vmax} />
          </div>
        </section>

        {/* Coluna Direita: Métricas Clínicas, Distribuição de Carga e Controles de Mock (5 colunas / ~40%) */}
        <section
          className="lg:col-span-5 flex flex-col h-full min-h-0 justify-between gap-2 overflow-hidden"
          aria-label="Painel de Métricas"
        >
          {/* Métricas Principais (Grade 2x2 + Distribuição de Carga + Nota Técnica) */}
          <div className="flex-1 min-h-0 flex flex-col justify-between gap-2">
            <MetricsPanel metrics={metrics} />

            {/* Seletor Rápido de Padrões do Simulador Mock (Quando ativo) */}
            {deviceType === "MOCK" && (
              <div className="bg-surface/80 border border-line rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs shrink-0 shadow-xs">
                <span className="text-[10px] uppercase font-semibold text-mute flex items-center gap-1 leading-none">
                  <Layers size={13} className="text-amber-500" /> Padrão Mock:
                </span>
                <div className="flex items-center gap-1">
                  {PATTERN_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { try { setMockPattern(p.id); } catch (e) { setActionError((e as Error).message); } }}
                      className={clsx(
                        "px-2 py-0.5 rounded text-[11px] font-semibold border transition-all leading-tight",
                        mockPattern === p.id
                          ? "bg-brand text-brand-fg border-brand shadow-xs"
                          : "bg-surface border-line text-mute hover:text-foreground hover:bg-surface-hover"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Painel Flutuante Popover para Ajustes Avançados (Opcional por demanda) */}
      {showAdvancedSettings && (
        <div className="absolute top-14 right-4 z-50 max-w-sm w-full animate-in fade-in zoom-in-95 duration-150">
          <HeatmapSettingsPanel
            settings={settings}
            onChange={setSettings}
            onClose={() => setShowAdvancedSettings(false)}
          />
        </div>
      )}
    </div>
  );
};
