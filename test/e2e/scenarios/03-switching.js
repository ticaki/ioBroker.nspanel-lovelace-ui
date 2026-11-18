'use strict';

const { expect } = require('chai');
const { buttonPress, isMenuUpdate } = require('../lib/protocol');
const { press, toMainPage, lastItem, menuItemAt, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 3: switching. A tap on the socket item of the grid and of the entities page writes the target state,
 * a change of the state from outside updates the item on the panel (value and icon color).
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('03 Switching', () => {
        const { IDS, HEADLINES, NAMES } = ctx.config;

        before(async () => {
            // start values of all test states, independent of the scenarios before
            await ctx.resetStates();
        });

        describe('NSPanel, grid page', () => {
            let offColor = '';

            before(async function () {
                this.timeout(30_000);
                await ctx.setState(IDS.socketSet, false, true);
                await toMainPage(ctx.nspanel, HEADLINES.main);
            });

            step('socket item shows off', () => {
                const item = lastItem(ctx.nspanel, HEADLINES.main, NAMES.socket);
                expect(item.type).to.equal('switch');
                expect(item.value).to.equal('0');
                expect(item.color).to.match(/^\d+$/);
                offColor = item.color;
            });

            step('tap → state true, item shows on with another icon color', async () => {
                const item = lastItem(ctx.nspanel, HEADLINES.main, NAMES.socket);
                const mark = await press(ctx.nspanel, buttonPress(item.id, 'OnOff', 1));
                const st = await ctx.waitForValue(IDS.socketSet, true);
                // the adapter writes a command, the device confirms it
                expect(st.ack).to.equal(false);
                const upd = await ctx.nspanel.waitFor(
                    menuItemAt(HEADLINES.main, 0, NAMES.socket, i => i.value === '1'),
                    { since: mark, what: 'socket item value 1' },
                );
                expect(upd).to.be.a('string');
                const on = lastItem(ctx.nspanel, HEADLINES.main, NAMES.socket);
                expect(on.color).to.match(/^\d+$/);
                expect(on.color).to.not.equal(offColor);
            });

            step('state false from outside → item shows off again', async () => {
                const mark = ctx.nspanel.mark();
                await ctx.setState(IDS.socketSet, false, true);
                await ctx.nspanel.waitFor(
                    menuItemAt(HEADLINES.main, 0, NAMES.socket, i => i.value === '0'),
                    { since: mark, what: 'socket item value 0' },
                );
                expect(lastItem(ctx.nspanel, HEADLINES.main, NAMES.socket).color).to.equal(offColor);
            });

            step('tap with 0 → state false', async () => {
                const mark = ctx.nspanel.mark();
                await ctx.setState(IDS.socketSet, true, true);
                await ctx.nspanel.waitFor(
                    menuItemAt(HEADLINES.main, 0, NAMES.socket, i => i.value === '1'),
                    {
                        since: mark,
                        what: 'socket item value 1',
                    },
                );
                const item = lastItem(ctx.nspanel, HEADLINES.main, NAMES.socket);
                const tap = await press(ctx.nspanel, buttonPress(item.id, 'OnOff', 0));
                await ctx.waitForValue(IDS.socketSet, false);
                await ctx.nspanel.waitFor(
                    menuItemAt(HEADLINES.main, 0, NAMES.socket, i => i.value === '0'),
                    { since: tap, what: 'socket item value 0' },
                );
            });
        });

        describe('NSPanel, entities page', () => {
            before(async function () {
                this.timeout(30_000);
                await ctx.setState(IDS.socketSet, false, true);
                await toMainPage(ctx.nspanel, HEADLINES.main);
                const mark = await press(ctx.nspanel, buttonPress('bSubNext', 'button'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.entities), { since: mark });
            });

            step('tap → state true, row shows on', async () => {
                const item = lastItem(ctx.nspanel, HEADLINES.entities, NAMES.socket);
                expect(item.value).to.equal('0');
                const mark = await press(ctx.nspanel, buttonPress(item.id, 'OnOff', 1));
                await ctx.waitForValue(IDS.socketSet, true);
                await ctx.nspanel.waitFor(
                    menuItemAt(HEADLINES.entities, 0, NAMES.socket, i => i.value === '1'),
                    {
                        since: mark,
                        what: 'socket row value 1',
                    },
                );
            });

            step('state false from outside → row shows off', async () => {
                const mark = ctx.nspanel.mark();
                await ctx.setState(IDS.socketSet, false, true);
                await ctx.nspanel.waitFor(
                    menuItemAt(HEADLINES.entities, 0, NAMES.socket, i => i.value === '0'),
                    {
                        since: mark,
                        what: 'socket row value 0',
                    },
                );
            });
        });

        describe('Web panel, grid page', () => {
            before(async function () {
                this.timeout(30_000);
                await ctx.setState(IDS.socketSet, false, true);
                await toMainPage(ctx.web, HEADLINES.main);
            });

            step('tap → state true, item shows on', async () => {
                const item = lastItem(ctx.web, HEADLINES.main, NAMES.socket);
                expect(item.value).to.equal('0');
                const mark = await press(ctx.web, buttonPress(item.id, 'OnOff', 1));
                await ctx.waitForValue(IDS.socketSet, true);
                await ctx.web.waitFor(
                    menuItemAt(HEADLINES.main, 0, NAMES.socket, i => i.value === '1'),
                    {
                        since: mark,
                        what: 'socket item value 1',
                    },
                );
            });

            step('state false from outside → item shows off', async () => {
                const mark = ctx.web.mark();
                await ctx.setState(IDS.socketSet, false, true);
                await ctx.web.waitFor(
                    menuItemAt(HEADLINES.main, 0, NAMES.socket, i => i.value === '0'),
                    {
                        since: mark,
                        what: 'socket item value 0',
                    },
                );
            });
        });

        protocolCheck(ctx);
    });
};
