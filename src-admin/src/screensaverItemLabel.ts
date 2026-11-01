/**
 * Names of screensaver items in the admin editor - pure logic without React, so it can be tested.
 *
 * Order for the short label of a place in the mock:
 * 1. headline of the item (ScreensaverEntityText for a raw script item)
 * 2. a plain state / object id: its common.name (when loaded), else the last part of the id
 * 3. a template: the template name without its type (`text.pirate-weather.favorit` → `pirate-weather favorit`)
 * 4. a regexp as state (dpInit): the last part of its readable prefix
 *
 * A regexp is never shown as such: `/^pirate-weather\.0\.weather\.currently\./` reads
 * `pirate-weather.0.weather.currently`. The full label (tooltip) adds template and state / prefix.
 */
import type { ScreensaverEntry, ScreensaverItemConfig } from '../../src/lib/types/adminShareConfig';

/** short and full name of an item: short for the place of the mock, full for its tooltip */
export interface ScreensaverItemLabel {
    short: string;
    full: string;
}

/** what names an item: the same for a normal item and a raw item */
interface LabelSource {
    headline: string;
    template: string;
    state: string;
}

/** characters that end the literal start of a regexp when they are not escaped */
const REGEX_META = new Set(['.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|', '^', '$']);

/**
 * the id is written as a regexp (`/.../flags`) - like getRegExp of the adapter reads it
 *
 * @param value state / dpInit
 * @returns true for a regexp
 */
export function isRegexId(value: string): boolean {
    const v = value.trim();
    return v.startsWith('/') && v.lastIndexOf('/') > 0;
}

/**
 * readable form of a state / dpInit: a plain id as it is, a regexp as its literal start without anchors,
 * escapes and the wildcard at the end (`/^alias\.0\.Window.+/` → `alias.0.Window`); '' when nothing
 * literal is left
 *
 * @param value state / dpInit
 * @returns the readable id or prefix
 */
export function readableIdPattern(value: string): string {
    const v = value.trim();
    if (!isRegexId(v)) {
        return v;
    }
    let body = v.slice(1, v.lastIndexOf('/'));
    body = body.replace(/^\^/, '');
    // a leading wildcard (`.*`, `.+?`) is no part of the id
    body = body.replace(/^(\.[*+]\??)+/, '');
    let out = '';
    for (let i = 0; i < body.length; i++) {
        const c = body[i];
        if (c === '\\') {
            // a run of backslashes escapes the next character (also a doubly escaped `\\.`)
            while (body[i] === '\\') {
                i++;
            }
            const next = body[i];
            if (next === undefined || /[a-zA-Z0-9]/.test(next)) {
                // \d, \w, \s ... are classes, no literal
                break;
            }
            out += next;
            continue;
        }
        if (REGEX_META.has(c)) {
            break;
        }
        out += c;
    }
    return out.replace(/^\.+/, '').replace(/\.+$/, '');
}

/**
 * readable name of a page item template: without its type, the parts separated by spaces
 * (`text.pirate-weather.favorit` → `pirate-weather favorit`, `text.clock` → `clock`)
 *
 * @param template template name
 * @returns readable name
 */
export function readableTemplateName(template: string): string {
    const parts = template
        .trim()
        .split('.')
        .filter(p => !!p);
    if (parts.length > 1) {
        parts.shift();
    }
    return parts.join(' ');
}

/**
 * last part of an id (`hm-rpc.0.ABC.TEMPERATURE` → `TEMPERATURE`)
 *
 * @param id plain id
 * @returns the last part, the id itself when it has none
 */
function lastSegment(id: string): string {
    const parts = id.split('.').filter(p => !!p);
    return parts[parts.length - 1] ?? id;
}

/**
 * common.name of an object as plain text (string or translations)
 *
 * @param name common.name
 * @param lang admin language
 * @returns the name, '' when there is none
 */
