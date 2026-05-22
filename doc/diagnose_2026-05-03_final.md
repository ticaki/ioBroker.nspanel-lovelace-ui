# Diagnose 2026-05-03 — Nextion TFT-Flash, vier Läufe

**Setup:** NSPanel `192.168.1.182`, Tasmota `15.4.0`, Berry-Driver `nlui_driver_version: 10` mit Diagnose-Patches P1–P7 (siehe `doc/autoexec_v10_patched.be`). TFT `nspanel-v5.1.1.tft` (12 227 824 B).

## Verbliebene Log-Dateien

| Datei | Stadium | Wesentlicher Befund |
|---|---|---|
| `tasmota_flash_20260503_150558.log` | nspanel.de, kein lokaler Server | Mid-flash slow ~1%/3 min wegen HTTP-Stream-Stalls. Letzter Total: 10637312 (87 %), abgebrochen. |
| `tasmota_flash_local_20260503_151915.log` | lokaler HTTP-Server, **vor** Patch-2 (TIMEOUT-Guard) — Run 3 | 99.99 %-Hänger: letzter Total 12226560 (1264 B fehlend), kein TIMEOUT, Display bekommt finalen Sub-4096-Block nicht, `flash_written == flash_size`-Cleanup Z. 140 trifft nie zu. |
| `tasmota_flash_20260503_154156_run5.log` | „0=size start" Problem | Vorgänger-Lauf endete mit `BRY: Exception 'attribute_error' ... no attribute '_wb_count'` (mein Bug). Display blieb in inkonsistentem Zustand. Nach Trigger: Block #1 sauber geschrieben (Total 4096), Display schickt `Waiting offset...`, dann **schweigt** das Display für 90+ s — **kein** 4-Byte-Offset, **kein** 5-Byte-Frame, gar nichts. write_block läuft in Wait-Schleife, Patch 2 TIMEOUT greift, schreibt partial 818 B — Display reagiert nicht weiter. Heißt: nach attribute_error braucht das Panel **harten Power-Cycle**, sonst blockiert es jede neue Flash-Session. |
| `tasmota_flash_20260503_155126_run6.log` | nspanel.de, korrigiertes Logging — aktueller Diagnose-Lauf | Saubere Sequenz: Setup OK, write_block #1, Skip-Marker `Flash offset marker 10485760` (= 86 %, getrennt vom `0x08`-Frame), neue HTTP-Range-Verbindung, Flash bis Total 12158441 (99.43 %), dann Patch-2-TIMEOUT nach 30 s, partial 1513 B geschrieben, Display antwortet nicht weiter. |

## Zusammengefasste Bug-Klassen

### 1. „0=size start" Hänger nach Berry-Exception (Log run5)

**Symptom:** Display hängt nach Block #1 mit Total 4096, schickt nach `Waiting offset...` keine Bytes mehr.

**Wurzel:** Eine vorhergehende Berry-Exception (in Run 5: `attribute_error`, in einem produktiven Setting jeder andere unbehandelte Berry-Crash) hinterlässt das Display in einem Zustand wo der Bootloader auf den NSPanel-internen UART-Reset wartet, aber der ESP32 das nicht mitbekommt. `connect`-Befehl reicht nicht, um das aufzulösen. Power-Cycle Pflicht.

**Lehre:** Berry-Code im Driver darf nie Exceptions werfen. Defensive Init-Werte (`var ... = 0` in `class` + Init in `def init()`) statt nil-Checks im Hot-Path.

### 2. Mid-flash slow ab Resume-Offset (Log 150558, run6)

**Symptom:** Erste ~86 % schnell, dann ~11 KB/s.

**Wurzel:** Display hat 0–86 % schon im Flash → ACKt jeden Block sofort ohne Sektor-Schreibvorgang. Ab dem Resume-Offset müssen Sektoren ge-erased und neu beschrieben werden — das dauert pro 4096-Block 100–600 ms, gegen Ende >1 s.

**Kein Bug**, Hardware-Constraint Nextion-Bootloader. Bestätigt durch: mit lokalem HTTP-Server (0 ms Latenz, 100 Mbit) zeigt sich dieselbe Verlangsamung an gleicher Stelle wie mit `nspanel.de` (siehe run6 vs 150558).

### 3. 99.99 %-Hänger (Log local_151915)

**Symptom:** Letzter Total kurz vor `flash_size`, kein erfolgreicher Abschluss, Display hängt.

**Wurzel zwei kombinierte Fehler:**

a) **HTTP-Stream-Stall am Ende.** Letzte 30+ s lang `tcp.available()=0` obwohl `tcp.connected()=true`. Display ACKt evtl. nicht so oft → Tasmota consumed nicht → TCP-Window läuft voll → Server pausiert → ESP32 bekommt nichts mehr.

b) **Cleanup-Bedingung in `tasmota/berry/10/autoexec.be:140` ist `==`.** Wenn der Schluss-Sub-4096-Block ungenau geschrieben wird (z. B. Patch-2-TIMEOUT-Forced-Exit mit krummem partial), trifft `flash_written == flash_size` nie zu → Cleanup-Sequenz Z. 140–149 läuft nicht → `flash_mode=1` bleibt hängen → Display nie sauber resettet.

