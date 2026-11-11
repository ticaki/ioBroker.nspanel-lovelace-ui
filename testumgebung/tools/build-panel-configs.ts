/**
 * Builds the "full equipment" test panels (one standalone web panel per model) with their pages and
 * screensavers and writes them into the instance object of the dev server (`.dev-server/default`, objects
 * DB on port 26426). The page and screensaver entries are the admin format (`native.pageConfig`,
 * `native.screensaverConfig`), the states are those of templates/test-states.json.
 *
 * Run (dev server running): npx tsx testumgebung/tools/build-panel-configs.ts
 * Then restart the adapter and export each panel in the admin (panel tile → export), see ../README.md.
 *
 * Earlier test panels (topic test_*) and their pages / screensavers / notifications are replaced.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    emptyChannelValueConfig,
    emptyChartEntry,
    emptyMediaEntry,
    emptyPChartEntry,
    emptyPowerSlot,
    emptyScreensaverEntry,
    emptyThermo2Entry,
    emptyThermoEntry,
    type AdminPageItemConfig,
    type ChartEntry,
    type MediaEntry,
    type MenuEntry,
    type PageConfigEntry,
    type PageLinkEntry,
    type PChartEntry,
    type PowerEntry,
    type PowerSlotConfig,
    type QREntry,
    type ScreensaverEntry,
    type ScreensaverItemConfig,
    type ScreensaverNotifyConfig,
    type Thermo2Entry,
    type ThermoEntry,
    type TrashEntry,
    type UnlockEntry,
} from '../../src/lib/types/adminShareConfig';

type Model = 'eu' | 'us-l' | 'us-p' | 'web-l' | 'web-p';

/** test panels: name, topic, id, short key for page names */
const PANELS: { model: Model; key: string; name: string; topic: string; id: string }[] = [
    { model: 'eu', key: 'eu', name: 'Test EU', topic: 'test_eu', id: 'web_7e57a0000001' },
    { model: 'us-l', key: 'usl', name: 'Test US-L', topic: 'test_usl', id: 'web_7e57a0000002' },
    { model: 'us-p', key: 'usp', name: 'Test US-P', topic: 'test_usp', id: 'web_7e57a0000003' },
    { model: 'web-l', key: 'webl', name: 'Test Web-L', topic: 'test_webl', id: 'web_7e57a0000004' },
    { model: 'web-p', key: 'webp', name: 'Test Web-P', topic: 'test_webp', id: 'web_7e57a0000005' },
];

/** items per menu card and model - menuMaxItems of src/lib/const/tools.ts */
const MAX: Record<string, Record<Model, number>> = {
    cardEntities: { eu: 4, 'us-l': 4, 'us-p': 5, 'web-l': 4, 'web-p': 8 },
    cardSchedule: { eu: 6, 'us-l': 6, 'us-p': 6, 'web-l': 6, 'web-p': 11 },
    cardGrid: { eu: 6, 'us-l': 6, 'us-p': 6, 'web-l': 8, 'web-p': 10 },
    cardGrid2: { eu: 8, 'us-l': 8, 'us-p': 9, 'web-l': 10, 'web-p': 15 },
    cardGrid3: { eu: 4, 'us-l': 4, 'us-p': 4, 'web-l': 6, 'web-p': 8 },
    cardMedia: { eu: 5, 'us-l': 5, 'us-p': 5, 'web-l': 6, 'web-p': 8 },
    cardThermo2: { eu: 9, 'us-l': 9, 'us-p': 9, 'web-l': 9, 'web-p': 9 },
};

/**
 * places per area and model: the largest count of all five screensaver modes (ScreenSaverConst of
 * src/lib/const/definition.ts), so every mode is fully populated when the mode is switched at runtime
 * (state `panels.<id>.cmd.screenSaver.layout`). left: advanced; bottom: advanced; indicator: advanced or tiles.
 */
const SS_PLACES: Record<'left' | 'bottom' | 'indicator', Record<Model, number>> = {
    left: { eu: 3, 'us-l': 3, 'us-p': 3, 'web-l': 3, 'web-p': 4 },
    bottom: { eu: 6, 'us-l': 6, 'us-p': 6, 'web-l': 8, 'web-p': 8 },
    indicator: { eu: 7, 'us-l': 7, 'us-p': 8, 'web-l': 11, 'web-p': 12 },
};

const A = 'alias.0.NSPanelTest';
const U = '0_userdata.0.NSPanelTest';
const MEDIA_PLAYER = 'squeezeboxrpc.0.Players.Familienzimmer';

