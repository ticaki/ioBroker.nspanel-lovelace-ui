import { expect } from 'chai';
import {
    convertColorScaleBest,
    isAlarmButtonEvent,
    isButtonActionType,
    isCardEntitiesType,
    isCardGridType,
    isCardMenuHalfPageScrollType,
    isCardMenuRole,
    isClosingBehavior,
    isColorEntryType,
    isEventMethod,
    isEventType,
    isIconColorScaleElement,
    isIconSelectScaleElement,
    isPageMenuConfig,
    isPartialColorScaleElement,
    isPartialIconSelectScaleElement,
    isPlaceholderType,
    isPopupType,
    isQRButtonEvent,
    isScreenSaverCardType,
    isScreenSaverMode,
    isScreenSaverModeAsNumber,
    isStateRole,
    isTasmotaSTATUS0,
    isTasmotaStatus0Status,
    isTasmotaStatusFWR,
    isTasmotaStatusLOG,
    isTasmotaStatusMEM,
    isTasmotaStatusMQT,
    isTasmotaStatusNet,
    isTasmotaStatusPRM,
    isTasmotaStatusSNS,
    isTasmotaStatusSTS,
    isTasmotaStatusTIM,
    isValueDateFormat,
    normalizeIconColorElement,
} from './function-and-const';

