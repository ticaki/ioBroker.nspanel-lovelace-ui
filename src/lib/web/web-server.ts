import * as http from 'node:http';
import * as https from 'node:https';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Socket } from 'node:net';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';
import type { WebClient, VirtualPanelManager, WebPanelEntry } from './virtual-panel-manager';
import { parseClientFrame, type ServerFrame } from './web-protocol';
import { relyingPartyFromHost, type FidoService } from './fido';

/** Dead browsers are detected by a ping every ... ms */
const WS_PING_INTERVAL_MS = 30_000;
/** Name of the cookie that holds the PIN token */
export const WEB_TOKEN_COOKIE = 'nspanel_web_token';
/** Cookie lifetime: 10 years - the token is invalidated by changing the PIN */
const WEB_TOKEN_COOKIE_MAX_AGE = 315_360_000;
/** A wrong PIN is answered after this delay */
const WRONG_PIN_DELAY_MS = 1000;
/** Wrong PINs per source address and minute before 429 */
export const PIN_ATTEMPTS_PER_MINUTE = 5;
const PIN_ATTEMPT_WINDOW_MS = 60_000;
/** Static directories served without PIN (the PIN page itself has no dependencies) */
const PUBLIC_STATIC_PREFIXES = ['/assets/', '/fonts/', '/icons/'];
/** Largest accepted body of POST /auth */
const MAX_AUTH_BODY = 4096;

const CONTENT_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain; charset=utf-8',
};

export type WebServerOptions = {
    port: number;
    bind: string;
    /** directory with the built frontend (index.html, assets/…) */
    wwwPath: string;
    /** global PIN of the web panels, '' = no protection */
    pin: string;
    /** `system.config.native.secret` - key of the token HMAC */
    secret: string;
    /** delay before a wrong PIN is answered (tests shorten it) */
    wrongPinDelayMs?: number;
    /**
     * TLS material of the ioBroker certificates (`adapter.getCertificatesAsync`). Set = the server
     * speaks HTTPS/WSS, the PIN cookie gets `Secure`. Undefined = plain HTTP.
     */
    tls?: WebServerTls;
    /**
     * FIDO2/WebAuthn login as alternative to the PIN. Only meaningful with `tls` (the browser
     * refuses WebAuthn on plain http); without it the `/auth/fido/*` routes answer 404.
     */
    fido?: FidoService;
};

/** key, certificate and optional chain as PEM (what `getCertificatesAsync` returns) */
export type WebServerTls = {
    key: string | Buffer;
    cert: string | Buffer;
    ca?: string | string[] | Buffer | Buffer[];
};

/** The parts of an incoming request the authorization looks at */
export type AuthRequestLike = {
    url?: string;
    headers: { cookie?: string };
};

export type PinCheck = 'ok' | 'wrong' | 'limited';

/**
 * Token a browser holds after entering the PIN: HMAC-SHA256(secret, pin) as hex. It depends only
 * on PIN and instance secret, so changing the PIN invalidates every stored token.
 *
 * @param secret `system.config.native.secret`
 * @param pin the PIN
 * @returns the token, '' for an empty PIN
 */
export function pinToken(secret: string, pin: string): string {
    if (!pin) {
        return '';
    }
    return createHmac('sha256', secret).update(pin).digest('hex');
}

/**
 * Parse a `Cookie` header.
 *
 * @param header the header value
 * @returns name -> value
 */
export function parseCookies(header: string | undefined): Record<string, string> {
    const result: Record<string, string> = {};
    if (!header) {
        return result;
    }
    for (const part of header.split(';')) {
        const eq = part.indexOf('=');
        if (eq === -1) {
            continue;
        }
        const name = part.slice(0, eq).trim();
        if (!name) {
            continue;
        }
        try {
            result[name] = decodeURIComponent(part.slice(eq + 1).trim());
        } catch {
            result[name] = part.slice(eq + 1).trim();
        }
    }
    return result;
}

/**
 * Where to go after a successful PIN: only local absolute paths, everything else is `/`.
 *
 * @param next the `next` parameter
 * @returns a safe path
 */
export function safeNext(next: string | null | undefined): string {
    if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
        return '/';
    }
    return next;
}

function tokensEqual(a: string, b: string): boolean {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    return ba.length === bb.length && ba.length > 0 && timingSafeEqual(ba, bb);
}

