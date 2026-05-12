import * as http from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { Buffer } from 'node:buffer';
import { BaseClass, type AdapterClassDefinition } from '../controller/library';

export interface ResolvedFile {
    absolutePath: string;
    size: number;
}

export interface HTTPFileResolver {
    resolve(file: string): Promise<ResolvedFile | null>;
    ensureCached?(file: string): Promise<ResolvedFile | null>;
}

export class NoopFileResolver implements HTTPFileResolver {
    async resolve(_file: string): Promise<ResolvedFile | null> {
        return null;
    }
}

const TFT_FILENAME_RE = /^[A-Za-z0-9._-]+\.tft$/;
const MODEL_FROM_FILENAME_RE = /^(nspanel(?:-[a-z]+)*?)-v\d/;
const DEFAULT_KEEP_PER_MODEL = 2;
const DOWNLOAD_TIMEOUT_MS = 30_000;

export function defaultTftStorageDir(): string {
    return path.join(os.tmpdir(), 'iobroker-nspanel-tft');
}

export function extractModelFromFilename(filename: string): string | null {
    const m = MODEL_FROM_FILENAME_RE.exec(filename);
    return m ? m[1] : null;
}

export interface ResolverLogger {
    debug: (msg: string) => void;
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
}

export class ProxyCacheResolver implements HTTPFileResolver {
    cacheDir: string;
    upstreamBase: string;
    keepPerModel: number;
    private locks = new Map<string, Promise<void>>();
    private log: ResolverLogger;

    constructor(cacheDir: string, upstreamBase: string, log: ResolverLogger, keepPerModel: number = DEFAULT_KEEP_PER_MODEL) {
        this.cacheDir = cacheDir;
        this.upstreamBase = upstreamBase.replace(/\/+$/, '');
        this.log = log;
        this.keepPerModel = Math.max(1, keepPerModel);
    }

    async resolve(file: string): Promise<ResolvedFile | null> {
        if (!TFT_FILENAME_RE.test(file)) {
            return null;
        }
        const target = path.join(this.cacheDir, file);
        try {
            const st = await fsp.stat(target);
            return st.isFile() ? { absolutePath: target, size: st.size } : null;
        } catch {
            return null;
        }
    }

    async ensureCached(file: string): Promise<ResolvedFile | null> {
        if (!TFT_FILENAME_RE.test(file)) {
            this.log.warn(`Rejected non-.tft filename: ${file}`);
            return null;
        }
        const existing = await this.resolve(file);
        if (existing) {
            return existing;
        }
        const inflight = this.locks.get(file);
        if (inflight) {
            await inflight;
            return this.resolve(file);
        }
        const lock = (async (): Promise<void> => {
            try {
                await this.downloadWithRetry(file);
            } finally {
                this.locks.delete(file);
            }
        })();
        this.locks.set(file, lock);
        try {
            await lock;
        } catch (e) {
            this.log.error(
                `Failed to fetch TFT "${file}" from upstream: ${e instanceof Error ? e.message : String(e)}`,
            );
            return null;
        }
        const result = await this.resolve(file);
        if (result) {
            try {
                await this.enforceLRU(file);
            } catch (e) {
                this.log.warn(`LRU cleanup failed: ${e instanceof Error ? e.message : String(e)}`);
            }
        }
        return result;
    }

