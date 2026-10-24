import React from 'react';
import { Icon } from '../../components/Icon';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { popupEntityId, popupTitle, snapToStep } from './fields';
import { PopupHeader, POPUP_HEADER_HEIGHT } from './PopupHeader';
import { Slider } from './Slider';
import type { PopupSliderModel, SliderRow } from './parse';

const ROW_HEIGHT = 82;
const SLIDER_LENGTH = 300;

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

    private renderRow(row: SliderRow, index: number): React.JSX.Element {
        const top = POPUP_HEADER_HEIGHT + 2 + index * ROW_HEIGHT;
        const zeroRatio =
            row.zero !== undefined && row.max !== row.min ? (row.zero - row.min) / (row.max - row.min) : undefined;
        return (
            <div
                key={row.number}
                data-slider-row={row.number}
                style={{ position: 'absolute', left: 20, right: 20, top, height: ROW_HEIGHT }}
            >
                <div style={{ fontSize: 18, color: theme.foreground, height: 26, lineHeight: '26px' }}>{row.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', height: 48 }}>
                    <div
                        data-step="minus"
                        onClick={(): void => this.stepBy(row, -1)}
                        style={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        {row.iconMinus ? (
                            <Icon
                                glyph={row.iconMinus}
                                size={32}
                                color={theme.foreground}
                            />
                        ) : null}
                    </div>
                    <div style={{ position: 'relative', margin: '0 6px' }}>
                        {zeroRatio !== undefined && zeroRatio >= 0 && zeroRatio <= 1 ? (
                            <div
                                data-zero=""
                                style={{
                                    position: 'absolute',
                                    left: 8 + zeroRatio * (SLIDER_LENGTH - 16) - 1,
                                    top: 2,
                                    width: 2,
                                    height: 20,
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
                            onCommit={(v): void => this.send(row, v)}
                        />
                    </div>
                    <div
                        data-step="plus"
                        onClick={(): void => this.stepBy(row, 1)}
                        style={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        {row.iconPlus ? (
                            <Icon
                                glyph={row.iconPlus}
                                size={32}
                                color={theme.foreground}
                            />
                        ) : null}
                    </div>
                    <div
                        data-value=""
                        style={{
                            flex: '1 1 auto',
                            textAlign: 'right',
                            fontSize: 20,
                            color: theme.foreground,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {formatValue(row.value, row.step)}
                    </div>
                </div>
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
                <PopupHeader
                    title={popupTitle(ctx, model.entityName)}
                    onClose={(): void => this.props.press(id, 'bExit')}
                />
                {model.sliders.map((row, i) => this.renderRow(row, i))}
            </div>
        );
    }
}
