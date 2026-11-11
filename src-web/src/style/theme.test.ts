import { describe, expect, it } from 'vitest';
import { contentWidth, isPortrait, isWebModel, stageSize } from './theme';

describe('theme', () => {
    it('knows the stage of every model', () => {
        expect(stageSize('eu')).toEqual({ width: 480, height: 320 });
        expect(stageSize('us-l')).toEqual({ width: 480, height: 320 });
        expect(stageSize('us-p')).toEqual({ width: 320, height: 480 });
        expect(stageSize('web-p')).toEqual({ width: 320, height: 640 });
        expect(stageSize('web-l')).toEqual({ width: 640, height: 320 });
    });

    it('keeps the empty strip of the HMI on the hardware, the web models use the full width', () => {
        expect(contentWidth('eu')).toBe(447);
        expect(contentWidth('us-l')).toBe(447);
        expect(contentWidth('us-p')).toBe(320);
        expect(contentWidth('web-p')).toBe(320);
        expect(contentWidth('web-l')).toBe(640);
    });

    it('tells portrait and web models apart', () => {
        expect(isPortrait('us-p')).toBe(true);
        expect(isPortrait('web-p')).toBe(true);
        expect(isPortrait('eu')).toBe(false);
        expect(isPortrait('web-l')).toBe(false);
        expect(isWebModel('web-p')).toBe(true);
        expect(isWebModel('web-l')).toBe(true);
        expect(isWebModel('us-p')).toBe(false);
    });
});
