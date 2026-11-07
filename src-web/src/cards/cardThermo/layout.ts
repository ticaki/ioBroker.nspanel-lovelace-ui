import type { PanelModel } from '../../protocol/types';
import { isPortrait } from '../../style/theme';

/** A point in stage pixels */
export interface Point {
    x: number;
    y: number;
}

/** A text line of the info block: label / value, centred in `width` */
export interface TextBox {
    left: number;
    top: number;
    width: number;
}

/** One target temperature with its two arrows */
export interface TargetGeometry {
    /** centre of the digits */
    x: number;
    y: number;
    /** centre of the arrow down / up */
    down: Point;
    up: Point;
    /** size of the chevron and of its touch area */
    arrowSize: number;
    arrowHit: number;
    digitsFont: number;
    unitFont: number;
    /** horizontal shift of the digits (compact: digits and unit together are centred) */
    digitsShift: number;
    /** the unit sits top aligned right of the digits: offset from the top, gap to the digits */
    unitTop: number;
    unitGap: number;
}

/** Geometry of `cardThermo` on one model (stage pixels) */
export interface ThermoLayout {
    /** label 1, value 1, label 2, value 2 */
    texts: readonly [TextBox, TextBox, TextBox, TextBox];
    /** single target (`dstTemp` only) */
    single: TargetGeometry;
    /** two targets (`dstTemp`, `temp2`) */
    dual: readonly [TargetGeometry, TargetGeometry];
    /** the detail button (three dots, opens popupThermo) */
    detail: Point & { size: number; hit: number };
    /** top left corner of the 8 hvac mode cells */
    actions: readonly Point[];
    actionWidth: number;
    actionHeight: number;
    actionIconSize: number;
}

/*
 * eu: measured on the emulator picture of the HMI (480x320). Label and value on the left, the target
 * with the arrows left and right of it in the centre right, the 8 mode icons in one row at the bottom.
 */
const TEXT_EU = { left: 0, width: 140 } as const;
const TARGET_Y_EU = 163;
const DUAL_ARROW_OFFSET = 68;

function dualEu(x: number): TargetGeometry {
    return {
        x,
        y: TARGET_Y_EU,
        down: { x: x - DUAL_ARROW_OFFSET, y: TARGET_Y_EU },
        up: { x: x + DUAL_ARROW_OFFSET, y: TARGET_Y_EU },
        arrowSize: 40,
        arrowHit: 48,
        digitsFont: 32,
        unitFont: 13,
        digitsShift: -8,
        unitTop: 2,
        unitGap: 3,
    };
}

const EU: ThermoLayout = {
    texts: [
        { ...TEXT_EU, top: 90 },
        { ...TEXT_EU, top: 124 },
        { ...TEXT_EU, top: 159 },
        { ...TEXT_EU, top: 192 },
    ],
    single: {
        x: 277,
        y: TARGET_Y_EU,
        down: { x: 173, y: TARGET_Y_EU },
        up: { x: 401, y: TARGET_Y_EU },
        // the chevrons of the HMI are big: 33 px wide
        arrowSize: 68,
        arrowHit: 72,
        digitsFont: 62,
        unitFont: 18,
        digitsShift: 0,
        unitTop: 4,
        unitGap: 6,
    },
    dual: [dualEu(228), dualEu(390)],
    detail: { x: 278, y: 224, size: 42, hit: 48 },
    // 8 fixed slots of 54 px, 8 px from the left edge
    actions: Array.from({ length: 8 }, (_, i) => ({ x: 8 + i * 54, y: 252 })),
    actionWidth: 54,
    actionHeight: 56,
    actionIconSize: 44,
};

/*
 * Portrait (us-p 320x480, also web-p, which draws this card as us-p): objects of page `cardThermo`
 * of `HMI/us-p/nspanel-us-p-v6.0.8.screensaver5.HMI`, centres rounded.
 * - `tCurTempLbl`/`tCurTemp` (36,79 / 37,113, 115 wide) and `tStateLbl`/`tStatus` (167,79 / 166,113)
 *   as two columns below the title bar,
 * - single target `xTempDest` (89,243 120x60) with `btDown` (16,239) left and `btUp` (239,239) right,
 *   65x65 arrows,
 * - two targets `xTempDest2` (13,228) / `xTempDest1` (166,228), each with its arrow up above
 *   (`bUp2` 49,177 / `btUp1` 202,177) and its arrow down below (`bDown2` 49,289 / `btDown1` 202,289),
 * - `btDetail` (126,308 50x50),
 * - the mode buttons `bt0`…`bt7` (50x50) as two rows of four: x 32/100/168/236, y 368/423.
 */
const TEXT_PORTRAIT = { width: 128 } as const;
const PORTRAIT_COLUMNS = [94, 224] as const;
const DUAL_PORTRAIT_X = [73, 226] as const;

function dualPortrait(x: number): TargetGeometry {
    return {
        x,
        y: 258,
        down: { x, y: 314 },
        up: { x, y: 202 },
        arrowSize: 40,
        arrowHit: 48,
        digitsFont: 40,
        unitFont: 15,
        digitsShift: -8,
        unitTop: 2,
        unitGap: 3,
    };
}

const PORTRAIT: ThermoLayout = {
    texts: [
        { ...TEXT_PORTRAIT, left: PORTRAIT_COLUMNS[0] - TEXT_PORTRAIT.width / 2, top: 84 },
        { ...TEXT_PORTRAIT, left: PORTRAIT_COLUMNS[0] - TEXT_PORTRAIT.width / 2, top: 118 },
        { ...TEXT_PORTRAIT, left: PORTRAIT_COLUMNS[1] - TEXT_PORTRAIT.width / 2, top: 84 },
        { ...TEXT_PORTRAIT, left: PORTRAIT_COLUMNS[1] - TEXT_PORTRAIT.width / 2, top: 118 },
    ],
    single: {
        x: 149,
        y: 273,
        down: { x: 48, y: 271 },
        up: { x: 271, y: 271 },
        // 65 px arrows instead of the 75 px of eu
        arrowSize: 58,
        arrowHit: 62,
        digitsFont: 62,
        unitFont: 18,
        digitsShift: 0,
        unitTop: 4,
        unitGap: 6,
    },
    dual: [dualPortrait(DUAL_PORTRAIT_X[0]), dualPortrait(DUAL_PORTRAIT_X[1])],
    detail: { x: 151, y: 333, size: 42, hit: 48 },
    // cells of 54 x 54 around the centres x 57/125/193/261, y 393/448
    actions: Array.from({ length: 8 }, (_, i) => ({ x: 57 + (i % 4) * 68 - 27, y: (i < 4 ? 393 : 448) - 27 })),
    actionWidth: 54,
    actionHeight: 54,
    actionIconSize: 44,
};

/**
 * The geometry of the thermostat page on a model: portrait models (us-p; web-p draws the card as
 * us-p) get the layout of the us-p HMI, the landscape models the eu layout.
 *
 * @param model the panel model the card sees
 */
export function thermoLayout(model: PanelModel): ThermoLayout {
    return isPortrait(model) ? PORTRAIT : EU;
}
