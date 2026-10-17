<img src="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/a268be21-25f2-420a-a53c-0286096d4245" width="30%" height="30%">

# ioBroker-Adapter-Wiki

## SONOFF NSPanel Lovelace UI GUI - NEXT LEVEL

<img src="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/dfb187fd-3a6f-41cb-9da6-26569e186e9b" width="443px" height="310px" >  <img src="https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/assets/102996011/66b54f11-6f22-4b3a-a946-6886a46c79dc" width="443px" height="310px" >  

Diese Doku beschreibt den Adapter **ioBroker.nspanel-lovelace-ui**: eine eigene Oberfläche für das SONOFF NSPanel im Stil der Lovelace UI, vollständig aus dem ioBroker gesteuert. Der Adapter spielt eine eigene Nextion-Firmware (TFT) auf das Display und redet über Tasmota und MQTT mit dem Panel.

Wer den Adapter noch nicht kennt, fängt bei der [Funktionsübersicht](User-NSPanel-Funktionalität) an — dort steht, was das Panel kann und wie die Bedienung gedacht ist.

## Der Weg zum laufenden Panel

| Schritt | Was zu tun ist | Seite |
|---|---|---|
| 1 | **Nur Tasmota** auf das Panel flashen — Berry-Treiber und TFT-Firmware kommen später vom Adapter, nicht von Hand | [NSPanel flashen](NSPanel-flashen) |
| 2 | Adapter installieren und die MQTT-Verbindung einstellen | [Adapterinstallation](Adapter-Installation) |
| 3 | Panel anlegen und **NSPanel-Initialisierung** starten: der Adapter meldet drei Schritte und schiebt dabei die Tasmota-Einstellungen aufs Panel, installiert den **Berry-Treiber** und die **TFT-Firmware** (dauert rund 10 Minuten) | [Adapterinstallation](Adapter-Installation) |
| 4 | Seiten anlegen — im Admin oder im Konfigurationsskript | [Seiten im Admin](PageThermo2-Admin) · [Konfigurationsskript](ScriptConfig) |
| 5 | Bildschirmschoner einrichten | [Screensaver – Admin](Screensaver-Admin) · [Screensaver im Skript](screensaver) |

## Konfiguriert wird im Admin

**Alle Seiten lassen sich im Admin anlegen** — Menüseiten, Thermostat, Energie, Verlaufsdiagramm, QR-Code, Alarm, Papierkorb und der Bildschirmschoner. Der Editor zeichnet das Panel so, wie es später aussieht, und speichert das Ergebnis in der Instanz. Diesen Weg beschreibt die Doku.

Das **Konfigurationsskript** (ein JavaScript im ioBroker) gibt es weiterhin, es ist aber nichts für den Einstieg: gedacht für **erfahrene Nutzer** und für **besondere Konstellationen**, die der Admin nicht abdeckt.

> **Fehlt im Admin eine Einstellung?** Das ist kein Grund, aufs Skript auszuweichen, sondern eine Meldung wert: bitte beim Entwicklerteam als [Issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues) melden.

## Wenn etwas nicht geht

- **Panel-Status und Diagnose:** der Tab *Maintain* in den Instanz-Einstellungen ([Maintain](Maintain)).
- **Datenpunkte und Rollen:** die [Alias-Tabelle](ALIAS) zeigt, welche Rollen eine Karte erwartet.
- **Fragen an die Community:** [ioBroker-Forum](https://forum.iobroker.net/topic/80055/alphatest-nspanel-lovelace-ui-v0-1-1).
- **Fehler und Wünsche:** [GitHub Issues](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues).

> Diese Seiten liegen zweisprachig im Repo: Deutsch unter `doc/de`, Englisch unter `doc/en`. Seiten, die noch entstehen, sind in der Seitenleiste mit *iA* (in Arbeit) oder *(folgt)* gekennzeichnet.
