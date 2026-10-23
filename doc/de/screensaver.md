# Bildschirmschoner im Konfigurationsskript

> **Der Admin ist der Weg.** Der Bildschirmschoner wird im Tab *Screensaver* eingerichtet — dort steht
> jeder Platz als Bild, die Felder sind beschriftet und die Vorschau zeigt sofort, was auf dem Panel
> landet: [Bildschirmschoner – Konfiguration im Admin](Screensaver-Admin), Meldungen unter
> [Benachrichtigungen](Screensaver-Notify).
>
> Diese Seite beschreibt den **zweiten Weg**: dieselbe Konfiguration aus dem Konfigurationsskript heraus.
> Sie ist bewusst grob gehalten — sie erklärt den Aufbau und zeigt Beispiele, listet aber nicht jedes Feld
> auf. Wer ein Feld sucht, findet es in der Admin-Oberfläche an der passenden Stelle.

## Wenn beides eingerichtet ist, gewinnt der Admin

Ist ein Panel in einem Bildschirmschoner des Admin-Tabs aufgeführt, **ersetzt dieser den Bildschirmschoner
aus dem Skript**. Der Adapter schreibt das beim Start ins Log:

```
Screensaver '<Name>' (<Modus>) from the admin configuration replaces the script screensaver of panel '<Panel>'
```

Ohne passenden Admin-Eintrag bleibt alles beim Skript. Steht ein Panel versehentlich in mehreren
Admin-Bildschirmschonern, nimmt der Adapter den ersten und warnt.

Ein Unterschied bleibt auch danach bestehen:

| | Woher Version und Rotationszeit kommen |
|---|---|
| **Admin-Bildschirmschoner** | Aus dem Eintrag. Die Datenpunkte `cmd.screenSaver.layout` und `.rotationTime` **folgen** ihm. |
| **Skript-Bildschirmschoner** | Aus genau diesen Datenpunkten — sie sind der Weg, beides zu ändern. |

Das Skript selbst kann die Version **nicht** festlegen: In der Skript-Konfiguration gibt es kein Feld
dafür, die Seite entsteht immer als `standard`. Wer eine andere Version will, setzt
`panels.<Panel>.cmd.screenSaver.layout`.

## Die vier Versionen

| Version | `layout` | Karte | Favorit | Alternate | Links | Unten | Indikatoren | MR-Icons |
|---|---|---|---|---|---|---|---|---|
| `standard` | 0 | `screensaver` | 1 | – | – | 4 | – | 2 |
| `alternate` | 1 | `screensaver` | 1 | 1 | – | 3 | – | 2 |
| `advanced` | 2 | `screensaver2` | 1 | – | 3 | 6 | 5 | 2 |
| `easyview` | 3 | `screensaver3` | 1 | – | – | 3 | – | 2 |

Die Zahlen gelten für das **eu**-Modell; beim `us-p` hat `easyview` unten vier statt drei Plätze. Die
maßgebliche Tabelle steht im Code (`definition.ts`, `ScreenSaverConst`) und wird vom Admin aus derselben
Quelle gelesen.

## Die Bereiche

Jeder Bereich ist ein Feld der Skript-Konfiguration:

| Feld | Was es belegt |
|---|---|
| `favoritScreensaverEntity` | Den großen Platz — üblicherweise das aktuelle Wetter. |
| `alternateScreensaverEntity` | Den Platz, der sich mit dem Favoriten abwechselt. **Nur in der Version `alternate`**; in jeder anderen werden solche Einträge verworfen. |
| `leftScreensaverEntity` | Die linke Spalte, nur in `advanced`. Darf Lücken enthalten (`undefined`/`null`). |
| `bottomScreensaverEntity` | Die untere Reihe. |
| `indicatorScreensaverEntity` | Die Statussymbole oben rechts, nur in `advanced`. Darf ebenfalls Lücken enthalten. |
| `mrIcon1ScreensaverEntity` / `mrIcon2ScreensaverEntity` | Die beiden Symbole unten. **Objekt, kein Array.** |
| `notifyScreensaverEntity` | Die Benachrichtigungen (siehe unten). |

## Drei Arten, einen Platz zu füllen

```typescript
// 1. script – Datenpunkt und Beschriftung von Hand
{ type: 'script', ScreensaverEntity: '<State-ID>', ScreensaverEntityText: 'Innen' }

// 2. template – eine fertige Vorlage, dpInit sagt ihr, wo sie suchen soll
{ type: 'template', template: 'text.clock', dpInit: '', modeScr: 'left' }

// 3. native – der rohe Seitenaufbau, der Notausgang
{ type: 'native', native: { /* … */ } }
```

- Bei **`script`** sind `ScreensaverEntity` und `ScreensaverEntityText` Pflicht; alles Weitere
  (Symbol, Einheit, Farbe, Nachkommastellen, Datumsformat, Sichtbarkeit) ist optional.
