/** Serializa gravações e permite aguardar a fila antes de restaurar um backup. */
export function createSerialWriter<T>(write: (value: T) => Promise<void>) {
    let pending: Promise<void> = Promise.resolve();
    return {
        save(value: T) { const operation = pending.catch(() => { }).then(() => write(value)); pending = operation; return operation; },
        wait() { return pending.catch(() => { }); },
    };
}
