/**
 * A notification of the screensaver (Schlagzeile): every field of its content that is a state triggers an update -
 * heading prefix, heading, heading unit, text prefix, text, text suffix and the icon. The screensaver throttles a new
 * content to one send every 30 s. A field that is no state stays a constant.
 */
import { expect } from 'chai';
import { ConfigManager } from './config-manager';
import { PageItem } from '../pages/pageItem';

const STATES = new Set(['x.0.prefix', 'x.0.head', 'x.0.unit', 'x.0.textPrefix', 'x.0.text', 'x.0.suffix', 'x.0.icon']);

function manager(): ConfigManager {
    const m = Object.create(ConfigManager.prototype) as ConfigManager;
    Object.assign(m, {
        existsState: async (id: string): Promise<boolean> => Promise.resolve(STATES.has(id) || id === 'x.0.on'),
    });
    return m;
}

describe('lib/classes/config-manager - screensaver notification triggers', () => {
    it('every field of the content that is a state is triggered', async () => {
        const result = await manager().getNotifyEntityData(
            {
                type: 'script',
                Priority: 1,
                Headline: 'x.0.head',
                HeadlinePrefix: 'x.0.prefix',
                HeadlineUnit: 'x.0.unit',
                HeadlineIcon: 'x.0.icon',
                Text: 'x.0.text',
                TextPrefix: 'x.0.textPrefix',
                TextSuffix: 'x.0.suffix',
                Enabled: 'x.0.on',
            },
            'notify',
        );
        const data = result.data as any;
        const fields = {
            headline: data.entity1.value,
            headlinePrefix: data.entity1.prefix,
            headlineUnit: data.entity1.unit,
            text: data.text.true.value,
            textPrefix: data.text.true.prefix,
            textSuffix: data.text.true.suffix,
            icon: data.icon.true.value,
        };
        expect(fields).to.deep.equal({
            headline: { type: 'triggered', dp: 'x.0.head' },
            headlinePrefix: { type: 'triggered', dp: 'x.0.prefix' },
            headlineUnit: { type: 'triggered', dp: 'x.0.unit' },
            text: { type: 'triggered', dp: 'x.0.text' },
            textPrefix: { type: 'triggered', dp: 'x.0.textPrefix' },
            textSuffix: { type: 'triggered', dp: 'x.0.suffix' },
            icon: { type: 'triggered', dp: 'x.0.icon' },
        });
        // the copy for the second line of the heading keeps the triggers
        expect(data.entity2.prefix).to.deep.equal({ type: 'triggered', dp: 'x.0.prefix' });
        expect(data.enabled).to.deep.equal({ type: 'triggered', dp: 'x.0.on' });
    });

    it('a text that is no state stays a constant', async () => {
        const result = await manager().getNotifyEntityData(
            {
                type: 'script',
                Priority: 1,
                Headline: 'Strom',
                HeadlinePrefix: 'Hoch: ',
                HeadlineUnit: ' V',
                Text: 'Spannung',
                TextPrefix: '> ',
                TextSuffix: ' !',
                Enabled: 'x.0.on',
            },
            'notify',
        );
        const data = result.data as any;
        expect(data.entity1.prefix).to.deep.equal({ type: 'const', constVal: 'Hoch: ' });
        expect(data.entity1.unit).to.deep.equal({ type: 'const', constVal: ' V' });
        expect(data.text.true.suffix).to.deep.equal({ type: 'const', constVal: ' !' });
    });
});

describe('lib/pages/pageItem - a dismissed notification and a new content', () => {
    it('a change of a content state does not bring it back', async () => {
        const item = Object.create(PageItem.prototype) as PageItem;
        Object.assign(item, {
            config: { role: 'isDismissiblePerEvent' },
            dataItems: { data: { enabled: { options: { dp: 'x.0.on' } } } },
            tempData: undefined,
            clockSourceListeners: new Set(),
        });
        item.setDismissiblePerEvent();
        expect(await item.isEnabled()).to.equal(false);
        await item.onStateChange('x.0.text', { old: { val: '230' } as any, new: { val: '251' } as any });
        await item.onStateChange('x.0.prefix', { old: { val: 'a' } as any, new: { val: 'b' } as any });
        expect(await item.isEnabled()).to.equal(false);
    });
});
