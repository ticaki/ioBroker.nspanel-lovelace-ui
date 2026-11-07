/**
 * Values of a screensaver indicator that cycles through a list ("values to cycle through"): each press writes
 * the next value of the list to the state, after the last one it starts again with the first.
 *
 * Pure functions without adapter types - shared by the adapter (PageItem.onCommand) and the admin (validation).
 */

/**
 * Number of a text, a comma as decimal separator is allowed.
 *
 * @param text trimmed text, not empty
 * @returns the finite number, null when the text is none
 */
function cycleNumber(text: string): number | null {
    const n = Number(text.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

/**
 * The list of a script element as the texts of the admin: numbers and booleans become texts, values are trimmed,
 * empty ones and anything that is no value are left out.
 *
 * @param list value of the script element
 * @returns the texts in the order of the list, empty when the value is no list
 */
export function normalizeCycleValues(list: unknown): string[] {
    if (!Array.isArray(list)) {
        return [];
    }
    return list
        .filter(v => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')
        .map(v => String(v).trim())
        .filter(v => v !== '');
}

/**
 * The text of a list entry as the value to write. `StatesControler.setState` turns everything into a boolean with
 * `!!val` for a boolean state, so the text "false" would become true - it has to be converted here.
 *
 * @param value text of the list entry
 * @param type common.type of the state, anything else than number, boolean and string counts as mixed
 * @returns the value, null when the text is empty or does not fit the type
 */
export function cycleValueToState(value: string, type: string | undefined): string | number | boolean | null {
    const text = value.trim();
    if (text === '') {
        return null;
    }
    const lower = text.toLowerCase();
    switch (type) {
        case 'number':
            return cycleNumber(text);
        case 'boolean':
            if (lower === 'true' || lower === '1') {
                return true;
            }
            return lower === 'false' || lower === '0' ? false : null;
        case 'string':
            return text;
        default:
            if (lower === 'true' || lower === 'false') {
                return lower === 'true';
            }
            return cycleNumber(text) ?? text;
    }
}

/**
 * Index of the value the next press writes.
 *
 * The last written index counts as the position while its value is still the value of the state - that makes
 * repeated values like `0,1,0,-1` possible. Otherwise the first entry with the value of the state is the position.
 * A state without a matching entry (no value yet, changed from outside) starts with the first entry.
 *
 * @param values list of values
 * @param current raw value of the state
 * @param type common.type of the state
 * @param last index written last, undefined = none yet
 * @returns index into `values`, 0 for an empty list
 */
export function nextCycleIndex(
    values: readonly string[],
    current: unknown,
    type: string | undefined,
    last: number | undefined,
): number {
    if (typeof current !== 'string' && typeof current !== 'number' && typeof current !== 'boolean') {
        return 0;
    }
    const value = cycleValueToState(String(current), type);
    if (value === null) {
        return 0;
    }
    const matches = (entry: string | undefined): boolean =>
        entry !== undefined && cycleValueToState(entry, type) === value;
    const position = last !== undefined && matches(values[last]) ? last : values.findIndex(entry => matches(entry));
    return position < 0 ? 0 : (position + 1) % values.length;
}
