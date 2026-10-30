"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var script_to_admin_runner_exports = {};
__export(script_to_admin_runner_exports, {
  ScriptToAdminRunner: () => ScriptToAdminRunner,
  applyPendingScriptConversions: () => applyPendingScriptConversions,
  isPendingScriptConversion: () => isPendingScriptConversion,
  localDate: () => localDate
});
module.exports = __toCommonJS(script_to_admin_runner_exports);
var import_adminShareConfig = require("../types/adminShareConfig");
var import_script_source = require("./script-source");
var import_script_to_admin = require("./script-to-admin");
const DEFAULT_ANSWER_DELAY = 500;
function isDict(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isScriptObject(obj) {
  return !!obj && obj.type === "script" && isDict(obj.common);
}
function isAdminButton(value) {
  if (value === null) {
    return true;
  }
  if (!isDict(value) || typeof value.mode !== "string" || !import_adminShareConfig.ADMIN_BUTTON_MODES.some((m) => m === value.mode)) {
    return false;
  }
  return value.mode === "page" ? typeof value.page === "string" : typeof value.state === "string";
}
function localDate(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function backupNumber(backupId) {
  const match = /_(\d+)_backup$/.exec(backupId);
  return match ? Number(match[1]) : 1;
}
function backupCopy(script, id, n, enabled) {
  const copy = structuredClone(script);
  copy._id = id;
  delete copy.from;
  delete copy.user;
  delete copy.ts;
  const name = typeof copy.common.name === "string" && copy.common.name !== "" ? copy.common.name : script._id;
  copy.common = { ...copy.common, name: (0, import_script_source.backupName)(name, n), enabled: enabled != null ? enabled : copy.common.enabled === true };
  return copy;
}
function describeButton(action) {
  if (action === null) {
    return "no action";
  }
  if (action.mode === "page") {
    return `page '${action.page}'`;
  }
  return `${action.mode} ${action.state}`;
}
function reasonText(reason, detail) {
  return detail ? `${reason} - ${detail}` : reason;
}
function isPendingScriptConversion(value) {
  return isDict(value) && typeof value.panelTopic === "string" && Array.isArray(value.pages) && Array.isArray(value.notify) && isDict(value.buttons);
}
function hasNavigationFor(entry, panelTopic) {
  return Array.isArray(entry.navigationAssignment) && entry.navigationAssignment.some((a) => isDict(a) && a.topic === panelTopic);
}
function applyPendingScriptConversions(native, pending, log) {
  let changed = false;
  const pages = Array.isArray(native.pageConfig) ? native.pageConfig : [];
  const screensavers = Array.isArray(native.screensaverConfig) ? native.screensaverConfig : [];
  const notify = Array.isArray(native.screensaverNotify) ? native.screensaverNotify : [];
  const panels = Array.isArray(native.panels) ? native.panels : [];
  for (const item of pending) {
    const topic = item.panelTopic;
    let added = 0;
    for (const entry of item.pages) {
      if (!isDict(entry) || typeof entry.uniqueName !== "string") {
        continue;
      }
      const index = pages.findIndex((p) => isDict(p) && p.uniqueName === entry.uniqueName);
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
        `Panel ${topic}: ${added} page(s) of the parked script conversion added to the page configuration`
      );
    }
    if (item.screensaver && !screensavers.some((e) => isDict(e) && Array.isArray(e.panels) && e.panels.includes(topic))) {
      screensavers.push(item.screensaver);
      native.screensaverConfig = screensavers;
      changed = true;
      log.info(`Panel ${topic}: screensaver of the parked script conversion added`);
    }
    const newNotify = item.notify.filter((n) => isDict(n) && !notify.some((e) => isDict(e) && e.id === n.id));
    if (newNotify.length > 0) {
      notify.push(...newNotify);
      native.screensaverNotify = notify;
      changed = true;
      log.info(`Panel ${topic}: ${newNotify.length} notification(s) of the parked script conversion added`);
    }
    const panel = panels.find((p) => isDict(p) && p.topic === topic);
    if (panel) {
      for (const [side, key] of [
        ["left", "buttonLeft"],
        ["right", "buttonRight"]
      ]) {
        const action = item.buttons[side];
        if (action !== void 0 && panel[key] === void 0) {
          panel[key] = action;
          changed = true;
          log.info(`Panel ${topic}: button ${side} of the parked script conversion set`);
        }
      }
    }
  }
  return changed;
}
class ScriptToAdminRunner {
  adapter;
  options;
  constructor(options) {
    this.options = options;
    this.adapter = options.adapter;
  }
  get log() {
    return this.adapter.log;
  }
  get instanceId() {
    return `system.adapter.${this.adapter.namespace}`;
  }
  /**
   * Handles one request. The answer is handed to `respond` exactly once; on an execution it is sent
   * before the instance object is written (that write restarts the adapter).
   *
   * @param message The message of the sendTo (validated here).
   * @param respond Sends the answer to the caller.
   */
  async run(message, respond) {
    var _a, _b;
    const request = this.parseRequest(message);
    if (typeof request === "string") {
      respond({ error: request });
      return;
    }
    let planned;
    try {
      const outcome = await this.plan(request.panelTopic, request.globalDecisions);
      if (typeof outcome === "string") {
        respond({ error: outcome });
        return;
      }
      planned = outcome;
    } catch (e) {
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
    const result = {
      ...plan,
      executed: false,
      deletedBackups: [],
      renamedBackups: [],
      scriptRewritten: false,
      scriptNotes: [],
      panelReloaded: false,
      adapterRestarts: false
    };
    if (plan.nothingToDo) {
      this.log.info(`Panel '${plan.panelName}' (${plan.panelTopic}): nothing to convert, nothing written`);
      respond(result);
      return;
    }
    let responded = false;
    let parked = false;
    try {
      await this.writePending(planned);
      parked = true;
      if (planned.script) {
        await this.backupScript(planned.scriptId, planned.script, result);
        await this.rewriteScript(planned, result);
      } else {
        result.scriptNotes.push(
          `script object '${planned.scriptId}' not found - no backup, the script source is left unchanged`
        );
        this.log.warn(
          `Script object '${planned.scriptId}' not found: no backup is made and the source is not rewritten - remove the converted pages from the script yourself, otherwise they come back the next time it runs`
        );
      }
      result.executed = true;
      await this.storeCleanedRaw(planned, result);
      result.adapterRestarts = true;
      responded = true;
      respond(result);
      await this.adapter.delay((_a = this.options.answerDelay) != null ? _a : DEFAULT_ANSWER_DELAY);
      await this.removePending(plan.panelTopic);
      parked = false;
      try {
        await this.writeInstance(planned);
      } catch (e) {
        await this.writePending(planned);
        parked = true;
        throw e;
      }
    } catch (e) {
      const text = `Converting the script of panel ${plan.panelTopic} failed: ${errorText(e)}`;
      this.log.error(text);
      if (parked && !result.executed) {
        try {
          await this.removePending(plan.panelTopic);
          parked = false;
        } catch (e2) {
          this.log.warn(`The parked conversion could not be removed: ${errorText(e2)}`);
        }
      }
      const hint = parked ? `the admin entries are parked in the meta object and are applied at the next adapter start (restart the adapter); the script is backed up as '${(_b = result.backupId) != null ? _b : `${planned.scriptId}_1_backup`}'` : `nothing is parked - restore the script from its backup '${planned.scriptId}_1_backup' if it was rewritten`;
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
  pendingOf(planned) {
    var _a;
    const plan = planned.result;
    const pending = {
      panelTopic: plan.plan.panelTopic,
      ts: ((_a = this.options.now) != null ? _a : (() => /* @__PURE__ */ new Date()))().getTime(),
      pages: plan.updatedPages,
      notify: plan.newNotify,
      buttons: plan.buttons
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
  async writePending(planned) {
    const meta = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    if (!meta) {
      throw new Error(`meta object ${this.adapter.namespace} not found`);
    }
    const native = isDict(meta.native) ? meta.native : {};
    const list = Array.isArray(native.pendingScriptConversion) ? native.pendingScriptConversion : [];
    const topic = planned.result.plan.panelTopic;
    native.pendingScriptConversion = [
      ...list.filter((p) => !isPendingScriptConversion(p) || p.panelTopic !== topic),
      this.pendingOf(planned)
    ];
    meta.native = native;
    await this.adapter.setForeignObjectAsync(this.adapter.namespace, meta);
  }
  /**
   * Removes the parked conversion of the panel from the meta object.
   *
   * @param panelTopic Topic of the panel.
   */
  async removePending(panelTopic) {
    const meta = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    if (!meta) {
      return;
    }
    const native = isDict(meta.native) ? meta.native : {};
    const list = Array.isArray(native.pendingScriptConversion) ? native.pendingScriptConversion : [];
    native.pendingScriptConversion = list.filter((p) => !isPendingScriptConversion(p) || p.panelTopic !== panelTopic);
    meta.native = native;
    await this.adapter.setForeignObjectAsync(this.adapter.namespace, meta);
  }
  /**
   * Validates the message of the sendTo.
   *
   * @param message The message.
   * @returns The request or the error text.
   */
  parseRequest(message) {
    if (!isDict(message) || typeof message.panelTopic !== "string" || message.panelTopic === "") {
      return "panelTopic is missing in the request";
    }
    const request = { panelTopic: message.panelTopic, dryRun: message.dryRun !== false };
    if (isDict(message.globalDecisions)) {
      const decisions = {};
      for (const [name, value] of Object.entries(message.globalDecisions)) {
        const decision = import_adminShareConfig.CONVERT_GLOBAL_DECISIONS.find((d) => d === value);
        if (decision) {
          decisions[name] = decision;
        }
      }
      request.globalDecisions = decisions;
    }
    return request;
  }
  /**
   * Reads the objects and runs the planner.
   *
   * @param panelTopic Topic of the panel.
   * @param globalDecisions Decisions for conflicting pages of the global script.
   * @returns The plan or the error text.
   */
  async plan(panelTopic, globalDecisions) {
    var _a, _b, _c, _d, _e;
    const panel = this.adapter.config.panels.find((p) => !!p && p.topic === panelTopic);
    if (!panel) {
      return `Panel ${panelTopic} is not configured in the admin`;
    }
    const meta = await this.adapter.getForeignObjectAsync(this.adapter.namespace);
    const rawList = Array.isArray((_a = meta == null ? void 0 : meta.native) == null ? void 0 : _a.scriptConfigRaw) ? meta.native.scriptConfigRaw : [];
    const raw = rawList.find((r) => isDict(r) && r.panelTopic === panelTopic);
    if (!raw) {
      return `The script of panel ${panelTopic} has not sent its configuration yet - start the script once`;
    }
    const scriptId = typeof raw.scriptName === "string" ? raw.scriptName : "";
    const shared = rawList.filter(
      (r) => isDict(r) && r.panelTopic !== panelTopic && r.scriptName === scriptId
    ).map((r) => String(r.panelTopic));
    if (scriptId && shared.length > 0) {
      const text = `The script ${scriptId} serves several panels (${[panelTopic, ...shared].join(", ")}) - converting one panel would break the others. Converting the panels one after another is not possible yet; split the script first (one script per panel)`;
      this.log.warn(text);
      return text;
    }
    const instance = await this.adapter.getForeignObjectAsync(this.instanceId);
    const tables = this.readAdminTables(instance);
    const scriptObj = scriptId ? await this.adapter.getForeignObjectAsync(scriptId) : void 0;
    const script = isScriptObject(scriptObj) ? scriptObj : void 0;
    const mode = (_c = (_b = this.options).screensaverMode) == null ? void 0 : _c.call(_b, panelTopic);
    const panelInput = { name: panel.name, topic: panel.topic };
    const stored = (_d = this.findInstancePanel(instance, panelTopic)) != null ? _d : panel;
    if (stored.buttonLeft !== void 0) {
      panelInput.buttonLeft = stored.buttonLeft;
    }
    if (stored.buttonRight !== void 0) {
      panelInput.buttonRight = stored.buttonRight;
    }
    const result = (0, import_script_to_admin.planScriptToAdmin)({
      raw: structuredClone(raw),
      panel: panelInput,
      pageConfig: tables.pageConfig,
      screensaverConfig: tables.screensaverConfig,
      screensaverNotify: tables.screensaverNotify,
      instanceWeatherEntity: tables.weatherEntity,
      screensaverMode: mode && import_adminShareConfig.screensaverModes.includes(mode) ? mode : void 0,
      scriptFound: !!script,
      // the global script is merged in for this panel; it is read, never written
      globalConfigRaw: (_e = meta == null ? void 0 : meta.native) == null ? void 0 : _e.globalConfigRaw,
      globalDecisions
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
  findInstancePanel(instance, panelTopic) {
    const panels = isDict(instance == null ? void 0 : instance.native) && Array.isArray(instance.native.panels) ? instance.native.panels : [];
    const panel = panels.find((p) => isDict(p) && p.topic === panelTopic);
    if (!panel) {
      return void 0;
    }
    const result = {};
    for (const key of ["buttonLeft", "buttonRight"]) {
      const value = panel[key];
      if (value === void 0) {
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
  readAdminTables(instance) {
    const native = isDict(instance == null ? void 0 : instance.native) ? instance.native : {};
    const list = (value) => Array.isArray(value) ? value : [];
    return {
      pageConfig: list(native.pageConfig),
      screensaverConfig: list(native.screensaverConfig),
      screensaverNotify: list(native.screensaverNotify),
      weatherEntity: typeof native.weatherEntity === "string" ? native.weatherEntity : void 0
    };
  }
  /**
   * Logs the plan: `info`/`warn` on an execution, `debug` on a dry run.
   *
   * @param planned The plan.
   * @param dryRun Whether this is a dry run.
   */
  logPlan(planned, dryRun) {
    var _a;
    const plan = planned.result.plan;
    const info = (text) => dryRun ? this.log.debug(text) : this.log.info(text);
    const warn = (text) => dryRun ? this.log.debug(text) : this.log.warn(text);
    const head = `Script conversion of panel '${plan.panelName}' (${plan.panelTopic})${dryRun ? " - dry run" : ""}`;
    info(`${head}: script ${plan.scriptId || "-"} ${plan.scriptFound ? "found" : "NOT found"}`);
    const counts = { create: 0, assignNavigation: 0, removeReference: 0 };
    for (const page of plan.pages) {
      counts[page.action]++;
      info(this.describePage(page, planned));
    }
    for (const conflict of (_a = plan.conflicts) != null ? _a : []) {
      warn(
        `Page '${conflict.uniqueName}' of the global script differs from the admin entry (${conflict.differences.join(", ")}) - decision: ${conflict.decision}`
      );
    }
    for (const skipped of plan.skipped) {
      warn(
        `Page '${skipped.uniqueName}' (${skipped.type}) skipped: ${reasonText(skipped.reason, skipped.detail)}`
      );
    }
    if (plan.screensaver) {
      const s = plan.screensaver;
      info(
        `Screensaver '${s.name}' (${s.mode}, ${s.itemCount} items, ${s.notifyCount} notifications): converted to the admin screensaver configuration`
      );
    } else if (plan.screensaverSkipped) {
      const s = plan.screensaverSkipped;
      (s.reason === "screensaverEmpty" ? info : warn)(`Screensaver skipped: ${reasonText(s.reason, s.detail)}`);
    }
    for (const side of ["left", "right"]) {
      const action = plan.buttons[side];
      if (action !== void 0) {
        info(`Button ${side} (${describeButton(action)}): converted to the panel configuration`);
      }
    }
    for (const skipped of plan.buttonsSkipped) {
      warn(`Button ${skipped.side} skipped: ${reasonText(skipped.reason, skipped.detail)}`);
    }
    const buttonCount = (plan.buttons.left !== void 0 ? 1 : 0) + (plan.buttons.right !== void 0 ? 1 : 0);
    const tail = plan.nothingToDo ? " - nothing to do" : "";
    info(
      `${head}: ${counts.create} page(s) converted, ${counts.assignNavigation} navigation(s) assigned, ${counts.removeReference} dead reference(s) removed, ${plan.skipped.length} page(s) skipped, screensaver ${plan.screensaver ? "converted" : "not converted"}, ${buttonCount} button(s) converted${tail}`
    );
  }
  /**
   * The log line of a page of the plan.
   *
   * @param page The page.
   * @param planned The plan (for the name of an existing admin entry).
   */
  describePage(page, planned) {
    var _a, _b;
    const head = `Page '${page.uniqueName}' (${page.type}`;
    switch (page.action) {
      case "create":
        if (page.existing === "takeScript") {
          return `${head}, ${page.itemCount} items, global script): replaces the content of the existing admin entry, the panel is assigned`;
        }
        return `${head}, ${page.itemCount} items${page.global ? ", global script" : ""}): converted to the admin page configuration`;
      case "assignNavigation": {
        if (page.existing !== void 0) {
          return `${head}, global script): the panel is assigned to the existing admin entry (${page.existing === "identical" ? "same content" : "admin content kept"})`;
        }
        const tables = planned.result.updatedPages;
        const entry = page.card === "cardPower" ? (0, import_adminShareConfig.findPowerEntryForScript)(tables, page.uniqueName) : (0, import_adminShareConfig.findChartEntryForScript)(tables, page.uniqueName);
        return `${head}): navigation assigned to the existing admin entry '${(_a = entry == null ? void 0 : entry.uniqueName) != null ? _a : page.uniqueName}'`;
      }
      case "removeReference":
        return `${head}): dead reference removed from the script (${(_b = page.reason) != null ? _b : "adminOnly"})`;
    }
  }
  /**
   * Rotates the backups of the script and stores the current script as `_1_backup`.
   *
   * @param scriptId Id of the script.
   * @param script The script object.
   * @param result Receives backupId, renamedBackups, deletedBackups.
   */
  async backupScript(scriptId, script, result) {
    var _a;
    const view = await this.adapter.getObjectViewAsync("system", "script", {
      startkey: `${scriptId}_`,
      endkey: `${scriptId}_\u9999`
    });
    const plan = (0, import_script_source.planScriptBackup)(
      scriptId,
      ((_a = view == null ? void 0 : view.rows) != null ? _a : []).map((r) => r.id)
    );
    for (const id of plan.deletes) {
      await this.adapter.delForeignObjectAsync(id);
      result.executed = true;
      result.deletedBackups.push(id);
      this.log.info(`Script backup '${id}' deleted (only ${import_script_source.MAX_SCRIPT_BACKUPS} backups are kept)`);
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
  async rewriteScript(planned, result) {
    var _a;
    const script = planned.script;
    if (!script) {
      return;
    }
    const original = typeof script.common.source === "string" ? script.common.source : "";
    if (original === "") {
      result.scriptNotes.push("the script has no source text - nothing rewritten");
      this.log.warn(`Script '${planned.scriptId}' has no source text - nothing rewritten`);
      return;
    }
    const today = localDate(((_a = this.options.now) != null ? _a : (() => /* @__PURE__ */ new Date()))());
    const plan = planned.result;
    let source = original;
    if (plan.removedFromScript.length > 0) {
      const r = (0, import_script_source.removePagesFromScript)(source, plan.removedFromScript, today);
      source = r.source;
      result.scriptNotes.push(...r.notes);
    }
    if (plan.clearScreensaverInScript) {
      const r = (0, import_script_source.clearScreensaverInScript)(source, today);
      source = r.source;
      result.scriptNotes.push(...r.notes);
    }
    if (plan.clearButtonsInScript.length > 0) {
      const r = (0, import_script_source.clearButtonsInScript)(source, plan.clearButtonsInScript, today);
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
      `Script '${planned.scriptId}': source rewritten (the javascript adapter restarts it, it sends the reduced configuration)`
    );
  }
  /**
   * Stores the cleaned script configuration in the meta object through the config manager (replaces
   * `scriptConfigRaw` and `scriptConfig` of the panel, validates it).
   *
   * @param planned The plan.
   * @param result Receives the error when the config manager rejects the configuration.
   */
  async storeCleanedRaw(planned, result) {
    const store = this.options.createConfigStore();
    try {
      const r = await store.setScriptConfig(structuredClone(planned.result.cleanedRaw));
      for (const message of r.messages) {
        this.log.debug(`Config manager: ${message}`);
      }
      if (r.panelConfig) {
        this.log.info(
          `Stored script configuration of panel ${planned.result.plan.panelTopic} cleaned (converted pages, screensaver and buttons removed)`
        );
        return;
      }
      const text = `The cleaned script configuration was rejected by the config manager: ${r.messages.join(" | ")}`;
      result.error = text;
      this.log.error(text);
      this.log.warn(
        `The admin entries are written anyway - they are the valuable part; the stored script configuration is refreshed the next time the script sends it`
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
  async writeInstance(planned) {
    const plan = planned.result;
    const instance = await this.adapter.getForeignObjectAsync(this.instanceId);
    if (!instance) {
      throw new Error(`instance object ${this.instanceId} not found`);
    }
    const tables = this.readAdminTables(instance);
    const native = isDict(instance.native) ? instance.native : {};
    native.pageConfig = plan.updatedPages;
    if (plan.screensaverEntry) {
      native.screensaverConfig = [...tables.screensaverConfig, plan.screensaverEntry];
    }
    if (plan.newNotify.length > 0) {
      native.screensaverNotify = [...tables.screensaverNotify, ...plan.newNotify];
    }
    if (plan.buttons.left !== void 0 || plan.buttons.right !== void 0) {
      const panels = Array.isArray(native.panels) ? native.panels : [];
      const panel = panels.find(
        (p) => isDict(p) && p.topic === plan.plan.panelTopic
      );
      if (panel) {
        if (plan.buttons.left !== void 0) {
          panel.buttonLeft = plan.buttons.left;
        }
        if (plan.buttons.right !== void 0) {
          panel.buttonRight = plan.buttons.right;
        }
      } else {
        this.log.warn(`Panel ${plan.plan.panelTopic} not found in the instance object - buttons not written`);
      }
    }
    instance.native = native;
    this.log.info("Admin configuration written, the adapter restarts to apply it");
    await this.adapter.setForeignObjectAsync(this.instanceId, instance);
  }
}
function errorText(e) {
  return e instanceof Error ? e.message : String(e);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ScriptToAdminRunner,
  applyPendingScriptConversions,
  isPendingScriptConversion,
  localDate
});
//# sourceMappingURL=script-to-admin-runner.js.map
