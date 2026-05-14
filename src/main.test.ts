/**
 * Smoke tests for the adapter entry surface.
 *
 * These run alongside the focused unit tests under src/lib/**.test.ts
 * and validate the shape of the exported state-object definitions so that
 * accidental schema drift breaks CI early.
 */

import { expect } from 'chai';
import { getPageSonos } from './lib/pages/tools/getSonos';
import { genericStateObjects, InternalStates } from './lib/const/definition';
import type { NSPanel } from './lib/types/NSPanel';

describe('Sonos page tool', () => {
    it('exports getPageSonos as a function', () => {
        expect(getPageSonos).to.be.a('function');
    });
});

describe('genericStateObjects.panel.panels.cmd.buzzer', () => {
    const buzzer = genericStateObjects.panel.panels.cmd.buzzer;

    it('is a state object with the expected common metadata', () => {
        expect(buzzer).to.be.an('object');
        expect(buzzer.type).to.equal('state');
        expect(buzzer.common.name).to.equal('StateObjects.buzzer');
        expect(buzzer.common.type).to.equal('string');
        expect(buzzer.common.role).to.equal('text');
    });
});

describe('InternalStates.panel buzzer entry', () => {
    const buzzer = InternalStates.panel['cmd/buzzer'];

    it('exists and is a string state with empty default', () => {
        expect(buzzer).to.be.an('object');
        expect(buzzer.common.type).to.equal('string');
        expect(buzzer.val).to.equal('');
    });

    it('is reachable via the PanelInternalCommand string-literal type', () => {
        const buzzerCommand: NSPanel.PanelInternalCommand = 'cmd/buzzer';
        expect(buzzerCommand).to.equal('cmd/buzzer');
    });
});

describe('InternalStates.panel schema sanity', () => {
    const entries = Object.entries(InternalStates.panel) as Array<
        [NSPanel.PanelInternalCommand, (typeof InternalStates.panel)[NSPanel.PanelInternalCommand]]
    >;

    it('has at least one entry', () => {
        expect(entries.length).to.be.greaterThan(0);
    });

    it('every entry has a common.type and common.role and a default val', () => {
        for (const [key, entry] of entries) {
            expect(entry, `entry ${key}`).to.be.an('object');
            expect(entry.common, `common of ${key}`).to.be.an('object');
            expect(entry.common.type, `type of ${key}`).to.be.a('string');
            expect(entry.common.role, `role of ${key}`).to.be.a('string');
            expect(entry, `val of ${key}`).to.have.property('val');
        }
    });
});
