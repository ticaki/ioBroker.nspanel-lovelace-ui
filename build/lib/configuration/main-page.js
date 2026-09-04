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
var main_page_exports = {};
__export(main_page_exports, {
  ensureMainPage: () => ensureMainPage
});
module.exports = __toCommonJS(main_page_exports);
var import_default_pages = require("../const/default-pages");
const serviceNodeName = "///service";
function ensureMainPage(option, headline) {
  var _a, _b, _c;
  const result = { pageAdded: false, navigationAdded: false };
  const hasNode = option.navigation.some((a) => a && a.name === import_default_pages.mainPageName);
  if (hasNode) {
    if (!option.pages.some((a) => a && a.uniqueID === import_default_pages.mainPageName)) {
      option.pages.push((0, import_default_pages.getDefaultMainPage)(headline));
      result.pageAdded = true;
    }
    return result;
  }
  option.pages = option.pages.filter((a) => !a || a.uniqueID !== import_default_pages.mainPageName);
  option.pages.push((0, import_default_pages.getDefaultMainPage)(headline));
  result.pageAdded = true;
  const mainNode = { name: import_default_pages.mainPageName, page: import_default_pages.mainPageName };
  const first = option.navigation.find((a) => a != null);
  if (!first) {
    mainNode.left = { single: serviceNodeName };
    mainNode.right = { single: serviceNodeName };
  } else {
    mainNode.right = { single: first.name };
    if (((_a = first.left) == null ? void 0 : _a.single) === serviceNodeName) {
      mainNode.left = { single: serviceNodeName };
      first.left = { single: import_default_pages.mainPageName };
    } else {
      if (!((_b = first.left) == null ? void 0 : _b.single)) {
        first.left = { ...(_c = first.left) != null ? _c : {}, single: import_default_pages.mainPageName };
      }
      if (!option.navigation.some((a) => {
        var _a2;
        return a && ((_a2 = a.left) == null ? void 0 : _a2.single) === serviceNodeName;
      })) {
        mainNode.left = { single: serviceNodeName };
      }
    }
  }
  option.navigation.unshift(mainNode);
  result.navigationAdded = true;
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ensureMainPage
});
//# sourceMappingURL=main-page.js.map
