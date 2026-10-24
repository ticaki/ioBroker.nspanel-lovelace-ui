import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { clampSpeed, handleCommand, initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';

const glyphByName: Record<string, string> = Object.fromEntries(Object.entries(glyphMap).map(([g, n]) => [n, g]));
const HOME = glyphByName.home;
const SOLAR = glyphByName['solar-power'];
const BATTERY = glyphByName['battery-high'];
const GRID = glyphByName['transmission-tower'];

const ctx = { pageType: 'cardPower', pageArgs: [] };

/** the example of HMI/Readme.md */
const README =
    'entityUpd~PowerTest~x~navUp~A~65535~~~delete~~~~~~text~sensor.power_consumption~B~17299~Power consumption~100W~1~text~sensor.power_consumption~C~17299~Power consumption~100W~1~text~sensor.today_energy~D~17299~Total energy 1~5836.0kWh~0~delete~~~~~~0~text~sensor.today_energy~E~17299~Total energy 1~5836.0kWh~-30~delete~~~~~~0~text~sensor.today_energy~F~65504~Total energy 1~5836.0kWh~90~text~sensor.today_energy~G~17299~Total energy 1~5836.0kWh~10';

/** what `pagePower.ts` sends: home with icon and two values, three items, the rest empty */
const ADAPTER = `entityUpd~Energie~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~~~${HOME}~65535~~1.2 kW~~~~~~~350 W~~~~${SOLAR}~2016~~3.5 kW~-80~~~~~~~~~~${BATTERY}~1024~~45 %~20~~~${GRID}~63488~~2.1 kW~60~~~~~~~~~~~~~~`;

function args(payload: string): string[] {
    return payload.split('~').slice(1);
}

describe('cardPower', () => {
    it('parses the readme example', () => {
        const m = parseEntityUpd(args(README), initial(), ctx);
        expect(m.title).toBe('PowerTest');
        expect(m.navigation.left.id).toBe('navUp');
        expect(m.navigation.left.icon).toBe('A');
        expect(m.home).toEqual({
            icon: 'B',
            iconColor: 17299,
            name: 'Power consumption',
            valueBottom: '100W',
            valueTop: '100W',
        });
        expect(m.slots).toHaveLength(6);
        expect(m.slots[0]).toMatchObject({
            position: 'leftTop',
            icon: 'D',
            value: '5836.0kWh',
            speed: 0,
            empty: false,
        });
        expect(m.slots[1]).toMatchObject({ position: 'leftMiddle', empty: true, speed: 0 });
        expect(m.slots[2]).toMatchObject({ position: 'leftBottom', icon: 'E', speed: -30 });
        expect(m.slots[3].empty).toBe(true);
        expect(m.slots[4]).toMatchObject({ position: 'rightMiddle', icon: 'F', iconColor: 65504, speed: 90 });
        expect(m.slots[5]).toMatchObject({ position: 'rightBottom', icon: 'G', speed: 10 });
    });

    it('parses the adapter payload', () => {
        const m = parseEntityUpd(args(ADAPTER), initial(), ctx);
        expect(m.title).toBe('Energie');
        expect(m.home).toEqual({ icon: HOME, iconColor: 65535, name: '', valueBottom: '1.2 kW', valueTop: '350 W' });
        expect(m.slots[0]).toEqual({
            position: 'leftTop',
            icon: SOLAR,
            iconColor: 2016,
            name: '',
            value: '3.5 kW',
            speed: -80,
            empty: false,
        });
        expect(m.slots[1].empty).toBe(true);
        expect(m.slots[2]).toMatchObject({ icon: BATTERY, value: '45 %', speed: 20 });
        expect(m.slots[3]).toMatchObject({ icon: GRID, iconColor: 63488, value: '2.1 kW', speed: 60 });
        expect(m.slots[4].empty).toBe(true);
        expect(m.slots[5].empty).toBe(true);
    });

    it('clamps the speed to the range of the HMI', () => {
        expect(clampSpeed('500')).toBe(120);
        expect(clampSpeed('-500')).toBe(-120);
        expect(clampSpeed('')).toBe(0);
        expect(clampSpeed('abc')).toBe(0);
        expect(clampSpeed('12.5')).toBe(12.5);
    });

    it('tolerates a short payload', () => {
        const m = parseEntityUpd(['Energie'], initial(), ctx);
        expect(m.title).toBe('Energie');
        expect(m.slots.every(s => s.empty)).toBe(true);
    });

    it('has no popups and no other commands', () => {
        const m = initial();
        expect(parseEntityUpdateDetail(['x'], m, ctx)).toBeUndefined();
        expect(handleCommand('color', ['1'], m, ctx)).toBeUndefined();
    });
});
