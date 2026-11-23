"""HMI 6.2.0 (EU): the device pages cardDevice1 'control', cardDevice2 'progress' and cardDevice3 'values'.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/card_device.py <in.HMI> <out.HMI> [--preview <dir>]
Input: a 6.2.0 EU project (480x320) with the pages cardGrid and cardEntities. The output must not exist.
With --preview the script also writes <dir>/hmi-cardDevice{1,2,3}.png: a true-to-scale mock-up drawn from the objects
of each built page with example content (robot vacuum, washing machine, car) and the fonts of the project
(zilib.py); the area under the frame (x >= 450) is hatched.

Each page is a fresh copy of cardGrid: header, arrows, swipe strips, tmSerial (receive, ack/CRC, pageType switch),
sleep timer and the long press of the arrows stay as they are; the six cells of cardGrid and LPState are removed.
An existing cardDevice<n> is rebuilt from cardGrid in its own section, so running the script on its own output gives
the same pages again (idempotent). New pages are appended behind the last page of main.HMI (no page id moves). The
pageType switch of every page with tmSerial gets 'if(tId.txt=="cardDevice<n>") page cardDevice<n>' behind the
cardGrid3 branch (added once).

Protocol:
  pageType~cardDevice<n>
  entityUpd~<heading>~<prev: 6 fields>~<next: 6 fields>~<main>~<slot 1>~..~<slot N>~<info>
  every element has the 6 fields of a cardGrid cell: type~intName~icon~iconColor~displayName~optionalValue
  element e (main 0, slot k = k, info N+1) starts at field 14 + 6e. N and the kind of every slot are fixed per page:
    cardDevice1  N=10 info, info, button x 4, status x 4 (info icon from field 80)
    cardDevice2  N=6  value, progress, info, info, info, button
    cardDevice3  N=8  info x 6, switch, switch
  type 'delete' or empty hides an element completely (main: icon and name; the status line shows field 6 of main
  in any case, empty = empty line).
  main      icon font 4 ('¬<font>' suffix like cardGrid) in iconColor, name below it; optionalValue -> status
            line tStatus at the bottom (font 0, one line, normal text colour). Tap: like a cardGrid cell of its type
            (type text: nothing).
  info      row: icon (font 1, iconColor), name (font 0), value (font 0, right aligned). Tap on icon, name or value:
            like a cardGrid cell of its type, type text sends nothing.
  value     optionalValue in font 4 (Bold 80: digits, ':', '%', '°', ',', '.', letters incl. umlauts; no
            '€'), name below in font 0, optional small icon (font 1) beside it. No tap.
  progress  bar drawn with fill/draw (the project has no progress bar component to copy): outline in the text
            colour, filled part optionalValue (integer 0..100, clamped) percent in iconColor, name above it. No tap.
  button    icon (font 3) with the name below. Tap: exactly a cardGrid cell (popups, event,buttonPress2,<id>,button).
  switch    row: icon (font 1), name, switch btOnOff (copy of cardEntities, state = optionalValue 0/1).
            Tap on the switch: event,buttonPress2,<id>,OnOff,<0|1> like cardEntities.
  status    (cardDevice1 slots 7..10) icon only (font 1, iconColor) in a 2 x 2 block right of the main icon, no
            tap. The cells are text objects with a 1 px border (style 1, colour 14823), neighbours overlap by 1 px so
            the borders form frame and cross; no drawing, nothing to redraw. All four empty/delete: the block is
            hidden and the info rows 1-2 show in full width; else an empty cell keeps its border with an empty
            text, and the info rows switch to a second, narrower set of objects (vis, x/w never change at runtime).
  info      (the last element) small icon bottom right, icon/colour from the payload, hidden for delete/empty;
            tap: event,buttonPress2,<intName>,button.
  Tap code of a cardGrid cell: shutter/shutter2/input_sel/timer open their popup on touch, light/light2/fan/number
  after holding 500 ms (tmLP), the release sends buttonPress2. There is no buttonPress3 on these pages.
  Name and value texts of a tappable element forward their touch to its icon button (click <button>,1 / ,0).

Buffers: ids (entn*) 23 like cardEntities2, names 31, values 31, status 63, icons 10, tSend 63 (longest event
'event,buttonPress2,' + id + ',OnOff,1'), strCommand 1019 (the receive buffer of the display, a longer entityUpd
cannot arrive anyway). RAM per page (9 + 7 per object + text buffers) is printed and must stay <= 3400 with global.
"""
import os
import re
import struct
import sys
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402
from screensaver5 import SEND, insert_entry, text_cost  # noqa: E402
from zilib import Zi, decode  # noqa: E402

SOURCE = 'cardGrid'
SWITCH_SOURCE = 'cardEntities'
PAGES = ('cardDevice1', 'cardDevice2', 'cardDevice3')
SWITCH_AFTER = 'cardGrid3'
FONT_MARK = '¬'
FIRST = 14
FIELDS = 6

ID_LEN = 23
NAME_LEN = 31
VALUE_LEN = 31
STATUS_LEN = 63
ICON_LEN = 10
TYPE_LEN = 10
TSEND_LEN = 63
STR_COMMAND = 1019
RAM_GLOBAL = 436
RAM_LIMIT = 3584
RAM_TARGET = 3400

REMOVE = re.compile(r'(bEntity|tEntity)[1-6]|LPState')

# ---------------------------------------------------------------- layouts
# EU: visible x 0..449, touch of the content x 10..439 (swipe strips), content y 67..287 under the header of cardGrid.
# text = (x, y, w, h, font, xcen); icon = (x, y, w, h, font); bar / switch = (x, y, w, h)
STATUS_Y, STATUS_H = 289, 30
INFO_ICON = (404, 288, 36, 32, 1)


def info_row(x, y, w):
    """one line: icon 36, name, value right aligned (value gets 40 % of the text width)"""
    tw = w - 38
    vw = tw * 2 // 5
    return {'kind': 'info', 'icon': (x, y, 36, 34, 1), 'name': (x + 38, y + 4, tw - vw - 2, 26, 0, 0),
            'value': (x + w - vw, y + 4, vw, 26, 0, 2)}


def info_tile(x, y, w):
    """narrow: icon 34 left, name on top, value right aligned below"""
    return {'kind': 'info', 'icon': (x, y + 2, 34, 48, 1), 'name': (x + 36, y, w - 36, 25, 0, 0),
            'value': (x + 36, y + 26, w - 36, 25, 0, 2)}


def button(x, y, w):
    return {'kind': 'button', 'icon': (x, y, w, 52, 3), 'name': (x, y + 54, w, 26, 0, 1)}


def switch_row(x, y, w):
    return {'kind': 'switch', 'icon': (x, y + 8, 34, 34, 1), 'name': (x + 36, y + 12, w - 36 - 52, 26, 0, 0),
            'switch': (x + w - 50, y, 50, 50)}


def narrow_row(x, y, w):
    """second set of an info row when the status block is shown: value width kept at 110, the name gets shorter;
    the value lies 1 px lower than the wide one (exactly congruent objects make the editor warn 'Component overlap')"""
    return {'icon': (x, y, 36, 34, 1), 'name': (x + 38, y + 4, w - 38 - 112, 26, 0, 0),
            'value': (x + w - 110, y + 5, 110, 26, 0, 2)}


# status block of cardDevice1: 2 x 2 cells with a 1 px border (text style 1); neighbours share their border line
# (1 px overlap), so the borders form the outer frame plus the cross in the middle
# Measured on the zi table: the font 1 icons have their ink in rows 6..28 of the 32 px glyph (median of all 7459
# icons), so the info row icons (box y 76/120, h 34, ycen) show their ink at y 83..105 and 127..149, pitch 44.
# A cell of 45 px (1 px overlap -> pitch 44) at y 71/115 puts the status icons on exactly the same lines as the
# info icons (ink 83..105 / 127..149): one grid row per info row.
STATUS_CELL_W, STATUS_CELL_H = 38, 45
STATUS_X, STATUS_Y0 = 124, 71
GRID_COLOR = 14823  # the grey of the pie lines of cardPChart and of the pressed buttons (bco2)


