import { expect } from 'chai';
import { resolveScreensaverOptions, Screensaver } from './screensaver';
import { PageItem } from './pageItem';
import type * as Types from '../types/types';
import type * as pages from '../types/pages';
import type { PageInterface } from '../classes/PageInterface';
import { Color, type RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { ScreensaverClockTimer } from '../types/adminShareConfig';

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
    /** which page is active - the command of an item without an action navigates away (older TFT) */
    active: () => 'screensaver' | 'main';
};

function setup(hasAction: boolean): Fixture {
    const writes: Writes = [];
    const commands: string[] = [];
    let active: 'screensaver' | 'main' = 'screensaver';
    const saver = Object.create(Screensaver.prototype) as Screensaver;
    const item = (modeScr: string | undefined, index: number): any => ({
        config: modeScr ? { modeScr } : {},
        onCommand: async (action: string, value: string): Promise<boolean> => {
            commands.push(`${index}:${action}:${value}`);
            if (!hasAction) {
                // PageItem.onCommand - no action: navigation.resetPosition() + setCurrentPage()
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
    it('writes buttons.indicator-N and runs the command once for an indicator without an action (navigates away)', async () => {
        const f = setup(false);
        await tapLikeThePanel(f, tap);

        expect(f.writes).to.deep.equal([{ id: 'panels.A0_B7_65_54_C0_70.buttons.indicator-3', val: true }]);
        expect(f.commands).to.deep.equal(['12:button:']);
        expect(f.active()).to.equal('main');
    });

    it('runs the command exactly once for an indicator with an action', async () => {
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

    it('keeps the font suffix of the indicator icons only, strips it elsewhere (bottom too) and on the other pages', async () => {
        const withFont = (modeScr: string, n: number): any => ({
            ...item(modeScr, n),
            getPageItemPayload: async (): Promise<string> =>
                Promise.resolve(`text~0?${n}~i${n}¬3~${n}~${modeScr}${n}~v${n}`),
        });
        const items = [withFont('mricon', 0), withFont('bottom', 1), withFont('indicator', 2)];
        const tiles = await tilesSaver(items).getData(['bottom', 'indicator', 'mricon']);
        expect(tiles!.options.bottom[0]).to.equal('~~i1~1~bottom1~v1');
        expect(tiles!.options.indicator[0]).to.equal('~0?2~i2¬3~2~indicator2~v2');
        expect(tiles!.options.mricon[0]).to.include('~i0~0~');

        // the same items on screensaver2: its HMI page would show '¬3'
        const saver = Object.create(Screensaver.prototype) as Screensaver;
        Object.assign(saver, {
            pageItems: items,
            config: { card: 'screensaver2', mode: 'advanced', model: 'eu' },
            step: 0,
        });
        const advanced = await saver.getData(['bottom', 'indicator']);
        expect(advanced!.options.bottom[0]).to.equal('~~i1~1~bottom1~v1');
        expect(advanced!.options.indicator[0]).to.equal('~0?2~i2~2~indicator2~v2');
    });

    it('drops the suffix of an indicator icon in a font without icons, keeps it for icon fonts and texts', async () => {
        const icon = Icons.GetIcon('battery-high');
        const withIcon = (n: number, text: string): any => ({
            ...item('indicator', n),
            getPageItemPayload: async (): Promise<string> => Promise.resolve(`text~0?${n}~${text}~${n}~ind${n}~v${n}`),
        });
        const items = [withIcon(0, `${icon}¬2`), withIcon(1, `${icon}¬4`), withIcon(2, '85%¬2')];
        const tiles = await tilesSaver(items).getData(['indicator']);
        expect(tiles!.options.indicator[0]).to.equal(`~0?0~${icon}~0~ind0~v0`);
        expect(tiles!.options.indicator[1]).to.equal(`~0?1~${icon}¬4~1~ind1~v1`);
        expect(tiles!.options.indicator[2]).to.equal('~0?2~85%¬2~2~ind2~v2');

        // the other pages strip every suffix as before
        const saver = Object.create(Screensaver.prototype) as Screensaver;
        Object.assign(saver, {
            pageItems: items,
            config: { card: 'screensaver2', mode: 'advanced', model: 'eu' },
            step: 0,
        });
        const advanced = await saver.getData(['indicator']);
        expect(advanced!.options.indicator[0]).to.equal(`~0?0~${icon}~0~ind0~v0`);
        expect(advanced!.options.indicator[1]).to.equal(`~0?1~${icon}~1~ind1~v1`);
        expect(advanced!.options.indicator[2]).to.equal('~0?2~85%~2~ind2~v2');
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

describe('lib/pages/screensaver - timer instead of the clock', () => {
    const NOW = new Date(2026, 10, 5, 12, 0, 0, 0).getTime();
    const SAND = Icons.GetIcon('timer-sand');
    const ALERT = Icons.GetIcon('timer-alert');
    const ORANGE = String(Color.rgb_dec565(Color.Orange));
    const RED = String(Color.rgb_dec565(Color.Red));
    const realNow = Date.now;

    type Fixture = {
        saver: any;
        sent: string[];
        warn: string[];
        timers: { fn: () => void; ms: number; cleared: boolean }[];
        states: Record<string, unknown>;
        patterns: string[];
        common: Record<string, Record<string, unknown>>;
        /** sends a new value like the states controller: value first, then the trigger */
        setState: (id: string, val: unknown) => Promise<void>;
        /** messages sent by the given action */
        during: (action: () => Promise<unknown>) => Promise<string[]>;
    };

    afterEach(() => {
        Date.now = realNow;
    });

    async function setup(clockTimer: ScreensaverClockTimer, initial: Record<string, unknown>): Promise<Fixture> {
        Date.now = (): number => NOW;
        const sent: string[] = [];
        const warn: string[] = [];
        const timers: Fixture['timers'] = [];
        const states = { ...initial };
        const patterns: string[] = [];
        const common: Fixture['common'] = {};
        const noop = (): void => undefined;
        const log = { debug: noop, info: noop, warn: (m: string): void => void warn.push(m), error: noop };
        const statesControler = {
            setTrigger: async (): Promise<void> => Promise.resolve(),
            getStateVal: async (id: string): Promise<unknown> => Promise.resolve(states[id] ?? null),
            getObjectAsync: async (id: string): Promise<unknown> =>
                Promise.resolve({ type: 'state', common: common[id] ?? {} }),
            subscribePattern: async (pattern: string): Promise<void> => void patterns.push(pattern),
            unsubscribePattern: async (pattern: string): Promise<void> =>
                void patterns.splice(patterns.indexOf(pattern), 1),
        };
        const adapter = {
            namespace: 'nspanel-lovelace-ui.0',
            unload: false,
            log,
            library: {},
            controller: { statesControler },
            setTimeout: (fn: () => void, ms: number): unknown => {
                const timer = { fn, ms, cleared: false };
                timers.push(timer);
                return timer;
            },
            clearTimeout: (timer: { cleared: boolean }): void => {
                timer.cleared = true;
            },
            getForeignStatesAsync: async (pattern: string): Promise<Record<string, { val: unknown }>> => {
                const out: Record<string, { val: unknown }> = {};
                const [prefix, suffix] = pattern.split('*');
                for (const id of Object.keys(states)) {
                    if (id.startsWith(prefix) && id.endsWith(suffix)) {
                        out[id] = { val: states[id] };
                    }
                }
                return Promise.resolve(out);
            },
        };
        const panel = {
            name: 'p',
            friendlyName: 'Panel',
            isOnline: true,
            isVirtual: true,
            screenSaverDoubleClick: true,
            info: { nspanel: {} },
            dim: { dayMode: true, standby: 0, nightStandby: 0 },
            panelSend: { addMessage: (payload: string): void => void sent.push(payload) },
        };
        const config = {
            card: 'screensaver',
            id: '0',
            name: 'scr',
            dpInit: '',
            adapter,
            panel,
        } as unknown as PageInterface;
        const page = {
            uniqueID: 'scr',
            alwaysOn: 'none',
            pageItems: [],
            config: {
                card: 'screensaver',
                mode: 'standard',
                rotationTime: 0,
                model: 'eu',
                data: undefined,
                screensaverSwipe: false,
                clockTimer,
            },
        } as unknown as pages.PageBase;
        const saver: any = new Screensaver(config, page);
        saver.log = log;
        saver.pageItems = [
            {
                config: { modeScr: 'time' },
                dataItems: { data: {} },
                isEnabled: async (): Promise<boolean> => Promise.resolve(true),
                getPageItemPayload: async (): Promise<string> => Promise.resolve('~~~~~12:34'),
                delete: async (): Promise<void> => Promise.resolve(),
            },
        ];
        saver.visibility = true;
        // the part of init() of this feature - the base class needs a full panel
        await saver.initClockTimer();
        return {
            saver,
            sent,
            warn,
            timers,
            states,
            patterns,
            common,
            setState: async (id, val): Promise<void> => {
                states[id] = val;
                if (clockTimer.activePattern) {
                    saver.onTimerPatternState(id, val === undefined ? null : { val, ack: true });
                } else {
                    await saver.onStateChange(id, { old: { val: null }, new: { val } });
                }
                await saver.onStateTrigger(id, saver);
            },
            during: async (action): Promise<string[]> => {
                const from = sent.length;
                await action();
                return sent.slice(from);
            },
        };
    }

    const simple: ScreensaverClockTimer = { enabled: true, activeState: 'x.0.on', dataState: 'x.0.ts' };
    const slots: ScreensaverClockTimer = {
        enabled: true,
        activeState: '',
        dataState: '',
        activePattern: 'x.0.*.aktiv',
        dataPattern: 'x.0.*.targetTs',
    };
    const colorsOf = (messages: string[]): string[] => messages.filter(m => m.startsWith('color~'));
    const timesOf = (messages: string[]): string[] => messages.filter(m => m.startsWith('time~'));
    const iconColor = (message: string): string => message.split('~')[16];
    const timeColor = (message: string): string => message.split('~')[2];
    const FG_TIME = String(Color.rgb_dec565(Color.fgTime as RGB));

    describe('payload', () => {
        it('shows the remaining time with the icon, ahead of the info icon', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 90_000 });
            f.saver._infoIcon = 'wrench';
            const sent = await f.during(() => f.saver.HandleTime());
            expect(timesOf(sent)).to.deep.equal([`time~1.5~${SAND}`]);
        });

        it('shows the alarm with its icon, ahead of the update symbols', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW - 1000 });
            f.saver.basePanel.isVirtual = false;
            f.saver.basePanel.info.nspanel = { displayVersion: '0.0.0', onlineVersion: '1' };
            const sent = await f.during(() => f.saver.HandleTime());
            expect(timesOf(sent)).to.deep.equal([`time~0.0~${ALERT}`]);
        });

        it('shows the clock with the info icon while the on/off state is off', async () => {
            const f = await setup(simple, { 'x.0.on': false, 'x.0.ts': NOW + 90_000 });
            f.saver._infoIcon = 'wrench';
            const sent = await f.during(() => f.saver.HandleTime());
            expect(sent).to.deep.equal([`time~12:34~${Icons.GetIcon('wrench')}`]);
        });

        it('shows the clock without a run for targetTs 0, the alarm after a run', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': 0 });
            expect(await f.during(() => f.saver.HandleTime())).to.deep.equal(['time~12:34']);
            await f.setState('x.0.ts', NOW + 60_000);
            const sent = await f.during(() => f.setState('x.0.ts', 0));
            expect(timesOf(sent)).to.deep.equal([`time~0.0~${ALERT}`]);
        });

        it('takes 0 of a state that counts down as alarm right from the start', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': 0 });
            f.common['x.0.ts'] = { unit: 's' };
            expect(timesOf(await f.during(() => f.saver.HandleTime()))).to.deep.equal([`time~0.0~${ALERT}`]);
        });

        it('sends the same text only once, the clock trigger does not repeat it', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 90_000 });
            await f.saver.HandleTime();
            expect(await f.during(() => f.saver.HandleTime())).to.deep.equal([]);
            Date.now = (): number => NOW + 35_000;
            expect(timesOf(await f.during(() => f.saver.HandleTime()))).to.deep.equal([`time~1.0~${SAND}`]);
        });

        it('ignores a timer without on/off state with one warning', async () => {
            const f = await setup({ ...simple, activeState: '' }, { 'x.0.ts': NOW + 90_000 });
            expect(f.warn).to.have.length(1);
            expect(await f.during(() => f.saver.HandleTime())).to.deep.equal(['time~12:34']);
        });
    });

    describe('tick', () => {
        it('wakes up at the next tenth of a minute of the remaining time and at the end', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 90_500 });
            await f.saver.HandleTime();
            expect(f.timers.at(-1)?.ms).to.equal(500);

            Date.now = (): number => NOW + 90_500;
            f.timers.at(-1)?.fn();
            await new Promise(resolve => setImmediate(resolve));
            expect(timesOf(f.sent).at(-1)).to.equal(`time~0.0~${ALERT}`);
        });

        it('does not repeat the text when nothing changed at the wake up, but a change of the data comes at once', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 90_000 });
            await f.saver.HandleTime();
            Date.now = (): number => NOW + 1;
            expect(await f.during(() => f.saver.HandleTime())).to.deep.equal([]);
            const sent = await f.during(() => f.setState('x.0.ts', NOW + 600_000));
            expect(timesOf(sent)).to.deep.equal([`time~10.0~${SAND}`]);
        });

        it('shows a state that counts down in seconds the same way', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': 7 });
            f.common['x.0.ts'] = { unit: 's' };
            expect(timesOf(await f.during(() => f.saver.HandleTime()))).to.deep.equal([`time~0.2~${SAND}`]);
            expect(timesOf(await f.during(() => f.setState('x.0.ts', 6)))).to.deep.equal([`time~0.1~${SAND}`]);
            expect(timesOf(await f.during(() => f.setState('x.0.ts', 1)))).to.deep.equal([]);
            expect(timesOf(await f.during(() => f.setState('x.0.ts', 0)))).to.deep.equal([`time~0.0~${ALERT}`]);
        });

        it('is cleared when the screensaver gets invisible', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 90_000 });
            await f.saver.HandleTime();
            const timer = f.timers.at(-1)!;
            f.saver.visibility = false;
            await f.saver.onVisibilityChange(false);
            expect(timer.cleared).to.equal(true);
            expect(f.saver.timerTick).to.equal(undefined);
        });

        it('sends nothing and sets no timer while invisible', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 90_000 });
            f.saver.visibility = false;
            expect(await f.during(() => f.saver.HandleTime())).to.deep.equal([]);
            expect(f.timers).to.deep.equal([]);
        });
    });

    describe('color', () => {
        it('holds the override and is sent once per change of the status, not per minute', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            const start = await f.during(() => f.saver.HandleTime());
            expect(colorsOf(start)).to.have.length(1);
            expect(iconColor(colorsOf(start)[0])).to.equal(ORANGE);
            expect(timeColor(colorsOf(start)[0])).to.equal(ORANGE);

            Date.now = (): number => NOW + 61_000;
            const minute = await f.during(() => f.saver.HandleTime());
            expect(timesOf(minute)).to.deep.equal([`time~1.0~${SAND}`]);
            expect(colorsOf(minute)).to.deep.equal([]);

            Date.now = (): number => NOW + 120_000;
            const expired = await f.during(() => f.saver.HandleTime());
            expect(iconColor(colorsOf(expired)[0])).to.equal(RED);
            expect(timeColor(colorsOf(expired)[0])).to.equal(RED);
            expect(colorsOf(expired)).to.have.length(1);

            const off = await f.during(() => f.setState('x.0.on', false));
            expect(colorsOf(off)).to.have.length(1);
            expect(iconColor(colorsOf(off)[0])).to.not.equal(RED);
            expect(timeColor(colorsOf(off)[0])).to.equal(FG_TIME);
            expect(timesOf(off)).to.deep.equal(['time~12:34']);
        });

        it('a change of the status: first the text, then the color - also when the text stays', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            await f.saver.HandleTime();
            Date.now = (): number => NOW + 120_000;
            const kinds = (await f.during(() => f.saver.HandleTime())).map(m => m.split('~')[0]);
            expect(kinds).to.deep.equal(['time', 'color']);

            const g = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            await g.saver.HandleTime();
            g.saver.colorTimerStatus = 'off';
            g.saver.resetLastMessage();
            const same = await g.during(() => g.saver.HandleTime());
            expect(same.map(m => m.split('~')[0])).to.deep.equal(['color']);
        });

        it('goes out with every regular color message', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            await f.saver.HandleTime();
            f.saver.sendColors();
            expect(iconColor(f.sent.filter(m => m.startsWith('color~')).at(-1)!)).to.equal(ORANGE);
            expect(timeColor(colorsOf(f.sent).at(-1)!)).to.equal(ORANGE);
        });

        it('keeps the normal color of the time without a timer', async () => {
            const off = await setup(simple, { 'x.0.on': false, 'x.0.ts': NOW + 120_000 });
            expect(colorsOf(await off.during(() => off.saver.HandleTime()))).to.deep.equal([]);
            off.saver.sendColors();
            expect(timeColor(colorsOf(off.sent).at(-1)!)).to.equal(FG_TIME);

            const none = await setup({ ...simple, enabled: false }, {});
            expect(colorsOf(await none.during(() => none.saver.HandleTime()))).to.deep.equal([]);
            none.saver.sendColors();
            expect(timeColor(colorsOf(none.sent).at(-1)!)).to.equal(FG_TIME);
        });

        it('a tap gives the time its normal color, the icon keeps the one of the timer', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            await f.saver.HandleTime();
            const tap = await f.during(() => f.saver.onTimerTap('bExit', '1'));
            expect(colorsOf(tap)).to.have.length(1);
            expect(timeColor(colorsOf(tap)[0])).to.equal(FG_TIME);
            expect(iconColor(colorsOf(tap)[0])).to.equal(ORANGE);
            // comes before the clock: no moment of an orange clock
            expect(tap.findIndex(m => m.startsWith('color~'))).to.be.lessThan(
                tap.findIndex(m => m.startsWith('time~')),
            );

            // not repeated while nothing changes, the regular message stays normal
            expect(colorsOf(await f.during(() => f.saver.HandleTime()))).to.deep.equal([]);
            f.saver.sendColors();
            expect(timeColor(colorsOf(f.sent).at(-1)!)).to.equal(FG_TIME);

            Date.now = (): number => NOW + 120_000;
            const expired = await f.during(() => f.saver.HandleTime());
            expect(colorsOf(expired)).to.have.length(1);
            expect(timeColor(colorsOf(expired)[0])).to.equal(FG_TIME);
            expect(iconColor(colorsOf(expired)[0])).to.equal(RED);
        });

        it('a tap on the alarm also gives the time its normal color', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW - 1000 });
            await f.saver.HandleTime();
            expect(timeColor(colorsOf(f.sent).at(-1)!)).to.equal(RED);
            const tap = await f.during(() => f.saver.onTimerTap('bExit', '1'));
            expect(timeColor(colorsOf(tap)[0])).to.equal(FG_TIME);
            expect(iconColor(colorsOf(tap)[0])).to.equal(RED);
        });

        it('the color comes back with the timer at the start of the screensaver', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            f.saver.sendType = (): void => undefined;
            f.saver.restartRotationLoop = async (): Promise<void> => Promise.resolve();
            const sent = await f.during(() => f.saver.onVisibilityChange(true));
            expect(colorsOf(sent)).to.have.length(1);
            expect(timeColor(colorsOf(sent)[0])).to.equal(ORANGE);
        });

        it('the color comes back with a new timer', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            const sent = await f.during(() => f.setState('x.0.ts', NOW + 300_000));
            expect(colorsOf(sent)).to.have.length(1);
            expect(timeColor(colorsOf(sent)[0])).to.equal(ORANGE);
            expect(timesOf(sent)).to.deep.equal([`time~5.0~${SAND}`]);
        });

        it('after a tap behind a notification it is sent again with the normal color', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            f.saver.customNotification = true;
            f.saver.headingNotification = 'Head';
            f.saver.textNotification = 'Text';
            await f.saver.HandleNotification();
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            expect(f.saver.activeNotification).to.equal(true);
            expect(f.saver.colorsDropped).to.equal(true);

            f.saver.customNotification = false;
            const sent = await f.during(() => f.saver.HandleNotification());
            expect(colorsOf(sent)).to.have.length(1);
            expect(timeColor(colorsOf(sent)[0])).to.equal(FG_TIME);
            expect(iconColor(colorsOf(sent)[0])).to.equal(ORANGE);
            expect(f.saver.colorsDropped).to.equal(false);
        });

        it('is sent again after a notification, the HMI drops it while one is shown', async () => {
            const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 120_000 });
            f.saver.activeNotification = true;
            await f.saver.HandleTime();
            expect(f.saver.colorsDropped).to.equal(true);
            const sent = await f.during(() => f.saver.HandleNotification());
            expect(sent[0]).to.match(/^notify~/);
            expect(colorsOf(sent)).to.have.length(1);
        });
    });

    describe('tap', () => {
        const running = { 'x.0.on': true, 'x.0.ts': NOW + 600_000 };

        it('the first tap switches to the clock, the icon stays', async () => {
            const f = await setup(simple, running);
            await f.saver.HandleTime();
            let done = false;
            const sent = await f.during(async () => {
                done = await f.saver.onTimerTap('bExit', '1');
            });
            expect(done).to.equal(true);
            expect(timesOf(sent)).to.deep.equal([`time~12:34~${SAND}`]);
            expect(colorsOf(sent)).to.have.length(1);
        });

        it('takes the tap before a notification and shows it again - the HMI clears it by itself', async () => {
            const f = await setup(simple, running);
            f.saver.customNotification = true;
            f.saver.headingNotification = 'Head';
            f.saver.textNotification = 'Text';
            await f.saver.HandleTime();
            const dismiss = f.saver.deactivateNotify;
            let dismissed = false;
            f.saver.deactivateNotify = async (): Promise<boolean> => {
                dismissed = true;
                return dismiss.call(f.saver);
            };
            const sent = await f.during(() => f.saver.onTimerTap('bExit', '1'));
            expect(dismissed).to.equal(false);
            expect(sent.at(-1)).to.match(/^notify~Head~Text/);
        });

        it('leaves swipes alone', async () => {
            const f = await setup(simple, running);
            await f.saver.HandleTime();
            for (const action of ['swipeUp', 'swipeDown', 'swipeLeft', 'swipeRight']) {
                expect(await f.saver.onTimerTap(action, '')).to.equal(false);
            }
            expect(f.saver.timerTappedAway).to.equal(false);
        });

        it('does nothing without a timer on the display', async () => {
            const f = await setup(simple, { 'x.0.on': false, 'x.0.ts': 0 });
            await f.saver.HandleTime();
            expect(await f.saver.onTimerTap('bExit', '1')).to.equal(false);
        });

        it('swallows the second tap of a double click only within the limit', async () => {
            const f = await setup(simple, running);
            await f.saver.HandleTime();
            expect(await f.saver.onTimerTap('bExit', '1')).to.equal(true);
            Date.now = (): number => NOW + 400;
            expect(await f.saver.onTimerTap('bExit', '2')).to.equal(true);
            // the window follows the swallowed tap
            Date.now = (): number => NOW + 1300;
            expect(await f.saver.onTimerTap('bExit', '3')).to.equal(true);
            Date.now = (): number => NOW + 2300;
            expect(await f.saver.onTimerTap('bExit', '4')).to.equal(false);
        });

        it('keeps a following tap with a new count or without double click', async () => {
            const f = await setup(simple, running);
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            expect(await f.saver.onTimerTap('bExit', '1')).to.equal(false);
            f.saver.basePanel.screenSaverDoubleClick = false;
            expect(await f.saver.onTimerTap('bExit', '2')).to.equal(false);
        });

        it('also takes the tap without double click', async () => {
            const f = await setup(simple, running);
            f.saver.basePanel.screenSaverDoubleClick = false;
            await f.saver.HandleTime();
            expect(await f.saver.onTimerTap('bExit', '5')).to.equal(true);
        });

        it('the timer comes back with the next start of the screensaver', async () => {
            const f = await setup(simple, running);
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            // onVisibilityChange(true) without the rest of the page
            f.saver.sendType = (): void => undefined;
            f.saver.restartRotationLoop = async (): Promise<void> => Promise.resolve();
            const sent = await f.during(() => f.saver.onVisibilityChange(true));
            expect(timesOf(sent)).to.deep.equal([`time~10.0~${SAND}`]);
        });

        it('stays on the clock with the alert icon when the tapped away timer expires', async () => {
            const f = await setup(simple, running);
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            Date.now = (): number => NOW + 600_000;
            const sent = await f.during(() => f.saver.HandleTime());
            expect(timesOf(sent)).to.deep.equal([`time~12:34~${ALERT}`]);
            expect(iconColor(colorsOf(sent)[0])).to.equal(RED);
        });

        for (const [name, changes] of [
            ['another end time', [['x.0.ts', NOW + 300_000]]],
            [
                'off and on again',
                [
                    ['x.0.on', false],
                    ['x.0.on', true],
                ],
            ],
        ] as [string, [string, unknown][]][]) {
            it(`the timer comes back with a new timer: ${name}`, async () => {
                const f = await setup(simple, running);
                await f.saver.HandleTime();
                await f.saver.onTimerTap('bExit', '1');
                for (const [id, val] of changes) {
                    await f.setState(id, val);
                }
                expect(f.saver.timerTappedAway).to.equal(false);
                expect(timesOf(f.sent).at(-1)).to.match(/^time~(5|10)\.0~/);
            });
        }
    });

    describe('slots', () => {
        it('warns once and stays on the clock with invalid patterns', async () => {
            const f = await setup({ ...slots, dataPattern: 'x.0.*.*.targetTs' }, {});
            expect(f.warn).to.have.length(1);
            expect(f.patterns).to.deep.equal([]);
            expect(await f.during(() => f.saver.HandleTime())).to.deep.equal(['time~12:34']);
        });

        it('subscribes both patterns and reads the existing slots', async () => {
            const f = await setup(slots, {
                'x.0.1.aktiv': true,
                'x.0.1.targetTs': NOW + 600_000,
                'x.0.2.aktiv': true,
                'x.0.2.targetTs': NOW + 300_000,
                'x.0.3.aktiv': false,
                'x.0.3.targetTs': NOW + 60_000,
            });
            expect(f.patterns).to.deep.equal(['x.0.*.aktiv', 'x.0.*.targetTs']);
            const sent = await f.during(() => f.saver.HandleTime());
            expect(timesOf(sent)).to.deep.equal([`time~5.0~${SAND}`]);
        });

        it('takes a slot that appears later, an alarm before a running slot, and shows the rest again', async () => {
            const f = await setup(slots, { 'x.0.1.aktiv': true, 'x.0.1.targetTs': NOW + 600_000 });
            await f.saver.HandleTime();
            await f.setState('x.0.2.targetTs', NOW - 1000);
            await f.setState('x.0.2.aktiv', true);
            expect(timesOf(f.sent).at(-1)).to.equal(`time~0.0~${ALERT}`);
            await f.setState('x.0.2.aktiv', false);
            expect(timesOf(f.sent).at(-1)).to.equal(`time~10.0~${SAND}`);
        });

        it('a slot gets free and is used again', async () => {
            const f = await setup(slots, { 'x.0.1.aktiv': true, 'x.0.1.targetTs': NOW + 600_000 });
            await f.saver.HandleTime();
            await f.setState('x.0.1.aktiv', false);
            await f.setState('x.0.1.targetTs', 0);
            expect(timesOf(f.sent).at(-1)).to.equal('time~12:34');
            await f.setState('x.0.1.targetTs', NOW + 120_000);
            await f.setState('x.0.1.aktiv', true);
            expect(timesOf(f.sent).at(-1)).to.equal(`time~2.0~${SAND}`);
        });

        it('forgets a deleted slot', async () => {
            const f = await setup(slots, { 'x.0.1.aktiv': true, 'x.0.1.targetTs': NOW + 600_000 });
            await f.saver.HandleTime();
            await f.setState('x.0.1.aktiv', undefined);
            await f.setState('x.0.1.targetTs', undefined);
            expect(f.saver.timerSources.size).to.equal(0);
            expect(timesOf(f.sent).at(-1)).to.equal('time~12:34');
        });

        it('brings the timer back when another slot becomes active or the shown slot changes', async () => {
            const f = await setup(slots, {
                'x.0.1.aktiv': true,
                'x.0.1.targetTs': NOW + 300_000,
                'x.0.2.aktiv': true,
                'x.0.2.targetTs': NOW + 600_000,
            });
            await f.saver.HandleTime();
            await f.saver.onTimerTap('bExit', '1');
            await f.setState('x.0.3.targetTs', NOW + 900_000);
            await f.setState('x.0.3.aktiv', true);
            expect(f.saver.timerTappedAway).to.equal(false);

            await f.saver.onTimerTap('bExit', '2');
            await f.setState('x.0.1.aktiv', false);
            expect(f.saver.timerTappedAway).to.equal(false);
            expect(timesOf(f.sent).at(-1)).to.equal(`time~10.0~${SAND}`);
        });

        it('ends the subscriptions and the wake up on delete', async () => {
            const f = await setup(slots, { 'x.0.1.aktiv': true, 'x.0.1.targetTs': NOW + 600_000 });
            await f.saver.HandleTime();
            const tick = f.timers.at(-1)!;
            await f.saver.delete();
            expect(f.patterns).to.deep.equal([]);
            expect(tick.cleared).to.equal(true);
        });
    });

    describe('only what changed', () => {
        const off: ScreensaverClockTimer = { ...simple, enabled: false };

        type Scene = Fixture & {
            /** what the items show, changed by the tests */
            now: { value: string; mr: string; notify: boolean; dismissed: boolean; text: string };
            indicator: () => any;
            mricon: () => any;
            notify: () => any;
            kinds: (messages: string[]) => string[];
            show: () => Promise<string[]>;
            sleepReachedOnSamePage: () => Promise<string[]>;
            lockTimers: () => Fixture['timers'];
        };

        async function scene(start: Partial<Scene['now']> = {}): Promise<Scene> {
            const f = await setup(off, {});
            const now = { value: 'A', mr: 'lamp', notify: false, dismissed: false, text: 'Text', ...start };
            const item = (modeScr: string, id: number, payload: () => string, extra: object = {}): any =>
                Object.assign(Object.create(PageItem.prototype), {
                    id: `scr?${id}`,
                    config: { modeScr },
                    dataItems: { data: {} },
                    isEnabled: async (): Promise<boolean> => Promise.resolve(true),
                    getPageItemPayload: async (): Promise<string> => Promise.resolve(payload()),
                    onCommand: async (): Promise<boolean> => {
                        now.value = `${now.value}+`;
                        return Promise.resolve(false);
                    },
                    delete: async (): Promise<void> => Promise.resolve(),
                    ...extra,
                });
            const notifyItem = item('notify', 2, () => `~scr?2~~~${now.text}~Head<sp!it>1<sp!it>1,2`, {
                config: { modeScr: 'notify', role: 'isDismissiblePerEvent' },
                isEnabled: async (): Promise<boolean> => Promise.resolve(now.notify && !now.dismissed),
                getGlobalDismissibleID: (): null => null,
                setDismissiblePerEvent: (): void => {
                    now.dismissed = true;
                },
            });
            f.saver.pageItems = [
                item('bottom', 0, () => `~~icon~1~name~${now.value}`),
                item('mricon', 1, () => `~~${now.mr}~2~~`),
                notifyItem,
            ];
            f.saver.library = { writedp: async (): Promise<void> => Promise.resolve() };
            f.saver.basePanel.lastCard = 'screensaver';
            f.saver.basePanel.timeout = 15;
            f.saver.basePanel.sendToTasmota = (topic: string): void => void f.sent.push(`buzzer ${topic}`);
            f.saver.basePanel.isBuzzerAllowed = true;
            f.saver.basePanel.dim = { dayMode: true, standby: 10, nightStandby: 10 };
            f.saver.basePanel.topic = 't';
            const during = f.during;
            return {
                ...f,
                now,
                indicator: () => f.saver.pageItems[0],
                mricon: () => f.saver.pageItems[1],
                notify: () => f.saver.pageItems[2],
                kinds: (messages: string[]): string[] => messages.map(m => m.split('~')[0]),
                // Panel.setActivePage with another page before: visibility turns on
                show: async (): Promise<string[]> => {
                    f.saver.basePanel.lastCard = 'cardGrid';
                    f.saver.resetLastMessage();
                    return during(() => f.saver.onVisibilityChange(true));
                },
                // Panel.setActivePage with the active page: no onVisibilityChange
                sleepReachedOnSamePage: async (): Promise<string[]> =>
                    during(async () => {
                        f.saver.sendType(true);
                        await f.saver.update();
                    }),
                lockTimers: () => f.timers.filter(t => t.ms <= 2000),
            };
        }
        const press = { page: 0, id: '0', action: 'button', opt: '' };
        const at = (ms: number): void => {
            Date.now = (): number => NOW + ms;
        };

        describe('update()', () => {
            it('the same content sends nothing and starts no pause', async () => {
                const s = await scene();
                await s.show();
                at(5000);
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);
                s.now.value = 'B';
                at(5100);
                expect(s.kinds(await s.during(() => s.saver.update()))).to.deep.equal(['weatherUpdate']);
            });

            it('a change within the 2 s waits with one timer and reads the values again', async () => {
                const s = await scene();
                await s.show();
                s.now.value = 'B';
                at(1000);
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);
                s.now.value = 'C';
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);
                const waiting = s.lockTimers();
                expect(waiting.map(t => t.ms)).to.deep.equal([1000]);
                at(2000);
                const sent = await s.during(async () => {
                    waiting[0].fn();
                    await new Promise(resolve => setImmediate(resolve));
                });
                expect(s.kinds(sent)).to.deep.equal(['weatherUpdate']);
                expect(sent[0]).to.include('~C');
            });

            it('nothing is left when the value is back at the end of the wait', async () => {
                const s = await scene();
                await s.show();
                s.now.value = 'B';
                at(1000);
                await s.saver.update();
                s.now.value = 'A';
                at(2000);
                const sent = await s.during(async () => {
                    s.lockTimers()[0].fn();
                    await new Promise(resolve => setImmediate(resolve));
                });
                expect(sent).to.deep.equal([]);
            });

            it('an older run that ends last does not overwrite a newer one', async () => {
                const s = await scene();
                await s.show();
                at(5000);
                const original = s.indicator().getPageItemPayload;
                let finish: (value: string) => void = () => undefined;
                s.indicator().getPageItemPayload = async (): Promise<string> =>
                    new Promise<string>(resolve => {
                        finish = resolve;
                    });
                const older = s.saver.update();
                await new Promise(resolve => setImmediate(resolve));
                s.indicator().getPageItemPayload = original;
                s.now.value = 'NEW';
                await s.saver.update();
                finish('~~icon~1~name~OLD');
                await older;
                const weather = s.sent.filter(m => m.startsWith('weatherUpdate'));
                expect(weather.at(-1)).to.include('NEW');
                expect(weather.join()).to.not.include('OLD');
            });

            it('statusUpdate and notify: nothing with the same content, with a change also without a trigger', async () => {
                const s = await scene({ notify: true });
                await s.show();
                at(5000);
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);

                s.now.mr = 'other';
                expect(s.kinds(await s.during(() => s.saver.update()))).to.deep.equal(['statusUpdate']);
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);

                s.now.text = 'Other';
                expect(await s.during(() => s.saver.update())).to.deep.equal(['notify~Head~Other']);
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);
            });

            it('their own triggers still send a change at once', async () => {
                const s = await scene();
                await s.show();
                s.now.mr = 'other';
                s.now.notify = true;
                expect(s.kinds(await s.during(() => s.saver.onStateTrigger('x', s.mricon())))).to.deep.equal([
                    'statusUpdate',
                ]);
                const notify = await s.during(() => s.saver.onStateTrigger('x', s.notify()));
                expect(notify.filter(m => m.startsWith('notify~'))).to.deep.equal(['notify~Head~Text']);
                expect(await s.during(() => s.saver.onStateTrigger('x', s.notify()))).to.deep.equal([]);
            });

            it('a deferred update sends neither of them', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.value = 'B';
                s.now.mr = 'other';
                s.now.text = 'Other';
                at(1000);
                expect(await s.during(() => s.saver.update())).to.deep.equal([]);
            });

            it('sends no empty notify without a notification shown before', async () => {
                const s = await scene();
                await s.show();
                at(5000);
                s.now.value = 'B';
                expect(s.kinds(await s.during(() => s.saver.update()))).to.deep.equal(['weatherUpdate']);
                expect(s.sent).to.not.include('notify~~');
            });

            it('the big icons of the status come through without a trigger of an item', async () => {
                const s = await scene();
                await s.show();
                s.saver.basePanel.info.nspanel.bigIconLeft = true;
                const sent = await s.during(() => s.saver.HandleScreensaverStatusIcons());
                expect(s.kinds(sent)).to.deep.equal(['statusUpdate']);
            });

            it('resetLastMessage empties the memory', async () => {
                const s = await scene();
                await s.show();
                at(5000);
                s.saver.resetLastMessage();
                expect(s.kinds(await s.during(() => s.saver.update()))).to.deep.equal([
                    'weatherUpdate',
                    'color',
                    'statusUpdate',
                ]);
            });
        });

        describe('press', () => {
            it('a repeated event during the first one does not run the command again', async () => {
                for (const hangsIn of ['releaseTriggerThrottle', 'onCommand']) {
                    const s = await scene();
                    let commands = 0;
                    let go: () => void = () => undefined;
                    const hang = async (): Promise<void> =>
                        new Promise<void>(resolve => {
                            go = resolve;
                        });
                    if (hangsIn === 'releaseTriggerThrottle') {
                        s.saver.releaseTriggerThrottle = hang;
                    }
                    s.indicator().onCommand = async (): Promise<boolean> => {
                        commands++;
                        if (hangsIn === 'onCommand') {
                            await hang();
                        }
                        return false;
                    };
                    const first = s.saver.onButtonEvent(press);
                    await new Promise(resolve => setImmediate(resolve));
                    await s.saver.onButtonEvent(press);
                    go();
                    await first;
                    expect(commands, hangsIn).to.equal(1);
                }
            });

            it('the block ends after 500 ms and goes with the page', async () => {
                const s = await scene();
                const from = s.timers.length;
                await s.saver.onButtonEvent(press);
                const block = s.timers.slice(from).find(t => t.ms === 500);
                expect(block).to.not.equal(undefined);
                block?.fn();
                expect(s.saver.blockButtons).to.equal(undefined);

                await s.saver.onButtonEvent(press);
                const second = s.timers
                    .slice(from)
                    .filter(t => t.ms === 500)
                    .at(-1);
                await s.saver.delete();
                expect(second?.cleared).to.equal(true);
            });

            it('no block and no command while unloading', async () => {
                const s = await scene();
                let commands = 0;
                s.indicator().onCommand = async (): Promise<boolean> => {
                    commands++;
                    return Promise.resolve(false);
                };
                s.saver.adapter.unload = true;
                await s.saver.onButtonEvent(press);
                expect(commands).to.equal(0);
                expect(s.saver.blockButtons).to.equal(undefined);
            });

            it('goes out at once within the pause, the ack after it sends nothing', async () => {
                const s = await scene();
                await s.show();
                at(500);
                await s.saver.onButtonEvent(press);
                const sent = await s.during(() => s.saver.onStateTrigger('x', s.indicator()));
                expect(s.kinds(sent)).to.deep.equal(['weatherUpdate']);
                expect(sent[0]).to.include('A+');
                expect(s.lockTimers().filter(t => !t.cleared && t.ms === 1500)).to.deep.equal([]);

                at(600);
                expect(await s.during(() => s.saver.onStateTrigger('x', s.indicator()))).to.deep.equal([]);
            });

            it('a trigger just before it does not hold back the next one', async () => {
                const s = await scene();
                const seen: string[] = [];
                s.saver.onStateTrigger = async (dp: string): Promise<void> => void seen.push(dp);
                const source = s.indicator();
                await s.saver.onStateTriggerSuperDoNotOverride('first', source);
                await s.saver.onStateTriggerSuperDoNotOverride('waits', source);
                expect(seen).to.deep.equal(['first']);
                await s.saver.onButtonEvent(press);
                expect(seen).to.deep.equal(['first', 'waits']);
                await s.saver.onStateTriggerSuperDoNotOverride('of the press', source);
                expect(seen).to.deep.equal(['first', 'waits', 'of the press']);
            });
        });

        describe('show', () => {
            it('sends everything in the known order, also with the same content', async () => {
                const s = await scene({ notify: true });
                await s.show();
                const again = await s.show();
                expect(s.kinds(again)).to.deep.equal([
                    'pageType',
                    'time',
                    'weatherUpdate',
                    'color',
                    'statusUpdate',
                    'notify',
                ]);
            });

            it('sends no empty notify', async () => {
                const s = await scene();
                expect(s.kinds(await s.show())).to.not.include('notify');
                expect(s.kinds(await s.show())).to.not.include('notify');
            });

            it('sends no empty notify when the notification went away while the page was left', async () => {
                const s = await scene({ notify: true });
                await s.show();
                expect(s.saver.activeNotification).to.equal(true);
                await s.saver.onTimerTap('swipeUp', '');
                s.saver.sendColors();
                await s.saver.onVisibilityChange(false);
                s.now.notify = false;
                const sent = await s.show();
                expect(s.kinds(sent)).to.not.include('notify');
                expect(s.saver.activeNotification).to.equal(false);
                expect(s.saver.colorsDropped).to.equal(false);
                expect(s.saver.activeNotifyId).to.equal('');
                // and nothing is left to clear afterwards
                expect(await s.during(() => s.saver.HandleNotification())).to.deep.equal([]);
            });

            it('without a new pageType the display still shows it: clears it once', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.notify = false;
                s.saver.sendType = (): void => undefined;
                const sent = await s.during(() => s.saver.onVisibilityChange(true));
                expect(sent.filter(m => m.startsWith('notify~'))).to.deep.equal(['notify~~']);
            });

            it('sleepReached on the active page shows the notification again and everything else', async () => {
                const s = await scene({ notify: true });
                await s.show();
                at(500);
                await s.saver.onTimerTap('bExit', '1');
                expect(await s.during(() => s.saver.HandleNotification())).to.deep.equal([]);
                const sent = await s.sleepReachedOnSamePage();
                expect(s.kinds(sent)).to.deep.equal(['pageType', 'weatherUpdate', 'color', 'statusUpdate', 'notify']);
            });

            it('sleepReached on the active page sends the pageType also right behind another one', async () => {
                const s = await scene();
                s.saver.sendType(true);
                expect(s.kinds(await s.during(async () => s.saver.sendType(true)))).to.deep.equal(['pageType']);
            });

            it('sends no empty notify after sleepReached on the active page', async () => {
                const s = await scene();
                await s.show();
                expect(s.kinds(await s.sleepReachedOnSamePage())).to.not.include('notify');
            });
        });

        describe('notification', () => {
            it('a touch does not bring it back, also not after the timeout of the panel', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.notify().config.role = '';
                const from = s.timers.length;
                let swallowed = false;
                const sent = await s.during(async () => {
                    await s.saver.onTimerTap('bExit', '1');
                    swallowed = await s.saver.onScreensaverTap();
                    await s.saver.onButtonEvent(press);
                });
                expect(s.kinds(sent)).to.not.include('notify');
                // deactivateNotify keeps swallowing the tap
                expect(swallowed).to.equal(true);
                expect(s.timers.slice(from).filter(t => t.ms === 15_000)).to.deep.equal([]);
                at(20_000);
                // the press changed the value of the item, the only thing that goes out
                expect(s.kinds(await s.during(() => s.saver.update()))).to.deep.equal(['weatherUpdate']);
                expect(await s.during(() => s.saver.HandleNotification())).to.deep.equal([]);
            });

            it('comes back after a touch with a new content or a pageType', async () => {
                const s = await scene({ notify: true });
                await s.show();
                await s.saver.onTimerTap('bExit', '1');
                s.now.text = 'Other';
                expect(await s.during(() => s.saver.HandleNotification())).to.deep.equal(['notify~Head~Other']);
                await s.saver.onTimerTap('bExit', '1');
                expect(s.kinds(await s.sleepReachedOnSamePage())).to.include('notify');
            });

            it('a tap without a notification sends no empty notify', async () => {
                const s = await scene();
                await s.show();
                const sent = await s.during(async () => {
                    await s.saver.onTimerTap('bExit', '1');
                    await s.saver.onScreensaverTap();
                    await s.saver.onButtonEvent(press);
                });
                expect(s.kinds(sent)).to.not.include('notify');
            });

            it('a dismissed one does not come back, clearing is one empty notify', async () => {
                const s = await scene({ notify: true });
                await s.show();
                await s.saver.onTimerTap('bExit', '1');
                const sent = await s.during(() => s.saver.onScreensaverTap());
                expect(sent.filter(m => m.startsWith('notify~'))).to.deep.equal(['notify~~']);
                expect(await s.sleepReachedOnSamePage()).to.not.include('notify~Head~Text');
            });

            it('is cleared with exactly one empty notify when it goes away', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.notify = false;
                const sent = await s.during(() => s.saver.onStateTrigger('x', s.notify()));
                expect(sent.filter(m => m.startsWith('notify~'))).to.deep.equal(['notify~~']);
                expect(await s.during(() => s.saver.onStateTrigger('x', s.notify()))).to.deep.equal([]);
            });

            it('rings once, a touch and the way back with a pageType are no new notification', async () => {
                const s = await scene({ notify: true });
                await s.show();
                expect(s.sent.filter(m => m.startsWith('buzzer'))).to.have.length(1);
                s.notify().config.role = '';
                await s.saver.onScreensaverTap();
                await s.saver.onTimerTap('bExit', '1');
                await s.sleepReachedOnSamePage();
                expect(s.sent.filter(m => m === 'notify~Head~Text')).to.have.length(2);
                expect(s.sent.filter(m => m.startsWith('buzzer'))).to.have.length(1);
            });

            it('an update does not bring a touched one back, without ringing', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.notify().config.role = '';
                at(5000);
                const sent = await s.during(async () => {
                    await s.saver.onTimerTap('bExit', '1');
                    await s.saver.onScreensaverTap();
                    await s.saver.update();
                    s.now.value = 'B';
                    await s.saver.update();
                });
                expect(s.kinds(sent)).to.deep.equal(['weatherUpdate']);
                expect(s.sent.filter(m => m.startsWith('buzzer'))).to.have.length(1);
            });

            it('after a touch the values reach the HMI and count as sent, nothing hangs', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.value = 'B';
                at(5000);
                await s.saver.update();
                expect(s.saver.weatherDropped).to.equal(true);

                // what the HMI dropped behind the notification follows the touch once
                expect(s.kinds(await s.during(() => s.saver.onTimerTap('swipeUp', '')))).to.deep.equal([
                    'weatherUpdate',
                ]);
                expect(s.saver.weatherDropped).to.equal(false);
                expect(s.saver.activeNotification).to.equal(true);

                s.now.value = 'C';
                s.saver.timeColor = (): RGB => Color.Red;
                at(10_000);
                expect(s.kinds(await s.during(() => s.saver.update()))).to.deep.equal(['weatherUpdate', 'color']);
                expect(s.saver.weatherDropped).to.equal(false);
                expect(s.saver.colorsDropped).to.equal(false);
                // no repeat with the next touch, and none when the notification ends
                expect(await s.during(() => s.saver.onTimerTap('swipeUp', ''))).to.deep.equal([]);
                s.now.notify = false;
                expect(await s.during(() => s.saver.HandleNotification())).to.deep.equal(['notify~~']);
            });

            it('a new notification after a touch makes the HMI drop values again', async () => {
                const s = await scene({ notify: true });
                await s.show();
                await s.saver.onTimerTap('swipeUp', '');
                s.now.text = 'Other';
                await s.saver.HandleNotification();
                s.now.value = 'B';
                at(5000);
                await s.saver.update();
                expect(s.saver.weatherDropped).to.equal(true);
            });

            it('a touch on a dark display may have cleared nothing: nothing gets lost', async () => {
                const s = await scene({ notify: true });
                s.saver.basePanel.dim.standby = 0;
                await s.show();
                await s.saver.onTimerTap('swipeUp', '');
                s.now.value = 'B';
                at(5000);
                await s.saver.update();
                expect(s.saver.weatherDropped).to.equal(true);
                s.now.notify = false;
                const sent = await s.during(() => s.saver.HandleNotification());
                expect(s.kinds(sent)).to.deep.equal(['notify', 'weatherUpdate']);
            });

            it('an empty custom notification sends nothing', async () => {
                const s = await scene();
                await s.show();
                s.saver.customNotification = true;
                expect(await s.during(() => s.saver.HandleNotification())).to.deep.equal([]);
            });

            it('values and colors the HMI dropped behind a notification follow when it goes away', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.value = 'B';
                at(5000);
                s.saver.timeColor = (): RGB => Color.Red;
                await s.saver.update();
                expect(s.saver.weatherDropped).to.equal(true);
                expect(s.saver.colorsDropped).to.equal(true);
                s.now.notify = false;
                const sent = await s.during(() => s.saver.onStateTrigger('x', s.notify()));
                expect(s.kinds(sent)).to.deep.equal(['notify', 'weatherUpdate', 'color']);
                expect(sent[1]).to.include('~B');
                expect(s.saver.weatherDropped).to.equal(false);
                expect(s.saver.colorsDropped).to.equal(false);
            });

            it('values the HMI dropped follow right after the touch that cleared it', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.value = 'B';
                at(5000);
                await s.saver.update();
                const sent = await s.during(() => s.saver.onTimerTap('swipeUp', ''));
                expect(s.kinds(sent)).to.deep.equal(['weatherUpdate']);
            });

            it('nothing is repeated when nothing was dropped', async () => {
                const s = await scene({ notify: true });
                await s.show();
                s.now.notify = false;
                const sent = await s.during(() => s.saver.onStateTrigger('x', s.notify()));
                expect(s.kinds(sent)).to.deep.equal(['notify']);
            });

            it('the tap on a timer shows it again at once, although its content is the same', async () => {
                const f = await setup(simple, { 'x.0.on': true, 'x.0.ts': NOW + 600_000 });
                f.saver.customNotification = true;
                f.saver.headingNotification = 'Head';
                f.saver.textNotification = 'Text';
                await f.saver.HandleNotification();
                await f.saver.HandleTime();
                const sent = await f.during(() => f.saver.onTimerTap('bExit', '1'));
                expect(sent.filter(m => m.startsWith('notify~'))).to.deep.equal(['notify~Head~Text']);
            });
        });
    });
});

