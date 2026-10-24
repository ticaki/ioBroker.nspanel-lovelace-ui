# Web-Panel: Architektur-Vertrag

Dieses Dokument ist der verbindliche Vertrag zwischen Backend (Adapter, `src/`) und
Frontend (`src-web/`). Wer an einem der beiden Teile arbeitet, hält sich an die hier
festgelegten Namen, Frames und Schnittstellen. Änderungen am Vertrag werden hier zuerst
eingetragen.

## 1. Grundidee

Das Display eines NSPanel ist "dumm": Der Adapter schickt Strings über
`<topic>/cmnd/CustomSend`, das Display antwortet über `<topic>/tele/RESULT`
(`{"CustomRecv":"event,…"}`) und Tasmota quittiert jeden CustomSend mit
`<topic>/stat/RESULT` (`{"CustomSend":"Done"}`). Das Frontend ersetzt genau dieses
Display. Der Adapter-Code für Seiten, Navigation, Items und Screensaver bleibt
unverändert, es wird nur der Transport ausgetauscht und die Tasmota-Hardware entfällt.

Protokoll-Spezifikation: `HMI/Readme.md` (Befehle und Events), ergänzt durch das, was
die Seitenklassen in `src/lib/pages/*.ts` tatsächlich senden (die Readme ist teilweise
älter als der Adapter, der Adapter-Code hat Vorrang).

## 2. Backend

### 2.1 `PanelChannel` (`src/lib/classes/panel-channel.ts`)

```ts
export interface PanelChannel {
    publish(topic: string, message: string, opt?: IClientPublishOptions): Promise<void>;
    subscribe(topic: string, callback: callbackMessageType): Promise<void>;
    unsubscribe(topic: string): void;
    removeByFunction(callback: callbackMessageType): void;
}
```

`MQTTClientClass` erfüllt das Interface strukturell und bleibt der Kanal für echte
Panels. `Panel` und `PanelSend` sprechen nur noch mit `PanelChannel`, nicht mehr direkt
mit `controller.mqttClient`.

### 2.2 `VirtualPanelChannel` (`src/lib/web/virtual-panel-channel.ts`)

In-Process-Implementierung von `PanelChannel` für genau ein virtuelles Panel:

- `subscribe` unterstützt die MQTT-Wildcards `#` und `+` (Panel abonniert
  `<topic>/tele/#`, `<topic>/stat/#`, `<topic>/stat/RESULT`).
- `publish('<topic>/cmnd/CustomSend', payload)` → Ereignis `command(payload)`.
- `publish('<topic>/cmnd/Buzzer', payload)` → Ereignis `buzzer(payload)`.
- Alle anderen `cmnd/*` werden verworfen (Debug-Log).
- `injectReceive(payload)` liefert `<topic>/tele/RESULT` mit
  `{"CustomRecv": payload}` an die Abonnenten.
- `injectAck()` liefert `<topic>/stat/RESULT` mit `{"CustomSend":"Done"}`.

### 2.3 Panel-Konfiguration

`panelConfigPartial` bekommt:

```ts
kind?: 'tasmota' | 'web';      // Default 'tasmota'
channel?: PanelChannel;        // Default controller.mqttClient
sourceTopic?: string;          // nur Web-Panel: Topic des echten Panels, von dem geklont wurde
```

`Panel.isVirtual` (Getter, `kind === 'web'`). Im virtuellen Modus entfallen:
`sendRules`, `requestStatusTasmota`, POWER1/POWER2/GetDriverVersion, Restart,
`handleLostMessages`, Modell-/MAC-Prüfung beim Startup, Tasmota-Firmware- und
TFT-Versionsvergleich, `info.tasmota.*`. Der Buzzer wird weiterhin über
`cmnd/Buzzer` geschickt (der Kanal leitet ihn weiter). `event,button1` und
`event,button2` werden wie bei detached Relais behandelt.

### 2.4 Klon und Lebenszyklus (`src/lib/web/virtual-panel-manager.ts`)

- Ein virtuelles Panel ist ein Klon der Konfiguration eines echten Panels
  (`structuredClone` des Eintrags aus `Controller.options.panels`, gefunden über Topic,
  Fallback MAC-ID aus `adapter.config.panels`).
