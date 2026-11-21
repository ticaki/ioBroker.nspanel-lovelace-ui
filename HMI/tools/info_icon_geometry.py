"""HMI 6.2.0 (stays 6.2.0): the field of the info icon (tTimeAdd) gets the size of the icon. Pages screensaver
(standard/alternate, us-l also the font) and screensaver2 (advanced) of all models, screensaver3 (easyview) of us-l.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/info_icon_geometry.py HMI/nspanel-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/info_icon_geometry.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/info_icon_geometry.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p, after screensaver_blink_info_icon.py), the output must not exist.

Finding 1: since screensaver_blink_info_icon.py a tap on tTimeAdd opens the popup of the info icon. On screensaver the
field is a strip across the whole width between the clock and the date (EU 1,134,450,32 - us-l 15,134,450,32 - us-p
0,163,320,32), on screensaver2 a box of 128..153 px - every tap in it counts as a tap on the icon, although the field
only ever shows one icon glyph (field 2 of time~).
Finding 2: on screensaver3 of us-l tTimeAdd is 2 px wide (15,134,2,32, font 2 without icons) - the icon cannot be
seen. EU has a big icon there (5,32,64,64, font 3).

Fix 1, screensaver and screensaver2: width = the widest icon glyph (U+E000..U+FDFF) of the font of tTimeAdd plus
MARGIN px. Height, y and font stay. The glyph stays where it is today: centred (xcen 1) x = old x + (old w - new w)/2
(the script checks that the glyph lands on the same pixel), right aligned (xcen 2) the right edge stays.
Finding 3: on screensaver of us-l tTimeAdd has font 2, a text font without the info icons - the icon was never
visible there. Fix 3: font 1 like EU and us-p (same height 32, the icon font). Any other font without the info icons
stops the script.
Fix 2, screensaver3 of us-l: tTimeAdd like on EU, shifted by 15 px (us-l is EU + 15 in x): 20,32,64,64, font 3,
xcen 1, ycen 1. Font 3 of us-l must be the font 3 of EU (same height, icon glyphs). Colours and code stay (load sets
tTimeAdd.bco=tTime.bco, color~ sets pco).
us-p screensaver3 is not changed: the page has no free 64x64 area (clock, date and the 2 x 2 entities fill it).

Only geometry/font attributes change, no object is added: the RAM of the pages stays (checked).
pageStartup.tRelease stays 6.2.0.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from font_widths import font_sections  # noqa: E402
from hmi import Hmi  # noqa: E402
from indicator_long_press_release import ram  # noqa: E402
from pagefile import Page  # noqa: E402
from zilib import Zi  # noqa: E402

INFO = 'tTimeAdd'
INFO_ID = 'bInfo'
MARGIN = 7
ICONS = range(0xE000, 0xFE00)
# icons the adapter puts into field 2 of time~ (src/lib/const/icon_mapping.ts): timer-sand, timer-alert, timer-pause,
# wrench-clock, cog-refresh-outline, alert-circle-outline
INFO_ICONS = (0xE51E, 0xFACB, 0xFADD, 0xF9A2, 0xF45E, 0xE5D5)
ICON_FONT_32 = 1  # icon font of height 32 in all models

# expected start: (x, y, w, h, font, xcen, ycen) of tTimeAdd per model and page
GEOMETRY = ('x', 'y', 'w', 'h', 'font', 'xcen', 'ycen')
EXPECTED = {
    'eu': {
        'screensaver': (1, 134, 450, 32, 1, 1, 2),
        'screensaver2': (90, 15, 150, 32, 1, 2, 2),
        'screensaver3': (5, 32, 64, 64, 3, 1, 1),
    },
    'us-l': {
        'screensaver': (15, 134, 450, 32, 2, 1, 2),
        'screensaver2': (105, 15, 153, 30, 1, 2, 2),
        'screensaver3': (15, 134, 2, 32, 2, 1, 2),
    },
    'us-p': {
        'screensaver': (0, 163, 320, 32, 1, 1, 1),
        'screensaver2': (95, 110, 128, 30, 1, 1, 2),
        'screensaver3': (0, 163, 2, 32, 1, 1, 1),
    },
}
SHRINK = ('screensaver', 'screensaver2')
# font of tTimeAdd replaced before the width is taken: {model: {page: (old font, new font)}}
FONT_FIX = {'us-l': {'screensaver': (2, ICON_FONT_32)}}
# screensaver3 like EU: (x, y, w, h, font, xcen, ycen)
EASYVIEW = {'us-l': (20, 32, 64, 64, 3, 1, 1)}
EASYVIEW_EU = (5, 32, 64, 64, 3, 1, 1)


def geometry(obj):
    return tuple(obj.get(k) for k in GEOMETRY)


def icon_font(hmi, fid):
    """(height, widest icon glyph advance, has the info icons) of font id fid"""
    zi = Zi(hmi.files[font_sections(hmi)[fid]])
    adv = [w + left + right for cp, (w, left, right, _) in zi.chars.items() if cp in ICONS]
    return zi.h, max(adv) if adv else 0, all(cp in zi.chars for cp in INFO_ICONS)


def boxes_overlap(a, b):
    return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]


def shrink(hmi, name, info, old, font_fix):
    x, y, w, h, fid, xcen, ycen = old
    fixed = ''
    if font_fix:
        old_fid, new_fid = font_fix
        if fid != old_fid or icon_font(hmi, old_fid)[2]:
            raise SystemExit(f'{name}.{INFO}: font {fid} is not the font {old_fid} without info icons')
        if icon_font(hmi, new_fid)[0] != icon_font(hmi, old_fid)[0]:
            raise SystemExit(f'{name}.{INFO}: font {new_fid} has not the height of font {old_fid}')
        info.set('font', new_fid)
        fixed = f', font {old_fid} -> {new_fid}'
        fid = new_fid
    height, adv, ok = icon_font(hmi, fid)
    if not ok:
        raise SystemExit(f'{name}.{INFO}: font {fid} has no info icons')
    new_w = adv + MARGIN
    if new_w >= w:
        raise SystemExit(f'{name}.{INFO}: width {w} is not wider than the icon field {new_w}')
    if xcen == 1:
        if (w - new_w) % 2:
            raise SystemExit(f'{name}.{INFO}: {w} - {new_w} is odd, the icon would move by half a pixel')
        new_x = x + (w - new_w) // 2
        if x + (w - adv) // 2 != new_x + (new_w - adv) // 2:
            raise SystemExit(f'{name}.{INFO}: the glyph would move')
    elif xcen == 2:
        new_x = x + w - new_w
    else:
        raise SystemExit(f'{name}.{INFO}: xcen {xcen} not handled')
    info.geometry(new_x, y, new_w, h)
    return f'icons {adv} px + {MARGIN}{fixed}'


def easyview(hmi, eu_fonts, page, info, new):
    x, y, w, h, fid, xcen, ycen = new
    height, adv, ok = icon_font(hmi, fid)
    if (height, adv, ok) != eu_fonts:
        raise SystemExit(f'screensaver3.{INFO}: font {fid} {(height, adv, ok)} is not the EU font {eu_fonts}')
    info.geometry(x, y, w, h)
    info.set('font', fid)
    info.set('xcen', xcen)
    info.set('ycen', ycen)
    box = (x, y, w, h)
    over = [o.name for o in page.objs[2:] if o is not info and o.has('w') and o.has('font')
            and boxes_overlap(box, geometry(o)[:4])]
    return f'font {fid} h {height} icons {adv} px, box overlaps {over}'


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
    found = {geometry(pages[name][1].obj(INFO)) for name in EXPECTED['eu']}
    models = [m for m, exp in EXPECTED.items() if set(exp.values()) == found]
    if len(models) != 1:
        raise SystemExit(f'{INFO} geometry {sorted(found)} is not the expected start of one model')
    model = models[0]
    for name, exp in EXPECTED[model].items():
        section, page = pages[name]
        info = page.obj(INFO)
        if geometry(info) != exp:
            raise SystemExit(f'{name}.{INFO}: {geometry(info)} instead of {exp}')
        if not any(INFO_ID in line for line in info.code('down')):
            raise SystemExit(f'{name}.{INFO}: down has not the code of screensaver_blink_info_icon.py')
    eu_fonts = (48, 43, True)  # font 3 of EU: height 48, icon advance 43, info icons
    if icon_font(hmi, EASYVIEW_EU[4]) != eu_fonts:
        raise SystemExit(f'font {EASYVIEW_EU[4]}: {icon_font(hmi, EASYVIEW_EU[4])} instead of {eu_fonts}')
    changes = {}
    for name in SHRINK + ('screensaver3',):
        if name == 'screensaver3' and model not in EASYVIEW:
            continue
        section, page = pages[name]
        info = page.obj(INFO)
        before = ram(page)
        old = geometry(info)
        if name in SHRINK:
            why = shrink(hmi, name, info, old, FONT_FIX.get(model, {}).get(name))
        else:
            why = easyview(hmi, eu_fonts, page, info, EASYVIEW[model])
        if ram(page) != before:
            raise SystemExit(f'{name}: RAM {before} -> {ram(page)}')
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        print(f'{model:4} {section:6} {name:13} {INFO} {old} -> {geometry(info)} ({why}); RAM page {before} unchanged')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
