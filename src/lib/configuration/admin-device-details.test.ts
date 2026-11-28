import { expect } from 'chai';
import { deviceDetailsInfo } from './admin-device-details';
import { AdminConfiguration, ITEM_MESSAGE_REPEAT_MS, isNewItemMessage } from './admin';

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

describe('configuration/admin - messages of the page item conversion', () => {
    it('the same message is logged once within the repeat time', () => {
        const logged = new Map<string, number>();
        expect(isNewItemMessage('a', 1000, logged)).to.equal(true);
        expect(isNewItemMessage('a', 2000, logged)).to.equal(false);
        expect(isNewItemMessage('b', 2000, logged)).to.equal(true);
        expect(isNewItemMessage('a', 1000 + ITEM_MESSAGE_REPEAT_MS, logged)).to.equal(true);
        expect(isNewItemMessage('a', 1001 + ITEM_MESSAGE_REPEAT_MS, logged)).to.equal(false);
    });
    it('a page assigned to two panels: the messages nobody logged yet are warned once, with page and item', async () => {
        const warnings: string[] = [];
        const noop = (): void => undefined;
        const page = `msg-${Date.now()}`;
        const adapter: any = {
            log: { debug: noop, info: noop, error: noop, silly: noop, warn: (t: string) => warnings.push(t) },
            config: {
                pageConfig: [
                    {
                        card: 'cardGrid',
                        uniqueName: page,
                        headline: 'x',
                        navigationAssignment: [{ topic: 'nspanel/a' }, { topic: 'nspanel/b' }],
                        pageItems: [{ channelId: 'alias.0.x' }],
                    },
                ],
            },
            convertAdminPageItemToPageItemConfig: async () =>
                Promise.resolve({
                    pageItem: { type: 'text', data: {} },
                    // the config manager has logged this one itself
                    messages: ['logged before', 'Device page slot 3 (button): channel alias.0.gone not found!'],
                    error: undefined,
                    unloggedMessages: ['Device page slot 3 (button): channel alias.0.gone not found!'],
                }),
        };
        for (const topic of ['nspanel/a', 'nspanel/b']) {
            const admin = new AdminConfiguration(adapter);
            await admin.processentrys({ topic, name: topic, pages: [], navigation: [] } as never);
        }
        const found = warnings.filter(w => w.includes('alias.0.gone'));
        expect(found.length).to.equal(1);
        expect(found[0]).to.contain(`Page '${page}', page item 0:`);
        expect(warnings.some(w => w.includes('logged before'))).to.equal(false);
    });
});
