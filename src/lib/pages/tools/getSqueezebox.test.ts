import { expect } from 'chai';
import { getPageSqueezebox } from './getSqueezebox';
import type { ConfigManager } from '../../classes/config-manager';
import type * as pages from '../../types/pages';

type ViewRow = { id: string; value: { common: { name: string } } };

function createConfigManager(rows: ViewRow[]): { configManager: ConfigManager; warnings: string[] } {
    const warnings: string[] = [];
    const adapter = {
        language: 'de',
        log: { warn: (msg: string): void => void warnings.push(msg) },
        getObjectViewAsync: async (): Promise<{ rows: ViewRow[] }> => ({ rows }),
    };
    const fake = {
        adapter,
        getFieldAsDataItemConfig: async (): Promise<undefined> => undefined,
        getIconColor: async (): Promise<undefined> => undefined,
    };
    // minimal stub - only the members used by getPageSqueezebox
    return { configManager: fake as unknown as ConfigManager, warnings };
}

function createPage(id: string, extra: Partial<ScriptConfig.PageMediaItem> = {}): ScriptConfig.PageMedia {
    return {
        type: 'cardMedia',
        uniqueName: 'media-test',
        heading: 'Test',
        media: { id, ...extra },
        items: [],
    } as unknown as ScriptConfig.PageMedia;
}

function createGridItem(): pages.PageBase {
    return {
        uniqueID: 'media-test',
        dpInit: '',
        items: undefined,
        config: { card: 'cardMedia' },
    } as unknown as pages.PageBase;
}

const players: ViewRow[] = [
    { id: 'squeezeboxrpc.0.Players.Wohnzimmer', value: { common: { name: 'Wohnzimmer' } } },
    { id: 'squeezeboxrpc.0.Players.K_che', value: { common: { name: 'Küche' } } },
];

describe('lib/pages/tools - getPageSqueezebox', () => {
    it('rejects an id that is not a player device', async () => {
        const { configManager, warnings } = createConfigManager(players);
        const res = await getPageSqueezebox(
            configManager,
            createPage('squeezeboxrpc.0.Players.Bad'),
            createGridItem(),
            [],
        );
        expect(res.messages).to.have.length(1);
        expect(warnings).to.have.length(1);
        expect(res.messages[0]).to.contain('not a valid squeezeboxrpc player');
    });

    it('rejects an id outside of Players', async () => {
        const { configManager } = createConfigManager(players);
        const res = await getPageSqueezebox(configManager, createPage('squeezeboxrpc.0.Server'), createGridItem(), []);
        expect(res.messages[0]).to.contain('not a valid squeezeboxrpc player');
    });

    it('returns done for a valid player in justCheck mode', async () => {
        const { configManager } = createConfigManager(players);
        const res = await getPageSqueezebox(
            configManager,
            createPage('squeezeboxrpc.0.Players.Wohnzimmer'),
            createGridItem(),
            [],
            true,
        );
        expect(res.messages).to.deep.equal(['done']);
    });

    it('builds the media config with all default items', async () => {
        const { configManager } = createConfigManager(players);
        const res = await getPageSqueezebox(
            configManager,
            createPage('squeezeboxrpc.0.Players.Wohnzimmer'),
            createGridItem(),
            [],
        );
        const config = res.gridItem.config;
        expect(config?.card).to.equal('cardMedia');
        if (config?.card !== 'cardMedia') {
            return;
        }
        expect(config.ident).to.equal('squeezeboxrpc.0.Players.Wohnzimmer');
        const dpInit = res.gridItem.dpInit;
        expect(dpInit).to.be.instanceOf(RegExp);
        if (dpInit instanceof RegExp) {
            expect(dpInit.test('squeezeboxrpc.0.Players.Wohnzimmer.Volume')).to.equal(true);
            expect(dpInit.test('squeezeboxrpc.0.Players.Wohnzimmer2.Volume')).to.equal(false);
        }
        const roles = (res.gridItem.pageItems ?? []).map(p => ('role' in p ? p.role : undefined));
        expect(roles).to.include('SqueezeboxSpeaker');
        expect(roles).to.include('squeezebox-favorites');
        expect(roles).to.include('squeezebox-playlist');
        expect(roles).to.include('spotify-tracklist');
        expect(roles).to.include('repeatValue');
    });

    it('hides the speaker list when only one player matches the speakerList', async () => {
        const { configManager } = createConfigManager(players);
        const res = await getPageSqueezebox(
            configManager,
            createPage('squeezeboxrpc.0.Players.Wohnzimmer', { speakerList: ['Wohnzimmer'] }),
            createGridItem(),
            [],
        );
        const roles = (res.gridItem.pageItems ?? []).map(p => ('role' in p ? p.role : undefined));
        expect(roles).to.not.include('SqueezeboxSpeaker');
    });
});
