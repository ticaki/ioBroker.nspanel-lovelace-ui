/**
 * Tests of the sendTo runner `convertScriptToAdmin` against an in-memory object database: the dry run
 * writes nothing, the execution answers before it writes the instance object, rotates the script backups,
 * rewrites the source, cleans the stored script configuration (through the real config manager) and
 * fills the admin tables.
 */
import { expect } from 'chai';
import { ConfigManager } from '../classes/config-manager';
import { StatesControler } from '../controller/states-controller';
import type { ConvertScriptPlan, ConvertScriptResult, MenuEntry, ScreensaverEntry } from '../types/adminShareConfig';
import { scanScriptConfig } from './script-source';
import {
    applyPendingScriptConversions,
    CONVERT_NO_SCRIPT_ERROR_KEY,
    localDate,
    ScriptToAdminRunner,
    type PendingScriptConversion,
    type ConvertScriptAnswer,
    type ScriptConfigStore,
    type ScriptToAdminRunnerOptions,
} from './script-to-admin-runner';

const namespace = 'nspanel-lovelace-ui.0';
const instanceId = `system.adapter.${namespace}`;
const topic = 'nspanel/test';
const panelName = 'Testpanel';
const scriptId = 'script.js.nspanel-lovelace-ui_0.test';
const scriptName = 'Test';
const today = '2026-10-30';

const On = { red: 253, green: 216, blue: 53 };
const Off = { red: 253, green: 128, blue: 0 };

/* ---------------------------------------------------------------------------------------------
 * fixtures
 * ------------------------------------------------------------------------------------------- */

/**
 * A mrIcon of the script.
 *
 * @param entity Datapoint of the icon.
 */
function mrIcon(entity: string | null): ScriptConfig.ScreenSaverMRElement {
    return {
        type: 'script',
        ScreensaverEntity: entity,
        ScreensaverEntityIconOn: 'lightbulb',
        ScreensaverEntityIconOff: null,
        ScreensaverEntityValue: null,
        ScreensaverEntityValueDecimalPlace: 0,
        ScreensaverEntityValueUnit: null,
        ScreensaverEntityOnColor: On,
        ScreensaverEntityOffColor: Off,
    };
}

/**
 * A page of the script - typed loosely.
 *
 * @param page The page.
 */
function page(page: Record<string, unknown>): ScriptConfig.PageType {
    return page as unknown as ScriptConfig.PageType;
}

/**
 * The raw configuration the script sent: two pages, one sub page, a favorite screensaver item and the
 * left button.
 *
 * @param partial Fields to override.
 */
function rawConfig(partial: Partial<ScriptConfig.Config> = {}): ScriptConfig.Config {
    return {
        version: '0.21.6',
        scriptName: scriptId,
        panelTopic: topic,
        weatherEntity: '',
        defaultOnColor: On,
        defaultOffColor: Off,
        defaultBackgroundColor: { red: 29, green: 29, blue: 29 },
        weatherAddDefaultItems: false,
        favoritScreensaverEntity: [
            {
                type: 'script',
                ScreensaverEntity: '0_userdata.0.temp',
                ScreensaverEntityFactor: 1,
                ScreensaverEntityDecimalPlaces: 1,
                ScreensaverEntityIconOn: 'thermometer',
                ScreensaverEntityIconOff: null,
                ScreensaverEntityText: 'Temp',
                ScreensaverEntityUnitText: '°C',
                ScreensaverEntityIconColor: { val_min: 0, val_max: 30 },
            },
        ],
        alternateScreensaverEntity: [],
        leftScreensaverEntity: [],
        bottomScreensaverEntity: [],
        indicatorScreensaverEntity: [],
        mrIcon1ScreensaverEntity: mrIcon('Relay.1'),
        mrIcon2ScreensaverEntity: mrIcon('Relay.2'),
        pages: [
            page({ type: 'cardGrid', uniqueName: 'main', heading: 'Die Leere', items: [], next: 'licht' }),
            page({ type: 'cardGrid', uniqueName: 'licht', heading: 'Licht', items: [], prev: 'main' }),
        ],
        subPages: [page({ type: 'cardEntities', uniqueName: 'sub1', heading: 'Sub', items: [], parent: 'licht' })],
        buttonLeft: { mode: 'page', page: 'licht' },
        buttonRight: null,
        ...partial,
    };
}

/** a raw configuration without anything to convert */
function emptyRawConfig(): ScriptConfig.Config {
    return rawConfig({
        favoritScreensaverEntity: [],
        mrIcon1ScreensaverEntity: mrIcon(null),
        mrIcon2ScreensaverEntity: mrIcon(null),
        pages: [],
        subPages: [],
        buttonLeft: null,
    });
}

