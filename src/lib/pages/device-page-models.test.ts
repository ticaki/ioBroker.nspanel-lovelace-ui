/**
 * The device page on every model and the extra slots of the web models (doc/ideas/device-details/README.md, section
 * "Modelle und Zusatz-Slots"): the HMI models (eu, us-l, us-p) get the message as it always was, the web models
 * (web-l, web-p) the same message with the elements of the extra slots appended.
 */
import { expect } from 'chai';
import * as sinon from 'sinon';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { hasGlyph, textWidth } from '../const/text-width';
import { panelModels } from '../types/adminShareConfig';
import {
    DEVICE_PAGE_EXTRA_SLOTS,
    DEVICE_PAGE_FIELDS,
    DEVICE_PAGE_FIELDS_BY_MODEL,
    DEVICE_PAGE_FIELDS_US_P,
    DEVICE_PAGE_FIELDS_WEB_L,
    DEVICE_PAGE_FIELDS_WEB_P,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_RECEIVE_BYTES,
    DEVICE_PAGE_STAGE_CAPACITY,
    DEVICE_PAGE_STAGE_HIDDEN_SLOTS,
    DEVICE_PAGE_STATUS_MAX_BYTES,
    DEVICE_PAGE_STATUS_SLOTS,
    DEVICE_PAGE_TEXT_FONT,
    isDevicePageStatusStage,
    deviceDetailsRuntimeOf,
    devicePageConfigOf,
    devicePageConfigSlotKinds,
    devicePageExtraSlotCount,
    devicePageExtraSlotKinds,
    devicePageFields,
    devicePageSlotFields,
    fitDevicePageSlots,
    type DeviceDetailsRuntime,
    type DevicePageLayout,
    type DevicePageRuntime,
} from '../types/deviceDetails';
import type { PageBase } from '../types/pages';
import type { NSpanelModel } from '../types/types';
import {
    DEVICE_PAGE_EMPTY_ELEMENT,
    buildDevicePage,
    devicePageMaxPayloadBytes,
    devicePageOfModel,
    devicePagePayload,
    devicePageSlotItemIndex,
    devicePageStatusItemIndex,
    splitDevicePageStatus,
    type DevicePageBuildContext,
} from './device-page';
import { PageDevice } from './pageDevice';
import { PageItem } from './pageItem';

const LAYOUTS: readonly DevicePageLayout[] = [1, 2, 3];
const HMI_MODELS: readonly NSpanelModel[] = ['eu', 'us-l', 'us-p'];
const WEB_MODELS: readonly NSpanelModel[] = ['web-l', 'web-p'];
const ALL_MODELS: readonly NSpanelModel[] = [...HMI_MODELS, ...WEB_MODELS];

const DEV = 'shelly.0.wm';
const objects: Record<string, any> = {
    [DEV]: { type: 'device', common: { name: 'Waschmaschine' } },
    [`${DEV}.power`]: { type: 'state', common: { type: 'number', role: 'value.power', write: false, unit: 'W' } },
    [`${DEV}.energy`]: { type: 'state', common: { type: 'number', role: 'value.energy', write: false, unit: 'Wh' } },
    [`${DEV}.start`]: { type: 'state', common: { type: 'boolean', role: 'button', read: false, write: true } },
    [`${DEV}.on`]: { type: 'state', common: { type: 'boolean', role: 'switch', write: true } },
    'alias.0.socket': { type: 'channel', common: { name: 'Dose', role: 'socket' } },
};
const getObject = async (id: string): Promise<ioBroker.Object | null> => Promise.resolve(objects[id] ?? null);
const ref = (id: string): { key: string; id: string } => ({ key: '', id: `${DEV}.${id}` });
const nulls = (count: number): null[] => new Array<null>(count).fill(null);
const bytes = (text: string): number => Buffer.byteLength(text, 'utf8');

/**
 * @param devicePage the stored device page
 * @returns its runtime part
 */
function runtimeOf(devicePage: Record<string, unknown>): { details: DeviceDetailsRuntime; page: DevicePageRuntime } {
    const details = deviceDetailsRuntimeOf({ deviceId: DEV, entries: [ref('power')], devicePage });
    if (!details?.devicePage) {
        throw new Error('no device page');
    }
    return { details, page: details.devicePage };
}

/**
 * @param page the device page at runtime
 * @param details the device part of the item
 * @param pageItemOf builds the page item of an alias channel
 * @returns the page built
 */
async function build(
    page: DevicePageRuntime,
    details: DeviceDetailsRuntime,
    pageItemOf: DevicePageBuildContext['pageItemOf'] = async () => Promise.resolve(undefined),
): Promise<{ page: PageBase; messages: string[] }> {
    return buildDevicePage(
        'device-test',
        'none',
        { deviceId: details.deviceId, entries: details.entries, page },
        { getObject, translate: k => k, language: 'de', pageItemOf },
    );
}

