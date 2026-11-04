"""us-p 6.0.2 -> 6.0.7 + screensaver5 (4 columns). Usage: python3 -I -B build_usp.py [outdir]
Writes nspanel-us-p-v6.0.7.ohne-screensaver5.HMI and nspanel-us-p-v6.0.7.HMI, repo stays untouched."""
import os, struct, sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = HERE
sys.path.insert(0, TOOLS)
from hmi import Hmi
from pagefile import Page, block, find
from screensaver5 import SEND, fix_pie_rim, text_obj, var_obj, status_lines, insert_entry

R = os.path.join(HERE, '..', '')
RELEASE, GENERATION = '6.0.7', '62'
GEOM = ('x', 'y', 'w', 'h', 'endx', 'endy')


def by_name(h):
    pages = {n: Page(d) for n, d in h.files.items() if n.endswith('.pa')}
    return pages, {p.objs[0].name: n for n, p in pages.items()}


def free_name(files, ext):
    n = 0
    while f'{n}.{ext}' in files:
        n += 1
    return f'{n}.{ext}'


def add_switch(lines, new, after):
    if any(l.strip() == f'if(tId.txt=="{new}")' for l in lines):
        return False
    a, b = block(lines, find(lines, f'if(tId.txt=="{after}")'))
    lines[b:b] = [l.replace(after, new) for l in lines[a:b]]
    return True


def replace_once(lines, old, new):
    hits = [i for i, l in enumerate(lines) if l == old]
    if len(hits) != 1:
        raise ValueError(f'{old!r}: {len(hits)} hits')
    lines[hits[0]] = new


def replace_range(lines, first, last, new):
    a = find(lines, first)
    b = find(lines, last, a)
    ind = lines[a][:len(lines[a]) - len(lines[a].lstrip())]
    lines[a:b + 1] = [ind + x for x in new]


def geometry_from(page, source):
    src = {o.name: o for o in source.objs}
    for o in page.objs:
        if o.name in src and o.has('x'):
            for k in GEOM:
                o.set(k, src[o.name].get(k))


def port_chart(eu_page, us_page):
    """EU 6.0.7 objects and code, us-p geometry and us-p page head"""
    page = Page(eu_page.bytes())
    geometry_from(page, us_page)
    page.head = bytearray(us_page.head)
    page.obj('t0').geometry(110, 260, 100, 30)   # middle of m0 (10,90,300,370)
    return page


def port_pie(eu_page, us_chart):
    page = Page(eu_page.bytes())
    geometry_from(page, us_chart)                # same frame as the us-p cardChart
    page.obj('cardPChart').geometry(0, 0, 320, 480)
    page.head = bytearray(us_chart.head)
    page.head[0x18:0x28] = b'cardPChart'.ljust(16, b'\0')
    page.obj('t0').geometry(110, 260, 100, 30)
    page.obj('mSwipePrev').geometry(0, 5, 9, 475)
    ser = page.obj('tmSerial').code('timer')
    replace_range(ser, '// ---- Geometrie: Kuchen links, Legende rechts ----', 'vaCy.val=vaCy.val+m0.y', [
        '// ---- Geometrie hochkant: Kuchen oben, Legende darunter (40 px je Eintrag) ----',
        'sya0=vNValues.val*40',
        'vaR.val=m0.h-sya0-16/2',
        'if(vaR.val>100)',
        '{',
        '  vaR.val=100',
        '}',
        'vaCx.val=m0.w/2+m0.x',
        'vaCy.val=m0.y+vaR.val+6',
    ])
    replace_range(ser, 'sys0=vaR.val*2+6', 'fill sya0,m0.y,sys0,m0.h,defaultBcoColor', [
        'fill m0.x,m0.y,m0.w,m0.h,defaultBcoColor',
    ])
    tm = page.obj('tm0').code('timer')
    replace_range(tm, '// Legende, Zeile vaI: Farbquadrat, Name, darunter Wert (links) und Prozent (rechts)', 'sys2=sys2+14', [
        '// Legende unter dem Kuchen, Zeile vaI: Farbquadrat, Name, darunter Wert (links) und Prozent (rechts)',
        'sya0=vaCy.val+vaR.val+6',
        'sys2=m0.y+m0.h-sya0',
        'sya1=vNValues.val*40',
        'sya1=sys2-4-sya1/2',
        'sya0=sya0+sya1',
        'sys1=vaI.val*40',
        'sya0=sya0+sys1',
        'sys2=m0.x+4',
    ])
    fix_pie_rim(ser, tm)
    return page


