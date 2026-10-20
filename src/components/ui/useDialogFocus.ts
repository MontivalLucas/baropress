import { useEffect, useRef, type RefObject } from 'react';
const dialogStack: HTMLElement[] = [];
export function useDialogFocus(open: boolean, onClose: () => void, disabled = false, target?: RefObject<HTMLElement>) {
    const close = useRef(onClose);
    const busy = useRef(disabled);
    close.current = onClose;
    busy.current = disabled;
    useEffect(() => {
        if (!open)
            return;
        const dialogs = document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]');
        const dialog = target?.current ?? dialogs[dialogs.length - 1];
        if (!dialog)
            return;
        dialogStack.push(dialog);
        const previous = document.activeElement as HTMLElement | null;
        const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter((e) => e.offsetParent !== null);
        (controls()[0] ?? dialog).focus();
        const keydown = (event: KeyboardEvent) => {
            if (dialogStack[dialogStack.length - 1] !== dialog) return;
            if (event.key === 'Escape' && !busy.current) {
                event.preventDefault();
                close.current();
            }
            if (event.key === 'Tab') {
                const list = controls();
                if (!list.length) {
                    event.preventDefault();
                    dialog.focus();
                    return;
                }
                const first = list[0], last = list[list.length - 1];
                if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', keydown);
        return () => {
            const index = dialogStack.lastIndexOf(dialog);
            if (index >= 0) dialogStack.splice(index, 1);
            document.removeEventListener('keydown', keydown);
            if (previous?.isConnected)
                previous.focus();
        };
    }, [open]);
}
