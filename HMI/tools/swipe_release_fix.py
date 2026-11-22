"""HMI 6.2.0 (stays 6.2.0): a tap on a swipe strip of a card page shows the arrow pressed but never sends anything.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/swipe_release_fix.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/swipe_release_fix.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/swipe_release_fix.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p), the output must not exist.

Finding: the card pages (cardGrid, cardGrid2, cardGrid3, cardEntities, cardMedia, cardAlarm, cardPower, cardChart,
cardLChart, cardPChart, cardThermo, cardThermo2, cardSchedule, cardQR) have hotspots (type 109) mSwipePrev (left
edge), mSwipeUp (above bPrev) and mSwipeNext (right edge). Their only code is 'down': 'click bPrev,1' or
'click bNext,1'. The arrows bPrev/bNext send in their 'up' event (event,buttonPress2/3,<nent>,button, short or long
over tmLPNav); 'down' only shows the arrow pressed and starts tmLPNav. So a tap on a strip shows the arrow pressed
and never sends; the long press timer is only stopped by tc0 when the finger is lifted.
Fix: every object whose name starts with 'mSwipe', whose 'down' (without empty and comment lines) is exactly
'click <X>,1' and whose 'up' is empty gets the 'up' code 'click <X>,0' - releasing the strip runs the normal 'up'
code of the arrow (short/long). The script goes over all pages (no fixed page list), so later copied pages such as
a cardEntities2 are covered too. Nothing else changes: no geometry, no other code, pageStartup.tRelease and version
numbers stay as they are.

Checks (SystemExit): every mSwipe object is a hotspot (type 109) with a 'down' and an 'up' event; the target <X>
exists once on the page and is a button (type 98); a 'down' or 'up' that is not the known code is reported and
stops the script (no silent skip); an 'up' that already is 'click <X>,0' is reported as 'already fixed' and left
alone; every changed page round-trips; the checksums of the output are checked with Hmi.check().
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402

PREFIX = 'mSwipe'
HOTSPOT_TYPE, BUTTON_TYPE = 109, 98
CLICK = re.compile(r'click\s+(\w+)\s*,\s*([01])')


def code_lines(lines):
    """the code without empty and comment lines"""
    return [x.strip() for x in lines if x.strip() and not x.strip().startswith('//')]


def event(page_name, obj, name):
    try:
        return obj.code(name)
    except KeyError:
        raise SystemExit(f'{page_name}.{obj.name}: no {name} event') from None


def fix_swipe(page_name, page, obj):
    """returns 'fixed <X>' or 'already fixed <X>'"""
    if obj.get('type') != HOTSPOT_TYPE:
        raise SystemExit(f'{page_name}.{obj.name}: type {obj.get("type")}, not a hotspot ({HOTSPOT_TYPE})')
    down = code_lines(event(page_name, obj, 'down'))
    up = code_lines(event(page_name, obj, 'up'))
    match = CLICK.fullmatch(down[0]) if len(down) == 1 else None
    if not match or match.group(2) != '1':
        raise SystemExit(f'{page_name}.{obj.name}: unknown down code {obj.code("down")!r}')
    target = match.group(1)
    names = [o.name for o in page.objs]
    if names.count(target) != 1 or page.obj(target).get('type') != BUTTON_TYPE:
        raise SystemExit(f'{page_name}.{obj.name}: target {target} is not a single button (type {BUTTON_TYPE})')
    release = f'click {target},0'
    if up == [release]:
        return f'{obj.name} already fixed ({release})'
    if up:
        raise SystemExit(f'{page_name}.{obj.name}: unknown up code {obj.code("up")!r}')
    obj.set_code('up', [release])
    return f'{obj.name} up: {release}'


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    order = [m.group(1).decode() + '.pa' for m in re.finditer(rb'(\d+)\.pa\x00', hmi.files['main.HMI'])]
    changes = {}
    fixed = already = 0
    for sec in order:
        page = Page(hmi.files[sec])
        name = page.objs[0].name
        notes = []
        changed = False
        for obj in page.objs[1:]:
            if not obj.name.startswith(PREFIX):
                continue
            note = fix_swipe(name, page, obj)
            notes.append(note)
            if 'already fixed' in note:
                already += 1
            else:
                fixed += 1
                changed = True
        if notes:
            print(f'{sec:6} {name:13} {"; ".join(notes)}')
        if changed:
            out = page.bytes()
            Page(out)  # round trip of the result
            changes[sec] = out
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {fixed} hotspots fixed, {already} already fixed, '
          f'{len(changes)} pages changed')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
