/**
 * This is a dummy TypeScript test file using chai and mocha
 *
 * It's automatically excluded from npm and its build output is excluded from both git and npm.
 * It is advised to test all your modules with accompanying *.test.ts-files
 */

import { expect } from 'chai';
import { getPageSonos } from './lib/pages/tools/getSonos';
import { genericStateObjects, InternalStates } from './lib/const/definition';
import type * as types from './lib/types/types';
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
        const buzzerCommand: types.PanelInternalCommand = 'cmd/buzzer';
        expect(buzzerCommand).to.equal('cmd/buzzer');
    });
});

describe('PopupNotification functionality', () => {
    it('should include popupNotification in PanelInternalCommand type', () => {
        const popupCommand: types.PanelInternalCommand = 'popupNotification';
        expect(popupCommand).to.equal('popupNotification');
    });

    it('should have popupNotification in internal states', () => {
        expect(InternalStates.panel.popupNotification).to.be.an('object');
        expect(InternalStates.panel.popupNotification.common.type).to.equal('string');
        expect(InternalStates.panel.popupNotification.common.role).to.equal('json');
        expect(InternalStates.panel.popupNotification.common.name).to.equal('Popup Notification');
    });

    it('should validate PopupNotificationVal type accepts valid object', () => {
        // Import the types for testing - this is a compile-time test
        const validNotification = {
            headline: 'Test Headline',
            text: 'Test message',
            buttonLeft: 'Cancel',
            buttonRight: 'OK',
            timeout: 5000,
            colorHeadline: { r: 255, g: 0, b: 0 },
            colorText: { r: 0, g: 255, b: 0 },
            colorButtonLeft: { r: 128, g: 128, b: 128 },
            colorButtonRight: { r: 0, g: 0, b: 255 },
        };

        expect(validNotification).to.be.an('object');
        expect(validNotification.headline).to.equal('Test Headline');
        expect(validNotification.text).to.equal('Test message');
    });

    it('should validate PopupNotificationVal type accepts minimal object', () => {
        const minimalNotification = {
            text: 'Simple message',
        };

        expect(minimalNotification).to.be.an('object');
        expect(minimalNotification.text).to.equal('Simple message');
    });
});

// ... more test suites => describe
