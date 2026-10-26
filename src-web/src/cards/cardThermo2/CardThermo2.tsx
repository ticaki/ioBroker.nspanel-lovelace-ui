import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { isEmptyEntity } from '../../protocol/split';
import type { Entity6 } from '../../protocol/types';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import {
    RING_START,
    RING_SWEEP,
    clampTemp,
    formatTenths,
    ringFraction,
    tempFromTouch,
    type CardThermo2Model,
    type ThermoInfoLine,
} from './parse';

/** delay of the `tmSendTemp` timer of the HMI: one `tempUpd` after the last change */
export const SEND_DELAY_MS = 700;
/** auto repeat of the plus/minus buttons (`repeat_tm` of the HMI: 500 ms, after 4 ticks 4x faster) */
const REPEAT_START_MS = 500;
const REPEAT_FAST_MS = 125;
const REPEAT_FAST_AFTER_TICKS = 4;

/** ring geometry in stage pixels */
const CX = 240;
const CY = 165;
/** radius of the middle of the ring */
const R = 86;
const STROKE = 18;
const KNOB_R = 10;
/** bounding box of the svg: centre +- (R + STROKE) */
const RING_BOX = R + STROKE;
const SEGMENTS = 54;
const RING_GREY = '#3a3a3a';

/** colour stops of the ring: blue (cold) over cyan and yellow to red (hot) */
const GRADIENT: readonly (readonly [number, [number, number, number]])[] = [
    [0, [31, 95, 224]],
    [0.3, [58, 184, 238]],
    [0.5, [247, 230, 124]],
    [0.68, [240, 138, 31]],
    [0.86, [227, 38, 26]],
    [1, [216, 30, 20]],
];

