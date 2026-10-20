import { invoke } from "@tauri-apps/api/core";
import type { RegionRevision } from '@/services/examAnalysis/types';
import type { CalibrationData, Mat, Trial, TrialSpec, RawFrame, Profile, Scope, ValidationResult } from "@/services/calibration/types";
import type {
  DashboardStats,
  ExamDetails,
  ExamInput,
  ExamSummary,
  Patient,
  PatientExamItem,
  PatientInput,
  PatientSummary,
  User, ManagedUser, UserInput, Role,
  Registration,
  Professional, Appointment, AppointmentInput,
  Questionnaire, QuestionnaireSession, QuestionnaireAnswer,
  BackupPreview, RestoreResult,
  AppPreferences, SystemLog,
} from "@/types";

interface ListPage { limit: number; offset: number; patientId?: number }

/** Todas as chamadas ao backend Rust passam por aqui (única fronteira com o SQLite). */
export const isTauri = () => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

// Apenas consultas leves: quadros brutos e detalhes de exames não ocupam o cache.
const cachedReads = new Set([
  "dashboard_stats", "patients_list", "patients_get", "patients_exam_history",
  "exams_list", "appointments_list", "professionals_list",
  "questionnaires_list", "questionnaires_history",
]);
const cache = new Map<string, { command: string; expires: number; promise: Promise<unknown> }>();
const CACHE_TTL = 60_000;
const CACHE_LIMIT = 100;

export function clearDatabaseCache() { cache.clear(); }
function invalidateReads(commands: string[]) {
  for (const [key, entry] of cache) if (commands.includes(entry.command)) cache.delete(key);
}
function invalidateFor(command: string) {
  if (command.startsWith("users_")) return clearDatabaseCache();
  if ((command.startsWith("auth_") && !["auth_current", "auth_has_users"].includes(command)) || command === "backups_import") return clearDatabaseCache();
  if (command.startsWith("patients_") && !["patients_list", "patients_get", "patients_exam_history"].includes(command))
    invalidateReads(["patients_list", "patients_get", "patients_exam_history", "exams_list", "dashboard_stats"]);
  if (["exams_create_sequence", "exams_create", "exams_delete", "exams_update_notes"].includes(command))
    invalidateReads(["exams_list", "patients_list", "patients_exam_history", "dashboard_stats"]);
  if (["appointments_save", "appointments_delete"].includes(command)) invalidateReads(["appointments_list", "dashboard_stats"]);
  if (command === "professionals_create") invalidateReads(["professionals_list", "appointments_list", "exams_list"]);
  if (["questionnaires_save", "questionnaires_answer"].includes(command)) invalidateReads(["questionnaires_list", "questionnaires_history"]);
}

function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!cachedReads.has(cmd)) {
    // Escritas e autenticação invalidam também consultas que ainda estão em andamento.
    invalidateFor(cmd);
    return execute<T>(cmd, args).finally(() => invalidateFor(cmd));
  }
  if (!isTauri()) return execute<T>(cmd, args);
  const key = JSON.stringify([cmd, args]);
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) {
    cache.delete(key);
    cache.set(key, existing);
    return existing.promise.then((value) => structuredClone(value) as T);
  }
  cache.delete(key);
  const entry = { command: cmd, expires: Infinity, promise: execute<T>(cmd, args) as Promise<unknown> };
  cache.set(key, entry);
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value!);
  entry.promise = entry.promise.then((value) => {
    entry.expires = Date.now() + CACHE_TTL;
    return value;
  }, (error) => {
    if (cache.get(key) === entry) cache.delete(key);
    throw error;
  });
  return entry.promise.then((value) => structuredClone(value) as T);
}

async function execute<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) throw new Error("Execute dentro do Tauri (npm run tauri dev). O banco SQLite só existe no backend desktop.");
  try {
    const result = await invoke<T>(cmd, args);
    return result;
  }
  catch (e) {
    const message = typeof e === "string" ? e : (e as Error)?.message ?? "Erro desconhecido";
    if (message === "Sessão encerrada. Entre novamente.") {
      clearDatabaseCache();
      window.dispatchEvent(new Event("auth-expired"));
    }
    throw new Error(message);
  }
}

