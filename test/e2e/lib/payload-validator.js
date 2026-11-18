'use strict';

/**
 * Structure check of the payloads the adapter sends to a panel. Every payload a virtual panel records runs through
 * `PayloadValidator.check()` (PayloadLog.record); the scenarios end with `protocolCheck()` (steps.js), which fails
 * when a payload broke the layout. So also payloads no scenario looks at are checked.
 *
 * The layouts come from the HMI, not from the current output of the adapter:
 * - HMI/Readme.md: `weatherUpdate` of `screensaver` (favorit + 4 forecast + alternate, 6 fields each), of
 *   `screensaver5` (5 bottom + 7 indicator slots on eu), `color~` (16 colors), `entityUpd` (headline, 2 navigation
 *   slots, items of 6 fields), `entityUpdateDetail` of popupLight / popupShutter2, `statusUpdate`
 * - number of slots per screensaver page and area on eu: `ScreenSaverConst` (src/lib/const/definition.ts), the same
 *   numbers as `AREA_SIZES` of the web panel (src-web/src/cards/screensaver/parse.ts)
 * - items per menu card on eu: `MENU_MAX_ITEMS` (src/lib/const/tools.ts), what the HMI pages have
 *
 * Only the eu model is described - both virtual panels of the E2E run are eu panels.
 */

/** Areas of a screensaver `weatherUpdate` in the order the adapter concatenates them (Screensaver.update()). */
const SCREENSAVER_AREAS = {
    // HMI screensaver: main icon + 4 forecast slots (Readme: parameters 1..30)
    standard: [
        ['favorit', 1],
        ['bottom', 4],
    ],
    // alternate: main icon + 3 forecast slots, the 4th forecast slot stays empty, then the alternate slot (31..36)
    alternate: [
        ['favorit', 1],
        ['bottom', 3],
        ['empty', 1],
        ['alternate', 1],
    ],
    // screensaver2
    advanced: [
        ['favorit', 1],
        ['left', 3],
        ['bottom', 6],
        ['indicator', 5],
    ],
    // screensaver3
    easyview: [
        ['favorit', 1],
        ['bottom', 3],
    ],
    // screensaver5 (Readme: bottom icon 3+6k k=0..4, indicator id 32+6j j=0..6)
    tiles: [
        ['bottom', 5],
        ['indicator', 7],
    ],
};

/** HMI page of each screensaver layout */
const SCREENSAVER_CARD = {
    standard: 'screensaver',
    alternate: 'screensaver',
    advanced: 'screensaver2',
    easyview: 'screensaver3',
    tiles: 'screensaver5',
};

/** Items of the menu cards on eu */
const MENU_ITEMS = { cardGrid: 6, cardGrid2: 8, cardGrid3: 4, cardEntities: 4, cardSchedule: 6 };

const CARDS = new Set([
    'pageStartup',
    'screensaver',
    'screensaver2',
    'screensaver3',
    'screensaver5',
    'cardGrid',
    'cardGrid2',
    'cardGrid3',
    'cardEntities',
    'cardSchedule',
    'cardThermo',
    'cardThermo2',
    'cardMedia',
    'cardAlarm',
    'cardQR',
    'cardPower',
    'cardChart',
    'cardLChart',
    'cardPChart',
    'cardUnlock',
    'popupNotify',
    'popupNotify2',
    'popupNotify3',
]);

/** item types of `entityUpd` (NSPanel.SerialTypePageElements and what the page items send besides) */
const ITEM_TYPES = new Set([
    'button',
    'light',
    'light2',
    'shutter',
    'shutter2',
    'text',
    'input_sel',
    'number',
    'switch',
    'delete',
    'fan',
    'timer',
]);

/** a glyph of the icon fonts: private use area (and the own icons from U+FD40), CJK compatibility, plane 15 */
const GLYPH = /^[\u{E000}-\u{FFFF}\u{F0000}-\u{FFFFF}]$/u;
/** font suffix of an icon (`¬<font>`), only screensaver5 reads it */
const FONT_SUFFIX = /¬\d+$/;

/**
 * @param {string} s field
 * @returns {boolean} an integer 0..65535 (RGB565)
 */
function isColor(s) {
    return /^\d+$/.test(s) && Number(s) <= 65535;
}

/**
 * @param {string} s field
 * @param {boolean} [fontSuffix] the field may carry a font suffix
 * @returns {boolean} exactly one icon glyph
 */