/** names of the test channels (templates/test-states.json), used as item names */
const CHANNEL_NAMES: Record<string, string> = Object.fromEntries(
    (
        JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'templates', 'test-states.json'), 'utf-8')) as {
            channels: { id: string; name: string }[];
        }
    ).channels.map(c => [c.id, c.name]),
);

/**
 * A page item on an alias channel, named like the channel.
 *
 * @param channel channel below alias.0.NSPanelTest
 * @param extra further fields
 */
function item(channel: string, extra: Partial<AdminPageItemConfig> = {}): AdminPageItemConfig {
    return { channelId: emptyChannelValueConfig(`${A}.${channel}`), name: CHANNEL_NAMES[channel], ...extra };
}

/**
 * A navigation item to another page.
 *
 * @param channel channel whose state colors the icon
 * @param targetPage target page
 * @param name label
 */
function navItem(channel: string, targetPage: string, name: string): AdminPageItemConfig {
    return { channelId: emptyChannelValueConfig(`${A}.${channel}`), isNavigation: true, targetPage, name };
}

/**
 * The first n entries of a list, repeated when it is too short.
 *
 * @param list entries
 * @param n count
 */
function take<T>(list: T[], n: number): T[] {
    const out: T[] = [];
    for (let i = 0; i < n; i++) {
        out.push(list[i % list.length]);
    }
    return out;
}

const LIGHTS = [
    'Licht.Wohnzimmer_Decke',
    'Licht.Stehlampe',
    'Licht.Kueche_Arbeitslicht',
    'Licht.Schlafzimmer_Farbe',
    'Licht.LED_Leiste',
    'Licht.Esszimmer_Hue',
    'Licht.Flur',
    'Licht.Garten',
    'Licht.Bad_Spiegel',
    'Schalter.Steckdose_TV',
];
const HOUSE = [
    'Schalter.Steckdose_TV',
    'Schalter.Steckdose_Buero',
    'Schalter.Kaffeemaschine',
    'Szene.Alles_aus',
    'Szene.Kino',
    'Rollladen.Wohnzimmer',
    'Tor.Garage',
    'Tuer.Haustuer_Schloss',
    'Lueftung.Bad',
    'Heizung.Wohnzimmer',
    'Klima.Buero',
    'Steuerung.Haus_Modus',
    'Steuerung.Eieruhr',
    'Medien.Lautstaerke',
];
const VALUES: { channel: string; name: string; unit: string; min: number; max: number; best?: number }[] = [
    { channel: 'Sensor.Wohnzimmer_Temperatur', name: 'Wohnen', unit: '°C', min: 0, max: 35, best: 21 },
    { channel: 'Sensor.Aussen_Temperatur', name: 'Außen', unit: '°C', min: -10, max: 35, best: 20 },
    { channel: 'Sensor.Wohnzimmer_Feuchte', name: 'Feuchte', unit: '%', min: 0, max: 100, best: 50 },
    { channel: 'Sensor.Keller_Feuchte', name: 'Keller', unit: '%', min: 0, max: 100, best: 50 },
    { channel: 'Info.Strompreis', name: 'Strom', unit: '€', min: 0, max: 1 },
    { channel: 'Info.Waschmaschine', name: 'Wäsche', unit: 'min', min: 0, max: 120 },
    { channel: 'Heizung.Bad', name: 'Bad', unit: '°C', min: 15, max: 28, best: 22 },
    { channel: 'Steuerung.Ventil_Fussbodenheizung', name: 'Ventil', unit: '%', min: 0, max: 100 },
];
const COVERS = [
    'Rollladen.Wohnzimmer',
    'Rollladen.Kueche',
    'Rollladen.Schlafzimmer',
    'Tor.Garage',
    'Tuer.Haustuer_Schloss',
    'Lueftung.Bad',
    'Lueftung.Deckenventilator',
    'Szene.Kino',
];
const SENSORS = [
    'Sensor.Fenster_Wohnzimmer',
    'Sensor.Haustuer',
    'Sensor.Bewegung_Flur',
    'Sensor.Unwetterwarnung',
    'Sensor.Fenster_Kueche',
    'Sensor.Terrassentuer',
    'Info.Anwesenheit',
    'Info.Status',
];
const CONTROL = [
    'Medien.Lautstaerke',
    'Steuerung.Ventil_Fussbodenheizung',
    'Steuerung.Haus_Modus',
    'Steuerung.Eieruhr',
    'Klima.Buero',
    'Heizung.Wohnzimmer',
    'Lueftung.Deckenventilator',
    'Info.Waschmaschine',
];
const SCHEDULE = [
    'Fahrplan.Tram_Abfahrt1',
    'Fahrplan.Bus_Abfahrt1',
    'Fahrplan.Tram_Abfahrt2',
    'Fahrplan.Bus_Abfahrt2',
    'Fahrplan.Bahn_Abfahrt1',
    'Fahrplan.Bahn_Abfahrt2',
    'Info.Status',
    'Info.Anwesenheit',
    'Info.Strompreis',
    'Sensor.Aussen_Temperatur',
    'Sensor.Unwetterwarnung',
];
/**
 * one channel of every channel role (page "all roles"), except `media` (the alias must point to the state of a
 * real media player) and `sensor.alarm.flood` (no page item in the adapter yet)
 */
