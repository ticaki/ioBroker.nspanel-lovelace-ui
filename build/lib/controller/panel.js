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
var import_screensaver = require("../pages/screensaver");
var Types = __toESM(require("../types/types"));
var pages = __toESM(require("../types/pages"));
var import_library = require("../classes/library");
var import_definition = require("../const/definition");
var import_Page = require("../classes/Page");
var import_pageMedia = require("../pages/pageMedia");
var import_pageGrid = require("../pages/pageGrid");
var import_navigation = require("../classes/navigation");
var import_pageThermo = require("../pages/pageThermo");
var import_pagePower = require("../pages/pagePower");
var import_pageEntities = require("../pages/pageEntities");
var import_tools = require("../const/tools");
var import_pageNotification = require("../pages/pageNotification");
var import_notifications = require("../const/notifications");
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
  pages: []
};
class Panel extends import_library.BaseClass {
  minuteLoopTimeout;
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
  persistentPageItems = {};
  info = {
    nspanel: {
      displayVersion: 0,
      model: "",
      bigIconLeft: false,
      bigIconRight: false,
      isOnline: false,
      currentPage: ""
    },
    tasmota: {
      net: {
        ip: "",
        gateway: "",
        dnsserver: "",
        subnetmask: "",
        hostname: "",
        mac: ""
      },
      uptime: "",
      wifi: { ssid: "", rssi: 0, downtime: "" }
    }
  };
  friendlyName = "";
  constructor(adapter, options) {
    var _a, _b, _c;
    super(adapter, options.name);
    this.friendlyName = options.name;
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
    options.pages = options.pages.concat(import_notifications.systemNotifications);
    let scsFound = 0;
    for (let a = 0; a < options.pages.length; a++) {
      let pageConfig = options.pages[a];
      if (!pageConfig)
        continue;
      const pmconfig = {
        card: pageConfig.card,
        panel: this,
        id: String(a),
        name: pageConfig.uniqueID,
        alwaysOn: pageConfig.alwaysOn,
        adapter: this.adapter,
        panelSend: this.panelSend,
        dpInit: pageConfig.dpInit
      };
      switch (pageConfig.card) {
        case "cardChart": {
          break;
        }
        case "cardLChart": {
          break;
        }
        case "cardEntities": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageEntities.PageEntities(pmconfig, pageConfig);
          break;
        }
        case "cardGrid2":
        case "cardGrid": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageGrid.PageGrid(pmconfig, pageConfig);
          break;
        }
        case "cardThermo": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageThermo.PageThermo(pmconfig, pageConfig);
          break;
        }
        case "cardMedia": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
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
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pagePower.PagePower(pmconfig, pageConfig);
          break;
        }
        case "cardBurnRec":
        case "cardItemSpecial":
          break;
        case "popupNotify2":
        case "popupNotify": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageNotification.PageNotify(pmconfig, pageConfig);
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
            dpInit: ""
          };
          this.screenSaver = new import_screensaver.Screensaver(ssconfig, pageConfig);
          this.pages[a] = this.screenSaver;
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
    this.isOnline = false;
  };
  start = async () => {
    this.adapter.subscribeStates(`panels.${this.name}.cmd.*`);
    import_definition.genericStateObjects.panel.panels._channel.common.name = this.friendlyName;
    await this.library.writedp(`panels.${this.name}`, void 0, import_definition.genericStateObjects.panel.panels._channel);
    await this.library.writedp(
      `panels.${this.name}.cmd`,
      void 0 === "ON",
      import_definition.genericStateObjects.panel.panels.cmd._channel
    );
    await this.library.writedp(
      `panels.${this.name}.alarm`,
      void 0 === "ON",
      import_definition.genericStateObjects.panel.panels.alarm._channel
    );
    let state = this.library.readdb(`panels.${this.name}.cmd.dimStandby`);
    if (state && state.val)
      this.dimMode.low = state.val;
    state = this.library.readdb(`panels.${this.name}.cmd.dimActive`);
    if (state && state.val)
      this.dimMode.high = state.val;
    this.library.writedp(
      `panels.${this.name}.cmd.dimStandby`,
      this.dimMode.low,
      import_definition.genericStateObjects.panel.panels.cmd.dimStandby
    );
    this.library.writedp(
      `panels.${this.name}.cmd.dimActive`,
      this.dimMode.high,
      import_definition.genericStateObjects.panel.panels.cmd.dimActive
    );
    for (const page2 of this.pages) {
      if (page2) {
        this.log.debug("init page " + page2.name);
        await page2.init();
      }
    }
    state = this.library.readdb(`panels.${this.name}.cmd.screensaverTimeout`);
    if (state) {
      this.timeout = parseInt(String(state.val));
    }
    this.library.writedp(
      `panels.${this.name}.cmd.screensaverTimeout`,
      this.timeout,
      import_definition.genericStateObjects.panel.panels.cmd.screensaverTimeout
    );
    this.navigation.init();
    const currentPage = this.library.readdb(`panels.${this.name}.cmd.mainPage`);
    if (currentPage && currentPage.val) {
      this.navigation.setMainPageByName(String(currentPage.val));
    }
    const states = this.navigation.buildCommonStates();
    const page = this.navigation.getCurrentMainPoint();
    this.library.writedp(`panels.${this.name}.cmd.mainPage`, page, {
      _id: "",
      type: "state",
      common: {
        name: "StateObjects.mainPage",
        type: "string",
        role: "value.text",
        read: true,
        write: true,
        states
      },
      native: {}
    });
    state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconLeft`);
    this.info.nspanel.bigIconLeft = state ? !!state.val : false;
    state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconRight`);
    this.info.nspanel.bigIconRight = state ? !!state.val : false;
    await this.statesControler.setInternalState(
      `${this.name}/cmd/screensaverTimeout`,
      this.timeout,
      true,
      (0, import_tools.getInternalDefaults)("number", "value"),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `${this.name}/cmd/dimStandby`,
      this.timeout,
      true,
      (0, import_tools.getInternalDefaults)("number", "value"),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `${this.name}/cmd/dimActive`,
      this.timeout,
      true,
      (0, import_tools.getInternalDefaults)("number", "value"),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `${this.name}/cmd/bigIconLeft`,
      true,
      true,
      (0, import_tools.getInternalDefaults)("boolean", "indicator"),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(
      `${this.name}/cmd/bigIconRight`,
      true,
      true,
      (0, import_tools.getInternalDefaults)("boolean", "indicator"),
      this.onInternalCommand
    );
    await this.statesControler.setInternalState(`${this.name}/cmd/power1`, false, true, {
      name: "power1",
      type: "boolean",
      write: false,
      read: true,
      role: "value"
    });
    await this.statesControler.setInternalState(`${this.name}/cmd/power2`, false, true, {
      name: "power1",
      type: "boolean",
      write: false,
      read: true,
      role: "value"
    });
    this.sendToTasmota(this.topic + "/cmnd/POWER1", "");
    this.sendToTasmota(this.topic + "/cmnd/POWER2", "");
    this.sendToPanel("pageType~pageStartup", { retain: true });
  };
  sendToPanelClass = () => {
  };
  sendToPanel = (payload, opt) => {
    this.sendToPanelClass(payload, opt);
  };
  async setActivePage(_page, _notSleep) {
    var _a, _b, _c;
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
      page.setLastPage((_a = this._activePage) != null ? _a : void 0);
      await page.setVisibility(true);
      this._activePage = page;
    } else if (sleep !== this._activePage.sleep || page !== this._activePage) {
      if (page != this._activePage) {
        if (this._activePage)
          await this._activePage.setVisibility(false);
        if (page) {
          page.setLastPage((_b = this._activePage) != null ? _b : void 0);
          if (!sleep)
            await page.setVisibility(true);
          page.sleep = sleep;
          this._activePage = page;
        }
      } else if (sleep !== this._activePage.sleep) {
        page.setLastPage((_c = this._activePage) != null ? _c : void 0);
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
    this.info.nspanel.isOnline = s;
    if (s !== this._isOnline) {
      this.library.writedp(
        `panels.${this.name}.info.nspanel.isOnline`,
        s,
        import_definition.genericStateObjects.panel.panels.info.nspanel.isOnline
      );
      if (s) {
        this.log.info("is online!");
      } else {
        this.log.warn("is offline!");
      }
    }
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
              `panels.${this.name}.cmd.power2`,
              message === "ON",
              import_definition.genericStateObjects.panel.panels.cmd.power2
            );
            this.statesControler.setInternalState(`${this.name}/cmd/power2`, message === "ON", true);
            break;
          }
          case "stat/POWER1": {
            this.library.writedp(
              `panels.${this.name}.cmd.power1`,
              message === "ON",
              import_definition.genericStateObjects.panel.panels.cmd.power1
            );
            this.statesControler.setInternalState(`${this.name}/cmd/power1`, message === "ON", true);
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
              await this.start();
              this.InitDone = true;
            }
            this.library.writedp(
              `panels.${this.name}.info`,
              void 0,
              import_definition.genericStateObjects.panel.panels.info._channel
            );
            this.library.writedp(
              `panels.${this.name}.info.status`,
              message,
              import_definition.genericStateObjects.panel.panels.info.status
            );
            this.info.tasmota.net = {
              ip: data.StatusNET.IPAddress,
              gateway: data.StatusNET.Gateway,
              dnsserver: data.StatusNET.DNSServer1,
              subnetmask: data.StatusNET.Subnetmask,
              hostname: data.StatusNET.Hostname,
              mac: data.StatusNET.Mac
            };
            this.info.tasmota.uptime = data.StatusSTS.Uptime;
            this.info.tasmota.wifi = {
              ssid: data.StatusSTS.Wifi.SSId,
              rssi: data.StatusSTS.Wifi.RSSI,
              downtime: data.StatusSTS.Wifi.Downtime
            };
            await this.library.writeFromJson(
              `panels.${this.name}.info.tasmota`,
              "panel.panels.info.tasmota",
              import_definition.genericStateObjects,
              this.info.tasmota
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
      const cmd = id.replace(`panels.${this.name}.cmd.`, "");
      switch (cmd) {
        case "power1": {
          this.sendToTasmota(this.topic + "/cmnd/POWER1", state.val ? "ON" : "OFF");
          break;
        }
        case "power2": {
          this.sendToTasmota(this.topic + "/cmnd/POWER2", state.val ? "ON" : "OFF");
          break;
        }
        case "mainPage": {
          this.navigation.setMainPageByName(state.val ? String(state.val) : "main");
          this.library.writedp(`panels.${this.name}.cmd.mainPage`, state.val ? String(state.val) : "main");
          break;
        }
        case "screensaverTimeout": {
          this.statesControler.setInternalState(
            `${this.name}/cmd/screensaverTimeout`,
            parseInt(String(state.val)),
            false
          );
          break;
        }
        case "dimStandby": {
          this.statesControler.setInternalState(
            `${this.name}/cmd/dimStandby`,
            parseInt(String(state.val)),
            false
          );
          break;
        }
        case "dimActive": {
          this.statesControler.setInternalState(
            `${this.name}/cmd/dimActive`,
            parseInt(String(state.val)),
            false
          );
          break;
        }
      }
    }
  }
  sendScreeensaverTimeout(sec) {
    this.log.debug(`Set screeensaver timeout to ${sec}s.`);
    this.sendToPanel(`timeout~${sec}`);
  }
  sendDimmode() {
    this.sendToPanel(`dimmode~${this.dimMode.low}~${this.dimMode.high}~` + String(1));
  }
  restartLoops() {
    if (this.minuteLoopTimeout)
      this.adapter.clearTimeout(this.minuteLoopTimeout);
    this.minuteLoop();
  }
  minuteLoop = () => {
    if (this.unload)
      return;
    this.pages = this.pages.filter((a) => a && !a.unload);
    const diff = 6e4 - Date.now() % 6e4 + 10;
    this.minuteLoopTimeout = this.adapter.setTimeout(this.minuteLoop, diff);
  };
  async delete() {
    await super.delete();
    await this.library.writedp(
      `panels.${this.name}.info.nspanel.isOnline`,
      false,
      import_definition.genericStateObjects.panel.panels.info.nspanel.isOnline
    );
    for (const a of this.pages)
      if (a)
        await a.delete();
    this.isOnline = false;
    this.persistentPageItems = {};
    if (this.minuteLoopTimeout)
      this.adapter.clearTimeout(this.minuteLoopTimeout);
  }
  getPagebyUniqueID(uniqueID) {
    var _a;
    if (!uniqueID)
      return null;
    const index = this.pages.findIndex((a) => a && a.name && a.name === uniqueID);
    return (_a = this.pages[index]) != null ? _a : null;
  }
  async HandleIncomingMessage(event) {
    if (!this.InitDone)
      return;
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
        this.info.nspanel.displayVersion = parseInt(event.id);
        this.info.nspanel.model = event.action;
        await this.library.writeFromJson(
          `panels.${this.name}.info`,
          "panel.panels.info",
          import_definition.genericStateObjects,
          this.info
        );
        this.restartLoops();
        this.sendToPanel(`dimmode~${this.dimMode.low}~${this.dimMode.high}~` + String(1));
        this.navigation.resetPosition();
        const i = this.pages.findIndex((a) => a && a.name === "///WelcomePopup");
        const popup = i !== -1 ? this.pages[i] : void 0;
        if (popup)
          await this.setActivePage(popup);
        if (this.screenSaver) {
          this.screenSaver.HandleDate();
          this.screenSaver.HandleTime();
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
        } else if (event.action === "bExit" && event.id !== "popupNotify") {
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
  onInternalCommand = async (id, state) => {
    if (!id.startsWith(this.name))
      return null;
    const token = id.split("/").pop();
    if (state && !state.ack && state.val !== null) {
      switch (token) {
        case "power1": {
          this.sendToTasmota(this.topic + "/cmnd/POWER1", state.val ? "ON" : "OFF");
          break;
        }
        case "power2": {
          this.sendToTasmota(this.topic + "/cmnd/POWER2", state.val ? "ON" : "OFF");
          break;
        }
        case "bigIconLeft": {
          this.info.nspanel.bigIconLeft = !!state.val;
          this.screenSaver && this.screenSaver.HandleScreensaverStatusIcons();
          this.statesControler.setInternalState(`${this.name}/cmd/bigIconLeft`, !!state.val, true);
          this.library.writeFromJson(
            `panels.${this.name}.info`,
            "panel.panels.info",
            import_definition.genericStateObjects,
            this.info
          );
          break;
        }
        case "bigIconRight": {
          this.info.nspanel.bigIconRight = !!state.val;
          this.screenSaver && this.screenSaver.HandleScreensaverStatusIcons();
          this.statesControler.setInternalState(`${this.name}/cmd/bigIconRight`, !!state.val, true);
          this.library.writeFromJson(
            `panels.${this.name}.info`,
            "panel.panels.info",
            import_definition.genericStateObjects,
            this.info
          );
          break;
        }
        case "screensaverTimeout": {
          if (typeof state.val !== "boolean") {
            const val = parseInt(String(state.val));
            this.timeout = val;
            this.sendScreeensaverTimeout(this.timeout);
            this.statesControler.setInternalState(`${this.name}/cmd/screensaverTimeout`, val, true);
            this.library.writedp(`panels.${this.name}.cmd.screensaverTimeout`, this.timeout);
          }
          break;
        }
        case "dimStandby": {
          const val = parseInt(String(state.val));
          this.dimMode.low = val;
          this.sendDimmode();
          this.library.writedp(`panels.${this.name}.cmd.dimStandby`, this.dimMode.low);
          break;
        }
        case "dimActive": {
          const val = parseInt(String(state.val));
          this.dimMode.high = val;
          this.sendDimmode();
          this.library.writedp(`panels.${this.name}.cmd.dimActive`, this.dimMode.high);
          break;
        }
      }
      this.statesControler.setInternalState(id, state.val, true);
    } else if (!state) {
      switch (token) {
        case "bigIconLeft": {
          return this.info.nspanel.bigIconLeft;
        }
        case "bigIconRight": {
          return this.info.nspanel.bigIconRight;
        }
        case "screensaverTimeout": {
          return this.timeout;
        }
        case "dimStandby": {
          return this.dimMode.low;
        }
        case "dimActive": {
          return this.dimMode.high;
        }
      }
    }
    return null;
  };
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
    if (!Types.isEventType(temp[0]))
      return null;
    if (!Types.isEventMethod(temp[1]))
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
