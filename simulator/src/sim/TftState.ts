import type { Logger } from '../log.js';

export interface TftSnapshot {
    currentCard: string;
    dimStandby: number;
    dimActive: number;
    timeoutSec: number;
    dayMode: 0 | 1;
    isAsleep: boolean;
}

export type SleepReachedHandler = (currentCard: string) => void;
export type BootResetHandler = () => void;

const DEFAULT_SNAPSHOT: TftSnapshot = {
    currentCard: '',
    dimStandby: 20,
    dimActive: 80,
    timeoutSec: 30,
    dayMode: 1,
    isAsleep: false,
};

export class TftState {
    private snapshot: TftSnapshot = { ...DEFAULT_SNAPSHOT };
    private readonly log: Logger;
    private sleepTimer: NodeJS.Timeout | null = null;
    private onSleepReached: SleepReachedHandler = () => {};
    private onBootReset: BootResetHandler = () => {};

    constructor(log: Logger) {
        this.log = log;
    }

    setSleepHandler(fn: SleepReachedHandler): void {
        this.onSleepReached = fn;
    }

    setBootResetHandler(fn: BootResetHandler): void {
        this.onBootReset = fn;
    }

    get(): Readonly<TftSnapshot> {
        return this.snapshot;
    }

    private cancelSleepTimer(): void {
        if (this.sleepTimer) {
            clearTimeout(this.sleepTimer);
            this.sleepTimer = null;
        }
    }

    private armSleepTimer(): void {
        this.cancelSleepTimer();
        const seconds = this.snapshot.timeoutSec;
        if (!Number.isFinite(seconds) || seconds <= 0) {
            return;
        }
        const card = this.snapshot.currentCard;
        const t = setTimeout(() => {
            this.sleepTimer = null;
            if (this.snapshot.isAsleep) {
                return;
            }
            this.snapshot.isAsleep = true;
            this.log.info({ card, after: seconds }, 'TFT sleepReached fired');
            try {
                this.onSleepReached(card);
            } catch (err: unknown) {
                this.log.error({ err: (err as Error).message }, 'sleep handler threw');
            }
        }, seconds * 1000);
        t.unref?.();
        this.sleepTimer = t;
    }

    shutdown(): void {
        this.cancelSleepTimer();
    }

    apply(payload: string): void {
        const idx = payload.indexOf('~');
        if (idx === -1) {
            this.log.debug({ payload }, 'TftState: payload without ~ separator');
            return;
        }
        const prefix = payload.slice(0, idx);
        const rest = payload.slice(idx + 1);
        switch (prefix) {
            case 'pageType': {
                const prevCard = this.snapshot.currentCard;
                this.snapshot.currentCard = rest;
                if (rest === 'screensaver') {
                    this.snapshot.isAsleep = true;
                    this.cancelSleepTimer();
                } else if (rest === 'pageStartup') {
                    // Soft-reset: real panel re-emits its boot event sequence on this payload
                    this.cancelSleepTimer();
                    this.snapshot.isAsleep = false;
                    this.log.info({ prev: prevCard }, 'TFT soft-reset (pageStartup) — re-emitting boot');
                    try {
                        this.onBootReset();
                    } catch (err: unknown) {
                        this.log.error({ err: (err as Error).message }, 'boot reset handler threw');
                    }
                } else {
                    // any other card (cardEntities, cardThermo*, cardGrid*, cardMedia, cardPower, cardChart, cardAlarm, cardQR, ...)
                    // we do NOT auto-arm here — the real panel arms only on touch + timeout~N from adapter.
                    this.snapshot.isAsleep = false;
                }
                this.log.info({ card: rest, prev: prevCard }, 'TFT page');
                break;
            }
            case 'dimmode': {
                const parts = rest.split('~');
                if (parts.length >= 2) {
                    const standby = Number(parts[0]);
                    const active = Number(parts[1]);
                    if (Number.isFinite(standby)) {
                        this.snapshot.dimStandby = standby;
                    }
                    if (Number.isFinite(active)) {
                        this.snapshot.dimActive = active;
                    }
                }
                if (parts.length >= 3) {
                    this.snapshot.dayMode = Number(parts[2]) === 0 ? 0 : 1;
                }
                this.log.debug({ standby: this.snapshot.dimStandby, active: this.snapshot.dimActive }, 'TftState: dim update');
                break;
            }
            case 'timeout': {
                const t = Number(rest);
                if (!Number.isFinite(t) || t < 0) {
                    break;
                }
                this.snapshot.timeoutSec = t;
                const card = this.snapshot.currentCard;
                if (t === 0 || this.snapshot.isAsleep || card === 'screensaver') {
                    this.cancelSleepTimer();
                    this.log.info({ timeoutSec: t, card }, 'TFT timeout cleared');
                } else {
                    // re-arm on every timeout~N — simulates "timer restarts on touch"
                    // (works during pageStartup too: real panel always honors a fresh timeout)
                    this.armSleepTimer();
                    this.log.info({ timeoutSec: t, card }, 'TFT timeout (re)armed');
                }
                break;
            }
            default:
                this.log.trace({ prefix, rest }, 'TftState: ignored payload (no state mapping)');
        }
    }
}