describe('lib/types/deviceDetails - models of the device page', () => {
    it('text fields per model: eu as before, us-l like eu, every model and layout has its fields', () => {
        for (const layout of LAYOUTS) {
            expect(devicePageFields(layout, 'eu')).to.equal(DEVICE_PAGE_FIELDS[layout]);
            expect(devicePageFields(layout, 'us-l')).to.equal(DEVICE_PAGE_FIELDS[layout]);
            for (const model of ALL_MODELS) {
                const fields = devicePageFields(layout, model);
                expect(fields.status, `${model} ${layout}`).to.be.above(0);
                expect(fields.mainName, `${model} ${layout}`).to.be.above(0);
                for (const kind of DEVICE_PAGE_LAYOUTS[layout].filter(k => k !== 'status')) {
                    expect(devicePageSlotFields(layout, kind, 0, model), `${model} ${layout} ${kind}`).to.not.equal(
                        undefined,
                    );
                }
            }
        }
        expect(devicePageFields(1, 'eu').status).to.equal(390);
        // the stages of the status grid: set B (short name), set C (no name, value 81 px)
        expect(devicePageSlotFields(1, 'info', 0)).to.deep.equal({ name: 164, value: 110 });
        expect(devicePageSlotFields(1, 'info', 1)).to.deep.equal({ name: 43, value: 110 });
        expect(devicePageSlotFields(1, 'info', 2)).to.deep.equal({ name: 0, value: 81 });
        expect(devicePageSlotFields(1, 'button', 3)).to.deep.equal({ name: 104 });
        expect(devicePageSlotFields(3, 'info', 2)).to.deep.equal({ name: 125, value: 125 });
    });
    it('us-p, web-l and web-p have their own fields: status line 262 / 580 / 262 px', () => {
        expect(Object.keys(DEVICE_PAGE_FIELDS_BY_MODEL).sort()).to.deep.equal([...panelModels].sort());
        for (const layout of LAYOUTS) {
            expect(devicePageFields(layout, 'us-p')).to.equal(DEVICE_PAGE_FIELDS_US_P[layout]);
            expect(devicePageFields(layout, 'web-l')).to.equal(DEVICE_PAGE_FIELDS_WEB_L[layout]);
            expect(devicePageFields(layout, 'web-p')).to.equal(DEVICE_PAGE_FIELDS_WEB_P[layout]);
            expect(devicePageFields(layout, 'us-p').status).to.equal(262);
            expect(devicePageFields(layout, 'web-l').status).to.equal(580);
            expect(devicePageFields(layout, 'web-p').status).to.equal(262);
        }
        // us-p: the info rows of layout 1 go right of the big icon as set C in stages 1 and 2 (no set B)
        expect(devicePageSlotFields(1, 'info', 0, 'us-p')).to.deep.equal({ name: 156, value: 104 });
        expect(devicePageSlotFields(1, 'info', 1, 'us-p')).to.deep.equal({ name: 0, value: 106 });
        expect(devicePageSlotFields(1, 'info', 2, 'us-p')).to.deep.equal({ name: 0, value: 106 });
        expect(devicePageSlotFields(2, 'button', 0, 'us-p')).to.deep.equal({ name: 300 });
        expect(devicePageSlotFields(2, 'value', 0, 'us-p')).to.deep.equal({ name: 172, value: 172, valueFont: 4 });
        expect(devicePageSlotFields(3, 'switch', 0, 'us-p')).to.deep.equal({ name: 212 });
        // web-l: eu on the full width - info rows and bar reach the right edge, the rest keeps the eu widths; only
        // the names of buttons that stand side by side are 4 px narrower (a gap between two names)
        expect(devicePageSlotFields(1, 'info', 0, 'web-l')).to.deep.equal({ name: 354, value: 110 });
        // web-l: the stages of eu, the info rows reach the right edge in every set
        expect(devicePageSlotFields(1, 'info', 1, 'web-l')).to.deep.equal({ name: 233, value: 110 });
        expect(devicePageSlotFields(1, 'info', 2, 'web-l')).to.deep.equal({ name: 0, value: 271 });
        expect(devicePageSlotFields(2, 'progress', 0, 'web-l')).to.deep.equal({ name: 620 });
        for (const layout of LAYOUTS) {
            const web = DEVICE_PAGE_FIELDS_WEB_L[layout];
            const eu = DEVICE_PAGE_FIELDS[layout];
            expect(web.mainName, `web-l ${layout}`).to.equal(eu.mainName);
            for (const kind of DEVICE_PAGE_LAYOUTS[layout].filter(k => k !== 'status')) {
                const w = devicePageSlotFields(layout, kind, 0, 'web-l');
                const e = devicePageSlotFields(layout, kind, 0, 'eu');
                expect(w?.name ?? 0, `web-l ${layout} ${kind}`).to.be.at.least(
                    (e?.name ?? 0) - (kind === 'button' ? 4 : 0),
                );
                expect(w?.value, `web-l ${layout} ${kind}`).to.equal(e?.value);
                expect(w?.valueFont, `web-l ${layout} ${kind}`).to.equal(e?.valueFont);
            }
        }
        expect(devicePageSlotFields(1, 'button', 0, 'web-l')).to.deep.equal({ name: 100 });
        expect(devicePageSlotFields(2, 'button', 0, 'web-l')).to.deep.equal({ name: 96 });
        // web-p: us-p with the extra slots - only the buttons of layout 2 share a row (three: 100 px like eu, their
        // names 4 px narrower)
        // layout 1 with the stages of us-p (set C right of the big icon)
        expect(DEVICE_PAGE_FIELDS_WEB_P[1]).to.deep.equal(DEVICE_PAGE_FIELDS_US_P[1]);
        expect(DEVICE_PAGE_FIELDS_WEB_P[3]).to.deep.equal(DEVICE_PAGE_FIELDS_US_P[3]);
        expect(DEVICE_PAGE_FIELDS_WEB_P[2]).to.deep.equal({
            ...DEVICE_PAGE_FIELDS_US_P[2],
            slots: { ...DEVICE_PAGE_FIELDS_US_P[2].slots, button: { name: 96 } },
        });
        expect(devicePageSlotFields(2, 'button', 0, 'web-p')?.name).to.equal(
            (devicePageSlotFields(2, 'button', 0, 'eu')?.name ?? 0) - 4,
        );
    });
    it('the fields of eu, us-l and us-p are the boxes of the HMI pages (device-page-geometry.json, device13)', () => {
        type Box = { w: number; font?: number };
        type InfoSet = { name?: Box; value: Box };
        type Slot = { kind: string; name?: Box | number; value?: Box | number; sets?: Record<string, InfoSet> };
        type Stage = { stage: number; columns: number; infoSet: string | null; hiddenSlots: number[] };
        type HmiPage = {
            slotCount: number;
            statusWidth: number;
            strCommand: number;
            main: { name: Box };
            status: Box;
            slots: Slot[];
            grid?: { cells: unknown[] };
            stages?: Stage[];
        };
        const file = path.join(__dirname, '../../../doc/ideas/device-details/device-page-geometry.json');
        const geometry = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<
            string,
            { pages: Record<string, HmiPage> }
        >;
        const width = (box: Box | number | undefined): number | undefined => (typeof box === 'number' ? box : box?.w);
        expect(Object.keys(geometry).sort()).to.deep.equal([...HMI_MODELS].sort());
        for (const model of HMI_MODELS) {
            for (const layout of LAYOUTS) {
                const at = `${model} cardDevice${layout}`;
                const page = geometry[model].pages[`cardDevice${layout}`];
                const fields = devicePageFields(layout, model);
                expect(
                    page.slots.map(s => s.kind),
                    at,
                ).to.deep.equal(DEVICE_PAGE_LAYOUTS[layout]);
                expect(page.slotCount, at).to.equal(DEVICE_PAGE_LAYOUTS[layout].length);
                expect(page.strCommand, at).to.equal(DEVICE_PAGE_RECEIVE_BYTES[layout]);
                expect(page.grid?.cells.length ?? 0, at).to.equal(DEVICE_PAGE_STATUS_SLOTS[layout]);
                expect(fields.mainName, at).to.equal(page.main.name.w);
                expect(fields.status, at).to.equal(page.statusWidth);
                expect(fields.status, at).to.equal(page.status.w);
                expect(page.status.font, at).to.equal(DEVICE_PAGE_TEXT_FONT);
                for (const slot of page.slots) {
                    const kind = DEVICE_PAGE_LAYOUTS[layout].find(k => k === slot.kind);
                    expect(kind, at).to.not.equal(undefined);
                    if (kind === undefined) {
                        continue;
                    }
                    // every slot of a kind has the same fields
                    const own = fields.slots[kind];
                    expect(own?.name, `${at} ${kind} name`).to.equal(width(slot.name));
                    expect(own?.value, `${at} ${kind} value`).to.equal(width(slot.value));
                }
                // the stages: capacity, covered slots and the info set with its widths
                const stages = page.stages ?? [{ stage: 0, columns: 0, infoSet: null, hiddenSlots: [] }];
                expect(
                    stages.map(st => st.stage),
                    at,
                ).to.deep.equal(DEVICE_PAGE_STAGE_CAPACITY[layout].map((_c, i) => i));
                const staged = new Set<number>();
                for (const st of stages) {
                    const stage = st.stage;
                    if (!isDevicePageStatusStage(stage)) {
                        throw new Error(`${at}: stage ${stage}`);
                    }
                    const rows = layout === 1 ? 2 : 1;
                    expect(DEVICE_PAGE_STAGE_CAPACITY[layout][stage], `${at} stage ${stage}`).to.equal(
                        st.columns * rows,
                    );
                    // cardDevice1 stage 3: no info rows (infoSet null) - the two info slots are covered
                    const hidden = layout === 1 && stage > 0 && st.infoSet === null ? [1, 2] : st.hiddenSlots;
                    expect(
                        DEVICE_PAGE_STAGE_HIDDEN_SLOTS[layout][stage].map(i => i + 1),
                        `${at} stage ${stage} hidden`,
                    ).to.deep.equal(hidden);
                    if (st.infoSet === 'B' || st.infoSet === 'C') {
                        staged.add(stage);
                        const set = page.slots[0].sets?.[st.infoSet];
                        expect(
                            devicePageSlotFields(layout, 'info', stage, model),
                            `${at} stage ${stage}`,
                        ).to.deep.equal({
                            name: set?.name?.w ?? 0,
                            value: set?.value.w,
                        });
                        expect(set?.name?.font ?? DEVICE_PAGE_TEXT_FONT, at).to.equal(DEVICE_PAGE_TEXT_FONT);
                        expect(set?.value.font, at).to.equal(DEVICE_PAGE_TEXT_FONT);
                    }
                }
                expect(
                    Object.keys(fields.slotsByStage ?? {})
                        .map(Number)
                        .sort(),
                    at,
                ).to.deep.equal([...staged].sort());
            }
        }
    });
    it('the widths of font 0 can be measured for every model', () => {
        for (const model of panelModels) {
            expect(textWidth('Schleudern, noch 23 min', DEVICE_PAGE_TEXT_FONT, model), model).to.be.above(0);
            expect(hasGlyph('a'.codePointAt(0) ?? 0, DEVICE_PAGE_TEXT_FONT, model), model).to.equal(true);
            // whether the font has the ellipsis differs, it only must not throw
            expect(hasGlyph(0x20_26, DEVICE_PAGE_TEXT_FONT, model), model).to.be.a('boolean');
        }
    });
    it('the status line is split to the width of the model', () => {
        const text = 'Reinigung läuft, Wohnzimmer und Küche fertig, noch 23 min bis zur Rückkehr an die Ladestation';
        for (const model of ALL_MODELS) {
            for (const layout of LAYOUTS) {
                const width = devicePageFields(layout, model).status;
                const parts = splitDevicePageStatus(text, layout, model);
                expect(parts.length, `${model} ${layout}`).to.be.above(1);
                for (const part of parts) {
                    expect(textWidth(part, DEVICE_PAGE_TEXT_FONT, model), `${model} ${layout} ${part}`).to.be.at.most(
                        width,
                    );
                    expect(bytes(part)).to.be.at.most(DEVICE_PAGE_STATUS_MAX_BYTES);
                }
                expect(splitDevicePageStatus('Fertig', layout, model)).to.deep.equal(['Fertig']);
            }
        }
    });
});

