"""HMI 6.2.0 us-l / us-p: the notification page 'popupNotify3' like the EU page of popup_notify3.py.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_notify3_us.py <in.HMI> <out.HMI>
  e.g. HMI/us-l/nspanel-us-l-v6.1.1.HMI HMI/us-l/nspanel-us-l-v6.2.0.HMI; the output must not exist.

Unlike EU there is no prepared base: the script adds the page and the font itself.
1. Font: the icon font 9.zi of the EU project HMI/nspanel-v6.2.0.HMI ('mdi-notify-255', the icons of
   templates/popup-notify3-icons.json, 255 px) is taken byte for byte and added as last font (screensaver5.add_clock_font: new zi section, entry in main.HMI behind the
   last font). The adapter sends font id 9 on every model, so the model must have exactly 9 fonts (ids 0..8)
   before - otherwise the script stops (no reordering). Fonts 3 and 4 (text, cross, button icons) must be the
   ones of EU; 0 and 2 may have more characters but the same metrics for the common ones (checked; not on us-p:
   its fonts 0/2 are another face, the adapter has its own us-p width tables - only a note).
   us-l 6.1.1: 9 fonts. us-p 6.1.1: 8 fonts (no 'corners1', id 7 = Clock96). With exactly this structure (8 fonts,
   the last one byte for byte clock96.zi) the font ids are made the same as EU: the EU font 8.zi 'corners1' (id 7
   there, 3 characters, 272 bytes) is taken byte for byte (next free <n>.zi) and its entry in main.HMI goes in front
   of the Clock96 entry -> corners1 id 7, Clock96 id 8 (as EU), the icon font behind Clock96 -> id 9. Every use of
   font 7 then moves to 8: object attribute font (screensaver5.tTime), '.font=7' and xstr with font 7 (5th
   parameter) in code that is not commented out. Commented lines keep 7 (popupLight2 '//xstr ...,7,...,"a"': the
   corner glyphs, font 7 = corners1 as in EU). Font ids set at runtime (.font=sys0/sys1, values from the adapter)
   are not touched. Any other structure stops.
2. Page: a copy of popupNotify appended as last page (new <n>.pa, like screensaver5 adds its copy), then the same
   changes as EU (popup_notify3.build_page: objects, protocol, events, buffers), sleepValue fix (fix_sleep) on
   popupNotify3 and popupNotify, the popupNotify3 branch behind every popupNotify branch of a pageType switch,
   pageStartup.tRelease 6.1.1 -> 6.2.0.
3. Layout by the page size of popupNotify:
   480 x 320 (us-l): popup_notify3.layout_eu shifted 15 px to the right (layout_usl): the visible area of us-l is
     x 15..464 instead of 0..449 (every page of us-l lies 15 px further right than on EU, see point 4 there).
   us-p has no such offset: the pages use the full width symmetrically (cards bPrev 9 .. bNext 310, screensaver
     texts 0..319, popupNotify 3..317), layout_usp keeps its 8 px margins.
   320 x 480 (us-p): layout_usp - the cross gets its own strip above the icon (font 3, 48 px box): the 255 px icon
   box would otherwise cover the cross box and erase it on every redraw (tIcon is drawn after b0).
     b0     cross E155 font 3, x 256..319, y 0..47, light gray
     tIcon  font 9, x 32..287, y 48..302 (h 255), centered
     tText  x 8..311, y 304..399 (h 96), isbr 1, centered, ycen top: font 3 (48) 2 lines, font 2 (32) 3 lines,
            font 0 (24) 4 lines - fixed, also without buttons (the button strip then stays empty)
     b1/b2  x 8..155 / 164..311, y 404..471 (148 x 68), icon from font 3 centered, white, without icon invisible
4. Overlap fix screensaver3 (popup_notify3.fix_overlap, docstring point 8 there): us-l tMainIconAlt2 x 0 -> 3;
   us-p has neither tMainTextAlt2 nor tMainIconAlt2 - skipped. us-p only: cardEntities btOnOff1/2/4 1 px up
   (popup_notify3.fix_entities_overlap).
"""
import os
import re
import struct
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from popup_notify3 import (BUTTON_FONT, BUTTON_FONT_SECTION, CLOSE, FONT_ID, FONT_SECTION, HEIGHT,  # noqa: E402
                           ENTITIES_PAGE, LIGHT_GRAY, NAME, OVERLAP_PAGE, TEXT_FONT, VISIBLE_SHIFT_USL, WHITE,
                           add_page_switch, build_page, fix_entities_overlap, fix_overlap, fix_sleep, font_ids,
                           layout_eu, patch_release, ram)
