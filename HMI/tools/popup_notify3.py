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
3. Font 9.zi replaced: 'mdi-notify-255', utf-8 subset, height 255, the 51 icons of ICONS plus the space. The
   codepoints are the ones the adapter sends for these names (src/lib/const/icon_mapping.ts), checked against
   script/icons.json and the icon font 1.zi (font 4). Rendering: MDI path of script/icons.json, the 24 grid fills
   255 x 255 (scale 255/24, no offset), glyph width 255, left/right 0 (like the icon glyphs of 1.zi: width = the
   scaled grid), 3 bit alpha, zilib.encode (zi v6 mode 3).
   272 px (README) is not possible: the font height (header 0x07) and the glyph width (u8 in the character table)
   are single bytes - 255 is the largest square glyph.
4. Layout of popupNotify3 (480 x 320), objects of the copy, by name:
     tIcon   font 9, x 96..383, y 0..254 (h 255), centered, ycen top, color from the message
     b0      close cross E155 from font 4 (Bold 80, ink ~39 px), x 414..479, y 0..79, ycen top, light gray (50712);
             its box (80 high, a text needs the full font height) reaches 20 px into the right column: b0 has the
             lower id (drawn first, the column gets the touch), only its own press redraws it
     b1/b2   left x 8..87 / right x 392..471, y 60..264 (h 205), icon from font 4 centered, white, bco from the
             message, without icon invisible; square corners (the corner font 8.zi 'corners1' has fixed 98 px
             glyphs for a 100 px slider and is only used in commented code - no simple rounding for 80 px)
     tText   x 8..471, y 272..319 (h 48), isbr 1, centered, ycen top, font 3 (48 px) unless the message sets one;
             font 3 (48 px) and 2 (32 px) one line, font 0 (24 px) two lines; a longer text wraps below the box
             and is cut off there, the first line stays visible (ycen top). Overlaps neither the icon (ends at y 254)
             nor the columns (end at y 264) - a two line 32 px text used to reach into them
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

ICONS = [
    # general
    'alert', 'information-outline', 'doorbell', 'package-variant-closed', 'mailbox-up', 'phone-ring', 'shield-alert',
    'alarm-light', 'window-open-variant', 'door-open', 'garage-open', 'ev-station', 'power-socket-de',
    'battery-alert-variant-outline',
    # appointments
    'calendar', 'calendar-alert', 'calendar-clock', 'bell-ring', 'trash-can',
    # offline
    'wifi-off', 'web-off', 'cloud-off-outline', 'lan-disconnect',
    # occupied
    'cancel', 'toilet', 'door-closed-lock',
    # weather
    'weather-rainy', 'weather-lightning', 'weather-lightning-rainy', 'weather-hail', 'weather-pouring',
    'weather-snowy-heavy', 'weather-windy', 'weather-tornado', 'home-flood', 'snowflake-alert', 'sun-thermometer',
    'weather-fog',
    # appliances done / failed
    'washing-machine', 'tumble-dryer', 'dishwasher',
    'washing-machine-alert', 'tumble-dryer-alert', 'dishwasher-alert', 'fridge-alert', 'water-boiler-alert',
    'robot-vacuum-alert', 'radiator-off',
    # danger
    'water-alert', 'smoke-detector-alert', 'fire-alert',
]

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
        json.dump({'W': HEIGHT, 'H': HEIGHT, 'variants': [variant], 'paths': paths}, open(job, 'w'))
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
        f'{i}vaOldSleepT.val=sleepTimeout',
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


def build_page(page):
    names = [o.name for o in page.objs]
    if names != EXPECTED:
        raise SystemExit(f'{OLD_NAME} is not the expected copy of popupNotify: {names}')
    if bytes(page.head[0x18:0x28]).split(b'\0')[0] != OLD_NAME.encode():
        raise SystemExit('page header does not name page0')
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

    b0 = page.obj('b0')
    down = b0.code('down')
    i = find(down, 'tSend.txt="event,buttonPress2,popupNotify,bExit"')
    down[i] = f'tSend.txt="event,buttonPress2,{NAME},bExit"'
    b0.set('txt', CLOSE)
    b0.set('font', BUTTON_FONT)
    b0.geometry(414, 0, 66, 80)
    b0.set('ycen', 0)
    b0.set('pco', LIGHT_GRAY)
    b0.set('pco2', LIGHT_GRAY)

    for name, x in (('b1', 8), ('b2', 392)):
        b = page.obj(name)
        b.geometry(x, 60, 80, 205)
        b.set('font', BUTTON_FONT)
        b.set('txt', '')
        b.set('xcen', 1)
        b.set('ycen', 1)
        b.set('pco', WHITE)
        b.set('pco2', WHITE)
        down = b.code('down')
        if down[2] != f'tSend.txt="event,buttonPress2,"+entn.txt+",notifyAction,button{name[1]}"':
            raise SystemExit(f'{name}: unexpected event')
        if name == 'b2':
            # right = yes button like popupNotify (button3), button2 (middle) stays unused
            down[2] = 'tSend.txt="event,buttonPress2,"+entn.txt+",notifyAction,button3"'

    icon = page.obj('tIcon')
    icon.geometry(96, 0, 288, HEIGHT)
    icon.set('font', FONT_ID)
    icon.set('xcen', 1)
    icon.set('ycen', 0)
    icon.set('isbr', 0)
    icon.set('txt', '')

    text = page.obj('tText')
    text.geometry(8, 272, 464, 48)
    text.set('font', TEXT_FONT)
    text.set('xcen', 1)
    text.set('ycen', 0)
    text.set('isbr', 1)

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

    switched, without = [], []
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
        if n or name in ('pageStartup', OLD_NAME):
            changes[sec] = p.bytes()
            Page(changes[sec])  # round trip

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
    print(f'tRelease {OLD_RELEASE} -> {NEW_RELEASE}')
    print(f'changed sections: {", ".join(sorted(changes))}')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
