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
var admin_page_item_exports = {};
__export(admin_page_item_exports, {
  adminPageItemToScriptItem: () => adminPageItemToScriptItem
});
module.exports = __toCommonJS(admin_page_item_exports);
var import_Color = require("../const/Color");
var import_adminShareConfig = require("../types/adminShareConfig");
function hexToScriptColor(color, onInvalidColor) {
  if (!color) {
    return void 0;
  }
  try {
    const c = import_Color.Color.ConvertHexToRgb(color);
    return { red: c.r, green: c.g, blue: c.b };
  } catch {
    onInvalidColor(color);
    return void 0;
  }
}
function adminPageItemToScriptItem(preItem, onInvalidColor = () => void 0) {
  var _a, _b, _c, _d, _e;
  let item = void 0;
  if (preItem.useNative) {
    const raw = (0, import_adminShareConfig.isRawItemObject)(preItem.native) ? structuredClone(preItem.native) : void 0;
    if (raw) {
      item = (0, import_adminShareConfig.pageItemRawFormat)(preItem) === "native" ? { native: raw } : (
        // script format: not validated here, the config manager checks it like a script item
        raw
      );
    }
  } else if (preItem.isNavigation) {
    item = {
      navigate: true,
      targetPage: (_a = preItem.targetPage) != null ? _a : "",
      type: null,
      id: preItem.channelId.valueStateId
    };
  } else {
    item = {
      type: null,
      id: preItem.channelId.valueStateId,
      // role button: pressed and then changes to targetPage (without navigate)
      targetPage: preItem.type !== "custom" && preItem.targetPage ? preItem.targetPage : void 0
    };
  }
  if (!item) {
    return void 0;
  }
  if (!preItem.useNative && !("native" in item)) {
    item.type = preItem.type === "custom" ? "custom" : null;
    item.icon = preItem.trueIcon || void 0;
    item.icon2 = preItem.falseIcon || void 0;
    item.onColor = hexToScriptColor(preItem.trueColor, onInvalidColor);
    item.offColor = hexToScriptColor(preItem.falseColor, onInvalidColor);
    item.longPress = preItem.longPress || void 0;
    item.targetPageLongPress = preItem.targetPageLongPress || void 0;
    item.name = preItem.name || void 0;
    if ((0, import_adminShareConfig.isIconColorScaleElement)(preItem.scale)) {
      item.colorScale = { ...preItem.scale };
    }
    if (item.type !== "custom") {
      item.fontSize = preItem.textSize || preItem.textSize == 0 ? Number(preItem.textSize) : void 0;
      if (!item.name && preItem.valueEntry) {
        item.name = preItem.valueEntry.valueStateId;
        item.suffixName = preItem.valueEntry.suffix ? preItem.valueEntry.suffix : void 0;
        item.prefixName = preItem.valueEntry.prefix ? preItem.valueEntry.prefix : void 0;
      }
      item.prefixValue = ((_b = preItem.channelId) == null ? void 0 : _b.prefix) ? preItem.channelId.prefix : void 0;
      item.suffixValue = ((_c = preItem.channelId) == null ? void 0 : _c.suffix) ? preItem.channelId.suffix : void 0;
      item.unit = ((_d = preItem.channelId) == null ? void 0 : _d.unit) ? preItem.channelId.unit : void 0;
      item.useValue = preItem.useValue;
      item.inSel_Alias = preItem.inSel_Alias || void 0;
      item.modeList = ((_e = preItem.modeList) == null ? void 0 : _e.length) ? preItem.modeList : void 0;
      item.filter = typeof preItem.filter === "number" ? preItem.filter : void 0;
      item.useValueConditions = preItem.useValueConditions ? preItem.useValueConditions : void 0;
      item.minValue = typeof preItem.minValue === "number" ? preItem.minValue : void 0;
      item.maxValue = typeof preItem.maxValue === "number" ? preItem.maxValue : void 0;
      item.secondRow = preItem.secondRow ? preItem.secondRow : void 0;
      item.minValueBrightness = preItem.minValueBrightness ? preItem.minValueBrightness : void 0;
      item.maxValueBrightness = preItem.maxValueBrightness ? preItem.maxValueBrightness : void 0;
      item.minValueColorTemp = preItem.minValueColorTemp ? preItem.minValueColorTemp : void 0;
      item.maxValueColorTemp = preItem.maxValueColorTemp ? preItem.maxValueColorTemp : void 0;
      item.colormode = preItem.colormode === true ? "xy" : void 0;
    }
  }
  return item;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  adminPageItemToScriptItem
});
//# sourceMappingURL=admin-page-item.js.map
