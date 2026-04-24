import type { NavigationItemConfig } from '../classes/navigation';
import { BaseClass } from '../controller/library';
import type { panelConfigPartial } from '../controller/panel';
import * as ShareConfig from '../types/adminShareConfig';
import { exhaustiveCheck } from '../types/function-and-const';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { PageBase } from '../types/pages';
import type { AlwaysOnMode } from '../types/types';

type PendingNavEntry = {
    pageId: string;
    prev: string | undefined;
    next: string | undefined;
};

function shallowDescribe(value: unknown): string {
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return `Array(${value.length})`;
    }
    if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        const keys = Object.keys(obj);
        const entries = keys.map(k => {
            const v = obj[k];
            if (Array.isArray(v)) {
                return `${k}: Array(${v.length})`;
            }
            if (v !== null && typeof v === 'object') {
                return `${k}: {${Object.keys(v as Record<string, unknown>).join(', ')}}`;
            }
            return `${k}: ${JSON.stringify(v)}`;
        });
        return `{ ${entries.join(', ')} }`;
    }
    return JSON.stringify(value);
}

export class AdminConfiguration extends BaseClass {
    private pageConfig: ShareConfig.PageConfig[] = [];
    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'AdminConfiguration');
        this.adapter = adapter;
        this.pageConfig = this.adapter.config.pageConfig || [];
    }

    /**
     * Process configurable pages from adapter config and build navigation entries.
     * Orchestrates page creation (phase 1) and deferred navigation chain resolution (phase 2).
     *
     * @param option - Panel configuration partial containing pages and navigation arrays
     */
    public async processentrys(option: panelConfigPartial): Promise<panelConfigPartial> {
        try {
            const pendingNavs = await this.createPagesFromConfig(option);
            this.applyPendingNavigations(option, pendingNavs);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            const stack = error instanceof Error ? (error.stack ?? 'no stack') : 'no stack';
            this.log.error(
                `[processentrys] Failed to process panel "${option.name ?? shallowDescribe(option)}": ${msg}\nOption: ${shallowDescribe(option)}\nStack: ${stack}`,
            );
        }
        return option;
    }

    /**
     * Phase 1: create all pages from admin config, push stub navigation entries, and collect
     * pending prev/next chain assignments for deferred resolution.
     * home/parent links are applied immediately since they carry no chain dependency.
     *
     * @param option - Panel configuration partial
     */
    private async createPagesFromConfig(option: panelConfigPartial): Promise<PendingNavEntry[]> {
        const entries = this.pageConfig;
        const pendingNavs: PendingNavEntry[] = [];

        for (const entry of entries) {
            if (!entry.navigationAssignment || !entry.card) {
                continue;
            }

            // First pass: Check for ALL_PANELS_SPECIAL_ID assignment
            const allPanelsAssignment = entry.navigationAssignment.find(
                a => a.topic === ShareConfig.ALL_PANELS_SPECIAL_ID,
            );

            // Second pass: Check for this specific panel's assignment
            const panelAssignment = entry.navigationAssignment.find(a => a.topic === option.topic);

            // Determine which assignment to use
            let navAssign:
                | {
                      topic: string;
                      navigation?: {
                          next?: string;
                          prev?: string;
                          home?: string;
                          parent?: string;
                      };
                  }
                | undefined;

            if (panelAssignment) {
                // Panel-specific assignment takes precedence
                // Empty navigation means exclude if ALL was used, otherwise default
                if (!panelAssignment.navigation && allPanelsAssignment) {
                    // Explicit exclusion from ALL_PANELS
                    continue;
                }
                navAssign = panelAssignment;
            } else if (allPanelsAssignment) {
                // Use ALL_PANELS assignment
                navAssign = allPanelsAssignment;
            } else {
                // No assignment for this panel
                continue;
            }

            // Create page configuration based on card type
            let newPage: PageBase;

            switch (entry.card) {
                case 'cardAlarm': {
                    if (!isAlwaysOnMode(entry.alwaysOn)) {
                        entry.alwaysOn = 'none';
                    }
                    newPage = {
                        uniqueID: entry.uniqueName,
                        hidden: !!entry.hidden,
                        alwaysOn: entry.alwaysOn,
                        dpInit: '',
                        config: {
                            card: 'cardAlarm',
                            data: {
                                alarmType: { type: 'const', constVal: entry.alarmType || 'unlock' },
                                headline: { type: 'const', constVal: entry.headline || 'Unlock' },
                                button1: entry.button1 ? { type: 'const', constVal: entry.button1 } : undefined,
                                button2: entry.button2 ? { type: 'const', constVal: entry.button2 } : undefined,
                                button3: entry.button3 ? { type: 'const', constVal: entry.button3 } : undefined,
                                button4: entry.button4 ? { type: 'const', constVal: entry.button4 } : undefined,
                                button5: entry.button1 ? { type: 'const', constVal: entry.button5 } : undefined,
                                button6: entry.button2 ? { type: 'const', constVal: entry.button6 } : undefined,
                                button7: entry.button3 ? { type: 'const', constVal: entry.button7 } : undefined,
                                button8: entry.button4 ? { type: 'const', constVal: entry.button8 } : undefined,
                                pin: entry.pin != null ? { type: 'const', constVal: String(entry.pin) } : undefined,
                                approved: { type: 'const', constVal: !!entry.approved },
                                global: { type: 'const', constVal: !!entry.global },
                                setNavi: entry.setNavi ? { type: 'const', constVal: entry.setNavi } : undefined,
                            },
                        },
                        pageItems: [],
                    };
                    break;
                }
                case 'cardQR': {
                    if (!isAlwaysOnMode(entry.alwaysOn)) {
                        entry.alwaysOn = 'none';
                    }
                    newPage = {
                        uniqueID: entry.uniqueName,
                        hidden: !!entry.hidden,
                        alwaysOn: entry.alwaysOn,
                        dpInit: '',
                        config: {
                            card: 'cardQR',
                            data: {
                                headline: { type: 'const', constVal: entry.headline || 'Page QR' },
                                selType: { type: 'const', constVal: entry.selType || 0 },
                                ssidUrlTel: { type: 'const', constVal: entry.ssidUrlTel || '' },
                                wlantype: { type: 'const', constVal: entry.wlantype || 'WPA' },
                                wlanhidden: { type: 'const', constVal: !!entry.wlanhidden || false },
                                password: { type: 'const', constVal: entry.qrPass || '' },
                                pwdhidden: { type: 'const', constVal: !!entry.pwdhidden || false },
                                setState: entry.setState ? { type: 'triggered', dp: entry.setState } : undefined,
                            },
                        },
                        pageItems: [],
                    };
                    break;
                }
                case 'cardTrash': {
                    if (!isAlwaysOnMode(entry.alwaysOn)) {
                        entry.alwaysOn = 'none';
                    }
                    newPage = dataForcardTrash(entry);
                    this.log.debug(`Generated trash 1page for '${entry.uniqueName}'`);
                    break;
                }
                case 'cardGrid':
                case 'cardGrid2':
                case 'cardGrid3': {
                    if (!isAlwaysOnMode(entry.alwaysOn)) {
                        entry.alwaysOn = 'none';
                    }
                    newPage = {
                        uniqueID: entry.uniqueName,
                        hidden: !!entry.hidden,
                        alwaysOn: entry.alwaysOn,
                        dpInit: '',
                        config: {
                            card: entry.card,
                            scrollPresentation: entry.scrollPresentation || 'classic',
                            data: {
                                headline: { type: 'const', constVal: entry.headline || entry.uniqueName },
                            },
                        },
                        pageItems: [],
                    };

                    if (entry.pageItems) {
                        let start = false;
                        for (let index = entry.pageItems.length - 1; index >= 0; index--) {
                            let item = entry.pageItems[index];
                            if (!item && !start) {
                                continue;
                            }
                            start = true;
                            if (!item) {
                                item = { channelId: ShareConfig.emptyChannelValueConfig('empty') };
                            } else {
                                item = { ...item, channelId: ShareConfig.normalizeChannelId(item.channelId) };
                            }
                            const result = await this.adapter.convertAdminPageItemToPageItemConfig(
                                item,
                                { card: entry.card, uniqueName: entry.uniqueName },
                                [],
                            );
                            if (!result.error && result.pageItem) {
                                newPage.pageItems = newPage.pageItems ?? [];
                                newPage.pageItems.unshift(result.pageItem);
                            } else if (result.error) {
                                this.log.warn(
                                    `Error processing1 page item ${index} for page '${entry.uniqueName}': ${result.error}`,
                                );
                            }
                        }
                    }

                    break;
                }
                case 'cardEntities':
                case 'cardSchedule': {
                    if (!isAlwaysOnMode(entry.alwaysOn)) {
                        entry.alwaysOn = 'none';
                    }
                    newPage = {
                        uniqueID: entry.uniqueName,
                        hidden: !!entry.hidden,
                        alwaysOn: entry.alwaysOn,
                        dpInit: '',
                        config: {
                            card: entry.card,
                            data: {
                                headline: { type: 'const', constVal: entry.headline || entry.uniqueName },
                            },
                        },
                        pageItems: [],
                    };

                    if (entry.pageItems) {
                        let start = false;
                        for (let index = entry.pageItems.length - 1; index >= 0; index--) {
                            let item = entry.pageItems[index];
                            if (!item && !start) {
                                continue;
                            }
                            start = true;
                            if (!item) {
                                item = { channelId: ShareConfig.emptyChannelValueConfig('empty') };
                            } else {
                                item = { ...item, channelId: ShareConfig.normalizeChannelId(item.channelId) };
                            }
                            const result = await this.adapter.convertAdminPageItemToPageItemConfig(
                                item,
                                { card: entry.card, uniqueName: entry.uniqueName },
                                [],
                            );
                            if (!result.error && result.pageItem) {
                                newPage.pageItems = newPage.pageItems ?? [];
                                newPage.pageItems.unshift(result.pageItem);
                            } else if (result.error) {
                                this.log.warn(
                                    `Error processing page item ${index} for page '${entry.uniqueName}': ${result.error}`,
                                );
                            }
                        }
                    }

                    break;
                }
                default: {
                    this.log.warn(`Unsupported card type '${entry.card}' for page '${entry.uniqueName}', skipping!`);
                    continue;
                }
            }

            // Check for duplicate page name
            if (!this.adapter.config.adminOverridesScriptPages) {
                if (option.pages.find((a: PageBase) => a.uniqueID === newPage.uniqueID)) {
                    this.log.warn(`Page with name ${newPage.uniqueID} already exists, skipping!`);
                    continue;
                }
            } else {
                // Remove existing page and navigation entries for this page name to allow overrides
                option.pages = option.pages.filter((a: PageBase) => a.uniqueID !== newPage.uniqueID);
                option.navigation = option.navigation.filter(
                    (b: NavigationItemConfig | null) => b && b.name !== newPage.uniqueID,
                );
                option.navigation.forEach((b: NavigationItemConfig | null) => {
                    if (b) {
                        if (this.pageConfig.find(e => e.uniqueName === b.name)) {
                            // Don't reset navigation entries for pages defined in admin config
                        } else {
                            if (b.left?.single === newPage.uniqueID) {
                                b.left.single = undefined;
                            }
                            if (b.right?.single === newPage.uniqueID) {
                                b.right.single = undefined;
                            }
                        }
                    }
                });
            }

            option.pages.push(newPage);

            // Build stub navigation entry; chain links are resolved in applyPendingNavigations
            const navigationEntry: NavigationItemConfig = {
                name: newPage.uniqueID,
                page: newPage.uniqueID,
                right: { single: undefined, double: undefined },
                left: { single: undefined, double: undefined },
            };
            option.navigation.push(navigationEntry);

            const navigation = navAssign.navigation;
            if (!navigation) {
                continue;
            }

            // Apply home/parent immediately – no chain dependency
            const nav = { ...navigation };
            if (!nav.prev && !nav.next && !nav.home && !nav.parent) {
                nav.home = 'main';
            }
            if (nav.home) {
                navigationEntry.right!.double = nav.home;
            }
            if (nav.parent) {
                navigationEntry.left!.double = nav.parent;
            }

            // Defer prev/next chain resolution to applyPendingNavigations
            if (nav.prev !== undefined || nav.next !== undefined) {
                pendingNavs.push({
                    pageId: newPage.uniqueID,
                    prev: nav.prev,
                    next: nav.next,
                });
            }
        }

        return pendingNavs;
    }

    /**
     * Phase 2: wire prev/next navigation by building full chains and splicing
     * them into the existing navigation, preserving existing connections.
     *
     * Algorithm:
     * 1. Apply each page's own left/right pointers from its explicit prev/next.
     * 2. Group all pages by their declared `prev` target.
     * 3. Find root insertion points (prevTarget is NOT a pending page) and build
     *    full chains by recursively following sub-groups.
     * 4. Splice each full chain after its prevTarget: if prevTarget had an existing
     *    right pointer, it is moved to the end of the chain (preserving the topology).
     * 5. Handle remaining groups (prevTarget is a pending page not reached from any root).
     * 6. For pages that only declare `next` (no prev), splice before next target,
     *    inheriting the target's old left pointer.
     *
     * @param option - Panel configuration partial
     * @param pendingNavs - Pending navigation entries collected in phase 1
     */
    private applyPendingNavigations(option: panelConfigPartial, pendingNavs: PendingNavEntry[]): void {
        if (!pendingNavs.length) {
            return;
        }

        // Build lookup for quick access
        const pendingMap = new Map<string, PendingNavEntry>();
        for (const p of pendingNavs) {
            pendingMap.set(p.pageId, p);
        }

        // Step 1: Apply each page's own explicit prev/next as direct left/right pointers
        for (const pending of pendingNavs) {
            const pageEntry = option.navigation.find(b => b?.name === pending.pageId);
            if (!pageEntry) {
                continue;
            }
            if (pending.prev !== undefined) {
                pageEntry.left = { ...(pageEntry.left ?? {}), single: pending.prev };
            }
            if (pending.next !== undefined) {
                pageEntry.right = { ...(pageEntry.right ?? {}), single: pending.next };
            }
        }

        // Step 2: Group pages by their declared `prev` target (preserving definition order)
        const byPrev = new Map<string, string[]>();
        for (const pending of pendingNavs) {
            if (pending.prev !== undefined) {
                const list = byPrev.get(pending.prev) ?? [];
                list.push(pending.pageId);
                byPrev.set(pending.prev, list);
            }
        }

        // Step 3: Build full chains from root insertion points and splice into navigation
        const processedGroups = new Set<string>();

        for (const [prevTarget] of byPrev) {
            if (pendingMap.has(prevTarget)) {
                continue; // Not a root – will be reached via sub-group recursion
            }
            const fullChain = this.buildFullChain(prevTarget, byPrev, pendingMap, processedGroups);
            if (fullChain.length) {
                this.spliceChainAfter(prevTarget, fullChain, pendingMap, option);
            }
        }

        // Step 4: Handle remaining groups whose prevTarget is a pending page
        // not reached from any root (e.g. disconnected sub-chains)
        for (const [prevTarget] of byPrev) {
            if (processedGroups.has(prevTarget)) {
                continue;
            }
            const fullChain = this.buildFullChain(prevTarget, byPrev, pendingMap, processedGroups);
            if (fullChain.length) {
                this.spliceChainAfter(prevTarget, fullChain, pendingMap, option);
            }
        }

        // Step 5: For pages with only `next` declared (no prev), splice before next target
        for (const pending of pendingNavs) {
            if (pending.next === undefined || pending.prev !== undefined) {
                continue;
            }
            const nextEntry = option.navigation.find(b => b?.name === pending.next);
            if (!nextEntry) {
                continue;
            }
            const pageEntry = option.navigation.find(b => b?.name === pending.pageId);
            if (!pageEntry) {
                continue;
            }

            // Save old left of the next target before overwriting
            const oldLeft = nextEntry.left?.single;
            nextEntry.left = { ...(nextEntry.left ?? {}), single: pending.pageId };

            // Splice: inherit the old left so no new loose end is created
            if (oldLeft !== undefined && oldLeft !== pending.pageId && !pageEntry.left?.single) {
                pageEntry.left = { ...(pageEntry.left ?? {}), single: oldLeft };
                const oldLeftEntry = option.navigation.find(b => b?.name === oldLeft);
                if (oldLeftEntry?.right?.single === pending.next) {
                    oldLeftEntry.right = { ...(oldLeftEntry.right ?? {}), single: pending.pageId };
                }
            }
        }

        // Log unresolved references
        for (const pending of pendingNavs) {
            if (pending.prev !== undefined && !option.navigation.find(b => b?.name === pending.prev)) {
                this.log.warn(`Navigation unresolved for '${pending.pageId}': prev page '${pending.prev}' not found.`);
            }
            if (pending.next !== undefined && !option.navigation.find(b => b?.name === pending.next)) {
                this.log.warn(`Navigation unresolved for '${pending.pageId}': next page '${pending.next}' not found.`);
            }
        }
    }

    /**
     * Splice a chain of pages after prevTarget, preserving existing connections.
     * If prevTarget.right was already set, the old target is moved to the end
     * of the chain (provided the last element has no explicit next declaration).
     *
     * @param prevTarget - Name of the page to insert after
     * @param fullChain - Ordered list of page IDs to insert
     * @param pendingMap - Lookup map from pageId to PendingNavEntry
     * @param option - Panel configuration partial
     */
    private spliceChainAfter(
        prevTarget: string,
        fullChain: string[],
        pendingMap: Map<string, PendingNavEntry>,
        option: panelConfigPartial,
    ): void {
        const prevEntry = option.navigation.find(b => b?.name === prevTarget);
        const oldRight = prevEntry?.right?.single;

        // Wire: prevTarget.right → chain[0]
        if (prevEntry) {
            prevEntry.right = { ...(prevEntry.right ?? {}), single: fullChain[0] };
        }
        const firstEntry = option.navigation.find(b => b?.name === fullChain[0]);
        if (firstEntry) {
            firstEntry.left = { ...(firstEntry.left ?? {}), single: prevTarget };
        }

        // Wire internal chain links
        for (let i = 1; i < fullChain.length; i++) {
            const curr = option.navigation.find(b => b?.name === fullChain[i]);
            const prev = option.navigation.find(b => b?.name === fullChain[i - 1]);

            if (curr) {
                curr.left = { ...(curr.left ?? {}), single: fullChain[i - 1] };
            }
            if (prev) {
                // Only overwrite prev.right when it has no explicit next pointing elsewhere
                const prevPending = pendingMap.get(fullChain[i - 1]);
                const hasExternalNext = prevPending?.next !== undefined && prevPending.next !== fullChain[i];
                if (!hasExternalNext) {
                    prev.right = { ...(prev.right ?? {}), single: fullChain[i] };
                }
            }
        }

        // Splice end: connect last chain element to the old right of prevTarget
        if (oldRight !== undefined && !fullChain.includes(oldRight)) {
            const lastId = fullChain[fullChain.length - 1];
            const lastPending = pendingMap.get(lastId);
            const lastEntry = option.navigation.find(b => b?.name === lastId);

            if (lastEntry && !lastPending?.next) {
                lastEntry.right = { ...(lastEntry.right ?? {}), single: oldRight };
                const oldRightEntry = option.navigation.find(b => b?.name === oldRight);
                if (oldRightEntry) {
                    oldRightEntry.left = { ...(oldRightEntry.left ?? {}), single: lastId };
                }
            }
        }
    }

    /**
     * Recursively build a complete chain starting from pages grouped by prevTarget,
     * following sub-groups where a chain member is itself the prevTarget of another group.
     *
     * @param prevTarget - The prevTarget whose group to process
     * @param byPrev - Mapping from prevTarget to list of page IDs
     * @param pendingMap - Lookup map from pageId to PendingNavEntry
     * @param processedGroups - Set of already processed prevTargets (prevents cycles)
     */
    private buildFullChain(
        prevTarget: string,
        byPrev: Map<string, string[]>,
        pendingMap: Map<string, PendingNavEntry>,
        processedGroups: Set<string>,
    ): string[] {
        const pageIds = byPrev.get(prevTarget);
        if (!pageIds || processedGroups.has(prevTarget)) {
            return [];
        }

        processedGroups.add(prevTarget);
        const groupChain = this.buildChainFromGroup(pageIds, pendingMap);
        const result: string[] = [];

        for (const pageId of groupChain) {
            result.push(pageId);
            // If this page is the prevTarget of another group, recurse to extend the chain
            if (byPrev.has(pageId) && !processedGroups.has(pageId)) {
                const subChain = this.buildFullChain(pageId, byPrev, pendingMap, processedGroups);
                result.push(...subChain);
            }
        }

        return result;
    }

    /**
     * Build an ordered chain from a group of pages that share the same `prev` target.
     * Pages connected via intra-group `next` pointers are ordered first;
     * remaining pages are appended in their original definition order.
     *
     * @param pageIds - Page IDs in the group (definition order)
     * @param pendingMap - Lookup map from pageId to PendingNavEntry
     */
    private buildChainFromGroup(pageIds: string[], pendingMap: Map<string, PendingNavEntry>): string[] {
        const pageSet = new Set(pageIds);

        // Collect next pointers that stay within the group
        const nextInGroup = new Map<string, string>();
        for (const id of pageIds) {
            const p = pendingMap.get(id);
            if (p?.next !== undefined && pageSet.has(p.next)) {
                nextInGroup.set(id, p.next);
            }
        }

        // Chain starts: pages not pointed to as next by any other page in the group
        const hasIncoming = new Set(nextInGroup.values());
        const starts = pageIds.filter(id => !hasIncoming.has(id));

        const result: string[] = [];
        const visited = new Set<string>();

        for (const start of starts) {
            let curr: string | undefined = start;
            while (curr !== undefined && pageSet.has(curr) && !visited.has(curr)) {
                visited.add(curr);
                result.push(curr);
                curr = nextInGroup.get(curr);
            }
        }

        // Append any pages not reachable via intra-group links (e.g. cycles or isolated)
        for (const id of pageIds) {
            if (!visited.has(id)) {
                result.push(id);
            }
        }

        return result;
    }
}

