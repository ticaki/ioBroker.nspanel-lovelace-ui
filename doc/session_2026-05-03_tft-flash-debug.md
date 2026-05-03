# Session 2026-05-03 — Debug: Nextion TFT-Update schlägt fehl

**Gerät:** NSPanel Flur · `192.168.1.182`
**Tasmota:** `15.4.0 (release-tasmota32)`, Hardware ESP32-D0WD-V3
**Berry-Driver:** `nlui_driver_version: 10`
**TFT-URL:** `http://nspanel.de/nspanel-v5.1.1.tft` (12 227 824 B)
**Flash-Befehl im Adapter (`src/main.ts:2490`):** `FlashNextionAdv0 <url>`

## 1. Ausgangslage

User-Anfrage: „auf dem 192.168.1.182 ist tasmota installiert, kannst du mal per telnet drauf gucken wieso das nextion tft update fehlschlägt".

Befund Vorab-Probing:
- Telnet-Port 23 zu — Tasmota hat keinen klassischen Telnet-Daemon, Debug läuft über Web-Console (`/cs?c2=<id>`).
- HTTP-API erreichbar (Port 80 offen).
- Status: Heap 88 KB, BootCount 20, Berry läuft (`HeapUsed: 16 KB, Objects: 220`).
- Driver `121` (NSPanel-C-Driver) im Build mit `!` deaktiviert — irrelevant, weil das Projekt einen **eigenen Berry-Driver** als `autoexec.be` mitbringt.
- `GetDriverVersion` → `{"nlui_driver_version":"10"}` → Berry-autoexec ist geladen.

## 2. Eigenverschuldeter Zwischenfall (wichtig für Memory)

Beim Existenz-Check des Befehls habe ich `cm?cmnd=FlashNextion` **ohne URL** abgesetzt. Tasmota antwortete `{"FlashNextion":"Done"}` — das wirkte wie ein No-Op, ist aber tatsächlich der Trigger der die **Nextion in den TFT-Upload-Wartemodus** versetzt und intern `is_flashing=true` setzt. Folge:

- Display zeigte „Upload TFT…"-Wartebildschirm.
- Spätere harmlose Probes (`CustomSend`) liefen ins Log: `NXP: skipped command because still flashing`.
- Recovery nur per **Power-Cycle des Panels**, weil der Nextion-Bootloader durch `Restart 1` auf dem Tasmota nicht zurückkommt.

**Lektion:** `FlashNextion`, `FlashNextionAdv*`, `CustomSend`, `Nextion` nie ohne echte Argumente probieren, auch nicht zur Verfügbarkeitsprüfung. Existenz-Checks gehen über `Status 0`, `GetDriverVersion`, `Help`. Memory-Eintrag dazu: `feedback_tasmota_probing.md`.

## 3. Echter Flash-Versuch und Live-Trace

User gab grünes Licht (Power-Cycle erfolgt, Stand-by-Recovery per Hand möglich). Polling der Web-Console gefiltert auf relevante Tags (`NXP|NEX|TFT|FlashNextion|BRY|...`), dann Trigger:

```bash
curl 'http://192.168.1.182/cm?cmnd=FlashNextionAdv0%20http://nspanel.de/nspanel-v5.1.1.tft'
→ {"FlashNextionAdv":"Done"}
```

(`Done` = sofortiger Berry-Return, eigentlicher Flash läuft asynchron via `tasmota.set_timer(0, task)`.)

### Log-Auszug

```log
13:13:23.965 SRC: Berry
13:13:24.021 NXP: Nextion command sent = 'DRAKJHSUYDGBNCJHGJKSHBDN'
13:13:24.023 NXP: Nextion command sent = 'recmod=0'
13:13:24.025 NXP: Nextion command sent = 'connect'
13:13:24.029 NXP: Received Raw         = bytes('1AFFFFFF')
13:13:24.150 NXP: Received Raw         = comok 2,30614-0,NX4832F035_011C,...
13:13:24.177 BRY: GC from 27217 to 17715 bytes, objects freed 51/227
13:13:24.178 NXP: Nextion command sent = whmi-wris 0,921600,res0          ← FILESIZE = 0  (Bug!)
13:13:24.564 NXP: Received Raw         = bytes('05')                       ← Display ACKt
13:13:24.566 BRY: Exception> 'type_error' - unsupported operand type(s) for <: 'nil' and 'int'
```

Display: `NX4832F035_011C` (480×320, klassisches NSPanel) → korrekte Hardware für die TFT-Datei.
TFT-Header der Datei: Magic `DN2E`, Auflösung 480×320, MD5 `b82e9ac64df2aa6440c1446308125fb5` — Datei ist plausibel und korrekt für das Panel.

Nach der Exception trommelt Berry in einem GC-Loop (`GC from 29510 to 19196 bytes` alle ~50 ms), Display bleibt im Upload-Wait, Tasmota im hängenden `flash_mode=1`. Recovery per `Restart 1` (jetzt funktioniert er, weil das Panel bereits Power-Cycled wurde und der Nextion-Bootloader nicht aktiv im Flash steckt).

## 4. Wurzelursache

Datei: `tasmota/berry/10/autoexec.be`, Funktion `open_url_at(url, pos)` (Z. 230–307).

