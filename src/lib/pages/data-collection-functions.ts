import { Page } from '../classes/Page';
import { AdapterClassDefinition } from '../classes/library';
import { Color } from '../const/Color';
import { CardRole } from '../types/pages';
import { PageItemDataItemsOptions } from '../types/type-pageItem';
import { PageEntities } from './pageEntities';

export async function handleCardRole(
    adapter: AdapterClassDefinition,
    cardRole: CardRole | undefined,
    page?: Page | PageEntities,
): Promise<PageItemDataItemsOptions[] | null> {
    if (!cardRole) return null;
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
            if (!list) return null;
            const result = [];
            for (const item of list.rows) {
                const obj = item.value;
                if (!obj.common.enabled || obj.common.mode !== 'daemon') continue;
                let n = obj.common.titleLang && obj.common.titleLang[adapter.library.getLocalLanguage()];
                n = n ? n : obj.common.titleLang && obj.common.titleLang['en'];
                n = n ? n : obj.common.name;
                // ignore this
                if (item.id.split('.').slice(2).join('.') === adapter.namespace) continue;

                const stateID =
                    cardRole === 'AdapterConnection'
                        ? `${item.id.split('.').slice(2).join('.')}.info.connection`
                        : `${item.id}.alive`;
                const stateObj = await adapter.getForeignObjectAsync(stateID);
                if (!stateObj || !stateObj.common || stateObj.common.type !== 'boolean') continue;

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
            )
                return null;
            if (!page.items.data.list) return null;
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
                                        v.${a} ? ('v' + v.${a}.installedVersion.trim() + "\\r\\nv" + (v.${a}.availableVersion.trim() + '  ' )) : 'done'
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