describe('lib/types/function-and-const', () => {
    describe('Card type guards', () => {
        it('isCardEntitiesType accepts cardEntities and cardSchedule', () => {
            expect(isCardEntitiesType('cardEntities')).to.equal(true);
            expect(isCardEntitiesType('cardSchedule')).to.equal(true);
        });
        it('isCardEntitiesType rejects unknown strings', () => {
            expect(isCardEntitiesType('cardGrid')).to.equal(false);
            expect(isCardEntitiesType('foo')).to.equal(false);
        });
        it('isCardEntitiesType rejects non-strings', () => {
            expect(isCardEntitiesType(42)).to.equal(false);
            expect(isCardEntitiesType(null)).to.equal(false);
        });
        it('isCardGridType accepts grid card types', () => {
            expect(isCardGridType('cardGrid')).to.equal(true);
            expect(isCardGridType('cardGrid2')).to.equal(true);
            expect(isCardGridType('cardGrid3')).to.equal(true);
            expect(isCardGridType('cardThermo2')).to.equal(true);
            expect(isCardGridType('cardMedia')).to.equal(true);
        });
        it('isCardGridType rejects unknown', () => {
            expect(isCardGridType('cardEntities')).to.equal(false);
        });
        it('isCardMenuHalfPageScrollType accepts grid types except cardMedia', () => {
            expect(isCardMenuHalfPageScrollType('cardGrid')).to.equal(true);
            expect(isCardMenuHalfPageScrollType('cardThermo2')).to.equal(true);
            expect(isCardMenuHalfPageScrollType('cardMedia')).to.equal(false);
        });
        it('isCardMenuRole combines entities and grid', () => {
            expect(isCardMenuRole('cardEntities')).to.equal(true);
            expect(isCardMenuRole('cardGrid')).to.equal(true);
            expect(isCardMenuRole('foobar')).to.equal(false);
        });
    });

    describe('isPageMenuConfig', () => {
        it('returns true when card is a menu role', () => {
            expect(isPageMenuConfig({ card: 'cardGrid' })).to.equal(true);
            expect(isPageMenuConfig({ card: 'cardEntities' })).to.equal(true);
        });
        it('returns false for missing card', () => {
            expect(isPageMenuConfig({})).to.equal(false);
        });
        it('returns false for non-objects', () => {
            expect(isPageMenuConfig(null)).to.equal(false);
            expect(isPageMenuConfig('cardGrid')).to.equal(false);
        });
    });

    describe('Screensaver guards', () => {
        it('isScreenSaverCardType accepts the three known cards', () => {
            expect(isScreenSaverCardType('screensaver')).to.equal(true);
            expect(isScreenSaverCardType('screensaver2')).to.equal(true);
            expect(isScreenSaverCardType('screensaver3')).to.equal(true);
        });
        it('isScreenSaverCardType rejects unknown', () => {
            expect(isScreenSaverCardType('screensaver4')).to.equal(false);
        });
        it('isScreenSaverMode accepts the four known modes', () => {
            expect(isScreenSaverMode('standard')).to.equal(true);
            expect(isScreenSaverMode('advanced')).to.equal(true);
            expect(isScreenSaverMode('alternate')).to.equal(true);
            expect(isScreenSaverMode('easyview')).to.equal(true);
        });
        it('isScreenSaverMode rejects unknown / non-strings', () => {
            expect(isScreenSaverMode('foo')).to.equal(false);
            expect(isScreenSaverMode(0)).to.equal(false);
        });
        it('isScreenSaverModeAsNumber accepts 0..3', () => {
            expect(isScreenSaverModeAsNumber(0)).to.equal(true);
            expect(isScreenSaverModeAsNumber(3)).to.equal(true);
        });
        it('isScreenSaverModeAsNumber rejects out-of-range and string values', () => {
            expect(isScreenSaverModeAsNumber(4)).to.equal(false);
            expect(isScreenSaverModeAsNumber('0')).to.equal(false);
        });
    });

    describe('isStateRole', () => {
        it('is a trivial guard that always returns true', () => {
            // Source comment: "Alle StateRole Werte sind gültig - triviale Type Guard"
            expect(isStateRole('anything')).to.equal(true);
            expect(isStateRole('')).to.equal(true);
        });
    });

    describe('isButtonActionType', () => {
        it('accepts known button actions', () => {
            expect(isButtonActionType('OnOff')).to.equal(true);
            expect(isButtonActionType('bExit')).to.equal(true);
            expect(isButtonActionType('media-pause')).to.equal(true);
            expect(isButtonActionType('volumeSlider')).to.equal(true);
        });
        it('rejects unknown strings and non-strings', () => {
            expect(isButtonActionType('foobar')).to.equal(false);
            expect(isButtonActionType(123)).to.equal(false);
        });
    });

    describe('isAlarmButtonEvent', () => {
        it('accepts the documented events', () => {
            expect(isAlarmButtonEvent('A1')).to.equal(true);
            expect(isAlarmButtonEvent('D4')).to.equal(true);
            expect(isAlarmButtonEvent('U1')).to.equal(true);
            expect(isAlarmButtonEvent('')).to.equal(true); // empty string is intentionally listed
        });
        it('rejects unknown events', () => {
            expect(isAlarmButtonEvent('A5')).to.equal(false);
            expect(isAlarmButtonEvent('foo')).to.equal(false);
        });
    });

    describe('isQRButtonEvent', () => {
        it('only accepts "OnOff"', () => {
            expect(isQRButtonEvent('OnOff')).to.equal(true);
            expect(isQRButtonEvent('off')).to.equal(false);
        });
    });

    describe('isClosingBehavior', () => {
        it('accepts both/yes/no/none', () => {
            expect(isClosingBehavior('both')).to.equal(true);
            expect(isClosingBehavior('yes')).to.equal(true);
            expect(isClosingBehavior('no')).to.equal(true);
            expect(isClosingBehavior('none')).to.equal(true);
        });
        it('rejects unknown', () => {
            expect(isClosingBehavior('maybe')).to.equal(false);
        });
    });

    describe('isPlaceholderType', () => {
        it('accepts an object whose entries each have exactly one of text or dp', () => {
            expect(isPlaceholderType({ a: { text: 'x' } })).to.equal(true);
            expect(isPlaceholderType({ a: { dp: 'datapoint' } })).to.equal(true);
        });
        it('rejects entries with both text and dp set', () => {
            expect(isPlaceholderType({ a: { text: 'x', dp: 'y' } })).to.equal(false);
        });
        it('rejects falsy entries', () => {
            expect(isPlaceholderType({ a: null })).to.equal(false);
            expect(isPlaceholderType(null)).to.equal(false);
        });
    });

    describe('isColorEntryType', () => {
        it('accepts an object with true, false and scale keys', () => {
            const obj = { true: { r: 1, g: 1, b: 1 }, false: { r: 0, g: 0, b: 0 }, scale: 0 };
            expect(isColorEntryType(obj)).to.equal(true);
        });
        it('rejects when a required key is missing', () => {
            expect(isColorEntryType({ true: 1, false: 0 })).to.equal(false);
        });
    });

    describe('isEventType', () => {
        it('accepts "event"', () => {
            expect(isEventType('event')).to.equal(true);
        });
        it('rejects everything else', () => {
            expect(isEventType('events')).to.equal(false);
            expect(isEventType('')).to.equal(false);
        });
    });

    describe('isEventMethod', () => {
        it('accepts known methods', () => {
            expect(isEventMethod('startup')).to.equal(true);
            expect(isEventMethod('button1')).to.equal(true);
            expect(isEventMethod('renderCurrentPage')).to.equal(true);
        });
        it('throws for unknown methods', () => {
            expect(() => isEventMethod('something-else')).to.throw(/Unknown EventMethod/);
        });
    });

    describe('isPopupType', () => {
        let originalInfo: typeof console.info;
        beforeEach(() => {
            originalInfo = console.info;
            console.info = (): void => undefined;
        });
        afterEach(() => {
            console.info = originalInfo;
        });
        it('accepts known popup types', () => {
            expect(isPopupType('popupLight')).to.equal(true);
            expect(isPopupType('popupShutter')).to.equal(true);
            expect(isPopupType('popupTimer')).to.equal(true);
        });
        it('returns false for unknown types', () => {
            expect(isPopupType('popupUnknown')).to.equal(false);
        });
    });

    describe('isValueDateFormat', () => {
        it('accepts an object with local and format', () => {
            expect(isValueDateFormat({ local: 'de', format: 'dd.MM.' })).to.equal(true);
        });
        it('rejects when a key is missing', () => {
            expect(isValueDateFormat({ local: 'de' })).to.equal(false);
            // null short-circuits via `F && …` and returns the falsy input itself
            expect(Boolean(isValueDateFormat(null))).to.equal(false);
        });
    });

    describe('Tasmota Status guards', () => {
        const validNet = { StatusNET: { IPAddress: '1.1.1.1' } };
        const validSTATUS0: any = {
            Status: { Module: 0 },
            StatusPRM: { OtaUrl: '' },
            StatusFWR: { Version: '1' },
            StatusLOG: { SerialLog: 0 },
            StatusMEM: { ProgramSize: 1 },
            StatusNET: { Hostname: 'h' },
            StatusMQT: { MqttHost: '' },
            StatusTIM: { UTC: '' },
            StatusSNS: {},
            StatusSTS: {},
        };

        it('isTasmotaStatusNet accepts {StatusNET: object}', () => {
            expect(isTasmotaStatusNet(validNet)).to.equal(true);
        });
        it('isTasmotaStatusNet rejects garbage', () => {
            // null short-circuits via `F && …` and returns the falsy input itself
            expect(Boolean(isTasmotaStatusNet(null))).to.equal(false);
            expect(isTasmotaStatusNet({})).to.equal(false);
            expect(isTasmotaStatusNet({ StatusNET: 'string' })).to.equal(false);
        });
        it('individual status guards accept their respective sub-key', () => {
            expect(isTasmotaStatus0Status({ Status: {} })).to.equal(true);
            expect(isTasmotaStatusPRM({ StatusPRM: {} })).to.equal(true);
            expect(isTasmotaStatusFWR({ StatusFWR: {} })).to.equal(true);
            expect(isTasmotaStatusLOG({ StatusLOG: {} })).to.equal(true);
            expect(isTasmotaStatusMEM({ StatusMEM: {} })).to.equal(true);
            expect(isTasmotaStatusMQT({ StatusMQT: {} })).to.equal(true);
            expect(isTasmotaStatusTIM({ StatusTIM: {} })).to.equal(true);
            expect(isTasmotaStatusSNS({ StatusSNS: {} })).to.equal(true);
            expect(isTasmotaStatusSTS({ StatusSTS: {} })).to.equal(true);
        });
        it('isTasmotaSTATUS0 accepts a complete object', () => {
            expect(isTasmotaSTATUS0(validSTATUS0)).to.equal(true);
        });
        it('isTasmotaSTATUS0 rejects when any sub-key is missing', () => {
            const incomplete = { ...validSTATUS0 };
            delete incomplete.StatusSNS;
            expect(isTasmotaSTATUS0(incomplete)).to.equal(false);
        });
    });

    describe('Color/Icon scale element guards', () => {
        const validColorScale = { val_min: 0, val_max: 100 };
        const validIconSelect = { valIcon_min: 'a', valIcon_max: 'b' };

        it('isPartialColorScaleElement accepts partial inputs', () => {
            expect(isPartialColorScaleElement({ val_min: 0 })).to.equal(true);
            expect(isPartialColorScaleElement({ val_max: 100 })).to.equal(true);
        });
        it('isPartialColorScaleElement rejects unrelated objects', () => {
            expect(isPartialColorScaleElement({ foo: 'bar' })).to.equal(false);
            // null short-circuits via `F && …` and returns the falsy input itself
            expect(Boolean(isPartialColorScaleElement(null))).to.equal(false);
        });
        it('isIconColorScaleElement requires finite val_min and val_max', () => {
            expect(isIconColorScaleElement(validColorScale)).to.equal(true);
            expect(isIconColorScaleElement({ val_min: 0 })).to.equal(false);
            expect(isIconColorScaleElement(null)).to.equal(false);
        });
        it('isIconColorScaleElement rejects unknown mode', () => {
            expect(isIconColorScaleElement({ ...validColorScale, mode: 'bogus' })).to.equal(false);
        });
        it('isIconSelectScaleElement requires both keys', () => {
            expect(isIconSelectScaleElement(validIconSelect)).to.equal(true);
            expect(isIconSelectScaleElement({ valIcon_min: 'a' })).to.equal(false);
        });
        it('isPartialIconSelectScaleElement accepts partial', () => {
            expect(isPartialIconSelectScaleElement({ valIcon_min: 'a' })).to.equal(true);
            expect(isPartialIconSelectScaleElement({ valIcon_max: 'b' })).to.equal(true);
            expect(isPartialIconSelectScaleElement({})).to.equal(false);
        });
    });

    describe('convertColorScaleBest', () => {
        it('returns undefined for falsy input', () => {
            expect(convertColorScaleBest(undefined)).to.equal(undefined);
        });
        it('maps {red,green,blue} to {r,g,b}', () => {
            expect(convertColorScaleBest({ red: 1, green: 2, blue: 3 })).to.deep.equal({ r: 1, g: 2, b: 3 });
        });
        it('passes through {r,g,b}', () => {
            expect(convertColorScaleBest({ r: 1, g: 2, b: 3 })).to.deep.equal({ r: 1, g: 2, b: 3 });
        });
    });

    describe('normalizeIconColorElement', () => {
        it('returns a copy', () => {
            const original = { val_min: 0, val_max: 100 } as any;
            const out = normalizeIconColorElement(original);
            expect(out).to.not.equal(original);
            expect(out.val_min).to.equal(0);
            expect(out.val_max).to.equal(100);
        });
        it('normalizes color_best from {red,...} form', () => {
            const out = normalizeIconColorElement({
                val_min: 0,
                val_max: 100,
                color_best: { red: 10, green: 20, blue: 30 },
            } as any);
            expect(out.color_best).to.deep.equal({ r: 10, g: 20, b: 30 });
        });
    });
});
