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
var utils = __toESM(require("@iobroker/adapter-core"));
var import_library = require("./lib/classes/library");
var import_register = require("source-map-support/register");
var MQTT = __toESM(require("./lib/classes/mqtt"));
var import_config = require("./lib/config");
var import_controller = require("./lib/controller/controller");
var import_icon_mapping = require("./lib/const/icon_mapping");
var definition = __toESM(require("./lib/const/definition"));
var import_config_manager = require("./lib/classes/config-manager");
var import_readme = require("./lib/tools/readme");
var import_axios = __toESM(require("axios"));
var import_url = require("url");
var fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
import_axios.default.defaults.timeout = 3e3;
class NspanelLovelaceUi extends utils.Adapter {
  library;
  mqttClient;
  mqttServer;
  controller;
  unload = false;
  testSuccessful = true;
  httpServer = [];
  timeoutAdmin;
  timeoutAdmin2;
  timeoutAdminArray = [];
  intervalAdminArray = [];
  mainConfiguration;
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
    var _a, _b, _c;
    await this.extendForeignObjectAsync(this.namespace, {
      type: "meta",
      common: { name: { en: "Nspanel Instance", de: "Nspanel Instanze" }, type: "meta.folder" },
      native: {}
    });
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
        "./mqtt"
      );
      this.config.mqttIp = "127.0.0.1";
    }
    if (this.config.fixBrokenCommonTypes) {
      const states = await this.getForeignObjectsAsync("alias.0.*");
      this.log.info("Fix broken common.type in alias.0");
      if (states) {
        for (const id in states) {
          if (states[id] && states[id].type === "state" && states[id].common && //@ts-expect-error
          states[id].common.type === "state") {
            this.log.warn(`Fix broken common.type in ${id} set to 'mixed'`);
            states[id].common.type = "mixed";
            await this.extendForeignObjectAsync(id, states[id]);
          }
        }
      }
      const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
      if (o && o.native) {
        o.native.fixBrokenCommonTypes = false;
        await this.extendForeignObjectAsync(`system.adapter.${this.namespace}`, o);
        return;
      }
    }
    await (0, import_readme.generateAliasDocumentation)();
    if (this.config.testCase) {
      this.log.warn("Testcase mode!");
    }
    this.config.Testconfig2 = [];
    const obj = await this.getForeignObjectAsync(this.namespace);
    if (obj && obj.native) {
      const config = [];
      if (obj.native.scriptConfigRaw) {
        const manager = new import_config_manager.ConfigManager(this, true);
        manager.log.warn = function(_msg) {
        };
        for (const a of this.config.panels) {
          if (a && a.topic) {
            const page = obj.native.scriptConfigRaw.find(
              (b) => b.panelTopic === a.topic
            );
            if (page) {
              const c = await manager.setScriptConfig(page);
              if (c && c.messages && c.messages.length > 0) {
                if (!c.messages[0].startsWith("Panel")) {
                  this.log.warn(c.messages[0]);
                }
              }
              if (c && c.panelConfig) {
                this.log.info(`Raw script config found for ${a.topic}`);
                config.push(c.panelConfig);
                continue;
              }
            }
            {
              const c = obj.native.scriptConfig.find(
                (b) => b.topic === a.topic
              );
              if (c) {
                this.log.info(`Converted script config found for ${a.topic}`);
                config.push(c);
                continue;
              }
            }
          }
          this.log.warn(`No script config found for ${a.topic}`);
          await manager.delete();
        }
      }
      const scriptConfig = config;
      if (scriptConfig.length === 0) {
        if (!this.config.testCase) {
          this.log.error("No compatible config found, paused!");
          return;
        }
      }
      if (scriptConfig) {
        for (let b = 0; b < scriptConfig.length; b++) {
          for (let c = b <= 0 ? 1 : b - 1; c < scriptConfig.length; c++) {
            if (c === b || !scriptConfig[c] || !scriptConfig[b].pages || !scriptConfig[c].pages) {
              continue;
            }
            let pages = structuredClone(scriptConfig[c].pages);
            if (pages) {
              pages = pages.filter((a) => {
                var _a2, _b2, _c2;
                if (((_a2 = a.config) == null ? void 0 : _a2.card) === "screensaver" || ((_b2 = a.config) == null ? void 0 : _b2.card) === "screensaver2" || ((_c2 = a.config) == null ? void 0 : _c2.card) === "screensaver3") {
                  return false;
                }
                if (scriptConfig[b].pages.find((b2) => b2.uniqueID === a.uniqueID)) {
                  return false;
                }
                return true;
              });
              scriptConfig[b].pages = scriptConfig[b].pages.concat(pages);
            }
          }
        }
        for (let b = 0; b < scriptConfig.length; b++) {
          const s = scriptConfig[b];
          if (!s || !s.pages) {
            continue;
          }
          this.config.Testconfig2[b] = {};
          if (!this.config.Testconfig2[b].pages) {
            this.config.Testconfig2[b].pages = [];
          }
          if (!this.config.Testconfig2[b].navigation) {
            this.config.Testconfig2[b].navigation = [];
          }
          this.config.Testconfig2[b].pages = this.config.Testconfig2[b].pages.filter(
            (a) => {
              if (s.pages.find((b2) => b2.uniqueID === a.uniqueID)) {
                return false;
              }
              return true;
            }
          );
          this.config.Testconfig2[b].navigation = this.config.Testconfig2[b].navigation.filter((a) => {
            if (s.navigation && s.navigation.find((b2) => a == null || b2 == null || b2.name === a.name)) {
              return false;
            }
            return true;
          });
          s.navigation = (this.config.Testconfig2[b].navigation || []).concat(s.navigation || []);
          s.pages = (this.config.Testconfig2[b].pages || []).concat(s.pages || []);
          this.config.Testconfig2[b] = {
            ...this.config.Testconfig2[b] || {},
            ...s
          };
        }
      }
    }
    if (this.config.doubleClickTime === void 0 || typeof this.config.doubleClickTime !== "number" || !(this.config.doubleClickTime > 0)) {
      this.config.doubleClickTime = 350;
    }
    try {
      import_icon_mapping.Icons.adapter = this;
      await this.library.init();
      const states = await this.getStatesAsync("*");
      await this.library.initStates(states);
      await this.onMqttConnect();
      await this.delay(2e3);
      for (const id in states) {
        if (id.endsWith(".info.isOnline")) {
          await this.library.writedp(id, false, definition.genericStateObjects.panel.panels.info.isOnline);
        }
      }
      this.log.debug("Check configuration!");
      if (!this.config.pw1 || typeof this.config.pw1 !== "string") {
        this.log.warn("No pin entered for the service page! Please set a pin in the admin settings!");
      }
      if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword)) {
        this.log.error("Invalid admin configuration for mqtt!");
        this.testSuccessful = false;
        return;
      }
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
        this.config.Testconfig2 = import_config.testCaseConfig;
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
        await test.subscript("test/123456/cmnd/#", async (topic, message) => {
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
      if (!this.config.Testconfig2 || !Array.isArray(this.config.Testconfig2) || this.config.Testconfig2.length === 0) {
        await this.delay(100);
        await this.mqttClient.destroy();
        await this.delay(100);
        this.log.error("No configuration - adapter on hold!");
        return;
      }
      this.mainConfiguration = structuredClone(this.config.Testconfig2);
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
              if (((_a = p.config) == null ? void 0 : _a.card) === "screensaver" || ((_b = p.config) == null ? void 0 : _b.card) === "screensaver2" || ((_c = p.config) == null ? void 0 : _c.card) === "screensaver3") {
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
      await this.controller.init();
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
          this.log.info(`Force an MQTT reconnect from the Nspanel with the ip ${tasmota.ip} in 10 seconds!`);
          await import_axios.default.get(
            `http://${tasmota.ip}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog Restart 1`
          );
        } else {
          this.log.info(`Update detected on the Nspanel with the ip ${tasmota.ip}!!`);
        }
      } catch (e) {
        this.log.warn(
          `Error: This usually means that the NSpanel with ip ${tasmota.ip} is not online or has not been set up properly in the configuration! ${e}`
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
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances.
   *
   * @param callback Callback so the adapter can finish what it has to do.
   */
  async onUnload(callback) {
    try {
      this.unload = true;
      if (this.timeoutAdmin) {
        this.clearTimeout(this.timeoutAdmin);
      }
      if (this.timeoutAdmin2) {
        this.clearTimeout(this.timeoutAdmin2);
      }
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
      for (const server of this.httpServer) {
        if (!server.unload) {
          await server.delete();
        }
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
  //test
  // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
  // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
  // /**
  //  * Is called if a subscribed object changes
  //  */
  // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
  //     if (obj) {
  //         // The object was changed
  //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
  //     } else {
  //         // The object was deleted
  //         this.log.info(`object ${id} deleted`);
  //     }
  // }
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C, _D;
    if (typeof obj === "object" && obj.message) {
      this.log.debug(JSON.stringify(obj));
      if (obj.command === "tftInstallSendToMQTT") {
        if (obj.message.online === "no") {
          obj.command = "tftInstallSendTo";
        }
      }
      const scriptPath = `script.js.${this.library.cleandp(this.namespace, false, true)}`;
      switch (obj.command) {
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
        case "ScriptConfig": {
          let result = ["something went wrong"];
          if (obj.message) {
            const manager = new import_config_manager.ConfigManager(this);
            let r = { messages: [], panelConfig: void 0 };
            if (obj.message.panelTopic && Array.isArray(obj.message.panelTopic)) {
              const topics = JSON.parse(JSON.stringify(obj.message.panelTopic));
              for (const a of topics) {
                r = await manager.setScriptConfig({ ...obj.message, panelTopic: a });
              }
            } else {
              r = await manager.setScriptConfig(obj.message);
            }
            await manager.delete();
            result = r.messages;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, result, obj.callback);
          }
          break;
        }
        /*case 'RefreshDevices': {
                            if (this.timeoutAdmin) {
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { error: 'sendToAdminRunning' }, obj.callback);
                                    break;
                                }
                            }
                            const device = { id: '', name: obj.message.name, topic: obj.message.topic, ip: '' };
        
                            const mqtt = new MQTT.MQTTClientClass(
                                this,
                                this.config.mqttIp,
                                this.config.mqttPort,
                                this.config.mqttUsername,
                                this.config.mqttPassword,
                                this.config.mqttServer,
                                (topic, message) => {
                                    this.log.debug(`${topic} ${message}`);
                                },
                            );
                            await this.delay(100);
                            const checkTasmota = async (
                                mqtt: MQTT.MQTTClientClass,
                                topic: string,
                            ): Promise<{ status: boolean; id: string; ip: string }> => {
                                return new Promise(resolve => {
                                    this.timeoutAdmin = this.setTimeout(() => {
                                        this.timeoutAdmin = null;
                                        resolve({ status: false, id: '', ip: '' });
                                    }, 5000);
                                    void mqtt
                                        .subscript(`${topic}/stat/STATUS0`, (_topic: string, _message: string) => {
                                            const msg = JSON.parse(_message) as STATUS0;
                                            if (msg.StatusNET) {
                                                resolve({
                                                    status: true,
                                                    ip: msg.StatusNET.IPAddress,
                                                    id: this.library.cleandp(msg.StatusNET.Mac, false, true),
                                                });
                                            }
                                        })
                                        .then(() => {
                                            void mqtt.publish(`${topic}/cmnd/STATUS0`, '');
                                        });
                                });
                            };
        
                            const result = await checkTasmota(mqtt, device.topic);
                            if (this.timeoutAdmin) {
                                this.clearTimeout(this.timeoutAdmin);
                                this.timeoutAdmin = null;
                            }
        
                            await mqtt.destroy();
                            if (result.status) {
                                device.id = result.id;
                                device.ip = result.ip;
                                const index = this.config.panels.findIndex(a => a.topic === device.topic);
                                //if (index !== -1) {
                                this.config.panels[index] = device;
                                if (obj.callback) {
                                    this.sendTo(obj.from, obj.command, { native: device }, obj.callback);
                                    this.sendTo(obj.from, obj.command, { result: 'ok' }, obj.callback);
                                    break;
                                }
                                //}
                            }
                            if (obj.callback) {
                                this.sendTo(obj.from, obj.command, { error: 'sendToRefreshFail' }, obj.callback);
                            }
        
                            break;
                        }*/
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
          if (obj.message) {
            try {
              if (obj.message.tasmotaIP && (obj.message.mqttIp || obj.message.internalServerIp) && obj.message.mqttServer != null && obj.message.mqttPort && obj.message.mqttUsername && obj.message.mqttPassword && obj.message.tasmotaTopic) {
                if (obj.message.mqttServer == "false" || !obj.message.mqttServer) {
                  obj.message.mqttServer = false;
                } else {
                  obj.message.mqttServer = true;
                }
                this.log.info(
                  `Sending mqtt config & base config to tasmota: ${obj.message.tasmotaIP} with user ${obj.message.mqttUsername} && ${obj.message.mqttPassword}`
                );
                let u = new import_url.URL(
                  `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=status 5`
                );
                let r = await import_axios.default.get(u.href);
                if (!r || !r.data || !r.data.StatusNET || !r.data.StatusNET.Mac) {
                  this.log.warn(`Device with topic ${obj.message.tasmotaTopic} not found!`);
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToDeviceNotFound" },
                      obj.callback
                    );
                  }
                  break;
                }
                let mac = r.data.StatusNET.Mac;
                const topic = obj.message.tasmotaTopic;
                const appendix = r.data.StatusNET.Mac.replace(/:/g, "").slice(-6);
                const mqttClientId = `${this.library.cleandp(obj.message.tasmotaName)}-${appendix}`;
                const url = ` MqttHost ${obj.message.mqttServer ? obj.message.internalServerIp : obj.message.mqttIp}; MqttPort ${obj.message.mqttPort}; MqttUser ${obj.message.mqttUsername}; MqttPassword ${obj.message.mqttPassword}; FullTopic ${`${topic}/%prefix%/`.replaceAll("//", "/")}; MqttRetry 10; FriendlyName1 ${obj.message.tasmotaName}; Hostname ${obj.message.tasmotaName.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}; MqttClient ${mqttClientId}; ${obj.message.mqttServer ? "SetOption132 1; SetOption103 1 " : "SetOption132 0; SetOption103 0"}; Restart 1`;
                u = new import_url.URL(
                  `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog${encodeURIComponent(url)}`
                );
                this.log.info(
                  `Sending mqtt config & base config to tasmota with IP ${obj.message.tasmotaIP} and name ${obj.message.tasmotaName}.`
                );
                await import_axios.default.get(u.href);
                this.mqttClient && await this.mqttClient.waitPanelConnectAsync(topic, 6e4);
                u = new import_url.URL(
                  `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog${encodeURIComponent(
                    ` WebLog 2; template {"NAME":"${obj.message.tasmotaName}", "GPIO":[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0],"FLAG":0,"BASE":1}; Module 0;${this.config.timezone ? definition.getTasmotaTimeZone(this.config.timezone) : ""}: restart 1`
                  )}`
                );
                await import_axios.default.get(u.href);
                this.mqttClient && await this.mqttClient.waitPanelConnectAsync(topic, 6e4);
                u = new import_url.URL(
                  `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=status 0`
                );
                r = await import_axios.default.get(u.href);
                if (!r || !r.data || !r.data.StatusNET || !r.data.StatusNET.Mac) {
                  this.log.warn(`Device with topic ${obj.message.tasmotaTopic} not found!`);
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToDeviceNotFound2" },
                      obj.callback
                    );
                  }
                  break;
                }
                const config = this.config;
                const panels = (_a = config.panels) != null ? _a : [];
                const index = panels.findIndex((a) => a.topic === obj.message.tasmotaTopic);
                const item = index === -1 ? { name: "", ip: "", topic: "", id: "", model: "" } : panels[index];
                const ipIndex = panels.findIndex((a) => a.ip === obj.message.tasmotaIP);
                let update = false;
                if (index !== -1 && ipIndex !== index) {
                  this.log.error("Topic and ip are not on the same panel!");
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToIpTopicDifferent" },
                      obj.callback
                    );
                  }
                  break;
                } else {
                  update = index !== -1;
                }
                mac = r.data.StatusNET.Mac;
                item.model = obj.message.model;
                item.name = obj.message.tasmotaName;
                item.topic = topic;
                item.id = this.library.cleandp(mac);
                item.ip = r.data.StatusNET.IPAddress;
                if (index === -1) {
                  panels.push(item);
                }
                try {
                  const url2 = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog UrlFetch https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1`;
                  this.log.info(
                    `Installing berry on tasmota with IP ${obj.message.tasmotaIP} and name ${obj.message.tasmotaName}.`
                  );
                  await import_axios.default.get(url2);
                  this.mqttClient && await this.mqttClient.waitPanelConnectAsync(topic, 2e4);
                  await this.delay(7e3);
                } catch (e) {
                  this.log.error(`Error: while installing berry - ${e}`);
                }
                try {
                  await this.delay(3e3);
                  const result = await import_axios.default.get(
                    "https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json"
                  );
                  if (!result.data) {
                    this.log.error("No version found!");
                    if (obj.callback) {
                      this.sendTo(
                        obj.from,
                        obj.command,
                        { error: "sendToRequestFail" },
                        obj.callback
                      );
                    }
                    break;
                  }
                  const model = obj.message.model ? `-${obj.message.model}` : "";
                  const version = obj.message.useBetaTFT ? result.data[`tft${model}-beta`].split("_")[0] : result.data[`tft${model}`].split("_")[0];
                  const fileName = `nspanel-${model}v${version}.tft`;
                  if (this.mqttClient) {
                    await this.mqttClient.publish(
                      `${topic}/cmnd/Backlog`,
                      `FlashNextion http://nspanel.de/${fileName}`
                    );
                  }
                  this.log.info(
                    `Installing tft on tasmota with IP ${obj.message.tasmotaIP} and name ${obj.message.tasmotaName}.`
                  );
                } catch (e) {
                  this.log.error(`Error: ${e}`);
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToRequestFail" },
                      obj.callback
                    );
                  }
                }
                await this.createConfigurationScript(item.name, item.topic);
                if (obj.callback) {
                  this.sendTo(
                    obj.from,
                    obj.command,
                    {
                      result: update ? "sendToNSPanelUpdateDataSuccess" : "sendToNSPanelInitDataSuccess",
                      native: { panels },
                      saveConfig: true
                    },
                    obj.callback
                  );
                }
              }
            } catch (e) {
              this.log.error(`Error: while sending mqtt config & base config to tasmota - ${e}`);
              if (obj.callback) {
                this.sendTo(obj.from, obj.command, { error: "sendToRequestFail" }, obj.callback);
              }
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "berryInstallSendTo": {
          if (obj.message) {
            if (obj.message.tasmotaIP) {
              try {
                const url = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog UrlFetch https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1`;
                this.log.info(`Installing berry on tasmota with IP ${obj.message.tasmotaIP}`);
                await import_axios.default.get(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: while installing berry - ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail" }, obj.callback);
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
                const result = await import_axios.default.get(
                  "https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json"
                );
                if (!result.data) {
                  this.log.error("No version found!");
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToRequestFail" },
                      obj.callback
                    );
                  }
                  break;
                }
                const model = obj.message.model ? `-${obj.message.model}` : "";
                const version = obj.message.useBetaTFT ? result.data[`tft${model}-beta`].split("_")[0] : result.data[`tft${model}`].split("_")[0];
                const fileName = `nspanel-${model}v${version}.tft`;
                const url = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Backlog FlashNextion http://nspanel.de/${fileName}`;
                this.log.debug(url);
                await import_axios.default.get(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail" }, obj.callback);
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
                const result = await import_axios.default.get(
                  "https://raw.githubusercontent.com/ticaki/ioBroker.nspanel-lovelace-ui/main/json/version.json"
                );
                if (!result.data) {
                  this.log.error("No version found!");
                  if (obj.callback) {
                    this.sendTo(
                      obj.from,
                      obj.command,
                      { error: "sendToRequestFail" },
                      obj.callback
                    );
                  }
                  break;
                }
                const model = obj.message.model ? `-${obj.message.model}` : "";
                const version = obj.message.useBetaTFT ? result.data[`tft${model}-beta`].split("_")[0] : result.data[`tft${model}`].split("_")[0];
                const fileName = `nspanel-v${version}.tft`;
                const cmnd = `FlashNextion http://nspanel.de/${fileName}`;
                this.log.debug(cmnd);
                if ((_b = this.controller) == null ? void 0 : _b.panels) {
                  const index = this.controller.panels.findIndex((a) => a.topic === obj.message.topic);
                  if (index !== -1) {
                    const panel = this.controller.panels[index];
                    panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
                  }
                }
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail" }, obj.callback);
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
        case "selectPanel": {
          if (this.mainConfiguration && ((_c = obj.message) == null ? void 0 : _c.id)) {
            let msg = [];
            switch (obj.message.id) {
              case "panel": {
                msg = this.mainConfiguration.map((a) => {
                  const index = this.config.panels.findIndex((b) => b.topic === a.topic);
                  if (index !== -1) {
                    return { value: a.topic, label: this.config.panels[index].name };
                  }
                  return null;
                });
                msg = msg.filter((a) => a);
                msg.sort((a, b) => a.label.localeCompare(b.label));
                break;
              }
              case "uniqueID": {
                if (obj.message.panel) {
                  const index = this.mainConfiguration.findIndex(
                    (a) => a.topic === obj.message.panel
                  );
                  if (index !== -1) {
                    msg = this.mainConfiguration[index].pages.map((a) => {
                      return { label: a.uniqueID, value: a.uniqueID };
                    });
                    msg.sort((a, b) => a.label.localeCompare(b.label));
                    break;
                  }
                }
                msg = [];
                break;
              }
              case "navigationNames": {
                if (obj.message.table && Array.isArray(obj.message.table)) {
                  msg = obj.message.table.map((a) => {
                    return a.name;
                  });
                  msg = msg.filter((a) => a && a !== obj.message.name);
                  msg.sort((a, b) => a.localeCompare(b));
                  break;
                }
                msg = [];
                break;
              }
            }
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, msg, obj.callback);
              break;
            }
          }
          this.sendTo(obj.from, obj.command, null, obj.callback);
          break;
        }
        case "_loadNavigationOverview": {
          if (this.mainConfiguration && ((_d = obj.message) == null ? void 0 : _d.panel)) {
            let msg = [];
            let useNavigation = false;
            let configFrom = "";
            const index = this.mainConfiguration.findIndex((a) => a.topic === obj.message.panel);
            if (index !== -1) {
              let nav = [];
              const o = await this.getForeignObjectAsync(this.namespace);
              if (((_e = o == null ? void 0 : o.native) == null ? void 0 : _e.navigation) && o.native.navigation[obj.message.panel]) {
                nav = o.native.navigation[obj.message.panel].data;
                useNavigation = o.native.navigation[obj.message.panel].useNavigation;
                configFrom = "Adminconfiguration";
              } else {
                nav = this.mainConfiguration[index].navigation;
                configFrom = "Scriptconfiguration";
              }
              msg = nav.map((a) => {
                var _a2, _b2, _c2, _d2;
                return a ? {
                  name: a.name,
                  page: a.page,
                  left1: (_a2 = a.left) == null ? void 0 : _a2.single,
                  left2: (_b2 = a.left) == null ? void 0 : _b2.double,
                  right1: (_c2 = a.right) == null ? void 0 : _c2.single,
                  right2: (_d2 = a.right) == null ? void 0 : _d2.double
                } : null;
              });
              msg = msg.filter((a) => a);
            }
            if (obj.callback) {
              this.sendTo(
                obj.from,
                obj.command,
                {
                  native: {
                    _NavigationOverviewTable: msg,
                    _useNavigation: useNavigation,
                    _configFrom: configFrom
                  }
                },
                obj.callback
              );
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "_saveNavigationOverview": {
          if (((_f = obj.message) == null ? void 0 : _f.table) && ((_g = obj.message) == null ? void 0 : _g.panel) && this.mainConfiguration) {
            const o = await this.getForeignObjectAsync(this.namespace);
            if (o && o.native) {
              const index = this.mainConfiguration.findIndex((a) => a.topic === obj.message.panel);
              if (index !== -1) {
                let result = obj.message.table.map(
                  (a) => {
                    return a && a.name && a.page && (a.left1 || a.left2 || a.right1 || a.right2) ? {
                      name: a.name,
                      page: a.page,
                      left: a.left1 || a.left2 ? { single: a.left1, double: a.left2 } : null,
                      right: a.right1 || a.right2 ? { single: a.right1, double: a.right2 } : null
                    } : null;
                  }
                );
                result = result.filter((a) => a);
                o.native.navigation = (_h = o.native.navigation) != null ? _h : {};
                o.native.navigation[obj.message.panel] = {
                  useNavigation: obj.message.useNavigation === "true",
                  data: result
                };
                await this.setForeignObjectAsync(this.namespace, o);
              }
              if (obj.callback) {
                this.sendTo(obj.from, obj.command, null, obj.callback);
              }
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "_clearNavigationOverview": {
          if (((_i = obj.message) == null ? void 0 : _i.table) && ((_j = obj.message) == null ? void 0 : _j.panel) && this.mainConfiguration) {
            const o = await this.getForeignObjectAsync(this.namespace);
            if (o && o.native && o.native.navigation && o.native.navigation[obj.message.panel]) {
              o.native.navigation[obj.message.panel] = void 0;
              await this.setForeignObjectAsync(this.namespace, o);
            }
            if (obj.callback) {
              this.sendTo(
                obj.from,
                obj.command,
                {
                  native: {
                    _NavigationOverviewTable: [],
                    _useNavigation: false,
                    _configFrom: "None!"
                  }
                },
                obj.callback
              );
            }
            break;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
          break;
        }
        case "tasmotaRestartSendTo": {
          if (obj.message) {
            if (obj.message.tasmotaIP) {
              try {
                const url = `http://${obj.message.tasmotaIP}/cm?${this.config.useTasmotaAdmin ? `user=admin&password=${this.config.tasmotaAdminPassword}` : ``}&cmnd=Restart 1`;
                this.log.debug(url);
                await import_axios.default.get(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail" }, obj.callback);
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
                await import_axios.default.get(url);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
                }
              } catch (e) {
                this.log.error(`Error: ${e}`);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { error: "sendToRequestFail" }, obj.callback);
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
          if (fs.existsSync(import_path.default.join(__dirname, "../script"))) {
            file = fs.readFileSync(
              import_path.default.join(__dirname, "../script/example_sendTo_script_iobroker.ts"),
              "utf8"
            );
          }
          const vTemp = (file == null ? void 0 : file.match(/const.version.+'(\d\.\d\.\d)';/)) || [];
          const version = vTemp[1] ? vTemp[1] : "";
          for (let a = 0; a < this.config.panels.length; a++) {
            const panel = this.config.panels[a];
            const state = this.library.readdb(`panels.${panel.id}.info.nspanel.firmwareUpdate`);
            if (state && typeof state.val === "number" && state.val < 100) {
              flashingObj[panel.id] = `${flashingText}: ${state.val}%`;
            }
          }
          if ((_k = this.controller) == null ? void 0 : _k.panels) {
            const updateText = this.library.getTranslation("updateAvailable");
            const checkText = this.library.getTranslation("check!");
            const temp = [];
            for (const a of this.controller.panels) {
              let check = false;
              let tv = "";
              let nv = "";
              let sv = "";
              const ft = flashingObj[a.name];
              const scriptId = this.library.cleandp(
                `${scriptPath}.${this.library.cleandp(a.friendlyName, false, true)}`
              );
              const o = await this.getForeignObjectAsync(scriptId);
              if (o) {
                const temp2 = (_m = (_l = o.common.source.match(/const.version.+'(\d\.\d\.\d)';/)) == null ? void 0 : _l[1]) != null ? _m : "";
                if (temp2 !== version) {
                  check = true;
                  sv = `${temp2} (${updateText}: v${version})`;
                } else {
                  sv = temp2;
                }
              }
              if (a.info) {
                if ((_n = a.info.tasmota) == null ? void 0 : _n.firmwareversion) {
                  const temp2 = a.info.tasmota.firmwareversion.match(/([0-9]+\.[0-9]+\.[0-9])/);
                  if (temp2 && temp2[1]) {
                    tv = `${temp2[1]}`;
                  }
                }
                if (((_o = a.info.tasmota) == null ? void 0 : _o.onlineVersion) && tv) {
                  const temp2 = a.info.tasmota.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9])/);
                  if (temp2 && temp2[1] && temp2[1] !== tv) {
                    tv += ` (${updateText})`;
                    check = true;
                  }
                }
                tv = tv ? `v${tv}` : "";
                if ((_p = a.info.nspanel) == null ? void 0 : _p.displayVersion) {
                  const temp2 = a.info.nspanel.displayVersion.match(/([0-9]+\.[0-9]+\.[0-9])/);
                  if (temp2 && temp2[1]) {
                    nv = `${temp2[1]}`;
                  }
                }
                if (((_q = a.info.nspanel) == null ? void 0 : _q.onlineVersion) && nv) {
                  const temp2 = a.info.nspanel.onlineVersion.match(/([0-9]+\.[0-9]+\.[0-9])/);
                  if (temp2 && temp2[1] && temp2[1] !== nv) {
                    nv += ` (${updateText})`;
                    check = true;
                  }
                }
                nv = nv ? `v${nv}` : "";
              }
              added.push(a.topic);
              temp.push({
                _check: check,
                _Headline: `${a.friendlyName} (${ft ? ft : `${check ? checkText : `${a.isOnline ? "online" : "offline"}`}`})`,
                _name: a.friendlyName,
                _ip: ((_t = (_s = (_r = a.info) == null ? void 0 : _r.tasmota) == null ? void 0 : _s.net) == null ? void 0 : _t.IPAddress) ? a.info.tasmota.net.IPAddress : "offline - waiting",
                _online: a.isOnline ? "yes" : "no",
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
                const temp3 = (_A = (_z = o.common.source.match(/const.version.+'(\d\.\d\.\d)';/)) == null ? void 0 : _z[1]) != null ? _A : "";
                if (temp3 !== version) {
                  sv = temp3 ? temp3 : version;
                }
              }
              temp.push({
                _check: true,
                _Headline: `${a.name} (${ft ? ft : `${this.config.Testconfig2 ? this.config.Testconfig2.findIndex((b) => b.topic === a.topic) === -1 ? "Missing configuration!" : "offline - waiting" : "offline"}`})`,
                _name: a.name,
                _ip: this.config.Testconfig2 ? this.config.Testconfig2.findIndex((b) => b.topic === a.topic) === -1 ? "Missing configuration!" : "offline - waiting" : "offline",
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
            if (fs.existsSync(import_path.default.join(__dirname, "../script"))) {
              const fileContent = fs.readFileSync(import_path.default.join(__dirname, "../script/icons.json"), "utf-8");
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
          const cmnd = `OtaUrl http://ota.tasmota.com/tasmota32/release/tasmota32-${language.toUpperCase()}.bin; Upgrade 1`;
          if ((_B = this.controller) == null ? void 0 : _B.panels) {
            const index = this.controller.panels.findIndex((a) => a.topic === obj.message.topic);
            if (index !== -1) {
              const panel = this.controller.panels[index];
              panel.sendToTasmota(`${panel.topic}/cmnd/Backlog`, cmnd);
            }
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
        case "getTimeZones": {
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, definition.tasmotaTimeZonesAdmin, obj.callback);
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
            const panel = this.controller.panels.find((a) => a.topic === obj.message.panel);
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
  async createConfigurationScript(panelName, panelTopic) {
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
    if (fs.existsSync(import_path.default.join(__dirname, "../script")) && panelName && panelTopic) {
      let file = fs.readFileSync(import_path.default.join(__dirname, "../script/example_sendTo_script_iobroker.ts"), "utf8");
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
            enabled: false
          },
          native: {}
        };
        await this.extendForeignObjectAsync(scriptId, script);
        return [];
      }
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new NspanelLovelaceUi(options);
} else {
  (() => new NspanelLovelaceUi())();
}
//# sourceMappingURL=main.js.map
