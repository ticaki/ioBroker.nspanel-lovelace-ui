import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';

/** Largest TFT file the adapter accepts (the display flash of the NSPanel has 16 MB) */
export const TFT_MAX_SIZE = 16 * 1024 * 1024;
/** Largest chunk of an upload (raw bytes, base64 in the message) */
export const TFT_MAX_CHUNK_SIZE = 1024 * 1024;
/** The server stops when no request was running for this time */
export const TFT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;
/** The server stops after this time at the latest, even during a download */
export const TFT_MAX_SERVE_MS = 45 * 60 * 1000;

/** Error keys of the upload - translated in the admin */
export type TftUploadError =
    | 'customTftWrongExtension'
    | 'customTftTooLarge'
    | 'customTftEmpty'
    | 'customTftUploadBroken';

/** Error keys of the upload and the start - translated in the admin */
export type TftServerError = TftUploadError | 'customTftServerError';

/** What the server needs from the adapter */
export type TftServerHost = Pick<ioBroker.Adapter, 'log' | 'setTimeout' | 'clearTimeout' | 'namespace'>;

/** Name of the file while the upload runs */
const PARTIAL_NAME = 'upload.part';

/**
 * Upload directory of an adapter instance (in the temp directory of the system).
 *
 * @param namespace namespace of the instance, e.g. `nspanel-lovelace-ui.0`
 * @returns the directory
 */
export function tftUploadDir(namespace: string): string {
    return path.join(os.tmpdir(), `${namespace.replace(/[^A-Za-z0-9._-]/g, '_')}-custom-tft`);
}

/** One chunk of an upload from the admin (`customTftUpload`) */
export interface TftChunkMessage {
    /** random id of the upload, chosen by the admin */
    uploadId: string;
    fileName: string;
    /** size of the whole file */
    size: number;
    /** position of this chunk in the file */
    offset: number;
    /** content of the chunk, base64 */
    data: string;
}

/** Start of the flash (`customTftStart`) */
export interface TftStartMessage {
    uploadId: string;
    /** '*' = all panels, otherwise the topic of one panel */
    target: string;
    /** IP of the ioBroker as entered in the admin (may be unsaved) */
    internalServerIp?: string;
}

/**
 * Reads a chunk message of the admin.
 *
 * @param value `obj.message`
 * @returns the message or undefined if a field is missing or has the wrong type
 */
export function parseTftChunkMessage(value: unknown): TftChunkMessage | undefined {
    if (typeof value !== 'object' || value === null) {
        return undefined;
    }
    if (!('uploadId' in value) || !('fileName' in value) || !('size' in value) || !('offset' in value)) {
        return undefined;
    }
    if (!('data' in value)) {
        return undefined;
    }
    const { uploadId, fileName, size, offset, data } = value;
    if (typeof uploadId !== 'string' || !uploadId || typeof fileName !== 'string' || typeof data !== 'string') {
        return undefined;
    }
    if (typeof size !== 'number' || !Number.isInteger(size) || typeof offset !== 'number') {
        return undefined;
    }
    if (!Number.isInteger(offset) || offset < 0) {
        return undefined;
    }
    return { uploadId, fileName, size, offset, data };
}

/**
 * Reads the start message of the admin.
 *
 * @param value `obj.message`
 * @returns the message or undefined if a field is missing
 */
export function parseTftStartMessage(value: unknown): TftStartMessage | undefined {
    if (typeof value !== 'object' || value === null || !('uploadId' in value) || !('target' in value)) {
        return undefined;
    }
    const { uploadId, target } = value;
    if (typeof uploadId !== 'string' || !uploadId || typeof target !== 'string' || !target) {
        return undefined;
    }
    const ip = 'internalServerIp' in value ? value.internalServerIp : undefined;
    return { uploadId, target, internalServerIp: typeof ip === 'string' ? ip : undefined };
}

/**
 * IPv4 address the panels can reach the adapter on - not empty, not loopback.
 *
 * @param ip candidate
 * @returns true if usable in the flash URL
 */
export function isUsableServerIp(ip: string | undefined): ip is string {
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return false;
    }
    const parts = ip.split('.').map(Number);
    return parts.every(n => n <= 255) && parts[0] !== 127 && parts[0] !== 0;
}

/**
 * File name that can be used in a Tasmota command and as URL path (no blanks, no `;`, no `:`).
 *
 * @param fileName name of the uploaded file
 * @returns the cleaned name, always ending with `.tft`
 */
export function safeTftName(fileName: string): string {
    const base = path.basename(fileName).replace(/\.tft$/i, '');
    const clean = base.replace(/[^A-Za-z0-9._-]/g, '_').replace(/^\.+/, '');
    return `${clean || 'custom'}.tft`;
}

/**
 * Parses a `Range` header of the form `bytes=<start>-[<end>]` (one range only).
 *
 * @param header value of the header, undefined = no range
 * @param size size of the file
 * @returns undefined without a range, null if the range is not satisfiable, else start and end (inclusive)
 */
