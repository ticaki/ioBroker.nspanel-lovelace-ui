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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var controller_exports = {};
__export(controller_exports, {
  Controller: () => Controller
});
module.exports = __toCommonJS(controller_exports);
var Library = __toESM(require("../classes/library"));
var import_states_controller = require("./states-controller");
var Panel = __toESM(require("./panel"));
var import_definition = require("../const/definition");
class Controller extends Library.BaseClass {
  mqttClient;
  statesControler;
  panels = [];
  constructor(adapter, options) {
    super(adapter, options.name);
    this.adapter.controller = this;
    this.mqttClient = options.mqttClient;
    this.statesControler = new import_states_controller.StatesControler(this.adapter);
    for (const panelConfig of options.panels) {
      if (panelConfig === void 0)
        continue;
      panelConfig.controller = this;
      if (!Panel.isPanelConfig(panelConfig)) {
        this.log.warn(`Panelconfig for ${panelConfig.name} is invalid!`);
        continue;
      }
      const panel = new Panel.Panel(adapter, panelConfig);
      this.panels.push(panel);
    }
  }
  async init() {
    const newPanels = [];
    this.library.writedp(`panel`, void 0, import_definition.genericStateObjects.panel._channel);
    for (const panel of this.panels)
      if (await panel.isValid()) {
        newPanels.push(panel);
        await panel.init();
      } else {
        panel.delete();
        this.log.error(`Panel ${panel.name} has a invalid configuration.`);
      }
    this.panels = newPanels;
  }
  async delete() {
    await super.delete();
    this.panels.forEach((a) => a.delete());
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Controller
});
//# sourceMappingURL=controller.js.map