from screensaver5 import insert_entry  # noqa: E402
from zilib import Zi  # noqa: E402

EU = os.path.join(HERE, '..', 'nspanel-v6.2.0.HMI')
CLOCK_FONT = os.path.join(HERE, 'clock96.zi')
CORNERS_ID = 7  # 8.zi 'corners1' in EU; us-p: the old id of Clock96
CLOCK_ID = 8  # Clock96 in EU
CORNERS_NAME = b'corners1'


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


def layout_usl(page):
    """geometry of popupNotify3 on us-l: the EU layout shifted to the visible area of us-l, docstring point 3"""
    layout_eu(page, VISIBLE_SHIFT_USL)


LAYOUTS = {(480, 320): ('us-l', layout_usl), (320, 480): ('us-p', layout_usp)}


def corners_placeholder(hmi, eu, fonts, eu_fonts):
    """us-p: 8 fonts, the last one Clock96 -> the EU font 'corners1' as placeholder for id 7, else None"""
    clock = open(CLOCK_FONT, 'rb').read()
    if len(fonts) != FONT_ID - 1 or hmi.files[fonts[-1]] != clock:
        return None
    if eu.files[eu_fonts[CLOCK_ID]] != clock:
        raise SystemExit(f'EU: font {CLOCK_ID} is not Clock96')
    font = eu.files[eu_fonts[CORNERS_ID]]
    if font[0x2c:0x2c + len(CORNERS_NAME)] != CORNERS_NAME:
        raise SystemExit(f'EU: font {CORNERS_ID} is not {CORNERS_NAME.decode()}')
    return font


FONT_SET = re.compile(r'(\.font\s*=\s*)(\d+)\b')


def renumber_clock(page):
    """us-p: font id CORNERS_ID (old Clock96) -> CLOCK_ID in the object attributes and in code that is not
    commented out; returns the changed places"""
    done = []
    for o in page.objs:
        if o.has('font') and o.get('font') == CORNERS_ID:
            o.set('font', CLOCK_ID)
            done.append(f'{o.name}.font (attribute)')
        for item in o.items:
            if item[0] != 'code':
                continue
            lines = item[2]
            for i, line in enumerate(lines):
                if line.strip().startswith('//'):
                    continue
                new = FONT_SET.sub(lambda m: m.group(1) + (str(CLOCK_ID) if m.group(2) == str(CORNERS_ID)
                                                           else m.group(2)), line)
                stripped = new.lstrip()
                if stripped.startswith('xstr '):
                    args = stripped[5:].split(',')
                    if len(args) > 4 and args[4].strip() == str(CORNERS_ID):
                        args[4] = str(CLOCK_ID)
                        new = new[:len(new) - len(stripped)] + 'xstr ' + ','.join(args)
                if new != line:
                    lines[i] = new
                    done.append(f'{o.name} {item[1]}: {line.strip()} -> {new.strip()}')
    return done


