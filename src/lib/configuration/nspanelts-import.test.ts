/**
 * Tests of the conversion of the old NSPanelTs script into a configuration script of the adapter.
 *
 * Fixture: `test/fixtures/scripts/NSPanelTs-v5.1.1.fixture.ts.txt` - the configuration part of NSPanelTs.ts
 * v5.1.1.10, shortened, with synthetic example pages of every card type. The generated script is checked
 * three ways: its text, the configuration it sends to the adapter when it runs (types stripped, run in
 * node:vm), and the existing script → admin planner, which has to take over every page written as page.
 * A TypeScript check of the generated script against the `ScriptConfig` declarations of the template
 * completes it.
 */
import { expect } from 'chai';
import * as fs from 'node:fs';
import path from 'node:path';
import * as vm from 'node:vm';
import * as ts from 'typescript';
import { SCRIPT_END_STOP_TOKEN } from '../tools/panel-setup';
import {
    NSPANELTS_SERVICE_PAGES,
    convertNsPanelTs,
    inspectNsPanelTs,
    isSupportedNsPanelTsVersion,
    stripTypes,
    topicFromMqttState,
    type NsPanelTsConvertResult,
} from './nspanelts-import';
import { planScriptToAdmin } from './script-to-admin';

const root = path.join(__dirname, '../../..');
const fixture = fs.readFileSync(path.join(root, 'test/fixtures/scripts/NSPanelTs-v5.1.1.fixture.ts.txt'), 'utf8');
const template = fs.readFileSync(path.join(root, 'script/example_sendTo_script_iobroker.ts'), 'utf8');

function withVersion(source: string, version: string): string {
    return source.replace(/const scriptVersion: string = '[^']*';/, `const scriptVersion: string = '${version}';`);
}

function convert(source = fixture): NsPanelTsConvertResult {
    return convertNsPanelTs({
        source,
        template,
        endToken: SCRIPT_END_STOP_TOKEN,
        panelTopic: 'nspanel/test',
        namespace: 'nspanel-lovelace-ui.1',
        sourceScriptId: 'script.js.common.NSPanelTs',
        today: '2026-11-26',
    });
}

/**
 * Runs the generated script (types stripped) and returns the configuration it sends to the adapter.
 *
 * @param source generated script
 * @returns the message of sendTo ScriptConfig and the target instance
 */
function runGenerated(source: string): { target: string; config: ScriptConfig.Config } {
    let target = '';
    let message: unknown;
    const ctx = vm.createContext({
        log: (): void => undefined,
        stopScript: (): void => undefined,
        scriptName: 'script.js.nspanel-lovelace-ui_1.test',
        sendToAsync: (instance: string, _cmd: string, msg: unknown): Promise<string> => {
            target = instance;
            message = msg;
            return Promise.resolve('ok');
        },
    });
    vm.runInContext(stripTypes(source), ctx, { timeout: 5000 });
    expect(message, 'the script sends its configuration').to.be.an('object');
    return { target, config: JSON.parse(JSON.stringify(message)) };
}

