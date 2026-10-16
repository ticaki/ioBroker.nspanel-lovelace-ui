import { expect } from 'chai';
import { screensaverTemplateInfos } from './template-info';
import { pageItemTemplates } from './templateArray';

describe('lib/templates - template info (screensaver item dialog)', () => {
    const infos = screensaverTemplateInfos();
    const byName = new Map(infos.map(i => [i.name, i]));

    it('describes every page item template exactly once, sorted by name', () => {
        expect(infos.map(i => i.name)).to.deep.equal(Object.keys(pageItemTemplates).sort((a, b) => a.localeCompare(b)));
        for (const info of infos) {
            expect(['channel', 'none'], info.name).to.include(info.need);
        }
    });

    it('needs a channel when the template searches states below the object', () => {
        expect(byName.get('script.gate')).to.include({ need: 'channel', type: 'text' });
        expect(byName.get('script.gate')?.looksFor).to.deep.equal(['.ACTUAL']);
        expect(byName.get('script.lock')?.looksFor).to.deep.equal(['.ACTUAL', '.SET']);
        expect(byName.get('text.window.isOpen')?.looksFor).to.deep.equal(['sensor.window | sensor.open']);
        expect(byName.get('shutter.deconz.ikea.fyrtur')?.need).to.equal('channel');
        expect(byName.get('text.pirate-weather.favorit')).to.include({ need: 'channel', adapter: 'pirate-weather' });
    });

    it('needs no object when the template brings its own data', () => {
        for (const name of ['text.clock', 'text.wlan', 'button.iconLeftSize', 'button.service.adapter.stopped']) {
            expect(byName.get(name), name).to.include({ need: 'none' });
            expect(byName.get(name)?.looksFor, name).to.deep.equal([]);
        }
    });

    it('no template asks for a single state', () => {
        // every data item either searches below the object (auto / relative) or is internal/const
        expect(infos.filter(i => i.need === 'channel').length).to.be.greaterThan(70);
        expect(infos.filter(i => i.need === 'none').length).to.be.greaterThan(0);
    });
});
