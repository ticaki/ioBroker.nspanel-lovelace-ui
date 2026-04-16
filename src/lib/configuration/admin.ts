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
    prevDone: boolean;
    nextDone: boolean;
    /** true when prev chain-insertion already set right.single – explicit next must be skipped */
    rightSetByPrev: boolean;
};

export class AdminConfiguration extends BaseClass {
    private pageConfig: ShareConfig.PageConfig[] = [];
    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'AdminConfiguration');
        this.adapter = adapter;
        this.pageConfig = this.adapter.config.pageConfig || [];
    }

    public async processPanels(options: panelConfigPartial[]): Promise<panelConfigPartial[]> {
        for (const option of options) {
            await this.processentrys(option);
        }
        return options;
    }
    /**
     * Process configurable pages from adapter config and build navigation entries.
     * Orchestrates page creation (phase 1) and deferred navigation chain resolution (phase 2).
     *
     * @param option - Panel configuration partial containing pages and navigation arrays
     */
    public async processentrys(option: panelConfigPartial): Promise<panelConfigPartial> {
        const pendingNavs = await this.createPagesFromConfig(option);
        this.applyPendingNavigations(option, pendingNavs);
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
                    prevDone: false,
                    nextDone: false,
                    rightSetByPrev: false,
                });
            }
        }

        return pendingNavs;
    }

    /**
     * Phase 2: apply pending prev/next chain assignments in repeated iterations until
     * stable (nothing changes). Handles forward-references where a referenced page was
     * not yet present in option.navigation when the referencing entry was first processed.
     *
     * @param option - Panel configuration partial
     * @param pendingNavs - Pending navigation entries collected in phase 1
     */
    private applyPendingNavigations(option: panelConfigPartial, pendingNavs: PendingNavEntry[]): void {
        let changed = true;
        while (changed) {
            changed = false;
            for (const pending of pendingNavs) {
                if (pending.prevDone && (pending.nextDone || pending.next === undefined || pending.rightSetByPrev)) {
                    continue;
                }

                const pageEntry = option.navigation.find(b => b?.name === pending.pageId);
                if (!pageEntry) {
                    continue;
                }

                // Process prev: insert pageEntry after prevEntry in the chain
                if (pending.prev !== undefined && !pending.prevDone) {
                    const prevEntry = option.navigation.find(b => b?.name === pending.prev);
                    if (prevEntry) {
                        pageEntry.left = { ...(pageEntry.left ?? {}), single: pending.prev };
                        const oldNext = prevEntry.right?.single;
                        if (oldNext && oldNext !== pending.pageId) {
                            this.log.debug(
                                `Navigation: '${pending.prev}' already points to '${oldNext}', inserting '${pending.pageId}' between them.`,
                            );
                            prevEntry.right = { ...(prevEntry.right ?? {}), single: pending.pageId };
                            if (!pageEntry.right?.single) {
                                pageEntry.right = { ...(pageEntry.right ?? {}), single: oldNext };
                                pending.rightSetByPrev = true;
                            }
                            const oldNextEntry = option.navigation.find(b => b?.name === oldNext);
                            if (oldNextEntry) {
                                oldNextEntry.left = { ...(oldNextEntry.left ?? {}), single: pending.pageId };
                            }
                        } else if (!oldNext) {
                            prevEntry.right = { ...(prevEntry.right ?? {}), single: pending.pageId };
                        }
                        pending.prevDone = true;
                        changed = true;
                    }
                }

                // Process next: insert pageEntry before nextEntry in the chain.
                // Skipped if prev chain-insertion already set right.single.
                if (pending.next !== undefined && !pending.nextDone && !pending.rightSetByPrev) {
                    const nextEntry = option.navigation.find(b => b?.name === pending.next);
                    if (nextEntry) {
                        pageEntry.right = { ...(pageEntry.right ?? {}), single: pending.next };
                        const oldPrev = nextEntry.left?.single;
                        if (oldPrev && oldPrev !== pending.pageId) {
                            nextEntry.left = { ...(nextEntry.left ?? {}), single: pending.pageId };
                            if (!pageEntry.left?.single) {
                                pageEntry.left = { ...(pageEntry.left ?? {}), single: oldPrev };
                            }
                            const oldPrevEntry = option.navigation.find(b => b?.name === oldPrev);
                            if (oldPrevEntry) {
                                oldPrevEntry.right = { ...(oldPrevEntry.right ?? {}), single: pending.pageId };
                            }
                        } else if (!oldPrev) {
                            nextEntry.left = { ...(nextEntry.left ?? {}), single: pending.pageId };
                        }
                        pending.nextDone = true;
                        changed = true;
                    }
                }
            }
        }

        // Log unresolved entries (referenced pages not found anywhere in navigation)
        for (const pending of pendingNavs) {
            if (pending.prev !== undefined && !pending.prevDone) {
                this.log.warn(`Navigation unresolved for '${pending.pageId}': prev page '${pending.prev}' not found.`);
            }
            if (pending.next !== undefined && !pending.nextDone && !pending.rightSetByPrev) {
                this.log.warn(`Navigation unresolved for '${pending.pageId}': next page '${pending.next}' not found.`);
            }
        }
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
