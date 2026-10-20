import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

export function HelpBubble({ label, text }: { label: string; text: string }) {
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const visible = open || hover;
  useEffect(() => {
    if (!visible) return;
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) { setOpen(false); setHover(false); } };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); setHover(false); } };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
  }, [visible]);
  return <span ref={root} className="inline-flex" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
    <button type="button" aria-label={`Ajuda: ${label}`} aria-expanded={visible} aria-controls={visible ? id : undefined}
      onClick={() => { setHover(false); setOpen(!open); }} onBlur={event => { if (!root.current?.contains(event.relatedTarget as Node)) setOpen(false); }}
      className="rounded-full p-1 text-brand hover:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      <HelpCircle size={16} aria-hidden="true" />
    </button>
    {visible && <span id={id} role="tooltip" className="absolute left-0 top-full z-40 mt-1 block w-full min-w-[180px] max-w-sm rounded-xl border border-brand/30 bg-surface p-3 text-sm font-normal text-foreground shadow-xl">
      <strong className="block mb-1 text-brand">{label}</strong>{text}
    </span>}
  </span>;
}

export function CalibrationField({ label, help, children }: { label: string; help?: string; children: ReactNode }) {
  const id = useId();
  const control = isValidElement<{ id?: string; required?: boolean }>(children) ? children : null;
  const controlId = control?.props.id ?? id;
  return <div className="text-sm space-y-1 min-w-0">
    <div className="relative flex items-center gap-1 min-h-7">
      <label htmlFor={controlId} className="text-mute">{label}{control?.props.required && <span className="ml-1 text-brand" aria-label="obrigatório">*</span>}</label>
      {help && <HelpBubble label={label} text={help} />}
    </div>
    {control ? cloneElement(control, { id: controlId }) : children}
  </div>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="space-y-3 border-t border-line pt-4">
    <div><h3 className="font-semibold">{title}</h3>{description && <p className="text-sm text-mute mt-1">{description}</p>}</div>
    {children}
  </section>;
}
