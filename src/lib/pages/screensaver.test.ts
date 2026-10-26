import { expect } from 'chai';
import { Screensaver } from './screensaver';
import type * as Types from '../types/types';

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
