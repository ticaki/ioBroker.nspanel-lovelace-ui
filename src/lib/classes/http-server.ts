import * as http from 'node:http';
import * as fs from 'node:fs';
import { stat } from 'node:fs/promises';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';

/**
 * Resolver that maps an incoming HTTP request path (e.g. `/tft/nspanel-eu-v4.6.0.tft`)
 * to a concrete file on disk plus its Content-Type.
 *
 * Phase 1 ships only the noop resolver (always 404). Phase 2 will provide a real
 * resolver backed by the ioBroker file service or a local directory.
 */
export interface HTTPFileResolver {
    resolve(reqPath: string): Promise<{ filePath: string; contentType: string } | null>;
}

/**
 * Default resolver: refuses every request with 404. Used until the storage layer
 * (file source, upload location) is decided.
 */
export class NoopFileResolver implements HTTPFileResolver {
    resolve(_reqPath: string): Promise<{ filePath: string; contentType: string } | null> {
        return Promise.resolve(null);
    }
}

/**
 * Parsed HTTP `Range` header. `bytes=START-END` (END inclusive) or `bytes=-SUFFIX`.
 * `null` end means "until EOF" (e.g. `bytes=100-`).
 */
type ParsedRange = { start: number; end: number | null; suffix: false } | { suffix: true; length: number };

/**
 * Parse a `Range` request header. Supports the single-range forms required by
 * Tasmota Berry `FlashNextionAdv0` (resume via `bytes=<offset>-`).
 *
 * Multi-range (`bytes=0-50,100-150`) is intentionally not supported — the Nextion
 * flasher never emits it, and 206 multipart/byteranges replies would need extra
 * boundary handling without any benefit here.
 *
 * @param header Raw `Range` header value, or undefined.
 * @returns Parsed range, or null if the header is missing/invalid (caller should
 *          fall back to a plain 200 response in that case).
 */
export function parseRangeHeader(header: string | undefined): ParsedRange | null {
    if (!header) {
        return null;
    }
    const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
    if (!match) {
        return null;
    }
    const startStr = match[1];
    const endStr = match[2];

    if (startStr === '' && endStr === '') {
        return null;
    }
    if (startStr === '') {
        const length = parseInt(endStr, 10);
        if (!Number.isFinite(length) || length <= 0) {
            return null;
        }
        return { suffix: true, length };
    }
    const start = parseInt(startStr, 10);
    if (!Number.isFinite(start) || start < 0) {
        return null;
    }
    if (endStr === '') {
        return { start, end: null, suffix: false };
    }
    const end = parseInt(endStr, 10);
    if (!Number.isFinite(end) || end < start) {
        return null;
    }
    return { start, end, suffix: false };
}

