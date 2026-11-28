import { describe, expect, it } from 'vitest';
import type { PanelModel } from '../../protocol/types';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import { DEVICE_GEOMETRY, deviceGeometry, deviceLayout, deviceStageOf, progressPercent, slotBoxes } from './layout';
import {
    deviceGridColumns,
    deviceTypeName,
    handleCommand,
    initial,
    parseEntityUpd,
    parseEntityUpdateDetail,
    type CardDeviceModel,
} from './parse';
import device1 from '../../../scripts/examples/cardDevice1.txt?raw';
import device1Plain from '../../../scripts/examples/cardDevice1-plain.txt?raw';
import device2 from '../../../scripts/examples/cardDevice2.txt?raw';
import device3 from '../../../scripts/examples/cardDevice3.txt?raw';
import webL1 from '../../../scripts/examples/web-l-cardDevice1.txt?raw';
import webL1Plain from '../../../scripts/examples/web-l-cardDevice1-plain.txt?raw';
import webL2 from '../../../scripts/examples/web-l-cardDevice2.txt?raw';
import webL2Plain from '../../../scripts/examples/web-l-cardDevice2-plain.txt?raw';
import webL3 from '../../../scripts/examples/web-l-cardDevice3.txt?raw';
import webL3Plain from '../../../scripts/examples/web-l-cardDevice3-plain.txt?raw';
import webP1 from '../../../scripts/examples/web-p-cardDevice1.txt?raw';
import webP1Plain from '../../../scripts/examples/web-p-cardDevice1-plain.txt?raw';
import webP2 from '../../../scripts/examples/web-p-cardDevice2.txt?raw';
import webP2Plain from '../../../scripts/examples/web-p-cardDevice2-plain.txt?raw';
import webP3 from '../../../scripts/examples/web-p-cardDevice3.txt?raw';
import webP3Plain from '../../../scripts/examples/web-p-cardDevice3-plain.txt?raw';
import usP1 from '../../../scripts/examples/us-p-cardDevice1.txt?raw';
import usP2 from '../../../scripts/examples/us-p-cardDevice2.txt?raw';
import usP3 from '../../../scripts/examples/us-p-cardDevice3.txt?raw';

const EXAMPLES: Readonly<Record<string, string>> = {
    cardDevice1: device1,
    'cardDevice1-plain': device1Plain,
    cardDevice2: device2,
    cardDevice3: device3,
    'web-l-cardDevice1': webL1,
    'web-l-cardDevice1-plain': webL1Plain,
    'web-l-cardDevice2': webL2,
    'web-l-cardDevice2-plain': webL2Plain,
    'web-l-cardDevice3': webL3,
    'web-l-cardDevice3-plain': webL3Plain,
    'web-p-cardDevice1': webP1,
    'web-p-cardDevice1-plain': webP1Plain,
    'web-p-cardDevice2': webP2,
    'web-p-cardDevice2-plain': webP2Plain,
    'web-p-cardDevice3': webP3,
    'web-p-cardDevice3-plain': webP3Plain,
    'us-p-cardDevice1': usP1,
    'us-p-cardDevice2': usP2,
    'us-p-cardDevice3': usP3,
};

const NAV = ['button', 'bSubPrev', '<', '65535', '', '', 'button', 'bSubNext', '>', '65535', '', ''];

/**
 * the `entityUpd` line (or another message) of an example in scripts/examples (same data as the HMI preview pictures)
 *
 * @param name the example
 * @param cmd the message
 */
function example(name: string, cmd = 'entityUpd'): string[] {
    const line = (EXAMPLES[name] ?? '').split('\n').find(l => l.startsWith(`${cmd}~`));
    return (line ?? '').split('~').slice(1);
}

function el(type: string, id: string, name = '', value = '', icon = 'X', color = '65535'): string[] {
    return [type, id, icon, color, name, value];
}

const EMPTY = ['', '', '', '', '', ''];

function ctx(pageType: string, model?: PanelModel): { pageType: string; pageArgs: string[]; model?: PanelModel } {
    return { pageType, pageArgs: [], model };
}

