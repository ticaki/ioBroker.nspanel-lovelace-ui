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
var baseClassPage_exports = {};
__export(baseClassPage_exports, {
  BaseClassPage: () => BaseClassPage,
  BaseClassTriggerd: () => BaseClassTriggerd
});
module.exports = __toCommonJS(baseClassPage_exports);
var import_library = require("./library");
var import_definition = require("../const/definition");
class BaseClassTriggerd extends import_library.BaseClass {
  updateTimeout;
  waitForTimeout;
  doUpdate = true;
  minUpdateInterval;
  visibility = false;
  alwaysOn;
  alwaysOnState;
  lastMessage = "";
  basePanel;
  _currentPanel;
  filterDuplicateMessages = true;
  neverDeactivateTrigger = false;
  sleep = false;
  parent = void 0;
  canBeHidden = false;
  triggerParent = false;
  dpInit = "";
  enums = "";
  device = "";
  sendToPanel = (payload, ackForType, opt) => {
    if (this.filterDuplicateMessages && payload == this.lastMessage) {
      return;
    }
    this.lastMessage = payload;
    this.sendToPanelClass(payload, ackForType, opt);
  };
  resetLastMessage() {
    this.lastMessage = "";
  }
  constructor(card) {
    var _a;
    super(card.adapter, card.name);
    this.minUpdateInterval = 400;
    if (!this.adapter.controller) {
      throw new Error("No controller! bye bye");
    }
    this.alwaysOn = (_a = card.alwaysOn) != null ? _a : "none";
    this.basePanel = card.panel;
    this._currentPanel = card.panel;
  }
  get currentPanel() {
    var _a;
    return (_a = this._currentPanel) != null ? _a : this.basePanel;
  }
  set currentPanel(p) {
    this._currentPanel = p;
  }
  sendToPanelClass(payload, ackForType, opt) {
    this.currentPanel.panelSend.addMessage(payload, ackForType, opt);
  }
  get controller() {
    return this.adapter.controller;
  }
  async reset() {
  }
  onStateTriggerSuperDoNotOverride = async (dp, from) => {
    var _a;
    if (!this.visibility && !(this.neverDeactivateTrigger || this.canBeHidden && ((_a = this.parent) == null ? void 0 : _a.visibility) || from.neverDeactivateTrigger)) {
      this.log.debug(`[${this.basePanel.friendlyName} ${this.name}] Page not visible, ignore trigger!`);
      return false;
    }
    if (this.sleep && !this.neverDeactivateTrigger) {
      return false;
    }
    if (this.waitForTimeout) {
      return false;
    }
    if (this.updateTimeout) {
      this.doUpdate = true;
      return false;
    }
    if (this.unload) {
      return false;
    }
    this.waitForTimeout = this.adapter.setTimeout(async () => {
      this.waitForTimeout = void 0;
      await this.onStateTrigger(dp, from);
      if (this.alwaysOnState) {
        this.adapter.clearTimeout(this.alwaysOnState);
      }
      if (this.alwaysOn === "action") {
        if (this.unload) {
          return;
        }
        this.alwaysOnState = this.adapter.setTimeout(
          () => {
            this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
          },
          this.basePanel.timeout * 1e3 || 5e3
        );
      }
    }, 20);
    this.updateTimeout = this.adapter.setTimeout(async () => {
      if (this.unload) {
        return;
      }
      this.updateTimeout = void 0;
      if (this.doUpdate) {
        this.doUpdate = false;
        await this.onStateTrigger(dp, from);
      }
    }, this.minUpdateInterval);
    return true;
  };
  async onStateTrigger(_dp, _from) {
    this.adapter.log.warn(
      `<- instance of [${Object.getPrototypeOf(this)}] is triggert but dont react or call super.onStateTrigger()`
    );
  }
  stopTriggerTimeout() {
    if (this.updateTimeout) {
      this.adapter.clearTimeout(this.updateTimeout);
      this.updateTimeout = void 0;
    }
  }
  async delete() {
    await this.setVisibility(false);
    this.parent = void 0;
    await super.delete();
    if (this.waitForTimeout) {
      this.adapter.clearTimeout(this.waitForTimeout);
    }
    if (this.alwaysOnState) {
      this.adapter.clearTimeout(this.alwaysOnState);
    }
    this.stopTriggerTimeout();
  }
  getVisibility = () => {
    return this.visibility;
  };
  setVisibility = async (v) => {
    if (v !== this.visibility) {
      this.visibility = v;
      if (this.visibility) {
        if (this.unload) {
          return;
        }
        this.log.debug(`[${this.basePanel.friendlyName}] Switch page to visible!`);
        this.resetLastMessage();
        this.controller && await this.controller.statesControler.activateTrigger(this);
        this.basePanel.info.nspanel.currentPage = this.name;
        await this.library.writedp(
          `panels.${this.basePanel.name}.info.nspanel.currentPage`,
          this.name,
          import_definition.genericStateObjects.panel.panels.info.nspanel.currentPage
        );
      } else {
        if (this.alwaysOnState) {
          this.adapter.clearTimeout(this.alwaysOnState);
        }
        this.log.debug(`[${this.basePanel.friendlyName}] Switch page to invisible!`);
        if (!this.neverDeactivateTrigger) {
          this.stopTriggerTimeout();
          this.controller && await this.controller.statesControler.deactivateTrigger(this);
        }
      }
      if (this.unload) {
        return;
      }
      await this.onVisibilityChange(v);
      if (this.visibility) {
        if (this.alwaysOn != "ignore") {
          if (this.alwaysOn != "none") {
            if (this.alwaysOn === "action") {
              if (this.unload) {
                return;
              }
              this.alwaysOnState = this.adapter.setTimeout(
                async () => {
                  this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
                },
                this.basePanel.timeout * 2 * 1e3 || 5e3
              );
            } else {
              this.basePanel.sendScreensaverTimeout(0);
            }
          } else {
            this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
          }
        }
      }
    } else {
      this.visibility = v;
      if (this.unload) {
        return;
      }
      if (this.visibility) {
        await this.onVisibilityChange(v);
      }
    }
  };
  /**
   * Event when visibility is on Change.
   *
   * @param val true/false
   */
  async onVisibilityChange(val) {
    val;
    this.adapter.log.warn(
      `<- instance of [${this.name}] not react on onVisibilityChange(), or call super.onVisibilityChange()`
    );
  }
}
class BaseClassPage extends BaseClassTriggerd {
  pageItemConfig;
  pageItems;
  constructor(card, pageItemsConfig) {
    super(card);
    this.pageItemConfig = pageItemsConfig;
  }
  async getEnabledPageItems() {
    if (this.pageItems) {
      const pageItems = [];
      for (let a = 0; a < this.pageItems.length; a++) {
        if (this.pageItems[a] == null) {
          continue;
        }
        if (await this.pageItems[a].isEnabled()) {
          pageItems.push(this.pageItems[a]);
        }
      }
      return pageItems;
    }
    return this.pageItems;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseClassPage,
  BaseClassTriggerd
});
//# sourceMappingURL=baseClassPage.js.map
