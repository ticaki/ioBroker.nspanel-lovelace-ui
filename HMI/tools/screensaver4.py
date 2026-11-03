"""Build the grid screensaver 'screensaver4' (EU, 480x320, usable width 450).

Usage: python3 -I HMI/tools/screensaver4.py <in.HMI> <out.HMI>

Without a page 'screensaver4' the script adds one as a copy of the standard 'screensaver' behind
'screensaver3' (main.HMI identical to 'copy page' in the editor); an existing copy is used as is.
The script rebuilds that page and adds 'screensaver4' to the pageType switch of every page.

Layout, 3 rows x 5 columns of 90 x 107 px:
  top     f1..f5   indicators, icon only, a touch sends event,buttonPress2,<id>,button
  middle  f6 | time, AM/PM, date (3 columns) | f7
  bottom  e1..e5   name / icon / value like the forecast items of the standard screensaver

weatherUpdate~<5 bottom slots>~<7 indicator slots>, each slot type~id~icon~color~name~value:
  bottom k (0..4)    fields 1+6k ..  icon 3+6k, color 4+6k, name 5+6k, value 6+6k
  indicator j (0..6) fields 31+6j .. id 32+6j, icon 33+6j, color 34+6j
color~ like the standard screensaver: 1 background, 2 time, 3 AM/PM, 4 date,
  6..9 names of item 1..4, 10..13 values of item 1..4 (item 5 uses 9 and 13)
"""
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402

COL = 90
ROWS = (0, 107, 214)
ROW_H = (107, 107, 106)

KEEP = ['screensaver4', 'p0', 'tc0', 'tmSerial', 'strCommand', 'tTime', 'tDate', 'tAMPM', 'tId', 'vaTap',
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
            f'{i}spstr strCommand.txt,tTmp.txt,"~",{s + 3}',
            f'{i}covx tTmp.txt,f{n}Icon.pco,0,0',
        ]
    return out + [ind + '}']


def color_lines(ind, names):
    i = ind + '  '
    out = [ind + 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")', ind + '{',
           f'{i}spstr strCommand.txt,tTmp.txt,"~",1',
           f'{i}covx tTmp.txt,tTime.bco,0,0',
           f'{i}if(tTime.bco!=screensaver4.bco)',
           f'{i}{{',
           f'{i}  screensaver4.bco=tTime.bco']
    out += [f'{i}  {n}.bco=tTime.bco' for n in names]
    out.append(f'{i}}}')
    fields = [(2, 'tTime'), (3, 'tAMPM'), (4, 'tDate')]
    fields += [(5 + n, f'e{n}Name') for n in range(1, 5)] + [(9, 'e5Name')]
    fields += [(9 + n, f'e{n}Val') for n in range(1, 5)] + [(13, 'e5Val')]
    for field, name in fields:
        out += [f'{i}spstr strCommand.txt,tTmp.txt,"~",{field}', f'{i}covx tTmp.txt,{name}.pco,0,0']
    return out + [ind + '}']


def add_page_switch(lines, page='screensaver4'):
    """adds 'if(tId.txt=="screensaver4") page screensaver4' after the screensaver3 entry"""
    if any(line.strip() == f'if(tId.txt=="{page}")' for line in lines):
        return False
    start = find(lines, 'if(tId.txt=="screensaver3")')
    a, b = block(lines, start)
    new = [line.replace('screensaver3', page) for line in lines[a:b]]
    lines[b:b] = new
    return True