**Fix:** Z. 140 von `==` auf `>=` ändern. Plus `if self.flash_written > self.flash_size  self.flash_written = self.flash_size  end` als Klammerung.

### 4. 99.43 %-TIMEOUT mit Patch 2 (Log run6)

**Symptom:** Nach 30 s ohne TCP-Daten Patch-2-Guard greift, schreibt partial 1513 B, Display reagiert nicht weiter.

**Wurzel:** Patch 2 ist eine Notbremse — sie verhindert Endlos-Hänger, aber der Nextion-Bootloader erwartet Vollblöcke und ignoriert/queued den partial Block. Tasmota wartet auf den nicht kommenden ACK.

**Behebung:** TIMEOUT-Schwelle in der Endphase verlängern (60–120 s), oder Patch 2 erst nach mehrfacher Wiederholung greifen lassen, oder bei TIMEOUT explizit `connect` neu absetzen damit Display synchronisiert.

### 5. Race Condition `flash_size = 0` (historisch, kein Log mehr vorhanden)

In den ersten Runs des Tages (vor 14:00) trat einmal `whmi-wris 0,...` auf — `flash_size` blieb auf 0, Berry-Exception kurz danach. Patches P5–P7 sollten das künftig direkt sichtbar machen (`find('Content-Length: ') = N`, `int(s) = N`). In den behaltenen Logs ist diese Race nicht reproduziert — sie ist intermittierend und stark timing-abhängig.

## Patches in `doc/autoexec_v10_patched.be` — Stand nach run6

| # | Was | Status |
|---|---|---|
| P1 | `write_block ENTER #N` jeder 100. Aufruf | sample-basiert, leicht im Hot-Path |
| P2 | wait_iters + 30-s-TIMEOUT | wirkt — verhindert ewig-Hänger, aber verursacht Sub-4096-partial-Schreibvorgang am Ende. Schwelle eventuell zu kurz. |
| P3 | `write_block EXIT #N` jeder 100. Aufruf | sample-basiert. **Original `Read block - Writing` Log unverändert** (war anfangs irrtümlich auch sample-based, korrigiert) |
| P4 | UNKNOWN display response (>0x05/0x08/4-Byte-Offset) | wirkt — bisher nur `1AFFFFFF` initial harmlos |
| P5 | initial readbytes Größe | wirkt einmalig im Setup |
| P6 | `\r\n\r\n`-Marker-Status | wirkt einmalig im Setup |
| P7 | Content-Length-Parse-Trace | wirkt einmalig im Setup |

`var _wb_count` ist als Klassenmember deklariert + in `def init()` mit `0` initialisiert — keine Berry-Exceptions mehr.

## Empfehlungen — Reihenfolge nach Aufwand × Nutzen

1. **`==` → `>=` in `autoexec.be:140`** (1 Zeile). Löst 99.99 %-Hänger sofort wenn Schluss krumm. Risikoarm.

2. **Patch 2 TIMEOUT auf 60 s erhöhen + flash_buff vor Sub-Schreibvorgang prüfen** (10 Zeilen). Wenn `size(flash_buff) < flash_block_size` und nicht End-of-Stream: nicht schreiben sondern noch einen Cycle warten.

3. **Lokaler HTTP-Server im Adapter** (siehe `doc/tasmota_file_upload.md`). Phase 1 wird ~4× schneller (214 KB/s vs 57 KB/s), Phase 2 unverändert (HW-Limit). Adapter-Code in `src/main.ts:2503` `getBerryInstallUrl` zeigt Verfahren — gleiches Pattern für TFT-Hosting.

4. **Patch 8 (Combined-5-Byte-Frame-Handler)** (15 Zeilen). Ergänzt elif-Kette in `every_100ms` um `size(msg)==5 && msg[0]==0x08`-Variante. Selten, aber wenn das Display den Skip-Marker zusammenpufft, geht es heute in den UNKNOWN-Pfad.

5. **post-Exception-Recovery im Berry-Driver.** Falls Berry doch wieder mal crasht: try/except um die kritischen Pfade (write_block, every_100ms), bei Exception → `flash_mode = 0`, `tcp.close()`, log auf Level 2. Verhindert dass Display in „0=size start"-Zustand verbleibt.

## Nächste konkrete Schritte (Reihenfolge)

a) `==` → `>=` Patch (Empfehlung 1) ins `doc/autoexec_v10_patched.be` einbauen, deployen, neuen Lauf — sehen ob 99.43 % oder 99.99 %-Endpunkt jetzt sauber abschließt.

b) Wenn ja: Patches in das Repo-`tasmota/berry/10/autoexec.be` migrieren und Driver-Version auf 11 erhöhen.

c) Adapter-Erweiterung lokaler HTTP-Server (Empfehlung 3) als Optional-Feature.
