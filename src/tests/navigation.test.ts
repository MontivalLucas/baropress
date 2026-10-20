import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelNavigation, confirmNavigation, clearNavigationGuards, registerNavigationGuard, requestNavigation, useNavigationDialog } from "@/services/navigationGuard";
afterEach(clearNavigationGuards);
describe("Proteção do trabalho ao navegar", () => {
  it("não executa saída com alterações e conserva a ação para confirmação", () => {
    registerNavigationGuard(() => ({ message: "Alterações não salvas" }));
    const leave = vi.fn();
    requestNavigation(leave);
    expect(leave).not.toHaveBeenCalled();
    cancelNavigation();
    expect(leave).not.toHaveBeenCalled();
    requestNavigation(leave);
    confirmNavigation();
    expect(leave).toHaveBeenCalledOnce();
  });
  it("prioriza operação em andamento sobre permissão de descarte", () => {
    registerNavigationGuard(() => ({ message: "Rascunho" }));
    registerNavigationGuard(() => ({ message: "Gravação em andamento", blocked: true }));
    requestNavigation(vi.fn());
    expect(useNavigationDialog.getState().issue?.blocked).toBe(true);
  });
  it("impede descarte quando uma gravação inicia depois da abertura do aviso", () => {
    let saving = false;
    registerNavigationGuard(() => saving ? { message: "Salvando", blocked: true } : { message: "Rascunho" });
    const leave = vi.fn();
    requestNavigation(leave);
    saving = true;
    confirmNavigation();
    expect(leave).not.toHaveBeenCalled();
    expect(useNavigationDialog.getState().issue?.blocked).toBe(true);
  });
  it("reavalia dados atuais e distingue navegação de fechamento", () => {
    let dirty = true;
    const stop = registerNavigationGuard(closing => dirty && closing ? { message: "Resultado sem salvar" } : null);
    const leave = vi.fn();
    requestNavigation(leave);
    expect(leave).toHaveBeenCalledOnce();
    requestNavigation(leave, true);
    expect(leave).toHaveBeenCalledOnce();
    dirty = false;
    requestNavigation(leave, true);
    expect(leave).toHaveBeenCalledTimes(2);
    stop();
  });
});
