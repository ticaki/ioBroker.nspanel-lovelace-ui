/**
 * The info icon next to the clock of the screensaver (`tTimeAdd`, field 2 of `time~`) and the blinking clock
 * (field 7 of `statusUpdate`), both from TFT 6.2.0 on (`HMI/tools/screensaver_blink_info_icon.py`) and on web panels.
 */
import { Icons } from '../const/icon_mapping';
import type { PagePopupDataDetails } from '../types/pages';

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

/**
 * The notification a tap on the info icon opens: the classic popupNotify with the small icon, an information that
 * closes like any other (cross or timeout) and brings the screensaver back.
 *
 * @param icon MDI name of the icon
 * @param text the text of the popup
 * @returns the details for `cmd/popupNotificationCustom`
 */
export function screensaverInfoNotification(icon: string, text: string): PagePopupDataDetails {
    const details: PagePopupDataDetails = {
        id: SCREENSAVER_INFO_NOTIFY_ID,
        priority: 50,
        type: 'information',
        global: false,
        alwaysOn: false,
        headline: '',
        text,
        buttonLeft: '',
        buttonMid: '',
        buttonRight: '',
        largeIcon: false,
        buzzer: false,
    };
    if (Icons.isIcon(icon)) {
        details.icon = icon;
    }
    return details;
}
