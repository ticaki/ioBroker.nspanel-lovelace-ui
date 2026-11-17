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
    // tab Maintain: tooltips of the panel cards (DocTooltip)
    'maintain.card': { page: 'Maintain', de: '2. Die Karte eines Panels', en: '2. The card of a panel' },
    'maintain.noScript': { page: 'Maintain', de: '5. Panels ohne Skript', en: '5. Panels without a script' },
    'maintain.webPanels': { page: 'Maintain', de: '6. Web-Panels im Tab', en: '6. Web panels in the tab' },
    'maintain.convertScript': {
        page: 'Maintain',
        de: '7. Skript in den Admin übernehmen',
        en: '7. Taking the script over into the admin',
    },
    'maintain.greyButton': { page: 'Maintain', de: '8. Wenn ein Knopf grau bleibt', en: '8. When a button stays grey' },
    'maintain.versionFields': {
        page: 'Maintain',
        de: '9. Was die Versionsfelder sagen',
        en: '9. What the version fields say',
    },
    // web panel buttons and labels of the panel cards
    'maintain.webPanelReal': {
        page: 'WebPanel',
        de: '2. Ein echtes Panel im Browser öffnen',
        en: '2. Opening a real panel in the browser',
    },
    'maintain.webPanelBrowser': { page: 'WebPanel', de: '5. Bedienung im Browser', en: '5. Operation in the browser' },
    'maintain.webPanelLimits': {
        page: 'WebPanel',
        de: '7. Was ein Web-Panel nicht kann',
        en: '7. What a web panel cannot do',
    },
    'maintain.migrationNoScript': {
        page: 'Migration',
        de: '9. „Panel benutzt kein Skript"',
        en: '9. "Panel uses no script"',
    },
    // tab Panelinfo
    'maintain.panelinfo': { page: 'Panelinfo' },
    'maintain.panelinfoCard': { page: 'Panelinfo', de: 'Was die Kachel zeigt', en: 'What the card shows' },
    'maintain.panelinfoOperate': {
        page: 'Panelinfo',
        de: 'Bedienen statt nur ansehen',
        en: 'Operating, not just watching',
    },
    'maintain.panelinfoTempOffset': { page: 'Panelinfo', de: 'Temperaturoffset', en: 'Temperature offset' },
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
