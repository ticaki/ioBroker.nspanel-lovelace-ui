import React from 'react';
import { color565ToCss } from '../protocol/color';
import { isEmptyEntity } from '../protocol/split';
import type { Entity6, Navigation, PanelModel } from '../protocol/types';
import { contentWidth, theme } from '../style/theme';
import { LONG_PRESS_BLINK_MS, longPressBlinkColor } from '../cards/screensaver/interaction';
import { Icon } from './Icon';
import { NAV_LONG_PRESS_MS, navColor, navLongPressEvent } from './navLongPress';
import { PressTracker } from './pressTracker';

export interface TitleBarProps {
    title: string;
    navigation: Navigation;
    /** `press(id, 'button')` is sent for the short press of the navigation entities (bSubPrev, bUp, bSubNext, bHome, …) */
    press: (id: string, action: string, value?: string | number) => void;
    /** sends the long press of a navigation arrow (`event,buttonPress3,<id>,button` - home/parent) */
    send: (event: string) => void;
    /** the panel model, decides the width the title bar is laid out in (`eu` by default) */
    model?: PanelModel;
    /** css colour of the title, white by default */
    titleColor?: string;
    /** font size of the title in stage pixels, the 32 px Nextion font (24) by default */
    titleSize?: number;
}

interface TitleBarState {
    /**
     * phase of the blinking heading and arrows while the long press of a held arrow is armed ({@link navColor}),
     * undefined: not armed, everything has its colour
     */
    blinkPhase: number | undefined;
}

/**
 * The head of every card: navigation icon left, title centred, navigation icon right. Laid out
 * like the HMI (eu): icons of 43 px centred at x 33 / 414, y 42, the title centred at x 223
 * with a cap height of 17 px. The card draws its content below `theme.titleBarHeight`.
 *
 * An arrow decides on release like the HMI (`tmLPNav`): before {@link NAV_LONG_PRESS_MS} `press(id, 'button')`
 * (next/prev), after it `event,buttonPress3,<id>,button` (home/parent). From the hold time on heading and arrows
 * blink yellow/green ({@link LONG_PRESS_BLINK_MS} per phase) until the finger is lifted - 'you can let go now'.
 * A release outside of the arrow sends nothing (the HMI arrow gets no 'up' then) and ends the blinking.
 */
export class TitleBar extends React.Component<TitleBarProps, TitleBarState> {
    state: TitleBarState = { blinkPhase: undefined };

    /** the pointer that pressed an arrow - only its release on that arrow sends */
    private readonly pressTracker = new PressTracker();
    /** the arrow held at the moment */
    private held: 'left' | 'right' | undefined;
    /** timer of the hold time ({@link NAV_LONG_PRESS_MS}) */
    private longPressTimer: ReturnType<typeof setTimeout> | undefined;
    /** timer of the blinking while the long press is armed */
    private blinkTimer: ReturnType<typeof setInterval> | undefined;
    private armed = false;

    componentWillUnmount(): void {
        this.clearLongPress(false);
    }

