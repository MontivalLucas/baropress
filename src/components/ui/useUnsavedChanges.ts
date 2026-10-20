import { useEffect, useRef } from "react";
import { registerNavigationGuard } from "@/services/navigationGuard";

export function useUnsavedChanges(dirty: boolean, message: string, busy = false) {
  const state = useRef({ dirty, message, busy });
  state.current = { dirty, message, busy };
  useEffect(() => registerNavigationGuard(() => {
    const current = state.current;
    if (current.busy) return { message: "Aguarde a operação terminar antes de sair.", blocked: true };
    return current.dirty ? { message: current.message } : null;
  }), []);
}
