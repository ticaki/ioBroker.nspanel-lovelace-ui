"""HMI 6.2.0 (EU): the notification page 'popupNotify3' - one large icon, one line of text, close cross, up to 2 buttons.

Usage (from the repository root):
  PUPPETEER_PATH=$(npm root -g)/ PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_notify3.py <in.HMI> <out.HMI>
Input: Tim's base project 6.1.1 (EU) with the page 'page0' (a 1:1 copy of popupNotify, made in the editor) and a
placeholder font 9.zi (font id 9); the output must not exist. Design: doc/ideas/notify-page/README.md.

Finding (base nspanel-v6.2.0.HMI): page0 (section 35.pa) has the objects of popupNotify (p0, b0, tTmp, tc0, tmSleep,
tmSerial, strCommand, tInstruction, tId, tHeading, tText, b2, b1, entn, vaOldSleepT, tSend, tTextAlt, tIcon, b3), its
code still writes 'popupNotify.bco' and b0 sends 'event,buttonPress2,popupNotify,bExit'. 32 pages (page0 included)
have the pageType branch if(tId.txt=="popupNotify") { page popupNotify } without any copy into pageIcons.

What the script does:
1. page0 -> popupNotify3 (object 0 and the page header at 0x18); 'popupNotify.bco' and the bExit event of b0 name
   popupNotify3.
2. Behind every 'if(tId.txt=="popupNotify")' branch of a pageType switch a branch for popupNotify3 (all 32 pages,
   popupNotify3 itself included).
3. Font 9.zi replaced: 'mdi-notify-255', utf-8 subset, height 255, the icons of ICONS (templates/popup-notify3-icons.json) plus the space. The
   codepoints are the ones the adapter sends for these names (src/lib/const/icon_mapping.ts), checked against
   script/icons.json and the icon font 1.zi (font 4). Rendering: MDI path of script/icons.json, the 24 grid fills
   255 x 255 (scale 255/24, no offset), glyph width 255, left/right 0 (like the icon glyphs of 1.zi: width = the
   scaled grid), 3 bit alpha, zilib.encode (zi v6 mode 3).
   272 px (README) is not possible: the font height (header 0x07) and the glyph width (u8 in the character table)
   are single bytes - 255 is the largest square glyph.
4. Layout of popupNotify3 (480 x 320), objects of the copy, by name. The frame of the EU panel covers the right
   ~30 px: the visible area is x 0..449 (the screensaver texts tDate/tNotifyHead/tNotifyText fill 0..449 centered,
   pageSplash/popupTimer end at 449, the cards are symmetric to it with bPrev 9.. / bNext ..440, the popups end
   with the cross at 446). us-l is the same area 15 px further right (x 15..464, every page +15: popupNotify b0
   412..461, cardEntities bPrev/bNext 24..455). layout_eu takes this shift (dx 0 EU, 15 us-l); x below for EU:
     tIcon   font 9, x 97..351 (w 255, centered in 0..449), y 0..254 (h 255), centered, ycen top, color from the
             message
     b0      close cross E155 from font 4 (Bold 80, glyph 66 wide, ink ~39 px), x 381..446 (ends like the cross b0
             of popupNotify), y 0..79, ycen top, light gray (50712); its box (80 high, a text needs the full font
             height) reaches 20 px into the right column (x 381..441, y 60..79): b0 has the lower id (drawn first,
             the column gets the touch), only its own press redraws it; it does not touch the icon (ends at 351)
     b1/b2   left x 8..87 / right x 362..441 (8 px to the visible edges), y 60..264 (h 205), icon from font 4
             centered, white, bco from the message, without icon invisible; square corners (the corner font 8.zi
             'corners1' has fixed 98 px glyphs for a 100 px slider and is only used in commented code - no simple
             rounding for 80 px)
     tText   x 8..441 (w 434, like the columns), y 272..319 (h 48), isbr 1, centered, ycen top, font 3 (48 px)
             unless the message sets one; font 3 (48 px) and 2 (32 px) one line, font 0 (24 px) two lines; a longer
             text wraps below the box and is cut off there, the first line stays visible (ycen top). Overlaps
             neither the icon (ends at y 254) nor the columns (end at y 264) - a two line 32 px text used to reach
             into them
   Removed objects: p0 (full screen picture, hidden at load), tHeading, tTextAlt, b3 - the code of the page addresses
   objects by name only (checked: no b[..]), the ids of the others close up.
   Buffers (RAM ceil((maxl+1)/4)*4): strCommand 1000 -> 511, tText 500 -> 199, tIcon 250 -> 3, tSend 200 -> 79,
   tId/tInstruction 20 -> 15/19, tTmp 10 -> 11, entn 30 -> 31, b0/b1/b2 10 -> 3/7/7.
5. Protocol (popupNotify3 only, fields after the instruction):
     entityUpdateDetail~<id>~<icon>~<iconColor>~<text>~<textColor>~<font>~<btnLeftIcon>~<btnLeftColor>
                       ~<btnRightIcon>~<btnRightColor>~<timeout>
   colors as 565 decimal, empty button icon = button invisible, empty font = 3 (font 3/2 one line, font 0 two
   lines; the adapter should shorten the text to fit), timeout in seconds (0 = none) like
   popupNotify (sleepTimeout, the old value is kept in vaOldSleepT and restored on a press / pageType).
   Events with the semantics of popupNotify: left  event,buttonPress2,<id>,notifyAction,button1
                                             right event,buttonPress2,<id>,notifyAction,button3
                                             cross event,buttonPress2,popupNotify3,bExit (also on the timeout
                                                   and exitPopup)
   In the adapter button3 is the right/yes button of popupNotify (setStateYes) and button2 its middle one: the right
   button b2 of the copy sent button2 and is changed to button3, button2 is deliberately not used.
   The CRC acknowledge of load (recvCrc, event,ack) and the send blocks stay as in the copy.
6. pageStartup.tRelease 6.1.1 -> 6.2.0.
7. sleepValue fix (popupNotify3 and popupNotify, same code in both): the global counter sleepValue (tmSleep counts it
   up every second and clicks b0 at sleepTimeout) was never reset when the popup page was opened or reloaded, and
   vaOldSleepT (local, 0 after a page load) was only set in entityUpdateDetail. A pageType to the same popup
   restored sleepTimeout=vaOldSleepT.val, reloaded the page (vaOldSleepT 0), the next entityUpdateDetail saved 0 as
   the old timeout and the leftover sleepValue fired bExit about a second later; afterwards the screensaver timeout
   stayed 0. A second entityUpdateDetail without pageType saved the popup timeout as the old one. Now:
     load               sleepValue=0, vaOldSleepT.val=sleepTimeout (the screensaver timeout of the page before)
     entityUpdateDetail no longer saves vaOldSleepT; sleepValue=0 behind the new sleepTimeout (every update gets the
                        full time)
     pageType           sleepValue=0 behind sleepTimeout=vaOldSleepT.val
   b0/b1/b2(/b3) down restore sleepTimeout=vaOldSleepT.val as before (the timeout clicks b0, exitPopup too).
   The other popups are not changed.
8. Overlap fix screensaver3 (EU, us-l; us-p has no such objects): tMainTextAlt2 and tMainIconAlt2 lie exactly on top
   of each other since 6.1.0 (EU x 1, us-l x 0; y 265, w 2, h 45 - parked, 2 px wide, draw nothing) and the editor
   warns "Component overlap". tMainIconAlt2 moves 3 px to the right (x and endx), side by side instead of on top.
   Stops on another geometry; checked that the moved object overlaps nothing it did not overlap before.
   us-p only (popup_notify3_us.py): cardEntities, rows 1, 2, 4 - btOnOff<n> and bDown<n> (alternative widgets, one
   is shown depending on the item type) have exactly the same rectangle (x 265, y 87/155/289, 50 x 50) and the
   editor warns; it only warns on exactly the same position (row 3: btOnOff3 1 px higher, no warning). btOnOff1/2/4
   move 1 px up like row 3 (fix_entities_overlap). Rows 5/6 (x 268, y 358/424) are the same case but not changed.
"""
import json
import os
import re
import struct
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
sys.path.insert(0, HERE)
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402
from zilib import Zi, encode  # noqa: E402

