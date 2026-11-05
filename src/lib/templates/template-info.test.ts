import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import { screensaverAreas } from '../types/adminShareConfig';
import { pageItemTemplateInfos } from './template-info';
import { pageItemTemplates } from './templateArray';

describe('lib/templates - template info (screensaver item dialog)', () => {
    const infos = pageItemTemplateInfos();
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

    it('offers text and button templates on every place, other types on none', () => {
        expect(byName.get('text.clock')?.areas).to.deep.equal([...screensaverAreas]);
        expect(byName.get('button.iconLeftSize')?.areas).to.deep.equal([...screensaverAreas]);
        for (const info of infos) {
            if (info.type !== 'text' && info.type !== 'button') {
                expect(info.areas, info.name).to.deep.equal([]);
            }
        }
        expect(infos.filter(i => i.type !== 'text' && i.type !== 'button').length).to.be.greaterThan(0);
    });

    it('offers the favorit templates on favorit and alternate only', () => {
        const favorit = infos.filter(i => /^text\..+\.favorit$/.test(i.name));
        expect(favorit.map(i => i.name)).to.deep.equal([
            'text.accuweather.favorit',
            'text.brightsky.favorit',
            'text.openweathermap.favorit',
            'text.pirate-weather.favorit',
        ]);
        for (const info of favorit) {
            expect(info.areas, info.name).to.deep.equal(['favorit', 'alternate']);
        }
        expect(infos.filter(i => i.areas.length > 0 && i.areas.length < screensaverAreas.length)).to.have.length(
            favorit.length,
        );
    });

    it('reports the options of a template', () => {
        expect(byName.get('text.battery.bydhvs')?.options).to.deep.equal([
            { key: 'min', type: 'number', label: 'screensaver_item_option_socMin' },
            { key: 'max', type: 'number', label: 'screensaver_item_option_socMax' },
        ]);
        expect(byName.get('text.battery')?.options).to.deep.equal([]);
    });

    it('has the label of every option in all translations', () => {
        for (const language of fs.readdirSync(path.join(__dirname, '../../../admin/i18n'))) {
            const translations = JSON.parse(
                fs.readFileSync(path.join(__dirname, `../../../admin/i18n/${language}/translations.json`), 'utf8'),
            );
            for (const info of infos) {
                for (const option of info.options) {
                    expect(translations, `${language}: ${option.label}`).to.have.property(option.label);
                }
            }
        }
    });

    it('no template asks for a single state', () => {
        // every data item either searches below the object (auto / relative) or is internal/const
        expect(infos.filter(i => i.need === 'channel').length).to.be.greaterThan(70);
        expect(infos.filter(i => i.need === 'none').length).to.be.greaterThan(0);
    });
});
