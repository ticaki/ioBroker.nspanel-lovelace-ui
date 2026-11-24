import { describe, expect, it } from 'vitest';
import { emptyEntity } from '../../protocol/split';
import { PANEL_MODELS, type Entity6, type PanelModel } from '../../protocol/types';
import { stageSize, theme } from '../../style/theme';
import { US_L_GEOMETRY, US_L_SHIFT } from './geometryHmi';
import { WEB_L_STATUS_WIDTH, spread } from './geometryWeb';
import {
    DEVICE_EXTRA_KINDS,
    DEVICE_GEOMETRY,
    DEVICE_SLOT_KINDS,
    deviceExtraKinds,
    deviceFallbackScale,
    deviceGeometry,
    hasDeviceGeometry,
    slotBoxes,
    statusBlockVisible,
    type Box,
    type DeviceGeometry,
    type DeviceLayout,
    type SlotGeometry,
} from './layout';

const LAYOUTS: readonly DeviceLayout[] = [1, 2, 3];

function filled(id: string): Entity6 {
    return { ...emptyEntity(), type: 'text', id, icon: 'X' };
}

/** the standard slots of a page, the status slots of cardDevice1 filled or empty */
function standard(layout: DeviceLayout, statusIcons: boolean): Entity6[] {
    return DEVICE_SLOT_KINDS[layout].map((kind, i) =>
        kind === 'status' && !statusIcons ? emptyEntity() : filled(`s${i + 1}`),
    );
}

/** the additional slots of a page: bit j of `mask` fills slot j */
function additional(layout: DeviceLayout, mask: number): Entity6[] {
    return DEVICE_EXTRA_KINDS[layout].map((_, j) => ((mask >> j) & 1 ? filled(`x${j + 1}`) : emptyEntity()));
}

/** every combination of filled additional slots and status icons of a page */
function variants(layout: DeviceLayout): { name: string; slots: Entity6[]; extras: Entity6[] }[] {
    const out: { name: string; slots: Entity6[]; extras: Entity6[] }[] = [];
    for (let mask = 0; mask < 1 << DEVICE_EXTRA_KINDS[layout].length; mask++) {
        for (const statusIcons of layout === 1 ? [false, true] : [false]) {
            out.push({
                name: `cardDevice${layout} extras ${mask.toString(2)} status ${statusIcons}`,
                slots: standard(layout, statusIcons),
                extras: additional(layout, mask),
            });
        }
    }
    return out;
}

interface Element {
    name: string;
    kind: string;
    boxes: Box[];
}

/** the elements of a page with their boxes */
function elements(g: DeviceGeometry): Element[] {
    const out: Element[] = [
        { name: 'main', kind: 'main', boxes: [g.main.icon, g.main.name] },
        { name: 'status line', kind: 'statusLine', boxes: [g.status] },
        { name: 'info icon', kind: 'infoIcon', boxes: [g.info] },
    ];
    g.slots.forEach((s, i) => out.push({ name: `slot ${i + 1}`, kind: s.kind, boxes: slotBoxes(s) }));
    g.extras.forEach((s, j) => {
        if (s) {
            out.push({ name: `extra ${j + 1}`, kind: s.kind, boxes: slotBoxes(s) });
        }
    });
    return out;
}

function overlap(a: Box, b: Box): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

/**
 * pairs of elements whose boxes overlap; the cells of the status block share their 1 px frame, and a hidden
 * block (no status icon) leaves its place to the info rows
 */
function overlaps(g: DeviceGeometry, statusVisible: boolean): string[] {
    const all = elements(g).filter(e => statusVisible || e.kind !== 'status');
    const out: string[] = [];
    for (let i = 0; i < all.length; i++) {
        for (let k = i + 1; k < all.length; k++) {
            if (all[i].kind === 'status' && all[k].kind === 'status') {
                continue;
            }
            if (all[i].boxes.some(a => all[k].boxes.some(b => overlap(a, b)))) {
                out.push(`${all[i].name} / ${all[k].name}`);
            }
        }
    }
    return out;
}

/** widths of the text boxes of a slot */
function textWidths(slot: SlotGeometry): Record<string, number> {
    switch (slot.kind) {
        case 'info':
        case 'value':
            return { name: slot.name.w, value: slot.value.w };
        case 'progress':
            return { name: slot.name.w, bar: slot.bar.w };
        case 'button':
        case 'switch':
            return { name: slot.name.w };
        case 'status':
            return { cell: slot.cell.w };
    }
}

