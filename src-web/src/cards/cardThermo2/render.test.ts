import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { setIconPaths } from '../../icons/iconData';
import { initialGlobalState } from '../../store/PanelStore';
import { CardThermo2 } from './CardThermo2';
import { initial, type CardThermo2Model } from './parse';

// the MDI paths are loaded at runtime, the test only needs the icons of the card
setIconPaths({ lightbulb: 'M0 0h24v24H0z', 'plus-circle-outline': 'M0 0', 'minus-circle-outline': 'M0 0' });

const BULB = Object.entries(glyphMap).find(([, n]) => n === 'lightbulb')?.[0] ?? '';

/** the slot icon fields of the hardware test (HMI 6.0.2) */
const FIELDS = [`${BULB}¬0`, '21,4°C¬1', `${BULB}¬2`, '48%¬3', `${BULB}¬4`, '35%¬5', '', '21,4°C'];

function render(icons: readonly string[]): string {
    const base = initial();
    const model: CardThermo2Model = {
        ...base,
        received: true,
        id: 'bad',
        slots: base.slots.map((slot, i) => ({
            ...slot,
            type: icons[i] ? 'text' : '',
            id: `bad?${i}`,
            icon: icons[i] ?? '',
        })),
    };
    return renderToStaticMarkup(
        React.createElement(CardThermo2, {
            model,
            ctx: { pageType: 'cardThermo2', pageArgs: [] },
            global: initialGlobalState(),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/** markup of slot `index` */
function slot(html: string, index: number): string {
    const start = html.indexOf(`data-role="thermo-slot" data-id="${index}"`);
    expect(start).toBeGreaterThan(-1);
    const next = html.indexOf('data-role="thermo-slot"', start + 1);
    return html.slice(start, next === -1 ? undefined : next);
}

describe('cardThermo2 slots with a font id ¬<n>', () => {
    it('never shows the ¬<n> suffix or the unknown icon placeholder', () => {
        const html = render(FIELDS);
        expect(BULB).not.toBe('');
        expect(html).not.toContain('¬');
        expect(html).not.toContain('unknown icon');
    });

    it('draws values as text and icons only in fonts with icons', () => {
        const html = render(FIELDS);
        // icon in font 0 / 2: empty like on the panel
        expect(slot(html, 0)).not.toContain('<svg');
        expect(slot(html, 2)).not.toContain('<svg');
        // icon in font 4: drawn
        expect(slot(html, 4)).toContain('<svg');
        // values
        expect(slot(html, 1)).toContain('21,4°C');
        expect(slot(html, 3)).toContain('48%');
        // font 5: ascii only, bold 128 px font
        expect(slot(html, 5)).toContain('35%');
        expect(slot(html, 7)).toContain('21,4°C');
    });

    it('uses the size of the font', () => {
        const html = render(FIELDS);
        expect(slot(html, 3)).toContain('font-size:36px');
        expect(slot(html, 1)).toContain('font-size:25px');
        expect(slot(html, 5)).toContain('font-weight:700');
    });

    it('drops non-ascii characters in font 5', () => {
        const html = render(['21,4°C¬5']);
        expect(slot(html, 0)).toContain('21,4C');
        expect(slot(html, 0)).not.toContain('°');
    });
});
