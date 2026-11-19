"""HMI 6.2.0 (stays 6.2.0): two old errors around the navigation arrows of cardThermo2 and EU cardEntities.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/nav_repeat_loadend_fix.py HMI/nspanel-v6.2.0.HMI <out.HMI> [<in.tft>]
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/nav_repeat_loadend_fix.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/nav_repeat_loadend_fix.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p) with the long press blinking of the arrows (nav_long_press_blink.py), the
output must not exist. <in.tft>: optional, the TFT compiled from the input - its page table gives the measured RAM.

Finding 1 - cardThermo2 (all models): the button repeater of the page (tc0 'down' -> repeat_tm, which runs
'click b[button_i.val],1' every 500 ms, faster after 4 ticks) takes every touched object of type 98 - also the
navigation arrows bPrev/bNext. While an arrow is held, the repeater runs its 'down' again and again: 'down' sets
vLPNavState=0 and restarts tmLPNav (500 ms) - the long press (home/parent, event,buttonPress3) is never or only by
chance reached, and the blinking of heading and arrows (vaNavCol, nav_long_press_blink.py) is reset by the restore
block in front of 'down'. The repeater is meant for the temperature buttons b0/b1 and the entity buttons.
Fix 1: tc0 'down' starts the repeater only for type 98 objects that are not bPrev/bNext:
  if(b[tc0.val].type==98&&tc0.val!=bPrev.id&&tc0.val!=bNext.id)
(Nextion evaluates && strictly from left to right, all three terms are plain comparisons.) The rest of the repeater
(repeat_tm, the stop in tc0 'up', acceleration) stays as it is - the stop only acts on tc0.val==button_i.val, an arrow
never gets into button_i any more.

Finding 2 - EU cardEntities and EU cardThermo2: the page event 'loadend' (postinitialize) holds a copy of the 'up'
code of an arrow (cardEntities: bNext with nent2, cardThermo2: bPrev with nent1) - 'tmLPNav.en=0', the short/long
decision and the send. On every load of the page the panel sends 'event,buttonPress2,,button' (nent1/nent2 are
still empty then: design value '', entityUpd fills them later). Since 5.x (4.9.5 has no loadend there).
Comparison: us-l and us-p have no 'loadend' code on these pages (there only popupColor, pageStartup and popupLight2
have one) and their arrows work the same way; EU has it on no other card page (besides these two only popupColor,
pageStartup, popupLight2 and the screensaver pages).
Nothing else is in that 'loadend': tmLPNav has en=0 in the design and is only started by 'down' of an arrow, the
variables start at 0 - 'tmLPNav.en=0' there has no effect either.
Fix 2: the 'loadend' code of these two pages is removed (empty event). Other models: checked that there is none.

Checks before the change (SystemExit): the pages exist once, tc0 is a TouchCap, repeat_tm a timer, bPrev/bNext
buttons; tc0 'down' has the known repeater condition exactly once; repeat_tm runs the known click; 'loadend' is
exactly the known copy of an arrow 'up' (or empty in us-l/us-p); after the change no code on these pages contains
the removed send in 'loadend'. Code lives in flash: RAM does not change - the script prints the estimate (and the
measured value with <in.tft>) before and after per changed page. pageStartup.tRelease stays 6.2.0.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from nav_long_press_blink import NEXT, PREV, check_up  # noqa: E402
from shrink_id_buffers import RAM_GLOBAL, RAM_LIMIT, ram, tft_ram  # noqa: E402

THERMO2, ENTITIES = 'cardThermo2', 'cardEntities'
BUTTON_TYPE, TIMER_TYPE, TOUCHCAP_TYPE = 98, 51, 5
OLD_COND = 'if(b[tc0.val].type==98)'
NEW_COND = f'if(b[tc0.val].type==98&&tc0.val!={PREV}.id&&tc0.val!={NEXT}.id)'
COMMENT = ('// the arrows bPrev/bNext are not repeated: a repeated \'down\' would restart their long press '
           '(nav_repeat_loadend_fix.py)')
REPEAT_TIMER = ['click b[button_i.val],1 //repeat', 'tick_c.val++ // increment ticks counter',
                'if(tick_c.val==4)', '{', 'repeat_tm.tim/=4 // handle acceleration', '}']
SEND = re.compile(r'event,buttonPress[23]')


def need(page, name, kind):
    names = [o.name for o in page.objs]
    if names.count(name) != 1 or page.obj(name).get('type') != kind:
        raise SystemExit(f'{page.objs[0].name}: no single {name} of type {kind}')
    return page.obj(name)


def fix_repeater(page):
    for obj, kind in ((PREV, BUTTON_TYPE), (NEXT, BUTTON_TYPE), ('repeat_tm', TIMER_TYPE)):
        need(page, obj, kind)
    tc0 = need(page, 'tc0', TOUCHCAP_TYPE)
    if [x.strip() for x in page.obj('repeat_tm').code('timer')] != REPEAT_TIMER:
        raise SystemExit(f'{THERMO2}.repeat_tm: not the known repeater')
    lines = tc0.code('down')
    hits = [i for i, x in enumerate(lines) if x.strip() == OLD_COND]
    if len(hits) != 1:
        raise SystemExit(f'{THERMO2}.tc0: {OLD_COND} found {len(hits)} times in down')
    i = hits[0]
    if 'repeat_tm.en=1' not in ''.join(lines[i:]).replace(' ', ''):
        raise SystemExit(f'{THERMO2}.tc0: down does not start repeat_tm behind {OLD_COND}')
    ind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
    lines[i:i + 1] = [ind + COMMENT, ind + NEW_COND]
    tc0.set_code('down', lines)
    return 'tc0 down: repeater without bPrev/bNext'


def fix_loadend(page):
    name = page.objs[0].name
    loadend = page.objs[0].code('loadend')
    if not loadend:
        return None
    try:
        check_up(name, NEXT, loadend)
        arrow = NEXT
    except SystemExit:
        check_up(name, PREV, loadend)
        arrow = PREV
    page.objs[0].set_code('loadend', [])
    return f'loadend: copy of {arrow} up removed ({len(loadend)} lines)'


def main(source, target, tft=None):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    order = [m.group(1).decode() + '.pa' for m in re.finditer(rb'(\d+)\.pa\x00', hmi.files['main.HMI'])]
    measured = tft_ram(tft, order) if tft else {}
    pages = {}
    for sec in order:
        page = Page(hmi.files[sec])
        if page.objs[0].name in (THERMO2, ENTITIES):
            if page.objs[0].name in pages.values():
                raise SystemExit(f'{page.objs[0].name} exists twice')
            pages[sec] = page.objs[0].name
    if sorted(pages.values()) != sorted((THERMO2, ENTITIES)):
        raise SystemExit(f'pages {THERMO2}/{ENTITIES} not found')

    changes = {}
    for sec, name in pages.items():
        page = Page(hmi.files[sec])
        before = ram(page)
        notes = []
        if name == THERMO2:
            notes.append(fix_repeater(page))
        note = fix_loadend(page)
        notes.append(note or 'loadend: none (nothing to do)')
        for o in page.objs:
            for kind, event, lines in o.items:
                if kind == 'code' and o.name == name and event == 'loadend' and any(SEND.search(x) for x in lines):
                    raise SystemExit(f'{name}: loadend still sends')
        after = ram(page)
        if after != before:
            raise SystemExit(f'{name}: RAM estimate changed {before} -> {after}')
        line = (f'{sec:6} {name:13} {"; ".join(notes)}; RAM (estimate) with global {RAM_GLOBAL + before} -> '
                f'{RAM_GLOBAL + after} of {RAM_LIMIT}')
        if sec in measured:
            line += f'; TFT {RAM_GLOBAL + measured[sec]} -> {RAM_GLOBAL + measured[sec]}'
        print(line)
        if name == THERMO2 or note:
            out = page.bytes()
            Page(out)  # round trip of the result
            changes[sec] = out
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4):
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
