# NSPanel-Einstellungen

Im Tab **NSPanel-Einstellungen** werden neue Panels initialisiert und bestehende Panels verwaltet. Die Initialisierung überträgt alle MQTT-Verbindungsdaten an das Panel, installiert den Berry-Treiber und die TFT-Firmware — weitere manuelle Einstellungen am Panel sind danach nicht mehr erforderlich.

> **Hinweis:** Dieser Tab ist nur sichtbar, wenn MQTT vollständig konfiguriert ist (`mqttServer` aktiv oder alle manuellen MQTT-Felder ausgefüllt). Alle Aktionen erfordern einen laufenden Adapter.

> 🖼️ **Bild fehlt:** Screenshot des NSPanel-Einstellungen-Tabs mit ausgefülltem Initialisierungsformular und einer Panel-Karte darunter  
> Pfad: `Pictures/nspanelSettings/Nspanelsettings.png`

![NSPanel-Einstellungen](Pictures/nspanelSettings/Nspanelsettings.png)

---

## Initialisierungsformular

Das Formular dient sowohl zur Ersteinrichtung als auch zum Aktualisieren bestehender Panels. Die Umrandung des Formulars blinkt blau, wenn die Daten eines vorhandenen Panels per Bearbeitungs-Button geladen wurden.

| Feld | Konfig-Schlüssel | Beschreibung |
|------|-----------------|--------------|
| **IP von ioBroker** | `internalServerIp` | IP-Adresse des ioBroker-Hosts — nur sichtbar, wenn der interne MQTT-Server des Adapters verwendet wird. Keine Localhost-Adresse (`127.0.0.1`) erlaubt. |
| **IP des Panel** | `_tasmotaIP` | IPv4-Adresse des NSPanels im lokalen Netzwerk. Es wird empfohlen, eine feste IP im Router zu vergeben. |
| **Panelname (eindeutig)** | `_tasmotaName` | Eindeutiger Name für dieses Panel im Adapter. |
| **MQTT-Topic (eindeutig)** | `_tasmotaTopic` | MQTT-Topic, unter dem das Panel kommuniziert. Mindestens 4 Zeichen, beginnt mit einem Buchstaben, gefolgt von Buchstaben, Ziffern, Unterstrichen oder Schrägstrichen. |
| **Nspanel Hardwaremodell** | `_nsPanelModel` | Hardwaremodell des Panels: `EU-Querformat` (Standard), `US-Querformat` oder `US-Hochformat`. |
| **Zeitzone** | `timezone` | Zeitzone des Panels. Wird beim Öffnen des Dropdowns von der Liste der Tasmota-Zeitzonen geladen. |

> **Initialisierungsschaltfläche:** Der Button wechselt zwischen **„Nspanel-Initialisierung"** (neues Panel) und **„NSPanelkonfiguration aktualisieren"** (bestehendes Panel mit gleichem Topic), abhängig davon, ob das eingegebene Topic bereits in der Konfiguration vorhanden ist.

---

## Initialisierungsvorgang

Nach Bestätigung des Dialogs sendet der Adapter MQTT-Daten und Tasmota-Einstellungen an das Panel und führt folgende Schritte aus:

1. MQTT-Verbindungsdaten übertragen
2. Berry-Treiber installieren
3. TFT-Firmware (NSPanel-Firmware) installieren

> ⚠️ **Dauer:** Die Initialisierung dauert ca. 10 Minuten. Das Panel ist in dieser Zeit nicht erreichbar.

Nach Abschluss erscheint ein Erfolgs-Dialog — Bestätigen und Speichern erstellt die Panel-Konfiguration im Adapter.

---

## Panel-Karten (vorhandene Panels)

Unterhalb des Formulars wird jedes bereits konfigurierte Panel als Karte angezeigt.

> 🖼️ **Bild fehlt:** Screenshot einer Panel-Karte mit Status, Buttons und Infos  
> Pfad: `Pictures/nspanelSettings/panelCard.png`

![Panel-Karte](Pictures/nspanelSettings/panelCard.png)

| Element | Beschreibung |
|---------|-------------|
| **Panelname** | Name des Panels als Überschrift |
| **Status-Badge** | Online-/Offline-Status des Panels in Echtzeit |
| **Bearbeiten** (Bleistift-Icon) | Lädt die Panel-Daten in das Initialisierungsformular; Formularrahmen blinkt blau zur Bestätigung |
| **Löschen** (Papierkorb-Icon) | Entfernt das Panel nach Bestätigung aus der Adapter-Konfiguration |
| **MAC Adresse des Panels** | Eindeutige Hardware-ID des Panels (schreibgeschützt) |
| **IP des Panel** | Aktuell gespeicherte IP-Adresse (schreibgeschützt) |
| **MQTT-Topic** | Gespeichertes MQTT-Topic (schreibgeschützt) |
| **Nspanel Hardwaremodell** | Gespeichertes Modell (schreibgeschützt) |
| **Tasmota-Konsole öffnen** | Öffnet die Tasmota-Konsole (`http://<panel-ip>:80/cs?`) in einem neuen Fenster |

---

## Verwandte Seiten

- [MQTT-Server-Einstellungen](General) — MQTT-Verbindung konfigurieren
- [Maintain](Maintain) — Updates für Tasmota, TFT und Skript
- [Adapter-Installation](Adapter-Installation) — Schritt-für-Schritt-Anleitung zur Ersteinrichtung
