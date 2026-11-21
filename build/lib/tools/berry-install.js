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
var berry_install_exports = {};
__export(berry_install_exports, {
  BERRY_BACKUP_FILE: () => BERRY_BACKUP_FILE,
  BERRY_DRIVER_FILE: () => BERRY_DRIVER_FILE,
  BERRY_FLASH_MODE_COMMAND: () => BERRY_FLASH_MODE_COMMAND,
  BERRY_OLD_FILE: () => BERRY_OLD_FILE,
  findBerryInstallTopic: () => findBerryInstallTopic,
  getBerryCommitCommand: () => getBerryCommitCommand,
  getBerryDownloadCommand: () => getBerryDownloadCommand,
  getBerryLegacyInstallCommand: () => getBerryLegacyInstallCommand,
  getBerryRestoreCommand: () => getBerryRestoreCommand,
  getTasmotaCommandUrl: () => getTasmotaCommandUrl,
  isBerryFlashing: () => isBerryFlashing,
  parseUrlFetchResult: () => parseUrlFetchResult
});
module.exports = __toCommonJS(berry_install_exports);
const BERRY_DRIVER_FILE = "autoexec.be";
const BERRY_BACKUP_FILE = "autoexec.bak";
const BERRY_OLD_FILE = "autoexec.old";
function getBerryDownloadCommand(berryUrl, version) {
  return `Backlog UfsDelete ${BERRY_BACKUP_FILE}; UfsRename ${BERRY_DRIVER_FILE},${BERRY_BACKUP_FILE}; UrlFetch ${berryUrl}/${version}/${BERRY_DRIVER_FILE}`;
}
function getBerryCommitCommand(restart) {
  const restartCommand = restart ? "; Restart 1" : "";
  return `Backlog UfsDelete ${BERRY_OLD_FILE}; UfsRename ${BERRY_BACKUP_FILE},${BERRY_OLD_FILE}${restartCommand}`;
}
function getBerryRestoreCommand() {
  return `Backlog UfsDelete ${BERRY_DRIVER_FILE}; UfsRename ${BERRY_BACKUP_FILE},${BERRY_DRIVER_FILE}`;
}
function getTasmotaCommandUrl(tasmotaIP, command, login) {
  const auth = login.useAdmin ? `user=admin&password=${encodeURIComponent(login.password)}` : "";
  return `http://${tasmotaIP}/cm?${auth}&cmnd=${encodeURIComponent(command)}`;
}
const BERRY_FLASH_MODE_COMMAND = "Br nextion.flash_mode";
function isBerryFlashing(result) {
  if (typeof result !== "object" || result === null || !("Br" in result)) {
    return false;
  }
  return result.Br === "1";
}
function parseUrlFetchResult(message) {
  let payload;
  try {
    payload = JSON.parse(message);
  } catch {
    return "none";
  }
  if (typeof payload !== "object" || payload === null || !("UrlFetch" in payload)) {
    return "none";
  }
  return payload.UrlFetch === "Done" ? "done" : "failed";
}
function getBerryLegacyInstallCommand(berryUrl, version) {
  return `Backlog UfsDelete ${BERRY_OLD_FILE}; UfsRename ${BERRY_DRIVER_FILE},${BERRY_OLD_FILE}; UrlFetch ${berryUrl}/${version}/${BERRY_DRIVER_FILE}`;
}
function findBerryInstallTopic(requestTopic, tasmotaIP, panels) {
  if (typeof requestTopic === "string" && requestTopic) {
    return requestTopic;
  }
  const panel = (panels != null ? panels : []).find((p) => p && p.kind !== "web" && p.ip === tasmotaIP && !!p.topic);
  return panel == null ? void 0 : panel.topic;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BERRY_BACKUP_FILE,
  BERRY_DRIVER_FILE,
  BERRY_FLASH_MODE_COMMAND,
  BERRY_OLD_FILE,
  findBerryInstallTopic,
  getBerryCommitCommand,
  getBerryDownloadCommand,
  getBerryLegacyInstallCommand,
  getBerryRestoreCommand,
  getTasmotaCommandUrl,
  isBerryFlashing,
  parseUrlFetchResult
});
//# sourceMappingURL=berry-install.js.map
