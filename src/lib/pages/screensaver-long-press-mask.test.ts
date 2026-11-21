/**
 * Long press mask of the screensaver indicators (TFT 6.2.0, `HMI/tools/indicator_long_press_mask.py`): screensaver2 and
 * screensaver5 get one more field behind the last indicator slot of `weatherUpdate` - bit (N-1) for indicator N when
 * its long press does something. Only these indicators start the long press (timer, blinking clock, buttonPress3).
 * Also the long press "only trigger the state" (`longPressTrigger`).
 */
import { expect } from 'chai';
import { indicatorLongPressMask, INDICATOR_LONG_PRESS_MASK_MIN_VERSION, Screensaver } from './screensaver';
import type { PageItem } from './pageItem';
import type * as Types from '../types/types';

const noop = (): void => undefined;

type LongPress = 'none' | 'navi' | 'state' | 'popup' | 'trigger';

/**
 * A screensaver item with the payload `type~id~icon~color~name~value` like PageItem.getPageItemPayload
 *
 * @param modeScr place of the item
 * @param n index of the item, also its id `0?n`
 * @param longPress what its long press does
 * @param commands receives the commands of the item
 */
function item(modeScr: string | undefined, n: number, longPress: LongPress = 'none', commands: string[] = []): any {
    const data: Record<string, unknown> = {};
    if (longPress === 'navi') {
        data.setNaviLongPress = { type: 'const', constVal: 'main' };
    }
    if (longPress === 'state') {
        data.longPress = { type: 'state', dp: 'a.0.b' };
    }
    const config: Record<string, unknown> = { type: 'button' };
    if (modeScr) {
        config.modeScr = modeScr;
    }
    if (longPress === 'trigger') {
        config.longPressTrigger = true;
    }
    return {
        id: `0?${n}`,
        config,
        dataItems: { type: 'button', data },
        isEnabled: async (): Promise<boolean> => Promise.resolve(true),
        getPageItemPayload: async (): Promise<string> => Promise.resolve(`button~0?${n}~i${n}~${n}~n${n}~v${n}`),
        onCommand: async (action: string, value: string): Promise<boolean> => {
            commands.push(`${n}:${action}:${value}`);
            return true;
        },
        onCommandLongPress: async (): Promise<boolean> => {
            commands.push(`${n}:long`);
            return true;
        },
    };
}

/**
 * A bare screensaver
 *
 * @param pageItems items of the page
 * @param card screensaver2 (advanced) or screensaver5 (tiles)
 * @param panel web panel or the TFT version of a hardware panel
 * @param panel.isVirtual true: web panel
 * @param panel.version TFT version of a hardware panel
 * @param model panel model
 */
function saver(
    pageItems: any[],
    card: 'screensaver2' | 'screensaver5' | 'screensaver3' = 'screensaver5',
    panel: { isVirtual?: boolean; version?: string } = { version: '6.2.0' },
    model = 'eu',
): Screensaver {
    const s = Object.create(Screensaver.prototype) as Screensaver;
    const mode = card === 'screensaver2' ? 'advanced' : card === 'screensaver5' ? 'tiles' : 'easyview';
    Object.assign(s, {
        pageItems,
        card,
        config: { card, mode, model },
        step: 0,
        unload: false,
        name: '#scr',
        id: '0',
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { unload: false, setTimeout: (): number => 1, clearTimeout: noop },
        basePanel: {
            name: 'A0',
            isVirtual: panel.isVirtual === true,
            meetsVersion: (v: string): boolean =>
                !!panel.version && panel.version.localeCompare(v, undefined, { numeric: true }) >= 0,
        },
    });
    return s;
}

/**
 * The weatherUpdate the screensaver sends for its items
 *
 * @param s the screensaver
 */
async function weather(s: Screensaver): Promise<string[]> {
    const message = await s.getData(['left', 'bottom', 'indicator', 'alternate', 'favorit']);
    return s.weatherPayload(message!).split('~');
}