export const api = {
  users: {
    list: (search: string, offset: number) => call<ManagedUser[]>("users_list", {search,offset}),
    update: (id:number,data:UserInput,adminPassword:string) => call<void>("users_update", {id,data,adminPassword}),
    delete: (id:number,adminPassword:string) => call<void>("users_delete", {id,adminPassword}),
    recovery: (id:number,adminPassword:string) => call<string>("users_recovery", {id,adminPassword}),
  },
  clinicalProfiles: () => call<Profile[]>("clinical_profiles"),
  calibration: {
    list: () => call<CalibrationData>("calibration_list"),
    importTrials: (content: string) => call<number>("calibration_import", { content }),
    saveMat: (mat: Mat) => call<Mat>("calibration_save_mat", { mat }),
    begin: (id: string, matId: string, source: "REAL" | "SIMULATION", spec: TrialSpec) => call<Trial>("calibration_begin", { id, matId, source, spec }),
    append: (id: string, ordinal: number, frames: RawFrame[]) => call<void>("calibration_append", { id, ordinal, frames }),
    finish: (id: string, reason: string) => call<Trial>("calibration_finish", { id, reason }),
    review: (id: string, accept: boolean, reason: string) => call<Trial>("calibration_review", { id, accept, reason }),
    reclassify: (trialIds: string[], profileId: string, reason: string) => call<Trial[]>("calibration_reclassify", { trialIds, profileId, reason }),
    frames: (id: string) => call<RawFrame[]>("calibration_frames", { id }),
    fit: (request: { id: string; matId: string; name: string; scope: Scope; baselineTrialId: string; trialIds: string[]; maxError: number; minValidationTrials: number; minFitLevels: number }) => call<Profile>("calibration_fit", { request }),
    validate: (id: string, validationId: string, trialIds: string[]) => call<ValidationResult>("calibration_validate", { id, validationId, trialIds }),
    activate: (id: string) => call<void>("calibration_activate", { id }),
    deactivate: (matId: string) => call<void>("calibration_deactivate", { matId }),
  },
  settings: { get: () => call<AppPreferences>("app_settings_get"), save: (data: AppPreferences) => call<void>("app_settings_save", { data }) },
  logs: { list: (level?: string) => call<SystemLog[]>("system_logs_list", { level: level || null }), add: (category: string, message: string, level = "info") => call<void>("system_logs_add", { category, message, level }) },
  backups: {
    export: (patientId?: number) => call<string>("backups_export", { patientId: patientId ?? null }),
    preview: (content: string) => call<BackupPreview>("backups_preview", { content }),
    import: (content: string, confirmed: boolean) => call<RestoreResult>("backups_import", { content, confirmed }),
  },
  questionnaires: {
    list: () => call<Questionnaire[]>("questionnaires_list"),
    save: (data: Questionnaire) => call<Questionnaire>("questionnaires_save", { data }),
    answer: (questionnaireId: number, patientId: number, answers: QuestionnaireAnswer[]) => call<QuestionnaireSession>("questionnaires_answer", { questionnaireId, patientId, answers }),
    history: (patientId: number) => call<QuestionnaireSession[]>("questionnaires_history", { patientId }),
  },
  professionals: {
    list: () => call<Professional[]>("professionals_list"),
    create: (name: string, profession: string | null, registration: string | null) => call<Professional>("professionals_create", { name, profession, registration }),
  },
  appointments: {
    list: (from: string, to: string, patientId?: number) => call<Appointment[]>("appointments_list", { from, to, patientId: patientId ?? null }),
    save: (id: number | null, data: AppointmentInput) => call<Appointment>("appointments_save", { id, data }),
    delete: (id: number) => call<void>("appointments_delete", { id }),
  },
  hasUsers: () => call<boolean>("auth_has_users"),
  register: (name: string, email: string, password: string, ra: string) => call<Registration>("auth_register_first", { name, email, password, ra }),
  registerUser: (name: string, email: string, password: string, role: Role, ra: string, adminPassword: string) => call<Registration>("auth_register_user", { name, email, password, role, ra, adminPassword }),
  login: (email: string, password: string) => call<User>("auth_login", { email, password }),
  currentUser: () => call<User | null>("auth_current"),
  logout: () => call<void>("auth_logout"),
  provisionRecovery: (password: string) => call<string>("auth_provision_recovery", { password }),
  changePassword: (password: string, newPassword: string) => call<void>("auth_change_password", { password, newPassword }),
  recover: (email: string, ra: string | null, newPassword: string, code: string | null = null) => call<void>("auth_recover", { email, ra, code, newPassword }),
  stats: () => call<DashboardStats>("dashboard_stats"),
  patients: {
    list: (search?: string, page?: ListPage) => call<PatientSummary[]>("patients_list", { search: search?.trim() || null, limit: page?.limit ?? null, offset: page?.offset ?? null }),
    get: (id: number) => call<Patient>("patients_get", { id }),
    create: (data: PatientInput) => call<Patient>("patients_create", { data }),
    update: (id: number, data: PatientInput) => call<Patient>("patients_update", { id, data }),
    archive: (id: number) => call<void>("patients_archive", { id }),
    examHistory: (id: number) => call<PatientExamItem[]>("patients_exam_history", { patientId: id }),
  },
  exams: {
    sequence: (id: number) => call<ExamDetails[]>("exams_sequence", { id }),
    createSequence: (data: ExamInput[]) => call<ExamDetails[]>("exams_create_sequence", { data }),
    rawFrames: (id: number, offset?:number, limit?:number) => call<RawFrame[]>("exams_raw_frames", { id, offset:offset??null, limit:limit??null }),
    addRegion: (id:number, revision:RegionRevision) => call<ExamDetails>('exams_add_region',{id,revision}),
    list: (search?: string, page?: ListPage) => call<ExamSummary[]>("exams_list", { search: search?.trim() || null, limit: page?.limit ?? null, offset: page?.offset ?? null, patientId: page?.patientId ?? null }),
    get: (id: number) => call<ExamDetails>("exams_get", { id }),
    updateNotes: (id: number, notes: string) => call<ExamDetails>("exams_update_notes", { id, notes }),
    create: (data: ExamInput) => call<ExamDetails>("exams_create", { data }),
    delete: (id: number) => call<void>("exams_delete", { id }),
  },
};
