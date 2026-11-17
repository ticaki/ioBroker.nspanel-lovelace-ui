/**
 * Tasmota answers `TempOffset` with `{"TempOffset":5.0}` (upper case T). A value changed in the Tasmota
 * console must end up in `panels.<name>.cmd.tempOffset`. Panel.onMessage is an instance property set in the
 * constructor, so the parser of the message is tested here.
 */
import { expect } from 'chai';
import { readTempOffset } from './panel';

describe('lib/controller/panel - readTempOffset', () => {
    it('reads the upper case key of Tasmota', () => {
        expect(readTempOffset(JSON.parse('{"TempOffset":5.0}'))).to.equal(5);
    });
    it('accepts the lower case key', () => {
        expect(readTempOffset({ tempOffset: -1.5 })).to.equal(-1.5);
    });
    it('accepts a numeric string', () => {
        expect(readTempOffset({ TempOffset: '2.3' })).to.equal(2.3);
    });
    it('clamps to ±12.6', () => {
        expect(readTempOffset({ TempOffset: 20 })).to.equal(12.6);
        expect(readTempOffset({ TempOffset: -20 })).to.equal(-12.6);
    });
    it('returns null for invalid values', () => {
        expect(readTempOffset({ TempOffset: 'abc' })).to.equal(null);
        expect(readTempOffset({ TempOffset: '' })).to.equal(null);
        expect(readTempOffset({ TempOffset: null })).to.equal(null);
        expect(readTempOffset({ TempOffset: Infinity })).to.equal(null);
        expect(readTempOffset({})).to.equal(null);
        expect(readTempOffset(null)).to.equal(null);
    });
});
