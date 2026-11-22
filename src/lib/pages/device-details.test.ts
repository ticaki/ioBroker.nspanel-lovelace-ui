import { expect } from 'chai';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import type { NSPanel } from '../types/NSPanel';
import { DEVICE_DETAIL_ROW_ROLE } from '../types/deviceDetails';
import {
    DEVICE_DETAIL_PAGE_PREFIX,
    deviceDetailGroupColor,
    deviceDetailPageConfig,
    deviceDetailRowItem,
    deviceDetailRowNames,
    deviceDetailRows,
} from './device-details';

const DEV = 'shelly.0.shellyplus2pm#000000000002#1';

/**
 * @param item a page item
 * @returns its data as plain record for the checks
 */
function dataOf(item: NSPanel.PageItemDataItemsOptions): Record<string, any> {
    return JSON.parse(JSON.stringify(item.data ?? {}));
}

describe('lib/pages/device-details', () => {
    describe('rows of the detail page', () => {
        it('boolean writable: a switch (OnOff) in the colors activated/deactivated, the state as entity1', () => {
            const item = deviceDetailRowItem(
                DEV,
                { key: 'switch', id: `${DEV}.Relay0.Switch` },
                { type: 'boolean', read: true, write: true, role: 'switch' },
                'Switch',
            );
            expect(item.type).to.equal('switch');
            expect(item.role).to.equal(DEVICE_DETAIL_ROW_ROLE);
            const data = dataOf(item);
            expect(data.entity1).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.Relay0.Switch` } });
            expect(data.text.true.constVal).to.equal('Switch');
            expect(data.icon.true.value.constVal).to.equal('toggle-switch');
            expect(data.icon.true.color.constVal).to.deep.equal(JSON.parse(JSON.stringify(Color.activated)));
            expect(data.icon.false.color.constVal).to.deep.equal(JSON.parse(JSON.stringify(Color.deactivated)));
        });
        it('boolean read only: text with on/off, the state as entity1', () => {
            const item = deviceDetailRowItem(
                DEV,
                { key: '', id: `${DEV}.online` },
                { type: 'boolean', read: true, write: false, role: 'indicator.reachable' },
                'Online',
            );
            expect(item.type).to.equal('text');
            const data = dataOf(item);
            expect(data.entity1).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.online` } });
            expect(data.text1).to.deep.equal({
                true: { type: 'const', constVal: 'on' },
                false: { type: 'const', constVal: 'off' },
            });
        });
        it('read: false: a button that is written with true', () => {
            const item = deviceDetailRowItem(
                DEV,
                { key: '', id: `${DEV}.reboot` },
                { type: 'boolean', read: false, write: true, role: 'button' },
                'Reboot',
            );
            expect(item.type).to.equal('button');
            const data = dataOf(item);
            expect(data.entity1).to.deep.equal({ set: { type: 'state', dp: `${DEV}.reboot` } });
            expect(data.text1.true.constVal).to.equal('press');
            expect(data.icon.true.value.constVal).to.equal('gesture-tap-button');
        });
        it('number writable: type number (slider value|min|max), range from common, raw value', () => {
            const item = deviceDetailRowItem(
                DEV,
                { key: '', id: `${DEV}.Relay0.AutoTimerOffDelay` },
                { type: 'number', write: true, role: 'level.timer', unit: 's', min: 1, max: 5000, step: 5 },
                'Delay',
            );
            expect(item.type).to.equal('number');
            const data = dataOf(item);
            // not scaled: the slider of cardEntities shows and sets the value itself
            expect(data.entity1).to.deep.equal({
                value: { type: 'triggered', dp: `${DEV}.Relay0.AutoTimerOffDelay` },
            });
            expect(data.minValue1.constVal).to.equal(1);
            expect(data.maxValue1.constVal).to.equal(5000);
            expect(data.text.true.constVal).to.equal('Delay');
            expect(data.heading1).to.equal(undefined);
        });
        it('number writable without range: 0..100', () => {
            const data = dataOf(
                deviceDetailRowItem(DEV, { key: '', id: `${DEV}.x` }, { type: 'number', write: true }, 'X'),
            );
            expect(data.minValue1.constVal).to.equal(0);
            expect(data.maxValue1.constVal).to.equal(100);
        });
        it('every kind of state gets the row type of cardEntities', () => {
            const kinds: [Parameters<typeof deviceDetailRowItem>[2], string][] = [
                [{ type: 'boolean', write: true }, 'switch'],
                [{ type: 'boolean', write: false }, 'text'],
                [{ type: 'boolean', read: false, write: true }, 'button'],
                [{ type: 'number', write: true }, 'number'],
                [{ type: 'number', write: false }, 'text'],
                [{ type: 'string', write: true }, 'text'],
                [{ type: 'string', write: false }, 'text'],
            ];
            for (const [common, type] of kinds) {
                expect(deviceDetailRowItem(DEV, { key: '', id: `${DEV}.x` }, common, 'X').type).to.equal(type);
            }
        });
        it('number / string read only: text with the value (entity2), color of the group', () => {
            const power = deviceDetailRowItem(
                DEV,
                { key: 'power', id: `${DEV}.Relay0.Power` },
                { type: 'number', write: false, role: 'value.power', unit: 'W' },
                'Power',
            );
            expect(power.type).to.equal('text');
            const data = dataOf(power);
            expect(data.entity2).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.Relay0.Power` } });
            expect(data.entity1).to.equal(undefined);
            expect(data.icon.true.value.constVal).to.equal('lightning-bolt');
            expect(data.icon.true.color.constVal).to.deep.equal(
                JSON.parse(JSON.stringify(deviceDetailGroupColor('energy'))),
            );
            const version = dataOf(
                deviceDetailRowItem(
                    DEV,
                    { key: 'firmware', id: `${DEV}.version` },
                    { type: 'string', write: false, role: 'state' },
                    'Firmware',
                ),
            );
            expect(version.icon.true.value.constVal).to.equal('chip');
            expect(version.icon.true.color.constVal).to.deep.equal(
                JSON.parse(JSON.stringify(deviceDetailGroupColor('info'))),
            );
        });
        it('a row without entry takes icon and group from its role', () => {
            const data = dataOf(
                deviceDetailRowItem(
                    DEV,
                    { key: '', id: `${DEV}.Ext.voltmeter100` },
                    { type: 'number', write: false, role: 'value.voltage', unit: 'V' },
                    'Voltage',
                ),
            );
            expect(data.icon.true.value.constVal).to.equal('flash');
        });
        it('the fallback icons exist', () => {
            for (const icon of ['gesture-tap-button', 'toggle-switch', 'numeric', 'information-outline']) {
                expect(Icons.GetIcon(icon)).to.not.equal(icon);
            }
        });
        it('climate takes the existing temperature color of the theme', () => {
            expect(deviceDetailGroupColor('climate')).to.equal(Color.temperature);
        });
    });

    describe('names of the rows', () => {
        it('entry name translated, a plain state by its name, several rows of an entry with their folder', () => {
            const names = deviceDetailRowNames(
                DEV,
                [
                    { key: 'power', id: `${DEV}.Relay0.Power` },
                    { key: 'power', id: `${DEV}.Relay1.Power` },
                    { key: 'rssi', id: `${DEV}.rssi` },
                    { key: '', id: `${DEV}.Relay0.Frequency` },
                    { key: '', id: `${DEV}.Relay0.Unnamed` },
                ],
                [{}, {}, {}, { name: { en: 'Frequency', de: 'Frequenz' } }, undefined],
                key => `T(${key})`,
                'de',
            );
            expect(names).to.deep.equal([
                'T(deviceDetail_power) Relay0',
                'T(deviceDetail_power) Relay1',
                'T(deviceDetail_rssi)',
                'Frequenz',
                'Unnamed',
            ]);
        });
    });

    describe('detail page', () => {
        it('cardEntities, headline = device name, classic paging', () => {
            const page = deviceDetailPageConfig('dd_3', 'Kitchen', 'action', []);
            expect(page.config).to.deep.equal({
                card: 'cardEntities',
                scrollPresentation: 'classic',
                scrollType: 'page',
                data: { headline: { type: 'const', constVal: 'Kitchen' } },
            });
            expect('alwaysOn' in page && page.alwaysOn).to.equal('action');
        });
        it('the ids of the rows fit the id buffers of the HMI (23 characters)', () => {
            expect(`${DEVICE_DETAIL_PAGE_PREFIX}1999?249`.length).to.be.at.most(23);
        });
        it('reads the objects, leaves out rows whose state is gone', async () => {
            const objects: Record<string, ioBroker.Object> = {
                [DEV]: { _id: DEV, type: 'device', common: { name: 'Kitchen light' }, native: {} },
                [`${DEV}.rssi`]: {
                    _id: `${DEV}.rssi`,
                    type: 'state',
                    common: { name: 'rssi', type: 'number', role: 'value', read: true, write: false, unit: 'dBm' },
                    native: {},
                },
            };
            const result = await deviceDetailRows(
                {
                    deviceId: DEV,
                    entries: [
                        { key: 'rssi', id: `${DEV}.rssi` },
                        { key: 'power', id: `${DEV}.Relay0.Power` },
                    ],
                },
                async id => Promise.resolve(objects[id] ?? null),
                key => key,
                'en',
            );
            expect(result.headline).to.equal('Kitchen light');
            expect(result.rows).to.have.length(1);
            expect(dataOf(result.rows[0]).entity2.value.dp).to.equal(`${DEV}.rssi`);
            expect(dataOf(result.rows[0]).text.true.constVal).to.equal('deviceDetail_rssi');
        });
    });
});
