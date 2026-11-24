import { expect } from 'chai';
import {
    CARD_DEVICE_MIN_TFT,
    DEVICE_PAGE_EMPTY_ELEMENT,
    cardDeviceOf,
    devicePageChannelAdminItem,
    devicePageChannelElement,
    cutToBytes,
    devicePageChannelSlotItem,
    devicePageChannels,
    devicePageClampElement,
    devicePageElements,
    devicePageMainElement,
    devicePageMainItem,
    devicePageMaxPayloadBytes,
    devicePageNavigationSlotItem,
    devicePagePageConfig,
    devicePagePayload,
    devicePageSlotItem,
    devicePageStatusIconElement,
    devicePageStatusIconItem,
    devicePageStatusItem,
    devicePageStatusMessage,
    reportMissingDevicePageTarget,
    splitDevicePageStatus,
    supportsCardDevice,
} from './device-page';
import {
    DEVICE_DETAIL_ROW_ROLE,
    DEVICE_PAGE_INFO_ROLE,
    DEVICE_PAGE_LAYOUTS,
    DEVICE_PAGE_FIELDS,
    DEVICE_PAGE_PROGRESS_ROLE,
    DEVICE_PAGE_RECEIVE_BYTES,
    DEVICE_PAGE_STATUS_COMMAND,
    DEVICE_PAGE_STATUS_INTERVAL_MS,
    DEVICE_PAGE_STATUS_MAX_BYTES,
    DEVICE_PAGE_STATUS_MAX_PARTS,
    DEVICE_PAGE_TEXT_MAX_BYTES,
    defaultDevicePageConfig,
    defaultDevicePageSlots,
    devicePageConfigOf,
    devicePageHasStatusIcons,
    devicePageProgressPercent,
    DEVICE_PAGE_CHANNEL_ROLES,
    devicePageSlotAccepts,
    devicePageSlotAcceptsChannel,
    devicePageSlotAcceptsNavigation,
    devicePageChannelTakesNavigation,
    devicePageSlotTakesNavigation,
    devicePageSlotTargetOf,
    DEVICE_PAGE_NAVIGATION_ICON,
    devicePageSlotFields,
    devicePageSlotHasLook,
    devicePageSlotLookOf,
    devicePageSlotTakesLongPress,
    deviceShortPressOf,
    deviceDetailsRuntimeOf,
    fitDevicePageSlots,
    type DeviceDetailsRuntime,
    type DevicePageRuntime,
} from '../types/deviceDetails';
import { textWidth } from '../const/text-width';
import { PageDevice } from './pageDevice';
import { PageItem } from './pageItem';
import { Dataitem } from '../controller/data-item';
import { adminPageItemToScriptItem } from '../configuration/admin-page-item';
import { emptyChannelValueConfig } from '../types/adminShareConfig';
import { isCardDeviceType } from '../types/function-and-const';
import { Page } from '../classes/Page';
import { Color } from '../const/Color';
import { BATTERY_ICON_READ } from '../templates/text';

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
/** an own data point of the user, outside the device */
const OWN = '0_userdata.0.wm.message';
objects[OWN] = { type: 'state', common: { type: 'string', role: 'text', write: true } };
objects['0_userdata.0.wm.energy'] = {
    type: 'state',
    common: { type: 'number', role: 'value.energy', write: false, unit: 'kWh' },
};
objects['0_userdata.0.wm'] = { type: 'folder', common: { name: 'wm' } };
const getObject = async (id: string): Promise<ioBroker.Object | null> => Promise.resolve(objects[id] ?? null);
const ref = (id: string): { key: string; id: string } => ({ key: '', id: `${DEV}.${id}` });
/**
 * @param used status slots of layout 1 that are already given
 * @returns nulls for the other status slots of layout 1 (their number comes from DEVICE_PAGE_LAYOUTS only)
 */
const statusNulls = (used: number): null[] => DEVICE_PAGE_LAYOUTS[1].slice(6 + used).map(() => null);

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
        slots: DEVICE_PAGE_LAYOUTS[page.layout ?? 1].map(() => null),
        showInfo: true,
        shortPress: 'state',
        ...page,
    };
    return { details: { deviceId: DEV, entries: [ref('power')], devicePage: p }, page: p };
}

