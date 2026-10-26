import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { clampTemp, formatTenths, type CardThermoModel, type ThermoAction } from './parse';

/**
 * The HMI collects plus/minus presses in a timer (`tmSendTemp`) and sends one
 * `tempUpd` after the last press; this is the delay of that timer in the web panel.
 */
export const SEND_DELAY_MS = 700;

interface CardThermoState {
    /** target changed by the user and not yet confirmed by an `entityUpd`, *10 */
    dst: number | undefined;
    /** second target (heat/cool), *10 */
    dst2: number | undefined;
}

const INACTIVE_COLOR = theme.muted;

/*
 * Geometry measured on the emulator picture of the HMI (480x320, stage pixels).
 */

/** the two text boxes on the left: label and value centred in a column 0..140 */
const TEXT_BOX = { left: 0, width: 140, fontSize: 17, lineHeight: 20 } as const;
/** tops of label 1, value 1, label 2, value 2 */
const TEXT_TOPS = [90, 124, 159, 192] as const;

/** y centre of the target temperature and its arrows */
const TARGET_Y = 163;
/** single target: x centre of the digits, arrow down left of it, arrow up right of it */
const TARGET_X = 277;
const ARROW_DOWN_X = 173;
const ARROW_UP_X = 401;
/** the chevrons of the HMI are big: 33 px wide */
const ARROW_SIZE = 68;
const ARROW_HIT = 72;
const DIGITS_FONT = 62;
const UNIT_FONT = 18;

/** two targets (heat/cool): x centres of the two groups, each with its own arrows */
const DUAL_X = [228, 390] as const;
const DUAL_ARROW_OFFSET = 68;
const DUAL_ARROW_SIZE = 40;
const DUAL_DIGITS_FONT = 32;
const DUAL_UNIT_FONT = 13;
/** compact: the digits move left so that digits and unit together are centred */
const DUAL_DIGITS_SHIFT = -8;

/** the three dots of the detail button (opens popupThermo), centred under the digits */
const DETAIL = { x: 278, y: 224, size: 42, hit: 48 } as const;

/** 8 fixed slots of 54 px for the hvac mode icons, 8 px from the left edge */
const ACTION_LEFT = 8;
const ACTION_CELL = 54;
const ACTION_TOP = 252;
const ACTION_HEIGHT = 56;
const ACTION_ICON_SIZE = 44;

/**
 * cardThermo: the classic thermostat. Two text boxes on the left (label + value, e.g.
 * `Currently` and `State`), a large target temperature in the centre right with the arrow
 * down left of it and the arrow up right of it (two smaller groups with `temp2`), the
 * detail button (three dots) below the digits and 8 fixed slots for the hvac mode icons
 * in the bottom row.
 */
export class CardThermo extends React.Component<CardProps<CardThermoModel>, CardThermoState> {
    state: CardThermoState = { dst: undefined, dst2: undefined };
    private sendTimer: number | undefined;

    componentDidUpdate(prev: CardProps<CardThermoModel>): void {
        if (prev.model !== this.props.model && (this.state.dst !== undefined || this.state.dst2 !== undefined)) {
            // the adapter confirmed (or overrode) the value - show what it sent
            this.setState({ dst: undefined, dst2: undefined });
        }
    }

    componentWillUnmount(): void {
        this.clearTimer();
    }

    private clearTimer(): void {
        if (this.sendTimer !== undefined) {
            window.clearTimeout(this.sendTimer);
            this.sendTimer = undefined;
        }
    }

    private get dst(): number {
        return this.state.dst ?? this.props.model.dstTemp;
    }

    private get dst2(): number {
        return this.state.dst2 ?? this.props.model.temp2 ?? 0;
    }

    /** sends `tempUpd,<dst>` or `tempUpdHighLow,<dst>|<dst2>` after {@link SEND_DELAY_MS} */
    private scheduleSend(): void {
        this.clearTimer();
        this.sendTimer = window.setTimeout(() => {
            this.sendTimer = undefined;
            const { model, press } = this.props;
            if (model.temp2 === undefined) {
                press(model.id, 'tempUpd', this.dst);
            } else {
                press(model.id, 'tempUpdHighLow', `${this.dst}|${this.dst2}`);
            }
        }, SEND_DELAY_MS);
    }

    private readonly step = (which: 1 | 2, direction: 1 | -1): void => {
        const { minTemp, maxTemp, tempStep } = this.props.model;
        const current = which === 1 ? this.dst : this.dst2;
        const next = clampTemp(current + direction * tempStep, minTemp, maxTemp);
        if (next === current) {
            return;
        }
        if (which === 1) {
            this.setState({ dst: next });
        } else {
            this.setState({ dst2: next });
        }
        this.scheduleSend();
    };

    private readonly onAction = (action: ThermoAction): void => {
        this.props.press(this.props.model.id, 'hvac_action', action.id);
    };

    private readonly onDetail = (): void => {
        this.props.openPopup('popupThermo', this.props.model.id, this.props.model.title);
    };

    /** one line of the left column, centred like the text boxes of the HMI */
    private renderText(text: string, top: number, key: string): React.JSX.Element {
        return (
            <div
                key={key}
                data-thermo-text={key}
                style={{
                    position: 'absolute',
                    left: TEXT_BOX.left,
                    top,
                    width: TEXT_BOX.width,
                    fontSize: TEXT_BOX.fontSize,
                    lineHeight: `${TEXT_BOX.lineHeight}px`,
                    textAlign: 'center',
                    color: theme.foreground,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                }}
            >
                {text}
            </div>
        );
    }