OLD_NAME, NAME = 'page0', 'popupNotify3'
OLD_RELEASE, NEW_RELEASE = '6.1.1', '6.2.0'

# the icons of font 9 - single source shared with the adapter and the admin icon tab
with open(os.path.join(ROOT, 'templates', 'popup-notify3-icons.json'), encoding='utf-8') as _f:
    ICONS = json.load(_f)

# font: height and glyph width are single bytes
FONT_SECTION = '9.zi'
FONT_ID = 9
FONT_NAME = 'mdi-notify-255'
HEIGHT = 255
SPACE_WIDTH = round(15 * HEIGHT / 80)  # the space of 1.zi: 15 px at 80
BUTTON_FONT = 4  # 1.zi NotoSans-Bold 80 with the icons
BUTTON_FONT_SECTION = '1.zi'
TEXT_FONT = 3  # 5.zi NotoSans-Regular 48
CLOSE = ''
LIGHT_GRAY = 50712  # 0xC618
WHITE = 65535

REMOVE = ['p0', 'tHeading', 'tTextAlt', 'b3']
EXPECTED = ['page0', 'p0', 'b0', 'tTmp', 'tc0', 'tmSleep', 'tmSerial', 'strCommand', 'tInstruction', 'tId',
            'tHeading', 'tText', 'b2', 'b1', 'entn', 'vaOldSleepT', 'tSend', 'tTextAlt', 'tIcon', 'b3']