/**
 * Checks PINs and limits the attempts per source address.
 */
export class PinGuard {
    private readonly token: string;
    private readonly pin: string;
    private attempts: Map<string, { count: number; resetAt: number }> = new Map();

    constructor(secret: string, pin: string) {
        this.pin = pin;
        this.token = pinToken(secret, pin);
    }

    /** true if a PIN is set */
    get enabled(): boolean {
        return this.pin !== '';
    }

    /** the token a browser has to present */
    get expectedToken(): string {
        return this.token;
    }

    /**
     * Is this token the current one?
     *
     * @param token token from cookie or query
     * @returns true if it grants access (always true without PIN)
     */
    isValidToken(token: string | undefined): boolean {
        if (!this.enabled) {
            return true;
        }
        return typeof token === 'string' && tokensEqual(token, this.token);
    }

    /**
     * Check an entered PIN.
     *
     * @param ip source address (rate limit)
     * @param pin the entered PIN
     * @param now current time (tests)
     * @returns ok, wrong or limited (too many wrong PINs from this address)
     */
    check(ip: string, pin: string, now: number = Date.now()): PinCheck {
        if (!this.enabled) {
            return 'ok';
        }
        let entry = this.attempts.get(ip);
        if (entry && entry.resetAt <= now) {
            this.attempts.delete(ip);
            entry = undefined;
        }
        if (entry && entry.count >= PIN_ATTEMPTS_PER_MINUTE) {
            return 'limited';
        }
        if (tokensEqual(pin, this.pin)) {
            this.attempts.delete(ip);
            return 'ok';
        }
        if (!entry) {
            entry = { count: 0, resetAt: now + PIN_ATTEMPT_WINDOW_MS };
            this.attempts.set(ip, entry);
        }
        entry.count++;
        // forget addresses nobody uses any more
        if (this.attempts.size > 1000) {
            for (const [key, value] of this.attempts) {
                if (value.resetAt <= now) {
                    this.attempts.delete(key);
                }
            }
        }
        return 'wrong';
    }
}

/**
 * HTTP + WebSocket server for the web panels.
 *
 * - `GET /`                      list of the panels with links
 * - `GET /<topicOrId>`           the frontend (www/index.html); `?pin=` checks the PIN and redirects
 * - `POST /auth`                 PIN form (`pin`, `next`)
 * - `GET /auth/check`            204 if authorized, else 401
 * - `GET /assets/*` `/fonts/*` `/icons/*`  static files from www/, without PIN
 * - `WS  /ws/<topicOrId>`        the message channel of one web panel
 * - `GET /auth/fido/register`, `POST /auth/fido/{register,login}/{options,verify}`  FIDO2 (see 2.5.3)
 *
 * With `options.tls` the same server speaks HTTPS and WSS (ioBroker certificates).
 */
export class WebServer extends BaseClass {
    private readonly manager: VirtualPanelManager;
    private readonly options: WebServerOptions;
    private readonly guard: PinGuard;
    private server: http.Server | https.Server | undefined;
    private wss: WebSocketServer | undefined;
    private pingInterval: ioBroker.Interval | undefined;
    private readonly alive: WeakMap<WebSocket, boolean> = new WeakMap();

    constructor(adapter: AdapterClassDefinition, manager: VirtualPanelManager, options: WebServerOptions) {
        super(adapter, 'WebServer');
        this.manager = manager;
        this.options = options;
        this.guard = new PinGuard(options.secret, options.pin);
    }

    /** true if the server speaks HTTPS (and WSS) */
    get secure(): boolean {
        return this.options.tls !== undefined;
    }

    /** `https` or `http` - the scheme browsers reach the server with */
    get protocol(): 'http' | 'https' {
        return this.secure ? 'https' : 'http';
    }

    /** the FIDO2 service when FIDO2 login is active (needs tls) */
    get fido(): FidoService | undefined {
        return this.secure ? this.options.fido : undefined;
    }

