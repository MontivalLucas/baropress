import { useEffect, useState, useCallback, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { Patient, PatientInput, PatientSummary } from "@/types";
import { api } from "@/services/database/api";
import { PatientList } from "./PatientList";
import { PatientForm } from "./PatientForm";
import { PatientDetails } from "./PatientDetails";
import { LIST_PAGE_SIZE, usePagedSearch } from "@/components/ui/usePagedSearch";
import { ListPagination } from "@/components/ui/ListPagination";

type ViewMode = "list" | "new" | "edit" | "details";

export function PatientsPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  // Filter & data states
  const { search, setSearch, query, page, setPage } = usePagedSearch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const listRequest = useRef(0);
  const fetchPatients = useCallback(async () => {
    const request = ++listRequest.current;
    setLoading(true);
    setError(null);
    try {
      const data = await api.patients.list(query, { limit: LIST_PAGE_SIZE + 1, offset: page * LIST_PAGE_SIZE });
      if (request === listRequest.current) setPatients(data);
    } catch (err) {
      if (request === listRequest.current) setError((err as Error).message ?? "Falha ao carregar lista de pacientes.");
    } finally {
      if (request === listRequest.current) setLoading(false);
    }
  }, [query, page]);

  // Initial load
  useEffect(() => {
    void fetchPatients();
    return () => { ++listRequest.current; };
  }, [fetchPatients]);

  // Toast timer
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  async function handleCreatePatient(data: PatientInput) {
    const created = await api.patients.create(data);
    setNotification("Paciente cadastrado com sucesso.");
    await fetchPatients();
    setSelectedId(created.id);
    setView("details");
  }

  async function handleEditPatientStart(id: number) {
    try {
      setLoading(true);
      const data = await api.patients.get(id);
      setEditingPatient(data);
      setSelectedId(id);
      setView("edit");
    } catch (err) {
      setError((err as Error).message ?? "Erro ao buscar dados do paciente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePatient(data: PatientInput) {
    if (!selectedId) return;
    await api.patients.update(selectedId, data);
    setNotification("Paciente atualizado com sucesso.");
    await fetchPatients();
    setView("details");
  }

  function handleArchived() {
    setNotification("Paciente arquivado com sucesso.");
    setSelectedId(null);
    setView("list");
    void fetchPatients();
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast de sucesso */}
      {notification && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-600 text-white shadow-lg text-sm animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle2 size={18} />
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-80 p-0.5 rounded"
            aria-label="Fechar notificação"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Cabeçalho da página (apenas na visualização de lista) */}
      {view === "list" && (
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Pacientes</h1>
          <p className="text-sm text-mute">
            Gerencie os pacientes cadastrados e acesse seus históricos baropodométricos.
          </p>
        </header>
      )}

      {/* Renderização condicional de visualizações */}
      {view === "list" && (
        <PatientList
          patients={patients.slice(0, LIST_PAGE_SIZE)}
          loading={loading}
          error={error}
          search={search}
          onSearchChange={setSearch}
          onSelectPatient={(id) => {
            setSelectedId(id);
            setView("details");
          }}
          onEditPatient={handleEditPatientStart}
          onNewPatient={() => {
            setEditingPatient(null);
            setView("new");
          }}
          onRetry={() => void fetchPatients()}
        />
      )}

      {view === "list" && <ListPagination page={page} count={Math.min(patients.length, LIST_PAGE_SIZE)} hasNext={patients.length > LIST_PAGE_SIZE} loading={loading} onChange={setPage} />}

      {view === "new" && (
        <PatientForm
          onSave={handleCreatePatient}
          onCancel={() => setView("list")}
        />
      )}

      {view === "edit" && (
        <PatientForm
          initialData={editingPatient}
          onSave={handleUpdatePatient}
          onCancel={() => setView("details")}
        />
      )}

      {view === "details" && selectedId && (
        <PatientDetails
          patientId={selectedId}
          onBack={() => setView("list")}
          onEdit={handleEditPatientStart}
          onArchived={handleArchived}
        />
      )}
    </div>
  );
}
