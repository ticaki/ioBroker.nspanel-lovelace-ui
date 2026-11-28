import { describe, expect, it } from 'vitest';
import { emptyEntity } from '../../protocol/split';
import { PANEL_MODELS, type Entity6 } from '../../protocol/types';
import { stageSize, theme } from '../../style/theme';
import type { NextionAlign } from '../cardEntities/shared/widgets';
import { US_L_GEOMETRY, US_L_SHIFT } from './geometryHmi';
import { WEB_L_STATUS_WIDTH, WEB_P_STATUS_WIDTH, spread, stack } from './geometryWeb';
import {
    BOX_STYLES,
    DEVICE_EXTRA_KINDS,
    DEVICE_GEOMETRY,
    DEVICE_GRID_CELLS,
    DEVICE_GRID_ROWS,
    DEVICE_SLOT_KINDS,
    DEVICE_STAGE_COLUMNS,
    DEVICE_STAGE_HIDDEN_SLOTS,
    deviceExtraKinds,
    deviceGeometry,
    slotBoxes,
    type Box,
    type BoxStyle,
    type DeviceGeometry,
    type DeviceLayout,
    type DeviceStage,
    type SlotGeometry,
} from './layout';
import hmiGeometry from '../../../../doc/ideas/device-details/device-page-geometry.json';

const LAYOUTS: readonly DeviceLayout[] = [1, 2, 3];

function filled(id: string): Entity6 {
    return { ...emptyEntity(), type: 'text', id, icon: 'X' };
}

/** the stages of a page */
function stagesOf(layout: DeviceLayout): DeviceStage[] {
    return DEVICE_STAGE_COLUMNS[layout].flatMap((_c, i) => (i === 0 || i === 1 || i === 2 || i === 3 ? [i] : []));
}

/** the additional slots of a page: bit j of `mask` fills slot j */
function additional(layout: DeviceLayout, mask: number): Entity6[] {
    return DEVICE_EXTRA_KINDS[layout].map((_, j) => ((mask >> j) & 1 ? filled(`x${j + 1}`) : emptyEntity()));
}

/** every combination of filled additional slots and stages of a page */
function variants(layout: DeviceLayout): { name: string; stage: DeviceStage; extras: Entity6[] }[] {
    const out: { name: string; stage: DeviceStage; extras: Entity6[] }[] = [];
    for (let mask = 0; mask < 1 << DEVICE_EXTRA_KINDS[layout].length; mask++) {
        for (const stage of stagesOf(layout)) {
            out.push({
                name: `cardDevice${layout} extras ${mask.toString(2)} stage ${stage}`,
                stage,
                extras: additional(layout, mask),
            });
        }
    }
    return out;
}

/**
 * The cells of the grid a stage can show: the columns of the stage.
 *
 * @param g the geometry
 * @param layout the page
 * @param stage the stage
 */
function stageCells(g: DeviceGeometry, layout: DeviceLayout, stage: DeviceStage): Box[] {
    return g.grid.slice(0, (DEVICE_STAGE_COLUMNS[layout][stage] ?? 0) * DEVICE_GRID_ROWS[layout]);
}

interface Element {
    name: string;
    kind: string;
    boxes: Box[];
}

/**
 * the elements of a page with their boxes; with a stage also the cells of the grid the stage shows
 *
 * @param g the geometry
 * @param cells the cells of the grid to count
 */
