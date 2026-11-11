import React from 'react';
import { Icon } from '../../components/Icon';
import { TitleBar } from '../../components/TitleBar';
import { color565ToCss } from '../../protocol/color';
import { theme } from '../../style/theme';
import type { CardProps } from '../CardContract';
import { LINE_THICKNESS, powerLayout, TEXT_LINE, type Box, type PowerLayout } from './layout';
import { homeLines, MAX_SPEED, type CardPowerModel, type PowerSlot } from './parse';

const DOT_SIZE = 11;
const BORDER = 2;
const BOX_BORDER = '#3f6a99';
const LINE_COLOR = theme.accent;
const TEXT_FONT = 17;
const SLOT_ICON_SIZE = 40;
const HOME_ICON_SIZE = 40;
/** the lines of the house values: 29 px apart, the top block starts 44 px below the top */
const HOME_LINE = 29;
const HOME_TOP_CENTER = 44;
/** the last line of the bottom block is centred 16 px above the bottom */
const HOME_BOTTOM_CENTER = 16;
/** wide house (portrait): width of the value blocks left and right of the icon, inside the border */
const WIDE_VALUE_WIDTH = 90;

/** seconds for one run of the dot: fast at |speed| = 120, slow at |speed| = 1 */
export function flowDuration(speed: number): number {
    const s = Math.min(Math.abs(speed), MAX_SPEED) / MAX_SPEED;
    return 0.6 + 4.4 * (1 - s);
}

/**
 * `cardPower`: the house in the middle with two values, up to three items on each side
 * with icon, value and a line to the house on which a dot moves - towards the house for
 * a positive speed, away from it for a negative one. The items send no events (the
 * adapter's `onButtonEvent` of pagePower is empty), only the navigation does. Portrait models get
 * the layout of the us-p HMI: the house as a wide bar, three items above and three below it.
 */
