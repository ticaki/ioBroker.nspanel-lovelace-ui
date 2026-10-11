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
var template_info_exports = {};
__export(template_info_exports, {
  screensaverTemplateInfos: () => screensaverTemplateInfos
});
module.exports = __toCommonJS(template_info_exports);
var import_templateArray = require("./templateArray");
function screensaverTemplateInfos(templates = import_templateArray.pageItemTemplates) {
  var _a, _b, _c;
  const result = [];
  for (const [name, template] of Object.entries(templates)) {
    if (!template) {
      continue;
    }
    const looksFor = [];
    let channel = false;
    const walk = (node) => {
      if (!node || typeof node !== "object") {
        return;
      }
      const item = node;
      if (typeof item.type === "string" && ("dp" in item || "constVal" in item)) {
        if (item.type !== "triggered" && item.type !== "state") {
          return;
        }
        const relative = typeof item.dp === "string" && item.dp.startsWith(".");
        if (item.mode !== "auto" && !relative) {
          return;
        }
        channel = true;
        const hint = describeSearch(item, relative);
        if (hint && !looksFor.includes(hint)) {
          looksFor.push(hint);
        }
        return;
      }
      for (const value of Object.values(item)) {
        walk(value);
      }
    };
    walk(template.data);
    result.push({
      name,
      type: String((_a = template.type) != null ? _a : ""),
      role: String((_b = template.role) != null ? _b : ""),
      adapter: String((_c = template.adapter) != null ? _c : ""),
      need: channel ? "channel" : "none",
      looksFor
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
function describeSearch(item, relative) {
  if (relative) {
    return String(item.dp);
  }
  if (item.regexp instanceof RegExp) {
    return item.regexp.source.replace(/^\^/, "").replace(/\$$/, "").replace(/\\\./g, ".");
  }
  if (Array.isArray(item.role)) {
    return item.role.map(String).join(" | ");
  }
  if (typeof item.role === "string" && item.role) {
    return item.role;
  }
  return "";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  screensaverTemplateInfos
});
//# sourceMappingURL=template-info.js.map
