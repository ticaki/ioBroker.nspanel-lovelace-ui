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
    describe('template on the instance of an adapter', () => {
        const item = (state: string, template = 'text.battery.bydhvs'): Parameters<typeof screensaverItemLabel>[0] => ({
            state,
            template,
        });
        it('names the template instead of the number of the instance', () => {
            expect(screensaverItemLabel(item('bydhvs.0')).short).to.equal('battery bydhvs');
            expect(screensaverItemLabel(item('bydhvs.12')).short).to.equal('battery bydhvs');
        });
        it('keeps the other cases', () => {
            expect(screensaverItemLabel(item('bydhvs.0.State')).short).to.equal('State');
            expect(screensaverItemLabel(item('bydhvs.0', '')).short).to.equal('0');
            expect(screensaverItemLabel({ ...item('bydhvs.0'), headline: 'Akku' }).short).to.equal('Akku');
        });
    });

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

    describe('templates with a name of their own', () => {
        const stale = 'alias.0.NSPanel.allgemein.Abfall.event1.INFO';
        const texts: Record<string, string> = {
            screensaver_template_trashNext: 'Nächster Termin',
            screensaver_template_trashAfterNext: 'Übernächster Termin',
        };
        const translate = (key: string): string => texts[key] ?? key;

        it('a state left on the item names nothing, not even with a loaded object name', () => {
            expect(
                screensaverItemLabel({ state: stale, template: 'text.trash.next' }, { [stale]: 'Info' }, translate),
            ).to.deep.equal({ short: 'Nächster Termin', full: 'Nächster Termin' });
            expect(
                screensaverItemLabel(
                    { state: 'alias.0.Abfall.ACTUAL', template: 'text.trash.afterNext' },
                    {},
                    translate,
                ),
            ).to.deep.equal({ short: 'Übernächster Termin', full: 'Übernächster Termin' });
        });
        it('without a state', () => {
            expect(screensaverItemLabel({ state: '', template: 'text.trash.next' }, {}, translate)).to.deep.equal({
                short: 'Nächster Termin',
                full: 'Nächster Termin',
            });
        });
        it('a headline wins, the tooltip adds the name and not the state', () => {
            expect(
                screensaverItemLabel({ state: stale, template: 'text.trash.next', headline: 'Müll' }, {}, translate),
            ).to.deep.equal({ short: 'Müll', full: 'Müll (Nächster Termin)' });
        });
        it('the tooltip adds the page, the short label stays', () => {
            expect(
                screensaverItemLabel(
                    { state: '', template: 'text.trash.next', readOptions: { page: ' kueche ' } },
                    {},
                    translate,
                ),
            ).to.deep.equal({ short: 'Nächster Termin', full: 'Nächster Termin (kueche)' });
            expect(
                screensaverItemLabel(
                    { state: stale, template: 'text.trash.afterNext', headline: 'Müll', readOptions: { page: 5 } },
                    {},
                    translate,
                ),
            ).to.deep.equal({ short: 'Müll', full: 'Müll (Übernächster Termin · 5)' });
        });
        it('the tooltip of a raw item adds the page as well', () => {
            const config = { template: 'text.trash.next', readOptions: { page: 'bad' } };
            for (const raw of [config, { type: 'native', native: config }]) {
                expect(
                    screensaverItemLabel({ state: '', raw: { format: 'native' as const, config: raw } }, {}, translate)
                        .full,
                ).to.equal('{ } Nächster Termin (bad)');
            }
        });
        it('the display name of the adapter counts, for another template too, a state stays its name', () => {
            const templates = [
                {
                    name: 'text.window.isOpen',
                    label: 'label_window',
                    type: 'text',
                    role: '',
                    adapter: '',
                    need: 'channel' as const,
                    looksFor: [],
                    areas: [],
                    options: [],
                },
            ];
            const tr = (key: string): string => (key === 'label_window' ? 'Fenster' : key);
            expect(
                screensaverItemLabel({ state: 'alias.0.W', template: 'text.window.isOpen' }, {}, tr, templates),
            ).to.deep.equal({ short: 'W', full: 'W (Fenster · alias.0.W)' });
            expect(
                screensaverItemLabel({ state: '', template: 'text.window.isOpen' }, {}, tr, templates).short,
            ).to.equal('Fenster');
        });
        it('the adapter offline: templates undefined keeps the name of the trash templates', () => {
            expect(
                screensaverItemLabel({ state: '', template: 'text.trash.next' }, {}, translate, undefined).short,
            ).to.equal('Nächster Termin');
        });
        it('another template with a page option shows no page', () => {
            expect(
                screensaverItemLabel({ state: '', template: 'text.clock', readOptions: { page: 'x' } }, {}, translate)
                    .full,
            ).to.equal('clock');
        });
        it('a raw item drops the state as well', () => {
            const item = {
                state: '',
                raw: { format: 'native' as const, config: { template: 'text.trash.next', dpInit: stale } },
            };
            expect(screensaverItemLabel(item, {}, translate)).to.deep.equal({
                short: '{ } Nächster Termin',
                full: '{ } Nächster Termin',
            });
            expect(screensaverItemObjectId(item)).to.equal('');
        });
        it('without a translator the readable template name, still no state', () => {
            expect(screensaverItemLabel({ state: stale, template: 'text.trash.next' })).to.deep.equal({
                short: 'trash next',
                full: 'trash next',
            });
        });
        it('other templates stay as they are, also with a translator', () => {
            expect(
                screensaverItemLabel({ state: 'alias.0.Window', template: 'text.window.isOpen' }, {}, translate),
            ).to.deep.equal({ short: 'Window', full: 'Window (window isOpen · alias.0.Window)' });
            expect(screensaverItemLabel({ state: '', template: 'text.clock' }, {}, translate)).to.deep.equal({
                short: 'clock',
                full: 'clock',
            });
        });
        it('no object name is loaded for them', () => {
            expect(screensaverItemObjectId({ state: stale, template: 'text.trash.next' })).to.equal('');
            expect(screensaverItemObjectId({ state: stale, template: 'text.trash.afterNext' })).to.equal('');
            expect(
                screensaverEntryObjectIds({
                    bottom: [
                        { state: stale, template: 'text.trash.next' },
                        { state: 'alias.0.Window', template: 'text.window.isOpen' },
                    ],
                } as unknown as ScreensaverEntry),
            ).to.deep.equal(['alias.0.Window']);
        });
    });

    it('object ids: plain ids only, no doubles', () => {
        expect(screensaverItemObjectId({ state: '/^a\\.b/', template: 'text.x' })).to.equal('');
        const entry = {
            favorit: { state: 'alias.0.Window', template: 'text.window.isOpen' },
            alternate: [{ state: 'alias.0.Alt' }],
            left: [undefined, { state: 'alias.0.Window' }],
            bottom: [{ state: '/^pirate-weather\\.0\\./', template: 'text.pirate-weather.favorit' }],
            indicator: [{ state: '', raw: { format: 'script', config: { ScreensaverEntity: 'a.0.b' } } }],
        } as unknown as ScreensaverEntry;
        expect(screensaverEntryObjectIds(entry)).to.deep.equal(['alias.0.Window', 'alias.0.Alt', 'a.0.b']);
        // entries saved before `alternate` became a list hold one item object
        expect(
            screensaverEntryObjectIds({ ...entry, alternate: { state: 'alias.0.Old' } } as unknown as ScreensaverEntry),
        ).to.deep.equal(['alias.0.Window', 'alias.0.Old', 'a.0.b']);
    });
});