describe('lib/types/deviceDetails - extra slots of the web models', () => {
    it('the extra slots of every layout', () => {
        expect(DEVICE_PAGE_EXTRA_SLOTS).to.deep.equal({
            1: ['button', 'button'],
            2: ['info', 'button', 'button'],
            3: ['info', 'info', 'switch'],
        });
        // layout 1: 6 buttons; layout 2: 4 infos, 3 buttons; layout 3: 8 infos, 3 switches
        const count = (layout: DevicePageLayout, kind: string): number =>
            devicePageConfigSlotKinds(layout).filter(k => k === kind).length;
        expect(count(1, 'button')).to.equal(6);
        expect([count(2, 'info'), count(2, 'button')]).to.deep.equal([4, 3]);
        expect([count(3, 'info'), count(3, 'switch')]).to.deep.equal([8, 3]);
        for (const layout of LAYOUTS) {
            expect(devicePageConfigSlotKinds(layout)).to.deep.equal([
                ...DEVICE_PAGE_LAYOUTS[layout],
                ...DEVICE_PAGE_EXTRA_SLOTS[layout],
            ]);
        }
    });
    it('only the web models show them, both the same', () => {
        for (const layout of LAYOUTS) {
            for (const model of WEB_MODELS) {
                expect(devicePageExtraSlotKinds(layout, model)).to.equal(DEVICE_PAGE_EXTRA_SLOTS[layout]);
                expect(devicePageExtraSlotCount(layout, model)).to.equal(DEVICE_PAGE_EXTRA_SLOTS[layout].length);
            }
            for (const model of HMI_MODELS) {
                expect(devicePageExtraSlotKinds(layout, model)).to.deep.equal([]);
                expect(devicePageExtraSlotCount(layout, model)).to.equal(0);
            }
        }
    });
    it('a configuration without extra slots stays exactly as it was', () => {
        const stored = {
            layout: 2,
            slots: [ref('power'), null, ref('energy'), null, null, ref('start')],
            showInfo: true,
        };
        const config = devicePageConfigOf(stored);
        expect(config).to.deep.equal(stored);
        expect(config).to.not.have.property('webExtras');
        expect(devicePageConfigOf(config)).to.deep.equal(stored);
        // not true = off, nothing is stored
        for (const webExtras of [false, 1, 'true', null]) {
            expect(devicePageConfigOf({ ...stored, webExtras })).to.deep.equal(stored);
        }
        expect(devicePageConfigOf({ ...stored, webExtras: true })).to.deep.equal({ ...stored, webExtras: true });
    });
    it('extra slots: stored behind the slots of the layout, all of them once one is filled', () => {
        const n = DEVICE_PAGE_LAYOUTS[2].length;
        const config = devicePageConfigOf({
            layout: 2,
            webExtras: true,
            slots: [ref('power'), ...nulls(n - 1), null, { ...ref('start'), icon: 'x', name: ' Los ' }],
        });
        expect(config?.slots).to.have.length(n + DEVICE_PAGE_EXTRA_SLOTS[2].length);
        expect(config?.slots.slice(n)).to.deep.equal([null, { ...ref('start'), name: 'Los' }, null]);
        expect(config?.webExtras).to.equal(true);
        // what lies behind the extra slots is dropped
        const long = devicePageConfigOf({ layout: 2, slots: [...nulls(n + 3), ref('power')] });
        expect(long?.slots).to.have.length(n);
    });
    it('unticked: the extra slots stay stored, the runtime ignores them', () => {
        const n = DEVICE_PAGE_LAYOUTS[3].length;
        const slots = [ref('power'), ...nulls(n - 1), ref('energy'), null, ref('on')];
        const off = devicePageConfigOf({ layout: 3, slots });
        expect(off?.slots).to.deep.equal(slots);
        expect(off).to.not.have.property('webExtras');
        expect(runtimeOf({ layout: 3, slots }).page.slots).to.deep.equal(slots.slice(0, n));
        expect(runtimeOf({ layout: 3, slots, webExtras: true }).page.slots).to.deep.equal(slots);
        // ticked without a filled extra slot: the page of the layout
        expect(runtimeOf({ layout: 3, slots: slots.slice(0, n), webExtras: true }).page.slots).to.have.length(n);
    });
    it('runtime: an extra slot that cannot show anything is empty', () => {
        const n = DEVICE_PAGE_LAYOUTS[3].length;
        const nav = { key: '', id: '', custom: 'navigation', targetPage: 'rooms' };
        const pending = { key: '', id: '', custom: 'state' };
        // layout 3: info, info, switch - a switch needs a value
        const { page } = runtimeOf({ layout: 3, webExtras: true, slots: [...nulls(n), nav, pending, nav] });
        expect(page.slots.slice(n)).to.deep.equal([nav, null, null]);
        // nothing left: no extra slots at all
        const none = runtimeOf({ layout: 3, webExtras: true, slots: [...nulls(n), pending, null, nav] });
        expect(none.page.slots).to.have.length(n);
    });
    it('a layout change keeps the extra slots among themselves', () => {
        const one = [...nulls(6), ref('start'), ref('on')];
        // layout 1 -> 2: the extra slots of layout 1 are the first extra slots of layout 2
        expect(fitDevicePageSlots(one, 2, 1)).to.deep.equal([...nulls(6), ref('start'), ref('on'), null]);
        // layout 2 -> 1: the extra slots stay extra slots, the third one has no place
        const two = [ref('power'), ...nulls(5), ref('energy'), ref('start'), ref('on')];
        expect(fitDevicePageSlots(two, 1, 2)).to.deep.equal([ref('power'), ...nulls(5), ref('energy'), ref('start')]);
        expect(fitDevicePageSlots(two, 3, 2)).to.deep.equal([
            ref('power'),
            ...nulls(7),
            ref('energy'),
            ref('start'),
            ref('on'),
        ]);
        // without a filled extra slot there are only the slots of the layout
        expect(fitDevicePageSlots(two.slice(0, 6), 3, 2)).to.have.length(8);
        expect(fitDevicePageSlots([...two.slice(0, 6), null, null, null], 2, 2)).to.have.length(6);
    });
});

describe('lib/pages/device-page - page items of the extra slots', () => {
    const n = DEVICE_PAGE_LAYOUTS[2].length;
    const base = [ref('power'), null, ref('energy'), null, null, ref('start')];
    // layout 2: info, button, button
    const extras = [ref('power'), ref('start'), { key: '', id: 'alias.0.socket', custom: 'channel' }];
    const channelItem: any = { type: 'switch', role: '', dpInit: '', data: { icon: {} } };
    const pageItemOf: DevicePageBuildContext['pageItemOf'] = async item =>
        Promise.resolve(item.channelId.valueStateId === 'alias.0.socket' ? channelItem : undefined);

    it('number of the page item of a slot: the extra slots stand behind the status item and the status icons', () => {
        for (const layout of LAYOUTS) {
            const count = DEVICE_PAGE_LAYOUTS[layout].length;
            const m = DEVICE_PAGE_STATUS_SLOTS[layout];
            expect(devicePageSlotItemIndex(layout, 0)).to.equal(1);
            expect(devicePageSlotItemIndex(layout, count - 1)).to.equal(count);
            expect(devicePageSlotItemIndex(layout, count)).to.equal(count + 3 + m);
            expect(devicePageSlotItemIndex(layout, count + 1)).to.equal(count + 4 + m);
            expect(devicePageStatusItemIndex(layout, 0)).to.equal(count + 3);
        }
        expect(Object.values(DEVICE_PAGE_STATUS_SLOTS)).to.deep.equal([16, 0, 8]);
        // the ids <page>?<n> fit the 7 bytes of entn: n stays two-digit (999?99), also with the extra slots
        for (const layout of LAYOUTS) {
            const last = DEVICE_PAGE_LAYOUTS[layout].length + DEVICE_PAGE_EXTRA_SLOTS[layout].length - 1;
            expect(devicePageSlotItemIndex(layout, last)).to.be.below(100);
            expect(`999?${devicePageSlotItemIndex(layout, last)}`.length).to.be.at.most(7);
        }
    });
    it('appended behind the status item, the items of the layout keep number and content', async () => {
        const without = runtimeOf({ layout: 2, slots: base, status: ref('power') });
        const plain = await build(without.page, without.details);
        expect(plain.page.pageItems).to.have.length(n + 3);

        const withExtras = runtimeOf({ layout: 2, slots: [...base, ...extras], status: ref('power'), webExtras: true });
        const built = await build(withExtras.page, withExtras.details, pageItemOf);
        expect(built.messages).to.deep.equal([]);
        const items = built.page.pageItems ?? [];
        expect(items).to.have.length(n + 3 + DEVICE_PAGE_EXTRA_SLOTS[2].length);
        // main, slots, info, status: exactly the page without extra slots (the same state twice changes no name)
        expect(items.slice(0, n + 3)).to.deep.equal(plain.page.pageItems);
        const [info, button, channel]: any[] = items.slice(n + 3);
        expect(info.type).to.equal('text');
        // the same state as slot 1: the extra slot is told apart among all slots, slot 1 keeps its name
        expect(info.data.text.true.constVal).to.equal('power power');
        expect((items[1] as any).data.text.true.constVal).to.equal('power');
        expect(button.type).to.equal('button');
        expect(channel.type).to.equal('switch');
        // the channel slot by its index in the configuration
        expect((built.page.config as any).channelSlots).to.deep.equal([n + 2]);

        // unticked: the page of the layout
        const off = runtimeOf({ layout: 2, slots: [...base, ...extras], status: ref('power') });
        expect((await build(off.page, off.details, pageItemOf)).page).to.deep.equal(plain.page);
    });
    it('an extra slot is built like a slot of the layout of the same kind; what does not fit stays empty', async () => {
        // layout 2, slot 3 (info) and slot 6 (button) against the extra slots 1 (info) and 2 (button)
        const normal = runtimeOf({ layout: 2, slots: [null, null, ref('energy'), null, null, ref('on')] });
        const builtNormal = (await build(normal.page, normal.details)).page.pageItems ?? [];
        const extra = runtimeOf({
            layout: 2,
            webExtras: true,
            // a number is no button
            slots: [...nulls(n), ref('energy'), ref('on'), ref('power')],
        });
        const built = await build(extra.page, extra.details);
        const items = built.page.pageItems ?? [];
        expect(items[n + 3]).to.deep.equal(builtNormal[3]);
        expect(items[n + 4]).to.deep.equal(builtNormal[6]);
        expect(items[n + 5].type).to.equal('empty');
        expect(built.messages.join(' ')).to.contain(`${DEV}.power`);
    });
    it('a panel that shows no extra slots gets no items for them', async () => {
        const withExtras = runtimeOf({ layout: 2, slots: [...base, ...extras], webExtras: true });
        const built = (await build(withExtras.page, withExtras.details, pageItemOf)).page;
        const baseConfig: any = { ...(built.config as object), channelSlots: [2, n + 2] };
        const page = { ...built, config: baseConfig } as PageBase;
        for (const model of HMI_MODELS) {
            const cut = devicePageOfModel(page, model);
            expect(cut.pageItems, model).to.deep.equal((page.pageItems ?? []).slice(0, n + 3));
            expect((cut.config as any).channelSlots, model).to.deep.equal([2]);
            expect((cut.config as any).card).to.equal('cardDevice2');
        }
        // the page itself is not changed
        expect(page.pageItems).to.have.length(n + 6);
        for (const model of WEB_MODELS) {
            expect(devicePageOfModel(page, model)).to.equal(page);
        }
        // nothing to leave out, and no device page
        const plain = runtimeOf({ layout: 2, slots: base });
        const plainPage = (await build(plain.page, plain.details)).page;
        expect(devicePageOfModel(plainPage, 'eu')).to.equal(plainPage);
        const grid = { uniqueID: 'g', alwaysOn: 'none', pageItems: [], config: { card: 'cardGrid' } } as any;
        expect(devicePageOfModel(grid, 'eu')).to.equal(grid);
    });
});

