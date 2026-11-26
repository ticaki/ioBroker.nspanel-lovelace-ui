import { expect } from 'chai';
import { PageItem } from './pageItem';
import type { NSPanel } from '../types/NSPanel';

const KITCHEN = 'alexa2.0.Echo-Devices.G000AAA';
const LIVING = 'alexa2.0.Echo-Devices.G000BBB';

interface PlaylistFixture {
    item: PageItem;
    parent: { card: string; currentItem: { ident: string } | undefined; items: { ident: string }[] };
    entry: NSPanel.PageItemDataItems;
    queried: string[];
}

/**
 * PageItem without constructor - only the fields getListFromStates touches for the alexa playlist popup.
 *
 * @param current ident of the currently selected Echo device
 * @returns the item, its media page mock, its entry and the queried patterns
 */
function makeItem(current: string | undefined): PlaylistFixture {
    const noop = (): void => undefined;
    const queried: string[] = [];
    const parent = {
        card: 'cardMedia',
        currentItem: current ? { ident: current } : undefined,
        items: [{ ident: KITCHEN }],
    };
    const valueList = { getObject: async (): Promise<unknown> => ['Amazon-Music-Playlist.My Mix'] };
    const entry = {
        type: 'input_sel',
        role: 'alexa-playlist',
        data: {
            entityInSel: { value: { options: {} } },
            valueList,
        },
    } as unknown as NSPanel.PageItemDataItems;
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: 'test',
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        adapter: {
            getForeignStatesAsync: async (pattern: string): Promise<Record<string, unknown>> => {
                queried.push(pattern);
                const device = pattern.replace('.Music-Provider.*', '');
                return { [`${device}.Music-Provider.Amazon-Music-Playlist`]: { val: '' } };
            },
        },
        parent,
        dataItems: entry,
        // filled by init() with the device that was current back then
        tempData: [`${KITCHEN}.Music-Provider.Amazon-Music-Playlist`],
    });
    return { item, parent, entry, queried };
}

/**
 * Calls getListFromStates for the playlist entry.
 *
 * @param fixture the test item
 * @returns the list
 */
async function getList(fixture: PlaylistFixture): Promise<{ list?: string[]; states?: string[] }> {
    const data = fixture.entry.data;
    if (!data || !('entityInSel' in data)) {
        throw new Error('no entityInSel');
    }
    return fixture.item.getListFromStates(data.entityInSel, undefined, 'alexa-playlist');
}

describe('lib/pages/pageItem - alexa playlist popup', () => {
    it('uses the Music-Provider states of the current Echo device', async () => {
        const fixture = makeItem(KITCHEN);
        const list = await getList(fixture);
        expect(list.list).to.deep.equal(['My Mix']);
        expect(list.states).to.deep.equal([`${KITCHEN}.Music-Provider.Amazon-Music-Playlist`]);
    });
    it('after switching the Echo device the states of the new device are used', async () => {
        const fixture = makeItem(KITCHEN);
        await getList(fixture);
        fixture.parent.currentItem = { ident: LIVING };
        const list = await getList(fixture);
        expect(fixture.queried[fixture.queried.length - 1]).to.equal(`${LIVING}.Music-Provider.*`);
        expect(list.states).to.deep.equal([`${LIVING}.Music-Provider.Amazon-Music-Playlist`]);
        expect(fixture.item.tempData).to.deep.equal([`${LIVING}.Music-Provider.Amazon-Music-Playlist`]);
    });
    it('without a current device the first item is used', async () => {
        const fixture = makeItem(undefined);
        const list = await getList(fixture);
        expect(fixture.queried).to.deep.equal([`${KITCHEN}.Music-Provider.*`]);
        expect(list.states).to.deep.equal([`${KITCHEN}.Music-Provider.Amazon-Music-Playlist`]);
    });
});
