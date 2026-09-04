import { expect } from 'chai';
import { normalizeTrashItems, trashItemCount, type TrashItem } from './adminShareConfig';

describe('lib/types - normalizeTrashItems', () => {
    it('builds a full set of defaults for an entry without items', () => {
        // Entries written before the single fields per waste type became an array carry no items.
        const items = normalizeTrashItems(undefined);

        expect(items.length).to.equal(trashItemCount);
        for (const item of items) {
            expect(item.textTrash).to.equal('');
            expect(item.customTrash).to.equal('');
            expect(item.icon).to.equal('');
            expect(item.iconColor).to.match(/^#[0-9a-f]{6}$/);
        }
    });

    it('fills up a shortened list without touching the stored entries', () => {
        const stored: TrashItem[] = [{ textTrash: 'Papier', customTrash: 'Blau', iconColor: '#123456', icon: 'trash' }];

        const items = normalizeTrashItems(stored);

        expect(items.length).to.equal(trashItemCount);
        expect(items[0]).to.deep.equal(stored[0]);
        expect(items[1].textTrash).to.equal('');
    });

    it('completes an item that only carries some of its fields', () => {
        const stored = [{ textTrash: 'Bio' }] as unknown as TrashItem[];

        const items = normalizeTrashItems(stored);

        expect(items[0].textTrash).to.equal('Bio');
        expect(items[0].customTrash).to.equal('');
        expect(items[0].iconColor, 'default colour of the first waste type').to.equal('#3c3fff');
    });

    it('keeps a complete list unchanged', () => {
        const stored: TrashItem[] = Array.from({ length: trashItemCount }, (_, i) => ({
            textTrash: `t${i}`,
            customTrash: `c${i}`,
            iconColor: '#000000',
            icon: 'i',
        }));

        expect(normalizeTrashItems(stored)).to.deep.equal(stored);
    });

    it('does not modify the array it was given', () => {
        const stored: TrashItem[] = [];

        normalizeTrashItems(stored);

        expect(stored.length).to.equal(0);
    });
});
