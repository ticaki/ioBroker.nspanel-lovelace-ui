import type { ParseContext } from '../CardContract';
import { field, toNumber } from '../../protocol/split';
import { normalizeText } from '../popupNotify/parse';

/** One of the two side buttons: hidden when `icon` is empty */
export interface Notify3Button {
    /** icon glyph */
    icon: string;
    /** RGB565, background of the button */
    color: number;
}

/**
 * Model of `popupNotify3` (HMI 6.2.0: big icon, one text line, two icon buttons). Filled by
 * `entityUpdateDetail~id~icon~iconColor~text~textColor~font~btnLeftIcon~btnLeftColor~btnRightIcon~btnRightColor~timeout`
 * (`popupNotify3Message` in the adapter, `src/lib/pages/popupNotify3.ts`).
 */
export interface PopupNotify3Model {
    /** internal name, sent back as id of `notifyAction` */
    entityName: string;
    /** glyph of the big icon */
    icon: string;
    /** RGB565 */
    iconColor: number;
    /** text with `\n` line breaks - the adapter fits it into the lines already */
    text: string;
    /** RGB565 */
    textColor: number;
    /** HMI font id of the text: 0 (24 px), 2 (32 px), 3 (48 px, also when empty) */
    font: number;
    /** left (`notifyAction,button1`) and right (`notifyAction,button3`) */
    buttons: [Notify3Button, Notify3Button];
    /** seconds until the popup closes itself (`bExit`), 0 = never */
    timeout: number;
    /** counts `entityUpdateDetail` payloads - a new one restarts the timeout */
    updates: number;
    /** counts `exitPopup` commands - the component answers with `bExit` */
    exitRequests: number;
}

export function initial(): PopupNotify3Model {
    return {
        entityName: 'popupNotify3',
        icon: '',
        iconColor: 65535,
        text: '',
        textColor: 65535,
        font: 3,
        buttons: [
            { icon: '', color: 65535 },
            { icon: '', color: 65535 },
        ],
        timeout: 0,
        updates: 0,
        exitRequests: 0,
    };
}

/** The popup never receives `entityUpd`; the model stays */
export function parseEntityUpd(_args: string[], prev: PopupNotify3Model, _ctx: ParseContext): PopupNotify3Model {
    return prev;
}

export function parseEntityUpdateDetail(
    args: string[],
    prev: PopupNotify3Model,
    _ctx: ParseContext,
): PopupNotify3Model {
    const button = (i: number): Notify3Button => ({ icon: field(args, i), color: toNumber(args[i + 1], 65535) });
    const font = field(args, 5);
    return {
        entityName: field(args, 0) || prev.entityName,
        icon: field(args, 1),
        iconColor: toNumber(args[2], 65535),
        text: normalizeText(field(args, 3)),
        textColor: toNumber(args[4], 65535),
        font: font === '' ? 3 : toNumber(font, 3),
        buttons: [button(6), button(8)],
        timeout: Math.max(0, toNumber(args[10], 0)),
        updates: prev.updates + 1,
        exitRequests: prev.exitRequests,
    };
}

/**
 * `timeout2~s` replaces the timeout of the popup, `exitPopup` closes it (the HMI "clicks"
 * its own X, so `bExit` is sent) - the page is a copy of popupNotify.
 */
export function handleCommand(
    cmd: string,
    args: string[],
    prev: PopupNotify3Model,
    _ctx: ParseContext,
): PopupNotify3Model | undefined {
    switch (cmd) {
        case 'timeout2':
            return { ...prev, timeout: Math.max(0, toNumber(args[0], 0)), updates: prev.updates + 1 };
        case 'exitPopup':
            return { ...prev, exitRequests: prev.exitRequests + 1 };
        default:
            return undefined;
    }
}
