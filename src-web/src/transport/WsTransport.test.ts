import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_CHECK_PATH, forgetLegacySession, websocketUrl, WsTransport } from './WsTransport';

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

interface Harness {
    transport: WsTransport;
    status: string[];
    events: string[];
    /** urls of the auth checks */
    checks: string[];
    /** `location.reload()` calls */
    reloads: string[];
}

type AuthAnswer = number | 'error';

function make(auth: AuthAnswer = 204): Harness {
    const checks: string[] = [];
    const reloads: string[] = [];
    const transport = new WsTransport('nspanel1', {
        location,
        fetch: (url: string): Promise<{ status: number }> => {
            checks.push(url);
            return auth === 'error' ? Promise.reject(new Error('offline')) : Promise.resolve({ status: auth });
        },
        reload: (): void => {
            reloads.push('reload');
        },
    });
    const h: Harness = { transport, status: [], events: [], checks, reloads };
    transport.onStatus(s => h.status.push(s));
    transport.onHello(hello => h.events.push(`hello:${hello.model}:${hello.tftVersion}:${hello.kind}`));
    transport.onCommand((p, seq) => h.events.push(`cmd:${p}:${seq ?? '-'}`));
    transport.onBuzzer(p => h.events.push(`buzzer:${p}`));
    transport.onBye(r => h.events.push(`bye:${r}`));
    return h;
}

/** lets the pending auth check promise settle */
async function settle(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
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

    it('builds the url next to the page without a session', () => {
        expect(websocketUrl('nspanel1', location)).toBe('ws://panel.local:8090/ws/nspanel1');
        expect(websocketUrl('a/b', { protocol: 'https:', host: 'x' })).toBe('wss://x/ws/a%2Fb');
    });

    it('forgets the session id of older frontends', () => {
        const removed: string[] = [];
        vi.stubGlobal('localStorage', {
            removeItem: (key: string): void => {
                removed.push(key);
            },
        });
        forgetLegacySession();
        expect(removed).toEqual(['nspanel-web-session']);
        make();
        expect(removed).toEqual(['nspanel-web-session', 'nspanel-web-session']);
        // blocked storage is no error
        vi.stubGlobal('localStorage', {
            removeItem: (): void => {
                throw new Error('blocked');
            },
        });
        expect(() => forgetLegacySession()).not.toThrow();
    });

    it('delivers frames with their seq and sends ack/recv as json', () => {
        const { transport, status, events } = make();
        transport.connect();
        const ws = FakeWebSocket.instances[0];
        ws.open();
        ws.message({
            t: 'hello',
            model: 'eu',
            topic: 't',
            name: 'n',
            friendlyName: 'f',
            tftVersion: '1.0.0',
            kind: 'clone',
        });
        // a hello without kind is not part of the contract
        ws.message({ t: 'hello', model: 'eu', topic: 't', name: 'n', friendlyName: 'f', tftVersion: '1.0.0' });
        ws.message({ t: 'cmd', p: 'pageType~cardGrid', seq: 17 });
        ws.message({ t: 'cmd', p: 'time~12:00' });
        ws.message({ t: 'cmd', p: 'date~x', seq: 'nope' });
        ws.message({ t: 'buzzer', p: '1,1,1' });
        ws.message({ t: 'nonsense' });
        ws.onmessage?.({ data: 'not json' });
        transport.ack(17);
        transport.ack(undefined);
        transport.recv('event,startup,55,eu,1.0.0');
        expect(status).toEqual(['connecting', 'open']);
        expect(events).toEqual([
            'hello:eu:1.0.0:clone',
            'cmd:pageType~cardGrid:17',
            'cmd:time~12:00:-',
            'buzzer:1,1,1',
        ]);
        expect(ws.sent).toEqual([
            '{"t":"ack","seq":17}',
            '{"t":"ack"}',
            '{"t":"recv","p":"event,startup,55,eu,1.0.0"}',
        ]);
    });

    it('checks the pin before every reconnect and reopens with backoff', async () => {
        const h = make(204);
        h.transport.connect();
        const first = FakeWebSocket.instances[0];
        first.open();
        first.close();
        expect(h.status).toEqual(['connecting', 'open', 'closed']);
        expect(FakeWebSocket.instances.length).toBe(1);
        vi.advanceTimersByTime(999);
        expect(h.checks).toEqual([]);
        vi.advanceTimersByTime(1);
        expect(h.checks).toEqual([AUTH_CHECK_PATH]);
        // the socket opens only after the check answered
        expect(FakeWebSocket.instances.length).toBe(1);
        await settle();
        expect(FakeWebSocket.instances.length).toBe(2);
        expect(FakeWebSocket.instances[1].url).toBe(first.url);
        // backoff doubles while the server stays away
        FakeWebSocket.instances[1].close();
        vi.advanceTimersByTime(1999);
        expect(h.checks.length).toBe(1);
        vi.advanceTimersByTime(1);
        await settle();
        expect(h.checks.length).toBe(2);
        expect(FakeWebSocket.instances.length).toBe(3);
        expect(h.reloads).toEqual([]);
        h.transport.disconnect();
    });

    it('reloads the page instead of reconnecting when the pin check answers 401', async () => {
        const h = make(401);
        h.transport.connect();
        FakeWebSocket.instances[0].open();
        FakeWebSocket.instances[0].close();
        vi.advanceTimersByTime(1000);
        await settle();
        expect(h.checks).toEqual([AUTH_CHECK_PATH]);
        expect(h.reloads).toEqual(['reload']);
        expect(FakeWebSocket.instances.length).toBe(1);
        vi.advanceTimersByTime(120_000);
        expect(FakeWebSocket.instances.length).toBe(1);
    });

    it('keeps the backoff going when the pin check fails with a network error', async () => {
        const h = make('error');
        h.transport.connect();
        FakeWebSocket.instances[0].open();
        FakeWebSocket.instances[0].close();
        vi.advanceTimersByTime(1000);
        await settle();
        expect(h.checks.length).toBe(1);
        expect(h.reloads).toEqual([]);
        expect(FakeWebSocket.instances.length).toBe(2);
        h.transport.disconnect();
    });

    it('does not reopen when disconnected during the pin check', async () => {
        const h = make(204);
        h.transport.connect();
        FakeWebSocket.instances[0].open();
        FakeWebSocket.instances[0].close();
        vi.advanceTimersByTime(1000);
        h.transport.disconnect();
        await settle();
        expect(FakeWebSocket.instances.length).toBe(1);
    });

    it('ends the connection on bye and never reconnects', () => {
        const { transport, status, events } = make();
        transport.connect();
        const ws = FakeWebSocket.instances[0];
        ws.open();
        ws.message({ t: 'bye', reason: 'panel removed' });
        expect(events).toEqual(['bye:panel removed']);
        expect(ws.readyState).toBe(FakeWebSocket.CLOSED);
        expect(transport.endedBy).toBe('panel removed');
        expect(status).toEqual(['connecting', 'open', 'closed']);
        vi.advanceTimersByTime(120_000);
        expect(FakeWebSocket.instances.length).toBe(1);
    });
});
