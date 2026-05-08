import type { Logger } from '../log.js';
import { isFlashNextionCmd, splitBacklog } from './const/backlog.js';
import { SUFFIX_POWER1, SUFFIX_POWER2, SUFFIX_RESULT, SUFFIX_STATUS0, SUFFIX_STATUS10 } from './const/topics.js';
import type { StateStore } from '../persistence.js';
import { buildStatus0, buildStatusSensor, type SimRuntimeInfo } from './payloads/StatusBuilder.js';

export interface TasmotaPublisher {
    publishStat(suffix: string, payload: string): void;
}

export class TasmotaStub {
    private readonly publisher: TasmotaPublisher;
    private readonly store: StateStore;
    private readonly log: Logger;
    private readonly runtime: SimRuntimeInfo;
    private readonly displayVersion: string;

    constructor(opts: {
        publisher: TasmotaPublisher;
        store: StateStore;
        log: Logger;
        runtime: SimRuntimeInfo;
        displayVersion: string;
    }) {
        this.publisher = opts.publisher;
        this.store = opts.store;
        this.log = opts.log;
        this.runtime = opts.runtime;
        this.displayVersion = opts.displayVersion;
    }

    handle(cmd: string, payload: string): void {
        this.log.trace({ cmd, payload }, 'TasmotaStub.handle');
        switch (cmd) {
            case 'Rule3':
                this.onRule3(payload);
                return;
            case 'POWER1':
                this.onPower(1, payload);
                return;
            case 'POWER2':
                this.onPower(2, payload);
                return;
            case 'STATUS0':
            case 'Status0':
            case 'status0':
                this.onStatus0();
                return;
            case 'STATUS10':
            case 'Status10':
            case 'status10':
                this.onStatus10();
                return;
            case 'Buzzer':
                this.onBuzzer(payload);
                return;
            case 'GetDriverVersion':
                this.onGetDriverVersion();
                return;
            case 'Backlog':
                this.onBacklog(payload);
                return;
            case 'Ping':
                this.onPing(payload);
                return;
            default:
                if (isFlashNextionCmd(cmd)) {
                    this.log.warn({ cmd }, 'FlashNextion ignored by simulator');
                    this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify({ [cmd]: 'Done' }));
                    return;
                }
                this.log.debug({ cmd, payload }, 'Unknown Tasmota cmd ignored');
        }
    }

    private onRule3(payload: string): void {
        const trimmed = payload.trim();
        if (trimmed === '') {
            this.publisher.publishStat(
                SUFFIX_RESULT,
                JSON.stringify({ Rule3: { ...this.store.state.rule3, Free: 511, Length: this.store.state.rule3.rules.length } }),
            );
            return;
        }
        const upper = trimmed.toUpperCase();
        if (upper === 'ON' || upper === '1') {
            this.store.update({ rule3: { ...this.store.state.rule3, state: 'ON' } });
        } else if (upper === 'OFF' || upper === '0') {
            this.store.update({ rule3: { ...this.store.state.rule3, state: 'OFF' } });
        } else if (upper === 'ONCE') {
            this.store.update({ rule3: { ...this.store.state.rule3, once: 'ON' } });
        } else {
            this.store.update({ rule3: { ...this.store.state.rule3, rules: trimmed } });
        }
        this.publisher.publishStat(
            SUFFIX_RESULT,
            JSON.stringify({ Rule3: { ...this.store.state.rule3, Free: 511, Length: this.store.state.rule3.rules.length } }),
        );
    }

    private onPower(which: 1 | 2, payload: string): void {
        const key = which === 1 ? 'power1' : 'power2';
        const suffix = which === 1 ? SUFFIX_POWER1 : SUFFIX_POWER2;
        const trimmed = payload.trim().toUpperCase();
        if (trimmed === '') {
            this.publisher.publishStat(suffix, this.store.state[key]);
            this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify({ [`POWER${which}`]: this.store.state[key] }));
            return;
        }
        let next: 'ON' | 'OFF' = this.store.state[key];
        if (trimmed === 'ON' || trimmed === '1') {
            next = 'ON';
        } else if (trimmed === 'OFF' || trimmed === '0') {
            next = 'OFF';
        } else if (trimmed === 'TOGGLE' || trimmed === '2') {
            next = this.store.state[key] === 'ON' ? 'OFF' : 'ON';
        }
        this.store.update({ [key]: next });
        this.publisher.publishStat(suffix, next);
        this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify({ [`POWER${which}`]: next }));
    }

    private onStatus0(): void {
        this.publisher.publishStat(SUFFIX_STATUS0, JSON.stringify(buildStatus0(this.store.state, this.runtime)));
    }

    private onStatus10(): void {
        this.publisher.publishStat(SUFFIX_STATUS10, JSON.stringify(buildStatusSensor()));
    }

    private onBuzzer(_payload: string): void {
        this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify({ Buzzer: 'OFF' }));
    }

    private onGetDriverVersion(): void {
        this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify({ nlui_driver_version: this.displayVersion }));
    }

    private onBacklog(payload: string): void {
        const entries = splitBacklog(payload);
        for (const e of entries) {
            this.handle(e.cmd, e.args);
        }
    }

    private onPing(payload: string): void {
        const host = payload.trim() || 'localhost';
        const result: Record<string, unknown> = {
            Ping: {
                [host]: {
                    Reachable: true,
                    Success: 4,
                    Errors: 0,
                    MinTime: 1,
                    MaxTime: 3,
                    AvgTime: 2,
                },
            },
        };
        this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify(result));
    }
}
