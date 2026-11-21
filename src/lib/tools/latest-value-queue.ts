/**
 * Runs an async job for a value, one after the other: the first value runs at once. Values that come in while a job
 * runs are not queued one by one - only the newest one is kept (older waiting values are dropped) and runs as soon as
 * the running job has finished. After that again the then newest one, and so on.
 *
 * A failing job does not block the queue: its error goes to `onError`, the next value runs anyway.
 */
export class LatestValueQueue<T> {
    private running = false;
    private pending: { value: T } | undefined;

    /**
     * @param job the async job for one value
     * @param onError gets the error of a failing job
     */
    constructor(
        private readonly job: (value: T) => Promise<void>,
        private readonly onError: (value: T, error: unknown) => void,
    ) {}

    /**
     * Adds a value. While a job runs, it only replaces the waiting value and returns at once.
     * Otherwise it runs the job and resolves when no value is waiting anymore. Never rejects.
     *
     * @param value the new value
     */
    async push(value: T): Promise<void> {
        this.pending = { value };
        if (this.running) {
            return;
        }
        this.running = true;
        try {
            while (this.pending) {
                const next = this.pending.value;
                this.pending = undefined;
                try {
                    await this.job(next);
                } catch (e) {
                    this.onError(next, e);
                }
            }
        } finally {
            this.running = false;
        }
    }
}
