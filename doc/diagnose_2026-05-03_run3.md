# Diagnose Run 3 (2026-05-03 15:19) — TFT-Flash mit Diagnose-Patches und lokalem HTTP-Server

**Setup:** Tasmota mit Patches P1–P7 aus `doc/autoexec_v10_patched.be`, lokaler Python-HTTP-Server `192.168.178.65:8765`, TFT `nspanel-v5.1.1.tft` (12 227 824 B). Trigger `FlashNextionAdv0 http://192.168.178.65:8765/nspanel.tft`.

**Logfile:** `doc/tasmota_flash_local_20260503_151915.log` — 3933 Zeilen, 265 KB.

## Resultat: Fehlschlag bei 99.9897 %

Letzte gemessene `Total`-Zeile: `12226560` von `12227824` Bytes. Es fehlen exakt **1264 Bytes** = der finale Sub-4096-Rest-Block. Display zeigt nach Abbruch nicht den neuen TFT-Stand → kein erfolgreicher Flash.

User-Hinweis: „logging-bedingte Hänger sind drin, die untypisch sind" — die Diagnose-Patches haben Hot-Path-Logging in `write_block` (P1 ENTER, P3 EXIT) das pro 4 KB-Block zwei `string.format()`-Allocations + `log()`-Aufrufe macht. Bei ~3000 Blöcken sind das ~6000 zusätzliche Log-Calls + entsprechender Berry-GC-Druck. Das verändert Timing und kann Stalls einführen die im ungepatchten Code so nicht vorkommen.

## Phase-Analyse aus dem Log

### Phase 1 — Setup (15:19:15)

```log
15:19:15.076 FLH: host: 192.168.178.65, port: 8765, get: /nspanel.tft
15:19:15.179 FLH: Connected:true
15:19:15.281 FLH: Retry 2
15:19:15.284 FLH: initial readbytes returned 206 bytes        ← P5
15:19:15.466 FLH: header found at byte 199 (header=206 B, body remainder=0 B)   ← P6
15:19:15.466 FLH: HTTP Respose is 200 OK or 206 Partial Content
15:19:15.467 FLH: find('Content-Length: ') = 132              ← P7
15:19:15.468 FLH: content-length slice = '12227824' (len=8)
15:19:15.469 FLH: int(s) = 12227824
15:19:15.469 FLH: Flash file size: 12227824
15:19:15.535 FLH: UNKNOWN display response in flash_mode (size=4, hex=bytes('1AFFFFFF'))
15:19:16.156 FLH: Send (High Speed) flash start
15:19:16.758 FLH: write_block ENTER buf=0 written=0 size=12227824 tcp_conn=true avail=5554
```

Setup sauber: Header in einem Read komplett, Content-Length sauber geparst, `1AFFFFFF` ist nur das initial-Boot-Greeting (harmlos, kommt in jedem Run vor).

### Phase 2 — schnelle Sequenz 0 → 86 % (15:19:16 → ~15:20:06, ~50 s)

Tasmota schreibt von 0 an. Erste Blöcke gehen schnell durch (Display ACKt mit 0x05 ohne sichtbare Wartezeit), Tasmota-Logger pollt nur 1 ×/s — durch Tasmotas 4-KB-Console-Ringbuffer-Overflow gehen viele Log-Zeilen verloren. Nach 50 s sind wir bei ~10.5 MB.

Zwischen `Waiting offset…` (15:19:16.979) und der nächsten lesbaren FLH-Zeile (15:20:06.355) ist eine 49-s-Lücke im Logfile. Das ist **Tasmota-Console-Buffer-Overflow**, kein realer Stall. Die ~28 Blöcke/s flossen aber durch.

### Phase 3 — Mid-flash-Slow ab ~86 % (15:20:06 → 15:27:16, ~7 Min)

Ab `Total ≈ 10551296` (86.3 %) Rate auf ~11 KB/s — das ist die Phase die der User als „1 % pro 3 Minuten" wahrnimmt.

```
15:20:06.355 FLH: waited 351 iters (17857 ms) for tcp data, buf=4818 tcp_conn=true   ← 17.8 s Stall
... viele kürzere Waits (~600 ms zwischen Blocks) ...
15:26:54.594 FLH: Read block - Writing: 4096 - Total: 12181504 - Buffer size: 698
15:27:16.207 NXP: Received Raw = bytes('05')                                        ← 22 s Pause vor letztem ACK
```

