import type { ChannelRole } from '../../../src/lib/types/adminShareConfig';
import type { DocTopic } from './types';

/**
 * Help topics of the area "pageitems". Keys start with `pageitems.`; see `DocTopic` for the heading texts.
 */
export const pageitemsTopics = {
    'pageitems.textSize': { page: 'PageConfig-Dialoge', de: 'Die Text-/Icongröße', en: 'The text/icon size' },
    'pageitems.dialog': {
        page: 'PageConfig-Dialoge',
        de: '1. Pageitem-Konfiguration',
        en: '1. Pageitem Configuration',
    },
    'pageitems.basicCases': {
        page: 'PageConfig-Dialoge',
        de: 'Was ein Pageitem anzeigen soll: die drei Grundfälle',
        en: 'What a page item should show: the three basic cases',
    },
    'pageitems.channel': {
        page: 'PageConfig-Dialoge',
        de: 'Der ioBroker-Kanal und seine Prüfzeichen',
        en: 'The ioBroker channel and its check marks',
    },
    'pageitems.name': { page: 'PageConfig-Dialoge', de: 'Name und dynamischer Name', en: 'Name and dynamic name' },
    'pageitems.targetPage': { page: 'PageConfig-Dialoge', de: 'Die Zielseite', en: 'The target page' },
    'pageitems.cardFields': {
        page: 'PageConfig-Dialoge',
        de: 'Weitere Felder, je nach Kartentyp',
        en: 'Further fields, depending on the card type',
    },
    'pageitems.longPress': { page: 'PageConfig-Dialoge', de: 'Langer Druck', en: 'Long press' },
    'pageitems.roleFields': {
        page: 'PageConfig-Dialoge',
        de: 'Felder, die nur bestimmte Rollen auswerten',
        en: 'Fields only certain roles evaluate',
    },
    'pageitems.trueFalse': {
        page: 'PageConfig-Dialoge',
        de: 'Symbol und Farbe für „wahr" und „unwahr"',
        en: 'Icon and colour for "true" and "false"',
    },
    'pageitems.rawData': { page: 'PageConfig-Dialoge', de: '2. Rohdaten des Items', en: '2. Raw data of the item' },
    'pageitems.colorOptions': { page: 'PageConfig-Dialoge', de: '6. Farboptionen', en: '6. Color Options' },
    'pageitems.modeList': { page: 'PageConfig-Dialoge', de: '7. Modusliste', en: '7. Mode list' },
    'pageitems.applyCheck': {
        page: 'PageConfig-Dialoge',
        de: '8. Die Prüfung beim Übernehmen',
        en: '8. The check when applying',
    },
    'pageitems.popupTimer': { page: 'popupTimer' },
    'pageitems.screensaverTimer': {
        page: 'popupTimer',
        de: '5. Timer aus dem Screensaver verwenden',
        en: '5. Use the timer of the screensaver',
    },
    'pageitems.alexaTimer': {
        page: 'popupTimer',
        de: '7. Alexa-Timer (alexa2)',
        en: '7. Alexa timer (alexa2)',
    },
    // one section per channel role in the alias table (the heading is the role itself, in both languages)
    'pageitems.role.airCondition': { page: 'ALIAS', de: 'airCondition', en: 'airCondition' },
    'pageitems.role.blind': { page: 'ALIAS', de: 'blind', en: 'blind' },
    'pageitems.role.button': { page: 'ALIAS', de: 'button', en: 'button' },
    'pageitems.role.ct': { page: 'ALIAS', de: 'ct', en: 'ct' },
    'pageitems.role.dimmer': { page: 'ALIAS', de: 'dimmer', en: 'dimmer' },
    'pageitems.role.door': { page: 'ALIAS', de: 'door', en: 'door' },
    'pageitems.role.gate': { page: 'ALIAS', de: 'gate', en: 'gate' },
    'pageitems.role.hue': { page: 'ALIAS', de: 'hue', en: 'hue' },
    'pageitems.role.humidity': { page: 'ALIAS', de: 'humidity', en: 'humidity' },
    'pageitems.role.info': { page: 'ALIAS', de: 'info', en: 'info' },
    'pageitems.role.light': { page: 'ALIAS', de: 'light', en: 'light' },
    'pageitems.role.lock': { page: 'ALIAS', de: 'lock', en: 'lock' },
    'pageitems.role.media': { page: 'ALIAS', de: 'media', en: 'media' },
    'pageitems.role.motion': { page: 'ALIAS', de: 'motion', en: 'motion' },
    'pageitems.role.rgb': { page: 'ALIAS', de: 'rgb', en: 'rgb' },
    'pageitems.role.rgbSingle': { page: 'ALIAS', de: 'rgbSingle', en: 'rgbSingle' },
    'pageitems.role.select': { page: 'ALIAS', de: 'select', en: 'select' },
    'pageitems.role.slider': { page: 'ALIAS', de: 'slider', en: 'slider' },
    'pageitems.role.socket': { page: 'ALIAS', de: 'socket', en: 'socket' },
    'pageitems.role.temperature': { page: 'ALIAS', de: 'temperature', en: 'temperature' },
    'pageitems.role.thermostat': { page: 'ALIAS', de: 'thermostat', en: 'thermostat' },
    'pageitems.role.timeTable': { page: 'ALIAS', de: 'timeTable', en: 'timeTable' },
    'pageitems.role.volume': { page: 'ALIAS', de: 'volume', en: 'volume' },
    'pageitems.role.warning': { page: 'ALIAS', de: 'warning', en: 'warning' },
    'pageitems.role.window': { page: 'ALIAS', de: 'window', en: 'window' },
    'pageitems.role.level.mode.fan': { page: 'ALIAS', de: 'level.mode.fan', en: 'level.mode.fan' },
    'pageitems.role.level.timer': { page: 'ALIAS', de: 'level.timer', en: 'level.timer' },
    'pageitems.role.sensor.alarm.flood': { page: 'ALIAS', de: 'sensor.alarm.flood', en: 'sensor.alarm.flood' },
    'pageitems.role.value.humidity': { page: 'ALIAS', de: 'value.humidity', en: 'value.humidity' },
    'pageitems.role.value.temperature': { page: 'ALIAS', de: 'value.temperature', en: 'value.temperature' },
} satisfies Record<`pageitems.${string}`, DocTopic>;

