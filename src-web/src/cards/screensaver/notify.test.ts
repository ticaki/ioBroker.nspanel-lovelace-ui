import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import type { CardProps } from '../CardContract';
import { Screensaver } from './Screensaver';
import { NOTIFY_BLINK_MS, notifyBackground } from './interaction';
import { handleCommand, initial, parseNotify, type ScreensaverModel, type ScreensaverNotify } from './parse';

/** RGB 56/56/56, the background of the default theme */
const GRAY = 14791;
const YELLOW = 65504;
const RED = 63488;

/**
 * markup of a screensaver with a notification
 *
 * @param pageType screensaver page
 * @param model panel model
 * @param notify the notification
 */
function render(pageType: string, model: PanelModel, notify: ScreensaverNotify): string {
    return renderToStaticMarkup(
        React.createElement(Screensaver, {
            model: { ...initial(), notify },
            ctx: { pageType, pageArgs: [] },
            global: initialGlobalState(model),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/**
 * top and height of the background area in stage coordinates (the area sits in the notify box, which starts at the
 * top of its cover)
 *
 * @param html markup of the card
 */
function area(html: string): { top: number; height: number; background: string } | null {
    const box = /data-role="notify" style="[^"]*?top:(\d+)/.exec(html);
    const bg = /data-role="notifyBackground" style="[^"]*?top:(-?\d+)[^"]*?height:(\d+)px;background:([^;"]+)/.exec(
        html,
    );
    if (!box || !bg) {
        return null;
    }
    return { top: Number(box[1]) + Number(bg[1]), height: Number(bg[2]), background: bg[3] };
}

describe('screensaver notification: fields 3-5', () => {
    it('parses the colours of heading, text and background', () => {
        expect(parseNotify(['H', 'T', String(YELLOW), String(RED), String(GRAY)])).toEqual({
            heading: 'H',
            text: 'T',
            headColor: YELLOW,
            textColor: RED,
            background: GRAY,
        });
    });

    it('leaves out empty or missing colour fields (older adapters, TFT before 6.2.0)', () => {
        expect(parseNotify(['H', 'T'])).toEqual({ heading: 'H', text: 'T' });
        expect(parseNotify(['H', 'T', '65535', '65535'])).toEqual({
            heading: 'H',
            text: 'T',
            headColor: 65535,
            textColor: 65535,
        });
        expect(parseNotify(['H', 'T', '', 'x', String(GRAY)])).toEqual({ heading: 'H', text: 'T', background: GRAY });
        expect(parseNotify(['', '', '1', '2', '3'])).toBeUndefined();
    });

    it('field 6 is the second background, only together with field 5', () => {
        expect(parseNotify(['H', 'T', '', '', String(GRAY), String(RED)])).toEqual({
            heading: 'H',
            text: 'T',
            background: GRAY,
            blink: RED,
        });
        expect(parseNotify(['H', 'T', '', '', '', String(RED)])).toEqual({ heading: 'H', text: 'T' });
    });

    it('the background alternates every second between field 5 and 6', () => {
        expect(NOTIFY_BLINK_MS).toBe(1000);
        expect([0, 1, 2, 3].map(phase => notifyBackground(GRAY, RED, phase))).toEqual([GRAY, RED, GRAY, RED]);
        expect(notifyBackground(GRAY, undefined, 1)).toBe(GRAY);
        expect(notifyBackground(GRAY, RED, undefined)).toBe(GRAY);
    });

    it('draws a blinking notification first in the colour of field 5', () => {
        const html = render('screensaver', 'eu', { heading: 'H', text: 'T', background: GRAY, blink: RED });
        expect(area(html)?.background).toBe(color565ToCss(GRAY));
    });

    it('handleCommand keeps the colours', () => {
        const ctx = { pageType: 'screensaver', pageArgs: [] };
        const model = handleCommand('notify', ['H', 'T', '1', '2', '3'], initial(), ctx);
        expect(model?.notify).toEqual({ heading: 'H', text: 'T', headColor: 1, textColor: 2, background: 3 });
    });

    it('draws heading and text in their colours', () => {
        const html = render('screensaver', 'eu', { heading: 'Head', text: 'Text', headColor: YELLOW, textColor: RED });
        expect(html).toContain(`color:${color565ToCss(YELLOW)}`);
        expect(html).toContain(`color:${color565ToCss(RED)}`);
    });

    it('draws no background without field 5', () => {
        const html = render('screensaver', 'eu', { heading: 'Head', text: 'Text' });
        expect(html).not.toContain('notifyBackground');
    });

    // the area of tNotifyHead + tNotifyText of the HMI (HMI/tools/notify_background.py), web models analogous
    const cases: [string, PanelModel, number, number][] = [
        ['screensaver', 'eu', 207, 320],
        ['screensaver', 'us-l', 207, 320],
        ['screensaver', 'web-l', 207, 320],
        ['screensaver', 'web-p', 207, 640],
        ['screensaver', 'us-p', 272, 388],
        ['screensaver2', 'eu', 181, 280],
        ['screensaver2', 'web-l', 181, 280],
        ['screensaver2', 'us-p', 252, 440],
        ['screensaver2', 'web-p', 336, 640],
        ['screensaver3', 'eu', 174, 315],
        ['screensaver3', 'us-p', 177, 475],
        ['screensaver3', 'web-p', 211, 630],
        ['screensaver5', 'eu', 214, 315],
        ['screensaver5', 'web-l', 214, 315],
        ['screensaver5', 'us-p', 366, 475],
        ['screensaver5', 'web-p', 364, 630],
    ];
    for (const [pageType, model, top, bottom] of cases) {
        it(`${pageType} ${model}: background from y ${top} to ${bottom}`, () => {
            const html = render(pageType, model, { heading: 'Head', text: 'Text', background: GRAY });
            expect(area(html)).toEqual({ top, height: bottom - top, background: color565ToCss(GRAY) });
        });
    }
});

/** a pointer event at a position of the stage */
function pointer(x: number, y: number): React.PointerEvent {
    return { clientX: x, clientY: y, stopPropagation: (): void => undefined } as unknown as React.PointerEvent;
}

interface Harness {
    card: Screensaver;
    presses: unknown[][];
    /** markup of the card as it is now */
    html: () => string;
    /** a touch of the background: down at (0, 0), up `dy` px lower; the store wakes the display with the press */
    touch: (dy?: number) => void;
    /** new props for the card, like the store gives them (componentDidUpdate runs) */
    update: (change: Partial<CardProps<ScreensaverModel>>) => void;
}

/**
 * An unmounted screensaver card whose setState applies at once
 *
 * @param standby standby brightness of `dimmode`
 * @param notify the notification
 */
function harness(standby: number, notify: ScreensaverNotify): Harness {
    const presses: unknown[][] = [];
    const global = initialGlobalState('eu');
    const props: CardProps<ScreensaverModel> = {
        model: { ...initial(), notify },
        ctx: { pageType: 'screensaver', pageArgs: [] },
        global: { ...global, dim: { ...global.dim, standby } },
        send: () => undefined,
        press: (...args) => void presses.push(args),
        openPopup: () => undefined,
    };
    const card = new Screensaver(props);
    card.setState = (update: unknown): void => {
        const patch: unknown = typeof update === 'function' ? update(card.state, card.props) : update;
        card.state = { ...card.state, ...(patch as object) };
    };
    const update = (change: Partial<CardProps<ScreensaverModel>>): void => {
        const prev = card.props;
        Object.assign(card, { props: { ...prev, ...change } });
        card.componentDidUpdate(prev);
    };
    const root = (): React.ReactElement<{
        onPointerDown: (e: React.PointerEvent) => void;
        onPointerUp: (e: React.PointerEvent) => void;
    }> => card.render() as React.ReactElement<never>;
    return {
        card,
        presses,
        html: () => renderToStaticMarkup(card.render()),
        touch: (dy = 0): void => {
            root().props.onPointerDown(pointer(0, 0));
            root().props.onPointerUp(pointer(0, dy));
            if (!card.props.global.awake) {
                update({ global: { ...card.props.global, awake: true } });
            }
        },
        update,
    };
}

describe('screensaver notification: a touch clears it like the HMI', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('the first tap clears it when the standby display is not dark', () => {
        const h = harness(20, { heading: 'H', text: 'T' });
        expect(h.html()).toContain('data-role="notify"');
        h.touch();
        expect(h.presses).toEqual([['screensaver', 'bExit', 1]]);
        expect(h.html()).not.toContain('data-role="notify"');
    });

    it('standby brightness 0: the first tap only wakes, the second clears', () => {
        const h = harness(0, { heading: 'H', text: 'T' });
        h.touch();
        expect(h.html()).toContain('data-role="notify"');
        h.touch();
        expect(h.presses).toEqual([
            ['screensaver', 'bExit', 1],
            ['screensaver', 'bExit', 2],
        ]);
        expect(h.html()).not.toContain('data-role="notify"');
    });

    it('a swipe clears it as well', () => {
        const h = harness(20, { heading: 'H', text: 'T' });
        h.touch(-120);
        expect(h.presses).toEqual([['screensaver', 'swipeUp']]);
        expect(h.html()).not.toContain('data-role="notify"');
    });

    it('the blinking stops with it', () => {
        const h = harness(20, { heading: 'H', text: 'T', background: GRAY, blink: RED });
        h.card.componentDidMount();
        expect(h.card.state.notifyPhase).toBe(0);
        h.touch();
        expect(h.card.state.notifyPhase).toBeUndefined();
        vi.advanceTimersByTime(3000);
        expect(h.card.state.notifyPhase).toBeUndefined();
        h.card.componentWillUnmount();
    });

    it('comes back with the next notify~ and with the model of a pageType~', () => {
        const h = harness(20, { heading: 'H', text: 'T' });
        h.touch();
        h.update({ model: { ...h.card.props.model, notify: { heading: 'H', text: 'T2' } } });
        expect(h.html()).toContain('T2');
        h.touch();
        expect(h.html()).not.toContain('data-role="notify"');
        // pageType~: a new model without notification, then its notify~
        h.update({ model: initial() });
        h.update({ model: { ...initial(), notify: { heading: 'H', text: 'T3' } } });
        expect(h.html()).toContain('T3');
        h.card.componentWillUnmount();
    });
});
