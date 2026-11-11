import { describe, expect, it } from 'vitest';
import { baseModel, CENTERED_ON_WEB, cardStage } from './stageLayout';
import { registry } from './registry';
import { isPortrait } from '../style/theme';

describe('cardStage', () => {
    it('never draws a page of a portrait model in a landscape geometry', () => {
        // every registered pageType (cards, popups, screensavers) on us-p / web-p: the card sees a portrait model
        // and gets a portrait area, landscape models keep landscape
        for (const pageType of Object.keys(registry)) {
            for (const model of ['us-p', 'web-p'] as const) {
                const stage = cardStage(pageType, model);
                expect(isPortrait(stage.model), `${pageType} on ${model}`).toBe(true);
                expect(stage.height, `${pageType} on ${model}`).toBeGreaterThan(stage.width);
            }
            for (const model of ['eu', 'us-l', 'web-l'] as const) {
                const stage = cardStage(pageType, model);
                expect(isPortrait(stage.model), `${pageType} on ${model}`).toBe(false);
                expect(stage.width, `${pageType} on ${model}`).toBeGreaterThan(stage.height);
            }
        }
    });

    it('draws every page on the full stage of a hardware model', () => {
        expect(cardStage('cardThermo', 'eu')).toEqual({ model: 'eu', left: 0, top: 0, width: 480, height: 320 });
        expect(cardStage('cardThermo', 'us-l')).toEqual({ model: 'us-l', left: 0, top: 0, width: 480, height: 320 });
        expect(cardStage('cardThermo', 'us-p')).toEqual({ model: 'us-p', left: 0, top: 0, width: 320, height: 480 });
        expect(cardStage('cardGrid', 'us-p')).toEqual({ model: 'us-p', left: 0, top: 0, width: 320, height: 480 });
    });

    it('centres a card without web layout in its base geometry', () => {
        expect(cardStage('cardThermo', 'web-l')).toEqual({ model: 'eu', left: 80, top: 0, width: 480, height: 320 });
        expect(cardStage('cardThermo', 'web-p')).toEqual({
            model: 'us-p',
            left: 0,
            top: 80,
            width: 320,
            height: 480,
        });
    });

    it('gives the menu cards the full web stage and the real model', () => {
        for (const pageType of ['cardEntities', 'cardSchedule', 'cardGrid', 'cardGrid2', 'cardGrid3']) {
            expect(CENTERED_ON_WEB.has(pageType), pageType).toBe(false);
            expect(cardStage(pageType, 'web-p')).toEqual({
                model: 'web-p',
                left: 0,
                top: 0,
                width: 320,
                height: 640,
            });
            expect(cardStage(pageType, 'web-l')).toEqual({
                model: 'web-l',
                left: 0,
                top: 0,
                width: 640,
                height: 320,
            });
        }
    });

    it('gives the screensavers the full web stage and the real model', () => {
        for (const pageType of ['screensaver', 'screensaver2', 'screensaver3', 'screensaver5']) {
            expect(CENTERED_ON_WEB.has(pageType), pageType).toBe(false);
            expect(cardStage(pageType, 'web-p')).toEqual({ model: 'web-p', left: 0, top: 0, width: 320, height: 640 });
            expect(cardStage(pageType, 'web-l')).toEqual({ model: 'web-l', left: 0, top: 0, width: 640, height: 320 });
        }
    });

    it('gives cardMedia, cardThermo2 and the popups the full web stage and the real model', () => {
        const pageTypes = [
            'cardMedia',
            'cardThermo2',
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
        for (const pageType of pageTypes) {
            expect(CENTERED_ON_WEB.has(pageType), pageType).toBe(false);
            expect(cardStage(pageType, 'web-p')).toEqual({ model: 'web-p', left: 0, top: 0, width: 320, height: 640 });
            expect(cardStage(pageType, 'web-l')).toEqual({ model: 'web-l', left: 0, top: 0, width: 640, height: 320 });
        }
    });

    it('maps the web models to their base model', () => {
        expect(baseModel('web-l')).toBe('eu');
        expect(baseModel('web-p')).toBe('us-p');
        expect(baseModel('us-l')).toBe('us-l');
    });

    it('lists only registered pageTypes', () => {
        for (const pageType of CENTERED_ON_WEB) {
            expect(registry[pageType], pageType).toBeDefined();
        }
    });
});
