import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { fontSize, type NotifyButton, type PopupNotifyModel } from './parse';

/** height of the heading row with the X */
const HEAD_HEIGHT = 64;
/** height of the button row at the bottom */
const BUTTON_HEIGHT = 56;
const MARGIN_X = 24;
const ICON_SIZE = 96;

/**
 * The notification popup: heading (coloured), the X, a multi line text (font id of the
 * HMI, optional icon at the left) and up to three buttons at the bottom.
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

    private renderButton(button: NotifyButton, index: number): React.JSX.Element {
        const visible = button.text !== '';
        return (
            <div
                key={index}
                data-button={`button${index + 1}`}
                style={{
                    flex: '1 1 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color565ToCss(button.color),
                    fontSize: 28,
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
        const { model, ctx } = this.props;
        const size = fontSize(model.font);
        const hasIcon = model.icon !== '';
        const textColor = color565ToCss(model.textColor);
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
                        top: 0,
                        left: MARGIN_X,
                        right: HEAD_HEIGHT,
                        height: HEAD_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        color: color565ToCss(model.headingColor),
                        fontSize: 28,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {model.heading}
                </div>
                <div
                    data-close=""
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                    onClick={this.exit}
                >
                    <Icon
                        name="close"
                        size={32}
                        color={theme.foreground}
                    />
                </div>
                {hasIcon ? (
                    <div
                        data-icon=""
                        style={{
                            position: 'absolute',
                            left: MARGIN_X,
                            top: HEAD_HEIGHT,
                            bottom: BUTTON_HEIGHT,
                            width: ICON_SIZE,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={model.icon}
                            size={ICON_SIZE}
                            color={color565ToCss(model.iconColor)}
                        />
                    </div>
                ) : null}
                <div
                    data-text=""
                    style={{
                        position: 'absolute',
                        left: hasIcon ? MARGIN_X + ICON_SIZE + 20 : MARGIN_X,
                        right: MARGIN_X,
                        top: HEAD_HEIGHT,
                        bottom: BUTTON_HEIGHT,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: hasIcon ? 'center' : 'flex-start',
                        color: textColor,
                        fontSize: size,
                        lineHeight: `${Math.round(size * 1.2)}px`,
                        whiteSpace: 'pre-wrap',
                        overflowWrap: 'anywhere',
                        overflow: 'hidden',
                    }}
                >
                    {model.text}
                </div>
                <div
                    data-buttons=""
                    style={{
                        position: 'absolute',
                        left: MARGIN_X,
                        right: MARGIN_X,
                        bottom: 0,
                        height: BUTTON_HEIGHT,
                        display: 'flex',
                        alignItems: 'stretch',
                    }}
                >
                    {model.buttons.map((b, i) => this.renderButton(b, i))}
                </div>
            </div>
        );
    }
}
