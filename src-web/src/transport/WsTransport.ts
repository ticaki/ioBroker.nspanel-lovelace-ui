import type { ClientFrame, ConnectionStatus, HelloFrame } from '../protocol/types';
import { isServerFrame } from '../protocol/types';
import type { PanelTransport } from './Transport';

/** localStorage key of the session id older frontends kept - sessions no longer exist */
const LEGACY_SESSION_KEY = 'nspanel-web-session';
/** route the frontend asks before a reconnect: 204 = authorized, 401 = PIN page needed */
export const AUTH_CHECK_PATH = '/auth/check';
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

/** The parts of `window.location` the url builder needs */
export type LocationLike = Pick<Location, 'protocol' | 'host'>;

/** result of the auth check before a reconnect */
export type AuthCheck = 'ok' | 'unauthorized' | 'unreachable';

export interface WsTransportOptions {
    location?: LocationLike;
    /** `GET /auth/check` - replaceable for tests, defaults to the global `fetch` */
    fetch?: (url: string, init: RequestInit) => Promise<{ status: number }>;
    /** reloads the page so the server can show the PIN page, defaults to `location.reload()` */
    reload?: () => void;
}

/** Removes the session id of older frontends, nothing else is stored */
export function forgetLegacySession(): void {
    try {
        localStorage.removeItem(LEGACY_SESSION_KEY);
    } catch {
        // storage blocked - nothing to forget
    }
}

/** `ws(s)://<host>/ws/<topic>` next to the page */
export function websocketUrl(topic: string, location: LocationLike = window.location): string {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws/${encodeURIComponent(topic)}`;
}

/**
 * Websocket connection to the adapter (frames of doc/web-panel/ARCHITECTURE.md 2.6).
 * A dropped connection is reopened (backoff 1 s … 30 s) after `GET /auth/check` passed;
 * a 401 there means the PIN cookie is gone and the page reloads to show the PIN page.
 * A `bye` frame ends the connection for good - except `shutdown`: the adapter restarts
 * (configuration change, update), so the normal reconnect backoff keeps running.
 */
export class WsTransport implements PanelTransport {
    private readonly url: string;
    private readonly fetchFn: WsTransportOptions['fetch'];
    private readonly reload: () => void;
    private socket: WebSocket | undefined;
    private reconnectDelay = RECONNECT_MIN_MS;
    private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    private checkingAuth = false;
    private stopped = true;
    private byeReason: string | undefined;
    private helloCb: ((hello: HelloFrame) => void) | undefined;
    private commandCb: ((payload: string, seq: number | undefined) => void) | undefined;
    private buzzerCb: ((payload: string) => void) | undefined;
    private statusCb: ((status: ConnectionStatus) => void) | undefined;
    private byeCb: ((reason: string) => void) | undefined;

    constructor(topic: string, options: WsTransportOptions = {}) {
        forgetLegacySession();
        this.url = websocketUrl(topic, options.location ?? window.location);
        this.fetchFn = options.fetch ?? (typeof fetch === 'function' ? (url, init) => fetch(url, init) : undefined);
        this.reload = options.reload ?? ((): void => window.location.reload());
    }

    /** reason of the `bye` frame that ended the connection, undefined while it is alive */
    get endedBy(): string | undefined {
        return this.byeReason;
    }

    connect(): void {
        this.stopped = false;
        this.byeReason = undefined;
        this.open();
    }

    disconnect(): void {
        this.stopped = true;
        this.clearReconnectTimer();
        this.socket?.close();
        this.socket = undefined;
    }

    onHello(cb: (hello: HelloFrame) => void): void {
        this.helloCb = cb;
    }
    onCommand(cb: (payload: string, seq: number | undefined) => void): void {
        this.commandCb = cb;
    }
    onBuzzer(cb: (payload: string) => void): void {
        this.buzzerCb = cb;
    }
    onStatus(cb: (status: ConnectionStatus) => void): void {
        this.statusCb = cb;
    }
    onBye(cb: (reason: string) => void): void {
        this.byeCb = cb;
    }

    ack(seq: number | undefined): void {
        this.sendFrame(seq === undefined ? { t: 'ack' } : { t: 'ack', seq });
    }

    recv(payload: string): void {
        this.sendFrame({ t: 'recv', p: payload });
    }

    private sendFrame(frame: ClientFrame): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(frame));
        }
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }

    private open(): void {
        if (this.stopped) {
            return;
        }
        this.statusCb?.('connecting');
        const socket = new WebSocket(this.url);
        this.socket = socket;
        socket.onopen = (): void => {
            this.reconnectDelay = RECONNECT_MIN_MS;
            this.byeReason = undefined;
            this.statusCb?.('open');
        };
        socket.onmessage = (ev: MessageEvent): void => {
            this.handleMessage(typeof ev.data === 'string' ? ev.data : '');
        };
        socket.onclose = (): void => {
            if (this.socket === socket) {
                this.socket = undefined;
            }
            this.statusCb?.('closed');
            this.scheduleReconnect();
        };
        socket.onerror = (): void => {
            socket.close();
        };
    }

    private handleMessage(data: string): void {
        let parsed: unknown;
        try {
            parsed = JSON.parse(data);
        } catch {
            return;
        }
        if (!isServerFrame(parsed)) {
            return;
        }
        switch (parsed.t) {
            case 'hello':
                this.helloCb?.(parsed);
                break;
            case 'cmd':
                this.commandCb?.(parsed.p, parsed.seq);
                break;
            case 'buzzer':
                this.buzzerCb?.(parsed.p);
                break;
            case 'bye': {
                const reason = typeof parsed.reason === 'string' && parsed.reason !== '' ? parsed.reason : 'unknown';
                this.byeReason = reason;
                if (reason !== 'shutdown') {
                    // the connection is over - no reconnect, the page has to be reloaded
                    this.stopped = true;
                    this.clearReconnectTimer();
                }
                // `shutdown`: the adapter restarts - the close below starts the usual backoff
                this.byeCb?.(reason);
                this.socket?.close();
                break;
            }
        }
    }

    private scheduleReconnect(): void {
        if (this.stopped || this.reconnectTimer || this.checkingAuth) {
            return;
        }
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(RECONNECT_MAX_MS, this.reconnectDelay * 2);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            void this.reconnect();
        }, delay);
    }

    /**
     * A browser does not see the http status of a refused websocket upgrade, so the PIN
     * is checked over http first: 401 means the PIN page has to be shown (reload), a
     * network error means the adapter is down and the backoff simply continues.
     */
    private async reconnect(): Promise<void> {
        this.checkingAuth = true;
        const auth = await this.checkAuth();
        this.checkingAuth = false;
        if (this.stopped) {
            return;
        }
        if (auth === 'unauthorized') {
            this.stopped = true;
            this.reload();
            return;
        }
        this.open();
    }

    private async checkAuth(): Promise<AuthCheck> {
        if (!this.fetchFn) {
            return 'unreachable';
        }
        try {
            const res = await this.fetchFn(AUTH_CHECK_PATH, { credentials: 'same-origin', cache: 'no-store' });
            return res.status === 401 ? 'unauthorized' : 'ok';
        } catch {
            return 'unreachable';
        }
    }
}
