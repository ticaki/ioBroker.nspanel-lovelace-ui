"""Build the grid screensaver 'screensaver5' (EU, 480x320, usable width 450).

Usage: python3 -I HMI/tools/screensaver5.py <in.HMI> <out.HMI>

Without a page 'screensaver5' the script adds one as a copy of the standard 'screensaver' behind
'screensaver3' (main.HMI identical to 'copy page' in the editor); an existing copy is used as is.
A page 'screensaver4' (HMI 6.0.7: an animated Julia set) is not touched, the new page goes behind it.
The script rebuilds that page and adds 'screensaver5' to the pageType switch of every page.

Layout, 3 rows x 5 columns of 90 x 107 px:
  top     f1..f5   indicators, icon only, a touch sends event,buttonPress2,<id>,button once: it empties tSend,
                   tc0 'up' only sends a tSend with text (a swipe writes its text into it)
                   (6.0.8: indicator_single_press.py; tap counter and long press: indicator_long_press.py on top)
  middle  f6 | info icon, time, AM/PM, date (3 columns) | f7
  bottom  e1..e5   name / icon / value like the forecast items of the standard screensaver
  bottom edge      tRelay1, tRelay2 - the status icons as two color bars, like screensaver3

weatherUpdate~<5 bottom slots>~<7 indicator slots>, each slot type~id~icon~color~name~value:
  bottom k (0..4)    fields 1+6k ..  icon 3+6k, color 4+6k, name 5+6k, value 6+6k
  indicator j (0..6) fields 31+6j .. id 32+6j, icon 33+6j, color 34+6j
  an indicator icon may end with '\u00ac<font id>' (like the icons of cardGrid): f<n>Icon gets that font and the suffix
  is cut, without it the field gets its default font 4 back, see icon_font_lines; the bottom icons have no font code
color~ like the standard screensaver: 1 background, 2 time, 3 AM/PM, 4 date,
  6..9 names of item 1..4, 10..13 values of item 1..4 (item 5 uses 9 and 13)
statusUpdate~icon1~color1~icon2~color2~..: only the colors 2 and 4 are used, for the bars

The time uses the font clock96.zi (clockfont.py), added as last font of the project like the editor does.
The page cardPChart gets the rim fix of fix_pie_rim.
"""
import os
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402

COL = 90
ROWS = (0, 107, 214)
ROW_H = (107, 107, 106)

KEEP = ['screensaver5', 'p0', 'tc0', 'tmSerial', 'strCommand', 'tTime', 'tDate', 'tId', 'vaTap',
        'tmSleep', 'tInstruction', 'tTmp', 'tSend', 'tm0', 'xc1', 'yc1', 'xc2', 'yc2', 'ycR', 'xcR', 'strTmp']
TOP = ['m0', 'tNotifyHead', 'tNotifyText']

SEND = [
    '//send calc crc',
    'btlen tSend.txt,sys0',
    'crcrest 1,0xffff // reset CRC',
    'crcputh 55 bb',
    'crcputs sys0,2',
    'crcputs tSend.txt,0',
    '//send cmd',
    'printh 55 bb',
    'prints sys0,2',
    'prints tSend.txt,0',
    'prints crcval,2',
]


PRESS_PREFIX = 'tSend.txt="event,buttonPress2,"+entn'
CLEAR_SEND = 'tSend.txt=""'
IF_TEXT = 'if(tSend.txt!="")'


def indicator_down(n):
    """code 'down' of the indicator f<n>Icon: sends the press and leaves nothing for tc0 'up'"""
    return [f'{PRESS_PREFIX}{n}.txt+",button"'] + SEND + [CLEAR_SEND]


def send_if_text(lines):
    """code 'up' of tc0 with the send block at its end inside if(tSend.txt!=""); already inside: unchanged"""
    if IF_TEXT in lines:
        return list(lines)
    if lines[-len(SEND):] != SEND:
        raise ValueError('tc0 up does not end with the send block')
    return lines[:-len(SEND)] + [IF_TEXT, '{'] + ['  ' + line for line in SEND] + ['}']


