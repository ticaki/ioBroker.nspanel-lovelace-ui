import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { thermoLayout, type TargetGeometry, type TextBox, type ThermoLayout } from './layout';
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
/** label and value lines of the info block */
const TEXT_FONT = 17;
const TEXT_LINE = 20;

/**
 * cardThermo: the classic thermostat. Two text boxes on the left (label + value, e.g.
 * `Currently` and `State`), a large target temperature in the centre right with the arrow
 * down left of it and the arrow up right of it (two smaller groups with `temp2`), the
 * detail button (three dots) below the digits and 8 fixed slots for the hvac mode icons
 * in the bottom row. Portrait models get the layout of the us-p HMI (see `layout.ts`).
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
    private renderText(text: string, box: TextBox, key: string): React.JSX.Element {
        return (
            <div
                key={key}
                data-thermo-text={key}
                style={{
                    position: 'absolute',
                    left: box.left,
                    top: box.top,
                    width: box.width,
                    fontSize: TEXT_FONT,
                    lineHeight: `${TEXT_LINE}px`,
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
        centre: { x: number; y: number },
        size: number,
        hit: number,
    ): React.JSX.Element {
        return (
            <div
                data-pressable=""
                data-thermo-button={`${which}${direction > 0 ? 'up' : 'down'}`}
                style={{
                    position: 'absolute',
                    left: centre.x - hit / 2,
                    top: centre.y - hit / 2,
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
     * A target temperature: the digits centred at the centre of `geometry`, the unit top aligned
     * right of them, the arrow down and the arrow up where `geometry` puts them.
     *
     * @param which 1 = `dstTemp` (`btUp`/`btDown`), 2 = `temp2` (`bUp2`/`bDown2`)
     * @param geometry position and sizes of digits and arrows
     */
    private renderTarget(which: 1 | 2, geometry: TargetGeometry): React.JSX.Element {
        const value = which === 1 ? this.dst : this.dst2;
        const { unit } = this.props.model;
        const { digitsFont, unitFont, arrowSize, arrowHit } = geometry;
        const height = Math.round(digitsFont * 1.15);
        return (
            <React.Fragment key={which}>
                {this.renderArrow(which, -1, geometry.down, arrowSize, arrowHit)}
                <div
                    data-thermo-target={which}
                    style={{
                        position: 'absolute',
                        left: geometry.x + geometry.digitsShift,
                        top: geometry.y - height / 2,
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
                                top: geometry.unitTop,
                                marginLeft: geometry.unitGap,
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
                {this.renderArrow(which, 1, geometry.up, arrowSize, arrowHit)}
            </React.Fragment>
        );
    }

    private renderActions(actions: ThermoAction[], layout: ThermoLayout): React.JSX.Element {
        return (
            <div
                data-thermo-actions=""
                style={{ position: 'absolute', left: 0, top: 0 }}
            >
                {actions.map((action, i) => {
                    const cell = layout.actions[i];
                    if (cell === undefined) {
                        return null;
                    }
                    return (
                        <div
                            key={i}
                            data-pressable={action.icon === '' ? undefined : ''}
                            data-thermo-action={i}
                            style={{
                                position: 'absolute',
                                left: cell.x,
                                top: cell.y,
                                width: layout.actionWidth,
                                height: layout.actionHeight,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                visibility: action.icon === '' ? 'hidden' : 'visible',
                            }}
                            onClick={action.icon === '' ? undefined : (): void => this.onAction(action)}
                        >
                            <Icon
                                glyph={action.icon}
                                size={layout.actionIconSize}
                                color={action.active ? color565ToCss(action.color) : INACTIVE_COLOR}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const dual = model.temp2 !== undefined;
        const layout = thermoLayout(global.model);
        const { detail } = layout;
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
                    model={global.model}
                />
                {this.renderText(model.curTempLabel, layout.texts[0], 'label1')}
                {this.renderText(model.currentTemp, layout.texts[1], 'value1')}
                {this.renderText(model.stateLabel, layout.texts[2], 'label2')}
                {this.renderText(model.status, layout.texts[3], 'value2')}
                {dual
                    ? [this.renderTarget(1, layout.dual[0]), this.renderTarget(2, layout.dual[1])]
                    : this.renderTarget(1, layout.single)}
                {model.detail ? (
                    <div
                        data-pressable=""
                        data-thermo-detail=""
                        style={{
                            position: 'absolute',
                            left: detail.x - detail.hit / 2,
                            top: detail.y - detail.hit / 2,
                            width: detail.hit,
                            height: detail.hit,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onClick={this.onDetail}
                    >
                        <Icon
                            name="dots-vertical"
                            size={detail.size}
                            color={theme.foreground}
                        />
                    </div>
                ) : null}
                {this.renderActions(model.actions, layout)}
            </div>
        );
    }
}
