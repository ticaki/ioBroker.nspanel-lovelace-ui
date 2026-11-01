import { expect } from 'chai';
import {
    type ChartEntry,
    type MenuEntry,
    type PageConfigEntry,
    type PageLinkEntry,
    pageLinkProblem,
    resolvePageLinks,
} from './adminShareConfig';

const garage: MenuEntry = {
    card: 'cardGrid',
    uniqueName: 'garage',
    headline: 'Garage',
    // a placeholder slot is enough to see that the items are copied and not shared
    pageItems: [undefined],
    isMainPage: true,
    hidden: false,
    alwaysOn: 'always',
    navigationAssignment: [{ topic: 'nspanel/garage', navigation: { next: 'x' } }],
};

const link = (fields: Partial<PageLinkEntry> = {}): PageLinkEntry => ({
    card: 'pageLink',
    uniqueName: 'garageFlur',
    target: 'garage',
    navigationAssignment: [{ topic: 'nspanel/flur', navigation: { parent: 'flurMain' } }],
    hidden: true,
    alwaysOn: 'none',
    ...fields,
});

describe('page links', () => {
    it('replaces a link by a copy of its target with the metadata of the link', () => {
        const { entries, unresolved } = resolvePageLinks([garage, link()]);
        expect(unresolved).to.deep.equal([]);
        expect(entries).to.have.length(2);
        const copy = entries[1] as MenuEntry;
        expect(copy.card).to.equal('cardGrid');
        expect(copy.uniqueName).to.equal('garageFlur');
        expect(copy.pageItems).to.deep.equal(garage.pageItems);
        expect(copy.pageItems).to.not.equal(garage.pageItems);
        expect(copy.isMainPage).to.equal(false);
        expect(copy.hidden).to.equal(true);
        expect(copy.alwaysOn).to.equal('none');
        expect(copy.navigationAssignment).to.deep.equal([
            { topic: 'nspanel/flur', navigation: { parent: 'flurMain' } },
        ]);
        // the target stays untouched
        expect(entries[0]).to.equal(garage);
    });

    it('takes the start page flag of the link', () => {
        const { entries } = resolvePageLinks([garage, link({ isMainPage: true })]);
        expect(entries[1].isMainPage).to.equal(true);
    });

    it('headline: link, else target headline, else target uniqueName', () => {
        expect(resolvePageLinks([garage, link({ headline: 'Tor' })]).entries[1].headline).to.equal('Tor');
        expect(resolvePageLinks([garage, link({ headline: '' })]).entries[1].headline).to.equal('Garage');
        expect(resolvePageLinks([{ ...garage, headline: '' }, link()]).entries[1].headline).to.equal('garage');
    });

    it('drops links with a missing target or a link as target', () => {
        const second = link({ uniqueName: 'second', target: 'garageFlur' });
        const missing = link({ uniqueName: 'missing', target: 'nope' });
        const all: PageConfigEntry[] = [garage, link(), second, missing];
        const { entries, unresolved } = resolvePageLinks(all);
        expect(entries.map(e => e.uniqueName)).to.deep.equal(['garage', 'garageFlur']);
        expect(unresolved).to.deep.equal([
            { uniqueName: 'second', target: 'garageFlur', problem: 'link' },
            { uniqueName: 'missing', target: 'nope', problem: 'missing' },
        ]);
        expect(pageLinkProblem(second, all)).to.equal('link');
        expect(pageLinkProblem(missing, all)).to.equal('missing');
        expect(pageLinkProblem(link({ target: '' }), all)).to.equal('missing');
        expect(pageLinkProblem(link(), all)).to.equal(undefined);
    });

    it('a link to a migrated chart navigates on its own', () => {
        const chart = {
            card: 'cardChart',
            uniqueName: 'chart',
            scriptNavigation: true,
            scriptName: 'oldChart',
        } as ChartEntry;
        const copy = resolvePageLinks([chart, link({ target: 'chart' })]).entries[1] as ChartEntry;
        expect(copy.scriptNavigation).to.equal(false);
        expect(copy.scriptName).to.equal(undefined);
    });
});