describe('device page geometry: models', () => {
    it('eu, us-l and web-l have a geometry of their own; us-p and web-p draw the provisional fallback', () => {
        expect(PANEL_MODELS.filter(hasDeviceGeometry)).toEqual(['eu', 'us-l', 'web-l']);
    });

    it('has the slot kinds of the protocol on every model', () => {
        for (const model of PANEL_MODELS) {
            for (const layout of LAYOUTS) {
                const g = deviceGeometry(layout, standard(layout, true), model, additional(layout, 0b111));
                expect(
                    g.slots.map(s => s.kind),
                    `${model} ${layout}`,
                ).toEqual(DEVICE_SLOT_KINDS[layout]);
            }
        }
    });

    it('only the web models have additional slots: 2 buttons / info + 2 buttons / 2 info + switch', () => {
        expect(DEVICE_EXTRA_KINDS).toEqual({
            1: ['button', 'button'],
            2: ['info', 'button', 'button'],
            3: ['info', 'info', 'switch'],
        });
        for (const layout of LAYOUTS) {
            for (const model of ['eu', 'us-l', 'us-p'] as const) {
                expect(deviceExtraKinds(layout, model), model).toEqual([]);
            }
            for (const model of ['web-l', 'web-p'] as const) {
                expect(deviceExtraKinds(layout, model), model).toEqual(DEVICE_EXTRA_KINDS[layout]);
            }
        }
    });

    it('keeps every page inside the stage and below the title bar, without overlapping elements', () => {
        for (const model of PANEL_MODELS.filter(hasDeviceGeometry)) {
            const stage = stageSize(model);
            for (const layout of LAYOUTS) {
                for (const v of variants(layout)) {
                    const g = deviceGeometry(layout, v.slots, model, v.extras);
                    for (const e of elements(g)) {
                        for (const b of e.boxes) {
                            const at = `${model} ${v.name} ${e.name}`;
                            expect(b.x, at).toBeGreaterThanOrEqual(0);
                            expect(b.x + b.w, at).toBeLessThanOrEqual(stage.width);
                            expect(b.y, at).toBeGreaterThanOrEqual(theme.titleBarHeight);
                            expect(b.y + b.h, at).toBeLessThanOrEqual(stage.height);
                        }
                    }
                    expect(overlaps(g, statusBlockVisible(layout, v.slots)), `${model} ${v.name}`).toEqual([]);
                }
            }
        }
    });
});

describe('device page geometry: eu', () => {
    it('is the table of device-page-hmi.md, whatever additional slots the model carries', () => {
        for (const layout of LAYOUTS) {
            const g = deviceGeometry(layout, standard(layout, false), 'eu', additional(layout, 0b111));
            expect(g).toBe(DEVICE_GEOMETRY[layout]);
            expect(g.extras).toEqual([]);
            expect(g.status).toEqual({ x: 10, y: 289, w: 390, h: 30 });
            expect(g.info).toEqual({ x: 404, y: 288, w: 36, h: 32 });
        }
    });

    it('keeps the boxes of the three pages', () => {
        expect(DEVICE_GEOMETRY[1].main).toEqual({
            icon: { x: 10, y: 68, w: 110, h: 86 },
            name: { x: 10, y: 156, w: 110, h: 26 },
        });
        expect(DEVICE_GEOMETRY[1].slots[2]).toEqual({
            kind: 'button',
            icon: { x: 10, y: 190, w: 104, h: 52 },
            name: { x: 10, y: 244, w: 104, h: 26 },
        });
        expect(DEVICE_GEOMETRY[1].slots.slice(2, 6).map(s => slotBoxes(s)[0].x)).toEqual([10, 118, 226, 334]);
        expect(DEVICE_GEOMETRY[2].slots[0]).toEqual({
            kind: 'value',
            icon: { x: 110, y: 90, w: 34, h: 36 },
            value: { x: 146, y: 67, w: 190, h: 82 },
            name: { x: 146, y: 151, w: 190, h: 26 },
        });
        expect(DEVICE_GEOMETRY[2].slots[1]).toEqual({
            kind: 'progress',
            name: { x: 10, y: 179, w: 429, h: 26 },
            bar: { x: 10, y: 207, w: 429, h: 14 },
        });
        expect(DEVICE_GEOMETRY[2].slots[4]).toEqual({
            kind: 'info',
            icon: { x: 298, y: 228, w: 34, h: 48 },
            name: { x: 334, y: 226, w: 104, h: 25 },
            value: { x: 334, y: 252, w: 104, h: 25 },
        });
        expect(DEVICE_GEOMETRY[2].slots[5]).toEqual({
            kind: 'button',
            icon: { x: 340, y: 67, w: 100, h: 50 },
            name: { x: 340, y: 119, w: 100, h: 26 },
        });
        expect(DEVICE_GEOMETRY[3].slots[5]).toEqual({
            kind: 'info',
            icon: { x: 277, y: 173, w: 34, h: 48 },
            name: { x: 313, y: 171, w: 125, h: 25 },
            value: { x: 313, y: 197, w: 125, h: 25 },
        });
        expect(DEVICE_GEOMETRY[3].slots[7]).toEqual({
            kind: 'switch',
            icon: { x: 226, y: 236, w: 34, h: 34 },
            name: { x: 262, y: 240, w: 125, h: 26 },
            toggle: { x: 389, y: 228, w: 50, h: 50 },
        });
    });

    it('keeps every element inside the content area x 10-440', () => {
        for (const layout of LAYOUTS) {
            for (const statusIcons of [false, true]) {
                const g = deviceGeometry(layout, standard(layout, statusIcons), 'eu');
                for (const b of elements(g).flatMap(e => e.boxes)) {
                    expect(b.x, `layout ${layout}`).toBeGreaterThanOrEqual(10);
                    expect(b.x + b.w, `layout ${layout}`).toBeLessThanOrEqual(440);
                }
            }
        }
    });
});

