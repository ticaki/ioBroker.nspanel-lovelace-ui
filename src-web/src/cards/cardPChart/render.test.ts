import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseCommand } from '../../protocol/commands';
import { initialGlobalState } from '../../store/PanelStore';
import { CardPChart } from './CardPChart';
import { initial, parseEntityUpd, type PieModel } from './parse';

const ctx = { pageType: 'cardPChart', pageArgs: [] };
const HEAD = 'entityUpd~Energie~button~bSubPrev~~65535~~~button~bSubNext~~65535~~~';

function model(payload: string): PieModel {
    return parseEntityUpd(parseCommand(payload).args, initial(), ctx);
}

function render(m: PieModel): string {
    return renderToStaticMarkup(
        React.createElement(CardPChart, {
            model: m,
            ctx,
            global: initialGlobalState('eu'),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

function count(html: string, needle: string): number {
    return html.split(needle).length - 1;
}

describe('cardPChart render', () => {
    it('draws nothing but the title bar before the first entityUpd', () => {
        const html = render(initial());
        expect(html).toContain('data-page="cardPChart"');
        expect(html).not.toContain('data-chart="pie"');
    });

    it('draws a sector per slice with a number and a legend row per slice', () => {
        const html = render(
            model(`${HEAD}~3~~Netzbezug~5200~5.20 kWh~63488~Eigennutzung~3100~3.10 kWh~2016~Rest~0~0.00 kWh~2047`),
        );
        expect(html).toContain('data-chart="pie"');
        expect(count(html, 'data-pie-sector=')).toBe(2);
        expect(count(html, 'data-legend-row=')).toBe(3);
        expect(html).toContain('Netzbezug');
        expect(html).toContain('5.20 kWh');
        expect(html).toContain('62.6 %');
        expect(html).toContain('0.0 %');
        expect(html).not.toContain('No Data');
        // the colours of the slices (63488 = red) on sector and swatch
        expect(count(html, 'fill="rgb(255, 0, 0)"')).toBe(2);
    });

    it('a single slice is drawn as a full circle', () => {
        const html = render(model(`${HEAD}~3~~A~10~10 W~2016`));
        expect(html).toContain('<circle');
        expect(html).toContain('r="100"');
    });

    it('legend mode 0 shows only the names', () => {
        const html = render(model(`${HEAD}~0~~A~10~10 W~2016~B~30~30 W~2047`));
        expect(count(html, 'data-legend="name"')).toBe(2);
        expect(html).not.toContain('data-legend="value"');
        expect(html).not.toContain('data-legend="percent"');
        expect(html).not.toContain('10 W');
        expect(html).not.toContain(' %');
    });

    it('legend mode 1 shows the value text, mode 2 the percentage', () => {
        const one = render(model(`${HEAD}~1~~A~10~10 W~2016~B~30~30 W~2047`));
        expect(one).toContain('10 W');
        expect(one).not.toContain(' %');
        const two = render(model(`${HEAD}~2~~A~10~10 W~2016~B~30~30 W~2047`));
        expect(two).not.toContain('10 W');
        expect(two).toContain('25.0 %');
        expect(two).toContain('75.0 %');
    });

    it('a sum of 0 shows the hint instead of the pie, the legend stays', () => {
        const html = render(model(`${HEAD}~3~~A~0~0 W~2016~B~0~0 W~2047`));
        expect(html).toContain('data-chart-nodata');
        expect(html).toContain('No Data');
        expect(html).not.toContain('data-pie-sector=');
        expect(count(html, 'data-legend-row=')).toBe(2);
    });
});
