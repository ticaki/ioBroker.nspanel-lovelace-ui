import { Color, type RGB } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getRGBFromValue } from '../const/tools';
import { isHexColor, screensaverNotifyDefaultBuzzer, screensaverNotifyLines } from '../types/adminShareConfig';

/**
 * The queue of the notifications (Schlagzeile) that the sendTo `screensaverNotify` sets with an `id`. It works like
 * the queue of `setPopupNotification`: one queue per panel, in memory only, at most
 * {@link SCREENSAVER_NOTIFY_QUEUE_MAX} entries. The screensaver mixes it with the notifications of the admin list.
 */

/** most entries of the queue of one panel */
export const SCREENSAVER_NOTIFY_QUEUE_MAX = 10;
/** priority of an entry with an id that has none */
export const SCREENSAVER_NOTIFY_DEFAULT_PRIORITY = 50;
/** in front of the id of a queue entry as the screensaver keeps it as active notification - admin ids have no `:` */
export const SCREENSAVER_NOTIFY_QUEUE_PREFIX = 'sendTo:';

/** what the sendTo `screensaverNotify` with an `id` sends to each panel (`cmd/screensaverNotificationCustom`) */
export interface ScreensaverNotifyDetails {
    id: string;
    /** lower = more important; <= 0 removes the id, <= -100 all ids with this prefix */
    priority: number;
    /** false removes the id */
    enabled: boolean;
    headline: string;
    text: string;
    /** MDI name, shown in front of the headline */
    icon?: string;
    /** tone sequence of the Tasmota command `Buzzer`, undefined = no buzzer */
    buzzer?: string;
    colorHeadline?: RGB;
    colorText?: RGB;
    /** second background `#rrggbb` */
    backgroundBlink?: string;
    /** acknowledge: a tap removes the entry */
    type: 'information' | 'acknowledge';
    /** with acknowledge: a tap removes the entry on all panels */
    global: boolean;
}

/** colors of a notification that replace the ones of the color theme, missing = theme */
export interface ScreensaverNotifyCustomColors {
    head?: RGB;
    text?: RGB;
}

/** an entry of the queue as the screensaver shows it */
export interface ScreensaverNotifyQueueEntry {
    id: string;
    priority: number;
    /** first line with the icon */
    heading: string;
    text: string;
    buzzer?: string;
    /** second background as RGB565, undefined = no blinking */
    blink?: number;
    colors: ScreensaverNotifyCustomColors;
    acknowledge: boolean;
    global: boolean;
    /** order of arrival - the older one comes first with the same priority */
    seq: number;
}