# indicator fields: the icon (3 bytes UTF-8) plus '\u00ac<font id>' (3 bytes) - or a short value text instead of an
# icon; ICON_MAXL see BUFFER_MAXL
ICON_FONT_MARK = '\u00ac'


def icon_font_lines(ind, name, default):
    """after 'spstr ..,<name>.txt,..': '<icon>\u00ac<font id>' sets that font and cuts the suffix (the code of the cardGrid
    icons), else <name> gets its default font back; texts shorter than 2 characters are left alone"""
    return [
        f'{ind}{name}.font={default}',
        f'{ind}strlen {name}.txt,sys0',
        f'{ind}if(sys0>1)',
        f'{ind}{{',
        f'{ind}  substr {name}.txt,tTmp.txt,sys0-2,1',
        f'{ind}  if(tTmp.txt=="{ICON_FONT_MARK}")',
        f'{ind}  {{',
        f'{ind}    substr {name}.txt,tTmp.txt,sys0-1,1',
        f'{ind}    covx tTmp.txt,sys1,0,0',
        f'{ind}    {name}.font=sys1',
        f'{ind}    substr {name}.txt,{name}.txt,0,sys0-2',
        f'{ind}  }}',
        f'{ind}}}',
    ]


ICON_SPSTR = re.compile(r'(\s*)spstr strCommand\.txt,(f\d+Icon)\.txt,"~",\d+')


def add_icon_font(page):
    """inserts icon_font_lines behind every spstr into an indicator field f<n>Icon of the weatherUpdate block of
    the screensaver5 page (default = the font of the object) and raises txt_maxl of those fields to ICON_MAXL;
    returns the number of icon fields, 0 if the page already has the code"""
    lines = page.obj('tmSerial').code('timer')
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="weatherUpdate"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    if any(ICON_FONT_MARK in line for line in lines[a:b]):
        return 0
    out, names = [], []
    for line in lines[a:b]:
        out.append(line)
        match = ICON_SPSTR.fullmatch(line)
        if match:
            obj = page.obj(match.group(2))
            out += icon_font_lines(match.group(1), obj.name, obj.get('font'))
            obj.set('txt_maxl', max(ICON_MAXL, obj.get('txt_maxl')))
            names.append(obj.name)
    lines[a:b] = out
    # the icon fields grow by 6 x 12 bytes: the oversized buffers give the room back
    shrink_buffers(page)
    return len(names)


def text_obj(template, name, x, y, w, h, font, maxl, xcen=1, ycen=1):
    o = template.copy()
    o.set('objname', name)
    o.geometry(x, y, w, h)
    o.set('font', font)
    o.set('txt', '')
    o.set('txt_maxl', maxl)
    o.set('xcen', xcen)
    o.set('ycen', ycen)
    o.set('pco', 65535)
    o.set('bco', 0)
    o.set_code('down', [])
    o.set_code('up', [])
    return o


# RAM of a page (Nextion: global + page <= 3584 bytes). A text buffer costs ceil((txt_maxl + 1) / 4) * 4 bytes
# (measured on the compiled TFT), so 4k-1 (3, 7, 11, 15, ..., 47, 119) is the cheapest length of its cost.
# The buffers of the screensaver pages, set to what they hold:
#   tId           page name of pageType (longest popupShutter2/screensaver5)
#   tInstruction  first field of a message (longest weatherUpdate)
#   tTmp          numbers, colors, flags, the tap count (the EU hint of m0 no longer uses it, see m0_hint_global)
#   tSend         the longest event (bExit + tap count 42, buttonPress3 + id 7 + count)
#   tTimeAdd      info icon of time~ (one glyph, 3 bytes)
#   tIcon1/2      status icons of screensaver2
#   tNotifyText   notification text, tDate (screensaver5) the date
#   m0            the EU hint draws with xstr, its own txt is never used; tRelay1/2 (screensaver5) show a static '|'
#   entn<N>, tLPId  the id '<page>?<index>' of an indicator, e.g. 29?10
#   f<N>Icon      screensaver5 indicators with font suffix (ICON_MAXL)
# A buffer is lowered to its value, or raised to it when that costs nothing more (10 -> 11, 45 -> 47); a text
# literal the code of the page writes into it keeps its room.
ICON_MAXL = 11
ID_MAXL = 7
BUFFER_MAXL = [
    ('tId', 15), ('tInstruction', 15), ('tTmp', 11), ('tSend', 47), ('tTimeAdd', 7), ('tIcon1', 15), ('tIcon2', 15),
    ('tNotifyText', 119), ('tDate', 39), ('m0', 0), ('tRelay1', 1), ('tRelay2', 1), (r'entn\d+', ID_MAXL),
    ('tLPId', ID_MAXL), (r'f\d+Icon', ICON_MAXL),
]


