import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import {
    formatTenths,
    handleCommand,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    ringFraction,
    tempFromTouch,
} from './parse';

const ctx = { pageType: 'cardThermo2', pageArgs: [] };

const ICON_THERMO = ''; // thermometer
const ICON_HUM = ''; // water-percent

// built by PageThermo2.getMessage(): title, nav, name~dstTemp~min~max~step~unit~1,
// 7 info entities (text~<name>.<i>~<value>~<colour>~~[power]) and the page items
function payload(power: string, slots: string[]): string {
    const info = [
        `text~bad.0~${ICON_THERMO}~2016~~`,
        'text~bad.1~240~2016~~',
        'text~bad.2~°C~2016~~',
        `text~bad.3~${ICON_HUM}~63519~~`,
        'text~bad.4~300~63519~~',
        'text~bad.5~%~63519~~',
        `text~bad.6~MANUAL~65363~~${power}`,
    ];
    return [
        'entityUpd~Bad~button~bSubPrev~~1055~~~button~bSubNext~~1055~~',
        'bad~285~150~300~5~°C~1',
        ...info,
        ...slots,
    ].join('~');
}

const SLOTS = [
    'button~bad?0~~63488~~1',
    'button~bad?1~~35921~~1',
    '~~~~~',
    '~~~~~',
    'button~bad?4~~35921~~1',
    '~~~~~',
    '~~~~~',
    '~~~~~',
];

describe('cardThermo2 parse', () => {
    it('parses the head, the info lines and the slots', () => {
        const { args } = parseCommand(payload('1', SLOTS));
        const m = parseEntityUpd(args, initial(), ctx);
        expect(m.received).toBe(true);
        expect(m.title).toBe('Bad');
        expect(m.navigation.left.icon).toBe('');
        expect(m.navigation.right.id).toBe('bSubNext');
        expect(m.id).toBe('bad');
        expect(m.dstTemp).toBe(285);
        expect(m.minTemp).toBe(150);
        expect(m.maxTemp).toBe(300);
        expect(m.tempStep).toBe(5);
        expect(m.unit).toBe('°C');
        expect(m.power).toBe(true);
        expect(m.line1).toEqual({
            icon: ICON_THERMO,
            iconColor: 2016,
            value: 240,
            valueColor: 2016,
            unit: '°C',
            unitColor: 2016,
        });
        expect(m.line2.icon).toBe(ICON_HUM);
        expect(m.line2.value).toBe(300);
        expect(m.line2.unit).toBe('%');
        expect(m.line2.unitColor).toBe(63519);
        expect(m.mode).toBe('MANUAL');
        expect(m.modeColor).toBe(65363);
        expect(m.slots).toHaveLength(9);
        expect(m.slots[0]).toEqual({
            type: 'button',
            id: 'bad?0',
            icon: '',
            iconColor: 63488,
            displayName: '',
            optionalValue: '1',
        });
        expect(m.slots[1].id).toBe('bad?1');
        expect(m.slots[2].type).toBe('');
        expect(m.slots[4].id).toBe('bad?4');
        // the adapter sends only 8 items, the 9th slot of the HMI stays empty
        expect(m.slots[8].type).toBe('');
    });

    it('takes the power flag from the mode entity', () => {
        const { args } = parseCommand(payload('0', SLOTS));
        expect(parseEntityUpd(args, initial(), ctx).power).toBe(false);
    });

    it('keeps a 9th slot when the adapter sends one', () => {
        const { args } = parseCommand(payload('1', [...SLOTS, 'button~bad?8~~2016~~1']));
        const m = parseEntityUpd(args, initial(), ctx);
        expect(m.slots[8].id).toBe('bad?8');
        expect(m.slots[8].icon).toBe('');
    });

    it('falls back to defaults for missing fields', () => {
        const args = ['T', ...new Array<string>(12).fill(''), 'x'];
        const m = parseEntityUpd(args, initial(), ctx);
        expect(m.id).toBe('x');
        expect(m.minTemp).toBe(150);
        expect(m.maxTemp).toBe(280);
        expect(m.dstTemp).toBe(150);
        expect(m.tempStep).toBe(5);
        expect(m.power).toBe(true);
        expect(m.slots.every(s => s.type === '')).toBe(true);
    });

    it('does not handle popups or other commands', () => {
        expect(parseEntityUpdateDetail(['x'], initial(), ctx)).toBeUndefined();
        expect(handleCommand('color', ['1'], initial(), ctx)).toBeUndefined();
    });

    it('formats tenths like the xfloat of the HMI', () => {
        expect(formatTenths(285)).toBe('28.5');
        expect(formatTenths(300)).toBe('30.0');
        expect(formatTenths(-15)).toBe('-1.5');
    });

    it('maps values and touches onto the 270 degree ring', () => {
        expect(ringFraction(150, 150, 300)).toBe(0);
        expect(ringFraction(300, 150, 300)).toBe(1);
        expect(ringFraction(225, 150, 300)).toBe(0.5);
        expect(ringFraction(400, 150, 300)).toBe(1);
        expect(ringFraction(10, 10, 10)).toBe(0);
        // top of the ring = middle of the range
        expect(tempFromTouch(0, -80, 150, 300, 5)).toBe(225);
        // left = 1/6 of the sweep
        expect(tempFromTouch(-80, 0, 150, 300, 5)).toBe(175);
        // right = 5/6
        expect(tempFromTouch(80, 0, 150, 300, 5)).toBe(275);
        // the open part at the bottom snaps to the nearest end
        expect(tempFromTouch(-10, 80, 150, 300, 5)).toBe(150);
        expect(tempFromTouch(10, 80, 150, 300, 5)).toBe(300);
        // rounded to the step
        expect(tempFromTouch(-80, -1, 150, 300, 10)).toBe(180);
    });
});
