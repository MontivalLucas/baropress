import { useShallow } from "zustand/react/shallow";
import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Cpu,
  Footprints,
  Play,
  RotateCcw,
  Save,
  Search,
  Stethoscope,
  User,
  Users,
} from "lucide-react";
import clsx from "clsx";
import { BaropodometricHeatmap } from "@/features/baropodometry/BaropodometricHeatmap";
import { PressureLegend } from "@/features/baropodometry/PressureLegend";
import { api } from "@/services/database/api";

import { useAcquisitionStore } from "@/stores/acquisition";
import { useSession } from "@/stores/session";
import { calculateAge, formatCpf } from "@/features/patients/patientUtils";
import type { PatientSummary } from "@/types";
import { CancelExamDialog } from "./CancelExamDialog";
import { ExamDetailsModal } from "./ExamDetailsModal";
import { useNewExamStore } from "./examStore";
import { startExamRuntime } from "./examRuntime";
import { ExamSettingsTab } from "./ExamSettingsTab";
import { ExamVisualizationControls } from "./ExamVisualizationControls";
import { calculateMetrics } from "@/services/baropodometry";
import { formatClock } from "@/services/preferences";

import { usePagedSearch } from "@/components/ui/usePagedSearch";
import { ExamConditionsForm,ExamEventRecorder } from './ExamConditionsForm';
import { AnalysisReview } from './AnalysisReview';
import { temporalPoints, temporalGapLimit } from '@/services/examAnalysis/calculations';
import { FOOT_LABELS, type ExamFoot } from "@/services/examProtocol";
const EMPTY_DISPLAY_VALUES = new Array(225).fill(0);