- Name des Klons: `<id>_web` für die erste Sitzung, `<id>_web2` … `<id>_web8` für
  weitere gleichzeitige Sitzungen desselben echten Panels (Slot-Prinzip,
  `WEB_PANEL_MAX_SESSIONS` = 8). Ein gemeinsamer Name für alle Klone geht nicht, weil
  die internen Zustände (`<name>/cmd/…`) pro Panel-Instanz registriert werden und beim
  Löschen eines Klons verschwinden würden. Slots werden wiederverwendet, die
  Objekt-Bäume `panels.<id>_web<n>.*` bleiben damit auf höchstens 8 pro Panel begrenzt.
  Sind alle Slots belegt, wird die am längsten getrennte Sitzung verdrängt; haben alle
  einen verbundenen Browser, bekommt der neue `bye` mit `no free slot`.
  Topic des Klons: `<topic>/web/<sessionId>` (nur zur Unterscheidung, der Kanal ist
  ohnehin privat). `friendlyName`: `<name> (Web)` bzw. `<name> (Web <n>)`.
- Pro WebSocket-Sitzung ein Klon. Beim Verbindungsabbruch bleibt der Klon mit seiner
  `sessionId` für `WEB_PANEL_GRACE_MS` (Default 24 h) erhalten; ein Browser, der sich
  mit derselben `sessionId` neu verbindet, wird wieder an ihn gebunden. Danach
  `controller.removePanel`.
- Wird das echte Panel entfernt oder die Konfiguration neu geladen, werden seine
  Klone ebenfalls entfernt.
- Virtuelle Panels stehen in `controller.panels` und zählen als Online-Panels.
- Der Weg zu "eigene Konfiguration pro Web-Panel" bleibt offen: Der Manager
  erzeugt später statt eines Klons ein Panel aus einem eigenen Konfigurationseintrag
  mit `kind: 'web'`, die Kanal- und Server-Seite ändert sich dafür nicht.

### 2.5 HTTP/WebSocket-Server (`src/lib/web/web-server.ts`)

Node `http` plus `ws`. Admin-Felder (`admin/jsonConfig.json5`, `io-package.json`
`native`, `src/lib/adapter-config.d.ts`, Übersetzungen mindestens en und de):

| Feld | Typ | Default |
| --- | --- | --- |
| `webEnabled` | boolean | `true` |
| `webPort` | number | `8090` |
| `webBind` | string | `0.0.0.0` |

Routen:

| Route | Zweck |
| --- | --- |
| `GET /` | einfache HTML-Liste aller Panels mit Links |
| `GET /<topicOrId>` | `www/index.html` |
| `GET /assets/*`, `GET /fonts/*`, `GET /icons/*` | statische Dateien aus `www/` |
| `WS /ws/<topicOrId>?session=<sessionId>` | Nachrichtenkanal |

`authorize(req): Promise<boolean>` ist ein Hook, der derzeit immer `true` liefert.
Port-Belegung wird wie beim MQTT-Port geprüft und geloggt.

### 2.6 WebSocket-Frames (JSON, ein Frame pro Nachricht)

Server → Client:

```jsonc
{ "t": "hello", "session": "…", "model": "eu", "topic": "…", "name": "…",
  "friendlyName": "…", "tftVersion": "5.1.1" }
// topic = Topic des echten Panels, name = Name des Klons (z. B. "a0b7a554c071_web"),
// tftVersion = bekannte TFT-Version des Modells, sonst "1.0.0"
{ "t": "cmd", "p": "entityUpd~…" }        // CustomSend-Payload, unverändert
{ "t": "buzzer", "p": "1,1,1" }           // Tasmota-Buzzer-Argument, unverändert
{ "t": "bye", "reason": "…" }
```

Client → Server:

```jsonc
{ "t": "ack" }                            // → stat/RESULT {"CustomSend":"Done"}
{ "t": "recv", "p": "event,…" }           // → tele/RESULT {"CustomRecv":"event,…"}
```

Pflichten des Clients (identisch zum echten Display):

1. Nach `hello` sofort `recv` mit `event,startup,<hmiProjectVersion>,<model>,<tftVersion>`
   senden (`hmiProjectVersion` ist eine Zahl wie bei der echten HMI, der Adapter liest
   sie nicht aus; `model` und `tftVersion` aus `hello`).
2. **Jeden** `cmd`-Frame nach der Verarbeitung mit `ack` quittieren.
3. Nach einem Seitenwechsel durch `pageType~…` zusätzlich
   `recv` mit `event,renderCurrentPage,<pageType>` senden (siehe `HMI/Readme.md`,
   Abschnitt "Messages from Nextion Display").
