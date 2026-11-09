/**
 * CRC-16 Modbus (init 0xFFFF, reflected polynomial 0xA001, no final xor) as used by the Berry driver
 * and the display for the frames `0x55 0xBB <length lo> <length hi> <payload> <crc lo> <crc hi>`.
 */

const POLY = 0xa0_01;

const TABLE: Uint16Array = ((): Uint16Array => {
    const table = new Uint16Array(256);
    for (let i = 0; i < 256; i++) {
        let crc = i;
        for (let bit = 0; bit < 8; bit++) {
            crc = crc & 1 ? (crc >>> 1) ^ POLY : crc >>> 1;
        }
        table[i] = crc;
    }
    return table;
})();

/** Start bytes of every frame to the display */
const FRAME_HEADER = [0x55, 0xbb] as const;

/**
 * Table-driven CRC-16 Modbus.
 *
 * @param data the bytes
 * @param crc start value - pass the result of an earlier call to continue it
 * @returns the crc (0..0xFFFF)
 */
export function crc16Modbus(data: Uint8Array | readonly number[], crc: number = 0xff_ff): number {
    for (let i = 0; i < data.length; i++) {
        crc = (crc >>> 8) ^ TABLE[(crc ^ data[i]) & 0xff];
    }
    return crc;
}

/**
 * CRC of the whole frame the Berry driver builds from a CustomSend payload: header `0x55 0xBB`, the length of the
 * UTF-8 payload as 2 bytes little endian and the UTF-8 payload. This is what the display checks.
 *
 * @param payload the CustomSend payload (without a crc prefix)
 * @returns the crc (0..0xFFFF)
 */
export function panelFrameCrc(payload: string): number {
    const body = Buffer.from(payload, 'utf8');
    const length = body.length & 0xff_ff;
    let crc = crc16Modbus([...FRAME_HEADER, length & 0xff, length >>> 8]);
    crc = crc16Modbus(body, crc);
    return crc;
}

/**
 * Prefix for a CustomSend payload with a precomputed crc, taken unchecked by the Berry driver (version 12+).
 *
 * @param crc the crc of the frame
 * @returns `^XXXX^` with 4 upper case hex digits
 */
export function crcPrefix(crc: number): string {
    return `^${(crc & 0xff_ff).toString(16).toUpperCase().padStart(4, '0')}^`;
}
