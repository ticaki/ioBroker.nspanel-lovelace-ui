import { expect } from 'chai';
import { collectPageStates, emptyStateNode, mergeStateInfo } from './page-states';

/**
 * A `data` object of a page item that reads the given states.
 *
 * @param ids State ids the item reads, spread over a few fields.
 * @returns The data object.
 */
function itemData(...ids: string[]): { data: Record<string, any> } {
    const data: Record<string, any> = {};
    ids.forEach((dp, i) => {
        data[`field${i}`] = { true: { value: { type: 'triggered', dp } } };
    });
    return { data };
}

describe('lib/configuration - collectPageStates', () => {
    it('reports a single state as a state, not as a channel', () => {
        // A button wired to one state - the light pages of the reporting installation look like this.
        const states = collectPageStates([itemData('alias.0.NSPanel.Beleuchtung.Abstellraum.SET')]);

        expect(states).to.deep.equal([emptyStateNode('alias.0.NSPanel.Beleuchtung.Abstellraum.SET', false)]);
    });

    it('folds the states of one item into their common channel', () => {
        // A shutter item reads ACTUAL/SET/OPEN/CLOSE of the same channel.
        const states = collectPageStates([
            itemData(
                'alias.0.zuhause.og.Küche.Küche_Rollladen.ACTUAL',
                'alias.0.zuhause.og.Küche.Küche_Rollladen.SET',
                'alias.0.zuhause.og.Küche.Küche_Rollladen.OPEN',
            ),
        ]);

        expect(states).to.deep.equal([
            { ...emptyStateNode('alias.0.zuhause.og.Küche.Küche_Rollladen', true), states: ['ACTUAL', 'SET', 'OPEN'] },
        ]);
    });

    it('keeps one node per item, not one per page', () => {
        const states = collectPageStates([
            itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET'),
            itemData('alias.0.b.room.ACTUAL', 'alias.0.b.room.SET'),
        ]);

        expect(states.map(s => s.id)).to.deep.equal(['alias.0.a.room', 'alias.0.b.room']);
    });

    it('reports a channel used by two items only once', () => {
        const states = collectPageStates([
            itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET'),
            itemData('alias.0.a.room.OPEN', 'alias.0.a.room.CLOSE'),
        ]);

        expect(states.map(x => ({ id: x.id, isChannel: x.isChannel }))).to.deep.equal([
            { id: 'alias.0.a.room', isChannel: true },
        ]);
        expect(states[0].states, 'states of both items are merged').to.deep.equal(['ACTUAL', 'SET', 'OPEN', 'CLOSE']);
    });

    it('keeps a channel a channel when another item uses a single state of it', () => {
        const states = collectPageStates([itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET')]);
        const again = collectPageStates([
            ...[itemData('alias.0.a.room')],
            ...[itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET')],
        ]);

        expect(states[0].isChannel).to.equal(true);
        expect(again[0].id).to.equal('alias.0.a.room');
        expect(again[0].isChannel).to.equal(true);
    });

    it('does not invent a channel from unrelated states', () => {
        // Nothing in common but adapter and instance - folding these would name a whole instance.
        const states = collectPageStates([itemData('sonos.0.player.volume', 'sonos.0.other.mute')]);

        expect(states.map(s => s.id)).to.deep.equal(['sonos.0.player.volume', 'sonos.0.other.mute']);
        expect(states.every(s => !s.isChannel)).to.equal(true);
    });

    it('ignores items without any state', () => {
        expect(collectPageStates([undefined, null, {}, itemData()])).to.deep.equal([]);
    });
});

describe('lib/configuration - state node info', () => {
    it('keeps role and type of the item using a channel', () => {
        const states = collectPageStates([
            { ...itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET'), role: 'shutter', type: 'button' },
        ]);

        expect(states[0].roles).to.deep.equal(['shutter']);
        expect(states[0].types).to.deep.equal(['button']);
    });

    it('collects the roles of every item on the same channel', () => {
        const states = collectPageStates([
            { ...itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET'), role: 'shutter' },
            { ...itemData('alias.0.a.room.OPEN', 'alias.0.a.room.CLOSE'), role: 'button' },
        ]);

        expect(states[0].roles).to.deep.equal(['shutter', 'button']);
    });

    it('merges what two pages know about the same channel', () => {
        const first = collectPageStates([
            { ...itemData('alias.0.a.room.ACTUAL', 'alias.0.a.room.SET'), role: 'shutter' },
        ]);
        const second = collectPageStates([
            { ...itemData('alias.0.a.room.OPEN', 'alias.0.a.room.CLOSE'), role: 'button' },
        ]);

        const merged = mergeStateInfo(mergeStateInfo(undefined, first[0]), second[0]);

        expect(merged.roles).to.deep.equal(['shutter', 'button']);
        expect(merged.states).to.deep.equal(['ACTUAL', 'SET', 'OPEN', 'CLOSE']);
    });

    it('ignores a role that is not a string', () => {
        const states = collectPageStates([{ ...itemData('alias.0.a.b.c'), role: null, type: undefined }]);

        expect(states[0].roles).to.deep.equal([]);
        expect(states[0].types).to.deep.equal([]);
    });
});

describe('lib/configuration - page item settings', () => {
    /**
     * A button item with the icons of a light, as the configuration script writes them.
     *
     * @returns The page item.
     */
    function lightButton(): { data: Record<string, any>; role: string; type: string } {
        return {
            type: 'button',
            role: 'light',
            data: {
                headline: { type: 'const', constVal: 'Abstellraum' },
                icon: {
                    true: { value: { type: 'const', constVal: 'lightbulb' } },
                    false: { value: { type: 'const', constVal: 'lightbulb-outline' } },
                },
                entity1: { value: { type: 'triggered', dp: 'alias.0.NSPanel.Beleuchtung.Abstellraum.SET' } },
            },
        };
    }

    it('keeps caption and both icons of an item', () => {
        const states = collectPageStates([lightButton()]);

        expect(states[0].headlines).to.deep.equal(['Abstellraum']);
        expect(states[0].iconsTrue).to.deep.equal(['lightbulb']);
        expect(states[0].iconsFalse).to.deep.equal(['lightbulb-outline']);
    });

    it('ignores an icon that is read from a state', () => {
        const item = lightButton();
        item.data.icon.true.value = { type: 'triggered', dp: 'some.icon.state' };

        const states = collectPageStates([item]);

        expect(states[0].iconsTrue, 'no icon name is known upfront').to.deep.equal([]);
        expect(states[0].iconsFalse).to.deep.equal(['lightbulb-outline']);
    });

    it('reports the state an icon is read from', () => {
        const item = lightButton();
        item.data.icon.true.value = { type: 'triggered', dp: 'some.icon.state' };

        const states = collectPageStates([item]);

        expect(states[0].iconStatesTrue).to.deep.equal(['some.icon.state']);
        expect(states[0].iconStatesFalse, 'a constant icon is read from nowhere').to.deep.equal([]);
    });
});
