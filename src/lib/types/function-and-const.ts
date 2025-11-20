import { Color } from '../const/Color';
import type { NSPanel } from './NSPanel';
import type {
    AlarmButtonEvents,
    cardEntitiesTypes,
    cardGridTypes,
    closingBehaviour,
    PageMenuConfig,
    placeholderType,
    QRButtonEvent,
    screenSaverCardType,
    StateRole,
} from './pages';
import type {
    EventMethod,
    EventType,
    IconColorElement,
    IconSelectElement,
    PopupType,
    ScreensaverModeType,
    ValueDateFormat,
} from './types';

export function convertColorScaleBest(F: any): IconColorElement['color_best'] {
    if (F) {
        return { r: F.red ?? F.r, g: F.green ?? F.g, b: F.blue ?? F.b };
    }
    return undefined;
}
export function isPartialColorScaleElement(F: any): F is IconColorElement {
    return F && ('val_min' in (F as IconColorElement) || 'val_max' in (F as IconColorElement));
}

export function isIconSelectScaleElement(F: any): F is IconSelectElement {
    return F && 'valIcon_min' in (F as IconSelectElement) && 'valIcon_max' in (F as IconSelectElement);
}
export function isPartialIconSelectScaleElement(F: any): F is IconSelectElement {
    return F && ('valIcon_min' in (F as IconSelectElement) || 'valIcon_max' in (F as IconSelectElement));
}

/**
 * Normalize a valid IconColorElement (e.g. fix color_best).
 * Call this after `isIconColorElement()` returned true.
 *
 * @param el IconColorElement
 */

export function normalizeIconColorElement(el: IconColorElement): IconColorElement {
    const copy: IconColorElement = { ...el };
    if (copy.color_best) {
        copy.color_best = convertColorScaleBest(copy.color_best);
    }
    return copy;
}
/**
 * Lightweight type guard for IconColorElement.
 * - Checks presence & finiteness of required numbers.
 * - Optional fields, if present, must be of the right *shape*.
 * - No normalization, no range constraints (val_min may be > val_max).
 *
 * @param x unknown
 * @returns true if x is IconColorElement
 */

export function isIconColorScaleElement(x: unknown): x is IconColorElement {
    if (typeof x !== 'object' || x === null) {
        return false;
    }

    const v = x as Partial<IconColorElement>;

    // required
    if (!Number.isFinite(v.val_min as number)) {
        return false;
    }
    if (!Number.isFinite(v.val_max as number)) {
        return false;
    }

    // optional numbers
    if (v.val_best != null && !Number.isFinite(v.val_best)) {
        return false;
    }

    // optional enums
    if (v.log10 != null && v.log10 !== 'max' && v.log10 !== 'min') {
        return false;
    }
    if (
        v.mode != null &&
        v.mode !== 'mixed' &&
        v.mode !== 'hue' &&
        v.mode !== 'cie' &&
        v.mode !== 'triGrad' &&
        v.mode !== 'triGradAnchor' &&
        v.mode !== 'quadriGrad' &&
        v.mode !== 'quadriGradAnchor'
    ) {
        return false;
    }

    // optional color object
    if (v.color_best != null && !Color.isRGB(v.color_best)) {
        return false;
    }

    return true;
}
export function isEventType(F: string): F is EventType {
    return ['event'].indexOf(F) != -1;
}
export function isEventMethod(F: string): F is EventMethod {
    switch (F as EventMethod) {
        case 'startup':
        case 'sleepReached':
        case 'pageOpenDetail':
        case 'buttonPress2':
        case 'buttonPress3':
        case 'renderCurrentPage':
        case 'button1':
        case 'button2':
            return true;
        default:
            // Have to talk about this.
            throw new Error(`Please report to developer: Unknown EventMethod: ${F} `);
            return false;
    }
}
export function isPopupType(F: any): F is PopupType {
    switch (F as PopupType) {
        case 'popupFan':
        case 'popupInSel':
        case 'popupLight':
        case 'popupLightNew':
        case 'popupNotify':
        case 'popupShutter':
        case 'popupShutter2':
        case 'popupThermo':
        case 'popupTimer':
        case 'popupSlider':
            return true;
        default:
            console.info(`Unknown PopupType: ${F} `);
            return false;
    }
}
export const SerialTypeArray = [
    'light', //popup
    'shutter', //popup
    'delete',
    'text',
    'button',
    'switch', // nur für cardQR
    'number',
    'input_sel', //popup
    'timer', //popup
    'fan', //popup
];
export function isValueDateFormat(F: any): F is ValueDateFormat {
    return F && typeof F === 'object' && F.local !== undefined && F.format !== undefined;
}
export const screenSaverInfoIconsUseable = {
    none: '',
    'clock!': 'clock-alert-outline',
    'weather!': 'weather-sunny-alert',
    'news!': 'bell-ring-outline',
    'calendar!': 'calendar-alert',
    'alarm!': 'alarm',
    'info!': 'information-outline',
    'error!': 'alert-circle-outline',
    'critical!': 'alert-circle',
} as const;

