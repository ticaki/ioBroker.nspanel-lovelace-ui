/** Navigation fields a page item can carry: short press and long press. */
export type NavigationTargetField = 'setNavi' | 'setNaviLongPress';

/** What a page navigates to. */
export interface NavigationTargets {
    /** Pages named directly in the configuration. */
    pages: string[];
    /** States a target page is read from - which page that is, is only known while the panel runs. */
    stateRefs: string[];
}

/**
 * Navigation targets found in the given data objects.
 *
 * The objects are the `data` of the page items plus the `data` of the page itself. A constant target
 * names its page and ends up in `pages`. A target read from a state cannot name a page here; the
 * state itself is reported in `stateRefs`, so the admin can show where the target comes from instead
 * of dropping the connection. Duplicates are removed - several items pointing at the same page make
 * one connection.
 *
 * @param sources `data` objects to look at; missing entries are skipped.
 * @param field Navigation field to read.
 * @returns The target pages and the states the remaining targets are read from.
 */
export function collectNavigationTargets(
    sources: readonly (Record<string, any> | undefined | null)[],
    field: NavigationTargetField,
): NavigationTargets {
    const pages: string[] = [];
    const stateRefs: string[] = [];
    for (const data of sources) {
        const target = data && field in data ? data[field] : undefined;
        if (!target || typeof target !== 'object') {
            continue;
        }
        if (target.type === 'const') {
            if (typeof target.constVal === 'string' && target.constVal) {
                pages.push(target.constVal);
            }
        } else if (typeof target.dp === 'string' && target.dp) {
            stateRefs.push(target.dp);
        }
    }
    return { pages: Array.from(new Set(pages)), stateRefs: Array.from(new Set(stateRefs)) };
}