def text_cost(maxl):
    """RAM of a text buffer"""
    return -(-(maxl + 1) // 4) * 4


LITERAL = re.compile(r'^\s*(\w+)\.txt="([^"]*)"\s*$')


# the EU hint m0 ('change model conf to us-l/p') drew its text from tTmp: the global pageIcons.tTmp1 (80) only
# carries the argument of a popup right before 'page popup..', so m0 takes it and tTmp can be small
M0_TEXT = 'pageIcons.tTmp1.txt'


def m0_hint_global(page):
    """m0 'down' with the global pageIcons.tTmp1 instead of tTmp; returns True when it changed"""
    try:
        m0 = page.obj('m0')
    except KeyError:
        return False
    lines = m0.code('down')
    if not any('tTmp.txt' in line for line in lines):
        return False
    m0.set_code('down', [line.replace('tTmp.txt', M0_TEXT) for line in lines])
    return True


def shrink_buffers(page):
    """sets txt_maxl of the buffers BUFFER_MAXL to what they hold (lower, or higher at the same cost), never below the
    static txt or a text literal the code of the page writes into them; returns {name: (old, new)} of what changed"""
    m0_hint_global(page)
    longest = {}
    for o in page.objs:
        for item in o.items:
            if item[0] == 'code':
                for line in item[2]:
                    match = LITERAL.match(line)
                    if match:
                        size = len(match.group(2).encode('utf-8'))
                        longest[match.group(1)] = max(longest.get(match.group(1), 0), size)
    changed = {}
    for o in page.objs:
        if not o.has('txt_maxl'):
            continue
        rule = next((maxl for pattern, maxl in BUFFER_MAXL if re.fullmatch(pattern, o.name)), None)
        if rule is None:
            continue
        old = o.get('txt_maxl')
        floor = len(o.get('txt').encode('utf-8')) if o.has('txt') else 0
        if o.name in longest:
            floor = max(floor, longest[o.name] + 2)
        new = max(rule, floor)
        if new < old or (new > old and text_cost(new) == text_cost(old)):
            o.set('txt_maxl', new)
            changed[o.name] = (old, new)
    return changed


def txt_sum(page):
    """sum of txt_maxl of the page - the part of its RAM the texts take"""
    return sum(o.get('txt_maxl') for o in page.objs if o.has('txt_maxl') and (o.get('type') != 52 or o.get('sta') == 1))


def var_obj(template, name, maxl):
    o = template.copy()
    o.set('objname', name)
    o.set('txt', '')
    o.set('txt_maxl', maxl)
    return o


def weather_lines(ind):
    out = [ind + 'if(tInstruction.txt=="weatherUpdate"&&tNotifyHead.txt==""&&tNotifyText.txt=="")', ind + '{']
    i = ind + '  '
    for k in range(5):
        s = 1 + 6 * k
        n = k + 1
        out += [
            f'{i}spstr strCommand.txt,e{n}Icon.txt,"~",{s + 2}',
            f'{i}spstr strCommand.txt,tTmp.txt,"~",{s + 3}',
            f'{i}covx tTmp.txt,e{n}Icon.pco,0,0',
            f'{i}spstr strCommand.txt,e{n}Name.txt,"~",{s + 4}',
            f'{i}spstr strCommand.txt,e{n}Val.txt,"~",{s + 5}',
        ]
    for j in range(7):
        s = 31 + 6 * j
        n = j + 1
        out += [
            f'{i}spstr strCommand.txt,entn{n}.txt,"~",{s + 1}',
            f'{i}spstr strCommand.txt,f{n}Icon.txt,"~",{s + 2}',
            *icon_font_lines(i, f'f{n}Icon', 4),
            f'{i}spstr strCommand.txt,tTmp.txt,"~",{s + 3}',
            f'{i}covx tTmp.txt,f{n}Icon.pco,0,0',
        ]
    return out + [ind + '}']


def color_lines(ind, names):
    i = ind + '  '
    out = [ind + 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")', ind + '{',
           f'{i}spstr strCommand.txt,tTmp.txt,"~",1',
           f'{i}covx tTmp.txt,tTime.bco,0,0',
           f'{i}if(tTime.bco!=screensaver5.bco)',
           f'{i}{{',
           f'{i}  screensaver5.bco=tTime.bco']
    out += [f'{i}  {n}.bco=tTime.bco' for n in names]
    out.append(f'{i}}}')
    fields = [(2, 'tTime'), (3, 'tAMPM'), (4, 'tDate'), (16, 'tTimeAdd')]
    fields += [(5 + n, f'e{n}Name') for n in range(1, 5)] + [(9, 'e5Name')]
    fields += [(9 + n, f'e{n}Val') for n in range(1, 5)] + [(13, 'e5Val')]
    for field, name in fields:
        out += [f'{i}spstr strCommand.txt,tTmp.txt,"~",{field}', f'{i}covx tTmp.txt,{name}.pco,0,0']
    return out + [ind + '}']


def status_lines(ind):
    i = ind + '  '
    return [ind + 'if(tInstruction.txt=="statusUpdate")', ind + '{',
            f'{i}spstr strCommand.txt,tTmp.txt,"~",2',
            f'{i}covx tTmp.txt,tRelay1.bco,0,0',
            f'{i}spstr strCommand.txt,tTmp.txt,"~",4',
            f'{i}covx tTmp.txt,tRelay2.bco,0,0',
            ind + '}']


def add_page_switch(lines, page='screensaver5'):
    """adds 'if(tId.txt=="screensaver5") page screensaver5' after the screensaver3 entry"""
    if any(line.strip() == f'if(tId.txt=="{page}")' for line in lines):
        return False
    start = find(lines, 'if(tId.txt=="screensaver3")')
    a, b = block(lines, start)
    new = [line.replace('screensaver3', page) for line in lines[a:b]]
    lines[b:b] = new
    return True


def build_page(page, adv, easy, clock_font):
    src = {o.name: o for o in page.objs}
    text = src['tForecast1']
    var = src['tId']
    objs = [src[n] for n in KEEP]

    # middle row: time and date over the three middle columns
    x0, w = COL, 3 * COL
    # no overlap with the info icon and AM/PM: a redraw of one text object would erase the part it covers
    src['tTime'].geometry(x0 + 24, ROWS[1], w - 48, 80)
    src['tTime'].set('font', clock_font)
    src['tTime'].set('xcen', 1)
    src['tTime'].set('ycen', 1)
    # right of the digits, above the free left edge of f7 - therefore in front of the indicators
    src['tAMPM'].geometry(336, ROWS[1] + 8, 32, 26)
    src['tAMPM'].set('font', 0)
    src['tAMPM'].set('xcen', 0)
    src['tTimeAdd'].geometry(82, ROWS[1] + 30, 32, 36)
    src['tTimeAdd'].set('font', 1)
    src['tTimeAdd'].set('xcen', 1)
    src['tTimeAdd'].set('ycen', 1)
    src['tDate'].geometry(x0, ROWS[1] + 80, w, ROW_H[1] - 80)
    src['tDate'].set('font', 0)
    src['tDate'].set('ycen', 1)
    src['strCommand'].set('txt_maxl', 1800)
    src['tc0'].set_code('up', send_if_text(src['tc0'].code('up')))

    # bottom items like the standard forecast items
    bottom = []
    y = ROWS[2]
    for k in range(5):
        n = k + 1
        bottom += [
            text_obj(text, f'e{n}Name', k * COL, y + 2, COL, 26, 0, 12),
            text_obj(text, f'e{n}Icon', k * COL, y + 29, COL, 36, 1, 4),
            text_obj(text, f'e{n}Val', k * COL, y + 67, COL, 27, 0, 12),
        ]

    # indicators: f1..f5 top row, f6 middle left, f7 middle right; the whole cell is the touch area
    # f6 and f7 keep the centre of their column but leave the room of the info icon and AM/PM
    cells = [(k * COL, ROWS[0], COL, ROW_H[0]) for k in range(5)]
    cells += [(8, ROWS[1], COL - 16, ROW_H[1]), (4 * COL + 8, ROWS[1], COL - 16, ROW_H[1])]
    template = adv.obj('f1Icon')
    indicators, names = [], []
    for j, (x, y, cw, h) in enumerate(cells):
        n = j + 1
        o = text_obj(template, f'f{n}Icon', x, y, cw, h, 4, ICON_MAXL)
        o.set_code('down', indicator_down(n))
        indicators.append(o)
        names.append(var_obj(var, f'entn{n}', ID_MAXL))

    # status icons as color bars: same objects, place and z-order (above the notification) as screensaver3
    bars = [easy.obj('tRelay1').copy(), easy.obj('tRelay2').copy()]

    page.objs = objs + bottom + indicators + [src['tAMPM'], src['tTimeAdd']] + names + [src[n] for n in TOP] + bars
    src['tNotifyHead'].geometry(0, ROWS[2], 450, 50)
    src['tNotifyText'].geometry(0, ROWS[2] + 50, 450, ROW_H[2] - 50)

    # serial handler
    lines = src['tmSerial'].code('timer')
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="statusUpdate")'))
    lines[a:b] = status_lines(lines[a][:len(lines[a]) - len(lines[a].lstrip())])
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="weatherUpdate"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    ind = lines[a][:len(lines[a]) - len(lines[a].lstrip())]
    lines[a:b] = weather_lines(ind)
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    colored = ['tAMPM', 'tTimeAdd', 'tDate'] + [o.name for o in bottom + indicators]
    lines[a:b] = color_lines(ind, colored)
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="time")'))
    lines[a:b] = [x for x in lines[a:b] if x.strip() not in ('ref tIcon1', 'ref tIcon2')]
    add_page_switch(lines)
    src['tmSerial'].set_code('timer', lines)
    shrink_buffers(page)


