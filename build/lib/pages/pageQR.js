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
var globals = __toESM(require("../types/function-and-const"));
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
  constructor(config, options) {
    super(config, options);
    if (options.config && options.config.card == "cardQR") {
      this.config = options.config;
    } else {
      throw new Error("Missing config!");
    }
    this.minUpdateInterval = 1e3;
  }
  async init() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const config = structuredClone(this.config);
    if (!((config == null ? void 0 : config.card) === "cardQR" && config.data)) {
      throw new Error("PageQR: invalid configuration");
    }
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = "cardQR";
    await ((_a = this.items.data.setState) == null ? void 0 : _a.delete());
    delete this.items.data.setState;
    const selType = (_c = await ((_b = this.items.data.selType) == null ? void 0 : _b.getNumber())) != null ? _c : 0;
    const ssidurltel = (_e = await ((_d = this.items.data.ssidUrlTel) == null ? void 0 : _d.getString())) != null ? _e : "";
    const password = (_g = await ((_f = this.items.data.password) == null ? void 0 : _f.getString())) != null ? _g : "";
    let text1 = "";
    let text = "";
    let icon1 = "";
    let icon2 = "";
    switch (selType) {
      case 0:
        text1 = ssidurltel;
        text = "";
        icon1 = "qrcode-scan";
        icon2 = "";
        break;
      case 1:
        text1 = ssidurltel;
        text = "SSID";
        icon1 = "wifi";
        icon2 = "key-wireless";
        break;
      case 2:
        text1 = ssidurltel;
        text = "URL / Website";
        icon1 = "web";
        icon2 = "";
        break;
      case 3:
        text1 = ssidurltel;
        text = "Telephone";
        icon1 = "phone";
        icon2 = "";
        break;
      default:
        break;
    }
    this.pageItemConfig = [];
    this.pageItemConfig.push({
      type: "text",
      role: "button",
      data: {
        icon: {
          true: {
            value: { type: "const", constVal: icon1 },
            color: { type: "const", constVal: import_Color.Color.on }
          },
          false: {
            value: { type: "const", constVal: icon1 },
            color: { type: "const", constVal: import_Color.Color.off }
          }
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
    let text1Second = "";
    let textSecond = "";
    if (selType == 1) {
      text1Second = password;
      textSecond = "Password";
    }
    if ((_h = config.data) == null ? void 0 : _h.setState) {
      this.pageItemConfig.push({
        type: "button",
        role: "button",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: "wifi" },
              color: { type: "const", constVal: import_Color.Color.Green }
            },
            false: {
              value: { type: "const", constVal: "wifi-off" },
              color: { type: "const", constVal: import_Color.Color.off }
            }
          },
          text1: {
            true: { type: "const", constVal: text1Second }
          },
          text: {
            true: { type: "const", constVal: "WlanOn" },
            false: { type: "const", constVal: "WlanOff" }
          },
          entity1: {
            value: config.data.setState
          }
        }
      });
    } else {
      this.pageItemConfig.push({
        type: "text",
        role: "button",
        data: {
          icon: {
            true: {
              value: { type: "const", constVal: icon2 },
              color: { type: "const", constVal: import_Color.Color.on }
            },
            false: {
              value: { type: "const", constVal: icon2 },
              color: { type: "const", constVal: import_Color.Color.off }
            }
          },
          text1: {
            true: { type: "const", constVal: text1Second }
          },
          text: {
            true: { type: "const", constVal: textSecond }
          },
          entity1: void 0
        }
      });
    }
    await super.init();
  }
  /**
   *
   * @returns //Rücksprung
   */
  async update() {
    var _a, _b, _c, _d, _e, _f, _g;
    if (!this.visibility) {
      return;
    }
    await super.update();
    const message = {};
    if (this.items && this.items.card === "cardQR") {
      const items = this.items;
      message.headline = this.library.getTranslation(
        (_a = items.data.headline && await items.data.headline.getString()) != null ? _a : "QR Code Page"
      );
      message.navigation = this.getNavigation();
      const selType = await ((_b = items.data.selType) == null ? void 0 : _b.getNumber()) || 0;
      const ssidurltel = await ((_c = items.data.ssidUrlTel) == null ? void 0 : _c.getString()) || "";
      const password = await ((_d = items.data.password) == null ? void 0 : _d.getString()) || "";
      const pwdhidden = await ((_e = items.data.pwdhidden) == null ? void 0 : _e.getBoolean()) || false;
      const wlantype = await ((_f = items.data.wlantype) == null ? void 0 : _f.getString()) || "WPA";
      const wlanhidden = await ((_g = items.data.wlanhidden) == null ? void 0 : _g.getBoolean()) || false;
      switch (selType) {
        case 0:
          this.log.debug(`qrType = FREE`);
          message.textQR = ssidurltel;
          message.optionalValue1 = "";
          break;
        case 1: {
          this.log.debug(`qrType = wifi`);
          const pass = password;
          message.textQR = `WIFI:T:${wlantype};S:${ssidurltel};P:${pass};${wlanhidden ? `H:${wlanhidden}` : `H:`};`;
          message.optionalValue1 = ssidurltel;
          break;
        }
        case 2:
          this.log.debug(`qrType = url`);
          message.textQR = `URL:${ssidurltel}`;
          message.optionalValue1 = ssidurltel;
          break;
        case 3:
          this.log.debug(`qrType = Telephone`);
          message.textQR = `TEL:${ssidurltel}`;
          message.optionalValue1 = ssidurltel;
          break;
        default:
          this.log.debug(`qrType = none`);
          this.sendToPanel(this.getMessage(message), false);
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
                message.type2 = arr[0] == "button" ? "switch" : "text";
                message.displayName2 = arr[4];
                message.internalName2 = arr[1];
                message.iconId2 = arr[2];
                message.iconColor2 = arr[3];
                message.optionalValue2 = arr[0] == "button" ? arr[5] : pwdhidden ? "" : arr[5];
                break;
              default:
                break;
            }
          }
        }
      }
    }
    if (message.textQR) {
      this.log.debug(`textQR: ${message.textQR}`);
    }
    this.sendToPanel(this.getMessage(message), false);
  }
  getMessage(_message) {
    let result = PageQRMessageDefault;
    result = { ...result, ..._message };
    return (0, import_tools.getPayload)(
      (0, import_tools.getPayloadRemoveTilde)("entityUpd", result.headline),
      result.navigation,
      (0, import_tools.getPayloadRemoveTilde)(
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
      )
    );
  }
  async onStateTrigger(_id) {
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.adapter.setTimeout(() => this.update(), 50);
  }
  /**
   *a
   *
   * @param _event //ButtonEvent z.B. bExit, buttonpress2
   * @returns //Rücksprung
   */
  async onButtonEvent(_event) {
    const button = _event.action;
    const value = _event.opt;
    if (!this.items || this.items.card !== "cardQR") {
      return;
    }
    this.log.debug(`action: ${button}, value: ${value}`);
    if (globals.isQRButtonEvent(button)) {
      if (this.pageItems && this.pageItems[_event.id] && this.pageItems[_event.id].config && this.pageItems[_event.id].config.type == "button") {
        await this.pageItems[_event.id].onCommand("switch", value);
      }
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageQR
});
//# sourceMappingURL=pageQR.js.map
