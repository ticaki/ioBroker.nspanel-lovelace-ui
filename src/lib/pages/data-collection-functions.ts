import { AdapterClassDefinition } from '../classes/library';
import { Green, Red, Yellow } from '../const/Color';
import { CardRole } from '../types/pages';
import { PageItemDataItemsOptions } from '../types/type-pageItem';

export async function handleCardRole(
    adapter: AdapterClassDefinition,
    cardRole: CardRole | undefined,
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
                const state = await adapter.getForeignStateAsync(
                    cardRole === 'AdapterConnection'
                        ? `${item.id.split('.').slice(2).join('.')}.info.connection`
                        : `${item.id}.alive`,
                );
                if (!state) continue;
                const pi: PageItemDataItemsOptions = {
                    role: 'text.list',
                    type: 'text',
                    dpInit: '',

                    data: {
                        icon: {
                            true: {
                                value: { type: 'const', constVal: 'checkbox-intermediate' },
                                color: { type: 'const', constVal: Green },
                            },
                            false: {
                                value: { type: 'const', constVal: 'checkbox-intermediate' },
                                color: { type: 'const', constVal: cardRole === 'AdapterConnection' ? Yellow : Red },
                            },
                            scale: undefined,
                            maxBri: undefined,
                            minBri: undefined,
                        },
                        entity1: {
                            value: {
                                type: 'triggered',
                                dp:
                                    cardRole === 'AdapterConnection'
                                        ? `${item.id.split('.').slice(2).join('.')}.info.connection`
                                        : `${item.id}.alive`,
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
    }
    return null;
}
