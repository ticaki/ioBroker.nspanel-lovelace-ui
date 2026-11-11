/**
 * Berry driver version (`GetDriverVersion` → `{"nlui_driver_version":"<v>"}`).
 *
 * - positive integer: driver generation of a real NSPanel (9, 10, 11, ...)
 * - negative integer: emulator (Tasmota + Nextion simulator); the absolute value is the driver
 *   generation whose feature set the emulator offers (-1 = old emulator, -12 = generation 12)
 * - 0 / NaN: unknown
 */

/**
 * Parses the reported driver version. Tasmota sends it as string, older code as number.
 *
 * @param v - raw value of `nlui_driver_version`
 * @returns the integer version, 0 if it is missing or not a number
 */
export function parseDriverVersion(v: unknown): number {
    if (typeof v === 'number') {
        return Number.isFinite(v) ? Math.trunc(v) : 0;
    }
    if (typeof v === 'string') {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

/**
 * true if the driver version belongs to the emulator (negative number).
 *
 * @param v - driver version (number or raw string)
 * @returns true for an emulator
 */
export function isEmulatorDriverVersion(v: unknown): boolean {
    return parseDriverVersion(v) < 0;
}

/**
 * Driver generation regardless of panel or emulator (absolute value).
 *
 * @param v - driver version (number or raw string)
 * @returns the generation, 0 if unknown
 */
export function driverGeneration(v: unknown): number {
    return Math.abs(parseDriverVersion(v));
}
