import { expect } from 'chai';
import { resolveScreensaverOptions, Screensaver } from './screensaver';
import type * as Types from '../types/types';
import type * as pages from '../types/pages';
import type { PageInterface } from '../classes/PageInterface';

/**
 * A tap on an indicator of the screensaver: the panel calls `onPopupRequest` first and then
 * `onButtonEvent` of the page that is active *after* it (`Panel.HandleIncomingMessage`,
 * case `buttonPress2`). The test rebuilds this order with a bare `Screensaver` prototype.
 */

type Writes = { id: string; val: unknown }[];

type Fixture = {
    saver: Screensaver;
    writes: Writes;
    commands: string[];
    /** which page is active - the command of the item navigates away when the option is off */
    active: () => 'screensaver' | 'main';
};

function setup(indicatorButtons: boolean): Fixture {
    const writes: Writes = [];
    const commands: string[] = [];
    let active: 'screensaver' | 'main' = 'screensaver';
    const saver = Object.create(Screensaver.prototype) as Screensaver;
    const item = (modeScr: string | undefined, index: number): any => ({
        config: modeScr ? { modeScr } : {},
        onCommand: async (action: string, value: string): Promise<boolean> => {
            commands.push(`${index}:${action}:${value}`);
            if (!indicatorButtons) {
                // PageItem.onCommand - option off: navigation.resetPosition() + setCurrentPage()
                active = 'main';
            }
            return Promise.resolve(false);
        },
        GeneratePopup: async (): Promise<string | null> => Promise.resolve(null),
    });
    const pageItems: any[] = [];
    for (let i = 0; i < 10; i++) {
        pageItems.push(item(undefined, i)); // weather / left / bottom items
    }
    for (let i = 10; i < 15; i++) {
        pageItems.push(item('indicator', i)); // 0?10 … 0?14
    }
    const noop = (): void => undefined;
    Object.assign(saver, {
        pageItems,
        screensaverIndicatorButtons: indicatorButtons,
        unload: false,
        card: 'screensaver2',
        name: '#scr',
        id: '0',
        log: { debug: noop, info: noop, warn: noop, error: noop },
        adapter: { unload: false, setTimeout: (): number => 1 },
        library: {
            writedp: async (id: string, val: unknown): Promise<void> => {
                writes.push({ id, val });
                return Promise.resolve();
            },
        },
        basePanel: { name: 'A0_B7_65_54_C0_70' },
    });
    return { saver, writes, commands, active: () => active };
}

async function tapLikeThePanel(f: Fixture, event: Types.IncomingEvent): Promise<void> {
    await f.saver.onPopupRequest(event.id, event.popup as Types.PopupType, event.action, event.opt, event);
    if (f.active() === 'screensaver') {
        await f.saver.onButtonEvent(event);
    }
    // else: the main page is active now and gets the event - it knows nothing about indicators
}

const tap: Types.IncomingEvent = {
    type: 'event',
    method: 'buttonPress2',
    page: 0,
    id: '12',
    action: 'button',
    opt: '',
};

describe('lib/pages/screensaver - indicator tap', () => {
    it('writes buttons.indicator-N and runs the command once when the indicators are no buttons (navigates away)', async () => {
        const f = setup(false);
        await tapLikeThePanel(f, tap);

        expect(f.writes).to.deep.equal([{ id: 'panels.A0_B7_65_54_C0_70.buttons.indicator-3', val: true }]);
        expect(f.commands).to.deep.equal(['12:button:']);
        expect(f.active()).to.equal('main');
    });

    it('runs the command exactly once when the indicators act as buttons', async () => {
        const f = setup(true);
        await tapLikeThePanel(f, tap);

        expect(f.writes).to.deep.equal([{ id: 'panels.A0_B7_65_54_C0_70.buttons.indicator-3', val: true }]);
        expect(f.commands).to.deep.equal(['12:button:']);
        expect(f.active()).to.equal('screensaver');
    });

    it('still hands other actions to the base implementation', async () => {
        const f = setup(true);
        await f.saver.onPopupRequest('12', 'popupLight', 'brightnessSlider', '50', null);

        expect(f.commands).to.deep.equal(['12:brightnessSlider:50']);
        expect(f.writes).to.deep.equal([]);
    });
});

