import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { requiredScriptDataPoints } from '../const/config-manager-const';
import {
    buildTestObjects,
    createTestObjects,
    parseTestStatesFile,
    resolveTestValue,
    validateTestStates,
    type TestStatesFile,
    type TestStatesTarget,
} from './test-states';

const shipped = parseTestStatesFile(
    fs.readFileSync(path.join(__dirname, '..', '..', '..', 'templates', 'test-states.json'), 'utf-8'),
);

const small: TestStatesFile = {
    version: 1,
    userdata: '0_userdata.0.T',
    alias: 'alias.0.T',
    channels: [
        {
            id: 'Licht.Flur',
            role: 'dimmer',
            name: 'Flur',
            states: {
                SET: { val: 60, unit: '%', min: 0, max: 100 },
                ACTUAL: 60,
                ON_SET: true,
                ON_ACTUAL: true,
            },
        },
    ],
    states: [{ id: 'Energie.PV', name: 'PV', type: 'number', role: 'value.power', unit: 'W', val: 4280 }],
};

/** in-memory adapter: objects and states */
class FakeTarget implements TestStatesTarget {
    objects = new Map<string, ioBroker.SettableObject>();
    states = new Map<string, { val: ioBroker.StateValue; ack: boolean }>();
    async getForeignObjectAsync(id: string): Promise<ioBroker.Object | null | undefined> {
        return this.objects.has(id) ? ({ _id: id, ...this.objects.get(id) } as ioBroker.Object) : null;
    }
    async setForeignObjectAsync(id: string, obj: ioBroker.SettableObject): Promise<unknown> {
        this.objects.set(id, obj);
        return { id };
    }
    async setForeignStateAsync(id: string, val: ioBroker.StateValue, ack: boolean): Promise<unknown> {
        this.states.set(id, { val, ack });
        return id;
    }
}

