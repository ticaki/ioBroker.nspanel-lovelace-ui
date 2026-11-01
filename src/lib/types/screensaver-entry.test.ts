import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import {
    conditionExpressionText,
    conditionValueText,
    emptyScreensaverEntry,
    rawItemCondition,
    screensaverItemCondition,
    formatEntryNumber,
    screensaverNotifyLines,
    screensaverAreas,
    screensaverCardOfMode,
    screensaverItemFields,
    screensaverItemSource,
    screensaverMaxEntries,
    screensaverModes,
    screensaverSlotLimits,
    screensaverWeatherAdapterOf,
    screensaverWeatherAdapters,
    screensaverWeatherItemKeys,
    screensaverWeatherItemsOfAdapter,
    screensaverWeatherItemsOn,
} from './adminShareConfig';
import { ScreenSaverConst, weatherEntities } from '../const/definition';
import type { NSpanelModel, ScreensaverModeType } from './types';
import type {
    ScreensaverItemConfig,
    ScreensaverMode,
    ScreensaverPanelModel,
    ScreensaverWeatherItemKey,
} from './adminShareConfig';
import { pageItemTemplates } from '../templates/templateArray';

// adminShareConfig.ts must not import types.ts (admin bundle) - these assignments fail to compile
// as soon as the literal unions drift apart in either direction.
const modeToAdapter: ScreensaverModeType = 'standard';
const modeToAdmin: ScreensaverMode = 'standard';
const modelToAdapter: NSpanelModel = 'eu';
const modelToAdmin: ScreensaverPanelModel = 'eu';
const weatherKeyAdmin: ScreensaverWeatherItemKey = screensaverWeatherItemKeys[0];
const weatherKeyToAdapter: keyof ScriptConfig.WeatherAddDefaultItemsJson = weatherKeyAdmin;
const weatherKeyToAdmin: ScreensaverWeatherItemKey = weatherKeyToAdapter;
void [modeToAdapter, modeToAdmin, modelToAdapter, modelToAdmin, weatherKeyToAdapter, weatherKeyToAdmin];

// a template item of the admin is a ScreenSaverElement of type template: `state` is the `dpInit`
const templateItem: ScreensaverItemConfig = { state: 'alias.0.window', template: 'text.window.isOpen' };
const templateToScript: ScriptConfig.ScreenSaverElement = {
    type: 'template',
    template: templateItem.template ?? '',
    dpInit: templateItem.state,
    modeScr: 'bottom',
    enabled: templateItem.enabled,
    visibleCondition: templateItem.visibleCondition,
};
void templateToScript;

describe('lib/types - screensaver entry (admin tab)', () => {
    it('keeps the slot limits equal to ScreenSaverConst of the adapter', () => {
        // The admin bundle must not import definition.ts (it pulls the adapter constants into the
        // browser), so the limits are copied - this test is the guard that both stay the same.
        for (const mode of screensaverModes) {
            for (const area of [...screensaverAreas, 'mricon'] as const) {
                expect(screensaverSlotLimits[mode][area], `${mode}/${area}`).to.deep.equal(
                    ScreenSaverConst[mode][area].maxEntries,
                );
            }
        }
    });

    it('falls back to the eu value for models without an own limit', () => {
        expect(screensaverMaxEntries('easyview', 'bottom', 'us-p')).to.equal(4);
        expect(screensaverMaxEntries('easyview', 'bottom', 'us-l')).to.equal(3);
        expect(screensaverMaxEntries('advanced', 'bottom', 'us-p')).to.equal(6);
        expect(screensaverMaxEntries('standard', 'left')).to.equal(0);
    });

    it('maps the four versions to the three cards like screensaver.ts', () => {
        expect(screensaverCardOfMode('standard')).to.equal('screensaver');
        expect(screensaverCardOfMode('alternate')).to.equal('screensaver');
        expect(screensaverCardOfMode('advanced')).to.equal('screensaver2');
        expect(screensaverCardOfMode('easyview')).to.equal('screensaver3');
    });

    it('creates an entry without panels and items', () => {
        const entry = emptyScreensaverEntry('Wohnzimmer');
        expect(entry.name).to.equal('Wohnzimmer');
        expect(entry.mode).to.equal('standard');
        expect(entry.panels).to.deep.equal([]);
        expect(entry.left).to.deep.equal([]);
        expect(entry.bottom).to.deep.equal([]);
        expect(entry.indicator).to.deep.equal([]);
        expect(entry.favorit).to.equal(undefined);
        expect(entry.rotationTime).to.equal(0);
        expect(emptyScreensaverEntry('x', 'advanced').mode).to.equal('advanced');
    });

    it('shows the fields of a place the panel uses there', () => {
        expect(screensaverItemFields('bottom')).to.deep.equal({
            headline: true,
            value: true,
            text: true,
            action: false,
        });
        expect(screensaverItemFields('left').headline).to.equal(false);
        expect(screensaverItemFields('favorit').value).to.equal(true);
        expect(screensaverItemFields('indicator')).to.deep.equal({
            headline: false,
            value: false,
            text: false,
            action: true,
        });
    });

    it('returns a fresh object on every call', () => {
        const a = emptyScreensaverEntry('a');
        const b = emptyScreensaverEntry('a');
        expect(a).to.not.equal(b);
        expect(a.bottom).to.not.equal(b.bottom);
    });
});

