import type { NSpanelModel } from '../types/types';

/**
 * WebSocket frames between adapter and browser - see doc/web-panel/ARCHITECTURE.md section 2.6.
 * One JSON object per message.
 */

export type HelloFrame = {
    t: 'hello';
    session: string;
    model: NSpanelModel;
    topic: string;
    name: string;
    friendlyName: string;
    tftVersion: string;
};

export type ServerFrame =
    | HelloFrame
    /** CustomSend payload, unchanged */
    | { t: 'cmd'; p: string }
    /** Tasmota buzzer argument, unchanged */
    | { t: 'buzzer'; p: string }
    | { t: 'bye'; reason: string };

export type ClientFrame =
    /** acknowledgement of a cmd frame - becomes stat/RESULT {"CustomSend":"Done"} */
    | { t: 'ack' }
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
    const frame = data as { t: unknown; p?: unknown };
    if (frame.t === 'ack') {
        return { t: 'ack' };
    }
    if (frame.t === 'recv' && typeof frame.p === 'string' && frame.p) {
        return { t: 'recv', p: frame.p };
    }
    return undefined;
}
