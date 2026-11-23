import { describe, expect, it } from 'vitest';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import { DEVICE_GEOMETRY, deviceLayout, progressPercent, showsStatusIcons } from './layout';
import { initial, parseEntityUpd, parseEntityUpdateDetail } from './parse';
import device1 from '../../../scripts/examples/cardDevice1.txt?raw';
import device2 from '../../../scripts/examples/cardDevice2.txt?raw';
import device3 from '../../../scripts/examples/cardDevice3.txt?raw';

const EXAMPLES: Readonly<Record<string, string>> = {
    cardDevice1: device1,
    cardDevice2: device2,
    cardDevice3: device3,
};

const NAV = ['button', 'bSubPrev', '<', '65535', '', '', 'button', 'bSubNext', '>', '65535', '', ''];

/** the `entityUpd` line of an example in scripts/examples (same data as the HMI preview pictures) */
function example(name: string): string[] {
    const line = (EXAMPLES[name] ?? '').split('\n').find(l => l.startsWith('entityUpd~'));
    return (line ?? '').split('~').slice(1);
}

function el(type: string, id: string, name = '', value = '', icon = 'X', color = '65535'): string[] {
    return [type, id, icon, color, name, value];
}

const EMPTY = ['', '', '', '', '', ''];

function ctx(pageType: string): { pageType: string; pageArgs: string[] } {
    return { pageType, pageArgs: [] };
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
            'status',
            'status',
            'status',
            'status',
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
            const boxes = [g.main.icon, g.main.name, g.status, g.info];
            for (const s of g.slots) {
                if (s.kind === 'status') {
                    boxes.push(s.icon);
                    continue;
                }
                boxes.push(s.name);
                if (s.kind === 'info' && s.narrow) {
                    boxes.push(s.narrow.icon, s.narrow.name, s.narrow.value);
                }
                if (s.kind === 'progress') {
                    boxes.push(s.bar);
                } else {
                    boxes.push(s.icon);
                }
                if (s.kind === 'info' || s.kind === 'value') {
                    boxes.push(s.value);
                }
                if (s.kind === 'switch') {
                    boxes.push(s.toggle);
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

    it('cardDevice1: 2x2 status grid right of the main icon, narrow info rows (device-page-hmi.md)', () => {
        const cells = DEVICE_GEOMETRY[1].slots.flatMap(s => (s.kind === 'status' ? [s.icon] : []));
        expect(cells).toEqual([
            { x: 124, y: 71, w: 38, h: 45 },
            { x: 161, y: 71, w: 38, h: 45 },
            { x: 124, y: 115, w: 38, h: 45 },
            { x: 161, y: 115, w: 38, h: 45 },
        ]);
        const info = DEVICE_GEOMETRY[1].slots[0];
        expect(info.kind === 'info' ? info.narrow : undefined).toEqual({
            icon: { x: 204, y: 76, w: 36, h: 34 },
            name: { x: 242, y: 80, w: 86, h: 26 },
            value: { x: 330, y: 81, w: 110, h: 26 },
        });
        const slots = DEVICE_GEOMETRY[1].slots;
        expect(showsStatusIcons(slots, () => true)).toBe(false);
        // a filled info slot does not show the grid, one filled status slot does
        expect(showsStatusIcons(slots, i => i !== 0)).toBe(false);
        expect(showsStatusIcons(slots, i => i !== 9)).toBe(true);
        expect(showsStatusIcons(DEVICE_GEOMETRY[3].slots, () => false)).toBe(false);
    });

    it('places the status line left on cardDevice1/3 and centred on cardDevice2', () => {
        expect(DEVICE_GEOMETRY[1].statusAlign).toBe(0);
        expect(DEVICE_GEOMETRY[2].statusAlign).toBe(1);
        expect(DEVICE_GEOMETRY[3].statusAlign).toBe(0);
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
    it('cardDevice1: main, 2 info, 4 buttons, 4 status icons and the info icon', () => {
        const m = parseEntityUpd(example('cardDevice1'), initial(), ctx('cardDevice1'));
        expect(m.layout).toBe(1);
        expect(m.title).toBe('Saugroboter');
        expect(m.navigation.left.id).toBe('bSubPrev');
        expect(m.navigation.right.id).toBe('bSubNext');
        expect(m.main).toMatchObject({ type: 'button', id: '9?0?main', displayName: 'Robbi' });
        expect(m.status).toBe('Reinigt Wohnzimmer, noch 12 min (Wischen)');
        expect(m.slots).toHaveLength(10);
        expect(m.slots[0]).toMatchObject({ type: 'text', displayName: 'Akku', optionalValue: '80 %' });
        expect(m.slots[1]).toMatchObject({ displayName: 'Fläche', optionalValue: '34 m²' });
        expect(m.slots.slice(2, 6).map(s => s.displayName)).toEqual(['Start', 'Pause', 'Dock', 'Suchen']);
        expect(m.slots.slice(6).map(s => [s.type, s.id, s.displayName, s.optionalValue])).toEqual([
            ['text', '9?0?7', '', ''],
            ['text', '9?0?8', '', ''],
            ['text', '9?0?9', '', ''],
            ['text', '9?0?10', '', ''],
        ]);
        expect(m.info).toMatchObject({ type: 'button', id: '9?0?info' });
        expect(isEmptySlot(m.info)).toBe(false);
    });

    it('cardDevice2: value, progress, 3 info and a button', () => {
        const m = parseEntityUpd(example('cardDevice2'), initial(), ctx('cardDevice2'));
        expect(m.layout).toBe(2);
        expect(m.slots).toHaveLength(6);
        expect(m.slots[0]).toMatchObject({ displayName: 'Restzeit', optionalValue: '1:23' });
        expect(m.slots[1]).toMatchObject({ icon: '', displayName: 'Fortschritt 62 %', optionalValue: '62' });
        expect(m.slots[1].iconColor).toBe(1311);
        expect(m.slots[3]).toMatchObject({ displayName: 'Temperatur', optionalValue: '60 °C' });
        expect(m.slots[5]).toMatchObject({ type: 'button', displayName: 'Pause' });
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
        expect(m.slots[6]).toMatchObject({ type: 'switch', displayName: 'Klima', optionalValue: '1' });
        expect(m.slots[7]).toMatchObject({ type: 'switch', id: '9?0?8' });
        expect(m.info.id).toBe('9?0?info');
    });

    it('treats empty and delete elements as empty', () => {
        const args = [
            'T',
            ...NAV,
            ...el('text', 'm', 'Gerät', 'Status'),
            ...EMPTY,
            ...el('delete', '', '', ''),
            ...el('button', 'b3', 'Start'),
            ...EMPTY,
            ...EMPTY,
            ...EMPTY,
            ...el('delete', '', '', ''),
            ...EMPTY,
            ...EMPTY,
            ...EMPTY,
            ...EMPTY,
        ];
        const m = parseEntityUpd(args, initial(), ctx('cardDevice1'));
        expect(m.slots.map(isEmptySlot)).toEqual([true, true, false, true, true, true, true, true, true, true]);
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
        const slots10 = Array.from({ length: 10 }, (_, i) => el('text', `s${i + 1}`)).flat();
        const info = el('button', 'info');
        const m1 = parseEntityUpd(
            ['T', ...NAV, ...el('text', 'm'), ...slots10, ...info],
            initial(),
            ctx('cardDevice1'),
        );
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
        expect(m.slots).toHaveLength(10);
        expect(m.status).toBe('');
        expect(parseEntityUpdateDetail(['x'], m, ctx('cardDevice1'))).toBeUndefined();
    });
});
