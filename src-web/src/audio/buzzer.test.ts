import { describe, expect, it } from 'vitest';
import { parseBuzzerPayload } from './buzzer';

describe('parseBuzzerPayload', () => {
    it('plays count beeps with pauses', () => {
        expect(parseBuzzerPayload('1')).toEqual([{ on: true, ms: 100 }]);
        expect(parseBuzzerPayload('2,3,1')).toEqual([
            { on: true, ms: 300 },
            { on: false, ms: 100 },
            { on: true, ms: 300 },
        ]);
        expect(parseBuzzerPayload('')).toEqual([{ on: true, ms: 100 }]);
        expect(parseBuzzerPayload('0')).toEqual([]);
    });
    it('plays a tune bit pattern', () => {
        // 0b101 -> beep, pause, beep
        expect(parseBuzzerPayload('1,1,1,5')).toEqual([
            { on: true, ms: 100 },
            { on: false, ms: 100 },
            { on: true, ms: 100 },
        ]);
        expect(parseBuzzerPayload('1,1,1,0xF').length).toBe(4);
    });
});
