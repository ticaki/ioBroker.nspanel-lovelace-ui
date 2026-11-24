"""HMI 6.2.0 (EU, us-l, us-p): the device pages cardDevice1 'control', cardDevice2 'progress' and cardDevice3 'values'.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/card_device.py <in.HMI> <out.HMI> [--preview <dir>]
                                                              [--geometry <file.json>] [--fields]
--fields prints the bytes of every part of the longest entityUpd (all buffers full / as the adapter builds it).
Input: a 6.2.0 project of any model with the pages cardGrid and cardEntities. The output must not exist.
With --preview the script also writes a true-to-scale mock-up per page, drawn from the objects of each built page
with example content (robot vacuum, washing machine, car) and the fonts of the project (zilib.py); the area under
the frame is hatched. File names: EU <dir>/hmi-cardDevice{1,2,3}.png, the other models with their name
(hmi-us-l-cardDevice1.png, hmi-us-p-cardDevice1.png); cardDevice1 also as ...-plain.png without status icons.
With --geometry the script sets the key of the model ('eu', 'us-l', 'us-p') in the JSON file and keeps the other
keys: stage size, visible x range and per page every element with its boxes as they are in the built page
(x, y, w, h, font, alignment, buffer; roles: header prev/heading/next, main icon/name, per slot icon/name/value/
bar/toggle/cell/touch and the narrow set of an info row, status, info) plus statusWidth, the width of the status
line in px. doc/ideas/device-details/device-page-geometry.json is that file for the three models; the web panel
builds its layouts from it.

Models. The model is read from the project (detect_model: pageStartup sends event,startup,<version>,<model>,..),
never from the file name; the page size of cardGrid must fit it.
  eu    480 x 320, visible x 0..449: LAYOUTS.
  us-l  480 x 320, visible x 15..464: LAYOUTS with every x shifted. The shift is measured on the project: the
        header of cardGrid (bPrev, tHeading, bNext) lies 15 px right of the EU header (model_layouts stops if the
        three differ or do not match the visible area). Everything else is the EU page.
  us-p  320 x 480, all visible: LAYOUTS_PORTRAIT, the same elements in an arrangement of its own (header of
        cardGrid us-p, content x 10..309, status line 262 px wide instead of 390 with the info icon right of it):
        cardDevice1  icon top left with the name below, the 2 x 2 status block right of it, the two info rows
                     over the full width, the four buttons as 2 x 2. No second (narrow) set of info rows.
        cardDevice2  icon and large value on top, bar over the full width, the three infos as rows, the button
                     over the full width.
        cardDevice3  icon on top in the middle, 2 x 3 info tiles, the two switches as rows.
The same on every model (the adapter has constants for it): protocol and field order, number and kind of the slots,
devStatus, the text buffers and strCommand of every page (943 / 875 / 1019), fonts per role (font ids are the same
on all models; us-p fonts 0/2 are another face with other widths), touch behaviour. What differs is geometry only -
the adapter has to measure names, values and the status line with the widths of the model (geometry file).
check_area stops when a box leaves the visible area or lies on a swipe strip and reports overlapping boxes.
Copies never keep the editor group of their template (ungroup; us-p has grouped objects on cardGrid/cardEntities).

Each page is a fresh copy of cardGrid: header, arrows, swipe strips, tmSerial (receive, ack/CRC, pageType switch),
sleep timer, the long press of the arrows and the long press of the cells (tmLP, LPState) stay as they are; the six
cells of cardGrid are removed. A long press feedback of cardGrid (grid_long_press_feedback.py) is taken out of the
copy first and added again for the elements of the built page, so the input may or may not have it.
An existing cardDevice<n> is rebuilt from cardGrid in its own section, so running the script on its own output gives
the same pages again (idempotent). New pages are appended behind the last page of main.HMI (no page id moves). The
pageType switch of every page with tmSerial gets 'if(tId.txt=="cardDevice<n>") page cardDevice<n>' behind the
cardGrid3 branch (added once).

Protocol:
  pageType~cardDevice<n>
  entityUpd~<heading>~<prev: 6 fields>~<next: 6 fields>~<main>~<slot 1>~..~<slot N>~<info>
  devStatus~<text>              only the status line: tStatus shows the text, nothing else is touched
  every element has the 6 fields of a cardGrid cell: type~intName~icon~iconColor~displayName~optionalValue
  element e (main 0, slot k = k, info N+1) starts at field 14 + 6e. N and the kind of every slot are fixed per page:
    cardDevice1  N=10 info, info, button x 4, status x 4 (info icon from field 80)
    cardDevice2  N=6  value, progress, info, info, info, button
    cardDevice3  N=8  info x 6, switch, switch
  type 'delete' or empty hides an element completely (main: icon and name; the status line shows field 6 of main
  in any case, empty = empty line).
  main      icon font 4 ('¬<font>' suffix like cardGrid) in iconColor, name below it; optionalValue -> status
            line tStatus at the bottom (font 0, one line, normal text colour, at most 63 bytes).
            A text that does not fit the line is split by the adapter; it sends the parts one after the other
            with the short message devStatus~<text> (STATUS_COMMAND), which only sets tStatus.
  info      row: icon (font 1, iconColor), name (font 0), value (font 0, right aligned).
  value     optionalValue in font 4 (Bold 80: digits, ':', '%', '°', ',', '.', letters incl. umlauts; no
            '€'), name below in font 0, optional small icon (font 1) beside it.
  progress  bar drawn with fill/draw (the project has no progress bar component to copy): outline in the text
            colour, filled part optionalValue (integer 0..100, clamped) percent in iconColor, name above it.
  button    icon (font 3) with the name below.
  switch    row: icon (font 1), name, switch btOnOff (copy of cardEntities, state = optionalValue 0/1).
            Tap on the switch: event,buttonPress2,<id>,OnOff,<0|1> like cardEntities.
  status    (cardDevice1 slots 7..10) icon only (font 1, iconColor) in a 2 x 2 block right of the main icon. The
            cells are text objects with a 1 px border (style 1, colour 14823), neighbours overlap by 1 px so
            the borders form frame and cross; no drawing, nothing to redraw. All four empty/delete: the block is
            hidden and the info rows 1-2 show in full width; else an empty cell keeps its border with an empty
            text, and the info rows switch to a second, narrower set of objects (vis, x/w never change at runtime).
            displayName is not read (the adapter sends none): a popup opened from a cell has no heading.
  info      (the last element) small icon bottom right, icon/colour from the payload, hidden for delete/empty;
            tap: event,buttonPress2,<intName>,button (no long press, it has no type).

Touch: main and every slot behave like a cell of cardGrid (its down/up code and tmLP/LPState, unchanged):
  touch     shutter/shutter2/input_sel/timer open their popup at once (no event)
  hold      after 500 ms (tmLP) light/light2/fan/number open their popup (no event); every other type arms the
            long press (LPState=1) and the background of the element blinks green/grey, 200 ms per phase, until
            the release (grid_long_press_feedback.add): main/info/button the icon button, status the cell, value/
            progress/switch (hotspot) the name field tEntity<k> - the bar of progress lies below it and is not
            redrawn. Type text without an intName does not blink (it sends nothing).
  release   event,buttonPress2,<intName>,button - or event,buttonPress3,<intName>,button when the long press was
            armed. Type text without an intName sends nothing (kinds other than button).
  The popups get name, id, icon and icon colour in pageIcons.tTmp1/2/3 and tempIconColor; they do not know the
  calling page, their bExit goes to the adapter, which answers with the pageType of the page.
  Where the code lives: main/info/button in the icon button (name and value forward with click <button>,1 / ,0);
  status in the cell text itself; value, progress and the icon+name of a switch under a hotspot mSlot<k> (copy of
  a swipe strip, no picture) over the union of their objects (progress: name + bar). A hotspot or a status cell
  stays touchable while its element is empty, so their code checks the type first (delete/empty: nothing).
  The switch btOnOff itself and the status line are not touched.

Buffers: ids (entn*) 23 like cardEntities2, names 31, values 31, status 63, icons 10, tSend 63 (longest event
'event,buttonPress2,' + id + ',OnOff,1'). RAM per page (9 + 7 per object + text buffers) is printed and must stay
<= 3584 with global.

strCommand is sized per page from its slots (message_fields, str_command_maxl): the longest entityUpd the adapter
really builds (ids '<page>?<n>' 12 bytes, one icon 4 bytes, colour 5, the longest type of the kind, names and values
up to their buffers, button/switch value 0/1, status icons without name and value) plus 10 %, rounded up to 4k-1, at
most 1019 (the display takes 1017 bytes of payload). The other messages of the page (time, date, timeout, dimmode,
pageType) are far shorter. The receive code copies at most txt_maxl bytes into strCommand (clamp_receive): a longer
message loses its end, the CRC check, the delete of the frame and the acknowledgement use the whole frame in the
serial buffer and do not depend on the size of strCommand.
"""
import json
import os
import re
import struct
import sys
import zlib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import grid_long_press_feedback as feedback  # noqa: E402
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
ICON_NEED = 7  # one glyph (at most 4 bytes UTF-8) plus the font suffix '¬<digit>' (2 + 1)
TYPE_LEN = 10
TSEND_LEN = 63
STR_COMMAND_MAX = 1019  # the serial buffer of the display holds 1023 bytes, a payload is at most 1017
PAYLOAD_MAX = 1017
STR_COMMAND_RESERVE = 10  # percent on top of the longest real entityUpd
HEADING_LEN = 40  # tHeading
TMP_LEN = 10  # tTmp: types of the navigation and of the info icon, numbers
COLOR_LEN = 5  # 65535
REAL_ID = 12  # ids of the adapter 'dp_<page index>?<n>'
REAL_ICON = 4  # one glyph, UTF-8
RAM_GLOBAL = 436
RAM_LIMIT = 3584
RAM_TARGET = 3400

