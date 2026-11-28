"""HMI 6.3.0 (EU, us-l, us-p; tRelease stays, card_device.py raises it): cardEntities - a tap on the left side of a
row without popup sends buttonPress3.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/entities_left_tap.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/entities_left_tap.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/entities_left_tap.py HMI/nspanel-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project of any model with the page cardEntities, the output must not exist.

This is part 2 of entities2_five_rows.py (EU) as a script of its own: it needs no page cardEntities2, so it also
runs on us-l and us-p, which do not get that page (decision of the maintainer: cardEntities2 stays an EU leftover).
A cardEntities2 that exists (EU) is patched too. The generated code is the one of entities2_five_rows.tap_lines -
on EU 6.2.0 the result of cardEntities is the same as in nspanel-v6.2.0.entities5.HMI (checked).

Finding: every row of cardEntities has a hotspot m<row-1> (type 109) over icon and name. Its 'down' puts name, id
and icon into pageIcons.tTmp1/2/3 (EU also the icon colour into tempIconColor - us-l/us-p do not have that line,
their popupSlider does not read it; kept as it is), then opens the popup of the type (shutter, shutter2, light,
light2, fan, input_sel, timer, number); type text sends event,buttonPress2,<entn>,button. Every other type (switch,
button, ...) does nothing on the left side.
Change, per row: the popup types stay; they become one if/else-if chain, and the last branch is 'everything else':
  }else if(type<r>.txt!="delete"&&type<r>.txt!="")
  {
    tSend.txt="event,buttonPress3,"+entn<r>.txt+",button"   (+ the send lines)
  }
So text, switch, button and unknown types send event,buttonPress3,<entn>,button at once when the left side is
touched (no hold time, no feedback - as on EU); an empty row or 'delete' sends nothing. The controls on the right
(btOnOff, bText, slider, shutter buttons) are not touched. cardSchedule is not changed.
Rows: every hotspot m<n> of the page - EU and us-l have 4 rows (m0..m3), us-p has 6 row sets (m0..m5; the adapter
fills 5).
Side effect on us-p: rows 5 and 6 of 6.2.0 test 'type4' instead of their own type in the old text branch (copy
mistake of the base project, reported by the script); the new last branch uses the type of the row.

Idempotent: a row that already has the new code is reported as 'already' and left alone. Checks (SystemExit): the
hotspot type, the header lines, every other 'down' that is not the known 6.2.0 code (no silent skip), the objects
type<r>, entn<r>, tEntity<r>, tIcon<r> exist; changed pages round-trip, Hmi.check() on the output.
RAM: unchanged (code only).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from entities2_five_rows import old_tap_lines, tap_lines  # noqa: E402
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402

PAGES = ('cardEntities', 'cardEntities2')
HOTSPOT_TYPE = 109
ROW_AREA = re.compile(r'm(\d+)')
OLD_TEXT = re.compile(r'if\(type(\d+)\.txt=="text"\)')


def header_lines(row):
    """what a touch area hands to a popup; the 4th line exists on EU only"""
    return [f'pageIcons.tTmp1.txt=tEntity{row}.txt', f'pageIcons.tTmp2.txt=entn{row}.txt',
            f'pageIcons.tTmp3.txt=tIcon{row}.txt', f'tempIconColor=tIcon{row}.pco']


def patch_row(page, area):
    """returns the note for the row"""
    name = page.objs[0].name
    row = int(ROW_AREA.fullmatch(area.name).group(1)) + 1
    if area.get('type') != HOTSPOT_TYPE:
        raise SystemExit(f'{name}.{area.name}: type {area.get("type")}, not a hotspot ({HOTSPOT_TYPE})')
    names = {o.name for o in page.objs}
    missing = [n for n in (f'type{row}', f'entn{row}', f'tEntity{row}', f'tIcon{row}') if n not in names]
    if missing:
        raise SystemExit(f'{name}.{area.name}: no {", ".join(missing)}')
    down = [x.strip() for x in area.code('down')]
    known = header_lines(row)
    for count in (4, 3):
        header = known[:count]
        if down[:count] == header and not down[count].startswith(known[3][:13]):
            break
    else:
        raise SystemExit(f'{name}.{area.name}: unexpected header of the down code: {down[:4]}')
    body = down[len(header):]
    if down == [x.strip() for x in tap_lines(row, header)]:
        return f'{area.name} already'
    old = [x.strip() for x in old_tap_lines(row, [])]
    note = ''
    # the text branch of the base project: on us-p rows 5/6 test the type of row 4
    at = [i for i, x in enumerate(old) if OLD_TEXT.fullmatch(x)]
    if len(at) != 1 or len(body) != len(old):
        raise SystemExit(f'{name}.{area.name}: unexpected down code:\n' + '\n'.join(area.code('down')))
    found = OLD_TEXT.fullmatch(body[at[0]])
    if found and int(found.group(1)) != row:
        note = f' (the old text branch tested type{found.group(1)})'
        body[at[0]] = old[at[0]]
    if body != old:
        raise SystemExit(f'{name}.{area.name}: unexpected down code:\n' + '\n'.join(area.code('down')))
    area.set_code('down', tap_lines(row, header))
    return f'{area.name} row {row}{note}'


def patch_page(page):
    """[notes]; the page changed if a note does not end with 'already'"""
    areas = sorted((o for o in page.objs if ROW_AREA.fullmatch(o.name)), key=lambda o: int(o.name[1:]))
    if not areas:
        raise SystemExit(f'{page.objs[0].name}: no touch areas m<n>')
    return [patch_row(page, area) for area in areas]


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    sections = {Page(data).objs[0].name: sec for sec, data in hmi.files.items() if sec.endswith('.pa')}
    if PAGES[0] not in sections:
        raise SystemExit(f'no page {PAGES[0]}')
    changes = {}
    for name in PAGES:
        if name not in sections:
            print(f'{name}: not in the project, skipped')
            continue
        page = Page(hmi.files[sections[name]])
        notes = patch_page(page)
        print(f'{sections[name]:6} {name:13} left tap -> buttonPress3: {", ".join(notes)}; RAM unchanged')
        if any(not x.endswith('already') for x in notes):
            out = page.bytes()
            Page(out)  # round trip of the result
            changes[sections[name]] = out
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
