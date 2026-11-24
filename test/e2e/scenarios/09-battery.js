'use strict';

const { expect } = require('chai');
const { buttonPress, color565, icon, isMenuUpdate } = require('../lib/protocol');
const { press, toMainPage, lastItem, menuItemAt, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 9: channel of role `battery` as a row of the entities page. The icon follows the charge level (ACTUAL)
 * in steps of ten, the power (POWER) decides the rest: negative = charging (icon with flash, green), positive =
 * discharging (red), exactly 0 = neither (neutral color of the theme). The value is the charge level in percent.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('09 Battery', () => {
        const { IDS, HEADLINES, NAMES } = ctx.config;
        /** position of the battery row on the entities page */
        const ROW = 2;
        const GREEN = color565('#00ff00');
        const RED = color565('#ff0000');
        /** Color.neutral of the default theme (Color.Gray) */
        const NEUTRAL = color565('#888888');

        /**
         * Sets a battery state like the device reports it and waits for the row that shows it.
         *
         * @param {any} panel virtual panel
         * @param {string} id state id
         * @param {number} val value
         * @param {{ icon: string, color: string, value: string }} expected icon name, color and value of the row
         */
        async function report(panel, id, val, expected) {
            const mark = panel.mark();
            await ctx.setState(id, val, true);
            await panel.waitFor(
                menuItemAt(
                    HEADLINES.entities,
                    ROW,
                    NAMES.battery,
                    i => i.icon === icon(expected.icon) && i.color === expected.color && i.value === expected.value,
                ),
                { since: mark, what: `battery row ${expected.icon} ${expected.color} ${expected.value}` },
            );
        }

        before(async function () {
            this.timeout(60_000);
            // start values of all test states, independent of the scenarios before; only the panel under test
            // shows the page with the battery
            await ctx.resetStates();
            await ctx.setState(IDS.batteryActual, 54, true);
            await ctx.setState(IDS.batteryPower, 0, true);
            await toMainPage(ctx.nspanel, HEADLINES.main);
            await toMainPage(ctx.web, HEADLINES.main);
        });

        for (const [label, getPanel] of [
            ['NSPanel', () => ctx.nspanel],
            ['Web panel', () => ctx.web],
        ]) {
            describe(label, () => {
                before(async function () {
                    this.timeout(30_000);
                    const panel = getPanel();
                    const mark = await press(panel, buttonPress('bSubNext', 'button'));
                    await panel.waitFor(isMenuUpdate(HEADLINES.entities), { since: mark });
                });

                after(async function () {
                    this.timeout(30_000);
                    // back to the start values and off the page: the other panel must not get battery rows while
                    // its steps run, and no payload may be on its way when the suite closes the panels
                    const panel = getPanel();
                    const mark = panel.mark();
                    await ctx.setState(IDS.batteryPower, 0, true);
                    await ctx.setState(IDS.batteryActual, 54, true);
                    await panel.waitFor(
                        menuItemAt(HEADLINES.entities, ROW, NAMES.battery, i => i.value === '54%'),
                        { since: mark, what: 'battery row back at 54%' },
                    );
                    await toMainPage(panel, HEADLINES.main);
                });

                step('power 0 → icon of the charge level without flash, neutral color, value in percent', () => {
                    const row = lastItem(getPanel(), HEADLINES.entities, NAMES.battery);
                    expect(row.type).to.equal('text');
                    expect(row.icon).to.equal(icon('battery-50'));
                    expect(row.color).to.equal(NEUTRAL);
                    expect(row.value).to.equal('54%');
                });

                step('negative power → charging: icon with flash, green', async () => {
                    await report(getPanel(), IDS.batteryPower, -1500, {
                        icon: 'battery-charging-50',
                        color: GREEN,
                        value: '54%',
                    });
                });

                step('charge level rises → next icon step and new value, still charging', async () => {
                    await report(getPanel(), IDS.batteryActual, 100, {
                        icon: 'battery-charging',
                        color: GREEN,
                        value: '100%',
                    });
                });

                step('positive power → discharging: icon without flash, red', async () => {
                    await report(getPanel(), IDS.batteryPower, 800, { icon: 'battery', color: RED, value: '100%' });
                });

                step('charge level 0 while discharging → empty icon, still red', async () => {
                    await report(getPanel(), IDS.batteryActual, 0, {
                        icon: 'battery-outline',
                        color: RED,
                        value: '0%',
                    });
                });

                step('power back to 0 → neutral color again', async () => {
                    await report(getPanel(), IDS.batteryPower, 0, {
                        icon: 'battery-outline',
                        color: NEUTRAL,
                        value: '0%',
                    });
                });
            });
        }

        protocolCheck(ctx);
    });
};
