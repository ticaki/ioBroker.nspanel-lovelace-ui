# Page Thermo2

Die Thermostat-Seite verwaltet bis zu acht Heizkreise auf einer Karte und nimmt zusätzlich eigene
Pageitems auf.

> **Eingerichtet wird sie im Admin.** Alle Felder, der Heizkreis-Dialog, die Objektauswahl und die
> Anordnung der Flächen stehen auf [Thermostat – Konfiguration im Admin](PageThermo2-Admin). Diese Seite
> beschreibt, **was am Panel ankommt**, und den **zweiten Weg** über das Konfigurationsskript.

<img alt='Thermo2 mit Datenpunkten' src='../Pictures/PageThermo2/Thermo2MitDatenpunkten.png'>

## Was am Panel ankommt

In der Mitte steht die Solltemperatur mit **−** und **+**, darum herum liegen die Flächen. Fest vergeben
sind sieben Felder, die der Adapter selbst füllt:

| Stelle | Inhalt |
|---|---|
| Zeile 1 | Symbol, Ist-Temperatur und Einheit |
| Zeile 3 | Symbol, Luftfeuchte und Einheit |
| zwischen − und + | der **Modustext** (`OFF`, `AUTO`, `HEAT` …, übersetzt) |

Dazu kommen die **acht Pageitems** ringsum — vier links, vier rechts. Mehr Items als Plätze lassen sich
anlegen; das Panel blättert dann.

> **Der Editor im Admin bietet neun Plätze an, am Panel kommen acht an.** Der Adapter begrenzt die Liste
> beim Bauen der Seite auf acht Einträge (`pageThermo2.ts`, `maxItems = 8`), während der Editor mit neun
> rechnet. Der neunte Platz — der zwischen − und + — ist in Wahrheit die feste Modusanzeige. Wer ihn im
> Editor belegt, sieht das Item am Panel nicht.

Die Reihenfolge der acht Flächen legt `sortOrder` fest: `V` (Vorgabe, senkrecht: links 1–4, rechts 5–8),
`H` (waagerecht), dazu `HM`, `VM`, `HB` und `VB` als abweichende Muster.

