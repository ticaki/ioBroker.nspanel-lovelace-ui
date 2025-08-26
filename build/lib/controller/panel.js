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
var panel_exports = {};
__export(panel_exports, {
  Panel: () => Panel
});
module.exports = __toCommonJS(panel_exports);
var import_panel_message = require("./panel-message");
var import_screensaver = require("../pages/screensaver");
var Types = __toESM(require("../types/types"));
var pages = __toESM(require("../types/pages"));
var import_library = require("../classes/library");
var definition = __toESM(require("../const/definition"));
var import_pageMedia = require("../pages/pageMedia");
var import_pageGrid = require("../pages/pageGrid");
var import_navigation = require("../classes/navigation");
var import_pageThermo = require("../pages/pageThermo");
var import_pagePower = require("../pages/pagePower");
var import_pageEntities = require("../pages/pageEntities");
var import_pageNotification = require("../pages/pageNotification");
var import_system_templates = require("../templates/system-templates");
var import_pageAlarm = require("../pages/pageAlarm");
var import_pageQR = require("../pages/pageQR");
var import_data_item = require("../classes/data-item");
var import_Color = require("../const/Color");
var import_pageSchedule = require("../pages/pageSchedule");
var import_card = require("../templates/card");
var import_tools = require("../const/tools");
var import_pageChartBar = require("../pages/pageChartBar");
var import_pageChartLine = require("../pages/pageChartLine");
var import_axios = __toESM(require("axios"));
var import_pageThermo2 = require("../pages/pageThermo2");
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
  loopTimeout;
  pages = [];
  _activePage = void 0;
  data = {};
  blockStartup = null;
  _isOnline = false;
  options;
  flashing = false;
  screenSaver;
  lastCard = "";
  notifyIndex = -1;
  initDone = false;
  lightPopupV2 = true;
  //  Enable Light Popup v2, created in 2025.
  overrideLightPopup = true;
  //  Override light popup config type.
  hideCards = false;
  buttons;
  navigation;
  format;
  controller;
  topic;
  reivCallbacks = [];
  panelSend;
  statesControler;
  config;
  CustomFormat;
  sendToTasmota = () => {
  };
  timeout;
  dim = {
    standby: definition.genericStateObjects.panel.panels.cmd.dim.standby.common.def,
    active: definition.genericStateObjects.panel.panels.cmd.dim.active.common.def,
    dayMode: definition.genericStateObjects.panel.panels.cmd.dim.dayMode.common.def,
    nightStandby: definition.genericStateObjects.panel.panels.cmd.dim.nightStandby.common.def,
    nightActive: definition.genericStateObjects.panel.panels.cmd.dim.nightActive.common.def,
    nightHourStart: definition.genericStateObjects.panel.panels.cmd.dim.nightHourStart.common.def,
    nightHourEnd: definition.genericStateObjects.panel.panels.cmd.dim.nightHourEnd.common.def,
    schedule: definition.genericStateObjects.panel.panels.cmd.dim.schedule.common.def
  };
  screenSaverDoubleClick = true;
  detach = { left: false, right: false };
  persistentPageItems = {};
  info = {
    isOnline: false,
    nspanel: {
      displayVersion: "",
      model: "",
      bigIconLeft: false,
      bigIconRight: false,
      onlineVersion: "",
      firmwareUpdate: 100,
      berryDriverVersion: 0,
      berryDriverVersionOnline: 0,
      currentPage: ""
    },
    tasmota: {
      firmwareversion: "",
      onlineVersion: "",
      safeboot: false,
      mqttClient: "",
      net: {
        Hostname: "",
        IPAddress: "",
        Gateway: "",
        Subnetmask: "",
        DNSServer1: "",
        DNSServer2: "",
        Mac: "",
        IP6Global: "",
        IP6Local: "",
        Ethernet: {
          Hostname: "",
          IPAddress: "",
          Gateway: "",
          Subnetmask: "",
          DNSServer1: "",
          DNSServer2: "",
          Mac: "",
          IP6Global: "",
          IP6Local: ""
        },
        Webserver: 0,
        HTTP_API: 0,
        WifiConfig: 0,
        WifiPower: 0
      },
      uptime: "",
      sts: {
        Time: "",
        Uptime: "",
        UptimeSec: 0,
        Heap: 0,
        SleepMode: "",
        Sleep: 0,
        LoadAvg: 0,
        MqttCount: 0,
        Berry: {
          HeapUsed: 0,
          Objects: 0
        },
        POWER1: "",
        POWER2: "",
        Wifi: {
          AP: 0,
          SSId: "",
          BSSId: "",
          Channel: 0,
          Mode: "",
          RSSI: 0,
          Signal: 0,
          LinkCount: 0,
          Downtime: ""
        }
      }
    }
  };
  meetsVersion(version) {
    var _a, _b;
    if ((_b = (_a = this.info) == null ? void 0 : _a.nspanel) == null ? void 0 : _b.displayVersion) {
      return (0, import_tools.isVersionGreaterOrEqual)(this.info.nspanel.displayVersion, version);
    }
    return false;
  }
  constructor(adapter, options) {
    var _a, _b;
    super(adapter, options.name, (_a = options.friendlyName) != null ? _a : options.name);
    this.panelSend = new import_panel_message.PanelSend(adapter, {
      name: `${this.friendlyName}-SendClass`,
      mqttClient: options.controller.mqttClient,
      topic: options.topic,
      panel: this
    });
    this.info.tasmota.mqttClient = this.library.cleandp(this.name);
    this.options = options;
    this.timeout = options.timeout || 15;
    this.buttons = options.buttons;
    this.CustomFormat = (_b = options.CustomFormat) != null ? _b : "";
    this.config = options.config;
    this.format = Object.assign(DefaultOptions.format, options.format);
    this.controller = options.controller;
    this.topic = options.topic;
    if (typeof this.panelSend.addMessage === "function") {
      this.sendToPanelClass = this.panelSend.addMessage;
    }
    if (typeof this.panelSend.addMessageTasmota === "function") {
      this.sendToTasmota = this.panelSend.addMessageTasmota;
    }
    this.statesControler = options.controller.statesControler;
    options.pages = options.pages.filter((b) => {
      var _a2, _b2, _c;
      if (((_a2 = b.config) == null ? void 0 : _a2.card) === "screensaver" || ((_b2 = b.config) == null ? void 0 : _b2.card) === "screensaver2" || ((_c = b.config) == null ? void 0 : _c.card) === "screensaver3") {
        return true;
      }
      if (options.navigation.find((c) => c && c.name === b.uniqueID)) {
        return true;
      }
      return false;
    });
    options.pages = options.pages.concat(import_system_templates.systemPages);
    options.navigation = (options.navigation || []).concat(import_system_templates.systemNavigation);
    let scsFound = 0;
    for (let a = 0; a < options.pages.length; a++) {
      let pageConfig = options.pages[a] ? Panel.getPage(options.pages[a], this) : options.pages[a];
      if (!pageConfig || !pageConfig.config) {
        continue;
      }
      const pmconfig = {
        card: pageConfig.config.card,
        panel: this,
        id: String(a),
        name: `${pageConfig.uniqueID}`,
        alwaysOn: pageConfig.alwaysOn,
        adapter: this.adapter,
        panelSend: this.panelSend,
        hidden: pageConfig.hidden || false,
        dpInit: pageConfig.dpInit
      };
      switch (pageConfig.config.card) {
        case "cardChart": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageChartBar.PageChartBar(pmconfig, pageConfig);
          break;
        }
        case "cardLChart": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageChartLine.PageChartLine(pmconfig, pageConfig);
          break;
        }
        case "cardEntities": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageEntities.PageEntities(pmconfig, pageConfig);
          break;
        }
        case "cardSchedule": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageSchedule.PageSchedule(pmconfig, pageConfig);
          break;
        }
        case "cardGrid3":
        case "cardGrid2":
        case "cardGrid": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageGrid.PageGrid(pmconfig, pageConfig);
          break;
        }
        case "cardThermo": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageThermo.PageThermo(pmconfig, pageConfig);
          break;
        }
        case "cardThermo2": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageThermo2.PageThermo2(pmconfig, pageConfig);
          break;
        }
        case "cardMedia": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageMedia.PageMedia(pmconfig, pageConfig);
          break;
        }
        case "cardQR": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageQR.PageQR(pmconfig, pageConfig);
          break;
        }
        case "cardAlarm": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageAlarm.PageAlarm(pmconfig, pageConfig);
          break;
        }
        case "cardPower": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pagePower.PagePower(pmconfig, pageConfig);
          break;
        }
        case "popupNotify2":
        case "popupNotify": {
          pageConfig = Panel.getPage(pageConfig, this);
          this.pages[a] = new import_pageNotification.PageNotify(pmconfig, pageConfig);
          break;
        }
        case "screensaver":
        case "screensaver2":
        case "screensaver3": {
          scsFound++;
          const ssconfig = {
            card: pageConfig.config.card,
            panel: this,
            id: String(a),
            name: `${pageConfig.uniqueID}`,
            adapter: this.adapter,
            panelSend: this.panelSend,
            dpInit: ""
          };
          this.screenSaver = new import_screensaver.Screensaver(ssconfig, pageConfig);
          this.pages[a] = this.screenSaver;
          break;
        }
        default: {
          this.log.error(`Page config is missing card property for page ${pageConfig.uniqueID}`);
        }
      }
    }
    if (scsFound === 0) {
      this.log.error("no screensaver found! Stop!");
      void this.adapter.controller.delete();
      throw new Error("no screensaver found! Stop!");
    }
    const navConfig = {
      adapter: this.adapter,
      panel: this,
      navigationConfig: options.navigation
    };
    this.navigation = new import_navigation.Navigation(navConfig);
  }
  init = async () => {
    var _a, _b;
    if (this.unload) {
      return;
    }
    this.log.debug(`Panel ${this.name} is initialised!`);
    await this.controller.mqttClient.subscript(`${this.topic}/tele/#`, this.onMessage);
    await this.controller.mqttClient.subscript(`${this.topic}/stat/#`, this.onMessage);
    this.isOnline = false;
    const channelObj = this.library.cloneObject(definition.genericStateObjects.panel.panels._channel);
    channelObj.common.name = this.friendlyName;
    channelObj.native = {
      topic: this.topic,
      tasmotaName: this.friendlyName,
      name: this.name
      //configName: this.configName,
    };
    if (await this.adapter.getStateAsync(`panels.${this.name}.cmd.dim.delay`)) {
      await this.adapter.delObjectAsync(`panels.${this.name}.cmd.dim.delay`);
    }
    await this.library.writedp(`panels.${this.name}`, void 0, channelObj);
    await this.library.writedp(
      `panels.${this.name}.cmd`,
      void 0,
      definition.genericStateObjects.panel.panels.cmd._channel
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.dim`,
      void 0,
      definition.genericStateObjects.panel.panels.cmd.dim._channel
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver`,
      void 0,
      definition.genericStateObjects.panel.panels.cmd.screenSaver._channel
    );
    await this.library.writedp(
      `panels.${this.name}.buttons`,
      void 0,
      definition.genericStateObjects.panel.panels.buttons._channel
    );
    await this.library.writedp(
      `panels.${this.name}.buttons.left`,
      true,
      definition.genericStateObjects.panel.panels.buttons.left
    );
    await this.library.writedp(
      `panels.${this.name}.buttons.right`,
      true,
      definition.genericStateObjects.panel.panels.buttons.right
    );
    const keys = Object.keys(this.dim);
    for (const d of keys) {
      const key = d;
      const state2 = this.library.readdb(`panels.${this.name}.cmd.dim.${key}`);
      if (state2 && state2.val != null && key in this.dim && typeof state2.val === typeof this.dim[key]) {
        this.dim[key] = state2.val;
      }
      await this.library.writedp(
        `panels.${this.name}.cmd.dim.${key}`,
        this.dim[key],
        definition.genericStateObjects.panel.panels.cmd.dim[key]
      );
    }
    let state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.doubleClick`);
    if (state && state.val != null) {
      this.screenSaverDoubleClick = !!state.val;
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.doubleClick`,
      this.screenSaverDoubleClick,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.doubleClick
    );
    if (state && !state.val) {
      await this.library.writedp(
        `panels.${this.name}.buttons.screensaverGesture`,
        0,
        definition.genericStateObjects.panel.panels.buttons.screensaverGesture
      );
    } else {
      await this.library.writedp(
        `panels.${this.name}.buttons.screensaverGesture`,
        void 0,
        definition.genericStateObjects.panel.panels.buttons.screensaverGesture
      );
    }
    state = this.library.readdb(`panels.${this.name}.cmd.hideCards`);
    if (state && state.val != null) {
      this.hideCards = !!state.val;
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.hideCards`,
      this.hideCards,
      definition.genericStateObjects.panel.panels.cmd.hideCards
    );
    state = this.library.readdb(`panels.${this.name}.cmd.detachRight`);
    if (state && state.val != null) {
      this.detach.right = !!state.val;
    }
    state = this.library.readdb(`panels.${this.name}.cmd.detachLeft`);
    if (state && state.val != null) {
      this.detach.left = !!state.val;
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.detachRight`,
      this.detach.right,
      definition.genericStateObjects.panel.panels.cmd.detachRight
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.detachLeft`,
      this.detach.left,
      definition.genericStateObjects.panel.panels.cmd.detachLeft
    );
    state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.timeout`);
    if (state) {
      this.timeout = parseInt(String(state.val));
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.timeout`,
      this.timeout,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.timeout
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.headingNotification`,
      void 0,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.headingNotification
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.textNotification`,
      void 0,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.textNotification
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.activateNotification`,
      false,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.activateNotification
    );
    state = this.library.readdb(`panels.${this.name}.info.nspanel.firmwareUpdate`);
    await this.library.writedp(
      `panels.${this.name}.info.nspanel.firmwareUpdate`,
      state && typeof state.val === "number" ? state.val >= 99 ? 100 : state.val : void 0,
      definition.genericStateObjects.panel.panels.info.nspanel.firmwareUpdate
    );
    for (const id in definition.InternalStates.panel) {
      const obj = definition.InternalStates.panel[id];
      await this.statesControler.setInternalState(
        `${this.name}/${id}`,
        obj.val,
        obj.ack,
        obj.common,
        obj.noTrigger ? void 0 : this.onInternalCommand
      );
    }
    for (const page of this.pages) {
      if (page && page.name) {
        if (this.adapter.config.debugLogPages) {
          this.log.debug(
            `Initialisation of page ${page.name} - card: ${page.card} - pageItems: ${(page.pageItemConfig || []).length}`
          );
        }
        await page.init();
      } else {
        this.log.error("Page failed or has no name!");
      }
    }
    this.navigation.init();
    this.adapter.subscribeStates(`panels.${this.name}.cmd.*`);
    this.adapter.subscribeStates(`panels.${this.name}.alarm.*`);
    if (this.adapter.config.debugLogPages) {
      this.log.debug(`Panel ${this.name} is initialised!`);
    }
    {
      const currentPage = this.library.readdb(`panels.${this.name}.cmd.mainNavigationPoint`);
      if (currentPage && currentPage.val) {
        this.navigation.setMainPageByName(String(currentPage.val));
      }
      definition.genericStateObjects.panel.panels.cmd.mainNavigationPoint.common.states = this.navigation.buildCommonStates();
      const page = this.navigation.getCurrentMainPoint();
      await this.library.writedp(
        `panels.${this.name}.cmd.mainNavigationPoint`,
        page,
        definition.genericStateObjects.panel.panels.cmd.mainNavigationPoint
      );
    }
    const currentScreensaver = this.library.readdb(`panels.${this.name}.cmd.screenSaver.layout`);
    const scs = this.pages.filter(
      (a) => a && (a.card === "screensaver" || a.card === "screensaver2" || a.card === "screensaver3")
    );
    if (currentScreensaver && currentScreensaver.val != null) {
      if (scs && scs[0]) {
        this.screenSaver = scs[0];
        if (pages.isScreenSaverModeAsNumber(currentScreensaver.val)) {
          this.screenSaver.overwriteModel(currentScreensaver.val, true);
        }
      }
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.layout`,
      this.screenSaver && this.screenSaver.mode ? import_screensaver.Screensaver.mapModeToNumber(this.screenSaver.mode) : 0,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.layout
    );
    state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.rotationTime`);
    let temp = 0;
    if (state && typeof state.val === "number") {
      temp = state.val === 0 ? state.val : state.val < 3 ? 3 : state.val > 3600 ? 3600 : state.val;
      if (this.screenSaver) {
        this.screenSaver.rotationTime = temp * 1e3;
      }
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.rotationTime`,
      temp,
      definition.genericStateObjects.panel.panels.cmd.screenSaver.rotationTime
    );
    state = this.library.readdb(`panels.${this.name}.cmd.screenSaver.infoIcon`);
    if (state && typeof state.val === "string" && this.screenSaver) {
      this.screenSaver.infoIcon = state.val;
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.screenSaver.infoIcon`,
      (_b = (_a = this.screenSaver) == null ? void 0 : _a.infoIcon) != null ? _b : "",
      definition.genericStateObjects.panel.panels.cmd.screenSaver.infoIcon
    );
    if (this.buttons) {
      for (const b in this.buttons) {
        const k = b;
        const button = this.buttons[k];
        if (button && this.screenSaver) {
          switch (button.mode) {
            case "page": {
              break;
            }
            case "switch":
            case "button": {
              if (typeof button.state === "string") {
                button.state = new import_data_item.Dataitem(
                  this.adapter,
                  {
                    type: "state",
                    dp: button.state
                  },
                  this.screenSaver,
                  this.statesControler
                );
                if (!await button.state.isValidAndInit()) {
                  this.buttons[k] = null;
                }
              }
              break;
            }
          }
        }
      }
    }
    state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconLeft`);
    this.info.nspanel.bigIconLeft = state ? !!state.val : false;
    state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconRight`);
    this.info.nspanel.bigIconRight = state ? !!state.val : false;
    this.initDone = true;
    this.restartLoops();
  };
  sendToPanelClass = () => {
  };
  sendToPanel = (payload, ackForType, opt) => {
    this.sendToPanelClass(payload, ackForType, opt);
  };
  async setActivePage(_page, _notSleep) {
    var _a, _b, _c;
    if (_page === void 0) {
      return;
    }
    let page = this._activePage;
    let sleep = false;
    if (typeof _page === "boolean") {
      sleep = !_page;
    } else {
      page = _page;
      sleep = _notSleep != null ? _notSleep : false;
    }
    if (!this._activePage) {
      if (page === void 0) {
        return;
      }
      page.setLastPage((_a = this._activePage) != null ? _a : void 0);
      await page.setVisibility(true);
      this._activePage = page;
    } else if (sleep !== this._activePage.sleep || page !== this._activePage) {
      if (page != this._activePage) {
        if (this._activePage) {
          await this._activePage.setVisibility(false);
        }
        if (page) {
          page.setLastPage((_b = this._activePage) != null ? _b : void 0);
          if (!sleep) {
            await page.setVisibility(true);
          }
          page.sleep = sleep;
          this._activePage = page;
        }
      } else if (sleep !== this._activePage.sleep) {
        page.setLastPage((_c = this._activePage) != null ? _c : void 0);
        if (!sleep) {
          await this._activePage.setVisibility(true);
        }
        this._activePage.sleep = sleep;
      }
    }
  }
  getActivePage() {
    if (!this._activePage) {
      throw new Error(`No active page here, check code!`);
    }
    return this._activePage;
  }
  get isOnline() {
    return this._isOnline;
  }
  set isOnline(s) {
    if (this.unload) {
      return;
    }
    this.info.isOnline = s;
    if (s !== this._isOnline) {
      void this.library.writedp(
        `panels.${this.name}.info.isOnline`,
        s,
        definition.genericStateObjects.panel.panels.info.isOnline
      );
      if (s) {
        this.log.info("is online!");
      } else {
        this._activePage = void 0;
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
      if (fn) {
        await fn(topic, message);
      }
    }
    if (topic.endsWith(definition.ReiveTopicAppendix)) {
      const event = this.convertToEvent(message);
      if (event) {
        await this.HandleIncomingMessage(event);
      } else if (message) {
        let msg = null;
        try {
          msg = JSON.parse(message);
        } catch {
          this.log.warn(`Receive a broken msg from mqtt: ${msg}`);
        }
        if (!msg) {
          return;
        }
        if ("Flashing" in msg) {
          this.isOnline = false;
          this.flashing = msg.Flashing.complete < 99;
          this.log.info(`Flashing: ${msg.Flashing.complete}%`);
          await this.library.writedp(
            `panels.${this.name}.info.nspanel.firmwareUpdate`,
            msg.Flashing.complete >= 99 ? 100 : msg.Flashing.complete,
            definition.genericStateObjects.panel.panels.info.nspanel.firmwareUpdate
          );
          return;
        } else if ("nlui_driver_version" in msg) {
          this.info.nspanel.berryDriverVersion = parseInt(msg.nlui_driver_version);
          await this.library.writedp(
            `panels.${this.name}.info.nspanel.berryDriverVersion`,
            this.info.nspanel.berryDriverVersion,
            definition.genericStateObjects.panel.panels.info.nspanel.berryDriverVersion
          );
          this.adapter.setTimeout(async () => {
            let result = void 0;
            try {
              result = await import_axios.default.get(
                "https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json"
              );
              if (!result || !result.data) {
                return;
              }
              const version = this.adapter.config.useBetaTFT ? result.data[`berry-beta`].split("_")[0] : result.data.berry.split("_")[0];
              if (version != this.info.nspanel.berryDriverVersion && this.info.nspanel.berryDriverVersion != -1) {
                const url = `http://${this.info.tasmota.net.IPAddress}/cm?${this.adapter.config.useTasmotaAdmin ? `user=admin&password=${this.adapter.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog UrlFetch https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/tasmota/berry/${version}/autoexec.be; Restart 1`;
                this.log.info(
                  `Automatic update of the berry driver version from ${this.info.nspanel.berryDriverVersion} to ${version} on tasmota with IP ${this.info.tasmota.net.IPAddress} and  ${this.info.tasmota.net.Hostname}.`
                );
                await import_axios.default.get(url);
              }
            } catch {
            }
          }, 1);
          return;
        }
      }
    } else if (topic.endsWith("/tele/LWT")) {
      if (message === "Offline") {
      }
    } else if (topic.endsWith("/tele/INFO1")) {
      this.restartLoops();
    } else {
      const command = (topic.match(/[0-9a-zA-Z]+?\/[0-9a-zA-Z]+$/g) || [])[0];
      if (command) {
        switch (command) {
          case "stat/POWER2": {
            await this.library.writedp(
              `panels.${this.name}.cmd.power2`,
              message === "ON",
              definition.genericStateObjects.panel.panels.cmd.power2
            );
            await this.statesControler.setInternalState(`${this.name}/cmd/power2`, message === "ON", true);
            break;
          }
          case "stat/POWER1": {
            await this.library.writedp(
              `panels.${this.name}.cmd.power1`,
              message === "ON",
              definition.genericStateObjects.panel.panels.cmd.power1
            );
            await this.statesControler.setInternalState(`${this.name}/cmd/power1`, message === "ON", true);
            break;
          }
          case "stat/STATUS0": {
            const data = JSON.parse(message);
            if (this.name !== this.library.cleandp(data.StatusNET.Mac, false, true)) {
              this.log.error(`Receive wrong mac address ${data.StatusNET.Mac}! Update ur config!`);
            }
            const o = await this.adapter.getForeignObjectAsync(`system.adapter.${this.adapter.namespace}`);
            if (o && o.native) {
              if (this.name == this.library.cleandp(data.StatusNET.Mac, false, true)) {
                const index = o.native.panels.findIndex((a) => a.id === this.name);
                const ip = data.StatusNET.IPAddress;
                if (index !== -1 && o.native.panels[index].ip != ip) {
                  o.native.panels[index].ip = ip;
                  await this.adapter.setForeignObjectAsync(o._id, o);
                }
              }
            }
            await this.library.writedp(
              `panels.${this.name}.info`,
              void 0,
              definition.genericStateObjects.panel.panels.info._channel
            );
            await this.library.writedp(
              `panels.${this.name}.info.status`,
              message,
              definition.genericStateObjects.panel.panels.info.status
            );
            this.info.tasmota.mqttClient = data.StatusMQT.MqttClient;
            this.info.tasmota.net = data.StatusNET;
            this.info.tasmota.firmwareversion = data.StatusFWR.Version;
            this.info.tasmota.safeboot = data.StatusFWR.Version.includes("Safeboot");
            this.info.tasmota.uptime = data.StatusSTS.Uptime;
            this.info.tasmota.sts = data.StatusSTS;
            await this.writeInfo();
            break;
          }
          default: {
            if (this.adapter.config.debugLogMqtt) {
              this.log.debug(`Receive other message ${topic} with ${message}`);
            }
          }
        }
      }
    }
  };
  sendRules() {
    this.sendToTasmota(
      `${this.topic}/cmnd/Rule3`,
      `ON CustomSend DO RuleTimer3 120 ENDON ON Rules#Timer=3 DO CustomSend pageType~pageStartup ENDON${this.detach.left ? ` ON Button1#state do Publish ${this.topic}/tele/RESULT {"CustomRecv":"event,button1"} ENDON` : ""}${this.detach.right ? ` ON Button2#state do Publish ${this.topic}/tele/RESULT {"CustomRecv":"event,button2"} ENDON` : ""}`
    );
    this.sendToTasmota(`${this.topic}/cmnd/Rule3`, "1");
  }
  async onStateChange(id, state) {
    if (state.ack) {
      return;
    }
    if (id.split(".")[1] === this.name) {
      const cmd = id.replace(`panels.${this.name}.cmd.`, "");
      switch (cmd) {
        case "power1": {
          this.sendToTasmota(`${this.topic}/cmnd/POWER1`, state.val ? "ON" : "OFF");
          break;
        }
        case "power2": {
          this.sendToTasmota(`${this.topic}/cmnd/POWER2`, state.val ? "ON" : "OFF");
          break;
        }
        case "mainNavigationPoint": {
          this.navigation.setMainPageByName(state.val ? String(state.val) : "main");
          await this.library.writedp(
            `panels.${this.name}.cmd.mainNavigationPoint`,
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            state.val ? String(state.val) : "main"
          );
          break;
        }
        case "goToNavigationPoint": {
          await this.navigation.setTargetPageByName(state.val ? String(state.val) : "main");
          break;
        }
        case "screenSaver.timeout": {
          if (state && state.val != null && typeof state.val === "number") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screenSaverTimeout`,
              parseInt(String(state.val)),
              false
            );
          }
          break;
        }
        case "dim.standby": {
          if (state && state.val != null && typeof state.val === "number") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/dimStandby`,
              parseInt(String(state.val)),
              false
            );
          }
          break;
        }
        case "dim.active": {
          if (state && state.val != null && typeof state.val === "number") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/dimActive`,
              parseInt(String(state.val)),
              false
            );
          }
          break;
        }
        case "dim.dayMode": {
          if (this.dim.schedule) {
            this.log.warn("Dim schedule is active - User input ignored!");
          } else {
            this.dim.dayMode = !!state.val;
            this.sendDimmode();
          }
          await this.library.writedp(
            `panels.${this.name}.cmd.dim.dayMode`,
            this.dim.dayMode,
            definition.genericStateObjects.panel.panels.cmd.dim.dayMode
          );
          break;
        }
        case "dim.schedule": {
          this.dim.schedule = !!state.val;
          if (this.dim.schedule) {
            this.sendDimmode();
          }
          await this.library.writedp(
            `panels.${this.name}.cmd.dim.schedule`,
            this.dim.schedule,
            definition.genericStateObjects.panel.panels.cmd.dim.schedule
          );
          break;
        }
        case "dim.nightActive": {
          if (state && state.val != null && typeof state.val === "number") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/dimNightActive`,
              parseInt(String(state.val)),
              false
            );
          }
          break;
        }
        case "dim.nightStandby": {
          if (state && state.val != null && typeof state.val === "number") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/dimNightStandby`,
              parseInt(String(state.val)),
              false
            );
          }
          break;
        }
        case "dim.nightHourStart": {
          if (state && state.val != null && typeof state.val === "number") {
            if (state.val <= 23 && state.val >= 0 && state.val % 1 === 0) {
              await this.statesControler.setInternalState(
                `${this.name}/cmd/dimNightHourStart`,
                parseInt(String(state.val)),
                false
              );
            }
          }
          break;
        }
        case "dim.nightHourEnd": {
          if (state && state.val != null && typeof state.val === "number") {
            if (state.val <= 23 && state.val >= 0 && state.val % 1 === 0) {
              await this.statesControler.setInternalState(
                `${this.name}/cmd/dimNightHourEnd`,
                parseInt(String(state.val)),
                false
              );
            }
          }
          break;
        }
        case "screenSaver.infoIcon": {
          if (state && state.val != null && typeof state.val === "string") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screenSaverInfoIcon`,
              state.val,
              false
            );
          }
          break;
        }
        case "screenSaver.doubleClick": {
          if (state && state.val != null) {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screenSaverDoubleClick`,
              !!state.val,
              false
            );
          }
          break;
        }
        case "detachLeft": {
          await this.statesControler.setInternalState(`${this.name}/cmd/detachLeft`, !!state.val, false);
          break;
        }
        case "detachRight": {
          await this.statesControler.setInternalState(`${this.name}/cmd/detachRight`, !!state.val, false);
          break;
        }
        case "screenSaver.layout": {
          if (typeof state.val === "number" && pages.isScreenSaverModeAsNumber(state.val)) {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screenSaverLayout`,
              state.val,
              false
            );
          }
          break;
        }
        case "screenSaver.rotationTime": {
          if (state && state.val != null && typeof state.val === "number") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screenSaverRotationTime`,
              parseInt(String(state.val)),
              false
            );
          }
          break;
        }
        case "screenSaver.activateNotification": {
          if (state && state.val != null) {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screensaverActivateNotification`,
              !!state.val,
              false
            );
          }
          break;
        }
        case "screenSaver.headingNotification": {
          if (state && state.val != null && typeof state.val === "string") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screensaverHeadingNotification`,
              String(state.val),
              false
            );
          }
          break;
        }
        case "screenSaver.textNotification": {
          if (state && state.val != null && typeof state.val === "string") {
            await this.statesControler.setInternalState(
              `${this.name}/cmd/screensaverTextNotification`,
              String(state.val),
              false
            );
          }
          break;
        }
        /* case 'hideCards': {
            if (state && state.val != null) {
                this.hideCards = !!state.val;
                await this.library.writedp(
                    `panels.${this.name}.cmd.hideCards`,
                    this.hideCards,
                    definition.genericStateObjects.panel.panels.cmd.hideCards,
                );
            }
            break;
        } */
        case "hideCards": {
          if (state && state.val != null) {
            await this.statesControler.setInternalState(`${this.name}/cmd/hideCards`, !!state.val, false);
          }
          break;
        }
      }
    }
  }
  /**
   * timeout screensaver after sec
   *
   * @param sec seconds for timeout
   */
  sendScreeensaverTimeout(sec) {
    this.log.debug(`Set screeensaver timeout to ${sec}s.`);
    this.sendToPanel(`timeout~${sec}`, false);
  }
  sendDimmode() {
    const hour = (/* @__PURE__ */ new Date()).getHours();
    const oldDayMode = this.dim.dayMode;
    if (this.dim.schedule) {
      if (this.dim.nightHourStart > this.dim.nightHourEnd) {
        if (hour >= this.dim.nightHourStart || hour < this.dim.nightHourEnd) {
          this.dim.dayMode = false;
        } else {
          this.dim.dayMode = true;
        }
      } else {
        if (hour >= this.dim.nightHourStart && hour < this.dim.nightHourEnd) {
          this.dim.dayMode = false;
        } else {
          this.dim.dayMode = true;
        }
      }
    }
    let cmd = `${import_Color.Color.rgb_dec565(import_Color.Color.Black)}~${import_Color.Color.rgb_dec565(import_Color.Color.White)}`;
    if (this.dim.dayMode) {
      cmd = `dimmode~${this.dim.standby}~${this.dim.active}~${cmd}`;
    } else {
      cmd = `dimmode~${this.dim.nightStandby}~${this.dim.nightActive}~${cmd}`;
    }
    if (this.dim.dayMode !== oldDayMode) {
      void this.library.writedp(
        `panels.${this.name}.cmd.dim.dayMode`,
        this.dim.dayMode,
        definition.genericStateObjects.panel.panels.cmd.dim.dayMode
      );
    }
    this.sendToPanel(cmd, false);
  }
  restartLoops() {
    if (this.loopTimeout) {
      this.adapter.clearTimeout(this.loopTimeout);
    }
    this.loopTimeout = this.adapter.setTimeout(this.loop, 100);
  }
  /**
   * Do panel work always at full
   *
   */
  loop = () => {
    this.pages = this.pages.filter((a) => a && !a.unload);
    let t = Math.random() * 3e4 + 1e4;
    if (!this.isOnline) {
      t = 5e3;
      if (!this.flashing) {
        this.sendToPanel("pageType~pageStartup", false, { retain: true });
      }
    }
    if (this.unload) {
      return;
    }
    this.loopTimeout = this.adapter.setTimeout(this.loop, t);
  };
  requestStatusTasmota() {
    this.sendToTasmota(`${this.topic}/cmnd/STATUS0`, "");
  }
  async delete() {
    var _a;
    await super.delete();
    if (this.blockStartup) {
      this.adapter.clearTimeout(this.blockStartup);
    }
    this.isOnline = false;
    if (this.loopTimeout) {
      this.adapter.clearTimeout(this.loopTimeout);
    }
    await this.library.writedp(
      `panels.${this.name}.info.isOnline`,
      false,
      definition.genericStateObjects.panel.panels.info.isOnline
    );
    await this.panelSend.delete();
    await this.navigation.delete();
    await ((_a = this.screenSaver) == null ? void 0 : _a.delete());
    for (const a of this.pages) {
      if (a) {
        await a.delete();
      }
    }
    this.persistentPageItems = {};
    this.pages = [];
    this._activePage = void 0;
    this.data = {};
    this.screenSaver = void 0;
  }
  getPagebyUniqueID(uniqueID) {
    var _a;
    if (!uniqueID) {
      return null;
    }
    const index = this.pages.findIndex((a) => a && a.name && a.name === uniqueID);
    return (_a = this.pages[index]) != null ? _a : null;
  }
  async writeInfo() {
    await this.library.writeFromJson(
      `panels.${this.name}.info`,
      "panel.panels.info",
      definition.genericStateObjects,
      this.info
    );
  }
  /**
   *  Handle incoming messages from panel
   *
   * @param event incoming event....
   * @returns void
   */
  async HandleIncomingMessage(event) {
    var _a;
    if (!event.method) {
      return;
    }
    if (this._activePage && this._activePage.card !== "cardAlarm" && this.adapter.config.debugLogMqtt) {
      this.log.debug(`Receive message:${JSON.stringify(event)}`);
    }
    if (!this.screenSaver) {
      return;
    }
    if (this.isOnline === false && event.method !== "startup") {
      void this.restartLoops();
      return;
    }
    switch (event.method) {
      case "startup": {
        if (this.blockStartup) {
          return;
        }
        this.blockStartup = this.adapter.setTimeout(() => {
          this.blockStartup = null;
        }, 1e4);
        this.isOnline = true;
        this.info.nspanel.displayVersion = event.opt;
        this.info.nspanel.model = event.action;
        this.requestStatusTasmota();
        this.sendToTasmota(`${this.topic}/cmnd/POWER1`, "");
        this.sendToTasmota(`${this.topic}/cmnd/POWER2`, "");
        this.sendToTasmota(`${this.topic}/cmnd/GetDriverVersion`, "");
        this.sendRules();
        await this.writeInfo();
        this.sendDimmode();
        this.navigation.resetPosition();
        await this.adapter.delay(50);
        const start = this.navigation.getCurrentMainPage();
        if (start === void 0) {
          this.log.error("No start page defined!");
          return;
        }
        start.setLastPage((_a = this._activePage) != null ? _a : void 0);
        await start.setVisibility(true);
        if (this.screenSaver) {
          this.screenSaver.pageItems = await this.screenSaver.createPageItems(
            this.screenSaver.pageItemConfig
          );
          await this.screenSaver.HandleDate();
          await this.screenSaver.HandleTime();
        }
        this.sendScreeensaverTimeout(3);
        this.log.info("Panel startup finished!");
        break;
      }
      case "sleepReached": {
        await this.setActivePage(this.screenSaver);
        this.navigation.resetPosition();
        this.pages.forEach((a) => a && a.reset());
        break;
      }
      case "pageOpenDetail": {
        await this.setActivePage(false);
        await this.getActivePage().onPopupRequest(
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
          await this.library.writedp(
            `panels.${this.name}.cmd.screenSaver.activateNotification`,
            false,
            definition.genericStateObjects.panel.panels.cmd.screenSaver.activateNotification
          );
          if (this.screenSaverDoubleClick && this.screenSaver.screensaverSwipe) {
            switch (event.action) {
              case "bExit": {
                await this.library.writedp(
                  `panels.${this.name}.buttons.screensaverGesture`,
                  2,
                  definition.genericStateObjects.panel.panels.buttons.screensaverGesture
                );
                break;
              }
              case "swipeUp": {
                await this.library.writedp(
                  `panels.${this.name}.buttons.screensaverGesture`,
                  3,
                  definition.genericStateObjects.panel.panels.buttons.screensaverGesture
                );
                break;
              }
              case "swipeDown": {
                await this.library.writedp(
                  `panels.${this.name}.buttons.screensaverGesture`,
                  4,
                  definition.genericStateObjects.panel.panels.buttons.screensaverGesture
                );
                break;
              }
              case "swipeLeft": {
                await this.library.writedp(
                  `panels.${this.name}.buttons.screensaverGesture`,
                  5,
                  definition.genericStateObjects.panel.panels.buttons.screensaverGesture
                );
                break;
              }
              case "swipeRight": {
                await this.library.writedp(
                  `panels.${this.name}.buttons.screensaverGesture`,
                  6,
                  definition.genericStateObjects.panel.panels.buttons.screensaverGesture
                );
                break;
              }
            }
          }
          if (this.screenSaverDoubleClick && parseInt(event.opt) > 1 || !this.screenSaverDoubleClick) {
            this.navigation.resetPosition();
            await this.navigation.setCurrentPage();
            break;
          }
        } else if (event.action === "bExit" && event.id !== "popupNotify") {
          await this.setActivePage(true);
        } else {
          if (event.action === "button" && ["bNext", "bPrev", "bUp", "bHome", "bSubNext", "bSubPrev"].indexOf(event.id) != -1) {
            if (["bPrev", "bUp", "bSubPrev"].indexOf(event.id) != -1) {
              this.getActivePage().goLeft();
            } else if (["bNext", "bHome", "bSubNext"].indexOf(event.id) != -1) {
              this.getActivePage().goRight();
            }
            break;
          }
          await this.getActivePage().onPopupRequest(
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
        await this.panelSend.onMessage("/stat/RESULT", `{ "CustomSend": "${event.method}" }`);
        break;
      }
      case "button1": {
        await this.onDetachButtonEvent("left");
        break;
      }
      case "button2": {
        await this.onDetachButtonEvent("right");
        break;
      }
      default: {
        this.log.warn("Missing method in HandleIncomingMessage()");
      }
    }
  }
  onDetachButtonEvent = async (button) => {
    const action = this.buttons ? button === "left" ? this.buttons.left : this.buttons.right : null;
    await this.library.writedp(`panels.${this.name}.buttons.${button}`, false, null, true, true);
    if (action) {
      switch (action.mode) {
        case "button": {
          if (typeof action.state === "string") {
            this.log.error(`Button ${button} has no state!`);
            return;
          }
          await action.state.setStateTrue();
          break;
        }
        case "page": {
          if (typeof action.page === "string") {
            await this.navigation.setTargetPageByName(action.page);
          }
          break;
        }
        case "switch": {
          if (typeof action.state === "string") {
            this.log.error(`Button ${button} has no state!`);
            return;
          }
          await action.state.setStateFlip();
          break;
        }
      }
    }
  };
  onInternalCommand = async (id, state) => {
    var _a, _b, _c;
    if (!id.startsWith(this.name)) {
      return null;
    }
    const token = id.replace(`${this.name}/`, "");
    if (state && !state.ack && state.val != null) {
      switch (token) {
        case "cmd/power1": {
          this.sendToTasmota(`${this.topic}/cmnd/POWER1`, state.val ? "ON" : "OFF");
          break;
        }
        case "cmd/power2": {
          this.sendToTasmota(`${this.topic}/cmnd/POWER2`, state.val ? "ON" : "OFF");
          break;
        }
        case `cmd/detachRight`: {
          this.detach.right = !!state.val;
          await this.library.writedp(`panels.${this.name}.cmd.detachRight`, this.detach.right);
          this.sendRules();
          break;
        }
        case "cmd/detachLeft": {
          this.detach.left = !!state.val;
          await this.library.writedp(`panels.${this.name}.cmd.detachLeft`, this.detach.left);
          this.sendRules();
          break;
        }
        case "cmd/bigIconLeft": {
          this.info.nspanel.bigIconLeft = !!state.val;
          this.screenSaver && await this.screenSaver.HandleScreensaverStatusIcons();
          await this.library.writeFromJson(
            `panels.${this.name}.info`,
            "panel.panels.info",
            definition.genericStateObjects,
            this.info
          );
          break;
        }
        case "cmd/bigIconRight": {
          this.info.nspanel.bigIconRight = !!state.val;
          this.screenSaver && await this.screenSaver.HandleScreensaverStatusIcons();
          await this.library.writeFromJson(
            `panels.${this.name}.info`,
            "panel.panels.info",
            definition.genericStateObjects,
            this.info
          );
          break;
        }
        case "cmd/screenSaverTimeout": {
          if (typeof state.val !== "boolean") {
            const val = parseInt(String(state.val));
            this.timeout = val;
            this.sendScreeensaverTimeout(this.timeout);
            await this.statesControler.setInternalState(`${this.name}/cmd/screenSaverTimeout`, val, true);
            await this.library.writedp(`panels.${this.name}.cmd.screenSaver.timeout`, this.timeout);
          }
          break;
        }
        case "cmd/dimStandby": {
          const val = parseInt(String(state.val));
          this.dim.standby = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dim.standby`, this.dim.standby);
          break;
        }
        case "cmd/dimActive": {
          const val = parseInt(String(state.val));
          this.dim.active = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dim.active`, this.dim.active);
          break;
        }
        case "cmd/dimNightActive": {
          const val = parseInt(String(state.val));
          this.dim.nightActive = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dim.nightActive`, this.dim.nightActive);
          break;
        }
        case "cmd/dimNightStandby": {
          const val = parseInt(String(state.val));
          this.dim.nightStandby = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dim.nightStandby`, this.dim.nightStandby);
          break;
        }
        case "cmd/dimNightHourStart": {
          const val = parseInt(String(state.val));
          this.dim.nightHourStart = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dim.nightHourStart`, this.dim.nightHourStart);
          break;
        }
        case "cmd/dimNightHourEnd": {
          const val = parseInt(String(state.val));
          this.dim.nightHourEnd = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dim.nightHourEnd`, this.dim.nightHourEnd);
          break;
        }
        case "cmd/NotificationCleared2":
        case "cmd/NotificationCleared": {
          await this.controller.systemNotification.clearNotification(this.notifyIndex);
        }
        // eslint-disable-next-line no-fallthrough
        case "cmd/NotificationNext2":
        case "cmd/NotificationNext": {
          this.notifyIndex = this.controller.systemNotification.getNotificationIndex(++this.notifyIndex);
          if (this.notifyIndex !== -1) {
            const val = this.controller.systemNotification.getNotification(this.notifyIndex);
            if (val) {
              await this.statesControler.setInternalState(
                `${this.name}/cmd/popupNotification${token.endsWith("2") ? "" : "2"}`,
                JSON.stringify(val),
                false
              );
            }
            break;
          }
          await this.HandleIncomingMessage({
            type: "event",
            method: "buttonPress2",
            id: "popupNotify",
            action: "bExit",
            opt: ""
          });
          break;
        }
        case "cmd/TasmotaRestart": {
          this.sendToTasmota(`${this.topic}/cmnd/Restart`, "1");
          this.log.info("Restart Tasmota!");
          this.isOnline = false;
          break;
        }
        case "cmd/screenSaverRotationTime": {
          if (this.screenSaver && typeof state.val === "number") {
            const val = state.val === 0 ? state.val : state.val < 3 ? 3 : state.val > 3600 ? 3600 : state.val;
            if (this.screenSaver.rotationTime !== val * 1e3) {
              this.screenSaver.rotationTime = val * 1e3;
              await this.screenSaver.restartRotationLoop();
            }
            await this.library.writedp(`panels.${this.name}.cmd.screenSaver.rotationTime`, val);
          }
          break;
        }
        case "cmd/screenSaverDoubleClick": {
          if (this.screenSaver && typeof state.val === "boolean") {
            this.screenSaverDoubleClick = !!state.val;
            await this.library.writedp(`panels.${this.name}.cmd.screenSaver.doubleClick`, state.val);
          }
          break;
        }
        case "cmd/screenSaverInfoIcon": {
          if (this.screenSaver && typeof state.val === "string") {
            this.screenSaver.infoIcon = state.val;
            await this.library.writedp(`panels.${this.name}.cmd.screenSaver.infoIcon`, state.val);
          }
          break;
        }
        case "cmd/screenSaverLayout": {
          if (typeof state.val === "number" && pages.isScreenSaverModeAsNumber(state.val)) {
            if (this.screenSaver) {
              this.screenSaver.overwriteModel(state.val);
              await this.library.writedp(`panels.${this.name}.cmd.screenSaver.layout`, state.val);
            }
          }
          break;
        }
        case "info/PopupInfo": {
          this.data["info/PopupInfo"] = state.val;
          break;
        }
        case "cmd/screensaverActivateNotification": {
          if (this.screenSaver) {
            this.screenSaver.sendNotify(!!state.val);
            await this.library.writedp(
              `panels.${this.name}.cmd.screenSaver.activateNotification`,
              !!state.val,
              definition.genericStateObjects.panel.panels.cmd.screenSaver.activateNotification
            );
          }
          break;
        }
        case "cmd/screensaverTextNotification": {
          if (this.screenSaver && typeof state.val === "string") {
            this.screenSaver.textNotification = state.val;
            const s = this.library.readdb(`panels.${this.name}.cmd.screenSaver.activateNotification`);
            if (s && s.val) {
              this.screenSaver.sendNotify(true);
            }
            await this.library.writedp(
              `panels.${this.name}.cmd.screenSaver.textNotification`,
              state.val,
              definition.genericStateObjects.panel.panels.cmd.screenSaver.textNotification
            );
          }
          break;
        }
        case "cmd/screensaverHeadingNotification": {
          if (this.screenSaver && typeof state.val === "string") {
            this.screenSaver.headingNotification = state.val;
            const s = this.library.readdb(`panels.${this.name}.cmd.screenSaver.activateNotification`);
            if (s && s.val) {
              this.screenSaver.sendNotify(true);
            }
            await this.library.writedp(
              `panels.${this.name}.cmd.screenSaver.headingNotification`,
              state.val,
              definition.genericStateObjects.panel.panels.cmd.screenSaver.headingNotification
            );
          }
          break;
        }
        case "cmd/hideCards": {
          if (this.screenSaver && typeof state.val === "boolean") {
            this.hideCards = !!state.val;
            await this.library.writedp(`panels.${this.name}.cmd.hideCards`, state.val);
          }
          break;
        }
      }
      await this.statesControler.setInternalState(id, state.val, true);
    }
    switch (token) {
      case "cmd/bigIconLeft": {
        return this.info.nspanel.bigIconLeft;
      }
      case "cmd/bigIconRight": {
        return this.info.nspanel.bigIconRight;
      }
      case "cmd/screenSaverTimeout": {
        return this.timeout;
      }
      case "cmd/dimStandby": {
        return this.dim.standby;
      }
      case "cmd/dimActive": {
        return this.dim.active;
      }
      case "cmd/dimNightActive": {
        return this.dim.nightActive;
      }
      case "cmd/dimNightStandby": {
        return this.dim.nightStandby;
      }
      case "cmd/dimNightHourStart": {
        return this.dim.nightHourStart;
      }
      case "cmd/dimNightHourEnd": {
        return this.dim.nightHourEnd;
      }
      case "cmd/detachLeft": {
        return this.detach.left;
      }
      case "cmd/detachRight": {
        return this.detach.right;
      }
      case "cmd/popupNotification2":
      case "cmd/popupNotification": {
        if (this.notifyIndex !== -1) {
          const val = this.controller.systemNotification.getNotification(this.notifyIndex);
          if (val) {
            return JSON.stringify(val);
          }
        }
        return null;
      }
      case "info/tasmotaVersion": {
        return `${this.info.tasmota.firmwareversion}\r
${this.info.tasmota.onlineVersion}`;
      }
      case "info/displayVersion": {
        return this.info.nspanel.displayVersion;
      }
      case "info/modelVersion": {
        return this.info.nspanel.model;
      }
      case "info/Tasmota": {
        return this.info.tasmota;
      }
      case "cmd/screenSaverRotationTime": {
        if (this.screenSaver) {
          return this.screenSaver.rotationTime / 1e3;
        }
        break;
      }
      case "cmd/screenSaverDoubleClick": {
        return this.screenSaverDoubleClick;
      }
      case "cmd/screenSaverInfoIcon": {
        return (_b = (_a = this.screenSaver) == null ? void 0 : _a.infoIcon) != null ? _b : "";
      }
      case "cmd/screenSaverLayout": {
        if (this.screenSaver) {
          return import_screensaver.Screensaver.mapModeToNumber(this.screenSaver.mode);
        }
        break;
      }
      case "info/PopupInfo": {
        return (_c = this.data["info/PopupInfo"]) != null ? _c : null;
      }
      case "cmd/hideCards": {
        return this.hideCards;
      }
    }
    return null;
  };
  /**
   * Convert incoming string to event msg object
   *
   * @param msg incoming string
   * @returns event object
   */
  convertToEvent(msg) {
    var _a, _b, _c, _d;
    try {
      msg = (JSON.parse(msg) || {}).CustomRecv;
    } catch {
      this.log.warn(`Receive a broken msg from mqtt: ${msg}`);
    }
    if (msg === void 0) {
      return null;
    }
    const temp = msg.split(",");
    if (!Types.isEventType(temp[0])) {
      return null;
    }
    try {
      if (!Types.isEventMethod(temp[1])) {
        return null;
      }
    } catch (e) {
      this.log.error(`Error at convertToEvent: ${e}`);
      return null;
    }
    let popup = void 0;
    if (temp[1] === "pageOpenDetail") {
      popup = temp.splice(2, 1)[0];
    }
    const arr = String(temp[2]).split("?");
    if (arr[3]) {
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
    }
    if (arr[2]) {
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
    } else if (arr[1]) {
      return {
        type: temp[0],
        method: temp[1],
        page: parseInt(arr[0]),
        popup,
        id: arr[1],
        action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
        opt: (_c = temp[4]) != null ? _c : ""
      };
    }
    return {
      type: temp[0],
      method: temp[1],
      popup,
      id: arr[0],
      action: pages.isButtonActionType(temp[3]) ? temp[3] : temp[3],
      opt: (_d = temp[4]) != null ? _d : ""
    };
  }
  async setScreensaverSwipe(b) {
    if (this.screenSaver) {
      this.screenSaver.screensaverSwipe = b;
      await this.library.writedp(
        `panels.${this.name}.buttons.screensaverGesture`,
        !this.screenSaver.screensaverSwipe ? 0 : 1,
        definition.genericStateObjects.panel.panels.buttons.screensaverGesture
      );
    }
  }
  static getPage(config, that) {
    if ("template" in config && config.template) {
      const template = import_card.cardTemplates[config.template];
      if (!template) {
        that.log.error(`Template not found: ${config.template}`);
        return config;
      }
      if (config.dpInit && typeof config.dpInit === "string") {
        const reg = (0, import_tools.getRegExp)(config.dpInit);
        if (reg) {
          config.dpInit = reg;
        }
        if (template.adapter && typeof config.dpInit === "string" && !config.dpInit.startsWith(template.adapter)) {
          return config;
        }
      }
      const newTemplate = structuredClone(template);
      delete newTemplate.adapter;
      config = (0, import_tools.deepAssign)(newTemplate, config);
    }
    return config;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Panel
});
//# sourceMappingURL=panel.js.map
