# Global Pages und Global Link

## Übersicht

Das Feature **Global Pages** ermöglicht es, Seitenkonfigurationen zentral zu definieren und in mehreren Panel-Skripten wiederzuverwenden. Dies ist besonders nützlich, wenn Sie mehrere NSPanels haben und möchten, dass diese die gleichen Seiten verwenden, aber mit jeweils unterschiedlicher Navigation oder Anordnung.

Die Funktion besteht aus zwei Hauptkomponenten:
- **Global Script**: Definiert wiederverwendbare Seiten zentral
- **Local Script**: Referenziert Seiten aus dem Global Script mittels `globalLink`

## Konzept und Vorteile

### Was sind Global Pages?

Global Pages sind Seitendefinitionen, die in einem separaten **Global Script** gespeichert werden. Diese Seiten können dann von mehreren **Local Scripts** (Panel-spezifische Konfigurationen) referenziert werden.

### Vorteile

- **Zentrale Wartung**: Änderungen an einer Seite werden nur einmal im Global Script vorgenommen und automatisch auf alle Panels übertragen
- **Konsistenz**: Alle Panels verwenden die gleichen Seitendefinitionen
- **Flexibilität**: Jedes Panel kann die globalen Seiten in unterschiedlicher Reihenfolge und mit unterschiedlicher Navigation verwenden
- **Überschreibbarkeit**: Bestimmte Eigenschaften wie `heading` können im Local Script überschrieben werden
- **Reduzierte Redundanz**: Keine Notwendigkeit, die gleichen Seiten mehrfach zu definieren

## Global Script einrichten

### 1. Global Script verwenden

Der Adapter erstellt bei der Installation automatisch ein Global Script (`globalPageConfig.ts`). Dieses Script enthält bereits alle notwendigen Strukturen und muss nur mit Ihren Seitendefinitionen gefüllt werden.

**Hinweis**: Das Script wird im JavaScript-Adapter-Ordner gespeichert und ist sofort einsatzbereit. Sie müssen es nur bearbeiten und ausführen.

#### Grundstruktur

Die Konfiguration im Global Script hat folgende Struktur:

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig', // Pflichtfeld
    
    // Alle globalen Seiten
    subPages: [
        // Hier kommen die Seitendefinitionen
    ],
    
    // Optional: Gemeinsame Navigation
    navigation?: NavigationItemConfig[],
    
    // Optional: Native Page Items
    nativePageItems?: any[],
    
    // Optional: Maximale Anzahl der Navigationsanpassungen bei Deep Linking (Standard: 3)
    maxNavigationAdjustRuns?: number
};
```

#### Wichtige Eigenschaften

- `type: 'globalConfig'` - **Pflichtfeld**: Kennzeichnet dies als Global Config
- `subPages` - Array mit allen globalen Seitendefinitionen
- `navigation` - Optional: Gemeinsame Navigationskonfiguration
- `nativePageItems` - Optional: Gemeinsame native Page Items
- `maxNavigationAdjustRuns` - Optional: Maximale Anzahl der Iterationen für Deep Linking bei uniqueName-Überschreibung (Standard: 3)

### 2. Globale Seiten definieren

Jede Seite im Global Script muss einen eindeutigen `uniqueName` haben. Dies ist der Schlüssel, über den die Seite später referenziert wird.

#### Beispiel: Einfache Grid-Seite

```typescript
const wohnzimmer: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'wohnzimmer', // Wichtig: eindeutiger Name!
    heading: 'Wohnzimmer',
    prev: 'main',
    next: 'kueche',
    items: [
        { id: 'alias.0.Wohnzimmer.Licht.Hauptlicht' },
        { id: 'alias.0.Wohnzimmer.Steckdose.TV' },
        { id: 'alias.0.Wohnzimmer.Blind.Rollo1' },
        // ... weitere Items
    ]
};
```

#### Beispiel: Media-Seite

```typescript
const mediaPlayer: ScriptConfig.PageMedia = {
    type: 'cardMedia',
    uniqueName: 'media_wohnzimmer',
    heading: 'Sonos Wohnzimmer',
    prev: 'wohnzimmer',
    next: 'main',
    media: {
        id: 'sonos.0.Wohnzimmer',
        speakerList: ['Wohnzimmer', 'Küche', 'Schlafzimmer'],
        playList: ['Favoriten', 'Radio'],
        volumePresets: ['Leise?20', 'Normal?50', 'Laut?80'],
        minValue: 0,
        maxValue: 100
    },
    items: []
};
```

#### Beispiel: Thermostat-Seite

```typescript
const heizung: ScriptConfig.PageThermo = {
    type: 'cardThermo',
    uniqueName: 'heizung_wohnzimmer',
    heading: 'Heizung Wohnzimmer',
    prev: 'media_wohnzimmer',
    next: 'main',
    items: [
        {
            id: 'alias.0.Wohnzimmer.Thermostat',
            minValue: 160, // 16.0°C
            maxValue: 240, // 24.0°C
            stepValue: 5    // 0.5°C Schritte
        }
    ]
};
```

### 3. Global Config zusammenstellen

Alle definierten Seiten werden im `subPages` Array zusammengefasst:

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        wohnzimmer,
        mediaPlayer,
        heizung,
        kueche,
        schlafzimmer,
        // ... weitere Seiten
    ]
};
```

