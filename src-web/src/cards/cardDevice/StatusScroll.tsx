import React from 'react';
import { nextionFont, textShift } from '../../protocol/fonts';
import type { Box } from './layout';

/** Speed of the scrolling text `gStatus` of the HMI: `dis` 4 px every `tim` 100 ms */
export const STATUS_SCROLL_PX_PER_S = 40;

/** Name of the css animation of the scrolling status line */
export const STATUS_SCROLL_ANIMATION = 'deviceStatusScroll';

/** Timing of the css animation of a scrolling text, in seconds */
export interface ScrollTiming {
    /** one round: the text enters at the right edge of the box and leaves it at the left */
    duration: number;
    /** negative: the first round starts with the text at the left edge of the box */
    delay: number;
}

/**
 * The timing of a text that scrolls to the left (`dir` 1 of the Nextion scrolling text) pixel by pixel at a
 * fixed speed: one round moves it by the width of the box plus its own width. The text starts readable at the
 * left edge, runs out to the left and comes back in from the right.
 *
 * @param textWidth width of the text in stage pixels
 * @param boxWidth width of the status line in stage pixels
 * @param speed stage pixels per second
 */
export function statusScrollTiming(
    textWidth: number,
    boxWidth: number,
    speed: number = STATUS_SCROLL_PX_PER_S,
): ScrollTiming {
    return { duration: (boxWidth + Math.max(0, textWidth)) / speed, delay: -boxWidth / speed };
}

export interface StatusScrollProps {
    /** the text without the scroll mark */
    text: string;
    color: string;
    /** the box of `gStatus` in stage pixels */
    box: Box;
    /** Nextion font of the line */
    font: number;
}

interface StatusScrollState {
    /** the text the width was measured for and its width in stage pixels; undefined until measured */
    measured?: { text: string; width: number };
}

/**
 * The scrolling status line of a device page (`gStatus` of the HMI): one line that moves to the left at
 * {@link STATUS_SCROLL_PX_PER_S}, cut at the box. The width of the text is measured in the browser; until then
 * (and without a browser) the text stands at the left edge. The animation belongs to the text: an update with the
 * same text leaves it running, another text starts at the left edge again.
 */
export class StatusScroll extends React.Component<StatusScrollProps, StatusScrollState> {
    private readonly textRef = React.createRef<HTMLSpanElement>();
    private mounted = false;

    constructor(props: StatusScrollProps) {
        super(props);
        this.state = {};
    }

    componentDidMount(): void {
        this.mounted = true;
        this.measure();
        // the width changes when the web font arrives after the first paint
        if (typeof document !== 'undefined' && document.fonts) {
            void document.fonts.ready.then(() => {
                if (this.mounted) {
                    this.measure();
                }
            });
        }
    }

    componentDidUpdate(prev: StatusScrollProps): void {
        if (prev.text !== this.props.text || prev.font !== this.props.font) {
            this.measure();
        }
    }

    componentWillUnmount(): void {
        this.mounted = false;
    }

    private measure(): void {
        const element = this.textRef.current;
        if (!element) {
            return;
        }
        const width = element.offsetWidth;
        const { measured } = this.state;
        if (!measured || measured.text !== this.props.text || measured.width !== width) {
            this.setState({ measured: { text: this.props.text, width } });
        }
    }

    render(): React.JSX.Element {
        const { text, color, box, font } = this.props;
        const nf = nextionFont(undefined, font);
        const { measured } = this.state;
        const timing =
            measured && measured.text === text && text !== '' ? statusScrollTiming(measured.width, box.w) : undefined;
        return (
            <div
                data-role="status-scroll"
                data-scrolling={timing ? '' : undefined}
                style={{
                    position: 'absolute',
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                <style>
                    {`@keyframes ${STATUS_SCROLL_ANIMATION} { from { transform: translateX(0); } to { transform: translateX(-100%); } }`}
                </style>
                <div
                    // a new text is a new element: its animation starts at the left edge
                    key={text}
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: (box.h - nf.px) / 2,
                        height: nf.px,
                        width: 'max-content',
                        display: 'flex',
                        whiteSpace: 'nowrap',
                        color,
                        fontSize: nf.fontSize,
                        fontWeight: nf.fontWeight,
                        lineHeight: `${nf.px}px`,
                        animation: timing
                            ? `${STATUS_SCROLL_ANIMATION} ${timing.duration}s linear ${timing.delay}s infinite`
                            : undefined,
                    }}
                >
                    {/* the way across the box: the moving strip is box + text wide, -100% moves it out completely */}
                    {timing ? <span style={{ flex: '0 0 auto', width: box.w }} /> : null}
                    <span
                        ref={this.textRef}
                        style={{ flex: '0 0 auto', position: 'relative', top: textShift(nf) }}
                    >
                        {text}
                    </span>
                </div>
            </div>
        );
    }
}
