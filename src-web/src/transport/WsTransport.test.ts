import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { websocketUrl, WsTransport } from './WsTransport';

/** minimal WebSocket stand-in: the test opens, closes and feeds messages by hand */
class FakeWebSocket {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;
    static instances: FakeWebSocket[] = [];
    readyState = FakeWebSocket.CONNECTING;
    readonly sent: string[] = [];
    onopen: (() => void) | null = null;
    onmessage: ((ev: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(readonly url: string) {
        FakeWebSocket.instances.push(this);
    }
    open(): void {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }
    message(frame: object): void {
        this.onmessage?.({ data: JSON.stringify(frame) });
    }
    send(data: string): void {
        this.sent.push(data);
    }
    close(): void {
        if (this.readyState === FakeWebSocket.CLOSED) {
            return;
        }
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.();
    }
}

const location = { protocol: 'http:', host: 'panel.local:8090' };

function make(): { transport: WsTransport; status: string[]; events: string[] } {
    const transport = new WsTransport('nspanel1', 'sess-1', location);
    const status: string[] = [];
    const events: string[] = [];
    transport.onStatus(s => status.push(s));
    transport.onHello(h => events.push(`hello:${h.model}:${h.tftVersion}`));
    transport.onCommand(p => events.push(`cmd:${p}`));
    transport.onBuzzer(p => events.push(`buzzer:${p}`));
    transport.onBye(r => events.push(`bye:${r}`));
    return { transport, status, events };
}

describe('WsTransport', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeWebSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeWebSocket);
    });
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('builds the url next to the page', () => {
        expect(websocketUrl('nspanel1', 'sess-1', location)).toBe('ws://panel.local:8090/ws/nspanel1?session=sess-1');
        expect(websocketUrl('a/b', 's', { protocol: 'https:', host: 'x' })).toBe('wss://x/ws/a%2Fb?session=s');
    });

    it('delivers frames and sends ack/recv as json', () => {
        const { transport, status, events } = make();
        transport.connect();
        const ws = FakeWebSocket.instances[0];
        ws.open();
        ws.message({
            t: 'hello',
            session: 's',
            model: 'eu',
            topic: 't',
            name: 'n',
            friendlyName: 'f',
            tftVersion: '1.0.0',
        });
        ws.message({ t: 'cmd', p: 'pageType~cardGrid' });
        ws.message({ t: 'buzzer', p: '1,1,1' });
        ws.message({ t: 'nonsense' });
        ws.onmessage?.({ data: 'not json' });
        transport.ack();
        transport.recv('event,startup,55,eu,1.0.0');
        expect(status).toEqual(['connecting', 'open']);
        expect(events).toEqual(['hello:eu:1.0.0', 'cmd:pageType~cardGrid', 'buzzer:1,1,1']);
        expect(ws.sent).toEqual(['{"t":"ack"}', '{"t":"recv","p":"event,startup,55,eu,1.0.0"}']);
    });

    it('reconnects with the same session after a drop without bye', () => {
        const { transport, status } = make();
        transport.connect();
        const first = FakeWebSocket.instances[0];
        first.open();
        first.close();
        expect(status).toEqual(['connecting', 'open', 'closed']);
        expect(FakeWebSocket.instances.length).toBe(1);
        vi.advanceTimersByTime(1000);
        expect(FakeWebSocket.instances.length).toBe(2);
        expect(FakeWebSocket.instances[1].url).toBe(first.url);
        // backoff doubles while the server stays away
        FakeWebSocket.instances[1].close();
        vi.advanceTimersByTime(1999);
        expect(FakeWebSocket.instances.length).toBe(2);
        vi.advanceTimersByTime(1);
        expect(FakeWebSocket.instances.length).toBe(3);
        transport.disconnect();
    });

    it('ends the session on bye and never reconnects', () => {
        const { transport, status, events } = make();
        transport.connect();
        const ws = FakeWebSocket.instances[0];
        ws.open();
        ws.message({ t: 'bye', reason: 'replaced' });
        expect(events).toEqual(['bye:replaced']);
        expect(ws.readyState).toBe(FakeWebSocket.CLOSED);
        expect(transport.endedBy).toBe('replaced');
        expect(status).toEqual(['connecting', 'open', 'closed']);
        vi.advanceTimersByTime(120_000);
        expect(FakeWebSocket.instances.length).toBe(1);
    });
});
