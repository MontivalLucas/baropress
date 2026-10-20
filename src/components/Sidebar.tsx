import { canPage } from "@/features/auth/permissions";
import clsx from "clsx";
import { Activity, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Moon, Settings, Sliders, Stethoscope, Sun, Users } from "lucide-react";
import { useSession } from "@/stores/session";
import { Logo } from "./ui/Logo";
import type { Page } from "@/types";
import { useState } from "react";
import { logout } from "@/features/auth/sessionActions";
import { requestNavigation } from "@/services/navigationGuard";

/** `phase` = fase em que a página é entregue. Itens futuros ficam desabilitados e rotulados (sem botões falsos). */
export const items: { id: Page; label: string; icon: typeof Users; phase: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, phase: 1 },
  { id: "patients", label: "Pacientes", icon: Users, phase: 2 },
  { id: "calibration", label: "Testes e calibração", icon: Sliders, phase: 11 },
  { id: "baropodometry", label: "Análise", icon: Activity, phase: 4 },
  { id: "agenda", label: "Agenda", icon: CalendarDays, phase: 8 },
  { id: "exams", label: "Histórico de Exames", icon: Activity, phase: 5 },
  { id: "new-exam", label: "Novo exame", icon: Stethoscope, phase: 5 },
  { id: "comparison", label: "Comparação", icon: Activity, phase: 7 },
  { id: "questionnaires", label: "Questionários", icon: ClipboardList, phase: 9 },
  { id: "users", label: "Usuários", icon: Users, phase: 1 },
  { id: "settings", label: "Configurações", icon: Settings, phase: 1 },
];
const CURRENT_PHASE = 11;



export function Sidebar() {
  const { page, go, user, dark, toggleTheme } = useSession();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <aside className="w-60 shrink-0 border-r border-line bg-surface flex flex-col p-3">
      <div className="flex items-center gap-2.5 px-3 py-4"><Logo size={24} /><span className="font-semibold tracking-tight">BAROPRESS</span></div>
      <nav aria-label="Principal" className="flex-1 space-y-0.5 overflow-y-auto">
        {items.filter(item => canPage(user?.role,item.id)).map(({ id, label, icon: Icon, phase }) => {
          const off = phase > CURRENT_PHASE;
          return (
            <button key={id} disabled={off} onClick={() => go(id)} aria-current={page === id ? "page" : undefined}
              className={clsx("w-full h-10 px-3 rounded-lg flex items-center gap-3 text-sm text-left transition-colors",
                page === id ? "bg-brand/10 text-brand font-medium" : "hover:bg-line/50", off && "opacity-45 cursor-not-allowed hover:bg-transparent")}>
              <Icon size={18} /><span className="flex-1">{label}</span>
              {off && <span className="text-xs text-mute">Fase {phase}</span>}
            </button>
          );
        })}
      </nav>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="border-t border-line pt-3 mt-2 flex items-center gap-2 px-1">
        <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{user?.name}</p><p className="text-xs text-mute truncate">{user?.email}</p></div>
        <button onClick={toggleTheme} aria-label={dark ? "Tema claro" : "Tema escuro"} title="Alternar tema" className="size-9 grid place-items-center rounded-lg hover:bg-line/50">{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button disabled={leaving} onClick={() => requestNavigation(async () => { setLeaving(true); setError(""); try { await logout(); } catch (e) { setError((e as Error).message); } finally { setLeaving(false); } })} aria-label="Sair" title="Sair" className="size-9 grid place-items-center rounded-lg hover:bg-line/50"><LogOut size={17} /></button>
      </div>
    </aside>
  );
}
