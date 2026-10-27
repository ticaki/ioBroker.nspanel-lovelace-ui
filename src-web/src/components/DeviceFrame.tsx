import React from 'react';
import type { ConnectionStatus, PanelModel } from '../protocol/types';
import { deviceGeometry, stageSize, theme } from '../style/theme';
import { Icon } from './Icon';

export interface DeviceFrameProps {
    model: PanelModel;
    /** brightness the display shows right now (0-100) */
    brightness: number;
    status: ConnectionStatus;
    /**
     * reason of the `bye` frame that ended the connection - shown instead of the status;
     * `shutdown` is followed by a reconnect, every other reason needs a reload
     */
    byeReason?: string;
    /** called on every touch/click on the stage, resets the screensaver timeout */
    onTouch: () => void;
    onHardwareButton: (button: 1 | 2) => void;
    children?: React.ReactNode;
}

interface DeviceFrameState {
    viewportWidth: number;
    viewportHeight: number;
    /** the offline overlay is visible (the connection is not open since `OVERLAY_DELAY_MS`) */
    overlay: boolean;
    /** the hardware button the pointer holds down right now */
    pressed?: 1 | 2;
}

/** the overlay waits this long, so the first connect does not flash it */
export const OVERLAY_DELAY_MS = 500;

const TEXT: Record<'de' | 'en', Record<ConnectionStatus, string>> = {
    de: {
        connecting: 'Verbinde mit dem Adapter …',
        open: '',
        closed: 'Verbindung zum Adapter verloren – neuer Versuch …',
    },
    en: { connecting: 'Connecting to the adapter …', open: '', closed: 'Connection to the adapter lost – retrying …' },
};

/** texts of the known `bye` reasons; an unknown reason is shown as it is */
const BYE_TEXT: Record<'de' | 'en', Record<string, string>> = {
    de: {
        'unknown panel': 'Unbekanntes Panel: die Adresse passt zu keinem Panel des Adapters.',
        'panel removed': 'Das Panel wurde aus dem Adapter entfernt.',
        shutdown: 'Der Adapter wurde beendet – warte auf Neustart …',
    },
    en: {
        'unknown panel': 'Unknown panel: the address matches no panel of the adapter.',
        'panel removed': 'The panel was removed from the adapter.',
        shutdown: 'The adapter was stopped – waiting for the restart …',
    },
};
const RELOAD_TEXT: Record<'de' | 'en', string> = {
    de: 'Verbindung beendet, Seite neu laden.',
    en: 'Connection ended, reload the page.',
};

/** `bye` reasons the transport recovers from by itself - no "reload the page" */
const RECONNECTING_BYE_REASONS = new Set(['shutdown']);

