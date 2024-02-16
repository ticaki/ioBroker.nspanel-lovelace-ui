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
class Navigation extends import_library.BaseClass {
  panel;
  database = [];
  navigationConfig;
  doubleClickDelay = 300;
  doubleClickTimeout;
  currentItem = 0;
  constructor(config) {
    super(config.adapter, `${config.panel.name}-navigation`);
    this.panel = config.panel;
    this.navigationConfig = config.navigationConfig;
  }
  init() {
    let b = 1;
    for (let a = 0; a < this.navigationConfig.length; a++) {
      const c = this.navigationConfig[a];
      if (!c)
        continue;
      const pageID = this.panel.getPagebyUniqueID(c.page);
      this.database[c.name === "main" ? 0 : b++] = pageID !== null ? { page: pageID, left: {}, right: {} } : null;
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
  setTargetPageByName(n) {
    const index = this.navigationConfig.findIndex((a) => a && a.name === n);
    if (index !== -1 && this.database[index]) {
      this.currentItem = index;
      this.panel.setActivePage(this.database[index].page);
    } else {
      this.log.warn(`Dont find navigation target for ${n}`);
    }
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
        if (index !== void 0 && this.database[index]) {
          this.currentItem = index;
          this.panel.setActivePage(this.database[index].page);
        }
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
        if (index !== void 0 && this.database[index]) {
          this.currentItem = index;
          this.panel.setActivePage(this.database[index].page);
          return;
        }
        this.log.debug(`Navigation single click with target ${i[d].single} not work.`);
        return;
      }
      this.log.debug("Navigation single click not work.");
    }
  }
  buildNavigationString() {
    const item = this.database[this.currentItem];
    if (!item)
      return "";
    let navigationString = "";
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
    let navigationString2 = "";
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
      navigationString2 = (0, import_tools.getPayload)("button", "bHome", import_icon_mapping.Icons.GetIcon("home"), String((0, import_Color.rgb_dec565)(import_Color.White)), "", "");
    } else {
      navigationString2 = (0, import_tools.getPayload)("", "", "", "", "", "");
    }
    return (0, import_tools.getPayload)(navigationString, navigationString2);
  }
  resetPosition() {
    const index = this.navigationConfig.findIndex((a) => a && a.name === "main");
    if (index !== -1 && this.database[index]) {
      this.currentItem = index;
    }
  }
  getCurrentPage() {
    const page = this.database[this.currentItem];
    if (page === null) {
      const index = this.database.findIndex((a) => a && a.page !== null);
      return this.database[index].page;
    }
    return page.page;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Navigation
});
//# sourceMappingURL=navigation.js.map