export const screenSaverInfoIcons = swapKeyValue(screenSaverInfoIconsUseable);
function swapKeyValue(obj: Record<string, string>): Record<string, string> {
    const swapped: Record<string, string> = {};
    for (const key in obj) {
        const value = obj[key];
        swapped[value] = key;
    }
    return swapped;
}
// Optimierte Type Guards mit const assertions
const CARD_ENTITIES_TYPES = ['cardEntities', 'cardSchedule'] as const;
const CARD_GRID_TYPES = ['cardGrid', 'cardGrid2', 'cardGrid3', 'cardThermo2', 'cardMedia'] as const;
const CARD_MENU_HALF_PAGE_SCROLL_TYPES = ['cardGrid', 'cardGrid2', 'cardGrid3', 'cardThermo2'] as const;

export function isCardEntitiesType(value: unknown): value is cardEntitiesTypes {
    return typeof value === 'string' && CARD_ENTITIES_TYPES.includes(value as any);
}

export function isCardGridType(value: unknown): value is cardGridTypes {
    return typeof value === 'string' && CARD_GRID_TYPES.includes(value as any);
}

export function isCardMenuHalfPageScrollType(value: unknown): value is cardGridTypes {
    return typeof value === 'string' && CARD_MENU_HALF_PAGE_SCROLL_TYPES.includes(value as any);
}

export function isCardMenuRole(F: any): F is cardGridTypes | cardEntitiesTypes {
    return isCardEntitiesType(F) || isCardGridType(F);
}
// cardMedia use some features of cardGrid, but is not a menu card

export function isPageMenuConfig(F: any): F is PageMenuConfig {
    if (typeof F !== 'object' || F === null || !('card' in F)) {
        return false;
    }
    return isCardMenuRole(F.card);
}
export const arrayOfAll =
    <T>() =>
    <U extends T[]>(array: U & ([T] extends [U[number]] ? unknown : 'Invalid') & { 0: T }): U =>
        array;
const arrayOfAllScreenSaverMode = arrayOfAll<NSPanel.ScreensaverModeType>();
const arrayOfAllScreenSaverCards = arrayOfAll<screenSaverCardType>();

export function exhaustiveCheck(_param: never): void {}

export const screenSaverCardArray: screenSaverCardType[] = arrayOfAllScreenSaverCards([
    'screensaver',
    'screensaver2',
    'screensaver3',
]);
export function isScreenSaverCardType(F: string): F is screenSaverCardType {
    if (typeof F !== 'string') {
        return false;
    }

    return ['screensaver', 'screensaver2', 'screensaver3'].includes(F);
}

export const screenSaverModeArray = arrayOfAllScreenSaverMode(['standard', 'advanced', 'alternate', 'easyview']);
export function isScreenSaverMode(F: any): F is NSPanel.ScreensaverModeType {
    if (typeof F !== 'string') {
        return false;
    }

    return ['standard', 'advanced', 'alternate', 'easyview'].includes(F);
}
// Optimierter Type Guard für ScreensaverMode Numbers
const SCREENSAVER_MODE_NUMBERS = [0, 1, 2, 3] as const;

export function isScreenSaverModeAsNumber(value: unknown): value is NSPanel.ScreensaverModeTypeAsNumber {
    return typeof value === 'number' && SCREENSAVER_MODE_NUMBERS.includes(value as any);
}
export function isStateRole(F: string): F is StateRole {
    // Alle StateRole Werte sind gültig - triviale Type Guard
    return true;
}
// Optimierte Type Guards mit Sets für bessere Performance
const BUTTON_ACTION_TYPES = new Set([
    'bExit',
    'bUp',
    'bNext',
    'bSubNext',
    'bPrev',
    'bSubPrev',
    'bHome',
    'notifyAction',
    'OnOff',
    'button',
    'up',
    'stop',
    'down',
    'positionSlider',
    'tiltOpen',
    'tiltStop',
    'tiltSlider',
    'tiltClose',
    'brightnessSlider',
    'colorTempSlider',
    'colorWheel',
    'tempUpd',
    'tempUpdHighLow',
    'media-back',
    'media-pause',
    'media-next',
    'media-shuffle',
    'volumeSlider',
    'mode-speakerlist',
    'mode-playlist',
    'mode-tracklist',
    'mode-repeat',
    'mode-equalizer',
    'mode-seek',
    'mode-crossfade',
    'mode-favorites',
    'mode-insel',
    'media-OnOff',
    'timer-start',
    'timer-pause',
    'timer-cancle',
    'timer-finish',
    'hvac_action',
    'mode-modus1',
    'mode-modus2',
    'mode-modus3',
    'number-set',
    'mode-preset_modes',
    'A1',
    'A2',
    'A3',
    'A4',
    'D1',
    'U1',
    'eu',
] as const);