### 4. Script ausführen

Nach der Konfiguration der Seiten müssen Sie das Global Script ausführen. Die Übertragung der Konfiguration an den Adapter erfolgt automatisch - der dafür notwendige Code ist bereits im Script enthalten und muss nicht manuell erstellt werden.

**Wichtig**: Das Global Script muss nach jeder Änderung erneut ausgeführt werden, um die Konfiguration zu aktualisieren.

## Local Script konfigurieren

### 1. Local Script verwenden

Der Adapter erstellt bei der Installation automatisch ein Local Script für jedes Panel. Der Scriptname basiert auf dem Panelnamen, den Sie bei der Einrichtung gewählt haben. Dieses Script muss nur mit Ihren panelspezifischen Konfigurationen gefüllt werden.

### 2. Seiten mit globalLink referenzieren

Im Local Script (Panel-spezifische Konfiguration) werden globale Seiten über `globalLink` eingebunden.

#### Minimale Referenz

Die einfachste Form ist, nur den `globalLink` anzugeben:

```typescript
const wohnzimmerPage: PageType = {
    globalLink: 'wohnzimmer' // Referenziert die Seite mit uniqueName 'wohnzimmer'
};
```

Dies übernimmt **alle** Eigenschaften der globalen Seite, einschließlich Navigation (`prev`, `next`, etc.).

#### Mit optionalem Heading

Sie können die Überschrift überschreiben:

```typescript
const wohnzimmerPage: PageType = {
    heading: 'Wohnbereich', // Überschreibt das Heading aus dem Global Script
    globalLink: 'wohnzimmer'
};
```

#### Mit optionalem uniqueName (Deep Linking)

Sie können auch einen eigenen `uniqueName` vergeben. In diesem Fall erstellt der Adapter automatisch Kopien aller referenzierten Seiten und passt die Navigation an, sodass eine isolierte Seitenhierarchie entsteht:

```typescript
const wohnzimmerPage: PageType = {
    uniqueName: 'wz_panel1', // Eigener uniqueName für dieses Panel
    heading: 'Wohnbereich',
    globalLink: 'wohnzimmer'
};
```

**Deep Linking**: Wenn Sie einen eigenen `uniqueName` angeben, der sich vom `uniqueName` der globalen Seite unterscheidet, wird die globale Seite mit diesem neuen Namen kopiert. Zusätzlich werden alle Seiten, auf die diese Seite verweist (über `next`, `prev`, `home`, `parent` oder `navigate`-Items), ebenfalls kopiert und umbenannt. Dies ermöglicht es, dieselbe globale Seite mehrfach mit unterschiedlichen Namen und isolierten Navigationspfaden zu verwenden.

