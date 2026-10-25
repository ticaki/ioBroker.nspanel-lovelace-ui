import type { ParseContext } from '../CardContract';
import { emptyEntity, field, parseEntityUpdHeader, toNumber } from '../../protocol/split';
import type { Navigation } from '../../protocol/types';

/**
 * One of the up to 8 hvac mode buttons at the bottom of the card:
 * `icon~iconColorActive~buttonState~intName` (4 fields, see HMI/Readme.md cardThermo 21-52).
 */
export interface ThermoAction {
    /** icon glyph, empty = slot not used */
    icon: string;
    /** RGB565 colour used while `active` */
    color: number;
    /** `buttonState` 1 = drawn in `color`, 0 = drawn grey */
    active: boolean;
    /** internal name sent back as `event,buttonPress2,<page>,hvac_action,<id>` */
    id: string;
}

export const THERMO_ACTIONS = 8;
const ACTION_FIELDS = 4;

/** Parsed `entityUpd` of `cardThermo`. All temperatures are multiplied by 10 (so 215 = 21.5). */
export interface CardThermoModel {
    /** false until the first `entityUpd` arrived */
    received: boolean;
    title: string;
    navigation: Navigation;
    /** `intNameEntity`, the page id used in every event of this card */
    id: string;
    /** text of the 2nd box (left side), already formatted by the adapter (e.g. `21.5 °C`) */
    currentTemp: string;
    /** target temperature *10 */
    dstTemp: number;
    /** text of the 4th box (left side) */
    status: string;
    minTemp: number;
    maxTemp: number;
    /** step *10, at least 1 */
    tempStep: number;
    /** 8 bottom buttons, unused slots have an empty icon */
    actions: ThermoAction[];
    /** label of the 1st box (`Currently`) */
    curTempLabel: string;
    /** label of the 3rd box (`State`) */
    stateLabel: string;
    /** temperature unit shown next to the target (`°C`) */
    unit: string;
    /** second target temperature *10 (heat/cool), undefined = single target */
    temp2: number | undefined;
    /** true when the detail button (opens popupThermo) is shown; `btDetail` field is `1` to hide */
    detail: boolean;
}

export function initial(): CardThermoModel {
    return {
        received: false,
        title: '',
        navigation: { left: emptyEntity(), right: emptyEntity() },
        id: '',
        currentTemp: '',
        dstTemp: 0,
        status: '',
        minTemp: 150,
        maxTemp: 300,
        tempStep: 5,
        actions: Array.from({ length: THERMO_ACTIONS }, () => emptyAction()),
        curTempLabel: '',
        stateLabel: '',
        unit: '',
        temp2: undefined,
        detail: false,
    };
}

export function emptyAction(): ThermoAction {
    return { icon: '', color: 65535, active: false, id: '' };
}

/**
 * Parses the 8 hvac action tuples.
 *
 * @param fields the fields of the payload
 * @param offset index of the first `icon` field
 */
export function parseActions(fields: readonly string[], offset: number): ThermoAction[] {
    const result: ThermoAction[] = [];
    for (let i = 0; i < THERMO_ACTIONS; i++) {
        const o = offset + i * ACTION_FIELDS;
        result.push({
            icon: field(fields, o),
            color: toNumber(fields[o + 1], 65535),
            active: field(fields, o + 2) === '1',
            id: field(fields, o + 3),
        });
    }
    return result;
}

/**
 * `entityUpd~title~[nav]~[nav]~intNameEntity~currentTemp~dstTemp~status~minTemp~maxTemp~tempStep~
 * [8 x icon~iconColorActive~buttonState~intName]~tCurTempLbl~tStateLbl~tALbl~tCF~temp2~btDetail`
 *
 * `args` are the fields after `entityUpd`, so the HMI field numbers of the Readme minus 1.
 */
export function parseEntityUpd(args: string[], _prev: CardThermoModel, _ctx: ParseContext): CardThermoModel {
    const head = parseEntityUpdHeader(args);
    const r = head.rest; // r[0] = intNameEntity (field 14)
    const tail = 7 + THERMO_ACTIONS * ACTION_FIELDS; // index of tCurTempLbl in r
    const temp2Field = field(r, tail + 4);
    const minTemp = toNumber(r[4], 150);
    const maxTemp = toNumber(r[5], 300);
    return {
        received: true,
        title: head.title,
        navigation: head.navigation,
        id: field(r, 0),
        currentTemp: field(r, 1),
        dstTemp: toNumber(r[2], minTemp),
        status: field(r, 3),
        minTemp,
        maxTemp,
        tempStep: Math.max(1, toNumber(r[6], 5)),
        actions: parseActions(r, 7),
        curTempLabel: field(r, tail),
        stateLabel: field(r, tail + 1),
        // tail + 2 = tALbl, deprecated and ignored by the HMI
        unit: field(r, tail + 3),
        temp2: temp2Field === '' ? undefined : toNumber(temp2Field, 0),
        detail: field(r, tail + 5) !== '1',
    };
}

/**
 * `entityUpdateDetail` belongs to `popupThermo`, which the adapter opens as its own page.
 * The card itself has nothing to show for it.
 */
export function parseEntityUpdateDetail(
    _args: string[],
    _prev: CardThermoModel,
    _ctx: ParseContext,
): CardThermoModel | undefined {
    return undefined;
}

export function handleCommand(
    _cmd: string,
    _args: string[],
    _prev: CardThermoModel,
    _ctx: ParseContext,
): CardThermoModel | undefined {
    return undefined;
}

/**
 * Formats a temperature that is multiplied by 10 like the xfloat of the HMI: one decimal.
 *
 * @param tenths the value *10
 */
export function formatTenths(tenths: number): string {
    const v = Math.round(tenths);
    const sign = v < 0 ? '-' : '';
    const abs = Math.abs(v);
    return `${sign}${Math.floor(abs / 10)}.${abs % 10}`;
}

/**
 * Clamps a target temperature into `[min, max]`, the same as the plus/minus code of the HMI.
 */
export function clampTemp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}
