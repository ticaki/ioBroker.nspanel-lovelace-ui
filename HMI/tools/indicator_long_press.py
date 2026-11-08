"""HMI 6.0.8: the indicators of screensaver5 and screensaver2 count their taps and know a long press.

Usage: PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press.py <in.HMI> <out.HMI>

Input: a 6.0.8 project (after indicator_single_press.py, for us-l/us-p also advanced_indicators_us.py, optionally
screensaver5_iconfont.py); the generators screensaver5*.py write the 6.0.7 state, this script comes after them.

Before: f<N>Icon 'down' sent event,buttonPress2,<id>,button at once. tc0 'down' runs before it on every touch,
counts vaTap and writes the bExit text into tSend; tc0 'up' sends a tSend with text (a swipe writes its text there).
Now, per indicator tile:
  f<N>Icon 'down'  remembers the id in tLPId, empties tSend (no bExit), starts tmLP - sends nothing
  tmLP 'timer'     (500 ms like the long press of the menu pages) stops itself, sends at once
                   event,buttonPress3,<id>,button,<vaTap> and forgets the id: the release sends nothing more
  tc0 'up'         gets every release, also outside of the tile: with a remembered id it stops tmLP; a swipe (tSend
                   has its text) drops the tap and is sent as before, otherwise it sends
                   event,buttonPress2,<id>,button,<vaTap>; then the id is forgotten. Without an id: unchanged.
vaTap is the counter of tc0 'down', so tile taps and background taps count together (double click).
The tap count is converted into tTmp right before it is used, in the same event (the HMI runs one event at a time,
what tc0 'down' left in tTmp is not used). New objects per page: tLPId (id, 7) and tmLP (timer, en=0). The page RAM
is tight (global + page <= 3584 bytes): screensaver5.shrink_buffers sets the buffers (BUFFER_MAXL) to what they hold,
the script prints the sum of txt_maxl before and after.
The f<N>Icon have no code 'up', so nothing is sent twice. Only these two pages change, the version stays.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from screensaver5 import CLEAR_SEND, ID_MAXL, IF_TEXT, SEND, indicator_down, shrink_buffers, txt_sum, var_obj  # noqa: E402

PAGES = ('screensaver5', 'screensaver2')
ICON = re.compile(r'f(\d+)Icon')
LP_ID, LP_TIMER = 'tLPId', 'tmLP'
LP_TIME = 500


def tile_down(n):
    """code 'down' of the indicator f<n>Icon"""
    return [f'{LP_ID}.txt=entn{n}.txt', CLEAR_SEND, f'{LP_TIMER}.en=1']


def press_text(event):
    """tSend with the remembered id and the tap counter of tc0 (converted here, tTmp only within this event)"""
    return ['covx vaTap.val,tTmp.txt,0,0',
            f'tSend.txt="event,{event},"+{LP_ID}.txt+",button,"+tTmp.txt']


def timer_lines():
    """code of tmLP: the long press is sent while the finger is still down, then the id is forgotten"""
    return [f'{LP_TIMER}.en=0'] + press_text('buttonPress3') + SEND + [CLEAR_SEND, f'{LP_ID}.txt=""']


def release_lines():
    """block of tc0 'up' in front of if(tSend.txt!=""): the short tap of a tile"""
    return [
        f'if({LP_ID}.txt!="")',
        '{',
        f'  {LP_TIMER}.en=0',
        '  // a swipe has written its text into tSend: no tap',
        '  if(tSend.txt=="")',
        '  {',
        *['    ' + line for line in press_text('buttonPress2')],
        '  }',
        f'  {LP_ID}.txt=""',
        '}',
    ]


def patch_page(page):
    """returns the number of indicators changed; 0 if the page has none"""
    names = {o.name for o in page.objs}
    if LP_TIMER in names:
        raise SystemExit(f'{page.objs[0].name}: already has {LP_TIMER}')
    icons = []
    for o in page.objs:
        match = ICON.fullmatch(o.name)
        if not match:
            continue
        lines = o.code('down')
        if not lines:
            continue
        n = int(match.group(1))
        if lines != indicator_down(n):
            raise SystemExit(f'{page.objs[0].name}.{o.name}: unexpected code down (not 6.0.8?)')
        if any(item[0] == 'code' and item[1] == 'up' and item[2] for item in o.items):
            raise SystemExit(f'{page.objs[0].name}.{o.name}: has code up')
        if f'entn{n}' not in names:
            raise SystemExit(f'{page.objs[0].name}: entn{n} missing')
        icons.append((o, n))
    if not icons:
        return 0
    tc0 = page.obj('tc0')
    up = tc0.code('up')
    hits = [i for i, line in enumerate(up) if line == IF_TEXT]
    if len(hits) != 1 or up[hits[0] + 2:hits[0] + 2 + len(SEND)] != ['  ' + line for line in SEND]:
        raise SystemExit(f'{page.objs[0].name}.tc0: up does not end with if(tSend.txt!="") and the send block')
    if 'vaTap.val+=1' not in tc0.code('down'):
        raise SystemExit(f'{page.objs[0].name}.tc0: down does not count vaTap')
    for o, n in icons:
        o.set_code('down', tile_down(n))
    up[hits[0]:hits[0]] = release_lines()
    tc0.set_code('up', up)

    # Page.bytes numbers the objects by their position: the new ones follow the highest id
    text_var = page.obj('tId')
    timer = page.obj('tm0').copy()
    timer.set('objname', LP_TIMER)
    timer.set('tim', LP_TIME)
    timer.set('en', 0)
    timer.set_code('timer', timer_lines())
    page.objs += [var_obj(text_var, LP_ID, ID_MAXL), timer]
    return len(icons)


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    sections = {}
    for name, data in hmi.files.items():
        if name.endswith('.pa'):
            page = Page(data)
            sections[page.objs[0].name] = (name, page)
    changes = {}
    for name in PAGES:
        section, page = sections[name]
        before = txt_sum(page)
        count = patch_page(page)
        shrunk = shrink_buffers(page)
        print(f'{name} ({section}): {count} indicators, txt_maxl sum {before} -> {txt_sum(page)}, shrunk {shrunk}')
        if not count:
            raise SystemExit(f'{name} has no indicators with code')
        changes[section] = page.bytes()
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(out)} bytes')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
