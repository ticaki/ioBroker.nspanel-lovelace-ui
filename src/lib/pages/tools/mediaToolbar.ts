/**
 * Standard items of the bar of cardMedia (src/lib/pages/tools/get<Backend>.ts): each created item keeps the standard
 * item it belongs to, so the bar can be put in the order of `media.itemsOrder` at the end.
 */
import type { NSPanel } from '../../types/NSPanel';
import { isMediaToolbarItem, type MediaToolbarItem } from '../../types/adminShareConfig';

/** one created page item of the bar and the standard item it belongs to */
export type MediaToolbarEntry = { kind: MediaToolbarItem; item: NSPanel.PageItemDataItemsOptions };

/**
 * Adds the page items of one standard item to the bar.
 *
 * @param list bar collected so far
 * @param kind standard item the page items belong to
 * @param items page items in their order
 */
export function addMediaToolbarItem(
    list: MediaToolbarEntry[],
    kind: MediaToolbarItem,
    ...items: NSPanel.PageItemDataItemsOptions[]
): void {
    for (const item of items) {
        list.push({ kind, item });
    }
}

/**
 * The page items of the bar in the order of `itemsOrder`: the listed standard items first in that order, the others
 * behind them in the order they were added. Unknown and repeated entries are ignored; without a usable order the
 * bar stays as it was added. Page items of the same standard item keep their order among each other.
 *
 * @param list bar in the order the backend added it
 * @param itemsOrder `media.itemsOrder` of the script, may be anything
 * @returns the page items
 */
export function orderMediaToolbarItems(
    list: readonly MediaToolbarEntry[],
    itemsOrder: unknown,
): NSPanel.PageItemDataItemsOptions[] {
    const order: MediaToolbarItem[] = [];
    if (Array.isArray(itemsOrder)) {
        for (const entry of itemsOrder) {
            if (isMediaToolbarItem(entry) && !order.includes(entry)) {
                order.push(entry);
            }
        }
    }
    const rank = (kind: MediaToolbarItem): number => {
        const index = order.indexOf(kind);
        return index === -1 ? order.length : index;
    };
    // Array.prototype.sort is stable: equal ranks keep the order they were added in
    return [...list].sort((a, b) => rank(a.kind) - rank(b.kind)).map(entry => entry.item);
}
