import { expect } from 'chai';
import { PageItem } from './pageItem';
import { Dataitem } from '../controller/data-item';

/**
 * Text item of cardEntities without constructor: label `label`, value `value` (both const), translations
 * of `wecker` and `label` known.
 *
 * @param role role of the item
 * @returns payload of the item
 */
async function payload(role: '' | 'textRawValue'): Promise<string> {
    const noop = (): void => undefined;
    const log = { debug: noop, warn: noop, error: noop, info: noop, silly: noop };
    const controller = { statesControler: { activateTrigger: async (): Promise<void> => undefined } };
    const adapter: unknown = { log, controller };
    const translations: Record<string, string> = { wecker: 'Alarm clock', label: 'Target' };
    const c = (v: string | boolean): Dataitem =>
        new Dataitem(adapter, { type: 'const', constVal: v }, {} as never, {} as never);
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: 'test',
        log,
        config: {},
        adapter,
        library: { getTranslation: (k: string): string => translations[k] ?? k },
        parent: { card: 'cardEntities' },
        isEnabled: async (): Promise<boolean> => true,
        dataItems: {
            type: 'text',
            role,
            data: {
                icon: { true: { value: c('home'), color: c('#ffffff') }, false: undefined },
                entity1: { value: c(true) },
                text: { true: c('label'), false: undefined },
                text1: { true: c('wecker'), false: undefined },
            },
        },
    });
    return item.getPageItemPayload();
}

describe('lib/pages/pageItem - text value of a name', () => {
    it('a normal text value is looked up in the translations', async () => {
        const p = await payload('');
        expect(p).to.contain('Alarm clock');
        expect(p).to.contain('Target');
    });
    it('textRawValue shows the value as it is, the label is still translated', async () => {
        const p = await payload('textRawValue');
        expect(p).to.contain('wecker');
        expect(p).not.to.contain('Alarm clock');
        expect(p).to.contain('Target');
    });
});
