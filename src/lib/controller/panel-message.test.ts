import { expect } from 'chai';
import sinon from 'sinon';
import { PanelSend } from './panel-message';

const TOPIC = 'tasmota/test';

/**
 * PanelSend with fake adapter/mqtt client - every payload handed to mqtt ends up in `published`.
 *
 * @returns the PanelSend and the published payloads
 */
function setup(): { send: PanelSend; published: string[] } {
    const noop = (): void => undefined;
    const published: string[] = [];
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
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
    const send = new PanelSend(adapter, { name: 'test', channel, topic: TOPIC, panel: { isOnline: true } as any });
    return { send, published };
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
