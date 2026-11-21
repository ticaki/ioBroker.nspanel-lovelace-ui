"""Width tables (horizontal advance per character) of the fonts 0..5 of the HMIs of all panel models, for the adapter.

Usage: PYTHONDONTWRITEBYTECODE=1 python3 HMI/tools/font_widths.py <out.ts|out.json> <model>=<in.HMI> ...

  e.g. python3 HMI/tools/font_widths.py src/lib/const/font-widths.ts eu=HMI/nspanel-v6.1.1.HMI \\
           us-l=HMI/us-l/nspanel-us-l-v6.1.1.HMI us-p=HMI/us-p/nspanel-us-p-v6.1.1.HMI

The font id is the position among the 'zi' entries of main.HMI (not the section name). The advance of a character
is left + width + right of its zi table entry (see zilib.py); the Nextion has no kerning and no ligatures. All
glyphs are taken, icons included (icon fonts 1/3/4: U+E000..U+FDFF). A table is stored once and referenced by every
model with the same advances (identical fonts share one table).

Encoding of a table ('data', the strings joined with ' ' give the segments, numbers in base 36):
  segment  = <gap>:<item>,<item>,...   gap = first code point of the segment - (last code point before + 1),
                                       the first segment counts from 0
  item     = <advance> | <advance>*<count>   advance of the next code point / of the next count code points
"""
import hashlib
import json
import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hmi import Hmi  # noqa: E402
from zilib import Zi  # noqa: E402

FONT_IDS = (0, 1, 2, 3, 4, 5)
MODELS = ('eu', 'us-l', 'us-p')
LINE = 112
DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'


def b36(n):
    s = ''
    while True:
        n, r = divmod(n, 36)
        s = DIGITS[r] + s
        if not n:
            return s


def font_sections(hmi):
    """the .zi section names in font id order (order of the 'zi' entries of main.HMI)"""
    main = hmi.files['main.HMI']
    head = struct.unpack_from('<I', main, 4)[0]
    count = struct.unpack_from('<I', main, 28)[0]
    names = []
    for i in range(count):
        entry = main[head + 16 * i:head + 16 * i + 16]
        if entry[:8].split(b'\0')[0] == b'zi':
            names.append(entry[8:].split(b'\0')[0].decode())
    return names


def encode(adv):
    """{code point: advance} -> list of segments"""
    segments = []
    prev_end = 0
    cps = sorted(adv)
    i = 0
    while i < len(cps):
        start = cps[i]
        j = i
        while j + 1 < len(cps) and cps[j + 1] == cps[j] + 1:
            j += 1
        items = []
        k = i
        while k <= j:
            m = k
            while m + 1 <= j and adv[cps[m + 1]] == adv[cps[k]]:
                m += 1
            n = m - k + 1
            items.append(b36(adv[cps[k]]) + (f'*{b36(n)}' if n > 1 else ''))
            k = m + 1
        segments.append(f'{b36(start - prev_end)}:{",".join(items)}')
        prev_end = cps[j] + 1
        i = j + 1
    return segments


def decode(segments):
    """inverse of encode, used to check the output"""
    adv = {}
    cp = 0
    for seg in segments:
        gap, items = seg.split(':')
        cp += int(gap, 36)
        for item in items.split(','):
            a, _, n = item.partition('*')
            for _ in range(int(n, 36) if n else 1):
                adv[cp] = int(a, 36)
                cp += 1
    return adv


def icon_check(zi, adv):
    """the icons of a font (glyph at U+E000 = icon font) must have one advance - only reported, the table is exact"""
    if 0xE000 not in zi.chars:
        return ''
    icons = {a for cp, a in adv.items() if 0xE000 <= cp <= 0xFDFF}
    if len(icons) != 1:
        sys.exit(f'icon advances not uniform: {sorted(icons)}')
    return f', icons {sum(1 for cp in adv if 0xE000 <= cp <= 0xFDFF)} x {icons.pop()} px'


