# Standard Pages — Übersicht

Standard Pages sind vorgefertigte Seitentypen des NSPanel-Adapters. Jede Seite hat eine feste Struktur und wird im Konfigurationsskript per Typangabe (`type: 'cardXxx'`) eingebunden. Einige Seiten können zusätzlich oder ausschließlich über die Admin-Oberfläche konfiguriert werden.

Der hinter `type` angegebene String ist der **echte Kartentyp** (`cardGrid`, `cardQR` …); der zugehörige `ScriptConfig.`-Typ (`PageGrid`, `PageQR` …) hat denselben Postfix. Die Zuordnung zeigt auch die Tabelle unter [ScriptConfig → Verfügbare Seitentypen](ScriptConfig#verfügbare-seitentypen).

---

## Verfügbare Seitentypen

| Seite | `type`-String | Beschreibung |
|-------|---------------|-------------|
| [Page Config](PageConfig) | — (Admin-Tab) | Admin-Tab zur Konfiguration von Seiten direkt in der Admin-Oberfläche |
| [Page Menue / Grid](cardGrid) | `cardGrid`, `cardGrid2`, `cardGrid3` | Raster-Seiten mit 6 / 8 (9) / 4 Kacheln |
| [Page QR](cardQR) | `cardQR` | Zeigt einen QR-Code an (z. B. für WLAN-Zugangsdaten) |
| [Page Power](PagePower) | `cardPower` | Leistungs-/Energieflussanzeige (im PageConfig-Tab als Typ **Leistung**) |
| [Page Chart](PageChart) | `cardChart`, `cardLChart` | Balken- bzw. Liniendiagramm (eigener Admin-Tab) |
| [Page Alarm](cardAlarm) | `cardAlarm` | Alarm-/Sicherheitsseite mit Numpad |
| [Page Media](PageMedia) | `cardMedia` | Mediensteuerung (Musik, Lautstärke, Titel) |
| [Page Thermo2](PageThermo2) | `cardThermo2` | Thermostat-Seite für mehrere Heizkreise |
| [Page PopupNotify](PagePopup) | — (`sendTo`-Nachricht) | Benachrichtigungs-Popup, kein Seitentyp — via `setPopupNotification` |
| [Page Trash](cardTrash) | `cardTrash` (Admin) | Abfallkalender; im Admin-PageConfig-Tab erstellt, intern als `cardEntities`/`cardSchedule` |
| [Page Unlock](pageUnlock) | `cardUnlock` | Entsperrseite (PIN-Eingabe) — Dokumentation ausstehend |

### Weitere Seitentypen (ohne eigene Wiki-Seite)

Diese Typen existieren ebenfalls in der `PageType`-Union, haben aber (noch) keine eigene Seite und werden bei [ScriptConfig](ScriptConfig) bzw. [Page Menue / Grid](cardGrid) mitbehandelt:

- `cardEntities` — Listen-Layout (4, im US-Hochformat 5 Einträge)
- `cardSchedule` — Zeitschaltplan (6 Einträge)
- `cardThermo` — klassische Thermostat-Seite mit genau einem Item

---

## Verwandte Seiten

- [ScriptConfig](ScriptConfig) — Seiten im Konfigurationsskript einbinden
- [GlobalPages](GlobalPages) — Globale Seiten (Screensaver, Systemseiten)
