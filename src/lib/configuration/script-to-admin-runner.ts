/**
 * Execution of the sendTo command `convertScriptToAdmin` (work package 3): reads the objects, lets the
 * planner ({@link planScriptToAdmin}) decide, and performs the writes in the order the js-controller
 * forces on us.
 *
 * Order of an execution (`dryRun: false`):
 *
 * 1. plan from freshly read objects (meta object `<namespace>` with `native.scriptConfigRaw`, instance object
 *    `system.adapter.<namespace>` with the admin tables),
 * 2. loud logging of the plan,
 * 3. nothing to do → answer without any write,
 * 4. script: backup rotation (`<scriptId>_1_backup` … `_4_backup`), then the source text is rewritten,
 * 5. meta object: the cleaned script configuration is stored through the config manager (the way the
 *    script itself would store it),
 * 6. the answer is sent, and only after a short pause the instance object is written - every change of
 *    the instance object makes the js-controller restart the adapter, so the answer has to be out first.
 *
 * The adapter is reached through the narrow {@link ScriptToAdminAdapter} interface so the runner can be
 * tested with an in-memory object database.
 */
import {
    ADMIN_BUTTON_MODES,
    findChartEntryForScript,
    findPowerEntryForScript,
    screensaverModes,
    type AdminButtonFunction,
    type ConvertPagePlan,
    type ConvertScriptPlan,
    type ConvertScriptRequest,
    type ConvertScriptResult,
    type ConvertSkipReason,
    type PageConfigEntry,
    type ScreensaverEntry,
    type ScreensaverMode,
    type ScreensaverNotifyConfig,
} from '../types/adminShareConfig';
import {
    backupName,
    clearButtonsInScript,
    clearScreensaverInScript,
    MAX_SCRIPT_BACKUPS,
    planScriptBackup,
    removePagesFromScript,
} from './script-source';
import { planScriptToAdmin, type ScriptToAdminPanel, type ScriptToAdminResult } from './script-to-admin';

