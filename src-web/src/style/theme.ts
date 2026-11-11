import type { PanelModel } from '../protocol/types';

export interface StageSize {
    width: number;
    height: number;
}

const STAGE_SIZES: Readonly<Record<PanelModel, StageSize>> = {
    eu: { width: 480, height: 320 },
    'us-l': { width: 480, height: 320 },
    'us-p': { width: 320, height: 480 },
    'web-p': { width: 320, height: 640 },
    'web-l': { width: 640, height: 320 },
};

/** Native resolution of the display (the logical stage of a web model) per model */
export function stageSize(model: PanelModel): StageSize {
    return STAGE_SIZES[model];
}

/**
 * `true` for the portrait models (`us-p`, `web-p`) - use this instead of comparing with `'us-p'`.
 *
 * @param model the panel model
 */
export function isPortrait(model: PanelModel): boolean {
    return model === 'us-p' || model === 'web-p';
}

/**
 * `true` for the models of standalone web panels (`web-p`, `web-l`), which have no hardware
 * counterpart and a bigger stage.
 *
 * @param model the panel model
 */
export function isWebModel(model: PanelModel): boolean {
    return model === 'web-p' || model === 'web-l';
}

/**
 * Width of the area the HMI lays its pages out in. On the eu display (480 px) the title is
 * centred at x 223, the tiles of the grids and the navigation icons are centred in the same
 * 447 px, the rightmost 33 px stay empty (measured on the emulator pictures). us-p and the web models
 * (`web-p`, `web-l`) use the full width of the stage.
 *
 * @param model the panel model
 */
export function contentWidth(model: PanelModel): number {
    const { width } = stageSize(model);
    // the web models have no reason for the empty strip of the HMI; the us-p HMI lays its pages out on the
    // full 320 px (navigation icons centred at x 34 / 286, the grid columns at x 83 / 238)
    return isWebModel(model) || isPortrait(model) ? width : width - 33;
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
    /** area below the display with the two hardware buttons */
    hardwareButtonsHeight: 68,
} as const;
