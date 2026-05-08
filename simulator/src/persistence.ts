import { promises as fs } from 'node:fs';
import { renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Logger } from './log.js';

export interface PersistedState {
    mac: string;
    hostname: string;
    ipAddress: string;
    mqttHost: string | null;
    mqttPort: number | null;
    mqttUser: string | null;
    mqttPassword: string | null;
    mqttClient: string | null;
    fullTopic: string | null;
    topic: string | null;
    friendlyName: string | null;
    setOption103: 0 | 1;
    setOption111: 0 | 1;
    setOption132: 0 | 1;
    weblog: number;
    timezoneOffset: string;
    template: string | null;
    moduleType: number;
    power1: 'ON' | 'OFF';
    power2: 'ON' | 'OFF';
    rule3: { state: 'ON' | 'OFF'; once: 'ON' | 'OFF'; rules: string };
    bootCount: number;
}

export function makeDefaultState(opts: { mac: string; ipAddress: string }): PersistedState {
    const hostname = `nspanel-sim-${opts.mac.replace(/:/g, '').slice(-6).toLowerCase()}`;
    return {
        mac: opts.mac,
        hostname,
        ipAddress: opts.ipAddress,
        mqttHost: null,
        mqttPort: null,
        mqttUser: null,
        mqttPassword: null,
        mqttClient: null,
        fullTopic: null,
        topic: null,
        friendlyName: null,
        setOption103: 0,
        setOption111: 0,
        setOption132: 0,
        weblog: 2,
        timezoneOffset: '+01:00',
        template: null,
        moduleType: 0,
        power1: 'OFF',
        power2: 'OFF',
        rule3: { state: 'OFF', once: 'OFF', rules: '' },
        bootCount: 0,
    };
}

export class StateStore {
    private readonly file: string;
    private readonly log: Logger;
    state: PersistedState;
    constructor(file: string, initial: PersistedState, log: Logger) {
        this.file = path.resolve(file);
        this.state = initial;
        this.log = log;
    }

    static async load(file: string, fallback: PersistedState, log: Logger): Promise<StateStore> {
        const abs = path.resolve(file);
        let state = fallback;
        try {
            const buf = await fs.readFile(abs, 'utf8');
            const parsed = JSON.parse(buf) as Partial<PersistedState>;
            state = { ...fallback, ...parsed };
            log.info({ file: abs }, 'Loaded simulator state');
        } catch (err: unknown) {
            const code = (err as { code?: string }).code;
            if (code === 'ENOENT') {
                log.info({ file: abs }, 'No state file yet, starting fresh');
            } else {
                log.warn({ err, file: abs }, 'Could not load state file, using defaults');
            }
        }
        return new StateStore(abs, state, log);
    }

    save(): void {
        try {
            const tmp = `${this.file}.tmp`;
            writeFileSync(tmp, JSON.stringify(this.state, null, 2), 'utf8');
            renameSync(tmp, this.file);
        } catch (err: unknown) {
            this.log.error({ err, file: this.file }, 'Failed to persist state');
        }
    }

    update(patch: Partial<PersistedState>): void {
        this.state = { ...this.state, ...patch };
        this.save();
    }

    clearCredentials(): void {
        this.state = {
            ...this.state,
            mqttHost: null,
            mqttPort: null,
            mqttUser: null,
            mqttPassword: null,
            mqttClient: null,
            fullTopic: null,
            topic: null,
        };
        this.save();
    }
}

export function randomMac(): string {
    const hex = (): string =>
        Math.floor(Math.random() * 256)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();
    return ['AA', 'BB', 'CC', hex(), hex(), hex()].join(':');
}
