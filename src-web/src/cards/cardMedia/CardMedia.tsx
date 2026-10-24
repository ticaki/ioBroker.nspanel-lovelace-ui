import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { isEmptyEntity } from '../../protocol/split';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { entityPressEvent } from './entityPress';
import type { CardMediaModel } from './parse';

/** step of the volume buttons left and right of the slider */
const VOLUME_STEP = 5;

interface VolumeSliderProps {
    /** 0-100 */
    value: number;
    /** called when the finger is lifted */
    onChange: (value: number) => void;
}

interface VolumeSliderState {
    /** value while dragging, undefined when idle */
    dragValue: number | undefined;
}

/** The horizontal volume slider: thin track, blue to the left of the round thumb, grey to the right */
class VolumeSlider extends React.Component<VolumeSliderProps, VolumeSliderState> {
    private readonly track = React.createRef<HTMLDivElement>();

    constructor(props: VolumeSliderProps) {
        super(props);
        this.state = { dragValue: undefined };
    }

    private valueFromPointer(clientX: number): number {
        const rect = this.track.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) {
            return this.props.value;
        }
        const ratio = (clientX - rect.left) / rect.width;
        return Math.round(Math.max(0, Math.min(1, ratio)) * 100);
    }

    private readonly onPointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
        e.currentTarget.setPointerCapture(e.pointerId);
        this.setState({ dragValue: this.valueFromPointer(e.clientX) });
    };

    private readonly onPointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.state.dragValue !== undefined) {
            this.setState({ dragValue: this.valueFromPointer(e.clientX) });
        }
    };

    private readonly onPointerUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        if (this.state.dragValue === undefined) {
            return;
        }
        const value = this.valueFromPointer(e.clientX);
        this.setState({ dragValue: undefined });
        this.props.onChange(value);
    };

    private readonly onPointerCancel = (): void => {
        this.setState({ dragValue: undefined });
    };

    render(): React.JSX.Element {
        const value = this.state.dragValue ?? this.props.value;
        const thumb = 16;
        return (
            <div
                ref={this.track}
                data-volume-slider=""
                data-pressable=""
                onPointerDown={this.onPointerDown}
                onPointerMove={this.onPointerMove}
                onPointerUp={this.onPointerUp}
                onPointerCancel={this.onPointerCancel}
                style={{
                    position: 'relative',
                    flex: '1 1 auto',
                    height: 32,
                    touchAction: 'none',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 14,
                        height: 4,
                        borderRadius: 2,
                        background: theme.muted,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        width: `${value}%`,
                        top: 14,
                        height: 4,
                        borderRadius: 2,
                        background: theme.accent,
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: `calc(${value}% - ${thumb / 2}px)`,
                        top: 16 - thumb / 2,
                        width: thumb,
                        height: thumb,
                        borderRadius: '50%',
                        background: theme.accent,
                    }}
                />
            </div>
        );
    }
}

/** The media card: logo, two text rows, transport buttons, volume slider and five option buttons */
export class CardMedia extends React.Component<CardProps<CardMediaModel>> {
    private pressEntity(entity: Entity6): void {
        const event = entityPressEvent(entity);
        if (!event) {
            return;
        }
        if ('popup' in event) {
            this.props.openPopup(event.popup, event.id, entity.displayName, entity.icon);
        } else {
            this.props.press(event.id, event.action, event.value);
        }
    }

    private renderControl(
        glyph: string | undefined,
        name: string | undefined,
        color: string,
        action: string | undefined,
        size: number,
    ): React.JSX.Element {
        const hidden = (glyph === undefined || glyph === '') && name === undefined;
        return (
            <div
                data-media-button={action ?? ''}
                data-pressable={hidden ? undefined : ''}
                style={{
                    width: 56,
                    height: 56,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    visibility: hidden ? 'hidden' : 'visible',
                }}
                onClick={hidden || !action ? undefined : (): void => this.props.press(this.props.model.id, action)}
            >
                <Icon
                    glyph={glyph}
                    name={name}
                    size={size}
                    color={color}
                />
            </div>
        );
    }

