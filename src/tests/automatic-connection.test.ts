import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { useAcquisitionStore } from "@/stores/acquisition";
import { SerialSensorDevice } from "@/services/acquisition/SerialSensorDevice";
import { selectAutomaticPort, startAutomaticConnection } from "@/services/acquisition/automaticConnection";
import { acquireLease } from "@/services/acquisition/rawStream";
import { normalizePreferences } from "@/services/preferences";
import type { PortInfo } from "@/services/acquisition/types";

const sessionFixture=vi.hoisted(()=>({role:null as string|null}));
vi.mock("@/stores/session",()=>({useSession:{getState:()=>({user:sessionFixture.role?{role:sessionFixture.role}:null})}}));

const initial = useAcquisitionStore.getState();
const port = (name: string, product?: string): PortInfo => ({ name, product, isBluetooth: false });

describe("Arduino — escolha da porta", () => {
  it("prioriza a porta salva e detecta um Arduino único quando a COM muda", () => {
    expect(selectAutomaticPort([port("COM1"), port("COM7", "ESP32")], "com1")?.name).toBe("COM1");
    expect(selectAutomaticPort([port("COM1"), port("COM8", "USB CH340")], "COM7")?.name).toBe("COM8");
    expect(selectAutomaticPort([port("COM7")], "")?.name).toBe("COM7");
  });
  it("aguarda escolha quando há ambiguidade ou a porta salva sumiu", () => {
    expect(selectAutomaticPort([port("COM7", "ESP32"), port("COM8", "Arduino")], "")).toBeNull();
    expect(selectAutomaticPort([port("COM1")], "COM7")).toBeNull();
    expect(selectAutomaticPort([], "COM7")).toBeNull();
  });
  it("usa hardware real por padrão e respeita simulação escolhida", () => {
    expect(normalizePreferences({}).deviceType).toBe("SERIAL");
    expect(normalizePreferences({ deviceType: "MOCK" }).deviceType).toBe("MOCK");
  });
});