def read(models):
    tables = []
    by_key = {}
    refs = {}
    for model, path in models:
        hmi = Hmi(open(path, 'rb').read())
        sections = font_sections(hmi)
        refs[model] = []
        for fid in FONT_IDS:
            zi = Zi(hmi.files[sections[fid]])
            adv = {cp: w + left + right for cp, (w, left, right, _) in zi.chars.items()}
            segments = encode(adv)
            if decode(segments) != adv:
                sys.exit('encoding check failed')
            key = hashlib.md5(f'{zi.h}|{" ".join(segments)}'.encode()).hexdigest()
            if key not in by_key:
                name = zi.d[0x2C:0x2C + zi.d[0x11]].decode('latin1').removesuffix('utf-8')
                by_key[key] = len(tables)
                tables.append({'name': name, 'height': zi.h, 'missing': 0, 'count': len(adv), 'data': segments,
                               'used': []})
                print(f'table {len(tables) - 1}: {model} font {fid} {sections[fid]} {name} h={zi.h} '
                      f'{len(adv)} characters{icon_check(zi, adv)}')
            tables[by_key[key]]['used'].append(f'{model}:{fid}')
            refs[model].append(by_key[key])
    return tables, refs


def ts_data(segments, indent):
    lines = []
    line = ''
    for seg in segments:
        if line and len(indent) + len(line) + len(seg) + 4 > LINE:
            lines.append(f"{indent}'{line}',")
            line = ''
        line = f'{line} {seg}' if line else seg
    if line:
        lines.append(f"{indent}'{line}',")
    return lines


def write_ts(tables, refs, sources, out):
    lines = [
        f'// generated by HMI/tools/font_widths.py from {", ".join(sources)}, do not edit',
        '/* eslint-disable */',
        '',
        '/**',
        ' * Advances (left + width + right in px) of all glyphs of a Nextion font, icons included.',
        ' * data: the strings joined with " " are segments "<gap>:<item>,<item>,..." (numbers base 36),',
        ' * gap = first code point - (last code point before + 1), item = "<advance>" or "<advance>*<count>".',
        ' */',
        'export interface FontWidthTable {',
        '    /** font name (information only) */',
        '    readonly name: string;',
        '    /** height in px */',
        '    readonly height: number;',
        '    /** advance of a character the font does not have (the Nextion does not draw it) */',
        '    readonly missing: number;',
        '    /** number of characters (check value of the decoder) */',
        '    readonly count: number;',
        '    readonly data: readonly string[];',
        '}',
        '',
        'export type FontWidthModel = ' + ' | '.join(f"'{m}'" for m in refs) + ';',
        '',
        '/** per model: index into FONT_WIDTH_TABLES for the font ids 0, 1, 2, ... */',
        'export const FONT_WIDTH_MODELS: Readonly<Record<FontWidthModel, readonly number[]>> = {',
        *[f"    '{m}': [{', '.join(str(i) for i in ids)}]," for m, ids in refs.items()],
        '};',
        '',
        'export const FONT_WIDTH_TABLES: readonly FontWidthTable[] = [',
    ]
    for i, t in enumerate(tables):
        lines += [
            f'    // {i}: {", ".join(t["used"])}',
            '    {',
            f"        name: '{t['name']}',",
            f'        height: {t["height"]},',
            f'        missing: {t["missing"]},',
            f'        count: {t["count"]},',
            '        data: [',
            *ts_data(t['data'], ' ' * 12),
            '        ],',
            '    },',
        ]
    lines += ['];', '']
    with open(out, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(lines))


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    out = sys.argv[1]
    models = []
    for arg in sys.argv[2:]:
        model, _, path = arg.partition('=')
        if model not in MODELS or not path:
            sys.exit(f'bad argument {arg!r}, expected <model>=<in.HMI> with model in {MODELS}')
        models.append((model, path))
    tables, refs = read(models)
    sources = [f'{m}={os.path.basename(p)}' for m, p in models]
    if out.endswith('.json'):
        with open(out, 'w', encoding='utf-8') as fh:
            json.dump({'sources': sources, 'models': refs, 'tables': tables}, fh, separators=(',', ':'))
    else:
        write_ts(tables, refs, sources, out)
    for m, ids in refs.items():
        print(f'{m}: fonts 0..{len(ids) - 1} -> tables {ids}')
    print(f'{out}: {os.path.getsize(out)} bytes')


if __name__ == '__main__':
    main()
