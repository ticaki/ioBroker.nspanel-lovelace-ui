import React from 'react';
import type { ConnectionStatus, PanelModel } from '../protocol/types';
import { stageSize, theme } from '../style/theme';

export interface DeviceFrameProps {
    model: PanelModel;
    /** brightness the display shows right now (0-100) */
    brightness: number;
    status: ConnectionStatus;
    /** reason of the `bye` frame that ended the session - shown instead of the status, no retry */
    byeReason?: string;
    /** called on every touch/click on the stage, resets the screensaver timeout */
    onTouch: () => void;
    onHardwareButton: (button: 1 | 2) => void;
    children?: React.ReactNode;
}

interface DeviceFrameState {
    viewportWidth: number;
    viewportHeight: number;
}

const TEXT: Record<'de' | 'en', Record<ConnectionStatus, string>> = {
    de: { connecting: 'Verbinde mit dem Adapter …', open: '', closed: 'Verbindung getrennt, neuer Versuch …' },
    en: { connecting: 'Connecting to the adapter …', open: '', closed: 'Connection lost, retrying …' },
};

/** texts of the known `bye` reasons; an unknown reason is shown as it is */
const BYE_TEXT: Record<'de' | 'en', Record<string, string>> = {
    de: {
        'unknown panel': 'Unbekanntes Panel: die Adresse passt zu keinem Panel des Adapters.',
        'no free slot': 'Kein freier Platz: zu viele Web-Panels sind geöffnet.',
        replaced: 'Diese Sitzung wurde von einem anderen Browser übernommen.',
        'panel removed': 'Das Panel wurde aus dem Adapter entfernt.',
        shutdown: 'Der Adapter wurde beendet.',
    },
    en: {
        'unknown panel': 'Unknown panel: the address matches no panel of the adapter.',
        'no free slot': 'No free slot: too many web panels are open.',
        replaced: 'This session was taken over by another browser.',
        'panel removed': 'The panel was removed from the adapter.',
        shutdown: 'The adapter was stopped.',
    },
};
const RELOAD_TEXT: Record<'de' | 'en', string> = {
    de: 'Sitzung beendet, Seite neu laden.',
    en: 'Session ended, reload the page.',
};

function language(): 'de' | 'en' {
    return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

/**
 * The display of the panel: a stage in the native resolution, scaled to the viewport,
 * dimmed like the real display (brightness and contrast) and the two hardware buttons below.
 */
export class DeviceFrame extends React.Component<DeviceFrameProps, DeviceFrameState> {
    constructor(props: DeviceFrameProps) {
        super(props);
        this.state = { viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.onResize);
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.onResize);
    }

    private readonly onResize = (): void => {
        this.setState({ viewportWidth: window.innerWidth, viewportHeight: window.innerHeight });
    };

    /** css filter that mimics the dimmed display: brightness and contrast go down together */
    static dimFilter(brightness: number): string {
        const b = Math.max(0, Math.min(100, brightness)) / 100;
        // 100 -> full, 20 -> dark but readable, 0 -> black
        const bright = 0.05 + 0.95 * b;
        const contrast = 0.6 + 0.4 * b;
        return `brightness(${bright.toFixed(3)}) contrast(${contrast.toFixed(3)})`;
    }

    render(): React.JSX.Element {
        const { model, brightness, status, byeReason, children } = this.props;
        const { width, height } = stageSize(model);
        const { viewportWidth, viewportHeight } = this.state;
        const buttons = theme.hardwareButtonsHeight;
        const scale = Math.max(0.1, Math.min(viewportWidth / width, (viewportHeight - buttons) / height));
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const lang = language();
        const notice =
            byeReason !== undefined
                ? `${BYE_TEXT[lang][byeReason] ?? byeReason} ${RELOAD_TEXT[lang]}`
                : TEXT[lang][status];
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
                <div style={{ width: scaledWidth, height: scaledHeight, position: 'relative', flex: '0 0 auto' }}>
                    <div
                        data-stage=""
                        onPointerDown={this.props.onTouch}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width,
                            height,
                            transform: `scale(${scale})`,
                            transformOrigin: '0 0',
                            background: theme.background,
                            color: theme.foreground,
                            overflow: 'hidden',
                            filter: DeviceFrame.dimFilter(brightness),
                            transition: 'filter 0.4s ease',
                        }}
                    >
                        {children}
                    </div>
                    {notice !== '' ? (
                        <div
                            data-status={byeReason !== undefined ? 'bye' : status}
                            data-bye={byeReason}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                padding: '6px 10px',
                                background: 'rgba(0,0,0,0.75)',
                                color: byeReason !== undefined ? '#ff8a65' : '#ffb300',
                                fontSize: Math.max(12, 14 * scale),
                                textAlign: 'center',
                            }}
                        >
                            {notice}
                        </div>
                    ) : null}
                </div>
                <div
                    data-hardware-buttons=""
                    style={{
                        width: scaledWidth,
                        height: buttons,
                        display: 'flex',
                        gap: 6,
                        padding: '6px 0 0 0',
                        boxSizing: 'border-box',
                        flex: '0 0 auto',
                    }}
                >
                    {([1, 2] as const).map(button => (
                        <div
                            key={button}
                            data-hardware-button={button}
                            onClick={(): void => this.props.onHardwareButton(button)}
                            style={{
                                flex: '1 1 0',
                                borderRadius: 4,
                                background: 'linear-gradient(#2b2b2b, #161616)',
                                border: '1px solid #3a3a3a',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }
}
