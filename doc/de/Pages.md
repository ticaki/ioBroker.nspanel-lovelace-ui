# Standard Pages – Einleitung

**Alle Seiten werden im Admin angelegt.** Ein Teil von ihnen hat dabei einen **festen Aufbau**: Wie die Elemente auf dem Panel liegen, gibt die Karte vor, frei ist nur, welche Datenpunkte sie zeigt und wie sie beschriftet sind. Für jede dieser Karten gibt es im Admin einen eigenen Editor, der die Seite so zeichnet, wie das Panel sie später anzeigt.

Das [Konfigurationsskript](ScriptConfig) ist der Weg für **erfahrene Nutzer in besonderen Konstellationen** — für den normalen Betrieb wird es nicht gebraucht. **Lässt sich etwas im Admin nicht einstellen, bitte beim Entwicklerteam melden** ([Issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues)), statt es im Skript zu umgehen.

## Welche Seite wo konfiguriert wird

| Seite | Wofür sie da ist | Beschreibung der Karte | Anlegen im Admin |
|---|---|---|---|
| Thermostat | Heizung und Klima, bis zu acht Heizkreise | [Page Thermo2](PageThermo2) | [Thermostat](PageThermo2-Admin) |
| Energie | Energiefluss mit Quellen und Verbrauchern | [Page Power](PagePower) | *(folgt)* |
| Verlaufsdiagramm | Verlauf aus der History | [Page Chart](PageChart) | *(folgt)* |
| QR-Code | WLAN-Zugang als QR-Code | [Page QR](PageQR) | *(folgt)* |
| Alarm | Alarmanlage mit PIN und Zuständen | [Page Alarm](PageAlarm) | *(folgt)* |
| Papierkorb | Abfuhrtermine | *(folgt)* | *(folgt)* |
| Menüseite | Fliesen- oder Listenübersicht mit frei gewählten Items | *(folgt)* | *(folgt)* |

## Was dabei zu beachten ist

- **Eine Seite, eine Quelle.** Ist eine Seite im Admin angelegt, gilt für die aufgeführten Panels der Admin-Eintrag. Eine gleichnamige Seite im Skript wird für diese Panels nicht mehr verwendet.
- **Datenpunkte über Alias-Kanäle.** Die Karten erwarten bestimmte Rollen; welche das sind, steht in der [Alias-Tabelle](ALIAS). Der Editor im Admin prüft das beim Auswählen mit.
- **Entsperren statt eigener Seite.** Die frühere eigene Unlock-Seite ist kein eigener Punkt mehr, sie wird beim Anlegen der Seiten im Admin mit eingestellt.
- **Popups** gehören nicht hierher: sie öffnen sich aus einer Seite heraus und sind unter [Popups](pagePopup) beschrieben.
