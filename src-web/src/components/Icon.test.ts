import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glyphMap from '../icons/glyph-map.json';
import { setIconPaths } from '../icons/iconData';
import { Icon } from './Icon';

setIconPaths({ lightbulb: 'M0 0h24v24H0z' });

const BULB = Object.entries(glyphMap).find(([, n]) => n === 'lightbulb')?.[0] ?? '';

function render(glyph: string): string {
    return renderToStaticMarkup(React.createElement(Icon, { glyph, size: 30 }));
}

describe('Icon with a font id ¬<n>', () => {
    it('draws the glyph in the fonts with icons (1, 3, 4)', () => {
        for (const font of [1, 3, 4]) {
            const html = render(`${BULB}¬${font}`);
            expect(html).toContain('<svg');
            expect(html).toContain('aria-label="lightbulb"');
        }
        expect(render(BULB)).toContain('<svg');
    });

    it('stays empty in the fonts without icons (0, 2, 5), keeping its size', () => {
        for (const font of [0, 2, 5]) {
            const html = render(`${BULB}¬${font}`);
            expect(html).toContain('data-icon-empty');
            expect(html).toContain('width:30px');
            expect(html).not.toContain('?');
            expect(html).not.toContain('¬');
        }
    });
});
