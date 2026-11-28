"""HMI 6.3.0 (EU, us-l, us-p): the device pages cardDevice1 'control', cardDevice2 'progress' and cardDevice3 'values'.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/card_device.py <in.HMI> <out.HMI> [--preview <dir>]
                                                              [--geometry <file.json>] [--fields]
--fields prints the bytes of every part of the longest entityUpd and devIcons (all buffers full / as the adapter
builds it).
Input: a 6.2.0 project of any model with the pages cardGrid and cardEntities (or the output of this script, 6.3.0).
The output must not exist.
Version: pageStartup tRelease 6.2.0 -> 6.3.0 (event,startup,<tVersion>,<model>,<tRelease>), 6.3.0 stays - the device
pages are the feature of 6.3.0, the adapter opens them from CARD_DEVICE_MIN_TFT (src/lib/pages/device-page.ts) on.
With --preview the script also writes a true-to-scale mock-up per page, drawn from the objects of each built page
with example content (robot vacuum, washing machine, car) and the fonts of the project (zilib.py); the area under
the frame is hatched. File names: EU <dir>/hmi-cardDevice2.png, the other models with their name
(hmi-us-l-cardDevice2.png); the pages with a status grid once per stage: hmi-cardDevice1-stage0..3.png,
hmi-cardDevice3-stage0..2.png (EXAMPLES[..]['stageIcons'] set cells).
With --geometry the script sets the key of the model ('eu', 'us-l', 'us-p') in the JSON file and keeps the other
keys: stage size, visible x range and per page every element with its boxes as they are in the built page
(x, y, w, h, font, alignment, buffer; roles: header prev/heading/next, main icon/name, per slot icon/name/value/
bar/toggle/touch and the sets B/C of an info row, status, info, the grid with its cells and the stages) plus
statusWidth, the width of the status line in px. doc/ideas/device-details/device-page-geometry.json is that file
for the device14 pages (the web panel builds its layouts from it, adapter and web panel test against it).

Models. The model is read from the project (detect_model: pageStartup sends event,startup,<version>,<model>,..),
never from the file name; the page size of cardGrid must fit it.
  eu    480 x 320, visible x 0..449: LAYOUTS.
  us-l  480 x 320, visible x 15..464: LAYOUTS with every x shifted. The shift is measured on the project: the
        header of cardGrid (bPrev, tHeading, bNext) lies 15 px right of the EU header (model_layouts stops if the
        three differ or do not match the visible area). Everything else is the EU page.
  us-p  320 x 480, all visible: LAYOUTS_PORTRAIT, the same elements in an arrangement of its own (header of
        cardGrid us-p, content x 10..309, status line 262 px wide instead of 390 with the info icon right of it):
        cardDevice1  icon top left with the name below, the two info rows over the full width, the four buttons
                     as 2 x 2; the status grid 8 x 2 over the full width where the info rows are, the info rows
                     then right of the icon as set C (icon + value). No set B.
        cardDevice2  icon and large value on top, bar over the full width, the three infos as rows, the button
                     over the full width.
        cardDevice3  icon on top in the middle, 2 x 3 info tiles, the two switches as rows; status cells pitch 36.
The same on every model (the adapter has constants for it): protocol and field order, number and kind of the slots,
devStatus, devIcons, the text buffers and strCommand of every page, fonts per role (font ids are the same on all
models; us-p fonts 0/2 are another face with other widths), touch behaviour. What differs is geometry only - the
adapter has to measure names, values and the status line with the widths of the model (geometry file).
check_area stops when a box (or the hotspot over an element) leaves the visible area or lies on a touch area the
page keeps from cardGrid - the arrows, the swipe strips, the hidden hotspot mSpecial in the header (on us-p it
reaches down to y 67) - and reports boxes of different elements that overlap in a stage in which both can be shown
(shown_stages) and congruent boxes (the editor warns 'Component overlap').
Copies never keep the editor group of their template (ungroup; us-p has grouped objects on cardGrid/cardEntities).

Each page is a fresh copy of cardGrid: header, arrows, swipe strips, tmSerial (receive, ack/CRC, pageType switch),
sleep timer, the long press of the arrows and the long press of the cells (tmLP, LPState) stay as they are; the six
cells of cardGrid are removed. A long press feedback of cardGrid (grid_long_press_feedback.py) is taken out of the
copy first and added again for the elements of the built page, so the input may or may not have it.
An existing cardDevice<n> is rebuilt from cardGrid in its own section, so running the script on its own output gives
the same pages again (idempotent). New pages are appended behind the last page of main.HMI (no page id moves). The
pageType switch of every page with tmSerial gets 'if(tId.txt=="cardDevice<n>") page cardDevice<n>' behind the
cardGrid3 branch (added once).

Protocol (device13):
  pageType~cardDevice<n>
  entityUpd~<heading>~<prev: 6 fields>~<next: 6 fields>~<main>~<slot 1>~..~<slot N>~<info>
  devStatus~<text>              only the status line: tStatus shows the text, nothing else is touched
  devIcons~<type>~<id>~<icon>~<color> x 16 (cardDevice1) / x 8 (cardDevice3): the status grid, see below
  every element has the 6 fields of a cardGrid cell: type~intName~icon~iconColor~displayName~optionalValue
  element e (main 0, slot k = k, info N+1) starts at field 14 + 6e. N and the kind of every slot are fixed per page:
    cardDevice1  N=6  info, info, button x 4 (info 56..61, the stage in field 61; the status icons come with
                 devIcons)
    cardDevice2  N=6  value, progress, info, info, info, button
    cardDevice3  N=8  info x 6, switch, switch (info 68..73, the stage in field 73)
  type      a number (TYPE_NAMES): 0 hidden, 1 only sends (text, button, switch, any other name), 2 shutter,
            3 shutter2, 4 input_sel, 5 timer (popup at the touch), 6 light, 7 light2, 8 fan, 9 number (popup after
            500 ms). The parser reads it with covx into the number variables type<k>/typeMain (measured: leading
            digits, else 0 - a name gives 0 = hidden). The navigation keeps its names (button, compared as in
            cardGrid); the info icon is hidden for 0 (covx into sys0).
  intName   at most 7 bytes ('999?999'), entn* txt_maxl 7; nent1/2 11 (bSubPrev, bSubNext, bUp, bHome).
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
  info      (the last element) small icon bottom right, icon/colour from the payload, hidden for type 0;
            tap: event,buttonPress2,<intName>,button (no long press). optionalValue = the STAGE of the status grid
            (cardDevice1 0..3, cardDevice3 0..2, empty = 0), clamped, kept in vStage.
  status grid (cardDevice1 16 cells 8 x 2, cardDevice3 8 cells 8 x 1): text cells tStat1..N with a 1 px border
            (style 1, colour 14823), neighbours overlap by 1 px; cell i belongs to column ceil(i / rows) (devIcons
            fills column by column: top, bottom, next column). devIcons sets type (covx), id, icon ('¬<font>'
            suffix) and colour of every cell; type 0 = empty cell (text empty, border stays, no tap). Shown are
            the columns up to the highest set cell, at most the columns of the stage (cardDevice1 0/3/5/8,
            cardDevice3 0/4/8): an empty cell in the last column keeps its border.
            Only columns that change are switched (vCols): first the ones to hide, from the right, then the ones to
            show. entityUpd hides the columns beyond the stage before it switches info rows or tiles.
  stage     cardDevice1: the info rows 1/2 come in sets (vis, x/w never change at runtime) - A wide (stage 0, the
            parser writes it), B icon + short name with the value of A (stage 1), C icon + value (stage 2), none
            (stage 3); the parser copies icon/font/colour, name and value into the set of the stage.
            us-p: A in stage 0, C right of the main icon in stages 1-2, none in 3.
            cardDevice3: tile 1 hidden from stage 1, tile 2 from stage 2, whatever entityUpd holds for them.
            An empty field is stage 0: no grid.

Touch: main, every slot, every cell and the icons of the sets behave like a cell of cardGrid (its down/up code and
tmLP/LPState, with the type as a number):
  touch     types 2..5 open their popup at once (no event). A button shows its pressed grey (bco2 14823) by
            itself; an element without a button gets the same grey from code (add_press_feedback): 'down' of a set
            status cell / hotspot sets bco=14823 of the cell / of the name field tEntity<k> (the text that blinks
            on a long press), its 'up' and tc0 'up' set defaultBcoColor back (the value of the 'load' loop, also
            what the long press restore writes). 'down' writes the type into vLPType for tmLP (tTmp, which tmLP
            read before, is overwritten by tmSerial while the finger is down).
  hold      after 500 ms (tmLP) types 6..9 open their popup (no event); every other type arms the long press
            (LPState=1) and the background of the element blinks green/grey, 200 ms per phase, until the release
            (grid_long_press_feedback.add): main/info/button the icon button, a cell itself, value/progress/switch
            (hotspot) the name field tEntity<k> - the bar of progress lies below it and is not redrawn. Type 1
            without an intName does not blink (it sends nothing). vaLPCell: cardDevice1 main 1, bEntity1-6 2-7,
            cells 8-23, set B 24/25, set C 26/27 (us-p C 24/25); cardDevice3 main 1, bEntity1-6 2-7, mSlot7/8 8/9,
            cells 10-17 (check_long_press_numbers).
  release   event,buttonPress2,<intName>,button - or event,buttonPress3,<intName>,button when the long press was
            armed. Type 1 without an intName sends nothing (kinds other than button).
  The popups get name, id, icon and icon colour in pageIcons.tTmp1/2/3 and tempIconColor; they do not know the
  calling page, their bExit goes to the adapter, which answers with the pageType of the page. A cell has no name
  (the popup has no heading); the icons of the sets give the full name of the row (tEntity<k>).
  Where the code lives: main/info/button and the set icons in the icon button (name and value forward with
  click <button>,1 / ,0; the value of set A forwards to the icon of set B in stage 1); a cell in the cell text
  itself; value, progress and the icon+name of a switch under a hotspot mSlot<k> (copy of a swipe strip, no
  picture) over the union of their objects (progress: name + bar). A hotspot or a cell stays touchable while its
  element is empty, so their code checks the type first (0: nothing).
  The switch btOnOff itself and the status line are not touched.

Buffers: ids (entn*) 7, nent1/2 11, names 31, values 31, set B name 15, set C value 19, status 63, icons 10
(cardDevice1 and every cell: 7), tSend 63. RAM per page (9 + 7 per object + text buffers) is printed; it must stay
<= 3584 with global and should keep RAM_MARGIN (the estimate was 131 bytes too low on cardDevice1).

strCommand is sized per page from its slots (message_fields, str_command_maxl): the longest entityUpd or devIcons
the new adapter really builds (type as a number, ids 7 bytes, the navigation 'button'/'bSubPrev', one icon 4 bytes
(devIcons: 7 with the font suffix), colour 5, names and values up to their buffers, button/switch value 0/1, the
stage 1 byte) plus 10 %, rounded up to 4k-1, at most 1019 (the display
takes 1017 bytes of payload). The other messages of the page (time, date, timeout, dimmode, pageType) are far
shorter. The receive code copies at most txt_maxl bytes into strCommand (clamp_receive): a longer message loses
its end, the CRC check, the delete of the frame and the acknowledgement use the whole frame in the serial buffer
and do not depend on the size of strCommand.
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

ID_LEN = 7  # ids '<page>?<n>' of the adapter, at most '999?999' (hmi-type-number.md)
NAV_ID_LEN = 11  # nent1/2: the adapter sends bSubPrev, bSubNext, bUp, bHome (at most 8, Navigation/Page.getNavigation)
NAME_LEN = 31
VALUE_LEN = 31
STATUS_LEN = 63
ICON_LEN = 10
ICON_NEED = 7  # one glyph (at most 4 bytes UTF-8) plus the font suffix '¬<digit>' (2 + 1)
TSEND_LEN = 63
STR_COMMAND_MAX = 1019  # the serial buffer of the display holds 1023 bytes, a payload is at most 1017
PAYLOAD_MAX = 1017
STR_COMMAND_RESERVE = 10  # percent on top of the longest real entityUpd
HEADING_LEN = 40  # tHeading
TMP_LEN = 10  # tTmp: types of the navigation and of the info icon, numbers
COLOR_LEN = 5  # 65535
REAL_ID = 7  # ids of the adapter '<page index>?<n>', at most '999?999'
REAL_NAV_ID = 8  # bSubPrev / bSubNext
REAL_ICON = 4  # one glyph, UTF-8
REAL_ICON_FONT = 7  # one glyph plus '¬<font>' (devIcons: the longest case)
RAM_GLOBAL = 436
RAM_LIMIT = 3584
RAM_TARGET = 3400
# the estimate was 131 bytes below the editor on cardDevice1 (device10): keep at least this much below the limit
RAM_MARGIN = 150

# the type of an element as a number (cardDevice1-3, hmi-type-number.md), read with covx (measured: leading digits,
# else 0); TYPE_NAMES: the names of cardGrid's code and their number (0 hidden, 1 every other type: only sends)
TYPE_NAMES = (('shutter', 2), ('shutter2', 3), ('input_sel', 4), ('timer', 5), ('light', 6), ('light2', 7),
              ('fan', 8), ('number', 9))
TOUCH_POPUPS = (('shutter', 'popupShutter'), ('shutter2', 'popupShutter2'), ('input_sel', 'popupInSel'),
                ('timer', 'popupTimer'))  # 2..5: popup at the touch
HOLD_POPUPS = (('light', 'popupLight'), ('light2', 'popupLight2'), ('fan', 'popupFan'),
               ('number', 'popupSlider'))  # 6..9: popup after 500 ms (tmLP)
TYPE_NUMBER = dict(TYPE_NAMES, text=1)
LP_TYPE = 'vLPType'  # number variable: the type of the touched element for tmLP (tTmp is overwritten by tmSerial)
STAGE_VAR = 'vStage'  # stage of the status icons: field 6 of the info element of entityUpd
COLS_VAR = 'vCols'  # columns of the status grid that are shown now
ICONS_COMMAND = 'devIcons'  # devIcons~<type>~<id>~<icon>~<color> per cell: the status icons
ICON_FIELDS = 4

OLD_RELEASE, NEW_RELEASE = '6.2.0', '6.3.0'  # pageStartup.tRelease

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


# status grid (devIcons): text cells with a 1 px border (text style 1); neighbours overlap by 1 px, so the borders
# form the outer frame plus the lines in between. The cells are filled column by column (top, bottom, next column);
# a column is shown when the highest set cell reaches it, at most the columns of the stage.
# Measured on the zi table: the font 1 icons have their ink in rows 6..28 of the 32 px glyph (median of all 7459
# icons), so the info row icons (box y 76/120, h 34, ycen) show their ink at y 83..105 and 127..149, pitch 44.
# A cell of 45 px (1 px overlap -> pitch 44) at y 71/115 puts the status icons on exactly the same lines as the
# info icons: one grid row per info row (cardDevice1 EU/us-l).
GRID_COLOR = 14823  # the grey of the pie lines of cardPChart and of the pressed buttons (bco2)


def grid(columns, rows, x0, y0, pitch, w, h, font=1):
    """the cells of a status grid in the order of devIcons: column by column, top to bottom"""
    return [(x0 + pitch * c, y0 + (h - 1) * r, w, h, font) for c in range(columns) for r in range(rows)]


def info_sets(x_icon_b, x_name_b, w_name_b, x_icon_c, x_value_c, w_value_c, ys):
    """the narrower sets of the info rows 1/2 of cardDevice1: B icon + short name (the value is tValue<k> of the
    wide set A), C icon + value (no name); None leaves a set out"""
    out = {}
    for k, y in enumerate(ys, 1):
        sets = {}
        if x_icon_b is not None:
            sets['B'] = {'icon': (x_icon_b, y, 36, 34, 1), 'name': (x_name_b, y + 4, w_name_b, 26, 0, 0)}
        sets['C'] = {'icon': (x_icon_c, y, 36, 34, 1), 'value': (x_value_c, y + 4, w_value_c, 26, 0, 2)}
        out[k] = sets
    return out


SET_NAME_LEN = 15  # name of set B (43 px)
SET_VALUE_LEN = 19  # value of set C (81 px eu/us-l, 106 px us-p)


# landscape (EU; us-l with every x shifted)
LAYOUTS = {
    # control: icon top left, two info rows right of it, four buttons; status grid up to 8 x 2 between icon and
    # info rows, the stage (field 6 of info) chooses the set of the info rows:
    #   stage 0  no grid, set A (wide, as before)          stage 1  up to 3 columns, set B (icon, short name, value)
    #   stage 2  up to 5 columns, set C (icon, value)       stage 3  up to 8 columns, no info rows
    'cardDevice1': {
        'main': (10, 68, 110, 86, 4), 'mainName': (10, 156, 110, 26, 0, 1), 'statusXcen': 1,
        # the tightest page: its icon buffers hold exactly what an icon needs (ICON_NEED), 4 bytes less each
        'iconLen': ICON_NEED,
        'slots': [info_row(126, 76, 314), info_row(126, 120, 314)] + [button(10 + 108 * k, 190, 104) for k in range(4)],
        'cells': grid(8, 2, 124, 71, 37, 38, 45), 'gridRows': 2, 'stageColumns': (0, 3, 5, 8),
        # B: icon 11 px behind column 3 (236), name 2 px behind the icon up to tValue (330); C: icon 11 px behind
        # column 5 (310), value up to 440. 11 px, not the 5 px between grid and icon: with the pitch of the grid the
        # icon of the row looked like one more column
        'sets': info_sets(247, 285, 43, 321, 359, 81, (76, 120)),
        'setStages': {'A': (0,), 'B': (1,), 'C': (2,)}, 'sharedValue': 'B',
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
    # values: icon left, 2 x 3 info tiles, two switches; status grid up to 8 x 1 in the first row of tiles:
    #   stage 0  no grid       stage 1  up to 4 cells, tile 1 hidden       stage 2  up to 8 cells, tiles 1 and 2 hidden
    'cardDevice3': {
        'main': (10, 67, 100, 82, 4), 'mainName': (10, 151, 100, 26, 0, 1), 'statusXcen': 1,
        'slots': [info_tile(114 + 163 * (k % 2), 67 + 52 * (k // 2), 161) for k in range(6)]
        + [switch_row(10, 228, 213), switch_row(226, 228, 213)],
        'cells': grid(8, 1, 114, 67, 37, 38, 52), 'gridRows': 1, 'stageColumns': (0, 4, 8),
        'covered': {1: 1, 2: 2},  # slot: the stage from which the grid covers it
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
    # control: icon top left with the name below, two info rows over the full width, the four buttons as 2 x 2
    # (148 px each). Status grid 8 x 2 over the full width where the info rows are (P2 of status-grid-8x2.md); with
    # a grid (stage 1-2) the info rows move right of the main icon as set C (icon + value, no name), stage 3 hides
    # them; stage 0 shows the wide rows (set A) as before. No set B.
    'cardDevice1': {
        'main': (10, 70, 150, 86, 4), 'mainName': (10, 158, 150, 26, 0, 1), 'statusXcen': 1,
        'iconLen': ICON_NEED,
        'slots': [info_row(10, 190, 300), info_row(10, 230, 300)]
        + [button(10 + 152 * (k % 2), 272 + 86 * (k // 2), 148) for k in range(4)],
        'cells': grid(8, 2, 10, 188, 37, 38, 41), 'gridRows': 2, 'stageColumns': (0, 3, 5, 8),
        'sets': info_sets(None, None, None, 166, 204, 106, (76, 120)),
        'setStages': {'A': (0,), 'C': (1, 2)}, 'sharedValue': None,
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
    # as rows. Icon and name start at y 68 / 152 as on cardDevice2: mSpecial of us-p (x 174..256) reaches down to
    # y 67. Status grid in the first row of tiles, pitch 36 (4 cells of 37 px fit the 148 px of a tile).
    'cardDevice3': {
        'main': (85, 68, 150, 82, 4), 'mainName': (10, 152, 300, 26, 0, 1), 'statusXcen': 1,
        'slots': [info_tile(10 + 152 * (k % 2), 182 + 52 * (k // 2), 148) for k in range(6)]
        + [switch_row(10, 342, 300), switch_row(10, 394, 300)],
        'cells': grid(8, 1, 10, 182, 36, 37, 51), 'gridRows': 1, 'stageColumns': (0, 4, 8),
        'covered': {1: 1, 2: 2},
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
    return {k: (move(v) if k in ('main', 'mainName', 'slots', 'cells', 'sets', 'status', 'info') else v)
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
    """every box of the layout (and every hotspot over an element) lies on the stage, in the visible x range and
    off every touch area the page keeps from cardGrid: the arrows bPrev/bNext, the swipe strips and the hidden
    hotspot mSpecial in the header (us-p: y 1..67, one row lower than on EU and us-l) - SystemExit otherwise.
    Returns notes about boxes of different elements that overlap and can be shown in the same stage (neighbouring
    cells of the grid are meant to overlap; the grid, the sets of an info row and covered tiles are never shown
    together where they overlap, see shown_stages)."""
    width, height = STAGE[model]
    x0, x1 = VISIBLE[model]
    name = page.objs[0].name
    shown = shown_stages(layout)
    boxes = [('main', 'bMain', layout['main'][:4]), ('main', 'tMainName', layout['mainName'][:4]),
             ('status', 'tStatus', layout['status'][:4]), ('info', 'bInfo', layout['info'][:4])]
    for k, spec in enumerate(layout['slots'], 1):
        icon, names = slot_names(k, spec['kind'])
        objs = dict(zip(('icon', 'name', 'value'), (icon, f'tEntity{k}', f'tValue{k}')))
        objs.update(switch=f'btOnOff{k}', bar=f'bar{k}')
        boxes += [(f'slot {k}', objs[n], spec[n][:4]) for n in ('icon', 'name', 'value', 'bar', 'switch') if n in spec]
        if spec['kind'] in HOTSPOT:
            boxes.append((f'slot {k}', f'mSlot{k}', hotspot_rect(spec)))
    for k, sets in layout.get('sets', {}).items():
        for letter, spec in sets.items():
            boxes += [(f'slot {k} set {letter}', obj, spec[part][:4]) for part, obj in set_names(k, letter).items()
                      if part in spec]
    for i, cell in enumerate(layout.get('cells', []), 1):
        boxes.append(('status grid', cell_names(i)[0], cell[:4]))
    new = {obj for _, obj, _ in boxes}
    # what takes a touch and is not built here: buttons (98) and hotspots (109) of the cardGrid copy
    strips = [(o.name, (o.get('x'), o.get('y'), o.get('w'), o.get('h'))) for o in page.objs
              if o.name not in new and o.has('x') and o.get('type') in (98, 109)]
    if not {'bPrev', 'bNext', 'mSwipePrev', 'mSwipeNext'} <= {n for n, _ in strips}:
        raise SystemExit(f'{name}: the arrows and swipe strips of {SOURCE} are missing')

    def hit(a, b):
        return a[0] < b[0] + b[2] and b[0] < a[0] + a[2] and a[1] < b[1] + b[3] and b[1] < a[1] + a[3]
    for group, obj, box in boxes:
        if box[0] < x0 or box[0] + box[2] - 1 > x1 or box[1] < 0 or box[1] + box[3] > height or box[0] + box[2] > width:
            raise SystemExit(f'{name}: {group} {obj} {box} is outside of the visible area x {x0}..{x1}, '
                             f'y 0..{height - 1}')
        for strip, rect in strips:
            if hit(box, rect):
                raise SystemExit(f'{name}: {group} {obj} {box} lies on {strip} {rect}')
    notes = []
    for i, (ga, oa, a) in enumerate(boxes):
        for gb, ob, b in boxes[i + 1:]:
            if a == b and oa != ob:
                notes.append(f'{oa} and {ob} are congruent {a} (editor: Component overlap)')
            if ga == gb or not hit(a, b):
                continue
            together = shown.get(oa, ALL) & shown.get(ob, ALL)
            if together:
                notes.append(f'{ga} {oa} {a} / {gb} {ob} {b} (stage {sorted(together)})')
    return notes


ALL = frozenset(range(4))


def stages(layout):
    """the stages of the page: 0 = no status grid, 1.. = the grid with up to stageColumns[s] columns"""
    return range(len(layout.get('stageColumns', (0,))))


def shown_stages(layout):
    """{object: stages in which it can be visible} for the objects that depend on the stage: the cells (their
    column within stageColumns), the sets of the info rows (setStages; the value of set A is the one of set B as
    well), tiles covered by the grid (covered); objects not listed are shown in every stage"""
    out = {}
    cols = layout.get('stageColumns', ())
    rows = layout.get('gridRows', 1)
    for i, _ in enumerate(layout.get('cells', []), 1):
        out[cell_names(i)[0]] = frozenset(s for s in stages(layout) if cols[s] >= (i - 1) // rows + 1)
    for k, sets in layout.get('sets', {}).items():
        spec = layout['slots'][k - 1]
        icon, names = slot_names(k, spec['kind'])
        set_a = frozenset(layout['setStages']['A'])
        for obj in names:
            out[obj] = set_a
        if layout.get('sharedValue'):
            out[f'tValue{k}'] = set_a | frozenset(layout['setStages'][layout['sharedValue']])
        for letter in sets:
            for obj in set_names(k, letter).values():
                out.setdefault(obj, frozenset(layout['setStages'][letter]))
    for k, first in layout.get('covered', {}).items():
        spec = layout['slots'][k - 1]
        for obj in slot_names(k, spec['kind'])[1]:
            out[obj] = frozenset(s for s in stages(layout) if s < first)
    return out


def cell_names(i):
    """cell i of the status grid: text, type (number), id"""
    return f'tStat{i}', f'typeStat{i}', f'entnStat{i}'


def set_names(k, letter):
    """{part: object} of set B / C of info row k; B uses the value of the wide set A"""
    if letter == 'B':
        return {'icon': f'bEntityB{k}', 'name': f'tEntityB{k}', 'value': f'tValue{k}'}
    return {'icon': f'bEntityC{k}', 'value': f'tValueC{k}'}


def own_set_names(k, letter):
    """the objects a set has of its own (without the shared value)"""
    return [o for part, o in set_names(k, letter).items() if not (letter == 'B' and part == 'value')]


TAPPED = ('info', 'button')
HOTSPOT = ('value', 'progress', 'switch')  # elements without a button: a hotspot carries the cell code


# ---------------------------------------------------------------- size of strCommand
# the 6 fields of an element in bytes: (type, intName, icon, iconColor, displayName, optionalValue)
# BUFFER: what the page keeps of every field (txt_maxl of its target, 0 = the field is not read); the type goes
#         through tTmp (covx), the stage in field 6 of info as well
# REAL:   what the adapter really sends: the type as a number (1 byte), id 7, one icon, names/values up to the
#         buffer, the navigation as text (button, bSubPrev)
BUFFER = {
    'nav': (TMP_LEN, NAV_ID_LEN, ICON_LEN, COLOR_LEN, 0, 0),
    'main': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, STATUS_LEN),
    'info': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'value': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'progress': (TMP_LEN, ID_LEN, 0, COLOR_LEN, NAME_LEN, TMP_LEN),
    'button': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, 0),
    'switch': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, NAME_LEN, TMP_LEN),
    'infoIcon': (TMP_LEN, ID_LEN, ICON_LEN, COLOR_LEN, 0, TMP_LEN),
}
REAL = {
    'nav': (len('button'), REAL_NAV_ID, REAL_ICON, COLOR_LEN, 0, 0),
    'main': (1, REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, STATUS_LEN),
    'info': (1, REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'value': (1, REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, VALUE_LEN),
    'progress': (1, REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, len('100')),
    'button': (1, REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, 1),
    'switch': (1, REAL_ID, REAL_ICON, COLOR_LEN, NAME_LEN, 1),
    'infoIcon': (1, REAL_ID, REAL_ICON, COLOR_LEN, 0, 1),  # field 6: the stage 0..3
}
# devIcons: 4 fields per cell (type, id, icon, colour)
ICON_BUFFER = (TMP_LEN, ID_LEN, ICON_NEED, COLOR_LEN)
ICON_REAL = (1, REAL_ID, REAL_ICON_FONT, COLOR_LEN)


def icons_fields(layout, real):
    """[(part, bytes of its fields)] of the longest devIcons of the page (every cell set)"""
    cell = ICON_REAL if real else tuple(max(b, r) for b, r in zip(ICON_BUFFER, ICON_REAL))
    return [(ICONS_COMMAND, (len(ICONS_COMMAND),))] + [(f'cell {i}', cell)
                                                      for i in range(1, len(layout.get('cells', [])) + 1)]


def icons_len(layout, real):
    fields = [n for _, part in icons_fields(layout, real) for n in part]
    return sum(fields) + len(fields) - 1


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
    need = -(-max(message_len(layout, True), icons_len(layout, True)) * (100 + STR_COMMAND_RESERVE) // 100)
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
    return numeric(out, typ)


def numeric(lines, typ):
    """the type of the element as a number: tmLP gets it in its own number variable, the popups at the touch
    compare the number (TYPE_NUMBER)"""
    out = []
    for line in lines:
        ind = line[:len(line) - len(line.lstrip())]
        code = line.strip()
        if code == f'tTmp.txt={typ}.txt':
            line = f'{ind}{LP_TYPE}.val={typ}.val'
        m = re.fullmatch(rf'if\({typ}\.txt=="(\w+)"\)', code)
        if m:
            line = f'{ind}if({typ}.val=={TYPE_NUMBER[m.group(1)]})'
        if re.search(rf'\b{typ}\.txt\b', line):
            raise SystemExit(f'{SOURCE}.bEntity1.down: the type is used as text: {code}')
        out.append(line)
    return out


def cell_up(up1, typ, entn, text_guard=True):
    """the up code of cardGrid bEntity1 (buttonPress2, or buttonPress3 after a long press) with other names;
    text_guard: type text without an intName has nothing to report and sends nothing"""
    lines = [re.sub(r'\bentn1\b', entn, x) for x in up1]
    if not text_guard:
        return lines
    body = [x for x in lines[1:] if x.strip() != 'LPState.val=0']
    return ([lines[0], '// every type sends, type 1 (text and the other types that only send) only with an intName '
             '(card_device.py)', f'if({typ}.val!=1||{entn}.txt!="")', '{'] + ['  ' + x for x in body]
            + ['}', 'LPState.val=0'])


def if_shown(typ, lines, keep_first=0, keep_last=0):
    """lines inside 'the element is not empty' - for objects that stay touchable while their element is empty"""
    end = len(lines) - keep_last
    return (lines[:keep_first] + ['// an empty element (type 0) does nothing (card_device.py)',
                                  f'if({typ}.val!=0)', '{']
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
    icon = f'bEntity{k}' if kind in TAPPED else f'tIcon{k}'
    names = {'info': [icon, f'tEntity{k}', f'tValue{k}'], 'value': [icon, f'tEntity{k}', f'tValue{k}'],
             'progress': [f'tEntity{k}'], 'button': [icon, f'tEntity{k}'],
             'switch': [icon, f'tEntity{k}', f'btOnOff{k}']}[kind]
    return icon, names


def stage_condition(var, values):
    """if() condition 'var is one of the contiguous values' (Nextion: only && or only ||, no expressions)"""
    lo, hi = min(values), max(values)
    if sorted(values) != list(range(lo, hi + 1)):
        raise SystemExit(f'stages {values} are not contiguous')
    return f'{var}.val=={lo}' if lo == hi else f'{var}.val>={lo}&&{var}.val<={hi}'


def make_number(template, name):
    """a number variable (copy of vLPNavState: sta 0, val 0)"""
    o = ungroup(template.copy())
    o.set('objname', name)
    o.set('val', 0)
    return o


def tapped_icon(button_t, down1, up1, k, icon, spec, name):
    """an icon button with the code of a cardGrid cell for the type/id of slot k; name: the text the popup gets as
    its heading"""
    b = make_button(button_t, icon, spec)
    b.set_code('down', cell_down(down1, f'type{k}', f'entn{k}', name, icon))
    b.set_code('up', cell_up(up1, f'type{k}', f'entn{k}'))
    return b


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
    num_t = src['vLPNavState']
    if spot_t.get('type') != 109:
        raise SystemExit('mSwipeNext is not a hotspot')
    if num_t.get('type') != 52 or num_t.get('sta') != 0:
        raise SystemExit('vLPNavState is not a number variable')
    typed = range(1, len(layout['slots']) + 1)
    shared = layout.get('sharedValue')
    hotspots = []

    main = make_button(button_t, 'bMain', layout['main'])
    main.set_code('down', cell_down(down1, 'typeMain', 'entnMain', 'tMainName', 'bMain'))
    main.set_code('up', cell_up(up1, 'typeMain', 'entnMain'))
    main_name = make_text(text_t, 'tMainName', layout['mainName'], NAME_LEN)
    forward(main_name, 'bMain')
    visible = [main, main_name]
    variables = [make_number(num_t, 'typeMain'), make_var(var_t, 'entnMain', ID_LEN)]
    for k in typed:
        spec = layout['slots'][k - 1]
        kind = spec['kind']
        icon, _ = slot_names(k, kind)
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
        value = None
        if 'value' in spec:
            value = make_text(text_t, f'tValue{k}', spec['value'], VALUE_LEN)
            visible.append(value)
        if kind in TAPPED:
            forward(name, icon)
            if value is not None:
                forward(value, icon)
                if shared and k in layout.get('sets', {}):
                    # the value is also the value of set B: in that stage its tap goes to the icon of set B
                    other = set_names(k, shared)['icon']
                    cond = stage_condition(STAGE_VAR, layout['setStages'][shared])
                    for event, state in (('down', 1), ('up', 0)):
                        value.set_code(event, [f'if({cond})', '{', f'  click {other},{state}', '}else', '{',
                                               f'  click {icon},{state}', '}'])
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
        variables += [make_number(num_t, f'type{k}')]
        if f'entn{k}' not in src:
            variables.append(make_var(var_t, f'entn{k}', ID_LEN))
    visible.append(make_text(text_t, 'tStatus', layout['status'] + (0, layout['statusXcen']), STATUS_LEN))
    info = make_button(button_t, 'bInfo', layout['info'])
    info.set_code('down', [])
    info.set_code('up', send_lines('entnInfo'))
    visible.append(info)
    variables.append(make_var(var_t, 'entnInfo', ID_LEN))
    # status grid: the cells carry the code themselves; an empty cell keeps its border (no tap)
    cells = []
    for i, (x, y, w, h, font) in enumerate(layout.get('cells', []), 1):
        cell_n, typ, entn = cell_names(i)
        cell = make_text(text_t, cell_n, (x, y, w, h, font, 1), ICON_NEED)
        cell.set('style', 1)  # border, as the icons of cardPower
        cell.set('borderw', 1)
        cell.set('borderc', GRID_COLOR)
        # a status icon has no name (devIcons carries none): a popup opened from the cell has no heading
        cell.set_code('down', if_shown(typ, cell_down(down1, typ, entn, None, cell_n)))
        cell.set_code('up', if_shown(typ, cell_up(up1, typ, entn), 1, 1))
        cells.append(cell)
        variables += [make_number(num_t, typ), make_var(var_t, entn, ID_LEN)]
    # the other sets of the info rows (cardDevice1): B then C, so that their long press numbers follow the cells
    sets = []
    for letter in ('B', 'C'):
        for k, row in layout.get('sets', {}).items():
            if letter not in row:
                continue
            if layout['slots'][k - 1]['kind'] != 'info':
                raise SystemExit(f'set {letter} for slot {k}, which is no info row')
            names = set_names(k, letter)
            # the popup gets the full name of the row (tEntity<k> keeps it while it is hidden)
            sets.append(tapped_icon(button_t, down1, up1, k, names['icon'], row[letter]['icon'], f'tEntity{k}'))
            for part, maxl in (('name', SET_NAME_LEN), ('value', SET_VALUE_LEN)):
                if part in row[letter]:
                    text = make_text(text_t, names[part], row[letter][part], maxl)
                    forward(text, names['icon'])
                    sets.append(text)
    visible += hotspots + cells + sets
    # the icon buffers of the page (the only buffers of ICON_LEN among the new objects)
    for o in visible:
        if o.has('txt_maxl') and o.get('txt_maxl') == ICON_LEN:
            o.set('txt_maxl', layout.get('iconLen', ICON_LEN))
    if cells:
        variables += [make_number(num_t, STAGE_VAR), make_number(num_t, COLS_VAR)]
    variables.append(make_number(num_t, LP_TYPE))

    keep = [o for o in page.objs if not REMOVE.fullmatch(o.name) and not re.fullmatch(r'type\d+', o.name)]
    at = keep.index(src['tc0']) + 1  # the cells of cardGrid start behind tc0, the swipe strips stay on top
    page.objs = keep[:at] + visible + variables + keep[at:]
    for o in page.objs:
        m = re.fullmatch(r'(type|entn)(\d+)', o.name)
        if m and int(m.group(2)) > len(typed):
            raise SystemExit(f'{o.name}: more slots in cardGrid than on the page')
        if o.name.startswith('entn'):
            o.set('txt_maxl', ID_LEN)
    for n in ('nent1', 'nent2'):
        page.obj(n).set('txt_maxl', NAV_ID_LEN)
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


def cap_lines(ind, layout):
    """sys2 (columns) at most the columns of the stage"""
    i = ind + '  '
    out = [f'{ind}sys1=0']
    for stage, cols in enumerate(layout['stageColumns'][1:], 1):
        out += [f'{ind}if({STAGE_VAR}.val=={stage})', f'{ind}{{', f'{i}sys1={cols}', f'{ind}}}']
    return out + [f'{ind}if(sys2>sys1)', f'{ind}{{', f'{i}sys2=sys1', f'{ind}}}']


def columns_lines(ind, layout):
    """show the columns 1..sys2 of the grid: only those that change, first the ones to hide (from the right), then
    the ones to show; vCols keeps the number shown"""
    i = ind + '  '
    rows = layout['gridRows']
    n = len(layout['cells']) // rows
    col = {c: [cell_names((c - 1) * rows + r)[0] for r in range(1, rows + 1)] for c in range(1, n + 1)}
    out = []
    for c in range(n, 0, -1):
        out += ([f'{ind}if(sys2<{c}&&{COLS_VAR}.val>={c})', f'{ind}{{'] + [f'{i}vis {x},0' for x in col[c]]
                + [f'{ind}}}'])
    for c in range(1, n + 1):
        out += ([f'{ind}if(sys2>={c}&&{COLS_VAR}.val<{c})', f'{ind}{{'] + [f'{i}vis {x},1' for x in col[c]]
                + [f'{ind}}}'])
    return out + [f'{ind}{COLS_VAR}.val=sys2']


def stage_lines(ind, layout, info_first):
    """the stage from field 6 of info (empty: 0), clamped; then the columns beyond it off"""
    i = ind + '  '
    top = len(layout['stageColumns']) - 1
    return [f'{ind}// stage of the status grid = field 6 of info (card_device.py): 0 no grid, 1..{top} up to '
            + '/'.join(map(str, layout['stageColumns'][1:])) + ' columns; empty 0',
            f'{ind}spstr strCommand.txt,tTmp.txt,"~",{info_first + 5}',
            f'{ind}covx tTmp.txt,{STAGE_VAR}.val,0,0',
            f'{ind}if({STAGE_VAR}.val<0)', f'{ind}{{', f'{i}{STAGE_VAR}.val=0', f'{ind}}}',
            f'{ind}if({STAGE_VAR}.val>{top})', f'{ind}{{', f'{i}{STAGE_VAR}.val={top}', f'{ind}}}',
            f'{ind}// the columns beyond the stage off (devIcons shows the set ones), before the info rows / tiles',
            f'{ind}sys2={COLS_VAR}.val'] + cap_lines(ind, layout) + columns_lines(ind, layout)


def icons_lines(ind, layout):
    """branch devIcons~<type>~<id>~<icon>~<color> x N: cell i from field 1+4(i-1); type 0 = empty cell (border
    stays); the grid shows the columns up to the highest set cell, at most those of the stage"""
    i = ind + '  '
    j = ind + '    '
    rows = layout['gridRows']
    out = [f'{ind}if(tInstruction.txt=="{ICONS_COMMAND}")', f'{ind}{{',
           f'{i}// {ICONS_COMMAND}~<type>~<id>~<icon>~<color> per cell, column by column (card_device.py); '
           'type 0: empty',
           f'{i}sys2=0']
    for n, cell in enumerate(layout['cells'], 1):
        obj, typ, entn = cell_names(n)
        f = 1 + ICON_FIELDS * (n - 1)
        out += [f'{i}spstr strCommand.txt,tTmp.txt,"~",{f}',
                f'{i}covx tTmp.txt,{typ}.val,0,0',
                f'{i}spstr strCommand.txt,{entn}.txt,"~",{f + 1}',
                f'{i}if({typ}.val==0)', f'{i}{{', f'{j}{obj}.txt=""', f'{i}}}else', f'{i}{{']
        out += icon_lines(j, f + 2, obj, cell[4]) + [f'{j}sys2={n}', f'{i}}}']
    out.append(f'{i}// columns up to the highest set cell' + (f' ({rows} per column)' if rows > 1 else '')
               + ', at most those of the stage')
    if rows > 1:
        out += [f'{i}sys2=sys2+{rows - 1}', f'{i}sys2=sys2/{rows}']
    return out + cap_lines(i, layout) + columns_lines(i, layout) + [f'{ind}}}']


def set_show_lines(k, layout):
    """info row k with the sets B/C (cardDevice1): copy icon/name/value of set A into the set of the stage, hide
    the objects of the other sets, then show the set (the value of set B is the one of set A)"""
    spec = layout['slots'][k - 1]
    _, wide = slot_names(k, spec['kind'])
    row = layout['sets'][k]
    shared = layout.get('sharedValue')
    members = {'A': list(wide)}
    for letter in row:
        members[letter] = list(set_names(k, letter).values()) if letter == shared else own_set_names(k, letter)
    every = [o for objs in members.values() for o in objs]
    out = []
    for letter, objs in members.items():
        copy = []
        if letter != 'A':
            names = set_names(k, letter)
            copy = [f'{names["icon"]}.txt=bEntity{k}.txt', f'{names["icon"]}.font=bEntity{k}.font',
                    f'{names["icon"]}.pco=bEntity{k}.pco']
            if 'name' in row[letter]:
                copy.append(f'{names["name"]}.txt=tEntity{k}.txt')
            if 'value' in row[letter]:
                copy.append(f'{names["value"]}.txt=tValue{k}.txt')
        hide = [o for o in dict.fromkeys(every) if o not in objs]
        out += [f'if({stage_condition(STAGE_VAR, layout["setStages"][letter])})', '{']
        out += ['  ' + x for x in copy] + [f'  vis {o},0' for o in hide] + [f'  vis {o},1' for o in objs] + ['}']
    return out


def set_objects(k, layout):
    """every object of info row k and its sets"""
    spec = layout['slots'][k - 1]
    out = list(slot_names(k, spec['kind'])[1])
    for letter in layout.get('sets', {}).get(k, {}):
        out += own_set_names(k, letter)
    return out


def element_lines(ind, first, typ, cond, entn, hide, body, hidden_extra=(), show=None):
    """one element: type as a number (covx), id, then hidden when cond (type 0, or covered by the stage), else body
    and show (default: vis 1 for everything in hide)"""
    i = ind + '  '
    out = [f'{ind}spstr strCommand.txt,tTmp.txt,"~",{first}',
           f'{ind}covx tTmp.txt,{typ}.val,0,0',
           f'{ind}spstr strCommand.txt,{entn}.txt,"~",{first + 1}',
           f'{ind}if({cond})',
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
    if layout.get('cells'):
        out += stage_lines(ind, layout, info_first)
    body = icon_lines('', FIRST + 2, 'bMain', layout['main'][4])
    body.append(f'spstr strCommand.txt,tMainName.txt,"~",{FIRST + 4}')
    out += element_lines(ind, FIRST, 'typeMain', 'typeMain.val==0', 'entnMain', ['bMain', 'tMainName'], body)
    sets = layout.get('sets', {})
    covered = layout.get('covered', {})
    for k, spec in enumerate(slots, 1):
        first = FIRST + FIELDS * k
        _, hide = slot_names(k, spec['kind'])
        extra = bar_lines('', first, spec['bar'], True) if spec['kind'] == 'progress' else ()
        cond = f'type{k}.val==0'
        note = ''
        show = None
        if k in sets:
            hide = set_objects(k, layout)
            show = set_show_lines(k, layout)
            shown = {s for v in layout['setStages'].values() for s in v}
            off = [s for s in stages(layout) if s not in shown]
            if off:
                if off != list(range(min(off), len(stages(layout)))):
                    raise SystemExit(f'slot {k}: info rows off in stages {off}')
                cond += f'||{STAGE_VAR}.val>={min(off)}'
            note = ' (sets ' + ', '.join(f'{x} stage {"/".join(map(str, v))}'
                                         for x, v in layout['setStages'].items()) + (f', off from stage {min(off)}'
                                                                                    if off else '') + ')'
        if k in covered:
            cond += f'||{STAGE_VAR}.val>={covered[k]}'
            note = f' (covered by the status grid from stage {covered[k]})'
        out.append(f'{ind}// slot {k}: {spec["kind"]}{note}')
        out += element_lines(ind, first, f'type{k}', cond, f'entn{k}', hide, slot_body(k, spec, first), extra, show)
    i = ind + '  '
    out += [f'{ind}// info icon' + (' (field 6: the stage)' if layout.get('cells') else ''),
            f'{ind}spstr strCommand.txt,tTmp.txt,"~",{info_first}',
            f'{ind}covx tTmp.txt,sys0,0,0',
            f'{ind}if(sys0==0)',
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
    if layout.get('cells'):
        # the status icons: their own branch as well (the other pages have none and only acknowledge it)
        at = find(lines, 'if(tInstruction.txt=="pageType")', start)
        lines[at:at] = icons_lines(outer, layout)
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
        hide += set_objects(k, layout) if k in layout.get('sets', {}) else slot_names(k, spec['kind'])[1]
    hide += [cell_names(i)[0] for i in range(1, len(layout.get('cells', [])) + 1)]
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


PRESS_BEGIN = '// >> press feedback (card_device.py)'
PRESS_END = '// << press feedback'
BACKGROUND = 'defaultBcoColor'  # what the 'load' loop gives every button and text (b[sys0].bco)


def press_targets(layout):
    """{touched object: text that shows the pressed grey}: the elements without a button - a status cell itself, a
    hotspot the name field of its element (the same text that blinks for it on a long press)"""
    out = {}
    for k, spec in enumerate(layout['slots'], 1):
        if spec['kind'] in HOTSPOT:
            out[f'mSlot{k}'] = (f'tEntity{k}', f'type{k}')
    for i in range(1, len(layout.get('cells', [])) + 1):
        cell, typ, _ = cell_names(i)
        out[cell] = (cell, typ)
    return out


def add_press_feedback(page, layout):
    """tap feedback for the elements without a button (a button shows its bco2 by itself): 'down' of a set element
    paints the text grey (GRID_COLOR, bco2 of the pressed buttons), 'up' gives it the background of the 'load' loop
    back, and so does tc0 'up' (every release, also one the element does not get), there only where it is grey.
    Runs behind feedback.add (its check allows no other writer of a background); the long press blinking starts
    from the grey (first phase green) and its restore sets the same background."""
    targets = press_targets(layout)
    for obj, (text, typ) in targets.items():
        o = page.obj(obj)
        down = o.code('down')
        guard = find(down, f'if({typ}.val!=0)')
        if down[guard + 1].strip() != '{':
            raise SystemExit(f'{obj}.down: unexpected guard')
        down[guard + 2:guard + 2] = ['  ' + PRESS_BEGIN, f'  {text}.bco={GRID_COLOR}', '  ' + PRESS_END]
        up = o.code('up')
        if up[0] != 'tmLP.en=0':
            raise SystemExit(f'{obj}.up: unexpected first line')
        up[1:1] = [PRESS_BEGIN, f'{text}.bco={BACKGROUND}', PRESS_END]
    lines = []
    for text, _ in targets.values():
        lines += [f'if({text}.bco!={BACKGROUND})', '{', f'  {text}.bco={BACKGROUND}', '}']
    if lines:
        page.obj('tc0').code('up').extend([PRESS_BEGIN] + lines + [PRESS_END])
    return [f'{o} -> {t}' if o != t else o for o, (t, _) in targets.items()]


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
    check_long_press_numbers(name, layout, blink)
    hold_popups_numeric(page)
    press = add_press_feedback(page, layout)
    check_names(page)
    check_numeric(page)
    return page, layout, blink, press


def hold_popups_numeric(page):
    """tmLP opens the hold popups from its own number variable (the touched element writes its type there)
    instead of tTmp, which tmSerial overwrites while the finger is down"""
    timer = page.obj('tmLP').code('timer')
    for name, popup in HOLD_POPUPS:
        at = find(timer, f'if(tTmp.txt=="{name}")')
        if timer[at + 2].strip() != f'page {popup}':
            raise SystemExit(f'tmLP: unexpected popup for {name}')
        timer[at] = timer[at].replace(f'tTmp.txt=="{name}"', f'{LP_TYPE}.val=={TYPE_NUMBER[name]}')


def check_long_press_numbers(name, layout, blink):
    """the numbers of vaLPCell (1.. in object order) as in status-grid-8x2.md: main 1, bEntity1-6 2-7, then on
    cardDevice1 the cells 8-23 and the icons of the sets (B 24/25, C 26/27; us-p only C 24/25), on cardDevice3
    the hotspots 8/9 and the cells 10-17"""
    order = [b.split(' ->')[0] for b in blink]
    cells = [cell_names(i)[0] for i in range(1, len(layout.get('cells', [])) + 1)]
    if cells:
        first = order.index(cells[0]) + 1
        if order[first - 1:first - 1 + len(cells)] != cells or first != {'cardDevice1': 8, 'cardDevice3': 10}[name]:
            raise SystemExit(f'{name}: long press numbers of the cells start at {first}: {order}')
    print(f'{name}: vaLPCell ' + ', '.join(f'{n} {o}' for n, o in enumerate(order, 1)))


def check_numeric(page):
    """no code reads a type as text any more (type<k>, typeMain, typeStat<i> are number variables)"""
    bad = [f'{o.name}.{item[1]}: {line.strip()}' for o in page.objs for item in o.items if item[0] == 'code'
           for line in item[2] if re.search(r'\btype(Main|Stat\d+|\d+)\.txt\b', line.split('//')[0])]
    if bad:
        raise SystemExit('type read as text: ' + '; '.join(bad[:5]))
    for o in page.objs:
        if re.fullmatch(r'type(Main|Stat\d+|\d+)|' + '|'.join((LP_TYPE, STAGE_VAR, COLS_VAR)), o.name):
            if o.get('type') != 52 or o.get('sta') != 0:
                raise SystemExit(f'{o.name} is not a number variable')


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


def patch_release(page):
    """pageStartup.tRelease OLD_RELEASE -> NEW_RELEASE; True if changed (NEW_RELEASE stays: idempotent)"""
    o = page.obj('tRelease')
    txt = o.get('txt')
    if txt == NEW_RELEASE:
        return False
    if txt != OLD_RELEASE:
        raise SystemExit(f'tRelease is {txt!r}, expected {OLD_RELEASE} or {NEW_RELEASE}')
    if len(NEW_RELEASE.encode()) > o.get('txt_maxl'):
        raise SystemExit('tRelease too short')
    o.set('txt', NEW_RELEASE)
    return True


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
    released = patch_release(pages['pageStartup'])
    print(f'pageStartup tRelease {OLD_RELEASE} -> {NEW_RELEASE}' if released else f'pageStartup tRelease {NEW_RELEASE}')
    print(f'model {model} (pageStartup): stage {STAGE[model][0]}x{STAGE[model][1]}, visible x {VISIBLE[model][0]}..'
          f'{VISIBLE[model][1]}, ' + ('portrait layouts' if shift is None else
                                      f'landscape layouts shifted by {shift} px (header of {SOURCE})'))
    before = ram(Page(source_bytes))
    changes, added = {}, {}
    main_hmi = hmi.files['main.HMI']
    numbers = [int(s[:-3]) for s in sections.values()]
    for name in PAGES:
        page, layout, blink, press = build_page(source_bytes, name, switch_template, layouts[name])
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
        print(f'{name}: press feedback (grey background while touched): {", ".join(press) or "-"}')
        hard, real = message_len(layout, False), message_len(layout, True)
        maxl = page.obj('strCommand').get('txt_maxl')
        print(f'{name}: entityUpd at most {hard} bytes with every buffer full, {real} as the adapter builds it; '
              f'strCommand txt_maxl {maxl} (+{STR_COMMAND_RESERVE} %, 4k-1, max {STR_COMMAND_MAX}), '
              f'{RAM_LIMIT - RAM_GLOBAL - r} bytes of RAM free')
        if real > PAYLOAD_MAX:
            print(f'{name}: note - that message is longer than a payload can be ({PAYLOAD_MAX})')
        if layout.get('cells'):
            ihard, ireal = icons_len(layout, False), icons_len(layout, True)
            print(f'{name}: {ICONS_COMMAND} ({len(layout["cells"])} cells) at most {ihard} bytes with every buffer '
                  f'full, {ireal} as the adapter builds it (icon with font suffix)')
            if ireal > maxl:
                raise SystemExit(f'{name}: {ICONS_COMMAND} does not fit strCommand')
        if FIELDS_TABLE:
            print(f'  entityUpd: part, fields with every buffer full / as the adapter builds it (+ one ~ between '
                  f'two fields)')
            for (part, a), (_, b) in zip(message_fields(layout, False), message_fields(layout, True)):
                print(f'  {part:16} {"+".join(map(str, a)):18} = {sum(a):3}   {"+".join(map(str, b)):16} = {sum(b):3}')
            if layout.get('cells'):
                print(f'  {ICONS_COMMAND}: part, fields (type, id, icon, colour) full / real')
                for (part, a), (_, b) in list(zip(icons_fields(layout, False), icons_fields(layout, True)))[:2]:
                    print(f'  {part:16} {"+".join(map(str, a)):18} = {sum(a):3}   '
                          f'{"+".join(map(str, b)):16} = {sum(b):3}')
                print(f'  ... {len(layout["cells"])} cells')
        if RAM_GLOBAL + r > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {RAM_GLOBAL + r} > {RAM_LIMIT}')
        if RAM_GLOBAL + r > RAM_LIMIT - RAM_MARGIN:
            print(f'{name}: WARNING - the estimate leaves less than {RAM_MARGIN} bytes to the limit (it was 131 '
                  f'bytes too low on cardDevice1)')
        elif RAM_GLOBAL + r > RAM_TARGET:
            print(f'{name}: note - less than {RAM_LIMIT - RAM_TARGET} bytes of RAM left')
    if main_hmi != hmi.files['main.HMI']:
        changes['main.HMI'] = main_hmi

    switched, without = switch_pages(pages)
    print(f'pageType branches added on {len(switched)} pages: {", ".join(sorted(switched)) or "-"}')
    print(f'pages with tmSerial without {SWITCH_AFTER} branch: {", ".join(sorted(without)) or "-"}')
    for name, page in pages.items():
        if name in PAGES or name in switched or (released and name == 'pageStartup'):
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
                  ('home-import-outline', FG, 'Dock', ''), ('map-marker', FG, 'Suchen', '')],
        'icons': [('wifi', color565(0, 220, 0)), ('trash-can', color565(255, 160, 0)), ('air-filter', FG),
                  ('alert', color565(255, 40, 40)), ('battery-charging', color565(0, 220, 0)), ('brush', FG),
                  ('water-percent', color565(0, 160, 255)), ('lock', FG), ('fan', FG), ('flash', color565(255, 220, 0)),
                  ('thermometer', FG), ('water', color565(0, 160, 255)), ('lightbulb', color565(255, 220, 0)),
                  ('power', FG), ('timer-outline', FG), ('signal', color565(0, 220, 0))],
        # stage: number of set cells shown in the preview of that stage
        'stageIcons': (0, 5, 9, 16),
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
        'icons': [('lock', color565(0, 220, 0)), ('door-closed', FG), ('car-tire-alert', color565(255, 160, 0)),
                  ('wifi', color565(0, 220, 0)), ('battery-charging', color565(0, 220, 0)), ('thermometer', FG),
                  ('alert', color565(255, 40, 40)), ('signal', FG)],
        'stageIcons': (0, 3, 7),
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


def clip_bytes(text, maxl):
    """what a text buffer of txt_maxl keeps (whole UTF-8 characters)"""
    out = ''
    for ch in text:
        if len((out + ch).encode()) > maxl:
            break
        out += ch
    return out


def render_page(page, name, layout, model, fonts, icons, stage=0):
    """the page as the HMI shows it in that stage, with EXAMPLES[name]['stageIcons'][stage] set cells"""
    ex = EXAMPLES[name]
    shown = shown_stages(layout)
    n_icons = ex.get('stageIcons', (0,))[stage]
    rows = layout.get('gridRows', 1)
    columns = min(-(-n_icons // rows), layout['stageColumns'][stage]) if layout.get('cells') else 0
    bg, fg = rgb565(BG), rgb565(FG)
    width, height = STAGE[model]
    cv = Canvas(width, height, bg)
    objs = {o.name: o for o in page.objs}

    def rect(n):
        o = objs[n]
        return (o.get('x'), o.get('y'), o.get('w'), o.get('h'))

    def put(n, s, color=fg):
        if stage not in shown.get(n, ALL):
            return
        o = objs[n]
        cv.text(fonts, rect(n), o.get('font'), clip_bytes(s, o.get('txt_maxl')), color, o.get('xcen'))

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
    for k, (spec, example) in enumerate(zip(layout['slots'], ex['slots']), 1):
        kind = spec['kind']
        icon, color, label, value = example
        icon_obj, _ = slot_names(k, kind)
        if icon and icon_obj in objs:
            put(icon_obj, icons[icon], rgb565(color))
        put(f'tEntity{k}', label)
        if f'tValue{k}' in objs:
            put(f'tValue{k}', value)
        for letter in layout.get('sets', {}).get(k, {}):
            names = set_names(k, letter)
            put(names['icon'], icons[icon], rgb565(color))
            if 'name' in names and names['name'] in objs:
                put(names['name'], label)
            if letter != 'B':
                put(names['value'], value)
        if kind == 'progress':
            x, y, w, h = spec['bar']
            cv.fill(x, y, w, h, fg)
            cv.fill(x + 1, y + 1, w - 2, h - 2, bg)
            cv.fill(x + 1, y + 1, (w - 2) * int(value) // 100, h - 2, rgb565(color))
        if kind == 'switch' and stage in shown.get(f'btOnOff{k}', ALL):
            x, y, w, h = spec['switch']
            on = value == '1'
            cv.fill(x + 3, y + 13, 44, 24, rgb565(color565(0, 200, 0) if on else color565(120, 120, 120)))
            cv.fill(x + (25 if on else 5), y + 15, 20, 20, (255, 255, 255))
    for i, _ in enumerate(layout.get('cells', []), 1):
        if (i - 1) // rows + 1 > columns:
            continue
        cell = cell_names(i)[0]
        x, y, w, h = rect(cell)
        grid_c = rgb565(GRID_COLOR)
        cv.fill(x, y, w, 1, grid_c)
        cv.fill(x, y + h - 1, w, 1, grid_c)
        cv.fill(x, y, 1, h, grid_c)
        cv.fill(x + w - 1, y, 1, h, grid_c)
        if i <= n_icons:
            icon, color = ex['icons'][i - 1]
            put(cell, icons[icon], rgb565(color))
    # area under the frame
    x0, x1 = VISIBLE[model]
    for yy in range(height):
        for xx in list(range(0, x0)) + list(range(x1 + 1, width)):
            if (xx + yy) % 8 < 4:
                cv.px[yy * width + xx] = [90, 90, 90]
    return cv


def preview_name(model, name, stage=None):
    """EU without model in the name, the other models with it: hmi-us-p-cardDevice1-stage2.png"""
    return f'hmi-{"" if model == "eu" else model + "-"}{name}{"" if stage is None else f"-stage{stage}"}.png'


def render_all(hmi, out_dir, model, layouts):
    os.makedirs(out_dir, exist_ok=True)
    fonts = [Zi(hmi.files[s]) for s in main_entries(hmi.files['main.HMI'], 'zi')]
    icons = icon_codes()
    pages = {Page(d).objs[0].name: Page(d) for n, d in hmi.files.items() if n.endswith('.pa')}
    for name in PAGES:
        variants = list(stages(layouts[name])) if layouts[name].get('cells') else [None]
        for stage in variants:
            path = os.path.join(out_dir, preview_name(model, name, stage))
            cv = render_page(pages[name], name, layouts[name], model, fonts, icons, stage or 0)
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
    drawn by the parser); stages: per stage the columns of the grid at most and the objects shown only in it"""
    objs = {o.name: o for o in page.objs}
    shown = shown_stages(layout)
    slots = []
    for k, spec in enumerate(layout['slots'], 1):
        kind = spec['kind']
        slot = {'slot': k, 'kind': kind}
        icon, _ = slot_names(k, kind)
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
        if k in layout.get('sets', {}):
            # the other sets of the row; set B shows the value of the wide set
            slot['sets'] = {letter: {part: box(objs, o) for part, o in set_names(k, letter).items()}
                            for letter in layout['sets'][k]}
        if k in layout.get('covered', {}):
            slot['hiddenFromStage'] = layout['covered'][k]
        slots.append(slot)
    out = {
        'slotCount': len(slots), 'statusWidth': objs['tStatus'].get('w'),
        'strCommand': objs['strCommand'].get('txt_maxl'),
        'header': {'prev': box(objs, 'bPrev'), 'heading': box(objs, 'tHeading'), 'next': box(objs, 'bNext')},
        'main': {'icon': box(objs, 'bMain'), 'name': box(objs, 'tMainName')},
        'slots': slots,
        'status': box(objs, 'tStatus'), 'info': box(objs, 'bInfo'),
    }
    if layout.get('cells'):
        rows = layout['gridRows']
        out['grid'] = {
            'rows': rows, 'columns': len(layout['cells']) // rows,
            'cells': [dict(box(objs, cell_names(i)[0]), cell=i, column=(i - 1) // rows + 1, row=(i - 1) % rows + 1,
                           border=objs[cell_names(i)[0]].get('borderw'))
                      for i in range(1, len(layout['cells']) + 1)],
        }
        out['stages'] = [{'stage': st, 'columns': layout['stageColumns'][st],
                          'infoSet': next((x for x, v in layout.get('setStages', {}).items() if st in v), None),
                          'hiddenSlots': [k for k, f in layout.get('covered', {}).items() if st >= f]}
                         for st in stages(layout)]
    return out


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