describe('lib/pages/screensaver - tile tap of the TFT 6.0.8+ (taps counted)', () => {
    const writable = (calls: string[], name: string): any => ({
        writeable: true,
        setStateTrue: async (): Promise<void> => void calls.push(`${name}:true`),
        setStateFlip: async (): Promise<void> => void calls.push(`${name}:flip`),
    });

    /**
     * a screensaver with indicators 0..n-1 of the given data, `commands` collects what onCommand did
     *
     * @param entries type, role and data of the indicators
     */
    function tileSaver(entries: { type: string; role?: string; data: Record<string, unknown> }[]): {
        saver: Screensaver;
        writes: Writes;
        commands: string[];
    } {
        const writes: Writes = [];
        const commands: string[] = [];
        const noop = (): void => undefined;
        const saver = Object.create(Screensaver.prototype) as Screensaver;
        const pageItems = entries.map((entry, i) => ({
            config: { modeScr: 'indicator' },
            dataItems: entry,
            onCommand: async (action: string, value: string): Promise<boolean> => {
                commands.push(`${i}:${action}:${value}`);
                return Promise.resolve(true);
            },
            onCommandLongPress: async (action: string, value: string): Promise<boolean> => {
                commands.push(`${i}:long:${action}:${value}`);
                return Promise.resolve(true);
            },
        }));
        Object.assign(saver, {
            pageItems,
            unload: false,
            activeNotification: false,
            log: { debug: noop, info: noop, warn: noop, error: noop },
            adapter: { unload: false, setTimeout: (): number => 1, clearTimeout: noop },
            library: {
                writedp: async (id: string, val: unknown): Promise<void> => {
                    writes.push({ id, val });
                    return Promise.resolve();
                },
            },
            basePanel: { name: 'A0' },
        });
        return { saver, writes, commands };
    }
    const event = (id: string, opt = '1'): Types.IncomingEvent => ({
        type: 'event',
        method: 'buttonPress2',
        page: 0,
        id,
        action: 'button',
        opt,
    });

    it('a configured action is a key, it runs the command with the taps', async () => {
        const calls: string[] = [];
        const { saver, writes, commands } = tileSaver([
            { type: 'button', data: { setNavi: { type: 'const' } } },
            { type: 'button', data: { setValue2: writable(calls, 'button') } },
            { type: 'button', data: { setValue1: writable(calls, 'switch') } },
            { type: 'button', data: { setValue3: writable(calls, 'cycle'), valueList: {} } },
            { type: 'button', data: { popup: { setMessage: writable(calls, 'popup') } } },
            { type: 'button', data: { confirm: { type: 'const' }, setValue2: writable(calls, 'confirmed') } },
        ]);
        for (const id of ['0', '1', '2', '3', '4', '5']) {
            expect(await saver.onIndicatorTap(event(id, '2')), id).to.equal(true);
        }
        expect(commands).to.deep.equal([0, 1, 2, 3, 4, 5].map(n => `${n}:button:2`));
        expect(writes.map(w => w.id)).to.deep.equal([1, 2, 3, 4, 5, 6].map(n => `panels.A0.buttons.indicator-${n}`));
    });

    it('a merely writable state is no key, a blind neither; indicator-N is written anyway', async () => {
        const calls: string[] = [];
        const { saver, writes, commands } = tileSaver([
            { type: 'button', data: { entity1: { value: writable(calls, 'state') } } },
            { type: 'button', data: { entity1: { set: writable(calls, 'set') } } },
            { type: 'button', data: { setTrue: writable(calls, 'true'), setFalse: writable(calls, 'false') } },
            { type: 'button', role: 'blind', data: { entity1: { value: writable(calls, 'blind') } } },
            { type: 'text', data: { entity1: { value: writable(calls, 'text') } } },
            { type: 'button', data: { entity1: { value: { writeable: false } } } },
            // a state of an action that does not exist or is not writable gives no data item
            { type: 'button', data: { setValue1: undefined } },
            // confirm only guards an action, alone it is none
            { type: 'button', data: { confirm: { type: 'const' }, entity1: { value: writable(calls, 'confirm') } } },
        ]);
        for (const id of ['0', '1', '2', '3', '4', '5', '6', '7']) {
            expect(await saver.onIndicatorTap(event(id)), id).to.equal(false);
        }
        expect(commands).to.deep.equal([]);
        expect(calls).to.deep.equal([]);
        expect(writes).to.have.length(8);
    });

    /**
     * the branch of Panel.HandleIncomingMessage for a tile: buttonPress3 runs the long press of the item, without
     * one it goes on like buttonPress2; no key: the tap counts as bExit
     *
     * @param saver the screensaver
     * @param e the event
     */
    async function pressLikeThePanel(saver: Screensaver, e: Types.IncomingEvent): Promise<'long' | 'tap' | 'bExit'> {
        if (e.method === 'buttonPress3' && (await saver.onIndicatorLongPress(e))) {
            return 'long';
        }
        return (await saver.onIndicatorTap(e)) ? 'tap' : 'bExit';
    }
    const longEvent = (id: string, opt = '1'): Types.IncomingEvent => ({ ...event(id, opt), method: 'buttonPress3' });

    it('long press with an own long press: runs it, not the short action; indicatorLong-N only', async () => {
        const calls: string[] = [];
        const { saver, writes, commands } = tileSaver([
            { type: 'button', data: { setValue2: writable(calls, 'short'), longPress: writable(calls, 'long') } },
            { type: 'button', data: { setNavi: { type: 'const' }, setNaviLongPress: { type: 'const' } } },
            { type: 'button', data: { longPress: writable(calls, 'long') } },
        ]);
        for (const id of ['0', '1', '2']) {
            expect(await pressLikeThePanel(saver, longEvent(id, '3')), id).to.equal('long');
        }
        expect(commands).to.deep.equal(['0:long:button:3', '1:long:button:3', '2:long:button:3']);
        expect(writes.map(w => w.id)).to.deep.equal([1, 2, 3].map(n => `panels.A0.buttons.indicatorLong-${n}`));
    });

    it('long press without an own long press acts like a tap and writes indicatorLong-N and indicator-N', async () => {
        const calls: string[] = [];
        const { saver, writes, commands } = tileSaver([
            { type: 'button', data: { setValue2: writable(calls, 'short') } },
            { type: 'button', data: { entity1: { value: writable(calls, 'state') } } },
        ]);
        expect(await pressLikeThePanel(saver, longEvent('0', '2'))).to.equal('tap');
        // no key: the long press counts like a touch of the background
        expect(await pressLikeThePanel(saver, longEvent('1', '3'))).to.equal('bExit');
        expect(commands).to.deep.equal(['0:button:2']);
        expect(writes.map(w => w.id)).to.deep.equal([
            'panels.A0.buttons.indicatorLong-1',
            'panels.A0.buttons.indicator-1',
            'panels.A0.buttons.indicatorLong-2',
            'panels.A0.buttons.indicator-2',
        ]);
    });

    it('a short tap never runs the long press', async () => {
        const calls: string[] = [];
        const { saver, writes, commands } = tileSaver([
            { type: 'button', data: { setValue2: writable(calls, 'short'), longPress: writable(calls, 'long') } },
        ]);
        expect(await pressLikeThePanel(saver, event('0', '1'))).to.equal('tap');
        expect(commands).to.deep.equal(['0:button:1']);
        expect(writes.map(w => w.id)).to.deep.equal(['panels.A0.buttons.indicator-1']);
    });

    it('knows the items of the page only', () => {
        const { saver } = tileSaver([{ type: 'button', data: {} }]);
        expect(saver.isIndicatorEvent(event('0'))).to.equal(true);
        expect(saver.isIndicatorEvent(event('5'))).to.equal(false);
        expect(saver.isIndicatorEvent({ ...event('0'), page: undefined })).to.equal(false);
    });
});

