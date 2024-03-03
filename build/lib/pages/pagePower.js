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
var pagePower_exports = {};
__export(pagePower_exports, {
  PagePower: () => PagePower
});
module.exports = __toCommonJS(pagePower_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
const PagePowerMessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  homeValueTop: "",
  homeIcon: "",
  homeColor: "",
  homeName: "",
  homeValueBot: "",
  leftTop: {
    icon: "",
    iconColor: "",
    value: "",
    speed: 0,
    name: ""
  },
  leftMiddle: {
    icon: "",
    iconColor: "",
    value: "",
    speed: 0,
    name: ""
  },
  leftBottom: {
    icon: "",
    iconColor: "",
    value: "",
    speed: 0,
    name: ""
  },
  rightTop: {
    icon: "",
    iconColor: "",
    value: "",
    speed: 0,
    name: ""
  },
  rightMiddle: {
    icon: "",
    iconColor: "",
    value: "",
    speed: 0,
    name: ""
  },
  rightBottom: {
    icon: "",
    iconColor: "",
    value: "",
    speed: 0,
    name: ""
  }
};
class PagePower extends import_Page.Page {
  items;
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardPower")
      this.config = options.config;
    this.minUpdateInterval = 2e3;
  }
  async init() {
    await this.panel.statesControler.setInternalState(
      `///${this.name}/powerSum`,
      0,
      true,
      { name: "", type: "string", role: "", read: true, write: false },
      this.onInternalCommand
    );
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardPower";
    await super.init();
  }
  onInternalCommand = async (id, _state) => {
    if (!id.startsWith("///" + this.name))
      return null;
    const token = id.split("/").pop();
    if (token === "powerSum") {
      const items = this.items;
      if (!items || items.card !== "cardPower")
        return null;
      const data = items.data;
      const l1 = await this.getElementSum(data.leftTop, 0);
      const l2 = await this.getElementSum(data.leftMiddle, 0);
      const l3 = await this.getElementSum(data.leftBottom, 0);
      const r1 = await this.getElementSum(data.rightTop, 0);
      const r2 = await this.getElementSum(data.rightMiddle, 0);
      const r3 = await this.getElementSum(data.rightBottom, 0);
      let sum = l1 + l2 + l3 + r1 + r2 + r3;
      if (items.data.homeValueBot && items.data.homeValueBot.math) {
        const f = await items.data.homeValueBot.math.getString();
        if (f)
          sum = new Function("l1", "l2", "l3", "r1", "r2", "r3", "Math", f)(l1, l2, l3, r1, r2, r3, Math);
      }
      return String(sum);
    }
    return null;
  };
  async update() {
    var _a, _b, _c;
    if (!this.visibility)
      return;
    const message = {};
    const items = this.items;
    if (!items || items.card !== "cardPower")
      return;
    const data = items.data;
    message.headline = this.library.getTranslation(
      (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : ""
    );
    message.navigation = this.getNavigation();
    message.homeIcon = await (0, import_tools.getIconEntryValue)(data.homeIcon, true, "");
    message.homeColor = await (0, import_tools.getIconEntryColor)(data.homeIcon, true, import_Color.White);
    message.homeValueTop = (_b = await (0, import_tools.getValueEntryString)(data.homeValueTop)) != null ? _b : "";
    message.homeValueBot = (_c = await (0, import_tools.getValueEntryString)(data.homeValueBot)) != null ? _c : "";
    message.leftTop = await this.getElementUpdate(data.leftTop);
    message.leftMiddle = await this.getElementUpdate(data.leftMiddle);
    message.leftBottom = await this.getElementUpdate(data.leftBottom);
    message.rightTop = await this.getElementUpdate(data.rightTop);
    message.rightMiddle = await this.getElementUpdate(data.rightMiddle);
    message.rightBottom = await this.getElementUpdate(data.rightBottom);
    this.sendToPanel(this.getMessage(message));
  }
  async getElementSum(item, num) {
    if (item === void 0)
      return num;
    const value = await (0, import_tools.getValueEntryNumber)(item.value);
    return value !== null ? value + num : num;
  }
  async getElementUpdate(item) {
    var _a, _b, _c, _d, _e;
    if (item === void 0)
      return void 0;
    const message = {};
    const value = await (0, import_tools.getValueEntryNumber)(item.value);
    if (value === null)
      return void 0;
    message.icon = (_a = await (0, import_tools.getIconEntryValue)(item.icon, value >= 0, "")) != null ? _a : void 0;
    message.iconColor = (_b = await (0, import_tools.getIconEntryColor)(item.icon, value, import_Color.White)) != null ? _b : void 0;
    message.name = (_c = await (0, import_tools.getEntryTextOnOff)(item.text, value >= 0)) != null ? _c : void 0;
    message.speed = (_d = await (0, import_tools.getScaledNumber)(item.speed)) != null ? _d : void 0;
    message.value = (_e = await (0, import_tools.getValueEntryString)(item.value, value)) != null ? _e : void 0;
    return message;
  }
  getMessage(message) {
    let result = PagePowerMessageDefault;
    result = (0, import_tools.deepAssign)(result, message);
    return (0, import_tools.getPayload)(
      "entityUpd",
      result.headline,
      result.navigation,
      "",
      "",
      result.homeIcon,
      result.homeColor,
      result.homeName,
      result.homeValueBot,
      "",
      "",
      "",
      "",
      "",
      "",
      result.homeValueTop,
      "",
      this.getMessageItem(result.leftTop),
      this.getMessageItem(result.leftMiddle),
      this.getMessageItem(result.leftBottom),
      this.getMessageItem(result.rightTop),
      this.getMessageItem(result.rightMiddle),
      this.getMessageItem(result.rightBottom)
    );
  }
  getMessageItem(i) {
    var _a, _b, _c, _d, _e;
    if (!i)
      return (0, import_tools.getPayload)("", "", "", "", "", "", "");
    return (0, import_tools.getPayload)("", "", (_a = i.icon) != null ? _a : "", (_b = i.iconColor) != null ? _b : "", (_c = i.name) != null ? _c : "", (_d = i.value) != null ? _d : "", String((_e = i.speed) != null ? _e : ""));
  }
  async onStateTrigger() {
    await this.update();
  }
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PagePower
});
//# sourceMappingURL=pagePower.js.map
