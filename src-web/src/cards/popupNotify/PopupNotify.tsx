import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupFrame } from '../popupSlider/layout';
import { CloseButton, POPUP_FONT_SIZE } from '../popupSlider/PopupHeader';
import { cssFontSize, lineHeight, maxLines, type NotifyButton, type PopupNotifyModel } from './parse';

/** geometry of the notification popup in stage pixels */
export interface NotifyGeometry {
    heading: { left: number; centerY: number; fontSize: number; right: number };
    /** the icon; `inHeading`: small icon left of the heading (portrait), else big icon left of the text */
    icon: { centerX: number; centerY: number; size: number; inHeading: boolean };
    /** the text box: next to the icon (landscape), from the left margin without one */
    text: { top: number; leftWithIcon: number; left: number; right: number };
    /** the three buttons: left edges, width, vertical centre */
    button: { lefts: number[]; width: number; centerY: number; height: number; centered: boolean; fontSize: number };
}

/** button width of the HMI (eu: three buttons of 160 px, text left aligned) */
const BUTTON_WIDTH = 160;
/** the portrait buttons: three of 90 px in one row at the bottom */
const PORTRAIT_BUTTON_WIDTH = 90;
const BUTTON_FONT_SIZE = 24;
const BUTTON_PADDING_LEFT = 25;

/**
 * The layout of popupNotify per model. Landscape like the HMI (eu: icon 64 px at 76/152, text
 * from x 138 (24 without icon) to 424, buttons of 160 px at y 285); `web-l` widens the text box
 * to x 584 and spreads the buttons over the 640 px. Portrait (us-p, web-p): the text box is
 * 272 px wide (x 24..296) from y 74, the icon moves small into the heading line, three
 * buttons of 90 px in one row at the bottom (web-p y 605).
 *
 * @param model the panel model the popup sees
 */
export function notifyGeometry(model: PanelModel): NotifyGeometry {
    const { width, height, portrait } = popupFrame(model);
    if (portrait) {
        const share = width / 3;
        return {
            heading: { left: 24, centerY: 42, fontSize: 24, right: 90 },
            icon: { centerX: 42, centerY: 42, size: 36, inHeading: true },
            text: { top: 74, leftWithIcon: 24, left: 24, right: width - 24 },
            button: {
                lefts: [0, 1, 2].map(i => Math.round(i * share + (share - PORTRAIT_BUTTON_WIDTH) / 2)),
                width: PORTRAIT_BUTTON_WIDTH,
                centerY: height - 35,
                height: 44,
                centered: true,
                // three buttons of 90 px: the small popup font, so "Ignorieren" still fits
                fontSize: POPUP_FONT_SIZE,
            },
        };
    }
    const share = width / 3;
    return {
        heading: { left: 24, centerY: 42, fontSize: 24, right: 90 },
        icon: { centerX: 76, centerY: 152, size: 64, inHeading: false },
        text: { top: 74, leftWithIcon: 138, left: 24, right: width - 56 },
        button: {
            lefts: [0, 1, 2].map(i => Math.round(i * share + (share - BUTTON_WIDTH) / 2)),
            width: BUTTON_WIDTH,
            centerY: 285,
            height: 44,
            centered: false,
            fontSize: BUTTON_FONT_SIZE,
        },
    };
}

/**
 * The notification popup like the HMI: small heading at the top left (coloured), the X,
 * the icon at the left, the text in the font of the payload (up to the line count the
 * adapter uses for that font; longer texts are rotated by the adapter) and up to three
 * buttons at the bottom.
 *
 * Events: X -> `event,buttonPress2,popupNotify,bExit`; buttons ->
 * `event,buttonPress2,<id>,notifyAction,button1|button2|button3`. The timeout of the
 * payload closes the popup with the same `bExit` (the HMI clicks its own X), every touch
 * restarts it.
 */
export class PopupNotify extends React.Component<CardProps<PopupNotifyModel>> {
    private timer: ReturnType<typeof setTimeout> | undefined;

    componentDidMount(): void {
        this.armTimer();
    }

