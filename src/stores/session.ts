import { canPage, canSettings } from "@/features/auth/permissions";
import { create } from "zustand";
import type { Page, User } from "@/types";
import { requestNavigation } from "@/services/navigationGuard";

interface SessionState {
  user: User | null;
  notice: string | null;
  setNotice: (notice: string | null) => void;
  page: Page;
  dark: boolean;
  settingsTab: "general" | "arduino" | "backup" | "logs";
  setSettingsTab: (tab: "general" | "arduino" | "backup" | "logs") => void;
  openArduinoSettings: () => void;
  reportExamId: number | null;
  comparisonPatientId: number | null;
  openComparison: (patientId?: number) => void;
  setUser: (u: User | null) => void;
  go: (p: Page) => void;
  openReport: (examId: number) => void;
  clearReportExamId: () => void;
  toggleTheme: () => void;
}
const storedDark = localStorage.getItem("theme") === "dark";
sessionStorage.removeItem("user");
document.documentElement.classList.toggle("dark", storedDark);

export const useSession = create<SessionState>((set, get) => ({
  user: null,
  notice: null,
  setNotice: (notice) => set({ notice }),
  page: "dashboard",
  dark: storedDark,
  settingsTab: "general",
  setSettingsTab: (settingsTab) => { if (canSettings(get().user?.role, settingsTab) && settingsTab !== get().settingsTab) requestNavigation(() => set({ settingsTab })); },
  openArduinoSettings: () => { if (get().user?.role !== "admin") return; requestNavigation(() => set({ page: "settings", settingsTab: "arduino", reportExamId: null })); },
  reportExamId: null,
  comparisonPatientId: null,
  openComparison: (comparisonPatientId) => { if (!canPage(get().user?.role,"comparison")) return; requestNavigation(() => set({ comparisonPatientId: comparisonPatientId ?? null, page: "comparison" })); },
  setUser: (user) => {
    sessionStorage.removeItem("user");
    set({ user, page: user?.role === "assistant" ? "patients" : "dashboard", settingsTab: "general", reportExamId: null, comparisonPatientId: null, notice: user ? null : get().notice });
  },
  go: (page) => { if (!canPage(get().user?.role,page)) return; if (page !== get().page || get().reportExamId !== null) requestNavigation(() => set({ page, reportExamId: null })); },
  openReport: (examId) => requestNavigation(() => set({ reportExamId: examId, page: "exams" })),
  clearReportExamId: () => requestNavigation(() => set({ reportExamId: null })),
  toggleTheme: () => {
    const dark = !get().dark;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
    set({ dark });
  },
}));
