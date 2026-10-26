import type { ParseContext } from '../CardContract';
import { field } from '../../protocol/split';
import { isEnabled, optionalNumber } from './fields';

/** One of the up to three sliders of `popupSlider` */
export interface SliderRow {
    /** 1-3, the N of `positionSliderN` the display answers with */
    number: number;
    /** heading of the slider */
    label: string;
    /** glyph of the minus button, none when empty */
    iconMinus: string;
    /** glyph of the plus button, none when empty */
    iconPlus: string;
    /** current value in `min..max` */
    value: number;
    min: number;
    max: number;
    /** position of the zero marker, none when empty */
    zero: number | undefined;
    step: number;
}

export interface PopupSliderModel {
    entityName: string;
    /** the visible sliders in order (`hSliderNVisibility` = `enable`) */
    sliders: SliderRow[];
    /** true once an `entityUpdateDetail` arrived */
    received: boolean;
}

/** fields per slider in the payload */
const SLIDER_FIELDS = 9;
const MAX_SLIDERS = 3;

export function initial(): PopupSliderModel {
    return { entityName: '', sliders: [], received: false };
}

/** Popups get no `entityUpd`, the model stays */
export function parseEntityUpd(_args: string[], prev: PopupSliderModel, _ctx: ParseContext): PopupSliderModel {
    return prev;
}

/**
 * `entityUpdateDetail~entityName~[tSlider~tIconM~tIconP~cur~min~max~zero~step~visibility]{3}`
 * (see `getDetailPayload` case `popupSlider` in `src/lib/pages/pageItem.ts`).
 * `cur` is in `min..max`, the display answers `positionSliderN` with a value in the same range.
 */
export function parseEntityUpdateDetail(args: string[], _prev: PopupSliderModel, _ctx: ParseContext): PopupSliderModel {
    const sliders: SliderRow[] = [];
    for (let n = 0; n < MAX_SLIDERS; n++) {
        const o = 1 + n * SLIDER_FIELDS;
        if (!isEnabled(args[o + 8])) {
            continue;
        }
        const min = optionalNumber(args[o + 4]) ?? 0;
        const max = optionalNumber(args[o + 5]) ?? 100;
        sliders.push({
            number: n + 1,
            label: field(args, o),
            iconMinus: field(args, o + 1),
            iconPlus: field(args, o + 2),
            value: optionalNumber(args[o + 3]) ?? min,
            min,
            max,
            zero: optionalNumber(args[o + 6]),
            step: optionalNumber(args[o + 7]) ?? 1,
        });
    }
    return { entityName: field(args, 0), sliders, received: true };
}
