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
var import_definition = require("./lib/const/definition");
var import_config_manager = require("./lib/classes/config-manager");
var import_readme = require("./lib/tools/readme");
var import_axios = __toESM(require("axios"));
var import_url = require("url");
import_axios.default.defaults.timeout = 5e3;
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
    await this.extendForeignObjectAsync(this.namespace, {
      type: "meta",
      common: { name: { en: "Nspanel Instance", de: "Nspanel Instanze" }, type: "meta.folder" },
      native: {}
    });
    this.library = new import_library.Library(this);
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
      this.mqttServer = new MQTT.MQTTServerClass(
        this,
        this.config.mqttPort,
        this.config.mqttUsername,
        this.config.mqttPassword,
        "./mqtt"
      );
      this.config.mqttIp = "127.0.0.1";
      await this.delay(100);
      let c = 0;
      while (!this.mqttServer.ready) {
        this.log.debug("Wait for mqttServer");
        await this.delay(1e3);
        if (c++ > 6) {
          throw new Error("mqttServer not ready!");
        }
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
    await this.delay(4e3);
    try {
      import_icon_mapping.Icons.adapter = this;
      await this.library.init();
      const states = await this.getStatesAsync("*");
      await this.library.initStates(states);
      for (const id in states) {
        if (id.endsWith(".info.isOnline")) {
          await this.library.writedp(id, false, import_definition.genericStateObjects.panel.panels.info.isOnline);
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
        (topic, message) => {
          this.log.debug(`${topic} ${message}`);
        }
      );
      if (!this.mqttClient) {
        return;
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
        this.config.Testconfig2 = import_config.testCaseConfig;
        const test = new MQTT.MQTTClientClass(
          this,
          this.config.mqttIp,
          this.config.mqttPort,
          this.config.mqttUsername,
          this.config.mqttPassword,
          (topic, message) => {
            this.log.debug(`${topic} ${message}`);
          }
        );
        let c = 0;
        while (!test.ready) {
          this.log.debug("Wait for Test mqttClient");
          await this.delay(1e3);
          if (c++ > 6) {
            throw new Error("Test mqttClient not ready!");
          }
        }
        test.subscript("test/123456/cmnd/#", async (topic, message) => {
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
        this.mqttClient.destroy();
        await this.delay(100);
        this.log.error("No configuration - adapter on hold!");
        return;
      }
      const testconfig = structuredClone(this.config.Testconfig2);
      let counter = 0;
      for (const a of testconfig) {
        if (a && a.pages) {
          const names = [];
          for (const p of a.pages) {
            counter++;
            if (!("uniqueID" in p)) {
              continue;
            }
            if (p.card === "screensaver" || p.card === "screensaver2" || p.card === "screensaver3") {
              p.uniqueID = `#${p.uniqueID}`;
            }
            if (names.indexOf(p.uniqueID) !== -1) {
              throw new Error(`uniqueID ${p.uniqueID} is double!`);
            }
            names.push(p.uniqueID);
          }
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
        panels: testconfig
      });
      await this.controller.init();
    } catch (e) {
      this.testSuccessful = false;
      this.log.error(`Error onReady: ${e}`);
    }
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances.
   *
   * @param callback Callback so the adapter can finish what it has to do
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
      if (this.controller) {
        await this.controller.delete();
      }
      for (const server of this.httpServer) {
        if (!server.unload) {
          await server.delete();
        }
      }
      if (this.mqttClient) {
        this.mqttClient.destroy();
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
  //  * Somee message was sent to this instance over message box. Used by email, pushover, text2speech, .
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  async onMessage(obj) {
    var _a;
    if (typeof obj === "object" && obj.message) {
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
            await manager.delete();
            const r = await manager.setScriptConfig(obj.message);
            result = r.messages;
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, result, obj.callback);
          }
          break;
        }
        case "RefreshDevices": {
          if (this.timeoutAdmin) {
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, { error: "sendToAdminRunning" }, obj.callback);
              break;
            }
          }
          const device = { id: "", name: obj.message.name, topic: obj.message.topic, ip: "" };
          const mqtt = new MQTT.MQTTClientClass(
            this,
            this.config.mqttIp,
            this.config.mqttPort,
            this.config.mqttUsername,
            this.config.mqttPassword,
            (topic, message) => {
              this.log.debug(`${topic} ${message}`);
            }
          );
          await this.delay(100);
          const checkTasmota = async (mqtt2, topic) => {
            return new Promise((resolve) => {
              this.timeoutAdmin = this.setTimeout(() => {
                this.timeoutAdmin = null;
                resolve({ status: false, id: "", ip: "" });
              }, 5e3);
              mqtt2.subscript(`${topic}/stat/STATUS0`, (_topic, _message) => {
                const msg = JSON.parse(_message);
                if (msg.StatusNET) {
                  resolve({
                    status: true,
                    ip: msg.StatusNET.IPAddress,
                    id: this.library.cleandp(msg.StatusNET.Mac, false, true)
                  });
                }
              });
              void mqtt2.publish(`${topic}/cmnd/STATUS0`, "");
            });
          };
          const result = await checkTasmota(mqtt, device.topic);
          if (this.timeoutAdmin) {
            this.clearTimeout(this.timeoutAdmin);
            this.timeoutAdmin = null;
          }
          mqtt.destroy();
          if (result.status) {
            device.id = result.id;
            device.ip = result.ip;
            const index = this.config.panels.findIndex((a) => a.topic === device.topic);
            this.config.panels[index] = device;
            if (obj.callback) {
              this.sendTo(obj.from, obj.command, { native: device }, obj.callback);
              this.sendTo(obj.from, obj.command, { result: "ok" }, obj.callback);
              break;
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToRefreshFail" }, obj.callback);
          }
          break;
        }
        case "testCase": {
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { testSuccessful: this.testSuccessful }, obj.callback);
          }
          break;
        }
        case "tasmotaSendTo": {
          if (obj.message) {
            try {
              if (obj.message.tasmotaIP && (obj.message.mqttIp || obj.message.internalServerIp) && obj.message.mqttServer != null && obj.message.mqttPort && obj.message.mqttUsername && obj.message.mqttPassword && obj.message.tasmotaTopic) {
                if (obj.message.mqttServer == "false" || !obj.message.mqttServer) {
                  obj.message.mqttServer = false;
                }
                const url = ` MqttHost ${obj.message.mqttServer ? obj.message.internalServerIp : obj.message.mqttIp}; MqttPort ${obj.message.mqttPort}; MqttUser ${obj.message.mqttUsername}; MqttPassword ${obj.message.mqttPassword}; FullTopic ${`${obj.message.tasmotaTopic}/%prefix%/`.replaceAll("//", "/")}; MqttRetry 10; FriendlyName1 ${obj.message.tasmotaName}; Hostname ${obj.message.tasmotaName.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}; WebLog 2; template {"NAME":"${obj.message.tasmotaName}", "GPIO":[0,0,0,0,3872,0,0,0,0,0,32,0,0,0,0,225,0,480,224,1,0,0,0,33,0,0,0,0,0,0,0,0,0,0,4736,0],"FLAG":0,"BASE":1}; Module 0; MqttClient ${obj.message.tasmotaName.replaceAll(/[^a-zA-Z0-9_-]/g, "_")}%06X; Restart 1`;
                const u = new import_url.URL(
                  `http://${obj.message.tasmotaIP}/cm?&cmnd=Backlog${url.replaceAll("&", "%26").replaceAll("%", "%25")}`
                );
                this.log.info(`Sending mqtt config & base config to tasmota: ${obj.message.tasmotaIP}`);
                await import_axios.default.get(u.href);
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, [], obj.callback);
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
        case "tasmotaAddTableSendTo": {
          if (obj.message) {
            if (this.timeoutAdmin2) {
              if (obj.callback) {
                this.sendTo(obj.from, obj.command, { error: "sendToAdmin2Running" }, obj.callback);
                break;
              }
            }
            try {
              if (obj.message.tasmotaIP && obj.message.tasmotaTopic && obj.message.tasmotaName) {
                const config = this.config;
                const panels = (_a = config.panels) != null ? _a : [];
                const index = panels.findIndex((a) => a.topic === obj.message.tasmotaTopic);
                const item = index === -1 ? { name: "", ip: "", topic: "", id: "" } : panels[index];
                const nameIndex = panels.findIndex((a) => a.name === obj.message.tasmotaName);
                if (nameIndex !== -1 && index !== -1 && nameIndex !== index) {
                  this.log.error("Name already exists!");
                  if (obj.callback) {
                    this.sendTo(obj.from, obj.command, { error: "sendToNameExist" }, obj.callback);
                  }
                  break;
                }
                item.name = obj.message.tasmotaName;
                item.ip = obj.message.tasmotaIP;
                item.topic = obj.message.tasmotaTopic;
                const mqtt = new MQTT.MQTTClientClass(
                  this,
                  this.config.mqttIp,
                  this.config.mqttPort,
                  this.config.mqttUsername,
                  this.config.mqttPassword,
                  (topic, message) => {
                    this.log.debug(`${topic} ${message}`);
                  }
                );
                await this.delay(100);
                const checkTasmota = async (mqtt2, topic) => {
                  return new Promise((resolve) => {
                    const result2 = {
                      status: false,
                      id: "",
                      ip: ""
                    };
                    this.timeoutAdmin2 = this.setTimeout(() => {
                      this.timeoutAdmin2 = null;
                      resolve(result2);
                    }, 5e3);
                    if (mqtt2 && topic) {
                      mqtt2.subscript(
                        `${topic}/stat/STATUS0`,
                        (_topic, _message) => {
                          const msg = JSON.parse(_message);
                          if (msg.StatusNET) {
                            result2.id = this.library.cleandp(
                              msg.StatusNET.Mac,
                              false,
                              true
                            );
                            result2.ip = msg.StatusNET.IPAddress;
                            this.log.info(
                              `Device found: id: ${result2.id} ip: ${result2.ip} topic: ${topic} Hostname: ${msg.StatusNET.Hostname}`
                            );
                            result2.status = true;
                          }
                          resolve(result2);
                          return;
                        }
                      );
                      void mqtt2.publish(`${topic}/cmnd/STATUS0`, "");
                    } else {
                      resolve(result2);
                      return;
                    }
                  });
                };
                if (this.timeoutAdmin2) {
                  this.clearTimeout(this.timeoutAdmin2);
                  this.timeoutAdmin2 = null;
                }
                const result = await checkTasmota(mqtt, item.topic);
                mqtt.destroy();
                if (!result.status) {
                  this.log.error(`Device with topic ${item.topic} not found!`);
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
                item.id = result.id;
                item.ip = result.ip;
                if (index === -1) {
                  panels.push(item);
                }
                const o = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
                if (o && o.native) {
                  o.native.panels = panels;
                  await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, o);
                }
                if (obj.callback) {
                  this.sendTo(obj.from, obj.command, { result: "sendToDeviceFound" }, obj.callback);
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
                const url = `http://${obj.message.tasmotaIP}/cm?&cmnd=Backlog UrlFetch https://raw.githubusercontent.com/joBr99/nspanel-lovelace-ui/main/tasmota/autoexec.be; Restart 1`;
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
                  "https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/raw/refs/heads/main/json/version.json"
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
                const version = result.data.tft.split("_")[0];
                const fileName = `nspanel-v${version}.tft`;
                const url = `http://${obj.message.tasmotaIP}/cm?&cmnd=Backlog FlashNextion http://nspanel.de/${fileName}`;
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
        default: {
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { error: "sendToAnyError" }, obj.callback);
          }
        }
      }
    }
  }
  async writeStateExternalAsync(dp, val) {
    if (dp.startsWith(this.namespace)) {
      return;
    }
    await this.setForeignStateAsync(dp, val, false);
  }
}
if (require.main !== module) {
  module.exports = (options) => new NspanelLovelaceUi(options);
} else {
  (() => new NspanelLovelaceUi())();
}
//# sourceMappingURL=main.js.map
