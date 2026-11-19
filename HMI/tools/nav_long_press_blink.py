"""HMI 6.2.0 (stays 6.2.0): heading and navigation arrows of the card pages blink yellow/green while the long press of
an arrow is armed - the release then sends home/parent instead of next/prev.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/nav_long_press_blink.py HMI/nspanel-v6.2.0.HMI <out.HMI> [<ref.tft>]
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/nav_long_press_blink.py HMI/us-l/nspanel-us-l-v6.2.0.HMI <out.HMI> [<ref.tft>]
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/nav_long_press_blink.py HMI/us-p/nspanel-us-p-v6.2.0.HMI <out.HMI> [<ref.tft>]
Input: a 6.2.0 project (EU, us-l or us-p), the output must not exist. <ref.tft>: optional, a TFT compiled from a
project whose card pages are identical to the input - its page RAM table gives the exact RAM before the change.

Finding: every card page with the timer tmLPNav (cardEntities, cardGrid, cardGrid2, cardGrid3, cardMedia, cardThermo,
cardThermo2, cardPower, cardChart, cardLChart, cardPChart, cardQR, cardAlarm, cardSchedule) tells a short from a long
press of the arrows bPrev/bNext itself: 'down' sets vLPNavState=0 and starts tmLPNav (500 ms), the timer sets
vLPNavState=1, 'up' sends event,buttonPress2 (short: next/prev) or event,buttonPress3 (long: home/parent). The user
cannot see when the long press is reached - the screensaver indicators have the blinking clock for that.

Fix, per page (the sending in 'up' stays as it is, also its time):
  tmLPNav 'timer'  first run (vLPNavState==0, after 500 ms): vLPNavState = tHeading.pco + 65536 (armed and blinking,
                   the colour of the heading in the low 16 bits), vaNavCol = bPrev.pco << 16 + bNext.pco, heading and
                   both arrows (pco and pco2, the colour of a pressed button) yellow (65504), tmLPNav.tim=200. Every
                   further run while vLPNavState >= 65536 toggles yellow <-> green (2016), 200 ms per phase.
  restore          if(vLPNavState.val>=65536): heading and arrows get their colours back (pco2 the design value of
                   the arrow, no code writes it), vLPNavState=1 (still 'long' for the send of 'up'),
                   tmLPNav.tim=500. At the end of bPrev/bNext 'up' (behind the send), at the end of tc0 'up' together
                   with tmLPNav.en=0 (tc0 gets every release: also one outside of the arrow and the swipe strips
                   mSwipeNext/mSwipePrev/mSwipeUp, whose 'down' only does 'click bNext/bPrev,1' - without it the
                   blinking would not stop) and in front of bPrev/bNext 'down' (cardThermo2: the button repeater
                   repeat_tm clicks a held button of type 98 again, also the arrows).
  tmSerial         the colours of the arrows in entityUpd (bPrev.pco=sys0 / bNext.pco=sys0) go into the half of
                   vaNavCol while the arrows blink: they are shown on release.
  tmLPNav en       us-p cardThermo had en=1 in the design: the timer ran from the page load on and would start the
                   blinking without a touch (and could turn a short press into a long one) - set to 0 like on all
                   other pages, only 'down' of an arrow starts it.
Other writers: the 'load' loop over b[] sets pco of buttons and texts to defaultFontColor (tmLPNav is off then, the
variables start at 0); nothing else on these pages writes tHeading.pco, bPrev.pco/pco2 or bNext.pco/pco2 (checked).
Nextion evaluates strictly from left to right (no precedence), the expressions are written for that.

New object per page: vaNavCol, copy of vLPNavState (local number variable, value 0, no code), appended as the last
object (code addresses objects by id only in the load loop over the first objects and via tc0.val of touch objects).
RAM: one number variable - the script prints the RAM before and after (exact before with <ref.tft>, the new
variable is counted with RAM_VAR bytes) and stops above RAM_LIMIT (global + page). pageStartup.tRelease stays 6.2.0.
"""
import os
import re
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, find  # noqa: E402

