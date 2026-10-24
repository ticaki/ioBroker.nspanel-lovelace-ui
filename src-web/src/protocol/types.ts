/** NSPanel hardware models - `eu` and `us-l` are landscape 480x320, `us-p` is portrait 320x480 */
export type PanelModel = 'eu' | 'us-l' | 'us-p';

export const PANEL_MODELS: readonly PanelModel[] = ['eu', 'us-l', 'us-p'];

export function isPanelModel(value: unknown): value is PanelModel {
    return typeof value === 'string' && (PANEL_MODELS as readonly string[]).includes(value);
}

/**
 * The 6 field entity tuple used everywhere in the protocol:
 * `type~internalName~icon~iconColor~displayName~optionalValue`
 */
export interface Entity6 {
    type: string;
    /** internal name, sent back in `event,buttonPress2,<id>,...` */
    id: string;
    /** icon glyph (private use character of the HMI font) */
    icon: string;
    /** RGB565 colour */
    iconColor: number;
    displayName: string;
    optionalValue: string;
}

/** The two navigation entities at the start of every `entityUpd` */
export interface Navigation {
    left: Entity6;
    right: Entity6;
}

export interface EntityUpdHeader {
    title: string;
    navigation: Navigation;
    /** fields after title and navigation (index 13 onwards of the args) */
    rest: string[];
}

/** `dimmode~standby~active~background~text[~switchToNewLightPopup]` */
export interface DimState {
    /** brightness in the screensaver (0-100) */
    standby: number;
    /** brightness while a page is active (0-100) */
    active: number;
    /** RGB565 background colour */
    background: number;
    /** RGB565 text colour */
    text: number;
}

export interface GlobalState {
    model: PanelModel;
    /** `time~HH:MM[~icon]` */
    time: string;
    /** icon or text next to the time (notification bell) */
    timeIcon: string;
    /** `date~…` */
    date: string;
    /** screensaver timeout in seconds, 0 = never */
    timeout: number;
    dim: DimState;
    /** true while a screensaver page is shown */
    sleeping: boolean;
}

export interface ParsedCommand {
    cmd: string;
    /** fields after the command, split by `~` */
    args: string[];
    raw: string;
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

/** server -> client frames (see doc/web-panel/ARCHITECTURE.md 2.6) */
export interface HelloFrame {
    t: 'hello';
    session: string;
    model: PanelModel;
    topic: string;
    name: string;
    friendlyName: string;
    tftVersion: string;
}
export interface CmdFrame {
    t: 'cmd';
    p: string;
}
export interface BuzzerFrame {
    t: 'buzzer';
    p: string;
}
export interface ByeFrame {
    t: 'bye';
    reason: string;
}
export type ServerFrame = HelloFrame | CmdFrame | BuzzerFrame | ByeFrame;

/** client -> server frames */
export interface AckFrame {
    t: 'ack';
}
export interface RecvFrame {
    t: 'recv';
    p: string;
}
export type ClientFrame = AckFrame | RecvFrame;

export function isServerFrame(value: unknown): value is ServerFrame {
    if (!value || typeof value !== 'object' || !('t' in value)) {
        return false;
    }
    const frame = value as { t: unknown; p?: unknown; model?: unknown; reason?: unknown };
    switch (frame.t) {
        case 'hello':
            return isPanelModel(frame.model);
        case 'cmd':
        case 'buzzer':
            return typeof frame.p === 'string';
        case 'bye':
            return true;
        default:
            return false;
    }
}