**Beispiel**: Wenn die globale Seite `wohnzimmer` auf `kueche` verweist und Sie `uniqueName: 'wz_panel1'` setzen, wird auch `kueche` kopiert (z.B. als `wz_panel1_kueche_copy_nav_12345`), und die Navigation wird automatisch angepasst.

### 2. Navigation in Pages

Wenn eine globale Seite in `pages` (Hauptseiten) verwendet wird, wird die Navigation der globalen Seite berücksichtigt, um fehlende referenzierte Seiten automatisch hinzuzufügen. Danach werden die Navigationsparameter (`prev`, `next`, `home`, `parent`) der eingefügten Seiten **entfernt**, und die Seiten werden in die zirkuläre Navigation der Hauptseiten eingebunden.

**Automatisches Hinzufügen von Seiten**: Wenn eine globale Seite `next` oder `prev` auf eine andere globale Seite verweist, die noch nicht in `pages` enthalten ist, wird diese automatisch hinzugefügt. Dies geschieht nur für `next`-Verweise - bei `prev` wird eine Warnung ausgegeben, da dies die Reihenfolge ändern würde.

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Wohnzimmer',
    // ... weitere Konfiguration
    
    pages: [
        { globalLink: 'main' },           // Wird zur ersten Hauptseite
        { globalLink: 'wohnzimmer' },     // Navigation wird automatisch angepasst
        { globalLink: 'media_wohnzimmer' }, // Navigation wird automatisch angepasst
    ],
    
    subPages: []
};
```

**Wichtig**: Die erste Seite in `pages` sollte den `uniqueName` "main" haben (oder darauf verlinken), da dies als Startseite verwendet wird.

### 3. Navigation in subPages

Wenn eine globale Seite in `subPages` (Unterseiten) verwendet wird, können Sie die Navigation **optional überschreiben**:

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Kueche',
    // ... weitere Konfiguration
    
    pages: [
        { globalLink: 'main' }
    ],
    
    subPages: [
        {
            globalLink: 'wohnzimmer',
            // Überschreibt die Navigation aus dem Global Script
            prev: 'main',
            next: 'kueche_panel2',
            home: 'main'
        },
        {
            globalLink: 'media_wohnzimmer'
            // Keine Navigation angegeben = verwendet die aus dem Global Script
        }
    ]
};
```

**Verhalten bei Navigation in subPages**:
- Wenn **mindestens ein** Navigationsparameter (`prev`, `next`, `home`, oder `parent`) angegeben wird, werden **alle vier** Parameter aus dem Local Script verwendet (auch wenn sie `undefined` sind)
- Wenn **kein** Navigationsparameter angegeben wird, wird die Navigation aus dem Global Script übernommen

### 4. Deep Linking mit uniqueName

Wenn Sie in einem Local Script einen eigenen `uniqueName` für eine globale Seite angeben, der sich vom ursprünglichen `uniqueName` der globalen Seite unterscheidet, aktiviert dies die **Deep Linking**-Funktion:

1. **Automatisches Kopieren**: Die globale Seite wird mit dem neuen `uniqueName` kopiert
2. **Rekursive Navigation**: Alle Seiten, auf die diese Seite verweist, werden ebenfalls kopiert und umbenannt
3. **Isolierte Hierarchie**: Es entsteht eine isolierte Seitenhierarchie, die unabhängig von anderen Verwendungen derselben globalen Seiten ist

**Anwendungsfall**: Nutzen Sie dies, wenn Sie dieselbe globale Seite mehrfach auf einem Panel verwenden möchten, aber mit unterschiedlichen Navigationspfaden.