    private async downloadWithRetry(file: string): Promise<void> {
        const url = `${this.upstreamBase}/${encodeURIComponent(file)}`;
        let lastErr: unknown;
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                await this.downloadOnce(url, file);
                return;
            } catch (e) {
                lastErr = e;
                const msg = e instanceof Error ? e.message : String(e);
                if (attempt < 2) {
                    this.log.warn(`Upstream download attempt ${attempt} failed for ${file}: ${msg} — retrying once.`);
                } else {
                    this.log.warn(`Upstream download attempt ${attempt} failed for ${file}: ${msg}`);
                }
            }
        }
        throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
    }

    private async downloadOnce(url: string, file: string): Promise<void> {
        await fsp.mkdir(this.cacheDir, { recursive: true });
        const tmp = path.join(this.cacheDir, `${file}.partial`);
        const final = path.join(this.cacheDir, file);
        try {
            await fsp.unlink(tmp);
        } catch {
            /* not present, ignore */
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
        let out: fs.WriteStream | null = null;
        try {
            const resp = await fetch(url, { signal: controller.signal, redirect: 'follow' });
            if (!resp.ok || !resp.body) {
                throw new Error(`HTTP ${resp.status} ${resp.statusText} for ${url}`);
            }
            this.log.info(`Downloading TFT from ${url} (status ${resp.status})`);
            out = fs.createWriteStream(tmp);
            const writeStream = out;
            const reader = (resp.body as ReadableStream<Uint8Array>).getReader();
            try {
                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    if (value && value.byteLength) {
                        if (!writeStream.write(Buffer.from(value))) {
                            await new Promise<void>(resolve => writeStream.once('drain', () => resolve()));
                        }
                    }
                }
            } finally {
                try {
                    reader.releaseLock();
                } catch {
                    /* ignore */
                }
            }
            await new Promise<void>((resolve, reject) => {
                writeStream.end(() => resolve());
                writeStream.once('error', reject);
            });
            out = null;
            await fsp.rename(tmp, final);
            this.log.info(`Cached TFT to ${final}`);
        } catch (e) {
            if (out) {
                try {
                    out.destroy();
                } catch {
                    /* ignore */
                }
            }
            try {
                await fsp.unlink(tmp);
            } catch {
                /* ignore */
            }
            throw e;
        } finally {
            clearTimeout(timer);
        }
    }

    private async enforceLRU(justAdded: string): Promise<void> {
        const model = extractModelFromFilename(justAdded);
        if (!model) {
            return;
        }
        const names = await fsp.readdir(this.cacheDir).catch(() => [] as string[]);
        const candidates: { name: string; mtimeMs: number }[] = [];
        for (const n of names) {
            if (!TFT_FILENAME_RE.test(n) || extractModelFromFilename(n) !== model) {
                continue;
            }
            try {
                const st = await fsp.stat(path.join(this.cacheDir, n));
                candidates.push({ name: n, mtimeMs: st.mtimeMs });
            } catch {
                /* ignore stat errors */
            }
        }
        if (candidates.length <= this.keepPerModel) {
            return;
        }
        candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
        const toDelete = candidates.slice(this.keepPerModel);
        for (const e of toDelete) {
            try {
                await fsp.unlink(path.join(this.cacheDir, e.name));
                this.log.info(`LRU cleanup: removed "${e.name}" (keep ${this.keepPerModel} per model "${model}")`);
            } catch (err) {
                this.log.warn(
                    `LRU cleanup: failed to remove "${e.name}": ${err instanceof Error ? err.message : String(err)}`,
                );
            }
        }
    }
}

export interface ParsedRange {
    start?: number;
    end?: number;
    suffix?: number;
}

export function parseRangeHeader(header: string | undefined | null): ParsedRange | null {
    if (!header) {
        return null;
    }
    const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
    if (!m) {
        return null;
    }
    const startStr = m[1];
    const endStr = m[2];
    if (startStr === '' && endStr === '') {
        return null;
    }
    if (startStr === '') {
        const suffix = Number(endStr);
        return Number.isFinite(suffix) ? { suffix } : null;
    }
    const start = Number(startStr);
    if (!Number.isFinite(start)) {
        return null;
    }
    if (endStr === '') {
        return { start };
    }
    const end = Number(endStr);
    if (!Number.isFinite(end)) {
        return null;
    }
    return { start, end };
}

export interface ResolvedRange {
    start: number;
    end: number;
    length: number;
    full: boolean;
}

export function resolveRange(range: ParsedRange | null, size: number): ResolvedRange | null {
    if (size <= 0) {
        return null;
    }
    if (!range) {
        return { start: 0, end: size - 1, length: size, full: true };
    }
    let start: number;
    let end = size - 1;
    if (range.suffix !== undefined) {
        if (range.suffix <= 0) {
            return null;
        }
        start = Math.max(0, size - range.suffix);
    } else {
        if (range.start === undefined) {
            return null;
        }
        start = range.start;
        if (range.end !== undefined) {
            end = Math.min(range.end, size - 1);
        }
    }
    if (start < 0 || start >= size || start > end) {
        return null;
    }
    return { start, end, length: end - start + 1, full: false };
}

export class HTTPServerClass extends BaseClass {
    server: Server;
    port: number = 0;
    bindAddress: string;
    resolver: HTTPFileResolver;
    ready: boolean = false;

