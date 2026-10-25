import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { homeLines, MAX_SPEED, type CardPowerModel, type PowerSlot } from './parse';

/*
 * Geometry measured on the emulator picture of the HMI (480x320, stage pixels).
 */

/** the house in the middle (outer size including the 2 px border) */
const HOME = { left: 198, top: 70, width: 60, height: 230 } as const;
/** the square icon boxes of the items (outer size) */
const SLOT_BOX = 60;
const SLOT_LEFT = 18;
const SLOT_RIGHT = 378;
/** y centre of the three rows (top, middle, bottom) */
const ROWS = [110, 186, 262] as const;
/** a flow line starts 6 px after the element it comes from and ends 10 px before the next */
const LINE_GAP_START = 6;
const LINE_GAP_END = 10;
const LINE_HEIGHT = 2;
const DOT_SIZE = 11;
const BORDER = 2;
const BOX_BORDER = '#3f6a99';
const LINE_COLOR = theme.accent;
const TEXT_FONT = 17;
const TEXT_LINE = 20;
/** name above the line: box bottom 10 px above the line */
const NAME_TOP = -31;
/** value below the line */
const VALUE_TOP = 12;
const SLOT_ICON_SIZE = 40;
const HOME_ICON_SIZE = 40;
/** the lines of the house values: 29 px apart, the top block starts 44 px below the top */
const HOME_LINE = 29;
const HOME_TOP_CENTER = 44;
/** the last line of the bottom block is centred 16 px above the bottom */
const HOME_BOTTOM_CENTER = 16;

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
        const lineLeft = left ? SLOT_LEFT + SLOT_BOX + LINE_GAP_START : HOME.left + HOME.width + LINE_GAP_START;
        const lineRight = left ? HOME.left - LINE_GAP_END : SLOT_RIGHT - LINE_GAP_END;
        const lineWidth = lineRight - lineLeft;
        // the dot moves to the house for speed > 0: on the left side that is left -> right
        const towardsHouse = slot.speed > 0;
        const forward = left ? towardsHouse : !towardsHouse;
        const color = color565ToCss(slot.iconColor);
        const text: React.CSSProperties = {
            position: 'absolute',
            left: lineLeft,
            width: lineWidth,
            textAlign: 'center',
            fontSize: TEXT_FONT,
            lineHeight: `${TEXT_LINE}px`,
            color: theme.foreground,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
        };
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
                        boxSizing: 'border-box',
                        border: `${BORDER}px solid ${BOX_BORDER}`,
                        borderRadius: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {slot.icon !== '' ? (
                        <Icon
                            glyph={slot.icon}
                            size={SLOT_ICON_SIZE}
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
                        style={{ ...text, top: row + NAME_TOP }}
                    >
                        {slot.name}
                    </div>
                ) : null}
                <div
                    data-slot-value={slot.position}
                    style={{ ...text, top: row + VALUE_TOP }}
                >
                    {slot.value}
                </div>
            </React.Fragment>
        );
    }

    /**
     * The lines of a house value, positioned inside the box.
     *
     * @param lines the text lines
     * @param firstCenter y centre of the first line, relative to the outer top of the box
     * @param role `top` or `bottom`
     */
    private renderHomeLines(lines: string[], firstCenter: number, role: 'top' | 'bottom'): React.JSX.Element[] {
        return lines.map((line, i) => (
            <div
                key={i}
                data-home-line={`${role}${i}`}
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: firstCenter + i * HOME_LINE - HOME_LINE / 2 - BORDER,
                    height: HOME_LINE,
                    lineHeight: `${HOME_LINE}px`,
                    textAlign: 'center',
                    fontSize: TEXT_FONT,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                }}
            >
                {line}
            </div>
        ));
    }

    private renderHome(): React.JSX.Element {
        const { home } = this.props.model;
        const top = homeLines(home.valueTop);
        const bottom = homeLines(home.valueBottom);
        const bottomFirst = HOME.height - HOME_BOTTOM_CENTER - HOME_LINE * Math.max(0, bottom.length - 1);
        return (
            <div
                data-home=""
                style={{
                    position: 'absolute',
                    left: HOME.left,
                    top: HOME.top,
                    width: HOME.width,
                    height: HOME.height,
                    boxSizing: 'border-box',
                    border: `${BORDER}px solid ${BOX_BORDER}`,
                    borderRadius: 3,
                    color: theme.foreground,
                }}
            >
                <div data-home-top="">{this.renderHomeLines(top, HOME_TOP_CENTER, 'top')}</div>
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: HOME.height / 2 - BORDER - HOME_ICON_SIZE / 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    {home.icon !== '' ? (
                        <Icon
                            glyph={home.icon}
                            size={HOME_ICON_SIZE}
                            color={color565ToCss(home.iconColor)}
                        />
                    ) : null}
                    {home.name !== '' ? (
                        <div
                            data-home-name=""
                            style={{
                                fontSize: 13,
                                lineHeight: '15px',
                                color: theme.muted,
                                maxWidth: HOME.width - 2 * BORDER - 2,
                                textAlign: 'center',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {home.name}
                        </div>
                    ) : null}
                </div>
                <div data-home-bottom="">{this.renderHomeLines(bottom, bottomFirst, 'bottom')}</div>
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
