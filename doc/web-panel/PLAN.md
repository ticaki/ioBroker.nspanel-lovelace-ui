# Web-Panel: NSPanel-Oberfläche im Browser

Stand: 2026-10-25 (abends), Branch `feature/web-panel`

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
| Login | PIN-Schutz über den `authorize`-Hook (siehe PIN). Eine Anbindung über ioBroker socket/web bleibt über den `PanelTransport`-Vertrag möglich. |
| Instanzen | **Geändert 2026-10-25:** ein Web-Panel **pro Endpoint**, keine Browser-Sitzungen mehr. Alle Browser auf demselben Endpoint zeigen dasselbe Panel synchron. Der Klon eines echten Panels teilt sich den Objektbaum `panels.<id>` mit dem Original (keine `_web`-Bäume mehr, alte werden beim Start gelöscht). |
| Eigenständige Web-Panels | **2026-10-25:** Panel-Tabelle im Admin bekommt Einträge mit `kind: 'web'` (Name, Topic, Modell, ohne IP/MAC), konfigurierbar wie ein echtes Panel über das Topic. |
| PIN | **2026-10-25:** eine globale PIN (`webPin`) für alle Web-Panels, auch Klone. Einmalige Abfrage pro Browser (Cookie), Admin-Links übergeben die PIN per `?pin=`, sonst erscheint die PIN-Seite. Leere PIN = offen. |
| URL | `http://<host>:<port>/<topic>`; die MAC-ID aus der Panel-Tabelle wird als Fallback akzeptiert. |
| FIDO2 | **2026-10-25:** `webFido` erlaubt Sicherheitsschlüssel/Passkeys (WebAuthn, `@simplewebauthn/server`) statt PIN – nur mit HTTPS, Hostname statt IP, vertrauenswürdiges Zertifikat. Registrierung auf `/auth/fido/register` (mit PIN-Token), Button auf der PIN-Seite, Schlüssel in `web.fidoCredentials`, Verwaltung im Admin (`WebFidoKeys`, `webFidoList`/`webFidoDelete`). Details ARCHITECTURE.md 2.5.3. |
| HTTPS | **2026-10-25:** optional (`webSecure`) mit den ioBroker-Zertifikaten (`webCertPublic`/`webCertPrivate`/`webCertChained`, Typ `certificate`, kein `certCollection`). Derselbe Server spricht dann HTTPS und WSS, das PIN-Cookie ist `Secure`. Fehlende/ungültige Zertifikate: Fehler-Log und Web-Panels aus, kein Rückfall auf HTTP. |
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
   läuft und das Web-Panel über HTTP (dann Hinweis plus Link in neuem Tab statt iframe;
   seit 2026-10-25 kann das Web-Panel selbst HTTPS sprechen, `webSecure`).

6. **Abgleich mit dem HMI** (ab 2026-10-25) – jede Seite des Web-Panels gegen die
   Emulator-Aufnahmen prüfen und angleichen, siehe unten.

Der Architektur-Vertrag für alle Beteiligten steht in `ARCHITECTURE.md`.

## Stand (2026-10-25, abends)

Phasen 1–4 umgesetzt (bis auf Wiki-Seite), Phase 5 teilweise (Button „Web-Panel öffnen“ im
Admin, noch kein iframe), Phase 6 für alle Karten, Popups und Screensaver einmal durchlaufen
(Details unten). Zugang: PIN, HTTPS mit ioBroker-Zertifikaten (`webSecure`) und FIDO2-Schlüssel
statt PIN (`webFido`, nur HTTPS; ARCHITECTURE.md 2.5.1–2.5.3). Umgesetzt am 2026-10-25 durch
parallele Worker:

- **Backend**: ein Web-Panel pro Endpoint (keine Sitzungen), Klon mit gemeinsamem Objektbaum,
  eigenständige Web-Panels (`kind: 'web'` in der Panel-Tabelle), PIN-Schutz (`webPin`),
  Aufräumen der alten `panels.*_web*`-Bäume, `seq`/`ack`-Deduplizierung. Tests in
  `src/lib/web/*.test.ts`. Im Dev-Server liegt ein Testeintrag `Webtest` (Topic `webtest`,
  id `web_0123456789ab`) mit der Skript-Konfiguration des emu-Panels.
- **Admin**: Dialog „Web-Panel hinzufügen/bearbeiten“, Chip „Web“, Tasmota-Aktionen für
  Web-Panels ausgeblendet (Übersicht, Maintain, Panelinfo), Link mit `?pin=`.
- **Frontend**: Transport ohne Session, `ack` mit `seq`, `GET /auth/check` vor Reconnect;
  Noto Sans statt Roboto (HMI-Font laut `HMI/nspanel-v5.1.1.HMI`), Nextion-Fonts 0–5 in
  `entityTypes.ts` eingemessen, alle Karten/Popups/Screensaver gegen die Emulator-Bilder
  vermessen (Abweichungen meist 1–3 px). Echte Mitschnitte und nachgebaute Szenen liegen als
  `src-web/scripts/examples/emu-*.txt` bzw. aktualisierte Beispiele vor.
- **Screensaver-Dimmen wie das echte Panel** (2026-10-25): Weck-Tipp hebt nur das Dimmen auf
  (`global.awake` im Store, Re-Dim nach `timeout~` Sekunden lokal ohne Ereignis, 0 = bleibt
  hell), Indikator-Icons senden ihr Ereignis nur im wachen Zustand, gedimmt sind sie der
  Weck-Tipp (`bExit,<taps>`). Entscheidungslogik in `cards/screensaver/interaction.ts`,
  Store- und Logik-Tests ohne DOM, Mock-Prüfung per Puppeteer (ARCHITECTURE.md 3.4).

