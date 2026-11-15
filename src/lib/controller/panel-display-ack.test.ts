/**
 * TFT 6.1.0+: the display answers every processed message with `event,ack,<crc>` and a page change with
 * `event,renderCurrentPage,<crc>`. Older TFTs send renderCurrentPage without a field, the web panel sends the page
 * type there. Panel.HandleIncomingMessage with a bare Panel prototype and a fake PanelSend.
 */
import { expect } from 'chai';
import { Panel } from './panel';
import type * as Types from '../types/types';

function setup(): { panel: Panel; calls: string[] } {
    const calls: string[] = [];
    const noop = (): void => undefined;
    const panelSend: any = {
        onDisplayAck: (kind: string, crc: number): void => void calls.push(`display:${kind}:${crc}`),
        onMessage: async (_topic: string, message: string): Promise<void> => {
            calls.push(`old:${message}`);
            return Promise.resolve();
        },
    };
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'A0',
        _isOnline: true,
        screenSaver: {},
        panelSend,
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        adapter: { config: { debugLogMqtt: false } },
    });
    return { panel, calls };
}

/**
 * Parses a message from the display as the panel does.
 *
 * @param panel the panel
 * @param recv the CustomRecv text
 * @returns the event
 */
function event(panel: Panel, recv: string): Types.IncomingEvent {
    const result = (panel as any).convertToEvent(JSON.stringify({ CustomRecv: recv })) as Types.IncomingEvent | null;
    expect(result).to.not.equal(null);
    return result!;
}

describe('lib/controller/panel - display ack (TFT 6.1.0+)', () => {
    it('parses only a number up to 0xFFFF as crc', () => {
        expect(Panel.parseDisplayAckCrc('18591')).to.equal(18_591);
        expect(Panel.parseDisplayAckCrc('0')).to.equal(0);
        expect(Panel.parseDisplayAckCrc('65535')).to.equal(65_535);
        expect(Panel.parseDisplayAckCrc('65536')).to.equal(null);
        expect(Panel.parseDisplayAckCrc('cardGrid')).to.equal(null);
        expect(Panel.parseDisplayAckCrc('undefined')).to.equal(null);
        expect(Panel.parseDisplayAckCrc('')).to.equal(null);
        expect(Panel.parseDisplayAckCrc(undefined)).to.equal(null);
    });

    it('renderCurrentPage with a crc goes to the display ack of PanelSend', async () => {
        const { panel, calls } = setup();
        await panel.HandleIncomingMessage(event(panel, 'event,renderCurrentPage,4653'));
        expect(calls).to.deep.equal(['display:renderCurrentPage:4653']);
    });

    it('ack with a crc goes to the display ack of PanelSend', async () => {
        const { panel, calls } = setup();
        await panel.HandleIncomingMessage(event(panel, 'event,ack,38524'));
        expect(calls).to.deep.equal(['display:ack:38524']);
    });

    it('renderCurrentPage of an older TFT and of the web panel takes the old way', async () => {
        const { panel, calls } = setup();
        await panel.HandleIncomingMessage(event(panel, 'event,renderCurrentPage'));
        await panel.HandleIncomingMessage(event(panel, 'event,renderCurrentPage,cardGrid'));
        expect(calls).to.deep.equal([
            'old:{ "CustomSend": "renderCurrentPage" }',
            'old:{ "CustomSend": "renderCurrentPage" }',
        ]);
    });
});
