import { expect } from 'chai';
import {
    DEVICE_PAGE_CUSTOM_STATUS,
    PREVIEW_INFO,
    PREVIEW_MAIN,
    PREVIEW_STATUS_LINE,
    devicePagePreviewAreas,
    devicePageRefOf,
    devicePageStateOptions,
    devicePageStatusOf,
    devicePageStatusSelectValue,
    customDevicePageStatus,
    isCustomDevicePageStatus,
    devicePageToSave,
    isLongPressTarget,
    longPressTargetOf,
    switchLongPressTarget,
    withDevicePageIcon,
    withDevicePageLayout,
    withDevicePageSlot,
    withDevicePageSlotIcon,
    withDevicePageStatus,
    type LongPressStash,
} from './devicePageConfig';
import {
    DEVICE_PAGE_LAYOUTS,
    type DeviceDetailsConfig,
    type DevicePageConfig,
    type DeviceStateInfo,
} from '../../src/lib/types/deviceDetails';

const DEV = 'shelly.0.dev1';

/** the status slots of layout 1 (indexes) - their number comes from DEVICE_PAGE_LAYOUTS only */
const STATUS = DEVICE_PAGE_LAYOUTS[1].flatMap((kind, i) => (kind === 'status' ? [i] : []));
/** nulls for the status slots of layout 1 */
const STATUS_NULLS: null[] = STATUS.map(() => null);

function state(rest: string, extra: Partial<DeviceStateInfo> = {}): DeviceStateInfo {
    return { id: `${DEV}.${rest}`, name: rest, role: 'state', type: 'number', read: true, write: false, ...extra };
}

const STATES: DeviceStateInfo[] = [
    state('Relay0.Power', { role: 'value.power', name: 'Leistung' }),
    state('Relay0.Switch', { role: 'switch', type: 'boolean', write: true }),
    state('Sys.reboot', { role: 'button', type: 'boolean', read: false, write: true }),
    state('Sys.version', { role: 'state', type: 'string', name: 'Version' }),
];

function device(extra: Partial<DeviceDetailsConfig> = {}): DeviceDetailsConfig {
    return {
        deviceId: DEV,
        shortPress: 'state',
        entries: [
            { key: 'power', id: `${DEV}.Relay0.Power` },
            { key: 'firmware', id: `${DEV}.Sys.version`, subName: 'FW' },
        ],
        ...extra,
    };
}

