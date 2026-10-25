import React from 'react';

/** size of the vertical sliders of popupLight on the HMI */
export const LIGHT_SLIDER_WIDTH = 100;
export const LIGHT_SLIDER_HEIGHT = 240;
/** the knob is a light band over the whole width with a dark bar in the middle */
const KNOB_HEIGHT = 28;
const KNOB_COLOR = '#cfcfcf';
const KNOB_BAR_COLOR = '#8a8a8a';
/** the empty part above the knob */
const EMPTY_COLOR = '#222222';

export interface LightSliderProps {
    /** 0..100, 0 at the bottom */
    value: number;
    /** colour of the filled part below the knob (brightness slider) */
    fill?: string;
    /** css background of the whole slider instead of a fill (colour temperature gradient) */
    track?: string;
    /** called on release with the new value */
    onCommit: (value: number) => void;
    /** `data-slider` attribute */
    name?: string;
}

interface LightSliderState {
    dragValue: number | undefined;
}

/**
 * The vertical slider of the light popup (100 x 240 like the Nextion slider): the part
 * below the knob is filled with the colour of the light, the part above is dark. The
 * value is sent on release only, like the HMI.
 */
export class LightSlider extends React.Component<LightSliderProps, LightSliderState> {
    private readonly root = React.createRef<HTMLDivElement>();
    private pointerId: number | undefined;

    constructor(props: LightSliderProps) {
        super(props);
        this.state = { dragValue: undefined };
    }

    /** value from a pointer position; the knob centre travels between KNOB_HEIGHT/2 and height - KNOB_HEIGHT/2 */
    private valueAt(clientY: number): number {
        const el = this.root.current;
        if (!el) {
            return this.props.value;
        }
        const rect = el.getBoundingClientRect();
        const scale = rect.height / LIGHT_SLIDER_HEIGHT;
        const start = (KNOB_HEIGHT / 2) * scale;
        const travel = Math.max(1, rect.height - KNOB_HEIGHT * scale);
        const ratio = Math.max(0, Math.min(1, (clientY - rect.top - start) / travel));
        return Math.round((1 - ratio) * 100);
    }

    private readonly onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.pointerId !== undefined) {
            return;
        }
        e.preventDefault();
        this.pointerId = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({ dragValue: this.valueAt(e.clientY) });
    };

    private readonly onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.pointerId !== e.pointerId) {
            return;
        }
        const v = this.valueAt(e.clientY);
        if (v !== this.state.dragValue) {
            this.setState({ dragValue: v });
        }
    };

    private readonly onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.pointerId !== e.pointerId) {
            return;
        }
        this.pointerId = undefined;
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        const v = this.valueAt(e.clientY);
        this.setState({ dragValue: undefined });
        this.props.onCommit(v);
    };

    private readonly onPointerCancel = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.pointerId !== e.pointerId) {
            return;
        }
        this.pointerId = undefined;
        this.setState({ dragValue: undefined });
    };

    render(): React.JSX.Element {
        const { fill = KNOB_COLOR, track, name } = this.props;
        const value = Math.max(0, Math.min(100, this.state.dragValue ?? this.props.value));
        const centre = KNOB_HEIGHT / 2 + (1 - value / 100) * (LIGHT_SLIDER_HEIGHT - KNOB_HEIGHT);
        return (
            <div
                ref={this.root}
                data-slider={name}
                data-value={value}
                onPointerDown={this.onPointerDown}
                onPointerMove={this.onPointerMove}
                onPointerUp={this.onPointerUp}
                onPointerCancel={this.onPointerCancel}
                style={{
                    position: 'relative',
                    width: LIGHT_SLIDER_WIDTH,
                    height: LIGHT_SLIDER_HEIGHT,
                    background: track ?? EMPTY_COLOR,
                    cursor: 'pointer',
                    touchAction: 'none',
                    overflow: 'hidden',
                }}
            >
                {track === undefined ? (
                    <div
                        data-fill=""
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: centre,
                            bottom: 0,
                            background: fill,
                        }}
                    />
                ) : null}
                <div
                    data-knob=""
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: centre - KNOB_HEIGHT / 2,
                        height: KNOB_HEIGHT,
                        background: KNOB_COLOR,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ width: 50, height: 4, borderRadius: 2, background: KNOB_BAR_COLOR }} />
                </div>
            </div>
        );
    }
}
