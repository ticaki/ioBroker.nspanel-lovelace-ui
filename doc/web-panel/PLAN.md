# Web-Panel: NSPanel-Oberfläche im Browser

Stand: 2026-10-25, Branch `feature/web-panel`

## Ziel

Der Adapter stellt Endpoints bereit, über die die NSPanel-Oberfläche in einem Webbrowser
dargestellt wird. Der Browser verhält sich 1:1 wie ein NSPanel: er versteht die gleichen
Strings (`entityUpd~…`, `pageType~…`, …), schickt die gleichen Events
(`event,buttonPress2,…`) und quittiert Nachrichten wie der Berry-Treiber (`Done`).
Damit bekommen Tablets, Handys oder beliebige Geräte dieselbe Visu, ohne dass die
Seitenlogik doppelt gebaut wird.

## Entscheidungen (abgestimmt 2026-10-24)

| Thema | Entscheidung |
| --- | --- |
| Konfiguration | Das Web-Panel ist **vorerst ein Klon** eines echten Panels (gleiche NSPanel-Konfiguration). Eine eigene NSPanel-Konfiguration pro Web-Panel kommt später, der Weg dahin darf nicht verbaut werden (`kind: 'web'` in der Panel-Konfiguration vorsehen). Technische Einstellungen wie Port sind erlaubt. |
| Server | Eigener HTTP + WebSocket-Server im Adapter (kein ioBroker.web-Zwang). Port als Admin-Feld, Default 8090. |
| Login | Vorerst ohne Login. Server hat einen `authorize`-Hook, das Frontend einen `PanelTransport`-Vertrag, damit später Token oder eine Anbindung über ioBroker socket/web nachrüstbar ist. |
| Instanzen | Ein virtuelles Panel **pro Browser-Sitzung**. Die Sitzung bleibt nach Verbindungsabbruch sehr großzügig erhalten (Default 24 h) und wird beim Reconnect wieder angebunden. |
| URL | `http://<host>:<port>/<topic>`; die MAC-ID aus der Panel-Tabelle wird als Fallback akzeptiert. |
| Tasmota | Relais, Sensoren, tempOffset, Restart, Rules, Status-Abfragen entfallen. Der **Buzzer wird simuliert** (Web Audio). Die beiden Hardware-Taster werden als Bildschirm-Buttons angeboten und verhalten sich wie detached Buttons. |
| Dimmode / Timeout | Beides wird im Browser visuell bzw. zeitlich nachgebildet. |
| Modell | Das virtuelle Panel übernimmt das Modell des echten Panels (eu, us-l, us-p). Umschalten im Betrieb gibt es nicht, später über die Konfiguration. Erste Umsetzung: `eu` (480×320 quer). |
| Optik | Nachbau nach Referenzbildern und HMI-Readme reicht, pixelgenau nach HMI ist nicht gefordert. Maßgeblich sind die Emulator-Aufnahmen (eu) aus `MISSING_PICTURES.md`. |
| Simulator | Das alte `simulator/`-Verzeichnis (nur dist, keine Quellen) wurde entfernt. |
| Globale Aktionen | Virtuelle Panels zählen als Online-Panels (z. B. für `setPopupNotification`). |
| Umsetzung | Eigener Branch, Backend und Frontend-Kern parallel, danach Karten massiv parallel per Worker. |

## Phasen

1. **Backend-Fundament** – `PanelChannel`-Abstraktion, `VirtualPanelChannel`, `kind: 'web'`
   in der Panel-Klasse, `VirtualPanelManager`, HTTP/WS-Server, Admin-Felder, Tests.
2. **Frontend-Kern** (`src-web/`) – Vite + React, Protokoll-Parser, Store, Geräte-Rahmen,
   WebSocket-Transport, Icons, Farben, Startseite, Timeout/Dim/Buzzer, Karten-Registry mit Stubs.
3. **Karten** – parallel: Screensaver (3 Varianten), Entities/Grid/Schedule, Media/QR,
   Thermo/Thermo2, Alarm/Unlock/Power, Chart/LChart/Trash, Popups.
