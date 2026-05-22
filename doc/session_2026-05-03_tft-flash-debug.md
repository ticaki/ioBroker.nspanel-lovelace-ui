# Session 2026-05-03 — Debug: Nextion TFT-Update schlägt fehl

**Gerät:** NSPanel Flur · `192.168.1.182`
**Tasmota:** `15.4.0 (release-tasmota32)`, Hardware ESP32-D0WD-V3
**Berry-Driver:** `nlui_driver_version: 10` (geladen, nicht über `/file?download=` lesbar)
**TFT-URL:** `http://nspanel.de/nspanel-v5.1.1.tft` (12 227 824 B)
**Flash-Befehl im Adapter (`src/main.ts:2490`):** `FlashNextionAdv0 <url>`

## 1. Ausgangslage

User-Anfrage: „auf dem 192.168.1.182 ist tasmota installiert, kannst du mal per telnet drauf gucken wieso das nextion tft update fehlschlägt".

Vorab-Probing:
- Telnet-Port 23 zu — Tasmota hat keinen klassischen Telnet-Daemon, Debug läuft über Web-Console (`/cs?c2=<id>`).
- HTTP-API erreichbar (Port 80 offen).
- Status: Heap 86–95 KB, BootCount 20, Berry läuft (`HeapUsed: 16 KB, Objects: 220`).
- Driver `121` (NSPanel-C-Driver) im Build mit `!` deaktiviert — irrelevant, das Projekt bringt einen **eigenen Berry-Driver** als `autoexec.be` mit.
- `GetDriverVersion` → `{"nlui_driver_version":"10"}` → Berry-autoexec ist geladen.

## 2. Eigenverschuldeter Zwischenfall

Beim Existenz-Check des Befehls habe ich `cm?cmnd=FlashNextion` **ohne URL** abgesetzt. Tasmota antwortete `{"FlashNextion":"Done"}` — das wirkte wie ein No-Op, ist aber tatsächlich der Trigger der die **Nextion in den TFT-Upload-Wartemodus** versetzt und intern `flash_mode=1` setzt. Folge:

- Display zeigte „Upload TFT…"-Wartebildschirm.
- Spätere harmlose Probes (`CustomSend`) gingen ins Log: `NXP: skipped command because still flashing`.
- Recovery nur per **Power-Cycle des Panels** — `Restart 1` auf dem Tasmota allein reicht nicht, weil der Nextion-Bootloader unabhängig vom ESP32 in seinem eigenen Upload-Mode hängt.

**Lektion:** `FlashNextion`, `FlashNextionAdv*`, `CustomSend`, `Nextion` nie ohne echte Argumente probieren — auch nicht zur Verfügbarkeitsprüfung. Existenz-Checks gehen über `Status 0`, `GetDriverVersion`, `Help`. Memory-Eintrag: `feedback_tasmota_probing.md`.

## 3. Flash-Versuche und Live-Trace

Es wurden zwei Flash-Versuche mit **identischem Code, identischer URL, identischem Gerät** gemacht. Beide jeweils direkt nach Tasmota-Start (Heap frisch, kein vorheriger Flash-State).

### 3.1 Run 1 (~13:13) — Fehlversuch

Polling der Web-Console mit Filter auf `NXP|NEX|TFT|FlashNextion|BRY|...` (**ohne `FLH:`** — das war ein Filter-Fehler), dann Trigger:

```bash
curl 'http://192.168.1.182/cm?cmnd=FlashNextionAdv0%20http://nspanel.de/nspanel-v5.1.1.tft'
→ {"FlashNextionAdv":"Done"}
```

