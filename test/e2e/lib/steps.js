'use strict';

const { expect } = require('chai');
const { isMenuUpdate, buttonPress, parseMenuUpdate, parseWeatherUpdate, icon, color565 } = require('./protocol');
const { SCREENSAVER } = require('../fixtures/config');

/**
 * Steps shared by the scenarios. `panel` is a VirtualNSPanel or a VirtualWebPanel - both record the payloads of
 * the adapter (PayloadLog) and have `send(event)`.
 */

/**
 * Sends an event of the display after the send queue of the adapter is empty. The adapter drops touch events for
 * 200 ms after a `pageType` (blockTouchEventsForMs), touches of the screensaver for 500 ms
 * (blockScreensaverTouchEventsForMs) - the quiet time is longer than that.
 *
 * @param {any} panel virtual panel
 * @param {string} event event string
 * @returns {Promise<number>} mark before the event - wait for the answer with `since: mark`
 */
async function press(panel, event) {
    await panel.settle(600);
    const mark = panel.mark();
    await panel.send(event);
    return mark;
}

/**
 * Brings a panel to the start page in a defined way: display timeout → screensaver (the adapter resets the
 * navigation to the start page), then a double tap on the screensaver.
 *
 * @param {any} panel virtual panel
 * @param {string} headline headline of the start page
 * @returns {Promise<string>} entityUpd of the start page
 */
async function toMainPage(panel, headline) {
    if (!panel.currentCard.startsWith('screensaver')) {
        const mark = await press(panel, `event,sleepReached,${panel.currentCard}`);
        await panel.waitFor(p => p.startsWith('pageType~screensaver'), { since: mark, what: 'pageType~screensaver*' });
    }
    // the screensaver is left with a double tap (default of cmd.screenSaver.doubleClick)
    const mark = await press(panel, buttonPress('screensaver', 'bExit', 2));
    return panel.waitFor(isMenuUpdate(headline), { since: mark, what: `entityUpd ${headline}` });
}

/**
 * Item of the last entityUpd of a menu page.
 *
 * @param {any} panel virtual panel
 * @param {string} headline headline of the page
 * @param {string} name display name of the item
 * @returns {ReturnType<typeof parseMenuUpdate>['items'][number]} the item
 */
function lastItem(panel, headline, name) {
    const upd = panel.findLast(isMenuUpdate(headline));
    if (!upd) {
        throw new Error(`${panel.name}: no entityUpd of ${headline}`);
    }
    const found = parseMenuUpdate(upd).items.find(i => i.name === name);
    if (!found) {
        throw new Error(`${panel.name}: no item ${name} in ${upd}`);
    }
    return found;
}

/**
 * Predicate: entityUpd of the page whose item `name` matches `test`.
 *
 * @param {string} headline headline of the page
 * @param {string} name display name of the item
 * @param {(item: ReturnType<typeof parseMenuUpdate>['items'][number]) => boolean} test item test
 * @returns {(p: string) => boolean} predicate
 */
function menuItemMatches(headline, name, test) {
    const isPage = isMenuUpdate(headline);
    return p => {
        if (!isPage(p)) {
            return false;
        }
        const it = parseMenuUpdate(p).items.find(i => i.name === name);
        return !!it && test(it);
    };
}

/**
 * Predicate: entityUpd of the page whose item at position `index` is `name` and matches `test` - the position counts,
 * a shifted item does not match.
 *
 * @param {string} headline headline of the page
 * @param {number} index position of the item (0 = first)
 * @param {string} name display name of the item
 * @param {(item: ReturnType<typeof parseMenuUpdate>['items'][number]) => boolean} [test] item test
 * @returns {(p: string) => boolean} predicate
 */
function menuItemAt(headline, index, name, test = () => true) {
    const isPage = isMenuUpdate(headline);
    return p => {
        if (!isPage(p)) {
            return false;
        }
        const it = parseMenuUpdate(p).items[index];
        return !!it && it.name === name && test(it);
    };
}

/**
 * Checks the content of a screensaver `weatherUpdate` slot by slot against the screensaver of fixtures/config.js
 * (socket and window off). Every area is compared at its position, the places behind the configured items must be
 * empty.
 *
 * @param {string} payload the weatherUpdate payload
 * @param {string} card the screensaver page it was sent to
 * @param {string} layout expected layout
 * @param {RegExp} temperature expected value of the temperature (favorit and bottom item `Temp`)
 * @returns {ReturnType<typeof parseWeatherUpdate>} the parsed payload
 */
