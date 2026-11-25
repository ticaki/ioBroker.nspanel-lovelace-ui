/**
 * Pinned screensaver indicators (admin `pinned`, page item `pinnedSlot`): a pinned item keeps its slot, hidden it
 * leaves the slot empty, the other items (shown ones and fillers) skip every pinned slot. When paging, the pins stay
 * on every window and only the other items page through the free slots. A pin outside the slots counts as no pin.
 */
import { expect } from 'chai';
import { Screensaver } from './screensaver';

const noop = (): void => undefined;

type ItemOptions = {
    /** slot the item is pinned to */
    pinnedSlot?: number;
    /** false: hidden */
    shown?: boolean;
    /** hidden item fills free slots */
    filler?: boolean;
    /** numeric enabled (overwrite to this slot) */
    overwrite?: number;
    /** long press opens a page */
    navi?: boolean;
};

/**
 * An indicator with the payload `type~id~icon~color~name~value` like PageItem.getPageItemPayload
 *
 * @param n index of the item, also its id `0?n`
 * @param o options of the item
 */
function item(n: number, o: ItemOptions = {}): any {
    const data: Record<string, unknown> = {};
    if (o.navi) {
        data.setNaviLongPress = { type: 'const', constVal: 'main' };
    }
    if (o.overwrite !== undefined) {
        const slot = o.overwrite;
        data.enabled = { getNumber: async (): Promise<number> => Promise.resolve(slot), type: 'const' };
    }
    const config: Record<string, unknown> = { type: 'button', modeScr: 'indicator' };
    if (o.pinnedSlot !== undefined) {
        config.pinnedSlot = o.pinnedSlot;
    }
    if (o.filler) {
        config.fillIfBelowMin = true;
    }
    return {
        id: `0?${n}`,
        config,
        dataItems: { type: 'button', data },
        isEnabled: async (): Promise<boolean> => Promise.resolve(o.shown !== false),
        getPageItemPayload: async (): Promise<string> => Promise.resolve(`button~0?${n}~i${n}~${n}~n${n}~v${n}`),
    };
}

/**
 * A bare screensaver (eu: screensaver5 7 indicator slots, screensaver2 5)
 *
 * @param pageItems items of the page
 * @param card screensaver2 (advanced) or screensaver5 (tiles)
 */
function saver(pageItems: any[], card: 'screensaver2' | 'screensaver5' = 'screensaver5'): Screensaver {
    const s = Object.create(Screensaver.prototype) as Screensaver;
    Object.assign(s, {
        pageItems,
        card,
        config: { card, mode: card === 'screensaver2' ? 'advanced' : 'tiles', model: 'eu' },
        step: 0,
        unload: false,
        name: '#scr',
        id: '0',
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { unload: false, setTimeout: (): number => 1, clearTimeout: noop },
        basePanel: { name: 'A0', isVirtual: false, meetsVersion: (): boolean => true },
    });
    return s;
}

/**
 * ids of the indicator slots that are sent ('' = empty slot) and the long press mask
 *
 * @param s the screensaver
 */
async function slots(s: Screensaver): Promise<{ ids: string[]; payloads: string[]; mask: boolean[] }> {
    const message = await s.getData(['indicator']);
    const payloads = message!.options.indicator;
    return {
        ids: payloads.map(p => p.split('~')[1]),
        payloads,
        mask: message!.indicatorLongPress ?? [],
    };
}

