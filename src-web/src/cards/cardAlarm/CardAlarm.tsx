import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
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

/** x centre of the three numpad columns (stage pixels) */
const KEY_COLUMNS = [65, 160, 255] as const;
/** y centre of the four numpad rows / action buttons */
const KEY_ROWS = [118, 177, 236, 292] as const;
const KEY_WIDTH = 80;
const KEY_HEIGHT = 50;

/** area of the action buttons on the right side */
const BUTTON_LEFT = 300;
const BUTTON_WIDTH = 176;

/** the PIN field in the title bar */
const PIN_BOX = { left: 90, top: 12, width: 210, height: 48 } as const;
/** status icon right of the PIN field */
const STATUS_ICON = { left: 322, top: 16, size: 40 } as const;
/** optional button in the bottom left corner */
const CORNER = { left: 12, top: 268, size: 40 } as const;

interface CardAlarmState {
    /** digits entered so far */
    pin: string;
}

/**
 * `cardAlarm` / `cardUnlock`: a numpad on the left, the entered PIN in a field at the top,
 * the status icon next to it and up to four action buttons on the right. An action
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

    private renderKeys(): React.JSX.Element[] {
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
                            left: KEY_COLUMNS[c] - KEY_WIDTH / 2,
                            top: KEY_ROWS[r] - KEY_HEIGHT / 2,
                            width: KEY_WIDTH,
                            height: KEY_HEIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
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

    private renderButtons(): React.JSX.Element[] {
        return this.props.model.buttons.map((button, i) => {
            if (button.label === '') {
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
                        left: BUTTON_LEFT,
                        top: KEY_ROWS[i] - KEY_HEIGHT / 2,
                        width: BUTTON_WIDTH,
                        height: KEY_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 17,
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
        const { model, ctx, press } = this.props;
        const iconColor = color565ToCss(model.iconColor);
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
                <style>{`@keyframes alarmFlash { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.15; } }`}</style>
                <TitleBar
                    title=""
                    navigation={model.navigation}
                    press={press}
                />
                <div
                    data-pin=""
                    style={{
                        position: 'absolute',
                        left: PIN_BOX.left,
                        top: PIN_BOX.top,
                        width: PIN_BOX.width,
                        height: PIN_BOX.height,
                        background: '#2b2b2b',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        letterSpacing: 4,
                        color: theme.foreground,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {'*'.repeat(this.state.pin.length)}
                </div>
                {model.icon !== '' ? (
                    <div
                        data-status-icon=""
                        data-flashing={model.flashing ? '' : undefined}
                        style={{
                            position: 'absolute',
                            left: STATUS_ICON.left,
                            top: STATUS_ICON.top,
                            width: STATUS_ICON.size,
                            height: STATUS_ICON.size,
                            animation: model.flashing ? 'alarmFlash 1s step-end infinite' : undefined,
                        }}
                    >
                        <Icon
                            glyph={model.icon}
                            size={STATUS_ICON.size}
                            color={iconColor}
                        />
                    </div>
                ) : null}
                {this.renderKeys()}
                {this.renderButtons()}
                {model.cornerButton ? (
                    <div
                        data-corner={model.cornerButton.id}
                        data-pressable=""
                        onClick={(): void => press(model.cornerButton?.id ?? '', 'button')}
                        style={{ position: 'absolute', left: CORNER.left, top: CORNER.top }}
                    >
                        <Icon
                            glyph={model.cornerButton.icon}
                            size={CORNER.size}
                            color={color565ToCss(model.cornerButton.iconColor)}
                        />
                    </div>
                ) : null}
            </div>
        );
    }
}
