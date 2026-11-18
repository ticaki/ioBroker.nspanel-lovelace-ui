/**
 * popupNotify3 (HMI 6.2.0): notification with one big icon, one text line and up to two icon buttons.
 *
 * There is no own interface for it: an entry of the popup queue (PagePopupDataDetails) with `largeIcon: true` is
 * shown on this page when the display can show it (see usePopupNotify3), otherwise the classic popupNotify
 * is used as before.
 *
 * Message: `entityUpdateDetail~<id>~<icon>~<iconColor>~<text>~<textColor>~<font>~<btnLeftIcon>~<btnLeftColor>
 * ~<btnRightIcon>~<btnRightColor>~<timeout>` - icons as glyphs, colors RGB565 decimal, empty button icon = button
 * hidden, text <= 199 bytes. Events like popupNotify: left `notifyAction,button1`, right `notifyAction,button3`,
 * cross/timeout `buttonPress2,popupNotify3,bExit`.
 *
 * See doc/ideas/notify-page/README.md.
 */
import type { RGB } from '../const/Color';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { fitText, hasGlyph, wrapText } from '../const/text-width';
import { getPayloadRemoveTilde, isVersionGreaterOrEqual } from '../const/tools';
import type { PagePopupDataDetails } from '../types/pages';
import type { NSpanelModel } from '../types/types';

/** name of the HMI page (pageType~popupNotify3, id of its bExit event) */
export const POPUP_NOTIFY3 = 'popupNotify3';

/** first TFT version with the page */
export const POPUP_NOTIFY3_MIN_VERSION = '6.2.0';

/** hardware models whose HMI has the page from POPUP_NOTIFY3_MIN_VERSION on */
export const POPUP_NOTIFY3_MODELS: ReadonlySet<NSpanelModel> = new Set<NSpanelModel>(['eu', 'us-l', 'us-p']);

/**
 * The icons of the big icon font (font 9) of popupNotify3 - only these can be drawn on the panel
 * (list in doc/ideas/notify-page/README.md, generator HMI/tools/popup_notify3.py).
 */
export const POPUP_NOTIFY3_ICONS: readonly string[] = [
    // general
    'alert',
    'information-outline',
    'doorbell',
    'package-variant-closed',
    'mailbox-up',
    'phone-ring',
    'shield-alert',
    'alarm-light',
    'window-open-variant',
    'door-open',
    'garage-open',
    'ev-station',
    'power-socket-de',
    'battery-alert-variant-outline',
    // appointments
    'calendar',
    'calendar-alert',
    'calendar-clock',
    'bell-ring',
    'trash-can',
    // offline
    'wifi-off',
    'web-off',
    'cloud-off-outline',
    'lan-disconnect',
    // occupied
    'cancel',
    'toilet',
    'door-closed-lock',
    // weather
    'weather-rainy',
    'weather-lightning',
    'weather-lightning-rainy',
    'weather-hail',
    'weather-pouring',
    'weather-snowy-heavy',
    'weather-windy',
    'weather-tornado',
    'home-flood',
    'snowflake-alert',
    'sun-thermometer',
    'weather-fog',
    // appliances done / failed
    'washing-machine',
    'tumble-dryer',
    'dishwasher',
    'washing-machine-alert',
    'tumble-dryer-alert',
    'dishwasher-alert',
    'fridge-alert',
    'water-boiler-alert',
    'robot-vacuum-alert',
    'radiator-off',
    // danger
    'water-alert',
    'smoke-detector-alert',
    'fire-alert',
];
const ICON_SET: ReadonlySet<string> = new Set(POPUP_NOTIFY3_ICONS);

/** font of the button icons (Noto Sans Bold 80 with the icons) */
const BUTTON_FONT = 4;

