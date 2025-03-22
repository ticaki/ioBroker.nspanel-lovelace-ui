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
var pageQR_exports = {};
__export(pageQR_exports, {
  PageQR: () => PageQR
});
module.exports = __toCommonJS(pageQR_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
var pages = __toESM(require("../types/pages"));
const PageQRMessageDefault = {
  event: "entityUpd",
  headline: "Page QR",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  textQR: "disabled",
  //textQR
  type1: "disabled",
  //type -> text or switch
  internalName1: "~",
  //internalName
  iconId1: "~",
  //iconId
  iconColor1: "~",
  //iconColor
  displayName1: "~",
  //displayName
  optionalValue1: "~",
  //optionalValue
  type2: "disabled",
  //type2 -> text or switch
  internalName2: "~",
  //internalName2
  iconId2: "~",
  //iconId2
  iconColor2: "~",
  //iconColor2
  displayName2: "~",
  //displayName2
  optionalValue2: "~"
  //optionalvalue2
};
class PageQR extends import_Page.Page {
  items;
  index = 0;
  constructor(config, options) {
    if (config.card !== "cardQR") {
      return;
    }
    super(config, options);
    if (options.config && options.config.card == "cardQR") {
      this.config = options.config;
    } else {
      throw new Error("Missing config!");
    }
    this.index = this.config.index;
    this.minUpdateInterval = 1e3;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.panel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.panel.statesControler.createDataItems(
      tempConfig,
      this
    );
    if (tempItem) {
      tempItem.card = "cardQR";
    }
    this.items = tempItem;
    await super.init();
  }
  /**
   *
   * @returns
   */
  async update() {
    var _a, _b;
    if (!this.visibility) {
      return;
    }
    const message = {};
    const config = this.adapter.config.pageQRdata[this.index];
    if (this.items && config != null) {
      const items = this.items;
      message.headline = this.library.getTranslation(
        (_b = (_a = items.data.headline && await items.data.headline.getString()) != null ? _a : config.headline) != null ? _b : ""
      );
      message.navigation = this.getNavigation();
      switch (config.selType) {
        case 0:
          this.log.debug(`qrType = FREE`);
          message.textQR = config.SSIDURLTEL;
          message.optionalValue1 = config.optionalText || "";
          break;
        case 1: {
          this.log.debug(`qrType = wifi`);
          let pass = "";
          switch (config.qrPass) {
            case 0:
              break;
            case 1:
              pass = this.adapter.config.pageQRpwd1 || "";
              break;
            case 2:
              pass = this.adapter.config.pageQRpwd2 || "";
              break;
            case 3:
              pass = this.adapter.config.pageQRpwd3 || "";
              break;
          }
          message.textQR = `WIFI:T:${config.wlantype};S:${config.SSIDURLTEL};P:${pass};${config.wlantype ? `H:${config.wlanhidden}` : ""};`;
          message.optionalValue1 = config.SSIDURLTEL;
          break;
        }
        case 2:
          this.log.debug(`qrType = url`);
          message.textQR = `${config.SSIDURLTEL}`;
          message.optionalValue1 = config.SSIDURLTEL;
          break;
        case 3:
          this.log.debug(`qrType = Telephone`);
          message.textQR = `TEL:${config.SSIDURLTEL}`;
          message.optionalValue1 = config.SSIDURLTEL;
          break;
        default:
          this.log.debug(`qrType = none`);
          this.sendToPanel(this.getMessage(message));
          return;
      }
      if (this.pageItems) {
        const pageItems = this.pageItems.filter((a) => a && a.dataItems);
        if (pageItems.length > 2) {
          this.log.warn(`Bad config -> too many page items`);
        }
        for (let a = 0; a < pageItems.length; a++) {
          const temp = pageItems[a];
          if (temp) {
            const arr = (await temp.getPageItemPayload()).split("~");
            this.log.debug(`0: ${arr[0]} 1: ${arr[1]} 2: ${arr[2]} 3: ${arr[3]} 4: ${arr[4]} 5: ${arr[5]}`);
            switch (a) {
              case 0:
                message.type1 = arr[0];
                message.displayName1 = arr[4];
                message.internalName1 = arr[1];
                message.iconId1 = arr[2];
                message.iconColor1 = arr[3];
                break;
              case 1:
                message.type2 = arr[0];
                message.displayName2 = arr[4];
                message.internalName2 = arr[1];
                message.iconId2 = arr[2];
                message.iconColor2 = arr[3];
                message.optionalValue2 = arr[0] == "switch" ? arr[5] : config.pwdhidden ? "" : arr[5];
                break;
              default:
                break;
            }
          }
        }
      }
    }
    if (message.textQR) {
      this.log.debug(message.textQR);
    }
    this.sendToPanel(this.getMessage(message));
  }
  static async getQRPageConfig(adapter, index, configManager) {
    const config = adapter.config.pageQRdata[index];
    if (config) {
      let text1 = "", text = "";
      switch (config.selType) {
        case 0:
          text1 = config.SSIDURLTEL;
          text = config.optionalText || "";
          break;
        case 1: {
          text1 = config.SSIDURLTEL;
          text = "SSID";
          break;
        }
        case 2:
          text1 = config.SSIDURLTEL;
          text = "URL";
          break;
        case 3:
          text1 = config.SSIDURLTEL;
          text = "TEL";
          break;
        default:
          break;
      }
      const stateExist = config.setState && await configManager.existsState(config.setState || "");
      const result = {
        uniqueID: config.pageName,
        alwaysOn: "none",
        config: {
          card: "cardQR",
          index,
          data: {
            headline: { type: "const", constVal: config.headline || "" }
          }
        },
        pageItems: []
      };
      result.pageItems.push({
        type: "text",
        dpInit: "",
        role: "button",
        data: {
          icon: {
            true: {
              value: {
                type: "const",
                constVal: "wifi"
              },
              color: await configManager.getIconColor(import_Color.Color.Cyan, configManager.colorOn)
            },
            false: {
              value: {
                type: "const",
                constVal: "wifi"
              },
              color: await configManager.getIconColor(configManager.colorOff)
            },
            scale: void 0,
            maxBri: void 0,
            minBri: void 0
          },
          text1: {
            true: { type: "const", constVal: text1 }
          },
          text: {
            true: { type: "const", constVal: text }
          },
          entity1: config.setState && await configManager.existsState(config.setState || "") ? {
            value: {
              type: "triggered",
              dp: config.setState
            }
          } : void 0
        }
      });
      switch (config.selType) {
        case 0:
          text1 = "";
          text = "";
          break;
        case 1: {
          switch (config.qrPass) {
            case 1:
              text1 = adapter.config.pageQRpwd1 || "";
              break;
            case 2:
              text1 = adapter.config.pageQRpwd2 || "";
              break;
            case 3:
              text1 = adapter.config.pageQRpwd3 || "";
              break;
            default:
              text1 = "";
              break;
          }
          text = "Password";
          break;
        }
        case 2:
          text1 = "";
          text = "";
          break;
        case 3:
          text1 = "";
          text = "";
          break;
        default:
          break;
      }
      if (config.setState && stateExist) {
        result.pageItems.push({
          type: "button",
          dpInit: "",
          role: "button",
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: "wifi"
                },
                color: await configManager.getIconColor(configManager.colorOn)
              },
              false: {
                value: {
                  type: "const",
                  constVal: "wifi-off"
                },
                color: await configManager.getIconColor(configManager.colorOff)
              },
              scale: void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: { type: "const", constVal: text1 }
            },
            text: {
              true: { type: "const", constVal: "WlanOn" },
              false: { type: "const", constVal: "WlanOff" }
            },
            entity1: {
              value: {
                type: "triggered",
                dp: config.setState
              },
              set: {
                type: "state",
                dp: config.setState
              }
            }
          }
        });
      } else {
        result.pageItems.push({
          type: "text",
          dpInit: "",
          role: "button",
          data: {
            icon: {
              true: {
                value: {
                  type: "const",
                  constVal: "key-wireless"
                },
                color: await configManager.getIconColor(configManager.colorOn)
              },
              false: {
                value: {
                  type: "const",
                  constVal: "key-wireless"
                },
                color: await configManager.getIconColor(configManager.colorOff)
              },
              scale: void 0,
              maxBri: void 0,
              minBri: void 0
            },
            text1: {
              true: { type: "const", constVal: text1 }
            },
            text: {
              true: { type: "const", constVal: text }
            },
            entity1: void 0
          }
        });
      }
      return result;
    }
    throw new Error("No config for cardQR found");
  }
  getMessage(_message) {
    let result = PageQRMessageDefault;
    result = Object.assign(result, _message);
    return (0, import_tools.getPayload)(
      "entityUpd",
      result.headline,
      result.navigation,
      result.textQR,
      result.type1,
      result.internalName1,
      result.iconId1,
      result.iconColor1,
      result.displayName1,
      result.optionalValue1,
      result.type2,
      result.internalName2,
      result.iconId2,
      result.iconColor2,
      result.displayName2,
      result.optionalValue2
    );
  }
  async onStateTrigger(_id) {
    this.adapter.setTimeout(() => this.update(), 50);
  }
  /**
   *a
   *
   * @param _event
   * @returns
   */
  async onButtonEvent(_event) {
    const button = _event.action;
    const value = _event.opt;
    if (!this.items || this.items.card !== "cardQR") {
      return;
    }
    this.log.debug(`action: ${button}, value: ${value}`);
    if (pages.isQRButtonEvent(button)) {
      if (this.adapter.config.pageQRdata[this.index]) {
        if (this.pageItems && this.pageItems[_event.id] && this.pageItems[_event.id].config && this.pageItems[_event.id].config.type == "button") {
          await this.pageItems[_event.id].onCommand("button", value);
        }
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageQR
});
//# sourceMappingURL=pageQR.js.map
