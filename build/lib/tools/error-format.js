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
var error_format_exports = {};
__export(error_format_exports, {
  describeErrorCauses: () => describeErrorCauses,
  formatErrorForLog: () => formatErrorForLog
});
module.exports = __toCommonJS(error_format_exports);
var import_redact = require("./redact");
const MAX_CAUSE_DEPTH = 5;
function isObject(value) {
  return typeof value === "object" && value !== null;
}
function getCode(value) {
  if (isObject(value) && "code" in value) {
    const code = value.code;
    if (typeof code === "string" || typeof code === "number") {
      return String(code);
    }
  }
  return void 0;
}
function getMessage(value) {
  if (value instanceof Error) {
    return value.message;
  }
  if (isObject(value) && "message" in value && typeof value.message === "string") {
    return value.message;
  }
  return String(value);
}
function getErrors(value) {
  if ("errors" in value) {
    const errors = value.errors;
    if (Array.isArray(errors)) {
      const list = errors;
      return list;
    }
  }
  return [];
}
function describeLink(value) {
  const code = getCode(value);
  const message = getMessage(value);
  return [code, message].filter((part) => part !== void 0 && part !== "").join(" ");
}
function collectCauses(value, depth, seen) {
  if (!isObject(value) || depth >= MAX_CAUSE_DEPTH) {
    return [];
  }
  seen.add(value);
  const parts = [];
  const errors = getErrors(value);
  if (errors.length > 0) {
    const items = errors.map((item) => {
      if (isObject(item) && seen.has(item)) {
        return "[circular]";
      }
      const sub = collectCauses(item, depth + 1, seen);
      return sub.length > 0 ? `${describeLink(item)} (${sub.join(" | ")})` : describeLink(item);
    });
    parts.push(`errors: [${items.join("; ")}]`);
  }
  if ("cause" in value && value.cause !== void 0) {
    const cause = value.cause;
    if (isObject(cause) && seen.has(cause)) {
      parts.push("cause: [circular]");
    } else {
      parts.push(`cause: ${describeLink(cause)}`);
      parts.push(...collectCauses(cause, depth + 1, seen));
    }
  }
  return parts;
}
function describeErrorCauses(e) {
  const parts = collectCauses(e, 0, /* @__PURE__ */ new Set());
  return parts.length > 0 ? ` | ${parts.join(" | ")}` : "";
}
function formatErrorForLog(e, withStack = false) {
  var _a;
  const head = e instanceof Error && withStack ? (_a = e.stack) != null ? _a : String(e) : String(e);
  return (0, import_redact.redactSecretsInText)(`${head}${describeErrorCauses(e)}`);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  describeErrorCauses,
  formatErrorForLog
});
//# sourceMappingURL=error-format.js.map