/** the source of the configuration script that sent {@link rawConfig} */
function scriptSource(): string {
    return [
        'async function configuration(): Promise<void> {',
        '    const main: PageType = {',
        "        type: 'cardGrid',",
        "        uniqueName: 'main',",
        "        heading: 'Die Leere',",
        '        items: [],',
        "        next: 'licht',",
        '    };',
        '    const licht: PageType = {',
        "        type: 'cardGrid',",
        "        uniqueName: 'licht',",
        "        heading: 'Licht',",
        '        items: [],',
        "        prev: 'main',",
        '    };',
        '    const sub1: PageType = {',
        "        type: 'cardEntities',",
        "        uniqueName: 'sub1',",
        "        heading: 'Sub',",
        '        items: [],',
        "        parent: 'licht',",
        '    };',
        '    const config: ScriptConfig.Config = {',
        `        panelTopic: '${topic}',`,
        "        weatherEntity: '',",
        '        pages: [main, licht],',
        '        subPages: [sub1],',
        '        favoritScreensaverEntity: [',
        "            { type: 'script', ScreensaverEntity: '0_userdata.0.temp', ScreensaverEntityText: 'Temp' },",
        '        ],',
        '        alternateScreensaverEntity: [],',
        '        leftScreensaverEntity: [],',
        '        bottomScreensaverEntity: [],',
        '        indicatorScreensaverEntity: [],',
        "        buttonLeft: { mode: 'page', page: 'licht' },",
        '        buttonRight: null,',
        '    };',
        `    await sendToAsync('${namespace}', 'ScriptConfig', { ...config, version: '0.21.6', scriptName });`,
        '}',
        'void configuration();',
        '',
    ].join('\n');
}

/**
 * A script object.
 *
 * @param id Id of the object.
 * @param name Name of the script.
 * @param enabled Whether it runs.
 */
function scriptObject(id: string, name: string, enabled = true): ioBroker.ScriptObject {
    return {
        _id: id,
        type: 'script',
        common: {
            name,
            engineType: 'TypeScript/ts',
            engine: 'system.adapter.javascript.0',
            source: scriptSource(),
            debug: false,
            verbose: false,
            enabled,
        },
        native: {},
    };
}

/* ---------------------------------------------------------------------------------------------
 * fake adapter
 * ------------------------------------------------------------------------------------------- */

type LogEntry = [level: string, text: string];
type Write = { op: 'set' | 'extend' | 'del' | 'respond' | 'delay'; id: string };

type FakeWorld = {
    objects: Record<string, ioBroker.Object>;
    logs: LogEntry[];
    /** every write and the answer in the order they happened */
    trace: Write[];
    answers: ConvertScriptAnswer[];
    adapter: ReturnType<typeof fakeAdapter>;
};

/**
 * Adapter stub with the fake object database - serves the runner and the real ConfigManager.
 *
 * @param objects Object database.
 * @param logs Receives the log output.
 * @param trace Receives the writes.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function fakeAdapter(objects: Record<string, ioBroker.Object>, logs: LogEntry[], trace: Write[]) {
    const noop = (): void => undefined;
    const log =
        (level: string) =>
        (text: string): number =>
            logs.push([level, text]);
    return {
        namespace,
        language: 'de',
        unload: false,
        library: { getLocalLanguage: (): string => 'de' },
        log: { silly: noop, debug: log('debug'), info: log('info'), warn: log('warn'), error: log('error') },
        config: {
            panels: [{ topic, name: panelName }],
            pageConfig: [],
            screensaverConfig: [],
            screensaverNotify: [],
            adminOverridesScriptPages: false,
            testCase: false,
        },
        setInterval: (): number => 1,
        clearInterval: noop,
        setTimeout: (): number => 1,
        clearTimeout: noop,
        getForeignObjectAsync: async (id: string): Promise<ioBroker.Object | null> =>
            objects[id] ? structuredClone(objects[id]) : null,
        getForeignObjectsAsync: async (): Promise<Record<string, ioBroker.Object>> => structuredClone(objects),
        getEnumsAsync: async (): Promise<Record<string, Record<string, never>>> => ({
            'enum.rooms': {},
            'enum.functions': {},
        }),
        getForeignStateAsync: async (): Promise<null> => null,
        getForeignStatesAsync: async (): Promise<Record<string, never>> => ({}),
        getStateAsync: async (): Promise<null> => null,
        getObjectViewAsync: async (
            _design: string,
            search: string,
            params: { startkey?: string; endkey?: string },
        ): Promise<{ rows: { id: string; value: ioBroker.Object }[] }> => {
            const start = params?.startkey ?? '';
            const end = params?.endkey ?? '香';
            return {
                rows: Object.values(objects)
                    .filter(o => o.type === search && o._id >= start && o._id <= end)
                    .map(o => ({ id: o._id, value: structuredClone(o) })),
            };
        },
        setForeignObjectAsync: async (id: string, obj: ioBroker.Object): Promise<void> => {
            trace.push({ op: 'set', id });
            expect(obj._id, `_id of the object written as ${id}`).to.equal(id);
            objects[id] = structuredClone(obj);
        },
        setForeignObject: async (id: string, obj: ioBroker.Object): Promise<void> => {
            trace.push({ op: 'set', id });
            expect(obj._id, `_id of the object written as ${id}`).to.equal(id);
            objects[id] = structuredClone(obj);
        },
        extendForeignObjectAsync: async (id: string, part: ioBroker.PartialObject): Promise<void> => {
            trace.push({ op: 'extend', id });
            const old = objects[id];
            if (!old) {
                throw new Error(`extend of missing object ${id}`);
            }
            // the controller deep-merges; the runner only sends common.source, a shallow merge of common is enough
            const copy = structuredClone(old);
            Object.assign(copy.common, part.common ?? {});
            objects[id] = copy;
        },
        delForeignObjectAsync: async (id: string): Promise<void> => {
            trace.push({ op: 'del', id });
            delete objects[id];
        },
        delay: async (): Promise<void> => {
            trace.push({ op: 'delay', id: '' });
        },
        setObjectNotExistsAsync: async (): Promise<void> => undefined,
        subscribeForeignStatesAsync: async (): Promise<void> => undefined,
        unsubscribeForeignStatesAsync: async (): Promise<void> => undefined,
    };
}

type WorldOptions = {
    /** raw configuration in the meta object; null = the script never sent one */
    raw?: ScriptConfig.Config | null;
    /** whether the script object exists */
    script?: boolean;
    /** number of existing backups `_1_backup` … `_n_backup` */
    backups?: number;
    pageConfig?: unknown[];
    screensaverConfig?: unknown[];
    /** button fields of the panel in the instance object */
    panelButtons?: Record<string, unknown>;
};

