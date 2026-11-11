import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { alarmLayout, type AlarmLayout } from './layout';
import type { CardAlarmModel } from './parse';

/** maximum number of digits of the PIN (the HMI field holds about this many) */
export const MAX_PIN_LENGTH = 12;

/** the keys of the numpad, row by row; `''` is an empty cell */
const KEYS: readonly (readonly string[])[] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'CLR'],
];

/** the digits are drawn in the 32 px Nextion font (digit height 17 px) */
const KEY_FONT = 24;
const BUTTON_FONT = 17;

interface CardAlarmState {
    /** digits entered so far */
    pin: string;
}

/**
 * `cardAlarm` / `cardUnlock`: a numpad on the left, the title (or the entered PIN) in the
 * text field of the title bar, the status icon next to it and up to four action buttons on the right. An action
 * button sends `event,buttonPress2,<id>,<action>,<pin>`; digits and CLR are local.
 */
export class CardAlarm extends React.Component<CardProps<CardAlarmModel>, CardAlarmState> {
    state: CardAlarmState = { pin: '' };

    componentDidUpdate(prevProps: CardProps<CardAlarmModel>): void {
        const { model } = this.props;
        // the adapter took the numpad away (locked / arming) or showed another alarm: forget the digits
        if (
            this.state.pin !== '' &&
            ((prevProps.model.numpadEnabled && !model.numpadEnabled) || prevProps.model.id !== model.id)
        ) {
            this.setState({ pin: '' });
        }
    }

    private onKey(key: string): void {
        if (!this.props.model.numpadEnabled || key === '') {
            return;
        }
        if (key === 'CLR') {
            this.setState({ pin: '' });
            return;
        }
        this.setState(state => (state.pin.length >= MAX_PIN_LENGTH ? null : { pin: state.pin + key }));
    }

    private onAction(action: string): void {
        if (action === '') {
            return;
        }
        this.props.press(this.props.model.id, action, this.state.pin);
        this.setState({ pin: '' });
    }

    private get layout(): AlarmLayout {
        return alarmLayout(this.props.global.model);
    }

    private renderKeys(layout: AlarmLayout): React.JSX.Element[] {
        const enabled = this.props.model.numpadEnabled;
        const cells: React.JSX.Element[] = [];
        KEYS.forEach((row, r) => {
            row.forEach((key, c) => {
                if (key === '') {
                    return;
                }
                cells.push(
                    <div
                        key={key}
                        data-key={key}
                        data-pressable={enabled ? '' : undefined}
                        onClick={(): void => this.onKey(key)}
                        style={{
                            position: 'absolute',
                            left: layout.keyColumns[c] - layout.keyWidth / 2,
                            top: layout.keyRows[r] - layout.keyHeight / 2,
                            width: layout.keyWidth,
                            height: layout.keyHeight,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: KEY_FONT,
                            color: enabled ? theme.accent : theme.muted,
                        }}
                    >
                        {key}
                    </div>,
                );
            });
        });
        return cells;
    }

    private renderButtons(layout: AlarmLayout): React.JSX.Element[] {
        return this.props.model.buttons.map((button, i) => {
            const centre = layout.buttons[i];
            if (button.label === '' || centre === undefined) {
                return <React.Fragment key={i} />;
            }
            const active = button.action !== '';
            return (
                <div
                    key={i}
                    data-action={active ? button.action : undefined}
                    data-pressable={active ? '' : undefined}
                    onClick={(): void => this.onAction(button.action)}
                    style={{
                        position: 'absolute',
                        left: centre.x - layout.buttonWidth / 2,
                        top: centre.y - layout.buttonHeight / 2,
                        width: layout.buttonWidth,
                        height: layout.buttonHeight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontSize: BUTTON_FONT,
                        lineHeight: '21px',
                        color: active ? theme.accent : theme.foreground,
                        overflow: 'hidden',
                        overflowWrap: 'anywhere',
                    }}
                >
                    <span
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {button.label}
                    </span>
                </div>
            );
        });
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const iconColor = color565ToCss(model.iconColor);
        const layout = this.layout;
        const { pinBox, statusIcon, corner } = layout;
        const pinText =
            this.state.pin === '' ? (layout.titleInBar ? '' : model.title) : '*'.repeat(this.state.pin.length);
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
                <style>{`@keyframes alarmFlash { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.15; } }`}</style>
                <TitleBar
                    title={layout.titleInBar ? model.title : ''}
                    navigation={model.navigation}
                    press={press}
                    model={global.model}
                />
                <div
                    data-pin=""
                    data-pin-length={this.state.pin.length}
                    style={{
                        position: 'absolute',
                        left: pinBox.left,
                        top: pinBox.top,
                        width: pinBox.width,
                        height: pinBox.height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: theme.titleFontSize,
                        letterSpacing: this.state.pin === '' ? undefined : 4,
                        color: theme.foreground,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {pinText}
                </div>
                {model.icon !== '' ? (
                    <div
                        data-status-icon=""
                        data-flashing={model.flashing ? '' : undefined}
                        style={{
                            position: 'absolute',
                            left: statusIcon.x - statusIcon.size / 2,
                            top: statusIcon.y - statusIcon.size / 2,
                            width: statusIcon.size,
                            height: statusIcon.size,
                            animation: model.flashing ? 'alarmFlash 1s step-end infinite' : undefined,
                        }}
                    >
                        <Icon
                            glyph={model.icon}
                            size={statusIcon.size}
                            color={iconColor}
                        />
                    </div>
                ) : null}
                {this.renderKeys(layout)}
                {this.renderButtons(layout)}
                {model.cornerButton ? (
                    <div
                        data-corner={model.cornerButton.id}
                        data-pressable=""
                        onClick={(): void => press(model.cornerButton?.id ?? '', 'button')}
                        style={{ position: 'absolute', left: corner.left, top: corner.top }}
                    >
                        <Icon
                            glyph={model.cornerButton.icon}
                            size={corner.size}
                            color={color565ToCss(model.cornerButton.iconColor)}
                        />
                    </div>
                ) : null}
            </div>
        );
    }
}