- Bei **`template`** sind `template`, `dpInit` und `modeScr` Pflicht — **auch `dpInit`**, selbst wenn die
  Vorlage keine Suche braucht; dann bleibt es ein leerer String.
- **MR-Icons kennen weniger Felder** als die übrigen Plätze: `ScreensaverEntity`,
  `ScreensaverEntityIconOn`, `ScreensaverEntityIconOff`, `ScreensaverEntityValue`,
  `ScreensaverEntityValueDecimalPlace`, `ScreensaverEntityValueUnit`, `ScreensaverEntityOnColor` und
  `ScreensaverEntityOffColor` — alle acht gehören dazu. Ein `ScreensaverEntityText` oder
  `ScreensaverEntityIconColor` gibt es dort **nicht**; der Adapter liest beides nicht.

## Vorlagen

Die mitgelieferten Vorlagen heißen `text.…` und decken Uhr, Wetter, Fenster, Türen, Bewegung, Batterie,
Netz und Fahrplan ab. Die Liste steht im Code (`src/lib/templates/text.ts`) und ist dort immer aktuell;
alle unten verwendeten Namen gibt es.

Wetter gibt es für vier Adapter: `accuweather`, `openweathermap`, `pirate-weather` und `brightsky` — je
Adapter eine eigene Vorlagenfamilie (`text.<adapter>.favorit`, `.bot2values`, `.sunriseset`, `.windspeed`,
…). `weatherAddDefaultItems` hängt Sonnenauf-/untergang, bis zu sechs Vorhersagetage, Wind und — soweit der
Adapter sie liefert — UV-Index und Solarstrahlung hinten an.

## Beispiele

Die folgenden Blöcke sind **Ausschnitte** aus `const config: ScriptConfig.Config = { … }`; die
Pflichtangaben der Konfiguration (`version`, `scriptName`, `weatherEntity`, die Farben, `pages`, …) stehen
weiterhin daneben, siehe [ScriptConfig](ScriptConfig).

### Advanced — der volle Ausbau

