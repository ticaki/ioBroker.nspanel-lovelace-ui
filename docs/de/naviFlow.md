# Navigation Flow

Der Tab **Navigation Flow** visualisiert die gesamte Navigationsstruktur eines Panels als interaktives Flussdiagramm. Jede konfigurierte Seite erscheint als Knoten, Verbindungspfeile zeigen alle Navigationspfade. Damit lassen sich Konfigurationsfehler (fehlende Verbindungen, Sackgassen) auf einen Blick erkennen.

> **Hinweis:** Erfordert einen laufenden Adapter. Der Adapter-Status (online/offline) wird direkt im Tab angezeigt.

> 🖼️ **Bild fehlt:** Screenshot des Navigation Flow mit mehreren verbundenen Seiten, sichtbarer Legende und geöffnetem Info-Panel  
> Pfad: `Pictures/naviFlow/naviFlow.png`

![Navigation Flow](Pictures/naviFlow/naviFlow.png)

---

## Bedienelemente

| Element | Funktion |
|---------|---------|
| **Panel-Auswahl** (Dropdown) | Wechselt zwischen den konfigurierten Panels; bei Panelwechsel werden ungespeicherte Positionsänderungen automatisch gespeichert |
| **Aktualisieren** | Lädt die Navigationsdaten neu vom Adapter |
| **Auto-Layout** | Berechnet die Knotenpositionen automatisch neu (nach Bestätigung) |
| **Systemseiten anzeigen** | Checkbox — blendet interne Systemseiten (IDs beginnen mit `///`) ein oder aus; `///unlock` wird immer angezeigt |

---

## Kantentypen und Legende

Jeder Pfeiltyp hat eine eigene Farbe und einen eigenen Linienstil. Die Legende wird oberhalb des Diagramms eingeblendet.

| Typ | Farbe | Stil | Bedeutung |
|-----|-------|------|-----------|
| `prev` | lila-blau `#6676d2` | durchgehend | Vorherige Seite (Wischen rechts / Zurück-Button) |
| `next` | cyan `#19c3d2` | durchgehend | Nächste Seite (Wischen links / Weiter-Button) |
| `home` | gelb `#fbc02d` | gestrichelt (lang) | Sprung zur Startseite |
| `parent` | rot `#d32f2f` | durchgehend | Elternseite in der Hierarchie |
| `target` | grün `#43a047` | gestrichelt (kurz) | Direktsprung via `targetPage` im Skript |

Pfeile entstehen nur zwischen Seiten die tatsächlich in der Navigationskonfiguration verknüpft sind. Seiten ohne Verbindungen erscheinen als isolierte Knoten.

---

## Knoten verschieben und Info-Panel

- **Knoten verschieben:** Knoten können per Drag & Drop frei positioniert werden. Die Positionen werden gespeichert und beim nächsten Öffnen wiederhergestellt.
- **Knoten anklicken:** Öffnet ein Info-Panel rechts im Diagramm mit den Detailinformationen der Seite (Seitentyp, konfigurierte Parameter).
- **Hintergrund anklicken:** Schließt das Info-Panel.

---

## Automatisches Speichern

Positionsänderungen werden automatisch gespeichert:
- **Alle 10 Sekunden** wenn es ungespeicherte Änderungen gibt
- **Beim Wechsel des Browser-Tabs** oder Minimieren des Fensters
- **Beim Schließen des Tabs** (über die Beacon-API)

---

## Auto-Layout

Der **Auto-Layout**-Button berechnet alle Knotenpositionen automatisch neu. Die Berechnung folgt einem Baum-Algorithmus:

1. Die Seite mit der ID `main` (oder die erste Seite) wird als Wurzelknoten gewählt
2. Der `prev`/`next`-Kette folgend wird der Hauptstamm (Hauptnavigationslinie) aufgebaut
3. Seiten die über `targetPages` verknüpft sind werden als untergeordnete Äste angehängt
4. Verbleibende Seiten werden über `parent`-Verweise oder den nächsten Stammknoten eingehängt
5. Die finale Positionierung erfolgt mit dem **d3-hierarchy tree-Algorithmus** (horizontales Baumdiagramm von links nach rechts)

> ⚠️ Nach dem Auto-Layout werden alle manuell gesetzten Positionen überschrieben. Das Auto-Layout fragt vor der Ausführung eine Bestätigung ab.

---

## Zoom und Navigation im Diagramm

| Aktion | Funktion |
|--------|---------|
| Mausrad | Zoomen |
| Klick & Ziehen auf Hintergrund | Diagramm verschieben (Pan) |
| Touch-Geräte | Pfeile zeigen Tooltips bei Antippen; Zoom per Pinch-Geste |

---

## Verwandte Seiten

- [Navigation Overview](Navigation) — Navigationskonfiguration tabellarisch bearbeiten
- [ScriptConfig](ScriptConfig) — Navigation im Konfigurationsskript definieren (`prev`, `next`, `parent`, `home`, `targetPage`)
