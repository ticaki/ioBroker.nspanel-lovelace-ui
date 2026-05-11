import { expect } from 'chai';
import { parseRangeHeader, resolveRange } from './http-server';

describe('http-server: parseRangeHeader', () => {
    it('returns undefined for missing header', () => {
        expect(parseRangeHeader(undefined)).to.equal(undefined);
    });

    it('returns undefined for non-bytes unit', () => {
        expect(parseRangeHeader('items=0-99')).to.equal(undefined);
    });

    it('parses open-ended range "bytes=N-" (FlashNextionAdv0 resume form)', () => {
        const r = parseRangeHeader('bytes=12345-');
        expect(r).to.deep.equal({ start: 12345 });
    });

    it('parses closed range "bytes=START-END"', () => {
        const r = parseRangeHeader('bytes=100-199');
        expect(r).to.deep.equal({ start: 100, end: 199 });
    });

    it('parses suffix range "bytes=-N"', () => {
        const r = parseRangeHeader('bytes=-500');
        expect(r).to.deep.equal({ start: 0, suffixLength: 500 });
    });

    it('rejects multi-range', () => {
        expect(parseRangeHeader('bytes=0-50,100-150')).to.equal(undefined);
    });

    it('rejects inverted range', () => {
        expect(parseRangeHeader('bytes=500-100')).to.equal(undefined);
    });

    it('rejects garbage', () => {
        expect(parseRangeHeader('bytes=abc-')).to.equal(undefined);
        expect(parseRangeHeader('bytes=-')).to.equal(undefined);
        expect(parseRangeHeader('bytes=')).to.equal(undefined);
    });

    it('accepts array header by using the first element', () => {
        const r = parseRangeHeader(['bytes=10-', 'bytes=20-']);
        expect(r).to.deep.equal({ start: 10 });
    });
});

describe('http-server: resolveRange', () => {
    it('resolves open-ended range to end of file', () => {
        const r = resolveRange({ start: 100 }, 1000);
        expect(r).to.deep.equal({ start: 100, end: 999, length: 900 });
    });

    it('resolves closed range', () => {
        const r = resolveRange({ start: 100, end: 199 }, 1000);
        expect(r).to.deep.equal({ start: 100, end: 199, length: 100 });
    });

    it('clamps end past file size', () => {
        const r = resolveRange({ start: 900, end: 9999 }, 1000);
        expect(r).to.deep.equal({ start: 900, end: 999, length: 100 });
    });

    it('resolves suffix range', () => {
        const r = resolveRange({ start: 0, suffixLength: 100 }, 1000);
        expect(r).to.deep.equal({ start: 900, end: 999, length: 100 });
    });

    it('clamps oversized suffix to entire file', () => {
        const r = resolveRange({ start: 0, suffixLength: 5000 }, 1000);
        expect(r).to.deep.equal({ start: 0, end: 999, length: 1000 });
    });

    it('returns undefined when start is past end of file', () => {
        expect(resolveRange({ start: 1000 }, 1000)).to.equal(undefined);
        expect(resolveRange({ start: 5000 }, 1000)).to.equal(undefined);
    });

    it('returns undefined for empty file', () => {
        expect(resolveRange({ start: 0 }, 0)).to.equal(undefined);
    });
});
