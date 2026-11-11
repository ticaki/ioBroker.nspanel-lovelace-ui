import type { PanelModel } from '../../protocol/types';
import { isPortrait } from '../../style/theme';

/** Geometry of `cardQR` on one model (stage pixels) */
export interface QRLayout {
    /** top left corner of the white QR box */
    code: { left: number; top: number };
    /** side of the QR box */
    codeSize: number;
    /** the two entity rows: left and right edge (distance from the right of the stage) and top */
    entities: readonly { left: number; right: number; top: number }[];
    /** height of an entity row (name line plus value line) */
    entityHeight: number;
    /**
     * `true`: the switch sits on the name line, right of the name (us-p HMI `btOnOff1` next to
     * `tEntity1`); `false`: below the name at the right (eu)
     */
    switchBesideName: boolean;
}

/** side of the white QR box in stage pixels */
export const QR_BOX = 200;

/* eu: the code on the left, the two entity rows on the right (measured on the emulator pictures) */
const EU: QRLayout = {
    code: { left: 12, top: 88 },
    codeSize: QR_BOX,
    entities: [
        { left: 230, right: 8, top: 96 },
        { left: 230, right: 8, top: 196 },
    ],
    entityHeight: 96,
    switchBesideName: false,
};

/*
 * Portrait (us-p 320x480, also web-p, which draws this card as us-p): objects of page `cardQR` of
 * `HMI/us-p/nspanel-us-p-v6.0.8.screensaver5.HMI`. The code `m0` (57,77 200x200, here centred on
 * the stage: 60) below the title bar, the entity rows below it: `tIcon1`/`tEntity1` at y 294 with
 * the switch `btOnOff1` (249,285) right of the name and the value `bText1` (y 342) below,
 * the second row 100 px lower (`tIcon2` y 393, `bText2` y 439). The icon is 11 px right of the
 * left edge of the row like on eu (`tIcon1` x 25 -> 36).
 */
const PORTRAIT: QRLayout = {
    code: { left: 60, top: 77 },
    codeSize: QR_BOX,
    entities: [
        { left: 36, right: 8, top: 294 },
        { left: 36, right: 8, top: 394 },
    ],
    entityHeight: 84,
    switchBesideName: true,
};

/**
 * The geometry of the QR page on a model: portrait models (us-p; web-p draws the card as us-p)
 * get the layout of the us-p HMI, the landscape models the eu layout.
 *
 * @param model the panel model the card sees
 */
export function qrLayout(model: PanelModel): QRLayout {
    return isPortrait(model) ? PORTRAIT : EU;
}
