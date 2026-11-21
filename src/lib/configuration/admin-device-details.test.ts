import { expect } from 'chai';
import { deviceDetailsInfo } from './admin-device-details';

const DEV = 'shelly.0.shellyplus1pm#000000000001#1';

function state(id: string, common: Partial<ioBroker.StateCommon>): ioBroker.StateObject {
    return {
        _id: id,
        type: 'state',
        common: { name: id.split('.').pop() ?? '', role: 'state', type: 'number', read: true, write: false, ...common },
        native: {},
    };
}

function fakeAdapter(objects: Record<string, ioBroker.Object>): any {
    return {
        language: 'de',
        getForeignObjectAsync: async (id: string) => Promise.resolve(objects[id] ?? null),
        getObjectViewAsync: async (_d: string, type: string, opts: { startkey: string; endkey: string }) =>
            Promise.resolve({
                rows: Object.values(objects)
                    .filter(o => o.type === type && o._id >= opts.startkey && o._id <= opts.endkey)
                    .map(o => ({ id: o._id, value: o })),
            }),
    };
}

describe('configuration/admin-device-details - sendTo getDeviceDetails', () => {
    const objects: Record<string, ioBroker.Object> = {
        'shelly.0': { _id: 'shelly.0', type: 'device', common: { name: 'root' }, native: {} },
        'shelly.0.info': { _id: 'shelly.0.info', type: 'channel', common: { name: 'Information' }, native: {} },
        [DEV]: { _id: DEV, type: 'device', common: { name: { en: 'Light', de: 'Licht' } }, native: {} },
        [`${DEV}.Relay0`]: { _id: `${DEV}.Relay0`, type: 'channel', common: { name: 'Relay0' }, native: {} },
        [`${DEV}.rssi`]: state(`${DEV}.rssi`, { role: 'value', unit: 'dBm', name: 'RSSI' }),
        [`${DEV}.Relay0.Switch`]: state(`${DEV}.Relay0.Switch`, { role: 'switch', type: 'boolean', write: true }),
        [`${DEV}.Relay0.Deep.Power`]: state(`${DEV}.Relay0.Deep.Power`, { role: 'value.power' }),
        [`${DEV}.Relay0.Limit`]: state(`${DEV}.Relay0.Limit`, { role: 'level', write: true, min: 0, max: 10, step: 1 }),
    };

    it('the device with its states, at most one sub folder deep', async () => {
        const result = await deviceDetailsInfo(fakeAdapter(objects), ` ${DEV} `);
        expect(result.ok).to.equal(true);
        expect(result.adapter).to.equal('shelly');
        expect(result.name).to.equal('Licht');
        expect(result.states.map(s => s.id)).to.deep.equal([
            `${DEV}.Relay0.Limit`,
            `${DEV}.Relay0.Switch`,
            `${DEV}.rssi`,
        ]);
        expect(result.states[0]).to.deep.equal({
            id: `${DEV}.Relay0.Limit`,
            name: 'Limit',
            role: 'level',
            type: 'number',
            read: true,
            write: true,
            min: 0,
            max: 10,
            step: 1,
        });
        expect(result.states[2].unit).to.equal('dBm');
    });
    it('refuses states, sub folders of a known adapter, the root, the info channel and unknown objects', async () => {
        const adapter = fakeAdapter(objects);
        expect((await deviceDetailsInfo(adapter, `${DEV}.rssi`)).error).to.equal('type');
        expect((await deviceDetailsInfo(adapter, `${DEV}.Relay0`)).error).to.equal('level');
        expect((await deviceDetailsInfo(adapter, 'shelly.0')).error).to.equal('root');
        expect((await deviceDetailsInfo(adapter, 'shelly.0.info')).error).to.equal('info');
        expect((await deviceDetailsInfo(adapter, 'shelly.0.none')).error).to.equal('notFound');
        expect((await deviceDetailsInfo(adapter, 42)).error).to.equal('notFound');
        expect((await deviceDetailsInfo(adapter, `${DEV}.rssi`)).states).to.deep.equal([]);
    });
});
