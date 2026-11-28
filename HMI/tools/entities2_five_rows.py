"""HMI 6.3.0 (EU; tRelease stays, card_device.py raises it): cardEntities2 gets five rows, a tap on the left side
of a row without popup sends buttonPress3.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/entities2_five_rows.py <in.HMI> <out.HMI>
Input: a 6.2.0 EU project (480x320) with the page cardEntities2, made in the editor as a copy of cardEntities
(4 rows). The output must not exist.

1. cardEntities2: five rows on a 48 px grid, row k (0..4) with base Y = 75 + 48k:
     bText, bUp, bStop, bDown, nNum   y = Y,     h = 44   (x/w kept)
     btOnOff (picture button 50x50)    y = Y - 4  (h kept)
     tIcon, tEntity                    y = Y + 7, h = 30
     hSlider                           y = Y + 2, h = 40
     touch areas m0..m4                x = 10, w = 251 (to 260), without gaps: see TAP
   Row 5 is a copy of every object of row 4 (also the variables type4/entn4), each inserted behind its row 4
   original (same layering), with the code of row 4 renamed to row 5.
   entityUpd~heading~<prev: 6 fields>~<next: 6 fields>~<row: type~id~icon~color~name~value> x 5:
     row r (1..5) starts at field 14 + 6(r-1), row 5 = fields 38..43 (type, id, icon, color, name, value).
   tmSerial: the parser block of row 4 is copied for row 5 with the field numbers + 6. Before that the script checks
   that row 4 is row 3 shifted by one row (the field grid is regular).
   load: 'vis ..5,0' for the new objects; the colour loop for(sys0=0;sys0<N;..) over b[] gets N + the number of
   inserted objects (it covers the same objects as before plus the new ones).
   Text buffers of cardEntities2 (an adapter-only page, item ids '<page index>?<n>') shrunk, see BUFFERS;
   strCommand from the field grid (NAV_FIELDS, ROW_FIELD_LEN).
   The editor copy still names cardEntities in its own code (load 'cardEntities.bco=', tmSleep sleepReached): fixed.
2. cardEntities and cardEntities2, touch areas m0..m3 / m0..m4: the types with popup stay as they are (page popup..);
   every other type (text, switch, button, unknown) sends event,buttonPress3,<entn>,button; an empty row or 'delete'
   sends nothing. The popup branches become one if/else-if chain so the last branch is 'everything else'.
   The controls on the right (btOnOff, bText, slider, shutter buttons) are not touched. cardSchedule is not changed.
   The same change without cardEntities2, for every model (us-l, us-p do not get that page): entities_left_tap.py.

The pageType switch of every page with tmSerial must have the branch for cardEntities2; a missing one is added behind
the cardEntities branch (same pattern).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402
from screensaver5 import SEND, text_cost  # noqa: E402

PAGE = 'cardEntities2'
PAGES_TAP = ('cardEntities', 'cardEntities2')
ROWS_OLD = 4
ROWS_NEW = 5
ROW_FIRST_FIELD = 14
ROW_FIELDS = 6
GRID_Y0, GRID_STEP = 75, 48
TAP_X, TAP_W = 10, 251
TAP = [(67, 54), (121, 48), (169, 48), (217, 48), (265, 53)]  # m0..m4: y, h

# prefix of the row objects -> (dy, h) relative to the row base Y; None: no geometry (variable)
ROW_GEOMETRY = {
    'bText': (0, 44), 'bUp': (0, 44), 'bStop': (0, 44), 'bDown': (0, 44), 'nNum': (0, 44),
    'btOnOff': (-4, None),
    'tIcon': (7, 30), 'tEntity': (7, 30),
    'hSlider': (2, 40),
    'type': None, 'entn': None,
}

# popup per type of the touch areas (unchanged)
POPUPS = [
    ('shutter', 'popupShutter'), ('shutter2', 'popupShutter2'), ('light', 'popupLight'),
    ('light2', 'popupLight2'), ('fan', 'popupFan'), ('input_sel', 'popupInSel'), ('timer', 'popupTimer'),
    ('number', 'popupSlider'),
]

# text buffers of cardEntities2: prefix (or name) -> new txt_maxl (4k-1: ceil((maxl+1)/4)*4 bytes)
ID_LEN = 23
BUFFERS = {
    'entn': ID_LEN,     # item ids of the adapter '<page index>?<n>'
    'nent': ID_LEN,     # navigation ids
    'tEntity': 39,      # 184 px, narrowest glyph of font 0 is 5 px -> ~36 characters visible
    'bText': 35,        # 166 px -> ~33 characters; also holds 'value|min|max' of number
    'type': 11,         # longest type name input_sel / shutter2 (9)
    'btOnOff': 3,       # picture button, the code never writes its text
    'tInstruction': 11,  # longest compared instruction 'entityUpd' (9), the ack writes up to 5 digits
}
# tSend: longest message 'event,buttonPress2,' + id + ',number-set,' + value (tTmp, 10 characters)
TSEND_LONGEST = len('event,buttonPress2,') + ID_LEN + len(',number-set,') + 10
# strCommand: field lengths of the entityUpd with the buffers above
NAV_FIELDS = (11, ID_LEN, 10, 5, 0, 0)   # type, id, icon (bPrev/bNext 10), colour, name, value
ROW_FIELD_LEN = (11, ID_LEN, 5, 5, 39, 35)  # type, id, icon (tIcon 5), colour, name (tEntity), value (bText)
HEADING_LEN = 40
STR_COMMAND_MAX = 1019

RAM_GLOBAL = 436
RAM_LIMIT = 3584
SPSTR_FIELD = re.compile(r'^(\s*spstr strCommand\.txt,[\w.]+,"~",)(\d+)(.*)$')


def next_4k1(n):
    """smallest 4k-1 >= n"""
    return n + (3 - n) % 4


def str_command_len(rows):
    fields = [len('entityUpd'), HEADING_LEN] + list(NAV_FIELDS) * 2 + list(ROW_FIELD_LEN) * rows
    return sum(fields) + len(fields) - 1


def ram(page):
    """estimate (reference-hmi-ram-model): 9 for the page, ~7 per object, plus the text buffers"""
    total = 9 + 7 * (len(page.objs) - 1)
    for o in page.objs:
        if o.has('txt_maxl') and (o.get('type') != 52 or o.get('sta') == 1):
            total += text_cost(o.get('txt_maxl'))
    return total


def row_names(page, row):
    """names of the objects of a row: '<prefix><row>' with a known prefix"""
    names = []
    for o in page.objs:
        m = re.fullmatch(r'([A-Za-z]+?)(\d+)', o.name)
        if m and int(m.group(2)) == row and m.group(1) in ROW_GEOMETRY:
            names.append(o.name)
    return names


def renamer(row_from, row_to):
    """renames prefix<row_from> -> prefix<row_to> for all row prefixes (also m<row_from-1>)"""
    pattern = re.compile(r'\b(' + '|'.join(ROW_GEOMETRY) + rf'){row_from}\b')
    tap = re.compile(rf'\bm{row_from - 1}\b')

    def apply(line):
        line = pattern.sub(lambda m: f'{m.group(1)}{row_to}', line)
        return tap.sub(f'm{row_to - 1}', line)
    return apply


def shift_fields(line, rows):
    m = SPSTR_FIELD.match(line)
    if not m:
        return line
    return f'{m.group(1)}{int(m.group(2)) + rows * ROW_FIELDS}{m.group(3)}'


# ---------------------------------------------------------------- parser (tmSerial)

def parser_row_range(lines, row):
    """[start, end) of the entityUpd block of a row: from '// get Type' to the end of its number branch"""
    first = f'spstr strCommand.txt,type{row}.txt,"~",{ROW_FIRST_FIELD + ROW_FIELDS * (row - 1)}'
    i = find(lines, first)
    if lines[i - 1].strip() != '// get Type':
        raise SystemExit(f'tmSerial: no "// get Type" in front of {first}')
    last = find(lines, f'if(type{row}.txt=="number")', i)
    return i - 1, block(lines, last)[1]


def patch_parser(page):
    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    a3, b3 = parser_row_range(lines, 3)
    a4, b4 = parser_row_range(lines, 4)
    expect = [shift_fields(renamer(3, 4)(x), 1) for x in lines[a3:b3]]
    if expect != lines[a4:b4]:
        diff = [(x, y) for x, y in zip(expect, lines[a4:b4]) if x != y][:5]
        raise SystemExit(f'tmSerial: row 4 is not row 3 shifted by one row: {diff}')
    if any(f'type{ROWS_NEW}.txt' in x for x in lines):
        raise SystemExit(f'tmSerial: row {ROWS_NEW} exists')
    row5 = [shift_fields(renamer(4, 5)(x), 1) for x in lines[a4:b4]]
    lines[b4:b4] = row5
    for i, line in enumerate(lines):
        if 'command format: entityUpd' in line:
            lines[i] = line.replace(']x4', ']x5')
    serial.set_code('timer', lines)
    return a4, b4, len(row5)


# ---------------------------------------------------------------- load

def patch_load(page, inserted):
    load = page.obj(PAGE).code('load')
    vis4 = re.compile(r'vis ([A-Za-z]+)4,0')
    rows4 = [i for i, x in enumerate(load) if vis4.fullmatch(x.strip()) and vis4.fullmatch(x.strip()).group(1)
             in ROW_GEOMETRY]
    if not rows4 or rows4 != list(range(rows4[0], rows4[-1] + 1)):
        raise SystemExit(f'{PAGE}.load: the vis lines of row 4 are not one block: {rows4}')
    new = ['//ui e5'] + [renamer(4, 5)(load[i]) for i in rows4]
    load[rows4[-1] + 1:rows4[-1] + 1] = new
    loops = [i for i, x in enumerate(load) if re.fullmatch(r'for\(sys0=0;sys0<\d+;sys0\+\+\)', x.strip())]
    if len(loops) != 1:
        raise SystemExit(f'{PAGE}.load: {len(loops)} loops over b[]')
    old = int(re.search(r'<(\d+);', load[loops[0]]).group(1))
    load[loops[0]] = load[loops[0]].replace(f'<{old};', f'<{old + inserted};')
    page.obj(PAGE).set_code('load', load)
    return old, old + inserted


# ---------------------------------------------------------------- touch areas (Auftrag 2)

def tap_lines(row, header):
    """code of a touch area: popup types open their popup, every other type sends buttonPress3"""
    out = list(header)
    for n, (kind, popup) in enumerate(POPUPS):
        out.append(f'if(type{row}.txt=="{kind}")' if n == 0 else f'}}else if(type{row}.txt=="{kind}")')
        out += ['{', f'  page {popup}']
    out += [
        f'}}else if(type{row}.txt!="delete"&&type{row}.txt!="")',
        '{',
        '  // no popup for this type: the tap on the left side goes to the adapter (entities2_five_rows.py)',
        f'  tSend.txt="event,buttonPress3,"+entn{row}.txt+",button"',
    ]
    out += ['  ' + x for x in SEND]
    out.append('}')
    return out


def old_tap_lines(row, header):
    """the touch area code of cardEntities 6.2.0"""
    out = list(header)
    for kind, popup in POPUPS:
        out += [f'if(type{row}.txt=="{kind}")', '{', f'page {popup}', '}']
    out += [f'if(type{row}.txt=="text")', '{', f'tSend.txt="event,buttonPress2,"+entn{row}.txt+",button"']
    out += SEND
    out.append('}')
    return out


def patch_taps(page, rows):
    name = page.objs[0].name
    for row in range(1, rows + 1):
        m = page.obj(f'm{row - 1}')
        old = m.code('down')
        header = [f'pageIcons.tTmp1.txt=tEntity{row}.txt', f'pageIcons.tTmp2.txt=entn{row}.txt',
                  f'pageIcons.tTmp3.txt=tIcon{row}.txt', f'tempIconColor=tIcon{row}.pco']
        if [x.strip() for x in old] != [x.strip() for x in old_tap_lines(row, header)]:
            raise SystemExit(f'{name}.m{row - 1}: unexpected down code:\n' + '\n'.join(old))
        m.set_code('down', tap_lines(row, header))


# ---------------------------------------------------------------- row 5

def add_row(page):
    if row_names(page, ROWS_NEW) or any(o.name == f'm{ROWS_NEW - 1}' for o in page.objs):
        raise SystemExit(f'{PAGE}: row {ROWS_NEW} exists')
    names = row_names(page, ROWS_OLD) + [f'm{ROWS_OLD - 1}']
    rename = renamer(ROWS_OLD, ROWS_NEW)
    inserted = []
    for name in names:
        src = page.obj(name)
        o = src.copy()
        o.set('objname', rename(name))
        for item in o.items:
            if item[0] == 'code':
                item[2] = [rename(x) for x in item[2]]
        page.objs.insert(page.objs.index(src) + 1, o)
        inserted.append(o.name)
    return inserted


def set_geometry(page):
    for row in range(1, ROWS_NEW + 1):
        base = GRID_Y0 + GRID_STEP * (row - 1)
        for name in row_names(page, row):
            prefix = name[:-len(str(row))]
            geo = ROW_GEOMETRY[prefix]
            if geo is None:
                continue
            o = page.obj(name)
            dy, h = geo
            o.geometry(o.get('x'), base + dy, o.get('w'), o.get('h') if h is None else h)
        y, h = TAP[row - 1]
        page.obj(f'm{row - 1}').geometry(TAP_X, y, TAP_W, h)


def shrink_buffers(page):
    """[(name, old, new)]"""
    out = []
    for o in page.objs:
        if not o.has('txt_maxl'):
            continue
        prefix = re.sub(r'\d+$', '', o.name)
        new = BUFFERS.get(o.name, BUFFERS.get(prefix))
        if o.name == 'tSend':
            new = next_4k1(TSEND_LONGEST)
        if o.name == 'strCommand':
            new = next_4k1(str_command_len(ROWS_NEW))
            if new > STR_COMMAND_MAX:
                raise SystemExit(f'strCommand {new} > {STR_COMMAND_MAX}')
        if new is None:
            continue
        if o.name.startswith('btOnOff') and o.get('txt') != '':
            raise SystemExit(f'{o.name} has a text')
        old = o.get('txt_maxl')
        if len(o.get('txt').encode('utf-8')) > new:
            raise SystemExit(f'{o.name}: text longer than {new}')
        o.set('txt_maxl', new)
        out.append((o.name, old, new))
    return out


def check_btonoff_text(page):
    """the code of the page must not write the text of btOnOff (its buffer shrinks to 3)"""
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind == 'code' and any(re.search(r'btOnOff\d\.txt', x) for x in lines):
                raise SystemExit(f'{o.name}.{event} writes btOnOff.txt')


# ---------------------------------------------------------------- page name of the copy

def fix_page_name(page):
    """the editor copy keeps 'cardEntities' in its own code: load 'cardEntities.bco=..' (colours the other page),
    tmSleep 'event,sleepReached,cardEntities' and a comment; the pageType switch (tmSerial) stays"""
    old = re.compile(r'\bcardEntities\b(?!2)')
    out = []
    for o in page.objs:
        if o.name == 'tmSerial':
            continue
        for item in o.items:
            if item[0] != 'code':
                continue
            for i, line in enumerate(item[2]):
                if old.search(line):
                    item[2][i] = old.sub(PAGE, line)
                    out.append(f'{o.name}.{item[1]}: {item[2][i].strip()}')
    return out


# ---------------------------------------------------------------- pageType switch

def add_page_switch(lines):
    """adds the cardEntities2 branch behind the cardEntities branch; returns 1 if added"""
    if any(x.strip() == f'if(tId.txt=="{PAGE}")' for x in lines):
        return 0
    i = find(lines, 'if(tId.txt=="cardEntities")')
    a, b = block(lines, i)
    body = lines[a:b]
    if [x.strip() for x in body] != ['if(tId.txt=="cardEntities")', '{', 'page cardEntities', '}']:
        raise SystemExit(f'unexpected cardEntities branch: {body}')
    lines[b:b] = [x.replace('cardEntities', PAGE) for x in body]
    return 1


def audit(page):
    """lines that name row 4 objects, per object/event, and the same for row 5"""
    out = []
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind != 'code':
                continue
            r4 = sum(1 for x in lines if re.search(r'\b(' + '|'.join(ROW_GEOMETRY) + r')4\b', x))
            r5 = sum(1 for x in lines if re.search(r'\b(' + '|'.join(ROW_GEOMETRY) + r')5\b', x))
            if r4 or r5:
                out.append(f'{o.name}.{event}: row4 {r4} row5 {r5}')
    return out


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    pages = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            pages[page.objs[0].name] = (section, page)
    if PAGE not in pages:
        raise SystemExit(f'no page {PAGE}')
    changes = {}

    # 1. cardEntities2
    section, page = pages[PAGE]
    before = ram(page)
    check_btonoff_text(page)
    renamed = fix_page_name(page)
    inserted = add_row(page)
    a4, b4, n5 = patch_parser(page)
    loop = patch_load(page, len(inserted))
    set_geometry(page)
    patch_taps(page, ROWS_NEW)
    buffers = shrink_buffers(page)
    after = ram(page)
    print(f'{PAGE}: own name fixed in: ' + '; '.join(renamed))
    print(f'{PAGE}: inserted {", ".join(inserted)}')
    print(f'{PAGE}: tmSerial row 4 lines {a4}..{b4}, row 5 +{n5} lines (fields '
          f'{ROW_FIRST_FIELD + ROW_FIELDS * 4}..{ROW_FIRST_FIELD + ROW_FIELDS * 5 - 1})')
    print(f'{PAGE}: load loop sys0<{loop[0]} -> sys0<{loop[1]} of {len(page.objs)} objects')
    print(f'{PAGE}: strCommand needs {str_command_len(ROWS_NEW)} (4 rows {str_command_len(4)}), '
          f'tSend longest {TSEND_LONGEST}')
    for name, old, new in buffers:
        if old != new:
            print(f'  buffer {name:12} {old:4} -> {new:4} ({text_cost(old)} -> {text_cost(new)} bytes)')
    print('\n'.join('  ' + x for x in audit(page)))
    print(f'{section:6} {PAGE:13} RAM (estimate) page {before} -> {after}, with global {RAM_GLOBAL + before} -> '
          f'{RAM_GLOBAL + after} of {RAM_LIMIT}')
    if RAM_GLOBAL + after > RAM_LIMIT:
        raise SystemExit(f'{PAGE}: RAM {RAM_GLOBAL + after} > {RAM_LIMIT}')

    # 2. cardEntities: touch areas
    sec_e, page_e = pages['cardEntities']
    before_e = ram(page_e)
    patch_taps(page_e, ROWS_OLD)
    print(f'{sec_e:6} cardEntities  RAM (estimate) page {before_e} -> {ram(page_e)}, with global '
          f'{RAM_GLOBAL + ram(page_e)} of {RAM_LIMIT}')

    # pageType switch
    switched, without = [], []
    for name, (sec, p) in pages.items():
        if not any(o.name == 'tmSerial' for o in p.objs):
            continue
        n = 0
        has = False
        for o in p.objs:
            for item in o.items:
                if item[0] == 'code' and any(x.strip() == 'if(tId.txt=="cardEntities")' for x in item[2]):
                    has = True
                    n += add_page_switch(item[2])
        if n:
            switched.append(name)
        if not has:
            without.append(name)
        if n or name in (PAGE, 'cardEntities'):
            changes[sec] = p.bytes()
            Page(changes[sec])  # round trip
    print(f'pageType branch {PAGE} added on {len(switched)} pages: {", ".join(sorted(switched)) or "-"}')
    print(f'pages with tmSerial without cardEntities branch: {", ".join(sorted(without)) or "-"}')

    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'changed sections: {", ".join(sorted(changes))}')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
