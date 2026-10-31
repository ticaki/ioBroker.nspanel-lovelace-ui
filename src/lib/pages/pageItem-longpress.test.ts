import { expect } from 'chai';
import { PageItem } from './pageItem';

interface Calls {
    navigate: string[];
    setTrue: number;
    flip: number;
}

/**
 * PageItem without constructor - only the fields onCommandLongPress touches.
 *
 * @param type dataItems type (button/switch)
 * @param opts which long press targets are configured
 * @param opts.navi target page for setNaviLongPress
 * @param opts.state configure a longPress state
 * @returns the item and the recorded calls
 */
function makeItem(
    type: 'button' | 'switch',
    opts: { navi?: string; state?: boolean },
): { item: PageItem; calls: Calls } {
    const noop = (): void => undefined;
    const calls: Calls = { navigate: [], setTrue: 0, flip: 0 };
    const item = Object.create(PageItem.prototype) as PageItem;
    const data: Record<string, unknown> = {};
    if (opts.navi !== undefined) {
        data.setNaviLongPress = { getString: async (): Promise<string> => opts.navi ?? '' };
    }
    if (opts.state) {
        data.longPress = {
            setStateTrue: async (): Promise<void> => {
                calls.setTrue++;
            },
            setStateFlip: async (): Promise<void> => {
                calls.flip++;
            },
        };
    }
    Object.assign(item, {
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        dataItems: { type, data },
        parent: {
            basePanel: {
                navigation: {
                    setTargetPageByName: async (name: string): Promise<void> => {
                        calls.navigate.push(name);
                    },
                },
            },
        },
    });
    return { item, calls };
}

describe('lib/pages/pageItem - onCommandLongPress', () => {
    for (const type of ['button', 'switch'] as const) {
        it(`${type}: long press with state only is handled (no short press afterwards)`, async () => {
            const { item, calls } = makeItem(type, { state: true });
            expect(await item.onCommandLongPress('button', '')).to.equal(true);
            expect(type === 'button' ? calls.setTrue : calls.flip).to.equal(1);
            expect(calls.navigate).to.deep.equal([]);
        });
        it(`${type}: long press with navigation only is handled`, async () => {
            const { item, calls } = makeItem(type, { navi: 'target' });
            expect(await item.onCommandLongPress('button', '')).to.equal(true);
            expect(calls.navigate).to.deep.equal(['target']);
        });
        it(`${type}: without long press target the short press stays active`, async () => {
            const { item } = makeItem(type, {});
            expect(await item.onCommandLongPress('button', '')).to.equal(false);
        });
    }
});