MAXL = {'strCommand': 511, 'tText': 199, 'tIcon': 3, 'tSend': 79, 'tId': 15, 'tInstruction': 19, 'tTmp': 11,
        'entn': 31, 'b0': 3, 'b1': 7, 'b2': 7}

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


def text_cost(maxl):
    return -(-(maxl + 1) // 4) * 4


def ram(page):
    """text buffers of the page (number variables excluded) and the object count"""
    return sum(text_cost(o.get('txt_maxl')) for o in page.objs
               if o.has('txt_maxl') and (o.get('type') != 52 or o.get('sta') == 1)), len(page.objs)


# ---------------------------------------------------------------- font

def codepoints():
    """{name: codepoint} of ICONS from icon_mapping.ts, checked against script/icons.json"""
    ts = open(os.path.join(ROOT, 'src/lib/const/icon_mapping.ts'), encoding='utf-8').read()
    mapping = {m.group(1): m.group(2) for m in re.finditer(r"\['([^']+)', '([^']*)'\]", ts)}
    icons = {i['name']: i for i in json.load(open(os.path.join(ROOT, 'script/icons.json'), encoding='utf-8'))}
    out = {}
    for name in ICONS:
        if name not in mapping or len(mapping[name]) != 1:
            raise SystemExit(f'icon_mapping.ts: no single character for {name}')
        cp = ord(mapping[name])
        if name not in icons or int(icons[name]['hex'], 16) != cp:
            raise SystemExit(f'{name}: icon_mapping.ts {cp:04X} != icons.json {icons.get(name, {}).get("hex")}')
        out[name] = cp
    if len(set(out.values())) != len(ICONS):
        raise SystemExit('two icons share a codepoint')
    return out, {name: icons[name]['data'] for name in ICONS}


def render(paths):
    with tempfile.TemporaryDirectory() as tmp:
        job, out = os.path.join(tmp, 'job.json'), os.path.join(tmp, 'out.bin')
        variant = {'s': HEIGHT / 24, 'dx': 0, 'dy': 0}
        data = {'W': HEIGHT, 'H': HEIGHT, 'variants': [variant], 'paths': paths}
        # render.mjs reads the puppeteer location from the job (no process.env in scanned files)
        if os.environ.get('PUPPETEER_PATH'):
            data['puppeteerPath'] = os.environ['PUPPETEER_PATH']
        with open(job, 'w') as f:
            json.dump(data, f)
        subprocess.run(['node', os.path.join(HERE, 'render.mjs'), job, out], check=True)
        raw = open(out, 'rb').read()
    n = HEIGHT * HEIGHT
    if len(raw) != n * len(paths):
        raise SystemExit('render.mjs: unexpected output size')
    return [[round(a * 7 / 255) for a in raw[k * n:(k + 1) * n]] for k in range(len(paths))]


def build_font(hmi):
    cps, paths = codepoints()
    button_font = Zi(hmi.files[BUTTON_FONT_SECTION])
    missing = [n for n, cp in cps.items() if cp not in button_font.chars]
    if missing:
        raise SystemExit(f'{BUTTON_FONT_SECTION} lacks the codepoints of {missing}')
    pixels = render([paths[n] for n in ICONS])
    chars = {0x20: (SPACE_WIDTH, 0, 0, encode([0] * SPACE_WIDTH * HEIGHT))}
    for name, px in zip(ICONS, pixels):
        chars[cps[name]] = (HEIGHT, 0, 0, encode(px))
    codes = sorted(chars)
    table, data = bytearray(), bytearray()
    for cp in codes:
        w, left, right, g = chars[cp]
        table += struct.pack('<HBBB', cp, w, left, right) + (len(codes) * 10 + len(data)).to_bytes(3, 'little')
        table += struct.pack('<H', len(g))
        data += g
    head = bytearray(hmi.files[FONT_SECTION][:0x2C])
    if head[:4] != b'\x04\xff\x00\x0a' or head[4] != 0x18 or head[0x10] != 6:
        raise SystemExit(f'{FONT_SECTION} is not a zi v6 utf-8 font')
    title = FONT_NAME.encode() + b'utf-8'
    head[7] = HEIGHT
    struct.pack_into('<I', head, 0x0C, len(codes))
    head[0x11] = len(title)
    struct.pack_into('<I', head, 0x14, len(title) + len(table) + len(data))
    head[0x20] = len(FONT_NAME)
    struct.pack_into('<I', head, 0x24, len(codes))  # subset count, like 2.zi and clock96.zi
    font = bytes(head) + title + bytes(table) + bytes(data)
    check = Zi(font)
    if check.h != HEIGHT or len(check.chars) != len(codes):
        raise SystemExit('new font does not parse back')
    return font, cps


def font_ids(main_hmi):
    head = struct.unpack_from('<I', main_hmi, 4)[0]
    count = struct.unpack_from('<I', main_hmi, 28)[0]
    fonts = []
    for i in range(count):
        entry = main_hmi[head + 16 * i:head + 16 * i + 16]
        if entry[:8].split(b'\0')[0] == b'zi':
            fonts.append(entry[8:].split(b'\0')[0].decode())
    return fonts


# ---------------------------------------------------------------- page

def add_page_switch(lines):
    """inserts the popupNotify3 branch behind every popupNotify branch; returns the number inserted"""
    if any(line.strip() == f'if(tId.txt=="{NAME}")' for line in lines):
        raise SystemExit(f'already has a {NAME} branch')
    n, i = 0, 0
    while i < len(lines):
        if lines[i].strip() == 'if(tId.txt=="popupNotify")':
            a, b = block(lines, i)
            body = lines[a:b]
            if [x.strip() for x in body] != ['if(tId.txt=="popupNotify")', '{', 'page popupNotify', '}']:
                raise SystemExit(f'unexpected popupNotify branch: {body}')
            lines[b:b] = [x.replace('popupNotify', NAME) for x in body]
            n += 1
            i = b + len(body)
            continue
        i += 1
    return n


def update_lines(ind):
    i = ind + '  '

    def color(field, target):
        return [f'{i}spstr strCommand.txt,tTmp.txt,"~",{field}', f'{i}covx tTmp.txt,sys0,0,0', f'{i}{target}=sys0']

    def button(obj, icon, col):
        return [f'{i}// {obj}: icon {icon}, background {col}, without icon invisible',
                f'{i}spstr strCommand.txt,{obj}.txt,"~",{icon}',
                *color(col, f'{obj}.bco'),
                f'{i}if({obj}.txt!="")',
                f'{i}{{',
                f'{i}  vis {obj},1',
                f'{i}}}else',
                f'{i}{{',
                f'{i}  vis {obj},0',
                f'{i}}}']

    return [
        f'{ind}if(tInstruction.txt=="entityUpdateDetail")',
        f'{ind}{{',
        f'{i}// entityUpdateDetail~id~icon~iconColor~text~textColor~font~btnLeftIcon~btnLeftColor~btnRightIcon'
        '~btnRightColor~timeout',
        f'{i}spstr strCommand.txt,entn.txt,"~",1',
        f'{i}// icon (font {FONT_ID})',
        *color(3, 'tIcon.pco'),
        f'{i}spstr strCommand.txt,tIcon.txt,"~",2',
        f'{i}// text: color, font (empty = {TEXT_FONT}), text',
        *color(5, 'tText.pco'),
        f'{i}spstr strCommand.txt,tTmp.txt,"~",6',
        f'{i}if(tTmp.txt=="")',
        f'{i}{{',
        f'{i}  tText.font={TEXT_FONT}',
        f'{i}}}else',
        f'{i}{{',
        f'{i}  covx tTmp.txt,sys0,0,0',
        f'{i}  tText.font=sys0',
        f'{i}}}',
        f'{i}spstr strCommand.txt,tText.txt,"~",4',
        *button('b1', 7, 8),
        *button('b2', 9, 10),
        f'{i}//preserve old sleepTimeout',
        f'{i}vaOldSleepT.val=sleepTimeout',  # removed again by fix_sleep (same code as popupNotify)
        f'{i}// sleep timeout',
        *color(11, 'sleepTimeout'),
        f'{ind}}}',
    ]


ACK_END = 'recvCrc=0'


def load_lines(old):
    """the acknowledge block of the copy, then the defaults of popupNotify3"""
    i = find(old, ACK_END)
    if old[i + 1] != '}' or old[0] != '// opened by a pageType (recvCrc!=0): acknowledge it here, the old page did not get to its ack':
        raise SystemExit('load: unexpected acknowledge block')
    return old[:i + 2] + [
        f'{NAME}.bco=defaultBcoColor',
        'dim=dimValueNormal',
        'vis tSend,0',
        'vis tTmp,0',
        'vis tInstruction,0',
        'vis tId,0',
        'vis b1,0',
        'vis b2,0',
        'b0.bco=defaultBcoColor',
        'b0.bco2=defaultBcoColor',
        'tText.bco=defaultBcoColor',
        'tText.pco=defaultFontColor',
        'tIcon.bco=defaultBcoColor',
        'tIcon.pco=defaultFontColor',
    ]


VISIBLE_SHIFT_USL = 15  # us-l: the visible area lies 15 px further right than on EU (docstring point 4)


def layout_eu(page, dx=0):
    """geometry of popupNotify3 on 480 x 320, docstring point 4; dx: shift of the visible area (EU 0, us-l 15)"""
    b0 = page.obj('b0')
    b0.set('txt', CLOSE)
    b0.set('font', BUTTON_FONT)
    b0.geometry(381 + dx, 0, 66, 80)
    b0.set('ycen', 0)
    b0.set('pco', LIGHT_GRAY)
    b0.set('pco2', LIGHT_GRAY)

    for name, x in (('b1', 8), ('b2', 362)):
        b = page.obj(name)
        b.geometry(x + dx, 60, 80, 205)
        b.set('font', BUTTON_FONT)
        b.set('txt', '')
        b.set('xcen', 1)
        b.set('ycen', 1)
        b.set('pco', WHITE)
        b.set('pco2', WHITE)

    icon = page.obj('tIcon')
    icon.geometry(97 + dx, 0, HEIGHT, HEIGHT)
    icon.set('font', FONT_ID)
    icon.set('xcen', 1)
    icon.set('ycen', 0)
    icon.set('isbr', 0)
    icon.set('txt', '')

    text = page.obj('tText')
    text.geometry(8 + dx, 272, 434, 48)
    text.set('font', TEXT_FONT)
    text.set('xcen', 1)
    text.set('ycen', 0)
    text.set('isbr', 1)

    # no two objects with exactly the same rectangle (editor warning "Component overlap"), the icon free of b0
    shown = [page.obj(n) for n in ('b0', 'b1', 'b2', 'tIcon', 'tText')]
    for o in shown:
        if any(other is not o and other.has('x') and rect(other) == rect(o) for other in page.objs[1:]):
            raise SystemExit(f'{o.name}: same rectangle as another object')
    if 'b0' in overlapping(icon, shown):
        raise SystemExit('tIcon overlaps b0')


def build_page(page, old_name=OLD_NAME, layout=layout_eu):
    """page: the copy of popupNotify named old_name (EU: Tim's page0 made in the editor)"""
    names = [o.name for o in page.objs]
    if names != [old_name] + EXPECTED[1:]:
        raise SystemExit(f'{old_name} is not the expected copy of popupNotify: {names}')
    if bytes(page.head[0x18:0x28]).split(b'\0')[0] != old_name.encode():
        raise SystemExit(f'page header does not name {old_name}')
    for o in page.objs:
        for item in o.items:
            if item[0] == 'code' and any(re.search(r'\bb\[', line) for line in item[2]):
                raise SystemExit(f'{o.name} addresses objects by id - objects cannot be removed')
    page.objs[0].set('objname', NAME)
    page.head[0x18:0x28] = NAME.encode().ljust(16, b'\0')
    removed = [o for o in page.objs if o.name in REMOVE]
    page.objs = [o for o in page.objs if o.name not in REMOVE]

    head = page.objs[0]
    head.set_code('load', load_lines(head.code('load')))

    down = page.obj('b0').code('down')
    i = find(down, 'tSend.txt="event,buttonPress2,popupNotify,bExit"')
    down[i] = f'tSend.txt="event,buttonPress2,{NAME},bExit"'

    for name in ('b1', 'b2'):
        down = page.obj(name).code('down')
        if down[2] != f'tSend.txt="event,buttonPress2,"+entn.txt+",notifyAction,button{name[1]}"':
            raise SystemExit(f'{name}: unexpected event')
        if name == 'b2':
            # right = yes button like popupNotify (button3), button2 (middle) stays unused
            down[2] = 'tSend.txt="event,buttonPress2,"+entn.txt+",notifyAction,button3"'

    layout(page)

    ids = {o.name: i for i, o in enumerate(page.objs)}
    if not ids['b0'] < ids['b2']:
        raise SystemExit('unexpected object order')

    for name, maxl in MAXL.items():
        page.obj(name).set('txt_maxl', maxl)

    lines = page.obj('tmSerial').code('timer')
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="entityUpdateDetail")'))
    ind = lines[a][:len(lines[a]) - len(lines[a].lstrip())]
    lines[a:b] = update_lines(ind)

    # nothing of the page may still name a removed object or popupNotify itself
    for o in page.objs:
        for item in o.items:
            if item[0] != 'code':
                continue
            for line in item[2]:
                if any(re.search(rf'\b{r}\b', line) for r in (x.name for x in removed)):
                    raise SystemExit(f'{o.name}: still uses a removed object: {line}')
                if re.search(r'popupNotify\b', line) and line.strip() not in ('if(tId.txt=="popupNotify")',
                                                                              'page popupNotify'):
                    raise SystemExit(f'{o.name}: still names popupNotify: {line}')
    return ids


