'use strict';

const { expect } = require('chai');
const { buttonPress, isMenuUpdate, parsePageType, parseWeatherUpdate } = require('../lib/protocol');
const { press, toMainPage, expectScreensaver, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 5: screensaver ⇄ page. The display timeout shows the screensaver, a double tap leads back to the start
 * page (also when the panel was on another page before), the screensaver content follows its states, and with a
 * short timeout (state `cmd.screenSaver.timeout`) the display returns to the screensaver by itself.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('05 Screensaver ⇄ page', () => {
        const { NSPANEL, IDS, HEADLINES } = ctx.config;
        const panel = () => ctx.nspanel;

        before(async () => {
            // start values of all test states, independent of the scenarios before
            await ctx.resetStates();
        });

        before(async function () {
            this.timeout(30_000);
            await toMainPage(panel(), HEADLINES.main);
        });

        step('display timeout on the entities page → screensaver with its content', async () => {
            let mark = await press(panel(), buttonPress('bSubNext', 'button'));
            await panel().waitFor(isMenuUpdate(HEADLINES.entities), { since: mark });
            mark = await press(panel(), 'event,sleepReached,cardEntities');
            const pageType = parsePageType(await panel().waitFor('pageType~screensaver~', { since: mark }));
            expect(pageType.card).to.equal('screensaver');
            // background, time, AM/PM and date color along with the pageType
            expect(pageType.colors).to.have.length(4);
            const upd = await panel().waitFor('weatherUpdate~', { since: mark });
            // every slot at its place: favorit, 4 bottom items (standard), temperature with the decimal comma of the
            // (default) locale
            expectScreensaver(upd, 'screensaver', 'standard', /^21[,.]5\s?°C$/);
            // after the pageType the colors come first, then the content (Screensaver.update())
            const after = panel().payloads(mark);
            const iColor = after.findIndex(p => p.startsWith('color~'));
            expect(iColor, 'color~ after the pageType').to.be.greaterThan(-1);
            expect(iColor).to.be.lessThan(after.indexOf(upd));
            // id of the screensaver page from the admin tab (adminScreensaverPageId)
            await ctx.waitForValue(ctx.panelState(NSPANEL.id, 'info.nspanel.currentPage'), 'scr-admin');
        });

        step('screensaver content follows its state', async () => {
            const mark = panel().mark();
            await ctx.setState(IDS.temperature, 23.4, true);
            const upd = await panel().waitFor(
                p =>
                    p.startsWith('weatherUpdate~') &&
                    /^23[,.]4\s?°C$/.test(parseWeatherUpdate(p, 'screensaver').favorit?.value ?? ''),
                { since: mark, what: 'weatherUpdate with 23,4 °C in the favorit' },
            );
            // the favorit and the bottom item `Temp` follow, the other slots stay
            expectScreensaver(upd, 'screensaver', 'standard', /^23[,.]4\s?°C$/);
            const back = panel().mark();
            await ctx.setState(IDS.temperature, 21.5, true);
            await panel().waitFor(
                p =>
                    p.startsWith('weatherUpdate~') &&
                    /^21[,.]5\s?°C$/.test(parseWeatherUpdate(p, 'screensaver').favorit?.value ?? ''),
                { since: back, what: 'weatherUpdate with 21,5 °C in the favorit' },
            );
        });

        step('a single tap does not leave the screensaver (double click is on)', async () => {
            const mark = await press(panel(), buttonPress('screensaver', 'bExit', 1));
            await panel().settle(1000);
            expect(
                panel()
                    .payloads(mark)
                    .some(p => p.startsWith('entityUpd~')),
            ).to.equal(false);
        });

        step('double tap → start page (not the page before), display timeout is sent', async () => {
            const mark = await press(panel(), buttonPress('screensaver', 'bExit', 2));
            await panel().waitFor('pageType~cardGrid', { since: mark });
            await panel().waitFor(isMenuUpdate(HEADLINES.main), { since: mark });
            const timeout = await panel().waitFor('timeout~', { since: mark });
            expect(Number(timeout.split('~')[1])).to.be.greaterThan(0);
        });

        describe('automatic return with a short timeout', () => {
            const timeoutState = () => ctx.panelState(NSPANEL.id, 'cmd.screenSaver.timeout');
            let oldTimeout;

            before(async () => {
                oldTimeout = (await ctx.getState(timeoutState()))?.val ?? 15;
            });

            after(async function () {
                this.timeout(20_000);
                panel().autoSleep = false;
                await ctx.setState(timeoutState(), oldTimeout);
                await ctx.waitForValue(timeoutState(), oldTimeout);
            });

            step('cmd.screenSaver.timeout = 2 → timeout~2 to the display', async () => {
                const mark = panel().mark();
                await ctx.setState(timeoutState(), 2);
                await panel().waitFor('timeout~2', { since: mark });
                await ctx.waitForState(timeoutState(), (v, st) => v === 2 && !!st && st.ack === true);
            });

            step('page → screensaver by the display timeout, without any further action', async function () {
                this.timeout(20_000);
                // from now on the virtual display runs its timeout like the HMI (sleepReached after timeout~<s>)
                panel().autoSleep = true;
                // the last touch: next arrow on the start page
                const mark = await press(panel(), buttonPress('bSubNext', 'button'));
                await panel().waitFor(isMenuUpdate(HEADLINES.entities), { since: mark });
                const start = Date.now();
                await panel().waitFor('pageType~screensaver~', { since: mark, timeout: 10_000 });
                expect(Date.now() - start).to.be.lessThan(5000);
                const order = panel()
                    .payloads(mark)
                    .filter(p => p.startsWith('pageType~'))
                    .map(p => p.split('~')[1]);
                expect(order).to.deep.equal(['cardEntities', 'screensaver']);
                // the page carries the short timeout to the display
                expect(panel().payloads(mark)).to.include('timeout~2');
            });
        });

        protocolCheck(ctx);
    });
};
