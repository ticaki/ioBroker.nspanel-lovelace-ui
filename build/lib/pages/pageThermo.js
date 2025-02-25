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
  btDetail: "1"
};
class PageThermo extends import_Page.Page {
  //config: pages.cardThermoDataItemOptions;
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
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
  }
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    if (!this.visibility) {
      return;
    }
    const message = {};
    message.options = ["~~~", "~~~", "~~~", "~~~", "~~~", "~~~", "~~~", "~~~"];
    if (this.items) {
      const item = this.items;
      if (this.pageItems) {
        const pageItems = this.pageItems.filter(
          (a) => a && a.dataItems && a.dataItems.type === "button" && a.dataItems.data.entity1
        );
        const localStep = pageItems.length > 9 ? 7 : 8;
        if (pageItems.length - 1 <= localStep * (this.step - 1)) {
          this.step = 1;
        }
        const maxSteps = localStep * this.step + 1;
        const minStep = localStep * (this.step - 1) + 1;
        let b = 0;
        for (let a = minStep; a < maxSteps; a++, b++) {
          const temp = pageItems[a];
          if (temp) {
            const arr = (await temp.getPageItemPayload()).split("~");
            message.options[b] = (0, import_tools.getPayload)(arr[2], arr[3], arr[5] == "1" ? "1" : "1", arr[1]);
          } else {
            (0, import_tools.getPayload)("", "", "", "");
          }
        }
        if (localStep === 7) {
          this.nextArrow = true;
          const temp = this.pageItems[0];
          if (temp) {
            const arr = (await temp.getPageItemPayload()).split("~");
            message.options[7] = (0, import_tools.getPayload)(arr[2], arr[3], arr[5] == "1" ? "1" : "0", arr[1]);
          } else {
            (0, import_tools.getPayload)("", "", "", "");
          }
        }
      }
      message.intNameEntity = this.id;
      message.headline = this.library.getTranslation(
        (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : ""
      );
      message.navigation = this.getNavigation();
      let v = (_b = item.data.set1 && await item.data.set1.getNumber()) != null ? _b : null;
      if (v !== null) {
        message.dstTemp = v * 10;
      }
      v = (_c = item.data.minTemp && await item.data.minTemp.getNumber()) != null ? _c : null;
      if (v !== null) {
        message.minTemp = v * 10;
      } else if (item.data.set1 && item.data.set1.common.min != null) {
        message.minTemp = item.data.set1.common.min * 10;
      } else {
        message.minTemp = 150;
      }
      v = (_d = item.data.maxTemp && await item.data.maxTemp.getNumber()) != null ? _d : null;
      if (v !== null) {
        message.maxTemp = v * 10;
      } else if (item.data.set1 && item.data.set1.common.max != null) {
        message.maxTemp = item.data.set1.common.max * 10;
      } else {
        message.maxTemp = 300;
      }
      v = (_e = item.data.set2 && await item.data.set2.getNumber()) != null ? _e : null;
      if (v !== null) {
        message.temp2 = v * 10;
      }
      v = (_f = item.data.unit && await item.data.unit.getString()) != null ? _f : null;
      if (v !== null) {
        message.tCF = v;
        message.currentTemp += v;
      } else {
        if (item && item.data) {
          let set = item.data.set1;
          if (set) {
            if (set.common.unit) {
              message.tCF = set.common.unit;
              message.currentTemp += set.common.unit;
            }
          } else {
            set = item.data.set2;
            if (set) {
              if (set.common.unit) {
                message.tCF = set.common.unit;
                message.currentTemp += set.common.unit;
              }
            }
          }
        }
      }
      v = (_g = item.data.tempStep && await item.data.tempStep.getString()) != null ? _g : null;
      if (v !== null) {
        message.tempStep = v;
      } else if (item.data.set1 && item.data.set1.common.step) {
        message.tempStep = String(item.data.set1.common.step * 10);
      } else {
        message.tempStep = "5";
      }
      message.tCurTempLbl = this.library.getTranslation((_h = await (0, import_tools.getValueEntryString)(item.data.mixed1)) != null ? _h : "");
      message.currentTemp = this.library.getTranslation((_i = await (0, import_tools.getValueEntryString)(item.data.mixed2)) != null ? _i : "");
      message.tStateLbl = this.library.getTranslation((_j = await (0, import_tools.getValueEntryString)(item.data.mixed3)) != null ? _j : "");
      message.status = this.library.getTranslation((_k = await (0, import_tools.getValueEntryString)(item.data.mixed4)) != null ? _k : "");
      message.btDetail = this.pageItems && this.pageItems.some((a) => a && a.dataItems && a.dataItems.type === "input_sel") ? "0" : "1";
    }
    const msg = Object.assign(PageThermoMessageDefault, message);
    this.sendToPanel(this.getMessage(msg));
  }
  async onButtonEvent(event) {
    var _a, _b, _c;
    if (event.action === "tempUpdHighLow") {
      if (!this.items) {
        return;
      }
      const values = event.opt.split("|");
      const newValLow = parseInt(values[0]) / 10;
      const newValHigh = parseInt(values[1]) / 10;
      const valLow = (_a = this.items && this.items.data.set1 && await this.items.data.set1.getNumber()) != null ? _a : null;
      const valHigh = (_b = this.items && this.items.data.set2 && await this.items.data.set2.getNumber()) != null ? _b : null;
      if (valLow !== null && newValLow !== valLow) {
        await this.items.data.set1.setStateAsync(newValLow);
      }
      if (valHigh !== null && newValHigh !== valHigh) {
        await this.items.data.set2.setStateAsync(newValHigh);
      }
    } else if (event.action === "tempUpd") {
      if (!this.items) {
        return;
      }
      const newValLow = parseInt(event.opt) / 10;
      const valLow = (_c = this.items && this.items.data.set1 && await this.items.data.set1.getNumber()) != null ? _c : null;
      if (valLow !== null && newValLow !== valLow) {
        await this.items.data.set1.setStateAsync(newValLow);
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
  async onPopupRequest(id, popup, action, value, _event = null) {
    var _a, _b, _c;
    if (!this.pageItems || !this.pageItems.some((a) => a && a.dataItems && a.dataItems.type === "input_sel")) {
      return;
    }
    const items = this.pageItems;
    let msg = null;
    if (popup === "popupThermo") {
      const items2 = this.pageItems.filter((a) => a && a.dataItems && a.dataItems.type === "input_sel");
      const temp = [];
      const id2 = this.id;
      const icon = import_icon_mapping.Icons.GetIcon(
        (_a = this.items && this.items.data.icon && await this.items.data.icon.getString()) != null ? _a : "fan"
      );
      const color = (_b = this.items && this.items.data.icon && await this.items.data.icon.getRGBDec()) != null ? _b : "11487";
      for (const i of items2) {
        i && temp.push((0, import_tools.getPayload)((_c = await i.GeneratePopup(popup)) != null ? _c : "~~~"));
      }
      for (let a = 0; a < 3; a++) {
        if (temp[a] === void 0) {
          temp[a] = "~~~";
        }
      }
      msg = (0, import_tools.getPayload)("entityUpdateDetail", id2, icon, color, temp[0], temp[1], temp[2], "");
    } else if (action && action.startsWith("mode") && value !== void 0) {
      const tempid = parseInt(action.split("?")[1]);
      const item = items[tempid];
      if (!item) {
        return;
      }
      await item.onCommand("mode-insel", value);
    }
    if (msg !== null) {
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
  async onStateTrigger() {
    await this.update();
  }
  async reset() {
    this.step = 1;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageThermo
});
//# sourceMappingURL=pageThermo.js.map
