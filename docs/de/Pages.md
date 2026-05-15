# Standard Pages — Übersicht

Standard Pages sind vorgefertigte Seitentypen des NSPanel-Adapters. Jede Seite hat eine feste Struktur und wird im Konfigurationsskript per Typangabe eingebunden. Einige Seiten können zusätzlich über den Admin-Tab **PageConfig** konfiguriert werden.

Im Konfigurationsskript genügt ein Verweis auf den Seitentyp — alle Einstellungen werden im Adapter gespeichert und müssen nicht im Skript wiederholt werden.

---

## Verfügbare Seitentypen

| Seite | Seitentyp | Beschreibung |
|-------|-----------|-------------|
| [Page Config](PageConfig) | — | Admin-Tab zur Konfiguration von Seiten-Parametern direkt in der Admin-Oberfläche |
| [Page Menue / Grid](cardGrid) | `cardGrid` | Raster-Seite mit bis zu 6 konfigurierbaren Schaltflächen/Entitäten |
| [Page QR](cardQR) | `cardQR` | Zeigt einen QR-Code an (z. B. für WLAN-Zugangsdaten) |
| [Page Power](PagePower) | `PagePower` | Leistungsanzeige für Energie- und Verbrauchsdaten |
| [Page Chart](PageChart) | `PageChart` | Diagramm-Seite zur Visualisierung von Verlaufsdaten |
| [Page Alarm](cardAlarm) | `cardAlarm` | Alarm-Seite für Sicherheitssysteme |
| [Page Media](PageMedia) | `PageMedia` | Mediensteuerung (Musik, Lautstärke, Titel) |
| [Page Thermo2](PageThermo2) | `PageThermo2` | Thermostat-Seite für Heizungssteuerung |
| [Page PopupNotify](PagePopup) | `PagePopup` | Popup-Benachrichtigungsseite |
| [Page Trash](cardTrash) | `cardTrash` | Abfallkalender-Seite |
| [Page Unlock](pageUnlock) | `pageUnlock` | Entsperrseite (PIN-Eingabe) — Dokumentation ausstehend |

---

## Verwandte Seiten

- [ScriptConfig](ScriptConfig) — Seiten im Konfigurationsskript einbinden
- [GlobalPages](GlobalPages) — Globale Seiten (Screensaver, Systemseiten)
