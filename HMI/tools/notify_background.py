"""HMI 6.2.0 (stays 6.2.0): background colour of the notification of the screensavers (field 5 of notify~) and the
text field of the notification down to the lower edge of the screen. Pages screensaver, screensaver2, screensaver3 and
screensaver5 of all models (screensaver4 has no notification).

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_background.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_background.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_background.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p, after info_icon_geometry.py), the output must not exist.

Finding 1: the notify branch of tmSerial sets tNotifyHead.bco and tNotifyText.bco to tTime.bco (the background of the
screensaver) - the notification (headline + text) cannot be set off from the screensaver behind it. Fields 3/4 (pco
of the headline/text) are read since 4.5.1, field 5 does not exist.
Finding 2: on screensaver of EU and us-l tNotifyText ends at y 311 (264 + 47) - below it 9 px of the screensaver stay
visible, with a background colour this is a strip under the notification. screensaver2: tNotifyText ends at 279 (EU,
us-l) / 438 (us-p), the bar tIcon1/tIcon2 below starts at 280 / 440 - a strip of 1 / 2 px.

Fix 1: field 5 of notify~ (a RGB565 number like fields 3/4): not empty -> covx into tNotifyHead.bco and the same value
into tNotifyText.bco; empty -> tTime.bco as before. Old adapters/scripts send no field 5 and get the old look. No new
object, no RAM (written straight into the bco).
Fix 2: tNotifyText.h so that the field ends at the lower edge of the screen or at the first element below it that
stays visible (tIcon*, tRelay* - they are not covered):
  EU/us-l screensaver:  264 + 47 -> 264 + 56 (= 320, lower edge)
  EU/us-l screensaver2: 229 + 50 -> 229 + 51 (= 280, top of tIcon1/tIcon2)
  us-p screensaver2:    308 + 130 -> 308 + 132 (= 440, top of tIcon1/tIcon2)
Unchanged (the text already ends at the lower edge or at the element below): screensaver3 EU/us-l (315, the relay
bars tRelay1/tRelay2 at 315..320), screensaver5 EU/us-l (320), us-p screensaver3/screensaver5 (475, tRelay at 475). us-p screensaver: the notification lies in the middle of the page (330..388), below are the forecasts - unchanged.
Between tNotifyHead and tNotifyText there is no gap on any page (checked).

pageStartup.tRelease stays 6.2.0.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from indicator_long_press_release import ram  # noqa: E402
from pagefile import Page  # noqa: E402

PAGES = ('screensaver', 'screensaver2', 'screensaver3', 'screensaver5')
HEAD = 'tNotifyHead'
TEXT = 'tNotifyText'
# elements below the notification that stay visible while it is shown - never covered
KEEP = ('tIcon', 'tRelay')

MIDDLE = 'middle'  # the notification lies in the middle of the page, the text field stays

# expected start (x, y, w, h) of tNotifyHead and tNotifyText per model and page, and the new height of tNotifyText
EXPECTED = {
    'eu': {
        'screensaver': ((0, 207, 450, 58), (0, 264, 450, 47), 56),
        'screensaver2': ((1, 181, 448, 48), (1, 229, 448, 50), 51),
        'screensaver3': ((0, 174, 450, 58), (0, 232, 450, 83), None),
        'screensaver5': ((0, 214, 450, 50), (0, 264, 450, 56), None),
    },
    'us-l': {
        'screensaver': ((15, 207, 450, 58), (15, 264, 450, 47), 56),
        'screensaver2': ((16, 181, 448, 48), (16, 229, 448, 50), 51),
        'screensaver3': ((15, 174, 450, 58), (15, 232, 450, 83), None),
        'screensaver5': ((15, 214, 450, 50), (15, 264, 450, 56), None),
    },
    'us-p': {
        'screensaver': ((0, 272, 320, 58), (0, 330, 320, 58), MIDDLE),
        'screensaver2': ((0, 260, 320, 48), (0, 308, 320, 130), 132),
        'screensaver3': ((0, 177, 320, 58), (0, 235, 320, 240), None),
        'screensaver5': ((0, 366, 320, 50), (0, 416, 320, 59), None),
    },
}

OLD_BCO = [
    f'{HEAD}.bco=tTime.bco',
    f'{TEXT}.bco=tTime.bco',
]
NEW_BCO = [
    '// field 5: background of the notification (RGB565), empty: background of the screensaver',
    'spstr strCommand.txt,tTmp.txt,"~",5',
    'if(tTmp.txt!="")',
    '{',
    f'  covx tTmp.txt,{HEAD}.bco,0,0',
    f'  {TEXT}.bco={HEAD}.bco',
    '}else',
    '{',
    f'  {HEAD}.bco=tTime.bco',
    f'  {TEXT}.bco=tTime.bco',
    '}',
]
FIELD3 = 'spstr strCommand.txt,tTmp.txt,"~",3'


def box(obj):
    return tuple(obj.get(k) for k in ('x', 'y', 'w', 'h'))


def overlaps(a, b):
    return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]


def patch_code(name, page):
    timer = page.obj('tmSerial')
    lines = timer.code('timer')
    starts = [i for i, line in enumerate(lines) if line.strip() == 'if(tInstruction.txt=="notify")']
    if len(starts) != 1:
        raise SystemExit(f'{name}: notify branch found {len(starts)} times')
    start = starts[0]
    if lines[start + 1].strip() != '{':
        raise SystemExit(f'{name}: notify branch has no block')
    body = lines[start:]
    if any('"~",5' in line for line in body[:40]):
        raise SystemExit(f'{name}: notify branch already reads field 5')
    hits = [i for i in range(start, len(lines) - 2)
            if [x.strip() for x in lines[i:i + 2]] == OLD_BCO]
    if len(hits) != 1 or hits[0] - start > 20:
        raise SystemExit(f'{name}: {OLD_BCO} found {len(hits)} times in the notify branch')
    i = hits[0]
    indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
    if lines[i + 1] != indent + OLD_BCO[1] or lines[i + 2] != indent + FIELD3:
        raise SystemExit(f'{name}: the bco lines are not followed by field 3')
    timer.set_code('timer', lines[:i] + [indent + line for line in NEW_BCO] + lines[i + 2:])
    return i


def patch_geometry(name, page, exp_head, exp_text, new_h, screen_h):
    head, text = page.obj(HEAD), page.obj(TEXT)
    if box(head) != exp_head or box(text) != exp_text:
        raise SystemExit(f'{name}: {HEAD} {box(head)} / {TEXT} {box(text)} instead of {exp_head} / {exp_text}')
    hx, hy, hw, hh = exp_head
    tx, ty, tw, th = exp_text
    if hy + hh < ty or hy > ty:
        raise SystemExit(f'{name}: gap between {HEAD} (to {hy + hh}) and {TEXT} (from {ty})')
    keep = [o for o in page.objs[1:] if o.name.startswith(KEEP)]
    below = [o for o in keep if o.get('y') >= ty + th and o.get('x') < tx + tw and tx < o.get('x') + o.get('w')]
    limit = min([o.get('y') for o in below] + [screen_h])
    if new_h == MIDDLE:
        if ty + th >= screen_h * 0.9:
            raise SystemExit(f'{name}: {TEXT} ends at {ty + th}, not in the middle of the page')
        return f'{TEXT} {exp_text} unchanged (middle of the page, ends at {ty + th})'
    if new_h is None:
        if ty + th != limit:
            raise SystemExit(f'{name}: {TEXT} ends at {ty + th}, not at {limit} - give it a new height')
        where = 'lower edge' if limit == screen_h else 'element below'
        return f'{TEXT} {exp_text} unchanged (ends at {ty + th} = {where})'
    if ty + new_h != limit:
        raise SystemExit(f'{name}: new end {ty + new_h} is not the limit {limit}')
    new_box = (tx, ty, tw, new_h)
    covered = [o.name for o in keep if overlaps(new_box, box(o))]
    if covered:
        raise SystemExit(f'{name}: the new {TEXT} {new_box} covers {covered}')
    text.geometry(*new_box)
    return f'{TEXT} {exp_text} -> {new_box} (ends at {ty + new_h})'


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    pages = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            pages[page.objs[0].name] = (section, page)
    found = {name: (box(pages[name][1].obj(HEAD)), box(pages[name][1].obj(TEXT))) for name in PAGES}
    models = [m for m, exp in EXPECTED.items() if all(found[n] == exp[n][:2] for n in PAGES)]
    if len(models) != 1:
        raise SystemExit(f'notification geometry {found} is not the expected start of one model')
    model = models[0]
    changes = {}
    for name in PAGES:
        section, page = pages[name]
        screen_h = page.objs[0].get('h')
        before = ram(page)
        line = patch_code(name, page)
        why = patch_geometry(name, page, *EXPECTED[model][name], screen_h)
        if ram(page) != before:
            raise SystemExit(f'{name}: RAM {before} -> {ram(page)}')
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        print(f'{model:4} {section:6} {name:13} field 5 at tmSerial line {line}; {why}; RAM page {before} unchanged')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
