# PanelStatusBadge Komponente

React-Komponente zur Anzeige des Panel-Status als farbiges Badge mit Echtzeit-Updates.

## Features
- Echtzeit-Status-Updates über ioBroker State-Subscriptions
- Farbcodierte Status-Anzeige (grün=online, grau=offline, gelb=flashing, etc.)
- Automatische Übersetzung der Status-Labels
- Konfigurierbare Größe und Darstellung
- Tooltip mit vollständigem Status-Text
- Maximale Breite: 150px (mit Label) oder 24px (nur Icon)

## Props

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `panelId` | string | - | **Erforderlich.** Panel-ID für Status-Abonnement |
| `oContext` | any | - | **Erforderlich.** ioBroker Admin Context (socket, instance) |
| `adapterName` | string | `'nspanel-lovelace-ui'` | Adapter-Name für State-ID |
| `size` | `'small' \| 'medium'` | `'small'` | Chip-Größe |
| `showLabel` | boolean | `true` | Status-Text anzeigen |
| `showIcon` | boolean | `true` | Status-Icon anzeigen |
| `disableTooltip` | boolean | `false` | Tooltip deaktivieren |
| `alive` | boolean | `true` | Adapter-Alive-Status (deaktiviert Badge wenn `false`) |

## Verwendung

```tsx
import { PanelStatusBadge } from './components/PanelStatusBadge';

<PanelStatusBadge
    panelId="panel_wohnzimmer"
    oContext={this.props.oContext}
    size="small"
    showLabel={true}
/>
```

### Nur Icon ohne Label

```tsx
<PanelStatusBadge
    panelId="panel_kueche"
    oContext={this.props.oContext}
    showLabel={false}
    showIcon={true}
/>
```

### Ohne Tooltip

```tsx
<PanelStatusBadge
    panelId="panel_bad"
    oContext={this.props.oContext}
    disableTooltip={true}
/>
```

## Status-Typen

Die Komponente verwendet die zentralen Konfigurationen aus `adminShareConfig.ts`:

| Status | Farbe | Beschreibung |
|--------|-------|--------------|
| **offline** | Grau (`#9E9E9E`) | Panel offline, keine Verbindung zum Adapter |
| **initializing** | Grau (`#9E9E9E`) | Panel-Objekt initialisiert (nur beim Startup) |
| **connecting** | Hellblau (`#03A9F4`) | MQTT-Verbindungsaufbau läuft |
| **connected** | Blau (`#2196F3`) | MQTT verbunden, aber noch kein Online-Status |
| **online** | Grün (`#4CAF50`) | Panel TFT ist online und betriebsbereit |
| **flashing** | Gelb (`#FFC107`) | Firmware-Update läuft |
| **setup** | Orange (`#d99800`) | Panel im Einrichtungsmodus |
| **error** | Rot (`#F44336`) | Fehler aufgetreten (Verbindungsfehler, Flash-Fehler, etc.) |

## State-Subscription

Die Komponente abonniert automatisch den folgenden State:
```
{adapter}.{instance}.panels.{panelId}.status
```

Beispiel:
```
nspanel-lovelace-ui.0.panels.panel_wohnzimmer.status
```

Der State enthält einen numerischen Wert (0-7), der auf den entsprechenden `PanelStatus` gemappt wird.

## Lifecycle

- **componentDidMount**: Abonniert den Status-State und lädt den initialen Wert
- **componentDidUpdate**: Bei Panel-ID-Wechsel erfolgt automatische Re-Subscription (alte Subscription wird entfernt, neue wird erstellt)
- **componentWillUnmount**: Saubere Deregistrierung der State-Subscription

## Zentrale Konfiguration

Alle Status-Konfigurationen sind in `src/lib/types/adminShareConfig.ts` definiert:

- `panelStatusStates`: Mapping von numerischen Werten zu Status-Namen
- `panelStatusColors`: Farbzuordnung für jeden Status
- `panelStatusTranslationKeys`: Übersetzungsschlüssel für jeden Status

Diese zentrale Verwaltung ermöglicht konsistente Status-Anzeigen im gesamten Adapter.

## Technische Details

### Datenfluss
1. Komponente abonniert ioBroker State via `oContext.socket.subscribeState()`
2. Bei State-Änderung wird `onStatusChanged` Callback aufgerufen
3. Numerischer Wert wird zu `PanelStatus` konvertiert
4. Status wird in Component State gespeichert
5. Render erfolgt mit entsprechender Farbe und übersetztem Label

### Performance
- Automatische Cleanup bei Unmount verhindert Memory Leaks
- Effiziente Re-Subscription nur bei Panel-ID-Wechsel
- Minimale Re-Renders durch gezieltes State-Management

### Error Handling
- Bei Subscription-Fehler wird Status auf `offline` gesetzt
- Console-Logging für Debugging (kann in Produktion entfernt werden)
- Fallback auf `offline` bei ungültigen Status-Werten