SLEEP_LOAD = [
    '// sleepValue fix: full timeout from the start, keep the screensaver timeout of the page before',
    'sleepValue=0',
    'vaOldSleepT.val=sleepTimeout',
]


def fix_sleep(page):
    """sleepValue fix (docstring point 7) on popupNotify3 or popupNotify; returns a short description"""
    name = page.objs[0].name
    # every line of the page that writes sleepTimeout, sleepValue or vaOldSleepT must be one of the known places
    restore = 'sleepTimeout=vaOldSleepT.val'
    writes = []
    for o in page.objs:
        for item in o.items:
            if item[0] != 'code':
                continue
            for line in item[2]:
                t = line.strip()
                if re.match(r'(sleepTimeout|sleepValue|vaOldSleepT\.val)\s*(=|\+=)', t) or \
                        re.match(r'covx \S+,(sleepTimeout|sleepValue|vaOldSleepT\.val),', t):
                    writes.append((o.name, item[1], t))
    buttons = {o.name for o in page.objs if o.name in ('b0', 'b1', 'b2', 'b3')}
    expected = sorted([(b, 'down', restore) for b in buttons] + [
        ('tc0', 'down', 'sleepValue=0'),
        ('tmSleep', 'timer', 'sleepValue+=1'),
        ('tmSleep', 'timer', 'sleepValue=0'),
        ('tmSerial', 'timer', 'vaOldSleepT.val=sleepTimeout'),
        ('tmSerial', 'timer', 'sleepTimeout=sys0'),
        ('tmSerial', 'timer', 'covx tTmp.txt,sleepTimeout,0,0'),
        ('tmSerial', 'timer', restore),
    ])
    if sorted(writes) != expected:
        raise SystemExit(f'{name}: unexpected sleep timeout code: {sorted(set(writes) ^ set(expected))}')
    for b in buttons:
        if page.obj(b).code('down')[0].strip() != restore:
            raise SystemExit(f'{name}.{b}: does not restore sleepTimeout first')
    timer = page.obj('tmSleep').code('timer')
    if [x.strip() for x in timer] != ['if(sleepTimeout!=0)', '{', 'sleepValue+=1', 'if(sleepTimeout<=sleepValue)',
                                      '{', 'sleepValue=0', 'click b0,1', 'click b0,0', '}', '}']:
        raise SystemExit(f'{name}.tmSleep: unexpected code {timer}')

    lines = page.obj('tmSerial').code('timer')
    a, b = block(lines, find(lines, 'if(tInstruction.txt=="entityUpdateDetail")'))
    i = find(lines, 'vaOldSleepT.val=sleepTimeout', a)
    if i >= b or lines[i - 1].strip() != '//preserve old sleepTimeout':
        raise SystemExit(f'{name}: vaOldSleepT not saved in entityUpdateDetail as expected')
    del lines[i - 1:i + 1]
    b -= 2
    i = find(lines, 'sleepTimeout=sys0', a)
    if i >= b or [x.strip() for x in lines[i - 3:i]] != ['// sleep timeout', 'spstr strCommand.txt,tTmp.txt,"~",'
                                                         + ('11' if name == NAME else '12'),
                                                         'covx tTmp.txt,sys0,0,0']:
        raise SystemExit(f'{name}: unexpected sleep timeout in entityUpdateDetail: {lines[i - 3:i + 1]}')
    ind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
    lines[i + 1:i + 1] = [f'{ind}sleepValue=0']

    a, b = block(lines, find(lines, 'if(tInstruction.txt=="pageType")'))
    i = find(lines, restore, a)
    if i != a + 2 or lines[a + 1].strip() != '{':
        raise SystemExit(f'{name}: pageType does not start with {restore}')
    ind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
    lines[i + 1:i + 1] = [f'{ind}sleepValue=0']

    load = page.objs[0].code('load')
    end = find(load, ACK_END)
    if load[end + 1] != '}':
        raise SystemExit(f'{name}: unexpected acknowledge block in load')
    load[end + 2:end + 2] = SLEEP_LOAD
    return f'{name}: load +sleepValue=0/vaOldSleepT, entityUpdateDetail -vaOldSleepT +sleepValue=0, pageType +sleepValue=0'


