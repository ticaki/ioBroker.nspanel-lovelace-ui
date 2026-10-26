import { isEmptyEntity } from '../../protocol/split';
import type { Entity6 } from '../../protocol/types';

/** entity types that open a popup on touch and the popup they request */
const POPUP_BY_TYPE: Readonly<Record<string, string>> = {
    input_sel: 'popupInSel',
    light: 'popupLight',
    light2: 'popupLight',
    shutter: 'popupShutter',
    fan: 'popupFan',
    timer: 'popupTimer',
    number: 'popupSlider',
    thermo: 'popupThermo',
};

/**
 * The event the display sends when an entity of the bottom row (or the logo) is touched -
 * the same rules as the entity buttons of cardGrid:
 * popup types request their popup, `switch` toggles, everything else is a plain button press.
 *
 * @param entity the touched entity
 * @returns `{ popup, id }` for a popup request, `{ id, action, value }` for a buttonPress2, undefined for nothing
 */
export function entityPressEvent(
    entity: Entity6,
): { popup: string; id: string } | { id: string; action: string; value?: string | number } | undefined {
    if (isEmptyEntity(entity) || entity.type === 'disabled' || entity.id === '') {
        return undefined;
    }
    const popup = POPUP_BY_TYPE[entity.type];
    if (popup) {
        return { popup, id: entity.id };
    }
    if (entity.type === 'switch') {
        return { id: entity.id, action: 'OnOff', value: entity.optionalValue === '1' ? 0 : 1 };
    }
    return { id: entity.id, action: 'button' };
}