function isGlyph(s, fontSuffix = false) {
    const icon = fontSuffix ? s.replace(FONT_SUFFIX, '') : s;
    return [...icon].length === 1 && GLYPH.test(icon);
}

/**
 * @param {string} s field
 * @param {number} min minimum
 * @param {number} max maximum
 * @returns {boolean} an integer in the range
 */
function isInt(s, min, max) {
    return /^-?\d+$/.test(s) && Number(s) >= min && Number(s) <= max;
}

/**
 * @param {string} s field
 * @returns {boolean} enable / disable
 */
function isEnable(s) {
    return s === 'enable' || s === 'disable';
}

/**
 * Collects the problems of one payload.
 */
class Problems {
    constructor() {
        /** @type {string[]} */
        this.list = [];
    }

    /**
     * @param {boolean} ok condition
     * @param {string} msg problem when the condition is false
     */
    check(ok, msg) {
        if (!ok) {
            this.list.push(msg);
        }
    }

    /**
     * @param {string[]} f all fields of the payload
     * @param {number} i field index
     * @param {(s: string) => boolean} test field test
     * @param {string} what expected content
     */
    field(f, i, test, what) {
        const v = f[i];
        this.check(v !== undefined && test(v), `field ${i}: expected ${what}, got ${JSON.stringify(v)}`);
    }
}

/**
 * The layout of a `weatherUpdate` on a screensaver page: the slot count decides between standard and alternate
 * (both use the page `screensaver`).
 *
 * @param {string} card HMI page
 * @param {number} slots number of 6 field slots
 * @returns {keyof typeof SCREENSAVER_AREAS | undefined} layout, undefined if the count fits no layout of the page
 */
function screensaverLayout(card, slots) {
    for (const [layout, areas] of Object.entries(SCREENSAVER_AREAS)) {
        if (SCREENSAVER_CARD[layout] !== card) {
            continue;
        }
        if (areas.reduce((sum, [, n]) => sum + n, 0) === slots) {
            return /** @type {keyof typeof SCREENSAVER_AREAS} */ (layout);
        }
    }
    return undefined;
}

/**
 * Area of every slot of a layout.
 *
 * @param {keyof typeof SCREENSAVER_AREAS} layout layout
 * @returns {string[]} area per slot
 */
function slotAreas(layout) {
    const out = [];
    for (const [area, n] of SCREENSAVER_AREAS[layout]) {
        for (let i = 0; i < n; i++) {
            out.push(area);
        }
    }
    return out;
}

/**
 * Stateful check of the payload stream of one panel: it remembers the page on the display (last `pageType`) and the
 * item types of the last `entityUpd` (an `entityUpdateDetail` is checked against the popup of its item).
 */
class PayloadValidator {
    constructor() {
        this.card = '';
        /** @type {Map<string, string>} item id → item type of the menu pages */
        this.itemTypes = new Map();
        /** @type {{ index: number, payload: string, problems: string[] }[]} */
        this.violations = [];
        /** violations up to here were reported by `takeViolations()` */
        this.reported = 0;
    }

    /**
     * @param {string} payload CustomSend payload
     * @param {number} index position in the PayloadLog
     */
    check(payload, index) {
        const problems = this.problems(payload);
        if (problems.length) {
            this.violations.push({ index, payload, problems });
        }
    }

    /** @returns {{ index: number, payload: string, problems: string[] }[]} violations since the last call */
    takeViolations() {
        const out = this.violations.slice(this.reported);
        this.reported = this.violations.length;
        return out;
    }

