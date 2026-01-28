import type { NavigationItemConfig } from '../classes/navigation';
import { BaseClass } from '../controller/library';
import type { panelConfigPartial } from '../controller/panel';
import * as ShareConfig from '../types/adminShareConfig';
import { exhaustiveCheck } from '../types/function-and-const';
import type { NspanelLovelaceUi } from '../types/NspanelLovelaceUi';
import type { PageBase } from '../types/pages';
import type { AlwaysOnMode } from '../types/types';

export class AdminConfiguration extends BaseClass {
    private pageConfig: ShareConfig.PageConfig[] = [];
    constructor(adapter: NspanelLovelaceUi) {
        super(adapter, 'AdminConfiguration');
        this.adapter = adapter;
        this.pageConfig = this.adapter.config.pageConfig || [];
    }

    public processPanels(options: panelConfigPartial[]): panelConfigPartial[] {
        for (const option of options) {
            this.processentrys(option);
        }
        return options;
    }
    /**
     * Process configurable pages from adapter config and build navigation entries.
     * Supports ALL_PANELS_SPECIAL_ID for applying pages to all panels at once,
     * then allows individual panel overrides or exclusions.
     *
     * Logic:
     * - First pass: If ALL_PANELS_SPECIAL_ID assignment exists, apply to all panels
     * - Second pass: Process panel-specific assignments
     *   - Empty navigation with prior ALL = exclude this panel from that page
     *   - Empty navigation without ALL = default to home:'main'
     *
     * Supported card types: cardAlarm (unlock/alarm), cardQR, and more in the future.
     *
     * @param option - Panel configuration partial containing pages and navigation arrays
     */
    public processentrys(option: panelConfigPartial): panelConfigPartial {
        const entries = this.pageConfig;

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
                    newPage = dataForcardTrash(entry, this.adapter);
                    break;
                }
                default: {
                    this.log.warn(`Unsupported card type '${entry.card}' for page '${entry.uniqueName}', skipping!`);
                    continue;
                }
            }
            // Check for duplicate page name
            if (option.pages.find((a: PageBase) => a.uniqueID === newPage.uniqueID)) {
                this.log.warn(`Page with name ${newPage.uniqueID} already exists, skipping!`);
                continue;
            }

            option.pages.push(newPage);

            const navigation = navAssign.navigation;
            if (!navigation) {
                continue;
            }

            // Build navigation entry
            const navigationEntry: NavigationItemConfig = {
                name: newPage.uniqueID,
                page: newPage.uniqueID,
                right: { single: undefined, double: undefined },
                left: { single: undefined, double: undefined },
            };

            // Default to home:'main' if no navigation specified
            if (!navigation.prev && !navigation.next && !navigation.home && !navigation.parent) {
                navigation.home = 'main';
            }

            let overrwriteNext = false;

            // Handle prev navigation
            if (navigation.prev) {
                navigationEntry.left!.single = navigation.prev;
                const index = option.navigation.findIndex(
                    (b: NavigationItemConfig | null) => b && b.name === navigation.prev,
                );
                if (index !== -1 && option.navigation[index]) {
                    const oldNext = option.navigation[index].right?.single;
                    if (oldNext && oldNext !== newPage.uniqueID) {
                        overrwriteNext = true;
                        option.navigation[index].right = option.navigation[index].right || {};
                        option.navigation[index].right.single = newPage.uniqueID;
                        navigationEntry.right!.single = oldNext;

                        const nextIndex = option.navigation.findIndex(
                            (b: NavigationItemConfig | null) => b && b.name === oldNext,
                        );
                        if (nextIndex !== -1 && option.navigation[nextIndex]) {
                            option.navigation[nextIndex].left = option.navigation[nextIndex].left || {};
                            option.navigation[nextIndex].left.single = newPage.uniqueID;
                        }
                    } else if (!oldNext) {
                        option.navigation[index].right = { single: newPage.uniqueID };
                    }
                }
            }

            // Handle next navigation
            if (!overrwriteNext && navigation.next) {
                navigationEntry.right!.single = navigation.next;
                const index = option.navigation.findIndex(
                    (b: NavigationItemConfig | null) => b && b.name === navigation.next,
                );
                if (index !== -1 && option.navigation[index]) {
                    const oldPrev = option.navigation[index].left?.single;
                    if (oldPrev && oldPrev !== newPage.uniqueID) {
                        option.navigation[index].left = option.navigation[index].left || {};
                        option.navigation[index].left.single = newPage.uniqueID;
                        navigationEntry.left!.single = oldPrev;

                        const prevIndex = option.navigation.findIndex(
                            (b: NavigationItemConfig | null) => b && b.name === oldPrev,
                        );
                        if (prevIndex !== -1 && option.navigation[prevIndex]) {
                            option.navigation[prevIndex].right = option.navigation[prevIndex].right || {};
                            option.navigation[prevIndex].right.single = newPage.uniqueID;
                        }
                    } else if (!oldPrev) {
                        option.navigation[index].left = { single: newPage.uniqueID };
                    }
                }
            }

            // Handle home/parent navigation
            if (navigation.home) {
                navigationEntry.left!.double = navigation.home;
            }
            if (navigation.parent) {
                navigationEntry.right!.double = navigation.parent;
            }

            option.navigation.push(navigationEntry);
        }

        return option;
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

function dataForcardTrash(entry: ShareConfig.TrashEntry, adapter: NspanelLovelaceUi): PageBase {
    let text = 'return JSON.parse(val).text2;';
    let newPage: PageBase;

    if (entry.countItems < 6) {
        text = `return JSON.parse(val).text1;`;
    }

    const pageItems = Array.from({ length: entry.countItems }, (_, i) => {
        const pageItemDp = `${adapter.name}.${adapter.instance}.pageTrash.${entry.uniqueName}.pageItem${i}`;
        return {
            id: `pageItem${i}`,
            role: 'text.list' as const,
            type: 'text' as const,
            data: {
                icon: {
                    true: {
                        value: {
                            type: 'state' as const,
                            dp: pageItemDp,
                            read: 'return JSON.parse(val).icon;',
                        },
                        color: {
                            type: 'state' as const,
                            dp: pageItemDp,
                            read: 'return JSON.parse(val).color;',
                        },
                    },
                },
                entity1: {
                    value: { type: 'const' as const, constVal: true },
                },
                text: {
                    true: {
                        type: 'state' as const,
                        dp: pageItemDp,
                        read: 'return JSON.parse(val).text;',
                    },
                    false: undefined,
                },
                text1: {
                    true: {
                        type: 'state' as const,
                        dp: pageItemDp,
                        read: text,
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
