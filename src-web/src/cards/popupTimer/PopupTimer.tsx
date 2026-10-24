import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { clampTime, pad2, type PopupTimerModel, type TimerButton } from './parse';

const HEAD_HEIGHT = 60;
const BUTTON_HEIGHT = 56;
/** RGB565 of the number being edited in the HMI (`n1.pco=63488`) */
const EDIT_COLOR = color565ToCss(63488);
/** the +/- steps of the HMI (bZ1..bZ4) */
const STEPS = [1, 5, 10, 15] as const;

type EditField = 'minutes' | 'seconds' | undefined;

interface PopupTimerState {
    minutes: number;
    seconds: number;
    /** the number that is being edited (shown in red, +/- visible) */
    edit: EditField;
}

/**
 * The timer popup: icon and X at the top, `MM:SS` in the middle and up to three action
 * buttons at the bottom. When `editable`, a tap on minutes or seconds marks the number
 * (red) and shows +/- 1, 5, 10, 15 instead of the buttons; a second tap finishes the
 * edit and sends the new time.
 *
 * Events: button -> `event,buttonPress2,<id>,timer-<action>`; end of an edit ->
 * `event,buttonPress2,<id>,timer-start,00:<m>:<s>`; X -> `event,buttonPress2,popupTimer,bExit`.
 */
export class PopupTimer extends React.Component<CardProps<PopupTimerModel>, PopupTimerState> {
    constructor(props: CardProps<PopupTimerModel>) {
        super(props);
        this.state = { minutes: props.model.minutes, seconds: props.model.seconds, edit: undefined };
    }

    /** every payload overwrites the numbers, like `n1.val` / `n2.val` of the HMI */
    componentDidUpdate(prevProps: CardProps<PopupTimerModel>): void {
        const { model } = this.props;
        if (model.updates !== prevProps.model.updates) {
            this.setState({
                minutes: model.minutes,
                seconds: model.seconds,
                edit: model.editable ? this.state.edit : undefined,
            });
        }
    }

    private readonly close = (): void => {
        this.props.press('popupTimer', 'bExit');
    };

    private toggleEdit(fieldName: 'minutes' | 'seconds'): void {
        if (!this.props.model.editable) {
            return;
        }
        if (this.state.edit === fieldName) {
            // leaving the edit mode sends the time (fToggleEdit of the HMI)
            this.setState({ edit: undefined });
            this.props.press(
                this.props.model.entityName,
                'timer-start',
                `00:${this.state.minutes}:${this.state.seconds}`,
            );
        } else {
            this.setState({ edit: fieldName });
        }
    }

    private step(delta: number): void {
        const { edit } = this.state;
        if (edit === 'minutes') {
            this.setState({ minutes: clampTime(this.state.minutes + delta) });
        } else if (edit === 'seconds') {
            this.setState({ seconds: clampTime(this.state.seconds + delta) });
        }
    }

    private renderNumber(fieldName: 'minutes' | 'seconds'): React.JSX.Element {
        const editing = this.state.edit === fieldName;
        return (
            <div
                data-field={fieldName}
                style={{
                    color: editing ? EDIT_COLOR : theme.foreground,
                    cursor: this.props.model.editable ? 'pointer' : 'default',
                    padding: '0 6px',
                }}
                onClick={(): void => this.toggleEdit(fieldName)}
            >
                {pad2(this.state[fieldName])}
            </div>
        );
    }

    private renderStepButton(delta: number): React.JSX.Element {
        return (
            <div
                key={delta}
                data-step={delta}
                style={{
                    flex: '1 1 0',
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.foreground,
                    fontSize: 24,
                    cursor: 'pointer',
                }}
                onClick={(): void => this.step(delta)}
            >
                <Icon
                    name={delta > 0 ? 'plus' : 'minus'}
                    size={22}
                    color={theme.foreground}
                />
                <span style={{ marginLeft: 2 }}>{Math.abs(delta)}</span>
            </div>
        );
    }

    private renderActionButton(button: TimerButton, index: number): React.JSX.Element {
        const visible = button.action !== '';
        const disabled = button.action === 'disable';
        return (
            <div
                key={index}
                data-button={`b${index + 1}`}
                style={{
                    flex: '1 1 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: disabled ? theme.muted : theme.foreground,
                    fontSize: 26,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: visible ? 'pointer' : 'default',
                    visibility: visible ? 'visible' : 'hidden',
                }}
                onClick={
                    visible
                        ? (): void => this.props.press(this.props.model.entityName, `timer-${button.action}`)
                        : undefined
                }
            >
                {button.label}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx } = this.props;
        const title = ctx.pageArgs[1] ?? '';
        const editing = this.state.edit !== undefined;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, overflow: 'hidden' }}
            >
                <div
                    data-head=""
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: HEAD_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 16,
                    }}
                >
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon
                            glyph={model.icon || undefined}
                            name={model.icon ? undefined : 'timer-outline'}
                            size={36}
                            color={color565ToCss(model.iconColor)}
                        />
                    </div>
                    <div
                        style={{
                            flex: '1 1 auto',
                            marginLeft: 36,
                            color: theme.foreground,
                            fontSize: 26,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {title}
                    </div>
                    <div
                        data-close=""
                        style={{
                            width: 48,
                            height: 48,
                            marginRight: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={this.close}
                    >
                        <Icon
                            name="close"
                            size={32}
                            color={theme.foreground}
                        />
                    </div>
                </div>
                <div
                    data-time=""
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: HEAD_HEIGHT + 10,
                        height: 110,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 96,
                        lineHeight: '110px',
                        fontWeight: 300,
                        letterSpacing: 2,
                    }}
                >
                    {this.renderNumber('minutes')}
                    <div style={{ color: theme.foreground, padding: '0 2px 8px' }}>:</div>
                    {this.renderNumber('seconds')}
                </div>
                {editing ? (
                    <div
                        data-steps=""
                        style={{
                            position: 'absolute',
                            left: 24,
                            right: 24,
                            top: HEAD_HEIGHT + 130,
                            bottom: 8,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <div style={{ display: 'flex' }}>{STEPS.map(s => this.renderStepButton(s))}</div>
                        <div style={{ display: 'flex' }}>{STEPS.map(s => this.renderStepButton(-s))}</div>
                    </div>
                ) : (
                    <div
                        data-buttons=""
                        style={{
                            position: 'absolute',
                            left: 24,
                            right: 24,
                            bottom: 0,
                            height: BUTTON_HEIGHT,
                            display: 'flex',
                            alignItems: 'stretch',
                        }}
                    >
                        {model.buttons.map((b, i) => this.renderActionButton(b, i))}
                    </div>
                )}
            </div>
        );
    }
}
