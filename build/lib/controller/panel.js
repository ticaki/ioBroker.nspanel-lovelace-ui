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
var panel_exports = {};
__export(panel_exports, {
  Panel: () => Panel,
  isPanelConfig: () => isPanelConfig
});
module.exports = __toCommonJS(panel_exports);
var import_panel_message = require("./panel-message");
var import_dayjs = __toESM(require("dayjs"));
var Screensaver = __toESM(require("../pages/screensaver"));
var NSPanel = __toESM(require("../types/types"));
var import_definition = require("../const/definition");
function isPanelConfig(F) {
  if (F.Controler === void 0)
    return false;
  if (F.screenSaverConfig === void 0)
    return false;
  if (F.topic === void 0)
    return false;
  if (F.name === void 0)
    return false;
  return true;
}
const DefaultOptions = {
  format: {
    weekday: "short",
    month: "short",
    year: "numeric",
    day: "numeric"
  },
  CustomFormat: "",
  locale: "de-DE",
  timeout: 3
};
class Panel extends import_panel_message.BaseClassPanelSend {
  minuteLoopTimeout;
  dateUpdateTimeout;
  options;
  screenSaver;
  reivCallbacks = [];
  _isOnline = false;
  constructor(adapter, options) {
    super(
      adapter,
      new import_panel_message.PanelSend(adapter, {
        name: `${options.name}-SendClass`,
        mqttClient: options.Controler.mqttClient,
        topic: options.topic
      }),
      options.name
    );
    this.panelSend.panel = this;
    const format = Object.assign(DefaultOptions.format, options.format);
    this.options = Object.assign(DefaultOptions, options, { format });
    this.screenSaver = new Screensaver.Screensaver(
      adapter,
      options.screenSaverConfig,
      this.panelSend,
      this.options.Controler.readOnlyDB
    );
  }
  get isOnline() {
    return this._isOnline;
  }
  set isOnline(s) {
    this._isOnline = s;
  }
  async isValid() {
    return true;
  }
  init = async () => {
    this.options.Controler.mqttClient.subscript(this.options.topic, this.onMessage);
    this.sendToPanel("pageType~pageStartup", { retain: true });
  };
  registerOnMessage(fn) {
    if (this.reivCallbacks.indexOf(fn) === -1) {
      this.reivCallbacks.push(fn);
    }
  }
  onMessage = async (topic, message) => {
    if (topic.endsWith(import_definition.SendTopicAppendix)) {
      this.log.debug(`Receive command ${topic} with ${message}`);
      return;
    }
    for (const fn of this.reivCallbacks) {
      if (fn)
        fn(topic, message);
    }
    if (topic.endsWith(import_definition.ReiveTopicAppendix)) {
      this.log.debug(`Receive message ${topic} with ${message}`);
      const event = NSPanel.convertToEvent(message);
      if (event) {
        this.HandleIncomingMessage(event);
      }
    }
  };
  sendScreeensaverTimeout(sec) {
    this.sendToPanel(`timeout~${sec}`);
  }
  minuteLoop = () => {
    if (this.unload)
      return;
    this.sendToPanel(`time~${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`);
    const diff = 6e4 - Date.now() % 6e4 + 10;
    this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
  };
  dateUpdateLoop = () => {
    if (this.unload)
      return;
    const val = this.options.CustomFormat != "" ? (0, import_dayjs.default)().format(this.options.CustomFormat) : new Date().toLocaleDateString(this.options.locale, this.options.format);
    this.sendToPanel(`date~${val}`);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0);
    const diff = d.getTime() - Date.now();
    this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
  };
  async delete() {
    await super.delete();
    this.isOnline = false;
    if (this.minuteLoopTimeout)
      this.adapter.clearTimeout(this.minuteLoopTimeout);
    if (this.dateUpdateTimeout)
      this.adapter.clearTimeout(this.dateUpdateTimeout);
  }
  HandleIncomingMessage(event) {
    switch (event.method) {
      case "startup": {
        this.isOnline = true;
        this.screenSaver.init();
        if (this.minuteLoopTimeout)
          this.adapter.clearTimeout(this.minuteLoopTimeout);
        if (this.dateUpdateTimeout)
          this.adapter.clearTimeout(this.dateUpdateTimeout);
        this.minuteLoop();
        this.dateUpdateLoop();
        this.sendScreeensaverTimeout(this.options.timeout);
        this.sendToPanel("dimmode~10~100~6371");
        this.sendToPanel("pageType~cardGrid");
        this.sendToPanel(
          "entityUpd~Men\xFC~button~bPrev~\uE730~65535~~~button~bNext~\uE733~65535~~~button~navigate.SensorGrid~21.1~26095~Obergeschoss~PRESS~button~navigate.ObergeschossWindow~\uF1DB~64332~Obergeschoss~Obergeschoss~button~navigate.ogLightsGrid~\uE334~65363~Obergeschoss ACTUAL~PRESS~button~navigate.Alexa~\uF2A7~65222~test~PRESS"
        );
        break;
      }
      case "sleepReached": {
        this.screenSaver.sendType();
        this.screenSaver.update();
        break;
      }
      case "pageOpenDetail": {
        break;
      }
      case "buttonPress2": {
        break;
      }
      case "renderCurrentPage": {
        break;
      }
      case "button1": {
        break;
      }
      case "button2": {
        break;
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Panel,
  isPanelConfig
});
//# sourceMappingURL=panel.js.map