**Beispiel**:
```typescript
// Global Script: Seite mit Navigation
const details: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'details',
    heading: 'Details',
    next: 'settings',
    items: [...]
};

// Local Script: Mehrfache Verwendung mit Deep Linking
const config: ScriptConfig.Config = {
    pages: [
        { globalLink: 'main' },
        { globalLink: 'details', uniqueName: 'details_variant_a' }, // Erstellt Kopien
        { globalLink: 'details', uniqueName: 'details_variant_b' }  // Separate Kopien
    ],
    subPages: []
};
```

**Konfiguration der Rekursionstiefe**: Sie können die maximale Anzahl der Iterationen mit `maxNavigationAdjustRuns` im Global Script steuern (Standard: 3).

## Praktische Beispiele

### Beispiel 1: Mehrere Panels mit gleichen Seiten

#### Global_Script.ts

```typescript
// Globale Seitendefinitionen
const hauptseite: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'main',
    heading: 'Übersicht',
    next: 'lichter',
    items: [
        { id: 'alias.0.Haus.Temperatur.Aussen' },
        { id: 'alias.0.Haus.Fenster.Offen' },
        { id: 'alias.0.Haus.Tuer.Status' }
    ]
};

const lichterSeite: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'lichter',
    heading: 'Beleuchtung',
    prev: 'main',
    next: 'main',
    items: [
        { id: 'alias.0.Licht.Wohnzimmer' },
        { id: 'alias.0.Licht.Kueche' },
        { id: 'alias.0.Licht.Schlafzimmer' }
    ]
};

const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        hauptseite,
        lichterSeite
    ]
};
```

Nach der Konfiguration das Global Script ausführen, um die Änderungen zu übertragen.

#### Local_Script_Panel1.ts (Wohnzimmer)

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Wohnzimmer',
    // ... weitere Konfiguration
    
    pages: [
        { globalLink: 'main', heading: 'Wohnzimmer' }, // Überschreibt Heading
        { globalLink: 'lichter' }
    ],
    
    subPages: []
};
```

Nach der Konfiguration das Local Script ausführen, um die Änderungen zu übertragen.

#### Local_Script_Panel2.ts (Küche)

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Kueche',
    // ... weitere Konfiguration
    
    pages: [
        { globalLink: 'main', heading: 'Küche' }, // Überschreibt Heading
        { globalLink: 'lichter' }
    ],
    
    subPages: []
};
```

Nach der Konfiguration das Local Script ausführen, um die Änderungen zu übertragen.

### Beispiel 2: Unterschiedliche Seitenauswahl pro Panel

#### Global_Script.ts

```typescript
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        hauptseite,        // uniqueName: 'main'
        wohnzimmer,        // uniqueName: 'wohnzimmer'
        kueche,            // uniqueName: 'kueche'
        schlafzimmer,      // uniqueName: 'schlafzimmer'
        bad,               // uniqueName: 'bad'
        heizung,           // uniqueName: 'heizung'
        media              // uniqueName: 'media'
    ]
};
```

#### Local_Script_Wohnzimmer.ts

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Wohnzimmer',
    
    pages: [
        { globalLink: 'main' },
        { globalLink: 'wohnzimmer' }, // Nur relevante Seiten für Wohnzimmer
        { globalLink: 'media' }
    ],
    
    subPages: [
        { globalLink: 'heizung' } // Als Unterseite
    ]
};
```

#### Local_Script_Kueche.ts

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Kueche',
    
    pages: [
        { globalLink: 'main' },
        { globalLink: 'kueche' }, // Andere Seitenauswahl
        { globalLink: 'wohnzimmer' }
    ],
    
    subPages: []
};
```

### Beispiel 3: Kombination globaler und lokaler Seiten

Sie können globale Seiten mit lokal definierten Seiten kombinieren:

```typescript
// Lokale Seitendefinition nur für dieses Panel
const lokaleSonderseite: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'lokal_spezial',
    heading: 'Panel-spezifisch',
    prev: 'main',
    next: 'wohnzimmer',
    items: [
        { id: 'alias.0.PanelSpezifisch.Sensor1' }
    ]
};

const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_Spezial',
    
    pages: [
        { globalLink: 'main' },         // Globale Seite
        lokaleSonderseite,              // Lokale Seite
        { globalLink: 'wohnzimmer' }    // Globale Seite
    ],
    
    subPages: [
        { globalLink: 'media' },        // Globale Seite
        { globalLink: 'heizung' }       // Globale Seite
    ]
};
```