```berry
self.tcp.write(get_req)
var a = self.tcp.available()
i = 1
while a==0 && i<5
  tasmota.delay(100*i)
  a = self.tcp.available()
end
if a==0
    log("FLH: Nothing available to read!",3)
    return
end
var b = self.tcp.readbytes()                      # ← EINMAL-READ
i = 0
var headers
while i<size(b) && headers==nil
    if b[i..(i+3)]==bytes().fromstring("\r\n\r\n")
        headers = b[0..(i+3)].asstring()
        self.flash_buff = b[(i+4)..]
    else
        i += 1
    end
end
```

### Was schiefgeht

1. `tcp.readbytes()` liest **einmal** alles was bis dahin im Puffer steht. Bei TCP-Fragmentierung (Header ≈ 250 B inkl. `Date`/`ETag`) kann das **nur ein Teil** sein.
2. Wenn `\r\n\r\n` nicht im Buffer ist, bleibt `headers = nil` und `flash_buff` ungesetzt.
3. Die nachfolgenden `string.find(headers, "200 OK")>0`-Checks evaluieren bei `nil` lautlos zu False — der `return -1`-Pfad wird nicht zuverlässig getroffen.
4. `flash_size` bleibt auf dem Initialwert `0` (in `flash_nextion(url)` Z. 310 gesetzt).
5. `begin_nextion_flash` läuft trotzdem, sendet `whmi-wris 0,921600,res0` an die Nextion. Display ACKt jeden Wert mit `0x05`.
6. `write_block` (Z. 107–151) crasht beim ersten Aufruf weil eine Klassenvariable (vermutlich `flash_buff` oder einer der Counter) nicht initialisiert wurde — Vergleich `nil < int`.

### Server-seitig alles sauber

Identische Anfrage wie Berry (`HTTP/1.0` + `Range: bytes=0-`):

```http
HTTP/1.1 206 Partial Content
Server: nginx
Content-Length: 12227824
Content-Range: bytes 0-12227823/12227824
Accept-Ranges: bytes
```

`Content-Length` ist korrekt da. Bug liegt **ausschließlich** im Berry-Read-Loop.

## 5. Fix-Vorschlag

In `tasmota/berry/10/autoexec.be → open_url_at`:

```berry
# Read in Schleife bis \r\n\r\n im Buffer ist oder Timeout
var b = bytes()
var deadline = tasmota.millis() + 3000
var headers
while tasmota.millis() < deadline && headers == nil
    if self.tcp.available() > 0
        b += self.tcp.readbytes()
        # Suche \r\n\r\n
        var k = 0
        while k < size(b) - 3
            if b[k..(k+3)] == bytes().fromstring("\r\n\r\n")
                headers = b[0..(k+3)].asstring()
                self.flash_buff = b[(k+4)..]
                break
            end
            k += 1
        end
    else
        tasmota.delay(50)
    end
end

if headers == nil
    log("FLH: HTTP header incomplete — aborting", 2)
    return -1
end

# ... bestehende Status-Code- und Content-Length-Checks ...

if pos == 0 && (self.flash_size == nil || self.flash_size <= 0)
    log("FLH: Content-Length missing or zero — aborting", 2)
    return -1
end
```

**Drei harte Guards** die der derzeitige Code nicht hat:
1. Header-Read **bis Marker oder Timeout**, nicht ein Single-Shot-`readbytes()`.
2. `return -1` wenn `headers == nil`.
3. `return -1` wenn `flash_size <= 0` nach Parse — dann läuft kein `whmi-wris 0,…`.

Damit kann der Driver nie wieder mit Filesize 0 gegen die Nextion fahren und das Display kann nicht mehr durch dieses spezifische Race in den hängenden Wartemodus geraten.

## 6. Empfehlungen für den Adapter

- Der Adapter (`src/main.ts:2490`) sollte vor `FlashNextionAdv0` die TFT-Größe per HTTP-HEAD selbst bestimmen und im Adapter-Log mit ausgeben — hilft beim Debuggen wenn der Berry-Code wieder ins Leere läuft.
- Falls `FlashNextionAdv0` (Proto v1 @ 921600 Baud) wiederholt fehlschlägt: `FlashNextionAdv2` (v1 @ 115200) als Fallback. Index-Mapping siehe `tasmota/berry/10/autoexec.be:425–453`.

## 7. Status nach der Session

- Tasmota wurde nach jedem hängenden Flash mit `Restart 1` zurückgesetzt.
- Display wurde **einmal per Hand stromgetrennt** durch User (nach meinem Probing-Fehler).
- `is_flashing`-Flag aktuell sauber, Berry-Driver Version 10 weiterhin geladen.
- TFT-Datei selbst ist intakt und passt zum Display.

## Quellen

- Adapter-Code: `src/main.ts:2488–2497` (Befehl-Konstruktion `FlashNextionAdv0 <url>`)
- Berry-Driver: `tasmota/berry/10/autoexec.be:230–315` (`open_url_at`, `flash_nextion`)
- Berry-Driver: `tasmota/berry/10/autoexec.be:107–152` (`write_block` — Crash-Stelle)
- Berry-Driver: `tasmota/berry/10/autoexec.be:425–474` (`flash_nextion_adv` mit idx-Mapping)
