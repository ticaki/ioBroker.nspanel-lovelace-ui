/**
 * A tile of the screensaver with the TFT 6.0.8+ (`buttonPress2,<page>?<n>,button,<taps>`): a key runs its command,
 * any other tile counts like a touch of the background (`buttonPress2,screensaver,bExit,<taps>`), the long press
 * (`buttonPress3`) is only logged. An older TFT (no taps) keeps the old way. Panel.HandleIncomingMessage with a bare
 * Panel prototype and a fake screensaver.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

type Calls = string[];

function setup(
    key: boolean,
    doubleClick = true,
): { panel: Panel; calls: Calls; writes: { id: string; val: unknown }[] } {
    const calls: Calls = [];
    const writes: { id: string; val: unknown }[] = [];
    const noop = (): void => undefined;
    const screenSaver: any = {
        screensaverSwipe: false,
        isIndicatorEvent: (event: Types.IncomingEvent): boolean => event.id === '12',
        onIndicatorTap: async (event: Types.IncomingEvent): Promise<boolean> => {
            calls.push(`tap:${event.id}:${event.opt}`);
            return Promise.resolve(key);
        },
        onTimerTap: async (action: string, opt: string): Promise<boolean> => {
            calls.push(`timer:${action}:${opt}`);
            return Promise.resolve(false);
        },
        onScreensaverTap: async (): Promise<boolean> => Promise.resolve(false),
        onButtonPress3: async (): Promise<boolean> => {
            calls.push('press3');
            return Promise.resolve(false);
        },
        onPopupRequest: async (): Promise<void> => {
            calls.push('popup');
            return Promise.resolve();
        },
        onButtonEvent: async (): Promise<void> => {
            calls.push('buttonEvent');
            return Promise.resolve();
        },
    };
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'A0',
        _isOnline: true,
        screenSaver,
        _activePage: screenSaver,
        screenSaverDoubleClick: doubleClick,
        lastSendTypeDate: 0,
        blockTouchEventsForMs: 200,
        blockScreensaverTouchEventsForMs: 500,
        pages: [],
        log: {
            silly: noop,
            debug: (m: string): void => {
                if (m.startsWith('Screensaver tile')) {
                    calls.push(`debug:${m}`);
                }
            },
            info: noop,
            warn: noop,
            error: noop,
        },
        adapter: { config: { debugLogMqtt: false } },
        library: {
            writedp: async (id: string, val: unknown): Promise<void> => {
                writes.push({ id, val });
                return Promise.resolve();
            },
        },
        navigation: {
            resetPosition: (): void => void calls.push('resetPosition'),
            setCurrentPage: async (): Promise<void> => {
                calls.push('mainPage');
                return Promise.resolve();
            },
        },
    });
    return { panel, calls, writes };
}

const tile = (opt: string, method: 'buttonPress2' | 'buttonPress3' = 'buttonPress2'): Types.IncomingEvent => ({
    type: 'event',
    method,
    page: 0,
    id: '12',
    action: 'button',
    opt,
});

describe('lib/controller/panel - screensaver tile with tap counter (TFT 6.0.8+)', () => {
    it('a key runs its command and nothing of the background', async () => {
        const { panel, calls } = setup(true);
        await panel.HandleIncomingMessage(tile('1'));
        expect(calls).to.deep.equal(['tap:12:1']);
    });

    it('no key: the tap is a touch of the background, a single one does not leave the screensaver', async () => {
        const { panel, calls, writes } = setup(false);
        await panel.HandleIncomingMessage(tile('1'));
        expect(calls).to.deep.equal(['tap:12:1', 'timer:bExit:1']);
        expect(writes.map(w => w.id)).to.deep.equal(['panels.A0.cmd.screenSaver.activateNotification']);
    });

    it('no key: the second tap of a double click (counted with the background) goes to the main page', async () => {
        const { panel, calls } = setup(false);
        await panel.HandleIncomingMessage(tile('2'));
        expect(calls).to.deep.equal(['tap:12:2', 'timer:bExit:2', 'resetPosition', 'mainPage']);
    });

    it('no key without double click: the first tap goes to the main page', async () => {
        const { panel, calls } = setup(false, false);
        await panel.HandleIncomingMessage(tile('1'));
        expect(calls).to.include('mainPage');
    });

    it('a long press is only logged: no command, no popup, no background', async () => {
        const { panel, calls, writes } = setup(true);
        await panel.HandleIncomingMessage(tile('1', 'buttonPress3'));
        expect(calls.filter(c => !c.startsWith('debug:'))).to.deep.equal([]);
        expect(calls.some(c => c.startsWith('debug:Screensaver tile 12'))).to.equal(true);
        expect(writes).to.deep.equal([]);
    });

    it('an older TFT (no taps) keeps the old way: popup request and button event of the page', async () => {
        const { panel, calls } = setup(true);
        await panel.HandleIncomingMessage(tile(''));
        expect(calls).to.deep.equal(['popup', 'buttonEvent']);
    });
});