describe('device page geometry: us-l', () => {
    it('is the eu page 15 px to the right, in the visible area x 15-464 of the display', () => {
        expect(US_L_SHIFT).toBe(15);
        for (const layout of LAYOUTS) {
            for (const statusIcons of [false, true]) {
                const slots = standard(layout, statusIcons);
                const eu = elements(deviceGeometry(layout, slots, 'eu'));
                const usl = elements(deviceGeometry(layout, slots, 'us-l'));
                expect(usl.map(e => e.kind)).toEqual(eu.map(e => e.kind));
                usl.forEach((e, i) => {
                    expect(e.boxes, `${layout} ${e.name}`).toEqual(eu[i].boxes.map(b => ({ ...b, x: b.x + 15 })));
                    for (const b of e.boxes) {
                        expect(b.x).toBeGreaterThanOrEqual(25);
                        expect(b.x + b.w).toBeLessThanOrEqual(455);
                    }
                });
            }
        }
        expect(US_L_GEOMETRY[1].status).toEqual({ x: 25, y: 289, w: 390, h: 30 });
        expect(US_L_GEOMETRY[1].info).toEqual({ x: 419, y: 288, w: 36, h: 32 });
        expect(deviceGeometry(1, standard(1, true), 'us-l').slots[0]).toMatchObject({ icon: { x: 219, y: 76 } });
        expect(deviceGeometry(1, standard(1, false), 'us-l').slots[0]).toMatchObject({ icon: { x: 141, y: 76 } });
        expect(deviceGeometry(2, standard(2, false), 'us-l').extras).toEqual([]);
    });
});

