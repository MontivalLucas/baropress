import { create } from "zustand";
import { publishRawFrame, assertConfigurationUnlocked } from "@/services/acquisition/rawStream";
import {
  applyTare,
  FrameBuffer,
  MockSensorDevice,
  normalizeMatrixOrientation,
  SerialSensorDevice,
  TareManager,
  type AcquisitionLog,
  type DeviceStatus,
  type MockPattern,
  type PortInfo,
  type SensorDevice,
  type SensorFrame,
  type TareState,
} from "@/services/acquisition";

const tareManager = new TareManager();
const frameBuffer = new FrameBuffer(120);

interface AcquisitionStore {
  // Configuração
  deviceType: "SERIAL" | "MOCK";
  availablePorts: PortInfo[];
  selectedPort: string;
  selectedBaud: number;
  mockPattern: MockPattern;

  // Estado
  activeDevice: SensorDevice | null;
  status: DeviceStatus;
  tareState: TareState;
  logs: AcquisitionLog[];
  isConnecting: boolean;
  autoConnectSuspended: boolean;
  autoConnectionMessage: string;

  // Frame atual para UI (atualizado via RAF / throttling)
  latestFrame: SensorFrame | null;
  displayValues: number[]; // 225 valores após tara e normalização

  // Ações
  refreshPorts: () => Promise<void>;
  setDeviceType: (type: "SERIAL" | "MOCK") => void;
  setSelectedPort: (port: string) => void;
  setSelectedBaud: (baud: number) => void;
  setMockPattern: (pattern: MockPattern) => void;

  connect: (options?: { automatic?: boolean }) => Promise<void>;
  disconnect: () => Promise<void>;
  startAcquisition: () => Promise<void>;
  stopAcquisition: () => Promise<void>;

  startZeroing: () => void;
  toggleTareActive: () => void;
  clearTare: () => void;

  addLog: (level: "INFO" | "WARN" | "ERROR", message: string) => void;
  clearLogs: () => void;
}

const initialStatus: DeviceStatus = {
  connected: false,
  acquiring: false,
  transport: "NONE",
  framesReceived: 0,
  invalidFrames: 0,
  fps: 0,
};

let rafScheduled = false;
let lastStatusTime = 0;
let connectionInFlight: Promise<void> | null = null;