    /**
     * @param {string} payload CustomSend payload
     * @returns {string[]} the problems, empty if the payload is fine
     */
    problems(payload) {
        const f = payload.split('~');
        const p = new Problems();
        switch (f[0]) {
            case 'pageType':
                this.checkPageType(f, p);
                break;
            case 'entityUpd':
                this.checkEntityUpd(f, p);
                break;
            case 'entityUpdateDetail':
                this.checkDetail(f, p);
                break;
            case 'weatherUpdate':
                this.checkWeather(f, p);
                break;
            case 'color':
                // color~background~tTime~timeAMPM~tDate~tMainText~tForecast1..4~tForecast1Val..4Val~bar~tMainTextAlt2~tTimeAdd
                p.check(f.length === 17, `color~ needs 16 colors, got ${f.length - 1} fields`);
                for (let i = 1; i < f.length; i++) {
                    p.field(f, i, s => s === '' || isColor(s), 'color 0..65535 or empty');
                }
                break;
            case 'timeout':
                p.check(f.length === 2, `timeout~<s> has 1 field, got ${f.length - 1}`);
                p.field(f, 1, s => isInt(s, 0, 86_400), 'seconds');
                break;
            case 'dimmode':
                // dimmode~<standby 0..100>~<active 0..100>~<background>~<foreground>
                p.check(f.length === 5, `dimmode has 4 fields, got ${f.length - 1}`);
                p.field(f, 1, s => isInt(s, 0, 100), 'brightness 0..100');
                p.field(f, 2, s => isInt(s, 0, 100), 'brightness 0..100');
                p.field(f, 3, isColor, 'color');
                p.field(f, 4, isColor, 'color');
                break;
            case 'statusUpdate':
                // statusUpdate~icon1~color1~icon2~color2~big1~big2 (an icon may carry a value as text)
                p.check(f.length === 7, `statusUpdate has 6 fields, got ${f.length - 1}`);
                p.field(f, 2, s => s === '' || isColor(s), 'color or empty');
                p.field(f, 4, s => s === '' || isColor(s), 'color or empty');
                p.field(f, 5, s => s === '' || s === '1', "'' or '1'");
                p.field(f, 6, s => s === '' || s === '1', "'' or '1'");
                break;
            case 'time':
                // time~HH:MM[ AM|?PM][~info icon]
                p.check(f.length === 2 || f.length === 3, `time~ has 1 or 2 fields, got ${f.length - 1}`);
                p.field(f, 1, s => /^\d{1,2}:\d{2}([ ?][AP]M)?$/.test(s), 'HH:MM');
                if (f.length === 3) {
                    p.field(f, 2, s => isGlyph(s), 'info icon');
                }
                break;
            case 'date':
                p.check(f.length === 2 && f[1] !== '', 'date~<text>');
                break;
            case 'notify':
                p.check(f.length === 3, `notify~heading~text has 2 fields, got ${f.length - 1}`);
                break;
            default:
                break;
        }
        return p.list;
    }

    /**
     * @param {string[]} f fields
     * @param {Problems} p problems
     */
    checkPageType(f, p) {
        const card = f[1] ?? '';
        p.check(CARDS.has(card), `unknown page ${JSON.stringify(card)}`);
        if (card.startsWith('screensaver')) {
            // pageType~<screensaver>~~<bg>?<time>?<ampm>?<date> (Screensaver.getPageTypePayload)
            p.check(f.length === 4, `pageType~${card} has 3 fields, got ${f.length - 1}`);
            p.field(f, 2, s => s === '', 'empty');
            p.field(f, 3, s => s.split('?').length === 4 && s.split('?').every(isColor), '4 colors separated by ?');
        } else {
            p.check(f.length === 2, `pageType~${card} has 1 field, got ${f.length - 1}`);
        }
        this.card = card;
        this.itemTypes.clear();
    }

    /**
     * @param {string[]} f fields
     * @param {Problems} p problems
     */
    checkEntityUpd(f, p) {
        const items = MENU_ITEMS[this.card];
        if (items === undefined) {
            p.check(false, `entityUpd on page ${JSON.stringify(this.card)} without items`);
            return;
        }
        const expected = 2 + 12 + 6 * items;
        p.check(f.length === expected, `entityUpd of ${this.card}: ${expected} fields expected, got ${f.length}`);
        if (f.length !== expected) {
            return;
        }
        // navigation: left 2..7, right 8..13
        for (const start of [2, 8]) {
            const slot = f.slice(start, start + 6);
            if (slot.every(s => s === '')) {
                continue;
            }
            const at = `navigation ${start === 2 ? 'left' : 'right'}`;
            p.check(slot[0] === 'button', `${at}: type button expected, got ${JSON.stringify(slot[0])}`);
            p.check(/^b[A-Z]\w+$/.test(slot[1]), `${at}: id bXxx expected, got ${JSON.stringify(slot[1])}`);
            p.check(isGlyph(slot[2]), `${at}: icon expected, got ${JSON.stringify(slot[2])}`);
            p.check(isColor(slot[3]), `${at}: color expected, got ${JSON.stringify(slot[3])}`);
        }
        for (let k = 0; k < items; k++) {
            const slot = f.slice(14 + 6 * k, 20 + 6 * k);
            if (slot.every(s => s === '')) {
                continue;
            }
            const [type, id, icon, color, , value] = slot;
            const at = `item ${k}`;
            p.check(ITEM_TYPES.has(type), `${at}: unknown type ${JSON.stringify(type)}`);
            p.check(/^[\w.?-]+$/.test(id), `${at}: id expected, got ${JSON.stringify(id)}`);
            p.check(icon === '' || isGlyph(icon), `${at}: icon expected, got ${JSON.stringify(icon)}`);
            p.check(isColor(color), `${at}: color expected, got ${JSON.stringify(color)}`);
            switch (type) {
                case 'switch':
                case 'light':
                case 'light2':
                    p.check(value === '0' || value === '1', `${at}: value 0/1 expected, got ${JSON.stringify(value)}`);
                    break;
                case 'shutter':
                case 'shutter2': {
                    // iconUp|iconStop|iconDown|statusUp|statusStop|statusDown
                    const v = value.split('|');
                    p.check(
                        v.length === 6 &&
                            v.slice(0, 3).every(s => s === '' || isGlyph(s)) &&
                            v.slice(3).every(isEnable),
                        `${at}: icon|icon|icon|enable|enable|enable expected, got ${JSON.stringify(value)}`,
                    );
                    break;
                }
                case 'number':
                    p.check(
                        value.split('|').length >= 3,
                        `${at}: value|min|max expected, got ${JSON.stringify(value)}`,
                    );
                    break;
                default:
                    break;
            }
            this.itemTypes.set(id, type);
        }
    }

    /**
     * @param {string[]} f fields
     * @param {Problems} p problems
     */
    checkDetail(f, p) {
        if (this.card === 'popupNotify') {
            // id~heading~hColor~b1~b1Color~b2~b2Color~b3~b3Color~text~textColor~timeout~font~icon~iconColor
            // (PagePopup.getMessage); a button without text has no color
            p.check(f.length === 16, `entityUpdateDetail of popupNotify has 15 fields, got ${f.length - 1}`);
            p.field(f, 3, isColor, 'color');
            for (const i of [5, 7, 9]) {
                p.field(f, i, s => (f[i - 1] === '' ? s === '' : isColor(s)), 'color of the button or empty');
            }
            p.field(f, 11, isColor, 'color');
            p.field(f, 12, s => isInt(s, 0, 86_400), 'seconds');
            p.field(f, 14, s => s === '' || isGlyph(s), 'icon or empty');
            p.field(f, 15, s => s === '' || isColor(s), 'color or empty');
            return;
        }
        if (this.card === 'popupNotify3') {
            // id~icon~iconColor~text~textColor~font~btnLeftIcon~btnLeftColor~btnRightIcon~btnRightColor~timeout
            // (popupNotify3Message, HMI 6.2.0): empty button icon = button hidden, text <= 199 bytes
            p.check(f.length === 12, `entityUpdateDetail of popupNotify3 has 11 fields, got ${f.length - 1}`);
            p.field(f, 2, s => isGlyph(s), 'icon');
            p.field(f, 3, isColor, 'color');
            p.field(f, 4, s => Buffer.byteLength(s) <= 199 && !/[^\r]\n/.test(s), 'text <= 199 bytes, lines with CR LF');
            p.field(f, 5, isColor, 'color');
            p.field(f, 6, s => ['0', '2', '3'].includes(s), 'font 0, 2 or 3');
            for (const i of [7, 9]) {
                p.field(f, i, s => s === '' || isGlyph(s), 'button icon or empty');
                p.field(f, i + 1, s => (f[i] === '' ? s === '' : isColor(s)), 'color of the button or empty');
            }
            p.field(f, 11, s => isInt(s, 0, 86_400), 'seconds');
            return;
        }
        const id = f[1] ?? '';
        const type = this.itemTypes.get(id);
        if (type === undefined) {
            p.check(false, `entityUpdateDetail for ${JSON.stringify(id)}, no item of the page has this id`);
            return;
        }
        switch (type) {
            case 'light':
            case 'light2':
                // popupLight: id~icon~iconColor~buttonState~brightness~colorTemp~colorMode~colorTranslation~
                // colorTempTranslation~brightnessTranslation~popup (getDetailPayload 2Sliders)
                p.check(f.length === 12, `popupLight: 11 fields expected, got ${f.length - 1}`);
                p.field(f, 2, s => s === '' || isGlyph(s), 'icon or empty');
                p.field(f, 3, s => isColor(s) || s === 'disable', 'color or disable');
                p.field(f, 4, s => ['0', '1', 'disable'].includes(s), '0/1/disable');
                p.field(f, 5, s => isInt(s, 0, 100) || s === 'disable', 'brightness 0..100 or disable');
                p.field(f, 6, s => isInt(s, 0, 100) || s === 'disable', 'color temperature 0..100 or disable');
                p.field(f, 7, isEnable, 'enable/disable');
                p.field(f, 11, isEnable, 'enable/disable');
                break;
            case 'shutter2':
                // popupShutter2: id~pos~text2~posText~icon~iconT1~iconM1~iconB1~statusT1~statusM1~statusB1~
                // (iconX2~colorX2~enableX2) x3~shutterTyp~shutterClosedIsZero
                p.check(f.length === 23, `popupShutter2: 22 fields expected, got ${f.length - 1}`);
                p.field(f, 2, s => isInt(s, 0, 100) || s === '' || s === 'disable', 'position 0..100');
                p.field(f, 5, s => s === '' || isGlyph(s), 'icon or empty');
                for (const i of [6, 7, 8]) {
                    p.field(f, i, s => s === '' || isGlyph(s), 'icon or empty');
                }
                for (const i of [9, 10, 11]) {
                    p.field(f, i, isEnable, 'enable/disable');
                }
                for (const i of [12, 15, 18]) {
                    p.field(f, i, s => s === '' || isGlyph(s), 'icon or empty');
                    p.field(f, i + 1, s => s === '' || isColor(s), 'color or empty');
                    p.field(f, i + 2, isEnable, 'enable/disable');
                }
                p.field(f, 21, s => /^[a-z]+$/.test(s), 'shutter type');
                p.field(f, 22, s => s === '0' || s === '1', '0/1');
                break;
            default:
                // no popup layout described here
                break;
        }
    }