### Beispiel 4: Deep Linking - Mehrfache Verwendung mit eigenen Namen

Sie können dieselbe globale Seite mehrfach verwenden, indem Sie jeweils einen eigenen `uniqueName` vergeben. Der Adapter erstellt dann automatisch isolierte Kopien mit angepasster Navigation.

#### Global_Script.ts

```typescript
const roomControl: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'room_control',
    heading: 'Raum-Steuerung',
    next: 'room_settings',
    items: [
        { id: 'alias.0.Room.Light' },
        { id: 'alias.0.Room.Temperature' }
    ]
};

const roomSettings: ScriptConfig.PageGrid = {
    type: 'cardGrid',
    uniqueName: 'room_settings',
    heading: 'Raum-Einstellungen',
    prev: 'room_control',
    items: [
        { id: 'alias.0.Room.Config' }
    ]
};

const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [
        roomControl,
        roomSettings
    ],
    maxNavigationAdjustRuns: 5 // Erhöhte Rekursionstiefe für komplexe Hierarchien
};
```

#### Local_Script.ts

```typescript
const config: ScriptConfig.Config = {
    panelTopic: 'NSPanel_MultiRoom',
    
    pages: [
        { globalLink: 'main' },
        
        // Erste Instanz für Wohnzimmer
        { 
            globalLink: 'room_control', 
            uniqueName: 'living_room_control',
            heading: 'Wohnzimmer'
        },
        // Automatisch kopiert: room_settings → living_room_control_room_settings_copy_nav_xxxxx
        
        // Zweite Instanz für Schlafzimmer
        { 
            globalLink: 'room_control', 
            uniqueName: 'bedroom_control',
            heading: 'Schlafzimmer'
        }
        // Automatisch kopiert: room_settings → bedroom_control_room_settings_copy_nav_xxxxx
    ],
    
    subPages: []
};
```

In diesem Beispiel werden zwei isolierte Kopien der `room_control`-Seite mit jeweils eigener Navigation zu den automatisch kopierten `room_settings`-Seiten erstellt.

## Wichtige Hinweise und Best Practices

### Navigation und Reihenfolge

1. **Pages Navigation**: 
   - Die Navigation (`next`, `prev`) aus dem Global Script wird verwendet, um automatisch fehlende referenzierte Seiten zu `pages` hinzuzufügen
   - Bei `next`-Verweisen wird die referenzierte Seite automatisch nach der aktuellen Seite eingefügt
   - Bei `prev`-Verweisen erfolgt eine Warnung, da dies die Reihenfolge zufällig ändern würde
   - Nach dem automatischen Hinzufügen werden die Navigationsparameter entfernt und die Seiten zirkulär verlinkt

2. **SubPages Navigation**: Bei Seiten in `subPages` gilt:
   - Ohne Navigationsparameter: Navigation aus Global Script wird übernommen
   - Mit mindestens einem Navigationsparameter: Alle Navigationsparameter aus Local Script werden verwendet

3. **Beispiel für automatisches Hinzufügen**: Wenn Sie `{ globalLink: 'wohnzimmer' }` in `pages` haben und die globale Seite `wohnzimmer` hat `next: 'kueche'`, wird `kueche` automatisch zu `pages` hinzugefügt, falls noch nicht vorhanden.

### Dokumentation und Nachverfolgung

Für eine bessere Nachverfolgung können Sie Kommentare in Ihrem Global Script verwenden, um Änderungen zu dokumentieren:

```typescript
// Version 1.0 - Initial setup
// Version 1.1 - Added heating page
const globalPagesConfig: ScriptConfig.globalPagesConfig = {
    type: 'globalConfig',
    subPages: [...]
};
```

