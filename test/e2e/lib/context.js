'use strict';

const forge = require('node-forge');
const net = require('node:net');
const { VirtualNSPanel } = require('./virtual-nspanel');
const { VirtualWebPanel } = require('./virtual-webpanel');
const config = require('../fixtures/config');

const NAMESPACE = 'nspanel-lovelace-ui.0';

/**
 * Shared state of one E2E suite: the harness of `@iobroker/testing`, the virtual panels and helpers for the
 * states of the instance. Created in the `before` hook of the suite (index.js), the scenarios get it as
 * argument and read its fields inside their hooks / tests.
 */
class E2EContext {
    /**
     * @param {{ objects: number, states: number, mqtt: number, web: number }} ports ports of the run
     */
    constructor(ports) {
        this.ports = ports;
        /** @type {any} TestHarness of @iobroker/testing */
        this.harness = undefined;
        /** @type {VirtualNSPanel} */
        this.nspanel = new VirtualNSPanel({
            port: ports.mqtt,
            username: config.MQTT.username,
            password: config.MQTT.password,
            topic: config.NSPANEL.topic,
            mac: config.NSPANEL.mac,
            model: config.NSPANEL.model,
        });
        /** @type {VirtualWebPanel} */
        this.web = new VirtualWebPanel({ port: ports.web, topicOrId: config.WEBPANEL.topic });
        /** @type {any} hello frame of the web panel */
        this.webHello = undefined;
        this.config = config;
        this.namespace = NAMESPACE;
    }

    /**
     * Test states, MQTT keys and admin configuration - everything before the adapter starts.
     *
     * @param {any} harness the TestHarness
     */
    async prepare(harness) {
        this.harness = harness;
        // a real installation has a system language - the fresh test system has none
        const sys = await harness.objects.getObject('system.config');
        if (sys && !sys.common.language) {
            sys.common.language = 'en';
            await harness.objects.setObject('system.config', sys);
        }
        for (const [id, obj] of Object.entries(config.OBJECTS)) {
            await harness.objects.setObject(id, { _id: id, ...obj });
        }
        for (const [id, val] of Object.entries(config.STATES)) {
            await harness.states.setState(id, { val, ack: true });
        }
        // the adapter's MQTT broker runs TLS: without stored keys it creates a 4096 bit RSA key at every start
        // (several seconds) - a small key in the meta object is enough for the test
        await harness.objects.setObject(NAMESPACE, {
            _id: NAMESPACE,
            type: 'meta',
            common: { name: 'Nspanel Instance', type: 'meta.folder' },
            native: { mqttKeys: createMqttKeys() },
        });
        // not harness.changeAdapterConfig(): its deep extend turns the arrays of native (panels, pageConfig) into
        // objects. The fields are replaced as a whole, the password is encrypted like the admin does it.
        const id = `system.adapter.${NAMESPACE}`;
        const instance = await harness.objects.getObject(id);
        const native = config.nativeConfig(this.ports);
        native.mqttPassword = await harness.encryptValue(native.mqttPassword);
        instance.native = { ...instance.native, ...native };
        await harness.objects.setObject(id, instance);
    }

    /** Starts the adapter and waits until its MQTT broker accepts connections. */
    async startAdapter() {
        await this.harness.startAdapterAndWait();
        await waitForPort(this.ports.mqtt, 30_000);
    }

    /**
     * Connects both virtual panels and waits until each shows the start page. Part of the suite setup, so a
     * single scenario can run with `--grep`; scenario 01 checks what happened on the way.
     */
    async connectPanels() {
        const isMain = p => p.startsWith('entityUpd~') && p.split('~')[1] === config.HEADLINES.main;
        await this.nspanel.connect();
        await this.nspanel.waitFor(isMain, { timeout: 30_000, what: 'start page of the NSPanel' });
        this.webHello = await this.web.connect();
        await this.web.waitFor(isMain, { timeout: 30_000, what: 'start page of the web panel' });
    }