const ALL_ROLES = [
    'Licht.Wohnzimmer_Decke',
    'Licht.Stehlampe',
    'Licht.Kueche_Arbeitslicht',
    'Licht.Schlafzimmer_Farbe',
    'Licht.LED_Leiste',
    'Licht.Esszimmer_Hue',
    'Schalter.Steckdose_TV',
    'Szene.Alles_aus',
    'Rollladen.Wohnzimmer',
    'Tor.Garage',
    'Tuer.Haustuer_Schloss',
    'Heizung.Wohnzimmer',
    'Klima.Buero',
    'Lueftung.Bad',
    'Sensor.Wohnzimmer_Temperatur',
    'Sensor.Aussen_Temperatur',
    'Sensor.Wohnzimmer_Feuchte',
    'Sensor.Keller_Feuchte',
    'Sensor.Fenster_Wohnzimmer',
    'Sensor.Haustuer',
    'Sensor.Bewegung_Flur',
    'Sensor.Unwetterwarnung',
    'Medien.Lautstaerke',
    'Steuerung.Ventil_Fussbodenheizung',
    'Steuerung.Haus_Modus',
    'Steuerung.Eieruhr',
    'Info.Status',
    'Fahrplan.Bus_Abfahrt1',
];

/**
 * A power slot.
 *
 * @param state userdata state below Energie
 * @param headline text above the value
 * @param icon icon
 * @param color icon color
 * @param reverse reverse flow direction
 */
function powerSlot(state: string, headline: string, icon: string, color: string, reverse = false): PowerSlotConfig {
    return {
        ...emptyPowerSlot(),
        state: `${U}.Energie.${state}`,
        entityHeadline: headline,
        icon,
        iconColor: color,
        valueUnit: 'W',
        valueDecimal: 0,
        minSpeedScale: 0,
        maxSpeedScale: 5000,
        reverse,
    };
}

/**
 * All pages of one test panel, in navigation order; the first is the start page.
 *
 * @param p the panel
 */