Jeder Heizkreis hat eine **eigene Überschrift**; zwischen den Kreisen blättert man am Panel. Mehr als acht
Heizkreise verwirft der Adapter mit einer Warnung („only 8 are supported").

## Der zweite Weg: das Konfigurationsskript

Im Skript sieht eine vollständige Seite so aus:

```typescript
const ThermoNew: PageType = {
    type: 'cardThermo2',
    uniqueName: 'main',
    heading: 'wird nicht angezeigt',   // die Überschrift kommt je Heizkreis aus `name`
    thermoItems: [
        { name: 'Wohnzimmer', id: '0_userdata.0.Einzelne_Geräte.Thermostat' },
    ],
    items: [
        { id: 'alias.0.Licht.lights.Gerät_1', filter: 0 },
        { id: 'alias.0.NSPanel.allgemein.shutter', filter: 1 },
    ],
};
```

`heading` wird bei dieser Karte **nicht angezeigt** — die Überschrift kommt aus `name` des Heizkreises,
ersatzweise aus `common.name` des Kanals. Auch `scrollType` und `scrollPresentation` wirken hier nicht;
die Karte blättert immer seitenweise.

### Entweder Alias … 

```typescript
thermoItems: [
    {
        name: 'Das hier ist die Überschrift',
        id: '0_userdata.0.Einzelne_Geräte.Thermostat', // Channel, Device oder Folder
    },
],
```

Der Kanal muss die Rolle **`thermostat`** oder **`airCondition`** haben (siehe [Alias-Tabelle](ALIAS));
jede andere Rolle lehnt der Adapter mit einer Fehlermeldung ab und entfernt den Eintrag.

Ein **`airCondition`-Kanal ergibt zwei Heizkreise** — Heizen und Kühlen. Der zweite benutzt `SET2`,
`name2`, `iconHeatCycle2`, `iconHeatCycleOnColor2` und `iconHeatCycleOffColor2`. **Fehlt `SET2`, fällt der
Kühlkreis weg**, denn ein Heizkreis ohne beschreibbaren Sollwert wird übersprungen.

### … oder direkt über Datenpunkte

Beides lässt sich nicht mischen, darf aber auf die Datenpunkte eines angelegten Kanals zeigen:

```typescript
thermoItems: [
    {
        name: 'Das hier ist die Überschrift',
        set: '0_userdata.0.…Thermostat.SET',        // Sollwert, Pflicht
        thermoId1: '0_userdata.0.…Thermostat.ACTUAL',   // obere Wertzeile, Pflicht
        thermoId2: '0_userdata.0.…Thermostat.HUMIDITY', // untere Wertzeile
        modeId: '0_userdata.0.…Thermostat.MODE',        // Modustext
    },
],
```

> **`set` muss existieren und beschreibbar sein.** Sonst überspringt der Adapter den ganzen Heizkreis und
> schreibt ins Log: *invalid SET datapoint. Not exists or not writeable!* Dasselbe gilt für `thermoId1`;
> angegebene, aber fehlende Datenpunkte für `thermoId2` und `modeId` werden ebenfalls beanstandet.

### Gemeinsame Felder

<img alt='Thermo2_1' src='../Pictures/PageThermo2/Thermo2_1.png'>
<img alt='Thermo2_2' src='../Pictures/PageThermo2/Thermo2_2.png'>

| Feld | Bedeutung |
|---|---|
| `icon`, `onColor` | Symbol und Farbe der ersten Wertzeile (Temperatur) |
| `icon2`, `onColor2` | dasselbe für die dritte Zeile (Luftfeuchte) |
| `unit` | Einheit — **im Skript für beide Wertzeilen**; `unit2` wirkt nur in der Admin-Konfiguration |
| `iconHeatCycle`, `iconHeatCycleOnColor`, `iconHeatCycleOffColor` | Symbol und Farben der Heizkreis-Fläche |
| `minValue`, `maxValue`, `stepValue` | Grenzen und Schrittweite der Solltemperatur (Vorgaben 15, 28 und 0,5) |
| `power` | Datenpunkt für Ein/Aus. Gibt es ihn, hat er Vorrang; sonst leitet der Adapter den Zustand aus `MODESET` beziehungsweise `modeId` ab. |
| `modeList` | eigene Beschriftung der Modi, siehe unten |

`power` und `unit` sind im Typ **nicht optional** — wer die Beispiele kompilieren lässt, gibt beide an.

Ob 10 im Datenpunkt 1 °C oder 10 °C bedeutet, stellt man einmalig im Admin unter *Nspanel-Einstellungen*
ein (Kompatibilität zum Skript).

### modeList

`modeId` beziehungsweise `MODE` und `MODESET` arbeiten gleich: ein Zahlenwert wählt den Text aus einer
Liste. Die Standardliste lautet

```typescript
['OFF', 'AUTO', 'COOL', 'HEAT', 'ECO', 'FAN', 'DRY']
```

und wird übersetzt. Eine 0 im Datenpunkt zeigt also *OFF*, eine 3 *HEAT*.

**Welche Liste gewinnt, hängt vom Weg ab:**

| Weg | Reihenfolge |
|---|---|
| Alias | `common.states` des Datenpunkts **zuerst**, danach `modeList`, zuletzt die Standardliste |
| Direkte Datenpunkte | `modeList` **zuerst**, danach `common.states`, zuletzt die Standardliste |

```typescript
modeList: ["Aus", "Automatik", "Kühlen", "Heizen", "Sparen", "Lüften", "Trocknen"],
```

Ist `MODE` nicht angegeben, tritt `MODESET` an seine Stelle.

### Pageitems und Heizkreise

```typescript
items: [
    { id: 'alias.0.Licht.lights.Gerät_1', filter: 0 },
],
```

`filter` bindet ein Pageitem an einen Heizkreis; gezählt wird ab 0. **Wird ein `airCondition`-Kanal
eingefügt, verschiebt sich der Index aller folgenden Kreise um eins**, weil daraus zwei werden.

Freie Plätze lassen sich mit **Platzhaltern** erzeugen: `{ id: 'delete' }` oder `{ id: 'empty' }`.

> Platzhalter ignorieren `filter` — sie erscheinen in **jedem** Heizkreis. Wer in einem Kreis eine Lücke
> braucht, baut sie damit auch in alle anderen ein.