describe('cardDevice layouts', () => {
    it('maps the pageTypes to the layouts and slot kinds of device-page-hmi.md', () => {
        expect(deviceLayout('cardDevice1')).toBe(1);
        expect(deviceLayout('cardDevice2')).toBe(2);
        expect(deviceLayout('cardDevice3')).toBe(3);
        expect(DEVICE_GEOMETRY[1].slots.map(s => s.kind)).toEqual([
            'info',
            'info',
            'button',
            'button',
            'button',
            'button',
        ]);
        expect(DEVICE_GEOMETRY[2].slots.map(s => s.kind)).toEqual([
            'value',
            'progress',
            'info',
            'info',
            'info',
            'button',
        ]);
        expect(DEVICE_GEOMETRY[3].slots.map(s => s.kind)).toEqual([
            'info',
            'info',
            'info',
            'info',
            'info',
            'info',
            'switch',
            'switch',
        ]);
    });

    it('keeps every element inside the content area x 10-440, y 67-320', () => {
        for (const layout of [1, 2, 3] as const) {
            const g = DEVICE_GEOMETRY[layout];
            const boxes = [g.main.icon, g.main.name, g.status, g.info, ...g.grid];
            for (const stage of [0, 1, 2, 3] as const) {
                for (const s of deviceGeometry(layout, 'eu', [], stage).slots) {
                    boxes.push(...(s ? slotBoxes(s) : []));
                }
            }
            for (const b of boxes) {
                expect(b.x, `layout ${layout}`).toBeGreaterThanOrEqual(10);
                expect(b.x + b.w, `layout ${layout}`).toBeLessThanOrEqual(440);
                expect(b.y, `layout ${layout}`).toBeGreaterThanOrEqual(67);
                expect(b.y + b.h, `layout ${layout}`).toBeLessThanOrEqual(320);
            }
        }
    });

    it('centres the status line on every page', () => {
        expect(DEVICE_GEOMETRY[1].statusAlign).toBe(1);
        expect(DEVICE_GEOMETRY[2].statusAlign).toBe(1);
        expect(DEVICE_GEOMETRY[3].statusAlign).toBe(1);
        for (const layout of [1, 2, 3] as const) {
            expect(DEVICE_GEOMETRY[layout].status).toEqual({ x: 10, y: 289, w: 390, h: 30 });
            expect(DEVICE_GEOMETRY[layout].info).toEqual({ x: 404, y: 288, w: 36, h: 32 });
        }
    });

    it('limits the progress to an integer 0-100', () => {
        expect(progressPercent('62')).toBe(62);
        expect(progressPercent('62.7')).toBe(62);
        expect(progressPercent('-5')).toBe(0);
        expect(progressPercent('150')).toBe(100);
        expect(progressPercent('')).toBe(0);
        expect(progressPercent('abc')).toBe(0);
    });
});

