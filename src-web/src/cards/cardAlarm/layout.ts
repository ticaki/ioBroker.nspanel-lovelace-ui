import type { PanelModel } from '../../protocol/types';
import { isPortrait, theme } from '../../style/theme';

/** A point in stage pixels */
export interface Point {
    x: number;
    y: number;
}

/** A rectangle in stage pixels */
export interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

/** Geometry of `cardAlarm` / `cardUnlock` on one model (stage pixels) */
export interface AlarmLayout {
    /** x centre of the three numpad columns */
    keyColumns: readonly number[];
    /** y centre of the four numpad rows */
    keyRows: readonly number[];
    keyWidth: number;
    keyHeight: number;
    /** centres of the four action buttons (`arm1` … `arm4`) */
    buttons: readonly Point[];
    buttonWidth: number;
    buttonHeight: number;
    /**
     * the text field with the entered PIN as asterisks. eu: in the title bar, it also shows the
     * title while no digit is entered; portrait: its own field below the title bar (`tCode`)
     */
    pinBox: Box;
    /** `true` when the title stays in the title bar (portrait), `false` when the PIN field shows it */
    titleInBar: boolean;
    /** status icon right of the PIN field */
    statusIcon: Point & { size: number };
    /** the optional button in the empty numpad cell left of `0` */
    corner: { left: number; top: number; size: number };
}

/*
 * eu: measured on the emulator pictures of the HMI (480x320). The PIN field and the status
 * icon share the title bar, the action buttons are a column right of the numpad.
 */
const KEY_ROWS_EU = [118, 176, 234, 290] as const;
const EU: AlarmLayout = {
    keyColumns: [62, 154, 246],
    keyRows: KEY_ROWS_EU,
    keyWidth: 80,
    keyHeight: 50,
    // text centred at x 367
    buttons: KEY_ROWS_EU.map(y => ({ x: 367, y })),
    buttonWidth: 134,
    buttonHeight: 50,
    pinBox: {
        left: 60,
        top: theme.titleBarCenter - theme.titleBarHeight / 2,
        width: 234,
        height: theme.titleBarHeight,
    },
    titleInBar: false,
    statusIcon: { x: 331, y: theme.titleBarCenter, size: 44 },
    corner: { left: 12, top: 268, size: 40 },
};

/*
 * Portrait (us-p 320x480, also web-p, which draws this card as us-p): objects of page `cardAlarm`
 * of `HMI/us-p/nspanel-us-p-v6.0.8.screensaver5.HMI`, centres rounded. Title in the title bar
 * (`tHeading`), PIN field `tCode` (23,73 192x49) and status icon `tIcon` (236,73 64x49) below it,
 * the four action buttons `arm1`…`arm4` (141x50) as a 2x2 block - arm1/arm2 left, arm3/arm4 right -
 * and the numpad (`b0`…`b11`, 75x50) at the bottom.
 */
const PORTRAIT: AlarmLayout = {
    keyColumns: [62, 154, 246],
    keyRows: [276, 335, 393, 449],
    keyWidth: 80,
    keyHeight: 50,
    buttons: [
        { x: 87, y: 157 },
        { x: 87, y: 218 },
        { x: 241, y: 157 },
        { x: 241, y: 218 },
    ],
    buttonWidth: 140,
    buttonHeight: 50,
    pinBox: { left: 23, top: 73, width: 192, height: 49 },
    titleInBar: true,
    statusIcon: { x: 268, y: 97, size: 44 },
    // b9: 24,424 - like on eu 12 px from the left and 2 px below the top of the cell
    corner: { left: 12, top: 426, size: 40 },
};

/**
 * The geometry of the alarm page on a model: portrait models (us-p; web-p draws the card as us-p)
 * get the layout of the us-p HMI, the landscape models the eu layout.
 *
 * @param model the panel model the card sees
 */
export function alarmLayout(model: PanelModel): AlarmLayout {
    return isPortrait(model) ? PORTRAIT : EU;
}
