import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke }));
import { api, clearDatabaseCache } from "@/services/database/api";

describe("Cache das consultas entre abas", () => {
  it("mantém listas após salvar preferências e força leitura ao atualizar", async () => {
    invoke.mockResolvedValue([]);
    await api.patients.list();
    await api.settings.save({} as import("@/types").AppPreferences);
    await api.patients.list();
    expect(invoke.mock.calls.filter(([cmd]) => cmd === "patients_list")).toHaveLength(1);
    clearDatabaseCache();
    await api.patients.list();
    expect(invoke.mock.calls.filter(([cmd]) => cmd === "patients_list")).toHaveLength(2);
  });
  beforeEach(() => {
    clearDatabaseCache();
    invoke.mockReset();
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {}, dispatchEvent: vi.fn() });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it("reutiliza consultas simultâneas e devolve cópias independentes", async () => {
    invoke.mockResolvedValue([{ id: 1, name: "Teste" }]);
    const [first, second] = await Promise.all([api.patients.list(), api.patients.list()]);
    first[0].name = "Alterado";
    expect(second[0].name).toBe("Teste");
    expect((await api.patients.list())[0].name).toBe("Teste");
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it("separa filtros e renova consultas após um minuto", async () => {
    vi.useFakeTimers();
    invoke.mockResolvedValue([]);
    await api.patients.list("Ana");
    await api.patients.list("Bia");
    await api.patients.list("Ana");
    expect(invoke).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(60_001);
    await api.patients.list("Ana");
    expect(invoke).toHaveBeenCalledTimes(3);
  });

  it("invalida dados após alteração e troca de sessão", async () => {
    invoke.mockResolvedValue([]);
    await api.patients.list();
    await api.patients.archive(1);
    await api.patients.list();
    await api.logout();
    await api.patients.list();
    expect(invoke.mock.calls.filter(([cmd]) => cmd === "patients_list")).toHaveLength(3);
  });

  it("permite tentar novamente quando a consulta falha", async () => {
    invoke.mockImplementation(async (cmd) => {
      if (cmd === "patients_list") throw "Falha temporária";
    });
    await expect(api.patients.list()).rejects.toThrow("Falha temporária");
    invoke.mockResolvedValue([]);
    await expect(api.patients.list()).resolves.toEqual([]);
  });

  it("não repõe cache com resposta antiga recebida após uma escrita", async () => {
    let finish!: (value: unknown) => void;
    invoke.mockImplementation((cmd) => cmd === "patients_list"
      ? new Promise((resolve) => { finish = resolve; }) : Promise.resolve());
    const oldRead = api.patients.list();
    await api.patients.archive(1);
    finish([{ id: 1 }]);
    await oldRead;
    invoke.mockResolvedValue([]);
    await expect(api.patients.list()).resolves.toEqual([]);
    expect(invoke.mock.calls.filter(([cmd]) => cmd === "patients_list")).toHaveLength(2);
  });
});
