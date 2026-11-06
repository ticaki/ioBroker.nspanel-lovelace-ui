/**
 * Template list of the item dialog - pure logic without React, so it can be tested.
 *
 * The adapter knows two trash templates that read their page from `readOptions.page`. The list turns them into
 * one entry per trash page and template. Every other template stays one entry. An entry shows the display name of
 * its template, without one the technical name.
 */
import {
    type PageItemTemplateInfo,
    type ScreensaverArea,
    type ScreensaverItemConfig,
    screensaverAreas,
    trashTemplateLabels,
} from '../../src/lib/types/adminShareConfig';
import { screensaverTemplateNameKeys, templatePageOption } from './screensaverItemLabel';

/** the trash templates in the order of the list */
const TRASH_TEMPLATES: readonly string[] = Object.keys(trashTemplateLabels);

/** entry of the template list */
export interface TemplateListEntry {
    /** identifies the entry in the list */
    key: string;
    /** text of the entry */
    label: string;
    /** the technical name when `label` shows a display name: tooltip of the list and help text of the selection */
    technicalName?: string;
    template: PageItemTemplateInfo;
    /** options the item gets when the entry is chosen */
    readOptions?: Record<string, string | number>;
}

/** what the template list is built from */
export interface TemplateListInput {
    /** templates of the adapter, undefined while unknown (adapter offline) */
    templates: PageItemTemplateInfo[] | undefined;
    /** place of the screensaver: only templates for this place are offered */
    area?: ScreensaverArea;
    /** the template of the item, see {@link pageItemTemplateInfoOf} */
    selected: PageItemTemplateInfo | null;
    /** options of the item */
    readOptions: Record<string, string | number> | undefined;
    /** result of {@link trashPageNames}; undefined leaves the list as the adapter reports it */
    trashPages: readonly string[] | undefined;
    getText: (key: string) => string;
}

/** the entries of the list and the one of the item, which is always part of them */
export interface TemplateList {
    entries: TemplateListEntry[];
    selected: TemplateListEntry | null;
}

/**
 * the template as the adapter describes it; a name the list does not know (adapter offline, removed
 * template) counts as a template that searches a channel and fits every place
 *
 * @param templates templates of the adapter
 * @param name name of the template
 * @returns the description, null without a name
 */
export function pageItemTemplateInfoOf(
    templates: PageItemTemplateInfo[] | undefined,
    name: string | undefined,
): PageItemTemplateInfo | null {
    if (!name) {
        return null;
    }
    return (
        templates?.find(t => t.name === name) ?? {
            name,
            type: '',
            role: '',
            adapter: '',
            need: 'channel',
            looksFor: [],
            areas: [...screensaverAreas],
            options: [],
        }
    );
}

/**
 * unique ids of the trash pages in the order of the runtime map (`trashPagesState`): the first one is the page an
 * item without `readOptions.page` shows; as in any object an integer-like name comes first
 *
 * @param pageEntries entries of `native.pageConfig`
 * @returns the unique ids
 */
export function trashPageNames(pageEntries: readonly unknown[]): string[] {
    const names: [string, true][] = [];
    for (const entry of pageEntries) {
        if (typeof entry === 'object' && entry !== null && 'card' in entry && entry.card === 'cardTrash') {
            const name = 'uniqueName' in entry ? entry.uniqueName : undefined;
            if (typeof name === 'string' && name.trim()) {
                names.push([name, true]);
            }
        }
    }
    return Object.keys(Object.fromEntries(names));
}

/**
 * display name of a template: from the adapter; without the adapter the names the admin knows itself
 *
 * @param template a template
 * @param getText translator
 * @returns the translated name, undefined without one
 */
function displayName(template: PageItemTemplateInfo, getText: (key: string) => string): string | undefined {
    const key = template.label ?? screensaverTemplateNameKeys.get(template.name);
    return key ? getText(key) : undefined;
}

/**
 * @param template a template
 * @param getText translator
 * @returns the entry of the template, for a trash template without a page
 */
function plainEntry(template: PageItemTemplateInfo, getText: (key: string) => string): TemplateListEntry {
    const label = displayName(template, getText);
    return label
        ? { key: template.name, label, technicalName: template.name, template }
        : { key: template.name, label: template.name, template };
}

