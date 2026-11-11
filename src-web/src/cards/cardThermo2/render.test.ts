import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import glyphMap from '../../icons/glyph-map.json';
import { setIconPaths } from '../../icons/iconData';
import { initialGlobalState } from '../../store/PanelStore';
import type { PanelModel } from '../../protocol/types';
import { CardThermo2, SLOT_BOXES, slotFitScale, thermo2Geometry } from './CardThermo2';
import { initial, type CardThermo2Model } from './parse';

// the MDI paths are loaded at runtime, the test only needs the icons of the card
setIconPaths({ lightbulb: 'M0 0h24v24H0z', 'plus-circle-outline': 'M0 0', 'minus-circle-outline': 'M0 0' });

const BULB = Object.entries(glyphMap).find(([, n]) => n === 'lightbulb')?.[0] ?? '';

/** the slot icon fields of the hardware test (HMI 6.0.2) */
const FIELDS = [`${BULB}¬0`, '21,4°C¬1', `${BULB}¬2`, '48%¬3', `${BULB}¬4`, '35%¬5', '', '21,4°C'];

function render(icons: readonly string[], panel: PanelModel = 'eu'): string {
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
            global: initialGlobalState(panel),
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

    it('uses the default font of the HMI components without ¬<n>: 3 at the sides, 1 for the 9th item', () => {
        const html = render([...FIELDS, '21,4°C']);
        expect(slot(html, 7)).toContain('data-font="3"');
        expect(slot(html, 7)).toContain('font-size:36px');
        expect(slot(html, 8)).toContain('data-font="1"');
    });

    it('places the slots in the boxes of bEntity1..8 / bPopup (eu, us-l 15 px to the right)', () => {
        expect(SLOT_BOXES).toHaveLength(9);
        expect(SLOT_BOXES[0]).toEqual({ x: 10, y: 72, w: 100, h: 55, font: 3 });
        expect(SLOT_BOXES[7]).toEqual({ x: 341, y: 243, w: 100, h: 55, font: 3 });
        expect(SLOT_BOXES[8]).toEqual({ x: 198, y: 266, w: 55, h: 40, font: 1 });
        expect(slot(render(FIELDS), 4)).toContain('left:341px;top:72px;width:100px;height:55px');
        expect(slot(render(FIELDS, 'us-l'), 4)).toContain('left:356px;top:72px;width:100px;height:55px');
    });

    it('lays the 9 slots out per model (web-l wide, portrait in rows above and below the ring)', () => {
        const webL = thermo2Geometry('web-l');
        expect(webL.cx).toBe(305);
        expect(webL.slots).toHaveLength(9);
        expect(webL.slots[4]).toMatchObject({ x: 500, y: 72 });
        expect(webL.slots[8]).toMatchObject({ x: 278, y: 266 });
        for (const model of ['web-p', 'us-p'] as const) {
            const g = thermo2Geometry(model);
            const height = model === 'web-p' ? 640 : 480;
            expect(g.cx).toBe(160);
            expect(g.slots).toHaveLength(9);
            expect(g.fit).toBe(true);
            // 4 x 80 px over the full width
            expect(g.slots.slice(0, 4).map(b => b.x)).toEqual([0, 80, 160, 240]);
            expect(g.slots.slice(4, 8).map(b => b.x)).toEqual([0, 80, 160, 240]);
            expect(g.slots.slice(0, 8).every(b => b.w === 80)).toBe(true);
            const top = g.slots[0];
            const bottom = g.slots[4];
            // equal gaps: title bar - top row - ring block (ring top .. -/+ bottom) - bottom row - stage end
            const gaps = [
                top.y - 62,
                g.cy - 104 - (top.y + top.h),
                bottom.y - (g.cy + 118 + 26),
                height - (bottom.y + bottom.h),
            ];
            expect(Math.max(...gaps) - Math.min(...gaps), `${model}: ${gaps.join(',')}`).toBeLessThanOrEqual(4);
            expect(Math.min(...gaps)).toBeGreaterThan(5);
        }
        expect(thermo2Geometry('web-p').slots[0].h).toBe(80);
        expect(slot(render(FIELDS, 'web-l'), 4)).toContain('left:500px;top:72px;width:100px;height:55px');
    });

    it('shrinks a slot content into the portrait box instead of cutting it', () => {
        const box = { x: 0, y: 0, w: 80, h: 80, font: 3 };
        // 21,4°C in font 3 (36 px) is wider than 80 px
        expect(slotFitScale('21,4°C¬3', box)).toBeLessThan(1);
        // the bulb in font 4 (66 px) fits
        expect(slotFitScale(`${BULB}¬4`, box)).toBe(1);
        expect(slotFitScale('5%¬1', box)).toBe(1);
        const html = slot(render(FIELDS, 'web-p'), 1);
        expect(html).toContain('transform:scale(');
        // eu keeps the cut of the HMI
        expect(slot(render(FIELDS), 1)).not.toContain('transform:scale(');
    });

    it('aligns like xcen/ycen=1 and starts a line that does not fit at the top left, cut at the box', () => {
        const box = slot(render(FIELDS), 5);
        expect(box).toContain('justify-content:safe center;align-items:safe center;overflow:hidden');
        // the 128 px line of font 5 is higher than the 55 px box
        expect(box).toContain('height:128px');
        expect(box).toContain('white-space:nowrap');
    });

    it('drops non-ascii characters in font 5', () => {
        const html = render(['21,4°C¬5']);
        expect(slot(html, 0)).toContain('21,4C');
        expect(slot(html, 0)).not.toContain('°');
    });
});
