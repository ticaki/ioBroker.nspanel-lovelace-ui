# FlashNextionAdv0 via lokalem Node.js HTTP-Server — Live-getestet 2026-05-05

## Ergebnis

**FlashNextionAdv0 mit lokal servierter TFT-Datei erfolgreich.** Berry 10 führte den Flash durch, Berry 11 Fallback nicht benötigt.

| Schritt | Beleg |
|---|---|
| TFT-Datei lokal | `/tmp/nspanel-v5.1.1.tft`, 12.227.824 B |
| Server-URL | `http://192.168.178.65:8766/nspanel.tft` |
| Sofortantwort Tasmota | `{"FlashNextionAdv":"Done"}` |
| Range-Request #1 | `bytes=0-` → 206, 12.227.824 B (Komplettdatei) |
| Range-Request #2 | `bytes=10485760-` → 206, 1.742.064 B (Resume bei 10 MB) |
| GetDriverVersion nach Flash | `{"nlui_driver_version":"10"}` |
| Berry-Status nach Flash | `HeapUsed: 16, Objects: 225` — normaler Betrieb |
| Tasmota-IP | `192.168.1.182` |
| Adapter-IP (erreichbar von Tasmota) | `192.168.178.65` |

## Warum ein lokaler Server nötig ist

`FlashNextionAdv` benötigt einen HTTP-Server mit **Range-Request-Support** (`Range: bytes=X-` → `206 Partial Content`). Das Nextion-Display sendet während des Flashens Checkpoint-Offsets zurück; Berry macht dann einen neuen Range-Request ab diesem Offset (Resume-Mechanismus). Ohne `206`-Unterstützung bleibt der Flash an einem bestimmten Prozentsatz stecken.

Ein einfacher `http.createServer` ohne Range-Handling reicht **nicht** für TFT-Flash — nur für `.be`-UrlFetch (kein Range). Für TFT ist `206 Partial Content` zwingend.

## Server-Implementierung (minimal, keine Dependencies)

```js
const http = require('node:http');
const fs   = require('node:fs');

const TFT_FILE    = '/tmp/nspanel-v5.1.1.tft';
const ADAPTER_IP  = '192.168.178.65'; // ip route get <tasmota-ip> → src
const SERVER_PORT = 8766;

const buf  = fs.readFileSync(TFT_FILE);
const size = buf.length;

const server = http.createServer((req, res) => {
    const rangeHeader = req.headers['range'];
    let start = 0, end = size - 1, statusCode = 200;

    if (rangeHeader) {
        const m = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (m) {
            start      = parseInt(m[1]);
            end        = m[2] ? parseInt(m[2]) : size - 1;
            statusCode = 206;
        }
    }

    const chunkLen = end - start + 1;
    const headers  = {
        'Content-Type':   'application/octet-stream',
        'Content-Length': String(chunkLen),
        'Accept-Ranges':  'bytes',
        'Cache-Control':  'no-store',
        'Connection':     'close',
    };
    if (statusCode === 206) {
        headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
    }

    res.writeHead(statusCode, headers);
    if (req.method !== 'HEAD') res.end(buf.subarray(start, end + 1));
});

server.listen(SERVER_PORT, '0.0.0.0', () =>
    console.log(`Serving ${TFT_FILE} at http://${ADAPTER_IP}:${SERVER_PORT}/nspanel.tft`));
```

## Ablauf — exakt reproduzierbar

```bash
# 1. TFT-Datei lokal vorhanden machen (einmalig)
curl -L -o /tmp/nspanel-v5.1.1.tft 'http://nspanel.de/nspanel-v5.1.1.tft'
# 12.227.824 B

# 2. Adapter-IP ermitteln (Seite, die Tasmota sieht)
ip route get 192.168.1.182   # → src 192.168.178.65

# 3. Server starten
node /tmp/test_flash_nextion_local.js
# [Server] Bereit: http://192.168.178.65:8766/nspanel.tft (12227824 B, Range-Support: ja)

