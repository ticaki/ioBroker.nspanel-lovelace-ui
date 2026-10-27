import type { PanelModel } from '../protocol/types';

export interface StageSize {
    width: number;
    height: number;
}

/** Native resolution of the display per model */
export function stageSize(model: PanelModel): StageSize {
    return model === 'us-p' ? { width: 320, height: 480 } : { width: 480, height: 320 };
}

export interface DeviceGeometry {
    /** black glass left and right of the display */
    padX: number;
    /** black glass above and below the display */
    padY: number;
    /** height of the two hardware buttons below the glass */
    buttonsHeight: number;
    /** size of the whole device (glass plus buttons) in stage pixels */
    width: number;
    height: number;
}

/**
 * Geometry of the device around the display in stage pixels, taken from the photo of the
 * eu panel (white housing, black glass, two white buttons below): the buttons are as wide
 * as the glass and about 0.27 of the display width high.
 *
 * @param model the panel model
 */
export function deviceGeometry(model: PanelModel): DeviceGeometry {
    const { width, height } = stageSize(model);
    const padX = 28;
    const padY = 40;
    const buttonsHeight = 130;
    return {
        padX,
        padY,
        buttonsHeight,
        width: width + 2 * padX,
        height: height + 2 * padY + buttonsHeight,
    };
}

/**
 * Width of the area the HMI lays its pages out in. On the eu display (480 px) the title is
 * centred at x 223, the tiles of the grids and the navigation icons are centred in the same
 * 447 px, the rightmost 33 px stay empty (measured on the emulator pictures).
 *
 * @param model the panel model
 */
export function contentWidth(model: PanelModel): number {
    return stageSize(model).width - 33;
}

export const theme = {
    /** display background */
    background: '#000000',
    /** default text colour (65535) */
    foreground: '#ffffff',
    /** inactive / disabled elements */
    muted: '#8a8a8a',
    /** the blue of the HMI (toggle, sliders, highlights): RGB 3,169,244 */
    accent: '#03a9f4',
    /** the toggle in the off state: pill and knob */
    toggleOffTrack: '#525552',
    toggleOffKnob: '#9c9a9c',
    /** the pill of the toggle in the on state (the knob is `accent`) */
    toggleOnTrack: '#076993',
    /** Noto Sans is the font of the HMI, see `panel.css` */
    fontFamily: "'Noto Sans', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
    /** height of the title bar with the navigation icons, the cards draw below */
    titleBarHeight: 62,
    /** vertical centre of the navigation icons and the title */
    titleBarCenter: 42,
    /** size of the navigation icons (MDI glyph of the 48 px Nextion font) */
    navIconSize: 43,
    /** horizontal centre of the left navigation icon; the right one mirrors it in `contentWidth` */
    navIconCenter: 33,
    /** font size of the title (32 px Nextion font) */
    titleFontSize: 24,
    /** face of the white hardware buttons (eu panel) */
    hardwareButton: '#f2f0f1',
    /** the face while a button is pressed */
    hardwareButtonPressed: '#d9d7d8',
    /** gap between the two buttons and their outline */
    hardwareButtonEdge: '#8e8c8d',
} as const;
