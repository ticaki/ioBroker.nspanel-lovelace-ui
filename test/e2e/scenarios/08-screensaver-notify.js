'use strict';

const { expect } = require('chai');
const { buttonPress, isMenuUpdate, parseNotify, icon, color565 } = require('../lib/protocol');
const { press, toMainPage, protocolCheck } = require('../lib/steps');
const { step } = require('../lib/snapshot');

/**
 * Scenario 8: the notification of the screensaver (Schlagzeile) per `sendTo screensaverNotify`, black box against
 * the interface description doc/prompts/prompt_sendto-screensaver-notify.md - every rule there that the E2E run can
 * observe, plus the answers of `setPopupNotification`.
 *
 * The panels show a notification only on the screensaver: both go there first and stay there (no tap, a tap hides
 * the notification on the display). What the adapter sends is `notify~heading~text[~headColor~textColor~background~
 * blink]` (parseNotify), an empty heading and text clears it. Every step leaves the queues empty (sendTo with `id`),
 * the old single place off and the admin notification off.
 *
 * Content changes of the shown notification are throttled by the adapter (at most every 30 s, doc/de/Screensaver-
 * Notify.md) - the steps that replace the content of a shown notification wait up to THROTTLE_MS.
 *
 * @param {import('../lib/context').E2EContext} ctx shared context
 */
