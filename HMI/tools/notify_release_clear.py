"""HMI 6.1.0 (stays 6.1.0): a tap on the notification of a screensaver clears it on release, not on press.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_release_clear.py HMI/nspanel-v6.1.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_release_clear.py HMI/us-l/nspanel-us-l-v6.1.0.HMI <out.HMI>
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/notify_release_clear.py HMI/us-p/nspanel-us-p-v6.1.0.HMI <out.HMI>
Input: a 6.1.0 project (EU, us-l or us-p), the output must not exist.

Finding: on screensaver, screensaver2, screensaver3 and screensaver5 the 'down' of the TouchCap tc0 emptied
tNotifyHead/tNotifyText and hid both with 'vis ..,0' (when the display was dimmed it only woke up). A tap right on the
notification text hides the touched object while the finger is still on it, and the Nextion then sends no release to
the TouchCap: the bExit that tc0 'up' sends never arrives (nothing on the serial line). vaTap was already counted up
in 'down', so the next tap arrives as bExit,2.

Fix: tc0 'down' only remembers the clear in the new local number variable vaClear (set before dim=dimValueNormal,
dim still holds the old value), the end of tc0 'up' (behind the send block) does the clear and resets vaClear.
Everything else stays: the wake instruction (click tc0,1), the tap count, swipe detection, long press.

vaClear is a copy of vaTap of the same page (variable, type 52, sta 0 = number, local), renamed, value 0, no code. It
is appended as the last object: the object ids are the positions in the object table and the code of these pages does
not address objects by id (b[..]), but the existing ids stay as they are anyway. RAM: one number variable (~4-8 bytes)
per page. pageStartup.tRelease stays 6.1.0.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page  # noqa: E402

PAGES = ('screensaver', 'screensaver2', 'screensaver3', 'screensaver5')
VAR = 'vaClear'
TEMPLATE = 'vaTap'
VAR_TYPE = 52

CLEAR = [
    'tNotifyHead.txt=""',
    'tNotifyText.txt=""',
    'vis tNotifyHead,0',
    'vis tNotifyText,0',
]
OLD_DOWN = [
    'if(tNotifyHead.txt!=""||tNotifyText.txt!="")',
    '{',
    '  if(dim!=0)',
    '  {',
    *['    ' + line for line in CLEAR],
    '  }',
    '}',
    'dim=dimValueNormal',
]
NEW_DOWN = [
    f'{VAR}.val=0',
    'if(tNotifyHead.txt!=""||tNotifyText.txt!="")',
    '{',
    '  if(dim!=0)',
    '  {',
    f'    {VAR}.val=1',
    '  }',
    '}',
    'dim=dimValueNormal',
]
UP_CLEAR = [
    f'if({VAR}.val==1)',
    '{',
    f'  {VAR}.val=0',
    *['  ' + line for line in CLEAR],
    '}',
]
# tc0 'up' ends with the send block - inside if(tSend.txt!="") (screensaver2/5) or without it (screensaver/3)
UP_END = 'prints crcval,2'


def var_obj(template):
    """vaClear as a copy of vaTap: number variable, local, value 0, no code"""
    if template.get('type') != VAR_TYPE or template.get('sta') != 0 or template.get('vscope') != 0:
        raise SystemExit(f'{TEMPLATE} is not a local number variable')
    if any(kind == 'code' for kind, _, _ in template.items):
        raise SystemExit(f'{TEMPLATE} has code')
    o = template.copy()
    o.set('objname', VAR)
    o.set('val', 0)
    return o


def patch_page(page):
    """returns 'up ends with if(tSend..)' or 'up ends with the send block' for the report"""
    name = page.objs[0].name
    if VAR in {o.name for o in page.objs}:
        raise SystemExit(f'{name}: {VAR} exists')
    tc0 = page.obj('tc0')
    down = tc0.code('down')
    hits = [i for i in range(len(down)) if down[i:i + len(OLD_DOWN)] == OLD_DOWN]
    if len(hits) != 1:
        raise SystemExit(f'{name}: tc0 down: clear block found {len(hits)} times')
    i = hits[0]
    down = down[:i] + NEW_DOWN + down[i + len(OLD_DOWN):]
    up = tc0.code('up')
    if any(VAR in line or 'tNotify' in line for line in up):
        raise SystemExit(f'{name}: tc0 up already touches {VAR}/tNotify*')
    if up[-2:] == ['  ' + UP_END, '}']:
        kind = 'behind if(tSend.txt!="")'
    elif up[-1] == UP_END:
        kind = 'behind the unconditional send block'
    else:
        raise SystemExit(f'{name}: tc0 up does not end with the send block')
    tc0.set_code('down', down)
    tc0.set_code('up', up + UP_CLEAR)
    page.objs.append(var_obj(page.obj(TEMPLATE)))
    return kind


def main(source, target):
    if os.path.exists(target):
        raise SystemExit(f'{target} exists')
    hmi = Hmi(open(source, 'rb').read())
    hmi.check()
    sections = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            sections[page.objs[0].name] = (section, page)
    changes = {}
    for name in PAGES:
        section, page = sections[name]
        before = len(page.objs)
        kind = patch_page(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        print(f'{section:6} {name:13} {VAR} id {before}, up clear {kind}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
