import type { ParseContext } from '../CardContract';
import { ENTITY_FIELDS, emptyEntity, field, parseEntity6, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Entity6, Navigation } from '../../protocol/types';

/** number of slots for page items around the ring: 4 left, 4 right, 1 between minus and plus */
export const THERMO2_SLOTS = 9;
/** number of fixed info entities before the slots (icon1, value1, unit1, icon2, value2, unit2, mode) */
const INFO_ENTITIES = 7;

/** One of the two lines above/below the target: icon, value (*10) and unit, each with its own colour */
export interface ThermoInfoLine {
    icon: string;
    iconColor: number;
    /** value *10 */
    value: number;
    valueColor: number;
    unit: string;
    unitColor: number;
}

/**
 * Parsed `entityUpd` of `cardThermo2` (built by `PageThermo2.getMessage` in the adapter, there
 * is no description in HMI/Readme.md). All temperatures are multiplied by 10.
 */
export interface CardThermo2Model {
    /** false until the first `entityUpd` arrived */
    received: boolean;
    title: string;
    navigation: Navigation;
    /** page name, the id used in every event of this card */
    id: string;
    /** target *10 */
    dstTemp: number;
    minTemp: number;
    maxTemp: number;
    /** step *10, at least 1 */
    tempStep: number;
    unit: string;
    /**
     * false when the heating is off: the HMI hides the target and its unit
     * (field after the unit is `0`, or the optional value of the mode entity is `0`)
     */
    power: boolean;
    /** line above the target (usually room temperature) */
    line1: ThermoInfoLine;
    /** line below the target (usually humidity) */
    line2: ThermoInfoLine;
    /** mode text below the ring (`MANUAL`, `AUTO`, …) */
    mode: string;
    modeColor: number;
    /** 9 page items: 0-3 left column, 4-7 right column, 8 between minus and plus; empty type = unused */
    slots: Entity6[];
}

function emptyLine(): ThermoInfoLine {
    return { icon: '', iconColor: 65535, value: 0, valueColor: 65535, unit: '', unitColor: 65535 };
}

export function initial(): CardThermo2Model {
    return {
        received: false,
        title: '',
        navigation: { left: emptyEntity(), right: emptyEntity() },
        id: '',
        dstTemp: 0,
        minTemp: 150,
        maxTemp: 280,
        tempStep: 5,
        unit: '',
        power: true,
        line1: emptyLine(),
        line2: emptyLine(),
        mode: '',
        modeColor: 65535,
        slots: Array.from({ length: THERMO2_SLOTS }, () => emptyEntity()),
    };
}

/**
 * The adapter sends the info values as `text~<page>.<n>~<value>~<colour>~~` entities, so the
 * value sits in the icon field.
 */
function parseLine(fields: readonly string[], offset: number): ThermoInfoLine {
    const icon = parseEntity6(fields, offset);
    const value = parseEntity6(fields, offset + ENTITY_FIELDS);
    const unit = parseEntity6(fields, offset + 2 * ENTITY_FIELDS);
    return {
        icon: icon.icon,
        iconColor: icon.iconColor,
        value: toNumber(value.icon, 0),
        valueColor: value.iconColor,
        unit: unit.icon,
        unitColor: unit.iconColor,
    };
}

/**
 * `entityUpd~title~[nav]~[nav]~name~dstTemp~minTemp~maxTemp~tempStep~unit~power~
 * [7 info entities]~[9 slot entities]` - each entity has the usual 6 fields.
 */
export function parseEntityUpd(args: string[], _prev: CardThermo2Model, _ctx: ParseContext): CardThermo2Model {
    const head = parseEntityUpdHeader(args);
    const r = head.rest; // r[0] = name
    const minTemp = toNumber(r[2], 150);
    const maxTemp = toNumber(r[3], 280);
    const info = 7; // index of the first info entity in r
    const modeEntity = parseEntity6(r, info + 6 * ENTITY_FIELDS);
    const slotsStart = info + INFO_ENTITIES * ENTITY_FIELDS;
    const slots: Entity6[] = [];
    for (let i = 0; i < THERMO2_SLOTS; i++) {
        slots.push(parseEntity6(r, slotsStart + i * ENTITY_FIELDS));
    }
    return {
        received: true,
        title: head.title,
        navigation: head.navigation,
        id: field(r, 0),
        dstTemp: toNumber(r[1], minTemp),
        minTemp,
        maxTemp,
        tempStep: Math.max(1, toNumber(r[4], 5)),
        unit: field(r, 5),
        power: field(r, 6) !== '0' && modeEntity.optionalValue !== '0',
        line1: parseLine(r, info),
        line2: parseLine(r, info + 3 * ENTITY_FIELDS),
        mode: modeEntity.icon,
        modeColor: modeEntity.iconColor,
        slots,
    };
}

export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardThermo2Model,
    _ctx: ParseContext,
): CardThermo2Model | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardThermo2Model,
    _ctx: ParseContext,
): CardThermo2Model | undefined {
    return undefined;
}

/**
 * Formats a value that is multiplied by 10 like the xfloat of the HMI: one decimal.
 *
 * @param tenths the value *10
 */
export function formatTenths(tenths: number): string {
    const v = Math.round(tenths);
    const sign = v < 0 ? '-' : '';
    const abs = Math.abs(v);
    return `${sign}${Math.floor(abs / 10)}.${abs % 10}`;
}

export function clampTemp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** The ring is open at the bottom: 270 degrees from bottom left (min) clockwise to bottom right (max) */
export const RING_SWEEP = 270;
/** SVG angle (degrees, clockwise, 0 = right) of the ring start */
export const RING_START = 135;

/**
 * Position of a value on the ring as fraction 0..1 (0 = min, 1 = max).
 */
export function ringFraction(value: number, min: number, max: number): number {
    if (max <= min) {
        return 0;
    }
    return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The target temperature for a touch at `(dx, dy)` relative to the ring centre, like the
 * `touch_pos` timer of the HMI: the angle is mapped to 0..270 degrees, touches in the open
 * part at the bottom snap to min or max, the result is rounded to the step.
 *
 * @param dx x distance from the centre (stage pixels, right = positive)
 * @param dy y distance from the centre (stage pixels, down = positive)
 * @param min minimum *10
 * @param max maximum *10
 * @param step step *10
 */
export function tempFromTouch(dx: number, dy: number, min: number, max: number, step: number): number {
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, 0 = right, 90 = down
    let a = (deg - RING_START + 720) % 360; // 0 at the ring start, clockwise
    if (a > RING_SWEEP) {
        // open part at the bottom: nearest end wins
        a = a > RING_SWEEP + (360 - RING_SWEEP) / 2 ? 0 : RING_SWEEP;
    }
    const raw = min + ((max - min) * a) / RING_SWEEP;
    const s = Math.max(1, step);
    return clampTemp(min + Math.round((raw - min) / s) * s, min, max);
}
