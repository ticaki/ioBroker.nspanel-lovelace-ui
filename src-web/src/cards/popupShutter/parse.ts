import type { ParseContext } from '../CardContract';
import { field } from '../../protocol/split';
import { isEnabled, optionalColor, optionalNumber } from '../popupSlider/fields';

/** A row of three buttons (up/stop/down or tilt open/stop/close) */
export interface ButtonTriple {
    /** glyphs, empty = no button */
    icons: [string, string, string];
    /** `enable` = the button can be pressed */
    enabled: [boolean, boolean, boolean];
}

/** Extra button of `popupShutter2` (entity2-4 of the item) */
export interface ExtraButton {
    icon: string;
    /** RGB565 */
    color: number | undefined;
    enabled: boolean;
}

export interface PopupShutterModel {
    entityName: string;
    /** position slider 0-100 (`popupShutter`: 100 = open, `popupShutter2`: 100 = closed); undefined = no slider */
    position: number | undefined;
    /** second row text (state, e.g. "open") */
    text: string;
    /** heading of the position slider */
    positionLabel: string;
    /** glyph of the entity icon */
    icon: string;
    /** up / stop / down */
    buttons: ButtonTriple;
    /** `popupShutter` only: heading of the tilt slider */
    tiltLabel: string;
    /** `popupShutter` only: tilt open / stop / close */
    tiltButtons: ButtonTriple;
    /** `popupShutter` only: tilt slider 0-100, undefined = no tilt */
    tilt: number | undefined;
    /** `popupShutter2` only: the three extra buttons (button1Press..button3Press) */
    extra: [ExtraButton, ExtraButton, ExtraButton];
    /** `popupShutter2` only: `shutter` (graphic of the window) */
    shutterType: string;
    /** `popupShutter2` only: the adapter option `shutterClosedIsZero` */
    closedIsZero: boolean;
    /** true once an `entityUpdateDetail` arrived */
    received: boolean;
}

function noButtons(): ButtonTriple {
    return { icons: ['', '', ''], enabled: [false, false, false] };
}

function noExtra(): ExtraButton {
    return { icon: '', color: undefined, enabled: false };
}

export function initial(): PopupShutterModel {
    return {
        entityName: '',
        position: undefined,
        text: '',
        positionLabel: '',
        icon: '',
        buttons: noButtons(),
        tiltLabel: '',
        tiltButtons: noButtons(),
        tilt: undefined,
        extra: [noExtra(), noExtra(), noExtra()],
        shutterType: 'shutter',
        closedIsZero: false,
        received: false,
    };
}

/** Popups get no `entityUpd`, the model stays */
export function parseEntityUpd(_args: string[], prev: PopupShutterModel, _ctx: ParseContext): PopupShutterModel {
    return prev;
}

/**
 * The adapter sends no icons for the buttons (the fields are empty on the emulator), the
 * HMI draws its own: arrow-up / stop / arrow-down for the position, arrow-top-right /
 * stop / arrow-bottom-left for the tilt and window-shutter-open / fraction-one-half /
 * window-shutter for the three extra buttons of popupShutter2.
 */
export const DEFAULT_ICONS = {
    /** arrow-up, stop, arrow-down (glyphs of `icon_mapping.ts`) */
    position: ['\u{e05c}', '\u{e4da}', '\u{e044}'] as const,
    /** arrow-top-right, stop, arrow-bottom-left */
    tilt: ['\u{e05b}', '\u{e4da}', '\u{e041}'] as const,
    /** window-shutter-open, fraction-one-half, window-shutter */
    extra: ['\u{f11d}', '\u{f991}', '\u{f11b}'] as const,
};

function triple(
    args: string[],
    iconOffset: number,
    statusOffset: number,
    defaults: readonly [string, string, string],
): ButtonTriple {
    const icons: [string, string, string] = [
        field(args, iconOffset) || defaults[0],
        field(args, iconOffset + 1) || defaults[1],
        field(args, iconOffset + 2) || defaults[2],
    ];
    return {
        icons,
        enabled: [
            icons[0] !== '' && isEnabled(args[statusOffset]),
            icons[1] !== '' && isEnabled(args[statusOffset + 1]),
            icons[2] !== '' && isEnabled(args[statusOffset + 2]),
        ],
    };
}

/**
 * `popupShutter`: `entityUpdateDetail~entityName~pos1~text2~pos1text~icon~iconL1~iconM1~iconR1~
 * statusL1~statusM1~statusR1~pos2text~iconL2~iconM2~iconR2~statusL2~statusM2~statusR2~pos2`
 *
 * `popupShutter2`: `entityUpdateDetail~entityName~pos1~text2~pos1text~icon~iconT1~iconM1~iconB1~
 * statusT1~statusM1~statusB1~iconT2~iconT2Color~iconT2Enable~iconM2~iconM2Color~iconM2Enable~
 * iconB2~iconB2Color~iconB2Enable~shutterTyp~shutterClosedIsZero`
 *
 * (see `getDetailPayload` in `src/lib/pages/pageItem.ts`)
 */
export function parseEntityUpdateDetail(
    args: string[],
    _prev: PopupShutterModel,
    ctx: ParseContext,
): PopupShutterModel {
    const base: PopupShutterModel = {
        ...initial(),
        entityName: field(args, 0),
        position: optionalNumber(args[1]),
        text: field(args, 2),
        positionLabel: field(args, 3),
        icon: field(args, 4),
        buttons: triple(args, 5, 8, DEFAULT_ICONS.position),
        received: true,
    };
    if (ctx.pageType === 'popupShutter2') {
        const extra = (o: number, fallback: string): ExtraButton => ({
            icon: field(args, o) || fallback,
            color: optionalColor(args[o + 1]),
            enabled: isEnabled(args[o + 2]),
        });
        return {
            ...base,
            extra: [
                extra(11, DEFAULT_ICONS.extra[0]),
                extra(14, DEFAULT_ICONS.extra[1]),
                extra(17, DEFAULT_ICONS.extra[2]),
            ],
            shutterType: field(args, 20) || 'shutter',
            closedIsZero: field(args, 21) === '1',
        };
    }
    return {
        ...base,
        tiltLabel: field(args, 11),
        tiltButtons: triple(args, 12, 15, DEFAULT_ICONS.tilt),
        tilt: optionalNumber(args[18]),
    };
}
