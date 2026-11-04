/**
 * A blind as screensaver element at runtime: the payload of a bottom / indicator place (icon by position,
 * position in %) and a tap on the indicator - only the configured action, never a popup, never a write
 * on the blind.
 *
 * The data items are built like ConfigManager.getEntityData builds them for a blind
 * (config-manager-screensaver-blind.test.ts checks that part).
 */
import { expect } from 'chai';
import { PageItem } from './pageItem';
import { Screensaver } from './screensaver';
import { Dataitem } from '../controller/data-item';
import { Icons } from '../const/icon_mapping';
import { Color } from '../const/Color';
import { getShutterIconByPosition, SHUTTER_POSITION_ICON } from '../const/page-item-defaults';
import type * as Types from '../types/types';

const noop = (): void => undefined;
const adapter: any = {
    log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
    config: { testCase: false },
    library: { getTranslation: (s: string): string => s },
    language: 'de',
    controller: { statesControler: { activateTrigger: async (): Promise<void> => undefined } },
};

const ON = { r: 0, g: 200, b: 0 };
const OFF = { r: 200, g: 0, b: 0 };

function constItem(constVal: unknown): Dataitem {
    return new Dataitem(adapter, { type: 'const', constVal } as any, {} as any, {} as any);
}

type Calls = { writes: string[]; navigate: string[]; popups: string[]; sent: string[] };

/**
 * the value of the blind: a writable state - a tap must not touch it
 *
 * @param raw raw value of the state
 * @param calls receives the writes
 */
function blindValue(raw: number, calls: Calls): Dataitem {
    const value = constItem(raw);
    Object.defineProperty(value, 'writeable', { get: (): boolean => true });
    Object.assign(value, {
        setStateFlip: async (): Promise<void> => {
            calls.writes.push('flip');
        },
        setStateTrue: async (): Promise<void> => {
            calls.writes.push('true');
        },
        setState: async (v: unknown): Promise<void> => {
            calls.writes.push(`set:${String(v)}`);
        },
    });
    return value;
}

function entity(value: Dataitem, closedIsZero: boolean): Record<string, Dataitem> {
    return {
        value,
        minScale: constItem(closedIsZero ? 0 : 100),
        maxScale: constItem(closedIsZero ? 100 : 0),
        unit: constItem('%'),
        decimal: constItem(0),
    };
}

function blindItem(
    modeScr: 'bottom' | 'indicator',
    raw: number,
    opts: { closedIsZero?: boolean; navi?: string } = {},
): { item: PageItem; calls: Calls; parent: any } {
    const calls: Calls = { writes: [], navigate: [], popups: [], sent: [] };
    const value = blindValue(raw, calls);
    const data: Record<string, unknown> = {
        entity1: entity(value, !!opts.closedIsZero),
        entity2: entity(value, !!opts.closedIsZero),
        icon: {
            true: { value: constItem(SHUTTER_POSITION_ICON), color: constItem(ON) },
            false: { color: constItem(OFF) },
        },
        text: { true: constItem('Küche') },
    };
    if (opts.navi) {
        data.setNavi = constItem(opts.navi);
    }
    const parent: any = {
        card: 'screensaver5',
        isScreensaver: true,
        screensaverIndicatorButtons: true,
        basePanel: {
            navigation: {
                setTargetPageByName: async (name: string): Promise<void> => {
                    calls.navigate.push(name);
                },
                resetPosition: noop,
                setCurrentPage: async (): Promise<void> => undefined,
            },
        },
    };
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: '0?3',
        log: adapter.log,
        adapter,
        library: adapter.library,
        config: { modeScr, type: modeScr === 'indicator' ? 'button' : 'text', role: 'blind' },
        dataItems: { type: modeScr === 'indicator' ? 'button' : 'text', role: 'blind', data },
        parent,
        timeouts: {},
    });
    const generatePopup = item.GeneratePopup.bind(item);
    item.GeneratePopup = async (mode: Types.PopupType): Promise<string | null> => {
        const msg = await generatePopup(mode);
        if (msg) {
            calls.popups.push(mode);
        }
        return msg;
    };
    return { item, calls, parent };
}

const icon = (position: number): string => Icons.GetIcon(getShutterIconByPosition(position));
const color = (c: { r: number; g: number; b: number }): string => String(Color.rgb_dec565(c));

