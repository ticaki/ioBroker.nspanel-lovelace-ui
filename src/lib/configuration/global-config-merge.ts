/**
 * Merge of the global script configuration (`type: 'globalConfig'`, stored as `native.globalConfigRaw` of the
 * meta object) into the script configuration of one panel.
 *
 * Pure: the inputs are not changed, the result carries new arrays. Used by `ConfigManager.setScriptConfig`
 * (runtime) and by the script → admin planner, which has to see the pages exactly as the runtime sees them.
 *
 * Rules (unchanged from the former inline code of the config manager):
 * - `{ globalLink }` in `pages`/`subPages` of the panel is replaced by the global sub page of that name. A
 *   `uniqueName` of the link renames the page (`navigationAdjustRun` copies pages it navigates to under new
 *   names), a `heading` of the link overrides the heading. In `pages` the links of the global page are dropped
 *   (the ring decides), in `subPages` the links of the link entry win when it has any.
 * - a global page in `pages` whose `next` (or `prev`) names another global sub page that the panel does not
 *   use yet gets that page inserted behind it (with a message).
 * - every global sub page no link of the panel used under its own name is added to `subPages` of the panel.
 * - the global `navigation` and `nativePageItems` are appended.
 */
import { isGlobalConfig } from '../const/config-manager-const';

/** what the panel configuration has to offer for the merge */
export type GlobalMergeConfig = {
    pages: ScriptConfig.PageType[];
    subPages: ScriptConfig.PageType[];
    navigation?: ScriptConfig.Config['navigation'];
    nativePageItems?: ScriptConfig.Config['nativePageItems'];
};

/**
 * Where a page of the merged configuration comes from, when it comes from the global script.
 *
 * - linked: a `{ globalLink }` entry of the panel script (removing that entry takes the page away)
 * - inserted: inserted into `pages` because a linked global page names it as `next`/`prev`
 * - unlinked: a global sub page every panel gets
 * - navigationCopy: a copy `navigationAdjustRun` made for a renamed page (random name)
 */
export type GlobalPageSource = {
    kind: 'linked' | 'inserted' | 'unlinked' | 'navigationCopy';
    /** name of the page in the global script */
    globalName: string;
};

export type GlobalMergeResult = {
    pages: ScriptConfig.PageType[];
    subPages: ScriptConfig.PageType[];
    navigation: ScriptConfig.Config['navigation'];
    nativePageItems: ScriptConfig.Config['nativePageItems'];
    /** pages this panel receives from the global script (by uniqueName) */
    globalPageIds: Set<string>;
    /** messages for the result of `setScriptConfig` */
    messages: string[];
    /** texts to log as warning */
    warnings: string[];
    /** the merged page objects that come from the global script */
    sources: Map<object, GlobalPageSource>;
    /** renamed pages (`{ globalLink, uniqueName }`) for which navigation copies were made */
    copyRoots: Set<string>;
};

export type GlobalMergeOptions = {
    /** random source for the names of navigation copies, default `Math.random` */
    random?: () => number;
};

/**
 * Merges the global script configuration into the configuration of one panel.
 *
 * @param config Pages, sub pages, navigation and native page items of the panel script (not changed).
 * @param globalRaw `native.globalConfigRaw` of the meta object (not changed).
 * @param options Options.
 * @returns The merged parts, or undefined when `globalRaw` is no global configuration (nothing to merge).
 */