# ---- screensaver5, 4 columns ----
COL = 80
ROW1 = (0, 128)        # y, h  indicators f1..f4
CLOCK = (128, 80)      # digits at y+16..y+79
DATE = (208, 30)
ROW2 = (238, 128)      # indicators f5..f8
BOTTOM = 368           # e1..e4
BARS = 475
KEEP = ['screensaver5', 'p0', 'tc0', 'tmSerial', 'strCommand', 'tTime', 'tDate', 'tId', 'vaTap', 'tmSleep',
        'tInstruction', 'tTmp', 'tSend', 'tm0', 'xc1', 'yc1', 'xc2', 'yc2', 'ycR', 'xcR', 'strTmp']
N_BOTTOM, N_IND = 4, 8


def weather_lines(ind):
    out = [ind + 'if(tInstruction.txt=="weatherUpdate"&&tNotifyHead.txt==""&&tNotifyText.txt=="")', ind + '{']
    i = ind + '  '
    for k in range(N_BOTTOM):
        s, n = 6 * k, k + 1
        out += [f'{i}spstr strCommand.txt,e{n}Icon.txt,"~",{s + 3}',
                f'{i}spstr strCommand.txt,tTmp.txt,"~",{s + 4}',
                f'{i}covx tTmp.txt,e{n}Icon.pco,0,0',
                f'{i}spstr strCommand.txt,e{n}Name.txt,"~",{s + 5}',
                f'{i}spstr strCommand.txt,e{n}Val.txt,"~",{s + 6}']
    for j in range(N_IND):
        s, n = 6 * j, j + 1
        out += [f'{i}spstr strCommand.txt,entn{n}.txt,"~",{s + 26}',
                f'{i}spstr strCommand.txt,f{n}Icon.txt,"~",{s + 27}',
                f'{i}spstr strCommand.txt,tTmp.txt,"~",{s + 28}',
                f'{i}covx tTmp.txt,f{n}Icon.pco,0,0']
    return out + [ind + '}']


def color_lines(ind, names):
    i = ind + '  '
    out = [ind + 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")', ind + '{',
           f'{i}spstr strCommand.txt,tTmp.txt,"~",1', f'{i}covx tTmp.txt,tTime.bco,0,0',
           f'{i}if(tTime.bco!=screensaver5.bco)', f'{i}{{', f'{i}  screensaver5.bco=tTime.bco']
    out += [f'{i}  {n}.bco=tTime.bco' for n in names]
    out.append(f'{i}}}')
    fields = [(2, 'tTime'), (3, 'tAMPM'), (4, 'tDate'), (16, 'tTimeAdd')]
    fields += [(5 + n, f'e{n}Name') for n in range(1, 5)] + [(9 + n, f'e{n}Val') for n in range(1, 5)]
    for field, name in fields:
        out += [f'{i}spstr strCommand.txt,tTmp.txt,"~",{field}', f'{i}covx tTmp.txt,{name}.pco,0,0']
    return out + [ind + '}']