/**
 * Resolve a parsed range against the actual file size into concrete byte offsets
 * `[start, end]` (both inclusive, as required by RFC 7233 `Content-Range`).
 *
 * Returns `null` when the range is unsatisfiable — the caller must then respond
 * with `416 Range Not Satisfiable` and `Content-Range: bytes */<size>`.
 */
export function resolveRange(parsed: ParsedRange, size: number): { start: number; end: number } | null {
    if (size <= 0) {
        return null;
    }
    if (parsed.suffix) {
        const start = Math.max(0, size - parsed.length);
        return { start, end: size - 1 };
    }
    if (parsed.start >= size) {
        return null;
    }
    const end = parsed.end === null ? size - 1 : Math.min(parsed.end, size - 1);
    return { start: parsed.start, end };
}

/**
 * Internal HTTP server used to serve TFT firmware (and later other static assets)
 * to the NSPanel during a Tasmota `FlashNextionAdv` cycle.
 *
 * **Critical:** Tasmota Berry resumes the flash via Range requests (`Range: bytes=<offset>-`)
 * after each Nextion checkpoint. Without 206 Partial Content support the flash
 * stalls at a fixed percentage. This server therefore always advertises
 * `Accept-Ranges: bytes` and answers Range requests with 206 + `Content-Range`.
 *
 * Phase 1 (this commit) only sets up the server and the Range-handling pipeline;
 * the actual file source is still a noop resolver. Phase 2 plugs in the real
 * file store and the AdminUI toggle.
 */
export class HTTPServerClass extends BaseClass {
    private server: http.Server;
    private host: string;
    private port: number;
    private fileResolver: HTTPFileResolver;
    ready: boolean = false;

    /**
     * Factory: create and start the server in one step, mirroring
     * `MQTTServerClass.createMQTTServer` so wiring in `main.ts` stays uniform.
     */
    static async createHTTPServer(
        adapter: AdapterClassDefinition,
        host: string,
        port: number,
        fileResolver: HTTPFileResolver = new NoopFileResolver(),
    ): Promise<HTTPServerClass> {
        const instance = new HTTPServerClass(adapter, host, port, fileResolver);
        await instance.start();
        return instance;
    }

    constructor(adapter: AdapterClassDefinition, host: string, port: number, fileResolver: HTTPFileResolver) {
        super(adapter, 'httpServer');
        this.host = host;
        this.port = port;
        this.fileResolver = fileResolver;
        this.server = http.createServer((req, res) => {
            void this.handleRequest(req, res);
        });
        this.server.on('error', err => {
            this.ready = false;
            this.log.error(`HTTP server error on ${this.host}:${this.port}: ${String(err)}`);
        });
    }

    /**
     * Bind and start listening. Resolves once `listen()` succeeds, rejects on
     * bind errors (e.g. `EADDRINUSE`) so callers can surface a clear message.
     */
    async start(): Promise<void> {
        await new Promise<void>((resolve, reject) => {
            const onError = (err: Error): void => {
                this.server.removeListener('error', onError);
                reject(err);
            };
            this.server.once('error', onError);
            this.server.listen(this.port, this.host, () => {
                this.server.removeListener('error', onError);
                this.ready = true;
                this.log.info(`HTTP server listening on http://${this.host}:${this.port}`);
                resolve();
            });
        });
    }

    /**
     * Stop accepting new connections and tear down. Existing transfers keep
     * running until they complete (Node's default `close()` semantics) so an
     * in-flight TFT flash isn't aborted on a graceful adapter shutdown.
     */
    destroy(): void {
        void this.delete();
        this.ready = false;
        try {
            this.server.close();
        } catch (err) {
            this.log.warn(`Error while closing HTTP server: ${String(err)}`);
        }
    }

    /**
     * Replace the file resolver at runtime. Lets Phase 2 swap in the real store
     * (or AdminUI uploads) without restarting the listener.
     */
    setFileResolver(resolver: HTTPFileResolver): void {
        this.fileResolver = resolver;
    }

    /**
     * Top-level request dispatcher. Currently routes any GET/HEAD through the
     * file resolver; everything else is rejected with 405. Kept small on purpose
     * — upload, listing and delete endpoints land in Phase 2.
     */
    async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
        try {
            const method = (req.method || 'GET').toUpperCase();
            if (method !== 'GET' && method !== 'HEAD') {
                res.writeHead(405, { Allow: 'GET, HEAD' });
                res.end();
                return;
            }
            // Strip query string; we do not use it yet. URL parsing keeps `..` traversal
            // attempts contained — the resolver is still responsible for path safety.
            const reqPath = decodeURIComponent((req.url || '/').split('?', 1)[0]);
            const resolved = await this.fileResolver.resolve(reqPath);
            if (!resolved) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('Not Found');
                return;
            }
            await this.serveFileWithRange(req, res, resolved.filePath, resolved.contentType);
        } catch (err) {
            this.log.error(`HTTP request handler failed: ${err instanceof Error ? err.message : String(err)}`);
            if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            }
            res.end();
        }
    }

    /**
     * Serve a file with full Range support. The core of Phase 1 — Tasmota's
     * `FlashNextionAdv0` depends on this exact behavior:
     *  - `Accept-Ranges: bytes` on every response (so the client knows to retry with Range).
     *  - 206 + `Content-Range: bytes start-end/size` for any valid Range request.
     *  - 416 + `Content-Range: bytes *‍/size` when the requested range is outside the file.
     *  - HEAD returns identical headers without a body (used by some clients to probe size).
     *  - Streamed via `fs.createReadStream({ start, end })` so multi-MB TFT files never
     *    sit in RAM.
     */
    async serveFileWithRange(
        req: http.IncomingMessage,
        res: http.ServerResponse,
        filePath: string,
        contentType: string,
    ): Promise<void> {
        let stats;
        try {
            stats = await stat(filePath);
        } catch {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }
        if (!stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
            return;
        }
        const size = stats.size;
        const isHead = (req.method || 'GET').toUpperCase() === 'HEAD';
        const parsed = parseRangeHeader(req.headers.range);

        if (parsed) {
            const range = resolveRange(parsed, size);
            if (!range) {
                res.writeHead(416, {
                    'Content-Range': `bytes */${size}`,
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Accept-Ranges': 'bytes',
                });
                res.end();
                return;
            }
            const chunkSize = range.end - range.start + 1;
            res.writeHead(206, {
                'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(chunkSize),
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
            });
            if (isHead) {
                res.end();
                return;
            }
            await this.streamFile(filePath, range.start, range.end, res);
            return;
        }

        res.writeHead(200, {
            'Accept-Ranges': 'bytes',
            'Content-Length': String(size),
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
        });
        if (isHead) {
            res.end();
            return;
        }
        await this.streamFile(filePath, 0, size - 1, res);
    }

    private streamFile(filePath: string, start: number, end: number, res: http.ServerResponse): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const stream = fs.createReadStream(filePath, { start, end });
            stream.on('error', err => {
                this.log.error(`File stream error for ${filePath}: ${String(err)}`);
                if (!res.headersSent) {
                    res.writeHead(500);
                }
                res.end();
                reject(err);
            });
            stream.on('end', () => resolve());
            res.on('close', () => {
                stream.destroy();
            });
            stream.pipe(res);
        });
    }
}