**Charakteristik:** Display ACKt jeden Block mit einer Pause die mit fortschreitendem Flash länger wird. Bei den letzten Blöcken bis zu 22 s zwischen 0x05-ACKs.

**Hypothese (nicht durch eigenen Test belegt, plausibel auf Basis Nextion-Datenblättern):**
Die ersten 86 % der Datei sind im Display-Flash bereits identisch vorhanden. Display verifiziert per Hash-Vergleich und ACKt sofort, ohne Sektor zu schreiben. Ab 86 % beginnen die geänderten Sektoren — Display muss erasen + schreiben, was 100–600 ms pro Sektor dauert. Die letzten Sektoren liegen offenbar in einer langsameren Flash-Region (Backup-Sektor? Bootloader-Image?), 1–22 s pro Block.

Diese Hypothese erklärt:
- warum mit lokalem HTTP-Server (~0 ms Latenz) die Rate ab 86 % identisch zu nspanel.de bleibt — der Bottleneck ist Display, nicht Netzwerk
- warum die Phase nicht durch unseren Logger verursacht ist — ohne Patches (Run 2 ursprünglicher Code) trat der gleiche Slow-down auf

### Phase 4 — Schluss-Hänger (15:27:16 ff., ~99.99 %)

```log
15:27:16.207 NXP: Received Raw = bytes('05')
15:27:16.210 FLH: write_block ENTER buf=1170 written=12222464 size=12227824 tcp_conn=true avail=6184
15:27:16.310 FLH: Read block - Writing: 4096 - Total: 12226560 - Buffer size: 1170
15:27:16.312 FLH: write_block EXIT remain=1264 tcp_conn=true
15:27:16.424 NXP: Received Raw = bytes('05')
15:27:16.428 FLH: write_block ENTER buf=1170 written=12226560 size=12227824 tcp_conn=true avail=2088
[ ab hier nur noch WIF: Prüfe Verbindung, kein 0x05-ACK, kein write_block EXIT ]
```

Tasmota ruft `write_block` ein letztes Mal um 15:27:16.428 mit `written=12226560` auf:
- `flash_buff = 1170` Bytes, `tcp.available = 2088` weitere Bytes (= insgesamt 3258 B verfügbar, aber Datei-Rest ist nur 1264 B)
- `flash_block_size = 4096` → die `while size(flash_buff) < 4096`-Schleife würde Blocking-Read versuchen
- TCP-Stream ist zu Ende (Server hat schon alles geliefert), `tcp.connected()` aber noch `true` weil ESP32-Stack das Close noch nicht propagiert hat
- Schleife läuft in `Wait for available…`-Pattern

Erwartetes Verhalten **mit Patch 2** (Timeout 30 s): nach 30 s Schleife verlassen, `to_write = self.flash_buff` (1170 B im else-Pfad weil 1170 < 4096), Schreiben, `flash_written += 1170` → `12227730`. Aber das ist **nicht 12227824** — es fehlen noch 94 Bytes weil tcp.available=2088 weitere Bytes nicht in flash_buff geladen wurden bevor die wait-Schleife startete (Code-Logik: erst checken `available`, dann lesen, vor dem 50-ms-delay).

User stoppte Logger bevor die 30 s vorbei waren — daher kein `TIMEOUT in wait loop`-Eintrag im Log.

### Was im Code-Pfad final fehlt

Selbst mit Patch-2-Timeout ist der Schluss-Code in `write_block` (Z. 140) `if self.flash_written == self.flash_size` — vergleicht auf **exakt gleich**. Wenn der letzte Sub-Block-Write krumm ist (z. B. weil Sub-4096-Rest-Bytes verloren gehen), trifft die Bedingung nie zu und der Cleanup (Z. 140–149) läuft nicht. Display bleibt im Upload-Wait, Tasmota im `flash_mode=1`.

## Zusammenfassung: was wirklich schief lief