describe('lib/types/deviceDetails - device page configuration', () => {
    it('layouts: kinds and number of slots', () => {
        expect(DEVICE_PAGE_LAYOUTS[1].slice(0, 6)).to.deep.equal([
            'info',
            'info',
            'button',
            'button',
            'button',
            'button',
        ]);
        // the status icons follow the six slots, how many comes from the table only
        expect(DEVICE_PAGE_LAYOUTS[1].slice(6).length).to.be.above(0);
        expect(DEVICE_PAGE_LAYOUTS[1].slice(6).every(k => k === 'status')).to.equal(true);
        expect(DEVICE_PAGE_LAYOUTS[2].includes('status')).to.equal(false);
        expect(DEVICE_PAGE_LAYOUTS[3].includes('status')).to.equal(false);
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
            slots: [ref('power'), null, null, null, null, ref('on'), ref('door'), ref('start'), ...statusNulls(2)],
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
    it('status line with an own data point: kept with its flag, also without id; old configurations unchanged', () => {
        const custom = devicePageConfigOf({ layout: 1, status: { key: 'x', id: ' 0_userdata.0.msg ', custom: true } });
        expect(custom?.status).to.deep.equal({ key: '', id: '0_userdata.0.msg', custom: true });
        const pending = devicePageConfigOf({ layout: 1, status: { key: '', id: '', custom: true } });
        expect(pending?.status).to.deep.equal({ key: '', id: '', custom: true });
        // no flag (or not true): a state of the device as before
        expect(devicePageConfigOf({ layout: 1, status: ref('phase') })?.status).to.deep.equal(ref('phase'));
        expect(devicePageConfigOf({ layout: 1, status: { ...ref('phase'), custom: false } })?.status).to.deep.equal(
            ref('phase'),
        );
        expect(devicePageConfigOf({ layout: 1, status: { key: '', id: '', custom: 1 } })).to.not.have.property(
            'status',
        );
    });
    it('a layout change keeps the slots by position', () => {
        const slots = [ref('power'), null, ref('door'), null, null, ref('start'), ref('on'), ref('on')];
        expect(fitDevicePageSlots(slots, 1)).to.deep.equal([...slots, ...statusNulls(2)]);
        expect(fitDevicePageSlots(slots.slice(0, 6), 3)).to.deep.equal([...slots.slice(0, 6), null, null]);
        expect(fitDevicePageSlots(slots, 2)).to.deep.equal(slots.slice(0, 6));
    });
    it('an older layout 1 with 6 slots stays valid: the status slots are empty', () => {
        const old = {
            layout: 1,
            slots: [ref('power'), ref('door'), ref('start'), null, null, ref('on')],
            showInfo: true,
        };
        const c = devicePageConfigOf(old);
        expect(c?.slots).to.have.length(DEVICE_PAGE_LAYOUTS[1].length);
        expect(c?.slots.slice(0, 6)).to.deep.equal(old.slots);
        expect(c?.slots.slice(6).every(s => s === null)).to.equal(true);
        expect(devicePageHasStatusIcons(1, c?.slots ?? [])).to.equal(false);
        const runtimePage = deviceDetailsRuntimeOf({ deviceId: DEV, entries: [], devicePage: old })?.devicePage;
        expect(runtimePage?.slots).to.have.length(DEVICE_PAGE_LAYOUTS[1].length);
    });
    it('own icon: kept (trimmed) only on a status slot, an empty one is left out', () => {
        const first = DEVICE_PAGE_LAYOUTS[1].indexOf('status');
        const slots: unknown[] = DEVICE_PAGE_LAYOUTS[1].map(() => null);
        slots[0] = { ...ref('power'), icon: 'filter' };
        slots[first] = { ...ref('door'), icon: ' delete-empty ' };
        slots[first + 1] = { ...ref('on'), icon: '  ' };
        const c = devicePageConfigOf({ layout: 1, slots, status: { ...ref('phase'), icon: 'x' } });
        expect(c?.slots[0]).to.deep.equal(ref('power'));
        expect(c?.slots[first]).to.deep.equal({ ...ref('door'), icon: 'delete-empty' });
        expect(c?.slots[first + 1]).to.deep.equal(ref('on'));
        expect(c?.status).to.deep.equal(ref('phase'));
        // a layout change by position: the icon does not travel to another kind
        expect(fitDevicePageSlots(c?.slots ?? [], 3)[first]).to.deep.equal(ref('door'));
        expect(fitDevicePageSlots(c?.slots ?? [], 1)[first]).to.deep.equal({ ...ref('door'), icon: 'delete-empty' });
    });
    it('status icons: shown when at least one status slot is set; narrower info rows then', () => {
        const slots: ({ key: string; id: string } | null)[] = DEVICE_PAGE_LAYOUTS[1].map(() => null);
        slots[0] = ref('power');
        expect(devicePageHasStatusIcons(1, slots)).to.equal(false);
        slots[DEVICE_PAGE_LAYOUTS[1].length - 1] = ref('door');
        expect(devicePageHasStatusIcons(1, slots)).to.equal(true);
        expect(devicePageHasStatusIcons(3, [ref('power')])).to.equal(false);
        expect(devicePageSlotFields(1, 'info', false)).to.deep.equal({ name: 164, value: 110 });
        expect(devicePageSlotFields(1, 'info', true)).to.deep.equal({ name: 86, value: 110 });
        expect(devicePageSlotFields(1, 'button', true)).to.deep.equal({ name: 104 });
        expect(devicePageSlotFields(1, 'status', true)).to.equal(undefined);
        expect(devicePageSlotFields(3, 'info', true)).to.deep.equal({ name: 125, value: 125 });
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
            ...statusNulls(0),
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
        for (const kind of ['info', 'value', 'status'] as const) {
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
        const custom = deviceDetailsRuntimeOf({
            deviceId: DEV,
            entries: [],
            devicePage: { layout: 2, slots: [], showInfo: true, status: { key: '', id: OWN, custom: true } },
        });
        expect(custom?.devicePage?.status).to.deep.equal({ key: '', id: OWN, custom: true });
        const pending = deviceDetailsRuntimeOf({
            deviceId: DEV,
            entries: [],
            devicePage: { layout: 2, slots: [], showInfo: true, status: { key: '', id: '', custom: true } },
        });
        expect(pending?.devicePage).to.not.have.property('status');
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
        expect(splitDevicePageStatus('Schleudern, noch 23 min', 1, 'eu')).to.deep.equal(['Schleudern, noch 23 min']);
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
            for (const kind of DEVICE_PAGE_LAYOUTS[layout].filter(k => k !== 'status')) {
                expect(DEVICE_PAGE_FIELDS[layout].slots[kind], `${layout} ${kind}`).to.not.equal(undefined);
            }
        }
        expect(DEVICE_PAGE_FIELDS[2].slots.value).to.deep.equal({ name: 190, value: 190, valueFont: 4 });
    });
    const LONG = 'Fehler: Wassertank leer, bitte nachfüllen und die Tür der Maschine schließen';
    const bytes = (text: string): number => Buffer.byteLength(text, 'utf8');
    const fitsLine = (part: string): boolean =>
        textWidth(part, 0, 'eu') <= 390 && bytes(part) <= DEVICE_PAGE_STATUS_MAX_BYTES;
    it('a text wider than the line is split at spaces into parts that fit, in every layout', () => {
        expect(textWidth(LONG, 0, 'eu')).to.be.above(390);
        for (const layout of [1, 2, 3] as const) {
            expect(splitDevicePageStatus(LONG, layout, 'eu')).to.deep.equal([
                'Fehler: Wassertank leer, bitte nachfüllen und',
                'die Tür der Maschine schließen',
            ]);
        }
        const three = splitDevicePageStatus(
            'Reinigung läuft, Wohnzimmer und Küche fertig, noch 23 min bis zur Rückkehr an die Ladestation',
            1,
            'eu',
        );
        expect(three).to.deep.equal([
            'Reinigung läuft, Wohnzimmer und Küche',
            'fertig, noch 23 min bis zur Rückkehr an die',
            'Ladestation',
        ]);
        expect(three.every(fitsLine)).to.equal(true);
        // empty and short texts: one part
        expect(splitDevicePageStatus('', 2, 'eu')).to.deep.equal(['']);
        expect(splitDevicePageStatus('Kurz', 2, 'eu')).to.deep.equal(['Kurz']);
    });
    it('a text that fits the line but not the 63 bytes of the text field is split too, never inside a character', () => {
        // 40 x 'i' and 12 x 'ü': narrow, but 64 bytes
        const text = `${'i'.repeat(40)}${'ü'.repeat(12)}`;
        expect(textWidth(text, 0, 'eu')).to.be.at.most(390);
        expect(bytes(text)).to.equal(64);
        expect(splitDevicePageStatus(text, 3, 'eu')).to.deep.equal([`${'i'.repeat(40)}${'ü'.repeat(11)}`, 'ü']);
        // one byte less: one part
        expect(splitDevicePageStatus(text.slice(1), 3, 'eu')).to.deep.equal([text.slice(1)]);
        // 2-byte characters, words: every part within the bytes
        const cyrillic = splitDevicePageStatus(
            'Привет мир, это длинный текст статуса для проверки разбиения на части строки',
            1,
            'eu',
        );
        expect(cyrillic).to.deep.equal([
            'Привет мир, это длинный текст',
            'статуса для проверки разбиения на',
            'части строки',
        ]);
        expect(cyrillic.every(fitsLine)).to.equal(true);
    });
    it('splits behind comma, full stop, semicolon and dash - not inside a number', () => {
        expect(splitDevicePageStatus(`${'a'.repeat(38)},${'b'.repeat(20)};ccc`, 1, 'eu')).to.deep.equal([
            `${'a'.repeat(38)},`,
            `${'b'.repeat(20)};ccc`,
        ]);
        expect(splitDevicePageStatus(`${'a'.repeat(30)}–${'b'.repeat(20)}`, 1, 'eu')).to.deep.equal([
            `${'a'.repeat(30)}–`,
            'b'.repeat(20),
        ]);
        // the comma of a number is no place to split: the word is cut where the line ends
        expect(
            splitDevicePageStatus('Wert 123456789012345678901234567890123,567890123456789 Ende', 1, 'eu'),
        ).to.deep.equal(['Wert', '123456789012345678901234567890123,56789', '0123456789 Ende']);
    });
    it('a word that is too long on its own is cut at a character', () => {
        expect(
            splitDevicePageStatus('Donaudampfschifffahrtsgesellschaftskapitänsmützenabzeichen und mehr', 1, 'eu'),
        ).to.deep.equal(['Donaudampfschifffahrtsgesellschaftskapitän', 'smützenabzeichen und mehr']);
    });
    it('at most 3 parts: the third one ends with "..." when text is left', () => {
        expect(DEVICE_PAGE_STATUS_MAX_PARTS).to.equal(3);
        const letters = splitDevicePageStatus('a'.repeat(200), 2, 'eu');
        expect(letters).to.deep.equal(['a'.repeat(39), 'a'.repeat(39), `${'a'.repeat(37)}...`]);
        const umlauts = splitDevicePageStatus('ü'.repeat(200), 1, 'eu');
        expect(umlauts).to.deep.equal(['ü'.repeat(31), 'ü'.repeat(31), `${'ü'.repeat(30)}...`]);
        expect(umlauts.map(bytes)).to.deep.equal([62, 62, 63]);
        const words = splitDevicePageStatus(
            'Verbrauch heute 1,5 kWh; Laufzeit 2.5 h – Programm Baumwolle 60 °C, Schleudern 1400 U/min, ' +
                'Restzeit 1:23 h, danach Knitterschutz und Trocknen, Tür bleibt verriegelt',
            1,
            'eu',
        );
        expect(words).to.deep.equal([
            'Verbrauch heute 1,5 kWh; Laufzeit 2.5 h –',
            'Programm Baumwolle 60 °C, Schleudern 1400',
            'U/min, Restzeit 1:23 h, danach Knitterschut...',
        ]);
        expect(words.every(fitsLine)).to.equal(true);
        // exactly three parts: no ellipsis
        const exact = splitDevicePageStatus(`${'a'.repeat(39)} ${'b'.repeat(35)} ${'c'.repeat(30)}`, 1, 'eu');
        expect(exact).to.deep.equal(['a'.repeat(39), 'b'.repeat(35), 'c'.repeat(30)]);
    });
    it('"~" and line breaks never reach the field; the message of a part', () => {
        expect(splitDevicePageStatus('a~b', 2, 'eu')).to.deep.equal(['ab']);
        expect(splitDevicePageStatus('a\r\nb', 1, 'eu')).to.deep.equal(['a b']);
        expect(DEVICE_PAGE_STATUS_COMMAND).to.equal('devStatus');
        expect(devicePageStatusMessage('noch 23 min')).to.equal('devStatus~noch 23 min');
        expect(devicePageStatusMessage('')).to.equal('devStatus~');
        expect(devicePageStatusMessage('a~b')).to.equal('devStatus~ab');
    });
    it('names and values are cut to the 31 bytes of the text buffers, at a character', () => {
        expect(DEVICE_PAGE_TEXT_MAX_BYTES).to.equal(31);
        expect(cutToBytes('abc', 31)).to.equal('abc');
        expect(cutToBytes('ü'.repeat(20), 31)).to.equal('ü'.repeat(15));
        expect(cutToBytes('€€€', 4)).to.equal('€');
        const name = 'N'.repeat(40);
        const value = `${'v'.repeat(30)}ü`;
        expect(devicePageClampElement(`text~dp_3?1~I~123~${name}~${value}`)).to.equal(
            `text~dp_3?1~I~123~${'N'.repeat(31)}~${'v'.repeat(30)}`,
        );
        expect(devicePageClampElement('text~dp_3?1~I~123~Akku~80 %')).to.equal('text~dp_3?1~I~123~Akku~80 %');
        expect(devicePageClampElement(DEVICE_PAGE_EMPTY_ELEMENT)).to.equal(DEVICE_PAGE_EMPTY_ELEMENT);
        // the name of main too, the status line (field 6) is not a value
        expect(devicePageMainElement(`button~dp_3?0~I~123~${name}~1`, LONG)).to.equal(
            `button~dp_3?0~I~123~${'N'.repeat(31)}~${LONG}`,
        );
    });
    describe('length of the message', () => {
        const NAV = 'button~bSubPrev~<~65535~~~button~bSubNext~>~65535~~';
        const head = `entityUpd~${'H'.repeat(40)}~${NAV}`;
        const main = `button~dp_12?0~I~65535~${'M'.repeat(31)}~1`;
        const full = (type: string, n: number): string =>
            `${type}~dp_1234567890?${n}~I~65535~${'n'.repeat(31)}~${'w'.repeat(31)}`;
        const info = 'button~dp_1234567890?9~I~65535~~1';
        const status = 's'.repeat(40);
        it('buffers of the HMI pages: 943 / 875 / 1019, never more than the display takes (1017)', () => {
            expect(DEVICE_PAGE_RECEIVE_BYTES).to.deep.equal({ 1: 943, 2: 875, 3: 1019 });
            expect([1, 2, 3].map(l => devicePageMaxPayloadBytes(l as 1 | 2 | 3))).to.deep.equal([943, 875, 1017]);
        });
        it('a message that fits keeps the part of the status text', () => {
            const elements = [full('text', 1), full('text', 2), info];
            const out = devicePagePayload(head, main, elements, status, 3, 'eu');
            expect(out).to.equal([head, `button~dp_12?0~I~65535~${'M'.repeat(31)}~${status}`, ...elements].join('~'));
            expect(devicePagePayload(head, '', [], '', 2, 'eu')).to.equal(`${head}~~~~~~`);
        });
        it('layout 2 (875 bytes): the status line gives way when the message gets too long', () => {
            const elements = [1, 2, 3, 4, 5, 6].map(n => full('input_sel', n));
            elements.push(info);
            const headOf = (n: number): string => `entityUpd~${'H'.repeat(n)}~${NAV}`;
            const room = 875 - bytes(devicePagePayload(headOf(0), main, elements, '', 2, 'eu'));
            // exactly the room of the status text
            const fits = devicePagePayload(headOf(room - 40), main, elements, status, 2, 'eu');
            expect(bytes(fits)).to.equal(875);
            expect(fits.split('~')[19]).to.equal(status);
            // 10 bytes less: the text is cut by them, with "..."
            const tighter = devicePagePayload(headOf(room - 30), main, elements, status, 2, 'eu');
            expect(bytes(tighter)).to.equal(875);
            expect(tighter.split('~')[19]).to.equal(`${'s'.repeat(27)}...`);
            // nothing else changed
            expect(tighter.split('~').slice(20).join('~')).to.equal(elements.join('~'));
            // no room at all: no status text
            const none = devicePagePayload(headOf(room), main, elements, status, 2, 'eu');
            expect(none.split('~')[19]).to.equal('');
        });
        it('the longest message the adapter builds fits every layout (names and values 31 bytes, status 63)', () => {
            for (const layout of [1, 2, 3] as const) {
                const kinds = DEVICE_PAGE_LAYOUTS[layout];
                const elements = kinds.map((kind, i) =>
                    kind === 'status'
                        ? devicePageStatusIconElement(full('text', i + 1))
                        : devicePageClampElement(
                              `input_sel~dp_12?${i + 1}~I~65535~${'ü'.repeat(40)}~${'ü'.repeat(40)}`,
                          ),
                );
                elements.push(info);
                const part = splitDevicePageStatus('ü'.repeat(200), layout, 'eu')[2];
                expect(bytes(part)).to.equal(63);
                const out = devicePagePayload(head, main, elements, part, layout, 'eu');
                expect(bytes(out), `layout ${layout}`).to.be.at.most(devicePageMaxPayloadBytes(layout));
                expect(out.split('~')[19], `layout ${layout}`).to.equal(part);
                expect(out.split('~')).to.have.length(1 + 1 + 12 + 6 * (kinds.length + 2));
            }
        });
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
    it('status: a text with icon and color only - no name, no value, any state', () => {
        for (const id of ['power', 'program', 'phase', 'start', 'on', 'door']) {
            const item = devicePageSlotItem(DEV, 'status', ref(id), c(id), 'ignored') as any;
            expect(item.type, id).to.equal('text');
            expect(item.role, id).to.equal(DEVICE_DETAIL_ROW_ROLE);
            expect(item.data.entity2, id).to.equal(undefined);
            expect(item.data.text1, id).to.equal(undefined);
            expect(item.data.text.true.constVal, id).to.equal('');
        }
        // a number: icon and color of the mask entry / the kind, same as the info row
        const num = devicePageStatusIconItem(DEV, ref('power'), c('power')) as any;
        const row = devicePageSlotItem(DEV, 'info', ref('power'), c('power'), 'P') as any;
        expect(num.data.icon).to.deep.equal(row.data.icon);
    });
    it('status of a boolean: colors activated / deactivated by the value (entity1)', () => {
        const item = devicePageStatusIconItem(DEV, ref('door'), c('door')) as any;
        expect(item.data.entity1.value.dp).to.equal(`${DEV}.door`);
        expect(item.data.icon.true.color.constVal).to.deep.equal(Color.activated);
        expect(item.data.icon.false.color.constVal).to.deep.equal(Color.deactivated);
        expect(item.data.icon.true.value.constVal).to.equal(item.data.icon.false.value.constVal);
    });
    it('status with an own icon: replaces the icon for on and off, the colors stay', () => {
        const auto = devicePageStatusIconItem(DEV, ref('door'), c('door')) as any;
        const own = devicePageStatusIconItem(DEV, { ...ref('door'), icon: 'delete-empty' }, c('door')) as any;
        expect(own.data.icon.true.value.constVal).to.equal('delete-empty');
        expect(own.data.icon.false.value.constVal).to.equal('delete-empty');
        expect(own.data.icon.true.color).to.deep.equal(auto.data.icon.true.color);
        expect(own.data.icon.false.color).to.deep.equal(auto.data.icon.false.color);
        // other kinds ignore an own icon
        const info = devicePageSlotItem(DEV, 'info', { ...ref('door'), icon: 'delete-empty' }, c('door'), 'x') as any;
        expect(info.data.icon.true.value.constVal).to.not.equal('delete-empty');
    });
    it('status element: name and value always empty, empty payload = empty element', () => {
        expect(devicePageStatusIconElement('text~dp_3?7~I~123~Tür~offen')).to.equal('text~dp_3?7~I~123~~');
        expect(devicePageStatusIconElement('')).to.equal(DEVICE_PAGE_EMPTY_ELEMENT);
        expect(devicePageStatusIconElement(DEVICE_PAGE_EMPTY_ELEMENT)).to.equal(DEVICE_PAGE_EMPTY_ELEMENT);
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
    it('status line with an own data point outside the device: a triggered text row of exactly this state', async () => {
        const text = runtime({ status: { key: '', id: OWN, custom: true } });
        const content = await devicePageElements(sourceSwitch, text.details, text.page, getObject, tr, 'de');
        const item: any = content.elements[content.slotCount + 2];
        expect(item.type).to.equal('text');
        expect(item.dpInit).to.equal('');
        expect(item.data.entity2).to.deep.equal({ value: { type: 'triggered', dp: OWN } });
        expect(content.skipped).to.deep.equal([]);

        const energy = '0_userdata.0.wm.energy';
        const unit = runtime({ status: { key: '', id: energy, custom: true } });
        const withUnit = await devicePageElements(sourceSwitch, unit.details, unit.page, getObject, tr, 'de');
        const unitItem: any = withUnit.elements[withUnit.slotCount + 2];
        // value with the unit of common, like a state of the device
        expect(unitItem.data.entity2).to.deep.equal({ value: { type: 'triggered', dp: energy } });
    });
    it('own data point: no id = no status line and no report; a missing state or no state = none, reported', async () => {
        const pending = runtime({ status: { key: '', id: '', custom: true } });
        const none = await devicePageElements(sourceSwitch, pending.details, pending.page, getObject, tr, 'de');
        expect(none.elements[none.slotCount + 2]).to.equal(undefined);
        expect(none.skipped).to.deep.equal([]);

        for (const id of ['0_userdata.0.gone', '0_userdata.0.wm']) {
            const r = runtime({ status: { key: '', id, custom: true } });
            const content = await devicePageElements(sourceSwitch, r.details, r.page, getObject, tr, 'de');
            expect(content.elements[content.slotCount + 2]).to.equal(undefined);
            expect(content.skipped).to.deep.equal([id]);
        }
    });
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
    it('status slots: an item without name, they do not count for the duplicates of the named slots', async () => {
        const first = DEVICE_PAGE_LAYOUTS[1].indexOf('status');
        const slots: ({ key: string; id: string; icon?: string } | null)[] = DEVICE_PAGE_LAYOUTS[1].map(() => null);
        slots[0] = ref('power');
        slots[first] = ref('power');
        slots[first + 1] = { ...ref('door'), icon: 'door-open' };
        const { details, page } = runtime({ slots });
        const content = await devicePageElements(sourceSwitch, details, page, getObject, tr, 'de');
        // the same state in a status slot: no automatic suffix for the info row
        expect((content.elements[1] as any).data.text.true.constVal).to.equal('power');
        const status = content.elements[first + 1] as any;
        expect(status.type).to.equal('text');
        expect(status.data.text.true.constVal).to.equal('');
        expect((content.elements[first + 2] as any).data.icon.true.value.constVal).to.equal('door-open');
        expect(content.skipped).to.deep.equal([]);
    });
});

describe('lib/pages/device-page - own names of the slots', () => {
    const tr = (k: string): string => k;
    const nameOf = (item: unknown): unknown => (item as any)?.data?.text?.true?.constVal;
    it('configuration: kept trimmed on every slot, an empty one is left out', () => {
        const page = devicePageConfigOf({
            layout: 3,
            slots: [
                { ...ref('power'), name: ' Pumpe ' },
                { key: '', id: OWN, custom: 'state', name: 'Meldung' },
                { key: '', id: 'alias.0.l', custom: 'channel', name: 'Lampe' },
                { ...ref('power'), name: '  ' },
            ],
        });
        expect(page?.slots[0]).to.deep.equal({ ...ref('power'), name: 'Pumpe' });
        expect(page?.slots[1]).to.deep.equal({ key: '', id: OWN, custom: 'state', name: 'Meldung' });
        expect(page?.slots[2]).to.deep.equal({ key: '', id: 'alias.0.l', custom: 'channel', name: 'Lampe' });
        expect(page?.slots[3]).to.deep.equal(ref('power'));
        expect(devicePageSlotHasLook(page?.slots[0])).to.equal(true);
        expect(devicePageSlotLookOf({ ...ref('power'), name: 'Pumpe' })).to.deep.equal({ name: 'Pumpe' });
    });
    it('state and own data point: the own name replaces the automatic one, without second name line; empty = automatic', async () => {
        const { details, page } = runtime({
            layout: 3,
            slots: [
                { ...ref('power'), subName: 'Relais', name: 'Pumpe' },
                { key: '', id: OWN, custom: 'state', name: 'Meldung' },
                { key: '', id: OWN, custom: 'state', name: '' },
                { ...ref('door'), name: '' },
                null,
                null,
                null,
                null,
            ],
        });
        const content = await devicePageElements(sourceSwitch, details, page, getObject, tr, 'de');
        expect(nameOf(content.elements[1])).to.equal('Pumpe');
        expect(nameOf(content.elements[2])).to.equal('Meldung');
        expect(nameOf(content.elements[3])).to.equal('message');
        expect(nameOf(content.elements[4])).to.equal('door');
    });
    it('duplicates: a slot with an own name does not count, the others are told apart among themselves', async () => {
        const one = runtime({ layout: 3, slots: [ref('power'), { ...ref('power'), name: 'Pumpe' }] });
        const content = await devicePageElements(sourceSwitch, one.details, one.page, getObject, tr, 'de');
        expect(nameOf(content.elements[1])).to.equal('power');
        expect(nameOf(content.elements[2])).to.equal('Pumpe');

        const two = runtime({
            layout: 3,
            slots: [ref('power'), { ...ref('power'), subName: 'B' }, { ...ref('power'), name: 'Pumpe' }],
        });
        const both = await devicePageElements(sourceSwitch, two.details, two.page, getObject, tr, 'de');
        const withoutOwn = runtime({ layout: 3, slots: [ref('power'), { ...ref('power'), subName: 'B' }] });
        const expected = await devicePageElements(
            sourceSwitch,
            withoutOwn.details,
            withoutOwn.page,
            getObject,
            tr,
            'de',
        );
        expect(nameOf(both.elements[1])).to.equal(nameOf(expected.elements[1]));
        expect(nameOf(both.elements[2])).to.equal('power B');
        expect(nameOf(both.elements[3])).to.equal('Pumpe');
    });
    it('a status slot shows no name, also with an own one', async () => {
        const status = DEVICE_PAGE_LAYOUTS[1].indexOf('status');
        const slots: ({ key: string; id: string; name?: string } | null)[] = DEVICE_PAGE_LAYOUTS[1].map(() => null);
        slots[status] = { ...ref('door'), name: 'Tür' };
        const { details, page } = runtime({ slots });
        const content = await devicePageElements(sourceSwitch, details, page, getObject, tr, 'de');
        expect(nameOf(content.elements[1 + status])).to.equal('');
    });
    it('alias channel: the own name goes to the page item of the channel, the look does not take it', () => {
        const slot = { key: '', id: 'alias.0.s', custom: 'channel' as const, name: 'Steckdose' };
        expect(devicePageChannelAdminItem(slot, 'socket')).to.deep.equal({
            channelId: emptyChannelValueConfig('alias.0.s'),
            name: 'Steckdose',
        });
        const script = adminPageItemToScriptItem(devicePageChannelAdminItem(slot, 'socket')) as any;
        expect(script.name).to.equal('Steckdose');
        // without own name the channel names itself
        expect(devicePageChannelAdminItem({ ...slot, name: undefined }, 'socket').name).to.equal(undefined);
    });
    it('configuration: the font of the icon on every slot, the fields of a channel item only on a channel slot', () => {
        const extra = {
            textSize: 3,
            useValue: true,
            useValueConditions: ' val > 1 ',
            minValueBrightness: 5,
            colormode: true,
            modeList: ['a', '', 7],
            valueEntry: { valueStateId: 'x.name' },
            secondRow: '',
        };
        const page = devicePageConfigOf({
            layout: 3,
            slots: [
                { key: '', id: 'alias.0.l', custom: 'channel', ...extra },
                { ...ref('power'), ...extra },
                { ...ref('power'), textSize: 9 },
            ],
        });
        expect(page?.slots[0]).to.deep.equal({
            key: '',
            id: 'alias.0.l',
            custom: 'channel',
            textSize: 3,
            useValue: true,
            useValueConditions: 'val > 1',
            minValueBrightness: 5,
            colormode: true,
            modeList: ['a'],
            valueEntry: emptyChannelValueConfig('x.name'),
        });
        expect(page?.slots[1]).to.deep.equal({ ...ref('power'), textSize: 3 });
        // no font of the HMI
        expect(page?.slots[2]).to.deep.equal(ref('power'));
        // the channel item gets them all
        const item = devicePageChannelAdminItem(page?.slots[0] ?? { key: '', id: '' }, 'dimmer');
        expect(item).to.deep.include({ textSize: 3, useValue: true, minValueBrightness: 5, colormode: true });
        const script = adminPageItemToScriptItem(item) as any;
        expect(script.fontSize).to.equal(3);
    });
    it('font of the icon: on the icon of a state or navigation slot, not in a status or progress slot', () => {
        const common = objects[`${DEV}.power`].common;
        const info: any = devicePageSlotItem(DEV, 'info', { ...ref('power'), textSize: 3 }, common, 'P');
        expect(info.data.icon.textSize).to.deep.equal({ type: 'const', constVal: 3 });
        const progress: any = devicePageSlotItem(DEV, 'progress', { ...ref('power'), textSize: 3 }, common, 'P');
        expect(progress.data.icon?.textSize).to.equal(undefined);
        const nav = { key: '', id: '', custom: 'navigation' as const, targetPage: 'rooms', textSize: 1 as const };
        expect((devicePageNavigationSlotItem('button', nav) as any).data.icon.textSize).to.deep.equal({
            type: 'const',
            constVal: 1,
        });
        expect((devicePageNavigationSlotItem('status', nav) as any).data.icon.textSize).to.equal(undefined);
    });
    it('the own name of a state slot is no look of its icon', () => {
        const item = devicePageSlotItem(
            DEV,
            'info',
            { ...ref('power'), name: 'Pumpe' },
            objects[`${DEV}.power`].common,
            'Pumpe',
        );
        const plain = devicePageSlotItem(DEV, 'info', ref('power'), objects[`${DEV}.power`].common, 'Pumpe');
        expect(item).to.deep.equal(plain);
    });
});

describe('lib/pages/device-page - main', () => {
    it('short tap state: the item itself, own icon, colors kept, no device page inside', () => {
        const { details, page } = runtime({ icon: 'washing-machine-alert' });
        const main = devicePageMainItem(sourceSwitch, details, page, 'Waschmaschine') as any;
        expect(main.type).to.equal('switch');
        expect(main.data.icon.true.value.constVal).to.equal('washing-machine-alert');
        expect(main.data.icon.false.color.constVal).to.equal('off');
        expect(main.deviceDetails).to.deep.equal({ deviceId: DEV, entries: details.entries });
        // the source is not changed
        expect(sourceSwitch.data.icon.true.value.constVal).to.equal('washing-machine');
        expect(sourceSwitch.data.text.true.constVal).to.equal('WM');
    });
    it('short tap state without an own name: the name of the device, not the one of the state', () => {
        const { details, page } = runtime({});
        const source = {
            type: 'button',
            role: 'text.states',
            data: {
                icon: sourceSwitch.data.icon,
                entity1: { value: { type: 'triggered', dp: `${DEV}.phase` } },
                text: {
                    true: { type: 'triggered', dp: `${DEV}.phase` },
                    false: { type: 'triggered', dp: `${DEV}.phase` },
                },
            },
        } as any;
        const main = devicePageMainItem(source, details, page, 'Waschmaschine') as any;
        expect(main.type).to.equal('button');
        expect(main.role).to.equal(undefined);
        expect(main.data.text.true).to.deep.equal({ type: 'const', constVal: 'Waschmaschine' });
        expect(main.data.text.false).to.deep.equal({ type: 'const', constVal: 'Waschmaschine' });
        const noText = devicePageMainItem(
            { ...sourceSwitch, data: { ...sourceSwitch.data, text: undefined } },
            details,
            page,
            'Waschmaschine',
        ) as any;
        expect(noText.data.text.true.constVal).to.equal('Waschmaschine');
    });
    it('short tap state with an own name: the source of the headline (the device), not the name of the item', async () => {
        const { details, page } = runtime({});
        const content = await devicePageElements(sourceSwitch, details, page, getObject, (k: string) => k, 'de');
        const main = content.elements[0] as any;
        expect(main.data.text.true.constVal).to.equal(content.headline);
        expect(main.data.text.false.constVal).to.equal(content.headline);
        expect(content.headline).to.equal('Waschmaschine');
    });
    it('short tap none: a text with the name of the device', () => {
        const { details, page } = runtime({ shortPress: 'none' });
        const main = devicePageMainItem({ ...sourceSwitch, type: 'text' }, details, page, 'Waschmaschine') as any;
        expect(main.type).to.equal('text');
        expect(main.data.text.true.constVal).to.equal('Waschmaschine');
    });
    it('short tap navigation / popup: a text with icon and the name of the device, without action', () => {
        const { details, page } = runtime({ shortPress: 'navigation' });
        const nav = devicePageMainItem(
            {
                ...sourceSwitch,
                type: 'button',
                data: { ...sourceSwitch.data, setNavi: { type: 'const', constVal: 'x' } },
            },
            details,
            page,
            'Waschmaschine',
        ) as any;
        expect(nav.type).to.equal('text');
        expect(nav.data.setNavi).to.equal(undefined);
        expect(nav.data.text.true.constVal).to.equal('Waschmaschine');
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
            'Deckenlampe',
        ) as any;
        expect(light.type).to.equal('text');
        expect(light.data.text.false.constVal).to.equal('Deckenlampe');
        expect(light.data.text.true.constVal).to.equal('Deckenlampe');
        expect(light.data.icon.true.value.constVal).to.equal('lamp');
        expect(light.data.entity1.value.dp).to.equal('alias.0.l.ON');
    });
});

/**
 * A PageDevice without constructor: page items with fixed payloads.
 *
 * @param slotCount number of slots
 * @param payloads payloads of the page items (index = item number), undefined = no item
 * @param layout the layout
 */
function fakeDevicePage(
    slotCount: number,
    payloads: (string | undefined)[],
    layout: 1 | 2 | 3 = 1,
): {
    page: PageDevice;
    sent: string[];
    /** the running intervals of the adapter: ms and callback */
    intervals: Map<number, { ms: number; run: () => void }>;
} {
    const sent: string[] = [];
    const intervals = new Map<number, { ms: number; run: () => void }>();
    let nextInterval = 1;
    const page = Object.create(PageDevice.prototype) as PageDevice;
    Object.assign(page, {
        headline: 'Waschmaschine',
        slotCount,
        layout,
        channelSlots: new Set<number>(),
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
            setInterval: (run: () => void, ms: number): number => {
                intervals.set(nextInterval, { ms, run });
                return nextInterval++;
            },
            clearInterval: (id: number): void => {
                intervals.delete(id);
            },
        },
        log: { debug: (): void => undefined },
        library: { getTranslation: (s: string): string => s },
        basePanel: { info: { nspanel: { model: 'eu' } } },
        directParentPage: { id: '3' },
        pageItems: payloads.map(p => (p === undefined ? undefined : { getPageItemPayload: async () => p })),
        sendToPanel: (msg: string): void => {
            sent.push(msg);
        },
        sendToPanelClass: (msg: string): void => {
            sent.push(msg);
        },
    });
    return { page, sent, intervals };
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
            const { page, sent } = fakeDevicePage(n, payloads, layout);
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
        const n = DEVICE_PAGE_LAYOUTS[1].length;
        const { page, sent } = fakeDevicePage(n, ['text~dp_3?0~M~1~WM~5 W']);
        await page.update();
        const elements = sent[0].split('~').slice(14);
        expect(elements.slice(0, 6)).to.deep.equal(['text', 'dp_3?0', 'M', '1', 'WM', '']);
        expect(elements).to.have.length(6 * (n + 2));
        expect(elements.slice(6 * (n + 1))).to.deep.equal(['', '', '', '', '', '']);
    });
    describe('a status text that does not fit: the parts alternate', () => {
        const LONG = 'Reinigung läuft, Wohnzimmer und Küche fertig, noch 23 min bis zur Rückkehr an die Ladestation';
        const PARTS = [
            'Reinigung läuft, Wohnzimmer und Küche',
            'fertig, noch 23 min bis zur Rückkehr an die',
            'Ladestation',
        ];
        const n = DEVICE_PAGE_LAYOUTS[2].length;
        // the page items: main, n empty slots, no info, the status item
        const payloadsOf = (status: string, main = 'switch~dp_3?0~M~1~WM~1'): (string | undefined)[] => [
            main,
            ...new Array<undefined>(n + 1).fill(undefined),
            `text~dp_3?${n + 2}~x~4~~${status}`,
        ];
        const setItems = (page: PageDevice, payloads: (string | undefined)[]): void => {
            Object.assign(page, {
                pageItems: payloads.map(p => (p === undefined ? undefined : { getPageItemPayload: async () => p })),
            });
        };
        const statusOf = (msg: string): string => msg.split('~')[19];
        const tick = (intervals: Map<number, { ms: number; run: () => void }>): void => {
            expect(intervals.size).to.equal(1);
            for (const interval of intervals.values()) {
                interval.run();
            }
        };

        it('entityUpd carries the first part, every 3 s devStatus brings the next one, round and round', async () => {
            const { page, sent, intervals } = fakeDevicePage(n, payloadsOf(LONG), 2);
            await page.update();
            expect(sent).to.have.length(1);
            expect(statusOf(sent[0])).to.equal(PARTS[0]);
            expect([...intervals.values()].map(i => i.ms)).to.deep.equal([DEVICE_PAGE_STATUS_INTERVAL_MS]);
            expect(DEVICE_PAGE_STATUS_INTERVAL_MS).to.equal(3000);
            for (let i = 0; i < 4; i++) {
                tick(intervals);
            }
            expect(sent.slice(1)).to.deep.equal([
                `devStatus~${PARTS[1]}`,
                `devStatus~${PARTS[2]}`,
                `devStatus~${PARTS[0]}`,
                `devStatus~${PARTS[1]}`,
            ]);
        });
        it('a text that fits: no interval, no devStatus', async () => {
            const { page, sent, intervals } = fakeDevicePage(n, payloadsOf('Schleudern'), 2);
            await page.update();
            expect(statusOf(sent[0])).to.equal('Schleudern');
            expect(intervals.size).to.equal(0);
        });
        it('an entityUpd for another reason keeps the part and the interval', async () => {
            const { page, sent, intervals } = fakeDevicePage(n, payloadsOf(LONG), 2);
            await page.update();
            const first = [...intervals.keys()];
            tick(intervals);
            setItems(page, payloadsOf(LONG, 'switch~dp_3?0~M~1~WM~0'));
            await page.update();
            expect(statusOf(sent[2])).to.equal(PARTS[1]);
            expect([...intervals.keys()]).to.deep.equal(first);
            tick(intervals);
            expect(sent[3]).to.equal(`devStatus~${PARTS[2]}`);
        });
        it('another status text starts with its first part and a new interval; a short one stops it', async () => {
            const { page, sent, intervals } = fakeDevicePage(n, payloadsOf(LONG), 2);
            await page.update();
            const first = [...intervals.keys()];
            tick(intervals);
            setItems(page, payloadsOf(`Fertig. ${LONG}`));
            await page.update();
            expect(statusOf(sent[2])).to.equal('Fertig. Reinigung läuft, Wohnzimmer und');
            expect(intervals.size).to.equal(1);
            expect([...intervals.keys()]).to.not.deep.equal(first);
            setItems(page, payloadsOf('Fertig'));
            await page.update();
            expect(statusOf(sent[3])).to.equal('Fertig');
            expect(intervals.size).to.equal(0);
        });
        it('nothing is sent while the page sleeps (popup) or is hidden; hidden stops the interval', async () => {
            const { page, sent, intervals } = fakeDevicePage(n, payloadsOf(LONG), 2);
            await page.update();
            Object.assign(page, { sleep: true });
            tick(intervals);
            expect(sent).to.have.length(1);
            Object.assign(page, { sleep: false });
            tick(intervals);
            expect(sent[1]).to.equal(`devStatus~${PARTS[1]}`);
            // hidden: the interval ends, the page starts with the first part when it is shown again
            Object.assign(page, { visibility: false, pageItems: [] });
            await (page as any).onVisibilityChange(false);
            expect(intervals.size).to.equal(0);
            Object.assign(page, { visibility: true });
            setItems(page, payloadsOf(LONG));
            await page.update();
            expect(statusOf(sent[2])).to.equal(PARTS[0]);
            expect(intervals.size).to.equal(1);
        });
        it('an unloaded page stops the interval at its next tick', async () => {
            const { page, intervals } = fakeDevicePage(n, payloadsOf(LONG), 2);
            await page.update();
            Object.assign(page, { unload: true });
            for (const interval of [...intervals.values()]) {
                interval.run();
            }
            expect(intervals.size).to.equal(0);
        });
    });
    describe('layout 1 with status icons', () => {
        const kinds = DEVICE_PAGE_LAYOUTS[1];
        const n = kinds.length;
        const statusIndexes = kinds.map((k, i) => (k === 'status' ? i + 1 : 0)).filter(i => i > 0);
        /**
         * @param filled item numbers of the filled status slots
         * @returns the elements after the navigation
         */
        async function send(filled: number[]): Promise<string[]> {
            const payloads: (string | undefined)[] = ['switch~dp_3?0~M~1~WM~1'];
            for (let i = 1; i <= n; i++) {
                if (kinds[i - 1] === 'status') {
                    payloads.push(filled.includes(i) ? `text~dp_3?${i}~S${i}~${100 + i}~Name${i}~Wert${i}` : undefined);
                } else {
                    payloads.push(`text~dp_3?${i}~I~2~S${i}~${i} W`);
                }
            }
            payloads.push(`button~dp_3?${n + 1}~i~3~~1`);
            const { page, sent } = fakeDevicePage(n, payloads, 1);
            await page.update();
            return sent[0].split('~').slice(14);
        }
        const element = (elements: string[], e: number): string[] => elements.slice(6 * e, 6 * e + 6);
        it('none: every status slot is the empty element, the order main, slots, info stays', async () => {
            const elements = await send([]);
            expect(elements).to.have.length(6 * (n + 2));
            for (const e of statusIndexes) {
                expect(element(elements, e)).to.deep.equal(['', '', '', '', '', '']);
            }
            expect(element(elements, 1)).to.deep.equal(['text', 'dp_3?1', 'I', '2', 'S1', '1 W']);
            expect(element(elements, n + 1).slice(0, 2)).to.deep.equal(['button', `dp_3?${n + 1}`]);
        });
        it('one: icon and color, name and value empty', async () => {
            const e = statusIndexes[0];
            const elements = await send([e]);
            expect(element(elements, e)).to.deep.equal(['text', `dp_3?${e}`, `S${e}`, String(100 + e), '', '']);
            for (const other of statusIndexes.slice(1)) {
                expect(element(elements, other)).to.deep.equal(['', '', '', '', '', '']);
            }
        });
        it('all: every status slot with icon and color only', async () => {
            const elements = await send(statusIndexes);
            for (const e of statusIndexes) {
                expect(element(elements, e)).to.deep.equal(['text', `dp_3?${e}`, `S${e}`, String(100 + e), '', '']);
            }
            expect(element(elements, n + 1).slice(0, 2)).to.deep.equal(['button', `dp_3?${n + 1}`]);
        });
    });
    it('long press: a slot runs the long press of its item, main and info never; always handled (no tap)', async () => {
        const { page } = fakeDevicePage(6, []);
        const pressed: number[] = [];
        const items = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({
            onCommandLongPress: async (): Promise<boolean> => {
                pressed.push(i);
                return Promise.resolve(false);
            },
        }));
        Object.assign(page, { pageItems: items });
        for (const id of ['0', '1', '6', '7']) {
            expect(await page.onButtonPress3(id, undefined, 'button', ''), id).to.equal(true);
        }
        expect(pressed).to.deep.equal([1, 6]);
    });
    it('alias channel slots: field 6 follows the kind of the slot, other slots stay as they are', async () => {
        // layout 2: value, progress, info, info, info, button
        const payloads = [
            'text~dp_3?0~M~1~WM~',
            'number~dp_3?1~I~2~Vol~40|0|200',
            'number~dp_3?2~I~2~Vol~40|0|200',
            'switch~dp_3?3~I~2~Dose~1',
            'shutter~dp_3?4~I~2~Rollo~A|B|C|enable|enable|enable',
            'number~dp_3?5~I~2~State~40|0|200',
            'shutter~dp_3?6~I~2~Rollo~A|B|C|enable|enable|enable',
        ];
        const { page, sent } = fakeDevicePage(6, payloads, 2);
        Object.assign(page, { channelSlots: new Set([0, 1, 2, 3, 5]) });
        await page.update();
        const elements = sent[0].split('~').slice(14);
        const field6 = (e: number): string => elements[6 * e + 5];
        expect([1, 2, 3, 4, 5, 6].map(field6)).to.deep.equal(['40', '20', 'on', '', '40|0|200', '']);
        expect(elements.slice(18, 22)).to.deep.equal(['switch', 'dp_3?3', 'I', '2']);
    });
});

