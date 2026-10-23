# Standard Pages – Einleitung

**Alle Seiten werden im Admin angelegt.** Ein Teil von ihnen hat dabei einen **festen Aufbau**: Wie die Elemente auf dem Panel liegen, gibt die Karte vor, frei ist nur, welche Datenpunkte sie zeigt und wie sie beschriftet sind. Für jede dieser Karten gibt es im Admin einen eigenen Editor, der die Seite so zeichnet, wie das Panel sie später anzeigt.

Das [Konfigurationsskript](ScriptConfig) ist der Weg für **erfahrene Nutzer in besonderen Konstellationen** — für den normalen Betrieb wird es nicht gebraucht. **Lässt sich etwas im Admin nicht einstellen, bitte beim Entwicklerteam melden** ([Issue](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/issues)), statt es im Skript zu umgehen.

## Welche Seite wo konfiguriert wird

| Seite | Wofür sie da ist | Was am Panel ankommt | Anlegen im Admin |
|---|---|---|---|
| Menüseite | Fliesen- oder Listenübersicht mit frei gewählten Items | Grundlagen im [Konfigurationsskript](ScriptConfig#seiten-konfiguration) | [Menü-Seite](PageMenu-Admin) |
| Thermostat | Heizung und Klima, bis zu acht Heizkreise | [Page Thermo2](PageThermo2) | [Thermostat](PageThermo2-Admin) |
| Energie | Energiefluss mit Quellen und Verbrauchern | [Page Power](PagePower) | [Energie](PagePower-Admin) |
| Verlaufsdiagramm | Verlauf aus der History | [Page Chart](PageChart) | [Verlaufsdiagramm](PageChart-Admin) |
| QR-Code | WLAN-Zugang, Telefonnummer oder Adresse als QR-Code | [Page QR](PageQR) | [QR-Code](PageQR-Admin) |
| Alarm | Alarmanlage mit PIN und Zuständen | [Page Alarm](PageAlarm) | [Alarm und Entsperrseite](PageAlarm-Admin) |
| Abfall | Abfuhrtermine | keine eigene Karte — der Adapter baut eine Listenseite daraus | [Abfall](PageTrash-Admin) |
| Medien | Musik und Wiedergabelisten | [Page Media](PageMedia) | **nicht im Admin** — nur im Skript |

## Was dabei zu beachten ist

- **Drei Seitentypen gibt es nur im Admin.** QR-Code, Alarm/Entsperren und Abfall kann ein Konfigurationsskript nicht anlegen — es weist sie ausdrücklich ab („is only supported in the admin configuration! Skipped!") und überspringt sie samt Navigationseintrag.
- **Eine Seite, eine Quelle.** Ist eine Seite im Admin angelegt, gilt für die aufgeführten Panels der Admin-Eintrag. Eine gleichnamige Seite im Skript wird für diese Panels nicht mehr verwendet.
- **Datenpunkte über Alias-Kanäle.** Die Karten erwarten bestimmte Rollen; welche das sind, steht in der [Alias-Tabelle](ALIAS). Der Editor im Admin prüft das beim Auswählen mit.
- **Entsperren statt eigener Seite.** Die frühere eigene Unlock-Seite ist kein eigener Punkt mehr, sie wird beim Anlegen der Seiten im Admin mit eingestellt.
- **Popups** gehören nicht hierher: sie öffnen sich aus einer Seite heraus und sind unter [Popups](pagePopup) beschrieben.
