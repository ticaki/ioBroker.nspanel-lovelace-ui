"""HMI 6.2.0 (stays 6.2.0): the background of the notification of the screensavers can blink - field 6 of notify~ is a
second background colour, with field 5 the HMI alternates both every 1000 ms. Pages screensaver, screensaver2,
screensaver3 and screensaver5 of all models (screensaver4 has no notification).

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_blink.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_blink.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_blink.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p, after notify_background.py), the output must not exist.

Finding: since notify_background.py field 5 of notify~ sets the background of tNotifyHead/tNotifyText. A message that
needs attention cannot stand out more than that; a background that changes per notify~ is visible at once (tested on
the panel), but the adapter would have to send a message every second.

Fix, per page:
  notify branch of tmSerial  tmNotBg.en=0 first. In the branch 'field 5 not empty': field 6 not empty -> covx into
                vaNotBg2, vaNotBg1 = the background of field 5, and only while the notification is shown (heading or
                text not empty) tmNotBg.en=1. Field 6 empty or missing (old adapter, notification without blinking),
                field 5 empty or an empty notify~ (hide) -> the timer stays off, the background as set by field 5.
  tmNotBg       new timer (1000 ms, en=0, copy of tm0): tNotifyHead.bco vaNotBg1 <-> vaNotBg2, tNotifyText.bco the
                same. Stops itself when heading and text are empty.
  tc0 'up'      the clear of a dismissed notification (vaClear, notify_release_clear.py) also stops tmNotBg.
  pageType      tmNotBg.en=0 at the start of the branch (the page also starts with en=0 after 'page').
  load          nothing: tmNotBg is off, the notification hidden.
Other timers: tmBlink (clock red/white) and tmLP (long press, yellow/green) only write tTime.pco, tmNotBg only the bco of
tNotifyHead/tNotifyText - they do not meet. color~ is dropped while a notification is shown, tTime.bco is only read
when field 5 is empty (no timer then).

New objects per page: vaNotBg1, vaNotBg2 (copies of vaTap), tmNotBg (copy of tm0), appended as the last objects. The
script prints the RAM estimate before and after. pageStartup.tRelease stays 6.2.0.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from indicator_long_press_release import RAM_GLOBAL, RAM_LIMIT, TEMPLATE, ram, var_obj  # noqa: E402
from pagefile import Page  # noqa: E402

PAGES = ('screensaver', 'screensaver2', 'screensaver3', 'screensaver5')
HEAD, TEXT = 'tNotifyHead', 'tNotifyText'
BG1, BG2, TIMER = 'vaNotBg1', 'vaNotBg2', 'tmNotBg'
TIMER_TEMPLATE = 'tm0'
BLINK_TIME = 1000
NOTIFY_IF = 'if(tInstruction.txt=="notify")'
PAGETYPE_IF = 'if(tInstruction.txt=="pageType")'

# the field 5 branch of notify_background.py (NEW_BCO there) - the first lines up to the end of the 'not empty' part
FIELD5 = [
    'spstr strCommand.txt,tTmp.txt,"~",5',
    'if(tTmp.txt!="")',
    '{',
    f'  covx tTmp.txt,{HEAD}.bco,0,0',
    f'  {TEXT}.bco={HEAD}.bco',
    '}else',
]
FIELD6 = [
    '  // field 6: second background - with field 5 both alternate every 1000 ms (tmNotBg), empty: no blinking',
    '  spstr strCommand.txt,tTmp.txt,"~",6',
    '  if(tTmp.txt!="")',
    '  {',
    f'    covx tTmp.txt,{BG2}.val,0,0',
    f'    {BG1}.val={HEAD}.bco',
    f'    if({HEAD}.txt!=""||{TEXT}.txt!="")',
    '    {',
    f'      {TIMER}.en=1',
    '    }',
    '  }',
]
TIMER_CODE = [
    '// background of the notification: field 5 <-> field 6 of notify~ (notify_blink.py)',
    f'if({HEAD}.txt=="")',
    '{',
    f'  if({TEXT}.txt=="")',
    '  {',
    f'    {TIMER}.en=0',
    '  }',
    '}',
    f'if({TIMER}.en==1)',
    '{',
    f'  if({HEAD}.bco=={BG1}.val)',
    '  {',
    f'    {HEAD}.bco={BG2}.val',
    '  }else',
    '  {',
    f'    {HEAD}.bco={BG1}.val',
    '  }',
    f'  {TEXT}.bco={HEAD}.bco',
    '}',
]
STOP = f'{TIMER}.en=0'


def indent_of(line):
    return line[:len(line) - len(line.lstrip())]


def one(lines, pred, what, name):
    hits = [i for i, line in enumerate(lines) if pred(line)]
    if len(hits) != 1:
        raise SystemExit(f'{name}: {what} found {len(hits)} times')
    return hits[0]


def patch_serial(name, serial):
    lines = serial.code('timer')
    if any(TIMER in line for line in lines):
        raise SystemExit(f'{name}: tmSerial already knows {TIMER}')
    start = one(lines, lambda x: x.strip() == NOTIFY_IF, 'notify branch', name)
    if any('"~",6' in line for line in lines[start:start + 40]):
        raise SystemExit(f'{name}: the notify branch already reads field 6')
    hits = [i for i in range(start, min(start + 40, len(lines)))
            if [x.strip() for x in lines[i:i + len(FIELD5)]] == [x.strip() for x in FIELD5]]
    if len(hits) != 1:
        raise SystemExit(f'{name}: field 5 branch of notify_background.py found {len(hits)} times')
    f5 = hits[0]
    ind = indent_of(lines[f5])
    if any(indent_of(lines[f5 + k]) != ind for k in (1, 2, 5)):
        raise SystemExit(f'{name}: field 5 branch is not indented as expected')
    if lines[start + 1].strip() != '{':
        raise SystemExit(f'{name}: notify branch has no block')
    body_ind = indent_of(lines[start + 2])
    # order matters: from the end to the start
    lines[f5 + 5:f5 + 5] = [ind + x for x in FIELD6]  # in front of '}else' = end of the 'not empty' part
    lines[start + 2:start + 2] = [body_ind + STOP]
    pt = one(lines, lambda x: x.strip() == PAGETYPE_IF, 'pageType branch', name)
    if lines[pt + 1].strip() != '{':
        raise SystemExit(f'{name}: pageType branch has no block')
    lines[pt + 2:pt + 2] = [indent_of(lines[pt + 2]) + STOP]
    serial.set_code('timer', lines)


def patch_up(name, tc0):
    up = tc0.code('up')
    if any(TIMER in line for line in up):
        raise SystemExit(f'{name}: tc0 up already knows {TIMER}')
    i = one(up, lambda x: x.strip() == f'vis {TEXT},0', f'vis {TEXT},0 in tc0 up', name)
    if up[i - 2].strip() != f'{TEXT}.txt=""' or up[i - 1].strip() != f'vis {HEAD},0':
        raise SystemExit(f'{name}: tc0 up has not the clear block of notify_release_clear.py')
    up[i + 1:i + 1] = [indent_of(up[i]) + STOP]
    tc0.set_code('up', up)


def timer_obj(template):
    if template.get('type') != 51:
        raise SystemExit(f'{TIMER_TEMPLATE} is not a timer')
    o = template.copy()
    o.set('objname', TIMER)
    o.set('tim', BLINK_TIME)
    o.set('en', 0)
    o.set_code('timer', TIMER_CODE)
    return o


def patch_page(page):
    name = page.objs[0].name
    names = {o.name for o in page.objs}
    for new in (BG1, BG2, TIMER):
        if new in names:
            raise SystemExit(f'{name}: {new} exists')
        if len(new) > 14:
            raise SystemExit(f'{name}: {new} is too long')
    patch_serial(name, page.obj('tmSerial'))
    patch_up(name, page.obj('tc0'))
    template = page.obj(TEMPLATE)
    page.objs += [var_obj(template, BG1), var_obj(template, BG2), timer_obj(page.obj(TIMER_TEMPLATE))]


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
        print(f'{section:6} {name:13} field 6 + {TIMER} ({BLINK_TIME} ms); RAM (estimate) page {before} -> {after}, '
              f'with global {RAM_GLOBAL + before} -> {total} of {RAM_LIMIT}')
        if total > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {total} > {RAM_LIMIT}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
