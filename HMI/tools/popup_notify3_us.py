"""HMI 6.2.0 us-l / us-p: the notification page 'popupNotify3' like the EU page of popup_notify3.py.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_notify3_us.py <in.HMI> <out.HMI>
  e.g. HMI/us-l/nspanel-us-l-v6.1.1.HMI HMI/us-l/nspanel-us-l-v6.2.0.HMI; the output must not exist.

Unlike EU there is no prepared base: the script adds the page and the font itself.
1. Font: the icon font 9.zi of the EU project HMI/nspanel-v6.2.0.HMI ('mdi-notify-255', 51 icons, 255 px) is taken
   byte for byte and added as last font (screensaver5.add_clock_font: new zi section, entry in main.HMI behind the
   last font). The adapter sends font id 9 on every model, so the model must have exactly 9 fonts (ids 0..8)
   before - otherwise the script stops (no reordering). Fonts 3 and 4 (text, cross, button icons) must be the
   ones of EU; 0 and 2 may have more characters but the same metrics for the common ones (checked).
   us-l 6.1.1: 9 fonts, us-p 6.1.1: 8 fonts (no 'corners1') -> us-p stops.
2. Page: a copy of popupNotify appended as last page (new <n>.pa, like screensaver5 adds its copy), then the same
   changes as EU (popup_notify3.build_page: objects, protocol, events, buffers), sleepValue fix (fix_sleep) on
   popupNotify3 and popupNotify, the popupNotify3 branch behind every popupNotify branch of a pageType switch,
   pageStartup.tRelease 6.1.1 -> 6.2.0.
3. Layout by the page size of popupNotify:
   480 x 320 (us-l): popup_notify3.layout_eu, identical to EU.
   320 x 480 (us-p): layout_usp - the cross gets its own strip above the icon (font 3, 48 px box): the 255 px icon
   box would otherwise cover the cross box and erase it on every redraw (tIcon is drawn after b0).
     b0     cross E155 font 3, x 256..319, y 0..47, light gray
     tIcon  font 9, x 32..287, y 48..302 (h 255), centered
     tText  x 8..311, y 304..399 (h 96), isbr 1, centered, ycen top: font 3 (48) 2 lines, font 2 (32) 3 lines,
            font 0 (24) 4 lines - fixed, also without buttons (the button strip then stays empty)
     b1/b2  x 8..155 / 164..311, y 404..471 (148 x 68), icon from font 3 centered, white, without icon invisible
"""
import os
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from popup_notify3 import (BUTTON_FONT, BUTTON_FONT_SECTION, CLOSE, FONT_ID, FONT_SECTION, HEIGHT,  # noqa: E402
                           LIGHT_GRAY, NAME, TEXT_FONT, WHITE, add_page_switch, build_page, fix_sleep, font_ids,
                           layout_eu, patch_release, ram)
from screensaver5 import insert_entry  # noqa: E402
from zilib import Zi  # noqa: E402

EU = os.path.join(HERE, '..', 'nspanel-v6.2.0.HMI')


def layout_usp(page):
    """geometry of popupNotify3 on 320 x 480 (us-p), docstring point 3"""
    b0 = page.obj('b0')
    b0.set('txt', CLOSE)
    b0.set('font', TEXT_FONT)
    b0.geometry(256, 0, 64, 48)
    b0.set('xcen', 1)
    b0.set('ycen', 1)
    b0.set('pco', LIGHT_GRAY)
    b0.set('pco2', LIGHT_GRAY)

    for name, x in (('b1', 8), ('b2', 164)):
        b = page.obj(name)
        b.geometry(x, 404, 148, 68)
        b.set('font', TEXT_FONT)
        b.set('txt', '')
        b.set('xcen', 1)
        b.set('ycen', 1)
        b.set('pco', WHITE)
        b.set('pco2', WHITE)

    icon = page.obj('tIcon')
    icon.geometry(32, 48, 256, HEIGHT)
    icon.set('font', FONT_ID)
    icon.set('xcen', 1)
    icon.set('ycen', 0)
    icon.set('isbr', 0)
    icon.set('txt', '')

    text = page.obj('tText')
    text.geometry(8, 304, 304, 96)
    text.set('font', TEXT_FONT)
    text.set('xcen', 1)
    text.set('ycen', 0)
    text.set('isbr', 1)


LAYOUTS = {(480, 320): ('us-l', layout_eu), (320, 480): ('us-p', layout_usp)}


