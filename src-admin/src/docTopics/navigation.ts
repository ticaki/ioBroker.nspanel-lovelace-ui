import type { DocTopic } from './types';

/**
 * Help topics of the area "navigation". Keys start with `navigation.`; see `DocTopic` for the heading texts.
 */
export const navigationTopics = {
    // Navigation flow tab
    'navigation.page': { page: 'naviFlow' },
    'navigation.whatShown': { page: 'naviFlow', de: '1. Was der Tab zeigt', en: '1. What the tab shows' },
    'navigation.header': {
        page: 'naviFlow',
        de: '2. Kopfzeile: Filter und Knöpfe',
        en: '2. Header: filters and buttons',
    },
    'navigation.legend': { page: 'naviFlow', de: '3. Die Legende lesen', en: '3. Reading the legend' },
    'navigation.arrange': { page: 'naviFlow', de: '4. Anordnen und Einklappen', en: '4. Arranging and collapsing' },
    'navigation.details': { page: 'naviFlow', de: '5. Seitendetails rechts', en: '5. Page details on the right' },
    'navigation.edit': { page: 'naviFlow', de: '6. Navigation bearbeiten', en: '6. Editing the navigation' },
    'navigation.scope': {
        page: 'naviFlow',
        de: '7. Geltungsbereich bei Seiten für alle Panels',
        en: '7. Scope for pages assigned to all panels',
    },
    'navigation.override': {
        page: 'naviFlow',
        de: '8. Skript-Seiten überschreiben',
        en: '8. Overriding script pages',
    },
    'navigation.save': { page: 'naviFlow', de: '9. Speichern und Neustart', en: '9. Saving and restart' },

    // panel assignment column of the PageConfig tab
    'navigation.assignment': {
        page: 'PageConfig',
        de: 'Panelzuweisung und Navigation',
        en: 'Panel assignment and navigation',
    },
    'navigation.pageDetails': { page: 'PageConfig', de: 'Seitendetails', en: 'Page details' },
    'navigation.scroll': {
        page: 'pageMenu',
        de: '7. Blättern der Seitenelemente',
        en: '7. Paging of the page items',
    },

    // NSPanel settings tab
    'navigation.panelSettings': { page: 'NSPanelsetting' },
    'navigation.panelCreate': {
        page: 'NSPanelsetting',
        de: '2. Panel anlegen oder aktualisieren',
        en: '2. Creating or updating a panel',
    },
    'navigation.panelCard': { page: 'NSPanelsetting', de: '4. Die Panelkachel', en: '4. The panel card' },
    'navigation.noScript': {
        page: 'NSPanelsetting',
        de: '5. Panel benutzt kein Skript',
        en: '5. Panel uses no script',
    },

    // web panels
    'navigation.webPanelAdd': {
        page: 'WebPanel',
        de: '3. Ein eigenständiges Web-Panel anlegen',
        en: '3. Adding a standalone web panel',
    },
    'navigation.webPanelModel': {
        page: 'WebPanel',
        de: '4. Modell wählen: Format und Plätze',
        en: '4. Choosing the model: format and places',
    },

    // panel configuration export / import
    'navigation.transfer': { page: 'panelConfigTransfer' },
    'navigation.exportSecrets': {
        page: 'panelConfigTransfer',
        de: '3. PINs und WLAN-Passwörter',
        en: '3. PINs and Wi-Fi passwords',
    },
    'navigation.importGroups': {
        page: 'panelConfigTransfer',
        de: '4. Importieren: die Teile wählen',
        en: '4. Importing: choosing the parts',
    },
    'navigation.importMode': { page: 'panelConfigTransfer', de: '5. Der Importmodus', en: '5. The import mode' },
    'navigation.importReview': { page: 'panelConfigTransfer', de: '6. Die Übersicht', en: '6. The review' },
    'navigation.importConflicts': { page: 'panelConfigTransfer', de: '7. Namenskonflikte', en: '7. Name conflicts' },
    'navigation.importScriptPages': {
        page: 'panelConfigTransfer',
        de: '8. Seiten, die auch in einem Skript vorkommen',
        en: '8. Pages that also exist in a script',
    },
    'navigation.importOverwrite': {
        page: 'panelConfigTransfer',
        de: '9. Die Sicherheitsabfrage bei „Komplett überschreiben"',
        en: '9. The confirmation for "Overwrite completely"',
    },
    'navigation.importResult': { page: 'panelConfigTransfer', de: '10. Die Zusammenfassung', en: '10. The result' },
    'navigation.importTiming': {
        page: 'panelConfigTransfer',
        de: '11. Wann die Änderungen wirken',
        en: '11. When the changes take effect',
    },
    'navigation.importErrors': { page: 'panelConfigTransfer', de: '12. Fehlerfälle', en: '12. Error cases' },

    // script -> admin conversion
    'navigation.migration': { page: 'Migration' },
    'navigation.migrationPreview': { page: 'Migration', de: '3. Die Vorschau', en: '3. The preview' },
    'navigation.migrationPages': { page: 'Migration', de: 'Seiten', en: 'Pages' },
    'navigation.migrationScreensaver': { page: 'Migration', de: 'Screensaver', en: 'Screensaver' },
    'navigation.migrationButtons': { page: 'Migration', de: 'Hardware-Buttons', en: 'Hardware buttons' },
    'navigation.migrationReasons': {
        page: 'Migration',
        de: 'Gründe in „Probleme und Hinweise"',
        en: 'Reasons in "Problems and notes"',
    },
    'navigation.migrationScript': {
        page: 'Migration',
        de: '5. Was mit dem Skript passiert',
        en: '5. What happens to the script',
    },
    'navigation.migrationCourse': {
        page: 'Migration',
        de: '6. Ablauf der Übernahme',
        en: '6. Course of the conversion',
    },
    'navigation.migrationErrors': { page: 'Migration', de: '7. Fehlerfälle', en: '7. Error cases' },
} satisfies Record<`navigation.${string}`, DocTopic>;
