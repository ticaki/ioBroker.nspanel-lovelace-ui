# Tasmota `UrlFetch` über Node.js HTTP-Server — Live-getestet 2026-05-04

## Ergebnis

**Berry 10 (`tasmota/berry/10/autoexec.be`, 16076 B) erfolgreich** über reinen Node.js `http.createServer` an Tasmota ausgeliefert. Berry-11-Fallback nicht benötigt.

| Schritt | Beleg |
|---|---|
| Self-Test localhost | `HTTP 200, 16076B, 4.7 ms` |
| Self-Test über LAN-IP `192.168.178.65:8766` | `HTTP 200, 16076B, 1.0 ms` |
| SHA256 Quelle ↔ ausgeliefert | identisch `0ad17130…ad0` |
| Tasmota `UrlFetch` (Server-Log-Zeile) | `192.168.1.182 GET /autoexec.be -> 200 16076B (0ms)` |
| Tasmota `/ufsd`-Listing nach Fetch | `autoexec.be 2026-05-04T16:24:05 16076` |
| Nach `Restart 1`, Uptime 8 s | `{"nlui_driver_version":"10"}` |

## Server — minimal, keine Dependencies

`/tmp/serve_autoexec.js`:

```js
#!/usr/bin/env node
const http = require('node:http');
const { readFileSync, statSync } = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const get = (k, d) => {
    const a = args.find(x => x.startsWith(`--${k}=`));
    return a ? a.split('=').slice(1).join('=') : d;
};

const filePath = path.resolve(get('file'));
const port = Number(get('port', '8766'));
const bind = get('bind', '0.0.0.0');

if (!filePath) { console.error('--file=<path> required'); process.exit(2); }

const buf = readFileSync(filePath);
const size = statSync(filePath).size;

const server = http.createServer((req, res) => {
    const t0 = Date.now();
    const ip = req.socket.remoteAddress;
    if (req.method === 'GET' && req.url === '/autoexec.be') {
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(size),
            'Cache-Control': 'no-store',
            'Connection': 'close',
        });
        res.end(buf);
        console.log(`[${new Date().toISOString()}] ${ip} ${req.method} ${req.url} -> 200 ${size}B (${Date.now()-t0}ms)`);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain', 'Connection': 'close' });
        res.end('not found');
        console.log(`[${new Date().toISOString()}] ${ip} ${req.method} ${req.url} -> 404`);
    }
});

server.listen(port, bind, () => {
    console.log(`Serving ${filePath} (${size} B) on http://${bind}:${port}/autoexec.be`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('SIGINT',  () => server.close(() => process.exit(0)));
```

### Verwendete Konfiguration

| Parameter | Wert |
|---|---|
| Node-Version | `v22.21.0` |
| Bind | `0.0.0.0` |
| Port | `8766` (Python-Server auf 8765 blieb unberührt — keine Port-Kollision) |
| Pfad | exakt `/autoexec.be` (alles andere → 404, kein Directory-Listing) |
| Methode | nur `GET`, kein Range, kein Keep-Alive (`Connection: close`) |
| Datei | komplett in Buffer geladen, einmalig — `res.end(buf)` |

### Antwort-Header

```http
HTTP/1.1 200 OK
Content-Type: application/octet-stream
Content-Length: 16076
Cache-Control: no-store
Connection: close
```

`Content-Type: application/octet-stream` weil die Datei binär behandelt werden soll. `text/plain` funktioniert wahrscheinlich genauso gut (Tasmota interpretiert nichts), wurde aber nicht gegengetestet — `application/octet-stream` ist neutraler.

`Content-Length` exakt setzen ist wichtig, weil Tasmota-Berry beim TFT-Flash auf den `Content-Length`-Header parst (siehe `doc/diagnose_2026-05-03_final.md` §2). Für `.be`-UrlFetch ist es nicht zwingend, schadet aber nie.

`Connection: close` zwingt Tasmota nicht in einen Keep-Alive-Zyklus. Tasmotas HTTP-Client öffnet pro `UrlFetch` ohnehin neue Connection.

## Ablauf — exakt reproduzierbar

```bash
# 1. Server starten (Berry 10 Quelle)
node /tmp/serve_autoexec.js \
  --file=/home/tim/ioBroker.nspanel-lovelace-ui/tasmota/berry/10/autoexec.be \
  --port=8766 --bind=0.0.0.0 \
  > /tmp/serve_autoexec.log 2>&1 &

# 2. Self-Test (sollte HTTP 200 + erwartete Größe + SHA256-Match zeigen)
curl -sS -m 5 -o /tmp/served.be -w '%{http_code} %{size_download}B\n' \
  http://192.168.178.65:8766/autoexec.be
