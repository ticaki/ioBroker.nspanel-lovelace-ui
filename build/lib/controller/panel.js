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
var import_screensaver = require("../pages/screensaver");
var NSPanel = __toESM(require("../types/types"));
var pages = __toESM(require("../types/pages"));
var import_library = require("../classes/library");
var import_definition = require("../const/definition");
var import_pageMedia = require("../pages/pageMedia");
var import_pageGrid = require("../pages/pageGrid");
var import_navigation = require("../classes/navigation");
var import_pageThermo = require("../pages/pageThermo");
var import_pagePower = require("../pages/pagePower");
function isPanelConfig(F) {
  if (F.controller === void 0)
    return false;
  if (F.pages === void 0)
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
  timeout: 30,
  pages: []
};
class Panel extends import_library.BaseClass {
  minuteLoopTimeout;
  dateUpdateTimeout;
  pages = [];
  _activePage = void 0;
  screenSaver;
  InitDone = false;
  dimMode;
  navigation;
  format;
  controller;
  topic;
  reivCallbacks = [];
  _isOnline = false;
  panelSend;
  statesControler;
  config;
  timeout;
  CustomFormat;
  sendToTasmota = () => {
  };
  fName = "";
  constructor(adapter, options) {
    var _a, _b, _c;
    super(adapter, options.name);
    this.fName = options.name;
    this.panelSend = new import_panel_message.PanelSend(adapter, {
      name: `${options.name}-SendClass`,
      mqttClient: options.controller.mqttClient,
      topic: options.topic
    });
    this.timeout = options.timeout || 15;
    this.CustomFormat = (_a = options.CustomFormat) != null ? _a : "";
    this.config = options.config;
    this.format = Object.assign(DefaultOptions.format, options.format);
    this.controller = options.controller;
    this.topic = options.topic;
    if (typeof this.panelSend.addMessage === "function")
      this.sendToPanelClass = this.panelSend.addMessage;
    if (typeof this.panelSend.addMessageTasmota === "function")
      this.sendToTasmota = this.panelSend.addMessageTasmota;
    this.statesControler = options.controller.statesControler;
    this.dimMode = { low: (_b = options.dimLow) != null ? _b : 70, high: (_c = options.dimHigh) != null ? _c : 90 };
    let scsFound = 0;
    for (let a = 0; a < options.pages.length; a++) {
      const pageConfig = options.pages[a];
      if (!pageConfig)
        continue;
      switch (pageConfig.card) {
        case "cardChart": {
          break;
        }
        case "cardLChart": {
          break;
        }
        case "cardEntities": {
          const pmconfig = {
            card: pageConfig.card,
            panel: this,
            id: String(a),
            name: "PG",
            alwaysOn: pageConfig.alwaysOn,
            adapter: this.adapter,
            panelSend: this.panelSend,
            uniqueID: pageConfig.uniqueID
          };
          this.pages[a] = new import_pageGrid.PageGrid(pmconfig, pageConfig);
          break;
        }
        case "cardGrid2":
        case "cardGrid": {
          const pmconfig = {
            card: pageConfig.card,
            panel: this,
            id: String(a),
            name: "PG",
            alwaysOn: pageConfig.alwaysOn,
            adapter: this.adapter,
            panelSend: this.panelSend,
            uniqueID: pageConfig.uniqueID
          };
          this.pages[a] = new import_pageGrid.PageGrid(pmconfig, pageConfig);
          break;
        }
        case "cardThermo": {
          const pmconfig = {
            card: pageConfig.card,
            panel: this,
            id: String(a),
            name: "PM",
            alwaysOn: pageConfig.alwaysOn,
            adapter: this.adapter,
            panelSend: this.panelSend,
            uniqueID: pageConfig.uniqueID
          };
          this.pages[a] = new import_pageThermo.PageThermo(pmconfig, pageConfig);
          break;
        }
        case "cardMedia": {
          const pmconfig = {
            card: pageConfig.card,
            panel: this,
            id: String(a),
            name: "PM",
            alwaysOn: pageConfig.alwaysOn,
            adapter: this.adapter,
            panelSend: this.panelSend,
            uniqueID: pageConfig.uniqueID
          };
          this.pages[a] = new import_pageMedia.PageMedia(pmconfig, pageConfig);
          break;
        }
        case "cardUnlock": {
          break;
        }
        case "cardQR": {
          break;
        }
        case "cardAlarm": {
          break;
        }
        case "cardPower": {
          const pmconfig = {
            card: pageConfig.card,
            panel: this,
            id: String(a),
            name: "PM",
            alwaysOn: pageConfig.alwaysOn,
            adapter: this.adapter,
            panelSend: this.panelSend,
            uniqueID: pageConfig.uniqueID
          };
          this.pages[a] = new import_pagePower.PagePower(pmconfig, pageConfig);
          break;
        }
        case "screensaver":
        case "screensaver2": {
          if (scsFound++ > 0)
            continue;
          const ssconfig = {
            card: pageConfig.card,
            panel: this,
            id: String(a),
            name: "SrS",
            adapter: this.adapter,
            panelSend: this.panelSend,
            uniqueID: ""
          };
          this.screenSaver = new import_screensaver.Screensaver(ssconfig, pageConfig);
          break;
        }
      }
    }
    if (scsFound === 0 || this.screenSaver === void 0) {
      this.log.error("no screensaver found! Stop!");
      this.adapter.controller.delete();
      throw new Error("no screensaver found! Stop!");
      return;
    }
    const navConfig = {
      adapter: this.adapter,
      panel: this,
      navigationConfig: options.navigation
    };
    this.navigation = new import_navigation.Navigation(navConfig);
  }
  init = async () => {
    this.controller.mqttClient.subscript(this.topic + "/tele/#", this.onMessage);
    this.controller.mqttClient.subscript(this.topic + "/stat/#", this.onMessage);
    this.sendToTasmota(this.topic + "/cmnd/STATUS0", "");
  };
  start = async () => {
    this.adapter.subscribeStates(`panel.${this.name}.cmd.*`);
    import_definition.genericStateObjects.panel.panels._channel.common.name = this.fName;
    this.library.writedp(`panel.${this.name}`, void 0, import_definition.genericStateObjects.panel.panels._channel);
    this.library.writedp(
      `panel.${this.name}.cmd`,
      void 0 === "ON",
      import_definition.genericStateObjects.panel.panels.cmd._channel
    );
    for (const page of this.pages) {
      if (page)
        this.log.debug("init page " + page.uniqueID);
      if (page)
        await page.init();
    }
    this.sendToTasmota(this.topic + "/cmnd/POWER1", "");
    this.sendToTasmota(this.topic + "/cmnd/POWER2", "");
    this.navigation.init();
    this.sendToPanel("pageType~pageStartup", { retain: true });
  };
  sendToPanelClass = () => {
  };
  sendToPanel = (payload, opt) => {
    this.sendToPanelClass(payload, opt);
  };
  async setActivePage(_page, _notSleep) {
    if (_page === void 0)
      return;
    let page = this._activePage;
    let sleep = false;
    if (typeof _page === "boolean") {
      sleep = !_page;
    } else {
      page = _page;
      sleep = _notSleep != null ? _notSleep : false;
    }
    if (!this._activePage) {
      if (page === void 0)
        return;
      await page.setVisibility(true);
      this._activePage = page;
    } else if (sleep !== this._activePage.sleep || page !== this._activePage) {
      if (page != this._activePage) {
        if (this._activePage)
          await this._activePage.setVisibility(false);
        if (page) {
          if (!sleep)
            await page.setVisibility(true);
          page.sleep = sleep;
          this._activePage = page;
        }
      } else if (sleep !== this._activePage.sleep) {
        if (!sleep)
          await this._activePage.setVisibility(true, true);
        this._activePage.sleep = sleep;
      }
    }
  }
  getActivePage() {
    if (!this._activePage)
      throw new Error(`No active page here, check code!`);
    return this._activePage;
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
  registerOnMessage(fn) {
    if (this.reivCallbacks.indexOf(fn) === -1) {
      this.reivCallbacks.push(fn);
    }
  }
  onMessage = async (topic, message) => {
    for (const fn of this.reivCallbacks) {
      if (fn)
        fn(topic, message);
    }
    if (topic.endsWith(import_definition.ReiveTopicAppendix)) {
      const event = this.convertToEvent(message);
      if (event) {
        this.HandleIncomingMessage(event);
      }
    } else {
      const command = (topic.match(/[0-9a-zA-Z]+?\/[0-9a-zA-Z]+$/g) || [])[0];
      if (command) {
        switch (command) {
          case "stat/POWER2": {
            this.library.writedp(
              `panel.${this.name}.cmd.power2`,
              message === "ON",
              import_definition.genericStateObjects.panel.panels.cmd.power2
            );
            break;
          }
          case "stat/POWER1": {
            this.library.writedp(
              `panel.${this.name}.cmd.power1`,
              message === "ON",
              import_definition.genericStateObjects.panel.panels.cmd.power1
            );
            break;
          }
          case "stat/STATUS0": {
            const data = JSON.parse(message);
            this.name = this.library.cleandp(data.StatusNET.Mac, false, true);
            if (!this.InitDone) {
              this.sendToTasmota(
                this.topic + "/cmnd/Rule3",
                "ON CustomSend DO RuleTimer1 120 ENDON ON Rules#Timer=1 DO CustomSend pageType~pageStartup ENDON"
              );
              this.sendToTasmota(this.topic + "/cmnd/Rule3", "ON");
              this.InitDone = true;
              await this.start();
            }
            this.library.writedp(
              `panel.${this.name}.info`,
              void 0,
              import_definition.genericStateObjects.panel.panels.info._channel
            );
            this.library.writedp(
              `panel.${this.name}.info.status`,
              message,
              import_definition.genericStateObjects.panel.panels.info.status
            );
          }
        }
      }
    }
  };
  async onStateChange(id, state) {
    if (state.ack)
      return;
    if (id.split(".")[1] === this.name) {
      const cmd = id.replace(`panel.${this.name}.cmd.`, "");
      switch (cmd) {
        case "power1": {
          this.sendToTasmota(this.topic + "/cmnd/POWER1", state.val ? "ON" : "OFF");
          break;
        }
        case "power2": {
          this.sendToTasmota(this.topic + "/cmnd/POWER2", state.val ? "ON" : "OFF");
          break;
        }
      }
    }
  }
  sendScreeensaverTimeout(sec) {
    this.log.debug(`Set screeensaver timeout to ${sec}s.`);
    this.sendToPanel(`timeout~${sec}`);
  }
  restartLoops() {
    if (this.minuteLoopTimeout)
      this.adapter.clearTimeout(this.minuteLoopTimeout);
    if (this.dateUpdateTimeout)
      this.adapter.clearTimeout(this.dateUpdateTimeout);
    this.minuteLoop();
    this.dateUpdateLoop();
  }
  minuteLoop = () => {
    if (this.unload)
      return;
    this.sendToPanel(`time~${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`);
    this.pages = this.pages.filter((a) => a && !a.unload);
    const diff = 6e4 - Date.now() % 6e4 + 10;
    this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
  };
  dateUpdateLoop = () => {
    if (this.unload)
      return;
    const val = this.CustomFormat != "" ? (0, import_dayjs.default)().format(this.CustomFormat) : new Date().toLocaleDateString(this.config.locale, this.format);
    this.sendToPanel(`date~${val}`);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0);
    const diff = d.getTime() - Date.now();
    this.dateUpdateTimeout = this.adapter.setTimeout(this.dateUpdateLoop, diff);
  };
  async delete() {
    await super.delete();
    this.isOnline = false;
    if (this.minuteLoopTimeout)
      this.adapter.clearTimeout(this.minuteLoopTimeout);
    if (this.dateUpdateTimeout)
      this.adapter.clearTimeout(this.dateUpdateTimeout);
  }
  getPagebyUniqueID(uniqueID) {
    var _a;
    if (!uniqueID)
      return null;
    const index = this.pages.findIndex((a) => a && a.uniqueID && a.uniqueID === uniqueID);
    return (_a = this.pages[index]) != null ? _a : null;
  }
  async HandleIncomingMessage(event) {
    this.log.debug("Receive message:" + JSON.stringify(event));
    const index = this.pages.findIndex((a) => {
      if (a && a.card !== "screensaver" && a.card !== "screensaver2")
        return true;
      return false;
    });
    if (index === -1 || this.isOnline === false && event.method !== "startup")
      return;
    switch (event.method) {
      case "startup": {
        this.isOnline = true;
        if (this.screenSaver)
          await this.screenSaver.init();
        else
          return;
        this.restartLoops();
        this.sendScreeensaverTimeout(3);
        this.sendToPanel(`dimmode~${this.dimMode.low}~${this.dimMode.high}~6371`);
        this.navigation.resetPosition();
        const page = this.navigation.getCurrentPage();
        const test = false;
        if (test) {
          this.sendToPanel("pageType~cardGrid");
          this.sendToPanel(
            "entityUpd~Men\xFC~button~bPrev~\uE730~65535~~~button~bNext~\uE733~65535~~~button~navigate.SensorGrid~21.1~26095~Obergeschoss~PRESS~button~navigate.ObergeschossWindow~\uF1DB~64332~Obergeschoss~Obergeschoss~button~navigate.ogLightsGrid~\uE334~65363~Obergeschoss ACTUAL~PRESS~button~navigate.Alexa~\uF2A7~65222~test~PRESS"
          );
        } else {
          await this.setActivePage(page);
        }
        break;
      }
      case "sleepReached": {
        await this.setActivePage(this.screenSaver);
        this.navigation.resetPosition();
        break;
      }
      case "pageOpenDetail": {
        await this.setActivePage(false);
        this.getActivePage().onPopupRequest(
          event.id,
          event.popup,
          event.action,
          event.opt,
          event
        );
        break;
      }
      case "buttonPress2": {
        if (event.id == "screensaver") {
          await this.setActivePage(this.navigation.getCurrentPage());
        } else if (event.action === "bExit") {
          await this.setActivePage(true);
        } else {
          if (event.action === "button" && ["bNext", "bPrev", "bUp", "bHome", "bSubNext", "bSubPrev"].indexOf(event.id) != -1) {
            if (["bPrev", "bUp", "bSubPrev"].indexOf(event.id) != -1)
              this.navigation.goLeft();
            else if (["bNext", "bHome", "bSubNext"].indexOf(event.id) != -1)
              this.navigation.goRight();
            break;
          }
          this.getActivePage().onPopupRequest(
            event.id,
            event.popup,
            event.action,
            event.opt,
            event
          );
          await this.getActivePage().onButtonEvent(event);
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
  convertToEvent(msg) {
    var _a, _b, _c, _d;
    try {
      msg = (JSON.parse(msg) || {}).CustomRecv;
    } catch (e) {
      this.log.warn("Receive a broken msg from mqtt: " + msg);
    }
    if (msg === void 0)
      return null;
    const temp = msg.split(",");
    if (!NSPanel.isEventType(temp[0]))
      return null;
    if (!NSPanel.isEventMethod(temp[1]))
      return null;
    let popup = void 0;
    if (temp[1] === "pageOpenDetail")
      popup = temp.splice(2, 1)[0];
    const arr = String(temp[2]).split("?");
    if (arr[3])
      return {
        type: temp[0],
        method: temp[1],
        target: parseInt(arr[3]),
        page: parseInt(arr[1]),
        cmd: parseInt(arr[0]),
        popup,
        id: arr[2],
        action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
        opt: (_a = temp[4]) != null ? _a : ""
      };
    if (arr[2])
      return {
        type: temp[0],
        method: temp[1],
        page: parseInt(arr[0]),
        cmd: parseInt(arr[1]),
        popup,
        id: arr[2],
        action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
        opt: (_b = temp[4]) != null ? _b : ""
      };
    else if (arr[1])
      return {
        type: temp[0],
        method: temp[1],
        page: parseInt(arr[0]),
        popup,
        id: arr[1],
        action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
        opt: (_c = temp[4]) != null ? _c : ""
      };
    else
      return {
        type: temp[0],
        method: temp[1],
        popup,
        id: arr[0],
        action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
        opt: (_d = temp[4]) != null ? _d : ""
      };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Panel,
  isPanelConfig
});
//# sourceMappingURL=panel.js.map
