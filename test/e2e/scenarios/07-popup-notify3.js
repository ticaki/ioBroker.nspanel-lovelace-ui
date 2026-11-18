'use strict';

const { expect } = require('chai');
const { buttonPress, isMenuUpdate, icon, color565 } = require('../lib/protocol');
const { press, toMainPage, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');
const { textWidth } = require('../../../build/lib/const/text-width');

/**
 * Scenario 7: the notification popup with a big icon (popupNotify3, HMI 6.2.0). Notifications are sent like a user
 * script does it (`sendTo setPopupNotification`), the panel answers with the events of the HMI page.
 *
 * - `largeIcon: true` on a panel with TFT 6.2.0+ (the virtual NSPanel reports 6.2.0 for this part, then 6.0.5 again)
 *   or on the web panel: `pageType~popupNotify3` and `entityUpdateDetail~<id>~<icon>~<iconColor>~<text>~<textColor>~
 *   <font>~<btnLeftIcon>~<btnLeftColor>~<btnRightIcon>~<btnRightColor>~<timeout>`.
 * - `icon` without `largeIcon`, or `largeIcon` on TFT < 6.2.0: the classic `popupNotify` as before.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('07 popupNotify3', () => {
        const { HEADLINES, NSPANEL, WEBPANEL } = ctx.config;
        const START_TFT = '6.0.5';

        /**
         * @param {Record<string, unknown>} message the notification
         * @returns {Promise<unknown>} answer of the adapter
         */
        const notify = message =>
            new Promise(resolve => ctx.harness.sendTo(ctx.namespace, 'setPopupNotification', message, resolve));

        /**
         * Sends a notification and waits for the popup page and its content.
         *
         * @param {any} panel virtual panel
         * @param {Record<string, unknown>} message the notification
         * @param {string} page expected HMI page
         * @returns {Promise<string[]>} fields of the entityUpdateDetail
         */
        const show = async (panel, message, page) => {
            await panel.settle(600);
            const mark = panel.mark();
            await notify(message);
            await panel.waitFor(p => p === `pageType~${page}`, { since: mark, what: `pageType~${page}` });
            const detail = await panel.waitFor(p => p.startsWith('entityUpdateDetail~'), {
                since: mark,
                what: `entityUpdateDetail of ${page}`,
            });
            return detail.split('~');
        };

        /**
         * Reports the TFT version with a new startup event and waits for the start page.
         *
         * @param {string} version TFT version
         */
        const setTft = async version => {
            await ctx.nspanel.settle(600);
            ctx.nspanel.opt.tftVersion = version;
            const mark = ctx.nspanel.mark();
            await ctx.nspanel.sendStartup();
            await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), {
                since: mark,
                timeout: 30_000,
                what: `start page after startup with TFT ${version}`,
            });
        };

        before(async () => {
            await ctx.resetStates();
        });

        describe('NSPanel, TFT 6.0.5', () => {
            before(async function () {
                this.timeout(30_000);
                await toMainPage(ctx.nspanel, HEADLINES.main);
            });

            step('icon without largeIcon: classic popupNotify with the small icon', async () => {
                const f = await show(
                    ctx.nspanel,
                    { panel: NSPANEL.id, id: 'e2e-classic', headline: 'Classic', text: 'Text', icon: 'cancel' },
                    'popupNotify',
                );
                expect(f).to.have.length(16);
                expect(f[2]).to.equal('Classic');
                expect(f[10]).to.equal('Text');
                expect(f[14]).to.equal(icon('cancel'));
                const mark = await press(ctx.nspanel, buttonPress('popupNotify', 'bExit'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'back to the start page' });
            });

            step('largeIcon on TFT 6.0.5: classic popupNotify', async () => {
                const f = await show(
                    ctx.nspanel,
                    {
                        panel: NSPANEL.id,
                        id: 'e2e-old-tft',
                        headline: 'Old TFT',
                        text: 'Text',
                        largeIcon: true,
                        icon: 'cancel',
                    },
                    'popupNotify',
                );
                expect(f).to.have.length(16);
                expect(f[2]).to.equal('Old TFT');
                const mark = await press(ctx.nspanel, buttonPress('popupNotify', 'bExit'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'back to the start page' });
            });
        });

        describe('NSPanel, TFT 6.2.0', () => {
            before(async function () {
                this.timeout(60_000);
                await setTft('6.2.0');
                await toMainPage(ctx.nspanel, HEADLINES.main);
            });

            after(async function () {
                this.timeout(60_000);
                await setTft(START_TFT);
            });

            let popupId = '';

            step('largeIcon: popupNotify3 with icon, colors, font and button icons', async () => {
                const f = await show(
                    ctx.nspanel,
                    {
                        panel: NSPANEL.id,
                        id: 'e2e-storm',
                        type: 'acknowledge',
                        headline: 'Storm',
                        text: 'Severe weather warning',
                        largeIcon: true,
                        icon: 'weather-lightning-rainy',
                        iconColor: '#ff8000',
                        buttonLeftIcon: 'alarm-snooze',
                        colorButtonLeft: '#304850',
                        buttonRightIcon: 'check-bold',
                        colorButtonRight: '#208020',
                    },
                    'popupNotify3',
                );
                popupId = f[1];
                expect(f).to.have.length(12);
                expect(f[2]).to.equal(icon('weather-lightning-rainy'));
                expect(f[3]).to.equal(color565('#ff8000'));
                expect(f[4]).to.equal('Severe weather warning');
                expect(f[5]).to.equal('65535');
                expect(f[6]).to.equal('3');
                expect(f[7]).to.equal(icon('alarm-snooze'));
                expect(f[8]).to.equal(color565('#304850'));
                expect(f[9]).to.equal(icon('check-bold'));
                expect(f[10]).to.equal(color565('#208020'));
                // alwaysOn is the default of sendTo: no timeout
                expect(f[11]).to.equal('0');
            });

            step('right button (button3): buttonRight state, the popup goes back to the start page', async () => {
                const mark = await press(ctx.nspanel, buttonPress(popupId, 'notifyAction', 'button3'));
                await ctx.waitForValue(ctx.panelState(NSPANEL.id, 'pagePopup.buttonRight'), 'e2e-storm');
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'back to the start page' });
            });

            step('font 0: two lines with CR LF, no buttons; the X (bExit popupNotify3) closes', async () => {
                const f = await show(
                    ctx.nspanel,
                    {
                        panel: NSPANEL.id,
                        id: 'e2e-wc',
                        text: 'The toilet is occupied right now, please wait a moment until it is free again',
                        largeIcon: true,
                        icon: 'cancel',
                        textSize: 0,
                    },
                    'popupNotify3',
                );
                expect(f[2]).to.equal(icon('cancel'));
                expect(f[6]).to.equal('0');
                const lines = f[4].split('\r\n');
                expect(lines).to.have.length(2);
                // the adapter wraps at spaces, every line fits the 434 px of the text field
                for (const line of lines) {
                    expect(textWidth(line, 0, 'eu')).to.be.at.most(434);
                }
                expect(lines[0].startsWith('The toilet is occupied')).to.equal(true);
                expect(f.slice(7, 11)).to.deep.equal(['', '', '', '']);
                const mark = await press(ctx.nspanel, buttonPress('popupNotify3', 'bExit'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'back to the start page' });
            });

            step('icon the panel does not have: popupNotify3 with information-outline', async () => {
                const f = await show(
                    ctx.nspanel,
                    { panel: NSPANEL.id, id: 'e2e-bulb', text: 'Light on', largeIcon: true, icon: 'lightbulb' },
                    'popupNotify3',
                );
                expect(f[2]).to.equal(icon('information-outline'));
                const mark = await press(ctx.nspanel, buttonPress('popupNotify3', 'bExit'));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'back to the start page' });
            });
        });

        describe('web panel', () => {
            before(async function () {
                this.timeout(30_000);
                await toMainPage(ctx.web, HEADLINES.main);
            });

            step('largeIcon: popupNotify3, every MDI icon', async () => {
                const f = await show(
                    ctx.web,
                    {
                        panel: WEBPANEL.id,
                        id: 'e2e-web',
                        text: 'Light on',
                        largeIcon: true,
                        icon: 'lightbulb',
                        iconColor: '#ffff00',
                        buttonRight: 'ok',
                    },
                    'popupNotify3',
                );
                expect(f).to.have.length(12);
                expect(f[2]).to.equal(icon('lightbulb'));
                expect(f[3]).to.equal(color565('#ffff00'));
                expect(f[4]).to.equal('Light on');
                // a button text without icon: the default icon
                expect(f[7]).to.equal('');
                expect(f[9]).to.equal(icon('check-bold'));
                const mark = await press(ctx.web, buttonPress('popupNotify3', 'bExit'));
                await ctx.web.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'back to the start page' });
            });
        });

        protocolCheck(ctx);
    });
};
