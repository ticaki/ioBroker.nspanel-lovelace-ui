"""HMI 6.3.0 (tRelease stays, card_device.py raises it): us-p cardSchedule - a tap on a shutter2 row does nothing.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/schedule_shutter2_fix.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project of any model with the pages cardSchedule and popupShutter2 (also a file of the device page
chain, the other tools do not touch cardSchedule). The output must not exist. On a project without the gap (EU,
us-l, an already fixed us-p) the script reports 'nothing to do' and the output has the same sections as the input.

Finding: the touch areas m0..m5 of the rows of cardSchedule open the popup of the row type in 'down'
(pageIcons.tTmp1..3 = name, id, icon of the row, then 'if(type<r>.txt=="<type>") page popup<X>'). On EU and us-l
the branch for "shutter" is followed by one for "shutter2" that opens popupShutter2; on us-p (all six rows) this
branch is missing, so a tap on a shutter2 row does nothing - the page popupShutter2 exists on us-p and is opened
from every other card page. All other branches (light, light2, fan, input_sel, timer, number, text) and the 'up'
events are the same on all three models (compared line by line, row index renamed).
Fix: behind the "shutter" branch of every row comes a copy of it with "shutter2" and 'page popupShutter2' - the same
lines as on EU and us-l (including the comment line of the copied branch). popupShutter2 takes name, id and icon from
pageIcons.tTmp1..3 like popupShutter; those lines are already in front of the branches.

Checks (SystemExit, no silent skip): every m<k> (k = 0..5) exists once, has a 'down' event that sets pageIcons.tTmp2
from entn<k+1> and has exactly one "shutter" branch of the known form ('{', comment lines, 'page popupShutter', '}');
a "shutter2" branch is either absent or exactly the expected copy directly behind it ('already fixed'); the page
popupShutter2 exists. Nothing else changes: no geometry, no new objects or variables, no RAM (code only),
pageStartup.tRelease stays. Idempotent; the changed page round-trips, Hmi.check() on the output.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block  # noqa: E402

PAGE = 'cardSchedule'
POPUP = 'popupShutter2'
ROWS = 6


def branch_start(lines, row, kind):
    """indices of the lines 'if(type<row>.txt=="<kind>")'"""
    head = f'if(type{row}.txt=="{kind}")'
    return [i for i, x in enumerate(lines) if x.strip() == head]


def fix_row(obj, row):
    """returns a note; changes obj when the shutter2 branch is missing"""
    where = f'{PAGE}.{obj.name}.down'
    try:
        lines = obj.code('down')
    except KeyError:
        raise SystemExit(f'{where}: no down event') from None
    if f'pageIcons.tTmp2.txt=entn{row}.txt' not in [x.strip() for x in lines]:
        raise SystemExit(f'{where}: does not hand over entn{row} in pageIcons.tTmp2')
    starts = branch_start(lines, row, 'shutter')
    if len(starts) != 1:
        raise SystemExit(f'{where}: {len(starts)} "shutter" branches, expected 1')
    a, b = block(lines, starts[0])
    shutter = lines[a:b]
    body = [x.strip() for x in shutter[1:]]
    if body[0] != '{' or body[-1] != '}' or [x for x in body[1:-1] if not x.startswith('//')] != ['page popupShutter']:
        raise SystemExit(f'{where}: unknown "shutter" branch {shutter!r}')
    want = [x.replace('=="shutter")', '=="shutter2")').replace('page popupShutter', f'page {POPUP}')
            for x in shutter]
    existing = branch_start(lines, row, 'shutter2')
    if existing:
        if existing != [b] or lines[b:b + len(want)] != want:
            raise SystemExit(f'{where}: "shutter2" branch present but not the expected copy behind "shutter"')
        return f'{obj.name} already fixed'
    obj.set_code('down', lines[:b] + want + lines[b:])
    return f'{obj.name} +shutter2 ({len(want)} lines)'


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    sections = {Page(data).objs[0].name: sec for sec, data in hmi.files.items() if sec.endswith('.pa')}
    for name in (PAGE, POPUP):
        if name not in sections:
            raise SystemExit(f'no page {name}')
    sec = sections[PAGE]
    page = Page(hmi.files[sec])
    names = [o.name for o in page.objs]
    notes, changed = [], 0
    for k in range(ROWS):
        if names.count(f'm{k}') != 1:
            raise SystemExit(f'{PAGE}: {names.count(f"m{k}")} objects m{k}, expected 1')
        note = fix_row(page.obj(f'm{k}'), k + 1)
        changed += 'already' not in note
        notes.append(note)
    changes = {}
    if changed:
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[sec] = out
        print(f'{sec:6} {PAGE}: ' + '; '.join(notes))
    else:
        print(f'{sec:6} {PAGE}: every row opens {POPUP} - nothing to do')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {changed} rows fixed, {len(changes)} pages changed'
          + ('' if changes else ' (nothing to do)') + '; RAM unchanged')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