function pagesOf(p: (typeof PANELS)[number]): { pages: PageConfigEntry[]; subPages: PageConfigEntry[] } {
    const m = p.model;
    const k = p.key;
    const n = (card: keyof typeof MAX): number => MAX[card][m];
    const name = (s: string): string => `${k}_${s}`;
    const base = { hidden: false, alwaysOn: 'none' as const };

    const grid: MenuEntry = {
        ...base,
        card: 'cardGrid',
        uniqueName: name('licht'),
        headline: 'Licht',
        pageItems: take(LIGHTS, n('cardGrid')).map(c => item(c)),
        isMainPage: true,
    };
    const houseItems = take(HOUSE, n('cardGrid2') - 1).map(c => item(c));
    houseItems.push(navItem('Info.Status', name('details'), 'Details'));
    const grid2: MenuEntry = {
        ...base,
        card: 'cardGrid2',
        uniqueName: name('haus'),
        headline: 'Haus',
        pageItems: houseItems,
    };
    const grid3: MenuEntry = {
        ...base,
        card: 'cardGrid3',
        uniqueName: name('werte'),
        headline: 'Messwerte',
        pageItems: take(VALUES, n('cardGrid3')).map(v => ({
            channelId: { ...emptyChannelValueConfig(`${A}.${v.channel}`), unit: v.unit },
            name: v.name,
            useValue: true,
            scale:
                v.best === undefined
                    ? { val_min: v.min, val_max: v.max }
                    : { val_min: v.min, val_max: v.max, val_best: v.best },
        })),
    };
    const covers: MenuEntry = {
        ...base,
        card: 'cardEntities',
        uniqueName: name('rolllaeden'),
        headline: 'Rollläden & Tore',
        pageItems: take(COVERS, n('cardEntities')).map(c => item(c)),
    };
    const sensors: MenuEntry = {
        ...base,
        card: 'cardEntities',
        uniqueName: name('sensoren'),
        headline: 'Sensoren',
        pageItems: take(SENSORS, n('cardEntities')).map(c => item(c)),
    };
    const control: MenuEntry = {
        ...base,
        card: 'cardEntities',
        uniqueName: name('steuerung'),
        headline: 'Steuerung',
        pageItems: take(CONTROL, n('cardEntities')).map(c => item(c)),
    };
    const schedule: MenuEntry = {
        ...base,
        card: 'cardSchedule',
        uniqueName: name('fahrplan'),
        headline: 'Abfahrten',
        pageItems: take(SCHEDULE, n('cardSchedule')).map(c => item(c)),
    };
    const allRoles: MenuEntry = {
        ...base,
        card: 'cardEntities',
        uniqueName: name('alle_rollen'),
        headline: 'Alle Rollen',
        pageItems: ALL_ROLES.map(c => item(c)),
        scrollPresentation: 'arrow',
    };
    const thermo: ThermoEntry = {
        ...emptyThermoEntry(name('thermostat')),
        headline: 'Wohnzimmer',
        channelId: `${A}.Heizung.Wohnzimmer`,
        minValue: 5,
        maxValue: 30,
        stepValue: 0.5,
    };
    const aircon: ThermoEntry = {
        ...emptyThermoEntry(name('klima')),
        headline: 'Klimaanlage',
        channelId: `${A}.Klima.Buero`,
    };
    const thermo2: Thermo2Entry = {
        ...emptyThermo2Entry(name('heizkreise')),
        headline: 'Heizkreise',
        thermoItems: [
            { source: 'alias', channelId: `${A}.Heizung.Wohnzimmer`, name: 'Wohnzimmer' },
            { source: 'alias', channelId: `${A}.Heizung.Bad`, name: 'Bad' },
            { source: 'alias', channelId: `${A}.Heizung.Kinderzimmer`, name: 'Kinder' },
            {
                source: 'states',
                channelId: '',
                name: 'Schlafen',
                setState: `${U}.Heizung.Schlafzimmer.SET`,
                actualState: `${U}.Heizung.Schlafzimmer.ACTUAL`,
                humidityState: `${U}.Heizung.Schlafzimmer.HUMIDITY`,
            },
            { source: 'alias', channelId: `${A}.Klima.Buero`, name: 'Büro Heizen', name2: 'Büro Kühlen' },
        ],
        pageItems: take(
            [
                'Sensor.Fenster_Wohnzimmer',
                'Lueftung.Bad',
                'Sensor.Wohnzimmer_Temperatur',
                'Sensor.Wohnzimmer_Feuchte',
                'Sensor.Aussen_Temperatur',
                'Lueftung.Deckenventilator',
                'Sensor.Fenster_Kueche',
                'Info.Strompreis',
                'Szene.Alles_aus',
            ],
            n('cardThermo2'),
        ).map(c => item(c)),
    };
    const media: MediaEntry = {
        ...emptyMediaEntry(name('medien')),
        mediaId: MEDIA_PLAYER,
        minValue: 0,
        maxValue: 80,
        volumePresets: [
            { name: 'leise', value: 15 },
            { name: 'normal', value: 35 },
            { name: 'laut', value: 70 },
        ],
        pageItems: take(
            [
                'Szene.Kino',
                'Schalter.Steckdose_TV',
                'Licht.LED_Leiste',
                'Licht.Stehlampe',
                'Rollladen.Wohnzimmer',
                'Lueftung.Deckenventilator',
                'Licht.Wohnzimmer_Decke',
                'Medien.Lautstaerke',
            ],
            n('cardMedia'),
        ).map(c => item(c)),
    };
    const power: PowerEntry = {
        ...base,
        card: 'cardPower',
        uniqueName: name('energie'),
        headline: 'Energiefluss',
        leftTop: powerSlot('PV', 'PV', 'solar-power-variant', '#ffd600'),
        leftMiddle: powerSlot('Batterie', 'Akku', 'battery-charging-70', '#00c853', true),
        leftBottom: powerSlot('Netz', 'Netz', 'transmission-tower', '#90a4ae'),
        rightTop: powerSlot('Wallbox', 'Auto', 'car-electric', '#2196f3'),
        rightMiddle: powerSlot('Waermepumpe', 'Wärme', 'heat-pump', '#ff7043'),
        rightBottom: powerSlot('Haushalt', 'Haus', 'washing-machine', '#ab47bc'),
        homeTop: { state: `${U}.Energie.Batterie_SOC`, valueDecimal: 0, valueUnit: '%' },
        homeBot: { state: `${U}.Energie.Hausverbrauch`, valueDecimal: 0, valueUnit: 'W', selInternalCalculation: false },
    };
    const bar: ChartEntry = {
        ...emptyChartEntry(name('balken')),
        headline: 'Strom 24 h',
        chartColor: '#2196F3',
        txtLabelYAchse: 'kWh',
        selChartType: 'cardChart',
        setStateForTicks: `${U}.Diagramm.Stromverbrauch.Ticks`,
        setStateForValues: `${U}.Diagramm.Stromverbrauch.Werte`,
    };
    const line: ChartEntry = {
        ...emptyChartEntry(name('linie')),
        headline: 'Außentemperatur',
        chartColor: '#FF9800',
        txtLabelYAchse: '°C',
        selChartType: 'cardLChart',
        setStateForTicks: `${U}.Diagramm.Aussentemperatur.Ticks`,
        setStateForValues: `${U}.Diagramm.Aussentemperatur.Werte`,
    };
    const pie: PChartEntry = {
        ...emptyPChartEntry(name('kuchen')),
        headline: 'Energie heute',
        legendMode: 3,
        decimals: 1,
        selInstanceDataSource: 0,
        rangeKey: 'current',
        slots: [
            { name: 'Eigenverbrauch', state: `${U}.Energie.Heute.Eigenverbrauch`, unit: 'kWh', color: '#00E676' },
            { name: 'Einspeisung', state: `${U}.Energie.Heute.Einspeisung`, unit: 'kWh', color: '#2196F3' },
            { name: 'Netzbezug', state: `${U}.Energie.Heute.Netzbezug`, unit: 'kWh', color: '#F7596F' },
            { name: 'Batterie', state: `${U}.Energie.Heute.Batterie`, unit: 'kWh', color: '#FFD600' },
            { name: 'Wallbox', state: `${U}.Energie.Heute.Wallbox`, unit: 'kWh', color: '#AB47BC' },
        ],
    };
    const alarm: UnlockEntry = {
        ...base,
        card: 'cardAlarm',
        uniqueName: name('alarm'),
        headline: 'Alarmanlage',
        alarmType: 'alarm',
        button1: 'Vollschutz',
        button2: 'Außenhaut',
        button3: 'Nacht',
        button4: 'Urlaub',
        button5: 'Unscharf',
        button6: '',
        button7: '',
        button8: '',
        pin: -1,
    };
    const unlock: UnlockEntry = {
        ...base,
        card: 'cardAlarm',
        uniqueName: name('tuer'),
        headline: 'Tür öffnen',
        alarmType: 'unlock',
        button1: '',
        button2: '',
        button3: '',
        button4: '',
        button5: '',
        button6: '',
        button7: '',
        button8: '',
        pin: -1,
        setNavi: name('licht'),
    };
    const wifi: QREntry = {
        ...base,
        card: 'cardQR',
        uniqueName: name('gaeste_wlan'),
        headline: 'Gäste-WLAN',
        selType: 1,
        ssidUrlTel: 'Gaeste',
        wlanhidden: false,
        wlantype: 'nopass',
        pwdhidden: false,
        setState: `${U}.Gaeste_WLAN.Aktiv`,
    };
    const url: QREntry = {
        ...base,
        card: 'cardQR',
        uniqueName: name('qr_link'),
        headline: 'Anleitung',
        selType: 2,
        ssidUrlTel: 'https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki',
        wlanhidden: false,
        pwdhidden: false,
        setState: '',
    };
    const trash: TrashEntry = {
        ...base,
        card: 'cardTrash',
        uniqueName: name('abfall'),
        headline: 'Abfuhrtermine',
        countItems: 4,
        trashImport: true,
        trashState: `${U}.Abfall.Termine`,
        trashFile: '',
        items: [
            { textTrash: 'Restmüll', customTrash: '', iconColor: '#9e9e9e', icon: '' },
            { textTrash: 'Biotonne', customTrash: '', iconColor: '#795548', icon: '' },
            { textTrash: 'Gelber Sack', customTrash: '', iconColor: '#ffd600', icon: '' },
            { textTrash: 'Papiertonne', customTrash: '', iconColor: '#2196f3', icon: '' },
            { textTrash: '', customTrash: '', iconColor: '#d2d2d2', icon: '' },
            { textTrash: '', customTrash: '', iconColor: '#d2d2d2', icon: '' },
        ],
    };
    const link: PageLinkEntry = {
        ...base,
        card: 'pageLink',
        uniqueName: name('link'),
        headline: 'Licht (Seitenlink)',
        target: name('licht'),
    };
    const details: MenuEntry = {
        ...base,
        card: 'cardEntities',
        uniqueName: name('details'),
        headline: 'Details',
        pageItems: take(['Info.Status', 'Info.Anwesenheit', 'Info.Waschmaschine', 'Info.Strompreis'], n('cardEntities')).map(
            c => item(c),
        ),
    };
    return {
        pages: [
            grid,
            grid2,
            grid3,
            covers,
            sensors,
            control,
            allRoles,
            schedule,
            thermo,
            aircon,
            thermo2,
            media,
            power,
            bar,
            line,
            pie,
            alarm,
            unlock,
            wifi,
            url,
            trash,
            link,
        ],
        subPages: [details],
    };
}

