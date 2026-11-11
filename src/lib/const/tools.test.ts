import { expect } from 'chai';
import { Icons } from './icon_mapping';
import type { Dataitem } from '../controller/data-item';
import {
    alignText,
    buildScrollingText,
    deepAssign,
    formatHMS,
    getIconEntryValue,
    getInternalDefaults,
    getPayload,
    getPayloadArray,
    getPayloadArrayRemoveTilde,
    getPayloadRemoveTilde,
    getRegExp,
    getVersionAsNumber,
    headlineMaxChars,
    insertLinebreak,
    isPortraitModel,
    isValidDate,
    isVersionGreaterOrEqual,
    isWebModel,
    menuMaxItems,
    notifyLines,
    webButtonsVisible,
    setTriggeredToState,
    shortenHeadline,
    stripIconFontSuffix,
    dropIconFontWithoutGlyphs,
} from './tools';
import { ScreenSaverConst } from './definition';
import { menuCardItemLimits } from '../types/adminShareConfig';
import type { NSPanel } from '../types/NSPanel';

/**
 * Minimal stand-in for a const Dataitem - getIconEntryValue() reads it via getString()/getNumber().
 *
 * @param value the value the item returns
 */
function constItem(value: string | number): Dataitem {
    const fake = {
        getString: async (): Promise<string> => String(value),
        getNumber: async (): Promise<number> => Number(value),
    };
    return fake as unknown as Dataitem;
}

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
            const out = deepAssign({ a: 1 }, { a: null });
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
    describe('getIconEntryValue font size suffix', () => {
        const icon = (): Parameters<typeof getIconEntryValue>[0] => ({
            true: { value: constItem('lightbulb') },
            false: { value: constItem('lightbulb-outline') },
            textSize: constItem(3),
        });
        it('appends the font id for the on state', async () => {
            expect(await getIconEntryValue(icon(), true, '')).to.equal(`${Icons.GetIcon('lightbulb')}¬3`);
        });
        it('appends the font id for the off state (boolean)', async () => {
            expect(await getIconEntryValue(icon(), false, '')).to.equal(`${Icons.GetIcon('lightbulb-outline')}¬3`);
        });
        it('appends font id 0', async () => {
            const i = { ...icon(), textSize: constItem(0) };
            expect(await getIconEntryValue(i, false, '')).to.equal(`${Icons.GetIcon('lightbulb-outline')}¬0`);
        });
        it('appends no suffix without textSize', async () => {
            const i = { true: { value: constItem('lightbulb') }, false: { value: constItem('lightbulb-outline') } };
            expect(await getIconEntryValue(i, false, '')).to.equal(Icons.GetIcon('lightbulb-outline'));
        });
    });

    describe('panel models', () => {
        const models: NSPanel.NSpanelModel[] = ['eu', 'us-l', 'us-p', 'web-l', 'web-p'];

        it('isPortraitModel is true for us-p and web-p only', () => {
            expect(models.filter(m => isPortraitModel(m))).to.deep.equal(['us-p', 'web-p']);
        });

        it('isWebModel is true for web-l and web-p only', () => {
            expect(models.filter(m => isWebModel(m))).to.deep.equal(['web-l', 'web-p']);
        });

        it('menuMaxItems follows the table of SMARTPHONE.md (eu, us-l, us-p, web-l, web-p)', () => {
            const table: Record<Parameters<typeof menuMaxItems>[0], number[]> = {
                cardEntities: [4, 4, 5, 4, 8],
                cardSchedule: [6, 6, 6, 6, 11],
                cardGrid: [6, 6, 6, 8, 10],
                cardGrid2: [8, 8, 9, 10, 15],
                cardGrid3: [4, 4, 4, 6, 8],
                cardMedia: [5, 5, 5, 6, 8],
                cardThermo2: [9, 9, 9, 9, 9],
            };
            for (const card of Object.keys(table) as (keyof typeof table)[]) {
                expect(
                    models.map(m => menuMaxItems(card, m)),
                    card,
                ).to.deep.equal(table[card]);
            }
        });

        it('menuMaxItems equals menuCardItemLimits of the admin', () => {
            for (const card of Object.keys(menuCardItemLimits) as (keyof typeof menuCardItemLimits)[]) {
                for (const m of models) {
                    expect(menuMaxItems(card, m), `${card}/${m}`).to.equal(menuCardItemLimits[card][m]);
                }
            }
        });

        it('webButtonsVisible follows the model unless the option is set', () => {
            expect(models.map(m => webButtonsVisible(m))).to.deep.equal([true, true, true, false, false]);
            expect(models.map(m => webButtonsVisible(m, true))).to.deep.equal([true, true, true, true, true]);
            expect(models.map(m => webButtonsVisible(m, false))).to.deep.equal([false, false, false, false, false]);
        });

        it('headlineMaxChars: eu/us-l 28, us-p 13, web-p 16, web-l 45', () => {
            expect(models.map(m => headlineMaxChars(m))).to.deep.equal([28, 28, 13, 45, 16]);
        });

        it('shortenHeadline keeps a headline of exactly the limit and a shorter one', () => {
            for (const m of models) {
                const exact = 'x'.repeat(headlineMaxChars(m));
                expect(shortenHeadline(exact, m), m).to.equal(exact);
                expect(shortenHeadline('Kitchen', m), m).to.equal('Kitchen');
            }
        });

        it('shortenHeadline ends a longer headline with … at the limit', () => {
            const text = 'Living room ground floor west side';
            for (const m of models) {
                const max = headlineMaxChars(m);
                const short = shortenHeadline(text, m);
                if (text.length > max) {
                    expect(short, m).to.equal(`${text.slice(0, max - 1)}\u2026`);
                    expect(Array.from(short).length, m).to.equal(max);
                } else {
                    expect(short, m).to.equal(text);
                }
            }
            expect(shortenHeadline('Wohnzimmer Erdgeschoss', 'us-p')).to.equal('Wohnzimmer E\u2026');
        });

        it('shortenHeadline counts a surrogate pair as one character', () => {
            expect(shortenHeadline(`${'\u{1F600}'.repeat(14)}`, 'us-p')).to.equal(`${'\u{1F600}'.repeat(12)}\u2026`);
        });

        it('shortenHeadline returns an empty string for empty and undefined', () => {
            expect(shortenHeadline('', 'eu')).to.equal('');
            expect(shortenHeadline(undefined, 'web-p')).to.equal('');
        });

        it('notifyLines gives the lines per textSize and model', () => {
            for (const m of ['eu', 'us-l', 'us-p', 'web-l'] as const) {
                expect(
                    [0, 1, 2, 3, 4, 5].map(t => notifyLines(t, m)),
                    m,
                ).to.deep.equal([7, 5, 5, 4, 2, 1]);
            }
            expect([0, 1, 2, 3, 4, 5].map(t => notifyLines(t, 'web-p'))).to.deep.equal([20, 15, 15, 10, 6, 3]);
        });

        it('notifyLines falls back to textSize 0 for unknown sizes', () => {
            expect(notifyLines(Number(undefined), 'eu')).to.equal(7);
            expect(notifyLines(9, 'web-p')).to.equal(20);
        });

        it('ScreenSaverConst has the web slots of SMARTPHONE.md (bottom / indicator / left)', () => {
            const slots = (
                mode: keyof typeof ScreenSaverConst,
                model: NSPanel.NSpanelModel,
            ): [number, number, number] => {
                const get = (place: 'bottom' | 'indicator' | 'left'): number => {
                    const max = ScreenSaverConst[mode][place].maxEntries;
                    return max[model] ?? max.eu;
                };
                return [get('bottom'), get('indicator'), get('left')];
            };
            expect(slots('standard', 'web-l')).to.deep.equal([6, 0, 0]);
            expect(slots('standard', 'web-p')).to.deep.equal([8, 0, 0]);
            expect(slots('alternate', 'web-l')).to.deep.equal([5, 0, 0]);
            expect(slots('alternate', 'web-p')).to.deep.equal([7, 0, 0]);
            expect(slots('advanced', 'web-l')).to.deep.equal([8, 8, 3]);
            expect(slots('advanced', 'web-p')).to.deep.equal([8, 12, 4]);
            expect(slots('easyview', 'web-l')).to.deep.equal([4, 0, 0]);
            expect(slots('easyview', 'web-p')).to.deep.equal([8, 0, 0]);
            expect(slots('tiles', 'web-l')).to.deep.equal([7, 11, 0]);
            expect(slots('tiles', 'web-p')).to.deep.equal([8, 8, 0]);
        });
    });

    describe('stripIconFontSuffix', () => {
        it('removes a trailing font suffix', () => {
            expect(stripIconFontSuffix(`${Icons.GetIcon('lightbulb')}¬3`)).to.equal(Icons.GetIcon('lightbulb'));
            expect(stripIconFontSuffix('21.5°C¬4')).to.equal('21.5°C');
        });
        it('leaves a text without suffix alone', () => {
            expect(stripIconFontSuffix('')).to.equal('');
            expect(stripIconFontSuffix('a¬b')).to.equal('a¬b');
            expect(stripIconFontSuffix(Icons.GetIcon('lightbulb'))).to.equal(Icons.GetIcon('lightbulb'));
        });
    });

    describe('dropIconFontWithoutGlyphs', () => {
        const battery = Icons.GetIcon('battery-high');
        it('drops the suffix of an icon in a font without icon glyphs (0, 2, 5)', () => {
            expect(battery).to.match(/^[\uE000-\uFDFF]+$/);
            expect(dropIconFontWithoutGlyphs(`${battery}¬2`)).to.equal(battery);
            expect(dropIconFontWithoutGlyphs(`${battery}¬0`)).to.equal(battery);
            expect(dropIconFontWithoutGlyphs(`${battery}¬5`)).to.equal(battery);
            // own icons from FD40 are icons too
            expect(dropIconFontWithoutGlyphs('\uFD40¬2')).to.equal('\uFD40');
        });
        it('keeps the suffix of an icon font and of a text', () => {
            expect(dropIconFontWithoutGlyphs(`${battery}¬4`)).to.equal(`${battery}¬4`);
            expect(dropIconFontWithoutGlyphs(`${battery}¬1`)).to.equal(`${battery}¬1`);
            expect(dropIconFontWithoutGlyphs('85%¬2')).to.equal('85%¬2');
            expect(dropIconFontWithoutGlyphs(`${battery}85%¬2`)).to.equal(`${battery}85%¬2`);
            expect(dropIconFontWithoutGlyphs(battery)).to.equal(battery);
            expect(dropIconFontWithoutGlyphs('¬2')).to.equal('¬2');
            expect(dropIconFontWithoutGlyphs('')).to.equal('');
        });
    });
});