    async closePanels() {
        await this.nspanel.close().catch(() => undefined);
        await this.web.close().catch(() => undefined);
    }

    /**
     * @param {string} id full state id
     * @returns {Promise<ioBroker.State | null | undefined>} the state
     */
    getState(id) {
        return this.harness.states.getState(id);
    }

    /**
     * Writes a state like a user / another adapter does (ack = false) or like a device (ack = true).
     *
     * @param {string} id full state id
     * @param {ioBroker.StateValue} val value
     * @param {boolean} [ack] ack flag
     */
    async setState(id, val, ack = false) {
        await this.harness.states.setState(id, { val, ack });
    }

    /**
     * Sets all test states back to their start values (fixtures/config.js STATES), like a device reports them. Every
     * scenario starts with it, so it does not depend on what the scenarios before left - also in a run of a single
     * scenario (`--grep`) the snapshots see the same values.
     */
    async resetStates() {
        for (const [id, val] of Object.entries(config.STATES)) {
            await this.setState(id, val, true);
        }
    }

    /**
     * Polls a state until the predicate is true.
     *
     * @param {string} id full state id
     * @param {(val: ioBroker.StateValue | undefined, state: ioBroker.State | null | undefined) => boolean} predicate test
     * @param {number} [timeout] ms
     * @returns {Promise<ioBroker.State>} the state
     */
    async waitForState(id, predicate, timeout = 10_000) {
        const start = Date.now();
        let last;
        for (;;) {
            last = await this.getState(id);
            if (predicate(last ? last.val : undefined, last)) {
                return last;
            }
            if (Date.now() - start > timeout) {
                throw new Error(
                    `state ${id} did not reach the expected value within ${timeout} ms, last: ${JSON.stringify(last)}`,
                );
            }
            await sleep(100);
        }
    }

    /**
     * Polls a state until it has this value.
     *
     * @param {string} id full state id
     * @param {ioBroker.StateValue} val expected value
     * @param {number} [timeout] ms
     * @returns {Promise<ioBroker.State>} the state
     */
    waitForValue(id, val, timeout) {
        return this.waitForState(id, v => v === val, timeout);
    }

    /**
     * @param {string} panelId id of the panel (admin table)
     * @param {string} sub state below `panels.<id>.`
     * @returns {string} full id
     */
    panelState(panelId, sub) {
        return `${NAMESPACE}.panels.${panelId}.${sub}`;
    }

    /**
     * Error and warning lines of the adapter log - for the report of unexpected errors.
     *
     * @returns {string[]} log lines
     */
    adapterErrors() {
        return this.harness.getLogs('error').map(l => l.message);
    }
}

/** @returns {{ privateKey: string, publicKey: string, certPem: string }} self signed key for the MQTT broker */
function createMqttKeys() {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date(Date.now() + 365 * 24 * 3600 * 1000);
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    return {
        privateKey: forge.pki.privateKeyToPem(keys.privateKey),
        publicKey: forge.pki.publicKeyToPem(keys.publicKey),
        certPem: forge.pki.certificateToPem(cert),
    };
}

/**
 * @param {number} port TCP port on 127.0.0.1
 * @param {number} timeout ms
 */
async function waitForPort(port, timeout) {
    const start = Date.now();
    for (;;) {
        const ok = await new Promise(resolve => {
            const s = net.connect({ port, host: '127.0.0.1' });
            s.once('connect', () => {
                s.destroy();
                resolve(true);
            });
            s.once('error', () => resolve(false));
        });
        if (ok) {
            return;
        }
        if (Date.now() - start > timeout) {
            throw new Error(`port ${port} not open within ${timeout} ms`);
        }
        await sleep(200);
    }
}

/**
 * @param {number} ms milliseconds
 * @returns {Promise<void>} resolves after ms
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { E2EContext, sleep };
