import { expect } from 'chai';
import { getPageAlexa } from './getAlexa';
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
    // minimal stub - only the members used by getPageAlexa
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

const echos: ViewRow[] = [
    { id: 'alexa2.1.Echo-Devices.G0KITCHEN', value: { common: { name: 'Küche' } } },
    { id: 'alexa2.1.Echo-Devices.G0LIVING', value: { common: { name: 'Wohnzimmer' } } },
];

function timerItems(gridItem: pages.PageBase): unknown[] {
    return (gridItem.pageItems ?? []).filter(i => !!i && 'type' in i && i.type === 'timer');
}

describe('lib/pages/tools - getPageAlexa timer item', () => {
    it('adds no timer item by default', async () => {
        const { configManager } = createConfigManager(echos);
        const res = await getPageAlexa(
            configManager,
            createPage('alexa2.1.Echo-Devices.G0KITCHEN'),
            createGridItem(),
            [],
        );
        expect(timerItems(res.gridItem)).to.have.length(0);
        const off = await getPageAlexa(
            configManager,
            createPage('alexa2.1.Echo-Devices.G0KITCHEN', { activateDefaultItems: { timer: false } }),
            createGridItem(),
            [],
        );
        expect(timerItems(off.gridItem)).to.have.length(0);
    });

    it('adds the timer item last, instance and serial from the media id, following the media device', async () => {
        const { configManager } = createConfigManager(echos);
        const res = await getPageAlexa(
            configManager,
            createPage('alexa2.1.Echo-Devices.G0KITCHEN', { activateDefaultItems: { timer: true } }),
            createGridItem(),
            [],
        );
        const items = res.gridItem.pageItems ?? [];
        const last = items[items.length - 1];
        expect(timerItems(res.gridItem)).to.have.length(1);
        expect(last).to.deep.include({
            role: 'timer',
            type: 'timer',
            alexaTimer: { instance: 'alexa2.1', serial: 'G0KITCHEN', followMedia: true },
        });
        expect(res.messages).to.deep.equal([]);
    });

    it('warns and adds no timer item when the media id is no Echo device', async () => {
        const { configManager, warnings } = createConfigManager([]);
        const res = await getPageAlexa(
            configManager,
            createPage('alexa2.1', { activateDefaultItems: { timer: true } }),
            createGridItem(),
            [],
        );
        expect(timerItems(res.gridItem)).to.have.length(0);
        expect(warnings).to.have.length(1);
        expect(res.messages[0]).to.contain('timer item needs an Echo device');
    });
});
