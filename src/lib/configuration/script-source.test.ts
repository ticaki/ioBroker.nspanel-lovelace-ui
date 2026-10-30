import { expect } from 'chai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import {
    backupName,
    clearButtonsInScript,
    clearScreensaverInScript,
    MAX_SCRIPT_BACKUPS,
    planScriptBackup,
    removePagesFromScript,
    scanScriptConfig,
} from './script-source';

const TODAY = '2026-10-30';
const ROOT = path.join(__dirname, '..', '..', '..');
const FIXTURES = path.join(ROOT, 'test', 'fixtures', 'scripts');

/**
 * a file of the repository with LF line endings - a Windows checkout (core.autocrlf) delivers CRLF, the
 * expectations below are written with `\n`
 *
 * @param file absolute path of the file
 */
function readLf(file: string): string {
    return fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
}

function readFixture(name: string): string {
    return readLf(path.join(FIXTURES, name));
}

const template = (): string => readLf(path.join(ROOT, 'script', 'example_sendTo_script_iobroker.ts'));
const nsPanel4 = (): string => readFixture('script.js.nspanel-lovelace-ui_0.ns_panel4.ts.txt');
const nsPanel6 = (): string => readFixture('script.js.nspanel-lovelace-ui_0.nspanel6.ts.txt');
const skriptconfig4 = (): string => readFixture('script.js.skriptconfig4.ts.txt');

/**
 * syntax errors the TypeScript parser reports for the code (type errors are not checked)
 *
 * @param code the code to parse
 */
function syntaxErrors(code: string): string[] {
    const result = ts.transpileModule(code, {
        reportDiagnostics: true,
        compilerOptions: { target: ts.ScriptTarget.ES2022 },
    });
    return (result.diagnostics ?? []).map(
        d => `${d.start ?? '?'}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`,
    );
}

function expectValidSyntax(code: string): void {
    expect(syntaxErrors(code)).to.deep.equal([]);
}

/**
 * the code of the entries of `pages`/`subPages`
 *
 * @param source the script source
 */
function entryTexts(source: string): { pages: string[]; subPages: string[] } {
    const summary = scanScriptConfig(source);
    return { pages: summary.pages.map(e => e.text), subPages: summary.subPages.map(e => e.text) };
}

/**
 * a minimal configuration script around the given config properties and page definitions
 *
 * @param configBody the properties inside the config object
 * @param definitions the page definitions before the config object
 */
function miniScript(configBody: string, definitions = ''): string {
    return [
        'async function configuration(): Promise<void> {',
        definitions,
        '    const config: ScriptConfig.Config = {',
        "        panelTopic: 'nspanel/test',",
        configBody,
        '    };',
        "    await sendToAsync('nspanel-lovelace-ui.0', 'ScriptConfig', { ...config, version: '1' });",
        '}',
        'void configuration();',
        '',
    ].join('\n');
}

const PAGE_A =
    "    const pageA: PageType = {\n        type: 'cardGrid',\n        uniqueName: 'a',\n        items: [],\n    };\n";
const PAGE_B =
    "    const pageB: PageType = {\n        type: 'cardGrid',\n        uniqueName: 'b',\n        items: [],\n    };\n";
const PAGE_C =
    "    const pageC: PageType = {\n        type: 'cardGrid',\n        uniqueName: 'c',\n        items: [],\n    };\n";

