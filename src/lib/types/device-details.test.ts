import { expect } from 'chai';
import objects from '../../../test/fixtures/device-details/objects.json';
import { Icons } from '../const/icon_mapping';
import {
    buildDeviceDetailRows,
    deviceDetailSubNameTokens,
    deviceDetailEntriesOfRows,
    deviceDetailSubNames,
    deviceDetailEntryOfRow,
    deviceDetailEntryOfState,
    deviceDetailIdentifier,
    deviceDetailMaskOf,
    deviceDetailMasks,
    deviceDetailRowKind,
    deviceDetailRuleMatches,
    deviceDetailsRuntimeOf,
    deviceSelectionError,
    generalDeviceDetailMask,
    isDeviceDetailState,
    deviceDetailsLearnedOf,
    deviceShortPressOf,
    isDeviceShortPressState,
    exchangeDeviceDetailRowState,
    tickDeviceDetailRow,
    tickedDeviceDetailRowsFirst,
    updatedDeviceDetailsLearned,
    type DeviceStateInfo,
} from './deviceDetails';

/** anonymized excerpt of a productive ioBroker (allObjects.json, 2026-11-21) */
const fixture: Record<string, { type: string; states: DeviceStateInfo[] }> = objects;

const SHELLY = 'shelly.0.shellyplus1pm#000000000001#1';
const SHELLY2 = 'shelly.0.shellyplus2pm#000000000002#1';
const SONOFF = 'sonoff.0.Plug_01';
const ZIGBEE = 'zigbee2mqtt.0.0x0000000000000001';
const HM = 'hm-rpc.1.000000000000A1';
const HMIP = 'hmip.0.devices.3014F711A000000000000001';

/**
 * @param deviceId device of the fixture
 * @returns the ticked rows of a new item without learned ticks: key -> id below the device
 */
function defaultRows(deviceId: string): Record<string, string[]> {
    const out: Record<string, string[]> = {};
    for (const row of buildDeviceDetailRows(deviceId, fixture[deviceId].states, undefined, undefined)) {
        if (row.enabled) {
            (out[row.key] ??= []).push(row.id.slice(deviceId.length + 1));
        }
    }
    return out;
}