describe('lib/pages/screensaver - tiles (screensaver5) payload', () => {
    /**
     * a screensaver item - payload `type~id~icon~color~name~value` like PageItem.getPageItemPayload
     *
     * @param modeScr place of the item
     * @param n index of the item, also its id `0?n`
     */
    const item = (modeScr: string, n: number): any => ({
        config: { modeScr },
        dataItems: { data: {} },
        isEnabled: async (): Promise<boolean> => Promise.resolve(true),
        getPageItemPayload: async (): Promise<string> => Promise.resolve(`text~0?${n}~i${n}~${n}~${modeScr}${n}~v${n}`),
    });

    function tilesSaver(pageItems: any[], model: string = 'eu'): Screensaver {
        const saver = Object.create(Screensaver.prototype) as Screensaver;
        Object.assign(saver, {
            pageItems,
            config: { card: 'screensaver5', mode: 'tiles', model },
            step: 0,
        });
        return saver;
    }

    it('sends exactly 5 bottom and 7 indicator slots and the status bars, nothing for favorit, left and alternate', async () => {
        // favorit, left and alternate items of a former version must not reach the page
        const saver = tilesSaver([
            item('favorit', 0),
            item('left', 1),
            item('alternate', 2),
            item('mricon', 3),
            item('bottom', 4),
            item('bottom', 5),
            item('indicator', 6),
            item('indicator', 7),
        ]);
        const message = await saver.getData(['left', 'bottom', 'indicator', 'alternate', 'favorit', 'mricon']);
        expect(message).to.not.equal(null);
        const o = message!.options;
        expect(o.favorit).to.deep.equal([]);
        expect(o.left).to.deep.equal([]);
        expect(o.alternate).to.deep.equal([]);
        expect(o.mricon).to.have.length(2);
        expect(o.mricon[0]).to.include('~i3~3~');
        expect(o.bottom).to.have.length(5);
        expect(o.indicator).to.have.length(7);
        // the order Screensaver.update() concatenates
        const fields = [...o.favorit, ...o.left, ...o.bottom, ...o.alternate, ...o.indicator].join('~').split('~');
        expect(fields).to.have.length(12 * 6);
        expect(o.bottom[0]).to.equal('~~i4~4~bottom4~v4');
        expect(o.bottom[2]).to.equal('~~~~~');
        // the indicator keeps its id - the HMI sends it back with buttonPress2
        expect(o.indicator[0]).to.equal('~0?6~i6~6~indicator6~v6');
        expect(o.indicator[6]).to.equal('~~~~~');
    });

    it('sends 4 bottom and 8 indicator slots on the portrait panel', async () => {
        const items = [];
        for (let i = 0; i < 5; i++) {
            items.push(item('bottom', i));
        }
        for (let i = 5; i < 13; i++) {
            items.push(item('indicator', i));
        }
        const saver = tilesSaver(items, 'us-p');
        const message = await saver.getData(['bottom', 'indicator']);
        const o = message!.options;
        expect(o.bottom).to.have.length(4);
        expect(o.indicator).to.have.length(8);
        expect([...o.bottom, ...o.indicator].join('~').split('~')).to.have.length(12 * 6);
        expect(o.bottom[0]).to.equal('~~i0~0~bottom0~v0');
        // the HMI reads the id of indicator j from field 26 + 6j
        expect(o.indicator[0]).to.equal('~0?5~i5~5~indicator5~v5');
        expect(o.indicator[7]).to.equal('~0?12~i12~12~indicator12~v12');
    });

    it('pages more than 7 indicators in windows of 7', async () => {
        const items = [];
        for (let i = 0; i < 9; i++) {
            items.push(item('indicator', i));
        }
        const saver = tilesSaver(items);
        const message = await saver.getData(['indicator']);
        expect(message!.options.indicator).to.have.length(7);
        (saver as any).step = 1;
        const second = await saver.getData(['indicator']);
        expect(second!.options.indicator[0]).to.equal('~0?7~i7~7~indicator7~v7');
        expect(second!.options.indicator[2]).to.equal('~~~~~');
    });
});

