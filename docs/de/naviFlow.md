# Navigation Flow

> ⚠️ **Beta-Feature.** Dieser Tab befindet sich noch im Beta-Test.

> **Hinweis:** Dieser Tab ist nur im **Expertenmodus** des ioBroker sichtbar und erfordert einen laufenden Adapter.

Der Tab **Navigation Flow** zeigt die Navigationsverbindungen zwischen allen Seiten eines Panels als interaktives Flussdiagramm. Damit lassen sich Navigationspfade visuell prüfen und Fehler in der Konfiguration erkennen — zum Beispiel fehlende Verbindungen oder Sackgassen.

> 🖼️ **Bild fehlt:** Beispiel-Screenshot des Navigation Flow mit mehreren verbundenen Seiten  
> Pfad: `Pictures/naviFlow/naviFlow.png`  
> *Screenshot eines Flussdiagramms mit mind. 4-5 Seiten und sichtbaren Pfeilen einfügen.*

![Navigation Flow](Pictures/naviFlow/naviFlow.png)

---

## Bedienung

1. **Panel auswählen** — Dropdown oben im Tab, wählt das Panel dessen Navigationsstruktur dargestellt werden soll.
2. **Diagramm lesen** — Jede Seite erscheint als Knoten. Pfeile zeigen die Navigationsverbindungen (prev, next, parent, home).
3. **Knoten verschieben** — Die Knoten können per Drag & Drop neu angeordnet werden (nur visuell, keine Auswirkung auf die Konfiguration).
4. **Zoom & Pan** — Mausrad zum Zoomen, Klick & Ziehen auf den Hintergrund zum Verschieben.

---

## Kantenfarben und -stile

Die Pfeile im Diagramm unterscheiden sich je nach Navigationstyp:

| Stil | Bedeutung |
|------|-----------|
| Durchgehende Linie | Direkte Navigation (next / prev) |
| Gestrichelte Linie | Eltern- oder Home-Verbindung (parent / home) |

---

## Verwandte Seiten

- [Navigation Overview](Navigation) — Navigationskonfiguration zentral bearbeiten
- [ScriptConfig](ScriptConfig) — Navigation im Konfigurationsskript definieren