    /**
     * Forgets the held arrow: stops the timers, heading and arrows get their colours back.
     *
     * @param redraw false while unmounting - no state change then
     */
    private clearLongPress(redraw = true): void {
        if (this.longPressTimer !== undefined) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = undefined;
        }
        if (this.blinkTimer !== undefined) {
            clearInterval(this.blinkTimer);
            this.blinkTimer = undefined;
        }
        this.held = undefined;
        this.armed = false;
        if (redraw && this.state.blinkPhase !== undefined) {
            this.setState({ blinkPhase: undefined });
        }
    }

    /**
     * A touch on an arrow starts the hold time; when it is over the long press is armed and the blinking starts.
     *
     * @param side the arrow
     * @param e the pointer event of the touch
     */
    private navDown(side: 'left' | 'right', e: React.PointerEvent): void {
        this.clearLongPress();
        this.pressTracker.down(e.pointerId);
        this.held = side;
        this.longPressTimer = setTimeout(() => {
            this.longPressTimer = undefined;
            this.armed = true;
            this.setState({ blinkPhase: 0 });
            this.blinkTimer = setInterval(() => {
                this.setState(prev => ({ blinkPhase: (prev.blinkPhase ?? 0) + 1 }));
            }, LONG_PRESS_BLINK_MS);
        }, NAV_LONG_PRESS_MS);
    }

    /**
     * The release on an arrow: short press or - after the hold time - long press of its entity.
     *
     * @param side the arrow
     * @param entityId id of its navigation entity
     * @param e the pointer event of the release
     */
    private navUp(side: 'left' | 'right', entityId: string, e: React.PointerEvent): void {
        const own = this.pressTracker.up(e.pointerId) && this.held === side;
        const armed = this.armed;
        this.clearLongPress();
        if (!own) {
            return;
        }
        if (armed) {
            this.props.send(navLongPressEvent(entityId));
        } else {
            this.props.press(entityId, 'button');
        }
    }

    /**
     * The pointer left the arrow or the browser took it away: no press, the blinking ends.
     *
     * @param e the pointer event
     */
    private navCancel(e: React.PointerEvent): void {
        this.pressTracker.cancel(e.pointerId);
        this.clearLongPress();
    }

    private renderNav(entity: Entity6, side: 'left' | 'right', width: number): React.JSX.Element {
        const empty = isEmptyEntity(entity) || entity.icon === '';
        const box = 2 * theme.navIconCenter;
        return (
            <div
                data-nav={side}
                style={{
                    position: 'absolute',
                    left: side === 'left' ? 0 : width - box,
                    top: theme.titleBarCenter - box / 2,
                    width: box,
                    height: box,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: empty ? 'default' : 'pointer',
                    // a held arrow is a long press, the browser must not take the pointer for scrolling
                    touchAction: 'none',
                }}
                onPointerDown={empty ? undefined : (e): void => this.navDown(side, e)}
                onPointerUp={empty ? undefined : (e): void => this.navUp(side, entity.id, e)}
                onPointerLeave={empty ? undefined : (e): void => this.navCancel(e)}
                onPointerCancel={empty ? undefined : (e): void => this.navCancel(e)}
            >
                {empty ? null : (
                    <Icon
                        glyph={entity.icon}
                        size={theme.navIconSize}
                        color={color565ToCss(navColor(entity.iconColor, this.state.blinkPhase))}
                    />
                )}
            </div>
        );
    }

    render(): React.JSX.Element {
        const {
            title,
            navigation,
            model = 'eu',
            titleColor = theme.foreground,
            titleSize = theme.titleFontSize,
        } = this.props;
        const width = contentWidth(model);
        const box = 2 * theme.navIconCenter;
        const { blinkPhase } = this.state;
        const line = 2 * (theme.titleBarHeight - theme.titleBarCenter) + 20;
        return (
            <div
                data-titlebar=""
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width,
                    height: theme.titleBarHeight,
                }}
            >
                {this.renderNav(navigation.left, 'left', width)}
                <div
                    data-role="title"
                    style={{
                        position: 'absolute',
                        left: box,
                        width: width - 2 * box,
                        // the cap centre of the title sits 1 px above the icon centre
                        top: theme.titleBarCenter - 1 - line / 2,
                        height: line,
                        lineHeight: `${line}px`,
                        textAlign: 'center',
                        color: blinkPhase === undefined ? titleColor : color565ToCss(longPressBlinkColor(blinkPhase)),
                        fontSize: titleSize,
                        fontWeight: 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        // a title wider than the room between the arrows is cut there; the adapter shortens it with … itself
                        textOverflow: 'clip',
                    }}
                >
                    {title}
                </div>
                {this.renderNav(navigation.right, 'right', width)}
            </div>
        );
    }
}