    private renderOption(entity: Entity6, index: number): React.JSX.Element {
        const empty = isEmptyEntity(entity);
        const pressable = !empty && entityPressEvent(entity) !== undefined;
        const color = color565ToCss(entity.iconColor);
        const text = entity.icon === '' ? entity.optionalValue || entity.displayName : '';
        return (
            <div
                key={index}
                data-media-option={index}
                data-pressable={pressable ? '' : undefined}
                style={{
                    width: 96,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    fontSize: 24,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                }}
                onClick={pressable ? (): void => this.pressEntity(entity) : undefined}
            >
                {empty ? null : entity.icon !== '' ? (
                    <Icon
                        glyph={entity.icon}
                        size={40}
                        color={color}
                    />
                ) : (
                    text
                )}
            </div>
        );
    }

    private renderLogo(): React.JSX.Element | null {
        const { logo } = this.props.model;
        if (isEmptyEntity(logo) || logo.icon === '') {
            return null;
        }
        const pressable = entityPressEvent(logo) !== undefined;
        return (
            <div
                data-media-logo=""
                data-pressable={pressable ? '' : undefined}
                style={{
                    position: 'absolute',
                    left: 10,
                    top: 78,
                    width: 64,
                    height: 64,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={pressable ? (): void => this.pressEntity(logo) : undefined}
            >
                <Icon
                    glyph={logo.icon}
                    size={58}
                    color={color565ToCss(logo.iconColor)}
                />
            </div>
        );
    }

    private renderTextRow(text: string, color: number, top: number): React.JSX.Element {
        return (
            <div
                style={{
                    position: 'absolute',
                    left: 84,
                    right: 6,
                    top,
                    height: 28,
                    lineHeight: '28px',
                    textAlign: 'center',
                    fontSize: 21,
                    color: color565ToCss(color),
                    whiteSpace: 'pre',
                    overflow: 'hidden',
                }}
            >
                {text}
            </div>
        );
    }

    private renderVolume(): React.JSX.Element | null {
        const { model, press } = this.props;
        if (model.volume === undefined) {
            return null;
        }
        const volume = model.volume;
        const set = (value: number): void => press(model.id, 'volumeSlider', Math.max(0, Math.min(100, value)));
        return (
            <div
                data-media-volume=""
                style={{
                    position: 'absolute',
                    left: 8,
                    right: 8,
                    top: 226,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <Icon
                    name="volume-minus"
                    size={36}
                    color={theme.foreground}
                    onClick={(): void => set(volume - VOLUME_STEP)}
                    style={{ cursor: 'pointer' }}
                />
                <VolumeSlider
                    value={volume}
                    onChange={set}
                />
                <Icon
                    name="volume-plus"
                    size={36}
                    color={theme.foreground}
                    onClick={(): void => set(volume + VOLUME_STEP)}
                    style={{ cursor: 'pointer' }}
                />
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const white = theme.foreground;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: white }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                />
                {this.renderLogo()}
                {this.renderTextRow(model.name, model.nameColor, 82)}
                {this.renderTextRow(model.artist, model.artistColor, 116)}
                <div
                    data-media-controls=""
                    style={{
                        position: 'absolute',
                        left: 8,
                        right: 8,
                        top: 156,
                        height: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {this.renderControl(model.shuffleIcon, undefined, white, 'media-shuffle', 40)}
                    {this.renderControl(undefined, 'skip-previous', white, 'media-back', 40)}
                    {this.renderControl(model.playPauseIcon, undefined, white, 'media-pause', 46)}
                    {this.renderControl(undefined, 'skip-next', white, 'media-next', 40)}
                    {model.onOffColor === undefined
                        ? this.renderControl(undefined, undefined, white, undefined, 40)
                        : this.renderControl(
                              undefined,
                              'power-standby',
                              color565ToCss(model.onOffColor),
                              'media-OnOff',
                              40,
                          )}
                </div>
                {this.renderVolume()}
                <div
                    data-media-options=""
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 278,
                        height: 48,
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    {model.options.map((entity, i) => this.renderOption(entity, i))}
                </div>
            </div>
        );
    }
}
