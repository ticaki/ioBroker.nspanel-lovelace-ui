# Adapterinstallation und Inbetriebnahme des Panels

Von Hand geflasht wird **nur Tasmota**. Alles weitere erledigt der Adapter: Er schiebt die MQTT- und Tasmota-Einstellungen auf das Panel, installiert den **Berry-Treiber** und spielt die **TFT-Firmware** auf das Display. Dafür muss das Panel nur über MQTT erreichbar sein und selbst ins Internet kommen.

Inhalt:
- [1. Voraussetzungen](#1-voraussetzungen)
- [2. MQTT-Verbindung einstellen](#2-mqtt-verbindung-einstellen)
- [3. Panel anlegen und initialisieren](#3-panel-anlegen-und-initialisieren)
- [4. Was die Initialisierung tut](#4-was-die-initialisierung-tut)
- [5. Nach der Initialisierung](#5-nach-der-initialisierung)
- [6. Wenn es klemmt](#6-wenn-es-klemmt)

## 1. Voraussetzungen

- **Tasmota** läuft auf dem Panel ([NSPanel flashen](NSPanel-flashen)). Berry-Treiber und TFT-Firmware **nicht** von Hand aufspielen.
- Das Panel hat eine **feste IP** (im Router reservieren) und **Internetzugang** — es lädt den Berry-Treiber und die TFT-Datei selbst herunter.
- Ein **MQTT-Broker** ist erreichbar: entweder der eingebaute Server des Adapters oder ein externer (Mosquitto, MQTT-Adapter).
- Der Adapter ist installiert und eine Instanz angelegt.

> ⚠️ **War das Panel schon einmal mit einem anderen Host verbunden?** Dann auf der Tasmota-Konsole einmal `reset 4` ausführen, damit die alte Verbindung vergessen wird.
> **Nach dem Einspielen eines ioBroker-Backups** die Panels aus der Konfiguration löschen und neu anlegen — die TLS-Zertifikate werden dabei neu erzeugt, sonst scheitert die Kopplung.

## 2. MQTT-Verbindung einstellen

Instanz-Einstellungen → Tab **MQTT-Server Einstellungen**.

<img alt="MQTT-Server Einstellungen" src="../Pictures/Installation/install-01-mqtt-server.png" width="100%"/>

- **Eigener MQTT-Server des Adapters** (empfohlen): Haken setzen und auf **Fülle automatisch MQTT-Anmeldeinformationen und Port aus** klicken. Der Adapter sucht einen freien Port, damit es keinen Streit mit anderen Adaptern gibt (Shelly, Sonoff …). Bei der späteren Initialisierung werden **alle** MQTT-Einstellungen im Tasmota überschrieben und auf diesen Server gezogen.
- **Externer Broker** (Mosquitto oder MQTT-Adapter): die vier Felder selbst ausfüllen.
  - *IP zum externen MQTT-Server* — beim MQTT-Adapter die IP des ioBroker-Hosts.
  - *MQTT-Port* — der Port, auf dem der externe Broker lauscht: bei Mosquitto in der Regel 1883, beim MQTT-Adapter der dort eingestellte Port.
  - *MQTT-Benutzername* und *MQTT-Passwort* — damit meldet sich das Panel am Broker an.
- **Tasmota WebUI-Passwort verwenden**: nur nötig, wenn die Weboberfläche des Panels durch ein Passwort geschützt ist. Der Adapter braucht diesen Zugang, um den Berry-Treiber zu installieren.

Danach **speichern** und auf den Tab *Nspanel-Einstellungen* wechseln.

## 3. Panel anlegen und initialisieren

Instanz-Einstellungen → Tab **Nspanel-Einstellungen**.

<img alt="Nspanel-Einstellungen mit dem Bereich Nspanel-Initialisierung" src="../Pictures/Installation/install-02-nspanel-einstellungen.png" width="100%"/>

Im Bereich **Nspanel-Initialisierung** ausfüllen:

| Feld | Bedeutung |
|---|---|
| *IP von ioBroker* | erscheint **nur**, wenn der eingebaute MQTT-Server genutzt wird: die Adresse, unter der das Panel den ioBroker erreicht |
| *IP des Panel* | die feste IP des Panels im Netz |
| *Panelname (eindeutig)* | frei wählbar, taucht später als Name des Skripts und der Datenpunkte auf |
| *MQTT-Topic (eindeutig)* | das Topic, unter dem das Panel sendet und lauscht |
| *Nspanel Hardwaremodel* | EU-Querformat, US-Hochformat oder US-Querformat |
| *Zeitzone* | Zeitzone des Panels |

Dann den Knopf **Nspanel-Initialisierung** drücken und die Rückfrage bestätigen. ⚠️ **Am Ende erscheint ein Dialog mit „Speichern" und „Stornieren" — erst „Speichern" übernimmt das Panel in die Konfiguration.** Danach erscheint es als Karte in der Liste darunter — mit Verbindungsstatus, MAC-Adresse, IP, Topic und Modell, dazu ein Stift zum Bearbeiten, ein Papierkorb zum Löschen und **Tasmota-Konsole öffnen** für den direkten Sprung in die Weboberfläche des Panels.

## 4. Was die Initialisierung tut

Der Admin meldet den Fortschritt in **drei Schritten**, der ganze Durchlauf dauert **rund zehn Minuten** — das meiste davon entfällt auf die TFT-Firmware.

| Meldung | Was dahinter passiert |
|---|---|
| **Schritt 1 von 3 erledigt: MQTT-Zugang übertragen, das Panel ist neu gestartet** | Der Adapter schreibt die MQTT-Zugangsdaten in das Tasmota und startet es neu. |
| **Schritt 2 von 3 erledigt: Grundeinstellungen und Zeitzone übertragen** | Die übrigen Tasmota-Optionen und die gewählte Zeitzone gehen auf das Panel. |
| **Panel wurde erfolgreich initialisiert** (Schritt 3) | Der lange Schritt: Versionsliste holen, **Internetzugang des Panels prüfen** (es muss `raw.githubusercontent.com` erreichen), **Berry-Treiber installieren** (die vorhandene `autoexec.be` wird als `autoexec.old` gesichert, Tasmota lädt die passende Version per `UrlFetch` selbst herunter, danach Neustart), **TFT-Firmware aufspielen** (`FlashNextionAdv0` mit der zum Modell passenden `.tft`-Datei), **Skripte anlegen und starten**, Panel aktivieren. |

Im **Log** der Instanz lässt sich jeder Teilschritt mitlesen. Ist alles durch, zeigt das Panel den Bildschirmschoner.

## 5. Nach der Initialisierung

- Im Tab **Maintain** steht je Panel die installierte **Tasmota-Version**, die **TFT-Version** und die **Skriptversion**, jeweils mit einem Knopf zum Aktualisieren; *Skripte für alle Panels aktualisieren* macht das in einem Rutsch. Diese Knöpfe sind auch der Weg, den Berry-Treiber oder die TFT-Firmware später neu aufzuspielen.
- Seiten anlegen — **im Admin** ([Standard Pages](Pages)). Alle Seitentypen haben dort einen Editor.
- Den Bildschirmschoner einrichten: [Screensaver – Admin](Screensaver-Admin).
- Das [Konfigurationsskript](ScriptConfig) ist nur für **erfahrene Nutzer in besonderen Konstellationen** nötig; als Einstiegsbeispiel gibt es [example_sendTo_script_iobroker.ts](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/script/example_sendTo_script_iobroker.ts).
- **Fehlt im Admin eine Einstellung, bitte beim Entwicklerteam melden** ([Issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues)).

## 6. Wenn es klemmt

| Symptom | Ursache und Abhilfe |
|---|---|
| Panel verbindet sich nicht mit dem Broker | Das Panel hing vorher an einem anderen Host → `reset 4` auf der Tasmota-Konsole, danach neu initialisieren. |
| Nach einem ioBroker-Backup bleibt die Verbindung aus | Panels aus der Konfiguration löschen und neu anlegen (TLS-Zertifikate werden neu erzeugt). |
| Die Installation bleibt beim Berry-Treiber stehen | Das Panel kommt nicht ins Internet (DNS, Firewall, Gast-WLAN) — der Adapter prüft das vorher mit einem Ping auf `raw.githubusercontent.com`. |
| Meldung *Keine Download-Bestätigung von Tasmota nach der Berry-Installation erhalten* | Tasmota hat die Datei nicht geholt — Internetzugang und, bei geschütztem WebUI, das hinterlegte Passwort prüfen, dann Schritt 3 wiederholen. |
| Meldung *TFT-Firmware-Version konnte nicht online ermittelt werden* | Der **Adapter** selbst kommt nicht an die Versionsliste (Internet oder Proxy auf dem ioBroker-Host). |
| Der Adapter kommt nicht an die Tasmota-Oberfläche | Im Tab *MQTT-Server Einstellungen* **Tasmota WebUI-Passwort verwenden** einschalten und das Passwort hinterlegen. |
| TFT-Firmware soll eine Testversion sein | Im Tab *Global Settings* gibt es den Schalter für die **Beta-TFT**. Nur für Tests, im Normalbetrieb aus lassen. |
| Versionen im Tab *Maintain* bleiben auf `???` | Das Panel antwortet nicht über MQTT — Verbindung, Topic und Stromversorgung prüfen. Nach einem Adapterstart dauert es einen Moment, bis die Werte da sind. |
| Ein Panel soll ganz weg | Papierkorb auf der Panel-Karte entfernt den Eintrag aus der Konfiguration. Das Gerät selbst behält seine Tasmota-Einstellungen — soll es wirklich leer sein, hilft nur der Werksreset aus den *tasmotaTools* (Expertenmodus). |

Bei Fragen: [ioBroker-Forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui-v0-1-1) oder [GitHub Issues](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues).
