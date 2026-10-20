import type { HeatmapSettings } from "@/services/baropodometry";
import type { PhysicalResult, RawFrame } from "@/services/calibration/types";
import type { ExamAnalysis } from '@/services/examAnalysis/types';

export type Role = "admin" | "professional" | "assistant";
export interface User { id: number; name: string; email: string; role: Role; ra?: string | null }
export interface ManagedUser extends User { ra: string | null; active: boolean }
export interface UserInput { name: string; email: string; ra: string; role: Role; active: boolean }
export interface Registration { user: User; recoveryCode: string }
export interface DashboardStats { patients: number; exams: number; appointmentsToday: number; lastExamAt: string | null }
export type Page = "dashboard" | "patients" | "baropodometry" | "calibration" | "agenda" | "exams" | "new-exam" | "comparison" | "questionnaires" | "settings" | "users";
export interface CopSample { timestampMs: number; x: number; y: number }
export interface Professional { id: number; name: string; profession: string | null; registration: string | null }
export type AppointmentStatus = "scheduled" | "confirmed" | "done" | "cancelled";
export interface AppointmentInput { patientId: number; professionalId: number | null; date: string; startTime: string; endTime: string; type: string; status: AppointmentStatus; notes: string | null }
export interface Appointment extends Omit<AppointmentInput, "endTime" | "type"> { id: number; patientName: string; professionalName: string | null; endTime: string | null; type: string | null }
export type QuestionType = "text" | "single" | "multi" | "number" | "yesno";
export interface Question { id: number | null; groupName: string; question: string; type: QuestionType; options: string[]; required: boolean; active: boolean }
export interface Questionnaire { id: number | null; name: string; description: string | null; active: boolean; questions: Question[] }
export type AnswerValue = string | number | boolean | string[] | null;
export interface QuestionnaireAnswer { questionId: number; value: AnswerValue }
export interface QuestionnaireSession { id: number; patientId: number; patientName: string; answeredAt: string; questionnaire: Questionnaire; answers: QuestionnaireAnswer[] }
export interface BackupPreview { kind: "full" | "patient"; generatedAt: string; schemaVersion: number; rowCounts: Record<string, number> }
export interface RestoreResult { kind: "full" | "patient"; patientId: number | null; safetyBackup: string }
export interface AppPreferences { durationSeconds: number; visualization: HeatmapSettings; deviceType: "MOCK" | "SERIAL"; selectedPort: string; baudRate: number; theme: "light" | "dark" }
export interface SystemLog { id: number; level: "debug" | "info" | "warn" | "error"; category: string; message: string; createdAt: string }

export interface Patient {
  id: number;
  name: string;
  socialName: string | null;
  birthDate: string | null;
  sex: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  profession: string | null;
  height: number | null;
  weight: number | null;
  shoeSize: number | null;
  observations: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientSummary {
  id: number;
  name: string;
  socialName: string | null;
  birthDate: string | null;
  sex: string | null;
  cpf: string | null;
  phone: string | null;
  email: string | null;
  lastExamAt: string | null;
  createdAt: string;
}

export interface PatientInput {
  name: string;
  socialName?: string | null;
  birthDate?: string | null;
  sex?: string | null;
  cpf?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  profession?: string | null;
  height?: number | null;
  weight?: number | null;
  shoeSize?: number | null;
  observations?: string | null;
}

export interface PatientExamItem {
  acquisition?: import('@/services/examProtocol').ExamAcquisition | null;
  id: number;
  type: "static" | "dynamic";
  source: "REAL" | "SIMULATION";
  status: "draft" | "acquiring" | "completed" | "discarded";
  startedAt: string | null;
  duration: number | null;
  professionalName?: string | null;
  maxPressure?: number | null;
  contactAreaPercent?: number | null;
}

export interface ExamSummary {
  acquisition?: import('@/services/examProtocol').ExamAcquisition | null;
  id: number;
  patientId: number;
  patientName: string;
  patientCpf: string | null;
  type: "static" | "dynamic";
  source: "REAL" | "SIMULATION";
  status: "draft" | "acquiring" | "completed" | "discarded";
  startedAt: string | null;
  duration: number | null;
  frameCount: number;
  fps: number | null;
  maxPressure: number | null;
  meanPressure: number | null;
  contactAreaPercent: number | null;
  contactSensors: number | null;
  copX: number | null;
  copY: number | null;
  leftPercent: number | null;
  rightPercent: number | null;
  professionalName: string | null;
  createdAt: string;
}

export interface ExamDetails extends ExamSummary {
  analysis?: ExamAnalysis | null;
  patientSnapshotPreserved?: boolean;
  physicalResult?: PhysicalResult | null;
  copTrajectory?: CopSample[] | null;
  visualizationSettings?: HeatmapSettings | null;
  patientBirthDate: string | null;
  patientHeight: number | null;
  patientWeight: number | null;
  patientShoeSize: number | null;
  professionalId: number | null;
  clinicId: number | null;
  finishedAt: string | null;
  threshold: number | null;
  vmax: number | null;
  gamma: number | null;
  smoothing: number | null;
  tareApplied: boolean;
  leftLoad: number | null;
  rightLoad: number | null;
  matrix: number[];
  notes: string | null;
}

export interface ExamInput {
  analysis?: ExamAnalysis | null;
  seriesFrames?: RawFrame[] | null;
  physicalProfileId?: string | null;
  rawFrames?: RawFrame[] | null;
  copTrajectory?: CopSample[] | null;
  visualizationSettings?: HeatmapSettings | null;
  patientId: number;
  professionalId?: number | null;
  clinicId?: number | null;
  type: "static" | "dynamic";
  source: "REAL" | "SIMULATION";
  status: "draft" | "acquiring" | "completed" | "discarded";
  startedAt?: string | null;
  finishedAt?: string | null;
  duration: number;
  frameCount: number;
  fps: number;
  threshold: number;
  vmax: number;
  gamma: number;
  smoothing: number;
  tareApplied: boolean;
  matrix: number[];
  maxPressure: number;
  meanPressure?: number | null;
  contactAreaPercent: number;
  contactSensors: number;
  copX?: number | null;
  copY?: number | null;
  leftLoad: number;
  rightLoad: number;
  leftPercent?: number | null;
  rightPercent?: number | null;
  notes?: string | null;
}