TIMER, STATE, COL = 'tmLPNav', 'vLPNavState', 'vaNavCol'
HEAD, PREV, NEXT = 'tHeading', 'bPrev', 'bNext'
ARROWS = (PREV, NEXT)
YELLOW, GREEN = 65504, 2016
LP_TIME, BLINK_TIME = 500, 200
ARMED = 65536
VAR_TYPE, TIMER_TYPE, TOUCHCAP_TYPE = 52, 51, 5
# a number variable in the page RAM table of compiled TFTs: about 4-5 bytes, rounded up to the 4 byte step
RAM_VAR = 8
RAM_LIMIT = 3584

OLD_TIMER = [f'{STATE}.val=1']
OLD_DOWN = [f'{STATE}.val=0', f'{TIMER}.en=1']
# the long press decision of 'up' (the send block behind it is checked line by line in check_up)
SEND_TAIL = ['//send calc crc', 'btlen tSend.txt,sys0', 'crcrest 1,0xffff // reset CRC', 'crcputh 55 bb',
             'crcputs sys0,2', 'crcputs tSend.txt,0', '//send cmd', 'printh 55 bb', 'prints sys0,2',
             'prints tSend.txt,0', 'prints crcval,2']

# writes of colours of heading/arrows: assignment or target of covx; b[...] writes of a colour
WRITE = re.compile(r'^\s*(?:covx\s+[^,]+,\s*)?(?:tHeading|bPrev|bNext)\.pco2?\s*(?:=(?!=)|,)')
B_WRITE = re.compile(r'^\s*(?:covx\s+[^,]+,\s*)?b\[[^\]]*\]\.(?:pco2?)\s*(?:=(?!=)|,)')
STATE_USE = re.compile(r'\b(?:vLPNavState|tmLPNav)\b')


def timer_lines():
    """tmLPNav: arms the long press, heading and arrows blink until the release"""
    return [
        f'if({STATE}.val==0)',
        '{',
        f'  // {LP_TIME} ms are over: the release sends the long press (home/parent), heading and arrows blink',
        f'  // yellow/green until then; {STATE} keeps the colour of the heading + {ARMED}, {COL} the arrows',
        f'  {STATE}.val={HEAD}.pco+{ARMED}',
        f'  {COL}.val={PREV}.pco<<16+{NEXT}.pco',
        f'  {HEAD}.pco={YELLOW}',
        f'  {TIMER}.tim={BLINK_TIME}',
        f'}}else if({STATE}.val>={ARMED})',
        '{',
        f'  if({HEAD}.pco=={YELLOW})',
        '  {',
        f'    {HEAD}.pco={GREEN}',
        '  }else',
        '  {',
        f'    {HEAD}.pco={YELLOW}',
        '  }',
        '}',
        f'if({STATE}.val>={ARMED})',
        '{',
        f'  {PREV}.pco={HEAD}.pco',
        f'  {PREV}.pco2={HEAD}.pco',
        f'  {NEXT}.pco={HEAD}.pco',
        f'  {NEXT}.pco2={HEAD}.pco',
        '}',
    ]


def restore_lines(pco2):
    """heading and arrows get their colours back; the long press stays armed for the send ({STATE} 1)"""
    return [
        f'if({STATE}.val>={ARMED})',
        '{',
        '  // the long press was armed: heading and arrows get their colours back (nav_long_press_blink.py)',
        f'  {HEAD}.pco={STATE}.val-{ARMED}',
        f'  {PREV}.pco={COL}.val>>16&65535',
        f'  {PREV}.pco2={pco2[PREV]}',
        f'  {NEXT}.pco={COL}.val&65535',
        f'  {NEXT}.pco2={pco2[NEXT]}',
        f'  {STATE}.val=1',
        f'  {TIMER}.tim={LP_TIME}',
        '}',
    ]


def serial_lines(arrow, ind):
    """entityUpd: the colour of an arrow into its half of vaNavCol while the arrows blink"""
    if arrow == PREV:
        keep = [f'{COL}.val={COL}.val&65535', f'{COL}.val=sys0<<16+{COL}.val']
    else:
        keep = [f'{COL}.val={COL}.val>>16<<16+sys0']
    return [ind + x for x in [
        f'if({STATE}.val>={ARMED})',
        '{',
        '  // heading and arrows blink (long press armed): the colour is shown on release',
        *['  ' + k for k in keep],
        '}else',
        '{',
        f'  {arrow}.pco=sys0',
        '}',
    ]]