export function parseRange(
    header: string | undefined,
    size: number,
): { start: number; end: number } | null | undefined {
    if (header === undefined) {
        return undefined;
    }
    const match = /^\s*bytes\s*=\s*(\d+)\s*-\s*(\d*)\s*$/i.exec(header);
    if (!match) {
        return null;
    }
    const start = Number(match[1]);
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start >= size || end < start) {
        return null;
    }
    return { start, end };
}

/**
 * Receives a custom TFT from the admin and hands it out to the panels (`FlashNextionAdv0 <url>`).
 *
 * Upload: the chunks are written to the upload directory of the instance ({@link tftUploadDir}).
 * A new upload stops a running server and removes all TFT files of earlier uploads from that
 * directory - only `*.tft` and the partial file, nothing else and nowhere else.
 *
 * Server: listens on a free port and answers only `GET /<file>`, with `Range` support (the berry
 * driver asks for `Range: bytes=<pos>-` and resumes at later positions, so one flash makes several
 * requests). Stops {@link TFT_IDLE_TIMEOUT_MS} after the last request ended or after
 * {@link TFT_MAX_SERVE_MS} at the latest; the file is removed on stop.
 */
export class TftServer {
    private server: http.Server | undefined;
    private idleTimer: ioBroker.Timeout | undefined;
    private maxTimer: ioBroker.Timeout | undefined;
    private activeRequests = 0;
    private idleTimeoutMs = TFT_IDLE_TIMEOUT_MS;
    private upload: { uploadId: string; fileName: string; size: number; received: number } | undefined;
    /** file that is served, removed on stop */
    private servedFile: string | undefined;
    readonly dir: string;

    constructor(private readonly host: TftServerHost) {
        this.dir = tftUploadDir(host.namespace);
    }

    /** true while a file is served */
    get running(): boolean {
        return this.server !== undefined;
    }

    /**
     * Adds a chunk of an upload. The chunks must arrive in order, starting at offset 0; offset 0
     * starts a new upload.
     *
     * @param chunk chunk from the admin
     * @returns the error key or undefined
     */
    async addChunk(chunk: TftChunkMessage): Promise<TftUploadError | undefined> {
        if (chunk.offset === 0) {
            this.upload = undefined;
            if (!chunk.fileName.toLowerCase().endsWith('.tft')) {
                return 'customTftWrongExtension';
            }
            if (chunk.size > TFT_MAX_SIZE) {
                return 'customTftTooLarge';
            }
            if (chunk.size <= 0) {
                return 'customTftEmpty';
            }
            // a new upload replaces everything before - also a running server of an older file
            await this.stop();
            await this.removeUploads();
            await fs.promises.mkdir(this.dir, { recursive: true });
            await fs.promises.writeFile(path.join(this.dir, PARTIAL_NAME), Buffer.alloc(0));
            this.upload = { uploadId: chunk.uploadId, fileName: chunk.fileName, size: chunk.size, received: 0 };
        }
        const upload = this.upload;
        if (
            !upload ||
            upload.uploadId !== chunk.uploadId ||
            upload.size !== chunk.size ||
            upload.received !== chunk.offset
        ) {
            await this.dropUpload();
            return 'customTftUploadBroken';
        }
        const bytes = Buffer.from(chunk.data, 'base64');
        if (bytes.length === 0 || bytes.length > TFT_MAX_CHUNK_SIZE || chunk.offset + bytes.length > chunk.size) {
            await this.dropUpload();
            return 'customTftUploadBroken';
        }
        try {
            await fs.promises.appendFile(path.join(this.dir, PARTIAL_NAME), bytes);
        } catch (e) {
            this.host.log.warn(`Custom TFT: chunk could not be written: ${String(e)}`);
            await this.dropUpload();
            return 'customTftUploadBroken';
        }
        upload.received += bytes.length;
        return undefined;
    }

    /**
     * Serves a complete upload.
     *
     * @param uploadId id of the upload
     * @param idleTimeoutMs stop after this time without a running request
     * @param maxServeMs stop after this time at the latest
     * @returns port and URL path of the file, or the error key
     */
    async serve(
        uploadId: string,
        idleTimeoutMs: number = TFT_IDLE_TIMEOUT_MS,
        maxServeMs: number = TFT_MAX_SERVE_MS,
    ): Promise<{ port: number; urlPath: string } | { error: TftServerError }> {
        const upload = this.upload;
        if (!upload || upload.uploadId !== uploadId || upload.received !== upload.size) {
            return { error: 'customTftUploadBroken' };
        }
        this.upload = undefined;
        await this.stopServer();
        const name = safeTftName(upload.fileName);
        const urlPath = `/${name}`;
        const filePath = path.join(this.dir, name);
        try {
            await fs.promises.rename(path.join(this.dir, PARTIAL_NAME), filePath);
        } catch (e) {
            this.host.log.warn(`Custom TFT: upload could not be stored: ${String(e)}`);
            await this.removeUploads();
            return { error: 'customTftUploadBroken' };
        }
        this.servedFile = filePath;
        const size = upload.size;
        this.activeRequests = 0;
        this.idleTimeoutMs = idleTimeoutMs;

        const server = http.createServer((req, res) => {
            this.onRequest(server, req, res, urlPath, filePath, size);
        });
        server.on('error', (e: Error) => {
            this.host.log.warn(`TFT server error: ${e.message}`);
        });
        try {
            await new Promise<void>((resolve, reject) => {
                server.once('error', reject);
                server.listen(0, () => {
                    server.off('error', reject);
                    resolve();
                });
            });
        } catch (e) {
            this.host.log.error(`Custom TFT: server could not listen: ${String(e)}`);
            await this.stop();
            return { error: 'customTftServerError' };
        }
        this.server = server;
        const address = server.address();
        const port = address !== null && typeof address === 'object' ? address.port : 0;
        this.maxTimer = this.host.setTimeout(() => {
            this.maxTimer = undefined;
            this.host.log.info(`TFT server for ${name} stopped after the maximum serve time`);
            void this.stop();
        }, maxServeMs);
        this.armIdleTimer();
        this.host.log.info(`TFT server for ${name} (${size} bytes) listens on port ${port}`);
        return { port, urlPath };
    }

