"""HMI 6.2.0 (stays 6.2.0): smaller id buffers (txt_maxl 23) where only short ids can arrive - saves page RAM.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/shrink_id_buffers.py HMI/nspanel-v6.2.0.HMI <out.HMI> [<in.tft>]
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/shrink_id_buffers.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/shrink_id_buffers.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI>
Input: a 6.2.0 project (EU, us-l or us-p), the output must not exist. <in.tft>: optional, the TFT compiled from the
input - its page table gives the measured RAM before (otherwise only the estimate is printed).

Finding: the string variables that hold the ids of page items (entn, entn<N>) and of the navigation (nent1, nent2)
have txt_maxl 64-80 (us-p cardEntities 64/38, cardQR nent 50). Each costs ceil((txt_maxl + 1) / 4) * 4 bytes of page
RAM (reference-hmi-ram-model), cardMedia EU is at 3580 of 3584.
What the adapter sends there: page item ids '<page index>?<n>' (Page.createPageItems/getPageItemAt, page index =
String(a) in panel.ts), '<page index>?logo', 'media' (cardMedia field 14), '<page index>?0-NextPageArrow' (PageMenu),
navigation 'bUp', 'bSubPrev', 'bSubNext', 'bHome', 'bPrev', 'bNext'. All of them are far below 23 characters.
What the script NSPanelTs (TFT 5.x, but it drives the same pages) sends there: placeId (a number), the media ids
'0?speakerlist' etc. (13), the same navigation names - and on some pages much longer values:
  cardEntities/cardGrid/cardGrid2/cardGrid3/cardSchedule/cardThermo2 entn<N> (CreateEntity): 'navigate.<targetPage>',
      'navigate.<ioBroker id>', free texts of the roles warning (TITLE) and timeTable (DIRECTION),
  cardThermo/cardThermo2/cardAlarm (also cardUnlock) entn (field 14): the ioBroker id of the first item,
  cardQR entn1/entn2: translated texts or the ioBroker id of the item,
  popupThermo entn: copy of cardThermo.entn (pageIcons.tTmp2), popupNotify entn: the content of a user data point,
  pageIcons.tTmp2: copy of a card entn on its way into a popup (cardThermo -> popupThermo).
The adapter itself sends the page name (String(this.name), any length) in cardThermo2 field 14.
These buffers stay as they are (SKIP), as does pageIcons.tTmp2 (global, 80).

Fix: txt_maxl 23 (ceil(24/4)*4 = 24 bytes) for
  nent1, nent2           every page (fields 3 and 9 of entityUpd - always navigation names)
  cardMedia entn*        entn (field 14), entn1..entn6 (fields 24..54: logo and option ids)
  cardChart, cardLChart, cardPChart, cardQR entn     no writer at all
  popupLight, popupLight2, popupShutter, popupShutter2, popupSlider, popupFan, popupInSel, popupTimer, popupNotify3
                         entn: copy of pageIcons.tTmp2 (an entn<N> of a card - the page item id/placeId), popupTimer
                         also field 4 of entityUpdateDetail (the item id), popupNotify3 field 1 (the popup page id)
Before the change every write into a shrunk buffer is checked against the list WRITERS (assignment, += or the target
of spstr/substr/covx; also b[..].txt): another writer stops the script with SystemExit. The writers of
pageIcons.tTmp2 are listed and checked against TMP2_WRITERS as well. The objects must be local string variables.
RAM: the script prints the estimate before and after per changed page (with global, global unchanged 436), the
measured value from the TFT if given. pageStartup.tRelease stays 6.2.0.
"""
import os
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402
from screensaver5 import text_cost  # noqa: E402

NEW_MAXL = 23
VAR_TYPE = 52
TMP2 = 'pageIcons.tTmp2.txt'
POPUPS = ('popupLight', 'popupLight2', 'popupShutter', 'popupShutter2', 'popupSlider', 'popupFan', 'popupInSel',
          'popupTimer', 'popupNotify3')
NO_WRITER = ('cardChart', 'cardLChart', 'cardPChart', 'cardQR')


def spstr(name, field):
    return f'spstr strCommand.txt,{name}.txt,"~",{field}'


COPY_TMP2 = f'entn.txt={TMP2}'

