import { canPage } from "@/features/auth/permissions";
import clsx from "clsx";
import { lazy, Suspense, useEffect, useState } from "react";
import { api } from "@/services/database/api";
import { clearLocalSession } from "@/features/auth/sessionActions";
import { useSession } from "@/stores/session";
import { LoginPage } from "@/features/auth/LoginPage";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/pages/Dashboard";
import { usePreferencesSync } from "@/services/usePreferencesSync";
import { useAutomaticConnection } from "@/services/acquisition/useAutomaticConnection";
import { usePreferencesStore } from "@/stores/preferences";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NavigationProtection } from "@/components/NavigationProtection";
const UsersPage = lazy(() => import("@/features/auth/UsersPage").then(m => ({ default: m.UsersPage })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));
const CalibrationPage = lazy(() => import("@/features/calibration/CalibrationPage").then((m) => ({ default: m.CalibrationPage })));
const PatientsPage = lazy(() => import("@/features/patients/PatientsPage").then((m) => ({ default: m.PatientsPage })));
const BaropodometryPage = lazy(() => import("@/features/baropodometry/BaropodometryPage").then((m) => ({ default: m.BaropodometryPage })));
const ExamsPage = lazy(() => import("@/features/exams/ExamsPage").then((m) => ({ default: m.ExamsPage })));
const NewExamPage = lazy(() => import("@/features/exams/NewExamPage").then((m) => ({ default: m.NewExamPage })));
const ComparisonPage = lazy(() => import("@/features/comparison/ComparisonPage").then((m) => ({ default: m.ComparisonPage })));
const AgendaPage = lazy(() => import("@/features/agenda/AgendaPage").then((m) => ({ default: m.AgendaPage })));
const QuestionnairesPage = lazy(() => import("@/features/questionnaires/QuestionnairesPage").then((m) => ({ default: m.QuestionnairesPage })));
export default function App() {
    const [checkingSession, setCheckingSession] = useState(true);
    useEffect(() => {
        let live = true;
        api.currentUser().then((user) => { if (live) useSession.getState().setUser(user); })
            .catch(() => {}).finally(() => { if (live) setCheckingSession(false); });
        const expired = () => { void clearLocalSession("Sessão encerrada. Entre novamente."); };
        window.addEventListener("auth-expired", expired);
        return () => { live = false; window.removeEventListener("auth-expired", expired); };
    }, []);
    const { user, page, comparisonPatientId } = useSession();
    usePreferencesSync(user?.id);
    useAutomaticConnection(user?.id);
    useEffect(() => {
      if (!user) return;
      const timer=setInterval(() => { void api.currentUser().then(current => { if (!current) void clearLocalSession("Sessão encerrada. Entre novamente."); }).catch(()=>{}); },15000);
      return()=>clearInterval(timer);
    },[user?.id]);
    const preferencesError = usePreferencesStore((s) => s.error);
    if (checkingSession) return <p role="status" className="p-6">Verificando sessão local...</p>;
    if (!user)
        return <LoginPage />;
    if (!canPage(user.role,page)) return <div className="p-6 space-y-3"><p>Seu perfil não tem acesso a esta página.</p><button onClick={()=>useSession.getState().go(user.role==="assistant"?"patients":"dashboard")}>Voltar</button></div>;
    return (<div className="h-full flex overflow-hidden">
      <Sidebar />
      <NavigationProtection />
      <main className={clsx("flex-1 min-h-0 min-w-0", page === "baropodometry" ? "overflow-hidden" : "overflow-auto")}>
        {preferencesError && <p role="alert" className="p-3 text-sm text-danger">Configurações: {preferencesError}</p>}
        <ErrorBoundary key={page}><Suspense fallback={<p role="status" className="p-6 text-mute">Carregando módulo...</p>}>
        {page === "users" && <UsersPage />}
        {page === "settings" && <Settings />}
        {page === "calibration" && <CalibrationPage />}
        {page === "patients" && <PatientsPage />}
        {page === "baropodometry" && <BaropodometryPage />}
        {page === "exams" && <ExamsPage />}
        {page === "new-exam" && <NewExamPage />}
        {page === "comparison" && <ComparisonPage initialPatientId={comparisonPatientId}/>}
        {page === "agenda" && <AgendaPage />}
        {page === "questionnaires" && <QuestionnairesPage />}
        {page !== "users" && page !== "calibration" && page !== "settings" &&
            page !== "patients" &&
            page !== "baropodometry" &&
            page !== "exams" &&
            page !== "new-exam" &&
            page !== "comparison" && page !== "agenda" && page !== "questionnaires" && <Dashboard />}
        </Suspense></ErrorBoundary>
      </main>
    </div>);
}
