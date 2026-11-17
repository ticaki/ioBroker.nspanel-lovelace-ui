'use strict';

const { expect } = require('chai');
const { buttonPress, isMenuUpdate, weatherLayout, parsePageType } = require('../lib/protocol');
const { press, toMainPage, expectScreensaver, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 6: all screensaver versions, switched live with the state `cmd.screenSaver.layout` (index into
 * arrayOfScreensaverModes: standard, alternate, advanced, easyview, tiles) while the screensaver is shown. The
 * screensaver of this panel comes from the admin tab "Screensaver" (mode standard) - at adapter start such a
 * screensaver sets the version itself (panel.ts, adminScreensaver), switching at runtime must still work.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('06 Screensaver modes', () => {
        const { NSPANEL, WEBPANEL, HEADLINES } = ctx.config;

        before(async () => {
            // start values of all test states, independent of the scenarios before
            await ctx.resetStates();
        });

        /** layout number → expected HMI page of the screensaver */
        const modes = [
            [2, 'advanced', 'screensaver2'],
            [3, 'easyview', 'screensaver3'],
            [4, 'tiles', 'screensaver5'],
            [1, 'alternate', 'screensaver'],
            [0, 'standard', 'screensaver'],
        ];

        for (const [label, getPanel, panelId] of [
            ['NSPanel', () => ctx.nspanel, NSPANEL.id],
            ['Web panel', () => ctx.web, WEBPANEL.id],
        ]) {
            describe(label, () => {
                const layoutState = () => ctx.panelState(panelId, 'cmd.screenSaver.layout');

                before(async function () {
                    this.timeout(30_000);
                    const panel = getPanel();
                    await toMainPage(panel, HEADLINES.main);
                    const mark = await press(panel, `event,sleepReached,${panel.currentCard}`);
                    await panel.waitFor('pageType~screensaver~', { since: mark });
                    await ctx.waitForValue(layoutState(), 0);
                });

                after(async function () {
                    this.timeout(20_000);
                    await ctx.setState(layoutState(), 0);
                    await ctx.waitForState(layoutState(), (v, st) => v === 0 && !!st && st.ack);
                });

                for (const [num, mode, card] of modes) {
                    step(`layout ${num} (${mode}) → pageType~${card}`, async function () {
                        this.timeout(20_000);
                        const panel = getPanel();
                        await panel.settle(600);
                        const mark = panel.mark();
                        const before = panel.currentCard;
                        await ctx.setState(layoutState(), num);
                        await ctx.waitForState(layoutState(), (v, st) => v === num && !!st && st.ack);
                        if (before !== card) {
                            const pt = await panel.waitFor(`pageType~${card}~`, {
                                since: mark,
                                what: `pageType~${card}`,
                            });
                            expect(parsePageType(pt).colors).to.have.length(4);
                        }
                        // the page is filled again after the switch, with the slots of this layout
                        const upd = await panel.waitFor(p => weatherLayout(p, card) === mode, {
                            since: mark,
                            what: `weatherUpdate of the layout ${mode}`,
                        });
                        expect(panel.currentCard).to.equal(card);
                        // every area at its place: standard and alternate share the page and differ in the slots
                        expectScreensaver(upd, card, mode, /^21[,.]5\s?°C$/);
                    });
                }

                step('back on a page and into the screensaver again: the switched version stays', async function () {
                    this.timeout(30_000);
                    const panel = getPanel();
                    let mark = panel.mark();
                    await ctx.setState(layoutState(), 2);
                    await panel.waitFor('pageType~screensaver2~', { since: mark });
                    mark = await press(panel, buttonPress('screensaver', 'bExit', 2));
                    await panel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
                    mark = await press(panel, 'event,sleepReached,cardGrid');
                    await panel.waitFor('pageType~screensaver2~', { since: mark });
                });
            });
        }

        protocolCheck(ctx);
    });
};
