import { expect } from 'chai';
import type { ScreensaverEntry } from '../../src/lib/types/adminShareConfig';
import {
    commonNameText,
    isRegexId,
    readableIdPattern,
    readableTemplateName,
    screensaverEntryObjectIds,
    screensaverItemLabel,
    screensaverItemObjectId,
} from './screensaverItemLabel';

describe('screensaverItemLabel', () => {
    describe('readableIdPattern', () => {
        it('keeps a plain id', () => {
            expect(readableIdPattern(' alias.0.Window ')).to.equal('alias.0.Window');
        });
        it('turns a regexp into its literal prefix', () => {
            expect(readableIdPattern('/^pirate-weather\\.0\\.weather\\.currently\\./')).to.equal(
                'pirate-weather.0.weather.currently',
            );
            expect(readableIdPattern('/^pirate-weather\\.0\\.weather\\.daily\\.00.+/')).to.equal(
                'pirate-weather.0.weather.daily.00',
            );
        });
        it('handles flags, anchors, doubled escapes, groups and leading wildcards', () => {
            expect(readableIdPattern('/^alias\\.0\\.Window$/i')).to.equal('alias.0.Window');
            expect(readableIdPattern('/^alias\\\\.0\\\\.Window/')).to.equal('alias.0.Window');
            expect(readableIdPattern('/^alias\\.0\\.(Fenster|Tuer)/')).to.equal('alias.0');
            expect(readableIdPattern('/.*\\.Window$/')).to.equal('Window');
            expect(readableIdPattern('/^\\d+/')).to.equal('');
        });
    });

    it('isRegexId', () => {
        expect(isRegexId('/^a\\.b/')).to.equal(true);
        expect(isRegexId('alias.0.Window')).to.equal(false);
        expect(isRegexId('/')).to.equal(false);
    });

    it('readableTemplateName drops the type', () => {
        expect(readableTemplateName('text.pirate-weather.favorit')).to.equal('pirate-weather favorit');
        expect(readableTemplateName('text.window.isOpen')).to.equal('window isOpen');
        expect(readableTemplateName('text.clock')).to.equal('clock');
        expect(readableTemplateName('clock')).to.equal('clock');
    });

    it('commonNameText', () => {
        expect(commonNameText('Fenster', 'de')).to.equal('Fenster');
        expect(commonNameText({ en: 'Window', de: 'Fenster' }, 'de')).to.equal('Fenster');
        expect(commonNameText({ en: 'Window', de: 'Fenster' }, 'fr')).to.equal('Window');
        expect(commonNameText(undefined, 'de')).to.equal('');
    });

    describe('labels', () => {
        it('template with a regexp: template name, prefix in the tooltip', () => {
            expect(
                screensaverItemLabel({
                    state: '/^pirate-weather\\.0\\.weather\\.currently\\./',
                    template: 'text.pirate-weather.favorit',
                }),
            ).to.deep.equal({
                short: 'pirate-weather favorit',
                full: 'pirate-weather favorit (pirate-weather.0.weather.currently)',
            });
            expect(
                screensaverItemLabel({
                    state: '/^pirate-weather\\.0\\.weather\\.daily\\.00.+/',
                    template: 'text.pirate-weather.sunriseset',
                }),
            ).to.deep.equal({
                short: 'pirate-weather sunriseset',
                full: 'pirate-weather sunriseset (pirate-weather.0.weather.daily.00)',
            });
        });
        it('template with an object: object name, else last part of the id', () => {
            const item = { state: 'alias.0.Window', template: 'text.window.isOpen' };
            expect(screensaverItemLabel(item)).to.deep.equal({
                short: 'Window',
                full: 'Window (window isOpen · alias.0.Window)',
            });
            expect(screensaverItemLabel(item, { 'alias.0.Window': 'Fenster Küche' })).to.deep.equal({
                short: 'Fenster Küche',
                full: 'Fenster Küche (window isOpen · alias.0.Window)',
            });
        });
        it('template without an object', () => {
            expect(screensaverItemLabel({ state: '', template: 'text.clock' })).to.deep.equal({
                short: 'clock',
                full: 'clock',
            });
        });
        it('headline wins', () => {
            expect(
                screensaverItemLabel({ state: 'hm-rpc.0.ABC.1.TEMPERATURE', headline: 'Außen' }, { x: 'y' }),
            ).to.deep.equal({ short: 'Außen', full: 'Außen (hm-rpc.0.ABC.1.TEMPERATURE)' });
        });
        it('plain state', () => {
            expect(screensaverItemLabel({ state: 'hm-rpc.0.ABC.1.TEMPERATURE' }).short).to.equal('TEMPERATURE');
            expect(screensaverItemLabel({ state: '' })).to.deep.equal({ short: '?', full: '?' });
        });
        it('raw items', () => {
            expect(
                screensaverItemLabel({
                    state: '',
                    raw: {
                        format: 'native',
                        config: {
                            type: 'template',
                            template: 'text.pirate-weather.favorit',
                            dpInit: '/^pirate-weather\\.0\\.weather\\.currently\\./',
                        },
                    },
                }),
            ).to.deep.equal({
                short: '{ } pirate-weather favorit',
                full: '{ } pirate-weather favorit (pirate-weather.0.weather.currently)',
            });
            expect(
                screensaverItemLabel({
                    state: '',
                    raw: { format: 'script', config: { native: { dpInit: '/^alias\\.0\\.Window\\..+/' } } },
                }),
            ).to.deep.equal({ short: '{ } Window', full: '{ } Window (alias.0.Window)' });
            expect(
                screensaverItemLabel({
                    state: '',
                    raw: {
                        format: 'script',
                        config: { ScreensaverEntity: 'hm-rpc.0.ABC.1.TEMPERATURE', ScreensaverEntityText: 'Außen' },
                    },
                }).short,
            ).to.equal('{ } Außen');
            expect(screensaverItemLabel({ state: '', raw: { format: 'script', config: {} } })).to.deep.equal({
                short: '{ }',
                full: '{ }',
            });
        });
    });

    it('object ids: plain ids only, no doubles', () => {
        expect(screensaverItemObjectId({ state: '/^a\\.b/', template: 'text.x' })).to.equal('');
        const entry = {
            favorit: { state: 'alias.0.Window', template: 'text.window.isOpen' },
            left: [undefined, { state: 'alias.0.Window' }],
            bottom: [{ state: '/^pirate-weather\\.0\\./', template: 'text.pirate-weather.favorit' }],
            indicator: [{ state: '', raw: { format: 'script', config: { ScreensaverEntity: 'a.0.b' } } }],
        } as unknown as ScreensaverEntry;
        expect(screensaverEntryObjectIds(entry)).to.deep.equal(['alias.0.Window', 'a.0.b']);
    });
});
