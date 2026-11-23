import { expect } from 'chai';
import { Color } from '../const/Color';
import { Icons } from '../const/icon_mapping';
import { getIconEntryValue } from '../const/tools';
import { BATTERY_ICON_READ } from '../templates/text';
import type { NSPanel } from '../types/NSPanel';
import { DEVICE_DETAIL_ROW_ROLE } from '../types/deviceDetails';
import {
    DEVICE_DETAIL_PAGE_PREFIX,
    deviceDetailGroupColor,
    deviceDetailPageConfig,
    deviceDetailRowIcon,
    deviceDetailRowItem,
    deviceDetailRowLook,
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

    describe('charge level of a battery: the icon follows the value', () => {
        const BAT = `${DEV}.battery`;
        const common = { type: 'number', read: true, write: false, role: 'value.battery', unit: '%' };
        const levelIcon = { type: 'triggered', dp: BAT, read: BATTERY_ICON_READ };
        /**
         * @param val value of the state
         * @returns the icon the read script of the battery template gives
         */
        const iconOf = (val: unknown): string => String(new Function('val', BATTERY_ICON_READ)(val));

        it('the steps of the battery template, every icon is in the icon table of the HMI', () => {
            const steps: [number, string][] = [
                [0, 'battery-outline'],
                [4, 'battery-outline'],
                [5, 'battery-10'],
                [14, 'battery-10'],
                [15, 'battery-20'],
                [25, 'battery-30'],
                [35, 'battery-40'],
                [45, 'battery-50'],
                [50, 'battery-50'],
                [55, 'battery-60'],
                [65, 'battery-70'],
                [75, 'battery-80'],
                [85, 'battery-90'],
                [94, 'battery-90'],
                [95, 'battery'],
                [100, 'battery'],
                [120, 'battery'],
            ];
            for (const [val, icon] of steps) {
                expect(iconOf(val), String(val)).to.equal(icon);
                expect(Icons.GetIcon(icon), icon).to.not.equal('');
            }
        });
        it('entry battery: the icon is the state with the read script of the template, the color stays the group', () => {
            const item = deviceDetailRowItem(DEV, { key: 'battery', id: BAT }, common, 'Batterie');
            expect(item.type).to.equal('text');
            const data = dataOf(item);
            expect(data.icon.true.value).to.deep.equal(levelIcon);
            expect(data.icon.false.value).to.deep.equal(levelIcon);
            const color = { type: 'const', constVal: JSON.parse(JSON.stringify(deviceDetailGroupColor('energy'))) };
            expect(data.icon.true.color).to.deep.equal(color);
            expect(data.icon.false.color).to.deep.equal(color);
            expect(data.entity2).to.deep.equal({ value: { type: 'triggered', dp: BAT } });
        });
        it('a state without key with the role value.battery (own data point): the same', () => {
            const own = '0_userdata.0.akku';
            const item = deviceDetailRowItem(DEV, { key: '', id: own }, common, 'Akku', 'all');
            expect(dataOf(item).icon.true.value).to.deep.equal({ ...levelIcon, dp: own });
        });
        it('an icon handed in (status icon of the device page) wins', () => {
            const item = deviceDetailRowItem(DEV, { key: 'battery', id: BAT }, common, '', 'all', 'heart');
            expect(dataOf(item).icon.true.value).to.deep.equal({ type: 'const', constVal: 'heart' });
        });
        it('other entries keep their fixed icon: battery voltage, low battery, a battery entry that is no number', () => {
            const voltage = deviceDetailRowItem(
                DEV,
                { key: 'batteryVoltage', id: `${DEV}.voltage` },
                { type: 'number', write: false, role: 'battery.voltage', unit: 'V' },
                'V',
            );
            expect(dataOf(voltage).icon.true.value).to.deep.equal({ type: 'const', constVal: 'battery-charging' });
            const low = deviceDetailRowItem(
                DEV,
                { key: 'lowBattery', id: `${DEV}.lowbat` },
                { type: 'boolean', write: false, role: 'indicator.lowbat' },
                'Low',
            );
            expect(dataOf(low).icon.true.value).to.deep.equal({ type: 'const', constVal: 'battery-alert' });
            const text = deviceDetailRowItem(
                DEV,
                { key: 'battery', id: BAT },
                { type: 'string', write: false, role: 'value.battery' },
                'B',
            );
            expect(dataOf(text).icon.true.value).to.deep.equal({ type: 'const', constVal: 'battery' });
        });
        it('look and icon item', () => {
            const look = deviceDetailRowLook(DEV, { key: 'battery', id: BAT }, common, 'number');
            expect(look.batteryLevel).to.equal(true);
            expect(look.icon).to.equal('battery');
            expect(deviceDetailRowIcon(look, BAT)).to.deep.equal(levelIcon);
            const power = deviceDetailRowLook(
                DEV,
                { key: 'power', id: `${DEV}.power` },
                { type: 'number', role: 'value.power' },
                'number',
            );
            expect(power.batteryLevel).to.equal(false);
            expect(deviceDetailRowIcon(power, `${DEV}.power`)).to.deep.equal({ type: 'const', constVal: power.icon });
        });
        it('the icon sent: by the value, also when a color scale hands the number to the icon', async () => {
            let val = 37;
            const value = { getString: async (): Promise<string> => Promise.resolve(iconOf(val)) };
            const icon: any = { true: { value }, false: { value } };
            expect(await getIconEntryValue(icon, true, '')).to.equal(Icons.GetIcon('battery-40'));
            expect(await getIconEntryValue(icon, 37, '')).to.equal(Icons.GetIcon('battery-40'));
            val = 0;
            expect(await getIconEntryValue(icon, 0, '')).to.equal(Icons.GetIcon('battery-outline'));
            val = 100;
            expect(await getIconEntryValue(icon, 100, '')).to.equal(Icons.GetIcon('battery'));
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
        it('web-p: one line of 117 px (name box 121 px in the browser)', () => {
            expect(deviceDetailNameWithSuffix('Temperatur', '100', 'web-p')).to.equal('Temper... 100');
            expect(deviceDetailNameWithSuffix('Temperatur', 'Ext 100', 'web-p')).to.equal('Tem... Ext 100');
            expect(deviceDetailNameWithSuffix('Temperatur', 'Relay0', 'web-p')).to.equal('Tem... Relay0');
        });
        it('web-l: one line of 310 px (name box 321 px in the browser) - longer than the eu field', () => {
            expect(deviceDetailNameWithSuffix('Luftfeuchtigkeit', 'Ext 100', 'web-l')).to.equal(
                'Luftfeuchtigkeit Ext 100',
            );
            expect(deviceDetailNameWithSuffix('Signalstärke', 'Wohnzimmer Decke', 'web-l')).to.equal(
                'Signalstärke Wohnzimmer Decke',
            );
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
            // 'Garten Süd' fits 117 px alone, 'T... Garten Süd' does not
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
