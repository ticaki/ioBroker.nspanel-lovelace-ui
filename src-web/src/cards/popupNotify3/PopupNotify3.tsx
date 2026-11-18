import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { isPortrait, stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { cssFontSize, lineHeight } from '../popupNotify/parse';
import type { Notify3Button, PopupNotify3Model } from './parse';

/** a box in stage pixels */
export interface Box {
    left: number;
    top: number;
    width: number;
    height: number;
}

/** geometry of popupNotify3 in stage pixels */
export interface Notify3Geometry {
    portrait: boolean;
    /** the big icon (square) */
    icon: Box;
    /** the X (bExit) */
    close: Box;
    /** left and right button */
    buttons: [Box, Box];
    /** size of the icon on a button */
    buttonIconSize: number;
    /** the text field: top, left, right; the text is centred and top aligned */
    text: { top: number; left: number; right: number };
}

/** size of the big icon (font 9 of HMI 6.2.0) */
export const NOTIFY3_ICON_SIZE = 255;
/** light grey of the X (RGB565 50712 = 0xC618) */
const CLOSE_COLOR = 50712;
/** ink of a 80 px icon glyph of the HMI font */
const LANDSCAPE_BUTTON_ICON = 66;
const PORTRAIT_BUTTON_ICON = 48;
const PORTRAIT_BUTTON_HEIGHT = 68;

/**
 * The layout of popupNotify3 per model (doc/ideas/notify-page/README.md).
 * Landscape (eu/us-l like the HMI, web-l on its 640 px stage): icon 255 px centred at the top, X top right
 * (box 66 x 80), button columns 80 px wide at x 8 and at the right edge, y 60..264, the text line below over the
 * whole width (x 8..width-8, y 272).
 * Portrait (us-p, web-p): icon centred at the top, the text below it, the two buttons side by side at the bottom.
 *
 * @param model the panel model the popup sees
 */
export function notify3Geometry(model: PanelModel): Notify3Geometry {
    const { width, height } = stageSize(model);
    const close: Box = { left: width - 66, top: 0, width: 66, height: 80 };
    const icon: Box = {
        left: Math.floor((width - NOTIFY3_ICON_SIZE) / 2),
        top: 0,
        width: NOTIFY3_ICON_SIZE,
        height: NOTIFY3_ICON_SIZE,
    };
    if (isPortrait(model)) {
        const half = Math.floor((width - 24) / 2);
        const top = height - 8 - PORTRAIT_BUTTON_HEIGHT;
        return {
            portrait: true,
            icon,
            close,
            buttons: [
                { left: 8, top, width: half, height: PORTRAIT_BUTTON_HEIGHT },
                { left: width - 8 - half, top, width: half, height: PORTRAIT_BUTTON_HEIGHT },
            ],
            buttonIconSize: PORTRAIT_BUTTON_ICON,
            text: { top: NOTIFY3_ICON_SIZE + 17, left: 8, right: width - 8 },
        };
    }
    return {
        portrait: false,
        icon,
        close,
        buttons: [
            { left: 8, top: 60, width: 80, height: 205 },
            { left: width - 88, top: 60, width: 80, height: 205 },
        ],
        buttonIconSize: LANDSCAPE_BUTTON_ICON,
        text: { top: 272, left: 8, right: width - 8 },
    };
}

/**
 * Notification with a big icon like the HMI page popupNotify3 (TFT 6.2.0): the icon, one line of text (font 0: two,
 * portrait: more - the adapter fits and wraps the text), the X and up to two icon buttons.
 *
 * Events: X -> `event,buttonPress2,popupNotify3,bExit`; buttons ->
 * `event,buttonPress2,<id>,notifyAction,button1|button3`. The timeout of the payload closes the popup with the same
 * `bExit`, every touch restarts it. After a button the HMI goes back to the screensaver timeout and closes itself
 * when it runs out and the adapter did not answer - the same here with `global.timeout`.
 */
export class PopupNotify3 extends React.Component<CardProps<PopupNotify3Model>> {
    private timer: ReturnType<typeof setTimeout> | undefined;
    /** a button was pressed: the screensaver timeout runs instead of the one of the payload */
    private afterButton = false;

    componentDidMount(): void {
        this.armTimer();
    }

    componentDidUpdate(prevProps: CardProps<PopupNotify3Model>): void {
        const { model } = this.props;
        if (model.exitRequests !== prevProps.model.exitRequests) {
            this.exit();
            return;
        }
        if (model.updates !== prevProps.model.updates || model.timeout !== prevProps.model.timeout) {
            this.afterButton = false;
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

    /** (Re)starts the timeout, 0 = stays open */
    private armTimer(): void {
        this.clearTimer();
        const seconds = this.afterButton ? this.props.global.timeout : this.props.model.timeout;
        if (seconds > 0) {
            this.timer = setTimeout(() => {
                this.timer = undefined;
                this.exit();
            }, seconds * 1000);
        }
    }

    private readonly exit = (): void => {
        this.clearTimer();
        this.props.press('popupNotify3', 'bExit');
    };

    private readonly onTouch = (): void => {
        this.armTimer();
    };

    private pressButton(button: 'button1' | 'button3'): void {
        this.afterButton = true;
        this.armTimer();
        this.props.press(this.props.model.entityName, 'notifyAction', button);
    }

    private renderButton(button: Notify3Button, index: 0 | 1, g: Notify3Geometry): React.JSX.Element | null {
        if (button.icon === '') {
            return null;
        }
        const box = g.buttons[index];
        const name = index === 0 ? 'button1' : 'button3';
        return (
            <div
                key={name}
                data-button={name}
                onClick={(): void => this.pressButton(name)}
                style={{
                    position: 'absolute',
                    ...box,
                    background: color565ToCss(button.color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <Icon
                    glyph={button.icon}
                    size={g.buttonIconSize}
                    color={theme.foreground}
                />
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global } = this.props;
        const g = notify3Geometry(global.model);
        const line = lineHeight(model.font);
        return (
            <div
                data-page={ctx.pageType}
                onPointerDown={this.onTouch}
                style={{ position: 'absolute', inset: 0, background: theme.background, overflow: 'hidden' }}
            >
                {model.icon !== '' ? (
                    <div
                        data-icon=""
                        style={{
                            position: 'absolute',
                            ...g.icon,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={model.icon}
                            size={g.icon.width}
                            color={color565ToCss(model.iconColor)}
                        />
                    </div>
                ) : null}
                <div
                    data-close=""
                    onClick={this.exit}
                    style={{
                        position: 'absolute',
                        ...g.close,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <Icon
                        name="close"
                        size={g.close.width}
                        color={color565ToCss(CLOSE_COLOR)}
                    />
                </div>
                {this.renderButton(model.buttons[0], 0, g)}
                {this.renderButton(model.buttons[1], 1, g)}
                <div
                    data-text=""
                    style={{
                        position: 'absolute',
                        left: g.text.left,
                        width: g.text.right - g.text.left,
                        top: g.text.top,
                        color: color565ToCss(model.textColor),
                        fontSize: cssFontSize(model.font),
                        lineHeight: `${line}px`,
                        textAlign: 'center',
                        whiteSpace: 'pre',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {model.text}
                </div>
            </div>
        );
    }
}
