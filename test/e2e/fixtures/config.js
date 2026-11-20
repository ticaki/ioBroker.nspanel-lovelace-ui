'use strict';

/**
 * Test configuration of the E2E run: the admin configuration of the instance (`system.adapter.<ns>.native`:
 * panel table, pages, screensaver, MQTT broker, web panel server) and the test states below `0_userdata.0.e2e`.
 * Both panels use no script (`noScript`) - everything comes from the admin configuration.
 */

const NSPANEL = {
    name: 'E2E NSPanel',
    topic: 'e2e/nspanel',
    mac: 'A0:B7:A5:E2:E0:01',
    /** the panel id of the admin table = cleaned MAC = name of the states tree `panels.<id>` */
    id: 'A0_B7_A5_E2_E0_01',
    model: 'eu',
};

const WEBPANEL = {
    name: 'E2E Web',
    topic: 'e2e/web',
    id: 'web_e2e0000000a1',
    model: 'eu',
};

const MQTT = { username: 'e2e', password: 'e2e-secret' };

const BASE = '0_userdata.0.e2e';

/** ids of the test states */
const IDS = {
    socket: `${BASE}.socket`,
    socketSet: `${BASE}.socket.SET`,
    socket2: `${BASE}.socket2`,
    socket2Set: `${BASE}.socket2.SET`,
    light: `${BASE}.light`,
    lightOn: `${BASE}.light.ON_SET`,
    lightDimmer: `${BASE}.light.SET`,
    blind: `${BASE}.blind`,
    blindActual: `${BASE}.blind.ACTUAL`,
    blindSet: `${BASE}.blind.SET`,
    blindOpen: `${BASE}.blind.OPEN`,
    blindClose: `${BASE}.blind.CLOSE`,
    blindStop: `${BASE}.blind.STOP`,
    temperature: `${BASE}.temperature`,
    humidity: `${BASE}.humidity`,
    power: `${BASE}.power`,
    window: `${BASE}.window`,
    /** switches the notification of the admin list (scenario 08) - not in STATES, so not in the snapshots */
    notifyAdmin: `${BASE}.notifyAdmin`,
};

/** display names - the tests find the items of a page by them */
const NAMES = {
    socket: 'E2E Socket',
    socket2: 'E2E Socket 2',
    light: 'E2E Light',
    blind: 'E2E Blind',
    toSub: 'E2E To Sub',
};

/** headlines - the tests recognize the pages by them */
const HEADLINES = {
    main: 'E2E Main',
    entities: 'E2E Entities',
    sub: 'E2E Sub',
};

/**
 * @param {string} name display name of the channel
 * @param {string} role channel role
 * @returns {ioBroker.SettableObject} channel object
 */
function channel(name, role) {
    return { type: 'channel', common: { name, role }, native: {} };
}

/**
 * @param {string} name display name
 * @param {'boolean' | 'number' | 'string'} type common.type
 * @param {string} role common.role
 * @param {boolean} write writeable
 * @param {object} [extra] more common fields
 * @returns {ioBroker.SettableObject} state object
 */
function state(name, type, role, write, extra = {}) {
    return {
        type: 'state',
        common: { name, type, role, read: true, write, ...extra },
        native: {},
    };
}

/** objects of the test states (alias-like channels, see ALIAS.md), created before the adapter starts */
const OBJECTS = {
    [BASE]: { type: 'folder', common: { name: 'e2e' }, native: {} },
    [IDS.socket]: channel(NAMES.socket, 'socket'),
    [IDS.socketSet]: state('switch', 'boolean', 'switch', true),
    [IDS.socket2]: channel(NAMES.socket2, 'socket'),
    [IDS.socket2Set]: state('switch', 'boolean', 'switch', true),
    [IDS.light]: channel(NAMES.light, 'dimmer'),
    [IDS.lightOn]: state('on', 'boolean', 'switch.light', true),
    [IDS.lightDimmer]: state('brightness', 'number', 'level.dimmer', true, { min: 0, max: 100, unit: '%' }),
    [IDS.blind]: channel(NAMES.blind, 'blind'),
    [IDS.blindActual]: state('actual', 'number', 'value.blind', false, { min: 0, max: 100, unit: '%' }),
    [IDS.blindSet]: state('position', 'number', 'level.blind', true, { min: 0, max: 100, unit: '%' }),
    [IDS.blindOpen]: state('open', 'boolean', 'button.open.blind', true),
    [IDS.blindClose]: state('close', 'boolean', 'button.close.blind', true),
    [IDS.blindStop]: state('stop', 'boolean', 'button.stop.blind', true),
    [IDS.temperature]: state('Temperature', 'number', 'value.temperature', false, { unit: '°C' }),
    [IDS.humidity]: state('Humidity', 'number', 'value.humidity', false, { unit: '%' }),
    [IDS.power]: state('Power', 'number', 'value.power', false, { unit: 'W' }),
    [IDS.window]: state('Window', 'boolean', 'sensor.window', false),
    [IDS.notifyAdmin]: state('Notify admin', 'boolean', 'switch', true),
};

