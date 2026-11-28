import { expect } from 'chai';
import { PageItem } from './pageItem';
import { Dataitem } from '../controller/data-item';

/**
 * Item of cardEntities without constructor: name, prefix and suffix of the name as const data items.
 *
 * @param headline name part, undefined = none
 * @param prefix prefix of the name, undefined = none
 * @param suffix suffix of the name, undefined = none
 * @param type input_sel, light or shutter
 * @returns the item
 */
function inSelItem(
    headline: string | undefined,
    prefix: string | number | undefined,
    suffix: string | number | undefined,
    type: 'input_sel' | 'light' | 'shutter' = 'input_sel',
): PageItem {
    const noop = (): void => undefined;
    const log = { debug: noop, warn: noop, error: noop, info: noop, silly: noop };
    const controller = { statesControler: { activateTrigger: async (): Promise<void> => undefined } };
    const adapter: unknown = { log, controller, config: {} };
    const translations: Record<string, string> = { Mode: 'Modus' };
    const c = (v: string | number): Dataitem =>
        new Dataitem(adapter, { type: 'const', constVal: v }, {} as never, {} as never);
    const item = Object.create(PageItem.prototype) as PageItem;
    Object.assign(item, {
        id: 'test',
        log,
        config: { role: '' },
        adapter,
        library: { getTranslation: (k: string): string => translations[k] ?? k },
        parent: { card: 'cardEntities', basePanel: { overrideLightPopup: false } },
        isEnabled: async (): Promise<boolean> => true,
        dataItems: {
            type,
            role: '',
            data: {
                entity1: { value: c(1) },
                entityInSel: { value: c(0) },
                valueList: c('a?b'),
                text: { true: c('a'), false: undefined },
                headline: headline === undefined ? undefined : c(headline),
                headlinePrefix: prefix === undefined ? undefined : c(prefix),
                headlineSuffix: suffix === undefined ? undefined : c(suffix),
            },
        },
    });
    return item;
}

/**
 * The display name: 5th field of the row payload type~id~icon~color~name~value.
 *
 * @param item the input_sel item
 * @returns the display name
 */
async function rowName(item: PageItem): Promise<string> {
    return (await item.getPageItemPayload()).split('~')[4] ?? '';
}

describe('lib/pages/pageItem - item name with prefix and suffix', () => {
    it('row: prefix + translated name + suffix, joined without a space of its own', async () => {
        expect(await rowName(inSelItem('Mode', 'pre ', ' Uhr'))).to.equal('pre Modus Uhr');
        expect(await rowName(inSelItem('24.11.2026 17:42', '', 'Uhr'))).to.equal('24.11.2026 17:42Uhr');
    });

    it('row: a name of one space between two number states 0 gives "0 0", like the admin preview', async () => {
        expect(await rowName(inSelItem(' ', 0, 0))).to.equal('0 0');
    });

    it('row: empty name part shows prefix and suffix only', async () => {
        expect(await rowName(inSelItem('', 'A', 'B'))).to.equal('AB');
    });

    it('row: without prefix and suffix only the translated name', async () => {
        expect(await rowName(inSelItem('Mode', undefined, undefined))).to.equal('Modus');
    });

    it('popup: the headline gets prefix and suffix as well', async () => {
        const popup = await inSelItem('Mode', 'pre ', 0).GeneratePopup('popupInSel');
        expect(popup).to.be.a('string');
        expect((popup ?? '').split('~')).to.include('pre Modus0');
    });

    for (const type of ['light', 'shutter'] as const) {
        it(`${type} row (name of the popup as well): prefix + name + suffix, empty name part`, async () => {
            expect(await rowName(inSelItem('Mode', 'pre ', ' suf', type))).to.equal('pre Modus suf');
            expect(await rowName(inSelItem('', 0, 0, type))).to.equal('00');
        });
    }
});