    /**
     * @param {string[]} f fields
     * @param {Problems} p problems
     */
    checkWeather(f, p) {
        if (!this.card.startsWith('screensaver')) {
            p.check(false, `weatherUpdate on page ${JSON.stringify(this.card)}`);
            return;
        }
        if ((f.length - 1) % 6 !== 0) {
            p.check(false, `weatherUpdate: slots of 6 fields expected, got ${f.length - 1} fields`);
            return;
        }
        const slots = (f.length - 1) / 6;
        const layout = screensaverLayout(this.card, slots);
        if (!layout) {
            p.check(false, `weatherUpdate: ${slots} slots fit no layout of ${this.card}`);
            return;
        }
        const areas = slotAreas(layout);
        for (let s = 0; s < slots; s++) {
            const [type, id, icon, color, name, value] = f.slice(1 + 6 * s, 7 + 6 * s);
            const area = areas[s];
            const at = `slot ${s} (${area})`;
            if (area === 'empty') {
                p.check(
                    [type, id, icon, color, name, value].every(x => x === ''),
                    `${at}: must stay empty in the alternate layout`,
                );
                continue;
            }
            p.check(type === '', `${at}: type must be empty, got ${JSON.stringify(type)}`);
            if (area === 'indicator') {
                p.check(id === '' || /^[\w.?-]+$/.test(id), `${at}: id expected, got ${JSON.stringify(id)}`);
            } else {
                p.check(id === '', `${at}: id must be empty, got ${JSON.stringify(id)}`);
            }
            const suffix = layout === 'tiles' && area === 'indicator';
            p.check(icon === '' || isGlyph(icon, suffix), `${at}: icon expected, got ${JSON.stringify(icon)}`);
            p.check(color === '' || isColor(color), `${at}: color expected, got ${JSON.stringify(color)}`);
            p.check(icon === '' || color !== '', `${at}: an icon needs a color`);
            p.check(
                icon !== '' || (name === '' && value === '') || area !== 'indicator',
                `${at}: indicator without icon`,
            );
        }
    }
}

module.exports = {
    PayloadValidator,
    SCREENSAVER_AREAS,
    SCREENSAVER_CARD,
    MENU_ITEMS,
    screensaverLayout,
    slotAreas,
    isGlyph,
    isColor,
};