4. Timeout und Dimmode wie die HMI: nach `timeout~<s>` Sekunden ohne Berührung
   `event,sleepReached,<pageType>` senden; `dimmode~low~high~bg~text~…` steuert die
   dargestellte Helligkeit (low im Screensaver, high bei Aktivität).
5. Auf `pageType~pageStartup` die Startseite zeigen **und** das Startup-Event aus
   Punkt 1 erneut senden. Der Adapter setzt das Panel offline, wenn fünf Nachrichten
   nicht quittiert wurden, und schickt dann alle 5 s `pageType~pageStartup`, bis das
   Startup-Event kommt (so verhält sich auch die echte HMI, die auf der Startseite das
   Event wiederholt).
6. `bye` beenden die Sitzung endgültig (`reason`: `unknown panel`, `no free slot`,
   `replaced`, `panel removed`, `shutdown`). Bei `replaced` hat ein anderer Browser
   dieselbe `session` übernommen; der Client zeigt den Grund an und verbindet nicht
   automatisch neu. Bei einem Verbindungsabbruch ohne `bye` verbindet er mit derselben
   `session` neu.

## 3. Frontend (`src-web/`)

### 3.1 Technik

- Vite + React 19 + TypeScript strict, Aufbau analog `src-admin` (eslint
  `@iobroker/eslint-config`, Prettier wie Root). **Nur class-based Components.**
- Tests mit `vitest` (`*.test.ts` neben den Dateien).
- Build nach `www/` (Repo-Root), `base: '/'`. `www/` wird committet.
- Schrift: Roboto über `@fontsource/roboto` (kein CDN, läuft offline).
- Keine i18n im Frontend nötig: alle sichtbaren Texte kommen vom Adapter. Einzige
  Ausnahme sind Verbindungs-Hinweise, die werden en/de als kleines Map gehalten.

### 3.2 Verzeichnisse

```
src-web/
  package.json  vite.config.ts  tsconfig.json  eslint.config.mjs  index.html
  scripts/gen-icons.ts            # erzeugt src/icons/glyph-map.json und mdi-paths.json
  src/
    index.tsx  App.tsx            # App: Transport, Store, DeviceFrame
    transport/Transport.ts        # interface PanelTransport
    transport/WsTransport.ts      # WebSocket-Implementierung (Frames aus 2.6)
    protocol/split.ts             # splitTilde(), parseEntity6(), parseNavigation()
    protocol/color.ts             # color565ToCss()
    protocol/commands.ts          # parseCommand(raw) -> { cmd, args }
    protocol/types.ts             # PageType, Entity6, Navigation, GlobalState, …
    store/PanelStore.ts           # Zustand + Dispatch (siehe 3.4)
    cards/CardContract.ts         # CardModule, CardProps, ParseContext
    cards/registry.ts             # pageType -> CardModule (alle Module importiert)
    cards/<modul>/index.ts        # export const module: CardModule<Model>
    cards/<modul>/parse.ts        # Parser
    cards/<modul>/parse.test.ts   # Tests mit Beispielen aus HMI/Readme.md
    cards/<modul>/<Modul>.tsx     # Komponente
    components/Icon.tsx           # Glyphe -> MDI-SVG
    components/DeviceFrame.tsx    # 480x320 Bühne, CSS-Skalierung, Dim-Overlay, Hardware-Buttons
    components/TitleBar.tsx       # Navigation links/rechts + Titel (gemeinsam für Karten)
    components/StartupPage.tsx
    audio/buzzer.ts               # Tasmota-Buzzer-Argument -> Web Audio
    icons/glyph-map.json  icons/mdi-paths.json   # generiert
    style/theme.ts  style/panel.css
```

### 3.3 Karten-Vertrag (`cards/CardContract.ts`)

```ts
export interface ParseContext {
    pageType: string;            // aktiver pageType (z. B. 'cardGrid2')
    pageArgs: string[];          // Argumente hinter pageType~…
}

export interface CardProps<M> {
    model: M;
    ctx: ParseContext;
    global: GlobalState;         // time, timeIcon, date, dim, timeout, model
    send: (event: string) => void;                       // roher Event-String
    press: (id: string, action: string, value?: string | number) => void;
    // press baut: event,buttonPress2,<id>,<action>[,<value>]
}

export interface CardModule<M> {
    readonly pageTypes: readonly string[];
    readonly initial: () => M;
    /** entityUpd~… ; args ohne das führende 'entityUpd' */
    parseEntityUpd(args: string[], prev: M, ctx: ParseContext): M;
    /** entityUpdateDetail~… (Popups) */
    parseEntityUpdateDetail?(args: string[], prev: M, ctx: ParseContext): M;
    /** alle anderen Befehle an die aktive Seite (weatherUpdate, statusUpdate, notify, color, …) */
    handleCommand?(cmd: string, args: string[], prev: M, ctx: ParseContext): M;
    readonly Component: React.ComponentType<CardProps<M>>;
}
```