# 4. FlashNextionAdv0 triggern (wird vom Skript erledigt):
# curl 'http://192.168.1.182/cm?cmnd=FlashNextionAdv0+http%3A%2F%2F192.168.178.65%3A8766%2Fnspanel.tft'
# → {"FlashNextionAdv":"Done"}

# 5. Berry macht zwei Range-Requests:
#   bytes=0-       → 206, 12.227.824 B  (Erst-Download)
#   bytes=10485760- → 206, 1.742.064 B  (Resume nach Display-Checkpoint bei 10 MB)

# 6. Nach ~90-120 s: GetDriverVersion weiterhin "10"
# Display ist mit v5.1.1 geflasht
```

## Berry 10 → Berry 11 Fallback-Logik

Das Testskript `/tmp/test_flash_nextion_local.js` implementiert folgende Sequenz:

```
1. GetDriverVersion prüfen → Berry 10 aktiv
2. Lokalen Server starten (Range-Support)
3. FlashNextionAdv0 <lokale URL> senden
4. 5 min Status-Polling:
   - Tasmota antwortet? → Flash läuft
   - GetDriverVersion erreichbar? → Flash abgeschlossen
5. Falls nach Timeout kein Erfolg:
   → Berry 11 via Remote-UrlFetch installieren (Restart 1)
   → Erneut FlashNextionAdv0 mit Berry 11
```

Berry 11 wurde in diesem Lauf **nicht benötigt** — Berry 10 hat den Flash vollständig durchgeführt.

## Range-Request Muster (Berry 10 Verhalten)

| Request | Range-Header | Status | Bytes | Bedeutung |
|---|---|---|---|---|
| #1 | `bytes=0-` | 206 | 12.227.824 | Initialer Download ab Byte 0 |
| #2 | `bytes=10485760-` | 206 | 1.742.064 | Resume: Display-Checkpoint bei 10 MB (0xA00000) |

Der Checkpoint bei 10 MB ist displayspezifisch (NX4832F035 mit 16-MB-Flash). Bei anderen Display-Modellen kann der Offset abweichen.

## Unterschied zu `.be`-UrlFetch (Berry-Installation)

| Merkmal | `.be`-UrlFetch | TFT-FlashNextionAdv |
|---|---|---|
| Range-Request | Nein — vollständige Datei | Ja — `bytes=X-` für Resume |
| HTTP-Status | 200 | 206 Partial Content |
| Server-Komplexität | Minimal | Range-Parser erforderlich |
| Datei-Größe | ~16-22 KB | ~12 MB |
| Dokumentation | `doc/tasmota_node_server.md` | Dieses Dokument |

## Pitfalls

1. **Port-Konflikt**: Vor dem Start freien Port sicherstellen (`lsof -i :8766`). Port 8765 war durch Python-Server belegt.
2. **IP-Auswahl**: `ADAPTER_IP` muss die IP sein, die Tasmota tatsächlich sieht (`ip route get <tasmota-ip>`). Im Cross-Subnet-Setup war `192.168.178.65` korrekt, obwohl Tasmota in `192.168.1.x` liegt.
3. **buf.subarray**: Zwingend für korrekte Range-Auslieferung. `buf.slice` oder direktes Stream-Lesen ohne Offset-Beachtung führt zu korruptem Flash.
4. **Accept-Ranges: bytes** im Response-Header muss gesetzt sein — Berry prüft das bevor es Range-Requests macht.

## Quellen

- Testskript: `/tmp/test_flash_nextion_local.js`
- TFT-Datei: `nspanel-v5.1.1.tft` von `http://nspanel.de`
- Berry-Driver (Berry 10): `tasmota/berry/10/autoexec.be`
- Berry-Driver (Berry 11): `tasmota/berry/11/autoexec.be` (aus `doc/autoexec_v11.be`)
- Vorlauf: `doc/tasmota_node_server.md` (`.be`-UrlFetch ohne Range-Support)
