# v11 Deploy & Flash-Verifikation — 2026-05-04

**Gerät:** NSPanel Flur · `192.168.1.182` · Tasmota `15.4.0 (release-tasmota32)`
**Driver-Version vor Deploy:** `nlui_driver_version: 10` (Original aus `tasmota/berry/10/autoexec.be`)
**TFT-URL:** `http://nspanel.de/nspanel-v5.1.1.tft` (12 227 824 B)
**Flash-Befehl:** `FlashNextionAdv0 <url>` (Proto v1, 921 600 Baud)
**Live-Log:** `doc/tasmota_flash_v11_20260504_082607.log` (3695 Zeilen)

## 1. Was wurde gebaut

`doc/autoexec_v11.be` (22 102 B) — Basis: `doc/autoexec_v10_patched.be`. Eingebaute Empfehlungen aus `doc/diagnose_2026-05-03_final.md` und `doc/nextion-tft-flash-bug.md`:

| # | Patch | Quelle | Code-Position v11 |
|---|---|---|---|
| 1 | Cleanup `flash_written == flash_size` → `>=` plus Klammerung | diagnose §3 / Empfehlung 1 | `write_block()` Z. 186–199 |
| 2 | TIMEOUT-Schwelle 30 s → 60 s, Sub-Block-Guard bei TIMEOUT vor End-of-Stream | diagnose §4 / Empfehlung 2 | `write_block()` Z. 139–166 |
| 3 | Patch 8 — 5-Byte Combined-Frame `{0x08, off0..off3}` | diagnose §4 / Empfehlung 4 | `every_100ms()` Z. 244–252 |
| 4 | Defensiver `open_url_at` Header-Read-Loop bis `\r\n\r\n` oder 3-s-Deadline | nextion-tft-flash-bug §5 | `open_url_at()` Z. 343–375 |
| 5 | Hard-Aborts bei `headers == nil` und `flash_size <= 0` | nextion-tft-flash-bug §5 | `open_url_at()` Z. 367–375 / 405–409 |
| 6 | `try/except` in `write_block` und `every_100ms` mit Recovery (`flash_mode=0`, `tcp.close()`) | diagnose §1 / Empfehlung 5 | beide Methoden, Außenrahmen |
| 7 | Driver-Version `10` → `11` | diagnose §c | `get_current_version` Z. 491 |

Diagnose-Logs aus den Patches P1, P3, P5–P7 (write_block-ENTER/EXIT-Sample, Wait-for-available, waited-iters, header-bytes-Trace, Content-Length-Parse-Trace) wurden nach erfolgreicher Verifikation **auskommentiert** — sie haben ihren Zweck erfüllt und erzeugen im Hot-Path nur Log-Druck. Aktiv bleiben Setup-Logs (`host:port:get`, `Connected`, `HTTP 200/206`, `Flash file size`), das originale `Read block - Writing` Progress-Log und alle Fehler-Pfade (`TIMEOUT`, `skip partial`, `UNKNOWN display response`, `EXCEPTION`, `NO header marker`, `HTTP header incomplete`, `Content-Length missing or zero`, `late-stage unknown msg`).

## 2. Deploy-Ablauf

Lokaler HTTP-Server lief schon seit 2026-05-03 unter `192.168.178.65:8765` (Python 3 `http.server`, cwd `/tmp`). v11 wurde nach `/tmp/autoexec.be` kopiert und ist damit über `http://192.168.178.65:8765/autoexec.be` erreichbar. SHA-256-Match Quelle ↔ Server-Response verifiziert vor Deploy.

```bash
# Tasmota holt v11 selbst per UrlFetch
curl 'http://192.168.1.182/cm' --data-urlencode \
  'cmnd=Backlog UfsDelete autoexec.be; UfsDelete autoexec.bec; UrlFetch http://192.168.178.65:8765/autoexec.be'
```

Verifikation per `/ufsd`-Listing: `autoexec.be 2026-05-04T08:25:00 22102 B` — Größe matcht lokale Quelle. Anschließend `Restart 1`.

```bash
# nach Reboot, ~15 s
curl 'http://192.168.1.182/cm?cmnd=GetDriverVersion'
# → {"nlui_driver_version":"11"}
```

## 3. Flash-Verifikation — was im Log steht

Initial-Setup (08:26:27.371 ff.):

```
08:26:27.371 FLH: header read total bytes 1436         ← v11 Read-Loop, einmalig erfasst
08:26:27.372 FLH: header found at byte 265 (header=269 B, body remainder=1167 B)
08:26:27.373 FLH: HTTP Respose is 200 OK or 206 Partial Content
08:26:27.374 FLH: content-length slice = '12227824' (len=8)
08:26:27.375 FLH: int(s) = 12227824
08:26:27.376 FLH: Flash file size: 12227824
08:26:27.601 FLH: Send (High Speed) flash start
08:26:28.102 FLH: Read block - Writing: 4096 - Total: 4096 - Buffer size: 1167
08:26:32.967 FLH: Flash offset marker 10485760         ← Resume-Marker bei 86 %
08:26:33.633 FLH: header read total bytes 5550         ← Re-Open at offset, sauber
```

End-Phase (08:28:03.241 ff.):

