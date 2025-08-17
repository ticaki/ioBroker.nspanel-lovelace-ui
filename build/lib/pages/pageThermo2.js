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
var import_Page = require("../classes/Page");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
var import_pageItem = require("./pageItem");
const PageThermo2MessageDefault = {
  event: "entityUpd",
  headline: "Page Thermo",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
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
class PageThermo2 extends import_Page.Page {
  //config: pages.cardThermoDataItemOptions;
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  convertValue = 1;
  nextArrow = false;
  index = 0;
  constructor(config, options) {
    if (config.card !== "cardThermo") {
      return;
    }
    if (options && options.pageItems) {
      options.pageItems.unshift({
        type: "button",
        dpInit: "",
        role: "button",
        modeScr: void 0,
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "arrow-right-bold-circle-outline" },
              color: { type: "const", constVal: { red: 205, green: 142, blue: 153 } }
            }
          },
          entity1: { value: { type: "const", constVal: true } }
        }
      });
    }
    super(config, options);
    if (options.config && options.config.card == "cardThermo") {
      this.config = options.config;
    } else {
      throw new Error("Missing config!");
    }
    if (options.items && options.items.card == "cardThermo") {
      this.items = options.items;
    }
    this.filterDuplicateMessages = false;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    var _a;
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem) {
      tempItem.card = "cardThermo";
    }
    this.items = tempItem;
    await super.init();
    const v = Array.isArray(this.items.data) ? this.items.data[0] ? this.items.data[0].maxTemp && await this.items.data[0].maxTemp.getNumber() : null : (_a = this.items.data.maxTemp && await this.items.data.maxTemp.getNumber()) != null ? _a : null;
    if (v != null) {
      if (v < 100) {
        this.convertValue = 10;
      }
    }
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    if (!this.visibility) {
      return;
    }
    const message = {};
    message.options = [
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
    ];
    if (this.items) {
      const data = Array.isArray(this.items.data) ? this.items.data[this.index] ? this.items.data[this.index] : null : this.items.data;
      if (this.pageItems && data) {
        const pageItems = this.pageItems;
        if (pageItems[1] && ((_a = pageItems[1].dataItems) == null ? void 0 : _a.data)) {
          const t = pageItems[1].dataItems;
          if (import_pageItem.PageItem.isPageItemTextDataItems(t)) {
            t.data = t.data || {};
            t.data.entity1 = data.entity1;
          }
        }
        if (pageItems[3] && ((_b = pageItems[3].dataItems) == null ? void 0 : _b.data)) {
          const t = pageItems[3].dataItems;
          if (import_pageItem.PageItem.isPageItemTextDataItems(t)) {
            t.data = t.data || {};
            t.data.entity1 = data.humidity;
          }
        }
        const a = pageItems[0] && await ((_f = (_e = (_d = (_c = pageItems[0].dataItems) == null ? void 0 : _c.data.icon) == null ? void 0 : _d.true) == null ? void 0 : _e.value) == null ? void 0 : _f.getString());
        this.log.debug(`Icon: ${a}`);
        let b = 0;
        for (let a2 = 1; a2 < 9; a2++, b++) {
          const temp = pageItems[a2];
          if (temp) {
            message.options[b] = await temp.getPageItemPayload();
          }
        }
        const localStep = pageItems.length > 17 ? 7 : 8;
        if (pageItems.length - 9 - 1 <= localStep * (this.step - 1)) {
          this.step = 1;
        }
        const maxSteps = localStep * this.step + 9;
        const minStep = localStep * (this.step - 1) + 9;
        b = 8;
        for (let a2 = minStep; a2 < maxSteps; a2++, b++) {
          const temp = pageItems[a2];
          if (temp) {
            message.options[b] = await temp.getPageItemPayload();
          }
        }
        if (localStep === 7) {
          this.nextArrow = true;
          const temp = this.pageItems[8];
          if (temp) {
            const a2 = await ((_j = (_i = (_h = (_g = temp.dataItems) == null ? void 0 : _g.data.icon) == null ? void 0 : _h.true) == null ? void 0 : _i.value) == null ? void 0 : _j.getString());
            this.log.debug(`Next Arrow Icon: ${a2} used`);
            message.options[message.options.length - 1] = await temp.getPageItemPayload();
          }
        }
      }
      if (data) {
        message.headline = this.library.getTranslation(
          (_k = data && data.headline && await data.headline.getString()) != null ? _k : ""
        );
        message.navigation = this.getNavigation();
        let v = (_l = data.set && await data.set.getNumber()) != null ? _l : null;
        if (v !== null) {
          message.dstTemp = v * 10;
        }
        v = (_m = data.minTemp && await data.minTemp.getNumber()) != null ? _m : null;
        if (v !== null) {
          message.minTemp = v * this.convertValue;
        } else if (data.set && data.set.common.min != null) {
          message.minTemp = data.set.common.min * 10;
        } else {
          message.minTemp = 150;
        }
        v = (_n = data.maxTemp && await data.maxTemp.getNumber()) != null ? _n : null;
        if (v !== null) {
          message.maxTemp = v * this.convertValue;
        } else if (data.set && data.set.common.max != null) {
          message.maxTemp = data.set.common.max * 10;
        } else {
          message.maxTemp = 300;
        }
        const v1 = (_o = data.unit && await data.unit.getString()) != null ? _o : null;
        if (v1 !== null) {
          message.unit = import_icon_mapping.Icons.GetIcon(v1) || v1;
        } else {
          if (data) {
            const set = data.set;
            if (set) {
              if (set.common.unit) {
                message.unit = set.common.unit;
              }
            }
          }
        }
        v = (_p = data.tempStep && await data.tempStep.getNumber()) != null ? _p : null;
        if (v !== null) {
          message.tempStep = String(v * this.convertValue);
        } else if (data.set && data.set.common.step) {
          message.tempStep = String(data.set.common.step * 10);
        } else {
          message.tempStep = "5";
        }
        message.tempStep = parseFloat(message.tempStep) < 1 ? "1" : message.tempStep;
      }
    }
    const msg = Object.assign(PageThermo2MessageDefault, message);
    const msg2 = this.getMessage(msg);
    this.sendToPanel(msg2, false);
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
        const valLow = (_a = data.set && await data.set.getNumber()) != null ? _a : null;
        if (valLow !== null && newValLow !== valLow) {
          await data.set.setStateAsync(newValLow);
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
      String(message.dstTemp),
      String(message.minTemp),
      String(message.maxTemp),
      message.tempStep,
      message.unit,
      message.power ? "1" : "0",
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
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageThermo2
});
//# sourceMappingURL=pageThermo2.js.map
