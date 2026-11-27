/**
 * Adapter side of the NSPanelTs import (sendTo `nspanelTsList` / `nspanelTsConvert`): finds the old scripts in
 * the object database and writes the converted script as new, disabled script object. The old script is only
 * read, an existing script is never overwritten, nothing is started or stopped.
 */
import { convertNsPanelTs, inspectNsPanelTs } from './nspanelts-import';
import type { NsPanelTsConvertAnswer, NsPanelTsConvertRequest, NsPanelTsScriptInfo } from './nspanelts-import-types';
import { localDate } from './script-to-admin-runner';

export type { NsPanelTsConvertAnswer, NsPanelTsConvertRequest, NsPanelTsScriptInfo } from './nspanelts-import-types';

/** the part of the adapter the import works with (`NspanelLovelaceUi` satisfies it) */
export interface NsPanelTsImportAdapter {
    readonly namespace: string;
    readonly log: { info(message: string): void; warn(message: string): void; error(message: string): void };
    getForeignObjectAsync(id: string): Promise<ioBroker.Object | null | undefined>;
    setForeignObjectAsync(id: string, obj: ioBroker.Object): Promise<unknown>;
    extendForeignObjectAsync(id: string, objPart: ioBroker.PartialObject): Promise<unknown>;
    getObjectViewAsync(
        design: 'system',
        search: 'script',
        params: { startkey: string; endkey: string },
    ): Promise<{ rows: readonly { id: string; value?: unknown }[] } | null | undefined>;
}

