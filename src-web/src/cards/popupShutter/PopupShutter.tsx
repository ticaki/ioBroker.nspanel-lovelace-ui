import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupHeaderIconColor, popupTitle } from '../popupSlider/fields';
import { popupFrame, spreadCenters } from '../popupSlider/layout';
import { CloseButton, HEADER_ICON_SIZE, POPUP_FONT_SIZE, PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import { coveredPercent, shownPercent, type ButtonTriple, type PopupShutterModel } from './parse';
import shutterClosedPicture from './shutter-closed.png';
import windowOpenPicture from './window-open.png';

type Point = { x: number; y: number };
type Triple<T> = [T, T, T];

/** geometry of `popupShutter` in stage pixels */
export interface ShutterGeometry {
    iconCenter: Point;
    textLeft: number;
    /** css `right` of the two text lines */
    textRight: number;
    textCenterY: number;
    buttonCentersX: Triple<number>;
    buttonsCenterY: number;
    sliderLeft: number;
    sliderLength: number;
    sliderCenterY: number;
    tiltButtonsCenterY: number;
    tiltSliderCenterY: number;
}

/** geometry of `popupShutter2` in stage pixels */
export interface Shutter2Geometry {
    /** up / stop / down */
    buttons: Triple<Point>;
    /** the three extra buttons */
    extra: Triple<Point>;
    window: { left: number; top: number; width: number; height: number };
    percentCenterY: number;
}

/**
 * The layout of `popupShutter` per model. Landscape like the HMI (eu: buttons centred at x
 * 306/358/410, y 121; slider from x 70, 320 px, at y 173; tilt row at y 231/282); on `web-l` the
 * buttons stay at the right edge and the sliders grow to 480 px. Portrait (us-p, web-p): the
 * buttons in one row below the name, the sliders (240 px) below them.
 *
 * @param model the panel model the popup sees
 */
export function shutterGeometry(model: PanelModel): ShutterGeometry {
    const { width, height, portrait } = popupFrame(model);
    if (portrait) {
        const tall = height >= 640;
        const [x1, x2, x3] = spreadCenters(3, 40, width - 80);
        return {
            iconCenter: { x: 34, y: 80 },
            textLeft: 65,
            textRight: 20,
            textCenterY: 64,
            buttonCentersX: [x1, x2, x3],
            buttonsCenterY: tall ? 150 : 140,
            sliderLeft: 40,
            sliderLength: width - 80,
            sliderCenterY: tall ? 215 : 195,
            tiltButtonsCenterY: tall ? 305 : 265,
            tiltSliderCenterY: tall ? 370 : 320,
        };
    }
    const x1 = width - 174;
    return {
        iconCenter: { x: 34, y: 80 },
        textLeft: 65,
        textRight: width - x1 + TAP_SIZE / 2,
        textCenterY: 64,
        buttonCentersX: [x1, width - 122, width - 70],
        buttonsCenterY: 121,
        sliderLeft: 70,
        sliderLength: width - 160,
        sliderCenterY: 173,
        tiltButtonsCenterY: 231,
        tiltSliderCenterY: 282,
    };
}

/**
 * The layout of `popupShutter2` per model. Landscape like the HMI (eu: up/stop/down at x 46,
 * the window picture 153 x 151 at 116/99, the extra buttons at x 336, y 119/181/243), centred
 * on `web-l`. Portrait (us-p, web-p): the window centred below the header (web-p bigger), the
 * percentage below it, up/stop/down and the extra buttons in a row each below.
 *
 * @param model the panel model the popup sees
 */
export function shutter2Geometry(model: PanelModel): Shutter2Geometry {
    const { width, height, portrait, euLeft } = popupFrame(model);
    if (portrait) {
        const tall = height >= 640;
        const win = tall ? { width: 200, height: 197, top: 90 } : { width: 153, height: 151, top: 76 };
        const percentCenterY = win.top + win.height + 22;
        const buttonsY = percentCenterY + (tall ? 70 : 50);
        const extraY = buttonsY + (tall ? 80 : 62);
        const xs = spreadCenters(3, 40, width - 80);
        const row = (y: number): Triple<Point> => [
            { x: xs[0], y },
            { x: xs[1], y },
            { x: xs[2], y },
        ];
        return {
            buttons: row(buttonsY),
            extra: row(extraY),
            window: { left: Math.round((width - win.width) / 2), ...win },
            percentCenterY,
        };
    }
    const column = (x: number): Triple<Point> => [
        { x: euLeft + x, y: 119 },
        { x: euLeft + x, y: 181 },
        { x: euLeft + x, y: 243 },
    ];
    return {
        buttons: column(46),
        extra: column(336),
        window: { left: euLeft + 116, top: 99, width: 153, height: 151 },
        percentCenterY: 278,
    };
}

const BUTTON_ICON_SIZE = HEADER_ICON_SIZE;

interface IconButtonProps {
    glyph: string;
    enabled: boolean;
    size: number;
    color?: string;
    action: string;
    centre: { x: number; y: number };
    onPress: (action: string) => void;
}

/** A square icon button at a fixed centre; disabled buttons are grey and ignore taps */
class IconButton extends React.Component<IconButtonProps> {
    render(): React.JSX.Element {
        const { glyph, enabled, size, action, centre, onPress } = this.props;
        const color = enabled ? (this.props.color ?? theme.foreground) : theme.muted;
        return (
            <div
                data-button={action}
                data-enabled={enabled ? '1' : '0'}
                onClick={enabled ? (): void => onPress(action) : undefined}
                style={{
                    position: 'absolute',
                    left: centre.x - TAP_SIZE / 2,
                    top: centre.y - TAP_SIZE / 2,
                    width: TAP_SIZE,
                    height: TAP_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: enabled ? 'pointer' : 'default',
                }}
            >
                {glyph ? (
                    <Icon
                        glyph={glyph}
                        size={size}
                        color={color}
                    />
                ) : null}
            </div>
        );
    }
}

/**
 * `popupShutter`: icon and name at the left (the adapter sends neither, both come from the
 * tapped entity = page arguments), up/stop/down buttons and the position slider,
 * plus the same row for the tilt (`tiltOpen`/`tiltStop`/`tiltClose`, `tiltSlider`) when
 * the entity has one. The HMI shows no title in the head and no slider labels.
 * `popupShutter2`: up/stop/down at the left, the window picture in the middle (a tap sets
 * the position, `positionSlider`), the percentage below it and up to three extra buttons
 * (`button1Press`..`button3Press`) at the right.
 */
export class PopupShutter extends React.Component<CardProps<PopupShutterModel>> {
    private readonly windowRef = React.createRef<HTMLDivElement>();

    private get id(): string {
        return popupEntityId(this.props.ctx, this.props.model.entityName);
    }

    private readonly onPress = (action: string): void => {
        this.props.press(this.id, action);
    };

    /** the covered part of the window in percent (0 = open, 100 = closed), see `coveredPercent` */
    private get covered(): number {
        return coveredPercent(this.props.model.position ?? 0);
    }

    /**
     * A tap on the window picture of popupShutter2 moves the shutter to that height. The HMI
     * reports `100 - hPosition.val` = the covered part, the adapter turns that into the state
     * (`positionSlider` in `pageItem.ts` inverts it when `shutterClosedIsZero` is set).
     */
    private readonly onWindowTap = (e: React.PointerEvent<HTMLDivElement>): void => {
        const el = this.windowRef.current;
        if (!el || this.props.model.position === undefined) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        this.props.press(this.id, 'positionSlider', Math.round(ratio * 100));
    };

    private renderTriple(
        triple: ButtonTriple,
        actions: [string, string, string],
        centres: Triple<Point>,
    ): React.JSX.Element[] {
        return triple.icons.map((glyph, i) => (
            <IconButton
                key={actions[i]}
                glyph={glyph}
                enabled={triple.enabled[i]}
                size={BUTTON_ICON_SIZE}
                action={actions[i]}
                centre={centres[i]}
                onPress={this.onPress}
            />
        ));
    }

    private renderSlider(top: number, value: number, action: string): React.JSX.Element {
        const g = shutterGeometry(this.props.global.model);
        return (
            <div
                key={action}
                data-block={action}
                style={{ position: 'absolute', left: g.sliderLeft, top: top - 11 }}
            >
                <Slider
                    name={action}
                    value={value}
                    min={0}
                    max={100}
                    length={g.sliderLength}
                    onCommit={(v): void => this.props.press(this.id, action, v)}
                />
            </div>
        );
    }

    private renderShutter(): React.JSX.Element {
        const { model, ctx, global } = this.props;
        const g = shutterGeometry(global.model);
        const hasTilt = model.tilt !== undefined || model.tiltButtons.icons.some(i => i !== '');
        const y = g.buttonsCenterY;
        const ty = g.tiltButtonsCenterY;
        const [x1, x2, x3] = g.buttonCentersX;
        // the HMI shows the text of the position row (the name of the entity) next to the icon
        const text = model.positionLabel || popupTitle(ctx, model.entityName);
        // the payload has an icon field but no colour: the icon is drawn in the colour of the
        // tapped entity (pageArgs[3]) like on the HMI
        const icon = model.icon || ctx.pageArgs[2] || '';
        const iconColor = popupHeaderIconColor(ctx);
        return (
            <>
                <CloseButton
                    onClose={(): void => this.onPress('bExit')}
                    model={global.model}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: g.iconCenter.x - TAP_SIZE / 2,
                        top: g.iconCenter.y - TAP_SIZE / 2,
                        width: TAP_SIZE,
                        height: TAP_SIZE,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon ? (
                        <Icon
                            glyph={icon}
                            size={HEADER_ICON_SIZE}
                            color={iconColor}
                        />
                    ) : null}
                </div>
                <div
                    data-text=""
                    style={{
                        position: 'absolute',
                        left: g.textLeft,
                        right: g.textRight,
                        top: g.textCenterY - 12,
                        height: 24,
                        lineHeight: '24px',
                        fontSize: POPUP_FONT_SIZE,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {text}
                </div>
                {model.text ? (
                    <div
                        data-state=""
                        style={{
                            position: 'absolute',
                            left: g.textLeft,
                            right: g.textRight,
                            top: g.textCenterY + 14,
                            height: 24,
                            lineHeight: '24px',
                            fontSize: POPUP_FONT_SIZE,
                            color: theme.foreground,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {model.text}
                    </div>
                ) : null}
                {this.renderTriple(
                    model.buttons,
                    ['up', 'stop', 'down'],
                    [
                        { x: x1, y },
                        { x: x2, y },
                        { x: x3, y },
                    ],
                )}
                {model.position !== undefined
                    ? this.renderSlider(g.sliderCenterY, model.position, 'positionSlider')
                    : null}
                {hasTilt
                    ? this.renderTriple(
                          model.tiltButtons,
                          ['tiltOpen', 'tiltStop', 'tiltClose'],
                          [
                              { x: x1, y: ty },
                              { x: x2, y: ty },
                              { x: x3, y: ty },
                          ],
                      )
                    : null}
                {hasTilt && model.tilt !== undefined
                    ? this.renderSlider(g.tiltSliderCenterY, model.tilt, 'tiltSlider')
                    : null}
            </>
        );
    }

    /**
     * The window picture of popupShutter2, the two pictures of the HMI (`hPosition` is a
     * vertical slider with crop images): the open window as background, the picture of the
     * closed shutter cropped from the top down to the covered part. Both pictures carry the
     * housing at the top, so 0 % still shows it.
     */
    private renderWindow(): React.JSX.Element {
        const { left, top, width, height } = shutter2Geometry(this.props.global.model).window;
        const covered = this.covered;
        const canMove = this.props.model.position !== undefined;
        return (
            <div
                ref={this.windowRef}
                data-window=""
                data-shutter={covered}
                onPointerUp={canMove ? this.onWindowTap : undefined}
                style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    backgroundImage: `url(${windowOpenPicture})`,
                    backgroundSize: `${width}px ${height}px`,
                    overflow: 'hidden',
                    cursor: canMove ? 'pointer' : 'default',
                    touchAction: 'none',
                }}
            >
                <div
                    data-shutter-cover=""
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width,
                        height: `${covered}%`,
                        backgroundImage: `url(${shutterClosedPicture})`,
                        backgroundSize: `${width}px ${height}px`,
                        backgroundPosition: 'top left',
                        transition: 'height 0.3s ease-out',
                    }}
                />
            </div>
        );
    }

    private renderShutter2(): React.JSX.Element {
        const { model, ctx, global } = this.props;
        const g2 = shutter2Geometry(global.model);
        return (
            <>
                {/* no colour in the payload (see renderShutter): the colour of the tapped entity */}
                <PopupHeader
                    title={model.positionLabel || popupTitle(ctx, model.entityName)}
                    icon={model.icon || ctx.pageArgs[2] || ''}
                    iconColor={popupHeaderIconColor(ctx)}
                    onClose={(): void => this.onPress('bExit')}
                    model={global.model}
                />
                {this.renderTriple(model.buttons, ['up', 'stop', 'down'], g2.buttons)}
                {this.renderWindow()}
                <div
                    data-percent=""
                    style={{
                        position: 'absolute',
                        left: g2.window.left,
                        width: g2.window.width,
                        top: g2.percentCenterY - 12,
                        height: 24,
                        lineHeight: '24px',
                        fontSize: POPUP_FONT_SIZE,
                        color: theme.foreground,
                        textAlign: 'center',
                    }}
                >
                    {model.position !== undefined ? `${shownPercent(model.position, model.closedIsZero)}%` : ''}
                </div>
                {model.extra.map((b, i) => (
                    <IconButton
                        key={i}
                        glyph={b.icon}
                        enabled={b.enabled}
                        size={BUTTON_ICON_SIZE}
                        color={b.color !== undefined ? color565ToCss(b.color) : undefined}
                        action={`button${i + 1}Press`}
                        centre={g2.extra[i] ?? g2.extra[2]}
                        onPress={this.onPress}
                    />
                ))}
            </>
        );
    }

    render(): React.JSX.Element {
        const { ctx } = this.props;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                {ctx.pageType === 'popupShutter2' ? this.renderShutter2() : this.renderShutter()}
            </div>
        );
    }
}
