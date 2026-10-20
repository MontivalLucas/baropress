import { examDuration } from "./examProtocol";
import { DEFAULT_HEATMAP_SETTINGS, sanitizeSettings } from "@/services/baropodometry";
import type { AppPreferences } from "@/types";
export const DEFAULT_APP_PREFERENCES: AppPreferences = { durationSeconds: 30, visualization: { ...DEFAULT_HEATMAP_SETTINGS }, deviceType: "SERIAL", selectedPort: "", baudRate: 115200, theme: "light" };
export function normalizePreferences(input: Partial<AppPreferences>): AppPreferences {
    const visualization = sanitizeSettings(input.visualization ?? {});
    if (![150, 300, 450].includes(input.visualization?.resolution ?? 300))
        visualization.resolution = 300;
    if (!["AUTO", "MANUAL"].includes(visualization.mode))
        visualization.mode = "MANUAL";
    return { durationSeconds: examDuration(input.durationSeconds),
        visualization, deviceType: input.deviceType === "MOCK" ? "MOCK" : "SERIAL", selectedPort: (input.selectedPort ?? "").slice(0, 200),
        baudRate: Number.isFinite(input.baudRate) && input.baudRate! >= 1200 && input.baudRate! <= 2000000 ? Math.round(input.baudRate!) : 115200,
        theme: input.theme === "dark" ? "dark" : "light" };
}
export function formatClock(seconds: number) { return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }
