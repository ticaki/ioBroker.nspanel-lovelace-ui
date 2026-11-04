"""us-l 6.0.2 -> 6.0.7 + screensaver5. Usage: python3 -I -B build_usl.py [outdir]
Writes nspanel-us-l-v6.0.7.screensaver5.HMI, the repo stays untouched.

us-l has the EU layout moved by 15 px to the right (usable 15..464 instead of 0..449), so the EU pages are taken over
with x+15 for the shared geometry; the payload of screensaver5 stays the one of EU. Armilar's screensaver4 is left out.
"""
import os
import sys
sys.dont_write_bytecode = True
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, '..', '')
TOOLS = HERE
sys.path.insert(0, TOOLS)
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
import screensaver5 as eu_ss5  # noqa: E402
from screensaver5_usp import add_switch, by_name, fix_pie_rim, free_name, geometry_from  # noqa: E402

BASE = REPO + 'us-l/nspanel-us-l-v6.0.2.HMI'
EU = REPO + 'nspanel-v6.0.7.HMI'
OUT = 'nspanel-us-l-v6.0.7.screensaver5.HMI'
RELEASE, GENERATION = '6.0.7', '62'
OFFSET = 15


def port_code(us_page, eu_page):
    """The us-l chart pages have the code of EU 6.0.2 (checked by verify_usl.py), only objects and attributes differ:
    us-l page with the EU 6.0.7 code."""
    page = Page(us_page.bytes())
    for o in page.objs:
        src = eu_page.obj(o.name)
        for item in o.items:
            if item[0] == 'code':
                item[2] = list(src.code(item[1]))
    return page


def port_pie(eu_pie, us_lchart, us_chart):
    """EU page with the frame of the us-l cardLChart (m0 x=23, swipe strip at the right edge; the us-l cardChart keeps
    m0 at x=8, EU value). x0 only exists on the bar chart."""
    page = Page(eu_pie.bytes())
    geometry_from(page, us_lchart)
    page.head = bytearray(us_lchart.head)
    page.head[0x18:0x28] = b'cardPChart'.ljust(16, b'\0')
    src = us_chart.obj('x0')
    for k in ('x', 'y', 'w', 'h', 'endx', 'endy'):
        page.obj('x0').set(k, src.get(k))
    page.obj('tHeading').set('font', us_lchart.obj('tHeading').get('font'))
    fix_pie_rim(page.obj('tmSerial').code('timer'), page.obj('tm0').code('timer'))
    return page


def build_ss5(us_ss, us_ss2, us_ss3, clock_font):
    """The EU generator on the us-l screensaver (which has no m0 strip), then everything except the bars by +15:
    the bars are copied from the us-l screensaver3 and already are in place."""
    page = Page(us_ss.bytes())
    page.objs[0].set('objname', 'screensaver5')
    page.head[0x18:0x28] = b'screensaver5'.ljust(16, b'\0')
    eu_ss5.TOP = ['tNotifyHead', 'tNotifyText']
    eu_ss5.build_page(page, us_ss2, us_ss3, clock_font)
    for o in page.objs:
        if o.has('x') and o.name not in ('screensaver5', 'p0', 'tRelay1', 'tRelay2'):
            o.geometry(o.get('x') + OFFSET, o.get('y'), o.get('w'), o.get('h'))
    return page


def make():
    us = Hmi(open(BASE, 'rb').read())
    us.check()
    eu = Hmi(open(EU, 'rb').read())
    eu.check()
    pages, names = by_name(us)
    eu_pages, eu_names = by_name(eu)
    get = lambda n: pages[names[n]]
    eu_get = lambda n: eu_pages[eu_names[n]]

    # 1. charts
    for n in ('cardChart', 'cardLChart'):
        pages[names[n]] = port_code(get(n), eu_get(n))

    # 2. new page cardPChart behind cardLChart, like EU
    main = us.files['main.HMI']
    pie_section = free_name(us.files, 'pa')
    pie = port_pie(eu_get('cardPChart'), get('cardLChart'), get('cardChart'))
    main = eu_ss5.insert_entry(main, 'pa', pie_section, names['cardLChart'])
    pages[pie_section] = pie
    names['cardPChart'] = pie_section

    # 3. version
    start = get('pageStartup')
    start.obj('tVersion').set('txt', GENERATION)
    start.obj('tRelease').set('txt', RELEASE)

    # 4. clock font as last font, screensaver5 behind screensaver3
    main, added, clock_id = eu_ss5.add_clock_font(us, main)
    font_section = next(iter(added))
    ss_section = free_name({**us.files, pie_section: b''}, 'pa')
    ss = build_ss5(get('screensaver'), get('screensaver2'), get('screensaver3'), clock_id)
    main = eu_ss5.insert_entry(main, 'pa', ss_section, names['screensaver3'])
    pages[ss_section] = ss
    names['screensaver5'] = ss_section
    print('clock font id', clock_id, font_section, 'cardPChart', pie_section, 'screensaver5', ss_section)

    # 5. switches of all pages which have one
    without = []
    for page in pages.values():
        changed = False
        for o in page.objs:
            for item in o.items:
                if item[0] == 'code' and any(x.strip() == 'if(tId.txt=="cardLChart2")' for x in item[2]):
                    changed |= add_switch(item[2], 'cardPChart', 'cardLChart2')
                    changed |= add_switch(item[2], 'screensaver5', 'screensaver3')
        if not changed and page.objs[0].name not in ('cardChart', 'cardLChart', 'pageStartup', 'cardPChart', 'screensaver5'):
            without.append(page.objs[0].name)
    print('without switch:', without)

    # 6. write only what changed
    changes = {}
    for section, page in pages.items():
        if section in us.files and page.bytes()[4:] != us.files[section][4:]:
            changes[section] = page.bytes()
    added[pie_section] = (pie.bytes(), names['cardChart'])
    added[ss_section] = (ss.bytes(), names['screensaver'])
    changes['main.HMI'] = main
    out = us.build(changes, added)
    Hmi(out).check()
    return out, sorted(changes), sorted(added)


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else HERE
    out, changed, added = make()
    open(os.path.join(outdir, OUT), 'wb').write(out)
    print(OUT, len(out), 'changed', len(changed), changed, 'added', added)