STATUS_COMMAND = 'devStatus'  # devStatus~<text>: only the status line (the adapter alternates the parts of a long text)
FIELDS_TABLE = False  # --fields

REMOVE = re.compile(r'(bEntity|tEntity)[1-6]')

# ---------------------------------------------------------------- models
# the model is the one pageStartup reports: event,startup,<tVersion>,<model>,<tRelease>
MODELS = ('eu', 'us-l', 'us-p')
STAGE = {'eu': (480, 320), 'us-l': (480, 320), 'us-p': (320, 480)}
VISIBLE = {'eu': (0, 449), 'us-l': (15, 464), 'us-p': (0, 319)}  # x range that is not under the frame
STARTUP_MODEL = re.compile(r'"event,startup,"\+tVersion\.txt\+",([\w-]+),"\+tRelease\.txt')
# x of the header objects of cardGrid EU: a landscape model has its pages shifted by the distance of its header
EU_HEADER_X = {'bPrev': 9, 'tHeading': 65, 'bNext': 391}

# ---------------------------------------------------------------- layouts
# EU: visible x 0..449, touch of the content x 10..439 (swipe strips), content y 67..287 under the header of cardGrid.
# us-l: the EU layout shifted to its visible area (x 15..464), see model_layouts.
# us-p (320 x 480, all of it visible): content x 10..309 between the swipe strips, y 67..477, see LAYOUTS_PORTRAIT.
# text = (x, y, w, h, font, xcen); icon = (x, y, w, h, font); bar / switch / status line = (x, y, w, h)
STATUS_LINE = (10, 289, 390, 30)
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


