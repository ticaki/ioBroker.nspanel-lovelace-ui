"""HMI 6.0.7 -> 6.0.8: an indicator tells when the finger is lifted.

Usage: python3 -I -B HMI/tools/indicator_release.py <in.HMI> <out.HMI>

The code 'down' of f<N>Icon sends event,buttonPress2,<id>,button and leaves this text in tSend, tc0 'up' sends tSend
without a check, so the press came twice. Now 'down' puts event,buttonPress2,<id>,release into tSend after sending:
tc0 'up' sends that when the finger is lifted. A swipe still overwrites tSend, tc0 'down' still runs before f<N>Icon 'down'.

Only the pages with indicator events change: screensaver5, and screensaver2 where its icons send events (EU; the
icons of us-l and us-p have no code). Lines which are already there stay, so the output of the generators
screensaver5*.py (they already write the line for screensaver5, the version stays theirs) go through this script
as well. pageStartup.tRelease gets the new version, tVersion stays:
the adapter does not read that number.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from screensaver5 import PRESS_PREFIX, release_line  # noqa: E402

PAGES = ('screensaver5', 'screensaver2')
OLD_RELEASE, NEW_RELEASE = '6.0.7', '6.0.8'
ICON = re.compile(r'f(\d+)Icon')
LAST_SEND = 'prints crcval,2'
RELEASE_SUFFIX = ',release'


def patch_page(page):
    """adds the line to all icons of the page, returns (lines added, icons with the event)"""
    added = icons = 0
    for o in page.objs:
        match = ICON.fullmatch(o.name)
        if not match:
            continue
        n = match.group(1)
        lines = o.code('down')
        if not lines or lines[0] != f'{PRESS_PREFIX}{n}.txt+",button"':
            continue
        icons += 1
        line = release_line(n)
        if line in lines:
            continue
        if lines[-1] != LAST_SEND:
            raise SystemExit(f'{page.objs[0].name}.{o.name}: unexpected end of the code: {lines[-1]}')
        size = len(PRESS_PREFIX.split('"')[1]) + page.obj(f'entn{n}').get('txt_maxl') + len(RELEASE_SUFFIX)
        if size > page.obj('tSend').get('txt_maxl'):
            raise SystemExit(f'{page.objs[0].name}: tSend is too short for {size} characters')
        o.set_code('down', lines + [line])
        added += 1
    return added, icons


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
        added, icons = patch_page(page)
        print(f'{name} ({section}): {icons} indicators, {added} lines added')
        if name == 'screensaver5' and not icons:
            raise SystemExit('screensaver5 has no indicators')
        if added:
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