def check_fonts(hmi, eu):
    """the fonts of the model against EU; returns the EU icon font"""
    fonts, eu_fonts = font_ids(hmi.files['main.HMI']), font_ids(eu.files['main.HMI'])
    if len(fonts) != FONT_ID:
        raise SystemExit(f'{len(fonts)} fonts (ids 0..{len(fonts) - 1}): the icon font would get id {len(fonts)}, '
                         f'not {FONT_ID} - stop, fonts {fonts}')
    if fonts[BUTTON_FONT] != BUTTON_FONT_SECTION:
        raise SystemExit(f'font {BUTTON_FONT} is {fonts[BUTTON_FONT]}, not {BUTTON_FONT_SECTION}')
    for fid in (TEXT_FONT, BUTTON_FONT):
        if hmi.files[fonts[fid]] != eu.files[eu_fonts[fid]]:
            raise SystemExit(f'font {fid} differs from EU')
    for fid in (0, 2):
        a, b = Zi(eu.files[eu_fonts[fid]]), Zi(hmi.files[fonts[fid]])
        if a.h != b.h or any(a.chars[c][:3] != b.chars[c][:3] for c in set(a.chars) & set(b.chars)) \
                or not set(a.chars) <= set(b.chars):
            raise SystemExit(f'font {fid} is not compatible with EU')
    if eu_fonts[FONT_ID] != FONT_SECTION:
        raise SystemExit('EU: unexpected font order')
    return fonts, eu.files[FONT_SECTION]


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    eu = Hmi(open(EU, 'rb').read())
    fonts, font = check_fonts(hmi, eu)

    pages = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            pages[page.objs[0].name] = (section, page)
    if NAME in pages:
        raise SystemExit(f'{NAME} exists')
    source_section, popup = pages['popupNotify']
    size = (popup.objs[0].get('w'), popup.objs[0].get('h'))
    model, layout = LAYOUTS[size]

    # main.HMI: the font behind the last font, the page behind the last page (like the EU page 35.pa)
    font_section = f'{FONT_ID}.zi'
    if font_section in hmi.files:
        raise SystemExit(f'{font_section} exists')
    main_hmi = insert_entry(hmi.files['main.HMI'], 'zi', font_section, fonts[-1])
    added = {font_section: (font, fonts[-1])}
    if font_ids(main_hmi).index(font_section) != FONT_ID:
        raise SystemExit('icon font did not get id 9')
    head = struct.unpack_from('<I', main_hmi, 4)[0]
    count = struct.unpack_from('<I', main_hmi, 28)[0]
    last_page = [main_hmi[head + 16 * i + 8:head + 16 * i + 16].split(b'\0')[0].decode() for i in range(count)
                 if main_hmi[head + 16 * i:head + 16 * i + 8].split(b'\0')[0] == b'pa'][-1]
    section = f'{max(int(s[:-3]) for s, _ in pages.values()) + 1}.pa'
    main_hmi = insert_entry(main_hmi, 'pa', section, last_page)

    page = Page(popup.bytes())
    before = ram(page)
    ids = build_page(page, 'popupNotify', layout)
    after = ram(page)
    fixed = [fix_sleep(page), fix_sleep(popup)]

    changes = {'main.HMI': main_hmi}
    switched = []
    for name, (sec, p) in list(pages.items()) + [(NAME, (section, page))]:
        n = 0
        for o in p.objs:
            for item in o.items:
                if item[0] == 'code' and any(line.strip() == 'if(tId.txt=="popupNotify")' for line in item[2]):
                    n += add_page_switch(item[2])
        if n:
            switched.append(name)
        if name == 'pageStartup':
            patch_release(p)
        if p is page:
            continue
        if n or name in ('pageStartup', 'popupNotify'):
            changes[sec] = p.bytes()
            Page(changes[sec])  # round trip
    added[section] = (page.bytes(), source_section)
    Page(added[section][0])

    out = hmi.build(changes, added)
    Hmi(out).check()
    open(target, 'wb').write(out)

    print(f'model {model} ({size[0]} x {size[1]}), layout {layout.__name__}')
    print(f'new page {section}: copy of popupNotify ({source_section}) -> {NAME}, behind {last_page}, '
          f'objects {before[1]} -> {after[1]}, text buffers {before[0]} -> {after[0]} bytes')
    print('object ids:', ', '.join(f'{n} {i}' for n, i in ids.items()))
    print(f'new font {font_section}: id {FONT_ID}, {len(font)} bytes (EU {FONT_SECTION} byte for byte), '
          f'behind {fonts[-1]}')
    print(f'pageType branch {NAME} added on {len(switched)} pages: {", ".join(sorted(switched))}')
    print('sleepValue fix:', '; '.join(fixed))
    print(f'changed sections: {", ".join(sorted(changes))}; new: {", ".join(sorted(added))}')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
