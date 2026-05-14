# Tasmota Berry-Datei (`autoexec.be`) hochladen — Verfahren

## TL;DR

**Robuste Methode** für den Adapter: lokaler HTTP-Server + `UrlFetch` an Tasmota schicken. Funktioniert garantiert in Live-Test (siehe Session-Log 2026-05-03).

```
Backlog UfsDelete autoexec.be; UrlFetch http://<adapter-ip>:<port>/autoexec.be
```

## Endpoint-Übersicht (Tasmota 15.4.0)

| Endpoint | Zweck | Funktioniert für `.be`? |
|---|---|---|
| `POST /u1` | OTA-URL setzen | irrelevant |
| `POST /u2?fsz=<size>` | Firmware-OTA mit Datei-Signatur-Check | **Nein** — Berry-Files werden mit „Dateisignatur fehlgeschlagen" abgewiesen |
| `POST /ufsu?fsz=<size>` | UFS-Filesystem-Upload (Browser-File-Manager) | Web-UI ja, **curl-multipart in Live-Test fehlgeschlagen** (HTTP 000 / „Upload abgebrochen", Datei wurde 0-Byte truncated) |
| `cmnd=UrlFetch <url>` | Tasmota holt Datei selbst per HTTP | **Ja**, robust |
| `GET /ufsd` | File-Manager-UI (HTML) | Listing, Browser-Upload-Form |
| `GET /ufsd?download=/<file>` | File-Manager-Download | für Berry-Files **unzuverlässig** (lieferte 0 Bytes obwohl Datei vorhanden) |

## Warum nicht `/ufsu` per curl?

In Live-Test 2026-05-03 hat der Endpoint `POST /ufsu?fsz=18364` mit `multipart/form-data`-Feld `ufsu`:

1. ohne `;filename=` → HTTP 200 mit „Upload abgebrochen" + Datei wurde **truncate** auf 0 Bytes geschrieben.
2. mit `;filename=autoexec.be` → identisch fehlgeschlagen.
3. mit Tempfile mit korrektem Namen `/tmp/autoexec.be` und `-F "ufsu=@/tmp/autoexec.be"` → identisch fehlgeschlagen.

Browser-Upload via `/ufsd` (manuell) funktioniert in derselben Session. Die genaue Ursache (multipart-Boundary, Header-Reihenfolge, Tasmota-Bug?) wurde nicht weiter eingegrenzt. Falls jemand diesen Pfad doch nutzen will: vorher kompletter Browser-Mitschnitt nötig (Network-Tab, exakter `Content-Type`-Header, exakte Boundary).

**Praktische Konsequenz**: nicht auf `/ufsu`-curl bauen. `UrlFetch` ist der Standard-Weg den auch der bestehende Adapter (`src/main.ts:2503` `getBerryInstallUrl`) verwendet.

## UrlFetch-Verfahren — Live-getestet

### 1. Datei lokal verfügbar machen unter HTTP

Adapter braucht einen kurz lebenden HTTP-Server, der die Datei unter dem Namen `autoexec.be` ausliefert.

In Node/TypeScript:

```typescript
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';

async function serveFileForFetch(filePath: string, port = 8765): Promise<{ url: string; close: () => void }> {
    const buf = readFileSync(filePath);
    const size = statSync(filePath).size;
    const server = createServer((req, res) => {
        // Nur den genau erwarteten Pfad bedienen, Rest ablehnen
        if (req.url === '/autoexec.be') {
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Content-Length': size.toString(),
            });
            res.end(buf);
        } else {
            res.writeHead(404).end();
        }
    });
    await new Promise<void>(resolve => server.listen(port, '0.0.0.0', resolve));
    const localIp = await getLocalIpReachableBy(/* tasmota-ip */);
    return {
        url: `http://${localIp}:${port}/autoexec.be`,
        close: () => server.close(),
    };
}
```

### 2. Lokale IP ermitteln, die der Tasmota erreichen kann

```typescript
import { networkInterfaces } from 'node:os';

