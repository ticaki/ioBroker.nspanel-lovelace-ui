import { expect } from 'chai';
import {
    extractModelFromFilename,
    parseRangeHeader,
    resolveRange,
    HTTPServerClass,
    NoopFileResolver,
} from './http-server';

describe('http-server: parseRangeHeader', () => {
    it('returns null for missing/empty header', () => {
        expect(parseRangeHeader(undefined)).to.equal(null);
        expect(parseRangeHeader('')).to.equal(null);
        expect(parseRangeHeader('bytes=-')).to.equal(null);
    });

    it('parses Tasmota resume form "bytes=N-" → open-ended start', () => {
        const r = parseRangeHeader('bytes=1024-');
        expect(r).to.deep.equal({ start: 1024 });
    });

    it('parses "bytes=START-END" → closed range', () => {
        expect(parseRangeHeader('bytes=0-99')).to.deep.equal({ start: 0, end: 99 });
        expect(parseRangeHeader('bytes=500-999')).to.deep.equal({ start: 500, end: 999 });
    });

    it('parses "bytes=-N" → suffix length', () => {
        expect(parseRangeHeader('bytes=-512')).to.deep.equal({ suffix: 512 });
    });

    it('rejects invalid syntax', () => {
        expect(parseRangeHeader('bytes=abc-def')).to.equal(null);
        expect(parseRangeHeader('items=0-10')).to.equal(null);
        expect(parseRangeHeader('bytes=0-10,20-30')).to.equal(null);
    });
});

describe('http-server: resolveRange', () => {
    it('returns full content range when no Range header', () => {
        const r = resolveRange(null, 1000);
        expect(r).to.deep.equal({ start: 0, end: 999, length: 1000, full: true });
    });

    it('clamps "bytes=N-" to file end (Tasmota resume)', () => {
        const r = resolveRange({ start: 100 }, 1000);
        expect(r).to.deep.equal({ start: 100, end: 999, length: 900, full: false });
    });

    it('clamps "bytes=START-END" when END >= size', () => {
        const r = resolveRange({ start: 100, end: 2000 }, 1000);
        expect(r).to.deep.equal({ start: 100, end: 999, length: 900, full: false });
    });

    it('handles "bytes=START-END" within bounds', () => {
        const r = resolveRange({ start: 100, end: 199 }, 1000);
        expect(r).to.deep.equal({ start: 100, end: 199, length: 100, full: false });
    });

    it('handles suffix range "bytes=-N"', () => {
        const r = resolveRange({ suffix: 50 }, 1000);
        expect(r).to.deep.equal({ start: 950, end: 999, length: 50, full: false });
    });

    it('clamps suffix > size to start of file', () => {
        const r = resolveRange({ suffix: 5000 }, 1000);
        expect(r).to.deep.equal({ start: 0, end: 999, length: 1000, full: false });
    });

    it('returns null when start is at or beyond EOF', () => {
        expect(resolveRange({ start: 1000 }, 1000)).to.equal(null);
        expect(resolveRange({ start: 1001 }, 1000)).to.equal(null);
    });

    it('returns null for zero-byte file', () => {
        expect(resolveRange(null, 0)).to.equal(null);
        expect(resolveRange({ start: 0 }, 0)).to.equal(null);
    });

    it('returns null for inverted range (start > end)', () => {
        expect(resolveRange({ start: 500, end: 100 }, 1000)).to.equal(null);
    });

    it('returns null for zero suffix', () => {
        expect(resolveRange({ suffix: 0 }, 1000)).to.equal(null);
    });
});

describe('http-server: extractModelFromFilename', () => {
    it('extracts eu/default model name', () => {
        expect(extractModelFromFilename('nspanel-v5.1.1.tft')).to.equal('nspanel');
    });

    it('extracts us-p model name', () => {
        expect(extractModelFromFilename('nspanel-us-p-v5.1.1.tft')).to.equal('nspanel-us-p');
    });

    it('extracts us-l model name', () => {
        expect(extractModelFromFilename('nspanel-us-l-v5.1.1.tft')).to.equal('nspanel-us-l');
    });

    it('returns null for unrelated names', () => {
        expect(extractModelFromFilename('something-else.tft')).to.equal(null);
        expect(extractModelFromFilename('version.json')).to.equal(null);
    });
});

function fakeAdapter(): any {
    const noop = (): void => {};
    const log = { silly: noop, debug: noop, info: noop, warn: noop, error: noop };
    return { log, library: {} };
}

describe('http-server: on-demand lifecycle', () => {
    it('does not listen until ensureStarted() is called', () => {
        const s = HTTPServerClass.createHTTPServer(fakeAdapter(), 0, '127.0.0.1', new NoopFileResolver(), 60_000);
        expect(s.ready).to.equal(false);
        s.destroy();
    });

    it('ensureStarted() listens and is idempotent', async () => {
        const s = HTTPServerClass.createHTTPServer(fakeAdapter(), 0, '127.0.0.1', new NoopFileResolver(), 60_000);
        try {
            const ok1 = await s.ensureStarted();
            expect(ok1).to.equal(true);
            expect(s.ready).to.equal(true);
            const port1 = s.port;
            const ok2 = await s.ensureStarted();
            expect(ok2).to.equal(true);
            expect(s.port).to.equal(port1);
        } finally {
            s.destroy();
        }
    });

    it('stops automatically after idle-shutdown timeout', async () => {
        const s = HTTPServerClass.createHTTPServer(fakeAdapter(), 0, '127.0.0.1', new NoopFileResolver(), 30);
        try {
            await s.ensureStarted();
            expect(s.ready).to.equal(true);
            await new Promise(r => setTimeout(r, 100));
            expect(s.ready).to.equal(false);
        } finally {
            s.destroy();
        }
    });

    it('can restart after idle shutdown', async () => {
        const s = HTTPServerClass.createHTTPServer(fakeAdapter(), 0, '127.0.0.1', new NoopFileResolver(), 30);
        try {
            await s.ensureStarted();
            await new Promise(r => setTimeout(r, 100));
            expect(s.ready).to.equal(false);
            const ok = await s.ensureStarted();
            expect(ok).to.equal(true);
            expect(s.ready).to.equal(true);
        } finally {
            s.destroy();
        }
    });

    it('destroy() during armed idle timer does not throw', async () => {
        const s = HTTPServerClass.createHTTPServer(fakeAdapter(), 0, '127.0.0.1', new NoopFileResolver(), 60_000);
        await s.ensureStarted();
        s.destroy();
        expect(s.ready).to.equal(false);
    });
});
