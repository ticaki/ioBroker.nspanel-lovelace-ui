import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

/**
 * `cmd.pagePopup.activate` collects the popup details from the state database. The test drives the
 * handler on a prototype-based Panel with a stubbed readdb and catches the details on their way to the
 * internal state `cmd/popupNotificationCustom` - no adapter, no constructor side effects.
 *
 * @param db state values by id, a missing key stands for a state readdb does not know yet
 * @returns the panel and the details handed to the internal state
 */
function withDb(db: Record<string, { val: unknown } | undefined>): {
    panel: Panel;
    details: Record<string, unknown>[];
    writes: string[];
} {
    const details: Record<string, unknown>[] = [];
    const writes: string[] = [];
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'NSPanel1',
        options: { kind: 'tasmota' },
        library: {
            readdb: (id: string): { val: unknown } | undefined => db[id],
            writedp: async (id: string, val: unknown, _obj: unknown, ack = true): Promise<void> => {
                writes.push(`${id} ${String(val)} ${String(ack)}`);
                return Promise.resolve();
            },
        },
        statesControler: {
            setInternalState: async (_id: string, val: string): Promise<void> => {
                details.push(JSON.parse(val));
                return Promise.resolve();
            },
        },
        controller: { panels: [] },
    });
    return { panel, details, writes };
}

describe('Panel.onStateChange - cmd.pagePopup.activate', () => {
    const activate = (panel: Panel, val: boolean = true): Promise<void> => {
        const state: Types.nsPanelState = { val, ack: false, ts: 0, lc: 0, from: '', q: 0 };
        return panel.onStateChange('panels.NSPanel1.cmd.pagePopup.activate', state);
    };

    it('falls back to text size 3 when the textSize state is not known yet', async () => {
        const { panel, details } = withDb({});
        await activate(panel);
        expect(details).to.have.length(1);
        expect(details[0].textSize).to.equal('3');
    });

    it('keeps the configured text size', async () => {
        const { panel, details } = withDb({ 'panels.NSPanel1.cmd.pagePopup.textSize': { val: 5 } });
        await activate(panel);
        expect(details[0].textSize).to.equal('5');
    });

    it('fires on every write without ack and resets the button to false with ack', async () => {
        for (const val of [true, false]) {
            const { panel, details, writes } = withDb({});
            await activate(panel, val);
            expect(details).to.have.length(1);
            expect(writes).to.deep.equal(['panels.NSPanel1.cmd.pagePopup.activate false true']);
        }
    });
});

describe('Panel.onStateChange - cmd.buttons.left/right', () => {
    for (const side of ['left', 'right'] as const) {
        it(`${side}: fires on every write without ack and resets the button to false with ack`, async () => {
            for (const val of [true, false]) {
                const { panel, writes } = withDb({});
                const state: Types.nsPanelState = { val, ack: false, ts: 0, lc: 0, from: '', q: 0 };
                await panel.onStateChange(`panels.NSPanel1.cmd.buttons.${side}`, state);
                expect(writes).to.deep.equal([
                    `panels.NSPanel1.buttons.${side} true true`,
                    `panels.NSPanel1.cmd.buttons.${side} false true`,
                ]);
            }
        });
    }
});