describe('lib/pages/screensaver - long press mask of the indicators', () => {
    it('bit N-1 for indicator N', () => {
        expect(INDICATOR_LONG_PRESS_MASK_MIN_VERSION).to.equal('6.2.0');
        expect(indicatorLongPressMask([])).to.equal(0);
        expect(indicatorLongPressMask([true])).to.equal(1);
        expect(indicatorLongPressMask([false, false, true, false, false, false, true])).to.equal(68);
        expect(indicatorLongPressMask(new Array(8).fill(true))).to.equal(255);
    });

    it('screensaver5 eu: field 73, only indicators with a long press, popup, page or trigger', async () => {
        const items = [
            item('bottom', 0),
            item('indicator', 1, 'none'),
            item('indicator', 2, 'navi'),
            item('indicator', 3, 'state'),
            item('indicator', 4, 'popup'),
            item('indicator', 5, 'trigger'),
            item(undefined, 6), // the internal item of the popup
        ];
        items[4].config.longPressPopup = 6;
        const fields = await weather(saver(items));
        // 1 + 12 slots x 6 fields, then the mask
        expect(fields).to.have.length(74);
        expect(fields[32]).to.equal('0?1');
        expect(fields[73]).to.equal(String(2 + 4 + 8 + 16));
    });

    it('a popup index that points to an item with a place is no long press', async () => {
        const items = [item('indicator', 0), item('bottom', 1)];
        items[0].config.longPressPopup = 1;
        expect((await weather(saver(items)))[73]).to.equal('0');
    });

    it('screensaver5 us-p: 4 bottom and 8 indicator slots, the mask is field 73 as well', async () => {
        const items = [item('bottom', 0)];
        for (let i = 1; i <= 8; i++) {
            items.push(item('indicator', i, i === 8 || i === 1 ? 'trigger' : 'none'));
        }
        const fields = await weather(saver(items, 'screensaver5', { version: '6.2.0' }, 'us-p'));
        expect(fields).to.have.length(74);
        expect(fields[26]).to.equal('0?1');
        expect(fields[68]).to.equal('0?8');
        expect(fields[73]).to.equal(String(1 + 128));
    });

    it('screensaver2: favorit, 3 left, 6 bottom, 5 indicator slots - the mask is field 91', async () => {
        const items = [item('favorit', 0), item('indicator', 1), item('indicator', 2), item('indicator', 3, 'navi')];
        const fields = await weather(saver(items, 'screensaver2'));
        expect(fields).to.have.length(92);
        expect(fields[62]).to.equal('0?1');
        expect(fields[74]).to.equal('0?3');
        expect(fields[91]).to.equal('4');
    });

    it('rotation: the bits follow the indicators of the window that is sent', async () => {
        const items = [];
        for (let i = 0; i < 9; i++) {
            items.push(item('indicator', i, i === 7 ? 'navi' : i === 1 ? 'trigger' : 'none'));
        }
        const s = saver(items);
        const first = await weather(s);
        expect(first[32]).to.equal('0?0');
        expect(first[73]).to.equal('2');
        (s as any).step = 1;
        const second = await weather(s);
        // window 2: indicators 7 and 8, the rest empty
        expect(second[32]).to.equal('0?7');
        expect(second[38]).to.equal('0?8');
        expect(second[44]).to.equal('');
        expect(second[73]).to.equal('1');
    });

    it('an overwrite by a numeric enabled takes its bit to the slot it is shown in', async () => {
        const items = [item('indicator', 0, 'navi'), item('indicator', 1)];
        items[0].dataItems.data.enabled = { getNumber: async (): Promise<number> => 2, type: 'const' };
        const s = saver(items);
        const message = await s.getData(['indicator']);
        const ids = message!.options.indicator.map(p => p.split('~')[1]);
        expect(message!.indicatorLongPress).to.have.length(7);
        expect(message!.indicatorLongPress![ids.indexOf('0?0')]).to.equal(true);
        expect(message!.indicatorLongPress![ids.indexOf('0?1')]).to.equal(false);
    });

    it('a TFT before 6.2.0 or without a known version gets no mask', async () => {
        const items = [item('indicator', 0, 'navi')];
        expect(await weather(saver(items, 'screensaver5', { version: '6.1.3' }))).to.have.length(73);
        expect(await weather(saver(items, 'screensaver2', { version: '6.1.3' }))).to.have.length(91);
        expect(await weather(saver(items, 'screensaver5', {}))).to.have.length(73);
        expect((await weather(saver(items, 'screensaver5', { version: '6.3.0' })))[73]).to.equal('1');
    });

    it('a web panel always gets the mask, behind its own slots (web-l tiles: 7 bottom, 11 indicators)', async () => {
        const items = [item('indicator', 0), item('indicator', 1, 'navi')];
        const fields = await weather(saver(items, 'screensaver5', { isVirtual: true }, 'web-l'));
        expect(fields).to.have.length(1 + 18 * 6 + 1);
        expect(fields[fields.length - 1]).to.equal('2');
    });

    it('the other screensavers get no mask', async () => {
        const items = [item('bottom', 0)];
        const fields = await weather(saver(items, 'screensaver3', { version: '6.2.0' }));
        expect(fields).to.have.length(1 + 4 * 6);
    });
});

