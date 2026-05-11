import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';

/**
 * Resolved file metadata used to answer a request.
 */
export interface ResolvedFile {
    absPath: string;
    size: number;
    contentType: string;
}

/**
 * Pluggable file source for the HTTP server. The server itself only knows how to
 * serve a `ResolvedFile`; *where* that file comes from (OS-temp, file service,
 * remote mirror, ...) is up to the resolver.
 */
export interface HTTPFileResolver {
    resolve(urlPath: string): Promise<ResolvedFile | undefined>;
    list?(): Promise<string[]>;
}

/**
 * Parsed `Range:` header. End is inclusive (HTTP semantics).
 */
export interface ParsedRange {
    start: number;
    end?: number;
    suffixLength?: number;
}

/**
 * Concrete range to serve, end-inclusive.
 */
export interface ResolvedRange {
    start: number;
    end: number;
    length: number;
}

/**
 * Parse a single-range `Range: bytes=...` header. Returns `undefined` for
 * - missing header
 * - non-bytes units (`Range: items=...`)
 * - syntactically broken values
 * - multi-range requests (`bytes=0-50,100-150`) — intentional: the TFT flasher
 *   uses single ranges only, and shipping multipart/byteranges would just add
 *   unused complexity.
 *
 * @param header value of the `Range:` request header (or `undefined` / array)
 */
export function parseRangeHeader(header: string | string[] | undefined): ParsedRange | undefined {
    if (!header) {
        return undefined;
    }
    const h = Array.isArray(header) ? header[0] : header;
    if (!h.startsWith('bytes=')) {
        return undefined;
    }
    const spec = h.slice('bytes='.length).trim();
    if (spec.includes(',')) {
        return undefined;
    }
    const dash = spec.indexOf('-');
    if (dash === -1) {
        return undefined;
    }
    const startStr = spec.slice(0, dash).trim();
    const endStr = spec.slice(dash + 1).trim();

    if (startStr === '') {
        // suffix range: bytes=-N  → last N bytes
        if (endStr === '') {
            return undefined;
        }
        const suffix = Number(endStr);
        if (!Number.isFinite(suffix) || suffix <= 0) {
            return undefined;
        }
        return { start: 0, suffixLength: Math.floor(suffix) };
    }

    const start = Number(startStr);
    if (!Number.isFinite(start) || start < 0) {
        return undefined;
    }

    if (endStr === '') {
        // open-ended: bytes=START-   → start..size-1   (this is what FlashNextionAdv0 sends on resume)
        return { start: Math.floor(start) };
    }

    const end = Number(endStr);
    if (!Number.isFinite(end) || end < 0 || end < start) {
        return undefined;
    }
    return { start: Math.floor(start), end: Math.floor(end) };
}

/**
 * Turn a parsed range into a concrete byte window against a file of known size.
 * Returns `undefined` if the range is unsatisfiable (then caller must reply
 * `416 Range Not Satisfiable`).
 *
 * @param range parsed range
 * @param size  full file size in bytes
 */
export function resolveRange(range: ParsedRange, size: number): ResolvedRange | undefined {
    if (size <= 0) {
        return undefined;
    }
    if (range.suffixLength !== undefined) {
        const length = Math.min(range.suffixLength, size);
        const start = size - length;
        return { start, end: size - 1, length };
    }
    if (range.start >= size) {
        return undefined;
    }
    const end = range.end !== undefined ? Math.min(range.end, size - 1) : size - 1;
    if (end < range.start) {
        return undefined;
    }
    return { start: range.start, end, length: end - range.start + 1 };
}

/**
 * Default resolver — returns nothing. Phase-1 placeholder.
 */
export class NoopFileResolver implements HTTPFileResolver {
    async resolve(_urlPath: string): Promise<ResolvedFile | undefined> {
        return undefined;
    }
    async list(): Promise<string[]> {
        return [];
    }
}

/**
 * Serves files from a single flat directory on disk.
 *
 * Used for the TFT firmware mirror: the configured directory holds all
 * `nspanel*.tft` model files plus a `version.json`. Path traversal is blocked
 * by collapsing `..` and requiring the resolved path to stay inside the root.
 */
export class TempDirFileResolver implements HTTPFileResolver {
    private root: string;

