import React from 'react';
import type { PanelModel } from '../protocol/types';
import { startupPictures, type Rect, type StartupPictures } from './startup/pictures';
import { bannerAt, FRAME_INTERVAL_MS, frameIndex, lastDistinctTick } from './startup/sequence';

export interface StartupPageProps {
    /** the display model, decides the pictures and their places */
    model: PanelModel;
}

interface StartupPageState {
    /** ticks of the 200 ms timer since the page opened */
    tick: number;
}

/**
 * The page the display shows after boot before the adapter sends the first `pageType`: the
 * boot animation of the HMI (`pageSplash` followed by `pageStartup`, see `startup/sequence.ts`).
 */
export class StartupPage extends React.Component<StartupPageProps, StartupPageState> {
    private timer: number | undefined;
    private preloaded: HTMLImageElement[] = [];

    constructor(props: StartupPageProps) {
        super(props);
        this.state = { tick: 0 };
    }

    componentDidMount(): void {
        this.preload(startupPictures(this.props.model));
        this.timer = window.setInterval(this.onTick, FRAME_INTERVAL_MS);
    }

    componentDidUpdate(prev: StartupPageProps): void {
        if (prev.model !== this.props.model) {
            this.preload(startupPictures(this.props.model));
        }
    }

    componentWillUnmount(): void {
        if (this.timer !== undefined) {
            window.clearInterval(this.timer);
            this.timer = undefined;
        }
        this.preloaded = [];
    }

    /** keeps every frame decoded so the loop does not stutter on the first run */
    private preload(pictures: StartupPictures): void {
        this.preloaded = [...pictures.frames, ...Object.values(pictures.banners)].map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });
    }

    private readonly onTick = (): void => {
        this.setState(s => {
            // the loop goes on forever, the counter only has to grow until the last banner change
            const next = s.tick + 1;
            const wrap = lastDistinctTick();
            return { tick: next > wrap ? wrap + ((next - wrap) % wrap || 0) : next };
        });
    };

    private renderPicture(src: string, rect: Rect, name: string, value: string | number): React.JSX.Element {
        return (
            <img
                src={src}
                alt=""
                draggable={false}
                {...{ [`data-startup-${name}`]: value }}
                style={{
                    position: 'absolute',
                    left: rect.x,
                    top: rect.y,
                    width: rect.w,
                    height: rect.h,
                    userSelect: 'none',
                    pointerEvents: 'none',
                }}
            />
        );
    }

    render(): React.JSX.Element {
        const pictures = startupPictures(this.props.model);
        const { tick } = this.state;
        const frame = frameIndex(tick);
        const banner = bannerAt(tick);
        return (
            <div
                data-page="pageStartup"
                style={{ position: 'absolute', inset: 0, background: '#000' }}
            >
                {this.renderPicture(pictures.frames[frame] ?? '', pictures.picture, 'frame', frame)}
                {this.renderPicture(pictures.banners[banner], pictures.banner, 'banner', banner)}
            </div>
        );
    }
}
