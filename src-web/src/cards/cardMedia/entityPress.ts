import { isEmptyEntity } from '../../protocol/split';
import type { Entity6 } from '../../protocol/types';
import type { CardProps } from '../CardContract';
import type { PressableProps } from '../cardEntities/shared/Pressable';

/** pages whose entity buttons are handled here: the bottom row and logo of cardMedia, the slots of cardThermo2 */
export type EntityPage = 'cardMedia' | 'cardThermo2';

/** hold time of the `tmLP` timer of the page in the HMI (attribute `tim`, HMI v6.0.2) */
export const ENTITY_LONG_PRESS_MS: Readonly<Record<EntityPage, number>> = {
    cardMedia: 500,
    cardThermo2: 300,
};

/** the popup a type requests - the `pageOpenDetail` value the popup page of the HMI sends */
const POPUP_BY_TYPE: Readonly<Record<string, string>> = {
    light: 'popupLight',
    // the HMI page popupLight2 sends `pageOpenDetail,popupLight,...` too
    light2: 'popupLight',
    fan: 'popupFan',
    number: 'popupSlider',
    slider: 'popupSlider',
    shutter: 'popupShutter',
    shutter2: 'popupShutter2',
    input_sel: 'popupInSel',
    media_pl: 'popupInSel',
    timer: 'popupTimer',
};

/**
 * Types whose popup the HMI opens already when the finger touches the button (`page popup…` in the
 * touch-down code of `bEntityN`). The page change also swallows the release, so no button press follows.
 */
const POPUP_ON_TOUCH: Readonly<Record<EntityPage, readonly string[]>> = {
    cardMedia: ['shutter', 'shutter2', 'input_sel', 'media_pl', 'slider', 'number', 'timer'],
    cardThermo2: ['shutter', 'shutter2', 'input_sel', 'timer'],
};

/** Types whose popup the `tmLP` timer opens when the button is held (same on both pages) */
const POPUP_ON_HOLD: readonly string[] = ['light', 'light2', 'fan', 'number'];

/** What a touched entity button does */
export interface EntityTouch {
    /** entity id */
    id: string;
    /** popup opened by a tap (HMI: on touch-down), the tap sends nothing else */
    tapPopup?: string;
    /** popup opened when the button is held for {@link ENTITY_LONG_PRESS_MS}; then the release sends nothing */
    holdPopup?: string;
}

/**
 * Touch of an entity button on cardMedia (bottom row and logo) or cardThermo2 (slots around the ring),
 * as the HMI does it:
 *
 * - touch-down starts `tmLP` and opens the popup of the "touch" types at once (see {@link POPUP_ON_TOUCH});
 * - the `tmLP` timer opens the popup of light, light2, fan and number when the button is held;
 * - the release sends `event,buttonPress2,<id>,button` - a normal press - unless a popup was opened.
 *
 * A held button of any other type therefore still sends the normal press on release.
 *
 * @param page the page the button is on
 * @param entity the touched entity
 * @returns what the button does, undefined for an empty or disabled slot
 */
export function entityTouch(page: EntityPage, entity: Entity6): EntityTouch | undefined {
    if (isEmptyEntity(entity) || entity.type === 'disabled' || entity.id === '') {
        return undefined;
    }
    const popup = POPUP_BY_TYPE[entity.type];
    if (popup && POPUP_ON_TOUCH[page].includes(entity.type)) {
        return { id: entity.id, tapPopup: popup };
    }
    if (popup && POPUP_ON_HOLD.includes(entity.type)) {
        return { id: entity.id, holdPopup: popup };
    }
    return { id: entity.id };
}

/** the card callbacks an entity button needs */
export type EntityPressActions = Pick<CardProps<unknown>, 'press' | 'openPopup'>;

/** the touch handlers of a {@link Pressable} entity button */
export type EntityPressProps = Pick<PressableProps, 'onPress' | 'onLongPress' | 'longPressMs'>;

/**
 * Pressable handlers for an entity button, see {@link entityTouch}: a tap sends the normal press
 * (`event,buttonPress2,<id>,button`) or opens the popup of a "touch" type, holding a light, light2,
 * fan or number opens its popup after the `tmLP` time of the page.
 *
 * @param page the page the button is on
 * @param entity the entity of the button
 * @param actions the card callbacks
 * @returns the handlers, undefined for an empty or disabled slot
 */
export function entityPressProps(
    page: EntityPage,
    entity: Entity6,
    actions: EntityPressActions,
): EntityPressProps | undefined {
    const touch = entityTouch(page, entity);
    if (!touch) {
        return undefined;
    }
    const open =
        (popup: string): (() => void) =>
        (): void =>
            actions.openPopup(popup, touch.id, entity.displayName, entity.icon, entity.iconColor);
    if (touch.tapPopup) {
        return { onPress: open(touch.tapPopup) };
    }
    const onPress = (): void => actions.press(touch.id, 'button');
    if (touch.holdPopup) {
        return { onPress, onLongPress: open(touch.holdPopup), longPressMs: ENTITY_LONG_PRESS_MS[page] };
    }
    return { onPress };
}