def fix_pie_rim(ser, tm):
    """All slices end on the same circle: the filled circle (radius vaR-1) stays the fill of the largest slice, which
    gets the line fan of the others on top; the second line of the fan is offset towards the centre (EU: largest
    slice without fan and always x+1, 1-2 px step on the rim). A filled circle with the full radius would show as a
    seam under the other slices. The simulation shows no holes, no overhang and no seam for this layout."""
    i = find(tm, 'if(vaValue.val==0||vaI.val==vaBig.val)')
    tm[i] = tm[i].replace('if(vaValue.val==0||vaI.val==vaBig.val)', 'if(vaValue.val==0)')
    i = find(tm, '// leere bzw. groesste Scheibe (schon als Kreis gezeichnet): keine Linien')
    tm[i] = tm[i].replace('// leere bzw. groesste Scheibe (schon als Kreis gezeichnet): keine Linien', '// leere Scheibe: keine Linien')
    i = find(tm, 'line vaCx.val+1,vaCy.val,sya0+1,sya1,vaColorL.val')
    ind = tm[i][:len(tm[i]) - len(tm[i].lstrip())]
    tm[i:i + 1] = [
        f'{ind}if(sya0>=vaCx.val)',
        f'{ind}{{',
        f'{ind}  line vaCx.val-1,vaCy.val,sya0-1,sya1,vaColorL.val',
        f'{ind}}}else',
        f'{ind}{{',
        f'{ind}  line vaCx.val+1,vaCy.val,sya0+1,sya1,vaColorL.val',
        f'{ind}}}',
    ]


def insert_entry(main_hmi, kind, section, after):
    """main.HMI: 0x60 header, u32@28 entry count, entries of 16 bytes (8 type + 8 file name);
    the order of the .pa entries is the page order (page id), the one of the .zi entries the font id."""
    head = struct.unpack_from('<I', main_hmi, 4)[0]
    count = struct.unpack_from('<I', main_hmi, 28)[0]
    if head + count * 16 != len(main_hmi):
        raise ValueError('unexpected main.HMI layout')
    names = [main_hmi[head + 16 * i + 8:head + 16 * i + 16].split(b'\0')[0].decode() for i in range(count)]
    pos = names.index(after) + 1
    entry = kind.encode().ljust(8, b'\0') + section.encode().ljust(8, b'\0')
    out = bytearray(main_hmi[:head + pos * 16] + entry + main_hmi[head + pos * 16:])
    struct.pack_into('<I', out, 28, count + 1)
    return bytes(out)


def add_clock_font(hmi, main_hmi):
    """returns the new main.HMI, the section {name: (font, template)} and the font id"""
    head = struct.unpack_from('<I', main_hmi, 4)[0]
    count = struct.unpack_from('<I', main_hmi, 28)[0]
    fonts = []
    for i in range(count):
        entry = main_hmi[head + 16 * i:head + 16 * i + 16]
        if entry[:8].split(b'\0')[0] == b'zi':
            fonts.append(entry[8:].split(b'\0')[0].decode())
    font = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'clock96.zi'), 'rb').read()
    n = 0
    while f'{n}.zi' in hmi.files:
        n += 1
    name = f'{n}.zi'
    return insert_entry(main_hmi, 'zi', name, fonts[-1]), {name: (font, fonts[-1])}, len(fonts)


