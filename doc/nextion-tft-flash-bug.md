# Nextion TFT-Flash schlägt fehl: `flash_size = 0`

**Gerät:** NSPanel Flur (`192.168.1.182`) · Tasmota `15.4.0 (release-tasmota32)` · Berry-Driver `nlui_driver_version: 10`
**Display:** `NX4832F035_011C` (480×320)
**TFT:** `http://nspanel.de/nspanel-v5.1.1.tft` — 12 227 824 Bytes, HTTP 206 mit `Content-Length` server-seitig korrekt

## Bug-Charakter: Race Condition / Flake

Zwei aufeinanderfolgende Läufe mit **identischem Code, identischer URL, identischem Gerät**:

| Run | Verhalten |
|---|---|
| 1 (~13:13) | `whmi-wris 0,921600,res0` → Berry-`type_error`-Exception → Display hängt |
| 2 (~14:06) | `whmi-wris 12227824,921600,res0` → Flash läuft sauber durch |

→ Es ist **kein deterministischer Codefehler**, sondern eine Race Condition im HTTP-Header-Read in `open_url_at`. Das macht die Wurzel schwer pinpointbar (siehe „Offene Hypothesen" unten), aber **nicht weniger real**: beim Fehlerfall hängt das Display und braucht Power-Cycle.

## Belegbare Fakten — Fehler-Lauf (Run 1)

```log
13:13:24.025 NXP: Nextion command sent = 'connect'
13:13:24.150 NXP: Received Raw         = comok 2,30614-0,NX4832F035_011C,...
13:13:24.178 NXP: Nextion command sent = whmi-wris 0,921600,res0               ← FILESIZE = 0
13:13:24.564 NXP: Received Raw         = bytes('05')
13:13:24.566 BRY: Exception> 'type_error' - unsupported operand type(s) for <: 'nil' and 'int'
```

Direkt belegbar:
- `flash_size` zum Zeitpunkt des `whmi-wris` ist **0** (Hex der Bytes verifiziert).
- Berry-Exception bei einem `<`-Vergleich, ~2 ms nach `0x05`-ACK.
- `begin_nextion_flash` lief nachweislich (DRAKJHSUYDGBNCJHGJKSHBDN/recmod=0/connect alle vorhanden).

**Filter-Lücke**: in Run 1 war `FLH:` nicht im Monitor-Filter — die Berry-Driver-internen Logs aus `open_url_at` (`FLH: host:`, `FLH: Connected:`, `FLH: HTTP Respose is 200 OK`, `FLH: Flash file size: <wert>`) wurden nicht mit erfasst. Damit ist offen, **welcher** Pfad in `open_url_at` real versagt hat.

## Belegbare Fakten — Erfolgs-Lauf (Run 2)

```log
14:06:15.990 FLH: host: nspanel.de, port: 80, get: /nspanel-v5.1.1.tft
14:06:16.051 FLH: Connected:true
14:06:16.153 FLH: Retry 2                                                       ← Retry-Loop 1× ausgelöst (~200ms gewartet)
14:06:16.395 FLH: HTTP Respose is 200 OK or 206 Partial Content
14:06:16.406 FLH: Flash file size: 12227824                                     ← Content-Length sauber geparst
14:06:16.433 NXP: Nextion command sent = 'DRAKJHSUYDGBNCJHGJKSHBDN'
14:06:16.439 NXP: Nextion command sent = 'connect'
14:06:16.444 NXP: Received Raw = bytes('1AFFFFFF')                              ← initiale Display-Antwort, harmlos
14:06:16.446 FLH: Something has gone wrong flashing display firmware [bytes('1AFFFFFF')]   ← False-Positive-Warnung im Code
14:06:16.563 NXP: Received Raw = comok 2,30614-0,NX4832F035_011C,...
14:06:16.587 NXP: Nextion command sent = whmi-wris 12227824,921600,res0         ← korrekte Filesize
14:06:16.971 NXP: Received Raw = bytes('05')
14:06:17.077 FLH: Read block - Writing: 4096 - Total: 4096 - Buffer size: 1395
14:06:17.178 NXP: Received Raw = bytes('08')
14:06:21.993 FLH: Flash offset marker 0
14:06:22.095 FLH: Read block - Writing: 4096 - Total: 8192
... (kontinuierlich, ~22 KB/s)
```

Direkt belegbar:
- Header wird gefunden, `200 OK / 206` erkannt, `Content-Length` korrekt geparst → `flash_size = 12227824`.
- `Retry 2` zeigt: die Retry-Schleife in `open_url_at` Z. 261–268 lief **einmal** ab (Delay 100 ms), dann waren Daten da.
- `1AFFFFFF` und die zugehörige `Something has gone wrong`-Warnung sind in beiden Läufen vorhanden — also **nicht kausal** für den Fehler, nur Driver-Noise vor dem `comok 2`.

## Was sich aus dem Vergleich folgern lässt

- Header WURDE in Run 1 ebenfalls gefunden, sonst wäre der Code an Z. 287 (`string.find(headers, "200 OK")`) mit Exception abgebrochen, und `begin_nextion_flash` (DRAKJHSUYDGBNCJHGJKSHBDN/connect) wäre nicht gelaufen. Diese Sequenz ist aber im Run-1-Log da → Header war nicht `nil`.
- Trotzdem war `flash_size = 0` in Run 1 — d. h. der Content-Length-Parse-Block (Z. 294–305) hat `flash_size` **nicht** überschrieben.
- Die einzige nicht-deterministische Quelle in `open_url_at` ist das `tcp.readbytes()` (Z. 273) plus Retry-Logik davor (Z. 260–268). Beides timing-abhängig vom Server-Response-Stream und dem ESP32-Network-Stack.

## Offene Hypothesen für `flash_size = 0` in Run 1

In `open_url_at` Z. 294–305:

```berry
if pos == 0
    var tag = "Content-Length: "
    i = string.find(headers,tag)
    if (i>0)
        var i2 = string.find(headers,"\r\n",i)
        var s = headers[i+size(tag)..i2-1]
        self.flash_size=int(s)
    end
    log("FLH: Flash file size: "+str(self.flash_size),3)
end
```

Plausibel (ohne Run-1-`FLH:`-Logs nicht entscheidbar):

- **A) `string.find(headers, tag)` retournierte `≤ 0`** → Block übersprungen.
  Möglich wenn der erste `tcp.readbytes()` zwar das `\r\n\r\n` enthielt (z. B. weil ein Teil des Headers + Anfang des Bodys in einem Frame kam und das `\r\n\r\n` zwischen Header und Body lag), aber der Buffer bevor `Content-Length:` schon endete oder `Content-Length:` nicht enthielt. Bei nginx-Standard-Output kommt `Content-Length` aber typischerweise im selben Frame wie `200 OK` — diese Variante wäre untypisch.