def build_ss5(us_ss, us_ss2, us_ss3, clock_font):
    page = Page(us_ss.bytes())
    page.objs[0].set('objname', 'screensaver5')
    page.head[0x18:0x28] = b'screensaver5'.ljust(16, b'\0')
    src = {o.name: o for o in page.objs}
    text, var = src['tForecast1'], src['tId']
    objs = [src[n] for n in KEEP]
    # the digits (220 px, centred) get a field that does not overlap tAMPM: a redraw of tTime would erase it
    src['tTime'].geometry(46, CLOCK[0], 228, CLOCK[1])
    src['tTime'].set('font', clock_font)
    src['tTime'].set('xcen', 1)
    src['tTime'].set('ycen', 1)
    src['tAMPM'].geometry(274, CLOCK[0] + 16, 46, 26)
    src['tAMPM'].set('font', 0)
    src['tAMPM'].set('xcen', 0)
    # the info icon left of the digits, centred on them
    src['tTimeAdd'].geometry(14, CLOCK[0] + 30, 32, 36)
    src['tTimeAdd'].set('font', 1)
    src['tTimeAdd'].set('xcen', 1)
    src['tTimeAdd'].set('ycen', 1)
    src['tDate'].geometry(0, DATE[0], 320, DATE[1])
    src['tDate'].set('font', 0)
    src['tDate'].set('ycen', 1)
    src['strCommand'].set('txt_maxl', 1800)
    bottom = []
    for k in range(N_BOTTOM):
        n = k + 1
        bottom += [text_obj(text, f'e{n}Name', k * COL, BOTTOM + 2, COL, 26, 0, 12),
                   text_obj(text, f'e{n}Icon', k * COL, BOTTOM + 29, COL, 36, 1, 4),
                   text_obj(text, f'e{n}Val', k * COL, BOTTOM + 67, COL, 27, 0, 12)]
    template = us_ss2.obj('f1Icon')
    cells = [(k * COL, *ROW1) for k in range(4)] + [(k * COL, *ROW2) for k in range(4)]
    inds, names = [], []
    for j, (x, y, h) in enumerate(cells):
        n = j + 1
        o = text_obj(template, f'f{n}Icon', x, y, COL, h, 4, 4)
        o.set_code('down', [f'tSend.txt="event,buttonPress2,"+entn{n}.txt+",button"'] + SEND)
        inds.append(o)
        names.append(var_obj(var, f'entn{n}', 14))
    bars = [us_ss3.obj('tRelay1').copy(), us_ss3.obj('tRelay2').copy()]
    bars[0].geometry(1, BARS, 130, 5)
    bars[1].geometry(189, BARS, 130, 5)
    src['tNotifyHead'].geometry(0, ROW2[0] + ROW2[1], 320, 50)
    src['tNotifyText'].geometry(0, ROW2[0] + ROW2[1] + 50, 320, BARS - (ROW2[0] + ROW2[1] + 50))
    page.objs = objs + bottom + inds + [src['tAMPM'], src['tTimeAdd']] + names + [src['tNotifyHead'], src['tNotifyText']] + bars
    lines = src['tmSerial'].code('timer')
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="statusUpdate")'))
    lines[a:b] = status_lines(lines[a][:len(lines[a]) - len(lines[a].lstrip())])
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="weatherUpdate"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    ind = lines[a][:len(lines[a]) - len(lines[a].lstrip())]
    lines[a:b] = weather_lines(ind)
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="color"&&tNotifyHead.txt==""&&tNotifyText.txt=="")'))
    lines[a:b] = color_lines(ind, ['tAMPM', 'tTimeAdd', 'tDate'] + [o.name for o in bottom + inds])
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="time")'))
    lines[a:b] = [x for x in lines[a:b] if x.strip() not in ('ref tIcon1', 'ref tIcon2')]
    return page


