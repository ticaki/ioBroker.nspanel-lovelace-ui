import type { DocTopic } from './types';

/**
 * Help topics of the area "pages1". Keys start with `pages1.`; see `DocTopic` for the heading texts.
 */
export const pages1Topics = {
    // PageConfig tab
    'pages1.overview': { page: 'PageConfig' },
    'pages1.panelFilter': { page: 'PageConfig', de: 'Panel-Filter', en: 'Panel filter' },
    'pages1.pageType': { page: 'PageConfig', de: 'Seitentyp', en: 'Page type' },
    'pages1.createDelete': {
        page: 'PageConfig',
        de: 'Seiten anlegen und löschen',
        en: 'Creating and deleting pages',
    },

    // whole card pages, one per entry of the page type select (see pageTypeDocTopic)
    'pages1.type.pageMenu': { page: 'pageMenu' },
    'pages1.type.cardAlarm': { page: 'cardAlarm' },
    'pages1.type.cardQR': { page: 'cardQR' },
    'pages1.type.cardPower': { page: 'cardPower' },
    'pages1.type.cardTrash': { page: 'cardTrash' },
    'pages1.type.cardChart': { page: 'cardChart' },
    'pages1.type.cardPChart': { page: 'cardPChart' },
    'pages1.type.cardThermo2': { page: 'cardThermo2' },
    'pages1.type.cardThermo': { page: 'cardThermo' },
    'pages1.type.cardMedia': { page: 'cardMedia' },
    'pages1.type.pageLink': { page: 'pageLink' },

    // menu page editor
    'pages1.menuVariants': { page: 'pageMenu', de: '2. Die fünf Varianten', en: '2. The five variants' },
    'pages1.menuTiles': { page: 'pageMenu', de: '3. Flächen belegen', en: '3. Filling the tiles' },
    'pages1.menuMorePages': {
        page: 'pageMenu',
        de: '6. Mehr Einträge: weitere Seiten',
        en: '6. More entries: further pages',
    },

    // page link editor
    'pages1.linkPurpose': { page: 'pageLink', de: '1. Wozu dieser Seitentyp', en: '1. What this page type is for' },
    'pages1.linkFields': {
        page: 'pageLink',
        de: '3. Die Felder der Verknüpfung',
        en: '3. The fields of the page link',
    },
    'pages1.linkErrors': { page: 'pageLink', de: '7. Die beiden Fehlerfälle', en: '7. The two error cases' },

    // alarm / unlock editor
    'pages1.alarmMode': {
        page: 'cardAlarm',
        de: '2. Betriebsart: Alarm oder Entsperren',
        en: '2. Operating mode: alarm or unlock',
    },
    'pages1.alarmPin': { page: 'cardAlarm', de: '3. PIN', en: '3. PIN' },
    'pages1.alarmButtons': {
        page: 'cardAlarm',
        de: '4. Die Schaltflächen der Alarm-Seite',
        en: '4. The buttons of the alarm page',
    },
    'pages1.alarmApproved': {
        page: 'cardAlarm',
        de: '6. Genehmigt: Bestätigung von außen',
        en: '6. Approved: confirmation from outside',
    },
    'pages1.alarmGlobal': {
        page: 'cardAlarm',
        de: '7. Ein Zustand für mehrere Panels',
        en: '7. One state for several panels',
    },
    'pages1.alarmUnlockTarget': {
        page: 'cardAlarm',
        de: '8. Die Entsperrseite und ihr Sprungziel',
        en: '8. The unlock page and its target',
    },

    // QR editor
    'pages1.qrType': { page: 'cardQR', de: '2. QR-Code-Typ', en: '2. QR code type' },
    'pages1.qrWifi': {
        page: 'cardQR',
        de: '4. WLAN: Verschlüsselung, Passwort, verstecktes Netz',
        en: '4. WiFi: encryption, password, hidden network',
    },
    'pages1.qrCredential': {
        page: 'cardQR',
        de: '5. Das Passwort aus den zentralen Zugangsdaten',
        en: '5. The password from the central credentials',
    },
    'pages1.qrSwitch': {
        page: 'cardQR',
        de: '6. Das WLAN per Schalter freigeben',
        en: '6. Enabling the WiFi with a switch',
    },

    // chart editor
    'pages1.chartType': {
        page: 'cardChart',
        de: '2. Diagrammtyp: Säulen oder Linie',
        en: '2. Chart type: columns or line',
    },
    'pages1.chartLabels': {
        page: 'cardChart',
        de: '3. Überschrift, Farbe, Achsenbeschriftung',
        en: '3. Headline, colour, axis label',
    },
    'pages1.chartSource': { page: 'cardChart', de: '4. Datenquelle: die Weiche', en: '4. Data source: the switch' },
    'pages1.chartDb': {
        page: 'cardChart',
        de: '5. Weg A: Daten aus einem Verlaufsadapter',
        en: '5. Way A: data from a history adapter',
    },
    'pages1.chartScript': {
        page: 'cardChart',
        de: '6. Weg B: Daten aus eigenen Datenpunkten',
        en: '6. Way B: data from your own states',
    },
    'pages1.chartYAxis': {
        page: 'cardChart',
        de: '7. Die Y-Achse und die Zwei-Zeichen-Regel',
        en: '7. The y-axis and the two-character rule',
    },
    'pages1.chartTimeAxis': { page: 'cardChart', de: '8. Die Zeitachse', en: '8. The time axis' },
    'pages1.chartOldTable': {
        page: 'cardChart',
        de: '11. Seiten aus der alten Tabelle „Page Chart"',
        en: '11. Pages from the old table „Page Chart"',
    },

    // pie chart editor
    'pages1.pchartCreate': {
        page: 'cardPChart',
        de: 'Anlegen im Tab PageConfig',
        en: 'Creating the page in the PageConfig tab',
    },
    'pages1.pchartValues': {
        page: 'cardPChart',
        de: 'Werte aus Datenpunkten (Standard)',
        en: 'Values from states (default)',
    },
    'pages1.pchartRange': { page: 'cardPChart', de: 'Zeitraum', en: 'Time range' },
    'pages1.pchartSlices': { page: 'cardPChart', de: 'Scheiben', en: 'Slices' },
    'pages1.pchartScript': { page: 'cardPChart', de: 'Skript-Datenpunkt', en: 'Script data point' },
} satisfies Record<`pages1.${string}`, DocTopic>;

