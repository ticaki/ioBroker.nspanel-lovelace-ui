import { expect } from 'chai';
import type { PageItemTemplateInfo, ScreensaverArea } from '../../src/lib/types/adminShareConfig';
import {
    type TemplateList,
    type TemplateListEntry,
    applyTemplateChoice,
    buildTemplateList,
    pageItemTemplateInfoOf,
    templateEntryHelpText,
    templateEntrySearchText,
    trashPageNames,
} from './templateList';

describe('templateList', () => {
    const info = (name: string, areas: ScreensaverArea[] = ['bottom']): PageItemTemplateInfo => ({
        name,
        type: 'text',
        role: '',
        adapter: '',
        need: 'none',
        looksFor: [],
        areas,
        options: [],
    });
    // sorted like the list of the adapter: afterNext before next
    const templates: PageItemTemplateInfo[] = [
        info('text.clock'),
        { ...info('text.trash.afterNext'), label: 'screensaver_template_trashAfterNext' },
        { ...info('text.trash.next'), label: 'screensaver_template_trashNext' },
        info('text.window.isOpen'),
        info('weather.favorit', ['favorit']),
    ];
    const texts: Record<string, string> = {
        screensaver_template_trashNext: 'Nächster Termin',
        screensaver_template_trashAfterNext: 'Übernächster Termin',
        screensaver_template_trashUnknownPage: 'unbekannte Seite: %s',
    };
    const getText = (key: string): string => texts[key] ?? key;
    const build = (
        trashPages: readonly string[] | undefined,
        template?: string,
        readOptions?: Record<string, string | number>,
        area: ScreensaverArea | undefined = 'bottom',
    ): TemplateList =>
        buildTemplateList({
            templates,
            area,
            selected: pageItemTemplateInfoOf(templates, template),
            readOptions,
            trashPages,
            getText,
        });
    const labels = (list: TemplateList): string[] => list.entries.map(e => e.label);

    describe('trashPageNames', () => {
        it('takes the trash pages in their order, nothing else', () => {
            expect(
                trashPageNames([
                    { card: 'cardTrash', uniqueName: 'b' },
                    { card: 'cardEntities', uniqueName: 'x' },
                    { card: 'cardTrash', uniqueName: 'a' },
                    { card: 'cardTrash', uniqueName: ' ' },
                    { card: 'cardTrash' },
                    null,
                    'cardTrash',
                ]),
            ).to.deep.equal(['b', 'a']);
        });
        it('has the order of the runtime map: an integer-like name comes first, no doubles', () => {
            const pages = [
                { card: 'cardTrash', uniqueName: 'a' },
                { card: 'cardTrash', uniqueName: '5' },
                { card: 'cardTrash', uniqueName: 'a' },
            ];
            const runtime: Record<string, unknown[]> = {};
            pages.forEach(p => (runtime[p.uniqueName] = []));
            expect(trashPageNames(pages)).to.deep.equal(Object.keys(runtime));
            expect(trashPageNames(pages)[0]).to.equal('5');
        });
    });

    describe('entries', () => {
        it('two pages give four entries in a fixed order, the other templates stay', () => {
            const list = build(['kueche', 'bad']);
            expect(labels(list)).to.deep.equal([
                'text.clock',
                'Nächster Termin (kueche)',
                'Übernächster Termin (kueche)',
                'Nächster Termin (bad)',
                'Übernächster Termin (bad)',
                'text.window.isOpen',
            ]);
            expect(list.entries[3]).to.include({ key: 'text.trash.next|bad' });
            expect(list.entries[3].template.name).to.equal('text.trash.next');
            expect(list.entries[3].readOptions).to.deep.equal({ page: 'bad' });
            expect(list.entries[0].readOptions).to.equal(undefined);
            expect(list.selected).to.equal(null);
        });
        it('keys are unique', () => {
            const keys = build(['a', 'b']).entries.map(e => e.key);
            expect(new Set(keys).size).to.equal(keys.length);
        });
        it('without a trash page no trash entry', () => {
            expect(labels(build([]))).to.deep.equal(['text.clock', 'text.window.isOpen']);
        });
        it('without the list of pages no expansion: one entry per template, with its display name', () => {
            const list = build(undefined);
            expect(list.entries.map(e => e.key)).to.deep.equal([
                'text.clock',
                'text.trash.afterNext',
                'text.trash.next',
                'text.window.isOpen',
            ]);
            expect(labels(list)).to.deep.equal([
                'text.clock',
                'Übernächster Termin',
                'Nächster Termin',
                'text.window.isOpen',
            ]);
        });
        it('any template with a label shows it, the key stays the technical name', () => {
            const labelled = { ...info('text.window.isOpen'), label: 'label_window' };
            const list = buildTemplateList({
                templates: [labelled],
                selected: labelled,
                readOptions: undefined,
                trashPages: ['a'],
                getText: key => (key === 'label_window' ? 'Fenster' : key),
            });
            expect(list.selected).to.include({
                key: 'text.window.isOpen',
                label: 'Fenster',
                technicalName: 'text.window.isOpen',
            });
        });
        it('the same text does not make the same entry: the key holds template and page', () => {
            const same = build(['a', 'b']).entries.filter(e => e.template.name === 'text.trash.next');
            expect(same.map(e => e.key)).to.deep.equal(['text.trash.next|a', 'text.trash.next|b']);
        });
        it('the area filter still applies', () => {
            expect(labels(build(['a'], undefined, undefined, 'favorit'))).to.deep.equal(['weather.favorit']);
        });
        it('a stored other template stays selectable, sorted in', () => {
            const list = build(['a'], 'text.gone');
            expect(list.selected?.label).to.equal('text.gone');
            expect(labels(list).slice(0, 3)).to.deep.equal(['text.clock', 'text.gone', 'Nächster Termin (a)']);
            expect(list.entries).to.include(list.selected);
        });
        it('without templates (adapter offline) only the stored one', () => {
            const list = buildTemplateList({
                templates: undefined,
                selected: pageItemTemplateInfoOf(undefined, 'text.trash.next'),
                readOptions: { page: 'a' },
                trashPages: ['a'],
                getText,
            });
            expect(labels(list)).to.deep.equal(['Nächster Termin (a)']);
            expect(list.selected).to.equal(list.entries[0]);
        });
    });

    describe('technical name', () => {
        const byKey = (key: string): TemplateListEntry => {
            const entry = build(['a']).entries.find(e => e.key === key);
            if (!entry) {
                throw new Error(key);
            }
            return entry;
        };
        it('an entry with a display name carries it for the tooltip, others none', () => {
            expect(byKey('text.trash.next|a').technicalName).to.equal('text.trash.next');
            expect(byKey('text.trash.afterNext|a').technicalName).to.equal('text.trash.afterNext');
            expect(byKey('text.clock').technicalName).to.equal(undefined);
        });
        it('the search finds an entry by display name, technical name and page', () => {
            const text = templateEntrySearchText(byKey('text.trash.next|a'));
            expect(text).to.include('text.trash.next');
            expect(text).to.include('Nächster Termin');
            expect(text).to.include('(a)');
        });
        it('the help text shows it before the description', () => {
            expect(templateEntryHelpText(byKey('text.trash.next|a'), 'Typ text')).to.equal(
                'text.trash.next · Typ text',
            );
            expect(templateEntryHelpText(byKey('text.trash.next|a'), '')).to.equal('text.trash.next');
        });
        it('the help text of the others stays the description', () => {
            expect(templateEntryHelpText(byKey('text.clock'), 'Typ text')).to.equal('Typ text');
            expect(templateEntryHelpText(byKey('text.clock'), '')).to.equal('');
            expect(templateEntryHelpText(null, '')).to.equal('');
        });
    });

    describe('stored items', () => {
        it('with a known page: the entry of the list, the very object of the list', () => {
            const list = build(['a', 'b'], 'text.trash.afterNext', { page: 'b' });
            expect(list.selected?.label).to.equal('Übernächster Termin (b)');
            expect(list.entries).to.have.length(6);
            expect(list.entries).to.include(list.selected);
        });
        it('without a page: the entry of the first page, as the runtime shows it', () => {
            const list = build(['a', 'b'], 'text.trash.next');
            expect(list.selected?.label).to.equal('Nächster Termin (a)');
            expect(list.entries).to.have.length(6);
            expect(list.entries).to.include(list.selected);
        });
        it('a blank page counts as none, a number as its text, blanks around it do not count', () => {
            expect(build(['5', 'a'], 'text.trash.next', { page: '  ' }).selected?.key).to.equal('text.trash.next|5');
            expect(build(['5', 'a'], 'text.trash.next', { page: 5 }).selected?.key).to.equal('text.trash.next|5');
            expect(build(['a', 'b'], 'text.trash.next', { page: ' b ' }).selected?.key).to.equal('text.trash.next|b');
        });
        it('with an unknown page: an entry of its own with the stored id, no other page', () => {
            const list = build(['a'], 'text.trash.next', { page: 'alt' });
            expect(list.selected?.label).to.equal('Nächster Termin (unbekannte Seite: alt)');
            expect(list.selected?.readOptions).to.deep.equal({ page: 'alt' });
            expect(list.entries).to.have.length(5);
            expect(list.entries).to.include(list.selected);
            // stays with the other text templates, the groups of the list stay together
            expect(labels(list)).to.deep.equal([
                'text.clock',
                'Nächster Termin (a)',
                'Übernächster Termin (a)',
                'Nächster Termin (unbekannte Seite: alt)',
                'text.window.isOpen',
            ]);
        });
        it('an id with replacement patterns stays as it is', () => {
            const list = build(['a'], 'text.trash.next', { page: "$&$'" });
            expect(list.selected?.label).to.equal("Nächster Termin (unbekannte Seite: $&$')");
        });
        it('without any trash page: a stored item stays visible', () => {
            const legacy = build([], 'text.trash.next');
            expect(legacy.selected?.label).to.equal('Nächster Termin');
            expect(legacy.selected?.readOptions).to.equal(undefined);
            expect(labels(legacy)).to.deep.equal(['text.clock', 'Nächster Termin', 'text.window.isOpen']);
            const withPage = build([], 'text.trash.afterNext', { page: 'alt' });
            expect(withPage.selected?.label).to.equal('Übernächster Termin (unbekannte Seite: alt)');
            expect(withPage.entries).to.include(withPage.selected);
        });
        it('outside of its area it stays selectable', () => {
            const list = build(['a'], 'text.trash.next', { page: 'a' }, 'favorit');
            expect(list.selected?.label).to.equal('Nächster Termin (a)');
            expect(labels(list)).to.deep.equal(['Nächster Termin (a)', 'weather.favorit']);
        });
    });

    describe('applyTemplateChoice', () => {
        const choose = (
            item: Parameters<typeof applyTemplateChoice>[0],
            key: string,
        ): ReturnType<typeof applyTemplateChoice> => {
            const entry = build(['a', 'b']).entries.find(e => e.key === key);
            return applyTemplateChoice(item, templates, entry?.template.name, entry?.readOptions);
        };
        it('stores template and page and drops a state left on the item', () => {
            expect(choose({ state: 'alias.0.x' }, 'text.trash.next|b')).to.deep.equal({
                state: '',
                template: 'text.trash.next',
                readOptions: { page: 'b' },
            });
        });
        it('another page of the same template changes the page', () => {
            const item = { state: '', template: 'text.trash.next', readOptions: { page: 'a' } };
            expect(choose(item, 'text.trash.next|b')).to.deep.equal({
                state: '',
                template: 'text.trash.next',
                readOptions: { page: 'b' },
            });
            expect(item.readOptions).to.deep.equal({ page: 'a' });
        });
        it('an item without a page gets one', () => {
            expect(
                choose({ state: '', template: 'text.trash.next' }, 'text.trash.afterNext|a').readOptions,
            ).to.deep.equal({ page: 'a' });
        });
        it('another template drops the page', () => {
            const item = { state: '', template: 'text.trash.next', readOptions: { page: 'a' } };
            expect(choose(item, 'text.clock')).to.deep.equal({ state: '', template: 'text.clock' });
        });
        it('clearing removes template and options, the state stays', () => {
            expect(
                applyTemplateChoice({ state: 'a.b', template: 'x', readOptions: { min: 1 } }, templates, undefined),
            ).to.deep.equal({ state: 'a.b' });
        });
        it('a template that searches a channel keeps the object', () => {
            expect(applyTemplateChoice({ state: 'a.b' }, templates, 'text.unknown').state).to.equal('a.b');
        });
    });
});
