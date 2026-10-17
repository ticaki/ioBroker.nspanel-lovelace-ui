# Funktionsübersicht

Diese Seite gibt einen Überblick, was der Adapter kann, bevor es an die einzelnen Konfigurationsseiten geht. Sie ist für alle gedacht, die abschätzen wollen, ob das NSPanel ihre Anwendungsfälle abdeckt.

Inhalt:
- [1. Das NSPanel als Gerät](#1-das-nspanel-als-gerät)
- [2. Was der Adapter daraus macht](#2-was-der-adapter-daraus-macht)
- [3. Bedienkonzept](#3-bedienkonzept)
- [4. Seitentypen](#4-seitentypen)
- [5. Popups](#5-popups)
- [6. Bildschirmschoner](#6-bildschirmschoner)
- [7. Zwei Wege der Konfiguration](#7-zwei-wege-der-konfiguration)
- [8. Hardware-Tasten, Relais und Summer](#8-hardware-tasten-relais-und-summer)
- [9. Was man dafür braucht](#9-was-man-dafür-braucht)

## 1. Das NSPanel als Gerät

Das SONOFF NSPanel ist ein Wandschalter mit

- zwei physischen Relais,
- einem 3,5-Zoll-Touchscreen,
- Sensoren für Temperatur und Helligkeit.

Ab Werk arbeitet es mit der eWeLink-App. Mit alternativer Firmware lässt es sich deutlich weitergehend in den ioBroker einbinden — genau dort setzt dieser Adapter an.

## 2. Was der Adapter daraus macht

Der Adapter spielt eine eigene Nextion-Firmware (TFT) auf das Display und steuert die Anzeige vollständig aus dem ioBroker. Die Verbindung läuft über **Tasmota** auf dem ESP des Panels und einen **MQTT-Broker**.

Auf dem Display lassen sich damit

- Karten im Lovelace-Stil mit Geräten und Sensoren zeigen,
- Messwerte darstellen (Temperatur, Luftfeuchte, Verbräuche),
- Licht, Rollläden, Thermostate und andere Geräte bedienen,
- Szenen und Automatisierungen auslösen,
- ein Bildschirmschoner mit Uhrzeit, Datum und Wetter anzeigen.

## 3. Bedienkonzept

Das Panel zeigt immer **eine** Seite. Gewechselt wird über Navigationspfeile, durch Antippen von Fliesen und über die beiden Hardware-Tasten; für die Detailbedienung (Helligkeit, Farbe, Lüfterstufe) öffnen sich **Popups**. Aus dem Ruhezustand — dem Bildschirmschoner — führt ein Antippen zurück auf die erste Seite.

Wie Seiten miteinander verbunden sind, steht unter *Navigation (Seite folgt)*; die Belegung der Hardware-Tasten im [Konfigurationsskript](ScriptConfig).

## 4. Seitentypen

Der Adapter bringt mehrere Kartentypen mit. Welche Seite man im Admin anlegen kann und welche im Skript entsteht, steht unter [Standard Pages](Pages).

| Kartentyp | Zweck |
|---|---|
| `cardEntities` | Liste von Bedienelementen und Werten |
| `cardGrid`, `cardGrid2`, `cardGrid3` | Fliesenübersicht mit Geräten und Unterseiten, in drei Dichten |
| `cardThermo`, `cardThermo2` | Heizung und Klima; `cardThermo2` beherrscht bis zu acht Heizkreise |
| `cardMedia` | Steuerung von Medienspielern |
| `cardPower` | Energiefluss mit Quellen und Verbrauchern |
| `cardChart`, `cardLChart` | Verlaufsdiagramme aus der History |
| `cardAlarm` | Alarmanlage mit PIN und Zustandswechsel |
| `cardQR` | WLAN-Zugang als QR-Code |
| `cardUnlock` | Seiten gegen unbeabsichtigtes Bedienen sperren |
| `cardSchedule` | Zeitpläne |
| `cardTrash` | Abfuhrtermine |

Zwei Karten sind laut Projekt-README noch in Arbeit: `cardLChart2` und das Farbwahl-Popup `popupColor`.

## 5. Popups

Popups öffnen sich aus einer Seite heraus und bedienen ein einzelnes Gerät im Detail: `popupLight` und `popupLight2` (Helligkeit, Farbe, Farbtemperatur), `popupShutter` und `popupShutter2` (Rollläden, Lamellen), `popupThermo` (Thermostat), `popupFan` (Lüfter), `popupInSel` (Auswahllisten), `popupTimer`, `popupSlider` und `popupNotify` (Meldungen). Beschrieben sind sie unter [Popups](pagePopup).

## 6. Bildschirmschoner

Im Ruhezustand zeigt das Panel einen Bildschirmschoner mit Uhrzeit, Datum, Wetter und frei belegbaren Werteplätzen, dazu Statussymbole und Indikator-Tasten. Es gibt mehrere Versionen mit unterschiedlicher Aufteilung (Standard, Alternativ, Advanced, EasyView). Einrichten geht im Admin ([Screensaver – Admin](Screensaver-Admin)) oder im Skript ([Screensaver](screensaver)).

## 7. Konfiguration im Admin — und wann das Skript

**Der Admin ist der Weg:** Alle Seiten und der Bildschirmschoner werden dort angelegt, mit Vorschau des Panels, gespeichert wird in der Instanz.

Das **Konfigurationsskript** bleibt für **erfahrene Nutzer** und **besondere Konstellationen** — also für Fälle, die sich im Admin nicht abbilden lassen. Wer neu anfängt, braucht es nicht.

| | Admin | Konfigurationsskript |
|---|---|---|
| Für wen | alle | erfahrene Nutzer |
| Aufwand | klicken, mit Vorschau des Panels | JavaScript schreiben |
| Umfang | alle Seiten, Bildschirmschoner, Panel-Grundeinstellungen | Sonderfälle jenseits des Admins |
| Ablage | in der Instanz | im Skript |
| Zusammenspiel | gilt für die aufgeführten Panels | greift dort, wo keine Admin-Seite existiert |

> **Was im Admin fehlt, gehört gemeldet.** Lässt sich etwas dort nicht einstellen, ist das ein Fall für das Entwicklerteam ([Issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues)) — nicht für einen Umweg über das Skript.

## 8. Hardware-Tasten, Relais und Summer

Die beiden Tasten des Panels und die dahinterliegenden Relais sind frei belegbar — sie können lokal schalten oder nur eine Meldung an den ioBroker schicken. Der eingebaute Summer lässt sich für Tastenton und Meldungen nutzen (Tasmota-Befehl `Buzzer`, dafür muss `SetOption111 1` gesetzt sein).

## 9. Was man dafür braucht

- ein SONOFF NSPanel (EU- oder US-Ausführung),
- Tasmota auf dem Panel ([NSPanel flashen](NSPanel-flashen)) — Berry-Treiber und TFT-Firmware installiert der Adapter selbst,
- einen MQTT-Broker, den ioBroker und Panel erreichen,
- den Adapter selbst ([Adapterinstallation](Adapter-Installation)),
- für Wetter im Bildschirmschoner eine Wetterquelle als Adapterinstanz.
