# Screensaver Konfiguration

Der Screensaver ist die Ansicht, die auf dem NSPanel angezeigt wird, wenn es nicht aktiv verwendet wird. Diese Dokumentation beschreibt alle Möglichkeiten zur Konfiguration des Bildschirmschoners in Ihrem Konfigurationsskript.

## Inhaltsverzeichnis

<table>
<tr>
<td width="50%">

**Grundlagen**
- [Screensaver-Modi](#screensaver-modi)
  - [Advanced Mode (Standard)](#1-advanced-mode-standard)
  - [Alternate Mode](#2-alternate-mode)
  - [Standard Mode](#3-standard-mode)
  - [Easy View Mode](#4-easy-view-mode)
- [Bereiche im Detail](#bereiche-im-detail)
- [MR-Icons (Relay-Symbole)](#mr-icons-relay-symbole)
- [Wisch-Gesten (Swipe)](#wisch-gesten-swipe)
- [Icons für NSPanel](#icons-für-nspanel)

**Konfiguration**
- [Konfigurationsarten](#konfigurationsarten)
  - [Script-Konfiguration](#1-script-konfiguration-type-script)
  - [Template-Konfiguration](#2-template-konfiguration-type-template)
  - [Native-Konfiguration](#3-native-konfiguration-type-native)
- [Konfigurationsbereiche](#konfigurationsbereiche)
  - [favoritScreensaverEntity](#favoritscreensaverentity)
  - [bottomScreensaverEntity](#bottomscreensaverentity)
  - [indicatorScreensaverEntity](#indicatorscreensaverentity)
  - [leftScreensaverEntity](#leftscreensaverentity)
  - [alternateScreensaverEntity](#alternatescreensaverentity)
  - [mrIcon1/2ScreensaverEntity](#mricon1screensaverentity--mricon2screensaverentity)

</td>
<td width="50%">

**Erweiterte Konfiguration**
- [Script-Konfiguration Parameter](#script-konfiguration-parameter)
- [Verwendung von Farbkonstanten](#verwendung-von-farbkonstanten)
- [IconScaleElement - Erweiterte Icon-Skalierung](#iconscaleelement---erweiterte-icon-skalierung)

**Templates und Text-Elemente**
- [Template-Konfiguration](#template-konfiguration)
- [Wetter-Templates](#wetter-templates)
  - [Pirate Weather](#pirate-weather)
  - [OpenWeatherMap](#openweathermap)
  - [AccuWeather](#accuweather)
  - [BrightSky](#brightsky)
- [Zusätzliche Text-Templates](#zusätzliche-text-templates)
  - [Allgemeine Templates](#allgemeine-templates)
  - [Fenster & Türen Templates](#fenster--türen-templates)
  - [Bewegung & Sicherheit](#bewegung--sicherheit-templates)
  - [Netzwerk & Verbindung](#netzwerk--verbindung-templates)
  - [Spezielle Templates](#spezielle-templates)

**Praktische Beispiele**
- [Vollständige Arbeitsbeispiele für alle Modi](#vollständige-arbeitsbeispiele-für-alle-modi)
  - [Advanced Mode - Komplett-Konfiguration](#advanced-mode---komplett-konfiguration)
  - [Alternate Mode - Konfiguration](#alternate-mode---konfiguration)
  - [Standard Mode - Konfiguration](#standard-mode---konfiguration)
  - [Easy View Mode - Konfiguration](#easy-view-mode---konfiguration)
- [Automatische Wetter-Elemente](#automatische-wetter-elemente)

</td>
</tr>
</table>

## Screensaver-Modi

Der Screensaver hat verschiedene Modi mit unterschiedlichen Layouts:

## 1 Advanced Mode Standard
- **Favorit-Bereich** (1 Element): Hauptbereich für wichtige Informationen (meist Wetter)
- **Left-Bereich** (3 Elemente): Linker Bereich für detaillierte Informationen
- **Indicator-Bereich** (5 Elemente): Status-Indikatoren für schnelle Übersicht
- **Bottom-Bereich** (6 Elemente): Scrollbare Liste zusätzlicher Informationen
- **MR-Icons** (2 Elemente): Schaltbare Relay-Icons (mrIcon1 + mrIcon2)

## 2 Alternate Mode
- **Favorit-Bereich** (1 Element): Hauptbereich für wichtige Informationen
- **Alternate-Bereich** (1 Element): Alternative Ansicht für den Hauptbereich
- **Bottom-Bereich** (3 Elemente): Reduzierte untere Informationsleiste
- **MR-Icons** (2 Elemente): Schaltbare Relay-Icons

## 3 Standard Mode
- **Favorit-Bereich** (1 Element): Hauptbereich für wichtige Informationen  
- **Bottom-Bereich** (4 Elemente): Erweiterte untere Informationsleiste
- **MR-Icons** (2 Elemente): Schaltbare Relay-Icons

## 4. Easy View Mode
- **Bottom-Bereich** (3 Elemente): Extra große Schrift für bessere Lesbarkeit
- **Keine Icons oder Texte**: Vereinfachte Darstellung ohne komplexe Elemente
- **Keine MR-Icons**: Reduzierte Funktionalität für einfache Bedienung

## Bereiche im Detail

## MR-Icons (Relay-Symbole)

Die MR-Icons sind **ausschließlich Anzeigeelemente** im oberen Bereich des Screensavers zur Visualisierung von Status-Informationen. Sie sind in allen Screensaver-Modi außer Easy View verfügbar.

### Eigenschaften der MR-Icons:
- **Reine Statusanzeige**: Icons zeigen nur den aktuellen Zustand an und haben **keine steuernde Funktion**
- **Hardware-Tasten**: Die physischen Tasten unterhalb des Displays können unabhängig konfiguriert werden
- **Visueller Status**: Farbwechsel basierend auf Ein/Aus-Zustand der verknüpften States
- **Flexible Anbindung**: Können mit beliebigen ioBroker-States verbunden werden (nicht nur NSPanel-Relays)
- **Konfigurierbare Icons**: Verschiedene Symbole je nach Anwendung (Licht, Steckdose, etc.)
- **Erweiterte Darstellung**: Zusätzlicher Wert für Statusanzeigen möglich
- **Detach-Funktion**: Icons können vollständig unabhängig von den Hardware-Tasten konfiguriert werden

### Funktionsweise:
- **Anzeige**: Die Icons im oberen Displaybereich zeigen nur den aktuellen Status der verknüpften States
- **Hardware-Tasten**: Die Tasten unterhalb des Displays sind separate Steuerelemente
- **Konfiguration**: Die Icon-Konfiguration betrifft nur die visuelle Darstellung, nicht die Tastenfunktion

### MR-Icon Bereiche:
- **mrIcon1ScreensaverEntity**: Linkes Relay-Symbol
- **mrIcon2ScreensaverEntity**: Rechtes Relay-Symbol

### Beispiel-Konfiguration für MR-Icons:

```typescript
// Direkte Relay-Steuerung
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb-on',
    ScreensaverEntityIconOff: 'lightbulb-off',
    ScreensaverEntityText: 'Licht',
    ScreensaverEntityIconColor: {
        val_min: 0,
        val_max: 1,
        val_best: 1
    }
}

// Externe Geräte-Steuerung mit Statuswert
mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'hue.0.Wohnzimmer.Lampe.on',
    ScreensaverEntityValue: 'hue.0.Wohnzimmer.Lampe.level',
    ScreensaverEntityIconOn: 'ceiling-light',
    ScreensaverEntityIconOff: 'ceiling-light-outline',
    ScreensaverEntityText: 'Dimmer',
    ScreensaverEntityUnitText: '%'
}
```

## Wisch-Gesten (Swipe)

**Wichtiger Hinweis**: Wisch-Gesten (Swipe) wechseln NICHT zwischen verschiedenen Ansichten, sondern geben die Gestenerkennung in einen Datenpunkt aus. Dies ermöglicht es, benutzerdefinierte Aktionen auf Wischbewegungen zu programmieren.

Die Swipe-Funktion kann in den erweiterten Optionen aktiviert werden:
```typescript
advancedOptions: {
    screensaverSwipe: true  // Aktiviert Swipe-Gestenerkennung
}
```

## Icons für NSPanel

**Verfügbare Icons**: Alle verfügbaren Icons für das NSPanel finden Sie in der [NSPanel Icon Cheatsheet](https://docs.nspanel.pky.eu/icon-cheatsheet.html).

### Icon-Parameter:
- `ScreensaverEntityIconOn`: Icon für den "Ein"-Zustand
- `ScreensaverEntityIconOff`: Icon für den "Aus"-Zustand

### Icon-Beispiele:
```typescript
// Licht-Icons
ScreensaverEntityIconOn: 'lightbulb-on',
ScreensaverEntityIconOff: 'lightbulb-off',

// Wetter-Icons
ScreensaverEntityIconOn: 'weather-sunny',
ScreensaverEntityIconOff: 'weather-cloudy',

// Geräte-Icons
ScreensaverEntityIconOn: 'power-plug',
ScreensaverEntityIconOff: 'power-plug-off',

// Status-Icons
ScreensaverEntityIconOn: 'check-circle',
ScreensaverEntityIconOff: 'alert-circle-outline'
```

**Wichtiger Hinweis**: Verwenden Sie ausschließlich Icons aus der [NSPanel Icon Cheatsheet](https://docs.nspanel.pky.eu/icon-cheatsheet.html). Andere Material Design Icons werden möglicherweise nicht korrekt angezeigt.

## Konfigurationsarten

Es gibt drei verschiedene Arten, wie Screensaver-Elemente konfiguriert werden können:

### 1. Script-Konfiguration (`type: 'script'`)

Die flexibelste Methode zur manuellen Konfiguration einzelner Elemente:

```typescript
{
    type: 'script',
    ScreensaverEntity: 'alias.0.Temperatur.ACTUAL',
    ScreensaverEntityIconOn: 'thermometer',
    ScreensaverEntityIconOff: 'thermometer-off',
    ScreensaverEntityText: 'Innentemperatur',
    ScreensaverEntityUnitText: '°C',
    ScreensaverEntityFactor: 1,
    ScreensaverEntityDecimalPlaces: 1,
    ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
}
```

### 2. Template-Konfiguration (`type: 'template'`)

Vorgefertigte Templates für häufige Anwendungsfälle:

```typescript
{
    type: 'template',
    template: 'text.pirate-weather.favorit',
    dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
    modeScr: 'favorit'
}
```

### 3. Native-Konfiguration (`type: 'native'`)

Direkte Konfiguration der internen Adapter-Struktur (für Experten):

```typescript
{
    type: 'native',
    native: {
        // Komplexe interne Struktur
        role: 'text',
        data: { /* ... */ }
    }
}
```

## Konfigurationsbereiche

### favoritScreensaverEntity

**Zweck**: Hauptbereich des Screensavers, typischerweise für Wetterinformationen

**Typ**: Array mit einem Element

**Beispiele**:

```typescript
favoritScreensaverEntity: [
    {
        type: 'template',
        template: 'text.pirate-weather.favorit',
        dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
        modeScr: 'favorit'
    }
]
```

**Verfügbare Weather-Templates**:
- `text.pirate-weather.favorit`
- `text.openweathermap.favorit`
- `text.accuweather.favorit`
- `text.brightsky.favorit`

### bottomScreensaverEntity

**Zweck**: Unterer Bereich für zusätzliche Informationen, scrollt durch die konfigurierten Elemente

**Typ**: Array mit mehreren Elementen

**Beispiele**:

```typescript
bottomScreensaverEntity: [
    // Windgeschwindigkeit
    {
        type: 'script',
        ScreensaverEntity: 'pirate-weather.0.weather.currently.windSpeed',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'weather-windy',
        ScreensaverEntityText: 'Wind',
        ScreensaverEntityUnitText: 'm/s',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 120}
    },
    // Luftfeuchtigkeit
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wetter.Luftfeuchtigkeit',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 0,
        ScreensaverEntityIconOn: 'water-percent',
        ScreensaverEntityText: 'Feuchtigkeit',
        ScreensaverEntityUnitText: '%',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 100, val_best: 60}
    },
    // Template für Sonnenauf-/untergang
    {
        type: 'template',
        template: 'text.pirate-weather.sunriseset',
        dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.+/`,
        modeScr: 'bottom'
    }
]
```

### indicatorScreensaverEntity

**Zweck**: Kleine Indikator-Icons für schnelle Statusübersicht (nur Advanced Screensaver)

**Typ**: Array mit bis zu 5 Elementen (kann `null` oder `undefined` enthalten)

**Beispiele**:

```typescript
indicatorScreensaverEntity: [
    // Fenster-Status
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Status.offene_Fenster',
        ScreensaverEntityIconOn: 'window-open-variant',
        ScreensaverEntityIconOff: 'window-closed-variant',
        ScreensaverEntityText: 'Fenster',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
    },
    // Licht-Status
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Status.Licht_an',
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: 'lightbulb-outline',
        ScreensaverEntityText: 'Licht',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
    },
    // Platzhalter für dritten Indikator
    null,
    // Türschloss-Status
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Sicherheit.Türschloss',
        ScreensaverEntityIconOn: 'lock',
        ScreensaverEntityIconOff: 'lock-open',
        ScreensaverEntityText: 'Türschloss',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 1}
    }
]
```

### leftScreensaverEntity

**Zweck**: Linker Bereich für detaillierte Informationen (nur Advanced Screensaver)

**Typ**: Array mit bis zu 3 Elementen

**Beispiele**:

```typescript
leftScreensaverEntity: [
    // Temperatur
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Sensoren.Innentemperatur',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'thermometer',
        ScreensaverEntityText: 'Temperatur',
        ScreensaverEntityUnitText: '°C',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
    },
    // Energieverbrauch
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Energie.Tagesverbrauch',
        ScreensaverEntityFactor: 1,
        ScreensaverEntityDecimalPlaces: 1,
        ScreensaverEntityIconOn: 'flash',
        ScreensaverEntityText: 'Energie',
        ScreensaverEntityUnitText: 'kWh',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 50}
    },
    // Müllabfuhr mit Datumsformat
    {
        type: 'script',
        ScreensaverEntity: 'alias.0.Abfall.naechster_Termin',
        ScreensaverEntityDateFormat: {year: 'numeric', month: '2-digit', day: '2-digit'},
        ScreensaverEntityIconOn: 'trash-can',
        ScreensaverEntityText: 'Müll',
        ScreensaverEntityIconColor: 'alias.0.Abfall.farbe'
    }
]
```

### alternateScreensaverEntity

**Zweck**: Alternative Ansicht für den Hauptbereich (nur Advanced Screensaver)

**Typ**: Array (wird zwischen Favorit- und Alternate-Ansicht gewechselt)

### mrIcon1ScreensaverEntity und mrIcon2ScreensaverEntity

**Zweck**: Icons für die beiden Relay-Ausgänge des NSPanels

**Typ**: Objekt (nicht Array)

**Beispiele**:

```typescript
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb',
    ScreensaverEntityIconOff: 'lightbulb-outline',
    ScreensaverEntityOnColor: On,      // Empfohlene gelbe An-Farbe (siehe Abschnitt [Farbkonstanten](#farbkonstanten) für Definition)
    ScreensaverEntityOffColor: HMIOff  // Blaue Aus-Farbe
},

mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'alias.0.Beleuchtung.Flur',
    ScreensaverEntityIconOn: 'ceiling-light',
    ScreensaverEntityValue: 'alias.0.Beleuchtung.Flur.Helligkeit',
    ScreensaverEntityValueUnit: '%',
    ScreensaverEntityValueDecimalPlace: 0,
    ScreensaverEntityOnColor: Yellow,  // Gelbe Farbe für helle Beleuchtung
    ScreensaverEntityOffColor: HMIOff  // Standard Aus-Farbe
}
```

## Script-Konfiguration Parameter

### Basis-Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `ScreensaverEntity` | string \| null | Haupt-Datenquelle für das Element | `'alias.0.Temperatur.ACTUAL'` |
| `ScreensaverEntityText` | string | Anzeigetext für das Element | `'Innentemperatur'` |
| `ScreensaverEntityUnitText` | string | Einheit für den Wert | `'°C'`, `'%'`, `'kWh'` |

### Icon-Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `ScreensaverEntityIconOn` | string | Icon für Zustand "Ein" | `'thermometer'` |
| `ScreensaverEntityIconOff` | string \| null | Icon für Zustand "Aus" | `'thermometer-off'` |
| `ScreensaverEntityIconSelect` | Array | Icons basierend auf Wert | `[{value: 0, icon: 'weather-sunny'}, {value: 50, icon: 'weather-cloudy'}]` |

### Farb-Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `ScreensaverEntityOnColor` | RGB-Objekt/Konstante | Farbe für Zustand "Ein" | `On` oder `{red: 255, green: 0, blue: 0}` |
| `ScreensaverEntityOffColor` | RGB-Objekt/Konstante | Farbe für Zustand "Aus" | `Off` oder `{red: 0, green: 0, blue: 255}` |
| `ScreensaverEntityIconColor` | IconScale \| string | Dynamische Farbskala oder State-ID | `{val_min: 0, val_max: 100}` |

### Wert-Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `ScreensaverEntityFactor` | number | Multiplikationsfaktor für Werte | `1`, `0.1`, `1000` |
| `ScreensaverEntityDecimalPlaces` | number | Anzahl Nachkommastellen | `0`, `1`, `2` |
| `ScreensaverEntityValue` | string | Zusätzlicher Wert (für mrIcon) | `'alias.0.Helligkeit'` |
| `ScreensaverEntityValueUnit` | string | Einheit für zusätzlichen Wert | `'%'` |
| `ScreensaverEntityValueDecimalPlace` | number | Nachkommastellen für zusätzlichen Wert | `0` |

### Formatierungs-Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `ScreensaverEntityDateFormat` | DateFormat | Format für Datumsanzeige | `{year: 'numeric', month: '2-digit', day: '2-digit'}` |

### Erweiterte Parameter

| Parameter | Typ | Beschreibung | Beispiel |
|-----------|-----|--------------|----------|
| `ScreensaverEntityEnabled` | boolean \| string | Aktivierungsbedingung | `true`, `'alias.0.Active'` |
| `ScreensaverEntityVisibleCondition` | string | JavaScript-Bedingung für Sichtbarkeit | `'val > 0'` |

## Farbskala-Konfiguration

### Einfache Farbskala

```typescript
ScreensaverEntityIconColor: {
    val_min: 0,      // Minimalwert
    val_max: 100,    // Maximalwert
    val_best: 50     // Optimalwert (bekommt spezielle Farbe)
}
```

### Erweiterte Farbskala

```typescript
ScreensaverEntityIconColor: {
    val_min: 0,
    val_max: 100,
    val_best: 22,
    color_best: {red: 0, green: 255, blue: 0},  // Farbe für Optimalwert
    mode: 'cie',                                // 'mixed', 'hue', oder 'cie'
    log10: 'min'                               // Logarithmische Skalierung
}
```

## Verwendung von Farbkonstanten

Anstatt Farben als JSON-Objekte zu definieren, können Sie die im Skript verfügbaren Farbkonstanten verwenden. Dies macht die Konfiguration übersichtlicher und weniger fehleranfällig:

```typescript
// Beispiel mit Farbkonstanten (empfohlen)
ScreensaverEntityOnColor: On,      // Vordefinierte gelbe Farbe
ScreensaverEntityOffColor: Off,    // Vordefinierte orange Farbe

// Anstatt JSON-Definitionen
ScreensaverEntityOnColor: {red: 253, green: 216, blue: 53},  // Manuell
ScreensaverEntityOffColor: {red: 253, green: 128, blue: 0}   // Manuell
```

#### Verfügbare Farbkonstanten:

**Standard UI-Farben:**
- `On`, `Off` - Empfohlene An/Aus-Farben (Gelb/Orange)
- `HMIOff`, `HMIOn` - Ursprüngliche Entity-Farben (Blau)
- `HMIDark` - Hintergrundfarbe (Dunkelgrau)

**Grundfarben:**
- `Red`, `Green`, `Blue`, `Yellow`, `White`, `Black`, `Gray`
- `Cyan`, `Magenta`, `DarkBlue`

**Status-Farben:**
- `MSRed`, `MSYellow`, `MSGreen` - Material Design Farben
- `BatteryFull`, `BatteryEmpty` - Für Batteriestandsanzeigen

**Menu-Farben:**
- `Menu`, `MenuLowInd`, `MenuHighInd`

**Farbskala (Gradient):**
- `colorScale0` bis `colorScale10` - Verlauf von Grün über Gelb zu Rot

**Wetter-Farben:**
- `swClearNight`, `swCloudy`, `swFog`, `swRainy`, `swSunny`, etc.

#### Beispiele mit Farbkonstanten:

```typescript
// MR-Icon mit Farbkonstanten
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',
    ScreensaverEntityIconOn: 'lightbulb',
    ScreensaverEntityOnColor: On,      // Gelb für Ein-Zustand
    ScreensaverEntityOffColor: HMIOff  // Blau für Aus-Zustand
}

// Temperaturanzeige mit Gradient-Farben
{
    type: 'script',
    ScreensaverEntity: 'sensor.temperature',
    ScreensaverEntityIconColor: {
        val_min: 0,
        val_max: 35,
        color_best: MSGreen  // Material Design Grün als Optimalfarbe
    }
}
```

Die Farbkonstanten werden am Ende des Beispielskripts definiert und sind in allen Konfigurationsbereichen verfügbar.

## IconScaleElement - Erweiterte Icon-Skalierung

Das `iconScaleElement` ermöglicht eine erweiterte Konfiguration der Icon-Farbgebung mit verschiedenen Modi und Optionen:

#### Verfügbare Modi:

**1. Standard-Modus (ohne mode-Parameter)**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,
    val_best: 50    // Optional: Optimalwert für spezielle Hervorhebung
}
```
- Lineare Farbinterpolation zwischen Minimal- und Maximalwert
- Automatische Farbwahl basierend auf dem Wertebereich

**2. TriGrad-Modus (Dreifarbiger Farbverlauf)**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,
    mode: 'triGrad'
}
```
- **Standard-Farbverlauf**: Erstellt einen kontinuierlichen Übergang durch drei Farben: Grün → Gelb → Rot
- **Anwendung**: Ideal für Warnstufen, Batteriezustände, oder Leistungsanzeigen
- **Standard-Verhalten**: 
  - Niedrige Werte (0-33%): Grün (gut)
  - Mittlere Werte (34-66%): Gelb (mittel/Warnung)  
  - Hohe Werte (67-100%): Rot (kritisch/schlecht)

**Besonderheit mit val_best:**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,
    val_best: 50,
    mode: 'triGrad'
}
```
- **Spezielles Verhalten**: Bei Verwendung von val_best wird der Farbverlauf zu: **Rot → Gelb → Grün → Gelb → Rot**
- **Bedeutung**: 
  - val_min (0) und val_max (100): Rot (kritisch an beiden Extremen)
  - val_best (50): Grün (optimal im mittleren Bereich)
  - Dazwischen: Gelb (Übergangsbereiche)

**3. TriGradAnchor-Modus (Dreifarbiger Farbverlauf mit Ankerpunkt)**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,
    val_best: 50,
    mode: 'triGradAnchor'
}
```
- **Farbverlauf**: Dreistufiger Verlauf mit einem definierten Optimalpunkt
- **Anwendung**: Für Werte wo ein mittlerer Bereich optimal ist (z.B. Luftfeuchtigkeit)
- **Verhalten**:
  - Bei val_best (50): Grün (optimal)
  - Zu den Extremwerten hin: Über Gelb zu Rot (suboptimal bis kritisch)
  - Symmetrischer Verlauf um den Ankerpunkt

**4. QuadriGradAnchor-Modus (Vierfarbiger Farbverlauf mit Ankerpunkt)**
```typescript
iconScaleElement: {
    val_min: -10,
    val_max: 40,
    val_best: 22,
    mode: 'quadriGradAnchor'
}
```
- **Farbverlauf**: Vierstufiger Übergang für noch präzisere Darstellung
- **Anwendung**: Besonders geeignet für Temperaturanzeigen oder komplexe Messwerte
- **Wichtig**: Bei quadriGrad-Modi ist **val_best der Ankerpunkt** (Optimum)
- **Verhalten**:
  - Bei val_best (22°C): Grün (optimal)
  - Leichte Abweichung: Hellgrün/Gelb (akzeptabel)
  - Stärkere Abweichung: Orange (warnung)
  - Extreme Werte: Rot (kritisch kalt/heiß)

**5. Mixed-Modus**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,
    mode: 'mixed'
}
```
- Kombiniert verschiedene Farbalgoritmen
- Erweiterte Farbmischung für komplexe Darstellungen

**6. Hue-Modus**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 360,
    mode: 'hue'
}
```
- Farbton-basierte Skalierung über den Farbkreis
- Ideal für Farbwert-Anzeigen (Hue-Lampen)

**7. CIE-Modus**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 1,
    mode: 'cie'
}
```
- CIE-Farbräume-basierte Skalierung
- Wissenschaftlich präzise Farbdarstellung

#### Logarithmische Skalierung:

```typescript
iconScaleElement: {
    val_min: 1,
    val_max: 1000,
    log10: 'max'    // 'min', 'max', oder 'center'
}
```

**Optionen für log10:**
- `'min'`: Logarithmische Skalierung zum Minimum hin
- `'max'`: Logarithmische Skalierung zum Maximum hin  
- `'center'`: Logarithmische Skalierung zur Mitte hin

#### Beispiele für verschiedene Anwendungen:

**Temperatur-Anzeige:**
```typescript
iconScaleElement: {
    val_min: -10,
    val_max: 35,
    val_best: 22,
    mode: 'quadriGradAnchor'
}
```

**Wind-Geschwindigkeit:**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 120,
    mode: 'triGrad',
    log10: 'max'
}
```

**Batterie-Level:**
```typescript
iconScaleElement: {
    val_min: 10,
    val_max: 100,
    val_best: 80,
    mode: 'triGradAnchor'
}
```

#### Kombinationsbeispiele für komplexe Szenarien:

**Luftfeuchtigkeit mit Optimalbereich (40-60%):**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,
    val_best: 50,        // Optimum bei 50%
    mode: 'quadriGradAnchor',
    log10: 'center'      // Betonung des mittleren Bereichs
}
```

**Stromverbrauch mit logarithmischer Skalierung:**
```typescript
iconScaleElement: {
    val_min: 1,
    val_max: 5000,
    mode: 'triGrad',
    log10: 'max'        // Logarithmische Skalierung für große Wertebereiche
}
```

**Komplexer Temperaturbereich mit präziser Gradation:**
```typescript
iconScaleElement: {
    val_min: -20,
    val_max: 45,
    val_best: 21,        // Ideale Raumtemperatur
    mode: 'quadriGradAnchor',
    color_best: {red: 0, green: 255, blue: 0}  // Explizite Grünfärbung bei Optimum
}
```

**Internet-Geschwindigkeit mit Hue-Farbverlauf:**
```typescript
iconScaleElement: {
    val_min: 0,
    val_max: 100,        // 100 Mbit/s
    mode: 'hue',         // Farbkreis-Verlauf von Rot bis Grün
    log10: 'min'         // Betonung niedriger Geschwindigkeiten
}
```

### Farbmodi

- **mixed**: Lineare Interpolation zwischen zwei RGB-Farben (Standard)
- **hue**: Farbton-basierte Skalierung
- **cie**: CIE-Farbtabelle für natürlichere Übergänge

## Template-Konfiguration

## Wetter-Templates

Wetter-Templates sind spezialisierte Template-Konfigurationen, die **zwingend den `dpInit`-Parameter benötigen**. Dieser Parameter definiert den Regex-Pattern zur automatischen Erkennung der entsprechenden Wetter-States.

### Wichtiger Hinweis
**Alle Wetter-Templates funktionieren nur mit korrekter `dpInit`-Konfiguration!** Der `dpInit`-Parameter muss auf den entsprechenden Wetteradapter und dessen State-Struktur angepasst werden.

#### Pirate Weather

**Verfügbare Templates:**
- `text.pirate-weather.favorit` - Hauptwetter-Anzeige (für Favorit-Bereich)
- `text.pirate-weather.sunriseset` - Sonnenauf-/untergang
- `text.pirate-weather.windspeed` - Windgeschwindigkeit
- `text.pirate-weather.windgust` - Böen
- `text.pirate-weather.winddirection` - Windrichtung
- `text.pirate-weather.uvindex` - UV-Index
- `text.pirate-weather.bot2values` - Wettervorhersage Tage
- `text.pirate-weather.hourlyweather` - Stündliche Vorhersage

**Beispiel-Konfigurationen:**

```typescript
// Favorit-Wetter für Hauptanzeige
favoritScreensaverEntity: [
    {
        type: 'template',
        template: 'text.pirate-weather.favorit',
        dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
        modeScr: 'favorit'
    }
]

// Wettervorhersage für Bottom-Bereich (Tag 1-3)
bottomScreensaverEntity: [
    {
        type: 'template',
        template: 'text.pirate-weather.bot2values',
        dpInit: `/^pirate-weather\\.0.+?\\.daily\\.01/`,  // Tag 1
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.pirate-weather.bot2values',
        dpInit: `/^pirate-weather\\.0.+?\\.daily\\.02/`,  // Tag 2
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.pirate-weather.sunriseset',
        dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.+/`,
        modeScr: 'bottom'
    }
]
```

#### OpenWeatherMap

**Verfügbare Templates:**
- `text.openweathermap.favorit`
- `text.openweathermap.sunriseset`
- `text.openweathermap.windspeed`
- `text.openweathermap.windgust`
- `text.openweathermap.winddirection`
- `text.openweathermap.bot2values`

**Beispiel-Konfiguration:**

```typescript
// OpenWeatherMap Hauptwetter
favoritScreensaverEntity: [
    {
        type: 'template',
        template: 'text.openweathermap.favorit',
        dpInit: `/^openweathermap\\.0.+/`,
        modeScr: 'favorit'
    }
]

// Tagesvorhersagen
bottomScreensaverEntity: [
    {
        type: 'template',
        template: 'text.openweathermap.bot2values',
        dpInit: `/^openweathermap\\.0.+?day0/`,  // Heute
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.openweathermap.windspeed',
        dpInit: `/^openweathermap\\.0./`,
        modeScr: 'bottom'
    }
]
```

#### AccuWeather
- `text.accuweather.favorit`
- `text.accuweather.sunriseset`
- `text.accuweather.windspeed`
- `text.accuweather.windgust`
- `text.accuweather.winddirection`
- `text.accuweather.uvindex`
- `text.accuweather.bot2values`

#### BrightSky
- `text.brightsky.favorit`
- `text.brightsky.sunriseset`
- `text.brightsky.windspeed`
- `text.brightsky.windgust`
- `text.brightsky.winddirection`
- `text.brightsky.solar`
- `text.brightsky.bot2values`

**BrightSky Beispiel:**

```typescript
bottomScreensaverEntity: [
    {
        type: 'template',
        template: 'text.brightsky.sunriseset',
        dpInit: `/^brightsky\\.0\\.daily\\.00.+/`,
        modeScr: 'bottom'
    },
    {
        type: 'template',
        template: 'text.brightsky.solar',
        dpInit: `/^brightsky\\.0\\.current./`,
        modeScr: 'bottom'
    }
]
```

### Automatische Wetter-Element-Integration

Anstatt alle Wetter-Templates manuell zu konfigurieren, kann die automatische Integration genutzt werden:

```typescript
const config: ScriptConfig.Config = {
    weatherEntity: 'pirate-weather.0.',  // Basis-Wetteradapter
    weatherAddDefaultItems: true,        // Alle Standard-Elemente hinzufügen
    
    // ODER selektive Aktivierung:
    weatherAddDefaultItems: {
        sunriseSet: true,
        forecastDay1: true,
        forecastDay2: true,
        forecastDay3: false,
        windSpeed: true,
        windGust: true,
        windDirection: true,
        uvIndex: true,
        solar: true  // nur BrightSky
    }
}
```

## Zusätzliche Text-Templates

Neben den Wetter-Templates stehen weitere vorgefertigte Templates für verschiedene Gerätekategorien zur Verfügung:

### Allgemeine Templates

**`text.clock`**
- **Verwendung**: Aktuelle Uhrzeit
- **States**: Interne Zeitquelle (`///time`)
- **Role**: `text`
- **CommonType**: `string`
- **Regexp**: Interne Zeit-Variable

**`text.temperature`**
- **Verwendung**: Temperaturanzeige mit Farbskala
- **States**: Sucht nach States mit Role `value.temperature`
- **Role**: `value.temperature`
- **CommonType**: `number`
- **Regexp**: Keine spezifische (verwendet Role-basierte Suche)
- **Features**: Automatische Farbskala basierend auf Temperaturwerten

**`text.battery`**
- **Verwendung**: Batteriestand mit dynamischen Icons
- **States**: Batterie-Status und Ladezustand
- **Role**: `value.battery`, `value.power` (für Ladestatus)
- **CommonType**: `number`, `boolean`
- **Features**: 
  - Automatische Icon-Auswahl basierend auf Füllstand
  - Unterscheidung zwischen Laden/Entladen
  - Prozentanzeige mit Einheit

**`text.battery.low`**
- **Verwendung**: Batteriewarnung bei niedrigem Stand
- **Role**: `indicator.lowbat`
- **CommonType**: `boolean`
- **Features**: Rote Warnung bei niedrigem Batteriestand

### Fenster & Türen Templates

**`text.window.isOpen`**
- **Verwendung**: Fensterstatus (Offen/Geschlossen)
- **Role**: `sensor.window`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: Grünes Icon bei geöffneten, rotes bei geschlossenen Fenstern

**`text.window.isClose`**
- **Verwendung**: Invertierter Fensterstatus
- **Role**: `sensor.window`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: Invertierte Logik von `text.window.isOpen`

**`text.door.isOpen`**
- **Verwendung**: Türstatus
- **Role**: `sensor.door`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: Tür-spezifische Icons

**`text.gate.isOpen`**
- **Verwendung**: Tor-/Garagenstatus
- **Role**: `sensor.door`, `switch.gate`, `sensor.open`
- **CommonType**: `boolean`
- **Features**: Garage/Tor-spezifische Icons

**`text.lock`**
- **Verwendung**: Schloss-Status
- **Role**: `switch.lock`, `state`
- **CommonType**: `boolean`
- **Features**: Offen (Cyan) / Geschlossen (Grün) Farbkodierung

### Bewegung & Sicherheit Templates

**`text.motion`**
- **Verwendung**: Bewegungsmelder
- **Role**: `sensor.motion`
- **CommonType**: `boolean`
- **Features**: Aktivierungsanzeige mit Farbwechsel

**`text.warning`**
- **Verwendung**: Warnmeldungen mit verschiedenen Stufen
- **Role**: `value.warning`, `weather.title.short`, `weather.title`
- **CommonType**: `number`, `string`
- **Regexp**: `/\.LEVEL$/`, `/\.TITLE$/`, `/\.INFO$/`
- **Features**: 4-stufige Farbskala für Warnstufen

### Netzwerk & Verbindung Templates

**`text.isOnline`**
- **Verwendung**: Internet-/Geräteverbindung
- **Role**: `indicator.reachable`
- **CommonType**: `boolean`
- **Features**: Online (Grün) / Offline (Rot) Anzeige

**`text.wlan`**
- **Verwendung**: WLAN-Verbindungsstatus
- **Features**: Statisches WLAN-Icon mit Beschriftung

### Spezielle Templates

**`text.info`**
- **Verwendung**: Universelle Informationsanzeige mit benutzerdefinierten Werten
- **Role**: `state`, `value.rgb`, `text`
- **Regexp**: `/\.ACTUAL$/`, `/\.USERICON$/`, `/\.COLORDEC$/`, `/\.BUTTONTEXT$/`
- **Features**: 
  - Benutzerdefinierte Icons über `USERICON`-State
  - Benutzerdefinierte Farben über `COLORDEC`-State
  - Dynamische Texte über verschiedene Text-States

**`text.shutter.navigation`**
- **Verwendung**: Rolladen-/Jalousiensteuerung
- **Role**: `blind`
- **Regexp**: `/\.ACTUAL$/`, `/\.TILT_ACTUAL$/`
- **Features**: 
  - Position und Neigungsanzeige
  - Verschiedene Icons für Zustände (offen, geschlossen, in Bewegung)

#### Adapter-spezifische Templates

**`text.battery.bydhvs`** (BYD HVS Batteriespeicher)
- **Adapter**: `bydhvs`
- **Role**: `value.battery`, `value.power`
- **Regexp**: `/\.State\.SOC$/`, `/\.State\.Power$/`
- **Features**: BYD-spezifische Batterieanzeige mit Lade-/Entladestatus

**Wind-Templates (verschiedene Adapter)**
- `text.sainlogic.windarrow` - SainLogic Wetterstation mit Windpfeil
- `text.custom.windarrow` - Universeller Windpfeil
- `text.hmip.windcombo` - HomeMatic IP Windanzeige

**Sonnenauf-/untergangs-Templates**
- `text.openweathermap.sunriseset` - OpenWeatherMap Sonnenzeiten
- `text.accuweather.sunriseset` - AccuWeather Sonnenzeiten

**Fahrplan-Templates**
- `text.fahrplan.departure` - Deutsche Bahn Abfahrten
- `text.alias.fahrplan.departure` - Alias-Version für Fahrpläne

### Template-Verwendung

Die Templates können mit dem `dpInit`-Parameter auf spezifische Adapter-Instanzen angewendet werden:

```typescript
{
    type: 'template',
    template: 'text.battery',
    dpInit: `/^zigbee\\.0\\..*\\.battery$/`,  // Alle Zigbee-Batteriestates
    modeScr: 'indicator'
}
```

## Automatische Wetter-Elemente

Für automatisches Hinzufügen von Standard-Wetterelementen:

```typescript
const config: ScriptConfig.Config = {
    // ...andere Konfiguration
    
    weatherAddDefaultItems: true,  // Alle Standard-Wetterelemente
    
    // ODER selektive Aktivierung:
    weatherAddDefaultItems: {
        sunriseSet: true,
        forecastDay1: true,
        forecastDay2: true,
        forecastDay3: false,
        windSpeed: true,
        windGust: true,
        windDirection: true,
        uvIndex: true,
        solar: true  // nur BrightSky
    }
};
```

## Vollständige Arbeitsbeispiele für alle Modi

## Advanced Mode - Komplett-Konfiguration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Wohnzimmer NSPanel',
    panelTopic: 'nspanel-wohnzimmer',
    
    // Wetter-Integration
    weatherEntity: 'pirate-weather.0.',
    
    // Favorit-Bereich (Hauptwetter)
    favoritScreensaverEntity: [{
        type: 'template',
        template: 'text.pirate-weather.favorit',
        dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
        modeScr: 'favorit'
    }],
    
    // Left-Bereich (3 Elemente)
    leftScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wohnzimmer.Temperatur',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Innen',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityIconColor: {val_min: 18, val_max: 26, val_best: 22}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wohnzimmer.Luftfeuchtigkeit',
            ScreensaverEntityIconOn: 'water-percent',
            ScreensaverEntityText: 'Feuchte',
            ScreensaverEntityUnitText: '%',
            ScreensaverEntityIconColor: {val_min: 30, val_max: 70, val_best: 45}
        },
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'left'
        }
    ],
    
    // Indicator-Bereich (5 Elemente)
    indicatorScreensaverEntity: [
        {
            type: 'template',
            template: 'text.window.isOpen',
            dpInit: `/^alias\\.0\\.Wohnzimmer\\.Fenster.*$/`,
            modeScr: 'indicator'
        },
        {
            type: 'template',
            template: 'text.motion',
            dpInit: `/^zigbee\\.0\\..*\\.occupancy$/`,
            modeScr: 'indicator'
        },
        {
            type: 'template',
            template: 'text.battery.low',
            dpInit: `/^zigbee\\.0\\..*\\.battery_low$/`,
            modeScr: 'indicator'
        },
        {
            type: 'template',
            template: 'text.isOnline',
            dpInit: `/^alias\\.0\\.System\\.Internet$/`,
            modeScr: 'indicator'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Sicherheit.Status',
            ScreensaverEntityIconOn: 'shield-check',
            ScreensaverEntityIconOff: 'shield-alert',
            ScreensaverEntityText: 'Alarm'
        }
    ],
    
    // Bottom-Bereich (6 Elemente)
    bottomScreensaverEntity: [
        {
            type: 'template',
            template: 'text.pirate-weather.bot2values',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.01.*/`,
            modeScr: 'bottom'
        },
        {
            type: 'template',
            template: 'text.pirate-weather.bot2values',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.02.*/`,
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Energie.Verbrauch.Aktuell',
            ScreensaverEntityIconOn: 'flash',
            ScreensaverEntityText: 'Verbrauch',
            ScreensaverEntityUnitText: 'W',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 5000, mode: 'triGrad'}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Heizung.Vorlauftemperatur',
            ScreensaverEntityIconOn: 'radiator',
            ScreensaverEntityText: 'Heizung',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityIconColor: {val_min: 20, val_max: 80, val_best: 45}
        },
        {
            type: 'template',
            template: 'text.pirate-weather.windspeed',
            dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\.windSpeed$/`,
            modeScr: 'bottom'
        },
        {
            type: 'template',
            template: 'text.pirate-weather.sunriseset',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.*/`,
            modeScr: 'bottom'
        }
    ],
    
    // MR-Icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'Relay.1',
        ScreensaverEntityIconOn: 'lightbulb-on',
        ScreensaverEntityIconOff: 'lightbulb-off',
        ScreensaverEntityText: 'Licht',
        ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 1}
    },
    
    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Wohnzimmer.Steckdose',
        ScreensaverEntityIconOn: 'power-plug',
        ScreensaverEntityIconOff: 'power-plug-off',
        ScreensaverEntityText: 'Steckdose'
    }
};
```

## Alternate Mode - Konfiguration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Küche NSPanel',
    panelTopic: 'nspanel-kueche',
    
    // Favorit-Bereich
    favoritScreensaverEntity: [{
        type: 'template',
        template: 'text.openweathermap.favorit',
        dpInit: `/^openweathermap\\.0\\.forecast\\.current\\./`,
        modeScr: 'favorit'
    }],
    
    // Alternate-Bereich (Alternative Ansicht)
    alternateScreensaverEntity: [{
        type: 'script',
        ScreensaverEntity: 'alias.0.Kueche.CO2',
        ScreensaverEntityIconOn: 'molecule-co2',
        ScreensaverEntityText: 'CO₂',
        ScreensaverEntityUnitText: 'ppm',
        ScreensaverEntityIconColor: {
            val_min: 400,
            val_max: 1200,
            val_best: 600,
            mode: 'triGradAnchor'
        }
    }],
    
    // Bottom-Bereich (nur 3 Elemente)
    bottomScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Kueche.Temperatur',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Küche',
            ScreensaverEntityUnitText: '°C'
        },
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Kueche.Helligkeit',
            ScreensaverEntityIconOn: 'brightness-6',
            ScreensaverEntityText: 'Licht',
            ScreensaverEntityUnitText: 'lux'
        }
    ],
    
    // MR-Icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Kueche.Unterschrankbeleuchtung',
        ScreensaverEntityIconOn: 'led-strip',
        ScreensaverEntityIconOff: 'led-strip-variant-off',
        ScreensaverEntityText: 'LED'
    },
    
    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Kueche.Dunstabzug',
        ScreensaverEntityIconOn: 'fan',
        ScreensaverEntityIconOff: 'fan-off',
        ScreensaverEntityText: 'Lüfter'
    }
};
```

## Standard Mode - Konfiguration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Flur NSPanel',
    panelTopic: 'nspanel-flur',
    
    // Favorit-Bereich
    favoritScreensaverEntity: [{
        type: 'template',
        template: 'text.brightsky.favorit',
        dpInit: `/^brightsky\\.0\\.weather\\.current\\./`,
        modeScr: 'favorit'
    }],
    
    // Bottom-Bereich (4 Elemente)
    bottomScreensaverEntity: [
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Flur.Temperatur',
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Flur',
            ScreensaverEntityUnitText: '°C'
        },
        {
            type: 'template',
            template: 'text.motion',
            dpInit: `/^zigbee\\.0\\.Flur_Bewegung\\.occupancy$/`,
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.System.Speicherplatz',
            ScreensaverEntityIconOn: 'harddisk',
            ScreensaverEntityText: 'Speicher',
            ScreensaverEntityUnitText: '%',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 90, mode: 'triGrad'}
        }
    ],
    
    // MR-Icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Flur.Deckenlampe',
        ScreensaverEntityIconOn: 'ceiling-light',
        ScreensaverEntityIconOff: 'ceiling-light-outline',
        ScreensaverEntityText: 'Decke'
    },
    
    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Flur.Nachtlicht',
        ScreensaverEntityIconOn: 'lightbulb-night',
        ScreensaverEntityIconOff: 'lightbulb-night-outline',
        ScreensaverEntityText: 'Nacht'
    }
};
```

## Easy View Mode - Konfiguration

```typescript
const config: ScriptConfig.Config = {
    panelName: 'Seniorenzimmer NSPanel',
    panelTopic: 'nspanel-senior',
    
    // Easy View hat nur Bottom-Bereich mit extra großer Schrift (3 Elemente)
    bottomScreensaverEntity: [
        {
            type: 'template',
            template: 'text.clock',
            modeScr: 'bottom'
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wohnzimmer.Temperatur',
            ScreensaverEntityText: 'Temperatur',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityDecimalPlaces: 0  // Ganze Zahlen für bessere Lesbarkeit
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wettervorhersage.Heute.Max',
            ScreensaverEntityText: 'Außen Max',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityDecimalPlaces: 0
        }
    ]
    
    // KEINE mrIcon-Konfiguration - Easy View unterstützt keine MR-Icons
    // KEINE komplexen Icons oder Farbskalierung - Fokus auf Einfachheit
};
```

## Erweiterte Optionen

### Screensaver-Verhalten

Im Konfigurationsskript können zusätzliche Optionen über `advancedOptions` gesteuert werden:

```typescript
const config: ScriptConfig.Config = {
    // ...andere Konfiguration
    
    advancedOptions: {
        screensaverSwipe: true,                // Wischen zwischen Screensaver-Ansichten
        screensaverIndicatorButtons: true,     // Indikator-Buttons aktivieren
        extraConfigLogging: false             // Erweiterte Protokollierung
    }
};
```

### Relay-Integration

Die mrIcon-Elemente können direkt mit den NSPanel-Relays verbunden werden:

```typescript
mrIcon1ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.1',  // Direkter Bezug auf Relay 1
    // ...weitere Konfiguration
},

mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'Relay.2',  // Direkter Bezug auf Relay 2
    // ...weitere Konfiguration
}
```

## Vollständiges Beispiel

Hier ist eine vollständige Screensaver-Konfiguration mit allen Bereichen:

```typescript
const config: ScriptConfig.Config = {
    // ...andere Basis-Konfiguration
    
    // Wetter-Integration
    weatherEntity: 'pirate-weather.0.',
    weatherAddDefaultItems: {
        sunriseSet: true,
        forecastDay1: true,
        forecastDay2: true,
        windSpeed: true,
        windGust: true
    },
    
    // Hauptbereich - Wetteranzeige
    favoritScreensaverEntity: [
        {
            type: 'template',
            template: 'text.pirate-weather.favorit',
            dpInit: `/^pirate-weather\\.0\\.weather\\.currently\\./`,
            modeScr: 'favorit'
        }
    ],
    
    // Unterer Bereich - Verschiedene Informationen
    bottomScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Wetter.Wind',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'weather-windy',
            ScreensaverEntityText: 'Wind',
            ScreensaverEntityUnitText: 'km/h',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 120}
        },
        {
            type: 'template',
            template: 'text.pirate-weather.sunriseset',
            dpInit: `/^pirate-weather\\.0\\.weather\\.daily\\.00.+/`,
            modeScr: 'bottom'
        }
    ],
    
    // Indikator-Icons
    indicatorScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Status.Fenster_offen',
            ScreensaverEntityIconOn: 'window-open-variant',
            ScreensaverEntityIconOff: 'window-closed-variant',
            ScreensaverEntityText: 'Fenster',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Status.Licht_an',
            ScreensaverEntityIconOn: 'lightbulb',
            ScreensaverEntityIconOff: 'lightbulb-outline',
            ScreensaverEntityText: 'Licht',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 1}
        },
        null,  // Platzhalter
        null,  // Platzhalter
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Sicherheit.Alarm',
            ScreensaverEntityIconOn: 'shield-check',
            ScreensaverEntityIconOff: 'shield-alert',
            ScreensaverEntityText: 'Alarm',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 1, val_best: 0}
        }
    ],
    
    // Linker Bereich
    leftScreensaverEntity: [
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Sensoren.Temperatur_innen',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'thermometer',
            ScreensaverEntityText: 'Temperatur',
            ScreensaverEntityUnitText: '°C',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 35, val_best: 22}
        },
        {
            type: 'script',
            ScreensaverEntity: 'alias.0.Energie.Verbrauch_heute',
            ScreensaverEntityFactor: 1,
            ScreensaverEntityDecimalPlaces: 1,
            ScreensaverEntityIconOn: 'flash',
            ScreensaverEntityText: 'Energie',
            ScreensaverEntityUnitText: 'kWh',
            ScreensaverEntityIconColor: {val_min: 0, val_max: 50}
        }
    ],
    
    // Alternative Ansicht (leer in diesem Beispiel)
    alternateScreensaverEntity: [],
    
    // Relay-Icons
    mrIcon1ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'Relay.1',
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: 'lightbulb-outline',
        ScreensaverEntityOnColor: Yellow,  // Gelb für eingeschaltetes Licht
        ScreensaverEntityOffColor: HMIOff  // Standard Aus-Farbe (Blau)
    },
    
    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Licht.Flur',
        ScreensaverEntityIconOn: 'ceiling-light',
        ScreensaverEntityIconOff: 'ceiling-light-outline',
        ScreensaverEntityValue: 'alias.0.Licht.Flur.Helligkeit',
        ScreensaverEntityValueUnit: '%',
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityOnColor: On,    // Empfohlene An-Farbe
        ScreensaverEntityOffColor: Gray  // Graue Farbe für Aus-Zustand
    },
    
    // Erweiterte Optionen
    advancedOptions: {
        screensaverSwipe: true,
        screensaverIndicatorButtons: true
    }
};
```

## Tipps und Best Practices

### Performance-Optimierung

1. **Begrenzen Sie die Anzahl der Elemente**: Zu viele Screensaver-Elemente können die Performance beeinträchtigen
2. **Verwenden Sie Templates**: Templates sind optimiert und bieten bessere Performance als script-Konfigurationen
3. **Vermeiden Sie häufige Updates**: Wählen Sie Datenquellen, die nicht zu oft aktualisiert werden

### Benutzerfreundlichkeit

1. **Konsistente Icons**: Verwenden Sie ähnliche Icons für verwandte Funktionen
2. **Klare Beschriftungen**: Verwenden Sie kurze, verständliche Texte
3. **Sinnvolle Farbkodierung**: Nutzen Sie Farben zur schnellen Statuserkennung

### Fehlerbehandlung

1. **Null-Werte**: Verwenden Sie `null` für optionale Elemente statt sie wegzulassen
2. **Gültige State-IDs**: Überprüfen Sie, dass alle referenzierten States existieren
3. **Korrekte Typen**: Achten Sie auf die richtigen Datentypen für Parameter

### Wartung

1. **Dokumentation**: Kommentieren Sie komplexe Konfigurationen
2. **Modularität**: Definieren Sie wiederkehrende Farben und Werte als Konstanten
3. **Versionierung**: Dokumentieren Sie Änderungen an der Screensaver-Konfiguration

## Troubleshooting

### Häufige Probleme

**Problem**: Screensaver-Element wird nicht angezeigt
- Überprüfen Sie, ob der State existiert und gültige Daten liefert
- Kontrollieren Sie die Syntax der Konfiguration
- Prüfen Sie die Adapter-Logs auf Fehlermeldungen

**Problem**: Farben werden nicht korrekt angezeigt
- Stellen Sie sicher, dass RGB-Werte zwischen 0 und 255 liegen
- Überprüfen Sie die Farbskala-Parameter
- Kontrollieren Sie, ob der referenzierte State numerische Werte liefert

**Problem**: Templates funktionieren nicht
- Überprüfen Sie, ob der Wetter-Adapter läuft und Daten liefert
- Kontrollieren Sie die Instanz-Nummer im dpInit-Pattern
- Stellen Sie sicher, dass das Template für Ihren Wetter-Adapter verfügbar ist

**Problem**: Icons werden nicht angezeigt
- Verwenden Sie nur gültige Material Design Icons
- Überprüfen Sie die Schreibweise der Icon-Namen
- Konsultieren Sie die Icon-Dokumentation für verfügbare Icons

Diese Dokumentation bietet eine vollständige Übersicht über alle Screensaver-Konfigurationsoptionen. Für weitere Hilfe besuchen Sie das [ioBroker Forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui) oder das [GitHub Wiki](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki).