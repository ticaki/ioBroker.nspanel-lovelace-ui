import { expect } from 'chai';
import {
    CARD_DEVICE_MIN_TFT,
    DEVICE_PAGE_EMPTY_ELEMENT,
    cardDeviceOf,
    devicePageElements,
    devicePageMainElement,
    devicePageMainItem,
    devicePagePageConfig,
    devicePageSlotItem,
    devicePageStatusItem,
    fitDevicePageStatus,
    supportsCardDevice,
} from './device-page';
import {
    DEVICE_DETAIL_ROW_ROLE,
    DEVICE_PAGE_INFO_ROLE,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_FIELDS,
    DEVICE_PAGE_PROGRESS_ROLE,
    DEVICE_PAGE_STATUS_MAX_BYTES,
    defaultDevicePageConfig,
    defaultDevicePageSlots,
    devicePageConfigOf,
    devicePageProgressPercent,
    devicePageSlotAccepts,
    deviceDetailsRuntimeOf,
    fitDevicePageSlots,
    type DeviceDetailsRuntime,
    type DevicePageRuntime,
} from '../types/deviceDetails';
import { textWidth } from '../const/text-width';
import { PageDevice } from './pageDevice';
import { PageItem } from './pageItem';
import { Page } from '../classes/Page';

const DEV = 'shelly.0.wm';

const objects: Record<string, any> = {
    [DEV]: { type: 'device', common: { name: 'Waschmaschine' } },
    [`${DEV}.power`]: { type: 'state', common: { type: 'number', role: 'value.power', write: false, unit: 'W' } },
    [`${DEV}.progress`]: {
        type: 'state',
        common: { type: 'number', role: 'value', write: false, min: 0, max: 200, unit: '%' },
    },
    [`${DEV}.program`]: {
        type: 'state',
        common: { type: 'number', role: 'level', write: true, states: { 0: 'cotton', 1: 'wool' } },
    },
    [`${DEV}.phase`]: {
        type: 'state',
        common: { type: 'string', role: 'text', write: false, states: { spin: 'Schleudern', wash: 'Waschen' } },
    },
    [`${DEV}.start`]: { type: 'state', common: { type: 'boolean', role: 'button', read: false, write: true } },
    [`${DEV}.on`]: { type: 'state', common: { type: 'boolean', role: 'switch', write: true } },
    [`${DEV}.door`]: { type: 'state', common: { type: 'boolean', role: 'sensor.door', write: false } },
};
const getObject = async (id: string): Promise<ioBroker.Object | null> => Promise.resolve(objects[id] ?? null);
const ref = (id: string): { key: string; id: string } => ({ key: '', id: `${DEV}.${id}` });

const sourceSwitch = {
    type: 'switch' as const,
    role: '',
    data: {
        icon: {
            true: { value: { type: 'const', constVal: 'washing-machine' }, color: { type: 'const', constVal: 'on' } },
            false: { value: { type: 'const', constVal: 'washing-machine' }, color: { type: 'const', constVal: 'off' } },
        },
        entity1: { value: { type: 'triggered', dp: `${DEV}.on` } },
        text: { true: { type: 'const', constVal: 'WM' }, false: { type: 'const', constVal: 'WM' } },
    },
} as any;

function runtime(page: Partial<DevicePageRuntime>): { details: DeviceDetailsRuntime; page: DevicePageRuntime } {
    const p: DevicePageRuntime = {
        layout: 1,
        slots: [null, null, null, null, null, null],
        showInfo: true,
        shortPress: 'state',
        ...page,
    };
    return { details: { deviceId: DEV, entries: [ref('power')], devicePage: p }, page: p };
}