describe('lib/configuration - script-source: scanScriptConfig', () => {
    it('reads the template', () => {
        const summary = scanScriptConfig(template());
        expect(summary.found).to.be.true;
        expect(summary.pages).to.deep.equal([{ text: 'Hauptseite', uniqueName: 'main' }]);
        expect(summary.subPages).to.deep.equal([]);
    });

    it('reads ns_panel4', () => {
        expect(scanScriptConfig(nsPanel4())).to.deep.equal({
            found: true,
            pages: [
                { text: 'ownIcons', uniqueName: 'main' },
                { text: 'newIcons', uniqueName: 'newicons' },
                { text: 'newIcons2', uniqueName: 'newicons2' },
                { text: 'iconCheck', uniqueName: 'iconcheck' },
            ],
            subPages: [],
        });
    });

    it('reads nspanel6', () => {
        const summary = scanScriptConfig(nsPanel6());
        expect(summary.pages.map(e => e.uniqueName)).to.deep.equal([
            'main',
            'main22',
            'pageMediaTest2',
            'powerpage',
            'cardThermo2',
            'subgrid2',
        ]);
        expect(summary.subPages).to.deep.equal([
            { text: 'subgrid1', uniqueName: 'testrole' },
            { text: 'hidden', uniqueName: 'hidden' },
        ]);
    });

    it('reads skriptconfig4 (definitions without semicolon, with newline before the brace, unresolvable entries)', () => {
        const summary = scanScriptConfig(skriptconfig4());
        expect(summary.pages).to.deep.equal([
            { text: 'main', uniqueName: 'main' },
            { text: 'SensorGrid3', uniqueName: 'SensorGrid3' },
            { text: 'SensorGrid', uniqueName: 'SensorGrid' },
            { text: 'qrCode', uniqueName: 'qrCode' },
        ]);
        expect(summary.subPages).to.have.length(13);
        // SensorGrid2 is built with JSON.parse(JSON.stringify(SensorGrid)) - no literal uniqueName
        expect(summary.subPages[1]).to.deep.equal({ text: 'SensorGrid2' });
        expect(summary.subPages[4]).to.deep.equal({ text: 'Bad_Thermostat', uniqueName: 'Bad_Thermostat' });
    });

    it('reports a script without config object', () => {
        expect(scanScriptConfig('// nothing here\nconst x = 1;\n')).to.deep.equal({
            found: false,
            pages: [],
            subPages: [],
        });
    });

    it('falls back to the object with panelTopic and pages', () => {
        const source = [
            'const page1 = { type: "cardGrid", uniqueName: "one", items: [] };',
            "sendTo('nspanel-lovelace-ui.0', 'ScriptConfig', {",
            "    panelTopic: 'x',",
            '    pages: [page1, { type: "cardGrid", uniqueName: "two", items: [] }],',
            '    subPages: [],',
            '});',
        ].join('\n');
        const summary = scanScriptConfig(source);
        expect(summary.found).to.be.true;
        expect(summary.pages.map(e => e.uniqueName)).to.deep.equal(['one', 'two']);
    });
});

