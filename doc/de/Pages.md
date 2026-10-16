# Standard Pages – Einleitung

Ein Teil der Seiten hat einen **festen Aufbau**: Wie die Elemente auf dem Panel liegen, gibt die Karte vor, frei ist nur, welche Datenpunkte sie zeigt und wie sie beschriftet sind. Genau diese Seiten lassen sich im **Admin** anlegen — im Konfigurationsskript steht dann nur noch ein Verweis darauf, oder man lässt das Skript für diese Seite ganz weg.

Seiten mit freiem Aufbau (Menü- und Listenseiten mit beliebigen Items) sind im [Konfigurationsskript](ScriptConfig) beschrieben.

## Welche Seite wo konfiguriert wird

| Seite | Wofür sie da ist | Beschreibung der Karte | Anlegen im Admin |
|---|---|---|---|
| Thermostat | Heizung und Klima, bis zu acht Heizkreise | [Page Thermo2](PageThermo2) | [Thermostat](PageThermo2-Admin) |
| Energie | Energiefluss mit Quellen und Verbrauchern | [Page Power](PagePower) | *(folgt)* |
| Verlaufsdiagramm | Verlauf aus der History | [Page Chart](PageChart) | *(folgt)* |
| QR-Code | WLAN-Zugang als QR-Code | [Page QR](PageQR) | *(folgt)* |
| Alarm | Alarmanlage mit PIN und Zuständen | [Page Alarm](PageAlarm) | *(folgt)* |
| Papierkorb | Abfuhrtermine | *(folgt)* | *(folgt)* |
| Menüseite | Fliesen- oder Listenübersicht | [Konfigurationsskript](ScriptConfig) | *(folgt)* |

## Was dabei zu beachten ist

- **Eine Seite, eine Quelle.** Ist eine Seite im Admin angelegt, gilt für die aufgeführten Panels der Admin-Eintrag. Eine gleichnamige Seite im Skript wird für diese Panels nicht mehr verwendet.
- **Datenpunkte über Alias-Kanäle.** Die Karten erwarten bestimmte Rollen; welche das sind, steht in der [Alias-Tabelle](ALIAS). Der Editor im Admin prüft das beim Auswählen mit.
- **Entsperren statt eigener Seite.** Die frühere eigene Unlock-Seite ist kein eigener Punkt mehr, sie wird beim Anlegen der Seiten im Admin mit eingestellt.
- **Popups** gehören nicht hierher: sie öffnen sich aus einer Seite heraus und sind unter [Popups](pagePopup) beschrieben.
