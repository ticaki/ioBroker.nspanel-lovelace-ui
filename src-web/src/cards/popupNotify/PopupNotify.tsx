import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { CloseButton } from '../popupSlider/PopupHeader';
import { cssFontSize, lineHeight, maxLines, type NotifyButton, type PopupNotifyModel } from './parse';

/** geometry of the HMI (stage pixels) */
const HEADING = { left: 24, centerY: 42, fontSize: 24 };
const ICON = { centerX: 76, centerY: 152, size: 64 };
/** the text box: next to the icon, from the left margin without one */
const TEXT = { top: 74, leftWithIcon: 138, left: 24, right: 424 };
/** three buttons of 160 px, the text left aligned like on the HMI */
const BUTTON = { width: 160, centerY: 285, height: 44, paddingLeft: 25, fontSize: 24 };

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

    private renderButton(button: NotifyButton, index: number): React.JSX.Element {
        const visible = button.text !== '';
        return (
            <div
                key={index}
                data-button={`button${index + 1}`}
                style={{
                    position: 'absolute',
                    left: index * BUTTON.width,
                    width: BUTTON.width,
                    top: BUTTON.centerY - BUTTON.height / 2,
                    height: BUTTON.height,
                    boxSizing: 'border-box',
                    paddingLeft: BUTTON.paddingLeft,
                    paddingRight: 4,
                    display: 'flex',
                    alignItems: 'center',
                    color: color565ToCss(button.color),
                    fontSize: BUTTON.fontSize,
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
        const hasIcon = model.icon !== '';
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
                        top: HEADING.centerY - 16,
                        left: HEADING.left,
                        right: 90,
                        height: 32,
                        lineHeight: '32px',
                        color: color565ToCss(model.headingColor),
                        fontSize: HEADING.fontSize,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {model.heading}
                </div>
                <CloseButton onClose={this.exit} />
                {hasIcon ? (
                    <div
                        data-icon=""
                        style={{
                            position: 'absolute',
                            left: ICON.centerX - ICON.size / 2,
                            top: ICON.centerY - ICON.size / 2,
                            width: ICON.size,
                            height: ICON.size,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={model.icon}
                            size={ICON.size}
                            color={color565ToCss(model.iconColor)}
                        />
                    </div>
                ) : null}
                <div
                    data-text=""
                    style={{
                        position: 'absolute',
                        left: hasIcon ? TEXT.leftWithIcon : TEXT.left,
                        width: TEXT.right - (hasIcon ? TEXT.leftWithIcon : TEXT.left),
                        top: TEXT.top,
                        height: line * maxLines(model.font),
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
                <div data-buttons="">{model.buttons.map((b, i) => this.renderButton(b, i))}</div>
            </div>
        );
    }
}