/** the log of the adapter as far as the runner uses it */
export interface ScriptToAdminLog {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

/** a panel of `this.config.panels` as far as the runner needs it */
export type ScriptToAdminConfigPanel = {
    name: string;
    topic: string;
    buttonLeft?: AdminButtonFunction;
    buttonRight?: AdminButtonFunction;
};

/** the part of the adapter the runner works with (`NspanelLovelaceUi` satisfies it) */
export interface ScriptToAdminAdapter {
    readonly namespace: string;
    readonly log: ScriptToAdminLog;
    readonly config: { panels: readonly (ScriptToAdminConfigPanel | null | undefined)[] };
    getForeignObjectAsync(id: string): Promise<ioBroker.Object | null | undefined>;
    setForeignObjectAsync(id: string, obj: ioBroker.Object): Promise<unknown>;
    extendForeignObjectAsync(id: string, objPart: ioBroker.PartialObject): Promise<unknown>;
    delForeignObjectAsync(id: string): Promise<unknown>;
    getObjectViewAsync(
        design: 'system',
        search: 'script',
        params: { startkey: string; endkey: string },
    ): Promise<{ rows: readonly { id: string }[] } | null | undefined>;
    delay(ms: number): Promise<void>;
}

/** what the runner needs of the config manager: `new ConfigManager(adapter)` in the adapter */
export interface ScriptConfigStore {
    setScriptConfig(configuration: ScriptConfig.Config): Promise<{ messages: string[]; panelConfig: unknown }>;
    delete(): Promise<void>;
}

export type ScriptToAdminRunnerOptions = {
    adapter: ScriptToAdminAdapter;
    /** creates the config manager that stores the cleaned script configuration (one per run) */
    createConfigStore: () => ScriptConfigStore;
    /** screensaver version the running panel uses; undefined = let the planner derive it */
    screensaverMode?: (panelTopic: string) => ScreensaverMode | undefined;
    /** current time (tests) */
    now?: () => Date;
    /** pause between the answer and the write of the instance object in ms, default 500 */
    answerDelay?: number;
};

/** the answer of the command, as the admin dialog expects it */
export type ConvertScriptAnswer = { error: string } | ConvertScriptPlan | ConvertScriptResult;

const DEFAULT_ANSWER_DELAY = 500;

/**
 * Whether a value is a plain object (not null, not an array).
 *
 * @param value Any value.
 */
function isDict(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Whether an object of the object database is a script object.
 *
 * @param obj The object.
 */
function isScriptObject(obj: ioBroker.Object | null | undefined): obj is ioBroker.ScriptObject {
    return !!obj && obj.type === 'script' && isDict(obj.common);
}

/**
 * Whether a value is a hardware button action as the admin stores it (`null` = no action).
 *
 * @param value Value of `native.panels[i].buttonLeft/buttonRight`.
 */
function isAdminButton(value: unknown): value is AdminButtonFunction {
    if (value === null) {
        return true;
    }
    if (!isDict(value) || typeof value.mode !== 'string' || !ADMIN_BUTTON_MODES.some(m => m === value.mode)) {
        return false;
    }
    return value.mode === 'page' ? typeof value.page === 'string' : typeof value.state === 'string';
}

/**
 * The local date as `YYYY-MM-DD` (the marker comments in the script carry it).
 *
 * @param date The date.
 */
export function localDate(date: Date): string {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * The backup number of a backup id (`<scriptId>_<n>_backup`), 1 if it does not match.
 *
 * @param backupId Id of the backup object.
 */
function backupNumber(backupId: string): number {
    const match = /_(\d+)_backup$/.exec(backupId);
    return match ? Number(match[1]) : 1;
}

/**
 * The script object as a backup under another id: the complete copy (engine, source, debug, verbose,
 * native), only name, id and - when given - enabled differ. `from`/`user`/`ts` are left to the controller.
 *
 * @param script The script object.
 * @param id Id of the backup.
 * @param n Backup number (for the name).
 * @param enabled Whether the backup runs; missing = as the source object (a renamed backup keeps what the
 * user set, the new backup of the script is disabled)
 */
function backupCopy(script: ioBroker.ScriptObject, id: string, n: number, enabled?: boolean): ioBroker.ScriptObject {
    const copy = structuredClone(script);
    copy._id = id;
    delete copy.from;
    delete copy.user;
    delete copy.ts;
    const name = typeof copy.common.name === 'string' && copy.common.name !== '' ? copy.common.name : script._id;
    copy.common = { ...copy.common, name: backupName(name, n), enabled: enabled ?? copy.common.enabled === true };
    return copy;
}

/**
 * A readable description of a button action for the log.
 *
 * @param action The action.
 */
function describeButton(action: AdminButtonFunction): string {
    if (action === null) {
        return 'no action';
    }
    if (action.mode === 'page') {
        return `page '${action.page}'`;
    }
    return `${action.mode} ${action.state}`;
}

/**
 * The skip reason with its detail for the log.
 *
 * @param reason The reason.
 * @param detail The detail.
 */
function reasonText(reason: ConvertSkipReason, detail?: string): string {
    return detail ? `${reason} - ${detail}` : reason;
}

/**
 * The admin part of a conversion, parked in `native.pendingScriptConversion` of the meta object before the
 * first write and removed right before the instance object is written. Should the adapter die in between
 * (the instance write fails, the adapter is stopped in the pause after the answer), the converted content
 * is neither in the script nor in the admin - the adapter applies the parked part at its next start
 * ({@link applyPendingScriptConversions}).
 */
export type PendingScriptConversion = {
    panelTopic: string;
    /** when the conversion ran (ms) */
    ts: number;
    /** the complete page configuration after the conversion */
    pages: PageConfigEntry[];
    screensaver?: ScreensaverEntry;
    notify: ScreensaverNotifyConfig[];
    buttons: { left?: AdminButtonFunction; right?: AdminButtonFunction };
};

/**
 * Whether a value of `native.pendingScriptConversion` is a parked conversion.
 *
 * @param value The value.
 */
export function isPendingScriptConversion(value: unknown): value is PendingScriptConversion {
    return (
        isDict(value) &&
        typeof value.panelTopic === 'string' &&
        Array.isArray(value.pages) &&
        Array.isArray(value.notify) &&
        isDict(value.buttons)
    );
}

/**
 * Whether a page entry has a navigation assignment for the panel.
 *
 * @param entry The page entry.
 * @param panelTopic Topic of the panel.
 */
function hasNavigationFor(entry: PageConfigEntry, panelTopic: string): boolean {
    return (
        Array.isArray(entry.navigationAssignment) &&
        entry.navigationAssignment.some(a => isDict(a) && a.topic === panelTopic)
    );
}

/**
 * Applies parked conversions to the native part of the instance object (adapter start). Only what is
 * missing is added: pages whose uniqueName does not exist (an existing power/chart entry is replaced when
 * the parked one carries the navigation of the panel and the existing one does not), the screensaver when
 * no entry covers the panel, notifications by id, buttons only when the panel has none.
 *
 * @param native `native` of the instance object (changed in place).
 * @param pending The parked conversions.
 * @param log Log of the adapter.
 * @returns Whether `native` changed.
 */
export function applyPendingScriptConversions(
    native: Record<string, unknown>,
    pending: readonly PendingScriptConversion[],
    log: ScriptToAdminLog,
): boolean {
    let changed = false;
    const pages: PageConfigEntry[] = Array.isArray(native.pageConfig) ? native.pageConfig : [];
    const screensavers: ScreensaverEntry[] = Array.isArray(native.screensaverConfig) ? native.screensaverConfig : [];
    const notify: ScreensaverNotifyConfig[] = Array.isArray(native.screensaverNotify) ? native.screensaverNotify : [];
    const panels: unknown[] = Array.isArray(native.panels) ? native.panels : [];
    for (const item of pending) {
        const topic = item.panelTopic;
        let added = 0;
        for (const entry of item.pages) {
            if (!isDict(entry) || typeof entry.uniqueName !== 'string') {
                continue;
            }
            const index = pages.findIndex(p => isDict(p) && p.uniqueName === entry.uniqueName);
            if (index === -1) {
                pages.push(entry);
                added++;
            } else if (hasNavigationFor(entry, topic) && !hasNavigationFor(pages[index], topic)) {
                pages[index] = entry;
                added++;
            }
        }
        if (added > 0) {
            native.pageConfig = pages;
            changed = true;
            log.info(
                `Panel ${topic}: ${added} page(s) of the parked script conversion added to the page configuration`,
            );
        }
        if (
            item.screensaver &&
            !screensavers.some(e => isDict(e) && Array.isArray(e.panels) && e.panels.includes(topic))
        ) {
            screensavers.push(item.screensaver);
            native.screensaverConfig = screensavers;
            changed = true;
            log.info(`Panel ${topic}: screensaver of the parked script conversion added`);
        }
        const newNotify = item.notify.filter(n => isDict(n) && !notify.some(e => isDict(e) && e.id === n.id));
        if (newNotify.length > 0) {
            notify.push(...newNotify);
            native.screensaverNotify = notify;
            changed = true;
            log.info(`Panel ${topic}: ${newNotify.length} notification(s) of the parked script conversion added`);
        }
        const panel = panels.find((p): p is Record<string, unknown> => isDict(p) && p.topic === topic);
        if (panel) {
            for (const [side, key] of [
                ['left', 'buttonLeft'],
                ['right', 'buttonRight'],
            ] as const) {
                const action = item.buttons[side];
                if (action !== undefined && panel[key] === undefined) {
                    panel[key] = action;
                    changed = true;
                    log.info(`Panel ${topic}: button ${side} of the parked script conversion set`);
                }
            }
        }
    }
    return changed;
}

/** result of the plan step */
type Planned = {
    raw: ScriptConfig.Config;
    scriptId: string;
    /** the script object - undefined when it does not exist */
    script?: ioBroker.ScriptObject;
    result: ScriptToAdminResult;
};

/** the objects of the instance the planner reads */
type AdminTables = {
    pageConfig: PageConfigEntry[];
    screensaverConfig: ScreensaverEntry[];
    screensaverNotify: ScreensaverNotifyConfig[];
    weatherEntity?: string;
};

/**
 * Runs the sendTo command `convertScriptToAdmin` for one request.
 */
export class ScriptToAdminRunner {
    private readonly adapter: ScriptToAdminAdapter;
    private readonly options: ScriptToAdminRunnerOptions;

    constructor(options: ScriptToAdminRunnerOptions) {
        this.options = options;
        this.adapter = options.adapter;
    }

    private get log(): ScriptToAdminLog {
        return this.adapter.log;
    }

    private get instanceId(): string {
        return `system.adapter.${this.adapter.namespace}`;
    }

    /**
     * Handles one request. The answer is handed to `respond` exactly once; on an execution it is sent
     * before the instance object is written (that write restarts the adapter).
     *
     * @param message The message of the sendTo (validated here).
     * @param respond Sends the answer to the caller.
     */
    async run(message: unknown, respond: (answer: ConvertScriptAnswer) => void): Promise<void> {
        const request = this.parseRequest(message);
        if (typeof request === 'string') {
            respond({ error: request });
            return;
        }
        let planned: Planned;
        try {
            const outcome = await this.plan(request.panelTopic);
            if (typeof outcome === 'string') {
                respond({ error: outcome });
                return;
            }
            planned = outcome;
        } catch (e: unknown) {
            const text = `Planning the conversion of panel ${request.panelTopic} failed: ${errorText(e)}`;
            this.log.error(text);
            respond({ error: text });
            return;
        }
        const plan = planned.result.plan;
        this.logPlan(planned, request.dryRun);
        if (request.dryRun) {
            respond(plan);
            return;
        }
        const result: ConvertScriptResult = {
            ...plan,
            executed: false,
            deletedBackups: [],
            renamedBackups: [],
            scriptRewritten: false,
            scriptNotes: [],
            panelReloaded: false,
            adapterRestarts: false,
        };
        if (plan.nothingToDo) {
            this.log.info(`Panel '${plan.panelName}' (${plan.panelTopic}): nothing to convert, nothing written`);
            respond(result);
            return;
        }
        let responded = false;
        let parked = false;
        try {
            // 3b. park the admin part in the meta object: applied at the next start should anything below fail
            await this.writePending(planned);
            parked = true;
            // 4. script backup and rewrite
            if (planned.script) {
                await this.backupScript(planned.scriptId, planned.script, result);
                await this.rewriteScript(planned, result);
            } else {
                result.scriptNotes.push(
                    `script object '${planned.scriptId}' not found - no backup, the script source is left unchanged`,
                );
                this.log.warn(
                    `Script object '${planned.scriptId}' not found: no backup is made and the source is not rewritten - ` +
                        `remove the converted pages from the script yourself, otherwise they come back the next time it runs`,
                );
            }
            // 5. meta object
            result.executed = true;
            await this.storeCleanedRaw(planned, result);
            // 6. answer first, then the instance object
            result.adapterRestarts = true;
            responded = true;
            respond(result);
            await this.adapter.delay(this.options.answerDelay ?? DEFAULT_ANSWER_DELAY);
            // the parked part goes right before the instance write - and comes back should that write fail
            await this.removePending(plan.panelTopic);
            parked = false;
            try {
                await this.writeInstance(planned);
            } catch (e: unknown) {
                await this.writePending(planned);
                parked = true;
                throw e;
            }
        } catch (e: unknown) {
            const text = `Converting the script of panel ${plan.panelTopic} failed: ${errorText(e)}`;
            this.log.error(text);
            if (parked && !result.executed) {
                // nothing was changed yet - the parked part would only duplicate what the script still has
                try {
                    await this.removePending(plan.panelTopic);
                    parked = false;
                } catch (e2: unknown) {
                    this.log.warn(`The parked conversion could not be removed: ${errorText(e2)}`);
                }
            }
            const hint = parked
                ? `the admin entries are parked in the meta object and are applied at the next adapter start ` +
                  `(restart the adapter); the script is backed up as '${result.backupId ?? `${planned.scriptId}_1_backup`}'`
                : `nothing is parked - restore the script from its backup '${planned.scriptId}_1_backup' if it was rewritten`;
            if (responded) {
                this.log.error(`The admin entries could not be written - ${hint}`);
                return;
            }
            result.error = text;
            result.pendingApplyAtStart = parked;
            this.log.error(`Conversion aborted - ${hint}`);
            respond(result);
        }
    }

    /**
     * The parked conversion of this plan.
     *
     * @param planned The plan.
     */
    private pendingOf(planned: Planned): PendingScriptConversion {
        const plan = planned.result;
        const pending: PendingScriptConversion = {
            panelTopic: plan.plan.panelTopic,
            ts: (this.options.now ?? ((): Date => new Date()))().getTime(),
            pages: plan.updatedPages,
            notify: plan.newNotify,
            buttons: plan.buttons,
        };
        if (plan.screensaverEntry) {
            pending.screensaver = plan.screensaverEntry;
        }
        return pending;
    }

    /**
     * Parks the admin part of the conversion in `native.pendingScriptConversion` of the meta object
     * (one entry per panel; the meta object is no instance object, so no restart).
     *
     * @param planned The plan.
     */
    private async writePending(planned: Planned): Promise<void> {
        const meta = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
        if (!meta) {
            throw new Error(`meta object ${this.adapter.namespace} not found`);
        }
        const native: Record<string, unknown> = isDict(meta.native) ? meta.native : {};
        const list: unknown[] = Array.isArray(native.pendingScriptConversion) ? native.pendingScriptConversion : [];
        const topic = planned.result.plan.panelTopic;
        native.pendingScriptConversion = [
            ...list.filter(p => !isPendingScriptConversion(p) || p.panelTopic !== topic),
            this.pendingOf(planned),
        ];
        meta.native = native;
        await this.adapter.setForeignObjectAsync(this.adapter.namespace, meta);
    }

    /**
     * Removes the parked conversion of the panel from the meta object.
     *
     * @param panelTopic Topic of the panel.
     */
    private async removePending(panelTopic: string): Promise<void> {
        const meta = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
        if (!meta) {
            return;
        }
        const native: Record<string, unknown> = isDict(meta.native) ? meta.native : {};
        const list: unknown[] = Array.isArray(native.pendingScriptConversion) ? native.pendingScriptConversion : [];
        native.pendingScriptConversion = list.filter(p => !isPendingScriptConversion(p) || p.panelTopic !== panelTopic);
        meta.native = native;
        await this.adapter.setForeignObjectAsync(this.adapter.namespace, meta);
    }

    /**
     * Validates the message of the sendTo.
     *
     * @param message The message.
     * @returns The request or the error text.
     */
    private parseRequest(message: unknown): ConvertScriptRequest | string {
        if (!isDict(message) || typeof message.panelTopic !== 'string' || message.panelTopic === '') {
            return 'panelTopic is missing in the request';
        }
        // only an explicit false executes - a malformed request must not change anything
        return { panelTopic: message.panelTopic, dryRun: message.dryRun !== false };
    }

    /**
     * Reads the objects and runs the planner.
     *
     * @param panelTopic Topic of the panel.
     * @returns The plan or the error text.
     */
    private async plan(panelTopic: string): Promise<Planned | string> {
        const panel = this.adapter.config.panels.find(p => !!p && p.topic === panelTopic);
        if (!panel) {
            return `Panel ${panelTopic} is not configured in the admin`;
        }
        const meta = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
        const rawList: unknown[] = Array.isArray(meta?.native?.scriptConfigRaw) ? meta.native.scriptConfigRaw : [];
        const raw = rawList.find((r): r is ScriptConfig.Config => isDict(r) && r.panelTopic === panelTopic);
        if (!raw) {
            return `The script of panel ${panelTopic} has not sent its configuration yet - start the script once`;
        }
        const scriptId = typeof raw.scriptName === 'string' ? raw.scriptName : '';
        // a script with `panelTopic: [...]` stores one raw entry per panel under the same scriptName -
        // rewriting it for one panel would take the pages away from the others
        const shared = rawList
            .filter(
                (r): r is ScriptConfig.Config => isDict(r) && r.panelTopic !== panelTopic && r.scriptName === scriptId,
            )
            .map(r => String(r.panelTopic));
        if (scriptId && shared.length > 0) {
            const text =
                `The script ${scriptId} serves several panels (${[panelTopic, ...shared].join(', ')}) - ` +
                `converting one panel would break the others. Converting the panels one after another is not ` +
                `possible yet; split the script first (one script per panel)`;
            this.log.warn(text);
            return text;
        }
        const instance = await this.adapter.getForeignObjectAsync(this.instanceId);
        const tables = this.readAdminTables(instance);
        const scriptObj = scriptId ? await this.adapter.getForeignObjectAsync(scriptId) : undefined;
        const script = isScriptObject(scriptObj) ? scriptObj : undefined;
        const mode = this.options.screensaverMode?.(panelTopic);
        const panelInput: ScriptToAdminPanel = { name: panel.name, topic: panel.topic };
        // the buttons from the freshly read instance object (same as this.config.panels unless the
        // panel tile was just saved - then the controller restarts the adapter anyway)
        const stored = this.findInstancePanel(instance, panelTopic) ?? panel;
        if (stored.buttonLeft !== undefined) {
            panelInput.buttonLeft = stored.buttonLeft;
        }
        if (stored.buttonRight !== undefined) {
            panelInput.buttonRight = stored.buttonRight;
        }
        const result = planScriptToAdmin({
            raw: structuredClone(raw),
            panel: panelInput,
            pageConfig: tables.pageConfig,
            screensaverConfig: tables.screensaverConfig,
            screensaverNotify: tables.screensaverNotify,
            instanceWeatherEntity: tables.weatherEntity,
            screensaverMode: mode && screensaverModes.includes(mode) ? mode : undefined,
            scriptFound: !!script,
        });
        return { raw, scriptId, script, result };
    }

    /**
     * The button fields of the panel in the instance object (`native.panels[i]`); undefined when the panel
     * is not stored there. A stored value that is no valid action still counts as configured (`null`) -
     * the panel tile was used, `applyAdminButtons` reports it.
     *
     * @param instance The instance object.
     * @param panelTopic Topic of the panel.
     */
    private findInstancePanel(
        instance: ioBroker.Object | null | undefined,
        panelTopic: string,
    ): { buttonLeft?: AdminButtonFunction; buttonRight?: AdminButtonFunction } | undefined {
        const panels: unknown[] =
            isDict(instance?.native) && Array.isArray(instance.native.panels) ? instance.native.panels : [];
        const panel = panels.find((p): p is Record<string, unknown> => isDict(p) && p.topic === panelTopic);
        if (!panel) {
            return undefined;
        }
        const result: { buttonLeft?: AdminButtonFunction; buttonRight?: AdminButtonFunction } = {};
        for (const key of ['buttonLeft', 'buttonRight'] as const) {
            const value = panel[key];
            if (value === undefined) {
                continue;
            }
            if (isAdminButton(value)) {
                result[key] = value;
            } else {
                this.log.warn(`${key} of panel ${panelTopic} in the admin is no valid action - counts as configured`);
                result[key] = null;
            }
        }
        return result;
    }

    /**
     * The admin tables of the instance object.
     *
     * @param instance The instance object (`system.adapter.<namespace>`).
     */
    private readAdminTables(instance: ioBroker.Object | null | undefined): AdminTables {
        const native: Record<string, unknown> = isDict(instance?.native) ? instance.native : {};
        const list = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);
        return {
            pageConfig: list<PageConfigEntry>(native.pageConfig),
            screensaverConfig: list<ScreensaverEntry>(native.screensaverConfig),
            screensaverNotify: list<ScreensaverNotifyConfig>(native.screensaverNotify),
            weatherEntity: typeof native.weatherEntity === 'string' ? native.weatherEntity : undefined,
        };
    }

    /**
     * Logs the plan: `info`/`warn` on an execution, `debug` on a dry run.
     *
     * @param planned The plan.
     * @param dryRun Whether this is a dry run.
     */
    private logPlan(planned: Planned, dryRun: boolean): void {
        const plan = planned.result.plan;
        const info = (text: string): void => (dryRun ? this.log.debug(text) : this.log.info(text));
        const warn = (text: string): void => (dryRun ? this.log.debug(text) : this.log.warn(text));
        const head = `Script conversion of panel '${plan.panelName}' (${plan.panelTopic})${dryRun ? ' - dry run' : ''}`;
        info(`${head}: script ${plan.scriptId || '-'} ${plan.scriptFound ? 'found' : 'NOT found'}`);
        const counts = { create: 0, assignNavigation: 0, removeReference: 0 };
        for (const page of plan.pages) {
            counts[page.action]++;
            info(this.describePage(page, planned));
        }
        for (const skipped of plan.skipped) {
            warn(
                `Page '${skipped.uniqueName}' (${skipped.type}) skipped: ${reasonText(skipped.reason, skipped.detail)}`,
            );
        }
        if (plan.screensaver) {
            const s = plan.screensaver;
            info(
                `Screensaver '${s.name}' (${s.mode}, ${s.itemCount} items, ${s.notifyCount} notifications): ` +
                    `converted to the admin screensaver configuration`,
            );
        } else if (plan.screensaverSkipped) {
            const s = plan.screensaverSkipped;
            (s.reason === 'screensaverEmpty' ? info : warn)(`Screensaver skipped: ${reasonText(s.reason, s.detail)}`);
        }
        for (const side of ['left', 'right'] as const) {
            const action = plan.buttons[side];
            if (action !== undefined) {
                info(`Button ${side} (${describeButton(action)}): converted to the panel configuration`);
            }
        }
        for (const skipped of plan.buttonsSkipped) {
            warn(`Button ${skipped.side} skipped: ${reasonText(skipped.reason, skipped.detail)}`);
        }
        const buttonCount = (plan.buttons.left !== undefined ? 1 : 0) + (plan.buttons.right !== undefined ? 1 : 0);
        const tail = plan.nothingToDo ? ' - nothing to do' : '';
        info(
            `${head}: ${counts.create} page(s) converted, ${counts.assignNavigation} navigation(s) assigned, ` +
                `${counts.removeReference} dead reference(s) removed, ${plan.skipped.length} page(s) skipped, ` +
                `screensaver ${plan.screensaver ? 'converted' : 'not converted'}, ${buttonCount} button(s) converted${tail}`,
        );
    }

    /**
     * The log line of a page of the plan.
     *
     * @param page The page.
     * @param planned The plan (for the name of an existing admin entry).
     */
    private describePage(page: ConvertPagePlan, planned: Planned): string {
        const head = `Page '${page.uniqueName}' (${page.type}`;
        switch (page.action) {
            case 'create':
                return `${head}, ${page.itemCount} items): converted to the admin page configuration`;
            case 'assignNavigation': {
                const tables = planned.result.updatedPages;
                const entry =
                    page.card === 'cardPower'
                        ? findPowerEntryForScript(tables, page.uniqueName)
                        : findChartEntryForScript(tables, page.uniqueName);
                return `${head}): navigation assigned to the existing admin entry '${entry?.uniqueName ?? page.uniqueName}'`;
            }
            case 'removeReference':
                return `${head}): dead reference removed from the script (${page.reason ?? 'adminOnly'})`;
        }
    }

    /**
     * Rotates the backups of the script and stores the current script as `_1_backup`.
     *
     * @param scriptId Id of the script.
     * @param script The script object.
     * @param result Receives backupId, renamedBackups, deletedBackups.
     */
    private async backupScript(
        scriptId: string,
        script: ioBroker.ScriptObject,
        result: ConvertScriptResult,
    ): Promise<void> {
        const view = await this.adapter.getObjectViewAsync('system', 'script', {
            startkey: `${scriptId}_`,
            endkey: `${scriptId}_香`,
        });
        const plan = planScriptBackup(
            scriptId,
            (view?.rows ?? []).map(r => r.id),
        );
        // every successful write marks the result as executed - a later failure has to be reported honestly
        for (const id of plan.deletes) {
            await this.adapter.delForeignObjectAsync(id);
            result.executed = true;
            result.deletedBackups.push(id);
            this.log.info(`Script backup '${id}' deleted (only ${MAX_SCRIPT_BACKUPS} backups are kept)`);
        }
        for (const { from, to } of plan.renames) {
            const obj = await this.adapter.getForeignObjectAsync(from);
            if (!isScriptObject(obj)) {
                result.scriptNotes.push(`backup '${from}' is no script object - not renamed`);
                this.log.warn(`Script backup '${from}' is no script object - not renamed to '${to}'`);
                continue;
            }
            await this.adapter.setForeignObjectAsync(to, backupCopy(obj, to, backupNumber(to)));
            result.executed = true;
            await this.adapter.delForeignObjectAsync(from);
            result.renamedBackups.push({ from, to });
            this.log.info(`Script backup '${from}' renamed to '${to}'`);
        }
        await this.adapter.setForeignObjectAsync(plan.backupId, backupCopy(script, plan.backupId, 1, false));
        result.executed = true;
        result.backupId = plan.backupId;
        this.log.info(`Script '${scriptId}' backed up as '${plan.backupId}' (disabled)`);
    }

    /**
     * Rewrites the source of the script: converted pages removed, screensaver emptied, converted buttons
     * set to null. Writes only when something changed.
     *
     * @param planned The plan.
     * @param result Receives scriptRewritten and scriptNotes.
     */
    private async rewriteScript(planned: Planned, result: ConvertScriptResult): Promise<void> {
        const script = planned.script;
        if (!script) {
            return;
        }
        const original = typeof script.common.source === 'string' ? script.common.source : '';
        if (original === '') {
            result.scriptNotes.push('the script has no source text - nothing rewritten');
            this.log.warn(`Script '${planned.scriptId}' has no source text - nothing rewritten`);
            return;
        }
        const today = localDate((this.options.now ?? ((): Date => new Date()))());
        const plan = planned.result;
        let source = original;
        if (plan.removedFromScript.length > 0) {
            const r = removePagesFromScript(source, plan.removedFromScript, today);
            source = r.source;
            result.scriptNotes.push(...r.notes);
        }
        if (plan.clearScreensaverInScript) {
            const r = clearScreensaverInScript(source, today);
            source = r.source;
            result.scriptNotes.push(...r.notes);
        }
        if (plan.clearButtonsInScript.length > 0) {
            const r = clearButtonsInScript(source, plan.clearButtonsInScript, today);
            source = r.source;
            result.scriptNotes.push(...r.notes);
        }
        for (const note of result.scriptNotes) {
            this.log.warn(`Script '${planned.scriptId}': ${note}`);
        }
        if (source === original) {
            this.log.info(`Script '${planned.scriptId}': source unchanged`);
            return;
        }
        await this.adapter.extendForeignObjectAsync(planned.scriptId, { common: { source } });
        result.scriptRewritten = true;
        this.log.info(
            `Script '${planned.scriptId}': source rewritten (the javascript adapter restarts it, it sends the ` +
                `reduced configuration)`,
        );
    }

    /**
     * Stores the cleaned script configuration in the meta object through the config manager (replaces
     * `scriptConfigRaw` and `scriptConfig` of the panel, validates it).
     *
     * @param planned The plan.
     * @param result Receives the error when the config manager rejects the configuration.
     */
    private async storeCleanedRaw(planned: Planned, result: ConvertScriptResult): Promise<void> {
        const store = this.options.createConfigStore();
        try {
            const r = await store.setScriptConfig(structuredClone(planned.result.cleanedRaw));
            for (const message of r.messages) {
                this.log.debug(`Config manager: ${message}`);
            }
            if (r.panelConfig) {
                this.log.info(
                    `Stored script configuration of panel ${planned.result.plan.panelTopic} cleaned ` +
                        `(converted pages, screensaver and buttons removed)`,
                );
                return;
            }
            const text = `The cleaned script configuration was rejected by the config manager: ${r.messages.join(' | ')}`;
            result.error = text;
            this.log.error(text);
            this.log.warn(
                `The admin entries are written anyway - they are the valuable part; the stored script configuration ` +
                    `is refreshed the next time the script sends it`,
            );
        } finally {
            await store.delete();
        }
    }

    /**
     * Writes the admin entries into the instance object - the js-controller restarts the adapter afterwards.
     * `setForeignObject` with the freshly read object: `extendForeignObject` merges arrays element by element
     * and would keep removed entries.
     *
     * @param planned The plan.
     */
    private async writeInstance(planned: Planned): Promise<void> {
        const plan = planned.result;
        const instance = await this.adapter.getForeignObjectAsync(this.instanceId);
        if (!instance) {
            throw new Error(`instance object ${this.instanceId} not found`);
        }
        const tables = this.readAdminTables(instance);
        const native: Record<string, unknown> = isDict(instance.native) ? instance.native : {};
        native.pageConfig = plan.updatedPages;
        if (plan.screensaverEntry) {
            native.screensaverConfig = [...tables.screensaverConfig, plan.screensaverEntry];
        }
        if (plan.newNotify.length > 0) {
            native.screensaverNotify = [...tables.screensaverNotify, ...plan.newNotify];
        }
        if (plan.buttons.left !== undefined || plan.buttons.right !== undefined) {
            const panels: unknown[] = Array.isArray(native.panels) ? native.panels : [];
            const panel = panels.find(
                (p): p is Record<string, unknown> => isDict(p) && p.topic === plan.plan.panelTopic,
            );
            if (panel) {
                if (plan.buttons.left !== undefined) {
                    panel.buttonLeft = plan.buttons.left;
                }
                if (plan.buttons.right !== undefined) {
                    panel.buttonRight = plan.buttons.right;
                }
            } else {
                this.log.warn(`Panel ${plan.plan.panelTopic} not found in the instance object - buttons not written`);
            }
        }
        instance.native = native;
        this.log.info('Admin configuration written, the adapter restarts to apply it');
        await this.adapter.setForeignObjectAsync(this.instanceId, instance);
    }
}

/**
 * The message of an error.
 *
 * @param e The thrown value.
 */
function errorText(e: unknown): string {
    return e instanceof Error ? e.message : String(e);
}
