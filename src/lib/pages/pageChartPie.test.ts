import { expect } from 'chai';
import { PageChartPie } from './pageChartPie';
import { PIE_TARGET_SUM } from './pie-scale';

/**
 * A data item as the page uses it: a const value or a state value, read through the few getters
 * the pie page calls.
 */
type FakeItem = {
    options: { type: string; dp?: string; constVal?: unknown };
    getNumber: () => Promise<number | null>;
    getString: () => Promise<string | null>;
    getTranslatedString: () => Promise<string | null>;
    getRGBDec: () => Promise<string | null>;
    getObject: () => Promise<unknown>;
};

/**
 * @param value the value the item delivers
 * @param dp state id, missing = const item
 */
function item(value: string | number | null, dp?: string): FakeItem {
    const options = dp ? { type: 'state', dp } : { type: 'const', constVal: value };
    const str = (): Promise<string | null> => Promise.resolve(value == null ? null : String(value));
    return {
        options,
        getNumber: () => Promise.resolve(typeof value === 'number' ? value : value == null ? null : Number(value)),
        getString: str,
        getTranslatedString: str,
        getRGBDec: () => Promise.resolve(typeof value === 'string' && /^\d+$/.test(value) ? value : null),
        getObject: () => Promise.resolve(value),
    };
}

type Fake = {
    page: PageChartPie;
    warnings: string[];
    historyCalls: { id: string; start: number; end: number }[];
    history: Record<string, unknown[] | null | Error>;
    objects: Record<string, { name?: unknown; unit?: string }>;
};

/**
 * Builds a pie page around its prototype - no panel, no adapter: only the pieces the update path touches.
 *
 * @param data the data items of the page (`pieItems.data`)
 * @param opts source and DB behaviour of the page
 * @param opts.scriptSource true = the page reads the script data point
 * @param opts.details DB instance and range = averaged slot source
 * @param opts.details.instance DB instance
 * @param opts.details.rangeKey range key
 * @param opts.details.hours hours of a custom range
 * @param opts.dbAlive alive state of the instance
 */
function fakePage(
    data: Record<string, unknown>,
    opts: {
        scriptSource?: boolean;
        details?: { instance: string; rangeKey: 'd1' | 'custom' | 'yesterday'; hours?: number };
        dbAlive?: boolean;
    } = {},
): Fake {
    const fake: Fake = {
        page: Object.create(PageChartPie.prototype),
        warnings: [],
        historyCalls: [],
        history: {},
        objects: {},
    };
    const page: any = fake.page;
    page.name = 'energie';
    page.pieItems = { card: 'cardPChart', data };
    page.scriptSource = !!opts.scriptSource;
    page.pieDetails = opts.details;
    page.sliceMeta = new Map();
    page.warned = new Set();
    page.log = { warn: (t: string) => fake.warnings.push(t), debug: () => undefined };
    page.library = { getTranslation: (key: string) => (key === 'pchart_other' ? 'Sonstiges' : key) };
    page.adapter = {
        language: 'de',
        getForeignStateAsync: async () => ({ val: opts.dbAlive !== false }),
        getForeignObjectAsync: async (id: string) =>
            fake.objects[id] ? { _id: id, common: { ...fake.objects[id] } } : null,
    };
    page.basePanel = { info: { nspanel: { model: 'eu' } } };
    page.getNavigation = (): string => 'button~bSubPrev~~~~~button~bSubNext~~~~';
    page.visibility = true;
    page.refreshInterval = 1000;
    page.sent = [];
    // pageType and entityUpd are recorded in order, so a pageType without a following payload would show
    page.sendType = (): void => page.sent.push('pageType');
    page.sendToPanel = (payload: string): void => page.sent.push(payload);
    page.lastPayload = undefined;
    page.chartTimeouts = new Map();
    page.adapter.setTimeout = (): undefined => undefined;
    page.adapter.clearTimeout = (): void => undefined;
    page.adapter.unload = false;
    page.unload = false;
    page.getDataFromDBWindow = async (id: string, start: number, end: number): Promise<unknown[] | null> => {
        fake.historyCalls.push({ id, start, end });
        const result = fake.history[id];
        if (result instanceof Error) {
            throw result;
        }
        return result ?? null;
    };
    return fake;
}

