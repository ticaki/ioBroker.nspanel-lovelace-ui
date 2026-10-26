import React from 'react';
import { Icon } from '../../components/Icon';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupHeaderIconColor, popupTitle, snapToStep } from './fields';
import { PopupHeader, POPUP_FONT_SIZE, TAP_SIZE } from './PopupHeader';
import { Slider } from './Slider';
import type { PopupSliderModel, SliderRow } from './parse';

/** geometry of the HMI (stage pixels): three rows of 84 px, label at y 80, slider at y 114 */
const ROW_PITCH = 84;
const LABEL_CENTER_Y = 80;
const SLIDER_CENTER_Y = 114;
const LABEL_LEFT = 57;
const VALUE_LEFT = 195;
const MINUS_CENTER_X = 30;
const PLUS_CENTER_X = 418;
const SLIDER_LEFT = 65;
const SLIDER_LENGTH = 320;
const STEP_ICON_SIZE = 26;
/** the value is drawn grey on the HMI, the label in the text colour */
const VALUE_COLOR = '#b0b0b0';

/** Formats a value with the decimals of the step */
export function formatValue(value: number, step: number): string {
    const decimals = Math.min(10, (String(step).split('.')[1] ?? '').length);
    return value.toFixed(decimals);
}

/**
 * `popupSlider`: up to three horizontal sliders with heading, minus and plus button and
 * the current value. Every change is sent as `positionSliderN` with a value in `min..max`.
 */
export class PopupSlider extends React.Component<CardProps<PopupSliderModel>> {
    private send(row: SliderRow, value: number): void {
        const id = popupEntityId(this.props.ctx, this.props.model.entityName);
        this.props.press(id, `positionSlider${row.number}`, value);
    }

    private stepBy(row: SliderRow, direction: -1 | 1): void {
        const step = row.step > 0 ? row.step : 1;
        this.send(row, snapToStep(row.value + direction * step, row.min, row.max, step));
    }

    private renderStepButton(row: SliderRow, which: 'minus' | 'plus', centreX: number, top: number): React.JSX.Element {
        const glyph = which === 'minus' ? row.iconMinus : row.iconPlus;
        return (
            <div
                data-step={which}
                onClick={(): void => this.stepBy(row, which === 'minus' ? -1 : 1)}
                style={{
                    position: 'absolute',
                    left: centreX - TAP_SIZE / 2,
                    top: top + SLIDER_CENTER_Y - TAP_SIZE / 2,
                    width: TAP_SIZE,
                    height: TAP_SIZE,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                }}
            >
                {glyph ? (
                    <Icon
                        glyph={glyph}
                        size={STEP_ICON_SIZE}
                        color={theme.foreground}
                    />
                ) : null}
            </div>
        );
    }

    private renderRow(row: SliderRow, index: number): React.JSX.Element {
        const top = index * ROW_PITCH;
        const zeroRatio =
            row.zero !== undefined && row.max !== row.min ? (row.zero - row.min) / (row.max - row.min) : undefined;
        const knob = 14;
        return (
            <div
                key={row.number}
                data-slider-row={row.number}
                // the first row spans the header: only the step buttons and the slider take the
                // touches, the X stays reachable
                style={{ position: 'absolute', left: 0, right: 0, top, height: ROW_PITCH, pointerEvents: 'none' }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: LABEL_LEFT,
                        top: LABEL_CENTER_Y - 12,
                        maxWidth: VALUE_LEFT - LABEL_LEFT - 8,
                        height: 24,
                        lineHeight: '24px',
                        fontSize: POPUP_FONT_SIZE,
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {row.label}
                </div>
                <div
                    data-value=""
                    style={{
                        position: 'absolute',
                        left: VALUE_LEFT,
                        right: 60,
                        top: LABEL_CENTER_Y - 12,
                        height: 24,
                        lineHeight: '24px',
                        fontSize: POPUP_FONT_SIZE,
                        color: VALUE_COLOR,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                    }}
                >
                    {formatValue(row.value, row.step)}
                </div>
                {this.renderStepButton(row, 'minus', MINUS_CENTER_X, 0)}
                <div
                    style={{
                        position: 'absolute',
                        left: SLIDER_LEFT,
                        top: SLIDER_CENTER_Y - 11,
                        pointerEvents: 'auto',
                    }}
                >
                    {zeroRatio !== undefined && zeroRatio >= 0 && zeroRatio <= 1 ? (
                        <div
                            data-zero=""
                            style={{
                                position: 'absolute',
                                left: knob / 2 + zeroRatio * (SLIDER_LENGTH - knob) - 1,
                                top: 2,
                                width: 2,
                                height: 18,
                                background: theme.muted,
                            }}
                        />
                    ) : null}
                    <Slider
                        name={`slider${row.number}`}
                        value={row.value}
                        min={row.min}
                        max={row.max}
                        step={row.step}
                        length={SLIDER_LENGTH}
                        knobSize={knob}
                        onCommit={(v): void => this.send(row, v)}
                    />
                </div>
                {this.renderStepButton(row, 'plus', PLUS_CENTER_X, 0)}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx } = this.props;
        const id = popupEntityId(ctx, model.entityName);
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, background: theme.background, color: theme.foreground }}
            >
                {/* the payload carries neither icon nor colour: both come from the tapped entity */}
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    icon={ctx.pageArgs[2]}
                    iconColor={popupHeaderIconColor(ctx)}
                    onClose={(): void => this.props.press(id, 'bExit')}
                />
                {model.sliders.map((row, i) => this.renderRow(row, i))}
            </div>
        );
    }
}