/** default button icons when an entry has a button text but no button icon (see popupNotify3Buttons) */
export const NOTIFY3_DEFAULT_ICON_LEFT = 'close-thick';
export const NOTIFY3_DEFAULT_ICON_RIGHT = 'check-bold';
/** left button of the classic popup when more entries wait and the entry has no left button ("Next") */
export const NOTIFY3_DEFAULT_ICON_NEXT = 'arrow-right-bold';

/** font ids of the text line: 0 = 24 px, 2 = 32 px, 3 = 48 px */
export type Notify3Font = 0 | 2 | 3;

/** text field of a model: width in px and lines per font */
export interface Notify3TextLayout {
    width: number;
    lines: Readonly<Record<Notify3Font, number>>;
}

// eu HMI 6.2.0: tText x 8..441 (w 434) inside the visible area x 0..449 (the frame covers the right ~30 px);
// us-l the same 15 px further right (x 23..456)
const LANDSCAPE: Notify3TextLayout = { width: 434, lines: { 0: 2, 2: 1, 3: 1 } };
// us-p HMI 6.2.0: tText x 8..311, y 304..399 (h 96) - 2 lines at 48 px, 3 at 32 px, 4 at 24 px
const PORTRAIT: Notify3TextLayout = { width: 304, lines: { 0: 4, 2: 3, 3: 2 } };

/**
 * Text field of popupNotify3 per model (eu/us-l: 434 px, font 3/2 one line, font 0 two lines). The web models
 * use the font tables of their template (text-width.ts); the web panel has no frame: web-l uses its wider stage
 * (640 px, x 8..631), web-p the width of us-p.
 */
export const NOTIFY3_TEXT: Readonly<Record<NSpanelModel, Notify3TextLayout>> = {
    eu: LANDSCAPE,
    'us-l': LANDSCAPE,
    'us-p': PORTRAIT,
    'web-l': { ...LANDSCAPE, width: 624 },
    'web-p': PORTRAIT,
};

/** maximum bytes of the text field (tText maxl) */
export const NOTIFY3_TEXT_MAX_BYTES = 199;

/** what decides about popupNotify3 */
export interface Notify3Target {
    model: NSpanelModel;
    /** web panel or web clone: draws the page in the browser, no TFT */
    isVirtual: boolean;
    /** TFT version of the display (info.nspanel.displayVersion) */
    displayVersion: string;
}

/**
 * true if the display has the page popupNotify3: every web panel, a hardware panel from TFT 6.2.0 on if its model
 * has the page.
 *
 * @param target model, web/hardware and TFT version
 */
export function supportsPopupNotify3(target: Notify3Target): boolean {
    if (target.isVirtual) {
        return true;
    }
    return (
        POPUP_NOTIFY3_MODELS.has(target.model) &&
        !!target.displayVersion &&
        isVersionGreaterOrEqual(target.displayVersion, POPUP_NOTIFY3_MIN_VERSION)
    );
}

/** result of usePopupNotify3 */
export interface Notify3Choice {
    use: boolean;
    /** for the log: why an entry with largeIcon is shown classic or with the fallback icon */
    warning?: string;
}

function isKnownIcon(name: string): boolean {
    return Icons.iconMap.has(name);
}

/** icon of popupNotify3 when the icon of the entry is missing or cannot be drawn (one of POPUP_NOTIFY3_ICONS) */
export const NOTIFY3_FALLBACK_ICON = 'information-outline';

/**
 * The big icon of an entry: its `icon` if the display can draw it - a hardware panel only has the icons of
 * POPUP_NOTIFY3_ICONS, a web panel draws every MDI icon -, otherwise NOTIFY3_FALLBACK_ICON with a warning.
 *
 * @param details the entry
 * @param target the display
 */
export function notify3Icon(details: PagePopupDataDetails, target: Notify3Target): { icon: string; warning?: string } {
    const icon = typeof details.icon === 'string' ? details.icon.trim() : '';
    if (icon && isKnownIcon(icon) && (target.isVirtual || ICON_SET.has(icon))) {
        return { icon };
    }
    return {
        icon: NOTIFY3_FALLBACK_ICON,
        warning: `popupNotify3: icon '${icon}' not available for the large notification - showing ${NOTIFY3_FALLBACK_ICON}`,
    };
}

