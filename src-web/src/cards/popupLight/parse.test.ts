import { describe, expect, it } from 'vitest';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';
import { colorToWheelPosition, wheelPositionToColor } from './ColorWheel';

const ctx = { pageType: 'popupLight', pageArgs: ['light.desk', 'Schreibtischlampe'] };

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('popupLight', () => {
    it('parses a colour light with dimmer, colour temperature and effect list', () => {
        // getDetailPayload('2Sliders'): entityName~icon~slidersColor~buttonState~slider1Pos~slider2Pos~hueMode~hue~ct~bri~popup
        const m = parseEntityUpdateDetail(
            args('entityUpdateDetail~light.desk~\u{F0335}~64512~1~75~40~enable~Farbe~Temperatur~Helligkeit~enable'),
            initial(),
            ctx,
        );
        expect(m).toEqual({
            entityName: 'light.desk',
            icon: '\u{F0335}',
            color: 64512,
            power: true,
            brightness: 75,
            colorTemp: 40,
            hueMode: true,
            colorLabel: 'Farbe',
            colorTempLabel: 'Temperatur',
            brightnessLabel: 'Helligkeit',
            effectList: true,
            received: true,
        });
    });

    it('parses a plain switch (no sliders, no colour)', () => {
        // a socket: slider1Pos and slider2Pos are "disable", hueMode disable, translations empty
        const m = parseEntityUpdateDetail(
            args('entityUpdateDetail~socket.1~\u{F0335}~65535~0~disable~disable~disable~~~~disable'),
            initial(),
            ctx,
        );
        expect(m.power).toBe(false);
        expect(m.brightness).toBeUndefined();
        expect(m.colorTemp).toBeUndefined();
        expect(m.hueMode).toBe(false);
        expect(m.effectList).toBe(false);
    });

    it('reads disable as "no switch" and the readme example', () => {
        // HMI/Readme.md: entityUpdateDetail~1~17299~1~100~78~enable (old format without icon field)
        const m = parseEntityUpdateDetail(args('entityUpdateDetail~1~~17299~disable~100~78~enable'), initial(), ctx);
        expect(m.power).toBeUndefined();
        expect(m.color).toBe(17299);
        expect(m.brightness).toBe(100);
        expect(m.colorTemp).toBe(78);
        expect(m.hueMode).toBe(true);
    });

    it('ignores entityUpd', () => {
        const m = initial();
        expect(parseEntityUpd(['x'], m, ctx)).toBe(m);
    });
});

describe('colour wheel', () => {
    it('maps positions like Color.pos_to_color of the adapter', () => {
        // right edge = red, top = hue 90, centre = white
        expect(wheelPositionToColor(160, 80, 160)).toEqual({ r: 255, g: 0, b: 0 });
        expect(wheelPositionToColor(80, 0, 160)).toEqual({ r: 128, g: 255, b: 0 });
        expect(wheelPositionToColor(80, 80, 160)).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('places a colour where the adapter would read it back', () => {
        const pos = colorToWheelPosition({ r: 0, g: 255, b: 255 }, 160);
        expect(pos.x).toBeCloseTo(0, 0);
        expect(pos.y).toBeCloseTo(80, 0);
        const back = wheelPositionToColor(pos.x, pos.y, 160);
        expect(back).toEqual({ r: 0, g: 255, b: 255 });
    });
});
