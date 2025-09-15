# Screensaver Konfiguration

Der Screensaver ist die Ansicht, die auf dem NSPanel angezeigt wird, wenn es nicht aktiv verwendet wird. Diese Dokumentation beschreibt alle Möglichkeiten zur Konfiguration des Bildschirmschoners in Ihrem Konfigurationsskript.

## Übersicht

Der Screensaver kann verschiedene Bereiche anzeigen:
- **Favorit-Bereich**: Hauptbereich für wichtige Informationen (meist Wetter)
- **Bottom-Bereich**: Unterer Bereich für zusätzliche Informationen
- **Left-Bereich**: Linker Bereich für Status-Informationen
- **Indicator-Bereich**: Indikator-Icons für schnelle Statusübersicht
- **Alternate-Bereich**: Alternative Ansicht für den Hauptbereich
- **MR-Icons**: Schaltbare Relay-Icons

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
    ScreensaverEntityOnColor: {red: 253, green: 216, blue: 53},
    ScreensaverEntityOffColor: {red: 68, green: 115, blue: 158}
},

mrIcon2ScreensaverEntity: {
    type: 'script',
    ScreensaverEntity: 'alias.0.Beleuchtung.Flur',
    ScreensaverEntityIconOn: 'ceiling-light',
    ScreensaverEntityValue: 'alias.0.Beleuchtung.Flur.Helligkeit',
    ScreensaverEntityValueUnit: '%',
    ScreensaverEntityValueDecimalPlace: 0,
    ScreensaverEntityOnColor: {red: 255, green: 255, blue: 0},
    ScreensaverEntityOffColor: {red: 68, green: 115, blue: 158}
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
| `ScreensaverEntityOnColor` | RGB-Objekt | Farbe für Zustand "Ein" | `{red: 255, green: 0, blue: 0}` |
| `ScreensaverEntityOffColor` | RGB-Objekt | Farbe für Zustand "Aus" | `{red: 0, green: 0, blue: 255}` |
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

### Farbmodi

- **mixed**: Lineare Interpolation zwischen zwei RGB-Farben (Standard)
- **hue**: Farbton-basierte Skalierung
- **cie**: CIE-Farbtabelle für natürlichere Übergänge

## Template-Konfiguration

### Wetter-Templates

#### Pirate Weather
- `text.pirate-weather.favorit` - Hauptwetter-Anzeige
- `text.pirate-weather.sunriseset` - Sonnenauf-/untergang
- `text.pirate-weather.windspeed` - Windgeschwindigkeit
- `text.pirate-weather.windgust` - Böen
- `text.pirate-weather.winddirection` - Windrichtung
- `text.pirate-weather.uvindex` - UV-Index
- `text.pirate-weather.bot2values` - Wettervorhersage Tage
- `text.pirate-weather.hourlyweather` - Stündliche Vorhersage

#### OpenWeatherMap
- `text.openweathermap.favorit`
- `text.openweathermap.sunriseset`
- `text.openweathermap.windspeed`
- `text.openweathermap.windgust`
- `text.openweathermap.winddirection`
- `text.openweathermap.bot2values`

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

### Automatische Wetter-Elemente

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
        ScreensaverEntityOnColor: {red: 255, green: 255, blue: 0},
        ScreensaverEntityOffColor: {red: 68, green: 115, blue: 158}
    },
    
    mrIcon2ScreensaverEntity: {
        type: 'script',
        ScreensaverEntity: 'alias.0.Licht.Flur',
        ScreensaverEntityIconOn: 'ceiling-light',
        ScreensaverEntityIconOff: 'ceiling-light-outline',
        ScreensaverEntityValue: 'alias.0.Licht.Flur.Helligkeit',
        ScreensaverEntityValueUnit: '%',
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityOnColor: {red: 255, green: 200, blue: 0},
        ScreensaverEntityOffColor: {red: 100, green: 100, blue: 100}
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