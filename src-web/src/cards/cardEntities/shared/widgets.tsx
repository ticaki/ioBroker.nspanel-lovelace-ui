import React from 'react';
import { Icon } from '../../../components/Icon';
import { theme } from '../../../style/theme';
import { nextionFont, splitIconField, textShift, type NumberOptions, type ShutterOptions } from './entityTypes';
import { Pressable } from './Pressable';

export interface EntityIconProps {
    /** the icon field of the entity (glyph, text or glyph + text, optionally `¬<font>`) */
    icon: string;
    color: string;
    /** Nextion font (0-5) the HMI uses for the element when the field carries no `¬<font>` */
    font: number;
    /** scales glyph and text (compact rows of cardSchedule) */
    scale?: number;
    onPress?: () => void;
    style?: React.CSSProperties;
}

/**
 * The icon of an entity: a glyph, a text value (role `textNotIcon`, e.g. `15.6`) or both
 * (role `combined`), drawn in the icon colour with the metrics of the Nextion font. The line
 * box is as high as the font size (`lineHeight: 1`), a glyph is centred on it; a text that is
 * wider than the box starts at its left edge and is cut at the right like on the HMI.
 */
export class EntityIcon extends React.Component<EntityIconProps> {
    render(): React.JSX.Element {
        const { icon, color, onPress, style, scale = 1 } = this.props;
        const { glyph, text, font } = splitIconField(icon);
        const nf = nextionFont(font, this.props.font);
        const fontSize = Math.round(nf.fontSize * scale);
        const iconSize = Math.round(nf.iconSize * scale);
        return (
            <Pressable
                data-role="icon"
                onPress={onPress}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'safe center',
                    gap: 2,
                    color,
                    fontSize,
                    fontWeight: nf.fontWeight,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    ...style,
                }}
            >
                {glyph !== undefined ? (
                    <Icon
                        glyph={glyph}
                        size={iconSize}
                        color={color}
                    />
                ) : null}
                {text !== '' ? <span style={{ flex: '0 0 auto' }}>{text}</span> : null}
            </Pressable>
        );
    }
}

/** text alignment of a Nextion component (`xcen` / `ycen`): 0 = start, 1 = centre, 2 = end */
export type NextionAlign = 0 | 1 | 2;

export interface HmiTextBoxProps {
    /** the field as the adapter sends it (glyph, text or glyph + text, optionally `¬<font>`) */
    field: string;
    color: string;
    /** the box of the Nextion component in stage pixels */
    x: number;
    y: number;
    w: number;
    h: number;
    /** font of the component when the field carries no `¬<font>` */
    font: number;
    xcen?: NextionAlign;
    ycen?: NextionAlign;
}

function flexAlign(a: NextionAlign): string {
    return a === 0 ? 'flex-start' : a === 2 ? 'safe flex-end' : 'safe center';
}

/**
 * A Nextion text/button component without word wrap (`isbr=0`): the line of the bitmap font
 * (height = Nextion font size) is aligned in the box like `xcen` / `ycen`; a line that is
 * wider or higher than the box starts at the left / top edge and is cut at the box (verified on
 * hardware: `35%` in font 5 shows the upper left part, the bulb in font 4 sits at the top).
 * Characters the font lacks are not drawn (see {@link splitIconField}).
 */
export class HmiTextBox extends React.Component<HmiTextBoxProps> {
    render(): React.JSX.Element {
        const { field, color, x, y, w, h, xcen = 1, ycen = 1 } = this.props;
        const { glyph, text, font } = splitIconField(field);
        const nf = nextionFont(font, this.props.font);
        return (
            <div
                data-role="hmi-box"
                data-font={font ?? this.props.font}
                style={{
                    position: 'absolute',
                    left: x,
                    top: y,
                    width: w,
                    height: h,
                    display: 'flex',
                    justifyContent: flexAlign(xcen),
                    alignItems: flexAlign(ycen),
                    overflow: 'hidden',
                    pointerEvents: 'none',
                }}
            >
                <div
                    style={{
                        flex: '0 0 auto',
                        height: nf.px,
                        display: 'flex',
                        alignItems: 'flex-start',
                        whiteSpace: 'nowrap',
                        color,
                        fontSize: nf.fontSize,
                        fontWeight: nf.fontWeight,
                        lineHeight: `${nf.px}px`,
                    }}
                >
                    {glyph !== undefined ? (
                        <Icon
                            glyph={glyph}
                            size={nf.iconSize}
                            color={color}
                            style={{ marginTop: nf.iconTop }}
                        />
                    ) : null}
                    {text !== '' ? <span style={{ position: 'relative', top: textShift(nf) }}>{text}</span> : null}
                </div>
            </div>
        );
    }
}

export interface ToggleProps {
    on: boolean;
    /** called with the new state */
    onChange: (on: boolean) => void;
    /** width of the control, 45 px on the HMI */
    width?: number;
}

/**
 * The on/off switch at the right of a light/switch/fan row: a slim pill with a round knob
 * that carries an `O` (off, grey) or `I` (on, blue), as the HMI draws it.
 */
