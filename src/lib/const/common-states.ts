/**
 * Helpers that resolve values against `common.states` of a datapoint at runtime.
 *
 * Several page items used to copy `common.states` into the configuration when the panel was built
 * (as a generated read/write script or as a constant list). A changed `common.states` then only
 * reached the panel after an adapter restart. The data item option `commonStates` keeps only the
 * datapoint and a token in the configuration, these helpers resolve them when the value is read
 * or written - with the same result the generated scripts produced for an unchanged `common.states`.
 */
import type { NSPanel } from '../types/NSPanel';

/** The shapes `common.states` can have in ioBroker */
export type CommonStatesValue = ioBroker.StateCommon['states'];

/** Mode list of an airCondition or thermostat without `common.states` */
export const DEFAULT_CLIMATE_MODES: readonly string[] = ['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN_ONLY', 'DRY'];

/** A key of `common.states` that the generated scripts wrote as a number literal */
const NUMERIC_KEY = /^-?\d+(\.\d+)?$/;

/**
 * `common.states` as a record - an array becomes a record with the position as key.
 * The deprecated string form ("0:off;1:on") is not supported, as everywhere else in the adapter.
 *
 * @param states common.states of the datapoint
 * @returns the record or null when there are no usable states
 */
export function commonStatesToRecord(states: CommonStatesValue | null | undefined): Record<string, string> | null {
    if (!states || typeof states === 'string') {
        return null;
    }
    if (Array.isArray(states)) {
        const record: Record<string, string> = {};
        states.forEach((text, index) => (record[String(index)] = text));
        return record;
    }
    return states;
}

/**
 * The display text of a value - what `return <states>[val]` and `return <states>[val] || val` did.
 *
 * @param states common.states of the datapoint (array or record)
 * @param val the raw value of the state
 * @param keepValue true: an unknown value (or an empty text) is shown as it is, false: undefined
 * @returns the text, the raw value or undefined
 */
export function resolveStatesText<T>(
    states: CommonStatesValue | null | undefined,
    val: T,
    keepValue: boolean,
): string | T | undefined {
    const record = commonStatesToRecord(states);
    let text: string | undefined = undefined;
    if (record && (val === null || typeof val !== 'object')) {
        const key = String(val);
        if (Object.prototype.hasOwnProperty.call(record, key)) {
            text = record[key];
        }
    }
    if (keepValue) {
        return text || val;
    }
    return text;
}

/**
 * The keys or the texts of common.states as strings - the lists the fan popup offers.
 *
 * @param states common.states of the datapoint
 * @param part 'keys' for the values the state takes, 'values' for the texts
 * @returns the list, empty without usable states
 */
export function statesList(states: CommonStatesValue | null | undefined, part: 'keys' | 'values'): string[] {
    const record = commonStatesToRecord(states);
    if (!record) {
        return [];
    }
    return part === 'keys' ? Object.keys(record).map(String) : Object.values(record).map(String);
}

/**
 * The value a mode token (e.g. 'COOL') stands for in common.states.
 *
 * common.states has two shapes. As an array the position is the state value. As a record - the
 * normal case in ioBroker - the key is the state value and the token is the text, so the record is
 * searched by text and the key is the result; a numeric key is a number unless the state is a
 * string. A record that uses the tokens as keys takes the token itself. If the state is a string,
 * the token of an array is the state value.
 *
 * @param token mode token, e.g. 'COOL'
 * @param states common.states of the datapoint
 * @param stateType common.type of the datapoint
 * @returns the value to write and compare against, undefined if the token is unknown
 */
export function resolveStatesToken(
    token: string,
    states: CommonStatesValue | readonly string[] | null | undefined,
    stateType: ioBroker.CommonType | undefined,
): string | number | undefined {
    if (Array.isArray(states)) {
        const position = states.indexOf(token);
        if (position === -1) {
            return undefined;
        }
        return stateType === 'string' ? token : position;
    }
    if (states && typeof states === 'object') {
        const record: Record<string, string> = states as Record<string, string>;
        for (const key of Object.keys(record)) {
            if (record[key] === token) {
                return stateType !== 'string' && NUMERIC_KEY.test(key) ? Number(key) : key;
            }
        }
        // tokens used as keys: then the token itself is the state value
        if (record[token] !== undefined) {
            return token;
        }
    }
    return undefined;
}

/**
 * Compares a state value with a resolved token like the generated `return val == <literal>` did.
 *
 * @param val the raw value of the state
 * @param resolved the value of the token
 * @returns true if the state is in this mode
 */
export function matchesStatesToken(val: unknown, resolved: string | number): boolean {
    // the generated scripts compared loosely: 2 == '2'
    return val == resolved;
}

/**
 * A copy of a state or triggered data item that resolves against common.states at runtime. The option replaces
 * the read script, a token replaces the write script as well.
 *
 * @param item data item options of the datapoint
 * @param commonStates the option
 * @returns the new options, undefined if the item is no state or triggered data item
 */
export function withCommonStates(
    item: NSPanel.DataItemsOptions,
    commonStates: NSPanel.DataItemCommonStates,
): NSPanel.DataItemsOptions | undefined {
    if (item.type !== 'state' && item.type !== 'triggered') {
        return undefined;
    }
    const result: NSPanel.DataItemsOptions = { ...item, commonStates };
    delete result.read;
    if (commonStates.mode === 'token') {
        delete result.write;
    }
    return result;
}
