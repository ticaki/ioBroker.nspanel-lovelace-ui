"""HMI 6.2.0 (stays 6.2.0): the long press of an indicator of screensaver2/screensaver5 (timer tmLP, blinking clock,
buttonPress3 on release) runs only for the indicators the adapter marks in a bit mask.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press_mask.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press_mask.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press_mask.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p, after indicator_long_press_release.py), the output must not exist.

Finding: every indicator armed tmLP on 'down'. After 500 ms the clock blinked red/yellow and the release sent
event,buttonPress3 - also for indicators without any long press action in the adapter. The user waited for a long
press that does nothing, and a slow tap became a long press that the adapter dropped.

Fix, per page:
  weatherUpdate  one more field at the end: the bit mask of the indicators with a long press, decimal, bit (N-1) for
                 indicator N (1 -> 1, 3 -> 4, 7 -> 64). Field index: behind the last indicator slot (6 fields per
                 slot, type~entn~icon~color~name~value) - screensaver5 73 (EU, us-l: 7 indicators, us-p: 8),
                 screensaver2 91 (5 indicators). The tmSerial branch reads it into vaLPMask; an empty or missing
                 field (old adapter, NSPanelTs script) gives 0.
  f<N>Icon 'down'  remembers the id and empties tSend as before, starts tmLP only when sys0=vaLPMask.val&<bit> is not
                 0 (if() takes no expressions, hence sys0). Without the bit no timer runs: the release in tc0 'up'
                 sends event,buttonPress2 as before (vaLPOn stays 0).
                 A touch of a dark display (dim 0, standby brightness 0) only wakes it: no timer, no blinking. The
                 release still sends buttonPress2,<id>,button,1 - the adapter drops it
                 (Screensaver.onIndicatorWakeTap: opt 1 and standby brightness 0), so older TFTs are protected too.
  tc0 'down'     runs before f<N>Icon 'down' and raises dim: in front of dim=dimValueNormal it notes in vaWake
                 whether the display was dark (dim==0) - exact, no guess from vaTap and dimValue.
  tmLP 'timer'   the clock blinks yellow <-> green instead of red <-> yellow (red reads like 'something is wrong'):
                 first phase yellow (65504), then green (2016 = 0x07E0), 200 ms per phase as before. The code must be
                 exactly the one of indicator_long_press_release.py.
The weatherUpdate branch is skipped while a notification is shown (as for the indicators themselves): the mask then
keeps its last value. Old TFTs do not read the new field, the adapter sends it only to 6.2.0 and newer.

New objects per page: vaLPMask and vaWake, copies of vaTap (local number variables, value 0, no code), appended as
the last objects. RAM: two number variables, the script prints the estimate before and after (see indicator_long_press_release).
pageStartup.tRelease stays 6.2.0.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from indicator_long_press import LP_ID, LP_TIME, LP_TIMER  # noqa: E402
from indicator_long_press_release import (  # noqa: E402
    BLINK_TIME,
    COL,
    ON,
    RAM_GLOBAL,
    RAM_LIMIT,
    TEMPLATE,
    new_timer_lines,
    ram,
    var_obj,
)
from pagefile import Page, block  # noqa: E402
from screensaver5 import CLEAR_SEND  # noqa: E402

# page -> field index of the mask in weatherUpdate (behind the last indicator slot)
MASK_FIELD = {'screensaver5': 73, 'screensaver2': 91}
PAGES = tuple(MASK_FIELD)
MASK = 'vaLPMask'
SLOT = 6
ICON = re.compile(r'f(\d+)Icon')
WEATHER_IF = re.compile(r'if\(tInstruction\.txt=="weatherUpdate"(&&.*)?\)')
SPSTR = re.compile(r'spstr strCommand\.txt,(\w+)\.txt,"~",(\d+)')
# tc0 'down' notes whether the touch hit a dark display, before it raises dim
WAKE = 'vaWake'
TC0_DOWN_TAIL = ['dim=dimValueNormal', 'vaTap.val+=1']
# blinking clock while the long press is armed: yellow first, then green
YELLOW, GREEN = 65504, 2016


def old_down(n):
    """code 'down' of f<n>Icon after indicator_long_press.py"""
    return [f'{LP_ID}.txt=entn{n}.txt', CLEAR_SEND, f'{LP_TIMER}.en=1']


def new_down(n):
    """the timer only runs when the adapter has set the bit of the indicator"""
    return [
        f'{LP_ID}.txt=entn{n}.txt',
        CLEAR_SEND,
        f'// long press only when the adapter set bit {n - 1} in the mask (if() takes no expressions)',
        f'sys0={MASK}.val&{1 << (n - 1)}',
        f'if({WAKE}.val==1)',
        '{',
        '  // the touch woke a dark display (tc0 down): no long press',
        '  sys0=0',
        '}',
        'if(sys0!=0)',
        '{',
        f'  {LP_TIMER}.en=1',
        '}',
    ]


def blink_timer_lines():
    """code of tmLP: like indicator_long_press_release.new_timer_lines, the clock blinks yellow <-> green"""
    return [
        f'if({ON}.val==0)',
        '{',
        f'  // {LP_TIME} ms are over: the release sends the long press, the clock blinks yellow/green until then',
        f'  {ON}.val=1',
        f'  {COL}.val=tTime.pco',
        f'  tTime.pco={YELLOW}',
        f'  {LP_TIMER}.tim={BLINK_TIME}',
        f'}}else if(tTime.pco=={YELLOW})',
        '{',
        f'  tTime.pco={GREEN}',
        '}else',
        '{',
        f'  tTime.pco={YELLOW}',
        '}',
    ]


def mask_lines(ind, field):
    """end of the weatherUpdate branch: the mask, empty or missing -> 0"""
    return [
        ind + f'// bit mask of the indicators with a long press (bit N-1 = indicator N), empty -> 0',
        ind + f'spstr strCommand.txt,tTmp.txt,"~",{field}',
        ind + 'if(tTmp.txt=="")',
        ind + '{',
        ind + f'  {MASK}.val=0',
        ind + '}else',
        ind + '{',
        ind + f'  covx tTmp.txt,{MASK}.val,0,0',
        ind + '}',
    ]


def patch_page(page):
    name = page.objs[0].name
    names = {o.name for o in page.objs}
    if MASK in names or WAKE in names:
        raise SystemExit(f'{name}: {MASK}/{WAKE} exist')
    if any(MASK in line or WAKE in line for o in page.objs for kind, _, lines in o.items if kind == 'code' for line in lines):
        raise SystemExit(f'{name}: code already uses {MASK}')
    field = MASK_FIELD[name]

    icons = sorted((int(m.group(1)), o) for o in page.objs for m in [ICON.fullmatch(o.name)] if m)
    numbers = [n for n, _ in icons]
    if not numbers or numbers != list(range(1, len(numbers) + 1)):
        raise SystemExit(f'{name}: indicators {numbers} are not 1..N')
    if len(numbers) > 16:
        raise SystemExit(f'{name}: {len(numbers)} indicators, the mask is limited to 16 bits here')
    for n, o in icons:
        if o.code('down') != old_down(n):
            raise SystemExit(f'{name}.{o.name}: down is not the code of indicator_long_press.py')
        if any(item[0] == 'code' and item[1] == 'up' and item[2] for item in o.items):
            raise SystemExit(f'{name}.{o.name}: has code up')

    tc0 = page.obj('tc0')
    down = tc0.code('down')
    hits = [i for i in range(len(down) - 1) if [x.strip() for x in down[i:i + 2]] == TC0_DOWN_TAIL]
    if len(hits) != 1 or down[hits[0]] != TC0_DOWN_TAIL[0]:
        raise SystemExit(f'{name}.tc0: down has not dim=dimValueNormal and vaTap.val+=1 once at the top level')
    if sum('dim=' in x for x in down) != 1:
        raise SystemExit(f'{name}.tc0: down writes dim more than once')
    timer = page.obj(LP_TIMER)
    if timer.code('timer') != new_timer_lines() or timer.get('tim') != LP_TIME or timer.get('en') != 0:
        raise SystemExit(f'{name}.{LP_TIMER}: not the code of indicator_long_press_release.py')

    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    starts = [i for i, line in enumerate(lines) if WEATHER_IF.fullmatch(line.strip())]
    if len(starts) != 1:
        raise SystemExit(f'{name}.tmSerial: weatherUpdate branch found {len(starts)} times')
    a, b = block(lines, starts[0])
    if lines[a + 1].strip() != '{' or lines[b - 1].strip() != '}':
        raise SystemExit(f'{name}.tmSerial: weatherUpdate branch has no {{ }} body')
    fields = [(m.group(1), int(m.group(2))) for line in lines[a:b] for m in [SPSTR.search(line)] if m]
    entn = [(int(t[4:]), f) for t, f in fields if t.startswith('entn')]
    if [n for n, _ in entn] != numbers:
        raise SystemExit(f'{name}.tmSerial: entn read for {[n for n, _ in entn]}, indicators {numbers}')
    # the slots follow each other, entn is field 2 of a slot: the mask follows the last slot
    if any(entn[k + 1][1] - entn[k][1] != SLOT for k in range(len(entn) - 1)):
        raise SystemExit(f'{name}.tmSerial: indicator slots are not {SLOT} fields apart: {entn}')
    if entn[-1][1] + SLOT - 1 != field:
        raise SystemExit(f'{name}.tmSerial: last slot ends at {entn[-1][1] + SLOT - 2}, mask field {field} expected')
    if max(f for _, f in fields) >= field:
        raise SystemExit(f'{name}.tmSerial: weatherUpdate already reads field {max(f for _, f in fields)}')
    ind = lines[b - 1][:len(lines[b - 1]) - len(lines[b - 1].lstrip())] + '  '

    lines[b - 1:b - 1] = mask_lines(ind, field)
    serial.set_code('timer', lines)
    for n, o in icons:
        o.set_code('down', new_down(n))
    timer.set_code('timer', blink_timer_lines())
    down[hits[0]:hits[0]] = [
        '// the touch wakes a dark display (standby brightness 0): no long press of an indicator (f<N>Icon down)',
        f'{WAKE}.val=0',
        'if(dim==0)',
        '{',
        f'  {WAKE}.val=1',
        '}',
    ]
    tc0.set_code('down', down)
    page.objs.append(var_obj(page.obj(TEMPLATE), MASK))
    page.objs.append(var_obj(page.obj(TEMPLATE), WAKE))
    return field, numbers


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
        field, numbers = patch_page(page)
        after = ram(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        total = RAM_GLOBAL + after
        print(f'{section:6} {name:13} indicators 1..{numbers[-1]}, mask field {field}; RAM (estimate) page {before} -> '
              f'{after}, with global {RAM_GLOBAL + before} -> {total} of {RAM_LIMIT}')
        if total > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {total} > {RAM_LIMIT}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