describe("Arduino — conexão automática", () => {
  let stop: (() => void) | undefined;
  let release: (() => void) | undefined;
  let active: boolean;
  let connect: Mock<() => Promise<void>>;
  beforeEach(() => {
    vi.useFakeTimers();
    active = true; sessionFixture.role=null;
    connect = vi.fn(async () => {
      useAcquisitionStore.setState({ status: { ...initial.status, connected: true, transport: "SERIAL" } });
    });
    useAcquisitionStore.setState({ ...initial, deviceType: "SERIAL", selectedPort: "COM7", autoConnectSuspended: false, connect });
    vi.spyOn(SerialSensorDevice, "listAvailablePorts").mockResolvedValue([port("COM7")]);
  });
  it("profissional conecta na porta salva sem descobrir ou editar hardware", async()=>{
    sessionFixture.role="professional";
    stop=startAutomaticConnection(()=>active);
    await vi.advanceTimersByTimeAsync(0);
    expect(SerialSensorDevice.listAvailablePorts).not.toHaveBeenCalled();expect(connect).toHaveBeenCalledOnce();
  });
  it("profissional sem porta aguarda configuração do administrador", async()=>{
    sessionFixture.role="professional";useAcquisitionStore.setState({selectedPort:""});
    stop=startAutomaticConnection(()=>active);await vi.advanceTimersByTimeAsync(0);
    expect(connect).not.toHaveBeenCalled();expect(useAcquisitionStore.getState().autoConnectionMessage).toContain("administrador");
  });
  afterEach(() => {
    stop?.(); stop = undefined;
    release?.(); release = undefined;
    vi.restoreAllMocks();
    useAcquisitionStore.setState(initial);
    vi.useRealTimers();
  });
  const settle = async () => { await vi.advanceTimersByTimeAsync(1); };

  it("conecta sem abrir Configurações e não inicia leitura, exame ou tara", async () => {
    const start = vi.fn();
    useAcquisitionStore.setState({ startAcquisition: start });
    stop = startAutomaticConnection(() => active);
    await settle();
    expect(connect).toHaveBeenCalledOnce();
    expect(connect).toHaveBeenCalledWith({ automatic: true });
    expect(start).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(9000);
    expect(connect).toHaveBeenCalledOnce();
  });
  it("aguarda dispositivo ausente e conecta quando o USB aparece", async () => {
    vi.mocked(SerialSensorDevice.listAvailablePorts).mockResolvedValueOnce([]);
    stop = startAutomaticConnection(() => active);
    await settle();
    expect(connect).not.toHaveBeenCalled();
    expect(useAcquisitionStore.getState().autoConnectionMessage).toContain("Aguardando");
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledOnce();
  });
  it("tenta novamente após porta ocupada, sem trocar para simulação", async () => {
    connect.mockRejectedValueOnce(new Error("Porta ocupada"));
    stop = startAutomaticConnection(() => active);
    await settle();
    expect(useAcquisitionStore.getState().autoConnectionMessage).toContain("Confira o USB");
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(useAcquisitionStore.getState().deviceType).toBe("SERIAL");
  });
  it("aumenta o intervalo após falhas e retoma imediatamente quando solicitado", async () => {
    connect.mockRejectedValue(new Error("Falha simulada"));
    stop = startAutomaticConnection(() => active);
    await settle();
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledTimes(3);
    useAcquisitionStore.setState({ autoConnectSuspended: true });
    await vi.advanceTimersByTimeAsync(60000);
    expect(connect).toHaveBeenCalledTimes(3);
    useAcquisitionStore.setState({ autoConnectSuspended: false });
    await settle();
    expect(connect).toHaveBeenCalledTimes(4);
  });
  it("respeita desconexão manual e a pausa da sessão", async () => {
    stop = startAutomaticConnection(() => active);
    await settle();
    await useAcquisitionStore.getState().disconnect();
    await vi.advanceTimersByTimeAsync(9000);
    expect(connect).toHaveBeenCalledOnce();
    useAcquisitionStore.setState({ autoConnectSuspended: false });
    active = false;
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledOnce();
  });
  it("reconecta após perda de conexão sem reabrir uma coleta", async () => {
    stop = startAutomaticConnection(() => active);
    await settle();
    useAcquisitionStore.setState({ status: { ...initial.status, connected: false } });
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(useAcquisitionStore.getState().status.connected).toBe(true);
  });
  it("não interfere no modo Mock nem em uma coleta com configuração congelada", async () => {
    useAcquisitionStore.setState({ deviceType: "MOCK" });
    stop = startAutomaticConnection(() => active);
    await settle();
    expect(SerialSensorDevice.listAvailablePorts).not.toHaveBeenCalled();
    useAcquisitionStore.setState({ deviceType: "SERIAL" });
    release = acquireLease("calibration");
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).not.toHaveBeenCalled();
    release(); release = undefined;
    await vi.advanceTimersByTimeAsync(3000);
    expect(connect).toHaveBeenCalledOnce();
  });
  it("descarta busca pendente após sair e preserva a seleção alterada pelo usuário", async () => {
    let resolve!: (ports: PortInfo[]) => void;
    vi.mocked(SerialSensorDevice.listAvailablePorts).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    stop = startAutomaticConnection(() => active);
    useAcquisitionStore.getState().setSelectedPort("COM8");
    resolve([port("COM7")]);
    await settle();
    expect(connect).not.toHaveBeenCalled();
    expect(useAcquisitionStore.getState().selectedPort).toBe("COM8");
    stop();
    vi.mocked(SerialSensorDevice.listAvailablePorts).mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    stop = startAutomaticConnection(() => active);
    stop();
    resolve([port("COM8")]);
    await settle();
    expect(connect).not.toHaveBeenCalled();
  });
});