describe('lib/pages/pageItem - indicator command on the screensaver', () => {
    /**
     * a page item of the screensaver
     *
     * @param data data items of the indicator
     * @param role role of the item
     */
    function item(
        data: (calls: string[]) => Record<string, unknown>,
        role?: string,
    ): { item: PageItem; calls: string[] } {
        const calls: string[] = [];
        const noop = (): void => undefined;
        const parent = {
            isScreensaver: true,
            isIndicatorKey: Screensaver.prototype.isIndicatorKey,
            basePanel: {
                navigation: {
                    resetPosition: (): void => void calls.push('reset'),
                    setCurrentPage: async (): Promise<void> => void calls.push('mainPage'),
                    setTargetPageByName: async (name: string): Promise<void> => void calls.push(`navi:${name}`),
                },
            },
        };
        const pageItem = Object.create(PageItem.prototype) as PageItem;
        Object.assign(pageItem, {
            id: 'x',
            log: { debug: noop, info: noop, warn: noop, error: noop },
            dataItems: { type: 'button', role, data: data(calls) },
            parent,
        });
        return { item: pageItem, calls };
    }
    const state = (calls: string[], name: string, val = false): any => ({
        writeable: true,
        getBoolean: async (): Promise<boolean> => Promise.resolve(val),
        getString: async (): Promise<string> => Promise.resolve(name),
        setStateTrue: async (): Promise<void> => void calls.push(`${name}:true`),
        setStateFlip: async (): Promise<void> => void calls.push(`${name}:flip`),
        setState: async (v: unknown): Promise<void> => void calls.push(`${name}:${String(v)}`),
    });
    const button = (calls: string[]): Record<string, unknown> => ({ setValue2: state(calls, 'button') });
    const writableOnly = (calls: string[]): Record<string, unknown> => ({
        entity1: { value: state(calls, 'value'), set: state(calls, 'set') },
        setTrue: state(calls, 'setTrue'),
        setFalse: state(calls, 'setFalse'),
    });

    it('an older TFT (no taps): an indicator with an action runs it', async () => {
        const { item: i, calls } = item(button);
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['button:true']);
    });

    it('an older TFT (no taps): an indicator without an action jumps to the main page and writes nothing', async () => {
        const { item: i, calls } = item(writableOnly);
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['reset', 'mainPage']);
    });

    it('with the taps of the TFT 6.0.8+ the action runs (Screensaver.onIndicatorTap checks the key before)', async () => {
        const { item: i, calls } = item(button);
        await i.onCommand('button', '1');
        expect(calls).to.deep.equal(['button:true']);
    });

    it('with the taps of the TFT 6.0.8+ a writable state alone is never switched', async () => {
        const { item: i, calls } = item(writableOnly);
        await i.onCommand('button', '1');
        expect(calls).to.deep.equal([]);
    });

    it('a blind never moves, also on an older TFT', async () => {
        const { item: i, calls } = item(c => ({ entity1: { value: state(c, 'blind') } }), 'blind');
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['reset', 'mainPage']);
    });

    it('an action next to a writable state: only the action runs', async () => {
        const { item: i, calls } = item(c => ({ ...writableOnly(c), setNavi: state(c, 'page') }));
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['navi:page']);
    });

    it('a popup counts as action', async () => {
        const { item: i, calls } = item(c => ({
            ...writableOnly(c),
            popup: { getMessage: state(c, 'msg'), setMessage: state(c, 'popup') },
        }));
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['popup:{"headline":"","message":"msg"}']);
    });
    it('confirm alone is no action: older TFT jumps to the main page, TFT 6.0.8+ writes nothing', async () => {
        const confirmOnly = (c: string[]): Record<string, unknown> => ({
            ...writableOnly(c),
            confirm: state(c, 'confirm'),
        });
        const old = item(confirmOnly);
        await old.item.onCommand('button', '');
        expect(old.calls).to.deep.equal(['reset', 'mainPage']);
        const tft = item(confirmOnly);
        await tft.item.onCommand('button', '1');
        expect(tft.calls).to.deep.equal([]);
    });

    it('confirm with an action: the first tap asks, the action runs after the confirmation', async () => {
        const { item: i, calls } = item(c => ({ ...button(c), confirm: state(c, 'confirm') }));
        const noop = (): void => undefined;
        Object.assign(i, {
            timeouts: {},
            adapter: { setTimeout: (): number => 1, clearTimeout: noop },
            confirmClick: 'lock',
        });
        Object.assign(i.parent, { update: async (): Promise<void> => void calls.push('update') });
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['update']);
        // PageItem.getPageItemPayload stores the time of the confirmation
        i.confirmClick = Date.now() - 1000;
        await i.onCommand('button', '');
        expect(calls).to.deep.equal(['update', 'update', 'button:true']);
    });
});
