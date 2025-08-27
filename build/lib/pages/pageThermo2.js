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
var pageThermo2_exports = {};
__export(pageThermo2_exports, {
  PageThermo2: () => PageThermo2
});
module.exports = __toCommonJS(pageThermo2_exports);
var import_tools = require("../const/tools");
var import_pageMenu = require("./pageMenu");
var import_Color = require("../const/Color");
var configManagerConst = __toESM(require("../const/config-manager-const"));
const PageThermo2MessageDefault = {
  event: "entityUpd",
  headline: "Page Thermo",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  internalName: "PageThermo2",
  dstTemp: "",
  minTemp: "10",
  maxTemp: "40",
  tempStep: "5",
  unit: "",
  power: false,
  options: [
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~",
    "~~~~~"
  ]
};
class PageThermo2 extends import_pageMenu.PageMenu {
  //config: pages.cardThermoDataItemOptions;
  items;
  heatCycles = 1;
  maxItems = 8;
  headlinePos = 0;
  titelPos = 0;
  convertValue = 1;
  index = 0;
  constructor(config, options) {
    if (config.card !== "cardThermo2") {
      return;
    }
    super(config, options);
    this.config = options.config;
    this.iconLeftP = "arrow-left-bold-outline";
    this.iconLeft = "arrow-up-bold";
    this.iconRightP = "arrow-right-bold-outline";
    this.iconRight = "arrow-down-bold";
    if (options.config && options.config.card == "cardThermo2") {
      this.config = options.config;
      this.config.scrollType = "page";
    } else {
      throw new Error("Missing config!");
    }
    if (options.items && options.items.card == "cardThermo2") {
      this.items = options.items;
    }
    this.filterDuplicateMessages = false;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem) {
      tempItem.card = "cardThermo2";
    }
    this.heatCycles = Array.isArray(tempItem.data) ? tempItem.data.length : 1;
    if (this.heatCycles > 8 && Array.isArray(tempItem.data)) {
      this.log.warn(
        `PageThermo2: Heat cycles are ${this.heatCycles}, but only 8 are supported! Using only 8 cycles.`
      );
      tempItem.data = tempItem.data.slice(0, 8);
      this.heatCycles = 8;
    }
    this.pageItemConfig = this.pageItemConfig || [];
    if (this.heatCycles > 1 && (tempItem == null ? void 0 : tempItem.card) === "cardThermo2") {
      if (((_a = this.config) == null ? void 0 : _a.card) === "cardThermo2" && ((_b = this.config) == null ? void 0 : _b.filterType)) {
        this.config.filterType = this.index;
      }
      for (let i = this.heatCycles; i > 0; --i) {
        await this.panel.statesControler.setInternalState(
          `///${this.panel.name}/${this.name}/${i - 1}`,
          i === this.index - 1 ? true : false,
          true,
          {
            type: "boolean",
            role: "button",
            name: `Thermo2 ${this.name} ${i}`,
            read: true,
            write: true
          },
          this.onInternalCommand
        );
        const item2 = Array.isArray(tempConfig == null ? void 0 : tempConfig.data) && (tempConfig == null ? void 0 : tempConfig.data[i - 1]);
        this.pageItemConfig.unshift({
          role: "heatcycle",
          type: "button",
          dpInit: "",
          data: {
            icon: {
              true: {
                value: item2 && ((_d = (_c = item2.icon4) == null ? void 0 : _c.true) == null ? void 0 : _d.value) ? item2.icon4.true.value : { type: "const", constVal: `numeric-${i}-circle-outline` },
                color: item2 && ((_f = (_e = item2.icon4) == null ? void 0 : _e.true) == null ? void 0 : _f.color) ? item2.icon4.true.color : {
                  type: "const",
                  constVal: import_Color.Color.Green
                }
              },
              false: {
                value: item2 && ((_h = (_g = item2.icon4) == null ? void 0 : _g.false) == null ? void 0 : _h.value) ? item2.icon4.false.value : { type: "const", constVal: `numeric-${i}-circle-outline` },
                color: item2 && ((_j = (_i = item2.icon4) == null ? void 0 : _i.false) == null ? void 0 : _j.color) ? item2.icon4.false.color : {
                  type: "const",
                  constVal: import_Color.Color.Gray
                }
              }
            },
            entity1: {
              value: {
                type: "internal",
                dp: `///${this.panel.name}/${this.name}/${i - 1}`,
                change: "ts"
              }
            },
            setValue2: { type: "internal", dp: `///${this.panel.name}/${this.name}/${i - 1}` }
          }
        });
      }
    }
    this.items = tempItem;
    await super.init();
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
    if (!(this == null ? void 0 : this.visibility)) {
      return;
    }
    const message = {};
    message.options = [];
    message.navigation = this.getNavigation();
    if (this.items) {
      const data = Array.isArray(this.items.data) ? this.items.data[this.index] ? this.items.data[this.index] : null : this.items.data;
      if (data) {
        message.headline = this.library.getTranslation(
          (_a = data && data.headline && await data.headline.getString()) != null ? _a : ""
        );
        message.dstTemp = Math.round((await (0, import_tools.getValueEntryNumber)(data.entity3) || 0) * 10).toString();
        message.minTemp = Math.round((await ((_b = data.minValue) == null ? void 0 : _b.getNumber()) || 15) * 10).toString();
        message.maxTemp = Math.round((await ((_c = data.maxValue) == null ? void 0 : _c.getNumber()) || 28) * 10).toString();
        message.tempStep = Math.round((await ((_d = data.stepValue) == null ? void 0 : _d.getNumber()) || 0.5) * 10).toString();
        message.unit = await ((_f = (_e = data.entity3) == null ? void 0 : _e.unit) == null ? void 0 : _f.getString()) || "\xB0C";
        message.power = await ((_g = data.power) == null ? void 0 : _g.getBoolean()) || false;
        const statesText = this.library.getTranslation(await ((_h = data.mode) == null ? void 0 : _h.getString()) || "");
        for (let i = 0; i < 7; i++) {
          message.options[i] = `text~${this.name}.${i}~${[
            await (0, import_tools.getIconEntryValue)(data == null ? void 0 : data.icon1, true, "thermometer"),
            ((await ((_j = (_i = data == null ? void 0 : data.entity1) == null ? void 0 : _i.value) == null ? void 0 : _j.getNumber()) || 0) * 10).toString(),
            await ((_l = (_k = data == null ? void 0 : data.entity1) == null ? void 0 : _k.unit) == null ? void 0 : _l.getString()) || "\xB0C",
            await (0, import_tools.getIconEntryValue)(data == null ? void 0 : data.icon2, true, "water-percent"),
            ((await ((_n = (_m = data == null ? void 0 : data.entity2) == null ? void 0 : _m.value) == null ? void 0 : _n.getNumber()) || 0) * 10).toString(),
            await ((_p = (_o = data == null ? void 0 : data.entity2) == null ? void 0 : _o.unit) == null ? void 0 : _p.getString()) || "%",
            statesText
          ][i]}~${[
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon1, !!await ((_q = data == null ? void 0 : data.power) == null ? void 0 : _q.getBoolean()), import_Color.Color.Green),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon1, !!await ((_r = data == null ? void 0 : data.power) == null ? void 0 : _r.getBoolean()), import_Color.Color.Green),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon1, !!await ((_s = data == null ? void 0 : data.power) == null ? void 0 : _s.getBoolean()), import_Color.Color.Green),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon2, !!await ((_t = data == null ? void 0 : data.power) == null ? void 0 : _t.getBoolean()), import_Color.Color.Magenta),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon2, !!await ((_u = data == null ? void 0 : data.power) == null ? void 0 : _u.getBoolean()), import_Color.Color.Magenta),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon2, !!await ((_v = data == null ? void 0 : data.power) == null ? void 0 : _v.getBoolean()), import_Color.Color.Magenta),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon5, true, import_Color.Color.MSYellow)
          ][i]}~~${["", "", "", "", "", "", (_x = await ((_w = data == null ? void 0 : data.power) == null ? void 0 : _w.getNumber())) != null ? _x : 1][i]}`;
        }
      }
      const arr = (await this.getOptions([])).slice(0, this.maxItems);
      message.options = message.options.concat(arr);
      const msg = Object.assign(PageThermo2MessageDefault, message);
      const msg2 = this.getMessage(msg);
      this.sendToPanel(msg2, false);
    }
  }
  async onButtonEvent(event) {
    var _a;
    if (event.action === "tempUpd") {
      if (!this.items) {
        return;
      }
      const data = Array.isArray(this.items.data) ? this.items.data[this.index] ? this.items.data[this.index] : null : this.items.data;
      if (data) {
        const newValLow = parseInt(event.opt) / 10;
        const valLow = (_a = await (0, import_tools.getValueEntryNumber)(data.entity3)) != null ? _a : null;
        if (valLow !== null && newValLow !== valLow) {
          await (0, import_tools.setValueEntry)(data.entity3, newValLow);
        }
      }
    } else if (event.action === "hvac_action" && this.pageItems && this.pageItems[Number(event.opt.split("?")[1])]) {
      if (await this.pageItems[Number(event.opt.split("?")[1])].onCommand("button", "")) {
        return;
      }
    }
  }
  getMessage(message) {
    return (0, import_tools.getPayload)(
      "entityUpd",
      message.headline,
      message.navigation,
      String(this.name),
      String(message.dstTemp),
      String(message.minTemp),
      String(message.maxTemp),
      message.tempStep,
      message.unit,
      !message.power ? "1" : "1",
      (0, import_tools.getPayloadArray)(message.options)
    );
  }
  async onVisibilityChange(val) {
    var _a, _b;
    await super.onVisibilityChange(val);
    if (val) {
      for (const item of (_a = this.pageItems) != null ? _a : []) {
        if (item && item.dataItems && item.dataItems.type === "input_sel") {
          if (this.controller) {
            await this.controller.statesControler.activateTrigger(item);
          }
        }
      }
    } else {
      for (const item of (_b = this.pageItems) != null ? _b : []) {
        if (item && item.dataItems && item.dataItems.type === "input_sel") {
          if (this.controller) {
            await this.controller.statesControler.deactivateTrigger(item);
          }
        }
      }
    }
  }
  async onStateTrigger() {
    await this.update();
  }
  onInternalCommand = async (id, state) => {
    var _a, _b, _c;
    if (state == null ? void 0 : state.val) {
      this.index = parseInt((_a = id.split("/").pop()) != null ? _a : "0");
      if (((_b = this.config) == null ? void 0 : _b.card) === "cardThermo2" && ((_c = this.config) == null ? void 0 : _c.filterType) != null) {
        this.config.filterType = this.index;
      }
    }
    if (id == `///${this.panel.name}/${this.name}/${this.index}`) {
      return true;
    }
    return false;
  };
  static async getPage(configManager, page, gridItem, messages) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (page.type !== "cardThermo2" || !gridItem.config || gridItem.config.card !== "cardThermo2") {
      return { gridItem, messages };
    }
    const adapter = configManager.adapter;
    if (!page.thermoItems || !page.thermoItems[0]) {
      const msg = `${page.uniqueName}: Thermo page has no thermo item or item 0 has no id!`;
      messages.push(msg);
      adapter.log.warn(msg);
      return { gridItem, messages };
    }
    gridItem.config.card = "cardThermo2";
    gridItem.config.filterType = 0;
    gridItem.config.data = [];
    let o = void 0;
    let airCondition = false;
    const thermoItems = JSON.parse(JSON.stringify(page.thermoItems));
    let filterIndex = -1;
    for (let i = 0; i < thermoItems.length; i++) {
      let actual = "";
      let humidity = "";
      let set = "";
      let power;
      let role = "thermostat";
      let mode;
      let foundedStates;
      const item = thermoItems[i];
      foundedStates = void 0;
      if (!item) {
        const msg = `${page.uniqueName} item ${i} is invalid!`;
        messages.push(msg);
        adapter.log.error(msg);
        continue;
      }
      let headline = item.name || "";
      if ("id" in item) {
        if (!item || !item.id || item.id.endsWith(".")) {
          const msg = `${page.uniqueName} id2: ${item.id} is invalid!`;
          messages.push(msg);
          adapter.log.error(msg);
          continue;
        }
        o = await adapter.getForeignObjectAsync(item.id);
        if (!o || !o.common || !o.common.role || o.common.role !== "thermostat" && o.common.role !== "airCondition") {
          const msg = `${page.uniqueName} id: ${item.id} ${!o || !o.common ? "has a invalid object" : o.common.role !== "thermostat" && o.common.role !== "airCondition" ? `has wrong role: ${o.common.role} check alias.md` : " something went wrong"} !`;
          messages.push(msg);
          adapter.log.error(msg);
          thermoItems.splice(i--, 1);
          continue;
        }
        role = o.common.role;
        try {
          foundedStates = await configManager.searchDatapointsForItems(
            configManagerConst.requiredScriptDataPoints,
            role,
            item.id,
            messages
          );
        } catch {
          continue;
        }
        if (!foundedStates) {
          const msg = `${page.uniqueName} id: ${item.id} has no states!`;
          messages.push(msg);
          adapter.log.error(msg);
          continue;
        }
        headline = airCondition ? item.name2 || "COOLING" : item.name || (typeof o.common.name === "object" ? o.common[configManager.adapter.language || "en"] : o.common.name) || "HEATING";
        actual = ((_a = foundedStates[role].ACTUAL) == null ? void 0 : _a.dp) || "";
        humidity = ((_b = foundedStates[role].HUMIDITY) == null ? void 0 : _b.dp) || "";
        set = airCondition ? ((_c = foundedStates[role].SET2) == null ? void 0 : _c.dp) || "" : ((_d = foundedStates[role].SET) == null ? void 0 : _d.dp) || "";
        role = o.common.role;
        power = foundedStates[role].MODESET;
        if (foundedStates[role].MODE || foundedStates[role].MODESET) {
          mode = foundedStates[role].MODE || foundedStates[role].MODESET;
          if (mode && mode.dp) {
            const o2 = await adapter.getForeignObjectAsync(mode.dp);
            if ((_e = o2 == null ? void 0 : o2.common) == null ? void 0 : _e.states) {
              mode = {
                ...mode,
                read: `return ${JSON.stringify(o2.common.states)}[val] || val`
              };
            } else {
              mode = {
                ...mode,
                read: `return ${JSON.stringify(
                  item.modeList ? item.modeList : ["OFF", "AUTO", "COOL", "HEAT", "ECO", "FAN", "DRY"]
                )}[val] || val`
              };
            }
          }
        }
        if (o.common.role === "airCondition") {
          if (!airCondition) {
            airCondition = true;
            thermoItems.splice(i, 0, item);
          } else if (airCondition) {
            airCondition = false;
          }
        }
      } else {
        if (!item || !item.thermoId1 || item.thermoId1.endsWith(".")) {
          const msg = `${page.uniqueName} thermoId1: ${item.thermoId1} is invalid!`;
          messages.push(msg);
          adapter.log.error(msg);
          continue;
        }
        actual = item.thermoId1;
        o = await adapter.getForeignObjectAsync(item.thermoId1);
        if (!o || !o.common) {
          const msg = `${page.uniqueName} id: ${item.thermoId1} has a invalid object!`;
          messages.push(msg);
          adapter.log.error(msg);
          continue;
        }
        if (!item || item.thermoId2 && (item.thermoId2.endsWith(".") || !await configManager.existsState(item.thermoId2))) {
          const msg = `${page.uniqueName} thermoId2: ${item.thermoId2} is invalid!`;
          messages.push(msg);
          adapter.log.error(msg);
          continue;
        }
        humidity = item.thermoId2 || "";
        if (!item || item.modeId && (item.modeId.endsWith(".") || !await configManager.existsState(item.modeId))) {
          const msg = `${page.uniqueName} thermoId2: ${item.thermoId2} is invalid!`;
          messages.push(msg);
          adapter.log.error(msg);
          continue;
        }
        if (item.modeId) {
          let states = [
            "OFF",
            "AUTO",
            "COOL",
            "HEAT",
            "ECO",
            "FAN",
            "DRY"
          ];
          if (!item.modeList || !Array.isArray(item.modeList) || item.modeList.length < 1) {
            const o2 = await adapter.getForeignObjectAsync(item.modeId);
            if ((_f = o2 == null ? void 0 : o2.common) == null ? void 0 : _f.states) {
              states = o2.common.states;
            }
          } else {
            states = item.modeList;
          }
          mode = { type: "triggered", dp: item.modeId, read: `return ${JSON.stringify(states)}[val]` };
          power = { type: "triggered", dp: item.modeId, read: `return val !== 0 ? 1 : 0;` };
        }
        set = item.set;
      }
      for (const im of [item.minValue, item.maxValue, item.stepValue]) {
        if (im != null && (typeof im !== "number" || im < 0)) {
          const msg = `${page.uniqueName} item: ${i} val: ${im} invalid - Error in minValue, maxValue or stepValue!`;
          messages.push(msg);
          adapter.log.warn(msg);
          continue;
        }
      }
      if (adapter.config.defaultValueCardThermo) {
        if (item.minValue != null) {
          item.minValue /= 10;
        }
        if (item.maxValue != null) {
          item.maxValue /= 10;
        }
        if (item.stepValue != null) {
          item.stepValue /= 10;
        }
      }
      const data = {
        entity3: await configManager.existsAndWriteableState(set) ? {
          value: { type: "triggered", dp: set },
          set: { type: "state", dp: set }
        } : void 0,
        entity1: await configManager.existsState(actual) ? {
          value: { type: "triggered", dp: actual || "" },
          unit: { type: "const", constVal: item.unit || "\xB0C" }
        } : void 0,
        icon1: {
          true: {
            value: { type: "const", constVal: item.icon || "thermometer" },
            color: await configManager.getIconColor(item.onColor, import_Color.Color.Green)
          }
        },
        icon2: {
          true: {
            value: { type: "const", constVal: item.icon2 || "water-percent" },
            color: await configManager.getIconColor(item.onColor2, import_Color.Color.Magenta)
          }
        },
        icon4: role !== "airCondition" || airCondition ? {
          true: {
            value: item.iconHeatCycle ? { type: "const", constVal: item.iconHeatCycle } : void 0,
            color: item.iconHeatCycleOnColor ? await configManager.getIconColor(item.iconHeatCycleOnColor, import_Color.Color.Green) : void 0
          },
          false: {
            value: item.iconHeatCycle ? { type: "const", constVal: item.iconHeatCycle } : void 0,
            color: item.iconHeatCycleOffColor ? await configManager.getIconColor(item.iconHeatCycleOffColor, import_Color.Color.Gray) : void 0
          }
        } : {
          true: {
            value: item.iconHeatCycle2 ? { type: "const", constVal: item.iconHeatCycle2 } : void 0,
            color: await configManager.getIconColor(item.iconHeatCycleOnColor2, import_Color.Color.Blue)
          },
          false: {
            value: item.iconHeatCycle2 ? { type: "const", constVal: item.iconHeatCycle2 } : void 0,
            color: await configManager.getIconColor(item.iconHeatCycleOffColor2, {
              r: 80,
              g: 80,
              b: 140
            })
          }
        },
        entity2: await configManager.existsState(humidity) ? {
          value: { type: "triggered", dp: humidity || "" },
          unit: { type: "const", constVal: item.unit || "%" }
        } : void 0,
        headline: { type: "const", constVal: headline || "HEATING" },
        minValue: item.minValue != null ? {
          type: "const",
          constVal: item.minValue
        } : void 0,
        maxValue: item.maxValue != null ? {
          type: "const",
          constVal: item.maxValue
        } : void 0,
        stepValue: item.stepValue != null ? {
          type: "const",
          constVal: item.stepValue
        } : void 0,
        power: await configManager.existsState(item.power) ? {
          type: "triggered",
          dp: item.power
        } : power,
        mode
      };
      if (Array.isArray(gridItem.config.data)) {
        gridItem.config.data.push(data);
      }
      if (!foundedStates) {
        continue;
      }
      if (role !== "thermostat" && role !== "airCondition") {
        const msg = `${page.uniqueName} id: ${o._id} role '${role}' not supported for cardThermo2!`;
        messages.push(msg);
        adapter.log.error(msg);
        continue;
      }
      filterIndex++;
      gridItem.pageItems = gridItem.pageItems || [];
      if (role === "thermostat" || role === "airCondition") {
        if (foundedStates[role].MODESET) {
          const dataItem = foundedStates[role].MODESET;
          if (dataItem && dataItem.dp) {
            const dp = dataItem.dp;
            const o2 = await adapter.getForeignObjectAsync(dp);
            if (o2 == null ? void 0 : o2.common) {
              let native = (_g = o2.common.native) == null ? void 0 : _g.nspanelIcons;
              if (native != null && !Array.isArray(native)) {
                native = void 0;
              }
              gridItem.pageItems.push({
                role: "",
                type: "input_sel",
                filter: filterIndex,
                dpInit: "",
                data: {
                  icon: {
                    true: {
                      value: {
                        ...dataItem,
                        read: `
                                                    ${native && native.length > 0 && native.every((e) => "icon" in e) ? `return ${JSON.stringify(native)}.icon[val] || val` : ""}
                                                    switch(val) {
                                                    case 0: return 'power-off';
                                                    case 1: return 'heat-wave';
                                                    case 2: return 'snowflake';
                                                    case 3: return 'refresh-auto';
                                                    }
                                                `
                      },
                      color: {
                        ...dataItem,
                        read: `
                                                    ${native && native.length > 0 && native.every((e) => "color" in e) ? `return ${JSON.stringify(native)}.color[val] || Color.Gray` : ""}
                                                    switch(val) {
                                                    case 0: return Color.Gray;
                                                    case 1: return Color.Red;
                                                    case 2: return Color.Blue;
                                                    case 3: return Color.MSYellow;
                                                    }
                                                `
                      }
                    },
                    false: {
                      value: {
                        ...dataItem,
                        read: `
                                                    ${native && native.length > 0 ? `return ${JSON.stringify(native)}[val] || val` : ""}
                                                    switch(val) {
                                                    case 0: return 'power-off';
                                                    case 1: return 'heat-wave';
                                                    case 2: return 'snowflake';
                                                    case 3: return 'refresh-auto';
                                                    }
                                                `
                      },
                      color: { type: "const", constVal: import_Color.Color.Gray }
                    }
                  },
                  entityInSel: {
                    value: foundedStates[role].MODESET,
                    set: foundedStates[role].MODESET
                  },
                  headline: { type: "const", constVal: o2.common.name || "Mode" }
                }
              });
            }
          }
        } else {
          if (foundedStates[role].AUTOMATIC && !foundedStates[role].MANUAL) {
            foundedStates[role].MANUAL = JSON.parse(JSON.stringify(foundedStates[role].AUTOMATIC));
            if (foundedStates[role].MANUAL.type === "triggered") {
              foundedStates[role].MANUAL.read = "return !val";
              foundedStates[role].MANUAL.write = "return !val";
            }
          } else if (!foundedStates[role].AUTOMATIC && foundedStates[role].MANUAL) {
            foundedStates[role].AUTOMATIC = JSON.parse(JSON.stringify(foundedStates[role].MANUAL));
            if (foundedStates[role].AUTOMATIC.type === "triggered") {
              foundedStates[role].AUTOMATIC.read = "return !val";
              foundedStates[role].AUTOMATIC.write = "return !val";
            }
          }
          if (foundedStates[role].AUTOMATIC) {
            gridItem.pageItems.push({
              role: "button",
              type: "button",
              filter: filterIndex,
              dpInit: "",
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: "alpha-a-circle" },
                    color: { type: "const", constVal: import_Color.Color.activated }
                  },
                  false: {
                    value: { type: "const", constVal: "alpha-a-circle-outline" },
                    color: { type: "const", constVal: import_Color.Color.deactivated }
                  }
                },
                entity1: {
                  value: foundedStates[role].AUTOMATIC,
                  set: foundedStates[role].AUTOMATIC
                }
              }
            });
          }
          if (foundedStates[role].MANUAL) {
            gridItem.pageItems.push({
              role: "button",
              type: "button",
              filter: filterIndex,
              dpInit: "",
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: "alpha-m-circle" },
                    color: { type: "const", constVal: import_Color.Color.activated }
                  },
                  false: {
                    value: { type: "const", constVal: "alpha-m-circle-outline" },
                    color: { type: "const", constVal: import_Color.Color.deactivated }
                  }
                },
                entity1: {
                  value: foundedStates[role].MANUAL,
                  set: foundedStates[role].MANUAL
                }
              }
            });
          }
          if (foundedStates[role].OFF) {
            gridItem.pageItems.push({
              role: "button",
              type: "button",
              filter: filterIndex,
              dpInit: "",
              data: {
                icon: {
                  true: {
                    value: { type: "const", constVal: "power-off" },
                    color: { type: "const", constVal: import_Color.Color.activated }
                  },
                  false: {
                    value: { type: "const", constVal: "power-off" },
                    color: { type: "const", constVal: import_Color.Color.deactivated }
                  }
                },
                entity1: {
                  value: foundedStates[role].OFF,
                  set: foundedStates[role].OFF
                }
              }
            });
          }
        }
      }
      if (foundedStates[role].POWER) {
        gridItem.pageItems.push({
          role: "button",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "power-standby" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "power-standby" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].POWER,
              set: foundedStates[role].POWER
            }
          }
        });
      }
      if (foundedStates[role].BOOST) {
        gridItem.pageItems.push({
          role: "button",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "fast-forward-60" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "fast-forward-60" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].BOOST,
              set: foundedStates[role].BOOST
            }
          }
        });
      }
      if (foundedStates[role].WINDOWOPEN) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "window-open-variant" },
                color: { type: "const", constVal: import_Color.Color.open }
              },
              false: {
                value: { type: "const", constVal: "window-closed-variant" },
                color: { type: "const", constVal: import_Color.Color.close }
              }
            },
            entity1: {
              value: foundedStates[role].WINDOWOPEN
            }
          }
        });
      }
      if (foundedStates[role].PARTY) {
        gridItem.pageItems.push({
          role: "button",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "party-popper" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "party-popper" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].PARTY,
              set: foundedStates[role].PARTY
            }
          }
        });
      }
      if (foundedStates[role].MAINTAIN) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "account-wrench" },
                color: { type: "const", constVal: import_Color.Color.bad }
              },
              false: {
                value: { type: "const", constVal: "account-wrench" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].MAINTAIN
            }
          }
        });
      }
      if (foundedStates[role].UNREACH) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "wifi-off" },
                color: { type: "const", constVal: import_Color.Color.bad }
              },
              false: {
                value: { type: "const", constVal: "wifi" },
                color: { type: "const", constVal: import_Color.Color.good }
              }
            },
            entity1: {
              value: foundedStates[role].UNREACH
            }
          }
        });
      }
      if (foundedStates[role].MAINTAIN) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "account-wrench" },
                color: { type: "const", constVal: import_Color.Color.true }
              },
              false: {
                value: { type: "const", constVal: "account-wrench" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].MAINTAIN
            }
          }
        });
      }
      if (foundedStates[role].LOWBAT) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "battery-low" },
                color: { type: "const", constVal: import_Color.Color.bad }
              },
              false: {
                value: { type: "const", constVal: "battery-high" },
                color: { type: "const", constVal: import_Color.Color.good }
              }
            },
            entity1: {
              value: foundedStates[role].LOWBAT
            }
          }
        });
      }
      if (foundedStates[role].ERROR) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "alert-circle" },
                color: { type: "const", constVal: import_Color.Color.bad }
              },
              false: {
                value: { type: "const", constVal: "alert-circle" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].ERROR
            }
          }
        });
      }
      if (foundedStates[role].VACATION) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "palm-tree" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "palm-tree" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].VACATION
            }
          }
        });
      }
      if (foundedStates[role].WORKING) {
        gridItem.pageItems.push({
          role: "indicator",
          type: "button",
          filter: filterIndex,
          dpInit: "",
          data: {
            icon: {
              true: {
                value: { type: "const", constVal: "briefcase-check" },
                color: { type: "const", constVal: import_Color.Color.activated }
              },
              false: {
                value: { type: "const", constVal: "briefcase-check" },
                color: { type: "const", constVal: import_Color.Color.deactivated }
              }
            },
            entity1: {
              value: foundedStates[role].WORKING
            }
          }
        });
      }
    }
    return { gridItem, messages };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageThermo2
});
//# sourceMappingURL=pageThermo2.js.map
