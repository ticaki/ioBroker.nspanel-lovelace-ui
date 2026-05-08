import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import { isModelId, type ModelId } from './sim/const/models.js';
import { randomMac } from './persistence.js';

export interface SimulatorConfig {
    httpListenIp: string;
    httpListenPort: number;
    topic: string;
    model: ModelId;
    firmwareVersion: string;
    displayVersion: string;
    hmiVersion: string;
    startupId: string;
    mac: string;
    simulatedIp: string;
    ackDelayMs: number;
    statePath: string;
    logLevel: string;
    init: boolean;
    autoWake: boolean;
    autoWakeMinSec: number;
    autoWakeMaxSec: number;
}

const DEFAULTS: SimulatorConfig = {
    httpListenIp: '127.0.0.1',
    httpListenPort: 9080,
    topic: '',
    model: 'eu',
    firmwareVersion: '14.4.1(release-nspanel)',
    displayVersion: '10',
    hmiVersion: '5.1.1',
    startupId: '61',
    mac: '',
    simulatedIp: '127.0.0.1',
    ackDelayMs: 30,
    statePath: './state.json',
    logLevel: 'info',
    init: false,
    autoWake: false,
    autoWakeMinSec: 15,
    autoWakeMaxSec: 40,
};

const ENV_KEYS: Record<keyof SimulatorConfig, string> = {
    httpListenIp: 'NSPSIM_HTTP_IP',
    httpListenPort: 'NSPSIM_HTTP_PORT',
    topic: 'NSPSIM_TOPIC',
    model: 'NSPSIM_MODEL',
    firmwareVersion: 'NSPSIM_FW',
    displayVersion: 'NSPSIM_DISPLAY_VERSION',
    hmiVersion: 'NSPSIM_HMI_VERSION',
    startupId: 'NSPSIM_STARTUP_ID',
    mac: 'NSPSIM_MAC',
    simulatedIp: 'NSPSIM_SIM_IP',
    ackDelayMs: 'NSPSIM_ACK_DELAY_MS',
    statePath: 'NSPSIM_STATE',
    logLevel: 'NSPSIM_LOG_LEVEL',
    init: 'NSPSIM_INIT',
    autoWake: 'NSPSIM_AUTO_WAKE',
    autoWakeMinSec: 'NSPSIM_AUTO_WAKE_MIN',
    autoWakeMaxSec: 'NSPSIM_AUTO_WAKE_MAX',
};

async function loadFile(p: string | undefined): Promise<Partial<SimulatorConfig>> {
    if (!p) {
        return {};
    }
    const abs = path.resolve(p);
    try {
        const buf = await fs.readFile(abs, 'utf8');
        return JSON.parse(buf) as Partial<SimulatorConfig>;
    } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === 'ENOENT') {
            return {};
        }
        throw err;
    }
}

function envOverlay(): Partial<SimulatorConfig> {
    const out: Partial<SimulatorConfig> = {};
    const e = process.env;
    if (e[ENV_KEYS.httpListenIp]) {
        out.httpListenIp = e[ENV_KEYS.httpListenIp];
    }
    if (e[ENV_KEYS.httpListenPort]) {
        out.httpListenPort = Number(e[ENV_KEYS.httpListenPort]);
    }
    if (e[ENV_KEYS.topic]) {
        out.topic = e[ENV_KEYS.topic];
    }
    if (e[ENV_KEYS.model] && isModelId(e[ENV_KEYS.model])) {
        out.model = e[ENV_KEYS.model] as ModelId;
    }
    if (e[ENV_KEYS.firmwareVersion]) {
        out.firmwareVersion = e[ENV_KEYS.firmwareVersion];
    }
    if (e[ENV_KEYS.displayVersion]) {
        out.displayVersion = e[ENV_KEYS.displayVersion];
    }
    if (e[ENV_KEYS.hmiVersion]) {
        out.hmiVersion = e[ENV_KEYS.hmiVersion];
    }
    if (e[ENV_KEYS.startupId]) {
        out.startupId = e[ENV_KEYS.startupId];
    }
    if (e[ENV_KEYS.mac]) {
        out.mac = e[ENV_KEYS.mac];
    }
    if (e[ENV_KEYS.simulatedIp]) {
        out.simulatedIp = e[ENV_KEYS.simulatedIp];
    }
    if (e[ENV_KEYS.ackDelayMs]) {
        out.ackDelayMs = Number(e[ENV_KEYS.ackDelayMs]);
    }
    if (e[ENV_KEYS.statePath]) {
        out.statePath = e[ENV_KEYS.statePath];
    }
    if (e[ENV_KEYS.logLevel]) {
        out.logLevel = e[ENV_KEYS.logLevel];
    }
    if (e[ENV_KEYS.init]) {
        const v = e[ENV_KEYS.init]!.toLowerCase();
        out.init = v === '1' || v === 'true' || v === 'yes';
    }
    if (e[ENV_KEYS.autoWake]) {
        const v = e[ENV_KEYS.autoWake]!.toLowerCase();
        out.autoWake = v === '1' || v === 'true' || v === 'yes';
    }
    if (e[ENV_KEYS.autoWakeMinSec]) {
        out.autoWakeMinSec = Number(e[ENV_KEYS.autoWakeMinSec]);
    }
    if (e[ENV_KEYS.autoWakeMaxSec]) {
        out.autoWakeMaxSec = Number(e[ENV_KEYS.autoWakeMaxSec]);
    }
    return out;
}

