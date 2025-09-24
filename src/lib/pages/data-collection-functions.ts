import type { Page } from '../classes/Page';
import type { AdapterClassDefinition } from '../controller/library';
import { Color } from '../const/Color';
import { getStringFromStringOrTranslated } from '../const/tools';
import { exhaustiveCheck, type CardRole, type PageMenuConfig } from '../types/pages';
import type { PageItemDataItemsOptions } from '../types/type-pageItem';
import type { PageEntities } from './pageEntities';
import type { PageMedia } from './pageMedia';

/**
 * Handles the role of a card and returns the corresponding page item data options.
 *
 * @param adapter - The adapter instance used to interact with the system.
 * @param cardRole - The role of the card to handle. It can be 'AdapterConnection', 'AdapterStopped', or 'AdapterUpdates'.
 * @param [page] - The page instance, required for 'AdapterUpdates' role.
 * @param _tempArr
 * @param _options
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
    _options?: PageMenuConfig['options'],
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
        case 'AdapterUpdates':
            {
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
            break;
        case 'SonosSpeaker':
            {
                let result: PageItemDataItemsOptions[] | null = null;
                const _tempArr = _options?.cardRoleList;
                //const ident = _options?.indentifier ?? '';
                if (!((!_tempArr || Array.isArray(_tempArr)) && page && page.directParentPage)) {
                    return null;
                }
                /*if (ident || !(typeof ident === 'string')) {
                    adapter.log.error(` SonosSpeaker cardRole needs a string dpInit in page.parent.dpInit`);
                    return null;
                }*/
                if (
                    page.directParentPage.card !== 'cardMedia' ||
                    (page.directParentPage as PageMedia).currentItem == null
                ) {
                    break;
                }
                const identifier = `${(page.directParentPage as PageMedia).currentItem?.ident}`;
                const searchPath = identifier.split('.').slice(0, 3).join('.');
                const view = await adapter.getObjectViewAsync('system', 'channel', {
                    startkey: `${searchPath}.`,
                    endkey: `${searchPath}${String.fromCharCode(0xff_fd)}`,
                });
                const selects: { name: string; id: string }[] = [];
                if (view && view.rows && view.rows.length !== 0) {
                    if (_tempArr && _tempArr.length > 0) {
                        view.rows
                            .filter(v =>
                                _tempArr.includes(getStringFromStringOrTranslated(adapter, v.value.common.name)),
                            )
                            .forEach(v => {
                                selects.push({
                                    name: getStringFromStringOrTranslated(adapter, v.value.common.name),
                                    id: v.id,
                                });
                            });
                    } else {
                        view.rows.forEach(v =>
                            selects.push({
                                name: getStringFromStringOrTranslated(adapter, v.value.common.name),
                                id: v.id,
                            }),
                        );
                    }
                }
                let arr =
                    _tempArr && _tempArr.length > 0
                        ? selects.filter(t => _tempArr.findIndex(s => s === t.name) !== -1)
                        : selects;
                arr = arr.concat((_tempArr ?? []).map(n => ({ name: n, id: `` })));
                const seen = new Set();
                arr = arr.filter(item => item && !seen.has(item.name) && seen.add(item.name));
                arr = arr.sort((a, b) => a.name.localeCompare(b.name));

                result = [];
                for (let i = 0; i < arr.length; i++) {
                    const val = arr[i].name.trim();
                    const id = arr[i].id.trim();
                    if (!val) {
                        continue;
                    }
                    result.push({
                        role: 'volume.mute',
                        type: 'light',
                        dpInit: '',
                        data: {
                            entity1: {
                                value: {
                                    type: 'triggered',
                                    dp: `${identifier}.members`,
                                    read: `
                                            if (typeof val === 'string') {                                                    
                                                const t = val.split(',').map(s => s.trim());
                                                return t.includes('${val}');
                                            };
                                            return false;`,
                                },
                            },
                            headline: { type: 'const', constVal: val },
                            dimmer: {
                                value: {
                                    //mode: 'auto',
                                    type: 'triggered',
                                    //regexp: /\.volume$/,
                                    dp: `${id}.volume`,
                                },
                                minScale: { type: 'const', constVal: _options?.min ?? 0 },
                                maxScale: { type: 'const', constVal: _options?.max ?? 100 },
                            },
                            icon: {
                                true: {
                                    value: { type: 'const', constVal: 'speaker' },
                                    color: { type: 'const', constVal: Color.on },
                                },
                                false: {
                                    value: { type: 'const', constVal: 'speaker' },
                                    color: { type: 'const', constVal: Color.off },
                                },
                            },
                            setValue1: {
                                type: 'state',
                                dp: `${identifier}.add_to_group`,
                                write: `if (val) return '${val}'; else return '';`,
                            },
                            setValue2: {
                                type: 'state',
                                dp: `${identifier}.remove_from_group`,
                                write: `if (val) return '${val}'; else return '';`,
                            },
                        },
                    });
                }
                return result;
            }
            break;
        default: {
            exhaustiveCheck(cardRole);
            return null;
        }
    }
    return null;
}
