import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import {
    isBlankEntity,
    splitAreas,
    splitRuns,
    splitTime,
    type ScreensaverAreas,
    type ScreensaverLayout,
    type ScreensaverModel,
    type StatusIcon,
} from './parse';

/** Two taps closer than this count as a double tap (`bExit,2`) */
const DOUBLE_TAP_MS = 600;
/** Pointer movement from this distance on is a swipe, not a tap */
const SWIPE_MIN_PX = 50;

/** Column of the bottom area: `left` and `width` in stage pixels */
interface Column {
    left: number;
    width: number;
}

interface BottomStyle {
    labelTop: number;
    labelSize: number;
    iconTop: number;
    iconSize: number;
    valueTop: number;
    valueSize: number;
}

interface PointerStart {
    x: number;
    y: number;
}

/**
 * The screensaver: time, date, the weather/entity areas of the four layouts, the two MR
 * icons and a notification. A tap sends `event,buttonPress2,screensaver,bExit,<taps>`,
 * a swipe `…,screensaver,swipe<Up|Down|Left|Right>`, an indicator (advanced layout)
 * `event,buttonPress2,<id>,button`.
 */
export class Screensaver extends React.Component<CardProps<ScreensaverModel>> {
    private lastTapAt = 0;
    private tapCount = 0;
    private pointerStart: PointerStart | undefined;

    /** css colour of a `color~` field, the text colour of `dimmode` when the field is missing */
    private color(value: number | undefined): string {
        return color565ToCss(value ?? this.props.global.dim.text);
    }

    private readonly onPointerDown = (e: React.PointerEvent): void => {
        this.pointerStart = { x: e.clientX, y: e.clientY };
    };

