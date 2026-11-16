import type { DocTopic } from './types';

/**
 * Help topics of the area "pages2". Keys start with `pages2.`; see `DocTopic` for the heading texts.
 */
export const pages2Topics = {
    'pages2.chartType': {
        page: 'cardChart',
        de: '2. Diagrammtyp: Säulen oder Linie',
        en: '2. Chart type: columns or line',
    },

    // cardPower
    'pages2.powerGrid': {
        page: 'cardPower',
        de: '2. Das Raster: sechs Flächen um das Haus',
        en: '2. The grid: six tiles around the house',
    },
    'pages2.powerFlow': { page: 'cardPower', de: '3. Einen Fluss einrichten', en: '3. Setting up a flow' },
    'pages2.powerColorScale': {
        page: 'cardPower',
        de: '4. Farbe nach Wert: die Farbskala',
        en: '4. Colour by value: the colour scale',
    },
    'pages2.powerSpeed': {
        page: 'cardPower',
        de: '5. Geschwindigkeit und Flussrichtung',
        en: '5. Speed and flow direction',
    },
    'pages2.powerHomeValues': { page: 'cardPower', de: '6. Die beiden Hauswerte', en: '6. The two house values' },
    'pages2.powerInternalSum': { page: 'cardPower', de: '7. Die interne Summe', en: '7. The internal sum' },
    'pages2.powerNavigation': {
        page: 'cardPower',
        de: '9. Panel-Zuweisung und Navigation',
        en: '9. Panel assignment and navigation',
    },

    // cardThermo
    'pages2.thermoFields': { page: 'cardThermo', de: '3. Die Felder des Editors', en: '3. The fields of the editor' },
    'pages2.thermoStates': {
        page: 'cardThermo',
        de: '5. Was der Adapter aus den Datenpunkten baut',
        en: '5. What the adapter builds from the states',
    },
    'pages2.thermoLimits': {
        page: 'cardThermo',
        de: '4. Minimum, Maximum, Schrittweite',
        en: '4. Minimum, maximum, step',
    },

    // cardThermo2
    'pages2.thermo2Editor': { page: 'cardThermo2', de: '2. Der Editor im Überblick', en: '2. The editor at a glance' },
    'pages2.thermo2Circuit': {
        page: 'cardThermo2',
        de: '3. Heizkreis: Datenquelle und Überschrift',
        en: '3. Heat circuit: data source and headline',
    },
    'pages2.thermo2States': { page: 'cardThermo2', de: 'Einzelne Datenpunkte', en: 'Single data points' },
    'pages2.thermo2CircuitName': {
        page: 'cardThermo2',
        de: 'Überschrift des Heizkreises',
        en: 'Headline of the heat circuit',
    },
    'pages2.thermo2CircuitOrder': {
        page: 'cardThermo2',
        de: 'Reihenfolge, Entfernen, Übernehmen',
        en: 'Order, removing, applying',
    },
    'pages2.thermo2AliasButtons': {
        page: 'cardThermo2',
        de: '4. Die Schaltflächen aus dem Alias',
        en: '4. The buttons from the alias',
    },
    'pages2.thermo2Limits': {
        page: 'cardThermo2',
        de: '5. Solltemperatur: Minimum, Maximum, Schrittweite',
        en: '5. Set temperature: minimum, maximum, step',
    },
    'pages2.thermo2Display': {
        page: 'cardThermo2',
        de: '6. Anzeige der Werte: Symbol, Farbe, Einheit',
        en: '6. Value display: icon, color, unit',
    },
    'pages2.thermo2Mode': { page: 'cardThermo2', de: '7. Modusanzeige', en: '7. Mode display' },
    'pages2.thermo2HeatIcon': { page: 'cardThermo2', de: '8. Heizkreis-Symbol', en: '8. Circuit icon' },
    'pages2.thermo2Items': {
        page: 'cardThermo2',
        de: '9. PageItems: anlegen, verschieben, freie Flächen',
        en: '9. Page items: adding, moving, free slots',
    },
    'pages2.thermo2SortOrder': { page: 'cardThermo2', de: '10. Anordnung der Flächen', en: '10. Order of the slots' },

    // cardTrash
    'pages2.trashSource': { page: 'cardTrash', de: '4. Woher die Termine kommen', en: '4. Where the dates come from' },
    'pages2.trashSourceState': { page: 'cardTrash', de: 'Weg 1: ical-Adapter', en: 'Way 1: ical adapter' },
    'pages2.trashSourceFile': { page: 'cardTrash', de: 'Weg 2: .ics-Datei', en: 'Way 2: .ics file' },
    'pages2.trashEvents': {
        page: 'cardTrash',
        de: '5. Ereignisse suchen und übernehmen',
        en: '5. Searching for events and applying them',
    },
    'pages2.trashTypes': { page: 'cardTrash', de: '6. Die sechs Abfallarten', en: '6. The six waste types' },
    'pages2.trashMatching': {
        page: 'cardTrash',
        de: '7. Wie ein Termin seine Zeile findet',
        en: '7. How a date finds its line',
    },
    'pages2.trashPanel': {
        page: 'cardTrash',
        de: '8. Was auf dem Panel erscheint',
        en: '8. What appears on the panel',
    },

    // cardMedia
    'pages2.mediaEditor': { page: 'cardMedia', de: '2. Der Editor im Überblick', en: '2. The editor at a glance' },
    'pages2.mediaPlayer': {
        page: 'cardMedia',
        de: '3. Player, Prüfung und Überschrift',
        en: '3. Player, check and headline',
    },
    'pages2.mediaPlayerSelect': { page: 'cardMedia', de: 'Die Auswahlliste', en: 'The selection list' },
    'pages2.mediaPlayerCheck': { page: 'cardMedia', de: 'Die Prüfung', en: 'The check' },
    'pages2.mediaHeadline': { page: 'cardMedia', de: 'Überschrift', en: 'Headline' },
    'pages2.mediaColors': { page: 'cardMedia', de: '4. Farben', en: '4. Colors' },
    'pages2.mediaVolume': {
        page: 'cardMedia',
        de: '5. Lautstärke: Bereich und Voreinstellungen',
        en: '5. Volume: range and presets',
    },
    'pages2.mediaStandardItems': {
        page: 'cardMedia',
        de: '6. Standard-Elemente des Players',
        en: '6. Standard items of the player',
    },
    'pages2.mediaItemSettings': {
        page: 'cardMedia',
        de: 'Einstellungen eines Elements',
        en: 'Settings of an item',
    },
    'pages2.mediaLists': {
        page: 'cardMedia',
        de: '7. Die drei Listen: Lautsprecher, Playlisten, Favoriten',
        en: '7. The three lists: speakers, playlists, favorites',
    },
    'pages2.mediaOwnItems': { page: 'cardMedia', de: '8. Eigene Seitenelemente', en: '8. Own page items' },
} satisfies Record<`pages2.${string}`, DocTopic>;