/** Entries of the page type select that create a page, each with the documentation page of its card. */
const pageTypeTopics = {
    pageMenu: pages1Topics['pages1.type.pageMenu'],
    cardAlarm: pages1Topics['pages1.type.cardAlarm'],
    cardQR: pages1Topics['pages1.type.cardQR'],
    cardPower: pages1Topics['pages1.type.cardPower'],
    cardTrash: pages1Topics['pages1.type.cardTrash'],
    cardChart: pages1Topics['pages1.type.cardChart'],
    cardPChart: pages1Topics['pages1.type.cardPChart'],
    cardThermo2: pages1Topics['pages1.type.cardThermo2'],
    cardThermo: pages1Topics['pages1.type.cardThermo'],
    cardMedia: pages1Topics['pages1.type.cardMedia'],
    pageLink: pages1Topics['pages1.type.pageLink'],
} satisfies Record<string, DocTopic>;

/** Value of the page type select that has its own documentation page. */
export type DocumentedPageType = keyof typeof pageTypeTopics;

/**
 * Type guard: the page type select value has its own documentation page.
 *
 * @param value Value of the page type select (`all`, `mainPages` or a card type).
 * @returns `true` for a documented page type.
 */
export function isDocumentedPageType(value: string): value is DocumentedPageType {
    return Object.prototype.hasOwnProperty.call(pageTypeTopics, value);
}

/**
 * Documentation page of an entry of the page type select.
 *
 * @param value Value of the page type select.
 * @returns The page topic, or `undefined` for the filters `all` / `mainPages`.
 */
export function pageTypeDocTopic(value: string): DocTopic | undefined {
    return isDocumentedPageType(value) ? pageTypeTopics[value] : undefined;
}
