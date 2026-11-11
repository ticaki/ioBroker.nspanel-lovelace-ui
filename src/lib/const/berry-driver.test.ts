import { expect } from 'chai';
import { driverGeneration, isEmulatorDriverVersion, parseDriverVersion } from './berry-driver';

describe('lib/const/berry-driver', () => {
    it('parseDriverVersion: string and number, unknown becomes 0', () => {
        expect(parseDriverVersion('-1')).to.equal(-1);
        expect(parseDriverVersion('-12')).to.equal(-12);
        expect(parseDriverVersion('11')).to.equal(11);
        expect(parseDriverVersion(12)).to.equal(12);
        expect(parseDriverVersion(-1)).to.equal(-1);
        expect(parseDriverVersion(undefined)).to.equal(0);
        expect(parseDriverVersion('abc')).to.equal(0);
        expect(parseDriverVersion(NaN)).to.equal(0);
    });
    it('isEmulatorDriverVersion: every negative version is an emulator', () => {
        expect(isEmulatorDriverVersion(-1)).to.equal(true);
        expect(isEmulatorDriverVersion('-1')).to.equal(true);
        expect(isEmulatorDriverVersion(-12)).to.equal(true);
        expect(isEmulatorDriverVersion('-12')).to.equal(true);
        expect(isEmulatorDriverVersion(12)).to.equal(false);
        expect(isEmulatorDriverVersion('11')).to.equal(false);
        expect(isEmulatorDriverVersion(0)).to.equal(false);
        expect(isEmulatorDriverVersion(undefined)).to.equal(false);
    });
    it('driverGeneration: absolute value', () => {
        expect(driverGeneration(-1)).to.equal(1);
        expect(driverGeneration('-12')).to.equal(12);
        expect(driverGeneration(12)).to.equal(12);
        expect(driverGeneration(0)).to.equal(0);
        expect(driverGeneration(undefined)).to.equal(0);
    });
});
