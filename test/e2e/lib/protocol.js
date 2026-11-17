'use strict';

const { screensaverLayout, slotAreas } = require('./payload-validator');
const { Icons } = require('../../../build/lib/const/icon_mapping');
const { Color } = require('../../../build/lib/const/Color');

/**
 * @param {string} name icon name (Material Design Icons)
 * @returns {string} the glyph the adapter sends for it
 */
function icon(name) {
    return Icons.GetIcon(name);
}

/**
 * @param {string} hex color as #rrggbb
 * @returns {string} the RGB565 number the adapter sends for it
 */
function color565(hex) {
    const n = parseInt(hex.slice(1), 16);
    return String(Color.rgb_dec565({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }));
}

/**
 * Small helpers for the panel protocol (see HMI/Readme.md and src/lib/pages/pageMenu.ts): the payloads are split at
 * `~` and the tests compare single fields at their position. The structure of every payload is checked by
 * payload-validator.js.
 */

/**
 * @param {string} payload a CustomSend payload
 * @returns {string} the command (`pageType`, `entityUpd`, ...)
 */
function command(payload) {
    return payload.split('~', 1)[0];
}

/**
 * `pageType~<card>`
 *
 * @param {string} payload a CustomSend payload
 * @returns {string | undefined} the card, undefined if the payload is no pageType
 */
function pageTypeOf(payload) {
    return payload.startsWith('pageType~') ? payload.split('~')[1] : undefined;
}

/**
 * The 6 fields of an item / navigation icon: `type~intNameEntity~icon~iconColor~displayName~optionalValue`.
 *
 * @param {string[]} f the fields
 * @returns {{ type: string, id: string, icon: string, color: string, name: string, value: string }} item
 */
function toItem(f) {
    return {
        type: f[0] ?? '',
        id: f[1] ?? '',
        icon: f[2] ?? '',
        color: f[3] ?? '',
        name: f[4] ?? '',
        value: f[5] ?? '',
    };
}

/**
 * `entityUpd~<headline>~<nav left 6 fields>~<nav right 6 fields>~<items, 6 fields each>` of the menu cards
 * (cardGrid, cardGrid2, cardEntities, ...).
 *
 * @param {string} payload the entityUpd payload
 * @returns {{ headline: string, left: ReturnType<typeof toItem>, right: ReturnType<typeof toItem>, items: ReturnType<typeof toItem>[] }} parsed
 */
function parseMenuUpdate(payload) {
    const f = payload.split('~');
    if (f[0] !== 'entityUpd') {
        throw new Error(`no entityUpd: ${payload}`);
    }
    const left = toItem(f.slice(2, 8));
    const right = toItem(f.slice(8, 14));
    const items = [];
    for (let i = 14; i + 5 < f.length; i += 6) {
        items.push(toItem(f.slice(i, i + 6)));
    }
    return { headline: f[1], left, right, items };
}

/**
 * Finds an item of a menu update by its display name.
 *
 * @param {string} payload the entityUpd payload
 * @param {string} name display name
 * @returns {ReturnType<typeof toItem> | undefined} the item
 */
function menuItem(payload, name) {
    return parseMenuUpdate(payload).items.find(i => i.name === name);
}

/**
 * True for an entityUpd of a menu card with this headline.
 *
 * @param {string} headline headline of the page
 * @returns {(p: string) => boolean} predicate
 */
function isMenuUpdate(headline) {
    return p => p.startsWith('entityUpd~') && p.split('~')[1] === headline;
}

/**
 * `pageType~<card>[~~<bg>?<time>?<ampm>?<date>]`
 *
 * @param {string} payload a pageType payload
 * @returns {{ card: string, colors: number[] }} card and the first colors of a screensaver
 */
function parsePageType(payload) {
    const f = payload.split('~');
    if (f[0] !== 'pageType') {
        throw new Error(`no pageType: ${payload}`);
    }
    return { card: f[1], colors: f[3] ? f[3].split('?').map(Number) : [] };
}

/**
 * `weatherUpdate~<slot>~<slot>…` of a screensaver page, 6 fields per slot (`toItem`), sorted into the areas of the
 * layout. The layout follows from the page and the number of slots (standard 5 / alternate 6 on `screensaver`).
 *
 * @param {string} payload the weatherUpdate payload
 * @param {string} card the screensaver page it was sent to
 * @returns {{ layout: string, slots: ReturnType<typeof toItem>[], favorit?: ReturnType<typeof toItem>, left: ReturnType<typeof toItem>[], bottom: ReturnType<typeof toItem>[], alternate?: ReturnType<typeof toItem>, indicator: ReturnType<typeof toItem>[] }} parsed
 */