describe('cardDevice parse', () => {
    it('cardDevice1: main, 2 info, 4 buttons and the info icon', () => {
        const m = parseEntityUpd(example('cardDevice1'), initial(), ctx('cardDevice1'));
        expect(m.layout).toBe(1);
        expect(m.title).toBe('Saugroboter');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.navigation.right.id).toBe('bSubNext');
        // type 1 (only sends) is the type text of the touch code
        expect(m.main).toMatchObject({ type: 'text', id: '9?0?main', displayName: 'Robbi' });
        expect(m.status).toBe('Reinigt Wohnzimmer, noch 12 min (Wischen)');
        expect(m.slots).toHaveLength(6);
        expect(m.slots[0]).toMatchObject({ type: 'text', displayName: 'Akku', optionalValue: '80 %' });
        expect(m.slots[1]).toMatchObject({ displayName: 'Fläche', optionalValue: '34 m²' });
        expect(m.slots.slice(2, 6).map(s => s.displayName)).toEqual(['Start', 'Pause', 'Dock', 'Suchen']);
        expect(m.info).toMatchObject({ type: 'text', id: '9?0?info' });
        expect(isEmptySlot(m.info)).toBe(false);
        // the stage in field 6 of info
        expect(m.stage).toBe(1);
        expect(m.icons).toEqual([]);
        expect(m.columns).toBe(0);
    });

    it('cardDevice1 without status icons: info icon at field 56, stage 0', () => {
        const args = example('cardDevice1-plain');
        // field 56 of the payload (entityUpd = field 0) is args[55]
        expect(args[55]).toBe('1');
        expect(args[56]).toBe('9?0?info');
        expect(args[60]).toBe('');
        const m = parseEntityUpd(args, initial(), ctx('cardDevice1'));
        expect(m.info.id).toBe('9?0?info');
        expect(m.stage).toBe(0);
    });

    it('the type as a number: 0 hidden, 1 sends, 2-9 the popup types; a name stays a name', () => {
        expect(['', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '07'].map(deviceTypeName)).toEqual([
            '',
            '',
            'text',
            'shutter',
            'shutter2',
            'input_sel',
            'timer',
            'light',
            'light2',
            'fan',
            'number',
            'text',
            'light2',
        ]);
        expect(['button', 'switch', 'delete', 'light'].map(deviceTypeName)).toEqual([
            'button',
            'switch',
            'delete',
            'light',
        ]);
        const m = parseEntityUpd(
            ['T', ...NAV, ...el('6', 'm'), ...el('0', 's1'), ...el('2', 's2'), ...el('9', 's3')],
            initial(),
            ctx('cardDevice1'),
        );
        expect([m.main, ...m.slots.slice(0, 3)].map(e => e.type)).toEqual(['light', '', 'shutter', 'number']);
        expect(isEmptySlot(m.slots[0])).toBe(true);
        // navigation keeps its names
        expect(m.navigation.left.type).toBe('button');
    });

    it('cardDevice2: value, progress, 3 info and a button', () => {
        const m = parseEntityUpd(example('cardDevice2'), initial(), ctx('cardDevice2'));
        expect(m.layout).toBe(2);
        expect(m.slots).toHaveLength(6);
        expect(m.slots[0]).toMatchObject({ displayName: 'Restzeit', optionalValue: '1:23' });
        expect(m.slots[1]).toMatchObject({ icon: '', displayName: 'Fortschritt 62 %', optionalValue: '62' });
        expect(m.slots[1].iconColor).toBe(1311);
        expect(m.slots[3]).toMatchObject({ displayName: 'Temperatur', optionalValue: '60 °C' });
        expect(m.slots[5]).toMatchObject({ type: 'text', displayName: 'Pause' });
        expect(m.status).toBe('Schleudern, noch 23 min - Fertig um 14:35');
        expect(m.info.id).toBe('9?0?info');
    });

    it('cardDevice3: 6 info, 2 switches, the info icon after slot 8', () => {
        const m = parseEntityUpd(example('cardDevice3'), initial(), ctx('cardDevice3'));
        expect(m.layout).toBe(3);
        expect(m.slots).toHaveLength(8);
        expect(m.slots.slice(0, 6).map(s => s.displayName)).toEqual([
            'Akku',
            'Reichw.',
            'Innen',
            'Türen',
            'Laden',
            'km-Stand',
        ]);
        expect(m.slots[6]).toMatchObject({ type: 'text', displayName: 'Klima', optionalValue: '1' });
        expect(m.slots[7]).toMatchObject({ type: 'text', id: '9?0?8' });
        expect(m.stage).toBe(0);
        expect(m.info.id).toBe('9?0?info');
    });

    it('treats empty and delete elements as empty', () => {
        const args = [
            'T',
            ...NAV,
            ...el('text', 'm', 'Gerät', 'Status'),
            ...EMPTY,
            ...el('delete', '', '', ''),
            ...el('1', 'b3', 'Start'),
            ...EMPTY,
            ...EMPTY,
            ...el('0', 'b6', 'Suchen'),
            ...EMPTY,
        ];
        const m = parseEntityUpd(args, initial(), ctx('cardDevice1'));
        expect(m.slots.map(isEmptySlot)).toEqual([true, true, false, true, true, true]);
        expect(isEmptySlot(m.info)).toBe(true);
    });

    it('fills missing elements at the end with empty ones and has no info icon then', () => {
        const args = ['T', ...NAV, ...el('text', 'm', 'Auto', 'ok'), ...el('text', 's1', 'Akku', '78 %')];
        const m = parseEntityUpd(args, initial(), ctx('cardDevice3'));
        expect(m.slots).toHaveLength(8);
        expect(m.slots.slice(1).every(isEmptySlot)).toBe(true);
        expect(isEmptySlot(m.info)).toBe(true);
    });

    it('reads the info icon at element N+1 of each layout', () => {
        const slots6 = Array.from({ length: 6 }, (_, i) => el('text', `s${i + 1}`)).flat();
        const slots8 = Array.from({ length: 8 }, (_, i) => el('text', `s${i + 1}`)).flat();
        const info = el('button', 'info');
        const m1 = parseEntityUpd(['T', ...NAV, ...el('text', 'm'), ...slots6, ...info], initial(), ctx('cardDevice1'));
        const m2 = parseEntityUpd(['T', ...NAV, ...el('text', 'm'), ...slots6, ...info], initial(), ctx('cardDevice2'));
        const m3 = parseEntityUpd(['T', ...NAV, ...el('text', 'm'), ...slots8, ...info], initial(), ctx('cardDevice3'));
        for (const m of [m1, m2, m3]) {
            expect(m.info.id).toBe('info');
            expect(m.slots.every(s => s.id.startsWith('s'))).toBe(true);
        }
        // on cardDevice3 the 6-slot payload of cardDevice1 would put the info icon into slot 7
        const wrong = parseEntityUpd(
            ['T', ...NAV, ...el('text', 'm'), ...slots6, ...info],
            initial(),
            ctx('cardDevice3'),
        );
        expect(wrong.slots[6].id).toBe('info');
        expect(isEmptySlot(wrong.info)).toBe(true);
    });

    it('keeps the status line when main is empty', () => {
        const args = ['T', ...NAV, '', '', '', '', '', 'Lädt an Wallbox', ...el('text', 's1', 'Akku', '78 %')];
        const m = parseEntityUpd(args, initial(), ctx('cardDevice3'));
        expect(isEmptySlot(m.main)).toBe(true);
        expect(m.status).toBe('Lädt an Wallbox');
        const deleted = parseEntityUpd(['T', ...NAV, 'delete', '', '', '', '', 'läuft'], initial(), ctx('cardDevice1'));
        expect(isEmptySlot(deleted.main)).toBe(true);
        expect(deleted.status).toBe('läuft');
    });

    it('starts empty and does not handle entityUpdateDetail', () => {
        const m = initial();
        expect(m.slots).toHaveLength(6);
        expect(m.extras).toEqual([]);
        expect(m.status).toBe('');
        expect([m.stage, m.icons, m.columns]).toEqual([0, [], 0]);
        expect(parseEntityUpdateDetail(['x'], m, ctx('cardDevice1'))).toBeUndefined();
    });
});