export function commonNameText(name: unknown, lang: string): string {
    if (typeof name === 'string') {
        return name.trim();
    }
    if (name && typeof name === 'object' && !Array.isArray(name)) {
        const entries = Object.entries(name).filter((e): e is [string, string] => typeof e[1] === 'string');
        const map = Object.fromEntries(entries);
        return (map[lang] || map.en || entries[0]?.[1] || '').trim();
    }
    return '';
}

/**
 * first set string field of a raw configuration
 *
 * @param config raw configuration
 * @param keys fields in their order
 * @returns the trimmed value, '' when none is set
 */
function firstString(config: Record<string, unknown>, keys: readonly string[]): string {
    for (const key of keys) {
        const value = config[key];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return '';
}

/**
 * is a plain object (no array)
 *
 * @param value anything
 * @returns true for an object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * headline, template and state of a raw configuration (script element or runtime item); a script item
 * with `native` names its inner object when it has none of its own
 *
 * @param config raw configuration
 * @returns the source of the name
 */
function rawSource(config: unknown): LabelSource {
    if (!isRecord(config)) {
        return { headline: '', template: '', state: '' };
    }
    const own: LabelSource = {
        headline: firstString(config, ['ScreensaverEntityText']),
        template: firstString(config, ['template']),
        state: firstString(config, ['dpInit', 'ScreensaverEntity', 'id']),
    };
    if (!own.headline && !own.template && !own.state && isRecord(config.native)) {
        return rawSource(config.native);
    }
    return own;
}

/**
 * headline, template and state of an item
 *
 * @param item stored item
 * @returns the source of the name
 */
function sourceOf(item: ScreensaverItemConfig): LabelSource {
    if (item.raw) {
        return rawSource(item.raw.config);
    }
    return { headline: (item.headline ?? '').trim(), template: (item.template ?? '').trim(), state: item.state.trim() };
}

/**
 * plain object id an item names (for loading its common.name); '' for none or a regexp
 *
 * @param item stored item
 * @returns the id
 */
export function screensaverItemObjectId(item: ScreensaverItemConfig): string {
    const state = sourceOf(item).state;
    return state && !isRegexId(state) ? state : '';
}

/**
 * plain object ids of all items of an entry (favorit, alternate, left, bottom, indicator), without doubles
 *
 * @param entry screensaver entry
 * @returns the ids
 */
export function screensaverEntryObjectIds(entry: ScreensaverEntry): string[] {
    const items: (ScreensaverItemConfig | undefined)[] = [
        entry.favorit,
        entry.alternate,
        ...(entry.left ?? []),
        ...(entry.bottom ?? []),
        ...(entry.indicator ?? []),
    ];
    const ids = new Set<string>();
    for (const item of items) {
        const id = item ? screensaverItemObjectId(item) : '';
        if (id) {
            ids.add(id);
        }
    }
    return [...ids];
}

/**
 * short and full name of an item, see the order at the top of the file; raw items start with `{ }`
 *
 * @param item stored item
 * @param names common.name per object id, as far as loaded
 * @returns short label (place) and full label (tooltip)
 */
export function screensaverItemLabel(
    item: ScreensaverItemConfig,
    names: Readonly<Record<string, string>> = {},
): ScreensaverItemLabel {
    const { headline, template, state } = sourceOf(item);
    const regex = !!state && isRegexId(state);
    const readableState = readableIdPattern(state);
    const templateName = template ? readableTemplateName(template) : '';

    let short = headline;
    if (!short && state && !regex) {
        short = names[state] || lastSegment(state);
    }
    if (!short && templateName) {
        short = templateName;
    }
    if (!short && readableState) {
        short = lastSegment(readableState);
    }

    const details = [templateName, readableState].filter(d => !!d && d !== short);
    let full = short || '?';
    if (details.length) {
        full = short ? `${short} (${details.join(' · ')})` : details.join(' · ');
    }
    if (item.raw) {
        return { short: short ? `{ } ${short}` : '{ }', full: `{ } ${full === '?' ? '' : full}`.trim() };
    }
    return { short: short || '?', full };
}
