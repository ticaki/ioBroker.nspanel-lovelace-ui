import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { Entity6, GlobalState } from '../../protocol/types';
import { isPortrait, stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { indicatorRelease, nextTap, swipeAction, type TapState } from './interaction';
import {
    ADVANCED_PORTRAIT_SEPARATOR,
    advancedIndicatorCells,
    easyviewColumns,
    isWebPortrait,
    landscapeWidth,
    notifyTextBox,
    portraitColumns,
    rowColumns,
    standardColumns,
    tilesGeometry,
    type Box,
    type Column,
} from './layout';
import {
    isBlankEntity,
    splitAreas,
    splitRuns,
    splitTime,
    tilesIconSize,
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

/** Size of the indicator icons of the tiles layout (in the font of the HMI fields f1Icon..) */
const TILES_ICON = 66;

/** font of the indicator fields f1Icon..f7Icon of screensaver5 */
const TILES_INDICATOR_FONT = 4;

/** web-p: the bottom rows of the standard and alternate layout (107 px each, like tiles) */
const PORTRAIT_STANDARD_ROWS: readonly number[] = [420, 527];

/** Positions of label, icon and value of a bottom column; relative to `Column.top` in the portrait layouts */
interface BottomStyle {
    labelTop: number;
    labelSize: number;
    iconTop: number;
    iconSize: number;
    valueTop: number;
    valueSize: number;
}

/** web-p: label, icon and value of a bottom column relative to its row (107 px, like the tiles bottom row) */
const PORTRAIT_BOTTOM: BottomStyle = {
    labelTop: 7,
    labelSize: 18,
    iconTop: 34,
    iconSize: 30,
    valueTop: 73,
    valueSize: 18,
};

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
    /** `true` in a portrait layout (full stage width), landscape otherwise */
    portrait?: boolean;
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
 * The screensaver: time, date, the weather/entity areas of the five layouts, the two MR
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
     * The release of a touch that started on an indicator icon: the tile tap counts with the taps of the background
     * and sends `<id>,button,<taps>`, a swipe from the tile is a swipe ({@link indicatorRelease}); the wake-up
     * happens in the store with the press.
     *
     * @param entityId id of the indicator entity (empty when none)
     * @param e the pointer event of the release
     */
    private indicatorTap(entityId: string, e: React.PointerEvent): void {
        const start = this.pointerStart;
        const { tap, press } = indicatorRelease(
            this.tap,
            entityId,
            start ? e.clientX - start.x : 0,
            start ? e.clientY - start.y : 0,
        );
        this.tap = tap;
        if (press) {
            this.props.press(...press);
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
     * @param fontWeight font weight of the time
     */
    private renderTime(
        box: { top: number; left: number; width: number; height: number; align: 'center' | 'right' },
        fontSize: number,
        fontWeight?: number,
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
                <span style={{ fontSize, fontWeight, lineHeight: 1, color: this.color(colors?.time) }}>{time}</span>
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
     * EasyView and tiles.
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

    /** The model the card is drawn for */
    private panelModel(): GlobalState['model'] {
        return this.props.global.model;
    }

    /**
     * The bottom area: label, icon and value per column. In the portrait layouts the column carries
     * the top of its row, the style positions are relative to it.
     *
     * @param entities the bottom entities
     * @param columns position of every column
     * @param style positions and sizes of label, icon and value
     */
    private renderBottom(entities: Entity6[], columns: Column[], style: BottomStyle): React.JSX.Element[] {
        const colors = this.props.model.colors;
        const result: React.JSX.Element[] = [];
        entities.forEach((entity, i) => {
            const column = columns[i];
            if (!column || isBlankEntity(entity)) {
                return;
            }
            const rowTop = column.top ?? 0;
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
                        top: rowTop + textTop(style.labelTop, style.labelSize),
                        fontSize: style.labelSize,
                        color: this.color(colors?.forecast[i] ?? colors?.forecast[0]),
                    })}
                    {this.renderIcon(entity, style.iconSize, {
                        position: 'absolute',
                        top: rowTop + style.iconTop,
                        left: column.left + Math.round((column.width - style.iconSize) / 2),
                    })}
                    {this.renderText(entity.optionalValue, {
                        ...centered,
                        top: rowTop + textTop(style.valueTop, style.valueSize),
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
        const stage = stageSize(this.panelModel());
        const width = style.portrait ? stage.width : landscapeWidth(this.panelModel());
        const text = notifyTextBox(width, style.portrait === true);
        const cover: React.CSSProperties = style.cover
            ? {
                  top: style.cover.top,
                  height: style.cover.height,
                  background: this.background(),
              }
            : { top: 0, height: stage.height, pointerEvents: 'none' };
        return (
            <div
                data-role="notify"
                style={{
                    position: 'absolute',
                    left: 0,
                    width,
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
                        width: width - 16,
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
                        left: text.left,
                        width: text.width,
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
     * An icon and a value side by side, centred in a row of the stage (web-p: favorit and alternate
     * entity of the alternate layout).
     *
     * @param entity the entity
     * @param role `data-role` of the row
     * @param top top edge of the row
     * @param iconSize size of the icon
     * @param valueSize font size of the value
     * @param color colour of the value
     */
    private renderIconValueRow(
        entity: Entity6,
        role: string,
        top: number,
        iconSize: number,
        valueSize: number,
        color: number | undefined,
    ): React.JSX.Element {
        return (
            <div
                data-role={role}
                style={{
                    position: 'absolute',
                    top,
                    left: 0,
                    width: stageSize(this.panelModel()).width,
                    height: iconSize,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    whiteSpace: 'nowrap',
                }}
            >
                {this.renderIcon(entity, iconSize)}
                {entity.optionalValue !== '' ? (
                    <span style={{ fontSize: valueSize, lineHeight: 1, color: this.color(color) }}>
                        {entity.optionalValue}
                    </span>
                ) : null}
            </div>
        );
    }

    /**
     * Time, date and bar shared by the standard and alternate layout. The notification
     * replaces everything below the bar. Landscape: eu geometry, centred on the width of the model
     * (web-l 640); web-p: same top part on 320 px, favorit and the two bottom rows below.
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
        const portrait = isWebPortrait(this.panelModel());
        const width = portrait ? stageSize(this.panelModel()).width : landscapeWidth(this.panelModel());
        const barLeft = portrait ? 20 : 60;
        return (
            <>
                {this.renderTopStatusIcons()}
                {this.renderTime({ top: 32, left: 0, width, height: 110, align: 'center' }, 116)}
                {this.renderTimeIcon(138, Math.round(width / 2) - 14, 28)}
                {this.renderDate({ top: textTop(172, 29), left: 0, width, textAlign: 'center', fontSize: 29 })}
                {this.renderBar(201, barLeft, width - 2 * barLeft)}
                {model.notify ? (
                    this.renderNotify({
                        headingTop: 216,
                        headingSize: 38,
                        textTop: 270,
                        textSize: 17,
                        lineHeight: 24,
                        lines: portrait ? 6 : 2,
                        portrait,
                    })
                ) : (
                    <>
                        {favorit}
                        {this.renderBottom(
                            areas.bottom,
                            columns,
                            portrait
                                ? PORTRAIT_BOTTOM
                                : {
                                      labelTop: 221,
                                      labelSize: 18,
                                      iconTop: 248,
                                      iconSize: 30,
                                      valueTop: 289,
                                      valueSize: 18,
                                  },
                        )}
                    </>
                )}
            </>
        );
    }

    private renderStandard(areas: ScreensaverAreas): React.JSX.Element {
        if (isWebPortrait(this.panelModel())) {
            const favorit =
                areas.favorit && !isBlankEntity(areas.favorit) ? (
                    <div data-role="favorit">
                        {this.renderIcon(areas.favorit, 64, { position: 'absolute', top: 252, left: 128 })}
                        {this.renderText(areas.favorit.optionalValue, {
                            top: textTop(330, 35),
                            left: 0,
                            width: 320,
                            textAlign: 'center',
                            fontSize: 35,
                            color: this.color(this.props.model.colors?.mainText),
                        })}
                    </div>
                ) : null;
            return this.renderStandardLike(
                areas,
                portraitColumns(areas.bottom.length, PORTRAIT_STANDARD_ROWS),
                favorit,
            );
        }
        return this.renderStandardLike(
            areas,
            standardColumns(areas.bottom.length, false),
            this.renderFavoritStacked(areas.favorit),
        );
    }

    /**
     * Alternate layout. Without an alternate entity the page looks like the standard layout
     * with one bottom column less. With one, the favorit moves into one row (icon left, value
     * right of it), the alternate entity takes the row below and the bottom columns
     * sit in the columns 2… of the standard layout (wiki: screensaverAlt.png). web-p: favorit and
     * alternate entity as two centred rows between bar and bottom rows, the bottom rows stay 4 + 3.
     *
     * @param areas the entities of the page
     */
    private renderAlternate(areas: ScreensaverAreas): React.JSX.Element {
        const colors = this.props.model.colors;
        const alternate = areas.alternate && !isBlankEntity(areas.alternate) ? areas.alternate : undefined;
        if (!alternate) {
            return this.renderStandard(areas);
        }
        const favoritEntity = areas.favorit && !isBlankEntity(areas.favorit) ? areas.favorit : undefined;
        if (isWebPortrait(this.panelModel())) {
            return this.renderStandardLike(
                areas,
                portraitColumns(areas.bottom.length, PORTRAIT_STANDARD_ROWS),
                <>
                    {favoritEntity
                        ? this.renderIconValueRow(favoritEntity, 'favorit', 246, 44, 34, colors?.mainText)
                        : null}
                    {this.renderIconValueRow(alternate, 'alternate', 320, 34, 35, colors?.mainTextAlt2)}
                </>,
            );
        }
        const favorit = favoritEntity ? (
            <div data-role="favorit">
                {this.renderIcon(favoritEntity, 44, { position: 'absolute', top: 236, left: 23 })}
                {this.renderText(favoritEntity.optionalValue, {
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
            standardColumns(areas.bottom.length, true),
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

    /**
     * An indicator: a tap on its box sends `event,buttonPress2,<id>,button`.
     *
     * @param entity the indicator
     * @param index position in the indicator area
     * @param box position of the touch area
     * @param icon content of the touch area
     */
    private renderIndicator(
        entity: Entity6,
        index: number,
        box: React.CSSProperties,
        icon: React.JSX.Element | null,
    ): React.JSX.Element | null {
        if (isBlankEntity(entity)) {
            return null;
        }
        return (
            <div
                key={index}
                data-role={`indicator${index + 1}`}
                onPointerUp={(e): void => {
                    e.stopPropagation();
                    this.indicatorTap(entity.id, e);
                    this.pointerStart = undefined;
                }}
                style={{
                    position: 'absolute',
                    cursor: entity.id !== '' ? 'pointer' : 'default',
                    ...box,
                }}
            >
                {icon}
            </div>
        );
    }

    /**
     * The indicators of the advanced layout: one row on eu / web-l, two rows of 4 on web-p.
     *
     * @param areas the areas of the payload
     */
    private renderAdvancedIndicators(areas: ScreensaverAreas): (React.JSX.Element | null)[] {
        const cells = advancedIndicatorCells(this.panelModel(), areas.indicator.length);
        return areas.indicator.map((entity, i) => {
            const cell: Box | undefined = cells[i];
            return cell
                ? this.renderIndicator(
                      entity,
                      i,
                      { ...cell, display: 'flex', alignItems: 'center', justifyContent: 'center' },
                      this.renderIcon(entity, 44),
                  )
                : null;
        });
    }

    /**
     * The two MR icons in the lower corners of the advanced layout, each centred in one half.
     *
     * @param top top edge of the row
     * @param width width of the layout
     */
    private renderBottomStatusIcons(top: number, width: number): (React.JSX.Element | null)[] {
        const { status } = this.props.model;
        const half = Math.round((width - 28) / 2);
        return [0, 1].map(i =>
            this.renderStatusIcon(
                status[i],
                { top, left: 6 + i * half, width: Math.round(width / 2), height: 28, justifyContent: 'center' },
                `mrIcon${i + 1}`,
            ),
        );
    }

    /**
     * The left column of the advanced layout: icon and value per row (33 px).
     *
     * @param left the left entities
     * @param top top edge of the first icon
     * @param valueWidth width of the value
     */
    private renderLeft(left: Entity6[], top: number, valueWidth: number): (React.JSX.Element | null)[] {
        const colors = this.props.model.colors;
        return left.map((entity, i) =>
            isBlankEntity(entity) ? null : (
                <div
                    key={i}
                    data-role={`left${i + 1}`}
                >
                    {this.renderIcon(entity, 28, { position: 'absolute', top: top + i * 33, left: 28 })}
                    {this.renderText(entity.optionalValue, {
                        top: textTop(top + 5 + i * 33, 17),
                        left: 66,
                        width: valueWidth,
                        fontSize: 17,
                        color: this.color(colors?.mainText),
                    })}
                </div>
            ),
        );
    }

    /**
     * The favorit of the advanced layout: icon top left, the value right of it.
     *
     * @param favorit the favorit entity
     * @param iconLeft x of the icon
     * @param valueLeft x of the value
     */
    private renderAdvancedFavorit(
        favorit: Entity6 | undefined,
        iconLeft: number,
        valueLeft: number,
    ): React.JSX.Element | null {
        if (!favorit || isBlankEntity(favorit)) {
            return null;
        }
        return (
            <div data-role="favorit">
                {this.renderIcon(favorit, 64, { position: 'absolute', top: 15, left: iconLeft })}
                {this.renderText(favorit.optionalValue, {
                    top: textTop(58, 25),
                    left: valueLeft,
                    width: 72,
                    fontSize: 25,
                    color: this.color(this.props.model.colors?.mainText),
                })}
            </div>
        );
    }

    /**
     * The favorit of the advanced layout on web-p: the value below the icon (no room right of it
     * next to the time).
     *
     * @param favorit the favorit entity
     */
    private renderFavoritPortrait(favorit: Entity6 | undefined): React.JSX.Element | null {
        if (!favorit || isBlankEntity(favorit)) {
            return null;
        }
        return (
            <div data-role="favorit">
                {this.renderIcon(favorit, 56, { position: 'absolute', top: 6, left: 20 })}
                {this.renderText(favorit.optionalValue, {
                    top: textTop(70, 25),
                    left: 0,
                    width: 96,
                    textAlign: 'center',
                    fontSize: 25,
                    color: this.color(this.props.model.colors?.mainText),
                })}
            </div>
        );
    }

    private renderAdvanced(areas: ScreensaverAreas): React.JSX.Element {
        if (isWebPortrait(this.panelModel())) {
            return this.renderAdvancedPortrait(areas);
        }
        const width = landscapeWidth(this.panelModel());
        // web-l: time and date keep their distance to the right edge, the indicators and bottom columns grow
        const dx = width - 480;
        return (
            <>
                {this.renderTime({ top: 13, left: 180, width: 279 + dx, height: 64, align: 'right' }, 57)}
                {this.renderTimeIcon(19, 226 + dx, 28)}
                {this.renderDate({
                    top: textTop(85, 16),
                    left: 180,
                    width: 271 + dx,
                    textAlign: 'right',
                    fontSize: 16,
                })}
                {this.renderAdvancedFavorit(areas.favorit, 30, 108)}
                {this.renderLeft(areas.left, 89, 114)}
                {this.renderAdvancedIndicators(areas)}
                {this.renderBottom(areas.bottom, rowColumns(areas.bottom.length, 16, 75), {
                    labelTop: 200,
                    labelSize: 18,
                    iconTop: 225,
                    iconSize: 28,
                    valueTop: 256,
                    valueSize: 18,
                })}
                {this.renderBottomStatusIcons(284, width)}
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

    /**
     * Advanced layout on web-p: favorit top left, time and date top right, the left column (4 rows)
     * below with the indicators 1-4 as a 2 x 2 block right of it, the indicators 5-12 in two rows of 4,
     * a separator line, the two bottom rows and the MR icons at the lower edge.
     *
     * @param areas the areas of the payload
     */
    private renderAdvancedPortrait(areas: ScreensaverAreas): React.JSX.Element {
        const stage = stageSize(this.panelModel());
        return (
            <>
                {this.renderTime({ top: 13, left: 128, width: 180, height: 64, align: 'right' }, 57)}
                {this.renderTimeIcon(19, 100, 28)}
                {this.renderDate({ top: textTop(85, 16), left: 100, width: 200, textAlign: 'right', fontSize: 16 })}
                {this.renderFavoritPortrait(areas.favorit)}
                {/* the value ends at the 2 x 2 indicator block (x 160) */}
                {this.renderLeft(areas.left, 105, 94)}
                {this.renderAdvancedIndicators(areas)}
                {/* 1 px line where the indicators end, colour of the bar of the standard layout */}
                <div
                    data-role="separator"
                    style={{
                        position: 'absolute',
                        top: ADVANCED_PORTRAIT_SEPARATOR,
                        left: 20,
                        width: stage.width - 40,
                        height: 1,
                        background: this.color(this.props.model.colors?.bar),
                    }}
                />
                {this.renderBottom(areas.bottom, portraitColumns(areas.bottom.length, [346, 456]), {
                    labelTop: 10,
                    labelSize: 18,
                    iconTop: 35,
                    iconSize: 28,
                    valueTop: 66,
                    valueSize: 18,
                })}
                {this.renderBottomStatusIcons(stage.height - 36, stage.width)}
                {this.renderNotify({
                    headingTop: 352,
                    headingSize: 30,
                    textTop: 398,
                    textSize: 17,
                    lineHeight: 24,
                    lines: 6,
                    cover: { top: 336, height: stage.height - 336 },
                    portrait: true,
                })}
            </>
        );
    }

    private renderEasyview(areas: ScreensaverAreas): React.JSX.Element {
        if (isWebPortrait(this.panelModel())) {
            return this.renderEasyviewPortrait(areas);
        }
        const { model } = this.props;
        const width = landscapeWidth(this.panelModel());
        // the three columns of the eu panel sit at 95, 240 and 385 - narrower than a third of the width
        const columns = easyviewColumns(areas.bottom.length, width);
        return (
            <>
                {this.renderTime({ top: 6, left: 0, width, height: 108, align: 'center' }, 116)}
                {this.renderTimeIcon(45, 31 + Math.round((width - 480) / 2), 40)}
                {this.renderDate({ top: textTop(127, 36), left: 0, width, textAlign: 'center', fontSize: 36 })}
                {this.renderBar(167, 60, width - 120)}
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

    /**
     * EasyView on web-p: info icon, time and date on top, two rows of 4 big entities below the bar
     * (label 20 px and value 24 px instead of 25 / 36 on eu, so they fit the 80 px columns).
     *
     * @param areas the areas of the payload
     */
    private renderEasyviewPortrait(areas: ScreensaverAreas): React.JSX.Element {
        const { model } = this.props;
        const width = stageSize(this.panelModel()).width;
        return (
            <>
                {this.renderTimeIcon(6, Math.round(width / 2) - 20, 40)}
                {this.renderTime({ top: 44, left: 0, width, height: 108, align: 'center' }, 116)}
                {this.renderDate({ top: textTop(165, 36), left: 0, width, textAlign: 'center', fontSize: 36 })}
                {this.renderBar(205, 20, width - 40)}
                {model.notify
                    ? this.renderNotify({
                          headingTop: 220,
                          headingSize: 38,
                          textTop: 274,
                          textSize: 17,
                          lineHeight: 24,
                          lines: 6,
                          portrait: true,
                      })
                    : this.renderBottom(areas.bottom, portraitColumns(areas.bottom.length, [212, 412]), {
                          labelTop: 14,
                          labelSize: 20,
                          iconTop: 40,
                          iconSize: 64,
                          valueTop: 113,
                          // 36 px (eu) and 30 px overflow the 80 px column with values like `2,4m/s`
                          valueSize: 24,
                      })}
            </>
        );
    }

    /**
     * Tiles (`screensaver5`, HMI/tools/screensaver5.py): eu 3 rows x 5 columns of 90 x 107 px. Indicators f1-f5 on
     * top, f6 | time and date | f7 in the middle, the bottom items below, two status bars at the lower edge.
     * web-l: 7 columns, two indicators each left and right of the clock. us-p / web-p: 4 columns of 80 px
     * (`HMI/tools/screensaver5_usp.py`), see {@link tilesGeometry}.
     *
     * @param areas the areas of the payload
     */
    private renderTiles(areas: ScreensaverAreas): React.JSX.Element {
        const { model } = this.props;
        const geo = tilesGeometry(this.panelModel());
        const portrait = isPortrait(this.panelModel());
        // an icon in another font (`¬<n>`) keeps the centre of the icon in font 4 in the middle of its cell
        const iconOf = (entity: Entity6, cell: Box): React.JSX.Element | null => {
            const size = tilesIconSize(entity.icon, TILES_ICON, TILES_INDICATOR_FONT);
            const shift = Math.round((TILES_ICON - size) / 2);
            return this.renderIcon(entity, size, {
                position: 'absolute',
                top: Math.floor((cell.height - TILES_ICON) / 2) - 6 + shift,
                left: Math.floor((cell.width - TILES_ICON) / 2) + shift,
            });
        };
        return (
            <>
                {this.renderTime({ ...geo.clock, align: 'center' }, 86, 700)}
                {this.renderTimeIcon(geo.timeIcon.top, geo.timeIcon.left, 28)}
                {this.renderDate({
                    top: textTop(geo.date.capTop, 18),
                    left: geo.date.left,
                    width: geo.date.width,
                    textAlign: 'center',
                    fontSize: 18,
                })}
                {areas.indicator.map((entity, i) => {
                    const cell: Box | undefined = geo.indicators[i];
                    return cell ? this.renderIndicator(entity, i, cell, iconOf(entity, cell)) : null;
                })}
                {model.notify
                    ? this.renderNotify({
                          headingTop: geo.notify.headingTop,
                          headingSize: 38,
                          textTop: geo.notify.textTop,
                          textSize: 17,
                          lineHeight: 24,
                          lines: geo.notify.lines,
                          portrait,
                      })
                    : this.renderBottom(areas.bottom, geo.bottom, {
                          labelTop: 7,
                          labelSize: 18,
                          iconTop: 34,
                          iconSize: 30,
                          valueTop: 73,
                          valueSize: 18,
                      })}
                {model.status.map((status, i) => {
                    const bar: Box | undefined = geo.bars[i];
                    return status.icon === '' || !bar ? null : (
                        <div
                            key={i}
                            data-role={`statusBar${i + 1}`}
                            style={{
                                position: 'absolute',
                                ...bar,
                                background: color565ToCss(status.color),
                            }}
                        />
                    );
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
            case 'tiles':
                return this.renderTiles(areas);
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