/**
 * A PageDevice without panel around it (like fakeDevicePage in device-page.test.ts).
 *
 * @param layout the layout
 * @param model model of the panel
 * @param payloads payloads of the page items (index = number of the item), undefined = no item
 * @param channelSlots index of the slots with an alias channel
 * @returns the page and what it sent
 */
function fakePage(
    layout: DevicePageLayout,
    model: NSpanelModel,
    payloads: (string | undefined)[],
    channelSlots: number[] = [],
): { page: PageDevice; sent: string[] } {
    const sent: string[] = [];
    const page = Object.create(PageDevice.prototype) as PageDevice;
    Object.assign(page, {
        headline: 'Waschmaschine',
        slotCount: DEVICE_PAGE_LAYOUTS[layout].length,
        layout,
        channelSlots: new Set<number>(channelSlots),
        statusStage: 0,
        lastIcons: '',
        visibility: true,
        refreshTimeout: null,
        statusText: undefined,
        statusParts: [''],
        statusIndex: 0,
        statusTimer: undefined,
        sleep: false,
        unload: false,
        adapter: {
            unload: false,
            setTimeout: (): number => 1,
            clearTimeout: (): void => undefined,
            setInterval: (): number => 1,
            clearInterval: (): void => undefined,
        },
        log: { debug: (): void => undefined },
        library: { getTranslation: (s: string): string => s },
        basePanel: { info: { nspanel: { model } } },
        directParentPage: { id: '3' },
        pageItems: payloads.map(p => (p === undefined ? undefined : { getPageItemPayload: async () => p })),
        sendToPanel: (msg: string): void => {
            sent.push(msg);
        },
        sendToPanelClass: (msg: string): void => {
            sent.push(msg);
        },
    });
    return { page, sent };
}

