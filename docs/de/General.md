# MQTT-Server-Einstellungen

Im Tab **MQTT-Server-Einstellungen** werden die Verbindungsdaten für den MQTT-Broker einmalig konfiguriert. Sobald die Verbindung steht, muss hier nichts mehr geändert werden.

> **Hinweis:** Alle Felder in diesem Tab sind nur bearbeitbar, wenn der Adapter läuft (online). Der Tab selbst ist immer sichtbar, auch wenn MQTT noch nicht konfiguriert ist.

> 🖼️ **Bild fehlt:** Screenshot des gesamten MQTT-Server-Einstellungen-Tabs mit beiden Abschnitten  
> Pfad: `Pictures/general/MQTT-Setting.png`

![MQTT-Server-Einstellungen](Pictures/general/MQTT-Setting.png)

---

## Interner MQTT-Server (Adapter)

| Feld / Element | Typ | Konfig-Schlüssel | Beschreibung |
|----------------|-----|-----------------|--------------|
| **Verwende den eigenen MQTT-Server des Adapters** | Checkbox | `mqttServer` | Aktiviert den im Adapter integrierten MQTT-Broker. **Empfohlen**, da er direkt mit dem Panel kommuniziert und den Datenaustausch optimiert. |
| **Fülle automatisch MQTT-Anmeldeinformationen und Port aus** | Button | — | Generiert automatisch einen freien Port sowie Benutzername und Passwort für den internen MQTT-Server. Nur aktiv, wenn `mqttServer` aktiviert ist und der Adapter läuft. |

> **Empfehlung:** Wir empfehlen den internen MQTT-Server des Adapters zu nutzen. Dieser arbeitet direkt mit dem Panel und optimiert den Datenaustausch.

---

## Externe MQTT-Verbindung

Diese Felder werden nur benötigt, wenn ein **externer MQTT-Server** (z. B. Mosquitto oder der MQTT-Adapter) verwendet wird. Alle Felder sind deaktiviert, wenn der interne Server (`mqttServer`) aktiv ist.

| Feld | Typ | Konfig-Schlüssel | Beschreibung |
|------|-----|-----------------|--------------|
| **IP zum externen MQTT-Server** | Textfeld | `mqttIp` | IP-Adresse des externen Brokers. Beim MQTT-Adapter ist die IP des ioBroker-Hosts einzutragen. |
| **MQTT-Port** | Zahl | `mqttPort` | Port des MQTT-Brokers. Darauf achten, dass der Port nicht bereits von einem anderen Adapter oder Dienst belegt ist. |
| **MQTT-Benutzername** | Textfeld | `mqttUsername` | Benutzername, mit dem sich Tasmota (Panel) beim Broker anmeldet. |
| **MQTT-Passwort** | Passwortfeld | `mqttPassword` | Passwort für den MQTT-Benutzer. Über das Auge-Icon kann das Passwort sichtbar geschaltet werden. |

---

## Tasmota WebUI-Passwort

| Feld | Typ | Konfig-Schlüssel | Beschreibung |
|------|-----|-----------------|--------------|
| **Tasmota WebUI-Passwort verwenden** | Checkbox | `useTasmotaAdmin` | Aktiviert die Nutzung eines Passworts für die Tasmota-Weboberfläche. |
| **Tasmota Webui Passwort** | Passwortfeld | `tasmotaAdminPassword` | Das Passwort der Tasmota-Weboberfläche. Wird nur angezeigt, wenn `useTasmotaAdmin` aktiviert ist. Wird für Updates und API-Zugriffe benötigt, wenn die WebUI passwortgeschützt ist. |

---

## Wichtige Hinweise

> ⚠️ **Panel war zuvor mit einem anderen Host verbunden:** In der Tasmota-Konsole `reset 4` eingeben, damit die alte Verbindung vergessen wird, bevor das Panel neu initialisiert wird.

> ⚠️ **ioBroker-Backup eingespielt:** Nach dem Einspielen eines Backups müssen alle Panels aus der Adapter-Konfiguration gelöscht und neu angelegt werden. Die TLS-Zertifikate werden beim Einspielen nicht übernommen und müssen neu erstellt werden.

---

## Verwandte Seiten

- [NSPanel-Einstellungen](NSPanelsetting) — Panel initialisieren und verwalten
- [Adapter-Installation](Adapter-Installation) — Schritt-für-Schritt-Anleitung zur Ersteinrichtung
