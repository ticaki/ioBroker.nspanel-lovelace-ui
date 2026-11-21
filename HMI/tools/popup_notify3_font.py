"""Rebuilds the large icon font of popupNotify3 (font id 9, 'mdi-notify-255') in an HMI that already has the page.

Usage (from the repository root):
  PUPPETEER_PATH=$(npm root -g)/ PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_notify3_font.py <in.HMI> <out.HMI>
Works on EU, us-l and us-p 6.2.0; the output must not exist.

The generators (popup_notify3.py, popup_notify3_us.py) build the whole page and must not run again on files that
were edited in the editor afterwards. When the icon list templates/popup-notify3-icons.json changes, this script
only replaces the font: popup_notify3.build_font renders the icons of the list (same height, space and header as
the generator), the section is the one of font id 9 by the font entries of main.HMI (EU '9.zi', on us-l/us-p the
font was added last and has another <n>.zi name). Hmi.build saves it the way the editor does (new payload, old
record deleted, directory checksums); every other live section stays byte for byte, which is checked before
writing. The rendering is deterministic, so the font is the same on every model.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from popup_notify3 import (BUTTON_FONT, BUTTON_FONT_SECTION, FONT_ID, FONT_NAME, FONT_SECTION, HEIGHT,  # noqa: E402
                           ICONS, build_font, font_ids)
from zilib import Zi  # noqa: E402


class _Fonts:
    """the two fonts build_font reads, under the EU section names"""

    def __init__(self, files):
        self.files = files


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    fonts = font_ids(hmi.files['main.HMI'])
    if len(fonts) <= FONT_ID:
        raise SystemExit(f'no font id {FONT_ID}, fonts {fonts}')
    section = fonts[FONT_ID]
    if fonts[BUTTON_FONT] != BUTTON_FONT_SECTION:
        raise SystemExit(f'font {BUTTON_FONT} is {fonts[BUTTON_FONT]}, not {BUTTON_FONT_SECTION}')
    old = hmi.files[section]
    if old[0x2C:0x2C + len(FONT_NAME)] != FONT_NAME.encode():
        raise SystemExit(f'{section} (font {FONT_ID}) is not {FONT_NAME}')
    font, cps = build_font(_Fonts({BUTTON_FONT_SECTION: hmi.files[BUTTON_FONT_SECTION], FONT_SECTION: old}))
    if font == old:
        raise SystemExit(f'{section}: font unchanged')

    out = hmi.build({section: font})
    new = Hmi(out)
    new.check()
    if set(new.files) != set(hmi.files):
        raise SystemExit('the set of sections changed')
    other = [n for n in hmi.files if n != section and new.files[n] != hmi.files[n]]
    if other:
        raise SystemExit(f'sections changed: {other}')
    zi = Zi(new.files[section])
    if zi.h != HEIGHT or len(zi.chars) != len(ICONS) + 1 or 0x20 not in zi.chars:
        raise SystemExit('new font does not parse back')
    open(target, 'wb').write(out)
    print(f'{section} (font {FONT_ID}): {len(Zi(old).chars)} -> {len(zi.chars)} characters '
          f'({len(cps)} icons + space), {len(old)} -> {len(font)} bytes')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