4. **Integration** – Build nach `www/`, Lint, Tests, Changelog, Wiki-Seite.
5. **Admin-Vorschau** (Idee vom 2026-10-24) – Das Web-Panel wird im Admin als Vorschau
   eingebettet (iframe auf `http://<adapter-host>:<webPort>/<topic>`), z. B. in der
   Panel-Übersicht oder neben der Seitenkonfiguration, damit der Nutzer sein Panel ohne
   Hardware testen kann. Weil jede Browser-Sitzung ein eigener Klon ist, beeinflusst die
   Vorschau das echte Panel nicht. Voraussetzungen, die schon jetzt gelten: der Server
   setzt keine Frame-Sperre (`X-Frame-Options`/CSP `frame-ancestors`), das Frontend läuft
   ohne feste Fenstergröße, und der Admin kann Host und Port aus `system.adapter.<ns>`
   bzw. `native.webPort` ermitteln. Offen: Mixed Content, wenn der Admin über HTTPS
   läuft und das Web-Panel über HTTP (dann Hinweis plus Link in neuem Tab statt iframe).

6. **Abgleich mit dem HMI** (ab 2026-10-25) – jede Seite des Web-Panels gegen die
   Emulator-Aufnahmen prüfen und angleichen, siehe unten.

Der Architektur-Vertrag für alle Beteiligten steht in `ARCHITECTURE.md`.

## Stand (2026-10-25)

Phasen 1–3 sind umgesetzt, Phase 4 bis auf Wiki-Seite und Changelog-Feinschliff, Phase 5
teilweise (Button „Web-Panel öffnen“ im Admin, noch kein iframe). Das Web-Panel läuft im
Dev-Server unter `http://192.168.178.65:8090/<topic>`.

Zuletzt behoben (noch nicht committet, falls `git status` sie zeigt):

- Neue Web-Klone wurden nach einer Skript-Konfiguration (ScriptConfig, Panel-Neuladen ohne
  Adapter-Neustart) aus der Konfiguration vom Adapterstart gebaut. `Controller.addPanel`
  merkt sich jetzt die aktuelle Konfiguration in `options.panels`.
- `fontSize: 0` ging in `config-manager.ts` an zwei Stellen verloren (`item.fontSize ? …`).
- Das Frontend wertet das Suffix `¬<0-5>` am Icon-Feld (Item-Option `fontSize`) aus und
  zeichnet Glyph bzw. Text in der Nextion-Fontgröße (`NEXTION_FONT_SIZE` in `entityTypes.ts`).

## Phase 6: Abgleich mit dem HMI

Vorgehen: Seite im Web-Panel (Klon von `emu_topic`) aufrufen, Screenshot per Puppeteer,
neben das Emulator-Bild legen, Unterschiede beheben. Beim Ansehen der Bilder schon aufgefallen:

- **Schrift allgemein**: Die HMI-Schrift ist dünner und schmaler als Roboto. Prüfen, welche
  Schrift das HMI nutzt (wirkt wie Noto Sans) und ob sie als Webfont passt.
- **cardGrid3 mit `useValue`**: Der Wert steht groß an der Stelle des Icons, darunter nur der
  Name – das Web-Panel zeigt zusätzlich eine kleine Wertzeile, die es auf dem HMI nicht gibt.
  Ohne `fontSize` ist der Wert fett und groß. Die Fonts 0–3 sind auf dem HMI deutlich kleiner
  als die Wiki-Pixelwerte (24/32/32/48) – Größen an den Bildern einmessen. Font 4/5 werden an
  der Kachelgrenze abgeschnitten (im Web laufen sie in die Nachbarkachel).
- **cardThermo**: Pfeile links und rechts neben der Solltemperatur, die drei Punkte (Menü)
  darunter; im Web stehen die Pfeile über und unter dem Wert.
- **cardPower**: Wert und Einheit in der Mittelspalte zweizeilig („0“ / „W“); die Punkte auf
  den Linien stehen nach Wert skaliert an unterschiedlichen Positionen.