def check_fonts(hmi, eu):
    """the fonts of the model against EU; returns the fonts, the EU icon font and the placeholder font (or None)"""
    fonts, eu_fonts = font_ids(hmi.files['main.HMI']), font_ids(eu.files['main.HMI'])
    placeholder = corners_placeholder(hmi, eu, fonts, eu_fonts)
    if len(fonts) != FONT_ID and placeholder is None:
        raise SystemExit(f'{len(fonts)} fonts (ids 0..{len(fonts) - 1}): the icon font would get id {len(fonts)}, '
                         f'not {FONT_ID} - stop, fonts {fonts}')
    if fonts[BUTTON_FONT] != BUTTON_FONT_SECTION:
        raise SystemExit(f'font {BUTTON_FONT} is {fonts[BUTTON_FONT]}, not {BUTTON_FONT_SECTION}')
    for fid in (TEXT_FONT, BUTTON_FONT):
        if hmi.files[fonts[fid]] != eu.files[eu_fonts[fid]]:
            raise SystemExit(f'font {fid} differs from EU')
    if placeholder is not None:
        print('note: us-p fonts 0/2 differ from EU - the adapter uses its own us-p width tables')
    else:
        for fid in (0, 2):
            a, b = Zi(eu.files[eu_fonts[fid]]), Zi(hmi.files[fonts[fid]])
            if a.h != b.h or any(a.chars[c][:3] != b.chars[c][:3] for c in set(a.chars) & set(b.chars)) \
                    or not set(a.chars) <= set(b.chars):
                raise SystemExit(f'font {fid} is not compatible with EU')
    if eu_fonts[FONT_ID] != FONT_SECTION:
        raise SystemExit('EU: unexpected font order')
    return fonts, eu.files[FONT_SECTION], placeholder


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    eu = Hmi(open(EU, 'rb').read())
    fonts, font, placeholder = check_fonts(hmi, eu)

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

    # main.HMI: (us-p: the placeholder and) the font behind the last font, the page behind the last page (like
    # the EU page 35.pa)
    main_hmi = hmi.files['main.HMI']
    added = {}
    last_font = fonts[-1]
    corners_section = None
    if placeholder is not None:
        n = 0
        while f'{n}.zi' in hmi.files:
            n += 1
        corners_section = f'{n}.zi'
        main_hmi = insert_entry(main_hmi, 'zi', corners_section, fonts[-2])  # in front of Clock96
        added[corners_section] = (placeholder, fonts[-1])
    font_section = f'{FONT_ID}.zi'
    if font_section in hmi.files or font_section in added:
        raise SystemExit(f'{font_section} exists')
    main_hmi = insert_entry(main_hmi, 'zi', font_section, last_font)
    added[font_section] = (font, fonts[-1])
    new_fonts = font_ids(main_hmi)
    if new_fonts.index(font_section) != FONT_ID:
        raise SystemExit('icon font did not get id 9')
    expected = fonts[:-1] + [corners_section, fonts[-1]] if corners_section else list(fonts)
    if new_fonts != expected + [font_section]:
        raise SystemExit(f'unexpected font order {new_fonts}')
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
    renumbered = []
    overlap = entities = None
    for name, (sec, p) in list(pages.items()) + [(NAME, (section, page))]:
        moved = renumber_clock(p) if corners_section else []
        renumbered += [f'{name} ({sec}) {m}' for m in moved]
        n = 0
        for o in p.objs:
            for item in o.items:
                if item[0] == 'code' and any(line.strip() == 'if(tId.txt=="popupNotify")' for line in item[2]):
                    n += add_page_switch(item[2])
        if n:
            switched.append(name)
        if name == 'pageStartup':
            patch_release(p)
        if name == OVERLAP_PAGE:
            overlap = fix_overlap(p, 0)
        if name == ENTITIES_PAGE and model == 'us-p':
            entities = fix_entities_overlap(p)
        if p is page:
            continue
        if n or moved or overlap and name == OVERLAP_PAGE or entities and name == ENTITIES_PAGE \
                or name in ('pageStartup', 'popupNotify'):
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
    if corners_section:
        print(f'new font {corners_section}: id {CORNERS_ID}, {CORNERS_NAME.decode()}, {len(placeholder)} bytes '
              f'(EU font {CORNERS_ID} byte for byte), in front of {fonts[-1]} (Clock96 {CORNERS_ID} -> {CLOCK_ID})')
        print(f'font {CORNERS_ID} -> {CLOCK_ID} ({len(renumbered)}):')
        for m in renumbered:
            print('  ' + m)
    print(f'new font {font_section}: id {FONT_ID}, {len(font)} bytes (EU {FONT_SECTION} byte for byte), '
          f'behind {last_font}')
    print('font ids:', ', '.join(f'{i} {s}' for i, s in enumerate(new_fonts)))
    print(f'pageType branch {NAME} added on {len(switched)} pages: {", ".join(sorted(switched))}')
    print('sleepValue fix:', '; '.join(fixed))
    print('overlap fix:', overlap or f'{OVERLAP_PAGE}: no such objects, skipped')
    if entities:
        print('overlap fix:', entities)
    print(f'changed sections: {", ".join(sorted(changes))}; new: {", ".join(sorted(added))}')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
