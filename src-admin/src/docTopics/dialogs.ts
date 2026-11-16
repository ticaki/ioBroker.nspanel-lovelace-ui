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
    'dialogs.colorOptions': {
        page: 'PageConfig-Dialoge',
        de: '6. Farboptionen',
        en: '6. Color Options',
    },
    'dialogs.modeList': {
        page: 'PageConfig-Dialoge',
        de: '7. Modusliste',
        en: '7. Mode list',
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