```typescript
// Favorit: aktuelles Wetter
favoritScreensaverEntity: [{
    type: 'template',
    template: 'text.pirate-weather.favorit',
    dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
    modeScr: 'favorit',
}],

// Linke Spalte: drei Plätze
leftScreensaverEntity: [
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wohnzimmer.Temperatur',
        ScreensaverEntityText: 'Innen',
        ScreensaverEntityIconOn: 'thermometer',
        ScreensaverEntityUnitText: '°C',
        ScreensaverEntityIconColor: { val_min: 18, val_max: 26, val_best: 22 },
    },
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wohnzimmer.Luftfeuchtigkeit',
        ScreensaverEntityText: 'Feuchte',
        ScreensaverEntityIconOn: 'water-percent',
        ScreensaverEntityUnitText: '%',
        ScreensaverEntityIconColor: { val_min: 30, val_max: 70, val_best: 45 },
    },
    { type: 'template', template: 'text.clock', dpInit: '', modeScr: 'left' },
],

// Statussymbole oben rechts
indicatorScreensaverEntity: [
    { type: 'template', template: 'text.window.isOpen', dpInit: `/^alias\\.0\\.Wohnzimmer\\.Fenster.*$/`, modeScr: 'indicator' },
    { type: 'template', template: 'text.motion', dpInit: `/^zigbee\\.0\\..*\\.occupancy$/`, modeScr: 'indicator' },
    { type: 'template', template: 'text.battery.low', dpInit: `/^zigbee\\.0\\..*\\.battery_low$/`, modeScr: 'indicator' },
],

// Untere Reihe
bottomScreensaverEntity: [
    { type: 'template', template: 'text.pirate-weather.bot2values', dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.01.*/`, modeScr: 'bottom' },
    { type: 'template', template: 'text.pirate-weather.bot2values', dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.02.*/`, modeScr: 'bottom' },
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Energie.Verbrauch.Aktuell',
        ScreensaverEntityText: 'Verbrauch',
        ScreensaverEntityIconOn: 'flash',
        ScreensaverEntityUnitText: 'W',
        ScreensaverEntityIconColor: { val_min: 0, val_max: 5000, mode: 'triGrad' },
    },
],

// Die beiden Symbole unten – Objekt, acht Felder
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb-on',
    ScreensaverEntityIconOff: 'lightbulb-off',
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { r: 255, g: 215, b: 0 },
    ScreensaverEntityOffColor: { r: 68, g: 115, b: 158 },
},
mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'alias.0.Wohnzimmer.Steckdose',
    ScreensaverEntityIconOn: 'power-plug',
    ScreensaverEntityIconOff: 'power-plug-off',
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { r: 0, g: 255, b: 0 },
    ScreensaverEntityOffColor: { r: 68, g: 115, b: 158 },
},
```

`Relay.1` und `Relay.2` sind erlaubte Kurzformen für die beiden Relais des Panels; der Adapter setzt sie
auf `cmd/power1` beziehungsweise `cmd/power2` um.

### Alternate — der Favorit wechselt sich ab

```typescript
favoritScreensaverEntity: [{
    type: 'template',
    template: 'text.accuweather.favorit',
    dpInit: `/^accuweather\\.0\\.Current\\./`,
    modeScr: 'favorit',
}],

alternateScreensaverEntity: [{
    type: 'script',
    ScreensaverEntity: 'alias.0.Garten.Temperatur',
    ScreensaverEntityText: 'Garten',
    ScreensaverEntityIconOn: 'tree',
    ScreensaverEntityUnitText: '°C',
}],

bottomScreensaverEntity: [
    { type: 'template', template: 'text.accuweather.sunriseset', dpInit: `/^accuweather\\.0\\.Daily\\.Day1\\./`, modeScr: 'bottom' },
    { type: 'template', template: 'text.accuweather.windspeed', dpInit: `/^accuweather\\.0\\.Current\\.WindSpeed$/`, modeScr: 'bottom' },
    { type: 'template', template: 'text.clock', dpInit: '', modeScr: 'bottom' },
],
```

### Standard und EasyView — vier beziehungsweise drei Plätze unten

```typescript
// standard: Favorit + 4 Plätze unten
bottomScreensaverEntity: [
    { type: 'template', template: 'text.openweathermap.bot2values', dpInit: `/^openweathermap\\.0\\.forecast\\.day1\\./`, modeScr: 'bottom' },
    { type: 'template', template: 'text.openweathermap.sunriseset', dpInit: `/^openweathermap\\.0\\.forecast\\.current\\./`, modeScr: 'bottom' },
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Haus.Stromverbrauch',
        ScreensaverEntityText: 'Strom',
        ScreensaverEntityIconOn: 'flash',
        ScreensaverEntityUnitText: 'W',
    },
    { type: 'template', template: 'text.clock', dpInit: '', modeScr: 'bottom' },
],
```

EasyView ist dasselbe mit drei Plätzen (beim `us-p`-Modell vier) und großer Schrift.

## Benachrichtigungen

Meldungen auf dem Bildschirmschoner sind in beiden Wegen dieselbe Sache: Der Admin schreibt sie in seine
Liste, das Skript in `notifyScreensaverEntity`. Was sie können — Inhalt, Bedingung, Priorität, Quittieren
mit Gruppen-ID, Summer — steht ausführlich unter
[Benachrichtigungen](Screensaver-Notify).

```typescript
notifyScreensaverEntity: [{
    type: 'script',
    Priority: 10,
    Headline: 'Fenster offen',
    Text: 'Bitte vor dem Verlassen schließen',
    HeadlineIcon: 'window-open',
    Enabled: 'alias.0.Fenster.Status',
    VisibleCondition: 'val > 0',
    isDismissiblePerEvent: true,
    dismissibleIDGlobal: 'fenster',
}],
```

Pflicht sind `Priority`, `Headline` und `Text`. Wird `VisibleCondition` benutzt, muss auch `Enabled`
gesetzt sein. Die kleinste Prioritätszahl gewinnt; eine Meldung über Datenpunkt oder `sendTo` verdrängt
alles aus dieser Liste.

## Fallstricke

- **Zu viele Einträge werden nicht abgeschnitten, sondern durchgeblättert.** Liegen in einem Bereich mehr
  Einträge als Plätze, bildet der Adapter Fenster und zeigt sie reihum — bei fünf Einträgen auf drei
  Plätzen also abwechselnd die ersten drei und die restlichen zwei.
- **`alternate`-Einträge verschwinden lautlos**, solange die Version nicht `alternate` ist. Dasselbe gilt
  für jeden Platz, den die aktuelle Version nicht kennt.
- **Weniger geladen als konfiguriert?** Dann steht im Log `Warning: <Bereich>ScreensaverEntity - loaded X of
  Y configured items` — fast immer ein Datenpunkt, den es nicht gibt.
- **`ScreensaverEntityEnabled` ist eine State-ID, kein `true`.** Der State muss existieren, sonst wird der
  Eintrag abgelehnt. Die Bedingung in `ScreensaverEntityVisibleCondition` wird gegen **diesen** Wert
  geprüft, nicht gegen den angezeigten.
- **Farbskala:** `mode` kennt `mixed`, `hue`, `cie`, `triGrad`, `triGradAnchor`, `quadriGrad` und
  `quadriGradAnchor`; `log10` nur `'max'` oder `'min'` — ein `'center'` gibt es nicht.
- **MR-Icons sind Anzeigen, keine Schalter.** Schalten lassen sich nur Indikator-Einträge, über
  `ScreensaverEntityButton`, `ScreensaverEntitySwitch` oder `ScreensaverEntityNaviToPage`.