describe('lib/types/deviceDetails - own data points, alias channels and settings of a slot', () => {
    it('custom slots: kept with their kind of source, also without id; trimmed; the runtime leaves empty ones out', () => {
        const config = devicePageConfigOf({
            layout: 2,
            slots: [
                { key: 'x', id: ' 0_userdata.0.a ', custom: 'state', subName: 's' },
                { key: '', id: '', custom: 'channel' },
                { key: '', id: 'alias.0.light', custom: 'channel' },
                { key: '', id: '', custom: 'nope' },
                { key: 'power', id: `${DEV}.power` },
            ],
        });
        expect(config?.slots).to.deep.equal([
            { key: '', id: '0_userdata.0.a', custom: 'state' },
            { key: '', id: '', custom: 'channel' },
            { key: '', id: 'alias.0.light', custom: 'channel' },
            null,
            { key: 'power', id: `${DEV}.power` },
            null,
        ]);
        const run = deviceDetailsRuntimeOf({ deviceId: DEV, entries: [], devicePage: config });
        expect(run?.devicePage?.slots[1]).to.equal(null);
        expect(run?.devicePage?.slots[2]).to.deep.equal({ key: '', id: 'alias.0.light', custom: 'channel' });
    });
    it('settings of a slot: on every kind, icons trimmed, colors only as #rrggbb, a valid scale, the long press', () => {
        const scale = { val_min: 0, val_max: 100 };
        const config = devicePageConfigOf({
            layout: 2,
            slots: [
                { ...ref('power'), trueIcon: ' play ', falseIcon: '', trueColor: '#00FF00', falseColor: 'red', scale },
                { ...ref('progress'), scale: { val_min: 'x' }, longPress: ' 0_userdata.0.lp ' },
            ],
        });
        expect(config?.slots[0]).to.deep.equal({ ...ref('power'), trueIcon: 'play', trueColor: '#00FF00', scale });
        expect(config?.slots[1]).to.deep.equal({ ...ref('progress'), longPress: '0_userdata.0.lp' });
        expect(devicePageSlotHasLook(config?.slots[0])).to.equal(true);
        expect(devicePageSlotHasLook(ref('power'))).to.equal(false);
        expect(devicePageSlotHasLook(null)).to.equal(false);
        // a layout change keeps them
        expect(fitDevicePageSlots(config?.slots ?? [], 3)[0]).to.deep.equal(config?.slots[0]);
    });
    it('older status icon: read as the icon for both states until an own icon is set', () => {
        const old = { ...ref('door'), icon: 'door' };
        expect(devicePageSlotLookOf(old)).to.deep.equal({ trueIcon: 'door', falseIcon: 'door' });
        expect(devicePageSlotLookOf(old, false)).to.deep.equal({});
        expect(devicePageSlotLookOf({ ...old, falseIcon: 'door-open' })).to.deep.equal({ falseIcon: 'door-open' });
        const slots = (slot: unknown): unknown[] => [null, null, null, null, null, null, slot];
        expect(devicePageConfigOf({ layout: 1, slots: slots(old) })?.slots[6]).to.deep.equal(old);
        expect(devicePageConfigOf({ layout: 1, slots: slots({ ...old, trueIcon: 'a' }) })?.slots[6]).to.deep.equal({
            ...ref('door'),
            trueIcon: 'a',
        });
    });
    it('short tap devicePage is a short tap of its own', () => {
        expect(deviceShortPressOf({ shortPress: 'devicePage' })).to.equal('devicePage');
        expect(deviceShortPressOf({ shortPress: 'x' })).to.equal('state');
    });
    it('which channel roles fit which kind of slot', () => {
        const all = DEVICE_PAGE_CHANNEL_ROLES.info;
        expect([...DEVICE_PAGE_CHANNEL_ROLES.button].sort()).to.deep.equal([...all].sort());
        expect([...DEVICE_PAGE_CHANNEL_ROLES.status].sort()).to.deep.equal([...all].sort());
        for (const role of ['socket', 'light', 'dimmer', 'blind', 'select', 'slider', 'temperature', 'level.timer']) {
            expect(devicePageSlotAcceptsChannel('info', role), role).to.equal(true);
        }
        for (const role of ['media', 'timeTable', 'sensor.alarm.flood', '', undefined, null]) {
            for (const kind of ['info', 'value', 'progress', 'button', 'switch', 'status'] as const) {
                expect(devicePageSlotAcceptsChannel(kind, role), `${kind} ${role}`).to.equal(false);
            }
        }
        // value: no button and no shutter (nothing to read)
        expect(
            ['temperature', 'slider', 'select', 'light'].every(r => devicePageSlotAcceptsChannel('value', r)),
        ).to.equal(true);
        expect(['button', 'blind', 'gate', 'lock'].some(r => devicePageSlotAcceptsChannel('value', r))).to.equal(false);
        expect(DEVICE_PAGE_CHANNEL_ROLES.progress).to.deep.equal(['slider', 'volume']);
        expect(
            ['socket', 'light', 'dimmer', 'level.mode.fan'].every(r => devicePageSlotAcceptsChannel('switch', r)),
        ).to.equal(true);
        expect(
            ['blind', 'button', 'temperature', 'slider'].some(r => devicePageSlotAcceptsChannel('switch', r)),
        ).to.equal(false);
    });
    it('long press action: a state in a button / switch slot, a channel with role button / socket', () => {
        expect(devicePageSlotTakesLongPress('button', ref('on'))).to.equal(true);
        expect(devicePageSlotTakesLongPress('switch', { key: '', id: 'a', custom: 'state' })).to.equal(true);
        expect(devicePageSlotTakesLongPress('info', ref('on'))).to.equal(false);
        expect(devicePageSlotTakesLongPress('button', null)).to.equal(false);
        const channel = { key: '', id: 'alias.0.x', custom: 'channel' as const };
        expect(devicePageSlotTakesLongPress('info', channel, 'socket')).to.equal(true);
        expect(devicePageSlotTakesLongPress('button', channel, 'light')).to.equal(false);
    });
});