export function mergeGlobalConfig(
    config: GlobalMergeConfig,
    globalRaw: unknown,
    options: GlobalMergeOptions = {},
): GlobalMergeResult | undefined {
    if (!globalRaw || !isGlobalConfig(globalRaw)) {
        return undefined;
    }
    const random = options.random ?? Math.random;
    const globalConfig: ScriptConfig.globalPagesConfig = structuredClone(globalRaw);
    const pages: ScriptConfig.PageTypeGlobal[] = [...(config.pages ?? [])];
    const subPages: ScriptConfig.PageTypeGlobal[] = [...(config.subPages ?? [])];
    const messages: string[] = [];
    const warnings: string[] = [];
    const globalPageIds = new Set<string>();
    const sources = new Map<object, GlobalPageSource>();
    /** copy name -> renamed page it was made for */
    const copies = new Map<string, string>();
    const insertedLinks = new Set<ScriptConfig.PageTypeGlobal>();

    const navigationAdjustRun = (
        oldUniqueName: string | undefined,
        newUniqueName: string | undefined,
        list: ScriptConfig.PageTypeGlobal[],
        renamedPages: Record<string, string>,
        maxRun: number = 3,
        indexRun: number = 0,
        runPrefix = '',
    ): ScriptConfig.PageTypeGlobal[] => {
        if (!oldUniqueName || !newUniqueName || oldUniqueName === newUniqueName) {
            return list;
        }
        if (indexRun++ > maxRun) {
            warnings.push(
                `navigationAdjustRun for ${oldUniqueName} to ${newUniqueName} aborted - maxRun ${maxRun} reached!`,
            );
            return list;
        }
        const pageIndex = list.findIndex(item => item.uniqueName === oldUniqueName);

        if (pageIndex === -1) {
            return list;
        }
        let page = list[pageIndex];
        if (!page) {
            return list;
        }
        renamedPages[oldUniqueName] = newUniqueName;
        page = { ...structuredClone(page), uniqueName: newUniqueName };
        list.push(page);

        if ('items' in page && page.items) {
            for (let i = 0; i < page.items.length; i++) {
                const item = page.items[i];
                if (item && item.navigate && item.targetPage) {
                    const origin = item.targetPage;

                    for (const key in renamedPages) {
                        const value = renamedPages[key];
                        if (origin === value) {
                            item.targetPage = value;
                            continue;
                        }
                    }
                    if (renamedPages[item.targetPage]) {
                        item.targetPage = renamedPages[item.targetPage];
                        continue;
                    }
                    const newName = `${runPrefix}_${item.targetPage}_copy_nav_${Math.floor(random() * 100_000)}`;
                    copies.set(newName, runPrefix);
                    if (list.findIndex(it => it.uniqueName === newName) === -1) {
                        list = navigationAdjustRun(
                            item.targetPage,
                            newName,
                            list,
                            renamedPages,
                            maxRun,
                            indexRun,
                            runPrefix,
                        );
                    }
                    item.targetPage = newName;
                }
            }
        }
        for (const t of ['next', 'prev', 'home', 'parent']) {
            const tag = t as 'next' | 'prev' | 'home' | 'parent';
            if (page[tag] === oldUniqueName) {
                for (const key in renamedPages) {
                    const value = renamedPages[key];
                    if (page[tag] === value) {
                        continue;
                    }
                }
                if (renamedPages[page[tag]]) {
                    page[tag] = renamedPages[page[tag]];
                    continue;
                }
                const newName = `${runPrefix}_${page[tag]}_copy_nav_${Math.floor(random() * 100_000)}`;
                copies.set(newName, runPrefix);
                if (list.findIndex(it => it.uniqueName === newName) === -1) {
                    list = navigationAdjustRun(page[tag], newName, list, renamedPages, maxRun, indexRun, runPrefix);
                }
                page[tag] = newName;
            }
        }
        return list;
    };

    globalConfig.maxNavigationAdjustRuns =
        globalConfig.maxNavigationAdjustRuns && globalConfig.maxNavigationAdjustRuns > 0
            ? globalConfig.maxNavigationAdjustRuns
            : 3;
    const removeGlobalPageIndexs: Set<number> = new Set();
    // merge global config for pages
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (page && 'globalLink' in page && page.globalLink) {
            const gIndex = globalConfig.subPages.findIndex(item => item.uniqueName === page.globalLink);
            const gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : undefined;
            if (gPage) {
                for (const t of ['next', 'prev']) {
                    const tag = t as 'next' | 'prev';
                    if (gPage[tag] != null) {
                        const gIndex = globalConfig.subPages.findIndex(item => item.uniqueName === gPage[tag]);
                        const index = pages.findIndex(
                            item =>
                                ('globalLink' in item && item.globalLink === gPage[tag]) ||
                                item.uniqueName === gPage[tag],
                        );
                        if (gIndex !== -1 && index === -1) {
                            let msg = `Global page ${gPage.uniqueName} ${tag} link to subPage ${gPage[tag]}. `;
                            if (tag === 'next') {
                                msg += `Remove ${gPage[tag]} from subPages and add to pages at index ${i + 1}!`;
                            } else {
                                msg += `This is not recommended! Prev navigation will "randomly" change the order of pages! Consider to remove it!`;
                            }
                            messages.push(msg);
                            const link: ScriptConfig.PageLink = { globalLink: gPage[tag] };
                            insertedLinks.add(link);
                            pages.splice(i + 1, 0, link);
                        }
                    }
                }
            }
        }
    }
    for (let i = pages.length - 1; i >= 0; i--) {
        const page = pages[i];
        if (page && 'globalLink' in page && page.globalLink) {
            const gIndex = globalConfig.subPages.findIndex(item => item.uniqueName === page.globalLink);
            let gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : undefined;
            if (gPage) {
                if (page.uniqueName != null && page.uniqueName !== gPage.uniqueName) {
                    globalConfig.subPages = navigationAdjustRun(
                        gPage.uniqueName,
                        page.uniqueName,
                        globalConfig.subPages,
                        {},
                        globalConfig.maxNavigationAdjustRuns,
                        0,
                        page.uniqueName,
                    ) as ScriptConfig.PageType[];
                    const index = globalConfig.subPages.findIndex(p => p.uniqueName === page.uniqueName);
                    if (index !== -1) {
                        gPage = globalConfig.subPages[index];
                        gPage.uniqueName = page.uniqueName;
                    }
                } else {
                    removeGlobalPageIndexs.add(gIndex);
                }
                const merged: ScriptConfig.PageType = {
                    ...gPage,
                    prev: undefined,
                    next: undefined,
                    home: undefined,
                    parent: undefined,
                };
                if (page.heading) {
                    merged.heading = page.heading;
                }
                pages[i] = merged;
                sources.set(merged, {
                    kind: insertedLinks.has(page) ? 'inserted' : 'linked',
                    globalName: page.globalLink,
                });
                if (merged.uniqueName) {
                    globalPageIds.add(merged.uniqueName);
                }
            } else {
                pages.splice(i, 1);
                const msg = `Global page with uniqueName ${page.globalLink} not found!`;
                messages.push(msg);
                warnings.push(msg);
            }
        }
    }

    // merge global config for subPages
    for (let i = subPages.length - 1; i >= 0; i--) {
        const page = subPages[i];
        if (page && 'globalLink' in page && page.globalLink) {
            const gIndex = globalConfig.subPages.findIndex(item => item.uniqueName === page.globalLink);
            let gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : undefined;
            if (gPage) {
                if (page.uniqueName != null && page.uniqueName !== gPage.uniqueName) {
                    globalConfig.subPages = navigationAdjustRun(
                        gPage.uniqueName,
                        page.uniqueName,
                        globalConfig.subPages,
                        {},
                        globalConfig.maxNavigationAdjustRuns,
                        0,
                        page.uniqueName,
                    ) as ScriptConfig.PageType[];
                    const index = globalConfig.subPages.findIndex(p => p.uniqueName === page.uniqueName);
                    if (index !== -1) {
                        gPage = globalConfig.subPages[index];
                        gPage.uniqueName = page.uniqueName;
                    }
                } else {
                    removeGlobalPageIndexs.add(gIndex);
                }
                const existNav = page.prev != null || page.parent != null || page.next != null || page.home != null;

                const merged: ScriptConfig.PageType = {
                    ...gPage,
                    prev: existNav ? page.prev : gPage.prev,
                    parent: existNav ? page.parent : gPage.parent,
                    next: existNav ? page.next : gPage.next,
                    home: existNav ? page.home : gPage.home,
                };

                if (page.heading) {
                    merged.heading = page.heading;
                }
                subPages[i] = merged;
                sources.set(merged, { kind: 'linked', globalName: page.globalLink });
                if (merged.uniqueName) {
                    globalPageIds.add(merged.uniqueName);
                }
            } else {
                subPages.splice(i, 1);
                const msg = `Global page with uniqueName ${page.globalLink} not found!`;
                messages.push(msg);
                warnings.push(msg);
            }
        }
    }

    for (const index of Array.from(removeGlobalPageIndexs).sort((a, b) => b - a)) {
        globalConfig.subPages.splice(index, 1);
    }
    for (const page of globalConfig.subPages || []) {
        if (!page) {
            continue;
        }
        sources.set(
            page,
            page.uniqueName && copies.has(page.uniqueName)
                ? { kind: 'navigationCopy', globalName: page.uniqueName }
                : { kind: 'unlinked', globalName: page.uniqueName },
        );
        // a page of the panel script with the same name wins (see filter of the config manager) - not global
        if (page.uniqueName && pages.findIndex(p => p && p.uniqueName === page.uniqueName) === -1) {
            globalPageIds.add(page.uniqueName);
        }
    }
    const mergedSubPages = (subPages as ScriptConfig.PageType[]).concat(globalConfig.subPages || []);

    return {
        pages: pages as ScriptConfig.PageType[],
        subPages: mergedSubPages,
        navigation: (config.navigation || []).concat(globalConfig.navigation || []),
        nativePageItems: (config.nativePageItems || []).concat(globalConfig.nativePageItems || []),
        globalPageIds,
        messages,
        warnings,
        sources,
        copyRoots: new Set(copies.values()),
    };
}
