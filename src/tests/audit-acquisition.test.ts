import { afterEach, describe, expect, it, vi } from "vitest";
import { useAcquisitionStore } from "@/stores/acquisition";
import { MockSensorDevice } from "@/services/acquisition";
afterEach(async () => { await useAcquisitionStore.getState().disconnect(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("Auditoria — concorrência da conexão", () => {
  it("encerra o dispositivo anterior antes de reconectar após uma perda", async () => {
    await useAcquisitionStore.getState().connect();
    const previous = useAcquisitionStore.getState().activeDevice!;
    const closing = vi.spyOn(previous, "disconnect");
    useAcquisitionStore.setState((state) => ({ status: { ...state.status, connected: false } }));
    await useAcquisitionStore.getState().connect({ automatic: true });
    expect(closing).toHaveBeenCalledOnce();
    expect(useAcquisitionStore.getState().activeDevice).not.toBe(previous);
    expect(useAcquisitionStore.getState().isConnecting).toBe(false);
    expect(useAcquisitionStore.getState().status.connected).toBe(true);
  });
  it("duas solicitações compartilham a mesma conexão", async () => {
    let release!: () => void; const gate=new Promise<void>((resolve)=>{release=resolve;});
    const original=MockSensorDevice.prototype.connect;
    const spy=vi.spyOn(MockSensorDevice.prototype,"connect").mockImplementation(async function(this: MockSensorDevice, config) { await gate; await original.call(this,config); });
    const first=useAcquisitionStore.getState().connect(); const second=useAcquisitionStore.getState().connect();
    expect(first).toBe(second); expect(spy).toHaveBeenCalledTimes(1); release(); await first;
    expect(useAcquisitionStore.getState().status.connected).toBe(true);
    await useAcquisitionStore.getState().connect(); expect(spy).toHaveBeenCalledTimes(1);
  });
  it("desconectar durante a conexão não deixa dispositivo órfão", async () => {
    let release!: () => void; const gate=new Promise<void>((resolve)=>{release=resolve;});
    const original=MockSensorDevice.prototype.connect;
    vi.spyOn(MockSensorDevice.prototype,"connect").mockImplementation(async function(this: MockSensorDevice, config) { await gate; await original.call(this,config); });
    const opening=useAcquisitionStore.getState().connect(); const closing=useAcquisitionStore.getState().disconnect(); release(); await Promise.all([opening,closing]);
    expect(useAcquisitionStore.getState().activeDevice).toBeNull(); expect(useAcquisitionStore.getState().status.connected).toBe(false);
  });
});
