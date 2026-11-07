import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { isEmptyEntity } from '../../protocol/split';
import type { Entity6, PanelModel } from '../../protocol/types';
import { isPortrait, stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { Pressable } from '../cardEntities/shared/Pressable';
import { entityPressProps } from './entityPress';
import { mediaOptionCount, type CardMediaModel } from './parse';

/** step of the volume buttons left and right of the slider */
const VOLUME_STEP = 5;

/** height of a text row (name, artist) */
const TEXT_ROW_HEIGHT = 28;
/** height of the row of transport buttons */
const CONTROLS_HEIGHT = 56;
/** height of the volume row */
const VOLUME_HEIGHT = 36;

/** geometry of cardMedia in stage pixels */
export interface MediaGeometry {
    /** the logo: box and glyph size; `left` undefined = centred */
    logo: { left: number | undefined; top: number; box: number; iconSize: number };
    /** the two text rows (css left/right) */
    text: { left: number; right: number; nameTop: number; artistTop: number };
    controlsTop: number;
    volumeTop: number;
    /** the option buttons: one cell per option, row by row */
    options: {
        columns: number;
        width: number;
        height: number;
        top: number;
        rowPitch: number;
        gap: number;
        /** font size of a text option (an option without icon shows its value or name) */
        fontSize: number;
    };
}

/**
 * The layout of cardMedia per model. Landscape like the HMI (eu: logo at the upper left, name and
 * artist next to it at y 82 / 116, controls at y 156, volume at y 226, five options of 96 px at
 * y 278); `web-l` stretches the rows to 640 px and shows six options of 106 px. Portrait (us-p,
 * web-p): logo, name/artist, controls, volume and the option rows (web-p two rows of four of
 * 80 px, us-p one row of five) below each other, spread with equal gaps over the height below
 * the title bar.
 *
 * @param model the panel model the card sees
 */
export function mediaGeometry(model: PanelModel): MediaGeometry {
    const { width, height } = stageSize(model);
    const count = mediaOptionCount(model);
    if (isPortrait(model)) {
        const tall = height >= 640;
        const columns = count <= 5 ? count : 4;
        const rows = Math.ceil(count / columns);
        const logo = tall ? { box: 100, iconSize: 90 } : { box: 64, iconSize: 58 };
        /** name and artist: two rows of 28 px */
        const textPitch = tall ? 36 : 32;
        const optionHeight = tall ? 64 : 56;
        // the blocks from top to bottom; the free height below the title bar is split into equal
        // gaps between them and above / below them
        const blocks = [logo.box, textPitch + TEXT_ROW_HEIGHT, CONTROLS_HEIGHT, VOLUME_HEIGHT];
        for (let r = 0; r < rows; r++) {
            blocks.push(optionHeight);
        }
        const used = blocks.reduce((sum, h) => sum + h, 0);
        const gap = Math.floor((height - theme.titleBarHeight - used) / (blocks.length + 1));
        const tops: number[] = [];
        let y = theme.titleBarHeight + gap;
        for (const h of blocks) {
            tops.push(y);
            y += h + gap;
        }
        return {
            logo: { left: undefined, top: tops[0], ...logo },
            text: { left: 6, right: 6, nameTop: tops[1], artistTop: tops[1] + textPitch },
            controlsTop: tops[2],
            volumeTop: tops[3],
            options: {
                columns,
                width: Math.floor(width / columns),
                height: optionHeight,
                top: tops[4],
                rowPitch: optionHeight + gap,
                gap: 0,
                // 80 px cells: "22:15" has to fit
                fontSize: 20,
            },
        };
    }
    const optionWidth = count > 5 ? 106 : 96;
    return {
        logo: { left: 10, top: 78, box: 64, iconSize: 58 },
        text: { left: 84, right: 6, nameTop: 82, artistTop: 116 },
        controlsTop: 156,
        volumeTop: 226,
        options: {
            columns: count,
            width: optionWidth,
            height: 48,
            top: 278,
            rowPitch: 48,
            gap: count > 1 ? (width - count * optionWidth) / (count - 1) : 0,
            fontSize: 24,
        },
    };
}

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

/**
 * The media card: logo, two text rows, transport buttons, volume slider and the option buttons
 * (5, web-l 6, web-p 8), laid out per model by {@link mediaGeometry}
 */
export class CardMedia extends React.Component<CardProps<CardMediaModel>> {
    private get geometry(): MediaGeometry {
        return mediaGeometry(this.props.global.model);
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
        const handlers = empty ? undefined : entityPressProps('cardMedia', entity, this.props);
        const color = color565ToCss(entity.iconColor);
        const text = entity.icon === '' ? entity.optionalValue || entity.displayName : '';
        const g = this.geometry.options;
        const col = index % g.columns;
        const row = Math.floor(index / g.columns);
        return (
            <Pressable
                key={index}
                data-role="media-option"
                data-id={String(index)}
                {...handlers}
                style={{
                    position: 'absolute',
                    left: Math.round(col * (g.width + g.gap)),
                    top: row * g.rowPitch,
                    width: g.width,
                    height: g.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color,
                    fontSize: g.fontSize,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                }}
            >
                {empty ? null : entity.icon !== '' ? (
                    <Icon
                        glyph={entity.icon}
                        size={40}
                        color={color}
                    />
                ) : (
                    // a text never leaves the cell: cut with an ellipsis
                    <span
                        data-option-text=""
                        style={{
                            maxWidth: '100%',
                            padding: '0 2px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {text}
                    </span>
                )}
            </Pressable>
        );
    }

    private renderLogo(): React.JSX.Element | null {
        const { logo } = this.props.model;
        if (isEmptyEntity(logo) || logo.icon === '') {
            return null;
        }
        const handlers = entityPressProps('cardMedia', logo, this.props);
        const g = this.geometry.logo;
        const left = g.left ?? Math.round((stageSize(this.props.global.model).width - g.box) / 2);
        return (
            <Pressable
                data-role="media-logo"
                {...handlers}
                style={{
                    position: 'absolute',
                    left,
                    top: g.top,
                    width: g.box,
                    height: g.box,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Icon
                    glyph={logo.icon}
                    size={g.iconSize}
                    color={color565ToCss(logo.iconColor)}
                />
            </Pressable>
        );
    }

    private renderTextRow(text: string, color: number, top: number): React.JSX.Element {
        const g = this.geometry.text;
        return (
            <div
                style={{
                    position: 'absolute',
                    left: g.left,
                    right: g.right,
                    top,
                    height: TEXT_ROW_HEIGHT,
                    lineHeight: `${TEXT_ROW_HEIGHT}px`,
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
                    top: this.geometry.volumeTop,
                    height: VOLUME_HEIGHT,
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
        const { model, ctx, press, global } = this.props;
        const white = theme.foreground;
        const g = this.geometry;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: white }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                    model={global.model}
                />
                {this.renderLogo()}
                {this.renderTextRow(model.name, model.nameColor, g.text.nameTop)}
                {this.renderTextRow(model.artist, model.artistColor, g.text.artistTop)}
                <div
                    data-media-controls=""
                    style={{
                        position: 'absolute',
                        left: 8,
                        right: 8,
                        top: g.controlsTop,
                        height: CONTROLS_HEIGHT,
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
                        top: g.options.top,
                        height: g.options.height,
                    }}
                >
                    {model.options
                        .slice(0, mediaOptionCount(global.model))
                        .map((entity, i) => this.renderOption(entity, i))}
                </div>
            </div>
        );
    }
}
