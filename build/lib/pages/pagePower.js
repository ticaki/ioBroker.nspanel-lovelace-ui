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
class PagePower extends import_Page.Page {
  //items: pages.PageBaseConfig['items'];
  items;
  index = 0;
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardPower") {
      this.config = options.config;
    }
    this.minUpdateInterval = 2e3;
  }
  async init() {
    await this.panel.statesControler.setInternalState(
      `///${this.name}/powerSum`,
      0,
      true,
      { name: "", type: "number", role: "", read: true, write: true },
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
      let sum = l1 + l2 + l3 + r1 + r2 + r3;
      if (items.data.homeValueBot && items.data.homeValueBot.math) {
        const f = await items.data.homeValueBot.math.getString();
        if (f) {
          sum = new Function("l1", "l2", "l3", "r1", "r2", "r3", "Math", f)(l1, l2, l3, r1, r2, r3, Math);
        }
      }
      return String(sum);
    }
    return null;
  };
  static async getPowerPageConfig(adapter, index, configManager) {
    const config = adapter.config.pagePowerdata[index];
    const stateLeftTopExist = config.power1_state !== void 0 && await configManager.existsState(config.power1_state);
    const Power1 = stateLeftTopExist ? config.power1_state !== void 0 ? config.power1_state : "" : "";
    const stateLeftMiddleExist = config.power2_state !== void 0 && await configManager.existsState(config.power2_state);
    const Power2 = stateLeftMiddleExist ? config.power2_state !== void 0 ? config.power2_state : "" : "";
    const stateLeftBottomExist = config.power3_state !== void 0 && await configManager.existsState(config.power3_state);
    const Power3 = stateLeftBottomExist ? config.power3_state !== void 0 ? config.power3_state : "" : "";
    const stateRightTopExist = config.power4_state !== void 0 && await configManager.existsState(config.power4_state);
    const Power4 = stateRightTopExist ? config.power4_state !== void 0 ? config.power4_state : "" : "";
    const stateRightMiddleExist = config.power5_state !== void 0 && await configManager.existsState(config.power5_state);
    const Power5 = stateRightMiddleExist ? config.power5_state !== void 0 ? config.power5_state : "" : "";
    const stateRightBottomExist = config.power6_state !== void 0 && await configManager.existsState(config.power6_state);
    const Power6 = stateRightBottomExist ? config.power6_state !== void 0 ? config.power6_state : "" : "";
    const statePowerHomeExist = config.power7_state !== void 0 && await configManager.existsState(config.power7_state);
    const PowerHome = statePowerHomeExist ? config.power7_state !== void 0 ? config.power7_state : "" : "";
    const Icon1 = config.power1_icon !== void 0 ? config.power1_icon : "";
    const Icon2 = config.power2_icon !== void 0 ? config.power2_icon : "";
    const Icon3 = config.power3_icon !== void 0 ? config.power3_icon : "";
    const Icon4 = config.power4_icon !== void 0 ? config.power4_icon : "";
    const Icon5 = config.power5_icon !== void 0 ? config.power5_icon : "";
    const Icon6 = config.power6_icon !== void 0 ? config.power6_icon : "";
    const result = {
      uniqueID: config.pageName,
      alwaysOn: config.alwaysOnDisplay ? "always" : "none",
      config: {
        card: "cardPower",
        index,
        data: {
          headline: { type: "const", constVal: config.headline },
          homeIcon: { true: { value: { type: "const", constVal: "home" } }, false: void 0 },
          homeValueTop: {
            value: { type: "state", dp: PowerHome }
          },
          homeValueBot: {
            value: { type: "internal", dp: `///${config.pageName}/powerSum` },
            math: { type: "const", constVal: "return r1+r2+r3+l1+l2+l3 -999" }
          },
          leftTop: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: Icon1
                },
                color: void 0
              },
              false: void 0
            },
            value: {
              value: {
                type: "triggered",
                dp: Power1
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: Power1
              }
            },
            text: {
              true: { type: "state", dp: Power1 }
            }
          },
          leftMiddle: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: Icon2
                },
                color: void 0
              },
              false: void 0
            },
            value: {
              value: {
                type: "triggered",
                dp: Power2
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: Power2
              }
            },
            text: {
              true: { type: "state", dp: Power2 }
            }
          },
          leftBottom: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: Icon3
                },
                color: void 0
              },
              false: void 0
            },
            value: {
              value: {
                type: "triggered",
                dp: Power3
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: Power3
              }
            },
            text: {
              true: { type: "state", dp: Power3 }
            }
          },
          rightTop: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: Icon4
                },
                color: void 0
              },
              false: void 0
            },
            value: {
              value: {
                type: "triggered",
                dp: Power4
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: Power4
              }
            },
            text: {
              true: { type: "state", dp: Power4 }
            }
          },
          rightMiddle: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: Icon5
                },
                color: void 0
              },
              false: void 0
            },
            value: {
              value: {
                type: "triggered",
                dp: Power5
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: Power5
              }
            },
            text: {
              true: { type: "state", dp: Power5 }
            }
          },
          rightBottom: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: Icon6
                },
                color: void 0
              },
              false: void 0
            },
            value: {
              value: {
                type: "triggered",
                dp: Power6
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: Power6
              }
            },
            text: {
              true: { type: "state", dp: Power6 }
            }
          }
        }
      },
      pageItems: []
    };
    return result;
  }
  async update() {
    var _a, _b, _c, _d;
    if (!this.visibility) {
      return;
    }
    const message = {};
    const config = this.adapter.config.pagePowerdata[this.index];
    if (this.items && config != null) {
      const items = this.items;
      message.headline = this.library.getTranslation(
        (_b = (_a = items.data.headline && await items.data.headline.getString()) != null ? _a : config.headline) != null ? _b : ""
      );
      message.navigation = this.getNavigation();
      const data = items.data;
      message.homeIcon = await (0, import_tools.getIconEntryValue)(data.homeIcon, true, "");
      message.homeColor = await (0, import_tools.getIconEntryColor)(data.homeIcon, true, import_Color.Color.White);
      message.homeValueTop = (_c = await (0, import_tools.getValueEntryString)(data.homeValueTop)) != null ? _c : "";
      message.homeValueBot = (_d = await (0, import_tools.getValueEntryString)(data.homeValueBot)) != null ? _d : "";
      message.leftTop = await this.getElementUpdate(data.leftTop);
      message.leftMiddle = await this.getElementUpdate(data.leftMiddle);
      message.leftBottom = await this.getElementUpdate(data.leftBottom);
      message.rightTop = await this.getElementUpdate(data.rightTop);
      message.rightMiddle = await this.getElementUpdate(data.rightMiddle);
      message.rightBottom = await this.getElementUpdate(data.rightBottom);
    }
    this.sendToPanel(this.getMessage(message));
  }
  async getElementSum(item, num) {
    if (item === void 0) {
      return num;
    }
    const value = await (0, import_tools.getValueEntryNumber)(item.value);
    return value !== null ? value + num : num;
  }
  async getElementUpdate(item) {
    var _a, _b, _c, _d, _e;
    if (item === void 0) {
      return void 0;
    }
    const message = {};
    const value = await (0, import_tools.getValueEntryNumber)(item.value);
    if (value === null) {
      return void 0;
    }
    message.icon = (_a = await (0, import_tools.getIconEntryValue)(item.icon, value >= 0, "")) != null ? _a : void 0;
    message.iconColor = (_b = await (0, import_tools.getIconEntryColor)(item.icon, value, import_Color.Color.White)) != null ? _b : void 0;
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
    if (!i) {
      return (0, import_tools.getPayload)("", "", "", "", "", "", "");
    }
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
