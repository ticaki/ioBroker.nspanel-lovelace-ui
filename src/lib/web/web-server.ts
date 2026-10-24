import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Socket } from 'node:net';
import { WebSocketServer, type RawData, type WebSocket } from 'ws';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';
import type { SessionClient, VirtualPanelManager, WebPanelSession } from './virtual-panel-manager';
import { parseClientFrame, type ServerFrame } from './web-protocol';

/** Dead browsers are detected by a ping every ... ms */
const WS_PING_INTERVAL_MS = 30_000;

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
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain; charset=utf-8',
};

export type WebServerOptions = {
    port: number;
    bind: string;
    /** directory with the built frontend (index.html, assets/…) */
    wwwPath: string;
};

/**
 * HTTP + WebSocket server for the web panels.
 *
 * - `GET /`                      list of the panels with links
 * - `GET /<topicOrId>`           the frontend (www/index.html)
 * - `GET /assets/*` and files    static files from www/
 * - `WS  /ws/<topicOrId>?session=<id>`  the message channel of one web panel
 */
export class WebServer extends BaseClass {
    private readonly manager: VirtualPanelManager;
    private readonly options: WebServerOptions;
    private server: http.Server | undefined;
    private wss: WebSocketServer | undefined;
    private pingInterval: ioBroker.Interval | undefined;
    private readonly alive: WeakMap<WebSocket, boolean> = new WeakMap();

    constructor(adapter: AdapterClassDefinition, manager: VirtualPanelManager, options: WebServerOptions) {
        super(adapter, 'WebServer');
        this.manager = manager;
        this.options = options;
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
        this.server = http.createServer((req, res) => {
            void this.onRequest(req, res);
        });
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
        this.log.info(`Web panels available at http://${this.displayHost()}:${port}/<topic>`);
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
     * Access check for every HTTP request and WebSocket upgrade. Always allowed for now - the
     * hook is the place for a token or an ioBroker login later.
     *
     * @param _req the request
     * @returns true if the request may proceed
     */
    protected authorize(_req: http.IncomingMessage): Promise<boolean> {
        return Promise.resolve(true);
    }

    private async onRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        try {
            if (!(await this.authorize(req))) {
                this.reply(res, 403, 'text/plain; charset=utf-8', 'Forbidden');
                return;
            }
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                this.reply(res, 405, 'text/plain; charset=utf-8', 'Method not allowed');
                return;
            }
            const url = new URL(req.url ?? '/', 'http://localhost');
            const pathname = decodeURIComponent(url.pathname);
            if (pathname === '/' || pathname === '') {
                this.reply(res, 200, 'text/html; charset=utf-8', this.indexPage());
                return;
            }
            if (pathname.startsWith('/ws/')) {
                this.reply(res, 426, 'text/plain; charset=utf-8', 'WebSocket endpoint');
                return;
            }
            // a file of the frontend?
            const file = this.resolveStatic(pathname);
            if (file) {
                this.sendFile(res, file);
                return;
            }
            // otherwise the path is a topic or id -> the frontend
            const topicOrId = pathname.replace(/^\/+/, '').replace(/\/+$/, '');
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

    private async onUpgrade(req: http.IncomingMessage, socket: Socket, head: Buffer): Promise<void> {
        try {
            const url = new URL(req.url ?? '/', 'http://localhost');
            const pathname = decodeURIComponent(url.pathname);
            if (!this.wss || !pathname.startsWith('/ws/') || !(await this.authorize(req))) {
                socket.destroy();
                return;
            }
            const topicOrId = pathname.slice(4).replace(/\/+$/, '');
            const sessionId = url.searchParams.get('session') || undefined;
            this.wss.handleUpgrade(req, socket, head, ws => {
                void this.onConnection(ws, topicOrId, sessionId);
            });
        } catch (e) {
            this.log.error(`WebSocket upgrade failed: ${String(e)}`);
            socket.destroy();
        }
    }

    private async onConnection(ws: WebSocket, topicOrId: string, sessionId: string | undefined): Promise<void> {
        this.alive.set(ws, true);
        ws.on('pong', () => this.alive.set(ws, true));
        const client: SessionClient = {
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
        const bound: { session: WebPanelSession | undefined } = { session: undefined };
        ws.on('message', (data: RawData) => {
            if (!bound.session) {
                return;
            }
            const text = rawDataToString(data);
            const frame = parseClientFrame(text);
            if (!frame) {
                if (this.adapter.config.debugLogMqtt) {
                    this.log.debug(`Ignore invalid frame from ${bound.session.panel.name}: ${text.slice(0, 200)}`);
                }
                return;
            }
            void this.manager.onClientFrame(bound.session, frame);
        });
        ws.on('close', () => {
            if (bound.session) {
                this.manager.detach(bound.session, client);
            }
        });
        ws.on('error', (e: Error) => {
            this.log.debug(`WebSocket error (${topicOrId}): ${e.message}`);
        });
        bound.session = await this.manager.attach(topicOrId, sessionId, client);
        if (bound.session && ws.readyState !== ws.OPEN) {
            // closed while the panel was being created
            this.manager.detach(bound.session, client);
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
        res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
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
                    `<small>${escapeHtml(p.topic)} · ${escapeHtml(p.model)} · ${p.sessions} session(s)</small></li>`,
            )
            .join('');
        return page(
            'NSPanel Lovelace UI - Web panels',
            `<h1>Web panels</h1>${rows ? `<ul>${rows}</ul>` : '<p>No panels configured.</p>'}`,
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

function page(title: string, body: string): string {
    return (
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">` +
        `<title>${escapeHtml(title)}</title><style>body{font-family:system-ui,sans-serif;background:#111;color:#eee;margin:2rem}` +
        `a{color:#6cf}code{background:#222;padding:0 .3em}small{color:#999}</style></head><body>${body}</body></html>`
    );
}
