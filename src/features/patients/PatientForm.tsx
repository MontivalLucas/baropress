import { useSession } from "@/stores/session";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Patient, PatientInput } from "@/types";
import { formatCpf, formatPhone, validateCpf, cleanDigits } from "./patientUtils";
import { Button } from "@/components/ui/controls";
import { useUnsavedChanges } from "@/components/ui/useUnsavedChanges";
import { requestNavigation } from "@/services/navigationGuard";

interface PatientFormProps {
  initialData?: Patient | null;
  onSave: (data: PatientInput) => Promise<void>;
  onCancel: () => void;
}

export function PatientForm({ initialData, onSave, onCancel }: PatientFormProps) {
  const secretary = useSession(s=>s.user?.role === "assistant");
  const isEditing = Boolean(initialData);

  // Form states
  const [name, setName] = useState(initialData?.name ?? "");
  const [socialName, setSocialName] = useState(initialData?.socialName ?? "");
  const [birthDate, setBirthDate] = useState(initialData?.birthDate ?? "");
  const [sex, setSex] = useState(initialData?.sex ?? "");
  const [cpf, setCpf] = useState(initialData?.cpf ? formatCpf(initialData.cpf) : "");
  const [phone, setPhone] = useState(initialData?.phone ? formatPhone(initialData.phone) : "");
  const [email, setEmail] = useState(initialData?.email ?? "");
  const [profession, setProfession] = useState(initialData?.profession ?? "");
  const [height, setHeight] = useState(initialData?.height ? String(initialData.height > 3 ? initialData.height : initialData.height * 100) : "");
  const [weight, setWeight] = useState(initialData?.weight ? String(initialData.weight) : "");
  const [shoeSize, setShoeSize] = useState(initialData?.shoeSize ? String(initialData.shoeSize) : "");
  const [address, setAddress] = useState(initialData?.address ?? "");
  const [observations, setObservations] = useState(initialData?.observations ?? "");

  // UI states
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const formValue = JSON.stringify([name, socialName, birthDate, sex, cpf, phone, email, profession, height, weight, shoeSize, address, observations]);
  const [initialValue] = useState(formValue);
  useUnsavedChanges(formValue !== initialValue, "O cadastro tem alterações que ainda não foram salvas.", busy);
  const cancel = () => requestNavigation(onCancel);

  // Mask handlers
  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatCpf(e.target.value);
    setCpf(formatted);
    if (fieldErrors.cpf) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy.cpf;
        return copy;
      });
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "O nome completo é obrigatório.";
    } else if (trimmedName.length < 3) {
      errors.name = "O nome deve ter pelo menos 3 caracteres.";
    }

    if (cpf.trim()) {
      const digits = cleanDigits(cpf);
      if (digits.length !== 11) {
        errors.cpf = "O CPF deve conter 11 dígitos numéricos.";
      } else if (!validateCpf(cpf)) {
        errors.cpf = "CPF inválido. Verifique os dígitos digitados.";
      }
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = "Formato de e-mail inválido.";
      }
    }

    if (!secretary && height.trim()) {
      const h = Number.parseFloat(height.replace(",", "."));
      if (Number.isNaN(h) || h <= 0 || h > 280) {
        errors.height = "Informe uma altura válida em centímetros (ex: 175).";
      }
    }

    if (!secretary && weight.trim()) {
      const w = Number.parseFloat(weight.replace(",", "."));
      if (Number.isNaN(w) || w <= 0 || w > 400) {
        errors.weight = "Informe um peso válido em kg (ex: 74.5).";
      }
    }

    if (!secretary && shoeSize.trim()) {
      const s = Number.parseFloat(shoeSize.replace(",", "."));
      if (Number.isNaN(s) || s < 15 || s > 60) {
        errors.shoeSize = "Informe um tamanho de calçado válido (ex: 41).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) {
      return;
    }

    const payload: PatientInput = {
      name: name.trim(),
      socialName: socialName.trim() || null,
      birthDate: birthDate || null,
      sex: sex || null,
      cpf: cleanDigits(cpf) || null,
      phone: phone.trim() || null,
      email: email.trim().toLowerCase() || null,
      profession: profession.trim() || null,
      height: secretary ? initialData?.height ?? null : height.trim() ? Number.parseFloat(height.replace(",", ".")) : null,
      weight: secretary ? initialData?.weight ?? null : weight.trim() ? Number.parseFloat(weight.replace(",", ".")) : null,
      shoeSize: secretary ? initialData?.shoeSize ?? null : shoeSize.trim() ? Number.parseFloat(shoeSize.replace(",", ".")) : null,
      address: address.trim() || null,
      observations: secretary ? initialData?.observations ?? null : observations.trim() || null,
    };

    setBusy(true);
    try {
      await onSave(payload);
    } catch (err) {
      const msg = (err as Error).message ?? "Falha ao salvar paciente.";
      setGeneralError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cancel}
            aria-label="Voltar para a lista"
            className="size-9 rounded-lg border border-line hover:bg-line/40 grid place-items-center text-mute hover:text-ink transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {isEditing ? "Editar Paciente" : "Novo Paciente"}
            </h1>
            <p className="text-sm text-mute">
              {isEditing
                ? "Atualize as informações cadastrais e antropométricas do paciente."
                : "Preencha os dados do paciente para iniciar o prontuário baropodométrico."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={cancel} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={busy}
            className="flex items-center gap-2 shadow-sm"
          >
            <Save size={16} />
            <span>{busy ? "Salvando…" : isEditing ? "Salvar alterações" : "Salvar paciente"}</span>
          </Button>
        </div>
      </div>

      {/* Erro geral (ex: CPF duplicado) */}
      {generalError && (
        <div
          role="alert"
          className="p-4 rounded-card border border-rose-500/30 bg-rose-500/10 flex items-start gap-3 text-rose-500 text-sm"
        >
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium">Erro ao cadastrar paciente</p>
            <p>{generalError}</p>
          </div>
        </div>
      )}

      {/* Formulário com seções claras */}
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Seção 1: Dados Pessoais */}
        <section className="bg-surface border border-line rounded-card p-6 space-y-4">
          <header className="border-b border-line pb-3">
            <h2 className="text-base font-semibold">Dados Pessoais</h2>
            <p className="text-xs text-mute">Identificação básica do paciente no prontuário.</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="patient-name" className="text-sm font-medium">
                Nome completo <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <input
                id="patient-name"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" }));
                }}
                placeholder="Ex: João Silva de Alencar"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "patient-name-err" : undefined}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
              />
              {fieldErrors.name && (
                <p id="patient-name-err" role="alert" className="text-xs text-rose-500 font-medium">
                  {fieldErrors.name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-social-name" className="text-sm font-medium">
                Nome social
              </label>
              <input
                id="patient-social-name"
                type="text"
                value={socialName}
                onChange={(e) => setSocialName(e.target.value)}
                placeholder="Opcional"
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="patient-birth" className="text-sm font-medium">
                  Data de nascimento
                </label>
                <input
                  id="patient-birth"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="patient-sex" className="text-sm font-medium">
                  Sexo biológico
                </label>
                <select
                  id="patient-sex"
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm focus:border-brand transition-colors"
                >
                  <option value="">Selecione…</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="Não informado">Não informado</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Seção 2: Documentos e Contato */}
        <section className="bg-surface border border-line rounded-card p-6 space-y-4">
          <header className="border-b border-line pb-3">
            <h2 className="text-base font-semibold">Documentos e Contato</h2>
            <p className="text-xs text-mute">Dados para comunicação e identificação unívoca.</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="patient-cpf" className="text-sm font-medium">
                CPF
              </label>
              <input
                id="patient-cpf"
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                maxLength={14}
                aria-invalid={Boolean(fieldErrors.cpf)}
                aria-describedby={fieldErrors.cpf ? "patient-cpf-err" : undefined}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors font-mono"
              />
              {fieldErrors.cpf && (
                <p id="patient-cpf-err" role="alert" className="text-xs text-rose-500 font-medium">
                  {fieldErrors.cpf}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-phone" className="text-sm font-medium">
                Telefone
              </label>
              <input
                id="patient-phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-email" className="text-sm font-medium">
                E-mail
              </label>
              <input
                id="patient-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="paciente@exemplo.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "patient-email-err" : undefined}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
              />
              {fieldErrors.email && (
                <p id="patient-email-err" role="alert" className="text-xs text-rose-500 font-medium">
                  {fieldErrors.email}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Seção 3: Informações Antropométricas e Clínicas */}
        {!secretary && <section className="bg-surface border border-line rounded-card p-6 space-y-4">
          <header className="border-b border-line pb-3">
            <h2 className="text-base font-semibold">Informações Antropométricas & Ocupacionais</h2>
            <p className="text-xs text-mute">
              Dados físicos relevantes para a interpretação dos mapas plantares e baropodometria.
            </p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="patient-height" className="text-sm font-medium">
                Altura (cm)
              </label>
              <input
                id="patient-height"
                type="number"
                step="any"
                min="30"
                max="260"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  if (fieldErrors.height) setFieldErrors((p) => ({ ...p, height: "" }));
                }}
                placeholder="Ex: 175"
                aria-invalid={Boolean(fieldErrors.height)}
                aria-describedby={fieldErrors.height ? "patient-height-err" : undefined}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors tabular-nums"
              />
              {fieldErrors.height && (
                <p id="patient-height-err" role="alert" className="text-xs text-rose-500 font-medium">
                  {fieldErrors.height}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-weight" className="text-sm font-medium">
                Peso (kg)
              </label>
              <input
                id="patient-weight"
                type="number"
                step="any"
                min="1"
                max="350"
                value={weight}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (fieldErrors.weight) setFieldErrors((p) => ({ ...p, weight: "" }));
                }}
                placeholder="Ex: 72.5"
                aria-invalid={Boolean(fieldErrors.weight)}
                aria-describedby={fieldErrors.weight ? "patient-weight-err" : undefined}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors tabular-nums"
              />
              {fieldErrors.weight && (
                <p id="patient-weight-err" role="alert" className="text-xs text-rose-500 font-medium">
                  {fieldErrors.weight}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-shoesize" className="text-sm font-medium">
                Tamanho calçado (BR)
              </label>
              <input
                id="patient-shoesize"
                type="number"
                step="any"
                min="15"
                max="55"
                value={shoeSize}
                onChange={(e) => {
                  setShoeSize(e.target.value);
                  if (fieldErrors.shoeSize) setFieldErrors((p) => ({ ...p, shoeSize: "" }));
                }}
                placeholder="Ex: 40"
                aria-invalid={Boolean(fieldErrors.shoeSize)}
                aria-describedby={fieldErrors.shoeSize ? "patient-shoesize-err" : undefined}
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors tabular-nums"
              />
              {fieldErrors.shoeSize && (
                <p id="patient-shoesize-err" role="alert" className="text-xs text-rose-500 font-medium">
                  {fieldErrors.shoeSize}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="patient-profession" className="text-sm font-medium">
                Profissão
              </label>
              <input
                id="patient-profession"
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Ex: Professor"
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
              />
            </div>
          </div>
        </section>}

        {/* Seção 4: Endereço & Observações */}
        <section className="bg-surface border border-line rounded-card p-6 space-y-4">
          <header className="border-b border-line pb-3">
            <h2 className="text-base font-semibold">Endereço & Observações Clínicas</h2>
          </header>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="patient-address" className="text-sm font-medium">
                Endereço completo
              </label>
              <input
                id="patient-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, complemento, bairro, cidade - UF"
                className="w-full h-10 px-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
              />
            </div>

            {!secretary && <div className="space-y-1.5">
              <label htmlFor="patient-obs" className="text-sm font-medium">
                Observações clínicas e queixas relatadas
              </label>
              <textarea
                id="patient-obs"
                rows={4}
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Anotações sobre queixas de dor, calosidades, cirurgias prévias ou objetivos da avaliação baropodométrica…"
                className="w-full p-3 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors resize-y"
              />
            </div>}
          </div>
        </section>

        {/* Rodapé com botões */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={cancel} disabled={busy}>
            Cancelar
          </Button>
          <Button type="submit" disabled={busy} className="flex items-center gap-2 shadow-sm">
            <CheckCircle2 size={16} />
            <span>{busy ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar paciente"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
