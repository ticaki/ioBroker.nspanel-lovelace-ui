/**
 * This is a dummy TypeScript test file using chai and mocha
 *
 * It's automatically excluded from npm and its build output is excluded from both git and npm.
 * It is advised to test all your modules with accompanying *.test.ts-files
 */

import { expect } from 'chai';
import { getPageSonos } from './lib/pages/tools/getSonos';
import { genericStateObjects, InternalStates } from './lib/const/definition';
import type { NSPanel } from './lib/types/NSPanel';
// import { functionToTest } from "./moduleToTest";

describe('module to test => function to test', () => {
    // initializing logic
    const expected = 5;

    it(`should return ${expected}`, () => {
        const result = 5;
        // assign result a value from functionToTest
        expect(result).to.equal(expected);
        // or using the should() syntax
        result.should.equal(expected);
    });
    // ... more tests => it
});

describe('Sonos media player integration', () => {
    it('should export getPageSonos function', () => {
        expect(getPageSonos).to.be.a('function');
    });
});

describe('Buzzer functionality', () => {
    it('should have buzzer state object definition', () => {
        expect(genericStateObjects.panel.panels.cmd.buzzer).to.be.an('object');
        expect(genericStateObjects.panel.panels.cmd.buzzer.common.name).to.equal('StateObjects.buzzer');
        expect(genericStateObjects.panel.panels.cmd.buzzer.common.type).to.equal('string');
        expect(genericStateObjects.panel.panels.cmd.buzzer.common.role).to.equal('text');
    });

    it('should have buzzer in internal states', () => {
        expect(InternalStates.panel['cmd/buzzer']).to.be.an('object');
        expect(InternalStates.panel['cmd/buzzer'].common.type).to.equal('string');
        expect(InternalStates.panel['cmd/buzzer'].val).to.equal('');
    });

    it('should include buzzer in PanelInternalCommand type', () => {
        const buzzerCommand: NSPanel.PanelInternalCommand = 'cmd/buzzer';
        expect(buzzerCommand).to.equal('cmd/buzzer');
    });
});

// ... more test suites => describe
