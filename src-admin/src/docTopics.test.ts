import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import MarkdownIt from 'markdown-it';
import { headingText, replaceHeadings, slug } from './docAnchors';
import { DOC_TOPICS, cardDocTopic, CARD_DOC_PAGES, docTopicUrl, type DocTopic } from './docTopics';
import { pageitemsTopicsOfStandardKind } from './docTopics/pageitems';
import { DOC_BASE, docPageUrl, resolveDocLanguage, type DocLanguage } from './docLink';

const docRoot = path.join(__dirname, '..', '..', 'doc');
// the same options as script/build-doc-page.ts, so the headings get the same ids
const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

/** Headings of one documentation page as the documentation build sees them: visible text -> id. */
const headingCache = new Map<string, { text: string; id: string }[]>();

function headingsOf(language: DocLanguage, page: string): { text: string; id: string }[] {
    const key = `${language}/${page}`;
    const cached = headingCache.get(key);
    if (cached) {
        return cached;
    }
    const src = fs.readFileSync(path.join(docRoot, language, `${page}.md`), 'utf8');
    const headings: { text: string; id: string }[] = [];
    replaceHeadings(md.render(src), (_level, id, inner) => {
        headings.push({ text: headingText(inner), id });
        return '';
    });
    headingCache.set(key, headings);
    return headings;
}

const topics: [string, DocTopic][] = Object.entries(DOC_TOPICS);

describe('docTopics', () => {
    it('every key carries the prefix of its area', () => {
        const areas = ['screensaver', 'pages1', 'pages2', 'pageitems', 'dialogs', 'navigation', 'maintain'];
        for (const [key] of topics) {
            expect(areas, key).to.include(key.split('.')[0]);
        }
    });

    for (const [key, topic] of topics) {
        describe(key, () => {
            it('names both headings or none', () => {
                expect(topic.de === undefined, 'de and en must both be set or both be missing').to.equal(
                    topic.en === undefined,
                );
            });

            for (const language of ['de', 'en'] as const) {
                it(`exists in doc/${language}`, () => {
                    const file = path.join(docRoot, language, `${topic.page}.md`);
                    expect(fs.existsSync(file), `missing ${file}`).to.equal(true);
                    const heading = language === 'de' ? topic.de : topic.en;
                    if (heading === undefined) {
                        return;
                    }
                    const headings = headingsOf(language, topic.page);
                    const found = headings.find(h => h.text === heading);
                    expect(
                        found,
                        `heading "${heading}" not found in doc/${language}/${topic.page}.md; headings: ${headings
                            .map(h => h.text)
                            .join(' | ')}`,
                    ).to.not.equal(undefined);
                    // the link uses slug(heading): that must be the id the build gives this heading
                    expect(found?.id, `anchor of "${heading}"`).to.equal(slug(heading));
                    expect(docTopicUrl(topic, language)).to.equal(
                        `${DOC_BASE}/${language}/${encodeURIComponent(topic.page)}.html#${encodeURIComponent(slug(heading))}`,
                    );
                });
            }
        });
    }

    it('every card page exists in both languages', () => {
        for (const page of CARD_DOC_PAGES) {
            for (const language of ['de', 'en']) {
                expect(fs.existsSync(path.join(docRoot, language, `${page}.md`)), `${language}/${page}`).to.equal(true);
            }
        }
        expect(cardDocTopic('cardChart')).to.deep.equal({ page: 'cardChart' });
        expect(cardDocTopic('screensaver')).to.deep.equal({ page: 'PageConfig' });
        expect(cardDocTopic(undefined)).to.deep.equal({ page: 'PageConfig' });
    });

    it('help of the kind "standard": timer documentation, no alias table, nothing for other roles', () => {
        expect(pageitemsTopicsOfStandardKind('level.timer', false)).to.deep.equal(['pageitems.popupTimer']);
        expect(pageitemsTopicsOfStandardKind('level.timer', true)).to.deep.equal(['pageitems.screensaverTimer']);
        expect(pageitemsTopicsOfStandardKind('light', false)).to.deep.equal([]);
        expect(pageitemsTopicsOfStandardKind(null, false)).to.deep.equal([]);
    });
});

describe('docLink', () => {
    it('German only for a German system', () => {
        expect(resolveDocLanguage('de')).to.equal('de');
        expect(resolveDocLanguage('en')).to.equal('en');
        expect(resolveDocLanguage('fr', 'de')).to.equal('en');
        expect(resolveDocLanguage(undefined, 'de')).to.equal('de');
        expect(resolveDocLanguage(undefined, undefined)).to.equal('en');
    });

    it('builds page and section urls', () => {
        expect(docPageUrl('de', 'screensaver')).to.equal(`${DOC_BASE}/de/screensaver.html`);
        expect(docPageUrl('en', 'Maintain', '4-script-version')).to.equal(
            `${DOC_BASE}/en/Maintain.html#4-script-version`,
        );
    });
});