function expectScreensaver(payload, card, layout, temperature) {
    const w = parseWeatherUpdate(payload, card);
    expect(w.layout, 'layout').to.equal(layout);
    const empty = { type: '', id: '', icon: '', color: '', name: '', value: '' };
    /** value of the items by headline */
    const value = { Hum: '48%', Pow: '1234W', Win: SCREENSAVER.windowText.off, LPow: '1234W', LHum: '48%' };
    /**
     * @param {ReturnType<typeof parseWeatherUpdate>['bottom']} slots slots of an area
     * @param {string[]} names configured headlines in this order
     * @param {string} area name for the messages
     */
    const area = (slots, names, area) => {
        slots.forEach((slot, i) => {
            const name = names[i];
            if (name === undefined) {
                expect(slot, `${area} ${i} empty`).to.deep.equal(empty);
                return;
            }
            expect(slot.name, `${area} ${i} headline`).to.equal(name);
            if (name === 'Temp') {
                expect(slot.value, `${area} ${i} value`).to.match(temperature);
            } else {
                expect(slot.value, `${area} ${i} value`).to.equal(value[name]);
            }
            expect([...slot.icon], `${area} ${i} icon`).to.have.length(1);
            expect(slot.color, `${area} ${i} color`).to.match(/^\d+$/);
            expect(slot.type + slot.id, `${area} ${i} type/id`).to.equal('');
        });
    };
    if (layout === 'tiles') {
        expect(w.favorit, 'tiles has no favorit').to.equal(undefined);
    } else {
        expect(w.favorit.name, 'favorit name').to.equal('Temperature');
        expect(w.favorit.icon, 'favorit icon').to.equal(icon('thermometer'));
        expect(w.favorit.value, 'favorit value').to.match(temperature);
    }
    area(w.bottom, SCREENSAVER.bottom.slice(0, w.bottom.length), 'bottom');
    area(w.left, SCREENSAVER.left, 'left');
    if (layout === 'alternate') {
        expect(w.alternate.name, 'alternate name').to.equal(SCREENSAVER.alternate);
        expect(w.alternate.value, 'alternate value').to.equal('48%');
        // the 4th forecast slot stays empty in front of the alternate slot
        expect(w.slots[4], 'slot in front of alternate').to.deep.equal(empty);
    } else {
        expect(w.alternate).to.equal(undefined);
    }
    w.indicator.forEach((slot, i) => {
        if (i === 0) {
            expect(slot.icon, 'indicator 0 icon (socket off)').to.equal(icon(SCREENSAVER.socketIcons.off));
            expect(slot.id, 'indicator 0 id').to.match(/^\d+\?\d+$/);
        } else if (i === 1) {
            expect(slot.icon, 'indicator 1 icon (window closed)').to.equal(icon(SCREENSAVER.windowIcons.off));
            expect(slot.color, 'indicator 1 color').to.equal(color565(SCREENSAVER.windowColors.off));
            expect(slot.id, 'indicator 1 id').to.match(/^\d+\?\d+$/);
        } else {
            expect(slot, `indicator ${i} empty`).to.deep.equal(empty);
        }
    });
    return w;
}

/**
 * Defines the last test of a scenario: every payload both panels received since the previous check matches the
 * protocol (payload-validator.js). Call it as the last statement inside the `describe` of the scenario - mocha runs
 * the nested suites in their order, so it runs after all steps.
 *
 * @param {import('./context').E2EContext} ctx shared context
 */
function protocolCheck(ctx) {
    describe('Protocol', () => {
        it('every payload of both panels has the structure of the HMI protocol', () => {
            const report = [];
            for (const panel of [ctx.nspanel, ctx.web]) {
                for (const v of panel.validator.takeViolations()) {
                    const p = v.payload.length > 300 ? `${v.payload.slice(0, 300)}…` : v.payload;
                    report.push(`${panel.name} #${v.index}: ${v.problems.join('; ')}\n      ${p}`);
                }
            }
            if (report.length) {
                throw new Error(`${report.length} payload(s) break the protocol:\n  ${report.join('\n  ')}`);
            }
        });
    });
}

module.exports = { press, toMainPage, lastItem, menuItemMatches, menuItemAt, expectScreensaver, protocolCheck };
