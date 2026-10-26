import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { indicatorTapTarget, nextTap, swipeAction, type TapState } from './interaction';
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

/**
 * Distance from the top of a text box (`lineHeight: 1`) to the top of its capital letters,
 * as a fraction of the font size. Used to place text by the cap top measured on the HMI.
 */
const CAP_TOP = 0.13;

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

/** Position of the heading and the text of a notification */
interface NotifyStyle {
    /** cap top of the heading */
    headingTop: number;
    headingSize: number;
    /** cap top of the first text line */
    textTop: number;
    textSize: number;
    lineHeight: number;
    lines: number;
    /** `undefined` = transparent (the notification replaces the row), otherwise drawn over the page */
    cover?: { top: number; height: number };
}

interface PointerStart {
    x: number;
    y: number;
}

/** Top of a text box whose capital letters start at `capTop` */
function textTop(capTop: number, fontSize: number): number {
    return Math.round(capTop - fontSize * CAP_TOP);
}

/**
 * The screensaver: time, date, the weather/entity areas of the four layouts, the two MR
 * icons and a notification. A tap sends `event,buttonPress2,screensaver,bExit,<taps>`,
 * a swipe `…,screensaver,swipe<Up|Down|Left|Right>`, an indicator (advanced layout)
 * `event,buttonPress2,<id>,button` - the latter only while the display is awake
 * (`global.awake`, see `interaction.ts`); in the dimmed screensaver every tap is the
 * wake-up tap and counts as a screensaver press. Waking and re-dimming is the store's job.
 *
 * Positions and sizes are measured on the pictures of the Nextion emulator
 * (`doc/web-panel/MISSING_PICTURES.md`).
 */
