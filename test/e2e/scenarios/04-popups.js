'use strict';

const { expect } = require('chai');
const { buttonPress, isMenuUpdate, parseLightDetail, parseShutterDetail, icon } = require('../lib/protocol');
const { press, toMainPage, lastItem, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 4: popups. The light popup (dimmer channel) and the shutter popup (blind channel) are opened from the
 * grid and operated; every action must reach its state. Up / stop / down of the blind also work from the row of
 * the entities page.
 *
 * The HMI opens a popup page by itself (no `pageType~popup…` from the adapter): it sends
 * `event,pageOpenDetail,<popup>,<id>` and the adapter answers with `entityUpdateDetail~<id>~…`. A grid item of type
 * `shutter2` (blind channel) opens `popupShutter2`.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('04 Popups', () => {
        const { IDS, HEADLINES, NAMES } = ctx.config;

        before(async () => {
            // start values of all test states, independent of the scenarios before
            await ctx.resetStates();
        });

        /**
         * @param {string} id intNameEntity of the item
         * @returns {(p: string) => boolean} predicate for the entityUpdateDetail of the item
         */
        const detailOf = id => p => p.startsWith(`entityUpdateDetail~${id}~`);

        describe('NSPanel, light popup', () => {
            let lightId = '';

            before(async function () {
                this.timeout(30_000);
                await ctx.setState(IDS.lightOn, false, true);
                await ctx.setState(IDS.lightDimmer, 40, true);
                await toMainPage(ctx.nspanel, HEADLINES.main);
                lightId = lastItem(ctx.nspanel, HEADLINES.main, NAMES.light).id;
            });

            step('opens: entityUpdateDetail with state and brightness of the light', async () => {
                const mark = await press(ctx.nspanel, `event,pageOpenDetail,popupLight,${lightId}`);
                const detail = await ctx.nspanel.waitFor(detailOf(lightId), {
                    since: mark,
                    what: 'entityUpdateDetail light',
                });
                const d = parseLightDetail(detail);
                expect(d.count).to.equal(11);
                expect(d.id).to.equal(lightId);
                // the icon of the grid item, a color, off, brightness 40, no color temperature / color
                expect(d.icon).to.equal(lastItem(ctx.nspanel, HEADLINES.main, NAMES.light).icon);
                expect(d.color).to.match(/^\d+$/);
                expect(d.on).to.equal('0');
                expect(d.brightness).to.equal('40');
                expect(d.colorTemp).to.equal('disable');
                expect(d.colorMode).to.equal('disable');
                expect(d.brightnessText).to.equal('Brightness');
                expect(d.popup).to.equal('disable');
            });

            step('switch on → ON_SET true, popup shows on', async () => {
                const mark = await press(ctx.nspanel, buttonPress(lightId, 'OnOff', 1));
                await ctx.waitForValue(IDS.lightOn, true);
                await ctx.nspanel.waitFor(
                    p => detailOf(lightId)(p) && parseLightDetail(p).on === '1' && parseLightDetail(p).count === 11,
                    {
                        since: mark,
                        what: 'entityUpdateDetail light on',
                    },
                );
            });

            step('brightness slider → dimmer state', async () => {
                await press(ctx.nspanel, buttonPress(lightId, 'brightnessSlider', 75));
                await ctx.waitForValue(IDS.lightDimmer, 75);
            });

            step('dimmer state from outside → popup follows', async () => {
                const mark = ctx.nspanel.mark();
                await ctx.setState(IDS.lightDimmer, 20, true);
                await ctx.nspanel.waitFor(
                    p =>
                        detailOf(lightId)(p) &&
                        parseLightDetail(p).brightness === '20' &&
                        parseLightDetail(p).count === 11,
                    {
                        since: mark,
                        what: 'entityUpdateDetail light brightness 20',
                    },
                );
            });

            step('switch off → ON_SET false', async () => {
                await press(ctx.nspanel, buttonPress(lightId, 'OnOff', 0));
                await ctx.waitForValue(IDS.lightOn, false);
            });

            step('close (bExit) → back to the grid', async () => {
                const mark = await press(ctx.nspanel, buttonPress('popupLight', 'bExit'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
            });
        });

        describe('NSPanel, shutter popup', () => {
            let blindId = '';

            before(async function () {
                this.timeout(30_000);
                await ctx.setState(IDS.blindActual, 50, true);
                await ctx.setState(IDS.blindSet, 50, true);
                await toMainPage(ctx.nspanel, HEADLINES.main);
                blindId = lastItem(ctx.nspanel, HEADLINES.main, NAMES.blind).id;
            });

            step('opens: entityUpdateDetail with the position', async () => {
                const item = lastItem(ctx.nspanel, HEADLINES.main, NAMES.blind);
                expect(item.type).to.equal('shutter2');
                const mark = await press(ctx.nspanel, `event,pageOpenDetail,popupShutter2,${blindId}`);
                const detail = await ctx.nspanel.waitFor(detailOf(blindId), {
                    since: mark,
                    what: 'entityUpdateDetail blind',
                });
                const d = parseShutterDetail(detail);
                expect(d.count).to.equal(22);
                expect(d.id).to.equal(blindId);
                expect(d.position).to.equal('50');
                // first row: up / stop / down like the grid item, all usable at 50 %
                expect([d.up, d.stop, d.down]).to.deep.equal([icon('arrow-up'), icon('stop'), icon('arrow-down')]);
                expect([d.upStatus, d.stopStatus, d.downStatus]).to.deep.equal(['enable', 'enable', 'enable']);
                expect(d.shutterTyp).to.equal('shutter');
                expect(d.closedIsZero).to.equal('0');
            });

            step('position slider → SET', async () => {
                await press(ctx.nspanel, buttonPress(blindId, 'positionSlider', 30));
                await ctx.waitForValue(IDS.blindSet, 30);
            });

            step('position from outside → popup follows', async () => {
                const mark = ctx.nspanel.mark();
                await ctx.setState(IDS.blindActual, 80, true);
                await ctx.nspanel.waitFor(
                    p =>
                        detailOf(blindId)(p) &&
                        parseShutterDetail(p).position === '80' &&
                        parseShutterDetail(p).count === 22,
                    {
                        since: mark,
                        what: 'entityUpdateDetail blind position 80',
                    },
                );
            });

            for (const [action, id] of [
                ['up', IDS.blindOpen],
                ['stop', IDS.blindStop],
                ['down', IDS.blindClose],
            ]) {
                step(`${action} → ${id.split('.').pop()} true`, async () => {
                    await ctx.setState(id, false, true);
                    await press(ctx.nspanel, buttonPress(blindId, action));
                    await ctx.waitForValue(id, true);
                });
            }

            step('close (bExit) → back to the grid', async () => {
                const mark = await press(ctx.nspanel, buttonPress('popupShutter2', 'bExit'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
            });
        });

        describe('NSPanel, blind row of the entities page', () => {
            before(async function () {
                this.timeout(30_000);
                await toMainPage(ctx.nspanel, HEADLINES.main);
                const mark = await press(ctx.nspanel, buttonPress('bSubNext', 'button'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.entities), { since: mark });
            });

            for (const [action, id] of [
                ['up', IDS.blindOpen],
                ['stop', IDS.blindStop],
                ['down', IDS.blindClose],
            ]) {
                step(`${action} → ${id.split('.').pop()} true`, async () => {
                    await ctx.setState(id, false, true);
                    const item = lastItem(ctx.nspanel, HEADLINES.entities, NAMES.blind);
                    await press(ctx.nspanel, buttonPress(item.id, action));
                    await ctx.waitForValue(id, true);
                });
            }
        });

        describe('Web panel, light popup', () => {
            let lightId = '';

            before(async function () {
                this.timeout(30_000);
                await ctx.setState(IDS.lightOn, false, true);
                await ctx.setState(IDS.lightDimmer, 40, true);
                await toMainPage(ctx.web, HEADLINES.main);
                lightId = lastItem(ctx.web, HEADLINES.main, NAMES.light).id;
            });

            step('opens, switches on and dims', async () => {
                let mark = await press(ctx.web, `event,pageOpenDetail,popupLight,${lightId}`);
                const d = parseLightDetail(
                    await ctx.web.waitFor(detailOf(lightId), { since: mark, what: 'entityUpdateDetail light' }),
                );
                expect(d.count).to.equal(11);
                expect(d.on).to.equal('0');
                expect(d.brightness).to.equal('40');
                await press(ctx.web, buttonPress(lightId, 'OnOff', 1));
                await ctx.waitForValue(IDS.lightOn, true);
                await press(ctx.web, buttonPress(lightId, 'brightnessSlider', 55));
                await ctx.waitForValue(IDS.lightDimmer, 55);
                mark = await press(ctx.web, buttonPress('popupLight', 'bExit'));
                await ctx.web.waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
            });
        });

        protocolCheck(ctx);
    });
};
