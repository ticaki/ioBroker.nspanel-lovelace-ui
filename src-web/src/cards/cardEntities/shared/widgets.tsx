import React from 'react';
import { Icon } from '../../../components/Icon';
import { theme } from '../../../style/theme';
import { splitIconField, type NumberOptions, type ShutterOptions } from './entityTypes';
import { Pressable } from './Pressable';

export interface EntityIconProps {
    /** the icon field of the entity (glyph, text or glyph + text) */
    icon: string;
    color: string;
    /** size of a glyph icon in stage pixels */
    size: number;
    /** font size of a text icon, `size * 0.6` by default */
    textSize?: number;
    onPress?: () => void;
    onLongPress?: () => void;
    style?: React.CSSProperties;
}

/**
 * The icon of an entity: a glyph, a text value (role `textNotIcon`, e.g. `15.6`) or both
 * (role `combined`). Text is drawn in the icon colour.
 */
export class EntityIcon extends React.Component<EntityIconProps> {
    render(): React.JSX.Element {
        const { icon, color, size, onPress, onLongPress, style } = this.props;
        const { glyph, text } = splitIconField(icon);
        const textSize = this.props.textSize ?? Math.round(size * 0.6);
        return (
            <Pressable
                data-role="icon"
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    color,
                    fontSize: textSize,
                    fontWeight: 500,
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                    ...style,
                }}
            >
                {glyph !== undefined ? (
                    <Icon
                        glyph={glyph}
                        size={size}
                        color={color}
                    />
                ) : null}
                {text !== '' ? <span>{text}</span> : null}
            </Pressable>
        );
    }
}

export interface ToggleProps {
    on: boolean;
    /** called with the new state */
    onChange: (on: boolean) => void;
    width?: number;
}

/** The on/off switch at the right of a light/switch/fan row */
export class Toggle extends React.Component<ToggleProps> {
    render(): React.JSX.Element {
        const { on, onChange, width = 52 } = this.props;
        const height = Math.round(width / 2);
        const knob = height - 4;
        return (
            <Pressable
                data-role="toggle"
                data-id={on ? 'on' : 'off'}
                onPress={(): void => onChange(!on)}
                style={{
                    width,
                    height,
                    borderRadius: height / 2,
                    background: on ? 'rgba(26, 143, 227, 0.45)' : '#3a3a3a',
                    position: 'relative',
                    flex: '0 0 auto',
                    transition: 'background 0.15s',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: 2,
                        left: on ? width - knob - 2 : 2,
                        width: knob,
                        height: knob,
                        borderRadius: knob / 2,
                        background: on ? theme.accent : theme.muted,
                        transition: 'left 0.15s',
                    }}
                />
            </Pressable>
        );
    }
}

export interface ShutterButtonsProps {
    options: ShutterOptions;
    onAction: (action: 'up' | 'stop' | 'down') => void;
    size?: number;
}

/** The up / stop / down buttons of a shutter row */
export class ShutterButtons extends React.Component<ShutterButtonsProps> {
    private renderButton(action: 'up' | 'stop' | 'down'): React.JSX.Element {
        const { options, onAction, size = 30 } = this.props;
        const button = options[action];
        const cell = size + 20;
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
    width?: number;
}

interface NumberSliderState {
    /** value while dragging, undefined = show the value from the adapter */
    dragValue: number | undefined;
}

/** The horizontal slider of a number row; sends `number-set` when released */
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
        const { options, width = 190 } = this.props;
        const value = this.state.dragValue ?? options.value;
        const ratio = (value - options.min) / (options.max - options.min);
        const knob = 22;
        const trackHeight = 6;
        return (
            <div
                data-role="slider"
                data-pressable=""
                style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '0 0 auto' }}
            >
                <span style={{ fontSize: 16, color: theme.muted, minWidth: 34, textAlign: 'right' }}>{value}</span>
                <div
                    ref={this.trackRef}
                    onPointerDown={this.onPointerDown}
                    onPointerMove={this.onPointerMove}
                    onPointerUp={this.onPointerUp}
                    onPointerCancel={(): void => this.setState({ dragValue: undefined })}
                    style={{
                        width,
                        height: knob + 8,
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
                            top: (knob + 8 - trackHeight) / 2,
                            height: trackHeight,
                            borderRadius: trackHeight / 2,
                            background: '#4a4a4a',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            width: `${ratio * 100}%`,
                            top: (knob + 8 - trackHeight) / 2,
                            height: trackHeight,
                            borderRadius: trackHeight / 2,
                            background: theme.accent,
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: 4,
                            left: `calc(${ratio * 100}% - ${knob / 2}px)`,
                            width: knob,
                            height: knob,
                            borderRadius: knob / 2,
                            background: theme.accent,
                        }}
                    />
                </div>
            </div>
        );
    }
}

export interface TextButtonProps {
    text: string;
    onPress: () => void;
    onLongPress?: () => void;
    /** draw a frame around the text (button) or only the text (input_sel, timer) */
    framed?: boolean;
    fontSize?: number;
}

/** A text at the right of a row that can be pressed (button, input_sel, timer) */
export class TextButton extends React.Component<TextButtonProps> {
    render(): React.JSX.Element {
        const { text, onPress, onLongPress, framed = false, fontSize = 20 } = this.props;
        return (
            <Pressable
                data-role="text-button"
                onPress={onPress}
                onLongPress={onLongPress}
                style={{
                    fontSize,
                    lineHeight: 1,
                    padding: framed ? '7px 16px' : '7px 4px',
                    border: framed ? `2px solid ${theme.foreground}` : undefined,
                    borderRadius: 8,
                    maxWidth: 220,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    flex: '0 0 auto',
                }}
            >
                {text}
            </Pressable>
        );
    }
}
