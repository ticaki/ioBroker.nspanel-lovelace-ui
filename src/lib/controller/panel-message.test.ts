import { expect } from 'chai';
import sinon from 'sinon';
import { PanelSend } from './panel-message';
import { crcPrefix, panelFrameCrc } from '../tools/crc16';

const TOPIC = 'tasmota/test';

/**
 * PanelSend with fake adapter/mqtt client - every payload handed to mqtt ends up in `published`.
 *
 * @param panel additional properties of the fake panel
 * @returns the PanelSend, the published payloads and the logged warnings
 */
function setup(panel: Record<string, unknown> = {}): { send: PanelSend; published: string[]; warnings: string[] } {
    const noop = (): void => undefined;
    const published: string[] = [];
    const warnings: string[] = [];
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: (m: string) => warnings.push(m), error: noop },
        config: { debugLogMqtt: false, additionalLog: false },
        unload: false,
        setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
        clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
    };
    const channel: any = {
        subscribe: async (): Promise<void> => undefined,
        unsubscribe: noop,
        publish: async (_topic: string, payload: string): Promise<void> => {
            published.push(payload);
        },
    };
    const send = new PanelSend(adapter, {
        name: 'test',
        channel,
        topic: TOPIC,
        panel: { isOnline: true, ...panel } as any,
    });
    return { send, published, warnings };
}

describe('lib/controller/panel-message - PanelSend ack handling', () => {
    let clock: sinon.SinonFakeTimers;
    let send: PanelSend;
    let published: string[];

    const done = (): Promise<void | boolean> => send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
    const render = (): Promise<void | boolean> =>
        send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"renderCurrentPage"}');

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        ({ send, published } = setup());
    });
    afterEach(async () => {
        await send.delete();
        clock.restore();
    });

    it('sends the queue in order, one message per ack', async () => {
        send.addMessage('a', false);
        send.addMessage('b', false);
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a']);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a', 'b']);
    });

    it('a duplicate Done does not drop the next message', async () => {
        // weatherUpdate, color, statusUpdate - the forum log lost every color~ this way
        send.addMessage('weatherUpdate', false);
        send.addMessage('color', false);
        send.addMessage('statusUpdate', false);
        await clock.tickAsync(20);
        await done();
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['weatherUpdate', 'color']);
        await done();
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['weatherUpdate', 'color', 'statusUpdate']);
    });

    it('ignores a Done while nothing has been sent', async () => {
        await done();
        send.addMessage('a', false);
        send.addMessage('b', false);
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a']);
    });

    it('a resent pageType keeps its content although the same content is still queued', async () => {
        // multiple taps on the screensaver: main is sent, then sent again while the first one is still queued
        send.addMessage('pageType~cardGrid2', true);
        send.addMessage('entityUpd~main', false);
        send.addMessage('pageType~cardGrid2', true);
        send.addMessage('entityUpd~main', false);
        send.addMessage('entityUpd~main', false);
        await clock.tickAsync(20);
        for (let i = 0; i < 2; i++) {
            await done();
            await render();
            await clock.tickAsync(300);
            await done();
            await clock.tickAsync(300);
        }
        expect(published).to.deep.equal([
            'pageType~cardGrid2',
            'entityUpd~main',
            'pageType~cardGrid2',
            'entityUpd~main',
        ]);
    });

    it('pageType waits for renderCurrentPage, its Done does not ack the next message', async () => {
        send.addMessage('pageType~screensaver', true);
        send.addMessage('time', false);
        send.addMessage('weatherUpdate', false);
        await clock.tickAsync(20);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~screensaver']);
        await render();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~screensaver', 'time']);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~screensaver', 'time', 'weatherUpdate']);
    });

    it('a Done of pageType arriving after renderCurrentPage is not taken as ack of the next message', async () => {
        send.addMessage('pageType~screensaver', true);
        send.addMessage('time', false);
        send.addMessage('weatherUpdate', false);
        await clock.tickAsync(20);
        await render();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~screensaver', 'time']);
        // late Done of the pageType
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~screensaver', 'time']);
        // Done of time
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~screensaver', 'time', 'weatherUpdate']);
    });

    it('the second Done of a resent message does not ack the next message', async () => {
        send.addMessage('a', false);
        send.addMessage('b', false);
        send.addMessage('c', false);
        await clock.tickAsync(20);
        // no ack - resent after the losing delay
        await clock.tickAsync(3100);
        expect(published).to.deep.equal(['a', 'a']);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a', 'a', 'b']);
        // Done of the second transmission of a
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a', 'a', 'b']);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a', 'a', 'b', 'c']);
    });

    it('a lost Done of a resent message only delays acks for a short time', async () => {
        send.addMessage('a', false);
        send.addMessage('b', false);
        send.addMessage('c', false);
        await clock.tickAsync(20);
        await clock.tickAsync(3100);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a', 'a', 'b']);
        // the other Done of a never arrives - after the window the Done of b counts
        await clock.tickAsync(1000);
        await done();
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a', 'a', 'b', 'c']);
    });
});

