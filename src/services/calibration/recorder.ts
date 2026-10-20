import type { RawFrame, Trial } from "./types";
import type { SensorFrame } from "@/services/acquisition/types";
/** Bounded event recorder. Clock schedules completion; never samples the screen. */
export class TrialRecorder {
    private queue: RawFrame[] = [];
    private writing: Promise<void> | null = null;
    private ordinal = 0;
    private lastSequence: number | null = null;
    private stopped = false;
    private failure = "";
    count = 0;
    constructor(private trial: Trial, private startMs: number, private append: (id: string, ordinal: number, frames: RawFrame[]) => Promise<void>, private onFailure: (message: string) => void) { }
    push(frame: SensorFrame, receivedMs: number) {
        if (this.stopped)
            return;
        if (frame.source !== this.trial.source)
            return this.fail("Origem trocada durante a coleta.");
        if (frame.values.length !== 225 || frame.values.some(v => !Number.isInteger(v) || v < 0 || v > 4095))
            return this.fail("Quadro bruto inválido.");
        if (frame.sequence !== undefined && this.lastSequence !== null && frame.sequence <= this.lastSequence)
            return this.fail("Sequência duplicada ou reiniciada.");
        this.lastSequence = frame.sequence ?? null;
        if (this.queue.length >= 240 || this.count >= 20000)
            return this.fail("Limite de captura atingido; ensaio interrompido.");
        this.queue.push({ values: [...frame.values], sequence: frame.sequence ?? null, receivedMs: receivedMs - this.startMs });
        this.count++;
        if (this.queue.length >= 30)
            void this.flush();
    }
    private fail(message: string) { if (this.failure)
        return; this.failure = message; this.stopped = true; this.onFailure(message); }
    async flush(): Promise<void> {
        if (this.writing || !this.queue.length || this.failure)
            return;
        const batch = this.queue.splice(0, 60), ordinal = this.ordinal++;
        this.writing = this.append(this.trial.id, ordinal, batch).catch(e => { this.fail(`Falha de gravação: ${e instanceof Error ? e.message : String(e)}`); });
        await this.writing;
        this.writing = null;
        if (this.queue.length >= 30 && !this.failure)
            await this.flush();
    }
    async stop(): Promise<string> {
        this.stopped = true;
        if (this.writing)
            await this.writing;
        while (this.queue.length && !this.failure)
            await this.flush();
        return this.failure;
    }
}