describe('lib/pages/pageDevice - message per model', () => {
    /**
     * @param layout the layout
     * @param k index of the extra slot
     * @returns the number of its page item
     */
    const extraAt = (layout: DevicePageLayout, k: number): number =>
        devicePageSlotItemIndex(layout, DEVICE_PAGE_LAYOUTS[layout].length + k);
    /**
     * @param layout the layout
     * @returns the info element: type as a number, field 6 the stage (0: empty) on cardDevice1 / cardDevice3
     */
    const infoOf = (layout: DevicePageLayout): string =>
        `1~dp_3?${DEVICE_PAGE_LAYOUTS[layout].length + 1}~i~3~~${layout === 2 ? '1' : ''}`;
    /**
     * @param layout the layout
     * @param withExtras with the items of the extra slots
     * @returns the payloads of main, the slots, info, the status item and the extra slots
     */
    const payloadsOf = (layout: DevicePageLayout, withExtras: boolean): string[] => {
        const n = DEVICE_PAGE_LAYOUTS[layout].length;
        const payloads = ['switch~dp_3?0~M~1~WM~1'];
        for (let i = 1; i <= n; i++) {
            payloads.push(`text~dp_3?${i}~I~2~S${i}~${i} W`);
        }
        payloads.push(`button~dp_3?${n + 1}~i~3~~1`);
        payloads.push(`text~dp_3?${n + 2}~x~4~~Schleudern`);
        if (withExtras) {
            // the status icon places (none filled), then the extra slots
            payloads.push(...new Array<string>(DEVICE_PAGE_STATUS_SLOTS[layout]).fill(''));
            DEVICE_PAGE_EXTRA_SLOTS[layout].forEach((_kind, k) => {
                payloads.push(`button~dp_3?${extraAt(layout, k)}~E~5~X${k + 1}~1`);
            });
        }
        return payloads;
    };
    const send = async (
        layout: DevicePageLayout,
        model: NSpanelModel,
        payloads: (string | undefined)[],
        channelSlots: number[] = [],
    ): Promise<string> => {
        const { page, sent } = fakePage(layout, model, payloads, channelSlots);
        await page.update();
        expect(sent).to.have.length(1);
        return sent[0];
    };

    for (const layout of LAYOUTS) {
        const n = DEVICE_PAGE_LAYOUTS[layout].length;
        const e = DEVICE_PAGE_EXTRA_SLOTS[layout].length;
        it(`layout ${layout}: eu, us-l and us-p get the message as it always was, also when the page has extra slots`, async () => {
            const eu = await send(layout, 'eu', payloadsOf(layout, false));
            expect(eu.split('~')).to.have.length(2 + 12 + 6 * (n + 2));
            // the last element is info
            expect(eu.endsWith(`~${infoOf(layout)}`)).to.equal(true);
            for (const model of HMI_MODELS) {
                expect(await send(layout, model, payloadsOf(layout, false)), model).to.equal(eu);
                expect(await send(layout, model, payloadsOf(layout, true)), model).to.equal(eu);
            }
        });
        it(`layout ${layout}: web-l and web-p get it with the ${e} extra elements appended`, async () => {
            const eu = await send(layout, 'eu', payloadsOf(layout, false));
            const extra = DEVICE_PAGE_EXTRA_SLOTS[layout].map(
                (_kind, k) => `1~dp_3?${extraAt(layout, k)}~E~5~X${k + 1}~1`,
            );
            for (const model of WEB_MODELS) {
                const web = await send(layout, model, payloadsOf(layout, true));
                expect(web, model).to.equal([eu, ...extra].join('~'));
                expect(web.split('~')).to.have.length(2 + 12 + 6 * (n + 2 + e));
            }
        });
        it(`layout ${layout}: web models without extra slots (unticked) get them as empty elements`, async () => {
            const eu = await send(layout, 'eu', payloadsOf(layout, false));
            const empty = DEVICE_PAGE_EXTRA_SLOTS[layout].map(() => DEVICE_PAGE_EMPTY_ELEMENT);
            for (const model of WEB_MODELS) {
                expect(await send(layout, model, payloadsOf(layout, false)), model).to.equal([eu, ...empty].join('~'));
            }
        });
    }
    it('one empty extra slot among filled ones is an empty element at its place', async () => {
        const n = DEVICE_PAGE_LAYOUTS[2].length;
        const payloads: (string | undefined)[] = payloadsOf(2, true);
        payloads[n + 4] = undefined;
        const web = await send(2, 'web-l', payloads);
        const elements = web.split('~').slice(14 + 6 * (n + 2));
        expect(elements).to.deep.equal([
            ...['1', `dp_3?${n + 3}`, 'E', '5', 'X1', '1'],
            ...['', '', '', '', '', ''],
            ...['1', `dp_3?${n + 5}`, 'E', '5', 'X3', '1'],
        ]);
    });
    it('extra slots: names and values 31 bytes, field 6 of an alias channel follows the kind of the slot', async () => {
        const n = DEVICE_PAGE_LAYOUTS[2].length;
        const payloads: (string | undefined)[] = payloadsOf(2, true);
        // layout 2: info, button, button
        payloads[n + 3] = `switch~dp_3?${n + 3}~E~5~${'ü'.repeat(40)}~1`;
        payloads[n + 4] = `number~dp_3?${n + 4}~E~5~Vol~40|0|200`;
        payloads[n + 5] = `text~dp_3?${n + 5}~E~5~Text~${'w'.repeat(40)}`;
        const web = await send(2, 'web-p', payloads, [n, n + 1]);
        const elements = web.split('~').slice(14 + 6 * (n + 2));
        // an info slot shows on / off of a switch, the name is cut at a character
        expect(elements.slice(0, 6)).to.deep.equal(['1', `dp_3?${n + 3}`, 'E', '5', 'ü'.repeat(15), 'on']);
        // a button slot shows no number
        expect(elements.slice(6, 12)).to.deep.equal(['9', `dp_3?${n + 4}`, 'E', '5', 'Vol', '']);
        // no channel: only cut
        expect(elements.slice(12, 18)).to.deep.equal(['1', `dp_3?${n + 5}`, 'E', '5', 'Text', 'w'.repeat(31)]);
    });
    it('long press: an extra slot runs the long press of its item on a web model, never info or the status item', async () => {
        const n = DEVICE_PAGE_LAYOUTS[2].length;
        const ids = [0, 1, n, n + 1, n + 2, n + 3, n + 5, n + 6];
        const pressedOn = async (model: NSpanelModel): Promise<number[]> => {
            const { page } = fakePage(2, model, []);
            const pressed: number[] = [];
            const items = new Array(n + 7).fill(0).map((_v, i) => ({
                onCommandLongPress: async (): Promise<boolean> => {
                    pressed.push(i);
                    return Promise.resolve(false);
                },
            }));
            Object.assign(page, { pageItems: items });
            for (const id of ids) {
                expect(await page.onButtonPress3(String(id), undefined, 'button', ''), String(id)).to.equal(true);
            }
            return pressed;
        };
        expect(await pressedOn('web-l')).to.deep.equal([1, n, n + 3, n + 5]);
        expect(await pressedOn('web-p')).to.deep.equal([1, n, n + 3, n + 5]);
        expect(await pressedOn('eu')).to.deep.equal([1, n]);
        expect(await pressedOn('us-p')).to.deep.equal([1, n]);
    });
});

