import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { MAX_SPEED, type CardPowerModel, type PowerSlot } from './parse';

/** the house in the middle */
const HOME = { left: 206, top: 68, width: 68, height: 244 } as const;
/** the square icon boxes of the items */
const SLOT_BOX = 58;
const SLOT_LEFT = 18;
const SLOT_RIGHT = 480 - SLOT_LEFT - SLOT_BOX;
/** y centre of the three rows (top, middle, bottom) */
const ROWS = [104, 186, 262] as const;
/** gap between a box and its flow line */
const LINE_GAP = 4;
const LINE_HEIGHT = 2;
const DOT_SIZE = 10;
const BOX_BORDER = '#3f6a99';
const LINE_COLOR = theme.accent;

/** seconds for one run of the dot: fast at |speed| = 120, slow at |speed| = 1 */
export function flowDuration(speed: number): number {
    const s = Math.min(Math.abs(speed), MAX_SPEED) / MAX_SPEED;
    return 0.6 + 4.4 * (1 - s);
}

/**
 * `cardPower`: the house in the middle with two values, up to three items on each side
 * with icon, value and a line to the house on which a dot moves - towards the house for
 * a positive speed, away from it for a negative one. The items send no events (the
 * adapter's `onButtonEvent` of pagePower is empty), only the navigation does.
 */
export class CardPower extends React.Component<CardProps<CardPowerModel>> {
    private renderSlot(slot: PowerSlot, index: number): React.JSX.Element | null {
        if (slot.empty) {
            return null;
        }
        const left = index < 3;
        const row = ROWS[index % 3];
        const boxLeft = left ? SLOT_LEFT : SLOT_RIGHT;
        const lineLeft = left ? SLOT_LEFT + SLOT_BOX + LINE_GAP : HOME.left + HOME.width + LINE_GAP;
        const lineRight = left ? HOME.left - LINE_GAP : SLOT_RIGHT - LINE_GAP;
        const lineWidth = lineRight - lineLeft;
        // the dot moves to the house for speed > 0: on the left side that is left -> right
        const towardsHouse = slot.speed > 0;
        const forward = left ? towardsHouse : !towardsHouse;
        const color = color565ToCss(slot.iconColor);
        return (
            <React.Fragment key={slot.position}>
                <div
                    data-slot={slot.position}
                    style={{
                        position: 'absolute',
                        left: boxLeft,
                        top: row - SLOT_BOX / 2,
                        width: SLOT_BOX,
                        height: SLOT_BOX,
                        border: `2px solid ${BOX_BORDER}`,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {slot.icon !== '' ? (
                        <Icon
                            glyph={slot.icon}
                            size={40}
                            color={color}
                        />
                    ) : null}
                </div>
                <div
                    data-flow={slot.position}
                    style={{
                        position: 'absolute',
                        left: lineLeft,
                        top: row - LINE_HEIGHT / 2,
                        width: lineWidth,
                        height: LINE_HEIGHT,
                        background: LINE_COLOR,
                    }}
                >
                    {slot.speed !== 0 ? (
                        <div
                            data-dot=""
                            style={{
                                position: 'absolute',
                                top: LINE_HEIGHT / 2 - DOT_SIZE / 2,
                                left: 0,
                                width: DOT_SIZE,
                                height: DOT_SIZE,
                                borderRadius: '50%',
                                background: LINE_COLOR,
                                animationName: 'powerFlow',
                                animationDuration: `${flowDuration(slot.speed).toFixed(2)}s`,
                                animationTimingFunction: 'linear',
                                animationIterationCount: 'infinite',
                                animationDirection: forward ? 'normal' : 'reverse',
                            }}
                        />
                    ) : null}
                </div>
                {slot.name !== '' ? (
                    <div
                        data-slot-name={slot.position}
                        style={{
                            position: 'absolute',
                            left: lineLeft,
                            width: lineWidth,
                            top: row - LINE_HEIGHT / 2 - 20,
                            textAlign: 'center',
                            fontSize: 13,
                            lineHeight: '16px',
                            color: theme.muted,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {slot.name}
                    </div>
                ) : null}
                <div
                    data-slot-value={slot.position}
                    style={{
                        position: 'absolute',
                        left: lineLeft,
                        width: lineWidth,
                        top: row + LINE_HEIGHT / 2 + 6,
                        textAlign: 'center',
                        fontSize: 17,
                        lineHeight: '20px',
                        color: theme.foreground,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    }}
                >
                    {slot.value}
                </div>
            </React.Fragment>
        );
    }

    private renderHome(): React.JSX.Element {
        const { home } = this.props.model;
        const textStyle: React.CSSProperties = {
            fontSize: 17,
            lineHeight: '20px',
            textAlign: 'center',
            maxWidth: HOME.width - 6,
            overflowWrap: 'anywhere',
        };
        return (
            <div
                data-home=""
                style={{
                    position: 'absolute',
                    left: HOME.left,
                    top: HOME.top,
                    width: HOME.width,
                    height: HOME.height,
                    border: `2px solid ${BOX_BORDER}`,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 2px',
                }}
            >
                <div
                    data-home-top=""
                    style={textStyle}
                >
                    {home.valueTop}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    {home.icon !== '' ? (
                        <Icon
                            glyph={home.icon}
                            size={44}
                            color={color565ToCss(home.iconColor)}
                        />
                    ) : null}
                    {home.name !== '' ? (
                        <div style={{ ...textStyle, fontSize: 13, lineHeight: '15px', color: theme.muted }}>
                            {home.name}
                        </div>
                    ) : null}
                </div>
                <div
                    data-home-bottom=""
                    style={textStyle}
                >
                    {home.valueBottom}
                </div>
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, press } = this.props;
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
                <style>{`@keyframes powerFlow { from { left: 0; } to { left: calc(100% - ${DOT_SIZE}px); } }`}</style>
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                />
                {this.renderHome()}
                {model.slots.map((slot, i) => this.renderSlot(slot, i))}
            </div>
        );
    }
}
