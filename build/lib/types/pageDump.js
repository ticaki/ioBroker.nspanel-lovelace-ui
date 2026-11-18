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
var pageDump_exports = {};
__export(pageDump_exports, {
  PAGE_DUMP_FORMAT: () => PAGE_DUMP_FORMAT,
  PAGE_DUMP_VERSION: () => PAGE_DUMP_VERSION,
  SENDTO_PAGE_DUMP_COMMAND: () => SENDTO_PAGE_DUMP_COMMAND,
  SENDTO_PAGE_DUMP_LIST_COMMAND: () => SENDTO_PAGE_DUMP_LIST_COMMAND,
  isPageDumpKind: () => isPageDumpKind,
  isPageDumpRequest: () => isPageDumpRequest,
  pageDumpFileName: () => pageDumpFileName,
  pageDumpKey: () => pageDumpKey,
  parsePageDumpList: () => parsePageDumpList
});
module.exports = __toCommonJS(pageDump_exports);
const SENDTO_PAGE_DUMP_LIST_COMMAND = "pageDumpList";
const SENDTO_PAGE_DUMP_COMMAND = "pageDump";
const PAGE_DUMP_FORMAT = "nspanel-lovelace-ui.pageDump";
const PAGE_DUMP_VERSION = 1;
function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isPageDumpKind(value) {
  return value === "page" || value === "screensaver";
}
function isPageDumpRequest(value) {
  return isObject(value) && typeof value.panelTopic === "string" && value.panelTopic !== "" && typeof value.page === "string" && value.page !== "" && isPageDumpKind(value.kind);
}
function isPageDumpListEntry(value) {
  return isObject(value) && typeof value.panelTopic === "string" && typeof value.panelName === "string" && typeof value.page === "string" && typeof value.card === "string" && isPageDumpKind(value.kind);
}
function parsePageDumpList(value) {
  if (!isObject(value) || !Array.isArray(value.result)) {
    return void 0;
  }
  return value.result.filter(isPageDumpListEntry);
}
function pageDumpKey(entry) {
  return JSON.stringify([entry.kind, entry.panelTopic, entry.page]);
}
function pageDumpFileName(panelName, page, now) {
  const safe = (text, fallback) => text.trim().replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || fallback;
  const pad = (n) => String(n).padStart(2, "0");
  return `nspanel-page-${safe(panelName, "panel")}-${safe(page, "page")}-${now.getFullYear()}-${pad(
    now.getMonth() + 1
  )}-${pad(now.getDate())}.json`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PAGE_DUMP_FORMAT,
  PAGE_DUMP_VERSION,
  SENDTO_PAGE_DUMP_COMMAND,
  SENDTO_PAGE_DUMP_LIST_COMMAND,
  isPageDumpKind,
  isPageDumpRequest,
  pageDumpFileName,
  pageDumpKey,
  parsePageDumpList
});
//# sourceMappingURL=pageDump.js.map
