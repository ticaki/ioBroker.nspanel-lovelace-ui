import type { DocTopic } from './types';

/**
 * Help topics of the area "dialogs". Keys start with `dialogs.`; see `DocTopic` for the heading texts.
 */
export const dialogsTopics = {
    'dialogs.pageItem': {
        page: 'PageConfig-Dialoge',
        de: '1. Pageitem-Konfiguration',
        en: '1. Pageitem Configuration',
    },
    'dialogs.rawItem': {
        page: 'PageConfig-Dialoge',
        de: '2. Rohdaten des Items',
        en: '2. Raw data of the item',
    },
    'dialogs.rawItemFormat': {
        page: 'PageConfig-Dialoge',
        de: 'Das Format: native oder script',
        en: 'The format: native or script',
    },
    'dialogs.rawItemEditor': {
        page: 'PageConfig-Dialoge',
        de: 'Der JSON-Editor',
        en: 'The JSON editor',
    },
    'dialogs.rawItemActive': {
        page: 'PageConfig-Dialoge',
        de: 'Solange Rohdaten aktiv sind',
        en: 'While raw data is active',
    },
    'dialogs.dynamicName': {
        page: 'PageConfig-Dialoge',
        de: '4. Dynamischer Name',
        en: '4. Dynamic name',
    },
    'dialogs.valueDisplay': {
        page: 'PageConfig-Dialoge',
        de: '5. Wertanzeige-Konfiguration am Kanal',
        en: '5. Value Display Configuration at the channel',
    },
    'dialogs.dateFormat': {
        page: 'PageConfig-Dialoge',
        de: 'Datumsformat',
        en: 'Date Format',
    },
    'dialogs.colorOptions': {
        page: 'PageConfig-Dialoge',
        de: '6. Farboptionen',
        en: '6. Color Options',
    },
    'dialogs.colorScale': {
        page: 'PageConfig-Dialoge',
        de: 'Farbeinstellungen aktivieren',
        en: 'Enable Color Settings',
    },
    'dialogs.colorFields': {
        page: 'PageConfig-Dialoge',
        de: 'Die drei Farbfelder',
        en: 'The three colour fields',
    },
    'dialogs.colorRange': {
        page: 'PageConfig-Dialoge',
        de: 'Wertebereich, Farbmodus und Skalierung',
        en: 'Value range, colour mode and scaling',
    },
    'dialogs.modeList': {
        page: 'PageConfig-Dialoge',
        de: '7. Modusliste',
        en: '7. Mode list',
    },
    'dialogs.modeListCheck': {
        page: 'PageConfig-Dialoge',
        de: 'Die Prüfung des Auswahl-Datenpunkts',
        en: 'The check of the selection datapoint',
    },
    'dialogs.modeListLimits': {
        page: 'PageConfig-Dialoge',
        de: 'Grenzen, die der Dialog mitzählt',
        en: 'Limits the dialog keeps counting',
    },
    'dialogs.hwButton': {
        page: 'NSPanelsetting',
        de: '6. Die Hardware-Taster: zwei Knöpfe, zwei Dialoge',
        en: '6. The hardware buttons: two buttons, two dialogs',
    },
    'dialogs.hwButtonDetach': {
        page: 'NSPanelsetting',
        de: '7. Relais entkoppeln',
        en: '7. Decoupling the relay',
    },
    'dialogs.hwButtonAction': {
        page: 'NSPanelsetting',
        de: '8. Die Funktionsarten',
        en: '8. The action types',
    },
} satisfies Record<`dialogs.${string}`, DocTopic>;