```log
13:13:23.965 SRC: Berry
13:13:24.021 NXP: Nextion command sent = 'DRAKJHSUYDGBNCJHGJKSHBDN'
13:13:24.023 NXP: Nextion command sent = 'recmod=0'
13:13:24.025 NXP: Nextion command sent = 'connect'
13:13:24.029 NXP: Received Raw         = bytes('1AFFFFFF')
13:13:24.150 NXP: Received Raw         = comok 2,30614-0,NX4832F035_011C,...
13:13:24.178 NXP: Nextion command sent = whmi-wris 0,921600,res0
13:13:24.564 NXP: Received Raw         = bytes('05')
13:13:24.566 BRY: Exception> 'type_error' - unsupported operand type(s) for <: 'nil' and 'int'
```

`flash_size` ist im `whmi-wris`-Befehl **0** (Hex der Bytes verifiziert: `... 20 30 2C 39 32 31 36 30 30 ...` = `" 0,921600"`). Berry-Exception 2 ms nach `0x05`-ACK. Display hängt im TFT-Wait, Tasmota-Berry trommelt im GC-Loop. Recovery per Power-Cycle des Panels (User).

### 3.2 Run 2 (~14:06) — Erfolgs-Lauf

Selber Befehl, diesmal Monitor mit erweitertem Filter inkl. `FLH:`:

```log
14:06:15.990 FLH: host: nspanel.de, port: 80, get: /nspanel-v5.1.1.tft
14:06:16.051 FLH: Connected:true
14:06:16.153 FLH: Retry 2                                                       ← Retry-Loop einmal ausgelöst
14:06:16.395 FLH: HTTP Respose is 200 OK or 206 Partial Content
14:06:16.406 FLH: Flash file size: 12227824                                     ← Content-Length sauber geparst
14:06:16.433 NXP: Nextion command sent = 'DRAKJHSUYDGBNCJHGJKSHBDN'
14:06:16.439 NXP: Nextion command sent = 'connect'
14:06:16.444 NXP: Received Raw         = bytes('1AFFFFFF')                      ← initiale Display-Antwort, harmlos
14:06:16.446 FLH: Something has gone wrong flashing display firmware [bytes('1AFFFFFF')]   ← False-Positive im Code
14:06:16.563 NXP: Received Raw         = comok 2,30614-0,NX4832F035_011C,...
14:06:16.587 NXP: Nextion command sent = whmi-wris 12227824,921600,res0         ← korrekte Filesize
14:06:16.971 NXP: Received Raw         = bytes('05')
14:06:17.077 FLH: Read block - Writing: 4096 - Total: 4096
14:06:17.178 NXP: Received Raw         = bytes('08')
14:06:21.993 FLH: Flash offset marker 0
... (kontinuierlich, ~22 KB/s)
```

Flash lief stabil mit ca. 22 KB/s Durchsatz, Heap stabil, kein GC-Storm. Trace bei ~52 % auf User-Wunsch abgebrochen (Rest des Streams ist linear, kein neuer Erkenntnisgewinn). Flash läuft auf dem Gerät unbeobachtet weiter zu Ende; das Panel rebootet nach Abschluss automatisch (Code Z. 140–149).

## 4. Bug-Charakter und was sich aus dem Vergleich folgern lässt

**Race Condition / intermittierender Flake**, kein deterministischer Codefehler. Beide Läufe identisch in Code, URL, Gerät, frischem Tasmota-Zustand — nur einmal `flash_size = 0`, einmal `flash_size = 12227824`.

### 4.1 Direkt aus den Logs belegbar

- `whmi-wris 0,921600,res0` mit Filesize-Feld `0` (Hex `30` = ASCII `'0'`, Bytes verifiziert).
- Berry-Exception `type_error` bei einem `<`-Vergleich, ~2 ms nach dem `0x05`-ACK.
- `begin_nextion_flash` (Z. 217–228) ist nachweislich gelaufen — `DRAKJHSUYDGBNCJHGJKSHBDN`/`recmod=0`/`connect` sind in beiden Run-Logs.
- Run-2-FLH-Logs zeigen den korrekten Erfolgs-Pfad: Header gefunden, 206 erkannt, Content-Length geparst → `flash_size = 12227824`.
- `1AFFFFFF` und die `Something has gone wrong`-Warnung kommen in **beiden** Läufen — also harmloser Driver-Noise, **nicht kausal** für den Fehler.

