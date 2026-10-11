import { expect } from 'chai';
import { emptyScreensaverEntry, type ScreensaverEntry } from '../types/adminShareConfig';
import {
    adminScreensaverPageId,
    applyScreensaverEntry,
    buildScreensaverScriptConfig,
    findScreensaverEntry,
    hexToScriptRGB,
    isScreensaverPage,
    objectNameOf,
    screensaverHeadlineStates,
    screensaverItemToScript,
    screensaverMrIconToScript,
} from './admin-screensaver';
import type * as pages from '../types/pages';

describe('lib/configuration - admin screensaver (entry -> script configuration)', () => {
    it('converts the admin colors to the RGB object of the script', () => {
        expect(hexToScriptRGB('#ff2600')).to.deep.equal({ red: 255, green: 38, blue: 0 });
        expect(hexToScriptRGB('#00f900')).to.deep.equal({ red: 0, green: 249, blue: 0 });
        expect(hexToScriptRGB('')).to.equal(undefined);
        expect(hexToScriptRGB('red')).to.equal(undefined);
        expect(hexToScriptRGB(undefined)).to.equal(undefined);
    });

    it('reads the object name in the adapter language', () => {
        expect(objectNameOf({ common: { name: 'Küche' } } as unknown as ioBroker.Object, 'de')).to.equal('Küche');
        expect(
            objectNameOf({ common: { name: { en: 'Kitchen', de: 'Küche' } } } as unknown as ioBroker.Object, 'de'),
        ).to.equal('Küche');
        expect(objectNameOf({ common: { name: { en: 'Kitchen' } } } as unknown as ioBroker.Object, 'fr')).to.equal(
            'Kitchen',
        );
        expect(objectNameOf(null, 'de')).to.equal('');
    });

    it('turns a state item into the script element with the fields of the item dialog', () => {
        const element = screensaverItemToScript(
            {
                state: 'alias.0.Temp.ACTUAL',
                headline: 'Außen',
                iconOn: 'thermometer',
                colorOn: '#ff2600',
                colorScale: { mode: 'triGrad', val_min: 0, val_max: 100, val_best: 50 },
                unit: '°C',
                factor: 1,
                decimals: 1,
                textOn: 'an',
                textOff: 'aus',
                enabled: '0_userdata.0.show',
                visibleCondition: 'val > 0',
                iconSelect: [{ value: 10, icon: 'snowflake' }],
            },
            'bottom',
        );
        expect(element).to.include({
            type: 'script',
            ScreensaverEntity: 'alias.0.Temp.ACTUAL',
            ScreensaverEntityText: 'Außen',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityIconOff: null,
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityOnText: 'an',
            ScreensaverEntityOffText: 'aus',
            ScreensaverEntityEnabled: '0_userdata.0.show',
            ScreensaverEntityVisibleCondition: 'val > 0',
        });
        const script = element as Extract<ScriptConfig.ScreenSaverElement, { type: 'script' }>;
        expect(script.ScreensaverEntityOnColor).to.deep.equal({ red: 255, green: 38, blue: 0 });
        expect(script.ScreensaverEntityOffColor).to.equal(undefined);
        expect(script.ScreensaverEntityIconColor).to.deep.equal({
            mode: 'triGrad',
            val_min: 0,
            val_max: 100,
            val_best: 50,
        });
        expect(script.ScreensaverEntityIconSelect).to.deep.equal([{ icon: 'snowflake', value: 10 }]);
        expect('ScreensaverEntityButton' in script).to.equal(false);
    });

    it('uses the name of the state when the headline is empty and leaves optional fields away', () => {
        const element = screensaverItemToScript({ state: 'alias.0.Fenster.ACTUAL' }, 'bottom', 'Fenster');
        expect(element).to.deep.equal({
            type: 'script',
            ScreensaverEntity: 'alias.0.Fenster.ACTUAL',
            ScreensaverEntityText: 'Fenster',
            ScreensaverEntityIconOn: null,
            ScreensaverEntityIconOff: null,
            ScreensaverEntityOnText: null,
            ScreensaverEntityOffText: null,
        });
    });

    it('maps the indicator actions to button, switch and page - on the indicator only', () => {
        const button = screensaverItemToScript({ state: 'a', action: { kind: 'button', state: 'b' } }, 'indicator');
        expect(button).to.include({ ScreensaverEntityButton: 'b' });
        const sw = screensaverItemToScript({ state: 'a', action: { kind: 'switch', state: 's' } }, 'indicator');
        expect(sw).to.include({ ScreensaverEntitySwitch: 's' });
        const nav = screensaverItemToScript({ state: 'a', action: { kind: 'navigate', page: 'Klima' } }, 'indicator');
        expect(nav).to.include({ ScreensaverEntityNaviToPage: 'Klima' });
        const bottom = screensaverItemToScript({ state: 'a', action: { kind: 'button', state: 'b' } }, 'bottom');
        expect('ScreensaverEntityButton' in bottom).to.equal(false);
    });

    it('turns a template item into the template element with the object as dpInit', () => {
        expect(
            screensaverItemToScript(
                { state: 'alias.0.Gate', template: 'script.gate', enabled: 'x', visibleCondition: 'val' },
                'bottom',
            ),
        ).to.deep.equal({
            type: 'template',
            template: 'script.gate',
            dpInit: 'alias.0.Gate',
            modeScr: 'bottom',
            enabled: 'x',
            visibleCondition: 'val',
        });
        expect(screensaverItemToScript({ state: '', template: 'text.clock' }, 'left')).to.deep.equal({
            type: 'template',
            template: 'text.clock',
            dpInit: '',
            modeScr: 'left',
        });
    });

    it('converts the MR icons and drops an icon without state and value', () => {
        expect(screensaverMrIconToScript(undefined)).to.equal(undefined);
        expect(screensaverMrIconToScript({ iconOn: 'lightbulb' })).to.equal(undefined);
        const element = screensaverMrIconToScript({
            entity: 'alias.0.Licht.ACTUAL',
            iconOn: 'lightbulb',
            iconOff: 'lightbulb-outline',
            onColor: '#ffff00',
            value: 'alias.0.Licht.LEVEL',
            valueDecimals: 0,
            valueUnit: '%',
            iconSelect: [{ value: '1', icon: 'a' }],
        }) as Record<string, unknown>;
        expect(element).to.include({
            type: 'script',
            ScreensaverEntity: 'alias.0.Licht.ACTUAL',
            ScreensaverEntityIconOn: 'lightbulb',
            ScreensaverEntityIconOff: 'lightbulb-outline',
            ScreensaverEntityValue: 'alias.0.Licht.LEVEL',
            ScreensaverEntityValueDecimalPlace: 0,
            ScreensaverEntityValueUnit: '%',
            ScreensaverEntityOffColor: undefined,
        });
        expect(element.ScreensaverEntityOnColor).to.deep.equal({ red: 255, green: 255, blue: 0 });
        expect(element.ScreensaverEntityIconSelect).to.deep.equal({ 1: 'a' });
    });

    it('builds the script configuration with gaps kept on left and indicator, bottom compacted', () => {
        const entry: ScreensaverEntry = {
            ...emptyScreensaverEntry('Wohnzimmer', 'advanced'),
            panels: ['NSPanel_1'],
            favorit: { state: 'f' },
            left: [undefined, { state: 'l2' }],
            bottom: [{ state: 'b1' }, undefined, { state: 'b3' }],
            indicator: [{ state: 'i1', action: { kind: 'switch', state: 'i1s' } }, undefined],
            mrIcon1: { entity: 'm1' },
            weatherEntity: 'pirate-weather.0',
            weatherAddDefaultItems: { sunriseSet: true },
            screensaverSwipe: true,
        };
        const config = buildScreensaverScriptConfig(entry, 'NSPanel_1', { b1: 'Unten eins' });
        expect(config.panelTopic).to.equal('NSPanel_1');
        expect(config.scriptName).to.equal('admin.screensaver.Wohnzimmer');
        expect(config.weatherEntity).to.equal('pirate-weather.0');
        expect(config.weatherAddDefaultItems).to.deep.equal({ sunriseSet: true });
        expect(config.favoritScreensaverEntity).to.have.length(1);
        expect(config.alternateScreensaverEntity).to.deep.equal([]);
        expect(config.leftScreensaverEntity).to.have.length(2);
        expect(config.leftScreensaverEntity[0]).to.equal(undefined);
        expect(
            config.bottomScreensaverEntity.map(e => (e as { ScreensaverEntity: string }).ScreensaverEntity),
        ).to.deep.equal(['b1', 'b3']);
        expect((config.bottomScreensaverEntity[0] as { ScreensaverEntityText: string }).ScreensaverEntityText).to.equal(
            'Unten eins',
        );
        expect(config.indicatorScreensaverEntity).to.have.length(2);
        expect(config.indicatorScreensaverEntity[0]).to.include({ ScreensaverEntitySwitch: 'i1s' });
        expect(config.mrIcon1ScreensaverEntity).to.include({ ScreensaverEntity: 'm1' });
        expect(config.mrIcon2ScreensaverEntity).to.equal(undefined);
        expect(config.notifyScreensaverEntity).to.equal(undefined);
        expect(config.advancedOptions).to.deep.equal({ screensaverSwipe: true, screensaverIndicatorButtons: false });
        expect(config.pages).to.deep.equal([]);
    });

    it('lists the states whose name replaces a missing headline', () => {
        const entry: ScreensaverEntry = {
            ...emptyScreensaverEntry('x', 'standard'),
            bottom: [{ state: 'a' }, { state: 'b', headline: 'B' }, { state: 'c', template: 't' }, { state: 'a' }],
            left: [{ state: 'd' }],
        };
        expect(screensaverHeadlineStates(entry)).to.deep.equal(['d', 'a']);
    });

    it('picks the first entry of a panel and names the others', () => {
        const entries: ScreensaverEntry[] = [
            { ...emptyScreensaverEntry('A', 'standard'), panels: ['p1'] },
            { ...emptyScreensaverEntry('B', 'standard'), panels: ['p2', 'p1'] },
            { ...emptyScreensaverEntry('C', 'standard'), panels: ['p1'] },
        ];
        expect(findScreensaverEntry(entries, 'p1').entry?.name).to.equal('A');
        expect(findScreensaverEntry(entries, 'p1').others).to.deep.equal(['B', 'C']);
        expect(findScreensaverEntry(entries, 'p2').entry?.name).to.equal('B');
        expect(findScreensaverEntry(entries, 'p3').entry).to.equal(undefined);
        expect(findScreensaverEntry(undefined, 'p1').entry).to.equal(undefined);
    });

    it('applies version, rotation, swipe, indicator buttons, id and the formats onto the built page', () => {
        const page = {
            dpInit: '',
            alwaysOn: 'none',
            uniqueID: 'scr',
            config: {
                card: 'screensaver',
                mode: 'standard',
                rotationTime: 0,
                model: 'eu',
                data: undefined,
                screensaverIndicatorButtons: false,
                screensaverSwipe: false,
            },
            pageItems: [
                {
                    modeScr: 'time',
                    data: {
                        entity2: {
                            dateFormat: {
                                type: 'const',
                                constVal: { local: 'de', format: { hour: '2-digit', minute: '2-digit' } },
                            },
                        },
                    },
                },
                {
                    modeScr: 'date',
                    data: {
                        entity2: {
                            dateFormat: {
                                type: 'const',
                                constVal: {
                                    local: 'de',
                                    format: { weekday: 'short', month: '2-digit', year: '2-digit', day: 'numeric' },
                                },
                            },
                        },
                    },
                },
                { modeScr: 'bottom', data: { entity1: {} } },
            ],
        } as unknown as pages.PageBase;
        const entry: ScreensaverEntry = {
            ...emptyScreensaverEntry('Flur', 'easyview'),
            rotationTime: 10,
            screensaverIndicatorButtons: true,
            clockFormat: '12h',
            weekdayFormat: 'long',
            yearFormat: 'numeric',
        };
        applyScreensaverEntry(page, entry);
        expect(page.uniqueID).to.equal(adminScreensaverPageId);
        expect(page.config).to.include({
            card: 'screensaver3',
            mode: 'easyview',
            rotationTime: 10,
            screensaverSwipe: false,
            screensaverIndicatorButtons: true,
        });
        const items = page.pageItems as unknown as {
            data: { entity2: { dateFormat: { constVal: { format: Intl.DateTimeFormatOptions } } } };
        }[];
        expect(items[0].data.entity2.dateFormat.constVal.format).to.deep.equal({
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        expect(items[1].data.entity2.dateFormat.constVal.format).to.deep.equal({
            weekday: 'long',
            month: '2-digit',
            year: 'numeric',
            day: 'numeric',
        });
    });

    it('leaves the global formats alone when the entry has none and knows the screensaver cards', () => {
        const page = {
            uniqueID: 'scr',
            config: { card: 'screensaver', mode: 'standard', rotationTime: 0 },
            pageItems: [
                {
                    modeScr: 'time',
                    data: { entity2: { dateFormat: { constVal: { format: { hour: '2-digit', minute: '2-digit' } } } } },
                },
            ],
        } as unknown as pages.PageBase;
        applyScreensaverEntry(page, { ...emptyScreensaverEntry('x', 'advanced'), rotationTime: -5 });
        expect(page.config).to.include({ card: 'screensaver2', mode: 'advanced', rotationTime: 0 });
        const items = page.pageItems as unknown as {
            data: { entity2: { dateFormat: { constVal: { format: Intl.DateTimeFormatOptions } } } };
        }[];
        expect(items[0].data.entity2.dateFormat.constVal.format).to.deep.equal({ hour: '2-digit', minute: '2-digit' });
        expect(isScreensaverPage({ config: { card: 'screensaver2' } })).to.equal(true);
        expect(isScreensaverPage({ config: { card: 'cardGrid' } })).to.equal(false);
        expect(isScreensaverPage(undefined)).to.equal(false);
    });
});