describe('lib/controller/panel-message - PanelSend newest state only', () => {
    let clock: sinon.SinonFakeTimers;
    let send: PanelSend;
    let published: string[];

    const done = async (): Promise<void> => {
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
        await clock.tickAsync(250);
    };
    const add = (payload: string): void => send.addMessage(payload, false);

    beforeEach(async () => {
        clock = sinon.useFakeTimers();
        ({ send, published } = setup());
        // the first message is on its way and keeps the queue waiting
        add('first');
        await clock.tickAsync(0);
    });
    afterEach(async () => {
        await send.delete();
        clock.restore();
    });

    it('a new entityUpd takes the place of an unsent one, nothing moves', async () => {
        add('entityUpd~a');
        add('other');
        add('entityUpd~b');
        await done();
        await done();
        await done();
        expect(published).to.deep.equal(['first', 'entityUpd~b', 'other']);
    });

    it('a message on its way is not touched, retry and ack stay with it', async () => {
        add('entityUpd~a');
        await done();
        expect(published.at(-1)).to.equal('entityUpd~a');
        add('entityUpd~b');
        // retry of the one on its way
        await clock.tickAsync(3000);
        expect(published.filter(p => p === 'entityUpd~a')).to.have.length(2);
        expect(published).to.not.include('entityUpd~b');
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
        await clock.tickAsync(250);
        expect(published.at(-1)).to.equal('entityUpd~b');
    });

    it('entityUpdateDetail per item id', async () => {
        add('entityUpdateDetail~1~a');
        add('entityUpdateDetail~2~a');
        add('entityUpdateDetail~1~b');
        await done();
        await done();
        await done();
        expect(published).to.deep.equal(['first', 'entityUpdateDetail~1~b', 'entityUpdateDetail~2~a']);
    });

    it('a pageType ends the page: older updates stay, pageType itself is never replaced', async () => {
        add('entityUpd~old');
        add('pageType~x');
        add('entityUpd~new');
        add('pageType~y');
        for (let i = 0; i < 4; i++) {
            await done();
        }
        expect(published).to.deep.equal(['first', 'entityUpd~old', 'pageType~x', 'entityUpd~new', 'pageType~y']);
    });

    it('other messages are never replaced and an entityUpd does not take an entityUpdateDetail', async () => {
        add('time~1');
        add('time~2');
        add('entityUpdateDetail~1~a');
        add('entityUpd~a');
        for (let i = 0; i < 4; i++) {
            await done();
        }
        expect(published).to.deep.equal(['first', 'time~1', 'time~2', 'entityUpdateDetail~1~a', 'entityUpd~a']);
    });

    it('a message with an ack for its type is not replaced by one without', async () => {
        send.addMessage('entityUpd~a', true);
        add('entityUpd~b');
        await done();
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"renderCurrentPage"}');
        await clock.tickAsync(250);
        expect(published).to.deep.equal(['first', 'entityUpd~a', 'entityUpd~b']);
    });
});

