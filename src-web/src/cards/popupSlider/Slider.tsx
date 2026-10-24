import React from 'react';
import { theme } from '../../style/theme';
import { snapToStep } from './fields';

export interface SliderProps {
    value: number;
    min: number;
    max: number;
    /** snapping of the dragged value, 1 by default; 0 = no snapping */
    step?: number;
    /** length of the slider in stage pixels (width when horizontal, height when vertical) */
    length: number;
    orientation?: 'horizontal' | 'vertical';
    /**
     * Horizontal: the minimum is on the left, vertical: the minimum is at the bottom.
     * `reverse` flips the direction (e.g. a shutter: 0 = open at the top, 100 = closed at the bottom).
     */
    reverse?: boolean;
    disabled?: boolean;
    /** css background of the track (e.g. a gradient for the colour temperature) */
    track?: string;
    /** colour of the part between the minimum and the knob; none for gradient tracks */
    fill?: string;
    trackThickness?: number;
    knobSize?: number;
    knobColor?: string;
    /** called when the pointer is released - the only moment a value is sent to the adapter */
    onCommit: (value: number) => void;
    /** called while dragging (live preview), optional */
    onChange?: (value: number) => void;
    /** `data-slider` attribute for tests and screenshots */
    name?: string;
}

interface SliderState {
    /** value while the knob is dragged, undefined when idle */
    dragValue: number | undefined;
}

/**
 * A slider in the style of the HMI: thin track, round knob. Touch and mouse via pointer
 * events; the value is reported with `onCommit` on release only, like the real display.
 * Works inside the CSS-scaled stage because only ratios of the bounding box are used.
 */
export class Slider extends React.Component<SliderProps, SliderState> {
    private readonly root = React.createRef<HTMLDivElement>();
    private pointerId: number | undefined;

    constructor(props: SliderProps) {
        super(props);
        this.state = { dragValue: undefined };
    }

    private get knobSize(): number {
        return this.props.knobSize ?? 16;
    }

    private get thickness(): number {
        return this.props.trackThickness ?? 4;
    }

    private get vertical(): boolean {
        return this.props.orientation === 'vertical';
    }

    /** value from a pointer position */
    private valueAt(clientX: number, clientY: number): number {
        const el = this.root.current;
        const { min, max, step = 1, reverse = false } = this.props;
        if (!el) {
            return this.props.value;
        }
        const rect = el.getBoundingClientRect();
        const knob = this.knobSize;
        // the knob centre travels between knob/2 and length - knob/2 (stage px), scale the
        // bounding box accordingly so the ratio is independent of the css scale of the stage
        const total = this.vertical ? rect.height : rect.width;
        const scale = total / this.props.length;
        const start = (knob / 2) * scale;
        const travel = Math.max(1, total - knob * scale);
        const pos = this.vertical ? clientY - rect.top : clientX - rect.left;
        let ratio = (pos - start) / travel;
        ratio = Math.max(0, Math.min(1, ratio));
        if (this.vertical !== reverse) {
            // vertical: minimum at the bottom; reverse flips it
            ratio = 1 - ratio;
        }
        return snapToStep(min + ratio * (max - min), min, max, step);
    }

    private readonly onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.props.disabled || this.pointerId !== undefined) {
            return;
        }
        e.preventDefault();
        this.pointerId = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const v = this.valueAt(e.clientX, e.clientY);
        this.setState({ dragValue: v });
        this.props.onChange?.(v);
    };

    private readonly onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.pointerId !== e.pointerId) {
            return;
        }
        const v = this.valueAt(e.clientX, e.clientY);
        if (v !== this.state.dragValue) {
            this.setState({ dragValue: v });
            this.props.onChange?.(v);
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
        const v = this.valueAt(e.clientX, e.clientY);
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
        const { min, max, length, disabled = false, reverse = false, name } = this.props;
        const value = this.state.dragValue ?? this.props.value;
        const knob = this.knobSize;
        const thickness = this.thickness;
        const span = max - min;
        let ratio = span === 0 ? 0 : (value - min) / span;
        ratio = Math.max(0, Math.min(1, ratio));
        const vertical = this.vertical;
        // position of the knob centre along the slider, from the start (left / top)
        const fromStart = vertical !== reverse ? 1 - ratio : ratio;
        const centre = knob / 2 + fromStart * (length - knob);
        const fillColor = disabled ? theme.muted : (this.props.fill ?? theme.accent);
        const knobColor = disabled ? theme.muted : (this.props.knobColor ?? theme.accent);
        const trackBg = this.props.track ?? (disabled ? '#3a3a3a' : '#4a4a4a');
        const cross = Math.max(knob, thickness) + 8;
        const rootStyle: React.CSSProperties = {
            position: 'relative',
            width: vertical ? cross : length,
            height: vertical ? length : cross,
            cursor: disabled ? 'default' : 'pointer',
            touchAction: 'none',
            flex: '0 0 auto',
        };
        const trackStyle: React.CSSProperties = vertical
            ? {
                  position: 'absolute',
                  left: (cross - thickness) / 2,
                  top: knob / 2,
                  width: thickness,
                  height: length - knob,
                  borderRadius: thickness / 2,
                  background: trackBg,
              }
            : {
                  position: 'absolute',
                  top: (cross - thickness) / 2,
                  left: knob / 2,
                  height: thickness,
                  width: length - knob,
                  borderRadius: thickness / 2,
                  background: trackBg,
              };
        // the fill goes from the minimum end to the knob
        const minAtStart = vertical === reverse;
        const fillLength = Math.max(0, minAtStart ? centre - knob / 2 : length - knob / 2 - centre);
        const fillStyle: React.CSSProperties | undefined =
            this.props.track !== undefined
                ? undefined
                : vertical
                  ? {
                        position: 'absolute',
                        left: (cross - thickness) / 2,
                        top: minAtStart ? knob / 2 : centre,
                        width: thickness,
                        height: fillLength,
                        borderRadius: thickness / 2,
                        background: fillColor,
                    }
                  : {
                        position: 'absolute',
                        top: (cross - thickness) / 2,
                        left: minAtStart ? knob / 2 : centre,
                        height: thickness,
                        width: fillLength,
                        borderRadius: thickness / 2,
                        background: fillColor,
                    };
        const knobStyle: React.CSSProperties = {
            position: 'absolute',
            width: knob,
            height: knob,
            borderRadius: '50%',
            background: knobColor,
            boxShadow: '0 0 0 2px rgba(0,0,0,0.6)',
            left: vertical ? (cross - knob) / 2 : centre - knob / 2,
            top: vertical ? centre - knob / 2 : (cross - knob) / 2,
        };
        return (
            <div
                ref={this.root}
                data-slider={name}
                data-value={value}
                style={rootStyle}
                onPointerDown={this.onPointerDown}
                onPointerMove={this.onPointerMove}
                onPointerUp={this.onPointerUp}
                onPointerCancel={this.onPointerCancel}
            >
                <div style={trackStyle} />
                {fillStyle ? <div style={fillStyle} /> : null}
                <div style={knobStyle} />
            </div>
        );
    }
}