describe('lib/pages/screensaver - mode of another adapter version', () => {
    type Logs = { warn: string[]; error: string[] };

    // page configuration as it comes from the admin or a stored script - the mode is deliberately not typed
    const pageOf = (mode: string | undefined, card: string = 'screensaver'): pages.PageBase =>
        ({
            uniqueID: 'scr-admin',
            alwaysOn: 'none',
            pageItems: [],
            config: {
                card,
                mode,
                rotationTime: 60,
                model: 'eu',
                data: undefined,
                screensaverSwipe: true,
                screensaverIndicatorButtons: false,
            },
        }) as unknown as pages.PageBase;

    const construct = (page: pages.PageBase): { saver: Screensaver; logs: Logs } => {
        const logs: Logs = { warn: [], error: [] };
        const adapter = {
            controller: {},
            library: {},
            log: {
                warn: (msg: string): void => void logs.warn.push(msg),
                error: (msg: string): void => void logs.error.push(msg),
            },
        };
        const config = {
            card: 'screensaver',
            id: '0',
            name: 'scr-admin',
            dpInit: '',
            adapter,
            panel: { name: 'ns_panel4', friendlyName: 'Panel 4' },
        } as unknown as PageInterface;
        return { saver: new Screensaver(config, page), logs };
    };

    // page item that sits in a place of the screensaver and sends its index as payload
    const placeItem = (place: string, index: number): any => ({
        config: { modeScr: place },
        dataItems: {},
        isEnabled: async (): Promise<boolean> => Promise.resolve(true),
        getPageItemPayload: async (): Promise<string> => Promise.resolve(`~~icon${index}~~text${index}~`),
    });

    it('falls back to standard with card screensaver and warns once for an unknown mode', () => {
        const { saver, logs } = construct(pageOf('hologram'));

        expect(saver.mode).to.equal('standard');
        expect(saver.card).to.equal('screensaver');
        expect(saver.config?.card).to.equal('screensaver');
        expect(logs.warn).to.have.length(1);
        expect(logs.warn[0]).to.include("'hologram'").and.include("'standard'").and.include('Panel 4');
        expect(logs.error).to.deep.equal([]);
    });

    it('also takes a stored card of another version', () => {
        const { saver, logs } = construct(pageOf('hologram', 'screensaver9'));

        expect(saver.mode).to.equal('standard');
        expect(saver.card).to.equal('screensaver');
        expect(logs.warn).to.have.length(1);
        expect(logs.warn[0]).to.include("'screensaver9'");
        expect(logs.error).to.deep.equal([]);
    });

    it('falls back when the mode is missing', () => {
        const { saver, logs } = construct(pageOf(undefined));

        expect(saver.mode).to.equal('standard');
        expect(logs.warn).to.have.length(1);
    });

    it('keeps the other settings but leaves the given configuration untouched', () => {
        const page = pageOf('hologram', 'screensaver9');
        const before = structuredClone(page);
        const { saver } = construct(page);

        expect(page).to.deep.equal(before);
        expect(saver.rotationTime).to.equal(60_000);
        expect(saver.screensaverSwipe).to.equal(true);

        // a later switch of the running layout must not reach the stored object either
        saver.overwriteModel(2, true);
        expect(saver.mode).to.equal('advanced');
        expect(page).to.deep.equal(before);
    });

    for (const [mode, card] of [
        ['standard', 'screensaver'],
        ['alternate', 'screensaver'],
        ['advanced', 'screensaver2'],
        ['easyview', 'screensaver3'],
        ['tiles', 'screensaver5'],
    ]) {
        it(`keeps the known mode ${mode}`, () => {
            const page = pageOf(mode, card);
            const { saver, logs } = construct(page);

            expect(saver.mode).to.equal(mode);
            expect(saver.card).to.equal(card);
            expect(saver.config).to.equal(page.config);
            expect(logs.warn).to.deep.equal([]);
            expect(resolveScreensaverOptions(page).options).to.equal(page);
        });
    }

    it('stays an error without a config or for a card that is no screensaver', () => {
        const noConfig = { uniqueID: 'x', alwaysOn: 'none', pageItems: [] } as unknown as pages.PageBase;
        const grid = pageOf('hologram', 'cardGrid');

        expect(resolveScreensaverOptions(noConfig).rejected).to.equal(undefined);
        expect(resolveScreensaverOptions(grid).rejected).to.equal(undefined);
        expect(resolveScreensaverOptions(grid).options).to.equal(grid);
    });

    it('builds a message without errors when more items exist than the standard layout has places', async () => {
        const { saver } = construct(pageOf('hologram'));
        // what a layout of another version may hold: 5 bottom items and 7 indicators, standard has 4 and 0 places
        const items: any[] = [];
        for (let i = 0; i < 5; i++) {
            items.push(placeItem('bottom', i));
        }
        for (let i = 5; i < 12; i++) {
            items.push(placeItem('indicator', i));
        }
        saver.pageItems = items;

        const message = await saver.getData(['bottom', 'indicator', 'left', 'alternate', 'favorit']);

        expect(message?.options.bottom).to.have.length(4);
        expect(message?.options.bottom[0]).to.include('icon0');
        expect(message?.options.indicator).to.deep.equal([]);
        expect(message?.options.left).to.deep.equal([]);
    });
});