function isAlwaysOnMode(F: any): F is AlwaysOnMode {
    const R = F as AlwaysOnMode;
    switch (R) {
        case 'always':
        case 'none':
        case 'ignore':
        case 'action':
            return true;
        default:
            exhaustiveCheck(R);
            return false;
    }
}

function dataForcardTrash(entry: ShareConfig.TrashEntry): PageBase {
    let newPage: PageBase;

    const pageItems = Array.from({ length: entry.countItems }, (_, i) => {
        return {
            id: `pageItem${i}`,
            role: 'text.list' as const,
            type: 'text' as const,
            data: {
                icon: {
                    true: {
                        value: {
                            type: 'internal' as const,
                            dp: `///pageTrash_${entry.uniqueName}`,
                            read: `return val[${i}].icon;`,
                        },
                        color: {
                            type: 'internal' as const,
                            dp: `///pageTrash_${entry.uniqueName}`,
                            read: `return val[${i}].color;`,
                        },
                    },
                },
                entity1: {
                    value: { type: 'const' as const, constVal: true },
                },
                text: {
                    true: {
                        type: 'internal' as const,
                        dp: `///pageTrash_${entry.uniqueName}`,
                        read: `return val[${i}].text;`,
                    },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'internal' as const,
                        dp: `///pageTrash_${entry.uniqueName}`,
                        read: `return val[${i}].text1;`,
                    },
                    false: undefined,
                },
            },
        };
    });

    if (entry.countItems < 1 || entry.countItems > 6) {
        entry.countItems = 6;
    }
    if (entry.countItems < 6) {
        newPage = {
            uniqueID: entry.uniqueName,
            hidden: !!entry.hidden,
            alwaysOn: entry.alwaysOn,
            dpInit: '',
            template: 'entities.waste-calendar',
            config: {
                card: 'cardEntities',
                data: {
                    headline: { type: 'const', constVal: entry.headline || 'Trash' },
                },
            },
            pageItems: pageItems,
        };
    } else {
        newPage = {
            uniqueID: entry.uniqueName,
            hidden: !!entry.hidden,
            alwaysOn: entry.alwaysOn,
            dpInit: '',
            template: 'entities.waste-calendar',
            config: {
                card: 'cardSchedule',
                data: {
                    headline: { type: 'const', constVal: entry.headline || 'Trash' },
                },
            },
            pageItems: pageItems,
        };
    }

    // Generiere PageItems dynamisch

    return newPage;
}