describe('lib/pages/device-page - settings of a slot on a state', () => {
    const c = (id: string): any => objects[`${DEV}.${id}`].common;
    const rgb = (hex: string): unknown => Color.ConvertHexToRgb(hex);
    it('button with a boolean: icon and color follow the state, the tap still switches (go / pause)', () => {
        const plain = devicePageSlotItem(DEV, 'button', ref('on'), c('on'), 'Lauf') as any;
        const own = devicePageSlotItem(
            DEV,
            'button',
            { ...ref('on'), trueIcon: 'pause', falseIcon: 'play', trueColor: '#00ff00', falseColor: '#ff0000' },
            c('on'),
            'Lauf',
        ) as any;
        expect(own.data.icon.true.value.constVal).to.equal('pause');
        expect(own.data.icon.false.value.constVal).to.equal('play');
        expect(own.data.icon.true.color.constVal).to.deep.equal(rgb('#00ff00'));
        expect(own.data.icon.false.color.constVal).to.deep.equal(rgb('#ff0000'));
        expect(own.type).to.equal('button');
        expect(own.role).to.equal(DEVICE_DETAIL_ROW_ROLE);
        expect(own.data.entity1).to.deep.equal(plain.data.entity1);
        expect(own.data.text).to.deep.equal(plain.data.text);
    });
    it('only what is set changes', () => {
        const plain = devicePageSlotItem(DEV, 'info', ref('door'), c('door'), 'Tür') as any;
        const own = devicePageSlotItem(DEV, 'info', { ...ref('door'), falseColor: '#0000ff' }, c('door'), 'Tür') as any;
        expect(own.data.icon.true).to.deep.equal(plain.data.icon.true);
        expect(own.data.icon.false.value).to.deep.equal(plain.data.icon.false.value);
        expect(own.data.icon.false.color.constVal).to.deep.equal(rgb('#0000ff'));
        expect(
            devicePageSlotItem(DEV, 'info', { ...ref('door'), trueColor: 'nonsense' }, c('door'), 'Tür'),
        ).to.deep.equal(plain);
    });
    it('a number or text has no false: the true icon is the only one', () => {
        const own = devicePageSlotItem(
            DEV,
            'info',
            { ...ref('power'), trueIcon: 'flash', falseIcon: 'x' },
            c('power'),
            'P',
        ) as any;
        expect(own.data.icon.true.value.constVal).to.equal('flash');
        expect(own.data.icon.false.value.constVal).to.equal('flash');
        expect(own.data.entity1).to.equal(undefined);
        const sel = devicePageSlotItem(DEV, 'info', { ...ref('program'), trueIcon: 'tune' }, c('program'), 'P') as any;
        expect(sel.type).to.equal('input_sel');
        expect(sel.data.icon.true.value.constVal).to.equal('tune');
    });
    it('color scale: the icon options get it, a number the state as entity1 (progress: the color of the bar)', () => {
        const scale = { val_min: 0, val_max: 200 };
        const own = devicePageSlotItem(
            DEV,
            'progress',
            { ...ref('progress'), scale, trueColor: '#00ff00' },
            c('progress'),
            'F',
        ) as any;
        expect(own.data.icon.scale).to.deep.equal({ type: 'const', constVal: scale });
        expect(own.data.entity1).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.progress` } });
        expect(own.role).to.equal(DEVICE_PAGE_PROGRESS_ROLE);
        const text = devicePageSlotItem(DEV, 'info', { ...ref('phase'), scale }, c('phase'), 'F') as any;
        expect(text.data.entity1).to.equal(undefined);
    });
    it('charge level of a battery: the icon follows the value in status, info, value and progress', () => {
        const bat = { key: 'battery', id: `${DEV}.battery` };
        const common = { type: 'number', role: 'value.battery', write: false, unit: '%', min: 0, max: 100 };
        const levelIcon = { type: 'triggered', dp: bat.id, read: BATTERY_ICON_READ };
        const energy = { type: 'const', constVal: Color.deviceEnergy };
        for (const kind of ['status', 'info', 'value', 'progress'] as const) {
            const item = devicePageSlotItem(DEV, kind, bat, common, 'B') as any;
            expect(item.data.icon.true.value, kind).to.deep.equal(levelIcon);
            expect(item.data.icon.false.value, kind).to.deep.equal(levelIcon);
            // the color as before: the group of the entry
            expect(item.data.icon.true.color, kind).to.deep.equal(energy);
            expect(item.data.icon.false.color, kind).to.deep.equal(energy);
        }
        // an own data point with the role value.battery behaves the same
        const ownRef = { key: '', id: '0_userdata.0.wm.battery', custom: 'state' as const };
        const own = devicePageSlotItem(DEV, 'status', ownRef, common, '') as any;
        expect(own.data.icon.true.value).to.deep.equal({ ...levelIcon, dp: ownRef.id });
        expect(own.data.icon.true.color).to.deep.equal(energy);
    });
    it('charge level of a battery: an own icon of the slot wins, own colors go with the level icon', () => {
        const bat = { key: 'battery', id: `${DEV}.battery` };
        const common = { type: 'number', role: 'value.battery', write: false, unit: '%' };
        const levelIcon = { type: 'triggered', dp: bat.id, read: BATTERY_ICON_READ };
        for (const kind of ['status', 'info'] as const) {
            const icon = devicePageSlotItem(DEV, kind, { ...bat, trueIcon: 'heart' }, common, 'B') as any;
            expect(icon.data.icon.true.value, kind).to.deep.equal({ type: 'const', constVal: 'heart' });
            expect(icon.data.icon.false.value, kind).to.deep.equal({ type: 'const', constVal: 'heart' });
            const color = devicePageSlotItem(DEV, kind, { ...bat, trueColor: '#00ff00' }, common, 'B') as any;
            expect(color.data.icon.true.value, kind).to.deep.equal(levelIcon);
            expect(color.data.icon.true.color.constVal, kind).to.deep.equal(rgb('#00ff00'));
        }
        // the older icon of a status slot
        const old = devicePageSlotItem(DEV, 'status', { ...bat, icon: 'star' }, common, '') as any;
        expect(old.data.icon.true.value).to.deep.equal({ type: 'const', constVal: 'star' });
        expect(old.data.icon.false.value).to.deep.equal({ type: 'const', constVal: 'star' });
    });
    it('long press: on a button and a switch item, not on a text', () => {
        const lp = { longPress: '0_userdata.0.lp' };
        const button = devicePageSlotItem(DEV, 'button', { ...ref('start'), ...lp }, c('start'), 'S') as any;
        expect(button.data.longPress).to.deep.equal({ type: 'state', dp: '0_userdata.0.lp' });
        const toggle = devicePageSlotItem(DEV, 'switch', { ...ref('on'), ...lp }, c('on'), 'S') as any;
        expect(toggle.data.longPress).to.deep.equal({ type: 'state', dp: '0_userdata.0.lp' });
        const info = devicePageSlotItem(DEV, 'info', { ...ref('on'), ...lp }, c('on'), 'S') as any;
        expect(info.data.longPress).to.equal(undefined);
    });
    it('status: the older icon for both states, an own icon replaces it', () => {
        const old = devicePageSlotItem(DEV, 'status', { ...ref('door'), icon: 'door' }, c('door'), '') as any;
        expect(old.data.icon.true.value.constVal).to.equal('door');
        expect(old.data.icon.false.value.constVal).to.equal('door');
        const own = devicePageSlotItem(
            DEV,
            'status',
            { ...ref('door'), trueIcon: 'door-open', falseIcon: 'door-closed' },
            c('door'),
            '',
        ) as any;
        expect(own.data.icon.true.value.constVal).to.equal('door-open');
        expect(own.data.icon.false.value.constVal).to.equal('door-closed');
    });
});

describe('lib/pages/device-page - navigation from the slots', () => {
    const c = (id: string): any => objects[`${DEV}.${id}`].common;
    const first = (kind: string): number => DEVICE_PAGE_LAYOUTS[1].findIndex(k => k === kind);

    it('configuration: the short tap navigation of a slot is kept, also without target page; old slots unchanged', () => {
        const slots: unknown[] = [
            { ...ref('power'), isNavigation: true, targetPage: ' rooms ' },
            { ...ref('program'), isNavigation: true },
            { ...ref('on'), targetPage: 'rooms' },
            { ...ref('on'), isNavigation: 'yes', targetPage: 'rooms' },
        ];
        const page = devicePageConfigOf({ layout: 1, slots });
        expect(page?.slots[0]).to.deep.equal({ ...ref('power'), isNavigation: true, targetPage: 'rooms' });
        expect(page?.slots[1]).to.deep.equal({ ...ref('program'), isNavigation: true });
        // a target without the choice "navigation" is no navigation
        expect(page?.slots[2]).to.deep.equal(ref('on'));
        expect(page?.slots[3]).to.deep.equal(ref('on'));
        expect(devicePageSlotTargetOf(page?.slots[0])).to.equal('rooms');
        expect(devicePageSlotTargetOf(page?.slots[1])).to.equal('');
        expect(devicePageSlotTargetOf(page?.slots[2])).to.equal('');
        expect(devicePageSlotTargetOf(null)).to.equal('');
        expect(devicePageSlotLookOf({ ...ref('power'), isNavigation: true, targetPage: 'rooms' })).to.deep.equal({
            isNavigation: true,
            targetPage: 'rooms',
        });
        expect(devicePageSlotHasLook({ ...ref('power'), isNavigation: true })).to.equal(true);
    });
    it('configuration: a navigation slot has no state - target, text and look', () => {
        const stored = {
            key: 'x',
            id: ' some.id ',
            custom: 'navigation',
            targetPage: ' rooms ',
            name: ' Räume ',
            trueIcon: 'floor-plan',
            trueColor: '#00ff00',
            isNavigation: true,
        };
        const page = devicePageConfigOf({ layout: 1, slots: [stored, { key: '', id: '', custom: 'navigation' }] });
        expect(page?.slots[0]).to.deep.equal({
            key: '',
            id: '',
            custom: 'navigation',
            targetPage: 'rooms',
            name: 'Räume',
            trueIcon: 'floor-plan',
            trueColor: '#00ff00',
        });
        // nothing chosen yet: the choice stays in the admin
        expect(page?.slots[1]).to.deep.equal({ key: '', id: '', custom: 'navigation' });
        expect(devicePageSlotTargetOf(page?.slots[0])).to.equal('rooms');
        // the navigation of a navigation slot is no setting of the dialog
        expect(devicePageSlotLookOf({ key: '', id: '', custom: 'navigation', targetPage: 'rooms' })).to.deep.equal({});
    });
    it('where a navigation slot fits and where the tap of a channel can navigate', () => {
        expect(['info', 'button', 'status'].every(k => devicePageSlotAcceptsNavigation(k as never))).to.equal(true);
        expect(['value', 'progress', 'switch'].some(k => devicePageSlotAcceptsNavigation(k as never))).to.equal(false);
        // a light, a fan or a slider opens its popup only when held: the short tap reaches the adapter
        for (const role of ['button', 'socket', 'light', 'dimmer', 'hue', 'ct', 'slider', 'level.mode.fan', 'door']) {
            expect(devicePageChannelTakesNavigation(role), role).to.equal(true);
        }
        // these open their popup in the HMI as soon as they are touched; unknown roles never
        for (const role of ['blind', 'gate', 'lock', 'select', 'level.timer', 'media', '']) {
            expect(devicePageChannelTakesNavigation(role), role).to.equal(false);
        }
        expect(devicePageChannelTakesNavigation(undefined)).to.equal(false);
        expect(devicePageSlotTakesNavigation(ref('power'))).to.equal(true);
        expect(devicePageSlotTakesNavigation({ key: '', id: 'x', custom: 'state' })).to.equal(true);
        expect(devicePageSlotTakesNavigation({ key: '', id: 'alias.0.l', custom: 'channel' }, 'blind')).to.equal(false);
        expect(devicePageSlotTakesNavigation({ key: '', id: 'alias.0.l', custom: 'channel' }, 'socket')).to.equal(true);
        expect(devicePageSlotTakesNavigation(null)).to.equal(false);
    });
    it('runtime: a navigation slot without target page or in a slot that needs a value is empty', () => {
        const nav = { key: '', id: '', custom: 'navigation', targetPage: 'rooms' };
        const slots: unknown[] = DEVICE_PAGE_LAYOUTS[2].map(() => nav);
        slots[0] = { key: '', id: '', custom: 'navigation' };
        const runtime = deviceDetailsRuntimeOf({ deviceId: DEV, entries: [], devicePage: { layout: 2, slots } });
        const kept = runtime?.devicePage?.slots.map(s => !!s);
        expect(kept).to.deep.equal(
            DEVICE_PAGE_LAYOUTS[2].map((kind, i) => i !== 0 && devicePageSlotAcceptsNavigation(kind)),
        );
    });
    it('state slot with navigation: the item carries the target, look and value stay', () => {
        for (const kind of ['info', 'value', 'status', 'progress'] as const) {
            const id = kind === 'progress' ? 'progress' : 'power';
            const plain = devicePageSlotItem(DEV, kind, ref(id), c(id), 'P') as any;
            const nav = devicePageSlotItem(
                DEV,
                kind,
                { ...ref(id), isNavigation: true, targetPage: 'rooms' },
                c(id),
                'P',
            ) as any;
            expect(nav.devicePageTarget, kind).to.equal('rooms');
            expect(plain.devicePageTarget, kind).to.equal(undefined);
            expect({ ...nav, devicePageTarget: undefined }, kind).to.deep.equal({
                ...plain,
                devicePageTarget: undefined,
            });
        }
        const button = devicePageSlotItem(
            DEV,
            'button',
            { ...ref('on'), isNavigation: true, targetPage: 'rooms', trueIcon: 'play' },
            c('on'),
            'An',
        ) as any;
        expect(button.devicePageTarget).to.equal('rooms');
        expect(button.data.icon.true.value.constVal).to.equal('play');
        const toggle = devicePageSlotItem(
            DEV,
            'switch',
            { ...ref('on'), isNavigation: true, targetPage: 'rooms' },
            c('on'),
            'An',
        ) as any;
        expect(toggle.type).to.equal('switch');
        expect(toggle.devicePageTarget).to.equal('rooms');
        // navigation chosen, no page yet: nothing changes
        const pending = devicePageSlotItem(DEV, 'info', { ...ref('power'), isNavigation: true }, c('power'), 'P');
        expect(pending).to.deep.equal(devicePageSlotItem(DEV, 'info', ref('power'), c('power'), 'P'));
    });
    it('info slot with a selection and navigation: shown as text, its popup would come before the tap', () => {
        const plain = devicePageSlotItem(DEV, 'info', ref('program'), c('program'), 'Programm') as any;
        expect(plain.type).to.equal('input_sel');
        const nav = devicePageSlotItem(
            DEV,
            'info',
            { ...ref('program'), isNavigation: true, targetPage: 'rooms' },
            c('program'),
            'Programm',
        ) as any;
        expect(nav.type).to.equal('text');
        expect(nav.devicePageTarget).to.equal('rooms');
    });
    it('navigation slot: a text with icon and name only, own icon / color / text', () => {
        const nav = { key: '', id: '', custom: 'navigation' as const, targetPage: 'rooms' };
        const item = devicePageNavigationSlotItem('button', nav) as any;
        expect(item.type).to.equal('text');
        expect(item.role).to.equal(DEVICE_DETAIL_ROW_ROLE);
        expect(item.devicePageTarget).to.equal('rooms');
        expect(item.data.icon.true.value.constVal).to.equal(DEVICE_PAGE_NAVIGATION_ICON);
        expect(item.data.icon.true.color.constVal).to.deep.equal(Color.deviceInfo);
        expect(item.data.icon.false).to.deep.equal(item.data.icon.true);
        expect(item.data.text.true.constVal).to.equal('rooms');
        expect(item.data.entity1).to.equal(undefined);
        expect(item.data.entity2).to.equal(undefined);
        const own = devicePageNavigationSlotItem('info', {
            ...nav,
            name: 'Räume',
            trueIcon: 'floor-plan',
            trueColor: '#00ff00',
        }) as any;
        expect(own.data.icon.true.value.constVal).to.equal('floor-plan');
        expect(own.data.icon.true.color.constVal).to.deep.equal(Color.ConvertHexToRgb('#00ff00'));
        expect(own.data.text.true.constVal).to.equal('Räume');
        expect(devicePageNavigationSlotItem('value', nav)).to.equal(undefined);
        expect(devicePageNavigationSlotItem('switch', nav)).to.equal(undefined);
        expect(devicePageNavigationSlotItem('button', { key: '', id: '', custom: 'navigation' })).to.equal(undefined);
        // a state slot is no navigation slot
        expect(
            devicePageNavigationSlotItem('button', { ...ref('on'), isNavigation: true, targetPage: 'rooms' }),
        ).to.equal(undefined);
    });
    it('elements: navigation slots are built without a state and are not reported as missing', async () => {
        const slots: (Record<string, unknown> | null)[] = DEVICE_PAGE_LAYOUTS[1].map(() => null);
        slots[first('info')] = { ...ref('power'), isNavigation: true, targetPage: 'rooms' };
        slots[first('button')] = { key: '', id: '', custom: 'navigation', targetPage: 'rooms', name: 'Räume' };
        slots[first('status')] = { key: '', id: '', custom: 'navigation', targetPage: 'map', trueIcon: 'map' };
        const details = deviceDetailsRuntimeOf({
            deviceId: DEV,
            entries: [ref('power')],
            devicePage: { layout: 1, slots },
        }) as DeviceDetailsRuntime;
        const content = await devicePageElements(
            { type: 'switch', data: {} } as never,
            details,
            details.devicePage as DevicePageRuntime,
            getObject,
            k => k,
            'de',
        );
        expect(content.skipped).to.deep.equal([]);
        const info: any = content.elements[1 + first('info')];
        const button: any = content.elements[1 + first('button')];
        const status: any = content.elements[1 + first('status')];
        expect(info.devicePageTarget).to.equal('rooms');
        expect(button.devicePageTarget).to.equal('rooms');
        expect(button.data.text.true.constVal).to.equal('Räume');
        expect(status.devicePageTarget).to.equal('map');
        expect(status.data.icon.true.value.constVal).to.equal('map');
        expect(content.channelSlots).to.deep.equal([]);
    });
    it('elements: a channel slot navigates only where its tap reaches the adapter', async () => {
        const slots: (Record<string, unknown> | null)[] = DEVICE_PAGE_LAYOUTS[1].map(() => null);
        const a = first('info');
        const b = first('button');
        slots[a] = { key: '', id: 'alias.0.socket', custom: 'channel', isNavigation: true, targetPage: 'rooms' };
        slots[b] = { key: '', id: 'alias.0.blind', custom: 'channel', isNavigation: true, targetPage: 'rooms' };
        const details = deviceDetailsRuntimeOf({
            deviceId: DEV,
            entries: [],
            devicePage: { layout: 1, slots },
        }) as DeviceDetailsRuntime;
        const channelItem = (type: string): any => ({ type, role: '', dpInit: '', data: { icon: {} } });
        const source: any = {
            type: 'switch',
            data: {},
            devicePageChannels: {
                [a]: { role: 'socket', item: channelItem('switch') },
                [b]: { role: 'blind', item: channelItem('shutter') },
            },
        };
        const content = await devicePageElements(
            source,
            details,
            details.devicePage as DevicePageRuntime,
            getObject,
            k => k,
            'de',
        );
        const socket: any = content.elements[1 + a];
        const blind: any = content.elements[1 + b];
        expect(socket.type).to.equal('switch');
        expect(socket.devicePageTarget).to.equal('rooms');
        // the popup of the HMI comes first
        expect(blind.type).to.equal('shutter');
        expect(blind.devicePageTarget).to.equal(undefined);
        // the item built once is not changed
        expect(source.devicePageChannels[a].item.devicePageTarget).to.equal(undefined);
    });
    it('channel slot: the navigation is not handed to the page item of the channel', () => {
        const item = devicePageChannelAdminItem(
            {
                key: '',
                id: 'alias.0.socket',
                custom: 'channel',
                isNavigation: true,
                targetPage: 'rooms',
                trueIcon: 'x',
            },
            'socket',
        );
        expect(item.isNavigation).to.equal(undefined);
        expect(item.targetPage).to.equal(undefined);
        expect(item.trueIcon).to.equal('x');
    });
    it('a missing target page is reported once per panel and target', () => {
        const panelA = {};
        const panelB = {};
        expect(reportMissingDevicePageTarget(panelA, 'rooms')).to.equal(true);
        expect(reportMissingDevicePageTarget(panelA, 'rooms')).to.equal(false);
        expect(reportMissingDevicePageTarget(panelA, 'map')).to.equal(true);
        expect(reportMissingDevicePageTarget(panelB, 'rooms')).to.equal(true);
    });

    describe('the tap', () => {
        const noop = (): void => undefined;
        /**
         * @param known the navigation targets of the panel
         * @param config the item
         * @param dataItems its data items
         * @returns the item and what happened
         */
        function tapItem(
            known: string[],
            config: Record<string, unknown>,
            dataItems: Record<string, unknown>,
        ): { item: PageItem; opened: string[]; warnings: string[] } {
            const opened: string[] = [];
            const warnings: string[] = [];
            const panel = {
                name: 'Flur',
                navigation: {
                    hasTarget: (n: string): boolean => known.includes(n),
                    setTargetPageByName: async (n: string): Promise<void> => {
                        opened.push(n);
                        return Promise.resolve();
                    },
                },
            };
            const item = Object.create(PageItem.prototype) as PageItem;
            Object.assign(item, {
                id: 'dp_3?2',
                log: { debug: noop, warn: (t: string) => warnings.push(t), error: noop, info: noop, silly: noop },
                adapter: { unload: false },
                parent: {
                    id: 'dp_3',
                    name: 'main-device',
                    card: 'cardDevice1',
                    isScreensaver: false,
                    basePanel: panel,
                },
                config,
                dataItems,
            });
            return { item, opened, warnings };
        }
        it('opens the target page by the navigation of the panel and does nothing else', async () => {
            let written = 0;
            const set = {
                writeable: true,
                common: { read: false },
                setStateTrue: async (): Promise<void> => {
                    written++;
                    return Promise.resolve();
                },
                setStateFlip: async (): Promise<void> => {
                    written++;
                    return Promise.resolve();
                },
            };
            const f = tapItem(
                ['rooms'],
                { type: 'button', devicePageTarget: 'rooms' },
                { type: 'button', role: DEVICE_DETAIL_ROW_ROLE, data: { entity1: { set, value: set } } },
            );
            expect(await f.item.onCommand('button', '')).to.not.equal(undefined);
            expect(f.opened).to.deep.equal(['rooms']);
            expect(written).to.equal(0);
            expect(f.warnings).to.deep.equal([]);
        });
        it('a navigation slot (text) opens its page', async () => {
            const nav = devicePageNavigationSlotItem('info', {
                key: '',
                id: '',
                custom: 'navigation',
                targetPage: 'rooms',
            });
            const f = tapItem(['rooms'], { ...nav }, { type: 'text', role: DEVICE_DETAIL_ROW_ROLE, data: {} });
            await f.item.onCommand('button', '');
            expect(f.opened).to.deep.equal(['rooms']);
        });
        it('a target that is no page of the panel: nothing happens, one warning', async () => {
            const f = tapItem(
                ['rooms'],
                { type: 'text', devicePageTarget: 'gone' },
                { type: 'text', role: DEVICE_DETAIL_ROW_ROLE, data: {} },
            );
            await f.item.onCommand('button', '');
            await f.item.onCommand('button', '');
            expect(f.opened).to.deep.equal([]);
            expect(f.warnings.length).to.equal(1);
            expect(f.warnings[0]).to.contain('"gone"');
            expect(f.warnings[0]).to.contain('Flur');
        });
        it('the switch of a switch slot still switches', async () => {
            const written: unknown[] = [];
            const value = {
                writeable: true,
                type: 'boolean',
                trueType: (): string => 'boolean',
                common: { read: true },
                setState: async (v: unknown): Promise<void> => {
                    written.push(v);
                    return Promise.resolve();
                },
            };
            const f = tapItem(
                ['rooms'],
                { type: 'switch', devicePageTarget: 'rooms' },
                { type: 'switch', role: DEVICE_DETAIL_ROW_ROLE, data: { entity1: { value } } },
            );
            await f.item.onCommand('OnOff', '1');
            expect(written).to.deep.equal([true]);
            expect(f.opened).to.deep.equal([]);
        });
    });
});

describe('lib/pages/device-page - alias channels in slots', () => {
    const channel = (id: string): { key: string; id: string; custom: 'channel' } => ({
        key: '',
        id,
        custom: 'channel',
    });
    const light: any = {
        type: 'light',
        role: 'light',
        data: {
            icon: { true: { value: { type: 'const', constVal: 'lightbulb' } } },
            headline: { type: 'const', constVal: 'Licht' },
        },
    };
    const sensor: any = {
        type: 'text',
        role: '',
        data: {
            icon: {
                true: {
                    value: { type: 'const', constVal: 'thermometer' },
                    text: {
                        value: { type: 'triggered', dp: 'alias.0.t.ACTUAL' },
                        unit: { type: 'const', constVal: '°C' },
                    },
                },
                false: {
                    value: { type: 'const', constVal: 'thermometer' },
                    text: { value: { type: 'triggered', dp: 'alias.0.t.ACTUAL' } },
                },
            },
            entity1: { value: { type: 'triggered', dp: 'alias.0.t.ACTUAL' } },
            text: { true: { type: 'const', constVal: 'Temp' } },
        },
    };
    it('the admin item of a channel: the channel with the settings of the slot, a long press only where the role takes it', () => {
        const slot = {
            ...channel('alias.0.s'),
            trueIcon: 'a',
            falseColor: '#010203',
            scale: { val_min: 0, val_max: 1 },
            longPress: 'x.y',
        };
        expect(devicePageChannelAdminItem(slot, 'socket')).to.deep.equal({
            channelId: emptyChannelValueConfig('alias.0.s'),
            trueIcon: 'a',
            falseColor: '#010203',
            scale: { val_min: 0, val_max: 1 },
            longPress: 'x.y',
        });
        expect(devicePageChannelAdminItem(slot, 'light').longPress).to.equal(undefined);
        // the existing chain takes the fields
        const script = adminPageItemToScriptItem(devicePageChannelAdminItem(slot, 'socket')) as any;
        expect(script.id).to.equal('alias.0.s');
        expect(script.icon).to.equal('a');
        expect(script.offColor).to.deep.equal({ red: 1, green: 2, blue: 3 });
        expect(script.longPress).to.equal('x.y');
    });
    it('built when the item is configured: by slot, with the role; missing, unfitting and rejected ones reported', async () => {
        const { page } = runtime({
            layout: 3,
            slots: [
                channel('alias.0.light'),
                channel('alias.0.gone'),
                channel('alias.0.broken'),
                ref('power'),
                { key: '', id: OWN, custom: 'state' },
                null,
                channel('alias.0.blind'),
                channel('alias.0.light'),
            ],
        });
        const roles: Record<string, string> = {
            'alias.0.light': 'light',
            'alias.0.broken': 'socket',
            'alias.0.blind': 'blind',
        };
        const converted: string[] = [];
        const result = await devicePageChannels(
            page,
            async id => Promise.resolve(roles[id]),
            async item => {
                converted.push(item.channelId.valueStateId);
                if (item.channelId.valueStateId === 'alias.0.broken') {
                    throw new Error('SET missing');
                }
                return Promise.resolve(light);
            },
        );
        expect(converted).to.deep.equal(['alias.0.light', 'alias.0.broken', 'alias.0.light']);
        expect(Object.keys(result.channels)).to.deep.equal(['0', '7']);
        expect(result.channels[0]).to.deep.equal({ role: 'light', item: light });
        expect(result.errors).to.have.length(3);
        expect(result.errors[0]).to.contain('alias.0.gone').and.contain('not found');
        expect(result.errors[1]).to.contain('alias.0.broken').and.contain('SET missing');
        expect(result.errors[2]).to.contain('slot 7 (switch)').and.contain('role blind');
    });
    it('the item of a channel stays as it is; a text shows its icon and has its value in field 6', () => {
        expect(devicePageChannelSlotItem('button', { role: 'light', item: light })).to.deep.equal(light);
        expect(devicePageChannelSlotItem('progress', { role: 'light', item: light })).to.equal(undefined);
        const info = devicePageChannelSlotItem('info', { role: 'thermostat', item: sensor }) as any;
        expect(info.data.icon.true.text).to.equal(undefined);
        expect(info.data.icon.false.text).to.equal(undefined);
        expect(info.data.icon.true.value.constVal).to.equal('thermometer');
        expect(info.data.entity2).to.deep.equal({
            value: { type: 'triggered', dp: 'alias.0.t.ACTUAL' },
            unit: { type: 'const', constVal: '°C' },
        });
        // the source is not changed, a status icon needs no value, a button slot keeps the item
        expect(sensor.data.icon.true.text).to.not.equal(undefined);
        expect(
            (devicePageChannelSlotItem('status', { role: 'thermostat', item: sensor }) as any).data.entity2,
        ).to.equal(undefined);
        expect(devicePageChannelSlotItem('button', { role: 'thermostat', item: sensor })).to.deep.equal(sensor);
    });
    it('field 6 by kind of slot and type of the element', () => {
        const onOff = (on: boolean): string => (on ? 'An' : 'Aus');
        const e = (type: string, value: string): string => `${type}~dp_3?1~I~5~Name~${value}`;
        const f6 = (kind: Parameters<typeof devicePageChannelElement>[0], type: string, value: string): string =>
            devicePageChannelElement(kind, e(type, value), onOff).split('~')[5];
        const shutter = 'A|B|C|enable|enable|disable';
        for (const kind of ['info', 'value'] as const) {
            expect(f6(kind, 'text', '21.5 °C')).to.equal('21.5 °C');
            expect(f6(kind, 'input_sel', 'Auto')).to.equal('Auto');
            expect(f6(kind, 'timer', '05:00')).to.equal('05:00');
            expect(f6(kind, 'number', '40|0|200')).to.equal('40');
            expect(f6(kind, 'light', '1')).to.equal('An');
            expect(f6(kind, 'switch', '0')).to.equal('Aus');
            expect(f6(kind, 'fan', '1')).to.equal('An');
            expect(f6(kind, 'button', '1')).to.equal('');
            expect(f6(kind, 'shutter', shutter)).to.equal('');
            expect(f6(kind, 'shutter2', shutter)).to.equal('');
        }
        expect(f6('progress', 'number', '40|0|200')).to.equal('20');
        expect(f6('progress', 'number', '150||')).to.equal('100');
        expect(f6('progress', 'text', 'x')).to.equal('0');
        expect(f6('switch', 'light', '1')).to.equal('1');
        expect(f6('switch', 'switch', '0')).to.equal('0');
        expect(f6('switch', 'fan', 'x')).to.equal('0');
        expect(f6('button', 'switch', '1')).to.equal('1');
        expect(f6('button', 'shutter', shutter)).to.equal('');
        expect(f6('button', 'number', '40|0|200')).to.equal('');
        expect(f6('status', 'light', '1')).to.equal('');
        // the other fields stay, an empty element stays
        expect(devicePageChannelElement('info', e('light', '1'), onOff)).to.equal('light~dp_3?1~I~5~Name~An');
        expect(devicePageChannelElement('info', DEVICE_PAGE_EMPTY_ELEMENT, onOff)).to.equal(DEVICE_PAGE_EMPTY_ELEMENT);
        expect(devicePageChannelElement('info', '', onOff)).to.equal('');
    });
    it('elements: an own data point like a state of the device, a channel as its item; missing ones reported', async () => {
        const { details, page } = runtime({
            layout: 3,
            slots: [
                { key: '', id: '0_userdata.0.wm.energy', custom: 'state' },
                channel('alias.0.light'),
                channel('alias.0.none'),
                { key: '', id: '0_userdata.0.wm.gone', custom: 'state' },
                null,
                null,
                channel('alias.0.light'),
                null,
            ],
        });
        const source = {
            ...sourceSwitch,
            devicePageChannels: { 1: { role: 'light', item: light }, 6: { role: 'light', item: light } },
        };
        const content = await devicePageElements(source, details, page, getObject, k => k, 'de');
        const own = content.elements[1] as any;
        expect(own.type).to.equal('text');
        expect(own.data.entity2.value.dp).to.equal('0_userdata.0.wm.energy');
        expect(own.data.text.true.constVal).to.equal('energy');
        expect(content.elements[2]).to.deep.equal(light);
        expect(content.elements[7]).to.deep.equal(light);
        expect(content.elements[3]).to.equal(undefined);
        expect(content.channelSlots).to.deep.equal([1, 6]);
        expect(content.skipped).to.deep.equal(['alias.0.none', '0_userdata.0.wm.gone']);
        expect((devicePagePageConfig('dp_3', 3, 'none', content).config as any).channelSlots).to.deep.equal([1, 6]);
        // main is the item itself without the channel items
        expect((content.elements[0] as any).devicePageChannels).to.equal(undefined);
    });
});

describe('lib/pages/pageItem - a plain light on the device page', () => {
    const noop = (): void => undefined;
    const log = { debug: noop, warn: noop, error: noop, info: noop, silly: noop };
    /**
     * @param card card of the page
     * @param role role of the item
     * @returns field 1 (type) of the payload of a light item
     */
    async function typeOn(card: string, role: string): Promise<string> {
        const controller = { statesControler: { activateTrigger: async (): Promise<void> => undefined } };
        const adapter: unknown = { log, controller, config: {} };
        const c = (v: string | boolean | number): Dataitem =>
            new Dataitem(adapter, { type: 'const', constVal: v }, {} as never, {} as never);
        const item = Object.create(PageItem.prototype) as PageItem;
        Object.assign(item, {
            id: 'dp_3?3',
            log,
            config: { role },
            adapter,
            library: { getTranslation: (k: string): string => k },
            parent: { card, basePanel: { overrideLightPopup: false } },
            isEnabled: async (): Promise<boolean> => true,
            dataItems: {
                type: 'light',
                role,
                data: { entity1: { value: c(true) }, icon: { true: { value: c('lightbulb') } }, headline: c('Licht') },
            },
        });
        return (await item.getPageItemPayload()).split('~')[0];
    }
    it('cardDevice1-3 are device pages', () => {
        expect(['cardDevice1', 'cardDevice2', 'cardDevice3'].every(isCardDeviceType)).to.equal(true);
        expect(isCardDeviceType('cardGrid')).to.equal(false);
    });
    it('role light / socket: a switch (no popupLight when held), a dimmer stays a light', async () => {
        expect(await typeOn('cardDevice1', 'light')).to.equal('switch');
        expect(await typeOn('cardDevice3', 'socket')).to.equal('switch');
        expect(await typeOn('cardDevice2', 'dimmer')).to.equal('light');
        expect(await typeOn('cardEntities', 'light')).to.equal('light');
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
        it('short tap devicePage: the tap opens the device page like the long press, the detail page as fallback', async () => {
            const f = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            const details = deviceDetailsRuntimeOf({
                deviceId: DEV,
                shortPress: 'devicePage',
                entries: [ref('power')],
                devicePage: { layout: 2, slots: [ref('power')] },
            });
            const config = { type: 'button', data: {}, deviceDetails: details };
            await f.makeItem(f.parent, config, { type: 'button', data: {} }).onCommand('button', '');
            expect(f.created.map((p: { id: string }) => p.id)).to.deep.equal(['dp_3']);
            // main of the device page: no device page inside, the tap does nothing
            const main = f.created[0].config.config.elements[0];
            expect(main.type).to.equal('text');
            expect(main.deviceDetails.devicePage).to.equal(undefined);
            const old = setup({ model: 'us-p', displayVersion: '9.0.0' });
            await old.makeItem(old.parent, config, { type: 'button', data: {} }).onCommand('button', '');
            expect(old.created.map((p: { id: string }) => p.id)).to.deep.equal(['dd_3']);
            // any other short tap never opens it
            const other = setup({ model: 'eu', displayVersion: CARD_DEVICE_MIN_TFT });
            await other.item.onCommand('button', '');
            expect(other.created).to.have.length(0);
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
