/**
 * Tests of the adapter side of the NSPanelTs import with a fake object database.
 */
import { expect } from 'chai';
import * as fs from 'node:fs';
import path from 'node:path';
import { SCRIPT_END_STOP_TOKEN } from '../tools/panel-setup';
import { NsPanelTsImport, type NsPanelTsImportAdapter } from './nspanelts-import-runner';

const root = path.join(__dirname, '../../..');
// a Windows checkout has CRLF - normalized, so the manipulations of the fixture in the tests work everywhere
const fixture = fs
    .readFileSync(path.join(root, 'test/fixtures/scripts/NSPanelTs-v5.1.1.fixture.ts.txt'), 'utf8')
    .replace(/\r\n/g, '\n');
const template = fs.readFileSync(path.join(root, 'script/example_sendTo_script_iobroker.ts'), 'utf8');
const folder = 'script.js.nspanel-lovelace-ui_0';

function script(id: string, source: string, enabled = true): ioBroker.ScriptObject {
    return {
        _id: id,
        type: 'script',
        common: {
            name: id.split('.').pop() ?? id,
            engineType: 'TypeScript/ts',
            engine: 'system.adapter.javascript.1',
            source,
            debug: false,
            verbose: false,
            enabled,
        },
        native: {},
    };
}

function setup(db: Record<string, ioBroker.Object>): { importer: NsPanelTsImport; writes: string[] } {
    const writes: string[] = [];
    const noop = (): void => undefined;
    const adapter: NsPanelTsImportAdapter = {
        namespace: 'nspanel-lovelace-ui.0',
        log: { info: noop, warn: noop, error: noop },
        getForeignObjectAsync: id => Promise.resolve(db[id]),
        setForeignObjectAsync: (id, obj) => {
            writes.push(id);
            db[id] = obj;
            return Promise.resolve();
        },
        extendForeignObjectAsync: id => {
            writes.push(id);
            return Promise.resolve();
        },
        getObjectViewAsync: (_d, _s, params) =>
            Promise.resolve({
                rows: Object.keys(db)
                    .filter(id => id >= params.startkey && id <= params.endkey && db[id].type === 'script')
                    .map(id => ({ id, value: db[id] })),
            }),
    };
    const importer = new NsPanelTsImport({
        adapter,
        folder,
        scriptIdFor: name => `${folder}.${name}`,
        template,
        endToken: SCRIPT_END_STOP_TOKEN,
        panelNames: ['Flur'],
        now: () => new Date(2026, 10, 26),
    });
    return { importer, writes };
}

describe('lib/configuration/nspanelts-import-runner', () => {
    it('lists the old scripts only, with version, topic and support', async () => {
        const db: Record<string, ioBroker.Object> = {
            'script.js.common.NSPanelTs': script('script.js.common.NSPanelTs', fixture),
            'script.js.common.Alt': script(
                'script.js.common.Alt',
                fixture.replace("'v5.1.1.10'", "'v4.3.3.42'"),
                false,
            ),
            'script.js.common.other': script('script.js.common.other', 'log("x");'),
            [`${folder}.Flur`]: script(`${folder}.Flur`, template),
        };
        const { importer } = setup(db);
        expect(await importer.list()).to.deep.equal([
            {
                id: 'script.js.common.Alt',
                name: 'Alt',
                enabled: false,
                supported: false,
                version: 'v4.3.3.42',
                topic: 'SmartHome/NSPanel_1',
                reason: 'version',
            },
            {
                id: 'script.js.common.NSPanelTs',
                name: 'NSPanelTs',
                enabled: true,
                supported: true,
                version: 'v5.1.1.10',
                topic: 'SmartHome/NSPanel_1',
            },
        ]);
    });

    it('writes a new disabled script and never overwrites one', async () => {
        const old = script('script.js.common.NSPanelTs', fixture);
        const db: Record<string, ioBroker.Object> = { 'script.js.common.NSPanelTs': old };
        const before = JSON.stringify(old);
        const { importer, writes } = setup(db);

        const first = await importer.convert({ scriptId: old._id, panelName: 'Flur', topic: ' SmartHome/NSPanel_1 ' });
        expect(first).to.deep.include({
            scriptId: `${folder}.Flur`,
            todoPages: ['Alarm', 'Tuer', 'Strom', 'Chart1', 'Chart2', 'MusikBose', 'Gast'],
        });
        const created = db[`${folder}.Flur`];
        expect(created.type).to.equal('script');
        expect(created.common).to.deep.include({ enabled: false, engine: 'system.adapter.javascript.1', name: 'Flur' });
        const source = created.type === 'script' ? created.common.source : '';
        expect(source).to.include("panelTopic: 'SmartHome/NSPanel_1',");

        const second = await importer.convert({ scriptId: old._id, panelName: 'Flur', topic: 'x/y' });
        expect(second).to.deep.include({ scriptId: `${folder}.Flur_NSPanelTs` });
        const third = await importer.convert({ scriptId: old._id, panelName: 'Flur', topic: 'x/y' });
        expect(third).to.deep.include({ scriptId: `${folder}.Flur_NSPanelTs_2` });

        expect(JSON.stringify(db['script.js.common.NSPanelTs']), 'old script untouched').to.equal(before);
        expect(writes).not.to.include('script.js.common.NSPanelTs');
    });

    it('refuses unknown panels, an empty topic and missing or unsupported scripts', async () => {
        const db: Record<string, ioBroker.Object> = {
            'script.js.common.NSPanelTs': script('script.js.common.NSPanelTs', fixture),
            'script.js.common.Alt': script('script.js.common.Alt', fixture.replace("'v5.1.1.10'", "'v4.3.3.42'")),
        };
        const { importer, writes } = setup(db);
        expect(
            await importer.convert({ scriptId: 'script.js.common.NSPanelTs', panelName: 'Web', topic: 'a/b' }),
        ).to.deep.include({
            errorKey: 'nspanelTsImport_errorPanel',
        });
        expect(
            await importer.convert({ scriptId: 'script.js.common.NSPanelTs', panelName: 'Flur', topic: ' ' }),
        ).to.deep.include({
            errorKey: 'nspanelTsImport_errorTopic',
        });
        expect(
            await importer.convert({ scriptId: 'script.js.common.none', panelName: 'Flur', topic: 'a/b' }),
        ).to.deep.include({
            errorKey: 'nspanelTsImport_errorScript',
        });
        const alt = await importer.convert({ scriptId: 'script.js.common.Alt', panelName: 'Flur', topic: 'a/b' });
        expect('error' in alt && alt.error).to.match(/v4\.3\.3\.42 is not supported/);
        expect(writes).to.deep.equal([]);
    });
});
