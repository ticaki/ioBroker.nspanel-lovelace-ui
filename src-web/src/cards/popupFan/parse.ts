import type { ParseContext } from '../CardContract';
import { field } from '../../protocol/split';
import { optionalBoolean, optionalColor, optionalNumber } from '../popupSlider/fields';

export interface PopupFanModel {
    entityName: string;
    /** glyph of the entity icon */
    icon: string;
    /** RGB565 colour of the icon */
    iconColor: number | undefined;
    /** on/off state, undefined when unknown */
    power: boolean | undefined;
    /** speed 0..speedMax, undefined when the fan has no speed */
    speed: number | undefined;
    speedMax: number;
    /** heading of the speed slider */
    speedLabel: string;
    /** current mode, formatted by the adapter (may contain a line break) */
    mode: string;
    /** selectable modes in order; the display answers `mode-preset_modes,<index>` */
    modes: string[];
    /** true once an `entityUpdateDetail` arrived */
    received: boolean;
}

export function initial(): PopupFanModel {
    return {
        entityName: '',
        icon: '',
        iconColor: undefined,
        power: undefined,
        speed: undefined,
        speedMax: 100,
        speedLabel: '',
        mode: '',
        modes: [],
        received: false,
    };
}

/** Popups get no `entityUpd`, the model stays */
export function parseEntityUpd(_args: string[], prev: PopupFanModel, _ctx: ParseContext): PopupFanModel {
    return prev;
}

/**
 * `entityUpdateDetail~entityName~icon~iconColor~buttonstate~slider1~slider1Max~speedText~mode~modeList`
 * (see `getDetailPayload` case `popupFan` in `src/lib/pages/pageItem.ts`); `modeList` is `?` separated.
 */
export function parseEntityUpdateDetail(args: string[], _prev: PopupFanModel, _ctx: ParseContext): PopupFanModel {
    const list = field(args, 8);
    return {
        entityName: field(args, 0),
        icon: field(args, 1),
        iconColor: optionalColor(args[2]),
        power: optionalBoolean(args[3]),
        speed: optionalNumber(args[4]),
        speedMax: optionalNumber(args[5]) ?? 100,
        speedLabel: field(args, 6),
        mode: field(args, 7),
        modes: list === '' ? [] : list.split('?'),
        received: true,
    };
}
