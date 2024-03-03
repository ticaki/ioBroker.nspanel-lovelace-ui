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
var pageAlarm_exports = {};
__export(pageAlarm_exports, {
  PageAlarm: () => PageAlarm
});
module.exports = __toCommonJS(pageAlarm_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_definition = require("../const/definition");
var import_tools = require("../const/tools");
const PageAlarmMessageDefault = {
  event: "entityUpd",
  headline: "Page Grid",
  intNameEntity: "",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  button1: "",
  button2: "",
  button3: "",
  button4: "",
  icon: "",
  iconColor: "",
  numpad: "disable",
  flashing: "disable"
};
class PageAlarm extends import_Page.Page {
  items;
  step = 1;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  status = "disarmed";
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardPower")
      this.config = options.config;
    this.minUpdateInterval = 500;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardAlarm";
    this.library.writedp(
      `panels.${this.name}.alarm.${this.name}`,
      void 0,
      import_definition.genericStateObjects.panel.panels.alarm.cardAlarm._channel
    );
    await super.init();
  }
  async update() {
    var _a, _b, _c, _d, _e;
    if (!this.visibility)
      return;
    const message = {};
    const items = this.items;
    if (!items || items.card !== "cardAlarm")
      return;
    const data = items.data;
    message.headline = (_a = this.items && this.items.data.headline && await this.items.data.headline.getString()) != null ? _a : "";
    message.navigation = this.getNavigation();
    message.button1 = (_b = data.button1 && await data.button1.getString()) != null ? _b : "";
    message.button2 = (_c = data.button1 && await data.button1.getString()) != null ? _c : "";
    message.button3 = (_d = data.button1 && await data.button1.getString()) != null ? _d : "";
    message.button4 = (_e = data.button1 && await data.button1.getString()) != null ? _e : "";
    message.icon = await (0, import_tools.getIconEntryValue)(data.icon, true, "");
    message.iconColor = await (0, import_tools.getIconEntryColor)(data.icon, true, "");
    this.library.writedp(
      `panels.${this.name}.alarm.${this.name}.status`,
      ["disarmed", "armed", "arming", "pending", "triggered"].indexOf(this.status),
      import_definition.genericStateObjects.panel.panels.alarm.cardAlarm.status
    );
    this.sendToPanel(this.getMessage(message));
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
    let result = PageAlarmMessageDefault;
    result = (0, import_tools.deepAssign)(result, message);
    return (0, import_tools.getPayload)("entityUpd", result.headline, result.navigation, "", "");
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
  PageAlarm
});
//# sourceMappingURL=pageAlarm.js.map
