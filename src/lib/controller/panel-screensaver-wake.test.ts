/**
 * A touch of the screensaver background while a notification stands on the dark display (standby brightness 0):
 * Panel.onScreensaverTouch follows {@link Screensaver.onExitTap} - wake only, take the notification away without a
 * navigation, or leave the screensaver whatever the double click option says. Panel.HandleIncomingMessage with a bare
 * Panel prototype and a fake screensaver whose decision is given by the test.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';
import type { ScreensaverExitTap } from '../pages/screensaver';

type Calls = string[];

function setup(
    exitTap: ScreensaverExitTap,
    doubleClick = true,
    notifyTaken = false,
): { panel: Panel; calls: Calls; writes: { id: string; val: unknown }[] } {
    const calls: Calls = [];
    const writes: { id: string; val: unknown }[] = [];
    const noop = (): void => undefined;
    const screenSaver: any = {
        screensaverSwipe: true,
        isIndicatorEvent: (event: Types.IncomingEvent): boolean => event.id === '12',
        // the real one: opt 1 on a dark display - here the display is dark when the test decides 'wake'
        onIndicatorWakeTap: (opt: string): boolean => {
            calls.push(`indicatorWake:${opt}`);
            return exitTap === 'wake' && Number(opt) <= 1;
        },
        onIndicatorTap: async (event: Types.IncomingEvent): Promise<boolean> => {
            calls.push(`tap:${event.id}:${event.opt}`);
            return Promise.resolve(false);
        },
        onExitTap: (opt: string): ScreensaverExitTap => {
            calls.push(`exit:${opt}`);
            return exitTap;
        },
        onTimerTap: async (action: string, opt: string): Promise<boolean> => {
            calls.push(`timer:${action}:${opt}`);
            return Promise.resolve(false);
        },
        onScreensaverTap: async (): Promise<boolean> => {
            calls.push('notify');
            return Promise.resolve(notifyTaken);
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
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
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

const background = (action: string, opt: string): Types.IncomingEvent => ({
    type: 'event',
    method: 'buttonPress2',
    id: 'screensaver',
    action,
    opt,
});

describe('lib/controller/panel - screensaver notification at standby brightness 0', () => {
    it('wake: nothing else - no state, no gesture, no timer tap, no notification, no navigation', async () => {
        for (const doubleClick of [true, false]) {
            const { panel, calls, writes } = setup('wake', doubleClick);
            await panel.HandleIncomingMessage(background('bExit', '1'));
            expect(calls).to.deep.equal(['exit:1']);
            expect(writes).to.deep.equal([]);
        }
    });

    it('dismiss: the notification is taken away without a navigation, also with double click', async () => {
        for (const doubleClick of [true, false]) {
            const { panel, calls, writes } = setup('dismiss', doubleClick);
            await panel.HandleIncomingMessage(background('bExit', '2'));
            expect(calls).to.deep.equal(['exit:2', 'notify']);
            expect(writes.map(w => `${w.id}=${String(w.val)}`)).to.include(
                'panels.A0.cmd.screenSaver.activateNotification=false',
            );
        }
    });

    it('leave: to the main page whatever the double click option says, no timer tap, no notification', async () => {
        for (const doubleClick of [true, false]) {
            const { panel, calls } = setup('leave', doubleClick, true);
            await panel.HandleIncomingMessage(background('bExit', '3'));
            expect(calls).to.deep.equal(['exit:3', 'resetPosition', 'mainPage']);
        }
    });

    it('normal: the old way - timer tap, notification, double click', async () => {
        const single = setup('normal');
        await single.panel.HandleIncomingMessage(background('bExit', '1'));
        expect(single.calls).to.deep.equal(['exit:1', 'timer:bExit:1', 'notify']);

        const double = setup('normal');
        await double.panel.HandleIncomingMessage(background('bExit', '2'));
        expect(double.calls).to.deep.equal(['exit:2', 'timer:bExit:2', 'notify', 'resetPosition', 'mainPage']);
    });

    it('a swipe is not decided by it', async () => {
        const { panel, calls } = setup('wake');
        await panel.HandleIncomingMessage(background('swipeUp', ''));
        expect(calls).to.deep.equal(['timer:swipeUp:', 'notify']);
    });

    it('a tile on the dark display: the first press only wakes, no tile tap and no background tap', async () => {
        const { panel, calls, writes } = setup('wake');
        await panel.HandleIncomingMessage({
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            id: '12',
            action: 'button',
            opt: '1',
        });
        expect(calls).to.deep.equal(['indicatorWake:1']);
        expect(writes).to.deep.equal([]);
    });

    it('a tile that is no key: the second press follows the rule of the background with its taps', async () => {
        const { panel, calls } = setup('dismiss');
        await panel.HandleIncomingMessage({
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            id: '12',
            action: 'button',
            opt: '2',
        });
        expect(calls.slice(0, 3)).to.deep.equal(['indicatorWake:2', 'tap:12:2', 'exit:2']);
        expect(calls).to.include('notify');
    });
});