# page -> {buffer: allowed writers}; nent1/nent2 are added for every page that has them
WRITERS = {
    'cardMedia': {'entn': {spstr('entn', 14)}, **{f'entn{n}': {spstr(f'entn{n}', 18 + 6 * n)} for n in range(1, 7)}},
    **{page: {'entn': set()} for page in NO_WRITER},
    **{page: {'entn': {COPY_TMP2}} for page in POPUPS},
}
WRITERS['popupTimer']['entn'] = {COPY_TMP2, spstr('entn', 4)}
WRITERS['popupNotify3']['entn'] = {spstr('entn', 1)}
NAV_WRITERS = {'nent1': {spstr('nent1', 3)}, 'nent2': {spstr('nent2', 9)}}

# buffers that keep their size (see above); checked: they exist with txt_maxl > 23 or are listed for the report
SKIP = {
    'cardEntities': 'entn<N>: script CreateEntity - navigate.<targetPage>/navigate.<ioBroker id>, warning/timeTable text',
    'cardGrid': 'entn<N>: script CreateEntity (see cardEntities)',
    'cardGrid2': 'entn<N>: script CreateEntity (see cardEntities)',
    'cardGrid3': 'entn<N>: script CreateEntity (see cardEntities)',
    'cardSchedule': 'entn<N>: script CreateEntity (see cardEntities)',
    'cardThermo': 'entn: script ioBroker id of the first item (field 14)',
    'cardThermo2': 'entn: adapter page name, script ioBroker id; entn<N>: script CreateEntity',
    'cardAlarm': 'entn: script ioBroker id of the first item (field 14, also cardUnlock)',
    'cardQR': 'entn1/entn2: script translated text or ioBroker id',
    'popupThermo': 'entn: copy of cardThermo.entn (script ioBroker id)',
    'popupNotify': 'entn: script content of a user data point (popupNotifyInternalName)',
}
TMP2_WRITERS = {
    spstr('pageIcons.tTmp2', 3),  # pageType~<page>~<arg>~<field 3>: screensaver colors, popup item id
    'pageIcons.tTmp2.txt=""',  # screensavers
}
TMP2_COPY = re.compile(r'pageIcons\.tTmp2\.txt=entn\d*\.txt')  # card -> popup

ID_NAME = re.compile(r'(entn\d*|nent\d+)')
WRITE_ASSIGN = re.compile(r'^\s*(?:pageIcons\.)?([A-Za-z_]\w*|b\[[^\]]*\])\.txt\s*\+?=(?!=)')
WRITE_CMD = re.compile(r'^\s*(spstr|substr|covx)\s+[^,]+,\s*((?:pageIcons\.)?(?:\w+|b\[[^\]]*\]))\.txt\s*,')

# RAM estimate per object type (fitted on the page table of nspanel-v6.2.0.navblink1.tft, residual about +-25,
# most pages +-7) plus ceil((txt_maxl + 1) / 4) * 4 per local text buffer; global as the TFT reports it
RAM_BASE = {0: 44, 1: 27, 5: 14, 51: 8, 52: 5, 53: 13, 54: 27, 59: 23, 98: 13, 109: 0, 112: 0, 116: 9, 121: 4}
RAM_GLOBAL = 436
RAM_LIMIT = 3584


def has_buffer(o):
    """local text buffer: not a number variable, not global (vscope 1 counts to the global RAM)"""
    if not o.has('txt_maxl'):
        return False
    if o.get('type') == VAR_TYPE and o.get('sta') != 1:
        return False
    return not (o.has('vscope') and o.get('vscope') == 1)


def ram(page):
    total = 0
    for o in page.objs:
        kind = o.get('type')
        if kind not in RAM_BASE:
            raise SystemExit(f'{page.objs[0].name}.{o.name}: no RAM base for type {kind}')
        total += RAM_BASE[kind]
        if has_buffer(o):
            total += text_cost(o.get('txt_maxl'))
    return total


def tft_ram(path, order):
    """{section: page RAM} from the page table of a compiled TFT (16-byte entries, RAM in the 2nd u32, in the page
    order of main.HMI, then 0xFF x 20 and the global RAM)"""
    data = open(path, 'rb').read()
    end = data.find(b'\xff' * 20 + struct.pack('<I', RAM_GLOBAL))
    if end < 0:
        raise SystemExit(f'{path}: no page table with global {RAM_GLOBAL}')
    start = end - 16 * len(order)
    return {sec: struct.unpack_from('<I', data, start + 16 * i + 4)[0] for i, sec in enumerate(order)}


