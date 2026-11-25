'use strict';

const { expect } = require('chai');
const { icon, parseWeatherUpdate, weatherLayout } = require('../lib/protocol');
const { press, toMainPage, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 9: a pinned screensaver indicator (admin `pinned`). The admin list of the indicators is socket, window, an
 * empty place, the pinned item (index 3) and two items that are not pinned (A, B). The pinned item is shown by
 * `IDS.pinShown`, A and B by `IDS.pinExtra` - all hidden at the start, so the scenarios before see two indicators.
 *
 * On screensaver2 (advanced, 5 indicator slots): the pinned item stands on slot 3 (0-based), hidden it leaves the
 * slot empty, A and B fill the free slots and skip slot 3.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('09 Screensaver pinned indicator', () => {
        const { NSPANEL, WEBPANEL, HEADLINES, IDS, SCREENSAVER } = ctx.config;
        const card = 'screensaver2';

        /** the indicator slots as `pin`, `a`, `b`, `socket`, `window` or '' (empty) */
        const indicatorSlots = p => {
            if (!p.startsWith('weatherUpdate~') || weatherLayout(p, card) !== 'advanced') {
                return undefined;
            }
            return parseWeatherUpdate(p, card).indicator.map(slot => {
                switch (slot.icon) {
                    case icon(SCREENSAVER.pinIcons.pinned):
                        return 'pin';
                    case icon(SCREENSAVER.pinIcons.extraA):
                        return 'a';
                    case icon(SCREENSAVER.pinIcons.extraB):
                        return 'b';
                    case icon(SCREENSAVER.socketIcons.off):
                        return 'socket';
                    case icon(SCREENSAVER.windowIcons.off):
                        return 'window';
                    case '':
                        return slot.id === '' ? '' : `?${slot.id}`;
                    default:
                        return `?${slot.icon}`;
                }
            });
        };

        /**
         * Waits for the weatherUpdate with exactly these indicator slots.
         *
         * @param {any} panel virtual panel
         * @param {number} since mark
         * @param {string[]} expected slots ({@link indicatorSlots})
         */
        const expectSlots = async (panel, since, expected) => {
            const p = await panel.waitFor(q => JSON.stringify(indicatorSlots(q)) === JSON.stringify(expected), {
                since,
                what: `weatherUpdate with the indicators ${expected.join(',')}`,
            });
            expect(indicatorSlots(p)).to.deep.equal(expected);
        };

        for (const [label, getPanel, panelId] of [
            ['NSPanel', () => ctx.nspanel, NSPANEL.id],
            ['Web panel', () => ctx.web, WEBPANEL.id],
        ]) {
            describe(label, () => {
                const layoutState = () => ctx.panelState(panelId, 'cmd.screenSaver.layout');

                /**
                 * Sets a test state and waits for the weatherUpdate with these slots.
                 *
                 * @param {string} id state id
                 * @param {boolean} val value
                 * @param {string[]} expected slots
                 */
                const switchTo = async (id, val, expected) => {
                    const panel = getPanel();
                    await panel.settle(600);
                    const mark = panel.mark();
                    await ctx.setState(id, val, true);
                    await expectSlots(panel, mark, expected);
                };

                before(async function () {
                    this.timeout(30_000);
                    await ctx.resetStates();
                    await ctx.setState(IDS.pinShown, false, true);
                    await ctx.setState(IDS.pinExtra, false, true);
                    const panel = getPanel();
                    await toMainPage(panel, HEADLINES.main);
                    let mark = await press(panel, `event,sleepReached,${panel.currentCard}`);
                    await panel.waitFor(p => p.startsWith('pageType~screensaver'), {
                        since: mark,
                        what: 'pageType~screensaver*',
                    });
                    mark = panel.mark();
                    await ctx.setState(layoutState(), 2);
                    await ctx.waitForState(layoutState(), (v, st) => v === 2 && !!st && st.ack);
                    // all three hidden: the indicators as without them
                    await expectSlots(panel, mark, ['socket', 'window', '', '', '']);
                });

                after(async function () {
                    this.timeout(20_000);
                    await ctx.setState(IDS.pinShown, false, true);
                    await ctx.setState(IDS.pinExtra, false, true);
                    await ctx.setState(layoutState(), 0);
                    await ctx.waitForState(layoutState(), (v, st) => v === 0 && !!st && st.ack);
                });

                step('the pinned item shown: on its slot, the empty place before it stays empty', async function () {
                    this.timeout(20_000);
                    await switchTo(IDS.pinShown, true, ['socket', 'window', '', 'pin', '']);
                });

                step('two more items shown: they fill the free slots and skip the pinned one', async function () {
                    this.timeout(20_000);
                    await switchTo(IDS.pinExtra, true, ['socket', 'window', 'a', 'pin', 'b']);
                });

                step('the pinned item hidden: its slot stays empty, nothing moves up', async function () {
                    this.timeout(20_000);
                    await switchTo(IDS.pinShown, false, ['socket', 'window', 'a', '', 'b']);
                });
            });
        }

        protocolCheck(ctx);
    });
};
