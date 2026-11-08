"""Adds the font suffix of the indicator fields to an HMI whose page 'screensaver5' is already built (EU, us-l, us-p).

Usage: PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/screensaver5_iconfont.py <in.HMI> <out.HMI>

The generators (screensaver5.py, screensaver5_usp.py, screensaver5_usl.py) already write this code; this script only
patches files built before: behind every 'spstr ..,f<n>Icon.txt,..' of the weatherUpdate block it inserts
screensaver5.icon_font_lines with the font of the object as default and raises txt_maxl of the indicator fields.
An icon '<icon>\u00ac<font id>' then gets that font, without suffix the field keeps its font. The bottom icons
e<n>Icon have no font code. The bytes of the larger indicator fields come back from oversized buffers
(screensaver5.shrink_buffers). Nothing else changes.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from screensaver5 import add_icon_font, txt_sum  # noqa: E402


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    section = next((n for n, d in hmi.files.items() if n.endswith('.pa') and Page(d).objs[0].name == 'screensaver5'), None)
    if section is None:
        raise SystemExit('no page screensaver5')
    page = Page(hmi.files[section])
    before = txt_sum(page)
    count = add_icon_font(page)
    if not count:
        raise SystemExit('screensaver5 already has the icon font code')
    out = hmi.build({section: page.bytes()})
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {count} icon fields, txt_maxl sum of screensaver5 {before} -> {txt_sum(page)}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