describe('cardDevice parse: additional slots of the web models', () => {
    const HARDWARE: readonly PanelModel[] = ['eu', 'us-l', 'us-p'];
    const WEB: readonly PanelModel[] = ['web-l', 'web-p'];
    const PAGES = [
        { pageType: 'cardDevice1', slots: 6, extras: 2 },
        { pageType: 'cardDevice2', slots: 6, extras: 3 },
        { pageType: 'cardDevice3', slots: 8, extras: 3 },
    ] as const;

    it('a web model reads them behind the info icon: 2 / 3 / 3 per page', () => {
        for (const page of PAGES) {
            for (const model of WEB) {
                const m = parseEntityUpd(example(`${model}-${page.pageType}`), initial(), ctx(page.pageType, model));
                expect(m.slots, page.pageType).toHaveLength(page.slots);
                expect(m.info.id, page.pageType).toBe('9?0?info');
                expect(m.extras, page.pageType).toHaveLength(page.extras);
                expect(m.extras.every(e => !isEmptySlot(e) && e.type === 'text')).toBe(true);
                expect(new Set(m.extras.map(e => e.id)).size).toBe(page.extras);
            }
        }
    });

    it('the standard part of a payload with additional slots is the payload without them', () => {
        for (const page of PAGES) {
            const web = parseEntityUpd(example(`web-l-${page.pageType}`), initial(), ctx(page.pageType, 'web-l'));
            const eu = parseEntityUpd(example(page.pageType), initial(), ctx(page.pageType, 'eu'));
            expect({ ...web, extras: [] }, page.pageType).toEqual(eu);
        }
    });

    it('a hardware model (also as a web clone) has none, whatever follows the info icon', () => {
        for (const page of PAGES) {
            for (const model of [...HARDWARE, undefined]) {
                const m = parseEntityUpd(example(`web-l-${page.pageType}`), initial(), ctx(page.pageType, model));
                expect(m.extras, `${page.pageType} ${model}`).toEqual([]);
                expect(m.slots).toHaveLength(page.slots);
                expect(m.info.id).toBe('9?0?info');
            }
        }
    });

    it('a web model without additional slots in the payload gets empty ones', () => {
        for (const page of PAGES) {
            for (const model of WEB) {
                for (const name of [page.pageType, `${model}-${page.pageType}-plain`]) {
                    const m = parseEntityUpd(example(name), initial(), ctx(page.pageType, model));
                    expect(m.extras, name).toHaveLength(page.extras);
                    expect(m.extras.every(isEmptySlot), name).toBe(true);
                    expect(m.info.id, name).toBe('9?0?info');
                }
            }
        }
    });

    it('reads a payload that ends in the middle of the additional slots', () => {
        const args = example('web-l-cardDevice2');
        // cut behind the first additional slot (info), the two buttons are missing
        const m = parseEntityUpd(args.slice(0, args.length - 12), initial(), ctx('cardDevice2', 'web-l'));
        expect(m.extras.map(isEmptySlot)).toEqual([false, true, true]);
        expect(m.extras[0]).toMatchObject({ displayName: 'Wasser', optionalValue: '48 l' });
    });

    it('us-p reads its example like eu: the standard part, the first part of the status text', () => {
        for (const page of PAGES) {
            const m = parseEntityUpd(example(`us-p-${page.pageType}`), initial(), ctx(page.pageType, 'us-p'));
            const eu = parseEntityUpd(example(page.pageType), initial(), ctx(page.pageType, 'eu'));
            expect(m.extras).toEqual([]);
            expect({ ...m, main: { ...m.main, optionalValue: '' }, status: '' }).toEqual({
                ...eu,
                main: { ...eu.main, optionalValue: '' },
                status: '',
            });
            expect(eu.status.startsWith(m.status.split(',')[0])).toBe(true);
        }
    });

    it('devStatus keeps the additional slots', () => {
        const before = parseEntityUpd(example('web-l-cardDevice3'), initial(), ctx('cardDevice3', 'web-l'));
        const after = handleCommand('devStatus', ['Teil 2'], before, ctx('cardDevice3', 'web-l'));
        expect(after?.extras).toBe(before.extras);
        expect(after?.status).toBe('Teil 2');
    });
});