/** start values of the test states */
const STATES = {
    [IDS.socketSet]: false,
    [IDS.socket2Set]: false,
    [IDS.lightOn]: false,
    [IDS.lightDimmer]: 40,
    [IDS.blindActual]: 50,
    [IDS.blindSet]: 50,
    [IDS.blindOpen]: false,
    [IDS.blindClose]: false,
    [IDS.blindStop]: false,
    [IDS.temperature]: 21.5,
    [IDS.humidity]: 48,
    [IDS.power]: 1234,
    [IDS.window]: false,
};

/**
 * Start values of states that are not part of the snapshots (a new entry in STATES would change every snapshot).
 * Set before the adapter starts like STATES; the scenario that uses one sets it back itself.
 */
const EXTRA_STATES = {
    [IDS.notifyAdmin]: false,
};

/** notification of the admin list (`native.screensaverNotify`), switched on by IDS.notifyAdmin (scenario 08) */
const ADMIN_NOTIFY = {
    id: 'e2e-admin-notify',
    name: 'E2E admin notification',
    headline: 'Admin',
    text: 'from the list',
    /** same as the default of sendTo - for the tie of sendTo and admin list */
    priority: 50,
};

/**
 * @param {string} id state / channel id
 * @param {string} name display name
 * @returns {object} admin page item (AdminPageItemConfig)
 */
function item(id, name) {
    return { channelId: { valueStateId: id, unit: '', prefix: '', suffix: '', dateFormat: '' }, name };
}

/**
 * @param {Record<string, string>} navigation prev/next/parent/home
 * @returns {object[]} navigationAssignment for both panels
 */
function assign(navigation) {
    return [
        { topic: NSPANEL.topic, navigation },
        { topic: WEBPANEL.topic, navigation },
    ];
}

/** `native.pageConfig`: main grid ⇄ entities (next/prev), sub grid below main (parent) */
const PAGE_CONFIG = [
    {
        card: 'cardGrid',
        uniqueName: 'e2e_main',
        headline: HEADLINES.main,
        isMainPage: true,
        pageItems: [
            item(IDS.socket, NAMES.socket),
            item(IDS.light, NAMES.light),
            item(IDS.blind, NAMES.blind),
            {
                ...item('', NAMES.toSub),
                isNavigation: true,
                targetPage: 'e2e_sub',
            },
        ],
        navigationAssignment: assign({ next: 'e2e_entities' }),
    },
    {
        card: 'cardEntities',
        uniqueName: 'e2e_entities',
        headline: HEADLINES.entities,
        pageItems: [item(IDS.socket, NAMES.socket), item(IDS.blind, NAMES.blind)],
        navigationAssignment: assign({ prev: 'main' }),
    },
    {
        card: 'cardGrid',
        uniqueName: 'e2e_sub',
        headline: HEADLINES.sub,
        pageItems: [item(IDS.socket2, NAMES.socket2)],
        navigationAssignment: assign({ parent: 'main' }),
    },
];

/**
 * Texts and icons of the screensaver items - every slot shows something else, so a shifted field or slot shows up in
 * the tests (scenarios 05 and 06).
 */
