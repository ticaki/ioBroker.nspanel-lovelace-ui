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

const LABEL_COLOR = '#d0d0d0';
const INACTIVE_COLOR = theme.muted;

/**
 * cardThermo: the classic thermostat. Left two text boxes (label + value, e.g. `Currently`
 * and `State`), a large target temperature with up/down buttons in the centre right (two
 * of them with `temp2`), up to 8 hvac mode icons in the bottom row and an optional detail
 * button that opens `popupThermo`.
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

    private renderTextBox(label: string, value: string, top: number): React.JSX.Element {
        return (
            <div style={{ position: 'absolute', left: 16, top, width: 160 }}>
                <div
                    style={{
                        fontSize: 18,
                        color: LABEL_COLOR,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {label}
                </div>
                <div
                    style={{
                        fontSize: 22,
                        color: theme.foreground,
                        paddingLeft: 12,
                        marginTop: 2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {value}
                </div>
            </div>
        );
    }

    /**
     * A target temperature with the up/down buttons around it.
     *
     * @param which 1 = `dstTemp` (`btUp`/`btDown`), 2 = `temp2` (`bUp2`/`bDown2`)
     * @param centerX x of the column centre in stage pixels
     * @param compact smaller digits when two targets share the width
     */
    private renderTarget(which: 1 | 2, centerX: number, compact: boolean): React.JSX.Element {
        const value = which === 1 ? this.dst : this.dst2;
        const { unit } = this.props.model;
        const width = compact ? 128 : 180;
        const fontSize = compact ? 48 : 60;
        const button = (direction: 1 | -1, top: number): React.JSX.Element => (
            <div
                data-pressable=""
                data-thermo-button={`${which}${direction > 0 ? 'up' : 'down'}`}
                style={{
                    position: 'absolute',
                    left: (width - 48) / 2,
                    top,
                    width: 48,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onClick={(): void => this.step(which, direction)}
            >
                <Icon
                    name={direction > 0 ? 'chevron-up' : 'chevron-down'}
                    size={34}
                    color={theme.foreground}
                />
            </div>
        );
        return (
            <div style={{ position: 'absolute', left: centerX - width / 2, top: 64, width, height: 176 }}>
                {button(1, 0)}
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: 38,
                        height: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <span style={{ fontSize, fontWeight: 500, lineHeight: 1, color: theme.foreground }}>
                        {formatTenths(value)}
                    </span>
                    <span
                        style={{
                            fontSize: compact ? 16 : 20,
                            color: theme.foreground,
                            alignSelf: 'flex-start',
                            marginTop: compact ? 18 : 16,
                            marginLeft: 4,
                        }}
                    >
                        {unit}
                    </span>
                </div>
                {button(-1, 140)}
            </div>
        );
    }

    private renderActions(actions: ThermoAction[]): React.JSX.Element {
        const cell = 56;
        const left = (480 - cell * actions.length) / 2;
        return (
            <div style={{ position: 'absolute', left, top: 248, height: 56, display: 'flex' }}>
                {actions.map((action, i) => (
                    <div
                        key={i}
                        data-pressable={action.icon === '' ? undefined : ''}
                        data-thermo-action={i}
                        style={{
                            width: cell,
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            visibility: action.icon === '' ? 'hidden' : 'visible',
                        }}
                        onClick={action.icon === '' ? undefined : (): void => this.onAction(action)}
                    >
                        <Icon
                            glyph={action.icon}
                            size={38}
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
                {this.renderTextBox(model.curTempLabel, model.currentTemp, 70)}
                {this.renderTextBox(model.stateLabel, model.status, 150)}
                {dual ? (
                    <>
                        {this.renderTarget(1, 240, true)}
                        {this.renderTarget(2, 372, true)}
                    </>
                ) : (
                    this.renderTarget(1, 300, false)
                )}
                {model.detail ? (
                    <div
                        data-pressable=""
                        data-thermo-detail=""
                        style={{
                            position: 'absolute',
                            right: 2,
                            top: 100,
                            width: 44,
                            height: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onClick={this.onDetail}
                    >
                        <Icon
                            name="dots-vertical"
                            size={32}
                            color={theme.foreground}
                        />
                    </div>
                ) : null}
                {this.renderActions(model.actions)}
            </div>
        );
    }
}
