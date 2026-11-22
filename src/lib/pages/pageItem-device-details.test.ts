import { expect } from 'chai';
import { PageItem } from './pageItem';
import { DEVICE_DETAIL_ROW_ROLE } from '../types/deviceDetails';

interface Calls {
    opened: unknown[];
    sent: string[];
    setTrue: number;
    flip: number;
    written: unknown[];
}

/**
 * PageItem without constructor - only the fields the device details touch.
 *
 * @param opts what the item is
 * @param opts.type dataItems type
 * @param opts.role dataItems role
 * @param opts.data dataItems data
 * @param opts.deviceDetails config.deviceDetails
 * @returns the item and the recorded calls
 */
function makeItem(opts: { type: string; role?: string; data?: Record<string, unknown>; deviceDetails?: unknown }): {
    item: PageItem;
    calls: Calls;
    parent: Record<string, any>;
    data: Record<string, unknown>;
} {
    const noop = (): void => undefined;
    const calls: Calls = { opened: [], sent: [], setTrue: 0, flip: 0, written: [] };
    const item = Object.create(PageItem.prototype) as PageItem;
    const data: Record<string, unknown> = opts.data ?? {};
    const parent: Record<string, any> = {
        isScreensaver: false,
        sleep: false,
        card: 'cardEntities',
        basePanel: { lastCard: 'cardEntities' },
    };
    Object.assign(item, {
        id: 'dd_3?2',
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        config: { type: opts.type, deviceDetails: opts.deviceDetails },
        dataItems: { type: opts.type, role: opts.role, data },
        parent,
        timeouts: {},
        unload: false,
        // runs the debounce timer of number-set at once
        adapter: {
            unload: false,
            setTimeout: (cb: (v: unknown) => void, _ms: number, v: unknown): number => {
                cb(v);
                return 1;
            },
            clearTimeout: noop,
        },
        openDeviceDetails: async (details: unknown): Promise<void> => {
            calls.opened.push(details);
            return Promise.resolve();
        },
        getPageItemPayload: async (): Promise<string> => Promise.resolve('number~dd_3?2~ICON~123~Delay~5 s'),
        resetLastMessage: noop,
        sendToPanel: (payload: string): void => {
            calls.sent.push(payload);
        },
    });
    return { item, calls, parent, data };
}

function dataitem(
    calls: Calls,
    opts: { writeable: boolean; type?: string },
): {
    writeable: boolean;
    trueType: () => string | undefined;
    setStateTrue: () => Promise<void>;
    setStateFlip: () => Promise<void>;
    setState: (v: unknown) => Promise<void>;
} {
    return {
        writeable: opts.writeable,
        trueType: () => opts.type,
        setStateTrue: async () => {
            calls.setTrue++;
            return Promise.resolve();
        },
        setStateFlip: async () => {
            calls.flip++;
            return Promise.resolve();
        },
        setState: async (v: unknown) => {
            calls.written.push(v);
            return Promise.resolve();
        },
    };
}