def main(source, target):
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    pages = {n: Page(d) for n, d in hmi.files.items() if n.endswith('.pa')}
    by_name = {p.objs[0].name: n for n, p in pages.items()}
    main_hmi, added, clock_font = add_clock_font(hmi, hmi.files['main.HMI'])
    changes = {'main.HMI': main_hmi}
    if 'screensaver5' not in by_name:
        # new page: a copy of the standard screensaver behind screensaver3, like 'copy page' in the editor
        section = f'{max(int(n[:-3]) for n in pages) + 1}.pa'
        ss4 = Page(hmi.files[by_name['screensaver']])
        ss4.objs[0].set('objname', 'screensaver5')
        ss4.head[0x18:0x28] = b'screensaver5'.ljust(16, b'\0')
        pages[section] = ss4
        by_name['screensaver5'] = section
        after = by_name.get('screensaver4', by_name['screensaver3'])
        changes['main.HMI'] = insert_entry(changes['main.HMI'], 'pa', section, after)
    ss4 = pages[by_name['screensaver5']]
    if not any(o.name == 'tForecast1' for o in ss4.objs):
        raise SystemExit('screensaver5 is not a copy of the standard screensaver (or already converted)')
    build_page(ss4, pages[by_name['screensaver2']], pages[by_name['screensaver3']], clock_font)
    pie = pages[by_name['cardPChart']]
    fix_pie_rim(pie.obj('tmSerial').code('timer'), pie.obj('tm0').code('timer'))

    if by_name['screensaver5'] in hmi.files:
        changes[by_name['screensaver5']] = ss4.bytes()
    else:
        added[by_name['screensaver5']] = (ss4.bytes(), by_name['screensaver'])
    skipped = []
    for name, page in pages.items():
        if page is ss4:
            continue
        changed = False
        for o in page.objs:
            for item in o.items:
                if item[0] == 'code' and any(line.strip() == 'if(tId.txt=="screensaver3")' for line in item[2]):
                    changed |= add_page_switch(item[2])
        if changed:
            changes[name] = page.bytes()
        else:
            skipped.append(page.objs[0].name)
    out = hmi.build(changes, added)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{len(changes)} pages changed, without pageType switch: {", ".join(skipped) or "-"}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