    private renderArrow(
        which: 1 | 2,
        direction: 1 | -1,
        centerX: number,
        size: number,
        hit: number,
    ): React.JSX.Element {
        return (
            <div
                data-pressable=""
                data-thermo-button={`${which}${direction > 0 ? 'up' : 'down'}`}
                style={{
                    position: 'absolute',
                    left: centerX - hit / 2,
                    top: TARGET_Y - hit / 2,
                    width: hit,
                    height: hit,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={(): void => this.step(which, direction)}
            >
                <Icon
                    name={direction > 0 ? 'chevron-up' : 'chevron-down'}
                    size={size}
                    color={theme.foreground}
                />
            </div>
        );
    }

    /**
     * A target temperature: the digits centred at `centerX`, the unit top aligned right of them,
     * the arrow down left and the arrow up right of the group.
     *
     * @param which 1 = `dstTemp` (`btUp`/`btDown`), 2 = `temp2` (`bUp2`/`bDown2`)
     * @param centerX x of the digits' centre in stage pixels
     * @param arrows x centres of the arrow down and the arrow up
     * @param compact smaller digits when two targets share the width
     */
    private renderTarget(
        which: 1 | 2,
        centerX: number,
        arrows: readonly [number, number],
        compact: boolean,
    ): React.JSX.Element {
        const value = which === 1 ? this.dst : this.dst2;
        const { unit } = this.props.model;
        const digitsFont = compact ? DUAL_DIGITS_FONT : DIGITS_FONT;
        const unitFont = compact ? DUAL_UNIT_FONT : UNIT_FONT;
        const arrowSize = compact ? DUAL_ARROW_SIZE : ARROW_SIZE;
        const arrowHit = compact ? DUAL_ARROW_SIZE + 8 : ARROW_HIT;
        const height = Math.round(digitsFont * 1.15);
        return (
            <React.Fragment key={which}>
                {this.renderArrow(which, -1, arrows[0], arrowSize, arrowHit)}
                <div
                    data-thermo-target={which}
                    style={{
                        position: 'absolute',
                        left: centerX + (compact ? DUAL_DIGITS_SHIFT : 0),
                        top: TARGET_Y - height / 2,
                        width: 0,
                        height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'visible',
                    }}
                >
                    <span
                        style={{
                            fontSize: digitsFont,
                            // the big digits of the HMI are bold
                            fontWeight: 700,
                            lineHeight: 1,
                            color: theme.foreground,
                            whiteSpace: 'nowrap',
                            position: 'relative',
                        }}
                    >
                        {formatTenths(value)}
                        <span
                            data-thermo-unit=""
                            style={{
                                position: 'absolute',
                                left: '100%',
                                top: compact ? 2 : 4,
                                marginLeft: compact ? 3 : 6,
                                fontSize: unitFont,
                                fontWeight: 400,
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {unit}
                        </span>
                    </span>
                </div>
                {this.renderArrow(which, 1, arrows[1], arrowSize, arrowHit)}
            </React.Fragment>
        );
    }

    private renderActions(actions: ThermoAction[]): React.JSX.Element {
        return (
            <div
                data-thermo-actions=""
                style={{
                    position: 'absolute',
                    left: ACTION_LEFT,
                    top: ACTION_TOP,
                    height: ACTION_HEIGHT,
                    display: 'flex',
                }}
            >
                {actions.map((action, i) => (
                    <div
                        key={i}
                        data-pressable={action.icon === '' ? undefined : ''}
                        data-thermo-action={i}
                        style={{
                            width: ACTION_CELL,
                            height: ACTION_HEIGHT,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            visibility: action.icon === '' ? 'hidden' : 'visible',
                        }}
                        onClick={action.icon === '' ? undefined : (): void => this.onAction(action)}
                    >
                        <Icon
                            glyph={action.icon}
                            size={ACTION_ICON_SIZE}
                            color={action.active ? color565ToCss(action.color) : INACTIVE_COLOR}
                        />
                    </div>
                ))}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const dual = model.temp2 !== undefined;
        return (
            <div
                data-page={ctx.pageType}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: theme.background,
                    color: theme.foreground,
                    fontFamily: theme.fontFamily,
                    overflow: 'hidden',
                }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                />
                {this.renderText(model.curTempLabel, TEXT_TOPS[0], 'label1')}
                {this.renderText(model.currentTemp, TEXT_TOPS[1], 'value1')}
                {this.renderText(model.stateLabel, TEXT_TOPS[2], 'label2')}
                {this.renderText(model.status, TEXT_TOPS[3], 'value2')}
                {dual
                    ? DUAL_X.map((x, i) =>
                          this.renderTarget(i === 0 ? 1 : 2, x, [x - DUAL_ARROW_OFFSET, x + DUAL_ARROW_OFFSET], true),
                      )
                    : this.renderTarget(1, TARGET_X, [ARROW_DOWN_X, ARROW_UP_X], false)}
                {model.detail ? (
                    <div
                        data-pressable=""
                        data-thermo-detail=""
                        style={{
                            position: 'absolute',
                            left: DETAIL.x - DETAIL.hit / 2,
                            top: DETAIL.y - DETAIL.hit / 2,
                            width: DETAIL.hit,
                            height: DETAIL.hit,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onClick={this.onDetail}
                    >
                        <Icon
                            name="dots-vertical"
                            size={DETAIL.size}
                            color={theme.foreground}
                        />
                    </div>
                ) : null}
                {this.renderActions(model.actions)}
            </div>
        );
    }
}
