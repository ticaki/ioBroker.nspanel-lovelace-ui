"""HMI 6.1.1: popups opened from screensaver2/screensaver5 get their full name, popupLight2 too.

Usage (from the repository root):
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_name_global.py HMI/nspanel-v6.1.0.HMI HMI/nspanel-v6.1.1.HMI
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_name_global.py HMI/us-l/nspanel-us-l-v6.1.0.HMI \
      HMI/us-l/nspanel-us-l-v6.1.1.HMI
  PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/popup_name_global.py HMI/us-p/nspanel-us-p-v6.1.0.HMI \
      HMI/us-p/nspanel-us-p-v6.1.1.HMI
Input: a 6.1.0 project (EU, us-l or us-p), the output must not exist.

Finding: on screensaver2 and screensaver5 the adapter opens popups with pageType~<popup>~<name>~<id>~<icon>. The
pageType branch of tmSerial 'timer' stored field 2 (the name) in the local tTmp and copied it with
'pageIcons.tTmp1.txt=tTmp.txt' right before 'page popup..'; the popups read their heading from pageIcons.tTmp1 in
'load'. (1) popupLight2 had no copy, so its heading showed whatever was left in pageIcons.tTmp1 (e.g. the EU hint
'change model conf to us-l/p' written by m0 'down'). (2) tTmp has txt_maxl 11 on these pages, so every name was cut
to 11 characters.

Fix: only in the pageType branch, field 2 goes straight into the global pageIcons.tTmp1 (txt_maxl 80) and the 8
copies 'pageIcons.tTmp1.txt=tTmp.txt' are removed. tTmp itself (and its txt_maxl) stays as it is. Before patching,
the script checks that tTmp is not used anywhere else in the pageType branch, i.e. field 2 in tTmp only fed these
copies. Every other page, object and line stays untouched.

Version: pageStartup tRelease 6.1.0 -> 6.1.1 (event,startup,<tVersion>,<model>,<tRelease>).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from pagefile import Page, block  # noqa: E402

OLD_RELEASE, NEW_RELEASE = '6.1.0', '6.1.1'
PAGES = ('screensaver2', 'screensaver5')
BRANCH = 'if(tInstruction.txt=="pageType")'
OLD_SPSTR = 'spstr strCommand.txt,tTmp.txt,"~",2'
NEW_SPSTR = 'spstr strCommand.txt,pageIcons.tTmp1.txt,"~",2'
OLD_COMMENT = '//save second arg if there\'s one'
NEW_COMMENT = '//save second arg (popup name) if there\'s one - global, the popups read it in load'
COPY = 'pageIcons.tTmp1.txt=tTmp.txt'
POPUPS = ('popupInSel', 'popupFan', 'popupShutter', 'popupShutter2', 'popupLight', 'popupTimer', 'popupSlider',
          'popupColor')
# tTmp of the page, not pageIcons.tTmp1/2/3
LOCAL_TTMP = re.compile(r'(?<![.\w])tTmp\b')


def indent(line):
    return line[:len(line) - len(line.lstrip())]


def patch_page(page):
    name = page.objs[0].name
    tm = page.obj('tmSerial')
    lines = tm.code('timer')
    starts = [i for i, line in enumerate(lines) if line.strip() == BRANCH]
    if len(starts) != 1:
        raise SystemExit(f'{name}: tmSerial timer: pageType branch found {len(starts)} times')
    start, end = block(lines, starts[0])
    body = lines[start:end]
    spstr = [i for i, line in enumerate(body) if line.strip() == OLD_SPSTR]
    if len(spstr) != 1:
        raise SystemExit(f'{name}: pageType branch: {OLD_SPSTR!r} found {len(spstr)} times')
    s = spstr[0]
    copies = [i for i, line in enumerate(body) if line.strip() == COPY]
    if len(copies) != len(POPUPS):
        raise SystemExit(f'{name}: pageType branch: {len(copies)} copies {COPY!r}, expected {len(POPUPS)}')
    targets = []
    for i in copies:
        if i < s:
            raise SystemExit(f'{name}: pageType branch: copy before the spstr (line {start + i})')
        nxt = body[i + 1].strip() if i + 1 < len(body) else ''
        if not nxt.startswith('page '):
            raise SystemExit(f'{name}: pageType branch: copy not followed by a page command: {nxt!r}')
        targets.append(nxt[5:])
    if sorted(targets) != sorted(POPUPS):
        raise SystemExit(f'{name}: pageType branch: copies go to {targets}, expected {list(POPUPS)}')
    # field 2 in tTmp must feed only these copies: no other use of tTmp anywhere in the branch
    others = [(start + i, line.strip()) for i, line in enumerate(body)
              if i != s and i not in copies and LOCAL_TTMP.search(line)]
    if others:
        raise SystemExit(f'{name}: pageType branch uses tTmp elsewhere: {others}')
    new = []
    for i, line in enumerate(body):
        if i in copies:
            continue
        if i == s:
            new.append(indent(line) + NEW_SPSTR)
        elif i == s - 1 and line.strip() == OLD_COMMENT:
            new.append(indent(line) + NEW_COMMENT)
        else:
            new.append(line)
    tm.set_code('timer', lines[:start] + new + lines[end:])
    return f'branch lines {start}..{end - 1}, spstr line {start + s}, {len(copies)} copies removed'


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
    sections = {}
    for section, data in hmi.files.items():
        if section.endswith('.pa'):
            page = Page(data)
            sections[page.objs[0].name] = (section, page)
    changes = {}
    for name in PAGES:
        section, page = sections[name]
        info = patch_page(page)
        out = page.bytes()
        Page(out)  # round trip of the result
        changes[section] = out
        print(f'{section:6} {name:13} {info}')
    section, page = sections['pageStartup']
    patch_release(page)
    out = page.bytes()
    Page(out)
    changes[section] = out
    print(f'{section:6} {"pageStartup":13} tRelease {OLD_RELEASE} -> {NEW_RELEASE}')
    out = hmi.build(changes)
    Hmi(out).check()
    open(target, 'wb').write(out)
    print(f'{target}: {len(hmi.d)} -> {len(out)} bytes, {len(changes)} pages changed')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
