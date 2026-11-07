"""HMI 6.0.7 -> 6.0.8: an indicator sends one event per press.

Usage: python3 -I -B HMI/tools/indicator_single_press.py <in.HMI> <out.HMI>

The code 'down' of f<N>Icon sends event,buttonPress2,<id>,button and left this text in tSend, tc0 'up' sent tSend
without a check, so a press came a second time when the finger was lifted. Now 'down' empties tSend after sending and
tc0 'up' only sends a tSend with text. A swipe still writes its text into tSend, tc0 'down' still writes the bExit
text with every touch and runs before f<N>Icon 'down'.

Only the pages with indicator events change: screensaver5, and screensaver2 where its icons send events (EU; the
icons of us-l and us-p 6.0.7 have no code, their tc0 stays as well, advanced_indicators_us.py adds both on top of
this). What is already there stays, so the output of the
generators screensaver5*.py (they already write this for screensaver5, the version stays theirs) goes through this
script as well. pageStartup.tRelease gets the new version, tVersion stays: the adapter does not read that number.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from screensaver5 import CLEAR_SEND, PRESS_PREFIX, SEND, send_if_text  # noqa: E402

PAGES = ('screensaver5', 'screensaver2')
OLD_RELEASE, NEW_RELEASE = '6.0.7', '6.0.8'
ICON = re.compile(r'f(\d+)Icon')
TOUCH_TEXT = 'tSend.txt="event,buttonPress2,screensaver,bExit,"+tTmp.txt'


def patch_page(page):
    """returns (indicators, lines added to them, tc0 'up' changed)"""
    added = icons = 0
    for o in page.objs:
        match = ICON.fullmatch(o.name)
        if not match:
            continue
        lines = o.code('down')
        if not lines or lines[0] != f'{PRESS_PREFIX}{match.group(1)}.txt+",button"':
            continue
        icons += 1
        if lines[1:] == SEND:
            o.set_code('down', lines + [CLEAR_SEND])
            added += 1
        elif lines[1:] != SEND + [CLEAR_SEND]:
            raise SystemExit(f'{page.objs[0].name}.{o.name}: unexpected code')
    if not icons:
        return 0, 0, False
    # an empty tSend must not swallow the next touch: tc0 'down' writes it every time, outside of any condition
    if TOUCH_TEXT not in page.obj('tc0').code('down'):
        raise SystemExit(f'{page.objs[0].name}.tc0: down does not write tSend')
    tc0 = page.obj('tc0')
    up = send_if_text(tc0.code('up'))
    changed = up != tc0.code('up')
    tc0.set_code('up', up)
    return icons, added, changed


def main(source, target):
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
        icons, added, changed = patch_page(page)
        print(f'{name} ({section}): {icons} indicators, {added} lines added, tc0 up changed: {changed}')
        if name == 'screensaver5' and not icons:
            raise SystemExit('screensaver5 has no indicators')
        if added or changed:
            changes[section] = page.bytes()
    section, start = sections['pageStartup']
    release = start.obj('tRelease')
    if release.get('txt') != OLD_RELEASE or len(OLD_RELEASE) != len(NEW_RELEASE):
        raise SystemExit(f'release text is {release.get("txt")}, expected {OLD_RELEASE}')
    release.set('txt', NEW_RELEASE)
    changes[section] = start.bytes()
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {OLD_RELEASE} -> {NEW_RELEASE}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