    constructor(root: string) {
        this.root = path.resolve(root);
    }

    getRoot(): string {
        return this.root;
    }

    private safeResolve(urlPath: string): string | undefined {
        // Strip leading slashes and a single optional `tft/` prefix so both
        // `GET /foo.tft` and `GET /tft/foo.tft` work.
        let p = urlPath.replace(/^\/+/, '');
        if (p.startsWith('tft/')) {
            p = p.slice('tft/'.length);
        }
        if (p === '' || p.includes('\0')) {
            return undefined;
        }
        const decoded = (() => {
            try {
                return decodeURIComponent(p);
            } catch {
                return undefined;
            }
        })();
        if (decoded === undefined) {
            return undefined;
        }
        const candidate = path.resolve(this.root, decoded);
        // Reject path traversal: resolved path must stay below root.
        const rel = path.relative(this.root, candidate);
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
            return undefined;
        }
        return candidate;
    }

    async resolve(urlPath: string): Promise<ResolvedFile | undefined> {
        const abs = this.safeResolve(urlPath);
        if (!abs) {
            return undefined;
        }
        try {
            const st = await fs.promises.stat(abs);
            if (!st.isFile()) {
                return undefined;
            }
            return {
                absPath: abs,
                size: st.size,
                contentType: TempDirFileResolver.contentTypeFor(abs),
            };
        } catch {
            return undefined;
        }
    }

    async list(): Promise<string[]> {
        try {
            const entries = await fs.promises.readdir(this.root, { withFileTypes: true });
            return entries.filter(e => e.isFile()).map(e => e.name);
        } catch {
            return [];
        }
    }

    static contentTypeFor(absPath: string): string {
        const ext = path.extname(absPath).toLowerCase();
        switch (ext) {
            case '.tft':
                return 'application/octet-stream';
            case '.json':
                return 'application/json; charset=utf-8';
            case '.txt':
                return 'text/plain; charset=utf-8';
            case '.be':
                return 'text/plain; charset=utf-8';
            default:
                return 'application/octet-stream';
        }
    }
}

/**
 * Internal HTTP server with Range-Request support (`206 Partial Content`).
 *
 * Required by Tasmota Berry `FlashNextionAdv0`: during the Nextion flash the
 * display reports checkpoint offsets, and Berry re-requests `Range: bytes=<offset>-`
 * to resume. Without `206` the flash stalls at a fixed percentage.
 */
export class HTTPServerClass extends BaseClass {
    server: http.Server | undefined;
    ready: boolean = false;
    private actualPort: number = 0;
    private bind: string = '0.0.0.0';
    private resolver: HTTPFileResolver;

    /**
     * Factory: instantiate + start in one step. Mirrors `MQTTServerClass.createMQTTServer`.
     *
     * @param adapter  adapter instance
     * @param port     preferred port; 0 = let OS pick a free one. If non-zero and
     *                 occupied, the server falls back to a free port (logged at info).
     * @param bind     bind address, defaults to `0.0.0.0`
     * @param resolver file resolver (defaults to `NoopFileResolver`)
     */
    static async createHTTPServer(
        adapter: AdapterClassDefinition,
        port: number = 0,
        bind: string = '0.0.0.0',
        resolver: HTTPFileResolver = new NoopFileResolver(),
    ): Promise<HTTPServerClass> {
        const instance = new HTTPServerClass(adapter, bind, resolver);
        await instance.start(port);
        return instance;
    }

