/**
 * This is a dummy TypeScript test file using chai and mocha
 *
 * It's automatically excluded from npm and its build output is excluded from both git and npm.
 * It is advised to test all your modules with accompanying *.test.ts-files
 */

import { expect } from 'chai';
import { getPageSonos } from './lib/pages/tools/getSonos';
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

// ... more test suites => describe