describe('lib/types/deviceDetails - device page configuration', () => {
    it('layouts: kinds and number of slots', () => {
        expect(DEVICE_PAGE_LAYOUTS[1]).to.deep.equal(['info', 'info', 'button', 'button', 'button', 'button']);
        expect(DEVICE_PAGE_LAYOUTS[2]).to.deep.equal(['value', 'progress', 'info', 'info', 'info', 'button']);
        expect(DEVICE_PAGE_LAYOUTS[3]).to.have.length(8);
        expect(DEVICE_PAGE_LAYOUTS[3].slice(6)).to.deep.equal(['switch', 'switch']);
    });
    it('normalizes: unknown layout = 1, slots cut / filled, invalid slots empty, showInfo default true', () => {
        expect(devicePageConfigOf(undefined)).to.equal(undefined);
        expect(devicePageConfigOf('x')).to.equal(undefined);
        expect(devicePageConfigOf([])).to.equal(undefined);
        const c = devicePageConfigOf({
            layout: 7,
            slots: [ref('power'), { key: 'x' }, { key: '', id: '' }, null, 5, ref('on'), ref('door'), ref('start')],
            icon: '  ',
            status: { key: '', id: '' },
        });
        expect(c).to.deep.equal({
            layout: 1,
            slots: [ref('power'), null, null, null, null, ref('on')],
            showInfo: true,
        });
        const d = devicePageConfigOf({
            layout: 3,
            slots: [{ ...ref('power'), subName: ' a ' }],
            showInfo: false,
            icon: ' robot-mower ',
            status: ref('phase'),
        });
        expect(d?.slots).to.have.length(8);
        expect(d?.slots[0]).to.deep.equal({ ...ref('power'), subName: 'a' });
        expect(d?.showInfo).to.equal(false);
        expect(d?.icon).to.equal('robot-mower');
        expect(d?.status).to.deep.equal(ref('phase'));
    });
    it('a layout change keeps the slots by position', () => {
        const slots = [ref('power'), null, ref('door'), null, null, ref('start'), ref('on'), ref('on')];
        expect(fitDevicePageSlots(slots, 1)).to.deep.equal(slots.slice(0, 6));
        expect(fitDevicePageSlots(slots.slice(0, 6), 3)).to.deep.equal([...slots.slice(0, 6), null, null]);
    });
    it('suggestion: only info / value slots, from the ticked rows in order, no status', () => {
        const entries = [ref('power'), ref('progress'), ref('phase'), { key: 'x', id: '' }, ref('door')];
        expect(defaultDevicePageSlots(entries, 1)).to.deep.equal([
            ref('power'),
            ref('progress'),
            null,
            null,
            null,
            null,
        ]);
        expect(defaultDevicePageSlots(entries, 2)).to.deep.equal([
            ref('power'),
            null,
            ref('progress'),
            ref('phase'),
            ref('door'),
            null,
        ]);
        const c = defaultDevicePageConfig(entries, 3);
        expect(c.slots.slice(0, 6)).to.deep.equal([
            ref('power'),
            ref('progress'),
            ref('phase'),
            ref('door'),
            null,
            null,
        ]);
        expect(c.slots.slice(6)).to.deep.equal([null, null]);
        expect(c.status).to.equal(undefined);
        expect(c.showInfo).to.equal(true);
    });
    it('which states fit which kind of slot', () => {
        const button = { type: 'boolean', read: false, write: true };
        const bool = { type: 'boolean', write: true };
        const roBool = { type: 'boolean', write: false };
        const num = { type: 'number', write: false };
        const str = { type: 'string' };
        expect([button, bool, roBool, num, str].map(s => devicePageSlotAccepts('button', s))).to.deep.equal([
            true,
            true,
            false,
            false,
            false,
        ]);
        expect([button, bool, roBool, num, str].map(s => devicePageSlotAccepts('switch', s))).to.deep.equal([
            false,
            true,
            false,
            false,
            false,
        ]);
        expect([button, bool, roBool, num, str].map(s => devicePageSlotAccepts('progress', s))).to.deep.equal([
            false,
            false,
            false,
            true,
            false,
        ]);
        for (const kind of ['info', 'value'] as const) {
            expect([button, bool, roBool, num, str].every(s => devicePageSlotAccepts(kind, s))).to.equal(true);
        }
    });
    it('progress: scaled by min/max, else as it is, rounded and clamped', () => {
        expect(devicePageProgressPercent(100, 0, 200)).to.equal(50);
        expect(devicePageProgressPercent(42.6)).to.equal(43);
        expect(devicePageProgressPercent(150)).to.equal(100);
        expect(devicePageProgressPercent(-3, 0, 10)).to.equal(0);
        expect(devicePageProgressPercent(5, 10, 10)).to.equal(5);
        expect(devicePageProgressPercent(null, 0, 100)).to.equal(0);
    });
    it('runtime: device page with short tap, no info without rows', () => {
        const r = deviceDetailsRuntimeOf({
            deviceId: DEV,
            shortPress: 'navigation',
            entries: [],
            devicePage: { layout: 2, slots: [], showInfo: true, status: ref('phase') },
        });
        expect(r?.devicePage).to.deep.equal({
            layout: 2,
            slots: [null, null, null, null, null, null],
            showInfo: false,
            shortPress: 'navigation',
            status: ref('phase'),
        });
        const without = deviceDetailsRuntimeOf({ deviceId: DEV, entries: [ref('power')] });
        expect(without).to.deep.equal({ deviceId: DEV, entries: [ref('power')] });
        const info = deviceDetailsRuntimeOf({ deviceId: DEV, entries: [ref('power')], devicePage: { layout: 1 } });
        expect(info?.devicePage?.showInfo).to.equal(true);
        expect(info?.devicePage?.shortPress).to.equal('state');
    });
});

