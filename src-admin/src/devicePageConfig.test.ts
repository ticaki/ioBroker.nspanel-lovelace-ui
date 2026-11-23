import { expect } from 'chai';
import {
    devicePageRefOf,
    devicePageStateOptions,
    devicePageToSave,
    isLongPressTarget,
    longPressTargetOf,
    switchLongPressTarget,
    withDevicePageIcon,
    withDevicePageLayout,
    withDevicePageSlot,
    withDevicePageStatus,
    type LongPressStash,
} from './devicePageConfig';
import type { DeviceDetailsConfig, DevicePageConfig, DeviceStateInfo } from '../../src/lib/types/deviceDetails';

const DEV = 'shelly.0.dev1';

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
        expect(one.slots).to.deep.equal([{ key: 'a', id: 'x.1' }, null, null, null, null, null]);
        expect(withDevicePageLayout(page, 3)).to.equal(page);
        expect(withDevicePageLayout(one, 3).slots).to.have.length(8);
    });

    it('withDevicePageSlot / withDevicePageStatus / withDevicePageIcon', () => {
        const page: DevicePageConfig = { layout: 1, slots: [], showInfo: true };
        const withSlot = withDevicePageSlot(page, 2, { key: '', id: 'x.3' });
        expect(withSlot.slots).to.deep.equal([null, null, { key: '', id: 'x.3' }, null, null, null]);
        expect(withDevicePageSlot(withSlot, 2, null).slots[2]).to.equal(null);
        expect(withDevicePageSlot(page, 6, { key: '', id: 'x' })).to.equal(page);

        const withStatus = withDevicePageStatus(page, { key: '', id: 'x.s' });
        expect(withStatus.status).to.deep.equal({ key: '', id: 'x.s' });
        expect(withDevicePageStatus(withStatus, null)).to.not.have.property('status');

        expect(withDevicePageIcon(page, ' robot ').icon).to.equal('robot');
        expect(withDevicePageIcon({ ...page, icon: 'robot' }, '')).to.not.have.property('icon');
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
