"""Nextion font files (.zi, version 6, utf-8, 3 bit anti-aliased).

Format (see Docs/"Nextion Font Format Specification ZI version 6" of hagronnestad/nextion-font-editor):
  header 0x2C bytes: magic 04 FF 00 0A, 0x07 height, 0x0C u32 character count, 0x10 version (6),
  0x11 length of font name + encoding name, 0x14 u32 size of everything after the header,
  then font name + encoding name (e.g. "NotoSans-Regular" "utf-8")
  character table, 10 bytes per character, sorted by code:
    u16 code, u8 width, u8 left overhang, u8 right overhang, u24 offset (from table start), u16 length
  glyph data, row-major from the top left, box = (left + width + right) x height, first byte = mode:
    mode 3 (anti-aliased), alpha 0..7 (7 = opaque):
      000nnnnn  n transparent           001nnnnn  n opaque
      010nnnnn  n transparent, 1 opaque 011nnnnn  n transparent, 2 opaque
      10nnnaaa  n transparent, 1 pixel alpha a
      11aaabbb  2 pixels alpha a, b

encode() writes the same bytes as the Nextion Editor (checked against all glyphs of the icon fonts).
"""
import struct


class Zi:
    def __init__(self, data):
        self.d = data
        self.h = data[7]
        self.cnt = struct.unpack_from('<I', data, 0x0C)[0]
        nl = data[0x11]
        self.base = 0x2C + nl
        self.chars = {}
        for i in range(self.cnt):
            e = data[self.base + i * 10:self.base + i * 10 + 10]
            cp, w, left, right = struct.unpack_from('<HBBB', e)
            off = int.from_bytes(e[5:8], 'little')
            ln = struct.unpack_from('<H', e, 8)[0]
            self.chars[cp] = (w, left, right, data[self.base + off:self.base + off + ln])

    def build(self, chars):
        """New font file with the header of this font and the given characters {code: (w, l, r, bytes)}."""
        cps = sorted(chars)
        table = bytearray()
        data = bytearray()
        base = len(cps) * 10
        for cp in cps:
            w, left, right, g = chars[cp]
            table += struct.pack('<HBBB', cp, w, left, right) + (base + len(data)).to_bytes(3, 'little')
            table += struct.pack('<H', len(g))
            data += g
        if base + len(data) >= 1 << 24:
            raise ValueError('font data exceeds 16 MB (would need 8 byte alignment)')
        head = bytearray(self.d[:self.base])
        struct.pack_into('<I', head, 0x0C, len(cps))
        struct.pack_into('<I', head, 0x14, len(head) - 0x2C + len(table) + len(data))
        return bytes(head + table + data)


def decode(g, total=0):
    """glyph bytes (mode 3) -> list of alpha values 0..7, row-major"""
    px = []
    for b in g[1:]:
        if b & 0x80:
            if b & 0x40:
                px += [(b >> 3) & 7, b & 7]
            else:
                px += [0] * ((b >> 3) & 7) + [b & 7]
        else:
            ty = (b >> 5) & 3
            n = b & 31
            if ty == 0:
                px += [0] * n
            elif ty == 1:
                px += [7] * n
            else:
                px += [0] * n + [7] * (ty - 1)
    return px + [0] * (total - len(px)) if total else px


def encode(px):
    """list of alpha values 0..7 (row-major) -> glyph bytes (mode 3), as the Nextion Editor writes them"""
    out = bytearray([3])
    i = 0
    n = len(px)
    while i < n:
        v = px[i]
        if v == 0:
            j = i
            while j < n and px[j] == 0 and j - i < 31:
                j += 1
            t = j - i
            # transparent run followed by 1-2 opaque pixels (a full chunk of 31 is written on its own)
            if t < 31 and j < n and px[j] == 7:
                m = 2 if j + 1 < n and px[j + 1] == 7 else 1
                out.append(0x40 | ((m - 1) << 5) | t)
                i = j + m
                continue
            # up to 7 transparent followed by one partial pixel
            if j < n and t <= 7 and 0 < px[j] < 7:
                out.append(0x80 | (t << 3) | px[j])
                i = j + 1
                continue
            out.append(t)
            i = j
            continue
        # a single opaque pixel is paired with the next one
        if v == 7 and i + 1 < n and px[i + 1] != 7:
            out.append(0xC0 | (7 << 3) | px[i + 1])
            i += 2
            continue
        if v == 7:
            j = i
            while j < n and px[j] == 7 and j - i < 31:
                j += 1
            out.append(0x20 | (j - i))
            i = j
            continue
        if i + 1 < n:
            out.append(0xC0 | (v << 3) | px[i + 1])
            i += 2
        else:
            out.append(0x80 | v)
            i += 1
    return bytes(out)
