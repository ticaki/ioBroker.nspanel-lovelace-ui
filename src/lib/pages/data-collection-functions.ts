import type { Page } from '../classes/Page';
import type { AdapterClassDefinition } from '../classes/library';
import { Color } from '../const/Color';
import type { CardRole } from '../types/pages';
import type { PageItemDataItemsOptions } from '../types/type-pageItem';
import type { PageEntities } from './pageEntities';

/**
 * Handles the role of a card and returns the corresponding page item data options.
 *
 * @param adapter - The adapter instance used to interact with the system.
 * @param cardRole - The role of the card to handle. It can be 'AdapterConnection', 'AdapterStopped', or 'AdapterUpdates'.
 * @param [page] - The page instance, required for 'AdapterUpdates' role.
 * @returns A promise that resolves to an array of page item data options or null if no data is found.
 * @description
 * This function processes different card roles and retrieves the corresponding data items based on the role.
 * It supports the following roles:
 *
 * - 'AdapterConnection': Retrieves data items for enabled adapters with a 'daemon' mode.
 * - 'AdapterStopped': Retrieves data items for stopped adapters.
 * - 'AdapterUpdates': Retrieves data items for adapter updates.
 *
 * For 'AdapterConnection' and 'AdapterStopped' roles, the function fetches the list of system instances and filters them based on their enabled state and mode.
 * It then constructs the page item data options for each adapter instance.
 *
 * For the 'AdapterUpdates' role, the function checks if the page is of type 'cardEntities' and retrieves the list of updates from the page's data list.
 * It then constructs the page item data options for each update.
 * @example
 * const adapter = new AdapterClassDefinition();
 * const cardRole = 'AdapterConnection';
 * const page = new Page();
 * const result = await handleCardRole(adapter, cardRole, page);
 * console.log(result);
 */
export async function handleCardRole(
    adapter: AdapterClassDefinition,
    cardRole: CardRole | undefined,
    page?: Page | PageEntities,
): Promise<PageItemDataItemsOptions[] | null> {
    if (!cardRole) {
        return null;
    }
    switch (cardRole) {
        /**
         * only for enabled adapters
         */
        case 'AdapterConnection':
        case 'AdapterStopped': {
            const list = await adapter.getObjectViewAsync('system', 'instance', {
                startkey: `system.adapter`,
                endkey: `system.adapter}`,
            });
            if (!list) {
                return null;
            }
            const result = [];
            for (const item of list.rows) {
                const obj = item.value;
                if (!obj.common.enabled || obj.common.mode !== 'daemon') {
                    continue;
                }
                let n =
                    obj.common.titleLang &&
                    typeof obj.common.titleLang == 'object' &&
                    obj.common.titleLang[adapter.library.getLocalLanguage()];
                n = n ? n : typeof obj.common.titleLang == 'object' && obj.common.titleLang.en;
                n = n ? n : obj.common.name;
                // ignore this
                if (item.id.split('.').slice(2).join('.') === adapter.namespace) {
                    continue;
                }

                const stateID =
                    cardRole === 'AdapterConnection'
                        ? `${item.id.split('.').slice(2).join('.')}.info.connection`
                        : `${item.id}.alive`;
                const stateObj = await adapter.getForeignObjectAsync(stateID);
                if (!stateObj || !stateObj.common || stateObj.common.type !== 'boolean') {
                    continue;
                }

                const pi: PageItemDataItemsOptions = {
                    role: '',
                    type: 'text',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'checkbox-intermediate' },
                                color: { type: 'const', constVal: Color.good },
                            },
                            false: {
                                value: { type: 'const', constVal: 'checkbox-intermediate' },
                                color: {
                                    type: 'const',
                                    constVal: cardRole === 'AdapterConnection' ? Color.good : Color.bad,
                                },
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        entity1: {
                            value: {
                                type: 'triggered',
                                dp: stateID,
                            },
                        },
                        text: {
                            true: { type: 'const', constVal: n },
                            false: undefined,
                        },
                        text1: {
                            true: { type: 'const', constVal: obj.common.version },
                            false: undefined,
                        },
                    },
                };
                result.push(pi);
            }
            return result;
        }
        case 'AdapterUpdates': {
            if (
                !page ||
                page.card !== 'cardEntities' ||
                !('items' in page) ||
                !page.items ||
                page.items.card !== 'cardEntities'
            ) {
                return null;
            }
            if (!page.items.data.list) {
                return null;
            }
            const value = (await page.items.data.list.getObject()) as any;
            if (value && page.items.data.list.options.type !== 'const') {
                const dp = page.items.data.list.options.dp;
                const result = [];
                for (const a in value) {
                    const pi: PageItemDataItemsOptions = {
                        role: '',
                        type: 'text',
                        dpInit: '',

                        data: {
                            icon: {
                                true: {
                                    value: { type: 'const', constVal: 'checkbox-intermediate' },
                                    color: { type: 'const', constVal: Color.good },
                                },
                                false: {
                                    value: { type: 'const', constVal: 'checkbox-intermediate' },
                                    color: { type: 'const', constVal: Color.bad },
                                },
                            },
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    dp: dp,
                                    read: `return !!val`,
                                },
                            },
                            text: {
                                true: {
                                    type: 'const',
                                    constVal: a,
                                },
                                false: undefined,
                            },
                            text1: {
                                true: {
                                    type: 'state',
                                    dp: dp,
                                    read: `if (!val || !val.startsWith('{') || !val.endsWith('}')) return '';
                                    const v = JSON.parse(val)
                                    return (
                                        v['${a}'] ? ('v' + v['${a}'].installedVersion.trim() + "\\r\\nv" + (v['${a}'].availableVersion.trim() + '  ' )) : 'done'
                                    );`,
                                },

                                false: undefined,
                            },
                        },
                    };
                    result.push(pi);
                }
                return result;
            }
        }
    }
    return null;
}