def make(with_ss5):
    us = Hmi(open(R + 'us-p/nspanel-us-p-v6.0.2.HMI', 'rb').read())
    us.check()
    eu = Hmi(open(R + 'nspanel-v6.0.7.HMI', 'rb').read())
    eu.check()
    pages, names = by_name(us)
    eu_pages, eu_names = by_name(eu)
    get = lambda n: pages[names[n]]
    changes, added = {}, {}

    # 1. charts: EU code, us-p geometry, us-p deviations of the y title and the x labels
    for n in ('cardChart', 'cardLChart'):
        pages[names[n]] = port_chart(eu_pages[eu_names[n]], get(n))
    ser = get('cardLChart').obj('tmSerial').code('timer')
    ind = ' ' * 16
    replace_once(ser, ind + 'xstr m0.x,sys0*-11+m0.y+sya1,24,20,6,defaultFontColor,RED,2,1,3,strTmp.txt',
                 ind + 'xstr m0.x,sys0*-11+m0.y+sya1,26,20,6,defaultFontColor,RED,2,1,3,strTmp.txt')
    ind = ' ' * 22
    replace_once(ser, ind + 'xstr -6*sya0+sys2,vaBottom.val+8,sya0*12,22,0,defaultFontColor,defaultBcoColor,1,1,3,strTmp.txt',
                 ind + 'xstr -6*sya0+sys2,vaBottom.val+6,sya0*12,22,0,defaultFontColor,defaultBcoColor,1,1,3,strTmp.txt')

    # 2. new page cardPChart behind cardLChart, like EU
    main = us.files['main.HMI']
    pie_section = free_name(us.files, 'pa')
    pie = port_pie(eu_pages[eu_names['cardPChart']], get('cardChart'))
    main = insert_entry(main, 'pa', pie_section, names['cardLChart'])
    pages[pie_section] = pie
    names['cardPChart'] = pie_section

    # 3. version
    start = get('pageStartup')
    start.obj('tVersion').set('txt', GENERATION)
    start.obj('tRelease').set('txt', RELEASE)

    # 4. screensaver5
    if with_ss5:
        font = open(os.path.join(TOOLS, 'clock96.zi'), 'rb').read()
        head, count = struct.unpack_from('<I', main, 4)[0], struct.unpack_from('<I', main, 28)[0]
        fonts = [main[head + 16 * i + 8:head + 16 * i + 16].split(b'\0')[0].decode() for i in range(count)
                 if main[head + 16 * i:head + 16 * i + 8].split(b'\0')[0] == b'zi']
        font_section = free_name(us.files, 'zi')
        clock_id = len(fonts)
        main = insert_entry(main, 'zi', font_section, fonts[-1])
        added[font_section] = (font, fonts[-1])
        ss_section = free_name({**us.files, pie_section: b''}, 'pa')
        ss = build_ss5(get('screensaver'), get('screensaver2'), get('screensaver3'), clock_id)
        main = insert_entry(main, 'pa', ss_section, names['screensaver3'])
        pages[ss_section] = ss
        names['screensaver5'] = ss_section
        print('clock font id', clock_id, font_section, 'screensaver5', ss_section)

    # 5. switches of all pages which have one
    without = []
    for section, page in pages.items():
        changed = False
        for o in page.objs:
            for item in o.items:
                if item[0] == 'code' and any(l.strip() == 'if(tId.txt=="cardLChart2")' for l in item[2]):
                    changed |= add_switch(item[2], 'cardPChart', 'cardLChart2')
                    if with_ss5:
                        changed |= add_switch(item[2], 'screensaver5', 'screensaver3')
        if not changed and page.objs[0].name not in ('cardChart', 'cardLChart', 'pageStartup', 'cardPChart', 'screensaver5'):
            without.append(page.objs[0].name)
    print('without switch:', without)

    # 6. write only what changed
    for section, page in pages.items():
        data = page.bytes()
        if section in us.files:
            if data[4:] != us.files[section][4:]:
                changes[section] = data
    added[pie_section] = (pie.bytes(), names['cardChart'])
    if with_ss5:
        added[ss_section] = (pages[ss_section].bytes(), names['screensaver'])
    changes['main.HMI'] = main
    out = us.build(changes, added)
    Hmi(out).check()
    return out, sorted(changes), sorted(added)


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE
    for flag, name in ((False, 'nspanel-us-p-v6.0.7.ohne-screensaver5.HMI'), (True, 'nspanel-us-p-v6.0.7.HMI')):
        out, changed, added = make(flag)
        open(os.path.join(outdir, name), 'wb').write(out)
        print(name, len(out), 'changed', len(changed), 'added', added)
