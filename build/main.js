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
var import_config_manager = require("./lib/controller/config-manager");
class NspanelLovelaceUi extends utils.Adapter {
  library;
  mqttClient;
  mqttServer;
  controller;
  unload = false;
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
   * Is called when databases are connected and adapter received configuration...
   */
  async onReady() {
    await this.extendForeignObjectAsync(this.namespace, {
      type: "meta",
      common: { name: { en: "Nspanel Instance", de: "Nspanel Instanze" }, type: "meta.folder" },
      native: {}
    });
    this.library = new import_library.Library(this);
    await this.delay(2e3);
    if (!this.config.Testconfig2) {
      if (this.config.onlyStartFromSystemConfig) {
        this.log.warn("No configuration stopped!");
        return;
      }
      this.log.warn("No configuration use dev test config!");
      let testconfig = import_config.Testconfig;
      try {
        const path = "./lib/config-custom.js";
        testconfig = (await Promise.resolve().then(() => __toESM(require(path)))).Testconfig;
      } catch {
      }
      this.config.Testconfig2 = testconfig;
    }
    if (!this.config.Testconfig2 || !Array.isArray(this.config.Testconfig2) || !this.config.Testconfig2[0] || !this.config.Testconfig2[0].pages) {
      this.log.warn("Adapter on hold, user restart needed!");
      return;
    }
    try {
      const obj = await this.getForeignObjectAsync(this.namespace);
      if (obj && obj.native && obj.native.scriptConfig) {
        const scriptConfig = obj.native.scriptConfig;
        let changed = false;
        for (let b = scriptConfig.length - 1; b >= 0; b--) {
          const index = this.config.panels.findIndex((a) => a.name === scriptConfig[b].name);
          if (index !== -1) {
            if (this.config.panels[index].removeIt) {
              scriptConfig.splice(b, 1);
              changed = true;
            }
            continue;
          }
          if (scriptConfig[b].name !== void 0 && scriptConfig[b].topic !== void 0) {
            this.config.panels.push({
              name: scriptConfig[b].name,
              topic: scriptConfig[b].topic,
              id: "",
              removeIt: false
            });
          }
        }
        for (const a of this.config.panels) {
          if (a.removeIt) {
            await this.delObjectAsync(`panels.${a.id}`, { recursive: true });
          }
        }
        if (changed) {
          await this.setForeignObjectAsync(this.namespace, obj);
        }
        for (let b = 0; b < scriptConfig.length; b++) {
          const s = scriptConfig[b];
          if (!s || !s.pages) {
            continue;
          }
          if (!this.config.Testconfig2[b]) {
            this.config.Testconfig2[b] = {};
          }
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
        this.config.Testconfig2[0].pages[0] = this.config.Testconfig2[0].pages[0];
        this.config.Testconfig2[0].timeout = this.config.timeout;
      }
    } catch (e) {
      this.log.warn(`Invalid configuration stopped! ${e}`);
      return;
    }
    if (this.config.doubleClickTime === void 0 || typeof this.config.doubleClickTime !== "number" || !(this.config.doubleClickTime > 0)) {
      this.config.doubleClickTime = 400;
    }
    this.setTimeout(async () => {
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
      if (this.config.mqttIp === "" && this.config.mqttPort && this.config.mqttUsername) {
        this.config.mqttPassword = this.config.mqttPassword || "1234";
        this.mqttServer = new MQTT.MQTTServerClass(
          this,
          this.config.mqttPort,
          this.config.mqttUsername,
          this.config.mqttPassword,
          "./mqtt"
        );
        this.config.mqttIp = "127.0.0.1";
        let c = 0;
        while (!this.mqttServer.ready) {
          this.log.debug("Wait for mqttServer");
          await this.delay(1e3);
          if (c++ > 6) {
            throw new Error("mqttServer not ready!");
          }
        }
      }
      if (!(this.config.mqttIp && this.config.mqttPort && this.config.mqttUsername && this.config.mqttPassword)) {
        this.log.error("Invalid admin configuration for mqtt!");
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
        test.subscript("nspanel/ns_panel4/cmnd/#", async (topic, message) => {
          this.log.debug(`Testcase ${topic}`);
          if (message === "pageType~pageStartup") {
            await test.publish("nspanel/ns_panel4/stat/RESULT", '{"CustomSend": "Done"}');
            await test.publish("nspanel/ns_panel4/tele/RESULT", '{"CustomRecv":"event,startup,54,eu"}');
          } else if (topic === "nspanel/ns_panel4/cmnd/STATUS0") {
            await test.publish(
              "nspanel/ns_panel4/stat/STATUS0",
              '{"Status":{"Module":0,"DeviceName":"NSPanel 4 Test","FriendlyName":["Tasmota",""],"Topic":"ns_panel4","ButtonTopic":"0","Power":"00","PowerLock":"00","PowerOnState":3,"LedState":1,"LedMask":"FFFF","SaveData":1,"SaveState":1,"SwitchTopic":"0","SwitchMode":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"ButtonRetain":0,"SwitchRetain":0,"SensorRetain":0,"PowerRetain":0,"InfoRetain":0,"StateRetain":0,"StatusRetain":0},"StatusPRM":{"Baudrate":115200,"SerialConfig":"8N1","GroupTopic":"tasmotas","OtaUrl":"http://ota.tasmota.com/tasmota32/release/tasmota32-nspanel.bin","RestartReason":"Vbat power on reset","Uptime":"0T00:07:28","StartupUTC":"2025-02-19T09:23:29","Sleep":50,"CfgHolder":4617,"BootCount":59,"BCResetTime":"2024-01-06T17:11:30","SaveCount":110},"StatusFWR":{"Version":"14.4.1(release-nspanel)","BuildDateTime":"2024-12-15T13:33:11","Core":"3_1_0","SDK":"5.3.2","CpuFrequency":160,"Hardware":"ESP32-D0WD-V3 v3.1","CR":"502/699"},"StatusLOG":{"SerialLog":2,"WebLog":1,"MqttLog":3,"SysLog":0,"LogHost":"","LogPort":514,"SSId":["xxx",""],"TelePeriod":300,"Resolution":"558180C0","SetOption":["00008009","2805C80001000600003C5A0A192800000000","00000080","00006000","00004000","00000000"]},"StatusMEM":{"ProgramSize":2017,"Free":862,"Heap":148,"StackLowMark":3,"PsrMax":2048,"PsrFree":2025,"ProgramFlashSize":4096,"FlashSize":4096,"FlashChipId":"16405E","FlashFrequency":40,"FlashMode":"DIO","Features":["0809","9F9AD7DF","0015A001","B7F7BFCF","05DA9BC4","E0360DC7","480840D2","20200000","D4BC482D","810A80F1","00000014"],"Drivers":"1,2,!3,!4,!5,7,!8,9,10,11,12,!14,!16,!17,!20,!21,24,26,!27,29,!34,!35,38,50,52,!59,!60,62,!63,!66,!67,!68,!73,!75,82,!86,!87,!88,!121","Sensors":"1,2,3,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,26,31,34,37,39,40,42,43,45,51,52,55,56,58,59,64,66,67,74,85,92,95,98,103,105,109,127","I2CDriver":"7,8,9,10,11,12,13,14,15,17,18,20,24,29,31,36,41,42,44,46,48,58,62,65,69,76,77,82,89"},"StatusNET":{"Hostname":"ns-panel4-0112","IPAddress":"192.168.178.174","Gateway":"192.168.178.1","Subnetmask":"255.255.254.0","DNSServer1":"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"A0:B7:65:54:C0:70","IP6Global":"","IP6Local":"xxx","Ethernet":{"Hostname":"","IPAddress":"0.0.0.0","Gateway":"0.0.0.0","Subnetmask":"0.0.0.0","DNSServer1":"192.168.179.21","DNSServer2":"0.0.0.0","Mac":"00:00:00:00:00:00","IP6Global":"","IP6Local":""},"Webserver":2,"HTTP_API":1,"WifiConfig":4,"WifiPower":16.0},"StatusMQT":{"MqttHost":"xxx","MqttPort":1883,"MqttClientMask":"ns_panel4","MqttClient":"ns_panel4","MqttUser":"xxx","MqttCount":1,"MAX_PACKET_SIZE":1200,"KEEPALIVE":30,"SOCKET_TIMEOUT":4},"StatusTIM":{"UTC":"2025-02-19T09:30:57Z","Local":"2025-02-19T10:30:57","StartDST":"2025-03-30T02:00:00","EndDST":"2025-10-26T03:00:00","Timezone":"+01:00","Sunrise":"07:50","Sunset":"18:17"},"StatusSNS":{"Time":"2025-02-19T10:30:57","ANALOG":{"Temperature1":-3.2},"TempUnit":"C"},"StatusSTS":{"Time":"2025-02-19T10:30:57","Uptime":"0T00:07:28","UptimeSec":448,"Heap":146,"SleepMode":"Dynamic","Sleep":50,"LoadAvg":19,"MqttCount":1,"Berry":{"HeapUsed":16,"Objects":212},"POWER1":"OFF","POWER2":"OFF","Wifi":{"AP":1,"SSId":"Keller","BSSId":"DC:15:C8:EB:3E:B8","Channel":7,"Mode":"HT40","RSSI":46,"Signal":-77,"LinkCount":1,"Downtime":"0T00:00:03"}}}'
            );
          }
        });
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
      setInterval(() => {
        this.log.debug(
          `${Math.trunc(mem)}k/${String(Math.trunc(process.memoryUsage().heapUsed / 1024))}k Start/Jetzt: `
        );
      }, 6e4);
    }, 2500);
  }
  /**
   * Is called when adapter shuts down - callback has to be called under any circumstances.
   *
   * @param callback Callback so the adapter can finish what it has to do
   */
  async onUnload(callback) {
    try {
      this.unload = true;
      if (this.controller) {
        this.controller.delete;
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
      this.log.info(`state ${id} deleted`);
    }
  }
  // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
  // /**
  //  * Somee message was sent to this instance over message box. Used by email, pushover, text2speech, ........
  //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
  //  */
  async onMessage(obj) {
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
            result = await manager.setScriptConfig(obj.message);
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, result, obj.callback);
          }
          break;
        }
        case "RefreshDevices": {
          const view = await this.getObjectViewAsync("system", "device", {
            startkey: `${this.namespace}.panels.`,
            endkey: `${this.namespace}.panels.\u9999`
          });
          let devices = {};
          if (view && view.rows) {
            devices = { panels: [] };
            for (const panel of view.rows) {
              const result = { id: "", name: "", topic: "", removeIt: false };
              const p = await this.getForeignObjectAsync(panel.id);
              if (p && p.native && p.native.name) {
                result.id = p.native.name;
                result.name = p.native.configName;
                result.topic = p.native.topic;
                devices.panels.push(result);
              }
            }
          }
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, { native: devices }, obj.callback);
          }
          this.log.debug(JSON.stringify(view));
          break;
        }
        default: {
          if (obj.callback) {
            this.sendTo(obj.from, obj.command, [], obj.callback);
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
