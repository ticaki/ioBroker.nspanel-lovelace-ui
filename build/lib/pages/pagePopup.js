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
var pagePopup_exports = {};
__export(pagePopup_exports, {
  PagePopup: () => PagePopup,
  isCardPopupDataItems: () => isCardPopupDataItems
});
module.exports = __toCommonJS(pagePopup_exports);
var import_Page = require("../classes/Page");
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
class PagePopup extends import_Page.Page {
  config;
  lastpage = [];
  step = 0;
  rotationTimeout;
  detailsArray = [];
  reminderTimeout;
  debouceUpdateTimeout;
  tempItem;
  items;
  constructor(config, options) {
    super(config, options);
    this.config = options.config;
    if (options.items && isCardPopupDataItems(options.items)) {
      this.items = options.items;
    }
    this.minUpdateInterval = 0;
    this.neverDeactivateTrigger = true;
  }
  async init() {
    var _a;
    const config = structuredClone(this.config);
    const tempConfig = this.enums || this.dpInit ? await this.basePanel.statesControler.getDataItemsFromAuto(this.dpInit, config, void 0, this.enums) : config;
    (0, import_tools.setTriggeredToState)(tempConfig, ["entity1", "optionalValue"]);
    const tempItem = await this.basePanel.statesControler.createDataItems(
      tempConfig,
      this
    );
    this.items = tempItem;
    if (!((_a = this.items) == null ? void 0 : _a.data)) {
      throw new Error(`PopupNotification page ${this.name} has no data items configured`);
    }
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
    var _a;
    const message = {};
    const items = this.items;
    if (!items) {
      return;
    }
    const details = this.detailsArray[0];
    if (!details) {
      this.detailsArray = [];
      const page = this.getLastPage();
      if (page) {
        await this.basePanel.setActivePage(page);
        this.removeLastPage(page);
      }
      return;
    }
    const convertToDec = (rgb, def) => {
      return String(rgb ? import_Color.Color.rgb_dec565(rgb) : def ? import_Color.Color.rgb_dec565(def) : "");
    };
    this.log.debug("update notification page!");
    message.headline = details.headline;
    message.hColor = convertToDec(details.colorHeadline, import_Color.Color.Yellow);
    message.blText = details.buttonLeft;
    message.blColor = details.buttonLeft ? convertToDec(details.colorButtonLeft, import_Color.Color.Red) : "";
    message.brText = details.buttonRight;
    message.brColor = details.buttonRight ? convertToDec(details.colorButtonRight, import_Color.Color.Green) : "";
    message.text = details.text;
    message.textColor = convertToDec(details.colorText, import_Color.Color.White);
    message.timeout = details.alwaysOn ? 0 : this.basePanel.timeout;
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
    message.fontSet = (_a = details.textSize) != null ? _a : "";
    if (!import_icon_mapping.Icons.GetIcon(this.detailsArray[0].icon || "")) {
      this.sendToPanel(this.getMessage(message), false);
      return;
    }
    message.icon = import_icon_mapping.Icons.GetIcon(details.icon || "");
    message.iconColor = convertToDec(details.iconColor, import_Color.Color.White);
    this.sendToPanel(this.getMessage2(message), false);
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
    if (this.reminderTimeout) {
      this.adapter.clearTimeout(this.reminderTimeout);
    }
    this.reminderTimeout = void 0;
    if (this.debouceUpdateTimeout) {
      this.adapter.clearTimeout(this.debouceUpdateTimeout);
    }
    this.debouceUpdateTimeout = void 0;
  }
  async onStateTrigger(_dp) {
    var _a, _b, _c, _d;
    if (!((_b = (_a = this.items) == null ? void 0 : _a.data.details) == null ? void 0 : _b.options.dp) || !_dp.endsWith(this.items.data.details.options.dp)) {
      return;
    }
    this.step = 0;
    if (this.rotationTimeout) {
      this.adapter.clearTimeout(this.rotationTimeout);
    }
    this.rotationTimeout = void 0;
    this.log.debug(`state triggerd ${_dp}`);
    const detailsArr = await ((_d = (_c = this.items) == null ? void 0 : _c.data.details) == null ? void 0 : _d.getObject());
    if (detailsArr && Array.isArray(detailsArr)) {
      this.detailsArray = [];
    }
    for (const details of Array.isArray(detailsArr) ? detailsArr : detailsArr ? [detailsArr] : []) {
      if (details) {
        const index = this.detailsArray.findIndex((d) => d.id === details.id);
        if (details.id && (details.priority == void 0 || details.priority <= 0)) {
          this.detailsArray = this.detailsArray.filter((d) => d.id !== details.id);
          this.log.debug(`remove notification id ${details.id}`);
          if (this.detailsArray.length > 0) {
            if (!this.reminderTimeout) {
              this.debouceUpdate();
            }
            return;
          }
          details.id = "";
        }
        if (!details.id) {
          this.log.debug("clear all notifications");
          if (this.reminderTimeout) {
            this.adapter.clearTimeout(this.reminderTimeout);
          }
          this.reminderTimeout = void 0;
          this.detailsArray = [];
          if (this.visibility) {
            this.debouceUpdate();
          }
          return;
        }
        if (details.type === "acknowledge") {
          details.type = details.buttonLeft || details.buttonRight ? "acknowledge" : "information";
        }
        if (index !== -1) {
          this.log.debug(`update notification id ${details.id}`);
          this.detailsArray[index] = { ...details, priority: details.priority || 50 };
        } else {
          this.log.debug(`add notification id ${details.id}`);
          this.detailsArray.unshift({ ...details, priority: details.priority || 50 });
        }
        this.detailsArray.sort((a, b) => a.priority - b.priority);
        this.detailsArray.splice(10);
        const index2 = this.detailsArray.findIndex((d) => d.id === details.id);
        if (index2 == 0 && index !== index2) {
          this.log.debug(`notification id ${details.id} is first in queue, updating view`);
          if (this.reminderTimeout) {
            this.adapter.clearTimeout(this.reminderTimeout);
          }
          this.reminderTimeout = void 0;
          this.debouceUpdate();
        } else {
          this.log.debug(`notification id ${details.id} not first in queue (${index2}), not updating view`);
        }
      }
    }
  }
  showPopup() {
    if (this.detailsArray.length > 0) {
      if (this.reminderTimeout) {
        this.adapter.clearTimeout(this.reminderTimeout);
      }
      this.reminderTimeout = void 0;
      this.debouceUpdate();
      return true;
    }
    return false;
  }
  debouceUpdate() {
    if (this.debouceUpdateTimeout) {
      this.adapter.clearTimeout(this.debouceUpdateTimeout);
    }
    if (this.unload || this.adapter.unload) {
      return;
    }
    if (this.detailsArray.length === 0) {
      let page = this.getLastPage();
      if (!page) {
        page = this.basePanel.navigation.getCurrentMainPage();
      }
      void this.basePanel.setActivePage(page);
      this.removeLastPage(page);
      return;
    }
    this.debouceUpdateTimeout = this.adapter.setTimeout(async () => {
      if (this.basePanel.getActivePage() !== this) {
        await this.basePanel.setActivePage(this);
      } else {
        await this.update();
      }
    }, 200);
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
    var _a, _b, _c, _d, _e, _f, _g;
    this.log.debug(`Popup notify button event: ${JSON.stringify(_event)}`);
    if (_event.action !== "notifyAction") {
      return;
    }
    switch (_event.opt) {
      case "yes":
        {
          const entry = this.detailsArray.shift();
          if (((_a = this.items) == null ? void 0 : _a.data.setStateID) && (entry == null ? void 0 : entry.id) != null) {
            await this.items.data.setStateID.setState(entry.id);
            if ((entry == null ? void 0 : entry.global) && ((_b = this.items) == null ? void 0 : _b.data.setGlobalID)) {
              await this.items.data.setGlobalID.setState(`${this.basePanel.name}.${entry.id}`);
            }
          }
          if (((_c = this.items) == null ? void 0 : _c.data.setStateYes) && (entry == null ? void 0 : entry.id) != null) {
            await this.items.data.setStateYes.setState(entry.id);
            if ((entry == null ? void 0 : entry.global) && ((_d = this.items) == null ? void 0 : _d.data.setGlobalYes)) {
              await this.items.data.setGlobalYes.setState(`${entry.id}`);
            }
          }
          if (entry == null ? void 0 : entry.global) {
            const panels = this.basePanel.controller.panels;
            for (const panel of panels) {
              if (panel === this.basePanel || panel.unload) {
                continue;
              }
              await this.basePanel.statesControler.setInternalState(
                `${panel.name}/cmd/popupNotificationCustom`,
                JSON.stringify({ id: "", priority: -1 }),
                false
              );
            }
          }
          this.log.debug(
            `Popup notify '${this.name}' yes pressed, remaining entries: ${this.detailsArray.length}`
          );
          this.debouceUpdate();
        }
        break;
      case "no":
        {
          const entry = this.detailsArray.shift();
          if (entry) {
            this.detailsArray.push(entry);
          }
          if (((_e = this.items) == null ? void 0 : _e.data.setStateID) && (entry == null ? void 0 : entry.id) != null) {
            await this.items.data.setStateID.setState(entry.id);
            if (entry == null ? void 0 : entry.global) {
              await this.items.data.setStateID.setState(`${this.basePanel.name}.${entry.id}`);
            }
          }
          if (((_f = this.items) == null ? void 0 : _f.data.setStateNo) && (entry == null ? void 0 : entry.id) != null) {
            await this.items.data.setStateNo.setState(entry.id);
            if ((entry == null ? void 0 : entry.global) && ((_g = this.items) == null ? void 0 : _g.data.setGlobalNo)) {
              await this.items.data.setGlobalNo.setState(`${entry.id}`);
            }
          }
          this.log.debug(
            `Popup notify '${this.name}' no pressed, remaining entries: ${this.detailsArray.length}`
          );
          this.debouceUpdate();
        }
        break;
    }
  }
  startReminder() {
    var _a, _b, _c, _d;
    if (this.reminderTimeout) {
      this.adapter.clearTimeout(this.reminderTimeout);
    }
    if (((_b = (_a = this.detailsArray) == null ? void 0 : _a[0]) == null ? void 0 : _b.type) === "information") {
      this.detailsArray.shift();
      if (this.detailsArray.length === 0) {
        return;
      }
    }
    const remind = ((_c = this.detailsArray[0]) == null ? void 0 : _c.alwaysOn) && ((_d = this.detailsArray[0]) == null ? void 0 : _d.type) === "acknowledge";
    if (remind) {
      this.reminderTimeout = this.adapter.setTimeout(() => {
        this.debouceUpdate();
      }, 15e3);
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
  getLastPage() {
    return this.lastpage.length > 0 ? this.lastpage[this.lastpage.length - 1] : void 0;
  }
}
function isCardPopupDataItems(obj) {
  return obj && obj.card === "popupNotify";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PagePopup,
  isCardPopupDataItems
});
//# sourceMappingURL=pagePopup.js.map
