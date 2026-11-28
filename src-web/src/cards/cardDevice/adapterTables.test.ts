// the adapter table file uses the global ioBroker types (root node_modules)
/// <reference types="@iobroker/types" />
import { describe, expect, it } from 'vitest';
import {
    DEVICE_PAGE_EXTRA_SLOTS,
    DEVICE_PAGE_FIELDS_WEB_L,
    DEVICE_PAGE_FIELDS_WEB_P,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_STAGE_CAPACITY,
    DEVICE_PAGE_STAGE_HIDDEN_SLOTS,
    DEVICE_PAGE_STATUS_SLOTS,
    devicePageSlotFields,
    type DevicePageSlotFields,
} from '../../../../src/lib/types/deviceDetails';
import type { Entity6 } from '../../protocol/types';
import {
    DEVICE_EXTRA_KINDS,
    DEVICE_GRID_CELLS,
    DEVICE_GRID_ROWS,
    DEVICE_SLOT_KINDS,
    DEVICE_STAGE_COLUMNS,
    DEVICE_STAGE_HIDDEN_SLOTS,
    isDeviceStage,
    type DeviceLayout,
    type DeviceSlotKind,
    type DeviceStage,
} from './geometry';
import { deviceExtraKinds, deviceGeometry } from './layout';

/*
 * The adapter and the web panel each keep their own copy of some tables of the device pages (the web bundle must
 * not pull in the adapter, the adapter not the web panel): the kinds of the slots and of the additional slots of
 * the web models, the status icon grid with its stages, and the widths of the text fields on web-l / web-p. This
 * test is the guard that both stay the same - like `geometry.test.ts` does for the hardware models against the
 * geometry file of the HMI.
 */

const LAYOUTS: readonly DeviceLayout[] = [1, 2, 3];
const WEB_MODELS = ['web-l', 'web-p'] as const;
const ADAPTER_FIELDS = { 'web-l': DEVICE_PAGE_FIELDS_WEB_L, 'web-p': DEVICE_PAGE_FIELDS_WEB_P } as const;

const filled = (id: string): Entity6 => ({
    type: 'text',
    id,
    icon: 'I',
    iconColor: 65_535,
    displayName: 'Name',
    optionalValue: '1',
});
const empty: Entity6 = { type: '', id: '', icon: '', iconColor: 0, displayName: '', optionalValue: '' };

/**
 * The stages of a page.
 *
 * @param layout the page
 */
function stages(layout: DeviceLayout): DeviceStage[] {
    return DEVICE_STAGE_COLUMNS[layout].map((_c, i) => i).filter(isDeviceStage);
}

/**
 * Every combination of filled additional slots of a page.
 *
 * @param layout the page
 */
function masks(layout: DeviceLayout): Entity6[][] {
    const extraCount = DEVICE_EXTRA_KINDS[layout].length;
    const result: Entity6[][] = [];
    for (let mask = 0; mask < 1 << extraCount; mask++) {
        result.push(Array.from({ length: extraCount }, (_v, k) => (mask & (1 << k) ? filled(`x${k}`) : empty)));
    }
    return result;
}

type Widths = { mainName: number; status: number; slots: Partial<Record<DeviceSlotKind, DevicePageSlotFields>> };

/**
 * The narrowest text fields of a page in one stage over all combinations of additional slots, in the form of the
 * adapter table: name and value per kind of slot (the bar of a progress slot has the width of its name, an info row
 * without name has name 0). Slots the stage hides do not count.
 *
 * @param layout the page
 * @param model the web model
 * @param stage the stage
 */
function narrowest(layout: DeviceLayout, model: (typeof WEB_MODELS)[number], stage: DeviceStage): Widths {
    const result: Widths = { mainName: Number.POSITIVE_INFINITY, status: Number.POSITIVE_INFINITY, slots: {} };
    const take = (kind: DeviceSlotKind, name: number, value?: number): void => {
        const known = result.slots[kind];
        const fields: DevicePageSlotFields = { name: Math.min(known?.name ?? name, name) };
        if (value !== undefined) {
            fields.value = Math.min(known?.value ?? value, value);
        }
        result.slots[kind] = fields;
    };
    for (const extras of masks(layout)) {
        const g = deviceGeometry(layout, model, extras, stage);
        result.mainName = Math.min(result.mainName, g.main.name.w);
        result.status = Math.min(result.status, g.status.w);
        for (const slot of [...g.slots, ...g.extras]) {
            if (slot === undefined) {
                continue;
            }
            if (slot.kind === 'info') {
                take(slot.kind, slot.name?.w ?? 0, slot.value.w);
            } else if (slot.kind === 'value') {
                take(slot.kind, slot.name.w, slot.value.w);
            } else {
                take(slot.kind, slot.name.w);
            }
            if (slot.kind === 'progress') {
                expect(slot.bar.w, `${model} ${layout} bar`).toBe(slot.name.w);
            }
        }
    }
    return result;
}

