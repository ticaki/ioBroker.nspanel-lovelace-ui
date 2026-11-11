/**
 * Panel models - the NSPanel hardware `eu` and `us-l` (landscape 480x320) and `us-p` (portrait
 * 320x480), plus the models of standalone web panels on phones and tablets: `web-p` (portrait
 * 320x640) and `web-l` (landscape 640x320), see `doc/web-panel/SMARTPHONE.md`.
 */
export type PanelModel = 'eu' | 'us-l' | 'us-p' | 'web-p' | 'web-l';

export const PANEL_MODELS: readonly PanelModel[] = ['eu', 'us-l', 'us-p', 'web-p', 'web-l'];

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
    /**
     * true while the screensaver is woken by a touch (full brightness); false when it is
     * dimmed. Always false outside the screensaver. A tap on an indicator icon only counts
     * as an indicator press while awake.
     */
    awake: boolean;
}

export interface ParsedCommand {
    cmd: string;
    /** fields after the command, split by `~` */
    args: string[];
    raw: string;
}

export type ConnectionStatus = 'connecting' | 'open' | 'closed';

/** kind of a web panel: clone of a hardware panel or a standalone web panel */
export type WebPanelKind = 'clone' | 'web';

export function isWebPanelKind(value: unknown): value is WebPanelKind {
    return value === 'clone' || value === 'web';
}

/** server -> client frames (see doc/web-panel/ARCHITECTURE.md 2.6) */
export interface HelloFrame {
    t: 'hello';
    model: PanelModel;
    /** topic of the endpoint (hardware panel or standalone web panel) */
    topic: string;
    /** name of the panel (= id) */
    name: string;
    friendlyName: string;
    /** known TFT version of the model, `1.0.0` if unknown */
    tftVersion: string;
    kind: WebPanelKind;
    /**
     * show the two hardware buttons below the stage; missing (older adapter) = shown,
     * read it with {@link helloShowsButtons}
     */
    buttons?: boolean;
}

/**
 * `true` when the hardware buttons are shown: only an explicit `buttons: false` in the
 * `hello` hides them, an older backend without the field keeps them.
 *
 * @param hello the hello frame, `undefined` before it arrived
 */
export function helloShowsButtons(hello: Pick<HelloFrame, 'buttons'> | undefined): boolean {
    return hello?.buttons !== false;
}
export interface CmdFrame {
    t: 'cmd';
    p: string;
    /** running number, echoed in the `ack`; missing only with an outdated backend */
    seq?: number;
}
export interface BuzzerFrame {
    t: 'buzzer';
    p: string;
}
export interface ByeFrame {
    t: 'bye';
    /** `unknown panel`, `panel removed`, `shutdown` */
    reason: string;
}
export type ServerFrame = HelloFrame | CmdFrame | BuzzerFrame | ByeFrame;

/** client -> server frames */
export interface AckFrame {
    t: 'ack';
    /** `seq` of the acknowledged `cmd` frame */
    seq?: number;
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
    const frame = value as { t: unknown; p?: unknown; seq?: unknown; model?: unknown; kind?: unknown };
    switch (frame.t) {
        case 'hello':
            return isPanelModel(frame.model) && isWebPanelKind(frame.kind);
        case 'cmd':
            return typeof frame.p === 'string' && (frame.seq === undefined || typeof frame.seq === 'number');
        case 'buzzer':
            return typeof frame.p === 'string';
        case 'bye':
            return true;
        default:
            return false;
    }
}