export class Toggle extends React.Component<ToggleProps> {
    render(): React.JSX.Element {
        const { on, onChange, width = 45 } = this.props;
        const knob = Math.round(width * (25 / 45));
        const track = Math.round(width * (17 / 45));
        return (
            <Pressable
                data-role="toggle"
                data-id={on ? 'on' : 'off'}
                onPress={(): void => onChange(!on)}
                style={{
                    width,
                    height: knob,
                    position: 'relative',
                    flex: '0 0 auto',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: (knob - track) / 2,
                        height: track,
                        borderRadius: track / 2,
                        background: on ? theme.toggleOnTrack : theme.toggleOffTrack,
                        transition: 'background 0.15s',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: on ? width - knob : 0,
                        width: knob,
                        height: knob,
                        borderRadius: knob / 2,
                        background: on ? theme.accent : theme.toggleOffKnob,
                        color: on ? '#d0d0d0' : theme.toggleOffTrack,
                        fontSize: Math.round(knob * 0.6),
                        fontWeight: 700,
                        lineHeight: `${knob}px`,
                        textAlign: 'center',
                        transition: 'left 0.15s',
                    }}
                >
                    {on ? 'I' : 'O'}
                </div>
            </Pressable>
        );
    }
}

export interface ShutterButtonsProps {
    options: ShutterOptions;
    onAction: (action: 'up' | 'stop' | 'down') => void;
    /** size of the icons (32 px Nextion font = 29 px) */
    size?: number;
    /** width of one button cell, the HMI spaces the icons 51.5 px apart */
    cell?: number;
}

/** The up / stop / down buttons of a shutter row */
export class ShutterButtons extends React.Component<ShutterButtonsProps> {
    private renderButton(action: 'up' | 'stop' | 'down'): React.JSX.Element {
        const { options, onAction, size = 29, cell = 51.5 } = this.props;
        const button = options[action];
        return (
            <Pressable
                key={action}
                data-role={`shutter-${action}`}
                disabled={!button.enabled}
                onPress={(): void => onAction(action)}
                style={{
                    width: cell,
                    height: cell,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: '0 0 auto',
                }}
            >
                {button.icon !== '' ? (
                    <Icon
                        glyph={button.icon}
                        size={size}
                        color={button.enabled ? theme.foreground : theme.muted}
                    />
                ) : null}
            </Pressable>
        );
    }

    render(): React.JSX.Element {
        return (
            <div style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
                {this.renderButton('up')}
                {this.renderButton('stop')}
                {this.renderButton('down')}
            </div>
        );
    }
}

export interface NumberSliderProps {
    options: NumberOptions;
    /** called once when the finger is lifted */
    onChange: (value: number) => void;
    /** length of the track, 94 px on the HMI */
    width?: number;
    /** font size of the value right of the track */
    fontSize?: number;
}

interface NumberSliderState {
    /** value while dragging, undefined = show the value from the adapter */
    dragValue: number | undefined;
}

/**
 * The horizontal slider of a number row: a thin blue line with a round knob, the value as
 * text right of it (24 px Nextion font). Sends `number-set` when released.
 */
export class NumberSlider extends React.Component<NumberSliderProps, NumberSliderState> {
    private readonly trackRef = React.createRef<HTMLDivElement>();

    constructor(props: NumberSliderProps) {
        super(props);
        this.state = { dragValue: undefined };
    }

    private valueAt(clientX: number): number {
        const track = this.trackRef.current;
        const { min, max } = this.props.options;
        if (!track) {
            return min;
        }
        const rect = track.getBoundingClientRect();
        const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
        return Math.round(min + Math.min(1, Math.max(0, ratio)) * (max - min));
    }

    private readonly onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({ dragValue: this.valueAt(e.clientX) });
    };

    private readonly onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.state.dragValue === undefined) {
            return;
        }
        this.setState({ dragValue: this.valueAt(e.clientX) });
    };

    private readonly onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.state.dragValue === undefined) {
            return;
        }
        e.stopPropagation();
        const value = this.valueAt(e.clientX);
        this.setState({ dragValue: undefined });
        this.props.onChange(value);
    };

    render(): React.JSX.Element {
        const { options, width = 94, fontSize = 18 } = this.props;
        const value = this.state.dragValue ?? options.value;
        const ratio = (value - options.min) / (options.max - options.min);
        const knob = 13;
        const trackHeight = 3;
        // the touch area is taller than the drawn line
        const hit = 30;
        return (
            <div
                data-role="slider"
                data-pressable=""
                style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}
            >
                <div
                    ref={this.trackRef}
                    onPointerDown={this.onPointerDown}
                    onPointerMove={this.onPointerMove}
                    onPointerUp={this.onPointerUp}
                    onPointerCancel={(): void => this.setState({ dragValue: undefined })}
                    style={{
                        width,
                        height: hit,
                        position: 'relative',
                        touchAction: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: (hit - trackHeight) / 2,
                            height: trackHeight,
                            background: theme.accent,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: (hit - knob) / 2,
                            left: `calc(${ratio * 100}% - ${(ratio * knob).toFixed(1)}px)`,
                            width: knob,
                            height: knob,
                            borderRadius: knob / 2,
                            background: theme.accent,
                        }}
                    />
                </div>
                <span
                    data-role="value"
                    style={{ fontSize, lineHeight: 1, minWidth: 44, whiteSpace: 'nowrap' }}
                >
                    {this.state.dragValue ?? options.text}
                </span>
            </div>
        );
    }
}

export interface TextButtonProps {
    text: string;
    onPress: () => void;
    /** css colour of the text; the HMI draws button and input_sel in its blue, the timer in white */
    color?: string;
    fontSize?: number;
}

/** A text at the right of a row that can be pressed (button, input_sel, timer) */
export class TextButton extends React.Component<TextButtonProps> {
    render(): React.JSX.Element {
        const { text, onPress, color = theme.foreground, fontSize = 18 } = this.props;
        return (
            <Pressable
                data-role="text-button"
                onPress={onPress}
                style={{
                    fontSize,
                    lineHeight: 1,
                    color,
                    padding: '8px 0',
                    maxWidth: 240,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    flex: '0 0 auto',
                }}
            >
                {text}
            </Pressable>
        );
    }
}