function parseWeatherUpdate(payload, card) {
    const f = payload.split('~');
    if (f[0] !== 'weatherUpdate' || (f.length - 1) % 6 !== 0) {
        throw new Error(`no weatherUpdate of 6 field slots: ${payload}`);
    }
    const slots = [];
    for (let i = 1; i < f.length; i += 6) {
        slots.push(toItem(f.slice(i, i + 6)));
    }
    const layout = screensaverLayout(card, slots.length);
    if (!layout) {
        throw new Error(`weatherUpdate with ${slots.length} slots fits no layout of ${card}: ${payload}`);
    }
    const out = { layout, slots, favorit: undefined, left: [], bottom: [], alternate: undefined, indicator: [] };
    slotAreas(layout).forEach((area, i) => {
        if (area === 'favorit' || area === 'alternate') {
            out[area] = slots[i];
        } else if (area !== 'empty') {
            out[area].push(slots[i]);
        }
    });
    return out;
}

/**
 * @param {string} payload a payload
 * @param {string} card the screensaver page it was sent to
 * @returns {string | undefined} layout of a weatherUpdate, undefined for other payloads or a broken slot count
 */
function weatherLayout(payload, card) {
    const f = payload.split('~');
    if (f[0] !== 'weatherUpdate' || (f.length - 1) % 6 !== 0) {
        return undefined;
    }
    return screensaverLayout(card, (f.length - 1) / 6);
}

/**
 * `entityUpdateDetail` of popupLight: id~icon~iconColor~buttonState~brightness~colorTemp~colorMode~colorTranslation~
 * colorTempTranslation~brightnessTranslation~popup
 *
 * @param {string} payload the entityUpdateDetail payload
 * @returns {{ id: string, icon: string, color: string, on: string, brightness: string, colorTemp: string, colorMode: string, colorText: string, colorTempText: string, brightnessText: string, popup: string, count: number }} parsed
 */
function parseLightDetail(payload) {
    const f = payload.split('~');
    return {
        id: f[1],
        icon: f[2],
        color: f[3],
        on: f[4],
        brightness: f[5],
        colorTemp: f[6],
        colorMode: f[7],
        colorText: f[8],
        colorTempText: f[9],
        brightnessText: f[10],
        popup: f[11],
        count: f.length - 1,
    };
}

/**
 * `entityUpdateDetail` of popupShutter2: id~pos~text2~posText~icon~iconUp~iconStop~iconDown~statusUp~statusStop~
 * statusDown~(icon~color~enable of the second row) x3~shutterTyp~shutterClosedIsZero
 *
 * @param {string} payload the entityUpdateDetail payload
 * @returns {{ id: string, position: string, text2: string, positionText: string, icon: string, up: string, stop: string, down: string, upStatus: string, stopStatus: string, downStatus: string, shutterTyp: string, closedIsZero: string, count: number }} parsed
 */
function parseShutterDetail(payload) {
    const f = payload.split('~');
    return {
        id: f[1],
        position: f[2],
        text2: f[3],
        positionText: f[4],
        icon: f[5],
        up: f[6],
        stop: f[7],
        down: f[8],
        upStatus: f[9],
        stopStatus: f[10],
        downStatus: f[11],
        shutterTyp: f[21],
        closedIsZero: f[22],
        count: f.length - 1,
    };
}

/**
 * Button event of the display.
 *
 * @param {string} id internal name (`intNameEntity`) or navigation id
 * @param {string} action e.g. `OnOff`, `button`, `bNext`, `positionSlider`
 * @param {string | number} [opt] optional value
 * @returns {string} the event string
 */
function buttonPress(id, action, opt) {
    return opt === undefined ? `event,buttonPress2,${id},${action}` : `event,buttonPress2,${id},${action},${opt}`;
}

module.exports = {
    icon,
    color565,
    command,
    pageTypeOf,
    parsePageType,
    parseMenuUpdate,
    parseWeatherUpdate,
    weatherLayout,
    parseLightDetail,
    parseShutterDetail,
    menuItem,
    isMenuUpdate,
    buttonPress,
};