OVERLAP_PAGE = 'screensaver3'
OVERLAP_KEEP, OVERLAP_MOVE = 'tMainTextAlt2', 'tMainIconAlt2'
OVERLAP_SHIFT = 3


def rect(o):
    return o.get('x'), o.get('y'), o.get('w'), o.get('h')


def overlapping(o, objs):
    """names of the objects of objs whose rectangle shares a pixel with o"""
    x, y, w, h = rect(o)
    out = set()
    for other in objs:
        if other is o or not all(other.has(a) for a in ('x', 'y', 'w', 'h')):
            continue
        ox, oy, ow, oh = rect(other)
        if x <= ox + ow - 1 and ox <= x + w - 1 and y <= oy + oh - 1 and oy <= y + h - 1:
            out.add(other.name)
    return out


def fix_overlap(page, x):
    """overlap fix screensaver3 (docstring point 8): x = the expected x of both objects (EU 1, us-l 0); returns a
    short description, None without the objects (us-p)"""
    names = {o.name for o in page.objs}
    present = [n for n in (OVERLAP_KEEP, OVERLAP_MOVE) if n in names]
    if not present:
        return None
    if len(present) != 2:
        raise SystemExit(f'{OVERLAP_PAGE}: only {present}')
    keep, move = page.obj(OVERLAP_KEEP), page.obj(OVERLAP_MOVE)
    for o in (keep, move):
        if rect(o) != (x, 265, 2, 45) or o.get('endx') != x + 1 or o.get('endy') != 309:
            raise SystemExit(f'{OVERLAP_PAGE}.{o.name}: unexpected geometry {rect(o)}')
    before = overlapping(move, page.objs[1:])
    move.geometry(x + OVERLAP_SHIFT, 265, 2, 45)
    after = overlapping(move, page.objs[1:])
    if after - before or OVERLAP_KEEP in after:
        raise SystemExit(f'{OVERLAP_PAGE}.{OVERLAP_MOVE}: new overlap with {sorted(after - before)}')
    return f'{OVERLAP_PAGE}.{OVERLAP_MOVE} x {x} -> {x + OVERLAP_SHIFT} (still overlaps {", ".join(sorted(after))})'


