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

    it('names the constant icon font of a template, also from the base template', () => {
        expect(byName.get('text.battery')?.iconTextSize).to.equal(2);
        expect(byName.get('text.battery.bydhvs')?.iconTextSize).to.equal(2);
        expect(byName.get('text.window.isOpen')?.iconTextSize).to.equal(undefined);
        const infos = pageItemTemplateInfos({
            base: { type: 'text', role: '', adapter: '', data: { icon: { textSize: { type: 'const', constVal: 3 } } } },
            child: { type: 'text', role: '', adapter: '', template: 'base', data: {} },
        } as any);
        expect(infos.map(i => i.iconTextSize)).to.deep.equal([3, 3]);
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
            favorit.length + 2, // the two trash templates, see below
        );
    });

    it('offers the trash templates on bottom only, without an object, without an option field', () => {
        for (const name of ['text.trash.next', 'text.trash.afterNext']) {
            expect(byName.get(name), name).to.include({ need: 'none', type: 'text', adapter: '' });
            expect(byName.get(name)?.looksFor, name).to.deep.equal([]);
            expect(byName.get(name)?.areas, name).to.deep.equal(['bottom']);
            expect(byName.get(name)?.options, name).to.deep.equal([]); // the admin lists one entry per trash page
        }
    });

    it('gives only the trash templates a display name', () => {
        expect(infos.filter(i => i.label !== undefined).map(i => [i.name, i.label])).to.have.deep.members([
            ['text.trash.next', 'screensaver_template_trashNext'],
            ['text.trash.afterNext', 'screensaver_template_trashAfterNext'],
        ]);
        expect(byName.get('text.clock')).to.not.have.property('label');
    });

    it('reports the options of a template', () => {
        expect(byName.get('text.battery.bydhvs')?.options).to.deep.equal([
            { key: 'min', type: 'number', label: 'screensaver_item_option_socMin' },
            { key: 'max', type: 'number', label: 'screensaver_item_option_socMax' },
        ]);
        expect(byName.get('text.battery')?.options).to.deep.equal([]);
    });

    it('has the label of every option and template in all translations', () => {
        for (const language of fs.readdirSync(path.join(__dirname, '../../../admin/i18n'))) {
            const translations = JSON.parse(
                fs.readFileSync(path.join(__dirname, `../../../admin/i18n/${language}/translations.json`), 'utf8'),
            );
            for (const info of infos) {
                for (const option of info.options) {
                    expect(translations, `${language}: ${option.label}`).to.have.property(option.label);
                }
                if (info.label) {
                    expect(translations, `${language}: ${info.label}`).to.have.property(info.label);
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
