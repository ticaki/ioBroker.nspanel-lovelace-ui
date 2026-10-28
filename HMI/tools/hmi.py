"""Nextion Editor project files (.HMI) - a container of files.

  0x00000  u32 count, then count entries of 28 bytes: name (16, NUL padded), u32 offset, u32 size,
           u32 (not used - uninitialised memory of the editor)
  0x80000  the same directory again
  0x700000 the files, back to back in the order of their offsets
Fonts are the entries <n>.zi, pictures <n>.i / <n>.is, pages <n>.pa.
"""
import struct

SECOND_DIRECTORY = 0x80000


class Hmi:
    def __init__(self, data):
        self.d = bytes(data)
        n = struct.unpack_from('<I', data, 0)[0]
        self.dir_len = 4 + n * 28
        if self.d[:self.dir_len] != self.d[SECOND_DIRECTORY:SECOND_DIRECTORY + self.dir_len]:
            raise ValueError('the two directories differ')
        self.entries = []
        for i in range(n):
            p = 4 + i * 28
            name = self.d[p:p + 16].split(b'\0')[0].decode('latin1')
            off, size = struct.unpack_from('<II', self.d, p + 16)
            self.entries.append((i, name, off, size))
        self.files = {i: self.d[off:off + size] for i, _, off, size in self.entries}

    def find(self, name):
        hits = [i for i, n, _, _ in self.entries if n == name]
        if len(hits) != 1:
            raise KeyError(name)
        return hits[0]

    def build(self, files):
        """New project file with the files {index: bytes}, all other bytes stay as they are."""
        start = min(off for _, _, off, _ in self.entries)
        out = bytearray(self.d[:start])
        pos = start
        placed = {}
        for i, _, _, _ in sorted(self.entries, key=lambda e: e[2]):
            b = files.get(i, self.files[i])
            placed[i] = (pos, len(b))
            out += b
            pos += len(b)
        for base in (0, SECOND_DIRECTORY):
            for i, (off, size) in placed.items():
                struct.pack_into('<II', out, base + 4 + i * 28 + 16, off, size)
        return bytes(out)