export const useAcquisitionStore = create<AcquisitionStore>((set, get) => ({
  deviceType: "MOCK",
  availablePorts: [],
  selectedPort: "",
  selectedBaud: 115200,
  mockPattern: "center",

  activeDevice: null,
  status: initialStatus,
  tareState: tareManager.getState(),
  logs: [],
  isConnecting: false,
  autoConnectSuspended: false,
  autoConnectionMessage: "",

  latestFrame: null,
  displayValues: new Array(225).fill(0),

  refreshPorts: async () => {
    const ports = await SerialSensorDevice.listAvailablePorts();
    set({ availablePorts: ports });
  },

  setDeviceType: (type) => {
    assertConfigurationUnlocked();
    if (connectionInFlight || type === get().deviceType) return;
    const { activeDevice, status } = get();
    if (status.connected && activeDevice) {
      activeDevice.disconnect().catch(() => {});
    }
    set({
      deviceType: type,
      status: initialStatus,
      activeDevice: null,
      latestFrame: null,
      displayValues: new Array(225).fill(0),
      autoConnectSuspended: false,
      autoConnectionMessage: "",
    });
  },

  setSelectedPort: (port) => { assertConfigurationUnlocked(); if (get().isConnecting || get().status.connected) return; set({ selectedPort: port }); },
  setSelectedBaud: (baud) => { assertConfigurationUnlocked(); if (get().isConnecting || get().status.connected) return; set({ selectedBaud: baud }); },

  setMockPattern: (pattern) => {
    assertConfigurationUnlocked();
    set({ mockPattern: pattern });
    const { activeDevice } = get();
    if (activeDevice instanceof MockSensorDevice) {
      activeDevice.setPattern(pattern);
    }
  },

  connect: (options) => {
    if (!options?.automatic) set({ autoConnectSuspended: false, autoConnectionMessage: "" });
    if (connectionInFlight) return connectionInFlight;
    if (get().status.connected) return Promise.resolve();
    set({ isConnecting: true });
    connectionInFlight = (async () => {
    const { deviceType, selectedPort, selectedBaud, mockPattern, addLog } = get();

    // Ao reconectar após perda de USB, encerra listeners e polling antigos.
    const previous = get().activeDevice;
    if (previous) {
      await previous.disconnect();
      set({ activeDevice: null, status: initialStatus });
    }

    let device: SensorDevice;
    frameBuffer.clear();
    lastStatusTime = 0;
    if (deviceType === "MOCK") {
      device = new MockSensorDevice(mockPattern);
      addLog("INFO", "Conectando ao Simulador de Sensores (Mock 15x15)...");
    } else {
      device = new SerialSensorDevice();
      addLog("INFO", `Conectando à porta serial ${selectedPort} a ${selectedBaud} baud...`);
    }

    // Assina eventos do dispositivo
    device.onFrame((frame) => {
      if (get().activeDevice !== device) return;
      publishRawFrame(frame);
      frameBuffer.push(frame);

      // Procedimento de calibração de tara
      if (tareManager.getState().isZeroing) {
        const completed = tareManager.feedFrame(frame);
        set({ tareState: tareManager.getState() });
        if (completed) {
          addLog("INFO", tareManager.getState().message || "Tara concluída com sucesso.");
        }
      }

      // Desacoplamento da renderização via requestAnimationFrame
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(() => {
          rafScheduled = false;
          if (get().activeDevice !== device) return;
          const curLatest = frameBuffer.getLatest();
          if (curLatest) {
            const tare = tareManager.getState();
            const withTare = applyTare(curLatest.values, tare.baseline, tare.active);
            const oriented = normalizeMatrixOrientation(withTare);
            const now = performance.now();
            const updateStatus = now - lastStatusTime >= 250;
            if (updateStatus) lastStatusTime = now;
            set({
              latestFrame: curLatest,
              displayValues: oriented,
              ...(updateStatus ? { status: {
                ...device.getStatus(),
                fps: frameBuffer.getFPS(),
              } } : {}),
            });
          }
        });
      }
    });

    device.onError((err) => {
      if (get().activeDevice !== device) return;
      addLog("ERROR", err);
      set({ status: device.getStatus() });
    });

    device.onStatusChange((newStatus) => {
      if (get().activeDevice !== device) return;
      set({ status: newStatus });
    });

    try {
      await device.connect({
        port: selectedPort,
        baudRate: selectedBaud,
        mockPattern,
      });

      set({ activeDevice: device, status: device.getStatus() });
      addLog("INFO", `Dispositivo conectado com sucesso (${device.type}).`);
    } catch (err) {
      const msg = (err as Error).message;
      addLog("ERROR", `Falha ao conectar: ${msg}`);
      throw err;
    }
    })().finally(() => { connectionInFlight = null; set({ isConnecting: false }); });
    return connectionInFlight;
  },

  disconnect: async () => {
    set({ autoConnectSuspended: true, autoConnectionMessage: "Conexão automática pausada nesta sessão. Use Conectar dispositivo para retomar." });
    if (connectionInFlight) await connectionInFlight.catch(() => {});
    const { activeDevice, addLog } = get();
    if (activeDevice) {
      try {
        await activeDevice.disconnect();
        addLog("INFO", "Dispositivo desconectado.");
      } catch {
        // Ignora
      }
    }
    frameBuffer.clear();
    set({
      activeDevice: null,
      status: initialStatus,
      latestFrame: null,
      displayValues: new Array(225).fill(0),
    });
  },

  startAcquisition: async () => {
    const { activeDevice, addLog } = get();
    if (!activeDevice) return;
    try {
      await activeDevice.startAcquisition();
      addLog("INFO", "Aquisição de dados iniciada.");
      set({ status: activeDevice.getStatus() });
    } catch (err) {
      const msg = (err as Error).message;
      addLog("ERROR", `Falha ao iniciar aquisição: ${msg}`);
      throw err;
    }
  },

  stopAcquisition: async () => {
    const { activeDevice, addLog } = get();
    if (!activeDevice) return;
    try {
      await activeDevice.stopAcquisition();
      addLog("INFO", "Aquisição de dados pausada.");
      set({ status: activeDevice.getStatus() });
    } catch {
      // Ignora
    }
  },

  startZeroing: () => {
    assertConfigurationUnlocked();
    const { addLog } = get();
    tareManager.startZeroing(20);
    set({ tareState: tareManager.getState() });
    addLog("INFO", "Procedimento de zeramento de tara iniciado (coletando 20 frames)...");
  },

  toggleTareActive: () => {
    assertConfigurationUnlocked();
    const cur = tareManager.getState();
    tareManager.setActive(!cur.active);
    set({ tareState: tareManager.getState() });
    get().addLog("INFO", !cur.active ? "Tara ativada." : "Tara desativada.");
  },

  clearTare: () => {
    assertConfigurationUnlocked();
    tareManager.clearBaseline();
    set({ tareState: tareManager.getState() });
    get().addLog("INFO", "Baseline de tara removido.");
  },

  addLog: (level, message) => {
    const item: AcquisitionLog = {
      timestamp: new Date().toLocaleTimeString("pt-BR"),
      level,
      message,
    };
    set((state) => ({
      logs: [item, ...state.logs.slice(0, 99)],
    }));
  },

  clearLogs: () => set({ logs: [] }),
}));