describe('cardDevice status icon grid (devIcons, stage)', () => {
    /** a devIcons message with `filled` cells (of `count`) */
    function icons(filled: number, count = 16): string[] {
        return Array.from({ length: count }, (_, i) =>
            i < filled ? ['1', `c${i + 1}`, 'I', '2047'] : ['', '', '', ''],
        ).flat();
    }

    /** an entityUpd of cardDevice1 / cardDevice3 with the stage in field 6 of info */
    function withStage(pageType: string, stage: string): string[] {
        const count = pageType === 'cardDevice3' ? 8 : 6;
        const slots = Array.from({ length: count }, (_, i) => el('1', `s${i + 1}`)).flat();
        return ['T', ...NAV, ...el('1', 'm'), ...slots, ...el('1', 'info', '', stage)];
    }

    function open(pageType: string, stage: string, filled: number): CardDeviceModel {
        const m = parseEntityUpd(withStage(pageType, stage), initial(), ctx(pageType));
        const count = pageType === 'cardDevice3' ? 8 : 16;
        return handleCommand('devIcons', icons(filled, count), m, ctx(pageType)) ?? m;
    }

    it('reads the stage from field 6 of info like covx, limited to the stages of the page', () => {
        expect(['', '0', '1', '2', '3', '4', 'x', '-1', '2a'].map(f => deviceStageOf(1, f))).toEqual([
            0, 0, 1, 2, 3, 3, 0, 0, 2,
        ]);
        expect(['1', '2', '3'].map(f => deviceStageOf(3, f))).toEqual([1, 2, 2]);
        expect(deviceStageOf(2, '2')).toBe(0);
    });

    it('devIcons: the cells in their order, type, id, icon and colour, no name and value', () => {
        const m = open('cardDevice1', '1', 3);
        expect(m.icons).toHaveLength(16);
        expect(m.icons[0]).toEqual({
            type: 'text',
            id: 'c1',
            icon: 'I',
            iconColor: 2047,
            displayName: '',
            optionalValue: '',
        });
        expect(m.icons.map(isEmptySlot)).toEqual([false, false, false, ...Array.from({ length: 13 }, () => true)]);
        // the example of the HMI tool: four icons behind the entityUpd
        const ex = parseEntityUpd(example('cardDevice1'), initial(), ctx('cardDevice1'));
        const shown = handleCommand('devIcons', example('cardDevice1', 'devIcons'), ex, ctx('cardDevice1'));
        expect(shown?.icons.slice(0, 4).map(c => c.id)).toEqual(['9?0?7', '9?0?8', '9?0?9', '9?0?10']);
        expect(shown?.columns).toBe(2);
        // the rest of the page stays
        expect(shown?.slots).toBe(ex.slots);
    });

    it('shows the columns up to the highest filled cell, a half filled one included, at most those of the stage', () => {
        // cardDevice1: stage 1 3 columns, 2 5, 3 8
        expect([0, 1, 2, 3, 5, 6, 7, 16].map(n => open('cardDevice1', '3', n).columns)).toEqual([
            0, 1, 1, 2, 3, 3, 4, 8,
        ]);
        expect([1, 6, 7, 16].map(n => open('cardDevice1', '1', n).columns)).toEqual([1, 3, 3, 3]);
        expect([9, 10, 11].map(n => open('cardDevice1', '2', n).columns)).toEqual([5, 5, 5]);
        expect(open('cardDevice1', '0', 16).columns).toBe(0);
        // cardDevice3: one row, stage 1 4 cells, 2 8
        expect([1, 4, 5, 8].map(n => open('cardDevice3', '1', n).columns)).toEqual([1, 4, 4, 4]);
        expect([1, 5, 8].map(n => open('cardDevice3', '2', n).columns)).toEqual([1, 5, 8]);
        // an empty cell in front of a filled one counts (the adapter sends them without gaps anyway)
        const gap = parseEntityUpd(withStage('cardDevice1', '3'), initial(), ctx('cardDevice1'));
        const cells = [...['', '', '', ''], ...['', '', '', ''], ...['1', 'c3', 'I', '1']];
        expect(deviceGridColumns(1, handleCommand('devIcons', cells, gap, ctx('cardDevice1'))?.icons ?? [], 3)).toBe(2);
    });

    it('a devIcons alone changes the cells, an entityUpd keeps them and hides the columns beyond its stage', () => {
        const m = open('cardDevice1', '3', 16);
        expect(m.columns).toBe(8);
        const fewer = handleCommand('devIcons', icons(2), m, ctx('cardDevice1'));
        expect(fewer?.columns).toBe(1);
        expect(fewer?.icons.filter(c => !isEmptySlot(c))).toHaveLength(2);
        // the next entityUpd with a smaller stage: the cells stay, at most the columns of the stage
        const smaller = parseEntityUpd(withStage('cardDevice1', '1'), m, ctx('cardDevice1'));
        expect(smaller.icons).toBe(m.icons);
        expect([smaller.stage, smaller.columns]).toEqual([1, 3]);
        // a larger stage shows no more columns until the next devIcons (like the HMI)
        const larger = parseEntityUpd(withStage('cardDevice1', '3'), smaller, ctx('cardDevice1'));
        expect(larger.columns).toBe(3);
        expect(handleCommand('devIcons', icons(16), larger, ctx('cardDevice1'))?.columns).toBe(8);
    });

    it('devIcons before the first entityUpd: stage 0, the grid stays empty until the next devIcons', () => {
        const early = handleCommand('devIcons', icons(5), initial(), ctx('cardDevice1'));
        expect(early?.columns).toBe(0);
        const m = parseEntityUpd(withStage('cardDevice1', '2'), early ?? initial(), ctx('cardDevice1'));
        expect([m.stage, m.columns, m.icons.length]).toEqual([2, 0, 16]);
        expect(handleCommand('devIcons', icons(5), m, ctx('cardDevice1'))?.columns).toBe(3);
        // cardDevice3 starts from the model of a fresh page as well
        const early3 = handleCommand('devIcons', icons(3, 8), initial(), ctx('cardDevice3'));
        expect([early3?.layout, early3?.icons.length, early3?.columns]).toEqual([3, 8, 0]);
    });

    it('cardDevice2 has no grid: devIcons changes nothing', () => {
        const m = parseEntityUpd(example('cardDevice2'), initial(), ctx('cardDevice2'));
        expect(handleCommand('devIcons', icons(4), m, ctx('cardDevice2'))).toBe(m);
        expect(m.stage).toBe(0);
    });

    it('the geometry follows the stage: info rows in set A / B / C / none, tiles 1 and 2 of cardDevice3', () => {
        const info = (stage: 0 | 1 | 2 | 3): unknown => deviceGeometry(1, 'eu', [], stage).slots[0];
        expect(info(0)).toMatchObject({ icon: { x: 126 }, name: { x: 164, w: 164 }, value: { x: 330, w: 110 } });
        expect(info(1)).toMatchObject({ icon: { x: 247 }, name: { x: 285, w: 43 }, value: { x: 330, w: 110 } });
        expect(info(2)).toMatchObject({ icon: { x: 321 }, value: { x: 359, w: 81 } });
        expect(info(2)).not.toHaveProperty('name');
        expect(info(3)).toBeUndefined();
        // buttons do not move
        expect(deviceGeometry(1, 'eu', [], 3).slots.slice(2)).toEqual(DEVICE_GEOMETRY[1].slots.slice(2));
        expect(deviceGeometry(3, 'eu', [], 1).slots.slice(0, 2)).toEqual([undefined, DEVICE_GEOMETRY[3].slots[1]]);
        expect(deviceGeometry(3, 'eu', [], 2).slots.slice(0, 3)).toEqual([
            undefined,
            undefined,
            DEVICE_GEOMETRY[3].slots[2],
        ]);
    });
});

