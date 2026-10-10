import { expect } from 'chai';
import {
    emptyScreensaverEntry,
    screensaverAreas,
    screensaverCardOfMode,
    screensaverMaxEntries,
    screensaverModes,
    screensaverSlotLimits,
} from './adminShareConfig';
import { ScreenSaverConst } from '../const/definition';
import type { NSpanelModel, ScreensaverModeType } from './types';
import type { ScreensaverMode, ScreensaverPanelModel } from './adminShareConfig';

// adminShareConfig.ts must not import types.ts (admin bundle) - these assignments fail to compile
// as soon as the literal unions drift apart in either direction.
const modeToAdapter: ScreensaverModeType = 'standard';
const modeToAdmin: ScreensaverMode = 'standard';
const modelToAdapter: NSpanelModel = 'eu';
const modelToAdmin: ScreensaverPanelModel = 'eu';
void [modeToAdapter, modeToAdmin, modelToAdapter, modelToAdmin];

describe('lib/types - screensaver entry (admin tab)', () => {
    it('keeps the slot limits equal to ScreenSaverConst of the adapter', () => {
        // The admin bundle must not import definition.ts (it pulls the adapter constants into the
        // browser), so the limits are copied - this test is the guard that both stay the same.
        for (const mode of screensaverModes) {
            for (const area of [...screensaverAreas, 'mricon'] as const) {
                expect(screensaverSlotLimits[mode][area], `${mode}/${area}`).to.deep.equal(
                    ScreenSaverConst[mode][area].maxEntries,
                );
            }
        }
    });

    it('falls back to the eu value for models without an own limit', () => {
        expect(screensaverMaxEntries('easyview', 'bottom', 'us-p')).to.equal(4);
        expect(screensaverMaxEntries('easyview', 'bottom', 'us-l')).to.equal(3);
        expect(screensaverMaxEntries('advanced', 'bottom', 'us-p')).to.equal(6);
        expect(screensaverMaxEntries('standard', 'left')).to.equal(0);
    });

    it('maps the four versions to the three cards like screensaver.ts', () => {
        expect(screensaverCardOfMode('standard')).to.equal('screensaver');
        expect(screensaverCardOfMode('alternate')).to.equal('screensaver');
        expect(screensaverCardOfMode('advanced')).to.equal('screensaver2');
        expect(screensaverCardOfMode('easyview')).to.equal('screensaver3');
    });

    it('creates an entry without panels and items', () => {
        const entry = emptyScreensaverEntry('Wohnzimmer');
        expect(entry.name).to.equal('Wohnzimmer');
        expect(entry.mode).to.equal('standard');
        expect(entry.panels).to.deep.equal([]);
        expect(entry.left).to.deep.equal([]);
        expect(entry.bottom).to.deep.equal([]);
        expect(entry.indicator).to.deep.equal([]);
        expect(entry.favorit).to.equal(undefined);
        expect(entry.rotationTime).to.equal(0);
        expect(emptyScreensaverEntry('x', 'advanced').mode).to.equal('advanced');
    });

    it('returns a fresh object on every call', () => {
        const a = emptyScreensaverEntry('a');
        const b = emptyScreensaverEntry('a');
        expect(a).to.not.equal(b);
        expect(a.bottom).to.not.equal(b.bottom);
    });
});