- **B) `int(s)` retournierte 0** → `flash_size = 0`.
  Möglich wenn der Slice ein Trailing-`\r` enthielt oder Berrys `int()` bei nicht-numerischem Input still `0` zurückgibt. Die Slice-Logik `headers[i+size(tag)..i2-1]` mit `i2 = position des "\r\n"` sollte korrekterweise nur Ziffern enthalten, ist aber bei seltenen Encodings nicht garantiert.

## Crash-Stelle in `write_block` (Run 1)

Code Z. 107–151. Drei `<`/`>`-Vergleiche oder Divisionen mit Class-Vars:

- Z. 111: `while size(self.flash_buff) < self.flash_block_size && self.tcp.connected()`
- Z. 121: `if size(self.flash_buff) > self.flash_block_size`
- Z. 129: `var per = (self.flash_written*100)/self.flash_size` — bei `flash_size=0` Division durch Null (kein `<`-Type-Error, scheidet aus).

`flash_block_size` ist als `static` deklariert (Z. 16). Wenn Berry `self.flash_block_size` bei `static`-Feldern als `nil` liefert (statt direkt `Nextion.flash_block_size`), wäre das eine eigenständige zweite Bug-Quelle — wird durch den Erfolgs-Lauf aber **widerlegt**: Z. 111 hat dort sauber funktioniert (`Read block - Writing: 4096`-Zeilen entstehen erst nach erfolgreichem Schleifen-Eintritt).

