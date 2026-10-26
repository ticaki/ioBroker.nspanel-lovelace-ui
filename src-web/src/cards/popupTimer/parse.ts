import type { ParseContext } from '../CardContract';
import { field, toNumber } from '../../protocol/split';

/** One of the three buttons at the bottom: hidden when `action` is empty */
export interface TimerButton {
    /** sent back as `timer-<action>` (`begin`, `pause`, `clear`, `finish`, `disable`) */
    action: string;
    label: string;
}

/**
 * Model of `popupTimer`. `PageItem.getDetailPayload` sends
 * `entityUpdateDetail~entityName~~iconColor~entityName~minutes~seconds~editable~action1~action2~action3~text1~text2~text3`.
 */
export interface PopupTimerModel {
    /** internal name of the timer item, sent back as id */
    entityName: string;
    /** glyph (field 1, empty in the adapter; fallback pageArgs[2]) */
    icon: string;
    /** RGB565 */
    iconColor: number;
    /** 0-59 (`ex-alarm` sends hours here) */
    minutes: number;
    /** 0-59 (`ex-alarm` sends minutes here) */
    seconds: number;
    /** minutes and seconds can be changed with +/- and are sent as `timer-start,00:m:s` */
    editable: boolean;
    buttons: [TimerButton, TimerButton, TimerButton];
    /** counts the payloads - a new one replaces a running edit */
    updates: number;
}

export function initial(): PopupTimerModel {
    return {
        entityName: '',
        icon: '',
        iconColor: 65535,
        minutes: 0,
        seconds: 0,
        editable: false,
        buttons: [
            { action: '', label: '' },
            { action: '', label: '' },
            { action: '', label: '' },
        ],
        updates: 0,
    };
}

/** clamps a time field to 0-59 like the HMI */
export function clampTime(value: number): number {
    return Math.max(0, Math.min(59, Math.trunc(value)));
}

/** The popup never receives `entityUpd`; the model stays */
export function parseEntityUpd(_args: string[], prev: PopupTimerModel, _ctx: ParseContext): PopupTimerModel {
    return prev;
}

export function parseEntityUpdateDetail(args: string[], prev: PopupTimerModel, ctx: ParseContext): PopupTimerModel {
    const button = (i: number): TimerButton => ({ action: field(args, 7 + i), label: field(args, 10 + i) });
    return {
        entityName: field(args, 3) || field(args, 0) || prev.entityName || field(ctx.pageArgs, 0),
        icon: field(args, 1) || prev.icon || field(ctx.pageArgs, 2),
        iconColor: toNumber(args[2], 65535),
        minutes: clampTime(toNumber(args[4], 0)),
        seconds: clampTime(toNumber(args[5], 0)),
        editable: field(args, 6) === '1',
        buttons: [button(0), button(1), button(2)],
        updates: prev.updates + 1,
    };
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: PopupTimerModel,
    _ctx: ParseContext,
): PopupTimerModel | undefined {
    return undefined;
}

/** two digits like the number fields of the HMI */
export function pad2(value: number): string {
    return value < 10 ? `0${value}` : String(value);
}
