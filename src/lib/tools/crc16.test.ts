import { expect } from 'chai';
import { crc16Modbus, crcPrefix, panelFrameCrc } from './crc16';

/**
 * Bitwise reference - the same as `crc16_bitwise` of the Berry driver.
 *
 * @param data the bytes
 * @returns the crc
 */
function crcBitwise(data: Uint8Array | number[]): number {
    let crc = 0xff_ff;
    for (const byte of data) {
        crc ^= byte;
        for (let i = 0; i < 8; i++) {
            crc = crc & 1 ? (crc >>> 1) ^ 0xa0_01 : crc >>> 1;
        }
    }
    return crc;
}

/**
 * The frame the Berry driver builds without its crc.
 *
 * @param payload the CustomSend payload
 * @returns header, length (little endian) and the UTF-8 payload
 */
function frame(payload: string): number[] {
    const body = [...Buffer.from(payload, 'utf8')];
    return [0x55, 0xbb, body.length & 0xff, body.length >> 8, ...body];
}

describe('lib/tools/crc16', () => {
    const temp = '~Temp~21,'.repeat(80).slice(0, 720);

    it('crc of the payload bytes only matches the known value 18591', () => {
        expect(crc16Modbus(Buffer.from(temp, 'utf8'))).to.equal(18_591);
        expect(crcBitwise(Buffer.from(temp, 'utf8'))).to.equal(18_591);
    });

    it('crc of the full frame matches the bitwise reference', () => {
        const expected = crcBitwise(frame(temp));
        expect(panelFrameCrc(temp)).to.equal(expected);
        expect(panelFrameCrc(temp)).to.equal(50_086);
    });

    it('frame crc uses the UTF-8 length, not the string length', () => {
        const payload = 'time~12:00~°C äöü \u{F0590}';
        expect(Buffer.byteLength(payload, 'utf8')).to.not.equal(payload.length);
        expect(panelFrameCrc(payload)).to.equal(crcBitwise(frame(payload)));
    });

    it('frame crc of an empty payload and of a long payload (length > 255)', () => {
        expect(panelFrameCrc('')).to.equal(crcBitwise([0x55, 0xbb, 0, 0]));
        const long = 'x'.repeat(1000);
        expect(panelFrameCrc(long)).to.equal(crcBitwise(frame(long)));
    });

    it('prefix has 4 upper case hex digits', () => {
        expect(crcPrefix(0)).to.equal('^0000^');
        expect(crcPrefix(0xab)).to.equal('^00AB^');
        expect(crcPrefix(50_086)).to.equal('^C3A6^');
    });
});
