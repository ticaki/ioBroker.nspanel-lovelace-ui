# CLAUDE.md – working on the NSPanel HMI (briefing for a fresh assistant)

You are going to read, analyse or change a Nextion Editor project (`.HMI`) of ioBroker.nspanel-lovelace-ui. Everything
here was worked out on the real files and partly on real panels. Read it fully before you touch an HMI; the docstrings
at the top of every script in this folder are the detailed reference.

## 1. Ground rules

- **Never edit an `.HMI` by hand or with ad-hoc byte patches.** Write (or extend) a generator script in this folder:
  `python3 HMI/tools/<script>.py <in.HMI> <out.HMI>`. The output must not exist yet, the input stays untouched.
  Scripts are deterministic and idempotent where possible (running one on its own output gives the same result).
- Run Python with `PYTHONDONTWRITEBYTECODE=1` from the repository root.
- After building: `Hmi(out).check()` (checksums) and `Page(page.bytes())` (round trip) – every existing script does
  this; a wrong checksum makes the editor refuse the file (“Wrong resource file or resource file has been damaged”).
- You cannot compile a TFT. The Nextion Editor (Windows) compiles; the maintainer opens the HMI, compiles, reports the
  page RAM values and tests on the panel. Hand over the HMI and say what to check.
- Three models, each its own HMI: EU (`HMI/nspanel-v<ver>.HMI`, 480×320), `HMI/us-l/…` (landscape), `HMI/us-p/…`
  (portrait). A feature normally has to be done for all three (separate script or a model switch in the script).
- Version: `pageStartup.tRelease` holds the release text (`event,startup,<tVersion>,<model>,<tRelease>`). A new
  release bumps it; `json/version.json` is only raised once the TFT is published.

## 2. Tools in this folder

| file | purpose |
|---|---|
| `hmi.py` | container: `Hmi(bytes)`, `.files` (live sections by name), `.check()`, `.build(changes, added)` writes append-only like the editor and fixes all checksums |
| `pagefile.py` | page sections `<n>.pa`: `Page(data)`, `.objs`, `.obj(name)`; `Obj.get/set/geometry/code(event)/set_code(event, lines)/copy()`; helpers `block(lines, i)` (statement incl. `{}` body), `find(lines, text)` |
| `zilib.py` | fonts `.zi` (version 6, 3-bit alpha): decode/encode byte-identical to the editor |
| `build_hmi.py`, `render.mjs`, `params.json` | rebuild the icon fonts from `script/icons.json` (Chrome canvas via puppeteer, `PUPPETEER_PATH=$(npm root -g)/`) |
| `font_widths.py` | width tables of fonts 0..5 per model → `src/lib/const/font-widths.ts` (the adapter measures text with it) |
| all other `*.py` | one generator per change (e.g. `display_ack.py` 6.1.0, `card_device.py` cardDevice1–3, `shrink_id_buffers.py`, `screensaver5*.py`) – the best examples for how a change is done; copy their structure |

Typical skeleton (see `notify_blink.py`):

```python
hmi = Hmi(open(src, 'rb').read()); hmi.check()
pages = {Page(d).objs[0].name: (sec, Page(d)) for sec, d in hmi.files.items() if sec.endswith('.pa')}
sec, page = pages['cardGrid']
lines = page.obj('tmSerial').code('timer')   # event names as stored, look at existing scripts
...                                           # change attributes / code lines / add copied objects
changes = {sec: page.bytes()}
out = hmi.build(changes); Hmi(out).check(); open(dst, 'wb').write(out)
```

Quick look without tools: `strings -n 4 file.HMI` shows all page code – but also code of **deleted** sections; for
anything that matters only evaluate live records (`Hmi.files`).

## 3. File format (short)

- **Container:** `u32 count` + count × 28-byte records (name 16, u32 offset, u32 size, u8 deleted, 3 opaque) + u32
  directory checksum; identical copy at 0x80000; marker `ver21234` at 0x6FFFF8; payloads from 0x700000. The editor
  re-saves compact, `hmi.py` appends (deleted records keep their payload) – both load.
- **Checksums:** CRC table poly 0x04C11DB7, init 0xFFFFFFFF, 4 table rounds per byte; directory, pages and `main.HMI`
  each have their own formula (`hmi.py`).
- **Page `<n>.pa`:** u32 checksum, u32 total length, u32 header size (0x38), u32 object count, page name at 0x18;
  object table (offset, size, 0); every object = length-prefixed records: `att-N` + N attributes (name 16 bytes +
  value LE), then `codes<event>-N` + N **plain source lines** (the editor compiles), empty record = end. `id` =
  position in the table (`Page.bytes()` renumbers).
- **`main.HMI`:** page order as 16-byte file names; page id = position. Do not move existing pages – append new ones
  behind the last page (see `card_device.py`). Some header words change with the page count; when in doubt let the
  editor create the page (copy + rename) and fill it by script.
- **New page:** every page with `tmSerial` has a `pageType` switch (`if(tId.txt=="<name>") page <name>`) – the new
  page must be added to **all** of them.
