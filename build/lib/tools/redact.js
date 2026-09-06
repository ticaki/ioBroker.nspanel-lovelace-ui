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
var redact_exports = {};
__export(redact_exports, {
  REDACTED: () => REDACTED,
  redactSecrets: () => redactSecrets,
  redactSecretsInText: () => redactSecretsInText,
  stringifyForLog: () => stringifyForLog
});
module.exports = __toCommonJS(redact_exports);
const REDACTED = "***";
const SECRET_KEY_REGEX = /(pass(word|wd)?|pwd|secret|token|credential)/i;
function redactSecretsInText(text) {
  return text.replace(/((?:pass(?:word)?|pwd)(?:=|%3D))[^&\s;]*/gi, `$1${REDACTED}`).replace(
    /((?:mqtt|web)password(?:%20|\s)+)(?:(?!%3B|;|%20|\s).)*/gi,
    (_match, prefix) => `${prefix}${REDACTED}`
  );
}
function redactSecrets(value) {
  if (typeof value === "string") {
    return redactSecretsInText(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = SECRET_KEY_REGEX.test(key) ? REDACTED : redactSecrets(item);
    }
    return result;
  }
  return value;
}
function stringifyForLog(value) {
  var _a;
  try {
    return (_a = JSON.stringify(redactSecrets(value))) != null ? _a : String(value);
  } catch {
    return "[unserializable]";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  REDACTED,
  redactSecrets,
  redactSecretsInText,
  stringifyForLog
});
//# sourceMappingURL=redact.js.map
