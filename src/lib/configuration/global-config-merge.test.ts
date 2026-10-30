/**
 * Tests of the merge of the global script configuration (`mergeGlobalConfig`).
 *
 * The reference is the former inline code of `ConfigManager.setScriptConfig` (copied verbatim below, only the
 * logger and the random source are injected): the pure function has to give the same pages, sub pages,
 * navigation, native page items, global page ids and messages - without changing its inputs.
 */
import { expect } from 'chai';
import * as configManagerConst from '../const/config-manager-const';
import { mergeGlobalConfig, type GlobalMergeConfig } from './global-config-merge';

type LegacyResult = {
    config: GlobalMergeConfig;
    globalPageIds: Set<string>;
    messages: string[];
    warnings: string[];
};

/**
 * The former inline merge of the config manager (mutates its inputs - called with copies).
 *
 * @param config Panel configuration (changed in place).
 * @param globalRaw Global configuration (changed in place).
 * @param random Random source of the navigation copies.
 */
/* eslint-disable */
function legacyMerge(config: any, globalRaw: any, random: () => number): LegacyResult {
    const messages: string[] = [];
    const warnings: string[] = [];
    const globalPageIds = new Set<string>();
    {
        if (!configManagerConst.isGlobalConfig(globalRaw)) {
            return { config, globalPageIds, messages, warnings };
        }
        const navigationAdjustRun = (
            oldUniqueName: string | undefined,
            newUniqueName: string | undefined,
            pages: ScriptConfig.PageTypeGlobal[],
            renamedPages: Record<string, string>,
            maxRun: number = 3,
            indexRun: number = 0,
            runPrefix = '',
        ): ScriptConfig.PageTypeGlobal[] => {
            if (!oldUniqueName || !newUniqueName || oldUniqueName === newUniqueName) {
                return pages;
            }
            if (indexRun++ > maxRun) {
                warnings.push(
                    `navigationAdjustRun for ${oldUniqueName} to ${newUniqueName} aborted - maxRun ${maxRun} reached!`,
                );
                return pages;
            }
            const pageIndex = pages.findIndex(item => item.uniqueName === oldUniqueName);

            if (pageIndex === -1) {
                return pages;
            }
            let page = pages[pageIndex];
            if (!page) {
                return pages;
            }
            renamedPages[oldUniqueName] = newUniqueName;
            page = { ...structuredClone(page), uniqueName: newUniqueName };
            pages.push(page);

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
                        if (pages.findIndex(it => it.uniqueName === newName) === -1) {
                            pages = navigationAdjustRun(
                                item.targetPage,
                                newName,
                                pages,
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
                    if (pages.findIndex(it => it.uniqueName === newName) === -1) {
                        pages = navigationAdjustRun(
                            page[tag],
                            newName,
                            pages,
                            renamedPages,
                            maxRun,
                            indexRun,
                            runPrefix,
                        );
                    }
                    page[tag] = newName;
                }
            }
            return pages;
        };
        // merge global config
        if (globalRaw) {
            const globalConfig = globalRaw as ScriptConfig.globalPagesConfig;
            if (globalConfig && configManagerConst.isGlobalConfig(globalConfig)) {
                globalConfig.maxNavigationAdjustRuns =
                    globalConfig.maxNavigationAdjustRuns && globalConfig.maxNavigationAdjustRuns > 0
                        ? globalConfig.maxNavigationAdjustRuns
                        : 3;
                const removeGlobalPageIndexs: Set<number> = new Set();
                // merge global config for pages
                for (let i = 0; i < config.pages.length; i++) {
                    const page = config.pages[i] as ScriptConfig.PageTypeGlobal;
                    if (page && 'globalLink' in page && page.globalLink) {
                        const gIndex = globalConfig.subPages.findIndex(item => item.uniqueName === page.globalLink);
                        const gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : undefined;
                        if (gPage) {
                            for (const t of ['next', 'prev']) {
                                const tag = t as 'next' | 'prev';
                                if (gPage[tag] != null) {
                                    const gIndex = globalConfig.subPages.findIndex(
                                        item => item.uniqueName === gPage[tag],
                                    );
                                    const index = config.pages.findIndex(
                                        (item: any) =>
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
                                        (config.pages as ScriptConfig.PageTypeGlobal[]).splice(i + 1, 0, {
                                            globalLink: gPage[tag],
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                for (let i = config.pages.length - 1; i >= 0; i--) {
                    const page = config.pages[i] as ScriptConfig.PageTypeGlobal;
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
                            config.pages[i] = {
                                ...gPage,
                                prev: undefined,
                                next: undefined,
                                home: undefined,
                                parent: undefined,
                            };
                            if (page.heading) {
                                config.pages[i].heading = page.heading;
                            }
                            if (config.pages[i].uniqueName) {
                                globalPageIds.add(config.pages[i].uniqueName);
                            }
                        } else {
                            config.pages.splice(i, 1);
                            const msg = `Global page with uniqueName ${page.globalLink} not found!`;
                            messages.push(msg);
                            warnings.push(msg);
                        }
                    }
                }

                // merge global config for subPages
                for (let i = config.subPages.length - 1; i >= 0; i--) {
                    const page = config.subPages[i] as ScriptConfig.PageTypeGlobal;
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
                            const existNav =
                                page.prev != null || page.parent != null || page.next != null || page.home != null;

                            config.subPages[i] = {
                                ...gPage,
                                prev: existNav ? page.prev : gPage.prev,
                                parent: existNav ? page.parent : gPage.parent,
                                next: existNav ? page.next : gPage.next,
                                home: existNav ? page.home : gPage.home,
                            };

                            if (page.heading) {
                                config.subPages[i].heading = page.heading;
                            }
                            if (config.subPages[i].uniqueName) {
                                globalPageIds.add(config.subPages[i].uniqueName);
                            }
                        } else {
                            config.subPages.splice(i, 1);
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
                    // a page of the panel script with the same name wins (see filter below) - not global
                    if (
                        page &&
                        page.uniqueName &&
                        config.pages.findIndex((p: any) => p && p.uniqueName === page.uniqueName) === -1
                    ) {
                        globalPageIds.add(page.uniqueName);
                    }
                }
                config.subPages = config.subPages.concat(globalConfig.subPages || []);

                config.navigation = (config.navigation || []).concat(globalConfig.navigation || []);
                config.nativePageItems = (config.nativePageItems || []).concat(globalConfig.nativePageItems || []);
            }
        }
    }
    return { config, globalPageIds, messages, warnings };
}
/* eslint-enable */

/** a random source that gives the same sequence for both paths */
function sequence(): () => number {
    let n = 0;
    return (): number => (n++ * 0.37) % 1;
}

function grid(uniqueName: string, extra: Record<string, unknown> = {}): ScriptConfig.PageType {
    return {
        type: 'cardGrid',
        uniqueName,
        heading: `Seite ${uniqueName}`,
        items: [{ id: 'alias.0.Licht' }],
        ...extra,
    } as unknown as ScriptConfig.PageType;
}

function link(globalLink: string, extra: Record<string, unknown> = {}): ScriptConfig.PageType {
    return { globalLink, ...extra } as unknown as ScriptConfig.PageType;
}

function globalConfig(extra: Partial<ScriptConfig.globalPagesConfig> = {}): ScriptConfig.globalPagesConfig {
    return {
        version: '0.21.6',
        type: 'globalConfig',
        subPages: [
            grid('g1', { next: 'g2' }),
            grid('g2', { prev: 'g1' }),
            grid('g3', { items: [{ navigate: true, targetPage: 'g2' }], home: 'main' }),
            grid('g4', { parent: 'main' }),
            grid('g5', { prev: 'g4' }),
        ],
        navigation: [{ name: 'g4', left: { single: 'main' }, right: undefined, page: 'g4' }] as never,
        nativePageItems: [{ uniqueID: 'native1' }],
        ...extra,
    };
}

const fixtures: { name: string; config: () => GlobalMergeConfig; global: () => unknown }[] = [
    {
        name: 'links in pages and subPages, a renamed link with navigation copies, a missing link',
        config: () => ({
            pages: [grid('main'), link('g1', { heading: 'Überschrift' })],
            subPages: [link('g3', { uniqueName: 'g3b' }), link('missing'), grid('own')],
            navigation: [{ name: 'own', left: { single: 'main' }, right: undefined, page: 'own' }] as never,
        }),
        global: () => globalConfig(),
    },
    {
        name: 'a renamed link in pages and a sub page link with own navigation',
        config: () => ({
            pages: [link('g4', { uniqueName: 'g4x' }), grid('main')],
            subPages: [link('g2', { home: 'main' })],
        }),
        global: () => globalConfig(),
    },
    {
        name: 'no links at all: every global sub page is added',
        config: () => ({ pages: [grid('main')], subPages: [], nativePageItems: [{ uniqueID: 'own' }] }),
        global: () => globalConfig({ maxNavigationAdjustRuns: 1 }),
    },
    {
        name: 'a panel page with the name of a global sub page',
        config: () => ({ pages: [grid('main'), grid('g4')], subPages: [] }),
        global: () => globalConfig(),
    },
];

describe('lib/configuration - mergeGlobalConfig', () => {
    for (const fixture of fixtures) {
        it(`gives the result of the former inline merge: ${fixture.name}`, () => {
            const config = fixture.config();
            const global = fixture.global();
            const configBefore = structuredClone(config);
            const globalBefore = structuredClone(global);
            const legacy = legacyMerge(structuredClone(config), structuredClone(global), sequence());
            const merged = mergeGlobalConfig(config, global, { random: sequence() });
            expect(merged).to.not.equal(undefined);
            const json = (v: unknown): unknown => JSON.parse(JSON.stringify(v ?? null));
            expect(json(merged!.pages)).to.deep.equal(json(legacy.config.pages));
            expect(json(merged!.subPages)).to.deep.equal(json(legacy.config.subPages));
            expect(json(merged!.navigation)).to.deep.equal(json(legacy.config.navigation));
            expect(json(merged!.nativePageItems)).to.deep.equal(json(legacy.config.nativePageItems));
            expect([...merged!.globalPageIds].sort()).to.deep.equal([...legacy.globalPageIds].sort());
            expect(merged!.messages).to.deep.equal(legacy.messages);
            expect(merged!.warnings).to.deep.equal(legacy.warnings);
            // the inputs stay as they were
            expect(config).to.deep.equal(configBefore);
            expect(global).to.deep.equal(globalBefore);
        });
    }

    it('returns undefined for something that is no global configuration', () => {
        const config = { pages: [link('g1')], subPages: [] };
        expect(mergeGlobalConfig(config, undefined)).to.equal(undefined);
        expect(mergeGlobalConfig(config, { type: 'other', subPages: [] })).to.equal(undefined);
    });

    it('reports where every global page comes from', () => {
        const merged = mergeGlobalConfig(
            { pages: [grid('main'), link('g1')], subPages: [link('g3', { uniqueName: 'g3b' })] },
            globalConfig(),
            { random: () => 0 },
        )!;
        const kinds = [...merged.pages, ...merged.subPages].map(p => [
            p.uniqueName,
            merged.sources.get(p)?.kind ?? 'panel',
        ]);
        expect(kinds).to.deep.equal([
            ['main', 'panel'],
            ['g1', 'linked'],
            // inserted behind g1 because g1 names it as next
            ['g2', 'inserted'],
            ['g3b', 'linked'],
            ['g3', 'unlinked'],
            ['g4', 'unlinked'],
            ['g5', 'unlinked'],
            // the copy of the renamed page itself among the global sub pages (dropped by the config manager
            // only when it is a page of `pages`) and the navigation copy of its target
            ['g3b', 'unlinked'],
            ['g3b_g2_copy_nav_0', 'navigationCopy'],
        ]);
        expect([...merged.copyRoots]).to.deep.equal(['g3b']);
        expect(merged.messages[0]).to.match(/g1 next link to subPage g2/);
    });
});
