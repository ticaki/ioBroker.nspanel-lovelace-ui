import { expect } from 'chai';
import { LatestValueQueue } from './latest-value-queue';

/**
 * A job that only finishes when the test says so.
 *
 * @returns the job, the values it ran with and a function finishing the running job
 */
function controlledJob(): {
    job: (v: string) => Promise<void>;
    ran: string[];
    finish: (error?: Error) => Promise<void>;
} {
    const ran: string[] = [];
    let resolveRunning: ((error?: Error) => void) | undefined;
    const job = (v: string): Promise<void> => {
        ran.push(v);
        return new Promise<void>((resolve, reject) => {
            resolveRunning = (error?: Error): void => (error ? reject(error) : resolve());
        });
    };
    const finish = async (error?: Error): Promise<void> => {
        const r = resolveRunning;
        resolveRunning = undefined;
        r?.(error);
        // let the queue pick the next value
        await new Promise(resolve => setImmediate(resolve));
    };
    return { job, ran, finish };
}

describe('lib/tools/latest-value-queue', () => {
    it('runs the first value, then only the newest of the values written meanwhile', async () => {
        const { job, ran, finish } = controlledJob();
        const errors: string[] = [];
        const queue = new LatestValueQueue<string>(job, v => errors.push(v));
        let firstDone = false;
        const first = queue.push('p0').then(() => (firstDone = true));
        for (let i = 1; i <= 8; i++) {
            // values written while a job runs return at once
            await queue.push(`p${i}`);
        }
        expect(ran).to.deep.equal(['p0']);
        await finish();
        expect(ran).to.deep.equal(['p0', 'p8']);
        expect(firstDone).to.equal(false);
        await finish();
        await first;
        expect(firstDone).to.equal(true);
        expect(ran).to.deep.equal(['p0', 'p8']);
        expect(errors).to.have.length(0);
    });

    it('a value written during the second job runs after it', async () => {
        const { job, ran, finish } = controlledJob();
        const queue = new LatestValueQueue<string>(job, () => undefined);
        const first = queue.push('a');
        void queue.push('b');
        await finish();
        void queue.push('c');
        void queue.push('d');
        await finish();
        await finish();
        await first;
        expect(ran).to.deep.equal(['a', 'b', 'd']);
    });

    it('a failing job does not block the queue', async () => {
        const { job, ran, finish } = controlledJob();
        const errors: { v: string; e: unknown }[] = [];
        const queue = new LatestValueQueue<string>(job, (v, e) => errors.push({ v, e }));
        const first = queue.push('a');
        void queue.push('b');
        await finish(new Error('boom'));
        expect(ran).to.deep.equal(['a', 'b']);
        await finish();
        await first;
        expect(errors).to.have.length(1);
        expect(errors[0].v).to.equal('a');
        expect(errors[0].e).to.be.instanceOf(Error);
        // the queue is free again
        const next = queue.push('c');
        expect(ran).to.deep.equal(['a', 'b', 'c']);
        await finish();
        await next;
    });

    it('a failing job without waiting value resolves the caller, no reject', async () => {
        const errors: string[] = [];
        const queue = new LatestValueQueue<string>(
            () => Promise.reject(new Error('boom')),
            v => errors.push(v),
        );
        await queue.push('x');
        expect(errors).to.deep.equal(['x']);
    });
});
