import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { setIconPaths } from '../../icons/iconData';
import type { PanelModel } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import { notify3Geometry, PopupNotify3 } from './PopupNotify3';
import { initial, type PopupNotify3Model } from './parse';

setIconPaths({ cancel: 'M1 1', 'check-bold': 'M2 2', close: 'M3 3' });

const glyph = (name: string): string => Object.entries(glyphMap).find(([, n]) => n === name)?.[0] ?? '';

function render(model: Partial<PopupNotify3Model>, panel: PanelModel = 'eu'): string {
    return renderToStaticMarkup(
        React.createElement(PopupNotify3, {
            model: { ...initial(), ...model },
            ctx: { pageType: 'popupNotify3', pageArgs: [] },
            global: initialGlobalState(panel),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

describe('popupNotify3 layout', () => {
    it('landscape like the HMI: icon 255 centred, button columns, text line at y 272', () => {
        const g = notify3Geometry('eu');
        expect(g.portrait).toBe(false);
        expect(g.icon).toEqual({ left: 112, top: 0, width: 255, height: 255 });
        expect(g.buttons[0]).toEqual({ left: 8, top: 60, width: 80, height: 205 });
        expect(g.buttons[1]).toEqual({ left: 392, top: 60, width: 80, height: 205 });
        expect(g.text).toEqual({ top: 272, left: 8, right: 472 });
        expect(g.close).toEqual({ left: 414, top: 0, width: 66, height: 80 });
        // web-l: the same over 640 px
        const w = notify3Geometry('web-l');
        expect(w.icon.left).toBe(192);
        expect(w.buttons[1].left).toBe(552);
        expect(w.text.right).toBe(632);
    });

    it('portrait: buttons side by side at the bottom, text below the icon', () => {
        for (const model of ['us-p', 'web-p'] as const) {
            const g = notify3Geometry(model);
            expect(g.portrait).toBe(true);
            expect(g.buttons[0].top).toBe(g.buttons[1].top);
            expect(g.buttons[0].top + g.buttons[0].height).toBe(model === 'us-p' ? 472 : 632);
            expect(g.buttons[0].left + g.buttons[0].width).toBeLessThan(g.buttons[1].left);
            expect(g.text.top).toBeGreaterThan(g.icon.top + g.icon.height);
        }
    });

    it('draws icon, text and only the buttons with an icon', () => {
        const html = render({
            icon: glyph('cancel'),
            text: 'WC besetzt',
            buttons: [
                { icon: '', color: 0 },
                { icon: glyph('check-bold'), color: 2016 },
            ],
        });
        expect(glyph('cancel')).not.toBe('');
        expect(html).toContain('data-icon=""');
        expect(html).toContain('WC besetzt');
        expect(html).not.toContain('data-button="button1"');
        expect(html).toContain('data-button="button3"');
        expect(html).toContain('data-close=""');
        expect(html).not.toContain('unknown icon');
    });
});
