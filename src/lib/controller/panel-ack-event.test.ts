/**
 * TFT 6.1.0 acknowledges every message with `event,ack,<crc>`. The adapter must accept it without
 * error or warning logs.
 */
import { expect } from 'chai';
import { Panel } from './panel';

function setup(): { panel: Panel; logs: string[] } {
    const logs: string[] = [];
    const noop = (): void => undefined;
    const panel = Object.create(Panel.prototype) as Panel;
    Object.assign(panel, {
        name: 'test',
        initDone: true,
        _isOnline: true,
        screenSaver: {},
        panelSend: { onDisplayAck: noop },
        log: {
            silly: noop,
            debug: noop,
            info: noop,
            warn: (m: string): void => {
                logs.push(`warn: ${m}`);
            },
            error: (m: string): void => {
                logs.push(`error: ${m}`);
            },
        },
        adapter: { config: { debugLogMqtt: false } },
    });
    return { panel, logs };
}

describe('lib/controller/panel - ack event of TFT 6.1.0', () => {
    it('converts event,ack,<crc> to an event without logging an error', () => {
        const f = setup();
        const event = f.panel['convertToEvent']('{"CustomRecv":"event,ack,12345"}');
        expect(event).to.not.equal(null);
        expect(event?.method).to.equal('ack');
        expect(f.logs).to.deep.equal([]);
    });

    it('handles the ack event without a warning', async () => {
        const f = setup();
        const event = f.panel['convertToEvent']('{"CustomRecv":"event,ack,12345"}');
        expect(event).to.not.equal(null);
        if (event) {
            await f.panel.HandleIncomingMessage(event);
        }
        expect(f.logs).to.deep.equal([]);
    });
});
