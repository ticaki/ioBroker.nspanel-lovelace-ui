/**
 * Feedback for a locked page: a page with `hidden: true` cannot be shown while the panel hides pages
 * (`hideCards`). Swiping skips it; a targeted navigation to it shows this notification instead of doing nothing.
 */
import { Color } from '../const/Color';
import { hasGlyph } from '../const/text-width';
import type { Notify3Font } from '../pages/popupNotify3';
import type { PagePopupDataDetails } from '../types/pages';
import type { NSpanelModel } from '../types/types';

/** id of the notification - a second attempt replaces the first one instead of queueing it */
export const LOCKED_PAGE_NOTIFY_ID = 'navigationPageLocked';

/** translation key of the text of the notification */
export const LOCKED_PAGE_TEXT_KEY = 'navigation_page_locked';

/** big icon of the notification: the prohibition sign of the big icon font (font 9 of popupNotify3) */
export const LOCKED_PAGE_ICON = 'cancel';

/** text fonts from large to small: 48 px, 32 px, 24 px */
const FONTS: readonly Notify3Font[] = [3, 2, 0];

/**
 * The largest font that has every character of the text on the model (48 px has no Cyrillic, for example),
 * 48 px if none has them all.
 *
 * @param text the text
 * @param model panel model
 */
export function lockedPageFont(text: string, model: NSpanelModel): Notify3Font {
    const codePoints = Array.from(text, ch => ch.codePointAt(0) ?? 0);
    return FONTS.find(font => codePoints.every(cp => hasGlyph(cp, font, model))) ?? 3;
}

/**
 * The notification shown when a locked page is the target of a navigation: an information with the big icon
 * (popupNotify3, classic popup on older TFTs), closing like any other information (cross or timeout).
 *
 * @param text translated text, e.g. "Seite gesperrt"
 * @param model panel model
 */
export function lockedPageNotification(text: string, model: NSpanelModel): PagePopupDataDetails {
    return {
        id: LOCKED_PAGE_NOTIFY_ID,
        priority: 50,
        type: 'information',
        global: false,
        alwaysOn: false,
        headline: '',
        text,
        textSize: String(lockedPageFont(text, model)),
        buttonLeft: '',
        buttonMid: '',
        buttonRight: '',
        icon: LOCKED_PAGE_ICON,
        iconColor: Color.Red,
        largeIcon: true,
        buzzer: false,
    };
}