describe('lib/pages/device-page - panel support', () => {
    const t = (model: any, isVirtual: boolean, displayVersion: string): boolean =>
        supportsCardDevice({ model, isVirtual, displayVersion });
    it('eu from the minimum TFT on, web-l and eu web clones always', () => {
        expect(t('eu', false, CARD_DEVICE_MIN_TFT)).to.equal(true);
        expect(t('eu', false, '6.1.1')).to.equal(false);
        expect(t('eu', false, '')).to.equal(false);
        expect(t('web-l', true, '')).to.equal(true);
        expect(t('eu', true, '')).to.equal(true);
    });
    it('us-l, us-p and web-p fall back to the detail page', () => {
        expect(t('us-l', false, '9.9.9')).to.equal(false);
        expect(t('us-p', false, '9.9.9')).to.equal(false);
        expect(t('web-p', true, '')).to.equal(false);
        expect(t('us-l', true, '')).to.equal(false);
    });
    it('HMI page of the layout', () => {
        expect([cardDeviceOf(1), cardDeviceOf(2), cardDeviceOf(3)]).to.deep.equal([
            'cardDevice1',
            'cardDevice2',
            'cardDevice3',
        ]);
    });
});

describe('lib/pages/device-page - status line', () => {
    it('a short text stays, field 6 of main is replaced', () => {
        expect(fitDevicePageStatus('Schleudern, noch 23 min', 1, 'eu')).to.equal('Schleudern, noch 23 min');
        expect(devicePageMainElement('switch~dp_3?0~I~123~WM~1', 'Schleudern')).to.equal(
            'switch~dp_3?0~I~123~WM~Schleudern',
        );
    });
    it('without status field 6 is empty; without main the status line stays', () => {
        expect(devicePageMainElement('switch~dp_3?0~I~123~WM~1', '')).to.equal('switch~dp_3?0~I~123~WM~');
        expect(devicePageMainElement('', '')).to.equal(DEVICE_PAGE_EMPTY_ELEMENT);
        expect(devicePageMainElement('', 'Fertig')).to.equal('~~~~~Fertig');
    });
    it('field widths of the HMI: status line 390 px in every layout, a field per slot kind of the layout', () => {
        for (const layout of [1, 2, 3] as const) {
            expect(DEVICE_PAGE_FIELDS[layout].status).to.equal(390);
            for (const kind of DEVICE_PAGE_LAYOUTS[layout]) {
                expect(DEVICE_PAGE_FIELDS[layout].slots[kind], `${layout} ${kind}`).to.not.equal(undefined);
            }
        }
        expect(DEVICE_PAGE_FIELDS[2].slots.value).to.deep.equal({ name: 190, value: 190, valueFont: 4 });
    });
    it('a too long text is cut at the end with "..." to the width of the line', () => {
        const long = 'Fehler: Wassertank leer, bitte nachfüllen und die Tür der Maschine schließen';
        const out = fitDevicePageStatus(long, 2, 'eu');
        expect(out.endsWith('...')).to.equal(true);
        expect(long.startsWith(out.slice(0, -3))).to.equal(true);
        expect(textWidth(out, 0, 'eu')).to.be.at.most(390);
        expect(textWidth(`${long.slice(0, out.length - 2)}...`, 0, 'eu')).to.be.above(390);
    });
    it('never more bytes than the text field holds, no line breaks', () => {
        const out = fitDevicePageStatus('ü'.repeat(40), 1, 'web-l');
        expect(Buffer.byteLength(out, 'utf8')).to.be.at.most(DEVICE_PAGE_STATUS_MAX_BYTES);
        expect(fitDevicePageStatus('a\r\nb', 1, 'eu')).to.equal('a b');
    });
    it('the status item: text of common.states, value with unit, boolean on/off - all read only', () => {
        const states = devicePageStatusItem(DEV, ref('phase'), objects[`${DEV}.phase`].common) as any;
        expect(states.type).to.equal('text');
        expect(states.data.entity2.value.commonStates).to.deep.equal({ mode: 'text', keepValue: true });
        const unit = devicePageStatusItem(DEV, ref('power'), objects[`${DEV}.power`].common) as any;
        expect(unit.type).to.equal('text');
        expect(unit.data.entity2).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.power` } });
        const bool = devicePageStatusItem(DEV, ref('on'), objects[`${DEV}.on`].common) as any;
        expect(bool.type).to.equal('text');
        expect(bool.data.text1.true.constVal).to.equal('on');
        expect(bool.data.text1.false.constVal).to.equal('off');
        const select = devicePageStatusItem(DEV, ref('program'), objects[`${DEV}.program`].common) as any;
        expect(select.type).to.equal('text');
    });
});

describe('lib/pages/device-page - slots', () => {
    const c = (id: string): any => objects[`${DEV}.${id}`].common;
    it('info: read only text, a writable selection stays input_sel', () => {
        expect(devicePageSlotItem(DEV, 'info', ref('power'), c('power'), 'P')?.type).to.equal('text');
        expect(devicePageSlotItem(DEV, 'info', ref('on'), c('on'), 'On')?.type).to.equal('text');
        expect(devicePageSlotItem(DEV, 'info', ref('program'), c('program'), 'Prog')?.type).to.equal('input_sel');
    });
    it('value: always text, also a selection', () => {
        const item = devicePageSlotItem(DEV, 'value', ref('program'), c('program'), 'Prog') as any;
        expect(item.type).to.equal('text');
        expect(item.data.entity2.value.commonStates.mode).to.equal('text');
    });
    it('progress: text with the progress role, the color of the group as icon color; number only', () => {
        const item = devicePageSlotItem(DEV, 'progress', ref('progress'), c('progress'), 'Fortschritt') as any;
        expect(item.type).to.equal('text');
        expect(item.role).to.equal(DEVICE_PAGE_PROGRESS_ROLE);
        expect(item.data.entity2.value.dp).to.equal(`${DEV}.progress`);
        expect(devicePageSlotItem(DEV, 'progress', ref('phase'), c('phase'), 'x')).to.equal(undefined);
    });
    it('button: read false writes true (entity1.set), a writable boolean is switched (entity1.value)', () => {
        const press = devicePageSlotItem(DEV, 'button', ref('start'), c('start'), 'Start') as any;
        expect(press.type).to.equal('button');
        expect(press.role).to.equal(DEVICE_DETAIL_ROW_ROLE);
        expect(press.data.entity1.set.dp).to.equal(`${DEV}.start`);
        const toggle = devicePageSlotItem(DEV, 'button', ref('on'), c('on'), 'An') as any;
        expect(toggle.type).to.equal('button');
        expect(toggle.data.entity1.value.dp).to.equal(`${DEV}.on`);
        expect(devicePageSlotItem(DEV, 'button', ref('door'), c('door'), 'x')).to.equal(undefined);
    });
    it('switch: the switch row (OnOff), writable boolean only', () => {
        const item = devicePageSlotItem(DEV, 'switch', ref('on'), c('on'), 'An') as any;
        expect(item.type).to.equal('switch');
        expect(item.role).to.equal(DEVICE_DETAIL_ROW_ROLE);
        expect(devicePageSlotItem(DEV, 'switch', ref('start'), c('start'), 'x')).to.equal(undefined);
    });
});

describe('lib/pages/device-page - elements', () => {
    const tr = (k: string): string => k;
    for (const layout of [1, 2, 3] as const) {
        it(`layout ${layout}: main, one item per slot, info and status`, async () => {
            const { details, page } = runtime({
                layout,
                slots: DEVICE_PAGE_LAYOUTS[layout].map(() => null),
                status: ref('phase'),
            });
            const content = await devicePageElements(sourceSwitch, details, page, getObject, tr, 'de');
            expect(content.headline).to.equal('Waschmaschine');
            expect(content.slotCount).to.equal(DEVICE_PAGE_LAYOUTS[layout].length);
            expect(content.elements).to.have.length(DEVICE_PAGE_LAYOUTS[layout].length + 3);
            expect(content.elements[0]?.type).to.equal('switch');
            expect(content.elements.slice(1, content.slotCount + 1).every(e => e === undefined)).to.equal(true);
            expect(content.elements[content.slotCount + 1]?.role).to.equal(DEVICE_PAGE_INFO_ROLE);
            expect(content.elements[content.slotCount + 2]?.type).to.equal('text');
            const config = devicePagePageConfig('dp_3', layout, 'none', content);
            expect(config.config?.card).to.equal(`cardDevice${layout}`);
        });
    }
    it('slots by kind, missing or unfitting states stay empty and are reported', async () => {
        const { details, page } = runtime({
            layout: 2,
            slots: [ref('power'), ref('progress'), ref('program'), ref('gone'), null, ref('door')],
            showInfo: false,
        });
        const content = await devicePageElements(sourceSwitch, details, page, getObject, tr, 'de');
        const types = content.elements.map(e => e?.type);
        expect(types).to.deep.equal([
            'switch',
            'text',
            'text',
            'input_sel',
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
        ]);
        expect(content.elements[2]?.role).to.equal(DEVICE_PAGE_PROGRESS_ROLE);
        expect(content.skipped).to.deep.equal([`${DEV}.gone`, `${DEV}.door`]);
    });
    it('slot names: duplicates among the slots get the suffix, never shortened', async () => {
        const { details, page } = runtime({
            slots: [
                { key: '', id: `${DEV}.power`, subName: 'Pumpe mit einem sehr langen Namen' },
                ref('door'),
                null,
                null,
                null,
                null,
            ],
        });
        const content = await devicePageElements(sourceSwitch, details, page, getObject, tr, 'de');
        const item = content.elements[1] as any;
        expect(item.data.text.true.constVal).to.equal('power Pumpe mit einem sehr langen Namen');
    });
});

describe('lib/pages/device-page - main', () => {
    it('short tap state: the item itself, own icon, colors kept, no device page inside', () => {
        const { details, page } = runtime({ icon: 'washing-machine-alert' });
        const main = devicePageMainItem(sourceSwitch, details, page) as any;
        expect(main.type).to.equal('switch');
        expect(main.data.icon.true.value.constVal).to.equal('washing-machine-alert');
        expect(main.data.icon.false.color.constVal).to.equal('off');
        expect(main.deviceDetails).to.deep.equal({ deviceId: DEV, entries: details.entries });
        // the source is not changed
        expect(sourceSwitch.data.icon.true.value.constVal).to.equal('washing-machine');
    });
    it('short tap none: a text', () => {
        const { details, page } = runtime({ shortPress: 'none' });
        const main = devicePageMainItem({ ...sourceSwitch, type: 'text' }, details, page);
        expect(main.type).to.equal('text');
    });
    it('short tap navigation / popup: a text with icon and name, without action', () => {
        const { details, page } = runtime({ shortPress: 'navigation' });
        const nav = devicePageMainItem(
            {
                ...sourceSwitch,
                type: 'button',
                data: { ...sourceSwitch.data, setNavi: { type: 'const', constVal: 'x' } },
            },
            details,
            page,
        ) as any;
        expect(nav.type).to.equal('text');
        expect(nav.data.setNavi).to.equal(undefined);
        expect(nav.data.text.true.constVal).to.equal('WM');
        const popup = runtime({ shortPress: 'popup', icon: 'lamp' });
        const light = devicePageMainItem(
            {
                type: 'light',
                data: {
                    icon: sourceSwitch.data.icon,
                    headline: { type: 'const', constVal: 'Licht' },
                    entity1: { value: { type: 'triggered', dp: 'alias.0.l.ON' } },
                },
            } as any,
            popup.details,
            popup.page,
        ) as any;
        expect(light.type).to.equal('text');
        expect(light.data.text.false.constVal).to.equal('Licht');
        expect(light.data.icon.true.value.constVal).to.equal('lamp');
        expect(light.data.entity1.value.dp).to.equal('alias.0.l.ON');
    });
});

/**
 * A PageDevice without constructor: page items with fixed payloads.
 *
 * @param slotCount number of slots
 * @param payloads payloads of the page items (index = item number), undefined = no item
 */
function fakeDevicePage(slotCount: number, payloads: (string | undefined)[]): { page: PageDevice; sent: string[] } {
    const sent: string[] = [];
    const page = Object.create(PageDevice.prototype) as PageDevice;
    Object.assign(page, {
        headline: 'Waschmaschine',
        slotCount,
        layout: 1,
        visibility: true,
        refreshTimeout: null,
        adapter: { setTimeout: (): number => 1, clearTimeout: (): void => undefined },
        log: { debug: (): void => undefined },
        library: { getTranslation: (s: string): string => s },
        basePanel: { info: { nspanel: { model: 'eu' } } },
        directParentPage: { id: '3' },
        pageItems: payloads.map(p => (p === undefined ? undefined : { getPageItemPayload: async () => p })),
        sendToPanel: (msg: string): void => {
            sent.push(msg);
        },
    });
    return { page, sent };
}

describe('lib/pages/pageDevice - payload', () => {
    const nav = 'button~bUp~';
    for (const layout of [1, 2, 3] as const) {
        it(`layout ${layout}: heading, navigation, main with status, ${DEVICE_PAGE_LAYOUTS[layout].length} slots, info`, async () => {
            const n = DEVICE_PAGE_LAYOUTS[layout].length;
            const payloads: (string | undefined)[] = ['switch~dp_3?0~M~1~WM~1'];
            for (let i = 1; i <= n; i++) {
                payloads.push(i === 2 ? undefined : `text~dp_3?${i}~I~2~S${i}~${i} W`);
            }
            payloads.push(`button~dp_3?${n + 1}~i~3~~1`);
            payloads.push(`text~dp_3?${n + 2}~x~4~~Schleudern`);
            const { page, sent } = fakeDevicePage(n, payloads);
            await page.update();
            expect(sent).to.have.length(1);
            const fields = sent[0].split('~');
            expect(fields[0]).to.equal('entityUpd');
            expect(fields[1]).to.equal('Waschmaschine');
            expect(sent[0]).to.contain(nav);
            // heading + navigation (12) + main + slots + info
            expect(fields).to.have.length(2 + 12 + 6 * (n + 2));
            const elements = fields.slice(14);
            expect(elements.slice(0, 6)).to.deep.equal(['switch', 'dp_3?0', 'M', '1', 'WM', 'Schleudern']);
            // empty slot 2
            expect(elements.slice(12, 18)).to.deep.equal(['', '', '', '', '', '']);
            expect(elements.slice(6 * (n + 1), 6 * (n + 1) + 2)).to.deep.equal(['button', `dp_3?${n + 1}`]);
        });
    }
    it('no info and no status: empty element, field 6 of main empty', async () => {
        const { page, sent } = fakeDevicePage(6, ['text~dp_3?0~M~1~WM~5 W']);
        await page.update();
        const elements = sent[0].split('~').slice(14);
        expect(elements.slice(0, 6)).to.deep.equal(['text', 'dp_3?0', 'M', '1', 'WM', '']);
        expect(elements).to.have.length(6 * 8);
        expect(elements.slice(42)).to.deep.equal(['', '', '', '', '', '']);
    });
    it('no long press on the device page: buttonPress3 falls back to the tap', async () => {
        const { page } = fakeDevicePage(6, []);
        expect(await page.onButtonPress3()).to.equal(false);
    });
});

describe('lib/pages/pageItem - device page', () => {
    type FakePage = {
        id: string;
        config: any;
        deleted: boolean;
        directParentPage: any;
        directChildPage: any;
        basePanel: any;
        init: () => Promise<void>;
        delete: () => Promise<void>;
    };
    const noop = (): void => undefined;

    function setup(nspanel: { model: string; displayVersion: string }, isVirtual = false): any {
        const created: FakePage[] = [];
        const parent: Record<string, any> = { id: '3', name: 'p', alwaysOn: 'none', directChildPage: undefined };
        const panel: Record<string, any> = {
            active: parent,
            isVirtual,
            info: { nspanel },
            statesControler: { getObjectAsync: getObject },
            newPage: (config: { id: string }, pageConfig: unknown): FakePage => {
                const page: FakePage = {
                    id: config.id,
                    config: pageConfig,
                    deleted: false,
                    directParentPage: undefined,
                    directChildPage: undefined,
                    basePanel: panel,
                    init: async () => Promise.resolve(),
                    delete: async () => {
                        page.deleted = true;
                        return Promise.resolve();
                    },
                };
                created.push(page);
                return page;
            },
            getActivePage: (): unknown => panel.active,
            setActivePage: async (page: unknown): Promise<void> => {
                panel.active = page;
                return Promise.resolve();
            },
        };
        parent.basePanel = panel;
        const makeItem = (onPage: any, config: any, dataItems: any): PageItem => {
            const it = Object.create(PageItem.prototype) as PageItem;
            Object.assign(it, {
                id: `${onPage.id}?0`,
                log: { debug: noop, warn: noop, error: noop, info: noop, silly: noop },
                library: { getTranslation: (k: string) => k, getLocalLanguage: () => 'de' },
                adapter: { unload: false },
                parent: onPage,
                config,
                dataItems,
            });
            return it;
        };
        const details = deviceDetailsRuntimeOf({
            deviceId: DEV,
            entries: [ref('power')],
            devicePage: { layout: 2, slots: [ref('power')], status: ref('phase') },
        });
        const item = makeItem(parent, { ...sourceSwitch, deviceDetails: details }, { type: 'switch', data: {} });
        return { panel, parent, created, item, makeItem };
    }

    it('eu with the TFT: the long press opens the device page dp_<page> below the page', async () => {
        const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
        expect(await f.item.onCommandLongPress('button', '')).to.equal(true);
        expect(f.created).to.have.length(1);
        const page = f.created[0];
        expect(page.id).to.equal('dp_3');
        expect(page.config.config.card).to.equal('cardDevice2');
        expect(page.config.config.slotCount).to.equal(6);
        expect(page.directParentPage).to.equal(f.parent);
        expect(f.panel.active).to.equal(page);
    });
    for (const [model, version, virtual] of [
        ['us-l', '9.0.0', false],
        ['us-p', '9.0.0', false],
        ['web-p', '', true],
        ['eu', '6.1.1', false],
        ['eu', '', false],
    ] as const) {
        it(`falls back to the detail page: ${model} ${version || 'no version'}${virtual ? ' (web)' : ''}`, async () => {
            const f = setup({ model, displayVersion: version }, virtual);
            await f.item.onCommandLongPress('button', '');
            expect(f.created).to.have.length(1);
            expect(f.created[0].id).to.equal('dd_3');
            expect(f.created[0].config.config.card).to.equal('cardEntities');
        });
    }
    for (const model of ['web-l', 'eu'] as const) {
        it(`web panel ${model}: device page`, async () => {
            const f = setup({ model, displayVersion: '' }, true);
            await f.item.onCommandLongPress('button', '');
            expect(f.created[0].id).to.equal('dp_3');
        });
    }
    it('navigation: info → detail page → back → device page → back → page of the item', async () => {
        const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
        await f.item.onCommandLongPress('button', '');
        const devicePage = f.created[0];
        const infoConfig = devicePage.config.config.elements[7];
        expect(infoConfig.role).to.equal(DEVICE_PAGE_INFO_ROLE);
        const info = f.makeItem(devicePage, infoConfig, { type: 'button', role: DEVICE_PAGE_INFO_ROLE, data: {} });
        await info.onCommand('button', '');
        const detailPage = f.created[1];
        expect(detailPage.id).to.equal('dd_3');
        expect(detailPage.config.config.card).to.equal('cardEntities');
        expect(detailPage.directParentPage).to.equal(devicePage);
        expect(devicePage.directChildPage).to.equal(detailPage);
        expect(f.panel.active).to.equal(detailPage);
        Page.prototype.goLeft.call(detailPage, true);
        await Promise.resolve();
        expect(f.panel.active).to.equal(devicePage);
        Page.prototype.goLeft.call(devicePage, true);
        await Promise.resolve();
        expect(f.panel.active).to.equal(f.parent);
    });
    it('a second long press replaces the device page', async () => {
        const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
        await f.item.onCommandLongPress('button', '');
        f.panel.active = f.parent;
        await f.item.onCommandLongPress('button', '');
        expect(f.created[0].deleted).to.equal(true);
        expect(f.parent.directChildPage).to.equal(f.created[1]);
    });

    describe('taps', () => {
        const calls = { setTrue: 0, flip: 0, written: [] as unknown[] };
        const di = (writeable: boolean): any => ({
            writeable,
            common: { read: true },
            setStateTrue: async () => {
                calls.setTrue++;
                return Promise.resolve();
            },
            setStateFlip: async () => {
                calls.flip++;
                return Promise.resolve();
            },
            setState: async (v: unknown) => {
                calls.written.push(v);
                return Promise.resolve();
            },
        });
        const onDevicePage = { id: 'dp_3', card: 'cardDevice1', isScreensaver: false, basePanel: {} };
        beforeEach(() => {
            calls.setTrue = 0;
            calls.flip = 0;
            calls.written = [];
        });
        it('button slot with a writable boolean switches it', async () => {
            const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            const it = f.makeItem(
                onDevicePage,
                { type: 'button' },
                {
                    type: 'button',
                    role: DEVICE_DETAIL_ROW_ROLE,
                    data: { entity1: { value: di(true) } },
                },
            );
            await it.onCommand('button', '');
            expect(calls).to.deep.include({ flip: 1, setTrue: 0 });
        });
        it('button slot with read false writes true', async () => {
            const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            const it = f.makeItem(
                onDevicePage,
                { type: 'button' },
                {
                    type: 'button',
                    role: DEVICE_DETAIL_ROW_ROLE,
                    data: { entity1: { set: di(true) } },
                },
            );
            await it.onCommand('button', '');
            expect(calls).to.deep.include({ flip: 0, setTrue: 1 });
        });
        it('switch slot: OnOff writes the value', async () => {
            const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            const value = { ...di(true), type: 'boolean', trueType: () => 'boolean' };
            const it = f.makeItem(
                onDevicePage,
                { type: 'switch' },
                {
                    type: 'switch',
                    role: DEVICE_DETAIL_ROW_ROLE,
                    data: { entity1: { value } },
                },
            );
            await it.onCommand('OnOff', '1');
            expect(calls.written).to.deep.equal([true]);
        });
        it('main (short tap state): the tap switches the state like on the page of the item', async () => {
            const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            const it = f.makeItem(
                onDevicePage,
                { type: 'switch', deviceDetails: { deviceId: DEV, entries: [] } },
                { type: 'switch', data: { entity1: { set: di(true) } } },
            );
            await it.onCommand('button', '');
            expect(calls).to.deep.include({ flip: 1, setTrue: 0 });
        });
        it('main (short tap none / navigation / popup): a text, the tap does nothing', async () => {
            const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            const it = f.makeItem(
                onDevicePage,
                { type: 'text' },
                { type: 'text', data: { entity1: { value: di(true) } } },
            );
            await it.onCommand('button', '');
            expect(calls).to.deep.include({ flip: 0, setTrue: 0 });
        });
    });
});
