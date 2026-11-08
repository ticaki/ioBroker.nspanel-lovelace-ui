"""us-l, us-p: the indicators of the page screensaver2 work like the ones of the EU version.

Usage: python3 -I -B HMI/tools/advanced_indicators_us.py <in.HMI> <out.HMI>

The page has f1Icon..f5Icon, but they had no code and no variables with the id of their indicator. Now, as in EU:
  f<N>Icon 'down'  sends event,buttonPress2,<id>,button once and empties tSend
  entn1..entn5     hold the ids, behind the existing objects of the page
  tc0 'up'         only sends a tSend with text
  tmSerial         weatherUpdate writes the ids (parameters 62, 68, 74, 80, 86) into entn<N>

Only screensaver2 changes. The hint m0 ('change model conf to us-l/p') and its 'click m0,1' stay EU only.
The version stays: this belongs to the unpublished 6.0.8.
indicator_long_press.py adds the tap counter and the long press on top (screensaver2 and screensaver5).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from indicator_single_press import TOUCH_TEXT  # noqa: E402
from pagefile import Page  # noqa: E402
from screensaver5 import IF_TEXT, indicator_down, send_if_text, var_obj  # noqa: E402

PAGE = 'screensaver2'
INDICATORS = range(1, 6)
TEMPLATE = 'tId'
NAME_LENGTH = 14


def id_field(n):
    """parameter of weatherUpdate with the id of the indicator n"""
    return 56 + 6 * n


def serial_lines(lines):
    """the code of tmSerial with the lines that write the ids"""
    out = list(lines)
    for n in INDICATORS:
        color = f'covx tTmp.txt,f{n}Icon.pco,0,0'
        hits = [i for i, line in enumerate(out) if line.strip() == color]
        if len(hits) != 1:
            raise SystemExit(f'{PAGE}.tmSerial: {len(hits)} lines "{color}"')
        pos = hits[0]
        if out[pos - 1].strip() != f'spstr strCommand.txt,tTmp.txt,"~",{id_field(n) + 2}':
            raise SystemExit(f'{PAGE}.tmSerial: unexpected field for the color of f{n}Icon: {out[pos - 1].strip()}')
        ind = out[pos][:len(out[pos]) - len(out[pos].lstrip())]
        out[pos + 1:pos + 1] = [
            f'{ind}//f{n}Icon intNameEntity',
            f'{ind}spstr strCommand.txt,entn{n}.txt,"~",{id_field(n)}',
        ]
    return out


def patch_page(page):
    """adds code and objects, leaves everything else of the page as it is"""
    names = [o.name for o in page.objs]
    for n in INDICATORS:
        if f'entn{n}' in names:
            raise SystemExit(f'{PAGE}: entn{n} already exists')
        if page.obj(f'f{n}Icon').code('down'):
            raise SystemExit(f'{PAGE}.f{n}Icon: down already has code')
    tc0 = page.obj('tc0')
    if IF_TEXT in tc0.code('up'):
        raise SystemExit(f'{PAGE}.tc0: up already checks tSend')
    # an empty tSend must not swallow the next touch: tc0 'down' writes it every time, outside of any condition
    if TOUCH_TEXT not in tc0.code('down'):
        raise SystemExit(f'{PAGE}.tc0: down does not write tSend')
    if 'm0' in names:
        raise SystemExit(f'{PAGE}: has the EU hint m0, this is not a us-l/us-p project')

    for n in INDICATORS:
        page.obj(f'f{n}Icon').set_code('down', indicator_down(n))
    tc0.set_code('up', send_if_text(tc0.code('up')))
    serial = page.obj('tmSerial')
    serial.set_code('timer', serial_lines(serial.code('timer')))
    # Page.bytes numbers the objects by their position and writes the count: the new ones follow the highest id
    template = page.obj(TEMPLATE)
    page.objs += [var_obj(template, f'entn{n}', NAME_LENGTH) for n in INDICATORS]


def main(source, target):
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    for name, data in hmi.files.items():
        if name.endswith('.pa'):
            page = Page(data)
            if page.objs[0].name == PAGE:
                section = name
                break
    else:
        raise SystemExit(f'no page {PAGE}')
    before = len(page.objs)
    try:
        patch_page(page)
    except (KeyError, ValueError) as error:
        raise SystemExit(f'{PAGE}: unexpected code: {error}') from error
    out = hmi.build({section: page.bytes()})
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {PAGE} ({section}) {before} -> {len(page.objs)} objects, {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
