import { expect } from 'chai';
import {
    alignText,
    buildScrollingText,
    deepAssign,
    formatHMS,
    getInternalDefaults,
    getPayload,
    getPayloadArray,
    getPayloadArrayRemoveTilde,
    getPayloadRemoveTilde,
    getRegExp,
    getVersionAsNumber,
    insertLinebreak,
    isValidDate,
    isVersionGreaterOrEqual,
    setTriggeredToState,
} from './tools';

describe('lib/const/tools', () => {
    describe('alignText', () => {
        it('left-aligns by padding right', () => {
            expect(alignText('hi', 5, 'left')).to.equal('hi   ');
        });
        it('right-aligns by padding left', () => {
            expect(alignText('hi', 5, 'right')).to.equal('   hi');
        });
        it('center-aligns with extra space on the left when uneven', () => {
            // diff=3 → right = floor(3/2)=1, left=2: '  hi '
            expect(alignText('hi', 5, 'center')).to.equal('  hi ');
        });
        it('returns the input unchanged when length equals size', () => {
            expect(alignText('hello', 5, 'center')).to.equal('hello');
        });
        it('returns the input unchanged when length exceeds size', () => {
            expect(alignText('hello world', 5, 'right')).to.equal('hello world');
        });
        it('handles an empty string', () => {
            expect(alignText('', 3, 'left')).to.equal('   ');
        });
    });

    describe('formatHMS', () => {
        it('formats 65000 ms as "1:05"', () => {
            expect(formatHMS(65_000)).to.equal('1:05');
        });
        it('formats 3700000 ms as "1:01:40"', () => {
            expect(formatHMS(3_700_000)).to.equal('1:01:40');
        });
        it('formats 26 hours as "26:00:00"', () => {
            expect(formatHMS(26 * 3_600_000)).to.equal('26:00:00');
        });
        it('treats negative input as zero', () => {
            expect(formatHMS(-500)).to.equal('0:00');
        });
        it('returns "0:00" for NaN', () => {
            expect(formatHMS(Number.NaN)).to.equal('0:00');
        });
        it('returns "0:00" for Infinity', () => {
            expect(formatHMS(Number.POSITIVE_INFINITY)).to.equal('0:00');
        });
        it('returns "0:00" for zero', () => {
            expect(formatHMS(0)).to.equal('0:00');
        });
        it('pads seconds to two digits', () => {
            expect(formatHMS(5000)).to.equal('0:05');
        });
    });

    describe('getVersionAsNumber', () => {
        it('encodes major as the highest weight', () => {
            expect(getVersionAsNumber('1.0.0')).to.equal(1_000_000);
        });
        it('encodes 0.17.8 deterministically', () => {
            expect(getVersionAsNumber('0.17.8')).to.equal(17_008);
        });
        it('produces monotonically increasing values', () => {
            expect(getVersionAsNumber('1.2.3')).to.be.greaterThan(getVersionAsNumber('1.2.2'));
            expect(getVersionAsNumber('2.0.0')).to.be.greaterThan(getVersionAsNumber('1.99.99'));
        });
    });

    describe('isVersionGreaterOrEqual', () => {
        it('returns true when a > b', () => {
            expect(isVersionGreaterOrEqual('1.0.0', '0.9.9')).to.equal(true);
        });
        it('returns true when versions are equal', () => {
            expect(isVersionGreaterOrEqual('0.17.8', '0.17.8')).to.equal(true);
        });
        it('returns false when a < b', () => {
            expect(isVersionGreaterOrEqual('0.17.7', '0.17.8')).to.equal(false);
        });
    });

    describe('getRegExp', () => {
        it('returns null for empty input', () => {
            expect(getRegExp('')).to.equal(null);
        });
        it('parses /pattern/ as a regex without flags', () => {
            const re = getRegExp('/abc/');
            expect(re).to.be.instanceOf(RegExp);
            expect(re!.source).to.equal('abc');
            expect(re!.flags).to.equal('');
        });
        it('escapes special characters and wraps with .*?', () => {
            const re = getRegExp('a.b');
            expect(re).to.be.instanceOf(RegExp);
            expect(re!.test('xxa.byy')).to.equal(true);
            expect(re!.test('xxaXbyy')).to.equal(false); // dot must be literal
        });
        it('respects startsWith option', () => {
            const re = getRegExp('foo', { startsWith: true });
            expect(re!.test('foobar')).to.equal(true);
            expect(re!.test('barfoo')).to.equal(false);
        });
        it('respects endsWith option', () => {
            const re = getRegExp('foo', { endsWith: true });
            expect(re!.test('barfoo')).to.equal(true);
            expect(re!.test('foobar')).to.equal(false);
        });
        it('treats unclosed leading slash as literal', () => {
            const originalWarn = console.warn;
            console.warn = (): void => undefined;
            try {
                const re = getRegExp('/foo');
                expect(re).to.be.instanceOf(RegExp);
                expect(re!.test('foo')).to.equal(true);
            } finally {
                console.warn = originalWarn;
            }
        });
    });

    describe('insertLinebreak', () => {
        it('returns input unchanged when shorter than lineLength', () => {
            expect(insertLinebreak('hello', 10)).to.equal('hello');
        });
        it('breaks at the last space before lineLength', () => {
            expect(insertLinebreak('hello world foo', 8)).to.equal('hello\nworld\nfoo');
        });
        it('does a hard break when no space is available', () => {
            expect(insertLinebreak('abcdefghij', 4)).to.equal('abcd\nefgh\nij');
        });
        it('keeps existing newlines', () => {
            expect(insertLinebreak('a\nbb cc', 5)).to.equal('a\nbb cc');
        });
        it('returns input unchanged for lineLength <= 0', () => {
            expect(insertLinebreak('hello world', 0)).to.equal('hello world');
        });
        it('returns empty string unchanged', () => {
            expect(insertLinebreak('', 5)).to.equal('');
        });
    });

    describe('buildScrollingText', () => {
        it('centers a short title', () => {
            const result = buildScrollingText('hi', { maxSize: 10 });
            expect(result.text.length).to.equal(10);
            expect(result.nextPos).to.equal(0);
            expect(result.text).to.contain('hi');
        });
        it('advances nextPos by 1 for long titles', () => {
            const long = 'abcdefghijklmnopqrstuvwxyz0123456789';
            const a = buildScrollingText(long, { maxSize: 10, pos: 0 });
            const b = buildScrollingText(long, { maxSize: 10, pos: 1 });
            expect(a.nextPos).to.equal(1);
            expect(b.nextPos).to.equal(2);
        });
        it('respects prefix and suffix when title fits', () => {
            const result = buildScrollingText('x', { maxSize: 8, prefix: '>', suffix: '<' });
            expect(result.text.startsWith('>')).to.equal(true);
            expect(result.text.endsWith('<')).to.equal(true);
            expect(result.text.length).to.equal(8);
        });
        it('returns text bounded by maxSize even when fully filled', () => {
            const long = 'a very very very long title that does not fit';
            const result = buildScrollingText(long, { maxSize: 12 });
            expect(result.text.length).to.equal(12);
        });
        it('handles leftAvailable <= 0 by truncating to maxSize', () => {
            const result = buildScrollingText('title', { maxSize: 3, prefix: 'PRE', suffix: 'SUF' });
            expect(result.text.length).to.be.at.most(3);
        });
    });

    describe('payload helpers', () => {
        it('getPayload joins with tilde', () => {
            expect(getPayload('a', 'b', 'c')).to.equal('a~b~c');
        });
        it('getPayloadArray joins arbitrary values', () => {
            expect(getPayloadArray(['a', 1, true])).to.equal('a~1~true');
        });
        it('getPayloadRemoveTilde replaces tildes in inputs with dash', () => {
            expect(getPayloadRemoveTilde('a~b', 'c')).to.equal('a-b~c');
        });
        it('getPayloadArrayRemoveTilde does the same for arrays', () => {
            expect(getPayloadArrayRemoveTilde(['a~b', 1, 'c~d'])).to.equal('a-b~1~c-d');
        });
    });

    describe('isValidDate', () => {
        it('accepts a fresh Date', () => {
            expect(isValidDate(new Date())).to.equal(true);
        });
        it('rejects an invalid Date', () => {
            expect(isValidDate(new Date('not-a-date'))).to.equal(false);
        });
        it('rejects null', () => {
            expect(isValidDate(null as unknown as Date)).to.equal(false);
        });
        it('rejects undefined', () => {
            expect(isValidDate(undefined as unknown as Date)).to.equal(false);
        });
    });

    describe('deepAssign', () => {
        it('merges plain objects with source winning on conflicts', () => {
            const out = deepAssign({ a: 1, b: 2 }, { b: 3, c: 4 });
            expect(out).to.deep.equal({ a: 1, b: 3, c: 4 });
        });
        it('deep-merges nested plain objects', () => {
            const out = deepAssign({ a: { x: 1, y: 2 } }, { a: { y: 20, z: 30 } });
            expect(out).to.deep.equal({ a: { x: 1, y: 20, z: 30 } });
        });
        it('replaces arrays instead of merging them', () => {
            const out = deepAssign({ list: [1, 2, 3] }, { list: [9] });
            expect(out).to.deep.equal({ list: [9] });
        });
        it('treats null in source as undefined (keeps default)', () => {
            const out = deepAssign({ a: 1 }, { a: null as unknown as number });
            expect(out).to.deep.equal({ a: 1 });
        });
        it('clones the result so mutations do not affect inputs', () => {
            const def = { a: { x: 1 } };
            const out = deepAssign(def, { a: { y: 2 } });
            out.a.x = 99;
            expect(def.a.x).to.equal(1);
        });
        it('replaces atomic DataItem objects (mode=auto with role) wholesale', () => {
            const def = { item: { mode: 'auto', role: 'old', extra: true } };
            const src = { item: { mode: 'auto', role: 'new' } };
            const out = deepAssign(def, src);
            expect(out.item).to.deep.equal({ mode: 'auto', role: 'new' });
            expect(out.item.extra).to.equal(undefined);
        });
        it('throws when nesting deeper than 20 levels', () => {
            const make = (depth: number): Record<string, unknown> => {
                let obj: Record<string, unknown> = { v: 1 };
                for (let i = 0; i < depth; i++) {
                    obj = { nested: obj };
                }
                return obj;
            };
            expect(() => deepAssign(make(25), make(25))).to.throw(/Max level/);
        });
    });

    describe('setTriggeredToState', () => {
        it('rewrites type:"triggered" to type:"state"', () => {
            const obj = { type: 'triggered' };
            setTriggeredToState(obj, []);
            expect(obj.type).to.equal('state');
        });
        it('recurses into nested objects', () => {
            const obj = { a: { type: 'triggered' }, b: { c: { type: 'triggered' } } };
            setTriggeredToState(obj, []);
            expect(obj.a.type).to.equal('state');
            expect(obj.b.c.type).to.equal('state');
        });
        it('skips keys listed in exclude', () => {
            const obj = { ignoreMe: { type: 'triggered' }, keep: { type: 'triggered' } };
            setTriggeredToState(obj, ['ignoreMe']);
            expect(obj.ignoreMe.type).to.equal('triggered');
            expect(obj.keep.type).to.equal('state');
        });
        it('walks arrays recursively', () => {
            const arr = [{ type: 'triggered' }, { type: 'triggered' }];
            setTriggeredToState(arr, []);
            expect(arr[0].type).to.equal('state');
            expect(arr[1].type).to.equal('state');
        });
        it('leaves non-triggered types unchanged', () => {
            const obj = { type: 'state' };
            setTriggeredToState(obj, []);
            expect(obj.type).to.equal('state');
        });
    });

    describe('getInternalDefaults', () => {
        it('returns read=true and write=true by default', () => {
            const d = getInternalDefaults('string', 'text');
            expect(d.read).to.equal(true);
            expect(d.write).to.equal(true);
            expect(d.type).to.equal('string');
            expect(d.role).to.equal('text');
            expect(d.name).to.equal('');
        });
        it('respects write=false', () => {
            const d = getInternalDefaults('boolean', 'switch', false);
            expect(d.write).to.equal(false);
        });
    });
});