export class Screensaver extends React.Component<CardProps<ScreensaverModel>> {
    private tap: TapState = { tapCount: 0 };
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
        const action = swipeAction(e.clientX - start.x, e.clientY - start.y);
        if (action) {
            this.props.press('screensaver', action);
            return;
        }
        this.screensaverTap();
    };

    /** a tap on the screensaver itself: `bExit,<taps>`, counted since the screensaver was shown */
    private screensaverTap(): void {
        this.tap = nextTap(this.tap);
        this.props.press('screensaver', 'bExit', this.tap.tapCount);
    }

    /**
     * A tap on an indicator icon sends the indicator press, dimmed or awake (the real display
     * does the same); the wake-up happens in the store with the press.
     *
     * @param entityId id of the indicator entity (empty when none)
     */
    private indicatorTap(entityId: string): void {
        if (indicatorTapTarget(entityId) === 'indicator') {
            this.props.press(entityId, 'button');
        }
    }

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
     * The time with an AM/PM suffix in the `timeAMPM` colour. The icon of
     * `time~HH:MM~icon` is drawn separately (`renderTimeIcon`), it does not move the time.
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

    /**
     * The info icon of `time~HH:MM~icon` (colour `tTimeAdd`): below the time in the
     * standard and alternate layout, above it in the advanced layout and left of it in
     * EasyView.
     *
     * @param top top edge of the icon box
     * @param left left edge of the icon box
     * @param size size of the icon box
     */
    private renderTimeIcon(top: number, left: number, size: number): React.JSX.Element | null {
        const { global, model } = this.props;
        if (global.timeIcon === '') {
            return null;
        }
        return (
            <Icon
                glyph={global.timeIcon}
                size={size}
                color={this.color(model.colors?.timeAdd)}
                style={{ position: 'absolute', top, left }}
            />
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

    /** The two MR icons in the top corners (standard and alternate layout) */
    private renderTopStatusIcons(): React.JSX.Element[] {
        const { status } = this.props.model;
        const result: React.JSX.Element[] = [];
        const left = this.renderStatusIcon(status[0], { top: 4, left: 14, height: 28 }, 'mrIcon1');
        const right = this.renderStatusIcon(status[1], { top: 4, right: 15, height: 28 }, 'mrIcon2');
        if (left) {
            result.push(left);
        }
        if (right) {
            result.push(right);
        }
        return result;
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
                        top: textTop(style.labelTop, style.labelSize),
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
                        top: textTop(style.valueTop, style.valueSize),
                        fontSize: style.valueSize,
                        color: this.color(colors?.forecastVal[i] ?? colors?.forecastVal[0]),
                    })}
                </div>,
            );
        });
        return result;
    }

    /**
     * Heading and text of `notify~…`: the heading centred, the text left aligned with the
     * line breaks of the payload (the HMI shows `lines` lines).
     *
     * @param style position of heading and text
     */
    private renderNotify(style: NotifyStyle): React.JSX.Element | null {
        const { notify, colors } = this.props.model;
        if (!notify) {
            return null;
        }
        const cover: React.CSSProperties = style.cover
            ? {
                  top: style.cover.top,
                  height: style.cover.height,
                  background: this.background(),
              }
            : { top: 0, height: 320, pointerEvents: 'none' };
        return (
            <div
                data-role="notify"
                style={{
                    position: 'absolute',
                    left: 0,
                    width: 480,
                    color: this.color(colors?.mainText),
                    overflow: 'hidden',
                    ...cover,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: textTop(style.headingTop, style.headingSize) - (style.cover?.top ?? 0),
                        left: 8,
                        width: 464,
                        fontSize: style.headingSize,
                        lineHeight: 1,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {notify.heading}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        top:
                            textTop(style.textTop, style.textSize) -
                            Math.round((style.lineHeight - style.textSize) / 2) -
                            (style.cover?.top ?? 0),
                        left: 88,
                        width: 304,
                        height: style.lines * style.lineHeight,
                        fontSize: style.textSize,
                        lineHeight: `${style.lineHeight}px`,
                        overflowWrap: 'anywhere',
                        whiteSpace: 'pre-wrap',
                        overflow: 'hidden',
                    }}
                >
                    {notify.text}
                </div>
            </div>
        );
    }

    private background(): string {
        const bg = this.props.model.colors?.background ?? this.props.global.dim.background;
        return color565ToCss(bg, theme.background);
    }

    /** Favorit as in the standard layout: big icon, the value below */
    private renderFavoritStacked(favorit: Entity6 | undefined): React.JSX.Element | null {
        if (!favorit || isBlankEntity(favorit)) {
            return null;
        }
        return (
            <div data-role="favorit">
                {this.renderIcon(favorit, 64, { position: 'absolute', top: 208, left: 42 })}
                {this.renderText(favorit.optionalValue, {
                    top: textTop(282, 35),
                    left: 26,
                    width: 108,
                    fontSize: 35,
                    color: this.color(this.props.model.colors?.mainText),
                })}
            </div>
        );
    }

    /**
     * Time, date and bar shared by the standard and alternate layout. The notification
     * replaces everything below the bar.
     *
     * @param areas the entities of the page
     * @param columns the bottom columns of the layout
     * @param favorit the favorit area (standard: icon above value; alternate: icon and value in a row)
     */
    private renderStandardLike(
        areas: ScreensaverAreas,
        columns: Column[],
        favorit: React.JSX.Element | null,
    ): React.JSX.Element {
        const { model } = this.props;
        return (
            <>
                {this.renderTopStatusIcons()}
                {this.renderTime({ top: 32, left: 0, width: 480, height: 110, align: 'center' }, 116)}
                {this.renderTimeIcon(138, 226, 28)}
                {this.renderDate({ top: textTop(172, 29), left: 0, width: 480, textAlign: 'center', fontSize: 29 })}
                {this.renderBar(201, 60, 360)}
                {model.notify ? (
                    this.renderNotify({
                        headingTop: 216,
                        headingSize: 38,
                        textTop: 270,
                        textSize: 17,
                        lineHeight: 24,
                        lines: 2,
                    })
                ) : (
                    <>
                        {favorit}
                        {this.renderBottom(areas.bottom, columns, {
                            labelTop: 221,
                            labelSize: 18,
                            iconTop: 248,
                            iconSize: 30,
                            valueTop: 289,
                            valueSize: 18,
                        })}
                    </>
                )}
            </>
        );
    }

    private renderStandard(areas: ScreensaverAreas): React.JSX.Element {
        const columns: Column[] = [0, 1, 2, 3].map(i => ({ left: 137 + i * 82, width: 82 }));
        return this.renderStandardLike(areas, columns, this.renderFavoritStacked(areas.favorit));
    }

    /**
     * Alternate layout. Without an alternate entity the page looks like the standard layout
     * with three bottom columns. With one, the favorit moves into one row (icon left, value
     * right of it), the alternate entity takes the row below and the three bottom columns
     * sit in the columns 2-4 of the standard layout (wiki: screensaverAlt.png).
     *
     * @param areas the entities of the page
     */
    private renderAlternate(areas: ScreensaverAreas): React.JSX.Element {
        const colors = this.props.model.colors;
        const alternate = areas.alternate && !isBlankEntity(areas.alternate) ? areas.alternate : undefined;
        if (!alternate) {
            const columns: Column[] = [0, 1, 2].map(i => ({ left: 137 + i * 82, width: 82 }));
            return this.renderStandardLike(areas, columns, this.renderFavoritStacked(areas.favorit));
        }
        const columns: Column[] = [1, 2, 3].map(i => ({ left: 137 + i * 82, width: 82 }));
        const favorit =
            areas.favorit && !isBlankEntity(areas.favorit) ? (
                <div data-role="favorit">
                    {this.renderIcon(areas.favorit, 44, { position: 'absolute', top: 236, left: 23 })}
                    {this.renderText(areas.favorit.optionalValue, {
                        top: textTop(233, 34),
                        left: 76,
                        width: 134,
                        textAlign: 'right',
                        fontSize: 34,
                        color: this.color(colors?.mainText),
                    })}
                </div>
            ) : null;
        return this.renderStandardLike(
            areas,
            columns,
            <>
                {favorit}
                <div data-role="alternate">
                    {this.renderIcon(alternate, 34, { position: 'absolute', top: 288, left: 28 })}
                    {this.renderText(alternate.optionalValue, {
                        top: textTop(286, 35),
                        left: 76,
                        width: 134,
                        textAlign: 'right',
                        fontSize: 35,
                        color: this.color(colors?.mainTextAlt2),
                    })}
                </div>
            </>,
        );
    }

    private renderAdvanced(areas: ScreensaverAreas): React.JSX.Element {
        const { model } = this.props;
        const colors = model.colors;
        const columns: Column[] = [0, 1, 2, 3, 4, 5].map(i => ({ left: 16 + i * 75, width: 75 }));
        return (
            <>
                {this.renderTime({ top: 13, left: 180, width: 279, height: 64, align: 'right' }, 57)}
                {this.renderTimeIcon(19, 226, 28)}
                {this.renderDate({ top: textTop(85, 16), left: 180, width: 271, textAlign: 'right', fontSize: 16 })}
                {areas.favorit && !isBlankEntity(areas.favorit) ? (
                    <div data-role="favorit">
                        {this.renderIcon(areas.favorit, 64, { position: 'absolute', top: 15, left: 30 })}
                        {this.renderText(areas.favorit.optionalValue, {
                            top: textTop(58, 25),
                            left: 108,
                            width: 72,
                            fontSize: 25,
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
                            {this.renderIcon(entity, 28, { position: 'absolute', top: 89 + i * 33, left: 28 })}
                            {this.renderText(entity.optionalValue, {
                                top: textTop(94 + i * 33, 17),
                                left: 66,
                                width: 114,
                                fontSize: 17,
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
                                this.indicatorTap(entity.id);
                            }}
                            style={{
                                position: 'absolute',
                                top: 128,
                                left: 178 + i * 56,
                                width: 56,
                                height: 48,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: entity.id !== '' ? 'pointer' : 'default',
                            }}
                        >
                            {this.renderIcon(entity, 44)}
                        </div>
                    ),
                )}
                {this.renderBottom(areas.bottom, columns, {
                    labelTop: 200,
                    labelSize: 18,
                    iconTop: 225,
                    iconSize: 28,
                    valueTop: 256,
                    valueSize: 18,
                })}
                {this.renderStatusIcon(
                    model.status[0],
                    { top: 284, left: 6, width: 240, height: 28, justifyContent: 'center' },
                    'mrIcon1',
                )}
                {this.renderStatusIcon(
                    model.status[1],
                    { top: 284, left: 232, width: 240, height: 28, justifyContent: 'center' },
                    'mrIcon2',
                )}
                {this.renderNotify({
                    headingTop: 200,
                    headingSize: 30,
                    textTop: 246,
                    textSize: 17,
                    lineHeight: 24,
                    lines: 3,
                    cover: { top: 184, height: 136 },
                })}
            </>
        );
    }

    private renderEasyview(areas: ScreensaverAreas): React.JSX.Element {
        const { model } = this.props;
        const count = Math.max(1, areas.bottom.length);
        // the three columns of the eu panel sit at 95, 240 and 385 - narrower than a third of the width
        const width = Math.floor(434 / count);
        const columns: Column[] = areas.bottom.map((_, i) => ({ left: 23 + i * width, width }));
        return (
            <>
                {this.renderTime({ top: 6, left: 0, width: 480, height: 108, align: 'center' }, 116)}
                {this.renderTimeIcon(45, 31, 40)}
                {this.renderDate({ top: textTop(127, 36), left: 0, width: 480, textAlign: 'center', fontSize: 36 })}
                {this.renderBar(167, 60, 360)}
                {model.notify
                    ? this.renderNotify({
                          headingTop: 182,
                          headingSize: 38,
                          textTop: 236,
                          textSize: 17,
                          lineHeight: 24,
                          lines: 3,
                      })
                    : this.renderBottom(areas.bottom, columns, {
                          labelTop: 181,
                          labelSize: 25,
                          iconTop: 207,
                          iconSize: 64,
                          valueTop: 280,
                          valueSize: 36,
                      })}
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
