import { expect } from 'chai';
import { addMediaToolbarItem, orderMediaToolbarItems, type MediaToolbarEntry } from './mediaToolbar';
import type { NSPanel } from '../../types/NSPanel';

function item(name: string): NSPanel.PageItemDataItemsOptions {
    return { role: name, type: 'text', data: {} } as unknown as NSPanel.PageItemDataItemsOptions;
}

function bar(): MediaToolbarEntry[] {
    const list: MediaToolbarEntry[] = [];
    addMediaToolbarItem(list, 'online', item('online'));
    addMediaToolbarItem(list, 'clock', item('clock'));
    addMediaToolbarItem(list, 'volumePresets', item('presets'), item('presets-group'));
    addMediaToolbarItem(list, 'repeat', item('repeat'));
    return list;
}

function roles(items: NSPanel.PageItemDataItemsOptions[]): unknown[] {
    return items.map(i => ('role' in i ? i.role : undefined));
}

describe('lib/pages/tools/mediaToolbar - orderMediaToolbarItems', () => {
    it('keeps the order of the backend without a usable order', () => {
        const added = ['online', 'clock', 'presets', 'presets-group', 'repeat'];
        expect(roles(orderMediaToolbarItems(bar(), undefined))).to.deep.equal(added);
        expect(roles(orderMediaToolbarItems(bar(), []))).to.deep.equal(added);
        expect(roles(orderMediaToolbarItems(bar(), 'clock'))).to.deep.equal(added);
        expect(roles(orderMediaToolbarItems(bar(), ['x', 3]))).to.deep.equal(added);
    });

    it('puts the listed items first, ignores unknown and repeated ones, keeps the others behind', () => {
        expect(roles(orderMediaToolbarItems(bar(), ['repeat', 'nope', 'volumePresets', 'repeat']))).to.deep.equal([
            'repeat',
            'presets',
            'presets-group',
            'online',
            'clock',
        ]);
    });

    it('ignores listed items the bar does not have', () => {
        expect(roles(orderMediaToolbarItems(bar(), ['equalizer', 'clock']))).to.deep.equal([
            'clock',
            'online',
            'presets',
            'presets-group',
            'repeat',
        ]);
    });
});