function elements(g: DeviceGeometry, cells: readonly Box[] = []): Element[] {
    const out: Element[] = [
        { name: 'main', kind: 'main', boxes: [g.main.icon, g.main.name] },
        { name: 'status line', kind: 'statusLine', boxes: [g.status] },
        { name: 'info icon', kind: 'infoIcon', boxes: [g.info] },
    ];
    g.slots.forEach((s, i) => {
        if (s) {
            out.push({ name: `slot ${i + 1}`, kind: s.kind, boxes: slotBoxes(s) });
        }
    });
    cells.forEach((b, i) => out.push({ name: `cell ${i + 1}`, kind: 'cell', boxes: [b] }));
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
 * pairs of elements whose boxes overlap; the cells of the grid (those the stage shows) share their 1 px frame
 */
function overlaps(g: DeviceGeometry, cells: readonly Box[]): string[] {
    const all = elements(g, cells);
    const out: string[] = [];
    for (let i = 0; i < all.length; i++) {
        for (let k = i + 1; k < all.length; k++) {
            if (all[i].kind === 'cell' && all[k].kind === 'cell') {
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
            return { name: slot.name?.w ?? 0, value: slot.value.w };
        case 'value':
            return { name: slot.name.w, value: slot.value.w };
        case 'progress':
            return { name: slot.name.w, bar: slot.bar.w };
        case 'button':
        case 'switch':
            return { name: slot.name.w };
    }
}

/** the additional slots of a kind that `mask` fills, in protocol order */
function filledOfKind(layout: DeviceLayout, mask: number, kind: string): number[] {
    return DEVICE_EXTRA_KINDS[layout].flatMap((k, j) => (k === kind && (mask >> j) & 1 ? [j] : []));
}

/** the mask with as many filled additional slots of every kind as `mask`, filled from the first one */
function compact(layout: DeviceLayout, mask: number): number {
    const kinds = DEVICE_EXTRA_KINDS[layout];
    let out = 0;
    for (const kind of new Set(kinds)) {
        const count = filledOfKind(layout, mask, kind).length;
        kinds
            .flatMap((k, j) => (k === kind ? [j] : []))
            .slice(0, count)
            .forEach(j => (out |= 1 << j));
    }
    return out;
}

describe('device page geometry: models', () => {
    it('has the slot kinds of the protocol on every model, a slot the stage covers has no boxes', () => {
        for (const model of PANEL_MODELS) {
            for (const layout of LAYOUTS) {
                for (const stage of stagesOf(layout)) {
                    const g = deviceGeometry(layout, model, additional(layout, 0b111), stage);
                    const hidden = DEVICE_STAGE_HIDDEN_SLOTS[layout][stage];
                    expect(
                        g.slots.map(s => s?.kind),
                        `${model} ${layout} stage ${stage}`,
                    ).toEqual(DEVICE_SLOT_KINDS[layout].map((kind, i) => (hidden.includes(i) ? undefined : kind)));
                }
            }
        }
    });

    it('has the cells of the status icon grid on every model: column by column, neighbours share the frame', () => {
        for (const model of PANEL_MODELS) {
            for (const layout of LAYOUTS) {
                const g = deviceGeometry(layout, model);
                const rows = DEVICE_GRID_ROWS[layout];
                expect(g.grid, `${model} ${layout}`).toHaveLength(DEVICE_GRID_CELLS[layout]);
                g.grid.forEach((cell, i) => {
                    const at = `${model} ${layout} cell ${i + 1}`;
                    const first = g.grid[0];
                    expect(cell.x, at).toBe(first.x + Math.floor(i / rows) * (first.w - 1));
                    expect(cell.y, at).toBe(first.y + (i % rows) * (first.h - 1));
                    expect([cell.w, cell.h], at).toEqual([first.w, first.h]);
                    // room for an icon of font 1 (32 px)
                    expect(Math.min(cell.w, cell.h), at).toBeGreaterThanOrEqual(36);
                });
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
        for (const model of PANEL_MODELS) {
            const stage = stageSize(model);
            for (const layout of LAYOUTS) {
                for (const v of variants(layout)) {
                    const g = deviceGeometry(layout, model, v.extras, v.stage);
                    const cells = stageCells(g, layout, v.stage);
                    for (const e of elements(g, cells)) {
                        for (const b of e.boxes) {
                            const at = `${model} ${v.name} ${e.name}`;
                            expect(b.x, at).toBeGreaterThanOrEqual(0);
                            expect(b.x + b.w, at).toBeLessThanOrEqual(stage.width);
                            expect(b.y, at).toBeGreaterThanOrEqual(theme.titleBarHeight);
                            expect(b.y + b.h, at).toBeLessThanOrEqual(stage.height);
                        }
                    }
                    expect(overlaps(g, cells), `${model} ${v.name}`).toEqual([]);
                }
            }
        }
    });
});

describe('device page geometry: additional slots of the web models leave no holes', () => {
    const WEB = ['web-l', 'web-p'] as const;
    const geometry = (
        model: (typeof WEB)[number],
        layout: DeviceLayout,
        mask: number,
        stage: DeviceStage,
    ): DeviceGeometry => deviceGeometry(layout, model, additional(layout, mask), stage);

    it('an additional slot has a place exactly when it is filled - every mask, page and model', () => {
        for (const model of WEB) {
            for (const layout of LAYOUTS) {
                const kinds = DEVICE_EXTRA_KINDS[layout];
                for (let mask = 0; mask < 1 << kinds.length; mask++) {
                    const g = geometry(model, layout, mask, 1);
                    expect(g.extras, `${model} ${layout} ${mask}`).toHaveLength(kinds.length);
                    g.extras.forEach((s, j) => {
                        const at = `${model} cardDevice${layout} mask ${mask.toString(2)} extra ${j + 1}`;
                        expect(s?.kind, at).toBe((mask >> j) & 1 ? kinds[j] : undefined);
                    });
                }
            }
        }
    });

    it('the filled ones of a kind stand on the first places of their kind, in their order', () => {
        // the page is laid out as if the filled slots were the first ones of their kind: an empty slot in front
        // of a filled one changes nothing but which slot stands on the place
        for (const model of WEB) {
            for (const layout of LAYOUTS) {
                const kinds = DEVICE_EXTRA_KINDS[layout];
                for (let mask = 0; mask < 1 << kinds.length; mask++) {
                    for (const stage of stagesOf(layout)) {
                        const at = `${model} cardDevice${layout} mask ${mask.toString(2)} stage ${stage}`;
                        const g = geometry(model, layout, mask, stage);
                        const dense = geometry(model, layout, compact(layout, mask), stage);
                        expect({ ...g, extras: [] }, at).toEqual({ ...dense, extras: [] });
                        for (const kind of new Set(kinds)) {
                            const own = filledOfKind(layout, mask, kind).map(j => g.extras[j]);
                            const first = filledOfKind(layout, compact(layout, mask), kind).map(j => dense.extras[j]);
                            expect(own, `${at} ${kind}`).toEqual(first);
                            expect(own.every(s => s !== undefined)).toBe(true);
                        }
                    }
                }
            }
        }
    });

    it('a page with one filled additional slot looks the same whichever slot of the kind it is', () => {
        // cardDevice1: button 1 or 2, cardDevice2: button 1 or 2, cardDevice3: info 1 or 2
        const pairs: [DeviceLayout, number, number][] = [
            [1, 0b01, 0b10],
            [2, 0b010, 0b100],
            [2, 0b011, 0b101],
            [3, 0b001, 0b010],
            [3, 0b101, 0b110],
        ];
        for (const model of WEB) {
            for (const [layout, first, second] of pairs) {
                const a = geometry(model, layout, first, 1);
                const b = geometry(model, layout, second, 1);
                const boxes = (g: DeviceGeometry): Box[][] =>
                    elements(g)
                        .map(e => e.boxes)
                        .sort((x, y) => x[0].y - y[0].y || x[0].x - y[0].x);
                expect(boxes(b), `${model} cardDevice${layout} ${second.toString(2)}`).toEqual(boxes(a));
            }
        }
    });

    it('the five cases with an empty slot in front of a filled one', () => {
        const x = (s: SlotGeometry | undefined): number | undefined => (s ? slotBoxes(s)[0].x : undefined);
        const y = (s: SlotGeometry | undefined): number | undefined => (s ? slotBoxes(s)[0].y : undefined);
        // web-l cardDevice1, only additional button 2: a row of five, it is the fifth
        const l1 = geometry('web-l', 1, 0b10, 0);
        expect([...l1.slots.slice(2, 6), ...l1.extras].map(x)).toEqual([10, 139, 268, 397, undefined, 526]);
        // web-p cardDevice1, only additional button 2: at the left of the third row
        const p1 = geometry('web-p', 1, 0b10, 0);
        expect(p1.extras.map(x)).toEqual([undefined, 10]);
        expect(p1.extras.map(y)).toEqual([undefined, 501]);
        // web-l cardDevice2, additional button 1 empty, 2 filled: two buttons, the big value stays where it is
        for (const mask of [0b100, 0b101]) {
            const l2 = geometry('web-l', 2, mask, 0);
            expect([l2.slots[5], l2.extras[1], l2.extras[2]].map(x), `${mask}`).toEqual([430, undefined, 530]);
            expect(l2.slots[0], `${mask}`).toEqual(DEVICE_GEOMETRY[2].slots[0]);
        }
        // web-p cardDevice2, the same: two buttons of 148 px
        const p2 = geometry('web-p', 2, 0b101, 0);
        expect([p2.slots[5], p2.extras[1], p2.extras[2]].map(x)).toEqual([10, undefined, 162]);
        expect(p2.extras[2]).toMatchObject({ icon: { w: 148 }, name: { w: 148 } });
        // web-l cardDevice3, additional info 1 empty, 2 filled: at the top of the third column
        const l3 = geometry('web-l', 3, 0b010, 0);
        expect(l3.extras[0]).toBeUndefined();
        expect(l3.extras[1]).toMatchObject({ icon: { x: 469, y: 69 } });
        // web-p cardDevice3, the same: at the left of the fourth row
        const p3 = geometry('web-p', 3, 0b010, 0);
        expect(p3.extras[0]).toBeUndefined();
        expect(p3.extras[1]).toMatchObject({ icon: { x: 10, y: 395 }, name: { x: 46, y: 393 } });
        expect(p3.extras[1]).toEqual(geometry('web-p', 3, 0b001, 0).extras[0]);
    });
});

describe('device page geometry: names of neighbouring buttons', () => {
    it('keep at least 4 px between them on every model, page and mask (eu: 104 px every 108 px)', () => {
        let rows = 0;
        for (const model of PANEL_MODELS) {
            for (const layout of LAYOUTS) {
                for (const v of variants(layout)) {
                    const g = deviceGeometry(layout, model, v.extras, v.stage);
                    const names = [...g.slots, ...g.extras]
                        .flatMap(s => (s?.kind === 'button' ? [s] : []))
                        .sort((a, b) => a.name.y - b.name.y || a.name.x - b.name.x);
                    names.forEach((b, i) => {
                        const at = `${model} ${v.name} button ${i + 1}`;
                        // the name is centred below the icon and never wider than it
                        expect(b.name.x - b.icon.x, at).toBe(b.icon.x + b.icon.w - (b.name.x + b.name.w));
                        expect(b.name.x, at).toBeGreaterThanOrEqual(b.icon.x);
                        const next = names[i + 1];
                        if (next && next.name.y === b.name.y) {
                            rows++;
                            expect(next.name.x - (b.name.x + b.name.w), at).toBeGreaterThanOrEqual(4);
                        }
                    });
                }
            }
        }
        expect(rows).toBeGreaterThan(0);
    });

    it('only buttons that stand side by side get the narrower name: 100 / 96 / 96 px', () => {
        const name = (model: 'web-l' | 'web-p', layout: DeviceLayout, mask: number): number[] => {
            const g = deviceGeometry(layout, model, additional(layout, mask));
            return [...g.slots, ...g.extras].flatMap(s => (s?.kind === 'button' ? [s.name.w] : []));
        };
        // web-l cardDevice1: 4 and 5 buttons are spread (104 px), 6 stand side by side
        expect(name('web-l', 1, 0b00)).toEqual([104, 104, 104, 104]);
        expect(name('web-l', 1, 0b01)).toEqual([104, 104, 104, 104, 104]);
        expect(name('web-l', 1, 0b10)).toEqual([104, 104, 104, 104, 104]);
        expect(name('web-l', 1, 0b11)).toEqual([100, 100, 100, 100, 100, 100]);
        // web-l cardDevice2: the buttons end at the right edge side by side
        expect(name('web-l', 2, 0b000)).toEqual([100]);
        expect(name('web-l', 2, 0b010)).toEqual([96, 96]);
        expect(name('web-l', 2, 0b100)).toEqual([96, 96]);
        expect(name('web-l', 2, 0b110)).toEqual([96, 96, 96]);
        // web-p cardDevice1: two per row with 4 px between them
        expect(name('web-p', 1, 0b11)).toEqual([148, 148, 148, 148, 148, 148]);
        // web-p cardDevice2: one 300, two 148 with 4 px between them, three side by side
        expect(name('web-p', 2, 0b000)).toEqual([300]);
        expect(name('web-p', 2, 0b010)).toEqual([148, 148]);
        expect(name('web-p', 2, 0b110)).toEqual([96, 96, 96]);
    });
});

describe('device page geometry: eu', () => {
    it('is the table of device-page-hmi.md, whatever additional slots the model carries', () => {
        for (const layout of LAYOUTS) {
            const g = deviceGeometry(layout, 'eu', additional(layout, 0b111));
            const { byStage: _stages, ...plain } = DEVICE_GEOMETRY[layout];
            expect(g).toEqual(plain);
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
        // the info rows per stage: set A, B (name 43 px, 15 bytes, the value of A), C (no name, value 81 px, 19
        // bytes), none
        const info1 = (stage: DeviceStage): SlotGeometry | undefined => deviceGeometry(1, 'eu', [], stage).slots[0];
        expect(info1(0)).toEqual({
            kind: 'info',
            icon: { x: 126, y: 76, w: 36, h: 34 },
            name: { x: 164, y: 80, w: 164, h: 26 },
            value: { x: 330, y: 80, w: 110, h: 26 },
        });
        expect(info1(1)).toEqual({
            kind: 'info',
            icon: { x: 247, y: 76, w: 36, h: 34 },
            name: { x: 285, y: 80, w: 43, h: 26, maxBytes: 15 },
            value: { x: 330, y: 80, w: 110, h: 26 },
        });
        expect(info1(2)).toEqual({
            kind: 'info',
            icon: { x: 321, y: 76, w: 36, h: 34 },
            value: { x: 359, y: 80, w: 81, h: 26, maxBytes: 19 },
        });
        expect(info1(3)).toBeUndefined();
        // the grid: 8 x 2 cells of 38 x 45 from x 124, rows at y 71 / 115; cardDevice3 8 x 1 of 38 x 52 from x 114
        expect(DEVICE_GEOMETRY[1].grid[0]).toEqual({ x: 124, y: 71, w: 38, h: 45 });
        expect(DEVICE_GEOMETRY[1].grid[1]).toEqual({ x: 124, y: 115, w: 38, h: 45 });
        expect(DEVICE_GEOMETRY[1].grid[15]).toEqual({ x: 383, y: 115, w: 38, h: 45 });
        expect(DEVICE_GEOMETRY[3].grid[0]).toEqual({ x: 114, y: 67, w: 38, h: 52 });
        expect(DEVICE_GEOMETRY[3].grid[7]).toEqual({ x: 373, y: 67, w: 38, h: 52 });
        expect(DEVICE_GEOMETRY[2].grid).toEqual([]);
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
            for (const stage of stagesOf(layout)) {
                const g = deviceGeometry(layout, 'eu', [], stage);
                for (const b of elements(g, stageCells(g, layout, stage)).flatMap(e => e.boxes)) {
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
            for (const stage of stagesOf(layout)) {
                const euG = deviceGeometry(layout, 'eu', [], stage);
                const uslG = deviceGeometry(layout, 'us-l', [], stage);
                const eu = elements(euG, euG.grid);
                const usl = elements(uslG, uslG.grid);
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
        expect(deviceGeometry(1, 'us-l', [], 1).slots[0]).toMatchObject({ icon: { x: 262, y: 76 } });
        expect(deviceGeometry(1, 'us-l', [], 2).slots[0]).toMatchObject({ icon: { x: 336, y: 76 } });
        expect(deviceGeometry(1, 'us-l').slots[0]).toMatchObject({ icon: { x: 141, y: 76 } });
        expect(deviceGeometry(2, 'us-l').extras).toEqual([]);
    });
});

describe('device page geometry: web-l', () => {
    const geometry = (layout: DeviceLayout, mask: number, stage: DeviceStage = 0): DeviceGeometry =>
        deviceGeometry(layout, 'web-l', additional(layout, mask), stage);
    const xs = (slots: readonly (SlotGeometry | undefined)[]): (number | undefined)[] =>
        slots.map(s => (s ? slotBoxes(s)[0].x : undefined));

    it('uses the content area x 8-632 of the 640 px stage', () => {
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const g = deviceGeometry(layout, 'web-l', v.extras, v.stage);
                const boxes = elements(g, stageCells(g, layout, v.stage)).flatMap(e => e.boxes);
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
                const g = deviceGeometry(layout, 'web-l', v.extras, v.stage);
                expect(g.status, v.name).toEqual({ x: 10, y: 289, w: 580, h: 30 });
                expect(g.statusAlign).toBe(1);
                expect(g.info, v.name).toEqual({ x: 594, y: 288, w: 36, h: 32 });
            }
        }
    });

    it('gives every filled additional slot a place of its kind, an empty one none', () => {
        for (const layout of LAYOUTS) {
            const kinds = DEVICE_EXTRA_KINDS[layout];
            expect(geometry(layout, 0).extras, `layout ${layout}`).toEqual(kinds.map(() => undefined));
            const full = geometry(layout, 0b111).extras;
            expect(full.map(s => s?.kind)).toEqual(kinds);
            for (let mask = 0; mask < 1 << kinds.length; mask++) {
                geometry(layout, mask).extras.forEach((s, j) => {
                    const at = `layout ${layout} mask ${mask} extra ${j + 1}`;
                    expect(s?.kind, at).toBe((mask >> j) & 1 ? kinds[j] : undefined);
                });
            }
        }
    });

    it('never makes a text box narrower than on eu - but the names of buttons side by side, by 4 px', () => {
        /** eu width of a field; the name of a button whose name field is inset (a dense row) may be 4 px less */
        const least = (s: SlotGeometry, field: string, eu: number): number =>
            s.kind === 'button' && field === 'name' && s.name.x > s.icon.x ? eu - 4 : eu;
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const web = deviceGeometry(layout, 'web-l', v.extras, v.stage);
                const eu = deviceGeometry(layout, 'eu', [], v.stage);
                // the grid of eu
                expect(web.grid, v.name).toEqual(eu.grid);
                expect(web.main.name.w).toBeGreaterThanOrEqual(eu.main.name.w);
                expect(web.main.icon).toEqual(eu.main.icon);
                expect(web.status.w).toBeGreaterThanOrEqual(eu.status.w);
                web.slots.forEach((s, i) => {
                    const own = eu.slots[i];
                    expect(s === undefined, `${v.name} slot ${i + 1}`).toBe(own === undefined);
                    if (!s || !own) {
                        return;
                    }
                    for (const [field, w] of Object.entries(textWidths(s))) {
                        expect(w, `${v.name} slot ${i + 1} ${field}`).toBeGreaterThanOrEqual(
                            least(s, field, textWidths(own)[field]),
                        );
                    }
                    // the same bytes as the set of the HMI
                    expect(slotBoxes(s).map(b => b.maxBytes)).toEqual(slotBoxes(own).map(b => b.maxBytes));
                });
                // an additional slot is as wide as a standard slot of its kind on the eu page
                web.extras.forEach((s, j) => {
                    if (!s) {
                        return;
                    }
                    const like = eu.slots.flatMap(e => (e && e.kind === s.kind ? [textWidths(e)] : []));
                    for (const [field, w] of Object.entries(textWidths(s))) {
                        expect(w, `${v.name} extra ${j + 1} ${field}`).toBeGreaterThanOrEqual(
                            least(s, field, Math.max(...like.map(l => l[field]))),
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

    it('cardDevice1: one row of 4, 5 or 6 buttons; info rows up to the right edge in the set of the stage', () => {
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
        // only the second additional button: it takes the fifth place, the row has five buttons - no hole
        expect(xs([...geometry(1, 0b10).slots.slice(2, 6), ...geometry(1, 0b10).extras])).toEqual([
            10,
            139,
            268,
            397,
            undefined,
            526,
        ]);
        expect(xs([...geometry(1, 0b11).slots.slice(2, 6), ...geometry(1, 0b11).extras])).toEqual([
            8, 112, 216, 320, 424, 528,
        ]);
        // six buttons stand side by side: the name field is 4 px narrower, 4 px between two names
        expect(geometry(1, 0b11).extras[1]).toEqual({
            kind: 'button',
            icon: { x: 528, y: 190, w: 104, h: 52 },
            name: { x: 530, y: 244, w: 100, h: 26 },
        });
        expect(geometry(1, 0b01).extras[0]).toEqual({
            kind: 'button',
            icon: { x: 526, y: 190, w: 104, h: 52 },
            name: { x: 526, y: 244, w: 104, h: 26 },
        });
        expect(geometry(1, 0, 0).slots[0]).toEqual({
            kind: 'info',
            icon: { x: 126, y: 76, w: 36, h: 34 },
            name: { x: 164, y: 80, w: 354, h: 26 },
            value: { x: 520, y: 80, w: 110, h: 26 },
        });
        // set B: the name up to the value, at most 15 bytes; set C: the value from the icon to the right edge, 19
        // bytes; stage 3: no info rows
        expect(geometry(1, 0, 1).slots[1]).toEqual({
            kind: 'info',
            icon: { x: 247, y: 120, w: 36, h: 34 },
            name: { x: 285, y: 124, w: 233, h: 26, maxBytes: 15 },
            value: { x: 520, y: 124, w: 110, h: 26 },
        });
        expect(geometry(1, 0, 2).slots[1]).toEqual({
            kind: 'info',
            icon: { x: 321, y: 120, w: 36, h: 34 },
            value: { x: 359, y: 124, w: 271, h: 26, maxBytes: 19 },
        });
        expect(geometry(1, 0, 3).slots.slice(0, 2)).toEqual([undefined, undefined]);
        // main and the grid are those of eu
        expect(geometry(1, 0b11, 3).main).toEqual(DEVICE_GEOMETRY[1].main);
        expect(geometry(1, 0b11, 3).grid).toEqual(DEVICE_GEOMETRY[1].grid);
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
        // side by side: names of 96 px, 4 px between them
        expect(full.slots[5]).toEqual({
            kind: 'button',
            icon: { x: 330, y: 67, w: 100, h: 50 },
            name: { x: 332, y: 119, w: 96, h: 26 },
        });
        expect(full.extras[2]).toMatchObject({ icon: { x: 530, w: 100 }, name: { x: 532, w: 96 } });
        // two buttons: standard and the first additional one
        const two = geometry(2, 0b010);
        expect(xs([two.slots[5], two.extras[1], two.extras[2]])).toEqual([430, 530, undefined]);
        expect(two.extras[0]).toBeUndefined();
        expect(two.extras[1]).toMatchObject({ icon: { x: 530, w: 100 }, name: { x: 532, w: 96 } });
        expect(two.slots[0]).toEqual(DEVICE_GEOMETRY[2].slots[0]);
        // two buttons, the second additional one: the same places, the big value does not move
        const other = geometry(2, 0b100);
        expect(xs([other.slots[5], other.extras[1], other.extras[2]])).toEqual([430, undefined, 530]);
        expect(other.slots[0]).toEqual(DEVICE_GEOMETRY[2].slots[0]);
        // one button: the box of eu at the right edge
        expect(plain.slots[5]).toEqual({
            kind: 'button',
            icon: { x: 530, y: 67, w: 100, h: 50 },
            name: { x: 530, y: 119, w: 100, h: 26 },
        });
    });

    it('cardDevice3: the info tiles in 2 columns, a third one for the additional ones; 2 or 3 switches in a row', () => {
        const plain = geometry(3, 0b000);
        expect(xs(plain.slots.slice(0, 6))).toEqual([114, 372, 114, 372, 114, 372]);
        expect(plain.slots.slice(0, 6).map(s => (s ? slotBoxes(s)[0].y : undefined))).toEqual([
            69, 69, 121, 121, 173, 173,
        ]);
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
        // only the second additional info: at the top of the third column, not below a hole
        const second = geometry(3, 0b010);
        expect(second.extras[0]).toBeUndefined();
        expect(second.extras[1]).toEqual(full.extras[0]);
    });
});

/** a box of the geometry file of the HMI tooling */
interface HmiBox {
    x: number;
    y: number;
    w: number;
    h: number;
    font?: number;
    align?: string;
    maxBytes?: number;
}

/** a set of components of an info row of cardDevice1 (B: icon, short name, the value of A; C: icon, value) */
interface HmiSet {
    icon: HmiBox;
    name?: HmiBox;
    value: HmiBox;
}

interface HmiSlot {
    slot: number;
    kind: string;
    icon?: HmiBox;
    name?: HmiBox;
    value?: HmiBox;
    bar?: HmiBox;
    toggle?: HmiBox;
    /** the hotspot of the HMI over the element */
    touch?: HmiBox;
    /** the sets of the info rows of cardDevice1 in the stages */
    sets?: Partial<Record<string, HmiSet>>;
}

interface HmiStage {
    stage: number;
    columns: number;
    infoSet: string | null;
    hiddenSlots: number[];
}

interface HmiPage {
    slotCount: number;
    statusWidth: number;
    main: { icon: HmiBox; name: HmiBox };
    slots: HmiSlot[];
    status: HmiBox;
    info: HmiBox;
    grid?: { rows: number; columns: number; cells: (HmiBox & { cell: number; column: number; row: number })[] };
    stages?: HmiStage[];
}

const HMI_MODELS = ['eu', 'us-l', 'us-p'] as const;
const HMI_ALIGN: Readonly<Record<string, NextionAlign>> = { left: 0, center: 1, right: 2 };

describe('device page geometry: the tables are the HMI pages (device-page-geometry.json)', () => {
    const page = (model: (typeof HMI_MODELS)[number], layout: DeviceLayout): HmiPage =>
        hmiGeometry[model].pages[`cardDevice${layout}`];

    /** position and size of a box of the file */
    const rect = (b: HmiBox): Box => ({ x: b.x, y: b.y, w: b.w, h: b.h });

    /** a box of the web panel with the font and alignment it is drawn with, in the terms of the file */
    function drawn(b: Box, style: BoxStyle): HmiBox {
        const align = b.align ?? style.align;
        const name = Object.keys(HMI_ALIGN).find(k => HMI_ALIGN[k] === align);
        return { x: b.x, y: b.y, w: b.w, h: b.h, font: b.font ?? style.font, align: name };
    }

    /** a text box of the file: position, size, font and alignment */
    const text = (b: HmiBox): HmiBox => ({ ...rect(b), font: b.font, align: b.align });

    function union(boxes: readonly Box[]): Box {
        const x = Math.min(...boxes.map(b => b.x));
        const y = Math.min(...boxes.map(b => b.y));
        return {
            x,
            y,
            w: Math.max(...boxes.map(b => b.x + b.w)) - x,
            h: Math.max(...boxes.map(b => b.y + b.h)) - y,
        };
    }

    /** compares a slot of the web panel with the boxes of the file */
    function expectSlot(slot: SlotGeometry | undefined, hmi: Omit<HmiSlot, 'slot' | 'kind'>, at: string): void {
        const pick = (b: HmiBox | undefined): HmiBox => {
            expect(b, at).toBeDefined();
            return b ?? { x: -1, y: -1, w: -1, h: -1 };
        };
        expect(slot, at).toBeDefined();
        switch (slot?.kind) {
            case 'info':
                expect(drawn(slot.icon, BOX_STYLES.info.icon), `${at} icon`).toEqual(text(pick(hmi.icon)));
                expect(slot.name && drawn(slot.name, BOX_STYLES.info.name), `${at} name`).toEqual(
                    hmi.name && text(hmi.name),
                );
                expect(drawn(slot.value, BOX_STYLES.info.value), `${at} value`).toEqual(text(pick(hmi.value)));
                break;
            case 'value':
                expect(drawn(slot.icon, BOX_STYLES.value.icon), `${at} icon`).toEqual(text(pick(hmi.icon)));
                expect(drawn(slot.name, BOX_STYLES.value.name), `${at} name`).toEqual(text(pick(hmi.name)));
                expect(drawn(slot.value, BOX_STYLES.value.value), `${at} value`).toEqual(text(pick(hmi.value)));
                break;
            case 'progress':
                expect(drawn(slot.name, BOX_STYLES.progress.name), `${at} name`).toEqual(text(pick(hmi.name)));
                expect(slot.bar, `${at} bar`).toEqual(rect(pick(hmi.bar)));
                break;
            case 'button':
                expect(drawn(slot.icon, BOX_STYLES.button.icon), `${at} icon`).toEqual(text(pick(hmi.icon)));
                expect(drawn(slot.name, BOX_STYLES.button.name), `${at} name`).toEqual(text(pick(hmi.name)));
                break;
            case 'switch':
                expect(drawn(slot.icon, BOX_STYLES.switch.icon), `${at} icon`).toEqual(text(pick(hmi.icon)));
                expect(drawn(slot.name, BOX_STYLES.switch.name), `${at} name`).toEqual(text(pick(hmi.name)));
                expect(slot.toggle, `${at} toggle`).toEqual(rect(pick(hmi.toggle)));
                break;
            default:
                break;
        }
    }

    it('has the three hardware models with the three pages', () => {
        expect(Object.keys(hmiGeometry)).toEqual([...HMI_MODELS]);
        for (const model of HMI_MODELS) {
            expect(hmiGeometry[model].stage).toEqual({ w: stageSize(model).width, h: stageSize(model).height });
            expect(Object.keys(hmiGeometry[model].pages)).toEqual(['cardDevice1', 'cardDevice2', 'cardDevice3']);
        }
        expect(hmiGeometry['us-l'].shiftX).toBe(US_L_SHIFT);
    });

    it('every box, font and alignment of eu, us-l and us-p is the one of the HMI page, in every stage', () => {
        for (const model of HMI_MODELS) {
            for (const layout of LAYOUTS) {
                const hmi = page(model, layout);
                const at = `${model} cardDevice${layout}`;
                const g = deviceGeometry(layout, model);
                expect(hmi.slotCount, at).toBe(DEVICE_SLOT_KINDS[layout].length);
                expect(
                    hmi.slots.map(s => s.kind),
                    at,
                ).toEqual(DEVICE_SLOT_KINDS[layout]);
                expect(
                    hmi.slots.map(s => s.slot),
                    at,
                ).toEqual(g.slots.map((_, i) => i + 1));
                expect(g.extras, at).toEqual([]);
                expect(drawn(g.main.icon, BOX_STYLES.main.icon), `${at} main icon`).toEqual(text(hmi.main.icon));
                expect(drawn(g.main.name, BOX_STYLES.main.name), `${at} main name`).toEqual(text(hmi.main.name));
                expect(
                    drawn(g.status, { font: BOX_STYLES.statusLine.font, align: g.statusAlign }),
                    `${at} status`,
                ).toEqual(text(hmi.status));
                expect(g.status.w, at).toBe(hmi.statusWidth);
                expect(drawn(g.info, BOX_STYLES.infoIcon), `${at} info`).toEqual(text(hmi.info));
                // the cells of the grid in the order of devIcons
                const cells = hmi.grid?.cells ?? [];
                expect(
                    g.grid.map(b => drawn(b, BOX_STYLES.cell)),
                    `${at} grid`,
                ).toEqual(cells.map(text));
                cells.forEach((c, i) => {
                    expect(c.cell, `${at} cell`).toBe(i + 1);
                    expect(c.column, `${at} cell ${i + 1}`).toBe(Math.floor(i / DEVICE_GRID_ROWS[layout]) + 1);
                });
                // the stages: columns, the set of the info rows, the slots the grid covers
                const stages = hmi.stages ?? [{ stage: 0, columns: 0, infoSet: null, hiddenSlots: [] }];
                expect(
                    stages.map(st => st.columns),
                    at,
                ).toEqual(DEVICE_STAGE_COLUMNS[layout]);
                for (const st of stages) {
                    const stage = stagesOf(layout)[st.stage];
                    const own = deviceGeometry(layout, model, [], stage);
                    const sat = `${at} stage ${stage}`;
                    const hidden = layout === 1 && st.infoSet === null ? [1, 2] : st.hiddenSlots;
                    expect(
                        DEVICE_STAGE_HIDDEN_SLOTS[layout][stage].map(i => i + 1),
                        `${sat} hidden`,
                    ).toEqual(hidden);
                    own.slots.forEach((slot, i) => {
                        if (hidden.includes(i + 1)) {
                            expect(slot, `${sat} slot ${i + 1}`).toBeUndefined();
                            return;
                        }
                        const set = st.infoSet && st.infoSet !== 'A' ? hmi.slots[i].sets?.[st.infoSet] : undefined;
                        expectSlot(slot, set ?? hmi.slots[i], `${sat} slot ${i + 1}`);
                        // the buffer of a set the HMI copies into
                        if (set && slot?.kind === 'info') {
                            expect(slot.name?.maxBytes, `${sat} name bytes`).toBe(
                                set.name && set.name.maxBytes !== 31 ? set.name.maxBytes : undefined,
                            );
                            expect(slot.value.maxBytes, `${sat} value bytes`).toBe(
                                set.value.maxBytes !== 31 ? set.value.maxBytes : undefined,
                            );
                        }
                    });
                }
            }
        }
    });

    it('the touch area of an element (the box around its texts) is the hotspot of the HMI', () => {
        let hotspots = 0;
        for (const model of HMI_MODELS) {
            for (const layout of LAYOUTS) {
                const hmi = page(model, layout);
                deviceGeometry(layout, model).slots.forEach((slot, i) => {
                    const touch = hmi.slots[i].touch;
                    if (!touch || !slot) {
                        return;
                    }
                    hotspots++;
                    // of a switch slot icon and name - the switch itself sends OnOff
                    const boxes = slot.kind === 'switch' ? [slot.icon, slot.name] : slotBoxes(slot);
                    expect(union(boxes), `${model} cardDevice${layout} slot ${i + 1}`).toEqual(rect(touch));
                });
            }
        }
        // value and progress of cardDevice2, the two switches of cardDevice3, on three models
        expect(hotspots).toBe(12);
    });

    it('eu and us-l have the sets B and C of cardDevice1, us-p only C (right of main)', () => {
        for (const model of HMI_MODELS) {
            const sets = page(model, 1).slots.map(s => Object.keys(s.sets ?? {}).sort());
            expect(sets, model).toEqual([
                model === 'us-p' ? ['C'] : ['B', 'C'],
                model === 'us-p' ? ['C'] : ['B', 'C'],
                [],
                [],
                [],
                [],
            ]);
        }
        expect(deviceGeometry(1, 'us-p', [], 1)).toEqual(deviceGeometry(1, 'us-p', [], 2));
    });
});

describe('device page geometry: us-p', () => {
    it('has the status line of 262 px and the content in x 10-309 of the 320 px display', () => {
        for (const layout of LAYOUTS) {
            const g = deviceGeometry(layout, 'us-p', additional(layout, 0b111), 1);
            expect(g.status).toEqual({ x: 10, y: 447, w: 262, h: 30 });
            expect(g.info).toEqual({ x: 274, y: 446, w: 36, h: 32 });
            expect(g.extras).toEqual([]);
            for (const b of elements(g, g.grid).flatMap(e => e.boxes)) {
                expect(b.x, `layout ${layout}`).toBeGreaterThanOrEqual(10);
                expect(b.x + b.w, `layout ${layout}`).toBeLessThanOrEqual(310);
            }
        }
    });
});

describe('device page geometry: web-p', () => {
    const geometry = (layout: DeviceLayout, mask: number, stage: DeviceStage = 0): DeviceGeometry =>
        deviceGeometry(layout, 'web-p', additional(layout, mask), stage);
    const usP = (layout: DeviceLayout, stage: DeviceStage = 0): DeviceGeometry =>
        deviceGeometry(layout, 'us-p', [], stage);
    const ys = (slots: readonly (SlotGeometry | undefined)[]): (number | undefined)[] =>
        slots.map(s => (s ? Math.min(...slotBoxes(s).map(b => b.y)) : undefined));
    const xs = (slots: readonly (SlotGeometry | undefined)[]): (number | undefined)[] =>
        slots.map(s => (s ? slotBoxes(s)[0].x : undefined));

    it('has the status line (262 px like us-p) and the info icon at the bottom of the 640 px stage', () => {
        expect(WEB_P_STATUS_WIDTH).toBe(262);
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const g = deviceGeometry(layout, 'web-p', v.extras, v.stage);
                expect(g.status, v.name).toEqual({ x: 10, y: 607, w: 262, h: 30 });
                expect(g.statusAlign).toBe(1);
                expect(g.info, v.name).toEqual({ x: 274, y: 606, w: 36, h: 32 });
                for (const b of elements(g, stageCells(g, layout, v.stage)).flatMap(e => e.boxes)) {
                    expect(b.x, v.name).toBeGreaterThanOrEqual(10);
                    expect(b.x + b.w, v.name).toBeLessThanOrEqual(310);
                }
            }
        }
    });

    it('stacks rows from the top to the status line: group gaps twice the row gaps', () => {
        // 607 - 100 - 3 * 100 = 207 free, weights 1 + 1 + 2 (status line) = 4
        expect(
            stack(100, [
                { h: 100, gap: 0 },
                { h: 100, gap: 1 },
                { h: 100, gap: 1 },
            ]),
        ).toEqual([100, 252, 404]);
        // one group gap in front of the second row
        expect(
            stack(107, [
                { h: 100, gap: 0 },
                { h: 100, gap: 2 },
            ]),
        ).toEqual([107, 357]);
    });

    it('gives every filled additional slot a place of its kind, an empty one none', () => {
        for (const layout of LAYOUTS) {
            const kinds = DEVICE_EXTRA_KINDS[layout];
            expect(geometry(layout, 0).extras, `layout ${layout}`).toEqual(kinds.map(() => undefined));
            expect(geometry(layout, 0b111).extras.map(s => s?.kind)).toEqual(kinds);
            for (let mask = 0; mask < 1 << kinds.length; mask++) {
                geometry(layout, mask).extras.forEach((s, j) => {
                    const at = `layout ${layout} mask ${mask} extra ${j + 1}`;
                    expect(s?.kind, at).toBe((mask >> j) & 1 ? kinds[j] : undefined);
                });
            }
        }
    });

    it('draws every element with the size it has on us-p - only the buttons of cardDevice2 share their row', () => {
        const size = (b: Box): { w: number; h: number } => ({ w: b.w, h: b.h });
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const hmi = usP(layout, v.stage);
                const web = deviceGeometry(layout, 'web-p', v.extras, v.stage);
                const at = `${v.name}`;
                // the cells of the grid
                expect(web.grid.map(size), at).toEqual(hmi.grid.map(size));
                if (layout !== 1 || v.stage === 1 || v.stage === 2) {
                    expect(size(web.main.icon), at).toEqual(size(hmi.main.icon));
                    expect(size(web.main.name), at).toEqual(size(hmi.main.name));
                } else {
                    // cardDevice1 with nothing beside main (stages 0 and 3): main in the middle, its name over the width
                    expect(web.main.icon, at).toMatchObject({ x: 85, w: 150, h: 86 });
                    expect(web.main.name, at).toMatchObject({ x: 10, w: 300, h: 26 });
                }
                const all = [...web.slots, ...web.extras];
                all.forEach((slot, i) => {
                    if (!slot) {
                        expect(i < hmi.slots.length ? hmi.slots[i] : undefined, `${at} ${i}`).toBeUndefined();
                        return;
                    }
                    // an additional slot is drawn like the last standard slot of its kind
                    const like =
                        i < hmi.slots.length
                            ? hmi.slots[i]
                            : hmi.slots.filter(s => s !== undefined && s.kind === slot.kind).pop();
                    expect(like, `${at} ${i}`).toBeDefined();
                    if (!like) {
                        return;
                    }
                    if (layout === 2 && slot.kind === 'button') {
                        // 1 button 300 px like us-p, 2 share the width (148), 3 have the 100 px of eu (their
                        // names 96 px, they stand side by side)
                        const w = slotBoxes(slot)[0].w;
                        expect([300, 148, 100], `${at} ${i}`).toContain(w);
                        expect(slot.name.w, `${at} ${i}`).toBe(w === 100 ? 96 : w);
                        expect(slotBoxes(slot).map(b => b.h)).toEqual(slotBoxes(like).map(b => b.h));
                        return;
                    }
                    expect(slotBoxes(slot).map(size), `${at} ${i}`).toEqual(slotBoxes(like).map(size));
                });
            }
        }
    });

    it('cardDevice1: 2 or 3 rows of two buttons; without additional buttons the rows share the height', () => {
        const full = geometry(1, 0b11);
        expect(xs([...full.slots.slice(2, 6), ...full.extras])).toEqual([10, 162, 10, 162, 10, 162]);
        expect(ys([full.slots[0], full.slots[1]])).toEqual([210, 256]);
        expect(ys([...full.slots.slice(2, 6), ...full.extras])).toEqual([316, 316, 409, 409, 501, 501]);
        expect(full.extras[1]).toEqual({
            kind: 'button',
            icon: { x: 162, y: 501, w: 148, h: 52 },
            name: { x: 162, y: 555, w: 148, h: 26 },
        });
        // stage 0: main in the middle, the info rows below it (set A)
        expect(full.main).toEqual({ icon: { x: 85, y: 70, w: 150, h: 86 }, name: { x: 10, y: 158, w: 300, h: 26 } });
        // only one additional button, the first or the second: the third row with one button at the left
        expect(xs(geometry(1, 0b01).extras)).toEqual([10, undefined]);
        expect(ys(geometry(1, 0b01).extras)).toEqual([501, undefined]);
        expect(xs(geometry(1, 0b10).extras)).toEqual([undefined, 10]);
        expect(ys(geometry(1, 0b10).extras)).toEqual([undefined, 501]);
        const plain = geometry(1, 0b00);
        expect(plain.extras).toEqual([undefined, undefined]);
        expect(ys(plain.slots.slice(0, 6))).toEqual([233, 291, 374, 374, 478, 478]);
        // the last row ends two gaps above the status line
        expect(478 + 80).toBeLessThan(plain.status.y);
    });

    it('cardDevice1 in the stages: main left with set C beside it (1, 2), in the middle without (0, 3)', () => {
        for (const stage of [1, 2] as const) {
            const g = geometry(1, 0b11, stage);
            // main and set C like us-p (both start at y 70)
            expect(g.main, `stage ${stage}`).toEqual(usP(1, stage).main);
            expect(g.slots.slice(0, 2), `stage ${stage}`).toEqual(usP(1, stage).slots.slice(0, 2));
        }
        expect(geometry(1, 0b11, 3).main).toEqual(geometry(1, 0b11, 0).main);
        expect(geometry(1, 0b11, 3).slots.slice(0, 2)).toEqual([undefined, undefined]);
        // from stage 1 on the grid (8 x 2 cells of 38 x 41 over the width) stands below main, then the buttons
        for (const stage of [1, 2, 3] as const) {
            const g = geometry(1, 0b11, stage);
            expect(g.grid[0], `stage ${stage}`).toEqual({ x: 10, y: 210, w: 38, h: 41 });
            expect(g.grid[15], `stage ${stage}`).toEqual({ x: 269, y: 250, w: 38, h: 41 });
            expect(ys([...g.slots.slice(2, 6), ...g.extras]), `stage ${stage}`).toEqual([316, 316, 409, 409, 502, 502]);
        }
    });

    it('cardDevice2: 3 or 4 info rows, one row of 1-3 buttons', () => {
        const full = geometry(2, 0b111);
        expect(full.main).toEqual(usP(2).main);
        expect(full.slots[0]).toEqual(usP(2).slots[0]);
        expect(ys([full.slots[1], full.slots[2], full.slots[3], full.slots[4], full.extras[0]])).toEqual([
            209, 282, 332, 381, 431,
        ]);
        expect(full.extras[0]).toEqual({
            kind: 'info',
            icon: { x: 10, y: 431, w: 36, h: 34 },
            name: { x: 48, y: 435, w: 156, h: 26 },
            value: { x: 206, y: 435, w: 104, h: 26 },
        });
        expect(xs([full.slots[5], full.extras[1], full.extras[2]])).toEqual([10, 110, 210]);
        // three buttons stand side by side: names of 96 px, 4 px between them
        expect(full.extras[2]).toEqual({
            kind: 'button',
            icon: { x: 210, y: 496, w: 100, h: 52 },
            name: { x: 212, y: 550, w: 96, h: 26 },
        });
        expect(full.slots[5]).toMatchObject({ icon: { x: 10, w: 100 }, name: { x: 12, w: 96 } });
        const two = geometry(2, 0b010);
        expect(xs([two.slots[5], two.extras[1], two.extras[2]])).toEqual([10, 162, undefined]);
        expect(two.extras[1]).toMatchObject({ icon: { w: 148 }, name: { x: 162, w: 148 } });
        // the second additional button alone takes the place of the first
        const other = geometry(2, 0b100);
        expect(xs([other.slots[5], other.extras[1], other.extras[2]])).toEqual([10, undefined, 162]);
        expect(other.extras[2]).toEqual(two.extras[1]);
        const plain = geometry(2, 0b000);
        expect(plain.extras).toEqual([undefined, undefined, undefined]);
        expect(plain.slots[5]).toMatchObject({ icon: { x: 10, w: 300 }, name: { x: 10, w: 300 } });
        expect(ys(plain.slots.slice(1))).toEqual([219, 302, 357, 411, 486]);
    });

    it('cardDevice3: 3 or 4 rows of two info tiles, 2 or 3 switch rows', () => {
        const full = geometry(3, 0b111);
        // main like us-p, at the top of the web-p stack: the us-p HMI has it 1 px lower (y 68, off its hidden
        // debug area mSpecial - the web panel has no such area)
        expect(full.main).toEqual({ icon: { x: 85, y: 67, w: 150, h: 82 }, name: { x: 10, y: 151, w: 300, h: 26 } });
        expect(usP(3).main).toEqual({ icon: { x: 85, y: 68, w: 150, h: 82 }, name: { x: 10, y: 152, w: 300, h: 26 } });
        expect(xs([...full.slots.slice(0, 6), full.extras[0], full.extras[1]])).toEqual([
            10, 162, 10, 162, 10, 162, 10, 162,
        ]);
        expect(ys([...full.slots.slice(0, 6), full.extras[0], full.extras[1]])).toEqual([
            191, 191, 249, 249, 307, 307, 365, 365,
        ]);
        expect(ys([full.slots[6], full.slots[7], full.extras[2]])).toEqual([429, 486, 543]);
        expect(full.extras[2]).toEqual({
            kind: 'switch',
            icon: { x: 10, y: 551, w: 34, h: 34 },
            name: { x: 46, y: 555, w: 212, h: 26 },
            toggle: { x: 260, y: 543, w: 50, h: 50 },
        });
        const plain = geometry(3, 0b000);
        expect(plain.extras).toEqual([undefined, undefined, undefined]);
        expect(ys(plain.slots)).toEqual([216, 216, 287, 287, 358, 358, 448, 518]);
        // only the additional switch: three info rows, three switch rows
        const onlySwitch = geometry(3, 0b100);
        expect(onlySwitch.extras.slice(0, 2)).toEqual([undefined, undefined]);
        expect(onlySwitch.extras[2]?.kind).toBe('switch');
        // only the second additional info: at the left of the fourth row
        const second = geometry(3, 0b010);
        expect(second.extras[0]).toBeUndefined();
        expect(second.extras[1]).toEqual(geometry(3, 0b001).extras[0]);
        expect(xs([second.extras[1]])).toEqual([10]);
    });
});
