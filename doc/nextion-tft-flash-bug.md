# Nextion TFT-Flash schlägt fehl: `flash_size = 0`

**Gerät:** NSPanel Flur (`192.168.1.182`) · Tasmota `15.4.0 (release-tasmota32)` · Berry-Driver `nlui_driver_version: 10`
**Display:** `NX4832F035_011C` (480×320)
**TFT:** `http://nspanel.de/nspanel-v5.1.1.tft` — 12 227 824 Bytes, HTTP 200/206 sauber

## Live-Log (Auslöser: `FlashNextionAdv0`)

```log
NXP: Nextion command sent = bytes('connect')
NXP: Received Raw      = comok 2,30614-0,NX4832F035_011C,...   ← Display meldet sich korrekt
NXP: Nextion command sent = whmi-wris 0,921600,res0            ← FILESIZE = 0  (Bug!)
NXP: Received Raw      = bytes('05')                            ← Display ACKt
BRY: Exception> 'type_error' - unsupported operand type(s) for <: 'nil' and 'int'
```

Danach: Berry läuft in einen GC-Loop, `flash_mode=1` bleibt hängen, Display sitzt im TFT-Wait-Bild fest. Recovery nur per Power-Cycle.

## Wurzelursache

Datei `tasmota/berry/10/autoexec.be`, Funktion `open_url_at` (Z. 230–307):

```berry
var b = self.tcp.readbytes()              # Einmal-Read
while i < size(b) && headers == nil
    if b[i..(i+3)] == bytes().fromstring("\r\n\r\n")
        headers = b[0..(i+3)].asstring()
    else
        i += 1
    end
end
```

Bei TCP-Fragmentierung kommt der HTTP-Header **nicht in einem einzigen Read** an (Header ≈ 250 B inkl. `ETag`/`Date`). `\r\n\r\n` wird nicht gefunden → `headers = nil`.

Die nachfolgenden `string.find(headers, ...)`-Checks evaluieren auf `nil` lautlos zu False, der `return -1`-Pfad greift dadurch **nicht zuverlässig**. `flash_size` bleibt auf dem Initialwert `0`. `begin_nextion_flash` läuft trotzdem und sendet `whmi-wris 0,…`. Die Nextion ACKt jeden Wert mit `0x05`. Direkt danach knallt `write_block` (Z. 111: `while size(self.flash_buff) < self.flash_block_size`) auf einer nicht initialisierten Variable.

## Server-seitig alles sauber

Reproduktion mit identischen Headern wie der Berry-Driver (`HTTP/1.0` + `Range: bytes=0-`):

```http
HTTP/1.1 206 Partial Content
Content-Length: 12227824
Content-Range: bytes 0-12227823/12227824
Accept-Ranges: bytes
```

Der Fehler liegt **ausschließlich im Berry-Read-Loop**, nicht am Hosting.

## Vorschlag Fix in `open_url_at`

```berry
# Read bis \r\n\r\n im Buffer ist oder Timeout
var b = bytes()
var deadline = tasmota.millis() + 3000
while tasmota.millis() < deadline
    if self.tcp.available() > 0
        b += self.tcp.readbytes()
        if size(b) >= 4
            for k: 0 .. size(b)-4
                if b[k..(k+3)] == bytes().fromstring("\r\n\r\n")
                    # header komplett
                    break
                end
            end
        end
    else
        tasmota.delay(50)
    end
    # break-Logik wenn Marker gefunden
end

if headers == nil
    log("FLH: HTTP header incomplete — aborting", 2)
    return -1
end
if pos == 0 && (self.flash_size == nil || self.flash_size <= 0)
    log("FLH: Content-Length missing or zero — aborting", 2)
    return -1
end
```

Kernpunkte:
- Read-Loop **bis Marker oder Timeout**, nicht ein einzelner `readbytes()`.
- Hartes `return -1` wenn `headers == nil`.
- Hartes `return -1` wenn `flash_size <= 0` nach Parse.

Damit kann der Driver nie wieder mit Filesize 0 gegen die Nextion fahren.