def check_up(name, arrow, up):
    nent = 'nent1' if arrow == PREV else 'nent2'
    expected = [
        f'{TIMER}.en=0',
        f'if({STATE}.val==0)',
        '{',
        f'  tSend.txt="event,buttonPress2,"+{nent}.txt+",button"',
        '}else',
        '{',
        f'  tSend.txt="event,buttonPress3,"+{nent}.txt+",button"',
        '}',
        *SEND_TAIL,
    ]
    if [x.strip() for x in up] != [x.strip() for x in expected]:
        raise SystemExit(f'{name}.{arrow}: up is not the known long press code')


def color_writers(page):
    """[(object, event, line)] of every line that writes a colour of heading/arrows or a b[] colour"""
    out = []
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind != 'code':
                continue
            for line in lines:
                code = line.split('//')[0]
                if WRITE.match(code) or B_WRITE.match(code):
                    out.append((o.name, event, line.strip()))
    return out


def state_users(page):
    """{(object, event)} of every code that names vLPNavState/tmLPNav"""
    out = set()
    for o in page.objs:
        for kind, event, lines in o.items:
            if kind == 'code' and any(STATE_USE.search(line.split('//')[0]) for line in lines):
                out.add((o.name, event))
    return out


def patch_page(page):
    name = page.objs[0].name
    names = [o.name for o in page.objs]
    if COL in names:
        raise SystemExit(f'{name}: {COL} exists')
    for obj, kind in ((HEAD, 116), (PREV, 98), (NEXT, 98), (TIMER, TIMER_TYPE), (STATE, VAR_TYPE),
                      ('tc0', TOUCHCAP_TYPE), ('tmSerial', TIMER_TYPE)):
        if obj not in names or page.obj(obj).get('type') != kind:
            raise SystemExit(f'{name}: no {obj} of type {kind}')
    timer, state = page.obj(TIMER), page.obj(STATE)
    if timer.code('timer') != OLD_TIMER or timer.get('tim') != LP_TIME or timer.get('en') not in (0, 1):
        raise SystemExit(f'{name}.{TIMER}: not the known timer')
    notes = []
    if timer.get('en') == 1:
        # us-p cardThermo: the timer ran from the page load on - it would start the blinking without a touch
        # (and could turn a short press into a long one); only 'down' of an arrow starts it
        timer.set('en', 0)
        notes.append(f'{TIMER}.en 1 -> 0')
    if state.get('sta') != 0 or state.get('vscope') != 0 or any(k == 'code' and v for k, _, v in state.items):
        raise SystemExit(f'{name}.{STATE}: not a local number variable without code')

    # who writes the colours: the load loop over b[] and the two arrow colours of entityUpd, nothing else
    writers = color_writers(page)
    for obj, event, line in writers:
        if obj == name and event == 'load' and line == 'b[sys0].pco=defaultFontColor':
            continue
        if obj == 'tmSerial' and event == 'timer' and line in (f'{PREV}.pco=sys0', f'{NEXT}.pco=sys0'):
            continue
        raise SystemExit(f'{name}: unexpected colour write {obj}.{event}: {line}')
    # who uses the state/timer: the arrows, the timer and a copy of the 'up' code in the page 'loadend'
    users = state_users(page) - {(PREV, 'down'), (PREV, 'up'), (NEXT, 'down'), (NEXT, 'up'), (TIMER, 'timer')}
    for obj, event in users:
        if obj == name and event == 'loadend':
            # postinitialize (cardEntities, cardThermo2: a copy of bPrev or bNext 'up'): the variables are 0 and
            # tmLPNav is off there - nothing blinks yet, the code stays
            loadend = page.objs[0].code('loadend')
            try:
                check_up(name, NEXT, loadend)
            except SystemExit:
                check_up(name, PREV, loadend)
            continue
        raise SystemExit(f'{name}: {obj}.{event} uses {STATE}/{TIMER}')

    pco2 = {}
    for arrow in ARROWS:
        o = page.obj(arrow)
        if o.code('down') != OLD_DOWN:
            raise SystemExit(f'{name}.{arrow}: down is not the known code')
        check_up(name, arrow, o.code('up'))
        pco2[arrow] = o.get('pco2')

    serial = page.obj('tmSerial')
    lines = serial.code('timer')
    for arrow in ARROWS:
        hits = [i for i, x in enumerate(lines) if x.strip() == f'{arrow}.pco=sys0']
        if len(hits) != 1:
            raise SystemExit(f'{name}.tmSerial: {arrow}.pco=sys0 found {len(hits)} times')
        i = hits[0]
        if lines[i - 1].strip() != 'covx tTmp.txt,sys0,0,0' or lines[i + 1].strip() != f'vis {arrow},1':
            raise SystemExit(f'{name}.tmSerial: {arrow}.pco=sys0 not in the entityUpd navigation block')
        find(lines, 'if(tInstruction.txt=="entityUpd")')
        ind = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
        lines[i:i + 1] = serial_lines(arrow, ind)
    serial.set_code('timer', lines)

    restore = restore_lines(pco2)
    for arrow in ARROWS:
        o = page.obj(arrow)
        o.set_code('down', restore + OLD_DOWN)
        o.set_code('up', o.code('up') + restore)
    tc0 = page.obj('tc0')
    tc0.set_code('up', tc0.code('up') + ['// release anywhere (also of a swipe strip): the arrows end the long press',
                                         f'{TIMER}.en=0'] + restore)
    timer.set_code('timer', timer_lines())

    var = state.copy()
    var.set('objname', COL)
    var.set('val', 0)
    page.objs.append(var)
    return notes