describe('lib/pages - blind as screensaver element: payload', () => {
    // raw state value -> position on the panel (0 = closed, 100 = open)
    const cases: { raw: number; closedIsZero: boolean; position: number }[] = [
        { raw: 0, closedIsZero: true, position: 0 },
        { raw: 25, closedIsZero: true, position: 25 },
        { raw: 50, closedIsZero: true, position: 50 },
        { raw: 75, closedIsZero: true, position: 75 },
        { raw: 100, closedIsZero: true, position: 100 },
        // shutterClosedIsZero off: the state counts closed = 100
        { raw: 100, closedIsZero: false, position: 0 },
        { raw: 75, closedIsZero: false, position: 25 },
        { raw: 50, closedIsZero: false, position: 50 },
        { raw: 25, closedIsZero: false, position: 75 },
        { raw: 0, closedIsZero: false, position: 100 },
    ];
    for (const c of cases) {
        it(`bottom: state ${c.raw} (shutterClosedIsZero ${c.closedIsZero}) -> icon and value of position ${c.position} %`, async () => {
            const { item } = blindItem('bottom', c.raw, { closedIsZero: c.closedIsZero });
            const payload = await item.getPageItemPayload();
            const expected = ['text', '0?3', icon(c.position), color(c.position ? ON : OFF), 'Küche', `${c.position}%`];
            expect(payload).to.equal(expected.join('~'));
        });
    }

    it('the five icons differ', () => {
        const names = [0, 25, 50, 75, 100].map(p => getShutterIconByPosition(p));
        expect(new Set(names).size).to.equal(5);
    });

    it('indicator: icon by position', async () => {
        const { item } = blindItem('indicator', 30, { closedIsZero: true });
        const payload = (await item.getPageItemPayload()).split('~');
        expect(payload[0]).to.equal('button');
        expect(payload[2]).to.equal(icon(30));
        expect(payload[3]).to.equal(color(ON));
    });
});

describe('lib/pages - blind as screensaver element: indicator tap', () => {
    function saverWith(item: PageItem, calls: Calls): Screensaver {
        const saver = Object.create(Screensaver.prototype) as Screensaver;
        const pageItems: any[] = [];
        for (let i = 0; i < 3; i++) {
            pageItems.push({ config: {} });
        }
        pageItems.push(item);
        Object.assign(saver, {
            pageItems,
            screensaverIndicatorButtons: true,
            unload: false,
            card: 'screensaver5',
            name: '#scr',
            id: '0',
            log: adapter.log,
            adapter: { unload: false, setTimeout: (): number => 1 },
            library: { writedp: async (): Promise<void> => undefined },
            basePanel: { name: 'A0_B7_65_54_C0_70', lastCard: '' },
            sendToPanel: (msg: string): void => {
                calls.sent.push(msg);
            },
        });
        return saver;
    }

    async function tap(saver: Screensaver, popup?: string): Promise<void> {
        const event: Types.IncomingEvent = {
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            id: '3',
            action: 'button',
            opt: '',
            popup,
        };
        await saver.onPopupRequest(event.id, popup as Types.PopupType, event.action, event.opt, event);
        await saver.onButtonEvent(event);
    }

    it('without action: no write on the blind, no popup, no navigation', async () => {
        const { item, calls } = blindItem('indicator', 40);
        const saver = saverWith(item, calls);
        await tap(saver);
        expect(calls.writes).to.deep.equal([]);
        expect(calls.popups).to.deep.equal([]);
        expect(calls.sent).to.deep.equal([]);
        expect(calls.navigate).to.deep.equal([]);
    });

    it('a shutter popup request of the panel gives no popup', async () => {
        const { item, calls } = blindItem('indicator', 40);
        const saver = saverWith(item, calls);
        await saver.onPopupRequest('3', 'popupShutter', undefined, undefined, null);
        await saver.onPopupRequest('3', 'popupShutter2', undefined, undefined, null);
        expect(calls.popups).to.deep.equal([]);
        expect(calls.sent).to.deep.equal([]);
        expect(calls.writes).to.deep.equal([]);
    });

    it('with navigation: only navigates', async () => {
        const { item, calls } = blindItem('indicator', 40, { navi: 'kueche' });
        const saver = saverWith(item, calls);
        await tap(saver);
        expect(calls.navigate).to.deep.equal(['kueche']);
        expect(calls.writes).to.deep.equal([]);
        expect(calls.popups).to.deep.equal([]);
    });
});
