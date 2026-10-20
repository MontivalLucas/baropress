import { useEffect } from "react";
import { api, isTauri } from "@/services/database/api";
import { normalizePreferences } from "./preferences";
import { usePreferencesStore } from "@/stores/preferences";
import { useVisualizationStore } from "@/stores/visualization";
import { useAcquisitionStore } from "@/stores/acquisition";
import { useSession } from "@/stores/session";
import { createSerialWriter } from "./serialWriter";
import type { AppPreferences } from "@/types";
export function currentPreferences() {
    const a = useAcquisitionStore.getState();
    return normalizePreferences({ durationSeconds: usePreferencesStore.getState().durationSeconds, visualization: useVisualizationStore.getState().settings, deviceType: a.deviceType, selectedPort: a.selectedPort, baudRate: a.selectedBaud, theme: useSession.getState().dark ? 'dark' : 'light' });
}
const writer = createSerialWriter<AppPreferences>(async (data) => {
    try {
        await api.settings.save(data);
        usePreferencesStore.setState({ error: '', hydrated: true });
    }
    catch (e) {
        usePreferencesStore.setState({ error: (e as Error).message });
        throw e;
    }
});
export function waitForPreferencesWrites() { return writer.wait(); }
export function saveCurrentPreferences() { return writer.save(currentPreferences()); }
export function usePreferencesSync(userId: number | undefined) {
    useEffect(() => {
        if (!userId || !isTauri())
            return;
        let live = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        usePreferencesStore.setState({ hydrated: false, paused: false, error: '' });
        const schedule = () => {
            clearTimeout(timer);
            const p = usePreferencesStore.getState();
            if (p.hydrated && !p.paused)
                timer = setTimeout(() => { void saveCurrentPreferences().catch(() => { }); }, 1000);
        };
        const stops = [useVisualizationStore.subscribe(schedule), usePreferencesStore.subscribe((c, p) => {
                if (c.durationSeconds !== p.durationSeconds || c.paused !== p.paused)
                    schedule();
            }), useAcquisitionStore.subscribe((c, p) => {
                if (c.deviceType !== p.deviceType || c.selectedPort !== p.selectedPort || c.selectedBaud !== p.selectedBaud)
                    schedule();
            }), useSession.subscribe((c, p) => {
                if (c.dark !== p.dark)
                    schedule();
            })];
        api.settings.get().then((input) => {
            if (!live)
                return;
            const p = normalizePreferences(input);
            usePreferencesStore.setState({ durationSeconds: p.durationSeconds });
            useVisualizationStore.getState().setSettings(p.visualization);
            const a = useAcquisitionStore.getState();
            useAcquisitionStore.setState({ autoConnectSuspended: false, autoConnectionMessage: '' });
            if (!a.status.connected) {
                a.setDeviceType(p.deviceType);
                a.setSelectedPort(p.selectedPort);
                a.setSelectedBaud(p.baudRate);
            }
            useSession.setState({ dark: p.theme === 'dark' });
            document.documentElement.classList.toggle('dark', p.theme === 'dark');
            localStorage.setItem('theme', p.theme);
            usePreferencesStore.setState({ hydrated: true });
        }).catch((e) => {
            if (live)
                usePreferencesStore.setState({ error: e.message });
        });
        return () => { live = false; clearTimeout(timer); stops.forEach((stop) => stop()); };
    }, [userId]);
}