describe('lib/types - screensaver item source (admin tab)', () => {
    it('tells a template item from a state item', () => {
        expect(screensaverItemSource(undefined)).to.equal('state');
        const stateItem: ScreensaverItemConfig = { state: 'x' };
        expect(screensaverItemSource(stateItem)).to.equal('state');
        expect(screensaverItemSource({ template: '' })).to.equal('state');
        expect(screensaverItemSource({ template: 'text.window.isOpen' })).to.equal('template');
    });

    it('can group every page item template by the part before the first dot (item dialog)', () => {
        const names = Object.keys(pageItemTemplates);
        expect(names.length).to.be.greaterThan(0);
        for (const name of names) {
            expect(name, name).to.match(/^[A-Za-z]+\.[A-Za-z0-9_.-]+$/);
        }
    });
});

describe('lib/types - screensaver item condition (admin tab marker)', () => {
    it('reads enabled and visibleCondition of a normal item', () => {
        expect(screensaverItemCondition(undefined)).to.equal(undefined);
        expect(screensaverItemCondition({ state: 'a.0.x' })).to.equal(undefined);
        expect(screensaverItemCondition({ state: 'a.0.x', enabled: ' ', visibleCondition: '' })).to.equal(undefined);
        expect(screensaverItemCondition({ state: 'a.0.x', enabled: 'a.0.on' })).to.deep.equal({ enabled: 'a.0.on' });
        expect(screensaverItemCondition({ state: 'a.0.x', visibleCondition: 'val > 3' })).to.deep.equal({
            visibleCondition: 'val > 3',
        });
    });

    it('takes the raw data alone for a raw item', () => {
        const item: ScreensaverItemConfig = {
            state: 'a.0.x',
            enabled: 'ignored.0.x',
            raw: {
                format: 'script',
                config: {
                    type: 'template',
                    template: 'text.sainlogic.windarrow',
                    dpInit: 'sainlogic.0',
                    modeScr: 'bottom',
                    readOptions: { a: 1 },
                    enabled: 'sainlogic.0.weather.current.windspeed',
                    visibleCondition: 'parseFloat(val) >= 6',
                },
            },
        };
        expect(screensaverItemCondition(item)).to.deep.equal({
            enabled: 'sainlogic.0.weather.current.windspeed',
            visibleCondition: 'parseFloat(val) >= 6',
        });
        expect(screensaverItemCondition({ state: 'a', enabled: 'x', raw: { format: 'script', config: {} } })).to.equal(
            undefined,
        );
    });

    it('searches nested objects and arrays of the raw data', () => {
        expect(
            rawItemCondition({ native: { data: { entity1: { ScreensaverEntityEnabled: 'a.0.on' } } } }),
        ).to.deep.equal({ enabled: 'a.0.on' });
        expect(rawItemCondition({ list: [{}, { ScreensaverEntityVisibleCondition: 'val' }] })).to.deep.equal({
            visibleCondition: 'val',
        });
        // an object value: named by dp / id, else short JSON
        expect(rawItemCondition({ data: { enabled: { type: 'triggered', dp: 'a.0.dp' } } })).to.deep.equal({
            enabled: 'a.0.dp',
        });
        expect(rawItemCondition({ enabled: { type: 'unknown', x: 1 } })).to.deep.equal({
            enabled: '{"type":"unknown","x":1}',
        });
        // empty values do not count, the search goes on
        expect(rawItemCondition({ enabled: '', native: { enabled: 'b.0.on' } })).to.deep.equal({ enabled: 'b.0.on' });
        expect(rawItemCondition({ enabled: true, visibleCondition: {} })).to.equal(undefined);
        expect(rawItemCondition('text')).to.equal(undefined);
        expect(rawItemCondition(null)).to.equal(undefined);
    });

    it('reads the runtime forms of the config manager', () => {
        // script template: enabled as array of states
        expect(
            rawItemCondition({
                type: 'template',
                template: 'text.x',
                enabled: ['a.0.on', ' b.0.on '],
                visibleCondition: 'val > 3',
            }),
        ).to.deep.equal({ enabled: 'a.0.on, b.0.on', visibleCondition: 'val > 3' });
        expect(rawItemCondition({ type: 'template', enabled: [] })).to.equal(undefined);
        // script element on the top level
        expect(
            rawItemCondition({
                ScreensaverEntity: 'a.0.x',
                ScreensaverEntityEnabled: 'a.0.on',
                ScreensaverEntityVisibleCondition: 'parseFloat(val) >= 6',
            }),
        ).to.deep.equal({ enabled: 'a.0.on', visibleCondition: 'parseFloat(val) >= 6' });
        // native item: DataItem with read
        expect(
            rawItemCondition({
                data: { enabled: { type: 'triggered', dp: 'x.0.y', read: '\n return parseFloat(val) >= 6;\n' } },
            }),
        ).to.deep.equal({ enabled: 'x.0.y', visibleCondition: 'parseFloat(val) >= 6' });
        // native item: constants
        expect(rawItemCondition({ data: { enabled: { type: 'const', constVal: true } } })).to.equal(undefined);
        expect(rawItemCondition({ data: { enabled: { type: 'const' } } })).to.equal(undefined);
        expect(rawItemCondition({ data: { enabled: { type: 'const', constVal: '' } } })).to.equal(undefined);
        expect(rawItemCondition({ data: { enabled: { type: 'const', constVal: false } } })).to.deep.equal({
            enabled: 'false',
        });
        // native item: array of DataItems, a multi-line read is kept (whitespace joined)
        expect(
            rawItemCondition({
                data: {
                    enabled: [
                        { type: 'triggered', dp: 'a.0.x', read: 'return val > 1;' },
                        { type: 'state', dp: 'b.0.y', read: '\n val = Number(val);\n return val < 5;\n' },
                    ],
                },
            }),
        ).to.deep.equal({
            enabled: 'a.0.x, b.0.y',
            visibleCondition: 'val > 1, val = Number(val); return val < 5;',
        });
    });

    it('stops at cycles', () => {
        const a: Record<string, unknown> = {};
        a.self = a;
        expect(rawItemCondition(a)).to.equal(undefined);
    });

    it('turns condition values into text', () => {
        expect(conditionValueText(' a ')).to.equal('a');
        expect(conditionValueText(false)).to.equal('false');
        expect(conditionValueText(true)).to.equal('');
        expect(conditionValueText(0)).to.equal('0');
        expect(conditionValueText({ id: 'x.0.y' })).to.equal('x.0.y');
        expect(conditionValueText({ long: 'x'.repeat(200) }).length).to.equal(80);
        expect(conditionValueText(['a', { dp: 'b' }, { type: 'const', constVal: true }])).to.equal('a, b');
        expect(conditionExpressionText('  return  a ;  ')).to.equal('a');
        expect(conditionExpressionText('x'.repeat(200)).length).to.equal(80);
        expect(conditionValueText(undefined)).to.equal('');
    });
});

