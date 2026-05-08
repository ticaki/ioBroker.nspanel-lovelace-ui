import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import Aedes from 'aedes';
import net, { type AddressInfo } from 'node:net';
import mqtt, { type MqttClient } from 'mqtt';
import { createLogger } from '../src/log.js';
import { loadConfig } from '../src/config.js';
import { Simulator } from '../src/sim/Simulator.js';

interface BrokerHandle {
    aedes: Aedes;
    server: net.Server;
    port: number;
}

async function startBroker(): Promise<BrokerHandle> {
    const aedes = new Aedes();
    const server = net.createServer(aedes.handle);
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.removeListener('error', reject);
            resolve();
        });
    });
    const addr = server.address() as AddressInfo;
    return { aedes, server, port: addr.port };
}

async function stopBroker(b: BrokerHandle): Promise<void> {
    await new Promise<void>(resolve => b.server.close(() => resolve()));
    await new Promise<void>(resolve => b.aedes.close(() => resolve()));
}

async function httpGet(port: number, pathStr: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
        http.get({ host: '127.0.0.1', port, path: pathStr }, res => {
            const chunks: Buffer[] = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') }));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function pickPort(): Promise<number> {
    return new Promise((resolve, reject) => {
        const srv = net.createServer();
        srv.unref();
        srv.once('error', reject);
        srv.listen(0, '127.0.0.1', () => {
            const a = srv.address() as AddressInfo;
            srv.close(() => resolve(a.port));
        });
    });
}

describe('NSPanel simulator smoke', function () {
    this.timeout(20_000);

    let broker: BrokerHandle;
    let sim: Simulator;
    let httpPort: number;
    let stateFile: string;
    let probe: MqttClient;
    const topic = 'nspanel-sim';

    before(async () => {
        broker = await startBroker();
        httpPort = await pickPort();
        const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'nspsim-'));
        stateFile = path.join(tmp, 'state.json');

        const cfg = await loadConfig([
            'node',
            'sim',
            '--http-ip',
            '127.0.0.1',
            '--http-port',
            String(httpPort),
            '--state',
            stateFile,
            '--ack-delay-ms',
            '5',
            '--log-level',
            'warn',
            '--mac',
            'AA:BB:CC:11:22:33',
        ]);
        const log = createLogger('warn');
        sim = new Simulator(cfg, log);
        await sim.start();

        probe = mqtt.connect(`mqtt://127.0.0.1:${broker.port}`, { clientId: 'probe-' + Math.random().toString(16).slice(2) });
        await new Promise<void>((resolve, reject) => {
            probe.once('connect', () => resolve());
            probe.once('error', reject);
        });
        await new Promise<void>((resolve, reject) => {
            probe.subscribe([`${topic}/tele/+`, `${topic}/stat/+`], { qos: 0 }, err => (err ? reject(err) : resolve()));
        });
    });

    after(async () => {
        if (probe) {
            await new Promise<void>(resolve => probe.end(false, undefined, () => resolve()));
        }
        if (sim) {
            await sim.stop();
        }
        if (broker) {
            await stopBroker(broker);
        }
    });

    function nextMessage(matcher: (topic: string) => boolean, timeoutMs = 5000): Promise<{ topic: string; payload: string }> {
        return new Promise((resolve, reject) => {
            const onMessage = (t: string, p: Buffer): void => {
                if (matcher(t)) {
                    probe.removeListener('message', onMessage);
                    clearTimeout(timer);
                    resolve({ topic: t, payload: p.toString('utf8') });
                }
            };
            const timer = setTimeout(() => {
                probe.removeListener('message', onMessage);
                reject(new Error('Timeout waiting for matching MQTT message'));
            }, timeoutMs);
            timer.unref?.();
            probe.on('message', onMessage);
        });
    }

    it('answers cmnd=status%205 with StatusNET including Mac', async () => {
        const r = await httpGet(httpPort, '/cm?cmnd=status%205');
        expect(r.status).to.equal(200);
        const body = JSON.parse(r.body);
        expect(body).to.have.nested.property('StatusNET.Mac', 'AA:BB:CC:11:22:33');
        expect(body).to.have.nested.property('StatusNET.IPAddress');
    });

    it('processes Backlog with MqttHost/Port/User/Password/FullTopic and learns credentials', async () => {
        const backlog =
            ` MqttHost 127.0.0.1; MqttPort ${broker.port}; MqttUser nsp; MqttPassword secret;` +
            ` FullTopic ${topic}/%prefix%/; FriendlyName1 NSPanel-Sim; Hostname nspanel-sim;` +
            ` MqttClient nspanel-sim-test; SetOption132 0; SetOption103 0; Restart 1`;
        const r = await httpGet(httpPort, '/cm?cmnd=Backlog' + encodeURIComponent(backlog));
        expect(r.status).to.equal(200);

        const persisted = JSON.parse(await fs.readFile(stateFile, 'utf8'));
        expect(persisted.mqttHost).to.equal('127.0.0.1');
        expect(persisted.mqttPort).to.equal(broker.port);
        expect(persisted.mqttUser).to.equal('nsp');
        expect(persisted.mqttPassword).to.equal('secret');
        expect(persisted.fullTopic).to.equal(`${topic}/%prefix%/`);
        expect(persisted.topic).to.equal(topic);
    });

    it('publishes LWT=Online retained after Restart', async () => {
        const m = await nextMessage(t => t === `${topic}/tele/LWT`);
        expect(m.payload).to.equal('Online');
    });

    it('emits event,startup on tele/RESULT (5-field format with HMI version)', async () => {
        const m = await nextMessage(t => t === `${topic}/tele/RESULT`);
        const parsed = JSON.parse(m.payload);
        expect(parsed.CustomRecv).to.match(/^event,startup,\d+,eu,\d+(\.\d+)*$/);
    });

    it('answers GetDriverVersion with the configured display version', async () => {
        const r = await httpGet(httpPort, '/cm?cmnd=GetDriverVersion');
        const body = JSON.parse(r.body);
        expect(body.nlui_driver_version).to.equal('10');
    });

    it('answers status 0 with StatusNET.Mac', async () => {
        const r = await httpGet(httpPort, '/cm?cmnd=status%200');
        const body = JSON.parse(r.body);
        expect(body).to.have.nested.property('StatusNET.Mac', 'AA:BB:CC:11:22:33');
    });

    it('re-emits event,startup when receiving pageType~pageStartup (soft-reset)', async () => {
        const seen: string[] = [];
        const handler = (t: string, p: Buffer): void => {
            if (t === `${topic}/tele/RESULT`) {
                seen.push(p.toString('utf8'));
            }
        };
        probe.on('message', handler);
        try {
            probe.publish(`${topic}/cmnd/CustomSend`, 'pageType~pageStartup', { qos: 0 });
            const deadline = Date.now() + 2000;
            while (!seen.some(s => /event,startup,/.test(s)) && Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 50));
            }
        } finally {
            probe.removeListener('message', handler);
        }
        const startup = seen.find(s => /event,startup,/.test(s));
        expect(startup, 'expected a re-emitted startup event').to.not.be.undefined;
    });

    it('emits event,sleepReached after pageType + timeout~N seconds', async () => {
        const seen: string[] = [];
        const handler = (t: string, p: Buffer): void => {
            if (t === `${topic}/tele/RESULT`) {
                seen.push(p.toString('utf8'));
            }
        };
        probe.on('message', handler);
        try {
            probe.publish(`${topic}/cmnd/CustomSend`, 'pageType~cardThermo2', { qos: 0 });
            probe.publish(`${topic}/cmnd/CustomSend`, 'timeout~1', { qos: 0 });
            const deadline = Date.now() + 3000;
            while (!seen.some(s => s.includes('sleepReached')) && Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 100));
            }
        } finally {
            probe.removeListener('message', handler);
        }
        const sleep = seen.find(s => s.includes('sleepReached'));
        expect(sleep, 'expected a sleepReached event').to.not.be.undefined;
        const parsed = JSON.parse(sleep!);
        expect(parsed.CustomRecv).to.equal('event,sleepReached,cardThermo2,,');
    });

    it('replies to CustomSend pageType~cardEntities with both Done and renderCurrentPage', async () => {
        const seen: string[] = [];
        const handler = (t: string, p: Buffer): void => {
            if (t === `${topic}/stat/RESULT`) {
                seen.push(p.toString('utf8'));
            }
        };
        probe.on('message', handler);
        try {
            await new Promise<void>((resolve, reject) => {
                probe.publish(`${topic}/cmnd/CustomSend`, 'pageType~cardEntities', { qos: 0 }, err => (err ? reject(err) : resolve()));
            });
            const deadline = Date.now() + 2000;
            while (seen.length < 2 && Date.now() < deadline) {
                await new Promise(r => setTimeout(r, 50));
            }
        } finally {
            probe.removeListener('message', handler);
        }
        const decoded = seen.map(s => JSON.parse(s).CustomSend);
        expect(decoded).to.include('Done');
        expect(decoded).to.include('renderCurrentPage');
    });
});
