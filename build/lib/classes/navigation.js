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
  Navigation: () => Navigation,
  isNavigationItemConfig: () => isNavigationItemConfig,
  isNavigationItemConfigArray: () => isNavigationItemConfigArray
});
module.exports = __toCommonJS(navigation_exports);
var import_library = require("../controller/library");
var import_Color = require("../const/Color");
var import_icon_mapping = require("../const/icon_mapping");
var import_tools = require("../const/tools");
var import_definition = require("../const/definition");
function isNavigationItemConfigArray(a) {
  if (!a) {
    return false;
  }
  for (const n of a) {
    if (!isNavigationItemConfig(n)) {
      return false;
    }
  }
  return true;
}
function isNavigationItemConfig(a) {
  if (a === void 0) {
    return false;
  }
  if (a === null) {
    return true;
  }
  if (typeof a !== "object" || !a.name || typeof a.name !== "string") {
    return false;
  }
  if (a.left && typeof a.left !== "object") {
    return false;
  }
  if (a.right && typeof a.right !== "object") {
    return false;
  }
  if (!a.page || typeof a.page !== "string") {
    return false;
  }
  if (a.right && (a.right.single && typeof a.right.single !== "string" || a.right.double && typeof a.right.double !== "string")) {
    return false;
  }
  if (a.left && (a.left.single && typeof a.left.single !== "string" || a.left.double && typeof a.left.double !== "string")) {
    return false;
  }
  return true;
}
class Navigation extends import_library.BaseClass {
  panel;
  database = [];
  navigationConfig;
  mainPage = "main";
  _currentItem = 0;
  initDone = false;
  infityCounter = 0;
  get currentItem() {
    return this._currentItem;
  }
  set currentItem(value) {
    const c = this.navigationConfig[value];
    if (c) {
      if (!this.initDone) {
        const states = this.buildCommonStates();
        import_definition.genericStateObjects.panel.panels.cmd.goToNavigationPoint.common.states = states;
        void this.library.writedp(
          `panels.${this.panel.name}.cmd.goToNavigationPoint`,
          c.name,
          import_definition.genericStateObjects.panel.panels.cmd.goToNavigationPoint
        ).catch();
        this.initDone = true;
      } else {
        void this.library.writedp(`panels.${this.panel.name}.cmd.goToNavigationPoint`, c.name).catch();
      }
    }
    this._currentItem = value;
  }
  constructor(config) {
    super(config.adapter, `${config.panel.friendlyName}-navigation`);
    this.panel = config.panel;
    this.navigationConfig = config.navigationConfig.filter((a) => a !== null && a != null);
  }
  init() {
    var _a, _b;
    this.database = [];
    let serviceLeft = "";
    let serviceRight = "";
    let serviceID = null;
    this.navigationConfig.sort((a, b) => {
      if (a.name === "main") {
        return -1;
      }
      if (b.name === "main") {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (let a = 0; a < this.navigationConfig.length; a++) {
      const c = this.navigationConfig[a];
      if (!c) {
        continue;
      }
      if (((_a = c.left) == null ? void 0 : _a.single) === "///service") {
        serviceRight = c.name;
      }
      if (((_b = c.right) == null ? void 0 : _b.single) === "///service") {
        serviceLeft = c.name;
      }
      if (c.name === "///service") {
        if (serviceID !== null) {
          this.log.warn(`Multiple "///service" nodes detected (at least at indices ${serviceID} and ${a}).`);
        }
        serviceID = a;
      }
      const pageID = this.panel.getPagebyUniqueID(c.page);
      if (pageID !== null) {
        this.database[a] = { page: pageID, left: {}, right: {}, index: a };
      }
    }
    if (serviceID !== null) {
      const c = this.navigationConfig[serviceID];
      if (c) {
        if (serviceLeft) {
          c.left = { single: serviceLeft };
        }
        if (serviceRight) {
          c.right = { single: serviceRight };
        }
      }
    }
    for (let a = 0; a < this.database.length; a++) {
      const c = this.navigationConfig[a];
      const i = this.database[a];
      if (!c || !i) {
        continue;
      }
      for (const nk of ["left", "right"]) {
        const r = c[nk];
        if (!r) {
          continue;
        }
        for (const nk2 of ["single", "double"]) {
          const r2 = r[nk2];
          if (!r2) {
            continue;
          }
          const found = this.navigationConfig.find((entry) => entry && entry.name === r2);
          if (found) {
            const idx = this.navigationConfig.indexOf(found);
            i[nk][nk2] = idx;
          } else {
            this.log.warn(`Didn't find a navigation node with name "${r2}".`);
          }
        }
      }
    }
  }
  async setPageByIndex(index, d) {
    if (index !== -1 && index !== void 0) {
      const item = this.database[index];
      if (item) {
        this.currentItem = index;
        if (this.panel.hideCards && item.page.hidden) {
          if (d) {
            this.infityCounter++;
            if (this.infityCounter > 10) {
              this.log.error(
                `Infinite loop detected in navigation: hidden - ${item.page.id} - ${item.page.name} - set navigation to main page.`
              );
              await this.setTargetPageByName(this.mainPage);
              this.infityCounter = 0;
              return;
            }
            this.go(d);
          }
          return;
        }
        this.infityCounter = 0;
        await this.panel.setActivePage(item.page);
        await this.optionalActions(item);
      }
    }
  }
  getDatabase() {
    return this.database;
  }
  async setTargetPageByName(n) {
    const index = this.navigationConfig.findIndex((a) => a && a.name === n);
    if (index !== -1) {
      await this.setPageByIndex(index);
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
    const clone = structuredClone(this.navigationConfig);
    clone.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      if (!(bName.startsWith("///") && aName.startsWith("///"))) {
        if (bName.startsWith("///")) {
          return -1;
        }
        if (aName.startsWith("///")) {
          return 1;
        }
      }
      if (aName > bName) {
        return 1;
      }
      if (aName < bName) {
        return -1;
      }
      return 0;
    });
    for (const n of clone) {
      if (n) {
        result[n.name] = n.name;
      }
    }
    return result;
  }
  goLeft(short) {
    this.go("left", short);
  }
  goRight(short) {
    this.go("right", short);
  }
  go(d, single = false) {
    const i = this.database[this.currentItem];
    if (!i) {
      this.log.warn(`No navigation item found for current index ${this.currentItem}`);
      return;
    }
    if (!i[d]) {
      this.log.debug(`No navigation direction ${d} found for current index ${this.currentItem}`);
      return;
    }
    if (i[d].double !== void 0 && i[d].single !== void 0 && !single) {
      const index = i[d].double;
      void this.setPageByIndex(index, d);
    } else {
      if (i[d].single !== void 0) {
        const index = i[d].single;
        void this.setPageByIndex(index, d);
        this.log.debug(`Navigation single click with target ${i[d].single} done.`);
        return;
      } else if (i[d].double !== void 0) {
        const index = i[d].double;
        void this.setPageByIndex(index, d);
        this.log.debug(`Navigation single click (use double target) with target ${i[d].double} done.`);
        return;
      }
      this.log.debug("Navigation single click - failed.");
    }
  }
  async optionalActions(item) {
    if (!item) {
      return;
    }
    const nItem = this.navigationConfig[item.index];
    if (!nItem) {
      return;
    }
    if (nItem.optional === "notifications") {
      if (this.panel.controller.systemNotification.getCount() !== 0) {
        await this.panel.statesControler.setInternalState(
          `${this.panel.name}/cmd/NotificationNext`,
          true,
          false
        );
      }
    }
  }
  buildNavigationString(side) {
    const item = this.database[this.currentItem];
    if (!item) {
      return "";
    }
    let navigationString = "";
    if (!side || side === "left") {
      if (item.left.single !== void 0 && item.left.double === void 0) {
        navigationString = (0, import_tools.getPayloadRemoveTilde)(
          "button",
          "bSubPrev",
          item.left.double === void 0 ? import_icon_mapping.Icons.GetIcon("arrow-left-bold") : import_icon_mapping.Icons.GetIcon("arrow-top-left-bold-outline"),
          item.left.double === void 0 ? String(import_Color.Color.rgb_dec565(import_Color.Color.navLeft)) : String(import_Color.Color.rgb_dec565(import_Color.Color.navDownLeft)),
          "",
          ""
        );
      } else if (item.left.double !== void 0) {
        navigationString = (0, import_tools.getPayloadRemoveTilde)(
          "button",
          "bUp",
          import_icon_mapping.Icons.GetIcon("arrow-up-bold"),
          String(import_Color.Color.rgb_dec565(import_Color.Color.navParent)),
          "",
          ""
        );
      } else {
        navigationString = (0, import_tools.getPayload)("", "", "", "", "", "");
      }
    }
    let navigationString2 = "";
    if (!side || side === "right") {
      if (item.right.single !== void 0 && item.right.double === void 0) {
        navigationString2 = (0, import_tools.getPayloadRemoveTilde)(
          "button",
          "bSubNext",
          item.right.double === void 0 ? import_icon_mapping.Icons.GetIcon("arrow-right-bold") : import_icon_mapping.Icons.GetIcon("arrow-top-right-bold-outline"),
          item.right.double === void 0 ? String(import_Color.Color.rgb_dec565(import_Color.Color.navRight)) : String(import_Color.Color.rgb_dec565(import_Color.Color.navDownRight)),
          "",
          ""
        );
      } else if (item.right.double !== void 0) {
        navigationString2 = (0, import_tools.getPayloadRemoveTilde)(
          "button",
          "bHome",
          import_icon_mapping.Icons.GetIcon("home"),
          String(import_Color.Color.rgb_dec565(import_Color.Color.navHome)),
          "",
          ""
        );
      } else {
        navigationString2 = (0, import_tools.getPayload)("", "", "", "", "", "");
      }
    }
    if (side === "left") {
      return navigationString;
    } else if (side === "right") {
      return navigationString2;
    }
    return (0, import_tools.getPayload)(navigationString, navigationString2);
  }
  resetPosition(force = false) {
    if (!force && this.adapter.config.rememberLastSite === true) {
      return;
    }
    const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
    if (index !== -1 && this.database[index]) {
      this.currentItem = index;
    }
  }
  getCurrentMainPoint() {
    const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
    if (index === -1) {
      return "main";
    }
    const item = this.navigationConfig[index];
    return item ? item.name : "main";
  }
  getCurrentMainPage() {
    var _a, _b, _c;
    const index = this.navigationConfig.findIndex((a) => a && a.name === this.mainPage);
    if (index === -1 || this.database[index] == null) {
      if (((_a = this.database[0]) == null ? void 0 : _a.page) == null) {
        return void 0;
      }
      return (_b = this.database[0]) == null ? void 0 : _b.page;
    }
    return (_c = this.database[index]) == null ? void 0 : _c.page;
  }
  getCurrentPage() {
    const page = this.database[this.currentItem];
    if (page == null) {
      const index = this.database.findIndex((a) => a && a.page !== null);
      return this.database[index].page;
    }
    return page.page;
  }
  async setCurrentPage() {
    let page = this.database[this.currentItem];
    if (page == null) {
      const index = this.database.findIndex((a) => a && a.page !== null);
      if (index === -1) {
        this.log.error("No valid page found in navigation database.");
        return;
      }
      page = this.database[index];
    }
    if (page) {
      await this.setPageByIndex(page.index);
    }
  }
  async delete() {
    await super.delete();
    this.navigationConfig = [];
    this.database = [];
    this.panel = {};
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Navigation,
  isNavigationItemConfig,
  isNavigationItemConfigArray
});
//# sourceMappingURL=navigation.js.map
