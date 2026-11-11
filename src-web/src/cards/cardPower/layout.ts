import type { PanelModel } from '../../protocol/types';
import { isPortrait } from '../../style/theme';

/** A rectangle in stage pixels */
export interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

/** Where one item around the house is drawn */
export interface PowerSlotGeometry {
    /** the square icon box (outer size) */
    box: Box;
    /** the flow line between box and house, 2 px thick */
    line: Box;
    /** `true`: the line runs top to bottom (portrait), the dot moves along y */
    vertical: boolean;
    /**
     * `true` when the start of the line (left / top end) is the item, i.e. a flow towards the
     * house moves the dot in the direction of the line
     */
    startsAtItem: boolean;
    /** text box of the name (single line); `undefined`: the layout shows no name (us-p HMI) */
    name: Box | undefined;
    /** text box of the value (single line) */
    value: Box;
}

/** Geometry of `cardPower` on one model (stage pixels) */
export interface PowerLayout {
    /** the house (outer size including the border) */
    home: Box;
    /** portrait: the house is a wide bar, the two values left and right of the icon */
    wideHome: boolean;
    /** the six items in the order of the payload */
    slots: readonly PowerSlotGeometry[];
}

/** a flow line starts 6 px after the element it comes from and ends 10 px before the next */
const LINE_GAP_START = 6;
const LINE_GAP_END = 10;
export const LINE_THICKNESS = 2;
/** the square icon boxes of the items (outer size) */
export const SLOT_BOX = 60;
/** one text line (17 px font) */
export const TEXT_LINE = 20;

/*
 * eu: measured on the emulator picture of the HMI (480x320). The house is a tall box in the
 * middle, three items left and three right of it, each with a horizontal line to the house, the
 * name above and the value below the line.
 */
const HOME_EU: Box = { left: 198, top: 70, width: 60, height: 230 };
const ROWS_EU = [110, 186, 262] as const;
const SLOT_LEFT_EU = 18;
const SLOT_RIGHT_EU = 378;
/** name above the line: box bottom 10 px above the line; value below the line */
const NAME_TOP_EU = -31;
const VALUE_TOP_EU = 12;

function slotEu(index: number): PowerSlotGeometry {
    const left = index < 3;
    const row = ROWS_EU[index % 3];
    const boxLeft = left ? SLOT_LEFT_EU : SLOT_RIGHT_EU;
    const lineLeft = left ? SLOT_LEFT_EU + SLOT_BOX + LINE_GAP_START : HOME_EU.left + HOME_EU.width + LINE_GAP_START;
    const lineRight = left ? HOME_EU.left - LINE_GAP_END : SLOT_RIGHT_EU - LINE_GAP_END;
    const width = lineRight - lineLeft;
    return {
        box: { left: boxLeft, top: row - SLOT_BOX / 2, width: SLOT_BOX, height: SLOT_BOX },
        line: { left: lineLeft, top: row - LINE_THICKNESS / 2, width, height: LINE_THICKNESS },
        vertical: false,
        startsAtItem: left,
        name: { left: lineLeft, top: row + NAME_TOP_EU, width, height: TEXT_LINE },
        value: { left: lineLeft, top: row + VALUE_TOP_EU, width, height: TEXT_LINE },
    };
}

/*
 * Portrait (us-p 320x480, also web-p, which draws this card as us-p): objects of page `cardPower`
 * of `HMI/us-p/nspanel-us-p-v6.0.8.screensaver5.HMI`. The house `t1` is a wide bar (46,244 230x60,
 * here centred: 45), the items 0…2 (`t0Icon`…`t2Icon`, 60x60 at y 108) in a row above it and the
 * items 3…5 (`t3Icon`…`t5Icon`, y 378) in a row below it, columns centred at x 80/160/240; the flow
 * lines `h0`…`h5` run vertically between item and house, the values `t0u`…`t5u` (80x30) sit above
 * the upper and below the lower row. The us-p HMI has no name field for the items (`t0o` is a variable).
 */
const HOME_PORTRAIT: Box = { left: 45, top: 244, width: 230, height: 60 };
const COLUMNS_PORTRAIT = [80, 160, 240] as const;
const BOX_TOP_PORTRAIT = [108, 378] as const;
/** y centre of the value above the upper row (`t0u` 77..107) and below the lower row (`t3u` 439..469) */
const VALUE_CENTER_PORTRAIT = [92, 454] as const;
const VALUE_WIDTH_PORTRAIT = 80;

function slotPortrait(index: number): PowerSlotGeometry {
    const upper = index < 3;
    const x = COLUMNS_PORTRAIT[index % 3];
    const boxTop = BOX_TOP_PORTRAIT[upper ? 0 : 1];
    const lineTop = upper
        ? boxTop + SLOT_BOX + LINE_GAP_START
        : HOME_PORTRAIT.top + HOME_PORTRAIT.height + LINE_GAP_START;
    const lineBottom = upper ? HOME_PORTRAIT.top - LINE_GAP_END : boxTop - LINE_GAP_END;
    const valueCenter = VALUE_CENTER_PORTRAIT[upper ? 0 : 1];
    return {
        box: { left: x - SLOT_BOX / 2, top: boxTop, width: SLOT_BOX, height: SLOT_BOX },
        line: { left: x - LINE_THICKNESS / 2, top: lineTop, width: LINE_THICKNESS, height: lineBottom - lineTop },
        vertical: true,
        startsAtItem: upper,
        name: undefined,
        value: {
            left: x - VALUE_WIDTH_PORTRAIT / 2,
            top: valueCenter - TEXT_LINE / 2,
            width: VALUE_WIDTH_PORTRAIT,
            height: TEXT_LINE,
        },
    };
}

const EU: PowerLayout = { home: HOME_EU, wideHome: false, slots: [0, 1, 2, 3, 4, 5].map(slotEu) };
const PORTRAIT: PowerLayout = { home: HOME_PORTRAIT, wideHome: true, slots: [0, 1, 2, 3, 4, 5].map(slotPortrait) };

/**
 * The geometry of the power page on a model: portrait models (us-p; web-p draws the card as us-p)
 * get the layout of the us-p HMI, the landscape models the eu layout.
 *
 * @param model the panel model the card sees
 */
export function powerLayout(model: PanelModel): PowerLayout {
    return isPortrait(model) ? PORTRAIT : EU;
}
