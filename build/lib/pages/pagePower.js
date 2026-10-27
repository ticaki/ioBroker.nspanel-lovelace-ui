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
  PagePower: () => PagePower,
  buildPowerPageConfig: () => buildPowerPageConfig,
  buildPowerSlotData: () => buildPowerSlotData
});
module.exports = __toCommonJS(pagePower_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
const PagePowerMessageDefault = {
  event: "entityUpd",
  headline: "Power Grid",
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
function mapPowerTargetUnit(unit) {
  switch (unit) {
    case "kW":
      return 1;
    case "MW":
      return 2;
    case "W":
      return 0;
    default:
      return void 0;
  }
}
function buildPowerSlotData(slot) {
  var _a, _b, _c, _d, _e, _f;
  const s = slot != null ? slot : {};
  const stateId = (s.state || "").trim();
  const useColorScale = !!s.useColorScale;
  const iconColor = useColorScale ? "" : s.iconColor || "";
  const unitSuffix = s.valueUnit ? ` ${s.valueUnit}` : "";
  const icon = {
    true: {
      value: { type: "const", constVal: s.icon || "" },
      color: { type: "const", constVal: iconColor }
    },
    false: void 0
  };
  if (useColorScale) {
    icon.scale = {
      type: "const",
      constVal: {
        val_min: (_a = s.minColorScale) != null ? _a : 0,
        val_max: (_b = s.maxColorScale) != null ? _b : 1e4,
        val_best: (_c = s.bestColorScale) != null ? _c : 0,
        mode: "triGrad"
      }
    };
  }
  const value = stateId ? {
    value: { type: "triggered", dp: stateId },
    decimal: { type: "const", constVal: (_d = s.valueDecimal) != null ? _d : 0 },
    unit: { type: "const", constVal: unitSuffix }
  } : void 0;
  const speed = stateId ? {
    value: { type: "triggered", dp: stateId },
    minScale: { type: "const", constVal: (_e = s.minSpeedScale) != null ? _e : 0 },
    maxScale: { type: "const", constVal: (_f = s.maxSpeedScale) != null ? _f : 1e4 },
    negate: { type: "const", constVal: !!s.reverse }
  } : void 0;
  const targetUnit = mapPowerTargetUnit(s.valueUnit);
  return {
    icon,
    value,
    speed,
    text: { true: { type: "const", constVal: s.entityHeadline || "" } },
    targetUnit: targetUnit ? { type: "const", constVal: targetUnit } : void 0
  };
}
function buildPowerPageConfig(entry, pageName = entry.uniqueName) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m;
  const homeBotInternal = !!((_a = entry.homeBot) == null ? void 0 : _a.selInternalCalculation);
  const homeBotState = (((_b = entry.homeBot) == null ? void 0 : _b.state) || "").trim();
  const homeBotUnitSuffix = ((_c = entry.homeBot) == null ? void 0 : _c.valueUnit) ? ` ${entry.homeBot.valueUnit}` : "";
  const homeValueBot = homeBotInternal ? {
    value: { type: "internal", dp: `///${pageName}/powerSum` },
    decimal: { type: "const", constVal: (_e = (_d = entry.homeBot) == null ? void 0 : _d.valueDecimal) != null ? _e : 0 },
    unit: { type: "const", constVal: homeBotUnitSuffix }
  } : homeBotState ? {
    value: { type: "triggered", dp: homeBotState },
    decimal: { type: "const", constVal: (_g = (_f = entry.homeBot) == null ? void 0 : _f.valueDecimal) != null ? _g : 0 },
    unit: { type: "const", constVal: homeBotUnitSuffix }
  } : void 0;
  const homeTopState = (((_h = entry.homeTop) == null ? void 0 : _h.state) || "").trim();
  const homeTopUnitSuffix = ((_i = entry.homeTop) == null ? void 0 : _i.valueUnit) ? ` ${entry.homeTop.valueUnit}` : "";
  const homeValueTop = homeTopState ? {
    value: { type: "triggered", dp: homeTopState },
    decimal: { type: "const", constVal: (_k = (_j = entry.homeTop) == null ? void 0 : _j.valueDecimal) != null ? _k : 0 },
    unit: { type: "const", constVal: homeTopUnitSuffix }
  } : void 0;
  return {
    uniqueID: pageName,
    hidden: !!entry.hidden,
    alwaysOn: (_l = entry.alwaysOn) != null ? _l : "none",
    dpInit: "",
    config: {
      card: "cardPower",
      internalCalculation: homeBotInternal,
      powerSupply: Array.isArray((_m = entry.homeBot) == null ? void 0 : _m.selPowerSupply) ? entry.homeBot.selPowerSupply : [],
      data: {
        headline: { type: "const", constVal: entry.headline || entry.uniqueName },
        homeIcon: { true: { value: { type: "const", constVal: "home" } }, false: void 0 },
        homeValueTop,
        homeValueBot,
        leftTop: buildPowerSlotData(entry.leftTop),
        leftMiddle: buildPowerSlotData(entry.leftMiddle),
        leftBottom: buildPowerSlotData(entry.leftBottom),
        rightTop: buildPowerSlotData(entry.rightTop),
        rightMiddle: buildPowerSlotData(entry.rightMiddle),
        rightBottom: buildPowerSlotData(entry.rightBottom)
      }
    },
    pageItems: []
  };
}
class PagePower extends import_Page.Page {
  //items: pages.PageBaseConfig['items'];
  items;
  autoUnit = [];
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardPower") {
      this.config = options.config;
    }
    this.minUpdateInterval = 2e3;
  }
  async init() {
    await this.basePanel.statesControler.setInternalState(
      `///${this.name}/powerSum`,
      0,
      true,
      { name: "", type: "number", role: "", read: true, write: true },
      this.onInternalCommand
    );
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardPower";
    await super.init();
  }
  onInternalCommand = async (id, _state) => {
    if (!id.startsWith(`///${this.name}`)) {
      return null;
    }
    const token = id.split("/").pop();
    if (token === "powerSum") {
      const items = this.items;
      if (!items || items.card !== "cardPower") {
        return null;
      }
      const data = items.data;
      const l1 = await this.getElementSum(data.leftTop, 0);
      const l2 = await this.getElementSum(data.leftMiddle, 0);
      const l3 = await this.getElementSum(data.leftBottom, 0);
      const r1 = await this.getElementSum(data.rightTop, 0);
      const r2 = await this.getElementSum(data.rightMiddle, 0);
      const r3 = await this.getElementSum(data.rightBottom, 0);
      let gesamt = 0;
      let angepasst = [];
      const cfg = this.config && this.config.card === "cardPower" ? this.config : void 0;
      if (cfg && cfg.internalCalculation) {
        const negativValue = cfg.powerSupply;
        const werte = [l1, l2, l3, r1, r2, r3];
        if (Array.isArray(negativValue) && negativValue.length > 0) {
          angepasst = werte.map((wert, index) => negativValue.includes(index + 1) ? wert : 0);
        } else {
          angepasst = werte;
        }
        gesamt = angepasst.reduce((summe, wert) => summe + wert, 0);
        this.log.debug(`Angepasste Summe: ${gesamt}`);
        return String(gesamt);
      }
    }
    return null;
  };
  /**
   * Page of a script page `cardPower` from its entry in the page configuration.
   *
   * The page keeps the script name as id, so prev/next in the script still match even if the
   * migration of the old table "Page Power" renamed the entry.
   *
   * @param configManager config manager (for the headline of the script page)
   * @param entry power entry of the page configuration
   * @param gridItem page built so far
   * @param page the script page
   * @returns the page, ready for the panel
   */
  static async getPowerPageConfigFromEntry(configManager, entry, gridItem, page) {
    var _a;
    const built = buildPowerPageConfig(entry, page.uniqueName);
    if (page.heading && built.config && built.config.card === "cardPower") {
      built.config.data.headline = await configManager.getFieldAsDataItemConfig(page.heading);
    }
    return {
      ...gridItem,
      ...built,
      alwaysOn: page.alwaysOnDisplay ? "always" : (_a = entry.alwaysOn) != null ? _a : "none",
      hidden: !!(page.hiddenByTrigger || entry.hidden)
    };
  }
  async update() {
    var _a, _b, _c;
    if (!this.visibility) {
      return;
    }
    await super.update();
    const message = {};
    if (this.items) {
      const items = this.items;
      message.headline = this.library.getTranslation(
        (_a = items.data.headline && await items.data.headline.getString()) != null ? _a : ""
      );
      message.navigation = this.getNavigation();
      const data = items.data;
      message.homeIcon = await (0, import_tools.getIconEntryValue)(data.homeIcon, true, "");
      message.homeColor = await (0, import_tools.getIconEntryColor)(data.homeIcon, true, import_Color.Color.White);
      message.homeValueTop = (_b = await (0, import_tools.getValueEntryString)(data.homeValueTop)) != null ? _b : "";
      message.homeValueBot = (_c = await (0, import_tools.getValueEntryString)(data.homeValueBot)) != null ? _c : "";
      message.leftTop = await this.getElementUpdate(data.leftTop, 0);
      message.leftMiddle = await this.getElementUpdate(data.leftMiddle, 1);
      message.leftBottom = await this.getElementUpdate(data.leftBottom, 2);
      message.rightTop = await this.getElementUpdate(data.rightTop, 3);
      message.rightMiddle = await this.getElementUpdate(data.rightMiddle, 4);
      message.rightBottom = await this.getElementUpdate(data.rightBottom, 5);
    }
    this.sendToPanel(this.getMessage(message), false);
  }
  async getElementSum(item, num) {
    if (item === void 0) {
      return num;
    }
    const value = await (0, import_tools.getValueEntryNumber)(item.value);
    return value !== null ? value + num : num;
  }
  async getElementUpdate(item, index) {
    var _a, _b, _c, _d, _e;
    if (item === void 0) {
      return void 0;
    }
    const message = {};
    const value = await (0, import_tools.getValueEntryNumber)(item.value);
    if (value === null) {
      return void 0;
    }
    if (this.autoUnit[index] === void 0) {
      const unitEntry = await ((_a = item.targetUnit) == null ? void 0 : _a.getNumber());
      if (unitEntry != null) {
        this.autoUnit[index] = unitEntry;
      }
    }
    message.icon = (_b = await (0, import_tools.getIconEntryValue)(item.icon, value >= 0, "")) != null ? _b : void 0;
    message.iconColor = (_c = await (0, import_tools.getIconEntryColor)(item.icon, value, import_Color.Color.White)) != null ? _c : void 0;
    message.name = (_d = await (0, import_tools.getEntryTextOnOff)(item.text, value >= 0)) != null ? _d : void 0;
    message.speed = (_e = await (0, import_tools.getScaledNumber)(item.speed)) != null ? _e : void 0;
    const {
      value: newValue,
      unit,
      endFactor
    } = await (0, import_tools.getValueAutoUnit)(item.value, null, 6, null, this.autoUnit[index]);
    this.autoUnit[index] = endFactor || 0;
    message.value = `${newValue}${unit ? ` ${unit}` : ""}`;
    this.log.debug(`getElementUpdate ${value} ${newValue} ${unit} ${endFactor}`);
    return message;
  }
  getMessage(message) {
    let result = PagePowerMessageDefault;
    result = (0, import_tools.deepAssign)(result, message);
    return (0, import_tools.getPayload)(
      (0, import_tools.getPayloadRemoveTilde)("entityUpd", result.headline),
      result.navigation,
      (0, import_tools.getPayloadRemoveTilde)(
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
        ""
      ),
      (0, import_tools.getPayload)(
        this.getMessageItem(result.leftTop),
        this.getMessageItem(result.leftMiddle),
        this.getMessageItem(result.leftBottom),
        this.getMessageItem(result.rightTop),
        this.getMessageItem(result.rightMiddle),
        this.getMessageItem(result.rightBottom)
      )
    );
  }
  getMessageItem(i) {
    var _a, _b, _c, _d, _e;
    if (!i) {
      return (0, import_tools.getPayloadRemoveTilde)("", "", "", "", "", "", "");
    }
    this.log.debug(`${i.icon} ${i.iconColor} ${i.name}  ${i.value} ${String(i.speed)}`);
    return (0, import_tools.getPayloadRemoveTilde)(
      "",
      "",
      (_a = i.icon) != null ? _a : "",
      (_b = i.iconColor) != null ? _b : "",
      (_c = i.name) != null ? _c : "",
      (_d = i.value) != null ? _d : "",
      String((_e = i.speed) != null ? _e : "")
    );
  }
  async onStateTrigger() {
    await this.update();
  }
  onVisibilityChange(val) {
    if (val) {
      this.autoUnit = [];
    }
    return super.onVisibilityChange(val);
  }
  async onButtonEvent(_event) {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PagePower,
  buildPowerPageConfig,
  buildPowerSlotData
});
//# sourceMappingURL=pagePower.js.map
