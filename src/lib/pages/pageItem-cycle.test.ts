import { expect } from 'chai';
import { PageItem } from './pageItem';
import { Dataitem } from '../controller/data-item';

interface CycleFixture {
    item: PageItem;
    writes: unknown[];
    warnings: string[];
}

/**
 * PageItem without constructor - only the fields onCommand touches for a screensaver indicator. The target keeps the
 * written value as the value of the state.
 *
 * @param opts the item
 * @param opts.values values of the list
 * @param opts.type common.type of the state
 * @param opts.start value of the state
 * @param opts.pageItemType type of the page item
 * @param opts.writeable state can be written
 * @returns the item and what it wrote
 */
function makeItem(opts: {
    values: unknown;
    type: ioBroker.CommonType;
    start: ioBroker.StateValue;
    pageItemType?: 'button' | 'switch';
    writeable?: boolean;
}): CycleFixture {
    const noop = (): void => undefined;
    const writes: unknown[] = [];
    const warnings: string[] = [];
    let val = opts.start;
    const adapter: unknown = { log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop } };
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: 'test',
        log: {
            debug: noop,
            warn: (m: string): void => {
                warnings.push(m);
            },
            error: noop,
            info: noop,
            silly: noop,
        },
        parent: { isScreensaver: true, screensaverIndicatorButtons: true },
        dataItems: {
            type: opts.pageItemType ?? 'button',
            role: 'indicator',
            data: {
                setValue3: {
                    writeable: opts.writeable ?? true,
                    trueType: (): ioBroker.CommonType => opts.type,
                    getState: async (): Promise<{ val: ioBroker.StateValue }> => ({ val }),
                    setState: async (v: ioBroker.StateValue): Promise<void> => {
                        writes.push(v);
                        val = v;
                    },
                },
                // the real data item: the config manager stores the list as JSON text in a const
                valueList: new Dataitem(
                    adapter,
                    { type: 'const', constVal: JSON.stringify(opts.values) },
                    {} as never,
                    {} as never,
                ),
            },
        },
    });
    return { item, writes, warnings };
}

async function press(item: PageItem, times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
        await item.onCommand('button', '');
    }
}

describe('lib/pages/pageItem - button with a value list', () => {
    it('writes the next value and wraps after the last one', async () => {
        const { item, writes } = makeItem({ values: ['-1', '0', '1'], type: 'number', start: 0 });
        await press(item, 4);
        expect(writes).to.deep.equal([1, -1, 0, 1]);
    });
    it('a boolean state gets real booleans, "false" stays false', async () => {
        const { item, writes } = makeItem({ values: ['true', 'false'], type: 'boolean', start: false });
        await press(item, 3);
        expect(writes).to.deep.equal([true, false, true]);
    });
    it('repeated values are walked through in order', async () => {
        const { item, writes } = makeItem({ values: ['0', '1', '0', '-1'], type: 'number', start: -1 });
        await press(item, 5);
        expect(writes).to.deep.equal([0, 1, 0, -1, 0]);
    });
    it('one value is written on each press', async () => {
        const { item, writes } = makeItem({ values: ['5'], type: 'number', start: 5 });
        await press(item, 2);
        expect(writes).to.deep.equal([5, 5]);
    });
    it('a value changed from outside starts with the first entry', async () => {
        const { item, writes } = makeItem({ values: ['-1', '1'], type: 'number', start: 42 });
        await press(item, 1);
        expect(writes).to.deep.equal([-1]);
    });
    it('a value that does not fit is not written and gives a warning', async () => {
        const { item, writes, warnings } = makeItem({ values: ['abc'], type: 'number', start: 0 });
        await press(item, 1);
        expect(writes).to.deep.equal([]);
        expect(warnings.length).to.equal(1);
    });
    it('without a writable state or with a value list that is none the press goes on as before', async () => {
        for (const opts of [{ values: ['1'], writeable: false }, { values: [] }, { values: { a: 1 } }]) {
            const { item, writes } = makeItem({ type: 'number', start: 0, ...opts });
            await press(item, 1);
            expect(writes).to.deep.equal([]);
        }
    });
    it('another page item type with setValue3 is not touched', async () => {
        const { item, writes } = makeItem({ values: ['1'], type: 'number', start: 0, pageItemType: 'switch' });
        await press(item, 1);
        expect(writes).to.deep.equal([]);
    });
});