describe('lib/tools/test-states', () => {
    describe('templates/test-states.json', () => {
        it('has no problems (known roles, required datapoints, unique ids)', () => {
            expect(validateTestStates(shipped)).to.deep.equal([]);
        });
        it('covers every channel role of the adapter', () => {
            const roles = new Set(shipped.channels.map(c => c.role));
            const missing = Object.keys(requiredScriptDataPoints).filter(r => !roles.has(r));
            expect(missing).to.deep.equal([]);
        });
        it('gives every alias state a target that is created too', () => {
            const objects = buildTestObjects(shipped);
            const ids = new Set(objects.map(o => o.id));
            for (const o of objects) {
                if (o.obj.type === 'state' && o.id.startsWith(shipped.alias)) {
                    const target = o.obj.common.alias?.id;
                    expect(typeof target === 'string' && ids.has(target), o.id).to.equal(true);
                }
            }
        });
    });

    describe('buildTestObjects', () => {
        const objects = buildTestObjects(small, 0);
        const byId = new Map(objects.map(o => [o.id, o]));

        it('creates folders, the alias channel with the channel role and alias states', () => {
            expect(byId.get('0_userdata.0.T')?.obj.type).to.equal('folder');
            expect(byId.get('0_userdata.0.T.Licht.Flur')?.obj.type).to.equal('folder');
            expect(byId.get('alias.0.T.Licht')?.obj.type).to.equal('folder');
            const channel = byId.get('alias.0.T.Licht.Flur')?.obj;
            expect(channel?.type).to.equal('channel');
            expect((channel?.common as ioBroker.ChannelCommon).role).to.equal('dimmer');
            const alias = byId.get('alias.0.T.Licht.Flur.SET')?.obj.common as ioBroker.StateCommon;
            expect(alias.alias?.id).to.equal('0_userdata.0.T.Licht.Flur.SET');
        });
        it('takes role, type and write flag of the channel role, the overrides from the JSON', () => {
            const set = byId.get('alias.0.T.Licht.Flur.SET')?.obj.common as ioBroker.StateCommon;
            expect(set).to.include({ role: 'level.dimmer', type: 'number', write: true, unit: '%', min: 0, max: 100 });
            const actual = byId.get('alias.0.T.Licht.Flur.ACTUAL')?.obj.common as ioBroker.StateCommon;
            // level.dimmer belongs to SET, so ACTUAL takes value.dimmer of its role list
            expect(actual).to.include({ role: 'value.dimmer', type: 'number', write: false });
            const onActual = byId.get('alias.0.T.Licht.Flur.ON_ACTUAL')?.obj.common as ioBroker.StateCommon;
            expect(onActual.role).to.equal('sensor.light');
        });
        it('puts the initial value on the userdata state only', () => {
            expect(byId.get('0_userdata.0.T.Licht.Flur.SET')?.val).to.equal(60);
            expect(byId.get('alias.0.T.Licht.Flur.SET')?.val).to.equal(undefined);
            expect(byId.get('0_userdata.0.T.Energie.PV')?.val).to.equal(4280);
        });
        it('creates parents before their children', () => {
            const index = new Map(objects.map((o, i) => [o.id, i]));
            for (const o of objects) {
                const parent = o.id.split('.').slice(0, -1).join('.');
                if (index.has(parent)) {
                    expect(index.get(parent)! < index.get(o.id)!, o.id).to.equal(true);
                }
            }
        });
    });

    describe('resolveTestValue', () => {
        const now = new Date(2026, 10, 11, 15, 30).getTime();
        it('turns {{ts:+15m}} into a timestamp', () => {
            expect(resolveTestValue('{{ts:+15m}}', now)).to.equal(now + 15 * 60_000);
            expect(resolveTestValue('{{ts:-2h}}', now)).to.equal(now - 2 * 3_600_000);
        });
        it('replaces {{date:+Nd}} inside a text by the local date', () => {
            expect(resolveTestValue('[{"_date":"{{date:+1d}}"}]', now)).to.equal('[{"_date":"2026-11-12T00:00:00"}]');
        });
        it('keeps other values', () => {
            expect(resolveTestValue(5, now)).to.equal(5);
            expect(resolveTestValue('text', now)).to.equal('text');
        });
    });

    describe('createTestObjects', () => {
        it('creates every missing object and sets the initial values (ack)', async () => {
            const target = new FakeTarget();
            const objects = buildTestObjects(small, 0);
            const result = await createTestObjects(target, objects);
            expect(result).to.deep.equal({
                created: objects.length,
                skipped: 0,
                values: 5,
                failed: 0,
            });
            expect(target.states.get('0_userdata.0.T.Licht.Flur.SET')).to.deep.equal({ val: 60, ack: true });
        });
        it('leaves existing objects and their values untouched', async () => {
            const target = new FakeTarget();
            const existing: ioBroker.SettableObject = {
                type: 'state',
                common: { name: 'mine', role: 'state', type: 'number', read: true, write: true },
                native: {},
            };
            target.objects.set('0_userdata.0.T.Licht.Flur.SET', existing);
            target.states.set('0_userdata.0.T.Licht.Flur.SET', { val: 12, ack: true });
            const objects = buildTestObjects(small, 0);
            const result = await createTestObjects(target, objects);
            expect(result.skipped).to.equal(1);
            expect(result.created).to.equal(objects.length - 1);
            expect(target.objects.get('0_userdata.0.T.Licht.Flur.SET')).to.equal(existing);
            expect(target.states.get('0_userdata.0.T.Licht.Flur.SET')).to.deep.equal({ val: 12, ack: true });
        });
        it('creates nothing on a second run', async () => {
            const target = new FakeTarget();
            const objects = buildTestObjects(small, 0);
            await createTestObjects(target, objects);
            const result = await createTestObjects(target, objects);
            expect(result).to.deep.equal({ created: 0, skipped: objects.length, values: 0, failed: 0 });
        });
        it('counts a failing object and goes on', async () => {
            const target = new FakeTarget();
            const failing = 'alias.0.T.Licht.Flur';
            const set = target.setForeignObjectAsync.bind(target);
            target.setForeignObjectAsync = async (id, obj): Promise<unknown> => {
                if (id === failing) {
                    throw new Error('no permission');
                }
                return set(id, obj);
            };
            const errors: string[] = [];
            const objects = buildTestObjects(small, 0);
            const result = await createTestObjects(target, objects, id => errors.push(id));
            expect(result.failed).to.equal(1);
            expect(errors).to.deep.equal([failing]);
            expect(result.created).to.equal(objects.length - 1);
        });
    });
});
