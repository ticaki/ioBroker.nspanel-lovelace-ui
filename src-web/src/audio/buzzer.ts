/**
 * Simulates the buzzer of the NSPanel with Web Audio.
 *
 * Tasmota syntax (`Buzzer <count>,<beep>,<silence>,<tune>`):
 *  - count   number of beeps (default 1), -1 = infinite is treated as 1
 *  - beep    length of a beep in 100 ms units (default 1)
 *  - silence length of the pause in 100 ms units (default 1)
 *  - tune    bit pattern (decimal or 0x…) played from the most significant used bit,
 *            100 ms per bit, 1 = beep, 0 = silence; overrides count/beep/silence
 *
 * Browsers only allow audio after a user gesture, so `enable()` has to be called from a
 * click or touch handler once. Before that, beeps are dropped.
 */
export interface BeepStep {
    on: boolean;
    ms: number;
}

const UNIT_MS = 100;
const FREQUENCY = 2000;

export function parseBuzzerPayload(payload: string): BeepStep[] {
    const parts = payload
        .split(',')
        .map(p => p.trim())
        .filter(p => p !== '');
    const num = (index: number, fallback: number): number => {
        const raw = parts[index];
        if (raw === undefined) {
            return fallback;
        }
        const n = raw.startsWith('0x') || raw.startsWith('0X') ? parseInt(raw, 16) : Number(raw);
        return Number.isFinite(n) ? n : fallback;
    };
    const steps: BeepStep[] = [];
    if (parts.length >= 4) {
        const tune = num(3, 0) >>> 0;
        if (tune > 0) {
            const bits = 32 - Math.clz32(tune);
            for (let bit = bits - 1; bit >= 0; bit--) {
                steps.push({ on: ((tune >>> bit) & 1) === 1, ms: UNIT_MS });
            }
            return steps;
        }
    }
    let count = num(0, 1);
    if (count === 0) {
        return steps;
    }
    if (count < 0) {
        count = 1;
    }
    const beep = Math.max(1, num(1, 1)) * UNIT_MS;
    const silence = Math.max(1, num(2, 1)) * UNIT_MS;
    for (let i = 0; i < Math.min(count, 20); i++) {
        steps.push({ on: true, ms: beep });
        if (i < count - 1) {
            steps.push({ on: false, ms: silence });
        }
    }
    return steps;
}

export class Buzzer {
    private context: AudioContext | undefined;

    /** has to be called from a user gesture */
    enable(): void {
        if (this.context) {
            if (this.context.state === 'suspended') {
                void this.context.resume();
            }
            return;
        }
        try {
            this.context = new AudioContext();
        } catch {
            this.context = undefined;
        }
    }

    get enabled(): boolean {
        return this.context !== undefined && this.context.state === 'running';
    }

    play(payload: string): void {
        const ctx = this.context;
        if (!ctx || ctx.state !== 'running') {
            return;
        }
        const steps = parseBuzzerPayload(payload);
        let t = ctx.currentTime;
        for (const step of steps) {
            if (step.on) {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.value = FREQUENCY;
                gain.gain.value = 0.15;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + step.ms / 1000);
            }
            t += step.ms / 1000;
        }
    }
}