Jedes Modul lebt in einem eigenen Ordner und wird in `cards/registry.ts` eingetragen.
Die Registry wird vom Frontend-Kern mit **allen** geplanten Modulen als Stubs angelegt;
Karten-Worker ersetzen nur den Inhalt ihres Ordners und fassen keine fremden Dateien an.

Module und ihre pageTypes:

| Ordner | pageTypes |
| --- | --- |
| `pageStartup` | `pageStartup` |
| `screensaver` | `screensaver`, `screensaver2`, `screensaver3` |
| `cardEntities` | `cardEntities` |
| `cardGrid` | `cardGrid`, `cardGrid2`, `cardGrid3` |
| `cardSchedule` | `cardSchedule` |
| `cardMedia` | `cardMedia` |
| `cardThermo` | `cardThermo` |
| `cardThermo2` | `cardThermo2` |
| `cardAlarm` | `cardAlarm` |
| `cardUnlock` | `cardUnlock` |
| `cardQR` | `cardQR` |
| `cardPower` | `cardPower` |
| `cardChart` | `cardChart`, `cardLChart` |
| `popupLight` | `popupLight`, `popupLightNew` |
| `popupShutter` | `popupShutter`, `popupShutter2` |
| `popupFan` | `popupFan` |
| `popupSlider` | `popupSlider` |
| `popupThermo` | `popupThermo` |
| `popupInSel` | `popupInSel` |
| `popupTimer` | `popupTimer` |
| `popupNotify` | `popupNotify`, `popupNotify2` |

`cardTrash` wird vom Adapter auf eine andere Karte abgebildet (prüfen in
`src/lib/pages`), bekommt kein eigenes Modul, solange kein eigener pageType gesendet wird.

### 3.4 Store und Dispatch

`PanelStore` hält `GlobalState` plus `{ pageType, pageArgs, model }` der aktiven Seite.
Dispatch eines `cmd`-Frames:

| Befehl | Verarbeitung |
| --- | --- |
| `pageType~X~…` | Modul für `X` aus der Registry, `model = initial()`, danach `event,renderCurrentPage,X` senden |
| `entityUpd~…` | `module.parseEntityUpd` |
| `entityUpdateDetail~…` | `module.parseEntityUpdateDetail` |
| `time~HH:MM[~icon]`, `date~…` | GlobalState |
| `timeout~s` | GlobalState + Sleep-Timer |
| `dimmode~…` | GlobalState (Helligkeit) |
| alles andere | `module.handleCommand`, falls vorhanden |

Nach jedem verarbeiteten Frame `ack` senden. Unbekannte Befehle werden geloggt und
trotzdem quittiert.

**Popups** (Erkenntnis der Karten-Worker, 2026-10-24): Der Adapter sendet für
`popupLight`, `popupShutter`, `popupFan`, `popupSlider`, `popupThermo`, `popupInSel` und
`popupTimer` **kein** `pageType`. Die echte HMI wechselt beim Antippen selbst in das Popup
und schickt `event,pageOpenDetail,<popup>,<id>`; der Adapter antwortet nur mit
`entityUpdateDetail~…` (popupInSel: `entityUpdateDetail2~…`, läuft über `handleCommand`).
Der Store bildet das nach:

- `CardProps.openPopup(popup, id, title?, icon?)` wechselt lokal auf das Popup-Modul mit
  `pageArgs = [id, title, icon]`, merkt sich die Karte und sendet das `pageOpenDetail`-Event.
  Ein rohes `send('event,pageOpenDetail,…')` wechselt ebenfalls (ohne Titel); zeigt das
  Popup schon, bleibt es (Blättern in popupInSel).
- `bExit` (über `press` oder `send`) kehrt lokal zur gemerkten Karte zurück; der Adapter
  schickt die Karte danach ohnehin erneut (`setActivePage(true)`).
