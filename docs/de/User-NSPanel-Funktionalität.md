# Funktionsübersicht

Diese Seite gibt einen Überblick darüber, was das **NSPanel Lovelace UI** kann, bevor du dich in die einzelnen Konfigurations-Seiten vertiefst. Sie richtet sich an neue Nutzer, die abschätzen wollen, ob der Adapter ihre Anwendungsfälle abdeckt.

## Was ist das NSPanel?

Das **Sonoff NSPanel** ist ein smarter Wandschalter mit:

- zwei physischen Relais-Schaltern
- einem 3,5-Zoll-Touchscreen
- Temperatur- und Helligkeitssensor

Ursprünglich für die eWeLink-App gedacht, lässt es sich mit alternativer Firmware deutlich mächtiger in ioBroker einbinden.

## Was macht das NSPanel Lovelace UI?

Das NSPanel Lovelace UI ist eine alternative Bedienoberfläche für das Sonoff NSPanel im Stil der Home-Assistant-Lovelace-UI. Es bringt eine eigene Nextion-Firmware (TFT) auf das Display und wird vollständig aus ioBroker heraus gesteuert. Die Kommunikation läuft typischerweise über **Tasmota** (Firmware auf dem ESP) und **MQTT**.

Damit kannst du direkt auf dem Display:

- Lovelace-ähnliche **Karten (Cards)** mit Geräten und Sensoren anzeigen
- **Sensorwerte** darstellen (z. B. Temperatur, Luftfeuchtigkeit)
- **Lichter, Rollläden, Thermostate** und andere Geräte steuern
- **Szenen und Automatisierungen** auslösen
- einen **Screensaver** mit Uhrzeit, Datum und Wetter anzeigen

## Bedienkonzept

Das Panel zeigt immer **eine Seite** gleichzeitig. Über Navigations-Pfeile, das Antippen von Kacheln und Hardware-Tasten wechselst du zwischen Seiten und öffnest **Popups** zur Detailsteuerung (z. B. Helligkeit, Farbe, Lüfterstufe). Aus dem Ruhezustand (Screensaver) gelangst du per Tippen zur ersten Seite zurück.

- **Navigation:** Wie Seiten miteinander verknüpft werden, beschreibt [Navigation Overview](Navigation) und [Navigations-Flow](naviFlow).
- **Hardware-Tasten:** Die beiden Relais/Tasten lassen sich frei belegen (siehe [Konfigurationsskript](ScriptConfig)).

## Seitentypen (Cards)

Der Adapter stellt verschiedene Seitentypen bereit. Eine vollständige Übersicht mit den internen Typ-Bezeichnungen findest du unter [Standard Pages](Pages).

| Seitentyp | Zweck | Doku |
|-----------|-------|------|
| Menü-/Grid-Seite | Kachelübersicht mit Geräten und Unterseiten | [Page Menue](cardGrid) |
| Entitäten-/Listen-Seite | Liste von Steuerungen und Werten | [Standard Pages](Pages) |
| Thermostat | Heizungs-/Klimasteuerung | [Page Thermo2](PageThermo2) |
| Medien | Media-Player-Steuerung | [Page Media](PageMedia) |
| Leistung/Energie | Energiefluss-Darstellung | [Page Power](PagePower) |
| Diagramm | Verlaufsdiagramme (Chart) | [Page Chart](PageChart) |
| Alarm | Alarmanlage mit PIN | [Page Alarm](cardAlarm) |
| QR-Code | WLAN-/URL-/Text-QR-Code | [Page QR](cardQR) |
| Zeitplan/Müll | Termin- und Müllabfuhr-Übersicht | [Page Trash](cardTrash) |
| Popup-Benachrichtigung | Einblendung von Meldungen | [Page PopupNotify](PagePopup) |

## Popups zur Detailsteuerung

Beim Antippen einer Kachel öffnen sich – je nach Gerätetyp – passende Popups, z. B.:

- **Licht:** Ein/Aus, Helligkeit, Farbtemperatur, Farbe
- **Rollladen/Jalousie:** Auf/Ab/Stopp, Position, Lamellen
- **Thermostat:** Solltemperatur, Modus
- **Lüfter:** Stufen
- **Timer / Slider / Auswahl:** generische Eingabe-Popups

## Screensaver

Im Ruhezustand zeigt das Panel einen **Screensaver** mit Uhrzeit, Datum, Wetter (aktuell + Vorhersage) und optionalen Status-Symbolen. Layout, Farben und Inhalte sind umfangreich konfigurierbar – siehe [Screensaver](screensaver).

## Weitere Funktionen

- **Buzzer-Steuerung:** Tonsignale für Tastendrücke und Benachrichtigungen (erfordert `SetOption111 1` in Tasmota).
- **Farbthemen:** Wähl- bzw. anpassbare Farbpaletten für die gesamte Oberfläche – siehe [User Farbthema](ColorThemes).
- **Mehrere Panels:** Ein Adapter-Instanz kann mehrere NSPanels gleichzeitig verwalten.
- **Templates:** Wiederverwendbare Vorlagen für häufige Geräte (siehe [Developer Templates](Developer-Templates)).

## Voraussetzungen

- Sonoff NSPanel mit **Tasmota**-Firmware und aufgespielter **NSPanel-Lovelace-UI-TFT** (siehe [NSPanel flashen](NSPanel-flashen))
- Laufender **MQTT-Server** (z. B. der ioBroker-MQTT-Adapter, siehe [MQTT-Server Einstellungen](General))
- ioBroker mit installiertem Adapter (siehe [Adapterinstallation](Adapter-Installation))

## Nächste Schritte

1. [NSPanel flashen](NSPanel-flashen) – Firmware aufspielen
2. [Adapterinstallation](Adapter-Installation) – Adapter einrichten
3. [Konfigurationsskript – Einleitung](ScriptConfig) – erste Seiten anlegen
4. [Standard Pages](Pages) – Seitentypen im Detail
