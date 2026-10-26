import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import { clampTemp, formatTenths, initial, parseEntityUpd, parseEntityUpdateDetail, handleCommand } from './parse';

const ctx = { pageType: 'cardThermo', pageArgs: [] };

// built by PageThermo.getMessage(): title, nav, intNameEntity~currentTemp~dstTemp~status~min~max~step,
// 8 x (icon~colorActive~state~intName), tCurTempLbl~tStateLbl~tALbl~tCF~temp2~btDetail
const SINGLE =
    'entityUpd~Wohnzimmer~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~' +
    'thermoWZ~21.5 °C~220~Heizen~150~300~5~' +
    '~~~~~63488~1~thermoWZ?1~~33808~1~thermoWZ?2~~2016~0~thermoWZ?3~~~~~~~~~~~~~~~~~' +
    'Aktuell~Status~~°C~~1';

const DUAL =
    'entityUpd~Klima~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~' +
    'thermoAC~24.0 °C~200~Kühlen~100~350~10~' +
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~' +
    'Currently~State~~°C~260~0';

describe('cardThermo parse', () => {
    it('parses a single target with hvac actions', () => {
        const { args } = parseCommand(SINGLE);
        const m = parseEntityUpd(args, initial(), ctx);
        expect(m.received).toBe(true);
        expect(m.title).toBe('Wohnzimmer');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.navigation.right.id).toBe('bSubNext');
        expect(m.id).toBe('thermoWZ');
        expect(m.currentTemp).toBe('21.5 °C');
        expect(m.dstTemp).toBe(220);
        expect(m.status).toBe('Heizen');
        expect(m.minTemp).toBe(150);
        expect(m.maxTemp).toBe(300);
        expect(m.tempStep).toBe(5);
        expect(m.actions).toHaveLength(8);
        expect(m.actions[0].icon).toBe('');
        expect(m.actions[1]).toEqual({ icon: '', color: 63488, active: true, id: 'thermoWZ?1' });
        expect(m.actions[3]).toEqual({ icon: '', color: 2016, active: false, id: 'thermoWZ?3' });
        expect(m.curTempLabel).toBe('Aktuell');
        expect(m.stateLabel).toBe('Status');
        expect(m.unit).toBe('°C');
        expect(m.temp2).toBeUndefined();
        expect(m.detail).toBe(false);
    });

    it('parses a second target and the detail button', () => {
        const { args } = parseCommand(DUAL);
        const m = parseEntityUpd(args, initial(), ctx);
        expect(m.id).toBe('thermoAC');
        expect(m.dstTemp).toBe(200);
        expect(m.temp2).toBe(260);
        expect(m.tempStep).toBe(10);
        expect(m.detail).toBe(true);
        expect(m.actions.every(a => a.icon === '' && a.id === '')).toBe(true);
    });

    it('uses defaults for empty numeric fields and a minimum step of 1', () => {
        const nav = new Array<string>(12).fill('');
        const options = new Array<string>(32).fill('');
        const args = ['T', ...nav, 'x', '', '', '', '', '', '0.5', ...options, '', '', '', '', '', ''];
        const m = parseEntityUpd(args, initial(), ctx);
        expect(m.minTemp).toBe(150);
        expect(m.maxTemp).toBe(300);
        expect(m.dstTemp).toBe(150);
        expect(m.tempStep).toBe(1);
        expect(m.detail).toBe(true);
    });

    it('does not handle popups or other commands', () => {
        expect(parseEntityUpdateDetail(['x'], initial(), ctx)).toBeUndefined();
        expect(handleCommand('color', ['1'], initial(), ctx)).toBeUndefined();
    });

    it('formats tenths like the xfloat of the HMI', () => {
        expect(formatTenths(215)).toBe('21.5');
        expect(formatTenths(220)).toBe('22.0');
        expect(formatTenths(5)).toBe('0.5');
        expect(formatTenths(-55)).toBe('-5.5');
        expect(clampTemp(310, 150, 300)).toBe(300);
        expect(clampTemp(100, 150, 300)).toBe(150);
    });
});
