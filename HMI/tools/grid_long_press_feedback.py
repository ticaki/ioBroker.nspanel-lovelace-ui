"""HMI 6.3.0 (tRelease stays, card_device.py raises it): the background of a held grid cell blinks green/grey while
its long press is armed.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/grid_long_press_feedback.py <in.HMI> <out.HMI> [<ref.tft>]
Input: a 6.2.0 project (EU, us-l or us-p - the long press code of the grid pages is the same on all three, us-p
cardGrid2 has 9 cells) with the pages cardGrid, cardGrid2 and cardGrid3, the output must not exist. <ref.tft>:
optional, a TFT compiled from a project whose grid pages are identical to the input - its page RAM table gives the
exact RAM before the change (nav_long_press_blink.tft_ram).
card_device.py uses remove()/add() of this module: the device pages cardDevice1-3 get the same feedback when they
are built, from a cardGrid with or without the feedback - there also for the elements without a button (status
cells, hotspots), see 'what blinks'.

Finding: a cell (bEntity<k>, a button) starts the timer tmLP (500 ms) in 'down'. The types shutter/shutter2/
input_sel/timer have opened their popup there already; in the timer light/light2/fan/number open theirs, every other
type only sets LPState=1, and 'up' then sends event,buttonPress3 instead of event,buttonPress2. While the finger is
down the cell only shows the pressed look of the button (bco2), the same as for a short tap: the user cannot see
that the long press is reached. The screensaver indicators have the blinking clock, the arrows the blinking heading
(nav_long_press_blink.py) for that.

Fix, per page:
  new variable     vaLPCell (number, copy of LPState, appended as the last object): the number 1..n of the held
                   cell (every object that starts tmLP gets one), 0: nothing blinks.
  cell 'down'      behind 'tmLP.en=1': vaLPCell.val=<k>. Where 'up' sends nothing for type text without an
                   intName (device pages: if(type<k>.txt!="text"||entn<k>.txt!=""), or with the type as a number
                   since device13 if(type<k>.val!=1||...)), 'down' sets 0 for that case: no feedback for a press
                   that reports nothing.
  what blinks      a button (type 98): its own background, bco and bco2 (as the arrows write pco and pco2:
                   whichever of the two the display uses for a held button shows the colour). A text with touch
                   code (type 116, the status cells): its bco. Any other object (a hotspot): the texts under it
                   that the caller names (add(page, targets) - card_device.py names the name field of the element).
  tmLP 'timer'     behind 'LPState.val=1' (the popup types have left the page before): with vaLPCell > 0 the
                   interval goes to 200 ms and the held cell toggles its background, first green (2016), then the
                   grey of a pressed button (bco2 of the design, 14823), 200 ms per phase - the rhythm and the
                   green of the screensaver/arrow feedback.
  restore          if(tmLP.tim!=500): tmLP.tim=500, the cell gets bco=defaultBcoColor (what the page 'load' gave
                   every button and text) and a button its design bco2 back. In every cell 'up' behind 'tmLP.en=0'
                   (in front of the send, which stays as it is) and at the end of tc0 'up' together with tmLP.en=0
                   (tc0 gets every release, also one the cell does not get). In tc0 the tmLP.en=0 stands inside
                   the if: tc0 stops the timer only once the cell blinks. A release before the 500 ms that
                   reaches tc0 but not the cell leaves tmLP running - it then arms the long press and the cell
                   blinks until the next release anywhere on the page (not seen, see device-page-hmi.md).
Other ways out: a page change (popup, pageType of the adapter after sleepReached, navigation) loads the page again,
bco2, tmLP.tim and the variables are local and start with their design values. An entityUpd while a cell is held
writes neither bco nor bco2 of a cell (checked: the only writer of a bco on the page is the 'load' loop, which must
cover every cell), so the blinking goes on and the release restores it.
Nothing else changes: LPState, the events and their time, the popups, no geometry, pageStartup.tRelease.

Idempotent: the generated lines stand between two marker comments; a page that has them is cleaned first
(remove) and patched again, the result is the same. Checks (SystemExit): tmLP (500 ms, off, the known timer code
ending in LPState.val=1), LPState, tc0 with an 'up' event, every user of tmLP with exactly one 'tmLP.en=1' in 'down'
and 'tmLP.en=0' as the first line of 'up', every blinking object a button or text inside the 'load' loop, bco2 of
the buttons the known grey, no other writer of bco/bco2.
RAM: one number variable (RAM_VAR bytes), printed per page, stop above RAM_LIMIT (global + page).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402

PAGES = ('cardGrid', 'cardGrid2', 'cardGrid3')
TIMER, STATE, CELL = 'tmLP', 'LPState', 'vaLPCell'
GREEN, GREY = 2016, 14823  # the green of the other long press feedbacks, bco2 of a pressed button
LP_TIME, BLINK_TIME = 500, 200
BUTTON_TYPE, TEXT_TYPE, TIMER_TYPE, VAR_TYPE, TOUCHCAP_TYPE = 98, 116, 51, 52, 5
BACKGROUND = 'defaultBcoColor'
BEGIN = '// >> long press feedback (grid_long_press_feedback.py)'
END = '// << long press feedback'
# a number variable in the page RAM table of compiled TFTs (see nav_long_press_blink.py)
RAM_VAR = 8
RAM_LIMIT = 3584

OLD_TIMER = [x for t, p in (('light', 'popupLight'), ('light2', 'popupLight2'), ('fan', 'popupFan'),
                            ('number', 'popupSlider'))
             for x in (f'if(tTmp.txt=="{t}")', '{', f'  page {p}', '}')] + [f'{STATE}.val=1']
TIMER_USE = re.compile(rf'\b{TIMER}\b')
# 'type text without an intName sends nothing': the type as a name (cardGrid copies) or as a number, 1 = text and
# every other type that only sends (card_device.py since device13)
TEXT_GUARD = re.compile(r'if\((\w+)\.(txt!="text"|val!=1)\|\|(\w+)\.txt!=""\)')
BCO_WRITE = re.compile(r'^\s*(?:covx\s+[^,]+,\s*)?[\w\[\]]+\.bco2?\s*(?:=(?!=)|,)')
LOAD_LOOP = re.compile(r'for\(sys0=0;sys0<(\d+);sys0\+\+\)')


def codes(obj):
    return [(item[1], item[2]) for item in obj.items if item[0] == 'code']


def strip_marked(lines):
    """the lines without the generated blocks (BEGIN .. END, both included)"""
    out, inside = [], False
    for line in lines:
        text = line.strip()
        if text.startswith(BEGIN):
            if inside:
                raise SystemExit('nested feedback block')
            inside = True
        elif text == END:
            if not inside:
                raise SystemExit('feedback block end without a begin')
            inside = False
        elif not inside:
            out.append(line)
    if inside:
        raise SystemExit('feedback block without an end')
    return out


def marked(ind, title, lines):
    return [f'{ind}{BEGIN}: {title}'] + [ind + x for x in lines] + [ind + END]


def remove(page):
    """takes the feedback out of a page again (the code and vaLPCell); True if there was one"""
    had = False
    for obj in page.objs:
        for item in obj.items:
            if item[0] == 'code':
                clean = strip_marked(item[2])
                if clean != item[2]:
                    item[2] = clean
                    had = True
    if any(o.name == CELL for o in page.objs):
        page.objs = [o for o in page.objs if o.name != CELL]
        had = True
    return had


def users(page):
    """the objects whose code starts tmLP (without tmLP and tc0)"""
    return [o for o in page.objs if o.name not in (TIMER, 'tc0')
            and any(TIMER_USE.search(line.split('//')[0]) for _, lines in codes(o) for line in lines)]


def check(page, targets):
    """the page has the known long press of the cells and no feedback;
    returns [(object, down index, guard, [blinking objects])]"""
    name = page.objs[0].name
    names = [o.name for o in page.objs]
    for obj, kind in ((TIMER, TIMER_TYPE), (STATE, VAR_TYPE), ('tc0', TOUCHCAP_TYPE)):
        if names.count(obj) != 1 or page.obj(obj).get('type') != kind:
            raise SystemExit(f'{name}: no single {obj} of type {kind}')
    if CELL in names:
        raise SystemExit(f'{name}: {CELL} exists')
    timer = page.obj(TIMER)
    if timer.code('timer') != OLD_TIMER or timer.get('tim') != LP_TIME or timer.get('en') != 0:
        raise SystemExit(f'{name}.{TIMER}: not the known timer ({LP_TIME} ms, off, popups, {STATE}.val=1)')
    if page.obj(STATE).get('sta') != 0:
        raise SystemExit(f'{name}.{STATE}: not a number variable')
    try:
        page.obj('tc0').code('up')
    except KeyError:
        raise SystemExit(f'{name}.tc0: no up event') from None
    for obj in page.objs:
        for event, lines in codes(obj):
            for line in lines:
                code = line.split('//')[0]
                if BCO_WRITE.match(code) and not (obj is page.objs[0] and event == 'load'):
                    raise SystemExit(f'{name}.{obj.name}.{event}: writes a background colour: {line.strip()}')
                if CELL in code:
                    raise SystemExit(f'{name}.{obj.name}.{event}: uses {CELL}')
    loops = [int(m.group(1)) for line in page.objs[0].code('load') for m in [LOAD_LOOP.search(line)] if m]
    if len(loops) != 1 or f'b[sys0].bco={BACKGROUND}' not in [x.strip() for x in page.objs[0].code('load')]:
        raise SystemExit(f'{name}: no single load loop that sets b[sys0].bco={BACKGROUND}')
    found = []
    for obj in users(page):
        events = dict(codes(obj))
        if sorted(e for e, lines in events.items() if any(TIMER_USE.search(x) for x in lines)) != ['down', 'up']:
            raise SystemExit(f'{name}.{obj.name}: {TIMER} outside of down/up')
        starts = [i for i, x in enumerate(events['down']) if x.strip() == f'{TIMER}.en=1']
        if len(starts) != 1 or sum(bool(TIMER_USE.search(x)) for x in events['down']) != 1:
            raise SystemExit(f'{name}.{obj.name}: down does not start {TIMER} exactly once')
        up = events['up']
        if up[0] != f'{TIMER}.en=0' or sum(bool(TIMER_USE.search(x)) for x in up) != 1 \
                or sum('buttonPress3' in x for x in up) != 1 or sum(x.strip() == f'{STATE}.val=0' for x in up) != 1:
            raise SystemExit(f'{name}.{obj.name}: up is not the known long press code')
        guards = [m for x in up for m in [TEXT_GUARD.fullmatch(x.strip())] if m]
        if len(guards) > 1:
            raise SystemExit(f'{name}.{obj.name}: more than one text guard in up')
        if obj.get('type') in (BUTTON_TYPE, TEXT_TYPE):
            blink = [obj]
        elif obj.name in targets:
            blink = [page.obj(n) for n in targets[obj.name]]
        else:
            raise SystemExit(f'{name}.{obj.name}: neither button nor text and no object named that blinks for it')
        if not blink:
            raise SystemExit(f'{name}.{obj.name}: nothing to blink')
        for b in blink:
            if b.get('type') not in (BUTTON_TYPE, TEXT_TYPE) or page.objs.index(b) >= loops[0]:
                raise SystemExit(f'{name}.{b.name}: no button/text inside of the load loop (b[0..{loops[0] - 1}])')
            if b.get('type') == BUTTON_TYPE and b.get('bco2') != GREY:
                raise SystemExit(f'{name}.{b.name}: bco2 {b.get("bco2")}, not {GREY}')
        found.append((obj, starts[0], guards[0] if guards else None, blink))
    if not found:
        raise SystemExit(f'{name}: nothing uses {TIMER}')
    return found


def chain(cells, body):
    """one branch per cell: if(vaLPCell.val==<k>) { body(blinking objects) }"""
    out = []
    for k, blink in cells:
        out += [f'if({CELL}.val=={k})', '{'] + ['  ' + x for x in body(blink)] + ['}']
    return out


def timer_lines(cells):
    def toggle(blink):
        first = blink[0].name
        out = [f'if({first}.bco=={GREEN})', '{', f'  {first}.bco={GREY}', '}else', '{', f'  {first}.bco={GREEN}', '}']
        out += [f'{b.name}.bco={first}.bco' for b in blink[1:]]
        return out + [f'{b.name}.bco2={first}.bco' for b in blink if b.get('type') == BUTTON_TYPE]
    return marked('', f'the held cell blinks green/grey, {BLINK_TIME} ms per phase, until the release',
                  [f'if({CELL}.val>0)', '{', f'  {TIMER}.tim={BLINK_TIME}', '}'] + chain(cells, toggle))


def restore_lines(cells, ind, stop):
    def back(blink):
        return [f'{b.name}.bco={BACKGROUND}' for b in blink] + [
            f'{b.name}.bco2={b.get("bco2")}' for b in blink if b.get('type') == BUTTON_TYPE]
    return marked(ind, 'the cell blinked - its colours back',
                  [f'if({TIMER}.tim!={LP_TIME})', '{'] + ([f'  {TIMER}.en=0'] if stop else [])
                  + [f'  {TIMER}.tim={LP_TIME}'] + ['  ' + x for x in chain(cells, back)] + ['}'])


def add(page, targets=None):
    """adds the feedback to a page without one; targets: {object without a background: [names of the texts that
    blink for it]}; returns ['<touched object>' or '<touched object> -> <blinking objects>']"""
    found = check(page, targets or {})
    cells = [(k, blink) for k, (_, _, _, blink) in enumerate(found, 1)]
    for k, (obj, start, guard, _) in enumerate(found, 1):
        down = obj.code('down')
        ind = down[start][:len(down[start]) - len(down[start].lstrip())]
        lines = [f'{CELL}.val={k}']
        if guard:
            same = 'txt=="text"' if guard.group(2).startswith('txt') else 'val==1'
            lines += [f'if({guard.group(1)}.{same}&&{guard.group(3)}.txt=="")', '{', f'  {CELL}.val=0', '}']
        down[start + 1:start + 1] = marked(ind, 'which cell blinks', lines)
        up = obj.code('up')
        up[1:1] = restore_lines(cells, '', False)
    page.obj(TIMER).code('timer').extend(timer_lines(cells))
    page.obj('tc0').code('up').extend(restore_lines(cells, '', True))
    var = page.obj(STATE).copy()
    var.set('objname', CELL)
    var.set('val', 0)
    page.objs.append(var)
    return [obj.name if blink == [obj] else f'{obj.name} -> {"+".join(b.name for b in blink)}'
            for obj, _, _, blink in found]


def main(source, target, tft=None):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    table, glob = (None, None)
    if tft:
        from nav_long_press_blink import tft_ram
        table, glob = tft_ram(hmi, tft)
    sections = {Page(data).objs[0].name: sec for sec, data in hmi.files.items() if sec.endswith('.pa')}
    changes = {}
    for name in PAGES:
        if name not in sections:
            raise SystemExit(f'no page {name}')
        section = sections[name]
        page = Page(hmi.files[section])
        had = remove(page)
        cells = add(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        state = 'unchanged' if out[4:] == hmi.files[section][4:] else 'rebuilt' if had else 'new'
        if state != 'unchanged':
            changes[section] = out
        added = 0 if had else RAM_VAR
        if table is None:
            ram = f'RAM +{added} (one number variable, no reference TFT given)'
        else:
            old = glob + table[name]
            ram = f'RAM (global + page) {old} -> {old + added} of {RAM_LIMIT}, {RAM_LIMIT - old - added} free'
            if old + added > RAM_LIMIT:
                raise SystemExit(f'{name}: RAM {old + added} > {RAM_LIMIT}')
        print(f'{section:6} {name:10} feedback {state}: {", ".join(cells)}; {ram}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4):
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
