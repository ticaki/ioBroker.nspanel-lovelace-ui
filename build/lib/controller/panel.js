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
var import_definition = require("../const/definition");
var import_Page = require("../classes/Page");
var import_pageMedia = require("../pages/pageMedia");
var import_pageGrid = require("../pages/pageGrid");
var import_navigation = require("../classes/navigation");
var import_pageThermo = require("../pages/pageThermo");
var import_pagePower = require("../pages/pagePower");
var import_pageEntities = require("../pages/pageEntities");
var import_pageNotification = require("../pages/pageNotification");
var import_system_templates = require("../templates/system-templates");
var import_pageAlarm = require("../pages/pageAlarm");
var import_pageChart = require("../pages/pageChart");
var import_pageLChart = require("../pages/pageLChart");
var import_pageQR = require("../pages/pageQR");
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
  screenSaver;
  InitDone = false;
  _isOnline = false;
  lastCard = "";
  notifyIndex = -1;
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
  dimMode;
  detach = { left: false, right: false };
  persistentPageItems = {};
  info = {
    isOnline: false,
    nspanel: {
      displayVersion: 0,
      model: "",
      bigIconLeft: false,
      bigIconRight: false,
      currentPage: ""
    },
    tasmota: {
      firmwareversion: "",
      onlineVersion: "",
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
  friendlyName = "";
  configName = "";
  constructor(adapter, options) {
    var _a, _b, _c;
    super(adapter, options.name);
    this.friendlyName = options.name;
    this.configName = options.name;
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
    if (typeof this.panelSend.addMessage === "function") {
      this.sendToPanelClass = this.panelSend.addMessage;
    }
    if (typeof this.panelSend.addMessageTasmota === "function") {
      this.sendToTasmota = this.panelSend.addMessageTasmota;
    }
    this.statesControler = options.controller.statesControler;
    this.dimMode = { low: (_b = options.dimLow) != null ? _b : 70, high: (_c = options.dimHigh) != null ? _c : 90 };
    options.pages = options.pages.concat(import_system_templates.systemPages);
    options.navigation = (options.navigation || []).concat(import_system_templates.systemNavigation);
    let scsFound = 0;
    for (let a = 0; a < options.pages.length; a++) {
      let pageConfig = options.pages[a] ? import_Page.Page.getPage(options.pages[a], this) : options.pages[a];
      if (!pageConfig || !pageConfig.config) {
        continue;
      }
      const pmconfig = {
        card: pageConfig.config.card,
        panel: this,
        id: String(a),
        name: pageConfig.uniqueID,
        alwaysOn: pageConfig.alwaysOn,
        adapter: this.adapter,
        panelSend: this.panelSend,
        dpInit: pageConfig.dpInit
      };
      switch (pageConfig.config.card) {
        case "cardChart": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageChart.PageChart(pmconfig, pageConfig);
          break;
        }
        case "cardLChart": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageLChart.PageLChart(pmconfig, pageConfig);
          break;
        }
        case "cardEntities": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageEntities.PageEntities(pmconfig, pageConfig);
          break;
        }
        case "cardGrid3":
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
        case "cardQR": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageQR.PageQR(pmconfig, pageConfig);
          break;
        }
        case "cardAlarm": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pageAlarm.PageAlarm(pmconfig, pageConfig);
          break;
        }
        case "cardPower": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
          this.pages[a] = new import_pagePower.PagePower(pmconfig, pageConfig);
          break;
        }
        case "popupNotify2":
        case "popupNotify": {
          pageConfig = import_Page.Page.getPage(pageConfig, this);
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
            name: pageConfig.uniqueID,
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
    this.controller.mqttClient.subscript(`${this.topic}/tele/#`, this.onMessage);
    this.controller.mqttClient.subscript(`${this.topic}/stat/#`, this.onMessage);
    this.isOnline = false;
    this.restartLoops();
  };
  start = async () => {
    this.adapter.subscribeStates(`panels.${this.name}.cmd.*`);
    this.adapter.subscribeStates(`panels.${this.name}.alarm.*`);
    for (const id in import_definition.InternalStates.panel) {
      const obj = import_definition.InternalStates.panel[id];
      await this.statesControler.setInternalState(
        `${this.name}/${id}`,
        obj.val,
        obj.ack,
        obj.common,
        obj.noTrigger ? void 0 : this.onInternalCommand
      );
    }
    const channelObj = this.library.cloneObject(import_definition.genericStateObjects.panel.panels._channel);
    channelObj.common.name = this.friendlyName;
    channelObj.native = {
      topic: this.topic,
      tasmotaName: this.friendlyName,
      name: this.name,
      configName: this.configName
    };
    await this.library.writedp(`panels.${this.name}`, void 0, channelObj);
    await this.library.writedp(`panels.${this.name}.cmd`, void 0, import_definition.genericStateObjects.panel.panels.cmd._channel);
    await this.library.writedp(
      `panels.${this.name}.alarm`,
      void 0,
      import_definition.genericStateObjects.panel.panels.alarm._channel
    );
    await this.library.writedp(
      `panels.${this.name}.buttons`,
      void 0,
      import_definition.genericStateObjects.panel.panels.buttons._channel
    );
    await this.library.writedp(
      `panels.${this.name}.buttons.left`,
      true,
      import_definition.genericStateObjects.panel.panels.buttons.left
    );
    await this.library.writedp(
      `panels.${this.name}.buttons.right`,
      true,
      import_definition.genericStateObjects.panel.panels.buttons.right
    );
    let state = this.library.readdb(`panels.${this.name}.cmd.dimStandby`);
    if (state && state.val) {
      this.dimMode.low = state.val;
    }
    state = this.library.readdb(`panels.${this.name}.cmd.dimActive`);
    if (state && state.val) {
      this.dimMode.high = state.val;
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.dimStandby`,
      this.dimMode.low,
      import_definition.genericStateObjects.panel.panels.cmd.dimStandby
    );
    await this.library.writedp(
      `panels.${this.name}.cmd.dimActive`,
      this.dimMode.high,
      import_definition.genericStateObjects.panel.panels.cmd.dimActive
    );
    {
      let state2 = this.library.readdb(`panels.${this.name}.cmd.detachRight`);
      if (state2 && state2.val) {
        this.detach.right = !!state2.val;
      }
      state2 = this.library.readdb(`panels.${this.name}.cmd.detachLeft`);
      if (state2 && state2.val) {
        this.detach.left = !!state2.val;
      }
      await this.library.writedp(
        `panels.${this.name}.cmd.detachRight`,
        this.detach.right,
        import_definition.genericStateObjects.panel.panels.cmd.detachRight
      );
      await this.library.writedp(
        `panels.${this.name}.cmd.detachLeft`,
        this.detach.left,
        import_definition.genericStateObjects.panel.panels.cmd.detachLeft
      );
    }
    for (const page of this.pages) {
      if (page) {
        this.log.info(`Initialisation of page ${page.name} pageitems: ${(page.pageItemConfig || []).length}`);
        await page.init();
      }
    }
    state = this.library.readdb(`panels.${this.name}.cmd.screensaverTimeout`);
    if (state) {
      this.timeout = parseInt(String(state.val));
    }
    await this.library.writedp(
      `panels.${this.name}.cmd.screensaverTimeout`,
      this.timeout,
      import_definition.genericStateObjects.panel.panels.cmd.screensaverTimeout
    );
    this.navigation.init();
    {
      const currentPage = this.library.readdb(`panels.${this.name}.cmd.mainNavigationPoint`);
      if (currentPage && currentPage.val) {
        this.navigation.setMainPageByName(String(currentPage.val));
      }
      import_definition.genericStateObjects.panel.panels.cmd.mainNavigationPoint.common.states = this.navigation.buildCommonStates();
      const page = this.navigation.getCurrentMainPoint();
      await this.library.writedp(
        `panels.${this.name}.cmd.mainNavigationPoint`,
        page,
        import_definition.genericStateObjects.panel.panels.cmd.mainNavigationPoint
      );
    }
    {
      const currentScreensaver = this.library.readdb(`panels.${this.name}.cmd.screenSaver`);
      const scs = this.pages.filter(
        (a) => a && (a.card === "screensaver" || a.card === "screensaver2")
      );
      if (currentScreensaver && currentScreensaver.val) {
        if (scs && scs[0]) {
          this.screenSaver = scs[0];
          if (pages.isScreenSaverMode(currentScreensaver.val)) {
            this.screenSaver.overwriteModel(currentScreensaver.val, true);
          }
        }
      }
      const states = {
        standard: "Standard",
        advanced: "Advanced",
        alternate: "Alternate",
        easyview: "Easyview"
      };
      import_definition.genericStateObjects.panel.panels.cmd.screenSaver.common.states = states;
      await this.library.writedp(
        `panels.${this.name}.cmd.screenSaver`,
        this.screenSaver && this.screenSaver.mode ? this.screenSaver.mode : "none",
        import_definition.genericStateObjects.panel.panels.cmd.screenSaver
      );
    }
    state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconLeft`);
    this.info.nspanel.bigIconLeft = state ? !!state.val : false;
    state = this.library.readdb(`panels.${this.name}.info.nspanel.bigIconRight`);
    this.info.nspanel.bigIconRight = state ? !!state.val : false;
    this.sendToTasmota(`${this.topic}/cmnd/POWER1`, "");
    this.sendToTasmota(`${this.topic}/cmnd/POWER2`, "");
    this.sendRules();
  };
  sendToPanelClass = () => {
  };
  sendToPanel = (payload, opt) => {
    this.sendToPanelClass(payload, opt);
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
          await this._activePage.setVisibility(true, true);
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
    this.info.isOnline = s;
    if (s !== this._isOnline) {
      void this.library.writedp(
        `panels.${this.name}.info.isOnline`,
        s,
        import_definition.genericStateObjects.panel.panels.info.isOnline
      );
      if (s) {
        this.log.info("is online!");
      } else {
        this.log.warn("is offline!");
      }
      this.restartLoops();
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
        fn(topic, message);
      }
    }
    if (topic.endsWith(import_definition.ReiveTopicAppendix)) {
      const event = this.convertToEvent(message);
      if (event) {
        await this.HandleIncomingMessage(event);
      }
    } else {
      const command = (topic.match(/[0-9a-zA-Z]+?\/[0-9a-zA-Z]+$/g) || [])[0];
      if (command) {
        switch (command) {
          case "stat/POWER2": {
            await this.library.writedp(
              `panels.${this.name}.cmd.power2`,
              message === "ON",
              import_definition.genericStateObjects.panel.panels.cmd.power2
            );
            await this.statesControler.setInternalState(`${this.name}/cmd/power2`, message === "ON", true);
            break;
          }
          case "stat/POWER1": {
            await this.library.writedp(
              `panels.${this.name}.cmd.power1`,
              message === "ON",
              import_definition.genericStateObjects.panel.panels.cmd.power1
            );
            await this.statesControler.setInternalState(`${this.name}/cmd/power1`, message === "ON", true);
            break;
          }
          case "stat/STATUS0": {
            const data = JSON.parse(message);
            this.name = this.library.cleandp(data.StatusNET.Mac, false, true);
            const i = this.InitDone;
            if (!this.InitDone) {
              await this.start();
              this.InitDone = true;
            }
            await this.library.writedp(
              `panels.${this.name}.info`,
              void 0,
              import_definition.genericStateObjects.panel.panels.info._channel
            );
            await this.library.writedp(
              `panels.${this.name}.info.status`,
              message,
              import_definition.genericStateObjects.panel.panels.info.status
            );
            this.info.tasmota.net = data.StatusNET;
            this.info.tasmota.firmwareversion = data.StatusFWR.Version;
            this.info.tasmota.uptime = data.StatusSTS.Uptime;
            this.info.tasmota.sts = data.StatusSTS;
            if (!i) {
              await this.library.writeFromJson(
                `panels.${this.name}.info.tasmota`,
                "panel.panels.info.tasmota",
                import_definition.genericStateObjects,
                this.info.tasmota
              );
            } else {
              await this.writeInfo();
            }
          }
        }
      }
    }
  };
  sendRules() {
    this.sendToTasmota(
      `${this.topic}/cmnd/Rule3`,
      `ON CustomSend DO RuleTimer1 120 ENDON ON Rules#Timer=1 DO CustomSend pageType~pageStartup ENDON${this.detach.left ? ` ON Button1#state do Publish ${this.topic}/tele/RESULT {"CustomRecv":"event,button1"} ENDON` : ""}${this.detach.right ? ` ON Button2#state do Publish ${this.topic}/tele/RESULT {"CustomRecv":"event,button2"} ENDON` : ""}`
    );
    this.sendToTasmota(`${this.topic}/cmnd/Rule3`, "ON");
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
          this.navigation.setTargetPageByName(state.val ? String(state.val) : "main");
          break;
        }
        case "screensaverTimeout": {
          await this.statesControler.setInternalState(
            `${this.name}/cmd/screensaverTimeout`,
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            parseInt(String(state.val)),
            false
          );
          break;
        }
        case "dimStandby": {
          await this.statesControler.setInternalState(
            `${this.name}/cmd/dimStandby`,
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            parseInt(String(state.val)),
            false
          );
          break;
        }
        case "dimActive": {
          await this.statesControler.setInternalState(
            `${this.name}/cmd/dimActive`,
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            parseInt(String(state.val)),
            false
          );
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
        case "screenSaver": {
          if (typeof state.val === "string" && pages.isScreenSaverMode(state.val)) {
            if (this.screenSaver) {
              this.screenSaver.overwriteModel(state.val);
              await this.library.writedp(`panels.${this.name}.cmd.screenSaver`, state.val);
            }
          }
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
    this.sendToPanel(`timeout~${sec}`);
  }
  sendDimmode() {
    this.sendToPanel(`dimmode~${this.dimMode.low}~${this.dimMode.high}~${String(1)}`);
  }
  restartLoops() {
    if (this.loopTimeout) {
      this.adapter.clearTimeout(this.loopTimeout);
    }
    this.loop();
  }
  /**
   * Do panel work always at full minute
   *
   */
  loop = () => {
    if (this.unload) {
      return;
    }
    this.sendToTasmota(`${this.topic}/cmnd/STATUS0`, "");
    this.pages = this.pages.filter((a) => a && !a.unload);
    let t = 3e5 + Math.random() * 3e4 - 15e3;
    if (!this.isOnline) {
      t = 15e3;
      this.sendToPanel("pageType~pageStartup", { retain: true });
    }
    this.loopTimeout = this.adapter.setTimeout(this.loop, t);
  };
  async delete() {
    await super.delete();
    await this.library.writedp(
      `panels.${this.name}.info.isOnline`,
      false,
      import_definition.genericStateObjects.panel.panels.info.isOnline
    );
    for (const a of this.pages) {
      if (a) {
        await a.delete();
      }
    }
    this.isOnline = false;
    this.persistentPageItems = {};
    if (this.loopTimeout) {
      this.adapter.clearTimeout(this.loopTimeout);
    }
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
      import_definition.genericStateObjects,
      this.info
    );
  }
  /**
   *  Handle incoming messages from panel
   *
   * @param event incoming event....
   * @returns
   */
  async HandleIncomingMessage(event) {
    if (this.InitDone === false) {
      this.isOnline = false;
      return;
    }
    if (!event.method) {
      return;
    }
    if (this._activePage && this._activePage.card !== "cardAlarm") {
      this.log.debug(`Receive message:${JSON.stringify(event)}`);
    }
    if (!this.screenSaver) {
      return;
    }
    if (this.isOnline === false && event.method !== "startup") {
      return;
    }
    switch (event.method) {
      case "startup": {
        this.isOnline = true;
        this.info.nspanel.displayVersion = parseInt(event.id);
        this.info.nspanel.model = event.action;
        await this.writeInfo();
        this.sendToPanel(`dimmode~${this.dimMode.low}~${this.dimMode.high}~${String(1)}`);
        this.navigation.resetPosition();
        const i = this.pages.findIndex((a) => a && a.name === "///WelcomePopup");
        const popup = i !== -1 ? this.pages[i] : void 0;
        if (popup) {
          await this.setActivePage(popup);
        }
        if (this.screenSaver) {
          await this.screenSaver.HandleDate();
          await this.screenSaver.HandleTime();
        }
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
          this.navigation.resetPosition();
          await this.navigation.setCurrentPage();
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
        break;
      }
      case "button1": {
        await this.library.writedp(`panels.${this.name}.buttons.left`, true, null, true, true);
        break;
      }
      case "button2": {
        await this.library.writedp(`panels.${this.name}.buttons.right`, true, null, true, true);
        break;
      }
      default: {
        this.log.warn("Missing method in HandleIncomingMessage()");
      }
    }
  }
  onInternalCommand = async (id, state) => {
    if (!id.startsWith(this.name)) {
      return null;
    }
    const token = id.replace(`${this.name}/`, "");
    if (state && !state.ack && state.val !== null) {
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
            import_definition.genericStateObjects,
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
            import_definition.genericStateObjects,
            this.info
          );
          break;
        }
        case "cmd/screensaverTimeout": {
          if (typeof state.val !== "boolean") {
            const val = parseInt(String(state.val));
            this.timeout = val;
            this.sendScreeensaverTimeout(this.timeout);
            await this.statesControler.setInternalState(`${this.name}/cmd/screensaverTimeout`, val, true);
            await this.library.writedp(`panels.${this.name}.cmd.screensaverTimeout`, this.timeout);
          }
          break;
        }
        case "cmd/dimStandby": {
          const val = parseInt(String(state.val));
          this.dimMode.low = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dimStandby`, this.dimMode.low);
          break;
        }
        case "cmd/dimActive": {
          const val = parseInt(String(state.val));
          this.dimMode.high = val;
          this.sendDimmode();
          await this.library.writedp(`panels.${this.name}.cmd.dimActive`, this.dimMode.high);
          break;
        }
        case "cmd/NotificationCleared2":
        case "cmd/NotificationCleared": {
          await this.controller.systemNotification.clearNotification(this.notifyIndex);
        }
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
      case "cmd/screensaverTimeout": {
        return this.timeout;
      }
      case "cmd/dimStandby": {
        return this.dimMode.low;
      }
      case "cmd/dimActive": {
        return this.dimMode.high;
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
    }
    return null;
  };
  /**
   * Convert incoming string to event msg object
   *
   * @param msg
   * @returns
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
    if (!Types.isEventMethod(temp[1])) {
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
  /*
  function HandleMessage(typ: string, method: NSPanel.EventMethod, page: number | undefined, words: string[] | undefined): void {
      try {
          if (typ == 'event') {
              switch (method as NSPanel.EventMethod) {
                  case 'startup':
                      screensaverEnabled = false;
                      UnsubscribeWatcher();
                      HandleStartupProcess();
                      pageId = 0;
                      GeneratePage(config.pages[0]);
                      if (Debug) log('HandleMessage -> Startup', 'info');
                      Init_Release();
                      break;
                  case 'sleepReached':
                      useMediaEvents = false;
                      screensaverEnabled = true;
                      if (pageId < 0)
                          pageId = 0;
                      HandleScreensaver();
                      if (Debug) log('HandleMessage -> sleepReached', 'info');
                      break;
                  case 'pageOpenDetail':
                      if (words != undefined) {
                          screensaverEnabled = false;
                          UnsubscribeWatcher();
                          if (Debug) {
                              log('HandleMessage -> pageOpenDetail ' + words[0] + ' - ' + words[1] + ' - ' + words[2] + ' - ' + words[3] + ' - ' + words[4], 'info');
                          }
                          let tempId: PageItem['id'];
                          let tempPageItem = words[3].split('?');
                          let placeId: number | undefined = undefined;
                          if (!isNaN(parseInt(tempPageItem[0]))){
                              tempId = activePage!.items[tempPageItem[0]].id;
                              placeId = parseInt(tempPageItem[0])
                              if (tempId == undefined) {
                                  throw new Error(`Missing id in HandleMessage!`)
                              }
                          } else {
                              tempId = tempPageItem[0];
                          }
                          let pageItem: PageItem = findPageItem(tempId);
                          if (pageItem !== undefined && isPopupType(words[2])) {
                              let temp: string | NSPanel.mediaOptional | undefined = tempPageItem[1]
                              if (isMediaOptional(temp)) SendToPanel(GenerateDetailPage(words[2], temp, pageItem, placeId));
                              else SendToPanel(GenerateDetailPage(words[2], undefined, pageItem, placeId));
                          }
                      }
                      break;
                  case 'buttonPress2':
                      screensaverEnabled = false;
                      HandleButtonEvent(words);
                      if (Debug) {
                          if (words != undefined) log('HandleMessage -> buttonPress2 ' + words[0] + ' - ' + words[1] + ' - ' + words[2] + ' - ' + words[3] + ' - ' + words[4], 'info');
                      }
                      break;
                  case 'renderCurrentPage':
                      // Event only for HA at this Moment
                      if (Debug) log('renderCurrentPage', 'info');
                      break;
                  case 'button1':
                  case 'button2':
                      screensaverEnabled = false;
                      HandleHardwareButton(method);
                      if (Debug) log('HandleMessage -> button1 /  button2', 'info')
                      break;
                  default:
                      break;
              }
          }
      } catch (err: any) {
          log('error at function HandleMessage: ' + err.message, 'warn');
      }
  }*/
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Panel
});
//# sourceMappingURL=panel.js.map
