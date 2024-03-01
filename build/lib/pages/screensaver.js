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
var tools = __toESM(require("../const/tools"));
var import_pageItem = require("./pageItem");
class Screensaver extends import_Page.Page {
  items;
  step = 0;
  blockButtons;
  headlinePos = 0;
  titelPos = 0;
  nextArrow = false;
  rotationTime = 3e5;
  timoutRotation = void 0;
  firstRun = true;
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
    this.neverDeactivateTrigger = true;
    this.rotationTime = options.config.rotationTime !== 0 && options.config.rotationTime < 3 ? 3e3 : options.config.rotationTime * 1e3;
  }
  async init() {
    await super.init();
  }
  async getData(places) {
    const config = this.config;
    if (!config || config.card !== "screensaver" && config.card !== "screensaver2")
      return null;
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
      const layout = config.mode;
      for (let a = 0; a < this.pageItems.length; a++) {
        const pageItems = this.pageItems[a];
        const options = message.options;
        if (pageItems && pageItems.config && pageItems.config.modeScr) {
          const place = pageItems.config.modeScr;
          const max = Definition.ScreenSaverConst[layout][place].maxEntries[model];
          if (max === 0)
            continue;
          if (places.indexOf(place) === -1)
            continue;
          const arr = options[place] || [];
          arr.push(await pageItems.getPageItemPayload());
          options[place] = arr;
        }
      }
      for (const x in message.options) {
        const place = x;
        if (places.indexOf(place) === -1)
          continue;
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
              const arr = items[i].split("~");
              arr[0] = "";
              if (place !== "indicator")
                arr[1] = "";
              items[i] = tools.getPayloadArray(arr);
            }
          }
        }
      }
    }
    return message;
  }
  async update() {
    if (this.firstRun) {
      this.HandleTime();
      this.HandleDate();
      this.firstRun = false;
    }
    if (!this.visibility) {
      this.log.error("get update command but not visible!");
      return;
    }
    const message = await this.getData(["left", "bottom", "indicator", "alternate", "favorit"]);
    if (message === null)
      return;
    if (message.options.alternate.length > 0)
      message.options.alternate.unshift(tools.getPayload("", "", "", "", "", ""));
    const arr = message.options.favorit.concat(
      message.options.left,
      message.options.bottom,
      message.options.alternate,
      message.options.indicator
    );
    const msg = tools.getPayload("weatherUpdate", tools.getPayloadArray(arr));
    this.sendToPanel(msg);
    this.HandleScreensaverStatusIcons();
  }
  async onVisibilityChange(v) {
    await super.onVisibilityChange(v);
    this.step = -1;
    if (v) {
      this.HandleTime();
      this.HandleDate();
      this.rotationLoop();
    } else {
      if (this.timoutRotation)
        this.adapter.clearTimeout(this.timoutRotation);
    }
  }
  rotationLoop = async () => {
    if (this.unload)
      return;
    if (!this.visibility)
      return;
    this.step++ > 100;
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
              this.HandleTime();
              break;
            }
            case "date": {
              this.HandleDate();
              break;
            }
          }
        }
      }
    }
  };
  async HandleTime() {
    const message = await this.getData(["time"]);
    if (message === null || !message.options.time[0])
      return;
    this.sendToPanel(`time~${message.options.time[0].split("~")[5]}`);
  }
  async HandleDate() {
    const message = await this.getData(["date"]);
    if (message === null || !message.options.date[0])
      return;
    this.sendToPanel(`date~${message.options.date[0].split("~")[5]}`);
  }
  async HandleScreensaverStatusIcons() {
    var _a, _b, _c, _d;
    if (!this.visibility) {
      this.log.error("get update command but not visible!");
      return;
    }
    const message = await this.getData(["mricon"]);
    if (message === null)
      return;
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
      if (this.blockButtons)
        return;
      this.pageItems[event.id].onCommand(event.action, event.opt);
      this.blockButtons = this.adapter.setTimeout(() => {
        this.blockButtons = void 0;
      }, 500);
    }
  }
  /*
          const payload: Partial<sendTemplates['statusUpdate']> = { eventType: 'statusUpdate' };
          const maxItems = Definition.ScreenSaverConst[this.layout]['mrIconEntity'].maxEntries;
          for (let i = 0; i < maxItems; i++) {
              const s: '1' | '2' = i == 0 ? '1' : '2';
              const item = this.items['mrIconEntity'][i];
              if (item === null || item === undefined) {
                  payload[`icon${s}`] = '';
                  payload[`icon${s}Color`] = '';
                  payload[`icon${s}Font`] = '';
                  continue;
              }
  
              let value: number | boolean | string | null = await tools.getValueEntryNumber(item.entityValue);
              if (value === null) value = await tools.getValueEntryString(item.entityValue);
              if (value === null) value = await tools.getValueEntryBoolean(item.entityValue);
  
              if (value === null) {
                  payload[`icon${s}`] = '';
                  payload[`icon${s}Color`] = '';
                  payload[`icon${s}Font`] = '';
                  continue;
              }
  
              const entity =
                  item.entityValue && item.entityValue.value
                      ? item.entityValue.value.type == 'string'
                          ? await item.entityValue.value.getString()
                          : await item.entityValue.value.getBoolean()
                      : null;
              const offcolor =
                  item.entityIcon && item.entityIcon.false && item.entityIcon.false.color
                      ? await item.entityIcon.false.color.getRGBDec()
                      : String(Color.rgb_dec565(Color.White));
              const onColor =
                  item.entityIcon && item.entityIcon.true && item.entityIcon.true.color
                      ? await item.entityIcon.true.color.getRGBDec()
                      : null;
              payload[`icon${s}Color`] = offcolor !== null ? offcolor : String(Color.rgb_dec565(Color.White));
              if (item.entityValue != null || value !== null || onColor != null) {
                  // Prüfung ob Entity vom Typ String ist
                  if (entity != null && onColor) {
                      if (typeof entity == 'string') {
                          switch (entity.toUpperCase()) {
                              case 'ON':
                              case 'OK':
                              case 'AN':
                              case 'YES':
                              case 'TRUE':
                              case 'ONLINE':
                                  payload[`icon${s}Color`] = onColor;
                                  break;
                              default:
                          }
                          // Alles was kein String ist in Boolean umwandeln
                      } else {
                          if (entity) {
                              payload[`icon${s}Color`] = onColor;
                          }
                      }
                  }
                  const entityIconSelect: any | null = item.entityIconSelect
                      ? await item.entityIconSelect.getObject()
                      : null;
  
                  // Icon ermitteln
                  const onIcon =
                      item.entityIcon && item.entityIcon.true && item.entityIcon.true.value
                          ? await item.entityIcon.true.value.getString()
                          : null;
                  const offIcon =
                      item.entityIcon && item.entityIcon.false && item.entityIcon.false.value
                          ? await item.entityIcon.false.value.getString()
                          : null;
                  const selectIcon =
                      typeof entity !== 'boolean' && entity !== null && entityIconSelect
                          ? (entityIconSelect[entity] as string | undefined)
                          : undefined;
  
                  if (selectIcon) {
                      payload[`icon${s}`] = Icons.GetIcon(selectIcon);
                      this.log.debug('SelectIcon: ' + JSON.stringify(payload), 'info');
                  } else if (entity && onIcon) {
                      payload[`icon${s}`] = Icons.GetIcon(onIcon);
                      this.log.debug('Icon if true ' + JSON.stringify(payload), 'info');
                  } else {
                      if (offIcon) {
                          payload[`icon${s}`] = Icons.GetIcon(offIcon);
                          this.log.debug('Icon1 else true ' + JSON.stringify(payload), 'info');
                      } else if (onIcon) {
                          payload[`icon${s}`] = Icons.GetIcon(onIcon);
                          this.log.debug('Icon1 else false ' + JSON.stringify(payload), 'info');
                      }
                  }
  
                  if (value !== null && value !== undefined) {
                      payload[`icon${s}`] += typeof value === 'string' ? value : '';
                      const unit =
                          item.entityValue && item.entityValue.unit ? await item.entityValue.unit.getString() : null;
                      if (unit !== null) payload[`icon${s}`] += unit;
                  }
              } else {
                  payload[`icon${s}Color`] = String(Color.rgb_dec565(Color.Black));
              }
              payload[`icon${s}Font`] = this.config2[`iconBig${s}`] ? '1' : '';
          }
          this.sendStatusUpdate(payload as sendTemplates['statusUpdate'], this.layout);
      }*/
  async delete() {
    await super.delete();
    if (this.timoutRotation)
      this.adapter.clearTimeout(this.timoutRotation);
    if (this.blockButtons)
      this.adapter.clearTimeout(this.blockButtons);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Screensaver
});
//# sourceMappingURL=screensaver.js.map
