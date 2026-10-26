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

/**
 * Number of entity slots a card shows, as the adapter sends them (`PageMenu.maxItems`).
 *
 * @param pageType the card
 * @param model the panel model (`us-p` has more room)
 */
export function menuSlotCount(pageType: string, model: PanelModel): number {
    switch (pageType) {
        case 'cardEntities':
            return model === 'us-p' ? 5 : 4;
        case 'cardSchedule':
        case 'cardGrid':
            return 6;
        case 'cardGrid2':
            return model === 'us-p' ? 9 : 8;
        case 'cardGrid3':
            return 4;
        default:
            return 4;
    }
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