### 4.2 Aus dem Code direkt ableitbar (`tasmota/berry/10/autoexec.be`)

- `flash_nextion(url)` (Z. 309–315) setzt initial `self.flash_size = 0`, ruft `open_url_at(url, 0)`, dann `begin_nextion_flash` nur wenn `res != -1`.
- Da `begin_nextion_flash` in **beiden** Läufen lief, hat `open_url_at` jeweils erfolgreich returned (kein `-1`, keine Exception).
- In Run 1 hat es `flash_size` aber **nicht** überschrieben. Der Content-Length-Parse-Block (Z. 294–305) wurde also nicht in den Setz-Pfad gebracht.

### 4.3 Was meine ursprüngliche Diagnose ausschließt

Die TCP-Fragmentierungs-These „Header nicht in einem Read komplett → `headers == nil`" ist mit den belegbaren Fakten **nicht vereinbar**: bei `headers == nil` würde `string.find(nil, "200 OK")` (Z. 287) crashen, bevor `begin_nextion_flash` aufgerufen wird. Wir sehen aber die `connect`/`whmi-wris`-Sequenz — also lief der Code an Z. 287 sauber durch.

### 4.4 Offene Hypothesen für Run 1 `flash_size = 0`

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

Plausibel, ohne Run-1-`FLH:`-Logs nicht entscheidbar:

- **A) `string.find(headers, tag)` retournierte `≤ 0`** → Block übersprungen. Möglich wenn der erste `tcp.readbytes()` zwar das `\r\n\r\n` enthielt (z. B. weil ein Teil des Headers + Anfang des Bodys in einem Frame kam und das `\r\n\r\n` zwischen Header und Body lag), aber der Buffer schon vor `Content-Length:` endete oder dieses nicht enthielt.
- **B) `int(s)` retournierte 0**. Möglich wenn der Slice ein Trailing-`\r` enthielt oder Berrys `int()` bei nicht-numerischem Input still `0` zurückgibt.

Run 2 zeigt: bei einer sauberen Pause (`Retry 2`-Pfad mit ~200 ms Wartezeit) ist der Header beim ersten `readbytes()`-Aufruf vollständig, und der Parse läuft korrekt.

### 4.5 Crash-Stelle in `write_block` (Run 1)

Code Z. 107–151. Mögliche Stellen:

- Z. 111: `while size(self.flash_buff) < self.flash_block_size && self.tcp.connected()`
- Z. 121: `if size(self.flash_buff) > self.flash_block_size`
- Z. 129: `var per = (self.flash_written*100)/self.flash_size` — bei `flash_size=0` Division durch Null (kein `<`-Type-Error, scheidet aus).

`flash_block_size` ist `static` (Z. 16). Wäre `self.flash_block_size` als `nil` ausgewertet, würde Z. 111 immer crashen — auch in Run 2. Tut es nicht (Run 2 zeigt erfolgreiche `Read block - Writing: 4096`-Zeilen). → `static`-Problem fällt weg.

Verbleibend: Z. 111 oder Z. 121 mit `flash_buff = nil`. Würde passen falls `open_url_at` nicht bis Z. 280 (`self.flash_buff = b[(i+4)..]`) durchgelaufen ist. Ohne Fail-Trace mit erweiterten Logs nicht final entscheidbar.

## 5. Defensiver Fix in `open_url_at`

Sichert alle plausiblen Pfade ab — verhindert das Bricked-Display-Symptom auch wenn die Race Condition reproduziert wird:

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

# ... bestehende 200/206-Prüfung (Z. 287–293) und Content-Length-Parse (Z. 294–305) ...

if pos == 0 && (self.flash_size == nil || self.flash_size <= 0)
    log("FLH: Content-Length missing or zero — aborting", 2)
    return -1
