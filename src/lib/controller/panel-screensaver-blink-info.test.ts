/**
 * The blinking clock (`cmd.screenSaver.clockBlink` -> internal `cmd/screensaverClockBlink`) and the info icon next to
 * the clock (`event,buttonPress2,bInfo,button,<taps>`, `cmd.screenSaver.infoText`) on a bare Panel prototype.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';
import { screensaverInfoFont } from '../const/screensaver-info-font';

const noop = (): void => undefined;

type Fixture = {
    panel: Panel;
    saver: Record<string, unknown>;
    calls: string[];
    writes: string[];
    internal: string[];
};

function setup(): Fixture {
    const calls: string[] = [];
    const writes: string[] = [];
    const internal: string[] = [];
    const saver: Record<string, unknown> = {
        clockBlink: false,
        infoText: '',
        setInfoTextFont: (value: unknown): number => screensaverInfoFont(value),
        onInfoIconTap: async (event: Types.IncomingEvent): Promise<void> => {
            calls.push(`info:${event.id}:${event.action}:${event.opt}`);
            return Promise.resolve();
        },
        isIndicatorEvent: (): boolean => {
            calls.push('indicator?');
            return false;
        },
        onTimerTap: async (): Promise<boolean> => {
            calls.push('timer');
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
        screenSaver: saver,
        _activePage: saver,
        lastSendTypeDate: 0,
        blockTouchEventsForMs: 200,
        pages: [],
        controller: { panels: [] },
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { config: { debugLogMqtt: false } },
        library: {
            writedp: async (id: string, val: unknown): Promise<void> => {
                writes.push(`${id}=${String(val)}`);
                return Promise.resolve();
            },
        },
        statesControler: {
            setInternalState: async (id: string, val: unknown): Promise<void> => {
                internal.push(`${id}=${String(val)}`);
                return Promise.resolve();
            },
        },
    });
    return { panel, saver, calls, writes, internal };
}

const state = (val: Types.nsPanelStateVal, ack = false): Types.nsPanelState => ({
    val,
    ack,
    ts: 0,
    lc: 0,
    from: '',
    q: 0,
});

describe('lib/controller/panel - blinking clock of the screensaver', () => {
    it('cmd.screenSaver.clockBlink goes to the internal state cmd/screensaverClockBlink', async () => {
        const f = setup();
        await f.panel.onStateChange('panels.A0.cmd.screenSaver.clockBlink', state(true));
        await f.panel.onStateChange('panels.A0.cmd.screenSaver.clockBlink', state(false));
        expect(f.internal).to.deep.equal(['A0/cmd/screensaverClockBlink=true', 'A0/cmd/screensaverClockBlink=false']);
    });
});

describe('lib/controller/panel - info icon of the screensaver', () => {
    it('Panel.convertToEvent: bInfo is neither an indicator (no page) nor bExit', () => {
        const f = setup();
        const event = f.panel['convertToEvent']('{"CustomRecv":"event,buttonPress2,bInfo,button,3"}');
        expect(event).to.deep.include({ method: 'buttonPress2', id: 'bInfo', action: 'button', opt: '3' });
        expect(event?.page).to.equal(undefined);
    });

    it('a tap on the icon goes to Screensaver.onInfoIconTap and nowhere else', async () => {
        const f = setup();
        await f.panel.HandleIncomingMessage({
            type: 'event',
            method: 'buttonPress2',
            id: 'bInfo',
            action: 'button',
            opt: '1',
        });
        expect(f.calls).to.deep.equal(['info:bInfo:button:1']);
    });

    it('cmd.screenSaver.infoText sets the text of the popup and acks the state', async () => {
        const f = setup();
        await f.panel.onStateChange('panels.A0.cmd.screenSaver.infoText', state('Tür offen'));
        expect(f.saver.infoText).to.equal('Tür offen');
        expect(f.writes).to.deep.equal(['panels.A0.cmd.screenSaver.infoText=Tür offen']);
    });

    it('cmd.screenSaver.infoTextFont: 0..5 as given, empty or invalid acked as the default font 2', async () => {
        const f = setup();
        for (const val of [0, 5, 3, null, '', 'abc', 6, 8, -1, 2.5, '4']) {
            await f.panel.onStateChange('panels.A0.cmd.screenSaver.infoTextFont', state(val));
        }
        expect(f.writes.map(w => w.split('=')[1])).to.deep.equal([
            '0',
            '5',
            '3',
            '2',
            '2',
            '2',
            '2',
            '2',
            '2',
            '2',
            '4',
        ]);
    });
});
