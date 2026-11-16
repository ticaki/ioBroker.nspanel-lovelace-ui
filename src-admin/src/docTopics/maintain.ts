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
        de: '3. Tasmota und TFT aktualisieren',
        en: '3. Updating Tasmota and TFT',
    },
    'maintain.berryInstall': { page: 'tasmotatools', de: 'Die Werkzeuge', en: 'The tools' },
    // tab Panelinfo
    'maintain.panelinfo': { page: 'Panelinfo' },
    // tab Global Settings
    'maintain.globalSettings': { page: 'globelSettings' },
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
} satisfies Record<`maintain.${string}`, DocTopic>;
