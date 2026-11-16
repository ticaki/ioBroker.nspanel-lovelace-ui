import type { DocTopic } from './types';

/**
 * Help topics of the area "maintain". Keys start with `maintain.`; see `DocTopic` for the heading texts.
 */
export const maintainTopics = {
    'maintain.installation': { page: 'Adapter-Installation' },
    'maintain.scriptUpdate': {
        page: 'Maintain',
        de: '4. Skriptversion und SCRIPT UPDATE',
        en: '4. Script version and SCRIPT UPDATE',
    },
    // tab Maintain
    'maintain.page': { page: 'Maintain' },
    'maintain.firmwareUpdate': {
        page: 'Maintain',
        de: '3. Tasmota, TFT und Berry-Treiber aktualisieren',
        en: '3. Updating Tasmota, TFT and Berry driver',
    },
    'maintain.tasmotaUpdate': { page: 'Maintain', de: 'TASMOTA UPDATE', en: 'TASMOTA UPDATE' },
    'maintain.tftUpdate': { page: 'Maintain', de: 'TFT UPDATE', en: 'TFT UPDATE' },
    'maintain.berryUpdate': { page: 'Maintain', de: 'BERRY UPDATE', en: 'BERRY UPDATE' },
    // tab Panelinfo
    'maintain.panelinfo': { page: 'Panelinfo' },
    // tab Global Settings
    'maintain.globalSettings': { page: 'globelSettings', de: 'Einstellungen', en: 'Settings' },
    'maintain.thermo2Tenths': {
        page: 'cardThermo2',
        de: '5. Solltemperatur: Minimum, Maximum, Schrittweite',
        en: '5. Set temperature: minimum, maximum, step',
    },
    // tab MQTT server settings
    'maintain.mqttBroker': {
        page: 'General',
        de: 'Eigener Server oder externer Broker',
        en: 'Own server or external broker',
    },
    'maintain.mqttConnection': {
        page: 'Adapter-Installation',
        de: '2. MQTT-Verbindung einstellen',
        en: '2. Setting up the MQTT connection',
    },
    'maintain.tasmotaPassword': {
        page: 'General',
        de: 'Was das Tasmota-Passwort bewirkt',
        en: 'What the Tasmota password is for',
    },
    // tab Web panels
    'maintain.webAccess': {
        page: 'WebPanel',
        de: '6. Zugang schützen: PIN, HTTPS, Sicherheitsschlüssel',
        en: '6. Protecting access: PIN, HTTPS, security key',
    },
    // tab Developer
    'maintain.customTft': { page: 'Developer', de: 'Eigene TFT einspielen', en: 'Flashing a custom TFT' },
} satisfies Record<`maintain.${string}`, DocTopic>;