- **cardSchedule**: lange Werte werden rechts abgeschnitten („geschlo“).
- **popupNotify**: Überschrift klein oben links, Icon links, Text in textSize 3 (Standard,
  48 px, max. 4 Zeilen, längerer Text wird alle 3 s weitergeblättert), Buttons unten.
- **Screensaver**: Info-Icon unter der Uhrzeit (Standard/Alternativ), beim Advanced oben
  mittig; Benachrichtigung im Alternativ-Layout ersetzt die untere Zeile durch Überschrift
  und Text.
- Alle übrigen Bilder (Popups, cardEntities, cardGrid/2, Alarm/Unlock, Chart, Timer) noch
  nicht systematisch verglichen.

## Offene Punkte

- **popupNotify-Umbruch (Adapter, betrifft auch echte Panels)**: Der Text wird mitten im Wort
  umgebrochen („lange / r Benachrichtigu / ngstext“), die Zeilenaufteilung in `pagePopup.ts`
  zählt Zeichen.
- **`cmd.pagePopup.textSize`** hat in `definition.ts` `min: 1`, `pagePopup.ts` kennt aber
  auch 0 (7 Zeilen) – vermutlich Versehen.
- **cardTrash** (`testAbfall`) ist im Web-Panel leer; dazu Warnungen „invalid state object“
  bei `pageTrash_testAbfall`.
- Warnungen „has a invalid state object“ bei `panels.<clone>.alarm.*.status` nur für Klone.
- Laufschrift der Interpretzeile in cardMedia ragt links heraus.
- us-p/us-l-Layouts, Startvideo (`www/startup/startup.mp4`), Admin-Vorschau als iframe
  (Phase 5, Mixed Content).

## Testumgebung

- Dev-Server auf 192.168.178.65 (`.dev-server/default`, Admin :8081, Log
  `.dev-server/default/log/iobroker.<datum>.log`). Der Watch-Build baut `build/`, den Adapter
  startet man selbst neu:
  `cd .dev-server/default && node node_modules/iobroker.js-controller/iobroker.js restart nspanel-lovelace-ui.0`.
  Root-`npm run build` vermeiden; Frontend: `cd src-web && npm run build`, danach `www/`
  nach `.dev-server/default/node_modules/iobroker.nspanel-lovelace-ui/www/` kopieren.
- **Panel `emu`** (Topic `emu_topic`, ID `D4_8A_FC_9F_64_60`) ist ein Nextion-Emulator, nur
  zum Testen. Seiten kommen aus dem Skript `script.js.nspanel-lovelace-ui_0.emu` =
  `doc/web-panel/emu-pictures-config.ts`; Screensaver-Zustände und Popups aus
  `script.js.nspanel-lovelace-ui_0.emu_bilder_helfer` = `doc/web-panel/emu-pictures-helper.js`
  (Konstante `SCHRITT` setzen, Skript starten; `aufraeumen` setzt zurück).
- Skripte und große Objekte nicht per `iobroker object set` schreiben (yargs schneidet bei
  Tokens mit `-` ab), sondern mit dem Client aus `@iobroker/db-objects-redis` auf den
  jsonl-Server (Objects-Port 26426, States 24426, siehe `iobroker-data/iobroker.json`).
- Für die Test-Aliase (`alias.0.Light`, `alias.0.Thermostat`, …) wurden am 2026-10-24 die
  fehlenden Ziel-Datenpunkte unter `0_userdata.0.*` mit realistischen Werten angelegt.
- Im Admin wurde `emu_topic` der Alarmseite `alarm` zugewiesen und aus dem leeren
  Admin-Screensaver `test3` herausgenommen (sonst verdrängt er den Skript-Screensaver).
- Mitlesen auf MQTT: Server des Adapters auf Port 1884 (TLS), Zugangsdaten aus der
  Instanz (Passwort mit `tools.decrypt(system.config.native.secret, …)`).
