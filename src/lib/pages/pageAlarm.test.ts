import { expect } from 'chai';
import sinon from 'sinon';
import { Page } from '../classes/Page';
import { PageAlarm } from './pageAlarm';

/**
 * On the first start of a new alarm/unlock page the status object did not exist yet when the data
 * items were created. The triggered status data item was dropped ("has a invalid state object!") and
 * external writes to the status state were ignored until the next restart.
 */

const NS = 'nspanel-lovelace-ui.0';
const PATH = 'panels.panel1.alarm.alarm1';

type Write = { dp: string; val: unknown; type: string | undefined };

function createPage(writes: Write[], objects: Set<string>, existingStatus?: number): { page: any; checked: string[] } {
    const checked: string[] = [];
    const library = {
        writedp: async (dp: string, val: unknown, obj: { type?: string } | null): Promise<void> => {
            writes.push({ dp, val, type: obj?.type });
            if (obj) {
                objects.add(`${NS}.${dp}`);
            }
            return Promise.resolve();
        },
        readdb: (dp: string): { val: number } | undefined =>
            dp === `${PATH}.status` && existingStatus !== undefined ? { val: existingStatus } : undefined,
    };
    const statesControler = {
        createDataItems: async (config: any): Promise<any> => {
            // emulate Dataitem.isValidAndInit: triggered items without object are dropped
            const data: Record<string, unknown> = {};
            for (const [key, opt] of Object.entries<any>(config.data)) {
                if (opt?.type === 'triggered') {
                    checked.push(opt.dp);
                    if (!objects.has(opt.dp)) {
                        continue;
                    }
                }
                data[key] = opt;
            }
            return Promise.resolve({ ...config, data });
        },
    };
    const page: any = Object.create(PageAlarm.prototype);
    Object.assign(page, {
        config: { card: 'cardAlarm', data: {} },
        adapter: { namespace: NS, config: {} },
        library,
        basePanel: { name: 'panel1', statesControler },
        pathToStates: PATH,
        approveId: `${PATH}.approve`,
        statusState: `${PATH}.status`,
        status: 'armed',
        alarmType: 'alarm',
        useStates: false,
        isGlobal: false,
    });
    return { page, checked };
}

describe('lib/pages/pageAlarm - init', () => {
    afterEach(() => {
        sinon.restore();
    });

    beforeEach(() => {
        sinon.stub(Page.prototype, 'init').resolves();
    });

    it('creates the status object before the data items on a new page', async () => {
        const writes: Write[] = [];
        const { page, checked } = createPage(writes, new Set());

        await page.init();

        expect(checked).to.include(`${NS}.${PATH}.status`);
        expect(page.items.data.statusState, 'status data item must survive').to.deep.equal({
            type: 'triggered',
            dp: `${NS}.${PATH}.status`,
        });
        const firstStatus = writes.findIndex(w => w.dp === `${PATH}.status`);
        expect(writes[firstStatus]).to.deep.equal({ dp: `${PATH}.status`, val: undefined, type: 'state' });
        // channels exist before the status state
        for (const channel of ['panels.panel1.alarm', 'alarm', PATH]) {
            const idx = writes.findIndex(w => w.dp === channel);
            expect(idx, channel).to.be.greaterThan(-1).and.lessThan(firstStatus);
        }
    });

    it('keeps an existing status value', async () => {
        const writes: Write[] = [];
        // 0 = 'disarmed'
        const { page } = createPage(writes, new Set([`${NS}.${PATH}.status`, `${NS}.${PATH}.approve`]), 0);

        await page.init();

        expect(page.status).to.equal('disarmed');
        const statusWrites = writes.filter(w => w.dp === `${PATH}.status`).map(w => w.val);
        expect(statusWrites).to.deep.equal([undefined, 0]);
    });
});

/**
 * The PIN lockout after a wrong PIN was only shown on the display. Events injected via MQTT/console
 * (`event,buttonPress2,<page>,A1,<pin>`) went straight through the PIN check, so PINs could be tried
 * without waiting. Now every attempt during the lockout is rejected and extends it.
 */