def status_cell(i, x0=STATUS_X, y0=STATUS_Y0, w=STATUS_CELL_W, h=STATUS_CELL_H):
    x = x0 + (w - 1) * (i % 2)
    y = y0 + (h - 1) * (i // 2)
    return {'kind': 'status', 'icon': (x, y, w, h, 1)}


# landscape (EU; us-l with every x shifted)
LAYOUTS = {
    # control: icon top left, two info rows right of it, four buttons, optional 2 x 2 status icons between icon and
    # info rows (the info rows switch to a narrower second set of objects while the block is shown)
    'cardDevice1': {
        'main': (10, 68, 110, 86, 4), 'mainName': (10, 156, 110, 26, 0, 1), 'statusXcen': 1,
        # the tightest page: its 14 icon buffers hold exactly what an icon needs (ICON_NEED), 4 bytes less each
        'iconLen': ICON_NEED,
        'slots': [info_row(126, 76, 314), info_row(126, 120, 314)] + [button(10 + 108 * k, 190, 104) for k in range(4)]
        + [status_cell(i) for i in range(4)],
        'narrow': {1: narrow_row(204, 76, 236), 2: narrow_row(204, 120, 236)},
        'status': STATUS_LINE, 'info': INFO_ICON,
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
        'status': STATUS_LINE, 'info': INFO_ICON,
    },
    # values: icon left, 2 x 3 info tiles, two switches
    'cardDevice3': {
        'main': (10, 67, 100, 82, 4), 'mainName': (10, 151, 100, 26, 0, 1), 'statusXcen': 1,
        'slots': [info_tile(114 + 163 * (k % 2), 67 + 52 * (k // 2), 161) for k in range(6)]
        + [switch_row(10, 228, 213), switch_row(226, 228, 213)],
        'status': STATUS_LINE, 'info': INFO_ICON,
    },
}

# portrait (us-p, 320 x 480): the same elements, kinds, fonts and buffers in an arrangement of its own.
# Header of cardGrid us-p (bPrev 9/16, tHeading 60/24 200x30, bNext 261/16); content x 10..309 (300 px), y 67..443;
# at the bottom the status line (262 px - narrower than landscape, the adapter needs the width per model) and the
# info icon right of it.
PORTRAIT_STATUS = (10, 447, 262, 30)
PORTRAIT_INFO = (274, 446, 36, 32, 1)
LAYOUTS_PORTRAIT = {
    # control: icon top left with the name below, right of it the 2 x 2 status block (72 x 57 cells, as high as
    # icon + name), two info rows over the full width, the four buttons as 2 x 2 (148 px each).
    # No second set of info rows: the rows do not depend on the status block (6 objects less than landscape).
    'cardDevice1': {
        'main': (10, 70, 150, 86, 4), 'mainName': (10, 158, 150, 26, 0, 1), 'statusXcen': 1,
        'iconLen': ICON_NEED,
        'slots': [info_row(10, 190, 300), info_row(10, 230, 300)]
        + [button(10 + 152 * (k % 2), 272 + 86 * (k // 2), 148) for k in range(4)]
        + [status_cell(i, 166, 70, 72, 57) for i in range(4)],
        'status': PORTRAIT_STATUS, 'info': PORTRAIT_INFO,
    },
    # progress: icon top left, large value beside it (icon 34 px, value 172 px in font 4), bar over the full width,
    # the three infos as rows, the button over the full width
    'cardDevice2': {
        'main': (10, 68, 90, 82, 4), 'mainName': (10, 152, 90, 26, 0, 1), 'statusXcen': 1,
        'slots': [
            {'kind': 'value', 'icon': (102, 91, 34, 36, 1), 'value': (138, 68, 172, 82, 4, 0),
             'name': (138, 152, 172, 26, 0, 0)},
            {'kind': 'progress', 'name': (10, 184, 300, 26, 0, 0), 'bar': (10, 212, 300, 14)},
            info_row(10, 234, 300), info_row(10, 274, 300), info_row(10, 314, 300),
            {'kind': 'button', 'icon': (10, 356, 300, 52, 3), 'name': (10, 410, 300, 26, 0, 1)},
        ],
        'status': PORTRAIT_STATUS, 'info': PORTRAIT_INFO,
    },
    # values: icon top in the middle, name below over the full width, 2 x 3 info tiles (148 px), the two switches
    # as rows
    'cardDevice3': {
        'main': (85, 67, 150, 82, 4), 'mainName': (10, 151, 300, 26, 0, 1), 'statusXcen': 1,
        'slots': [info_tile(10 + 152 * (k % 2), 182 + 52 * (k // 2), 148) for k in range(6)]
        + [switch_row(10, 342, 300), switch_row(10, 394, 300)],
        'status': PORTRAIT_STATUS, 'info': PORTRAIT_INFO,
    },
}


def shift_layout(layout, dx):
    """the layout with every box moved by dx to the right"""
    def move(value):
        if isinstance(value, tuple):
            return (value[0] + dx,) + value[1:]
        if isinstance(value, dict):
            return {k: move(v) for k, v in value.items()}
        if isinstance(value, list):
            return [move(v) for v in value]
        return value
    return {k: (move(v) if k in ('main', 'mainName', 'slots', 'narrow', 'status', 'info') else v)
            for k, v in layout.items()}


def detect_model(pages):
    """the model of the project: what pageStartup sends in event,startup"""
    if 'pageStartup' not in pages:
        raise SystemExit('no page pageStartup')
    found = {m.group(1) for o in pages['pageStartup'].objs for item in o.items if item[0] == 'code'
             for line in item[2] for m in [STARTUP_MODEL.search(line.split('//')[0])] if m}
    if len(found) != 1 or not found <= set(MODELS):
        raise SystemExit(f'pageStartup: no single known model in event,startup: {sorted(found)}')
    return found.pop()


def model_layouts(model, grid):
    """(layouts, x shift against EU or None) for the model; grid: its page cardGrid.
    Landscape: the EU layout, shifted by the distance of the header of cardGrid (bPrev, tHeading, bNext) from the
    EU header - that is the offset of the visible area (us-l 15: x 15..464 instead of 0..449; cardEntities of us-l
    lies exactly 15 px right of EU as well). Portrait: LAYOUTS_PORTRAIT."""
    page = grid.objs[0]
    stage = (page.get('w'), page.get('h'))
    if stage != STAGE[model]:
        raise SystemExit(f'{SOURCE}: {stage[0]}x{stage[1]}, model {model} is {STAGE[model][0]}x{STAGE[model][1]}')
    if stage[0] < stage[1]:
        return LAYOUTS_PORTRAIT, None
    shifts = {n: grid.obj(n).get('x') - x for n, x in EU_HEADER_X.items()}
    dx = shifts['tHeading']
    if set(shifts.values()) != {dx} or dx != VISIBLE[model][0] - VISIBLE['eu'][0]:
        raise SystemExit(f'{SOURCE}: header shifted by {shifts} against EU, the visible area of {model} starts at '
                         f'x {VISIBLE[model][0]}')
    return {name: shift_layout(layout, dx) for name, layout in LAYOUTS.items()}, dx


def check_area(page, layout, model):
    """every box of the layout lies on the stage, in the visible x range and off the swipe strips; returns notes
    about boxes of different elements that overlap (the two sets of an info row and neighbouring status cells are
    meant to)"""
    width, height = STAGE[model]
    x0, x1 = VISIBLE[model]
    name = page.objs[0].name
    strips = [(o.name, (o.get('x'), o.get('y'), o.get('w'), o.get('h'))) for o in page.objs
              if o.name.startswith('mSwipe')]
    boxes = [('main', layout['main'][:4]), ('main', layout['mainName'][:4]), ('status', layout['status'][:4]),
             ('info', layout['info'][:4])]
    for k, spec in enumerate(layout['slots'], 1):
        group = 'status block' if spec['kind'] == 'status' else f'slot {k}'
        boxes += [(group, spec[n][:4]) for n in ('icon', 'name', 'value', 'bar', 'switch') if n in spec]
    for k, spec in layout.get('narrow', {}).items():
        boxes += [(f'slot {k} narrow', spec[n][:4]) for n in ('icon', 'name', 'value')]

    def hit(a, b):
        return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]
    for group, box in boxes:
        if box[0] < x0 or box[0] + box[2] - 1 > x1 or box[1] < 0 or box[1] + box[3] > height or box[0] + box[2] > width:
            raise SystemExit(f'{name}: {group} {box} is outside of the visible area x {x0}..{x1}, y 0..{height - 1}')
        for strip, rect in strips:
            if hit(box, rect):
                raise SystemExit(f'{name}: {group} {box} lies on {strip} {rect}')
    notes = []
    wide = {f'slot {k}' for k in layout.get('narrow', {})}
    for i, (ga, a) in enumerate(boxes):
        for gb, b in boxes[i + 1:]:
            if ga == gb or not hit(a, b):
                continue
            # never shown together: a wide info row and the narrow rows / the status block
            if (ga in wide and (gb.endswith(' narrow') or gb == 'status block')
                    or gb in wide and (ga.endswith(' narrow') or ga == 'status block')):
                continue
            notes.append(f'{ga} {a} / {gb} {b}')
    return notes


TAPPED = ('info', 'button')
HOTSPOT = ('value', 'progress', 'switch')  # elements without a button: a hotspot carries the cell code


# ---------------------------------------------------------------- size of strCommand
# the 6 fields of an element in bytes: (type, intName, icon, iconColor, displayName, optionalValue)
# BUFFER: what the page keeps of every field (txt_maxl of its target, 0 = the field is not read)
# REAL:   what the adapter really sends (longest type of the kind, id 12, one icon, names/values up to the buffer)
BUFFER = {
    'nav': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, 0, 0),
    'main': (TYPE_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, STATUS_LEN),
    'info': (TYPE_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'value': (TYPE_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'progress': (TYPE_LEN, ID_LEN, 0, COLOR_LEN, NAME_LEN, TMP_LEN),
    'button': (TYPE_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, 0),
    'switch': (TYPE_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, TMP_LEN),
    'status': (TYPE_LEN, ID_LEN, ICON_LEN, COLOR_LEN, 0, 0),
    'infoIcon': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, 0, 0),
}
REAL = {
    'nav': (len('button'), REAL_ID, REAL_ICON, COLOR_LEN, 0, 0),
    'main': (len('switch'), REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, STATUS_LEN),
    'info': (len('input_sel'), REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'value': (len('text'), REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'progress': (len('text'), REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, len('100')),
    'button': (len('button'), REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, 1),
    'switch': (len('switch'), REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, 1),
    # the adapter sends a status icon without name and value (devicePageStatusIconElement)
    'status': (len('text'), REAL_ID, REAL_ICON, COLOR_LEN, 0, 0),
    'infoIcon': (len('button'), REAL_ID, REAL_ICON, COLOR_LEN, 0, 0),
}


def next_4k1(n):
    """smallest 4k-1 >= n (a text buffer costs ceil((txt_maxl + 1) / 4) * 4 bytes)"""
    return n + (3 - n) % 4


def message_fields(layout, real):
    """[(part, bytes of its fields)] of the longest entityUpd of the page; real False: every field filled up to
    the buffer it lands in (never less than the adapter sends), True: what the adapter really builds"""
    def element(kind):
        fields = REAL[kind] if real else tuple(max(b, r) for b, r in zip(BUFFER[kind], REAL[kind]))
        if not real and kind != 'nav' and fields[2] == ICON_LEN:
            fields = fields[:2] + (layout.get('iconLen', ICON_LEN),) + fields[3:]  # the icon buffers of the page
        return fields
    parts = [('entityUpd', (len('entityUpd'),)), ('heading', (HEADING_LEN,)), ('prev', element('nav')),
             ('next', element('nav')), ('main', element('main'))]
    parts += [(f'slot {k} {s["kind"]}', element(s['kind'])) for k, s in enumerate(layout['slots'], 1)]
    return parts + [('info', element('infoIcon'))]


def message_len(layout, real):
    """bytes of that message: the fields plus one '~' between two fields"""
    fields = [n for _, part in message_fields(layout, real) for n in part]
    return sum(fields) + len(fields) - 1


def str_command_maxl(layout):
    """txt_maxl of strCommand: the longest real entityUpd plus the reserve, 4k-1, at most STR_COMMAND_MAX"""
    need = -(-message_len(layout, True) * (100 + STR_COMMAND_RESERVE) // 100)
    return min(STR_COMMAND_MAX, next_4k1(need))


def clamp_receive(page, maxl):
    """tmSerial copies at most maxl bytes of the payload into strCommand, so a longer message never writes more
    than the buffer holds; CRC, udelete and the acknowledgement work on the frame in u[] as before. A page whose
    buffer takes the longest possible payload keeps the code of cardGrid."""
    if maxl >= PAYLOAD_MAX:
        return
    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    at = find(lines, 'ucopy strCommand.txt,4,payloadLength-5,0')
    if lines[at - 5].strip() != 'if(crcval==recvCrc)' or lines[at - 4].strip() != '{':
        raise SystemExit('tmSerial: unexpected code in front of the copy into strCommand')
    # sys0 is free here: the frame end check in front has used it, everything behind sets it before reading it
    for line in lines[at + 1:]:
        code = line.split('//')[0].strip()
        if re.search(r'\bsys0\b', code):
            if not re.fullmatch(r'(covx|strlen|btlen) [\w.]+,sys0(,0,0)?', code):
                raise SystemExit(f'tmSerial: sys0 is read behind the copy into strCommand: {code}')
            break
    ind = lines[at][:len(lines[at]) - len(lines[at].lstrip())]
    lines[at:at + 1] = [
        f'{ind}// at most txt_maxl of strCommand (card_device.py): a longer message loses its end here; CRC check,',
        f'{ind}// delete and acknowledgement use the whole frame in the serial buffer',
        f'{ind}sys0=payloadLength-5',
        f'{ind}if(sys0>{maxl})',
        f'{ind}{{',
        f'{ind}  sys0={maxl}',
        f'{ind}}}',
        f'{ind}ucopy strCommand.txt,4,sys0,0',
    ]
    serial.set_code('timer', lines)


def ram(page):
    """estimate (reference-hmi-ram-model): 9 for the page, ~7 per object, plus the text buffers"""
    total = 9 + 7 * (len(page.objs) - 1)
    for o in page.objs:
        if o.has('txt_maxl') and (o.get('type') != 52 or o.get('sta') == 1):
            total += text_cost(o.get('txt_maxl'))
    return total


# ---------------------------------------------------------------- objects

def ungroup(o):
    """a copy does not belong to the editor group of its template (us-p: tEntity<k> of cardGrid and the rows of
    cardEntities carry group ids; EU and us-l have none there)"""
    for att in ('groupid0', 'groupid1'):
        if o.has(att) and o.get(att):
            o.set(att, 0)
    return o


def make_text(template, name, spec, maxl):
    x, y, w, h, font, xcen = spec
    o = ungroup(template.copy())
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
    o = ungroup(template.copy())
    o.set('objname', name)
    o.geometry(x, y, w, h)
    o.set('font', font)
    o.set('txt', '')
    o.set('txt_maxl', ICON_LEN)
    o.set('xcen', 1)
    o.set('ycen', 1)
    return o


def make_var(template, name, maxl):
    o = ungroup(template.copy())
    o.set('objname', name)
    o.set('txt', '')
    o.set('txt_maxl', maxl)
    return o


def forward(o, button_name):
    o.set_code('down', [f'click {button_name},1'])
    o.set_code('up', [f'click {button_name},0'])


def send_lines(entn):
    return [f'tSend.txt="event,buttonPress2,"+{entn}.txt+",button"'] + SEND


def cell_down(down1, typ, entn, name, icon, color=None):
    """the down code of cardGrid bEntity1 with other names; icon None: there is no icon object (the popup gets an
    empty icon and the colour of the object color); name None: the element has no name (the popup gets an empty
    heading)"""
    rename = {'type1': typ, 'entn1': entn, 'tEntity1': name, 'bEntity1': icon}
    fixed = {'pageIcons.tTmp3.txt=bEntity1.txt': 'pageIcons.tTmp3.txt=""',
             'tempIconColor=bEntity1.pco': f'tempIconColor={color}.pco'}
    no_name = 'pageIcons.tTmp1.txt=tEntity1.txt'
    if name is None and sum(x.strip() == no_name for x in down1) != sum('tEntity1' in x for x in down1):
        raise SystemExit(f'{SOURCE}.bEntity1.down: unexpected use of the name')
    out = []
    for line in down1:
        if name is None and line.strip() == no_name:
            line = line.replace(no_name, 'pageIcons.tTmp1.txt=""')
        if icon is None and 'bEntity1' in line:
            if line.strip() not in fixed:
                raise SystemExit(f'{SOURCE}.bEntity1.down: unexpected use of the icon: {line}')
            line = line.replace(line.strip(), fixed[line.strip()])
        out.append(re.sub(r'\b(type1|entn1|tEntity1|bEntity1)\b', lambda m: rename[m.group(1)], line))
    return out


def cell_up(up1, typ, entn, text_guard=True):
    """the up code of cardGrid bEntity1 (buttonPress2, or buttonPress3 after a long press) with other names;
    text_guard: type text without an intName has nothing to report and sends nothing"""
    lines = [re.sub(r'\bentn1\b', entn, x) for x in up1]
    if not text_guard:
        return lines
    body = [x for x in lines[1:] if x.strip() != 'LPState.val=0']
    return ([lines[0], '// every type sends, type text only with an intName (card_device.py)',
             f'if({typ}.txt!="text"||{entn}.txt!="")', '{'] + ['  ' + x for x in body] + ['}', 'LPState.val=0'])


def if_shown(typ, lines, keep_first=0, keep_last=0):
    """lines inside 'the element is not empty' - for objects that stay touchable while their element is empty"""
    end = len(lines) - keep_last
    return (lines[:keep_first] + ['// an empty element does nothing (card_device.py)',
                                  f'if({typ}.txt!="delete"&&{typ}.txt!="")', '{']
            + ['  ' + x for x in lines[keep_first:end]] + ['}'] + lines[end:])


def union(rects):
    x0 = min(r[0] for r in rects)
    y0 = min(r[1] for r in rects)
    x1 = max(r[0] + r[2] for r in rects)
    y1 = max(r[1] + r[3] for r in rects)
    return x0, y0, x1 - x0, y1 - y0


def hotspot_rect(spec):
    """the touch area of an element without a button: its icon, name, value and bar (not the switch)"""
    return union([spec[n][:4] for n in ('icon', 'name', 'value', 'bar') if n in spec])


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


def tapped_row(button_t, text_t, down1, up1, k, names, spec):
    """icon button, name and value of a tappable info row; the type/id are those of slot k"""
    icon, name_n, value_n = names
    b = make_button(button_t, icon, spec['icon'])
    b.set_code('down', cell_down(down1, f'type{k}', f'entn{k}', name_n, icon))
    b.set_code('up', cell_up(up1, f'type{k}', f'entn{k}'))
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
    up1 = src['bEntity1'].code('up')
    if (up1[0] != 'tmLP.en=0' or up1[1] != 'if(LPState.val==0)' or sum('buttonPress3' in x for x in up1) != 1
            or sum(x.strip() == 'LPState.val=0' for x in up1) != 1):
        raise SystemExit(f'{SOURCE}.bEntity1: unexpected up code')
    lp = src['tmLP'].code('timer')
    if lp[-1].strip() != 'LPState.val=1' or not any('page popupLight' in x for x in lp):
        raise SystemExit('tmLP: unexpected timer code')
    text_t, button_t, var_t, spot_t = src['tEntity1'], src['bEntity1'], src['type1'], src['mSwipeNext']
    if spot_t.get('type') != 109:
        raise SystemExit('mSwipeNext is not a hotspot')
    hotspots = []
    if 'narrow' in layout:
        narrow = []
        for k, spec in layout['narrow'].items():
            if layout['slots'][k - 1]['kind'] != 'info':
                raise SystemExit(f'narrow set for slot {k}, which is no info row')
            narrow += tapped_row(button_t, text_t, down1, up1, k, narrow_names(k), spec)

    main = make_button(button_t, 'bMain', layout['main'])
    main.set_code('down', cell_down(down1, 'typeMain', 'entnMain', 'tMainName', 'bMain'))
    main.set_code('up', cell_up(up1, 'typeMain', 'entnMain'))
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
            # the cell is its own touch area; an empty one keeps its border, so the code checks the type
            # a status icon has no name (the adapter sends none): a popup opened from the cell has no heading
            cell.set_code('down', if_shown(f'type{k}', cell_down(down1, f'type{k}', f'entn{k}', None, icon)))
            cell.set_code('up', if_shown(f'type{k}', cell_up(up1, f'type{k}', f'entn{k}'), 1, 1))
            visible.append(cell)
            variables += [make_var(var_t, f'type{k}', TYPE_LEN), make_var(var_t, f'entn{k}', ID_LEN)]
            continue
        if kind in TAPPED:
            b = make_button(button_t, icon, spec['icon'])
            b.set_code('down', cell_down(down1, f'type{k}', f'entn{k}', f'tEntity{k}', icon))
            b.set_code('up', cell_up(up1, f'type{k}', f'entn{k}', kind == 'info'))
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
            sw = ungroup(switch_template.copy())
            sw.set('objname', f'btOnOff{k}')
            sw.geometry(*spec['switch'])
            sw.set('txt_maxl', 3)
            sw.set_code('down', [x.replace('btOnOff1', f'btOnOff{k}').replace('entn1', f'entn{k}')
                                 for x in switch_template.code('down')])
            visible.append(sw)
        if kind in HOTSPOT:
            # one hotspot over the texts (and the bar) of the element, above them in the z order
            spot = ungroup(spot_t.copy())
            spot.set('objname', f'mSlot{k}')
            spot.geometry(*hotspot_rect(spec))
            spot.set_code('down', if_shown(f'type{k}', cell_down(
                down1, f'type{k}', f'entn{k}', f'tEntity{k}', icon if 'icon' in spec else None, f'tEntity{k}')))
            spot.set_code('up', if_shown(f'type{k}', cell_up(up1, f'type{k}', f'entn{k}'), 1, 1))
            hotspots.append(spot)
        if f'type{k}' not in src:
            variables += [make_var(var_t, f'type{k}', TYPE_LEN), make_var(var_t, f'entn{k}', ID_LEN)]
    visible.append(make_text(text_t, 'tStatus', layout['status'] + (0, layout['statusXcen']), STATUS_LEN))
    info = make_button(button_t, 'bInfo', layout['info'])
    info.set_code('down', [])
    info.set_code('up', send_lines('entnInfo'))
    visible.append(info)
    variables.append(make_var(var_t, 'entnInfo', ID_LEN))
    if 'narrow' in layout:
        visible += narrow
    # the icon buffers of the page (the only buffers of ICON_LEN among the new objects)
    for o in visible:
        if o.has('txt_maxl') and o.get('txt_maxl') == ICON_LEN:
            o.set('txt_maxl', layout.get('iconLen', ICON_LEN))
    visible += hotspots
    if status_slots(layout):
        # number variable (like vLPNavState): 1 while at least one status icon is set
        flag = ungroup(src['vLPNavState'].copy())
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
    page.obj('strCommand').set('txt_maxl', str_command_maxl(layout))


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
        out += [f'{ind}spstr strCommand.txt,type{k}.txt,"~",{first}',
                f'{ind}spstr strCommand.txt,entn{k}.txt,"~",{first + 1}',
                f'{ind}if(type{k}.txt=="delete"||type{k}.txt=="")',
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
           f'{ind}// status line = optionalValue of main, also when main is hidden']
    out.append(f'{ind}spstr strCommand.txt,tStatus.txt,"~",{FIRST + 5}')
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
    out += icon_lines(i, info_first + 2, 'bInfo', layout['info'][4])
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
    # the short message for the status line: its own branch behind the entityUpd block, in front of pageType; the
    # delete of the frame and the acknowledgement behind the branches are those of every message
    at = find(lines, 'if(tInstruction.txt=="pageType")', start)
    outer = lines[at][:len(lines[at]) - len(lines[at].lstrip())]
    if lines[at - 1] != outer + '}':
        raise SystemExit('tmSerial: unexpected end of the entityUpd block')
    lines[at:at] = [f'{outer}if(tInstruction.txt=="{STATUS_COMMAND}")', f'{outer}{{',
                    f'{outer}  // {STATUS_COMMAND}~<text>: only the status line (card_device.py)',
                    f'{outer}  spstr strCommand.txt,tStatus.txt,"~",1', f'{outer}}}']
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


def build_page(source_bytes, name, switch_template, layout):
    page = Page(source_bytes)
    feedback.remove(page)  # the cells are built from the plain long press code of cardGrid
    page.objs[0].set('objname', name)
    page.head[0x18:0x28] = name.encode('latin1').ljust(16, b'\0')
    fix_page_name(page, name)
    build_objects(page, layout, switch_template)
    patch_parser(page, layout)
    clamp_receive(page, str_command_maxl(layout))
    patch_load(page, name, layout)
    # long press feedback: buttons and status cells blink themselves, a hotspot has no background - the name
    # field of its element blinks for it
    blink = feedback.add(page, {f'mSlot{k}': [f'tEntity{k}'] for k, s in enumerate(layout['slots'], 1)
                                if s['kind'] in HOTSPOT})
    check_names(page)
    return page, layout, blink


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


def main(source, target, preview=None, geometry=None):
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
    model = detect_model(pages)
    layouts, shift = model_layouts(model, pages[SOURCE])
    print(f'model {model} (pageStartup): stage {STAGE[model][0]}x{STAGE[model][1]}, visible x {VISIBLE[model][0]}..'
          f'{VISIBLE[model][1]}, ' + ('portrait layouts' if shift is None else
                                      f'landscape layouts shifted by {shift} px (header of {SOURCE})'))
    before = ram(Page(source_bytes))
    changes, added = {}, {}
    main_hmi = hmi.files['main.HMI']
    numbers = [int(s[:-3]) for s in sections.values()]
    for name in PAGES:
        page, layout, blink = build_page(source_bytes, name, switch_template, layouts[name])
        for note in check_area(page, layout, model):
            print(f'{name}: note - boxes overlap: {note}')
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
        kinds = ', '.join(s['kind'] for s in layout['slots'])
        print(f'{name}: N={len(layout["slots"])} ({kinds}), {len(page.objs)} objects, '
              f'RAM (estimate) page {r}, with global {RAM_GLOBAL + r} of {RAM_LIMIT} '
              f'(the copy of {SOURCE} it is built from: page {before}, with global {RAM_GLOBAL + before}); '
              f'status line {layout["status"][2]} px')
        print(f'{name}: long press feedback (blinking background): {", ".join(blink)}')
        hard, real = message_len(layout, False), message_len(layout, True)
        maxl = page.obj('strCommand').get('txt_maxl')
        print(f'{name}: entityUpd at most {hard} bytes with every buffer full, {real} as the adapter builds it; '
              f'strCommand txt_maxl {maxl} (+{STR_COMMAND_RESERVE} %, 4k-1, max {STR_COMMAND_MAX}), '
              f'{RAM_LIMIT - RAM_GLOBAL - r} bytes of RAM free')
        if real > PAYLOAD_MAX:
            print(f'{name}: note - that message is longer than a payload can be ({PAYLOAD_MAX})')
        if FIELDS_TABLE:
            for (part, a), (_, b) in zip(message_fields(layout, False), message_fields(layout, True)):
                print(f'  {part:16} {"+".join(map(str, a)):18} = {sum(a):3}   {"+".join(map(str, b)):16} = {sum(b):3}')
        if RAM_GLOBAL + r > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {RAM_GLOBAL + r} > {RAM_LIMIT}')
        if RAM_GLOBAL + r > RAM_TARGET:
            print(f'{name}: note - less than {RAM_LIMIT - RAM_TARGET} bytes of RAM left')
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
    built = Hmi(out)
    if preview:
        render_all(built, preview, model, layouts)
    if geometry:
        write_geometry(geometry, model, shift, layouts,
                       {name: Page(built.files[sections[name]]) for name in PAGES})


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
        'status': 'Reinigt Wohnzimmer, noch 12 min (Wischen)', 'statusShort': 'Reinigt Wohnzimmer',
        'slots': [('battery-80', color565(0, 220, 0), 'Akku', '80 %'),
                  ('map-marker', FG, 'Fläche', '34 m²'),
                  ('play', color565(0, 220, 0), 'Start', ''), ('pause', FG, 'Pause', ''),
                  ('home-import-outline', FG, 'Dock', ''), ('map-marker', FG, 'Suchen', ''),
                  ('wifi', color565(0, 220, 0), '', ''), ('trash-can', color565(255, 160, 0), '', ''),
                  ('air-filter', FG, '', ''), ('alert', color565(255, 40, 40), '', '')],
    },
    'cardDevice2': {
        'heading': 'Waschküche', 'main': ('washing-machine', color565(0, 160, 255), 'Waschm.'),
        'status': 'Schleudern, noch 23 min - Fertig um 14:35', 'statusShort': 'Schleudern, noch 23 min',
        'slots': [('timer-outline', FG, 'Restzeit', '1:23'),
                  (None, color565(0, 160, 255), 'Fortschritt 62 %', '62'),
                  ('washing-machine', FG, 'Programm', 'Baumwolle'), ('thermometer', color565(255, 140, 0),
                                                                     'Temperatur', '60 °C'),
                  ('fan', FG, 'Drehzahl', '1400'), ('pause', FG, 'Pause', '')],
    },
    'cardDevice3': {
        'heading': 'Auto', 'main': ('car', color565(255, 255, 255), 'ID.3'),
        'status': 'Lädt an Wallbox, 11 kW - voll um 17:40', 'statusShort': 'Lädt, voll um 17:40',
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
        self.missing = set()  # (font, character) that the font does not have

    def fill(self, x, y, w, h, c):
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                self.px[yy * self.w + xx] = list(c)

    def text(self, fonts, rect, font, s, color, xcen, ycen=1):
        x, y, w, h = rect
        z = fonts[font]
        self.missing |= {(font, ch) for ch in s if ord(ch) not in z.chars}
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


def text_width(fonts, font, s):
    z = fonts[font]
    return sum(sum(z.chars[ord(ch)][:3]) for ch in s if ord(ch) in z.chars)


def render_page(page, name, layout, model, fonts, icons, plain=False):
    """plain: the status slots empty (the page without status block)"""
    ex = EXAMPLES[name]
    if plain:
        ex = dict(ex, slots=[(None, FG, '', '') if s['kind'] == 'status' else e
                             for s, e in zip(layout['slots'], ex['slots'])])
    status_on = any(e[0] for s, e in zip(layout['slots'], ex['slots']) if s['kind'] == 'status')
    bg, fg = rgb565(BG), rgb565(FG)
    width, height = STAGE[model]
    cv = Canvas(width, height, bg)
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
    # a status text that does not fit the line of the model: the short one (the adapter splits a long text)
    status = ex['status']
    if text_width(fonts, objs['tStatus'].get('font'), status) > objs['tStatus'].get('w'):
        status = ex['statusShort']
    put('tStatus', status)
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
    x0, x1 = VISIBLE[model]
    for yy in range(height):
        for xx in list(range(0, x0)) + list(range(x1 + 1, width)):
            if (xx + yy) % 8 < 4:
                cv.px[yy * width + xx] = [90, 90, 90]
    return cv


def preview_name(model, name, plain=False):
    """EU keeps its file names, the other models carry theirs: hmi-us-p-cardDevice1.png"""
    return f'hmi-{"" if model == "eu" else model + "-"}{name}{"-plain" if plain else ""}.png'


def render_all(hmi, out_dir, model, layouts):
    os.makedirs(out_dir, exist_ok=True)
    fonts = [Zi(hmi.files[s]) for s in main_entries(hmi.files['main.HMI'], 'zi')]
    icons = icon_codes()
    pages = {Page(d).objs[0].name: Page(d) for n, d in hmi.files.items() if n.endswith('.pa')}
    for name in PAGES:
        for plain in (False, True) if status_slots(layouts[name]) else (False,):
            path = os.path.join(out_dir, preview_name(model, name, plain))
            cv = render_page(pages[name], name, layouts[name], model, fonts, icons, plain)
            cv.png(path)
            print(f'preview {path}')
            if cv.missing:
                print(f'preview {path}: note - glyphs missing in the fonts of the project: '
                      + ', '.join(f'font {f} {ch!r}' for f, ch in sorted(cv.missing)))


# ---------------------------------------------------------------- geometry (JSON for the web panel)

ALIGN = ('left', 'center', 'right')


def box(objs, name, text=True):
    """the box of an object as it is in the built page; text: with font, alignment and buffer"""
    o = objs[name]
    out = {'object': name, 'x': o.get('x'), 'y': o.get('y'), 'w': o.get('w'), 'h': o.get('h')}
    if text:
        out.update(font=o.get('font'), align=ALIGN[o.get('xcen')], maxBytes=o.get('txt_maxl'))
    return out


def page_geometry(page, layout):
    """every element of a built device page with its boxes, read from the objects (the bar from the layout: it is
    drawn by the parser)"""
    objs = {o.name: o for o in page.objs}
    slots = []
    for k, spec in enumerate(layout['slots'], 1):
        kind = spec['kind']
        icon, _ = slot_names(k, kind)
        slot = {'slot': k, 'kind': kind}
        if kind == 'status':
            slot['cell'] = dict(box(objs, icon), border=objs[icon].get('borderw'))
        else:
            if 'icon' in spec:
                slot['icon'] = box(objs, icon)
            slot['name'] = box(objs, f'tEntity{k}')
            if 'value' in spec:
                slot['value'] = box(objs, f'tValue{k}')
            if kind == 'progress':
                slot['bar'] = dict(zip('xywh', spec['bar']), border=1)
            if kind == 'switch':
                slot['toggle'] = box(objs, f'btOnOff{k}', False)
            if kind in HOTSPOT:
                slot['touch'] = box(objs, f'mSlot{k}', False)
            if k in layout.get('narrow', {}):
                # the second set of the row, shown instead of icon/name/value while the status block is shown
                slot['narrow'] = dict(zip(('icon', 'name', 'value'), (box(objs, n) for n in narrow_names(k))))
        slots.append(slot)
    return {
        'slotCount': len(slots), 'statusWidth': objs['tStatus'].get('w'),
        'strCommand': objs['strCommand'].get('txt_maxl'),
        'header': {'prev': box(objs, 'bPrev'), 'heading': box(objs, 'tHeading'), 'next': box(objs, 'bNext')},
        'main': {'icon': box(objs, 'bMain'), 'name': box(objs, 'tMainName')},
        'slots': slots,
        'status': box(objs, 'tStatus'), 'info': box(objs, 'bInfo'),
    }


def dump_json(value, indent=0):
    """JSON with a dict or list of plain values on one line"""
    pad = '  ' * (indent + 1)
    if isinstance(value, dict) and any(isinstance(v, (dict, list)) for v in value.values()):
        items = [f'{pad}{json.dumps(k)}: {dump_json(v, indent + 1)}' for k, v in value.items()]
        return '{\n' + ',\n'.join(items) + '\n' + '  ' * indent + '}'
    if isinstance(value, list) and any(isinstance(v, (dict, list)) for v in value):
        return '[\n' + ',\n'.join(pad + dump_json(v, indent + 1) for v in value) + '\n' + '  ' * indent + ']'
    return json.dumps(value, ensure_ascii=False)


def write_geometry(path, model, shift, layouts, pages):
    """sets the key of the model in the JSON file (the keys of the other models stay): stage, visible x range and
    per page every element with its boxes"""
    data = {}
    if os.path.exists(path):
        data = json.load(open(path, encoding='utf-8'))
    width, height = STAGE[model]
    data[model] = {
        'stage': {'w': width, 'h': height},
        'visible': {'x': VISIBLE[model][0], 'w': VISIBLE[model][1] - VISIBLE[model][0] + 1},
        'layout': 'portrait' if shift is None else 'landscape',
        'shiftX': shift or 0,
        'pages': {name: page_geometry(pages[name], layouts[name]) for name in PAGES},
    }
    data = {m: data[m] for m in MODELS if m in data}
    with open(path, 'w', encoding='utf-8') as out:
        out.write(dump_json(data) + '\n')
    print(f'geometry of {model} written to {path} (models in the file: {", ".join(data)})')


if __name__ == '__main__':
    args = sys.argv[1:]
    options = {}
    if '--fields' in args:
        args.remove('--fields')
        FIELDS_TABLE = True
    for option in ('--preview', '--geometry'):
        if option in args:
            i = args.index(option)
            options[option] = args[i + 1]
            del args[i:i + 2]
    if len(args) != 2:
        raise SystemExit(__doc__)
    main(args[0], args[1], options.get('--preview'), options.get('--geometry'))
