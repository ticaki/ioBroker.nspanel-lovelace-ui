import type { ClientFrame, ConnectionStatus, HelloFrame } from '../protocol/types';
import { isServerFrame } from '../protocol/types';
import type { PanelTransport } from './Transport';

const SESSION_KEY = 'nspanel-web-session';
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 30_000;

/** The parts of `window.location` the url builder needs */
export type LocationLike = Pick<Location, 'protocol' | 'host'>;

/** Session id of this browser, kept in localStorage so a reload binds to the same virtual panel */
export function sessionId(): string {
    try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored) {
            return stored;
        }
        const fresh = crypto.randomUUID();
        localStorage.setItem(SESSION_KEY, fresh);
        return fresh;
    } catch {
        return crypto.randomUUID();
    }
}

/** `ws(s)://<host>/ws/<topic>?session=<id>` next to the page */
export function websocketUrl(topic: string, session: string, location: LocationLike = window.location): string {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${location.host}/ws/${encodeURIComponent(topic)}?session=${encodeURIComponent(session)}`;
}

/**
 * Websocket connection to the adapter (frames of doc/web-panel/ARCHITECTURE.md 2.6).
 * A dropped connection is reopened with the same session (backoff 1 s … 30 s), a `bye`
 * frame ends the session for good.
 */
export class WsTransport implements PanelTransport {
    private readonly url: string;
    private socket: WebSocket | undefined;
    private reconnectDelay = RECONNECT_MIN_MS;
    private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    private stopped = true;
    private byeReason: string | undefined;
    private helloCb: ((hello: HelloFrame) => void) | undefined;
    private commandCb: ((payload: string) => void) | undefined;
    private buzzerCb: ((payload: string) => void) | undefined;
    private statusCb: ((status: ConnectionStatus) => void) | undefined;
    private byeCb: ((reason: string) => void) | undefined;

    constructor(topic: string, session: string = sessionId(), location: LocationLike = window.location) {
        this.url = websocketUrl(topic, session, location);
    }

    /** reason of the `bye` frame that ended the session, undefined while the session is alive */
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
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        this.socket?.close();
        this.socket = undefined;
    }

    onHello(cb: (hello: HelloFrame) => void): void {
        this.helloCb = cb;
    }
    onCommand(cb: (payload: string) => void): void {
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

    ack(): void {
        this.sendFrame({ t: 'ack' });
    }

    recv(payload: string): void {
        this.sendFrame({ t: 'recv', p: payload });
    }

    private sendFrame(frame: ClientFrame): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(frame));
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
                this.commandCb?.(parsed.p);
                break;
            case 'buzzer':
                this.buzzerCb?.(parsed.p);
                break;
            case 'bye': {
                // the session is over - no reconnect, the page has to be reloaded
                const reason = typeof parsed.reason === 'string' && parsed.reason !== '' ? parsed.reason : 'unknown';
                this.byeReason = reason;
                this.stopped = true;
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                    this.reconnectTimer = undefined;
                }
                this.byeCb?.(reason);
                this.socket?.close();
                break;
            }
        }
    }

    private scheduleReconnect(): void {
        if (this.stopped || this.reconnectTimer) {
            return;
        }
        const delay = this.reconnectDelay;
        this.reconnectDelay = Math.min(RECONNECT_MAX_MS, this.reconnectDelay * 2);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = undefined;
            this.open();
        }, delay);
    }
}
