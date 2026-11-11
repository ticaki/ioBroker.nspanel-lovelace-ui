import React from 'react';
import { Icon } from '../../components/Icon';
import type { PanelModel } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupHeaderIconColor, popupTitle, snapToStep } from './fields';
import { PopupHeader, POPUP_FONT_SIZE, TAP_SIZE } from './PopupHeader';
import { popupFrame } from './layout';
import { Slider } from './Slider';
import type { PopupSliderModel, SliderRow } from './parse';

/** geometry of a popupSlider row in stage pixels (relative to the row top) */
export interface SliderRowGeometry {
    /** distance of the rows; the first row starts at y 0 */
    rowPitch: number;
    labelCenterY: number;
    sliderCenterY: number;
    labelLeft: number;
    /** left edge of the value; `undefined` = right aligned at `valueRight` */
    valueLeft: number | undefined;
    valueRight: number;
    minusCenterX: number;
    plusCenterX: number;
    sliderLeft: number;
    sliderLength: number;
}

/**
 * The rows of popupSlider per model. Landscape like the HMI (eu: three rows of 84 px, label at
 * y 80, slider at y 114, minus 30 / plus 418, slider 65..385); on `web-l` the slider grows with
 * the stage (480 px). Portrait (us-p, web-p): label and value in one line, below it minus,
 * slider 200 px (x 60..260) and plus; the three rows share the height below the header.
 *
 * @param model the panel model the popup sees
 */
export function sliderRowGeometry(model: PanelModel): SliderRowGeometry {
    const { width, height, portrait } = popupFrame(model);
    if (portrait) {
        return {
            rowPitch: Math.min(160, Math.floor((height - 110) / 3)),
            labelCenterY: 100,
            sliderCenterY: 140,
            labelLeft: 24,
            valueLeft: undefined,
            valueRight: 24,
            minusCenterX: 30,
            plusCenterX: width - 30,
            sliderLeft: 60,
            sliderLength: width - 120,
        };
    }
    return {
        rowPitch: 84,
        labelCenterY: 80,
        sliderCenterY: 114,
        labelLeft: 57,
        valueLeft: 195,
        valueRight: 60,
        minusCenterX: 30,
        plusCenterX: width - 62,
        sliderLeft: 65,
        sliderLength: width - 160,
    };
}
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

    private get geometry(): SliderRowGeometry {
        return sliderRowGeometry(this.props.global.model);
    }

    private renderStepButton(row: SliderRow, which: 'minus' | 'plus', centreX: number, top: number): React.JSX.Element {
        const g = this.geometry;
        const glyph = which === 'minus' ? row.iconMinus : row.iconPlus;
        return (
            <div
                data-step={which}
                onClick={(): void => this.stepBy(row, which === 'minus' ? -1 : 1)}
                style={{
                    position: 'absolute',
                    left: centreX - TAP_SIZE / 2,
                    top: top + g.sliderCenterY - TAP_SIZE / 2,
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
        const g = this.geometry;
        const top = index * g.rowPitch;
        const zeroRatio =
            row.zero !== undefined && row.max !== row.min ? (row.zero - row.min) / (row.max - row.min) : undefined;
        const knob = 14;
        return (
            <div
                key={row.number}
                data-slider-row={row.number}
                // the first row spans the header: only the step buttons and the slider take the
                // touches, the X stays reachable
                style={{ position: 'absolute', left: 0, right: 0, top, height: g.rowPitch, pointerEvents: 'none' }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: g.labelLeft,
                        top: g.labelCenterY - 12,
                        maxWidth: (g.valueLeft ?? 200) - g.labelLeft - 8,
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
                        left: g.valueLeft,
                        right: g.valueRight,
                        top: g.labelCenterY - 12,
                        textAlign: g.valueLeft === undefined ? 'right' : 'left',
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
                {this.renderStepButton(row, 'minus', g.minusCenterX, 0)}
                <div
                    style={{
                        position: 'absolute',
                        left: g.sliderLeft,
                        top: g.sliderCenterY - 11,
                        pointerEvents: 'auto',
                    }}
                >
                    {zeroRatio !== undefined && zeroRatio >= 0 && zeroRatio <= 1 ? (
                        <div
                            data-zero=""
                            style={{
                                position: 'absolute',
                                left: knob / 2 + zeroRatio * (g.sliderLength - knob) - 1,
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
                        length={g.sliderLength}
                        knobSize={knob}
                        onCommit={(v): void => this.send(row, v)}
                    />
                </div>
                {this.renderStepButton(row, 'plus', g.plusCenterX, 0)}
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
                    model={this.props.global.model}
                />
                {model.sliders.map((row, i) => this.renderRow(row, i))}
            </div>
        );
    }
}
