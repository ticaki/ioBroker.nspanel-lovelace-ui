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
var nspanelts_import_runner_exports = {};
__export(nspanelts_import_runner_exports, {
  NsPanelTsImport: () => NsPanelTsImport,
  isNsPanelTsConvertRequest: () => isNsPanelTsConvertRequest
});
module.exports = __toCommonJS(nspanelts_import_runner_exports);
var import_nspanelts_import = require("./nspanelts-import");
var import_script_to_admin_runner = require("./script-to-admin-runner");
function isRecord(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function isScriptObject(v) {
  return isRecord(v) && v.type === "script" && isRecord(v.common);
}
function isNsPanelTsConvertRequest(v) {
  return isRecord(v) && typeof v.scriptId === "string" && typeof v.panelName === "string" && typeof v.topic === "string";
}
function nameOf(obj) {
  var _a, _b, _c;
  const n = obj.common.name;
  if (typeof n === "string") {
    return n;
  }
  if (isRecord(n)) {
    const first = (_b = (_a = n.en) != null ? _a : n.de) != null ? _b : Object.values(n)[0];
    if (typeof first === "string") {
      return first;
    }
  }
  return (_c = obj._id.split(".").pop()) != null ? _c : obj._id;
}
class NsPanelTsImport {
  constructor(o) {
    this.o = o;
  }
  /**
   * All scripts of the javascript adapter that are old NSPanelTs scripts.
   *
   * @returns the scripts with version, topic and whether they can be converted
   */
  async list() {
    var _a;
    const view = await this.o.adapter.getObjectViewAsync("system", "script", {
      startkey: "script.js.",
      endkey: "script.js.\u9999"
    });
    const out = [];
    for (const row of (_a = view == null ? void 0 : view.rows) != null ? _a : []) {
      const obj = row.value;
      if (!isScriptObject(obj) || typeof obj.common.source !== "string" || row.id.startsWith(`${this.o.folder}.`)) {
        continue;
      }
      const info = (0, import_nspanelts_import.inspectNsPanelTs)(obj.common.source);
      if (!info.isNsPanelTs) {
        continue;
      }
      out.push({
        id: row.id,
        name: nameOf(obj),
        enabled: obj.common.enabled === true,
        supported: info.supported,
        ...info.version ? { version: info.version } : {},
        ...info.topic ? { topic: info.topic } : {},
        ...info.reason ? { reason: info.reason } : {}
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
  async freeId(panelName) {
    for (let i = 0; i < 100; i++) {
      const name = i === 0 ? panelName : i === 1 ? `${panelName}_NSPanelTs` : `${panelName}_NSPanelTs_${i}`;
      const id = this.o.scriptIdFor(name);
      if (!await this.o.adapter.getForeignObjectAsync(id)) {
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
  async convert(req) {
    const { adapter } = this.o;
    const topic = req.topic.trim();
    if (!this.o.panelNames.includes(req.panelName)) {
      return { error: `Panel ${req.panelName} not found`, errorKey: "nspanelTsImport_errorPanel" };
    }
    if (!topic) {
      return { error: "No topic given", errorKey: "nspanelTsImport_errorTopic" };
    }
    const old = await adapter.getForeignObjectAsync(req.scriptId);
    if (!isScriptObject(old) || typeof old.common.source !== "string" || !req.scriptId.startsWith("script.js.")) {
      return { error: `Script ${req.scriptId} not found`, errorKey: "nspanelTsImport_errorScript" };
    }
    const result = (0, import_nspanelts_import.convertNsPanelTs)({
      source: old.common.source,
      template: this.o.template,
      endToken: this.o.endToken,
      panelTopic: topic,
      namespace: adapter.namespace,
      sourceScriptId: req.scriptId,
      today: (0, import_script_to_admin_runner.localDate)(this.o.now ? this.o.now() : /* @__PURE__ */ new Date())
    });
    if (!result.scriptSource) {
      const error = result.errors.join("; ") || "conversion failed";
      adapter.log.warn(`NSPanelTs import of ${req.scriptId}: ${error}`);
      return { error };
    }
    await adapter.extendForeignObjectAsync(this.o.folder, {
      type: "channel",
      common: { name: adapter.namespace, expert: true },
      native: {}
    });
    const target = await this.freeId(req.panelName);
    const engine = typeof old.common.engine === "string" && old.common.engine ? old.common.engine : "system.adapter.javascript.0";
    const script = {
      _id: target.id,
      type: "script",
      common: {
        name: target.name,
        engineType: "TypeScript/ts",
        engine,
        source: result.scriptSource,
        debug: false,
        verbose: false,
        enabled: false
      },
      native: {}
    };
    if (await adapter.getForeignObjectAsync(target.id)) {
      return { error: `Script ${target.id} exists already`, errorKey: "nspanelTsImport_errorExists" };
    }
    await adapter.setForeignObjectAsync(target.id, script);
    adapter.log.info(
      `NSPanelTs script ${req.scriptId} converted into ${target.id} (disabled): ${result.pages.length} pages, ${result.todos.length} TODOs, ${result.discarded.length} service pages dropped`
    );
    return {
      scriptId: target.id,
      pages: result.pages,
      todoPages: result.todoPages,
      todos: result.todos.length,
      discarded: result.discarded,
      warnings: result.errors
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NsPanelTsImport,
  isNsPanelTsConvertRequest
});
//# sourceMappingURL=nspanelts-import-runner.js.map