/** a notification the screensaver may show - from the admin list or from the queue */
export interface ScreensaverNotifyCandidate {
    id: string;
    heading: string;
    text: string;
    prio: number;
    buzzer?: string;
    blink?: number;
    colors?: ScreensaverNotifyCustomColors;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * The fields of a message of the sendTo `screensaverNotify` with an `id` - the fields of `setPopupNotification`,
 * those that only the popup knows are ignored. Also reads the JSON of `cmd/screensaverNotificationCustom` again.
 *
 * @param message the message
 * @returns the details, undefined without an `id`
 */
export function parseScreensaverNotifyDetails(message: unknown): ScreensaverNotifyDetails | undefined {
    if (!isRecord(message) || typeof message.id !== 'string' || message.id === '') {
        return undefined;
    }
    const headline =
        typeof message.headline === 'string'
            ? message.headline
            : typeof message.heading === 'string'
              ? message.heading
              : '';
    const buzzer =
        message.buzzer === true
            ? screensaverNotifyDefaultBuzzer
            : typeof message.buzzer === 'string' && message.buzzer.trim()
              ? message.buzzer.trim()
              : undefined;
    return {
        id: message.id,
        priority:
            typeof message.priority === 'number' && Number.isFinite(message.priority)
                ? message.priority
                : SCREENSAVER_NOTIFY_DEFAULT_PRIORITY,
        enabled: message.enabled !== false,
        headline,
        text: typeof message.text === 'string' ? message.text : '',
        icon: typeof message.icon === 'string' && message.icon !== '' ? message.icon : undefined,
        buzzer,
        colorHeadline: message.colorHeadline != null ? getRGBFromValue(message.colorHeadline) : undefined,
        colorText: message.colorText != null ? getRGBFromValue(message.colorText) : undefined,
        backgroundBlink: isHexColor(message.backgroundBlink) ? message.backgroundBlink : undefined,
        type: message.type === 'acknowledge' ? 'acknowledge' : 'information',
        global: message.global !== false,
    };
}

/**
 * true when the details take the id (or all ids with this prefix) out of the queue
 *
 * @param details the details
 */
export function removesScreensaverNotify(details: ScreensaverNotifyDetails): boolean {
    return !details.enabled || details.priority <= 0;
}

/**
 * The queue after the details: the same id replaces the entry (it keeps its place among those of the same
 * priority), priority <= 0 or `enabled: false` removes the id, priority <= -100 removes all ids with this prefix.
 * Sorted by priority, the older first with the same priority, at most {@link SCREENSAVER_NOTIFY_QUEUE_MAX}.
 *
 * @param queue the queue so far
 * @param details new details
 * @param seq order number of the details (rising)
 * @returns the new queue
 */
export function applyScreensaverNotify(
    queue: readonly ScreensaverNotifyQueueEntry[],
    details: ScreensaverNotifyDetails,
    seq: number,
): ScreensaverNotifyQueueEntry[] {
    if (removesScreensaverNotify(details)) {
        if (details.priority <= -100) {
            return queue.filter(e => !e.id.startsWith(details.id));
        }
        return queue.filter(e => e.id !== details.id);
    }
    const index = queue.findIndex(e => e.id === details.id);
    const entry = screensaverNotifyQueueEntry(details, index === -1 ? seq : queue[index].seq);
    const next = index === -1 ? [...queue, entry] : queue.map((e, i) => (i === index ? entry : e));
    return next.sort((a, b) => a.priority - b.priority || a.seq - b.seq).slice(0, SCREENSAVER_NOTIFY_QUEUE_MAX);
}

/**
 * @param details details with an id
 * @param seq order number
 * @returns the entry of the queue
 */
export function screensaverNotifyQueueEntry(
    details: ScreensaverNotifyDetails,
    seq: number,
): ScreensaverNotifyQueueEntry {
    const { heading, text } = screensaverNotifyLines({
        icon: details.icon ? Icons.GetIcon(details.icon) : '',
        headline: details.headline,
        text: details.text,
    });
    return {
        id: details.id,
        priority: details.priority,
        heading,
        text,
        buzzer: details.buzzer,
        blink: isHexColor(details.backgroundBlink)
            ? Color.rgb_dec565(Color.ConvertHexToRgb(details.backgroundBlink))
            : undefined,
        colors: { head: details.colorHeadline, text: details.colorText },
        acknowledge: details.type === 'acknowledge',
        global: details.global,
        seq,
    };
}

/**
 * @param entry entry of the queue
 * @returns the entry as the screensaver compares it with the admin list
 */
export function screensaverNotifyQueueCandidate(entry: ScreensaverNotifyQueueEntry): ScreensaverNotifyCandidate {
    return {
        id: `${SCREENSAVER_NOTIFY_QUEUE_PREFIX}${entry.id}`,
        heading: entry.heading,
        text: entry.text,
        prio: entry.priority,
        buzzer: entry.buzzer,
        blink: entry.blink,
        colors: entry.colors,
    };
}

/**
 * @param activeId id of the active notification of the screensaver
 * @returns the id of the queue entry, undefined for a notification of the admin list
 */
export function screensaverNotifyQueueId(activeId: string): string | undefined {
    return activeId.startsWith(SCREENSAVER_NOTIFY_QUEUE_PREFIX)
        ? activeId.slice(SCREENSAVER_NOTIFY_QUEUE_PREFIX.length)
        : undefined;
}

/**
 * The queue and the admin list in one order: by priority (lower first). With the same priority an entry of the queue
 * comes before one of the admin list; within each the order stays (queue: older first, admin list: as sorted).
 *
 * @param queue candidates of the queue, in the order of the queue
 * @param admin candidates of the admin list, sorted by priority
 * @returns all candidates, the one to show first
 */
export function mergeScreensaverNotify(
    queue: readonly ScreensaverNotifyCandidate[],
    admin: readonly ScreensaverNotifyCandidate[],
): ScreensaverNotifyCandidate[] {
    // the sort is stable: the queue in front wins a tie
    return [...queue, ...admin].sort((a, b) => a.prio - b.prio);
}
