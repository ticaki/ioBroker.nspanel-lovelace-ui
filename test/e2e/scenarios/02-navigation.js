'use strict';

const { expect } = require('chai');
const { isMenuUpdate, parseMenuUpdate, buttonPress, icon } = require('../lib/protocol');
const { press, toMainPage, lastItem, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 2: navigation. Main grid ⇄ entities page with the arrows (next / prev), main grid → sub grid with a
 * navigation item and back up with the parent arrow. Same for the NSPanel and the web panel.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('02 Navigation', () => {
        const { NSPANEL, WEBPANEL, HEADLINES, NAMES } = ctx.config;

        before(async () => {
            // start values of all test states, independent of the scenarios before
            await ctx.resetStates();
        });

        for (const [label, getPanel, panelId] of [
            ['NSPanel', () => ctx.nspanel, NSPANEL.id],
            ['Web panel', () => ctx.web, WEBPANEL.id],
        ]) {
            describe(label, () => {
                const currentPage = () => ctx.panelState(panelId, 'info.nspanel.currentPage');

                before(async function () {
                    this.timeout(30_000);
                    await toMainPage(getPanel(), HEADLINES.main);
                });

                step('main page shows a next arrow', async () => {
                    const page = parseMenuUpdate(getPanel().findLast(isMenuUpdate(HEADLINES.main)));
                    expect(page.right.type).to.equal('button');
                    expect(page.right.id).to.equal('bSubNext');
                    expect(page.right.icon).to.equal(icon('arrow-right-bold'));
                    await ctx.waitForValue(currentPage(), 'main');
                });

                step('next → entities page', async () => {
                    const panel = getPanel();
                    const mark = await press(panel, buttonPress('bSubNext', 'button'));
                    await panel.waitFor('pageType~cardEntities', { since: mark });
                    const upd = await panel.waitFor(isMenuUpdate(HEADLINES.entities), { since: mark });
                    const page = parseMenuUpdate(upd);
                    // cardEntities: 4 rows (eu), the items in the configured order
                    expect(page.items.map(i => i.name)).to.deep.equal([NAMES.socket, NAMES.blind, '', '']);
                    expect(page.items.map(i => i.type)).to.deep.equal(['switch', 'shutter2', '', '']);
                    expect(page.left.type).to.equal('button');
                    expect(page.left.id).to.equal('bSubPrev');
                    expect(page.left.icon).to.equal(icon('arrow-left-bold'));
                    await ctx.waitForValue(currentPage(), 'e2e_entities');
                });

                step('prev → main page', async () => {
                    const panel = getPanel();
                    const mark = await press(panel, buttonPress('bSubPrev', 'button'));
                    await panel.waitFor('pageType~cardGrid', { since: mark });
                    await panel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
                    await ctx.waitForValue(currentPage(), 'main');
                });

                step('navigation item → sub page with an up arrow', async () => {
                    const panel = getPanel();
                    const nav = lastItem(panel, HEADLINES.main, NAMES.toSub);
                    const mark = await press(panel, buttonPress(nav.id, 'button'));
                    const upd = await panel.waitFor(isMenuUpdate(HEADLINES.sub), { since: mark });
                    const page = parseMenuUpdate(upd);
                    expect(page.items.map(i => i.name)).to.deep.equal([NAMES.socket2, '', '', '', '', '']);
                    expect(page.items[0].type).to.equal('switch');
                    // a page below another one: up arrow on the left, no right arrow
                    expect(page.left.id).to.equal('bUp');
                    expect(page.left.icon).to.equal(icon('arrow-up-bold'));
                    expect(page.right).to.deep.equal({ type: '', id: '', icon: '', color: '', name: '', value: '' });
                    await ctx.waitForValue(currentPage(), 'e2e_sub');
                });

                step('up → main page', async () => {
                    const panel = getPanel();
                    const mark = await press(panel, buttonPress('bUp', 'button'));
                    await panel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
                    await ctx.waitForValue(currentPage(), 'main');
                });
            });
        }

        protocolCheck(ctx);
    });
};
