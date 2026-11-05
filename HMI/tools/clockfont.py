"""Build the clock font of 'screensaver5': NotoSans Bold, height 96, the ASCII characters like font 5.

Usage: PUPPETEER_PATH=$(npm root -g)/ python3 -I -B HMI/tools/clockfont.py <in.HMI> <out.zi>

The glyphs come from Chrome canvas (clockfont_render.mjs), the header from the text font '2.zi' - like
that one the table is sparse. Internal to screensaver5, not offered as a font of the adapter.
"""
import json
import os
import struct
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from hmi import Hmi  # noqa: E402
from zilib import encode  # noqa: E402

NAME = 'NotoSans-Bold-Clock96'
HEIGHT = 96
SIZE = 86  # digits of about 63 px, "22:09" 220 px: the middle between font 4 and font 5
BASELINE = 79
CHARS = ''.join(chr(code) for code in range(0x20, 0x7F))
WOFF = os.path.join(HERE, '../../src-web/node_modules/@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff')


def main(source, target):
    head = bytearray(Hmi(open(source, 'rb').read()).files['2.zi'][:0x2C])
    with tempfile.TemporaryDirectory() as tmp:
        job, out = os.path.join(tmp, 'job.json'), os.path.join(tmp, 'out.json')
        json.dump({'font': WOFF, 'height': HEIGHT, 'chars': CHARS, 'size': SIZE, 'baseline': BASELINE}, open(job, 'w'))
        subprocess.run(['node', os.path.join(HERE, 'clockfont_render.mjs'), job, out], check=True)
        glyphs = json.load(open(out))['chars']
    table, data = bytearray(), bytearray()
    codes = sorted(ord(c) for c in CHARS)
    for code in codes:
        g = glyphs[chr(code)]
        bits = encode(g['px'])
        table += struct.pack('<HBBB', code, g['w'], 0, 0)
        table += (len(codes) * 10 + len(data)).to_bytes(3, 'little') + struct.pack('<H', len(bits))
        data += bits
    title = NAME.encode() + b'utf-8'
    head[7] = HEIGHT
    struct.pack_into('<I', head, 0x0C, len(codes))
    head[0x11] = len(title)
    struct.pack_into('<I', head, 0x14, len(title) + len(table) + len(data))
    struct.pack_into('<I', head, 0x20, len(NAME))
    struct.pack_into('<I', head, 0x24, len(codes))
    open(target, 'wb').write(bytes(head) + title + table + data)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
