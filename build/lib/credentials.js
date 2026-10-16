"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var credentials_exports = {};
__export(credentials_exports, {
  isCredentialId: () => isCredentialId,
  resolveLogin: () => resolveLogin,
  resolveSecret: () => resolveSecret
});
module.exports = __toCommonJS(credentials_exports);
var Credentials = __toESM(require("@iobroker/adapter-core/credentials"));
function isCredentialId(id) {
  return typeof id === "string" && id.startsWith(Credentials.CREDENTIALS_PREFIX) && id.length > Credentials.CREDENTIALS_PREFIX.length;
}
function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}
async function readCredential(adapter, id) {
  var _a;
  try {
    const info = await Credentials.getCredentials(adapter, id);
    return { name: info.name || id.substring(Credentials.CREDENTIALS_PREFIX.length), values: (_a = info.values) != null ? _a : {} };
  } catch (e) {
    adapter.log.warn(`Cannot read credential "${id}": ${e instanceof Error ? e.message : String(e)}`);
    return void 0;
  }
}
async function resolveLogin(adapter, credentialId, legacyLogin, legacyPassword) {
  if (isCredentialId(credentialId)) {
    const cred = await readCredential(adapter, credentialId);
    if (cred) {
      const login2 = asText(cred.values.login);
      const password2 = asText(cred.values.password);
      if (login2 && password2) {
        return { source: "credential", login: login2, password: password2, name: cred.name };
      }
      adapter.log.warn(
        `Credential "${cred.name}" (${credentialId}) has no ${login2 ? "password" : "login"} - it must be of the form "login & password"; using the fields of the instance settings instead`
      );
    }
  } else if (typeof credentialId === "string" && credentialId) {
    adapter.log.warn(`Ignoring invalid credential id "${credentialId}"`);
  }
  const login = asText(legacyLogin);
  const password = asText(legacyPassword);
  return login && password ? { source: "legacy", login, password } : { source: "none", login, password };
}
async function resolveSecret(adapter, credentialId, legacySecret) {
  if (isCredentialId(credentialId)) {
    const cred = await readCredential(adapter, credentialId);
    if (cred) {
      const secret2 = asText(cred.values.key) || asText(cred.values.password);
      if (secret2) {
        return { source: "credential", secret: secret2, name: cred.name };
      }
      adapter.log.warn(
        `Credential "${cred.name}" (${credentialId}) is empty - using the field of the instance settings instead`
      );
    }
  } else if (typeof credentialId === "string" && credentialId) {
    adapter.log.warn(`Ignoring invalid credential id "${credentialId}"`);
  }
  const secret = asText(legacySecret);
  return secret ? { source: "legacy", secret } : { source: "none", secret: "" };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isCredentialId,
  resolveLogin,
  resolveSecret
});
//# sourceMappingURL=credentials.js.map