describe('lib/pages/pageItem - device with details', () => {
    it('a long press opens the detail page before any other long press of the item', async () => {
        const details = { deviceId: 'shelly.0.x', entries: [] };
        const { item, calls } = makeItem({ type: 'switch', deviceDetails: details, data: { longPress: {} } });
        expect(await item.onCommandLongPress('button', '')).to.equal(true);
        expect(calls.opened).to.deep.equal([details]);
    });
    it('an item without device keeps its old long press behaviour', async () => {
        const { item, calls } = makeItem({ type: 'switch' });
        expect(await item.onCommandLongPress('button', '')).to.equal(false);
        expect(calls.opened).to.deep.equal([]);
    });

    describe('taps on the rows of the detail page', () => {
        it('a writable boolean is a switch: OnOff writes the value', async () => {
            const { item, calls, data } = makeItem({ type: 'switch', role: DEVICE_DETAIL_ROW_ROLE });
            Object.assign(data, {
                entity1: { value: dataitem(calls, { writeable: true, type: 'boolean' }) },
            });
            await item.onCommand('OnOff', '0');
            await item.onCommand('OnOff', '1');
            expect(calls.written).to.deep.equal([false, true]);
        });
        it('a read only boolean or a text does nothing', async () => {
            const { item, calls, data } = makeItem({ type: 'text', role: DEVICE_DETAIL_ROW_ROLE });
            Object.assign(data, {
                entity1: { value: dataitem(calls, { writeable: false, type: 'boolean' }) },
            });
            await item.onCommand('button', '');
            const text = makeItem({ type: 'text', role: DEVICE_DETAIL_ROW_ROLE });
            Object.assign(text.data, { entity2: { value: dataitem(calls, { writeable: true }) } });
            await text.item.onCommand('button', '');
            expect(calls.flip + calls.setTrue).to.equal(0);
        });
        it('a button (read: false) is written with true', async () => {
            const { item, calls, data } = makeItem({ type: 'button', role: DEVICE_DETAIL_ROW_ROLE });
            Object.assign(data, { entity1: { set: dataitem(calls, { writeable: true }) } });
            await item.onCommand('button', '');
            expect(calls.setTrue).to.equal(1);
            expect(calls.flip).to.equal(0);
        });
        for (const type of ['number', 'string']) {
            it(`a writable ${type} with common.states: the choice of popupInSel writes the key`, async () => {
                const { item, calls, data } = makeItem({ type: 'input_sel', role: DEVICE_DETAIL_ROW_ROLE });
                const states: Record<string, string> = { 0: 'off', 1: 'on', 2: 'auto' };
                const value = {
                    type,
                    writeable: true,
                    options: { type: 'triggered', dp: 'shelly.0.x.mode' },
                    common: { type, states },
                    getNumber: async (): Promise<number | null> => Promise.resolve(type === 'number' ? 1 : null),
                    getString: async (): Promise<string> => Promise.resolve('1'),
                    getCommonStates: async (): Promise<Record<string, string>> => Promise.resolve(states),
                    setState: async (v: unknown): Promise<void> => {
                        calls.written.push(v);
                        return Promise.resolve();
                    },
                };
                Object.assign(item, { library: { getTranslation: (s: string): string => s } });
                Object.assign(data, { entityInSel: { value } });
                await item.onCommand('mode-insel', '2');
                expect(calls.written).to.deep.equal([type === 'number' ? 2 : '2']);
            });
        }
    });
});

