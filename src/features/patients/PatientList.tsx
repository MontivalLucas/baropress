import { useId } from "react";
import { Search, UserPlus, Eye, Edit2, AlertCircle, Users, X, Calendar, Phone, FileText } from "lucide-react";
import type { PatientSummary } from "@/types";
import { formatCpf, formatPhone, formatDate, calculateAge } from "./patientUtils";
import { Button } from "@/components/ui/controls";

interface PatientListProps {
  patients: PatientSummary[];
  loading: boolean;
  error: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectPatient: (id: number) => void;
  onEditPatient: (id: number) => void;
  onNewPatient: () => void;
  onRetry: () => void;
}

export function PatientList({
  patients,
  loading,
  error,
  search,
  onSearchChange,
  onSelectPatient,
  onEditPatient,
  onNewPatient,
  onRetry,
}: PatientListProps) {
  const searchInputId = useId();

  return (
    <div className="space-y-6">
      {/* Barra superior de ações e busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <label htmlFor={searchInputId} className="sr-only">
            Buscar paciente por nome, CPF ou telefone
          </label>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por nome, CPF ou telefone…"
              className="w-full h-10 pl-10 pr-9 rounded-lg border border-line bg-surface text-sm placeholder:text-mute focus:border-brand transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label="Limpar busca"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink p-0.5 rounded"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <Button
          onClick={onNewPatient}
          className="flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          <UserPlus size={16} />
          <span>Novo paciente</span>
        </Button>
      </div>

      {/* Estado: Erro */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-card border border-rose-500/30 bg-rose-500/10 flex items-start justify-between gap-3 text-rose-500 text-sm"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" onClick={onRetry} className="h-8 px-3 text-xs">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Estado: Carregando Skeleton */}
      {loading && (
        <div className="bg-surface border border-line rounded-card overflow-hidden">
          <div className="p-4 border-b border-line bg-surface/50 flex gap-4">
            <div className="h-4 bg-line/60 rounded w-1/4 animate-pulse" />
            <div className="h-4 bg-line/60 rounded w-1/6 animate-pulse" />
            <div className="h-4 bg-line/60 rounded w-1/6 animate-pulse" />
            <div className="h-4 bg-line/60 rounded w-1/6 animate-pulse" />
          </div>
          <div className="divide-y divide-line">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-line/50 rounded w-1/3" />
                  <div className="h-3 bg-line/30 rounded w-1/5" />
                </div>
                <div className="h-4 bg-line/40 rounded w-28" />
                <div className="h-4 bg-line/40 rounded w-28" />
                <div className="h-8 bg-line/40 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado: Vazio (sem nenhum paciente no sistema) */}
      {!loading && !error && patients.length === 0 && !search && (
        <div className="bg-surface border border-line rounded-card p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="size-14 mx-auto rounded-full bg-brand/10 text-brand grid place-items-center">
            <Users size={28} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Nenhum paciente cadastrado</h3>
            <p className="text-sm text-mute">
              Cadastre seu primeiro paciente para começar a realizar avaliações baropodométricas.
            </p>
          </div>
          <Button onClick={onNewPatient} className="flex items-center gap-2 mx-auto">
            <UserPlus size={16} />
            <span>Cadastrar paciente</span>
          </Button>
        </div>
      )}

      {/* Estado: Busca sem resultados */}
      {!loading && !error && patients.length === 0 && search && (
        <div className="bg-surface border border-line rounded-card p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="size-12 mx-auto rounded-full bg-line/50 text-mute grid place-items-center">
            <Search size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-medium">Nenhum paciente encontrado</h3>
            <p className="text-sm text-mute">
              Nenhum resultado corresponde à busca &ldquo;{search}&rdquo;. Tente outro nome, CPF ou telefone.
            </p>
          </div>
          <Button variant="ghost" onClick={() => onSearchChange("")} className="text-xs">
            Limpar busca
          </Button>
        </div>
      )}

      {/* Tabela de pacientes */}
      {!loading && !error && patients.length > 0 && (
        <div className="bg-surface border border-line rounded-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse" aria-label="Lista de pacientes">
              <thead>
                <tr className="border-b border-line bg-surface/70 text-xs font-medium text-mute tracking-wider uppercase">
                  <th scope="col" className="py-3 px-4">Paciente</th>
                  <th scope="col" className="py-3 px-4">CPF</th>
                  <th scope="col" className="py-3 px-4">Telefone</th>
                  <th scope="col" className="py-3 px-4">Nascimento / Idade</th>
                  <th scope="col" className="py-3 px-4">Último exame</th>
                  <th scope="col" className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {patients.map((p) => {
                  const age = calculateAge(p.birthDate);
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-line/20 transition-colors group cursor-pointer"
                      onClick={() => onSelectPatient(p.id)}
                    >
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-brand/10 text-brand font-semibold text-xs grid place-items-center shrink-0">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-ink group-hover:text-brand transition-colors font-medium">
                              {p.name}
                            </div>
                            {p.socialName && (
                              <div className="text-xs text-mute font-normal">
                                Nome social: {p.socialName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-mute whitespace-nowrap tabular-nums">
                        {p.cpf ? formatCpf(p.cpf) : <span className="text-mute/50">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-mute whitespace-nowrap tabular-nums">
                        {p.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone size={13} className="text-mute/60" />
                            {formatPhone(p.phone)}
                          </span>
                        ) : (
                          <span className="text-mute/50">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-mute whitespace-nowrap">
                        {p.birthDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-mute/60" />
                            <span>{formatDate(p.birthDate)}</span>
                            {age !== null && (
                              <span className="text-xs text-mute/80">({age} anos)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-mute/50">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-mute whitespace-nowrap">
                        {p.lastExamAt ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-line/40 text-ink">
                            <FileText size={12} className="text-brand" />
                            {formatDate(p.lastExamAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-mute/60">Nenhum</span>
                        )}
                      </td>
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectPatient(p.id)}
                            className="h-8 px-2.5 rounded-lg border border-line hover:bg-line/40 text-xs font-medium text-ink flex items-center gap-1.5 transition-colors"
                            title="Visualizar prontuário"
                            aria-label={`Visualizar paciente ${p.name}`}
                          >
                            <Eye size={14} className="text-mute" />
                            <span>Visualizar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditPatient(p.id)}
                            className="h-8 px-2.5 rounded-lg border border-line hover:bg-line/40 text-xs font-medium text-ink flex items-center gap-1.5 transition-colors"
                            title="Editar paciente"
                            aria-label={`Editar paciente ${p.name}`}
                          >
                            <Edit2 size={13} className="text-mute" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-line bg-surface/50 text-xs text-mute flex items-center justify-between">
            <span>
              Mostrando {patients.length} paciente{patients.length !== 1 ? "s" : ""}
            </span>
            <span className="text-mute/60">BAROPRESS Prontuário Clínico</span>
          </div>
        </div>
      )}
    </div>
  );
}
