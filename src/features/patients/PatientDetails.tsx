import { acquisitionLabel, FOOT_LABELS } from '@/services/examProtocol';
import { isAdmin, isClinical } from "@/features/auth/permissions";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Edit2,
  Archive,
  Calendar,
  Phone,
  Mail,
  User,
  Activity,
  AlertTriangle,
  Scale,
  Ruler,
  Footprints,
  MapPin,
  Briefcase,
  Clock,
  ShieldAlert,
  Eye,
} from "lucide-react";

import type { Patient, PatientExamItem } from "@/types";
import {
  formatCpf,
  formatPhone,
  formatDate,
  formatDateTime,
  calculateAge,
  calculateBmi,
  formatHeight,
} from "./patientUtils";
import { api } from "@/services/database/api";
import { Button } from "@/components/ui/controls";
import { ExamDetailsModal } from "@/features/exams/ExamDetailsModal";
import { useSession } from "@/stores/session";
import { PatientCareHistory } from "./PatientCareHistory";
import { useDialogFocus } from "@/components/ui/useDialogFocus";

interface PatientDetailsProps {
  patientId: number;
  onBack: () => void;
  onEdit: (id: number) => void;
  onArchived: () => void;
}

export function PatientDetails({ patientId, onBack, onEdit, onArchived }: PatientDetailsProps) {
  const role = useSession(s=>s.user?.role);
  const openComparison = useSession((s) => s.openComparison);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [exams, setExams] = useState<PatientExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);


  // Archive modal state
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  useDialogFocus(confirmArchive,()=>setConfirmArchive(false),archiving);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([api.patients.get(patientId), api.patients.examHistory(patientId)])
      .then(([pData, eData]) => {
        if (!active) return;
        setPatient(pData);
        setExams(eData);
      })
      .catch((err) => {
        if (!active) return;
        setError((err as Error).message ?? "Falha ao carregar prontuário.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patientId]);

  async function handleArchiveConfirm() {
    setArchiving(true);
    setArchiveError(null);
    try {
      await api.patients.archive(patientId);
      setConfirmArchive(false);
      onArchived();
    } catch (err) {
      setArchiveError((err as Error).message ?? "Falha ao arquivar paciente.");
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-9 w-32 bg-line/60 rounded-lg" />
          <div className="h-9 w-40 bg-line/60 rounded-lg" />
        </div>
        <div className="h-32 bg-surface border border-line rounded-card" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-surface border border-line rounded-card" />
          <div className="h-64 bg-surface border border-line rounded-card md:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-xl mx-auto p-8 bg-surface border border-line rounded-card text-center space-y-4">
        <div className="size-12 mx-auto rounded-full bg-rose-500/10 text-rose-500 grid place-items-center">
          <AlertTriangle size={24} />
        </div>
        <h2 className="text-lg font-semibold">Não foi possível carregar o prontuário</h2>
        <p className="text-sm text-mute">{error ?? "Paciente não encontrado no banco de dados."}</p>
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 mx-auto">
          <ArrowLeft size={16} />
          <span>Voltar para a lista</span>
        </Button>
      </div>
    );
  }

  const age = calculateAge(patient.birthDate);
  const bmiInfo = calculateBmi(patient.weight, patient.height);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Barra de navegação e ações superiores */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors w-fit"
        >
          <ArrowLeft size={16} />
          <span>Voltar para lista de pacientes</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => onEdit(patient.id)}
            className="flex items-center gap-1.5"
          >
            <Edit2 size={15} />
            <span>Editar cadastro</span>
          </Button>

          {isAdmin(role) && <Button
            variant="ghost"
            onClick={() => setConfirmArchive(true)}
            className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30"
          >
            <Archive size={15} />
            <span>Arquivar paciente</span>
          </Button>}
        </div>
      </div>

      {/* Cartão de Identificação Principal */}
      <section className="bg-surface border border-line rounded-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-brand/10 text-brand font-bold text-2xl grid place-items-center shrink-0 border border-brand/20">
            {patient.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-ink">{patient.name}</h1>
              {patient.sex && (
                <span className="px-2 py-0.5 rounded text-xs bg-line/60 text-ink font-medium">
                  {patient.sex === "M"
                    ? "Masculino"
                    : patient.sex === "F"
                    ? "Feminino"
                    : patient.sex}
                </span>
              )}
              {age !== null && (
                <span className="px-2 py-0.5 rounded text-xs bg-line/60 text-ink font-medium">
                  {age} anos
                </span>
              )}
            </div>

            {patient.socialName && (
              <p className="text-sm text-mute">Nome social: {patient.socialName}</p>
            )}

            <p className="text-xs text-mute flex items-center gap-1">
              <Clock size={12} />
              <span>Cadastrado em {formatDateTime(patient.createdAt)}</span>
            </p>
          </div>
        </div>

        {/* Resumo Antropométrico Rápido */}
        <div className="flex items-center gap-4 bg-line/20 p-3 rounded-lg border border-line/50 text-center">
          <div className="px-3">
            <span className="text-xs text-mute block">Altura</span>
            <span className="font-semibold text-sm">
              {formatHeight(patient.height)}
            </span>
          </div>
          <div className="w-px h-8 bg-line" />
          <div className="px-3">
            <span className="text-xs text-mute block">Peso</span>
            <span className="font-semibold text-sm">
              {patient.weight ? `${patient.weight} kg` : "—"}
            </span>
          </div>
          <div className="w-px h-8 bg-line" />
          <div className="px-3">
            <span className="text-xs text-mute block">IMC</span>
            <span className="font-semibold text-sm">
              {bmiInfo ? `${bmiInfo.value}` : "—"}
            </span>
          </div>
        </div>
      </section>

      {/* Grid de Informações Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Dados Pessoais & Antropometria */}
        <div className="space-y-6 md:col-span-1">
          {/* Dados Pessoais & Contato */}
          <section className="bg-surface border border-line rounded-card p-5 space-y-4">
            <h2 className="text-sm font-semibold border-b border-line pb-2 flex items-center gap-2">
              <User size={16} className="text-brand" />
              <span>Contato & Documentos</span>
            </h2>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-mute">CPF</dt>
                <dd className="font-mono mt-0.5 text-ink">
                  {patient.cpf ? formatCpf(patient.cpf) : <span className="text-mute/60">Não informado</span>}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-mute">Telefone</dt>
                <dd className="mt-0.5 text-ink flex items-center gap-1.5 font-mono">
                  <Phone size={13} className="text-mute/60" />
                  {patient.phone ? formatPhone(patient.phone) : <span className="text-mute/60 font-sans">Não informado</span>}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-mute">E-mail</dt>
                <dd className="mt-0.5 text-ink flex items-center gap-1.5 break-all">
                  <Mail size={13} className="text-mute/60 shrink-0" />
                  {patient.email ?? <span className="text-mute/60">Não informado</span>}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-mute">Data de nascimento</dt>
                <dd className="mt-0.5 text-ink flex items-center gap-1.5">
                  <Calendar size={13} className="text-mute/60" />
                  {patient.birthDate ? (
                    <span>
                      {formatDate(patient.birthDate)} {age !== null ? `(${age} anos)` : ""}
                    </span>
                  ) : (
                    <span className="text-mute/60">Não informada</span>
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-mute">Profissão</dt>
                <dd className="mt-0.5 text-ink flex items-center gap-1.5">
                  <Briefcase size={13} className="text-mute/60" />
                  {patient.profession ?? <span className="text-mute/60">Não informada</span>}
                </dd>
              </div>
            </dl>
          </section>

          {/* Dados Antropométricos */}
          <section className="bg-surface border border-line rounded-card p-5 space-y-4">
            <h2 className="text-sm font-semibold border-b border-line pb-2 flex items-center gap-2">
              <Scale size={16} className="text-brand" />
              <span>Avaliação Antropométrica</span>
            </h2>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-xs text-mute flex items-center gap-1.5">
                  <Ruler size={14} />
                  <span>Altura</span>
                </dt>
                <dd className="font-semibold text-ink">
                  {formatHeight(patient.height)}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-xs text-mute flex items-center gap-1.5">
                  <Scale size={14} />
                  <span>Peso</span>
                </dt>
                <dd className="font-semibold text-ink">
                  {patient.weight ? `${patient.weight} kg` : "—"}
                </dd>
              </div>

              <div className="flex items-center justify-between">
                <dt className="text-xs text-mute flex items-center gap-1.5">
                  <Footprints size={14} />
                  <span>Calçado (BR)</span>
                </dt>
                <dd className="font-semibold text-ink">
                  {patient.shoeSize ? `${patient.shoeSize}` : "—"}
                </dd>
              </div>

              {bmiInfo && (
                <div className="pt-2 border-t border-line">
                  <dt className="text-xs text-mute">Índice de Massa Corporal (IMC)</dt>
                  <dd className="mt-1 flex items-center justify-between">
                    <span className="font-bold text-base tabular-nums">{bmiInfo.value} kg/m²</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${bmiInfo.badgeColor}`}
                    >
                      {bmiInfo.label}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        {/* Coluna 2: Endereço, Observações & Histórico de Exames */}
        <div className="space-y-6 md:col-span-2">
          {/* Endereço & Observações */}
          <section className="bg-surface border border-line rounded-card p-5 space-y-4">
            <h2 className="text-sm font-semibold border-b border-line pb-2 flex items-center gap-2">
              <MapPin size={16} className="text-brand" />
              <span>Endereço & Anotações Clínicas</span>
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-mute block">Endereço</span>
                <p className="mt-0.5 text-ink">
                  {patient.address || <span className="text-mute/60">Nenhum endereço informado.</span>}
                </p>
              </div>

              <div className="pt-2 border-t border-line/60">
                <span className="text-xs text-mute block">Observações do prontuário</span>
                <p className="mt-0.5 text-ink whitespace-pre-line text-sm">
                  {patient.observations || (
                    <span className="text-mute/60">Nenhuma observação clínica registrada.</span>
                  )}
                </p>
              </div>
            </div>
          </section>

          {isClinical(role) && <PatientCareHistory patientId={patientId} />}
          {/* Histórico de Exames */}
          <section className="bg-surface border border-line rounded-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Activity size={18} className="text-brand" />
                <span>Histórico de Exames</span>
              </h2>
              {isClinical(role) && <Button variant="ghost" disabled={exams.filter((e) => e.status === "completed").length < 2} onClick={() => openComparison(patientId)}>Comparar e ver evolução</Button>}
              <span className="text-xs text-mute">
                {exams.length} exame{exams.length !== 1 ? "s" : ""}
              </span>
            </div>

            {exams.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-surface/50 border border-dashed border-line rounded-lg">
                <div className="size-10 mx-auto rounded-full bg-line/50 text-mute grid place-items-center">
                  <Activity size={20} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Nenhum exame realizado para este paciente.</p>
                  <p className="text-xs text-mute max-w-sm mx-auto">
                    Os exames estáticos e dinâmicos realizados com a matriz de pressão 15×15 ficarão registrados neste histórico.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" aria-label="Histórico de exames do paciente">
                  <thead>
                    <tr className="border-b border-line text-xs font-medium text-mute uppercase">
                      <th className="py-2.5 px-3">Data</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Origem</th>
                      <th className="py-2.5 px-3">Pressão Máx.</th>
                      <th className="py-2.5 px-3">Área</th>
                      <th className="py-2.5 px-3">Duração</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-line/20">
                        <td className="py-3 px-3 whitespace-nowrap font-medium">
                          {formatDateTime(exam.startedAt)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap capitalize">
                          {exam.type === "static" ? "Estático" : "Dinâmico"}<div title={acquisitionLabel(exam.acquisition)} className="text-xs normal-case">{exam.acquisition ? FOOT_LABELS[exam.acquisition.foot] + (exam.acquisition.totalStages === 2 ? ' · etapa ' + exam.acquisition.stage + '/2' : '') : 'Modalidade não registrada'}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              exam.source === "REAL"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                            }`}
                          >
                            {exam.source}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap tabular-nums text-mute">
                          {exam.maxPressure !== null && exam.maxPressure !== undefined ? (
                            <span>{Math.round(exam.maxPressure)} ADC</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap tabular-nums text-mute">
                          {exam.contactAreaPercent !== null && exam.contactAreaPercent !== undefined ? (
                            <span>{exam.contactAreaPercent.toFixed(1)}%</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap tabular-nums text-mute">
                          {exam.duration ? `${exam.duration.toFixed(1)} s` : "—"}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedExamId(exam.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand/10 hover:bg-brand/20 text-brand border border-brand/20 inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} />
                            <span>Visualizar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Modal de confirmação de arquivamento */}
      {confirmArchive && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="archive-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4"
        >
          <div className="w-full max-w-md bg-surface border border-line rounded-card p-6 space-y-4 shadow-xl">
            <div className="size-12 rounded-full bg-rose-500/10 text-rose-500 grid place-items-center">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1">
              <h3 id="archive-title" className="text-lg font-semibold">
                Arquivar paciente?
              </h3>
              <p className="text-sm text-mute">
                O paciente <strong className="text-ink">{patient.name}</strong> não aparecerá mais na lista principal, mas todo o seu histórico de exames e dados serão preservados no banco de dados.
              </p>
            </div>

            {archiveError && (
              <p role="alert" className="text-sm text-rose-500 font-medium">
                {archiveError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setConfirmArchive(false)}
                disabled={archiving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleArchiveConfirm}
                disabled={archiving}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {archiving ? "Arquivando…" : "Arquivar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Exame */}
      {selectedExamId !== null && (
        <ExamDetailsModal
          examId={selectedExamId}
          onClose={() => setSelectedExamId(null)}
        />
      )}
    </div>
  );
}
