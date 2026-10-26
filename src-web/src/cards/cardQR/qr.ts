import QRCode from 'qrcode';

/** A QR code as a square module matrix */
export interface QRModules {
    /** modules per side */
    size: number;
    /** `true` when the module is dark */
    get: (row: number, col: number) => boolean;
}

const cache = new Map<string, QRModules | undefined>();

/**
 * Encodes `text` into a QR code (error correction M like the HMI). Returns `undefined` for an
 * empty text or when the text does not fit. Results are cached by text, the card re-renders
 * on every `entityUpd`.
 *
 * @param text the text to encode
 */
export function qrModules(text: string): QRModules | undefined {
    if (text === '') {
        return undefined;
    }
    if (cache.has(text)) {
        return cache.get(text);
    }
    let result: QRModules | undefined;
    try {
        const code = QRCode.create(text, { errorCorrectionLevel: 'M' });
        const { size, data } = code.modules;
        result = { size, get: (row: number, col: number): boolean => data[row * size + col] === 1 };
    } catch {
        result = undefined;
    }
    if (cache.size > 50) {
        cache.clear();
    }
    cache.set(text, result);
    return result;
}

/**
 * The svg path of all dark modules (one `M x y h1 v1 h-1 z` per module) in a viewBox of
 * `size` units per side.
 *
 * @param qr the module matrix
 */
export function qrPath(qr: QRModules): string {
    const parts: string[] = [];
    for (let row = 0; row < qr.size; row++) {
        for (let col = 0; col < qr.size; col++) {
            if (qr.get(row, col)) {
                parts.push(`M${col} ${row}h1v1h-1z`);
            }
        }
    }
    return parts.join('');
}