/**
 * @param template a trash template
 * @param page unique id of the page
 * @param detail what the brackets of the text show
 * @param getText translator
 * @returns the entry that stores this page
 */
function trashEntry(
    template: PageItemTemplateInfo,
    page: string,
    detail: string,
    getText: (key: string) => string,
): TemplateListEntry {
    return {
        key: `${template.name}|${page}`,
        label: `${displayName(template, getText) ?? template.name} (${detail})`,
        technicalName: template.name,
        template,
        readOptions: { page },
    };
}

/**
 * the entry of the stored item: without a page that of the first trash page, as the runtime shows it; a page that
 * no longer exists keeps an entry with its stored id
 *
 * @param input see {@link TemplateListInput}
 * @returns the entry, null without a template
 */
function selectedEntry(input: TemplateListInput): TemplateListEntry | null {
    const { selected, trashPages, getText } = input;
    if (!selected) {
        return null;
    }
    if (!trashPages || !TRASH_TEMPLATES.includes(selected.name)) {
        return plainEntry(selected, getText);
    }
    const page = templatePageOption(input.readOptions) || trashPages[0];
    if (page === undefined) {
        return plainEntry(selected, getText);
    }
    const detail = trashPages.includes(page)
        ? page
        : getText('screensaver_template_trashUnknownPage').replace('%s', () => page);
    return trashEntry(selected, page, detail, getText);
}

/**
 * the list of the template selection: the templates of the place, the trash templates per page at the place of the
 * first of them (page by page, next before after next); the template of the item stays in it
 *
 * @param input see {@link TemplateListInput}
 * @returns entries and the entry of the item
 */
export function buildTemplateList(input: TemplateListInput): TemplateList {
    const { templates, area, trashPages, getText } = input;
    const list = area ? (templates ?? []).filter(t => t.areas.includes(area)) : (templates ?? []);
    const entries: TemplateListEntry[] = [];
    let trashDone = false;
    for (const template of list) {
        if (!trashPages || !TRASH_TEMPLATES.includes(template.name)) {
            entries.push(plainEntry(template, getText));
        } else if (!trashDone) {
            trashDone = true;
            for (const page of trashPages) {
                for (const name of TRASH_TEMPLATES) {
                    const info = list.find(t => t.name === name);
                    if (info) {
                        entries.push(trashEntry(info, page, page, getText));
                    }
                }
            }
        }
    }
    const selected = selectedEntry(input);
    if (!selected) {
        return { entries, selected: null };
    }
    const known = entries.find(e => e.key === selected.key);
    if (known) {
        return { entries, selected: known };
    }
    // the list is sorted by the template names
    const at = entries.findIndex(e => e.template.name.localeCompare(selected.template.name) > 0);
    entries.splice(at < 0 ? entries.length : at, 0, selected);
    return { entries, selected };
}

/**
 * @param entry entry of the list
 * @returns the text the search of the list looks through: the technical name always finds the entry
 */
export function templateEntrySearchText(entry: TemplateListEntry): string {
    return `${entry.label} ${entry.template.name}`;
}

/**
 * help text below the selection: the technical name of an entry with a display name (a touch device cannot hover
 * the tooltip of the list) before the description of the template
 *
 * @param entry the chosen entry
 * @param description text about the template, '' without one
 * @returns the text, '' when there is nothing to say
 */
export function templateEntryHelpText(entry: TemplateListEntry | null, description: string): string {
    return [entry?.technicalName, description].filter(Boolean).join(' · ');
}

/**
 * the item after a choice in the list: the options of the old template go, those of the entry come; a template that
 * needs no object drops the old one - an unknown template (adapter offline) counts as `channel` and keeps it
 *
 * @param item the item so far
 * @param templates templates of the adapter
 * @param name name of the new template
 * @param readOptions options of the chosen entry
 * @returns the changed copy
 */
export function applyTemplateChoice(
    item: ScreensaverItemConfig,
    templates: PageItemTemplateInfo[] | undefined,
    name: string | undefined,
    readOptions?: Record<string, string | number>,
): ScreensaverItemConfig {
    const next = { ...item };
    if (name) {
        next.template = name;
    } else {
        delete next.template;
    }
    delete next.readOptions;
    if (readOptions) {
        next.readOptions = { ...readOptions };
    }
    if (next.state && pageItemTemplateInfoOf(templates, name)?.need === 'none') {
        next.state = '';
    }
    return next;
}
