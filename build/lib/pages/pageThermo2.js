"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pageThermo2_exports = {};
__export(pageThermo2_exports, {
  PageThermo2: () => PageThermo2
});
module.exports = __toCommonJS(pageThermo2_exports);
var import_tools = require("../const/tools");
var import_pageMenu = require("./pageMenu");
var import_Color = require("../const/Color");
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
  step = 1;
  heatCycles = 1;
  maxItems = 17;
  headlinePos = 0;
  titelPos = 0;
  convertValue = 1;
  nextArrow = false;
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
      this.pageItemConfig.unshift({
        role: "",
        type: "button",
        dpInit: "",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: `numeric-${i}-circle-outline` },
              color: {
                type: "const",
                constVal: import_Color.Color.Green
              }
            },
            false: {
              value: { type: "const", constVal: `numeric-${i}-circle-outline` },
              color: {
                type: "const",
                constVal: import_Color.Color.Gray
              }
            }
          },
          entity1: {
            value: { type: "internal", dp: `///${this.panel.name}/${this.name}/${i - 1}` },
            set: { type: "internal", dp: `///${this.panel.name}/${this.name}/${i - 1}` }
          }
        }
      });
    }
    this.items = tempItem;
    await super.init();
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u;
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
        message.dstTemp = ((await (0, import_tools.getValueEntryNumber)(data.entity3) || 0) * 10).toString();
        message.minTemp = (await ((_b = data.minValue) == null ? void 0 : _b.getNumber()) || 150).toString();
        message.maxTemp = (await ((_c = data.maxValue) == null ? void 0 : _c.getNumber()) || 280).toString();
        message.tempStep = (await ((_d = data.stepValue) == null ? void 0 : _d.getNumber()) || 5).toString();
        message.unit = await ((_f = (_e = data.entity3) == null ? void 0 : _e.unit) == null ? void 0 : _f.getString()) || "\xB0C";
        message.power = await ((_g = data.power) == null ? void 0 : _g.getBoolean()) || false;
        for (let i = 0; i < 7; i++) {
          message.options[i] = `text~${this.name}.${i}~${[
            await (0, import_tools.getIconEntryValue)(data == null ? void 0 : data.icon1, true, "thermometer"),
            ((await ((_i = (_h = data == null ? void 0 : data.entity1) == null ? void 0 : _h.value) == null ? void 0 : _i.getNumber()) || 0) * 10).toString(),
            await ((_k = (_j = data == null ? void 0 : data.entity1) == null ? void 0 : _j.unit) == null ? void 0 : _k.getString()) || "\xB0C",
            await (0, import_tools.getIconEntryValue)(data == null ? void 0 : data.icon1, true, "water-percent"),
            ((await ((_m = (_l = data == null ? void 0 : data.entity2) == null ? void 0 : _l.value) == null ? void 0 : _m.getNumber()) || 0) * 10).toString(),
            await ((_o = (_n = data == null ? void 0 : data.entity2) == null ? void 0 : _n.unit) == null ? void 0 : _o.getString()) || "%",
            ""
          ][i]}~${[
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon1, !!await ((_p = data == null ? void 0 : data.power) == null ? void 0 : _p.getBoolean()), import_Color.Color.Green),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon1, !!await ((_q = data == null ? void 0 : data.power) == null ? void 0 : _q.getBoolean()), import_Color.Color.Green),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon1, !!await ((_r = data == null ? void 0 : data.power) == null ? void 0 : _r.getBoolean()), import_Color.Color.Green),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon2, !!await ((_s = data == null ? void 0 : data.power) == null ? void 0 : _s.getBoolean()), import_Color.Color.Magenta),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon2, !!await ((_t = data == null ? void 0 : data.power) == null ? void 0 : _t.getBoolean()), import_Color.Color.Magenta),
            await (0, import_tools.getIconEntryColor)(data == null ? void 0 : data.icon2, !!await ((_u = data == null ? void 0 : data.power) == null ? void 0 : _u.getBoolean()), import_Color.Color.Magenta),
            ""
          ][i]}~~`;
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
      if (this.nextArrow && event.opt.split("?")[1] === "0") {
        this.step++;
        await this.update();
      } else if (await this.pageItems[Number(event.opt.split("?")[1])].onCommand("button", "")) {
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
      !message.power ? "1" : "0",
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
  async reset() {
    this.step = 1;
  }
  onInternalCommand = async (id, state) => {
    var _a;
    if (state == null ? void 0 : state.val) {
      this.index = parseInt((_a = id.split("/").pop()) != null ? _a : "0");
      this.adapter.setTimeout(() => this.update, 1);
    }
    if (id == `///${this.panel.name}/${this.name}/${this.index}`) {
      return true;
    }
    return false;
  };
  static async getPage(configManager, page, gridItem, messages) {
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
    gridItem.config.data = [];
    for (let i = 0; i < page.thermoItems.length; i++) {
      const item = page.thermoItems[i];
      if (!item || !item.id || item.id.endsWith(".")) {
        const msg = `${page.uniqueName} id: ${item.id} is invalid!`;
        messages.push(msg);
        adapter.log.error(msg);
        return { gridItem, messages };
      }
      if (!item || !item.id2 || item.id2.endsWith(".")) {
        const msg = `${page.uniqueName} id2: ${item.id2} is invalid!`;
        messages.push(msg);
        adapter.log.error(msg);
        return { gridItem, messages };
      }
      if (!item || !item.set || item.set.endsWith(".")) {
        const msg = `${page.uniqueName} set: ${item.set} is invalid!`;
        messages.push(msg);
        adapter.log.error(msg);
        return { gridItem, messages };
      }
      const o = await adapter.getForeignObjectAsync(item.id);
      if (!o || !o.common) {
        const msg = `${page.uniqueName} id: ${page.items[0].id} has a invalid object!`;
        messages.push(msg);
        adapter.log.error(msg);
        return { gridItem, messages };
      }
      const data = {
        entity3: await configManager.existsAndWriteableState(item.set) ? {
          value: { type: "triggered", dp: item.set },
          set: { type: "state", dp: item.set }
        } : void 0,
        entity1: await configManager.existsState(item.id) ? {
          value: { type: "state", dp: item.id || "" }
        } : void 0,
        icon1: {
          true: {
            value: { type: "const", constVal: item.icon || "thermometer" },
            color: { type: "const", constVal: item.onColor || import_Color.Color.Green }
          }
        },
        icon2: {
          true: {
            value: { type: "const", constVal: item.icon2 || "water-percent" },
            color: { type: "const", constVal: import_Color.Color.Magenta }
          }
        },
        entity2: {
          value: { type: "state", dp: item.id2 || "" }
        },
        headline: { type: "const", constVal: item.name || "" },
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
        } : void 0
      };
      if (Array.isArray(gridItem.config.data)) {
        gridItem.config.data.push(data);
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
