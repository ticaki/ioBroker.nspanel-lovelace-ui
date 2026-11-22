/**
 * A `buttonPress3` the item does not handle: on the grid pages it acts like the short press (the finger may just have
 * lain too long), on cardEntities nothing happens - there the left part of an item is tapped on purpose
 * (doc/ideas/device-details/README.md). Panel.HandleIncomingMessage with a bare Panel prototype and a fake page.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

function setup(card: string, handled: boolean): { panel: Panel; calls: string[] } {
    const calls: string[] = [];
    const noop = (): void => undefined;
    const page: any = {
        card,
        onButtonPress3: async (): Promise<boolean> => {
            calls.push('press3');
            return Promise.resolve(handled);
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
        screenSaver: {},
        _activePage: page,
        lastSendTypeDate: 0,
        blockTouchEventsForMs: 200,
        pages: [],
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { config: { debugLogMqtt: false } },
    });
    return { panel, calls };
}

const event = (method: 'buttonPress2' | 'buttonPress3'): Types.IncomingEvent => ({
    type: 'event',
    method,
    page: 3,
    id: '1',
    action: 'button',
    opt: '',
});

describe('Panel - unhandled long press', () => {
    for (const card of ['cardGrid', 'cardGrid2', 'cardGrid3']) {
        it(`${card}: falls back to the short press`, async () => {
            const { panel, calls } = setup(card, false);
            await panel.HandleIncomingMessage(event('buttonPress3'));
            expect(calls).to.deep.equal(['press3', 'popup', 'buttonEvent']);
        });
    }
    it('cardEntities: nothing happens', async () => {
        const { panel, calls } = setup('cardEntities', false);
        await panel.HandleIncomingMessage(event('buttonPress3'));
        expect(calls).to.deep.equal(['press3']);
    });
    it('cardEntities: a handled long press runs, the short press stays as it is', async () => {
        const handled = setup('cardEntities', true);
        await handled.panel.HandleIncomingMessage(event('buttonPress3'));
        expect(handled.calls).to.deep.equal(['press3']);
        const short = setup('cardEntities', false);
        await short.panel.HandleIncomingMessage(event('buttonPress2'));
        expect(short.calls).to.deep.equal(['popup', 'buttonEvent']);
    });
    it('longPressFallsBackToShortPress', () => {
        expect(Panel.longPressFallsBackToShortPress('cardGrid')).to.equal(true);
        expect(Panel.longPressFallsBackToShortPress('cardEntities')).to.equal(false);
    });
});