    constructor(adapter: AdapterClassDefinition, bind: string = '0.0.0.0', resolver?: HTTPFileResolver) {
        super(adapter, 'httpServer');
        this.bind = bind;
        this.resolver = resolver ?? new NoopFileResolver();
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res).catch(err => {
                this.log.error(`HTTP handler error: ${err instanceof Error ? err.message : String(err)}`);
                if (!res.headersSent) {
                    res.statusCode = 500;
                    res.end();
                } else {
                    res.end();
                }
            });
        });
        this.server.on('error', err => {
            this.ready = false;
            this.log.error(`HTTP server socket error: ${String(err)}`);
        });
    }

    setFileResolver(resolver: HTTPFileResolver): void {
        this.resolver = resolver;
    }

    getPort(): number {
        return this.actualPort;
    }

    getBind(): string {
        return this.bind;
    }

    /**
     * Start the server. If the requested port is already in use, fall back to
     * a free port (OS-picked). The actually-bound port is logged at info.
     *
     * @param port preferred port, 0 = OS-picked
     */
    async start(port: number): Promise<void> {
        const server = this.server;
        if (!server) {
            throw new Error('HTTP server already destroyed');
        }
        const tryListen = (p: number): Promise<void> =>
            new Promise<void>((resolve, reject) => {
                const onError = (err: NodeJS.ErrnoException): void => {
                    server.removeListener('listening', onListening);
                    reject(err);
                };
                const onListening = (): void => {
                    server.removeListener('error', onError);
                    resolve();
                };
                server.once('error', onError);
                server.once('listening', onListening);
                server.listen(p, this.bind);
            });

        try {
            await tryListen(port);
        } catch (err: unknown) {
            const e = err as NodeJS.ErrnoException;
            if (e && e.code === 'EADDRINUSE' && port !== 0) {
                this.log.warn(`HTTP port ${port} in use — falling back to a free port.`);
                await tryListen(0);
            } else {
                throw err;
            }
        }

        const addr = server.address();
        if (addr && typeof addr === 'object') {
            this.actualPort = addr.port;
        } else {
            this.actualPort = port;
        }
        this.ready = true;
        this.log.info(`HTTP server listening on http://${this.bind}:${this.actualPort}`);
    }

    /**
     * Stop the server. Idempotent.
     */
    destroy(): void {
        void this.delete();
        if (this.server) {
            try {
                this.server.close();
            } catch {
                // ignore
            }
            this.server = undefined;
        }
        this.ready = false;
    }

    private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        const method = (req.method ?? 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'HEAD') {
            res.statusCode = 405;
            res.setHeader('Allow', 'GET, HEAD');
            res.end();
            return;
        }
        // req.url is always a path+query for HTTP/1.1 requests served by Node.
        const rawUrl = req.url ?? '/';
        const qIdx = rawUrl.indexOf('?');
        const urlPath = qIdx === -1 ? rawUrl : rawUrl.slice(0, qIdx);

        // Lightweight directory listing for diagnostics.
        if (urlPath === '/tft/list' || urlPath === '/list') {
            const list = this.resolver.list ? await this.resolver.list() : [];
            const body = JSON.stringify({ files: list });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.setHeader('Content-Length', Buffer.byteLength(body));
            if (method === 'HEAD') {
                res.end();
            } else {
                res.end(body);
            }
            return;
        }

        const file = await this.resolver.resolve(urlPath);
        if (!file) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            const body = `Not Found: ${urlPath}`;
            res.setHeader('Content-Length', Buffer.byteLength(body));
            if (method === 'HEAD') {
                res.end();
            } else {
                res.end(body);
            }
            return;
        }

        const parsed = parseRangeHeader(req.headers['range']);
        // Common headers
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', file.contentType);

        if (!parsed) {
            res.statusCode = 200;
            res.setHeader('Content-Length', file.size);
            if (method === 'HEAD') {
                res.end();
                return;
            }
            const stream = fs.createReadStream(file.absPath);
            stream.on('error', err => {
                this.log.error(`Stream error for ${file.absPath}: ${err.message}`);
                res.end();
            });
            stream.pipe(res);
            return;
        }

        const resolved = resolveRange(parsed, file.size);
        if (!resolved) {
            res.statusCode = 416;
            res.setHeader('Content-Range', `bytes */${file.size}`);
            res.end();
            return;
        }

        res.statusCode = 206;
        res.setHeader('Content-Range', `bytes ${resolved.start}-${resolved.end}/${file.size}`);
        res.setHeader('Content-Length', resolved.length);
        if (method === 'HEAD') {
            res.end();
            return;
        }
        const stream = fs.createReadStream(file.absPath, { start: resolved.start, end: resolved.end });
        stream.on('error', err => {
            this.log.error(`Stream error for ${file.absPath}: ${err.message}`);
            res.end();
        });
        stream.pipe(res);
    }
}

/**
 * Default storage path for cached TFT firmware files: a subdirectory of the OS
 * temp directory. Used by the internal HTTP server.
 */
export function defaultTftStorageDir(): string {
    return path.join(os.tmpdir(), 'iobroker-nspanel-tft');
}