### Fehlervermeidung

1. **Eindeutige uniqueNames**: Jede Seite im Global Script muss einen eindeutigen `uniqueName` haben.

2. **Hauptseite "main"**: Die erste Seite sollte den `uniqueName` "main" haben oder darauf verlinken.

3. **Global Script zuerst**: Das Global Script muss ausgeführt werden, bevor Local Scripts darauf zugreifen können.

4. **Navigation konsistent halten**: Achten Sie darauf, dass Navigationsverweise auf existierende Seiten zeigen.

5. **Deep Linking Rekursionstiefe**: Bei komplexen Seitenhierarchien können Sie `maxNavigationAdjustRuns` erhöhen, um tiefere Navigationsketten zu unterstützen. Standardwert ist 3.

6. **uniqueName-Überschreibung**: Wenn Sie einen eigenen `uniqueName` vergeben, werden automatisch Kopien erstellt. Nutzen Sie dies bewusst und nur wenn nötig.

### Wartung und Updates

1. **Zentrale Änderungen**: Änderungen im Global Script erfordern nur ein erneutes Ausführen des Global Scripts.

2. **Local Scripts aktualisieren**: Nach Änderungen im Global Script müssen die Local Scripts neu ausgeführt werden

3. **Script-Updates**: Die Type-Definitionen in den Scripts werden bei Updates automatisch aktualisiert, um die Wartungsfreundlichkeit zu gewährleisten.

4. **Panel-spezifische Überschreibungen**: Nutzen Sie `heading` und Navigation-Überschreibungen sparsam, um die Wartbarkeit zu erhalten.

## Fehlerbehebung

### "Global page with uniqueName X not found!"

**Problem**: Das Local Script referenziert eine Seite, die im Global Script nicht existiert.

**Lösung**: 
- Prüfen Sie, ob der `globalLink` dem `uniqueName` im Global Script entspricht
- Stellen Sie sicher, dass das Global Script erfolgreich ausgeführt wurde

### Seite wird nicht angezeigt

**Problem**: Eine referenzierte Seite erscheint nicht auf dem Panel.

**Lösung**:
- Überprüfen Sie, ob die Seite in `pages` oder `subPages` eingetragen ist
- Prüfen Sie die Navigation - ist die Seite über andere Seiten erreichbar?
- Prüfen Sie, ob `hiddenByTrigger` verwendet wird

### Navigation funktioniert nicht wie erwartet

**Problem**: Die Navigation zwischen Seiten verhält sich anders als erwartet.

**Lösung**:
- Bei `pages`: Navigation wird automatisch verwaltet, eigene Navigation wird ignoriert
- Bei `subPages`: Prüfen Sie, ob Sie Navigation überschreiben oder die aus dem Global Script verwenden
- Stellen Sie sicher, dass Navigationsverweise auf existierende Seiten zeigen

## Zusammenfassung

Das Global Pages Feature bietet eine leistungsstarke Möglichkeit zur Wiederverwendung von Seitenkonfigurationen:

- **Global Script**: Definiert einmal alle gemeinsamen Seiten mit `uniqueName`
- **Local Script**: Referenziert Seiten per `globalLink`
- **Flexibilität**: Überschreiben von `heading` und Navigation möglich
- **Deep Linking**: Mehrfache Verwendung derselben Seite mit eigenen `uniqueName` und isolierter Navigation
- **Automatische Navigation**: Fehlende referenzierte Seiten werden automatisch hinzugefügt
- **Wartbarkeit**: Zentrale Änderungen wirken sich auf alle Panels aus
- **Kombinierbar**: Globale und lokale Seiten können gemischt werden

Diese Architektur ermöglicht es, eine konsistente Benutzererfahrung über mehrere NSPanels hinweg zu schaffen, während gleichzeitig panelspezifische Anpassungen und sogar mehrfache Verwendung derselben Seiten mit unterschiedlichen Navigationspfaden möglich bleiben.
