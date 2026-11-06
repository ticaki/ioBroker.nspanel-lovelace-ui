/**
 * Names of screensaver items in the admin editor - pure logic without React, so it can be tested.
 *
 * Order for the short label of a place in the mock:
 * 1. headline of the item (ScreensaverEntityText for a raw script item)
 * - a template with a name of its own (see screensaverTemplateNameKeys) comes next: it uses no object, so a
 *   state left on the item names nothing, neither here nor in the tooltip; the tooltip adds its page
 * 2. a plain state / object id: its common.name (when loaded), else the last part of the id
 *    - only the instance of a template (`bydhvs.0`) says nothing as a name: its template name is used
 * 3. a template: the template name without its type (`text.pirate-weather.favorit` → `pirate-weather favorit`)
 * 4. a regexp as state (dpInit): the last part of its readable prefix
 *
 * A regexp is never shown as such: `/^pirate-weather\.0\.weather\.currently\./` reads
 * `pirate-weather.0.weather.currently`. The full label (tooltip) adds template and state / prefix.
 */
import type {
    PageItemTemplateInfo,
    ScreensaverEntry,
    ScreensaverItemConfig,
} from '../../src/lib/types/adminShareConfig';
import { screensaverAlternateItems, trashTemplateLabels } from '../../src/lib/types/adminShareConfig';

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
    /** page of a template with a name of its own, '' = none */
    page: string;
}

/** translator of the admin: i18n key to text */
export type ScreensaverLabelTranslator = (key: string) => string;

/**
 * templates that use no object: template name to i18n key of the display name. Besides that the names of
 * `PageItemTemplateInfo.label` count; these here are also known while the adapter is offline.
 */
export const screensaverTemplateNameKeys: ReadonlyMap<string, string> = new Map(Object.entries(trashTemplateLabels));

/**
 * the page a trash template reads, normalized like its `read` function does it
 *
 * @param readOptions options of the item
 * @returns the unique id of the page, '' without one
 */
export function templatePageOption(readOptions: unknown): string {
    const page = isRecord(readOptions) ? readOptions.page : undefined;
    return typeof page === 'string' || typeof page === 'number' ? String(page).trim() : '';
}

/** characters that end the literal start of a regexp when they are not escaped */
const REGEX_META = new Set(['.', '*', '+', '?', '(', ')', '[', ']', '{', '}', '|', '^', '$']);

/** an id that is only the instance of an adapter (`bydhvs.0`) */
const ADAPTER_INSTANCE = /^[^.]+\.\d+$/;

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
        return { headline: '', template: '', state: '', page: '' };
    }
    const own: LabelSource = {
        headline: firstString(config, ['ScreensaverEntityText']),
        template: firstString(config, ['template']),
        state: firstString(config, ['dpInit', 'ScreensaverEntity', 'id']),
        page: templatePageOption(config.readOptions),
    };
    if (!own.headline && !own.template && !own.state && isRecord(config.native)) {
        return rawSource(config.native);
    }
    return own;
}

/**
 * headline, template and state of an item; the state of a template with a name of its own is left out,
 * that template does not use it
 *
 * @param item stored item
 * @returns the source of the name
 */
function sourceOf(item: ScreensaverItemConfig): LabelSource {
    const source: LabelSource = item.raw
        ? rawSource(item.raw.config)
        : {
              headline: (item.headline ?? '').trim(),
              template: (item.template ?? '').trim(),
              state: item.state.trim(),
              page: templatePageOption(item.readOptions),
          };
    return screensaverTemplateNameKeys.has(source.template) ? { ...source, state: '' } : source;
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
        ...screensaverAlternateItems(entry.alternate),
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
 * @param translate translator for the templates with a name of their own; without it they read like any
 *   other template
 * @param templates templates of the adapter with their display names, undefined while unknown
 * @returns short label (place) and full label (tooltip)
 */
export function screensaverItemLabel(
    item: ScreensaverItemConfig,
    names: Readonly<Record<string, string>> = {},
    translate?: ScreensaverLabelTranslator,
    templates?: readonly PageItemTemplateInfo[],
): ScreensaverItemLabel {
    const { headline, template, state, page } = sourceOf(item);
    const regex = !!state && isRegexId(state);
    const readableState = readableIdPattern(state);
    const templateKey = templates?.find(t => t.name === template)?.label ?? screensaverTemplateNameKeys.get(template);
    const templateName =
        templateKey && translate ? translate(templateKey) : template ? readableTemplateName(template) : '';

    let short = headline;
    if (!short && state && !regex && !(templateName && ADAPTER_INSTANCE.test(state))) {
        short = names[state] || lastSegment(state);
    }
    if (!short && templateName) {
        short = templateName;
    }
    if (!short && readableState) {
        short = lastSegment(readableState);
    }

    const details = [templateName, screensaverTemplateNameKeys.has(template) ? page : '', readableState].filter(
        d => !!d && d !== short,
    );
    let full = short || '?';
    if (details.length) {
        full = short ? `${short} (${details.join(' · ')})` : details.join(' · ');
    }
    if (item.raw) {
        return { short: short ? `{ } ${short}` : '{ }', full: `{ } ${full === '?' ? '' : full}`.trim() };
    }
    return { short: short || '?', full };
}