/**
 * A screensaver value item.
 *
 * @param state state id
 * @param headline label
 * @param icon icon
 * @param unit unit
 * @param decimals decimals
 * @param scale color scale
 * @param scale.val_min lower end
 * @param scale.val_max upper end
 * @param scale.val_best best value
 */
function ssValue(
    state: string,
    headline: string,
    icon: string,
    unit: string,
    decimals: number,
    scale?: { val_min: number; val_max: number; val_best?: number },
): ScreensaverItemConfig {
    return {
        state,
        headline,
        iconOn: icon,
        unit,
        factor: 1,
        decimals,
        ...(scale ? { colorScale: scale } : { colorOn: '#fdd835', colorOff: '#fd8000' }),
    };
}

/**
 * A screensaver indicator for a boolean state.
 *
 * @param state state id
 * @param headline label
 * @param iconOn icon while true
 * @param iconOff icon while false
 * @param extra further fields
 */
function ssIndicator(
    state: string,
    headline: string,
    iconOn: string,
    iconOff: string,
    extra: Partial<ScreensaverItemConfig> = {},
): ScreensaverItemConfig {
    return { state, headline, iconOn, iconOff, colorOn: '#fdd835', colorOff: '#44739e', ...extra };
}

/**
 * The screensaver of a test panel: every area filled for the largest mode, starts in mode advanced.
 *
 * @param p the panel
 * @param notifyIds notifications it shows
 */
