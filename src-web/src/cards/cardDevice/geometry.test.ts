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
    DEVICE_SLOT_KINDS,
    deviceExtraKinds,
    deviceGeometry,
    slotBoxes,
    statusBlockVisible,
    type Box,
    type BoxStyle,
    type DeviceGeometry,
    type DeviceLayout,
    type SlotGeometry,
} from './layout';
import hmiGeometry from '../../../../doc/ideas/device-details/device-page-geometry.json';

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
        for (const model of PANEL_MODELS) {
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

    it('never makes a text box narrower than on eu (more elements, not more text)', () => {
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

/** a box of the geometry file of the HMI tooling */
interface HmiBox {
    x: number;
    y: number;
    w: number;
    h: number;
    font?: number;
    align?: string;
}

interface HmiSlot {
    slot: number;
    kind: string;
    icon?: HmiBox;
    name?: HmiBox;
    value?: HmiBox;
    bar?: HmiBox;
    toggle?: HmiBox;
    cell?: HmiBox;
    /** the hotspot of the HMI over the element */
    touch?: HmiBox;
    /** the second set of components next to a visible status block */
    narrow?: { icon: HmiBox; name: HmiBox; value: HmiBox };
}

interface HmiPage {
    slotCount: number;
    statusWidth: number;
    main: { icon: HmiBox; name: HmiBox };
    slots: HmiSlot[];
    status: HmiBox;
    info: HmiBox;
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
    function expectSlot(slot: SlotGeometry, hmi: Omit<HmiSlot, 'slot' | 'kind'>, at: string): void {
        const pick = (b: HmiBox | undefined): HmiBox => {
            expect(b, at).toBeDefined();
            return b ?? { x: -1, y: -1, w: -1, h: -1 };
        };
        switch (slot.kind) {
            case 'info':
            case 'value':
                expect(drawn(slot.icon, BOX_STYLES[slot.kind].icon), `${at} icon`).toEqual(text(pick(hmi.icon)));
                expect(drawn(slot.name, BOX_STYLES[slot.kind].name), `${at} name`).toEqual(text(pick(hmi.name)));
                expect(drawn(slot.value, BOX_STYLES[slot.kind].value), `${at} value`).toEqual(text(pick(hmi.value)));
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
            case 'status':
                expect(drawn(slot.cell, BOX_STYLES.status.cell), `${at} cell`).toEqual(text(pick(hmi.cell)));
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

    it('every box, font and alignment of eu, us-l and us-p is the one of the HMI page', () => {
        for (const model of HMI_MODELS) {
            for (const layout of LAYOUTS) {
                const hmi = page(model, layout);
                const at = `${model} cardDevice${layout}`;
                // without status icons: the first set of components
                const g = deviceGeometry(layout, standard(layout, false), model);
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
                g.slots.forEach((slot, i) => expectSlot(slot, hmi.slots[i], `${at} slot ${i + 1}`));
                // with status icons: the narrow set where the page has one, else the same boxes
                const withIcons = deviceGeometry(layout, standard(layout, true), model);
                withIcons.slots.forEach((slot, i) =>
                    expectSlot(slot, hmi.slots[i].narrow ?? hmi.slots[i], `${at} slot ${i + 1} with status icons`),
                );
            }
        }
    });

    it('the touch area of an element (the box around its texts) is the hotspot of the HMI', () => {
        let hotspots = 0;
        for (const model of HMI_MODELS) {
            for (const layout of LAYOUTS) {
                const hmi = page(model, layout);
                deviceGeometry(layout, standard(layout, false), model).slots.forEach((slot, i) => {
                    const touch = hmi.slots[i].touch;
                    if (!touch) {
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

    it('only eu and us-l have the narrow info rows of cardDevice1; us-p keeps its rows below main', () => {
        for (const model of HMI_MODELS) {
            const narrow = page(model, 1)
                .slots.filter(s => s.narrow !== undefined)
                .map(s => s.slot);
            expect(narrow, model).toEqual(model === 'us-p' ? [] : [1, 2]);
        }
        expect(deviceGeometry(1, standard(1, true), 'us-p')).toBe(deviceGeometry(1, standard(1, false), 'us-p'));
    });
});

describe('device page geometry: us-p', () => {
    it('has the status line of 262 px and the content in x 10-309 of the 320 px display', () => {
        for (const layout of LAYOUTS) {
            const g = deviceGeometry(layout, standard(layout, true), 'us-p', additional(layout, 0b111));
            expect(g.status).toEqual({ x: 10, y: 447, w: 262, h: 30 });
            expect(g.info).toEqual({ x: 274, y: 446, w: 36, h: 32 });
            expect(g.extras).toEqual([]);
            for (const b of elements(g).flatMap(e => e.boxes)) {
                expect(b.x, `layout ${layout}`).toBeGreaterThanOrEqual(10);
                expect(b.x + b.w, `layout ${layout}`).toBeLessThanOrEqual(310);
            }
        }
    });
});

describe('device page geometry: web-p', () => {
    const geometry = (layout: DeviceLayout, mask: number, statusIcons = true): DeviceGeometry =>
        deviceGeometry(layout, standard(layout, statusIcons), 'web-p', additional(layout, mask));
    const usP = (layout: DeviceLayout): DeviceGeometry => deviceGeometry(layout, standard(layout, true), 'us-p');
    const ys = (slots: readonly (SlotGeometry | undefined)[]): (number | undefined)[] =>
        slots.map(s => (s ? Math.min(...slotBoxes(s).map(b => b.y)) : undefined));
    const xs = (slots: readonly (SlotGeometry | undefined)[]): (number | undefined)[] =>
        slots.map(s => (s ? slotBoxes(s)[0].x : undefined));

    it('has the status line (262 px like us-p) and the info icon at the bottom of the 640 px stage', () => {
        expect(WEB_P_STATUS_WIDTH).toBe(262);
        for (const layout of LAYOUTS) {
            for (const v of variants(layout)) {
                const g = deviceGeometry(layout, v.slots, 'web-p', v.extras);
                expect(g.status, v.name).toEqual({ x: 10, y: 607, w: 262, h: 30 });
                expect(g.statusAlign).toBe(1);
                expect(g.info, v.name).toEqual({ x: 274, y: 606, w: 36, h: 32 });
                for (const b of elements(g).flatMap(e => e.boxes)) {
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

    it('gives every filled additional slot a place of its kind, an empty one at the end none', () => {
        for (const layout of LAYOUTS) {
            const kinds = DEVICE_EXTRA_KINDS[layout];
            expect(geometry(layout, 0).extras, `layout ${layout}`).toEqual(kinds.map(() => undefined));
            expect(geometry(layout, 0b111).extras.map(s => s?.kind)).toEqual(kinds);
            for (let mask = 0; mask < 1 << kinds.length; mask++) {
                geometry(layout, mask).extras.forEach((s, j) => {
                    if ((mask >> j) & 1) {
                        expect(s?.kind, `layout ${layout} mask ${mask} extra ${j + 1}`).toBe(kinds[j]);
                    }
                });
            }
        }
    });

    it('draws every element with the size it has on us-p - only the buttons of cardDevice2 share their row', () => {
        const size = (b: Box): { w: number; h: number } => ({ w: b.w, h: b.h });
        for (const layout of LAYOUTS) {
            const hmi = usP(layout);
            for (const v of variants(layout)) {
                const web = deviceGeometry(layout, v.slots, 'web-p', v.extras);
                const at = `${v.name}`;
                if (statusBlockVisible(layout, v.slots) || layout !== 1) {
                    expect(size(web.main.icon), at).toEqual(size(hmi.main.icon));
                    expect(size(web.main.name), at).toEqual(size(hmi.main.name));
                } else {
                    // cardDevice1 without status icons: main in the middle, its name over the width
                    expect(web.main.icon, at).toMatchObject({ x: 85, w: 150, h: 86 });
                    expect(web.main.name, at).toMatchObject({ x: 10, w: 300, h: 26 });
                }
                const all = [...web.slots, ...web.extras];
                all.forEach((slot, i) => {
                    if (!slot) {
                        return;
                    }
                    // an additional slot is drawn like the last standard slot of its kind
                    const like =
                        i < hmi.slots.length ? hmi.slots[i] : hmi.slots.filter(s => s.kind === slot.kind).pop();
                    expect(like, `${at} ${i}`).toBeDefined();
                    if (!like) {
                        return;
                    }
                    if (layout === 2 && slot.kind === 'button') {
                        // 1 button 300 px like us-p, 2 share the width (148), 3 have the 100 px of eu
                        const w = slotBoxes(slot)[0].w;
                        expect([300, 148, 100], `${at} ${i}`).toContain(w);
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
        // the status block stands right of main, like on us-p
        expect(full.main).toEqual(usP(1).main);
        expect(full.slots.slice(6)).toEqual(usP(1).slots.slice(6));
        // only the first additional button: the third row with one button
        expect(xs(geometry(1, 0b01).extras)).toEqual([10, undefined]);
        expect(ys(geometry(1, 0b01).extras)).toEqual([501, undefined]);
        const plain = geometry(1, 0b00);
        expect(plain.extras).toEqual([undefined, undefined]);
        expect(ys(plain.slots.slice(0, 6))).toEqual([233, 291, 374, 374, 478, 478]);
        // the last row ends two gaps above the status line
        expect(478 + 80).toBeLessThan(plain.status.y);
    });

    it('cardDevice1 without status icons: main in the middle', () => {
        const g = geometry(1, 0b11, false);
        expect(g.main).toEqual({ icon: { x: 85, y: 70, w: 150, h: 86 }, name: { x: 10, y: 158, w: 300, h: 26 } });
        expect(geometry(1, 0b11, true).main.icon).toEqual({ x: 10, y: 70, w: 150, h: 86 });
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
        expect(full.extras[2]).toEqual({
            kind: 'button',
            icon: { x: 210, y: 496, w: 100, h: 52 },
            name: { x: 210, y: 550, w: 100, h: 26 },
        });
        const two = geometry(2, 0b010);
        expect(xs([two.slots[5], two.extras[1], two.extras[2]])).toEqual([10, 162, undefined]);
        expect(two.extras[1]).toMatchObject({ icon: { w: 148 }, name: { w: 148 } });
        const plain = geometry(2, 0b000);
        expect(plain.extras).toEqual([undefined, undefined, undefined]);
        expect(plain.slots[5]).toMatchObject({ icon: { x: 10, w: 300 }, name: { x: 10, w: 300 } });
        expect(ys(plain.slots.slice(1))).toEqual([219, 302, 357, 411, 486]);
    });

    it('cardDevice3: 3 or 4 rows of two info tiles, 2 or 3 switch rows', () => {
        const full = geometry(3, 0b111);
        expect(full.main).toEqual(usP(3).main);
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
    });
});
