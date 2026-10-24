import type { ParseContext } from '../CardContract';
import { field, toNumber } from '../../protocol/split';

/** One of the three buttons at the bottom of the popup: hidden when `text` is empty */
export interface NotifyButton {
    text: string;
    /** RGB565 */
    color: number;
}

/**
 * Model of `popupNotify` / `popupNotify2`. Filled by
 * `entityUpdateDetail~id~heading~hColor~b1~b1Color~b2~b2Color~b3~b3Color~text~textColor~timeout~font~icon~iconColor`
 * (`PagePopup.getMessage` in the adapter).
 */
export interface PopupNotifyModel {
    /** internal name, sent back as id of `notifyAction` */
    entityName: string;
    heading: string;
    /** RGB565 */
    headingColor: number;
    /** left, middle, right: `notifyAction,button1|button2|button3` */
    buttons: [NotifyButton, NotifyButton, NotifyButton];
    /** text with `\n` line breaks */
    text: string;
    /** RGB565 */
    textColor: number;
    /** seconds until the popup closes itself (`bExit`), 0 = never */
    timeout: number;
    /** HMI font id 0-5 */
    font: number;
    /** glyph, empty = text only layout */
    icon: string;
    /** RGB565 */
    iconColor: number;
    /** counts `entityUpdateDetail` payloads - a new one restarts the timeout */
    updates: number;
    /** counts `exitPopup` commands - the component answers with `bExit` */
    exitRequests: number;
}

/** Font ids of the HMI (`fontIdText`) -> size in stage pixels */
const FONT_SIZES: Readonly<Record<number, number>> = { 0: 24, 1: 32, 2: 32, 3: 48, 4: 80, 5: 128 };

export function fontSize(font: number): number {
    return FONT_SIZES[font] ?? 24;
}

export function initial(): PopupNotifyModel {
    return {
        entityName: 'popupNotify',
        heading: '',
        headingColor: 65535,
        buttons: [
            { text: '', color: 65535 },
            { text: '', color: 65535 },
            { text: '', color: 65535 },
        ],
        text: '',
        textColor: 65535,
        timeout: 0,
        font: 0,
        icon: '',
        iconColor: 65535,
        updates: 0,
        exitRequests: 0,
    };
}

/**
 * Normalises the line breaks of the text: the adapter sends real `\r\n`; the literal
 * sequence `\r\n` (backslashes) is accepted too, so one line example files can carry
 * multi line texts.
 */
export function normalizeText(text: string): string {
    return text.replaceAll('\\r\\n', '\n').replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

/** The popup never receives `entityUpd`; the model stays */
export function parseEntityUpd(_args: string[], prev: PopupNotifyModel, _ctx: ParseContext): PopupNotifyModel {
    return prev;
}

export function parseEntityUpdateDetail(args: string[], prev: PopupNotifyModel, _ctx: ParseContext): PopupNotifyModel {
    const button = (i: number): NotifyButton => ({ text: field(args, i), color: toNumber(args[i + 1], 65535) });
    return {
        entityName: field(args, 0) || prev.entityName,
        heading: field(args, 1),
        headingColor: toNumber(args[2], 65535),
        buttons: [button(3), button(5), button(7)],
        text: normalizeText(field(args, 9)),
        textColor: toNumber(args[10], 65535),
        timeout: Math.max(0, toNumber(args[11], 0)),
        font: toNumber(args[12], 0),
        icon: field(args, 13),
        iconColor: toNumber(args[14], 65535),
        updates: prev.updates + 1,
        exitRequests: prev.exitRequests,
    };
}

/**
 * `timeout2~s` replaces the timeout of the popup, `exitPopup` closes it (the HMI "clicks"
 * its own X, so `bExit` is sent).
 */
export function handleCommand(
    cmd: string,
    args: string[],
    prev: PopupNotifyModel,
    _ctx: ParseContext,
): PopupNotifyModel | undefined {
    switch (cmd) {
        case 'timeout2':
            return { ...prev, timeout: Math.max(0, toNumber(args[0], 0)), updates: prev.updates + 1 };
        case 'exitPopup':
            return { ...prev, exitRequests: prev.exitRequests + 1 };
        default:
            return undefined;
    }
}
