import { expect } from 'chai';
import { Panel } from './panel';
import {
    buildDisplayDiagnosisMessage,
    buildSafebootMessage,
    evaluateDisplayDiagnosis,
    isSafebootVersion,
    NSPANEL_TEMPLATE_GPIO,
    parseGpio4Answer,
    parseInfo1Version,
    parseModuleAnswer,
    DISPLAY_DIAGNOSIS_DELAY_MS,
} from './display-diagnosis';

const SAFEBOOT_INFO1 = '{"Info1":{"Module":"ESP32-DevKit","Version":"15.3.0(release-safeboot)single-core"}}';
const NORMAL_INFO1 = '{"Info1":{"Module":"NSPanel","Version":"15.3.0(tasmota32)"}}';

describe('display-diagnosis', () => {
    describe('safeboot', () => {
        it('recognises the safeboot image in any case, not the normal firmware', () => {
            expect(isSafebootVersion('15.3.0(release-safeboot)single-core')).to.equal(true);
            expect(isSafebootVersion('15.3.0(Safeboot)')).to.equal(true);
            expect(isSafebootVersion('15.3.0(release-nspanel)')).to.equal(false);
            expect(isSafebootVersion('')).to.equal(false);
        });

        it('reads the version from INFO1, with and without the Info1 level', () => {
            expect(
                parseInfo1Version(
                    '{"Info1":{"Module":"ESP32-DevKit","Version":"15.3.0(release-safeboot)single-core","FallbackTopic":"x"}}',
                ),
            ).to.equal('15.3.0(release-safeboot)single-core');
            expect(parseInfo1Version('{"Module":"NSPanel","Version":"14.0.0(tasmota32)"}')).to.equal(
                '14.0.0(tasmota32)',
            );
        });

        it('finds no version in anything else', () => {
            for (const message of ['', 'no json', 'null', '5', '[]', '{}', '{"Info1":{}}', '{"Info1":{"Version":5}}']) {
                expect(parseInfo1Version(message), message).to.equal(null);
            }
        });

        it('the message names the state and both ways out', () => {
            const text = buildSafebootMessage('ns_panel6', '15.3.0(release-safeboot)');
            expect(text).to.contain('ns_panel6');
            expect(text).to.contain('safeboot');
            expect(text).to.contain('normal firmware is not active');
            expect(text).to.contain('web interface');
            expect(text).to.contain('Upgrade 1');
        });
    });

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

describe('lib/controller/panel - safeboot', () => {
    function panelWith(online = false): any {
        const noop = (): void => undefined;
        const panel: any = Object.create(Panel.prototype);
        const logged: string[] = [];
        Object.assign(panel, {
            logged,
            sentPanel: [] as string[],
            sentTasmota: [] as string[],
            written: 0,
            name: 'p',
            topic: 'ns_panel6',
            options: {},
            info: { tasmota: { safeboot: false }, nspanel: { berryDriverVersion: 0 } },
            _isOnline: online,
            initDone: true,
            flashing: false,
            channel: {},
            displayDiagnosis: { reported: false, lastQueryTs: 0, timeout: undefined, answers: undefined },
            displayOfflineSinceTs: 0,
            log: {
                debug: noop,
                info: (m: string): void => void logged.push(`info:${m}`),
                warn: (m: string): void => void logged.push(`warn:${m}`),
                error: (m: string): void => void logged.push(`error:${m}`),
            },
            adapter: { unload: false, setTimeout: noop, clearTimeout: noop },
            library: { writedp: async (): Promise<void> => undefined },
            restartLoops: noop,
            setStatus: async (): Promise<void> => undefined,
            sendToPanel: (payload: string): void => void panel.sentPanel.push(payload),
            sendToTasmota: (topic: string): void => void panel.sentTasmota.push(topic),
            writeInfo: async (): Promise<void> => {
                panel.written++;
            },
        });
        return panel;
    }

    const warnings = (panel: any): string[] => panel.logged.filter((l: string) => l.startsWith('warn:'));

    // the diagnosis is due: the display has been silent for longer than the delay
    function diagnosisDue(panel: any): void {
        panel.displayOfflineSinceTs = Date.now() - DISPLAY_DIAGNOSIS_DELAY_MS - 1;
        panel.checkDisplayNotAnswering();
    }

    it('recognises the safeboot image from INFO1 and writes the state', async () => {
        const panel = panelWith();
        await panel.handleInfo1(SAFEBOOT_INFO1);
        expect(panel.info.tasmota.safeboot).to.equal(true);
        expect(panel.written).to.equal(1);
    });

    it('warns once per entry, also when INFO1 repeats, and again after the normal firmware', async () => {
        const panel = panelWith();
        await panel.handleInfo1(SAFEBOOT_INFO1);
        await panel.handleInfo1(SAFEBOOT_INFO1);
        expect(warnings(panel)).to.have.length(1);
        expect(warnings(panel)[0]).to.contain('Upgrade 1');
        await panel.handleInfo1(NORMAL_INFO1);
        expect(warnings(panel)).to.have.length(1);
        await panel.handleInfo1(SAFEBOOT_INFO1);
        expect(warnings(panel)).to.have.length(2);
    });

    it('an online panel goes offline with this one warning', async () => {
        const panel = panelWith(true);
        await panel.handleInfo1(SAFEBOOT_INFO1);
        expect(panel.isOnline).to.equal(false);
        expect(warnings(panel)).to.have.length(1);
    });

    it('offers no startup page and runs no diagnosis in safeboot', async () => {
        const panel = panelWith();
        await panel.handleInfo1(SAFEBOOT_INFO1);
        panel.offerStartupPage();
        diagnosisDue(panel);
        expect(panel.sentPanel).to.deep.equal([]);
        expect(panel.sentTasmota).to.deep.equal([]);
    });

    it('drops a running diagnosis when entering safeboot', async () => {
        const panel = panelWith();
        const cleared: unknown[] = [];
        const timer = {};
        panel.adapter.clearTimeout = (t: unknown): void => void cleared.push(t);
        panel.displayDiagnosis = { reported: false, lastQueryTs: 1, timeout: timer, answers: {} };
        await panel.handleInfo1(SAFEBOOT_INFO1);
        expect(cleared).to.deep.equal([timer]);
        expect(panel.displayDiagnosis.answers).to.equal(undefined);
    });

    it('works as usual again with the normal firmware, the flag is reset', async () => {
        const panel = panelWith();
        await panel.handleInfo1(SAFEBOOT_INFO1);
        await panel.handleInfo1(NORMAL_INFO1);
        expect(panel.info.tasmota.safeboot).to.equal(false);
        expect(panel.written).to.equal(2);
        panel.offerStartupPage();
        expect(panel.sentPanel).to.deep.equal(['pageType~pageStartup']);
        diagnosisDue(panel);
        expect(panel.sentTasmota).to.deep.equal(['ns_panel6/cmnd/Module', 'ns_panel6/cmnd/Gpio']);
    });

    it('a normal panel and a payload without a version change nothing', async () => {
        const panel = panelWith();
        await panel.handleInfo1(NORMAL_INFO1);
        await panel.handleInfo1('no json');
        expect(panel.info.tasmota.safeboot).to.equal(false);
        expect(panel.written).to.equal(0);
        expect(panel.logged).to.deep.equal([]);
        await panel.handleInfo1(SAFEBOOT_INFO1);
        await panel.handleInfo1('{"Info1":{}}');
        expect(panel.info.tasmota.safeboot).to.equal(true);
    });

    it('a web panel without a receiver still gets no offer', () => {
        const panel = panelWith();
        panel.channel = { hasReceiver: (): boolean => false };
        panel.offerStartupPage();
        expect(panel.sentPanel).to.deep.equal([]);
    });
});
