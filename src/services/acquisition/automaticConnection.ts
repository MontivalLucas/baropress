import { useSession } from "@/stores/session";
import { useAcquisitionStore } from "@/stores/acquisition";
import { SerialSensorDevice } from "./SerialSensorDevice";
import { acquisitionOwner } from "./rawStream";
import type { PortInfo } from "./types";

/** Porta salva tem prioridade; nunca escolhe arbitrariamente entre dispositivos. */
export function selectAutomaticPort(ports: PortInfo[], savedPort: string): PortInfo | null {
  const saved = ports.find((port) => port.name.toLowerCase() === savedPort.toLowerCase());
  if (saved) return saved;
  const candidates = ports.filter((port) => /arduino|esp32|espressif|cp210|silicon.?labs|ch340|ch341|qinheng|wch|ftdi/i.test(
    [port.description, port.manufacturer, port.product].filter(Boolean).join(" "),
  ));
  if (candidates.length === 1) return candidates[0];
  if (!savedPort && ports.length === 1) return ports[0];
  return null;
}

/** Conexão em segundo plano; não inicia exame, tara ou captura de calibração. */
export function startAutomaticConnection(isActive: () => boolean, retryMs = 3000): () => void {
  let live = true;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  let running = false;
  let retryDelay = retryMs;
  const eligible = () => {
    const state = useAcquisitionStore.getState();
    return live && isActive() && state.deviceType === "SERIAL" && !state.autoConnectSuspended && !acquisitionOwner();
  };
  const message = (text: string) => {
    if (live && useAcquisitionStore.getState().autoConnectionMessage !== text) {
      useAcquisitionStore.setState({ autoConnectionMessage: text });
    }
  };
  const attempt = async () => {
    if (running) return;
    running = true;
    try {
      if (!eligible()) return;
      const before = useAcquisitionStore.getState();
      if (before.status.connected || before.isConnecting) return;
      const professional = useSession.getState().user?.role === "professional";
      if (professional && !before.selectedPort) { message("Solicite ao administrador a configuração da porta do Arduino."); return; }
      const ports = professional ? [{ name: before.selectedPort, isBluetooth: false }] : await SerialSensorDevice.listAvailablePorts();
      if (!eligible()) return;
      const current = useAcquisitionStore.getState();
      if (current.status.connected || current.isConnecting || current.selectedPort !== before.selectedPort || current.selectedBaud !== before.selectedBaud) return;
      useAcquisitionStore.setState({ availablePorts: ports });
      const chosen = selectAutomaticPort(ports, current.selectedPort);
      if (!chosen) {
        message(ports.length === 0
          ? "Aguardando o Arduino. Conecte o USB; a porta será verificada automaticamente."
          : "Selecione a porta do Arduino em Configurações > Arduino para conectar automaticamente.");
        return;
      }
      current.setSelectedPort(chosen.name);
      message(`Conectando automaticamente ao Arduino em ${chosen.name}...`);
      await useAcquisitionStore.getState().connect({ automatic: true });
      failures = 0;
      retryDelay = retryMs;
      if (eligible()) message(`Arduino conectado automaticamente em ${chosen.name}. A leitura pode ser iniciada quando necessário.`);
    } catch (error) {
      failures++;
      retryDelay = Math.min(60_000, retryMs * 2 ** Math.min(5, failures - 1));
      if (eligible()) message(`Não foi possível conectar ao Arduino. Confira o USB e a porta selecionada. Nova tentativa em ${Math.ceil(retryDelay / 1000)} s. Detalhes nos logs de comunicação.`);
    } finally {
      running = false;
      if (live) timer = setTimeout(() => { void attempt(); }, retryDelay);
    }
  };
  const stopSubscription = useAcquisitionStore.subscribe((current, previous) => {
    if (current.autoConnectSuspended !== previous.autoConnectSuspended && !current.autoConnectSuspended) {
      failures = 0; retryDelay = retryMs;
      clearTimeout(timer);
      if (!running) void attempt();
    }
  });
  void attempt();
  return () => { live = false; clearTimeout(timer); stopSubscription(); };
}