/**
 * A fresh object database: meta object with the raw configuration, instance object, script object and the
 * given backups.
 *
 * @param options What to put into the database.
 */
function world(options: WorldOptions = {}): FakeWorld {
    StatesControler.TempObjectDB = { data: undefined, keys: [], enums: undefined };
    StatesControler.tempObjectDBTimeout = undefined;
    const objects: Record<string, ioBroker.Object> = {};
    const raw = options.raw === undefined ? rawConfig() : options.raw;
    objects[namespace] = {
        _id: namespace,
        type: 'meta',
        common: { name: namespace, type: 'meta.user' },
        native: { scriptConfigRaw: raw ? [raw] : [], scriptConfig: [] },
    };
    const instance: ioBroker.InstanceObject = {
        _id: instanceId,
        type: 'instance',
        common: {
            name: 'nspanel-lovelace-ui',
            version: '1.0.0',
            installedVersion: '1.0.0',
            enabled: true,
            host: 'host',
            mode: 'daemon',
            materialize: true,
            platform: 'Javascript/Node.js',
        },
        native: {
            panels: [{ name: panelName, topic, id: 'x', ip: '1.2.3.4', model: 'eu', ...(options.panelButtons ?? {}) }],
            pageConfig: options.pageConfig ?? [],
            screensaverConfig: options.screensaverConfig ?? [],
            screensaverNotify: [],
            weatherEntity: '',
            mqttServer: true,
        },
        instanceObjects: [],
        objects: [],
    };
    objects[instanceId] = instance;
    if (options.script !== false) {
        objects[scriptId] = scriptObject(scriptId, scriptName);
    }
    for (let n = 1; n <= (options.backups ?? 0); n++) {
        objects[`${scriptId}_${n}_backup`] = scriptObject(
            `${scriptId}_${n}_backup`,
            `${scriptName} backup ${n}`,
            false,
        );
    }
    const logs: LogEntry[] = [];
    const trace: Write[] = [];
    const adapter = fakeAdapter(objects, logs, trace);
    return { objects, logs, trace, answers: [], adapter };
}

/**
 * Runs the command.
 *
 * @param w The world.
 * @param dryRun Dry run or execution.
 * @param options Runner options to override.
 */
async function run(
    w: FakeWorld,
    dryRun: boolean,
    options: Partial<ScriptToAdminRunnerOptions> = {},
): Promise<ConvertScriptAnswer> {
    const runner = new ScriptToAdminRunner({
        adapter: w.adapter,
        // the real config manager with the fake adapter - it stores the cleaned configuration in the meta object
        createConfigStore: () => new ConfigManager(w.adapter as never),
        now: () => new Date(2026, 9, 30, 12, 0, 0),
        ...options,
    });
    await runner.run({ panelTopic: topic, dryRun }, answer => {
        w.trace.push({ op: 'respond', id: '' });
        w.answers.push(answer);
    });
    expect(w.answers, 'exactly one answer').to.have.length(1);
    return w.answers[0];
}

/**
 * Narrows an answer to a result.
 *
 * @param answer The answer.
 */
function asResult(answer: ConvertScriptAnswer): ConvertScriptResult {
    expect(answer).to.have.property('executed');
    if (!('executed' in answer)) {
        throw new Error('no result');
    }
    return answer;
}

/**
 * Narrows an answer to a plan (not a result, not an error).
 *
 * @param answer The answer.
 */
function asPlan(answer: ConvertScriptAnswer): ConvertScriptPlan {
    expect(answer).to.not.have.property('executed');
    expect(answer).to.not.have.property('error');
    if (!('pages' in answer)) {
        throw new Error('no plan');
    }
    return answer;
}

/**
 * The script objects of the database (id → name, enabled).
 *
 * @param w The world.
 */
function scripts(w: FakeWorld): Record<string, { name: string; enabled: boolean }> {
    const out: Record<string, { name: string; enabled: boolean }> = {};
    for (const obj of Object.values(w.objects)) {
        if (obj.type === 'script') {
            out[obj._id] = { name: String(obj.common.name), enabled: obj.common.enabled };
        }
    }
    return out;
}

/**
 * The raw configuration of the panel stored in the meta object.
 *
 * @param w The world.
 */
function storedRaw(w: FakeWorld): ScriptConfig.Config | undefined {
    const list: unknown[] = w.objects[namespace].native.scriptConfigRaw;
    return list.find((r): r is ScriptConfig.Config => typeof r === 'object' && r !== null);
}

/**
 * The parked conversions in the meta object.
 *
 * @param w The world.
 */
function pending(w: FakeWorld): PendingScriptConversion[] {
    const list: unknown[] = w.objects[namespace].native.pendingScriptConversion ?? [];
    return list.filter((p): p is PendingScriptConversion => typeof p === 'object' && p !== null);
}

