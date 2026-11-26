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
var mediaToolbar_exports = {};
__export(mediaToolbar_exports, {
  addMediaToolbarItem: () => addMediaToolbarItem,
  orderMediaToolbarItems: () => orderMediaToolbarItems
});
module.exports = __toCommonJS(mediaToolbar_exports);
var import_adminShareConfig = require("../../types/adminShareConfig");
function addMediaToolbarItem(list, kind, ...items) {
  for (const item of items) {
    list.push({ kind, item });
  }
}
function orderMediaToolbarItems(list, itemsOrder) {
  const order = [];
  if (Array.isArray(itemsOrder)) {
    for (const entry of itemsOrder) {
      if ((0, import_adminShareConfig.isMediaToolbarItem)(entry) && !order.includes(entry)) {
        order.push(entry);
      }
    }
  }
  const rank = (kind) => {
    const index = order.indexOf(kind);
    return index === -1 ? order.length : index;
  };
  return [...list].sort((a, b) => rank(a.kind) - rank(b.kind)).map((entry) => entry.item);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addMediaToolbarItem,
  orderMediaToolbarItems
});
//# sourceMappingURL=mediaToolbar.js.map
