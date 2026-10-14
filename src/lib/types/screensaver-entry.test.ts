import { expect } from 'chai';
import fs from 'node:fs';
import path from 'node:path';
import {
    emptyScreensaverEntry,
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
});
