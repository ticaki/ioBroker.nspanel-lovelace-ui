import { expect } from 'chai';
import { MQTTClientClass, minimalMqttFilters, mqttFilterCovers } from './mqtt';

describe('lib/classes/mqtt - mqttFilterCovers', () => {
    it('exact filters cover each other', () => {
        expect(mqttFilterCovers('a/stat/RESULT', 'a/stat/RESULT')).to.equal(true);
    });
    it('# covers deeper topics and the parent level', () => {
        expect(mqttFilterCovers('a/stat/#', 'a/stat/RESULT')).to.equal(true);
        expect(mqttFilterCovers('a/stat/#', 'a/stat/x/y')).to.equal(true);
        expect(mqttFilterCovers('a/stat/#', 'a/stat')).to.equal(true);
        expect(mqttFilterCovers('a/stat/#', 'a/stat/+')).to.equal(true);
        expect(mqttFilterCovers('#', 'a/b')).to.equal(true);
    });
    it('+ covers exactly one level', () => {
        expect(mqttFilterCovers('a/+/RESULT', 'a/stat/RESULT')).to.equal(true);
        expect(mqttFilterCovers('a/+', 'a/stat/RESULT')).to.equal(false);
        expect(mqttFilterCovers('a/+/RESULT', 'a/stat')).to.equal(false);
    });
    it('a narrower filter does not cover a broader one', () => {
        expect(mqttFilterCovers('a/stat/RESULT', 'a/stat/#')).to.equal(false);
        expect(mqttFilterCovers('a/stat/RESULT', 'a/+/RESULT')).to.equal(false);
        expect(mqttFilterCovers('a/+/#', 'a/#')).to.equal(false);
    });
    it('different topics do not cover each other', () => {
        expect(mqttFilterCovers('a/tele/#', 'a/stat/RESULT')).to.equal(false);
        expect(mqttFilterCovers('a/stat/#', 'ab/stat/RESULT')).to.equal(false);
    });
});

describe('lib/classes/mqtt - minimalMqttFilters', () => {
    it('drops covered and duplicate filters', () => {
        expect(
            minimalMqttFilters(['p/stat/RESULT', 'p/tele/#', 'p/stat/#', 'p/tele/INFO1', 'q/stat/RESULT', 'p/tele/#']),
        ).to.deep.equal(['p/tele/#', 'p/stat/#', 'q/stat/RESULT']);
    });
});

describe('lib/classes/mqtt - broker subscriptions', () => {
    let calls: string[];
    let client: MQTTClientClass;
    const cb1 = async (): Promise<void> => undefined;
    const cb2 = async (): Promise<void> => undefined;
    const cb3 = async (): Promise<void> => undefined;

    beforeEach(() => {
        calls = [];
        const noop = (): void => undefined;
        // no connect - only the subscription bookkeeping is tested
        const c: any = Object.create(MQTTClientClass.prototype);
        c.log = { silly: noop, debug: noop, info: noop, warn: noop, error: noop };
        c.adapter = { config: { debugLogMqtt: false } };
        c.subscriptDB = [];
        c.brokerTopics = new Set<string>();
        c.client = {
            subscribeAsync: async (t: string): Promise<void> => {
                calls.push(`sub ${t}`);
            },
            unsubscribe: (t: string): void => {
                calls.push(`unsub ${t}`);
            },
        };
        client = c;
    });

    it('a covering subscription replaces the covered one - subscribed first', async () => {
        await client.subscribe('p/stat/RESULT', cb1);
        await client.subscribe('p/stat/#', cb2);
        expect(calls).to.deep.equal(['sub p/stat/RESULT', 'sub p/stat/#', 'unsub p/stat/RESULT']);
    });

    it('a covered filter gets no own broker subscription', async () => {
        await client.subscribe('p/tele/#', cb1);
        await client.subscribe('p/tele/INFO1', cb2);
        await client.subscribe('p/tele/INFO1', cb3);
        expect(calls).to.deep.equal(['sub p/tele/#']);
    });

    it('removing the covering handler restores the covered subscription', async () => {
        await client.subscribe('p/stat/RESULT', cb1);
        await client.subscribe('p/stat/#', cb2);
        calls = [];
        client.removeByFunction(cb2);
        await new Promise(resolve => setImmediate(resolve));
        expect(calls).to.deep.equal(['sub p/stat/RESULT', 'unsub p/stat/#']);
    });

    it('removing a covered handler does not touch the broker', async () => {
        await client.subscribe('p/stat/RESULT', cb1);
        await client.subscribe('p/stat/#', cb2);
        calls = [];
        client.unsubscribe('p/stat/RESULT');
        await new Promise(resolve => setImmediate(resolve));
        expect(calls).to.deep.equal([]);
    });

    it('the last handler of a topic unsubscribes it', async () => {
        await client.subscribe('p/stat/RESULT', cb1);
        await client.subscribe('p/stat/RESULT', cb2);
        calls = [];
        client.removeByFunction(cb1);
        await new Promise(resolve => setImmediate(resolve));
        expect(calls).to.deep.equal([]);
        client.removeByFunction(cb2);
        await new Promise(resolve => setImmediate(resolve));
        expect(calls).to.deep.equal(['unsub p/stat/RESULT']);
    });
});
