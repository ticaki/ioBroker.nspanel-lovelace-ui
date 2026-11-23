import { describe, expect, it } from 'vitest';
import { isEmptySlot } from '../cardEntities/shared/menuParse';
import { DEVICE_GEOMETRY, deviceGeometry, deviceLayout, progressPercent, statusBlockVisible } from './layout';
import { initial, parseDeviceStatus, parseEntityUpd, parseEntityUpdateDetail } from './parse';
import device1 from '../../../scripts/examples/cardDevice1.txt?raw';
import device1Plain from '../../../scripts/examples/cardDevice1-plain.txt?raw';
import device2 from '../../../scripts/examples/cardDevice2.txt?raw';
import device3 from '../../../scripts/examples/cardDevice3.txt?raw';

const EXAMPLES: Readonly<Record<string, string>> = {
    cardDevice1: device1,
    'cardDevice1-plain': device1Plain,
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
                    boxes.push(s.cell);
                    continue;
                }
                boxes.push(s.name);
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
    it('cardDevice1: main, 2 info, 4 buttons and the info icon', () => {
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
        expect(m.slots.slice(6).map(s => s.id)).toEqual(['9?0?7', '9?0?8', '9?0?9', '9?0?10']);
        expect(m.info).toMatchObject({ type: 'button', id: '9?0?info' });
        expect(isEmptySlot(m.info)).toBe(false);
        expect(statusBlockVisible(1, m.slots)).toBe(true);
    });

    it('cardDevice1 without status icons: 4 empty status slots, info icon at field 80', () => {
        const args = example('cardDevice1-plain');
        // field 80 of the payload (entityUpd = field 0) is args[79]
        expect(args[79]).toBe('button');
        expect(args[80]).toBe('9?0?info');
        const m = parseEntityUpd(args, initial(), ctx('cardDevice1'));
        expect(m.slots.slice(6).every(isEmptySlot)).toBe(true);
        expect(m.info.id).toBe('9?0?info');
        expect(statusBlockVisible(1, m.slots)).toBe(false);
    });

    it('reads an old cardDevice1 payload with 6 slots: info icon after slot 6, no status icons', () => {
        const slots6 = Array.from({ length: 6 }, (_, i) => el('text', `s${i + 1}`)).flat();
        const m = parseEntityUpd(
            ['T', ...NAV, ...el('text', 'm'), ...slots6, ...el('button', 'info')],
            initial(),
            ctx('cardDevice1'),
        );
        expect(m.slots).toHaveLength(10);
        expect(m.slots.slice(0, 6).map(s => s.id)).toEqual(['s1', 's2', 's3', 's4', 's5', 's6']);
        expect(m.slots.slice(6).every(isEmptySlot)).toBe(true);
        expect(m.info.id).toBe('info');
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
        const slots10 = Array.from({ length: 10 }, (_, i) => el('text', `s${i + 1}`)).flat();
        const slots8 = Array.from({ length: 8 }, (_, i) => el('text', `s${i + 1}`)).flat();
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

describe('cardDevice1 status block', () => {
    function slots(statusFilled: number): ReturnType<typeof initial>['slots'] {
        const m = initial();
        return m.slots.map((s, i) =>
            i >= 6 && i < 6 + statusFilled
                ? { ...s, type: 'text', id: `st${i}`, icon: 'X' }
                : i < 6
                  ? { ...s, type: 'text', id: `s${i}` }
                  : s,
        );
    }

    it('places the 4 cells 38x45 in a 2x2 grid with 1 px overlap', () => {
        const cells = DEVICE_GEOMETRY[1].slots.flatMap(s => (s.kind === 'status' ? [s.cell] : []));
        expect(cells).toEqual([
            { x: 124, y: 71, w: 38, h: 45 },
            { x: 161, y: 71, w: 38, h: 45 },
            { x: 124, y: 115, w: 38, h: 45 },
            { x: 161, y: 115, w: 38, h: 45 },
        ]);
    });

    it('0 status icons: block hidden, wide info rows', () => {
        const s = slots(0);
        expect(statusBlockVisible(1, s)).toBe(false);
        const g = deviceGeometry(1, s);
        expect(g.slots[0]).toEqual({
            kind: 'info',
            icon: { x: 126, y: 76, w: 36, h: 34 },
            name: { x: 164, y: 80, w: 164, h: 26 },
            value: { x: 330, y: 80, w: 110, h: 26 },
        });
        expect(g.slots[1]).toMatchObject({ icon: { x: 126, y: 120 }, name: { x: 164, y: 124, w: 164 } });
    });

    it('1 status icon: block shown, narrow info rows', () => {
        const s = slots(1);
        expect(statusBlockVisible(1, s)).toBe(true);
        const g = deviceGeometry(1, s);
        expect(g.slots[0]).toEqual({
            kind: 'info',
            icon: { x: 204, y: 76, w: 36, h: 34 },
            name: { x: 242, y: 80, w: 86, h: 26 },
            value: { x: 330, y: 81, w: 110, h: 26 },
        });
        expect(g.slots[1]).toEqual({
            kind: 'info',
            icon: { x: 204, y: 120, w: 36, h: 34 },
            name: { x: 242, y: 124, w: 86, h: 26 },
            value: { x: 330, y: 125, w: 110, h: 26 },
        });
        // buttons and the cells do not move
        expect(g.slots.slice(2)).toEqual(DEVICE_GEOMETRY[1].slots.slice(2));
    });

    it('4 status icons: block shown; a delete slot alone does not show it', () => {
        expect(statusBlockVisible(1, slots(4))).toBe(true);
        const deleted = slots(0).map((s, i) => (i >= 6 ? { ...s, type: 'delete' } : s));
        expect(statusBlockVisible(1, deleted)).toBe(false);
    });

    it('cardDevice2 and cardDevice3 have no status block', () => {
        const many = Array.from({ length: 8 }, (_, i) => ({ ...initial().slots[0], type: 'text', id: `s${i}` }));
        expect(statusBlockVisible(2, many)).toBe(false);
        expect(statusBlockVisible(3, many)).toBe(false);
        expect(deviceGeometry(3, many)).toBe(DEVICE_GEOMETRY[3]);
    });
});

describe('cardDevice status line: scroll mark', () => {
    it('a field without the mark stands', () => {
        expect(parseDeviceStatus('Schleudern, noch 23 min')).toEqual({
            text: 'Schleudern, noch 23 min',
            scroll: false,
        });
        expect(parseDeviceStatus('')).toEqual({ text: '', scroll: false });
        expect(parseDeviceStatus('1')).toEqual({ text: '1', scroll: false });
        // the mark only counts at the end
        expect(parseDeviceStatus('a¬1b')).toEqual({ text: 'a¬1b', scroll: false });
        expect(parseDeviceStatus('abc¬')).toEqual({ text: 'abc¬', scroll: false });
    });

    it('a field that ends with ¬ and one character scrolls, the two characters are cut off', () => {
        expect(parseDeviceStatus('Ein langer Text¬1')).toEqual({ text: 'Ein langer Text', scroll: true });
        // the HMI does not evaluate the character behind ¬
        expect(parseDeviceStatus('Text¬7')).toEqual({ text: 'Text', scroll: true });
        expect(parseDeviceStatus('¬1')).toEqual({ text: '', scroll: true });
    });

    it('the model carries the text without the mark, on every layout', () => {
        for (const pageType of ['cardDevice1', 'cardDevice2', 'cardDevice3']) {
            const long = 'Fehler: Wassertank leer, bitte nachfüllen und die Tür schließen';
            const m = parseEntityUpd(['T', ...NAV, ...el('text', 'm', 'Main', `${long}¬1`)], initial(), ctx(pageType));
            expect(m.status).toBe(long);
            expect(m.statusScroll).toBe(true);
            expect(m.main.optionalValue).toBe(`${long}¬1`);
            const standing = parseEntityUpd(
                ['T', ...NAV, ...el('text', 'm', 'Main', 'kurz')],
                initial(),
                ctx(pageType),
            );
            expect(standing.status).toBe('kurz');
            expect(standing.statusScroll).toBe(false);
        }
        expect(initial().statusScroll).toBe(false);
    });
});
