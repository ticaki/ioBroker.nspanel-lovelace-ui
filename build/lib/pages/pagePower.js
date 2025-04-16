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
  autoUnit = [];
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
    const states = [];
    for (let i = 1; i <= 8; i++) {
      const key = `power${i}_state`;
      if (typeof config[key] === "string" && await configManager.existsState(config[key])) {
        states.push(config[key]);
      } else {
        states.push("");
      }
    }
    const icons = [];
    for (let i = 1; i <= 6; i++) {
      const key = `power${i}_icon`;
      if (typeof config[key] === "string") {
        icons.push(config[key]);
      } else {
        icons.push("");
      }
    }
    const minSpeedScale = [];
    for (let i = 1; i <= 6; i++) {
      const key = `power${i}_minSpeedScale`;
      if (typeof config[key] === "number") {
        minSpeedScale.push(config[key]);
      } else {
        minSpeedScale.push(0);
      }
    }
    const maxSpeedScale = [];
    for (let i = 1; i <= 6; i++) {
      const key = `power${i}_maxSpeedScale`;
      if (typeof config[key] === "number") {
        maxSpeedScale.push(config[key]);
      } else {
        maxSpeedScale.push(1e4);
      }
    }
    const iconColor = [];
    for (let i = 1; i <= 6; i++) {
      const color = `power${i}_iconColor`;
      const useScale = `_power${i}_useColorScale`;
      if (typeof config[color] === "string" && typeof config[useScale] === "boolean" && !config[useScale]) {
        iconColor.push(config[color]);
      } else {
        iconColor.push("");
      }
    }
    const iconColorScale = [];
    for (let i = 1; i <= 6; i++) {
      const prefix = `power${i}_`;
      const surfix = `ColorScale`;
      const scale = [
        config[`${prefix}min${surfix}`],
        config[`${prefix}max${surfix}`],
        config[`${prefix}best${surfix}`]
      ];
      const useScale = config[`_${prefix}use${surfix}`];
      if (scale.every((s) => typeof s === "number") && useScale === true) {
        iconColorScale.push(scale);
      } else {
        iconColorScale.push([]);
      }
    }
    const entityHeadline = [];
    for (let i = 1; i <= 6; i++) {
      const key = `power${i}_entityHeadline`;
      if (typeof config[key] === "string") {
        entityHeadline.push(config[key]);
      } else {
        entityHeadline.push("");
      }
    }
    const speedReverse = [];
    for (let i = 1; i <= 6; i++) {
      const key = `power${i}_reverse`;
      if (typeof config[key] === "boolean") {
        if (config[key]) {
          speedReverse.push(-1);
        } else {
          speedReverse.push(1);
        }
      }
    }
    const valueDecimal = [];
    for (let i = 1; i <= 8; i++) {
      const key = `power${i}_valueDecimal`;
      if (typeof config[key] === "number") {
        valueDecimal.push(config[key]);
      } else {
        valueDecimal.push(0);
      }
    }
    const valueUnit = [];
    for (let i = 1; i <= 8; i++) {
      const key = `power${i}_valueUnit`;
      if (states[i - 1] != null && states[i - 1] != "") {
        const o = await configManager.adapter.getForeignObjectAsync(states[i - 1]);
        if (o && o.common && o.common.unit) {
          valueUnit.push(` ${o.common.unit}`);
        } else {
          if (typeof config[key] === "string" && config[key] != "") {
            valueUnit.push(` ${config[key]}`);
          } else {
            valueUnit.push(" W");
          }
        }
      } else {
        valueUnit.push("");
      }
    }
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
            value: { type: "triggered", dp: states[6] },
            decimal: { type: "const", constVal: valueDecimal[6] },
            unit: { type: "const", constVal: valueUnit[6] }
          },
          homeValueBot: {
            value: { type: "triggered", dp: states[7] },
            decimal: { type: "const", constVal: valueDecimal[7] },
            unit: { type: "const", constVal: valueUnit[7] }
          },
          leftTop: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icons[0]
                },
                color: {
                  type: "const",
                  constVal: iconColor[0]
                  //undefined,
                }
              },
              false: void 0,
              scale: {
                type: "const",
                constVal: {
                  val_min: iconColorScale[0][0],
                  val_max: iconColorScale[0][1],
                  val_best: iconColorScale[0][2],
                  mode: "triGrad"
                }
              }
            },
            value: {
              value: {
                type: "triggered",
                dp: states[0]
              },
              decimal: {
                type: "const",
                constVal: valueDecimal[0]
              },
              unit: {
                type: "const",
                constVal: valueUnit[0]
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: states[0]
              },
              minScale: {
                type: "const",
                constVal: minSpeedScale[0]
              },
              maxScale: {
                type: "const",
                constVal: maxSpeedScale[0]
              },
              negate: {
                type: "const",
                constVal: speedReverse[0]
              }
            },
            text: {
              true: { type: "const", constVal: entityHeadline[0] }
            }
          },
          leftMiddle: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icons[1]
                },
                color: {
                  type: "const",
                  constVal: iconColor[1]
                }
              },
              false: void 0,
              scale: {
                type: "const",
                constVal: {
                  val_min: iconColorScale[1][0],
                  val_max: iconColorScale[1][1],
                  val_best: iconColorScale[1][2],
                  mode: "triGrad"
                }
              }
            },
            value: {
              value: {
                type: "triggered",
                dp: states[1]
              },
              decimal: {
                type: "const",
                constVal: valueDecimal[1]
              },
              unit: {
                type: "const",
                constVal: valueUnit[1]
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: states[1]
              },
              minScale: {
                type: "const",
                constVal: minSpeedScale[1]
              },
              maxScale: {
                type: "const",
                constVal: maxSpeedScale[1]
              },
              negate: {
                type: "const",
                constVal: speedReverse[1]
              }
            },
            text: {
              true: { type: "const", constVal: entityHeadline[1] }
            }
          },
          leftBottom: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icons[2]
                },
                color: {
                  type: "const",
                  constVal: iconColor[2]
                }
              },
              false: void 0,
              scale: {
                type: "const",
                constVal: {
                  val_min: iconColorScale[2][0],
                  val_max: iconColorScale[2][1],
                  val_best: iconColorScale[2][2],
                  mode: "triGrad"
                }
              }
            },
            value: {
              value: {
                type: "triggered",
                dp: states[2]
              },
              decimal: {
                type: "const",
                constVal: valueDecimal[2]
              },
              unit: {
                type: "const",
                constVal: valueUnit[2]
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: states[2]
              },
              minScale: {
                type: "const",
                constVal: minSpeedScale[2]
              },
              maxScale: {
                type: "const",
                constVal: maxSpeedScale[2]
              },
              negate: {
                type: "const",
                constVal: speedReverse[2]
              }
            },
            text: {
              true: { type: "const", constVal: entityHeadline[2] }
            }
          },
          rightTop: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icons[3]
                },
                color: {
                  type: "const",
                  constVal: iconColor[3]
                }
              },
              false: void 0,
              scale: {
                type: "const",
                constVal: {
                  val_min: iconColorScale[3][0],
                  val_max: iconColorScale[3][1],
                  val_best: iconColorScale[3][2],
                  mode: "triGrad"
                }
              }
            },
            value: {
              value: {
                type: "triggered",
                dp: states[3]
              },
              decimal: {
                type: "const",
                constVal: valueDecimal[3]
              },
              unit: {
                type: "const",
                constVal: valueUnit[3]
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: states[3]
              },
              minScale: {
                type: "const",
                constVal: minSpeedScale[3]
              },
              maxScale: {
                type: "const",
                constVal: maxSpeedScale[3]
              },
              negate: {
                type: "const",
                constVal: speedReverse[3]
              }
            },
            text: {
              true: { type: "const", constVal: entityHeadline[3] }
            }
          },
          rightMiddle: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icons[4]
                },
                color: {
                  type: "const",
                  constVal: iconColor[4]
                }
              },
              false: void 0,
              scale: {
                type: "const",
                constVal: {
                  val_min: iconColorScale[4][0],
                  val_max: iconColorScale[4][1],
                  val_best: iconColorScale[4][2],
                  mode: "triGrad"
                }
              }
            },
            value: {
              value: {
                type: "triggered",
                dp: states[4]
              },
              decimal: {
                type: "const",
                constVal: valueDecimal[4]
              },
              unit: {
                type: "const",
                constVal: valueUnit[4]
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: states[4]
              },
              minScale: {
                type: "const",
                constVal: minSpeedScale[4]
              },
              maxScale: {
                type: "const",
                constVal: maxSpeedScale[4]
              },
              negate: {
                type: "const",
                constVal: speedReverse[4]
              }
            },
            text: {
              true: { type: "const", constVal: entityHeadline[4] }
            }
          },
          rightBottom: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: icons[5]
                },
                color: {
                  type: "const",
                  constVal: iconColor[5]
                }
              },
              false: void 0,
              scale: {
                type: "const",
                constVal: {
                  val_min: iconColorScale[5][0],
                  val_max: iconColorScale[5][1],
                  val_best: iconColorScale[5][2],
                  mode: "triGrad"
                }
              }
            },
            value: {
              value: {
                type: "triggered",
                dp: states[5]
              },
              decimal: {
                type: "const",
                constVal: valueDecimal[5]
              },
              unit: {
                type: "const",
                constVal: valueUnit[5]
              }
            },
            speed: {
              value: {
                type: "triggered",
                dp: states[5]
              },
              minScale: {
                type: "const",
                constVal: minSpeedScale[5]
              },
              maxScale: {
                type: "const",
                constVal: maxSpeedScale[5]
              },
              negate: {
                type: "const",
                constVal: speedReverse[5]
              }
            },
            text: {
              true: { type: "const", constVal: entityHeadline[5] }
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
    this.autoUnit[index] = value;
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
