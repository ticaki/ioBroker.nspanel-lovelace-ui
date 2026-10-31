import { expect } from 'chai';
import type { panelConfigPartial } from '../controller/panel';
import type { PageBase } from '../types/pages';
import { isConfig } from '../const/config-manager-const';
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

/**
 * Adapter stub for ConfigManager.setScriptConfig() with a stored global configuration.
 *
 * @param globalConfigRaw The global script configuration.
 * @returns An object usable as adapter for setScriptConfig().
 */
function fakeScriptAdapter(globalConfigRaw: unknown): any {
    const noop = (): void => undefined;
    return {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'en',
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        config: { panels: [{ topic: 'panel/a', name: 'a' }], testCase: true },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<unknown> =>
            id === 'nspanel-lovelace-ui.0' ? { native: { globalConfigRaw: structuredClone(globalConfigRaw) } } : null,
        setForeignObjectAsync: async (): Promise<void> => undefined,
        setForeignObject: async (): Promise<void> => undefined,
        getObjectViewAsync: async (): Promise<{ rows: [] }> => ({ rows: [] }),
        getForeignStateAsync: async (): Promise<null> => null,
        getForeignStatesAsync: async (): Promise<Record<string, never>> => ({}),
    };
}

describe('lib/classes/config-manager - setScriptConfig with a global configuration', () => {
    const globalConfig = {
        type: 'globalConfig',
        version: '0.0.0',
        subPages: [
            { type: 'cardGrid', uniqueName: 'main', heading: 'global main', items: [] },
            { type: 'cardGrid', uniqueName: 'shared', heading: 'shared', items: [] },
        ],
        navigation: [],
    };

    it('keeps the main page of the panel script and does not report it as global', async () => {
        const manager = new ConfigManager(fakeScriptAdapter(globalConfig), true);
        const result = await manager.setScriptConfig({
            panelTopic: 'panel/a',
            panelName: 'a',
            version: '99.99.99',
            pages: [{ type: 'cardGrid', uniqueName: 'main', heading: 'local main', items: [] }],
            subPages: [],
        } as any);

        const panelConfig = result.panelConfig;
        expect(panelConfig).to.not.equal(undefined);
        const mains = (panelConfig?.pages ?? []).filter(p => p.uniqueID === 'main');
        expect(mains.length).to.equal(1);
        const headline = (mains[0].config as any)?.data?.headline;
        expect(headline?.constVal).to.equal('local main');
        expect(panelConfig?.globalPageIds).to.not.include('main');
        expect(panelConfig?.globalPageIds).to.include('shared');
        await manager.delete();
    });
});

describe('lib/classes/config-manager - getDefaultScriptConfig', () => {
    it('matches the version of the script template', () => {
        const version = ConfigManager.getTemplateScriptVersion();
        expect(version).to.match(/^\d+\.\d+\.\d+$/);
        expect(ConfigManager.getDefaultScriptConfig('panel/a').version).to.equal(version);
    });

    it('is a valid script configuration with an empty main page and no screensaver entries', () => {
        const config = ConfigManager.getDefaultScriptConfig('panel/a');
        expect(isConfig(config, fakeAdapter(['panel/a']))).to.equal(true);
        expect(config.panelTopic).to.equal('panel/a');
        expect(config.pages).to.have.length(1);
        expect(config.pages[0]).to.include({ type: 'cardGrid', uniqueName: 'main' });
        expect(config.favoritScreensaverEntity).to.deep.equal([]);
        expect(config.indicatorScreensaverEntity).to.deep.equal([]);
    });

    it('converts to a panel configuration with the main page and without version warnings', async () => {
        const manager = new ConfigManager(fakeScriptAdapter(undefined), true);
        const result = await manager.setScriptConfig(ConfigManager.getDefaultScriptConfig('panel/a'));

        expect(result.panelConfig).to.not.equal(undefined);
        // no script behind the adapter default configuration - its version is not checked
        expect(result.messages[0]).to.match(/^Panel .* without script - admin configuration only$/);
        expect(result.messages.some(m => /Update|too low|higher/.test(m))).to.equal(false);
        expect((result.panelConfig?.pages ?? []).map(p => p.uniqueID)).to.include('main');
        await manager.delete();
    });

    it('has no placeholder page for a panel marked "panel uses no script"', () => {
        const config = ConfigManager.getDefaultScriptConfig('panel/a', true);
        expect(isConfig(config, fakeAdapter(['panel/a']))).to.equal(true);
        expect(config.pages).to.deep.equal([]);
    });

    it('skips the version check of a script for a panel marked "panel uses no script"', async () => {
        const adapter = fakeScriptAdapter(undefined);
        adapter.config.panels[0].noScript = true;
        const manager = new ConfigManager(adapter, true);
        const config = {
            ...ConfigManager.getDefaultScriptConfig('panel/a'),
            scriptName: 'script.js.x',
            version: '0.6.0',
        };
        const result = await manager.setScriptConfig(config);
        expect(result.panelConfig).to.not.equal(undefined);
        expect(result.messages[0]).to.match(/without script - admin configuration only$/);
        expect(result.messages.some(m => /Update/.test(m))).to.equal(false);
        await manager.delete();
    });
});
