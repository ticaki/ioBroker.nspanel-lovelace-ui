# Maintain

Der Tab **Maintain** zeigt alle konfigurierten Panels mit ihren aktuellen Versions-Informationen und ermöglicht Updates für Tasmota, TFT-Firmware und das Konfigurationsskript.

> **Hinweis:** Dieser Tab ist nur sichtbar, wenn MQTT vollständig konfiguriert ist und mindestens ein Panel vorhanden ist. Alle Aktionen erfordern einen laufenden Adapter.

> 🖼️ **Bild fehlt:** Screenshot des Maintain-Tabs mit mehreren Panel-Karten, davon eine mit Update-Markierung (orange)  
> Pfad: `Pictures/maintain/maintainAllg.png`

![Maintain](Pictures/maintain/maintainAllg.png)

---

## Kopfzeile

| Element | Beschreibung |
|---------|-------------|
| **Beta-Warnung** | Gelbes Banner: „Beta-Version in Verwendung" — erscheint, wenn in den [Global Settings](globelSettings) die Beta-TFT-Version aktiviert ist (`useBetaTFT`). |
| **Hilfe zur Adapterinstallation** | Roter Link zur Wiki-Installationsseite. |
| **Skripte für alle Panels aktualisieren** | Aktualisiert in einem Durchgang die Konfigurationsskripte aller Panels, für die ein Script-Update verfügbar ist. Der Button ist orange hervorgehoben, wenn Updates vorhanden sind, und nur aktiv, wenn der Adapter läuft. |

---

## Panel-Karten

Jedes konfigurierte Panel wird als eigene Karte dargestellt.

**Kartenfarbe:**
- **Orange** — mindestens eine Komponente (Tasmota, TFT oder Skript) hat ein Update verfügbar
- **Gelb** — TFT-Firmware wird gerade eingespielt (Flashing läuft)
- **Transparent** — alle Versionen sind aktuell

### Karteninhalt

| Element | Beschreibung |
|---------|-------------|
| **Panelname** | Anzeigename des Panels |
| **Status-Badge** | Online-/Offline-Status in Echtzeit (abonniert `panels.<id>.info.isOnline`) |
| **Panel aktiv** | Schalter (Toggle) zum Aktivieren/Deaktivieren des Panels. Schreibt `panels.<id>.cmd.activated` im ioBroker-Objektbaum. |
| **Tasmota-Version** | Aktuell installierte Tasmota-Version (schreibgeschützt). Update-Button ist **hellblau** hervorgehoben, wenn ein Update verfügbar ist. |
| **TASMOTA UPDATE** | Startet nach Bestätigung ein Tasmota-OTA-Update via MQTT. |
| **TFT-Version** | Aktuell installierte TFT-Firmware-Version (schreibgeschützt). Update-Button ist **hellblau** hervorgehoben, wenn ein Update verfügbar ist. |
| **TFT UPDATE** | Startet nach Bestätigung die Installation der TFT-Firmware. Sendet den Update-Befehl per MQTT an das Panel. |
| **Skriptversion** | Version des auf dem Panel installierten Konfigurationsskripts (schreibgeschützt). Update-Button ist **hellblau** hervorgehoben, wenn ein Update verfügbar ist. |
| **SCRIPT UPDATE** | Erstellt das Konfigurationsskript für dieses Panel neu und überträgt es. |
| **Tasmota-Konsole öffnen** | Öffnet die Tasmota-Konsole des Panels (`http://<ip>:80/cs?`) in einem neuen Browser-Fenster. |

### Voraussetzungen für Update-Buttons

Die Update-Schaltflächen sind nur aktiv, wenn:
- Der Adapter läuft (online)
- Das Panel online ist und kein Flashing läuft
- IP-Adresse und MQTT-Topic des Panels gültig sind
- MQTT-Port, Benutzername und Passwort konfiguriert sind
- Bei internem MQTT-Server: eine gültige `internalServerIp` konfiguriert ist (nicht `127.0.0.1`)

---

## Verwandte Seiten

- [NSPanel-Einstellungen](NSPanelsetting) — Panels hinzufügen und initialisieren
- [Global Settings](globelSettings) — Beta-TFT-Version aktivieren
- [Adapter-Installation](Adapter-Installation) — Installationsanleitung
