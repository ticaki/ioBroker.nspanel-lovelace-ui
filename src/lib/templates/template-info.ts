import type { NSPanel } from '../types/NSPanel';
import { screensaverAreas } from '../types/adminShareConfig';
import type { PageItemTemplateInfo } from '../types/adminShareConfig';
import { pageItemTemplates } from './templateArray';

/**
 * Describes the page item templates for the admin: name, type, role, adapter and what the template needs
 * as its object. A template needs a channel as soon as one of its data items is resolved with `mode: 'auto'`
 * (search below `dpInit` by regexp / role) or a relative id (`.lift`); without such items it works on its
 * own (clock, wlan, service buttons).
 *
 * `areas`: a text or button template fits every place of the screensaver unless `screensaverAreas` of the
 * template narrows them, any other type (number, light, shutter) fits none. `options`: `adminOptions` of the template.
 *
 * @param templates the templates to describe, default the page item templates of the adapter
 * @returns one entry per template, sorted by name
 */
export function pageItemTemplateInfos(
    templates: Record<string, NSPanel.PageItemOptionsTemplate | undefined> = pageItemTemplates as Record<
        string,
        NSPanel.PageItemOptionsTemplate | undefined
    >,
): PageItemTemplateInfo[] {
    const result: PageItemTemplateInfo[] = [];
    for (const [name, template] of Object.entries(templates)) {
        if (!template) {
            continue;
        }
        const looksFor: string[] = [];
        let channel = false;
        const walk = (node: unknown): void => {
            if (!node || typeof node !== 'object') {
                return;
            }
            const item = node as Record<string, unknown>;
            if (typeof item.type === 'string' && ('dp' in item || 'constVal' in item)) {
                // a data item leaf
                if (item.type !== 'triggered' && item.type !== 'state') {
                    return;
                }
                const relative = typeof item.dp === 'string' && item.dp.startsWith('.');
                if (item.mode !== 'auto' && !relative) {
                    return;
                }
                channel = true;
                const hint = describeSearch(item, relative);
                if (hint && !looksFor.includes(hint)) {
                    looksFor.push(hint);
                }
                return;
            }
            for (const value of Object.values(item)) {
                walk(value);
            }
        };
        walk(template.data);
        result.push({
            name,
            type: String(template.type ?? ''),
            role: String(template.role ?? ''),
            adapter: String(template.adapter ?? ''),
            need: channel ? 'channel' : 'none',
            looksFor,
            areas:
                template.type === 'text' || template.type === 'button'
                    ? [...(template.screensaverAreas ?? screensaverAreas)]
                    : [],
            options: template.adminOptions ? [...template.adminOptions] : [],
        });
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * readable form of what one data item searches for: the relative id, the regexp (without anchors and
 * escapes, e.g. `.ACTUAL`) or the role(s)
 *
 * @param item data item (triggered / state) of a template
 * @param relative the item uses a relative id
 */
function describeSearch(item: Record<string, unknown>, relative: boolean): string {
    if (relative) {
        return String(item.dp);
    }
    if (item.regexp instanceof RegExp) {
        return item.regexp.source.replace(/^\^/, '').replace(/\$$/, '').replace(/\\\./g, '.');
    }
    if (Array.isArray(item.role)) {
        return item.role.map(String).join(' | ');
    }
    if (typeof item.role === 'string' && item.role) {
        return item.role;
    }
    return '';
}
