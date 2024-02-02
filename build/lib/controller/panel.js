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
var pages = __toESM(require("../types/pages"));
var import_definition = require("../const/definition");
var import_config = require("../config");
var import_pageMedia = require("../pages/pageMedia");
function isPanelConfig(F) {
  if (F.controller === void 0)
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
  timeout: 30
};
class Panel extends import_panel_message.BaseClassPanelSend {
  minuteLoopTimeout;
  dateUpdateTimeout;
  options;
  screenSaver;
  reivCallbacks = [];
  _isOnline = false;
  readOnlyDB;
  _activePage = { page: null };
  async setActivePage(_page, _notSleep) {
    if (_page === void 0)
      return;
    let page = this._activePage.page;
    let sleep = false;
    if (typeof _page === "boolean") {
      sleep = !_page;
    } else {
      page = _page;
      sleep = _notSleep != null ? _notSleep : false;
    }
    if (sleep == !this._activePage.sleep || page != this._activePage.page) {
      if (page != this._activePage.page) {
        if (this._activePage.page)
          this._activePage.page.setVisibility(false);
        if (page && !sleep)
          page.setVisibility(true);
        this._activePage = { page, sleep };
      } else if (sleep == !this._activePage.sleep) {
        if (this._activePage.page && !sleep)
          this._activePage.page.setVisibility(true, true);
        this._activePage.sleep = sleep;
      }
    }
  }
  getActivePage() {
    if (!this._activePage.page)
      throw new Error(`No active page here, check code!`);
    return this._activePage.page;
  }
  test;
  constructor(adapter, options) {
    const config = {
      name: options.name,
      adapter,
      panelSend: new import_panel_message.PanelSend(adapter, {
        name: `${options.name}-SendClass`,
        mqttClient: options.controller.mqttClient,
        topic: options.topic
      })
    };
    super(config);
    this.readOnlyDB = options.controller.readOnlyDB;
    this.panelSend.panel = this;
    const format = Object.assign(DefaultOptions.format, options.format);
    this.options = Object.assign(DefaultOptions, options, { format });
    let ssconfig = {
      card: "screensaver",
      panel: this,
      id: 0,
      name: "SrS",
      adapter: this.adapter,
      panelSend: this.panelSend
    };
    this.screenSaver = new Screensaver.Screensaver(ssconfig, options.screenSaverConfig, this.readOnlyDB);
    ssconfig = {
      card: import_config.testConfigMedia.card,
      panel: this,
      id: 1,
      name: "PM",
      adapter: this.adapter,
      panelSend: this.panelSend
    };
    this.test = new import_pageMedia.PageMedia(ssconfig, import_config.testConfigMedia);
    this.test.init();
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
    this.options.controller.mqttClient.subscript(this.options.topic, this.onMessage);
    this.sendToPanel("pageType~pageStartup", { retain: true });
  };
  registerOnMessage(fn) {
    if (this.reivCallbacks.indexOf(fn) === -1) {
      this.reivCallbacks.push(fn);
    }
  }
  onMessage = async (topic, message) => {
    if (topic.endsWith(import_definition.SendTopicAppendix)) {
      return;
    }
    for (const fn of this.reivCallbacks) {
      if (fn)
        fn(topic, message);
    }
    if (topic.endsWith(import_definition.ReiveTopicAppendix)) {
      const event = pages.convertToEvent(message);
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
  async HandleIncomingMessage(event) {
    this.log.debug(JSON.stringify(event));
    switch (event.method) {
      case "startup": {
        this.isOnline = true;
        await this.screenSaver.init();
        if (this.minuteLoopTimeout)
          this.adapter.clearTimeout(this.minuteLoopTimeout);
        if (this.dateUpdateTimeout)
          this.adapter.clearTimeout(this.dateUpdateTimeout);
        this.minuteLoop();
        this.dateUpdateLoop();
        this.sendScreeensaverTimeout(this.options.timeout);
        this.sendToPanel("dimmode~80~100~6371");
        const test = false;
        if (test) {
          this.sendToPanel("pageType~cardGrid");
          this.sendToPanel(
            "entityUpd~Men\xFC~button~bPrev~\uE730~65535~~~button~bNext~\uE733~65535~~~button~navigate.SensorGrid~21.1~26095~Obergeschoss~PRESS~button~navigate.ObergeschossWindow~\uF1DB~64332~Obergeschoss~Obergeschoss~button~navigate.ogLightsGrid~\uE334~65363~Obergeschoss ACTUAL~PRESS~button~navigate.Alexa~\uF2A7~65222~test~PRESS"
          );
        } else {
          await this.setActivePage(this.test);
        }
        break;
      }
      case "sleepReached": {
        await this.setActivePage(this.screenSaver);
        break;
      }
      case "pageOpenDetail": {
        await this.setActivePage(false);
        break;
      }
      case "buttonPress2": {
        if (event.mode == "screensaver") {
          await this.setActivePage(this.test);
        } else {
          this.getActivePage().onButtonEvent(event);
          await this.setActivePage(true);
        }
        break;
      }
      case "renderCurrentPage": {
        break;
      }
      case "button1": {
        this.screenSaver.setVisibility(false);
        break;
      }
      case "button2": {
        this.screenSaver.setVisibility(false);
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