    private readonly onPointerUp = (e: React.PointerEvent): void => {
        const start = this.pointerStart;
        this.pointerStart = undefined;
        if (!start) {
            return;
        }
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.hypot(dx, dy) >= SWIPE_MIN_PX) {
            const action =
                Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'swipeRight' : 'swipeLeft') : dy > 0 ? 'swipeDown' : 'swipeUp';
            this.props.press('screensaver', action);
            return;
        }
        const now = Date.now();
        this.tapCount = now - this.lastTapAt < DOUBLE_TAP_MS ? this.tapCount + 1 : 1;
        this.lastTapAt = now;
        this.props.press('screensaver', 'bExit', this.tapCount);
    };

    private readonly onPointerCancel = (): void => {
        this.pointerStart = undefined;
    };

    private renderIcon(entity: Entity6, size: number, style?: React.CSSProperties): React.JSX.Element | null {
        if (entity.icon === '') {
            return null;
        }
        return (
            <Icon
                glyph={entity.icon}
                size={size}
                color={color565ToCss(entity.iconColor)}
                style={style}
            />
        );
    }

    private renderText(
        text: string,
        style: React.CSSProperties,
        key?: string,
        dataRole?: string,
    ): React.JSX.Element | null {
        if (text === '') {
            return null;
        }
        return (
            <div
                key={key}
                data-role={dataRole}
                style={{
                    position: 'absolute',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    ...style,
                }}
            >
                {text}
            </div>
        );
    }

    /**
     * Time (with the icon of `time~HH:MM~icon` left of it and an AM/PM suffix in the
     * `timeAMPM` colour).
     *
     * @param box position of the row
     * @param box.top top edge
     * @param box.left left edge
     * @param box.width width of the row
     * @param box.height height of the row
     * @param box.align whether the row is centred or right aligned
     * @param fontSize font size of the time
     */
    private renderTime(
        box: { top: number; left: number; width: number; height: number; align: 'center' | 'right' },
        fontSize: number,
    ): React.JSX.Element {
        const { global, model } = this.props;
        const colors = model.colors;
        const { time, ampm } = splitTime(global.time);
        const iconSize = Math.round(fontSize * 0.36);
        return (
            <div
                data-role="time"
                style={{
                    position: 'absolute',
                    top: box.top,
                    left: box.left,
                    width: box.width,
                    height: box.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: box.align === 'center' ? 'center' : 'flex-end',
                    gap: Math.round(fontSize * 0.12),
                    whiteSpace: 'nowrap',
                }}
            >
                {global.timeIcon !== '' ? (
                    <Icon
                        glyph={global.timeIcon}
                        size={iconSize}
                        color={this.color(colors?.timeAdd)}
                        style={{ marginRight: Math.round(fontSize * 0.08) }}
                    />
                ) : null}
                <span style={{ fontSize, lineHeight: 1, color: this.color(colors?.time) }}>{time}</span>
                {ampm !== '' ? (
                    <span
                        style={{
                            fontSize: Math.round(fontSize * 0.3),
                            lineHeight: 1,
                            alignSelf: 'flex-end',
                            paddingBottom: Math.round(fontSize * 0.08),
                            color: this.color(colors?.timeAmPm),
                        }}
                    >
                        {ampm}
                    </span>
                ) : null}
            </div>
        );
    }

    private renderDate(style: React.CSSProperties): React.JSX.Element | null {
        return this.renderText(
            this.props.global.date,
            { color: this.color(this.props.model.colors?.date), ...style },
            undefined,
            'date',
        );
    }

    private renderBar(top: number, left: number, width: number): React.JSX.Element {
        return (
            <div
                data-role="bar"
                style={{
                    position: 'absolute',
                    top,
                    left,
                    width,
                    height: 2,
                    background: this.color(this.props.model.colors?.bar),
                }}
            />
        );
    }

    /** One MR icon of `statusUpdate` - a glyph, possibly followed by text */
    private renderStatusIcon(status: StatusIcon, box: React.CSSProperties, key: string): React.JSX.Element | null {
        if (status.icon === '') {
            return null;
        }
        const size = status.big ? 40 : 28;
        const color = color565ToCss(status.color);
        return (
            <div
                key={key}
                data-role={key}
                style={{
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    whiteSpace: 'nowrap',
                    color,
                    fontSize: Math.round(size * 0.8),
                    lineHeight: 1,
                    ...box,
                }}
            >
                {splitRuns(status.icon).map((run, i) =>
                    run.kind === 'icon' ? (
                        <Icon
                            key={i}
                            glyph={run.glyph}
                            size={size}
                            color={color}
                        />
                    ) : (
                        <span key={i}>{run.text}</span>
                    ),
                )}
            </div>
        );
    }

    /** The bottom area: label, icon and value per column */
    private renderBottom(entities: Entity6[], columns: Column[], style: BottomStyle): React.JSX.Element[] {
        const colors = this.props.model.colors;
        const result: React.JSX.Element[] = [];
        entities.forEach((entity, i) => {
            const column = columns[i];
            if (!column || isBlankEntity(entity)) {
                return;
            }
            const centered: React.CSSProperties = {
                left: column.left,
                width: column.width,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            };
            result.push(
                <div
                    key={i}
                    data-role={`bottom${i + 1}`}
                >
                    {this.renderText(entity.displayName, {
                        ...centered,
                        top: style.labelTop,
                        fontSize: style.labelSize,
                        color: this.color(colors?.forecast[i] ?? colors?.forecast[0]),
                    })}
                    {this.renderIcon(entity, style.iconSize, {
                        position: 'absolute',
                        top: style.iconTop,
                        left: column.left + Math.round((column.width - style.iconSize) / 2),
                    })}
                    {this.renderText(entity.optionalValue, {
                        ...centered,
                        top: style.valueTop,
                        fontSize: style.valueSize,
                        color: this.color(colors?.forecastVal[i] ?? colors?.forecastVal[0]),
                    })}
                </div>,
            );
        });
        return result;
    }

    /** Heading and text of `notify~…` drawn over the lower part of the page */
    private renderNotify(top: number, height: number): React.JSX.Element | null {
        const { notify, colors } = this.props.model;
        if (!notify) {
            return null;
        }
        return (
            <div
                data-role="notify"
                style={{
                    position: 'absolute',
                    top,
                    left: 0,
                    width: 480,
                    height,
                    background: this.background(),
                    color: this.color(colors?.mainText),
                    boxSizing: 'border-box',
                    padding: '6px 4px 0 4px',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        fontSize: 34,
                        lineHeight: '40px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {notify.heading}
                </div>
                <div style={{ fontSize: 20, lineHeight: '26px', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                    {notify.text}
                </div>
            </div>
        );
    }

    private background(): string {
        const bg = this.props.model.colors?.background ?? this.props.global.dim.background;
        return color565ToCss(bg, theme.background);
    }

    private renderStandard(areas: ScreensaverAreas): React.JSX.Element {
        const { model } = this.props;
        const colors = model.colors;
        const columns: Column[] = [0, 1, 2, 3].map(i => ({ left: 135 + i * 86, width: 86 }));
        return (
            <>
                {this.renderStatusIcon(model.status[0], { top: 8, left: 10, height: 32 }, 'mrIcon1')}
                {this.renderStatusIcon(model.status[1], { top: 8, right: 10, height: 32 }, 'mrIcon2')}
                {this.renderTime({ top: 30, left: 0, width: 480, height: 110, align: 'center' }, 104)}
                {this.renderDate({ top: 164, left: 0, width: 480, textAlign: 'center', fontSize: 28 })}
                {this.renderBar(201, 50, 380)}
                {areas.favorit && !isBlankEntity(areas.favorit) ? (
                    <div data-role="favorit">
                        {this.renderIcon(areas.favorit, 56, { position: 'absolute', top: 213, left: 37 })}
                        {this.renderText(areas.favorit.optionalValue, {
                            top: 278,
                            left: 12,
                            width: 120,
                            fontSize: 34,
                            color: this.color(colors?.mainText),
                        })}
                    </div>
                ) : null}
                {this.renderBottom(areas.bottom, columns, {
                    labelTop: 215,
                    labelSize: 20,
                    iconTop: 245,
                    iconSize: 32,
                    valueTop: 284,
                    valueSize: 20,
                })}
                {this.renderNotify(200, 120)}
            </>
        );
    }

    private renderAlternate(areas: ScreensaverAreas): React.JSX.Element {
        const { model } = this.props;
        const colors = model.colors;
        const columns: Column[] = [0, 1, 2].map(i => ({ left: 215 + i * 88, width: 88 }));
        return (
            <>
                {this.renderStatusIcon(model.status[0], { top: 8, left: 10, height: 32 }, 'mrIcon1')}
                {this.renderStatusIcon(model.status[1], { top: 8, right: 10, height: 32 }, 'mrIcon2')}
                {this.renderTime({ top: 30, left: 0, width: 480, height: 110, align: 'center' }, 104)}
                {this.renderDate({ top: 166, left: 0, width: 480, textAlign: 'center', fontSize: 26 })}
                {this.renderBar(201, 48, 378)}
                {areas.favorit && !isBlankEntity(areas.favorit) ? (
                    <div data-role="favorit">
                        {this.renderIcon(areas.favorit, 44, { position: 'absolute', top: 218, left: 23 })}
                        {this.renderText(areas.favorit.optionalValue, {
                            top: 224,
                            left: 80,
                            width: 132,
                            textAlign: 'right',
                            fontSize: 32,
                            color: this.color(colors?.mainText),
                        })}
                    </div>
                ) : null}
                {areas.alternate && !isBlankEntity(areas.alternate) ? (
                    <div data-role="alternate">
                        {this.renderIcon(areas.alternate, 34, { position: 'absolute', top: 275, left: 28 })}
                        {this.renderText(areas.alternate.optionalValue, {
                            top: 275,
                            left: 80,
                            width: 132,
                            textAlign: 'right',
                            fontSize: 34,
                            color: this.color(colors?.mainTextAlt2),
                        })}
                    </div>
                ) : null}
                {this.renderBottom(areas.bottom, columns, {
                    labelTop: 216,
                    labelSize: 20,
                    iconTop: 246,
                    iconSize: 32,
                    valueTop: 285,
                    valueSize: 20,
                })}
                {this.renderNotify(200, 120)}
            </>
        );
    }

    private renderAdvanced(areas: ScreensaverAreas): React.JSX.Element {
        const { model, press } = this.props;
        const colors = model.colors;
        const columns: Column[] = [0, 1, 2, 3, 4, 5].map(i => ({ left: i * 80, width: 80 }));
        return (
            <>
                {this.renderTime({ top: 12, left: 180, width: 282, height: 64, align: 'right' }, 58)}
                {this.renderDate({ top: 80, left: 180, width: 282, textAlign: 'right', fontSize: 20 })}
                {areas.favorit && !isBlankEntity(areas.favorit) ? (
                    <div data-role="favorit">
                        {this.renderIcon(areas.favorit, 56, { position: 'absolute', top: 19, left: 22 })}
                        {this.renderText(areas.favorit.optionalValue, {
                            top: 54,
                            left: 95,
                            width: 90,
                            fontSize: 24,
                            color: this.color(colors?.mainText),
                        })}
                    </div>
                ) : null}
                {areas.left.map((entity, i) =>
                    isBlankEntity(entity) ? null : (
                        <div
                            key={i}
                            data-role={`left${i + 1}`}
                        >
                            {this.renderIcon(entity, 24, { position: 'absolute', top: 88 + i * 33, left: 12 })}
                            {this.renderText(entity.optionalValue, {
                                top: 90 + i * 33,
                                left: 48,
                                width: 130,
                                fontSize: 20,
                                color: this.color(colors?.mainText),
                            })}
                        </div>
                    ),
                )}
                {areas.indicator.map((entity, i) =>
                    isBlankEntity(entity) ? null : (
                        <div
                            key={i}
                            data-role={`indicator${i + 1}`}
                            onPointerUp={(e): void => {
                                e.stopPropagation();
                                this.pointerStart = undefined;
                                if (entity.id !== '') {
                                    press(entity.id, 'button');
                                }
                            }}
                            style={{
                                position: 'absolute',
                                top: 126,
                                left: 176 + i * 58,
                                width: 58,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: entity.id !== '' ? 'pointer' : 'default',
                            }}
                        >
                            {this.renderIcon(entity, 40)}
                        </div>
                    ),
                )}
                {this.renderBottom(areas.bottom, columns, {
                    labelTop: 196,
                    labelSize: 18,
                    iconTop: 224,
                    iconSize: 28,
                    valueTop: 258,
                    valueSize: 18,
                })}
                {this.renderStatusIcon(
                    model.status[0],
                    { top: 282, left: 0, width: 240, height: 36, justifyContent: 'center' },
                    'mrIcon1',
                )}
                {this.renderStatusIcon(
                    model.status[1],
                    { top: 282, left: 240, width: 240, height: 36, justifyContent: 'center' },
                    'mrIcon2',
                )}
                {this.renderNotify(184, 96)}
            </>
        );
    }

    private renderEasyview(areas: ScreensaverAreas): React.JSX.Element {
        const count = Math.max(1, areas.bottom.length);
        const width = Math.floor(480 / count);
        const columns: Column[] = areas.bottom.map((_, i) => ({ left: i * width, width }));
        return (
            <>
                {this.renderTime({ top: 10, left: 0, width: 480, height: 108, align: 'center' }, 100)}
                {this.renderDate({ top: 120, left: 0, width: 480, textAlign: 'center', fontSize: 30 })}
                {this.renderBar(163, 48, 378)}
                {this.renderBottom(areas.bottom, columns, {
                    labelTop: 176,
                    labelSize: 22,
                    iconTop: 206,
                    iconSize: 56,
                    valueTop: 270,
                    valueSize: 36,
                })}
                {this.renderNotify(166, 154)}
            </>
        );
    }

    private renderLayout(areas: ScreensaverAreas): React.JSX.Element {
        const layout: ScreensaverLayout = areas.layout;
        switch (layout) {
            case 'alternate':
                return this.renderAlternate(areas);
            case 'advanced':
                return this.renderAdvanced(areas);
            case 'easyview':
                return this.renderEasyview(areas);
            default:
                return this.renderStandard(areas);
        }
    }

    render(): React.JSX.Element {
        const { model, ctx, global } = this.props;
        const areas = splitAreas(ctx.pageType, model.entities, global.model);
        return (
            <div
                data-page={ctx.pageType}
                data-layout={areas.layout}
                onPointerDown={this.onPointerDown}
                onPointerUp={this.onPointerUp}
                onPointerCancel={this.onPointerCancel}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: this.background(),
                    color: this.color(undefined),
                    fontFamily: theme.fontFamily,
                    overflow: 'hidden',
                    cursor: 'pointer',
                }}
            >
                {this.renderLayout(areas)}
            </div>
        );
    }
}
