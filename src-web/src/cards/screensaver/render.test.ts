import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { setIconPaths } from '../../icons/iconData';
import { parseCommand } from '../../protocol/commands';
import { initialGlobalState } from '../../store/PanelStore';
import { Screensaver } from './Screensaver';
import { initial, parseWeatherUpdate, tilesIconSize, type ScreensaverModel } from './parse';

// the MDI paths are loaded at runtime, the test only needs the icon of the items
setIconPaths({ lightbulb: 'M0 0h24v24H0z' });

const BULB = Object.entries(glyphMap).find(([, n]) => n === 'lightbulb')?.[0] ?? '';

/** entity as `Screensaver.getData()` normalises it */
function e(icon: string, name = '', value = '', id = ''): string {
    return `~${id}~${icon}~65535~${name}~${value}`;
}

/**
 * markup of the tiles screensaver for 5 bottom and 7 indicator entities
 *
 * @param bottom icon fields of the bottom entities
 * @param indicator icon fields of the indicators
 */
function render(bottom: string[], indicator: string[]): string {
    const entities = [
        ...bottom.map((icon, i) => e(icon, `b${i + 1}`, `${i + 1}`)),
        ...indicator.map((icon, i) => e(icon, '', '', `0?${i + 10}`)),
    ];
    const model: ScreensaverModel = {
        ...initial(),
        entities: parseWeatherUpdate(parseCommand(['weatherUpdate', ...entities].join('~')).args),
    };
    return renderToStaticMarkup(
        React.createElement(Screensaver, {
            model,
            ctx: { pageType: 'screensaver5', pageArgs: [] },
            global: initialGlobalState('eu'),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/**
 * markup of the element with `data-role="<role>"` up to the next one
 *
 * @param html markup of the card
 * @param role data-role
 */
function part(html: string, role: string): string {
    const start = html.indexOf(`data-role="${role}"`);
    expect(start).toBeGreaterThan(-1);
    const next = html.indexOf('data-role="', start + 1);
    return html.slice(start, next === -1 ? undefined : next);
}

describe('screensaver tiles with an icon font ¬<n>', () => {
    it('scales from the font of the HMI field, without suffix or in that font the size stays', () => {
        expect(tilesIconSize(BULB, 66, 4)).toBe(66);
        expect(tilesIconSize(`${BULB}¬4`, 66, 4)).toBe(66);
        expect(tilesIconSize(`${BULB}¬3`, 66, 4)).toBe(43);
        expect(tilesIconSize(`${BULB}¬1`, 66, 4)).toBe(27);
    });

    it('draws indicators in the chosen font, bottom icons keep their size, the suffix is never shown', () => {
        const html = render([`${BULB}¬3`, BULB, '', '', ''], [`${BULB}¬1`, BULB, `${BULB}¬3`, '', '', '', '']);
        expect(BULB).not.toBe('');
        expect(html).not.toContain('¬');
        expect(part(html, 'indicator1')).toContain('width="27"');
        expect(part(html, 'indicator2')).toContain('width="66"');
        expect(part(html, 'indicator3')).toContain('width="43"');
        expect(part(html, 'bottom1')).toContain('width="30"');
        expect(part(html, 'bottom2')).toContain('width="30"');
    });

    it('keeps the centre of the icon', () => {
        const html = render([BULB, '', '', '', ''], [`${BULB}¬3`, '', '', '', '', '', '']);
        // 66 px at 14/12, 43 px shifted by (66 - 43) / 2 = 11.5 -> 12
        expect(part(html, 'indicator1')).toContain('top:26px;left:24px');
    });
});
