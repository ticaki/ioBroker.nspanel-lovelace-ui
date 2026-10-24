import React from 'react';

export interface StartupPageProps {
    /**
     * Media shown while the panel starts. The real panel plays a video / gif / slideshow,
     * the material is provided later and put into `www/startup/` - until then the
     * placeholder logo is shown. Supported: `.mp4`/`.webm` (video, muted loop), everything
     * else as image.
     */
    mediaUrl?: string;
}

interface StartupPageState {
    mediaFailed: boolean;
}

/** Default location of the startup media, checked by the browser; missing file -> placeholder */
export const STARTUP_MEDIA_URL = '/startup/startup.mp4';

/**
 * The page the display shows after boot before the adapter sends the first `pageType`.
 */
export class StartupPage extends React.Component<StartupPageProps, StartupPageState> {
    constructor(props: StartupPageProps) {
        super(props);
        this.state = { mediaFailed: false };
    }

    private readonly onMediaError = (): void => {
        this.setState({ mediaFailed: true });
    };

    private renderMedia(url: string): React.JSX.Element {
        const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain' };
        if (/\.(mp4|webm|ogv)(\?|$)/i.test(url)) {
            return (
                <video
                    src={url}
                    style={style}
                    autoPlay
                    muted
                    loop
                    playsInline
                    onError={this.onMediaError}
                />
            );
        }
        return (
            <img
                src={url}
                style={style}
                alt=""
                onError={this.onMediaError}
            />
        );
    }

    private renderPlaceholder(): React.JSX.Element {
        // provisional logo: a power symbol in the ioBroker blues on a light background
        return (
            <svg
                viewBox="0 0 120 120"
                width={150}
                height={150}
                aria-label="startup"
            >
                <circle
                    cx="60"
                    cy="60"
                    r="42"
                    fill="none"
                    stroke="#164477"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray="210 60"
                    transform="rotate(-242 60 60)"
                />
                <rect
                    x="51"
                    y="18"
                    width="18"
                    height="52"
                    rx="4"
                    fill="#3399cc"
                />
            </svg>
        );
    }

    render(): React.JSX.Element {
        const url = this.props.mediaUrl;
        const showMedia = url !== undefined && url !== '' && !this.state.mediaFailed;
        return (
            <div
                data-page="pageStartup"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: showMedia ? '#000' : '#e6e6e6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {showMedia ? this.renderMedia(url) : this.renderPlaceholder()}
            </div>
        );
    }
}
