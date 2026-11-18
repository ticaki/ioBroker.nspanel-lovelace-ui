"""HMI 6.2.0 (stays 6.2.0): the long press of an indicator of screensaver2/screensaver5 is sent on release, the clock
blinks red/yellow while it is armed.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press_release.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press_release.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/indicator_long_press_release.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p, after indicator_long_press.py and notify_release_clear.py), the output must
not exist.

Finding: the timer tmLP (indicator_long_press.py) sent event,buttonPress3,<id>,button,<vaTap> after 500 ms while the
finger was still down. The adapter opened a page or a popup at once, and the release then landed as 'up' on an
element of the new page (e.g. the slider of a popup).

Fix, per page:
  tmLP 'timer'  sends nothing. First run (after 500 ms): vaLPOn=1, the colour of the clock goes to vaLPCol,
                tTime.pco red (63488), tmLP.tim=200. Every further run toggles tTime.pco red <-> yellow (65504):
                the clock blinks 200 ms per phase - 'you can let go now'.
  tc0 'up'      with a remembered id: stops tmLP; a swipe (tSend has its text) drops the tap as before - now also the
                long one; otherwise event,buttonPress3,<id>,button,<vaTap> when vaLPOn==1, else
                event,buttonPress2,<id>,button,<vaTap> as before. Then (also after a swipe) vaLPOn=0, the clock gets
                vaLPCol back, tmLP.tim=500, the id is forgotten.
  tmSerial      the color~ branch writes field 2 into vaLPCol instead of tTime.pco while vaLPOn==1: the clock keeps
                blinking and gets the new colour on release.
The other writer of tTime.pco is the page 'load' (colours of pageType~, field 3): it runs only when the page is loaded,
the local variables start at 0 and tmLP is off then, so it needs no change. Nothing on these pages hides tTime
(no 'vis tTime'); its text is empty until the first time~ - then only the blinking is not visible.

New objects per page: vaLPCol and vaLPOn, copies of vaTap (local number variables, value 0, no code), appended as the
last objects (the code of these pages does not address objects by id). RAM: two number variables, the script prints
an estimate of the page RAM before and after (global + page <= 3584 bytes, see reference values in RAM_BASE).
pageStartup.tRelease stays 6.2.0.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from indicator_long_press import LP_ID, LP_TIME, LP_TIMER, press_text, release_lines, timer_lines  # noqa: E402
from pagefile import Page, block, find  # noqa: E402
from screensaver5 import SEND, text_cost  # noqa: E402

PAGES = ('screensaver5', 'screensaver2')
COL, ON = 'vaLPCol', 'vaLPOn'
TEMPLATE = 'vaTap'
VAR_TYPE = 52
# red first, then yellow: on no background colour are both invisible at the same time
RED, YELLOW = 63488, 65504
BLINK_TIME = 200

COLOR_IF = 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'
COLOR_OLD = ['spstr strCommand.txt,tTmp.txt,"~",2', 'covx tTmp.txt,tTime.pco,0,0']
# a statement that writes tTime.pco: an assignment or the target of covx (also copies like 'x=tTime.pco' are no write)
PCO_ASSIGN = re.compile(r'\s*tTime\.pco\s*=(?!=)')
PCO_COVX = re.compile(r'\s*covx\s+[^,]+,\s*tTime\.pco\s*,')

# RAM estimate of a page (reference-hmi-ram-model, fitted on compiled TFTs, about +-6 bytes): base cost per object
# type plus ceil((txt_maxl + 1) / 4) * 4 per text buffer (text, string variable); global as the TFT reports it
RAM_BASE = {121: 9, 112: 6, 5: 4, 51: 4, 52: 5, 116: 9}
RAM_GLOBAL = 436
RAM_LIMIT = 3584


def ram(page):
    """estimated RAM of the page without the global part"""
    total = 0
    for o in page.objs:
        kind = o.get('type')
        if kind not in RAM_BASE:
            raise SystemExit(f'{page.objs[0].name}.{o.name}: no RAM base for type {kind}')
        total += RAM_BASE[kind]
        if o.has('txt_maxl') and (kind != VAR_TYPE or o.get('sta') == 1):
            total += text_cost(o.get('txt_maxl'))
    return total


def new_timer_lines():
    """code of tmLP: arms the long press and lets the clock blink, sends nothing"""
    return [
        f'if({ON}.val==0)',
        '{',
        f'  // {LP_TIME} ms are over: the release sends the long press, the clock blinks until then',
        f'  {ON}.val=1',
        f'  {COL}.val=tTime.pco',
        f'  tTime.pco={RED}',
        f'  {LP_TIMER}.tim={BLINK_TIME}',
        f'}}else if(tTime.pco=={RED})',
        '{',
        f'  tTime.pco={YELLOW}',
        '}else',
        '{',
        f'  tTime.pco={RED}',
        '}',
    ]


def new_release_lines():
    """block of tc0 'up' in front of if(tSend.txt!=""): the tap or the long press of a tile"""
    covx, long_text = press_text('buttonPress3')
    short_covx, short_text = press_text('buttonPress2')
    if covx != short_covx:
        raise SystemExit('press_text: the tap count differs between the events')
    return [
        f'if({LP_ID}.txt!="")',
        '{',
        f'  {LP_TIMER}.en=0',
        '  // a swipe has written its text into tSend: no tap, also no long press',
        '  if(tSend.txt=="")',
        '  {',
        f'    {covx}',
        f'    if({ON}.val==1)',
        '    {',
        f'      {long_text}',
        '    }else',
        '    {',
        f'      {short_text}',
        '    }',
        '  }',
        f'  if({ON}.val==1)',
        '  {',
        f'    {ON}.val=0',
        f'    tTime.pco={COL}.val',
        '  }',
        f'  {LP_TIMER}.tim={LP_TIME}',
        f'  {LP_ID}.txt=""',
        '}',
    ]


def color_lines(ind):
    """field 2 of color~: into vaLPCol while the clock blinks"""
    return [
        ind + COLOR_OLD[0],
        ind + f'if({ON}.val==1)',
        ind + '{',
        ind + f'  covx tTmp.txt,{COL}.val,0,0',
        ind + '}else',
        ind + '{',
        ind + '  ' + COLOR_OLD[1],
        ind + '}',
    ]


def var_obj(template, name):
    """a copy of vaTap: number variable, local, value 0, no code"""
    if template.get('type') != VAR_TYPE or template.get('sta') != 0 or template.get('vscope') != 0:
        raise SystemExit(f'{TEMPLATE} is not a local number variable')
    if any(kind == 'code' for kind, _, _ in template.items):
        raise SystemExit(f'{TEMPLATE} has code')
    o = template.copy()
    o.set('objname', name)
    o.set('val', 0)
    return o


def pco_writers(page):
    """[(object, event, line)] of every line that writes tTime.pco"""
    out = []
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind != 'code':
                continue
            for line in lines:
                if PCO_ASSIGN.match(line) or PCO_COVX.match(line):
                    out.append((o.name, event, line.strip()))
    return out


def patch_page(page):
    name = page.objs[0].name
    names = {o.name for o in page.objs}
    if COL in names or ON in names:
        raise SystemExit(f'{name}: {COL}/{ON} exist')
    writers = pco_writers(page)
    expected = [(name, 'load', COLOR_OLD[1]), ('tmSerial', 'timer', COLOR_OLD[1])]
    if sorted(writers) != sorted(expected):
        raise SystemExit(f'{name}: unexpected writers of tTime.pco: {writers}')

    timer = page.obj(LP_TIMER)
    if timer.code('timer') != timer_lines() or timer.get('tim') != LP_TIME or timer.get('en') != 0:
        raise SystemExit(f'{name}.{LP_TIMER}: not the code of indicator_long_press.py')
    tc0 = page.obj('tc0')
    up = tc0.code('up')
    old = release_lines()
    hits = [i for i in range(len(up)) if up[i:i + len(old)] == old]
    if len(hits) != 1 or up[hits[0] + len(old):hits[0] + len(old) + 2] != ['if(tSend.txt!="")', '{']:
        raise SystemExit(f'{name}.tc0: up has not the release block of indicator_long_press.py')
    if up[hits[0] + len(old) + 2:hits[0] + len(old) + 2 + len(SEND)] != ['  ' + line for line in SEND]:
        raise SystemExit(f'{name}.tc0: up has no send block behind the release block')

    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    a, b = block(lines, find(lines, COLOR_IF))
    pos = [i for i in range(a, b - 1) if [x.strip() for x in lines[i:i + 2]] == COLOR_OLD]
    if len(pos) != 1:
        raise SystemExit(f'{name}.tmSerial: color~ field 2 -> tTime.pco found {len(pos)} times')
    i = pos[0]
    ind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]

    lines[i:i + 2] = color_lines(ind)
    serial.set_code('timer', lines)
    timer.set_code('timer', new_timer_lines())
    up[hits[0]:hits[0] + len(old)] = new_release_lines()
    tc0.set_code('up', up)
    template = page.obj(TEMPLATE)
    page.objs += [var_obj(template, COL), var_obj(template, ON)]


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
        patch_page(page)
        after = ram(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        total = RAM_GLOBAL + after
        print(f'{section:6} {name:13} RAM (estimate) page {before} -> {after}, with global {RAM_GLOBAL + before} -> '
              f'{total} of {RAM_LIMIT}')
        if total > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {total} > {RAM_LIMIT}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
