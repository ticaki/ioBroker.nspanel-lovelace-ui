import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialGlobalState } from '../../store/PanelStore';
import { CardDevice } from './CardDevice';
import { initial, parseEntityUpd, type CardDeviceModel } from './parse';

const ctx = { pageType: 'cardDevice1', pageArgs: [] };
const NAV = Array.from({ length: 12 }, () => '');
const EMPTY = ['', '', '', '', '', ''];

/**
 * cardDevice1 with two info rows, no buttons and the given status slots (7-10).
 *
 * @param status the four status elements
 */
function model(status: string[][]): CardDeviceModel {
    const info = (k: number): string[] => ['text', `s${k}`, 'I', '65535', `Name${k}`, `${k} W`];
    return parseEntityUpd(
        ['T', ...NAV, ...EMPTY, ...info(1), ...info(2), ...EMPTY, ...EMPTY, ...EMPTY, ...EMPTY, ...status.flat()],
        initial(),
        ctx,
    );
}

function render(m: CardDeviceModel): string {
    return renderToStaticMarkup(
        React.createElement(CardDevice, {
            model: m,
            ctx,
            global: initialGlobalState('eu'),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/** the left edge of the touch area of an info row: its icon (wide 126, narrow 204) */
function areaLeft(html: string, slot: number): string | undefined {
    const part = html.split(`data-role="slot-${slot}"`)[1] ?? '';
    return /left:(\d+)px/.exec(part.split('data-role=')[0] ?? '')?.[1];
}

describe('cardDevice1 status icons', () => {
    it('all four empty: no grid, the info rows stay wide', () => {
        const html = render(model([EMPTY, EMPTY, EMPTY, EMPTY]));
        for (const slot of [7, 8, 9, 10]) {
            expect(html).not.toContain(`data-role="slot-${slot}"`);
        }
        expect(areaLeft(html, 1)).toBe('126');
    });

    it('one filled: the whole grid (empty cells stay as framed cells), the info rows get narrow', () => {
        const html = render(model([EMPTY, ['text', 's8', 'X', '63813', '', ''], EMPTY, EMPTY]));
        for (const slot of [7, 8, 9, 10]) {
            expect(html).toContain(`data-role="slot-${slot}"`);
        }
        expect(html.match(/data-empty=""/g)).toHaveLength(3);
        // the touch area of the narrow row starts at its icon (x 204)
        expect(areaLeft(html, 1)).toBe('204');
        expect(areaLeft(html, 2)).toBe('204');
    });
});
