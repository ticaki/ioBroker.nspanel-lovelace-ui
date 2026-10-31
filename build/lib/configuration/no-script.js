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
var no_script_exports = {};
__export(no_script_exports, {
  checkScriptConfigTopics: () => checkScriptConfigTopics,
  findPanelEntry: () => findPanelEntry,
  isNoScriptPanel: () => isNoScriptPanel,
  noScriptRejectionMessage: () => noScriptRejectionMessage,
  normalizePanelTopic: () => normalizePanelTopic
});
module.exports = __toCommonJS(no_script_exports);
var import_config_manager_const = require("../const/config-manager-const");
function normalizePanelTopic(topic) {
  return topic.endsWith(".cmnd.CustomSend") ? topic.split(".").slice(0, -2).join(".") : topic;
}
function findPanelEntry(panels, topic) {
  if (!panels || typeof topic !== "string" || !topic) {
    return void 0;
  }
  const wanted = normalizePanelTopic(topic);
  for (const panel of panels) {
    if (panel && panel.topic === wanted) {
      return panel;
    }
  }
  return void 0;
}
function isNoScriptPanel(panels, topic) {
  var _a;
  return ((_a = findPanelEntry(panels, topic)) == null ? void 0 : _a.noScript) === true;
}
function noScriptRejectionMessage(panel, topic, scriptId) {
  const name = (panel == null ? void 0 : panel.name) ? `"${panel.name}" (topic ${topic})` : `with topic ${topic}`;
  const script = scriptId ? `the panel script ${scriptId}` : "this panel script";
  return `\u274C Panel ${name} is set to "Panel uses no script" in the panel settings of the adapter - the configuration of ${script} was rejected and not stored. Disable or delete ${script} in the JavaScript adapter, otherwise it sends its configuration again on every start. To use a panel script again, remove the check mark in the panel settings. The global script is not affected.`;
}
function checkScriptConfigTopics(panels, message) {
  const result = { global: false, accepted: [], rejected: [] };
  if (!message || typeof message !== "object") {
    return result;
  }
  if ((0, import_config_manager_const.isGlobalConfig)(message)) {
    result.global = true;
    return result;
  }
  const panelTopic = "panelTopic" in message ? message.panelTopic : void 0;
  const scriptName = "scriptName" in message ? message.scriptName : void 0;
  const scriptId = typeof scriptName === "string" ? scriptName : void 0;
  const topics = Array.isArray(panelTopic) ? panelTopic : [panelTopic];
  for (const topic of topics) {
    if (typeof topic !== "string") {
      continue;
    }
    const panel = findPanelEntry(panels, topic);
    if ((panel == null ? void 0 : panel.noScript) === true) {
      result.rejected.push(noScriptRejectionMessage(panel, topic, scriptId));
    } else {
      result.accepted.push(topic);
    }
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkScriptConfigTopics,
  findPanelEntry,
  isNoScriptPanel,
  noScriptRejectionMessage,
  normalizePanelTopic
});
//# sourceMappingURL=no-script.js.map