ENTITIES_PAGE = 'cardEntities'
ENTITIES_ROWS = {1: (265, 87), 2: (265, 155), 4: (265, 289)}  # us-p


def fix_entities_overlap(page):
    """us-p cardEntities (docstring point 8): btOnOff1/2/4 1 px up; returns a short description"""
    done = []
    for n, (x, y) in ENTITIES_ROWS.items():
        down, button = page.obj(f'bDown{n}'), page.obj(f'btOnOff{n}')
        for o in (down, button):
            if rect(o) != (x, y, 50, 50) or o.get('endx') != x + 49 or o.get('endy') != y + 49:
                raise SystemExit(f'{ENTITIES_PAGE}.{o.name}: unexpected geometry {rect(o)}')
        before = overlapping(button, page.objs[1:])
        button.geometry(x, y - 1, 50, 50)
        after = overlapping(button, page.objs[1:])
        if after - before:
            raise SystemExit(f'{ENTITIES_PAGE}.{button.name}: new overlap with {sorted(after - before)}')
        if any(o is not button and o.has('x') and rect(o) == rect(button) for o in page.objs[1:]):
            raise SystemExit(f'{ENTITIES_PAGE}.{button.name}: same rectangle as another object')
        done.append(f'{button.name} y {y} -> {y - 1}')
    return f'{ENTITIES_PAGE}: ' + ', '.join(done)


