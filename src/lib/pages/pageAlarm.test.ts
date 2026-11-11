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