sha256sum tasmota/berry/10/autoexec.be /tmp/served.be   # gleicher Hash

# 3. Tasmota holt Datei selbst per UrlFetch
curl -sS -m 30 'http://192.168.1.182/cm' --data-urlencode \
  'cmnd=Backlog UfsDelete autoexec.be; UfsDelete autoexec.bec; UrlFetch http://192.168.178.65:8766/autoexec.be'
# Antwort: {}

# 4. 2-3 s warten, dann Listing prüfen
curl -sS 'http://192.168.1.182/ufsd' | grep -oE 'autoexec\.be.{0,200}'
# zeigt: autoexec.be ... 2026-05-04T16:24:05    16076 ...

# 5. Restart + Verify nach ~5-15 s
curl -sS 'http://192.168.1.182/cm?cmnd=Restart%201'
sleep 8
curl -sS 'http://192.168.1.182/cm?cmnd=GetDriverVersion'
# {"nlui_driver_version":"10"}

# 6. Server beenden
kill %1   # bzw. pkill -f serve_autoexec.js
```

## Warum das relevant ist

`doc/tasmota_file_upload.md` dokumentierte bisher nur den **Python**-Pfad (`python3 -m http.server`). Der Adapter ist Node-basiert und sollte keine Python-Abhängigkeit voraussetzen. Dieser Test belegt: ein Node-eigener `http.createServer` reicht — keine externen npm-Dependencies, keine Frameworks. Drop-in-Ersatz für die Python-Variante.

Die TypeScript-Skizze in `doc/tasmota_file_upload.md` Schritt 1 (`serveFileForFetch`) ist damit live verifiziert. Einziger inhaltlicher Unterschied dieser Test-Implementierung: `Connection: close` und `Cache-Control: no-store` zusätzlich gesetzt — beides defensiv, schadet nie.

## Pitfalls die hier *nicht* aufgetreten sind, die aber bekannt sind

1. **Node-`http`-Server akzeptiert standardmäßig keine Range-Requests.** Tasmota `UrlFetch` für `.be`-Files macht kein Range — funktioniert. Für TFT-Flashing (`FlashNextionAdv`) sendet Tasmota `Range:` Header und erwartet `206 Partial Content`. Der hier gezeigte Server würde das **nicht** korrekt bedienen — er ist explizit nur für `.be`-Datei-Fetch. Für TFT-Flash bleibt `nspanel.de` o.ä. (oder ein Server mit Range-Support).

2. **Cross-Subnet-Setup** (Adapter `192.168.178.65` ↔ Tasmota `192.168.1.182`) funktionierte trotz `bind=0.0.0.0` und unterschiedlicher Subnetze, weil der lokale Router/VPN dazwischen routet. `ip route get 192.168.1.182` zeigt: `via 192.168.178.1 dev ens18 src 192.168.178.65` — die Source-IP `192.168.178.65` ist die, die im `UrlFetch`-URL steht.

3. **Port 8765 war besetzt** durch den noch laufenden Python-Server aus dem v11-Deploy-Lauf. **Lösung:** Node auf 8766. Generell: Adapter sollte freien Port suchen statt fix 8765.

## Konsequenz für `getBerryInstallUrl` (`src/main.ts:2503`)

Aktuell hartcodiert auf `${this.config.berryUrl}/${version}/autoexec.be` (Repo-URL). Mit der hier verifizierten Variante kann der Adapter optional einen lokalen Node-Server hochfahren und die URL darauf zeigen lassen — vollständig offline-fähig. Die in `doc/tasmota_file_upload.md` gezeigte `serveFileForFetch`-Skizze ist damit produktionstauglich; vor Einbau noch:

- Port-Konflikt-Erkennung (`server.on('error', ...)` auf `EADDRINUSE`, dann nächsten Port versuchen)
- Server nach erfolgreichem Tasmota-Fetch (Server-Log-Zeile) wieder schließen — kein Dauerläufer
- IP-Auswahl per `ip route get <tasmotaIp>` analog zur Adapter-Heuristik

## Quellen

- Test-Skript: `/tmp/serve_autoexec.js` (Code oben dieser Doku eingebettet)
- Server-Log dieses Laufs: `/tmp/serve_autoexec.log`
- Test-Datei: `tasmota/berry/10/autoexec.be` (16076 B, sha256 `0ad17130…ad0`)
- Vorlauf: `doc/tasmota_file_upload.md`, `doc/v11_deploy_report_2026-05-04.md`