def tft_ram(hmi, path):
    """{page name: RAM} and the global RAM from the page table of a compiled TFT (16 byte entries, first u32 = page
    RAM, in the page order of main.HMI, then 16 x 0xFF and the global RAM)"""
    order = [x.decode() for x in re.findall(rb'(\d+\.pa)\x00', hmi.files['main.HMI'])]
    if sorted(order) != sorted(s for s in hmi.files if s.endswith('.pa')):
        raise SystemExit('main.HMI: page order not found')
    names = [Page(hmi.files[s]).objs[0].name for s in order]
    data = open(path, 'rb').read()
    found = []
    i = data.find(b'\xff' * 16)
    while i >= 0:
        glob = struct.unpack_from('<I', data, i + 16)[0]
        if 100 < glob < 1000 and i >= 16 * len(names):
            values = [struct.unpack_from('<I', data, i - 16 * (len(names) - k))[0] for k in range(len(names))]
            if all(0 < v < RAM_LIMIT for v in values):
                found.append((dict(zip(names, values)), glob))
        i = data.find(b'\xff' * 16, i + 1)
    if len(found) != 1:
        raise SystemExit(f'{path}: page RAM table found {len(found)} times')
    return found[0]


def main(source, target, tft=None):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    table, glob = tft_ram(hmi, tft) if tft else (None, None)
    changes = {}
    for section, data in hmi.files.items():
        if not section.endswith('.pa'):
            continue
        page = Page(data)
        name = page.objs[0].name
        if TIMER not in [o.name for o in page.objs]:
            continue
        before = len(page.objs)
        notes = patch_page(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        added = (len(page.objs) - before) * RAM_VAR
        if table is None:
            print(f'{section:6} {name:13} RAM +{added} (one number variable, no reference TFT given) {" ".join(notes)}')
            continue
        old = glob + table[name]
        print(f'{section:6} {name:13} RAM (global + page) {old} -> {old + added} of {RAM_LIMIT} {" ".join(notes)}')
        if old + added > RAM_LIMIT:
            raise SystemExit(f'{name}: RAM {old + added} > {RAM_LIMIT}')
    if not changes:
        raise SystemExit(f'no page with {TIMER}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4):
        raise SystemExit(__doc__)
    main(*sys.argv[1:])