export const NewExamPage: React.FC = () => {
  const { go } = useSession();
  const examStore = useNewExamStore();
  const liveFrame = examStore.step === "PREPARING" || examStore.step === "ACQUIRING";
  const acqStore = useAcquisitionStore(useShallow(s => ({
    deviceType: s.deviceType, connected: s.status.connected, transport: s.status.transport,
    fps: liveFrame ? s.status.fps : 0, isZeroing: s.tareState.isZeroing,
    displayValues: liveFrame ? s.displayValues : EMPTY_DISPLAY_VALUES,
  })));

  const { search, setSearch, query } = usePagedSearch();
  const [patientsList, setPatientsList] = useState<PatientSummary[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientsError, setPatientsError] = useState("");
  const [patientsRevision, setPatientsRevision] = useState(0);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [confirmTab, setConfirmTab] = useState<"patient" | "settings">("patient");

  // Carrega pacientes ao abrir ou ao pesquisar
  useEffect(() => {
    let active = true;
    setLoadingPatients(true);
    setPatientsError("");
    api.patients
      .list(query, { limit: 50, offset: 0 })
      .then((data) => {
        if (active) setPatientsList(data);
      })
      .catch((e) => { if (active) { setPatientsError(e.message || "Falha ao carregar pacientes."); setPatientsList([]); } })
      .finally(() => {
        if (active) setLoadingPatients(false);
      });

    return () => {
      active = false;
    };
  }, [query, patientsRevision]);

  useEffect(() => startExamRuntime(), []);

  const isMock = acqStore.deviceType === "MOCK" || acqStore.transport === "MOCK";

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-6xl mx-auto space-y-4">
      {patientsError && <div role="alert" className="text-sm text-danger">{patientsError} <button type="button" className="underline" onClick={() => setPatientsRevision((r) => r + 1)}>Recarregar pacientes</button></div>}
      {/* Barra de Título / Navegação */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (examStore.isSaving) return;
              if (examStore.step === "ACQUIRING" || examStore.step === "PREPARING" || examStore.isStarting) {
                examStore.openCancelModal();
              } else {
                go("exams");
              }
            }}
            className="size-8 rounded-lg grid place-items-center hover:bg-line/50 text-mute hover:text-foreground transition-colors"
            title="Voltar para Histórico de Exames"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Stethoscope size={22} className="text-brand" />
              <span>Novo Exame Baropodométrico</span>
            </h1>
            <p className="text-xs text-mute mt-0.5">
              Protocolo de avaliação estática da distribuição de pressão plantar
            </p>
          </div>
        </div>

        {/* Indicador de Origem (REAL / SIMULAÇÃO) */}
        <div className="flex items-center gap-2 text-xs">
          {isMock ? (
            <span className="px-2.5 py-1 rounded-full font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center gap-1.5 shadow-xs">
              <AlertTriangle size={13} />
              <span>SIMULAÇÃO ATIVA</span>
            </span>
          ) : acqStore.connected ? (
            <span className="px-2.5 py-1 rounded-full font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 size={13} />
              <span>ESP32 CONECTADO</span>
            </span>
          ) : <span className="text-mute">Dispositivo desconectado</span>}
        </div>
      </div>

      {/* Erro Global se houver */}
      <ExamEventRecorder/>
      {examStore.error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <span>{examStore.error}</span>
          <button
            type="button"
            disabled={examStore.isSaving || examStore.isStarting}
            onClick={() => {
              if (examStore.step === "RESULT") void examStore.saveExam().catch(() => {});
              else if (examStore.selectedPatient) void examStore.startPreview().catch(() => {});
            }}
            className="text-xs underline hover:opacity-80"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ETAPA 1: SELEÇÃO DO PACIENTE */}
      {examStore.step === "SELECT_PATIENT" && (
        <div className="flex-1 flex flex-col space-y-4 max-w-2xl mx-auto w-full pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-foreground">
              Passo 1: Selecione o Paciente
            </h2>
            <p className="text-xs text-mute">
              Todo exame baropodométrico deve estar estritamente vinculado a um paciente cadastrado.
            </p>
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute size-4" />
            <input
              type="text"
              placeholder="Pesquisar por nome ou CPF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-line text-sm text-foreground focus:outline-none focus:border-brand shadow-xs"
              autoFocus
            />
          </div>

          <p className="text-xs text-mute">Até 50 resultados. Refine a busca por nome ou CPF para localizar o paciente.</p>
          {/* Lista de Resultados */}
          <div className="flex-1 min-h-[320px] max-h-[440px] overflow-y-auto space-y-2 pr-1">
            {loadingPatients ? (
              <div className="py-16 text-center text-xs text-mute">Carregando pacientes...</div>
            ) : patientsList.length === 0 ? (
              <div className="py-16 text-center space-y-2 border border-dashed border-line rounded-xl">
                <Users className="mx-auto size-8 text-mute/50" />
                <p className="text-xs text-mute">Nenhum paciente encontrado com o termo informado.</p>
              </div>
            ) : (
              patientsList.map((p) => {
                const age = calculateAge(p.birthDate);
                return (
                  <div
                    key={p.id}
                    onClick={() => examStore.selectPatient(p)}
                    className="p-3.5 rounded-xl border border-line bg-surface hover:bg-surface-hover hover:border-brand/50 transition-all cursor-pointer flex items-center justify-between group shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground group-hover:text-brand transition-colors">
                          {p.name}
                        </span>
                        {age !== null && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-line/60 text-mute">
                            {age} anos
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-mute flex items-center gap-3">
                        <span>CPF: {p.cpf ? formatCpf(p.cpf) : "Não informado"}</span>
                        {p.phone && <span>Tel: {p.phone}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand text-brand-fg group-hover:opacity-100 opacity-90 transition-opacity"
                    >
                      Selecionar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ETAPA 2: CONFIRMAÇÃO DO PACIENTE E PARÂMETROS */}
      {examStore.step === "CONFIRM" && examStore.selectedPatient && (
        <div className="flex-1 flex flex-col items-center max-w-4xl mx-auto w-full space-y-5">
          <div className="w-full bg-surface border border-line rounded-2xl p-6 shadow-md space-y-5">
            <div role="tablist" aria-label="Preparação do exame" className="flex gap-2 border-b border-line pb-3">
              {([['patient', 'Paciente e protocolo'], ['settings', 'Configurações do exame']] as const).map(([id, label]) => (
                <button key={id} type="button" role="tab" id={`exam-tab-${id}`} aria-controls={`exam-panel-${id}`} aria-selected={confirmTab === id}
                  onClick={() => setConfirmTab(id)} className={clsx("px-4 py-2 rounded-xl text-sm font-semibold", confirmTab === id ? "bg-brand text-brand-fg" : "text-mute hover:bg-surface-hover")}>
                  {label}
                </button>
              ))}
            </div>
            {confirmTab === "settings" ? (
              <div role="tabpanel" id="exam-panel-settings" aria-labelledby="exam-tab-settings"><ExamSettingsTab onDone={() => setConfirmTab("patient")} /></div>
            ) : (
            <div role="tabpanel" id="exam-panel-patient" aria-labelledby="exam-tab-patient" className="space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-xl bg-brand/10 text-brand grid place-items-center">
                  <User size={22} />
                </div>
                <div>
                  <span className="text-xs text-mute block uppercase tracking-wider">Paciente Selecionado</span>
                  <h2 className="text-lg font-bold text-foreground">
                    {examStore.selectedPatient.name}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                disabled={examStore.isStarting}
                onClick={examStore.clearPatient}
                className="text-xs text-mute hover:text-foreground underline"
              >
                Trocar paciente
              </button>
            </div>

            {/* Informações Antropométricas */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-surface-hover p-3 rounded-xl border border-line">
              <div>
                <span className="text-mute block">CPF:</span>
                <span className="font-semibold text-foreground">
                  {examStore.selectedPatient.cpf ? formatCpf(examStore.selectedPatient.cpf) : "—"}
                </span>
              </div>
              <div>
                <span className="text-mute block">Idade:</span>
                <span className="font-semibold text-foreground">
                  {calculateAge(examStore.selectedPatient.birthDate) !== null
                    ? `${calculateAge(examStore.selectedPatient.birthDate)} anos`
                    : "—"}
                </span>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Modalidade de aquisição</legend>
              <div className="flex flex-wrap gap-2">
                {(['both', 'left', 'right'] as ExamFoot[]).map(foot => (
                  <button type="button" key={foot} disabled={examStore.isStarting} aria-pressed={examStore.foot === foot}
                    onClick={() => examStore.setModality(foot)}
                    className={clsx('px-3 py-2 rounded-lg border text-sm', examStore.foot === foot ? 'bg-brand text-brand-fg border-brand' : 'border-line')}>
                    {foot === 'both' ? 'Ambos os pés juntos' : `Começar pelo ${FOOT_LABELS[foot].toLowerCase()}`}
                  </button>
                ))}
              </div>
              {examStore.foot !== 'both' && <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={examStore.isStarting} checked={!examStore.separateFeet} onChange={event => examStore.setModality(examStore.foot, !event.target.checked)}/>
                Coletar somente este pé
              </label>}
              <p className="text-xs text-mute">{examStore.separateFeet ? 'Um pé de cada vez. As duas coletas serão reunidas no mesmo exame.' : examStore.foot === 'both' ? 'Coleta simultânea dos dois pés.' : 'Uma coleta do pé selecionado.'}</p>
            </fieldset>
            {/* Configuração do Exame */}
            <ExamConditionsForm />
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-mute">Tipo de Exame:</span>
                <span className="font-bold text-foreground">Exame Estático (15×15)</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-mute">Dispositivo de Aquisição:</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu size={14} className={isMock ? "text-purple-400" : "text-emerald-400"} />
                  {isMock ? "Simulador de Sensores (Mock)" : "ESP32 Hardware Serial"}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-mute">Duração de cada aquisição:</span>
                <div className="flex items-center gap-1.5">
                  {[30, 45].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => examStore.setDurationSeconds(sec)}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors",
                        examStore.durationSeconds === sec
                          ? "bg-brand text-brand-fg border-brand"
                          : "bg-surface border-line text-mute hover:text-foreground"
                      )}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button type="button" onClick={() => setConfirmTab("settings")} className="text-sm text-brand underline">
              Regular Gamma, VMAX e visualização antes do exame
            </button>
            </div>
            )}

            {/* Ações */}
            <div className="sticky bottom-0 z-10 bg-surface flex items-center justify-end gap-3 py-3 border-t border-line">
              <button
                type="button"
                disabled={examStore.isStarting}
                onClick={examStore.clearPatient}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-line bg-surface hover:bg-surface-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={examStore.isStarting || acqStore.isZeroing}
                onClick={examStore.startPreparation}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-brand text-brand-fg hover:opacity-90 flex items-center gap-2 shadow-xs transition-opacity"
              >
                <Play size={16} />
                <span>{examStore.isStarting ? "Conectando dispositivo..." : "Iniciar Exame"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {examStore.step === 'NEXT_FOOT' && (
        <section className="p-6 bg-surface border border-line rounded-xl space-y-4">
          <p role="status" className="text-sm text-mute">{FOOT_LABELS[examStore.foot === 'left' ? 'right' : 'left']}: aquisição concluída.</p>
          <h2 className="text-lg font-bold">Troque para o {FOOT_LABELS[examStore.foot].toLowerCase()}</h2>
          <p className="text-sm text-mute">A primeira coleta está guardada. Posicione o outro pé e inicie quando estiver pronto.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={examStore.isStarting} onClick={examStore.startPreparation} className="px-4 py-2 bg-brand text-brand-fg rounded-lg disabled:opacity-50">
              {examStore.isStarting ? 'Conectando...' : `Iniciar ${FOOT_LABELS[examStore.foot].toLowerCase()}`}
            </button>
            <button type="button" disabled={examStore.isStarting} onClick={examStore.openCancelModal} className="px-4 py-2 text-rose-400">Descartar exame</button>
          </div>
        </section>
      )}
      {['PREPARING', 'ACQUIRING', 'RESULT'].includes(examStore.step) && <p className="text-sm font-semibold">{FOOT_LABELS[examStore.foot]}{examStore.separateFeet ? ' · etapa ' + (examStore.completedStages.length + 1) + '/2' : ''} · {examStore.durationSeconds} segundos</p>}
      {/* ETAPA 3: PREPARAÇÃO DO EXAME (ESTABILIZAÇÃO) */}
      {examStore.step === "PREPARING" && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">
          <div className="w-full bg-surface border border-line rounded-2xl p-6 shadow-xl text-center space-y-5">
            <div className="size-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 grid place-items-center animate-pulse">
              <Footprints size={28} />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-foreground">
                PREPARAÇÃO DO EXAME
              </h2>
              <p className="text-xs text-mute">
                Posicione o paciente confortavelmente sobre a plataforma.
              </p>
            </div>

            {/* Diretrizes Neutras / Sem Diagnóstico */}
            <div className="text-left text-xs bg-surface-hover p-4 rounded-xl border border-line space-y-2 text-foreground/90">
              <p className="font-semibold text-foreground">Orientações ao paciente:</p>
              <ul className="space-y-1 list-disc pl-4 text-mute">
                <li>{examStore.foot === 'both' ? 'Posicione os dois pés sobre o tapete' : `Posicione somente o ${FOOT_LABELS[examStore.foot].toLowerCase()} sobre o tapete`}</li>
                <li>Siga a postura e o apoio definidos para este exame</li>
                <li>Mantenha os pés relaxados e olhos na linha do horizonte</li>
                <li>Evite movimentações desnecessárias</li>
                <li>Distribua o peso confortavelmente</li>
              </ul>
            </div>

            {/* Barra de Progresso da Estabilização */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs text-mute">
                <span>Aguardando estabilização postural...</span>
                <span className="font-mono font-bold text-foreground">{examStore.countdown}s</span>
              </div>
              <div className="w-full h-3 rounded-full bg-line overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((examStore.prepSeconds - examStore.countdown) / examStore.prepSeconds) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={examStore.openCancelModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-mute hover:text-foreground border border-line"
              >
                Cancelar Exame
              </button>
              <button
                type="button"
                disabled={examStore.isStarting}
                onClick={examStore.startAcquisition}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-brand text-brand-fg hover:opacity-90 flex items-center gap-1.5"
              >
                <Play size={14} />
                <span>Pular e Iniciar Agora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 4: AQUISIÇÃO ATIVA */}
      {examStore.step === "ACQUIRING" && examStore.selectedPatient && (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Coluna Esquerda: Mapa em Tempo Real (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between gap-2 bg-black/20 p-3 rounded-2xl border border-line">
            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="font-bold text-foreground uppercase tracking-wider">
                  Aquisição Estática em Andamento · trajeto em ciano
                </span>
              </div>
              <span className="text-mute font-mono">
                {acqStore.fps.toFixed(1)} FPS
              </span>
            </div>

            <div className="aspect-square w-full max-h-[380px] mx-auto flex items-center justify-center">
              <BaropodometricHeatmap
                values={acqStore.displayValues}
                config={examStore.settings}
                cop={calculateMetrics(acqStore.displayValues, examStore.settings.threshold).cop}
                trajectory={examStore.liveTrajectory}
                className="w-full h-full"
              />
            </div>

            <PressureLegend vmax={examStore.settings.vmax} />
          </div>

          {/* Coluna Direita: HUD da Aquisição e Controles (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between gap-3 bg-surface p-5 rounded-2xl border border-line">
            <div className="space-y-4">
              {/* Paciente */}
              <div>
                <span className="text-xs text-mute block uppercase">Paciente</span>
                <h3 className="font-bold text-base text-foreground">
                  {examStore.selectedPatient.name}
                </h3>
              </div>

              {/* Temporizador da Janela de Aquisição */}
              <div className="p-4 rounded-xl bg-surface-hover border border-line space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-mute flex items-center gap-1.5">
                    <Clock size={16} /> Tempo de Coleta
                  </span>
                  <span className="font-mono font-bold text-lg text-brand tabular-nums">
                    {formatClock(examStore.countdown)} / {formatClock(examStore.durationSeconds)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-brand transition-all duration-1000 ease-linear"
                    style={{
                      width: `${((examStore.durationSeconds - examStore.countdown) / examStore.durationSeconds) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Indicadores de Amostragem */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-line/20 border border-line/60">
                  <span className="text-xs text-mute block">Quadros Coletados</span>
                  <span className="text-lg font-bold text-foreground tabular-nums font-mono">
                    {examStore.framesCollected.length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-line/20 border border-line/60">
                  <span className="text-xs text-mute block">Frequência (FPS)</span>
                  <span className="text-lg font-bold text-foreground tabular-nums font-mono">
                    {acqStore.fps.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Informação do Dispositivo */}
              <div className="p-3 rounded-xl bg-surface border border-line text-xs space-y-1">
                <span className="text-mute block">Hardware:</span>
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu size={14} className={isMock ? "text-purple-400" : "text-emerald-400"} />
                  {isMock ? "Simulador ESP32 (Mock 15×15)" : "ESP32 Conectado (115200 baud)"}
                </span>
                {isMock && (
                  <p className="text-[11px] text-purple-400 font-semibold pt-1">
                    ⚠ Modo de simulação para validação funcional.
                  </p>
                )}
              </div>
            </div>

            {/* Botão de Cancelamento Seguro */}
            <div className="pt-2 border-t border-line">
              <button
                type="button"
                onClick={examStore.openCancelModal}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-rose-500 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors"
              >
                Cancelar Exame (Descartar Coleta)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 5: RESULTADO DO EXAME (PRONTO PARA SALVAR) */}
      {examStore.step === "RESULT" && examStore.processedResult && (
        <><ExamVisualizationControls values={examStore.processedResult.averageMatrix} result />
        <AnalysisReview exam={{id:0,matrix:examStore.processedResult.averageMatrix,analysis:examStore.processedResult.examInput.analysis,threshold:examStore.processedResult.examInput.threshold,vmax:examStore.settings.vmax,gamma:examStore.settings.gamma}} initialFrames={examStore.rawFrames} onRevision={revision=>{const state=useNewExamStore.getState();if(state.processedResult?.examInput.analysis){const result={...state.processedResult,examInput:{...state.processedResult.examInput,analysis:{...state.processedResult.examInput.analysis,regions:[...state.processedResult.examInput.analysis.regions,revision]}}};useNewExamStore.setState({processedResult:result});}}}/></>
      )}
      {examStore.step === "RESULT" && examStore.processedResult && examStore.selectedPatient && (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
          {/* Coluna Esquerda: Mapa Médio Processado (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between gap-2 bg-black/20 p-3 rounded-2xl border border-line">
            <div className="flex items-center justify-between text-xs px-2">
              <span className="font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Mapa médio · {FOOT_LABELS[examStore.foot].toLowerCase()}
              </span>
              <span className="text-xs text-mute font-mono">
                {examStore.processedResult.examInput.frameCount} quadros processados
              </span>
            </div>

            <div className="aspect-square w-full max-h-[380px] mx-auto flex items-center justify-center">
              <BaropodometricHeatmap
                values={examStore.processedResult.averageMatrix}
                config={examStore.settings}
                cop={examStore.processedResult.metrics.cop}
                trajectory={examStore.liveTrajectory}
                className="w-full h-full"
              />
            </div>

            <PressureLegend vmax={examStore.settings.vmax} />
          </div>

          {/* Coluna Direita: Métricas Quantitativas e Botão Salvar (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between gap-3 bg-surface p-4 md:p-5 rounded-2xl border border-line overflow-y-auto">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-mute block uppercase">Paciente</span>
                  <h3 className="font-bold text-base text-foreground">
                    {examStore.selectedPatient.name}
                  </h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                  Resultado Pronto
                </span>
              </div>

              {/* Métricas Principais */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-surface-hover border border-line">
                  <span className="text-xs text-mute block">Leitura Máxima</span>
                  <div className="text-lg font-bold text-foreground tabular-nums">
                    {Math.round(examStore.processedResult.metrics.maxPressure)}
                    <span className="text-[11px] font-normal text-mute ml-1">ADC</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-hover border border-line">
                  <span className="text-xs text-mute block">Leitura Média</span>
                  <div className="text-lg font-bold text-foreground tabular-nums">
                    {Math.round(examStore.processedResult.metrics.meanPressure ?? 0)}
                    <span className="text-[11px] font-normal text-mute ml-1">ADC</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-hover border border-line">
                  <span className="text-xs text-mute block">Centro relativo (ADC)</span>
                  <div className="text-sm font-bold text-foreground tabular-nums">
                    {examStore.processedResult.metrics.cop ? (
                      <>
                        X: {examStore.processedResult.metrics.cop.x.toFixed(1)} | Y: {examStore.processedResult.metrics.cop.y.toFixed(1)}
                      </>
                    ) : (
                      "Sem contato"
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-hover border border-line">
                  <span className="text-xs text-mute block">Sensores em contato</span>
                  <div className="text-sm font-bold text-foreground tabular-nums">
                    {examStore.processedResult.metrics.contactPercentage.toFixed(1)}%
                    <span className="text-[11px] font-normal text-mute ml-1">
                      ({examStore.processedResult.metrics.contactSensorCount} sensels)
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribuição de Carga */}
              <div className="p-3 rounded-xl bg-surface-hover border border-line space-y-1.5">
                <span className="text-xs text-mute block uppercase font-medium">Distribuição por metades do tapete</span>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-cyan-400">
                    Metade esquerda: {examStore.processedResult.metrics.leftPercentage?.toFixed(1) ?? "—"}%
                  </span>
                  <span className="text-amber-400">
                    Metade direita: {examStore.processedResult.metrics.rightPercentage?.toFixed(1) ?? "—"}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-line overflow-hidden flex">
                  <div
                    className="bg-cyan-500 transition-all"
                    style={{ width: `${examStore.processedResult.metrics.leftPercentage ?? 50}%` }}
                  />
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ width: `${examStore.processedResult.metrics.rightPercentage ?? 50}%` }}
                  />
                </div>
              </div>

              {examStore.foot !== 'both' && <p className="text-xs text-mute">As metades pertencem ao tapete. Nesta aquisição individual, não representam a carga entre os dois pés.</p>}
              {examStore.completedStages.map((r,i) => <div key={i} className="p-3 rounded-lg border border-line text-xs"><strong>{FOOT_LABELS[r.examInput.analysis!.acquisition!.foot]} · primeira coleta</strong><p>{r.examInput.duration} s · {r.examInput.frameCount} quadros · máximo {r.metrics.maxPressure.toFixed(0)} ADC</p><div className="h-40"><BaropodometricHeatmap values={r.averageMatrix} config={r.examInput.visualizationSettings ?? examStore.settings} cop={r.metrics.cop} trajectory={r.examInput.analysis ? temporalPoints(r.examInput.seriesFrames ?? r.examInput.rawFrames ?? [], r.examInput.analysis.series) : r.examInput.copTrajectory} trajectoryGapMs={r.examInput.analysis ? temporalGapLimit(r.examInput.analysis.quality) : undefined} /></div></div>)}
              {/* Parâmetros Utilizados */}
              <div className="text-xs text-mute space-y-1 border-t border-line pt-2">
                <span className="font-semibold block text-foreground">Configuração aplicada:</span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span>Threshold: {examStore.settings.threshold} ADC</span>
                  <span>VMAX: {examStore.settings.vmax} ADC</span>
                  <span>Gamma: {examStore.settings.gamma}</span>
                  <span>Suavização: {examStore.settings.smoothing}</span>
                </div>
              </div>
            </div>

            {/* Ações: Salvar ou Repetir */}
            <div className="pt-3 border-t border-line space-y-2">
              {examStore.foot !== 'both' && !examStore.separateFeet && !examStore.completedStages.length && <button type="button" disabled={examStore.isSaving} onClick={examStore.nextFoot}
                className="w-full py-2 rounded-xl text-sm font-semibold border border-line hover:bg-surface-hover disabled:opacity-50">
                Trocar para o {FOOT_LABELS[examStore.foot === 'left' ? 'right' : 'left'].toLowerCase()}
              </button>}
              <button
                type="button"
                disabled={examStore.isSaving}
                onClick={() => { if (examStore.separateFeet && !examStore.completedStages.length) examStore.nextFoot(); else void examStore.saveExam().catch(() => {}); }}
                className="w-full py-2.5 rounded-xl text-sm font-bold bg-brand text-brand-fg hover:opacity-90 flex items-center justify-center gap-2 shadow-xs transition-opacity disabled:opacity-50"
              >
                <Save size={16} />
                <span>{examStore.isSaving ? "Salvando..." : examStore.separateFeet && !examStore.completedStages.length ? "Continuar para o outro pé" : examStore.separateFeet ? "Salvar exame com os dois pés" : "Salvar exame"}</span>
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={examStore.isSaving}
                  onClick={examStore.startPreparation}
                  className="flex-1 py-1.5 rounded-xl text-xs font-medium border border-line bg-surface hover:bg-surface-hover text-mute hover:text-foreground flex items-center justify-center gap-1.5"
                >
                  <RotateCcw size={13} />
                  <span>Repetir Aquisição</span>
                </button>
                <button
                  type="button"
                  disabled={examStore.isSaving}
                  onClick={examStore.resetExam}
                  className="py-1.5 px-3 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                >
                  Descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 6: EXAME SALVO COM SUCESSO */}
      {examStore.step === "SAVED" && examStore.savedExam && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full space-y-6">
          <div className="w-full bg-surface border border-line rounded-2xl p-6 shadow-xl text-center space-y-5">
            <div className="size-14 mx-auto rounded-2xl bg-emerald-500/15 text-emerald-400 grid place-items-center">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                Exame Salvo com Sucesso!
              </h2>
              <p className="text-xs text-mute">
                {examStore.separateFeet ? 'As duas aquisições foram reunidas neste exame.' : 'O resultado está disponível no histórico.'}
              </p>
            </div>

            <div className="bg-surface-hover p-4 rounded-xl border border-line text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-mute">Paciente:</span>
                <span className="font-semibold text-foreground">{examStore.savedExam.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">ID do Exame:</span>
                <span className="font-mono font-bold text-brand">
                  #{String(examStore.savedExam.id).padStart(6, "0")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Origem:</span>
                <span className="font-semibold text-foreground">{examStore.savedExam.source}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-mute">Leitura Máxima:</span>
                <span className="font-semibold text-foreground">
                  {Math.round(examStore.savedExam.maxPressure ?? 0)} ADC
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInspectModalOpen(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-brand text-brand-fg hover:opacity-90 transition-opacity"
              >
                Visualizar Exame Salvo
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={examStore.resetExam}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-line bg-surface hover:bg-surface-hover transition-colors"
                >
                  Novo Exame
                </button>
                <button
                  type="button"
                  onClick={() => go("exams")}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border border-line bg-surface hover:bg-surface-hover transition-colors"
                >
                  Lista de Exames
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento de Exame */}
      <CancelExamDialog
        isOpen={examStore.cancelModalOpen}
        onConfirm={examStore.confirmCancel}
        onClose={examStore.closeCancelModal}
      />

      {/* Modal de Inspeção do Exame Salvo */}
      {inspectModalOpen && examStore.savedExam && (
        <ExamDetailsModal
          examId={examStore.savedExam.id}
          initialExam={examStore.savedExam}
          onClose={() => setInspectModalOpen(false)}
        />
      )}
    </div>
  );
};
