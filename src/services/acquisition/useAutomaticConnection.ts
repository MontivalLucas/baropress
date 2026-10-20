import { useEffect } from "react";
import { isTauri } from "@/services/database/api";
import { usePreferencesStore } from "@/stores/preferences";
import { useSession } from "@/stores/session";
import { startAutomaticConnection } from "./automaticConnection";

export function useAutomaticConnection(userId: number | undefined) {
  const role = useSession(s => s.user?.role);
  const hydrated = usePreferencesStore((state) => state.hydrated);
  const paused = usePreferencesStore((state) => state.paused);
  useEffect(() => {
    if (!userId || role === "assistant" || !hydrated || paused || !isTauri()) return;
    return startAutomaticConnection(() => {
      const prefs = usePreferencesStore.getState();
      return prefs.hydrated && !prefs.paused && useSession.getState().user?.id === userId;
    });
  }, [userId, role, hydrated, paused]);
}
