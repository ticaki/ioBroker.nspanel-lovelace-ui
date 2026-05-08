import type { Logger } from '../log.js';
import { ACK_DONE, ACK_RENDER_CURRENT_PAGE, SUFFIX_RESULT } from './const/topics.js';
import type { TftState } from './TftState.js';

export interface BerryBridgePublisher {
    publishStat(suffix: string, payload: string): void;
    publishTele(suffix: string, payload: string): void;
}

export class BerryBridge {
    private readonly publisher: BerryBridgePublisher;
    private readonly tft: TftState;
    private readonly log: Logger;
    private readonly ackDelayMs: number;

    constructor(opts: { publisher: BerryBridgePublisher; tft: TftState; log: Logger; ackDelayMs: number }) {
        this.publisher = opts.publisher;
        this.tft = opts.tft;
        this.log = opts.log;
        this.ackDelayMs = opts.ackDelayMs;
    }

    onCustomSend(payload: string): void {
        this.log.debug({ payload }, 'CustomSend received');
        this.tft.apply(payload);

        const send = (text: string): void => {
            this.publisher.publishStat(SUFFIX_RESULT, JSON.stringify({ CustomSend: text }));
        };

        send(ACK_DONE);
        if (this.ackDelayMs > 0) {
            setTimeout(() => send(ACK_RENDER_CURRENT_PAGE), this.ackDelayMs).unref?.();
        } else {
            send(ACK_RENDER_CURRENT_PAGE);
        }
    }

    emitEvent(parts: string[]): void {
        const json = JSON.stringify({ CustomRecv: ['event', ...parts].join(',') });
        this.publisher.publishTele(SUFFIX_RESULT, json);
    }
}