function screensaverOf(p: (typeof PANELS)[number], notifyIds: string[]): ScreensaverEntry {
    const m = p.model;
    const left = [
        ssValue(`${A}.Sensor.Aussen_Temperatur.ACTUAL`, 'Außen', 'thermometer', '°C', 1, {
            val_min: -10,
            val_max: 35,
            val_best: 20,
        }),
        ssValue(`${A}.Sensor.Wohnzimmer_Temperatur.ACTUAL`, 'Innen', 'home-thermometer', '°C', 1, {
            val_min: 15,
            val_max: 28,
            val_best: 21,
        }),
        ssValue(`${A}.Sensor.Wohnzimmer_Feuchte.ACTUAL`, 'Feuchte', 'water-percent', '%', 0, {
            val_min: 0,
            val_max: 100,
            val_best: 50,
        }),
        ssValue(`${U}.Energie.Batterie_SOC`, 'Akku', 'battery-70', '%', 0, { val_min: 0, val_max: 100, val_best: 100 }),
    ];
    const bottom = [
        ssValue(`${U}.Energie.PV`, 'PV', 'solar-power-variant', 'W', 0, { val_min: 0, val_max: 8000, val_best: 8000 }),
        ssValue(`${U}.Energie.Hausverbrauch`, 'Haus', 'home-lightning-bolt', 'W', 0, {
            val_min: 0,
            val_max: 6000,
            val_best: 0,
        }),
        ssValue(`${U}.Wetter.Wind`, 'Wind', 'weather-windy', 'km/h', 0),
        ssValue(`${U}.Wetter.Luftdruck`, 'Druck', 'gauge', 'hPa', 0),
        ssValue(`${U}.Wetter.Regen`, 'Regen', 'weather-rainy', 'mm', 1),
        ssValue(`${U}.Wetter.UV_Index`, 'UV', 'weather-sunny-alert', '', 0, { val_min: 0, val_max: 10, val_best: 0 }),
        ssValue(`${A}.Sensor.Keller_Feuchte.ACTUAL`, 'Keller', 'water', '%', 0, {
            val_min: 0,
            val_max: 100,
            val_best: 50,
        }),
        ssValue(`${A}.Info.Strompreis.ACTUAL`, 'Preis', 'currency-eur', '€', 2),
    ];
    // mixed: display only, tap action (button / switch / page), long press (TFT 6.0.9) or both
    const indicator = [
        ssIndicator(
            `${A}.Sensor.Fenster_Wohnzimmer.ACTUAL`,
            'Fenster',
            'window-open-variant',
            'window-closed-variant',
        ),
        ssIndicator(`${A}.Sensor.Haustuer.ACTUAL`, 'Haustür', 'door-open', 'door-closed'),
        ssIndicator(`${A}.Licht.Wohnzimmer_Decke.ON_ACTUAL`, 'Licht', 'lightbulb', 'lightbulb-outline', {
            action: { kind: 'switch', state: `${A}.Licht.Wohnzimmer_Decke.SET` },
            longPress: { kind: 'navigate', page: `${p.key}_licht` },
        }),
        ssIndicator(`${A}.Sensor.Bewegung_Flur.ACTUAL`, 'Bewegung', 'motion-sensor', 'motion-sensor-off'),
        ssIndicator(`${A}.Schalter.Steckdose_TV.ACTUAL`, 'TV', 'television', 'television-off', {
            action: { kind: 'switch', state: `${A}.Schalter.Steckdose_TV.SET` },
        }),
        ssIndicator(`${A}.Sensor.Fenster_Kueche.ACTUAL`, 'Küche', 'window-open-variant', 'window-closed-variant'),
        ssIndicator(`${A}.Sensor.Terrassentuer.ACTUAL`, 'Terrasse', 'door-open', 'door-closed', {
            longPress: { kind: 'button', state: `${A}.Szene.Alles_aus.SET` },
        }),
        ssIndicator(`${A}.Tuer.Haustuer_Schloss.ACTUAL`, 'Schloss', 'lock', 'lock-open-variant', {
            action: { kind: 'navigate', page: `${p.key}_tuer` },
            longPress: { kind: 'switch', state: `${A}.Tuer.Haustuer_Schloss.SET` },
        }),
        ssIndicator(`${A}.Sensor.Wassermelder_Keller.ACTUAL`, 'Wasser', 'water-alert', 'water-check'),
        ssIndicator(`${A}.Heizung.Wohnzimmer.POWER`, 'Heizung', 'radiator', 'radiator-off', {
            action: { kind: 'navigate', page: `${p.key}_thermostat` },
        }),
        ssIndicator(`${U}.Hinweis.Waschmaschine_fertig`, 'Wäsche', 'washing-machine', 'washing-machine-off', {
            action: { kind: 'button', state: `${A}.Szene.Kino.SET` },
        }),
        ssIndicator(`${U}.Gaeste_WLAN.Aktiv`, 'Gäste', 'wifi', 'wifi-off', {
            action: { kind: 'switch', state: `${U}.Gaeste_WLAN.Aktiv` },
            longPress: { kind: 'navigate', page: `${p.key}_gaeste_wlan` },
        }),
    ];
    return {
        ...emptyScreensaverEntry(`Test ${p.key}`, 'advanced'),
        panels: [p.topic],
        favorit: ssValue(`${A}.Sensor.Aussen_Temperatur.ACTUAL`, 'Außen', 'weather-partly-cloudy', '°C', 1),
        left: left.slice(0, SS_PLACES.left[m]),
        bottom: bottom.slice(0, SS_PLACES.bottom[m]),
        indicator: indicator.slice(0, SS_PLACES.indicator[m]),
        alternate: [
            ssValue(`${A}.Sensor.Wohnzimmer_Temperatur.ACTUAL`, 'Innen', 'home-thermometer', '°C', 1, {
                val_min: 15,
                val_max: 28,
                val_best: 21,
            }),
        ],
        mrIcon1: {
            entity: `${A}.Licht.Wohnzimmer_Decke.ON_ACTUAL`,
            iconOn: 'lightbulb',
            iconOff: 'lightbulb-outline',
            onColor: '#fdd835',
            offColor: '#44739e',
        },
        mrIcon2: {
            entity: `${A}.Schalter.Steckdose_TV.ACTUAL`,
            iconOn: 'power-socket-de',
            iconOff: 'power-plug-off',
            onColor: '#fdd835',
            offColor: '#44739e',
            value: `${U}.Energie.Hausverbrauch`,
            valueDecimals: 0,
            valueUnit: 'W',
        },
        notify: notifyIds,
        weatherEntity: '',
        rotationTime: 0,
    };
}

