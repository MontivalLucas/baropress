import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ invoke: vi.fn(), listen: vi.fn(), unlistenFrame: vi.fn(), unlistenError: vi.fn(), unlistenInvalid:vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: mocks.invoke }));
vi.mock("@tauri-apps/api/event", () => ({ listen: mocks.listen }));
import { SerialSensorDevice } from "@/services/acquisition/SerialSensorDevice";
const connected = { connected: true, acquiring: false, transport: "SERIAL", port: "COM_TEST", baudRate: 115200, framesReceived: 0, invalidFrames: 0, fps: 0 };

beforeEach(() => {
  vi.useFakeTimers(); vi.clearAllMocks();
  mocks.invoke.mockImplementation(async (cmd: string) => cmd === "acquisition_get_status" ? connected : undefined);
  mocks.listen.mockImplementation(async (event: string) => event === "sensor-frame" ? mocks.unlistenFrame : event === "acquisition-invalid-frame" ? mocks.unlistenInvalid : mocks.unlistenError);
});
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });

describe("Comunicação serial sem fila de consultas duplicadas", () => {
  it("mantém apenas uma consulta pendente enquanto o backend está ocupado", async () => {
    const device = new SerialSensorDevice();
    await device.connect({ port: "COM_TEST" });
    let resolveStatus!: (status: typeof connected) => void;
    mocks.invoke.mockImplementation((cmd: string) => cmd === "acquisition_get_status" ? new Promise(resolve => { resolveStatus = resolve; }) : Promise.resolve());
    await vi.advanceTimersByTimeAsync(5000);
    expect(mocks.invoke.mock.calls.filter(([cmd]) => cmd === "acquisition_get_status")).toHaveLength(2);
    resolveStatus({ ...connected, fps: 12 });
    await Promise.resolve();
    expect(device.getStatus().fps).toBe(12);
    await device.disconnect();
  });

  it("ignora uma resposta antiga após desconectar e encerra o polling", async () => {
    const device = new SerialSensorDevice();
    await device.connect({ port: "COM_TEST" });
    let resolveStatus!: (status: typeof connected) => void;
    mocks.invoke.mockImplementation((cmd: string) => cmd === "acquisition_get_status" ? new Promise(resolve => { resolveStatus = resolve; }) : Promise.resolve());
    await vi.advanceTimersByTimeAsync(1000);
    await device.disconnect();
    resolveStatus(connected); await Promise.resolve();
    await vi.advanceTimersByTimeAsync(5000);
    expect(device.getStatus().connected).toBe(false);
    expect(mocks.invoke.mock.calls.filter(([cmd]) => cmd === "acquisition_get_status")).toHaveLength(2);
    expect(mocks.unlistenFrame).toHaveBeenCalledOnce();
    expect(mocks.unlistenError).toHaveBeenCalledOnce();
  });

  it("libera listener parcial e conexão quando a inscrição de eventos falha", async () => {
    mocks.listen.mockImplementation(async (event: string) => { if (event === "acquisition-error") throw new Error("Falha simulada"); return event === 'acquisition-invalid-frame' ? mocks.unlistenInvalid : mocks.unlistenFrame; });
    const device = new SerialSensorDevice();
    await expect(device.connect({ port: "COM_TEST" })).rejects.toThrow("Falha simulada");
    expect(mocks.unlistenFrame).toHaveBeenCalledOnce();
    expect(mocks.invoke).toHaveBeenCalledWith("acquisition_disconnect");
    await vi.advanceTimersByTimeAsync(5000);
    expect(mocks.invoke.mock.calls.filter(([cmd]) => cmd === "acquisition_get_status")).toHaveLength(0);
  });

  it("continua entregando todos os quadros pelo evento, sem polling de quadros", async () => {
    const device = new SerialSensorDevice(); const received = vi.fn();
    device.onFrame(received); await device.connect({ port: "COM_TEST" });
    const deliver = mocks.listen.mock.calls.find(([event]) => event === "sensor-frame")![1];
    for (let sequence = 1; sequence <= 100; sequence++) deliver({ payload: { sequence, values: Array(225).fill(100), timestamp: sequence / 30, source: "REAL" } });
    expect(received).toHaveBeenCalledTimes(100);
    expect(mocks.invoke.mock.calls.some(([cmd]) => cmd === "acquisition_poll_frames")).toBe(false);
    await device.disconnect();
  });
});
