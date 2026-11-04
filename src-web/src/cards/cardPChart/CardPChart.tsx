import React from 'react';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { layoutPie, type LegendRow, type PieLayout, type PieSector, type TextBox } from './layout';
import type { PieModel } from './parse';

/** font size of the legend texts in stage pixels (the small HMI font) */
const LEGEND_FONT = 16;

/**
 * Pie chart (`cardPChart`), drawn as SVG with the geometry of the HMI: the pie on the left, started at
 * 12 o'clock clockwise, the legend to the right with one 40 px row per slice. Title and legend use the
 * normal text colour. Nothing on this card sends events besides the navigation.
 */
export class CardPChart extends React.Component<CardProps<PieModel>> {
    private renderSector(sector: PieSector, layout: PieLayout): React.JSX.Element {
        const fill = color565ToCss(sector.color);
        if (sector.full) {
            return (
                <circle
                    key={sector.index}
                    data-pie-sector={sector.index}
                    cx={layout.centre.x}
                    cy={layout.centre.y}
                    r={layout.radius}
                    fill={fill}
                />
            );
        }
        return (
            <path
                key={sector.index}
                data-pie-sector={sector.index}
                d={sector.path}
                fill={fill}
            />
        );
    }

    /**
     * A text in its box: a nested svg clips what does not fit at the right edge, like the fixed text
     * boxes of the HMI - no wrapping.
     */
    private renderTextBox(box: TextBox, role: string, textColor: string): React.JSX.Element {
        if (box.w <= 0) {
            return <React.Fragment key={role} />;
        }
        return (
            <svg
                key={role}
                data-legend={role}
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                overflow="hidden"
            >
                <text
                    x={box.align === 'right' ? box.w : 0}
                    y={box.h / 2}
                    fill={textColor}
                    fontSize={LEGEND_FONT}
                    fontFamily={theme.fontFamily}
                    textAnchor={box.align === 'right' ? 'end' : 'start'}
                    dominantBaseline="central"
                    style={{ whiteSpace: 'pre', userSelect: 'none' }}
                >
                    {box.text}
                </text>
            </svg>
        );
    }

    private renderLegendRow(row: LegendRow, textColor: string): React.JSX.Element {
        return (
            <g
                key={row.index}
                data-legend-row={row.index}
            >
                <rect
                    x={row.swatch.x}
                    y={row.swatch.y}
                    width={row.swatch.w}
                    height={row.swatch.h}
                    fill={color565ToCss(row.color)}
                />
                {this.renderTextBox(row.name, 'name', textColor)}
                {row.value ? this.renderTextBox(row.value, 'value', textColor) : null}
                {row.percent ? this.renderTextBox(row.percent, 'percent', textColor) : null}
            </g>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const stage = stageSize(global.model);
        const textColor = color565ToCss(global.dim.text, theme.foreground);
        const background = color565ToCss(global.dim.background, theme.background);
        const layout = model.received ? layoutPie(model, stage) : undefined;
        return (
            <div
                data-page={ctx.pageType}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background,
                    color: textColor,
                    fontFamily: theme.fontFamily,
                    overflow: 'hidden',
                }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                    titleColor={textColor}
                />
                {layout ? (
                    <svg
                        data-chart="pie"
                        width={stage.width}
                        height={stage.height}
                        viewBox={`0 0 ${stage.width} ${stage.height}`}
                        // the svg spans the whole stage and would swallow the touches of the title bar
                        style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                    >
                        {layout.sectors.map(sector => this.renderSector(sector, layout))}
                        {model.noData ? (
                            <text
                                data-chart-nodata=""
                                x={layout.centre.x}
                                y={layout.centre.y}
                                fill={textColor}
                                fontSize={24}
                                fontFamily={theme.fontFamily}
                                textAnchor="middle"
                                dominantBaseline="central"
                            >
                                No Data
                            </text>
                        ) : null}
                        {layout.legend.map(row => this.renderLegendRow(row, textColor))}
                    </svg>
                ) : null}
            </div>
        );
    }
}