describe('lib/pages/screensaver - long press "only trigger the state"', () => {
    const longPress: Types.IncomingEvent = {
        type: 'event',
        method: 'buttonPress3',
        page: 0,
        id: '1',
        action: 'button',
        opt: '1',
    };

    it('writes buttons.indicatorLong-N only, runs no command and no tap', async () => {
        const commands: string[] = [];
        const writes: string[] = [];
        const s = saver([item('indicator', 0, 'none', commands), item('indicator', 1, 'trigger', commands)]);
        Object.assign(s, {
            library: {
                writedp: async (id: string, val: unknown): Promise<void> => {
                    writes.push(`${id}=${String(val)}`);
                },
            },
            onTouch: (): void => {
                commands.push('touch');
            },
        });
        const indicator: PageItem = s.pageItems![1]!;
        expect(s.supportsIndicatorLongPress(indicator)).to.equal(true);
        expect(s.hasIndicatorLongPress(indicator)).to.equal(false);
        expect(await s.onIndicatorLongPress(longPress)).to.equal(true);
        expect(writes).to.deep.equal(['panels.A0.buttons.indicatorLong-2=true']);
        expect(commands).to.deep.equal([]);
    });

    it('an indicator without a long press: the state is written, the caller treats it like a tap', async () => {
        const writes: string[] = [];
        const s = saver([item('indicator', 0), item('indicator', 1)]);
        Object.assign(s, {
            library: {
                writedp: async (id: string): Promise<void> => {
                    writes.push(id);
                },
            },
        });
        expect(s.supportsIndicatorLongPress(s.pageItems![1])).to.equal(false);
        expect(await s.onIndicatorLongPress(longPress)).to.equal(false);
        expect(writes).to.deep.equal(['panels.A0.buttons.indicatorLong-2']);
    });
});

describe('lib/pages/screensaver - indicator press on a dark display (standby brightness 0)', () => {
    /**
     * @param standby active standby brightness
     * @param notification a notification stands on the HMI
     */
    function dark(standby: number, notification = false): Screensaver {
        const s = saver([item('indicator', 0, 'navi')]);
        Object.assign(s, {
            activeNotification: notification,
            notifyHidden: false,
            wakeTapRun: false,
            lastSent: new Map(),
            weatherDropped: false,
            colorsDropped: false,
        });
        Object.assign((s as any).basePanel, { dim: { dayMode: true, standby, nightStandby: 50 } });
        return s;
    }

    it('the first press (opt 1) only wakes, with or without a notification', () => {
        expect(dark(0).onIndicatorWakeTap('1')).to.equal(true);
        expect(dark(0, true).onIndicatorWakeTap('1')).to.equal(true);
        expect(dark(0).onIndicatorWakeTap('0')).to.equal(true);
    });

    it('the second press, a display that is not dark and an old TFT without tap count are no wake tap', () => {
        expect(dark(0).onIndicatorWakeTap('2')).to.equal(false);
        expect(dark(10).onIndicatorWakeTap('1')).to.equal(false);
        expect(dark(0).onIndicatorWakeTap('')).to.equal(false);
    });

    it('like a background tap with opt 1 it starts the wake run of a notification: the next bExit takes it away', () => {
        const s = dark(0, true);
        expect(s.onIndicatorWakeTap('1')).to.equal(true);
        expect((s as any).wakeTapRun).to.equal(true);
        expect(s.onExitTap('2')).to.equal('dismiss');
        const without = dark(0);
        without.onIndicatorWakeTap('1');
        expect((without as any).wakeTapRun).to.equal(false);
    });
});