type Timer = { cb: () => void; ms: number; cleared: boolean };

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function createLockPage(
    alarmType: 'alarm' | 'unlock',
    status: string,
): {
    page: any;
    timers: Timer[];
    sent: string[];
    warns: string[];
} {
    const timers: Timer[] = [];
    const sent: string[] = [];
    const warns: string[] = [];
    const adapter = {
        namespace: NS,
        config: {},
        unload: false,
        setTimeout: (cb: () => void, ms: number): Timer => {
            // like adapter.setTimeout of js-controller: throws above a 32-bit signed int
            if (ms > MAX_TIMEOUT_MS) {
                throw new Error(`Timeout (${ms}) is larger than a 32-bit signed integer`);
            }
            const t: Timer = { cb, ms, cleared: false };
            timers.push(t);
            return t;
        },
        clearTimeout: (t: Timer | undefined): void => {
            if (t) {
                t.cleared = true;
            }
        },
    };
    const page: any = Object.create(PageAlarm.prototype);
    Object.assign(page, {
        config: { card: 'cardAlarm', data: {} },
        items: { card: 'cardAlarm', data: {} },
        adapter,
        library: { getTranslation: (key: string): string => key },
        log: {
            warn: (msg: string): void => {
                warns.push(msg);
            },
            debug: (): void => {},
        },
        basePanel: { name: 'panel1' },
        pathToStates: PATH,
        status,
        alarmType,
        useStates: false,
        isGlobal: false,
        pin: '1234',
        failCount: 0,
        pinFailTimeout: null,
        pinLockSeconds: 0,
        visibility: true,
        unload: false,
        sendToPanel: (msg: string): void => {
            sent.push(msg);
        },
        getNavigation: (): string => '',
        shortHeadline: (h: string): string => h,
        name: 'alarm1',
        id: 'alarm1',
    });
    return { page, timers, sent, warns };
}

function activeTimers(timers: Timer[]): Timer[] {
    return timers.filter(t => !t.cleared);
}

/**
 * fire a timer like the runtime would and wait for the async update
 *
 * @param t - the timer to fire
 */
async function fire(t: Timer): Promise<void> {
    t.cleared = true;
    t.cb();
    await new Promise(resolve => setImmediate(resolve));
}

