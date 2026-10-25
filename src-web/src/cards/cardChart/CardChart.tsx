import React from 'react';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { barAt, highlightBar, layoutChart, plotFor, type ChartLayout, type Primitive } from './layout';
import type { ChartModel } from './parse';

interface CardChartState {
    /** touched bar (bar chart), -1 = none */
    selected: number;
}

/** font size of the small HMI font (ticks, x labels) in stage pixels */
const SMALL_FONT = 16;

/**
 * Bar chart (`cardChart`) and line chart (`cardLChart`), drawn as SVG with the geometry of the HMI.
 * Touching a bar highlights it and shows its value (local, like on the panel - no event is sent).
 */
export class CardChart extends React.Component<CardProps<ChartModel>, CardChartState> {
    private readonly svgRef = React.createRef<SVGSVGElement>();

    constructor(props: CardProps<ChartModel>) {
        super(props);
        this.state = { selected: -1 };
    }

    componentDidUpdate(prevProps: CardProps<ChartModel>): void {
        if (prevProps.model !== this.props.model && this.state.selected !== -1) {
            // every update reloads the page on the panel, the highlight is gone
            this.setState({ selected: -1 });
        }
    }

    private readonly onPlotClick = (event: React.MouseEvent<SVGRectElement>): void => {
        const svg = this.svgRef.current;
        const { model, global } = this.props;
        if (!svg || model.kind !== 'bar') {
            return;
        }
        const layout = layoutChart(model);
        if (!layout.bar) {
            return;
        }
        const rect = svg.getBoundingClientRect();
        const { width } = stageSize(global.model);
        const touchX = ((event.clientX - rect.left) * width) / Math.max(1, rect.width);
        this.setState({ selected: barAt(layout.bar, touchX, model.bars.length) });
    };

    private renderPrimitive(p: Primitive, index: number, textColor: string): React.JSX.Element {
        switch (p.kind) {
            case 'line': {
                // a Nextion line includes both end points: draw axis-parallel lines as 1 px rectangles
                if (p.x1 === p.x2 || p.y1 === p.y2) {
                    const x = Math.min(p.x1, p.x2);
                    const y = Math.min(p.y1, p.y2);
                    return (
                        <rect
                            key={index}
                            x={x}
                            y={y}
                            width={Math.abs(p.x2 - p.x1) + 1}
                            height={Math.abs(p.y2 - p.y1) + 1}
                            fill={color565ToCss(p.color)}
                        />
                    );
                }
                return (
                    <line
                        key={index}
                        x1={p.x1 + 0.5}
                        y1={p.y1 + 0.5}
                        x2={p.x2 + 0.5}
                        y2={p.y2 + 0.5}
                        stroke={color565ToCss(p.color)}
                        strokeWidth={1}
                    />
                );
            }
            case 'fill':
                if (p.w <= 0 || p.h <= 0) {
                    return <React.Fragment key={index} />;
                }
                return (
                    <rect
                        key={index}
                        x={p.x}
                        y={p.y}
                        width={p.w}
                        height={p.h}
                        fill={color565ToCss(p.color)}
                    />
                );
            case 'rect':
                return (
                    <rect
                        key={index}
                        x={Math.min(p.x1, p.x2) + 0.5}
                        y={Math.min(p.y1, p.y2) + 0.5}
                        width={Math.abs(p.x2 - p.x1)}
                        height={Math.abs(p.y2 - p.y1)}
                        fill="none"
                        stroke={color565ToCss(p.color)}
                        strokeWidth={1}
                    />
                );
            case 'text': {
                const cy = p.y + p.h / 2;
                const anchor = p.align === 'right' ? 'end' : p.align === 'center' ? 'middle' : 'start';
                const x = p.align === 'right' ? p.x + p.w : p.align === 'center' ? p.x + p.w / 2 : p.x;
                return (
                    <text
                        key={index}
                        x={x}
                        y={cy}
                        fill={textColor}
                        fontSize={SMALL_FONT}
                        fontFamily={theme.fontFamily}
                        textAnchor={p.rotated ? 'middle' : anchor}
                        dominantBaseline="central"
                        transform={p.rotated ? `rotate(-90 ${x - 8} ${cy})` : undefined}
                        style={{ shapeRendering: 'auto', userSelect: 'none' }}
                    >
                        {p.text}
                    </text>
                );
            }
            default:
                return <React.Fragment key={index} />;
        }
    }

    private renderValueBox(model: ChartModel, textColor: string, background: string): React.JSX.Element | null {
        const bar = model.bars[this.state.selected];
        if (!bar) {
            return null;
        }
        const plot = plotFor(model.kind);
        const value = (Math.abs(bar.value) / 10).toFixed(1);
        return (
            <text
                data-chart-value=""
                x={plot.x + plot.w - 4}
                y={plot.y + 10}
                fill={textColor}
                fontSize={20}
                fontFamily={theme.fontFamily}
                textAnchor="end"
                dominantBaseline="central"
                style={{ paintOrder: 'stroke', stroke: background, strokeWidth: 4, userSelect: 'none' }}
            >
                {value}
            </text>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const { width, height } = stageSize(global.model);
        const textColor = color565ToCss(global.dim.text, theme.foreground);
        const background = color565ToCss(global.dim.background, theme.background);
        const plot = plotFor(model.kind);
        const layout: ChartLayout = model.received ? layoutChart(model) : { primitives: [], bar: undefined };
        const highlight =
            layout.bar && this.state.selected !== -1 ? highlightBar(model, layout.bar, this.state.selected) : [];
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
                <svg
                    ref={this.svgRef}
                    data-chart={model.kind}
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    // the svg spans the whole stage and would swallow the touches of the title bar
                    // below it - only the plot area reacts
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        shapeRendering: 'crispEdges',
                        pointerEvents: 'none',
                    }}
                >
                    {layout.primitives.map((p, i) => this.renderPrimitive(p, i, textColor))}
                    {highlight.map((p, i) => this.renderPrimitive(p, i, textColor))}
                    {model.received && model.noData ? (
                        <text
                            data-chart-nodata=""
                            x={plot.x + 65 + (plot.w - 65) / 2}
                            y={plot.y + (plot.h - 24) / 2}
                            fill={textColor}
                            fontSize={24}
                            fontFamily={theme.fontFamily}
                            textAnchor="middle"
                            dominantBaseline="central"
                            style={{ shapeRendering: 'auto' }}
                        >
                            No Data
                        </text>
                    ) : null}
                    {this.renderValueBox(model, textColor, background)}
                    <rect
                        data-chart-plot=""
                        x={plot.x}
                        y={plot.y}
                        width={plot.w}
                        height={plot.h}
                        fill="transparent"
                        style={{ cursor: model.kind === 'bar' ? 'pointer' : 'default', pointerEvents: 'auto' }}
                        onClick={this.onPlotClick}
                    />
                </svg>
            </div>
        );
    }
}
