"""Nextion Editor page sections (<n>.pa) - read, change and write back.

Layout of a page section:

  0x00  u32 checksum (see hmi.page_checksum), u32 total length, u32 header size (0x38),
        u32 object count, ..., page name at 0x18, unknown editor bytes up to the header size
  hdr   object table: count x (u32 offset relative to hdr, u32 size, u32 0)
  ...   the objects, each a list of length-prefixed records (u32 len + bytes):
        'att-N'                      N attribute records follow
        name (16, NUL padded)+value  one attribute, value little endian
        'codes<event>-N'             N source lines of that event follow, one record each
        b''                          end of the object
"""
import re
import struct

CODES = re.compile(rb'codes(\w+)-(\d+)')


def _records(data):
    out, pos = [], 0
    while pos < len(data):
        (size,) = struct.unpack_from('<I', data, pos)
        out.append(data[pos + 4:pos + 4 + size])
        pos += 4 + size
    return out


class Obj:
    """One page component: an ordered list of items
    ('att', name, value) / ('code', event, [lines]) / ('end', None, None)."""

    def __init__(self, records):
        self.items = []
        i = 0
        while i < len(records):
            rec = records[i]
            match = CODES.fullmatch(rec)
            if match:
                count = int(match.group(2))
                lines = [x.decode('utf-8') for x in records[i + 1:i + 1 + count]]
                self.items.append(['code', match.group(1).decode(), lines])
                i += 1 + count
                continue
            if re.fullmatch(rb'att-\d+', rec):
                i += 1
                continue
            if rec == b'':
                self.items.append(['end', None, None])
            else:
                if len(rec) < 16:
                    raise ValueError(f'unknown record {rec!r}')
                self.items.append(['att', rec[:16].split(b'\0')[0].decode('latin1'), rec[16:]])
            i += 1

    def copy(self):
        clone = Obj([])
        clone.items = [[k, n, list(v) if k == 'code' else v] for k, n, v in self.items]
        return clone

    def _att(self, name):
        for item in self.items:
            if item[0] == 'att' and item[1] == name:
                return item
        raise KeyError(name)

    def has(self, name):
        return any(i[0] == 'att' and i[1] == name for i in self.items)

    @property
    def name(self):
        return self._att('objname')[2].decode('latin1')

    def get(self, name):
        value = self._att(name)[2]
        if name in ('objname', 'txt'):
            return value.decode('utf-8')
        return int.from_bytes(value, 'little')

    def set(self, name, value):
        item = self._att(name)
        if isinstance(value, str):
            item[2] = value.encode('utf-8')
        else:
            item[2] = value.to_bytes(len(item[2]), 'little')

    def geometry(self, x, y, w, h):
        self.set('x', x)
        self.set('y', y)
        self.set('w', w)
        self.set('h', h)
        self.set('endx', x + w - 1)
        self.set('endy', y + h - 1)

    def code(self, event):
        for item in self.items:
            if item[0] == 'code' and item[1] == event:
                return item[2]
        raise KeyError(event)

    def set_code(self, event, lines):
        for item in self.items:
            if item[0] == 'code' and item[1] == event:
                item[2] = list(lines)
                return
        raise KeyError(event)

    def records(self):
        atts = sum(1 for i in self.items if i[0] == 'att')
        out = [f'att-{atts}'.encode()]
        for kind, name, value in self.items:
            if kind == 'att':
                out.append(name.encode('latin1').ljust(16, b'\0') + value)
            elif kind == 'code':
                out.append(f'codes{name}-{len(value)}'.encode())
                out += [line.encode('utf-8') for line in value]
            else:
                out.append(b'')
        return out

    def bytes(self):
        return b''.join(struct.pack('<I', len(r)) + r for r in self.records())


class Page:
    def __init__(self, data):
        self.head = bytearray(data[:struct.unpack_from('<I', data, 8)[0]])
        hdr = len(self.head)
        count = struct.unpack_from('<I', data, 12)[0]
        self.objs = []
        for i in range(count):
            off, size, _ = struct.unpack_from('<III', data, hdr + i * 12)
            self.objs.append(Obj(_records(data[hdr + off:hdr + off + size])))
        if self.bytes()[4:] != bytes(data[4:]):
            raise ValueError('page does not round-trip')

    def obj(self, name):
        for o in self.objs:
            if o.name == name:
                return o
        raise KeyError(name)

    def bytes(self):
        """the page without a valid checksum - hmi.Hmi.build sets it"""
        for i, o in enumerate(self.objs):
            o.set('id', i)
        bodies = [o.bytes() for o in self.objs]
        table = b''
        pos = len(bodies) * 12
        for body in bodies:
            table += struct.pack('<III', pos, len(body), 0)
            pos += len(body)
        head = bytearray(self.head)
        out = head + table + b''.join(bodies)
        struct.pack_into('<I', out, 4, len(out))
        struct.pack_into('<I', out, 12, len(self.objs))
        struct.pack_into('<I', out, 0, struct.unpack_from('<I', self.head, 0)[0])
        return bytes(out)


def block(lines, start):
    """index range [start, end) of the statement at lines[start] including its { } body"""
    depth = 0
    seen = False
    for i in range(start, len(lines)):
        text = lines[i].split('//')[0] if '"' not in lines[i] else lines[i]
        depth += text.count('{') - text.count('}')
        if '{' in text:
            seen = True
        if seen and depth == 0:
            # '}else' or an 'else' on the next line continues the statement
            if 'else' in text or (i + 1 < len(lines) and lines[i + 1].strip().startswith('else')):
                continue
            return start, i + 1
    raise ValueError(f'no block end for {lines[start]!r}')


def find(lines, text, start=0):
    for i in range(start, len(lines)):
        if lines[i].strip() == text:
            return i
    raise ValueError(f'line not found: {text}')
