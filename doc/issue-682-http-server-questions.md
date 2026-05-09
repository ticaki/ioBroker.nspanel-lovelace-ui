# Issue #682 — Interner HTTP-Server für File-Upload

Dieses Dokument sammelt offene Fragen vor der eigentlichen Implementierung.
Nach Beantwortung kann es wieder gelöscht werden.

## Kurzanalyse des Bestands

- TFT-Flash heute: `FlashNextionAdv0 ${this.config.tftUrl}/<file>.tft`
  (siehe `src/main.ts:2489`).
- `tftUrl` ist konfigurierbar (default `http://nspanel.de`), Override in
  `admin/jsonConfig.json5` Tab "developer" (Zeile 3240) und im Native
  `io-package.json:190`.
- Bereits eingebaute Server-Infrastruktur: `MQTTServerClass` in
  `src/lib/classes/mqtt.ts:374` (Aedes + TLS, Lifecycle gleich an
  `mqttServer`-Konfig gekoppelt). Das Muster (Klasse mit
  `start/destroy` und Erzeugung in `main.ts onReady`) sollte für den
  HTTP-Server übernommen werden.
- AdminUI: `_pageGlobalSettings` Panel in `admin/jsonConfig.json5:21`
  rendert die Custom-Komponente
  `src-admin/src/PageGlobalSettings.tsx`. Hier soll laut Issue der
  Aktivierungs-Toggle hin.

## Teilaufgabe (this PR)

> "Erstelle einen internen http-Server für File-Upload."

Damit der Patch klein und reviewbar bleibt, beschränke ich den
Scope auf:

1. Neue Klasse `HTTPServerClass` (analog `MQTTServerClass`).
2. Aktivierung über neues Native-Feld + Toggle in "globalConfig".
3. Endpunkte zum **Hochladen** und **Ausliefern** der TFT-Datei(en).
4. Verzeichnis-Layout im ioBroker-Fileservice.

Die Verdrahtung von `tftUrl` auf den lokalen Server (sodass das
Panel statt `http://nspanel.de` den Adapter abholt) ist **nicht**
Teil dieser Teilaufgabe — kann in einem Folge-PR gemacht werden.

## Offene Fragen

### 1. Port

- Soll der Port konfigurierbar sein (Default-Vorschlag: `8092`),
  oder fest verdrahtet?
- Falls konfigurierbar: gleicher Pattern wie `mqttPort`
  (`getPortAsync`, Fail wenn belegt) — okay so?

### 2. Bind-Adresse

- Bind auf `0.0.0.0` (LAN-erreichbar — nötig, weil das
  NSPanel/Tasmota im LAN den Server abruft) oder zusätzlich
  Whitelist/Filter (z. B. nur erreichbar wenn Quelle = bekannte
  Panel-IP aus `config.panels`)?

### 3. HTTP only oder auch HTTPS

- Tasmota/`FlashNextionAdv0` erwartet `http://…` (auch das aktuelle
  `tftUrl`-Default ist HTTP). Reicht HTTP-only für die V1?

### 4. Authentifizierung

- **Upload-Endpoint:** ohne Auth (nur LAN, vertrauenswürdig)? Mit
  Basic-Auth (`mqttUsername`/`mqttPassword` wiederverwenden)? Eigene
  Credentials? Token aus `pw1` (Service-Pin)?
- **Download-Endpoint** (vom Panel abgerufen): vermutlich ohne Auth,
  weil Tasmota `FlashNextionAdv0` keine Header setzt — bestätigen?

### 5. Quelle des Upload

Wer lädt hoch?
- a) **AdminUI**: Datei-Picker in `PageGlobalSettings.tsx`, Upload
     per `sendTo` an den Adapter, Adapter schreibt in den eigenen
     Fileservice. (Einfacher, aber kein "echter" HTTP-Server für
     Upload.)
- b) **Externer HTTP-Client** (curl/Browser) postet direkt an den
     internen Server (`POST /tft`). (Ist näher am Wortlaut des
     Issues "http-Server für File-Upload", aber komplexer.)
- c) **Beides**.

Mein Vorschlag: **(a)** als V1 — passt zum bestehenden
`pageGlobalSettings`-Toggle und vermeidet eine zweite parallele
Upload-Schnittstelle.

### 6. Speicherort der TFT-Datei

- ioBroker-Fileservice unter `nspanel-lovelace-ui.<instance>/tft/…`
  (analog zu den `keys/`-Dateien)?
- Lokales Verzeichnis (`<adapterDir>/tft/`)?
- Welche Dateinamen-Konvention? Ich würde `nspanel-v<version>.tft`,
  `nspanel-eu-v<version>.tft`, `nspanel-us-l-v<version>.tft`,
  `nspanel-us-p-v<version>.tft` spiegeln (siehe `getTFTVersionOnline`,
  `src/main.ts:2488`).

### 7. Mehrere Modelle / Versionen parallel

- Soll der Server mehrere TFT-Files gleichzeitig hosten (alle
  Modelle / mehrere Versionen)?
- Oder nur **eine aktive** Datei pro Modell (alte Datei wird beim
  Upload überschrieben)?

### 8. Routen (falls eigener Upload-Endpoint)

Vorschlag:

| Methode | Pfad | Zweck |
|---|---|---|
| `GET`  | `/tft/<filename>` | Datei für `FlashNextionAdv0` ausliefern |
| `POST` | `/tft` (multipart) | Datei hochladen (Auth?) |
| `GET`  | `/tft/list`        | Vorhandene Dateien auflisten |
| `DELETE` | `/tft/<filename>` | Datei löschen (Auth?) |

Sind die Pfade okay? Wird `GET /version.json` ebenfalls gebraucht
(für späteren Switch von `versionJsonUrl`)?

### 9. AdminUI-Toggle

- Neues Native-Feld (Vorschlag): `internalTftHttpServer: boolean`
  (Default `false`).
- Optional zusätzlich: `internalTftHttpServerPort: number`
  (Default `8092`), nur sichtbar wenn aktiviert.
- Soll die `tftUrl` automatisch auf `http://<host>:<port>` umgebogen
  werden, sobald aktiviert? Oder bleibt das ein **separater**
  manueller Schritt im "developer"-Tab? (Auto-Override würde
  Anwender-Verwirrung minimieren.)

### 10. Zertifikate / Reuse vom MQTT-Server

- MQTT-Server hat selbstsignierte Keys (`mqttKeys` im Native-Objekt).
  Die werden hier vermutlich **nicht** gebraucht (HTTP only).
  Bestätigen?

### 11. Größenlimit / Safety

- Maximale Upload-Größe? (TFT-Files sind typisch <2 MB —
  Limit z. B. 16 MB?)
- Soll das Server-Module bei `unload` sauber stoppen (genau wie
  `mqttServer.destroy()`)?

---

## Vorschlag für die Reihenfolge der Folge-PRs

1. **Diese:** HTTP-Server-Klasse + AdminUI-Toggle + Upload via
   AdminUI + Download-Endpoint. Default aus.
2. Folge-PR: `tftUrl` automatisch auf den lokalen Server umbiegen,
   wenn der Toggle aktiv ist (oder neuen `useInternalTftServer`
   im `getTFTVersionOnline` auswerten).
3. Folge-PR: Berry-Files / version.json ebenfalls über den lokalen
   Server anbieten (falls gewünscht).

---

@tt-tom17 / @ticaki — bitte die obigen Punkte beantworten, dann
mache ich den ersten konkreten PR.
