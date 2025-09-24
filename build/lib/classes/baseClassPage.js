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
  BaseTriggeredPage: () => BaseTriggeredPage
});
module.exports = __toCommonJS(baseClassPage_exports);
var import_library = require("../controller/library");
var import_definition = require("../const/definition");
class BaseTriggeredPage extends import_library.BaseClass {
  updateTimeout;
  doUpdate = true;
  minUpdateInterval;
  visibility = false;
  alwaysOn;
  alwaysOnState;
  lastMessage = "";
  basePanel;
  filterDuplicateMessages = true;
  neverDeactivateTrigger = false;
  sleep = false;
  parent = void 0;
  canBeHidden = false;
  triggerParent = false;
  dpInit = "";
  blockUpdateUntilTime = null;
  enums = "";
  device = "";
  sendToPanel = (payload, ackForType, force, opt) => {
    if (this.filterDuplicateMessages && payload == this.lastMessage) {
      return;
    }
    this.lastMessage = payload;
    this.sendToPanelClass(payload, ackForType, force, opt);
  };
  resetLastMessage() {
    this.lastMessage = "";
  }
  constructor(card, alwaysOn = "none") {
    super(card.adapter, card.name);
    this.minUpdateInterval = 400;
    if (!this.adapter.controller) {
      throw new Error("No controller! bye bye");
    }
    this.alwaysOn = alwaysOn;
    this.basePanel = card.panel;
  }
  sendToPanelClass(payload, ackForType, force, opt) {
    this.basePanel.panelSend.addMessage(payload, ackForType, force, opt);
  }
  get controller() {
    return this.adapter.controller;
  }
  async reset() {
  }
  onStateTriggerSuperDoNotOverride = async (dp, from) => {
    var _a, _b;
    if (this.unload || this.adapter.unload) {
      return false;
    }
    if (!this.visibility && !(this.neverDeactivateTrigger || this.canBeHidden && ((_a = this.parent) == null ? void 0 : _a.visibility) || from.neverDeactivateTrigger)) {
      this.log.debug(`[${this.basePanel.friendlyName} ${this.name}] Page not visible, ignore trigger!`);
      return false;
    }
    if (this.sleep && !this.neverDeactivateTrigger) {
      return false;
    }
    if (this.blockUpdateUntilTime) {
      if (this.blockUpdateUntilTime.getTime() > (/* @__PURE__ */ new Date()).getTime()) {
        if (this.updateTimeout) {
          this.adapter.clearTimeout(this.updateTimeout);
        }
        this.updateTimeout = this.adapter.setTimeout(
          async () => {
            if (this.unload || this.adapter.unload) {
              return;
            }
            this.updateTimeout = void 0;
            if (this.doUpdate) {
              this.doUpdate = false;
              await this.onStateTrigger(dp, from);
            }
          },
          this.blockUpdateUntilTime.getTime() - (/* @__PURE__ */ new Date()).getTime() + 20
        );
      }
      this.blockUpdateUntilTime = null;
    }
    if (this.updateTimeout) {
      this.doUpdate = true;
      return false;
    }
    this.updateTimeout = this.adapter.setTimeout(async () => {
      if (this.unload || this.adapter.unload) {
        return;
      }
      this.updateTimeout = void 0;
      if (this.doUpdate) {
        if (this.alwaysOnState) {
          this.adapter.clearTimeout(this.alwaysOnState);
        }
        if (this.alwaysOn === "action") {
          if (this.unload || this.adapter.unload) {
            return;
          }
          this.alwaysOnState = this.adapter.setTimeout(
            () => {
              this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
            },
            this.basePanel.timeout * 1e3 || 5e3
          );
        }
        this.doUpdate = false;
        await this.onStateTrigger(dp, from);
      }
    }, (_b = this.minUpdateInterval) != null ? _b : 50);
    if (this.alwaysOnState) {
      this.adapter.clearTimeout(this.alwaysOnState);
    }
    if (this.alwaysOn === "action") {
      if (this.unload || this.adapter.unload) {
        return false;
      }
      this.alwaysOnState = this.adapter.setTimeout(
        () => {
          this.basePanel.sendScreensaverTimeout(this.basePanel.timeout);
        },
        this.basePanel.timeout * 1e3 || 5e3
      );
    }
    await this.onStateTrigger(dp, from);
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
    await super.delete();
    await this.setVisibility(false);
    this.parent = void 0;
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
        if (this.unload || this.adapter.unload) {
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
      if (this.unload || this.adapter.unload) {
        return;
      }
      await this.onVisibilityChange(v);
      if (this.visibility) {
        if (this.alwaysOn != "ignore") {
          if (this.alwaysOn != "none") {
            if (this.alwaysOn === "action") {
              if (this.unload || this.adapter.unload) {
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
      if (this.unload || this.adapter.unload) {
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
class BaseClassPage extends BaseTriggeredPage {
  pageItemConfig;
  pageItems;
  constructor(card, alwaysOn = "none", pageItemsConfig) {
    super(card, alwaysOn);
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
  BaseTriggeredPage
});
//# sourceMappingURL=baseClassPage.js.map