describe('Panel.onDetachButtonEvent - web clone of a hardware panel', () => {
    type Mode = 'button' | 'switch' | 'buttonOnDelayOff' | 'buttonOffDelayOn' | 'buttonDelayOn' | 'buttonDelayOff';
    const stateModes: Mode[] = [
        'button',
        'switch',
        'buttonOnDelayOff',
        'buttonOffDelayOn',
        'buttonDelayOn',
        'buttonDelayOff',
    ];

    /**
     * @param clone a web clone (kind web with sourceTopic) or the hardware panel
     * @param left the configuration of the left button
     * @returns the panel and what it did, in order
     */
    function button(clone: boolean, left: Record<string, unknown>): { panel: Panel; calls: string[] } {
        const calls: string[] = [];
        const panel = Object.create(Panel.prototype) as Panel;
        const timers: (() => Promise<void>)[] = [];
        Object.assign(panel, {
            name: 'NSPanel1',
            options: clone ? { kind: 'web', sourceTopic: 'nspanel1' } : { kind: 'tasmota' },
            buttons: { left, right: null },
            buttonBackFlipTimeout: { left: undefined, right: undefined },
            log: { error: (m: string): void => void calls.push(`error:${m}`) },
            adapter: {
                unload: false,
                setTimeout: (fn: (...args: unknown[]) => Promise<void>, _ms: number, ...args: unknown[]): number => {
                    timers.push(() => fn(...args));
                    calls.push('timer');
                    return timers.length;
                },
                clearTimeout: (): void => undefined,
            },
            library: {
                writedp: async (id: string, val: unknown): Promise<void> => {
                    calls.push(`write:${id}=${String(val)}`);
                    return Promise.resolve();
                },
            },
            navigation: {
                setTargetPageByName: async (page: string): Promise<void> => {
                    calls.push(`page:${page}`);
                    return Promise.resolve();
                },
            },
            navigateByButton: async (target: string): Promise<void> => {
                calls.push(`navigate:${target}`);
                return Promise.resolve();
            },
        });
        return { panel, calls };
    }
    const state = (calls: string[]): Record<string, unknown> => ({
        setStateTrue: async (): Promise<void> => void calls.push('setStateTrue'),
        setStateFlip: async (): Promise<void> => void calls.push('setStateFlip'),
        setState: async (val: unknown): Promise<void> => void calls.push(`setState:${String(val)}`),
    });
    const press = (panel: Panel): Promise<void> => {
        const s: Types.nsPanelState = { val: true, ack: false, ts: 0, lc: 0, from: '', q: 0 };
        return panel.onStateChange('panels.NSPanel1.cmd.buttons.left', s);
    };

    for (const mode of stateModes) {
        it(`${mode}: cmd.buttons.left switches the state only in the hardware panel`, async () => {
            const hw = button(false, { mode, state: {} });
            Object.assign(hw.panel.buttons!.left!, { state: state(hw.calls) });
            await press(hw.panel);
            expect(hw.calls[0]).to.equal('write:panels.NSPanel1.buttons.left=true');
            expect(hw.calls.some(c => c.startsWith('setState') || c === 'timer')).to.equal(true);

            const web = button(true, { mode, state: {} });
            Object.assign(web.panel.buttons!.left!, { state: state(web.calls) });
            await press(web.panel);
            // only the reset of the command state - no action, no status state buttons.left
            expect(web.calls).to.deep.equal(['write:panels.NSPanel1.cmd.buttons.left=false']);
        });
    }

    it('switch: a press in the browser (event button1) still switches the state in the clone', async () => {
        const web = button(true, { mode: 'switch', state: {} });
        Object.assign(web.panel.buttons!.left!, { state: state(web.calls) });
        await web.panel.onDetachButtonEvent('left');
        expect(web.calls).to.deep.equal(['write:panels.NSPanel1.buttons.left=true', 'setStateFlip']);
    });

    it('page: the clone and the hardware panel both change their own page', async () => {
        for (const clone of [false, true]) {
            const p = button(clone, { mode: 'page', page: 'kitchen' });
            await press(p.panel);
            expect(p.calls).to.include('page:kitchen');
        }
    });

    it('navigation: the clone and the hardware panel both navigate', async () => {
        for (const clone of [false, true]) {
            const p = button(clone, { mode: 'navigation', target: 'next' });
            await press(p.panel);
            expect(p.calls).to.include('navigate:next');
        }
    });
});

describe('Panel.setBigIcon - cmd/bigIconLeft/Right in a web clone', () => {
    /**
     * @param clone a web clone (kind web with sourceTopic) or the hardware panel
     * @returns the panel and what it did, in order
     */
    function bigIcon(clone: boolean): { panel: Panel; calls: string[] } {
        const calls: string[] = [];
        const panel = Object.create(Panel.prototype) as Panel;
        Object.assign(panel, {
            name: 'NSPanel1',
            options: clone ? { kind: 'web', sourceTopic: 'nspanel1' } : { kind: 'tasmota' },
            info: {
                nspanel: { bigIconLeft: false, bigIconRight: false, model: 'eu', displayVersion: '6.2.0' },
                tasmota: {},
                internal: {},
            },
            adapter: { config: { useBetaTFT: false } },
            controller: {
                panels: [],
                globalPanelInfo: { availableTasmotaFirmwareVersion: '', availableTftFirmwareVersion: {} },
            },
            screenSaver: {
                HandleScreensaverStatusIcons: async (): Promise<void> => void calls.push('statusIcons'),
            },
            library: {
                writeFromJson: async (id: string): Promise<void> => void calls.push(`writeFromJson:${id}`),
            },
        });
        return { panel, calls };
    }
    // onInternalCommand is an instance field (set in the constructor) - its case calls setBigIcon
    const command = (panel: Panel, side: 'Left' | 'Right'): Promise<void> => panel.setBigIcon(side, true);

    for (const side of ['Left', 'Right'] as const) {
        it(`bigIcon${side}: the clone sets it and redraws but does not write info.*`, async () => {
            const web = bigIcon(true);
            await command(web.panel, side);
            expect(web.panel.info.nspanel[`bigIcon${side}`]).to.equal(true);
            expect(web.calls).to.deep.equal(['statusIcons']);
        });

        it(`bigIcon${side}: the hardware panel writes info.*`, async () => {
            const hw = bigIcon(false);
            await command(hw.panel, side);
            expect(hw.panel.info.nspanel[`bigIcon${side}`]).to.equal(true);
            expect(hw.calls).to.deep.equal(['statusIcons', 'writeFromJson:panels.NSPanel1.info']);
        });
    }
});
