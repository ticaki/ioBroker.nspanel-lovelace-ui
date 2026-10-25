import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupHeaderIconColor, popupTitle } from '../popupSlider/fields';
import { CloseButton, HEADER_ICON_SIZE, POPUP_FONT_SIZE, PopupHeader, TAP_SIZE } from '../popupSlider/PopupHeader';
import { Slider } from '../popupSlider/Slider';
import type { ButtonTriple, PopupShutterModel } from './parse';

/** geometry of `popupShutter` on the HMI (stage pixels) */
const SHUTTER = {
    iconCenter: { x: 34, y: 80 },
    textLeft: 65,
    textCenterY: 64,
    buttonCentersX: [306, 358, 410] as const,
    buttonsCenterY: 121,
    sliderLeft: 70,
    sliderLength: 320,
    sliderCenterY: 173,
    tiltButtonsCenterY: 231,
    tiltSliderCenterY: 282,
};

/** geometry of `popupShutter2` on the HMI: buttons left and right of the window picture */
const SHUTTER2 = {
    leftButtonsCenterX: 46,
    rightButtonsCenterX: 336,
    buttonCentersY: [119, 181, 243] as const,
    window: { left: 116, top: 99, width: 153, height: 151 },
    percentCenterY: 278,
};

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

    /** the covered part of the window in percent (0 = open) */
    private get covered(): number {
        const { model } = this.props;
        const pos = Math.max(0, Math.min(100, model.position ?? 0));
        return model.closedIsZero ? 100 - pos : pos;
    }

    /** a tap on the window picture of popupShutter2 moves the shutter to that height */
    private readonly onWindowTap = (e: React.PointerEvent<HTMLDivElement>): void => {
        const el = this.windowRef.current;
        if (!el || this.props.model.position === undefined) {
            return;
        }
        const rect = el.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        const covered = Math.round(ratio * 100);
        this.props.press(this.id, 'positionSlider', this.props.model.closedIsZero ? 100 - covered : covered);
    };

    private renderTriple(
        triple: ButtonTriple,
        actions: [string, string, string],
        centres: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }],
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
        return (
            <div
                key={action}
                data-block={action}
                style={{ position: 'absolute', left: SHUTTER.sliderLeft, top: top - 11 }}
            >
                <Slider
                    name={action}
                    value={value}
                    min={0}
                    max={100}
                    length={SHUTTER.sliderLength}
                    onCommit={(v): void => this.props.press(this.id, action, v)}
                />
            </div>
        );
    }

    private renderShutter(): React.JSX.Element {
        const { model, ctx } = this.props;
        const hasTilt = model.tilt !== undefined || model.tiltButtons.icons.some(i => i !== '');
        const y = SHUTTER.buttonsCenterY;
        const ty = SHUTTER.tiltButtonsCenterY;
        const [x1, x2, x3] = SHUTTER.buttonCentersX;
        // the HMI shows the text of the position row (the name of the entity) next to the icon
        const text = model.positionLabel || popupTitle(ctx, model.entityName);
        // the payload has an icon field but no colour: the icon is drawn in the colour of the
        // tapped entity (pageArgs[3]) like on the HMI
        const icon = model.icon || ctx.pageArgs[2] || '';
        const iconColor = popupHeaderIconColor(ctx);
        return (
            <>
                <CloseButton onClose={(): void => this.onPress('bExit')} />
                <div
                    style={{
                        position: 'absolute',
                        left: SHUTTER.iconCenter.x - TAP_SIZE / 2,
                        top: SHUTTER.iconCenter.y - TAP_SIZE / 2,
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
                        left: SHUTTER.textLeft,
                        right: 480 - x1 + TAP_SIZE / 2,
                        top: SHUTTER.textCenterY - 12,
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
                            left: SHUTTER.textLeft,
                            right: 480 - x1 + TAP_SIZE / 2,
                            top: SHUTTER.textCenterY + 14,
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
                    ? this.renderSlider(SHUTTER.sliderCenterY, model.position, 'positionSlider')
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
                    ? this.renderSlider(SHUTTER.tiltSliderCenterY, model.tilt, 'tiltSlider')
                    : null}
            </>
        );
    }

    /** the window picture of popupShutter2: housing at the top, lamellae over the covered part */
    private renderWindow(): React.JSX.Element {
        const { left, top, width, height } = SHUTTER2.window;
        const covered = this.covered;
        const housing = 14;
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
                    boxSizing: 'border-box',
                    border: '2px solid #c4c4c4',
                    background: 'linear-gradient(180deg, #8fa6bd 0%, #6f8ba8 100%)',
                    overflow: 'hidden',
                    cursor: canMove ? 'pointer' : 'default',
                    touchAction: 'none',
                }}
            >
                {/* window cross */}
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        bottom: 0,
                        width: 3,
                        marginLeft: -1.5,
                        background: '#d8d8d8',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        height: 3,
                        marginTop: -1.5,
                        background: '#d8d8d8',
                    }}
                />
                {/* the shutter covers the window from the top */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        height: `calc(${housing}px + ${covered}% - ${(covered * housing) / 100}px)`,
                        background:
                            'repeating-linear-gradient(180deg, #d4d4d4 0px, #d4d4d4 4px, #a8a8a8 4px, #a8a8a8 6px)',
                        borderBottom: '3px solid #9a9a9a',
                        boxSizing: 'border-box',
                    }}
                />
                {/* housing */}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 0,
                        height: housing,
                        background: 'linear-gradient(180deg, #e8e8e8 0%, #bcbcbc 100%)',
                        borderBottom: '1px solid #8a8a8a',
                        boxSizing: 'border-box',
                    }}
                />
            </div>
        );
    }

    private renderShutter2(): React.JSX.Element {
        const { model, ctx } = this.props;
        const lx = SHUTTER2.leftButtonsCenterX;
        const rx = SHUTTER2.rightButtonsCenterX;
        const [y1, y2, y3] = SHUTTER2.buttonCentersY;
        return (
            <>
                {/* no colour in the payload (see renderShutter): the colour of the tapped entity */}
                <PopupHeader
                    title={model.positionLabel || popupTitle(ctx, model.entityName)}
                    icon={model.icon || ctx.pageArgs[2] || ''}
                    iconColor={popupHeaderIconColor(ctx)}
                    onClose={(): void => this.onPress('bExit')}
                />
                {this.renderTriple(
                    model.buttons,
                    ['up', 'stop', 'down'],
                    [
                        { x: lx, y: y1 },
                        { x: lx, y: y2 },
                        { x: lx, y: y3 },
                    ],
                )}
                {this.renderWindow()}
                <div
                    data-percent=""
                    style={{
                        position: 'absolute',
                        left: SHUTTER2.window.left,
                        width: SHUTTER2.window.width,
                        top: SHUTTER2.percentCenterY - 12,
                        height: 24,
                        lineHeight: '24px',
                        fontSize: POPUP_FONT_SIZE,
                        color: theme.foreground,
                        textAlign: 'center',
                    }}
                >
                    {model.position !== undefined ? `${model.position}%` : ''}
                </div>
                {model.extra.map((b, i) => (
                    <IconButton
                        key={i}
                        glyph={b.icon}
                        enabled={b.enabled}
                        size={BUTTON_ICON_SIZE}
                        color={b.color !== undefined ? color565ToCss(b.color) : undefined}
                        action={`button${i + 1}Press`}
                        centre={{ x: rx, y: SHUTTER2.buttonCentersY[i] ?? y3 }}
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
