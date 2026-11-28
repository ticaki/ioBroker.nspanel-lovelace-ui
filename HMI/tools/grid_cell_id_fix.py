"""HMI 6.3.0 (tRelease stays, card_device.py raises it): us-p cardGrid3 - cell 4 reports the id of cell 3.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/grid_cell_id_fix.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project of any model with the pages cardGrid, cardGrid2 and cardGrid3 - with or without the long
press feedback of grid_long_press_feedback.py (its marked blocks are ignored). The output must not exist. On a
project without the mistake (EU, us-l, an already fixed us-p) the script reports 'nothing to do' and the output has
the same sections as the input.

Finding: on us-p cardGrid3 the 'up' event of bEntity4 builds its two events with the id of the neighbour:
  tSend.txt="event,buttonPress2,"+entn3.txt+",button"      (and the same line with buttonPress3)
'down' of the same cell uses type4/entn4/tEntity4 as it should, so a popup opens for cell 4 while a tap or a long
press is reported for cell 3. The mistake is in the us-p project since 5.1.1 (5.1.0 still has entn4) and only on
us-p; EU and us-l have entn4 there. With the long press feedback it shows: cell 4 blinks, the event carries the id
of cell 3.
Fix: both lines get entn4.

How it is found (no fixed list of mistakes): on every grid page every cell bEntity<k> must be cell 1 with the names
type1/entn1/tEntity1/bEntity1 renamed to <k>, line by line, in 'down' and 'up' (true for all 9 grid pages of the
three 6.2.0 projects except that one cell). A cell whose only difference is another cell's entn<j> in the two send
lines of 'up' is fixed. Any other difference stops the script (SystemExit, no silent skip) - also a cell with other
events than down/up or a cell 1 that names another cell.

Nothing else changes: no geometry, no other code, no RAM (code only), pageStartup.tRelease stays.
Idempotent; every changed page round-trips, Hmi.check() on the output.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from grid_long_press_feedback import BEGIN, END, PAGES, strip_marked  # noqa: E402
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402

CELL = re.compile(r'bEntity(\d+)')
OWN = re.compile(r'\b(type|entn|tEntity|bEntity)(\d+)\b')
SEND = re.compile(r'tSend\.txt="event,buttonPress[23],"\+entn(\d+)\.txt\+",button"')
EVENTS = ('down', 'up')


def fix_page(page):
    """[notes] of the fixed cells, empty: nothing to do"""
    name = page.objs[0].name
    cells = {int(CELL.fullmatch(o.name).group(1)): o for o in page.objs if CELL.fullmatch(o.name)}
    if 1 not in cells:
        raise SystemExit(f'{name}: no cell bEntity1')
    reference = {}
    for event in EVENTS:
        try:
            reference[event] = strip_marked(cells[1].code(event))
        except KeyError:
            raise SystemExit(f'{name}.bEntity1: no {event} event') from None
        foreign = {a + b for line in reference[event] for a, b in OWN.findall(line.split('//')[0]) if b != '1'}
        if foreign:
            raise SystemExit(f'{name}.bEntity1.{event}: names another cell: {sorted(foreign)}')
    notes = []
    for k, cell in sorted(cells.items()):
        events = [item[1] for item in cell.items if item[0] == 'code']
        if events != list(EVENTS):
            raise SystemExit(f'{name}.{cell.name}: events {events}, not {list(EVENTS)}')
        for event in EVENTS:
            want = [OWN.sub(lambda m: m.group(1) + (str(k) if m.group(2) == '1' else m.group(2)), x)
                    for x in reference[event]]
            got = strip_marked(cell.code(event))
            if got == want:
                continue
            wrong = [(a, b) for a, b in zip(want, got) if a != b]
            # the known mistake: a send line of 'up' with the entn of another cell of the page, nothing else
            known = (event == 'up' and len(got) == len(want) and all(
                SEND.fullmatch(a.strip()) and SEND.fullmatch(b.strip())
                and int(SEND.fullmatch(b.strip()).group(1)) in cells
                and b == a.replace(f'entn{k}', 'entn' + SEND.fullmatch(b.strip()).group(1))
                for a, b in wrong))
            if not known:
                raise SystemExit(f'{name}.{cell.name}.{event}: not cell 1 renamed and not the known mistake:\n'
                                 + '\n'.join(f'  expected {a!r}\n  found    {b!r}' for a, b in wrong[:6])
                                 + (f'\n  {len(want)} lines expected, {len(got)} found' if len(want) != len(got)
                                    else ''))
            # replace the lines in the real code (outside of the feedback blocks)
            replace = {b: a for a, b in wrong}
            lines, inside, done = cell.code(event), False, 0
            for i, line in enumerate(lines):
                if line.strip().startswith(BEGIN):
                    inside = True
                elif line.strip() == END:
                    inside = False
                elif not inside and line in replace:
                    lines[i] = replace[line]
                    done += 1
            if done != len(wrong) or strip_marked(lines) != want:
                raise SystemExit(f'{name}.{cell.name}.{event}: fix failed')
            ids = sorted({'entn' + SEND.fullmatch(b.strip()).group(1) for _, b in wrong})
            notes.append(f'{cell.name} {event}: {", ".join(ids)} -> entn{k} ({done} lines)')
    return notes


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    sections = {Page(data).objs[0].name: sec for sec, data in hmi.files.items() if sec.endswith('.pa')}
    changes = {}
    for name in PAGES:
        if name not in sections:
            raise SystemExit(f'no page {name}')
        page = Page(hmi.files[sections[name]])
        cells = sum(bool(CELL.fullmatch(o.name)) for o in page.objs)
        notes = fix_page(page)
        print(f'{sections[name]:6} {name:10} {cells} cells: ' + ('; '.join(notes) if notes else
                                                                'every cell uses its own id - nothing to do'))
        if notes:
            out = page.bytes()
            Page(out)  # round trip of the result
            changes[sections[name]] = out
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed'
          + ('' if changes else ' (nothing to do)') + '; RAM unchanged')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