    static async createHTTPServer(
        adapter: AdapterClassDefinition,
        port: number,
        bindAddress: string,
        resolver: HTTPFileResolver,
    ): Promise<HTTPServerClass> {
        const instance = new HTTPServerClass(adapter, bindAddress, resolver);
        await instance.start(port);
        return instance;
    }

    constructor(adapter: AdapterClassDefinition, bindAddress: string, resolver: HTTPFileResolver) {
        super(adapter, 'httpServer');
        this.bindAddress = bindAddress;
        this.resolver = resolver;
        this.server = http.createServer((req, res) => {
            void this.handleRequest(req, res);
        });
        this.server.on('error', err => {
            this.ready = false;
            this.log.error(`HTTP server error: ${String(err)}`);
        });
    }

    setFileResolver(resolver: HTTPFileResolver): void {
        this.resolver = resolver;
    }

    async ensureCached(file: string): Promise<ResolvedFile | null> {
        if (typeof this.resolver.ensureCached === 'function') {
            return this.resolver.ensureCached(file);
        }
        return this.resolver.resolve(file);
    }

    private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
        try {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                res.statusCode = 405;
                res.setHeader('Allow', 'GET, HEAD');
                res.end();
                return;
            }
            let urlPath: string;
            try {
                urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
            } catch {
                res.statusCode = 400;
                res.end();
                return;
            }
            const filename = path.basename(urlPath);
            if (!filename || filename === '/' || filename === '.' || filename === '..') {
                res.statusCode = 404;
                res.end();
                return;
            }
            const file = await this.resolver.resolve(filename);
            if (!file) {
                res.statusCode = 404;
                res.end();
                return;
            }
            const range = parseRangeHeader(req.headers['range']);
            const resolved = resolveRange(range, file.size);
            res.setHeader('Accept-Ranges', 'bytes');
            res.setHeader('Content-Type', 'application/octet-stream');
            if (range && !resolved) {
                res.statusCode = 416;
                res.setHeader('Content-Range', `bytes */${file.size}`);
                res.end();
                return;
            }
            if (!resolved) {
                res.statusCode = 404;
                res.end();
                return;
            }
            if (range) {
                res.statusCode = 206;
                res.setHeader('Content-Range', `bytes ${resolved.start}-${resolved.end}/${file.size}`);
            } else {
                res.statusCode = 200;
            }
            res.setHeader('Content-Length', String(resolved.length));
            if (req.method === 'HEAD') {
                res.end();
                return;
            }
            const stream = fs.createReadStream(file.absolutePath, { start: resolved.start, end: resolved.end });
            stream.on('error', err => {
                this.log.error(`Stream error for "${filename}": ${err.message}`);
                if (!res.headersSent) {
                    res.statusCode = 500;
                }
                res.end();
            });
            stream.pipe(res);
        } catch (e) {
            this.log.error(`Unhandled request error: ${e instanceof Error ? e.message : String(e)}`);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.end();
            }
        }
    }

    async start(requestedPort: number): Promise<void> {
        const tryListen = (p: number): Promise<void> =>
            new Promise<void>((resolve, reject) => {
                const onError = (err: NodeJS.ErrnoException): void => {
                    this.server.removeListener('error', onError);
                    reject(err);
                };
                this.server.once('error', onError);
                this.server.listen(p, this.bindAddress, () => {
                    this.server.removeListener('error', onError);
                    resolve();
                });
            });
        try {
            await tryListen(requestedPort);
        } catch (err: any) {
            if (requestedPort !== 0 && err && err.code === 'EADDRINUSE') {
                this.log.warn(`Port ${requestedPort} is in use, picking a free port instead.`);
                await tryListen(0);
            } else {
                throw err;
            }
        }
        const addr = this.server.address();
        if (addr && typeof addr === 'object') {
            this.port = addr.port;
        }
        this.ready = true;
        this.log.info(`HTTP server listening on http://${this.bindAddress}:${this.port}`);
    }

    destroy(): void {
        void this.delete();
        if (this.ready) {
            try {
                this.server.close();
            } catch (e) {
                this.log.warn(`Error closing HTTP server: ${e instanceof Error ? e.message : String(e)}`);
            }
            this.ready = false;
        }
    }
}
