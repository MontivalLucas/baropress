import { api, clearDatabaseCache } from "@/services/database/api";
import { useCalibrationStore } from "@/stores/calibration";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useSession } from "@/stores/session";
import { useNewExamStore } from "@/features/exams/examStore";
import { saveCurrentPreferences, waitForPreferencesWrites } from "@/services/usePreferencesSync";
import { usePreferencesStore } from "@/stores/preferences";
import { clearNavigationGuards } from "@/services/navigationGuard";
export async function clearLocalSession(notice?: string) {
  clearNavigationGuards();
  clearDatabaseCache();
  await useAcquisitionStore.getState().disconnect();
  if (useNewExamStore.getState().isSaving) {
    await new Promise<void>((resolve) => {
      const stop = useNewExamStore.subscribe((state) => { if (!state.isSaving) { stop(); resolve(); } });
    });
  }
  useNewExamStore.getState().resetExam();
  useSession.getState().setNotice(notice ?? null);
  useSession.getState().setUser(null);
}
export async function logout() {
  if (useNewExamStore.getState().isSaving || useNewExamStore.getState().isStarting) throw new Error("Aguarde a operação do exame terminar para sair.");
  usePreferencesStore.setState({ paused: true });
  try {
    if (useCalibrationStore.getState().busy) await useCalibrationStore.getState().finish("Coleta interrompida ao sair da sessão");
    if (usePreferencesStore.getState().hydrated) await saveCurrentPreferences();
    else await waitForPreferencesWrites();
    await api.logout();
    await clearLocalSession();
  } finally { usePreferencesStore.setState({ paused: false }); }
}