→ Verbleibender plausibler Crash-Pfad: Z. 111 oder Z. 121 mit `flash_buff = nil`. Würde passen falls `open_url_at` nicht bis Z. 280 (`self.flash_buff = b[(i+4)..]`) durchgelaufen ist, sondern vorher mit `nil`-headers durchfiel … aber das widerspricht wiederum der DRAKJHSUYDGBNCJHGJKSHBDN-Sequenz.

Ohne erneutem Fail-Trace mit `FLH:`-Filter und idealerweise zusätzlichen Print-Statements (siehe „Zusätzliche Logs für Diagnose" unten) ist die exakte Crash-Stelle nicht entscheidbar.

## Server-seitig sauber

Reproduktion mit identischer Anfrage (`HTTP/1.0` + `Range: bytes=0-`):

```http
HTTP/1.1 206 Partial Content
Server: nginx
Content-Length: 12227824
Content-Range: bytes 0-12227823/12227824
Accept-Ranges: bytes
```

`Content-Length` ist sauber da. Der Bug liegt im Berry-Driver-Pfad bzw. im ESP32-TCP-Stack-Timing, nicht am Hosting.

## Defensiver Fix in `open_url_at`

Sichert alle plausiblen Pfade ab — verhindert das Bricked-Display-Symptom auch wenn die Race Condition reproduziert:

```berry
# Read in Schleife bis \r\n\r\n im Buffer ist oder Timeout
var b = bytes()
var deadline = tasmota.millis() + 3000
var headers
while tasmota.millis() < deadline && headers == nil
    if self.tcp.available() > 0
        b += self.tcp.readbytes()
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

# ... bestehende 200/206-Prüfung und Content-Length-Parse ...

if pos == 0 && (self.flash_size == nil || self.flash_size <= 0)
    log("FLH: Content-Length missing or zero — aborting", 2)
    return -1
end
```

Drei Guards die der derzeitige Code nicht hat:
- Read-Loop **bis Marker oder Timeout** statt Single-Shot-`readbytes()`.
- Hartes `return -1` bei `headers == nil`.
- Hartes `return -1` bei `flash_size <= 0`.

Damit kann der Driver nie wieder mit Filesize 0 gegen die Nextion fahren. Bricked-Display-Pfad ist zu — Race Condition kommt höchstens noch als sauber abgebrochener Flash-Versuch zum Vorschein (Adapter retried oder User triggert erneut).

## Zusätzliche Logs für künftige Diagnose

Falls der Fail-Run nochmal eintritt, würde sich die Wurzel mit minimal-invasiven Print-Statements **eindeutig** pinpointen lassen:

```berry
# In open_url_at, direkt nach Z. 273 (var b = self.tcp.readbytes())
log(string.format("FLH: initial readbytes returned %d bytes", size(b)), 3)

# Nach der \r\n\r\n-Suche (nach Z. 284)
if headers == nil
    log(string.format("FLH: NO header marker in %d bytes; first 80: %s", size(b), b[0..79].asstring()), 3)
else
    log(string.format("FLH: header found at byte %d, total %d, body remainder %d", i-3, size(headers), size(self.flash_buff)), 3)
end

# Im Content-Length-Parse (rund um Z. 297-302)
log(string.format("FLH: find('Content-Length: ') = %d", i), 3)
if (i>0)
    log(string.format("FLH: content-length slice = '%s' (len=%d)", s, size(s)), 3)
    self.flash_size = int(s)
    log(string.format("FLH: int(s) = %d", self.flash_size), 3)
end

# In write_block, Anfang (vor Z. 111)
log(string.format("FLH: write_block entry: flash_buff=%s flash_block_size=%s flash_size=%s flash_written=%s",
    type(self.flash_buff), type(self.flash_block_size), type(self.flash_size), type(self.flash_written)), 3)
```

Beim Fail-Run zeigen diese Zeilen unmittelbar welche Variable die Race Condition betrifft.
