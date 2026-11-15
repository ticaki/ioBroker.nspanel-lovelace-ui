import { expect } from 'chai';
import * as fs from 'node:fs';
import * as http from 'node:http';
import * as net from 'node:net';
import * as path from 'node:path';
import {
    TFT_MAX_CHUNK_SIZE,
    TFT_MAX_SIZE,
    TftServer,
    type TftServerHost,
    isUsableServerIp,
    parseRange,
    parseTftChunkMessage,
    parseTftStartMessage,
    safeTftName,
} from './tft-server';

let hostCounter = 0;

function fakeHost(): TftServerHost {
    const noop = (): void => {};
    hostCounter++;
    return {
        namespace: `nspanel-test-${process.pid}.${hostCounter}`,
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop, level: 'info' },
        setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
        clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
    } as unknown as TftServerHost;
}

type Reply = { status: number; headers: http.IncomingHttpHeaders; body: Buffer };

function request(
    port: number,
    urlPath: string,
    headers: http.OutgoingHttpHeaders = {},
    method = 'GET',
): Promise<Reply> {
    return new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port, path: urlPath, method, headers }, res => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () =>
                resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
            );
        });
        req.on('error', reject);
        req.end();
    });
}

/**
 * The request exactly as the berry driver sends it (HTTP/1.0, Range, HOST) - returns the raw header block.
 *
 * @param port port of the server
 * @param urlPath path of the file
 * @param pos start of the range
 */
function berryRequest(port: number, urlPath: string, pos: number): Promise<{ header: string; body: Buffer }> {
    return new Promise((resolve, reject) => {
        const socket = net.connect(port, '127.0.0.1', () => {
            socket.write(`GET ${urlPath} HTTP/1.0\r\nRange: bytes=${pos}-\r\nHOST: 127.0.0.1:${port}\r\n\r\n`);
        });
        const chunks: Buffer[] = [];
        socket.on('data', (c: Buffer) => chunks.push(c));
        socket.on('end', () => {
            const all = Buffer.concat(chunks);
            const split = all.indexOf('\r\n\r\n');
            resolve({ header: all.subarray(0, split).toString(), body: all.subarray(split + 4) });
        });
        socket.on('error', reject);
    });
}

const wait = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms));

const FILE = Buffer.alloc(300_000);
for (let i = 0; i < FILE.length; i++) {
    FILE[i] = i % 251;
}

