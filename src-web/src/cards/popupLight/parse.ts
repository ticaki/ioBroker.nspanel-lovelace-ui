import type { ParseContext } from '../CardContract';
import { field } from '../../protocol/split';
import { isEnabled, optionalBoolean, optionalColor, optionalNumber } from '../popupSlider/fields';

export interface PopupLightModel {
    entityName: string;
    /** glyph of the entity icon, empty when the adapter sent none */
    icon: string;
    /** RGB565 colour of icon and sliders, undefined for `disable` */
    color: number | undefined;
    /** on/off state of the switch, undefined when the entity has no switch (`disable`) */
    power: boolean | undefined;
    /** brightness slider 0-100, undefined when there is no dimmer */
    brightness: number | undefined;
    /** colour temperature slider 0-100 (0 = cold, 100 = warm), undefined when not supported */
    colorTemp: number | undefined;
    /** the entity supports colours - the colour wheel is shown */
    hueMode: boolean;
    /** heading of the colour wheel ("Color") */
    colorLabel: string;
    /** heading of the colour temperature slider ("Temperature") */
    colorTempLabel: string;
    /** heading of the brightness slider ("Brightness") */
    brightnessLabel: string;
    /** the entity has an effect/scene list - button for `popupInSel` (only used by `popupLightNew`) */
    effectList: boolean;
    /** true once an `entityUpdateDetail` arrived */
    received: boolean;
}

export function initial(): PopupLightModel {
    return {
        entityName: '',
        icon: '',
        color: undefined,
        power: undefined,
        brightness: undefined,
        colorTemp: undefined,
        hueMode: false,
        colorLabel: '',
        colorTempLabel: '',
        brightnessLabel: '',
        effectList: false,
        received: false,
    };
}

/** Popups get no `entityUpd`, the model stays */
export function parseEntityUpd(_args: string[], prev: PopupLightModel, _ctx: ParseContext): PopupLightModel {
    return prev;
}

/**
 * `entityUpdateDetail~entityName~icon~slidersColor~buttonState~slider1Pos~slider2Pos~hueMode~
 * hue_translation~slider2Translation~slider1Translation~popup`
 * (see `getDetailPayload` case `2Sliders` in `src/lib/pages/pageItem.ts`; both `popupLight`
 * and `popupLightNew` get this payload). `buttonState` is `1`, `0` or `disable`, the slider
 * positions are numbers or `disable`, `hueMode` and `popup` are `enable`/`disable`.
 */
export function parseEntityUpdateDetail(args: string[], _prev: PopupLightModel, _ctx: ParseContext): PopupLightModel {
    return {
        entityName: field(args, 0),
        icon: field(args, 1),
        color: optionalColor(args[2]),
        power: optionalBoolean(args[3]),
        brightness: optionalNumber(args[4]),
        colorTemp: optionalNumber(args[5]),
        hueMode: isEnabled(args[6]),
        colorLabel: field(args, 7),
        colorTempLabel: field(args, 8),
        brightnessLabel: field(args, 9),
        effectList: isEnabled(args[10]),
        received: true,
    };
}
