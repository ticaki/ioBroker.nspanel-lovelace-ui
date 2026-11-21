/**
 * cardEntities2 (cardEntities with five rows, doc/ideas/device-details/README.md): the page of the HMI, the number of
 * rows and the entityUpd message - a display without the page (older TFT, us-l / us-p) shows cardEntities with four
 * rows. PageEntities without constructor, a fake panel and fake page items.
 */
import { expect } from 'chai';
import { CARD_ENTITIES2_MIN_VERSION } from '../const/tools';
import { PageEntities } from './pageEntities';

type Target = { isVirtual?: boolean; model?: string; displayVersion?: string };

/**
 * @param card the configured card
 * @param target web/hardware, model and TFT version of the panel
 * @param rows number of page items
 * @returns the page and the payloads it sent
 */
function makePage(card: string, target: Target, rows = 7): { page: PageEntities; sent: string[] } {
    const noop = (): void => undefined;
    const sent: string[] = [];
    const page = Object.create(PageEntities.prototype) as PageEntities;
    const items = Array.from({ length: rows }, (_v, i) => ({
        isEnabled: async (): Promise<boolean> => Promise.resolve(true),
        getPageItemPayload: async (): Promise<string> => Promise.resolve(`text~p?${i}~icon~2047~Row ${i}~v${i}`),
    }));
    Object.assign(page, {
        card,
        name: 'test',
        visibility: true,
        step: 0,
        config: { card, scrollPresentation: 'classic', scrollType: 'page', data: {} },
        items: { card, data: { headline: { getString: async (): Promise<string> => Promise.resolve('Head') } } },
        pageItems: items,
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        library: { getTranslation: (s: string): string => s },
        adapter: { setTimeout: (): undefined => undefined, clearTimeout: noop },
        basePanel: {
            isVirtual: target.isVirtual ?? false,
            info: { nspanel: { model: target.model ?? 'eu', displayVersion: target.displayVersion ?? '' } },
        },
        getNavigation: (): string => 'button~bSubPrev~~~~~button~bSubNext~~~~',
        sendToPanel: (payload: string): void => {
            sent.push(payload);
        },
    });
    (page as any).maxItems = (page as any).menuMaxItemsOf(card);
    return { page, sent };
}

/**
 * @param payload an entityUpd message
 * @returns the rows behind heading and navigation (6 fields each)
 */
function rowsOf(payload: string): string[][] {
    const fields = payload.split('~').slice(14);
    const rows: string[][] = [];
    for (let i = 0; i < fields.length; i += 6) {
        rows.push(fields.slice(i, i + 6));
    }
    return rows;
}

describe('lib/pages/pageEntities - cardEntities2', () => {
    const NEW = { displayVersion: CARD_ENTITIES2_MIN_VERSION };

    it('the next TFT after 6.2.0 has the page', () => {
        expect(CARD_ENTITIES2_MIN_VERSION).to.equal('6.2.1');
    });

    it('new TFT (eu): pageType cardEntities2, 5 rows, row 5 = fields 38..43', async () => {
        const { page, sent } = makePage('cardEntities2', NEW);
        expect(page.hmiCard).to.equal('cardEntities2');
        expect((page as any).getPageTypePayload()).to.equal('pageType~cardEntities2');
        expect((page as any).maxItems).to.equal(5);
        await page.update();
        expect(sent).to.have.length(1);
        const fields = sent[0].split('~');
        expect(fields[0]).to.equal('entityUpd');
        expect(fields[1]).to.equal('Head');
        expect(fields).to.have.length(44);
        expect(fields.slice(38, 44)).to.deep.equal(['text', 'p?4', 'icon', '2047', 'Row 4', 'v4']);
        expect(rowsOf(sent[0])).to.have.length(5);
    });

    it('fewer items: the free rows are placeholders, still 5 rows', async () => {
        const { page, sent } = makePage('cardEntities2', NEW, 3);
        await page.update();
        const rows = rowsOf(sent[0]);
        expect(rows).to.have.length(5);
        expect(rows[3]).to.deep.equal(['', '', '', '', '', '']);
        expect(rows[4]).to.deep.equal(['', '', '', '', '', '']);
    });

    for (const target of [
        { name: 'TFT 6.2.0', t: { displayVersion: '6.2.0' } },
        { name: 'TFT unknown', t: { displayVersion: '' } },
        { name: 'us-l with new TFT', t: { model: 'us-l', displayVersion: '6.3.0' } },
    ]) {
        it(`${target.name}: shown as cardEntities with 4 rows`, async () => {
            const { page, sent } = makePage('cardEntities2', target.t);
            expect(page.hmiCard).to.equal('cardEntities');
            expect((page as any).getPageTypePayload()).to.equal('pageType~cardEntities');
            expect((page as any).maxItems).to.equal(4);
            await page.update();
            expect(rowsOf(sent[0])).to.have.length(4);
        });
    }

    it('us-p with new TFT: shown as cardEntities (5 rows like its cardEntities)', () => {
        const { page } = makePage('cardEntities2', { model: 'us-p', displayVersion: '6.3.0' });
        expect(page.hmiCard).to.equal('cardEntities');
        expect((page as any).maxItems).to.equal(5);
    });

    it('web panel: cardEntities2 without TFT version (web-l 5, web-p 8 rows), us models fall back', () => {
        const webL = makePage('cardEntities2', { isVirtual: true, model: 'web-l' }).page;
        expect(webL.hmiCard).to.equal('cardEntities2');
        expect((webL as any).maxItems).to.equal(5);
        const webP = makePage('cardEntities2', { isVirtual: true, model: 'web-p' }).page;
        expect(webP.hmiCard).to.equal('cardEntities2');
        expect((webP as any).maxItems).to.equal(8);
        const webEu = makePage('cardEntities2', { isVirtual: true, model: 'eu' }).page;
        expect(webEu.hmiCard).to.equal('cardEntities2');
        const webUs = makePage('cardEntities2', { isVirtual: true, model: 'us-l' }).page;
        expect(webUs.hmiCard).to.equal('cardEntities');
    });

    it('cardEntities stays cardEntities with 4 rows on a new TFT', async () => {
        const { page, sent } = makePage('cardEntities', NEW);
        expect(page.hmiCard).to.equal('cardEntities');
        expect((page as any).maxItems).to.equal(4);
        await page.update();
        expect(rowsOf(sent[0])).to.have.length(4);
    });
});
