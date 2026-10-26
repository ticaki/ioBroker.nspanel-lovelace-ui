import type { ParseContext } from '../CardContract';
import { emptyEntity, field, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Navigation } from '../../protocol/types';

/** number of action buttons on the right side of the numpad */
export const ALARM_BUTTONS = 4;

/** one of the (up to four) action buttons right of the numpad */
export interface AlarmButton {
    /** text of the button, empty = button not shown */
    label: string;
    /** action sent in `event,buttonPress2,<id>,<action>,<pin>` (A1-A4, D1-D4, U1); empty = label only, no event */
    action: string;
}

/**
 * Model of `cardAlarm` (and `cardUnlock`, which the adapter sends as `cardAlarm` with
 * other texts). The entered PIN is not part of the model, it lives in the component.
 */
export interface CardAlarmModel {
    title: string;
    navigation: Navigation;
    /** internal name of the card, first field of every event */
    id: string;
    buttons: AlarmButton[];
    /** status icon next to the PIN field */
    icon: string;
    /** RGB565 */
    iconColor: number;
    /** `enable` = digits can be entered */
    numpadEnabled: boolean;
    /** `enable` = the status icon blinks */
    flashing: boolean;
    /** optional button in the bottom left corner (fields 27-29 of HMI/Readme.md, not sent by the adapter) */
    cornerButton: { icon: string; iconColor: number; id: string } | undefined;
}

export function initial(): CardAlarmModel {
    return {
        title: '',
        navigation: { left: emptyEntity(), right: emptyEntity() },
        id: '',
        buttons: [],
        icon: '',
        iconColor: 65535,
        numpadEnabled: false,
        flashing: false,
        cornerButton: undefined,
    };
}

function isEnabled(value: string): boolean {
    return value === 'enable';
}

/**
 * `entityUpd~title~[nav left]~[nav right]~id~label1~action1~…~label4~action4~icon~iconColor~numpad~flashing[~cornerIcon~cornerColor~cornerId]`
 *
 * @param args fields after `entityUpd`
 */
export function parseEntityUpd(args: string[], _prev: CardAlarmModel, _ctx: ParseContext): CardAlarmModel {
    const { title, navigation, rest } = parseEntityUpdHeader(args);
    const buttons: AlarmButton[] = [];
    for (let i = 0; i < ALARM_BUTTONS; i++) {
        buttons.push({ label: field(rest, 1 + i * 2), action: field(rest, 2 + i * 2) });
    }
    const cornerIcon = field(rest, 13);
    const cornerId = field(rest, 15);
    return {
        title,
        navigation,
        id: field(rest, 0),
        buttons,
        icon: field(rest, 9),
        iconColor: toNumber(rest[10], 65535),
        numpadEnabled: isEnabled(field(rest, 11)),
        flashing: isEnabled(field(rest, 12)),
        cornerButton:
            cornerIcon !== '' || cornerId !== ''
                ? { icon: cornerIcon, iconColor: toNumber(rest[14], 65535), id: cornerId }
                : undefined,
    };
}

/** the alarm card has no popups */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardAlarmModel,
    _ctx: ParseContext,
): CardAlarmModel | undefined {
    return undefined;
}

/** no other commands are known for the alarm card */
export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardAlarmModel,
    _ctx: ParseContext,
): CardAlarmModel | undefined {
    return undefined;
}