def writes(page):
    """[(object, event, buffer, line)] of every code line that writes a .txt"""
    out = []
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind != 'code':
                continue
            for line in lines:
                text = line.strip()
                if text.startswith('//'):
                    continue
                m = WRITE_ASSIGN.match(text)
                target = m.group(1) if m else None
                if not m:
                    m = WRITE_CMD.match(text)
                    target = m.group(2) if m else None
                if target is None:
                    continue
                if target.startswith('b['):
                    raise SystemExit(f'{page.objs[0].name}.{o.name}.{event}: indirect write {text}')
                if text.startswith('pageIcons.') or target.startswith('pageIcons.'):
                    target = 'pageIcons.' + target.split('pageIcons.')[-1]
                out.append((o.name, event, target, text))
    return out


def plan(page):
    """{buffer: old txt_maxl} to shrink on this page, checked"""
    name = page.objs[0].name
    allowed = dict(WRITERS.get(name, {}))
    for o in page.objs:
        if o.name in NAV_WRITERS:
            allowed[o.name] = NAV_WRITERS[o.name]
    found = {}
    for buf, writers in allowed.items():
        try:
            o = page.obj(buf)
        except KeyError:
            if buf in NAV_WRITERS or name in POPUPS or name in WRITERS:
                raise SystemExit(f'{name}: {buf} missing')
            continue
        if o.get('type') != VAR_TYPE or o.get('sta') != 1 or o.get('vscope') != 0:
            raise SystemExit(f'{name}.{buf}: not a local string variable')
        actual = {text for _, _, target, text in writes(page) if target == buf}
        if actual - writers:
            raise SystemExit(f'{name}.{buf}: unexpected writers {sorted(actual - writers)}')
        if o.get('txt_maxl') > NEW_MAXL:
            found[buf] = o.get('txt_maxl')
    return found


def tmp2_writers(pages):
    """[(page, object, event, line)] of every write into pageIcons.tTmp2, checked"""
    out = []
    for page in pages:
        for obj, event, target, text in writes(page):
            if target != 'pageIcons.tTmp2':
                continue
            if text not in TMP2_WRITERS and not TMP2_COPY.fullmatch(text):
                raise SystemExit(f'{page.objs[0].name}.{obj}.{event}: unexpected writer of tTmp2: {text}')
            out.append((page.objs[0].name, obj, event, text))
    return out


def main(source, target, tft=None):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    order = [m.group(1).decode() + '.pa' for m in re.finditer(rb'(\d+)\.pa\x00', hmi.files['main.HMI'])]
    measured = tft_ram(tft, order) if tft else {}
    sections = {sec: Page(data) for sec, data in hmi.files.items() if sec.endswith('.pa')}

    icons = [p for p in sections.values() if p.objs[0].name == 'pageIcons'][0]
    tmp2 = icons.obj('tTmp2')
    if tmp2.get('vscope') != 1 or tmp2.get('sta') != 1:
        raise SystemExit('pageIcons.tTmp2 is not a global string variable')
    kinds = {}
    for page, obj, event, text in tmp2_writers(sections.values()):
        key = 'copy entn -> popup' if TMP2_COPY.fullmatch(text) else text
        kinds.setdefault(key, set()).add(page)
    print(f'pageIcons.tTmp2 (txt_maxl {tmp2.get("txt_maxl")}, unchanged) writers:')
    for key, pages in sorted(kinds.items()):
        print(f'  {key}: {", ".join(sorted(pages))}')

    changes = {}
    for sec in order:
        page = sections[sec]
        name = page.objs[0].name
        found = plan(page)
        kept = sorted(o.name for o in page.objs if ID_NAME.fullmatch(o.name) and o.name not in found
                      and o.get('txt_maxl') > NEW_MAXL)
        if kept and name not in SKIP:
            raise SystemExit(f'{name}: {kept} keep txt_maxl > {NEW_MAXL} without a reason in SKIP')
        if not found:
            if kept:
                print(f'{sec:6} {name:13} kept {kept}: {SKIP[name]}')
            continue
        before = ram(page)
        for buf in found:
            page.obj(buf).set('txt_maxl', NEW_MAXL)
        after = ram(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[sec] = out
        line = (f'{sec:6} {name:13} {", ".join(f"{b} {m}" for b, m in found.items())} -> {NEW_MAXL}; RAM (estimate) '
                f'with global {RAM_GLOBAL + before} -> {RAM_GLOBAL + after} of {RAM_LIMIT}')
        if sec in measured:
            line += f'; TFT {RAM_GLOBAL + measured[sec]} -> {RAM_GLOBAL + measured[sec] - before + after}'
        print(line)
        if kept:
            print(f'{"":20} kept {kept}: {SKIP[name]}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(*sys.argv[1:4])