describe('device page geometry: web-l', () => {
    const geometry = (layout: DeviceLayout, mask: number, statusIcons = false): DeviceGeometry =>
        deviceGeometry(layout, standard(layout, statusIcons), 'web-l', additional(layout, mask));
    const xs = (slots: readonly (SlotGeometry | undefined)[]): (number | undefined)[] =>
        slots.map(s => (s ? slotBoxes(s)[0].x : undefined));

    it('uses the content area x 8-632 of the 640 px stage', () => {
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const g = deviceGeometry(layout, v.slots, 'web-l', v.extras);
                const boxes = elements(g).flatMap(e => e.boxes);
                expect(Math.min(...boxes.map(b => b.x)), v.name).toBeGreaterThanOrEqual(8);
                expect(Math.max(...boxes.map(b => b.x + b.w)), v.name).toBeLessThanOrEqual(632);
            }
            // with every additional slot the page reaches the right edge
            const full = elements(geometry(layout, 0b111)).flatMap(e => e.boxes);
            expect(Math.max(...full.map(b => b.x + b.w)), `layout ${layout}`).toBeGreaterThanOrEqual(630);
        }
    });

    it('has the status line over the width (580 px) and the info icon at the right edge, on every page', () => {
        expect(WEB_L_STATUS_WIDTH).toBe(580);
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const g = deviceGeometry(layout, v.slots, 'web-l', v.extras);
                expect(g.status, v.name).toEqual({ x: 10, y: 289, w: 580, h: 30 });
                expect(g.statusAlign).toBe(1);
                expect(g.info, v.name).toEqual({ x: 594, y: 288, w: 36, h: 32 });
            }
        }
    });

    it('gives every filled additional slot a place of its kind, an empty one at the end of its row none', () => {
        for (const layout of LAYOUTS) {
            const kinds = DEVICE_EXTRA_KINDS[layout];
            expect(geometry(layout, 0).extras, `layout ${layout}`).toEqual(kinds.map(() => undefined));
            const full = geometry(layout, 0b111).extras;
            expect(full.map(s => s?.kind)).toEqual(kinds);
            for (let mask = 0; mask < 1 << kinds.length; mask++) {
                geometry(layout, mask).extras.forEach((s, j) => {
                    if ((mask >> j) & 1) {
                        expect(s?.kind, `layout ${layout} mask ${mask} extra ${j + 1}`).toBe(kinds[j]);
                    }
                });
            }
        }
    });

    it('never makes a text box narrower than on eu (the adapter cuts names and values to the eu widths)', () => {
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const web = deviceGeometry(layout, v.slots, 'web-l', v.extras);
                const eu = deviceGeometry(layout, v.slots, 'eu');
                expect(web.main.name.w).toBeGreaterThanOrEqual(eu.main.name.w);
                expect(web.main.icon).toEqual(eu.main.icon);
                expect(web.status.w).toBeGreaterThanOrEqual(eu.status.w);
                web.slots.forEach((s, i) => {
                    for (const [field, w] of Object.entries(textWidths(s))) {
                        expect(w, `${v.name} slot ${i + 1} ${field}`).toBeGreaterThanOrEqual(
                            textWidths(eu.slots[i])[field],
                        );
                    }
                });
                // an additional slot is as wide as a standard slot of its kind on the eu page
                web.extras.forEach((s, j) => {
                    if (!s) {
                        return;
                    }
                    const like = eu.slots.filter(e => e.kind === s.kind).map(textWidths);
                    for (const [field, w] of Object.entries(textWidths(s))) {
                        expect(w, `${v.name} extra ${j + 1} ${field}`).toBeGreaterThanOrEqual(
                            Math.max(...like.map(l => l[field])),
                        );
                    }
                });
            }
        }
    });

    it('spreads boxes over a row, side by side when they do not fit', () => {
        expect(spread(4, 104)).toEqual([10, 182, 354, 526]);
        expect(spread(5, 104)).toEqual([10, 139, 268, 397, 526]);
        expect(spread(6, 104)).toEqual([8, 112, 216, 320, 424, 528]);
        expect(spread(3, 161, 114)).toEqual([114, 292, 469]);
        expect(spread(1, 140)).toEqual([10]);
    });

    it('cardDevice1: one row of 4, 5 or 6 buttons; info rows up to the right edge, narrower next to status icons', () => {
        expect(xs(geometry(1, 0b00).slots.slice(2, 6))).toEqual([10, 182, 354, 526]);
        expect(xs(geometry(1, 0b00).extras)).toEqual([undefined, undefined]);
        expect(xs([...geometry(1, 0b01).slots.slice(2, 6), ...geometry(1, 0b01).extras])).toEqual([
            10,
            139,
            268,
            397,
            526,
            undefined,
        ]);
        // only the second additional button: its place is the sixth, the fifth stays free
        expect(xs(geometry(1, 0b10).extras)).toEqual([424, 528]);
        expect(xs([...geometry(1, 0b11).slots.slice(2, 6), ...geometry(1, 0b11).extras])).toEqual([
            8, 112, 216, 320, 424, 528,
        ]);
        expect(geometry(1, 0b11).extras[1]).toEqual({
            kind: 'button',
            icon: { x: 528, y: 190, w: 104, h: 52 },
            name: { x: 528, y: 244, w: 104, h: 26 },
        });
        expect(geometry(1, 0, false).slots[0]).toEqual({
            kind: 'info',
            icon: { x: 126, y: 76, w: 36, h: 34 },
            name: { x: 164, y: 80, w: 354, h: 26 },
            value: { x: 520, y: 80, w: 110, h: 26 },
        });
        expect(geometry(1, 0, true).slots[1]).toEqual({
            kind: 'info',
            icon: { x: 204, y: 120, w: 36, h: 34 },
            name: { x: 242, y: 124, w: 276, h: 26 },
            value: { x: 520, y: 124, w: 110, h: 26 },
        });
        // main and the status block are those of eu
        expect(geometry(1, 0b11, true).slots.slice(6)).toEqual(DEVICE_GEOMETRY[1].slots.slice(6));
    });

    it('cardDevice2: 3 or 4 info tiles in a row, 1-3 buttons ending at the right edge, the bar over the width', () => {
        const plain = geometry(2, 0b000);
        expect(xs(plain.slots.slice(2, 5))).toEqual([10, 250, 490]);
        expect(xs([plain.slots[5]])).toEqual([530]);
        expect(plain.slots[0]).toEqual(DEVICE_GEOMETRY[2].slots[0]);
        expect(plain.slots[1]).toEqual({
            kind: 'progress',
            name: { x: 10, y: 179, w: 620, h: 26 },
            bar: { x: 10, y: 207, w: 620, h: 14 },
        });
        const full = geometry(2, 0b111);
        expect(xs([...full.slots.slice(2, 5), full.extras[0]])).toEqual([10, 170, 330, 490]);
        expect(xs([full.slots[5], full.extras[1], full.extras[2]])).toEqual([330, 430, 530]);
        // three buttons: the big value moves up to main and ends where the buttons begin
        expect(full.slots[0]).toMatchObject({ icon: { x: 106 }, value: { x: 140, w: 190 }, name: { x: 140, w: 190 } });
        // two buttons: standard and the first additional one
        const two = geometry(2, 0b010);
        expect(xs([two.slots[5], two.extras[1], two.extras[2]])).toEqual([430, 530, undefined]);
        expect(two.extras[0]).toBeUndefined();
    });

    it('cardDevice3: the info tiles in 2 columns, a third one for the additional ones; 2 or 3 switches in a row', () => {
        const plain = geometry(3, 0b000);
        expect(xs(plain.slots.slice(0, 6))).toEqual([114, 372, 114, 372, 114, 372]);
        expect(plain.slots.slice(0, 6).map(s => slotBoxes(s)[0].y)).toEqual([69, 69, 121, 121, 173, 173]);
        expect(xs(plain.slots.slice(6))).toEqual([10, 320]);
        expect(plain.slots[7]).toEqual({
            kind: 'switch',
            icon: { x: 320, y: 236, w: 34, h: 34 },
            name: { x: 356, y: 240, w: 125, h: 26 },
            toggle: { x: 483, y: 228, w: 50, h: 50 },
        });
        const full = geometry(3, 0b111);
        expect(xs(full.slots.slice(0, 6))).toEqual([114, 292, 114, 292, 114, 292]);
        expect(full.extras[0]).toEqual({
            kind: 'info',
            icon: { x: 469, y: 69, w: 34, h: 48 },
            name: { x: 505, y: 67, w: 125, h: 25 },
            value: { x: 505, y: 93, w: 125, h: 25 },
        });
        expect(full.extras[1]).toMatchObject({ icon: { x: 469, y: 121 } });
        expect(xs([...full.slots.slice(6), full.extras[2]])).toEqual([10, 217, 424]);
        expect(full.extras[2]).toEqual({
            kind: 'switch',
            icon: { x: 424, y: 236, w: 34, h: 34 },
            name: { x: 458, y: 240, w: 125, h: 26 },
            toggle: { x: 585, y: 228, w: 45, h: 50 },
        });
        // only the additional switch: the info tiles keep their two columns
        const onlySwitch = geometry(3, 0b100);
        expect(xs(onlySwitch.slots.slice(0, 6))).toEqual([114, 372, 114, 372, 114, 372]);
        expect(xs([...onlySwitch.slots.slice(6), onlySwitch.extras[2]])).toEqual([10, 217, 424]);
    });
});

describe('device page geometry: PHASE 2 - provisional fallback of us-p and web-p', () => {
    const FALLBACK_MODELS: readonly PanelModel[] = ['us-p', 'web-p'];

    it('draws the eu page without additional slots, scaled to the width of the stage', () => {
        for (const model of FALLBACK_MODELS) {
            expect(hasDeviceGeometry(model)).toBe(false);
            expect(deviceFallbackScale(model)).toBeCloseTo(320 / 450, 6);
            for (const layout of LAYOUTS) {
                const slots = standard(layout, true);
                const g = deviceGeometry(layout, slots, model, additional(layout, 0b111));
                expect(g).toEqual(deviceGeometry(layout, slots, 'eu'));
                expect(g.extras).toEqual([]);
                // scaled, the page fits the stage
                const scale = deviceFallbackScale(model);
                const right = Math.max(...elements(g).flatMap(e => e.boxes.map(b => b.x + b.w)));
                expect(right * scale).toBeLessThanOrEqual(stageSize(model).width);
            }
        }
    });

    it('does not scale a model with a geometry of its own', () => {
        for (const model of ['eu', 'us-l', 'web-l'] as const) {
            expect(deviceFallbackScale(model)).toBe(1);
        }
    });
});
