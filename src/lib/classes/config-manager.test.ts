import { expect } from 'chai';
import type { panelConfigPartial } from '../controller/panel';
import type { PageBase } from '../types/pages';
import { ConfigManager } from './config-manager';

/**
 * Minimal adapter stub - ConfigManager.getConfig() only uses `config.panels`,
 * `config.testCase` and `log`.
 *
 * @param topics Topics of the configured panels.
 * @returns An object usable as adapter for getConfig().
 */
function fakeAdapter(topics: string[]): any {
    const noop = (): void => undefined;
    return {
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        config: { panels: topics.map(topic => ({ topic })), testCase: false },
    };
}

/**
 * A page for the given id.
 *
 * @param uniqueID Page id.
 * @param card Card type, defaults to cardGrid.
 * @returns The page.
 */
function page(uniqueID: string, card = 'cardGrid'): PageBase {
    return {
        uniqueID,
        dpInit: '',
        alwaysOn: 'none',
        config: { card, data: {} },
        pageItems: [],
    } as unknown as PageBase;
}

describe('lib/classes/config-manager - getConfig', () => {
    it('merges the pages of the other panels into every panel', async () => {
        const a: Partial<panelConfigPartial> = {
            topic: 'panel/a',
            pages: [page('screensaver', 'screensaver'), page('main'), page('kitchen')],
            navigation: [],
        };
        const b: Partial<panelConfigPartial> = {
            topic: 'panel/b',
            pages: [page('screensaver', 'screensaver'), page('bath')],
            navigation: [],
        };

        const result = await ConfigManager.getConfig(fakeAdapter(['panel/a', 'panel/b']), [a, b]);

        const idsA = result[0].pages.map(p => p.uniqueID);
        const idsB = result[1].pages.map(p => p.uniqueID);
        expect(idsA, 'panel A knows the pages of panel B').to.include('bath');
        expect(idsB, 'panel B knows the pages of panel A').to.include('kitchen');
    });

    it('does not merge the screensaver of another panel', async () => {
        const a: Partial<panelConfigPartial> = {
            topic: 'panel/a',
            pages: [page('screensaverA', 'screensaver')],
            navigation: [],
        };
        const b: Partial<panelConfigPartial> = {
            topic: 'panel/b',
            pages: [page('screensaverB', 'screensaver')],
            navigation: [],
        };

        const result = await ConfigManager.getConfig(fakeAdapter(['panel/a', 'panel/b']), [a, b]);

        expect(result[0].pages.map(p => p.uniqueID)).to.deep.equal(['screensaverA']);
        expect(result[1].pages.map(p => p.uniqueID)).to.deep.equal(['screensaverB']);
    });

    it('keeps a single page when both panels use the same id', async () => {
        const a: Partial<panelConfigPartial> = { topic: 'panel/a', pages: [page('main')], navigation: [] };
        const b: Partial<panelConfigPartial> = { topic: 'panel/b', pages: [page('main')], navigation: [] };

        const result = await ConfigManager.getConfig(fakeAdapter(['panel/a', 'panel/b']), [a, b]);

        expect(result[0].pages.filter(p => p.uniqueID === 'main').length).to.equal(1);
        expect(result[1].pages.filter(p => p.uniqueID === 'main').length).to.equal(1);
    });

    it('returns the panels in the order they were passed in', async () => {
        const a: Partial<panelConfigPartial> = { topic: 'panel/a', pages: [page('a1')], navigation: [] };
        const b: Partial<panelConfigPartial> = { topic: 'panel/b', pages: [page('b1')], navigation: [] };

        const result = await ConfigManager.getConfig(fakeAdapter(['panel/a', 'panel/b']), [a, b]);

        expect(result[0].topic).to.equal('panel/a');
        expect(result[1].topic).to.equal('panel/b');
    });
});
