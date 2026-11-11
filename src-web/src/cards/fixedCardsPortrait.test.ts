import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { parseCommand } from '../protocol/commands';
import type { PanelModel } from '../protocol/types';
import { initialGlobalState } from '../store/PanelStore';
import { contentWidth, stageSize, theme } from '../style/theme';
import { cardAlarmModule } from './cardAlarm';
import { cardChartModule } from './cardChart';
import { cardPChartModule } from './cardPChart';
import { cardPowerModule } from './cardPower';
import { cardQRModule } from './cardQR';
import { cardThermoModule } from './cardThermo';
import { cardUnlockModule } from './cardUnlock';
import type { AnyCardModule } from './CardContract';
import { cardStage } from './stageLayout';

const NAV = 'button~bSubPrev~~1592~~~button~bSubNext~~1592~~~';

/** the fixed cards with a payload from `scripts/examples` */
const CASES: readonly { pageType: string; module: AnyCardModule; payload: string }[] = [
    {
        pageType: 'cardAlarm',
        module: cardAlarmModule,
        payload: `entityUpd~Alarm~${NAV}alarm.haus~Deaktivieren - Zuhause~D1~Deaktivieren - Unterwegs~D2~Deaktivieren - Nacht~D3~Deaktiviere Urlaub~D4~~63488~enable~disable`,
    },
    {
        pageType: 'cardUnlock',
        module: cardUnlockModule,
        payload: `entityUpd~Unlock1~${NAV}unlock.haustuer~entsperren~U1~~~~~~~~49602~enable~disable`,
    },
    {
        pageType: 'cardThermo',
        module: cardThermoModule,
        payload:
            `entityUpd~Klima~${NAV}thermoAC~24.0 °C~200~Kühlen~100~350~10~~33808~1~thermoAC?1~~1055~1~thermoAC?2~~64512~1~` +
            'thermoAC?3~~2016~1~thermoAC?4~~65504~1~thermoAC?5~~2016~1~thermoAC?6~~65535~1~thermoAC?7~~52785~1~thermoAC?0~' +
            'Currently~State~~°C~260~1',
    },
    {
        pageType: 'cardPower',
        module: cardPowerModule,
        payload:
            `entityUpd~Energie~${NAV}~~~65535~~1.2 kW~~~~~~~350 W~~~~~65504~~3.5 kW~-80~~~~2047~~7.2 kW~60~~~~1024~~45 %~20~` +
            '~~~63488~~2.1 kW~60~~~既~65535~Heizung~0.8 kW~10~~~~~~~',
    },
    {
        pageType: 'cardQR',
        module: cardQRModule,
        payload: `entityUpd~Gast Wlan~${NAV}WIFI:T:WPA;S:GastWlan;P:geheim123;H:;~text~0~~65504~SSID~GastWlan~switch~1~~2016~WlanOn~1`,
    },
    {
        pageType: 'cardChart',
        module: cardChartModule,
        payload: `entityUpd~chart~${NAV}46500~~25:50:85~60^19~10~92~30~65~70~72~44^26~80~76~72~78~92~15~30^2~62`,
    },
    {
        pageType: 'cardLChart',
        module: cardChartModule,
        payload: `entityUpd~Temp~${NAV}46500~°C~100:150:200:250~0^02:00+120+240^06:00~0:136~60:133~120:130~180:125~240:120`,
    },
    {
        pageType: 'cardPChart',
        module: cardPChartModule,
        payload:
            `entityUpd~Energie heute~${NAV}~3~~Eigenverbrauch~376471~12.8 kWh~1838~Einspeisung~179412~6.1 kWh~9406~` +
            'Netzbezug~123529~4.2 kWh~62157~Batterie~100000~3.4 kWh~65184~Wallbox~220588~7.5 kWh~43575',
    },
];

function render(c: (typeof CASES)[number], model: PanelModel): string {
    const ctx = { pageType: c.pageType, pageArgs: [] };
    const parsed = c.module.parseEntityUpd(parseCommand(c.payload).args, c.module.initial(), ctx);
    return renderToStaticMarkup(
        React.createElement(c.module.Component, {
            model: parsed,
            ctx,
            global: initialGlobalState(model),
            send: () => undefined,
            press: () => undefined,
            openPopup: () => undefined,
        }),
    );
}

/** every absolutely placed box with left, top, width and height in px */
function boxes(html: string): { left: number; top: number; width: number; height: number }[] {
    const out: { left: number; top: number; width: number; height: number }[] = [];
    const re = /position:absolute;left:(-?[\d.]+)px;top:(-?[\d.]+)px;width:([\d.]+)px;height:([\d.]+)px/g;
    for (const m of html.matchAll(re)) {
        out.push({ left: Number(m[1]), top: Number(m[2]), width: Number(m[3]), height: Number(m[4]) });
    }
    return out;
}

describe('fixed cards on the portrait models', () => {
    it('are drawn as us-p on web-p, centred vertically', () => {
        for (const c of CASES) {
            expect(cardStage(c.pageType, 'web-p')).toEqual({
                model: 'us-p',
                left: 0,
                top: 80,
                width: 320,
                height: 480,
            });
        }
    });

    for (const c of CASES) {
        it(`${c.pageType}: title bar in the us-p width, every box inside the stage`, () => {
            const html = render(c, 'us-p');
            const width = contentWidth('us-p');
            const right = width - 2 * theme.navIconCenter;
            expect(html).toContain(`data-titlebar="" style="position:absolute;top:0;left:0;width:${width}px`);
            expect(html).toMatch(new RegExp(`data-nav="right" style="position:absolute;left:${right}px`));
            const stage = stageSize('us-p');
            const placed = boxes(html);
            expect(placed.length).toBeGreaterThan(0);
            for (const box of placed) {
                expect(box.left).toBeGreaterThanOrEqual(0);
                expect(box.left + box.width).toBeLessThanOrEqual(stage.width);
                expect(box.top + box.height).toBeLessThanOrEqual(stage.height);
            }
        });

        it(`${c.pageType}: keeps the eu title bar on eu`, () => {
            const html = render(c, 'eu');
            expect(html).toContain(
                `data-titlebar="" style="position:absolute;top:0;left:0;width:${contentWidth('eu')}px`,
            );
        });
    }
});