    /**
     * Start listening.
     *
     * @returns true if the server is up
     */
    async start(): Promise<boolean> {
        if (this.server) {
            return true;
        }
        const port = this.options.port;
        if (!port || port < 1 || port > 65_535) {
            this.log.error(`Invalid web panel port ${port} - web panels are disabled`);
            return false;
        }
        const free = await this.adapter.getPortAsync(port);
        if (free !== port) {
            this.log.error(
                `Web panel port ${port} is already in use (next free port: ${free}) - web panels are disabled`,
            );
            return false;
        }
        this.wss = new WebSocketServer({ noServer: true });
        const handler = (req: http.IncomingMessage, res: http.ServerResponse): void => {
            void this.onRequest(req, res);
        };
        if (this.options.tls) {
            // the WebSocket upgrade runs over the same TLS server (wss://)
            try {
                this.server = https.createServer(
                    { key: this.options.tls.key, cert: this.options.tls.cert, ca: this.options.tls.ca },
                    handler,
                );
            } catch (e) {
                this.log.error(`Web panel certificate is not usable: ${String(e)} - web panels are disabled`);
                this.wss.close();
                this.wss = undefined;
                return false;
            }
        } else {
            this.server = http.createServer(handler);
        }
        this.server.on('upgrade', (req, socket, head) => {
            void this.onUpgrade(req, socket as Socket, head);
        });
        this.server.on('error', (e: Error) => {
            this.log.error(`Web server error: ${e.message}`);
        });
        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(port, this.options.bind, () => {
                this.server!.off('error', reject);
                resolve();
            });
        }).catch((e: Error) => {
            this.log.error(`Web server could not listen on ${this.options.bind}:${port}: ${e.message}`);
            this.server = undefined;
        });
        if (!this.server) {
            return false;
        }
        this.pingInterval = this.adapter.setInterval(() => this.pingClients(), WS_PING_INTERVAL_MS);
        this.log.info(`Web panels available at ${this.protocol}://${this.displayHost()}:${port}/<topic>`);
        if (!this.guard.enabled) {
            this.log.warn('No PIN set for the web panels - everyone who reaches the port can use them');
        }
        return true;
    }

    async stop(): Promise<void> {
        if (this.pingInterval) {
            this.adapter.clearInterval(this.pingInterval);
            this.pingInterval = undefined;
        }
        if (this.wss) {
            for (const ws of this.wss.clients) {
                ws.terminate();
            }
            this.wss.close();
            this.wss = undefined;
        }
        if (this.server) {
            const server = this.server;
            this.server = undefined;
            await new Promise<void>(resolve => {
                server.close(() => resolve());
                server.closeAllConnections?.();
            });
        }
    }

    async delete(): Promise<void> {
        await this.stop();
        await super.delete();
    }

    /**
     * Access check for HTTP requests and WebSocket upgrades: a valid token in the cookie or in
     * `?token=`. Always true without PIN.
     *
     * @param req the request
     * @returns true if the request may proceed
     */
    authorize(req: AuthRequestLike): boolean {
        if (!this.guard.enabled) {
            return true;
        }
        const cookie = parseCookies(req.headers.cookie)[WEB_TOKEN_COOKIE];
        if (this.guard.isValidToken(cookie)) {
            return true;
        }
        const token = new URL(req.url ?? '/', 'http://localhost').searchParams.get('token');
        return token !== null && this.guard.isValidToken(token);
    }

    private async onRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            const pathname = decodeURIComponent(url.pathname);
            if (req.method === 'POST' && pathname === '/auth') {
                await this.onAuthPost(req, res);
                return;
            }
            if (pathname === '/auth/fido' || pathname.startsWith('/auth/fido/')) {
                await this.onFido(req, res, pathname, url);
                return;
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                this.reply(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
                return;
            }
            if (pathname === '/auth/check') {
                if (this.authorize(req)) {
                    res.writeHead(204, { 'Cache-Control': 'no-store' });
                    res.end();
                } else {
                    this.reply(res, 401, 'text/plain; charset=utf-8', 'Unauthorized');
                }
                return;
            }
            if (pathname.startsWith('/ws/')) {
                this.reply(res, 426, 'text/plain; charset=utf-8', 'WebSocket endpoint');
                return;
            }
            if (PUBLIC_STATIC_PREFIXES.some(p => pathname.startsWith(p))) {
                const file = this.resolveStatic(pathname);
                if (file) {
                    this.sendFile(res, file);
                } else {
                    this.reply(res, 404, 'text/plain; charset=utf-8', 'Not found');
                }
                return;
            }
            const topicOrId = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
            // PIN in the address (link from the admin): check, set the cookie, drop it from the address
            if (url.searchParams.has('pin') && !this.resolveStatic(pathname)) {
                const result = this.guard.check(remoteAddress(req), url.searchParams.get('pin') ?? '');
                if (result === 'ok') {
                    res.writeHead(302, {
                        Location: pathname,
                        'Set-Cookie': this.tokenCookie(),
                        'Cache-Control': 'no-store',
                    });
                    res.end();
                    return;
                }
                await this.rejectPin(res, result, pathname);
                return;
            }
            if (!this.authorize(req)) {
                this.reply(res, 401, 'text/html; charset=utf-8', this.pinPage(pathname));
                return;
            }
            if (pathname === '/' || pathname === '') {
                this.reply(res, 200, 'text/html; charset=utf-8', this.indexPage());
                return;
            }
            // a file of the frontend?
            const file = this.resolveStatic(pathname);
            if (file) {
                this.sendFile(res, file);
                return;
            }
            // otherwise the path is a topic or id -> the frontend
            if (!this.manager.hasPanel(topicOrId)) {
                this.reply(res, 404, 'text/html; charset=utf-8', this.notFoundPage(topicOrId));
                return;
            }
            const index = this.resolveStatic('/index.html');
            if (index) {
                this.sendFile(res, index);
            } else {
                this.reply(res, 200, 'text/html; charset=utf-8', this.missingFrontendPage(topicOrId));
            }
        } catch (e) {
            this.log.error(`Web request failed: ${String(e)}`);
            if (!res.headersSent) {
                this.reply(res, 500, 'text/plain; charset=utf-8', 'Internal error');
            }
        }
    }

    /**
     * The PIN form: `pin` and `next` (urlencoded). Sets the cookie and redirects to `next`.
     *
     * @param req the request
     * @param res the response
     */
    private async onAuthPost(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const body = await readBody(req, MAX_AUTH_BODY);
        const form = new URLSearchParams(body);
        const next = safeNext(form.get('next'));
        if (!this.guard.enabled) {
            res.writeHead(303, { Location: next, 'Cache-Control': 'no-store' });
            res.end();
            return;
        }
        const result = this.guard.check(remoteAddress(req), form.get('pin') ?? '');
        if (result === 'ok') {
            res.writeHead(303, { Location: next, 'Set-Cookie': this.tokenCookie(), 'Cache-Control': 'no-store' });
            res.end();
            return;
        }
        await this.rejectPin(res, result, next);
    }

    /**
     * FIDO2 routes. All answer 404 while FIDO2 is off (no tls or not enabled).
     *
     * - `GET  /auth/fido/register`          page to register a key - needs the PIN token
     * - `POST /auth/fido/register/options`  `{ name }` -> creation options (needs the PIN token)
     * - `POST /auth/fido/register/verify`   credential JSON -> stores the key (needs the PIN token)
     * - `POST /auth/fido/login/options`     -> request options
     * - `POST /auth/fido/login/verify`      `{ response, next }` -> sets the PIN cookie, `{ ok, redirect }`
     *
     * @param req the request
     * @param res the response
     * @param pathname decoded path
     * @param url parsed url
     */
    private async onFido(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        pathname: string,
        url: URL,
    ): Promise<void> {
        const fido = this.fido;
        if (!fido) {
            this.reply(res, 404, 'text/plain; charset=utf-8', 'Not found');
            return;
        }
        const ip = remoteAddress(req);
        if (req.method === 'GET' && pathname === '/auth/fido/register') {
            if (!this.authorize(req)) {
                this.reply(res, 401, 'text/html; charset=utf-8', this.pinPage(pathname));
                return;
            }
            this.reply(res, 200, 'text/html; charset=utf-8', this.fidoRegisterPage(url));
            return;
        }
        if (req.method !== 'POST') {
            this.reply(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
            return;
        }
        const rp = relyingPartyFromHost(req.headers.host, this.options.port);
        if (typeof rp === 'string') {
            this.replyJson(res, 400, { error: rp });
            return;
        }
        let body: unknown;
        try {
            const text = await readBody(req, MAX_AUTH_BODY * 16);
            body = text ? JSON.parse(text) : {};
        } catch {
            this.replyJson(res, 400, { error: 'invalid JSON' });
            return;
        }
        const data: Record<string, unknown> =
            typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
        switch (pathname) {
            case '/auth/fido/register/options': {
                if (!this.authorize(req)) {
                    this.replyJson(res, 401, { error: 'unauthorized' });
                    return;
                }
                if (fido.requests.isLimited(ip)) {
                    this.replyJson(res, 429, { error: 'too many requests' });
                    return;
                }
                fido.requests.hit(ip);
                const result = await fido.registrationOptions(rp, typeof data.name === 'string' ? data.name : '');
                this.replyFidoResult(res, result);
                return;
            }
            case '/auth/fido/register/verify': {
                if (!this.authorize(req)) {
                    this.replyJson(res, 401, { error: 'unauthorized' });
                    return;
                }
                if (fido.failures.isLimited(ip)) {
                    this.replyJson(res, 429, { error: 'too many attempts - wait a minute' });
                    return;
                }
                const result = await fido.verifyRegistration(rp, body);
                if (!result.ok) {
                    fido.failures.hit(ip);
                    await this.wait(this.options.wrongPinDelayMs ?? WRONG_PIN_DELAY_MS);
                } else {
                    fido.failures.reset(ip);
                }
                this.replyFidoResult(res, result);
                return;
            }
            case '/auth/fido/login/options': {
                if (fido.requests.isLimited(ip)) {
                    this.replyJson(res, 429, { error: 'too many requests' });
                    return;
                }
                fido.requests.hit(ip);
                const result = await fido.authenticationOptions(rp);
                this.replyFidoResult(res, result);
                return;
            }
            case '/auth/fido/login/verify': {
                if (fido.failures.isLimited(ip)) {
                    this.replyJson(res, 429, { error: 'too many attempts - wait a minute' });
                    return;
                }
                const result = await fido.verifyAuthentication(rp, data.response ?? body);
                if (!result.ok) {
                    fido.failures.hit(ip);
                    await this.wait(this.options.wrongPinDelayMs ?? WRONG_PIN_DELAY_MS);
                    this.replyFidoResult(res, result);
                    return;
                }
                fido.failures.reset(ip);
                const redirect = safeNext(typeof data.next === 'string' ? data.next : '/');
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Cache-Control': 'no-store',
                };
                if (this.guard.enabled) {
                    // the same cookie the PIN login sets - without a PIN there is nothing to unlock
                    headers['Set-Cookie'] = this.tokenCookie();
                }
                res.writeHead(200, headers);
                res.end(JSON.stringify({ ok: true, redirect, key: result.value.name }));
                return;
            }
            default:
                this.reply(res, 404, 'text/plain; charset=utf-8', 'Not found');
        }
    }

    private replyFidoResult<T>(
        res: http.ServerResponse,
        result: { ok: true; value: T } | { ok: false; status: number; error: string },
    ): void {
        if (result.ok) {
            this.replyJson(res, 200, result.value);
        } else {
            this.replyJson(res, result.status, { error: result.error });
        }
    }

    private replyJson(res: http.ServerResponse, status: number, body: unknown): void {
        this.reply(res, status, 'application/json; charset=utf-8', JSON.stringify(body));
    }

    private async rejectPin(res: http.ServerResponse, result: PinCheck, next: string): Promise<void> {
        if (result === 'limited') {
            this.reply(res, 429, 'text/html; charset=utf-8', this.pinPage(next, 'Too many attempts - wait a minute.'));
            return;
        }
        await this.wait(this.options.wrongPinDelayMs ?? WRONG_PIN_DELAY_MS);
        this.reply(res, 401, 'text/html; charset=utf-8', this.pinPage(next, 'Wrong PIN.'));
    }

    private wait(ms: number): Promise<void> {
        if (ms <= 0 || this.unload || this.adapter.unload) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            this.adapter.setTimeout(() => resolve(), ms);
        });
    }

    /**
     * The `Set-Cookie` value of the PIN token; over HTTPS the cookie is marked `Secure`.
     *
     * @returns the header value
     */
    tokenCookie(): string {
        const secure = this.secure ? '; Secure' : '';
        return `${WEB_TOKEN_COOKIE}=${this.guard.expectedToken}; Path=/; Max-Age=${WEB_TOKEN_COOKIE_MAX_AGE}; SameSite=Lax; HttpOnly${secure}`;
    }

    private async onUpgrade(req: http.IncomingMessage, socket: Socket, head: Buffer): Promise<void> {
        try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            const pathname = decodeURIComponent(url.pathname);
            if (!this.wss || !pathname.startsWith('/ws/')) {
                socket.destroy();
                return;
            }
            if (!this.authorize(req)) {
                // a browser cannot see this status - it asks GET /auth/check before it connects again
                socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n');
                socket.destroy();
                return;
            }
            const topicOrId = pathname.slice(4).replace(/\/+$/, '');
            this.wss.handleUpgrade(req, socket, head, ws => {
                void this.onConnection(ws, topicOrId);
            });
        } catch (e) {
            this.log.error(`WebSocket upgrade failed: ${String(e)}`);
            socket.destroy();
        }
    }

    private async onConnection(ws: WebSocket, topicOrId: string): Promise<void> {
        this.alive.set(ws, true);
        ws.on('pong', () => this.alive.set(ws, true));
        const client: WebClient = {
            send: (frame: ServerFrame): void => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify(frame));
                }
            },
            close: (reason: string): void => {
                if (ws.readyState === ws.OPEN || ws.readyState === ws.CONNECTING) {
                    ws.close(1000, reason.slice(0, 120));
                }
            },
        };
        const bound: { entry: WebPanelEntry | undefined } = { entry: undefined };
        ws.on('message', (data: RawData) => {
            if (!bound.entry) {
                return;
            }
            const text = rawDataToString(data);
            const frame = parseClientFrame(text);
            if (!frame) {
                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(`Ignore invalid frame from ${bound.entry.topic}: ${text.slice(0, 200)}`);
                }
                return;
            }
            void this.manager.onClientFrame(bound.entry, frame);
        });
        ws.on('close', () => {
            if (bound.entry) {
                this.manager.detach(bound.entry, client);
            }
        });
        ws.on('error', (e: Error) => {
            this.log.debug(`WebSocket error (${topicOrId}): ${e.message}`);
        });
        bound.entry = await this.manager.attach(topicOrId, client);
        if (bound.entry && ws.readyState !== ws.OPEN) {
            // closed while the panel was being created
            this.manager.detach(bound.entry, client);
        }
    }

    private pingClients(): void {
        if (!this.wss) {
            return;
        }
        for (const ws of this.wss.clients) {
            if (this.alive.get(ws) === false) {
                ws.terminate();
                continue;
            }
            this.alive.set(ws, false);
            ws.ping();
        }
    }

    /**
     * Absolute path of a file under www/.
     *
     * @param pathname the request path
     * @returns the file, undefined if it does not exist or leaves the directory
     */
    private resolveStatic(pathname: string): string | undefined {
        const root = path.resolve(this.options.wwwPath);
        const file = path.resolve(root, `.${pathname}`);
        if (file !== root && !file.startsWith(root + path.sep)) {
            return undefined;
        }
        try {
            return fs.statSync(file).isFile() ? file : undefined;
        } catch {
            return undefined;
        }
    }

    private sendFile(res: http.ServerResponse, file: string): void {
        const type = CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
        res.writeHead(200, {
            'Content-Type': type,
            'Cache-Control': file.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600',
        });
        const stream = fs.createReadStream(file);
        stream.on('error', (e: Error) => {
            this.log.warn(`Cannot read ${file}: ${e.message}`);
            res.destroy();
        });
        stream.pipe(res);
    }

    private reply(res: http.ServerResponse, status: number, type: string, body: string): void {
        res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        res.end(body);
    }

    private displayHost(): string {
        return this.options.bind && this.options.bind !== '0.0.0.0' && this.options.bind !== '::'
            ? this.options.bind
            : '<host>';
    }

    private indexPage(): string {
        const rows = this.manager
            .listPanels()
            .map(
                p =>
                    `<li><a href="/${encodeURIComponent(p.topic)}">${escapeHtml(p.name)}</a> ` +
                    `<small>${escapeHtml(p.topic)} · ${escapeHtml(p.model)} · ${p.kind === 'web' ? 'web panel' : 'NSPanel'} · ` +
                    `${p.clients} client(s)</small></li>`,
            )
            .join('');
        const fidoLink = this.fido
            ? `<p><a href="/auth/fido/register">Register a security key (FIDO2)</a> - ` +
              `<small>login alternative to the PIN${this.fido.hasCredentials ? '' : ', none registered yet'}</small></p>`
            : '';
        return page(
            'NSPanel Lovelace UI - Web panels',
            `<h1>Web panels</h1>${rows ? `<ul>${rows}</ul>` : '<p>No panels configured.</p>'}${fidoLink}`,
        );
    }

    private pinPage(next: string, error: string = ''): string {
        const safe = safeNext(next);
        const fido = this.fido;
        const fidoPart =
            fido && fido.hasCredentials
                ? `<p><button type="button" id="fido-login">Sign in with a security key</button></p>` +
                  `<p class="error" id="fido-error"></p>` +
                  `<script>${fidoScript()}` +
                  `document.getElementById('fido-login').addEventListener('click',function(){` +
                  `nsFido.login(${JSON.stringify(safe)},document.getElementById('fido-error'));});</script>`
                : '';
        return page(
            'NSPanel Lovelace UI - PIN',
            `<h1>Web panel</h1><p>This web panel is protected by a PIN.</p>` +
                `<form method="post" action="/auth">` +
                `<input type="hidden" name="next" value="${escapeHtml(safe)}">` +
                `<label>PIN <input type="password" name="pin" autofocus autocomplete="current-password" inputmode="numeric"></label> ` +
                `<button type="submit">Open</button></form>${error ? `<p class="error">${escapeHtml(error)}</p>` : ''}${fidoPart}`,
        );
    }

    /**
     * Page to register a FIDO2 security key (only reachable with a valid PIN token).
     *
     * @param url the request url (`?next=` is where the "back" link goes)
     * @returns html
     */
    private fidoRegisterPage(url: URL): string {
        const back = safeNext(url.searchParams.get('next'));
        const keys = this.fido?.hasCredentials ? '' : '<p><small>No security key is registered yet.</small></p>';
        return page(
            'NSPanel Lovelace UI - Security key',
            `<h1>Register a security key</h1>` +
                `<p>A FIDO2 security key (or a passkey of this device) can be used instead of the PIN to open the web panels.</p>` +
                `<p><strong>Requirements</strong></p><ul>` +
                `<li>The web panels are served over <strong>HTTPS</strong> (this page already is).</li>` +
                `<li>The address in the browser is a <strong>host name</strong> (DNS), not an IP address - WebAuthn does not work with IP addresses.</li>` +
                `<li>The browser has to <strong>trust the certificate</strong>. A self-signed certificate works when it is installed as trusted in the browser or the system.</li>` +
                `</ul>${keys}` +
                `<form id="fido-form"><label>Name of the key <input type="text" id="fido-name" maxlength="64" autofocus required placeholder="e.g. YubiKey kitchen"></label> ` +
                `<button type="submit">Register</button></form>` +
                `<p class="error" id="fido-error"></p><p id="fido-ok"></p>` +
                `<p><a href="${escapeHtml(back)}">Back</a></p>` +
                `<script>${fidoScript()}` +
                `document.getElementById('fido-form').addEventListener('submit',function(e){e.preventDefault();` +
                `nsFido.register(document.getElementById('fido-name').value,document.getElementById('fido-error'),document.getElementById('fido-ok'));});</script>`,
        );
    }

    private notFoundPage(topicOrId: string): string {
        return page(
            'Panel not found',
            `<h1>Panel not found</h1><p>No panel with topic or id <code>${escapeHtml(topicOrId)}</code>.</p>` +
                `<p><a href="/">All panels</a></p>`,
        );
    }

    private missingFrontendPage(topicOrId: string): string {
        return page(
            'Frontend missing',
            `<h1>Frontend missing</h1><p>The panel <code>${escapeHtml(topicOrId)}</code> exists, but ` +
                `<code>www/index.html</code> was not found. Build the frontend with <code>npm run build:web</code>.</p>`,
        );
    }
}

