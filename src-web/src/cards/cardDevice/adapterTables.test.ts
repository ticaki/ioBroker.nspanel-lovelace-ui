// the adapter table file uses the global ioBroker types (root node_modules)
/// <reference types="@iobroker/types" />
import { describe, expect, it } from 'vitest';
import {
    DEVICE_PAGE_EXTRA_SLOTS,
    DEVICE_PAGE_FIELDS_WEB_L,
    DEVICE_PAGE_FIELDS_WEB_P,
    DEVICE_PAGE_LAYOUTS,
    type DevicePageLayoutFields,
    type DevicePageSlotFields,
} from '../../../../src/lib/types/deviceDetails';
import type { Entity6 } from '../../protocol/types';
import { DEVICE_EXTRA_KINDS, DEVICE_SLOT_KINDS, type DeviceLayout, type DeviceSlotKind } from './geometry';
import { deviceExtraKinds, deviceGeometry } from './layout';

/*
 * The adapter and the web panel each keep their own copy of two tables of the device pages (the web bundle must
 * not pull in the adapter, the adapter not the web panel): the kinds of the slots and of the additional slots of
 * the web models, and the widths of the text fields on web-l / web-p. This test is the guard that both stay the
 * same - like `geometry.test.ts` does for the hardware models against the geometry file of the HMI.
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
 * Every case a page can be laid out for: each combination of filled additional slots, with and without the
 * status block (only cardDevice1 has status slots).
 *
 * @param layout the page
 */
function cases(layout: DeviceLayout): { slots: Entity6[]; extras: Entity6[]; withStatus: boolean }[] {
    const kinds = DEVICE_SLOT_KINDS[layout];
    const extraCount = DEVICE_EXTRA_KINDS[layout].length;
    const hasStatus = kinds.includes('status');
    const result: { slots: Entity6[]; extras: Entity6[]; withStatus: boolean }[] = [];
    for (const withStatus of hasStatus ? [false, true] : [false]) {
        const slots = kinds.map((kind, i) => (kind === 'status' && !withStatus ? empty : filled(`s${i}`)));
        for (let mask = 0; mask < 1 << extraCount; mask++) {
            const extras = Array.from({ length: extraCount }, (_v, k) => (mask & (1 << k) ? filled(`x${k}`) : empty));
            result.push({ slots, extras, withStatus });
        }
    }
    return result;
}

type Widths = { mainName: number; status: number; slots: Partial<Record<DeviceSlotKind, DevicePageSlotFields>> };

/**
 * The narrowest text fields of a page over all cases with or without the status block, in the form of the
 * adapter table: name and value per kind of slot (the bar of a progress slot has the width of its name).
 *
 * @param layout the page
 * @param model the web model
 * @param withStatus cases with (true) or without (false) the status block
 */
function narrowest(layout: DeviceLayout, model: (typeof WEB_MODELS)[number], withStatus: boolean): Widths {
    const result: Widths = { mainName: Number.POSITIVE_INFINITY, status: Number.POSITIVE_INFINITY, slots: {} };
    const take = (kind: DeviceSlotKind, name: number, value?: number): void => {
        const known = result.slots[kind];
        const fields: DevicePageSlotFields = { name: Math.min(known?.name ?? name, name) };
        if (value !== undefined) {
            fields.value = Math.min(known?.value ?? value, value);
        }
        result.slots[kind] = fields;
    };
    for (const c of cases(layout).filter(c => c.withStatus === withStatus)) {
        const g = deviceGeometry(layout, c.slots, model, c.extras);
        result.mainName = Math.min(result.mainName, g.main.name.w);
        result.status = Math.min(result.status, g.status.w);
        for (const slot of [...g.slots, ...g.extras]) {
            if (slot === undefined || slot.kind === 'status') {
                continue;
            }
            if (slot.kind === 'info' || slot.kind === 'value') {
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
function widthsOf(slots: DevicePageLayoutFields['slots']): Partial<Record<DeviceSlotKind, DevicePageSlotFields>> {
    const result: Partial<Record<DeviceSlotKind, DevicePageSlotFields>> = {};
    for (const kind of Object.keys(slots) as DeviceSlotKind[]) {
        const own = slots[kind];
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

    for (const model of WEB_MODELS) {
        for (const layout of LAYOUTS) {
            it(`${model} cardDevice${layout}: the field widths of the adapter are the narrowest boxes of the web layout`, () => {
                const adapter = ADAPTER_FIELDS[model][layout];
                const hasStatus = DEVICE_SLOT_KINDS[layout].includes('status');
                const plain = narrowest(layout, model, false);
                const withStatus = hasStatus ? narrowest(layout, model, true) : plain;

                // one status line and one name of main per page: the narrowest of all cases
                expect(adapter.status, 'status').toBe(Math.min(plain.status, withStatus.status));
                expect(adapter.mainName, 'mainName').toBe(Math.min(plain.mainName, withStatus.mainName));
                // every kind of the page (and of its additional slots) has its fields
                expect(widthsOf(adapter.slots), 'slots').toEqual(plain.slots);
                // with status icons: only the kinds whose fields change stand in slotsWithStatus
                const changed: Partial<Record<DeviceSlotKind, DevicePageSlotFields>> = {};
                for (const kind of Object.keys(withStatus.slots) as DeviceSlotKind[]) {
                    if (JSON.stringify(withStatus.slots[kind]) !== JSON.stringify(plain.slots[kind])) {
                        changed[kind] = withStatus.slots[kind];
                    }
                }
                expect(widthsOf(adapter.slotsWithStatus ?? {}), 'slotsWithStatus').toEqual(changed);
            });
        }
    }
});