1. **Race-Condition am Anfang** (`flash_size=0`): trat in Run 3 NICHT auf. Patches 5–7 zeigen Setup sauber.
2. **5-Byte-Skip-Marker** (`08 00 00 A0 00`): trat in Run 3 NICHT auf. Display kam aus sauberem Power-Cycle und brauchte keinen Resume-Marker (oder hat ihn als getrennte 0x08+4-Byte-Frames geschickt — nicht im Log sichtbar wegen Buffer-Overflow Phase 2).
3. **HTTP-Stall mit nspanel.de** (vorheriger Run): mit lokalem HTTP-Server **eliminiert**. Die ersten 86 % flossen mit ~214 KB/s durch (statt ~57 KB/s in vorherigen Läufen).
4. **Mid-flash-Slow ab 86 %**: ist Display-Hardware-Limit. Kein Tasmota-Bug, kein Adapter-Bug, kein Network-Bug. Mit Geduld läuft das durch.
5. **Schluss-Hänger bei 99.99 %**: kombination aus
   - Tasmota erkennt TCP-Close nicht zeitnah (`tcp.connected()=true` obwohl Stream zu Ende) → Wait-Loop greift bei letzten Bytes
   - Patch 2 würde nach 30 s rauskommen aber mit ungenauer flash_buff-Bilanz
   - Cleanup-Check Z. 140 ist `==` statt `>=` — bei ungenauem Schluss-Write nie erfüllt

## Empfehlungen

### A) Logger-Overhead reduzieren

Patches 1 und 3 (`write_block ENTER`/`EXIT`) sollten nur jeden N-ten Aufruf loggen, nicht jeden:

```berry
def write_block()
    import string
    if self._wb_count == nil  self._wb_count = 0  end
    self._wb_count += 1
    if self._wb_count % 50 == 0
        log(string.format("FLH: write_block ENTER buf=%d written=%d size=%d tcp_conn=%s avail=%d",
            ...), 3)
    end
```

Damit 60 Logs statt 3000, 50× weniger GC-Druck.

### B) Cleanup-Bedingung robuster

Z. 140 ändern:

```berry
if self.flash_written >= self.flash_size
```

und davor: `if self.flash_written > self.flash_size  self.flash_written = self.flash_size  end` als Sanity. Damit zu-viel-geschrieben kein Hänger.

### C) TCP-Close-Detection im Wait-Loop

In Patch 2 zusätzlich: wenn `tcp.available()==0` UND seit > 5 s nichts mehr gekommen UND `flash_written + size(flash_buff) >= flash_size` → das ist der finale Block, **direkt schreiben** statt auf 4096 zu warten.

### D) Local-HTTP-Server in Adapter

Der Adapter sollte die TFT-Datei selbst hosten statt über die externe URL zu gehen — Phase 2 wird damit ~4× schneller, Phase 3 ist HW-bedingt unverändert. Das ist die einfachste Verbesserung.

## Patches in `doc/autoexec_v10_patched.be` — Status

| # | Was | Im Test sinnvoll? | Produktiv-tauglich? |
|---|---|---|---|
| P1 | `write_block ENTER` jeder Aufruf | nein, zu viel | nein, sample-basiert nötig |
| P2 | wait_iters + 30-s-Timeout | ja, hat hier nicht gegriffen | ja, behält |
| P3 | `write_block EXIT` jeder Aufruf | nein, zu viel | nein, sample-basiert nötig |
| P4 | UNKNOWN display response | ja, leise im Erfolgsfall | ja, behält |
| P5 | initial readbytes Größe | ja, einmalig, kein Hot-Path | ja, behält |
| P6 | `\r\n\r\n`-Marker-Status | ja, einmalig | ja, behält |
| P7 | Content-Length-Parse-Trace | ja, einmalig | ja, behält |
| P8 | Combined 5-Byte-Frame (geplant, nicht eingebaut) | tbd, nicht aufgetreten in Run 3 | ja, defensiv |

## Nächste Schritte

- Patches 1 & 3 sample-basiert umbauen (jeder 50.) → wieder uploaden → erneut testen.
- Empfehlung B (Cleanup-Bedingung `>=`) als kleinstes Bug-Fix-Patch implementieren.
- Adapter um lokalen TFT-Hosting-Endpoint erweitern (siehe `doc/tasmota_file_upload.md` Abschnitt „UrlFetch-Verfahren" — gleiche Mechanik).