function remoteAddress(req: http.IncomingMessage): string {
    return req.socket?.remoteAddress ?? 'unknown';
}

function readBody(req: http.IncomingMessage, limit: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;
        req.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > limit) {
                reject(new Error('Body too large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolve(Buffer.concat(chunks).toString()));
        req.on('error', reject);
    });
}

function rawDataToString(data: RawData): string {
    if (Array.isArray(data)) {
        return Buffer.concat(data).toString();
    }
    if (data instanceof ArrayBuffer) {
        return Buffer.from(data).toString();
    }
    return data.toString();
}

function escapeHtml(s: string): string {
    return s.replace(
        /[&<>"']/g,
        c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
    );
}

/**
 * Inline browser script for the FIDO2 pages: base64url helpers, option conversion, `create`/`get`
 * and the calls to the `/auth/fido/*` routes. No external dependencies.
 *
 * @returns javascript defining `nsFido.register(name, errorEl, okEl)` and `nsFido.login(next, errorEl)`
 */
function fidoScript(): string {
    return (
        `var nsFido=(function(){` +
        `function dec(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a.buffer;}` +
        `function enc(buf){var a=new Uint8Array(buf),s='';for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');}` +
        `function creds(list){return (list||[]).map(function(c){return Object.assign({},c,{id:dec(c.id)});});}` +
        `function toCreate(o){o=Object.assign({},o);o.challenge=dec(o.challenge);o.user=Object.assign({},o.user,{id:dec(o.user.id)});o.excludeCredentials=creds(o.excludeCredentials);return o;}` +
        `function toGet(o){o=Object.assign({},o);o.challenge=dec(o.challenge);o.allowCredentials=creds(o.allowCredentials);return o;}` +
        `function serialize(c){var r=c.response,out={id:c.id,rawId:enc(c.rawId),type:c.type,authenticatorAttachment:c.authenticatorAttachment||undefined,clientExtensionResults:c.getClientExtensionResults?c.getClientExtensionResults():{},response:{clientDataJSON:enc(r.clientDataJSON)}};` +
        `if(r.attestationObject){out.response.attestationObject=enc(r.attestationObject);if(r.getTransports)out.response.transports=r.getTransports();}` +
        `if(r.authenticatorData&&r.signature){out.response.authenticatorData=enc(r.authenticatorData);out.response.signature=enc(r.signature);if(r.userHandle)out.response.userHandle=enc(r.userHandle);}` +
        `return out;}` +
        `function post(url,body){return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}).then(function(res){return res.json().catch(function(){return {};}).then(function(j){if(!res.ok)throw new Error(j.error||('HTTP '+res.status));return j;});});}` +
        `function check(){if(!window.isSecureContext||!navigator.credentials||!window.PublicKeyCredential)throw new Error('WebAuthn is not available here - use https with a host name');}` +
        `function fail(el,e){el.textContent=(e&&e.message)||String(e);}` +
        `return {` +
        `register:function(name,errEl,okEl){errEl.textContent='';okEl.textContent='';try{check();}catch(e){fail(errEl,e);return;}` +
        `post('/auth/fido/register/options',{name:name}).then(function(o){return navigator.credentials.create({publicKey:toCreate(o)});})` +
        `.then(function(c){return post('/auth/fido/register/verify',serialize(c));})` +
        `.then(function(r){okEl.textContent='Security key "'+r.name+'" registered. You can sign in with it from now on.';})` +
        `.catch(function(e){fail(errEl,e);});},` +
        `login:function(next,errEl){errEl.textContent='';try{check();}catch(e){fail(errEl,e);return;}` +
        `post('/auth/fido/login/options',{}).then(function(o){return navigator.credentials.get({publicKey:toGet(o)});})` +
        `.then(function(c){return post('/auth/fido/login/verify',{response:serialize(c),next:next});})` +
        `.then(function(r){location.href=r.redirect||'/';})` +
        `.catch(function(e){fail(errEl,e);});}` +
        `};})();`
    );
}

function page(title: string, body: string): string {
    return (
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:2rem}` +
        `a{color:#6cf}code{background:#222;padding:0 .3em}small{color:#999}` +
        `input{font:inherit;padding:.4em .6em;border:1px solid #444;border-radius:4px;background:#222;color:#eee}` +
        `button{font:inherit;padding:.4em 1em;border:0;border-radius:4px;background:#6cf;color:#111;cursor:pointer}` +
        `.error{color:#f66}</style></head><body>${body}</body></html>`
    );
}