function getLocalIpReachableBy(targetIp: string): string {
    // Heuristik: nimm die IPv4 deren Subnetz mit targetIp matched
    const interfaces = networkInterfaces();
    for (const ifaces of Object.values(interfaces)) {
        for (const iface of ifaces ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                if (sameSubnet(iface.address, targetIp, iface.netmask)) {
                    return iface.address;
                }
            }
        }
    }
    // Fallback: erste nicht-interne IPv4
    for (const ifaces of Object.values(interfaces)) {
        for (const iface of ifaces ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    throw new Error('No reachable local IPv4 found');
}

function sameSubnet(a: string, b: string, mask: string): boolean {
    const toInt = (ip: string) => ip.split('.').reduce((n, p) => (n << 8) + Number(p), 0);
    return (toInt(a) & toInt(mask)) === (toInt(b) & toInt(mask));
}
```

**Caveat**: in der Live-Test-Session war Adapter-IP `192.168.178.65`, Tasmota `192.168.1.182` — verschiedene Subnetze. Tasmota konnte den Adapter trotzdem erreichen (vermutlich VPN-Route). Das `sameSubnet`-Heuristik ist also nur Best-Effort. Falls falsch ermittelt: User muss IP konfigurieren können.

### 3. Tasmota anweisen die Datei zu holen

```typescript
async function uploadAutoexecToTasmota(tasmotaIp: string, fetchUrl: string): Promise<void> {
    // Backlog: alte Datei löschen, neue holen, Reboot
    const cmnd = `Backlog UfsDelete autoexec.be; UrlFetch ${fetchUrl}; Restart 1`;
    const url = `http://${tasmotaIp}/cm?cmnd=${encodeURIComponent(cmnd)}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) throw new Error(`Tasmota Backlog HTTP ${resp.status}`);
}
```

### 4. Verifikation

Nach Reboot:

```typescript
async function verifyDriverLoaded(tasmotaIp: string, expectedVersion: string): Promise<boolean> {
    // Kurz warten bis Tasmota online
    for (let i = 0; i < 10; i++) {
        try {
            const r = await fetch(`http://${tasmotaIp}/cm?cmnd=GetDriverVersion`, { signal: AbortSignal.timeout(3_000) });
            const j = (await r.json()) as { nlui_driver_version?: string };
            if (j.nlui_driver_version === expectedVersion) return true;
        } catch { /* not online yet */ }
        await new Promise(r => setTimeout(r, 2_000));
    }
    return false;
}
```

`Status 0` zusätzlich prüfen für Heap, Berry-Heap, Uptime — siehe Adapter-Code.

## End-to-End — exakt die Befehlsreihenfolge die in der Live-Session funktioniert hat

```bash
# 1. HTTP-Server (Python-Beispiel, im Adapter natürlich Node)
cd /tmp
python3 -m http.server 8765 --bind 0.0.0.0 &

# 2. Tasmota Datei abrufen lassen
curl 'http://192.168.1.182/cm?cmnd=Backlog%20UfsDelete%20autoexec.be;%20UrlFetch%20http://192.168.178.65:8765/autoexec.be'

# 3. (kurz warten — Tasmota lädt asynchron)

# 4. Restart
curl 'http://192.168.1.182/cm?cmnd=Restart%201'

# 5. Verify (nach ~10 s)
curl 'http://192.168.1.182/cm?cmnd=GetDriverVersion'
# → {"nlui_driver_version":"10"}

# 6. HTTP-Server schließen
kill %1
```

## Pitfalls / Lehre aus der Session

1. **Niemals `/u2` für Berry-Files** — bricht den Upload mit „Dateisignatur" ab und kann je nach Tasmota-Version den FS-Slot bereits resezvieren.
2. **`/ufsu` per curl** hat in dieser Session die Ziel-Datei auf 0 Bytes truncated, ohne Inhalt zu schreiben. Wenn der Adapter das einbaut: vorher Backup-Mechanismus (`UrlFetch` als zweiter Versuch falls die Datei nach Upload < erwartete Größe).
3. **Kreuz-Subnetz-Setup** funktioniert wenn ein Router/VPN dazwischen ist, aber `getLocalIpReachableBy` muss das berücksichtigen — Heuristik kann fehlgehen, daher Config-Override anbieten.
4. **Driver-Version-Check nach Reboot** ist zuverlässig: wenn Berry beim Boot autoexec.be nicht laden kann (Datei kaputt/leer), kommt von `GetDriverVersion` `Unknown command` zurück — gut auswertbar.
5. **`/ufsd?download=` ist unzuverlässig für Berry-Files** zur Größen/Inhalt-Verifikation. Statt dessen die `/ufsd`-Listing-HTML parsen oder direkt `GetDriverVersion` checken.

## Anschluss an bestehenden Adapter-Code

Der Adapter ruft heute (`src/main.ts:2503`):

```typescript
`&cmnd=Backlog UfsDelete autoexec.old; UfsRename autoexec.be,autoexec.old; UrlFetch ${this.config.berryUrl}/${version}/autoexec.be`
```

Die Logik ist identisch zur hier beschriebenen — `UrlFetch` von einer URL. Der hier dokumentierte Unterschied: **die URL kann auch der Adapter selbst sein** (lokaler HTTP-Server) statt GitHub. Vorteile:
- offline-fähig (kein Internet nötig wenn Adapter und Tasmota im selben LAN)
- patched/lokal modifizierte Berry-Versionen können sofort getestet werden ohne Repo-Push

Implementierungs-Punkt im Adapter: `getBerryInstallUrl` (`src/main.ts:2499`) hat aktuell hartcodiertes `${this.config.berryUrl}` — wenn man die lokale-Server-Variante optional machen will, dort eine Branch.
