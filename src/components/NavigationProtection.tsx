import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "@/services/database/api";
import { cancelNavigation, confirmNavigation, navigationIssue, registerNavigationGuard, requestNavigation, useNavigationDialog } from "@/services/navigationGuard";
import { useNewExamStore } from "@/features/exams/examStore";
import { useDialogFocus } from "./ui/useDialogFocus";
import { Button } from "./ui/controls";
import { useCalibrationStore } from "@/stores/calibration";

export function NavigationProtection() {
  const { issue } = useNavigationDialog();
  const dialog = useRef<HTMLElement>(null);
  const allowedClose = useRef(false);
  useDialogFocus(!!issue, cancelNavigation, false, dialog);
  useEffect(() => registerNavigationGuard(closing => {
    if (useCalibrationStore.getState().busy) return { blocked: true, message: "Conclua ou interrompa o ensaio de calibração antes de sair." };
    const exam = useNewExamStore.getState();
    if (exam.isSaving || exam.isStarting) return { blocked: true, message: "Aguarde a operação do exame terminar." };
    if (exam.step === "PREPARING" || exam.step === "ACQUIRING") return { message: "Sair agora interrompe a coleta. Será necessário repetir o exame." };
    if (exam.step === "NEXT_FOOT") return { message: "A primeira etapa ainda não foi salva. Sair mantém a sequência pendente; fechar o programa descarta os dados." };
    if (closing && exam.step === "RESULT") return { message: "O resultado do exame ainda não foi salvo. Fechar o programa descarta essa amostra." };
    return null;
  }), []);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!allowedClose.current && navigationIssue(true)) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("beforeunload", beforeUnload);
    let live = true;
    let unlisten: (() => void) | undefined;
    if (isTauri()) void getCurrentWindow().onCloseRequested(event => {
      if (!navigationIssue(true)) return;
      event.preventDefault();
      requestNavigation(() => {
        allowedClose.current = true;
        void getCurrentWindow().destroy().catch(() => {
          allowedClose.current = false;
          useNavigationDialog.setState({ issue: { blocked: true, message: "Não foi possível fechar a janela. Tente novamente pelo botão de fechar." }, action: null });
        });
      }, true);
    }).then(stop => { if (live) unlisten = stop; else stop(); }).catch(() => {});
    return () => { live = false; unlisten?.(); window.removeEventListener("beforeunload", beforeUnload); };
  }, []);
  if (!issue) return null;
  return <div className="fixed inset-0 z-[100] bg-black/60 grid place-items-center p-4">
    <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="navigation-title" className="bg-surface border border-line rounded-xl p-5 max-w-md w-full space-y-4">
      <h2 id="navigation-title" className="font-semibold text-lg">{issue.blocked ? "Operação em andamento" : "Continuar sem salvar?"}</h2>
      <p className="text-sm">{issue.message}</p>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={cancelNavigation}>{issue.blocked ? "Entendi" : "Continuar nesta tela"}</Button>
        {!issue.blocked && <Button onClick={confirmNavigation}>Descartar e continuar</Button>}
      </div>
    </section>
  </div>;
}
