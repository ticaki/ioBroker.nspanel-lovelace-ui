import { expect } from 'chai';
import { Panel } from './panel';
import type { IncomingEvent } from '../types/types';

/**
 * `release` of an indicator (TFT 6.0.8) on its way through the panel, with a bare `Panel` prototype: parsed like every
 * event, it reaches the screensaver and nothing else, whatever page is active and whatever blocks touches.
 *
 * @param active the page the panel shows
 * @returns the panel and what its pages received
 */
function setup(active: 'screensaver' | 'main'): {
    panel: any;
    saver: { events: IncomingEvent[]; other: string[] };
    page: string[];
} {
    const page: string[] = [];
    const record = (name: string, list: string[]) => async (): Promise<boolean> => {
        list.push(name);
        return Promise.resolve(false);
    };
    const other: string[] = [];
    const events: IncomingEvent[] = [];
    const screenSaver = {
        onButtonEvent: async (event: IncomingEvent): Promise<void> => {
            events.push(event);
            return Promise.resolve();
        },
        onPopupRequest: record('onPopupRequest', other),
        onTimerTap: record('onTimerTap', other),
        onScreensaverTap: record('onScreensaverTap', other),
    };
    const main = {
        onButtonEvent: record('onButtonEvent', page),
        onPopupRequest: record('onPopupRequest', page),
        onButtonPress3: record('onButtonPress3', page),
    };
    const noop = (): void => undefined;
    const panel = Object.create(Panel.prototype);
    Object.assign(panel, {
        log: { debug: noop, info: noop, warn: noop, error: noop },
        adapter: { config: {} },
        library: { writedp: record('writedp', other) },
        screenSaver,
        _isOnline: true,
        // blockTouchEventsForMs is active
        lastSendTypeDate: Date.now(),
        blockTouchEventsForMs: 60_000,
        blockScreensaverTouchEventsForMs: 60_000,
        _activePage: active === 'screensaver' ? screenSaver : main,
    });
    return { panel, saver: { events, other }, page };
}

describe('lib/controller/panel - release of an indicator', () => {
    it('the parser takes it like every event', () => {
        const { panel } = setup('screensaver');
        const event = panel.convertToEvent('{"CustomRecv":"event,buttonPress2,0?12,release"}');
        expect(event).to.deep.equal({
            type: 'event',
            method: 'buttonPress2',
            page: 0,
            popup: undefined,
            id: '12',
            action: 'release',
            opt: '',
        });
    });

    it('reaches the screensaver only, also in the touch block', async () => {
        const { panel, saver, page } = setup('screensaver');
        const event = panel.convertToEvent('{"CustomRecv":"event,buttonPress2,0?12,release"}');
        await panel.HandleIncomingMessage(event);
        expect(saver.events).to.deep.equal([event]);
        expect(saver.other).to.deep.equal([]);
        expect(page).to.deep.equal([]);
    });

    it('does not reach the page the press has opened', async () => {
        const { panel, saver, page } = setup('main');
        await panel.HandleIncomingMessage(panel.convertToEvent('{"CustomRecv":"event,buttonPress2,0?12,release"}'));
        expect(saver.events.length).to.equal(1);
        expect(page).to.deep.equal([]);
    });
});