/**
 * The entityUpd the page would send, split into its fields.
 *
 * @param fake the fake page
 */
async function payloadFields(fake: Fake): Promise<string[]> {
    const page: any = fake.page;
    const message = await page.getUpdateMessage();
    return (page.getMessage(message) as string).split('~');
}

describe('lib/pages - PageChartPie', () => {
    const slots = {
        headline: item('Energie'),
        legendMode: item(1),
        decimals: item(2),
        slices: [
            { name: item('Netzbezug'), value: item(5.2, 'a.bezug'), unit: item('kWh'), color: item('63488') },
            { value: item(3.1, 'a.eigen'), color: item('2016') },
            { name: item('Einspeisung'), value: item(1.5, 'a.einspeisung'), unit: item('kWh'), color: item('2047') },
        ],
    };

    it('sends the legend mode in field 15, nothing in 14 and 16 and four fields per slice from 17 on', async () => {
        const fake = fakePage(slots);
        fake.objects['a.eigen'] = { name: { de: 'Eigennutzung', en: 'Self use' }, unit: 'kWh' };
        const fields = await payloadFields(fake);

        expect(fields.slice(0, 3)).to.deep.equal(['entityUpd', 'Energie', 'button']);
        // navigation takes fields 2-13; field 14 = color (unused), 15 = legend mode, 16 = ticks (empty)
        expect(fields[14]).to.equal('');
        expect(fields[15]).to.equal('1');
        expect(fields[16]).to.equal('');
        expect(fields.slice(17)).to.deep.equal([
            'Netzbezug',
            String(Math.round((5.2 / 9.8) * PIE_TARGET_SUM)),
            '5.20 kWh',
            '63488',
            'Eigennutzung',
            String(Math.round((3.1 / 9.8) * PIE_TARGET_SUM)),
            '3.10 kWh',
            '2016',
            'Einspeisung',
            String(Math.round((1.5 / 9.8) * PIE_TARGET_SUM)),
            '1.50 kWh',
            '2047',
        ]);
    });

    it('reads name and unit of the state only once and translates the name', async () => {
        const fake = fakePage(slots);
        let reads = 0;
        const page: any = fake.page;
        const inner = page.adapter.getForeignObjectAsync;
        page.adapter.getForeignObjectAsync = async (id: string): Promise<unknown> => {
            reads++;
            return inner(id);
        };
        page.library = { getTranslation: (key: string) => (key === 'Eigen' ? 'Eigennutzung' : key) };
        fake.objects['a.eigen'] = { name: 'Eigen', unit: 'Wh' };

        const first = await page.getPieSlices();
        const second = await page.getPieSlices();

        expect(first[1]).to.deep.equal({ name: 'Eigennutzung', value: 3.1, text: '3.10 Wh', color: '2016' });
        expect(second[1].name).to.equal('Eigennutzung');
        expect(reads).to.equal(3);
    });

    it('a slot value of null counts as 0 and keeps its legend line', async () => {
        const fake = fakePage({
            ...slots,
            slices: [{ name: item('A'), value: item(null, 'a.null'), color: item('1') }, slots.slices[0]],
        });
        const fields = await payloadFields(fake);

        expect(fields.slice(17, 21)).to.deep.equal(['A', '0', '0.00', '1']);
        expect(fields[22]).to.equal(String(PIE_TARGET_SUM));
    });

    describe('averaged over a range', () => {
        const details = { instance: 'influxdb.0', rangeKey: 'd1' as const };

        it('queries every slot sequentially and shows the average with the decimals of the page', async () => {
            const fake = fakePage(slots, { details });
            fake.history['a.bezug'] = [{ ts: 1, val: 4.25 }];
            fake.history['a.eigen'] = [
                { ts: 1, val: 2 },
                { ts: 2, val: 4 },
            ];
            fake.history['a.einspeisung'] = [{ ts: 1, val: 1 }];
            fake.objects['a.eigen'] = { unit: 'kWh' };
            const page: any = fake.page;

            const slices = await page.getPieSlices();

            expect(fake.historyCalls.map(c => c.id).sort()).to.deep.equal(['a.bezug', 'a.eigen', 'a.einspeisung']);
            // rolling range: 24 h back from now
            const call = fake.historyCalls[0];
            expect(call.end - call.start).to.equal(24 * 3_600_000);
            expect(Date.now() - call.end).to.be.below(5000);
            expect(slices.map((s: { value: number }) => s.value)).to.deep.equal([4.25, 3, 1]);
            expect(slices[0].text).to.equal('4.25 kWh');
            expect(slices[1].text).to.equal('3.00 kWh');
            expect(fake.warnings).to.deep.equal([]);
        });

        it('a row with val null is no value: the slot shows 0 and warns', async () => {
            const fake = fakePage(slots, { details });
            fake.history['a.bezug'] = [{ ts: 1, val: null }];
            fake.history['a.eigen'] = [
                { ts: 1, val: null },
                { ts: 2, val: 2 },
            ];
            fake.history['a.einspeisung'] = [{ ts: 1, val: '3.5' }];
            const page: any = fake.page;

            const slices = await page.getPieSlices();

            expect(slices.map((s: { value: number }) => s.value)).to.deep.equal([0, 2, 3.5]);
            expect(fake.warnings).to.have.length(1);
            expect(fake.warnings[0]).to.contain('a.bezug');
        });

        it('a slot without a history value shows 0 and warns once, the other slots stay', async () => {
            const fake = fakePage(slots, { details });
            fake.history['a.bezug'] = [{ ts: 1, val: 4 }];
            fake.history['a.eigen'] = null;
            fake.history['a.einspeisung'] = new Error('boom');
            const page: any = fake.page;

            const first = await page.getPieSlices();
            const second = await page.getPieSlices();

            expect(first.map((s: { value: number }) => s.value)).to.deep.equal([4, 0, 0]);
            expect(second.map((s: { value: number }) => s.value)).to.deep.equal([4, 0, 0]);
            expect(fake.warnings).to.have.length(2);
            expect(fake.warnings[0]).to.contain('a.eigen');
            expect(fake.warnings[1]).to.contain('a.einspeisung');

            // once a value arrives the warning is armed again
            fake.history['a.eigen'] = [{ ts: 1, val: 1 }];
            await page.getPieSlices();
            fake.history['a.eigen'] = null;
            await page.getPieSlices();
            expect(fake.warnings).to.have.length(3);
        });

        it('instance not alive: no query, all slots 0, one warning', async () => {
            const fake = fakePage(slots, { details, dbAlive: false });
            const page: any = fake.page;

            const slices = await page.getPieSlices();
            await page.getPieSlices();

            expect(fake.historyCalls).to.deep.equal([]);
            expect(slices.map((s: { value: number }) => s.value)).to.deep.equal([0, 0, 0]);
            expect(fake.warnings).to.have.length(1);
            expect(fake.warnings[0]).to.contain('influxdb.0');
        });

        it('a calendar range is queried with its fixed window, a custom range with its hours', async () => {
            const yesterday = fakePage(slots, { details: { instance: 'sql.0', rangeKey: 'yesterday' } });
            await (yesterday.page as any).getPieSlices();
            const call = yesterday.historyCalls[0];
            const endOfYesterday = new Date();
            endOfYesterday.setHours(0, 0, 0, 0);
            expect(call.end).to.equal(endOfYesterday.getTime());
            const startOfYesterday = new Date(endOfYesterday);
            startOfYesterday.setDate(startOfYesterday.getDate() - 1);
            expect(call.start).to.equal(startOfYesterday.getTime());

            const custom = fakePage(slots, { details: { instance: 'sql.0', rangeKey: 'custom', hours: 36 } });
            await (custom.page as any).getPieSlices();
            expect(custom.historyCalls[0].end - custom.historyCalls[0].start).to.equal(36 * 3_600_000);
        });

        it('a range without an instance warns once and shows 0', async () => {
            const fake = fakePage(slots, { details: { instance: '', rangeKey: 'd1' } });
            const page: any = fake.page;

            const slices = await page.getPieSlices();

            expect(slices.map((s: { value: number }) => s.value)).to.deep.equal([0, 0, 0]);
            expect(fake.warnings).to.have.length(1);
        });
    });

    describe('update', () => {
        it('sends the entityUpd while visible, the pageType right before it', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;

            await page.update();

            expect(page.sent).to.have.length(2);
            expect(page.sent[0]).to.equal('pageType');
            expect(page.sent[1].split('~')[1]).to.equal('Energie');
        });

        it('does not send a second update with the same data (the panel would redraw the pie for nothing)', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;

            await page.update();
            await page.update();
            await page.update();

            expect(page.sent).to.have.length(2);
        });

        it('sends again when a value changed', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;

            await page.update();
            page.pieItems.data.slices[0].value = item(9.9, 'a.bezug');
            await page.update();

            expect(page.sent).to.have.length(4);
            expect(page.sent[3]).to.contain('9.90 kWh');
            expect(page.sent[3]).to.not.equal(page.sent[1]);
        });

        it('sends again after the page became visible, even with the same data', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;

            await page.update();
            await page.update();
            expect(page.sent).to.have.length(2);

            // the panel showed another page meanwhile, the pie is drawn from scratch
            await page.onVisibilityChange(false);
            page.visibility = true;
            await page.onVisibilityChange(true);

            expect(page.sent).to.have.length(4);
            expect(page.sent[2]).to.equal('pageType');
            expect(page.sent[3]).to.equal(page.sent[1]);
        });

        it('every pageType (answered by renderCurrentPage) is followed by its entityUpd, nothing is sent alone', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;

            await page.update();
            await page.update();
            page.lastPayload = undefined;
            await page.update();

            expect(page.sent).to.have.length(4);
            for (let i = 0; i < page.sent.length; i += 2) {
                expect(page.sent[i]).to.equal('pageType');
                expect(page.sent[i + 1]).to.contain('entityUpd~Energie');
            }
        });

        it('forgets the last payload on delete', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;
            page.basePanel = {
                info: { nspanel: { model: 'eu' } },
                statesControler: { deletePageLoop: (): void => undefined },
            };

            await page.update();
            try {
                await page.delete();
            } catch {
                // the base delete touches panel internals the fake does not have - only the reset matters here
            }

            expect(page.lastPayload).to.equal(undefined);
        });

        it('does not send when the page became invisible while the data was read', async () => {
            const fake = fakePage(slots, { details: { instance: 'influxdb.0', rangeKey: 'd1' } });
            const page: any = fake.page;
            page.getDataFromDBWindow = async (): Promise<unknown[]> => {
                // the panel navigated away during the history query
                page.visibility = false;
                return [{ ts: 1, val: 1 }];
            };

            await page.update();

            expect(page.sent).to.deep.equal([]);
        });

        it('does nothing when it is not visible', async () => {
            const fake = fakePage(slots);
            const page: any = fake.page;
            page.visibility = false;

            await page.update();

            expect(page.sent).to.deep.equal([]);
        });
    });

    describe('script data point', () => {
        it('passes the text of the state through, scaled, and sums the rest up as "Sonstiges"', async () => {
            const seven = Array.from({ length: 7 }, (_, i) => `S${i + 1}~100~${i + 1} W~${i}`).join('~');
            const fake = fakePage(
                { headline: item('Skript'), legendMode: item(0), decimals: item(2), value: item(seven, 'x.pie') },
                { scriptSource: true },
            );
            const fields = await payloadFields(fake);

            expect(fields[1]).to.equal('Skript');
            expect(fields[15]).to.equal('0');
            const slices = fields.slice(17);
            expect(slices).to.have.length(20);
            expect(slices.slice(16)).to.deep.equal([
                'Sonstiges',
                String(Math.round((300 / 700) * PIE_TARGET_SUM)),
                '',
                '4',
            ]);
        });

        it('an empty state gives an empty slice list, an invalid legend mode gives 3', async () => {
            const fake = fakePage(
                { headline: item('Skript'), legendMode: item(9), value: item(null, 'x.pie') },
                { scriptSource: true },
            );
            const fields = await payloadFields(fake);

            expect(fields[15]).to.equal('3');
            expect(fields).to.have.length(18);
            expect(fields[17]).to.equal('');
        });
    });
});
