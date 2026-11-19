"""HMI 6.2.0 (stays 6.2.0): the adapter can let the clock of the screensavers blink red/white, and the info icon
next to the clock (tTimeAdd) can be tapped. Pages screensaver, screensaver2, screensaver3 and screensaver5 - not
screensaver4 (the adapter does not use it).

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/screensaver_blink_info_icon.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/screensaver_blink_info_icon.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/screensaver_blink_info_icon.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p, after indicator_long_press_mask.py), the output must not exist.

Finding 1: the adapter has no way to draw attention to the screensaver - the clock always has the colour of color~.
Finding 2: the info icon (tTimeAdd, field 2 of time~: timer, development firmware, firmware update or the icon of the
user) has no touch event on any page. A tap on it is a tap on the background (bExit), the user cannot ask what the
icon means.

Fix 1, per page - the clock blinks red (63488) <-> white (65535), 500 ms per phase:
  statusUpdate  one more field at the end: 7 (the pages read 1..6, screensaver5 only 2 and 4). '1' starts the
                blinking, anything else (empty, 0, missing: old adapter) ends it. Start: vaBlink=1, the colour of the
                clock goes to vaLPCol, tTime.pco red, tmBlink.en=1. End: vaBlink=0, tmBlink.en=0, the clock gets
                vaLPCol back. The statusUpdate branch has no notification guard, the flag also arrives while a
                notification is shown.
  tmBlink       new timer (500 ms, en=0, copy of tm0): toggles tTime.pco red <-> white.
  color~        field 2 goes into vaLPCol instead of tTime.pco while the clock blinks: it keeps blinking and gets the
                new colour when the blinking ends.
  load          (colours of pageType~) needs no change: the local variables start at 0 and tmBlink is off then; the
                adapter sends the flag again with the statusUpdate that follows every pageType~.
screensaver2/screensaver5 only - the long press has priority (vaLPOn==1: tmLP blinks yellow/green):
  vaLPCol       is the normal colour of the clock for both: tmLP stores tTime.pco there only while the clock does not
                blink red/white (vaBlink==0); the start and the end of the red/white blinking leave tTime.pco and
                vaLPCol alone while vaLPOn==1.
  tmBlink       does nothing while vaLPOn==1.
  tc0 'up'      the release of a long press gives the clock red (the blinking goes on) while vaBlink==1, otherwise
                vaLPCol as before.
  color~        the condition of vaLPCol becomes vaLPOn==1||vaBlink==1.

Fix 2, per page - a tap on the info icon, sent on release like an indicator without long press:
  tTimeAdd 'down'  only when tTimeAdd.txt is not empty (otherwise it stays a tap on the background):
                   screensaver2/5: tLPId.txt="bInfo", tSend.txt="" - tc0 'up' sends
                   event,buttonPress2,bInfo,button,<vaTap> (no timer: vaLPOn stays 0), a swipe drops it.
                   screensaver/screensaver3 have no tLPId and no release block; their tc0 'up' sends tSend always (the
                   bExit of tc0 'down' or the swipe): tTimeAdd 'down' writes
                   tSend.txt="event,buttonPress2,bInfo,button,"+<vaTap> instead of the bExit, a swipe overwrites it.
                   No new object.
  The id bInfo (5 characters, tLPId and tId take 7) has no '?': the adapter (Panel.convertToEvent) gets id 'bInfo',
  action 'button', opt = the taps - neither an indicator (<page>?<n>) nor bExit (id screensaver). A touch of a dark
  display (standby brightness 0) still sends the tap with opt 1, the adapter drops it (only a wake tap).
  tc0 'down' runs before tTimeAdd 'down' (it counts vaTap and writes the bExit text).

New objects per page: vaBlink (copy of vaTap), tmBlink (copy of tm0, tim 500, en 0); screensaver/screensaver3 also
vaLPCol (copy of vaTap), appended as the last objects. The script prints the RAM estimate before and after.
pageStartup.tRelease stays 6.2.0.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from indicator_long_press import LP_ID, LP_TIMER  # noqa: E402
from indicator_long_press_mask import YELLOW, blink_timer_lines  # noqa: E402
from indicator_long_press_release import (  # noqa: E402
    COL,
    COLOR_IF,
    COLOR_OLD,
    ON,
    RAM_GLOBAL,
    RAM_LIMIT,
    TEMPLATE,
    color_lines,
    new_release_lines,
    pco_writers,
    ram,
    var_obj,
)
from pagefile import Page, block, find  # noqa: E402
from screensaver5 import SEND  # noqa: E402

LP_PAGES = ('screensaver2', 'screensaver5')
PAGES = ('screensaver', 'screensaver3') + LP_PAGES
BLINK, BLINK_TIMER = 'vaBlink', 'tmBlink'
BLINK_FIELD = 7
BLINK_TIME = 500
RED, WHITE = 63488, 65535
INFO = 'tTimeAdd'
INFO_ID = 'bInfo'
STATUS_IF = 'if(tInstruction.txt=="statusUpdate")'
SPSTR = re.compile(r'spstr strCommand\.txt,[\w.]+\.txt,"~",(\d+)')
BEXIT = ['covx vaTap.val,tTmp.txt,0,0', 'tSend.txt="event,buttonPress2,screensaver,bExit,"+tTmp.txt']
TIMER_TEMPLATE = 'tm0'
# the restore of the clock in tc0 'up' after a long press (indicator_long_press_release.new_release_lines)
LP_RESTORE = ['  if(vaLPOn.val==1)', '  {', '    vaLPOn.val=0', '    tTime.pco=vaLPCol.val', '  }']
# the store of the clock colour in tmLP (indicator_long_press_mask.blink_timer_lines)
LP_STORE = f'  {COL}.val=tTime.pco'


def blink_lines(ind, lp):
    """end of the statusUpdate branch: field 7 starts or ends the red/white blinking"""
    body_on = [f'{COL}.val=tTime.pco', f'tTime.pco={RED}']
    body_off = [f'tTime.pco={COL}.val']
    if lp:
        # a long press blinks yellow/green: vaLPCol already holds the normal colour, the release sets the clock
        body_on = [f'if({ON}.val==0)', '{'] + ['  ' + x for x in body_on] + ['}']
        body_off = [f'if({ON}.val==0)', '{'] + ['  ' + x for x in body_off] + ['}']
    lines = [
        f'// field {BLINK_FIELD}: 1 = the clock blinks red/white (tmBlink), empty/0 = its normal colour (in {COL})',
        f'spstr strCommand.txt,tTmp.txt,"~",{BLINK_FIELD}',
        'if(tTmp.txt=="1")',
        '{',
        f'  if({BLINK}.val==0)',
        '  {',
        f'    {BLINK}.val=1',
        *['    ' + x for x in body_on],
        f'    {BLINK_TIMER}.en=1',
        '  }',
        f'}}else if({BLINK}.val==1)',
        '{',
        f'  {BLINK}.val=0',
        f'  {BLINK_TIMER}.en=0',
        *['  ' + x for x in body_off],
        '}',
    ]
    return [ind + x for x in lines]


def blink_timer_code(lp):
    """code of tmBlink: red <-> white"""
    toggle = [
        f'if(tTime.pco=={RED})',
        '{',
        f'  tTime.pco={WHITE}',
        '}else',
        '{',
        f'  tTime.pco={RED}',
        '}',
    ]
    head = [f'// the clock blinks red/white while statusUpdate field {BLINK_FIELD} is 1, {BLINK_TIME} ms per phase']
    if not lp:
        return head + toggle
    return head + ['// a long press blinks yellow/green (tmLP) and has priority', f'if({ON}.val==0)', '{'] + [
        '  ' + x for x in toggle] + ['}']


def info_down(lp):
    """code 'down' of tTimeAdd: the tap is sent on release by tc0 'up', only with an icon"""
    if lp:
        body = [f'{LP_ID}.txt="{INFO_ID}"', 'tSend.txt=""']
        note = f'// the info icon: a tap without long press, tc0 up sends event,buttonPress2,{INFO_ID},button,<taps>'
    else:
        body = ['covx vaTap.val,tTmp.txt,0,0', f'tSend.txt="event,buttonPress2,{INFO_ID},button,"+tTmp.txt']
        note = '// the info icon: tc0 up sends this instead of the bExit, a swipe overwrites it'
    return [note, f'if({INFO}.txt!="")', '{'] + ['  ' + x for x in body] + ['}']


def lp_color_lines(ind):
    """color~ field 2 of screensaver2/5 after this script"""
    lines = color_lines(ind)
    lines[1] = ind + f'if({ON}.val==1||{BLINK}.val==1)'
    return lines


def lp_release_lines():
    """tc0 'up' of screensaver2/5 after this script"""
    lines = new_release_lines()
    i = find(lines, LP_RESTORE[3].strip())
    lines[i:i + 1] = [
        f'    if({BLINK}.val==1)',
        '    {',
        f'      tTime.pco={RED}',
        '    }else',
        '    {',
        f'      tTime.pco={COL}.val',
        '    }',
    ]
    return lines


def lp_timer_lines():
    """tmLP of screensaver2/5 after this script: vaLPCol keeps the normal colour while the clock blinks red/white"""
    lines = blink_timer_lines()
    i = lines.index(LP_STORE)
    lines[i:i + 1] = [f'  if({BLINK}.val==0)', '  {', '  ' + LP_STORE, '  }']
    return lines


def timer_obj(template, name):
    """a copy of tm0: timer, off, BLINK_TIME, with the code of tmBlink"""
    if template.get('type') != 51:
        raise SystemExit(f'{TIMER_TEMPLATE} is not a timer')
    o = template.copy()
    o.set('objname', name)
    o.set('tim', BLINK_TIME)
    o.set('en', 0)
    return o


def patch_page(page):
    name = page.objs[0].name
    lp = name in LP_PAGES
    names = {o.name for o in page.objs}
    new_vars = [BLINK] if lp else [BLINK, COL]
    for new in new_vars + [BLINK_TIMER]:
        if new in names:
            raise SystemExit(f'{name}: {new} exists')
    for o in page.objs:
        for kind, _, lines in o.items:
            if kind == 'code' and any(BLINK in x or BLINK_TIMER in x or INFO_ID in x for x in lines):
                raise SystemExit(f'{name}.{o.name}: code already uses {BLINK}/{BLINK_TIMER}/{INFO_ID}')
    if not lp and any(kind == 'code' and any(COL in x for x in lines) for o in page.objs for kind, _, lines in o.items):
        raise SystemExit(f'{name}: code already uses {COL}')

    # every writer of tTime.pco is known
    color_old = COLOR_OLD[1]
    expected = [(name, 'load', color_old), ('tmSerial', 'timer', color_old)]
    if lp:
        expected += [('tc0', 'up', f'tTime.pco={COL}.val')] + [(LP_TIMER, 'timer', f'tTime.pco={c}') for c in
                                                                (YELLOW, 2016, YELLOW)]
    if sorted(pco_writers(page)) != sorted(expected):
        raise SystemExit(f'{name}: unexpected writers of tTime.pco: {pco_writers(page)}')

    info = page.obj(INFO)
    if any(kind == 'code' and lines for kind, _, lines in info.items):
        raise SystemExit(f'{name}.{INFO}: has code')
    info.code('down')  # the event exists (empty)

    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    starts = [i for i, line in enumerate(lines) if line.strip() == STATUS_IF]
    if len(starts) != 1:
        raise SystemExit(f'{name}.tmSerial: statusUpdate branch found {len(starts)} times')
    a, b = block(lines, starts[0])
    if lines[a + 1].strip() != '{' or lines[b - 1].strip() != '}':
        raise SystemExit(f'{name}.tmSerial: statusUpdate branch has no {{ }} body')
    fields = sorted({int(m.group(1)) for line in lines[a:b] for m in [SPSTR.search(line)] if m})
    if not fields or max(fields) >= BLINK_FIELD:
        raise SystemExit(f'{name}.tmSerial: statusUpdate reads the fields {fields}, field {BLINK_FIELD} is not free')
    ind = lines[b - 1][:len(lines[b - 1]) - len(lines[b - 1].lstrip())] + '  '

    tc0 = page.obj('tc0')
    down, up = tc0.code('down'), tc0.code('up')
    hits = [i for i in range(len(down) - 1) if down[i:i + 2] == BEXIT]
    if len(hits) != 1:
        raise SystemExit(f'{name}.tc0: down does not write the bExit text once')
    if lp:
        old = new_release_lines()
        rel = [i for i in range(len(up)) if up[i:i + len(old)] == old]
        if len(rel) != 1:
            raise SystemExit(f'{name}.tc0: up has not the release block of indicator_long_press_release.py')
        timer = page.obj(LP_TIMER)
        if timer.code('timer') != blink_timer_lines() or blink_timer_lines().count(LP_STORE) != 1:
            raise SystemExit(f'{name}.{LP_TIMER}: not the code of indicator_long_press_mask.py')
        if page.obj(LP_ID).get('txt_maxl') < len(INFO_ID):
            raise SystemExit(f'{name}.{LP_ID}: txt_maxl < {len(INFO_ID)}')
    else:
        if any(LP_ID in x or 'if(tSend.txt' in x or 'tSend.txt=""' in x for x in up):
            raise SystemExit(f'{name}.tc0: up does not send tSend unconditionally')
        sends = [i for i in range(len(up)) if up[i:i + len(SEND)] == SEND]
        if len(sends) != 1:
            raise SystemExit(f'{name}.tc0: up has no send block at the top level')
        maxl = page.obj('tSend').get('txt_maxl')
        if maxl < len(f'event,buttonPress2,{INFO_ID},button,') + 5:
            raise SystemExit(f'{name}.tSend: txt_maxl {maxl} too small')

    c0, c1 = block(lines, find(lines, COLOR_IF))
    if lp:
        old_color = [x.strip() for x in color_lines('')]
        pos = [i for i in range(c0, c1) if [x.strip() for x in lines[i:i + len(old_color)]] == old_color]
        if pos and lines[pos[0]:pos[0] + len(old_color)] != color_lines(lines[pos[0]][:len(lines[pos[0]]) - len(
                lines[pos[0]].lstrip())]):
            raise SystemExit(f'{name}.tmSerial: color~ field 2 is not the code of indicator_long_press_release.py')
    else:
        old_color = COLOR_OLD
        pos = [i for i in range(c0, c1 - 1) if [x.strip() for x in lines[i:i + 2]] == old_color]
    if len(pos) != 1:
        raise SystemExit(f'{name}.tmSerial: color~ field 2 -> tTime.pco found {len(pos)} times')
    i = pos[0]
    cind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
    if not b <= i and not i + len(old_color) <= a:
        raise SystemExit(f'{name}.tmSerial: color~ inside the statusUpdate branch')

    # changes, from the end of the code to the start so that the indices stay valid
    if lp:
        new_color = lp_color_lines(cind)
    else:
        new_color = [x.replace(f'if({ON}.val==1)', f'if({BLINK}.val==1)') for x in color_lines(cind)]
    edits = sorted([(i, i + len(old_color), new_color), (b - 1, b - 1, blink_lines(ind, lp))], reverse=True)
    for s, e, new in edits:
        lines[s:e] = new
    serial.set_code('timer', lines)
    if lp:
        up[rel[0]:rel[0] + len(old)] = lp_release_lines()
        tc0.set_code('up', up)
        timer.set_code('timer', lp_timer_lines())
    info.set_code('down', info_down(lp))
    template = page.obj(TEMPLATE)
    page.objs += [var_obj(template, v) for v in new_vars]
    blink_timer = timer_obj(page.obj(TIMER_TEMPLATE), BLINK_TIMER)
    blink_timer.set_code('timer', blink_timer_code(lp))
    page.objs.append(blink_timer)
    return fields


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    sections = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            sections[page.objs[0].name] = (section, page)
    changes = {}
    for name in PAGES:
        section, page = sections[name]
        before = ram(page)
        fields = patch_page(page)
        after = ram(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        total = RAM_GLOBAL + after
        print(f'{section:6} {name:13} statusUpdate reads {fields}, blink field {BLINK_FIELD}; RAM (estimate) page '
              f'{before} -> {after}, with global {RAM_GLOBAL + before} -> {total} of {RAM_LIMIT}')
        if total > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {total} > {RAM_LIMIT}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