- Ein vom Adapter gesendetes `pageType` verwirft die gemerkte Karte.
- Timeout in Popups: nach `timeout` Sekunden sendet der Store `event,buttonPress2,<id>,bExit`
  statt `sleepReached` und kehrt zur Karte zurück. `popupNotify`/`popupNotify2` steuern den
  Timeout selbst über das `timeout`-Feld ihres Payloads (0 = bleibt offen), der globale
  Timer pausiert dort.
- `popupNotify`/`popupNotify2` werden weiterhin vom Adapter per `pageType` geöffnet.

### 3.5 Darstellung

- Bühne 480×320 (`eu`, `us-l`) bzw. 320×480 (`us-p`), schwarzer Hintergrund, Skalierung
  per `transform: scale()` auf die Viewport-Größe, Seitenverhältnis bleibt.
- Farben kommen als RGB565-Dezimalzahl (`color565ToCss`).
- Icons sind Glyphen aus dem Private-Use-Bereich; `Icon` löst Glyphe → MDI-Name
  (`glyph-map.json`, generiert aus `src/lib/const/icon_mapping.ts`) → SVG-Pfad
  (`mdi-paths.json`, generiert aus `@mdi/svg`). Unbekannte Glyphe: Platzhalter.
- Dim: Helligkeit **und** Kontrast der Bühne werden aus `dimmode` abgeleitet
  (CSS `filter: brightness() contrast()`, low im Screensaver, high aktiv), kein reines
  Deckkraft-Overlay.
- Startseite (`pageStartup`): Auf dem echten Panel läuft ein Video/GIF/Bildershow. Bis
  das Material vorliegt, zeigt die Startseite ein Provisorium (Logo-Platzhalter); die
  Komponente ist so gebaut, dass später eine Mediendatei aus `www/` eingehängt wird.
- Hardware-Buttons: zwei Flächen unterhalb der Bühne, senden `event,button1` /
  `event,button2`.
- Buzzer: `buzzer`-Frame → `audio/buzzer.ts` (Tasmota-Syntax `count,beep,silence[,tune]`).

### 3.6 Transport-Vertrag (`transport/Transport.ts`)

```ts
export interface PanelTransport {
    connect(): void;
    disconnect(): void;
    onHello(cb: (hello: HelloFrame) => void): void;
    onCommand(cb: (payload: string) => void): void;
    onBuzzer(cb: (payload: string) => void): void;
    onStatus(cb: (status: 'connecting' | 'open' | 'closed') => void): void;
    /** Sitzung vom Server endgültig beendet (`bye`), kein Reconnect */
    onBye(cb: (reason: string) => void): void;
    ack(): void;
    recv(payload: string): void;
}
```

Spätere Varianten (Token, ioBroker-Socket) implementieren dasselbe Interface.

### 3.7 Screenshots mit Puppeteer

Zum Vergleich einer Karte mit den Wiki-Bildern rendert `src-web/scripts/screenshot.mjs`
eine Liste von CustomSend-Payloads im Mock-Modus und speichert die Bühne (480×320, 2x) als
PNG. Voraussetzungen: global installiertes `puppeteer` (`npm i -g puppeteer`) und ein
laufender Vite-Server in `src-web` (`npm start`, Port 4174).

```bash
cd src-web
npm start &                      # einmal, bleibt laufen
node scripts/screenshot.mjs --in scripts/examples/cardEntities.txt --out /tmp/cardEntities.png
```

Eingabedatei: eine Payload pro Zeile (`pageType~cardGrid`, dann `entityUpd~…`), Zeilen mit
`#` sind Kommentare, `@sleep <ms>` wartet, `@touch` berührt die Bühne. Das Skript gibt am
Ende aus, welche Events das Frontend gesendet hätte (`ack`, `event,…`).

Mock-Modus: `http://localhost:4174/<topic>?mock=1` öffnet keinen WebSocket; stattdessen gibt
es `window.__panel = { dispatch(raw), sent, hello }` (Hello-Default: Modell `eu`,
TFT 5.1.1). Damit lässt sich eine Karte auch von Hand in der Browser-Konsole füttern.

## 4. Build und Qualität

- Root `package.json`: Skript `build:web` (`cd src-web && npm run build`), `build`
  bleibt für den Adapter. `www/` ist bereits in `files` enthalten.
- Vor jedem Commit: `npm run lint`, `npm run check`, `npm run test`, `npm run build`
  (Root) und `npm run lint` / `npm run build` in `src-web`.
- Changelog-Eintrag in `README.md` unter `### **WORK IN PROGRESS**`.
