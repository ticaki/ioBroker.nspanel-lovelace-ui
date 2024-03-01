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
  minuteLoopTimeout;
  dateUpdateTimeout;
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
  minuteLoop = async () => {
    if (this.unload)
      return;
    this.statesControler.setInternalState("///time", await this.getCurrentTime(), true);
    const diff = 6e4 - Date.now() % 6e4 + 10;
    this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
  };
  /**
   * Update Date every hour.
   * @returns
   */
  dateUpdateLoop = async () => {
    if (this.unload)
      return;
    this.statesControler.setInternalState("///date", await this.getCurrentTime(), true);
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0);
    const diff = (d.getTime() - Date.now()) / 24 + 1e3;
    this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
  };
  getCurrentTime = async () => {
    return Date.now();
  };
  async init() {
    await this.statesControler.setInternalState(
      "///time",
      await this.getCurrentTime(),
      true,
      {
        name: "",
        type: "number",
        role: "value.time",
        read: true,
        write: false
      },
      this.getCurrentTime
    );
    await this.statesControler.setInternalState(
      "///date",
      await this.getCurrentTime(),
      true,
      {
        name: "",
        type: "number",
        role: "value.time",
        read: true,
        write: false
      },
      this.getCurrentTime
    );
    const newPanels = [];
    this.library.writedp(`panels`, void 0, import_definition.genericStateObjects.panel._channel);
    for (const panel of this.panels)
      if (await panel.isValid()) {
        newPanels.push(panel);
        await panel.init();
      } else {
        await panel.delete();
        this.log.error(`Panel ${panel.name} has a invalid configuration.`);
      }
    this.panels = newPanels;
    this.minuteLoop();
    this.dateUpdateLoop();
  }
  async delete() {
    if (this.minuteLoopTimeout)
      this.adapter.clearTimeout(this.minuteLoopTimeout);
    if (this.dateUpdateTimeout)
      this.adapter.clearTimeout(this.dateUpdateTimeout);
    await super.delete();
    for (const a of this.panels)
      await a.delete();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Controller
});
//# sourceMappingURL=controller.js.map
