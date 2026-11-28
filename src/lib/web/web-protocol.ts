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
    /** show the two virtual hardware buttons below the display (always true for a clone) */
    buttons: boolean;
    /**
     * the web panel may use extensions over the hardware panel (instance option webAllowExtensions, see
     * `Panel.webExtensionsAllowed`); false = it draws like the HMI, e.g. the rows of cardSchedule
     */
    extensions: boolean;
    /**
     * build id of the served web bundle (meta {@link WEB_BUILD_META} of www/index.html) - a browser
     * running another bundle reloads once; missing when it cannot be read
     */
    build?: string;
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

/** name of the meta tag the frontend build writes its build id into (`webBuildId` in src-web/vite.config.ts) */
export const WEB_BUILD_META = 'nspanel-web-build';

/**
 * Build id of the web bundle from its index.html.
 *
 * @param html content of www/index.html
 * @returns the id, undefined without the meta tag (frontend built by an older version)
 */
export function parseWebBuildId(html: string): string | undefined {
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
        if (!new RegExp(`\\bname\\s*=\\s*["']${WEB_BUILD_META}["']`, 'i').test(tag)) {
            continue;
        }
        const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1]?.trim();
        return content ? content : undefined;
    }
    return undefined;
}

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
