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
sourceTopic?: string;          // Klon: Topic des echten Panels; eigenständiges Web-Panel: undefined
```

Der Eintrag der Admin-Panel-Tabelle (`adapter.config.panels[]`, `adapter-config.d.ts`) bekommt
`kind?: 'tasmota' | 'web'` (fehlend = `tasmota`).

`Panel.isVirtual` (Getter, `kind === 'web'`). Im virtuellen Modus entfallen:
`sendRules`, `requestStatusTasmota`, POWER1/POWER2/GetDriverVersion, Restart,
`handleLostMessages`, Modell-/MAC-Prüfung beim Startup, Tasmota-Firmware- und
TFT-Versionsvergleich, `info.tasmota.*`. Der Buzzer wird weiterhin über
`cmnd/Buzzer` geschickt (der Kanal leitet ihn weiter). `event,button1` und
`event,button2` werden wie bei detached Relais behandelt.

### 2.4 Web-Panels und Lebenszyklus (`src/lib/web/virtual-panel-manager.ts`)

Geändert 2026-10-25 (Tims Vorgabe): **keine Sitzungen mehr, ein Web-Panel pro Endpoint.**
Alle Browser, die denselben Endpoint öffnen, hängen an derselben Panel-Instanz und laufen
synchron (drei Browser auf `/<topic>` zeigen dasselbe, eine Berührung in einem wirkt in
allen). Es gibt zwei Arten von Web-Panels:

1. **Klon eines echten Panels** (`/<topic>` bzw. `/<id>` eines Hardware-Panels):
   - Eine Panel-Instanz mit `kind: 'web'`, `sourceTopic = <topic>`, eigenem Topic
     `<topic>/web` (nur zur Unterscheidung in `controller.panels`), `VirtualPanelChannel`.
   - **Gemeinsamer Objektbaum mit dem Original:** `name` des Klons ist die `id` des echten
     Panels, also schreibt und liest er `panels.<id>.*` (Screensaver-Layout, Dim,
     Alarm-Status, `cmd.*` …) zusammen mit dem Original. Es gibt **keinen** Baum
     `panels.<id>_web*` mehr; vorhandene Bäume `panels.*_web` und `panels.*_web<n>`
     löscht der Adapter beim Start einmalig (Info-Log).
   - Der Klon schreibt **keine** `info.*`-Zustände (Online-Status, Tasmota-/TFT-Infos,
     Versionen gehören dem echten Panel) und löscht bei seinem `delete()` keine Objekte
     des Baums. Alles andere (Seitenlogik, Navigation, Zustände der Items) teilt er sich.
   - `friendlyName`: `<name> (Web)`.
   - Wird beim ersten Browser-Verbinden erzeugt, bleibt danach bestehen, solange das echte
     Panel existiert; nach `WEB_PANEL_GRACE_MS` (24 h) ohne verbundenen Browser wird er
     entfernt. Entfernen oder Neuladen der Konfiguration des echten Panels entfernt den
     Klon ebenfalls: verbundene Browser werden **ohne `bye`** getrennt, verbinden neu
     (Backoff) und bekommen einen frischen Klon. Solange das echte Panel nicht in
     `controller.panels` steht (Neuladen läuft, Panel deaktiviert), wird ein Verbindungsversuch
     ebenfalls nur getrennt (kein `bye`), der Browser versucht es weiter.
   - Interne Zustände `<id>/cmd/*` (Service-Seiten, `popupNotificationCustom`, …) registriert
     nur das echte Panel; es reicht jeden Befehl an seinen Klon weiter
     (`Panel.onInternalCommand`). `info.*`- und `status`-Zustände, das Geräteobjekt
     `panels.<id>` und das Aufräumen von `cmd.buttons.*` bleiben Sache des echten Panels.
2. **Eigenständiges Web-Panel** (kein Hardware-Panel dahinter):
   - Eintrag in der Admin-Panel-Tabelle (`adapter.config.panels[]`) mit `kind: 'web'`,
     `id` = `web_<12 hex>` (im Admin beim Anlegen erzeugt, stabil), `name`, `topic`,
     `model`; `ip` bleibt leer. Alte Einträge ohne `kind` sind `tasmota`.
   - Bekommt seine Seiten wie ein echtes Panel über das Topic (Skript-Konfiguration,
     Admin-Seiten, Screensaver- und Navigationszuweisung), eigener Baum `panels.<id>.*`
     (inklusive `info.*`, aber ohne `info.tasmota.*`-Inhalte).
   - Wird beim Adapterstart wie ein echtes Panel angelegt (`Controller.addPanel` holt den
     `VirtualPanelChannel` per `manager.channelFor(topic)`; der Manager wird dafür schon im
     Controller-Konstruktor über `ControllerOptions.createVirtualPanelManager` erzeugt),
     unabhängig davon, ob ein Browser verbunden ist. Ohne Browser ist es offline wie ein
     ausgeschaltetes Hardware-Panel. Ohne Skript-Konfiguration für sein Topic wird es wie
     ein Hardware-Panel ohne Skript nicht angelegt (`No script config found for <topic>`);
     eine `ScriptConfig`-Nachricht für das Topic legt es im laufenden Betrieb an.
   - Beim Neuladen (ScriptConfig) behält der Endpoint seinen Kanal; verbundene Browser
     bleiben verbunden. Ist das Panel nicht angelegt (deaktiviert, ungültig), wird ein
     Verbindungsversuch ohne `bye` getrennt.
   - Tasmota-Aktionen im Admin (Flashen, Neustart, IP, Berry-Treiber) entfallen für diese
     Einträge; der Admin zeigt sie als „Web“.

Browser-Clients: Der Manager hält pro Web-Panel eine Menge verbundener Clients. `cmd`- und
`buzzer`-Frames gehen an **alle** Clients. Jedes `cmd`-Frame trägt eine laufende Nummer
`seq`; der Manager quittiert gegenüber dem Panel (`injectAck`) **genau einmal pro `seq`**
(der erste `ack` gewinnt, weitere werden verworfen; ein `ack` ohne `seq` wird wie bisher
durchgereicht). `recv`-Frames aller Clients werden unverändert eingespeist.

Online/Offline (2026-10-25): Geht der letzte Browser eines Web-Panels, setzt der Manager das
Panel offline (wie ein ausgeschaltetes Display); das Panel bietet dann alle 5 s
`pageType~pageStartup` an (bei Web-Panels wiederholt `Panel.loop` das selbst, Hardware-Panels
machen das per Tasmota-Regel). Verbindet sich der erste Browser, wird die Sendewarteschlange
des Panels geleert (`panelSend.resetMessageDB()`), damit sein Startup-Event sofort beantwortet
wird. Jedes Startup-Event eines weiteren Browsers rendert das gemeinsame Panel für alle neu.

Virtuelle Panels stehen in `controller.panels` und zählen als Online-Panels.

### 2.5 HTTP/WebSocket-Server (`src/lib/web/web-server.ts`)

Node `http` plus `ws`. Admin-Felder (`admin/jsonConfig.json5`, `io-package.json`
`native`, `src/lib/adapter-config.d.ts`, Übersetzungen mindestens en und de):

| Feld | Typ | Default |
| --- | --- | --- |
| `webEnabled` | boolean | `true` |
| `webPort` | number | `8090` |
| `webBind` | string | `0.0.0.0` |
| `webHost` | string – Hostname/Adresse für die Admin-Links und das Start-Log, `''` = automatisch (siehe 2.5.2 „Host der Admin-Links“) | `''` |
| `webPin` | string (password, `protectedNative` + `encryptedNative`) | `''` |
| `webSecure` | boolean – HTTPS/WSS mit ioBroker-Zertifikaten (siehe 2.5.2) | `false` |
| `webCertPublic` | string (`certificate`-Auswahl, Name in `system.certificates`) | `defaultPublic` |
| `webCertPrivate` | string (`certificate`-Auswahl) | `defaultPrivate` |
| `webCertChained` | string (`certificate`-Auswahl, optional) | `''` |
| `webFido` | boolean – FIDO2-Sicherheitsschlüssel statt PIN (nur mit `webSecure`, siehe 2.5.3) | `false` |

Routen:

| Route | Zweck |
| --- | --- |
| `GET /` | einfache HTML-Liste aller Panels (Hardware und eigenständige Web-Panels) mit Links, Art und Zahl der verbundenen Browser |
| `GET /<topicOrId>` | `www/index.html` |
| `GET /<topicOrId>?pin=<pin>` | PIN prüfen, Cookie setzen, `302` auf `/<topicOrId>` ohne Query |
| `POST /auth` | Formular der PIN-Seite (`pin`, `next`): Cookie setzen, `303` auf `next` |
| `GET /auth/check` | `204` wenn autorisiert (oder keine PIN gesetzt), sonst `401`; das Frontend fragt das vor einem Reconnect ab |
| `GET /assets/*`, `GET /fonts/*`, `GET /icons/*` | statische Dateien aus `www/`, ohne PIN |
| `GET /<sonstige Datei in www/>` | statische Datei, **mit** PIN (z. B. `/index.html`, `/startup/*`) |
| `WS /ws/<topicOrId>` | Nachrichtenkanal (Query `session` wird ignoriert) |
| `GET /auth/fido/register`, `POST /auth/fido/register/{options,verify}`, `POST /auth/fido/login/{options,verify}` | FIDO2-Registrierung und -Anmeldung (nur bei aktivem FIDO2, sonst 404; siehe 2.5.3) |

Erste Pfadsegmente, die der Server selbst belegt und die kein Topic sein dürfen: `assets`,
`fonts`, `icons`, `auth`, `ws`. Die Reihenfolge der Prüfung: `POST /auth` → `/auth/check` →
`/ws/*` (426) → öffentliche statische Pfade → `?pin=` → Autorisierung → `/` → statische Datei →
Topic/Id (404 wenn unbekannt).

### 2.5.1 Zugang per PIN (2026-10-25)

Eine **globale PIN** (`webPin`) schützt alle Web-Panels, Klone wie eigenständige. Leere PIN =
kein Schutz (Warn-Log beim Start). Ablauf:

- Token = `HMAC-SHA256(key = system.config.native.secret, data = webPin)` als Hex. Es hängt
  nur von PIN und Instanz-Secret ab: PIN ändern macht alle gespeicherten Token ungültig.
- Nach erfolgreicher PIN-Prüfung setzt der Server das Cookie `nspanel_web_token=<token>;
  Path=/; Max-Age=315360000; SameSite=Lax; HttpOnly`. Der Browser merkt sich so die
  einmalige Freigabe; eine Abfrage pro Browser.
- `authorize(req)` akzeptiert ein gültiges Cookie oder `?token=<token>` (für den
  WebSocket-Aufbau aus einem späteren iframe). Nicht autorisiert: `GET /` und
  `GET /<topicOrId>` liefern die serverseitig gerenderte **PIN-Seite** (Formular, Status 401,
  Stil wie `indexPage`), der WebSocket-Upgrade wird mit HTTP 401 abgewiesen. Ein Browser
  sieht den HTTP-Status eines abgewiesenen Upgrades nicht, deshalb fragt das Frontend vor
  jedem Reconnect `GET /auth/check` ab und lädt bei `401` die Seite neu
  (`location.reload()`), damit die PIN-Seite erscheint.
- Falsche PIN: Antwort um 1 s verzögert, höchstens 5 Versuche pro Quell-IP und Minute,
  danach `429` (auch für die richtige PIN, bis die Minute vorbei ist). Das Formular der
  PIN-Seite schickt `next` mit; erlaubt sind nur lokale absolute Pfade, alles andere wird `/`.
- Die PIN kommt aus `adapter.config.webPin` (vom js-controller entschlüsselt); ein als Zahl
  gespeicherter Wert wird als Zeichenkette verglichen. Fehlt `system.config.native.secret`,
  nimmt der Server den Namespace als HMAC-Schlüssel (Warn-Log).
- **Aufruf aus dem ioBroker-Admin:** `webPanelUrl()` hängt `?pin=<webPin>` an, wenn eine PIN
  gesetzt ist, damit der Nutzer im Admin nichts eintippen muss. Der Server entfernt die PIN
  per Redirect sofort wieder aus der Adresszeile.

### 2.5.2 HTTPS mit ioBroker-Zertifikaten (2026-10-25)

`webSecure = true` lässt denselben Server per **HTTPS** antworten; der WebSocket-Upgrade läuft
über denselben TLS-Server (`wss://`). Routen, PIN-Ablauf und Frames sind unverändert.

- **Zertifikate:** `main.ts` → `loadWebCertificates()` lädt `webCertPublic`, `webCertPrivate` und
  optional `webCertChained` per `adapter.getCertificatesAsync(public, private, chained)` aus
  `system.certificates` und übergibt `{ key, cert, ca }` als `WebServerOptions.tls`. Der Server
  nimmt dann `https.createServer({ key, cert, ca }, handler)` statt `http.createServer`.
- **Fehlerfall = aus, kein Rückfall:** fehlende Auswahl, nicht vorhandene oder leere Zertifikate
  (Fehler aus `getCertificatesAsync`) oder ein von Node abgelehntes Schlüsselpaar führen zu einem
  Error-Log („… web panels are disabled“) und der Web-Server startet nicht. Ein stiller Rückfall
  auf HTTP ist absichtlich ausgeschlossen, damit die PIN nie unbemerkt im Klartext läuft. Der
  `VirtualPanelManager` bleibt (eigenständige Web-Panels behalten ihre Kanäle).
- **Cookie:** das Token-Cookie bekommt über HTTPS zusätzlich `Secure`
  (`WebServer.tokenCookie()`, `WebServer.secure`/`protocol` für Log und Links).
- **Start-Log:** `Web panels available at https://<host>:<port>/<topic>`.
- **Frontend:** `websocketUrl()` leitet `wss:` aus `location.protocol === 'https:'` ab, nichts
  ist hart kodiert.
- **Admin:** `webPanelUrl(host, port, topic, pin, secure)` baut `https://…`, wenn
  `webSecureOf(props.data)` wahr ist (Buttons in Maintain, Panel-Übersicht, Panel-Info). Der Link
  öffnet in einem neuen Tab, Mixed Content spielt keine Rolle. Alle angezeigten Adressen folgen
  der Einstellung: der Hinweistext `webPanelInfo` im Abschnitt „Web panels“ nutzt die
  json-config-Templates `${data.webSecure ? 'https' : 'http'}` und `${data.webPort || 8090}`
  (json-config wertet `${…}` in übersetzten `text`/`label` aus, `ConfigGeneric.getText` →
  `getPattern`); der Dialog „Web-Panel anlegen/bearbeiten“ zeigt unter dem Text eine
  Live-Vorschau der Adresse (`webPanelAddressPreview`, Key `webPanelAddress`), der Text
  `webPanelAddText` ist neutral (`http(s)://…`). Die Panel-Liste `GET /` des Servers verlinkt
  relativ (`/<topic>`), übernimmt also das Protokoll der Seite.
- **Selbstsigniert:** Browser warnen einmalig (Standard-Zertifikate von ioBroker). Für echte
  Zertifikate die in den ioBroker-Systemeinstellungen hinterlegten Namen wählen.
- **Host der Admin-Links (`resolveWebPanelHost`, src-admin `webPanelUrl.ts`):** mit HTTPS muss der
  Link den Namen aus dem Zertifikat tragen (und FIDO2 braucht einen DNS-Namen), eine IP reicht
  nicht. Reihenfolge: (1) `webHost` der Instanz, wenn gesetzt – im Konfig-Dialog gilt die noch
  ungespeicherte Eingabe sofort (`props.data`); (2) der Admin ist unter einem DNS-Namen geöffnet
  (`window.location.hostname` ist keine IPv4/IPv6, nicht `localhost`) **und** die Admin-Instanz,
  die diese Seite ausliefert (`system.adapter.admin.*` mit `native.port` = Port der Seite, leer =
  80/443), läuft auf demselben `common.host` wie die nspanel-Instanz → der Name der Adresszeile
  bleibt; (3) sonst wie bisher: gleicher Hostname, Adresse in `system.host.<host>.common.address`
  oder die erste brauchbare IPv4 des Hosts. Das Backend nutzt `webHost` nur für das Start-Log
  (`displayHost()`); die RP-ID für FIDO2 bleibt der Host-Header der Anfrage.
- **Link-Einstellungen im Admin-Seitentab:** `TabPanelinfo` läuft auch als Admin-Tab
  (`jsonTab.json5`), dort enthält `props.data` keine Instanz-Konfiguration. `loadWebLinkSettings()`
  liefert deshalb `{ host, port, secure, pin, enabled }` – aus `props.data`, wenn vorhanden (PIN
  entschlüsselt), sonst aus `native` des Instanz-Objekts (PIN dort verschlüsselt → `''`, der
  Browser zeigt einmalig die PIN-Seite). `webLinkSettingsOf(props.data, state)` legt beim Rendern
  die aktuellen Werte des Konfig-Dialogs über den geladenen Stand, so dass Änderungen an
  `webSecure`/`webPort`/`webPin`/`webHost` sofort in Links und Adress-Vorschau wirken; eine
  Änderung von `webHost` löst das erneute Auflösen des Hosts aus (`componentDidUpdate`).
- **Entscheidung Zertifikatsauswahl (`certificate` statt `certCollection`):** `@iobroker/json-config`
  9.0.20 im Repo kennt `certificate`, `certificates` und `certCollection`. Gewählt sind drei Felder
  vom Typ `certificate`; die Auswahl filtert dort nach dem Attributnamen (`*Public*`, `*Private*`,
  `*Chained*`), ein `certType` gibt es in dieser Version nicht – daher die Feldnamen
  `webCertPublic`/`webCertPrivate`/`webCertChained`. `certCollection` (Let’s-Encrypt-Sammlungen
  des acme-Adapters) ist nicht eingebaut: dafür müsste der Adapter `system.certificates`
  `native.collections` selbst lesen und Erneuerungen abonnieren (das macht sonst
  `@iobroker/webserver`, das hier keine Abhängigkeit ist und den eigenen WS-Upgrade nicht
  kennt). Kann später ergänzt werden, ohne die Felder zu ändern (`webCertCollection` zusätzlich).

### 2.5.3 FIDO2/WebAuthn als Alternative zur PIN (2026-10-25)

`webFido = true` erlaubt die Anmeldung mit einem **FIDO2-Sicherheitsschlüssel** (oder Passkey)
statt der PIN. Bibliothek: `@simplewebauthn/server` 14 (MIT; liefert CJS + ESM, wird per
`require` geladen – kein Bundling nötig, `build-adapter ts` transpiliert nur).
Module: `src/lib/web/fido.ts` (`FidoService`, `RateLimiter`, `relyingPartyFromHost`),
`src/lib/web/fido-store.ts` (`FidoCredentialStore`), Routen und Seiten in `web-server.ts`.

**Voraussetzungen (stehen auch im Admin bei der Checkbox und auf der Registrierungsseite):**

1. `webSecure` muss aktiv sein. Ohne HTTPS bleibt FIDO2 aus (`WebServer.fido` ist nur mit
   `tls` gesetzt, alle `/auth/fido/*`-Routen antworten 404; beim Start kommt das Info-Log
   „FIDO2 needs HTTPS - disabled“). Browser erlauben WebAuthn ohnehin nur im Secure Context.
2. Aufruf über einen **Hostnamen** (DNS). RP-ID = `Host`-Header ohne Port, Origin =
   `https://<host>[:port]` (`relyingPartyFromHost`). IP-Adressen (v4 und `[v6]`) werden mit
   400 abgelehnt, WebAuthn lässt sie als RP-ID nicht zu.
3. Das Zertifikat muss im Browser **vertrauenswürdig** sein; ein selbst signiertes geht, wenn es
   im Browser/System als vertrauenswürdig hinterlegt ist.

**Speicherung:** Objekt `<namespace>.web.fidoCredentials` (`type: meta`, `common.type:
meta.user`, `common.expert: true`), `native.credentials: [{ id, publicKey, counter, transports,
name, createdAt, lastUsedAt }]` – id und publicKey base64url, nur öffentliche Daten. Lesen und
Schreiben ausschließlich über den Adapter (`FidoCredentialStore`: `load`, `add`, `remove`,
`touch`; jede Änderung schreibt das Objekt komplett neu). Eine Instanz = ein WebAuthn-„User“
(`userName nspanel-web-panels`, feste `userID` aus SHA-256 davon) mit mehreren Schlüsseln;
`excludeCredentials` verhindert Doppelregistrierung desselben Authenticators.

**Ablauf Registrierung** (`GET /auth/fido/register`, nur mit gültigem PIN-Token – Cookie oder
`?token=`; bei leerer PIN frei): Formular mit Schlüsselname → `POST /auth/fido/register/options`
`{ name }` → `generateRegistrationOptions` (attestation `none`, residentKey/userVerification
`preferred`, Timeout 2 min) → `navigator.credentials.create()` im Browser (Inline-Script
`fidoScript()`, eigene base64url-Helfer, keine externen Abhängigkeiten) → `POST
/auth/fido/register/verify` mit dem Credential-JSON → `verifyRegistrationResponse` → Schlüssel
gespeichert, Erfolgstext mit Name. Die Panel-Liste `GET /` verlinkt die Seite, wenn FIDO2 aktiv
ist.

**Ablauf Anmeldung:** Die PIN-Seite (401) zeigt zusätzlich „Sign in with a security key“, sobald
mindestens ein Schlüssel registriert ist. `POST /auth/fido/login/options` →
`generateAuthenticationOptions` mit `allowCredentials` aus dem Speicher → `navigator.credentials.get()`
→ `POST /auth/fido/login/verify` `{ response, next }` → `verifyAuthenticationResponse` → Counter
und `lastUsedAt` gespeichert, **dasselbe Cookie wie beim PIN-Login** (`tokenCookie()`, bei HTTPS
`Secure`); bei leerer PIN gibt es nichts zu schützen, dann kein Cookie. Antwort
`{ ok: true, redirect: safeNext(next), key }`, die Seite leitet weiter.

**Challenges und Limits:** Challenges liegen im Speicher (`Map`), gelten 2 Minuten
(`FIDO_CHALLENGE_TTL_MS`) und werden beim ersten Verify verbraucht (`expectedChallenge` als
Funktion → `consume`), getrennt nach Art (register/login); höchstens 1000 gleichzeitig.
Rate-Limits pro Quell-IP (`RateLimiter`): 5 fehlgeschlagene Verifies pro Minute → 429 (wie die
PIN, mit 1 s Verzögerung), 30 Options-Anfragen pro Minute → 429. Eingaben werden auf die
bekannten Felder reduziert (`toRegistrationResponse`/`toAuthenticationResponse`), Body höchstens
64 KB, Antworten sind JSON `{ error }` mit 400/401/404/429.

**Admin:** `webFido` (Checkbox, disabled ohne `webEnabled`/`webSecure`, Hilfe `webFidoHelp`),
`staticText` `webFidoRequirements` (sichtbar nur bei `data.webFido`) und die Custom-Komponente
`WebFidoKeys` (src-admin, class-based) mit der Liste der Schlüssel (Name, registriert, zuletzt
benutzt, Transports) und Löschen – über `sendTo` `webFidoList` →
`{ credentials, active, configured, secure }` und `webFidoDelete` `{ id }` → `{ ok, credentials }`
in `main.ts`. Der Store wird dort bei Bedarf geladen (`getFidoStore()`), auch wenn FIDO2 gerade
nicht aktiv ist.

**Grenzen:** keine Attestation-Prüfung (`none`), kein Nutzer-Konzept (ein Schlüssel öffnet alle
Web-Panels wie die PIN), keine Discoverable-Credential-Anmeldung ohne `allowCredentials`,
Challenges überleben keinen Neustart, keine Synchronisierung zwischen mehreren Adapter-Instanzen.
Eine echte Authenticator-Antwort lässt sich im Test nicht erzeugen – die Verify-Pfade werden in
`fido.test.ts`/`web-server.test.ts` mit injizierten Verifier-Funktionen (`FidoVerifiers`)
getestet, die Options-Erzeugung und die Ablehnung kaputter Antworten mit der echten Bibliothek.

### 2.6 WebSocket-Frames (JSON, ein Frame pro Nachricht)

Server → Client:

```jsonc
{ "t": "hello", "model": "eu", "topic": "…", "name": "…",
  "friendlyName": "…", "tftVersion": "5.1.1", "kind": "clone" | "web" }
// topic = Topic des Endpoints (echtes Panel bzw. eigenständiges Web-Panel), name = Name des
// Panels (= id), tftVersion = bekannte TFT-Version des Modells, sonst "1.0.0"
{ "t": "cmd", "p": "entityUpd~…", "seq": 17 }   // CustomSend-Payload, unverändert
{ "t": "buzzer", "p": "1,1,1" }                 // Tasmota-Buzzer-Argument, unverändert
{ "t": "bye", "reason": "…" }
```

Client → Server:

```jsonc
{ "t": "ack", "seq": 17 }                 // → stat/RESULT {"CustomSend":"Done"} (einmal pro seq)
{ "t": "recv", "p": "event,…" }           // → tele/RESULT {"CustomRecv":"event,…"}
```

Pflichten des Clients (identisch zum echten Display):

1. Nach `hello` sofort `recv` mit `event,startup,<hmiProjectVersion>,<model>,<tftVersion>`
   senden (`hmiProjectVersion` ist eine Zahl wie bei der echten HMI, der Adapter liest
   sie nicht aus; `model` und `tftVersion` aus `hello`).
2. **Jeden** `cmd`-Frame nach der Verarbeitung mit `ack` (mit dessen `seq`) quittieren.
3. Nach einem Seitenwechsel durch `pageType~…` zusätzlich
   `recv` mit `event,renderCurrentPage,<pageType>` senden (siehe `HMI/Readme.md`,
   Abschnitt "Messages from Nextion Display").
4. Timeout und Dimmode wie die HMI: nach `timeout~<s>` Sekunden ohne Berührung
   `event,sleepReached,<pageType>` senden; `dimmode~low~high~bg~text~…` steuert die
   dargestellte Helligkeit (low im Screensaver, high bei Aktivität). Im Screensaver gilt
   `timeout~<s>` als Zeit bis zum **erneuten Dimmen** nach einem Weck-Tipp (lokal, ohne
   Ereignis; 0 = bleibt hell), siehe 3.4 „Screensaver“.
5. Auf `pageType~pageStartup` die Startseite zeigen **und** das Startup-Event aus
   Punkt 1 erneut senden. Der Adapter setzt das Panel offline, wenn fünf Nachrichten
   nicht quittiert wurden, und schickt dann alle 5 s `pageType~pageStartup`, bis das
   Startup-Event kommt (so verhält sich auch die echte HMI, die auf der Startseite das
   Event wiederholt).
6. `bye` beendet die Verbindung (`reason`: `unknown panel`, `panel removed`, `shutdown`).
   `unknown panel` und `panel removed` sind endgültig: der Client zeigt den Grund mit
   „Seite neu laden" und verbindet nicht automatisch neu. `shutdown` ist **nicht**
   endgültig – der Adapter wird regelmäßig neu gestartet (Konfig-Änderung im Admin), der
   Client zeigt „Adapter beendet – warte auf Neustart" und läuft in den normalen
   Reconnect-Backoff (1 s … 30 s), bis das nächste `hello` kommt. Damit das `bye shutdown`
   die Browser erreicht, räumt `onUnload` erst den Controller (→ `VirtualPanelManager.
   deleteAll()`) und dann den Web-Server ab. Bei einem Verbindungsabbruch ohne `bye`
   verbindet der Client ebenfalls neu; bei Ablehnung des Upgrades mit 401 lädt er die
   Seite neu (PIN-Seite).
7. Offline-Overlay: sobald die Verbindung nicht `open` ist (oder ein `bye` kam), legt
   `DeviceFrame` ein Overlay über die ganze Stage (entsättigt/abgedunkelt, Kasten mit
   MDI-Icon und Text de/en, `data-overlay`, `data-status`/`data-bye` wie bisher). Es wird
   erst nach 500 ms sichtbar, damit der erste Verbindungsaufbau nicht flackert; Tipps
   erreichen die Seite nicht mehr, die Hardware-Buttons sind deaktiviert. Nach dem
   nächsten `hello` verschwindet es.

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
    components/StartupPage.tsx    # Boot-Animation der HMI (pageSplash/pageStartup)
    components/startup/           # sequence.ts (Takt/Banner), pictures.ts, Frames als WebP
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
    global: GlobalState;         // time, timeIcon, date, dim, timeout, model, sleeping, awake
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

- `CardProps.openPopup(popup, id, title?, icon?, iconColor?)` wechselt lokal auf das Popup-Modul
  mit `pageArgs = [id, title, icon, iconColor]` (`iconColor` = RGB565 der Entity als String,
  leer wenn unbekannt), merkt sich die Karte und sendet das `pageOpenDetail`-Event.
  Ein rohes `send('event,pageOpenDetail,…')` wechselt ebenfalls (ohne Titel/Farbe); zeigt das
  Popup schon, bleibt es (Blättern in popupInSel).
- Kopf-Icon-Farbe (`popupHeaderIconColor` in `popupSlider/fields.ts`): die HMI zeichnet das
  Kopf-Icon eines Popups in der Farbe, die das Item auf der vorigen Seite hatte. Popups ohne
  Farbe im Detail-Payload (popupSlider, popupShutter, popupShutter2) nehmen `pageArgs[3]`;
  Popups mit eigener Farbe im Payload (popupFan, popupInSel, popupTimer, popupThermo) zeigen
  diese, bis sie eintrifft `pageArgs[3]`; ohne beides die Vordergrundfarbe. popupLight reicht
  die Farbe an popupInSel (Effektliste) weiter.
- `bExit` (über `press` oder `send`) kehrt lokal zur gemerkten Karte zurück; der Adapter
  schickt die Karte danach ohnehin erneut (`setActivePage(true)`).
- Ein vom Adapter gesendetes `pageType` verwirft die gemerkte Karte.
- Timeout in Popups: nach `timeout` Sekunden sendet der Store `event,buttonPress2,<id>,bExit`
  statt `sleepReached` und kehrt zur Karte zurück. `popupNotify`/`popupNotify2` steuern den
  Timeout selbst über das `timeout`-Feld ihres Payloads (0 = bleibt offen), der globale
  Timer pausiert dort.
- `popupNotify`/`popupNotify2` werden weiterhin vom Adapter per `pageType` geöffnet.

**Screensaver: Wecken, erneutes Dimmen, Indikatoren** (Vorgabe Tim, 2026-10-25, Verhalten
des echten Panels). Der Wach-Zustand liegt im Store (`global.awake`), nicht in der
Komponente, damit `brightness` (DeviceFrame) und die Karte dieselbe Quelle lesen:

- Beim Betreten eines Screensavers (`pageType~screensaver*`) ist das Display **gedimmt**
  (`global.sleeping = true`, `global.awake = false`, `brightness` = standby/active).
- Der **erste Tipp** hebt nur das Dimmen auf: `press`/`send` aus dem Screensaver setzt
  `awake = true` (`brightness` 100) und startet den Re-Dim-Timer mit `global.timeout`
  Sekunden (0 = nie wieder dimmen). An den Adapter geht dabei der normale Screensaver-Druck
  `event,buttonPress2,screensaver,bExit,<taps>` – ob er darauf (oder erst beim zweiten Tipp)
  zur Hauptseite wechselt, entscheidet der Adapter mit seiner Doppelklick-Einstellung.
  `<taps>` zählt die Tipps seit Anzeige des Screensavers ohne Zeitfenster – das echte Panel
  kennt keinen Doppeltipp, zwei beliebige Tipps ergeben `bExit,2` (`nextTap`).
  Swipes wecken ebenso (`…,screensaver,swipe<Richtung>`).
- Jede weitere Interaktion im wachen Screensaver (Tipp, Swipe, Indikator, Pointer-down auf
  der Bühne via `touch`) startet den Re-Dim-Timer neu. Läuft er ab, dimmt der Store lokal
  (`awake = false`), **ohne** Ereignis. Ein `timeout~` im wachen Zustand übernimmt die neue
  Dauer. Seitenwechsel (`pageType`, `reset`, `destroy`) räumen Timer und Zustand ab.
- `touch()` (Pointer-down der Bühne) weckt **nicht** selbst, sondern nur das Ereignis, mit dem
  die Geste endet (`press`/`send`). So liest die Karte beim Pointer-up noch den Wach-Zustand
  vom Beginn der Geste.
- **Indikator-Icons** (Advanced-Layout, untere Reihe) senden `event,buttonPress2,<id>,button`
  gedimmt wie wach – das echte Panel tut das ebenso (Adapter-Log nspanel6, 2026-10-25) und
  zählt den Tipp nie als Screensaver-Druck. Der Tipp weckt das Display wie jede Berührung.
  Was der Adapter daraus macht (Option „Indikatoren als Tasten“ an: Aktion der Entity; aus:
  Hauptseite), ist bei Hardware und Web gleich. Entscheidung als reine Funktion
  `indicatorTapTarget(id)` in `cards/screensaver/interaction.ts` (dort auch Tap-Zähler
  `nextTap` und `swipeAction`), Tests ohne DOM.

### 3.5 Darstellung

- Bühne 480×320 (`eu`, `us-l`) bzw. 320×480 (`us-p`), schwarzer Hintergrund, Skalierung
  per `transform: scale()` auf die Viewport-Größe, Seitenverhältnis bleibt.
- Farben kommen als RGB565-Dezimalzahl (`color565ToCss`).
- Icons sind Glyphen aus dem Private-Use-Bereich; `Icon` löst Glyphe → MDI-Name
  (`glyph-map.json`, generiert aus `src/lib/const/icon_mapping.ts`) → SVG-Pfad
  (`mdi-paths.json`, generiert aus `@mdi/svg`). Unbekannte Glyphe: Platzhalter.
- Dim: Helligkeit **und** Kontrast der Bühne werden aus `dimmode` abgeleitet
  (CSS `filter: brightness() contrast()`, low im gedimmten Screensaver, high aktiv und im
  geweckten Screensaver – `PanelStore.brightness`, siehe 3.4), kein reines Deckkraft-Overlay.
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
    /** seq des cmd-Frames, undefined bei einem Backend ohne seq */
    onCommand(cb: (payload: string, seq: number | undefined) => void): void;
    onBuzzer(cb: (payload: string) => void): void;
    onStatus(cb: (status: 'connecting' | 'open' | 'closed') => void): void;
    /** Sitzung vom Server beendet (`bye`); `shutdown` → Reconnect-Backoff, sonst endgültig */
    onBye(cb: (reason: string) => void): void;
    /** quittiert den Frame mit dieser seq (ohne seq: {t:'ack'} wie früher) */
    ack(seq: number | undefined): void;
    recv(payload: string): void;
}
```

Reconnect (2026-10-25): vor jedem Neuverbinden fragt `WsTransport` `GET /auth/check` ab; `401`
lädt die Seite neu (PIN-Seite), alles andere verbindet mit Backoff 1 s … 30 s neu. Ein `hello`
ohne gültiges `kind` wird verworfen.

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
`#` sind Kommentare, `@sleep <ms>` wartet, `@touch` berührt die Bühne, `@click <selector>`
tippt das erste passende Element in der Bühne an (z. B. `[data-role="tile"][data-id="4?5"]`;
das Frontend öffnet dann selbst das Popup, die folgenden Zeilen spielen die Antwort des
Adapters ein). Das Skript gibt am Ende aus, welche Events das Frontend gesendet hätte
(`ack`, `event,…`).

Mock-Modus: `http://localhost:4174/<topic>?mock=1` öffnet keinen WebSocket; stattdessen gibt
es `window.__panel = { dispatch(raw), sent, hello }` (Hello-Default: Modell `eu`,
TFT 5.1.1). Damit lässt sich eine Karte auch von Hand in der Browser-Konsole füttern.

## 4. Build und Qualität

- Root `package.json`: Skript `build:web` (`cd src-web && npm run build`), `build`
  bleibt für den Adapter. `www/` ist bereits in `files` enthalten.
- Vor jedem Commit: `npm run lint`, `npm run check`, `npm run test`, `npm run build`
  (Root) und `npm run lint` / `npm run build` in `src-web`.
- Changelog-Eintrag in `README.md` unter `### **WORK IN PROGRESS**`.