/**
 * Whether an entry is shown with popupNotify3: it asks for it with `largeIcon: true` and the display supports the
 * page. Without `largeIcon` nothing changes (classic popup, small icon in front of the headline). With `largeIcon`
 * on a display without the page (old TFT/model) the entry is shown classic, with a warning. A missing or unknown
 * icon does not prevent the page: it shows NOTIFY3_FALLBACK_ICON instead (warning, see notify3Icon).
 *
 * @param details the entry
 * @param target the display
 */
export function usePopupNotify3(details: PagePopupDataDetails | undefined, target: Notify3Target): Notify3Choice {
    if (details?.largeIcon !== true) {
        return { use: false };
    }
    if (!supportsPopupNotify3(target)) {
        return {
            use: false,
            warning: `popupNotify3: largeIcon needs TFT ${POPUP_NOTIFY3_MIN_VERSION} or newer (panel: ${target.model} ${target.displayVersion || 'unknown'}) - notification shown as classic popup`,
        };
    }
    const { warning } = notify3Icon(details, target);
    return warning ? { use: true, warning } : { use: true };
}

/**
 * Font of the text line from `textSize` (0..5, 8 like popupNotify): 0 -> 0 (24 px), 1/2 -> 2 (32 px), 3..5, 8
 * (96 px does not fit the 48 px field), empty or invalid -> 3 (48 px).
 *
 * @param textSize textSize of the entry
 */
export function notify3Font(textSize: unknown): Notify3Font {
    let n = Number.NaN;
    if (typeof textSize === 'number') {
        n = textSize;
    } else if (typeof textSize === 'string' && textSize.trim() !== '') {
        n = Number(textSize);
    }
    if (!Number.isFinite(n)) {
        return 3;
    }
    if (n < 1) {
        return 0;
    }
    if (n < 3) {
        return 2;
    }
    return 3;
}

/**
 * Cuts a text to maxBytes UTF-8 bytes at a code point border (no lone CR at the end).
 *
 * @param text the text
 * @param maxBytes maximum number of bytes
 */
export function cutUtf8(text: string, maxBytes: number): string {
    if (Buffer.byteLength(text, 'utf8') <= maxBytes) {
        return text;
    }
    const cps = Array.from(text);
    let bytes = 0;
    let n = 0;
    for (const ch of cps) {
        const b = Buffer.byteLength(ch, 'utf8');
        if (bytes + b > maxBytes) {
            break;
        }
        bytes += b;
        n++;
    }
    return cps.slice(0, n).join('').replace(/\r$/, '');
}

/**
 * The text line(s) of popupNotify3: the Nextion wraps character by character, so the adapter fits the text itself
 * - one line (fitText with ellipsis) or several lines (wrapText, joined with CR LF) per font and model, at most
 * NOTIFY3_TEXT_MAX_BYTES bytes. Line breaks (`\n`, `\r\n`, the literal `/r/n` of popupNotify) are kept where more
 * lines are allowed, otherwise they become spaces.
 *
 * @param text text of the entry
 * @param font font of the text line
 * @param model panel model
 */
export function notify3Text(text: string, font: Notify3Font, model: NSpanelModel): string {
    const layout = NOTIFY3_TEXT[model];
    const clean = text.replaceAll('/r/n', '\n').replaceAll('~', '-');
    const maxLines = layout.lines[font];
    const out =
        maxLines <= 1
            ? fitText(clean.replace(/\r?\n/g, ' '), font, model, layout.width)
            : wrapText(clean, font, model, layout.width, maxLines).join('\r\n');
    return cutUtf8(out, NOTIFY3_TEXT_MAX_BYTES);
}

/** the two buttons of popupNotify3: MDI names, '' = hidden */
export interface Notify3Buttons {
    left: string;
    right: string;
    warnings: string[];
}

