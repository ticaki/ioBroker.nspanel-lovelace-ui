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
var Page_exports = {};
__export(Page_exports, {
  Page: () => Page,
  PageItem: () => PageItem
});
module.exports = __toCommonJS(Page_exports);
var import_library = require("../classes/library");
class Page extends import_library.BaseClass {
  pageItems = [];
  card;
  config;
  test = 0;
  constructor(adapter, options) {
    super(adapter, "Page");
    this.config = options.config;
    this.card = options.card;
  }
  async init() {
  }
  goLeft() {
    if (this.config.navigation && this.config.navigation.left)
      return this.config.navigation.left.page;
    return void 0;
  }
  goRight() {
    if (this.config.navigation && this.config.navigation.right)
      return this.config.navigation.right.page;
    return void 0;
  }
}
class PageItem extends import_library.BaseClass {
  config;
  pageItems = [];
  constructor(adapter, options) {
    super(adapter, "Page");
    this.config = options;
  }
  async init() {
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Page,
  PageItem
});
//# sourceMappingURL=Page.js.map
