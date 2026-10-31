import { expect } from 'chai';
import {
    buildDisplayDiagnosisMessage,
    evaluateDisplayDiagnosis,
    NSPANEL_TEMPLATE_GPIO,
    parseGpio4Answer,
    parseModuleAnswer,
} from './display-diagnosis';

describe('display-diagnosis', () => {
    describe('parseModuleAnswer', () => {
        it('reads an active template', () => {
            expect(parseModuleAnswer({ Module: { 0: 'NSPanel' } })).to.deep.equal({ id: '0', name: 'NSPanel' });
        });

        it('reads a built-in module', () => {
            expect(parseModuleAnswer({ Module: { 1: 'ESP32-DevKit' } })).to.deep.equal({
                id: '1',
                name: 'ESP32-DevKit',
            });
        });

        it('ignores other payloads', () => {
            expect(parseModuleAnswer({ POWER1: 'ON' })).to.equal(null);
            expect(parseModuleAnswer({ Module: 'x' })).to.equal(null);
            expect(parseModuleAnswer(null)).to.equal(null);
            expect(parseModuleAnswer('Module')).to.equal(null);
        });
    });

    describe('parseGpio4Answer', () => {
        it('reads GPIO4 from a Gpio 255 answer', () => {
            const msg = { GPIO0: { None: 0 }, GPIO4: { 'Output Lo': 3872 }, GPIO5: { None: 0 } };
            expect(parseGpio4Answer(msg)).to.deep.equal({ name: 'Output Lo', code: 3872 });
        });

        it('reads an unconfigured GPIO4', () => {
            expect(parseGpio4Answer({ GPIO4: { None: 0 } })).to.deep.equal({ name: 'None', code: 0 });
        });

        it('returns null for a part of the answer without GPIO4', () => {
            expect(parseGpio4Answer({ GPIO20: { None: 0 } })).to.equal(null);
            expect(parseGpio4Answer(undefined)).to.equal(null);
        });
    });

    describe('evaluateDisplayDiagnosis', () => {
        it('reports no answer when tasmota did not answer', () => {
            expect(evaluateDisplayDiagnosis({})).to.deep.equal({ result: 'noAnswer' });
        });

        it('detects Module 1 with GPIO4 None (the black display case)', () => {
            const r = evaluateDisplayDiagnosis({
                module: { id: '1', name: 'ESP32-DevKit' },
                gpio4: { name: 'None', code: 0 },
            });
            expect(r.result).to.equal('misconfigured');
            if (r.result === 'misconfigured') {
                expect(r.problems).to.have.length(2);
                expect(r.problems[0]).to.contain('Module is 1 (ESP32-DevKit)');
                expect(r.problems[1]).to.contain('GPIO4 is "None" (0)');
            }
        });

        it('detects a template with a wrong GPIO4', () => {
            const r = evaluateDisplayDiagnosis({
                module: { id: '0', name: 'NSPanel' },
                gpio4: { name: 'Relay', code: 224 },
            });
            expect(r).to.deep.equal({
                result: 'misconfigured',
                problems: ['GPIO4 is "Relay" (224) instead of "Output Lo" (3872)'],
            });
        });

        it('uses a single answer if the other one is missing', () => {
            expect(evaluateDisplayDiagnosis({ module: { id: '1', name: 'ESP32-DevKit' } }).result).to.equal(
                'misconfigured',
            );
            expect(evaluateDisplayDiagnosis({ gpio4: { name: 'Output Lo', code: 3872 } }).result).to.equal('tasmotaOk');
        });

        it('accepts the correct configuration', () => {
            expect(
                evaluateDisplayDiagnosis({
                    module: { id: '0', name: 'NSPanel' },
                    gpio4: { name: 'Output Lo', code: 3872 },
                }),
            ).to.deep.equal({ result: 'tasmotaOk' });
        });
    });

    describe('buildDisplayDiagnosisMessage', () => {
        it('returns nothing when tasmota did not answer', () => {
            expect(buildDisplayDiagnosisMessage({ result: 'noAnswer' }, 'nspanel/x', 60)).to.equal(null);
        });

        it('explains how to fix a missing template', () => {
            const text = buildDisplayDiagnosisMessage(
                { result: 'misconfigured', problems: ['Module is 1 (ESP32-DevKit) instead of 0 (NSPanel template)'] },
                'nspanel/kitchen',
                65,
            );
            expect(text).to.contain('nspanel/kitchen');
            expect(text).to.contain('65 s');
            expect(text).to.contain('Module is 1');
            expect(text).to.contain(`"GPIO":${NSPANEL_TEMPLATE_GPIO}`);
            expect(text).to.contain('Module 0');
        });

        it('points to display, wiring and power if tasmota is fine', () => {
            const text = buildDisplayDiagnosisMessage({ result: 'tasmotaOk' }, 'nspanel/kitchen', 60);
            expect(text).to.contain('TFT');
            expect(text).to.contain('power supply');
        });
    });
});
