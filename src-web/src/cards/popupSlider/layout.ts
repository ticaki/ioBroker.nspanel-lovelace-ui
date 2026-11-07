import type { PanelModel } from '../../protocol/types';
import { isPortrait, stageSize } from '../../style/theme';

/** width of the eu layout of the popups (the HMI pages are 480 px wide) */
export const EU_WIDTH = 480;
/** distance of the centre of the X from the right edge of the stage (eu: x 421) */
const CLOSE_FROM_RIGHT = 59;
/** vertical centre of the X */
const CLOSE_CENTER_Y = 34;

/** The area a popup is laid out in */
export interface PopupFrame {
    /** stage width */
    width: number;
    /** stage height */
    height: number;
    /** `us-p`, `web-p`: the popups use their portrait layout */
    portrait: boolean;
    /**
     * x of the 480 px eu layout on the stage: 0 on eu/us-l and the portrait models, 80 on `web-l`
     * (popups that keep the eu layout are centred horizontally)
     */
    euLeft: number;
}

/**
 * The frame of a popup on a model. Portrait models (us-p 320 x 480, web-p 320 x 640) get the
 * portrait layout, landscape models the eu layout - centred or stretched on `web-l`.
 *
 * @param model the panel model the popup sees
 */
export function popupFrame(model: PanelModel): PopupFrame {
    const { width, height } = stageSize(model);
    const portrait = isPortrait(model);
    return { width, height, portrait, euLeft: portrait ? 0 : Math.max(0, Math.floor((width - EU_WIDTH) / 2)) };
}

/**
 * Centre of the X of a popup: 59 px from the right edge of the stage (eu 421 / 34 like the HMI).
 *
 * @param model the panel model
 */
export function closeCenter(model: PanelModel): { x: number; y: number } {
    return { x: stageSize(model).width - CLOSE_FROM_RIGHT, y: CLOSE_CENTER_Y };
}

/**
 * Centres of `count` buttons spread evenly over `width`, starting at `left`
 * (each button in the middle of its equal share).
 *
 * @param count number of buttons
 * @param left left edge of the area
 * @param width width of the area
 */
export function spreadCenters(count: number, left: number, width: number): number[] {
    const share = width / count;
    return Array.from({ length: count }, (_, i) => Math.round(left + share * (i + 0.5)));
}
