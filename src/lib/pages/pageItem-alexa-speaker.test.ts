import { expect } from 'chai';
import { PageItem } from './pageItem';
import type { NSPanel } from '../types/NSPanel';

interface SpeakerFixture {
    item: PageItem;
    entry: NSPanel.PageItemDataItems;
    switched: { id: string; name: string }[];
    commands: { id: string; val: unknown }[];
}

const DEVICES = [
    { id: 'alexa2.0.Echo-Devices.G000AAA', name: 'Kitchen' },
    { id: 'alexa2.0.Echo-Devices.G000BBB', name: 'Living room' },
    { id: 'alexa2.0.Echo-Devices.G000CCC', name: 'Bedroom' },
];

/**
 * PageItem without constructor - only the fields setListCommand touches for the alexa speaker popup.
 *
 * @param opts options
 * @param opts.current index of the currently selected device
 * @param opts.playing player is playing
 * @param opts.devices devices in tempData
 * @returns the item, its entry and what was switched
 */
function makeItem(opts: { current: number; playing?: boolean; devices?: unknown[] }): SpeakerFixture {
    const noop = (): void => undefined;
    const switched: { id: string; name: string }[] = [];
    const commands: { id: string; val: unknown }[] = [];
    const devices = opts.devices ?? DEVICES;
    const parent = {
        card: 'cardMedia',
        currentItem: { ident: DEVICES[opts.current].id },
        items: [{ ident: DEVICES[0].id }],
        isPlaying: async (): Promise<boolean> => !!opts.playing,
        updateCurrentPlayer: async (id: string, name: string): Promise<void> => {
            switched.push({ id, name });
        },
    };
    const entry = {
        type: 'input_sel',
        role: 'alexa-speaker',
        data: {
            entityInSel: {
                value: { options: { dp: `${DEVICES[0].id}.Info.name` } },
                set: { options: { dp: `${DEVICES[0].id}.Player.controlPlay` } },
            },
        },
    } as unknown as NSPanel.PageItemDataItems;
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: 'test',
        log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
        adapter: {
            setForeignStateAsync: async (id: string, val: unknown): Promise<void> => {
                commands.push({ id, val });
            },
        },
        parent,
        tempData: devices,
        GeneratePopup: async (): Promise<null> => null,
        sendToPanel: noop,
    });
    return { item, entry, switched, commands };
}

describe('lib/pages/pageItem - alexa speaker popup', () => {
    it('switches to the chosen Echo with its device id', async () => {
        const { item, entry, switched } = makeItem({ current: 0 });
        expect(await item.setListCommand(entry, '2')).to.equal(true);
        expect(switched).to.deep.equal([DEVICES[2]]);
    });
    it('the first Echo of the list (index 0) can be chosen', async () => {
        const { item, entry, switched } = makeItem({ current: 1 });
        expect(await item.setListCommand(entry, '0')).to.equal(true);
        expect(switched).to.deep.equal([DEVICES[0]]);
    });
    it('moves the music to the chosen Echo while playing', async () => {
        const { item, entry, switched, commands } = makeItem({ current: 0, playing: true });
        await item.setListCommand(entry, '1');
        expect(commands).to.deep.equal([
            { id: `${DEVICES[0].id}.Commands.textCommand`, val: 'Schiebe Musik auf Living room' },
        ]);
        expect(switched).to.deep.equal([DEVICES[1]]);
    });
    it('an entry without an id does not switch the player', async () => {
        const { item, entry, switched } = makeItem({ current: 0, devices: [{ id: '', name: 'Broken' }] });
        await item.setListCommand(entry, '0');
        expect(switched).to.deep.equal([]);
    });
    it('the list shows the names and the current Echo', async () => {
        const { item, entry } = makeItem({ current: 1 });
        const data = entry.data;
        if (!data || !('entityInSel' in data)) {
            throw new Error('no entityInSel');
        }
        const list = await item.getListFromStates(data.entityInSel, undefined, 'alexa-speaker');
        expect(list.list).to.deep.equal(DEVICES.map(d => d.name));
        expect(list.value).to.equal('Living room');
    });
});
