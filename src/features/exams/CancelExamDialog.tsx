import React from "react";
import { AlertTriangle } from "lucide-react";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

interface CancelExamDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const CancelExamDialog: React.FC<CancelExamDialogProps> = ({
  isOpen,
  onConfirm,
  onClose,
}) => {
  useDialogFocus(isOpen,onClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-labelledby="cancel-exam-title" tabIndex={-1} className="w-full max-w-md rounded-2xl bg-surface border border-line p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 text-amber-500">
          <div className="size-10 rounded-xl bg-amber-500/10 grid place-items-center">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 id="cancel-exam-title" className="font-semibold text-foreground text-base">Cancelar exame?</h3>
            <p className="text-xs text-mute mt-0.5">
              Os dados de todas as etapas ainda não salvas serão descartados.
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">
          Nenhum registro parcial será gravado no banco de dados. Deseja realmente interromper o exame em andamento?
        </p>

        <div className="flex justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-surface-hover text-foreground transition-colors"
          >
            Continuar exame
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
          >
            Cancelar exame
          </button>
        </div>
      </div>
    </div>
  );
};