def status_cell(i):
    x = STATUS_X + (STATUS_CELL_W - 1) * (i % 2)
    y = STATUS_Y0 + (STATUS_CELL_H - 1) * (i // 2)
    return {'kind': 'status', 'icon': (x, y, STATUS_CELL_W, STATUS_CELL_H, 1)}


LAYOUTS = {
    # control: icon top left, two info rows right of it, four buttons, optional 2 x 2 status icons between icon and
    # info rows (the info rows switch to a narrower second set of objects while the block is shown)
    'cardDevice1': {
        'main': (10, 68, 110, 86, 4), 'mainName': (10, 156, 110, 26, 0, 1), 'statusXcen': 0,
        'slots': [info_row(126, 76, 314), info_row(126, 120, 314)] + [button(10 + 108 * k, 190, 104) for k in range(4)]
        + [status_cell(i) for i in range(4)],
        'narrow': {1: narrow_row(204, 76, 236), 2: narrow_row(204, 120, 236)},
    },
    # progress: icon top left, large value beside it, button top right, bar over the full width, three info tiles
    'cardDevice2': {
        'main': (10, 67, 96, 82, 4), 'mainName': (10, 151, 96, 26, 0, 1), 'statusXcen': 1,
        'slots': [
            {'kind': 'value', 'icon': (110, 90, 34, 36, 1), 'value': (146, 67, 190, 82, 4, 0),
             'name': (146, 151, 190, 26, 0, 0)},
            {'kind': 'progress', 'name': (10, 179, 429, 26, 0, 0), 'bar': (10, 207, 429, 14)},
            info_tile(10, 226, 140), info_tile(154, 226, 140), info_tile(298, 226, 140),
            {'kind': 'button', 'icon': (340, 67, 100, 50, 3), 'name': (340, 119, 100, 26, 0, 1)},
        ],
    },
    # values: icon left, 2 x 3 info tiles, two switches
    'cardDevice3': {
        'main': (10, 67, 100, 82, 4), 'mainName': (10, 151, 100, 26, 0, 1), 'statusXcen': 0,
        'slots': [info_tile(114 + 163 * (k % 2), 67 + 52 * (k // 2), 161) for k in range(6)]
        + [switch_row(10, 228, 213), switch_row(226, 228, 213)],
    },
}

TAPPED = ('info', 'button')


def ram(page):
    """estimate (reference-hmi-ram-model): 9 for the page, ~7 per object, plus the text buffers"""
    total = 9 + 7 * (len(page.objs) - 1)
    for o in page.objs:
        if o.has('txt_maxl') and (o.get('type') != 52 or o.get('sta') == 1):
            total += text_cost(o.get('txt_maxl'))
    return total


# ---------------------------------------------------------------- objects

def make_text(template, name, spec, maxl):
    x, y, w, h, font, xcen = spec
    o = template.copy()
    o.set('objname', name)
    o.geometry(x, y, w, h)
    o.set('font', font)
    o.set('txt', '')
    o.set('txt_maxl', maxl)
    o.set('xcen', xcen)
    o.set('ycen', 1)
    o.set('isbr', 0)
    o.set_code('down', [])
    o.set_code('up', [])
    return o


def make_button(template, name, spec):
    x, y, w, h, font = spec
    o = template.copy()
    o.set('objname', name)
    o.geometry(x, y, w, h)
    o.set('font', font)
    o.set('txt', '')
    o.set('txt_maxl', ICON_LEN)
    o.set('xcen', 1)
    o.set('ycen', 1)
    return o


def make_var(template, name, maxl):
    o = template.copy()
    o.set('objname', name)
    o.set('txt', '')
    o.set('txt_maxl', maxl)
    return o


def forward(o, button_name):
    o.set_code('down', [f'click {button_name},1'])
    o.set_code('up', [f'click {button_name},0'])


def send_lines(entn):
    return [f'tSend.txt="event,buttonPress2,"+{entn}.txt+",button"'] + SEND


def cell_down(down1, typ, entn, name, button_name):
    """the down code of cardGrid bEntity1 with other names"""
    rename = {'type1': typ, 'entn1': entn, 'tEntity1': name, 'bEntity1': button_name}
    pattern = re.compile(r'\b(type1|entn1|tEntity1|bEntity1)\b')
    return [pattern.sub(lambda m: rename[m.group(1)], x) for x in down1]


def up_unless_text(typ, entn):
    return ['tmLP.en=0', '// type text sends nothing (card_device.py)', f'if({typ}.txt!="text")', '{'] \
        + ['  ' + x for x in send_lines(entn)] + ['}']


def slot_names(k, kind):
    """display objects of slot k (the ones hidden for delete) and the icon object"""
    if kind == 'status':
        return f'tStat{k}', [f'tStat{k}']
    icon = f'bEntity{k}' if kind in TAPPED else f'tIcon{k}'
    names = {'info': [icon, f'tEntity{k}', f'tValue{k}'], 'value': [icon, f'tEntity{k}', f'tValue{k}'],
             'progress': [f'tEntity{k}'], 'button': [icon, f'tEntity{k}'],
             'switch': [icon, f'tEntity{k}', f'btOnOff{k}']}[kind]
    return icon, names


def narrow_names(k):
    """the second, narrower set of info row k (status block shown)"""
    return [f'bEntityS{k}', f'tEntityS{k}', f'tValueS{k}']


def status_slots(layout):
    return [k for k, s in enumerate(layout['slots'], 1) if s['kind'] == 'status']


def tapped_row(button_t, text_t, down1, k, names, spec):
    """icon button, name and value of a tappable info row; the type/id are those of slot k"""
    icon, name_n, value_n = names
    b = make_button(button_t, icon, spec['icon'])
    b.set_code('down', cell_down(down1, f'type{k}', f'entn{k}', name_n, icon))
    b.set_code('up', up_unless_text(f'type{k}', f'entn{k}'))
    name = make_text(text_t, name_n, spec['name'], NAME_LEN)
    value = make_text(text_t, value_n, spec['value'], VALUE_LEN)
    forward(name, icon)
    forward(value, icon)
    return [b, name, value]


def build_objects(page, layout, switch_template):
    src = {o.name: o for o in page.objs}
    down1 = src['bEntity1'].code('down')
    if down1[0] != 'tmLP.en=1' or not any('page popupShutter' in x for x in down1):
        raise SystemExit(f'{SOURCE}.bEntity1: unexpected down code')
    text_t, button_t, var_t = src['tEntity1'], src['bEntity1'], src['type1']
    if 'narrow' in layout:
        narrow = []
        for k, spec in layout['narrow'].items():
            if layout['slots'][k - 1]['kind'] != 'info':
                raise SystemExit(f'narrow set for slot {k}, which is no info row')
            narrow += tapped_row(button_t, text_t, down1, k, narrow_names(k), spec)

    main = make_button(button_t, 'bMain', layout['main'])
    main.set_code('down', cell_down(down1, 'typeMain', 'entnMain', 'tMainName', 'bMain'))
    main.set_code('up', up_unless_text('typeMain', 'entnMain'))
    main_name = make_text(text_t, 'tMainName', layout['mainName'], NAME_LEN)
    forward(main_name, 'bMain')
    visible = [main, main_name]
    variables = [make_var(var_t, 'typeMain', TYPE_LEN), make_var(var_t, 'entnMain', ID_LEN)]
    for k, spec in enumerate(layout['slots'], 1):
        kind = spec['kind']
        icon, _ = slot_names(k, kind)
        if kind == 'status':
            x, y, w, h, font = spec['icon']
            cell = make_text(text_t, icon, (x, y, w, h, font, 1), ICON_LEN)
            cell.set('style', 1)  # border, as the icons of cardPower
            cell.set('borderw', 1)
            cell.set('borderc', GRID_COLOR)
            visible.append(cell)
            continue
        if kind in TAPPED:
            b = make_button(button_t, icon, spec['icon'])
            b.set_code('down', cell_down(down1, f'type{k}', f'entn{k}', f'tEntity{k}', icon))
            b.set_code('up', up_unless_text(f'type{k}', f'entn{k}') if kind == 'info'
                       else ['tmLP.en=0'] + send_lines(f'entn{k}'))
            visible.append(b)
        elif kind in ('value', 'switch'):
            x, y, w, h, font = spec['icon']
            visible.append(make_text(text_t, icon, (x, y, w, h, font, 1), ICON_LEN))
        name = make_text(text_t, f'tEntity{k}', spec['name'], NAME_LEN)
        visible.append(name)
        if 'value' in spec:
            visible.append(make_text(text_t, f'tValue{k}', spec['value'], VALUE_LEN))
        if kind in TAPPED:
            forward(name, icon)
            if 'value' in spec:
                forward(visible[-1], icon)
        if kind == 'switch':
            sw = switch_template.copy()
            sw.set('objname', f'btOnOff{k}')
            sw.geometry(*spec['switch'])
            sw.set('txt_maxl', 3)
            sw.set_code('down', [x.replace('btOnOff1', f'btOnOff{k}').replace('entn1', f'entn{k}')
                                 for x in switch_template.code('down')])
            visible.append(sw)
        if f'type{k}' not in src:
            variables += [make_var(var_t, f'type{k}', TYPE_LEN), make_var(var_t, f'entn{k}', ID_LEN)]
    visible.append(make_text(text_t, 'tStatus', (10, STATUS_Y, 390, STATUS_H, 0, layout['statusXcen']), STATUS_LEN))
    info = make_button(button_t, 'bInfo', INFO_ICON)
    info.set_code('down', [])
    info.set_code('up', send_lines('entnInfo'))
    visible.append(info)
    variables.append(make_var(var_t, 'entnInfo', ID_LEN))
    if 'narrow' in layout:
        visible += narrow
    if status_slots(layout):
        # number variable (like vLPNavState): 1 while at least one status icon is set
        flag = src['vLPNavState'].copy()
        flag.set('objname', 'vStatus')
        variables.append(flag)

    keep = [o for o in page.objs if not REMOVE.fullmatch(o.name)]
    at = keep.index(src['tc0']) + 1  # the cells of cardGrid start behind tc0, the swipe strips stay on top
    page.objs = keep[:at] + visible + variables + keep[at:]
    slots = len(layout['slots'])
    for o in page.objs:
        m = re.fullmatch(r'(type|entn)(\d+)', o.name)
        if m and int(m.group(2)) > slots:
            raise SystemExit(f'{o.name}: more slots in cardGrid than on the page')
        if o.name.startswith('entn'):
            o.set('txt_maxl', ID_LEN)
    page.obj('tSend').set('txt_maxl', TSEND_LEN)
    page.obj('strCommand').set('txt_maxl', STR_COMMAND)


# ---------------------------------------------------------------- code

def icon_lines(ind, field, obj, font):
    """icon into obj, '<icon>¬<font>' sets that font (the code of cardGrid), else the default font; colour"""
    return [
        f'{ind}spstr strCommand.txt,{obj}.txt,"~",{field}',
        f'{ind}strlen {obj}.txt,sys0',
        f'{ind}substr {obj}.txt,tTmp.txt,sys0-2,1',
        f'{ind}{obj}.font={font}',
        f'{ind}if(tTmp.txt=="{FONT_MARK}")',
        f'{ind}{{',
        f'{ind}  substr {obj}.txt,tTmp.txt,sys0-1,1',
        f'{ind}  covx tTmp.txt,sys1,0,0',
        f'{ind}  {obj}.font=sys1',
        f'{ind}  substr {obj}.txt,{obj}.txt,0,sys0-2',
        f'{ind}}}',
        f'{ind}spstr strCommand.txt,tTmp.txt,"~",{field + 1}',
        f'{ind}covx tTmp.txt,sys0,0,0',
        f'{ind}{obj}.pco=sys0',
    ]


def bar_lines(ind, field, bar, hidden):
    """progress bar: outline in the text colour, inside the page colour, filled part in iconColor"""
    x, y, w, h = bar
    inner = w - 2
    if hidden:
        return [f'{ind}fill {x},{y},{w},{h},defaultBcoColor']
    return [
        f'{ind}spstr strCommand.txt,tTmp.txt,"~",{field + 5}',
        f'{ind}covx tTmp.txt,sys0,0,0',
        f'{ind}if(sys0>100)',
        f'{ind}{{',
        f'{ind}  sys0=100',
        f'{ind}}}',
        f'{ind}if(sys0<0)',
        f'{ind}{{',
        f'{ind}  sys0=0',
        f'{ind}}}',
        f'{ind}sys1=sys0*{inner}/100',
        f'{ind}spstr strCommand.txt,tTmp.txt,"~",{field + 3}',
        f'{ind}covx tTmp.txt,sys2,0,0',
        f'{ind}draw {x},{y},{x + w - 1},{y + h - 1},defaultFontColor',
        f'{ind}fill {x + 1},{y + 1},{inner},{h - 2},defaultBcoColor',
        f'{ind}if(sys1>0)',
        f'{ind}{{',
        f'{ind}  fill {x + 1},{y + 1},sys1,{h - 2},sys2',
        f'{ind}}}',
    ]


def status_lines(ind, layout):
    """status icons first (their fields lie behind the info rows): an empty slot keeps its cell (and border) with
    an empty text, vStatus=1 when at least one is set; the block is shown only then"""
    i = ind + '  '
    cells = status_slots(layout)
    out = [f'{ind}// status icons (slots {cells[0]}..{cells[-1]}): vStatus=1 when one is set', f'{ind}vStatus.val=0']
    for k in cells:
        first = FIRST + FIELDS * k
        out += [f'{ind}spstr strCommand.txt,tTmp.txt,"~",{first}',
                f'{ind}if(tTmp.txt=="delete"||tTmp.txt=="")',
                f'{ind}{{',
                f'{i}tStat{k}.txt=""',
                f'{ind}}}else',
                f'{ind}{{']
        out += icon_lines(i, first + 2, f'tStat{k}', layout['slots'][k - 1]['icon'][4])
        out += [f'{i}vStatus.val=1', f'{ind}}}']
    out += [f'{ind}if(vStatus.val==0)', f'{ind}{{'] + [f'{i}vis tStat{k},0' for k in cells]
    out += [f'{ind}}}else', f'{ind}{{'] + [f'{i}vis tStat{k},1' for k in cells] + [f'{ind}}}']
    return out


def narrow_show(k):
    """info row k with a narrow twin: copy the texts, then show the set that fits the status block"""
    wide = [f'bEntity{k}', f'tEntity{k}', f'tValue{k}']
    narrow = narrow_names(k)
    out = [f'{narrow[0]}.font={wide[0]}.font', f'{narrow[0]}.pco={wide[0]}.pco']
    out += [f'{n}.txt={w}.txt' for n, w in zip(narrow, wide)]
    out += ['if(vStatus.val==0)', '{'] + [f'  vis {n},0' for n in narrow] + [f'  vis {w},1' for w in wide]
    out += ['}else', '{'] + [f'  vis {w},0' for w in wide] + [f'  vis {n},1' for n in narrow] + ['}']
    return out


def element_lines(ind, first, typ, entn, hide, body, hidden_extra=(), show=None):
    """show: the lines that make the element visible (default: vis 1 for everything in hide)"""
    i = ind + '  '
    out = [f'{ind}spstr strCommand.txt,{typ}.txt,"~",{first}',
           f'{ind}spstr strCommand.txt,{entn}.txt,"~",{first + 1}',
           f'{ind}if({typ}.txt=="delete"||{typ}.txt=="")',
           f'{ind}{{']
    out += [f'{i}vis {n},0' for n in hide] + [i + x for x in hidden_extra]
    out += [f'{ind}}}else', f'{ind}{{']
    out += [i + x for x in body]
    out += [i + x for x in show] if show is not None else [f'{i}vis {n},1' for n in hide]
    return out + [f'{ind}}}']


def slot_body(k, spec, first):
    kind = spec['kind']
    icon, _ = slot_names(k, kind)
    out = []
    if 'icon' in spec:
        out += icon_lines('', first + 2, icon, spec['icon'][4])
    out.append(f'spstr strCommand.txt,tEntity{k}.txt,"~",{first + 4}')
    if 'value' in spec:
        out.append(f'spstr strCommand.txt,tValue{k}.txt,"~",{first + 5}')
    if kind == 'progress':
        out += bar_lines('', first, spec['bar'], False)
    if kind == 'switch':
        out += [f'spstr strCommand.txt,tTmp.txt,"~",{first + 5}', 'covx tTmp.txt,sys0,0,0', f'btOnOff{k}.val=sys0']
    return out


def parser_lines(ind, layout):
    slots = layout['slots']
    info_first = FIRST + FIELDS * (len(slots) + 1)
    kinds = ','.join(s['kind'] for s in slots)
    out = [f'{ind}// device page (card_device.py): element e (main 0, slots 1..{len(slots)}, info {len(slots) + 1}) '
           f'starts at field {FIRST}+6e; slots: {kinds}',
           f'{ind}// status line = optionalValue of main, also when main is hidden',
           f'{ind}spstr strCommand.txt,tStatus.txt,"~",{FIRST + 5}']
    if status_slots(layout):
        out += status_lines(ind, layout)
    body = icon_lines('', FIRST + 2, 'bMain', layout['main'][4])
    body.append(f'spstr strCommand.txt,tMainName.txt,"~",{FIRST + 4}')
    out += element_lines(ind, FIRST, 'typeMain', 'entnMain', ['bMain', 'tMainName'], body)
    narrow = layout.get('narrow', {})
    for k, spec in enumerate(slots, 1):
        if spec['kind'] == 'status':
            continue
        first = FIRST + FIELDS * k
        _, hide = slot_names(k, spec['kind'])
        extra = bar_lines('', first, spec['bar'], True) if spec['kind'] == 'progress' else ()
        show = narrow_show(k) if k in narrow else None
        if k in narrow:
            hide = hide + narrow_names(k)
        out.append(f'{ind}// slot {k}: {spec["kind"]}' + (' (wide and narrow set)' if k in narrow else ''))
        out += element_lines(ind, first, f'type{k}', f'entn{k}', hide, slot_body(k, spec, first), extra, show)
    i = ind + '  '
    out += [f'{ind}// info icon',
            f'{ind}spstr strCommand.txt,tTmp.txt,"~",{info_first}',
            f'{ind}if(tTmp.txt=="delete"||tTmp.txt=="")',
            f'{ind}{{',
            f'{i}vis bInfo,0',
            f'{ind}}}else',
            f'{ind}{{',
            f'{i}spstr strCommand.txt,entnInfo.txt,"~",{info_first + 1}']
    out += icon_lines(i, info_first + 2, 'bInfo', INFO_ICON[4])
    out += [f'{i}vis bInfo,1', f'{ind}}}']
    return out


def patch_parser(page, layout):
    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    start = find(lines, f'spstr strCommand.txt,type1.txt,"~",{FIRST}')
    if lines[start - 1].strip() != '// get Type':
        raise SystemExit('tmSerial: no "// get Type" in front of the first cell')
    end = block(lines, find(lines, 'if(type6.txt=="delete"||type6.txt=="")', start))[1]
    if lines[end].strip() != '}' or lines[end + 1].strip() != 'if(tInstruction.txt=="pageType")':
        raise SystemExit('tmSerial: the cells are not the end of the entityUpd block')
    ind = lines[start][:len(lines[start]) - len(lines[start].lstrip())]
    lines[start - 1:end] = parser_lines(ind, layout)
    for n, line in enumerate(lines):
        if 'command format: entityUpd' in line:
            lines[n] = (line[:len(line) - len(line.lstrip())] + '// command format: entityUpd,heading,navigation,'
                        'main,slot 1..N,info, each [type,internalName,iconId,iconColor,displayName,optionalValue]')
    serial.set_code('timer', lines)


def patch_load(page, name, layout):
    load = page.obj(name).code('load')
    i = find(load, 'vis tEntity6,0')
    j = find(load, 'vis bEntity1,0')
    if i < j:
        raise SystemExit(f'{name}.load: unexpected vis lines')
    hide = ['bMain', 'tMainName', 'bInfo']
    for k, spec in enumerate(layout['slots'], 1):
        hide += slot_names(k, spec['kind'])[1]
    for k in layout.get('narrow', {}):
        hide += narrow_names(k)
    load[j:i + 1] = [f'vis {n},0' for n in hide]
    loops = [n for n, x in enumerate(load) if re.fullmatch(r'for\(sys0=0;sys0<\d+;sys0\+\+\)', x.strip())]
    if len(loops) != 1:
        raise SystemExit(f'{name}.load: {len(loops)} loops over b[]')
    last = max(n for n, o in enumerate(page.objs) if o.get('type') in (98, 116, 53)) + 1
    load[loops[0]] = re.sub(r'<\d+;', f'<{last};', load[loops[0]])
    if any(s['kind'] == 'switch' for s in layout['slots']):
        # the switch pictures for a black background, as on cardEntities
        a, b = block(load, loops[0])
        if load[b - 1].strip() != '}':
            raise SystemExit(f'{name}.load: unexpected loop')
        ind = load[b - 2][:len(load[b - 2]) - len(load[b - 2].lstrip())]
        load[b - 1:b - 1] = [f'{ind}if(b[sys0].type==53&&defaultBcoColor==0)', f'{ind}{{',
                             f'{ind}  b[sys0].pic=10', f'{ind}  b[sys0].pic2=11', f'{ind}}}']
    page.obj(name).set_code('load', load)


def patch_long_press(page):
    """tmLP: the popups of light/light2/fan/number stay, the switch to buttonPress3 goes"""
    tm = page.obj('tmLP')
    lines = tm.code('timer')
    if lines[-1].strip() != 'LPState.val=1':
        raise SystemExit('tmLP: unexpected timer code')
    tm.set_code('timer', lines[:-1])


def fix_page_name(page, name):
    old = re.compile(rf'\b{SOURCE}\b')
    for o in page.objs:
        if o.name == 'tmSerial':
            continue
        for item in o.items:
            if item[0] == 'code':
                item[2] = [old.sub(name, x) for x in item[2]]


def check_names(page):
    """every object that code names exists (catches leftovers of removed objects)"""
    names = {o.name for o in page.objs}
    missing = set()
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind != 'code':
                continue
            for line in lines:
                code = re.sub(r'"[^"]*"', '""', line).split('//')[0]
                for m in re.finditer(r'(?<![\w.\[\]])([A-Za-z]\w*)\.(txt|val|pco|bco|font|en|tim|pco2|pic|pic2)\b',
                                     code):
                    if m.group(1) not in names and m.group(1) != 'pageIcons':
                        missing.add(f'{o.name}.{event}: {m.group(1)}')
                for m in re.finditer(r'\b(?:vis|click|tsw)\s+(\w+),', code):
                    if m.group(1) not in names:
                        missing.add(f'{o.name}.{event}: {m.group(1)}')
    if missing:
        raise SystemExit('unknown objects in code: ' + ', '.join(sorted(missing)))


def build_page(source_bytes, name, switch_template):
    page = Page(source_bytes)
    page.objs[0].set('objname', name)
    page.head[0x18:0x28] = name.encode('latin1').ljust(16, b'\0')
    layout = LAYOUTS[name]
    fix_page_name(page, name)
    build_objects(page, layout, switch_template)
    patch_parser(page, layout)
    patch_load(page, name, layout)
    patch_long_press(page)
    check_names(page)
    return page


# ---------------------------------------------------------------- pageType switch

def add_page_switch(lines, name):
    if any(x.strip() == f'if(tId.txt=="{name}")' for x in lines):
        return 0
    anchor = SWITCH_AFTER
    for prev in PAGES[:PAGES.index(name)][::-1]:
        if any(x.strip() == f'if(tId.txt=="{prev}")' for x in lines):
            anchor = prev
            break
    a, b = block(lines, find(lines, f'if(tId.txt=="{anchor}")'))
    body = lines[a:b]
    if [x.strip() for x in body] != [f'if(tId.txt=="{anchor}")', '{', f'page {anchor}', '}']:
        raise SystemExit(f'unexpected {anchor} branch: {body}')
    lines[b:b] = [x.replace(anchor, name) for x in body]
    return 1


def switch_pages(pages):
    changed, without = [], []
    for pname, page in pages.items():
        if not any(o.name == 'tmSerial' for o in page.objs):
            continue
        n, has = 0, False
        for o in page.objs:
            for item in o.items:
                if item[0] == 'code' and any(x.strip() == f'if(tId.txt=="{SWITCH_AFTER}")' for x in item[2]):
                    has = True
                    for name in PAGES:
                        n += add_page_switch(item[2], name)
        if n:
            changed.append(pname)
        if not has:
            without.append(pname)
    return changed, without


def main_entries(main_hmi, kind):
    head = struct.unpack_from('<I', main_hmi, 4)[0]
    count = struct.unpack_from('<I', main_hmi, 28)[0]
    out = []
    for i in range(count):
        e = main_hmi[head + 16 * i:head + 16 * i + 16]
        if e[:8].split(b'\0')[0] == kind.encode():
            out.append(e[8:].split(b'\0')[0].decode())
    return out


def main(source, target, preview=None):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    pages, sections = {}, {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            pages[page.objs[0].name] = page
            sections[page.objs[0].name] = section
    for need in (SOURCE, SWITCH_SOURCE):
        if need not in pages:
            raise SystemExit(f'no page {need}')
    switch_template = pages[SWITCH_SOURCE].obj('btOnOff1')
    if switch_template.get('type') != 53:
        raise SystemExit(f'{SWITCH_SOURCE}.btOnOff1 is not a dual state button')
    source_bytes = hmi.files[sections[SOURCE]]
    changes, added = {}, {}
    main_hmi = hmi.files['main.HMI']
    numbers = [int(s[:-3]) for s in sections.values()]
    for name in PAGES:
        page = build_page(source_bytes, name, switch_template)
        if name in sections:
            print(f'{name}: rebuilt in {sections[name]}')
        else:
            numbers.append(max(numbers) + 1)
            section = f'{numbers[-1]}.pa'
            main_hmi = insert_entry(main_hmi, 'pa', section, main_entries(main_hmi, 'pa')[-1])
            sections[name] = section
            print(f'{name}: new section {section}, appended to the page list of main.HMI')
        pages[name] = page
        r = ram(page)
        kinds = ', '.join(s['kind'] for s in LAYOUTS[name]['slots'])
        print(f'{name}: N={len(LAYOUTS[name]["slots"])} ({kinds}), {len(page.objs)} objects, '
              f'RAM (estimate) page {r}, with global {RAM_GLOBAL + r} of {RAM_LIMIT}')
        if RAM_GLOBAL + r > RAM_TARGET:
            raise SystemExit(f'{name}: RAM {RAM_GLOBAL + r} > {RAM_TARGET}')
    if main_hmi != hmi.files['main.HMI']:
        changes['main.HMI'] = main_hmi

    switched, without = switch_pages(pages)
    print(f'pageType branches added on {len(switched)} pages: {", ".join(sorted(switched)) or "-"}')
    print(f'pages with tmSerial without {SWITCH_AFTER} branch: {", ".join(sorted(without)) or "-"}')
    for name, page in pages.items():
        if name in PAGES or name in switched:
            data = page.bytes()
            Page(data)  # round trip
            if sections[name] in hmi.files:
                changes[sections[name]] = data
            else:
                added[sections[name]] = (data, sections[SOURCE])

    out = hmi.build(changes, added)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'changed sections: {len(changes)}, new: {", ".join(sorted(added)) or "-"}')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')
    if preview:
        render_all(Hmi(out), preview)


# ---------------------------------------------------------------- preview (PNG mock-up)

def rgb565(c):
    r, g, b = c >> 11 & 31, c >> 5 & 63, c & 31
    return (r * 255 // 31, g * 255 // 63, b * 255 // 31)


def color565(r, g, b):
    return (r >> 3) << 11 | (g >> 2) << 5 | b >> 3


BG, FG = 6371, 65535

EXAMPLES = {
    'cardDevice1': {
        'heading': 'Saugroboter', 'main': ('robot-vacuum', color565(0, 200, 255), 'Robbi'),
        'status': 'Reinigt Wohnzimmer, noch 12 min (Wischen)',
        'slots': [('battery-80', color565(0, 220, 0), 'Akku', '80 %'),
                  ('map-marker', FG, 'Fläche', '34 m²'),
                  ('play', color565(0, 220, 0), 'Start', ''), ('pause', FG, 'Pause', ''),
                  ('home-import-outline', FG, 'Dock', ''), ('map-marker', FG, 'Suchen', ''),
                  ('wifi', color565(0, 220, 0), '', ''), ('trash-can', color565(255, 160, 0), '', ''),
                  ('air-filter', FG, '', ''), ('alert', color565(255, 40, 40), '', '')],
    },
    'cardDevice2': {
        'heading': 'Waschküche', 'main': ('washing-machine', color565(0, 160, 255), 'Waschm.'),
        'status': 'Schleudern, noch 23 min - Fertig um 14:35',
        'slots': [('timer-outline', FG, 'Restzeit', '1:23'),
                  (None, color565(0, 160, 255), 'Fortschritt 62 %', '62'),
                  ('washing-machine', FG, 'Programm', 'Baumwolle'), ('thermometer', color565(255, 140, 0),
                                                                     'Temperatur', '60 °C'),
                  ('fan', FG, 'Drehzahl', '1400'), ('pause', FG, 'Pause', '')],
    },
    'cardDevice3': {
        'heading': 'Auto', 'main': ('car', color565(255, 255, 255), 'ID.3'),
        'status': 'Lädt an Wallbox, 11 kW - voll um 17:40',
        'slots': [('battery-80', color565(0, 220, 0), 'Akku', '78 %'), ('map-marker', FG, 'Reichw.', '312 km'),
                  ('thermometer', FG, 'Innen', '21,5 °C'), ('lock', color565(0, 220, 0), 'Türen', 'zu'),
                  ('flash', color565(255, 220, 0), 'Laden', '11 kW'), ('gas-station', FG, 'km-Stand', '23.456'),
                  ('fan', FG, 'Klima', '1'), ('flash', color565(255, 220, 0), 'Laden', '1')],
    },
}


def icon_codes():
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'src', 'lib', 'const',
                        'icon_mapping.ts')
    out = {}
    for m in re.finditer(r"\['([\w-]+)', '(.)'\]", open(path, encoding='utf-8').read()):
        out[m.group(1)] = m.group(2)
    return out


class Canvas:
    def __init__(self, w, h, bg):
        self.w, self.h = w, h
        self.px = [list(bg) for _ in range(w * h)]

    def fill(self, x, y, w, h, c):
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                self.px[yy * self.w + xx] = list(c)

    def text(self, fonts, rect, font, s, color, xcen, ycen=1):
        x, y, w, h = rect
        z = fonts[font]
        chars = [z.chars[ord(ch)] for ch in s if ord(ch) in z.chars]
        tw = sum(c[0] + c[1] + c[2] for c in chars)
        px = x + (0 if xcen == 0 else (w - tw) // 2 if xcen == 1 else w - tw)
        py = y + ((h - z.h) // 2 if ycen else 0)
        for cw, left, right, g in chars:
            bw = cw + left + right
            alpha = decode(g, bw * z.h)
            for j in range(z.h):
                for i in range(bw):
                    a = alpha[j * bw + i]
                    xx, yy = px + i, py + j
                    if a and x <= xx < x + w and y <= yy < y + h and 0 <= xx < self.w and 0 <= yy < self.h:
                        p = self.px[yy * self.w + xx]
                        self.px[yy * self.w + xx] = [(p[k] * (7 - a) + color[k] * a) // 7 for k in range(3)]
            px += bw

    def png(self, path):
        raw = b''.join(b'\0' + bytes(v for p in self.px[r * self.w:(r + 1) * self.w] for v in p)
                       for r in range(self.h))

        def chunk(t, d):
            return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xFFFFFFFF)
        data = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', self.w, self.h, 8, 2, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))
        open(path, 'wb').write(data)


def render_page(page, name, fonts, icons, plain=False):
    """plain: the status slots empty (the page without status block)"""
    ex = EXAMPLES[name]
    layout = LAYOUTS[name]
    if plain:
        ex = dict(ex, slots=[(None, FG, '', '') if s['kind'] == 'status' else e
                             for s, e in zip(layout['slots'], ex['slots'])])
    status_on = any(e[0] for s, e in zip(layout['slots'], ex['slots']) if s['kind'] == 'status')
    bg, fg = rgb565(BG), rgb565(FG)
    cv = Canvas(480, 320, bg)
    objs = {o.name: o for o in page.objs}

    def rect(n):
        o = objs[n]
        return (o.get('x'), o.get('y'), o.get('w'), o.get('h'))

    def put(n, s, color=fg):
        o = objs[n]
        cv.text(fonts, rect(n), o.get('font'), s, color, o.get('xcen'))

    put('tHeading', ex['heading'])
    put('bPrev', icons['arrow-left-bold'])
    put('bNext', icons['arrow-right-bold'])
    icon, color, label = ex['main']
    put('bMain', icons[icon], rgb565(color))
    put('tMainName', label)
    put('tStatus', ex['status'])
    put('bInfo', icons['information-outline'], rgb565(FG))
    for k, (spec, (icon, color, label, value)) in enumerate(zip(layout['slots'], ex['slots']), 1):
        kind = spec['kind']
        icon_obj, _ = slot_names(k, kind)
        if kind == 'status':
            if status_on:
                x, y, w, h = rect(icon_obj)
                grid = rgb565(GRID_COLOR)
                cv.fill(x, y, w, 1, grid)
                cv.fill(x, y + h - 1, w, 1, grid)
                cv.fill(x, y, 1, h, grid)
                cv.fill(x + w - 1, y, 1, h, grid)
                if icon:
                    put(icon_obj, icons[icon], rgb565(color))
            continue
        names = (icon_obj, f'tEntity{k}', f'tValue{k}')
        if status_on and k in layout.get('narrow', {}):
            names = narrow_names(k)
        if icon and names[0] in objs:
            put(names[0], icons[icon], rgb565(color))
        put(names[1], label)
        if names[2] in objs:
            put(names[2], value)
        if kind == 'progress':
            x, y, w, h = spec['bar']
            cv.fill(x, y, w, h, fg)
            cv.fill(x + 1, y + 1, w - 2, h - 2, bg)
            cv.fill(x + 1, y + 1, (w - 2) * int(value) // 100, h - 2, rgb565(color))
        if kind == 'switch':
            x, y, w, h = spec['switch']
            on = value == '1'
            cv.fill(x + 3, y + 13, 44, 24, rgb565(color565(0, 200, 0) if on else color565(120, 120, 120)))
            cv.fill(x + (25 if on else 5), y + 15, 20, 20, (255, 255, 255))
    # area under the frame
    for yy in range(320):
        for xx in range(450, 480):
            if (xx + yy) % 8 < 4:
                cv.px[yy * 480 + xx] = [90, 90, 90]
    return cv


def render_all(hmi, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    fonts = [Zi(hmi.files[s]) for s in main_entries(hmi.files['main.HMI'], 'zi')]
    icons = icon_codes()
    pages = {Page(d).objs[0].name: Page(d) for n, d in hmi.files.items() if n.endswith('.pa')}
    for name in PAGES:
        path = os.path.join(out_dir, f'hmi-{name}.png')
        render_page(pages[name], name, fonts, icons).png(path)
        print(f'preview {path}')
        if status_slots(LAYOUTS[name]):
            path = os.path.join(out_dir, f'hmi-{name}-plain.png')
            render_page(pages[name], name, fonts, icons, plain=True).png(path)
            print(f'preview {path}')


if __name__ == '__main__':
    args = sys.argv[1:]
    out_dir = None
    if '--preview' in args:
        i = args.index('--preview')
        out_dir = args[i + 1]
        del args[i:i + 2]
    if len(args) != 2:
        raise SystemExit(__doc__)
    main(args[0], args[1], out_dir)
