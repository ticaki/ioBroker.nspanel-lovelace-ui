import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupHeaderIconColor } from '../popupSlider/fields';
import { POPUP_FONT_SIZE, PopupHeader } from '../popupSlider/PopupHeader';
import { clampTime, pad2, type PopupTimerModel, type TimerButton } from './parse';

/** RGB565 of the number being edited in the HMI (`n1.pco=63488`) */
const EDIT_COLOR = color565ToCss(63488);
/** the +/- steps of the HMI (bZ1..bZ4) */
const STEPS = [1, 5, 10, 15] as const;

/** geometry of the HMI (stage pixels) */
const DIGIT_BOX = { top: 66, width: 132, height: 111, minutesLeft: 76, secondsLeft: 241 };
const DIGIT_FONT_SIZE = 120;
const DIGIT_COLOR = '#ffffff';
const BOX_COLOR = '#1e1e1e';
/** the colon is drawn as two squares */
const COLON = { left: 218, size: 14, tops: [107, 154] as const };
/** the three action buttons: centres at x 84/222/360, y 224 */
const ACTION_CENTERS_X = [84, 222, 360] as const;
const ACTION_CENTER_Y = 224;
const ACTION_WIDTH = 138;
/** edit mode: four columns with an up box, the step label and a down box */
const STEP_CENTERS_X = [188, 257, 326, 395] as const;
const STEP_BOX = { size: 50, upTop: 187, downTop: 260 };
const STEP_LABEL_CENTER_Y = 251;
/** the current time at the bottom left */
const CLOCK = { left: 13, centerY: 294, fontSize: 36 };

type EditField = 'minutes' | 'seconds' | undefined;

interface PopupTimerState {
    minutes: number;
    seconds: number;
    /** the number that is being edited (shown in red, +/- visible) */
    edit: EditField;
}

/**
 * The timer popup: icon, title and X at the top, `MM:SS` in two dark boxes, up to three
 * action buttons below and the time at the bottom left, like the HMI. When `editable`, a
 * tap on minutes or seconds marks the number (red) and shows the +/- 1, 5, 10, 15 columns
 * instead of the buttons; a second tap finishes the edit and sends the new time.
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
                    position: 'absolute',
                    left: fieldName === 'minutes' ? DIGIT_BOX.minutesLeft : DIGIT_BOX.secondsLeft,
                    top: DIGIT_BOX.top,
                    width: DIGIT_BOX.width,
                    height: DIGIT_BOX.height,
                    background: BOX_COLOR,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: DIGIT_FONT_SIZE,
                    lineHeight: `${DIGIT_BOX.height}px`,
                    fontWeight: 400,
                    color: editing ? EDIT_COLOR : DIGIT_COLOR,
                    cursor: this.props.model.editable ? 'pointer' : 'default',
                    userSelect: 'none',
                }}
                onClick={(): void => this.toggleEdit(fieldName)}
            >
                {pad2(this.state[fieldName])}
            </div>
        );
    }

    private renderStepColumn(step: number, index: number): React.JSX.Element {
        const cx = STEP_CENTERS_X[index] ?? 0;
        const box = (delta: number, top: number): React.JSX.Element => (
            <div
                data-step={delta}
                onClick={(): void => this.step(delta)}
                style={{
                    position: 'absolute',
                    left: cx - STEP_BOX.size / 2,
                    top,
                    width: STEP_BOX.size,
                    height: STEP_BOX.size,
                    background: BOX_COLOR,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                }}
            >
                <Icon
                    name={delta > 0 ? 'chevron-up' : 'chevron-down'}
                    size={34}
                    color={theme.foreground}
                />
            </div>
        );
        return (
            <React.Fragment key={step}>
                {box(step, STEP_BOX.upTop)}
                <div
                    style={{
                        position: 'absolute',
                        left: cx - STEP_BOX.size / 2 - 8,
                        width: STEP_BOX.size + 16,
                        top: STEP_LABEL_CENTER_Y - 11,
                        height: 22,
                        lineHeight: '22px',
                        textAlign: 'center',
                        fontSize: 16,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {`+/- ${step}`}
                </div>
                {box(-step, STEP_BOX.downTop)}
            </React.Fragment>
        );
    }

    private renderActionButton(button: TimerButton, index: number): React.JSX.Element {
        const visible = button.action !== '';
        const disabled = button.action === 'disable';
        const cx = ACTION_CENTERS_X[index] ?? 0;
        return (
            <div
                key={index}
                data-button={`b${index + 1}`}
                style={{
                    position: 'absolute',
                    left: cx - ACTION_WIDTH / 2,
                    width: ACTION_WIDTH,
                    top: ACTION_CENTER_Y - 22,
                    height: 44,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: disabled ? theme.muted : theme.accent,
                    fontSize: POPUP_FONT_SIZE,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: visible && !disabled ? 'pointer' : 'default',
                    visibility: visible ? 'visible' : 'hidden',
                }}
                onClick={
                    visible && !disabled
                        ? (): void => this.props.press(this.props.model.entityName, `timer-${button.action}`)
                        : undefined
                }
            >
                {button.label}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global } = this.props;
        const title = ctx.pageArgs[1] ?? '';
        const editing = this.state.edit !== undefined;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, overflow: 'hidden' }}
            >
                <PopupHeader
                    title={title}
                    icon={model.icon || ''}
                    // the payload carries the icon colour: it wins; until it arrives the colour of the
                    // tapped entity (pageArgs[3])
                    iconColor={popupHeaderIconColor(ctx, model.updates > 0 ? model.iconColor : undefined)}
                    onClose={this.close}
                />
                <div data-time="">
                    {this.renderNumber('minutes')}
                    {COLON.tops.map(top => (
                        <div
                            key={top}
                            style={{
                                position: 'absolute',
                                left: COLON.left,
                                top,
                                width: COLON.size,
                                height: COLON.size,
                                background: DIGIT_COLOR,
                            }}
                        />
                    ))}
                    {this.renderNumber('seconds')}
                </div>
                {editing ? (
                    <div data-steps="">{STEPS.map((s, i) => this.renderStepColumn(s, i))}</div>
                ) : (
                    <div data-buttons="">{model.buttons.map((b, i) => this.renderActionButton(b, i))}</div>
                )}
                <div
                    data-clock=""
                    style={{
                        position: 'absolute',
                        left: CLOCK.left,
                        top: CLOCK.centerY - 22,
                        height: 44,
                        lineHeight: '44px',
                        fontSize: CLOCK.fontSize,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                    }}
                >
                    {global.time}
                </div>
            </div>
        );
    }
}
