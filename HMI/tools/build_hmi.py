"""Builds a HMI with the icons of script/icons.json in the icon fonts 1, 3 and 4.

  python3 HMI/tools/build_hmi.py <base.HMI> <out.HMI> <icons of the base.json> <icons.json> [<old>:<new>]

<icons of the base.json> is script/icons.json of the version the base HMI was built with
(e.g. `git show <commit>:script/icons.json`): glyphs whose drawing did not change keep the bytes of
the base font, new and changed glyphs are rendered (Chrome canvas via puppeteer, render.mjs) with
the parameters of params.json - they were fitted against the glyphs of the Nextion Editor.
<old>:<new> replaces the release text of pageStartup.tRelease (same length only, e.g. 5.1.1:6.0.0).

Set PUPPETEER_PATH to a directory with node_modules/puppeteer (ending with /) if it is not
resolvable from here, e.g. PUPPETEER_PATH=$(npm root -g)/
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from hmi import Hmi  # noqa: E402
from zilib import Zi, encode  # noqa: E402


def render(width, height, params, paths):
    with tempfile.TemporaryDirectory() as tmp:
        job = os.path.join(tmp, 'job.json')
        out = os.path.join(tmp, 'out.bin')
        with open(job, 'w') as f:
            json.dump({'W': width, 'H': height, 'variants': [params], 'paths': paths}, f)
        subprocess.run(['node', os.path.join(HERE, 'render.mjs'), job, out], check=True)
        raw = open(out, 'rb').read()
    n = width * height
    return [[round(a * 7 / 255) for a in raw[k * n:(k + 1) * n]] for k in range(len(paths))]


def main():
    base, target, old_icons, new_icons = sys.argv[1:5]
    release = sys.argv[5] if len(sys.argv) > 5 else None
    old = {i['hex']: i['data'] for i in json.load(open(old_icons))}
    glyphs = {}
    # one drawing per glyph - all names of a glyph have the same drawing in icons.json
    for i in sorted(json.load(open(new_icons)), key=lambda i: i['name']):
        glyphs.setdefault(int(i['hex'], 16), i['data'])
    params = json.load(open(os.path.join(HERE, 'params.json')))

    project = Hmi(open(base, 'rb').read())
    files = {}
    for name, p in params.items():
        font = Zi(project.files[name])
        width = font.chars[0xE000][0]
        todo = [g for g, d in glyphs.items() if g not in font.chars or old.get(f'{g:04X}') != d]
        chars = dict(font.chars)
        for g, px in zip(todo, render(width, font.h, p, [glyphs[g] for g in todo])):
            chars[g] = (width, 0, 0, encode(px))
        files[name] = font.build(chars)
        print(f'{name} ({p["comment"]}): {font.cnt} -> {len(chars)} characters, {len(todo)} rendered')

    if release:
        # pageStartup.tRelease: attribute record "txt" with the release
        old_release, release = release.split(':')
        key = b'\x15\x00\x00\x00txt' + b'\0' * 13 + old_release.encode()
        hits = [(idx, data.find(key) + len(key) - len(old_release), old_release.encode())
                for idx, data in project.files.items() if key in data]
        if len(hits) != 1 or project.files[hits[0][0]].count(key) != 1 or len(old_release) != len(release):
            raise SystemExit(f'release text {old_release} not found once: {hits}')
        idx, pos, value = hits[0]
        data = bytearray(files.get(idx, project.files[idx]))
        data[pos:pos + len(release)] = release.encode()
        files[idx] = bytes(data)
        print(f'release {value.decode()} -> {release}')

    out = project.build(files)
    check = Hmi(out)  # parses again, checks the directory checksums
    check.check()  # page and main.HMI checksums
    open(target, 'wb').write(out)
    print(f'{target}: {len(project.d)} -> {len(out)} bytes')


if __name__ == '__main__':
    main()
