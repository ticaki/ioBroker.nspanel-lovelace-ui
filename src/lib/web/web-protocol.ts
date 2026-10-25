import type { NSpanelModel } from '../types/types';

/**
 * WebSocket frames between adapter and browser - see doc/web-panel/ARCHITECTURE.md section 2.6.
 * One JSON object per message.
 */

/** 'clone' = web view of a hardware panel, 'web' = standalone web panel of the admin panel table */
export type WebPanelKind = 'clone' | 'web';

export type HelloFrame = {
    t: 'hello';
    model: NSpanelModel;
    /** topic of the endpoint: the hardware panel or the standalone web panel */
    topic: string;
    /** name of the panel (= its id, the states tree `panels.<name>`) */
    name: string;
    friendlyName: string;
    tftVersion: string;
    kind: WebPanelKind;
};

export type ServerFrame =
    | HelloFrame
    /** CustomSend payload, unchanged; `seq` is acknowledged by the client */
    | { t: 'cmd'; p: string; seq: number }
    /** Tasmota buzzer argument, unchanged */
    | { t: 'buzzer'; p: string }
    | { t: 'bye'; reason: string };

export type ClientFrame =
    /** acknowledgement of a cmd frame - becomes stat/RESULT {"CustomSend":"Done"} once per seq */
    | { t: 'ack'; seq?: number }
    /** event of the display - becomes tele/RESULT {"CustomRecv": p} */
    | { t: 'recv'; p: string };

/**
 * Parse a raw WebSocket message into a client frame.
 *
 * @param raw the message text
 * @returns the frame, or undefined if the message is not a valid client frame
 */
export function parseClientFrame(raw: string): ClientFrame | undefined {
    let data: unknown;
    try {
        data = JSON.parse(raw);
    } catch {
        return undefined;
    }
    if (!data || typeof data !== 'object' || !('t' in data)) {
        return undefined;
    }
    const frame = data as { t: unknown; p?: unknown; seq?: unknown };
    if (frame.t === 'ack') {
        return typeof frame.seq === 'number' && Number.isInteger(frame.seq)
            ? { t: 'ack', seq: frame.seq }
            : { t: 'ack' };
    }
    if (frame.t === 'recv' && typeof frame.p === 'string' && frame.p) {
        return { t: 'recv', p: frame.p };
    }
    return undefined;
}