describe('lib/pages/pageItem - openDeviceDetails', () => {
    const DEV = 'shelly.0.dev';
    type FakePage = {
        id: string;
        config: unknown;
        inited: boolean;
        deleted: boolean;
        directParentPage: unknown;
        init: () => Promise<void>;
        delete: () => Promise<void>;
    };

    /**
     * An item on a page `parent` of a fake panel; getObjectAsync waits for `gate` when given.
     *
     * @param parentId id of the page of the item
     */
    function setup(parentId = '3'): {
        panel: Record<string, any>;
        parent: Record<string, any>;
        created: FakePage[];
        item: (name: string) => PageItem;
        release: () => void;
        hold: () => void;
    } {
        const noop = (): void => undefined;
        const created: FakePage[] = [];
        let gate: Promise<void> | null = null;
        let open: () => void = noop;
        const objects: Record<string, unknown> = {
            [DEV]: { type: 'device', common: { name: 'Lamp' } },
            [`${DEV}.rssi`]: { type: 'state', common: { type: 'number', role: 'value', write: false, unit: 'dBm' } },
        };
        const parent: Record<string, any> = { id: parentId, name: 'p', alwaysOn: 'none', directChildPage: undefined };
        const panel: Record<string, any> = {
            active: parent,
            info: { nspanel: { model: 'eu' } },
            statesControler: {
                getObjectAsync: async (id: string): Promise<unknown> => {
                    if (gate) {
                        await gate;
                    }
                    return objects[id] ?? null;
                },
            },
            newPage: (config: { id: string }, pageConfig: unknown): FakePage => {
                const page: FakePage = {
                    id: config.id,
                    config: pageConfig,
                    inited: false,
                    deleted: false,
                    directParentPage: undefined,
                    init: async () => {
                        page.inited = true;
                        return Promise.resolve();
                    },
                    delete: async () => {
                        page.deleted = true;
                        if (page.directParentPage) {
                            // like Page.delete()
                            (page.directParentPage as Record<string, any>).directChildPage = undefined;
                        }
                        return Promise.resolve();
                    },
                };
                created.push(page);
                return page;
            },
            getActivePage: (): unknown => panel.active,
            setActivePage: async (page: unknown): Promise<void> => {
                panel.active = page;
                return Promise.resolve();
            },
        };
        parent.basePanel = panel;
        const item = (name: string): PageItem => {
            const it = Object.create(PageItem.prototype) as PageItem;
            Object.assign(it, {
                id: `${parentId}?${name}`,
                log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
                library: { getTranslation: (k: string) => k, getLocalLanguage: () => 'en' },
                adapter: { unload: false },
                parent,
                config: {
                    type: 'button',
                    deviceDetails: { deviceId: DEV, entries: [{ key: 'rssi', id: `${DEV}.rssi` }] },
                },
                dataItems: { type: 'button', data: {} },
            });
            return it;
        };
        return {
            panel,
            parent,
            created,
            item,
            hold: () => {
                gate = new Promise(resolve => (open = resolve));
            },
            release: () => {
                gate = null;
                open();
            },
        };
    }

    it('builds the cardEntities page below the page of the item and shows it', async () => {
        const f = setup();
        expect(await f.item('0').onCommandLongPress('button', '')).to.equal(true);
        expect(f.created).to.have.length(1);
        const page = f.created[0];
        expect(page.id).to.equal('dd_3');
        expect(page.inited).to.equal(true);
        expect(f.panel.active).to.equal(page);
        expect(f.parent.directChildPage).to.equal(page);
        expect(page.directParentPage).to.equal(f.parent);
        const config = page.config as { config: { card: string; data: unknown }; pageItems: unknown[] };
        expect(config.config.card).to.equal('cardEntities');
        expect(config.config.data).to.deep.equal({ headline: { type: 'const', constVal: 'Lamp' } });
        expect(config.pageItems).to.have.length(1);
    });

    it('replaces the detail page opened before - after the new one is shown, the link stays', async () => {
        const f = setup();
        await f.item('0').onCommandLongPress('button', '');
        const first = f.created[0];
        // back to the page of the items
        f.panel.active = f.parent;
        await f.item('1').onCommandLongPress('button', '');
        const second = f.created[1];
        expect(first.deleted).to.equal(true);
        expect(second.deleted).to.equal(false);
        expect(f.panel.active).to.equal(second);
        expect(f.parent.directChildPage).to.equal(second);
    });

    it('two overlapping long presses: only the last one opens its page, the active page is never deleted', async () => {
        const f = setup();
        f.hold();
        const a = f.item('0').onCommandLongPress('button', '');
        const b = f.item('1').onCommandLongPress('button', '');
        f.release();
        await Promise.all([a, b]);
        expect(f.created).to.have.length(1);
        expect(f.panel.active).to.equal(f.created[0]);
        expect(f.created[0].deleted).to.equal(false);
        expect(f.parent.directChildPage).to.equal(f.created[0]);
    });

    it('the user left the page while the objects were read: nothing opens', async () => {
        const f = setup();
        f.hold();
        const a = f.item('0').onCommandLongPress('button', '');
        f.panel.active = { id: 'other' };
        f.release();
        await a;
        expect(f.created).to.have.length(0);
        expect(f.parent.directChildPage).to.equal(undefined);
    });
});

describe('lib/pages/pageItem - short tap state of a device item', () => {
    /**
     * @param read common.read of the state
     * @param device the item is a device item
     */
    async function tap(read: boolean, device: boolean): Promise<{ setTrue: number; flip: number }> {
        const noop = (): void => undefined;
        const calls = { setTrue: 0, flip: 0 };
        const item = Object.create(PageItem.prototype) as PageItem;
        Object.assign(item, {
            id: '3?0',
            log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
            config: { type: 'button', deviceDetails: device ? { deviceId: 'a.0.b', entries: [] } : undefined },
            dataItems: {
                type: 'button',
                data: {
                    entity1: {
                        set: {
                            writeable: true,
                            common: { read },
                            setStateTrue: async () => {
                                calls.setTrue++;
                                return Promise.resolve();
                            },
                            setStateFlip: async () => {
                                calls.flip++;
                                return Promise.resolve();
                            },
                        },
                    },
                },
            },
            parent: { isScreensaver: false, card: 'cardGrid' },
        });
        await item.onCommand('button', '');
        return calls;
    }
    it('a button of the device (read: false) is written with true', async () => {
        expect(await tap(false, true)).to.deep.equal({ setTrue: 1, flip: 0 });
    });
    it('a switch of the device is switched', async () => {
        expect(await tap(true, true)).to.deep.equal({ setTrue: 0, flip: 1 });
    });
    it('a custom item without device keeps switching', async () => {
        expect(await tap(false, false)).to.deep.equal({ setTrue: 0, flip: 1 });
    });
});
