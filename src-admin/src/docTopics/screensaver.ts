import type { DocTopic } from './types';

/**
 * Help topics of the area "screensaver". Keys start with `screensaver.`; see `DocTopic` for the heading texts.
 */
export const screensaverTopics = {
    'screensaver.page': { page: 'screensaver' },
    'screensaver.itemDialog': { page: 'screensaver', de: '4. Items: der Item-Dialog', en: '4. Items: the item dialog' },
    'screensaver.create': { page: 'screensaver', de: '1. Bildschirmschoner anlegen', en: '1. Creating a screensaver' },
    'screensaver.editor': { page: 'screensaver', de: '2. Der Editor im Überblick', en: '2. The editor at a glance' },
    'screensaver.versionPanels': { page: 'screensaver', de: '3. Version und Panels', en: '3. Version and panels' },
    'screensaver.templates': { page: 'screensaver', de: '5. Templates als Item', en: '5. Templates as items' },
    'screensaver.raw': { page: 'screensaver', de: '6. Rohdaten (JSON)', en: '6. Raw data (JSON)' },
    'screensaver.paging': {
        page: 'screensaver',
        de: '7. Mehr Items als Plätze: Fenster und Blättern',
        en: '7. More items than places: windows and paging',
    },
    'screensaver.indicators': { page: 'screensaver', de: '8. Indikatoren und Tasten', en: '8. Indicators and buttons' },
    'screensaver.longPress': { page: 'screensaver', de: 'Aktion bei langem Drücken', en: 'Action on long press' },
    'screensaver.statusIcons': { page: 'screensaver', de: '9. Statussymbole', en: '9. Status icons' },
    'screensaver.timeDate': { page: 'screensaver', de: '10. Uhrzeit und Datum', en: '10. Time and date' },
    'screensaver.timer': { page: 'screensaver', de: 'Timer statt Uhrzeit', en: 'Timer instead of the clock' },
    'screensaver.timerStates': { page: 'screensaver', de: 'Quelle: zwei Datenpunkte', en: 'Source: two states' },
    'screensaver.timerItem': {
        page: 'screensaver',
        de: 'Quelle: Pageitem mit Timer-Popup',
        en: 'Source: page item with timer popup',
    },
    'screensaver.weather': { page: 'screensaver', de: '11. Wetter', en: '11. Weather' },
    'screensaver.options': {
        page: 'screensaver',
        de: '12. Optionen: Rotation und Wischen',
        en: '12. Options: rotation and swipe',
    },
    'screensaver.saving': {
        page: 'screensaver',
        de: '14. Speichern – was der Adapter daraus macht',
        en: '14. Saving – what the adapter does with it',
    },
    'screensaver.tiles': { page: 'screensaver', de: '16. Kacheln', en: '16. Tiles' },
    'screensaver.notifyPage': { page: 'Screensaver-Notify' },
    'screensaver.notifyList': { page: 'Screensaver-Notify', de: '1. Die Liste', en: '1. The list' },
    'screensaver.notifyContent': {
        page: 'Screensaver-Notify',
        de: '2. Inhalt: Überschrift und Text',
        en: '2. Content: headline and text',
    },
    'screensaver.notifyCondition': {
        page: 'Screensaver-Notify',
        de: '3. Wann anzeigen: Datenpunkte und Bedingung',
        en: '3. When to show: states and condition',
    },
    'screensaver.notifyPriority': {
        page: 'Screensaver-Notify',
        de: '4. Priorität: welche Meldung das Panel zeigt',
        en: '4. Priority: which message the panel shows',
    },
    'screensaver.notifyDismiss': {
        page: 'Screensaver-Notify',
        de: '5. Quittieren und Gruppen-ID',
        en: '5. Dismissing and the group ID',
    },
    'screensaver.notifyBuzzer': { page: 'Screensaver-Notify', de: '6. Summer', en: '6. Buzzer' },
    'screensaver.notifyPreview': {
        page: 'Screensaver-Notify',
        de: '7. Vorschau und was der Dialog prüft',
        en: '7. Preview and what the dialog checks',
    },
} satisfies Record<`screensaver.${string}`, DocTopic>;