/* ---------------------------------------------------------------------------------------------
 * tests
 * ------------------------------------------------------------------------------------------- */

describe('lib/configuration - script-to-admin-runner', () => {
    it('formats the local date', () => {
        expect(localDate(new Date(2026, 0, 5, 23, 59))).to.equal('2026-01-05');
    });

    it('refuses a request without panelTopic', async () => {
        const w = world();
        const runner = new ScriptToAdminRunner({
            adapter: w.adapter,
            createConfigStore: () => new ConfigManager(w.adapter as never),
        });
        await runner.run({ dryRun: true }, answer => w.answers.push(answer));
        expect(w.answers[0]).to.deep.equal({ error: 'panelTopic is missing in the request' });
        expect(w.trace).to.deep.equal([]);
    });

    it('refuses an unknown panel', async () => {
        const w = world();
        const runner = new ScriptToAdminRunner({
            adapter: w.adapter,
            createConfigStore: () => new ConfigManager(w.adapter as never),
        });
        await runner.run({ panelTopic: 'nspanel/other', dryRun: true }, answer => w.answers.push(answer));
        expect(w.answers[0]).to.deep.equal({ error: 'Panel nspanel/other is not configured in the admin' });
    });

    it('refuses a panel marked "panel uses no script" without writing anything', async () => {
        const w = world();
        (w.adapter.config.panels[0] as { noScript?: boolean }).noScript = true;
        const answer = await run(w, false);
        expect(answer).to.have.property('errorKey', CONVERT_NO_SCRIPT_ERROR_KEY);
        expect(w.trace).to.deep.equal([{ op: 'respond', id: '' }]);
    });

    it('answers with an error when the script never sent its configuration', async () => {
        const w = world({ raw: null });
        expect(await run(w, true)).to.deep.equal({
            error: `The script of panel ${topic} has not sent its configuration yet - start the script once`,
        });
        expect(w.trace).to.deep.equal([{ op: 'respond', id: '' }]);
    });

    it('dry run: answers the plan, writes nothing and logs on debug only', async () => {
        const w = world();
        const plan = asPlan(await run(w, true));
        expect(plan.panelTopic).to.equal(topic);
        expect(plan.panelName).to.equal(panelName);
        expect(plan.scriptId).to.equal(scriptId);
        expect(plan.scriptFound).to.be.true;
        expect(plan.pages.map(p => [p.uniqueName, p.action])).to.deep.equal([
            ['main', 'create'],
            ['licht', 'create'],
            ['sub1', 'create'],
        ]);
        expect(plan.screensaver).to.include({ name: panelName, mode: 'standard', itemCount: 3, notifyCount: 0 });
        expect(plan.buttons).to.deep.equal({ left: { mode: 'page', page: 'licht' } });
        expect(plan.nothingToDo).to.be.false;
        expect(w.trace).to.deep.equal([{ op: 'respond', id: '' }]);
        expect(w.logs.filter(l => l[0] !== 'debug')).to.deep.equal([]);
        expect(w.logs.map(l => l[1]).some(t => t.includes("Page 'licht' (cardGrid, 0 items): converted"))).to.be.true;
    });

    it('dry run: reports the missing script', async () => {
        const w = world({ script: false });
        const plan = asPlan(await run(w, true));
        expect(plan.scriptFound).to.be.false;
        expect(plan.pages).to.have.length(3);
    });

    describe('execution', () => {
        it('backs up the script, rewrites it, cleans the meta object and fills the instance object', async () => {
            const w = world();
            const result = asResult(await run(w, false));

            // the answer
            expect(result.error).to.equal(undefined);
            expect(result.executed).to.be.true;
            expect(result.backupId).to.equal(`${scriptId}_1_backup`);
            expect(result.deletedBackups).to.deep.equal([]);
            expect(result.renamedBackups).to.deep.equal([]);
            expect(result.scriptRewritten).to.be.true;
            expect(result.scriptNotes).to.deep.equal([]);
            expect(result.panelReloaded).to.be.false;
            expect(result.adapterRestarts).to.be.true;

            // order: park the admin part, backup, script, meta object, answer, delay, unpark, instance object
            const ops = w.trace.map(t => `${t.op}:${t.id}`);
            expect(ops).to.deep.equal([
                `set:${namespace}`,
                `set:${scriptId}_1_backup`,
                `extend:${scriptId}`,
                `set:${namespace}`,
                'respond:',
                'delay:',
                `set:${namespace}`,
                `set:${instanceId}`,
            ]);
            expect(pending(w), 'nothing parked after the success').to.deep.equal([]);

            // the backup is a disabled copy with the original source
            const backup = w.objects[`${scriptId}_1_backup`];
            expect(backup.type).to.equal('script');
            expect(backup.common).to.include({
                name: 'Test backup 1',
                enabled: false,
                engineType: 'TypeScript/ts',
                engine: 'system.adapter.javascript.0',
                source: scriptSource(),
            });

            // the script: rewritten source, everything else kept
            const script = w.objects[scriptId];
            expect(script.common.enabled).to.be.true;
            expect(script.common.engineType).to.equal('TypeScript/ts');
            const source = String(script.common.source);
            expect(source).to.not.equal(scriptSource());
            const summary = scanScriptConfig(source);
            expect(summary.found).to.be.true;
            expect(summary.pages).to.deep.equal([]);
            expect(summary.subPages).to.deep.equal([]);
            expect(source).to.include(`NSPanel: converted to the admin page configuration on ${today}`);
            expect(source).to.include(`NSPanel: moved to the admin screensaver on ${today}`);
            expect(source).to.include(`NSPanel: moved to the admin panel configuration on ${today}`);
            expect(source).to.match(/buttonLeft:\s*null/);
            expect(source).to.match(/favoritScreensaverEntity:\s*\[\]/);
            expect(source).to.include('buttonRight: null');

            // the meta object: cleaned raw configuration and a fresh conversion
            const raw = storedRaw(w);
            expect(raw, 'raw stored').to.not.equal(undefined);
            expect(raw?.pages).to.deep.equal([]);
            expect(raw?.subPages).to.deep.equal([]);
            expect(raw?.favoritScreensaverEntity).to.deep.equal([]);
            expect(raw?.buttonLeft).to.equal(null);
            expect(raw?.scriptName).to.equal(scriptId);
            const converted: { topic?: string }[] = w.objects[namespace].native.scriptConfig;
            expect(converted.map(c => c.topic)).to.deep.equal([topic]);

            // the instance object: pages, screensaver, button
            const native = w.objects[instanceId].native;
            const pages: MenuEntry[] = native.pageConfig;
            expect(pages.map(p => [p.uniqueName, p.card])).to.deep.equal([
                ['main', 'cardGrid'],
                ['licht', 'cardGrid'],
                ['sub1', 'cardEntities'],
            ]);
            const screensavers: ScreensaverEntry[] = native.screensaverConfig;
            expect(screensavers).to.have.length(1);
            expect(screensavers[0].name).to.equal(panelName);
            expect(screensavers[0].panels).to.deep.equal([topic]);
            expect(native.screensaverNotify).to.deep.equal([]);
            expect(native.panels[0].buttonLeft).to.deep.equal({ mode: 'page', page: 'licht' });
            expect(native.panels[0]).to.not.have.property('buttonRight');
            // untouched fields of the instance survive
            expect(native.mqttServer).to.be.true;

            // loud logging
            const infos = w.logs.filter(l => l[0] === 'info').map(l => l[1]);
            expect(infos.some(t => t.includes("Page 'licht' (cardGrid, 0 items): converted to the admin page"))).to.be
                .true;
            expect(infos.some(t => t.startsWith("Screensaver 'Testpanel' (standard, 3 items"))).to.be.true;
            expect(infos.some(t => t.startsWith("Button left (page 'licht'): converted"))).to.be.true;
            expect(infos.some(t => t.includes(`backed up as '${scriptId}_1_backup'`))).to.be.true;
            expect(infos).to.include('Admin configuration written, the adapter restarts to apply it');
            expect(w.logs.filter(l => l[0] === 'error')).to.deep.equal([]);
        });

        it('a second run after the execution has nothing to do', async () => {
            const w = world();
            asResult(await run(w, false));
            w.answers.length = 0;
            w.trace.length = 0;
            const plan = asPlan(await run(w, true));
            expect(plan.nothingToDo).to.be.true;
            expect(plan.pages).to.deep.equal([]);
            expect(plan.screensaver).to.equal(undefined);
            expect(plan.buttons).to.deep.equal({});

            w.answers.length = 0;
            w.trace.length = 0;
            const result = asResult(await run(w, false));
            expect(result.executed).to.be.false;
            expect(result.nothingToDo).to.be.true;
            expect(w.trace).to.deep.equal([{ op: 'respond', id: '' }]);
        });

        it('rotates one existing backup', async () => {
            const w = world({ backups: 1 });
            const result = asResult(await run(w, false));
            expect(result.backupId).to.equal(`${scriptId}_1_backup`);
            expect(result.renamedBackups).to.deep.equal([{ from: `${scriptId}_1_backup`, to: `${scriptId}_2_backup` }]);
            expect(result.deletedBackups).to.deep.equal([]);
            expect(scripts(w)).to.deep.equal({
                [scriptId]: { name: scriptName, enabled: true },
                [`${scriptId}_1_backup`]: { name: 'Test backup 1', enabled: false },
                [`${scriptId}_2_backup`]: { name: 'Test backup 2', enabled: false },
            });
            const ops = w.trace.map(t => `${t.op}:${t.id}`);
            expect(ops.slice(1, 4)).to.deep.equal([
                `set:${scriptId}_2_backup`,
                `del:${scriptId}_1_backup`,
                `set:${scriptId}_1_backup`,
            ]);
        });

        it('rotates four existing backups and deletes the oldest', async () => {
            const w = world({ backups: 4 });
            const result = asResult(await run(w, false));
            expect(result.deletedBackups).to.deep.equal([`${scriptId}_4_backup`]);
            expect(result.renamedBackups).to.deep.equal([
                { from: `${scriptId}_3_backup`, to: `${scriptId}_4_backup` },
                { from: `${scriptId}_2_backup`, to: `${scriptId}_3_backup` },
                { from: `${scriptId}_1_backup`, to: `${scriptId}_2_backup` },
            ]);
            expect(scripts(w)).to.deep.equal({
                [scriptId]: { name: scriptName, enabled: true },
                [`${scriptId}_1_backup`]: { name: 'Test backup 1', enabled: false },
                [`${scriptId}_2_backup`]: { name: 'Test backup 2', enabled: false },
                [`${scriptId}_3_backup`]: { name: 'Test backup 3', enabled: false },
                [`${scriptId}_4_backup`]: { name: 'Test backup 4', enabled: false },
            });
            const ops = w.trace.map(t => `${t.op}:${t.id}`);
            expect(ops.slice(1, 9)).to.deep.equal([
                `del:${scriptId}_4_backup`,
                `set:${scriptId}_4_backup`,
                `del:${scriptId}_3_backup`,
                `set:${scriptId}_3_backup`,
                `del:${scriptId}_2_backup`,
                `set:${scriptId}_2_backup`,
                `del:${scriptId}_1_backup`,
                `set:${scriptId}_1_backup`,
            ]);
            // the backup that moved from 1 to 2 carries the source of the former backup 1
            expect(w.objects[`${scriptId}_1_backup`].common.source).to.equal(scriptSource());
        });

        it('a missing script: no backup, a note, the admin entries are still written', async () => {
            const w = world({ script: false });
            const result = asResult(await run(w, false));
            expect(result.executed).to.be.true;
            expect(result.scriptFound).to.be.false;
            expect(result.backupId).to.equal(undefined);
            expect(result.scriptRewritten).to.be.false;
            expect(result.scriptNotes).to.have.length(1);
            expect(result.scriptNotes[0]).to.include(`script object '${scriptId}' not found`);
            expect(result.error).to.equal(undefined);
            expect(scripts(w)).to.deep.equal({});
            expect(w.trace.map(t => `${t.op}:${t.id}`)).to.deep.equal([
                `set:${namespace}`,
                `set:${namespace}`,
                'respond:',
                'delay:',
                `set:${namespace}`,
                `set:${instanceId}`,
            ]);
            expect(w.objects[instanceId].native.pageConfig).to.have.length(3);
            expect(storedRaw(w)?.pages).to.deep.equal([]);
        });

        it('nothing to do: answers executed:false without any write', async () => {
            const w = world({ raw: emptyRawConfig() });
            const result = asResult(await run(w, false));
            expect(result.executed).to.be.false;
            expect(result.nothingToDo).to.be.true;
            expect(result.adapterRestarts).to.be.false;
            expect(w.trace).to.deep.equal([{ op: 'respond', id: '' }]);
            expect(w.objects[scriptId].common.source).to.equal(scriptSource());
        });

        it('skips the screensaver and the button when the admin already has them', async () => {
            const w = world({
                screensaverConfig: [{ name: 'Admin', card: 'screensaver', panels: [topic], items: [] }],
                panelButtons: { buttonLeft: null },
            });
            const plan = asPlan(await run(w, true));
            expect(plan.screensaver).to.equal(undefined);
            expect(plan.screensaverSkipped?.reason).to.equal('screensaverExists');
            expect(plan.buttons).to.deep.equal({});
            expect(plan.buttonsSkipped.map(b => [b.side, b.reason])).to.deep.equal([['left', 'buttonConfigured']]);
            expect(plan.pages).to.have.length(3);
            const warns = w.logs.filter(l => l[0] === 'warn');
            expect(warns, 'dry run logs on debug only').to.deep.equal([]);
        });

        it('reports a rejected configuration in the result and writes the admin entries anyway', async () => {
            const store: ScriptConfigStore = {
                setScriptConfig: async () => ({ messages: ['Abort: test'], panelConfig: undefined }),
                delete: async () => undefined,
            };
            const w = world();
            const result = asResult(await run(w, false, { createConfigStore: () => store }));
            expect(result.executed).to.be.true;
            expect(result.error).to.include('rejected by the config manager: Abort: test');
            expect(result.backupId).to.equal(`${scriptId}_1_backup`);
            expect(w.objects[instanceId].native.pageConfig).to.have.length(3);
            expect(w.logs.filter(l => l[0] === 'error').map(l => l[1])[0]).to.include('rejected by the config manager');
        });

        it('a failing backup write answers with the error and does not touch the admin tables', async () => {
            const w = world();
            const original = w.adapter.setForeignObjectAsync;
            w.adapter.setForeignObjectAsync = async (id: string, obj: ioBroker.Object): Promise<void> => {
                if (id.endsWith('_backup')) {
                    throw new Error('disk full');
                }
                await original(id, obj);
            };
            const result = asResult(await run(w, false));
            expect(result.error).to.include('disk full');
            expect(result.backupId).to.equal(undefined);
            expect(result.adapterRestarts).to.be.false;
            expect(w.objects[instanceId].native.pageConfig).to.deep.equal([]);
            expect(w.objects[scriptId].common.source).to.equal(scriptSource());
            // park, unpark again (the failing backup write changed nothing), answer
            expect(w.trace.map(t => t.op)).to.deep.equal(['set', 'set', 'respond']);
            expect(result.executed).to.be.false;
            expect(result.pendingApplyAtStart).to.be.false;
            expect(pending(w)).to.deep.equal([]);
        });

        it('keeps the enabled flag of a renamed backup, only the new backup is disabled', async () => {
            const w = world({ backups: 2 });
            w.objects[`${scriptId}_1_backup`].common.enabled = true;
            asResult(await run(w, false));
            expect(scripts(w)).to.deep.equal({
                [scriptId]: { name: scriptName, enabled: true },
                [`${scriptId}_1_backup`]: { name: 'Test backup 1', enabled: false },
                [`${scriptId}_2_backup`]: { name: 'Test backup 2', enabled: true },
                [`${scriptId}_3_backup`]: { name: 'Test backup 3', enabled: false },
            });
        });

        it('refuses a script that serves several panels', async () => {
            const w = world();
            const list: unknown[] = w.objects[namespace].native.scriptConfigRaw;
            list.push(rawConfig({ panelTopic: 'nspanel/other' }));
            for (const dryRun of [true, false]) {
                w.answers.length = 0;
                w.trace.length = 0;
                const answer = await run(w, dryRun);
                expect(answer).to.have.property('error');
                expect(answer).to.not.have.property('executed');
                if ('error' in answer) {
                    expect(answer.error).to.include(
                        `The script ${scriptId} serves several panels (${topic}, nspanel/other)`,
                    );
                }
                expect(w.trace).to.deep.equal([{ op: 'respond', id: '' }]);
            }
            expect(w.logs.filter(l => l[0] === 'warn').map(l => l[1])[0]).to.include('serves several panels');
        });

        it('a failing instance write leaves the admin part parked for the next adapter start', async () => {
            const w = world();
            const original = w.adapter.setForeignObjectAsync;
            w.adapter.setForeignObjectAsync = async (id: string, obj: ioBroker.Object): Promise<void> => {
                if (id === instanceId) {
                    throw new Error('db gone');
                }
                await original(id, obj);
            };
            const result = asResult(await run(w, false));
            // the answer went out before the failure
            expect(result.error).to.equal(undefined);
            expect(result.adapterRestarts).to.be.true;
            const parked = pending(w);
            expect(parked).to.have.length(1);
            expect(parked[0].panelTopic).to.equal(topic);
            expect(parked[0].pages.map(p => p.uniqueName)).to.deep.equal(['main', 'licht', 'sub1']);
            expect(parked[0].screensaver?.name).to.equal(panelName);
            expect(parked[0].buttons).to.deep.equal({ left: { mode: 'page', page: 'licht' } });
            expect(parked[0].ts).to.equal(new Date(2026, 9, 30, 12, 0, 0).getTime());
            const errors = w.logs.filter(l => l[0] === 'error').map(l => l[1]);
            expect(errors.some(t => t.includes('db gone'))).to.be.true;
            expect(errors.some(t => t.includes('applied at the next adapter start'))).to.be.true;
            expect(w.objects[instanceId].native.pageConfig).to.deep.equal([]);
        });

        it('a failing meta write after the script rewrite answers with the error and keeps the parked part', async () => {
            const store: ScriptConfigStore = {
                setScriptConfig: async () => {
                    throw new Error('config manager down');
                },
                delete: async () => undefined,
            };
            const w = world();
            const result = asResult(await run(w, false, { createConfigStore: () => store }));
            expect(result.executed).to.be.true;
            expect(result.error).to.include('config manager down');
            expect(result.pendingApplyAtStart).to.be.true;
            expect(result.backupId).to.equal(`${scriptId}_1_backup`);
            expect(result.scriptRewritten).to.be.true;
            expect(pending(w).map(p => p.panelTopic)).to.deep.equal([topic]);
            expect(w.objects[instanceId].native.pageConfig).to.deep.equal([]);
            expect(w.logs.filter(l => l[0] === 'error').some(l => l[1].includes('applied at the next adapter start')))
                .to.be.true;
        });
    });

    describe('pages of the global script', () => {
        const globalScriptId = 'script.js.global';
        const globalRaw: ScriptConfig.globalPagesConfig = {
            version: '0.21.6',
            type: 'globalConfig',
            subPages: [
                page({ type: 'cardGrid', uniqueName: 'g1', heading: 'G1', items: [] }),
                page({ type: 'cardGrid', uniqueName: 'g2', heading: 'G2', items: [] }),
            ],
        };
        const existingG2: MenuEntry = {
            card: 'cardGrid',
            uniqueName: 'g2',
            headline: 'Admin G2',
            pageItems: [],
            hidden: false,
            alwaysOn: 'none',
            navigationAssignment: [{ topic: 'nspanel/other', navigation: { home: 'main' } }],
        };

        /** a world whose panel script links g1 of the global script, g2 exists in the admin with other content */
        function globalWorld(): FakeWorld {
            const w = world({
                raw: rawConfig({
                    pages: [...rawConfig().pages, page({ globalLink: 'g1' })],
                }),
                pageConfig: [existingG2],
            });
            w.objects[namespace].native.globalConfigRaw = structuredClone(globalRaw);
            const script = w.objects[scriptId];
            script.common.source = String(script.common.source).replace(
                'pages: [main, licht],',
                "pages: [main, licht, { globalLink: 'g1' }],",
            );
            w.objects[globalScriptId] = {
                ...scriptObject(globalScriptId, 'Global'),
                common: { ...scriptObject(globalScriptId, 'Global').common, source: '// the global script' },
            };
            return w;
        }

        /**
         * Runs the command with a message of its own.
         *
         * @param w The world.
         * @param message The message of the sendTo.
         */
        async function send(w: FakeWorld, message: Record<string, unknown>): Promise<ConvertScriptAnswer> {
            const runner = new ScriptToAdminRunner({
                adapter: w.adapter,
                createConfigStore: () => new ConfigManager(w.adapter as never),
                now: () => new Date(2026, 9, 30, 12, 0, 0),
            });
            await runner.run({ panelTopic: topic, ...message }, answer => w.answers.push(answer));
            expect(w.answers, 'exactly one answer').to.have.length(1);
            return w.answers[0];
        }

        it('dry run: plans the global pages from globalConfigRaw, the conflict with the default decision', async () => {
            const w = globalWorld();
            const plan = asPlan(await send(w, { dryRun: true, globalDecisions: { g2: 'bogus' } }));
            expect(plan.pages.map(p => [p.uniqueName, p.action, p.global === true])).to.deep.equal([
                ['main', 'create', false],
                ['licht', 'create', false],
                ['g1', 'create', true],
                ['sub1', 'create', false],
                ['g2', 'assignNavigation', true],
            ]);
            expect(plan.conflicts?.map(c => [c.uniqueName, c.decision, c.assignedPanels])).to.deep.equal([
                ['g2', 'keepAdmin', ['nspanel/other']],
            ]);
        });

        it('execution: takes the decision, removes the link from the panel script, the global script stays', async () => {
            const w = globalWorld();
            const globalScriptBefore = structuredClone(w.objects[globalScriptId]);
            const result = asResult(await send(w, { dryRun: false, globalDecisions: { g2: 'takeScript' } }));
            expect(result.error).to.equal(undefined);
            expect(result.conflicts?.[0].decision).to.equal('takeScript');
            expect(result.scriptNotes).to.deep.equal([]);

            // the panel script lost the link, the global script object is untouched
            expect(String(w.objects[scriptId].common.source)).to.not.include('globalLink');
            expect(w.objects[globalScriptId]).to.deep.equal(globalScriptBefore);
            expect(w.objects[namespace].native.globalConfigRaw).to.deep.equal(globalRaw);
            expect(storedRaw(w)?.pages).to.deep.equal([]);

            const pages: MenuEntry[] = w.objects[instanceId].native.pageConfig;
            expect(pages.map(p => p.uniqueName)).to.deep.equal(['g2', 'main', 'licht', 'g1', 'sub1']);
            const g2 = pages[0];
            expect(g2.headline).to.equal('G2');
            expect(g2.navigationAssignment?.map(a => a.topic)).to.deep.equal(['nspanel/other', topic]);
        });
    });

    describe('applyPendingScriptConversions (adapter start)', () => {
        const logs: LogEntry[] = [];
        const log = {
            debug: (t: string): number => logs.push(['debug', t]),
            info: (t: string): number => logs.push(['info', t]),
            warn: (t: string): number => logs.push(['warn', t]),
            error: (t: string): number => logs.push(['error', t]),
        };

        /** a parked conversion as the runner writes it */
        async function parkedConversion(): Promise<PendingScriptConversion> {
            const w = world();
            w.adapter.setForeignObjectAsync = async (id: string, obj: ioBroker.Object): Promise<void> => {
                if (id === instanceId) {
                    throw new Error('db gone');
                }
                w.objects[id] = structuredClone(obj);
            };
            asResult(await run(w, false));
            return pending(w)[0];
        }

        it('adds everything to an empty instance', async () => {
            const parked = await parkedConversion();
            const native: Record<string, unknown> = {
                panels: [{ name: panelName, topic }],
                pageConfig: [],
                screensaverConfig: [],
                screensaverNotify: [],
            };
            expect(applyPendingScriptConversions(native, [parked], log)).to.be.true;
            const pages: MenuEntry[] = native.pageConfig as MenuEntry[];
            expect(pages.map(p => p.uniqueName)).to.deep.equal(['main', 'licht', 'sub1']);
            const screensavers: ScreensaverEntry[] = native.screensaverConfig as ScreensaverEntry[];
            expect(screensavers.map(s => s.panels)).to.deep.equal([[topic]]);
            const panels: { buttonLeft?: unknown; buttonRight?: unknown }[] = native.panels as [];
            expect(panels[0].buttonLeft).to.deep.equal({ mode: 'page', page: 'licht' });
            expect(panels[0]).to.not.have.property('buttonRight');
        });

        it('changes nothing when everything is already there', async () => {
            const parked = await parkedConversion();
            const native: Record<string, unknown> = {
                panels: [{ name: panelName, topic, buttonLeft: null }],
                pageConfig: structuredClone(parked.pages),
                screensaverConfig: [{ name: 'Admin', card: 'screensaver', panels: [topic], items: [] }],
                screensaverNotify: [],
            };
            const before = structuredClone(native);
            expect(applyPendingScriptConversions(native, [parked], log)).to.be.false;
            expect(native).to.deep.equal(before);
        });

        it('adds only the missing page and keeps an existing one', async () => {
            const parked = await parkedConversion();
            const existing = { ...structuredClone(parked.pages[1]), headline: 'mine' };
            const native: Record<string, unknown> = {
                panels: [],
                pageConfig: [existing],
                screensaverConfig: [{ name: 'Admin', card: 'screensaver', panels: [topic], items: [] }],
                screensaverNotify: [],
            };
            expect(applyPendingScriptConversions(native, [parked], log)).to.be.true;
            const pages: MenuEntry[] = native.pageConfig as MenuEntry[];
            expect(pages.map(p => [p.uniqueName, p.headline])).to.deep.equal([
                ['licht', 'mine'],
                ['main', 'Die Leere'],
                ['sub1', 'Sub'],
            ]);
        });
    });
});
