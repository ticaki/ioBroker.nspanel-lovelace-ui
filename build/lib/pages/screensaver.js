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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var screensaver_exports = {};
__export(screensaver_exports, {
  Screensaver: () => Screensaver
});
module.exports = __toCommonJS(screensaver_exports);
var Definition = __toESM(require("../const/definition"));
var import_msg_def = require("../types/msg-def");
var import_Page = require("../classes/Page");
var tools = __toESM(require("../const/tools"));
var import_pageItem = require("./pageItem");
class Screensaver extends import_Page.Page {
  items;
  step = 0;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  rotationTime = 3e5;
  timoutRotation = void 0;
  constructor(config, options) {
    if (!options.config || options.config.card !== "screensaver" && options.config.card !== "screensaver2")
      return;
    switch (options.config.mode) {
      case "standard":
      case "alternate": {
        config.card = "screensaver";
        break;
      }
      case "advanced": {
        config.card = "screensaver2";
        break;
      }
    }
    config.alwaysOn = "none";
    super(config, options);
    this.rotationTime = options.config.rotationTime !== 0 && options.config.rotationTime < 3 ? 3e3 : options.config.rotationTime * 1e3;
  }
  async init() {
    await super.init();
  }
  async update() {
    var _a;
    if (!this.visibility) {
      this.log.error("get update command but not visible!");
      return;
    }
    const config = this.config;
    if (!config || config.card !== "screensaver" && config.card !== "screensaver2")
      return;
    const message = {
      event: "weatherUpdate",
      options: {
        indicator: [],
        left: [],
        time: [],
        date: [],
        bottom: [],
        mricon: [],
        favorit: [],
        alternate: []
      }
    };
    if (this.pageItems) {
      const model = config.model;
      const layout = config.mode;
      for (let a = 0; a < this.pageItems.length; a++) {
        const pageItems = this.pageItems[a];
        const options = message.options;
        if (pageItems && pageItems.config && pageItems.config.modeScr) {
          const place = pageItems.config.modeScr;
          const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
          if (max === 0)
            continue;
          if (place === "time" || place === "date" || place === "mricon")
            continue;
          if (Definition.ScreenSaverConst[layout][place].maxEntries[model] > ((_a = options[place] && options[place].length) != null ? _a : 0)) {
            const arr2 = options[place] || [];
            arr2.push(await pageItems.getPageItemPayload());
            options[place] = arr2;
          }
        }
      }
      for (const x in message.options) {
        const place = x;
        let items = message.options[place];
        if (items) {
          const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
          if (items.length > Definition.ScreenSaverConst[layout][place].maxEntries[model]) {
            let f = items.length / Definition.ScreenSaverConst[layout][place].maxEntries[model];
            f = this.step % Math.ceil(f);
            items = items.slice(max * f, max * (f + 1) - 1);
          }
          for (let i = 0; i < max; i++) {
            const msg2 = items[i];
            if (!msg2) {
              items[i] = tools.getPayload("", "", "", "", "", "");
            } else {
              const arr2 = items[i].split("~");
              arr2[0] = "";
              arr2[1] = "";
              items[i] = tools.getPayloadArray(arr2);
            }
          }
        }
      }
      if (message.options.alternate.length > 0)
        message.options.alternate.unshift(tools.getPayload("", "", "", "", "", ""));
      const arr = message.options.favorit.concat(
        message.options.left,
        message.options.bottom,
        message.options.alternate,
        message.options.indicator
      );
      const msg = tools.getPayload(message.event, tools.getPayloadArray(arr));
      this.sendToPanel(msg);
      this.HandleScreensaverStatusIcons();
    }
  }
  sendStatusUpdate(payload, layout) {
    switch (payload.eventType) {
      case "statusUpdate":
        this.sendToPanel(
          tools.getPayload(
            payload.eventType,
            payload.icon1,
            payload.icon1Color,
            payload.icon2,
            payload.icon2Color,
            payload.icon1Font,
            payload.icon2Font,
            ""
          )
        );
        break;
      case "weatherUpdate": {
        let value = payload.value[layout];
        if (!value)
          return;
        const result = [payload.eventType];
        const check = import_msg_def.weatherUpdateTestArray[layout];
        value = value.filter((item, pos) => check[pos]);
        value.forEach((item, pos) => {
          const test = check[pos];
          if (item.icon && !test.icon)
            item.icon = "";
          if (item.iconColor && !test.iconColor)
            item.iconColor = "";
          if (item.displayName && (!("displayName" in test) || !test.displayName))
            item.displayName = "";
          if (item.optionalValue && !test.icon)
            item.icon = "";
        });
        value.forEach(
          (a) => a && result.push(
            tools.getPayload(
              "",
              "",
              a.icon,
              a.iconColor,
              "displayName" in a ? a.displayName : "",
              a.optionalValue
            )
          )
        );
        this.sendToPanel(tools.getPayloadArray([...result, ""]));
        break;
      }
    }
  }
  async onVisibilityChange(v) {
    this.step = -1;
    if (v) {
      this.rotationLoop();
    } else {
      if (this.timoutRotation)
        this.adapter.clearTimeout(this.timoutRotation);
    }
    await super.onVisibilityChange(v);
  }
  rotationLoop = async () => {
    if (this.unload)
      return;
    if (!this.visibility)
      return;
    if (this.step > 100)
      this.step = 0;
    await this.update();
    if (this.rotationTime === 0)
      return;
    this.timoutRotation = this.adapter.setTimeout(
      this.rotationLoop,
      this.rotationTime < 3e3 ? 3e3 : this.rotationTime
    );
  };
  onStateTrigger = async (from) => {
    const config = this.config;
    if (!config || config.card !== "screensaver" && config.card !== "screensaver2")
      return;
    if (from instanceof import_pageItem.PageItem && this.pageItems) {
      const index = parseInt(from.id.split("?")[1]);
      const item = this.pageItems[index];
      if (item && item.config) {
        const place = item.config.modeScr;
        if (place !== void 0) {
          switch (place) {
            case "left":
            case "bottom":
            case "indicator":
            case "alternate":
            case "favorit": {
              this.update();
              break;
            }
            case "mricon": {
              this.HandleScreensaverStatusIcons();
              break;
            }
            case "time": {
              break;
            }
            case "date": {
              break;
            }
          }
        }
      }
    }
  };
  async HandleScreensaverStatusIcons() {
    var _a, _b, _c, _d, _e, _f, _g;
    {
      if (!this.visibility) {
        this.log.error("get update command but not visible!");
        return;
      }
      const config = this.config;
      if (!config || config.card !== "screensaver" && config.card !== "screensaver2")
        return;
      const message = {
        event: "weatherUpdate",
        options: {
          indicator: [],
          left: [],
          time: [],
          date: [],
          bottom: [],
          mricon: [],
          favorit: [],
          alternate: []
        }
      };
      if (this.pageItems) {
        const model = config.model;
        const layout = config.mode;
        for (let a = 0; a < this.pageItems.length; a++) {
          const pageItems = this.pageItems[a];
          const options = message.options;
          if (pageItems && pageItems.config && pageItems.config.modeScr) {
            const place = pageItems.config.modeScr;
            const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
            if (max === 0)
              continue;
            if (place !== "mricon")
              continue;
            if (Definition.ScreenSaverConst[layout][place].maxEntries[model] > ((_a = options[place] && options[place].length) != null ? _a : 0)) {
              const arr = options[place] || [];
              arr.push(await pageItems.getPageItemPayload());
              options[place] = arr;
            }
          }
        }
        for (const x in message.options) {
          const place = x;
          let items = message.options[place];
          if (items) {
            const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
            if (items.length > Definition.ScreenSaverConst[layout][place].maxEntries[model]) {
              let f = items.length / Definition.ScreenSaverConst[layout][place].maxEntries[model];
              f = this.step % Math.ceil(f);
              items = items.slice(max * f, max * (f + 1) - 1);
            }
            for (let i = 0; i < max; i++) {
              const msg2 = items[i];
              if (!msg2) {
                items[i] = tools.getPayload("", "", "", "", "", "");
              }
            }
          }
        }
        const mrIcon1 = message.options.mricon[0].split("~");
        const mrIcon2 = message.options.mricon[1].split("~");
        const msgArray = [
          "statusUpdate",
          (_b = mrIcon1[2]) != null ? _b : "",
          (_c = mrIcon1[3]) != null ? _c : "",
          (_d = mrIcon2[2]) != null ? _d : "",
          (_e = mrIcon2[3]) != null ? _e : "",
          (_f = mrIcon1[5]) != null ? _f : "",
          (_g = mrIcon2[5]) != null ? _g : ""
        ];
        const msg = tools.getPayloadArray(msgArray);
        this.sendToPanel(msg);
      }
    }
  }
  async delete() {
    await super.delete();
    if (this.timoutRotation)
      this.adapter.clearTimeout(this.timoutRotation);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver
});
//# sourceMappingURL=screensaver.js.map
