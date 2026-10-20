import { examDuration } from "@/services/examProtocol";
import { create } from "zustand";
export const usePreferencesStore = create<{
    durationSeconds: number;
    hydrated: boolean;
    paused: boolean;
    error: string;
    setDuration: (value: number) => void;
}>((set) => ({
    durationSeconds: 30, hydrated: false, paused: false, error: '',
    setDuration: (value) => {
        if (Number.isFinite(value))
            set({ durationSeconds: examDuration(value) });
    },
}));
