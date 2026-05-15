# Navigation Overview

> ⚠️ **Diese Seite und der zugehörige Admin-Tab befinden sich in aktiver Überarbeitung.** Sowohl die Dokumentation als auch die Implementierung im Adapter sind noch nicht abgeschlossen. Die beschriebene Funktionalität kann sich ändern.

Der Tab **Navigation Overview** ermöglicht es, die Seitennavigation aller Pages eines Panels zentral über die Admin-Oberfläche zu verwalten — als Alternative zur Navigation die direkt im Konfigurationsskript definiert wird.

> **Hinweis:** Dieser Tab wird erst angezeigt, wenn MQTT vollständig konfiguriert ist und mindestens ein Panel angelegt wurde.

> 🖼️ **Bild fehlt:** Gesamtansicht des Navigation Overview Tabs mit befüllter Tabelle  
> Pfad: `Pictures/navigation/navigation-overview-tab.png`  
> *Screenshot des Tabs mit einem konfigurierten Panel und mehreren Navigationseinträgen einfügen.*

![Navigation Overview Tab](Pictures/navigation/navigation-overview-tab.png)

---

## Funktionsweise

Die Navigation Overview speichert für jede Seite (`navId`) eine Zuordnung zu vier Navigationspositionen:

| Position | Feld | Bedeutung |
|----------|------|-----------|
| Links oben / Zurück | `left1` (prev) | Vorherige Seite — wird beim Wischen nach rechts oder über den Zurück-Button erreicht |
| Links unten | `left2` (parent) | Elternseite — übergeordnete Seite in der Hierarchie |
| Rechts oben / Weiter | `right1` (next) | Nächste Seite — wird beim Wischen nach links oder über den Weiter-Button erreicht |
| Rechts unten | `right2` (home) | Startseite — Sprung zur Startseite des Panels |

Wenn `prev`/`next` konfiguriert sind, werden Seiten automatisch in die Navigationsreihenfolge eingefügt: Zeigt `next` einer Seite A auf Seite B und Seite B hat bereits ein `prev`, wird Seite A dazwischen eingefügt. Bei Konflikten hat `prev` Vorrang.

> Seiten ohne `next` und `prev` können nur über `{ navigate: 'true', targetPage: 'seitenname' }` im Skript erreicht werden.

---

## Bedienelemente

### Panel auswählen

Wählt das Panel aus, dessen Navigation bearbeitet werden soll. Die Auswahl bestimmt welche Seiten in der Tabelle und im Dropdown erscheinen.

---

### Navigation aktivieren

| Konfig-Key | `_useNavigation` |
|------------|-----------------|
| Typ | Checkbox |
| Standard | `false` |

Aktiviert die zentrale Navigationssteuerung über die Admin-Übersicht für das ausgewählte Panel. Wenn deaktiviert, verwendet der Adapter die Navigation aus dem Konfigurationsskript.

---

### Aktionsbuttons

| Button | Funktion |
|--------|---------|
| **Laden** | Lädt die aktuell gespeicherte Navigationskonfiguration des ausgewählten Panels in die Tabelle |
| **Speichern** | Übernimmt die Tabelle als neue Navigationskonfiguration für das ausgewählte Panel |
| **Leeren** | Löscht die gespeicherte Navigationskonfiguration des Panels |

> ⚠️ **Wichtig:** Nach einer Änderung der Navigation-IDs (`navId`) muss kurz zu einem anderen Tab gewechselt und dann zurückgekehrt werden, damit die Änderungen korrekt übernommen werden.

---

### Konfigurationsquelle

Das Feld **Konfig-Quelle** (schreibgeschützt) zeigt an, woher die aktuell aktive Navigationskonfiguration des Panels stammt (Skript oder Admin-Übersicht).

---

## Navigationstabelle

Die Tabelle enthält eine Zeile pro Seite des ausgewählten Panels.

| Spalte | Beschreibung | Pflichtfeld |
|--------|-------------|-------------|
| **navId** | Eindeutiger Name der Seite — entspricht dem `uniqueName` im Skript | ja |
| **uniqueID** | Interne Panel-Seiten-ID (wird aus dem Panel geladen) | ja |
| **prev** | Vorherige Seite (linke Navigation) | mind. eines von prev/parent/next/home |
| **parent** | Elternseite | mind. eines von prev/parent/next/home |
| **next** | Nächste Seite (rechte Navigation) | mind. eines von prev/parent/next/home |
| **home** | Startseite / Home-Sprung | mind. eines von prev/parent/next/home |

Die Tabelle unterstützt **Export und Import** (CSV/JSON) über die eingebauten Tabellenbuttons.

> **Validierung:** Der Speichern-Button ist deaktiviert, solange Zeilen mit fehlenden Pflichtfeldern vorhanden sind oder keine Navigationsziele (`prev`/`parent`/`next`/`home`) gesetzt wurden.

---

## Verwandte Seiten

- [Navigation Flow](naviFlow) — Visuelle Darstellung der Navigationsstruktur
- [ScriptConfig](ScriptConfig) — Navigation im Konfigurationsskript definieren
