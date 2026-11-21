import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { setIconPaths } from '../../icons/iconData';
import type { PanelModel } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import { notifyGeometry, PopupNotify } from './PopupNotify';
import { cssFontSize, initial, type PopupNotifyModel } from './parse';

setIconPaths({ 'cog-refresh-outline': 'M1 1' });

const glyph = (name: string): string => Object.entries(glyphMap).find(([, n]) => n === name)?.[0] ?? '';

function render(model: Partial<PopupNotifyModel>, panel: PanelModel = 'eu'): string {
    return renderToStaticMarkup(
        React.createElement(PopupNotify, {
            model: { ...initial(), ...model },
            ctx: { pageType: 'popupNotify', pageArgs: [] },
            global: initialGlobalState(panel),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/**
 * Width of the text field the adapter wraps for (POPUP_NOTIFY_TEXT_WIDTH in
 * src/lib/pages/screensaver-info-icon.ts): the web panel must be at least as wide, otherwise the
 * browser breaks the lines of the adapter once more.
 */
const ADAPTER_WIDTH: Record<PanelModel, { text: number; withIcon: number }> = {
    eu: { text: 397, withIcon: 285 },
    'us-l': { text: 397, withIcon: 285 },
    'us-p': { text: 307, withIcon: 306 },
    'web-l': { text: 560, withIcon: 446 },
    'web-p': { text: 272, withIcon: 272 },
};

describe('popupNotify text box', () => {
    it('is at least as wide as the text field the adapter wraps for', () => {
        for (const model of Object.keys(ADAPTER_WIDTH) as PanelModel[]) {
            const { text } = notifyGeometry(model);
            const withIcon = text.right - (notifyGeometry(model).icon.inHeading ? text.left : text.leftWithIcon);
            expect(text.right - text.left, model).toBeGreaterThanOrEqual(ADAPTER_WIDTH[model].text);
            expect(withIcon, model).toBeGreaterThanOrEqual(ADAPTER_WIDTH[model].withIcon);
        }
    });

    it('us-p like tText of the HMI (x 4..311), web-p unchanged (x 24..296)', () => {
        expect(notifyGeometry('us-p').text).toEqual({ top: 74, leftWithIcon: 4, left: 4, right: 311 });
        expect(notifyGeometry('web-p').text).toEqual({ top: 74, leftWithIcon: 24, left: 24, right: 296 });
    });

    it('shows the icon in its color, the font of the payload and the lines of the adapter', () => {
        const html = render({
            icon: glyph('cog-refresh-outline'),
            iconColor: 64512,
            font: 2,
            text: 'Auf dem Display läuft\neine\nEntwickler-Firmware.',
        });
        expect(html).toContain('data-icon');
        expect(html).toContain(`font-size:${cssFontSize(2)}px`);
        expect(html).toContain('white-space:pre-wrap');
        expect(html).toContain('Auf dem Display läuft\neine\nEntwickler-Firmware.');
    });
});