describe('lib/pages/screensaver - pinned indicators', () => {
    it('without a pin the items fill the slots from the first one on (unchanged)', async () => {
        const items = [item(0), item(1, { shown: false }), item(2), item(3, { shown: false, filler: true })];
        const { ids } = await slots(saver(items));
        expect(ids).to.deep.equal(['0?0', '0?2', '0?3', '', '', '', '']);
    });

    it('a shown pinned item stands on its slot, the others fill the slots before it', async () => {
        const items = [item(0), item(1), item(2, { pinnedSlot: 4 })];
        const { ids } = await slots(saver(items));
        expect(ids).to.deep.equal(['0?0', '0?1', '', '', '0?2', '', '']);
    });

    it('a hidden pinned item leaves its slot empty - nothing moves up', async () => {
        const items = [item(0), item(1, { pinnedSlot: 1, shown: false }), item(2), item(3)];
        const { ids, payloads } = await slots(saver(items));
        expect(ids).to.deep.equal(['0?0', '', '0?2', '0?3', '', '', '']);
        expect(payloads[1]).to.equal('~~~~~');
    });

    it('a hidden pinned item that would fill keeps its slot empty as well', async () => {
        const items = [item(0), item(1, { pinnedSlot: 1, shown: false, filler: true })];
        const { ids } = await slots(saver(items));
        expect(ids).to.deep.equal(['0?0', '', '', '', '', '', '']);
    });

    it('items behind a pin in the list skip the pinned slot', async () => {
        // the pinned item comes last in the list but its slot is in the middle
        const items = [item(0), item(1), item(2), item(9, { pinnedSlot: 2 })];
        const { ids } = await slots(saver(items));
        expect(ids).to.deep.equal(['0?0', '0?1', '0?9', '0?2', '', '', '']);
    });

    it('several pins: shown and hidden slots are both skipped', async () => {
        const items = [item(0, { pinnedSlot: 0, shown: false }), item(1), item(2, { pinnedSlot: 2 }), item(3), item(4)];
        const { ids } = await slots(saver(items));
        expect(ids).to.deep.equal(['', '0?1', '0?2', '0?3', '0?4', '', '']);
    });

    it('fillers skip the pinned slot and fill only the free slots', async () => {
        // screensaver2: 5 slots - 1 pinned (hidden), 2 shown, so 2 fillers of 3
        const items = [
            item(0),
            item(1, { pinnedSlot: 1, shown: false }),
            item(2, { shown: false, filler: true }),
            item(3),
            item(4, { shown: false, filler: true }),
            item(5, { shown: false, filler: true }),
        ];
        const { ids } = await slots(saver(items, 'screensaver2'));
        expect(ids).to.deep.equal(['0?0', '', '0?2', '0?3', '0?4']);
    });

    it('a pin outside the slots of the model counts as no pin', async () => {
        const items = [item(0, { pinnedSlot: 5 }), item(1, { pinnedSlot: 6, shown: false }), item(2)];
        const { ids } = await slots(saver(items, 'screensaver2'));
        expect(ids).to.deep.equal(['0?0', '0?2', '', '', '']);
    });

    it('paging: the pin stands on every window, the others page through the free slots', async () => {
        // screensaver5 eu: 7 slots, pin on slot 3, 10 items that are not pinned -> 6 free slots, 2 windows
        const items = [item(99, { pinnedSlot: 3 })];
        for (let i = 1; i <= 10; i++) {
            items.push(item(i));
        }
        const s = saver(items);
        expect((await slots(s)).ids).to.deep.equal(['0?1', '0?2', '0?3', '0?99', '0?4', '0?5', '0?6']);
        (s as any).step = 1;
        expect((await slots(s)).ids).to.deep.equal(['0?7', '0?8', '0?9', '0?99', '0?10', '', '']);
        (s as any).step = 2;
        expect((await slots(s)).ids).to.deep.equal(['0?1', '0?2', '0?3', '0?99', '0?4', '0?5', '0?6']);
    });

    it('paging: a hidden pin stays empty on every window, its slot does not count as free', async () => {
        // screensaver2: 5 slots, hidden pin on slot 0 -> 4 free slots for 5 items, 2 windows
        const items = [item(0, { pinnedSlot: 0, shown: false })];
        for (let i = 1; i <= 5; i++) {
            items.push(item(i));
        }
        const s = saver(items, 'screensaver2');
        expect((await slots(s)).ids).to.deep.equal(['', '0?1', '0?2', '0?3', '0?4']);
        (s as any).step = 1;
        expect((await slots(s)).ids).to.deep.equal(['', '0?5', '', '', '']);
    });

    it('paging: the long press mask follows the slots of the window that is sent', async () => {
        const items = [item(0, { pinnedSlot: 1, navi: true })];
        for (let i = 1; i <= 6; i++) {
            items.push(item(i, { navi: i === 5 }));
        }
        const s = saver(items, 'screensaver2');
        const first = await slots(s);
        expect(first.ids).to.deep.equal(['0?1', '0?0', '0?2', '0?3', '0?4']);
        expect(first.mask).to.deep.equal([false, true, false, false, false]);
        (s as any).step = 1;
        const second = await slots(s);
        expect(second.ids).to.deep.equal(['0?5', '0?0', '0?6', '', '']);
        expect(second.mask).to.deep.equal([true, true, false, false, false]);
    });

    it('paging without a pin is unchanged', async () => {
        const items = [];
        for (let i = 0; i < 7; i++) {
            items.push(item(i, i === 6 ? { pinnedSlot: 5 } : {}));
        }
        // the pin on slot 5 is outside the 5 slots of screensaver2: paging as without pins
        const s = saver(items, 'screensaver2');
        expect((await slots(s)).ids).to.deep.equal(['0?0', '0?1', '0?2', '0?3', '0?4']);
        (s as any).step = 1;
        expect((await slots(s)).ids).to.deep.equal(['0?5', '0?6', '', '', '']);
    });

    it('a numeric enabled wins over a pin and over the pinned slot', async () => {
        const items = [item(0, { pinnedSlot: 3, overwrite: 1 }), item(1, { pinnedSlot: 2 }), item(2, { overwrite: 2 })];
        const { ids } = await slots(saver(items));
        // 0 is shown by its overwrite on slot 1, 2 overwrites the pinned slot 2
        expect(ids).to.deep.equal(['', '0?0', '0?2', '', '', '', '']);
    });

    it('the long press mask follows the slots that are sent', async () => {
        const items = [item(0, { navi: true }), item(1, { pinnedSlot: 1, shown: false }), item(2, { navi: true })];
        items.push(item(3, { pinnedSlot: 5, navi: true }));
        const { ids, mask } = await slots(saver(items));
        expect(ids).to.deep.equal(['0?0', '', '0?2', '', '', '0?3', '']);
        expect(mask).to.deep.equal([true, false, true, false, false, true, false]);
    });

    it('placePinnedIndicators: null without a valid pin', () => {
        const c = [{ idx: 0, payload: 'a', isFiller: false, item: 'a', pinnedSlot: 9 }];
        expect(Screensaver.placePinnedIndicators(c, 5, [], [])).to.equal(null);
        expect(Screensaver.placePinnedIndicators([{ ...c[0], pinnedSlot: 2 }], 5, [], [])).to.deep.equal({
            payloads: ['', '', 'a', '', ''],
            items: [undefined, undefined, 'a', undefined, undefined],
        });
    });
});
