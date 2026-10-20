import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/services/database/api";
import { useSession } from "@/stores/session";
import { Button, Field } from "@/components/ui/controls";
import { Logo } from "@/components/ui/Logo";
import { PasswordField } from "./PasswordField";
import { RecoveryReceipt } from "./RecoveryReceipt";
import { PASSWORD_HELP, passwordError } from "./authValidation";
import type { Registration } from "@/types";
export function LoginPage() {
  const setUser = useSession((s) => s.setUser); const notice = useSession((s) => s.notice);
  const [firstRun, setFirstRun] = useState<boolean | null>(null);
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirmation, setConfirmation] = useState(""); const [code, setCode] = useState(""); const [ra, setRa] = useState("");
  const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [registration, setRegistration] = useState<Registration | null>(null);
  const [retry, setRetry] = useState(0); const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  useEffect(() => { let live = true; setFirstRun(null); setError(""); api.hasUsers().then((h) => { if (live) { setFirstRun(!h); setMode(h ? "login" : "register"); } }).catch((e) => { if (live) setError(e.message); }); return () => { live = false; }; }, [retry]);
  function switchMode(next: typeof mode) { setMode(next); setError(""); setMessage(""); setPassword(""); setConfirmation(""); setCode(""); setRa(""); setUseRecoveryCode(false); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy || firstRun === null) return; setError(""); setMessage("");
    if (mode !== "login") { const err = passwordError(password, confirmation); if (err) return setError(err); }
    setBusy(true);
    try {
      if (mode === "register") {
        if (!firstRun) { setMessage("Solicite uma conta ao administrador. Ele pode cadastrar usuários em Usuários."); return; }
        setRegistration(await api.register(name, email, password, ra));
      } else if (mode === "recover") {
        await api.recover(email, useRecoveryCode ? null : ra, password, useRecoveryCode ? code : null); switchMode("login"); setMessage("Senha redefinida. Entre com a nova senha.");
      } else setUser(await api.login(email, password));
      setPassword(""); setConfirmation(""); setCode("");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="min-h-full grid place-items-center p-4 sm:p-6 overflow-auto"><section className="w-full max-w-md space-y-5 bg-surface border border-line rounded-card p-6 sm:p-8">
    <div className="flex items-center gap-3"><Logo/><span className="text-xl font-semibold tracking-tight">BAROPRESS</span></div>
    {registration ? <RecoveryReceipt code={registration.recoveryCode} onDone={() => { setUser(registration.user); setRegistration(null); }}/> : <>
      <h1 className="text-lg font-semibold">{mode === "register" ? firstRun ? "Cadastre-se no primeiro acesso" : "Criar conta" : mode === "recover" ? "Recuperar acesso" : "Entrar"}</h1>
      <p className="text-sm text-mute">{mode === "recover" ? useRecoveryCode ? "Informe seu e-mail e o código pessoal ou temporário para definir uma nova senha." : "Informe seu e-mail e o RA cadastrado pelo administrador para definir uma nova senha." : firstRun ? "Primeiro acesso neste computador: crie sua conta. O primeiro cadastro será Administrador, com acesso completo ao programa e ao gerenciamento de usuários." : "Use o e-mail e a senha da sua conta local."}</p>
      {notice && <p role="status" className="text-sm text-ok break-words">{notice}</p>}{message && <p role="status" className="text-sm text-ok">{message}</p>}{error && <p role="alert" className="text-sm text-danger break-words">{error}</p>}
      {firstRun === null ? <><p role="status" className="text-sm text-mute">{error ? "Não foi possível verificar as contas locais." : "Verificando contas..."}</p>{error && <Button onClick={() => setRetry(retry + 1)}>Tentar novamente</Button>}</> : mode === "register" && !firstRun ? <><p className="text-sm">O cadastro de usuários é feito pelo administrador em Usuários &gt; Criar usuário.</p><Button onClick={() => switchMode("login")}>Voltar para entrar</Button></> : <form onSubmit={submit} className="space-y-4">
      {mode === "register" && <Field label="Nome" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={120} required disabled={busy}/>}
      <Field label="E-mail" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required disabled={busy}/>
      {mode === "recover" && useRecoveryCode && <Field label="Código de recuperação" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" maxLength={100} required disabled={busy}/>}
      {(mode === "register" || (mode === "recover" && !useRecoveryCode)) && <Field label="RA" value={ra} onChange={e=>setRa(e.target.value)} inputMode="numeric" pattern="[0-9]{1,32}" maxLength={32} required disabled={busy}/>}
      {mode === "register" && firstRun && <p className="text-xs text-mute">Escolha ou informe um RA numérico para identificar sua conta e recuperar o acesso. Preserve os zeros iniciais e guarde esse número.</p>}
      <PasswordField label={mode === "recover" ? "Nova senha" : "Senha"} value={password} onChange={setPassword} autoComplete={mode === "login" ? "current-password" : "new-password"} disabled={busy}/>
      {mode !== "login" && <><PasswordField label="Confirmar senha" value={confirmation} onChange={setConfirmation} disabled={busy}/><p className="text-xs text-mute">{PASSWORD_HELP}</p></>}
      {mode === "recover" && <div className="space-y-2"><p className="text-xs text-mute">{useRecoveryCode ? "O código funciona uma única vez. Códigos temporários gerados pelo administrador expiram em 30 minutos." : "Use o RA exatamente como foi cadastrado, incluindo zeros iniciais. Se sua conta ainda não tem RA, solicite ao administrador completar o cadastro ou use seu código de recuperação."}</p><label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={useRecoveryCode} disabled={busy} onChange={e=>{setUseRecoveryCode(e.target.checked);setRa("");setCode("");setError("");}}/>Usar código pessoal ou temporário de recuperação</label></div>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Aguarde..." : mode === "register" ? firstRun ? "Cadastrar e entrar como administrador" : "Criar conta" : mode === "recover" ? "Redefinir senha" : "Entrar"}</Button>
      </form>}
      {firstRun !== null && <div className="flex flex-wrap gap-3 text-sm">{mode !== "login" && !firstRun && <button type="button" disabled={busy} className="text-brand underline disabled:opacity-50" onClick={() => switchMode("login")}>Voltar para entrar</button>}{mode === "login" && <><button type="button" disabled={busy} className="text-brand underline" onClick={() => switchMode("register")}>Como obter acesso</button><button type="button" disabled={busy} className="text-brand underline" onClick={() => switchMode("recover")}>Esqueci minha senha?</button></>}</div>}
    </>}
  </section></main>;
}