export class CardPower extends React.Component<CardProps<CardPowerModel>> {
    private renderSlot(slot: PowerSlot, index: number, layout: PowerLayout): React.JSX.Element | null {
        const geometry = layout.slots[index];
        if (slot.empty || geometry === undefined) {
            return null;
        }
        const { box, line, vertical } = geometry;
        // the dot moves to the house for speed > 0; the line runs left -> right / top -> bottom
        const towardsHouse = slot.speed > 0;
        const forward = geometry.startsAtItem ? towardsHouse : !towardsHouse;
        const color = color565ToCss(slot.iconColor);
        const text = (area: Box): React.CSSProperties => ({
            position: 'absolute',
            left: area.left,
            top: area.top,
            width: area.width,
            textAlign: 'center',
            fontSize: TEXT_FONT,
            lineHeight: `${TEXT_LINE}px`,
            color: theme.foreground,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
        });
        return (
            <React.Fragment key={slot.position}>
                <div
                    data-slot={slot.position}
                    style={{
                        position: 'absolute',
                        left: box.left,
                        top: box.top,
                        width: box.width,
                        height: box.height,
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
                        left: line.left,
                        top: line.top,
                        width: line.width,
                        height: line.height,
                        background: LINE_COLOR,
                    }}
                >
                    {slot.speed !== 0 ? (
                        <div
                            data-dot=""
                            style={{
                                position: 'absolute',
                                top: vertical ? 0 : LINE_THICKNESS / 2 - DOT_SIZE / 2,
                                left: vertical ? LINE_THICKNESS / 2 - DOT_SIZE / 2 : 0,
                                width: DOT_SIZE,
                                height: DOT_SIZE,
                                borderRadius: '50%',
                                background: LINE_COLOR,
                                animationName: vertical ? 'powerFlowV' : 'powerFlow',
                                animationDuration: `${flowDuration(slot.speed).toFixed(2)}s`,
                                animationTimingFunction: 'linear',
                                animationIterationCount: 'infinite',
                                animationDirection: forward ? 'normal' : 'reverse',
                            }}
                        />
                    ) : null}
                </div>
                {slot.name !== '' && geometry.name ? (
                    <div
                        data-slot-name={slot.position}
                        style={text(geometry.name)}
                    >
                        {slot.name}
                    </div>
                ) : null}
                <div
                    data-slot-value={slot.position}
                    style={text(geometry.value)}
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

    /**
     * A house value of the wide house (portrait): a block left or right of the icon, the text
     * vertically centred, wrapped into two lines when it does not fit.
     *
     * @param value the text
     * @param side `top` = `valueTop` (left, `tHomeO`), `bottom` = `valueBottom` (right, `tHome`)
     * @param height inner height of the house
     * @param width inner width of the house
     */
    private renderWideValue(value: string, side: 'top' | 'bottom', height: number, width: number): React.JSX.Element {
        return (
            <div
                data-home-wide={side}
                style={{
                    position: 'absolute',
                    left: side === 'top' ? 0 : width - WIDE_VALUE_WIDTH,
                    top: 0,
                    width: WIDE_VALUE_WIDTH,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    fontSize: TEXT_FONT,
                    lineHeight: `${TEXT_LINE}px`,
                    overflow: 'hidden',
                }}
            >
                {homeLines(value).join(' ')}
            </div>
        );
    }

    private renderHome(layout: PowerLayout): React.JSX.Element {
        const { home } = this.props.model;
        const house = layout.home;
        const wide = layout.wideHome;
        const top = homeLines(home.valueTop);
        const bottom = homeLines(home.valueBottom);
        const bottomFirst = house.height - HOME_BOTTOM_CENTER - HOME_LINE * Math.max(0, bottom.length - 1);
        const innerWidth = house.width - 2 * BORDER;
        const innerHeight = house.height - 2 * BORDER;
        return (
            <div
                data-home=""
                style={{
                    position: 'absolute',
                    left: house.left,
                    top: house.top,
                    width: house.width,
                    height: house.height,
                    boxSizing: 'border-box',
                    border: `${BORDER}px solid ${BOX_BORDER}`,
                    borderRadius: 3,
                    color: theme.foreground,
                }}
            >
                {wide ? (
                    this.renderWideValue(home.valueTop, 'top', innerHeight, innerWidth)
                ) : (
                    <div data-home-top="">{this.renderHomeLines(top, HOME_TOP_CENTER, 'top')}</div>
                )}
                <div
                    style={
                        wide
                            ? {
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  top: 0,
                                  height: innerHeight,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                              }
                            : {
                                  position: 'absolute',
                                  left: 0,
                                  right: 0,
                                  top: house.height / 2 - BORDER - HOME_ICON_SIZE / 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                              }
                    }
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
                                maxWidth: wide ? 2 * HOME_ICON_SIZE : innerWidth - 2,
                                textAlign: 'center',
                                overflowWrap: 'anywhere',
                            }}
                        >
                            {home.name}
                        </div>
                    ) : null}
                </div>
                {wide ? (
                    this.renderWideValue(home.valueBottom, 'bottom', innerHeight, innerWidth)
                ) : (
                    <div data-home-bottom="">{this.renderHomeLines(bottom, bottomFirst, 'bottom')}</div>
                )}
            </div>
        );
    }

    render(): React.JSX.Element {
        const { model, ctx, global, press } = this.props;
        const layout = powerLayout(global.model);
        return (
            <div
                data-page={ctx.pageType}
                style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
            >
                <style>
                    {`@keyframes powerFlow { from { left: 0; } to { left: calc(100% - ${DOT_SIZE}px); } }` +
                        `@keyframes powerFlowV { from { top: 0; } to { top: calc(100% - ${DOT_SIZE}px); } }`}
                </style>
                <TitleBar
                    title={model.title}
                    navigation={model.navigation}
                    press={press}
                    model={global.model}
                />
                {this.renderHome(layout)}
                {model.slots.map((slot, i) => this.renderSlot(slot, i, layout))}
            </div>
        );
    }
}
