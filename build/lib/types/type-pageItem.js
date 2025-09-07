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
var type_pageItem_exports = {};
__export(type_pageItem_exports, {
  isPageItemDataItem: () => isPageItemDataItem,
  islistCommandUnion: () => islistCommandUnion
});
module.exports = __toCommonJS(type_pageItem_exports);
function isPageItemDataItem(f) {
  if (f && typeof f === "object" && "type" in f && "data" in f) {
    return true;
  }
  return false;
}
function islistCommandUnion(F) {
  switch (F) {
    case "flip": {
      return true;
    }
  }
  return false;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isPageItemDataItem,
  islistCommandUnion
});
//# sourceMappingURL=type-pageItem.js.map