end
```

Drei Guards die der derzeitige Code nicht hat:

1. Header-Read **bis Marker oder Timeout** statt Single-Shot-`readbytes()`.
2. Hartes `return -1` wenn `headers == nil`.
3. Hartes `return -1` wenn `flash_size <= 0`.

Damit kann der Driver nie wieder mit Filesize 0 gegen die Nextion fahren. Race Condition kommt höchstens noch als sauber abgebrochener Flash-Versuch zum Vorschein (Adapter retried oder User triggert erneut), das Display bleibt bedienbar.

## 6. Zusätzliche Logs für künftige Diagnose

Falls der Fail-Run nochmal eintritt, würde sich die Wurzel mit minimal-invasiven Print-Statements **eindeutig** pinpointen lassen. Empfohlene Stellen in `tasmota/berry/10/autoexec.be`:

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

## 7. Empfehlungen für den Adapter

- Vor `FlashNextionAdv0` per HTTP-HEAD die TFT-Größe selbst bestimmen und ins Adapter-Log schreiben — zusätzlicher Sanity-Check unabhängig vom Berry-Driver.
- Falls `FlashNextionAdv0` (Proto v1 @ 921600 Baud) wiederholt fehlschlägt: `FlashNextionAdv2` (v1 @ 115200) als Fallback. Index-Mapping in `tasmota/berry/10/autoexec.be:425–459` (`flash_nextion_adv`).
- Auto-Retry bei Adapter-seitigem Timeout: nach Tasmota-`Restart 1` und 30 s Wartezeit erneut triggern. Verbunden mit dem defensiven Fix oben (`return -1` statt hängen) wird das einen Flake meistens beim zweiten oder dritten Versuch durchbringen.

## 8. Status nach der Session

- Run 1 endete mit hängendem Display, User trennte Strom des Panels.
- Run 2 startete nach frischem Tasmota-Boot und lief erfolgreich an. Trace wurde bei ~52 % auf User-Wunsch abgebrochen, Flash läuft auf dem Gerät zu Ende. Kein Power-Cycle nötig wenn der Flash sauber abschließt — `write_block` Z. 140–149 räumt selbst auf und re-initialisiert den Serial-Port auf 115200.
- Berry-Driver Version 10 weiterhin geladen. TFT-Datei ist intakt und passt zum Display.
- **Der Bug ist nicht gefixt** — der Fix-Patch in `tasmota/berry/10/autoexec.be` wurde noch nicht eingespielt. Flake kann beim nächsten Flash wieder auftreten.

## 9. Saubere nächste Schritte

In dieser Reihenfolge:

1. Defensiven Fix aus Sektion 5 in `tasmota/berry/10/autoexec.be` einarbeiten und als Driver-Version 11 ausrollen (Adapter holt sich das Berry-Skript automatisch via `getBerryInstallUrl`).
2. Optional: zusätzliche Logs aus Sektion 6 mit aufnehmen, damit der nächste Flake-Run sich sofort selbst diagnostiziert.
3. Adapter-seitig HEAD-Sanity-Check und Auto-Retry aus Sektion 7 ergänzen.

## Quellen

- Adapter-Code: `src/main.ts:2488–2497` (Befehl-Konstruktion `FlashNextionAdv0 <url>`)
- Berry-Driver: `tasmota/berry/10/autoexec.be:230–315` (`open_url_at`, `flash_nextion`)
- Berry-Driver: `tasmota/berry/10/autoexec.be:107–152` (`write_block` — plausible Crash-Stelle in Run 1)
- Berry-Driver: `tasmota/berry/10/autoexec.be:425–474` (`flash_nextion_adv` Funktion und `add_cmd`-Registrierung; idx-Mapping Z. 427–453)
- Berry-Driver: `tasmota/berry/10/autoexec.be:154–213` (`every_100ms` mit `whmi-wris`-Senden bei `comok 2`-Empfang Z. 162–171)
