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
var screensaver_exports = {};
__export(screensaver_exports, {
  Screensaver: () => Screensaver
});
module.exports = __toCommonJS(screensaver_exports);
var Definition = __toESM(require("../const/definition"));
var import_Page = require("../classes/Page");
var pages = __toESM(require("../types/pages"));
var tools = __toESM(require("../const/tools"));
var import_pageItem = require("./pageItem");
class Screensaver extends import_Page.Page {
  items;
  step = 0;
  blockButtons;
  rotationTime = 3e5;
  timoutRotation = void 0;
  //readonly mode: Types.ScreensaverModeType = 'standard';
  constructor(config, options) {
    if (!options.config || options.config.card !== "screensaver" && options.config.card !== "screensaver2" && options.config.card !== "screensaver3") {
      config.adapter.log.error(
        `Invalid card for screensaver: ${options ? JSON.stringify(options) : "undefined"}`
      );
      return;
    }
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
      case "easyview": {
        config.card = "screensaver3";
        break;
      }
    }
    config.alwaysOn = "none";
    super(config, options);
    this.rotationTime = options.config.rotationTime !== 0 && options.config.rotationTime < 3 ? 3e3 : options.config.rotationTime * 1e3;
    this.neverDeactivateTrigger = true;
  }
  async init() {
    await super.init();
    await this.createPageItems();
    if (this.pageItems) {
      const indicators = this.pageItems.filter((x) => x && x.config && x.config.modeScr === "indicator");
      for (let a = 0; a < indicators.length; a++) {
        await this.library.writedp(
          `panels.${this.panel.name}.buttons.indicator-${a + 1}`,
          void 0,
          Definition.genericStateObjects.panel.panels.buttons.indicator
        );
      }
    }
  }
  async getData(places) {
    const config = this.config;
    if (!config || config.card !== "screensaver" && config.card !== "screensaver2" && config.card !== "screensaver3") {
      return null;
    }
    if (!pages.isScreenSaverCardType(config.card)) {
      pages.exhaustiveCheck(config.card);
      this.log.error(`Invalid card: ${config.card}`);
    }
    const message = {
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
      const layout = this.mode;
      for (let a = 0; a < this.pageItems.length; a++) {
        const pageItems = this.pageItems[a];
        const options = message.options;
        if (pageItems && pageItems.config && pageItems.config.modeScr) {
          if (pageItems.config.modeScr === "alternate" && this.mode !== "alternate") {
            continue;
          }
          const place = pageItems.config.modeScr;
          const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
          if (max === 0) {
            continue;
          }
          if (places.indexOf(place) === -1) {
            continue;
          }
          const arr = options[place] || [];
          arr.push(await pageItems.getPageItemPayload());
          options[place] = arr;
        }
      }
      for (const x in message.options) {
        const place = x;
        if (places.indexOf(place) === -1) {
          continue;
        }
        let items = message.options[place];
        if (items) {
          const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
          if (items.length > Definition.ScreenSaverConst[layout][place].maxEntries[model]) {
            let f = items.length / Definition.ScreenSaverConst[layout][place].maxEntries[model];
            f = this.step % Math.ceil(f);
            message.options[place] = items.slice(max * f, max * (f + 1));
          }
          items = message.options[place];
          for (let i = 0; i < max; i++) {
            const msg = items[i];
            if (!msg) {
              items[i] = tools.getPayload("", "", "", "", "", "");
            } else {
              let arr = items[i].split("~");
              arr[0] = "";
              if (place !== "indicator") {
                arr[1] = "";
              }
              arr = arr.map((a) => a.slice(0, 10));
              items[i] = tools.getPayloadArray(arr);
            }
          }
        }
      }
    }
    return message;
  }
  async update() {
    if (!this.visibility) {
      return;
    }
    const message = await this.getData(["left", "bottom", "indicator", "alternate", "favorit"]);
    if (message === null) {
      return;
    }
    if (message.options.alternate.length > 0) {
      message.options.alternate.unshift(tools.getPayload("", "", "", "", "", ""));
    }
    const arr = message.options.favorit.concat(
      message.options.left,
      message.options.bottom,
      message.options.alternate,
      message.options.indicator
    );
    const msg = tools.getPayload("weatherUpdate", tools.getPayloadArray(arr));
    this.sendToPanel(msg);
    await this.HandleScreensaverStatusIcons();
  }
  async onVisibilityChange(v) {
    this.step = -1;
    if (v) {
      this.sendType();
      await this.rotationLoop();
    } else {
      if (this.timoutRotation) {
        this.adapter.clearTimeout(this.timoutRotation);
      }
    }
  }
  rotationLoop = async () => {
    if (this.unload) {
      return;
    }
    if (!this.visibility) {
      return;
    }
    this.step++ > 100;
    await this.update();
    if (this.rotationTime === 0) {
      return;
    }
    this.timoutRotation = this.adapter.setTimeout(
      this.rotationLoop,
      this.rotationTime < 3e3 ? 3e3 : this.rotationTime
    );
  };
  /**
   * ..
   *
   * @param _dp
   * @param from
   * @returns
   */
  onStateTrigger = async (_dp, from) => {
    const config = this.config;
    if (!config || config.card !== "screensaver" && config.card !== "screensaver2") {
      return;
    }
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
              await this.update();
              break;
            }
            case "mricon": {
              await this.HandleScreensaverStatusIcons();
              break;
            }
            case "time": {
              await this.HandleTime();
              break;
            }
            case "date": {
              await this.HandleDate();
              break;
            }
          }
        }
      }
    }
  };
  async HandleTime() {
    const message = await this.getData(["time"]);
    if (message === null || !message.options.time[0]) {
      return;
    }
    this.sendToPanel(`time~${message.options.time[0].split("~")[5]}`);
  }
  async HandleDate() {
    const message = await this.getData(["date"]);
    if (message === null || !message.options.date[0]) {
      return;
    }
    this.sendToPanel(`date~${message.options.date[0].split("~")[5]}`);
  }
  async HandleScreensaverStatusIcons() {
    var _a, _b, _c, _d;
    if (!this.visibility) {
      this.log.error("get update command but not visible!");
      return;
    }
    const message = await this.getData(["mricon"]);
    if (message === null) {
      return;
    }
    const mrIcon1 = message.options.mricon[0].split("~");
    const mrIcon2 = message.options.mricon[1].split("~");
    const msgArray = [
      "statusUpdate",
      (_a = mrIcon1[2]) != null ? _a : "",
      (_b = mrIcon1[3]) != null ? _b : "",
      (_c = mrIcon2[2]) != null ? _c : "",
      (_d = mrIcon2[3]) != null ? _d : "",
      this.panel.info.nspanel.bigIconLeft ? "1" : "",
      this.panel.info.nspanel.bigIconRight ? "1" : ""
    ];
    const msg = tools.getPayloadArray(msgArray);
    this.sendToPanel(msg);
  }
  async onButtonEvent(event) {
    if (event.page && event.id && this.pageItems && this.pageItems[event.id]) {
      if (this.blockButtons) {
        return;
      }
      const indicators = this.pageItems.filter((x) => x && x.config && x.config.modeScr === "indicator");
      for (let a = 0; a < indicators.length; a++) {
        if (indicators[a] === this.pageItems[event.id]) {
          await this.library.writedp(
            `panels.${this.panel.name}.buttons.indicator-${a + 1}`,
            true,
            Definition.genericStateObjects.panel.panels.buttons.indicator
          );
        }
      }
      await this.pageItems[event.id].onCommand(event.action, event.opt);
      this.blockButtons = this.adapter.setTimeout(() => {
        this.blockButtons = void 0;
      }, 500);
    }
  }
  async delete() {
    await super.delete();
    if (this.timoutRotation) {
      this.adapter.clearTimeout(this.timoutRotation);
    }
    if (this.blockButtons) {
      this.adapter.clearTimeout(this.blockButtons);
    }
  }
  goLeft() {
  }
  goRight() {
  }
  get mode() {
    if (!this.config || this.config.card !== "screensaver" && this.config.card !== "screensaver2" && this.config.card !== "screensaver3") {
      return "standard";
    }
    return this.config.mode;
  }
  set mode(mode) {
    if (!this.config || this.config.card !== "screensaver" && this.config.card !== "screensaver2" && this.config.card !== "screensaver3") {
      return;
    }
    if (pages.isScreenSaverMode(mode)) {
      this.config.mode = mode;
    } else {
      pages.exhaustiveCheck(mode);
      this.log.error(`Invalid mode: ${mode}`);
    }
  }
  overwriteModel(mode, init = false) {
    if (mode === this.mode) {
      return;
    }
    switch (mode) {
      case "standard":
      case "alternate": {
        this.card = "screensaver";
        if (this.config) {
          this.config.card = "screensaver";
        }
        break;
      }
      case "advanced": {
        this.card = "screensaver2";
        if (this.config) {
          this.config.card = "screensaver2";
        }
        break;
      }
      case "easyview": {
        this.card = "screensaver3";
        if (this.config) {
          this.config.card = "screensaver3";
        }
        break;
      }
      default: {
        this.log.error(`Invalid mode: ${mode}`);
        return;
      }
    }
    this.mode = mode;
    if (!init) {
      this.sendType();
      void this.update();
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver
});
//# sourceMappingURL=screensaver.js.map