## Phase 6: Abgleich mit dem HMI

Vorgehen: Seite im Web-Panel aufrufen bzw. Beispiel-Payload rendern, Screenshot per Puppeteer,
neben das Emulator-Bild legen, Unterschiede beheben. **Erster Durchlauf am 2026-10-25 für alle
Bereiche erledigt** (Schrift, cardGrid/2/3 inkl. useValue und Fonts 0–5, cardEntities, TitleBar,
cardThermo, cardPower, cardSchedule, cardChart/LChart, cardAlarm/Unlock, alle Popups, vier
Screensaver-Layouts). Erkenntnisse: die Emulator-Bilder sind mit `dimmode~15~80` aufgenommen,
alle Farben dort sind ×0,8 (Weiß = `#cccccc`, HMI-Blau `#03a9f4` = `#0088c6`); Inhaltsbreite der
HMI ist 447 px (Titel bei x 223, Nav-Icons x 33/414).

Verbleibende, bekannte Abweichungen:

- Icon-Formen (HMI nutzt eine ältere MDI-Version, Glyphen ~10 % breiter als hoch).
- HMI bricht Text zeichenweise, das Web wortweise (popupNotify) bzw. schneidet mitten im Glyph
  (cardSchedule „geschlos“ statt „geschlo“).
- screensaver2 (Advanced) hat auf dem HMI schwarzen Hintergrund trotz `color~…`; das Web nutzt
  die gesendete Farbe (Entscheidung offen). Info-Icon dort gelb statt `tTimeAdd`.
- Ohne Referenzbild (nachgebaut/angenommen): cardThermo dual, cardAlarm scharf, Alternativ-
  Screensaver mit Alternate-Entity, Advanced/EasyView mit Notify, popupNotify ohne Icon,
  Blätterpfeile in popupInSel/popupThermo, Timer-Editiermodus-Details.
- Toggle-„O“ ist auf dem HMI ein Ring, im Web ein Buchstabe; HMI-Textfarbe hat einen
  Cyan-Stich (vermutlich Emulator-Darstellung von Weiß, nicht übernommen).
- Screenshot-Skript kann `@click <selector>` (seit 2026-10-25, Beispiele
  `emu-cardGrid2-popupSlider.txt`, `emu-cardEntities-1-popupShutter2.txt`) - damit lassen sich
  auch Timer-Edit und Palette abbilden.
- Touch-Prüfung Kopfzeile (2026-10-25): alle 73 Beispiele im Mock-Modus per Puppeteer geprüft
  (`document.elementFromPoint` auf Nav-Pfeilen, Titel, Popup-X, Screensaver-Indikatoren plus
  Klick-Test auf das gesendete Event). Treffer: cardGrid (Kachel-Container über der TitleBar),
  popupSlider und popupThermo (Zeile 0 der `left:0; right:0`-Zeilencontainer lag über dem X);
  jeweils per `pointerEvents: none` am Container / `auto` an den Bedienelementen behoben.
  cardAlarm/cardUnlock: Titel wird absichtlich von der PIN-Box überdeckt (nicht interaktiv).

## Offene Punkte

- ~~**`Panel.loop`**: `setTimeout(() => this.loop, t)` ruft `loop` nie auf~~ – erledigt
  (2026-10-25, Tims Entscheidung): die Schleife läuft jetzt für alle Panels.
- ~~Screensaver-Indikator-Buttons ohne Wirkung, wenn der Screensaver Seite 0 ist~~ – erledigt
  (2026-10-25): `event.page && …` wertete die Seitennummer 0 als falsch, jetzt `!== undefined`.
- **Eigenständiges Web-Panel ohne Skript-Konfiguration** wird wie ein Hardware-Panel nicht
  angelegt; der Admin könnte beim Anlegen ein Konfigurationsskript erzeugen
  (`createConfigurationScript`).
- Jeder weitere Browser schickt beim Verbinden ein Startup-Event und rendert das gemeinsame Panel
  für alle neu (vertragsgemäß, aber sichtbar; ggf. Dedupe im Manager).
- Warnungen „has a invalid state object“ bei `panels.<id>.alarm.*.status` auch beim
  eigenständigen Web-Panel.
- Dev-Server: `encryptedNative` der Instanz enthält `webPin` erst nach `iobroker upload`.
- **popupNotify-Umbruch (Adapter, betrifft auch echte Panels)**: Der Text wird mitten im Wort
  umgebrochen („lange / r Benachrichtigu / ngstext“), die Zeilenaufteilung in `pagePopup.ts`
  zählt Zeichen.
- **`cmd.pagePopup.textSize`** hat in `definition.ts` `min: 1`, `pagePopup.ts` kennt aber
  auch 0 (7 Zeilen) – vermutlich Versehen.
- **cardTrash** (`testAbfall`) ist im Web-Panel leer; dazu Warnungen „invalid state object“
  bei `pageTrash_testAbfall`.
- Laufschrift der Interpretzeile in cardMedia ragt links heraus.
- ~~**HTTPS**~~ erledigt 2026-10-25: `webSecure` + ioBroker-Zertifikate (ARCHITECTURE.md 2.5.2).
  Offen bleibt nur `certCollection` (Let’s Encrypt über acme) – siehe Entscheidung dort.
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
