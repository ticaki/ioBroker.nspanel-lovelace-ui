import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { isEmptyEntity } from '../../protocol/split';
import type { Entity6, PanelModel } from '../../protocol/types';
import { isPortrait, stageSize, theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { Pressable } from '../cardEntities/shared/Pressable';
import { splitIconField } from '../cardEntities/shared/entityTypes';
import { HmiTextBox } from '../cardEntities/shared/widgets';
import { nextionFont } from '../../protocol/fonts';
import { entityPressProps } from '../cardMedia/entityPress';
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
/**
 * x of the ring centre: eu `p1` 125..325 (centre 225), us-l `p1` 140..340 - the us-l layout is
 * the eu layout shifted 15 px to the right (all components of cardThermo2, HMI 6.0.2).
 */
const CX_EU = 225;
const US_L_SHIFT = 15;
const CY = 165;
/** radius of the middle of the ring */
const R = 86;
const STROKE = 18;
const KNOB_R = 10;
/** bounding box of the svg: centre +- (R + STROKE) */
const RING_BOX = R + STROKE;
const SEGMENTS = 54;
const RING_GREY = '#3a3a3a';
/** a page item component of the HMI: box in stage pixels and default font */
interface SlotBox {
    x: number;
    y: number;
    w: number;
    h: number;
    font: number;
}

/**
 * The page item buttons of cardThermo2 in `HMI/nspanel-v6.0.2.HMI` (eu): `bEntity1..4` left
 * column x 10, `bEntity5..8` right column x 341, y 72 / 129 / 186 / 243, 100 x 55, font 3;
 * `bPopup` (9th item) x 198 y 266, 55 x 40, font 1. All with xcen=1, ycen=1, isbr=0. The page
 * code resets `.font` to these defaults on every `entityUpd` and sets the `¬<n>` font instead.
 * us-l: the same boxes 15 px to the right. The other models: {@link thermo2Geometry}.
 */
export const SLOT_BOXES: readonly SlotBox[] = [
    ...[72, 129, 186, 243].map(y => ({ x: 10, y, w: 100, h: 55, font: 3 })),
    ...[72, 129, 186, 243].map(y => ({ x: 341, y, w: 100, h: 55, font: 3 })),
    { x: 198, y: 266, w: 55, h: 40, font: 1 },
];

/** geometry of cardThermo2 in stage pixels */
export interface Thermo2Geometry {
    /** centre of the ring */
    cx: number;
    cy: number;
    /** the 9 page item boxes */
    slots: readonly SlotBox[];
    /**
     * shrink a slot content that is wider or higher than its box until it fits (portrait: the
     * boxes are narrower than the HMI fonts); otherwise it is cut at the box like on the HMI
     */
    fit: boolean;
}

/** average advance of a Noto Sans character in em, used to estimate the width of a slot value */
const CHAR_ADVANCE_EM = 0.6;

/**
 * The factor (<= 1) a slot content has to be scaled with to fit into its box: the glyph and the
 * text of the field in the font of the field (`¬<n>`) or of the box, the width of the text
 * estimated with an average character advance.
 *
 * @param field the icon field of the slot
 * @param box the box of the slot
 */
export function slotFitScale(field: string, box: SlotBox): number {
    const { glyph, text, font } = splitIconField(field);
    const nf = nextionFont(font, box.font);
    const width = (glyph !== undefined ? nf.iconSize : 0) + [...text].length * nf.fontSize * CHAR_ADVANCE_EM;
    const height = Math.max(nf.px, glyph !== undefined ? nf.iconSize + nf.iconTop : 0);
    if (width <= 0) {
        return 1;
    }
    return Math.min(1, box.w / width, box.h / height);
}

/** offsets against the ring centre (eu: CY 165): mode text top, centre of -/+, top of the 9th item */
const MODE_TOP_FROM_CY = 73;
const BUTTONS_FROM_CY = 118;
const SLOT9_FROM_CY = 101;
/** distance of -/+ from the ring centre */
const BUTTONS_DX = 58;
/** the 9th item between minus and plus */
function slot9(cx: number, cy: number): SlotBox {
    return { x: Math.round(cx - 27), y: cy + SLOT9_FROM_CY, w: 55, h: 40, font: 1 };
}

/**
 * The layout of cardThermo2 per model, 9 slots everywhere. eu like the HMI ({@link SLOT_BOXES},
 * ring at 225/165), us-l the same 15 px to the right. web-l: the ring in the middle of the 607 px
 * content (x 305), 4 slots left (x 10), 4 right (x 500), the 9th below the ring. Portrait like
 * the us-p HMI: 4 slots of 80 px over the full width above the ring and 4 below it (80 px high on
 * web-p, 60 on us-p), the ring in the middle (x 160) with the 9th item between minus and plus;
 * the three blocks are spread with equal gaps over the height below the title bar, slot contents
 * wider than the box are shrunk into it ({@link slotFitScale}).
 *
 * @param model the panel model the card sees
 */
export function thermo2Geometry(model: PanelModel): Thermo2Geometry {
    const { width, height } = stageSize(model);
    if (isPortrait(model)) {
        // top row, ring block (ring, mode text, -/+ and the 9th item) and bottom row with equal
        // gaps over the height below the title bar
        const slotHeight = height >= 640 ? 80 : 60;
        const ringBlock = RING_BOX + BUTTONS_FROM_CY + 26;
        const gap = Math.floor((height - theme.titleBarHeight - 2 * slotHeight - ringBlock) / 4);
        const topY = theme.titleBarHeight + gap;
        const cy = topY + slotHeight + gap + RING_BOX;
        const bottomY = cy - RING_BOX + ringBlock + gap;
        const cx = width / 2;
        const slotWidth = Math.floor(width / 4);
        const row = (y: number): SlotBox[] =>
            [0, 1, 2, 3].map(i => ({ x: i * slotWidth, y, w: slotWidth, h: slotHeight, font: 3 }));
        return { cx, cy, slots: [...row(topY), ...row(bottomY), slot9(cx, cy)], fit: true };
    }
    if (model === 'web-l') {
        const cx = 305;
        const ys = [72, 129, 186, 243];
        return {
            cx,
            cy: CY,
            slots: [
                ...ys.map(y => ({ x: 10, y, w: 100, h: 55, font: 3 })),
                ...ys.map(y => ({ x: 500, y, w: 100, h: 55, font: 3 })),
                slot9(cx, CY),
            ],
            fit: false,
        };
    }
    const shift = model === 'us-l' ? US_L_SHIFT : 0;
    return { cx: CX_EU + shift, cy: CY, slots: SLOT_BOXES.map(b => ({ ...b, x: b.x + shift })), fit: false };
}

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

    private get geometry(): Thermo2Geometry {
        return thermo2Geometry(this.props.global.model);
    }

    /** x of the ring centre */
    private get cx(): number {
        return this.geometry.cx;
    }

    /** y of the ring centre */
    private get cy(): number {
        return this.geometry.cy;
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
                    left: this.cx - RING_BOX,
                    top: this.cy - RING_BOX,
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
                    left: this.cx - 70,
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
                    left: this.cx - 70,
                    width: 140,
                    top: this.cy - 26,
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

    /**
     * A page item around the ring. The icon field may carry a value instead of an icon and a
     * font id `¬<n>` (item option `textSize`), drawn like on the HMI by {@link HmiTextBox} in the box of the component.
     * Touch as in the HMI (`bEntity1..9`): a tap sends
     * `event,buttonPress2,<id>,button` (shutter, input_sel and timer open their popup instead),
     * holding a light, fan or number opens its popup - see {@link entityPressProps}.
     */
    private renderSlot(entity: Entity6, index: number): React.JSX.Element {
        const { slots, fit } = this.geometry;
        const box = slots[index];
        const empty = isEmptyEntity(entity) || entity.icon === '';
        const handlers = empty ? undefined : entityPressProps('cardThermo2', entity, this.props);
        // portrait: shrink the content into the box (the HMI fonts are wider than the 80 px boxes)
        const scale = fit && !empty ? slotFitScale(entity.icon, box) : 1;
        return (
            <Pressable
                key={index}
                data-role="thermo-slot"
                data-id={String(index)}
                {...handlers}
                style={{
                    position: 'absolute',
                    left: box.x,
                    top: box.y,
                    width: box.w,
                    height: box.h,
                    visibility: empty ? 'hidden' : 'visible',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: box.w / scale,
                        height: box.h / scale,
                        transform: scale < 1 ? `scale(${scale})` : undefined,
                        transformOrigin: 'top left',
                    }}
                >
                    <HmiTextBox
                        field={entity.icon}
                        color={color565ToCss(entity.iconColor)}
                        x={0}
                        y={0}
                        w={box.w / scale}
                        h={box.h / scale}
                        font={box.font}
                    />
                </div>
            </Pressable>
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
                    top: this.cy + BUTTONS_FROM_CY - 26,
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
        const { model, ctx, press, global } = this.props;
        const { cx, cy, slots } = this.geometry;
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
                    model={global.model}
                />
                {this.renderRing()}
                {this.renderLine(model.line1, cy - 55)}
                {this.renderTarget()}
                {this.renderLine(model.line2, cy + 25)}
                <div
                    data-thermo-mode=""
                    style={{
                        position: 'absolute',
                        left: cx - 100,
                        width: 200,
                        top: cy + MODE_TOP_FROM_CY,
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
                {this.renderStepButton(-1, cx - BUTTONS_DX)}
                {this.renderStepButton(1, cx + BUTTONS_DX)}
                {model.slots.slice(0, slots.length).map((slot, i) => this.renderSlot(slot, i))}
            </div>
        );
    }
}