describe('lib/configuration - script-source: removePagesFromScript', () => {
    it('template: removes "main" and comments the definition out', () => {
        const source = template();
        const result = removePagesFromScript(source, ['main'], TODAY);
        expect(result.changed).to.be.true;
        expect(result.removed).to.deep.equal(['main']);
        expect(result.notFound).to.deep.equal([]);
        expect(result.definitionKept).to.deep.equal([]);
        expectValidSyntax(result.source);
        expect(entryTexts(result.source)).to.deep.equal({ pages: [], subPages: [] });
        expect(result.source).to.include(
            `/* NSPanel: converted to the admin page configuration on ${TODAY}\n    const Hauptseite: ScriptConfig.PageGrid = {`,
        );
        expect(result.source).to.include('    };\n    */\n');
        // the commented entries stay
        expect(result.source).to.include('        pages: [\n            //irgendeinName,\n            //grid1,');
        // everything after the END STOP token is untouched
        const tail = (s: string): string => s.slice(s.indexOf('END STOP END STOP END'));
        expect(tail(result.source)).to.equal(tail(source));
        // idempotent
        const again = removePagesFromScript(result.source, ['main'], '1999-01-01');
        expect(again.changed).to.be.false;
        expect(again.source).to.equal(result.source);
        expect(again.notFound).to.deep.equal(['main']);
    });

    it('ns_panel4: removes a middle entry and keeps "newIcons2" when "newIcons" goes', () => {
        const result = removePagesFromScript(nsPanel4(), ['newicons'], TODAY);
        expect(result.removed).to.deep.equal(['newicons']);
        expect(result.definitionKept).to.deep.equal([]);
        expectValidSyntax(result.source);
        expect(entryTexts(result.source).pages).to.deep.equal(['ownIcons', 'newIcons2', 'iconCheck']);
        expect(result.source).to.include(
            'pages: [\n            ownIcons,\n            newIcons2,\n            iconCheck,\n',
        );
        expect(result.source).to.match(
            /\/\* NSPanel: converted[^\n]*\n {4}const newIcons: ScriptConfig\.PageGrid = \{/,
        );
        expect(result.source).to.include('\n    const newIcons2: ScriptConfig.PageGrid2 = {');
        expect(removePagesFromScript(result.source, ['newicons'], TODAY).changed).to.be.false;
    });

    it('ns_panel4: removes all pages at once', () => {
        const names = ['main', 'newicons', 'newicons2', 'iconcheck'];
        const result = removePagesFromScript(nsPanel4(), names, TODAY);
        expect(result.removed).to.deep.equal(names);
        expectValidSyntax(result.source);
        expect(entryTexts(result.source)).to.deep.equal({ pages: [], subPages: [] });
        expect(result.source).to.include('pages: [\n            //irgendeinName,');
        expect(removePagesFromScript(result.source, names, TODAY).changed).to.be.false;
    });

    it('nspanel6: removes the last entry without trailing comma and keeps the comment after it', () => {
        const result = removePagesFromScript(nsPanel6(), ['hidden', 'main', 'cardThermo2'], TODAY);
        expect(result.removed).to.deep.equal(['hidden', 'main', 'cardThermo2']);
        expectValidSyntax(result.source);
        expect(entryTexts(result.source)).to.deep.equal({
            pages: ['ThermoNew', 'pageMediaTest2', 'powerpage', 'subgrid2'],
            subPages: ['subgrid1'],
        });
        expect(result.source).to.include('subPages: [\n            subgrid1\n            //fahrplan\n        ],');
        expect(result.source).to.match(/\/\* NSPanel: converted[^\n]*\n {4}const hidden: PageType = \{/);
        // pageMediaTest1 contains a block comment, so it gets line comments
        expect(result.source).to.include(
            `// NSPanel: converted to the admin page configuration on ${TODAY}\n    // const pageMediaTest1: PageType = {\n    //     type: 'cardMedia',\n`,
        );
        expect(result.source).to.match(/\/\* NSPanel: converted[^\n]*\n {4}const irgendeinName: PageType = \{/);
        expect(removePagesFromScript(result.source, ['hidden', 'main', 'cardThermo2'], TODAY).changed).to.be.false;
    });

    it('skriptconfig4: keeps a definition that is referenced elsewhere, reports unknown names', () => {
        const result = removePagesFromScript(
            skriptconfig4(),
            ['SensorGrid', 'qrCode', 'Bad_Thermostat', 'drei'],
            TODAY,
        );
        expect(result.removed).to.deep.equal(['SensorGrid', 'qrCode', 'Bad_Thermostat']);
        expect(result.notFound).to.deep.equal(['drei']);
        expect(result.definitionKept).to.deep.equal(['SensorGrid']);
        expect(result.notes).to.deep.equal([
            'page "drei" not found in pages/subPages - nothing removed',
            '"SensorGrid" (page "SensorGrid") is still referenced in the script - definition kept',
        ]);
        expectValidSyntax(result.source);
        const entries = entryTexts(result.source);
        expect(entries.pages).to.deep.equal(['main', 'SensorGrid3']);
        expect(entries.subPages).to.deep.equal([
            'this_Thermostat',
            'SensorGrid2',
            'Ankleidezimmer_Thermostat',
            'WohnzimmerWindow',
            'Kinderzimmer_1_Thermostat',
            'Kueche_Thermostat',
            'Wohnzimmer_Thermostat',
            'Schlafzimmer_Thermostat',
            'ObergeschossWindow',
            'WindowGrid',
            'Only4',
            'ogLightsGrid',
        ]);
        // the last two entries are removed; the surviving entry keeps its (valid) trailing comma and the comment lines stay
        expect(result.source).to.include('    pages: [\n        main,\n        SensorGrid3,\n        //Alexa,');
        // referenced definition stays active
        expect(result.source).to.include('\n    let SensorGrid: PageType = {');
        expect(result.source).to.include('const SensorGrid2 = JSON.parse(JSON.stringify(SensorGrid))');
        // `let X: PageType = \n{` form is commented out
        expect(result.source).to.match(/\/\* NSPanel: converted[^\n]*\nlet Bad_Thermostat: PageType = \n\{/);
        expect(result.source).to.match(/\/\* NSPanel: converted[^\n]*\nconst qrCode: any = \{/);
        expect(removePagesFromScript(result.source, ['SensorGrid', 'qrCode', 'Bad_Thermostat', 'drei'], TODAY).changed)
            .to.be.false;
    });

    it('removes an inline object literal from the array', () => {
        const source = miniScript(
            [
                '        pages: [',
                '            pageA,',
                "            { type: 'cardGrid', uniqueName: 'inline', items: [{ id: 'a.0.x' }] },",
                '            pageB,',
                '        ],',
                '        subPages: [],',
            ].join('\n'),
            PAGE_A + PAGE_B,
        );
        const result = removePagesFromScript(source, ['inline'], TODAY);
        expect(result.removed).to.deep.equal(['inline']);
        expect(result.definitionKept).to.deep.equal([]);
        expectValidSyntax(result.source);
        expect(entryTexts(result.source).pages).to.deep.equal(['pageA', 'pageB']);
        expect(result.source).to.include('        pages: [\n            pageA,\n            pageB,\n        ],');
    });

    it('removes the last element without trailing comma (single line array)', () => {
        const source = miniScript(
            '        pages: [pageA, pageB, pageC],\n        subPages: [],',
            PAGE_A + PAGE_B + PAGE_C,
        );
        const result = removePagesFromScript(source, ['c'], TODAY);
        expectValidSyntax(result.source);
        expect(result.source).to.include('pages: [pageA, pageB],');
        const both = removePagesFromScript(result.source, ['a', 'b'], TODAY);
        expectValidSyntax(both.source);
        expect(both.source).to.include('pages: [],');
        expect(entryTexts(both.source).pages).to.deep.equal([]);
    });

    it('removes the only element', () => {
        const source = miniScript('        pages: [\n            pageA\n        ],\n        subPages: [],', PAGE_A);
        const result = removePagesFromScript(source, ['a'], TODAY);
        expectValidSyntax(result.source);
        expect(result.source).to.include('        pages: [\n        ],');
    });

    it('ignores commented entries and a commented definition', () => {
        const source = miniScript(
            [
                '        pages: [',
                '            // pageA,',
                '            pageB, // the real one',
                '            /* pageC, */',
                '        ],',
                '        subPages: [],',
            ].join('\n'),
            `/* ${PAGE_A} */\n${PAGE_B}${PAGE_C}`,
        );
        const result = removePagesFromScript(source, ['a', 'b'], TODAY);
        expect(result.removed).to.deep.equal(['b']);
        expect(result.notFound).to.deep.equal(['a']);
        expectValidSyntax(result.source);
        expect(result.source).to.include(
            '        pages: [\n            // pageA,\n            /* pageC, */\n        ],',
        );
        expect(result.source).to.not.include('the real one');
        expect(result.source).to.include(
            `/* NSPanel: converted to the admin page configuration on ${TODAY}\n    const pageB`,
        );
    });

    it('keeps the definition when the identifier is referenced elsewhere', () => {
        const source = miniScript(
            '        pages: [pageA, pageB],\n        subPages: [],',
            `${PAGE_A}${PAGE_B}    pageB.heading = pageA.heading;\n`,
        );
        const result = removePagesFromScript(source, ['a', 'b'], TODAY);
        expect(result.removed).to.deep.equal(['a', 'b']);
        expect(result.definitionKept).to.deep.equal(['a', 'b']);
        expectValidSyntax(result.source);
        expect(result.source).to.include('pages: [],');
        expect(result.source).to.include('\n    const pageA: PageType = {');
        expect(result.source).to.include('\n    const pageB: PageType = {');
        expect(result.source).to.not.include('NSPanel:');
    });

    it('does not treat a mention in a string or comment as a reference', () => {
        const source = miniScript(
            "        pages: [pageA],\n        subPages: [],\n        buttonLeft: { mode: 'page', page: 'pageA' }, // pageA",
            `${PAGE_A}    // pageA is the main page\n    log('pageA');\n`,
        );
        const result = removePagesFromScript(source, ['a'], TODAY);
        expect(result.definitionKept).to.deep.equal([]);
        expectValidSyntax(result.source);
        expect(result.source).to.include(
            `/* NSPanel: converted to the admin page configuration on ${TODAY}\n    const pageA`,
        );
    });

    it('finds uniqueName with double quotes and quoted keys', () => {
        const source = miniScript(
            '        pages: [pageA, other],\n        subPages: [],',
            `${PAGE_A}    let other = {\n        "type": "cardGrid",\n        "uniqueName": "dq",\n        items: [],\n    } as PageType;\n`,
        );
        const result = removePagesFromScript(source, ['dq'], TODAY);
        expect(result.removed).to.deep.equal(['dq']);
        expectValidSyntax(result.source);
        expect(result.source).to.include('pages: [pageA],');
        expect(result.source).to.include('    } as PageType;\n    */');
    });

    it('is not confused by brackets in strings, comments, template literals and regex literals', () => {
        const definitions = [
            '    const re = /[{(]\\//g; // {{{ [[[',
            "    const txt = 'pages: [ pageA ]'; // }}",
            '    const tpl = `${re.source}] ${txt} {`;',
            '    const tpl2 = `a ${`nested ${1 + 1} [`} b ${JSON.stringify({ x: "]" })}`;',
            '    /* pages: [ pageB ] } */',
            PAGE_A,
            PAGE_B,
        ].join('\n');
        const source = miniScript(
            "        pages: [pageA, pageB], // ]]]\n        subPages: [],\n        weatherEntity: 'x[0]',",
            definitions,
        );
        expectValidSyntax(source);
        const result = removePagesFromScript(source, ['a'], TODAY);
        expect(result.removed).to.deep.equal(['a']);
        expectValidSyntax(result.source);
        expect(entryTexts(result.source).pages).to.deep.equal(['pageB']);
        expect(result.source).to.include('pages: [pageB], // ]]]');
        expect(result.source).to.include(
            '    const tpl2 = `a ${`nested ${1 + 1} [`} b ${JSON.stringify({ x: "]" })}`;',
        );
    });

    it('comments with line comments when the definition contains the end of a block comment', () => {
        const source = miniScript(
            '        pages: [pageA],\n        subPages: [],',
            "    const pageA: PageType = {\n        type: 'cardGrid',\n        uniqueName: 'a',\n        items: [], /* none */\n    };\n",
        );
        const result = removePagesFromScript(source, ['a'], TODAY);
        expectValidSyntax(result.source);
        expect(result.source).to.include(
            `// NSPanel: converted to the admin page configuration on ${TODAY}\n    // const pageA: PageType = {\n    //     type: 'cardGrid',\n    //     uniqueName: 'a',\n    //     items: [], /* none */\n    // };\n`,
        );
        expect(removePagesFromScript(result.source, ['a'], TODAY).changed).to.be.false;
    });

    it('leaves a Blockly or foreign script untouched', () => {
        const blockly = '<xml xmlns="https://developers.google.com/blockly/xml"><block type="on_ext"></block></xml>\n';
        const foreign =
            'const pages = [1, 2, 3];\nconsole.log(pages);\nfunction config() { return { panelTopic: 1 }; }\n';
        for (const source of [blockly, foreign, '']) {
            const result = removePagesFromScript(source, ['main'], TODAY);
            expect(result.changed).to.be.false;
            expect(result.source).to.equal(source);
            expect(result.notFound).to.deep.equal(['main']);
            expect(result.notes).to.deep.equal(['config object not found - script left unchanged']);
        }
    });

    it('reports a pages value that is not an array literal', () => {
        const source = miniScript('        pages: allPages,\n        subPages: [],', 'const allPages = [];');
        const result = removePagesFromScript(source, ['main'], TODAY);
        expect(result.changed).to.be.false;
        expect(result.notes).to.include('pages is not an array literal - left unchanged');
    });

    it('does nothing for an empty name list', () => {
        const result = removePagesFromScript(template(), [], TODAY);
        expect(result.changed).to.be.false;
        expect(result.removed).to.deep.equal([]);
    });

    it('keeps CRLF line endings of a script written under Windows', () => {
        const lf = nsPanel6();
        const summary = scanScriptConfig(lf);
        const names = [...summary.pages, ...summary.subPages]
            .map(e => e.uniqueName)
            .filter((n): n is string => typeof n === 'string');
        expect(names.length).to.be.greaterThan(1);
        const fromLf = removePagesFromScript(lf, names, TODAY);
        const fromCrlf = removePagesFromScript(lf.replace(/\n/g, '\r\n'), names, TODAY);
        expect(fromCrlf.changed).to.be.true;
        expect(fromCrlf.removed).to.deep.equal(fromLf.removed);
        expect(fromCrlf.notes).to.deep.equal(fromLf.notes);
        expect(fromCrlf.source, 'no bare LF in the CRLF result').to.not.match(/[^\r]\n/);
        expect(fromCrlf.source, 'no bare CR in the CRLF result').to.not.match(/\r(?!\n)/);
        expect(fromCrlf.source.replace(/\r\n/g, '\n')).to.equal(fromLf.source);
    });
});

describe('lib/configuration - script-source: clearScreensaverInScript', () => {
    it('template: empties the arrays and the mrIcons, keeps the already empty array with its comment', () => {
        const result = clearScreensaverInScript(template(), TODAY);
        expect(result.changed).to.be.true;
        expect(result.cleared).to.deep.equal([
            'favoritScreensaverEntity',
            'leftScreensaverEntity',
            'bottomScreensaverEntity',
            'indicatorScreensaverEntity',
            'mrIcon1ScreensaverEntity',
            'mrIcon2ScreensaverEntity',
        ]);
        expect(result.notes).to.deep.equal([]);
        expectValidSyntax(result.source);
        expect(result.source).to.include(
            `favoritScreensaverEntity: [], // NSPanel: moved to the admin screensaver on ${TODAY}`,
        );
        expect(result.source).to.include(
            `mrIcon1ScreensaverEntity: undefined, // NSPanel: moved to the admin screensaver on ${TODAY}`,
        );
        expect(result.source).to.include(
            'alternateScreensaverEntity: [\n            // only used with alternate Screensaver\n        ],',
        );
        expect(result.source).to.include('        // Status Icon \n        mrIcon1ScreensaverEntity: undefined,');
        expect(result.source).to.include("buttonLeft: {\n            mode: 'page',");
        // pages are untouched
        expect(entryTexts(result.source).pages).to.deep.equal(['Hauptseite']);
        const again = clearScreensaverInScript(result.source, '1999-01-01');
        expect(again.changed).to.be.false;
        expect(again.cleared).to.deep.equal([]);
    });

    it('nspanel6: leaves an array that only contains a block comment alone', () => {
        const result = clearScreensaverInScript(nsPanel6(), TODAY);
        expect(result.cleared).to.deep.equal([
            'favoritScreensaverEntity',
            'leftScreensaverEntity',
            'indicatorScreensaverEntity',
            'notifyScreensaverEntity',
            'mrIcon1ScreensaverEntity',
            'mrIcon2ScreensaverEntity',
        ]);
        expectValidSyntax(result.source);
        expect(result.source).to.include('bottomScreensaverEntity: [/*\n');
        expect(clearScreensaverInScript(result.source, TODAY).changed).to.be.false;
    });

    it('skriptconfig4: value on the next line, commented property is ignored', () => {
        const result = clearScreensaverInScript(skriptconfig4(), TODAY);
        expect(result.cleared).to.deep.equal([
            'favoritScreensaverEntity',
            'leftScreensaverEntity',
            'bottomScreensaverEntity',
            'indicatorScreensaverEntity',
            'mrIcon1ScreensaverEntity',
            'mrIcon2ScreensaverEntity',
        ]);
        expectValidSyntax(result.source);
        expect(result.source).to.include('    leftScreensaverEntity:\n        [], // NSPanel: moved');
        expect(result.source).to.include('    /*bottomScreensaverEntity: [\n');
        expect(clearScreensaverInScript(result.source, TODAY).changed).to.be.false;
    });

    it('ns_panel4: clean run', () => {
        const result = clearScreensaverInScript(nsPanel4(), TODAY);
        expect(result.cleared).to.have.length(6);
        expectValidSyntax(result.source);
        expect(clearScreensaverInScript(result.source, TODAY).changed).to.be.false;
    });

    it('removes the screensaver options from advancedOptions and uses a block marker inside a line', () => {
        const source = miniScript(
            [
                '        pages: [],',
                '        subPages: [],',
                "        favoritScreensaverEntity: [{ type: 'script', ScreensaverEntity: 'a.0.x', ScreensaverEntityText: 't' }], bottomScreensaverEntity: [],",
                '        mrIcon1ScreensaverEntity: undefined,',
                "        mrIcon2ScreensaverEntity: { type: 'script', ScreensaverEntity: 'Relay.2', ScreensaverEntityIconOn: null, ScreensaverEntityIconOff: null, ScreensaverEntityValue: null, ScreensaverEntityValueDecimalPlace: null, ScreensaverEntityValueUnit: null, ScreensaverEntityOnColor: On, ScreensaverEntityOffColor: Off },",
                '        advancedOptions: {',
                '            extraConfigLogging: true,',
                '            screensaverSwipe: true, // swipe',
                '            screensaverIndicatorButtons: false',
                '        }',
            ].join('\n'),
        );
        const result = clearScreensaverInScript(source, TODAY);
        expect(result.cleared).to.deep.equal([
            'favoritScreensaverEntity',
            'mrIcon2ScreensaverEntity',
            'advancedOptions.screensaverSwipe',
            'advancedOptions.screensaverIndicatorButtons',
        ]);
        expectValidSyntax(result.source);
        expect(result.source).to.include(
            `        favoritScreensaverEntity: [], /* NSPanel: moved to the admin screensaver on ${TODAY} */ bottomScreensaverEntity: [],`,
        );
        expect(result.source).to.include(
            '        mrIcon1ScreensaverEntity: undefined,\n        mrIcon2ScreensaverEntity: undefined, // NSPanel',
        );
        expect(result.source).to.include(
            `        advancedOptions: {\n            extraConfigLogging: true,\n        } // NSPanel: moved to the admin screensaver on ${TODAY}\n    };`,
        );
        expect(clearScreensaverInScript(result.source, TODAY).changed).to.be.false;
    });

    it('reports values that are not literals and leaves them', () => {
        const source = miniScript(
            '        pages: [],\n        subPages: [],\n        favoritScreensaverEntity: favorites,\n        advancedOptions: options,',
        );
        const result = clearScreensaverInScript(source, TODAY);
        expect(result.changed).to.be.false;
        expect(result.notes).to.deep.equal([
            'favoritScreensaverEntity is not an array literal - left unchanged',
            'advancedOptions is not an object literal - left unchanged',
        ]);
    });

    it('leaves a foreign script untouched', () => {
        const result = clearScreensaverInScript('<xml></xml>', TODAY);
        expect(result.changed).to.be.false;
        expect(result.notes).to.deep.equal(['config object not found - script left unchanged']);
    });
});

describe('lib/configuration - script-source: clearButtonsInScript', () => {
    it('template: sets buttonLeft to null, buttonRight is already null', () => {
        const result = clearButtonsInScript(template(), ['left', 'right'], TODAY);
        expect(result.changed).to.be.true;
        expect(result.notes).to.deep.equal([]);
        expectValidSyntax(result.source);
        expect(result.source).to.include(
            `buttonLeft: null, // NSPanel: moved to the admin panel configuration on ${TODAY}`,
        );
        expect(result.source).to.include("buttonRight: null/*{\n            mode: 'switch',");
        expect(clearButtonsInScript(result.source, ['left', 'right'], TODAY).changed).to.be.false;
    });

    it('clears only the requested side', () => {
        const source = skriptconfig4();
        const left = clearButtonsInScript(source, ['left'], TODAY);
        expectValidSyntax(left.source);
        expect(left.source).to.include('buttonLeft:null, // NSPanel: moved');
        expect(left.source).to.include("buttonRight:{\n            mode:'switch',");
        const right = clearButtonsInScript(left.source, ['right'], TODAY);
        expectValidSyntax(right.source);
        // last property without comma: the marker follows the value directly
        expect(right.source).to.include('buttonRight:null // NSPanel: moved');
        expect(clearButtonsInScript(right.source, ['left', 'right'], TODAY).changed).to.be.false;
    });

    it('reports a missing button property', () => {
        const result = clearButtonsInScript(miniScript('        pages: [],\n        subPages: [],'), ['left'], TODAY);
        expect(result.changed).to.be.false;
        expect(result.notes).to.deep.equal(['buttonLeft not found in the config object']);
    });

    it('leaves a foreign script untouched', () => {
        const result = clearButtonsInScript('const x = 1;', ['left'], TODAY);
        expect(result.changed).to.be.false;
        expect(result.notes).to.deep.equal(['config object not found - script left unchanged']);
    });
});

describe('lib/configuration - script-source: combined rewrite of the real scripts', () => {
    const cases: [string, () => string][] = [
        ['template', template],
        ['ns_panel4', nsPanel4],
        ['nspanel6', nsPanel6],
        ['skriptconfig4', skriptconfig4],
    ];
    for (const [name, load] of cases) {
        it(`${name}: all pages, screensaver and buttons - valid and idempotent`, () => {
            const source = load();
            expectValidSyntax(source);
            const summary = scanScriptConfig(source);
            const names = [...summary.pages, ...summary.subPages]
                .map(e => e.uniqueName)
                .filter((n): n is string => n !== undefined);
            const r1 = removePagesFromScript(source, names, TODAY);
            const r2 = clearScreensaverInScript(r1.source, TODAY);
            const r3 = clearButtonsInScript(r2.source, ['left', 'right'], TODAY);
            expectValidSyntax(r3.source);
            expect(r1.removed).to.deep.equal(names);
            const after = scanScriptConfig(r3.source);
            expect(after.pages).to.deep.equal([]);
            expect(after.subPages.filter(e => e.uniqueName !== undefined)).to.deep.equal([]);
            expect(removePagesFromScript(r3.source, names, TODAY).changed).to.be.false;
            expect(clearScreensaverInScript(r3.source, TODAY).changed).to.be.false;
            expect(clearButtonsInScript(r3.source, ['left', 'right'], TODAY).changed).to.be.false;
        });
    }
});

describe('lib/configuration - script-source: planScriptBackup', () => {
    const id = 'script.js.nspanel-lovelace-ui_0.ns_panel4';

    it('keeps at most four backups', () => {
        expect(MAX_SCRIPT_BACKUPS).to.equal(4);
    });

    it('no existing backup', () => {
        expect(planScriptBackup(id, [id, 'script.js.other'])).to.deep.equal({
            backupId: `${id}_1_backup`,
            renames: [],
            deletes: [],
        });
    });

    it('one existing backup', () => {
        expect(planScriptBackup(id, [`${id}_1_backup`])).to.deep.equal({
            backupId: `${id}_1_backup`,
            renames: [{ from: `${id}_1_backup`, to: `${id}_2_backup` }],
            deletes: [],
        });
    });

    it('three existing backups: highest first', () => {
        expect(planScriptBackup(id, [`${id}_1_backup`, `${id}_2_backup`, `${id}_3_backup`])).to.deep.equal({
            backupId: `${id}_1_backup`,
            renames: [
                { from: `${id}_3_backup`, to: `${id}_4_backup` },
                { from: `${id}_2_backup`, to: `${id}_3_backup` },
                { from: `${id}_1_backup`, to: `${id}_2_backup` },
            ],
            deletes: [],
        });
    });

    it('four existing backups: the oldest is deleted', () => {
        const plan = planScriptBackup(id, [`${id}_4_backup`, `${id}_2_backup`, `${id}_1_backup`, `${id}_3_backup`]);
        expect(plan.deletes).to.deep.equal([`${id}_4_backup`]);
        expect(plan.renames).to.deep.equal([
            { from: `${id}_3_backup`, to: `${id}_4_backup` },
            { from: `${id}_2_backup`, to: `${id}_3_backup` },
            { from: `${id}_1_backup`, to: `${id}_2_backup` },
        ]);
    });

    it('six existing backups: everything from 4 on is deleted', () => {
        const existing = [1, 2, 3, 4, 5, 6].map(n => `${id}_${n}_backup`);
        const plan = planScriptBackup(id, existing);
        expect(plan.deletes).to.deep.equal([`${id}_6_backup`, `${id}_5_backup`, `${id}_4_backup`]);
        expect(plan.renames.map(r => r.from)).to.deep.equal([`${id}_3_backup`, `${id}_2_backup`, `${id}_1_backup`]);
    });

    it('gaps are kept as they are', () => {
        const plan = planScriptBackup(id, [`${id}_1_backup`, `${id}_3_backup`, `${id}_7_backup`]);
        expect(plan).to.deep.equal({
            backupId: `${id}_1_backup`,
            renames: [
                { from: `${id}_3_backup`, to: `${id}_4_backup` },
                { from: `${id}_1_backup`, to: `${id}_2_backup` },
            ],
            deletes: [`${id}_7_backup`],
        });
    });

    it('ignores ids that only look similar', () => {
        const plan = planScriptBackup(id, [
            `${id}2_1_backup`,
            `${id}_1_backup_old`,
            `${id}_backup`,
            `${id}_0_backup`,
            `${id}_x_backup`,
            `${id}.sub_1_backup`,
            'script.js.common.ns_panel4_1_backup',
            `${id}_2_backup`,
            `${id}_2_backup`,
        ]);
        expect(plan).to.deep.equal({
            backupId: `${id}_1_backup`,
            renames: [{ from: `${id}_2_backup`, to: `${id}_3_backup` }],
            deletes: [],
        });
    });

    it('escapes regex characters of the script id', () => {
        const plan = planScriptBackup('script.js.a+b', ['script.js.a+b_1_backup', 'script.js.aab_1_backup']);
        expect(plan.renames).to.deep.equal([{ from: 'script.js.a+b_1_backup', to: 'script.js.a+b_2_backup' }]);
    });
});

describe('lib/configuration - script-source: backupName', () => {
    it('appends the number', () => {
        expect(backupName('ns_panel4', 1)).to.equal('ns_panel4 backup 1');
    });

    it('replaces an existing backup suffix', () => {
        expect(backupName('ns_panel4 backup 1', 2)).to.equal('ns_panel4 backup 2');
        expect(backupName('my backup script backup 3', 4)).to.equal('my backup script backup 4');
    });
});