describe('lib/types - screensaver weather (admin tab)', () => {
    it('knows the weather adapters of definition.ts', () => {
        expect([...screensaverWeatherAdapters].sort()).to.deep.equal([...weatherEntities].sort());
        expect(screensaverWeatherAdapterOf('pirate-weather.1.weather.')).to.equal('pirate-weather');
        expect(screensaverWeatherAdapterOf('daswetter.0')).to.equal(undefined);
        expect(screensaverWeatherAdapterOf('')).to.equal(undefined);
        expect(screensaverWeatherAdapterOf(undefined)).to.equal(undefined);
    });

    it('offers per adapter exactly the items getScreensaverConfig appends, in its order', () => {
        // The admin bundle cannot import the config-manager, so the table is copied - this reads the
        // weather block of getScreensaverConfig and compares the want('key') calls of every branch.
        const src = fs.readFileSync(path.resolve('src/lib/classes/config-manager.ts'), 'utf8');
        const start = src.indexOf('if (config.weatherEntity) {');
        const end = src.indexOf('// Check for unsupported weather adapter', start);
        expect(start).to.be.greaterThan(-1);
        expect(end).to.be.greaterThan(start);
        const block = src.slice(start, end);
        const re = /startsWith\('([a-z-]+)\.'\)|want\('([A-Za-z0-9]+)'\)/g;
        const found: Record<string, string[]> = {};
        let current = '';
        let m: RegExpExecArray | null;
        while ((m = re.exec(block))) {
            if (m[1]) {
                current = m[1];
                found[current] = [];
            } else if (current) {
                found[current].push(m[2]);
            }
        }
        expect(Object.keys(found).sort()).to.deep.equal([...screensaverWeatherAdapters].sort());
        for (const adapter of screensaverWeatherAdapters) {
            expect(found[adapter], adapter).to.deep.equal([...screensaverWeatherItemsOfAdapter[adapter]]);
            for (const key of found[adapter]) {
                expect(screensaverWeatherItemKeys, `${adapter}/${key}`).to.include(key);
            }
        }
    });

    it('lists the chosen items in adapter order and drops keys the adapter has not', () => {
        expect(
            screensaverWeatherItemsOn({ solar: true, sunriseSet: true, uvIndex: true }, 'brightsky.0'),
        ).to.deep.equal(['sunriseSet', 'solar']);
        expect(screensaverWeatherItemsOn({ forecastDay6: true, forecastDay1: true }, 'accuweather.0')).to.deep.equal([
            'forecastDay1',
        ]);
        expect(screensaverWeatherItemsOn({ sunriseSet: false, windSpeed: true }, 'openweathermap.2')).to.deep.equal([
            'windSpeed',
        ]);
        expect(screensaverWeatherItemsOn({ sunriseSet: true }, '')).to.deep.equal([]);
        expect(screensaverWeatherItemsOn({ sunriseSet: true }, 'daswetter.0')).to.deep.equal([]);
        expect(screensaverWeatherItemsOn(undefined, 'brightsky.0')).to.deep.equal([]);
    });

    it('prints numbers like the panel: no grouping, fixed decimals when given', () => {
        expect(formatEntryNumber(1234.5)).to.equal('1234,5');
        expect(formatEntryNumber(1234.5, 'en-US')).to.equal('1234.5');
        expect(formatEntryNumber(3, 'de-DE', 2)).to.equal('3,00');
        expect(formatEntryNumber(2.456, 'de-DE', 0)).to.equal('2');
    });

    it('joins the two lines of a notification', () => {
        expect(
            screensaverNotifyLines({
                icon: 'X',
                headlinePrefix: 'Hoch: ',
                headline: '25',
                headlineUnit: '°C',
                textPrefix: '[',
                text: 'Sturm',
                textSuffix: ']',
            }),
        ).to.deep.equal({ heading: 'X Hoch: 25°C', text: '[Sturm]' });
        // the screensaver passes the lines its page item joined already
        expect(screensaverNotifyLines({ icon: '', headline: 'Wetterwarnung', text: 'Orkan' })).to.deep.equal({
            heading: 'Wetterwarnung',
            text: 'Orkan',
        });
        // prefix and suffix of the text need a text
        expect(screensaverNotifyLines({ textPrefix: '[', textSuffix: ']' })).to.deep.equal({ heading: '', text: '' });
    });
});
