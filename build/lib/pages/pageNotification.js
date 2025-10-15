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
var pageNotification_exports = {};
__export(pageNotification_exports, {
  PageNotify: () => PageNotify,
  isCardNotify2DataItems: () => isCardNotify2DataItems,
  isCardNotifyDataItems: () => isCardNotifyDataItems
});
module.exports = __toCommonJS(pageNotification_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_tools = require("../const/tools");
var globals = __toESM(require("../types/function-and-const"));
class PageNotify extends import_Page.Page {
  config;
  lastpage = [];
  step = 0;
  headlinePos = 0;
  rotationTimeout;
  tempItem;
  items;
  constructor(config, options) {
    super(config, options);
    this.config = options.config;
    if (options.items && (isCardNotifyDataItems(options.items) || isCardNotify2DataItems(options.items))) {
      this.items = options.items;
    }
    this.minUpdateInterval = 1e3;
    this.neverDeactivateTrigger = true;
  }
  async init() {
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    (0, import_tools.setTriggeredToState)(tempConfig, ["entity1", "optionalValue"]);
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    this.items.card = this.card;
    await super.init();
    await this.basePanel.statesControler.activateTrigger(this);
  }
  setLastPage(p) {
    if (p !== this) {
      if (p !== void 0) {
        this.lastpage.push(p);
      } else {
        this.lastpage = [];
      }
    }
  }
  removeLastPage(_p) {
    this.lastpage = this.lastpage.filter((a) => a !== _p);
    this.lastpage.forEach((a) => a.removeLastPage(_p));
  }
  /**
   *
   * @returns Build the view for nspanel.
   */
  async update() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const message = {};
    const items = this.items;
    if (!items) {
      return;
    }
    this.log.debug("update notification page!");
    let value = null;
    if (isCardNotifyDataItems(items)) {
      const data = items.data;
      value = await (0, import_tools.getValueEntryNumber)(data.entity1);
      if (value === null) {
        value = (_a = await (0, import_tools.getValueEntryBoolean)(data.entity1)) != null ? _a : true;
      }
      message.headline = (_b = data.headline && await data.headline.getTranslatedString()) != null ? _b : "";
      message.hColor = await (0, import_tools.getIconEntryColor)(data.colorHeadline, value, import_Color.Color.White);
      message.blText = (_c = data.buttonLeft && await data.buttonLeft.getTranslatedString()) != null ? _c : "";
      message.blColor = await (0, import_tools.getIconEntryColor)(data.colorButtonLeft, value, import_Color.Color.White);
      message.brText = (_d = data.buttonRight && await data.buttonRight.getTranslatedString()) != null ? _d : "";
      message.brColor = await (0, import_tools.getIconEntryColor)(data.colorButtonRight, value, import_Color.Color.White);
      message.text = (_e = data.text && await data.text.getTranslatedString()) != null ? _e : "";
      message.textColor = await (0, import_tools.getIconEntryColor)(data.colorText, value, import_Color.Color.White);
      const placeholder = (_f = data.optionalValue && await data.optionalValue.getObject()) != null ? _f : null;
      if (placeholder && globals.isPlaceholderType(placeholder)) {
        for (const key in placeholder) {
          const target = placeholder[key];
          let val = (_g = target.dp && await this.basePanel.statesControler.getStateVal(target.dp)) != null ? _g : "";
          if (val === "") {
            val = (_h = target.text) != null ? _h : "";
          }
          message.headline = message.headline.replaceAll(
            `\${${key}}`,
            this.library.getTranslation(val)
          );
          message.text = message.text.replaceAll(`\${${key}}`, this.library.getTranslation(val));
        }
      }
      if (message.text) {
        message.text = message.text.replaceAll("\n", "\r\n").replaceAll("/r/n", "\r\n");
      }
      const maxLineCount = 8;
      let lines = 0;
      if (message.text && (lines = message.text.split("\r\n").length) > maxLineCount) {
        let test = 0;
        let counter = 0;
        let pos = 0;
        this.step = this.step % (lines + 1);
        const currentPos = this.step;
        const text = `${message.text}\r
\r
${message.text}`;
        message.text = "";
        while (test++ < 100) {
          const pos2 = text.indexOf("\r\n", pos) + 2;
          if (pos2 == -1) {
            message.text += text.slice(pos);
            break;
          }
          if (counter >= currentPos) {
            message.text = message.text + text.slice(pos, pos2);
          }
          counter++;
          if (counter >= currentPos + maxLineCount) {
            break;
          }
          pos = pos2;
        }
        if (!this.rotationTimeout) {
          if (this.unload || this.adapter.unload) {
            return;
          }
          this.rotationTimeout = this.adapter.setTimeout(this.rotation, 3e3);
        }
      }
      message.timeout = (_i = data.timeout && await data.timeout.getNumber()) != null ? _i : 0;
    }
    if (items.card === "popupNotify") {
      this.sendToPanel(this.getMessage(message), false);
      return;
    } else if (items.card === "popupNotify2") {
      const data = items.data;
      message.fontSet = (_j = data.textSize && await data.textSize.getString()) != null ? _j : "";
      message.icon = await (0, import_tools.getIconEntryValue)(data.icon, value, "");
      message.iconColor = await (0, import_tools.getIconEntryColor)(data.icon, value, import_Color.Color.White);
      this.sendToPanel(this.getMessage2(message), false);
      return;
    }
  }
  getMessage(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    return (0, import_tools.getPayloadRemoveTilde)(
      "entityUpdateDetail",
      this.id,
      (_a = message.headline) != null ? _a : "",
      (_b = message.hColor) != null ? _b : "",
      (_c = message.blText) != null ? _c : "",
      (_d = message.blColor) != null ? _d : "",
      (_e = message.brText) != null ? _e : "",
      (_f = message.brColor) != null ? _f : "",
      (_g = message.text) != null ? _g : "",
      (_h = message.textColor) != null ? _h : "",
      String((_i = message.timeout) != null ? _i : 0)
    );
  }
  getMessage2(message) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    return (0, import_tools.getPayloadRemoveTilde)(
      "entityUpdateDetail",
      this.id,
      (_a = message.headline) != null ? _a : "",
      (_b = message.hColor) != null ? _b : "",
      (_c = message.blText) != null ? _c : "",
      (_d = message.blColor) != null ? _d : "",
      (_e = message.brText) != null ? _e : "",
      (_f = message.brColor) != null ? _f : "",
      (_g = message.text) != null ? _g : "",
      (_h = message.textColor) != null ? _h : "",
      String((_i = message.timeout) != null ? _i : 0),
      (_j = message.fontSet) != null ? _j : "0",
      (_k = message.icon) != null ? _k : "",
      (_l = message.iconColor) != null ? _l : ""
    );
  }
  /**
   * Rotate text in view
   *
   * @returns void
   */
  rotation = async () => {
    if (!this.visibility) {
      this.rotationTimeout = void 0;
      return;
    }
    this.step++;
    await this.update();
    if (this.unload || this.adapter.unload) {
      return;
    }
    this.rotationTimeout = this.adapter.setTimeout(this.rotation, 1500);
  };
  async delete() {
    await super.delete();
    if (this.rotationTimeout) {
      this.adapter.clearTimeout(this.rotationTimeout);
    }
    this.rotationTimeout = void 0;
  }
  async onStateTrigger(_dp) {
    this.step = 0;
    if (this.rotationTimeout) {
      this.adapter.clearTimeout(this.rotationTimeout);
    }
    this.rotationTimeout = void 0;
    this.log.debug(`state triggerd ${_dp}`);
    await this.basePanel.setActivePage(this);
  }
  /**
   * Handle button events for the notify popup.
   *
   * Behavior:
   * - Only processes events when this page is a `popupNotify`.
   * - Reacts to `action === "notifyAction"`.
   *   - If `setValue2` exists: writes `true` to `setValue1` on "yes", otherwise to `setValue2`.
   *   - Else: writes boolean to `setValue1` based on `opt === "yes"`.
   * - Evaluates optional `closingBehaviour`:
   *   - "none"  → keep popup open
   *   - "both"  → close always
   *   - "yes" / "no" → close only if it matches `opt`
   * - When closing, returns to the last page (stack) or the current navigation page.
   *
   * Side effects:
   * - May write states via Dataitem setters.
   * - May change the active page on the panel.
   *
   * @param _event Incoming event from the panel (must contain `action`, may contain `opt`).
   * @returns Promise that resolves when the event has been handled.
   */
  async onButtonEvent(_event) {
    var _a;
    const data = this.items && this.items.card === "popupNotify" && this.items.data;
    let close = true;
    if (data) {
      if (_event.action === "notifyAction") {
        if (data.setValue2) {
          if (_event.opt === "yes") {
            data.setValue1 && await data.setValue1.setStateTrue();
          } else {
            data.setValue2 && await data.setValue2.setStateTrue();
          }
        } else {
          data.setValue1 && await data.setValue1.setState(_event.opt === "yes");
        }
        const cb = (_a = data.closingBehaviour && await data.closingBehaviour.getString()) != null ? _a : "";
        if (globals.isClosingBehavior(cb)) {
          switch (cb) {
            case "none":
              close = false;
              break;
            case "both":
              close = true;
              break;
            case "yes":
            case "no":
              close = cb == _event.opt;
              break;
          }
        }
      }
    }
    if (close) {
      if (this.name.includes("///popupNotification")) {
        this.lastpage = this.lastpage.filter((a) => !a.name.includes("///popupNotification"));
      }
      const p = this.lastpage.pop();
      if (p) {
        p.removeLastPage(this);
        this.log.debug(`Set active page from popup to ${p.name}`);
        await this.basePanel.setActivePage(p);
      } else {
        const page = this.basePanel.navigation.getCurrentPage();
        this.log.debug(`Set active page from currentpage to ${page.name}`);
        await this.basePanel.setActivePage(page);
      }
    }
  }
  async onVisibilityChange(val) {
    if (val) {
      if (!this.pageItems || this.pageItems.length === 0) {
        this.pageItems = await this.createPageItems(this.pageItemConfig);
      }
      this.sendType();
      await this.update();
    }
  }
}
function isCardNotifyDataItems(obj) {
  return obj && obj.card === "popupNotify";
}
function isCardNotify2DataItems(obj) {
  return obj && obj.card === "popupNotify2";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageNotify,
  isCardNotify2DataItems,
  isCardNotifyDataItems
});
//# sourceMappingURL=pageNotification.js.map
