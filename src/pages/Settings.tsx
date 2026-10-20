import { isAdmin, isClinical, canSettings } from "@/features/auth/permissions";
import { lazy, Suspense, useState } from "react";
import clsx from "clsx";
import { useSession } from "@/stores/session";
import { usePreferencesStore } from "@/stores/preferences";
import { Button } from "@/components/ui/controls";
import { ArduinoSettings } from "@/features/acquisition/ArduinoSettings";
import { saveCurrentPreferences } from "@/services/usePreferencesSync";
import { api } from "@/services/database/api";
import { AccountSettings } from "@/features/auth/AccountSettings";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";

const BackupPage = lazy(() => import("@/features/backup/BackupPage").then((m) => ({ default: m.BackupPage })));
const LogsPage = lazy(() => import("@/features/logs/LogsPage").then((m) => ({ default: m.LogsPage })));

export function Settings() {
  const { dark, toggleTheme, settingsTab, setSettingsTab } = useSession();
  const role = useSession(s=>s.user?.role);
  const prefs = usePreferencesStore();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  useUnsavedChanges(false, "", busy);
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <header><h1 className="text-2xl font-semibold">Configurações</h1><p className="text-sm text-mute">Preferências da aplicação e segurança da sua conta.</p></header>
      {prefs.error && <p role="alert" className="text-danger">{prefs.error}</p>}
      {message && <p role="status" className="text-ok">{message}</p>}
      <div role="tablist" aria-label="Áreas de configuração" className="flex flex-wrap gap-2 border-b border-line pb-3">
        {([["general", "Preferências"], ["arduino", "Arduino"], ["backup", "Backup"], ["logs", "Logs"]] as const).filter(([id])=>canSettings(role,id)).map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`settings-tab-${id}`} aria-controls={`settings-panel-${id}`} aria-selected={settingsTab === id}
            disabled={backupBusy || busy} onClick={() => { setMessage(""); setSettingsTab(id); }} className={clsx("px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50", settingsTab === id ? "bg-brand text-brand-fg" : "text-mute hover:bg-surface-hover")}>{label}</button>
        ))}
      </div>
      {settingsTab === "arduino" && (
        <div role="tabpanel" id="settings-panel-arduino" aria-labelledby="settings-tab-arduino"><ArduinoSettings /></div>
      )}
      {settingsTab === "general" && (
        <div role="tabpanel" id="settings-panel-general" aria-labelledby="settings-tab-general" className="space-y-5 max-w-5xl">
            <section className="bg-surface border border-line rounded-xl p-4 space-y-3">
              <h2 className="font-semibold">{isClinical(role) ? "Preferências e exame" : "Aparência"}</h2>
              <div className="flex justify-between items-center"><span>Tema {dark ? "escuro" : "claro"}</span><Button variant="ghost" onClick={toggleTheme}>Alternar tema</Button></div>
              {isClinical(role) && <label className="text-sm">Duração padrão do exame <select className="bg-surface border border-line rounded-lg p-2" value={prefs.durationSeconds} onChange={event => prefs.setDuration(Number(event.target.value))}><option value={30}>30 segundos</option><option value={45}>45 segundos</option></select></label>}
              {isClinical(role) && <p className="text-xs text-mute">A duração é aplicada aos próximos exames.</p>}
            </section>
          <details className="border border-line rounded-xl p-4"><summary className="cursor-pointer font-semibold">Minha conta e segurança</summary><div className="mt-4"><AccountSettings /></div></details>
        </div>
      )}
      <Suspense fallback={<p role="status" className="text-mute">Carregando módulo...</p>}>
        {settingsTab === "backup" && <div role="tabpanel" id="settings-panel-backup" aria-labelledby="settings-tab-backup"><BackupPage onBusyChange={setBackupBusy} /></div>}
        {settingsTab === "logs" && <div role="tabpanel" id="settings-panel-logs" aria-labelledby="settings-tab-logs"><LogsPage /></div>}
      </Suspense>
      {(settingsTab === "general" || settingsTab === "arduino") && <Button disabled={busy} onClick={async () => {
        setBusy(true); setMessage("");
        try {
          await saveCurrentPreferences();
          if (isAdmin(role)) await api.logs.add("settings", "Configurações salvas.");
          setMessage("Configurações salvas no banco local.");
        } catch (error) { usePreferencesStore.setState({ error: (error as Error).message }); }
        finally { setBusy(false); }
      }}>{busy ? "Salvando..." : "Salvar configurações agora"}</Button>}
    </div>
  );
}
