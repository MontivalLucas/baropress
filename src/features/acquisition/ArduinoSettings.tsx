import React, { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Play,
  Square,
  RefreshCw,
  Scale,
  Trash2,
  Usb,
  Radio,
  Sliders,
} from "lucide-react";
import { useAcquisitionStore } from "@/stores/acquisition";
import { usePreferencesStore } from "@/stores/preferences";
import { MatrixPreview15x15 } from "./MatrixPreview15x15";
import { SENSOR_CONFIG, type MockPattern } from "@/services/acquisition";

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

const MOCK_PATTERNS: { id: MockPattern; label: string; desc: string }[] = [
  { id: "center", label: "Centro", desc: "Pico no centro da esteira" },
  { id: "left", label: "Esquerda", desc: "Pico nas colunas esquerdas" },
  { id: "right", label: "Direita", desc: "Pico nas colunas direitas" },
  { id: "uniform", label: "Uniforme", desc: "Mesmo valor (1500) em todos" },
  { id: "dynamic", label: "Dinâmico", desc: "Onda de pressão em movimento" },
];

export const ArduinoSettings: React.FC = () => {
  const hydrated = usePreferencesStore((state) => state.hydrated);
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const {
    deviceType,
    availablePorts,
    selectedPort,
    selectedBaud,
    mockPattern,
    status,
    tareState,
    displayValues,
    logs,
    isConnecting,
    autoConnectionMessage,
    autoConnectSuspended,
    refreshPorts,
    setDeviceType,
    setSelectedPort,
    setSelectedBaud,
    setMockPattern,
    connect,
    disconnect,
    startAcquisition,
    stopAcquisition,
    startZeroing,
    toggleTareActive,
    clearTare,
    clearLogs,
  } = useAcquisitionStore();

  useEffect(() => {
    refreshPorts();
  }, [refreshPorts]);

  const handleConnectToggle = async () => {
    if (busy) return; setBusy(true); setActionError("");
    try {
    if (status.connected) {
      await disconnect();
    } else {
      await connect();
    }
    } catch (e) { setActionError((e as Error).message); } finally { setBusy(false); }
  };

  const handleAcquisitionToggle = async () => {
    if (busy) return; setBusy(true); setActionError("");
    try {
    if (status.acquiring) {
      await stopAcquisition();
    } else {
      await startAcquisition();
    }
    } catch (e) { setActionError((e as Error).message); } finally { setBusy(false); }
  };

  const safeAction = (action: () => void) => { try { action(); setActionError(""); } catch (e) { setActionError((e as Error).message); } };
  if (!hydrated) return <p role="status" className="text-sm text-mute">Carregando configurações do Arduino...</p>;
  return (
    <div className="space-y-6">
      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
      {autoConnectionMessage && <p role="status" className="text-sm text-mute">{autoConnectionMessage}</p>}
      {deviceType === "SERIAL" && !status.connected && <button type="button"
        className="px-3 py-2 border border-line rounded-lg text-sm" onClick={() => {
          useAcquisitionStore.setState({ autoConnectSuspended: !autoConnectSuspended,
            autoConnectionMessage: autoConnectSuspended ? "Retomando conexão automática..." : "Novas tentativas automáticas pausadas nesta sessão." });
        }}>{autoConnectSuspended ? "Retomar tentativas automáticas" : "Pausar tentativas automáticas"}</button>}
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2.5">
            <Cpu className="text-brand" size={26} />
            Arduino / ESP32
          </h2>
          <p className="text-sm text-mute mt-1">
            Porta, conexão, leitura, tara e diagnóstico da plataforma 15×15. Hardware Real conecta automaticamente após entrar no programa; o modo Simulação é mantido quando selecionado.
          </p>
        </div>

        {/* Badges de Status em Tempo Real */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Conexão */}
          <div
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              status.connected
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                : "bg-surface-hover text-mute border-line"
            )}
          >
            {status.connected ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {status.connected ? "Conectado" : "Desconectado"}
          </div>

          {/* Aquisição */}
          {status.connected && (
            <div
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border",
                status.acquiring
                  ? "bg-brand/10 text-brand border-brand/30 animate-pulse"
                  : "bg-surface-hover text-mute border-line"
              )}
            >
              <Radio size={14} />
              {status.acquiring ? `Aquisição Ativa (${status.fps} FPS)` : "Pausada"}
            </div>
          )}

          {/* Sensores */}
          <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface-hover border border-line text-foreground">
            {SENSOR_CONFIG.sensorCount} sensores
          </div>
        </div>
      </div>

      {/* Grid Principal: Painel de Controle à Esquerda, Visualizador à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna de Controles (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bloco 1: Seleção de Dispositivo / Modo */}
          <div className="bg-surface border border-line rounded-card p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-mute flex items-center gap-2">
              <Sliders size={16} /> Modo de Comunicação
            </h2>

            <div className="grid grid-cols-2 gap-2 p-1 bg-canvas rounded-lg border border-line">
              <button
                type="button"
                onClick={() => safeAction(() => setDeviceType("SERIAL"))}
                disabled={busy || isConnecting || status.connected}
                className={clsx(
                  "py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                  deviceType === "SERIAL"
                    ? "bg-brand text-brand-fg shadow-sm"
                    : "text-mute hover:text-foreground hover:bg-surface"
                )}
              >
                <Usb size={15} /> Hardware Real
              </button>
              <button
                type="button"
                onClick={() => safeAction(() => setDeviceType("MOCK"))}
                disabled={busy || isConnecting || status.connected}
                className={clsx(
                  "py-2 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-colors",
                  deviceType === "MOCK"
                    ? "bg-brand text-brand-fg shadow-sm"
                    : "text-mute hover:text-foreground hover:bg-surface"
                )}
              >
                <Cpu size={15} /> Simulador (Mock)
              </button>
            </div>

            {/* Parâmetros do Hardware Real */}
            {deviceType === "SERIAL" && (
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-foreground">Porta Serial (COM / Bluetooth):</label>
                    <button
                      type="button"
                      onClick={refreshPorts}
                      className="text-xs text-brand hover:underline flex items-center gap-1"
                      title="Atualizar lista de portas"
                    >
                      <RefreshCw size={12} /> Atualizar
                    </button>
                  </div>
                  <select
                    value={selectedPort}
                    onChange={(e) => safeAction(() => setSelectedPort(e.target.value))}
                    disabled={busy || isConnecting || status.connected}
                    className="w-full h-9 px-3 rounded-lg bg-canvas border border-line text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                  >
                    <option value="">{availablePorts.length === 0 ? "Nenhuma porta detectada" : "Selecione a porta do Arduino"}</option>
                    {selectedPort && !availablePorts.some((port) => port.name === selectedPort) && <option value={selectedPort}>{selectedPort} — não detectada</option>}
                    {availablePorts.length > 0 && (
                      availablePorts.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} {p.isBluetooth ? "— (Bluetooth SPP)" : ""} {p.manufacturer ? `(${p.manufacturer})` : ""}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Baud Rate:</label>
                  <select
                    value={selectedBaud}
                    onChange={(e) => safeAction(() => setSelectedBaud(Number(e.target.value)))}
                    disabled={busy || isConnecting || status.connected}
                    className="w-full h-9 px-3 rounded-lg bg-canvas border border-line text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
                  >
                    {BAUD_RATES.map((b) => (
                      <option key={b} value={b}>
                        {b} baud {b === 115200 ? "(Padrão ESP32)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Parâmetros do Mock */}
            {deviceType === "MOCK" && (
              <div className="space-y-3 pt-2">
                <label className="text-xs font-medium text-foreground block">Padrão de Pressão Simulado:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MOCK_PATTERNS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => safeAction(() => setMockPattern(p.id))}
                      className={clsx(
                        "p-2.5 rounded-lg border text-left transition-colors",
                        mockPattern === p.id
                          ? "bg-brand/10 border-brand text-brand"
                          : "bg-surface-hover/50 border-line hover:border-brand/40 text-foreground"
                      )}
                    >
                      <span className="text-xs font-bold block">{p.label}</span>
                      <span className="text-[10px] text-mute">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botões de Ação de Conexão e Aquisição */}
            <div className="pt-3 border-t border-line flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConnectToggle}
                disabled={busy || isConnecting || (deviceType === "SERIAL" && !selectedPort)}
                className={clsx(
                  "w-full h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                  status.connected
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20"
                    : "bg-brand text-brand-fg hover:opacity-90 shadow-sm"
                )}
              >
                {status.connected ? (
                  <>
                    <Square size={16} /> Desconectar Dispositivo
                  </>
                ) : (
                  <>
                    <Play size={16} /> {isConnecting ? "Conectando..." : "Conectar Dispositivo"}
                  </>
                )}
              </button>

              {status.connected && (
                <button
                  type="button"
                  onClick={handleAcquisitionToggle}
                  disabled={busy || isConnecting}
                  className={clsx(
                    "w-full h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors",
                    status.acquiring
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  )}
                >
                  {status.acquiring ? (
                    <>
                      <Square size={16} /> Pausar Aquisição
                    </>
                  ) : (
                    <>
                      <Activity size={16} /> Iniciar Aquisição Contínua
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Bloco 2: Calibração de Tara (Zero Baseline) */}
          <div className="bg-surface border border-line rounded-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-mute flex items-center gap-2">
                <Scale size={16} /> Calibração de Tara (Zero)
              </h2>
              {tareState.baseline && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  Baseline Gravado
                </span>
              )}
            </div>

            <p className="text-xs text-mute leading-relaxed">
              Subtrai o ruído de fundo da esteira sem carga (<code>max(0, raw - baseline)</code>). Não representa
              calibração física em kg.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => safeAction(startZeroing)}
                disabled={!status.acquiring || tareState.isZeroing}
                className="flex-1 h-9 rounded-lg bg-surface-hover hover:bg-line border border-line text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <Scale size={14} />
                {tareState.isZeroing ? `Zerando (${tareState.zeroingProgress}%)…` : "Zerar Tara (20 frames)"}
              </button>

              <button
                type="button"
                onClick={() => safeAction(toggleTareActive)}
                disabled={!tareState.baseline}
                className={clsx(
                  "px-3 h-9 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40",
                  tareState.active
                    ? "bg-brand/10 text-brand border-brand/30"
                    : "bg-surface-hover text-mute border-line hover:text-foreground"
                )}
              >
                {tareState.active ? "Tara: Ativa" : "Tara: Inativa"}
              </button>

              {tareState.baseline && (
                <button
                  type="button"
                  onClick={() => safeAction(clearTare)}
                  className="size-9 rounded-lg grid place-items-center bg-surface-hover hover:bg-rose-500/15 hover:text-rose-500 border border-line text-mute transition-colors"
                  title="Limpar Baseline de Tara"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {tareState.message && (
              <div className="p-2.5 rounded-lg bg-canvas text-xs text-mute border border-line/70">
                {tareState.message}
              </div>
            )}
          </div>

          {/* Bloco 3: Logs Técnicos do Hardware */}
          <div className="bg-surface border border-line rounded-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-mute">Logs de Comunicação</h2>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={clearLogs}
                  className="text-xs text-mute hover:text-foreground transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="h-36 overflow-y-auto rounded-lg bg-canvas border border-line p-2.5 font-mono text-[11px] space-y-1 select-text">
              {logs.length === 0 ? (
                <div className="text-mute italic text-center py-8">Nenhum evento registrado ainda.</div>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className="flex items-start gap-1.5 leading-tight">
                    <span className="text-mute shrink-0">[{l.timestamp}]</span>
                    <span
                      className={clsx(
                        "shrink-0 font-semibold",
                        l.level === "INFO" && "text-brand",
                        l.level === "WARN" && "text-amber-500",
                        l.level === "ERROR" && "text-rose-500"
                      )}
                    >
                      [{l.level}]
                    </span>
                    <span className="text-foreground break-all">{l.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Coluna do Visualizador 15x15 (7 colunas) */}
        <div className="lg:col-span-7 space-y-6">
          <MatrixPreview15x15
            values={displayValues}
            tareActive={tareState.active}
            isSimulated={deviceType === "MOCK" || status.transport === "MOCK"}
          />

          {/* Painel com Métricas de Conexão */}
          <div className="bg-surface border border-line rounded-card p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-xs text-mute block mb-1">FPS Real</span>
              <span className="text-xl font-bold text-foreground">
                {status.acquiring ? status.fps.toFixed(1) : "0.0"}
              </span>
            </div>
            <div>
              <span className="text-xs text-mute block mb-1">Frames Válidos</span>
              <span className="text-xl font-bold text-foreground">{status.framesReceived}</span>
            </div>
            <div>
              <span className="text-xs text-mute block mb-1">Frames Inválidos</span>
              <span
                className={clsx(
                  "text-xl font-bold",
                  status.invalidFrames > 0 ? "text-rose-500" : "text-foreground"
                )}
              >
                {status.invalidFrames}
              </span>
            </div>
            <div>
              <span className="text-xs text-mute block mb-1">Porta / Canal</span>
              <span className="text-sm font-semibold text-foreground truncate block">
                {status.connected ? status.port || "Simulador" : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