describe('lib/configuration/nspanelts-import', () => {
    describe('version and recognition', () => {
        it('accepts v4.4 up to v5.1.1.x', () => {
            for (const v of [
                'v4.4',
                'v4.4.0.0',
                'v4.4.0.14',
                'v4.5.0.0',
                'v5.0.0.2',
                'v5.1.1',
                'v5.1.1.1',
                'v5.1.1.10',
            ]) {
                expect(isSupportedNsPanelTsVersion(v), v).to.equal(true);
            }
        });
        it('rejects older and newer versions and garbage', () => {
            for (const v of [
                'v4.3.3.42',
                'v3.9.0',
                'v5.1.2',
                'v5.2.0.1',
                'v5.5.1.9',
                'v6.0.0',
                '',
                'latest',
                'v5.1.1.x',
            ]) {
                expect(isSupportedNsPanelTsVersion(v), v).to.equal(false);
            }
        });
        it('recognizes the script, its version and topic', () => {
            expect(inspectNsPanelTs(fixture)).to.deep.equal({
                isNsPanelTs: true,
                supported: true,
                version: 'v5.1.1.10',
                topic: 'SmartHome/NSPanel_1',
            });
        });
        it('gives the reason for unsupported scripts', () => {
            expect(inspectNsPanelTs(withVersion(fixture, 'v4.3.3.42'))).to.include({
                supported: false,
                reason: 'version',
            });
            expect(inspectNsPanelTs(withVersion(fixture, 'v5.1.2.0'))).to.include({
                supported: false,
                reason: 'version',
            });
            const noVersion = fixture.replace(/const scriptVersion: string = '[^']*';/, '');
            expect(inspectNsPanelTs(noVersion)).to.include({
                isNsPanelTs: true,
                supported: false,
                reason: 'noVersion',
            });
            const noConfig = fixture.replace('export const config: Config = {', 'export const konfig: Config = {');
            expect(inspectNsPanelTs(noConfig)).to.include({ supported: false, reason: 'noConfig' });
        });
        it('takes the topic from NSPanelSendTopic when the receive topic is no plain mqtt state', () => {
            const source = fixture.replace(
                "const NSPanelReceiveTopic: string = 'mqtt.0.SmartHome.NSPanel_1.tele.RESULT';",
                "const NSPanelReceiveTopic: string = 'mqtt.' + '0.x';",
            );
            expect(inspectNsPanelTs(source).topic).to.equal('SmartHome/NSPanel_1');
            const none = source.replace("'mqtt.0.SmartHome.NSPanel_1.cmnd.CustomSend'", "'custom'");
            expect(inspectNsPanelTs(none).topic).to.equal(undefined);
        });
        it('ignores other scripts', () => {
            expect(inspectNsPanelTs(template).isNsPanelTs).to.equal(false);
            expect(inspectNsPanelTs('log("hello");').isNsPanelTs).to.equal(false);
        });
        it('turns the mqtt state into the topic', () => {
            expect(topicFromMqttState('mqtt.0.SmartHome.NSPanel_1.tele.RESULT')).to.equal('SmartHome/NSPanel_1');
            expect(topicFromMqttState('mqtt.3.nspanel.ns_panel2.cmnd.CustomSend')).to.equal('nspanel/ns_panel2');
            expect(topicFromMqttState('0_userdata.0.x')).to.equal(undefined);
        });
    });

    describe('conversion of the fixture', () => {
        const r = convert();
        const src = r.scriptSource ?? '';

        it('has no errors', () => {
            expect(r.errors).to.deep.equal([]);
            expect(r.scriptSource).to.be.a('string');
        });
        it('writes the pages the script configuration can define, main pages first in their order', () => {
            expect(r.pages).to.deep.equal([
                'main',
                'Zeitplan',
                'Heizung',
                'Musik',
                'Licht',
                'Grid2Seite',
                'MusikSqueeze',
                'Grid3Seite',
            ]);
        });
        it('keeps admin-only cards, thermostat 2 and unsupported players as TODO blocks', () => {
            expect(r.todoPages).to.have.members([
                'Alarm',
                'Tuer',
                'Strom',
                'Chart1',
                'Chart2',
                'Heizung2',
                'MusikBose',
                'Gast',
            ]);
            expect(src).to.include("// TODO: cardAlarm page 'Alarm'");
            expect(src).to.include(
                "//     items: [{ id: 'alias.0.Alarm', actionStringArray: ['Vollschutz', 'Zuhause', 'Nacht', 'Besuch'] }],",
            );
            expect(src).to.include("// TODO: cardThermo2 page 'Heizung2'");
            expect(src).to.include(
                "//         { id: 'alias.0.Bad.Feuchte.ACTUAL', unit: '%', onColor: { red: 255, green: 255, blue: 255 } },",
            );
            expect(src).to.include("// TODO: cardMedia page 'MusikBose'");
        });
        it('drops the service pages', () => {
            expect(r.discarded).to.deep.equal(['NSPanel_Service', 'NSPanel_Infos']);
            for (const name of NSPANELTS_SERVICE_PAGES) {
                expect(src).not.to.include(`const ${name}`);
            }
            expect(src).to.include(
                "// TODO: home 'NSPanel_Service' pointed to a service page of the old script - dropped",
            );
        });
        it('writes the header with source, version, TODO count and the stop hint', () => {
            expect(
                src.startsWith(
                    '/*\n * Converted by nspanel-lovelace-ui.1 on 2026-11-26 from the NSPanelTs script script.js.common.NSPanelTs (v5.1.1.10).',
                ),
            ).to.equal(true);
            expect(src).to.include(` * ${r.todos.length} TODO(s): search for "TODO"`);
            expect(src).to.include(
                ' * Stop the old script script.js.common.NSPanelTs before you activate this script!',
            );
            expect(src).to.include(
                'Das alte Skript script.js.common.NSPanelTs vor dem Aktivieren dieses Skripts stoppen!',
            );
            expect(src.match(/\/\/ TODO/g)?.length).to.equal(r.todos.length);
        });
        it('takes the part from END STOP on from the template, with the namespace', () => {
            expect(src).to.include(SCRIPT_END_STOP_TOKEN);
            const tail = template.slice(template.indexOf(SCRIPT_END_STOP_TOKEN));
            expect(
                src.endsWith(
                    tail.replace("sendToAsync('nspanel-lovelace-ui.0'", "sendToAsync('nspanel-lovelace-ui.1'"),
                ),
            ).to.equal(true);
        });
        it('notes the fields without counterpart as TODO with the original value', () => {
            const texts = r.todos.map(t => t.text);
            expect(texts).to.include('hideEntity2: true - no counterpart in the adapter');
            expect(texts).to.include('shutterZeroIsClosed: true - no counterpart in the adapter');
            expect(texts).to.include('interpolateColor: true - not evaluated by the adapter');
            expect(texts).to.include("media playerMediaIcon: 'logo-alexa' - no counterpart in the adapter");
            expect(texts).to.include('setThermoDestTemp2 is not evaluated by the adapter');
            expect(texts).to.include('useColor: false - the adapter always uses the colors');
            expect(texts.some(t => t.startsWith("page 'Grid3Seite' was not listed in pages/subPages"))).to.equal(true);
            expect(
                texts.some(t =>
                    t.startsWith("id 'alias.0.NSPanel.1.Sensor.ANALOG.Temperature' is a state the old script created"),
                ),
            ).to.equal(true);
            // an own alias of the user below AliasPath is no state of the old script
            expect(texts.some(t => t.includes('usr.Temperatur'))).to.equal(false);
        });
    });

    describe('the generated script', () => {
        const r = convert();
        const { target, config } = runGenerated(r.scriptSource ?? '');
        const page = (name: string): ScriptConfig.PageType | undefined =>
            [...config.pages, ...config.subPages].find(p => 'uniqueName' in p && p.uniqueName === name);

        it('sends to the own instance with the panel topic and the weather instance', () => {
            expect(target).to.equal('nspanel-lovelace-ui.1');
            expect(config.panelTopic).to.equal('nspanel/test');
            expect(config.weatherEntity).to.equal('pirate-weather.0.');
            expect(config.defaultOnColor).to.deep.equal({ red: 253, green: 216, blue: 53 });
        });
        it('maps the navigation to the uniqueNames', () => {
            const licht = page('Licht');
            expect(licht && 'parent' in licht ? licht.parent : undefined).to.equal('main');
            const wohnen = page('main');
            const items = wohnen && 'items' in wohnen ? (wohnen.items ?? []) : [];
            expect(items[0]).to.deep.include({ navigate: true, targetPage: 'Licht' });
            expect(items[0]).not.to.have.property('id');
            expect(items[4]).to.deep.include({ navigate: true, id: 'alias.0.Fenster', targetPage: 'Grid2Seite' });
            const grid2 = page('Grid2Seite');
            expect(grid2).to.include({ prev: 'Licht' });
            expect(grid2).not.to.have.property('home');
        });
        it('builds the media id from instance and device', () => {
            const musik = page('Musik');
            expect(musik && 'media' in musik ? musik.media.id : '').to.equal('alexa2.0.Echo-Devices.G0XXXXXXXXXXXXXX');
            const lms = page('MusikSqueeze');
            expect(lms && 'media' in lms ? lms.media.id : '').to.equal('squeezeboxrpc.0.Players.Kueche');
        });
        it('moves alwaysOnDisplay of the thermostat item to the page', () => {
            const heizung = page('Heizung');
            expect(heizung && 'alwaysOnDisplay' in heizung ? heizung.alwaysOnDisplay : undefined).to.equal(true);
        });
        it('converts screensaver and buttons', () => {
            expect(config.leftScreensaverEntity).to.have.length(3);
            expect(config.leftScreensaverEntity[1]).to.equal(null);
            expect(config.bottomScreensaverEntity[0]).to.deep.include({
                type: 'script',
                ScreensaverEntityNaviToPage: 'Musik',
            });
            expect(config.mrIcon1ScreensaverEntity).to.deep.include({ type: 'script', ScreensaverEntity: 'Relay.1' });
            expect(config.buttonLeft).to.deep.equal({ mode: 'page', page: 'Heizung' });
            expect(config.buttonRight).to.deep.equal({ mode: 'switch', state: 'alias.0.Licht.Decke.SET' });
        });
        it('is accepted by the script → admin planner for every page written', () => {
            const plan = planScriptToAdmin({
                raw: config,
                panel: { name: 'Test', topic: 'nspanel/test' },
                pageConfig: [],
                screensaverConfig: [],
                screensaverNotify: [],
            }).plan;
            expect(plan.skipped).to.deep.equal([]);
            expect(plan.pages.map(p => p.uniqueName)).to.have.members(r.pages);
            expect(plan.pages.every(p => p.action === 'create')).to.equal(true);
            expect(plan.screensaver?.itemCount).to.be.greaterThan(0);
            expect(plan.buttonsSkipped).to.deep.equal([]);
        });
        it('compiles against the ScriptConfig declarations of the template', function () {
            this.timeout(60_000);
            const files: Record<string, string> = {
                '/virtual/globals.d.ts': [
                    'declare function log(msg: unknown, level?: string): void;',
                    'declare function sendToAsync(a: string, b: string, c: unknown, d?: unknown): Promise<unknown>;',
                    'declare function stopScript(a: string, b: unknown): void;',
                    'declare const scriptName: string;',
                ].join('\n'),
                '/virtual/script.ts': r.scriptSource ?? '',
            };
            const options: ts.CompilerOptions = {
                strict: true,
                noEmit: true,
                target: ts.ScriptTarget.ES2022,
                lib: ['lib.es2022.d.ts'],
                types: [],
                skipLibCheck: true,
            };
            const host = ts.createCompilerHost(options);
            const getSourceFile = host.getSourceFile.bind(host);
            host.getSourceFile = (name, lang, onError, create) =>
                name in files
                    ? ts.createSourceFile(name, files[name], lang)
                    : getSourceFile(name, lang, onError, create);
            const fileExists = host.fileExists.bind(host);
            host.fileExists = name => name in files || fileExists(name);
            const program = ts.createProgram(Object.keys(files), options, host);
            const diagnostics = ts
                .getPreEmitDiagnostics(program)
                .map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
            expect(diagnostics).to.deep.equal([]);
        });
    });

    describe('older script versions', () => {
        it('converts a v4.4 script the same way', () => {
            const r44 = convert(withVersion(fixture, 'v4.4.0.0'));
            const r51 = convert();
            expect(r44.errors).to.deep.equal([]);
            expect(r44.version).to.equal('v4.4.0.0');
            expect(r44.pages).to.deep.equal(r51.pages);
            expect(r44.todos.length).to.equal(r51.todos.length);
        });
        it('refuses a v4.3 script with the reason', () => {
            const r = convert(withVersion(fixture, 'v4.3.3.42'));
            expect(r.scriptSource).to.equal(undefined);
            expect(r.errors[0]).to.match(/script version v4\.3\.3\.42 is not supported/);
        });
    });

    describe('errors', () => {
        it('reports code of the configuration part that cannot run', () => {
            const broken = fixture.replace(
                'const HMIOff: RGB = {red: 68, green: 115, blue: 158};',
                'const HMIOff: RGB = unknownFunction();',
            );
            const r = convert(broken);
            expect(r.scriptSource).to.equal(undefined);
            expect(r.errors[0]).to.match(/cannot be evaluated: .*unknownFunction/);
        });
        it('stops an endless loop by the timeout', function () {
            this.timeout(10_000);
            const broken = fixture.replace(
                'var Debug: boolean = false;',
                'var Debug: boolean = false; while (true) {}',
            );
            const r = convert(broken);
            expect(r.scriptSource).to.equal(undefined);
            expect(r.errors[0]).to.match(/cannot be evaluated: .*timed out/i);
        });
        it('offers no require or process', () => {
            const broken = fixture.replace(
                'var Debug: boolean = false;',
                "var Debug: boolean = require('fs') !== undefined;",
            );
            expect(convert(broken).errors[0]).to.match(/require is not defined/);
        });
        it('needs the END STOP block of the template', () => {
            const r = convertNsPanelTs({
                source: fixture,
                template: 'no template',
                endToken: SCRIPT_END_STOP_TOKEN,
                panelTopic: 'nspanel/test',
                namespace: 'nspanel-lovelace-ui.0',
                sourceScriptId: 'script.js.x',
                today: '2026-11-26',
            });
            expect(r.errors).to.deep.equal(['the END STOP block was not found in the template']);
        });
    });
});