function buttonIcon(
    name: string | undefined,
    fallback: string,
    side: 'buttonLeftIcon' | 'buttonRightIcon',
    target: Notify3Target,
    warnings: string[],
): string {
    const wanted = typeof name === 'string' ? name.trim() : '';
    if (!wanted) {
        return fallback;
    }
    const glyph = isKnownIcon(wanted) ? Icons.GetIcon(wanted) : '';
    const cp = glyph.codePointAt(0);
    if (cp === undefined || (!target.isVirtual && !hasGlyph(cp, BUTTON_FONT, target.model))) {
        warnings.push(
            `popupNotify3: unknown ${side} '${wanted}' - ${fallback ? `'${fallback}' used instead` : 'button hidden'}`,
        );
        return fallback;
    }
    return wanted;
}

/**
 * The button icons of an entry. `buttonLeftIcon`/`buttonRightIcon` set the icon; without one a button follows the
 * classic popup: a button text (`buttonLeft`/`buttonRight`, `acknowledge` gets `ok` on the right) shows
 * NOTIFY3_DEFAULT_ICON_LEFT / NOTIFY3_DEFAULT_ICON_RIGHT, the left button shows NOTIFY3_DEFAULT_ICON_NEXT when
 * more entries wait. An unknown icon name falls back to that default (warning). There is no middle button.
 *
 * @param details the entry
 * @param queueLength number of entries in the queue
 * @param target the display
 */
export function popupNotify3Buttons(
    details: PagePopupDataDetails,
    queueLength: number,
    target: Notify3Target,
): Notify3Buttons {
    const warnings: string[] = [];
    const leftDefault = details.buttonLeft
        ? NOTIFY3_DEFAULT_ICON_LEFT
        : queueLength > 1
          ? NOTIFY3_DEFAULT_ICON_NEXT
          : '';
    const rightDefault = details.buttonRight ? NOTIFY3_DEFAULT_ICON_RIGHT : '';
    return {
        left: buttonIcon(details.buttonLeftIcon, leftDefault, 'buttonLeftIcon', target, warnings),
        right: buttonIcon(details.buttonRightIcon, rightDefault, 'buttonRightIcon', target, warnings),
        warnings,
    };
}

function dec565(rgb: RGB | undefined | null, def: RGB): string {
    return String(Color.rgb_dec565(rgb ?? def));
}

/** input of popupNotify3Message */
export interface Notify3MessageInput {
    /** id of the popup page (answered in notifyAction) */
    id: string;
    details: PagePopupDataDetails;
    queueLength: number;
    /** seconds until the page closes itself, 0 = stays */
    timeout: number;
    target: Notify3Target;
}

/**
 * The `entityUpdateDetail` of popupNotify3 for an entry (usePopupNotify3 must have chosen it). Colors: icon and
 * text white, left button yellow, right button green unless set (like popupNotify).
 *
 * @param input entry, queue length, timeout and display
 * @returns payload and warnings for the log
 */
export function popupNotify3Message(input: Notify3MessageInput): { payload: string; warnings: string[] } {
    const { details, target } = input;
    const font = notify3Font(details.textSize);
    const buttons = popupNotify3Buttons(details, input.queueLength, target);
    const payload = getPayloadRemoveTilde(
        'entityUpdateDetail',
        input.id,
        Icons.GetIcon(notify3Icon(details, target).icon),
        dec565(details.iconColor, Color.White),
        notify3Text(details.text ?? '', font, target.model),
        dec565(details.colorText, Color.White),
        String(font),
        buttons.left ? Icons.GetIcon(buttons.left) : '',
        buttons.left ? dec565(details.colorButtonLeft, Color.Yellow) : '',
        buttons.right ? Icons.GetIcon(buttons.right) : '',
        buttons.right ? dec565(details.colorButtonRight, Color.Green) : '',
        String(input.timeout),
    );
    return { payload, warnings: buttons.warnings };
}
