"""HMI 6.2.0 (EU, us-l, us-p): fix the receive loop in the timer 'tmSerial' of every page.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 -I HMI/tools/tmserial_receive_fix.py <in.HMI> <out.HMI>
The output must not exist. Only tmSerial.timer of the pages changes; pages without tmSerial stay as they are.

The loop 'while(bufferPos<usize)' walks the serial buffer u[] byte by byte and looks for the head 55 bb. After the
garbage delete the frame starts at u[0]: payloadLength = <length from u[2..3]> + 3 + 2, the frame (55 bb, 2 length
bytes, payload, 2 CRC bytes) is payloadLength + 1 bytes, the CRC at u[payloadLength-1..payloadLength].

1. Incomplete message: 'if(3<usize)' false (length bytes missing) ends the loop ('bufferPos=usize', the following
   'bufferPos++' leaves it); the next 50 ms tick looks again. 'if(payloadLength<usize)' false ends the loop only if
   the announced frame fits into the serial buffer ('if(payloadLength<1023)': it takes 1023 bytes, the 1024th byte is
   rejected with 0x24 and lost, tested on the panel); otherwise the scan goes on as before,
   so a random 55 bb in garbage with a nonsense length does not block the loop. Before, both cases scanned to the end
   of the buffer on every tick (~0.35 ms per byte, a large message took 200-380 ms until its acknowledgement).
2. 'udelete payloadLength-1' -> 'udelete payloadLength+1' (pageType branch and end of the user code): the whole frame
   including the 2 CRC bytes. Before, the CRC bytes stayed in the buffer until the next tick; a fast next message
   could overflow the buffer (0x24).
3. A pageType with an unknown tId does not switch the page and runs on to the end of the user code; its branch has
   deleted the frame already, so the delete there now runs only if tInstruction.txt!="pageType" (the acknowledgement
   is sent as before). pageTest has no pageType branch and keeps its single delete (only +1).
4. A frame with a wrong CRC is deleted at once ('else' of 'if(crcval==recvCrc)': udelete payloadLength+1,
   bufferPos=0); 'recvCrc=0' behind it runs as before.
5. Frame end check in front of the CRC: behind a complete frame there is either nothing in the buffer or the head of
   the next frame, u[payloadLength+1]==85 (if present) and u[payloadLength+2]==187 (if present). Nextion does not
   calculate in if conditions, so sys0=payloadLength+1 and sys1=payloadLength+2 first; sys0 becomes 0 if the end is
   not plausible (payloadLength+1 is never 0), the CRC check and the user code run only 'if(sys0!=0)'. Otherwise
   there is no real frame at u[0] (a 55 bb inside garbage or inside a payload): nothing is deleted, no CRC check,
   the scan goes on ('bufferPos++'), a later real head deletes the garbage in front of it; 'recvCrc=0' as before.
   sys0/sys1 are free there: no event of any page reads them before writing them (checked per user code branch).
6. A head that announces a frame that can never fit into the serial buffer (payloadLength >= 1023, e.g. a frame of
   1024 bytes that lost its last byte with 0x24) with a full buffer ('if(usize>=1023)', usize never exceeds the
   capacity): the buffer is emptied ('udelete usize', 'bufferPos=usize'), otherwise the Nextion never takes a byte
   again (tested: permanent 0x24). A valid frame (at most 1023 bytes) never gets there, not even when its last bytes
   arrive while the tick runs (an earlier flush behind the loop read the current usize and deleted such a frame).
   With a buffer that is not full the scan goes on as before (a real head behind it is found).
No new variable or object (RAM unchanged).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block, find  # noqa: E402

TOOL = 'tmserial_receive_fix.py'
OLD = 'udelete payloadLength-1'
NEW = 'udelete payloadLength+1'
BUFFER = 1023  # bytes the Nextion serial buffer takes (the 1024th byte: 0x24, lost)
# the lines that make payloadLength the frame length minus 1, in this order, each exactly once
LENGTH = [
    'if(3<usize)',
    'ucopy payloadLength,2,2,0',
    'payloadLength+=3',
    'payloadLength+=2',
    'if(payloadLength<usize)',
    'crcputu 0,payloadLength-1',
    'ucopy recvCrc,payloadLength-1,2,0',
    'if(crcval==recvCrc)',
    'spstr strCommand.txt,tInstruction.txt,"~",0',
    '// end of user code',
]
PAGETYPE = 'if(tInstruction.txt=="pageType")'
ONLY_SWITCHED = '// only a pageType that switched the page leaves its CRC for renderCurrentPage'
# a write of sys0/sys1 as the first use
WRITE = re.compile(r'^(sys[01])=(?!=)|^(covx|btlen|strlen|getpix)\b.*,(sys[01])\b|^(ucopy|substr|spstr)\s+(sys[01]),'
                   r'|^for\((sys[01])=')


def code_of(line):
    return line.split('//')[0].strip()


def indent(line):
    return line[:len(line) - len(line.lstrip())]


def check_block_end(lines, head, after):
    """[a, b) of the if statement 'head' without an else, the line behind it must be 'after'"""
    a, b = block(lines, find(lines, head))
    if any(code_of(x).startswith(('}else', 'else')) and indent(x) == indent(lines[a]) for x in lines[a:b]):
        raise SystemExit(f'{head}: already has an else')
    if lines[b - 1].strip() != '}' or lines[b - 1] != indent(lines[a]) + '}':
        raise SystemExit(f'{head}: unexpected end {lines[b - 1]!r}')
    if b >= len(lines) or lines[b].strip() != after:
        raise SystemExit(f'{head}: unexpected line behind the block {lines[b:b + 1]!r}, expected {after!r}')
    return a, b


def add_else(lines, head, after, body):
    a, b = check_block_end(lines, head, after)
    ind = indent(lines[a])
    lines[b - 1:b] = [ind + x for x in ['}else', '{'] + ['  ' + y for y in body] + ['}']]


def check(lines):
    """the expected structure, raises SystemExit otherwise; returns True if there is a pageType branch"""
    if any(TOOL in x for x in lines):
        raise SystemExit(f'already changed by {TOOL}')
    expect = ['bufferPos=0', 'while(bufferPos<usize)', '{', '// check for 0x55 0xBB - Command Init Secuence',
              'if(u[bufferPos]==187&&u[bufferPos-1]==85)', '{',
              '//remove garbage at the start of the buffer if there\'s any to free buffer for command',
              'if(u[bufferPos]!=1)', '{', 'udelete bufferPos-1', '}']
    w = find(lines, 'while(bufferPos<usize)')
    if [x.strip() for x in lines[w - 1:w + 10]] != expect:
        raise SystemExit(f'unexpected loop head: {lines[w - 1:w + 10]}')
    a, b = block(lines, w)
    if [x.strip() for x in lines[b - 3:b]] != ['// next character', 'bufferPos++', '}']:
        raise SystemExit(f'unexpected loop end: {lines[b - 3:b]}')
    codes = [x.strip() for x in lines]
    if codes.count('if(crcval==recvCrc)') != 1:
        raise SystemExit(f"'if(crcval==recvCrc)': {codes.count('if(crcval==recvCrc)')} times")
    crc = codes.index('if(crcval==recvCrc)')
    at = -1
    for want in LENGTH:
        # the user code may repeat a length line (cardChart uses recvCrc as a helper and reads the CRC again)
        part = codes[:crc + 1] if want in LENGTH[:LENGTH.index('if(crcval==recvCrc)')] else codes
        if part.count(want) != 1:
            raise SystemExit(f'{want!r}: {part.count(want)} times')
        i = codes.index(want)
        if i < at:
            raise SystemExit(f'{want!r} out of order')
        at = i
    others = [code_of(x) for x in lines if code_of(x).startswith('udelete') and code_of(x) != OLD]
    if others != ['udelete bufferPos-1']:
        raise SystemExit(f'unexpected udelete: {others}')
    # tInstruction.txt is written only by the spstr in front of the user code and the acknowledgement behind it
    start, end = codes.index(LENGTH[-2]), codes.index(LENGTH[-1])
    for x in lines[start + 1:end]:
        c = code_of(x)
        if 'tInstruction.txt' in c and re.search(r'tInstruction\.txt(?!==")', c):
            raise SystemExit(f'tInstruction.txt written in the user code: {x!r}')
    # sys0/sys1 are free for the frame end check: not used in front of it, and every user code branch (and the code
    # outside the branches) writes them before reading them
    for x in lines[:codes.index('if(payloadLength<usize)')]:
        if re.search(r'\bsys[01]\b', code_of(x)):
            raise SystemExit(f'sys0/sys1 used in front of the frame end check: {x!r}')
    parts, rest, i = [], [], start + 1
    while i < len(codes):
        if codes[i].startswith('if(tInstruction.txt=="'):
            p, q = block(lines, i)
            parts.append(lines[p:q])
            i = q
        else:
            rest.append(lines[i])
            i += 1
    for part in parts + [rest]:
        for v in ('sys0', 'sys1'):
            for x in part:
                c = code_of(x)
                if re.search(rf'\b{v}\b', c):
                    m = WRITE.match(c)
                    if not (m and v in m.groups()):
                        raise SystemExit(f'{v} read before written in the user code: {x!r}')
                    break
    # end of the user code
    if codes[end + 1:end + 3] != [OLD, 'bufferPos=0']:
        raise SystemExit(f'unexpected end of user code: {lines[end + 1:end + 3]}')
    found = [i for i, c in enumerate(codes) if c == OLD]
    pagetype = codes.count(PAGETYPE)
    if pagetype > 1:
        raise SystemExit(f'{PAGETYPE}: {pagetype} times')
    if pagetype:
        p, q = block(lines, codes.index(PAGETYPE))
        inside = [i for i in found if p < i < q]
        if len(found) != 2 or len(inside) != 1 or codes[inside[0] + 1] != 'bufferPos=0':
            raise SystemExit(f'{OLD}: unexpected places {found} (pageType branch {p}-{q})')
    elif len(found) != 1:
        raise SystemExit(f'{OLD}: {len(found)} times without a pageType branch')
    return bool(pagetype)


def end_check(lines):
    """CRC check and user code only if the frame end is plausible (see 5. above)"""
    p = find(lines, 'if(payloadLength<usize)')
    if [x.strip() for x in lines[p + 1:p + 4]] != ['{', '// calculate crc', 'crcrest 1,0xFFFF']:
        raise SystemExit(f'unexpected start of the complete frame branch: {lines[p + 1:p + 4]}')
    a, b = block(lines, find(lines, 'if(crcval==recvCrc)'))
    if [x.strip() for x in lines[b:b + 3]] != [ONLY_SWITCHED, 'recvCrc=0', '}']:
        raise SystemExit(f'unexpected end of the complete frame branch: {lines[b:b + 3]}')
    ind = indent(lines[p + 2])
    body = ['  ' + x if x.strip() else x for x in lines[p + 2:b]]
    lines[p + 2:b] = [ind + x for x in [
        f'// frame end check ({TOOL}): behind the frame (payloadLength+1 bytes) nothing or the next head 55 bb,',
        '// otherwise there is no real frame at u[0]: no delete, no CRC check, scan on; sys0=0: end not plausible',
        'sys0=payloadLength+1',
        'sys1=payloadLength+2',
        'if(sys0<usize)',
        '{',
        '  if(u[sys0]!=85)',
        '  {',
        '    sys0=0',
        '  }',
        '}',
        'if(sys1<usize)',
        '{',
        '  if(u[sys1]!=187)',
        '  {',
        '    sys0=0',
        '  }',
        '}',
        'if(sys0!=0)',
        '{',
    ]] + body + [ind + '}']


def change(lines):
    has_pagetype = check(lines)
    # inner statements first (their else lies inside the outer block), each place found again by its head line
    add_else(lines, 'if(crcval==recvCrc)', ONLY_SWITCHED, [
        f'// wrong CRC: delete the whole frame at once ({TOOL})',
        NEW,
        'bufferPos=0',
    ])
    end_check(lines)
    add_else(lines, 'if(payloadLength<usize)', '}', [
        f'// the frame (payloadLength+1 bytes) is not complete yet: if it fits into the serial buffer ({BUFFER} bytes),',
        f'// stop scanning, the next tick looks again; otherwise scan on, it is no real head ({TOOL})',
        f'if(payloadLength<{BUFFER})',
        '{',
        '  bufferPos=usize',
        f'}}else if(usize>={BUFFER})',
        '{',
        f'  // the announced frame (payloadLength+1 bytes) can never fit into the serial buffer ({BUFFER} bytes) and the',
        f'  // buffer is full: empty it, otherwise the Nextion never takes a byte again ({TOOL})',
        '  udelete usize',
        '  bufferPos=usize',
        '}',
    ])
    add_else(lines, 'if(3<usize)', '}', [
        f'// the length bytes are not in the buffer yet: stop scanning, the next tick looks again ({TOOL})',
        'bufferPos=usize',
    ])
    e = find(lines, '// end of user code')
    ind = indent(lines[e + 1])
    if has_pagetype:
        lines[e + 1:e + 2] = [ind + x for x in [
            f'// whole frame incl. the 2 CRC bytes; an unknown pageType has deleted it in its branch already ({TOOL})',
            'if(tInstruction.txt!="pageType")',
            '{',
            '  ' + NEW,
            '}',
        ]]
        p, q = block(lines, find(lines, PAGETYPE))
        i = [i for i in range(p, q) if lines[i].strip() == OLD][0]
        ind = indent(lines[i])
        lines[i:i + 1] = [ind + f'// whole frame incl. the 2 CRC bytes ({TOOL})', ind + NEW]
    else:
        lines[e + 1:e + 2] = [ind + f'// whole frame incl. the 2 CRC bytes ({TOOL})', ind + NEW]
    if any(code_of(x) == OLD for x in lines):
        raise SystemExit(f'{OLD} left')
    return has_pagetype


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    changes = {}
    report = []
    for section, data in hmi.files.items():
        if not section.endswith('.pa'):
            continue
        page = Page(data)
        name = page.objs[0].name
        serial = [o for o in page.objs if o.name == 'tmSerial']
        if not serial:
            report.append(f'{section} ({name}): no tmSerial, unchanged')
            continue
        if len(serial) != 1:
            raise SystemExit(f'{name}: {len(serial)} objects tmSerial')
        try:
            lines = serial[0].code('timer')
        except KeyError:
            raise SystemExit(f'{name}: tmSerial without timer code')
        # udelete only in tmSerial.timer
        for o in page.objs:
            for kind, event, code in o.items:
                if kind == 'code' and (o.name, event) != ('tmSerial', 'timer'):
                    if any(code_of(x).startswith('udelete') for x in code):
                        raise SystemExit(f'{name}: {o.name}.{event}: udelete outside tmSerial')
        before = len(lines)
        try:
            has_pagetype = change(lines)
        except SystemExit as e:
            raise SystemExit(f'{section} ({name}): {e}')
        changes[section] = page.bytes()
        Page(changes[section])  # round trip
        note = '' if has_pagetype else ' (no pageType branch: one delete only)'
        report.append(f'{section} ({name}): tmSerial {before} -> {len(lines)} lines{note}')

    out = hmi.build(changes)
    result = Hmi(out)
    result.check()
    if set(result.files) != set(hmi.files):
        raise SystemExit('section list changed')
    for name, data in result.files.items():
        if name not in changes and data != hmi.files[name]:
            raise SystemExit(f'{name} changed unexpectedly')
    for section in changes:
        old, new = Page(hmi.files[section]), Page(result.files[section])
        if old.head[8:] != new.head[8:] or len(old.objs) != len(new.objs):
            raise SystemExit(f'{section}: page head or object count changed')
        for o, n in zip(old.objs, new.objs):
            if [(k, e) for k, e, _ in o.items] != [(k, e) for k, e, _ in n.items]:
                raise SystemExit(f'{section}: {o.name} items changed')
            for (k, e, v1), (_, _, v2) in zip(o.items, n.items):
                if v1 != v2 and (o.name, k, e) != ('tmSerial', 'code', 'timer'):
                    raise SystemExit(f'{section}: {o.name}.{e} changed unexpectedly')
        # the result itself is rejected by a second run
        try:
            change(new.obj('tmSerial').code('timer'))
        except SystemExit:
            pass
        else:
            raise SystemExit(f'{section}: a second run would change it again')
    open(target, 'wb').write(out)
    print('\n'.join(report))
    print(f'{len(changes)} pages changed')
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    main(sys.argv[1], sys.argv[2])