/** Key of a help topic of the area "pageitems". */
export type PageitemsTopicKey = keyof typeof pageitemsTopics;

/**
 * Type-dependent help of the page item dialog: for every channel role the dialog knows, the places
 * in the documentation that describe exactly this role - its section in the alias table, plus the
 * description of its popup where the documentation has one of its own.
 */
export const pageitemsRoleTopics = {
    airCondition: ['pageitems.role.airCondition'],
    blind: ['pageitems.role.blind'],
    button: ['pageitems.role.button'],
    ct: ['pageitems.role.ct'],
    dimmer: ['pageitems.role.dimmer'],
    door: ['pageitems.role.door'],
    gate: ['pageitems.role.gate'],
    hue: ['pageitems.role.hue'],
    humidity: ['pageitems.role.humidity'],
    info: ['pageitems.role.info'],
    light: ['pageitems.role.light'],
    lock: ['pageitems.role.lock'],
    media: ['pageitems.role.media'],
    motion: ['pageitems.role.motion'],
    rgb: ['pageitems.role.rgb'],
    rgbSingle: ['pageitems.role.rgbSingle'],
    select: ['pageitems.role.select'],
    slider: ['pageitems.role.slider'],
    socket: ['pageitems.role.socket'],
    temperature: ['pageitems.role.temperature'],
    thermostat: ['pageitems.role.thermostat'],
    timeTable: ['pageitems.role.timeTable'],
    volume: ['pageitems.role.volume'],
    warning: ['pageitems.role.warning'],
    window: ['pageitems.role.window'],
    'level.mode.fan': ['pageitems.role.level.mode.fan'],
    'level.timer': ['pageitems.role.level.timer', 'pageitems.popupTimer'],
    'sensor.alarm.flood': ['pageitems.role.sensor.alarm.flood'],
    'value.humidity': ['pageitems.role.value.humidity'],
    'value.temperature': ['pageitems.role.value.temperature'],
} satisfies Record<ChannelRole, readonly PageitemsTopicKey[]>;

const roleTopicMap = new Map<string, readonly PageitemsTopicKey[]>(Object.entries(pageitemsRoleTopics));

/**
 * Help topics of a channel role.
 *
 * @param role `common.role` of the chosen channel, `null` if none is chosen yet.
 * @returns The topics of the role, empty for an unknown role.
 */
export function pageitemsTopicsOfRole(role: string | null): readonly PageitemsTopicKey[] {
    return role === null ? [] : (roleTopicMap.get(role) ?? []);
}

/**
 * Help next to the option "standard" of the kind switch (standard / Alexa timer) of the page item dialog:
 * the description of what a standard item of this role shows - for a timer the timer popup, or the
 * section about the timer of the screensaver when the item uses it. The sections of the alias table are left
 * out, the dialog title already links them.
 *
 * @param role `common.role` of the chosen channel, `null` if none is chosen yet.
 * @param useScreensaverTimer True if the item shows the timer of the screensaver (`useScreensaverTimer` in effect).
 * @returns The topics, empty if the documentation has nothing beyond the alias table for this role.
 */
export function pageitemsTopicsOfStandardKind(
    role: string | null,
    useScreensaverTimer: boolean,
): readonly PageitemsTopicKey[] {
    if (useScreensaverTimer) {
        return ['pageitems.screensaverTimer'];
    }
    return pageitemsTopicsOfRole(role).filter(topic => !topic.startsWith('pageitems.role.'));
}
