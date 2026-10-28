"""Nextion Editor project files (.HMI) - a container of sections.

See container-format.md and section-checksum.md of newmatik/nextion-hmi-writer:

  0x00000  u32 count, count records of 28 bytes, u32 directory checksum
           record: name (16, NUL padded), u32 offset, u32 size, u8 deleted, 3 opaque bytes
  0x80000  the same directory and checksum again
  0x700000 the section payloads
A deleted section keeps its payload, its record gets the deleted flag and a zeroed first name byte.
The editor saves append-only: a changed section is a new payload at the end of the file with a new
record, the old record is marked deleted. Pages (<n>.pa) carry a checksum at offset 0.
Fonts are the sections <n>.zi, pictures <n>.i / <n>.is, pages <n>.pa.
"""
import struct

SECOND_DIRECTORY = 0x80000
FIRST_PAYLOAD = 0x700000
POLY = 0x04C11DB7


def _entry(value):
    for _ in range(8):
        value = ((value << 1) & 0xFFFFFFFF) ^ (POLY if value & 0x80000000 else 0)
    return value


TABLE = tuple(_entry(i << 24) for i in range(256))


def _update(state, data):
    """the editor's byte kernel: one byte, four table rounds"""
    for value in data:
        state ^= value
        for _ in range(4):
            state = ((state << 8) & 0xFFFFFFFF) ^ TABLE[state >> 24]
    return state


def _update_words(state, data):
    for (value,) in struct.iter_unpack('<I', data):
        state ^= value
        for _ in range(4):
            state = ((state << 8) & 0xFFFFFFFF) ^ TABLE[state >> 24]
    return state


def directory_checksum(directory):
    """directory = u32 count + records, without the checksum"""
    return _update_words(0xFFFFFFFF, directory + b'ADEC')


def page_checksum(page):
    state = _update(0xFFFFFFFF, page[4:])
    state = _update(state, struct.pack('<I', len(page)))
    state = _update(state, page[12:16])
    return _update(state, b'\x00\x4f')


def main_checksum(main):
    state = _update(0xFFFFFFFF, main[4:])
    state = _update(state, main[16:20])
    state = _update(state, main[4:8])
    state = _update(state, main[10:11])
    return _update(state, main[14:15])


class Hmi:
    def __init__(self, data):
        self.d = bytes(data)
        n = struct.unpack_from('<I', self.d, 0)[0]
        self.dir_len = 4 + n * 28
        if self.d[:self.dir_len + 4] != self.d[SECOND_DIRECTORY:SECOND_DIRECTORY + self.dir_len + 4]:
            raise ValueError('the two directories differ')
        if directory_checksum(self.d[:self.dir_len]) != struct.unpack_from('<I', self.d, self.dir_len)[0]:
            raise ValueError('wrong directory checksum')
        self.records = [self.d[4 + i * 28:4 + i * 28 + 28] for i in range(n)]
        self.files = {}
        for rec in self.records:
            name = rec[:16].split(b'\0')[0].decode('latin1')
            off, size = struct.unpack_from('<II', rec, 16)
            if not name or rec[24]:
                continue
            if name in self.files:
                raise ValueError(f'{name} is live twice')
            self.files[name] = self.d[off:off + size]

    def check(self):
        """raises if a page or main.HMI checksum is wrong"""
        for name, data in self.files.items():
            if name.endswith('.pa') and page_checksum(data) != struct.unpack_from('<I', data, 0)[0]:
                raise ValueError(f'wrong checksum of {name}')
            if name == 'main.HMI' and main_checksum(data) != struct.unpack_from('<I', data, 0)[0]:
                raise ValueError('wrong checksum of main.HMI')

    def build(self, changes):
        """New project file with the sections {name: bytes} replaced, the way the editor saves."""
        out = bytearray(self.d)
        records = [bytearray(r) for r in self.records]
        for name, data in changes.items():
            if name not in self.files:
                raise KeyError(name)
            if name.endswith('.pa'):
                data = struct.pack('<I', page_checksum(data)) + data[4:]
            live = [r for r in records if r[:16].split(b'\0')[0].decode('latin1') == name and not r[24]]
            old = live[0]
            new = bytearray(old)
            struct.pack_into('<II', new, 16, len(out), len(data))
            old[0] = 0
            old[24] = 1
            records.append(new)
            out += data
        directory = struct.pack('<I', len(records)) + b''.join(records)
        if len(directory) + 4 > SECOND_DIRECTORY:
            raise ValueError('directory too big')
        block = directory + struct.pack('<I', directory_checksum(directory))
        for base in (0, SECOND_DIRECTORY):
            out[base:base + len(block)] = block
        return bytes(out)