    /** Stops the server and removes the served file. A running upload is kept. */
    async stop(): Promise<void> {
        await this.stopServer();
        const file = this.servedFile;
        this.servedFile = undefined;
        if (file) {
            await this.removeFile(file);
        }
    }

    /** Stops everything and removes all files of the upload directory (adapter unload). */
    async delete(): Promise<void> {
        this.upload = undefined;
        await this.stop();
        await this.removeUploads();
    }

    private async stopServer(): Promise<void> {
        this.clearIdleTimer();
        if (this.maxTimer) {
            this.host.clearTimeout(this.maxTimer);
            this.maxTimer = undefined;
        }
        const server = this.server;
        this.server = undefined;
        if (server) {
            await new Promise<void>(resolve => {
                server.close(() => resolve());
                server.closeAllConnections();
            });
            this.host.log.debug('TFT server stopped');
        }
    }

    private async dropUpload(): Promise<void> {
        this.upload = undefined;
        await this.removeFile(path.join(this.dir, PARTIAL_NAME));
    }

    /** Removes the TFT files and the partial file of earlier uploads - only in {@link dir}. */
    private async removeUploads(): Promise<void> {
        let names: string[];
        try {
            names = await fs.promises.readdir(this.dir);
        } catch {
            return;
        }
        for (const name of names) {
            if (name === PARTIAL_NAME || name.toLowerCase().endsWith('.tft')) {
                await this.removeFile(path.join(this.dir, name));
            }
        }
    }

    private async removeFile(file: string): Promise<void> {
        try {
            await fs.promises.rm(file, { force: true });
        } catch (e) {
            this.host.log.warn(`Custom TFT: ${file} could not be removed: ${String(e)}`);
        }
    }

    private onRequest(
        server: http.Server,
        req: http.IncomingMessage,
        res: http.ServerResponse,
        urlPath: string,
        filePath: string,
        size: number,
    ): void {
        if (req.method !== 'GET' || req.url !== urlPath) {
            res.writeHead(404, { Connection: 'close' }).end();
            return;
        }
        const client = req.socket.remoteAddress ?? '';
        const rangeHeader = req.headers.range;
        const range = parseRange(rangeHeader, size);
        if (range === null) {
            this.host.log.debug(`TFT request from ${client} with unsatisfiable range ${rangeHeader}`);
            res.writeHead(416, { 'Content-Range': `bytes */${size}`, Connection: 'close' }).end();
            return;
        }
        const start = range ? range.start : 0;
        const end = range ? range.end : size - 1;
        this.host.log.debug(`TFT ${urlPath} requested by ${client}, bytes ${start}-${end}`);

        this.activeRequests++;
        this.clearIdleTimer();
        let done = false;
        const finished = (): void => {
            if (done) {
                return;
            }
            done = true;
            this.activeRequests--;
            if (this.server === server && this.activeRequests <= 0) {
                this.activeRequests = 0;
                this.armIdleTimer();
            }
        };
        res.on('close', finished);

        const headers: http.OutgoingHttpHeaders = {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(end - start + 1),
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'no-store',
            Connection: 'close',
        };
        if (range) {
            headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
        }
        res.writeHead(range ? 206 : 200, headers);
        const stream = fs.createReadStream(filePath, { start, end });
        stream.on('error', (e: Error) => {
            this.host.log.warn(`TFT file could not be read: ${e.message}`);
            res.destroy();
        });
        stream.pipe(res);
    }

    private armIdleTimer(): void {
        this.clearIdleTimer();
        this.idleTimer = this.host.setTimeout(() => {
            this.idleTimer = undefined;
            if (this.activeRequests > 0) {
                return;
            }
            this.host.log.info('TFT server stopped - no more requests');
            void this.stop();
        }, this.idleTimeoutMs);
    }

    private clearIdleTimer(): void {
        if (this.idleTimer) {
            this.host.clearTimeout(this.idleTimer);
            this.idleTimer = undefined;
        }
    }
}