    componentDidUpdate(prevProps: CardProps<PopupNotifyModel>): void {
        const { model } = this.props;
        if (model.exitRequests !== prevProps.model.exitRequests) {
            this.exit();
            return;
        }
        if (model.updates !== prevProps.model.updates || model.timeout !== prevProps.model.timeout) {
            this.armTimer();
        }
    }

    componentWillUnmount(): void {
        this.clearTimer();
    }

    private clearTimer(): void {
        if (this.timer !== undefined) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }

    /** (Re)starts the popup timeout, 0 = stays open */
    private armTimer(): void {
        this.clearTimer();
        const seconds = this.props.model.timeout;
        if (seconds > 0) {
            this.timer = setTimeout(() => {
                this.timer = undefined;
                this.exit();
            }, seconds * 1000);
        }
    }

    private readonly exit = (): void => {
        this.clearTimer();
        this.props.press('popupNotify', 'bExit');
    };

    private readonly onTouch = (): void => {
        this.armTimer();
    };

    private renderButton(button: NotifyButton, index: number, geometry: NotifyGeometry): React.JSX.Element {
        const visible = button.text !== '';
        const g = geometry.button;
        return (
            <div
                key={index}
                data-button={`button${index + 1}`}
                style={{
                    position: 'absolute',
                    left: g.lefts[index] ?? 0,
                    width: g.width,
                    top: g.centerY - g.height / 2,
                    height: g.height,
                    boxSizing: 'border-box',
                    paddingLeft: g.centered ? 4 : BUTTON_PADDING_LEFT,
                    paddingRight: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: g.centered ? 'center' : 'flex-start',
                    color: color565ToCss(button.color),
                    fontSize: g.fontSize,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: visible ? 'pointer' : 'default',
                    visibility: visible ? 'visible' : 'hidden',
                }}
                onClick={
                    visible
                        ? (): void =>
                              this.props.press(this.props.model.entityName, 'notifyAction', `button${index + 1}`)
                        : undefined
                }
            >
                {button.text}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global } = this.props;
        const g = notifyGeometry(global.model);
        const { heading: headingBox, icon: iconBox, text: textBox } = g;
        const hasIcon = model.icon !== '';
        const headingLeft = hasIcon && iconBox.inHeading ? iconBox.centerX + iconBox.size / 2 + 8 : headingBox.left;
        const textLeft = hasIcon && !iconBox.inHeading ? textBox.leftWithIcon : textBox.left;
        const size = cssFontSize(model.font);
        const line = lineHeight(model.font);
        return (
            <div
                data-page={ctx.pageType}
                onPointerDown={this.onTouch}
                style={{ position: 'absolute', inset: 0, background: theme.background, overflow: 'hidden' }}
            >
                <div
                    data-heading=""
                    style={{
                        position: 'absolute',
                        top: headingBox.centerY - 16,
                        left: headingLeft,
                        right: headingBox.right,
                        height: 32,
                        lineHeight: '32px',
                        color: color565ToCss(model.headingColor),
                        fontSize: headingBox.fontSize,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {model.heading}
                </div>
                <CloseButton
                    onClose={this.exit}
                    model={global.model}
                />
                {hasIcon ? (
                    <div
                        data-icon=""
                        style={{
                            position: 'absolute',
                            left: iconBox.centerX - iconBox.size / 2,
                            top: iconBox.centerY - iconBox.size / 2,
                            width: iconBox.size,
                            height: iconBox.size,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={model.icon}
                            size={iconBox.size}
                            color={color565ToCss(model.iconColor)}
                        />
                    </div>
                ) : null}
                <div
                    data-text=""
                    style={{
                        position: 'absolute',
                        left: textLeft,
                        width: textBox.right - textLeft,
                        top: textBox.top,
                        height: line * maxLines(model.font, global.model),
                        color: color565ToCss(model.textColor),
                        fontSize: size,
                        lineHeight: `${line}px`,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        overflow: 'hidden',
                    }}
                >
                    {model.text}
                </div>
                <div data-buttons="">{model.buttons.map((b, i) => this.renderButton(b, i, g))}</div>
            </div>
        );
    }
}
