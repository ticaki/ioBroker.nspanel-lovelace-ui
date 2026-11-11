import { isEmptyEntity, parseEntityList, parseEntityUpdHeader } from '../../../protocol/split';
import type { Entity6, Navigation, PanelModel } from '../../../protocol/types';

/**
 * Model of the menu cards (cardEntities, cardSchedule, cardGrid, cardGrid2, cardGrid3):
 * `entityUpd~title~nav left (6)~nav right (6)~entity (6)…`
 */
export interface MenuPageModel {
    title: string;
    navigation: Navigation;
    /** the entity slots in the order they were sent, placeholders (`~~~~~`) included */
    entities: Entity6[];
}

export function initialMenuPage(): MenuPageModel {
    return {
        title: '',
        navigation: {
            left: { type: '', id: '', icon: '', iconColor: 65535, displayName: '', optionalValue: '' },
            right: { type: '', id: '', icon: '', iconColor: 65535, displayName: '', optionalValue: '' },
        },
        entities: [],
    };
}

/**
 * Parses an `entityUpd` of a menu card.
 *
 * @param args the fields after `entityUpd` (`args[0]` is the title)
 * @param max maximum number of entity slots that are kept, unlimited by default
 */
export function parseMenuEntityUpd(args: readonly string[], max = Infinity): MenuPageModel {
    const header = parseEntityUpdHeader(args);
    return {
        title: header.title,
        navigation: header.navigation,
        entities: parseEntityList(header.rest, 0, max),
    };
}

/** Entity slots per menu card and model, as the adapter sends them (`PageMenu.maxItems`) */
const MENU_SLOTS: Readonly<Record<string, Readonly<Record<PanelModel, number>>>> = {
    cardEntities: { eu: 4, 'us-l': 4, 'us-p': 5, 'web-l': 4, 'web-p': 8 },
    cardSchedule: { eu: 6, 'us-l': 6, 'us-p': 6, 'web-l': 6, 'web-p': 11 },
    cardGrid: { eu: 6, 'us-l': 6, 'us-p': 6, 'web-l': 8, 'web-p': 10 },
    cardGrid2: { eu: 8, 'us-l': 8, 'us-p': 9, 'web-l': 10, 'web-p': 15 },
    cardGrid3: { eu: 4, 'us-l': 4, 'us-p': 4, 'web-l': 6, 'web-p': 8 },
};

/**
 * Most entity slots a menu card has on any model - the parsers keep this many, the
 * component shows {@link menuSlotCount} of them.
 *
 * @param pageTypes the pageTypes of the card module
 */
export function maxMenuSlots(...pageTypes: readonly string[]): number {
    let max = 0;
    for (const pageType of pageTypes) {
        const slots = MENU_SLOTS[pageType];
        if (slots) {
            max = Math.max(max, ...Object.values(slots));
        }
    }
    return max;
}

/**
 * Number of entity slots a card shows, as the adapter sends them (`PageMenu.maxItems`),
 * see the table in `doc/web-panel/SMARTPHONE.md`.
 *
 * @param pageType the card
 * @param model the panel model
 */
export function menuSlotCount(pageType: string, model: PanelModel): number {
    return MENU_SLOTS[pageType]?.[model] ?? 4;
}

/**
 * The first `count` entity slots, padded with empty entities so the layout stays stable.
 *
 * @param entities the parsed entities
 * @param count number of slots of the card
 */
export function menuSlots(entities: readonly Entity6[], count: number): Entity6[] {
    const result: Entity6[] = [];
    for (let i = 0; i < count; i++) {
        const e = entities[i];
        result.push(e ?? { type: '', id: '', icon: '', iconColor: 65535, displayName: '', optionalValue: '' });
    }
    return result;
}

/** `true` when the slot is a placeholder that is not drawn (`~~~~~`, `delete`, `~delete~…`) */
export function isEmptySlot(entity: Entity6): boolean {
    return isEmptyEntity(entity) || entity.id === 'delete';
}
