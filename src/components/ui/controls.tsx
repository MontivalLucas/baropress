import clsx from "clsx";
import { useId, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";

export function Button({ variant = "primary", className, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button type="button" {...p} className={clsx("h-10 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
      variant === "primary" ? "bg-brand text-brand-fg hover:brightness-110" : "border border-line hover:bg-line/40", className)} />
  );
}

export function Field({ label, error, ...p }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const uniqueId = useId();
  const id = p.id ?? uniqueId;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input id={id} {...p} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : p["aria-describedby"]}
        className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute" />
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  );
}
