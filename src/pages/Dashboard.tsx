import { isAdmin } from "@/features/auth/permissions";
import { useShallow } from "zustand/react/shallow";
import { useEffect, useState } from "react";
import { Sliders, Stethoscope } from "lucide-react";
import { api } from "@/services/database/api";
import type { DashboardStats } from "@/types";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useSession } from "@/stores/session";
import { formatDateTime } from "@/features/patients/patientUtils";

export function Dashboard() {
  const { connected, acquiring, fps, deviceType, isConnecting, autoConnectionMessage } = useAcquisitionStore(useShallow(s => ({ connected: s.status.connected, acquiring: s.status.acquiring, fps: s.status.fps, deviceType: s.deviceType, isConnecting: s.isConnecting, autoConnectionMessage: s.autoConnectionMessage })));
  const admin = useSession(s=>isAdmin(s.user?.role));
  const go = useSession((state) => state.go);
  const [s, setS] = useState<DashboardStats | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.stats().then(setS).catch((e) => setErr(e.message)); }, []);
  const cards = [
    ["Pacientes cadastrados", s?.patients], ["Exames realizados", s?.exams], ["Consultas hoje", s?.appointmentsToday],
    ["Último exame", s ? (s.lastExamAt ? formatDateTime(s.lastExamAt) : "Nenhum ainda") : undefined],
  ] as const;
  return (
    <div className="p-8 max-w-5xl space-y-6">
      <header><h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1><p className="text-sm text-mute">Visão geral do consultório.</p></header>
      <section aria-labelledby="access-title" className="space-y-3">
        <h2 id="access-title" className="text-lg font-semibold">Escolha o que deseja acessar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <button type="button" onClick={() => go("new-exam")}
            className="bg-surface border border-line rounded-card p-5 text-left transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <span className="flex items-center gap-3 font-semibold"><Stethoscope size={22} aria-hidden="true" />Novo exame</span>
            <span className="block mt-2 text-sm text-mute">Selecione o paciente e prepare uma nova avaliação.</span>
            <span className="block mt-4 text-sm font-medium text-brand">Preparar novo exame →</span>
          </button>
          {admin && <button type="button" onClick={() => go("calibration")}
            className="bg-surface border border-brand/40 rounded-card p-5 text-left transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
            <span className="flex items-center gap-3 font-semibold"><Sliders size={22} aria-hidden="true" />Testes e calibração</span>
            <span className="block mt-2 text-sm text-mute">Cadastre o tapete, registre ensaios com pesos reais e acompanhe as curvas e a validação.</span>
            <span className="block mt-4 text-sm font-medium text-brand">Acessar testes e calibração →</span>
          </button>}
        </div>
      </section>
      {err && <p role="alert" className="text-sm text-danger">{err}</p>}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Indicadores">
        {cards.map(([label, v]) => (
          <div key={label} className="bg-surface border border-line rounded-card p-5">
            <p className="text-sm text-mute">{label}</p>
            {v === undefined ? <div className="mt-2 h-7 w-16 rounded bg-line animate-pulse" /> : <p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p>}
          </div>
        ))}
      </section>
      <section className="bg-surface border border-line rounded-card p-5">
        <h2 className="font-medium">Plataforma</h2>
        <p className="text-sm text-mute mt-1">{isConnecting ? 'Conectando ao Arduino...' : connected ? `${deviceType==='MOCK'?'Simulação':'ESP32'} conectado · ${acquiring?'Aquisição ativa':'Aquisição pausada'} · ${fps.toFixed(1)} FPS` : autoConnectionMessage || 'Dispositivo desconectado. Configure o Arduino ou a simulação em Configurações.'}</p>
        {admin && <button type="button" onClick={() => useSession.getState().openArduinoSettings()} className="mt-3 text-sm text-brand underline">Configurar Arduino</button>}
      </section>
    </div>
  );
}