/**
 * A PageDevice made by its real constructor on a panel that only has what the page touches.
 *
 * @param model model of the panel
 * @param pageConfig the configuration of the page (buildDevicePage)
 * @param isVirtual the web clone of a panel
 * @returns the page and what it sent
 */
function realPage(model: NSpanelModel, pageConfig: PageBase, isVirtual: boolean): { page: PageDevice; sent: string[] } {
    const sent: string[] = [];
    const noop = (): void => undefined;
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        controller: {},
        unload: false,
        library: { getTranslation: (s: string): string => s },
        setTimeout: (): number => 1,
        clearTimeout: noop,
        setInterval: (): number => 1,
        clearInterval: noop,
        config: {},
    };
    const panel: any = {
        info: { nspanel: { model } },
        isVirtual,
        isOnline: true,
        persistentPageItems: {},
        panelSend: { addMessage: (m: string) => sent.push(m) },
        navigation: { buildNavigationString: () => 'button~bSubPrev~<~65535~~~button~bSubNext~>~65535~~' },
        lastCard: '',
    };
    const page = new PageDevice(
        { card: pageConfig.config?.card ?? 'cardDevice1', panel, id: '7', name: 'device-test', adapter },
        pageConfig,
    );
    return { page, sent };
}

describe('lib/pages/pageDevice - the real constructor leaves out the extra slots of an HMI model', () => {
    afterEach(() => sinon.restore());

    /**
     * Shows a page: every page item it creates is recorded (PageItem.getPageItem is where an item is made and
     * subscribes its states).
     *
     * @param page the page
     * @returns the numbers of the page items that were created
     */
    const show = async (page: PageDevice): Promise<number[]> => {
        const created: number[] = [];
        sinon.restore();
        sinon.stub(PageItem, 'getPageItem').callsFake(async (config: any, options: any) => {
            const index = Number(String(config.id).split('?')[1]);
            created.push(index);
            return {
                config: options,
                getPageItemPayload: async () =>
                    options.type === 'empty' ? '' : `${options.type}~${config.id}~I~2~Name${index}~1`,
                delete: async () => undefined,
            } as any;
        });
        const p: any = page;
        await p.init();
        p.visibility = true;
        p.pageItems = await p.createPageItems(p.pageItemConfig);
        await page.update();
        return created;
    };

    for (const layout of LAYOUTS) {
        const n = DEVICE_PAGE_LAYOUTS[layout].length;
        const e = DEVICE_PAGE_EXTRA_SLOTS[layout].length;
        // main, the slots, info, the status item and the status icon places
        const own = n + 3 + DEVICE_PAGE_STATUS_SLOTS[layout];
        // every extra slot filled with something of its kind, the first one with an alias channel
        const extras = DEVICE_PAGE_EXTRA_SLOTS[layout].map((kind, k) =>
            k === 0
                ? { key: '', id: 'alias.0.socket', custom: 'channel' }
                : kind === 'info'
                  ? ref('energy')
                  : kind === 'button'
                    ? ref('start')
                    : ref('on'),
        );
        const baseSlots = DEVICE_PAGE_LAYOUTS[layout].map((kind, i) =>
            (kind === 'info' || kind === 'value') && i === 0 ? ref('power') : null,
        );
        const channelItem: any = { type: 'switch', role: '', dpInit: '', data: { icon: {} } };
        const pageItemOf: DevicePageBuildContext['pageItemOf'] = async item =>
            Promise.resolve(item.channelId.valueStateId === 'alias.0.socket' ? channelItem : undefined);
        const configs = async (): Promise<{ plain: PageBase; withExtras: PageBase }> => {
            const a = runtimeOf({ layout, slots: baseSlots, status: ref('power') });
            const b = runtimeOf({ layout, slots: [...baseSlots, ...extras], status: ref('power'), webExtras: true });
            const withExtras = (await build(b.page, b.details, pageItemOf)).page;
            expect(withExtras.pageItems).to.have.length(own + e);
            // the alias channel of the first extra slot
            expect((withExtras.config as any).channelSlots).to.deep.equal([n]);
            return { plain: (await build(a.page, a.details, pageItemOf)).page, withExtras };
        };

        it(`layout ${layout}: eu, us-l and us-p (hardware and web clone) create only the items 0..${own - 1}`, async () => {
            const { plain, withExtras } = await configs();
            for (const model of HMI_MODELS) {
                for (const isVirtual of [false, true]) {
                    const at = `${model}${isVirtual ? ' clone' : ''}`;
                    const a = realPage(model, structuredClone(withExtras), isVirtual);
                    const b = realPage(model, structuredClone(plain), isVirtual);
                    // the page keeps the configuration of the page without extra slots
                    expect(a.page.pageItemConfig, at).to.have.length(own);
                    expect(a.page.pageItemConfig, at).to.deep.equal(b.page.pageItemConfig);
                    expect(a.page.config, at).to.deep.equal(b.page.config);
                    expect((a.page.config as any).channelSlots ?? [], at).to.deep.equal([]);
                    // no item is created (and so nothing subscribed) for an extra slot
                    expect(await show(a.page), at).to.deep.equal(Array.from({ length: own }, (_v, i) => i));
                    await show(b.page);
                    // and the message is the one of the page without extra slots: nothing behind info
                    expect(a.sent, at).to.have.length(1);
                    expect(a.sent[0], at).to.equal(b.sent[0]);
                    const fields = a.sent[0].split('~');
                    expect(fields, at).to.have.length(2 + 12 + 6 * (n + 2));
                    expect(fields[14 + 6 * (n + 1) + 1], at).to.equal(`7?${n + 1}`);
                }
            }
        });

        it(`layout ${layout}: web-l and web-p create all items, the ${e} extra ones at ${own}..${own - 1 + e}`, async () => {
            const { withExtras } = await configs();
            for (const model of WEB_MODELS) {
                const a = realPage(model, structuredClone(withExtras), true);
                expect(a.page.pageItemConfig, model).to.have.length(own + e);
                expect(a.page.pageItemConfig, model).to.deep.equal(withExtras.pageItems);
                expect((a.page.config as any).channelSlots, model).to.deep.equal([n]);
                expect(await show(a.page), model).to.deep.equal(Array.from({ length: own + e }, (_v, i) => i));
                expect(a.sent, model).to.have.length(1);
                const fields = a.sent[0].split('~');
                expect(fields, model).to.have.length(2 + 12 + 6 * (n + 2 + e));
                const tail = fields.slice(14 + 6 * (n + 2));
                for (let k = 0; k < e; k++) {
                    expect(tail[k * 6 + 1], `${model} extra ${k}`).to.equal(`7?${own + k}`);
                }
            }
        });
    }
});

