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
var navigation_exports = {};
__export(navigation_exports, {
  Navigation: () => Navigation
});
module.exports = __toCommonJS(navigation_exports);
var import_library = require("./library");
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
var import_definition = require("../const/definition");
class Navigation extends import_library.BaseClass {
  panel;
  database = [];
  navigationConfig;
  doubleClickDelay = 400;
  mainPage = "main";
  doubleClickTimeout;
  _currentItem = 0;
  get currentItem() {
    return this._currentItem;
  }
  set currentItem(value) {
    const c = this.navigationConfig[value];
    if (c) {
      const states = this.buildCommonStates();
      import_definition.genericStateObjects.panel.panels.cmd.goToNavigationPoint.common.states = states;
      this.library.writedp(
        `panels.${this.panel.name}.cmd.goToNavigationPoint`,
        c.name,
        import_definition.genericStateObjects.panel.panels.cmd.goToNavigationPoint
      );
    }
    this._currentItem = value;
  }
  constructor(config) {
    super(config.adapter, `${config.panel.name}-navigation`);
    this.panel = config.panel;
    this.navigationConfig = config.navigationConfig;
  }
  init() {
    let b = 1;
    let serviceLeft = "";
    let serviceRight = "";
    let serviceID = -1;
    for (let a = 0; a < this.navigationConfig.length; a++) {
      const c = this.navigationConfig[a];
      if (!c)
        continue;
      if (c.left && c.left.single === "///service")
        serviceRight = c.name;
      if (c.right && c.right.single === "///service")
        serviceLeft = c.name;
      if (c.name === "///service")
        serviceID = a;
      const pageID = this.panel.getPagebyUniqueID(c.page);
      this.database[c.name === "main" ? 0 : b++] = pageID !== null ? { page: pageID, left: {}, right: {}, index: a } : null;
    }
    if (serviceID !== -1) {
      const c = this.navigationConfig[serviceID];
      if (c) {
        if (serviceLeft)
          c.left = { single: serviceLeft };
        if (serviceRight)
          c.right = { single: serviceRight };
      }
    }
    for (let a = 0; a < this.database.length; a++) {
      const c = this.navigationConfig[a];
      const i = this.database[a];
      if (!c || !i)
        continue;
      for (const k of ["left", "right"]) {
        const nk = k;
        const r = c[nk];
        if (!r)
          continue;
        for (const k2 of ["single", "double"]) {
          const nk2 = k2;
          const r2 = r[nk2];
          if (!r2)
            continue;
          const index = this.navigationConfig.findIndex((a2) => a2 && a2.name === r2);
          if (index !== -1) {
            i[nk][nk2] = index;
          } else {
            this.log.warn(`Dont find a navigation node with name ${r2}`);
          }
        }
      }
    }
  }
  async setPageByIndex(index) {
    if (index !== -1 && index !== void 0) {
      const item = this.database[index];
      if (item) {
        this.currentItem = index;
        await this.panel.setActivePage(this.database[index].page);
        await this.optionalActions(item);
      }
    }
  }
  setTargetPageByName(n) {
    const index = this.navigationConfig.findIndex((a) => a && a.name === n);
    if (index !== -1) {
      this.setPageByIndex(index);
    } else {
      this.log.warn(`Dont find navigation target for ${n}`);
    }
  }
  setMainPageByName(n) {
    const index = this.navigationConfig.findIndex((a) => a && a.name === n);
    if (index !== -1 && this.database[index]) {
      this.mainPage = this.navigationConfig[index].name;
    } else {
      this.log.warn(`Dont find navigation main page for ${n}`);
    }
  }
  buildCommonStates() {
    const result = {};
    for (const n of this.navigationConfig) {
      if (n)
        result[n.name] = n.name;
    }
    return result;
  }
  goLeft() {
    this.go("left");
  }
  goRight() {
    this.go("right");
  }
  go(d, single = false) {
    const i = this.database[this.currentItem];
    if (this.doubleClickTimeout && !single) {
      this.adapter.clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = void 0;
      if (i && i[d] && i[d].double) {
        const index = i[d].double;
        this.setPageByIndex(index);
      }
      this.log.debug("Navigation double click not work.");
    } else if (!single && i && i[d] && i[d].double) {
      this.doubleClickTimeout = this.adapter.setTimeout(
        (...arg) => {
          this.go(arg[0], arg[1]);
        },
        this.doubleClickDelay,
        d,
        true
      );
      return;
    } else {
      this.adapter.clearTimeout(this.doubleClickTimeout);
      this.doubleClickTimeout = void 0;
      if (i && i[d] && i[d].single !== void 0) {
        const index = i[d].single;
        this.setPageByIndex(index);
        this.log.debug(`Navigation single click with target ${i[d].single} not work.`);
        return;
      } else if (i && i[d] && i[d].double !== void 0) {
        const index = i[d].double;
        this.setPageByIndex(index);
        this.log.debug(`Navigation single click (use double target) with target ${i[d].double} not work.`);
        return;
      }
      this.log.debug("Navigation single click not work.");
    }
  }
  async optionalActions(item) {
    if (!item)
      return;
    const nItem = this.navigationConfig[item.index];
    if (!nItem)
      return;
    if (nItem.optional === "notifications") {
      if (this.panel.controller.systemNotification.getNotificationIndex(this.panel.notifyIndex) !== -1) {
        await this.panel.statesControler.setInternalState(
          `${this.panel.name}/cmd/NotificationNext2`,
          true,
          false
        );
      }
    }
  }
  buildNavigationString(side) {
    const item = this.database[this.currentItem];
    if (!item)
      return "";
    let navigationString = "";
    if (!side || side === "left") {
      if (item.left.single !== void 0 && (item.left.double === void 0 || this.doubleClickTimeout === void 0)) {
        navigationString = (0, import_tools.getPayload)(
          "button",
          "bSubPrev",
          item.left.double !== void 0 ? import_icon_mapping.Icons.GetIcon("arrow-left-bold") : import_icon_mapping.Icons.GetIcon("arrow-top-left-bold-outline"),
          String((0, import_Color.rgb_dec565)(import_Color.White)),
          "",
          ""
        );
      } else if (item.left.double !== void 0) {
        navigationString = (0, import_tools.getPayload)(
          "button",
          "bUp",
          import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
          String((0, import_Color.rgb_dec565)(import_Color.White)),
          "",
          ""
        );
      } else {
        navigationString = (0, import_tools.getPayload)("", "", "", "", "", "");
      }
    }
    let navigationString2 = "";
    if (!side || side === "right") {
      if (item.right.single !== void 0 && (item.right.double === void 0 || this.doubleClickTimeout === void 0)) {
        navigationString2 = (0, import_tools.getPayload)(
          "button",
          "bSubNext",
          item.left.double === void 0 ? import_icon_mapping.Icons.GetIcon("arrow-right-bold") : import_icon_mapping.Icons.GetIcon("arrow-top-right-bold-outline"),
          String((0, import_Color.rgb_dec565)(import_Color.White)),
          "",
          ""
        );
      } else if (item.right.double !== void 0) {
        navigationString2 = (0, import_tools.getPayload)(
          "button",
          "bHome",
          import_icon_mapping.Icons.GetIcon("home"),
          String((0, import_Color.rgb_dec565)(import_Color.White)),
          "",
          ""
        );
      } else {
        navigationString2 = (0, import_tools.getPayload)("", "", "", "", "", "");
      }
    }
    if (side === "left")
      return navigationString;
    else if (side === "right")
      return navigationString2;
    return (0, import_tools.getPayload)(navigationString, navigationString2);
  }
  resetPosition() {
    const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
    if (index !== -1 && this.database[index]) {
      this.currentItem = index;
    }
  }
  getCurrentMainPoint() {
    const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
    if (index === -1)
      return "main";
    const item = this.navigationConfig[index];
    return item ? item.name : "main";
  }
  getCurrentPage() {
    const page = this.database[this.currentItem];
    if (page === null || page === void 0) {
      const index = this.database.findIndex((a) => a && a.page !== null);
      return this.database[index].page;
    }
    return page.page;
  }
  async setCurrentPage() {
    let page = this.database[this.currentItem];
    if (page === null || page === void 0) {
      const index = this.database.findIndex((a) => a && a.page !== null);
      page = this.database[index];
    }
    if (page)
      await this.setPageByIndex(page.index);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Navigation
});
//# sourceMappingURL=navigation.js.map
