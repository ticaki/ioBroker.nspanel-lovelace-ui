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
var pageThermo_exports = {};
__export(pageThermo_exports, {
  PageThermo: () => PageThermo
});
module.exports = __toCommonJS(pageThermo_exports);
var import_Page = require("../classes/Page");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
const PageThermoMessageDefault = {
  event: "entityUpd",
  headline: "Page Thermo",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  intNameEntity: "",
  currentTemp: "",
  dstTemp: "",
  status: "",
  minTemp: "10",
  maxTemp: "40",
  tempStep: "5",
  options: ["~~~", "~~~", "~~~", "~~~", "~~~", "~~~", "~~~", "~~~"],
  tCurTempLbl: "",
  tStateLbl: "",
  tALbl: "",
  tCF: "",
  temp2: "",
  btDetail: 1
};
class PageThermo extends import_Page.Page {
  config;
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  dpInit;
  constructor(config, options) {
    super(config, options.pageItems);
    if (options.config && options.config.card == "cardThermo")
      this.config = options.config;
    else
      throw new Error("Missing config!");
    if (options.items && options.items.card == "cardThermo")
      this.items = options.items;
    this.minUpdateInterval = 2e3;
    this.dpInit = options.dpInit;
  }
  async init() {
    const config = { ...this.config };
    const tempConfig = this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem)
      tempItem.card = this.config && this.config.card;
    this.items = tempItem;
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
    const message = {};
    message.options = [...PageThermoMessageDefault.options];
    if (this.items) {
      const item = this.items;
      if (this.pageItems) {
        const pageItems = this.pageItems.filter((a) => a.dataItems && a.dataItems.type === "button");
        for (let a = 0; a < pageItems.length && a < message.options.length; a++) {
          const temp = pageItems[a];
          if (temp) {
            const arr = (await temp.getPageItemPayload()).split("~");
            message.options[a] = (0, import_tools.getPayload)(arr[2], arr[3], arr[5] == "1" ? "1" : "0", arr[1]);
          }
        }
      }
      message.intNameEntity = this.id;
      message.headline = (_a = item.data.headline && await item.data.headline.getString()) != null ? _a : "";
      message.navigation = this.getNavigation();
      let v = (_b = item.data.current && await item.data.current.getNumber()) != null ? _b : null;
      if (v !== null) {
        message.currentTemp = v.toFixed(1);
      } else {
        v = (_c = item.data.current && await item.data.current.getString()) != null ? _c : null;
        if (v !== null) {
          message.currentTemp = this.library.getTranslation(v);
        }
      }
      v = (_d = item.data.set1 && await item.data.set1.getNumber()) != null ? _d : null;
      if (v !== null) {
        message.dstTemp = v * 10;
      }
      v = (_e = item.data.minTemp && await item.data.minTemp.getNumber()) != null ? _e : null;
      if (v !== null) {
        message.minTemp = v * 10;
      }
      v = (_f = item.data.maxTemp && await item.data.maxTemp.getNumber()) != null ? _f : null;
      if (v !== null) {
        message.maxTemp = v * 10;
      }
      v = (_g = item.data.set2 && await item.data.set2.getNumber()) != null ? _g : null;
      if (v !== null) {
        message.temp2 = v * 10;
      }
      v = (_h = item.data.unit && await item.data.unit.getString()) != null ? _h : null;
      if (v !== null) {
        message.tCF = v;
        message.currentTemp += v;
      }
      v = (_i = item.data.text1 && await item.data.text1.getString()) != null ? _i : null;
      if (v !== null) {
        message.tCurTempLbl = this.library.getTranslation(v);
      }
      v = (_j = item.data.text2 && await item.data.text2.getString()) != null ? _j : null;
      if (v !== null) {
        message.tStateLbl = this.library.getTranslation(v);
      }
      v = (_k = item.data.tempStep && await item.data.tempStep.getString()) != null ? _k : null;
      if (v !== null) {
        message.tempStep = v;
      }
      v = (_l = item.data.mode && await item.data.mode.getNumber()) != null ? _l : null;
      if (v !== null) {
        message.status = v;
      } else {
        v = (_m = item.data.mode && await item.data.mode.getString()) != null ? _m : null;
        if (v !== null) {
          message.status = this.library.getTranslation(v);
        }
      }
      message.btDetail = "";
    }
    const msg = Object.assign(PageThermoMessageDefault, message);
    this.sendToPanel(this.getMessage(msg));
  }
  async onButtonEvent(event) {
    var _a, _b, _c;
    if (event.action === "tempUpdHighLow") {
      if (!this.items)
        return;
      const values = event.opt.split("|");
      const newValLow = parseInt(values[0]) / 10;
      const newValHigh = parseInt(values[1]) / 10;
      const valLow = (_a = this.items && this.items.data.set1 && await this.items.data.set1.getNumber()) != null ? _a : null;
      const valHigh = (_b = this.items && this.items.data.set2 && await this.items.data.set2.getNumber()) != null ? _b : null;
      if (valLow !== null && newValLow !== valLow)
        this.items.data.set1.setStateAsync(newValLow);
      if (valHigh !== null && newValHigh !== valHigh)
        await this.items.data.set2.setStateAsync(newValHigh);
    } else if (event.action === "tempUpd") {
      if (!this.items)
        return;
      const newValLow = parseInt(event.opt) / 10;
      const valLow = (_c = this.items && this.items.data.set1 && await this.items.data.set1.getNumber()) != null ? _c : null;
      if (valLow !== null && newValLow !== valLow)
        await this.items.data.set1.setStateAsync(newValLow);
    } else if (event.action === "hvac_action") {
      if (!this.pageItems)
        return;
      await this.pageItems[Number(event.opt.split("?")[1])].onCommand("button", "");
    }
  }
  async onPopupRequest(id, popup, action, value, _event = null) {
    var _a, _b, _c;
    if (!this.pageItems || !this.pageItems.some((a) => a.dataItems && a.dataItems.type === "input_sel"))
      return;
    const items = this.pageItems;
    let msg = null;
    if (popup === "popupThermo") {
      const temp = [];
      const id2 = this.id;
      const icon = import_icon_mapping.Icons.GetIcon(
        (_a = this.items && this.items.data.icon && await this.items.data.icon.getString()) != null ? _a : "fan"
      );
      const color = (_b = this.items && this.items.data.icon && await this.items.data.icon.getRGBDec()) != null ? _b : "11487";
      for (const i of items) {
        temp.push((0, import_tools.getPayload)((_c = await i.GeneratePopup(popup)) != null ? _c : "~~~"));
      }
      for (let a = 0; a < 3; a++) {
        if (temp[a] === void 0)
          temp[a] = "~~~";
      }
      this.log.debug(`Trigger from popupThermo 3 `);
      msg = (0, import_tools.getPayload)("entityUpdateDetail", id2, icon, color, temp[0], temp[1], temp[2], "");
    } else if (action && action.startsWith("mode") && value !== void 0) {
      const tempid = parseInt(action.split("?")[1]);
      const item = items[tempid];
      if (!item)
        return;
      item.onCommand("mode-insel", value);
    }
    if (msg !== null) {
      this.log.debug(`Trigger from popupThermo 4 `);
      this.sendToPanel(msg);
    }
  }
  getMessage(message) {
    return (0, import_tools.getPayload)(
      "entityUpd",
      message.headline,
      message.navigation,
      message.intNameEntity,
      String(message.currentTemp),
      String(message.dstTemp),
      message.status,
      String(message.minTemp),
      String(message.maxTemp),
      message.tempStep,
      (0, import_tools.getPayloadArray)(message.options),
      message.tCurTempLbl,
      message.tStateLbl,
      message.tALbl,
      message.tCF,
      String(message.temp2),
      String(message.btDetail)
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageThermo
});
//# sourceMappingURL=pageThermo.js.map