/**
 * The widths of an adapter table without the font of the value (the web panel has it in `BOX_STYLES`).
 *
 * @param slots the fields per kind of the adapter
 */
function widthsOf(
    slots: Partial<Record<string, DevicePageSlotFields>> | undefined,
): Partial<Record<DeviceSlotKind, DevicePageSlotFields>> {
    const result: Partial<Record<DeviceSlotKind, DevicePageSlotFields>> = {};
    for (const kind of Object.keys(slots ?? {}) as DeviceSlotKind[]) {
        const own = slots?.[kind];
        if (own) {
            result[kind] = own.value === undefined ? { name: own.name } : { name: own.name, value: own.value };
        }
    }
    return result;
}

describe('cardDevice: the tables of the adapter and of the web panel are the same', () => {
    it('kinds of the slots and of the additional slots (DEVICE_PAGE_LAYOUTS / DEVICE_PAGE_EXTRA_SLOTS)', () => {
        expect(Object.keys(DEVICE_SLOT_KINDS)).toEqual(Object.keys(DEVICE_PAGE_LAYOUTS));
        expect(Object.keys(DEVICE_EXTRA_KINDS)).toEqual(Object.keys(DEVICE_PAGE_EXTRA_SLOTS));
        for (const layout of LAYOUTS) {
            expect(DEVICE_SLOT_KINDS[layout], `cardDevice${layout} slots`).toEqual(DEVICE_PAGE_LAYOUTS[layout]);
            expect(DEVICE_EXTRA_KINDS[layout], `cardDevice${layout} extras`).toEqual(DEVICE_PAGE_EXTRA_SLOTS[layout]);
            for (const model of WEB_MODELS) {
                expect(deviceExtraKinds(layout, model), `${model} ${layout}`).toEqual(DEVICE_PAGE_EXTRA_SLOTS[layout]);
            }
        }
    });

    it('the status icon grid: cells, stages, places per stage and the slots a stage covers', () => {
        for (const layout of LAYOUTS) {
            const at = `cardDevice${layout}`;
            expect(DEVICE_GRID_CELLS[layout], at).toBe(DEVICE_PAGE_STATUS_SLOTS[layout]);
            expect(
                DEVICE_STAGE_COLUMNS[layout].map(columns => columns * DEVICE_GRID_ROWS[layout]),
                at,
            ).toEqual(DEVICE_PAGE_STAGE_CAPACITY[layout]);
            expect(DEVICE_STAGE_HIDDEN_SLOTS[layout], at).toEqual(DEVICE_PAGE_STAGE_HIDDEN_SLOTS[layout]);
        }
    });

    for (const model of WEB_MODELS) {
        for (const layout of LAYOUTS) {
            it(`${model} cardDevice${layout}: the field widths of the adapter are the narrowest boxes of the web layout`, () => {
                const adapter = ADAPTER_FIELDS[model][layout];
                const all = stages(layout).map(stage => narrowest(layout, model, stage));
                const plain = all[0];
                // one status line and one name of main per page: the narrowest of all stages and cases
                expect(adapter.status, 'status').toBe(Math.min(...all.map(w => w.status)));
                expect(adapter.mainName, 'mainName').toBe(Math.min(...all.map(w => w.mainName)));
                // every kind of the page (and of its additional slots) has its fields
                expect(widthsOf(adapter.slots), 'slots').toEqual(plain.slots);
                // per stage: the kinds whose fields change - and devicePageSlotFields gives them
                for (const stage of stages(layout).slice(1)) {
                    const own = narrowest(layout, model, stage);
                    const changed: Partial<Record<DeviceSlotKind, DevicePageSlotFields>> = {};
                    for (const kind of Object.keys(own.slots) as DeviceSlotKind[]) {
                        if (JSON.stringify(own.slots[kind]) !== JSON.stringify(plain.slots[kind])) {
                            changed[kind] = own.slots[kind];
                        }
                        const fields = devicePageSlotFields(layout, kind, stage, model);
                        expect(widthsOf({ [kind]: fields }), `${kind} stage ${stage}`).toEqual({
                            [kind]: own.slots[kind],
                        });
                    }
                    expect(widthsOf(adapter.slotsByStage?.[stage]), `slotsByStage ${stage}`).toEqual(changed);
                }
            });
        }
    }
});