describe('lib/types/deviceDetails', () => {
    describe('masks of the known adapters (real objects)', () => {
        it('shelly: rules by role and end of the id, temperature as °C state', () => {
            expect(defaultRows(SHELLY)).to.deep.equal({
                switch: ['Relay0.Switch'],
                power: ['Relay0.Power'],
                voltage: ['Relay0.Voltage'],
                current: ['Relay0.Current'],
                energy: ['Relay0.Energy'],
                temperature: ['Relay0.temperatureC'],
                humidity: ['Ext.humidity100'],
                rssi: ['rssi'],
                reachable: ['online'],
                ip: ['hostname'],
                firmware: ['version'],
                update: ['firmware'],
                uptime: ['uptime'],
            });
        });
        it('shelly: the °F twin and the voltmeter of the add-on are no entries of the mask', () => {
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, undefined, undefined);
            const plain = rows.filter(r => r.key === '').map(r => r.id.slice(SHELLY.length + 1));
            expect(plain).to.include('Relay0.temperatureF');
            expect(plain).to.include('Ext.temperature100C');
            expect(rows.filter(r => r.key === '').every(r => !r.enabled)).to.equal(true);
        });
        it('shelly Gen1 PM: energy with role value.power.consumption', () => {
            const id = 'shelly.0.SHSW-PM#000001#1';
            const states: DeviceStateInfo[] = [
                {
                    id: `${id}.Relay0.Energy`,
                    name: 'Energy',
                    role: 'value.power.consumption',
                    type: 'number',
                    read: true,
                    write: false,
                    unit: 'Wh',
                },
                {
                    id: `${id}.Relay0.Power`,
                    name: 'Power',
                    role: 'value.power',
                    type: 'number',
                    read: true,
                    write: false,
                    unit: 'W',
                },
            ];
            const rows = buildDeviceDetailRows(id, states, undefined, undefined);
            expect(deviceDetailEntriesOfRows(rows)).to.deep.equal([
                { key: 'power', id: `${id}.Relay0.Power` },
                { key: 'energy', id: `${id}.Relay0.Energy` },
            ]);
        });
        it('sonoff: Tasmota energy and the INFO folder', () => {
            expect(defaultRows(SONOFF)).to.deep.equal({
                switch: ['POWER'],
                power: ['ENERGY_Power'],
                voltage: ['ENERGY_Voltage'],
                current: ['ENERGY_Current'],
                energyToday: ['ENERGY_Today'],
                energy: ['ENERGY_Total'],
                rssi: ['Wifi_Signal'],
                reachable: ['alive'],
                ip: ['INFO.IPAddress'],
                firmware: ['INFO.Version'],
                uptime: ['UptimeSec'],
            });
        });
        it('zigbee2mqtt: contact sensor', () => {
            expect(defaultRows(ZIGBEE)).to.deep.equal({
                battery: ['battery'],
                batteryVoltage: ['voltage'],
                deviceTemperature: ['device_temperature'],
                linkQuality: ['link_quality'],
                reachable: ['available'],
                lastSeen: ['last_seen'],
            });
        });
        it('hm-rpc: the states lie in the channels :0 and :1', () => {
            expect(defaultRows(HM)).to.deep.equal({
                voltage: ['0.OPERATING_VOLTAGE'],
                lowBattery: ['0.LOW_BAT'],
                temperature: ['1.ACTUAL_TEMPERATURE'],
                setpoint: ['1.SET_POINT_TEMPERATURE'],
                humidity: ['1.HUMIDITY'],
                rssi: ['0.RSSI_DEVICE'],
                unreachable: ['0.UNREACH'],
                update: ['0.UPDATE_PENDING'],
            });
        });
        it('hmip: the states lie in channels.0, channels.1 and info (radiator thermostat)', () => {
            expect(defaultRows(HMIP)).to.deep.equal({
                lowBattery: ['channels.0.lowBat'],
                temperature: ['channels.1.valveActualTemperature'],
                setpoint: ['channels.1.setPointTemperature'],
                valvePosition: ['channels.1.valvePosition'],
                rssi: ['channels.0.rssiDeviceValue'],
                unreachable: ['channels.0.unreach'],
                firmware: ['info.firmwareVersion'],
            });
        });
        it('hmip: every state of the device becomes a row, the other ones without entry', () => {
            const rows = buildDeviceDetailRows(HMIP, fixture[HMIP].states, undefined, undefined);
            expect(rows.every(r => r.id !== '')).to.equal(true);
            expect(rows.map(r => r.id).sort()).to.deep.equal(fixture[HMIP].states.map(s => s.id).sort());
            expect(rows.find(r => r.id === `${HMIP}.channels.0.rssiPeerValue`)).to.deep.equal({
                key: '',
                id: `${HMIP}.channels.0.rssiPeerValue`,
                enabled: false,
            });
        });
        it('the general mask knows the role indicator.maintenance.lowbat', () => {
            const state = { id: 'foo.0.dev.lowBat', role: 'indicator.maintenance.lowbat' };
            expect(deviceDetailEntryOfState(generalDeviceDetailMask, state)?.key).to.equal('lowBattery');
            expect(
                deviceDetailEntryOfState(generalDeviceDetailMask, { ...state, role: 'indicator.lowbat' })?.key,
            ).to.equal('lowBattery');
        });
        it('an entry of an own mask without state is listed empty and not ticked', () => {
            const rows = buildDeviceDetailRows(SHELLY2, fixture[SHELLY2].states, undefined, undefined);
            expect(rows.find(r => r.key === 'switch')).to.deep.equal({ key: 'switch', id: '', enabled: false });
            expect(deviceDetailEntriesOfRows(rows).some(e => e.id === '')).to.equal(false);
        });
        it('an unknown adapter uses the general mask: by role only, no empty rows', () => {
            const states: DeviceStateInfo[] = fixture[SHELLY].states.map(s => ({
                ...s,
                id: s.id.replace(SHELLY, 'foo.0.dev'),
            }));
            const rows = buildDeviceDetailRows('foo.0.dev', states, undefined, undefined);
            expect(deviceDetailMaskOf('foo.0.dev')).to.equal(generalDeviceDetailMask);
            expect(rows.every(r => r.id !== '')).to.equal(true);
            const ticked = rows.filter(r => r.enabled);
            expect(ticked.map(r => r.key)).to.include.members(['switch', 'power', 'voltage', 'temperature']);
            // role value of the Shelly rssi carries nothing without the mask of the adapter
            expect(rows.find(r => r.id === 'foo.0.dev.rssi')?.key).to.equal('');
        });
        it('every icon of the masks exists in the icon font', () => {
            for (const mask of [generalDeviceDetailMask, ...deviceDetailMasks]) {
                for (const entry of mask.entries) {
                    // an unknown name comes back unchanged
                    expect(Icons.GetIcon(entry.icon), `${mask.adapter}:${entry.key}`).to.not.equal(entry.icon);
                }
            }
        });
        it('a rule without condition matches nothing, a unit must match exactly', () => {
            const state = { id: 'a.0.b.c', role: 'value.power.consumption', unit: 'kWh' };
            expect(deviceDetailRuleMatches({}, state)).to.equal(false);
            expect(deviceDetailRuleMatches({ role: 'value.power.consumption', unit: 'W' }, state)).to.equal(false);
            expect(deviceDetailRuleMatches({ role: 'value.power.consumption', unit: 'kWh' }, state)).to.equal(true);
        });
        it('a row without entry takes icon and group from the role (general mask)', () => {
            expect(
                deviceDetailEntryOfRow(SHELLY, '', { id: `${SHELLY}.Ext.voltmeter100`, role: 'value.voltage' }),
            ).to.have.property('key', 'voltage');
            expect(deviceDetailEntryOfRow(SHELLY, 'rssi', undefined)).to.have.property('group', 'connection');
            expect(deviceDetailEntryOfRow(SHELLY, '', { id: 'x', role: 'text' })).to.equal(undefined);
        });
    });

    describe('choice of the device: device or channel only, states as deep as the mask allows', () => {
        it('only objects of type device or channel', () => {
            expect(deviceSelectionError(SHELLY, 'device')).to.equal(undefined);
            expect(deviceSelectionError(SONOFF, 'channel')).to.equal(undefined);
            expect(deviceSelectionError(`${SHELLY}.Relay0.Power`, 'state')).to.equal('type');
            expect(deviceSelectionError('shelly.0.info', 'folder')).to.equal('type');
            expect(deviceSelectionError(SHELLY, undefined)).to.equal('notFound');
        });
        it('never an instance or the root of an adapter', () => {
            expect(deviceSelectionError('shelly.0', 'device')).to.equal('root');
            expect(deviceSelectionError('shelly', 'channel')).to.equal('root');
        });
        it('never the info channel of an instance', () => {
            expect(deviceSelectionError('shelly.0.info', 'channel')).to.equal('info');
            expect(deviceSelectionError('zigbee2mqtt.0.info', 'channel')).to.equal('info');
            expect(deviceSelectionError('foo.1.info', 'device')).to.equal('info');
            // a folder below a device called info is something else
            expect(deviceSelectionError('alias.0.Rooms.info', 'channel')).to.equal(undefined);
        });
        it('a known adapter fixes the level of its devices, an unknown one does not', () => {
            expect(deviceSelectionError(`${SHELLY}.Relay0`, 'channel')).to.equal('level');
            expect(deviceSelectionError(`${HM}.1`, 'channel')).to.equal('level');
            expect(deviceSelectionError('alias.0.Rooms.Kitchen.Light', 'channel')).to.equal(undefined);
        });
        it('states directly below the device or in one sub folder', () => {
            expect(isDeviceDetailState(SHELLY, `${SHELLY}.rssi`)).to.equal(true);
            expect(isDeviceDetailState(SHELLY, `${SHELLY}.Relay0.Power`)).to.equal(true);
            expect(isDeviceDetailState(SHELLY, `${SHELLY}.Relay0.Deep.Power`)).to.equal(false);
            expect(isDeviceDetailState(SHELLY, `${SHELLY}x.rssi`)).to.equal(false);
            expect(isDeviceDetailState('', 'a.b')).to.equal(false);
        });
        it('hmip: the device lies on level 4, not its channels or the devices folder', () => {
            expect(deviceSelectionError(HMIP, 'device')).to.equal(undefined);
            expect(deviceSelectionError(`${HMIP}.channels.1`, 'channel')).to.equal('level');
            expect(deviceSelectionError('hmip.0.devices', 'channel')).to.equal('level');
        });
        it('hmip: states up to 3 parts below the device (stateDepth of its mask)', () => {
            expect(isDeviceDetailState(HMIP, `${HMIP}.channels.1.setPointTemperature`)).to.equal(true);
            expect(isDeviceDetailState(HMIP, `${HMIP}.info.firmwareVersion`)).to.equal(true);
            expect(isDeviceDetailState(HMIP, `${HMIP}.channels.1.deep.setPointTemperature`)).to.equal(false);
            const deeper: DeviceStateInfo = {
                ...fixture[HMIP].states[0],
                id: `${HMIP}.channels.1.deep.valvePosition`,
            };
            const rows = buildDeviceDetailRows(HMIP, [...fixture[HMIP].states, deeper], undefined, undefined);
            expect(rows.some(r => r.id === deeper.id)).to.equal(false);
        });
        it('other adapters keep at most 2 parts below the device', () => {
            expect(isDeviceDetailState(HM, `${HM}.1.x.STATE`)).to.equal(false);
            expect(isDeviceDetailState('foo.0.dev', 'foo.0.dev.channels.1.x')).to.equal(false);
            expect(isDeviceDetailState('foo.0.dev', 'foo.0.dev.channels.x')).to.equal(true);
        });
        it('the deeper state of the fixture never becomes a row', () => {
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, undefined, undefined);
            expect(rows.some(r => r.id.endsWith('Relay0.Deep.Power'))).to.equal(false);
            expect(rows.filter(r => r.id === `${SHELLY}.Relay0.Power`)).to.have.length(1);
        });
    });

    describe('row kinds of the detail page', () => {
        it('decides by type, read and write', () => {
            expect(deviceDetailRowKind({ type: 'boolean', read: false, write: true })).to.equal('button');
            expect(deviceDetailRowKind({ type: 'boolean', read: true, write: true })).to.equal('switch');
            expect(deviceDetailRowKind({ type: 'boolean', read: true, write: false })).to.equal('boolean');
            expect(deviceDetailRowKind({ type: 'number', write: true })).to.equal('number');
            expect(deviceDetailRowKind({ type: 'number', write: false })).to.equal('number');
            expect(deviceDetailRowKind({ type: 'string', write: true })).to.equal('text');
            expect(deviceDetailRowKind({ type: 'mixed', write: false })).to.equal('text');
        });
        it('a writable number or string with a list in common.states is a selection', () => {
            expect(deviceDetailRowKind({ type: 'number', write: true, states: { 0: 'a' } })).to.equal('select');
            expect(deviceDetailRowKind({ type: 'string', write: true, states: ['a'] })).to.equal('select');
            expect(deviceDetailRowKind({ type: 'number', write: false, states: { 0: 'a' } })).to.equal('number');
            expect(deviceDetailRowKind({ type: 'string', states: { a: 'A' } })).to.equal('select');
            expect(deviceDetailRowKind({ type: 'boolean', states: { true: 'a' } })).to.equal('switch');
            // the old string form is not used at runtime, empty lists neither
            expect(deviceDetailRowKind({ type: 'number', write: true, states: '0:a;1:b' })).to.equal('number');
            expect(deviceDetailRowKind({ type: 'number', write: true, states: {} })).to.equal('number');
            expect(deviceDetailRowKind({ type: 'string', write: true, states: [] })).to.equal('text');
        });
    });

    describe('ticks: saved per item, learned per adapter', () => {
        it('saved rows come first in their order, the rest unticked', () => {
            const saved = [
                { key: 'rssi', id: `${SHELLY}.rssi` },
                { key: '', id: `${SHELLY}.Relay0.Frequency` },
            ];
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, saved, ['power']);
            expect(rows.slice(0, 2)).to.deep.equal([
                { key: 'rssi', id: `${SHELLY}.rssi`, enabled: true },
                { key: '', id: `${SHELLY}.Relay0.Frequency`, enabled: true },
            ]);
            expect(rows.slice(2).every(r => !r.enabled)).to.equal(true);
            expect(rows.filter(r => r.id === `${SHELLY}.rssi`)).to.have.length(1);
            expect(deviceDetailEntriesOfRows(rows)).to.deep.equal(saved);
        });
        it('a new item gets the learned ticks of its adapter in their order', () => {
            const learned = ['firmware', '~Relay0.Frequency', 'power', 'unknownKey'];
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, undefined, learned);
            expect(deviceDetailEntriesOfRows(rows)).to.deep.equal([
                { key: 'firmware', id: `${SHELLY}.version` },
                { key: '', id: `${SHELLY}.Relay0.Frequency` },
                { key: 'power', id: `${SHELLY}.Relay0.Power` },
            ]);
        });
        it('identifiers: the key of the entry, a plain state by its id below the device', () => {
            expect(deviceDetailIdentifier(SHELLY, { key: 'power', id: `${SHELLY}.Relay0.Power` })).to.equal('power');
            expect(deviceDetailIdentifier(SHELLY, { key: '', id: `${SHELLY}.Relay0.Frequency` })).to.equal(
                '~Relay0.Frequency',
            );
        });
        it('learned: saved per adapter, changed only by the ticks or their order', () => {
            const before = { deviceId: SHELLY, entries: [{ key: 'power', id: `${SHELLY}.Relay0.Power` }] };
            const learned = { zigbee2mqtt: ['battery'] };
            // a new item teaches its adapter
            expect(updatedDeviceDetailsLearned(learned, undefined, before, true)).to.deep.equal({
                zigbee2mqtt: ['battery'],
                shelly: ['power'],
            });
            // the same ticks (only the name changed) teach nothing
            expect(updatedDeviceDetailsLearned({ shelly: ['x'] }, before, { ...before }, true)).to.equal(undefined);
            // other order
            const after = {
                deviceId: SHELLY,
                entries: [
                    { key: '', id: `${SHELLY}.Relay0.Frequency` },
                    { key: 'power', id: `${SHELLY}.Relay0.Power` },
                ],
            };
            expect(updatedDeviceDetailsLearned({}, before, after, true)).to.deep.equal({
                shelly: ['~Relay0.Frequency', 'power'],
            });
            // nothing ticked is a valid learned choice
            expect(updatedDeviceDetailsLearned({}, before, { deviceId: SHELLY, entries: [] }, true)).to.deep.equal({
                shelly: [],
            });
        });
        it('learned: entries the user did not edit in the filter list teach nothing', () => {
            const learned = { shelly: ['power'] };
            // a new item saved without opening the filter list - e.g. its entries stayed empty (no answer)
            expect(updatedDeviceDetailsLearned(learned, undefined, { deviceId: SHELLY, entries: [] }, false)).to.equal(
                undefined,
            );
            // another device of the adapter, entries only suggested
            const before = { deviceId: `${SHELLY}x`, entries: [] };
            const after = { deviceId: SHELLY, entries: [{ key: 'voltage', id: `${SHELLY}.Relay0.Voltage` }] };
            expect(updatedDeviceDetailsLearned(learned, before, after, false)).to.equal(undefined);
            // the user unticked everything in the filter list: a valid choice
            expect(
                updatedDeviceDetailsLearned(learned, undefined, { deviceId: SHELLY, entries: [] }, true),
            ).to.deep.equal({ shelly: [] });
        });
        it('learned: an empty list ticks nothing (no fall back to the mask)', () => {
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, undefined, []);
            expect(rows.some(r => r.enabled)).to.equal(false);
            expect(rows.some(r => r.key === 'power')).to.equal(true);
        });
        it('learned: read from the native configuration, invalid entries left out', () => {
            expect(deviceDetailsLearnedOf({ shelly: ['power'], bad: [1], other: 'x', empty: [] })).to.deep.equal({
                shelly: ['power'],
                empty: [],
            });
            expect(deviceDetailsLearnedOf(undefined)).to.deep.equal({});
            expect(deviceDetailsLearnedOf([])).to.deep.equal({});
        });
        it('a state is shown in one row only: saved rows and exchanged states', () => {
            // the user gave the entry rssi the state of power: power stays as empty row, the state appears once
            const saved = [
                { key: 'rssi', id: `${SHELLY}.Relay0.Power` },
                { key: 'firmware', id: `${SHELLY}.Relay0.Power` },
            ];
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, saved, undefined);
            expect(rows.filter(r => r.id === `${SHELLY}.Relay0.Power`)).to.have.length(1);
            expect(rows.find(r => r.key === 'power')).to.deep.equal({ key: 'power', id: '', enabled: false });
            expect(
                deviceDetailEntriesOfRows([...rows, { key: '', id: `${SHELLY}.Relay0.Power`, enabled: true }]),
            ).to.have.length(1);
        });
        it('exchanging the state of a row swaps it with the row that had it', () => {
            const rows = [
                { key: 'power', id: 'a', enabled: true },
                { key: 'voltage', id: 'b', enabled: false },
                { key: '', id: 'c', enabled: false },
                { key: 'switch', id: '', enabled: false },
            ];
            expect(exchangeDeviceDetailRowState(rows, 0, 'b')).to.deep.equal([
                { key: 'power', id: 'b', enabled: true },
                { key: 'voltage', id: 'a', enabled: false },
                { key: '', id: 'c', enabled: false },
                { key: 'switch', id: '', enabled: false },
            ]);
            // the empty row takes a state: it is ticked, the plain row of that state is dropped
            expect(exchangeDeviceDetailRowState(rows, 3, 'c')).to.deep.equal([
                { key: 'power', id: 'a', enabled: true },
                { key: 'voltage', id: 'b', enabled: false },
                { key: 'switch', id: 'c', enabled: true },
            ]);
            // an entry row that loses its state without getting one back becomes empty
            expect(exchangeDeviceDetailRowState(rows, 3, 'a')[0]).to.deep.equal({
                key: 'power',
                id: '',
                enabled: false,
            });
            expect(exchangeDeviceDetailRowState(rows, 1, '')[1]).to.deep.equal({
                key: 'voltage',
                id: '',
                enabled: false,
            });
        });
        it('runtime part: only rows with a state, an unusable configuration gives none', () => {
            expect(
                deviceDetailsRuntimeOf({
                    deviceId: SHELLY,
                    entries: [
                        { key: 'power', id: `${SHELLY}.Relay0.Power` },
                        { key: 'switch', id: '' },
                    ],
                }),
            ).to.deep.equal({ deviceId: SHELLY, entries: [{ key: 'power', id: `${SHELLY}.Relay0.Power` }] });
            expect(deviceDetailsRuntimeOf(undefined)).to.equal(undefined);
            expect(deviceDetailsRuntimeOf({ deviceId: '', entries: [] })).to.equal(undefined);
            expect(deviceDetailsRuntimeOf({ deviceId: SHELLY, entries: [{ key: 1 }] })).to.equal(undefined);
        });
    });
    describe('short tap of a device item', () => {
        it('state, none, navigation, popup; anything else counts as state', () => {
            expect(deviceShortPressOf({})).to.equal('state');
            expect(deviceShortPressOf({ shortPress: 'none' })).to.equal('none');
            expect(deviceShortPressOf({ shortPress: 'navigation' })).to.equal('navigation');
            expect(deviceShortPressOf({ shortPress: 'popup' })).to.equal('popup');
            expect(deviceShortPressOf({ shortPress: 'foo' })).to.equal('state');
        });
        it('offers writable booleans, buttons with read: false included', () => {
            expect(isDeviceShortPressState({ type: 'boolean', write: true })).to.equal(true);
            expect(isDeviceShortPressState({ type: 'boolean', write: false })).to.equal(false);
            expect(isDeviceShortPressState({ type: 'number', write: true })).to.equal(false);
            const buttons = fixture[SHELLY].states.filter(isDeviceShortPressState).filter(s => !s.read);
            expect(buttons.map(s => s.id.slice(SHELLY.length + 1))).to.include.members(['reboot', 'firmwareupdate']);
        });
    });

    describe('second name line of rows with the same name', () => {
        const ids = ['Relay0.temperatureC', 'Ext.temperature100C', 'Ext.temperature101C', 'Ext.temperature104C'];
        const texts = (...rests: string[]): string[] =>
            deviceDetailSubNames(
                SHELLY,
                rests.map(rest => ({ id: `${SHELLY}.${rest}`, name: 'Temperatur' })),
            ).map(r => r.text);
        it('parts of an id: every folder one part, the end id cut into letters and digits', () => {
            expect(deviceDetailSubNameTokens('Ext.temperature100C')).to.deep.equal(['Ext', 'temperature', '100', 'C']);
            expect(deviceDetailSubNameTokens('Relay0.temperatureC')).to.deep.equal(['Relay0', 'temperature', 'C']);
            expect(deviceDetailSubNameTokens('a.Sensor.pm2_5')).to.deep.equal(['a', 'Sensor', 'pm', '2', '5']);
            expect(deviceDetailSubNameTokens('rssi')).to.deep.equal(['rssi']);
            expect(deviceDetailSubNameTokens('ABCValue1')).to.deep.equal(['ABC', 'Value', '1']);
            expect(deviceDetailSubNameTokens('Sensor.Temperatur°C')).to.deep.equal(['Sensor', 'Temperatur', 'C']);
        });
        it('automatic text: only what differs within the rows of the same name', () => {
            expect(texts('Ext.temperature100C', 'Ext.temperature101C')).to.deep.equal(['100', '101']);
            expect(texts('Ext.temperature100C', 'Ext.temperature100F')).to.deep.equal(['C', 'F']);
            expect(texts('Relay0.temperatureC', 'Ext.temperature100C')).to.deep.equal(['Relay0', 'Ext 100']);
            expect(texts('Relay0.temperatureC', 'Ext.temperature100C', 'Ext.temperature101C')).to.deep.equal([
                'Relay0',
                'Ext 100',
                'Ext 101',
            ]);
            expect(texts('Relay0.Power', 'Relay1.Power')).to.deep.equal(['Relay0', 'Relay1']);
        });
        it('automatic text empty or not unique: the id below the device', () => {
            // the same tokens in another order: the differing part is empty
            expect(texts('a.b.x', 'b.a.x')).to.deep.equal(['a.b.x', 'b.a.x']);
            // "Ext 2 5" twice (only the separator differs): only these two fall back
            expect(texts('Ext.pm2_5', 'Ext.pm2-5', 'Relay0.pm')).to.deep.equal(['Ext.pm2_5', 'Ext.pm2-5', 'Relay0']);
        });
        it('a single row: no automatic text', () => {
            expect(texts('Ext.temperature100C')).to.deep.equal(['']);
        });
        it('the fixture: every "Temperatur" gets a second line, the other rows none', () => {
            const states = fixture[SHELLY].states;
            for (const id of ids) {
                expect(
                    states.some(st => st.id === `${SHELLY}.${id}`),
                    id,
                ).to.equal(true);
            }
            const rows = [
                ...ids.map(id => ({ id: `${SHELLY}.${id}`, name: 'Temperatur' })),
                { id: `${SHELLY}.rssi`, name: 'WLAN' },
            ];
            expect(deviceDetailSubNames(SHELLY, rows)).to.deep.equal([
                { duplicate: true, auto: 'Relay0', text: 'Relay0' },
                { duplicate: true, auto: 'Ext 100', text: 'Ext 100' },
                { duplicate: true, auto: 'Ext 101', text: 'Ext 101' },
                { duplicate: true, auto: 'Ext 104', text: 'Ext 104' },
                { duplicate: false, auto: 'rssi', text: '' },
            ]);
        });
        it('°C and °F of one sensor next to another sensor: everything not in all rows, C included', () => {
            expect(texts('Ext.temperature100C', 'Ext.temperature100F', 'Relay0.temperatureC')).to.deep.equal([
                'Ext 100 C',
                'Ext 100 F',
                'Relay0 C',
            ]);
        });
        it('groups of different names are compared separately', () => {
            const rows = [
                { id: `${SHELLY}.Ext.temperature100C`, name: 'Temperatur' },
                { id: `${SHELLY}.Ext.temperature100F`, name: 'Temperatur' },
                { id: `${SHELLY}.Relay0.Power`, name: 'Leistung' },
                { id: `${SHELLY}.Relay1.Power`, name: 'Leistung' },
            ];
            expect(deviceDetailSubNames(SHELLY, rows).map(r => r.text)).to.deep.equal(['C', 'F', 'Relay0', 'Relay1']);
        });
        it('an own text wins, also without duplicate; blanks only = automatic', () => {
            const rows = [
                { id: `${SHELLY}.Relay0.temperatureC`, name: 'Temperatur', subName: 'Gerät' },
                { id: `${SHELLY}.Ext.temperature100C`, name: 'Temperatur', subName: '  ' },
                { id: `${SHELLY}.rssi`, name: 'WLAN', subName: 'Router' },
            ];
            expect(deviceDetailSubNames(SHELLY, rows).map(r => r.text)).to.deep.equal(['Gerät', 'Ext 100', 'Router']);
        });
        it('the own text is saved with the row and read back', () => {
            const saved = deviceDetailEntriesOfRows([
                { key: 'temperature', id: `${SHELLY}.Relay0.temperatureC`, enabled: true, subName: ' Gerät ' },
                { key: '', id: `${SHELLY}.Ext.temperature100C`, enabled: true, subName: '' },
            ]);
            expect(saved).to.deep.equal([
                { key: 'temperature', id: `${SHELLY}.Relay0.temperatureC`, subName: 'Gerät' },
                { key: '', id: `${SHELLY}.Ext.temperature100C` },
            ]);
            const rows = buildDeviceDetailRows(SHELLY, fixture[SHELLY].states, saved, undefined);
            expect(rows[0]).to.deep.equal({ ...saved[0], enabled: true });
            expect(rows[1]).to.deep.equal({ ...saved[1], enabled: true });
            // the panel appends the second line to the name (deviceDetailRowNames)
            expect(deviceDetailsRuntimeOf({ deviceId: SHELLY, entries: saved })?.entries).to.deep.equal(saved);
            expect(deviceDetailsRuntimeOf({ deviceId: SHELLY, entries: [{ key: '', id: 'x', subName: 1 }] })).to.equal(
                undefined,
            );
        });
    });

    describe('filter list: ticked rows on top', () => {
        const row = (id: string, enabled: boolean): { key: string; id: string; enabled: boolean } => ({
            key: '',
            id,
            enabled,
        });
        const ids = (rows: readonly { id: string; enabled: boolean }[]): string[] =>
            rows.map(r => `${r.id}${r.enabled ? '+' : ''}`);
        it('ticked first, the order within both blocks stays', () => {
            expect(
                ids(tickedDeviceDetailRowsFirst([row('a', false), row('b', true), row('c', false), row('d', true)])),
            ).to.deep.equal(['b+', 'd+', 'a', 'c']);
        });
        it('ticking moves the row behind the last ticked one', () => {
            const rows = [row('a', true), row('b', true), row('c', false), row('d', false), row('e', false)];
            expect(ids(tickDeviceDetailRow(rows, 3, true))).to.deep.equal(['a+', 'b+', 'd+', 'c', 'e']);
            expect(ids(tickDeviceDetailRow(rows, 2, true))).to.deep.equal(['a+', 'b+', 'c+', 'd', 'e']);
        });
        it('unticking moves the row to the first unticked place', () => {
            const rows = [row('a', true), row('b', true), row('c', true), row('d', false)];
            expect(ids(tickDeviceDetailRow(rows, 0, false))).to.deep.equal(['b+', 'c+', 'a', 'd']);
            expect(ids(tickDeviceDetailRow(rows, 2, false))).to.deep.equal(['a+', 'b+', 'c', 'd']);
        });
        it('the saved order is the order of the ticked block', () => {
            let rows = [row('a', true), row('b', true), row('c', false), row('d', false)];
            rows = tickDeviceDetailRow(rows, 3, true);
            rows = tickDeviceDetailRow(rows, 0, false);
            // b+ d+ a c: tick a again
            rows = tickDeviceDetailRow(rows, 2, true);
            expect(ids(rows)).to.deep.equal(['b+', 'd+', 'a+', 'c']);
            expect(deviceDetailEntriesOfRows(rows).map(e => e.id)).to.deep.equal(['b', 'd', 'a']);
        });
        it('the first ticking of an empty list', () => {
            expect(ids(tickDeviceDetailRow([row('a', false), row('b', false)], 1, true))).to.deep.equal(['b+', 'a']);
            expect(ids(tickDeviceDetailRow([row('a', true)], 5, false))).to.deep.equal(['a+']);
        });
    });
});