describe('lib/controller/panel-message - PanelSend message size', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.restore();
    });

    it('warns once for a message longer than 1017 bytes and sends it anyway', async () => {
        const { send, published, warnings } = setup();
        // 339 icons of 3 bytes each = 1017 bytes - fits
        send.addMessage('\ue000'.repeat(339), false);
        expect(warnings).to.have.length(0);
        const long = `entityUpd~${'\ue000'.repeat(339)}`;
        send.addMessage(long, false);
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.contain('1027 bytes').and.contain('1017');
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
        await clock.tickAsync(300);
        expect(published).to.include(long);
        expect(warnings).to.have.length(1);
        await send.delete();
    });

    it('does not warn for a virtual panel', async () => {
        const { send, warnings } = setup({ isVirtual: true });
        send.addMessage('x'.repeat(2000), false);
        expect(warnings).to.have.length(0);
        await send.delete();
    });
});

describe('lib/controller/panel-message - PanelSend display ack mode', () => {
    let clock: sinon.SinonFakeTimers;
    let send: PanelSend;
    let published: string[];

    const done = (): Promise<void | boolean> => send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
    const ack = (payload: string): void => send.onDisplayAck('ack', panelFrameCrc(payload));
    const render = (payload: string): void => send.onDisplayAck('renderCurrentPage', panelFrameCrc(payload));

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        ({ send, published } = setup());
    });
    afterEach(async () => {
        await send.delete();
        clock.restore();
    });

    it('renderCurrentPage with the crc of the pageType switches the mode on and acks it, the next goes at once', async () => {
        send.addMessage('pageType~screensaver5', true);
        send.addMessage('color~1', false);
        await clock.tickAsync(20);
        expect(send.displayAck).to.equal(false);
        render('pageType~screensaver5');
        expect(send.displayAck).to.equal(true);
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['pageType~screensaver5', 'color~1']);
    });

    it('an ack with the crc of the head acks it, an ack with another crc is ignored', async () => {
        send.displayAck = true;
        send.addMessage('a', false);
        send.addMessage('b', false);
        send.addMessage('c', false);
        await clock.tickAsync(20);
        ack('b');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a']);
        ack('a');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a', 'b']);
        ack('b');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a', 'b', 'c']);
    });

    it('a pageType is only acked by renderCurrentPage with its crc', async () => {
        send.displayAck = true;
        send.addMessage('pageType~cardGrid', true);
        send.addMessage('entityUpd~x', false);
        await clock.tickAsync(20);
        // Done, an ack with its crc, a page change without pageType (crc 0), another crc
        await done();
        ack('pageType~cardGrid');
        send.onDisplayAck('renderCurrentPage', 0);
        render('pageType~cardEntities');
        await clock.tickAsync(1000);
        expect(published).to.deep.equal(['pageType~cardGrid']);
        render('pageType~cardGrid');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['pageType~cardGrid', 'entityUpd~x']);
    });

    it('a late ack of a resent message does not ack the next one', async () => {
        send.displayAck = true;
        send.addMessage('a', false);
        send.addMessage('b', false);
        send.addMessage('c', false);
        await clock.tickAsync(20);
        // no answer at all - resent after the losing delay
        await clock.tickAsync(3100);
        expect(published).to.deep.equal(['a', 'a']);
        ack('a');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a', 'a', 'b']);
        // the ack and both Done of the transmissions of a
        ack('a');
        await done();
        await done();
        await clock.tickAsync(1000);
        expect(published).to.deep.equal(['a', 'a', 'b']);
        ack('b');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a', 'a', 'b', 'c']);
    });

    it('Done without a display ack counts after 500 ms (pages without serial timer)', async () => {
        send.displayAck = true;
        send.addMessage('a', false);
        send.addMessage('b', false);
        await clock.tickAsync(20);
        await done();
        await clock.tickAsync(490);
        expect(published).to.deep.equal(['a']);
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a', 'b']);
    });

    it('a display ack after the Done ends the wait at once and the fallback does not ack the next one', async () => {
        send.displayAck = true;
        send.addMessage('a', false);
        send.addMessage('b', false);
        send.addMessage('c', false);
        await clock.tickAsync(20);
        await done();
        await clock.tickAsync(100);
        ack('a');
        await clock.tickAsync(20);
        expect(published).to.deep.equal(['a', 'b']);
        // b got neither Done nor ack - the timer of a must not ack it
        await clock.tickAsync(600);
        expect(published).to.deep.equal(['a', 'b']);
    });

    it('nothing at all: the losing logic sends the message again', async () => {
        send.displayAck = true;
        send.addMessage('a', false);
        await clock.tickAsync(20);
        await clock.tickAsync(3100);
        expect(published).to.deep.equal(['a', 'a']);
    });

    it('acks are ignored while the mode is off, the old mode stays as it is', async () => {
        send.addMessage('a', false);
        send.addMessage('b', false);
        await clock.tickAsync(20);
        ack('a');
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['a']);
        await done();
        await clock.tickAsync(200);
        // the old pause after Done
        expect(published).to.deep.equal(['a']);
        await clock.tickAsync(100);
        expect(published).to.deep.equal(['a', 'b']);
    });

    it('switching the mode off (display restart) goes back to the old mode', async () => {
        send.displayAck = true;
        send.displayAck = false;
        send.addMessage('pageType~cardGrid', true);
        send.addMessage('b', false);
        await clock.tickAsync(20);
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"renderCurrentPage"}');
        await clock.tickAsync(300);
        expect(published).to.deep.equal(['pageType~cardGrid', 'b']);
    });
});

