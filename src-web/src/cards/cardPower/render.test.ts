import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PanelModel } from '../../protocol/types';
import { initialGlobalState } from '../../store/PanelStore';
import { CardPower } from './CardPower';
import { powerLayout } from './layout';
import { initial, parseEntityUpd, POWER_SLOT_POSITIONS, type CardPowerModel } from './parse';

const ctx = { pageType: 'cardPower', pageArgs: [] };

/** home without values, all six items with the same speed */
function model(speed: number): CardPowerModel {
    const navigation = Array.from({ length: 12 }, () => '');
    const home = ['text', 'home', 'B', '65535', '', '1 kW', '', 'text', 'home', '', '', '', '', ''];
    const items = Array.from({ length: 6 }, (_, i) => ['text', `item${i}`, 'A', '65535', '', `${i} W`, `${speed}`]);
    return parseEntityUpd(['Power', ...navigation, ...home, ...items.flat()], initial(), ctx);
}

function render(m: CardPowerModel, panel: PanelModel): string {
    return renderToStaticMarkup(
        React.createElement(CardPower, {
            model: m,
            ctx,
            global: initialGlobalState(panel),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/** `true` when the dot of the slot runs along its line (left -> right / top -> bottom) */
function alongLine(html: string, position: string): boolean {
    const match = new RegExp(
        `data-flow="${position}"[^>]*><div data-dot="" style="[^"]*animation-direction:(normal|reverse)`,
    ).exec(html);
    expect(match, position).not.toBeNull();
    return match?.[1] === 'normal';
}

/** `true` when the dot of the slot moves towards the house */
function towardsHouse(html: string, panel: PanelModel, index: number): boolean {
    const along = alongLine(html, POWER_SLOT_POSITIONS[index]);
    return powerLayout(panel).slots[index].startsAtItem ? along : !along;
}

describe('cardPower flow direction like the HMI', () => {
    // HMI page cardPower, timer tm0: h<n>.val += t<n>Speed.val, landscape negates the speed (p0.h==320)
    for (const panel of ['eu', 'us-l', 'us-p', 'web-p', 'web-l'] as const) {
        it(`${panel}: a positive speed moves the dot to the left / upper end of every line`, () => {
            const html = render(model(50), panel);
            for (const [i, position] of POWER_SLOT_POSITIONS.entries()) {
                expect(alongLine(html, position), position).toBe(false);
                // items 0…2 (left / above the house): away from the house, items 3…5: towards it
                expect(towardsHouse(html, panel, i), position).toBe(i >= 3);
            }
        });

        it(`${panel}: a negative speed moves the dot to the right / lower end of every line`, () => {
            const html = render(model(-50), panel);
            for (const [i, position] of POWER_SLOT_POSITIONS.entries()) {
                expect(alongLine(html, position), position).toBe(true);
                expect(towardsHouse(html, panel, i), position).toBe(i < 3);
            }
        });
    }

    it('draws no dot for speed 0', () => {
        const html = render(model(0), 'eu');
        expect(html).toContain('data-flow="leftTop"');
        expect(html).not.toContain('data-dot=');
    });
});