const SCREENSAVER = {
    /** headlines of the bottom items, in this order */
    bottom: ['Hum', 'Temp', 'Pow', 'Win'],
    /** headlines of the left items (advanced only) */
    left: ['LPow', 'LHum'],
    alternate: 'Alt',
    windowText: { on: 'open', off: 'closed' },
    /** icon names of the indicators: socket and window */
    socketIcons: { on: 'power', off: 'power-off' },
    windowIcons: { on: 'window-open', off: 'window-closed' },
    /** colors of the window indicator */
    windowColors: { on: '#ff0000', off: '#00ff00' },
};

/** `native.screensaverConfig`: one admin screensaver for both panels, all areas used */
const SCREENSAVER_CONFIG = [
    {
        name: 'e2e',
        mode: 'standard',
        panels: [NSPANEL.topic, WEBPANEL.topic],
        favorit: { state: IDS.temperature, unit: '°C', decimals: 1 },
        left: [
            { state: IDS.power, headline: SCREENSAVER.left[0], unit: 'W', decimals: 0 },
            { state: IDS.humidity, headline: SCREENSAVER.left[1], unit: '%', decimals: 0 },
        ],
        bottom: [
            { state: IDS.humidity, headline: SCREENSAVER.bottom[0], unit: '%', decimals: 0 },
            { state: IDS.temperature, headline: SCREENSAVER.bottom[1], unit: '°C', decimals: 1 },
            { state: IDS.power, headline: SCREENSAVER.bottom[2], unit: 'W', decimals: 0 },
            {
                state: IDS.window,
                headline: SCREENSAVER.bottom[3],
                textOn: SCREENSAVER.windowText.on,
                textOff: SCREENSAVER.windowText.off,
            },
        ],
        alternate: [{ state: IDS.humidity, headline: SCREENSAVER.alternate, unit: '%', decimals: 0 }],
        indicator: [
            { state: IDS.socketSet, iconOn: SCREENSAVER.socketIcons.on, iconOff: SCREENSAVER.socketIcons.off },
            {
                state: IDS.window,
                iconOn: SCREENSAVER.windowIcons.on,
                iconOff: SCREENSAVER.windowIcons.off,
                colorOn: SCREENSAVER.windowColors.on,
                colorOff: SCREENSAVER.windowColors.off,
            },
        ],
        weatherEntity: '',
        rotationTime: 0,
        notify: [ADMIN_NOTIFY.id],
    },
];

/**
 * The admin configuration of the instance.
 *
 * @param {{ mqtt: number, web: number }} ports ports of the MQTT broker and the web panel server
 * @returns {Record<string, unknown>} native
 */
function nativeConfig(ports) {
    return {
        mqttServer: true,
        mqttPort: ports.mqtt,
        mqttUsername: MQTT.username,
        mqttPassword: MQTT.password,
        mqttIp: '',
        webEnabled: true,
        webPort: ports.web,
        webBind: '127.0.0.1',
        webHost: '127.0.0.1',
        webPin: '',
        pw1: '1234',
        weatherEntity: '',
        panels: [
            {
                name: NSPANEL.name,
                topic: NSPANEL.topic,
                id: NSPANEL.id,
                ip: '127.0.0.1',
                model: NSPANEL.model,
                noScript: true,
            },
            {
                name: WEBPANEL.name,
                topic: WEBPANEL.topic,
                id: WEBPANEL.id,
                ip: '',
                model: WEBPANEL.model,
                kind: 'web',
                noScript: true,
            },
        ],
        pageConfig: PAGE_CONFIG,
        screensaverConfig: SCREENSAVER_CONFIG,
        screensaverNotify: [
            {
                id: ADMIN_NOTIFY.id,
                name: ADMIN_NOTIFY.name,
                enabled: [IDS.notifyAdmin],
                headline: ADMIN_NOTIFY.headline,
                text: ADMIN_NOTIFY.text,
                priority: ADMIN_NOTIFY.priority,
            },
        ],
    };
}

module.exports = {
    NSPANEL,
    WEBPANEL,
    MQTT,
    IDS,
    NAMES,
    HEADLINES,
    OBJECTS,
    STATES,
    EXTRA_STATES,
    SCREENSAVER,
    ADMIN_NOTIFY,
    nativeConfig,
};