def build_page(page, adv):
    src = {o.name: o for o in page.objs}
    text = src['tForecast1']
    var = src['tId']
    objs = [src[n] for n in KEEP]

    # middle row: time and date over the three middle columns
    x0, w = COL, 3 * COL
    src['tTime'].geometry(x0, ROWS[1], w, 80)
    src['tTime'].set('font', 4)
    src['tTime'].set('xcen', 1)
    src['tTime'].set('ycen', 1)
    src['tAMPM'].geometry(x0 + 215, ROWS[1] + 22, 50, 30)
    src['tAMPM'].set('font', 0)
    src['tAMPM'].set('xcen', 0)
    src['tDate'].geometry(x0, ROWS[1] + 80, w, ROW_H[1] - 80)
    src['tDate'].set('font', 0)
    src['tDate'].set('ycen', 1)
    src['strCommand'].set('txt_maxl', 1800)

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
    cells = [(k * COL, ROWS[0], ROW_H[0]) for k in range(5)] + [(0, ROWS[1], ROW_H[1]), (4 * COL, ROWS[1], ROW_H[1])]
    template = adv.obj('f1Icon')
    indicators, names = [], []
    for j, (x, y, h) in enumerate(cells):
        n = j + 1
        o = text_obj(template, f'f{n}Icon', x, y, COL, h, 4, 4)
        o.set_code('down', [f'tSend.txt="event,buttonPress2,"+entn{n}.txt+",button"'] + SEND)
        indicators.append(o)
        names.append(var_obj(var, f'entn{n}', 14))

    page.objs = objs + bottom + indicators + names + [src[n] for n in TOP]
    src['tNotifyHead'].geometry(0, ROWS[2], 450, 50)
    src['tNotifyText'].geometry(0, ROWS[2] + 50, 450, ROW_H[2] - 50)

    # serial handler
    lines = src['tmSerial'].code('timer')
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="statusUpdate")'))
    del lines[a:b]
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="weatherUpdate"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    ind = lines[a][:len(lines[a]) - len(lines[a].lstrip())]
    lines[a:b] = weather_lines(ind)
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    colored = ['tAMPM', 'tDate'] + [o.name for o in bottom + indicators]
    lines[a:b] = color_lines(ind, colored)
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="time")'))
    lines[a:b] = [x for x in lines[a:b] if 'tTimeAdd' not in x and x.strip() not in ('ref tIcon1', 'ref tIcon2')]
    add_page_switch(lines)
    src['tmSerial'].set_code('timer', lines)


def insert_page(main_hmi, section, after):
    """main.HMI: 0x60 header, u32@28 entry count, entries of 16 bytes (8 type + 8 file name);
    the order of the .pa entries is the page order (page id)."""
    head = struct.unpack_from('<I', main_hmi, 4)[0]
    count = struct.unpack_from('<I', main_hmi, 28)[0]
    if head + count * 16 != len(main_hmi):
        raise ValueError('unexpected main.HMI layout')
    names = [main_hmi[head + 16 * i + 8:head + 16 * i + 16].split(b'\0')[0].decode() for i in range(count)]
    pos = names.index(after) + 1
    entry = b'pa'.ljust(8, b'\0') + section.encode().ljust(8, b'\0')
    out = bytearray(main_hmi[:head + pos * 16] + entry + main_hmi[head + pos * 16:])
    struct.pack_into('<I', out, 28, count + 1)
    return bytes(out)


def main(source, target):
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    pages = {n: Page(d) for n, d in hmi.files.items() if n.endswith('.pa')}
    by_name = {p.objs[0].name: n for n, p in pages.items()}
    added = {}
    changes = {}
    if 'screensaver4' not in by_name:
        # new page: a copy of the standard screensaver behind screensaver3, like 'copy page' in the editor
        section = f'{max(int(n[:-3]) for n in pages) + 1}.pa'
        ss4 = Page(hmi.files[by_name['screensaver']])
        ss4.objs[0].set('objname', 'screensaver4')
        ss4.head[0x18:0x28] = b'screensaver4'.ljust(16, b'\0')
        pages[section] = ss4
        by_name['screensaver4'] = section
        changes['main.HMI'] = insert_page(hmi.files['main.HMI'], section, by_name['screensaver3'])
    ss4 = pages[by_name['screensaver4']]
    if not any(o.name == 'tForecast1' for o in ss4.objs):
        raise SystemExit('screensaver4 is not a copy of the standard screensaver (or already converted)')
    build_page(ss4, pages[by_name['screensaver2']])

    if by_name['screensaver4'] in hmi.files:
        changes[by_name['screensaver4']] = ss4.bytes()
    else:
        added[by_name['screensaver4']] = (ss4.bytes(), by_name['screensaver'])
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
