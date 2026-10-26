import { expect } from 'chai';
import { VirtualPanelChannel, mqttTopicMatches } from './virtual-panel-channel';

const TOPIC = 'nspanel/web/abc';

function setup(debug = false): VirtualPanelChannel {
    const noop = (): void => undefined;
    const adapter: any = {
        log: { silly: noop, debug: noop, info: noop, warn: noop, error: noop },
        config: { debugLogMqtt: debug },
        unload: false,
        setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
        clearTimeout: (t: ReturnType<typeof setTimeout>) => clearTimeout(t),
    };
    return new VirtualPanelChannel(adapter, TOPIC);
}

describe('lib/web/virtual-panel-channel - mqttTopicMatches', () => {
    it('matches exact topics and wildcards', () => {
        expect(mqttTopicMatches('a/b/c', 'a/b/c')).to.equal(true);
        expect(mqttTopicMatches('a/b/c', 'a/b/d')).to.equal(false);
        expect(mqttTopicMatches('a/+/c', 'a/x/c')).to.equal(true);
        expect(mqttTopicMatches('a/+/c', 'a/x/y/c')).to.equal(false);
        expect(mqttTopicMatches('a/#', 'a/b/c')).to.equal(true);
        expect(mqttTopicMatches('a/#', 'b/c')).to.equal(false);
        expect(mqttTopicMatches('a/b', 'a/b/c')).to.equal(false);
    });
});

describe('lib/web/virtual-panel-channel - VirtualPanelChannel', () => {
    it('hands CustomSend payloads to command listeners and buzzer commands to buzzer listeners', async () => {
        const channel = setup();
        const commands: string[] = [];
        const buzzer: string[] = [];
        channel.onCommand(p => commands.push(p));
        channel.onBuzzer(p => buzzer.push(p));
        await channel.publish(`${TOPIC}/cmnd/CustomSend`, 'pageType~screensaver');
        await channel.publish(`${TOPIC}/cmnd/Buzzer`, '1,1,1');
        await channel.publish(`${TOPIC}/cmnd/POWER1`, 'ON');
        await channel.publish(`${TOPIC}/cmnd/Rule3`, '1');
        await channel.publish(`other/cmnd/CustomSend`, 'x');
        expect(commands).to.deep.equal(['pageType~screensaver']);
        expect(buzzer).to.deep.equal(['1,1,1']);
    });

    it('delivers injected events to wildcard subscriptions like a broker', async () => {
        const channel = setup();
        const received: { topic: string; message: string }[] = [];
        await channel.subscribe(`${TOPIC}/tele/#`, async (topic, message) => {
            received.push({ topic, message });
        });
        await channel.subscribe(`${TOPIC}/stat/#`, async (topic, message) => {
            received.push({ topic, message });
        });
        await channel.subscribe(`${TOPIC}/stat/RESULT`, async (topic, message) => {
            received.push({ topic: `exact:${topic}`, message });
        });
        await channel.injectReceive('event,startup,55,eu,5.1.1');
        await channel.injectAck();
        expect(received).to.deep.equal([
            { topic: `${TOPIC}/tele/RESULT`, message: '{"CustomRecv":"event,startup,55,eu,5.1.1"}' },
            { topic: `${TOPIC}/stat/RESULT`, message: '{"CustomSend":"Done"}' },
            { topic: `exact:${TOPIC}/stat/RESULT`, message: '{"CustomSend":"Done"}' },
        ]);
    });

    it('removes one-shot handlers and handlers removed by function or filter', async () => {
        const channel = setup();
        let oneShot = 0;
        let keep = 0;
        let byFilter = 0;
        const keepCb = async (): Promise<void> => {
            keep++;
        };
        await channel.subscribe(`${TOPIC}/tele/RESULT`, async () => {
            oneShot++;
            return true;
        });
        await channel.subscribe(`${TOPIC}/tele/+`, keepCb);
        await channel.subscribe(`${TOPIC}/#`, async () => {
            byFilter++;
        });
        await channel.injectReceive('a');
        await channel.injectReceive('b');
        expect(oneShot).to.equal(1);
        expect(keep).to.equal(2);
        expect(byFilter).to.equal(2);
        channel.removeByFunction(keepCb);
        channel.unsubscribe(`${TOPIC}/#`);
        await channel.injectReceive('c');
        expect(keep).to.equal(2);
        expect(byFilter).to.equal(2);
    });

    it('is silent after delete', async () => {
        const channel = setup();
        const commands: string[] = [];
        let received = 0;
        channel.onCommand(p => commands.push(p));
        await channel.subscribe(`${TOPIC}/tele/#`, async () => {
            received++;
        });
        await channel.delete();
        await channel.publish(`${TOPIC}/cmnd/CustomSend`, 'x');
        await channel.injectReceive('y');
        expect(commands).to.deep.equal([]);
        expect(received).to.equal(0);
    });
});
