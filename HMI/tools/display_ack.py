"""HMI 6.1.0: the display acknowledges every message it has processed, renderCurrentPage carries the CRC of its pageType.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/display_ack.py HMI/nspanel-v6.0.9.HMI HMI/nspanel-v6.1.0.HMI
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/display_ack.py HMI/us-l/nspanel-us-l-v6.0.9.HMI \
      HMI/us-l/nspanel-us-l-v6.1.0.HMI
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/display_ack.py HMI/us-p/nspanel-us-p-v6.0.9.HMI \
      HMI/us-p/nspanel-us-p-v6.1.0.HMI
Input: a 6.0.9 project (EU, us-l or us-p), the output must not exist.

Frame of every message (both directions): 55 BB, payload length (u16 LE), payload, CRC16 Modbus (u16 LE) over all
bytes before it. Every page with tmSerial checks the CRC of a message and keeps it in the global int recvCrc
(Program.s).

1. Acknowledgement: at the end of the CRC-ok branch of tmSerial (after '// end of user code', udelete, bufferPos=0)
   the page sends 'event,ack,<recvCrc decimal>' in the usual frame. tSend and tTmp are not free there (tSend holds
   the bExit / long press text between tc0 down and up, tTmp the long press type of tmLP on the card pages), and
   several pages have no RAM left for a new text variable (cardLChart and popupThermo 3144 of ~3148 bytes in the
   6.0.9 TFT). So the digits go into tInstruction (only used by tmSerial, the next message writes it again) and
   'event,ack,' goes into CRC and serial port as hex (crcputh/printh) - the frame is byte for byte the same as
   with a text 'event,ack,<crc>'.
   Behind the CRC check recvCrc is set to 0 (also after a wrong CRC): from then on only a pageType that switched
   the page leaves a CRC in recvCrc (the code after 'page X' does not run on the old page).
   cardChart uses recvCrc as a helper in entityUpd: a block that assigns recvCrc reads the CRC again from the serial
   buffer at its end (the message is still there).
2. renderCurrentPage: the 'load' event of a page sending 'event,renderCurrentPage' now sends
   'event,renderCurrentPage,<recvCrc>' - the CRC of the pageType that opened the page, 0 if the HMI opened it - and
   sets recvCrc to 0. Pages with tmSerial but without renderCurrentPage (popups, pageStartup, pageTest) start their
   'load' with: if(recvCrc!=0) { the same event,ack,<recvCrc> as at the end of tmSerial; recvCrc=0 } - the pageType
   that opened them is acknowledged before pageOpenDetail etc., an HMI-internal opening (recvCrc 0) sends nothing.
3. strCommand: txt_maxl at most 1019 (the receive buffer of the display holds 1023 bytes, a payload is at most
   1017 bytes); this concerns screensaver2/5 (1800) and cardChart/cardLChart (1750).
4. weatherUpdate of screensaver2 and screensaver5: color (pco) and font before the text, the text last - every
   assignment redraws the object, after the page load txt is empty. The indicators f<N>Icon of screensaver5 parse
   their text into tFIcon first (font suffix '¬<font id>', else the default font), assign the font only when
   it changes, then pco, then txt. Field indexes unchanged.
5. Version: pageStartup tRelease 6.0.9 -> 6.1.0 (event,startup,<tVersion>,<model>,<tRelease>).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402
from screensaver5 import ICON_FONT_MARK, text_cost, var_obj  # noqa: E402

OLD_RELEASE, NEW_RELEASE = '6.0.9', '6.1.0'
STR_COMMAND_MAXL = 1019
ACK_PREFIX = 'event,ack,'
ACK_HEX = ' '.join(f'{b:02x}' for b in ACK_PREFIX.encode())
ACK_VAR = 'tInstruction'
ICON_VAR = 'tFIcon'
WEATHER_PAGES = ('screensaver2', 'screensaver5')

RENDER_OLD = 'tSend.txt="event,renderCurrentPage"'
END_OF_USER_CODE = ['// end of user code', 'udelete payloadLength-1', 'bufferPos=0']
CRC_IF = 'if(crcval==recvCrc)'
RECV_ASSIGN = re.compile(r'^\s*recvCrc\s*=(?!=)')
WEATHER_IF = re.compile(r'if\(tInstruction\.txt=="weatherUpdate"')


def ack_lines(ind):
    """sends event,ack,<recvCrc>: the digits in tInstruction, the prefix as hex"""
    return [ind + line for line in [
        f'// acknowledge this message: {ACK_PREFIX}<recvCrc> ("{ACK_PREFIX}" as hex, digits in {ACK_VAR})',
        f'covx recvCrc,{ACK_VAR}.txt,0,0',
        f'btlen {ACK_VAR}.txt,sys0',
        f'sys0+={len(ACK_PREFIX)}',
        'crcrest 1,0xffff // reset CRC',
        'crcputh 55 bb',
        'crcputs sys0,2',
        f'crcputh {ACK_HEX}',
        f'crcputs {ACK_VAR}.txt,0',
        '//send cmd',
        'printh 55 bb',
        'prints sys0,2',
        f'printh {ACK_HEX}',
        f'prints {ACK_VAR}.txt,0',
        'prints crcval,2',
    ]]


def render_lines():
    return [
        '// renderCurrentPage with the CRC of the pageType that opened this page (0: opened by the HMI)',
        'covx recvCrc,tTmp.txt,0,0',
        'tSend.txt="event,renderCurrentPage,"+tTmp.txt',
        'recvCrc=0',
    ]


def load_ack_lines():
    """start of the load of a page without renderCurrentPage: acknowledges the pageType that opened it"""
    return (['// opened by a pageType (recvCrc!=0): acknowledge it here, the old page did not get to its ack',
             'if(recvCrc!=0)', '{'] + ack_lines('  ') + ['  recvCrc=0', '}'])


def indent(line):
    return line[:len(line) - len(line.lstrip())]


def patch_serial(page):
    """acknowledgement, recvCrc reset and the re-read for blocks that use recvCrc as a helper; returns the number of
    re-reads"""
    name = page.objs[0].name
    ser = page.obj('tmSerial')
    lines = ser.code('timer')
    stripped = [line.strip() for line in lines]
    if any('event,ack' in line for line in lines):
        raise SystemExit(f'{name}: tmSerial already sends the ack')
    hits = [i for i in range(len(lines)) if stripped[i:i + 3] == END_OF_USER_CODE]
    if len(hits) != 1:
        raise SystemExit(f'{name}: tmSerial end of user code found {len(hits)} times')
    if ACK_VAR not in {o.name for o in page.objs}:
        raise SystemExit(f'{name}: {ACK_VAR} missing')

    # helper use of recvCrc inside an instruction block (cardChart): read the CRC again at the end of that block
    rereads = 0
    start = 0
    while True:
        try:
            i = next(k for k in range(start, len(lines)) if lines[k].strip().startswith('if(tInstruction.txt=='))
        except StopIteration:
            break
        a, b = block(lines, i)
        if any(RECV_ASSIGN.match(line) for line in lines[a:b]):
            if lines[b - 1].strip() != '}' or indent(lines[b - 1]) != indent(lines[a]):
                raise SystemExit(f'{name}: unexpected end of {lines[a].strip()}')
            ind = indent(lines[a]) + '  '
            lines[b - 1:b - 1] = [ind + '// recvCrc was a helper above: the CRC of this message again for the ack',
                                  ind + 'ucopy recvCrc,payloadLength-1,2,0']
            rereads += 1
            b += 2
        start = b

    # acknowledgement behind bufferPos=0
    stripped = [line.strip() for line in lines]
    e = next(i for i in range(len(lines)) if stripped[i:i + 3] == END_OF_USER_CODE)
    lines[e + 3:e + 3] = ack_lines(indent(lines[e]))

    # recvCrc=0 behind the CRC check
    c = find(lines, CRC_IF)
    a, b = block(lines, c)
    if lines[b - 1].strip() != '}' or indent(lines[b - 1]) != indent(lines[c]):
        raise SystemExit(f'{name}: unexpected end of {CRC_IF}')
    ind = indent(lines[c])
    lines[b:b] = [ind + '// only a pageType that switched the page leaves its CRC for renderCurrentPage',
                  ind + 'recvCrc=0']
    ser.set_code('timer', lines)
    return rereads


def patch_load(page):
    """'render' when the load event sends renderCurrentPage (now with the CRC), 'ack' when a page with tmSerial
    and without renderCurrentPage got the ack of its pageType at the start of load, else False"""
    head = page.objs[0]
    try:
        load = head.code('load')
    except KeyError:
        return False
    hits = [i for i, line in enumerate(load) if 'renderCurrentPage' in line]
    if not hits:
        names = {o.name for o in page.objs}
        if 'tmSerial' not in names:
            return False
        if ACK_VAR not in names:
            raise SystemExit(f'{head.name}: {ACK_VAR} missing')
        if any('event,ack' in line for line in load):
            raise SystemExit(f'{head.name}: load already sends the ack')
        head.set_code('load', load_ack_lines() + load)
        return 'ack'
    if len(hits) != 1 or load[hits[0]] != RENDER_OLD:
        raise SystemExit(f'{head.name}: unexpected renderCurrentPage in load: {[load[i] for i in hits]}')
    if 'tTmp' not in {o.name for o in page.objs}:
        raise SystemExit(f'{head.name}: tTmp missing')
    i = hits[0]
    load[i:i + 1] = render_lines()
    head.set_code('load', load)
    return 'render'


def shrink_command(page):
    o = page.obj('strCommand')
    old = o.get('txt_maxl')
    if old > STR_COMMAND_MAXL:
        o.set('txt_maxl', STR_COMMAND_MAXL)
        return old
    return None


SPSTR = re.compile(r'^(\s*)spstr strCommand\.txt,(\w+)\.txt,"~",(\d+)$')
COVX_PCO = re.compile(r'^\s*covx tTmp\.txt,(\w+)\.pco,0,0$')
FONT_DEFAULT = re.compile(r'^\s*(f\d+Icon)\.font=(\d+)$')


def indicator_lines(ind, name, field, default, color_lines):
    """screensaver5 f<N>Icon: text into tFIcon, font only when it changes, color, text last"""
    return [ind + line for line in [
        f'// {name}: font from the suffix, then color, the text last (every assignment redraws)',
        f'spstr strCommand.txt,{ICON_VAR}.txt,"~",{field}',
        f'sys1={default}',
        f'strlen {ICON_VAR}.txt,sys0',
        'if(sys0>1)',
        '{',
        f'  substr {ICON_VAR}.txt,tTmp.txt,sys0-2,1',
        f'  if(tTmp.txt=="{ICON_FONT_MARK}")',
        '  {',
        f'    substr {ICON_VAR}.txt,tTmp.txt,sys0-1,1',
        '    covx tTmp.txt,sys1,0,0',
        f'    substr {ICON_VAR}.txt,{ICON_VAR}.txt,0,sys0-2',
        '  }',
        '}',
        f'if({name}.font!=sys1)',
        '{',
        f'  {name}.font=sys1',
        '}',
    ]] + color_lines + [f'{ind}{name}.txt={ICON_VAR}.txt']


def patch_indicators(lines, a, b):
    """rewrites the f<N>Icon groups with font suffix inside lines[a:b]; returns (new lines, names, max txt length
    source names)"""
    out = []
    names = []
    i = a
    while i < b:
        match = SPSTR.match(lines[i])
        if match and re.fullmatch(r'f\d+Icon', match.group(2)) and i + 1 < b and FONT_DEFAULT.match(lines[i + 1]):
            ind, name, field = match.group(1), match.group(2), match.group(3)
            font = FONT_DEFAULT.match(lines[i + 1])
            if font.group(1) != name:
                raise SystemExit(f'font line of {name}: {lines[i + 1]}')
            # the old suffix block: strlen .. if(sys0>1){..} - then spstr tTmp + covx pco
            if lines[i + 2].strip() != f'strlen {name}.txt,sys0' or lines[i + 3].strip() != 'if(sys0>1)':
                raise SystemExit(f'{name}: unexpected font block')
            _, end = block(lines, i + 3)
            color = lines[end:end + 2]
            if not (SPSTR.match(color[0]) and SPSTR.match(color[0]).group(2) == 'tTmp'
                    and COVX_PCO.match(color[1]) and COVX_PCO.match(color[1]).group(1) == name):
                raise SystemExit(f'{name}: no color after the font block')
            out += indicator_lines(ind, name, field, font.group(2), color)
            names.append(name)
            i = end + 2
            continue
        out.append(lines[i])
        i += 1
    return out, names


def color_first(lines):
    """moves 'spstr strCommand.txt,X.txt,..' (with its comment '//X' right above it) behind the color lines
    'spstr strCommand.txt,tTmp.txt,..' + 'covx tTmp.txt,X.pco,0,0'; returns the names moved"""
    moved = []
    i = 0
    while i < len(lines):
        match = COVX_PCO.match(lines[i])
        if not match:
            i += 1
            continue
        name = match.group(1)
        tmp = SPSTR.match(lines[i - 1])
        if not tmp or tmp.group(2) != 'tTmp':
            raise SystemExit(f'{name}: covx pco without spstr tTmp')
        # the text line of the same object above the color
        j = i - 2
        while j >= 0 and lines[j].strip().startswith('//'):
            j -= 1
        txt = SPSTR.match(lines[j]) if j >= 0 else None
        if not txt or txt.group(2) != name:
            i += 1  # already color first (f<N>Icon of screensaver5) or no text
            continue
        k = j
        if k > 0 and lines[k - 1].strip() == f'//{name}':
            k -= 1
        text_block = lines[k:j + 1]
        color_block = lines[j + 1:i + 1]
        lines[k:i + 1] = color_block + text_block
        moved.append(name)
        i = k + len(color_block) + len(text_block)
    return moved


def patch_weather(page):
    name = page.objs[0].name
    ser = page.obj('tmSerial')
    lines = ser.code('timer')
    hits = [i for i, line in enumerate(lines) if WEATHER_IF.search(line)]
    if len(hits) != 1:
        raise SystemExit(f'{name}: weatherUpdate found {len(hits)} times')
    a, b = block(lines, hits[0])
    new, icons = patch_indicators(lines, a, b)
    if any(f'{n}.font=' in line and 'sys1' not in line for line in new for n in icons):
        raise SystemExit(f'{name}: font assignment left')
    moved = color_first(new)
    lines[a:b] = new
    ser.set_code('timer', lines)
    added = None
    if icons:
        if ICON_VAR in {o.name for o in page.objs}:
            raise SystemExit(f'{name}: {ICON_VAR} exists')
        maxl = max(page.obj(n).get('txt_maxl') for n in icons)
        page.objs.append(var_obj(page.obj('tTmp'), ICON_VAR, maxl))
        added = (ICON_VAR, maxl)
    return icons, moved, added


def patch_release(page):
    o = page.obj('tRelease')
    if o.get('txt') != OLD_RELEASE:
        raise SystemExit(f'tRelease is {o.get("txt")!r}, expected {OLD_RELEASE}')
    if len(NEW_RELEASE.encode()) > o.get('txt_maxl'):
        raise SystemExit('tRelease too short')
    o.set('txt', NEW_RELEASE)


def ram_delta(before, after):
    """text buffer RAM of the page after - before, plus ~7 bytes per new object"""
    def cost(page):
        return {o.name: text_cost(o.get('txt_maxl')) if o.has('txt_maxl') else 0 for o in page.objs}
    old, new = cost(before), cost(after)
    delta = sum(new.values()) - sum(old.values())
    delta += 7 * len(set(new) - set(old))
    return delta


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    changes = {}
    for section, data in hmi.files.items():
        if not section.endswith('.pa'):
            continue
        page = Page(data)
        before = Page(data)
        name = page.objs[0].name
        notes = []
        if name == 'pageStartup':
            patch_release(page)
            notes.append(f'tRelease {NEW_RELEASE}')
        if 'tmSerial' in {o.name for o in page.objs}:
            rereads = patch_serial(page)
            notes.append('ack' + (f' (+{rereads} recvCrc re-read)' if rereads else ''))
            old = shrink_command(page)
            if old:
                notes.append(f'strCommand {old}->{STR_COMMAND_MAXL}')
        load = patch_load(page)
        if load == 'render':
            notes.append('renderCurrentPage,<crc>')
        elif load == 'ack':
            notes.append('load acks its pageType')
        if name in WEATHER_PAGES:
            icons, moved, added = patch_weather(page)
            notes.append(f'weatherUpdate color first {len(moved)}, font-checked indicators {len(icons)}'
                         + (f', new {added[0]}({added[1]})' if added else ''))
        if not notes:
            continue
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        print(f'{section:6} {name:14} RAM {ram_delta(before, page):+5}  ' + '; '.join(notes))
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