def patch_release(page):
    o = page.obj('tRelease')
    if o.get('txt') != OLD_RELEASE:
        raise SystemExit(f'tRelease is {o.get("txt")!r}, expected {OLD_RELEASE}')
    if len(NEW_RELEASE.encode()) > o.get('txt_maxl'):
        raise SystemExit('tRelease too short')
    o.set('txt', NEW_RELEASE)


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    fonts = font_ids(hmi.files['main.HMI'])
    if fonts.index(FONT_SECTION) != FONT_ID or fonts.index(BUTTON_FONT_SECTION) != BUTTON_FONT:
        raise SystemExit(f'unexpected font order {fonts}')
    pages = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            pages[page.objs[0].name] = (section, page)
    if NAME in pages:
        raise SystemExit(f'{NAME} exists')
    if OLD_NAME not in pages:
        raise SystemExit(f'no page {OLD_NAME}')

    changes = {}
    section, page = pages[OLD_NAME]
    before = ram(page)
    ids = build_page(page)
    after = ram(page)
    fixed = [fix_sleep(page)]
    if 'popupNotify' not in pages:
        raise SystemExit('no page popupNotify')
    fixed.append(fix_sleep(pages['popupNotify'][1]))

    switched, without = [], []
    overlap = None
    for name, (sec, p) in pages.items():
        n = 0
        for o in p.objs:
            for item in o.items:
                if item[0] == 'code' and any(line.strip() == 'if(tId.txt=="popupNotify")' for line in item[2]):
                    n += add_page_switch(item[2])
        if n:
            switched.append(name if name != OLD_NAME else NAME)
        else:
            without.append(name)
        if name == 'pageStartup':
            patch_release(p)
        if name == OVERLAP_PAGE:
            overlap = fix_overlap(p, 1)
            if overlap is None:
                raise SystemExit(f'{OVERLAP_PAGE}: no {OVERLAP_MOVE}')
        if n or name in ('pageStartup', OLD_NAME, 'popupNotify', OVERLAP_PAGE):
            changes[sec] = p.bytes()
            Page(changes[sec])  # round trip

    if overlap is None:
        raise SystemExit(f'no page {OVERLAP_PAGE}')
    font, cps = build_font(hmi)
    changes[FONT_SECTION] = font

    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)

    print(f'page {section}: {OLD_NAME} -> {NAME}, objects {before[1]} -> {after[1]}, '
          f'text buffers {before[0]} -> {after[0]} bytes')
    print('object ids:', ', '.join(f'{n} {i}' for n, i in ids.items()))
    print(f'pageType branch {NAME} added on {len(switched)} pages: {", ".join(sorted(switched))}')
    print(f'pages without popupNotify branch: {", ".join(sorted(without))}')
    print(f'{FONT_SECTION}: {FONT_NAME}, height {HEIGHT}, {len(cps) + 1} characters, '
          f'{len(hmi.files[FONT_SECTION])} -> {len(font)} bytes')
    print('sleepValue fix:', '; '.join(fixed))
    print(f'tRelease {OLD_RELEASE} -> {NEW_RELEASE}')
    print('overlap fix:', overlap)
    print(f'changed sections: {", ".join(sorted(changes))}')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