/** notifications of the test screensavers (shared list `native.screensaverNotify`) */
const NOTIFY: ScreensaverNotifyConfig[] = [
    {
        id: 'nspaneltest_waesche',
        name: 'Test: Waschmaschine fertig',
        enabled: [`${U}.Hinweis.Waschmaschine_fertig`],
        headline: 'Waschmaschine',
        headlineIcon: 'washing-machine',
        text: 'Die Wäsche ist fertig.',
        priority: 10,
        dismissible: true,
    },
    {
        id: 'nspaneltest_fenster',
        name: 'Test: Fenster offen',
        enabled: [`${U}.Hinweis.Fenster_offen`],
        visibleCondition: 'val > 0',
        headline: `${U}.Hinweis.Fenster_offen`,
        headlinePrefix: 'Offene Fenster: ',
        headlineIcon: 'window-open-variant',
        text: 'Bitte vor dem Verlassen schließen.',
        priority: 20,
    },
];

/**
 * Sets the navigation: the pages form a ring starting at the start page, sub pages point to their parent.
 *
 * @param topic panel topic
 * @param pages pages in order, the first is the start page
 * @param subPages pages reached by a navigation item
 * @param parent parent of the sub pages
 */
function assignNavigation(topic: string, pages: PageConfigEntry[], subPages: PageConfigEntry[], parent: string): void {
    pages.forEach((page, i) => {
        if (i === 0) {
            page.navigationAssignment = [{ topic, navigation: {} }];
            return;
        }
        const prev = i === 1 ? 'main' : pages[i - 1].uniqueName;
        const navigation: { prev: string; next?: string } = { prev };
        if (i === pages.length - 1) {
            navigation.next = 'main';
        }
        page.navigationAssignment = [{ topic, navigation }];
    });
    for (const page of subPages) {
        page.navigationAssignment = [{ topic, navigation: { parent } }];
    }
}

