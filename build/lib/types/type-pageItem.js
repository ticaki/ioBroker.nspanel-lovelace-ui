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
  isPageItemDataItemsOptions: () => isPageItemDataItemsOptions,
  islistCommandUnion: () => islistCommandUnion
});
module.exports = __toCommonJS(type_pageItem_exports);
function isPageItemDataItemsOptions(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  if ("template" in obj && typeof obj.template === "string") {
    return true;
  }
  if ("type" in obj && typeof obj.type === "string" && "data" in obj) {
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
  isPageItemDataItemsOptions,
  islistCommandUnion
});
//# sourceMappingURL=type-pageItem.js.map
