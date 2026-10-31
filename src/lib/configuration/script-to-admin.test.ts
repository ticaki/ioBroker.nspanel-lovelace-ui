/**
 * Tests of the script -> admin conversion (`planScriptToAdmin`).
 *
 * 1. Rules of the conversion: which pages, items, screensaver elements and buttons are converted, which are
 *    skipped with which reason and detail.
 * 2. Equivalence: every page the planner converts is built twice - from the script page through
 *    `ConfigManager.setScriptConfig` and from the planned admin entry through `AdminConfiguration` (the real
 *    `convertAdminPageItemToPageItemConfig` of main.ts included) - and both runtime pages have to be equal.
 *    The same for the screensaver. The fixtures are the test configuration of the adapter, the script
 *    template and pages taken from real scripts (the state ids of those are registered in a fake object
 *    database with the roles the scripts expect).
 * 3. Idempotence: planning the cleaned script against the extended admin configuration finds nothing to do.
 */
import { expect } from 'chai';
import * as fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import { ConfigManager } from '../classes/config-manager';
import type { NavigationItemConfig } from '../classes/navigation';
import { StatesControler } from '../controller/states-controller';
import { requiredScriptDataPoints } from '../const/config-manager-const';
import { Color } from '../const/Color';
import { testScriptConfig } from '../const/test';
import * as ShareConfig from '../types/adminShareConfig';
import { isIconColorScaleElement } from '../types/function-and-const';
import type { PageBase } from '../types/pages';
import { AdminConfiguration } from './admin';
import { ensureMainPage } from './main-page';
import { isScreensaverPage } from './admin-screensaver';
import { planScriptToAdmin, type ScriptToAdminInput, type ScriptToAdminResult } from './script-to-admin';

const topic = 'nspanel/test';
const panelName = 'Testpanel';

/* ---------------------------------------------------------------------------------------------
 * fake object database
 * ------------------------------------------------------------------------------------------- */

type ObjectDB = Record<string, ioBroker.Object>;

/**
 * Adds a state object.
 *
 * @param db Object database.
 * @param id State id.
 * @param common Common part of the state.
 */
function addState(db: ObjectDB, id: string, common: Partial<ioBroker.StateCommon>): void {
    db[id] = {
        _id: id,
        type: 'state',
        common: { name: id.split('.').pop() ?? id, read: true, write: false, type: 'mixed', role: 'state', ...common },
        native: {},
    };
}

/**
 * Adds a channel with every datapoint of `requiredScriptDataPoints[role]` (first role / type of each).
 *
 * @param db Object database.
 * @param id Channel id.
 * @param role Channel role.
 */
function addRoleChannel(db: ObjectDB, id: string, role: ScriptConfig.channelRoles): void {
    const name = id.split('.').pop() ?? id;
    db[id] = { _id: id, type: 'channel', common: { name: { en: name, de: `${name} (de)` }, role }, native: {} };
    const data = requiredScriptDataPoints[role].data as Record<
        string,
        { role: string | string[]; type: string | string[]; writeable?: boolean } | undefined
    >;
    for (const key of Object.keys(data)) {
        const entry = data[key];
        if (!entry) {
            continue;
        }
        const common: Partial<ioBroker.StateCommon> = {
            role: (Array.isArray(entry.role) ? entry.role[0] : entry.role) || 'state',
            type: ((Array.isArray(entry.type) ? entry.type[0] : entry.type) || 'mixed') as ioBroker.CommonType,
            write: !!entry.writeable,
            unit: key === 'ACTUAL' ? '°C' : undefined,
            min: 0,
            max: 100,
        };
        if (key === 'MODE' || key === 'MODESET') {
            common.states = { 0: 'OFF', 1: 'AUTO', 2: 'COOL' };
        }
        if (role === 'media' && key === 'STATE') {
            common.alias = { id: 'mpd.0.state' };
        }
        addState(db, `${id}.${key}`, common);
    }
}

const channels: Record<ScriptConfig.channelRoles | 'none', string[]> = {
    light: [
        'alias.0.Licht.lights.Gerät_1',
        'alias.0.Licht.lights.Gerät_2',
        'alias.0.NSPanel.Beleuchtung.Obergeschoss',
        'alias.0.NSPanel.Beleuchtung.Abstellraum',
        'alias.0.NSPanel.Beleuchtung.Ankleidezimmer',
        'alias.0.NSPanel.Beleuchtung.Bad',
        'alias.0.NSPanel.Beleuchtung.Flur',
        'alias.0.NSPanel.Beleuchtung.Küche',
        'alias.0.NSPanel.Beleuchtung.Schlafzimmer',
        'alias.0.NSPanel.Beleuchtung.Wohnzimmer',
    ],
    blind: ['alias.0.NSPanel.allgemein.shutterOnly', 'alias.0.NSPanel.allgemein.shutter', 'alias.0.ShutterTest'],
    info: ['0_userdata.0.Einzelne_Geräte.Info', 'alias.0.Tests.Info.Infotest', '0_userdata.0.Info!'],
    dimmer: ['0_userdata.0.Einzelne_Geräte.dimmer'],
    hue: ['alias.0.NSPanel.allgemein.hue', 'alias.0.Hue'],
    rgbSingle: ['alias.0.Licht.rgbSingle'],
    button: ['alias.0.Button', 'alias.0.Tests.ButtonSensor', 'alias.0.Tests.ButtonNav'],
    volume: ['alias.0.Tests.Volume', '0_userdata.0.Einzelne_Geräte.volume'],
    'level.timer': ['alias.0.Tests.Timer', '0_userdata.0.Einzelne_Geräte.timer'],
    slider: ['0_userdata.0.Einzelne_Geräte.slider'],
    temperature: [
        'alias.0.NSPanel.1.usr.Temperatur.M.Wohnzimmer',
        'alias.0.NSPanel.1.usr.Temperatur.M.OG',
        'alias.0.NSPanel.1.usr.Temperatur.M.Küche',
        'alias.0.NSPanel.1.usr.Temperatur.M.Bad',
        'alias.0.NSPanel.1.usr.Temperatur.M.Kinderzimmer_1',
        'alias.0.NSPanel.1.usr.Temperatur.M.Schlafzimmer',
        'alias.0.NSPanel.1.usr.Temperatur.M.Ankleidezimmer',
        'alias.0.NSPanel.allgemein.Temperatur',
    ],
    humidity: ['alias.0.NSPanel.allgemein.humidity'],
    window: [
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.floor',
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.room',
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Schlafzimmer.room',
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Bad.room',
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.giebelfenster_links',
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.giebelfenster_rechts',
        'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.fenster_seite',
    ],
    thermostat: ['alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1'],
    media: ['alias.0.Tests.media'],
    airCondition: [],
    ct: [],
    door: [],
    gate: [],
    lock: [],
    motion: [],
    rgb: [],
    select: [],
    socket: [],
    timeTable: [],
    warning: [],
    'level.mode.fan': [],
    'sensor.alarm.flood': [],
    'value.humidity': [],
    'value.temperature': [],
    none: [],
};

/**
 * Builds the object database of all tests.
 *
 * @returns The objects and the state values.
 */
function buildDatabase(): { objects: ObjectDB; states: Record<string, ioBroker.State> } {
    const objects: ObjectDB = {};
    const states: Record<string, ioBroker.State> = {};
    for (const [role, ids] of Object.entries(channels)) {
        if (role === 'none') {
            continue;
        }
        for (const id of ids) {
            addRoleChannel(objects, id, role as ScriptConfig.channelRoles);
        }
    }
    addState(objects, 'mpd.0.state', { role: 'media.state', type: 'boolean' });
    // single states used by items and the screensaver
    addState(objects, 'alias.0.Tests.button.SET', { role: 'button', type: 'boolean', write: true });
    addState(objects, '0_userdata.0.Green', { role: 'text', type: 'string', write: true });
    addState(objects, 'alias.0.Licht.lights.Gerät_1.ACTUAL', { role: 'switch', type: 'boolean', write: true });
    const screensaverStates: [string, Partial<ioBroker.StateCommon>][] = [
        ['alias.0.NSPanel.allgemein.Status_offene_Fenster.ACTUAL', { type: 'number', role: 'value', name: 'Fenster' }],
        ['alias.0.NSPanel.allgemein.Status_offene_Tuer.ACTUAL', { type: 'number', role: 'value', name: 'Türen' }],
        ['alias.0.NSPanel.allgemein.Status_Licht_An.ACTUAL', { type: 'boolean', role: 'sensor.light' }],
        ['alias.0.Türschloss.ACTUAL', { type: 'boolean', role: 'sensor.lock' }],
        ['alias.0.NSPanel.allgemein.Auto.Safety.ACTUAL', { type: 'boolean', role: 'indicator' }],
        [
            'alias.0.NSPanel.Flur.Sensor.ANALOG.Temperature.ACTUAL',
            { type: 'number', role: 'value.temperature', unit: '°C' },
        ],
        [
            'alias.0.Heizung.WärmeTagesVerbrauch.ACTUAL',
            { type: 'number', role: 'value.power.consumption', unit: 'kWh' },
        ],
        ['alias.0.NSPanel.allgemein.Abfall.event1.INFO', { type: 'string', role: 'text' }],
        ['0_userdata.0.Abfallkalender.1.color', { type: 'string', role: 'level.color.rgb' }],
        ['pirate-weather.0.weather.currently.windSpeed', { type: 'number', role: 'value.speed.wind', unit: 'm/s' }],
        ['pirate-weather.0.weather.currently.windGust', { type: 'number', role: 'value.speed.wind.gust', unit: 'm/s' }],
        ['pirate-weather.0.weather.currently.humidity', { type: 'number', role: 'value.humidity', unit: '%' }],
        ['0_userdata.0.number1', { type: 'number', role: 'value' }],
        ['0_userdata.0.number', { type: 'number', role: 'value' }],
        ['0_userdata.0.RGB', { type: 'string', role: 'level.color.rgb' }],
        ['0_userdata.0.NotityficationTest', { type: 'boolean', role: 'indicator' }],
        ['0_userdata.0.NotityficationTest2', { type: 'boolean', role: 'indicator' }],
        ['0_userdata.0.example_state_mricon', { type: 'boolean', role: 'switch', write: true }],
    ];
    for (const [id, common] of screensaverStates) {
        addState(objects, id, common);
    }
    // squeezebox player of the media fixture
    objects['squeezeboxrpc.0.Players.Familienzimmer'] = {
        _id: 'squeezeboxrpc.0.Players.Familienzimmer',
        type: 'device',
        common: { name: 'Familienzimmer' },
        native: {},
    };
    for (const id of Object.keys(objects)) {
        const common = objects[id].common as { type?: string };
        if (objects[id].type === 'state') {
            states[id] = {
                val: common.type === 'boolean' ? true : common.type === 'string' ? 'abc' : 42,
                ack: true,
                ts: 0,
                lc: 0,
                from: '',
            };
        }
    }
    return { objects, states };
}

const DB = buildDatabase();
const instances = ['system.adapter.mpd.0', 'system.adapter.squeezeboxrpc.0'];

/* ---------------------------------------------------------------------------------------------
 * the real convertAdminPageItemToPageItemConfig of main.ts
 * ------------------------------------------------------------------------------------------- */

type ConvertAdminItem = (
    preItem: ShareConfig.AdminPageItemConfig | undefined,
    prePage: { card: string; uniqueName: string },
    messages: string[],
) => Promise<{ pageItem: unknown; messages: string[]; error: string | undefined }>;

/**
 * Loads `convertAdminPageItemToPageItemConfig` out of main.ts: the adapter class is not exported and
 * cannot be constructed in a test, so the method source is cut out of the file and transpiled. The
 * equivalence tests thereby run the real admin path, not a copy of it.
 *
 * @returns The method, to be called with the fake adapter as `this`.
 */
function loadConvertAdminPageItem(): ConvertAdminItem {
    // a Windows checkout (core.autocrlf) delivers main.ts with CRLF - the markers below are searched with LF
    const source = fs.readFileSync(path.join(__dirname, '../../main.ts'), 'utf8').replace(/\r\n/g, '\n');
    const start = source.indexOf('    async convertAdminPageItemToPageItemConfig(');
    const end = source.indexOf('\n}\nif (require.main !== module)', start);
    expect(start, 'method found in main.ts').to.be.greaterThan(-1);
    expect(end, 'end of the class found in main.ts').to.be.greaterThan(start);
    const method = source.slice(start, end);
    const js = ts.transpileModule(`class Convert {\n${method}\n}\nmodule.exports = Convert;`, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const mod: { exports?: { prototype: { convertAdminPageItemToPageItemConfig: ConvertAdminItem } } } = {};

    const factory = new Function(
        'module',
        'ConfigManager',
        'Color',
        'isIconColorScaleElement',
        'isRawItemObject',
        'pageItemRawFormat',
        js,
    ) as (
        module: typeof mod,
        configManager: typeof ConfigManager,
        color: typeof Color,
        guard: typeof isIconColorScaleElement,
        rawGuard: typeof ShareConfig.isRawItemObject,
        rawFormat: typeof ShareConfig.pageItemRawFormat,
    ) => void;
    factory(
        mod,
        ConfigManager,
        Color,
        isIconColorScaleElement,
        ShareConfig.isRawItemObject,
        ShareConfig.pageItemRawFormat,
    );
    return mod.exports!.prototype.convertAdminPageItemToPageItemConfig;
}

const convertAdminPageItem = loadConvertAdminPageItem();

/* ---------------------------------------------------------------------------------------------
 * fake adapter
 * ------------------------------------------------------------------------------------------- */

type LogEntry = [level: string, text: string];

/**
 * Adapter stub with the fake object database - serves ConfigManager and AdminConfiguration.
 *
 * @param logs Receives the log output (warn, error).
 * @param config Adapter configuration.
 * @returns An object usable as adapter.
 */
function fakeAdapter(logs: LogEntry[], config: Record<string, unknown> = {}): any {
    const noop = (): void => undefined;
    const objects = DB.objects;
    const adapter = {
        namespace: 'nspanel-lovelace-ui.0',
        language: 'de',
        unload: false,
        library: { getLocalLanguage: (): string => 'de' },
        log: {
            silly: noop,
            debug: noop,
            info: noop,
            warn: (t: string): number => logs.push(['warn', t]),
            error: (t: string): number => logs.push(['error', t]),
        },
        config: {
            panels: [{ topic, name: panelName }],
            pageConfig: [],
            screensaverConfig: [],
            screensaverNotify: [],
            adminOverridesScriptPages: false,
            testCase: false,
            ...config,
        },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignObjectsAsync: async (): Promise<ObjectDB> => structuredClone(objects),
        getEnumsAsync: async (): Promise<Record<string, Record<string, never>>> => ({
            'enum.rooms': {},
            'enum.functions': {},
        }),
        getForeignStateAsync: async (id: string): Promise<ioBroker.State | null> =>
            DB.states[id] ? structuredClone(DB.states[id]) : null,
        getForeignStatesAsync: async (): Promise<Record<string, never>> => ({}),
        getStateAsync: async (): Promise<null> => null,
        getObjectViewAsync: async (
            _design: string,
            search: string,
            params: { startkey?: string; endkey?: string },
        ): Promise<{ rows: { id: string; value: ioBroker.Object }[] }> => {
            const start = params?.startkey ?? '';
            const end = params?.endkey ?? '香';
            if (search === 'instance') {
                return {
                    rows: instances
                        .filter(id => id >= start && id <= end)
                        .map(id => ({
                            id,
                            value: { _id: id, type: 'instance', common: {}, native: {} } as ioBroker.Object,
                        })),
                };
            }
            return {
                rows: Object.values(objects)
                    .filter(o => o.type === search && o._id >= start && o._id <= end)
                    .map(o => ({ id: o._id, value: structuredClone(o) })),
            };
        },
        setForeignObjectAsync: async (): Promise<void> => undefined,
        setForeignObject: async (): Promise<void> => undefined,
        setObjectNotExistsAsync: async (): Promise<void> => undefined,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
        convertAdminPageItemToPageItemConfig: undefined as unknown as ConvertAdminItem,
    };
    adapter.convertAdminPageItemToPageItemConfig = function (
        this: unknown,
        preItem: ShareConfig.AdminPageItemConfig | undefined,
        prePage: { card: string; uniqueName: string },
        messages: string[],
    ): ReturnType<ConvertAdminItem> {
        return convertAdminPageItem.call(adapter, preItem, prePage, messages);
    };
    return adapter;
}

/**
 * Resets the static object cache of the states controller.
 */
function resetStatesController(): void {
    StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
    StatesControler.tempObjectDBTimeout = undefined;
}

/* ---------------------------------------------------------------------------------------------
 * fixtures
 * ------------------------------------------------------------------------------------------- */

const Off = { red: 253, green: 128, blue: 0 };
const On = { red: 253, green: 216, blue: 53 };
const HMIOff = { red: 68, green: 115, blue: 158 };
const HMIOn = { red: 3, green: 169, blue: 244 };
const HMIDark = { red: 29, green: 29, blue: 29 };
const MSRed = { red: 251, green: 105, blue: 98 };
const MSYellow = { red: 255, green: 235, blue: 156 };
const MSGreen = { red: 121, green: 222, blue: 121 };
const Red = { red: 255, green: 0, blue: 0 };
const White = { red: 255, green: 255, blue: 255 };
const Yellow = { red: 255, green: 255, blue: 0 };
const Green = { red: 0, green: 255, blue: 0 };
const Blue = { red: 0, green: 0, blue: 255 };
const Black = { red: 0, green: 0, blue: 0 };
const Menu = { red: 150, green: 150, blue: 100 };

/**
 * A status icon element in the form of the template script.
 *
 * @param entity State of the icon.
 */
function mrIcon(entity: string | null): ScriptConfig.ScreenSaverMRElement {
    return {
        type: 'script',
        ScreensaverEntity: entity,
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: On,
        ScreensaverEntityOffColor: HMIOff,
    };
}

/**
 * A script configuration with the fields the config manager requires; everything is empty unless given.
 *
 * @param partial Fields to set.
 */
function baseConfig(partial: Partial<ScriptConfig.Config> = {}): ScriptConfig.Config {
    return {
        version: '0.21.6',
        scriptName: 'script.js.nspanel.test',
        panelTopic: topic,
        weatherEntity: '',
        defaultOnColor: On,
        defaultOffColor: Off,
        defaultBackgroundColor: HMIDark,
        weatherAddDefaultItems: false,
        favoritScreensaverEntity: [],
        alternateScreensaverEntity: [],
        leftScreensaverEntity: [],
        bottomScreensaverEntity: [],
        indicatorScreensaverEntity: [],
        mrIcon1ScreensaverEntity: mrIcon('Relay.1'),
        mrIcon2ScreensaverEntity: mrIcon('Relay.2'),
        pages: [],
        subPages: [],
        buttonLeft: null,
        buttonRight: null,
        ...partial,
    };
}

/**
 * A page of the script - typed loosely, the fixtures carry fields of every page type.
 *
 * @param page The page.
 */
function page(page: Record<string, unknown>): ScriptConfig.PageType {
    return page as unknown as ScriptConfig.PageType;
}

/** the configuration of `script/example_sendTo_script_iobroker.ts` as the script sends it */
function templateConfig(): ScriptConfig.Config {
    return baseConfig({
        scriptName: 'script.js.nspanel-lovelace-ui_0.template',
        weatherEntity: 'pirate-weather.0.',
        pages: [page({ type: 'cardGrid', uniqueName: 'main', heading: 'Die Leere', items: [] })],
        favoritScreensaverEntity: [
            {
                type: 'template',
                template: 'text.pirate-weather.favorit',
                dpInit: '/^pirate-weather\\.0\\.weather\\.currently\\./',
                modeScr: 'favorit',
            },
        ],
        indicatorScreensaverEntity: [
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_offene_Fenster.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'window-open-variant',
                ScreensaverEntityIconOff: 'window-closed-variant',
                ScreensaverEntityText: 'Fenster',
                ScreensaverEntityUnitText: '%',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_offene_Tuer.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'door-open',
                ScreensaverEntityIconOff: 'door-closed',
                ScreensaverEntityText: 'Tür',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_Licht_An.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'lightbulb',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Licht',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.Türschloss.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'lock',
                ScreensaverEntityIconOff: 'lock-open',
                ScreensaverEntityText: 'Türschloss',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1, val_best: 1 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Auto.Safety.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'car-key',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Auto',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1, val_best: 1 },
            },
        ],
        bottomScreensaverEntity: [
            {
                type: 'template',
                template: 'text.pirate-weather.sunriseset',
                dpInit: '/^pirate-weather\\.0\\.weather\\.daily\\.00.+/',
                modeScr: 'bottom',
            },
            {
                type: 'script',
                ScreensaverEntity: 'pirate-weather.0.weather.currently.windSpeed',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'weather-windy',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Wind',
                ScreensaverEntityUnitText: 'm/s',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 120 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'pirate-weather.0.weather.currently.windGust',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'weather-tornado',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Böen',
                ScreensaverEntityUnitText: 'm/s',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 120 },
            },
            {
                type: 'template',
                template: 'text.pirate-weather.winddirection',
                dpInit: '/^pirate-weather\\.0\\.weather\\.currently./',
                modeScr: 'bottom',
            },
            {
                type: 'script',
                ScreensaverEntity: 'pirate-weather.0.weather.currently.humidity',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'water-percent',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Feuchte',
                ScreensaverEntityUnitText: '%',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 100, val_best: 60 },
            },
            {
                type: 'template',
                template: 'text.pirate-weather.uvindex',
                dpInit: '/^pirate-weather\\.0\\.weather\\.currently./',
                modeScr: 'bottom',
            },
        ],
        leftScreensaverEntity: [
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.Flur.Sensor.ANALOG.Temperature.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'thermometer',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Temperatur',
                ScreensaverEntityUnitText: '°C',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 35, val_best: 22 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.Heizung.WärmeTagesVerbrauch.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'counter',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Wärme',
                ScreensaverEntityUnitText: ' kWh',
                ScreensaverEntityIconColor: MSYellow,
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Abfall.event1.INFO',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityDateFormat: { year: 'numeric', month: '2-digit', day: '2-digit' },
                ScreensaverEntityIconOn: 'trash-can',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Abfall',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: '0_userdata.0.Abfallkalender.1.color',
            },
        ],
        buttonLeft: { mode: 'page', page: 'main' },
    });
}