describe('cardDevice status line', () => {
    it('the model carries field 6 of main as it is, on every layout', () => {
        for (const pageType of ['cardDevice1', 'cardDevice2', 'cardDevice3']) {
            const m = parseEntityUpd(['T', ...NAV, ...el('text', 'm', 'Main', 'kurz')], initial(), ctx(pageType));
            expect(m.status).toBe('kurz');
            // no mark any more: a `¬` is a character of the text
            const marked = parseEntityUpd(
                ['T', ...NAV, ...el('text', 'm', 'Main', 'Text¬1')],
                initial(),
                ctx(pageType),
            );
            expect(marked.status).toBe('Text¬1');
        }
        expect(initial().status).toBe('');
    });

    it('devStatus~<text> replaces only the status line', () => {
        for (const pageType of ['cardDevice1', 'cardDevice2', 'cardDevice3']) {
            const before = parseEntityUpd(
                ['T', ...NAV, ...el('text', 'm', 'Main', 'Teil 1'), ...el('text', 's1', 'Akku', '80 %')],
                initial(),
                ctx(pageType),
            );
            const after = handleCommand('devStatus', ['Teil 2'], before, ctx(pageType));
            expect(after).toEqual({ ...before, status: 'Teil 2' });
            // the element of main is not touched
            expect(after?.main).toBe(before.main);
            expect(after?.slots).toBe(before.slots);
            // an empty text empties the line
            expect(handleCommand('devStatus', [''], before, ctx(pageType))?.status).toBe('');
            expect(handleCommand('devStatus', [], before, ctx(pageType))?.status).toBe('');
        }
    });

    it('other commands are not handled', () => {
        expect(handleCommand('statusUpdate', ['x'], initial(), ctx('cardDevice1'))).toBeUndefined();
    });
});