function language(): 'de' | 'en' {
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

/** the notice of the overlay: the `bye` reason wins over the connection status */
export function offlineNotice(status: ConnectionStatus, byeReason: string | undefined, lang: 'de' | 'en'): string {
    if (byeReason === undefined) {
        return TEXT[lang][status];
    }
    const text = BYE_TEXT[lang][byeReason] ?? byeReason;
    return RECONNECTING_BYE_REASONS.has(byeReason) ? text : `${text} ${RELOAD_TEXT[lang]}`;
}

/**
 * The panel: a stage in the native resolution behind the black glass and the two white
 * hardware buttons below (like the eu device), scaled together to the viewport. The stage is
 * dimmed like the real display (brightness and contrast).
 * Without a connection to the adapter the stage is greyed out behind an overlay that
 * says why, taps do not reach the page and the hardware buttons are disabled.
 */
export class DeviceFrame extends React.Component<DeviceFrameProps, DeviceFrameState> {
    private overlayTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(props: DeviceFrameProps) {
        super(props);
        this.state = { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, overlay: false };
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.onResize);
        this.syncOverlay();
    }

    componentDidUpdate(prev: DeviceFrameProps): void {
        if (prev.status !== this.props.status || prev.byeReason !== this.props.byeReason) {
            this.syncOverlay();
        }
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize);
        this.clearOverlayTimer();
    }

    private readonly onResize = (): void => {
        this.setState({ viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    };

    /** true while the connection to the adapter is not open */
    static isOffline(props: Pick<DeviceFrameProps, 'status' | 'byeReason'>): boolean {
        return props.status !== 'open' || props.byeReason !== undefined;
    }

    private clearOverlayTimer(): void {
        if (this.overlayTimer !== undefined) {
            clearTimeout(this.overlayTimer);
            this.overlayTimer = undefined;
        }
    }

    /** shows the overlay `OVERLAY_DELAY_MS` after the connection went away, hides it at once when it is back */
    private syncOverlay(): void {
        if (!DeviceFrame.isOffline(this.props)) {
            this.clearOverlayTimer();
            if (this.state.overlay) {
                this.setState({ overlay: false });
            }
            return;
        }
        if (this.overlayTimer !== undefined || this.state.overlay) {
            return;
        }
        this.overlayTimer = setTimeout(() => {
            this.overlayTimer = undefined;
            if (DeviceFrame.isOffline(this.props)) {
                this.setState({ overlay: true });
            }
        }, OVERLAY_DELAY_MS);
    }

    private readonly onHardwareButtonClick = (button: 1 | 2): void => {
        if (!DeviceFrame.isOffline(this.props)) {
            this.props.onHardwareButton(button);
        }
    };

    /** css filter that mimics the dimmed display: brightness and contrast go down together */
    static dimFilter(brightness: number): string {
        const b = Math.max(0, Math.min(100, brightness)) / 100;
        if (b >= 1) {
            return 'none';
        }
        // perceived brightness of a backlight is roughly the square root of its level:
        // 100 -> full, 20 -> dark but readable, 0 -> almost black
        const v = Math.sqrt(b);
        const bright = 0.08 + 0.92 * v;
        const contrast = 0.7 + 0.3 * v;
        return `brightness(${bright.toFixed(3)}) contrast(${contrast.toFixed(3)})`;
    }

    /** the dim filter plus the grey, dark look of a stage without connection */
    static offlineFilter(dimFilter: string): string {
        const offline = 'grayscale(1) brightness(0.35)';
        return dimFilter === 'none' ? offline : `${dimFilter} ${offline}`;
    }

    private readonly onButtonDown = (button: 1 | 2): void => {
        if (!DeviceFrame.isOffline(this.props)) {
            this.setState({ pressed: button });
        }
    };

    private readonly onButtonUp = (): void => {
        if (this.state.pressed !== undefined) {
            this.setState({ pressed: undefined });
        }
    };

    render(): React.JSX.Element {
        const { model, brightness, status, byeReason, children } = this.props;
        const { width, height } = stageSize(model);
        const { viewportWidth, viewportHeight } = this.state;
        const device = deviceGeometry(model);
        const scale = Math.max(0.1, Math.min(viewportWidth / device.width, viewportHeight / device.height));
        const lang = language();
        const offline = DeviceFrame.isOffline(this.props);
        const overlay = offline && this.state.overlay;
        const notice = offlineNotice(status, byeReason, lang);
        const final = byeReason !== undefined && !RECONNECTING_BYE_REASONS.has(byeReason);
        const noticeColor = final ? '#ff8a65' : '#ffb300';
        const stageFilter = DeviceFrame.dimFilter(brightness);
        return (
            <div
                data-device=""
                style={{
                    width: '100vw',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000',
                    overflow: 'hidden',
                    fontFamily: theme.fontFamily,
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    touchAction: 'manipulation',
                }}
            >
                <div
                    style={{
                        width: device.width * scale,
                        height: device.height * scale,
                        position: 'relative',
                        flex: '0 0 auto',
                    }}
                >
                    <div
                        data-device-body=""
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: device.width,
                            height: device.height,
                            transform: `scale(${scale})`,
                            transformOrigin: '0 0',
                        }}
                    >
                        <div
                            data-stage=""
                            onPointerDown={this.props.onTouch}
                            style={{
                                position: 'absolute',
                                left: device.padX,
                                top: device.padY,
                                width,
                                height,
                                background: theme.background,
                                color: theme.foreground,
                                overflow: 'hidden',
                                filter: overlay ? DeviceFrame.offlineFilter(stageFilter) : stageFilter,
                                transition: 'filter 0.4s ease',
                            }}
                        >
                            {children}
                        </div>
                        {offline ? (
                            // in stage pixels like the page, so icon and text scale with the display;
                            // present at once (it swallows the taps), visible after OVERLAY_DELAY_MS
                            <div
                                data-overlay=""
                                style={{
                                    position: 'absolute',
                                    left: device.padX,
                                    top: device.padY,
                                    width,
                                    height,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(0,0,0,0.55)',
                                    opacity: overlay ? 1 : 0,
                                    transition: 'opacity 0.3s ease',
                                    pointerEvents: 'auto',
                                    cursor: 'default',
                                }}
                            >
                                <div
                                    data-status={byeReason !== undefined ? 'bye' : status}
                                    data-bye={byeReason}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 10,
                                        maxWidth: Math.round(width * 0.8),
                                        padding: '18px 24px',
                                        borderRadius: 12,
                                        background: 'rgba(20,20,20,0.92)',
                                        border: `2px solid ${noticeColor}`,
                                        boxShadow: '0 0 24px rgba(0,0,0,0.8)',
                                        color: noticeColor,
                                        fontSize: 16,
                                        lineHeight: 1.3,
                                        textAlign: 'center',
                                    }}
                                >
                                    <Icon
                                        name={final ? 'lan-disconnect' : 'wifi-off'}
                                        size={56}
                                        color={noticeColor}
                                    />
                                    <span>{notice}</span>
                                </div>
                            </div>
                        ) : null}
                        <div
                            data-hardware-buttons=""
                            style={{
                                position: 'absolute',
                                left: 0,
                                bottom: 0,
                                width: device.width,
                                height: device.buttonsHeight,
                                display: 'flex',
                                gap: 2,
                                boxSizing: 'border-box',
                                border: `1px solid ${theme.hardwareButtonEdge}`,
                                borderRadius: '0 0 10px 10px',
                                background: theme.hardwareButtonEdge,
                                overflow: 'hidden',
                                opacity: offline ? 0.35 : 1,
                                transition: 'opacity 0.3s ease',
                            }}
                        >
                            {([1, 2] as const).map(button => {
                                const pressed = this.state.pressed === button;
                                return (
                                    <div
                                        key={button}
                                        data-hardware-button={button}
                                        aria-disabled={offline}
                                        onClick={(): void => this.onHardwareButtonClick(button)}
                                        onPointerDown={(): void => this.onButtonDown(button)}
                                        onPointerUp={this.onButtonUp}
                                        onPointerLeave={this.onButtonUp}
                                        onPointerCancel={this.onButtonUp}
                                        style={{
                                            flex: '1 1 0',
                                            background: pressed ? theme.hardwareButtonPressed : theme.hardwareButton,
                                            // the edge of the glass casts a thin shadow on the buttons
                                            boxShadow: pressed
                                                ? 'inset 0 3px 8px rgba(0,0,0,0.25)'
                                                : 'inset 0 4px 4px -2px rgba(0,0,0,0.35)',
                                            cursor: offline ? 'default' : 'pointer',
                                            transition: 'background 0.08s ease',
                                        }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