/** pages of the real script `script.js.nspanel-lovelace-ui_0.ns_panel4` (icon test panel) */
function nsPanel4Config(): ScriptConfig.Config {
    const nav = (targetPage: string, name: string, icon: string): Record<string, unknown> => ({
        navigate: true,
        targetPage,
        name,
        icon,
    });
    return {
        ...templateConfig(),
        scriptName: 'script.js.nspanel-lovelace-ui_0.ns_panel4',
        pages: [
            page({
                type: 'cardGrid2',
                uniqueName: 'main',
                heading: 'Eigene Icons',
                items: [
                    { id: 'alias.0.ShutterTest', name: 'Rollo Test' },
                    nav('newicons', 'Fenster zu', 'window-closed-variant'),
                    nav('newicons', 'gekippt', 'window-tilt-variant'),
                    nav('newicons', 'offen', 'window-open-hinged-variant'),
                    nav('newicons', 'Rollo 25 %', 'window-shutter-25'),
                    nav('newicons', 'Rollo 50 %', 'window-shutter-50'),
                    nav('newicons', 'Rollo 75 %', 'window-shutter-75'),
                ],
            }),
            page({
                type: 'cardGrid',
                uniqueName: 'newicons',
                heading: 'Neue Icons',
                items: [
                    nav('newicons2', 'Rollo auto', 'window-shutter-auto'),
                    nav('newicons2', 'Thermostat', 'thermostat-auto'),
                    nav('newicons2', 'Sauger', 'robot-vacuum-alert'),
                    nav('newicons2', 'Mäher', 'mower-on'),
                    nav('newicons2', 'Akku', 'power-plug-battery'),
                    nav('newicons2', 'Boiler', 'water-boiler-auto'),
                ],
            }),
            page({
                type: 'cardGrid2',
                uniqueName: 'newicons2',
                heading: 'Neue Icons 2',
                items: [
                    nav('iconcheck', 'Markise', 'awning'),
                    nav('iconcheck', 'Wasserhahn', 'faucet'),
                    nav('iconcheck', 'Staub', 'weather-dust'),
                    nav('iconcheck', 'Lautspr.', 'speaker-play'),
                    nav('iconcheck', 'Sonne', 'sun-angle'),
                    nav('iconcheck', 'Haus %', 'home-percent'),
                    nav('iconcheck', 'pause-box', 'pause-box'),
                    nav('iconcheck', 'lectern', 'lectern'),
                ],
            }),
            page({
                type: 'cardGrid',
                uniqueName: 'iconcheck',
                heading: 'Icon-Kontrolle',
                items: [
                    nav('main', 'home', 'home'),
                    nav('main', 'google-home', 'google-home'),
                    nav('main', 'receipt', 'receipt'),
                    nav('main', 'receipt-text', 'receipt-text'),
                    nav('main', 'cal-week-end', 'calendar-week-end'),
                    nav('main', 'cal-filter', 'calendar-filter'),
                ],
            }),
        ],
    };
}

/** pages of the real script `script.js.nspanel-lovelace-ui_0.nspanel6` (development panel) */
function nsPanel6Config(): ScriptConfig.Config {
    return baseConfig({
        scriptName: 'script.js.nspanel-lovelace-ui_0.nspanel6',
        weatherEntity: 'accuweather.0.',
        pages: [
            page({
                type: 'cardMedia',
                heading: 'main',
                media: {
                    id: 'squeezeboxrpc.0.Players.Familienzimmer',
                    playList: ['Anime Best'],
                    volumePresets: ['leise?2'],
                    minValue: 0,
                    maxValue: 25,
                },
                uniqueName: 'main',
                items: [],
                scrollPresentation: 'arrow',
            }),
            page({
                type: 'cardThermo2',
                uniqueName: 'main22',
                heading: 'egal wird eh nicht angezeigt',
                thermoItems: [
                    {
                        id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
                        name: 'Heizung',
                        name2: 'Klimaanlage',
                        minValue: 16,
                        maxValue: 28,
                        stepValue: 0.1,
                    },
                ],
                items: [
                    { id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1', useValue: true, fontSize: 1 },
                    { id: '0_userdata.0.Einzelne_Geräte.dimmer' },
                ],
            }),
            page({ type: 'cardPower', uniqueName: 'powerpage' }),
            page({
                type: 'cardGrid',
                uniqueName: 'cardThermo2',
                heading: '///timeString',
                alwaysOnDisplay: true,
                items: [
                    { navigate: true, id: 'alias.0.Button', targetPage: 'main', longPress: 'alias.0.Tests.button.SET' },
                    { id: 'alias.0.Button', name: 'testconfim', confirm: 'water' },
                    { id: 'alias.0.Tests.media', navigate: true, targetPage: 'media2' },
                    { id: 'alias.0.Tests.Info.Infotest', navigate: true, targetPage: 'media2', useValue: true },
                    { id: 'alias.0.Tests.Info.Infotest', useValue: true },
                    {
                        id: 'alias.0.Hue',
                        name: 'Hue',
                        onColor: Yellow,
                        offColor: Green,
                        icon: 'lightbulb-on',
                        icon2: 'lightbulb-outline',
                        modeList: ['test', 'okay'],
                        inSel_Alias: '0_userdata.0.Green',
                    },
                    { id: 'alias.0.NSPanel.allgemein.shutterOnly' },
                    { id: 'alias.0.Licht.lights.Gerät_1' },
                    { id: 'alias.0.Licht.lights.Gerät_2' },
                    { id: '0_userdata.0.Einzelne_Geräte.timer' },
                    {
                        id: '0_userdata.0.Einzelne_Geräte.slider',
                        sliderItems: [{ heading: 'test', id: '', stepValue: 5 }],
                        useValue: true,
                    },
                    { navigate: true, targetPage: 'media2' },
                    { navigate: true, targetPage: 'media2', id: '0_userdata.0.Info!' },
                    { id: 'alias.0.NSPanel.allgemein.shutter', filter: 1 },
                    { id: 'alias.0.NSPanel.allgemein.humidity' },
                    {
                        id: 'alias.0.NSPanel.allgemein.Temperatur',
                        suffixName: '>suf',
                        prefixName: 'pre<',
                        suffixValue: '>suf',
                        prefixValue: 'pre<',
                        fontSize: 1,
                        useValue: true,
                        name: 'standard',
                        onColor: Red,
                        offColor: Blue,
                        colorScale: { val_min: 0, val_max: 40 },
                    },
                ],
            }),
            page({
                type: 'cardGrid',
                uniqueName: 'subgrid2',
                heading: 'Grid Arrow',
                items: [
                    { type: 'custom', id: 'alias.0.Licht.lights.Gerät_1.ACTUAL', name: 'custom', icon: 'water' },
                    { id: 'alias.0.Licht.lights.Gerät_2' },
                    { id: '0_userdata.0.Einzelne_Geräte.dimmer' },
                    { id: 'alias.0.NSPanel.allgemein.hue' },
                    { navigate: true, targetPage: 'fahrplanrouten' },
                    { id: 'alias.0.NSPanel.allgemein.shutter' },
                    {
                        id: '0_userdata.0.Einzelne_Geräte.volume',
                        name: 'Volume',
                        onColor: HMIOn,
                        offColor: HMIOff,
                        minValue: 0,
                        maxValue: 100,
                        navigate: true,
                        targetPage: 'hidden',
                    },
                ],
                scrollPresentation: 'arrow',
                home: 'hidden',
                parent: 'cardGrid1',
                hiddenByTrigger: false,
                useColor: true,
            }),
        ],
        subPages: [
            page({
                uniqueName: 'testrole',
                heading: 'Grid 1',
                items: [
                    { native: { template: 'text.battery.low', dpInit: '0_userdata.0' } },
                    { id: 'alias.0.Licht.lights.Gerät_1' },
                ],
                type: 'cardGrid',
                home: 'hidden',
                parent: 'cardGrid1',
                hiddenByTrigger: false,
                useColor: true,
            }),
            page({
                uniqueName: 'hidden',
                heading: 'Grid 1',
                items: [
                    { id: 'alias.0.Licht.lights.Gerät_1' },
                    { id: 'alias.0.Licht.lights.Gerät_2' },
                    { id: '0_userdata.0.Einzelne_Geräte.dimmer' },
                    { id: 'alias.0.NSPanel.allgemein.hue' },
                    { navigate: true, targetPage: 'fahrplanrouten' },
                    { id: 'alias.0.NSPanel.allgemein.shutter' },
                ],
                type: 'cardGrid',
                hiddenByTrigger: true,
                useColor: true,
            }),
        ],
        notifyScreensaverEntity: [
            {
                type: 'script',
                Enabled: ['0_userdata.0.NotityficationTest', '0_userdata.0.NotityficationTest2'],
                Headline: 'test2',
                Text: 'text2',
                Priority: 2,
            },
            {
                type: 'script',
                HeadlinePrefix: 'Hohe Zahl: ',
                Headline: '0_userdata.0.number',
                TextPrefix: 'Im Datenpunkt steht die Zahl ',
                Text: '0_userdata.0.number',
                TextSuffix: '. Bis dahin kannst du nicht zählen. Frag deine Mama!',
                Enabled: '0_userdata.0.number',
                VisibleCondition: 'val > 9',
                isDismissiblePerEvent: true,
                dismissibleIDGlobal: 'TestNotify',
                Priority: 1,
                buzzer: true,
            },
        ],
        favoritScreensaverEntity: [
            {
                type: 'template',
                template: 'text.openweathermap.favorit',
                dpInit: '/^openweathermap\\.0.+/',
                modeScr: 'favorit',
            },
        ],
        indicatorScreensaverEntity: [
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_offene_Fenster.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'window-open-variant',
                ScreensaverEntityIconOff: 'window-closed-variant',
                ScreensaverEntityText: 'Fenster',
                ScreensaverEntityUnitText: '%',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1 },
                ScreensaverEntityEnabled: '0_userdata.0.number1',
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_offene_Tuer.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'door-open',
                ScreensaverEntityIconOff: 'door-closed',
                ScreensaverEntityText: 'Tür',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: '0_userdata.0.RGB',
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Status_Licht_An.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'lightbulb',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Licht',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.Türschloss.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'lock',
                ScreensaverEntityIconOff: 'lock-open',
                ScreensaverEntityText: 'Türschloss',
                ScreensaverEntityUnitText: '',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 1, val_best: 1 },
            },
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.allgemein.Auto.Safety.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 0,
                ScreensaverEntityIconOn: 'car-key',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Auto',
                ScreensaverEntityUnitText: '',
                // a state as on color - the admin takes a fixed color only
                ScreensaverEntityOnColor: '0_userdata.0.RGB' as unknown as ScriptConfig.RGB,
            },
        ],
        leftScreensaverEntity: templateConfig().leftScreensaverEntity,
        buttonLeft: { mode: 'page', page: 'main' },
    });
}