describe('devicePageConfig - device page of the page item dialog', () => {
    it('isLongPressTarget / longPressTargetOf', () => {
        expect(isLongPressTarget('details')).to.equal(true);
        expect(isLongPressTarget('devicePage')).to.equal(true);
        expect(isLongPressTarget('other')).to.equal(false);
        expect(longPressTargetOf(device())).to.equal('details');
        expect(longPressTargetOf(device({ devicePage: { layout: 1, slots: [], showInfo: true } }))).to.equal(
            'devicePage',
        );
    });

    it('a device page chosen for the first time is the suggestion from the ticked rows', () => {
        const r = switchLongPressTarget(device(), {}, 'devicePage');
        expect(r.device.devicePage).to.deep.equal({
            layout: 1,
            slots: [
                { key: 'power', id: `${DEV}.Relay0.Power` },
                { key: 'firmware', id: `${DEV}.Sys.version`, subName: 'FW' },
                null,
                null,
                null,
                null,
                ...STATUS_NULLS,
            ],
            showInfo: true,
        });
        expect(r.stash).to.deep.equal({ details: undefined });
    });

    it('switching back to the detail page removes devicePage and brings the kept one back', () => {
        const page: DevicePageConfig = {
            layout: 3,
            slots: [null, null, null, null, null, null, { key: '', id: `${DEV}.Relay0.Switch` }, null],
            showInfo: false,
            icon: 'washing-machine',
        };
        let stash: LongPressStash = {};
        let r = switchLongPressTarget(device({ devicePage: page }), stash, 'details');
        expect(r.device).to.not.have.property('devicePage');
        expect(r.device.entries).to.have.length(2);
        stash = r.stash;
        r = switchLongPressTarget(r.device, stash, 'devicePage');
        expect(r.device.devicePage).to.deep.equal(page);
    });

    it('the same target changes nothing', () => {
        const d = device();
        const r = switchLongPressTarget(d, {}, 'details');
        expect(r.device).to.equal(d);
    });

    it('devicePageToSave normalizes and is undefined for the detail page', () => {
        expect(devicePageToSave(device())).to.equal(undefined);
        expect(
            devicePageToSave({
                devicePage: { layout: 2, slots: [{ key: '', id: '' }], showInfo: true, icon: ' ' },
            }),
        ).to.deep.equal({ layout: 2, slots: [null, null, null, null, null, null], showInfo: true });
    });

    it('withDevicePageLayout keeps the slots by position', () => {
        const page: DevicePageConfig = {
            layout: 3,
            slots: [
                { key: 'a', id: 'x.1' },
                null,
                null,
                null,
                null,
                null,
                { key: 'b', id: 'x.7' },
                { key: 'c', id: 'x.8' },
            ],
            showInfo: true,
        };
        const one = withDevicePageLayout(page, 1);
        expect(one.layout).to.equal(1);
        // slots 7/8 (switch) stay by position in the first status slots
        expect(one.slots).to.deep.equal([
            { key: 'a', id: 'x.1' },
            null,
            null,
            null,
            null,
            null,
            { key: 'b', id: 'x.7' },
            { key: 'c', id: 'x.8' },
            ...STATUS_NULLS.slice(2),
        ]);
        expect(withDevicePageLayout(page, 3)).to.equal(page);
        expect(withDevicePageLayout(one, 3).slots).to.have.length(8);
    });

    it('withDevicePageSlot / withDevicePageStatus / withDevicePageIcon', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const withSlot = withDevicePageSlot(page, 2, { key: '', id: 'x.3' });
        expect(withSlot.slots).to.deep.equal([null, null, { key: '', id: 'x.3' }, null, null, null, ...STATUS_NULLS]);
        expect(withDevicePageSlot(withSlot, 2, null).slots[2]).to.equal(null);
        expect(withDevicePageSlot(page, DEVICE_PAGE_LAYOUTS[1].length, { key: '', id: 'x' })).to.equal(page);

        const withStatus = withDevicePageStatus(page, { key: '', id: 'x.s' });
        expect(withStatus.status).to.deep.equal({ key: '', id: 'x.s' });
        expect(withDevicePageStatus(withStatus, null)).to.not.have.property('status');

        expect(withDevicePageIcon(page, ' robot ').icon).to.equal('robot');
        expect(withDevicePageIcon({ ...page, icon: 'robot' }, '')).to.not.have.property('icon');
    });

    it('status line: own data point - the choice stays without id, never an option of the device', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const states: DeviceStateInfo[] = [
            { id: `${DEV}.phase`, name: 'Phase', type: 'string', role: 'text', read: true, write: false },
        ];
        expect(devicePageStatusSelectValue(undefined)).to.equal('');
        expect(devicePageStatusSelectValue({ key: '', id: `${DEV}.phase` })).to.equal(`${DEV}.phase`);
        expect(isCustomDevicePageStatus({ key: '', id: `${DEV}.phase` })).to.equal(false);

        // chosen, nothing entered yet: stays "own data point", also through the save
        const options = devicePageStateOptions(DEV, states, null, null);
        const pending = withDevicePageStatus(page, devicePageStatusOf(DEVICE_PAGE_CUSTOM_STATUS, options, [], null));
        expect(pending.status).to.deep.equal({ key: '', id: '', custom: true });
        expect(devicePageStatusSelectValue(pending.status)).to.equal(DEVICE_PAGE_CUSTOM_STATUS);
        expect(devicePageToSave({ devicePage: pending })?.status).to.deep.equal({ key: '', id: '', custom: true });

        // an id outside the device
        const own = withDevicePageStatus(pending, customDevicePageStatus('0_userdata.0.msg'));
        expect(own.status).to.deep.equal({ key: '', id: '0_userdata.0.msg', custom: true });
        expect(devicePageStatusSelectValue(own.status)).to.equal(DEVICE_PAGE_CUSTOM_STATUS);
        expect(isCustomDevicePageStatus(own.status)).to.equal(true);
        expect(devicePageToSave({ devicePage: own })?.status).to.deep.equal(own.status);
        // choosing "own data point" again keeps the id
        expect(devicePageStatusOf(DEVICE_PAGE_CUSTOM_STATUS, options, [], own.status)).to.deep.equal(own.status);

        // the section offers the states of the device without the own data point: nothing marked as missing
        const offered = devicePageStateOptions(
            DEV,
            states,
            null,
            isCustomDevicePageStatus(own.status) ? null : own.status,
        );
        expect(offered.map(o => o.id)).to.deep.equal([`${DEV}.phase`]);
        expect(offered.some(o => o.problem)).to.equal(false);

        // back to a state of the device (no flag, the own id is not taken over) or to empty
        expect(devicePageStatusOf(`${DEV}.phase`, offered, [], own.status)).to.deep.equal({
            key: '',
            id: `${DEV}.phase`,
        });
        expect(devicePageStatusOf('', offered, [], own.status)).to.equal(null);
        // a state of the device chosen before keeps its reference
        const saved = { key: 'k', id: `${DEV}.phase`, subName: 'x' };
        expect(devicePageStatusOf(`${DEV}.phase`, offered, [], saved)).to.deep.equal(saved);
    });

    it('status slots: own icon only with a state, kept when another state is chosen', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const s = STATUS[0];
        expect(withDevicePageSlotIcon(page, s, 'filter')).to.equal(page);
        const withState = withDevicePageSlot(page, s, { key: '', id: 'x.door' });
        const withIcon = withDevicePageSlotIcon(withState, s, ' filter ');
        expect(withIcon.slots[s]).to.deep.equal({ key: '', id: 'x.door', icon: 'filter' });
        // another state keeps the icon, removing the state removes it
        expect(withDevicePageSlot(withIcon, s, { key: 'k', id: 'x.bin' }).slots[s]).to.deep.equal({
            key: 'k',
            id: 'x.bin',
            icon: 'filter',
        });
        expect(withDevicePageSlot(withIcon, s, null).slots[s]).to.equal(null);
        expect(withDevicePageSlotIcon(withIcon, s, '').slots[s]).to.deep.equal({ key: '', id: 'x.door' });
        // no own icon on other kinds
        const info = withDevicePageSlot(page, 0, { key: '', id: 'x.p' });
        expect(withDevicePageSlotIcon(info, 0, 'filter')).to.equal(info);
        expect(withDevicePageSlot(info, 0, { key: '', id: 'x.p', icon: 'filter' }).slots[0]).to.deep.equal({
            key: '',
            id: 'x.p',
        });
    });

    it('preview: the status grid only with a status slot filled, 2 columns, narrow info rows then', () => {
        const plain = devicePagePreviewAreas(1, false);
        expect(plain.filter(a => STATUS.includes(a.slot - 1))).to.deep.equal([]);
        expect(plain.find(a => a.slot === 1)).to.deep.include({ x: 126, w: 314 });
        const grid = devicePagePreviewAreas(1, true);
        const cells = grid.filter(a => STATUS.includes(a.slot - 1));
        expect(cells.map(a => a.slot)).to.deep.equal(STATUS.map(i => i + 1));
        expect(cells.slice(0, 4).map(a => [a.x, a.y, a.w, a.h])).to.deep.equal([
            [124, 71, 38, 45],
            [161, 71, 38, 45],
            [124, 115, 38, 45],
            [161, 115, 38, 45],
        ]);
        const rows = new Set(cells.map(a => a.y));
        expect(rows.size).to.equal(STATUS.length / 2);
        expect(grid.find(a => a.slot === 1)).to.deep.include({ x: 204, w: 236 });
        for (const layout of [1, 2, 3] as const) {
            const areas = devicePagePreviewAreas(layout, layout === 1);
            const slots = areas.filter(a => a.slot > 0).map(a => a.slot);
            expect(slots.sort((a, b) => a - b)).to.deep.equal(DEVICE_PAGE_LAYOUTS[layout].map((_, i) => i + 1));
            expect(areas.some(a => a.slot === PREVIEW_MAIN)).to.equal(true);
            expect(areas.some(a => a.slot === PREVIEW_INFO)).to.equal(true);
            expect(areas.some(a => a.slot === PREVIEW_STATUS_LINE)).to.equal(true);
        }
    });

    describe('devicePageStateOptions', () => {
        it('filters the states by the kind of the slot, the status line takes all', () => {
            const ids = (kind: Parameters<typeof devicePageStateOptions>[2]): string[] =>
                devicePageStateOptions(DEV, STATES, kind, null).map(o => o.rest);
            expect(ids(null)).to.deep.equal(['Relay0.Power', 'Relay0.Switch', 'Sys.reboot', 'Sys.version']);
            expect(ids('info')).to.deep.equal(['Relay0.Power', 'Relay0.Switch', 'Sys.reboot', 'Sys.version']);
            expect(ids('button')).to.deep.equal(['Relay0.Switch', 'Sys.reboot']);
            expect(ids('switch')).to.deep.equal(['Relay0.Switch']);
            expect(ids('progress')).to.deep.equal(['Relay0.Power']);
        });

        it('names a state by the entry of the mask', () => {
            const [power] = devicePageStateOptions(DEV, STATES, 'progress', null);
            expect(power).to.deep.equal({
                id: `${DEV}.Relay0.Power`,
                rest: 'Relay0.Power',
                key: 'power',
                stateName: 'Leistung',
            });
        });

        it('keeps a saved state the device does not have, marked', () => {
            const options = devicePageStateOptions(DEV, STATES, 'info', { key: 'rssi', id: `${DEV}.gone` });
            expect(options[0]).to.deep.equal({
                id: `${DEV}.gone`,
                rest: 'gone',
                key: 'rssi',
                stateName: '',
                problem: 'missing',
            });
            expect(options).to.have.length(5);
        });

        it('keeps a saved state that does not fit the slot, marked', () => {
            const options = devicePageStateOptions(DEV, STATES, 'switch', { key: '', id: `${DEV}.Sys.version` });
            expect(options[0].problem).to.equal('unfit');
            expect(options[0].stateName).to.equal('Version');
        });

        it('without an answer of the adapter only the saved state, unmarked', () => {
            expect(devicePageStateOptions(DEV, null, 'button', { key: '', id: `${DEV}.x` })).to.deep.equal([
                { id: `${DEV}.x`, rest: 'x', key: '', stateName: '' },
            ]);
            expect(devicePageStateOptions(DEV, null, 'button', null)).to.deep.equal([]);
        });
    });

    describe('devicePageRefOf', () => {
        const options = devicePageStateOptions(DEV, STATES, null, null);
        const entries = device().entries;

        it('empty is null', () => {
            expect(devicePageRefOf('', options, entries, null)).to.equal(null);
        });

        it('the same state keeps the saved reference', () => {
            const current = { key: 'x', id: `${DEV}.Relay0.Power`, subName: 'own' };
            expect(devicePageRefOf(`${DEV}.Relay0.Power`, options, entries, current)).to.deep.equal(current);
        });

        it('a ticked row gives its entry and own text', () => {
            expect(devicePageRefOf(`${DEV}.Sys.version`, options, entries, null)).to.deep.equal({
                key: 'firmware',
                id: `${DEV}.Sys.version`,
                subName: 'FW',
            });
        });

        it('another state gets the entry of the mask', () => {
            expect(devicePageRefOf(`${DEV}.Relay0.Switch`, options, entries, null)).to.deep.equal({
                key: 'switch',
                id: `${DEV}.Relay0.Switch`,
            });
            expect(devicePageRefOf(`${DEV}.Sys.reboot`, options, entries, null)).to.deep.equal({
                key: '',
                id: `${DEV}.Sys.reboot`,
            });
        });
    });
});