describe('lib/pages/device-page - length of the message per model', () => {
    const NAV = 'button~bSubPrev~<~65535~~~button~bSubNext~>~65535~~';
    const head = `entityUpd~${'H'.repeat(40)}~${NAV}`;
    const main = `button~dp_12?0~I~65535~${'M'.repeat(31)}~1`;
    const full = (n: number): string => `input_sel~dp_1234567890?${n}~I~65535~${'ü'.repeat(15)}~${'ü'.repeat(15)}`;
    const status = 'ü'.repeat(31);

    it('the HMI models keep the buffer of their page, the web models have no limit', () => {
        for (const model of HMI_MODELS) {
            expect(LAYOUTS.map(layout => devicePageMaxPayloadBytes(layout, model))).to.deep.equal([703, 775, 959]);
        }
        for (const model of WEB_MODELS) {
            for (const layout of LAYOUTS) {
                expect(devicePageMaxPayloadBytes(layout, model)).to.equal(Number.POSITIVE_INFINITY);
            }
        }
    });
    it('the extra elements never shorten the status line of a web model and are never cut off', () => {
        for (const layout of LAYOUTS) {
            const count = DEVICE_PAGE_LAYOUTS[layout].length + 1 + DEVICE_PAGE_EXTRA_SLOTS[layout].length;
            const elements = new Array(count).fill(0).map((_v, i) => full(i + 1));
            // the type as a number: button 1, input_sel 4
            const expected = [
                head,
                `1~dp_12?0~I~65535~${'M'.repeat(31)}~${status}`,
                ...elements.map(element => element.replace(/^input_sel~/, '4~')),
            ].join('~');
            // longer than the buffer of the HMI page
            expect(bytes(expected)).to.be.above(devicePageMaxPayloadBytes(layout, 'eu'));
            for (const model of WEB_MODELS) {
                expect(devicePagePayload(head, main, elements, status, layout, model), model).to.equal(expected);
            }
            // the same elements on an HMI model: the status line gives way (it never gets them)
            const eu = devicePagePayload(head, main, elements, status, layout, 'eu');
            expect(eu.split('~')[19]).to.not.equal(status);
        }
    });
});