describe('tft-server', () => {
    it('safeTftName removes blanks, semicolons and paths', () => {
        expect(safeTftName('my tft; Restart 1.tft')).to.equal('my_tft__Restart_1.tft');
        expect(safeTftName('../../etc/x.TFT')).to.equal('x.tft');
        expect(safeTftName('.tft')).to.equal('custom.tft');
    });

    it('isUsableServerIp', () => {
        expect(isUsableServerIp('192.168.1.10')).to.equal(true);
        expect(isUsableServerIp('127.0.0.1')).to.equal(false);
        expect(isUsableServerIp('')).to.equal(false);
        expect(isUsableServerIp(undefined)).to.equal(false);
        expect(isUsableServerIp('300.1.1.1')).to.equal(false);
        expect(isUsableServerIp('host.local')).to.equal(false);
    });

    it('parses the messages of the admin', () => {
        expect(
            parseTftChunkMessage({ uploadId: 'u', fileName: 'a.tft', size: 3, offset: 0, data: 'AAAA' }),
        ).to.deep.equal({ uploadId: 'u', fileName: 'a.tft', size: 3, offset: 0, data: 'AAAA' });
        expect(parseTftChunkMessage({ uploadId: 'u', fileName: 'a.tft', size: 3, offset: -1, data: '' })).to.equal(
            undefined,
        );
        expect(parseTftChunkMessage(null)).to.equal(undefined);
        expect(parseTftStartMessage({ uploadId: 'u', target: '*', internalServerIp: '10.0.0.1' })).to.deep.equal({
            uploadId: 'u',
            target: '*',
            internalServerIp: '10.0.0.1',
        });
        expect(parseTftStartMessage({ uploadId: 'u', target: '' })).to.equal(undefined);
    });

    it('parseRange', () => {
        expect(parseRange(undefined, 100)).to.equal(undefined);
        expect(parseRange('bytes=0-', 100)).to.deep.equal({ start: 0, end: 99 });
        expect(parseRange('bytes=40-', 100)).to.deep.equal({ start: 40, end: 99 });
        expect(parseRange('bytes=10-19', 100)).to.deep.equal({ start: 10, end: 19 });
        expect(parseRange('bytes=10-500', 100)).to.deep.equal({ start: 10, end: 99 });
        expect(parseRange('bytes=100-', 100)).to.equal(null);
        expect(parseRange('bytes=-10', 100)).to.equal(null);
        expect(parseRange('items=0-', 100)).to.equal(null);
    });

    describe('TftServer', () => {
        let server: TftServer;
        const b64 = (b: Buffer): string => b.toString('base64');

        /**
         * Uploads a file in chunks like the admin does.
         *
         * @param data content
         * @param fileName name
         * @param uploadId id
         */
        async function upload(data: Buffer, fileName = 'a.tft', uploadId = 'x'): Promise<void> {
            const step = 100_000;
            for (let offset = 0; offset < data.length; offset += step) {
                const part = data.subarray(offset, offset + step);
                const error = await server.addChunk({ uploadId, fileName, size: data.length, offset, data: b64(part) });
                expect(error).to.equal(undefined);
            }
        }

        async function serve(uploadId = 'x', idle?: number, max?: number): Promise<{ port: number; urlPath: string }> {
            const result = await server.serve(uploadId, idle, max);
            if ('error' in result) {
                throw new Error(result.error);
            }
            return result;
        }

        beforeEach(() => {
            server = new TftServer(fakeHost());
        });
        afterEach(async () => {
            await server.delete();
            fs.rmSync(server.dir, { recursive: true, force: true });
        });

        it('rejects wrong files and broken uploads', async () => {
            const chunk = { uploadId: 'x', fileName: 'a.tft', size: 4, offset: 0, data: b64(Buffer.from([1, 2])) };
            expect(await server.addChunk({ ...chunk, fileName: 'a.bin' })).to.equal('customTftWrongExtension');
            expect(await server.addChunk({ ...chunk, size: TFT_MAX_SIZE + 1 })).to.equal('customTftTooLarge');
            expect(await server.addChunk({ ...chunk, size: 0 })).to.equal('customTftEmpty');
            // a chunk without a started upload
            expect(await server.addChunk({ ...chunk, offset: 2 })).to.equal('customTftUploadBroken');
            // gap
            expect(await server.addChunk(chunk)).to.equal(undefined);
            expect(await server.addChunk({ ...chunk, offset: 3 })).to.equal('customTftUploadBroken');
            // incomplete upload cannot be served
            expect(await server.addChunk(chunk)).to.equal(undefined);
            expect(await server.serve('x')).to.deep.equal({ error: 'customTftUploadBroken' });
            // more than the announced size
            expect(await server.addChunk({ ...chunk, data: b64(Buffer.alloc(5)) })).to.equal('customTftUploadBroken');
            // too large chunk
            expect(
                await server.addChunk({
                    ...chunk,
                    size: TFT_MAX_CHUNK_SIZE + 1,
                    data: b64(Buffer.alloc(TFT_MAX_CHUNK_SIZE + 1)),
                }),
            ).to.equal('customTftUploadBroken');
            // unknown upload id
            await upload(FILE);
            expect(await server.serve('other')).to.deep.equal({ error: 'customTftUploadBroken' });
        });

        it('serves the file on a free port with range support, 404 otherwise', async () => {
            await upload(FILE, 'my panel.tft');
            const { port, urlPath } = await serve();
            expect(port).to.be.greaterThan(0);
            expect(urlPath).to.equal('/my_panel.tft');

            expect((await request(port, '/other.tft')).status).to.equal(404);
            expect((await request(port, urlPath, {}, 'POST')).status).to.equal(404);

            const full = await request(port, urlPath);
            expect(full.status).to.equal(200);
            expect(full.headers['content-length']).to.equal(String(FILE.length));
            expect(full.body.equals(FILE)).to.equal(true);

            const part = await request(port, urlPath, { Range: 'bytes=1000-' });
            expect(part.status).to.equal(206);
            expect(part.headers['content-range']).to.equal(`bytes 1000-${FILE.length - 1}/${FILE.length}`);
            expect(part.headers['content-length']).to.equal(String(FILE.length - 1000));
            expect(part.body.equals(FILE.subarray(1000))).to.equal(true);

            expect((await request(port, urlPath, { Range: `bytes=${FILE.length}-` })).status).to.equal(416);
            expect(server.running).to.equal(true);
        });

        it('answers the request of the berry driver as it parses it', async () => {
            await upload(FILE);
            const { port, urlPath } = await serve();
            for (const pos of [0, 4096]) {
                const reply = await berryRequest(port, urlPath, pos);
                expect(reply.header).to.match(/^HTTP\/1\.[01] 206 Partial Content\r\n/);
                // the driver searches case-sensitive for "Content-Length: "
                expect(reply.header).to.contain(`\r\nContent-Length: ${FILE.length - pos}\r\n`);
                expect(reply.body.equals(FILE.subarray(pos))).to.equal(true);
            }
        });

        it('a new upload stops the old server and removes old files - only in its own directory', async () => {
            await upload(FILE, 'old.tft');
            const old = await serve();
            fs.writeFileSync(path.join(server.dir, 'leftover.tft'), 'x');
            fs.writeFileSync(path.join(server.dir, 'keep.txt'), 'x');
            const outside = path.join(path.dirname(server.dir), `${path.basename(server.dir)}-outside.tft`);
            fs.writeFileSync(outside, 'x');
            try {
                await upload(FILE.subarray(0, 1000), 'new.tft', 'y');
                expect(server.running).to.equal(false);
                let refused = false;
                try {
                    await request(old.port, old.urlPath);
                } catch {
                    refused = true;
                }
                expect(refused).to.equal(true);
                expect(fs.readdirSync(server.dir).sort()).to.deep.equal(['keep.txt', 'upload.part']);
                expect(fs.existsSync(outside)).to.equal(true);
                const { port, urlPath } = await serve('y');
                expect(fs.readdirSync(server.dir).sort()).to.deep.equal(['keep.txt', 'new.tft']);
                expect((await request(port, urlPath)).body.equals(FILE.subarray(0, 1000))).to.equal(true);
            } finally {
                fs.rmSync(outside, { force: true });
            }
        });

        it('stops after the idle time and removes the file', async () => {
            await upload(FILE);
            const { port, urlPath } = await serve('x', 80, 10_000);
            expect(fs.existsSync(path.join(server.dir, 'a.tft'))).to.equal(true);
            // requests keep it alive
            await wait(50);
            expect((await request(port, urlPath)).status).to.equal(200);
            await wait(50);
            expect(server.running).to.equal(true);
            await wait(100);
            expect(server.running).to.equal(false);
            await wait(20);
            expect(fs.existsSync(path.join(server.dir, 'a.tft'))).to.equal(false);
        });

        it('stops after the maximum time', async () => {
            await upload(FILE);
            await serve('x', 10_000, 50);
            await wait(120);
            expect(server.running).to.equal(false);
        });
    });
});
