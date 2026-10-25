import type { ParseContext } from '../CardContract';
import { emptyEntity, field, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Navigation } from '../../protocol/types';

/** fields of one power item: `type~intName~icon~iconColor~displayName~value~speed` */
export const POWER_ITEM_FIELDS = 7;
/** number of items around the house: 3 left, 3 right */
export const POWER_SLOTS = 6;
/** the HMI limits the speed to this range (HMI/Readme.md) */
export const MAX_SPEED = 120;

/** position of a slot around the house, in the order of the payload */
export type PowerSlotPosition = 'leftTop' | 'leftMiddle' | 'leftBottom' | 'rightTop' | 'rightMiddle' | 'rightBottom';

export const POWER_SLOT_POSITIONS: readonly PowerSlotPosition[] = [
    'leftTop',
    'leftMiddle',
    'leftBottom',
    'rightTop',
    'rightMiddle',
    'rightBottom',
];

export interface PowerSlot {
    position: PowerSlotPosition;
    icon: string;
    /** RGB565 */
    iconColor: number;
    /** text of the item (`text` on/off of the adapter), mostly empty */
    name: string;
    /** value with unit, e.g. `3502.5 kWh` */
    value: string;
    /** -120 … 120; positive = flow towards the house, negative = away from it, 0 = no flow */
    speed: number;
    /** nothing to draw (adapter sends an item without data, readme uses `delete`) */
    empty: boolean;
}

export interface PowerHome {
    icon: string;
    iconColor: number;
    name: string;
    /** value shown below the icon */
    valueBottom: string;
    /** value shown above the icon */
    valueTop: string;
}

export interface CardPowerModel {
    title: string;
    navigation: Navigation;
    home: PowerHome;
    /** always 6 entries, in the order of {@link POWER_SLOT_POSITIONS} */
    slots: PowerSlot[];
}

export function emptySlot(position: PowerSlotPosition): PowerSlot {
    return { position, icon: '', iconColor: 65535, name: '', value: '', speed: 0, empty: true };
}

export function initial(): CardPowerModel {
    return {
        title: '',
        navigation: { left: emptyEntity(), right: emptyEntity() },
        home: { icon: '', iconColor: 65535, name: '', valueBottom: '', valueTop: '' },
        slots: POWER_SLOT_POSITIONS.map(emptySlot),
    };
}

/** clamps the speed to the range of the HMI, invalid input gives 0 */
export function clampSpeed(raw: string | undefined): number {
    const n = toNumber(raw, 0);
    return Math.max(-MAX_SPEED, Math.min(MAX_SPEED, n));
}

function parseSlot(fields: readonly string[], offset: number, position: PowerSlotPosition): PowerSlot {
    const type = field(fields, offset);
    const icon = field(fields, offset + 2);
    const name = field(fields, offset + 4);
    const value = field(fields, offset + 5);
    return {
        position,
        icon,
        iconColor: toNumber(fields[offset + 3], 65535),
        name,
        value,
        speed: clampSpeed(fields[offset + 6]),
        empty: type === 'delete' || (icon === '' && name === '' && value === ''),
    };
}

/**
 * `entityUpd~title~[nav left]~[nav right]~[home: ~~icon~color~name~valueBottom~]~[~~~~~valueTop~]~[6 items of 7 fields]`
 * (see `getMessage` in `src/lib/pages/pagePower.ts`)
 *
 * @param args fields after `entityUpd`
 */
export function parseEntityUpd(args: string[], _prev: CardPowerModel, _ctx: ParseContext): CardPowerModel {
    const { title, navigation, rest } = parseEntityUpdHeader(args);
    const home: PowerHome = {
        icon: field(rest, 2),
        iconColor: toNumber(rest[3], 65535),
        name: field(rest, 4),
        valueBottom: field(rest, 5),
        valueTop: field(rest, POWER_ITEM_FIELDS + 5),
    };
    const slots = POWER_SLOT_POSITIONS.map((position, i) =>
        parseSlot(rest, 2 * POWER_ITEM_FIELDS + i * POWER_ITEM_FIELDS, position),
    );
    return { title, navigation, home, slots };
}

/**
 * The HMI shows the two values of the house in two lines: the number and the unit
 * (`0` / `W`). The adapter sends `<value> <unit>`, so the text is split at its last space.
 *
 * @param value the value as sent
 */
export function homeLines(value: string): string[] {
    const text = value.trim();
    if (text === '') {
        return [];
    }
    const at = text.lastIndexOf(' ');
    if (at <= 0) {
        return [text];
    }
    return [text.slice(0, at).trimEnd(), text.slice(at + 1)];
}

/** the power card has no popups */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardPowerModel,
    _ctx: ParseContext,
): CardPowerModel | undefined {
    return undefined;
}

/** no other commands are known for the power card */
export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardPowerModel,
    _ctx: ParseContext,
): CardPowerModel | undefined {
    return undefined;
}