describe('lib/controller/panel-message - PanelSend crc prefix for the Berry driver', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
    });
    afterEach(() => {
        clock.restore();
    });

    const panelWith = (berryDriverVersion: number, isVirtual = false): Record<string, unknown> => ({
        isVirtual,
        info: { nspanel: { berryDriverVersion } },
    });

    it('driver 12 or newer gets ^XXXX^ in front of the payload', async () => {
        const { send, published } = setup(panelWith(12));
        send.addMessage('time~12:00', false);
        await clock.tickAsync(20);
        expect(published).to.deep.equal([`${crcPrefix(panelFrameCrc('time~12:00'))}time~12:00`]);
        expect(published[0]).to.match(/^\^[0-9A-F]{4}\^time~12:00$/);
        await send.delete();
    });

    it('driver 11, an unknown driver and a web panel get the payload as it is', async () => {
        for (const panel of [panelWith(11), panelWith(-1), panelWith(0), panelWith(12, true)]) {
            const { send, published } = setup(panel);
            send.addMessage('time~12:00', false);
            await clock.tickAsync(20);
            expect(published).to.deep.equal(['time~12:00']);
            await send.delete();
        }
    });

    it('dedupe and replace still work on the payload', async () => {
        const { send, published } = setup(panelWith(12));
        send.addMessage('a', false);
        send.addMessage('entityUpd~1', false);
        send.addMessage('entityUpd~2', false);
        send.addMessage('entityUpd~2', false);
        await clock.tickAsync(20);
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
        await clock.tickAsync(300);
        await send.onMessage(`${TOPIC}/stat/RESULT`, '{"CustomSend":"Done"}');
        await clock.tickAsync(300);
        expect(published).to.deep.equal([
            `${crcPrefix(panelFrameCrc('a'))}a`,
            `${crcPrefix(panelFrameCrc('entityUpd~2'))}entityUpd~2`,
        ]);
        await send.delete();
    });
});
