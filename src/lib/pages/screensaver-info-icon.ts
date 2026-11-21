/**
 * The info icon next to the clock of the screensaver (`tTimeAdd`, field 2 of `time~`) and the blinking clock
 * (field 7 of `statusUpdate`), both from TFT 6.2.0 on (`HMI/tools/screensaver_blink_info_icon.py`) and on web panels.
 */
import type { RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { PagePopupDataDetails } from '../types/pages';
import type { NSpanelModel } from '../types/types';
import { notifyTextLines } from './popupNotify3';
import type { ScreensaverInfoFont } from '../const/screensaver-info-font';

export {
    SCREENSAVER_INFO_FONT_DEFAULT,
    SCREENSAVER_INFO_FONT_STATES,
    screensaverInfoFont,
    type ScreensaverInfoFont,
} from '../const/screensaver-info-font';

/** TFT version from which on the screensavers read the blink flag (field 7 of `statusUpdate`) and send the info icon */
export const SCREENSAVER_CLOCK_BLINK_MIN_VERSION = '6.2.0';

/**
 * id of the event of a tap on the info icon: `event,buttonPress2,bInfo,button,<taps>` - no `?` (no indicator
 * `<page>?<n>`) and not the id `screensaver` of `bExit` or a swipe
 */
export const SCREENSAVER_INFO_ICON_ID = 'bInfo';

/** id of the notification - a second tap replaces the first one instead of queueing it */
export const SCREENSAVER_INFO_NOTIFY_ID = 'screensaverInfoIcon';

/** the icons the adapter sets itself and the translation key of their explanation */
export const SCREENSAVER_INFO_ICON_TEXTS: Readonly<Record<string, string>> = {
    'timer-sand': 'screensaver_info_timer_running',
    'timer-pause': 'screensaver_info_timer_paused',
    'timer-alert': 'screensaver_info_timer_expired',
    'cog-refresh-outline': 'screensaver_info_dev_firmware',
    'wrench-clock': 'screensaver_info_firmware_update',
};

/** the info icon the screensaver shows */
export interface ScreensaverInfoIcon {
    /** MDI name */
    name: string;
    /** true: the icon of the user (`cmd.screenSaver.infoIcon`), false: one of {@link SCREENSAVER_INFO_ICON_TEXTS} */
    user: boolean;
}

/** width in px of the text field of the classic popupNotify: without icon (tText) and with icon (tTextAlt) */
export interface PopupNotifyTextWidth {
    text: number;
    withIcon: number;
}

/**
 * Text field of the classic popupNotify per model (HMI 6.2.0): eu/us-l tText 397 px, tTextAlt next to the icon
 * 285 px; us-p tText 307 px, tTextAlt below the icon 306 px. Web panels (src-web PopupNotify.tsx, notifyGeometry):
 * web-l x 24..584 (560 px), next to the icon x 138..584 (446 px); web-p x 24..296 (272 px, the icon sits in the
 * heading).
 */
export const POPUP_NOTIFY_TEXT_WIDTH: Readonly<Record<NSpanelModel, PopupNotifyTextWidth>> = {
    eu: { text: 397, withIcon: 285 },
    'us-l': { text: 397, withIcon: 285 },
    'us-p': { text: 307, withIcon: 306 },
    'web-l': { text: 560, withIcon: 446 },
    'web-p': { text: 272, withIcon: 272 },
};

/** what the popup of the info icon shows */
export interface ScreensaverInfoPopup {
    /** MDI name of the icon */
    icon: string;
    /** color of the icon as the screensaver shows it */
    iconColor: RGB;
    /** the text, wrapped by the adapter */
    text: string;
    /** font id of the text */
    font: ScreensaverInfoFont;
    /** model of the panel: the width of the text field and the widths of the font */
    model: NSpanelModel;
}

/**
 * The text of the popup wrapped at word borders for the text field of popupNotify (with or without icon) and the
 * font - the Nextion would break inside a word. Lines joined with `\n` (PagePopup makes CR LF of it and rotates
 * when there are more lines than the field shows).
 *
 * @param text the text
 * @param font font id
 * @param model panel model
 * @param withIcon the popup shows the icon (text field tTextAlt)
 * @returns the wrapped text
 */
export function screensaverInfoText(
    text: string,
    font: ScreensaverInfoFont,
    model: NSpanelModel,
    withIcon: boolean,
): string {
    const widths = POPUP_NOTIFY_TEXT_WIDTH[model];
    return notifyTextLines(text, font, model, withIcon ? widths.withIcon : widths.text, Number.MAX_SAFE_INTEGER).join(
        '\n',
    );
}

/**
 * The notification a tap on the info icon opens: the classic popupNotify with the small icon in the color of the
 * screensaver, an information that closes like any other (cross or timeout) and brings the screensaver back.
 *
 * @param popup icon, its color, text, font and model
 * @returns the details for `cmd/popupNotificationCustom`
 */
export function screensaverInfoNotification(popup: ScreensaverInfoPopup): PagePopupDataDetails {
    const withIcon = Icons.iconMap.has(popup.icon.trim());
    const details: PagePopupDataDetails = {
        id: SCREENSAVER_INFO_NOTIFY_ID,
        priority: 50,
        type: 'information',
        global: false,
        alwaysOn: false,
        headline: '',
        text: screensaverInfoText(popup.text, popup.font, popup.model, withIcon),
        textSize: String(popup.font),
        buttonLeft: '',
        buttonMid: '',
        buttonRight: '',
        largeIcon: false,
        buzzer: false,
    };
    if (withIcon && Icons.isIcon(popup.icon)) {
        details.icon = popup.icon;
        details.iconColor = popup.iconColor;
    }
    return details;
}