describe('lib/pages/pageAlarm - PIN lockout', () => {
    beforeEach(() => {
        sinon.stub(Page.prototype, 'update').resolves();
    });
    afterEach(() => {
        sinon.restore();
    });

    it('rejects the correct PIN during the lockout and doubles the wait', async () => {
        const { page, timers, sent, warns } = createLockPage('alarm', 'disarmed');

        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        expect(page.failCount).to.equal(1);
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([2000]);
        expect(sent.at(-1)).to.include('locked_for').and.include(' 2 s');

        await page.onButtonEvent({ action: 'A1', opt: '1234' });
        expect(page.status, 'correct PIN must not arm during the lockout').to.equal('disarmed');
        expect(page.failCount).to.equal(2);
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([4000]);
        expect(sent.at(-1)).to.include('locked_for').and.include(' 4 s');
        expect(warns.at(-1)).to.equal('PIN attempt during lockout rejected. try 2! Delay next attempt by 4 seconds');
        for (const w of warns) {
            expect(w).to.not.include('1234');
            expect(w).to.not.include('0000');
        }
    });

    it('doubles the wait on every quick attempt and keeps only one timer', async () => {
        const { page, timers } = createLockPage('alarm', 'armed');

        const expected: number[] = [];
        for (let i = 1; i <= 6; i++) {
            // first a wrong PIN, then wrong and correct PINs mixed - all within the lockout
            await page.onButtonEvent({ action: i % 2 ? 'D1' : 'D2', opt: i % 2 ? '9' : '1234' });
            expected.push(2 ** i * 1000);
            expect(activeTimers(timers), `attempt ${i}`).to.have.length(1);
        }
        expect(timers.map(t => t.ms)).to.deep.equal(expected);
        expect(page.failCount).to.equal(6);
        expect(page.status).to.equal('armed');
    });

    it('accepts the correct PIN after the lockout has expired', async () => {
        const { page, timers, sent } = createLockPage('alarm', 'disarmed');

        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        expect(page.failCount).to.equal(2);
        await fire(activeTimers(timers)[0]);
        expect(page.pinFailTimeout).to.equal(null);
        expect(sent.at(-1)).to.not.include('locked_for');

        await page.onButtonEvent({ action: 'A1', opt: '1234' });
        expect(page.failCount).to.equal(0);
        expect(page.status).to.equal('armed');
    });

    it('lifts the lockout in the adapter before the panel gets the free numpad', async () => {
        const { page, timers } = createLockPage('alarm', 'disarmed');
        const lockAtSend: unknown[] = [];
        const numpadAtSend: boolean[] = [];
        page.sendToPanel = (msg: string): void => {
            lockAtSend.push(page.pinFailTimeout);
            numpadAtSend.push(msg.includes('~enable~'));
        };

        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        expect(numpadAtSend.at(-1), 'numpad disabled during the lockout').to.equal(false);

        // timer expires: the message that frees the numpad must see no lockout in the adapter
        await fire(activeTimers(timers)[0]);
        expect(numpadAtSend.at(-1), 'numpad enabled after the lockout').to.equal(true);
        expect(lockAtSend.at(-1)).to.equal(null);

        // a correct PIN right after that message is accepted
        await page.onButtonEvent({ action: 'A1', opt: '1234' });
        expect(page.failCount).to.equal(0);
        expect(page.status).to.equal('armed');
    });

    it('caps the timer at the largest setTimeout value and shows that wait', async () => {
        const { page, timers, sent, warns } = createLockPage('alarm', 'disarmed');
        page.failCount = 40;

        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        expect(page.failCount).to.equal(41);
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([MAX_TIMEOUT_MS]);
        expect(sent.at(-1)).to.include(' 2147483 s');
        expect(warns.at(-1)).to.equal('Wrong pin entered. try 41! Delay next attempt by 2147483 seconds');

        // still rejected during the capped lockout
        await page.onButtonEvent({ action: 'A1', opt: '1234' });
        expect(page.failCount).to.equal(42);
        expect(page.status).to.equal('disarmed');
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([MAX_TIMEOUT_MS]);
    });

    it('keeps the last uncapped wait below the limit', async () => {
        const { page, timers } = createLockPage('alarm', 'disarmed');
        page.failCount = 20;

        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([2 ** 21 * 1000]);
        await page.onButtonEvent({ action: 'A1', opt: '0000' });
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([MAX_TIMEOUT_MS]);
    });

    it('protects the unlock page (U1) the same way', async () => {
        const { page, timers, sent, warns } = createLockPage('unlock', 'armed');
        const setStatus = sinon.spy(page, 'setStatus');

        await page.onButtonEvent({ action: 'U1', opt: '0000' });
        expect(page.failCount).to.equal(1);
        expect(sent.at(-1)).to.include('locked_for').and.include(' 2 s');

        await page.onButtonEvent({ action: 'U1', opt: '1234' });
        expect(setStatus.called, 'correct PIN must not unlock during the lockout').to.equal(false);
        expect(page.failCount).to.equal(2);
        expect(activeTimers(timers).map(t => t.ms)).to.deep.equal([4000]);
        expect(sent.at(-1)).to.include(' 4 s');
        expect(warns.at(-1)).to.include('PIN attempt during lockout rejected. try 2!');

        await fire(activeTimers(timers)[0]);
        await page.onButtonEvent({ action: 'U1', opt: '1234' });
        expect(setStatus.called).to.equal(true);
        expect(page.failCount).to.equal(0);
    });

    it('still aborts on triggered before the lockout check', async () => {
        const { page, timers } = createLockPage('alarm', 'triggered');

        await page.onButtonEvent({ action: 'D1', opt: '0000' });
        expect(page.failCount).to.equal(0);
        expect(timers).to.have.length(0);
    });
});
