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
    deviceDetailNameWithSuffix,
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
        it('number writable without common.states: a read only text with value and unit, no slider', () => {
            const item = deviceDetailRowItem(
                DEV,
                { key: '', id: `${DEV}.Relay0.AutoTimerOffDelay` },
                { type: 'number', write: true, role: 'level.timer', unit: 's', min: 1, max: 5000, step: 5 },
                'Delay',
            );
            expect(item.type).to.equal('text');
            const data = dataOf(item);
            expect(data.entity2).to.deep.equal({
                value: { type: 'triggered', dp: `${DEV}.Relay0.AutoTimerOffDelay` },
            });
            expect(data.entity1).to.equal(undefined);
            expect(data.minValue1).to.equal(undefined);
            expect(data.text.true.constVal).to.equal('Delay');
        });
        it('number / string writable with common.states: input_sel (popupInSel), the row shows the text', () => {
            for (const states of [{ 0: 'off', 1: 'on', 2: 'auto' }, ['off', 'on']]) {
                for (const type of ['number', 'string']) {
                    const item = deviceDetailRowItem(
                        DEV,
                        { key: '', id: `${DEV}.mode` },
                        { type, write: true, role: 'level.mode', states },
                        'Mode',
                    );
                    expect(item.type, `${type} ${JSON.stringify(states)}`).to.equal('input_sel');
                    expect(item.role).to.equal(DEVICE_DETAIL_ROW_ROLE);
                    const data = dataOf(item);
                    expect(data.entityInSel).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.mode` } });
                    expect(data.headline).to.deep.equal({ type: 'const', constVal: 'Mode' });
                    expect(data.text).to.deep.equal({ true: { type: 'triggered', dp: `${DEV}.mode` } });
                    expect(data.icon.true.value.constVal).to.equal('format-list-bulleted');
                }
            }
        });
        it('common.states read only: text with the text of the value (commonStates), no unit', () => {
            const data = dataOf(
                deviceDetailRowItem(
                    DEV,
                    { key: '', id: `${DEV}.mode` },
                    { type: 'number', write: false, unit: 'x', states: { 0: 'off', 1: 'on' } },
                    'Mode',
                ),
            );
            expect(data.entity2).to.deep.equal({
                value: { type: 'triggered', dp: `${DEV}.mode`, commonStates: { mode: 'text', keepValue: true } },
                unit: { type: 'const', constVal: '' },
            });
        });
        it('common.states as old string, empty object or empty array: no selection', () => {
            for (const states of ['0:off;1:on', {}, []]) {
                const item = deviceDetailRowItem(
                    DEV,
                    { key: '', id: `${DEV}.mode` },
                    { type: 'number', write: true, states },
                    'Mode',
                );
                expect(item.type, JSON.stringify(states)).to.equal('text');
                expect(dataOf(item).entity2).to.deep.equal({ value: { type: 'triggered', dp: `${DEV}.mode` } });
            }
        });
        it('every kind of state gets the row type of cardEntities', () => {
            const kinds: [Parameters<typeof deviceDetailRowItem>[2], string][] = [
                [{ type: 'boolean', write: true }, 'switch'],
                [{ type: 'boolean', write: false }, 'text'],
                [{ type: 'boolean', read: false, write: true }, 'button'],
                [{ type: 'number', write: true }, 'text'],
                [{ type: 'number', write: false }, 'text'],
                [{ type: 'number', write: true, states: { 1: 'a' } }, 'input_sel'],
                [{ type: 'number', write: false, states: { 1: 'a' } }, 'text'],
                [{ type: 'string', write: true }, 'text'],
                [{ type: 'string', write: true, states: ['a', 'b'] }, 'input_sel'],
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
                'eu',
            );
            // the long test name 'T(deviceDetail_power)' does not fit 184 px together with its suffix
            expect(names).to.deep.equal([
                'T(deviceDet... Relay0',
                'T(deviceDet... Relay1',
                'T(deviceDetail_rssi)',
                'Frequenz',
                'Unnamed',
            ]);
        });
        it('rows with the same name get the second name line appended on the same line', () => {
            const names = deviceDetailRowNames(
                DEV,
                [
                    { key: 'temperature', id: `${DEV}.Relay0.temperatureC` },
                    { key: 'temperature', id: `${DEV}.Ext.temperature100C` },
                ],
                [{}, {}],
                () => 'Temperatur',
                'de',
                'eu',
            );
            expect(names).to.deep.equal(['Temperatur Relay0', 'Temperatur Ext 100']);
        });
        it('a single row gets nothing appended', () => {
            const names = deviceDetailRowNames(
                DEV,
                [{ key: 'temperature', id: `${DEV}.Ext.temperature100C` }],
                [{}],
                () => 'Temperatur',
                'de',
                'eu',
            );
            expect(names).to.deep.equal(['Temperatur']);
        });
        it('an own second name line is appended without duplicate as well', () => {
            const names = deviceDetailRowNames(
                DEV,
                [
                    { key: 'temperature', id: `${DEV}.Ext.temperature100C`, subName: ' Garten ' },
                    { key: 'rssi', id: `${DEV}.rssi` },
                ],
                [{}, {}],
                key => (key === 'deviceDetail_temperature' ? 'Temperatur' : 'WLAN'),
                'de',
                'eu',
            );
            expect(names).to.deep.equal(['Temperatur Garten', 'WLAN']);
        });
        it('the suffix fits the name field of eu (184 px): nothing is shortened', () => {
            const names = deviceDetailRowNames(
                DEV,
                [
                    { key: 'temperature', id: `${DEV}.Ext.temperature100C` },
                    { key: 'temperature', id: `${DEV}.Ext.temperature101C` },
                    { key: 'temperature', id: `${DEV}.Relay0.temperatureC` },
                ],
                [{}, {}, {}],
                () => 'Temperatur',
                'de',
                'eu',
            );
            // 'Temperatur Ext 100' = 165 px, 'Temperatur Relay0' = 159 px of font 0
            expect(names).to.deep.equal(['Temperatur Ext 100', 'Temperatur Ext 101', 'Temperatur Relay0']);
        });
        it('a row without suffix is never shortened', () => {
            const long = 'Luftfeuchtigkeit Luftfeuchtigkeit Luftfeuchtigkeit';
            const names = deviceDetailRowNames(
                DEV,
                [{ key: 'humidity', id: `${DEV}.humidity` }],
                [{}],
                () => long,
                'de',
                'web-p',
            );
            expect(names).to.deep.equal([long]);
        });
    });

    describe('name with suffix in the name field', () => {
        it('fits: unchanged, on every model', () => {
            for (const model of ['eu', 'us-l', 'us-p', 'web-l'] as const) {
                expect(deviceDetailNameWithSuffix('Temperatur', '100', model)).to.equal('Temperatur 100');
                expect(deviceDetailNameWithSuffix('Temperatur', 'Ext 100', model)).to.equal('Temperatur Ext 100');
            }
        });
        it('no suffix: the name as it is', () => {
            expect(deviceDetailNameWithSuffix('Luftfeuchtigkeit Luftfeuchtigkeit', '', 'eu')).to.equal(
                'Luftfeuchtigkeit Luftfeuchtigkeit',
            );
        });
        it('eu: only the name is shortened (font 0 has no …: "..."), the suffix stays complete', () => {
            // 'Luftfeuchtigkeit Ext 100' = 203 px > 184, 'Luftfeuchti... Ext 100' = 175 px
            expect(deviceDetailNameWithSuffix('Luftfeuchtigkeit', 'Ext 100', 'eu')).to.equal('Luftfeuchti... Ext 100');
            expect(deviceDetailNameWithSuffix('Luftfeuchtigkeit', 'Ext 100', 'us-l')).to.equal(
                'Luftfeuchti... Ext 100',
            );
        });
        it('web-p: one line of the us-p width (115 px)', () => {
            expect(deviceDetailNameWithSuffix('Temperatur', '100', 'web-p')).to.equal('Temper... 100');
            expect(deviceDetailNameWithSuffix('Temperatur', 'Ext 100', 'web-p')).to.equal('Te... Ext 100');
            expect(deviceDetailNameWithSuffix('Temperatur', 'Relay0', 'web-p')).to.equal('Tem... Relay0');
        });
        it('us-p: two lines of 115 px wrapped character by character', () => {
            // 203 px: 'Luftfeuchtigkeit E' / 'xt 100' - both lines drawn
            expect(deviceDetailNameWithSuffix('Luftfeuchtigkeit', 'Ext 100', 'us-p')).to.equal(
                'Luftfeuchtigkeit Ext 100',
            );
            expect(deviceDetailNameWithSuffix('Signalstärke', 'Wohnzimmer Decke', 'us-p')).to.equal(
                'Sign... Wohnzimmer Decke',
            );
        });
        it('long own text: the name is dropped if not one character fits in front of it', () => {
            // 'Wohnzimmer Decke' = 168 px fits alone, 'S... Wohnzimmer Decke' does not
            expect(deviceDetailNameWithSuffix('Signalstärke', 'Wohnzimmer Decke', 'eu')).to.equal('Wohnzimmer Decke');
            // wider than the field on its own: the suffix alone, the field cuts it
            expect(deviceDetailNameWithSuffix('Temperatur', 'Garten hinten links am Zaun', 'eu')).to.equal(
                'Garten hinten links am Zaun',
            );
        });
        it('own text through the row names on web-p', () => {
            const names = deviceDetailRowNames(
                DEV,
                [{ key: 'temperature', id: `${DEV}.Ext.temperature100C`, subName: 'Garten Süd' }],
                [{}],
                () => 'Temperatur',
                'de',
                'web-p',
            );
            // 'Garten Süd' fits 115 px alone, 'T... Garten Süd' does not
            expect(names).to.deep.equal(['Garten Süd']);
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
                'eu',
            );
            expect(result.headline).to.equal('Kitchen light');
            expect(result.rows).to.have.length(1);
            expect(dataOf(result.rows[0]).entity2.value.dp).to.equal(`${DEV}.rssi`);
            expect(dataOf(result.rows[0]).text.true.constVal).to.equal('deviceDetail_rssi');
        });
    });
});