/** css colour of the ring gradient at fraction `f` (0..1) */
export function ringColor(f: number): string {
    const x = Math.min(1, Math.max(0, f));
    let lower = GRADIENT[0];
    let upper = GRADIENT[GRADIENT.length - 1];
    for (let i = 0; i < GRADIENT.length - 1; i++) {
        if (x >= GRADIENT[i][0] && x <= GRADIENT[i + 1][0]) {
            lower = GRADIENT[i];
            upper = GRADIENT[i + 1];
            break;
        }
    }
    const span = upper[0] - lower[0];
    const t = span === 0 ? 0 : (x - lower[0]) / span;
    const c = lower[1].map((v, i) => Math.round(v + (upper[1][i] - v) * t));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** point on the ring at svg angle `deg` (clockwise, 0 = right) and radius `r`, in svg coordinates */
function polar(deg: number, r: number): { x: number; y: number } {
    const rad = (deg * Math.PI) / 180;
    return { x: RING_BOX + r * Math.cos(rad), y: RING_BOX + r * Math.sin(rad) };
}

/** svg arc path along the ring from angle `from` to `to` (degrees, clockwise) */
function arcPath(from: number, to: number): string {
    const a = polar(from, R);
    const b = polar(to, R);
    const large = to - from > 180 ? 1 : 0;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

interface CardThermo2State {
    /** target changed by the user and not yet confirmed by an `entityUpd`, *10 */
    dst: number | undefined;
    dragging: boolean;
}

/**
 * cardThermo2: a ring with a colour gradient from min (bottom left) to max (bottom right),
 * the target in the centre with a value line above and below, the mode below the ring,
 * minus/plus buttons at the bottom and 4 + 4 + 1 slots for page items around it. The ring
 * can be dragged like on the display.
 */
export class CardThermo2 extends React.Component<CardProps<CardThermo2Model>, CardThermo2State> {
    state: CardThermo2State = { dst: undefined, dragging: false };
    private sendTimer: number | undefined;
    private repeatTimer: number | undefined;
    private repeatTicks = 0;
    private readonly svgRef = React.createRef<SVGSVGElement>();

    componentDidUpdate(prev: CardProps<CardThermo2Model>): void {
        if (prev.model !== this.props.model && this.state.dst !== undefined && !this.state.dragging) {
            this.setState({ dst: undefined });
        }
    }

    componentWillUnmount(): void {
        this.clearSendTimer();
        this.stopRepeat();
    }

    private get dst(): number {
        return this.state.dst ?? this.props.model.dstTemp;
    }

    private clearSendTimer(): void {
        if (this.sendTimer !== undefined) {
            window.clearTimeout(this.sendTimer);
            this.sendTimer = undefined;
        }
    }

    /** sends `tempUpd,<dst>` after {@link SEND_DELAY_MS} */
    private scheduleSend(): void {
        this.clearSendTimer();
        this.sendTimer = window.setTimeout(() => {
            this.sendTimer = undefined;
            this.props.press(this.props.model.id, 'tempUpd', this.dst);
        }, SEND_DELAY_MS);
    }

    private setTarget(value: number): void {
        const { minTemp, maxTemp } = this.props.model;
        const next = clampTemp(value, minTemp, maxTemp);
        if (next !== this.dst) {
            this.setState({ dst: next });
        }
    }

    private stepOnce(direction: 1 | -1): void {
        this.setTarget(this.dst + direction * this.props.model.tempStep);
    }

    // --- plus / minus with auto repeat -------------------------------------------------

    private startRepeat(direction: 1 | -1): void {
        this.stopRepeat();
        this.clearSendTimer();
        this.stepOnce(direction);
        this.repeatTicks = 0;
        const tick = (): void => {
            this.repeatTicks++;
            this.stepOnce(direction);
            const delay = this.repeatTicks >= REPEAT_FAST_AFTER_TICKS ? REPEAT_FAST_MS : REPEAT_START_MS;
            this.repeatTimer = window.setTimeout(tick, delay);
        };
        this.repeatTimer = window.setTimeout(tick, REPEAT_START_MS);
    }

    private stopRepeat(): void {
        if (this.repeatTimer !== undefined) {
            window.clearTimeout(this.repeatTimer);
            this.repeatTimer = undefined;
        }
    }

    private readonly onButtonDown = (direction: 1 | -1, e: React.PointerEvent<HTMLDivElement>): void => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        this.startRepeat(direction);
    };

    private readonly onButtonUp = (e: React.PointerEvent<HTMLDivElement>): void => {
        e.stopPropagation();
        if (this.repeatTimer !== undefined) {
            this.stopRepeat();
            this.scheduleSend();
        }
    };

    // --- ring drag ---------------------------------------------------------------------

    /** target for a pointer position, undefined when the svg is not mounted */
    private targetFromPointer(e: React.PointerEvent<SVGSVGElement>): number | undefined {
        const svg = this.svgRef.current;
        if (!svg) {
            return undefined;
        }
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return undefined;
        }
        // the stage is scaled with css transform, so map client -> svg units
        const x = ((e.clientX - rect.left) / rect.width) * (2 * RING_BOX);
        const y = ((e.clientY - rect.top) / rect.height) * (2 * RING_BOX);
        const { minTemp, maxTemp, tempStep } = this.props.model;
        return tempFromTouch(x - RING_BOX, y - RING_BOX, minTemp, maxTemp, tempStep);
    }

    private readonly onRingDown = (e: React.PointerEvent<SVGSVGElement>): void => {
        const value = this.targetFromPointer(e);
        if (value === undefined) {
            return;
        }
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        this.clearSendTimer();
        this.setState({ dragging: true });
        this.setTarget(value);
    };

    private readonly onRingMove = (e: React.PointerEvent<SVGSVGElement>): void => {
        if (!this.state.dragging) {
            return;
        }
        const value = this.targetFromPointer(e);
        if (value !== undefined) {
            this.setTarget(value);
        }
    };

    private readonly onRingUp = (): void => {
        if (this.state.dragging) {
            this.setState({ dragging: false });
            this.scheduleSend();
        }
    };

    // --- rendering ---------------------------------------------------------------------

    private renderRing(): React.JSX.Element {
        const { minTemp, maxTemp } = this.props.model;
        const fraction = ringFraction(this.dst, minTemp, maxTemp);
        const end = RING_START + RING_SWEEP;
        const knobAngle = RING_START + RING_SWEEP * fraction;
        const knob = polar(knobAngle, R);
        const segments: React.JSX.Element[] = [];
        const coloured = Math.ceil(SEGMENTS * fraction);
        const segmentDeg = RING_SWEEP / SEGMENTS;
        for (let i = 0; i < coloured; i++) {
            const from = RING_START + i * segmentDeg;
            const to = Math.min(RING_START + (i + 1) * segmentDeg + 0.6, knobAngle + 0.6);
            if (to <= from) {
                break;
            }
            segments.push(
                <path
                    key={i}
                    d={arcPath(from, to)}
                    stroke={ringColor((i + 0.5) / SEGMENTS)}
                    strokeWidth={STROKE}
                    fill="none"
                />,
            );
        }
        const size = 2 * RING_BOX;
        return (
            <svg
                ref={this.svgRef}
                data-thermo-ring=""
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{
                    position: 'absolute',
                    left: CX - RING_BOX,
                    top: CY - RING_BOX,
                    touchAction: 'none',
                    cursor: 'pointer',
                }}
                onPointerDown={this.onRingDown}
                onPointerMove={this.onRingMove}
                onPointerUp={this.onRingUp}
                onPointerCancel={this.onRingUp}
            >
                <path
                    d={arcPath(RING_START, end)}
                    stroke={RING_GREY}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    fill="none"
                />
                {/* round start cap in the start colour, the segments have butt caps */}
                <path
                    d={arcPath(RING_START, RING_START + 1)}
                    stroke={ringColor(0)}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    fill="none"
                />
                {segments}
                <circle
                    cx={knob.x}
                    cy={knob.y}
                    r={KNOB_R}
                    fill="#ffffff"
                    stroke="#1a1a1a"
                    strokeWidth={2}
                />
            </svg>
        );
    }

    private renderLine(line: ThermoInfoLine, top: number): React.JSX.Element {
        return (
            <div
                style={{
                    position: 'absolute',
                    left: CX - 70,
                    width: 140,
                    top,
                    height: 30,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                {line.icon === '' ? null : (
                    <Icon
                        glyph={line.icon}
                        size={24}
                        color={color565ToCss(line.iconColor)}
                    />
                )}
                <span style={{ fontSize: 24, color: color565ToCss(line.valueColor), marginLeft: 4 }}>
                    {formatTenths(line.value)}
                </span>
                <span
                    style={{
                        fontSize: 15,
                        color: color565ToCss(line.unitColor),
                        marginLeft: 3,
                        alignSelf: 'flex-start',
                        marginTop: 2,
                    }}
                >
                    {line.unit}
                </span>
            </div>
        );
    }

    private renderTarget(): React.JSX.Element | null {
        const { unit, power } = this.props.model;
        if (!power) {
            return null;
        }
        return (
            <div
                style={{
                    position: 'absolute',
                    left: CX - 70,
                    width: 140,
                    top: CY - 26,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                }}
            >
                <span
                    data-thermo-target=""
                    style={{ fontSize: 44, fontWeight: 500, lineHeight: 1, color: theme.foreground }}
                >
                    {formatTenths(this.dst)}
                </span>
                <span
                    style={{
                        fontSize: 16,
                        color: theme.foreground,
                        marginLeft: 3,
                        alignSelf: 'flex-start',
                        marginTop: 4,
                    }}
                >
                    {unit}
                </span>
            </div>
        );
    }

    private renderSlot(entity: Entity6, index: number, x: number, y: number, size: number): React.JSX.Element {
        const empty = isEmptyEntity(entity) || entity.icon === '';
        return (
            <div
                key={index}
                data-pressable={empty ? undefined : ''}
                data-thermo-slot={index}
                style={{
                    position: 'absolute',
                    left: x - 26,
                    top: y - 26,
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    visibility: empty ? 'hidden' : 'visible',
                }}
                onClick={
                    empty ? undefined : (): void => this.props.press(this.props.model.id, 'hvac_action', entity.id)
                }
            >
                <Icon
                    glyph={entity.icon}
                    size={size}
                    color={color565ToCss(entity.iconColor)}
                />
            </div>
        );
    }

    private renderStepButton(direction: 1 | -1, x: number): React.JSX.Element {
        return (
            <div
                data-pressable=""
                data-thermo-button={direction > 0 ? 'plus' : 'minus'}
                style={{
                    position: 'absolute',
                    left: x - 26,
                    top: 283 - 26,
                    width: 52,
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    touchAction: 'none',
                }}
                onPointerDown={(e): void => this.onButtonDown(direction, e)}
                onPointerUp={this.onButtonUp}
                onPointerCancel={this.onButtonUp}
            >
                <Icon
                    name={direction > 0 ? 'plus-circle-outline' : 'minus-circle-outline'}
                    size={36}
                    color={theme.foreground}
                />
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        const rows = [95, 150, 205, 260];
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
                    userSelect: 'none',
                }}
            >
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                />
                {this.renderRing()}
                {this.renderLine(model.line1, CY - 55)}
                {this.renderTarget()}
                {this.renderLine(model.line2, CY + 25)}
                <div
                    data-thermo-mode=""
                    style={{
                        position: 'absolute',
                        left: CX - 100,
                        width: 200,
                        top: 238,
                        textAlign: 'center',
                        fontSize: 20,
                        color: color565ToCss(model.modeColor),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        pointerEvents: 'none',
                    }}
                >
                    {model.mode}
                </div>
                {this.renderStepButton(-1, CX - 58)}
                {this.renderStepButton(1, CX + 58)}
                {rows.map((y, i) => this.renderSlot(model.slots[i], i, 58, y, 40))}
                {rows.map((y, i) => this.renderSlot(model.slots[4 + i], 4 + i, 422, y, 40))}
                {this.renderSlot(model.slots[8], 8, CX, 283, 32)}
            </div>
        );
    }
}
