import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { color565ToCss } from '../../protocol/color';
import type { PanelModel } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import { Screensaver } from './Screensaver';
import { handleCommand, initial, parseNotify, type ScreensaverNotify } from './parse';

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
        ['screensaver5', 'eu', 214, 320],
        ['screensaver5', 'web-l', 214, 320],
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
