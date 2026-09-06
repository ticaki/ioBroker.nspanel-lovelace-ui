"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_adminShareConfig = require("./lib/types/adminShareConfig");
var utils = __toESM(require("@iobroker/adapter-core"));
var import_library = require("./lib/controller/library");
var import_register = require("source-map-support/register");
var MQTT = __toESM(require("./lib/classes/mqtt"));
var import_controller = require("./lib/controller/controller");
var import_icon_mapping = require("./lib/const/icon_mapping");
var definition = __toESM(require("./lib/const/definition"));
var import_config_manager = require("./lib/classes/config-manager");
var import_readme = require("./lib/tools/readme");
var import_redact = require("./lib/tools/redact");
var import_node_url = require("node:url");
var fs = __toESM(require("node:fs"));
var import_Color = require("./lib/const/Color");
var import_node_path = __toESM(require("node:path"));
var import_test = require("./lib/const/test");
var import_function_and_const = require("./lib/types/function-and-const");
var import_node_ical = __toESM(require("node-ical"));
const NS_PANEL_INIT_SESSION_TTL = 6e5;
class NspanelLovelaceUi extends utils.Adapter {
  library;
  mqttClient;
  mqttServer;
  controller;
  unload = false;
  testSuccessful = true;
  timeoutAdmin;
  timeoutAdmin2;
  timeoutAdminArray = [];
  intervalAdminArray = [];
  mainConfiguration;
  testCaseConfig;
  // just for testing
  scriptConfigBacklog = [];
  fetchs = /* @__PURE__ */ new Map();
  paused = false;
  versionJson = void 0;
  /** Zwischenstände der dreistufigen Panel-Einrichtung, nach Topic */
  nsPanelInitSessions = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    super({
      ...options,
      name: "nspanel-lovelace-ui",
      useFormatDate: true
    });
    this.library = new import_library.Library(this);
    this.on("ready", this.onReady.bind(this));
    this.on("stateChange", this.onStateChange.bind(this));
    this.on("message", this.onMessage.bind(this));
    this.on("unload", this.onUnload.bind(this));
  }
  /**
   * Is called when databases are connected and adapter received configuration.
   */
  async onReady() {
    var _a, _b, _c, _d, _e, _f;
    if (this.config.deactivateDebugLog) {
      this.log.debug = (_msg) => {
      };
      this.log.silly = this.log.info;
    }
    await this.extendForeignObjectAsync(this.namespace, {
      type: "meta",
      common: { name: { en: "Nspanel Instance", de: "Nspanel Instanze" }, type: "meta.folder" },
      native: {}
    });
    if (this.config.forceTFTVersion) {
      this.log.warn(
        `\u26A0\uFE0F  TFT firmware is pinned to version ${this.config.forceTFTVersion}. Remember: you will always stay on this version until you change it.`
      );
      if (this.config.forceTFTVersion === "0.0.0") {
        this.log.warn(
          `\u26A0\uFE0F  Developer version of the TFT firmware is used. This version may be unstable and have bugs! No support in the forum!`
        );
      }
    }
    if (this.config.fixBrokenCommonTypes) {
      const states = await this.getForeignObjectsAsync("alias.0.*");
      this.log.info("Fix broken common.type in alias.0");
      if (states) {
        for (const id in states) {
          if (states[id] && states[id].type === "state" && states[id].common && String(states[id].common.type) === "state") {
            this.log.warn(`Fix broken common.type in ${id} set to 'mixed'`);
            states[id].common.type = "mixed";
            await this.extendForeignObjectAsync(id, states[id]);
          }
        }
      }
    }
    const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
    if (o && o.native) {
      let change = false;
      const native = o.native;
      if (native.fixBrokenCommonTypes === true) {
        native.fixBrokenCommonTypes = false;
        change = true;
      }
      native.pageConfig = native.pageConfig || [];
      if (native.pageUnlockConfig && !native.pageConfig) {
        native.pageConfig = native.pageUnlockConfig;
        delete native.pageUnlockConfig;
        change = true;
      }
      if (native.pageQRdata) {
        native.pageQRdata.forEach((page) => {
          const temp = {
            card: "cardQR",
            uniqueName: page.pageName,
            headline: page.headline,
            selType: page.selType,
            ssidUrlTel: page.SSIDURLTEL,
            setState: page.setState || "",
            wlanhidden: page.wlanhidden || false,
            pwdhidden: page.pwdhidden || false,
            hidden: page.hiddenByTrigger || false,
            alwaysOn: page.alwaysOnDisplay ? "always" : "none"
          };
          native.pageConfig.push(temp);
        });
        delete native.pageQRdata;
        change = true;
      }
      if (!this.config.versionJsonUrl || !this.config.tftUrl || !this.config.berryUrl) {
        try {
          const iopackage = JSON.parse(
            fs.readFileSync(import_node_path.default.join(__dirname, "..", "io-package.json"), "utf-8")
          );
          native.versionJsonUrl = iopackage.native.versionJsonUrl || "";
          native.tftUrl = iopackage.native.tftUrl || "";
          native.berryUrl = iopackage.native.berryUrl || "";
          change = true;
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          this.log.error(`Error while reading io-package.json for default URLs: ${errorMessage}`);
        }
      }
      if (change) {
        const uniquePages = /* @__PURE__ */ new Map();
        for (const p of (_a = native.pageConfig) != null ? _a : []) {
          if (p == null ? void 0 : p.uniqueName) {
            if (uniquePages.has(p.uniqueName)) {
              this.log.warn(`Duplicate uniqueName '${p.uniqueName}' found in pageConfig!`);
              continue;
            }
            uniquePages.set(p.uniqueName, p);
          }
        }
        native.pageConfig = [...uniquePages.values()];
        await this.setForeignObject(`system.adapter.${this.namespace}`, o);
        this.log.warn(`Updated configuration of ${this.namespace} to the latest version. Restart adapter!`);
        return;
      }
    }
    await (0, import_readme.generateAliasDocumentation)();
    if (this.config.testCase) {
      this.log.warn("Testcase mode!");
    }
    if (this.config.weatherEntity === void 0 || typeof this.config.weatherEntity !== "string") {
      this.config.weatherEntity = "";
    } else if (this.config.weatherEntity !== "" && definition.weatherEntities.findIndex((a) => this.config.weatherEntity.startsWith(a)) === -1) {
      this.log.error(
        `Invalid weatherEntity index, set to ${this.config.weatherEntity}. Report this to the developer! Use custom.`
      );
      this.config.weatherEntity = "";
    }
    let pauseAdapter = false;
    this.mainConfiguration = [];
    const obj = await this.getForeignObjectAsync(this.namespace);
    if (obj && obj.native) {
      const config = [];
      if (obj.native.scriptConfigRaw || obj.native.scriptConfig) {
        const panelsText = (this.config.panels || []).map((a) => `[${a.name}#${a.topic}]`).join(", ");
        const configsText = (_b = obj.native.scriptConfigRaw) == null ? void 0 : _b.map((a) => `${a.panelTopic}`).join(", ");
        this.log.info(`Configured panels: name#topic -> ${panelsText}`);
        this.log.info(`Found ${obj.native.scriptConfigRaw.length} script configs for topics: ${configsText}`);
        this.log.info(
          `Detailed configuration checks are suppressed here. Full validation output is only shown when the configuration script is sent to the adapter.`
        );
        const manager = new import_config_manager.ConfigManager(this, true);
        manager.log.warn = function(_msg) {
        };
        for (const a of this.config.panels) {
          if (!a || !a.topic) {
            continue;
          }
          let usedConfig = null;
          let rawFound = false;
          let rawConversionFailed = false;
          const raw = (_c = obj.native.scriptConfigRaw) == null ? void 0 : _c.find(
            (b) => b.panelTopic === a.topic
          );
          if (raw) {
            rawFound = true;
            const c = await manager.setScriptConfig(raw);
            if (c && c.messages && c.messages.length > 0) {
              if (!c.messages[0].startsWith("Panel")) {
                this.log.warn(c.messages[0]);
              }
            }
            if (c && c.panelConfig) {
              c.panelConfig.model = a.model || "eu";
              config.push(c.panelConfig);
              usedConfig = "raw";
            } else {
              rawConversionFailed = true;
            }
          }
          if (!usedConfig) {
            const conv = obj.native.scriptConfig.find(
              (b) => b.topic === a.topic
            );
            if (conv) {
              conv.model = a.model || "eu";
              config.push(conv);
              usedConfig = "converted";
            }
          }
          if (!usedConfig) {
            this.log.warn(`No script config found for ${a.topic}`);
            await manager.delete();
          } else if (usedConfig === "raw") {
            this.log.debug(`Config for ${a.topic}: raw`);
          } else {
            if (rawFound && rawConversionFailed) {
              this.log.warn(
                `Config for ${a.topic}: converted (RAW conversion failed). Please update the configuration script and send it to the adapter again.`
              );
            } else {
              this.log.warn(`Config for ${a.topic}: converted`);
            }
          }
        }
      }
      try {
        this.mainConfiguration = await import_config_manager.ConfigManager.getConfig(this, config);
      } catch (e) {
        this.log.error(`Error in configuration: ${e.message}`);
        this.mainConfiguration = [];
        pauseAdapter = true;
      }
    }
    if (this.config.mqttServer && this.config.mqttPort && this.config.mqttUsername) {
      this.config.mqttPassword = this.config.mqttPassword || "";
      const port = await this.getPortAsync(this.config.mqttPort);
      if (port != this.config.mqttPort) {
        this.log.error(`Port ${this.config.mqttPort} is already in use!`);
        this.log.error(`Please change the port in the admin settings to ${port}!`);
        this.log.error("Stopping adapter!");
        if (this.stop) {
          await this.stop();
        }
        return;
      }
      this.mqttServer = await MQTT.MQTTServerClass.createMQTTServer(
        this,
        this.config.mqttPort,
        this.config.mqttUsername,
        this.config.mqttPassword,
        "./mqtt",
        this.config.testCase
      );
      this.config.mqttIp = "127.0.0.1";
    }
    if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword)) {
      this.log.error("Invalid admin configuration for mqtt!");
      this.testSuccessful = false;
      return;
    }
    try {
      import_icon_mapping.Icons.adapter = this;
      await this.library.init();
      const states = await this.getStatesAsync("*");
      await this.library.initStates(states);
      this.mqttClient = new MQTT.MQTTClientClass(
        this,
        this.config.mqttIp,
        this.config.mqttPort,
        this.config.mqttUsername,
        this.config.mqttPassword,
        this.config.mqttServer,
        async (topic, message) => {
          this.log.debug(`${topic} ${message}`);
        }
      );
      if (!this.mqttClient) {
        return;
      }
      await this.mqttClient.waitConnectAsync(5e3);
      if (pauseAdapter) {
        return;
      }
      await this.onMqttConnect();
      await this.delay(1e3);
      for (const id in states) {
        if (id.endsWith(".info.isOnline")) {
          await this.library.writedp(id, false, definition.genericStateObjects.panel.panels.info.isOnline);
        }
      }
      this.log.debug("Check configuration!");
      if (!this.config.pw1 || typeof this.config.pw1 !== "string") {
        this.log.warn("No pin entered for the service page! Please set a pin in the admin settings!");
      }
      if (this.config.testCase) {
        await this.extendForeignObjectAsync("0_userdata.0.boolean", {
          type: "state",
          common: { name: "boolean", type: "boolean" },
          native: {}
        });
        await this.extendForeignObjectAsync("0_userdata.0.number", {
          type: "state",
          common: { name: "number", type: "number" },
          native: {}
        });
        await this.extendForeignObjectAsync("0_userdata.0.string", {
          type: "state",
          common: { name: "string", type: "string" },
          native: {}
        });
        await this.onMessage({
          _id: Date.now(),
          message: import_test.testScriptConfig,
          command: "ScriptConfig",
          from: "system.adapter.admin.0",
          callback: () => {
          }
        });
        await this.delay(1e3);
        this.mainConfiguration = this.testCaseConfig;
        const test = new MQTT.MQTTClientClass(
          this,
          this.config.mqttIp,
          this.config.mqttPort,
          this.config.mqttUsername,
          this.config.mqttPassword,
          this.config.mqttServer,
          async (topic, message) => {
            this.log.debug(`${topic} ${message}`);
          }
        );
        await test.waitConnectAsync(5e3);
        await test.subscribe("test/123456/cmnd/#", async (topic, message) => {
          this.log.debug(`Testcase ${topic}`);
          if (message === "pageType~pageStartup") {
            await test.publish("test/123456/stat/RESULT", '{"CustomSend": "Done"}');
            await test.publish("test/123456/tele/RESULT", '{"CustomRecv":"event,startup,54,eu"}');
          } else if (topic === "test/123456/cmnd/STATUS0") {
            await test.publish(
              "test/123456/stat/STATUS0",
              '{"Status":{"Module":0,"DeviceName":"NSPanel 4 Test","FriendlyName":["Tasmota",""],"Topic":"ns_panel4","ButtonTopic":"0","Power":"00","PowerLock":"00","PowerOnState":3,"LedState":1,"LedMask":"FFFF","SaveData":1,"SaveState":1,"SwitchTopic":"0","SwitchMode":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ButtonRetain":0,"SwitchRetain":0,"SensorRetain":0,"PowerRetain":0,"InfoRetain":0,"StateRetain":0,"StatusRetain":0},"StatusPRM":{"Baudrate":115200,"SerialConfig":"8N1","GroupTopic":"tasmotas","OtaUrl":"http://ota.tasmota.com/tasmota32/release/tasmota32-nspanel.bin","RestartReason":"Vbat power on reset","Uptime":"0T00:07:28","StartupUTC":"2025-02-19T09:23:29","Sleep":50,"CfgHolder":4617,"BootCount":59,"BCResetTime":"2024-01-06T17:11:30","SaveCount":110},"StatusFWR":{"Version":"14.4.1(release-nspanel)","BuildDateTime":"2024-12-15T13:33:11","Core":"3_1_0","SDK":"5.3.2","CpuFrequency":160,"Hardware":"ESP32-D0WD-V3 v3.1","CR":"502/699"},"StatusLOG":{"SerialLog":2,"WebLog":1,"MqttLog":3,"SysLog":0,"LogHost":"","LogPort":514,"SSId":["xxx",""],"TelePeriod":300,"Resolution":"558180C0","SetOption":["00008009","2805C80001000600003C5A0A192800000000","00000080","00006000","00004000","00000000"]},"StatusMEM":{"ProgramSize":2017,"Free":862,"Heap":148,"StackLowMark":3,"PsrMax":2048,"PsrFree":2025,"ProgramFlashSize":4096,"FlashSize":4096,"FlashChipId":"16405E","FlashFrequency":40,"FlashMode":"DIO","Features":["0809","9F9AD7DF","0015A001","B7F7BFCF","05DA9BC4","E0360DC7","480840D2","20200000","D4BC482D","810A80F1","00000014"],"Drivers":"1,2,!3,!4,!5,7,!8,9,10,11,12,!14,!16,!17,!20,!21,24,26,!27,29,!34,!35,38,50,52,!59,!60,62,!63,!66,!67,!68,!73,!75,82,!86,!87,!88,!121","Sensors":"1,2,3,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,26,31,34,37,39,40,42,43,45,51,52,55,56,58,59,64,66,67,74,85,92,95,98,103,105,109,127","I2CDriver":"7,8,9,10,11,12,13,14,15,17,18,20,24,29,31,36,41,42,44,46,48,58,62,65,69,76,77,82,89"},"StatusNET":{"Hostname":"ns-panel4-0112","IPAddress":"192.168.178.174","Gateway":"192.168.178.1","Subnetmask":"255.255.254.0","DNSServer1":"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"A0:B7:A5:54:C0:71","IP6Global":"","IP6Local":"xxx","Ethernet":{"Hostname":"","IPAddress":"0.0.0.0","Gateway":"0.0.0.0","Subnetmask":"0.0.0.0","DNSServer1":"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"00:00:00:00:00:00","IP6Global":"","IP6Local":""},"Webserver":2,"HTTP_API":1,"WifiConfig":4,"WifiPower":16.0},"StatusMQT":{"MqttHost":"xxx","MqttPort":1883,"MqttClientMask":"ns_panel4","MqttClient":"ns_panel4","MqttUser":"xxx","MqttCount":1,"MAX_PACKET_SIZE":1200,"KEEPALIVE":30,"SOCKET_TIMEOUT":4},"StatusTIM":{"UTC":"2025-02-19T09:30:57Z","Local":"2025-02-19T10:30:57","StartDST":"2025-03-30T02:00:00","EndDST":"2025-10-26T03:00:00","Timezone":"+01:00","Sunrise":"07:50","Sunset":"18:17"},"StatusSNS":{"Time":"2025-02-19T10:30:57","ANALOG":{"Temperature1":-3.2},"TempUnit":"C"},"StatusSTS":{"Time":"2025-02-19T10:30:57","Uptime":"0T00:07:28","UptimeSec":448,"Heap":146,"SleepMode":"Dynamic","Sleep":50,"LoadAvg":19,"MqttCount":1,"Berry":{"HeapUsed":16,"Objects":212},"POWER1":"OFF","POWER2":"OFF","Wifi":{"AP":1,"SSId":"Keller","BSSId":"DC:15:C8:EB:3E:B8","Channel":7,"Mode":"HT40","RSSI":46,"Signal":-77,"LinkCount":1,"Downtime":"0T00:00:03"}}}'
            );
          }
        });
      }
      if (!this.mainConfiguration || !Array.isArray(this.mainConfiguration) || this.mainConfiguration.length === 0) {
        await this.delay(100);
        await this.mqttClient.destroy();
        await this.delay(100);
        this.paused = true;
        this.log.error("No configuration - adapter on hold!");
        return;
      }
      this.mainConfiguration = structuredClone(this.mainConfiguration);
      let counter = 0;
      for (const a of this.mainConfiguration) {
        try {
          if (a && a.pages) {
            const names = [];
            for (const p of a.pages) {
              counter++;
              if (!("uniqueID" in p)) {
                continue;
              }
              if (((_d = p.config) == null ? void 0 : _d.card) === "screensaver" || ((_e = p.config) == null ? void 0 : _e.card) === "screensaver2" || ((_f = p.config) == null ? void 0 : _f.card) === "screensaver3") {
                p.uniqueID = `#${p.uniqueID}`;
              }
              if (names.indexOf(p.uniqueID) !== -1) {
                throw new Error(
                  `PanelTopic: ${a.topic} uniqueID ${p.uniqueID} is double! Ignore this panel!`
                );
              }
              names.push(p.uniqueID);
            }
          }
        } catch (e) {
          const index = this.mainConfiguration.findIndex((b) => b === a);
          this.mainConfiguration.splice(index, 1);
          this.log.error(`Error: ${e}`);
        }
      }
      await this.subscribeStatesAsync("*");
      if (counter === 0) {
        return;
      }
      const mem = process.memoryUsage().heapUsed / 1024;
      this.log.debug(String(`${mem}k`));
      this.controller = new import_controller.Controller(this, {
        mqttClient: this.mqttClient,
        name: "controller",
        panels: structuredClone(this.mainConfiguration)
      });
    } catch (e) {
      this.testSuccessful = false;
      this.log.error(`Error onReady: ${e}`);
    }
  }
  onMqttConnect = async () => {
    const _helper = async (tasmota) => {
      try {
        const state = this.library.readdb(`panels.${tasmota.id}.info.nspanel.firmwareUpdate`);
        if (state && typeof state.val === "number" && state.val >= 100) {
          this.log.debug(`Force an MQTT reconnect from the Nspanel with the ip ${tasmota.ip} in 10 seconds!`);
          await this.fetch(
            `http://${tasmota.ip}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Restart 1`
          );
        } else {
          this.log.info(`Update detected on the Nspanel with the ip ${tasmota.ip}!!`);
        }
      } catch (e) {
        this.log.warn(
          `Error: This usually means that the NSpanel with ip ${tasmota.ip} is not online or has not been set up properly in the configuration! Error: ${e ? e.message : ""}`
        );
      }
    };
    for (const tasmota of this.config.panels) {
      if (tasmota && tasmota.ip) {
        void _helper(tasmota);
      }
    }
    await this.setState("info.connection", true, true);
  };
  async fetch(url, init, timeout = 3e4) {
    var _a;
    const controller = new AbortController();
    const timeoutId = this.setTimeout(() => {
      try {
        controller.abort();
      } catch {
      }
      this.fetchs.delete(controller);
    }, timeout);
    this.fetchs.set(controller, timeoutId);
    try {
      const response = await fetch(url, {
        ...init,
        method: (_a = init == null ? void 0 : init.method) != null ? _a : "GET",
        signal: controller.signal
      });
      if (response.status === 200) {
        return await response.json();
      }
      throw new Error({ status: response.status, statusText: response.statusText });
    } finally {
      const id = this.fetchs.get(controller);
      if (typeof id !== "undefined") {
        this.clearTimeout(id);
      }
      this.fetchs.delete(controller);
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances.
   *
   * @param callback Callback so the adapter can finish what it has to do.
   */
  async onUnload(callback) {
    try {
      this.unload = true;
      this.nsPanelInitSessions.clear();
      if (this.timeoutAdmin) {
        this.clearTimeout(this.timeoutAdmin);
      }
      if (this.timeoutAdmin2) {
        this.clearTimeout(this.timeoutAdmin2);
      }
      for (const [controller, timeoutId] of this.fetchs.entries()) {
        try {
          if (timeoutId) {
            this.clearTimeout(timeoutId);
          }
          controller.abort();
        } catch {
        }
      }
      this.fetchs.clear();
      this.timeoutAdminArray.forEach((a) => {
        if (a) {
          this.clearTimeout(a);
        }
      });
      this.intervalAdminArray.forEach((a) => {
        if (a) {
          this.clearInterval(a);
        }
      });
      if (this.controller) {
        await this.controller.delete();
      }
      if (this.mqttClient) {
        await this.mqttClient.destroy();
      }
      if (this.mqttServer) {
        this.mqttServer.destroy();
      }
      callback();
    } catch {
      callback();
    }
  }
  /**
   * Is called if a subscribed state changes
   *
   * @param id   The id of the state that changed
   * @param state The state object holding the new value and meta information of the state
   */
  async onStateChange(id, state) {
    if (state) {
      if (this.controller) {
        await this.controller.statesControler.onStateChange(id, state);
      }
    } else {
    }
  }
  // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
  // /**
  //  * Somee message was sent to this instance over message box. Used by email, pushover, text2speech,
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  async onMessage(obj) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D, _E, _F;
    if (typeof obj === "object" && obj.message !== void 0 && obj.command) {
      this.log.debug((0, import_redact.stringifyForLog)(obj));
      if (obj.command === "tftInstallSendToMQTT") {
        if (obj.message.online === "no") {
          obj.command = "tftInstallSendTo";
        }
      }
      const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;
      switch (obj.command) {
        case import_adminShareConfig.SENDTO_GET_PAGES_COMMAND: {
          let names = [];
          if ((_a = obj == null ? void 0 : obj.message) == null ? void 0 : _a.panelTopic) {
            if ((_b = this.controller) == null ? void 0 : _b.panels) {
              if (obj.message.panelTopic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID) {
                const temp = /* @__PURE__ */ new Set();
                this.controller.panels.forEach((a) => {
                  const b = a.navigation.getDatabase().map((b2) => {
                    var _a2;
                    return (_a2 = b2 == null ? void 0 : b2.page) == null ? void 0 : _a2.name;
                  }).filter((a2) => a2 != null);
                  if (temp.size === 0) {
                    for (const c of b) {
                      if (c) {
                        temp.add(c);
                      }
                    }
                  } else {
                    const lookup = new Set(b.filter(Boolean));
                    const toRemove = [];
                    for (const t of temp) {
                      if (!lookup.has(t)) {
                        toRemove.push(t);
                      }
                    }
                    for (const r of toRemove) {
                      temp.delete(r);
                    }
                  }
                });
                names = Array.from(temp);
              } else {
                const panel = this.controller.panels.find((a) => a.topic === obj.message.panelTopic);
                if (panel) {
                  const db = panel.navigation.getDatabase();
                  if (db) {
                    for (const p of db) {
                      if (p == null ? void 0 : p.page) {
                        names.push(p.page.name);
                      }
                    }
                  }
                }
              }
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
          }
          break;
        }
        case import_adminShareConfig.SENDTO_GET_PAGES_All_COMMAND: {
          let names = [];
          if ((_c = this.controller) == null ? void 0 : _c.panels) {
            for (const panel of this.controller.panels) {
              if (panel) {
                const db = panel.navigation.getDatabase();
                if (db) {
                  for (const p of db) {
                    if (p == null ? void 0 : p.page) {
                      names.push(p.page.name);
                    }
                  }
                }
              }
            }
            names = Array.from(new Set(names));
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
          }
          break;
        }
        case import_adminShareConfig.SENDTO_GET_PANELS_COMMAND: {
          const names = [];
          if ((_d = this.controller) == null ? void 0 : _d.panels) {
            for (const p of this.controller.panels) {
              if (p) {
                names.push({ panelTopic: p.topic, friendlyName: p.friendlyName || p.name });
              }
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { result: names }, obj.callback);
          }
          break;
        }
        case import_adminShareConfig.SAVE_PANEL_NAVIGATION_COMMAND: {
          if (obj.message && ((_e = this.controller) == null ? void 0 : _e.panels)) {
            const data = obj.message;
            const panel = this.controller.panels.find((a) => a.name === data.panelName);
            if (panel) {
              await panel.saveNavigationMapDeprecated(data.pages);
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, [], obj.callback);
          }
          break;
        }
        case import_adminShareConfig.SENDTO_GET_PANEL_NAVIGATION_COMMAND: {
          const nav = [];
          if ((_f = this.controller) == null ? void 0 : _f.panels) {
            for (const p of this.controller.panels) {
              if (p) {
                nav.push(await p.getNavigationArrayForFlow());
              }
            }
          } else {
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { result: nav }, obj.callback);
          }
          break;
        }
        case "getWeatherEntity": {
          const adapterObj = await this.getObjectViewAsync("system", "instance", {
            startkey: "system.adapter.",
            endkey: "system.adapter.\u9999"
          });
          const adapters = [];
          if (adapterObj && adapterObj.rows && adapterObj.rows.length > 0) {
            for (const r of adapterObj.rows) {
              if (r && r.id && definition.weatherEntities.findIndex((a) => r.id.includes(a)) !== -1) {
                adapters.push(r.id.replace("system.adapter.", ""));
              }
            }
          }
          const result = adapters.sort().map((a) => {
            return { value: a, label: a };
          });
          result.unshift({ label: this.library.getTranslation("custom"), value: "" });
          if (obj.callback) {
            this.sendTo(
              obj.from,
              obj.command,
              result ? result : [{ label: "Not available", value: "" }],
              obj.callback
            );
          }
          break;
        }
        case "config": {
          const obj1 = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
          if (obj1 && obj1.native && JSON.stringify(obj1.native.Testconfig2) !== JSON.stringify(obj.message)) {
            obj1.native.Testconfig2 = obj.message;
            await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, obj1);
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, [], obj.callback);
          }
          break;
        }
        case "updateCustom": {
          if (obj.message && obj.message.state) {
            const state = await this.getForeignObjectAsync(obj.message.state);
            if (state && state.common && state.common.custom && state.common.custom[this.namespace]) {
              this.log.debug(`updateCustom ${JSON.stringify(state.common.custom[this.namespace])}`);
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, [], obj.callback);
          }
          break;
        }
        case "CheckPageItemConfig": {
          let messages = [];
          let error = void 0;
          if (obj.message && obj.message.item && obj.message.page) {
            const result = await this.convertAdminPageItemToPageItemConfig(
              obj.message.item,
              obj.message.page,
              messages
            );
            messages = result.messages;
            error = result.error;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { messages, error }, obj.callback);
          }
          break;
        }
        case "ScriptConfigGlobal": {
          const manager = new import_config_manager.ConfigManager(this);
          try {
            let r = { messages: [], panelConfig: void 0 };
            const config = structuredClone(obj.message.panelTopic);
            r = await manager.setScriptConfig({ ...obj.message, panelTopic: config });
            await manager.delete();
            const result = r.messages;
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, result, obj.callback);
            }
          } catch (e) {
            this.log.error(`Error in script config processing: ${e.message}`);
            if (obj.callback) {
              this.sendTo(
                obj.from,
                obj.command,
                `Error in script config processing: ${e.message}`,
                obj.callback
              );
            }
          }
          break;
        }
        case "ScriptConfig": {
          let result = ["something went wrong"];
          if (obj.message) {
            if (this.scriptConfigBacklog.length > 3) {
              if (obj.callback) {
                this.sendTo(
                  obj.from,
                  obj.command,
                  `\u26A0\uFE0F Too many configuration changes at once. Please wait a few seconds.`,
                  obj.callback
                );
              }
              break;
            }
            this.scriptConfigBacklog.push(obj);
            if (this.scriptConfigBacklog.length > 1) {
              break;
            }
            while (this.scriptConfigBacklog[0] != null) {
              const manager = new import_config_manager.ConfigManager(this);
              const obj2 = this.scriptConfigBacklog[0];
              let r = { messages: [], panelConfig: void 0 };
              if (obj2.message.panelTopic && Array.isArray(obj2.message.panelTopic)) {
                const topics = JSON.parse(JSON.stringify(obj2.message.panelTopic));
                for (const a of topics) {
                  r = await manager.setScriptConfig({ ...obj2.message, panelTopic: a });
                }
              } else {
                r = await manager.setScriptConfig(obj2.message);
              }
              if (this.config.testCase) {
                this.testCaseConfig = [r.panelConfig];
              } else {
                let reloaded = false;
                if (r.panelConfig) {
                  const others = [];
                  const instanceObj = await this.getForeignObjectAsync(this.namespace);
                  const stored = (_g = instanceObj == null ? void 0 : instanceObj.native) == null ? void 0 : _g.scriptConfig;
                  if (Array.isArray(stored)) {
                    for (const item of stored) {
                      if (item && item.topic && item.topic !== r.panelConfig.topic && this.config.panels.findIndex((a) => a.topic === item.topic) !== -1) {
                        others.push(item);
                      }
                    }
                  }
                  const arr = await import_config_manager.ConfigManager.getConfig(this, [r.panelConfig, ...others]);
                  if (arr && arr.length > 0) {
                    const config = arr[0];
                    if (this.controller && config) {
                      const topic = config.topic;
                      if (topic) {
                        const index = this.config.panels.findIndex((p) => p.topic === topic);
                        if (index !== -1) {
                          const indexC = this.controller.panels.findIndex(
                            (a) => a.topic === topic
                          );
                          if (indexC !== -1) {
                            config.model = this.config.panels[index].model;
                            await this.controller.removePanel(
                              this.controller.panels[indexC]
                            );
                            if (this.unload) {
                              if (obj2.callback) {
                                this.sendTo(
                                  obj2.from,
                                  obj2.command,
                                  "Adapter is stopping",
                                  obj2.callback
                                );
                              }
                              return;
                            }
                            await this.delay(1e3);
                            if (this.unload) {
                              if (obj2.callback) {
                                this.sendTo(
                                  obj2.from,
                                  obj2.command,
                                  "Adapter is stopping",
                                  obj2.callback
                                );
                              }
                              return;
                            }
                          }
                          const done = await this.controller.addPanel(config);
                          if (done) {
                            const name = config.name || config.topic;
                            const msg = `\u2705 Panel "${name}" reloaded with updated configuration.`;
                            this.log.info(msg);
                            r.messages.push(msg);
                            reloaded = true;
                          } else {
                            const msg = `Panel ${topic} found but could not be reloaded. Check log for details.`;
                            this.log.error(msg);
                            r.messages.push(msg);
                          }
                        } else {
                          r.messages.push(
                            `Panel ${topic} not found in Adapter configuration. Check Admin configuration for correct panel topic.`
                          );
                        }
                      } else {
                        r.messages.push(
                          `Panel ${topic} not found in script. Configuration saved. Adapter restart required!`
                        );
                      }
                    } else {
                      r.messages.push(
                        this.controller ? `Controller not exist.  Configuration saved. Adapter restart required!` : `Config not exist. `
                      );
                    }
                  } else {
                    r.messages.push(`No config found after conversion`);
                  }
                } else {
                  r.messages.push(`Invalid configuration!`);
                }
                if (!reloaded) {
                  let msg = "";
                  if (this.paused) {
                    msg = `\u274C Adapter is paused try to restart it by itself. Check logs for more details.`;
                    this.log.info(msg);
                    result = r.messages;
                    if (obj2.callback) {
                      this.sendTo(obj2.from, obj2.command, result, obj2.callback);
                    }
                    await manager.delete();
                    this.restart();
                    return;
                  }
                  msg = `\u274C Panel was not restarted due to configuration errors or missing panel instance. Please verify the panel topic and base configuration.`;
                  this.log.info(msg);
                  r.messages.push(msg);
                }
              }
              await manager.delete();
              result = r.messages;
              if (obj2.callback) {
                this.sendTo(obj2.from, obj2.command, result, obj2.callback);
              }
              this.scriptConfigBacklog.shift();
              if (this.scriptConfigBacklog.length > 0) {
                await this.delay(3e3);
              }
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, "something when wrong", obj.callback);
          }
          break;
        }
        case "setPopupNotification": {
          if (((_i = (_h = this.controller) == null ? void 0 : _h.panels) == null ? void 0 : _i.some((p) => p.status === "online")) && obj.message) {
            await this.controller.setPopupNotification(obj.message);
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, [], obj.callback);
            }
          } else {
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, { error: "No Panels Online" }, obj.callback);
            }
          }
          break;
        }
        case "testCase": {
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { testSuccessful: this.testSuccessful }, obj.callback);
          }
          break;
        }
        case "getTasmotaDevices": {
          if (this.config.panels) {
            const devices = this.config.panels.map((a) => {
              return { label: `${a.ip} (${a.name})`, value: a.ip };
            });
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, devices, obj.callback);
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "nsPanelInit": {
          this.log.warn("Received the outdated nsPanelInit command, the admin page has to be reloaded!");
          this.answerMessage(obj, { error: "sendToReloadAdmin" });
          break;
        }
        case "nsPanelInitStep1": {
          await this.nsPanelInitStep1(obj);
          break;
        }
        case "nsPanelInitStep2": {
          await this.nsPanelInitStep2(obj);
          break;
        }
        case "nsPanelInitStep3": {
          await this.nsPanelInitStep3(obj);
          break;
        }
        case "berryInstallSendTo": {
          if (obj.message) {
            if (obj.message.tasmotaIP) {
              try {
                let result = void 0;
                result = await this.getVersionsJson();
                if (!result) {
                  this.log.error("No version found!");
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToRequestFail5" },
                      obj.callback
                    );
                  }
                  break;
                }
                const version = obj.message.useBetaTFT ? result[`berry-beta`].split("_")[0] : result.berry.split("_")[0];
                const url = this.getBerryInstallUrl(obj.message.tasmotaIP, version);
                this.log.info(`Installing berry on tasmota with IP ${obj.message.tasmotaIP}`);
                await this.fetch(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: while installing berry - ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail6" }, obj.callback);
                }
              }
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "tftInstallSendTo": {
          if (obj.message) {
            if (obj.message.tasmotaIP) {
              try {
                const cmnd = await this.getTFTVersionOnline(
                  obj.message.model,
                  obj.message.useBetaTFT,
                  this.config.forceTFTVersion
                );
                if (!cmnd) {
                  this.log.error("No version found!");
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToRequestFail7" },
                      obj.callback
                    );
                  }
                  break;
                }
                const url = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog ${cmnd}`;
                this.log.debug((0, import_redact.redactSecretsInText)(url));
                await this.fetch(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail8" }, obj.callback);
                }
              }
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "tftInstallSendToMQTT": {
          if (obj.message) {
            if (obj.message.topic) {
              try {
                const cmnd = await this.getTFTVersionOnline(
                  obj.message.model,
                  obj.message.useBetaTFT,
                  this.config.forceTFTVersion
                );
                if (!cmnd) {
                  this.log.error("No version found!");
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToRequestFail9" },
                      obj.callback
                    );
                  }
                  break;
                }
                if ((_j = this.controller) == null ? void 0 : _j.panels) {
                  const index = this.controller.panels.findIndex((a) => a.topic === obj.message.topic);
                  if (index !== -1) {
                    const panel = this.controller.panels[index];
                    panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                    await this.delay(100);
                    panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, ``);
                  }
                }
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail10" }, obj.callback);
                }
              }
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "getRandomMqttCredentials": {
          if (obj.message) {
            const allowedChars = [
              ..."abcdefghijklmnopqrstuvwxyz",
              ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
              ..."0123456789",
              ..."()*+-.:<=>[]_"
            ];
            const allowedCharsUser = [
              ..."abcdefghijklmnopqrstuvwxyz",
              ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"
              // c|Yh7Pe<&1ap34t/]S&TxDwL&KDWqW-Se_D@vtXh,z]|T[RIqLgz.>^3H1j<
            ];
            const passwordLength = 50;
            const usernameLength = 15;
            const getString = (c, length) => {
              let result2 = "";
              for (let i = 0; i < length; i++) {
                const random = Math.floor(Math.random() * c.length);
                result2 += c[random];
              }
              return result2;
            };
            const result = {
              native: {
                mqttUsername: getString(allowedCharsUser, usernameLength),
                mqttPassword: getString(allowedChars, passwordLength),
                mqttPort: await this.getPortAsync(8883),
                saveConfig: true
              }
            };
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, result, obj.callback);
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "error" }, obj.callback);
          }
          break;
        }
        case "tasmotaRestartSendTo": {
          if (obj.message) {
            if (obj.message.tasmotaIP) {
              try {
                const url = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Restart 1`;
                this.log.debug((0, import_redact.redactSecretsInText)(url));
                await this.fetch(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail11" }, obj.callback);
                }
              }
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "resetTasmota": {
          if (obj.message) {
            if (obj.message.tasmotaIP) {
              try {
                const url = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=reset 4`;
                this.log.debug(`Reset to factory defaults tasmota with IP ${obj.message.tasmotaIP}`);
                await this.fetch(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail12" }, obj.callback);
                }
              }
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "refreshMaintainTable": {
          const added = [];
          let result = [];
          const flashingText = this.library.getTranslation("Updating");
          const flashingObj = {};
          let file = void 0;
          if (fs.existsSync(import_node_path.default.join(__dirname, "../script"))) {
            file = fs.readFileSync(
              import_node_path.default.join(__dirname, "../script/example_sendTo_script_iobroker.ts"),
              "utf8"
            );
          }
          const vTemp = (file == null ? void 0 : file.match(/const version = '(\d+\.\d+\.\d+)';/)) || [];
          const version = vTemp[1] ? vTemp[1] : "";
          for (let a = 0; a < this.config.panels.length; a++) {
            const panel = this.config.panels[a];
            const state = this.library.readdb(`panels.${panel.id}.info.nspanel.firmwareUpdate`);
            if (state && typeof state.val === "number" && state.val < 100) {
              flashingObj[panel.id] = `${flashingText}: ${state.val}%`;
            }
          }
          const compareSemver = (a, b) => {
            const pa = a.split(".").map(Number);
            const pb = b.split(".").map(Number);
            for (let i = 0; i < 3; i++) {
              if (pa[i] > pb[i]) {
                return 1;
              }
              if (pa[i] < pb[i]) {
                return -1;
              }
            }
            return 0;
          };
          if ((_k = this.controller) == null ? void 0 : _k.panels) {
            const updateText = this.library.getTranslation("updateAvailable");
            const downgradeText = this.library.getTranslation("downgradeAvailable");
            const checkText = this.library.getTranslation("check!");
            const temp = [];
            for (const a of this.controller.panels) {
              let check = false;
              let check_tasmota = false;
              let check_tft = false;
              let check_script = false;
              let tv = "";
              let nv = "";
              let sv = "";
              const ft = flashingObj[a.name];
              const scriptId = this.library.cleandp(
                `${scriptPath}.${this.library.cleandp(a.friendlyName, false, true)}`
              );
              const o = await this.getForeignObjectAsync(scriptId);
              if (o) {
                const temp2 = (_m = (_l = o.common.source.match(/const.version.+'(\d+\.\d+\.\d+)';/)) == null ? void 0 : _l[1]) != null ? _m : "";
                if (temp2 !== version) {
                  check = true;
                  check_script = true;
                  sv = `${temp2} (${updateText}: v${version})`;
                } else {
                  sv = temp2;
                }
              }
              if (a.info) {
                if ((_n = a.info.tasmota) == null ? void 0 : _n.firmwareversion) {
                  const temp2 = a.info.tasmota.firmwareversion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                  if (temp2 && temp2[1]) {
                    tv = `${temp2[1]}`;
                  }
                }
                if (((_o = a.info.tasmota) == null ? void 0 : _o.onlineVersion) && tv) {
                  const temp2 = a.info.tasmota.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                  if (temp2 && temp2[1]) {
                    const cmp = compareSemver(temp2[1], tv);
                    if (cmp > 0) {
                      tv += ` (${updateText})`;
                      check = true;
                      check_tasmota = true;
                    } else if (cmp < 0) {
                      tv += ` (${downgradeText})`;
                      check_tasmota = true;
                    }
                  }
                }
                tv = tv ? `v${tv}` : "";
                if ((_p = a.info.nspanel) == null ? void 0 : _p.displayVersion) {
                  const temp2 = a.info.nspanel.displayVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                  if (temp2 && temp2[1]) {
                    nv = `${temp2[1]}`;
                  }
                }
                if (((_q = a.info.nspanel) == null ? void 0 : _q.onlineVersion) && nv) {
                  const temp2 = a.info.nspanel.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
                  if (temp2 && temp2[1]) {
                    const cmp = compareSemver(temp2[1], nv);
                    if (nv === "0.0.0") {
                      nv += ` (Developer version!)`;
                      check = true;
                      check_tft = true;
                    } else if (cmp > 0) {
                      nv += ` (${updateText})`;
                      check = true;
                      check_tft = true;
                    } else if (cmp < 0) {
                      nv += ` (${downgradeText})`;
                      check = true;
                      check_tft = true;
                    }
                  }
                }
                nv = nv ? `v${nv}` : "";
              }
              added.push(a.topic);
              temp.push({
                _check: check,
                _check_tasmota: check_tasmota,
                _check_tft: check_tft,
                _check_script: check_script,
                _Headline: `${a.friendlyName} (${ft ? ft : `${check ? checkText : `${a.isOnline ? "online" : a.flashing ? `flashing` : "offline"}`}`})`,
                _name: a.friendlyName,
                _ip: ((_t = (_s = (_r = a.info) == null ? void 0 : _r.tasmota) == null ? void 0 : _s.net) == null ? void 0 : _t.IPAddress) ? a.info.tasmota.net.IPAddress : "offline - waiting",
                _online: a.isOnline && a.initDone ? "yes" : "no",
                _flashing: a.flashing,
                _topic: a.topic,
                _id: ((_w = (_v = (_u = a.info) == null ? void 0 : _u.tasmota) == null ? void 0 : _v.net) == null ? void 0 : _w.Mac) ? a.info.tasmota.net.Mac : "",
                _tftVersion: nv ? nv : "???",
                _tasmotaVersion: tv ? tv : "???",
                _ScriptVersion: sv ? `v${sv}` : "???",
                _nsPanelModel: ((_y = (_x = a.info) == null ? void 0 : _x.nspanel) == null ? void 0 : _y.model) ? a.info.nspanel.model == "eu" ? "" : a.info.nspanel.model : ""
              });
            }
            result = result.concat(temp);
          }
          if (this.config.panels) {
            const temp2 = this.config.panels.filter((a) => {
              return added.findIndex((b) => b === a.topic) === -1;
            });
            const temp = [];
            for (const a of temp2) {
              const ft = flashingObj[a.name];
              let sv = version;
              const scriptId = this.library.cleandp(
                `${scriptPath}.${this.library.cleandp(a.name, false, true)}`
              );
              const o = await this.getForeignObjectAsync(scriptId);
              if (o) {
                const temp3 = (_A = (_z = o.common.source.match(/const.version.+'(\d+\.\d+\.\d+)';/)) == null ? void 0 : _z[1]) != null ? _A : "";
                if (temp3 !== version) {
                  sv = temp3 ? temp3 : version;
                }
              }
              temp.push({
                _check: false,
                _Headline: `${a.name} (${ft ? ft : `${this.mainConfiguration ? this.mainConfiguration.findIndex((b) => b.topic === a.topic) === -1 ? "Missing configuration!" : "offline - waiting" : "offline"}`})`,
                _name: a.name,
                _ip: this.mainConfiguration ? this.mainConfiguration.findIndex((b) => b.topic === a.topic) === -1 ? "Missing configuration!" : "offline - waiting" : "offline",
                _online: "no",
                _topic: a.topic,
                _id: "",
                _tftVersion: "---",
                _tasmotaVersion: "---",
                _ScriptVersion: sv ? `v${sv}` : "???",
                _nsPanelModel: a.model
              });
            }
            result = result.concat(temp);
          }
          if (result.length > 0) {
            result.sort((a, b) => a._name.localeCompare(b._name));
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, { native: { _maintainPanels: result } }, obj.callback);
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "createScript": {
          const result = await this.createConfigurationScript(obj.message.name, obj.message.topic);
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, result, obj.callback);
          }
          break;
        }
        case "getIcons": {
          const icons = Array.from(import_icon_mapping.Icons.iconMap, ([name]) => name).map((a) => {
            return { label: a, value: a };
          });
          this.sendTo(obj.from, obj.command, icons, obj.callback);
          break;
        }
        case "getIconBase64": {
          try {
            if (fs.existsSync(import_node_path.default.join(__dirname, "../script"))) {
              const fileContent = fs.readFileSync(import_node_path.default.join(__dirname, "../script/icons.json"), "utf-8");
              const icons = JSON.parse(fileContent);
              const index = icons.findIndex((a) => a.name === obj.message.icon);
              let img = "";
              if (index !== -1) {
                img = icons[index].base64;
              }
              this.sendTo(obj.from, obj.command, img, obj.callback);
            }
          } catch (error) {
            console.error("Fehler beim Verarbeiten der Datei:", error);
          }
          break;
        }
        case "updateTasmota": {
          let language = this.library.getLocalLanguage();
          language = language === "zh-cn" ? "en" : language;
          const result = await this.getVersionsJson();
          if (result && "tasmota" in result && typeof result.tasmota === "string") {
            const cmnd = `OtaUrl http://ota.tasmota.com/tasmota32/release-${result.tasmota.trim()}/tasmota32-${language.toUpperCase()}.bin; Upgrade 1`;
            if ((_B = this.controller) == null ? void 0 : _B.panels) {
              const index = this.controller.panels.findIndex((a) => a.topic === obj.message.topic);
              if (index !== -1) {
                const panel = this.controller.panels[index];
                panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
              }
            }
          } else {
            this.log.warn(`Error getting Tasmota version!`);
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, [], obj.callback);
          }
          break;
        }
        case "openTasmotaConsole":
        case "openLinkToTasmota": {
          if (obj.callback) {
            this.sendTo(
              obj.from,
              obj.command,
              {
                openUrl: `http://${obj.message.ip}:80/${obj.command === "openTasmotaConsole" ? "cs?" : ""}`,
                saveConfig: false
              },
              obj.callback
            );
          }
          break;
        }
        case "openLinkAliasTable": {
          if (obj.callback) {
            this.sendTo(
              obj.from,
              obj.command,
              {
                openUrl: obj.message.url,
                saveConfig: false
              },
              obj.callback
            );
          }
          break;
        }
        case "screensaverNotify": {
          if (((_C = obj.message) == null ? void 0 : _C.panel) && ((_D = this.controller) == null ? void 0 : _D.panels)) {
            const panel = this.controller.panels.find((a) => a.topic === obj.message.topic);
            if (panel == null ? void 0 : panel.screenSaver) {
              if (typeof obj.message.heading === "string") {
                await panel.statesControler.setInternalState(
                  `${panel.name}/cmd/screensaverHeadingNotification`,
                  obj.message.heading,
                  false
                );
              }
              if (typeof obj.message.text === "string") {
                await panel.statesControler.setInternalState(
                  `${panel.name}/cmd/screensaverTextNotification`,
                  obj.message.text,
                  false
                );
              }
              await panel.statesControler.setInternalState(
                `${panel.name}/cmd/screensaverActivateNotification`,
                !!obj.message.enabled,
                false
              );
            } else {
              this.log.warn(`Panel ${obj.message.panel} not exists!`);
            }
          } else {
            this.log.warn(
              `Missing panel in screensaverNotify: ${JSON.stringify(obj.message)} or controller not ready!`
            );
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "buzzer": {
          if (((_E = obj.message) == null ? void 0 : _E.panel) && ((_F = this.controller) == null ? void 0 : _F.panels)) {
            const panel = this.controller.panels.find((a) => a.topic === obj.message.panel);
            if (panel && typeof obj.message.command === "string" && obj.message.command.trim()) {
              await panel.statesControler.setInternalState(
                `${panel.name}/cmd/buzzer`,
                obj.message.command.trim(),
                false
              );
            } else {
              this.log.warn(`Panel ${obj.message.panel} not found or invalid buzzer command!`);
            }
          } else {
            this.log.warn(
              `Missing panel or command in buzzer: ${JSON.stringify(obj.message)} or controller not ready!`
            );
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, [], obj.callback);
          }
          break;
        }
        case "uploadIcs": {
          if (obj.command === "uploadIcs") {
            try {
              const { filename, content } = obj.message;
              await this.writeFileAsync(this.namespace, filename, content);
              this.log.info(`ICS-Datei in ioBroker-Dateisystem gespeichert : ${filename}`);
              const data = import_node_ical.default.parseICS(content);
              const eventNames = /* @__PURE__ */ new Set();
              for (const k in data) {
                const component = data[k];
                if (component && component.type === "VEVENT") {
                  const eventSummary = component.summary !== void 0 ? component.summary : null;
                  const eventName = typeof eventSummary === "string" ? eventSummary : eventSummary == null ? void 0 : eventSummary.val;
                  if (eventName && typeof eventName === "string" && eventName.trim() !== "") {
                    eventNames.add(eventName);
                  }
                }
              }
              const events = Array.from(eventNames).map((name) => ({ summary: name }));
              this.log.debug(
                `ICS-Datei verarbeitet. Folgende Ereignisse gefunden: ${JSON.stringify(events)}`
              );
              if (obj.callback) {
                this.sendTo(
                  obj.from,
                  obj.command,
                  { success: true, path: filename, events },
                  obj.callback
                );
              }
            } catch (error) {
              this.log.error(`Fehler beim ICS-Upload: ${error}`);
              if (obj.callback) {
                this.sendTo(
                  obj.from,
                  obj.command,
                  { success: false, error: error.message },
                  obj.callback
                );
              }
            }
          }
          break;
        }
        default: {
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
        }
      }
    } else {
      if (obj.callback) {
        this.sendTo(obj.from, obj.command, { error: "failed" }, obj.callback);
      }
    }
  }
  async writeStateExternalAsync(dp, val) {
    if (dp.startsWith(this.namespace)) {
      return;
    }
    await this.setForeignStateAsync(dp, val, false);
  }
  async createGlobalConfigurationScript() {
    var _a;
    const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;
    const folder = {
      type: "channel",
      _id: scriptPath,
      common: {
        name: this.namespace,
        expert: true
      },
      native: {}
    };
    await this.extendForeignObjectAsync(scriptPath, folder);
    const scriptId = this.library.cleandp(`${scriptPath}.globalPageConfig`);
    this.log.debug(`Create/Update script ${scriptId}`);
    if (fs.existsSync(import_node_path.default.join(__dirname, "../script"))) {
      let file = fs.readFileSync(import_node_path.default.join(__dirname, "../script/globalPageConfig.ts"), "utf8");
      const baseFile = fs.readFileSync(
        import_node_path.default.join(__dirname, "../script/example_sendTo_script_iobroker.ts"),
        "utf8"
      );
      const o = await this.getForeignObjectAsync(scriptId);
      if (baseFile && file) {
        file = file.replace(
          /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfigGlobal',/,
          `await sendToAsync('${this.namespace}', 'ScriptConfigGlobal',`
        );
        const token = "stopScript(scriptName, undefined)";
        if (o) {
          const indexFrom = baseFile.indexOf(token);
          const indexTo = o.common.source.indexOf(token);
          if (indexFrom !== -1 && indexTo !== -1) {
            this.log.info(`Update script ${scriptId}`);
            file = o.common.source.substring(0, indexTo) + baseFile.substring(indexFrom);
          } else {
            this.log.warn(`Update script ${scriptId} something whent wrong!`);
            return { error: `Update script ${scriptId} something whent wrong!` };
          }
          this.log.info(`Update global script ${scriptId}`);
        } else {
          const indexFrom = baseFile.indexOf(token);
          const indexTo = file.indexOf(token);
          if (indexFrom !== -1 && indexTo !== -1) {
            this.log.info(`Update script ${scriptId}`);
            file = file.substring(0, indexTo) + baseFile.substring(indexFrom);
          } else {
            this.log.warn(`Update script ${scriptId} something whent wrong!`);
            return { error: `Update script ${scriptId} something whent wrong!` };
          }
          this.log.info(`Create global script ${scriptId}`);
        }
        const script = {
          type: "script",
          _id: scriptId,
          common: {
            name: "Global page configuration",
            engineType: "TypeScript/ts",
            engine: `system.adapter.javascript.0`,
            source: file,
            debug: false,
            verbose: false,
            enabled: (_a = o == null ? void 0 : o.common.enabled) != null ? _a : true
          },
          native: {}
        };
        await this.extendForeignObjectAsync(scriptId, script);
        return [];
      }
    }
  }
  /**
   * Baut die Kommando-URL für ein Tasmota-Gerät.
   *
   * @param tasmotaIP - IP-Adresse des Tasmota-Geräts
   * @param command - der Wert für `cmnd`, bereits fertig kodiert
   * @returns die vollständige URL
   */
  getTasmotaCommandUrl(tasmotaIP, command) {
    return `http://${tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=${command}`;
  }
  /**
   * Antwortet auf eine sendTo-Nachricht, sofern sie einen Callback hat.
   *
   * @param obj - die sendTo-Nachricht
   * @param payload - die Antwort für den Admin
   */
  answerMessage(obj, payload) {
    if (obj.callback) {
      this.sendTo(obj.from, obj.command, payload, obj.callback);
    }
  }
  /**
   * Holt den Zwischenstand einer laufenden Einrichtung und beantwortet die Nachricht selbst,
   * wenn es keinen gibt.
   *
   * @param obj - die sendTo-Nachricht
   * @returns Topic und Zwischenstand oder null, wenn die Nachricht bereits beantwortet wurde
   */
  getNsPanelInitSession(obj) {
    var _a;
    this.purgeNsPanelInitSessions();
    const topic = (_a = obj.message) == null ? void 0 : _a.tasmotaTopic;
    const session = topic ? this.nsPanelInitSessions.get(topic) : void 0;
    if (!topic || !session) {
      this.log.warn(`No running setup found for topic ${topic != null ? topic : "unknown"}!`);
      this.answerMessage(obj, { error: "sendToInitSessionLost" });
      return null;
    }
    return { topic, session };
  }
  /**
   * Schritt 1 von 3 der Panel-Einrichtung: MQTT-Zugang übertragen und den Neustart abwarten.
   *
   * Die Einrichtung ist auf drei sendTo-Aufrufe verteilt, weil der Admin jede Antwort verwirft,
   * die länger als 30 Sekunden auf sich warten lässt (`socket.io.js`, `withCallback`: der
   * Callback wird nach 30 s mit dem String `timeout` aufgerufen und verworfen). Der komplette
   * Ablauf dauert rund 40 Sekunden, jeder einzelne Schritt bleibt deutlich darunter und meldet
   * seinen Meilenstein zurück.
   *
   * @param obj - die sendTo-Nachricht aus dem Admin
   */
  async nsPanelInitStep1(obj) {
    var _a, _b;
    const msg = obj.message;
    const useInternalServer = !((msg == null ? void 0 : msg.mqttServer) == null || msg.mqttServer === false || msg.mqttServer === "false");
    const missing = [];
    for (const field of ["tasmotaIP", "tasmotaName", "tasmotaTopic", "mqttPort", "mqttUsername", "mqttPassword"]) {
      if (!(msg == null ? void 0 : msg[field])) {
        missing.push(field);
      }
    }
    if (useInternalServer ? !(msg == null ? void 0 : msg.internalServerIp) : !(msg == null ? void 0 : msg.mqttIp)) {
      missing.push(useInternalServer ? "internalServerIp" : "mqttIp");
    }
    if (missing.length > 0) {
      this.log.warn(`nsPanelInit: the message from the admin is missing: ${missing.join(", ")}!`);
      this.answerMessage(obj, { error: "sendToAnyError" });
      return;
    }
    msg.mqttServer = useInternalServer;
    const topic = msg.tasmotaTopic;
    let panel = void 0;
    try {
      this.log.info(
        `Sending mqtt config & base config to tasmota: ${msg.tasmotaIP} with user ${msg.mqttUsername} && ***`
      );
      const panels = (_a = this.config.panels) != null ? _a : [];
      const index = panels.findIndex((a) => a.topic === topic);
      const item = index === -1 ? { name: "", ip: "", topic: "", id: "", model: "eu" } : panels[index];
      const ipIndex = panels.findIndex((a) => a.ip === msg.tasmotaIP);
      if (!await this.getVersionsJson()) {
        this.log.error(
          "Could not fetch version json! Check your internet connection and the url in the adapter configuration!"
        );
        this.answerMessage(obj, { error: "sendToVersionJsonFetchFailed" });
        return;
      }
      if (index !== -1 && ipIndex !== index) {
        this.log.error("Topic and ip are not on the same panel!");
        this.answerMessage(obj, { error: "sendToIpTopicDifferent" });
        return;
      }
      panel = (_b = this.controller) == null ? void 0 : _b.panels.find((a) => a.topic === topic);
      if (panel) {
        void panel.setStatus("setup");
      }
      let u = new import_node_url.URL(this.getTasmotaCommandUrl(msg.tasmotaIP, `status 5`));
      this.log.debug(`Requesting tasmota status 5 with url: ${(0, import_redact.redactSecretsInText)(u.href)}`);
      const r = await this.fetch(u.href);
      this.log.debug(`Response from tasmota status 5: ${JSON.stringify(r)}`);
      if (!(0, import_function_and_const.isTasmotaStatusNet)(r) || !r || !r.StatusNET || !r.StatusNET.Mac) {
        this.log.warn(`Device with topic ${topic} not found!`);
        this.answerMessage(obj, { error: "sendToDeviceNotFound" });
        if (panel) {
          void panel.setStatus("error");
        }
        return;
      }
      const appendix = r.StatusNET.Mac.replace(/:/g, "").slice(-6);
      const mqttClientId = `${this.library.cleandp(msg.tasmotaName)}-${appendix}`;
      const url = ` MqttHost ${msg.mqttServer ? msg.internalServerIp : msg.mqttIp}; MqttPort ${msg.mqttPort}; MqttUser ${msg.mqttUsername}; MqttPassword ${msg.mqttPassword}; FullTopic ${`${topic}/%prefix%/`.replaceAll("//", "/")}; MqttRetry 10; FriendlyName1 ${msg.tasmotaName}; Hostname ${msg.tasmotaName.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}; MqttClient ${mqttClientId}; ${msg.mqttServer ? "SetOption132 1; SetOption103 1 " : "SetOption132 0; SetOption103 0"}; Restart 1`;
      u = new import_node_url.URL(this.getTasmotaCommandUrl(msg.tasmotaIP, `Backlog${encodeURIComponent(url)}`));
      this.log.debug(
        `Sending mqtt config & base config to tasmota with IP ${msg.tasmotaIP} and name ${msg.tasmotaName}.`
      );
      await this.fetch(u.href);
      this.mqttClient && await this.mqttClient.waitPanelConnectAsync(topic, 6e4);
      this.purgeNsPanelInitSessions();
      this.nsPanelInitSessions.set(topic, {
        item,
        isNew: index === -1,
        isEmulator: false,
        ts: Date.now()
      });
      this.answerMessage(obj, { result: "sendToNSPanelInitStep1Done", step: 1 });
    } catch (e) {
      this.nsPanelInitSessions.delete(topic);
      this.logNsPanelInitError(1, msg.tasmotaIP, e);
      if (panel) {
        void panel.setStatus("error");
      }
      this.answerMessage(obj, { error: "sendToRequestFail4" });
    }
  }
  /**
   * Schritt 2 von 3 der Panel-Einrichtung: Template, Zeitzone und Messbereich übertragen,
   * danach die Treiberversion abfragen.
   *
   * @param obj - die sendTo-Nachricht aus dem Admin
   */
  async nsPanelInitStep2(obj) {
    var _a;
    const found = this.getNsPanelInitSession(obj);
    if (!found) {
      return;
    }
    const { topic, session } = found;
    const msg = obj.message;
    const panel = (_a = this.controller) == null ? void 0 : _a.panels.find((a) => a.topic === topic);
    try {
      let u = new import_node_url.URL(
        this.getTasmotaCommandUrl(
          msg.tasmotaIP,
          `Backlog${encodeURIComponent(
            ` WebLog 2;SetOption111 1; template {"NAME":"${msg.tasmotaName}", "GPIO":[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0],"FLAG":0,"BASE":1}; Module 0;${this.config.timezone ? definition.getTasmotaTimeZone(this.config.timezone) : ""}; restart 1`
          )}`
        )
      );
      await this.fetch(u.href);
      this.mqttClient && await this.mqttClient.waitPanelConnectAsync(topic, 6e4);
      u = new import_node_url.URL(this.getTasmotaCommandUrl(msg.tasmotaIP, `status 0`));
      const r = await this.fetch(u.href);
      if (!(0, import_function_and_const.isTasmotaStatusNet)(r) || !r || !r.StatusNET || !r.StatusNET.Mac) {
        this.log.warn(`Device with topic ${topic} not found!`);
        this.answerMessage(obj, { error: "sendToDeviceNotFound" });
        if (panel) {
          void panel.setStatus("error");
        }
        return;
      }
      u = new import_node_url.URL(this.getTasmotaCommandUrl(msg.tasmotaIP, encodeURIComponent(`AdcParam 2,14600,10000,3950`)));
      await this.fetch(u.href);
      await this.delay(150);
      session.item.model = msg.model || "eu";
      session.item.name = msg.tasmotaName;
      session.item.topic = topic;
      session.item.id = this.library.cleandp(r.StatusNET.Mac);
      session.item.ip = r.StatusNET.IPAddress;
      let driver = void 0;
      try {
        driver = await this.fetch(
          this.getTasmotaCommandUrl(msg.tasmotaIP, `GetDriverVersion`),
          void 0,
          3e3
        );
      } catch {
      }
      session.isEmulator = (driver == null ? void 0 : driver.nlui_driver_version) === "-1";
      session.ts = Date.now();
      this.answerMessage(obj, { result: "sendToNSPanelInitStep2Done", step: 2 });
    } catch (e) {
      this.nsPanelInitSessions.delete(topic);
      this.logNsPanelInitError(2, msg.tasmotaIP, e);
      if (panel) {
        void panel.setStatus("error");
      }
      this.answerMessage(obj, { error: "sendToRequestFail4" });
    }
  }
  /**
   * Schritt 3 von 3 der Panel-Einrichtung: Berry-Treiber und TFT installieren, das
   * Konfigurationsskript anlegen und die Panelliste an den Admin zurückgeben.
   *
   * @param obj - die sendTo-Nachricht aus dem Admin
   */
  async nsPanelInitStep3(obj) {
    var _a, _b;
    const found = this.getNsPanelInitSession(obj);
    if (!found) {
      return;
    }
    const { topic, session } = found;
    const msg = obj.message;
    const panel = (_a = this.controller) == null ? void 0 : _a.panels.find((a) => a.topic === topic);
    try {
      const versionsJson = await this.getVersionsJson();
      if (!session.isEmulator) {
        try {
          if (!versionsJson) {
            this.log.error("No version found!");
            this.answerMessage(obj, { error: "sendToRequestFail1" });
            if (panel) {
              void panel.setStatus("error");
            }
            return;
          }
          if (!await this.checkTasmotaHasInternetAccess(msg.tasmotaIP, topic, this.config.berryUrl)) {
            this.answerMessage(obj, { error: "sendToNoInternetAccess" });
            if (panel) {
              void panel.setStatus("error");
            }
            return;
          }
          const version = msg.useBetaTFT ? versionsJson[`berry-beta`].split("_")[0] : versionsJson.berry.split("_")[0];
          let url = this.getBerryInstallUrl(msg.tasmotaIP, version);
          this.log.info(`Installing berry on tasmota with IP ${msg.tasmotaIP}, name ${msg.tasmotaName}.`);
          this.log.debug(`URL: ${(0, import_redact.redactSecretsInText)(url)}`);
          await this.fetch(url);
          try {
            this.mqttClient && await this.mqttClient.waitTasmotaUrlFetch(topic, 5e3);
          } catch {
            this.log.error(
              `Did not receive download confirmation from tasmota ${msg.tasmotaIP} after berry install.`
            );
            this.answerMessage(obj, { error: "sendToRequestFailBerry" });
            return;
          }
          url = this.getRestartTasmotaUrl(msg.tasmotaIP);
          await this.fetch(url);
          this.mqttClient && await this.mqttClient.waitPanelConnectAsync(topic, 2e4);
          await this.delay(1e3);
        } catch (e) {
          this.log.error(`Error: while installing berry - ${String(e)}`);
          if (panel) {
            void panel.setStatus("error");
          }
        }
        try {
          await this.delay(1500);
          const cmnd = await this.getTFTVersionOnline(
            msg.model,
            msg.useBetaTFT,
            this.config.forceTFTVersion,
            versionsJson
          );
          if (!cmnd) {
            this.log.error("No version found!");
            this.answerMessage(obj, { error: "sendToRequestFail2" });
            if (panel) {
              void panel.setStatus("error");
            }
            return;
          }
          if (this.mqttClient) {
            await this.mqttClient.publish(`${topic}/cmnd/Backlog`, `${cmnd}`);
            await this.delay(100);
            await this.mqttClient.publish(`${topic}/cmnd/Backlog`, ``);
          }
          this.log.info(`Installing tft on tasmota with IP ${msg.tasmotaIP} and name ${msg.tasmotaName}.`);
        } catch (e) {
          this.log.error(`Error: ${String(e)}`);
          this.answerMessage(obj, { error: "sendToRequestFail3" });
          if (panel) {
            void panel.setStatus("error");
          }
          return;
        }
      } else {
        this.log.info(
          `Emulator detected on tasmota with IP ${msg.tasmotaIP} and name ${msg.tasmotaName}, skipping berry install.`
        );
      }
      await this.createConfigurationScript(session.item.name, session.item.topic);
      const panels = (_b = this.config.panels) != null ? _b : [];
      if (session.isNew && !panels.includes(session.item)) {
        panels.push(session.item);
      }
      this.nsPanelInitSessions.delete(topic);
      this.answerMessage(obj, {
        result: session.isNew ? "sendToNSPanelInitDataSuccess" : "sendToNSPanelUpdateDataSuccess",
        native: { panels },
        saveConfig: true,
        step: 3
      });
    } catch (e) {
      this.nsPanelInitSessions.delete(topic);
      this.logNsPanelInitError(3, msg.tasmotaIP, e);
      if (panel) {
        void panel.setStatus("error");
      }
      this.answerMessage(obj, { error: "sendToRequestFail4" });
    }
  }
  /**
   * Verwirft Zwischenstände von Einrichtungen, die der Admin nicht zu Ende geführt hat.
   */
  purgeNsPanelInitSessions() {
    const now = Date.now();
    for (const [key, session] of this.nsPanelInitSessions) {
      if (now - session.ts > NS_PANEL_INIT_SESSION_TTL) {
        this.log.debug(`Discarding the unfinished panel setup for topic ${key}.`);
        this.nsPanelInitSessions.delete(key);
      }
    }
  }
  /**
   * Schreibt einen Fehler aus der Panel-Einrichtung ins Log.
   *
   * @param step - die Nummer des Schritts, in dem der Fehler auftrat
   * @param tasmotaIP - IP-Adresse des Tasmota-Geräts, falls bekannt
   * @param e - der aufgetretene Fehler
   */
  logNsPanelInitError(step, tasmotaIP, e) {
    var _a;
    const stack = (0, import_redact.redactSecretsInText)(e instanceof Error ? (_a = e.stack) != null ? _a : e.message : String(e));
    this.log.error(
      `Error in nsPanelInit step ${step} while sending config to tasmota (${tasmotaIP != null ? tasmotaIP : "unknown IP"}): ${stack}`
    );
  }
  async createConfigurationScript(panelName, panelTopic) {
    var _a;
    await this.createGlobalConfigurationScript();
    const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;
    const folder = {
      type: "channel",
      _id: scriptPath,
      common: {
        name: this.namespace,
        expert: true
      },
      native: {}
    };
    await this.extendForeignObjectAsync(scriptPath, folder);
    const scriptId = this.library.cleandp(`${scriptPath}.${this.library.cleandp(panelName, false, true)}`);
    this.log.debug(`Create script ${scriptId}`);
    if (fs.existsSync(import_node_path.default.join(__dirname, "../script")) && panelName && panelTopic) {
      let file = fs.readFileSync(import_node_path.default.join(__dirname, "../script/example_sendTo_script_iobroker.ts"), "utf8");
      const o = await this.getForeignObjectAsync(scriptId);
      if (file) {
        file = file.replace(`panelTopic: 'topic',`, `panelTopic: '${panelTopic}',`);
        file = file.replace(
          /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfig',/,
          `await sendToAsync('${this.namespace}', 'ScriptConfig',`
        );
        if (o) {
          const token = "*  END STOP END STOP END - No more configuration - END STOP END STOP END       *";
          const indexFrom = file.indexOf(token);
          const indexTo = o.common.source.indexOf(token);
          if (indexFrom !== -1 && indexTo !== -1) {
            this.log.info(`Update script ${scriptId}`);
            file = o.common.source.substring(0, indexTo) + file.substring(indexFrom);
          } else {
            this.log.warn(`Update script ${scriptId} something whent wrong!`);
            return { error: `Update script ${scriptId} something whent wrong!` };
          }
        } else {
          this.log.info(`Create script ${scriptId}`);
        }
        const script = {
          type: "script",
          _id: scriptId,
          common: {
            name: panelName,
            engineType: "TypeScript/ts",
            engine: `system.adapter.javascript.0`,
            source: file,
            debug: false,
            verbose: false,
            enabled: (_a = o == null ? void 0 : o.common.enabled) != null ? _a : true
          },
          native: {}
        };
        await this.extendForeignObjectAsync(scriptId, script);
        return [];
      }
    }
  }
  async getVersionsJson() {
    try {
      if (this.versionJson && Date.now() - this.versionJson.timestamp < 60 * 60 * 1e3) {
        return this.versionJson.data;
      }
      const result = await this.fetch(this.config.versionJsonUrl);
      if (result) {
        this.versionJson = { data: result, timestamp: Date.now() };
        return result;
      }
      this.log.error("No version data received.");
      return void 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error fetching version data: ${errorMessage}`);
      return void 0;
    }
  }
  async getTFTVersionOnline(m, beta, alpha, result) {
    if (!result) {
      result = await this.getVersionsJson();
    }
    const data = result;
    if (!data) {
      this.log.error("No version data received.");
      return null;
    }
    data["tft-alpha"] = alpha;
    const modelSuffix = m && m !== "eu" ? `-${m}` : "";
    const alphaKey = alpha ? `tft${modelSuffix}-alpha` : "";
    const betaKey = beta ? `tft${modelSuffix}-beta` : "";
    const defaultKey = `tft${modelSuffix}`;
    let entry = alpha && data[alphaKey] ? data[alphaKey] : "";
    entry = !entry && beta && data[betaKey] ? data[betaKey] : entry;
    entry = !entry && data[defaultKey] ? data[defaultKey] : entry;
    if (!entry) {
      this.log.error(`No version entry for key "${defaultKey}".`);
      return null;
    }
    const version = String(entry).split("_")[0];
    if (!version) {
      this.log.error(`Invalid version in entry for "${defaultKey}": ${entry}`);
      return null;
    }
    const fileName = `nspanel${modelSuffix}-v${version}.tft`;
    const url = `${this.config.tftUrl}/${encodeURIComponent(fileName)}`;
    const cmnd = `FlashNextionAdv0 ${url}`;
    if (alpha) {
      this.log.warn(`\u26A0\uFE0F  Installing pinned ${alpha} TFT firmware \u2013 for testing only.`);
    }
    this.log.debug(cmnd);
    return cmnd;
  }
  getBerryInstallUrl(tasmotaIP, version) {
    return `http://${tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog UfsDelete autoexec.old; UfsRename autoexec.be,autoexec.old; UrlFetch ${this.config.berryUrl}/${version}/autoexec.be`;
  }
  getRestartTasmotaUrl(tasmotaIP) {
    return `http://${tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Restart%201`;
  }
  async checkTasmotaHasInternetAccess(tasmotaIP, topic, testUrl) {
    try {
      const hostname = new import_node_url.URL(testUrl).hostname;
      const url = `http://${tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Ping%20${encodeURIComponent(hostname)}`;
      await this.fetch(url);
      this.mqttClient && await this.mqttClient.waitTasmotaHasInternet(topic, 5e3, hostname);
      this.log.debug(`Tasmota device at ${tasmotaIP} has internet access.`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.log.error(`Error checking internet access for Tasmota device at ${tasmotaIP}: ${errorMessage}`);
      return false;
    }
  }
  async convertAdminPageItemToPageItemConfig(preItem, prePage, messages) {
    var _a, _b, _c, _d;
    let error = void 0;
    let pageItem = void 0;
    if (preItem && prePage) {
      const manager = new import_config_manager.ConfigManager(this);
      let item = void 0;
      if (preItem.useNative) {
        item = preItem.useNative ? preItem.native : void 0;
      } else if (preItem.isNavigation) {
        item = {
          navigate: true,
          targetPage: (_a = preItem.targetPage) != null ? _a : "",
          type: null,
          id: preItem.channelId.valueStateId
        };
      } else {
        item = {
          type: null,
          id: preItem.channelId.valueStateId
        };
      }
      const convertToScriptRGBColor = (color) => {
        if (!color) {
          return void 0;
        }
        try {
          const c = import_Color.Color.ConvertHexToRgb(color);
          return { red: c.r, green: c.g, blue: c.b };
        } catch {
          this.log.warn(`Invalid color format: ${color}`);
          return void 0;
        }
      };
      if (!item) {
        error = "Invalid/Empty item native configuration!";
        return { pageItem, messages, error };
      }
      if (!("native" in item)) {
        item.type = preItem.type === "custom" ? "custom" : null;
        item.icon = preItem.trueIcon || void 0;
        item.icon2 = preItem.falseIcon || void 0;
        item.onColor = convertToScriptRGBColor(preItem.trueColor);
        item.offColor = convertToScriptRGBColor(preItem.falseColor);
        item.longPress = preItem.longPress || void 0;
        item.targetPageLongPress = preItem.targetPageLongPress || void 0;
        item.name = preItem.name || void 0;
        if ((0, import_function_and_const.isIconColorScaleElement)(preItem.scale)) {
          item.colorScale = {
            ...preItem.scale,
            color_best: preItem.scale.color_best ? {
              red: preItem.scale.color_best.r,
              green: preItem.scale.color_best.g,
              blue: preItem.scale.color_best.b
            } : void 0
          };
        }
        if (item.type !== "custom") {
          item.fontSize = preItem.textSize || preItem.textSize == 0 ? Number(preItem.textSize) : void 0;
          if (!item.name && preItem.valueEntry) {
            item.name = preItem.valueEntry.valueStateId;
            item.suffixName = preItem.valueEntry.suffix ? preItem.valueEntry.suffix : void 0;
            item.prefixName = preItem.valueEntry.prefix ? preItem.valueEntry.prefix : void 0;
          }
          item.prefixValue = ((_b = preItem.channelId) == null ? void 0 : _b.suffix) ? preItem.channelId.suffix : void 0;
          item.suffixValue = ((_c = preItem.channelId) == null ? void 0 : _c.prefix) ? preItem.channelId.prefix : void 0;
          item.unit = ((_d = preItem.channelId) == null ? void 0 : _d.unit) ? preItem.channelId.unit : void 0;
          item.useValue = preItem.useValue;
        }
      }
      const page = {
        type: prePage.card,
        uniqueName: prePage.uniqueName,
        heading: "",
        items: []
      };
      try {
        const result = await manager.getPageItemConfig(item, page, messages);
        messages = result.messages;
        pageItem = result.itemConfig;
      } catch (e) {
        error = `Error in configuration: ${e.message}`;
      }
    }
    return { pageItem, messages, error };
  }
}
if (require.main !== module) {
  module.exports = (options) => new NspanelLovelaceUi(options);
} else {
  (() => new NspanelLovelaceUi())();
}
//# sourceMappingURL=main.js.map
