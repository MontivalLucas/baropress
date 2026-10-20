import { useState } from "react";
import { Field } from "@/components/ui/controls";
export function PasswordField({ label, value, onChange, autoComplete = "new-password", disabled = false }: { label: string; value: string; onChange: (value: string) => void; autoComplete?: string; disabled?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <div className="space-y-1"><Field label={label} type={visible ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} maxLength={512} required disabled={disabled}/><button type="button" disabled={disabled} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible} className="text-xs text-brand underline" onClick={() => setVisible(!visible)}>{visible ? "Ocultar" : "Mostrar"} senha</button></div>;
}