export type NsPanelTsImportOptions = {
    adapter: NsPanelTsImportAdapter;
    /** folder of the configuration scripts of this instance */
    folder: string;
    /** id of a configuration script for a name (cleaned like the other configuration scripts) */
    scriptIdFor: (name: string) => string;
    /** source of `script/example_sendTo_script_iobroker.ts` */
    template: string;
    /** end token of the configuration part of the template */
    endToken: string;
    /** names of the panels the import may write for (NSPanels of the instance, no web panels) */
    panelNames: readonly string[];
    now?: () => Date;
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isScriptObject(v: unknown): v is ioBroker.ScriptObject {
    return isRecord(v) && v.type === 'script' && isRecord(v.common);
}

/**
 * checks the message of `nspanelTsConvert`
 *
 * @param v the message
 * @returns true for a valid request
 */
export function isNsPanelTsConvertRequest(v: unknown): v is NsPanelTsConvertRequest {
    return (
        isRecord(v) && typeof v.scriptId === 'string' && typeof v.panelName === 'string' && typeof v.topic === 'string'
    );
}

function nameOf(obj: ioBroker.ScriptObject): string {
    const n: unknown = obj.common.name;
    if (typeof n === 'string') {
        return n;
    }
    if (isRecord(n)) {
        const first = n.en ?? n.de ?? Object.values(n)[0];
        if (typeof first === 'string') {
            return first;
        }
    }
    return obj._id.split('.').pop() ?? obj._id;
}

export class NsPanelTsImport {
    constructor(private readonly o: NsPanelTsImportOptions) {}

    /**
     * All scripts of the javascript adapter that are old NSPanelTs scripts.
     *
     * @returns the scripts with version, topic and whether they can be converted
     */
    async list(): Promise<NsPanelTsScriptInfo[]> {
        const view = await this.o.adapter.getObjectViewAsync('system', 'script', {
            startkey: 'script.js.',
            endkey: 'script.js.香',
        });
        const out: NsPanelTsScriptInfo[] = [];
        for (const row of view?.rows ?? []) {
            const obj = row.value;
            if (
                !isScriptObject(obj) ||
                typeof obj.common.source !== 'string' ||
                row.id.startsWith(`${this.o.folder}.`)
            ) {
                continue;
            }
            const info = inspectNsPanelTs(obj.common.source);
            if (!info.isNsPanelTs) {
                continue;
            }
            out.push({
                id: row.id,
                name: nameOf(obj),
                enabled: obj.common.enabled === true,
                supported: info.supported,
                ...(info.version ? { version: info.version } : {}),
                ...(info.topic ? { topic: info.topic } : {}),
                ...(info.reason ? { reason: info.reason } : {}),
            });
        }
        return out.sort((a, b) => a.id.localeCompare(b.id));
    }

    /**
     * A free id for the new script: the panel name, else `<panel>_NSPanelTs`, `<panel>_NSPanelTs_2`, …
     *
     * @param panelName name of the target panel
     * @returns id and name of the new script
     */
    private async freeId(panelName: string): Promise<{ id: string; name: string }> {
        for (let i = 0; i < 100; i++) {
            const name = i === 0 ? panelName : i === 1 ? `${panelName}_NSPanelTs` : `${panelName}_NSPanelTs_${i}`;
            const id = this.o.scriptIdFor(name);
            if (!(await this.o.adapter.getForeignObjectAsync(id))) {
                return { id, name };
            }
        }
        throw new Error(`no free script id for ${panelName}`);
    }

    /**
     * Converts the old script and writes the result as new, disabled script.
     *
     * @param req script, target panel and topic
     * @returns the result for the dialog
     */
    async convert(req: NsPanelTsConvertRequest): Promise<NsPanelTsConvertAnswer> {
        const { adapter } = this.o;
        const topic = req.topic.trim();
        if (!this.o.panelNames.includes(req.panelName)) {
            return { error: `Panel ${req.panelName} not found`, errorKey: 'nspanelTsImport_errorPanel' };
        }
        if (!topic) {
            return { error: 'No topic given', errorKey: 'nspanelTsImport_errorTopic' };
        }
        const old = await adapter.getForeignObjectAsync(req.scriptId);
        if (!isScriptObject(old) || typeof old.common.source !== 'string' || !req.scriptId.startsWith('script.js.')) {
            return { error: `Script ${req.scriptId} not found`, errorKey: 'nspanelTsImport_errorScript' };
        }
        const result = convertNsPanelTs({
            source: old.common.source,
            template: this.o.template,
            endToken: this.o.endToken,
            panelTopic: topic,
            namespace: adapter.namespace,
            sourceScriptId: req.scriptId,
            today: localDate(this.o.now ? this.o.now() : new Date()),
        });
        if (!result.scriptSource) {
            const error = result.errors.join('; ') || 'conversion failed';
            adapter.log.warn(`NSPanelTs import of ${req.scriptId}: ${error}`);
            return { error };
        }
        await adapter.extendForeignObjectAsync(this.o.folder, {
            type: 'channel',
            common: { name: adapter.namespace, expert: true },
            native: {},
        });
        const target = await this.freeId(req.panelName);
        const engine =
            typeof old.common.engine === 'string' && old.common.engine
                ? old.common.engine
                : 'system.adapter.javascript.0';
        const script: ioBroker.ScriptObject = {
            _id: target.id,
            type: 'script',
            common: {
                name: target.name,
                engineType: 'TypeScript/ts',
                engine,
                source: result.scriptSource,
                debug: false,
                verbose: false,
                enabled: false,
            },
            native: {},
        };
        // last check right before writing: never overwrite
        if (await adapter.getForeignObjectAsync(target.id)) {
            return { error: `Script ${target.id} exists already`, errorKey: 'nspanelTsImport_errorExists' };
        }
        await adapter.setForeignObjectAsync(target.id, script);
        adapter.log.info(
            `NSPanelTs script ${req.scriptId} converted into ${target.id} (disabled): ${result.pages.length} pages, ${result.todos.length} TODOs, ${result.discarded.length} service pages dropped`,
        );
        return {
            scriptId: target.id,
            pages: result.pages,
            todoPages: result.todoPages,
            todos: result.todos.length,
            discarded: result.discarded,
            warnings: result.errors,
        };
    }
}
