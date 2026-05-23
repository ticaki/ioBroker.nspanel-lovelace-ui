# Page Menü / Grid (`cardGrid`, `cardGrid2`, `cardGrid3`)

Die **Grid-Karten** zeigen eine Seite mit Kacheln an, in denen jeweils ein [PageItem](ScriptConfig#pageitems) (Entität oder Navigation) dargestellt wird. Es gibt drei Varianten, die sich nur in der Anzahl der Kacheln und im Layout unterscheiden. Werden mehr PageItems definiert als Kacheln vorhanden sind, kann durch die Seite geblättert werden.

Grid-Karten lassen sich auf zwei Wegen anlegen:
- im **Konfigurationsskript** als Seite vom Typ `PageGrid`/`PageGrid2`/`PageGrid3` mit eigenem `items`-Array, **oder**
- im **Admin** über eine **Menü-Seite** (intern „cardMenue"), ohne Skript-Eintrag.

> Dieselbe Menü-Seite im Admin erzeugt auch die Kartentypen [`cardEntities`](Pages) (Listen-Layout) und `cardSchedule` (Zeitschaltplan). Sie teilen sich Editor und Blätter-/Filterlogik mit den Grids, haben aber eine eigene Kachelzahl.

---

## Grid-Varianten

| `type` | `ScriptConfig`-Typ | Kacheln | Hinweis |
|--------|--------------------|:-------:|---------|
| `cardGrid` | `PageGrid` | 6 | Standard-Raster |
| `cardGrid2` | `PageGrid2` | 8 (9 bei US-Hochformat) | größere Kacheln, `fontSize`/`useValue` je PageItem möglich |
| `cardGrid3` | `PageGrid3` | 4 | großes Raster mit wenigen, prominenten Kacheln |

Zum Vergleich die übrigen Menü-Kartentypen: `cardEntities` 4 (US-Hochformat 5), `cardSchedule` 6.

---

## Variante 1: Im Konfigurationsskript

Im Skript wird die Seite mit dem passenden Typ angelegt; die Kacheln werden über das `items`-Array mit PageItems gefüllt:

```typescript
const wohnzimmer: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'wohnzimmer',
    heading: 'Wohnzimmer',
    items: [
        { id: 'alias.0.NSPanel_1.Luftreiniger', name: 'Luftreiniger', icon: 'power', offColor: MSRed, onColor: MSGreen },
        { navigate: true, icon: 'home', name: 'Haus', targetPage: 'main' },
    ],
};
```

Der vollständige Aufbau eines PageItems (Pflicht- und optionale Felder, Farben, `colorScale`, Navigation, Langdruck …) ist unter [ScriptConfig → PageItems](ScriptConfig#pageitems) beschrieben. Bei `cardGrid2` wirken zusätzlich die PageItem-Optionen `useValue` und `fontSize` (Schriftgröße 0–5).

### Blättern & Filtern

Grid-Karten unterstützen die Blätter- und Filteroptionen aus [ScriptConfig → weitere Parameter für die Navigation auf der Seite](ScriptConfig#weitere-parameter-für-die-navigation-auf-der-seite):

- `scrollPresentation`: `'classic'` (Standard, seitenweise über den Pfeil oben rechts) · `'arrow'` (Pfeil-Kachel auf dem letzten Platz) · `'auto'` (automatisches Weiterblättern; Intervall über `scrollAutoTiming` in Sekunden, Standard 15).
- `scrollType`: `'page'` (Standard, ganze Seite) · `'half'` (halbe Seite).
- `filterType`: `'true'` / `'false'` / `number` — blendet abhängig vom Primärwert nur passende PageItems ein.

---

## Variante 2: Im Admin (Menü-Seite / cardMenue)

In der Menü-Seite können alle Grid-Typen, `cardEntities` und `cardSchedule` direkt im Admin angelegt werden und müssen somit nicht im Skript erstellt werden. Aktuell stehen pro Kachel die Grundfunktionen `targetPage`, `trueColor` (= `onColor`), `falseColor` (= `offColor`), `trueIcon` (= `icon`), `falseIcon` (= `icon2`) und `name` zur Verfügung.

### Grundlagen
Die allgemeine Bedienung des Tabs ist unter [Page Config](PageConfig) beschrieben und sollte vorab gelesen werden.

### Einstellungen im Detail

> 🖼️ **Bild fehlt:** Admin-Konfiguration einer Menü-Seite (Überschrift, Kartentyp, Kachel-Layout).
> Pfad: `Pictures/cardMenue/config.png`

![Menü-Konfiguration](Pictures/cardMenue/config.png)

#### Überschrift
Die Überschrift der Seite.

#### Kartentyp
Hier wird der Kartentyp ausgewählt; je nach Typ ändert sich das Layout der Kachel-Felder. Das Layout entspricht der Anzeige auf dem Panel.

#### PanelLayout / Hinzufügen von PageItems
Ein Klick auf ein Feld öffnet den Hauptdialog für das PageItem.

> 🖼️ **Bild fehlt:** Hauptdialog eines PageItems (Navigation-Checkbox, Objektauswahl, Name, Bedingungen).
> Pfad: `Pictures/cardMenue/mainDialog.png`

![Hauptdialog](Pictures/cardMenue/mainDialog.png)

- **Checkbox „ist eine Navigation"** — legt fest, dass das PageItem beim Drücken auf eine Zielseite springt (entspricht `navigate: true`). Es wird das Dropdown „Zielseite" eingeblendet (`targetPage`).
- **ioBroker-Kanal** — Klick auf den Button mit den drei Punkten öffnet den Objektbrowser zur Kanalauswahl.
  > [!NOTE]
  > Es muss ein State ausgewählt werden, damit der Kanal übernommen wird. Bei Fehlern im Kanal erscheint ein Symbol hinter dem Button und unten ein Button „Details" mit der Fehlermeldung.
- **Name** — eigener Name für das PageItem. Ohne Eintrag wird der Name aus `common.name` ermittelt; fehlt auch dieser, wird der Name der Rolle genutzt.
- **Bedingungen true/false** — abweichendes Icon und abweichende Farbe gegenüber den Standardeinstellungen.

Im Panellayout können die PageItems per Drag-and-drop verschoben sowie kopiert und eingefügt werden. Sollen mehr PageItems eingefügt werden als auf eine Seite passen, lässt sich über den Button „Seite hinzufügen" eine weitere Seite anlegen. Dabei kann gewählt werden, ob im letzten PageItem der Seite ein **Pfeil** zum Blättern eingefügt wird (`scrollPresentation: 'arrow'`) oder mit den Navigationspfeilen der Seite geblättert wird (`'classic'`).

---

## Verwandte Seiten

- [ScriptConfig](ScriptConfig) — Seitenaufbau und PageItems
- [Page Config](PageConfig) — Admin-Tab zur Seitenkonfiguration
- [Pages](Pages) — Übersicht aller Seitentypen
