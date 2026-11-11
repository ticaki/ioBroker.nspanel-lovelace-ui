import React from 'react';
import { Icon } from '../../components/Icon';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupHeaderIconColor } from '../popupSlider/fields';
import { popupFrame, spreadCenters } from '../popupSlider/layout';
import { POPUP_FONT_SIZE, PopupHeader } from '../popupSlider/PopupHeader';
import { clampTime, pad2, type PopupTimerModel, type TimerButton } from './parse';

/** RGB565 of the number being edited in the HMI (`n1.pco=63488`) */
const EDIT_COLOR = color565ToCss(63488);
/** the +/- steps of the HMI (bZ1..bZ4) */
const STEPS = [1, 5, 10, 15] as const;

const DIGIT_COLOR = '#ffffff';
const BOX_COLOR = '#1e1e1e';

/** geometry of popupTimer in stage pixels */
export interface TimerGeometry {
    /** the two number boxes */
    digits: { top: number; width: number; height: number; minutesLeft: number; secondsLeft: number; fontSize: number };
    /** the colon is drawn as two squares */
    colon: { left: number; size: number; tops: [number, number] };
    /** the three action buttons */
    actions: { centersX: number[]; centerY: number; width: number };
    /** edit mode: four columns with an up box, the step label and a down box */
    steps: { centersX: number[]; size: number; upTop: number; downTop: number; labelCenterY: number };
    /** the current time at the bottom left */
    clock: { left: number; centerY: number; fontSize: number };
}

/**
 * The layout of popupTimer per model. Landscape like the HMI (eu: boxes of 132 x 111 at x 76
 * and 241, y 66; buttons centred at x 84/222/360, y 224; step columns at x 188..395), centred
 * on `web-l` (the clock stays at the left edge). Portrait (us-p, web-p): the numbers centred
 * (boxes of 120 x 111), the buttons in one row below them, the four step columns below the
 * numbers, the clock at the bottom left.
 *
 * @param model the panel model the popup sees
 */
export function timerGeometry(model: PanelModel): TimerGeometry {
    const { width, height, portrait, euLeft } = popupFrame(model);
    const clock = { left: 13, centerY: height - 26, fontSize: 36 };
    if (portrait) {
        const top = height >= 640 ? 140 : 90;
        const boxWidth = 120;
        const boxHeight = 111;
        const center = width / 2;
        const upTop = top + boxHeight + 20;
        return {
            digits: {
                top,
                width: boxWidth,
                height: boxHeight,
                minutesLeft: center - 14 - boxWidth,
                secondsLeft: center + 14,
                fontSize: 104,
            },
            colon: { left: center - 7, size: 14, tops: [top + 34, top + 74] },
            actions: { centersX: spreadCenters(3, 0, width), centerY: top + boxHeight + 60, width: 100 },
            steps: {
                centersX: spreadCenters(4, 16, width - 32),
                size: 50,
                upTop,
                downTop: upTop + 73,
                labelCenterY: upTop + 64,
            },
            clock,
        };
    }
    const x = (v: number): number => v + euLeft;
    return {
        digits: { top: 66, width: 132, height: 111, minutesLeft: x(76), secondsLeft: x(241), fontSize: 120 },
        colon: { left: x(218), size: 14, tops: [107, 154] },
        actions: { centersX: [84, 222, 360].map(x), centerY: 224, width: 138 },
        steps: { centersX: [188, 257, 326, 395].map(x), size: 50, upTop: 187, downTop: 260, labelCenterY: 251 },
        clock,
    };
}

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

    private get geometry(): TimerGeometry {
        return timerGeometry(this.props.global.model);
    }

    private renderNumber(fieldName: 'minutes' | 'seconds'): React.JSX.Element {
        const editing = this.state.edit === fieldName;
        const digits = this.geometry.digits;
        return (
            <div
                data-field={fieldName}
                style={{
                    position: 'absolute',
                    left: fieldName === 'minutes' ? digits.minutesLeft : digits.secondsLeft,
                    top: digits.top,
                    width: digits.width,
                    height: digits.height,
                    background: BOX_COLOR,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: digits.fontSize,
                    lineHeight: `${digits.height}px`,
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
        const steps = this.geometry.steps;
        const cx = steps.centersX[index] ?? 0;
        const box = (delta: number, top: number): React.JSX.Element => (
            <div
                data-step={delta}
                onClick={(): void => this.step(delta)}
                style={{
                    position: 'absolute',
                    left: cx - steps.size / 2,
                    top,
                    width: steps.size,
                    height: steps.size,
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
                {box(step, steps.upTop)}
                <div
                    style={{
                        position: 'absolute',
                        left: cx - steps.size / 2 - 8,
                        width: steps.size + 16,
                        top: steps.labelCenterY - 11,
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
                {box(-step, steps.downTop)}
            </React.Fragment>
        );
    }

    private renderActionButton(button: TimerButton, index: number): React.JSX.Element {
        const visible = button.action !== '';
        const disabled = button.action === 'disable';
        const actions = this.geometry.actions;
        const cx = actions.centersX[index] ?? 0;
        return (
            <div
                key={index}
                data-button={`b${index + 1}`}
                style={{
                    position: 'absolute',
                    left: cx - actions.width / 2,
                    width: actions.width,
                    top: actions.centerY - 22,
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
        const { colon, clock } = this.geometry;
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
                    model={global.model}
                />
                <div data-time="">
                    {this.renderNumber('minutes')}
                    {colon.tops.map(top => (
                        <div
                            key={top}
                            style={{
                                position: 'absolute',
                                left: colon.left,
                                top,
                                width: colon.size,
                                height: colon.size,
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
                        left: clock.left,
                        top: clock.centerY - 22,
                        height: 44,
                        lineHeight: '44px',
                        fontSize: clock.fontSize,
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