module.exports = ctx => {
    describe('08 Screensaver notify (sendTo)', () => {
        const { NSPANEL, WEBPANEL, HEADLINES, IDS, ADMIN_NOTIFY } = ctx.config;
        /** longer than the throttle of content changes (30 s) */
        const THROTTLE_MS = 40_000;
        const CLEAR = { heading: '', text: '' };

        const panels = () => [ctx.nspanel, ctx.web];

        /**
         * @param {string} command sendTo command
         * @param {Record<string, unknown>} message the message
         * @returns {Promise<unknown>} answer of the adapter
         */
        const sendTo = (command, message) =>
            new Promise(resolve => ctx.harness.sendTo(ctx.namespace, command, message, resolve));

        /**
         * Sends `screensaverNotify` after both panels are quiet.
         *
         * @param {Record<string, unknown>} message the message
         * @returns {Promise<{ answer: any, ns: number, web: number }>} answer and the marks of both panels before it
         */
        const notify = async message => {
            await Promise.all(panels().map(p => p.settle(600)));
            const ns = ctx.nspanel.mark();
            const web = ctx.web.mark();
            const answer = await sendTo('screensaverNotify', message);
            return { answer, ns, web };
        };

        /**
         * @param {{ heading: string, text: string }} expected heading and text
         * @returns {(p: string) => boolean} predicate: notify with this heading and text
         */
        const isNotify = expected => p =>
            p.startsWith('notify~') &&
            parseNotify(p).heading === expected.heading &&
            parseNotify(p).text === expected.text;

        /**
         * Waits for the notification on a panel.
         *
         * @param {any} panel virtual panel
         * @param {number} since mark
         * @param {{ heading: string, text: string }} expected heading and text (CLEAR: no notification)
         * @param {number} [timeout] ms
         * @returns {Promise<ReturnType<typeof parseNotify>>} the notify payload
         */
        const expectNotify = async (panel, since, expected, timeout) => {
            const p = await panel.waitFor(isNotify(expected), {
                since,
                timeout,
                what: `notify~${expected.heading}~${expected.text}`,
            });
            return parseNotify(p);
        };

        /**
         * After a quiet time: no other notification than `expected` arrived since the mark (also none at all is fine).
         *
         * @param {any} panel virtual panel
         * @param {number} since mark
         * @param {{ heading: string, text: string }} expected the notification that stays
         * @param {number} [quietMs] quiet time
         */
        const expectUnchanged = async (panel, since, expected, quietMs = 1500) => {
            await panel.settle(quietMs);
            const got = panel
                .payloads(since)
                .filter(p => p.startsWith('notify~'))
                .map(parseNotify)
                .map(n => ({ heading: n.heading, text: n.text }));
            for (const n of got) {
                expect(n, `${panel.name}: notification since mark ${since}`).to.deep.equal(expected);
            }
        };

        /** @returns {{ heading: string, text: string }} heading and text */
        const ht = (heading, text) => ({ heading, text });

        /**
         * Brings a panel to its screensaver (display timeout).
         *
         * @param {any} panel virtual panel
         */
        const toScreensaver = async panel => {
            if (panel.currentCard.startsWith('screensaver')) {
                return;
            }
            const mark = await press(panel, `event,sleepReached,${panel.currentCard}`);
            await panel.waitFor(p => p.startsWith('pageType~screensaver'), {
                since: mark,
                what: 'pageType~screensaver*',
            });
        };

        /** Empties the queues, switches the old place and the admin notification off - waits until both are clear. */
        const clearAll = async () => {
            await ctx.setState(IDS.notifyAdmin, false, true);
            await notify({ id: 'e2e.', priority: -100 });
            await notify({ id: 'other.', priority: -100 });
            await notify({ heading: '', text: '', enabled: false });
            await Promise.all(panels().map(p => p.settle(1500)));
        };

        /**
         * Tasmota commands `Buzzer` of the NSPanel since an index of `tasmotaCommands`.
         *
         * @param {number} since index
         * @returns {string[]} payloads
         */
        const buzzerSince = since =>
            ctx.nspanel.tasmotaCommands
                .slice(since)
                .filter(c => c.topic.toLowerCase() === 'buzzer')
                .map(c => c.payload);

        /**
         * Waits for a `Buzzer` command of the NSPanel.
         *
         * @param {number} since index of tasmotaCommands
         * @param {number} [timeout] ms
         * @returns {Promise<string[]>} payloads
         */
        const waitBuzzer = async (since, timeout = 5000) => {
            const start = Date.now();
            while (Date.now() - start < timeout) {
                const got = buzzerSince(since);
                if (got.length) {
                    return got;
                }
                await new Promise(r => setTimeout(r, 100));
            }
            return buzzerSince(since);
        };

        before(async () => {
            await ctx.resetStates();
        });

        before(async function () {
            this.timeout(60_000);
            for (const panel of panels()) {
                await toMainPage(panel, HEADLINES.main);
                await toScreensaver(panel);
            }
            await clearAll();
        });

        after(async function () {
            this.timeout(60_000);
            await clearAll();
        });

        describe('old way without id', () => {
            afterEach(async function () {
                this.timeout(30_000);
                await clearAll();
            });

            step('heading/text/enabled: true without panel → all panels, answer ok', async () => {
                const { answer, ns, web } = await notify({ heading: 'Old', text: 'old way', enabled: true });
                expect(answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, ns, ht('Old', 'old way'));
                await expectNotify(ctx.web, web, ht('Old', 'old way'));
            });

            step('headline instead of heading, panel as MQTT topic → only this panel', async () => {
                const { answer, ns, web } = await notify({
                    panel: NSPANEL.topic,
                    headline: 'Old2',
                    text: 'headline',
                    enabled: true,
                });
                expect(answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, ns, ht('Old2', 'headline'));
                await expectUnchanged(ctx.web, web, CLEAR);
            });

            step('enabled missing = off', async () => {
                let r = await notify({ heading: 'Old3', text: 'on', enabled: true });
                await expectNotify(ctx.nspanel, r.ns, ht('Old3', 'on'));
                await expectNotify(ctx.web, r.web, ht('Old3', 'on'));
                r = await notify({ heading: 'Old3', text: 'still there?' });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                await expectNotify(ctx.web, r.web, CLEAR);
                // the end state is off - that the new content does not show up for a moment before is checked below
                await Promise.all(panels().map(p => p.settle(1500)));
                for (const panel of panels()) {
                    const last = panel.findLast(p => p.startsWith('notify~'), r[panel === ctx.nspanel ? 'ns' : 'web']);
                    expect(parseNotify(last ?? 'notify~~'), `${panel.name}: last notify`).to.include(CLEAR);
                }
            });

            // `enabled` missing = off: the adapter switches off before it takes the new content - no flash of it
            it('enabled missing: the new content is not shown in between', async () => {
                let r = await notify({ heading: 'Old3', text: 'on', enabled: true });
                await expectNotify(ctx.nspanel, r.ns, ht('Old3', 'on'));
                r = await notify({ heading: 'Old3', text: 'still there?' });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                await expectUnchanged(ctx.nspanel, r.ns, CLEAR);
            });

            step('covers a queued notification, after switching off the queue shows again', async () => {
                let r = await notify({ id: 'e2e.under-old', priority: 1, headline: 'Queue', text: 'prio 1' });
                await expectNotify(ctx.nspanel, r.ns, ht('Queue', 'prio 1'));
                r = await notify({ panel: NSPANEL.id, heading: 'Old4', text: 'covers', enabled: true });
                await expectNotify(ctx.nspanel, r.ns, ht('Old4', 'covers'));
                r = await notify({ panel: NSPANEL.id, heading: 'Old4', text: 'covers', enabled: false });
                await expectNotify(ctx.nspanel, r.ns, ht('Queue', 'prio 1'));
            });

            step('priority, icon and colors have no effect on the old place', async () => {
                let r = await notify({ panel: NSPANEL.id, heading: 'Old5', text: 'plain', enabled: true });
                const plain = await expectNotify(ctx.nspanel, r.ns, ht('Old5', 'plain'));
                r = await notify({ panel: NSPANEL.id, heading: '', text: '', enabled: false });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                r = await notify({
                    panel: NSPANEL.id,
                    heading: 'Old5',
                    text: 'plain',
                    enabled: true,
                    priority: 0,
                    icon: 'washing-machine',
                    colorHeadline: '#ff0000',
                    colorText: { r: 0, g: 255, b: 0 },
                    backgroundBlink: '#9c201a',
                });
                const decorated = await expectNotify(ctx.nspanel, r.ns, ht('Old5', 'plain'));
                expect(decorated, 'same payload as without priority/icon/colors').to.deep.equal(plain);
            });
        });

        describe('with id: queue', () => {
            afterEach(async function () {
                this.timeout(30_000);
                await clearAll();
            });

            step('show on all panels, answer ok', async () => {
                const { answer, ns, web } = await notify({ id: 'e2e.show', headline: 'Show', text: 'queue' });
                expect(answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, ns, ht('Show', 'queue'));
                await expectNotify(ctx.web, web, ht('Show', 'queue'));
            });

            step('same id replaces the content and keeps its place among the same priority', async function () {
                this.timeout(THROTTLE_MS + 30_000);
                let r = await notify({ id: 'e2e.first', headline: 'First', text: 'v1', panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('First', 'v1'));
                r = await notify({ id: 'e2e.second', headline: 'Second', text: 'v1', panel: NSPANEL.id });
                await expectUnchanged(ctx.nspanel, r.ns, ht('First', 'v1'));
                // replacing the older one: it stays in front of 'second' (a new entry would be behind it)
                r = await notify({ id: 'e2e.first', headline: 'First', text: 'v2', panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('First', 'v2'), THROTTLE_MS);
                // only one entry of 'first': removing it shows 'second', not the old content of 'first'
                r = await notify({ id: 'e2e.first', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, ht('Second', 'v1'));
                r = await notify({ id: 'e2e.second', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
            });

            step('remove with priority 0 and with enabled: false', async () => {
                let r = await notify({ id: 'e2e.rm1', priority: 10, headline: 'Rm1', text: 'x' });
                await expectNotify(ctx.nspanel, r.ns, ht('Rm1', 'x'));
                r = await notify({ id: 'e2e.rm2', priority: 20, headline: 'Rm2', text: 'y' });
                await expectUnchanged(ctx.nspanel, r.ns, ht('Rm1', 'x'));
                r = await notify({ id: 'e2e.rm1', priority: 0 });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, r.ns, ht('Rm2', 'y'));
                await expectNotify(ctx.web, r.web, ht('Rm2', 'y'));
                r = await notify({ id: 'e2e.rm2', enabled: false });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                await expectNotify(ctx.web, r.web, CLEAR);
            });

            step('priority <= -100 removes all ids with this prefix, others stay', async () => {
                let r = await notify({ id: 'e2e.pre.a', priority: 10, headline: 'PreA', text: 'a' });
                await expectNotify(ctx.nspanel, r.ns, ht('PreA', 'a'));
                await notify({ id: 'e2e.pre.b', priority: 20, headline: 'PreB', text: 'b' });
                r = await notify({ id: 'other.keep', priority: 30, headline: 'Keep', text: 'other prefix' });
                await expectUnchanged(ctx.nspanel, r.ns, ht('PreA', 'a'));
                r = await notify({ id: 'e2e.pre.', priority: -100 });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, r.ns, ht('Keep', 'other prefix'));
                await expectNotify(ctx.web, r.web, ht('Keep', 'other prefix'));
            });

            step('default priority is 50, the smallest priority is shown, FIFO at the same priority', async () => {
                let r = await notify({ id: 'e2e.p51', priority: 51, headline: 'P51', text: 'x' });
                await expectNotify(ctx.nspanel, r.ns, ht('P51', 'x'));
                // default (50) beats 51
                r = await notify({ id: 'e2e.default', headline: 'Default', text: 'x' });
                await expectNotify(ctx.nspanel, r.ns, ht('Default', 'x'));
                // 50 is not smaller than the default: the older one stays
                r = await notify({ id: 'e2e.p50', priority: 50, headline: 'P50', text: 'x' });
                await expectUnchanged(ctx.nspanel, r.ns, ht('Default', 'x'));
                // 49 beats the default
                r = await notify({ id: 'e2e.p49', priority: 49, headline: 'P49', text: 'x' });
                await expectNotify(ctx.nspanel, r.ns, ht('P49', 'x'));
                // removing 49: of the two with 50 the older (default) comes back, then P50, then P51
                r = await notify({ id: 'e2e.p49', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, ht('Default', 'x'));
                r = await notify({ id: 'e2e.default', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, ht('P50', 'x'));
                r = await notify({ id: 'e2e.p50', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, ht('P51', 'x'));
            });

            step('same priority as a notification of the admin list: sendTo wins', async () => {
                let ns = ctx.nspanel.mark();
                let web = ctx.web.mark();
                await ctx.setState(IDS.notifyAdmin, true, true);
                const admin = ht(ADMIN_NOTIFY.headline, ADMIN_NOTIFY.text);
                await expectNotify(ctx.nspanel, ns, admin);
                await expectNotify(ctx.web, web, admin);
                const r = await notify({
                    id: 'e2e.tie',
                    priority: ADMIN_NOTIFY.priority,
                    headline: 'Tie',
                    text: 'sendTo',
                });
                await expectNotify(ctx.nspanel, r.ns, ht('Tie', 'sendTo'));
                await expectNotify(ctx.web, r.web, ht('Tie', 'sendTo'));
                const back = await notify({ id: 'e2e.tie', priority: 0 });
                await expectNotify(ctx.nspanel, back.ns, admin);
                ns = ctx.nspanel.mark();
                web = ctx.web.mark();
                await ctx.setState(IDS.notifyAdmin, false, true);
                await expectNotify(ctx.nspanel, ns, CLEAR);
                await expectNotify(ctx.web, web, CLEAR);
            });

            step('queue of 10: an 11th more important one pushes out the least important', async function () {
                this.timeout(60_000);
                for (let i = 0; i < 9; i++) {
                    await notify({ id: `e2e.q.keep.${i}`, priority: 10 + i, headline: `Q${i}`, text: 'q' });
                }
                await notify({ id: 'e2e.q.last', priority: 19, headline: 'QLast', text: 'q' });
                let r = await notify({ id: 'e2e.q.keep.new', priority: 5, headline: 'QNew', text: 'q' });
                await expectNotify(ctx.nspanel, r.ns, ht('QNew', 'q'));
                // all but 'last' gone: 'last' (priority 19) was pushed out by the 11th
                r = await notify({ id: 'e2e.q.keep.', priority: -100 });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                await expectUnchanged(ctx.nspanel, r.ns, CLEAR);
            });

            step('queue of 10: an 11th less important one is dropped itself', async function () {
                this.timeout(60_000);
                for (let i = 0; i < 9; i++) {
                    await notify({ id: `e2e.q.keep.${i}`, priority: 10 + i, headline: `Q${i}`, text: 'q' });
                }
                await notify({ id: 'e2e.q.last', priority: 19, headline: 'QLast', text: 'q' });
                let r = await notify({ id: 'e2e.q.extra', priority: 30, headline: 'QExtra', text: 'q' });
                expect(r.answer, 'answer of the dropped one').to.deep.equal({ result: 'ok' });
                r = await notify({ id: 'e2e.q.keep.', priority: -100 });
                await expectNotify(ctx.nspanel, r.ns, ht('QLast', 'q'));
                r = await notify({ id: 'e2e.q.last', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                await expectUnchanged(ctx.nspanel, r.ns, CLEAR);
            });

            step('enabled: true is ignored with id: the message goes to the queue, not to the old place', async () => {
                let r = await notify({ id: 'e2e.top', priority: 10, headline: 'Top', text: 'x' });
                await expectNotify(ctx.nspanel, r.ns, ht('Top', 'x'));
                // the old place would cover 'top'
                r = await notify({ id: 'e2e.en', priority: 60, headline: 'En', text: 'x', enabled: true });
                await expectUnchanged(ctx.nspanel, r.ns, ht('Top', 'x'));
                r = await notify({ id: 'e2e.top', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, ht('En', 'x'));
                r = await notify({ id: 'e2e.en', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
            });
        });

        describe('with id: fields', () => {
            afterEach(async function () {
                this.timeout(30_000);
                await clearAll();
            });

            step('icon stands in front of the headline', async () => {
                const r = await notify({ id: 'e2e.icon', headline: 'Wash', text: 'done', icon: 'washing-machine' });
                const n = parseNotify(
                    await ctx.nspanel.waitFor(p => p.startsWith('notify~') && parseNotify(p).text === 'done', {
                        since: r.ns,
                        what: 'notify with text done',
                    }),
                );
                const glyph = icon('washing-machine');
                expect(n.heading.startsWith(glyph), `heading ${n.heading} starts with the icon`).to.equal(true);
                expect(n.heading.slice(glyph.length).trim()).to.equal('Wash');
            });

            step('colorHeadline / colorText as {r,g,b} and #rrggbb', async () => {
                let r = await notify({ id: 'e2e.plain', headline: 'Plain', text: 'theme' });
                const plain = await expectNotify(ctx.nspanel, r.ns, ht('Plain', 'theme'));
                r = await notify({ id: 'e2e.plain', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                r = await notify({
                    id: 'e2e.color1',
                    headline: 'Color1',
                    text: 'x',
                    colorHeadline: { r: 255, g: 0, b: 0 },
                    colorText: '#00ff00',
                });
                const c1 = await expectNotify(ctx.nspanel, r.ns, ht('Color1', 'x'));
                expect(c1.headColor, 'headline {r,g,b}').to.equal(color565('#ff0000'));
                expect(c1.textColor, 'text #rrggbb').to.equal(color565('#00ff00'));
                r = await notify({ id: 'e2e.color1', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
                r = await notify({
                    id: 'e2e.color2',
                    headline: 'Color2',
                    text: 'x',
                    colorHeadline: '#0000ff',
                    colorText: { r: 255, g: 255, b: 0 },
                });
                const c2 = await expectNotify(ctx.nspanel, r.ns, ht('Color2', 'x'));
                expect(c2.headColor, 'headline #rrggbb').to.equal(color565('#0000ff'));
                expect(c2.textColor, 'text {r,g,b}').to.equal(color565('#ffff00'));
                // without colors the theme colors - not the ones of the message before
                expect([plain.headColor, plain.textColor]).to.not.deep.equal([c2.headColor, c2.textColor]);
            });

            step('backgroundBlink: second background on the web panel', async () => {
                const r = await notify({ id: 'e2e.blink', headline: 'Blink', text: 'x', backgroundBlink: '#9c201a' });
                const web = await expectNotify(ctx.web, r.web, ht('Blink', 'x'));
                expect(web.background, 'background (field 5) is set').to.match(/^\d+$/);
                expect(web.blink, 'second background (field 6)').to.equal(color565('#9c201a'));
                // the NSPanel (TFT 6.0.5) shows the notification - blinking or not is up to its TFT
                await expectNotify(ctx.nspanel, r.ns, ht('Blink', 'x'));
            });

            step('fields of the popup are ignored without error', async () => {
                const r = await notify({
                    id: 'e2e.popupfields',
                    headline: 'PopupFields',
                    text: 'x',
                    buttonLeft: 'no',
                    buttonMid: 'mid',
                    buttonRight: 'yes',
                    colorButtonLeft: '#ff0000',
                    colorButtonMid: '#00ff00',
                    colorButtonRight: '#0000ff',
                    buttonLeftIcon: 'cancel',
                    buttonRightIcon: 'check-bold',
                    iconColor: '#ff8000',
                    largeIcon: true,
                    textSize: 0,
                    alwaysOn: true,
                });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                const n = await expectNotify(ctx.nspanel, r.ns, ht('PopupFields', 'x'));
                expect(n.headColor === undefined || n.headColor !== color565('#ff8000')).to.equal(true);
                // no popup page
                await ctx.nspanel.settle(1200);
                expect(ctx.nspanel.payloads(r.ns).filter(p => p.startsWith('pageType~'))).to.deep.equal([]);
                expect(ctx.web.payloads(r.web).filter(p => p.startsWith('pageType~'))).to.deep.equal([]);
            });
        });

        describe('panel', () => {
            afterEach(async function () {
                this.timeout(30_000);
                await clearAll();
            });

            const single = [
                ['name (id of the panel table)', NSPANEL.id],
                ['friendlyName', NSPANEL.name],
                ['MQTT topic', NSPANEL.topic],
            ];
            for (const [what, panel] of single) {
                step(`by ${what} → only this panel`, async () => {
                    const r = await notify({ id: 'e2e.target', headline: 'Target', text: what, panel });
                    expect(r.answer).to.deep.equal({ result: 'ok' });
                    await expectNotify(ctx.nspanel, r.ns, ht('Target', what));
                    await expectUnchanged(ctx.web, r.web, CLEAR);
                });
            }

            step('array of friendlyName and topic → both panels', async () => {
                const r = await notify({
                    id: 'e2e.array',
                    headline: 'Array',
                    text: 'x',
                    panel: [NSPANEL.name, WEBPANEL.topic],
                });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, r.ns, ht('Array', 'x'));
                await expectNotify(ctx.web, r.web, ht('Array', 'x'));
            });

            step('unknown panel → sendToAnyError, nothing shown', async () => {
                const r = await notify({ id: 'e2e.unknown', headline: 'Unknown', text: 'x', panel: 'e2e-no-panel' });
                expect(r.answer).to.deep.equal({ error: 'sendToAnyError' });
                await expectUnchanged(ctx.nspanel, r.ns, CLEAR);
                await expectUnchanged(ctx.web, r.web, CLEAR);
            });

            step('unknown name in an array → ok, the known panel shows it', async () => {
                const r = await notify({
                    id: 'e2e.partly',
                    headline: 'Partly',
                    text: 'x',
                    panel: ['e2e-no-panel', WEBPANEL.topic],
                });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.web, r.web, ht('Partly', 'x'));
                await expectUnchanged(ctx.nspanel, r.ns, CLEAR);
            });
        });

        describe('tap on the screensaver', () => {
            afterEach(async function () {
                this.timeout(60_000);
                for (const panel of panels()) {
                    await toScreensaver(panel);
                }
                await clearAll();
            });

            step('acknowledge: a tap removes it, the panel stays on the screensaver', async () => {
                let r = await notify({ id: 'e2e.under', priority: 60, headline: 'Under', text: 'x', panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('Under', 'x'));
                r = await notify({
                    id: 'e2e.ack',
                    priority: 10,
                    type: 'acknowledge',
                    headline: 'Ack',
                    text: 'tap me',
                    panel: NSPANEL.id,
                });
                await expectNotify(ctx.nspanel, r.ns, ht('Ack', 'tap me'));
                const mark = await press(ctx.nspanel, buttonPress('screensaver', 'bExit', 2));
                await expectNotify(ctx.nspanel, mark, ht('Under', 'x'));
                await ctx.nspanel.settle(1200);
                expect(ctx.nspanel.payloads(mark).filter(isMenuUpdate(HEADLINES.main)), 'no page').to.deep.equal([]);
                expect(ctx.nspanel.currentCard.startsWith('screensaver')).to.equal(true);
            });

            step('acknowledge to several panels: global by default, a tap removes it on all', async () => {
                const r = await notify({ id: 'e2e.ackall', type: 'acknowledge', headline: 'AckAll', text: 'x' });
                await expectNotify(ctx.nspanel, r.ns, ht('AckAll', 'x'));
                await expectNotify(ctx.web, r.web, ht('AckAll', 'x'));
                const webMark = ctx.web.mark();
                const mark = await press(ctx.nspanel, buttonPress('screensaver', 'bExit', 2));
                await expectNotify(ctx.web, webMark, CLEAR);
                // gone on the NSPanel too: it does not come back with the next screensaver
                await ctx.nspanel.settle(1200);
                await toMainPage(ctx.nspanel, HEADLINES.main);
                await toScreensaver(ctx.nspanel);
                await expectUnchanged(ctx.nspanel, mark, CLEAR);
            });

            step('acknowledge with global: false: a tap removes it only on this panel', async () => {
                const r = await notify({
                    id: 'e2e.acklocal',
                    type: 'acknowledge',
                    global: false,
                    headline: 'AckLocal',
                    text: 'x',
                });
                await expectNotify(ctx.nspanel, r.ns, ht('AckLocal', 'x'));
                await expectNotify(ctx.web, r.web, ht('AckLocal', 'x'));
                const webMark = ctx.web.mark();
                await press(ctx.nspanel, buttonPress('screensaver', 'bExit', 2));
                await expectUnchanged(ctx.web, webMark, ht('AckLocal', 'x'), 2000);
            });

            step('information: a tap passes to the page, the notification comes back with the screensaver', async () => {
                const r = await notify({ id: 'e2e.info', headline: 'Info', text: 'stays', panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('Info', 'stays'));
                let mark = await press(ctx.nspanel, buttonPress('screensaver', 'bExit', 2));
                await ctx.nspanel.waitFor(isMenuUpdate(HEADLINES.main), { since: mark, what: 'start page' });
                mark = await press(ctx.nspanel, `event,sleepReached,${ctx.nspanel.currentCard}`);
                await ctx.nspanel.waitFor(p => p.startsWith('pageType~screensaver'), { since: mark });
                await expectNotify(ctx.nspanel, mark, ht('Info', 'stays'));
            });
        });

        describe('buzzer (NSPanel)', () => {
            const dayMode = () => ctx.panelState(NSPANEL.id, 'cmd.dim.dayMode');
            const buzzerAllowed = () => ctx.panelState(NSPANEL.id, 'cmd.isBuzzerAllowed');

            before(async function () {
                // the day mode follows the dim schedule of the panel (a write of cmd.dim.dayMode is ignored while it
                // is active) - in the night part of the schedule the tone is suppressed, the steps cannot run then
                const day = await ctx.getState(dayMode());
                if (!day || day.val !== true) {
                    this.skip();
                }
                await ctx.setState(buzzerAllowed(), true);
                await ctx.waitForValue(buzzerAllowed(), true);
            });

            afterEach(async function () {
                this.timeout(30_000);
                await ctx.setState(buzzerAllowed(), true);
                await ctx.waitForState(buzzerAllowed(), (v, st) => v === true && !!st && st.ack === true);
                await clearAll();
            });

            step('buzzer: true → default tone when the notification is shown', async () => {
                const t = ctx.nspanel.tasmotaCommands.length;
                const r = await notify({ id: 'e2e.buzz', headline: 'Buzz', text: 'x', buzzer: true, panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('Buzz', 'x'));
                expect(await waitBuzzer(t)).to.deep.equal(['1,2,3,0xF54']);
            });

            step('buzzer as string → own tone sequence', async () => {
                const t = ctx.nspanel.tasmotaCommands.length;
                const r = await notify({ id: 'e2e.buzz', headline: 'Buzz', text: 'y', buzzer: '2,3,4,0xF54' });
                await expectNotify(ctx.nspanel, r.ns, ht('Buzz', 'y'));
                expect(await waitBuzzer(t)).to.deep.equal(['2,3,4,0xF54']);
            });

            step('no tone for a notification that is not shown, nor for new content of the shown one', async function () {
                this.timeout(THROTTLE_MS + 30_000);
                let r = await notify({ id: 'e2e.shown', priority: 10, headline: 'Shown', text: 'v1', panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('Shown', 'v1'));
                const t = ctx.nspanel.tasmotaCommands.length;
                r = await notify({ id: 'e2e.behind', priority: 60, headline: 'Behind', text: 'x', buzzer: true });
                await expectUnchanged(ctx.nspanel, r.ns, ht('Shown', 'v1'));
                r = await notify({ id: 'e2e.shown', priority: 10, headline: 'Shown', text: 'v2', buzzer: true });
                await expectNotify(ctx.nspanel, r.ns, ht('Shown', 'v2'), THROTTLE_MS);
                await ctx.nspanel.settle(1500);
                expect(buzzerSince(t)).to.deep.equal([]);
            });

            step('no tone with cmd.isBuzzerAllowed false', async () => {
                await ctx.setState(buzzerAllowed(), false);
                // the adapter has taken the command over when it acknowledges it - before that the tone may still come
                await ctx.waitForState(buzzerAllowed(), (v, st) => v === false && !!st && st.ack === true);
                const t = ctx.nspanel.tasmotaCommands.length;
                const r = await notify({ id: 'e2e.mute', headline: 'Mute', text: 'x', buzzer: true });
                await expectNotify(ctx.nspanel, r.ns, ht('Mute', 'x'));
                await ctx.nspanel.settle(1500);
                expect(buzzerSince(t)).to.deep.equal([]);
            });

            // NOT TESTABLE here: the night mode comes from the dim schedule of the panel, `cmd.dim.dayMode` is
            // ignored while the schedule is active ("Dim schedule is active - User input ignored!"). The test run
            // cannot switch to night without depending on the clock.
            it.skip('no tone in night mode', async () => {
                await ctx.setState(dayMode(), false);
                await ctx.waitForValue(dayMode(), false);
                const t = ctx.nspanel.tasmotaCommands.length;
                const r = await notify({ id: 'e2e.night', headline: 'Night', text: 'x', buzzer: true });
                await expectNotify(ctx.nspanel, r.ns, ht('Night', 'x'));
                await ctx.nspanel.settle(1500);
                expect(buzzerSince(t)).to.deep.equal([]);
            });
        });

        describe('compatibility', () => {
            afterEach(async function () {
                this.timeout(30_000);
                await clearAll();
            });

            step('recipe for old and new versions: heading + headline + enabled: true + topic', async () => {
                let r = await notify({ id: 'e2e.low', priority: 5, headline: 'Low', text: 'queue', panel: NSPANEL.id });
                await expectNotify(ctx.nspanel, r.ns, ht('Low', 'queue'));
                r = await notify({
                    id: 'e2e.compat',
                    priority: 40,
                    heading: 'Compat',
                    headline: 'Compat',
                    text: 'both',
                    enabled: true,
                    panel: NSPANEL.topic,
                });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                // a queue entry with priority 40, not the old place that would cover 'low'
                await expectUnchanged(ctx.nspanel, r.ns, ht('Low', 'queue'));
                r = await notify({ id: 'e2e.low', priority: 0 });
                await expectNotify(ctx.nspanel, r.ns, ht('Compat', 'both'));
                r = await notify({ id: 'e2e.compat', priority: 0, panel: NSPANEL.topic });
                expect(r.answer).to.deep.equal({ result: 'ok' });
                await expectNotify(ctx.nspanel, r.ns, CLEAR);
            });
        });

        describe('setPopupNotification answers', () => {
            after(async function () {
                this.timeout(30_000);
                await toMainPage(ctx.web, HEADLINES.main);
                await toScreensaver(ctx.web);
            });

            step('success → []', async () => {
                await ctx.web.settle(600);
                const mark = ctx.web.mark();
                const answer = await sendTo('setPopupNotification', {
                    id: 'e2e.popup',
                    headline: 'Popup',
                    text: 'x',
                    panel: WEBPANEL.id,
                    backgroundBlink: '#9c201a',
                });
                expect(answer).to.deep.equal([]);
                await ctx.web.waitFor(p => p === 'pageType~popupNotify', { since: mark, what: 'pageType~popupNotify' });
                const close = await press(ctx.web, buttonPress('popupNotify', 'bExit'));
                await ctx.web.waitFor(p => p.startsWith('pageType~') && p !== 'pageType~popupNotify', {
                    since: close,
                    what: 'popup closed',
                });
            });

            // the prompt: an unknown panel while at least one panel is online is no error - the answer is `[]`
            // (the adapter logs the unknown name); `{ error: 'No Panels Online' }` only comes with no panel online,
            // which this run cannot reach without disconnecting both panels
            it('unknown panel with panels online → []', async () => {
                const answer = await sendTo('setPopupNotification', {
                    id: 'e2e.popup',
                    headline: 'Popup',
                    text: 'x',
                    panel: 'e2e-no-panel',
                });
                expect(answer).to.deep.equal([]);
            });
        });

        protocolCheck(ctx);
    });
};