/** pages of the real script `script.js.skriptconfig4` (older script of version 0.6.2) */
function skriptconfig4Config(): ScriptConfig.Config {
    const thermo = (uniqueName: string, heading: string, parent: string): ScriptConfig.PageType =>
        page({
            type: 'cardThermo',
            heading,
            uniqueName,
            subPage: true,
            parent,
            items: [
                { id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1', minValue: 100, maxValue: 300, stepValue: 1 },
            ],
        });
    const sensorGrid = (uniqueName: string, type: string): Record<string, unknown> => ({
        type,
        heading: 'Temperatur Innen',
        uniqueName,
        useColor: true,
        subPage: true,
        parent: 'Only4',
        items: [
            {
                navigate: true,
                id: 'alias.0.NSPanel.1.usr.Temperatur.M.Wohnzimmer',
                targetPage: 'Wohnzimmer_Thermostat',
                name: 'Wohnzimmer',
                onColor: MSGreen,
                useValue: true,
                colorScale: { val_min: -20, val_max: 40, val_best: 22 },
            },
            {
                navigate: true,
                id: 'alias.0.NSPanel.1.usr.Temperatur.M.Küche',
                targetPage: 'Kueche_Thermostat',
                name: 'Küche',
                onColor: MSYellow,
                useValue: true,
                colorScale: { val_min: -20, val_max: 40, val_best: 22 },
            },
            {
                navigate: true,
                id: 'alias.0.NSPanel.1.usr.Temperatur.M.Bad',
                targetPage: 'Bad_Thermostat',
                name: 'Bad',
                useValue: true,
                onColor: White,
                colorScale: { val_min: -20, val_max: 40, val_best: 22 },
            },
            {
                navigate: true,
                id: 'alias.0.NSPanel.1.usr.Temperatur.M.Schlafzimmer',
                targetPage: 'Schlafzimmer_Thermostat',
                name: 'Schlafzimmer',
                onColor: White,
                useValue: true,
                colorScale: { val_min: -20, val_max: 40, val_best: 19 },
            },
        ],
    });
    return baseConfig({
        version: '0.6.2',
        scriptName: 'script.js.skriptconfig4',
        weatherEntity: 'accuweather.0.',
        defaultOffColor: MSRed,
        defaultOnColor: Green,
        pages: [
            page({
                type: 'cardGrid',
                uniqueName: 'main',
                heading: 'Wohnzimmer',
                useColor: true,
                items: [
                    {
                        id: 'alias.0.Licht.rgbSingle',
                        name: 'HUE (CT=Kelvin)',
                        icon: 'lightbulb-on',
                        icon2: 'lightbulb-outline',
                        interpolateColor: true,
                        modeList: ['Color', 'Ocean', 'Romantik'],
                        inSel_ChoiceState: true,
                    },
                    { navigate: true, targetPage: 'Only4', id: 'alias.0.Tests.ButtonSensor' },
                    { id: 'alias.0.Tests.ButtonSensor' },
                    { navigate: true, targetPage: 'Only4', id: 'alias.0.Tests.ButtonNav' },
                    { id: 'alias.0.Tests.Volume' },
                    { id: 'alias.0.Tests.Timer' },
                    {
                        id: 'alias.0.NSPanel.1.usr.Temperatur.M.Wohnzimmer',
                        name: 'Wohnzimmer',
                        fontSize: 3,
                        onColor: Red,
                        offColor: Blue,
                        useValue: true,
                        colorScale: { val_min: 0, val_max: 40, mode: 'cie' },
                    },
                    { navigate: true, targetPage: 'Only4', id: 'alias.0.NSPanel.allgemein.shutter' },
                    { id: 'alias.0.NSPanel.allgemein.shutter' },
                    {
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.room',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                    { navigate: true, icon: 'home', name: 'Haus', targetPage: 'Only4', onColor: White },
                    {
                        navigate: true,
                        id: '0_userdata.0.Info!',
                        icon: 'home',
                        name: 'Haus',
                        targetPage: 'Only4',
                        onColor: Blue,
                    },
                    // no id and no navigation: the config manager drops the item without a place
                    { icon: 'home', name: 'Haus', onColor: White },
                    { id: '0_userdata.0.Info!', icon: 'home', name: 'Haus', onColor: White },
                    { id: 'alias.0.Licht.lights.Gerät_1' },
                ],
            }),
            page(sensorGrid('SensorGrid3', 'cardEntities')),
            page(sensorGrid('SensorGrid', 'cardGrid')),
            page({ type: 'cardQR', uniqueName: 'qrCode' }),
        ],
        subPages: [
            thermo('this_Thermostat', 'Wohnzimmer', 'main'),
            page({ ...sensorGrid('drei', 'cardGrid') }),
            thermo('Kueche_Thermostat', 'Küche', 'SensorGrid'),
            page({
                type: 'cardGrid',
                heading: 'Menü',
                uniqueName: 'WohnzimmerWindow',
                useColor: true,
                subPage: true,
                parent: 'ObergeschossWindow',
                items: [
                    {
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.giebelfenster_links',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                    {
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.giebelfenster_rechts',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                    {
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.fenster_seite',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                ],
            }),
            page({
                type: 'cardGrid',
                heading: 'Menü',
                uniqueName: 'ObergeschossWindow',
                useColor: true,
                subPage: true,
                parent: 'Only4',
                items: [
                    {
                        navigate: true,
                        targetPage: 'WohnzimmerWindow',
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Wohnzimmer.room',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                    {
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Schlafzimmer.room',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                    { id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.Bad.room', onColor: MSRed, offColor: MSGreen },
                ],
            }),
            page({
                type: 'cardGrid',
                heading: 'Menü',
                uniqueName: 'WindowGrid',
                useColor: true,
                items: [
                    {
                        navigate: true,
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.floor',
                        targetPage: 'ObergeschossWindow',
                        name: 'Obergeschoss',
                        onColor: MSGreen,
                        useValue: true,
                        colorScale: { val_min: 0, val_max: 1, val_best: 0 },
                    },
                ],
            }),
            page({
                type: 'cardEntities',
                uniqueName: 'Only4',
                heading: 'Menü',
                useColor: true,
                parent: 'main',
                items: [
                    {
                        navigate: true,
                        id: 'alias.0.NSPanel.1.usr.Temperatur.M.OG',
                        targetPage: 'SensorGrid',
                        name: 'Obergeschoss',
                        onColor: MSGreen,
                        useValue: true,
                        colorScale: { val_min: -20, val_max: 40, val_best: 22 },
                    },
                    {
                        navigate: true,
                        id: 'alias.0.NSPanel.1.usr.Fenster.Obergeschoss.floor',
                        targetPage: 'ObergeschossWindow',
                        onColor: MSRed,
                        offColor: MSGreen,
                    },
                    {
                        navigate: true,
                        id: 'alias.0.NSPanel.Beleuchtung.Obergeschoss',
                        targetPage: 'ogLightsGrid',
                        onColor: MSYellow,
                        offColor: Black,
                        icon: 'lightbulb',
                    },
                    { navigate: true, targetPage: 'Alexa', name: 'test' },
                ],
            }),
            page({
                type: 'cardGrid2',
                heading: 'Beleuchtung',
                useColor: true,
                uniqueName: 'ogLightsGrid',
                subPage: true,
                parent: 'Only4',
                items: ['Abstellraum', 'Ankleidezimmer', 'Bad', 'Flur', 'Küche', 'Schlafzimmer', 'Wohnzimmer'].map(
                    name => ({
                        id: `alias.0.NSPanel.Beleuchtung.${name}`,
                        name,
                        onColor: MSYellow,
                        offColor: Black,
                        icon: 'lightbulb',
                    }),
                ),
            }),
            page({
                type: 'cardMedia',
                heading: 'Alexa',
                uniqueName: '14',
                items: [
                    {
                        id: 'alias.0.Tests.media',
                        adapterPlayerInstance: 'alexa2.0.',
                        mediaDevice: 'G091B005050209S6',
                        speakerList: ['Überall'],
                        colorMediaIcon: Menu,
                        alwaysOnDisplay: true,
                        autoCreateALias: true,
                    },
                ],
            }),
        ],
        favoritScreensaverEntity: [
            {
                type: 'script',
                ScreensaverEntity: 'alias.0.NSPanel.Flur.Sensor.ANALOG.Temperature.ACTUAL',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'thermometer',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Temperatur',
                ScreensaverEntityUnitText: '°C',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 35, val_best: 22.5 },
            },
        ],
        leftScreensaverEntity: [templateConfig().leftScreensaverEntity[0]],
        mrIcon1ScreensaverEntity: mrIcon('0_userdata.0.example_state_mricon'),
    });
}

/* ---------------------------------------------------------------------------------------------
 * harness
 * ------------------------------------------------------------------------------------------- */

/**
 * Plans with defaults: no admin configuration, sequential notify ids.
 *
 * @param raw Script configuration.
 * @param overrides Other inputs.
 */
function plan(raw: ScriptConfig.Config, overrides: Partial<ScriptToAdminInput> = {}): ScriptToAdminResult {
    return planScriptToAdmin({
        raw,
        panel: { name: panelName, topic },
        pageConfig: [],
        screensaverConfig: [],
        screensaverNotify: [],
        notifyIdFactory: existing => `n${existing.length + 1}`,
        ...overrides,
    });
}

type ScriptRun = {
    pages: PageBase[];
    navigation: NavigationItemConfig[];
    logs: LogEntry[];
    messages: string[];
    /** pages of the global script (config manager), handed to the admin phase like Panel.preInit does */
    globalPageIds?: string[];
};

/**
 * Builds the runtime pages of a script configuration like the adapter does when the script sends it.
 *
 * @param config Script configuration (cloned).
 * @param adminConfig Admin configuration the config manager reads (power / chart entries).
 */
async function runScript(config: ScriptConfig.Config, adminConfig: Record<string, unknown> = {}): Promise<ScriptRun> {
    resetStatesController();
    const logs: LogEntry[] = [];
    const manager = new ConfigManager(fakeAdapter(logs, adminConfig), true);
    const result = await manager.setScriptConfig(structuredClone(config));
    expect(result.panelConfig, `script configuration accepted (${result.messages.join(' | ')})`).to.not.equal(
        undefined,
    );
    return {
        pages: result.panelConfig!.pages,
        navigation: result.panelConfig!.navigation,
        logs,
        messages: result.messages,
        globalPageIds: result.panelConfig!.globalPageIds,
    };
}

/**
 * Builds the runtime pages of the planned admin entries like the adapter does at panel start.
 *
 * @param result Result of the planner.
 */
async function runAdmin(result: ScriptToAdminResult): Promise<ScriptRun> {
    resetStatesController();
    const logs: LogEntry[] = [];
    const adapter = fakeAdapter(logs, {
        pageConfig: structuredClone(result.updatedPages),
        screensaverConfig: result.screensaverEntry ? [structuredClone(result.screensaverEntry)] : [],
        screensaverNotify: structuredClone(result.newNotify),
    });
    const option = { name: panelName, topic, pages: [] as PageBase[], navigation: [] as NavigationItemConfig[] };
    await new AdminConfiguration(adapter).processentrys(option as never);
    return { pages: option.pages, navigation: option.navigation, logs, messages: [] };
}

/**
 * A runtime page in a comparable form: JSON (drops undefined), without the fields the two paths set
 * differently on purpose.
 *
 * @param page Runtime page.
 */
function normalizePage(page: PageBase | undefined): unknown {
    expect(page, 'page built').to.not.equal(undefined);
    const copy = JSON.parse(
        JSON.stringify(page, (key: string, value: unknown): unknown => {
            // the best color of a scale: {red, green, blue} in the script, {r, g, b} in the admin - the runtime
            // accepts both (convertColorScaleBest)
            if (key === 'color_best' && value && typeof value === 'object' && 'red' in value) {
                const c = value as { red: number; green: number; blue: number };
                return { r: c.red, g: c.green, b: c.blue };
            }
            return value;
        }),
    ) as { uniqueID?: string; config?: Record<string, unknown> };
    // the script path numbers its pages (`index`), the admin path does not - the panel does not read it
    delete copy.config?.index;
    // the admin screensaver page has its own id so the panel can tell the origins apart
    delete copy.uniqueID;
    return copy;
}

/**
 * Paths at which two JSON values differ - readable failure output of the equivalence tests.
 *
 * @param a First value.
 * @param b Second value.
 * @param path Path of the values.
 */
function differences(a: unknown, b: unknown, path = '$'): string[] {
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return [`${path}: ${a.length} vs ${b.length} entries`];
        }
        return a.flatMap((v, i) => differences(v, b[i], `${path}[${i}]`));
    }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
        const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
        return [...keys].flatMap(k =>
            differences((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`),
        );
    }
    return a === b ? [] : [`${path}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`];
}

/**
 * Compares the pages of a converted script with the pages built from the planned admin entries.
 *
 * @param config Script configuration.
 * @param overrides Other inputs of the planner.
 * @returns The plan, for further checks.
 */
async function expectEquivalent(
    config: ScriptConfig.Config,
    overrides: Partial<ScriptToAdminInput> = {},
): Promise<ScriptToAdminResult> {
    // the script screensaver is built in the standard version (its version lives in a state of the panel)
    const result = plan(config, { screensaverMode: 'standard', ...overrides });
    const script = await runScript(config, { pageConfig: overrides.pageConfig ?? [] });
    const admin = await runAdmin(result);
    for (const planned of result.plan.pages.filter(p => p.action === 'create')) {
        const scriptPage = script.pages.find(p => p.uniqueID === planned.uniqueName);
        const adminPage = admin.pages.find(p => p.uniqueID === planned.uniqueName);
        expect(
            differences(normalizePage(adminPage), normalizePage(scriptPage)),
            `page ${planned.uniqueName} (admin vs script)`,
        ).to.deep.equal([]);
        if (planned.card !== 'cardThermo' && planned.card !== 'cardThermo2' && planned.card !== 'cardMedia') {
            // thermo, thermo2 and media pages add their own standard items at runtime
            const types = (adminPage?.pageItems ?? []).map((i): string =>
                typeof i?.type === 'string' ? i.type : 'undefined',
            );
            expect(planned.itemCount, `itemCount of ${planned.uniqueName}: ${types.join(',')}`).to.equal(
                types.filter(t => t !== 'empty').length,
            );
        }
    }
    // both paths have to build the pages without an error - otherwise the comparison would be void
    expect(
        script.logs.filter(l => l[0] === 'error'),
        'errors of the script path',
    ).to.deep.equal([]);
    expect(
        admin.logs.filter(l => l[0] === 'error'),
        'errors of the admin path',
    ).to.deep.equal([]);
    if (result.screensaverEntry) {
        const scriptPage = script.pages.find(p => isScreensaverPage(p));
        const adminPage = admin.pages.find(p => isScreensaverPage(p));
        expect(
            differences(normalizePage(adminPage), normalizePage(scriptPage)),
            'screensaver (admin vs script)',
        ).to.deep.equal([]);
    }
    return result;
}

/**
 * Plans the cleaned script against the extended admin configuration - nothing may be left.
 *
 * @param result Result of the first run.
 * @param overrides Other inputs of the first run.
 */
function expectIdempotent(result: ScriptToAdminResult, overrides: Partial<ScriptToAdminInput> = {}): void {
    const second = plan(result.cleanedRaw, {
        ...overrides,
        pageConfig: result.updatedPages,
        screensaverConfig: [
            ...(overrides.screensaverConfig ?? []),
            ...(result.screensaverEntry ? [result.screensaverEntry] : []),
        ],
        screensaverNotify: [...(overrides.screensaverNotify ?? []), ...result.newNotify],
        panel: {
            name: panelName,
            topic,
            ...overrides.panel,
            ...(result.buttons.left !== undefined ? { buttonLeft: result.buttons.left } : {}),
            ...(result.buttons.right !== undefined ? { buttonRight: result.buttons.right } : {}),
        },
    });
    expect(second.plan.nothingToDo, JSON.stringify(second.plan)).to.equal(true);
    expect(second.plan.skipped.filter(s => s.reason === 'nameExists')).to.deep.equal([]);
    expect(second.plan.pages).to.deep.equal([]);
    expect(second.newPages).to.deep.equal([]);
    expect(second.screensaverEntry).to.equal(undefined);
}

/**
 * A grid page with one light item.
 *
 * @param uniqueName Name of the page.
 * @param extra Further fields.
 */
function gridPage(uniqueName: string, extra: Record<string, unknown> = {}): ScriptConfig.PageType {
    return page({
        type: 'cardGrid',
        uniqueName,
        heading: `Seite ${uniqueName}`,
        items: [{ id: 'alias.0.Licht.lights.Gerät_1' }],
        ...extra,
    });
}

/**
 * A migrated power entry of the admin.
 *
 * @param uniqueName Name of the entry.
 * @param extra Further fields.
 */
function powerEntry(uniqueName: string, extra: Partial<ShareConfig.PowerEntry> = {}): ShareConfig.PowerEntry {
    return {
        card: 'cardPower',
        uniqueName,
        headline: 'Power',
        leftTop: {},
        leftMiddle: {},
        leftBottom: {},
        rightTop: {},
        rightMiddle: {},
        rightBottom: {},
        homeTop: {},
        homeBot: {},
        scriptNavigation: true,
        scriptName: uniqueName,
        hidden: false,
        alwaysOn: 'none',
        ...extra,
    };
}

/* ---------------------------------------------------------------------------------------------
 * rules
 * ------------------------------------------------------------------------------------------- */

describe('lib/configuration - planScriptToAdmin: pages', () => {
    it('creates menu entries for the convertible pages and removes them from the script', () => {
        const result = plan(baseConfig({ pages: [gridPage('main'), gridPage('a')], subPages: [gridPage('b')] }));
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.card])).to.deep.equal([
            ['main', 'create', 'cardGrid'],
            ['a', 'create', 'cardGrid'],
            ['b', 'create', 'cardGrid'],
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.newPages.map(e => e.uniqueName)).to.deep.equal(['main', 'a', 'b']);
        expect(result.updatedPages).to.deep.equal(result.newPages);
        expect(result.removedFromScript).to.deep.equal(['main', 'a', 'b']);
        expect(result.cleanedRaw.pages).to.deep.equal([]);
        expect(result.cleanedRaw.subPages).to.deep.equal([]);
        expect(result.plan.nothingToDo).to.equal(false);
        const entry = result.newPages[0] as ShareConfig.MenuEntry;
        expect(entry).to.deep.include({ card: 'cardGrid', headline: 'Seite main', hidden: false, alwaysOn: 'none' });
        expect(entry.pageItems).to.have.length(1);
    });

    it('maps the page fields: heading, hiddenByTrigger, alwaysOnDisplay and the scroll fields', () => {
        const result = plan(
            baseConfig({
                subPages: [
                    gridPage('a', {
                        hiddenByTrigger: true,
                        alwaysOnDisplay: true,
                        scrollPresentation: 'auto',
                        scrollAutoTiming: 7,
                    }),
                    gridPage('b', { alwaysOnDisplay: 'action', scrollType: 'half', scrollPresentation: 'arrow' }),
                    page({
                        type: 'cardGrid3',
                        uniqueName: 'c',
                        heading: 'C',
                        items: [],
                        useColor: true,
                        subPage: true,
                    }),
                ],
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        const [a, b, c] = result.newPages as ShareConfig.MenuEntry[];
        expect(a).to.deep.include({
            hidden: true,
            alwaysOn: 'always',
            scrollPresentation: 'auto',
            scrollAutoTiming: 7,
        });
        expect(b).to.deep.include({
            hidden: false,
            alwaysOn: 'action',
            scrollType: 'half',
            scrollPresentation: 'arrow',
        });
        expect(c).to.deep.include({ card: 'cardGrid3', headline: 'C', pageItems: [] });
        expect(c).to.not.have.property('scrollType');
    });

    it('takes the navigation of a sub page from its links, home: main when it has none', () => {
        const result = plan(
            baseConfig({
                subPages: [
                    gridPage('a', { prev: 'x', next: 'y', home: 'main', parent: 'p' }),
                    gridPage('b'),
                    gridPage('c', { prev: '', parent: 'p' }),
                ],
            }),
        );
        // with a single-press link the double-press link of the same side is ignored by the config manager
        expect(result.plan.pages.map(p => p.navigation)).to.deep.equal([
            { prev: 'x', next: 'y' },
            { home: 'main' },
            { parent: 'p' },
        ]);
        expect((result.newPages[0] as ShareConfig.MenuEntry).navigationAssignment).to.deep.equal([
            { topic, navigation: { prev: 'x', next: 'y' } },
        ]);
    });

    it('takes the navigation of a page of `pages` from the ring: the predecessor, the first page names its successor', () => {
        const result = plan(
            baseConfig({
                pages: [gridPage('a', { home: 'ignored', parent: 'ignored' }), gridPage('main'), gridPage('b')],
            }),
        );
        // the config manager moves main to the front: main, a, b
        expect(result.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['a', { prev: 'main' }],
            // the end of the ring leads into the service menu like at runtime; the start page gets its
            // service link from the default start page node it replaces (ensureMainPage)
            ['main', {}],
            ['b', { prev: 'a', next: '///unlock' }],
        ]);
        // a successor staying in the script is named as next, one converted as well names the page as prev
        const mixed = plan(baseConfig({ pages: [gridPage('main'), gridPage('s', { heading: '' }), gridPage('c')] }));
        expect(mixed.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['main', { next: 's' }],
            ['c', { prev: 's', next: '///unlock' }],
        ]);
        // a ring of the start page only: it takes both service links over from the default start page node
        expect(plan(baseConfig({ pages: [gridPage('main')] })).plan.pages[0].navigation).to.deep.equal({});
        // a ring of one other page: behind the default start page, into the service menu on the right
        expect(plan(baseConfig({ pages: [gridPage('p')] })).plan.pages[0].navigation).to.deep.equal({
            prev: 'main',
            next: '///unlock',
        });
    });

    it('skips pages of the ring that are gone for the panel after the conversion when it picks the predecessor', () => {
        const qrEntry = (navigationAssignment?: ShareConfig.NavigationAssignmentList): ShareConfig.QREntry => ({
            card: 'cardQR',
            uniqueName: 'qr',
            headline: 'QR',
            ssidUrlTel: '',
            wlanhidden: false,
            pwdhidden: false,
            setState: '',
            navigationAssignment,
        });
        // an unknown page field - the page stays in the script
        const skipped = gridPage('t', { unknownField: true });
        // dead reference in the middle (cardQR without an admin page for this panel), a skipped page that
        // stays in the script as predecessor
        const middle = plan(
            baseConfig({
                pages: [
                    gridPage('main'),
                    page({ type: 'cardQR', uniqueName: 'qr' }),
                    gridPage('a'),
                    skipped,
                    gridPage('b'),
                ],
            }),
            { pageConfig: [qrEntry([{ topic: 'other', navigation: {} }])] },
        );
        expect(middle.plan.pages.map(p => [p.uniqueName, p.action, p.navigation])).to.deep.equal([
            ['main', 'create', {}],
            ['qr', 'removeReference', {}],
            ['a', 'create', { prev: 'main', next: 't' }],
            ['b', 'create', { prev: 't', next: '///unlock' }],
        ]);
        // the admin QR page is assigned to this panel (here: to all panels) - it exists and serves as predecessor
        const covered = plan(
            baseConfig({ pages: [gridPage('main'), page({ type: 'cardQR', uniqueName: 'qr' }), gridPage('a')] }),
            { pageConfig: [qrEntry([{ topic: ShareConfig.ALL_PANELS_SPECIAL_ID, navigation: {} }])] },
        );
        expect(covered.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['main', {}],
            ['qr', {}],
            ['a', { prev: 'qr', next: '///unlock' }],
        ]);
        const excluded = plan(
            baseConfig({ pages: [gridPage('main'), page({ type: 'cardQR', uniqueName: 'qr' }), gridPage('a')] }),
            { pageConfig: [qrEntry([{ topic: ShareConfig.ALL_PANELS_SPECIAL_ID, navigation: {} }, { topic }])] },
        );
        expect(excluded.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['main', {}],
            ['qr', {}],
            ['a', { prev: 'main', next: '///unlock' }],
        ]);
        // dead references at the start: a power page without admin entry and a dead chart reference
        const start = plan(
            baseConfig({
                pages: [
                    page({ type: 'cardPower', uniqueName: 'p' }),
                    page({ type: 'cardChart', uniqueName: 'c' }),
                    gridPage('a'),
                    gridPage('b'),
                ],
            }),
            {
                pageConfig: [
                    {
                        card: 'cardChart',
                        uniqueName: 'c',
                        navigationAssignment: [{ topic: 'other', navigation: {} }],
                    },
                ],
            },
        );
        expect(start.plan.skipped.map(s => [s.uniqueName, s.reason])).to.deep.equal([['p', 'adminEntryMissing']]);
        expect(start.plan.pages.map(p => [p.uniqueName, p.action, p.navigation])).to.deep.equal([
            ['c', 'removeReference', {}],
            // no main in the script: the first page follows the default start page of the adapter
            ['a', 'create', { prev: 'main' }],
            ['b', 'create', { prev: 'a', next: '///unlock' }],
        ]);
        // a migrated power entry gets the navigation of the panel - it stays a valid predecessor
        const migrated = plan(
            baseConfig({ pages: [gridPage('main'), page({ type: 'cardPower', uniqueName: 'p' }), gridPage('a')] }),
            { pageConfig: [powerEntry('p')] },
        );
        expect(migrated.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['main', {}],
            ['p', { prev: 'main' }],
            ['a', { prev: 'p', next: '///unlock' }],
        ]);
    });

    it('stores the start page as main_<panel> with isMainPage when main is taken by a page of another panel', () => {
        const mainOfOther: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'main',
            headline: 'other',
            pageItems: [],
            navigationAssignment: [{ topic: 'other', navigation: {} }],
        };
        const config = baseConfig({ pages: [gridPage('main'), gridPage('a')] });
        const result = plan(config, { pageConfig: [mainOfOther], panel: { name: 'Test Panel/2', topic } });
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages.map(p => [p.uniqueName, p.storedAs, p.navigation])).to.deep.equal([
            ['main', 'main_Test_Panel_2', {}],
            ['a', undefined, { prev: 'main', next: '///unlock' }],
        ]);
        expect(result.newPages[0]).to.deep.include({
            uniqueName: 'main_Test_Panel_2',
            isMainPage: true,
            headline: 'Seite main',
        });
        expect(result.removedFromScript).to.deep.equal(['main', 'a']);
        expect(result.cleanedRaw.pages).to.deep.equal([]);

        // an entry that publishes main for this panel: by name or as start page
        const covered = plan(config, {
            pageConfig: [
                {
                    ...mainOfOther,
                    navigationAssignment: [{ topic: ShareConfig.ALL_PANELS_SPECIAL_ID, navigation: {} }],
                },
            ],
        });
        expect(covered.plan.skipped).to.deep.equal([{ uniqueName: 'main', type: 'cardGrid', reason: 'nameExists' }]);
        const start = plan(config, {
            pageConfig: [
                mainOfOther,
                {
                    ...mainOfOther,
                    uniqueName: 'start',
                    isMainPage: true,
                    navigationAssignment: [{ topic, navigation: {} }],
                },
            ],
        });
        expect(start.plan.skipped).to.deep.equal([{ uniqueName: 'main', type: 'cardGrid', reason: 'nameExists' }]);
        const startAll = plan(config, {
            pageConfig: [
                mainOfOther,
                {
                    ...mainOfOther,
                    uniqueName: 'start',
                    isMainPage: true,
                    navigationAssignment: [{ topic: ShareConfig.ALL_PANELS_SPECIAL_ID, navigation: {} }],
                },
            ],
        });
        expect(startAll.plan.skipped, 'start page for all panels').to.deep.equal([
            { uniqueName: 'main', type: 'cardGrid', reason: 'nameExists' },
        ]);
        const startOther = plan(config, {
            pageConfig: [mainOfOther, { ...mainOfOther, uniqueName: 'start', isMainPage: true }],
        });
        expect(startOther.plan.skipped, 'start page of another panel only').to.deep.equal([]);

        // main_<panel> taken as well
        const taken = plan(config, {
            pageConfig: [mainOfOther, { ...mainOfOther, uniqueName: 'main_Testpanel' }],
        });
        expect(taken.plan.skipped).to.deep.equal([
            { uniqueName: 'main', type: 'cardGrid', reason: 'nameExists', detail: 'main_Testpanel exists as well' },
        ]);
        expect(taken.plan.pages.map(p => p.uniqueName)).to.deep.equal(['a']);
    });

    it('skips pages the admin cannot hold: unknown card types, native pages, page links', () => {
        const result = plan(
            baseConfig({
                mrIcon1ScreensaverEntity: mrIcon(null),
                mrIcon2ScreensaverEntity: mrIcon(null),
                pages: [
                    page({ type: 'cardBurnRec', uniqueName: 't', heading: 'T', items: [] }),
                    page({ heading: 'Fahrplan', native: { card: 'cardEntities', uniqueID: 'fahrplan' } }),
                    page({ globalLink: 'global1' }),
                ],
            }),
        );
        expect(result.plan.pages).to.deep.equal([]);
        expect(result.plan.skipped.map(s => [s.uniqueName, s.type, s.reason])).to.deep.equal([
            ['t', 'cardBurnRec', 'unsupportedPageType'],
            ['fahrplan', 'native', 'unsupportedPageType'],
            ['global1', 'globalLink', 'unsupportedPageType'],
        ]);
        expect(result.plan.nothingToDo).to.equal(true);
        expect(result.cleanedRaw.pages).to.have.length(3);
    });

    it('skips a page whose name exists in the admin or twice in the script', () => {
        const admin = plan(baseConfig({ pages: [gridPage('main'), gridPage('x')] }), {
            pageConfig: [{ card: 'cardGrid', uniqueName: 'x', headline: 'x', pageItems: [] }],
        });
        expect(admin.plan.skipped).to.deep.equal([{ uniqueName: 'x', type: 'cardGrid', reason: 'nameExists' }]);
        const twice = plan(baseConfig({ pages: [gridPage('a')], subPages: [gridPage('a')] }));
        expect(twice.plan.pages).to.have.length(1);
        expect(twice.plan.skipped[0]).to.include({ uniqueName: 'a', reason: 'nameExists' });
        expect(twice.cleanedRaw.pages).to.deep.equal([]);
        expect(twice.cleanedRaw.subPages, 'the ignored sub page stays').to.have.length(1);
    });

    it('skips a page with an empty heading, a heading that is a state id, an unknown field or a navigation override', () => {
        const result = plan(
            baseConfig({
                navigation: [{ name: 'f', page: 'f', left: { single: 'x' } }],
                subPages: [
                    gridPage('b', { heading: '' }),
                    gridPage('c', { heading: 'alias.0.Headline.ACTUAL' }),
                    gridPage('d', { dpInit: 'x' }),
                    gridPage('e', { scrollType: 'half', type: 'cardEntities' }),
                    gridPage('f'),
                    gridPage('g', { heading: '///timeString' }),
                ],
            }),
        );
        expect(result.plan.skipped.map(s => [s.uniqueName, s.reason, s.detail])).to.deep.equal([
            ['b', 'fieldNotSupported', 'heading: empty - the admin shows the uniqueName instead'],
            ['c', 'fieldNotSupported', 'heading: looks like a state id - the admin shows the text itself'],
            ['d', 'fieldNotSupported', 'page.dpInit: not available in the admin'],
            ['e', 'fieldNotSupported', 'scrollType: half is not available for cardEntities in the admin'],
            ['f', 'fieldNotSupported', 'navigation: the script overrides the links of the page'],
        ]);
        expect(result.plan.pages.map(p => p.uniqueName)).to.deep.equal(['g']);
    });

    it('ignores the navigation icons and colors of a page like useColor - the config manager never reads them', () => {
        const icons = {
            prevIcon: 'arrow-left',
            prevIconColor: { red: 255, green: 0, blue: 0 },
            nextIcon: 'arrow-right',
            nextIconColor: { red: 0, green: 255, blue: 0 },
            homeIcon: 'home',
            homeIconColor: { red: 0, green: 0, blue: 255 },
            parentIcon: 'arrow-up',
            parentIconColor: { red: 1, green: 2, blue: 3 },
        };
        const result = plan(baseConfig({ subPages: [gridPage('a', { ...icons, useColor: true })] }));
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages.map(p => [p.uniqueName, p.action])).to.deep.equal([['a', 'create']]);
        expect(result.newPages.map(e => e.uniqueName)).to.deep.equal(['a']);
        expect(result.newPages[0]).to.not.have.any.keys(...Object.keys(icons), 'useColor');
        const serialized = JSON.stringify(result.newPages[0]);
        for (const key of Object.keys(icons)) {
            expect(serialized, `${key} must not reach the admin entry`).to.not.include(`"${key}"`);
        }
        expect(serialized).to.not.match(/arrow-left|arrow-right|arrow-up/);
    });

    it('removes cardQR, cardAlarm and cardUnlock references from the script (adminOnly)', () => {
        const result = plan(
            baseConfig({
                pages: [
                    page({ type: 'cardQR', uniqueName: 'qr' }),
                    page({ type: 'cardAlarm', uniqueName: 'al', items: [] }),
                ],
                subPages: [page({ type: 'cardUnlock', uniqueName: 'ul', items: [], parent: 'main' })],
            }),
        );
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.reason])).to.deep.equal([
            ['qr', 'removeReference', 'adminOnly'],
            ['al', 'removeReference', 'adminOnly'],
            ['ul', 'removeReference', 'adminOnly'],
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.newPages).to.deep.equal([]);
        expect(result.removedFromScript).to.deep.equal(['qr', 'al', 'ul']);
        expect(result.cleanedRaw.pages).to.deep.equal([]);
        expect(result.cleanedRaw.subPages).to.deep.equal([]);
        expect(result.plan.nothingToDo).to.equal(false);
    });

    it('assigns the navigation of a cardPower / cardChart reference to the migrated admin entry', () => {
        const chart: ShareConfig.ChartEntry = {
            card: 'cardChart',
            uniqueName: 'temp_chart',
            scriptName: 'temp',
            scriptNavigation: true,
            headline: 'Temperatur',
            hidden: false,
            alwaysOn: 'none',
        };
        const result = plan(
            baseConfig({
                pages: [gridPage('main'), page({ type: 'cardPower', uniqueName: 'power' })],
                subPages: [page({ type: 'cardLChart', uniqueName: 'temp', parent: 'main', heading: 'Temperatur' })],
            }),
            { pageConfig: [powerEntry('power'), chart] },
        );
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.card, p.navigation])).to.deep.equal([
            ['main', 'create', 'cardGrid', {}],
            ['power', 'assignNavigation', 'cardPower', { prev: 'main', next: '///unlock' }],
            ['temp', 'assignNavigation', 'cardChart', { parent: 'main' }],
        ]);
        expect(result.newPages.map(e => e.uniqueName)).to.deep.equal(['main']);
        const power = result.updatedPages.find(e => e.uniqueName === 'power') as ShareConfig.PowerEntry;
        expect(power.navigationAssignment).to.deep.equal([{ topic, navigation: { prev: 'main', next: '///unlock' } }]);
        expect(power.scriptNavigation).to.equal(undefined);
        expect(power.scriptName).to.equal('power');
        const updatedChart = result.updatedPages.find(e => e.uniqueName === 'temp_chart') as ShareConfig.ChartEntry;
        expect(updatedChart.navigationAssignment).to.deep.equal([{ topic, navigation: { parent: 'main' } }]);
        expect(updatedChart.scriptNavigation).to.equal(undefined);
        expect(result.removedFromScript).to.deep.equal(['main', 'power', 'temp']);
        expect(result.cleanedRaw.pages).to.deep.equal([]);
        expect(result.cleanedRaw.subPages).to.deep.equal([]);
    });

    it('reports a dead or missing cardPower / cardChart reference', () => {
        const result = plan(
            baseConfig({
                pages: [
                    page({ type: 'cardPower', uniqueName: 'navigated' }),
                    page({ type: 'cardChart', uniqueName: 'missing' }),
                ],
            }),
            { pageConfig: [powerEntry('navigated', { navigationAssignment: [{ topic: 'other', navigation: {} }] })] },
        );
        expect(result.plan.pages).to.deep.equal([
            {
                uniqueName: 'navigated',
                type: 'cardPower',
                card: 'cardPower',
                itemCount: 0,
                navigation: {},
                action: 'removeReference',
                reason: 'adminAlreadyNavigated',
            },
        ]);
        expect(result.plan.skipped).to.deep.equal([
            {
                uniqueName: 'missing',
                type: 'cardChart',
                reason: 'adminEntryMissing',
                detail: 'no admin entry with this name',
            },
        ]);
        expect(result.removedFromScript).to.deep.equal(['navigated']);
        expect(result.cleanedRaw.pages.map(p => p.uniqueName)).to.deep.equal(['missing']);
    });

    it('skips a cardPower / cardChart reference that changes the admin entry', () => {
        const result = plan(
            baseConfig({
                pages: [
                    page({ type: 'cardPower', uniqueName: 'p1', hiddenByTrigger: true }),
                    page({ type: 'cardPower', uniqueName: 'p2', items: [{ id: 'alias.0.Hue' }] }),
                    page({ type: 'cardPower', uniqueName: 'p3', alwaysOnDisplay: true }),
                    page({ type: 'cardPower', uniqueName: 'p4', alwaysOnDisplay: true, heading: 'ignored by power' }),
                ],
            }),
            {
                pageConfig: [
                    powerEntry('p1'),
                    powerEntry('p2'),
                    powerEntry('p3'),
                    powerEntry('p4', { alwaysOn: 'always' }),
                ],
            },
        );
        expect(result.plan.skipped.map(s => [s.uniqueName, s.detail])).to.deep.equal([
            ['p1', 'hiddenByTrigger: the admin entry is not hidden'],
            ['p2', 'items: the admin entry has no page items'],
            ['p3', 'alwaysOnDisplay: the admin entry is not always on'],
        ]);
        expect(result.plan.pages.map(p => p.uniqueName)).to.deep.equal(['p4']);
    });
});

describe('lib/configuration - planScriptToAdmin: page items', () => {
    /**
     * Plans one grid page with the given items.
     *
     * @param items Items of the script page.
     */
    function planItems(items: unknown[]): ScriptToAdminResult {
        return plan(baseConfig({ subPages: [page({ type: 'cardGrid', uniqueName: 'p', heading: 'P', items })] }));
    }

    it('is the inverse of convertAdminPageItemToPageItemConfig, prefix and suffix of the value kept in place', () => {
        const result = planItems([
            {
                id: 'alias.0.NSPanel.allgemein.Temperatur',
                name: 'Temp',
                icon: 'thermometer',
                icon2: 'thermometer-off',
                onColor: Red,
                offColor: Blue,
                colorScale: { val_min: 0, val_max: 40, val_best: 21, color_best: Red, mode: 'cie', log10: 'min' },
                fontSize: 2,
                unit: '°C',
                prefixValue: 'pre<',
                suffixValue: '>suf',
                useValue: true,
                inSel_Alias: '0_userdata.0.Green',
                modeList: ['a', 'b'],
                filter: 1,
                longPress: 'alias.0.Tests.button.SET',
                targetPageLongPress: 'lp',
                useValueConditions: 'val && val < 100',
                minValue: 5,
                maxValue: 90,
            },
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        const [item] = (result.newPages[0] as ShareConfig.MenuEntry).pageItems;
        expect(item).to.deep.equal({
            channelId: {
                valueStateId: 'alias.0.NSPanel.allgemein.Temperatur',
                unit: '°C',
                prefix: 'pre<',
                suffix: '>suf',
                dateFormat: '',
            },
            name: 'Temp',
            trueIcon: 'thermometer',
            falseIcon: 'thermometer-off',
            trueColor: '#ff0000',
            falseColor: '#0000ff',
            scale: {
                val_min: 0,
                val_max: 40,
                val_best: 21,
                color_best: { r: 255, g: 0, b: 0 },
                mode: 'cie',
                log10: 'min',
            },
            textSize: 2,
            useValue: true,
            inSel_Alias: '0_userdata.0.Green',
            modeList: ['a', 'b'],
            filter: 1,
            longPress: 'alias.0.Tests.button.SET',
            targetPageLongPress: 'lp',
            useValueConditions: 'val && val < 100',
            minValue: 5,
            maxValue: 90,
        });
    });

    it('puts prefixName / suffixName into the value entry, the name becomes its state id', () => {
        const result = planItems([
            { id: 'alias.0.Hue', name: 'Hue', prefixName: 'pre' },
            { id: 'alias.0.Hue', suffixName: 'suf' },
        ]);
        const items = (result.newPages[0] as ShareConfig.MenuEntry).pageItems;
        expect(items[0]).to.deep.equal({
            channelId: { valueStateId: 'alias.0.Hue', unit: '', prefix: '', suffix: '', dateFormat: '' },
            valueEntry: { valueStateId: 'Hue', unit: '', prefix: 'pre', suffix: '', dateFormat: '' },
        });
        expect(items[1]!.valueEntry).to.deep.equal({
            valueStateId: '',
            unit: '',
            prefix: '',
            suffix: 'suf',
            dateFormat: '',
        });
        expect(items[1]).to.not.have.property('name');
    });

    it('converts navigation and custom items', () => {
        const result = planItems([
            { navigate: true, targetPage: 'x', name: 'X', icon: 'home' },
            { navigate: true, targetPage: 'y', id: 'alias.0.Hue' },
            {
                type: 'custom',
                id: 'alias.0.Licht.lights.Gerät_1.ACTUAL',
                name: 'c',
                icon: 'water',
                onColor: Red,
                navigate: true,
                targetPage: 'z',
            },
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        const items = (result.newPages[0] as ShareConfig.MenuEntry).pageItems;
        expect(items[0]).to.deep.include({ isNavigation: true, targetPage: 'x', name: 'X', trueIcon: 'home' });
        expect(items[0]!.channelId.valueStateId).to.equal('');
        expect(items[1]).to.deep.include({ isNavigation: true, targetPage: 'y' });
        expect(items[1]!.channelId.valueStateId).to.equal('alias.0.Hue');
        expect(items[2]).to.deep.equal({
            channelId: {
                valueStateId: 'alias.0.Licht.lights.Gerät_1.ACTUAL',
                unit: '',
                prefix: '',
                suffix: '',
                dateFormat: '',
            },
            isNavigation: true,
            targetPage: 'z',
            type: 'custom',
            name: 'c',
            trueIcon: 'water',
            trueColor: '#ff0000',
        });
    });

    it('drops null items and items without id (the config manager gives them no place), keeps empty places', () => {
        const result = planItems([
            null,
            { id: 'empty' },
            { id: 'alias.0.Hue' },
            undefined,
            { id: 'delete' },
            { icon: 'home', name: 'no id' },
            { id: 'alias.0.Hue' },
            { id: 'empty' },
            { id: 'empty' },
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        const items = (result.newPages[0] as ShareConfig.MenuEntry).pageItems;
        expect(items.map(i => (i ? i.channelId.valueStateId : '-'))).to.deep.equal([
            '-',
            'alias.0.Hue',
            '-',
            'alias.0.Hue',
            'empty',
            'empty',
        ]);
        expect(result.plan.pages[0].itemCount, 'the trailing empty places do not count').to.equal(2);
    });

    it('takes an item the admin cannot express over as raw item (script format), naming item and field', () => {
        const cases: [unknown, string][] = [
            [{ id: 'alias.0.Hue', confirm: 'water' }, 'items[0].confirm: not available in the admin'],
            [{ id: 'alias.0.Hue', sliderItems: [] }, 'items[0].sliderItems: not available in the admin'],
            [{ id: 'alias.0.Hue', enabled: false }, 'items[0].enabled: not available in the admin'],
            [{ id: 'alias.0.Hue', role: 'light' }, 'items[0].role: not available in the admin'],
            [{ id: 'alias.0.Hue', useValueConditions: 5 }, 'items[0].useValueConditions: expected a text'],
            [{ id: 'alias.0.Hue', minValue: '0' }, 'items[0].minValue: expected a number'],
            [{ id: 'alias.0.Hue', maxValue: true }, 'items[0].maxValue: expected a number'],
            [{ id: 'alias.0.Hue', maxValue: Number.NaN }, 'items[0].maxValue: expected a number'],
            [{ type: 'custom', id: 'x', minValue: 1 }, 'items[0].minValue: not available in the admin'],
            [{ native: { template: 'x' } }, 'items[0]: native item'],
            [{ navigate: true }, 'items[0]: navigate without targetPage'],
            [{ type: 'custom', id: 'x', targetPage: 'p' }, 'items[0].targetPage: only used with navigate: true'],
            [
                { id: 'alias.0.Hue', onColor: 'red' },
                'items[0].onColor: only an RGB object {red, green, blue} can be converted',
            ],
            [
                { id: 'alias.0.Hue', colorScale: { valIcon_min: 0, valIcon_max: 1 } },
                'items[0].colorScale: only a color scale {val_min, val_max, ...} can be converted',
            ],
            [{ id: 'alias.0.Hue', fontSize: 7 }, 'items[0].fontSize: expected 0 to 5'],
            [
                {
                    id: 'alias.0.Hue',
                    colorScale: { val_min: 0, val_max: 1, color_best: 'green' },
                },
                'items[0].colorScale.color_best: only an RGB object {red, green, blue} can be converted',
            ],
            [
                { id: 'alias.0.Hue', modeList: [] },
                'items[0].modeList: expected a list of texts with at least one entry',
            ],
            [{ type: 'custom', id: 'x', fontSize: 1 }, 'items[0].fontSize: not available in the admin'],
            [{ type: 'custom', id: 'x', buttonText: 'b' }, 'items[0].buttonText: not available in the admin'],
            [{ type: 'other', id: 'x' }, 'items[0].type: unknown type'],
        ];
        for (const [item, detail] of cases) {
            const result = planItems([{ id: 'alias.0.Licht.lights.Gerät_1' }, item]);
            const expected = detail.replace('items[0]', 'items[1]');
            // the native item without further fields keeps its inner object (format native)
            const nativeOnly = !!item && typeof item === 'object' && 'native' in item;
            const format: ShareConfig.RawItemFormat = nativeOnly ? 'native' : 'script';
            expect(result.plan.skipped, JSON.stringify(item)).to.deep.equal([]);
            expect(result.plan.pages[0].rawItems, JSON.stringify(item)).to.deep.equal([
                { item: 'items[1]', format, detail: expected },
            ]);
            const entry = result.newPages[0] as ShareConfig.MenuEntry;
            expect(entry.pageItems[1]).to.deep.equal({
                channelId: ShareConfig.emptyChannelValueConfig(''),
                useNative: true,
                nativeFormat: format,
                native: nativeOnly ? item.native : item,
            });
            expect(result.cleanedRaw.subPages).to.have.length(0);
        }
    });

    it('drops item fields the config manager never reads', () => {
        const result = planItems([
            {
                id: 'alias.0.Hue',
                interpolateColor: true,
                inSel_ChoiceState: true,
                useColor: true,
                popupVersion: 2,
                uniqueName: 'u',
            },
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        expect((result.newPages[0] as ShareConfig.MenuEntry).pageItems[0]).to.deep.equal({
            channelId: { valueStateId: 'alias.0.Hue', unit: '', prefix: '', suffix: '', dateFormat: '' },
        });
    });

    it('drops an empty useValueConditions (the admin path hands an empty text on as undefined), keeps a range of 0', () => {
        const result = planItems([{ id: 'alias.0.Tests.Volume', useValueConditions: '', minValue: 0, maxValue: 100 }]);
        expect(result.plan.skipped).to.deep.equal([]);
        expect((result.newPages[0] as ShareConfig.MenuEntry).pageItems[0]).to.deep.equal({
            channelId: { valueStateId: 'alias.0.Tests.Volume', unit: '', prefix: '', suffix: '', dateFormat: '' },
            minValue: 0,
            maxValue: 100,
        });
    });

    it('takes over targetPage without navigate (button: pressed, then the page changes) - same runtime item as the script', async () => {
        const items = [
            { id: 'alias.0.Button', icon: 'restart', targetPage: 'p', targetPageLongPress: 'p' },
            { id: 'alias.0.Hue', targetPage: 'p' },
        ];
        const result = planItems(items);
        expect(result.plan.skipped).to.deep.equal([]);
        const pageItems = (result.newPages[0] as ShareConfig.MenuEntry).pageItems;
        expect(pageItems[0]).to.deep.equal({
            channelId: { valueStateId: 'alias.0.Button', unit: '', prefix: '', suffix: '', dateFormat: '' },
            targetPage: 'p',
            trueIcon: 'restart',
            targetPageLongPress: 'p',
        });
        expect(pageItems[0]?.isNavigation).to.equal(undefined);
        resetStatesController();
        const adapter = fakeAdapter([]);
        const converted = await adapter.convertAdminPageItemToPageItemConfig(
            pageItems[0],
            { card: 'cardGrid', uniqueName: 'p' },
            [],
        );
        expect(converted.error).to.equal(undefined);
        const json = JSON.stringify(converted.pageItem);
        expect(json, 'setNavi from targetPage').to.include('"setNavi":{"type":"const","constVal":"p"}');
        await expectEquivalent(
            baseConfig({ subPages: [page({ type: 'cardGrid', uniqueName: 'p', heading: 'P', items })] }),
        );
    });

    it('the prefix of the value in the admin goes before the value, the suffix behind it (prefixValue / suffixValue)', async () => {
        resetStatesController();
        const logs: LogEntry[] = [];
        const adapter = fakeAdapter(logs);
        const result = await adapter.convertAdminPageItemToPageItemConfig(
            {
                channelId: {
                    ...ShareConfig.emptyChannelValueConfig('alias.0.NSPanel.allgemein.Temperatur'),
                    prefix: 'pre<',
                    suffix: '>suf',
                },
            },
            { card: 'cardEntities', uniqueName: 'p' },
            [],
        );
        expect(result.error).to.equal(undefined);
        const json = JSON.stringify(result.pageItem);
        expect(json).to.include('"prefix":{"type":"const","constVal":"pre<"}');
        expect(json).to.include('"suffix":{"type":"const","constVal":">suf"}');
        // and the same on the script path, through the converter
        await expectEquivalent(
            baseConfig({
                subPages: [
                    page({
                        type: 'cardEntities',
                        uniqueName: 'e',
                        heading: 'E',
                        items: [
                            { id: 'alias.0.NSPanel.allgemein.Temperatur', prefixValue: 'pre<', suffixValue: '>suf' },
                        ],
                    }),
                ],
            }),
        );
    });

    it('useValueConditions, minValue and maxValue reach the runtime item over the admin path like over the script path', async () => {
        resetStatesController();
        const logs: LogEntry[] = [];
        const adapter = fakeAdapter(logs);
        const prePage = { card: 'cardGrid', uniqueName: 'p' };
        const volume = await adapter.convertAdminPageItemToPageItemConfig(
            { channelId: ShareConfig.emptyChannelValueConfig('alias.0.Tests.Volume'), minValue: 5, maxValue: 90 },
            prePage,
            [],
        );
        expect(volume.error).to.equal(undefined);
        const volumeData = (volume.pageItem as { data?: { minValue1?: unknown; maxValue1?: unknown } }).data;
        expect(volumeData?.minValue1).to.deep.equal({ type: 'const', constVal: 5 });
        expect(volumeData?.maxValue1).to.deep.equal({ type: 'const', constVal: 90 });

        // 0 counts as not set on both paths (truthy check of the config manager)
        const zero = await adapter.convertAdminPageItemToPageItemConfig(
            { channelId: ShareConfig.emptyChannelValueConfig('alias.0.Tests.Volume'), minValue: 0, maxValue: 0 },
            prePage,
            [],
        );
        const zeroData = (zero.pageItem as { data?: { minValue1?: unknown; maxValue1?: unknown } }).data;
        expect(zeroData?.minValue1).to.equal(undefined);
        expect(zeroData?.maxValue1).to.equal(undefined);

        type TextEntry = { data?: { icon?: { true?: { text?: { useValueConditions?: unknown } } } } };
        const info = await adapter.convertAdminPageItemToPageItemConfig(
            {
                channelId: ShareConfig.emptyChannelValueConfig('0_userdata.0.Einzelne_Geräte.Info'),
                useValueConditions: 'val && val < 100',
            },
            prePage,
            [],
        );
        expect(info.error).to.equal(undefined);
        expect((info.pageItem as TextEntry).data?.icon?.true?.text?.useValueConditions).to.deep.equal({
            type: 'const',
            constVal: 'val && val < 100',
        });
        const empty = await adapter.convertAdminPageItemToPageItemConfig(
            {
                channelId: ShareConfig.emptyChannelValueConfig('0_userdata.0.Einzelne_Geräte.Info'),
                useValueConditions: '',
            },
            prePage,
            [],
        );
        expect((empty.pageItem as TextEntry).data?.icon?.true?.text?.useValueConditions).to.equal(undefined);
    });
});

describe('lib/configuration - planScriptToAdmin: cardThermo2, cardThermo and cardMedia', () => {
    it('converts the circuits of a cardThermo2 page in both forms', () => {
        const result = plan(
            baseConfig({
                subPages: [
                    page({
                        type: 'cardThermo2',
                        uniqueName: 'heat',
                        heading: 'Heizung',
                        sortOrder: 'HM',
                        thermoItems: [
                            {
                                id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
                                name: 'Wohnzimmer',
                                name2: 'Kühlen',
                                minValue: 10,
                                maxValue: 25,
                                stepValue: 0.5,
                                icon: 'radiator',
                                onColor: Red,
                                unit: '°F',
                                iconHeatCycle2: 'snowflake',
                                iconHeatCycleOffColor2: Blue,
                                modeList: ['Aus', 'Heizen'],
                                power: '',
                            },
                            null,
                            {
                                set: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1.SET',
                                thermoId1: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1.ACTUAL',
                                modeId: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1.MODE',
                                unit: '°C',
                                icon2: '',
                            },
                        ],
                        items: [{ id: 'alias.0.NSPanel.allgemein.hue', filter: 0 }],
                    }),
                ],
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        const entry = result.newPages[0] as ShareConfig.Thermo2Entry;
        expect(entry).to.deep.include({ card: 'cardThermo2', headline: 'Heizung', sortOrder: 'HM' });
        expect(entry.thermoItems).to.deep.equal([
            {
                source: 'alias',
                channelId: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
                name: 'Wohnzimmer',
                name2: 'Kühlen',
                minValue: 10,
                maxValue: 25,
                stepValue: 0.5,
                icon: 'radiator',
                onColor: '#ff0000',
                unit: '°F',
                iconHeatCycle2: 'snowflake',
                iconHeatCycleOffColor2: '#0000ff',
                modeList: ['Aus', 'Heizen'],
            },
            {
                source: 'states',
                channelId: '',
                setState: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1.SET',
                actualState: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1.ACTUAL',
                modeState: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1.MODE',
                unit: '°C',
            },
        ]);
        expect(entry.pageItems[0]).to.deep.include({ filter: 0 });
    });

    it('skips a cardThermo2 page with a power state, an untrimmed text, a limit of 0 or an unknown sort order', () => {
        const circuit = { id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1' };
        const cases: [Record<string, unknown>, string][] = [
            [
                { thermoItems: [{ ...circuit, power: 'alias.0.P' }] },
                'thermoItems[0].power: the admin has no power state',
            ],
            [{ thermoItems: [{ ...circuit, name: ' x ' }] }, 'thermoItems[0].name: the admin trims the text'],
            [
                { thermoItems: [{ ...circuit, minValue: 0 }] },
                'thermoItems[0].minValue: the admin only takes positive numbers',
            ],
            [{ thermoItems: [circuit], sortOrder: 'X' }, 'sortOrder: unknown value'],
            [{ thermoItems: [{ set: 'a' }] }, 'thermoItems[0]: set and thermoId1 are required'],
        ];
        for (const [extra, detail] of cases) {
            const result = plan(
                baseConfig({
                    subPages: [page({ type: 'cardThermo2', uniqueName: 't', heading: 'T', items: [], ...extra })],
                }),
            );
            expect(result.plan.skipped, detail).to.deep.equal([
                { uniqueName: 't', type: 'cardThermo2', reason: 'fieldNotSupported', detail },
            ]);
        }
    });

    it('converts a classic cardThermo page: channel, unit and the limits unchanged, navigation like a sub page', () => {
        const result = plan(
            baseConfig({
                pages: [gridPage('main')],
                subPages: [
                    page({
                        type: 'cardThermo',
                        heading: 'Wohnzimmer',
                        uniqueName: 'Wohnzimmer_Thermostat',
                        subPage: true,
                        parent: 'main',
                        hiddenByTrigger: true,
                        items: [
                            {
                                id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
                                unit: '°C',
                                minValue: 100,
                                maxValue: 300,
                                stepValue: 1,
                            },
                        ],
                    }),
                ],
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages[1]).to.deep.include({
            uniqueName: 'Wohnzimmer_Thermostat',
            type: 'cardThermo',
            card: 'cardThermo',
            itemCount: 0,
            navigation: { parent: 'main' },
            action: 'create',
        });
        const entry = result.newPages[1];
        expect(entry).to.deep.equal({
            card: 'cardThermo',
            uniqueName: 'Wohnzimmer_Thermostat',
            headline: 'Wohnzimmer',
            channelId: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
            unit: '°C',
            minValue: 100,
            maxValue: 300,
            stepValue: 1,
            hidden: true,
            alwaysOn: 'none',
            navigationAssignment: [{ topic, navigation: { parent: 'main' } }],
        });
        expect(result.cleanedRaw.subPages).to.deep.equal([]);
    });

    it('drops the fields of a cardThermo item the adapter never reads and every further item', () => {
        const result = plan(
            baseConfig({
                subPages: [
                    page({
                        type: 'cardThermo',
                        heading: 'Bad',
                        uniqueName: 'bad',
                        items: [
                            {
                                id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
                                name: 'Bad',
                                icon: 'radiator',
                                onColor: Red,
                                popupThermoMode1: ['Auto', 'Manuell'],
                                popupThermoMode2: ['Tag', 'Nacht'],
                                popupThermoMode3: ['Komfort'],
                                popUpThermoName: ['Modus', 'Profil', 'Komfort'],
                                setThermoAlias: ['alias.0.Bad.MODE', 'alias.0.Bad.PROFILE', 'alias.0.Bad.COMFORT'],
                                setThermoDestTemp2: 'alias.0.Bad.SET2',
                                iconArray: ['fire', 'snowflake'],
                            },
                            { id: 'alias.0.Hue', confirm: 'water' },
                        ],
                    }),
                ],
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.newPages[0]).to.deep.equal({
            card: 'cardThermo',
            uniqueName: 'bad',
            headline: 'Bad',
            channelId: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1',
            hidden: false,
            alwaysOn: 'none',
            navigationAssignment: [{ topic, navigation: { home: 'main' } }],
        });
    });

    it('skips a cardThermo page only when the admin entry would build another page', () => {
        const id = 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1';
        const cases: [Record<string, unknown>, string][] = [
            [{ items: [] }, 'items: expected a list with the thermostat as first entry'],
            [{ items: undefined }, 'items: expected a list with the thermostat as first entry'],
            [{ items: ['x'] }, 'items[0]: expected an object'],
            [{ items: [{ native: { role: 'thermostat' } }] }, 'items[0]: native item'],
            [
                { items: [{ id, navigate: true, targetPage: 'main' }] },
                'items[0].navigate: the thermostat page has no navigation item',
            ],
            [{ items: [{ unit: '°C' }] }, 'items[0].id: missing'],
            [{ items: [{ id: ' ' }] }, 'items[0].id: the admin trims the text'],
            [{ items: [{ id, unit: 5 }] }, 'items[0].unit: expected a text'],
            [{ items: [{ id, unit: '' }] }, 'items[0].unit: empty - the admin shows the unit of the state instead'],
            [{ items: [{ id, unit: ' °C' }] }, 'items[0].unit: the admin trims the text'],
            [{ items: [{ id, minValue: '100' }] }, 'items[0].minValue: expected a number'],
            [{ items: [{ id, maxValue: Number.NaN }] }, 'items[0].maxValue: expected a number'],
            [{ items: [{ id, stepValue: true }] }, 'items[0].stepValue: expected a number'],
            [{ items: [{ id }], filterType: 1, foo: 1 }, 'page.foo: not available in the admin'],
        ];
        for (const [extra, detail] of cases) {
            const result = plan(
                baseConfig({ subPages: [page({ type: 'cardThermo', uniqueName: 't', heading: 'T', ...extra })] }),
            );
            expect(result.plan.skipped, detail).to.deep.equal([
                { uniqueName: 't', type: 'cardThermo', reason: 'fieldNotSupported', detail },
            ]);
            expect(result.cleanedRaw.subPages, detail).to.have.length(1);
        }
        // a limit of 0 or a negative number is passed on - the adapter decides what it means
        const zero = plan(
            baseConfig({
                subPages: [page({ type: 'cardThermo', uniqueName: 't', heading: 'T', items: [{ id, minValue: 0 }] })],
            }),
        );
        expect(zero.plan.skipped).to.deep.equal([]);
        expect(zero.newPages[0]).to.deep.include({ minValue: 0 });
    });

    it('converts the media object of a cardMedia page', () => {
        const result = plan(
            baseConfig({
                subPages: [
                    page({
                        type: 'cardMedia',
                        uniqueName: 'radio',
                        heading: 'Radio',
                        media: {
                            id: 'squeezeboxrpc.0.Players.Familienzimmer',
                            name: 'Küche',
                            minValue: 5,
                            maxValue: 60,
                            colorMediaIcon: Red,
                            speakerList: ['Bad', 'Küche'],
                            volumePresets: ['leise?10', 'laut?60'],
                            deactivateDefaultItems: { equalizer: true, clock: false },
                            itemsColorOn: { speakerList: Green },
                            itemsColorOff: { speakerList: Blue },
                        },
                        items: [],
                    }),
                ],
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        const entry = result.newPages[0] as ShareConfig.MediaEntry;
        expect(entry).to.deep.include({
            card: 'cardMedia',
            headline: 'Radio',
            mediaId: 'squeezeboxrpc.0.Players.Familienzimmer',
            name: 'Küche',
            minValue: 5,
            maxValue: 60,
            colorMediaIcon: '#ff0000',
            speakerList: ['Bad', 'Küche'],
            volumePresets: [
                { name: 'leise', value: 10 },
                { name: 'laut', value: 60 },
            ],
            toolbar: { equalizer: { enabled: false }, speakerList: { colorOn: '#00ff00', colorOff: '#0000ff' } },
        });
    });

    it('skips a cardMedia page the admin cannot express', () => {
        const media = { id: 'squeezeboxrpc.0.Players.Familienzimmer' };
        const cases: [Record<string, unknown>, string][] = [
            [
                { items: [{ id: 'alias.0.Tests.media', mediaDevice: 'x' }] },
                'media: missing (a cardMedia page without the media object)',
            ],
            [{ media: { ...media, mediaDevice: 'x' } }, 'media.mediaDevice: not available in the admin'],
            [{ media: { ...media, equalizerList: ['a'] } }, 'media.equalizerList: not available in the admin'],
            [
                { media: { ...media, minValue: 50, maxValue: 10 } },
                'media.minValue/maxValue: the admin swaps a reversed range',
            ],
            [
                { media: { ...media, volumePresets: ['laut?150'] } },
                "media.volumePresets: 'laut?150' - the admin rounds the value and keeps it between 0 and 100",
            ],
            [{ media: { ...media, speakerList: [' a'] } }, 'media.speakerList: expected trimmed, non-empty names'],
            [{ media: { ...media, playList: ['a', ''] } }, 'media.playList: expected trimmed, non-empty names'],
            [{ media: { ...media, favoriteList: 'a' } }, 'media.favoriteList: expected a list of names'],
            [
                { media: { ...media, volumePresets: [] } },
                'media.volumePresets: expected a list with at least one preset',
            ],
            [
                { media: { ...media, itemsColorOff: { volumePresets: Red } } },
                'media.itemsColorOff.volumePresets: not available in the admin',
            ],
        ];
        for (const [extra, detail] of cases) {
            const result = plan(
                baseConfig({
                    subPages: [page({ type: 'cardMedia', uniqueName: 'm', heading: 'M', items: [], ...extra })],
                }),
            );
            expect(result.plan.skipped, detail).to.deep.equal([
                { uniqueName: 'm', type: 'cardMedia', reason: 'fieldNotSupported', detail },
            ]);
        }
    });

    it('takes an empty name list of a cardMedia page as a missing field and deduplicates repeated names', () => {
        const media = { id: 'squeezeboxrpc.0.Players.Familienzimmer' };
        const convert = (extra: Record<string, unknown>): ShareConfig.MediaEntry => {
            const result = plan(
                baseConfig({
                    subPages: [
                        page({
                            type: 'cardMedia',
                            uniqueName: 'm',
                            heading: 'M',
                            items: [],
                            media: { ...media, ...extra },
                        }),
                    ],
                }),
            );
            expect(result.plan.skipped, JSON.stringify(extra)).to.deep.equal([]);
            expect(result.newPages.map(e => e.uniqueName)).to.deep.equal(['m']);
            const entry = result.newPages[0];
            if (entry.card !== 'cardMedia') {
                throw new Error(`expected a cardMedia entry, got ${entry.card}`);
            }
            return entry;
        };
        // the media tools take every device for [] as well as for a missing list - the admin writes no list
        const empty = convert({ speakerList: [], playList: [], favoriteList: [] });
        expect(empty).to.not.have.any.keys('speakerList', 'playList', 'favoriteList');
        expect(convert({}).speakerList).to.equal(undefined);
        // the tools match with includes, the admin builder deduplicates anyway
        expect(convert({ speakerList: ['a', 'a'] }).speakerList).to.deep.equal(['a']);
        expect(convert({ playList: ['x', 'y', 'x'] }).playList).to.deep.equal(['x', 'y']);
        expect(convert({ favoriteList: ['f'] }).favoriteList).to.deep.equal(['f']);
    });
});

describe('lib/configuration - planScriptToAdmin: screensaver', () => {
    it('builds the entry from the areas, writes the default colors of the script into the items', () => {
        const result = plan(templateConfig());
        const entry = result.screensaverEntry!;
        expect(result.plan.screensaver).to.deep.equal({
            name: panelName,
            mode: 'advanced',
            itemCount: 17,
            notifyCount: 0,
        });
        expect(entry).to.deep.include({
            name: panelName,
            mode: 'advanced',
            panels: [topic],
            weatherEntity: 'pirate-weather.0.',
            screensaverSwipe: false,
            screensaverIndicatorButtons: false,
        });
        expect(entry.favorit).to.deep.equal({
            state: '/^pirate-weather\\.0\\.weather\\.currently\\./',
            template: 'text.pirate-weather.favorit',
        });
        expect(entry.indicator[0]).to.deep.equal({
            state: 'alias.0.NSPanel.allgemein.Status_offene_Fenster.ACTUAL',
            headline: 'Fenster',
            iconOn: 'window-open-variant',
            iconOff: 'window-closed-variant',
            unit: '%',
            factor: 1,
            decimals: 0,
            colorScale: { val_min: 0, val_max: 1 },
            colorOn: '#fdd835',
            colorOff: '#fd8000',
        });
        // a fixed IconColor is the on color, a state becomes colorState
        expect(entry.left[1]).to.deep.include({ colorOn: '#ffeb9c', colorOff: '#fd8000' });
        expect(entry.left[2]).to.deep.include({
            colorState: '0_userdata.0.Abfallkalender.1.color',
            colorOff: '#fd8000',
        });
        expect(entry.left[2]).to.not.have.property('colorOn');
        expect(entry.left[2]!.dateFormat).to.deep.equal({ year: 'numeric', month: '2-digit', day: '2-digit' });
        expect(entry.bottom).to.have.length(6);
        expect(entry.mrIcon1).to.deep.equal({
            entity: 'Relay.1',
            iconOn: 'lightbulb',
            valueDecimals: 0,
            onColor: '#fdd835',
            offColor: '#44739e',
        });
        expect(entry.weatherAddDefaultItems).to.equal(undefined);
        expect(result.clearScreensaverInScript).to.equal(true);
        expect(result.cleanedRaw.indicatorScreensaverEntity).to.deep.equal([]);
        expect(result.cleanedRaw.leftScreensaverEntity).to.deep.equal([]);
        expect(result.cleanedRaw.bottomScreensaverEntity).to.deep.equal([]);
        expect(result.cleanedRaw.favoritScreensaverEntity).to.deep.equal([]);
        expect(result.cleanedRaw.mrIcon1ScreensaverEntity).to.deep.include({ ScreensaverEntity: null });
    });

    it('takes the screensaver version from the input, the weather entity from the instance and the weather items', () => {
        const result = plan(
            {
                ...templateConfig(),
                weatherAddDefaultItems: { sunriseSet: true, windSpeed: false },
                advancedOptions: { screensaverSwipe: true },
            },
            { screensaverMode: 'standard', instanceWeatherEntity: 'openweathermap.0' },
        );
        expect(result.screensaverEntry).to.deep.include({
            mode: 'standard',
            weatherAddDefaultItems: { sunriseSet: true },
            screensaverSwipe: true,
        });
        expect(result.screensaverEntry).to.not.have.property('weatherEntity');
        const all = plan({ ...templateConfig(), weatherAddDefaultItems: true });
        expect(Object.keys(all.screensaverEntry!.weatherAddDefaultItems!)).to.have.length(12);
    });

    it('converts the notifications into the shared list and references them', () => {
        const result = plan(nsPanel6Config(), {
            screensaverNotify: [{ id: 'old', enabled: ['x'] }],
            notifyIdFactory: existing => `id${existing.length}`,
        });
        // the indicator with a state as on color has no admin field - it is taken over as raw item
        expect(result.plan.screensaverSkipped).to.equal(undefined);
        expect(result.plan.screensaver!.rawItems).to.deep.equal([
            {
                item: 'indicator[4]',
                format: 'script',
                detail: 'indicator[4].ScreensaverEntityOnColor: the admin takes a fixed color only',
            },
        ]);
        expect(result.screensaverEntry!.indicator[4]!.raw!.format).to.equal('script');
        const config = nsPanel6Config();
        config.indicatorScreensaverEntity.pop();
        const ok = plan(config, {
            screensaverNotify: [{ id: 'old', enabled: ['x'] }],
            notifyIdFactory: existing => `id${existing.length}`,
        });
        expect(ok.newNotify).to.deep.equal([
            {
                id: 'id1',
                name: `${panelName} 1`,
                enabled: ['0_userdata.0.NotityficationTest', '0_userdata.0.NotityficationTest2'],
                priority: 2,
                headline: 'test2',
                text: 'text2',
            },
            {
                id: 'id2',
                name: `${panelName} 2`,
                enabled: ['0_userdata.0.number'],
                visibleCondition: 'val > 9',
                priority: 1,
                headline: '0_userdata.0.number',
                text: '0_userdata.0.number',
                headlinePrefix: 'Hohe Zahl: ',
                textPrefix: 'Im Datenpunkt steht die Zahl ',
                textSuffix: '. Bis dahin kannst du nicht zählen. Frag deine Mama!',
                dismissible: true,
                dismissibleId: 'TestNotify',
                buzzer: true,
            },
        ]);
        expect(ok.screensaverEntry!.notify).to.deep.equal(['id1', 'id2']);
        expect(ok.plan.screensaver!.notifyCount).to.equal(2);
        expect(ok.screensaverEntry!.indicator[0]).to.deep.include({ enabled: '0_userdata.0.number1' });
        expect(ok.screensaverEntry!.indicator[1]).to.deep.include({ colorState: '0_userdata.0.RGB' });
        expect(ok.cleanedRaw.notifyScreensaverEntity).to.equal(undefined);
    });

    it('skips the screensaver when the panel already has one, when it is empty or when an element cannot be placed', () => {
        const exists = plan(templateConfig(), {
            screensaverConfig: [{ name: 'x', mode: 'standard', panels: [topic], left: [], bottom: [], indicator: [] }],
        });
        expect(exists.plan.screensaverSkipped).to.deep.equal({ reason: 'screensaverExists' });
        expect(exists.screensaverEntry).to.equal(undefined);
        expect(exists.clearScreensaverInScript).to.equal(false);

        const empty = plan(
            baseConfig({ mrIcon1ScreensaverEntity: mrIcon(null), mrIcon2ScreensaverEntity: mrIcon(null) }),
        );
        expect(empty.plan.screensaverSkipped).to.deep.equal({ reason: 'screensaverEmpty' });
        expect(empty.plan.nothingToDo).to.equal(true);

        const item = templateConfig().leftScreensaverEntity[0] as Extract<
            ScriptConfig.ScreenSaverElement,
            { type: 'script' }
        >;
        const cases: [Partial<ScriptConfig.Config>, string][] = [
            [
                { mrIcon1ScreensaverEntity: mrIcon(null) },
                'mrIcon1ScreensaverEntity: without state and value - the script shows the off icon, the admin shows nothing',
            ],
            // the admin places a raw item by its area - an element the config manager places elsewhere stays
            [
                { leftScreensaverEntity: [{ type: 'native', native: {} }] },
                'left[0].native.modeScr: undefined differs from the area left',
            ],
            [
                { leftScreensaverEntity: [{ type: 'native', native: { modeScr: 'bottom' } }] },
                'left[0].native.modeScr: bottom differs from the area left',
            ],
            [{ favoritScreensaverEntity: [item, item] }, 'favorit: the admin takes one item'],
            [
                { bottomScreensaverEntity: [{ type: 'template', template: 't', dpInit: 'x', modeScr: 'favorit' }] },
                'bottom[0].modeScr: favorit differs from the area bottom',
            ],
            [
                { notifyScreensaverEntity: [{ type: 'script', Priority: 1, Headline: 'h', Text: 't' }] },
                'notifyScreensaverEntity[0].Enabled: expected one or more trimmed state ids',
            ],
            [{ nativePageItems: [{}] }, 'nativePageItems: not available in the admin'],
        ];
        for (const [partial, detail] of cases) {
            const result = plan(baseConfig(partial));
            expect(result.plan.screensaverSkipped, detail).to.deep.equal({
                reason: 'screensaverItemNotSupported',
                detail,
            });
            expect(result.screensaverEntry).to.equal(undefined);
            expect(result.cleanedRaw.mrIcon1ScreensaverEntity, 'script untouched').to.deep.equal(
                baseConfig(partial).mrIcon1ScreensaverEntity,
            );
        }
    });

    it('takes an element the admin cannot express over as raw item, the default colors of the script written in', () => {
        const item = templateConfig().leftScreensaverEntity[0] as Extract<
            ScriptConfig.ScreenSaverElement,
            { type: 'script' }
        >;
        const cases: [typeof item, string][] = [
            [{ ...item, ScreensaverEntityText: '' }, 'empty - the admin shows the name of the state'],
            [{ ...item, ScreensaverEntityIconOn: null }, 'empty - the admin adds a default icon'],
            [
                { ...item, ScreensaverEntityOffColor: null as unknown as ScriptConfig.RGB },
                'null (no off color) is not available in the admin',
            ],
            [{ ...item, ScreensaverEntityFillIfBelowMin: false }, 'not available in the admin'],
            [{ ...item, ScreensaverEntityEnabled: ['a'] as unknown as string }, 'expected a state id'],
        ];
        const red = { red: 200, green: 0, blue: 0 };
        const blue = { red: 0, green: 0, blue: 200 };
        for (const [element, detail] of cases) {
            const result = plan(
                baseConfig({ leftScreensaverEntity: [element], defaultOnColor: red, defaultOffColor: blue }),
            );
            expect(result.plan.screensaverSkipped, detail).to.equal(undefined);
            const rawItems = result.plan.screensaver!.rawItems!;
            expect(rawItems.map(r => [r.item, r.format])).to.deep.equal([['left[0]', 'script']]);
            expect(rawItems[0].detail).to.contain(detail);
            const stored = result.screensaverEntry!.left[0]!;
            expect(stored.raw!.format).to.equal('script');
            // the script element, without own colors the default colors of the script (the admin screensaver
            // resolves a missing color to the adapter default)
            expect(stored.raw!.config).to.deep.equal({
                ScreensaverEntityOnColor: item.ScreensaverEntityOnColor ?? red,
                ...element,
                ...(element.ScreensaverEntityOffColor === undefined ? { ScreensaverEntityOffColor: blue } : {}),
            });
        }
    });

    it('takes a native element with nothing but template, dpInit and modeScr as template item', () => {
        const native = { template: 'text.window.isOpen', dpInit: 'alias.0.Fenster', modeScr: 'bottom' };
        const result = plan(baseConfig({ bottomScreensaverEntity: [{ type: 'native', native }] }));
        expect(result.plan.screensaverSkipped).to.equal(undefined);
        expect(result.plan.screensaver!.rawItems).to.equal(undefined);
        expect(result.screensaverEntry!.bottom).to.deep.equal([
            { state: 'alias.0.Fenster', template: 'text.window.isOpen' },
        ]);
        // enabled is resolved for a template element only - the native element stays raw
        const withEnabled = plan(
            baseConfig({ bottomScreensaverEntity: [{ type: 'native', native: { ...native, enabled: 'x.0.y' } }] }),
        );
        expect(withEnabled.screensaverEntry!.bottom[0]!.raw!.format).to.equal('native');
    });

    it('takes a native element over as raw item with its runtime item (format native)', () => {
        const favorit: ScriptConfig.ScreenSaverElement = {
            type: 'native',
            native: {
                template: 'text.brightsky.favorit',
                dpInit: '/^brightsky\\.0\\.current.+/',
                modeScr: 'favorit',
                data: { entity2: { value: { type: 'triggered', dp: 'x.0.temp' } } },
            },
        };
        const result = plan(baseConfig({ favoritScreensaverEntity: [favorit] }));
        expect(result.plan.screensaverSkipped).to.equal(undefined);
        expect(result.plan.screensaver!.rawItems).to.deep.equal([
            { item: 'favorit[0]', format: 'native', detail: 'favorit[0]: native element' },
        ]);
        expect(result.screensaverEntry!.favorit).to.deep.equal({
            state: '',
            raw: { format: 'native', config: (favorit as { native: Record<string, unknown> }).native },
        });
        expect(result.clearScreensaverInScript).to.equal(true);
    });

    it('keeps the indicator action with the priority of the config manager', () => {
        const base = templateConfig().indicatorScreensaverEntity[0] as Extract<
            ScriptConfig.ScreenSaverElement,
            { type: 'script' }
        >;
        const result = plan(
            baseConfig({
                indicatorScreensaverEntity: [
                    {
                        ...base,
                        ScreensaverEntitySwitch: 'alias.0.Tests.button.SET',
                        ScreensaverEntityNaviToPage: 'main',
                    },
                    { ...base, ScreensaverEntityNaviToPage: 'main' },
                    null,
                    { ...base, ScreensaverEntityButton: 'alias.0.Tests.button.SET', ScreensaverEntitySwitch: 'x' },
                ],
                leftScreensaverEntity: [{ ...base, ScreensaverEntityButton: 'ignored outside the indicator' }],
            }),
        );
        const entry = result.screensaverEntry!;
        expect(entry.indicator.map(i => i?.action)).to.deep.equal([
            { kind: 'switch', state: 'alias.0.Tests.button.SET' },
            { kind: 'navigate', page: 'main' },
            undefined,
            { kind: 'button', state: 'alias.0.Tests.button.SET' },
        ]);
        expect(entry.left[0]).to.not.have.property('action');
    });
});

describe('lib/configuration - planScriptToAdmin: buttons', () => {
    it('converts the buttons of the script when the admin has none', () => {
        const result = plan(
            baseConfig({
                buttonLeft: { mode: 'page', page: 'main' },
                buttonRight: { mode: 'buttonOnDelayOff', state: 'alias.0.Tests.button.SET', delay: 2 },
            }),
        );
        expect(result.buttons).to.deep.equal({
            left: { mode: 'page', page: 'main' },
            right: { mode: 'buttonOnDelayOff', state: 'alias.0.Tests.button.SET', delay: 2 },
        });
        expect(result.plan.buttons).to.deep.equal(result.buttons);
        expect(result.plan.buttonsSkipped).to.deep.equal([]);
        expect(result.clearButtonsInScript).to.deep.equal(['left', 'right']);
        expect(result.cleanedRaw.buttonLeft).to.equal(null);
        expect(result.cleanedRaw.buttonRight).to.equal(null);
        expect(result.plan.nothingToDo).to.equal(false);
    });

    it('leaves a button alone that the admin has configured (also as "no action") or that is not valid', () => {
        const result = plan(
            baseConfig({
                buttonLeft: { mode: 'switch', state: 'alias.0.Tests.button.SET' },
                buttonRight: { mode: 'dance', state: 'alias.0.Tests.button.SET' },
            }),
            { panel: { name: panelName, topic, buttonLeft: null } },
        );
        expect(result.buttons).to.deep.equal({});
        expect(result.plan.buttonsSkipped).to.deep.equal([
            { side: 'left', reason: 'buttonConfigured' },
            { side: 'right', reason: 'buttonNotSupported', detail: 'not a valid button action' },
        ]);
        expect(result.clearButtonsInScript).to.deep.equal([]);
        expect(result.cleanedRaw.buttonLeft).to.deep.equal({ mode: 'switch', state: 'alias.0.Tests.button.SET' });
        // a wrong type or a state id that ends with a dot is no empty button - still not valid
        for (const button of [{ mode: 'switch', state: 5 }, { mode: 'switch', state: 'alias.0.' }, 'switch']) {
            const invalid = plan(baseConfig({ buttonLeft: button }));
            expect(invalid.plan.buttonsSkipped, JSON.stringify(button)).to.deep.equal([
                { side: 'left', reason: 'buttonNotSupported', detail: 'not a valid button action' },
            ]);
        }
        const nothing = plan(
            baseConfig({ mrIcon1ScreensaverEntity: mrIcon(null), mrIcon2ScreensaverEntity: mrIcon(null) }),
        );
        expect(nothing.plan.buttonsSkipped).to.deep.equal([]);
        expect(nothing.plan.nothingToDo).to.equal(true);
    });

    it('treats the empty button of the template as not configured - nothing converted, nothing reported', () => {
        // the config manager fails isButton for these, logs "wrong configured" and sets no action: same as null
        const empty = [
            [
                { mode: 'switch', state: '' },
                { mode: 'page', page: '' },
            ],
            [{ mode: 'button' }, { mode: 'page', page: null }],
            [
                { mode: 'buttonOnDelayOff', state: null },
                { mode: 'buttonDelayOn', state: '' },
            ],
        ];
        for (const [buttonLeft, buttonRight] of empty) {
            const result = plan(
                baseConfig({
                    buttonLeft,
                    buttonRight,
                    mrIcon1ScreensaverEntity: mrIcon(null),
                    mrIcon2ScreensaverEntity: mrIcon(null),
                }),
            );
            const label = JSON.stringify([buttonLeft, buttonRight]);
            expect(result.buttons, label).to.deep.equal({});
            expect(result.plan.buttons, label).to.deep.equal({});
            expect(result.plan.buttonsSkipped, label).to.deep.equal([]);
            expect(result.clearButtonsInScript, label).to.deep.equal([]);
            // the script is not touched without a take-over
            expect(result.cleanedRaw.buttonLeft, label).to.deep.equal(buttonLeft);
            expect(result.cleanedRaw.buttonRight, label).to.deep.equal(buttonRight);
            expect(result.plan.nothingToDo, label).to.equal(true);
        }
        // an empty button on one side does not hide a real one on the other side
        const mixed = plan(
            baseConfig({
                buttonLeft: { mode: 'switch', state: '' },
                buttonRight: { mode: 'switch', state: 'alias.0.Tests.button.SET' },
            }),
        );
        expect(mixed.buttons).to.deep.equal({ right: { mode: 'switch', state: 'alias.0.Tests.button.SET' } });
        expect(mixed.plan.buttonsSkipped).to.deep.equal([]);
        expect(mixed.clearButtonsInScript).to.deep.equal(['right']);
        expect(mixed.cleanedRaw.buttonLeft).to.deep.equal({ mode: 'switch', state: '' });
        expect(mixed.cleanedRaw.buttonRight).to.equal(null);
    });
});

/* ---------------------------------------------------------------------------------------------
 * equivalence: script path == admin path
 * ------------------------------------------------------------------------------------------- */

describe('lib/configuration - planScriptToAdmin: equivalence of the runtime pages', function () {
    this.timeout(60_000);

    it('test configuration of the adapter (src/lib/const/test.ts)', async () => {
        const config = {
            ...baseConfig(),
            ...(structuredClone(testScriptConfig) as unknown as Partial<ScriptConfig.Config>),
        };
        config.panelTopic = topic;
        const result = await expectEquivalent(config);
        expect(result.plan.pages.map(p => [p.uniqueName, p.action])).to.deep.equal([
            ['main', 'create'],
            ['grid1', 'create'],
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.screensaver).to.not.equal(undefined);
        expect(result.plan.buttons).to.deep.equal({ left: { mode: 'page', page: 'main' } });
        expectIdempotent(result);
    });

    it('raw items: native page item, item with confirm, native favorit - same runtime pages over both paths', async () => {
        const config = baseConfig({
            subPages: [
                page({
                    type: 'cardGrid',
                    uniqueName: 'raw',
                    heading: 'Raw',
                    items: [
                        // Roborock: native page item without further fields - format native
                        { native: { dpInit: 'roborock.0.Devices.X', template: 'text.roborock.status' } },
                        // confirm has no admin field - format script with the unchanged item
                        { id: 'alias.0.Licht.lights.Gerät_1', confirm: 'water' },
                        // native item with navigation - fields next to native, format script
                        { native: { type: 'button', data: {} }, navigate: true, targetPage: 'main' },
                        { id: 'alias.0.Licht.lights.Gerät_1' },
                    ],
                }),
            ],
            favoritScreensaverEntity: [
                {
                    type: 'native',
                    native: {
                        template: 'text.brightsky.favorit',
                        dpInit: '/^brightsky\\.0\\.current.+/',
                        modeScr: 'favorit',
                        data: { entity2: { value: { type: 'triggered', dp: 'x.0.temp' } } },
                    },
                },
            ],
        });
        const result = await expectEquivalent(config);
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.rawItems])).to.deep.equal([
            [
                'raw',
                'create',
                [
                    { item: 'items[0]', format: 'native', detail: 'items[0]: native item' },
                    { item: 'items[1]', format: 'script', detail: 'items[1].confirm: not available in the admin' },
                    { item: 'items[2]', format: 'script', detail: 'items[2]: native item' },
                ],
            ],
        ]);
        const entry = result.newPages[0] as ShareConfig.MenuEntry;
        expect(entry.pageItems[0]).to.deep.equal({
            channelId: ShareConfig.emptyChannelValueConfig(''),
            useNative: true,
            nativeFormat: 'native',
            native: { dpInit: 'roborock.0.Devices.X', template: 'text.roborock.status' },
        });
        expect(entry.pageItems[2]!.native).to.deep.equal({
            native: { type: 'button', data: {} },
            navigate: true,
            targetPage: 'main',
        });
        expect(result.plan.screensaverSkipped).to.equal(undefined);
        expect(result.screensaverEntry!.favorit!.raw!.format).to.equal('native');
        expectIdempotent(result);
    });

    it('script template (script/example_sendTo_script_iobroker.ts)', async () => {
        const result = await expectEquivalent(templateConfig());
        expect(result.plan.pages.map(p => p.uniqueName)).to.deep.equal(['main']);
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.screensaver!.itemCount).to.equal(17);
        expectIdempotent(result);
    });

    it('real script ns_panel4 (icon test: grid, grid2, navigation items)', async () => {
        const result = await expectEquivalent(nsPanel4Config());
        expect(result.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['main', {}],
            ['newicons', { prev: 'main' }],
            ['newicons2', { prev: 'newicons' }],
            ['iconcheck', { prev: 'newicons2', next: '///unlock' }],
        ]);
        expect(result.plan.skipped).to.deep.equal([]);
        expectIdempotent(result);
    });

    it('real script nspanel6 (media, thermo2, power reference, native item, sub pages)', async () => {
        const overrides: Partial<ScriptToAdminInput> = {
            pageConfig: [powerEntry('powerpage')],
            screensaverMode: 'standard',
        };
        const result = await expectEquivalent(nsPanel6Config(), overrides);
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.navigation])).to.deep.equal([
            ['main', 'create', {}],
            ['main22', 'create', { prev: 'main' }],
            ['powerpage', 'assignNavigation', { prev: 'main22' }],
            ['cardThermo2', 'create', { prev: 'powerpage' }],
            // subgrid2 holds the volume item with minValue / maxValue - the admin takes them
            ['subgrid2', 'create', { prev: 'cardThermo2', next: '///unlock' }],
            ['testrole', 'create', { home: 'hidden', parent: 'cardGrid1' }],
            ['hidden', 'create', { home: 'main' }],
        ]);
        // the item with confirm and the native item are taken over as raw items - same runtime pages (above)
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages.filter(p => p.rawItems).map(p => [p.uniqueName, p.rawItems])).to.deep.equal([
            [
                'cardThermo2',
                [
                    { item: 'items[1]', format: 'script', detail: 'items[1].confirm: not available in the admin' },
                    {
                        item: 'items[10]',
                        format: 'script',
                        detail: 'items[10].sliderItems: not available in the admin',
                    },
                ],
            ],
            ['testrole', [{ item: 'items[0]', format: 'native', detail: 'items[0]: native item' }]],
        ]);
        // the indicator with a state as on color is a raw item as well (see the rules above)
        expect(result.plan.screensaverSkipped).to.equal(undefined);
        expect(result.plan.screensaver!.rawItems!.map(r => r.item)).to.deep.equal(['indicator[4]']);
        expect(result.plan.buttons).to.deep.equal({ left: { mode: 'page', page: 'main' } });
        expectIdempotent(result, overrides);
    });

    it('real script skriptconfig4 (grid / entities with color scales, thermo pages, QR reference, legacy media)', async () => {
        const result = await expectEquivalent(skriptconfig4Config(), { screensaverMode: 'standard' });
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.navigation])).to.deep.equal([
            ['main', 'create', {}],
            ['SensorGrid3', 'create', { prev: 'main' }],
            ['SensorGrid', 'create', { prev: 'SensorGrid3', next: '///unlock' }],
            ['qrCode', 'removeReference', {}],
            ['this_Thermostat', 'create', { parent: 'main' }],
            ['drei', 'create', { parent: 'Only4' }],
            ['Kueche_Thermostat', 'create', { parent: 'SensorGrid' }],
            ['WohnzimmerWindow', 'create', { parent: 'ObergeschossWindow' }],
            ['ObergeschossWindow', 'create', { parent: 'Only4' }],
            ['WindowGrid', 'create', { home: 'main' }],
            ['Only4', 'create', { parent: 'main' }],
            ['ogLightsGrid', 'create', { parent: 'Only4' }],
        ]);
        // the thermo pages: channel and limits taken over unchanged (tenths of a degree: 10 to 30 °C in 0.1 steps)
        const thermoEntries = result.newPages.filter((e): e is ShareConfig.ThermoEntry => e.card === 'cardThermo');
        expect(thermoEntries.map(e => [e.uniqueName, e.headline, e.channelId])).to.deep.equal([
            ['this_Thermostat', 'Wohnzimmer', 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1'],
            ['Kueche_Thermostat', 'Küche', 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1'],
        ]);
        expect(thermoEntries[0]).to.deep.include({ minValue: 100, maxValue: 300, stepValue: 1 });
        expect(thermoEntries[0].unit).to.equal(undefined);
        expect(result.plan.skipped).to.deep.equal([
            {
                uniqueName: '14',
                type: 'cardMedia',
                reason: 'fieldNotSupported',
                detail: 'media: missing (a cardMedia page without the media object)',
            },
        ]);
        expect(result.plan.screensaver).to.deep.include({ mode: 'standard', itemCount: 4 });
        // the item without id and navigation of the main page is dropped - it has no place at runtime
        expect(result.plan.pages[0].itemCount).to.equal(14);
        expectIdempotent(result, { screensaverMode: 'standard' });
    });

    it('start page stored as main_<panel>: the runtime page main of the panel equals the script page', async () => {
        const mainOfOther: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'main',
            headline: 'other',
            pageItems: [{ channelId: ShareConfig.emptyChannelValueConfig('alias.0.Hue') }],
            navigationAssignment: [{ topic: 'other', navigation: {} }],
        };
        const result = await expectEquivalent(nsPanel4Config(), { pageConfig: [mainOfOther] });
        expect(result.plan.pages[0]).to.deep.include({ uniqueName: 'main', storedAs: 'main_Testpanel' });
        expect(result.updatedPages.map(e => e.uniqueName)).to.deep.equal([
            'main',
            'main_Testpanel',
            'newicons',
            'newicons2',
            'iconcheck',
        ]);
        expectIdempotent(result, { pageConfig: [mainOfOther] });
    });

    it('empty places inside and at the end of a page', async () => {
        const result = await expectEquivalent(
            baseConfig({
                pages: [
                    page({
                        type: 'cardGrid',
                        uniqueName: 'main',
                        heading: 'Plätze',
                        items: [
                            { id: 'empty' },
                            { id: 'alias.0.Hue' },
                            null,
                            { id: 'delete' },
                            { id: 'alias.0.Licht.lights.Gerät_1' },
                            { id: 'empty' },
                        ],
                    }),
                ],
                mrIcon1ScreensaverEntity: mrIcon(null),
                mrIcon2ScreensaverEntity: mrIcon(null),
            }),
        );
        expect(result.plan.pages[0].itemCount).to.equal(2);
        expectIdempotent(result);
    });

    it('volume range and value condition of page items', async () => {
        const result = await expectEquivalent(
            baseConfig({
                pages: [
                    page({
                        type: 'cardGrid',
                        uniqueName: 'main',
                        heading: 'Volume',
                        items: [
                            {
                                id: '0_userdata.0.Einzelne_Geräte.volume',
                                name: 'Volume',
                                minValue: 0,
                                maxValue: 100,
                                navigate: true,
                                targetPage: 'hidden',
                            },
                            { id: 'alias.0.Tests.Volume', minValue: 5, maxValue: 90 },
                            {
                                id: '0_userdata.0.Einzelne_Geräte.Info',
                                useValue: true,
                                useValueConditions: 'val && val < 100',
                            },
                            { id: 'alias.0.NSPanel.allgemein.Temperatur', useValueConditions: 'val > 20' },
                        ],
                    }),
                    page({ type: 'cardGrid', uniqueName: 'hidden', heading: 'Hidden', items: [] }),
                ],
                mrIcon1ScreensaverEntity: mrIcon(null),
                mrIcon2ScreensaverEntity: mrIcon(null),
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages[0].itemCount).to.equal(4);
        expectIdempotent(result);
    });

    it('a media item generates its media page on the admin path like on the script path', async () => {
        const mediaPage = 'media-alias.0.Tests.media';
        const config = baseConfig({
            pages: [
                page({
                    type: 'cardGrid',
                    uniqueName: 'main',
                    heading: 'Media',
                    items: [{ id: 'alias.0.Tests.media' }, { id: 'alias.0.Licht.lights.Gerät_1' }],
                }),
            ],
            mrIcon1ScreensaverEntity: mrIcon(null),
            mrIcon2ScreensaverEntity: mrIcon(null),
        });
        const result = await expectEquivalent(config);
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages[0].itemCount).to.equal(2);
        expectIdempotent(result);

        // the generated page itself and its navigation node are the same on both paths
        const script = await runScript(config);
        const admin = await runAdmin(result);
        const scriptMedia = script.pages.find(p => p.uniqueID === mediaPage);
        const adminMedia = admin.pages.find(p => p.uniqueID === mediaPage);
        expect(scriptMedia?.config?.card, 'script path generates the page').to.equal('cardMedia');
        expect(differences(normalizePage(adminMedia), normalizePage(scriptMedia)), 'generated page').to.deep.equal([]);
        const nodeOf = (run: ScriptRun): NavigationItemConfig | undefined =>
            run.navigation.find(n => n?.name === mediaPage);
        expect(nodeOf(admin)).to.deep.equal(nodeOf(script));
        expect(nodeOf(admin)?.left).to.deep.equal({ double: 'main' });
    });
});

/* ---------------------------------------------------------------------------------------------
 * navigation of the panel before and after the conversion (the emu panel of the dev server)
 * ------------------------------------------------------------------------------------------- */

describe('lib/configuration - planScriptToAdmin: navigation of the panel stays the same', function () {
    this.timeout(60_000);

    type Links = { prev?: string; next?: string; parent?: string; home?: string };
    type Ring = Record<string, Links>;

    /**
     * The navigation nodes as a ring: prev / next (single press) and parent / home (double press) per
     * page, the service nodes left out.
     *
     * @param navigation Navigation of the panel.
     */
    function ringOf(navigation: readonly NavigationItemConfig[]): Ring {
        // the way into the service menu counts (the ends of the ring), other system nodes do not
        const link = (target: string | undefined): string | undefined =>
            target === undefined || (target.startsWith('///') && target !== ShareConfig.serviceNodeName)
                ? undefined
                : target;
        const ring: Ring = {};
        for (const node of navigation) {
            if (!node || node.name.startsWith('///')) {
                continue;
            }
            const entry: Links = {};
            const values: [keyof Links, string | undefined][] = [
                ['prev', link(node.left?.single)],
                ['next', link(node.right?.single)],
                ['parent', link(node.left?.double)],
                ['home', link(node.right?.double)],
            ];
            for (const [key, value] of values) {
                if (value !== undefined) {
                    entry[key] = value;
                }
            }
            ring[node.name] = entry;
        }
        return ring;
    }

    /**
     * Builds the navigation of the panel like `Panel.preInit`: the script ring first, the admin pages on top.
     *
     * @param config Script configuration.
     * @param pageConfig Admin page configuration.
     * @param screensaverConfig Admin screensaver table.
     * @param screensaverNotify Admin notification list.
     */
    async function navigationOf(
        config: ScriptConfig.Config,
        pageConfig: ShareConfig.PageConfigEntry[],
        screensaverConfig: ShareConfig.ScreensaverEntry[] = [],
        screensaverNotify: ShareConfig.ScreensaverNotifyConfig[] = [],
    ): Promise<Ring> {
        const script = await runScript(config, { pageConfig });
        const logs: LogEntry[] = [];
        const adapter = fakeAdapter(logs, {
            pageConfig: structuredClone(pageConfig),
            screensaverConfig: structuredClone(screensaverConfig),
            screensaverNotify: structuredClone(screensaverNotify),
        });
        const option = {
            name: panelName,
            topic,
            pages: script.pages,
            navigation: script.navigation,
            globalPageIds: script.globalPageIds,
        };
        // like Panel.preInit: the default start page before the admin pages are merged
        ensureMainPage(option, panelName);
        await new AdminConfiguration(adapter).processentrys(option as never);
        expect(
            logs.filter(l => l[0] === 'error'),
            'errors of the admin path',
        ).to.deep.equal([]);
        return ringOf(option.navigation);
    }

    /**
     * The ring after the conversion of a script configuration.
     *
     * @param config Script configuration.
     * @param pageConfig Admin page configuration before the conversion.
     */
    async function ringAfter(
        config: ScriptConfig.Config,
        pageConfig: ShareConfig.PageConfigEntry[] = [],
    ): Promise<Ring> {
        const result = plan(config, { pageConfig, screensaverMode: 'standard' });
        return navigationOf(
            result.cleanedRaw,
            result.updatedPages,
            result.screensaverEntry ? [result.screensaverEntry] : [],
            result.newNotify,
        );
    }

    /** the emu panel: 14 script pages, three admin pages chained after main, a dead power reference */
    function emuConfig(): ScriptConfig.Config {
        const entities = (uniqueName: string): ScriptConfig.PageType =>
            page({
                type: 'cardEntities',
                uniqueName,
                heading: uniqueName,
                // confirm has no admin field - the page stays in the script
                items: [{ id: 'alias.0.Licht.lights.Gerät_1', confirm: 'water' }],
            });
        return baseConfig({
            scriptName: 'script.js.nspanel-lovelace-ui_0.emu',
            pages: [
                gridPage('main'),
                gridPage('newicons'),
                gridPage('newicons2'),
                gridPage('iconcheck'),
                entities('entities1'),
                entities('entities2'),
                gridPage('grid6'),
                gridPage('popups'),
                gridPage('grid3'),
                gridPage('grid3b'),
                page({
                    type: 'cardThermo',
                    uniqueName: 'thermo',
                    heading: 'Thermo',
                    items: [{ id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1' }],
                }),
                gridPage('schedule', { type: 'cardSchedule' }),
                page({ type: 'cardPower', uniqueName: 'powerpage' }),
                gridPage('adminpages'),
            ],
        });
    }

    /** the admin pages of the emu panel: Unlock1 -> chart -> testAbfall hooked after main, powerpage dead */
    function emuPageConfig(): ShareConfig.PageConfigEntry[] {
        const nav = (prev: string): ShareConfig.NavigationAssignmentList => [{ topic, navigation: { prev } }];
        return [
            {
                card: 'cardAlarm',
                uniqueName: 'Unlock1',
                headline: 'Unlock',
                button1: '',
                button2: '',
                button3: '',
                button4: '',
                button5: '',
                button6: '',
                button7: '',
                button8: '',
                pin: 1234,
                navigationAssignment: nav('main'),
            },
            { ...ShareConfig.emptyChartEntry('chart'), navigationAssignment: nav('Unlock1') },
            {
                card: 'cardGrid',
                uniqueName: 'testAbfall',
                headline: 'Abfall',
                pageItems: [],
                navigationAssignment: nav('chart'),
            },
            // the old power page of this panel, meanwhile navigated in the admin for another panel only
            powerEntry('powerpage', {
                scriptNavigation: undefined,
                navigationAssignment: [{ topic: 'other', navigation: {} }],
            }),
        ];
    }

    it('reproduces the ring of the emu panel after the conversion, the dead power reference healed', async () => {
        const before = await navigationOf(emuConfig(), emuPageConfig());
        // the ends of the ring lead into the service menu
        expect(before.main).to.deep.equal({ prev: '///service', next: 'Unlock1' });
        expect(before.entities1).to.deep.equal({ prev: 'iconcheck', next: 'entities2' });
        expect(before.testAbfall).to.deep.equal({ prev: 'chart', next: 'newicons' });
        expect(before.schedule).to.deep.equal({ prev: 'thermo', next: 'powerpage' });
        expect(before.adminpages).to.deep.equal({ prev: 'powerpage', next: '///service' });

        const result = plan(emuConfig(), { pageConfig: emuPageConfig(), screensaverMode: 'standard' });
        // entities1 / entities2 hold an item with confirm - taken over as raw item, the pages are converted
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages.filter(p => p.rawItems).map(p => p.uniqueName)).to.deep.equal([
            'entities1',
            'entities2',
        ]);
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.navigation])).to.deep.equal([
            ['main', 'create', {}],
            ['newicons', 'create', { prev: 'main' }],
            ['newicons2', 'create', { prev: 'newicons' }],
            ['iconcheck', 'create', { prev: 'newicons2' }],
            ['entities1', 'create', { prev: 'iconcheck' }],
            ['entities2', 'create', { prev: 'entities1' }],
            ['grid6', 'create', { prev: 'entities2' }],
            ['popups', 'create', { prev: 'grid6' }],
            ['grid3', 'create', { prev: 'popups' }],
            ['grid3b', 'create', { prev: 'grid3' }],
            ['thermo', 'create', { prev: 'grid3b' }],
            ['schedule', 'create', { prev: 'thermo' }],
            ['powerpage', 'removeReference', {}],
            ['adminpages', 'create', { prev: 'schedule', next: '///unlock' }],
        ]);

        const after = await navigationOf(
            result.cleanedRaw,
            result.updatedPages,
            result.screensaverEntry ? [result.screensaverEntry] : [],
            result.newNotify,
        );
        const expected: Ring = structuredClone(before);
        delete expected.powerpage;
        expected.schedule = { prev: 'thermo', next: 'adminpages' };
        expected.adminpages = { prev: 'schedule', next: '///service' };
        expect(after).to.deep.equal(expected);
    });

    it('keeps a shortcut page of the admin out of the back link of its target (U1)', async () => {
        // settings lies in the script ring behind p5; the admin page P {prev: main, next: settings} is a
        // shortcut - settings keeps p5 as predecessor
        const config = baseConfig({ pages: ['main', 'p1', 'p2', 'p3', 'p4', 'p5', 'settings'].map(n => gridPage(n)) });
        const shortcut: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'P',
            headline: 'P',
            pageItems: [],
            navigationAssignment: [{ topic, navigation: { prev: 'main', next: 'settings' } }],
        };
        const ring = await navigationOf(config, [shortcut]);
        expect(ring.P).to.deep.equal({ prev: 'main', next: 'settings' });
        expect(ring.settings).to.deep.equal({ prev: 'p5', next: '///service' });
        expect(ring.main).to.deep.equal({ prev: '///service', next: 'P' });
        // the old successor of main keeps its predecessor as well - P is a shortcut, not a link in the ring
        expect(ring.p1).to.deep.equal({ prev: 'main', next: 'p2' });
    });

    it('keeps the first page behind the default start page when the script has no main (U5)', async () => {
        const config = baseConfig({ pages: [gridPage('p1'), gridPage('p2'), gridPage('p3')] });
        const before = await navigationOf(config, []);
        expect(before.main).to.deep.equal({ prev: '///service', next: 'p1' });
        expect(before.p1).to.deep.equal({ prev: 'main', next: 'p2' });
        const result = plan(config, { screensaverMode: 'standard' });
        expect(result.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['p1', { prev: 'main' }],
            ['p2', { prev: 'p1' }],
            ['p3', { prev: 'p2', next: '///unlock' }],
        ]);
        expect(await ringAfter(config)).to.deep.equal(before);
    });

    it('drops the double-press link the config manager ignores on a sub page (B5)', async () => {
        const config = baseConfig({
            pages: [gridPage('main'), gridPage('a'), gridPage('b')],
            subPages: [
                gridPage('s0'),
                gridPage('s1', { prev: 's0', parent: 'main' }),
                gridPage('s2', { next: 'b', home: 'main' }),
                gridPage('s3', { parent: 'a', home: 'b' }),
            ],
        });
        const before = await navigationOf(config, []);
        expect(before.s1).to.deep.equal({ prev: 's0' });
        expect(before.s2).to.deep.equal({ next: 'b' });
        expect(before.s3).to.deep.equal({ parent: 'a', home: 'b' });
        const result = plan(config, { screensaverMode: 'standard' });
        expect(result.plan.pages.filter(p => p.uniqueName.startsWith('s')).map(p => p.navigation)).to.deep.equal([
            { home: 'main' },
            { prev: 's0' },
            { next: 'b' },
            { parent: 'a', home: 'b' },
        ]);
        const after = await ringAfter(config);
        expect(after.s1).to.deep.equal(before.s1);
        // a page with `next` only is spliced before its target by the admin and inherits the old
        // predecessor of the target (applyPendingNavigations step 5) - the double-press link stays away
        expect(after.s2).to.deep.equal({ prev: 'a', next: 'b' });
        expect(after.s3).to.deep.equal(before.s3);
    });

    it('generates the media page of a media item on an admin page, parent = the admin page, read-only', async () => {
        const logs: LogEntry[] = [];
        const mediaPage = 'media-alias.0.Tests.media';
        const menu = (uniqueName: string, item: ShareConfig.AdminPageItemConfig): ShareConfig.MenuEntry => ({
            card: 'cardGrid',
            uniqueName,
            headline: uniqueName,
            pageItems: [item],
            navigationAssignment: [{ topic, navigation: {} }],
        });
        const adapter = fakeAdapter(logs, {
            pageConfig: [
                menu('wohnen', { channelId: ShareConfig.emptyChannelValueConfig('alias.0.Tests.media') }),
                // a raw item in the script format with the same media channel: same generated page, first one stays
                menu('raw', {
                    channelId: ShareConfig.emptyChannelValueConfig(''),
                    useNative: true,
                    nativeFormat: 'script',
                    native: { id: 'alias.0.Tests.media' },
                }),
            ],
        });
        resetStatesController();
        const option: {
            name: string;
            topic: string;
            pages: PageBase[];
            navigation: NavigationItemConfig[];
            generatedPageIds?: string[];
        } = {
            name: panelName,
            topic,
            pages: [],
            navigation: [],
        };
        await new AdminConfiguration(adapter).processentrys(option as never);
        expect(logs.filter(l => l[0] === 'error' || l[0] === 'warn')).to.deep.equal([]);
        const generated = option.pages.filter(p => p.uniqueID === mediaPage);
        expect(generated).to.have.length(1);
        expect(generated[0].config?.card).to.equal('cardMedia');
        expect(option.generatedPageIds).to.deep.equal([mediaPage]);
        const nodes = option.navigation.filter(n => n?.name === mediaPage);
        expect(nodes).to.have.length(1);
        expect(nodes[0]?.left).to.deep.equal({ double: 'wohnen' });
        expect(nodes[0]?.right).to.equal(undefined);
        // the items of both pages lead there
        for (const id of ['wohnen', 'raw']) {
            const json = JSON.stringify(option.pages.find(p => p.uniqueID === id)?.pageItems);
            expect(json, `item of ${id}`).to.include(`"setNavi":{"type":"const","constVal":"${mediaPage}"}`);
        }
    });

    it('keeps a page of the panel with the name of a generated media page', async () => {
        const logs: LogEntry[] = [];
        const mediaPage = 'media-alias.0.Tests.media';
        const adapter = fakeAdapter(logs, {
            pageConfig: [
                {
                    card: 'cardGrid',
                    uniqueName: 'wohnen',
                    headline: 'wohnen',
                    pageItems: [{ channelId: ShareConfig.emptyChannelValueConfig('alias.0.Tests.media') }],
                    navigationAssignment: [{ topic, navigation: {} }],
                } satisfies ShareConfig.MenuEntry,
            ],
        });
        resetStatesController();
        const own = {
            uniqueID: mediaPage,
            dpInit: '',
            alwaysOn: 'none',
            config: { card: 'cardGrid', data: {} },
            pageItems: [],
        } as unknown as PageBase;
        const option: {
            name: string;
            topic: string;
            pages: PageBase[];
            navigation: NavigationItemConfig[];
            generatedPageIds?: string[];
        } = {
            name: panelName,
            topic,
            pages: [own],
            navigation: [{ name: mediaPage, page: mediaPage, left: undefined, right: undefined }],
        };
        await new AdminConfiguration(adapter).processentrys(option as never);
        expect(option.pages.filter(p => p.uniqueID === mediaPage)).to.deep.equal([own]);
        expect(option.generatedPageIds).to.equal(undefined);
        const warnings = logs.filter(l => l[1].includes('already exists')).map(l => l[1]);
        expect(warnings).to.have.length(1);
        expect(warnings[0]).to.include(`Page '${mediaPage}' generated by a page item of page 'wohnen' already exists`);
    });

    it('does not replace the screensaver or a generated page by an admin page of the same name (U2)', async () => {
        const logs: LogEntry[] = [];
        const entry = (uniqueName: string): ShareConfig.MenuEntry => ({
            card: 'cardGrid',
            uniqueName,
            headline: uniqueName,
            pageItems: [],
            navigationAssignment: [{ topic, navigation: {} }],
        });
        const adapter = fakeAdapter(logs, { pageConfig: [entry('scr'), entry('media-x'), entry('foreign')] });
        const scriptPage = (uniqueID: string, card: string): PageBase =>
            ({
                uniqueID,
                dpInit: '',
                alwaysOn: 'none',
                config: { card, data: {} },
                pageItems: [],
            }) as unknown as PageBase;
        const option = {
            name: panelName,
            topic,
            pages: [
                scriptPage('scr', 'screensaver'),
                scriptPage('media-x', 'cardMedia'),
                scriptPage('foreign', 'cardGrid'),
            ],
            navigation: [] as NavigationItemConfig[],
            generatedPageIds: ['media-x'],
        };
        await new AdminConfiguration(adapter).processentrys(option as never);
        const headlineOf = (id: string): unknown =>
            (option.pages.find(p => p.uniqueID === id)?.config as { data?: { headline?: unknown } } | undefined)?.data
                ?.headline;
        expect(option.pages.filter(p => p.uniqueID === 'scr')).to.have.length(1);
        expect(headlineOf('scr'), 'screensaver kept').to.equal(undefined);
        expect(option.pages.filter(p => p.uniqueID === 'media-x')).to.have.length(1);
        expect(headlineOf('media-x'), 'generated page kept').to.equal(undefined);
        expect(option.pages.filter(p => p.uniqueID === 'foreign')).to.have.length(1);
        expect(headlineOf('foreign'), 'page of another panel replaced').to.deep.equal({
            type: 'const',
            constVal: 'foreign',
        });
        expect(logs.filter(l => l[1].includes('already exists')).map(l => l[1])).to.have.length(2);
    });

    it('keeps the ring when only some pages in the middle are converted', async () => {
        const config = baseConfig({
            pages: [
                gridPage('main'),
                gridPage('a'),
                gridPage('b', { heading: '' }),
                gridPage('c'),
                gridPage('d', { heading: '' }),
            ],
        });
        const before = await navigationOf(config, []);
        const result = plan(config, { screensaverMode: 'standard' });
        expect(result.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['main', {}],
            ['a', { prev: 'main', next: 'b' }],
            ['c', { prev: 'b', next: 'd' }],
        ]);
        const after = await navigationOf(
            result.cleanedRaw,
            result.updatedPages,
            [result.screensaverEntry!],
            result.newNotify,
        );
        expect(after).to.deep.equal(before);
    });
    it('keeps the ring when a global page is taken over - no provisional home from the global sub page node', async () => {
        const global: ScriptConfig.globalPagesConfig = {
            version: '0.21.6',
            type: 'globalConfig',
            subPages: [gridPage('g')],
        };
        const meta = 'nspanel-lovelace-ui.0';
        const saved = DB.objects[meta];
        DB.objects[meta] = { _id: meta, type: 'meta', common: {}, native: { globalConfigRaw: global } } as never;
        try {
            // panel A: g in the middle of the ring, panel B: g on the last place
            for (const pages of [
                [gridPage('main'), page({ globalLink: 'g' }), gridPage('a')],
                [gridPage('main'), gridPage('a'), page({ globalLink: 'g' })],
            ]) {
                const config = baseConfig({ pages });
                const before = await navigationOf(config, []);
                const result = plan(config, { screensaverMode: 'standard', globalConfigRaw: global });
                expect(result.plan.pages.map(p => p.uniqueName)).to.include('g');
                const after = await navigationOf(
                    result.cleanedRaw,
                    result.updatedPages,
                    result.screensaverEntry ? [result.screensaverEntry] : [],
                    result.newNotify,
                );
                expect(after).to.deep.equal(before);
                expect(after.g.home, 'no home link').to.equal(undefined);
            }
        } finally {
            if (saved) {
                DB.objects[meta] = saved;
            } else {
                delete DB.objects[meta];
            }
        }
    });

    it('keeps the way into the service menu at both ends of the ring', async () => {
        const skippedPage = (name: string): ScriptConfig.PageType => gridPage(name, { heading: '' });
        const cases: [string, ScriptConfig.PageType[]][] = [
            ['ring converted completely', [gridPage('main'), gridPage('a'), gridPage('b')]],
            ['only the end converted', [gridPage('main'), skippedPage('a'), gridPage('b')]],
            ['the end stays in the script', [gridPage('main'), gridPage('a'), skippedPage('b')]],
            ['the start page stays in the script', [skippedPage('main'), gridPage('a'), gridPage('b')]],
            ['a ring of the start page only', [gridPage('main')]],
            ['a ring of one page without start page', [gridPage('p')]],
        ];
        for (const [name, pages] of cases) {
            const config = baseConfig({ pages });
            const before = await navigationOf(config, []);
            const after = await ringAfter(config);
            expect(after, name).to.deep.equal(before);
            // exactly one way into the service menu on each side
            const right = Object.values(after).filter(l => l.next === ShareConfig.serviceNodeName);
            const left = Object.values(after).filter(l => l.prev === ShareConfig.serviceNodeName);
            expect([left.length, right.length], name).to.deep.equal([1, 1]);
        }
    });
});

/* ---------------------------------------------------------------------------------------------
 * global script
 * ------------------------------------------------------------------------------------------- */

describe('lib/configuration - planScriptToAdmin: pages of the global script', function () {
    this.timeout(60_000);

    /**
     * A global script configuration.
     *
     * @param subPages Its pages.
     * @param extra Further fields.
     */
    function globalRaw(
        subPages: ScriptConfig.PageType[],
        extra: Partial<ScriptConfig.globalPagesConfig> = {},
    ): ScriptConfig.globalPagesConfig {
        return { version: '0.21.6', type: 'globalConfig', subPages, ...extra };
    }

    const otherPanel = { name: 'Other', topic: 'nspanel/other' };

    it('converts linked, renamed and unlinked global pages with the links of this panel', () => {
        const global = globalRaw([gridPage('g1'), gridPage('g2', { next: 'g1' }), gridPage('g9')]);
        const globalBefore = structuredClone(global);
        const result = plan(
            baseConfig({
                pages: [gridPage('main'), page({ globalLink: 'g1' }), page({ globalLink: 'g2', uniqueName: 'y' })],
            }),
            { globalConfigRaw: global },
        );
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.global === true, p.navigation])).to.deep.equal([
            ['main', 'create', false, {}],
            ['g1', 'create', true, { prev: 'main' }],
            // renamed through the link: an admin entry of its own
            ['y', 'create', true, { prev: 'g1', next: '///unlock' }],
            // unlinked global sub pages every panel gets (g2 is only renamed for this panel, so it stays global)
            ['g2', 'create', true, { next: 'g1' }],
            ['g9', 'create', true, { home: 'main' }],
        ]);
        expect((result.newPages.find(e => e.uniqueName === 'y') as ShareConfig.MenuEntry).headline).to.equal(
            'Seite g2',
        );
        // only the links of the panel script go - the unlinked pages have nothing to remove there
        expect(result.removedFromScript).to.deep.equal(['main', 'g1', 'y']);
        expect(result.cleanedRaw.pages).to.deep.equal([]);
        expect(result.plan.conflicts).to.equal(undefined);
        expect(global, 'global configuration unchanged').to.deep.equal(globalBefore);
    });

    it('keeps the old rule without global configuration: a link is skipped', () => {
        const result = plan(baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1' })] }));
        expect(result.plan.skipped.map(s => [s.uniqueName, s.type, s.reason])).to.deep.equal([
            ['g1', 'globalLink', 'unsupportedPageType'],
        ]);
    });

    it('uses the ring order the runtime sees: a global page inserted behind its prev', () => {
        const result = plan(
            baseConfig({
                pages: [page({ globalLink: 'g1' }), gridPage('main'), gridPage('a')],
            }),
            { globalConfigRaw: globalRaw([gridPage('g1', { next: 'g2' }), gridPage('g2')]) },
        );
        // runtime ring: main, g1, g2, a (main moves to the front)
        expect(result.plan.pages.map(p => [p.uniqueName, p.navigation])).to.deep.equal([
            ['g1', { prev: 'main' }],
            ['g2', { prev: 'g1' }],
            ['main', {}],
            ['a', { prev: 'g2', next: '///unlock' }],
        ]);
        // g2 is not in the panel script - only the link of g1 goes
        expect(result.removedFromScript).to.deep.equal(['g1', 'main', 'a']);
    });

    it('only assigns this panel to an identical admin entry another panel took over - no message', () => {
        const global = globalRaw([gridPage('g1')]);
        const config = baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1' })] });
        const first = plan(baseConfig({ ...config, panelTopic: otherPanel.topic }), {
            panel: otherPanel,
            globalConfigRaw: global,
        });
        const second = plan(config, {
            globalConfigRaw: global,
            pageConfig: first.updatedPages.filter(e => e.uniqueName === 'g1'),
        });
        expect(second.plan.skipped).to.deep.equal([]);
        expect(second.plan.conflicts).to.equal(undefined);
        const g1 = second.plan.pages.find(p => p.uniqueName === 'g1');
        expect(g1).to.deep.include({ action: 'assignNavigation', global: true, existing: 'identical' });
        const entry = second.updatedPages.find(e => e.uniqueName === 'g1');
        expect(entry?.navigationAssignment).to.deep.equal([
            { topic: otherPanel.topic, navigation: { prev: 'main', next: '///unlock' } },
            { topic, navigation: { prev: 'main', next: '///unlock' } },
        ]);
        expect(second.newPages.map(e => e.uniqueName)).to.deep.equal(['main']);
        expect(second.removedFromScript).to.deep.equal(['main', 'g1']);
    });

    it('reports a different admin entry as conflict and follows the decision', () => {
        const global = globalRaw([gridPage('g1')]);
        const config = baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1' })] });
        const existing: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'g1',
            headline: 'Admin',
            pageItems: [],
            hidden: false,
            alwaysOn: 'none',
            navigationAssignment: [{ topic: otherPanel.topic, navigation: { home: 'main' } }],
        };
        const run = (decision?: ShareConfig.ConvertGlobalDecision): ScriptToAdminResult =>
            plan(config, {
                globalConfigRaw: global,
                pageConfig: [existing],
                ...(decision ? { globalDecisions: { g1: decision } } : {}),
            });
        const ownAssignment = { topic, navigation: { prev: 'main', next: '///unlock' } };

        // default: keep the admin content, assign the panel
        const keep = run();
        expect(keep.plan.conflicts).to.deep.equal([
            {
                uniqueName: 'g1',
                type: 'cardGrid',
                card: 'cardGrid',
                decision: 'keepAdmin',
                assignedPanels: [otherPanel.topic],
                differences: ['headline', 'pageItems'],
            },
        ]);
        expect(keep.plan.pages.find(p => p.uniqueName === 'g1')).to.deep.include({
            action: 'assignNavigation',
            existing: 'keepAdmin',
        });
        expect(keep.updatedPages.find(e => e.uniqueName === 'g1')).to.deep.equal({
            ...existing,
            navigationAssignment: [...existing.navigationAssignment!, ownAssignment],
        });
        expect(keep.cleanedRaw.pages).to.deep.equal([]);
        expect(run('keepAdmin').updatedPages).to.deep.equal(keep.updatedPages);

        // take the script: content replaced, the other assignment stays
        const take = run('takeScript');
        expect(take.plan.conflicts?.[0].decision).to.equal('takeScript');
        expect(take.plan.pages.find(p => p.uniqueName === 'g1')).to.deep.include({
            action: 'create',
            existing: 'takeScript',
        });
        const taken = take.updatedPages.find(e => e.uniqueName === 'g1') as ShareConfig.MenuEntry;
        expect(taken.headline).to.equal('Seite g1');
        expect(taken.pageItems).to.have.length(1);
        expect(taken.navigationAssignment).to.deep.equal([existing.navigationAssignment![0], ownAssignment]);
        expect(take.newPages.map(e => e.uniqueName)).to.deep.equal(['main']);

        // skip: nothing changes, the link stays in the script
        const skipped = run('skip');
        expect(skipped.plan.conflicts?.[0].decision).to.equal('skip');
        expect(skipped.plan.skipped).to.deep.equal([
            {
                uniqueName: 'g1',
                type: 'cardGrid',
                reason: 'nameExists',
                detail: 'the page of the global script differs from the admin entry - skipped by choice',
            },
        ]);
        expect(skipped.updatedPages.find(e => e.uniqueName === 'g1')).to.deep.equal(existing);
        expect(skipped.removedFromScript).to.deep.equal(['main']);
        expect(skipped.cleanedRaw.pages).to.deep.equal([page({ globalLink: 'g1' })]);
    });

    it('keeps the rule for pages of the panel script: an existing name is skipped', () => {
        const existing: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'a',
            headline: 'Seite a',
            pageItems: [],
        };
        const result = plan(baseConfig({ subPages: [gridPage('a')] }), {
            globalConfigRaw: globalRaw([]),
            pageConfig: [existing],
        });
        expect(result.plan.skipped).to.deep.equal([{ uniqueName: 'a', type: 'cardGrid', reason: 'nameExists' }]);
        expect(result.plan.conflicts).to.equal(undefined);
    });

    it('leaves a global page alone that the admin already shows on this panel', () => {
        const existing: ShareConfig.MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'g1',
            headline: 'Admin',
            pageItems: [],
            navigationAssignment: [{ topic, navigation: { home: 'main' } }],
        };
        const result = plan(baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1' })] }), {
            globalConfigRaw: globalRaw([gridPage('g1'), gridPage('g9')]),
            pageConfig: [existing, { ...existing, uniqueName: 'g9' }],
        });
        // the link is a dead reference now, the unlinked g9 has nothing to do
        expect(result.plan.pages.map(p => [p.uniqueName, p.action, p.reason])).to.deep.equal([
            ['main', 'create', undefined],
            ['g1', 'removeReference', 'adminAlreadyNavigated'],
        ]);
        expect(result.plan.conflicts).to.equal(undefined);
        expect(result.cleanedRaw.pages).to.deep.equal([]);
    });

    it('keeps the navigation and the native page items of the global script as obstacles', () => {
        const result = plan(baseConfig({ pages: [gridPage('main')] }), {
            globalConfigRaw: globalRaw([gridPage('g9')], {
                navigation: [{ name: 'g9', page: 'g9', left: { single: 'main' } }] as never,
                nativePageItems: [{ uniqueID: 'n1' }],
            }),
        });
        expect(result.plan.skipped).to.deep.equal([
            {
                uniqueName: 'g9',
                type: 'cardGrid',
                reason: 'fieldNotSupported',
                detail: 'navigation: the script overrides the links of the page',
            },
        ]);
        expect(result.plan.screensaverSkipped).to.deep.equal({
            reason: 'screensaverItemNotSupported',
            detail: 'nativePageItems: not available in the admin',
        });
    });

    it('skips the navigation copies of a renamed global page and the page itself', () => {
        const result = plan(baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1', uniqueName: 'y' })] }), {
            globalConfigRaw: globalRaw([
                gridPage('g1', { items: [{ navigate: true, targetPage: 'g2' }] }),
                gridPage('g2'),
            ]),
        });
        expect(result.plan.skipped.map(s => [s.uniqueName, s.reason])).to.deep.equal([
            ['y', 'fieldNotSupported'],
            ['y_g2_copy_nav_0', 'fieldNotSupported'],
        ]);
        expect(result.removedFromScript).to.deep.equal(['main']);
    });

    it('is idempotent: the cleaned script against the extended admin finds nothing to do', () => {
        const global = globalRaw([gridPage('g1'), gridPage('g9')]);
        const result = plan(baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1' })] }), {
            globalConfigRaw: global,
        });
        expectIdempotent(result, { globalConfigRaw: global });
    });

    it('builds the same runtime pages from the converted global pages', async () => {
        const global = globalRaw([gridPage('g1'), gridPage('g9')]);
        // the config manager reads the global configuration from the meta object
        const meta = 'nspanel-lovelace-ui.0';
        const before = DB.objects[meta];
        DB.objects[meta] = { _id: meta, type: 'meta', common: {}, native: { globalConfigRaw: global } } as never;
        try {
            const result = await expectEquivalent(
                baseConfig({ pages: [gridPage('main'), page({ globalLink: 'g1', heading: 'Panel heading' })] }),
                { globalConfigRaw: global },
            );
            expect(result.plan.pages.map(p => p.uniqueName)).to.deep.equal(['main', 'g1', 'g9']);
            expect((result.newPages[1] as ShareConfig.MenuEntry).headline).to.equal('Panel heading');
        } finally {
            if (before) {
                DB.objects[meta] = before;
            } else {
                delete DB.objects[meta];
            }
        }
    });
});

describe('lib/configuration - planScriptToAdmin: cardThermo without heading', function () {
    this.timeout(60_000);

    it('takes the headline thermostat the runtime shows - the panel looks the same', async () => {
        const thermo = (extra: Record<string, unknown>): ScriptConfig.PageType =>
            page({
                type: 'cardThermo',
                uniqueName: 't',
                items: [{ id: 'alias.0.NSPanel.1.usr.Temperatur.G.Wohnzimmer.1' }],
                ...extra,
            });
        for (const config of [
            baseConfig({ subPages: [thermo({})] }),
            baseConfig({ subPages: [thermo({ heading: '' })] }),
        ]) {
            const result = await expectEquivalent(config);
            expect(result.plan.skipped).to.deep.equal([]);
            expect(result.newPages[0]).to.deep.include({ card: 'cardThermo', headline: 'thermostat' });
        }
        // a state id stays an obstacle, other page types keep the empty heading as obstacle
        const blocked = plan(
            baseConfig({ subPages: [thermo({ heading: 'alias.0.Headline.ACTUAL' }), gridPage('g', { heading: '' })] }),
        );
        expect(blocked.plan.skipped.map(s => [s.uniqueName, s.detail])).to.deep.equal([
            ['t', 'heading: looks like a state id - the admin shows the text itself'],
            ['g', 'heading: empty - the admin shows the uniqueName instead'],
        ]);
    });
});

describe('lib/configuration - planScriptToAdmin: secondRow, light ranges and colormode', function () {
    this.timeout(60_000);

    const items = (): Record<string, unknown>[] => [
        { id: 'alias.0.NSPanel.allgemein.shutter', secondRow: 'Zweite Zeile' },
        { id: '0_userdata.0.Einzelne_Geräte.dimmer', minValueBrightness: 10, maxValueBrightness: 80, colormode: 'rgb' },
        {
            id: 'alias.0.NSPanel.allgemein.hue',
            minValueBrightness: 0,
            maxValueBrightness: 90,
            minValueColorTemp: 2700,
            maxValueColorTemp: 0,
            colormode: 'xy',
        },
        { id: 'alias.0.Licht.rgbSingle', secondRow: '', colormode: '' },
    ];

    it('takes the fields over, drops 0 / empty (the runtime reads them as not set), colormode as switch', () => {
        const result = plan(
            baseConfig({ subPages: [page({ type: 'cardGrid', uniqueName: 'p', heading: 'P', items: items() })] }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        const converted = (result.newPages[0] as ShareConfig.MenuEntry).pageItems.map(i => {
            const { channelId: _channelId, ...rest } = i ?? { channelId: undefined };
            return rest;
        });
        expect(converted).to.deep.equal([
            { secondRow: 'Zweite Zeile' },
            { minValueBrightness: 10, maxValueBrightness: 80, colormode: true },
            { maxValueBrightness: 90, minValueColorTemp: 2700, colormode: true },
            {},
        ]);
    });

    it('takes an item with a field of the wrong type over as raw item', () => {
        const result = plan(
            baseConfig({
                subPages: [
                    page({
                        type: 'cardGrid',
                        uniqueName: 'p',
                        heading: 'P',
                        items: [{ id: 'alias.0.NSPanel.allgemein.hue', minValueColorTemp: '2700' }],
                    }),
                ],
            }),
        );
        expect(result.plan.skipped).to.deep.equal([]);
        expect(result.plan.pages[0].rawItems!.map(r => r.detail)).to.deep.equal([
            'items[0].minValueColorTemp: expected a number',
        ]);
    });

    it('builds the same runtime items over the admin path as over the script path', async () => {
        await expectEquivalent(
            baseConfig({ subPages: [page({ type: 'cardGrid', uniqueName: 'p', heading: 'P', items: items() })] }),
        );
    });
});