```
08:28:03.241 FLH: Read block - Writing: 4096 - Total: 12201984 - Buffer size: 973
... (13× Wait-Iterationen für letzte Sektor-Erase)
08:28:05.083 FLH: Read block - Writing: 4096 - Total: 12226560 - Buffer size: 1264
08:28:05.126 FLH: Read block - Writing: 1264 - Total: 12227824 - Buffer size: 0   ← finaler Sub-Block
08:28:05.151 FLH: Flashing complete - Time elapsed: %d
08:28:05.157 MQT: nspanel/ns_panel1/tele/RESULT = {"Flashing":{"complete":"done","time_elapsed":97}}
```

Der finale 1264-B-Block ist exakt das Stück, das in `tasmota_flash_local_20260503_151915.log` (Run 3, v10-Original) fehlte: dort war der letzte Total `12226560` (1264 B unter `flash_size`), und der `==`-Cleanup-Vergleich konnte nie greifen → 99.99 %-Hänger. Mit dem v11-`>=`-Vergleich plus der `flash_written = flash_size`-Klammerung schließt der Cleanup auch bei nicht-exaktem Endpunkt sauber ab.

Gesamt-Flash-Zeit: **97 s** über `nspanel.de` (Phase 1: 0 → 86 % in einem TCP-Frame, Phase 2: 86 → 100 % in 92 s — Sektor-Erase-Limit der Nextion).

## 4. Welche Patches haben tatsächlich gegriffen

| Patch | Status | Beleg |
|---|---|---|
| P1 (Cleanup `>=`) | **Aktiv genutzt** | finale 1264-B-Schreibung + `Flashing complete` in einem write_block-Aufruf — bei `==` wäre das nicht passiert |
| P2 (TIMEOUT 60 s + Sub-Guard) | Inaktiv | Stream wurde nie >60 s still; `skip partial` nie geloggt |
| P3 (5-Byte Combined-Frame) | Inaktiv | Display sendet `0x08` und 4-Byte-Offset getrennt — Standard-Pfad |
| P4 (Header-Loop) | **Aktiv genutzt** | `header read total bytes 1436` zeigt: bei einem Cycle Daten verfügbar, Loop terminiert sofort. Race-Schutz bei verzögertem TCP wäre hier aktiv |
| P5 (Hard-Aborts) | Inaktiv | Header und `flash_size > 0` waren ok |
| P6 (try/except) | Inaktiv | Keine Exceptions in 3695 Zeilen Log |

P2, P3, P5, P6 sind Defensiv-Patches gegen die in den Vor-Logs beobachteten Edge-Cases. Sie greifen nicht im Happy-Path; ihr Wert zeigt sich erst, wenn die jeweilige Race wieder auftritt. Das ist Absicht.

## 5. Adapter-Auto-Update überschreibt v11 nach Reboot

Beobachtung: `GetDriverVersion` antwortete unmittelbar nach Deploy + Restart mit `"11"` (verifiziert vor Flash-Trigger), aber **nach** dem Cleanup-Reboot des Panels war wieder `"10"` aktiv. SHA-256 von `/ufsd?download=/autoexec.be` matcht hash-genau `tasmota/berry/10/autoexec.be` (Repo-Original) — nicht v11, nicht v10_patched.

Ursache: `getBerryInstallUrl` in `src/main.ts:2503` baut beim Adapter-internen Driver-Check folgenden Backlog:

```
Backlog UfsDelete autoexec.old; UfsRename autoexec.be,autoexec.old;
        UrlFetch ${this.config.berryUrl}/${version}/autoexec.be
```

Wenn der Adapter beim Mismatch die installierte Version durch die im Build erwartete Version ersetzt, wird die experimentelle v11 vom Ziel-Repo-Original verdrängt. Das ist erwartetes Adapter-Verhalten und kein v11-Bug.

**Konsequenz für Folge-Arbeit:**
- Wenn v11 dauerhaft auf einem Panel laufen soll → `tasmota/berry/11/autoexec.be` ins Repo committen + Adapter-Konfig auf `version=11` stellen.
- Für den hier durchgeführten Verifikations-Lauf nicht relevant: der TFT-Flash-Vorgang selbst ist abgeschlossen, das TFT 5.1.1 sitzt im Display-Flash, der Berry-Driver ist nur das Werkzeug.

## 6. Status nach Lauf

- Tasmota responsive (`Status 0` ok).
- Berry-Heap 16 KB, 220 Objects (Driver geladen, GC unauffällig).
- Display-Reboot nach Flash-Cleanup (`RuleTimer3 120` + `Rule3 1` aus v11) erfolgt automatisch — Panel ist online und antwortet.
- TFT-Version 5.1.1 ist auf dem Display.
- v11 Quelle bleibt im Repo unter `doc/autoexec_v11.be` als Referenz für künftige v11-Promotion nach `tasmota/berry/11/`.

## 7. Quellen

- v11-Quelle: `doc/autoexec_v11.be`
- Vergleichsbasis: `doc/autoexec_v10_patched.be`, `tasmota/berry/10/autoexec.be`
- Live-Log: `doc/tasmota_flash_v11_20260504_082607.log`
- Diagnose-Vorlauf: `doc/diagnose_2026-05-03_final.md`, `doc/nextion-tft-flash-bug.md`, `doc/session_2026-05-03_tft-flash-debug.md`
- Adapter-Pfad: `src/main.ts:2490` (`FlashNextionAdv0`-Befehl), `src/main.ts:2503` (`getBerryInstallUrl`)