/**
 * The parts of the instance configuration for all test panels.
 *
 * @returns panels, pages, screensavers and notifications
 */
export function buildTestConfig(): {
    panels: Record<string, unknown>[];
    pages: PageConfigEntry[];
    screensavers: ScreensaverEntry[];
    notify: ScreensaverNotifyConfig[];
} {
    const pages: PageConfigEntry[] = [];
    const screensavers: ScreensaverEntry[] = [];
    for (const p of PANELS) {
        const set = pagesOf(p);
        assignNavigation(p.topic, set.pages, set.subPages, `${p.key}_haus`);
        pages.push(...set.pages, ...set.subPages);
        screensavers.push(
            screensaverOf(
                p,
                NOTIFY.map(n => n.id),
            ),
        );
    }
    const panels = PANELS.map(p => ({
        name: p.name,
        topic: p.topic,
        id: p.id,
        ip: '',
        model: p.model,
        kind: 'web',
    }));
    return { panels, pages, screensavers, notify: NOTIFY };
}

/** writes the test configuration into the dev server */
async function main(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Client } = require('../../.dev-server/default/node_modules/@iobroker/db-objects-redis');
    const config = buildTestConfig();
    const topics = new Set(config.panels.map(p => p.topic as string));
    const pageNames = new Set(config.pages.map(p => p.uniqueName));
    const notifyIds = new Set(config.notify.map(n => n.id));
    await new Promise<void>((resolve, reject) => {
        const client = new Client({
            connection: { type: 'jsonl', host: '127.0.0.1', port: 26426 },
            logger: { silly() {}, debug() {}, info() {}, warn: console.warn, error: console.error },
            connected: async () => {
                try {
                    const id = 'system.adapter.nspanel-lovelace-ui.0';
                    const obj = await client.getObjectAsync(id);
                    const n = obj.native;
                    n.panels = [...(n.panels ?? []).filter((p: { topic: string }) => !topics.has(p.topic)), ...config.panels];
                    n.pageConfig = [
                        ...(n.pageConfig ?? []).filter((p: { uniqueName: string }) => !pageNames.has(p.uniqueName)),
                        ...config.pages,
                    ];
                    n.screensaverConfig = [
                        ...(n.screensaverConfig ?? []).filter(
                            (s: { name: string; panels?: string[] }) => !s.name.startsWith('Test '),
                        ),
                        ...config.screensavers,
                    ];
                    n.screensaverNotify = [
                        ...(n.screensaverNotify ?? []).filter((s: { id: string }) => !notifyIds.has(s.id)),
                        ...config.notify,
                    ];
                    await client.setObjectAsync(id, obj);
                    process.stdout.write(
                        `written: ${config.panels.length} panels, ${config.pages.length} pages, ` +
                            `${config.screensavers.length} screensavers\n`,
                    );
                    resolve();
                } catch (e) {
                    reject(e instanceof Error ? e : new Error(String(e)));
                }
            },
        });
    });
    process.exit(0);
}

if (require.main === module) {
    main().catch(e => {
        console.error(e);
        process.exit(1);
    });
}