- **Pictures:** embedded PNGs (`\x89PNG…IEND`, 36-byte header before). File order ≠ picture id – map via size/content
  and the `pic` attributes.

## 4. Fonts and text

- Font id = position among the `zi` entries of `main.HMI`, **not** the section name. EU: 0 = 24 px text, 1 = 32 px
  icons, 2 = 32 px text, 3 = 48 px icons, 4 = Bold 80 incl. icons (digit 33 px, icon 66 px), 5 = 128 px ASCII only.
  Icons (U+E000…U+FDFF) exist only in fonts 1, 3, 4. us-p fonts 0/2 are a different variant (other widths, no €).
- Icon glyph = MDI code point − 0xF0001 + 0xE000; glyphs never move. Own icons FD40–FD7F, FD80–FDFF reserved.
  Source of truth `script/icons.json` (+ `script/custom-icons.json`), generated with `script/update-icons.ts`.
- Text width = Σ (left + width + right) of the zi table, no kerning → exactly computable (`font_widths.py`).
- `isbr=1` wraps per character, mid-word. The adapter builds the lines itself, separated by **CR LF**. Text in a box
  that is too low is not drawn at all. Max glyph height/width 255 px (u8).
- Visible area: EU x 0–449 (the rest is under the frame; `m0` at x=462 is the red “change model” strip), us-l x 15–464,
  us-p full width.
- Editor warning “Component overlap” only for exactly identical rectangles – shift by 1–3 px.
- The display ignores `aph` (alpha) – no transparency possible.

## 5. Page RAM – the hard limit

- **Page + global ≤ 3584 bytes** (global ≈ 428 in the editor, 436 in the TFT). Several pages are close to it
  (cardMedia EU was 3580 before `shrink_id_buffers.py`). Every script that adds objects must print an estimate before
  and after and stop above the limit.
- Estimate: Σ base cost per object (text ≈ 9, string/number variable ≈ 5, timer ≈ 4, picture ≈ 6, TouchCap 4, page 9;
  ~7 per new object in practice) + Σ text buffers `ceil((txt_maxl+1)/4)*4`. So use `txt_maxl` = 4k−1 (3, 7, 11, 15,
  23, 47, …). Accuracy about ±50 bytes – the editor value of the maintainer is the truth.
- Measuring a compiled TFT: page table of 16-byte entries, first u32 = page RAM, in `main.HMI` page order, end
  `0xFFFFFFFF` + global.
- Do not shrink a buffer without checking every writer (adapter **and** the old script NSPanelTs write long ids into
  some `entn*`, see `shrink_id_buffers.py`).

## 6. Protocol (what the pages talk)

- Frame both directions: `55 BB`, u16 LE length, payload, CRC16 Modbus (0xA001) LE over everything before. Display
  receive buffer 1023 bytes → payload ≤ **1017**; `strCommand` txt_maxl ≤ 1019. Display → Tasmota: keep events
  < ~250 bytes.
- Messages to the panel: `CustomSend` (MQTT `cmnd/<topic>/CustomSend`), fields separated by `~`; from the panel
  `tele/<topic>/RESULT` `{"CustomRecv":"event,…"}`. Full message list: `HMI/Readme.md`.
- Since 6.1.0 every processed message is acknowledged with `event,ack,<crc>`; `load` sends
  `event,renderCurrentPage,<crc>` (details `display_ack.py`). New pages must keep this (copy `tmSerial` from an
  existing page, as `card_device.py` copies cardGrid).
- Cell/item fields: `type~intName~icon~iconColor~displayName~optionalValue`; icon text may end with `¬<font id>`.
- `pageType~` always reloads the page (values, colors and a notification are gone). While a notification is shown the
  screensaver drops `weatherUpdate` and `color~`.

## 7. Testing on hardware / Tasmota – careful

- **Never** send `FlashNextion*` without real arguments, nor empty `CustomSend` or raw `Nextion` commands as a probe –
  the display can end in upload-wait mode and only a power cycle helps. For checks use `Status 0`,
  `GetDriverVersion`.
- Raw Nextion commands are ignored while `recmod=1`: send the escape `Nextion DRAKJHSUYDGBNCJHGJKSHBDN`, then
  `Nextion recmod=0`, your commands (e.g. `Nextion get tTime.pco` → answer `{"nextion":"bytes('71…')"}` on the
  console), then `Nextion recmod=1`.
- Console: `http://<ip>/cs?c2=<counter>` polled; `WebLog 3` shows CustomSend payloads (set back to 2, it is stored).
  `{"nextion":"bytes('24')"}` = serial buffer overflow → `Restart 1` on Tasmota helps.
- Only test on panels the maintainer names; short tests at a steady pace, the maintainer watches the display.

## 8. Before you hand over

- Script committed in `HMI/tools/` with a docstring (usage, input version, what changes and why, RAM effect).
- Output HMI(s) for every model checked (`check()`, round trip), RAM estimates printed.
- If the adapter or the web panel (`src-web/src/cards/…`) has to follow (new fields, widths), say so – the HMI alone
  is never the whole feature. Document new messages in `HMI/Readme.md`.
