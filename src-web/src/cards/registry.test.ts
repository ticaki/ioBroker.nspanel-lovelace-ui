import { describe, expect, it } from 'vitest';
import { modules, registry } from './registry';

describe('registry', () => {
    it('knows every pageType of doc/web-panel/ARCHITECTURE.md 3.3', () => {
        const expected = [
            'pageStartup',
            'screensaver',
            'screensaver2',
            'screensaver3',
            'cardEntities',
            'cardGrid',
            'cardGrid2',
            'cardGrid3',
            'cardSchedule',
            'cardMedia',
            'cardThermo',
            'cardThermo2',
            'cardAlarm',
            'cardUnlock',
            'cardQR',
            'cardPower',
            'cardChart',
            'cardLChart',
            'popupLight',
            'popupLightNew',
            'popupShutter',
            'popupShutter2',
            'popupFan',
            'popupSlider',
            'popupThermo',
            'popupInSel',
            'popupTimer',
            'popupNotify',
            'popupNotify2',
        ];
        for (const pageType of expected) {
            expect(registry[pageType], pageType).toBeDefined();
        }
        expect(Object.keys(registry).sort()).toEqual([...expected].sort());
    });
    it('every module has an initial model and a component', () => {
        for (const module of modules) {
            expect(module.initial()).toBeDefined();
            expect(module.Component).toBeDefined();
        }
    });
});
