import { useState } from "react";
import { api } from "@/services/database/api";
import type { Profile, Trial } from "@/services/calibration/types";
import { CalibrationField, HelpBubble } from "./CalibrationHelp";

export const purposeLabel = (purpose: string) => ({ FIT: "Ajuste", VALIDATION: "Validação independente", CHARACTERIZATION: "Caracterização" }[purpose] ?? purpose);
const inputClass = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm";
const buttonClass = "rounded-lg bg-brand text-brand-fg px-3 py-2 text-sm disabled:opacity-40";

export function ClassificationCorrection({ trials, profiles, selected, disabled, onCorrected }: {
  trials: Trial[]; profiles: Profile[]; selected: string[]; disabled: boolean;
  onCorrected: (ids: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const candidates = profiles.filter(p => p.state === "ADJUSTED" && !p.active);
  const records = trials.filter(t => selected.includes(t.id));
  const eligible = records.length === selected.length && records.length > 0 && records.length <= 100
    && records.every(t => t.spec.purpose === "FIT" && ["REVIEW", "ACCEPTED"].includes(t.state));
  return <div className="border border-line rounded-lg p-3 space-y-3">
    <div className="flex flex-wrap items-center gap-3">
      <span>{selected.length} ensaios selecionados</span>
      <button type="button" className={buttonClass} disabled={disabled || busy || !selected.length}
        onClick={() => { setOpen(!open); setError(""); setConfirmed(false); if (!profileId) setProfileId(candidates[0]?.id ?? ""); }}>
        Corrigir conjunto dos selecionados
      </button>
    </div>
    {open && <form className="space-y-3" onSubmit={async e => {
      e.preventDefault(); if (busy || disabled || !eligible || !confirmed || !profileId) return;
      setBusy(true); setError("");
      try {
        const corrected = await api.calibration.reclassify([...selected], profileId, reason);
        await onCorrected(corrected.map(t => t.id));
        setOpen(false); setReason(""); setConfirmed(false);
      } catch (failure) { setError((failure as Error).message); }
      finally { setBusy(false); }
    }}>
      <h3 className="font-semibold">Corrigir Ajuste → Validação independente</h3>
      <p className="text-sm text-mute">Use para coletas de validação registradas com o conjunto errado. Só permite coletas locais posteriores à curva, ainda não utilizadas em ajuste ou validação. Selecione todas as repetições de cada grupo. Leituras, massas, unidades, grupos e estado de revisão são preservados.</p>
      <fieldset disabled={busy || disabled} className="space-y-3">
        <CalibrationField label="Perfil candidato a validar" help="Escolha a curva que estas coletas independentes devem conferir. Apenas candidatos ainda não ativos aparecem aqui; as coletas devem ter sido feitas depois de gerar essa curva.">
          <select className={inputClass} required value={profileId} onChange={e => { setProfileId(e.target.value); setConfirmed(false); }}>
            <option value="">Selecione</option>{candidates.map(p => <option key={p.id} value={p.id}>{p.name} · {p.source}</option>)}
          </select>
        </CalibrationField>
        <div className="max-h-48 overflow-auto text-sm"><ul className="list-disc pl-5">
          {records.map(t => <li key={t.id}>{t.spec.group} · repetição {t.spec.repetition} · {purposeLabel(t.spec.purpose)} · {t.state}</li>)}
        </ul></div>
        {!eligible && <p className="text-danger text-sm">Selecione apenas ensaios de Ajuste em REVIEW ou ACCEPTED (até 100).</p>}
        <CalibrationField label="Motivo da correção" help="Explique por que o conjunto foi registrado errado e qual era a finalidade original das coletas. O motivo fica no histórico de auditoria; os valores brutos não são alterados.">
          <textarea required maxLength={2000} rows={3} className={inputClass} value={reason}
            onChange={e => setReason(e.target.value)} placeholder="Coletas destinadas à validação, realizadas após gerar a curva; conjunto Ajuste mantido por engano." />
        </CalibrationField>
        <div className="relative flex items-start gap-2"><label className="flex gap-2 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
          Confirmo que estas coletas foram destinadas à validação e não influenciaram a escolha ou o ajuste da curva.
        </label><HelpBubble label="Independência das coletas" text="Confirme somente se essas coletas eram de validação desde o início e não foram usadas para escolher ou ajustar a curva. A correção não transforma dados de ajuste em evidência independente." /></div>
        <button type="submit" className={buttonClass} disabled={!eligible || !confirmed || !profileId || !reason.trim()}>
          {busy ? "Salvando correção..." : "Salvar correção para validação"}
        </button>
      </fieldset>
      {error && <p role="alert" className="text-danger text-sm">{error}</p>}
    </form>}
  </div>;
}

export function CorrectionHistory({ trial }: { trial: Trial }) {
  const h = trial.spec.classificationCorrection;
  if (!h) return null;
  return <div className="border border-line rounded-lg p-3 text-sm space-y-1">
    <h3 className="font-semibold">Histórico de correção do conjunto</h3>
    <p>{purposeLabel(h.fromPurpose)} → {purposeLabel(h.toPurpose)} · {new Date(h.createdAt).toLocaleString("pt-BR")}</p>
    <p>Responsável: usuário #{h.operatorId} · perfil: {h.profileId}</p>
    <p>Motivo: {h.reason}</p>
  </div>;
}
