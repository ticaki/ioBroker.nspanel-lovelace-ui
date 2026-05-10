import { expect } from 'chai';
import { parseRangeHeader, resolveRange } from './http-server';

describe('http-server: parseRangeHeader', () => {
    it('returns null for missing or empty header', () => {
        expect(parseRangeHeader(undefined)).to.equal(null);
        expect(parseRangeHeader('')).to.equal(null);
        expect(parseRangeHeader('bytes=-')).to.equal(null);
    });

    it('parses open-ended bytes=START- (Tasmota resume form)', () => {
        const r = parseRangeHeader('bytes=12345-');
        expect(r).to.deep.equal({ start: 12345, end: null, suffix: false });
    });

    it('parses closed bytes=START-END', () => {
        expect(parseRangeHeader('bytes=0-1023')).to.deep.equal({ start: 0, end: 1023, suffix: false });
    });

    it('parses suffix bytes=-N', () => {
        expect(parseRangeHeader('bytes=-512')).to.deep.equal({ suffix: true, length: 512 });
    });

    it('rejects malformed headers', () => {
        expect(parseRangeHeader('items=0-10')).to.equal(null);
        expect(parseRangeHeader('bytes=abc-def')).to.equal(null);
        expect(parseRangeHeader('bytes=10-5')).to.equal(null);
        expect(parseRangeHeader('bytes=0-50,100-150')).to.equal(null);
    });

    it('is case-insensitive on the unit', () => {
        expect(parseRangeHeader('BYTES=0-9')).to.deep.equal({ start: 0, end: 9, suffix: false });
    });
});

describe('http-server: resolveRange', () => {
    it('clamps open-ended range to EOF', () => {
        expect(resolveRange({ start: 100, end: null, suffix: false }, 1000)).to.deep.equal({ start: 100, end: 999 });
    });

    it('clamps closed range END to EOF', () => {
        expect(resolveRange({ start: 100, end: 5000, suffix: false }, 1000)).to.deep.equal({ start: 100, end: 999 });
    });

    it('returns null when start is past EOF (416 case)', () => {
        expect(resolveRange({ start: 1000, end: null, suffix: false }, 1000)).to.equal(null);
        expect(resolveRange({ start: 5000, end: 6000, suffix: false }, 1000)).to.equal(null);
    });

    it('handles suffix range', () => {
        expect(resolveRange({ suffix: true, length: 100 }, 1000)).to.deep.equal({ start: 900, end: 999 });
    });

    it('clamps suffix range larger than file to whole file', () => {
        expect(resolveRange({ suffix: true, length: 5000 }, 1000)).to.deep.equal({ start: 0, end: 999 });
    });

    it('returns null for empty file', () => {
        expect(resolveRange({ start: 0, end: null, suffix: false }, 0)).to.equal(null);
    });
});