export function isButtonActionType(value: unknown): value is NSPanel.ButtonActionType {
    return typeof value === 'string' && BUTTON_ACTION_TYPES.has(value as any);
} // Optimierte Alarm Types mit const assertions
export const ALARM_BUTTON_EVENTS: AlarmButtonEvents[] = [
    'A1',
    'A2',
    'A3',
    'A4',
    'D1',
    'D2',
    'D3',
    'D4',
    'U1',
    '',
] as const;
export function isPlaceholderType(F: any): F is placeholderType {
    if (!F || typeof F !== 'object') {
        return false;
    }
    for (const a in F) {
        let count = 0;
        if (!F[a]) {
            return false;
        }
        for (const b in F[a]) {
            if (['text', 'dp'].indexOf(b) !== -1 && F[a][b] !== undefined) {
                count++;
            }
        }
        if (count !== 1) {
            return false;
        }
    }
    return true;
}
export function isColorEntryType(F: object | NSPanel.ColorEntryType): F is NSPanel.ColorEntryType {
    if ('true' in F && 'false' in F && 'scale' in F) {
        return true;
    }
    return false;
}
export function isQRButtonEvent(F: any): F is QRButtonEvent {
    return 'OnOff' === F;
}
export function isClosingBehavior(F: any): F is closingBehaviour {
    return ['both', 'yes', 'no', 'none'].indexOf(F) !== -1;
}
export function isAlarmButtonEvent(value: unknown): value is AlarmButtonEvents {
    return typeof value === 'string' && ALARM_BUTTON_EVENTS.includes(value as any);
}
const arrayOfModes = arrayOfAll<ScreensaverModeType>();
export const arrayOfScreensaverModes = arrayOfModes(['standard', 'alternate', 'advanced', 'easyview']);

export function isTasmotaStatusNet(F: any): F is { StatusNET: NSPanel.STATUS0['StatusNET'] } {
    return F && typeof F === 'object' && 'StatusNET' in F && typeof F.StatusNET === 'object';
}

export function isTasmotaStatus0Status(F: any): F is { Status: NSPanel.STATUS0['Status'] } {
    return F && typeof F === 'object' && 'Status' in F && typeof F.Status === 'object';
}

export function isTasmotaStatusPRM(F: any): F is { StatusPRM: NSPanel.STATUS0['StatusPRM'] } {
    return F && typeof F === 'object' && 'StatusPRM' in F && typeof F.StatusPRM === 'object';
}

export function isTasmotaStatusFWR(F: any): F is { StatusFWR: NSPanel.STATUS0['StatusFWR'] } {
    return F && typeof F === 'object' && 'StatusFWR' in F && typeof F.StatusFWR === 'object';
}

export function isTasmotaStatusLOG(F: any): F is { StatusLOG: NSPanel.STATUS0['StatusLOG'] } {
    return F && typeof F === 'object' && 'StatusLOG' in F && typeof F.StatusLOG === 'object';
}

export function isTasmotaStatusMEM(F: any): F is { StatusMEM: NSPanel.STATUS0['StatusMEM'] } {
    return F && typeof F === 'object' && 'StatusMEM' in F && typeof F.StatusMEM === 'object';
}

export function isTasmotaStatusMQT(F: any): F is { StatusMQT: NSPanel.STATUS0['StatusMQT'] } {
    return F && typeof F === 'object' && 'StatusMQT' in F && typeof F.StatusMQT === 'object';
}

export function isTasmotaStatusTIM(F: any): F is { StatusTIM: NSPanel.STATUS0['StatusTIM'] } {
    return F && typeof F === 'object' && 'StatusTIM' in F && typeof F.StatusTIM === 'object';
}

export function isTasmotaStatusSNS(F: any): F is { StatusSNS: NSPanel.STATUS0['StatusSNS'] } {
    return F && typeof F === 'object' && 'StatusSNS' in F && typeof F.StatusSNS === 'object';
}

export function isTasmotaStatusSTS(F: any): F is { StatusSTS: NSPanel.STATUS0['StatusSTS'] } {
    return F && typeof F === 'object' && 'StatusSTS' in F && typeof F.StatusSTS === 'object';
}

export function isTasmotaSTATUS0(F: any): F is NSPanel.STATUS0 {
    return (
        F &&
        typeof F === 'object' &&
        isTasmotaStatus0Status(F) &&
        isTasmotaStatusPRM(F) &&
        isTasmotaStatusFWR(F) &&
        isTasmotaStatusLOG(F) &&
        isTasmotaStatusMEM(F) &&
        isTasmotaStatusNet(F) &&
        isTasmotaStatusMQT(F) &&
        isTasmotaStatusTIM(F) &&
        isTasmotaStatusSNS(F) &&
        isTasmotaStatusSTS(F)
    );
}