function buildCli(): Command {
    return new Command()
        .name('nspanel-sim')
        .option('--config <path>', 'Path to config.json')
        .option('--http-ip <ip>', 'HTTP listen IP')
        .option('--http-port <port>', 'HTTP listen port', v => Number(v))
        .option('--topic <topic>', 'MQTT base topic (e.g. nspanel-sim)')
        .option('--model <id>', 'Display model id (eu|us-l|us-p)')
        .option('--fw <version>', 'Reported Tasmota firmware version string')
        .option('--display-version <v>', 'Reported Berry driver version (integer generation, e.g. 10)')
        .option('--hmi-version <v>', 'Reported HMI/TFT version (e.g. 5.1.1) — sent in event,startup as opt')
        .option('--startup-id <v>', 'First field in event,startup (default 61)')
        .option('--mac <mac>', 'Reported MAC address (AA:BB:CC:DD:EE:FF)')
        .option('--sim-ip <ip>', 'Reported IP address (StatusNET.IPAddress)')
        .option('--ack-delay-ms <n>', 'Delay between Done and renderCurrentPage acks', v => Number(v))
        .option('--state <path>', 'State file path')
        .option('--log-level <level>', 'Log level (trace|debug|info|warn|error)')
        .option('--init', 'Wipe persisted MQTT credentials on start and wait for fresh nsPanelInit')
        .option('--auto-wake', 'After every sleepReached, simulate a screensaver bExit touch sequence to wake the panel')
        .option('--auto-wake-min-sec <n>', 'Minimum random delay before auto-wake (default 15)', v => Number(v))
        .option('--auto-wake-max-sec <n>', 'Maximum random delay before auto-wake (default 40)', v => Number(v))
        .allowExcessArguments(false);
}

export async function loadConfig(argv: readonly string[]): Promise<SimulatorConfig> {
    const cli = buildCli().parse(argv as string[]);
    const opts = cli.opts<{
        config?: string;
        httpIp?: string;
        httpPort?: number;
        topic?: string;
        model?: string;
        fw?: string;
        displayVersion?: string;
        hmiVersion?: string;
        startupId?: string;
        mac?: string;
        simIp?: string;
        ackDelayMs?: number;
        state?: string;
        logLevel?: string;
        init?: boolean;
        autoWake?: boolean;
        autoWakeMinSec?: number;
        autoWakeMaxSec?: number;
    }>();

    const file = await loadFile(opts.config ?? './config.json');
    const env = envOverlay();
    const cliOverlay: Partial<SimulatorConfig> = {};
    if (opts.httpIp) {
        cliOverlay.httpListenIp = opts.httpIp;
    }
    if (opts.httpPort !== undefined) {
        cliOverlay.httpListenPort = opts.httpPort;
    }
    if (opts.topic) {
        cliOverlay.topic = opts.topic;
    }
    if (opts.model && isModelId(opts.model)) {
        cliOverlay.model = opts.model;
    }
    if (opts.fw) {
        cliOverlay.firmwareVersion = opts.fw;
    }
    if (opts.displayVersion) {
        cliOverlay.displayVersion = opts.displayVersion;
    }
    if (opts.hmiVersion) {
        cliOverlay.hmiVersion = opts.hmiVersion;
    }
    if (opts.startupId) {
        cliOverlay.startupId = opts.startupId;
    }
    if (opts.mac) {
        cliOverlay.mac = opts.mac;
    }
    if (opts.simIp) {
        cliOverlay.simulatedIp = opts.simIp;
    }
    if (opts.ackDelayMs !== undefined) {
        cliOverlay.ackDelayMs = opts.ackDelayMs;
    }
    if (opts.state) {
        cliOverlay.statePath = opts.state;
    }
    if (opts.logLevel) {
        cliOverlay.logLevel = opts.logLevel;
    }
    if (opts.init === true) {
        cliOverlay.init = true;
    }
    if (opts.autoWake === true) {
        cliOverlay.autoWake = true;
    }
    if (opts.autoWakeMinSec !== undefined) {
        cliOverlay.autoWakeMinSec = opts.autoWakeMinSec;
    }
    if (opts.autoWakeMaxSec !== undefined) {
        cliOverlay.autoWakeMaxSec = opts.autoWakeMaxSec;
    }

    const merged: SimulatorConfig = { ...DEFAULTS, ...file, ...env, ...cliOverlay };
    if (merged.autoWakeMinSec > merged.autoWakeMaxSec) {
        const t = merged.autoWakeMinSec;
        merged.autoWakeMinSec = merged.autoWakeMaxSec;
        merged.autoWakeMaxSec = t;
    }
    if (!merged.mac) {
        merged.mac = randomMac();
    }
    if (!isModelId(merged.model)) {
        merged.model = 'eu';
    }
    return merged;
}
