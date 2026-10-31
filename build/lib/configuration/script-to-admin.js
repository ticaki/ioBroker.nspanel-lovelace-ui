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
var script_to_admin_exports = {};
__export(script_to_admin_exports, {
  planScriptToAdmin: () => planScriptToAdmin
});
module.exports = __toCommonJS(script_to_admin_exports);
var import_config_manager_const = require("../const/config-manager-const");
var import_default_pages = require("../const/default-pages");
var import_adminShareConfig = require("../types/adminShareConfig");
var import_function_and_const = require("../types/function-and-const");
var import_admin_screensaver = require("./admin-screensaver");
var import_global_config_merge = require("./global-config-merge");
class ConvertError extends Error {
  constructor(reason, detail) {
    super(`${reason}: ${detail}`);
    this.reason = reason;
    this.detail = detail;
  }
}
function isDict(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function rejectUnknownKeys(obj, mapped, ignored, reason, where) {
  for (const key of Object.keys(obj)) {
    if (obj[key] === void 0 || mapped.includes(key) || ignored.includes(key)) {
      continue;
    }
    throw new ConvertError(reason, `${where}.${key}: not available in the admin`);
  }
}
function rgbToHex(value, reason, where) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (isDict(value)) {
    const parts = [value.red, value.green, value.blue];
    if (parts.every((p) => typeof p === "number" && Number.isInteger(p) && p >= 0 && p <= 255)) {
      return `#${parts.map((p) => p.toString(16).padStart(2, "0")).join("")}`;
    }
  }
  throw new ConvertError(reason, `${where}: only an RGB object {red, green, blue} can be converted`);
}
function str(value, reason, where) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value !== "string") {
    throw new ConvertError(reason, `${where}: expected a text`);
  }
  return value;
}
function trimmedText(value, reason, where) {
  const text = str(value, reason, where);
  if (text === void 0 || text === "") {
    return void 0;
  }
  if (text.trim() !== text) {
    throw new ConvertError(reason, `${where}: the admin trims the text`);
  }
  return text;
}
function num(value, reason, where) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ConvertError(reason, `${where}: expected a number`);
  }
  return value;
}
function bool(value, reason, where) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  if (typeof value !== "boolean") {
    throw new ConvertError(reason, `${where}: expected true or false`);
  }
  return value;
}
function colorScaleToAdmin(value, reason, where) {
  var _a;
  if (value === void 0 || value === null) {
    return void 0;
  }
  const scale = isDict(value) ? { ...value } : value;
  const best = isDict(scale) ? scale.color_best : void 0;
  if (isDict(scale)) {
    delete scale.color_best;
  }
  if (!(0, import_function_and_const.isIconColorScaleElement)(scale)) {
    throw new ConvertError(reason, `${where}: only a color scale {val_min, val_max, ...} can be converted`);
  }
  if (best === void 0 || best === null) {
    return scale;
  }
  const hex = (_a = rgbToHex(best, reason, `${where}.color_best`)) != null ? _a : "#000000";
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return { ...scale, color_best: { r, g, b } };
}
function looksLikeStateId(text) {
  if (text === "///timeString") {
    return false;
  }
  return text.startsWith("///") || /^[a-zA-Z0-9_-]+\.\d+\./.test(text);
}
const itemMappedKeys = [
  "navigate",
  "targetPage",
  "id",
  "type",
  "icon",
  "icon2",
  "onColor",
  "offColor",
  "colorScale",
  "targetPageLongPress",
  "longPress",
  "prefixName",
  "suffixName",
  "prefixValue",
  "suffixValue",
  "name",
  "unit",
  "modeList",
  "useValue",
  "inSel_Alias",
  "fontSize",
  "filter",
  "useValueConditions",
  "minValue",
  "maxValue",
  "secondRow",
  "minValueBrightness",
  "maxValueBrightness",
  "minValueColorTemp",
  "maxValueColorTemp",
  "colormode"
];
const itemIgnoredKeys = [
  "uniqueName",
  "popupVersion",
  "useColor",
  "interpolateColor",
  "hidePassword",
  "autoCreateALias",
  "yAxis",
  "yAxisTicks",
  "xAxisDecorationId",
  "monobutton",
  "inSel_ChoiceState",
  "iconArray",
  "customIcons",
  "actionStringArray",
  "shutterType",
  "alwaysOnDisplay"
];
const customItemMappedKeys = [
  "type",
  "id",
  "navigate",
  "targetPage",
  "targetPageLongPress",
  "longPress",
  "icon",
  "icon2",
  "name",
  "onColor",
  "offColor",
  "colorScale"
];
function isEmptyPlace(item) {
  return !item.navigate && !("native" in item) && (item.id === "empty" || item.id === "delete");
}
function convertPageItem(item, where) {
  var _a, _b, _c;
  const reason = "itemNotSupported";
  if ("native" in item) {
    throw new ConvertError(reason, `${where}: native item`);
  }
  const custom = item.type === "custom";
  if (item.type !== void 0 && item.type !== null && !custom) {
    throw new ConvertError(reason, `${where}.type: unknown type`);
  }
  if (custom) {
    rejectUnknownKeys(item, customItemMappedKeys, [], reason, where);
  } else {
    rejectUnknownKeys(item, itemMappedKeys, itemIgnoredKeys, reason, where);
  }
  const id = str(item.id, reason, `${where}.id`);
  const navigate = item.navigate === true;
  if (item.navigate !== void 0 && item.navigate !== null && typeof item.navigate !== "boolean") {
    throw new ConvertError(reason, `${where}.navigate: expected true or false`);
  }
  const targetPage = str(item.targetPage, reason, `${where}.targetPage`);
  if (navigate && !targetPage) {
    throw new ConvertError(reason, `${where}: navigate without targetPage`);
  }
  if (!navigate && targetPage && custom) {
    throw new ConvertError(reason, `${where}.targetPage: only used with navigate: true`);
  }
  if (!navigate && !id) {
    throw new ConvertError(reason, `${where}: id missing`);
  }
  if (!id && custom) {
    throw new ConvertError(reason, `${where}: id missing`);
  }
  const channelId = {
    valueStateId: id != null ? id : "",
    unit: "",
    prefix: "",
    suffix: "",
    dateFormat: ""
  };
  const admin = { channelId };
  if (navigate) {
    admin.isNavigation = true;
    admin.targetPage = targetPage;
  } else if (targetPage) {
    admin.targetPage = targetPage;
  }
  if (custom) {
    admin.type = "custom";
  }
  const icon = str(item.icon, reason, `${where}.icon`);
  if (icon !== void 0) {
    admin.trueIcon = icon;
  }
  const icon2 = str(item.icon2, reason, `${where}.icon2`);
  if (icon2 !== void 0) {
    admin.falseIcon = icon2;
  }
  const onColor = rgbToHex(item.onColor, reason, `${where}.onColor`);
  if (onColor !== void 0) {
    admin.trueColor = onColor;
  }
  const offColor = rgbToHex(item.offColor, reason, `${where}.offColor`);
  if (offColor !== void 0) {
    admin.falseColor = offColor;
  }
  const longPress = str(item.longPress, reason, `${where}.longPress`);
  if (longPress !== void 0) {
    admin.longPress = longPress;
  }
  const targetPageLongPress = str(item.targetPageLongPress, reason, `${where}.targetPageLongPress`);
  if (targetPageLongPress !== void 0) {
    admin.targetPageLongPress = targetPageLongPress;
  }
  const scale = colorScaleToAdmin(item.colorScale, reason, `${where}.colorScale`);
  if (scale !== void 0) {
    admin.scale = scale;
  }
  const name = str(item.name, reason, `${where}.name`);
  if (custom) {
    if (name !== void 0) {
      admin.name = name;
    }
    return admin;
  }
  const prefixName = str(item.prefixName, reason, `${where}.prefixName`);
  const suffixName = str(item.suffixName, reason, `${where}.suffixName`);
  if (prefixName || suffixName) {
    admin.valueEntry = {
      valueStateId: name != null ? name : "",
      unit: "",
      prefix: prefixName != null ? prefixName : "",
      suffix: suffixName != null ? suffixName : "",
      dateFormat: ""
    };
  } else if (name !== void 0) {
    admin.name = name;
  }
  channelId.prefix = (_a = str(item.prefixValue, reason, `${where}.prefixValue`)) != null ? _a : "";
  channelId.suffix = (_b = str(item.suffixValue, reason, `${where}.suffixValue`)) != null ? _b : "";
  channelId.unit = (_c = str(item.unit, reason, `${where}.unit`)) != null ? _c : "";
  const fontSize = num(item.fontSize, reason, `${where}.fontSize`);
  if (fontSize !== void 0) {
    if (![0, 1, 2, 3, 4, 5].includes(fontSize)) {
      throw new ConvertError(reason, `${where}.fontSize: expected 0 to 5`);
    }
    admin.textSize = fontSize;
  }
  const useValue = bool(item.useValue, reason, `${where}.useValue`);
  if (useValue !== void 0) {
    admin.useValue = useValue;
  }
  const inSel = str(item.inSel_Alias, reason, `${where}.inSel_Alias`);
  if (inSel !== void 0) {
    admin.inSel_Alias = inSel;
  }
  if (item.modeList !== void 0 && item.modeList !== null) {
    const list = item.modeList;
    if (!Array.isArray(list) || list.length === 0 || !list.every((m) => typeof m === "string")) {
      throw new ConvertError(reason, `${where}.modeList: expected a list of texts with at least one entry`);
    }
    admin.modeList = [...list];
  }
  const filter = num(item.filter, reason, `${where}.filter`);
  if (filter !== void 0) {
    admin.filter = filter;
  }
  const useValueConditions = str(item.useValueConditions, reason, `${where}.useValueConditions`);
  if (useValueConditions) {
    admin.useValueConditions = useValueConditions;
  }
  const minValue = num(item.minValue, reason, `${where}.minValue`);
  if (minValue !== void 0) {
    admin.minValue = minValue;
  }
  const maxValue = num(item.maxValue, reason, `${where}.maxValue`);
  if (maxValue !== void 0) {
    admin.maxValue = maxValue;
  }
  const secondRow = str(item.secondRow, reason, `${where}.secondRow`);
  if (secondRow) {
    admin.secondRow = secondRow;
  }
  for (const key of ["minValueBrightness", "maxValueBrightness", "minValueColorTemp", "maxValueColorTemp"]) {
    const value = num(item[key], reason, `${where}.${key}`);
    if (value) {
      admin[key] = value;
    }
  }
  if (item.colormode) {
    admin.colormode = true;
  }
  return admin;
}
function isEmptyAdminItem(item) {
  const id = item.channelId.valueStateId;
  return !item.isNavigation && !item.useNative && (id === "empty" || id === "delete");
}
function isDroppedItem(item) {
  return !item.navigate && !("native" in item) && item.type !== "custom" && !item.id;
}
function rawPageItem(item) {
  const nativeOnly = isDict(item.native) && Object.keys(item).every((key) => key === "native" || item[key] === void 0);
  const format = nativeOnly ? "native" : "script";
  const native = structuredClone(nativeOnly && isDict(item.native) ? item.native : item);
  return {
    admin: { channelId: (0, import_adminShareConfig.emptyChannelValueConfig)(""), useNative: true, nativeFormat: format, native },
    format
  };
}
function withoutLongPress(item) {
  let dropped = false;
  const out = { ...item };
  for (const key of ["longPress", "targetPageLongPress"]) {
    if (key in out) {
      dropped || (dropped = out[key] !== void 0 && out[key] !== null && out[key] !== "");
      delete out[key];
    }
  }
  if (isDict(out.native) && isDict(out.native.data)) {
    const data = { ...out.native.data };
    let changed = false;
    for (const key of ["setNaviLongPress", "longPress"]) {
      if (key in data) {
        dropped || (dropped = data[key] !== void 0 && data[key] !== null);
        delete data[key];
        changed = true;
      }
    }
    if (changed) {
      out.native = { ...out.native, data };
    }
  }
  return { item: out, dropped };
}
function convertPageItems(items, rawItems, longPressDropped) {
  if (items === void 0 || items === null) {
    return [];
  }
  if (!Array.isArray(items)) {
    throw new ConvertError("fieldNotSupported", "items: expected a list");
  }
  const out = [];
  items.forEach((scriptItem, index) => {
    if (scriptItem === null || scriptItem === void 0) {
      return;
    }
    if (!isDict(scriptItem)) {
      throw new ConvertError("itemNotSupported", `items[${index}]: expected an object`);
    }
    if (isEmptyPlace(scriptItem)) {
      out.push(void 0);
      return;
    }
    if (isDroppedItem(scriptItem)) {
      return;
    }
    const where = `items[${index}]`;
    let item = scriptItem;
    if (longPressDropped) {
      const stripped = withoutLongPress(scriptItem);
      item = stripped.item;
      if (stripped.dropped) {
        longPressDropped.push(where);
      }
    }
    try {
      out.push(convertPageItem(item, where));
    } catch (error) {
      if (!(error instanceof ConvertError)) {
        throw error;
      }
      const raw = rawPageItem(item);
      out.push(raw.admin);
      rawItems.push({ item: where, format: raw.format, detail: error.detail });
    }
  });
  for (let i = out.length - 1; i >= 0 && out[i] === void 0; i--) {
    out[i] = { channelId: (0, import_adminShareConfig.emptyChannelValueConfig)("empty") };
  }
  return out;
}
const pageMappedKeys = [
  "type",
  "uniqueName",
  "heading",
  "items",
  "prev",
  "next",
  "home",
  "parent",
  "hiddenByTrigger",
  "alwaysOnDisplay"
];
const pageIgnoredKeys = [
  "useColor",
  "subPage",
  "filterType",
  "prevIcon",
  "prevIconColor",
  "nextIcon",
  "nextIconColor",
  "homeIcon",
  "homeIconColor",
  "parentIcon",
  "parentIconColor"
];
const scrollKeys = ["scrollType", "scrollPresentation", "scrollAutoTiming"];
function entryCoversPanel(entry, topic) {
  var _a;
  const assignments = (_a = entry.navigationAssignment) != null ? _a : [];
  const all = assignments.find((a) => a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID);
  const own = assignments.find((a) => a.topic === topic);
  if (own) {
    return !(!own.navigation && all);
  }
  return !!all;
}
function pageNavigation(page, isSub) {
  const reason = "fieldNotSupported";
  if (!isSub) {
    return {};
  }
  const links = {};
  for (const key of ["prev", "next", "home", "parent"]) {
    const value = str(page[key], reason, key);
    if (value) {
      links[key] = value;
    }
  }
  if (links.prev) {
    delete links.parent;
  }
  if (links.next) {
    delete links.home;
  }
  if (!links.prev && !links.next && !links.home && !links.parent) {
    links.home = import_default_pages.mainPageName;
  }
  return links;
}
function ringLinks(name, ring, staysInScript) {
  const index = ring.indexOf(name);
  const links = {};
  if (index > 0) {
    links.prev = ring[index - 1];
  } else if (index === 0 && !ring.includes(import_default_pages.mainPageName)) {
    links.prev = import_default_pages.mainPageName;
  }
  if (index === -1) {
    return links;
  }
  if (index === ring.length - 1) {
    if (name !== import_default_pages.mainPageName) {
      links.next = import_adminShareConfig.servicePageName;
    }
    return links;
  }
  const next = ring[index + 1];
  if (staysInScript(next)) {
    links.next = next;
  }
  return links;
}
function pageCommon(page, isSub) {
  var _a, _b;
  const reason = "fieldNotSupported";
  const uniqueName = String(page.uniqueName);
  let heading = (_a = str(page.heading, reason, "heading")) != null ? _a : "";
  if (!heading) {
    if (page.type !== "cardThermo") {
      throw new ConvertError(reason, "heading: empty - the admin shows the uniqueName instead");
    }
    heading = "thermostat";
  }
  if (looksLikeStateId(heading)) {
    throw new ConvertError(reason, "heading: looks like a state id - the admin shows the text itself");
  }
  const hidden = (_b = bool(page.hiddenByTrigger, reason, "hiddenByTrigger")) != null ? _b : false;
  let alwaysOn = "none";
  const aod = page.alwaysOnDisplay;
  if (aod === true) {
    alwaysOn = "always";
  } else if (aod === "action") {
    alwaysOn = "action";
  } else if (aod !== void 0 && aod !== null && aod !== false) {
    throw new ConvertError(reason, "alwaysOnDisplay: expected true, false or action");
  }
  return { uniqueName, headline: heading, hidden, alwaysOn, navigation: pageNavigation(page, isSub) };
}
function scrollFields(page, card) {
  var _a, _b;
  const reason = "fieldNotSupported";
  const fields = {};
  const type = page.scrollType;
  if (type !== void 0 && type !== null) {
    if (type !== "page" && type !== "half") {
      throw new ConvertError(reason, "scrollType: expected page or half");
    }
    fields.scrollType = type;
  }
  const presentation = page.scrollPresentation;
  if (presentation !== void 0 && presentation !== null) {
    if (presentation !== "classic" && presentation !== "arrow" && presentation !== "auto") {
      throw new ConvertError(reason, "scrollPresentation: expected classic, arrow or auto");
    }
    fields.scrollPresentation = presentation;
  }
  const timing = num(page.scrollAutoTiming, reason, "scrollAutoTiming");
  if (timing !== void 0 && fields.scrollPresentation === "auto") {
    fields.scrollAutoTiming = timing;
  }
  const scriptType = (_a = fields.scrollType) != null ? _a : "page";
  const scriptPresentation = (_b = fields.scrollPresentation) != null ? _b : "classic";
  const scriptTiming = scriptPresentation === "auto" ? fields.scrollAutoTiming || 15 : void 0;
  const admin = (0, import_adminShareConfig.normalizeScrollFields)(fields, card);
  if (admin.scrollType !== scriptType) {
    throw new ConvertError(reason, `scrollType: ${scriptType} is not available for ${card} in the admin`);
  }
  if (admin.scrollPresentation !== scriptPresentation) {
    throw new ConvertError(reason, `scrollPresentation: ${scriptPresentation} is not available in the admin`);
  }
  if (admin.scrollPresentation === "auto" && admin.scrollAutoTiming !== scriptTiming) {
    throw new ConvertError(reason, `scrollAutoTiming: ${String(scriptTiming)} is not available in the admin`);
  }
  return fields;
}
function convertMenuPage(page, common, topic, rawItems, longPressDropped) {
  rejectUnknownKeys(page, [...pageMappedKeys, ...scrollKeys], pageIgnoredKeys, "fieldNotSupported", "page");
  const card = page.type;
  return {
    card,
    uniqueName: common.uniqueName,
    headline: common.headline,
    pageItems: convertPageItems(page.items, rawItems, (0, import_adminShareConfig.isLongPressCard)(card) ? void 0 : longPressDropped),
    hidden: common.hidden,
    alwaysOn: common.alwaysOn,
    ...scrollFields(page, card),
    navigationAssignment: [{ topic, navigation: common.navigation }]
  };
}
const thermo2CommonKeys = [
  "name",
  "minValue",
  "maxValue",
  "stepValue",
  "icon",
  "onColor",
  "unit",
  "icon2",
  "onColor2",
  "unit2",
  "iconHeatCycle",
  "iconHeatCycleOnColor",
  "iconHeatCycleOffColor",
  "modeList",
  "power"
];
const thermo2AliasKeys = ["id", "name2", "iconHeatCycle2", "iconHeatCycleOnColor2", "iconHeatCycleOffColor2"];
const thermo2StateKeys = ["set", "thermoId1", "thermoId2", "modeId"];
function thermo2LimitOf(value, where) {
  const n = num(value, "fieldNotSupported", where);
  if (n !== void 0 && n <= 0) {
    throw new ConvertError("fieldNotSupported", `${where}: the admin only takes positive numbers`);
  }
  return n;
}
function convertThermo2Circuit(item, where) {
  const reason = "fieldNotSupported";
  const alias = "id" in item && item.id !== void 0;
  rejectUnknownKeys(
    item,
    [...thermo2CommonKeys, ...alias ? thermo2AliasKeys : thermo2StateKeys],
    [],
    reason,
    where
  );
  const power = str(item.power, reason, `${where}.power`);
  if (power) {
    throw new ConvertError(reason, `${where}.power: the admin has no power state`);
  }
  const circuit = { channelId: "" };
  const set = (key, value) => {
    if (value !== void 0) {
      circuit[key] = value;
    }
  };
  set("name", trimmedText(item.name, reason, `${where}.name`));
  set("minValue", thermo2LimitOf(item.minValue, `${where}.minValue`));
  set("maxValue", thermo2LimitOf(item.maxValue, `${where}.maxValue`));
  set("stepValue", thermo2LimitOf(item.stepValue, `${where}.stepValue`));
  set("icon", trimmedText(item.icon, reason, `${where}.icon`));
  set("onColor", rgbToHex(item.onColor, reason, `${where}.onColor`));
  set("unit", trimmedText(item.unit, reason, `${where}.unit`));
  set("icon2", trimmedText(item.icon2, reason, `${where}.icon2`));
  set("onColor2", rgbToHex(item.onColor2, reason, `${where}.onColor2`));
  set("unit2", trimmedText(item.unit2, reason, `${where}.unit2`));
  set("iconHeatCycle", trimmedText(item.iconHeatCycle, reason, `${where}.iconHeatCycle`));
  set("iconHeatCycleOnColor", rgbToHex(item.iconHeatCycleOnColor, reason, `${where}.iconHeatCycleOnColor`));
  set("iconHeatCycleOffColor", rgbToHex(item.iconHeatCycleOffColor, reason, `${where}.iconHeatCycleOffColor`));
  if (item.modeList !== void 0 && item.modeList !== null) {
    const list = item.modeList;
    if (!Array.isArray(list) || list.length === 0 || !list.every((m) => typeof m === "string" && m.trim() === m && m !== "")) {
      throw new ConvertError(reason, `${where}.modeList: expected trimmed texts with at least one entry`);
    }
    circuit.modeList = [...list];
  }
  if (alias) {
    const id = trimmedText(item.id, reason, `${where}.id`);
    if (!id) {
      throw new ConvertError(reason, `${where}.id: empty`);
    }
    circuit.source = "alias";
    circuit.channelId = id;
    set("name2", trimmedText(item.name2, reason, `${where}.name2`));
    set("iconHeatCycle2", trimmedText(item.iconHeatCycle2, reason, `${where}.iconHeatCycle2`));
    set("iconHeatCycleOnColor2", rgbToHex(item.iconHeatCycleOnColor2, reason, `${where}.iconHeatCycleOnColor2`));
    set("iconHeatCycleOffColor2", rgbToHex(item.iconHeatCycleOffColor2, reason, `${where}.iconHeatCycleOffColor2`));
    return circuit;
  }
  const setState = trimmedText(item.set, reason, `${where}.set`);
  const actual = trimmedText(item.thermoId1, reason, `${where}.thermoId1`);
  if (!setState || !actual) {
    throw new ConvertError(reason, `${where}: set and thermoId1 are required`);
  }
  circuit.source = "states";
  circuit.setState = setState;
  circuit.actualState = actual;
  set("humidityState", trimmedText(item.thermoId2, reason, `${where}.thermoId2`));
  set("modeState", trimmedText(item.modeId, reason, `${where}.modeId`));
  return circuit;
}
function convertThermo2Page(page, common, topic, rawItems, longPressDropped) {
  const reason = "fieldNotSupported";
  rejectUnknownKeys(
    page,
    [...pageMappedKeys, ...scrollKeys, "thermoItems", "sortOrder"],
    pageIgnoredKeys,
    reason,
    "page"
  );
  const items = page.thermoItems;
  if (!Array.isArray(items)) {
    throw new ConvertError(reason, "thermoItems: expected a list");
  }
  const thermoItems = [];
  items.forEach((item, index) => {
    if (item === null || item === void 0) {
      return;
    }
    if (!isDict(item)) {
      throw new ConvertError(reason, `thermoItems[${index}]: expected an object`);
    }
    thermoItems.push(convertThermo2Circuit(item, `thermoItems[${index}]`));
  });
  const sortOrder = page.sortOrder;
  if (sortOrder !== void 0 && sortOrder !== null && !import_adminShareConfig.thermo2SortOrders.includes(sortOrder)) {
    throw new ConvertError(reason, "sortOrder: unknown value");
  }
  const entry = {
    card: "cardThermo2",
    uniqueName: common.uniqueName,
    headline: common.headline,
    thermoItems,
    pageItems: convertPageItems(page.items, rawItems, longPressDropped),
    hidden: common.hidden,
    alwaysOn: common.alwaysOn,
    ...scrollFields(page, "cardThermo2"),
    navigationAssignment: [{ topic, navigation: common.navigation }]
  };
  if (sortOrder !== void 0 && sortOrder !== null) {
    entry.sortOrder = sortOrder;
  }
  return entry;
}
function convertThermoPage(page, common, topic) {
  const reason = "fieldNotSupported";
  rejectUnknownKeys(page, pageMappedKeys, pageIgnoredKeys, reason, "page");
  const items = page.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new ConvertError(reason, "items: expected a list with the thermostat as first entry");
  }
  const item = items[0];
  if (!isDict(item)) {
    throw new ConvertError(reason, "items[0]: expected an object");
  }
  if (item.native !== void 0 && item.native !== null) {
    throw new ConvertError(reason, "items[0]: native item");
  }
  if (item.navigate === true) {
    throw new ConvertError(reason, "items[0].navigate: the thermostat page has no navigation item");
  }
  const id = trimmedText(item.id, reason, "items[0].id");
  if (!id) {
    throw new ConvertError(reason, "items[0].id: missing");
  }
  const unit = trimmedText(item.unit, reason, "items[0].unit");
  if (item.unit !== void 0 && item.unit !== null && !unit) {
    throw new ConvertError(reason, "items[0].unit: empty - the admin shows the unit of the state instead");
  }
  const entry = {
    card: "cardThermo",
    uniqueName: common.uniqueName,
    headline: common.headline,
    channelId: id,
    hidden: common.hidden,
    alwaysOn: common.alwaysOn,
    navigationAssignment: [{ topic, navigation: common.navigation }]
  };
  if (unit !== void 0) {
    entry.unit = unit;
  }
  const minValue = num(item.minValue, reason, "items[0].minValue");
  if (minValue !== void 0) {
    entry.minValue = minValue;
  }
  const maxValue = num(item.maxValue, reason, "items[0].maxValue");
  if (maxValue !== void 0) {
    entry.maxValue = maxValue;
  }
  const stepValue = num(item.stepValue, reason, "items[0].stepValue");
  if (stepValue !== void 0) {
    entry.stepValue = stepValue;
  }
  return entry;
}
const mediaMappedKeys = [
  "id",
  "name",
  "colorMediaIcon",
  "colorMediaArtist",
  "colorMediaTitle",
  "speakerList",
  "volumePresets",
  "favoriteList",
  "playList",
  "minValue",
  "maxValue",
  "itemsColorOn",
  "itemsColorOff",
  "deactivateDefaultItems"
];
const mediaToolbarItems = [
  "reminder",
  "online",
  "speakerList",
  "favoriteList",
  "playList",
  "equalizer",
  "clock",
  "volumePresets",
  "trackList",
  "repeat",
  "crossfade"
];
function mediaNameList(value, where) {
  if (value === void 0 || value === null) {
    return void 0;
  }
  const reason = "fieldNotSupported";
  if (!Array.isArray(value)) {
    throw new ConvertError(reason, `${where}: expected a list of names`);
  }
  const names = value;
  if (!names.every((n) => typeof n === "string" && n.trim() === n && n !== "")) {
    throw new ConvertError(reason, `${where}: expected trimmed, non-empty names`);
  }
  const unique = [...new Set(names)];
  return unique.length ? unique : void 0;
}
function convertMediaPage(page, common, topic, rawItems, longPressDropped) {
  const reason = "fieldNotSupported";
  rejectUnknownKeys(page, [...pageMappedKeys, ...scrollKeys, "media"], pageIgnoredKeys, reason, "page");
  const media = page.media;
  if (!isDict(media)) {
    throw new ConvertError(reason, "media: missing (a cardMedia page without the media object)");
  }
  rejectUnknownKeys(media, mediaMappedKeys, [], reason, "media");
  const mediaId = trimmedText(media.id, reason, "media.id");
  if (!mediaId) {
    throw new ConvertError(reason, "media.id: empty");
  }
  const entry = {
    card: "cardMedia",
    uniqueName: common.uniqueName,
    headline: common.headline,
    mediaId,
    pageItems: convertPageItems(page.items, rawItems, longPressDropped),
    hidden: common.hidden,
    alwaysOn: common.alwaysOn,
    ...scrollFields(page, "cardMedia"),
    navigationAssignment: [{ topic, navigation: common.navigation }]
  };
  const name = trimmedText(media.name, reason, "media.name");
  if (name !== void 0) {
    entry.name = name;
  }
  const minValue = num(media.minValue, reason, "media.minValue");
  const maxValue = num(media.maxValue, reason, "media.maxValue");
  if (minValue !== void 0 && minValue < 0 || maxValue !== void 0 && maxValue < 0) {
    throw new ConvertError(reason, "media.minValue/maxValue: the admin only takes values from 0");
  }
  if (minValue !== void 0 && maxValue !== void 0 && minValue > maxValue) {
    throw new ConvertError(reason, "media.minValue/maxValue: the admin swaps a reversed range");
  }
  if (minValue !== void 0) {
    entry.minValue = minValue;
  }
  if (maxValue !== void 0) {
    entry.maxValue = maxValue;
  }
  for (const key of ["colorMediaIcon", "colorMediaArtist", "colorMediaTitle"]) {
    const hex = rgbToHex(media[key], reason, `media.${key}`);
    if (hex !== void 0) {
      entry[key] = hex;
    }
  }
  for (const key of ["speakerList", "playList", "favoriteList"]) {
    const list = mediaNameList(media[key], `media.${key}`);
    if (list !== void 0) {
      entry[key] = list;
    }
  }
  if (media.volumePresets !== void 0 && media.volumePresets !== null) {
    const presets = media.volumePresets;
    if (!Array.isArray(presets) || presets.length === 0) {
      throw new ConvertError(reason, "media.volumePresets: expected a list with at least one preset");
    }
    const low = minValue != null ? minValue : 0;
    const high = maxValue != null ? maxValue : 100;
    const out = [];
    for (const raw of presets) {
      const preset = typeof raw === "string" ? raw : "";
      const match = /^(.*)\?(-?\d+(?:\.\d+)?)$/.exec(preset);
      if (!match) {
        throw new ConvertError(reason, `media.volumePresets: '${preset}' is not name?value`);
      }
      const presetName = match[1];
      const value = Number(match[2]);
      if (presetName.trim() !== presetName || !presetName) {
        throw new ConvertError(reason, `media.volumePresets: '${preset}' - the admin trims the name`);
      }
      if (!Number.isInteger(value) || value < low || value > high) {
        throw new ConvertError(
          reason,
          `media.volumePresets: '${preset}' - the admin rounds the value and keeps it between ${low} and ${high}`
        );
      }
      out.push({ name: presetName, value });
    }
    entry.volumePresets = out;
  }
  const toolbar = {};
  const toolbarOf = (item, where) => {
    var _a;
    if (!mediaToolbarItems.includes(item)) {
      throw new ConvertError(reason, `${where}.${item}: unknown standard item`);
    }
    return (_a = toolbar[item]) != null ? _a : toolbar[item] = {};
  };
  if (media.deactivateDefaultItems !== void 0 && media.deactivateDefaultItems !== null) {
    const off = media.deactivateDefaultItems;
    if (!isDict(off)) {
      throw new ConvertError(reason, "media.deactivateDefaultItems: expected an object");
    }
    for (const [item, value] of Object.entries(off)) {
      if (value === void 0 || value === null || value === false) {
        continue;
      }
      if (value !== true || item === "volumePresets") {
        throw new ConvertError(reason, `media.deactivateDefaultItems.${item}: not available in the admin`);
      }
      toolbarOf(item, "media.deactivateDefaultItems").enabled = false;
    }
  }
  for (const [field, color] of [
    ["itemsColorOn", "colorOn"],
    ["itemsColorOff", "colorOff"]
  ]) {
    const colors = media[field];
    if (colors === void 0 || colors === null) {
      continue;
    }
    if (!isDict(colors)) {
      throw new ConvertError(reason, `media.${field}: expected an object`);
    }
    for (const [item, value] of Object.entries(colors)) {
      const hex = rgbToHex(value, reason, `media.${field}.${item}`);
      if (hex === void 0) {
        continue;
      }
      if (field === "itemsColorOff" && item === "volumePresets") {
        throw new ConvertError(reason, `media.${field}.${item}: not available in the admin`);
      }
      toolbarOf(item, `media.${field}`)[color] = hex;
    }
  }
  if (Object.keys(toolbar).length) {
    entry.toolbar = toolbar;
  }
  return entry;
}
function checkReferencePage(page, entry) {
  const reason = "fieldNotSupported";
  rejectUnknownKeys(page, pageMappedKeys, pageIgnoredKeys, reason, "page");
  if (Array.isArray(page.items) && page.items.some((i) => i !== null && i !== void 0)) {
    throw new ConvertError(reason, "items: the admin entry has no page items");
  }
  const heading = str(page.heading, reason, "heading");
  if (entry.card === "cardChart" && heading && heading !== entry.headline) {
    throw new ConvertError(reason, "heading: differs from the headline of the admin entry");
  }
  if (page.hiddenByTrigger === true && !entry.hidden) {
    throw new ConvertError(reason, "hiddenByTrigger: the admin entry is not hidden");
  }
  const aod = page.alwaysOnDisplay;
  const scriptAlways = entry.card === "cardPower" ? aod === true : !!aod;
  if (scriptAlways && entry.alwaysOn !== "always") {
    throw new ConvertError(reason, "alwaysOnDisplay: the admin entry is not always on");
  }
}
const screensaverStateKeys = [
  "type",
  "ScreensaverEntity",
  "ScreensaverEntityText",
  "ScreensaverEntityFactor",
  "ScreensaverEntityDecimalPlaces",
  "ScreensaverEntityDateFormat",
  "ScreensaverEntityIconOn",
  "ScreensaverEntityIconOff",
  "ScreensaverEntityUnitText",
  "ScreensaverEntityIconColor",
  "ScreensaverEntityOnColor",
  "ScreensaverEntityOffColor",
  "ScreensaverEntityOnText",
  "ScreensaverEntityOffText",
  "ScreensaverEntityNaviToPage",
  "ScreensaverEntityButton",
  "ScreensaverEntitySwitch",
  "ScreensaverEntityIconSelect",
  "ScreensaverEntityEnabled",
  "ScreensaverEntityVisibleCondition",
  "ScreensaverEntityFillIfBelowMin"
];
const screensaverTemplateKeys = ["type", "template", "dpInit", "modeScr", "enabled", "visibleCondition"];
const nativeTemplateKeys = ["template", "dpInit", "modeScr"];
function convertScreensaverItem(element, area, where, defaults) {
  var _a, _b, _c, _d;
  const reason = "screensaverItemNotSupported";
  if (element.type === "native") {
    const native = element.native;
    if (isDict(native) && Object.keys(native).every((key) => nativeTemplateKeys.includes(key) || native[key] === void 0) && typeof native.template === "string" && native.template !== "" && typeof native.dpInit === "string" && native.modeScr === area) {
      return { state: native.dpInit, template: native.template };
    }
    throw new ConvertError(reason, `${where}: native element`);
  }
  if (element.type === "template") {
    rejectUnknownKeys(element, screensaverTemplateKeys, [], reason, where);
    const template = str(element.template, reason, `${where}.template`);
    if (!template) {
      throw new ConvertError(reason, `${where}.template: empty`);
    }
    if (element.modeScr !== area) {
      throw new ConvertError(
        reason,
        `${where}.modeScr: ${String(element.modeScr)} differs from the area ${area}`
      );
    }
    const item2 = { state: (_a = str(element.dpInit, reason, `${where}.dpInit`)) != null ? _a : "", template };
    if (element.enabled !== void 0 && element.enabled !== null) {
      if (typeof element.enabled !== "string") {
        throw new ConvertError(reason, `${where}.enabled: the admin takes one state id`);
      }
      if (element.enabled) {
        item2.enabled = element.enabled;
      }
    }
    const condition2 = str(element.visibleCondition, reason, `${where}.visibleCondition`);
    if (condition2) {
      item2.visibleCondition = condition2;
    }
    return item2;
  }
  if (element.type !== "script") {
    throw new ConvertError(reason, `${where}.type: unknown type`);
  }
  rejectUnknownKeys(element, screensaverStateKeys, [], reason, where);
  const item = {
    state: (_b = str(element.ScreensaverEntity, reason, `${where}.ScreensaverEntity`)) != null ? _b : ""
  };
  const headline = str(element.ScreensaverEntityText, reason, `${where}.ScreensaverEntityText`);
  if (!headline) {
    throw new ConvertError(reason, `${where}.ScreensaverEntityText: empty - the admin shows the name of the state`);
  }
  item.headline = headline;
  const iconOn = str(element.ScreensaverEntityIconOn, reason, `${where}.ScreensaverEntityIconOn`);
  const iconOff = str(element.ScreensaverEntityIconOff, reason, `${where}.ScreensaverEntityIconOff`);
  const iconSelect = element.ScreensaverEntityIconSelect;
  if (iconSelect !== void 0 && iconSelect !== null) {
    if (!Array.isArray(iconSelect) || !iconSelect.every((s) => isDict(s) && typeof s.icon === "string" && typeof s.value === "number")) {
      throw new ConvertError(reason, `${where}.ScreensaverEntityIconSelect: expected a list of {icon, value}`);
    }
    item.iconSelect = iconSelect.map((s) => ({
      value: s.value,
      icon: s.icon
    }));
  }
  if (!iconOn && !((_c = item.iconSelect) == null ? void 0 : _c.length)) {
    throw new ConvertError(reason, `${where}.ScreensaverEntityIconOn: empty - the admin adds a default icon`);
  }
  if (iconOn) {
    item.iconOn = iconOn;
  }
  if (iconOff) {
    item.iconOff = iconOff;
  }
  const unit = str(element.ScreensaverEntityUnitText, reason, `${where}.ScreensaverEntityUnitText`);
  if (unit !== void 0) {
    item.unit = unit;
  }
  const factor = num(element.ScreensaverEntityFactor, reason, `${where}.ScreensaverEntityFactor`);
  if (factor !== void 0) {
    item.factor = factor;
  }
  const decimals = num(element.ScreensaverEntityDecimalPlaces, reason, `${where}.ScreensaverEntityDecimalPlaces`);
  if (decimals !== void 0) {
    item.decimals = decimals;
  }
  const dateFormat = element.ScreensaverEntityDateFormat;
  if (dateFormat !== void 0 && dateFormat !== null) {
    if (!isDict(dateFormat)) {
      throw new ConvertError(reason, `${where}.ScreensaverEntityDateFormat: expected an object`);
    }
    item.dateFormat = { ...dateFormat };
  }
  const textOn = str(element.ScreensaverEntityOnText, reason, `${where}.ScreensaverEntityOnText`);
  if (textOn) {
    item.textOn = textOn;
  }
  const textOff = str(element.ScreensaverEntityOffText, reason, `${where}.ScreensaverEntityOffText`);
  if (textOff) {
    item.textOff = textOff;
  }
  const onColor = element.ScreensaverEntityOnColor;
  if (typeof onColor === "string") {
    throw new ConvertError(reason, `${where}.ScreensaverEntityOnColor: the admin takes a fixed color only`);
  }
  let colorOn = rgbToHex(onColor, reason, `${where}.ScreensaverEntityOnColor`);
  const iconColor = element.ScreensaverEntityIconColor;
  if (iconColor !== void 0 && iconColor !== null && iconColor !== "") {
    if (isDict(iconColor) && (iconColor.val_min !== void 0 || iconColor.val_max !== void 0)) {
      const scale = colorScaleToAdmin(iconColor, reason, `${where}.ScreensaverEntityIconColor`);
      item.colorScale = scale;
    } else if (typeof iconColor === "string") {
      if (!colorOn) {
        item.colorState = iconColor;
      }
    } else if (!colorOn) {
      colorOn = rgbToHex(iconColor, reason, `${where}.ScreensaverEntityIconColor`);
    }
  }
  if (!colorOn && !item.colorState) {
    colorOn = defaults.on;
  }
  if (colorOn) {
    item.colorOn = colorOn;
  }
  const offColor = element.ScreensaverEntityOffColor;
  if (offColor === null) {
    throw new ConvertError(
      reason,
      `${where}.ScreensaverEntityOffColor: null (no off color) is not available in the admin`
    );
  }
  if (typeof offColor === "string") {
    throw new ConvertError(reason, `${where}.ScreensaverEntityOffColor: the admin takes a fixed color only`);
  }
  const colorOff = (_d = rgbToHex(offColor, reason, `${where}.ScreensaverEntityOffColor`)) != null ? _d : defaults.off;
  if (colorOff) {
    item.colorOff = colorOff;
  }
  const enabled = element.ScreensaverEntityEnabled;
  if (enabled !== void 0 && enabled !== null) {
    if (typeof enabled !== "string") {
      throw new ConvertError(reason, `${where}.ScreensaverEntityEnabled: expected a state id`);
    }
    if (enabled) {
      item.enabled = enabled;
    }
  }
  const condition = str(
    element.ScreensaverEntityVisibleCondition,
    reason,
    `${where}.ScreensaverEntityVisibleCondition`
  );
  if (condition) {
    item.visibleCondition = condition;
  }
  const fill = element.ScreensaverEntityFillIfBelowMin;
  if (fill !== void 0 && fill !== null && fill !== true) {
    throw new ConvertError(reason, `${where}.ScreensaverEntityFillIfBelowMin: not available in the admin`);
  }
  if (area === "indicator") {
    const button = str(element.ScreensaverEntityButton, reason, `${where}.ScreensaverEntityButton`);
    const switchState = str(element.ScreensaverEntitySwitch, reason, `${where}.ScreensaverEntitySwitch`);
    const navi = str(element.ScreensaverEntityNaviToPage, reason, `${where}.ScreensaverEntityNaviToPage`);
    if (button) {
      item.action = { kind: "button", state: button };
    } else if (switchState) {
      item.action = { kind: "switch", state: switchState };
    } else if (navi) {
      item.action = { kind: "navigate", page: navi };
    }
  }
  return item;
}
function hexToScriptRgb(hex) {
  return {
    red: parseInt(hex.substring(1, 3), 16),
    green: parseInt(hex.substring(3, 5), 16),
    blue: parseInt(hex.substring(5, 7), 16)
  };
}
function rawScreensaverItem(element, area, where, defaults) {
  const reason = "screensaverItemNotSupported";
  if (element.type === "native") {
    const native = element.native;
    if (!isDict(native)) {
      throw new ConvertError(reason, `${where}.native: expected an object`);
    }
    if (native.modeScr !== area) {
      throw new ConvertError(
        reason,
        `${where}.native.modeScr: ${String(native.modeScr)} differs from the area ${area}`
      );
    }
    return { item: { state: "", raw: { format: "native", config: structuredClone(native) } }, format: "native" };
  }
  if (element.type === "template" && element.modeScr !== area) {
    throw new ConvertError(reason, `${where}.modeScr: ${String(element.modeScr)} differs from the area ${area}`);
  }
  const config = structuredClone(element);
  if (config.type === "script") {
    const iconColor = config.ScreensaverEntityIconColor;
    const iconColorIsScale = isDict(iconColor) && (iconColor.val_min !== void 0 || iconColor.val_max !== void 0);
    if (!config.ScreensaverEntityOnColor && (!iconColor || iconColorIsScale) && defaults.on) {
      config.ScreensaverEntityOnColor = hexToScriptRgb(defaults.on);
    }
    if (config.ScreensaverEntityOffColor === void 0 && defaults.off) {
      config.ScreensaverEntityOffColor = hexToScriptRgb(defaults.off);
    }
  }
  return { item: { state: "", raw: { format: "script", config } }, format: "script" };
}
const mrIconKeys = [
  "type",
  "ScreensaverEntity",
  "ScreensaverEntityIconOn",
  "ScreensaverEntityIconSelect",
  "ScreensaverEntityIconOff",
  "ScreensaverEntityValue",
  "ScreensaverEntityValueDecimalPlace",
  "ScreensaverEntityValueUnit",
  "ScreensaverEntityOnColor",
  "ScreensaverEntityOffColor"
];
function convertMrIcon(element, where) {
  const reason = "screensaverItemNotSupported";
  if (element === void 0 || element === null) {
    return void 0;
  }
  if (!isDict(element)) {
    throw new ConvertError(reason, `${where}: expected an object`);
  }
  if (element.type !== "script") {
    throw new ConvertError(reason, `${where}: only script elements can be converted`);
  }
  rejectUnknownKeys(element, mrIconKeys, [], reason, where);
  const entity = str(element.ScreensaverEntity, reason, `${where}.ScreensaverEntity`);
  const value = str(element.ScreensaverEntityValue, reason, `${where}.ScreensaverEntityValue`);
  if (!entity && !value) {
    return null;
  }
  const cfg = {};
  if (entity) {
    cfg.entity = entity;
  }
  if (value) {
    cfg.value = value;
  }
  const iconOn = str(element.ScreensaverEntityIconOn, reason, `${where}.ScreensaverEntityIconOn`);
  if (iconOn) {
    cfg.iconOn = iconOn;
  }
  const iconOff = str(element.ScreensaverEntityIconOff, reason, `${where}.ScreensaverEntityIconOff`);
  if (iconOff) {
    cfg.iconOff = iconOff;
  }
  const select = element.ScreensaverEntityIconSelect;
  if (select !== void 0 && select !== null) {
    if (!isDict(select) || !Object.values(select).every((v) => typeof v === "string")) {
      throw new ConvertError(reason, `${where}.ScreensaverEntityIconSelect: expected {value: icon}`);
    }
    const list = Object.entries(select).map(([v, icon]) => ({ value: v, icon }));
    if (list.length) {
      cfg.iconSelect = list;
    }
  }
  const decimals = num(
    element.ScreensaverEntityValueDecimalPlace,
    reason,
    `${where}.ScreensaverEntityValueDecimalPlace`
  );
  if (decimals !== void 0) {
    cfg.valueDecimals = decimals;
  }
  const unit = str(element.ScreensaverEntityValueUnit, reason, `${where}.ScreensaverEntityValueUnit`);
  if (unit) {
    cfg.valueUnit = unit;
  }
  for (const [key, field] of [
    ["ScreensaverEntityOnColor", "onColor"],
    ["ScreensaverEntityOffColor", "offColor"]
  ]) {
    if (typeof element[key] === "string") {
      throw new ConvertError(reason, `${where}.${key}: the admin takes a fixed color only`);
    }
    const hex = rgbToHex(element[key], reason, `${where}.${key}`);
    if (hex) {
      cfg[field] = hex;
    }
  }
  return cfg;
}
const notifyKeys = [
  "type",
  "Priority",
  "Headline",
  "HeadlinePrefix",
  "HeadlineUnit",
  "Text",
  "TextSuffix",
  "TextPrefix",
  "HeadlineIcon",
  "isDismissiblePerEvent",
  "dismissibleIDGlobal",
  "buzzer",
  "Enabled",
  "VisibleCondition"
];
function convertNotify(element, where) {
  const reason = "screensaverItemNotSupported";
  if (!isDict(element)) {
    throw new ConvertError(reason, `${where}: expected an object`);
  }
  if (element.type !== "script") {
    throw new ConvertError(reason, `${where}: only script elements can be converted`);
  }
  rejectUnknownKeys(element, notifyKeys, [], reason, where);
  const rawEnabled = element.Enabled;
  const enabled = Array.isArray(rawEnabled) ? rawEnabled : rawEnabled === void 0 || rawEnabled === null ? [] : [rawEnabled];
  if (enabled.length === 0 || !enabled.every((e) => typeof e === "string" && e.trim() === e && e !== "")) {
    throw new ConvertError(reason, `${where}.Enabled: expected one or more trimmed state ids`);
  }
  const cfg = { enabled: [...enabled] };
  const condition = trimmedText(element.VisibleCondition, reason, `${where}.VisibleCondition`);
  if (condition) {
    cfg.visibleCondition = condition;
  }
  const priority = num(element.Priority, reason, `${where}.Priority`);
  if (priority !== void 0) {
    cfg.priority = priority;
  }
  const headline = str(element.Headline, reason, `${where}.Headline`);
  if (headline) {
    cfg.headline = headline;
  }
  const text = str(element.Text, reason, `${where}.Text`);
  if (text) {
    cfg.text = text;
  }
  for (const [key, field] of [
    ["HeadlinePrefix", "headlinePrefix"],
    ["HeadlineUnit", "headlineUnit"],
    ["HeadlineIcon", "headlineIcon"],
    ["TextPrefix", "textPrefix"],
    ["TextSuffix", "textSuffix"]
  ]) {
    const value = str(element[key], reason, `${where}.${key}`);
    if (value) {
      cfg[field] = value;
    }
  }
  const dismissible = bool(element.isDismissiblePerEvent, reason, `${where}.isDismissiblePerEvent`);
  if (dismissible) {
    cfg.dismissible = true;
    const globalId = trimmedText(element.dismissibleIDGlobal, reason, `${where}.dismissibleIDGlobal`);
    if (globalId) {
      cfg.dismissibleId = globalId;
    }
  }
  const buzzer = element.buzzer;
  if (buzzer === true) {
    cfg.buzzer = true;
  } else if (typeof buzzer === "string" && buzzer.trim()) {
    if (buzzer.trim() !== buzzer) {
      throw new ConvertError(reason, `${where}.buzzer: the admin trims the tone sequence`);
    }
    cfg.buzzer = buzzer;
  } else if (buzzer !== void 0 && buzzer !== null && buzzer !== false && buzzer !== "") {
    throw new ConvertError(reason, `${where}.buzzer: expected true or a tone sequence`);
  }
  return cfg;
}
function weatherItemsOf(value) {
  if (value === true) {
    return Object.fromEntries(import_adminShareConfig.screensaverWeatherItemKeys.map((k) => [k, true]));
  }
  if (!isDict(value)) {
    return void 0;
  }
  const items = {};
  for (const key of import_adminShareConfig.screensaverWeatherItemKeys) {
    if (value[key] === true) {
      items[key] = true;
    }
  }
  return Object.keys(items).length ? items : void 0;
}
function convertScreensaver(input) {
  var _a, _b, _c;
  const { raw, panel } = input;
  if ((0, import_admin_screensaver.findScreensaverEntry)(input.screensaverConfig, panel.topic).entry) {
    return { skipped: { reason: "screensaverExists" } };
  }
  try {
    const nativeItems = raw.nativePageItems;
    if (Array.isArray(nativeItems) && nativeItems.length) {
      throw new ConvertError("screensaverItemNotSupported", "nativePageItems: not available in the admin");
    }
    const defaults = {};
    try {
      defaults.on = rgbToHex(raw.defaultOnColor, "screensaverItemNotSupported", "defaultOnColor");
      defaults.off = rgbToHex(raw.defaultOffColor, "screensaverItemNotSupported", "defaultOffColor");
    } catch {
    }
    const rawItems = [];
    const area = (name, list, keepGaps) => {
      if (list === void 0 || list === null) {
        return [];
      }
      if (!Array.isArray(list)) {
        throw new ConvertError("screensaverItemNotSupported", `${name}: expected a list`);
      }
      const out = [];
      list.forEach((element, index) => {
        if (element === null || element === void 0) {
          if (keepGaps) {
            out.push(void 0);
          }
          return;
        }
        if (!isDict(element)) {
          throw new ConvertError("screensaverItemNotSupported", `${name}[${index}]: expected an object`);
        }
        const where = `${name}[${index}]`;
        try {
          out.push(convertScreensaverItem(element, name, where, defaults));
        } catch (error) {
          if (!(error instanceof ConvertError)) {
            throw error;
          }
          const raw2 = rawScreensaverItem(element, name, where, defaults);
          out.push(raw2.item);
          rawItems.push({ item: where, format: raw2.format, detail: error.detail });
        }
      });
      return out;
    };
    const single = (name, list) => {
      const items = area(name, list, false).filter((i) => !!i);
      if (items.length > 1) {
        throw new ConvertError("screensaverItemNotSupported", `${name}: the admin takes one item`);
      }
      return items[0];
    };
    const favorit = single("favorit", raw.favoritScreensaverEntity);
    const alternate = single("alternate", raw.alternateScreensaverEntity);
    const left = area("left", raw.leftScreensaverEntity, true);
    const bottom = area("bottom", raw.bottomScreensaverEntity, false);
    const indicator = area("indicator", raw.indicatorScreensaverEntity, true);
    const mrIcon1 = convertMrIcon(raw.mrIcon1ScreensaverEntity, "mrIcon1ScreensaverEntity");
    const mrIcon2 = convertMrIcon(raw.mrIcon2ScreensaverEntity, "mrIcon2ScreensaverEntity");
    const notifyList = raw.notifyScreensaverEntity;
    const notify = [];
    if (notifyList !== void 0 && notifyList !== null) {
      if (!Array.isArray(notifyList)) {
        throw new ConvertError("screensaverItemNotSupported", "notifyScreensaverEntity: expected a list");
      }
      const existing = [...input.screensaverNotify];
      notifyList.forEach((element, index) => {
        var _a2;
        const cfg = convertNotify(element, `notifyScreensaverEntity[${index}]`);
        const id = ((_a2 = input.notifyIdFactory) != null ? _a2 : import_adminShareConfig.newScreensaverNotifyId)(existing);
        const full = { id, name: `${panel.name} ${index + 1}`, ...cfg };
        existing.push(full);
        notify.push(full);
      });
    }
    const present = (list) => list.some((i) => !!i);
    if (!favorit && !alternate && !present(left) && !present(bottom) && !present(indicator) && !mrIcon1 && !mrIcon2 && notify.length === 0) {
      return { skipped: { reason: "screensaverEmpty" } };
    }
    for (const [icon, where] of [
      [mrIcon1, "mrIcon1ScreensaverEntity"],
      [mrIcon2, "mrIcon2ScreensaverEntity"]
    ]) {
      if (icon === null) {
        throw new ConvertError(
          "screensaverItemNotSupported",
          `${where}: without state and value - the script shows the off icon, the admin shows nothing`
        );
      }
    }
    const mode = (_a = input.screensaverMode) != null ? _a : present(left) || present(indicator) ? "advanced" : alternate ? "alternate" : "standard";
    const entry = {
      name: panel.name,
      mode,
      panels: [panel.topic],
      left,
      bottom,
      indicator,
      rotationTime: 0,
      screensaverSwipe: !!((_b = raw.advancedOptions) == null ? void 0 : _b.screensaverSwipe),
      screensaverIndicatorButtons: !!((_c = raw.advancedOptions) == null ? void 0 : _c.screensaverIndicatorButtons)
    };
    if (favorit) {
      entry.favorit = favorit;
    }
    if (alternate) {
      entry.alternate = alternate;
    }
    if (mrIcon1) {
      entry.mrIcon1 = mrIcon1;
    }
    if (mrIcon2) {
      entry.mrIcon2 = mrIcon2;
    }
    if (notify.length) {
      entry.notify = notify.map((n) => n.id);
    }
    if (!input.instanceWeatherEntity) {
      entry.weatherEntity = typeof raw.weatherEntity === "string" ? raw.weatherEntity : "";
    }
    const weatherItems = weatherItemsOf(raw.weatherAddDefaultItems);
    if (weatherItems) {
      entry.weatherAddDefaultItems = weatherItems;
    }
    return { entry, notify, rawItems };
  } catch (error) {
    if (error instanceof ConvertError) {
      return { skipped: { reason: error.reason, detail: error.detail } };
    }
    throw error;
  }
}
function emptyMrIcon() {
  return {
    type: "script",
    ScreensaverEntity: null,
    ScreensaverEntityIconOn: null,
    ScreensaverEntityIconSelect: void 0,
    ScreensaverEntityIconOff: null,
    ScreensaverEntityValue: null,
    ScreensaverEntityValueDecimalPlace: null,
    ScreensaverEntityValueUnit: null,
    ScreensaverEntityOnColor: { red: 0, green: 0, blue: 0 },
    ScreensaverEntityOffColor: { red: 0, green: 0, blue: 0 }
  };
}
const buttonModes = [
  "page",
  "switch",
  "button",
  "buttonOnDelayOff",
  "buttonOffDelayOn",
  "buttonDelayOn",
  "buttonDelayOff"
];
function isEmptyButton(value) {
  const mode = value.mode;
  if (typeof mode !== "string" || !buttonModes.some((m) => m === mode)) {
    return false;
  }
  const target = value[mode === "page" ? "page" : "state"];
  return target === void 0 || target === null || target === "";
}
function convertButton(value) {
  const reason = "buttonNotSupported";
  if (value === void 0 || value === null || isDict(value) && isEmptyButton(value)) {
    return void 0;
  }
  if (!isDict(value) || !(0, import_config_manager_const.isButton)(value)) {
    throw new ConvertError(reason, "not a valid button action");
  }
  const mode = value.mode;
  if (mode === "page") {
    rejectUnknownKeys(value, ["mode", "page"], [], reason, "button");
    return { mode, page: String(value.page) };
  }
  if (typeof value.state !== "string") {
    throw new ConvertError(reason, "state: expected a state id");
  }
  if (mode === "switch" || mode === "button") {
    rejectUnknownKeys(value, ["mode", "state"], [], reason, "button");
    return { mode, state: value.state };
  }
  rejectUnknownKeys(value, ["mode", "state", "delay"], [], reason, "button");
  const delay = num(value.delay, reason, "delay");
  const action = {
    mode,
    state: value.state
  };
  if (delay !== void 0) {
    action.delay = delay;
  }
  return action;
}
function scriptPageId(page) {
  if (!isDict(page)) {
    return "";
  }
  if (page.type === void 0) {
    const native = page.native;
    return isDict(native) && typeof native.uniqueID === "string" ? native.uniqueID : "";
  }
  return typeof page.uniqueName === "string" ? page.uniqueName : "";
}
function canonicalJson(value) {
  return JSON.stringify(value, (_key, v) => {
    if (isDict(v)) {
      const sorted = {};
      for (const key of Object.keys(v).sort()) {
        sorted[key] = v[key];
      }
      return sorted;
    }
    return v;
  });
}
function entryDifferences(a, b) {
  const left = { ...a };
  const right = { ...b };
  delete left.navigationAssignment;
  delete right.navigationAssignment;
  const keys = [.../* @__PURE__ */ new Set([...Object.keys(left), ...Object.keys(right)])].sort();
  return keys.filter((key) => canonicalJson(left[key]) !== canonicalJson(right[key]));
}
function entryAssignedToPanel(entry, topic) {
  var _a;
  const assignments = (_a = entry.navigationAssignment) != null ? _a : [];
  const own = assignments.find((a) => a.topic === topic);
  if (!own) {
    return false;
  }
  return !(!own.navigation && assignments.some((a) => a.topic === import_adminShareConfig.ALL_PANELS_SPECIAL_ID));
}
function globalLinkName(page) {
  if (!isDict(page) || typeof page.globalLink !== "string" || page.globalLink === "") {
    return "";
  }
  return typeof page.uniqueName === "string" ? page.uniqueName : page.globalLink;
}
function planScriptToAdmin(input) {
  const { raw, panel } = input;
  const plan = {
    panelTopic: panel.topic,
    panelName: panel.name,
    scriptId: typeof raw.scriptName === "string" ? raw.scriptName : "",
    scriptFound: !!input.scriptFound,
    pages: [],
    skipped: [],
    buttons: {},
    buttonsSkipped: [],
    nothingToDo: true
  };
  const newPages = [];
  let updatedPages = [...input.pageConfig];
  const removedFromScript = [];
  const removedPages = /* @__PURE__ */ new Set();
  const removedSubPages = /* @__PURE__ */ new Set();
  const removedLinks = /* @__PURE__ */ new Set();
  const conflicts = [];
  const remove = (uniqueName, isSub, source) => {
    (isSub ? removedSubPages : removedPages).add(uniqueName);
    if (!source) {
      removedFromScript.push(uniqueName);
    } else if (source.kind === "linked") {
      removedFromScript.push(uniqueName);
      removedLinks.add(uniqueName);
    }
  };
  const usedNames = new Set(updatedPages.map((e) => e.uniqueName));
  const rawPages = Array.isArray(raw.pages) ? raw.pages : [];
  const rawSubPages = Array.isArray(raw.subPages) ? raw.subPages : [];
  const merged = input.globalConfigRaw !== void 0 && input.globalConfigRaw !== null ? (0, import_global_config_merge.mergeGlobalConfig)(
    {
      pages: rawPages,
      subPages: rawSubPages,
      navigation: raw.navigation,
      nativePageItems: raw.nativePageItems
    },
    input.globalConfigRaw,
    { random: () => 0 }
  ) : void 0;
  const globalSource = (page) => merged && isDict(page) ? merged.sources.get(page) : void 0;
  const pages = merged ? merged.pages : rawPages;
  const mergedPageNames = new Set(pages.map(scriptPageId));
  const subPages = merged ? merged.subPages.filter((p) => {
    const source = globalSource(p);
    return !source || source.kind === "linked" || !mergedPageNames.has(scriptPageId(p));
  }) : rawSubPages;
  const scriptNavigation = merged ? merged.navigation : raw.navigation;
  const ring = pages.map(scriptPageId).filter((id) => id !== "");
  const mainIndex = ring.indexOf(import_default_pages.mainPageName);
  if (mainIndex > 0) {
    ring.unshift(...ring.splice(mainIndex, 1));
  }
  const mainPageNames = new Set(pages.filter((p) => isDict(p) && p.type !== void 0).map(scriptPageId));
  const deadRing = /* @__PURE__ */ new Set();
  for (const page of pages) {
    if (!isDict(page) || typeof page.type !== "string" || typeof page.uniqueName !== "string") {
      continue;
    }
    const type = page.type;
    let entry;
    if (type === "cardQR" || type === "cardAlarm" || type === "cardUnlock") {
      entry = input.pageConfig.find((e) => e.uniqueName === page.uniqueName);
    } else if (type === "cardPower" || type === "cardChart" || type === "cardLChart") {
      entry = type === "cardPower" ? (0, import_adminShareConfig.findPowerEntryForScript)(input.pageConfig, page.uniqueName) : (0, import_adminShareConfig.findChartEntryForScript)(input.pageConfig, page.uniqueName);
      if (entry && (type === "cardPower" ? (0, import_adminShareConfig.isScriptNavigatedPower)(entry) : (0, import_adminShareConfig.isScriptNavigatedChart)(entry))) {
        continue;
      }
    } else {
      continue;
    }
    if (!entry || !entryCoversPanel(entry, panel.topic)) {
      deadRing.add(page.uniqueName);
    }
  }
  const survivingRing = ring.filter((name) => !deadRing.has(name));
  const mainPageCovered = input.pageConfig.some(
    (e) => (e.uniqueName === import_default_pages.mainPageName || (0, import_adminShareConfig.isMainPageEntry)(e)) && entryCoversPanel(e, panel.topic)
  );
  const ringAssignments = /* @__PURE__ */ new Map();
  const explicitNavigation = new Set(
    (Array.isArray(scriptNavigation) ? scriptNavigation : []).map((n) => isDict(n) ? String(n.name) : "")
  );
  const skip = (uniqueName, type, reason, detail) => {
    plan.skipped.push(detail === void 0 ? { uniqueName, type, reason } : { uniqueName, type, reason, detail });
  };
  const convertPage = (page, isSub, typeName, uniqueName) => {
    if (explicitNavigation.has(uniqueName)) {
      throw new ConvertError("fieldNotSupported", "navigation: the script overrides the links of the page");
    }
    const common = pageCommon(page, isSub);
    const rawItems = [];
    const longPressDropped = [];
    let entry;
    if (typeName === "cardThermo2") {
      entry = convertThermo2Page(page, common, panel.topic, rawItems, longPressDropped);
    } else if (typeName === "cardThermo") {
      entry = convertThermoPage(page, common, panel.topic);
    } else if (typeName === "cardMedia") {
      entry = convertMediaPage(page, common, panel.topic, rawItems, longPressDropped);
    } else {
      entry = convertMenuPage(page, common, panel.topic, rawItems, longPressDropped);
    }
    return { entry, common, rawItems, longPressDropped };
  };
  const handleExistingGlobal = (page, isSub, typeName, uniqueName, existing, source) => {
    var _a, _b, _c, _d;
    if (entryAssignedToPanel(existing, panel.topic)) {
      if (source.kind === "linked") {
        plan.pages.push({
          uniqueName,
          type: typeName,
          card: existing.card,
          itemCount: 0,
          navigation: {},
          action: "removeReference",
          reason: "adminAlreadyNavigated",
          global: true
        });
        remove(uniqueName, isSub, source);
      }
      return;
    }
    let converted;
    try {
      converted = convertPage(page, isSub, typeName, uniqueName);
    } catch (error) {
      if (error instanceof ConvertError) {
        skip(uniqueName, typeName, error.reason, error.detail);
        return;
      }
      throw error;
    }
    const { entry, common } = converted;
    const differences = entryDifferences(entry, existing);
    let decision = "identical";
    if (differences.length > 0) {
      decision = (_b = (_a = input.globalDecisions) == null ? void 0 : _a[uniqueName]) != null ? _b : import_adminShareConfig.CONVERT_GLOBAL_DEFAULT_DECISION;
      conflicts.push({
        uniqueName,
        type: typeName,
        card: existing.card,
        decision,
        assignedPanels: ((_c = existing.navigationAssignment) != null ? _c : []).map((a) => a.topic),
        differences
      });
      if (decision === "skip") {
        skip(
          uniqueName,
          typeName,
          "nameExists",
          "the page of the global script differs from the admin entry - skipped by choice"
        );
        return;
      }
    }
    const assignment = { topic: panel.topic, navigation: common.navigation };
    const assignments = [...((_d = existing.navigationAssignment) != null ? _d : []).filter((a) => a.topic !== panel.topic), assignment];
    const replacement = decision === "takeScript" ? { ...entry, navigationAssignment: assignments } : { ...existing, navigationAssignment: assignments };
    updatedPages = updatedPages.map((e) => e === existing ? replacement : e);
    if (!isSub) {
      ringAssignments.set(uniqueName, assignment);
    }
    plan.pages.push({
      uniqueName,
      type: typeName,
      card: replacement.card,
      itemCount: ("pageItems" in replacement ? replacement.pageItems : []).filter(
        (i) => !!i && !isEmptyAdminItem(i)
      ).length,
      navigation: common.navigation,
      action: decision === "takeScript" ? "create" : "assignNavigation",
      global: true,
      existing: decision,
      ...decision === "takeScript" && converted.rawItems.length ? { rawItems: converted.rawItems } : {},
      ...decision === "takeScript" && converted.longPressDropped.length ? { longPressDropped: converted.longPressDropped } : {}
    });
    remove(uniqueName, isSub, source);
  };
  const handlePage = (page, isSub) => {
    var _a;
    if (page === null || page === void 0 || !isDict(page)) {
      return;
    }
    if ("globalLink" in page && page.globalLink) {
      const name = typeof page.uniqueName === "string" ? page.uniqueName : page.globalLink;
      skip(
        typeof name === "string" ? name : "",
        "globalLink",
        "unsupportedPageType",
        "page link of the global script"
      );
      return;
    }
    const type = page.type;
    if (type === void 0) {
      skip(scriptPageId(page), "native", "unsupportedPageType", "native page");
      return;
    }
    const typeName = typeof type === "string" ? type : "unknown";
    const uniqueName = typeof page.uniqueName === "string" ? page.uniqueName : "";
    if (!uniqueName) {
      skip("", typeName, "fieldNotSupported", "uniqueName missing");
      return;
    }
    const source = globalSource(page);
    if (source && (source.kind === "navigationCopy" || (merged == null ? void 0 : merged.copyRoots.has(uniqueName)))) {
      skip(
        uniqueName,
        typeName,
        "fieldNotSupported",
        "navigation copy of a renamed page of the global script (random name)"
      );
      return;
    }
    if (isSub && mainPageNames.has(uniqueName)) {
      skip(uniqueName, typeName, "nameExists", "a page of pages has the same name - the script ignores this one");
      return;
    }
    if (typeName === "cardQR" || typeName === "cardAlarm" || typeName === "cardUnlock") {
      if (source && source.kind !== "linked") {
        return;
      }
      plan.pages.push({
        uniqueName,
        type: typeName,
        card: typeName,
        itemCount: 0,
        navigation: {},
        action: "removeReference",
        reason: "adminOnly",
        ...source ? { global: true } : {}
      });
      remove(uniqueName, isSub, source);
      return;
    }
    if (typeName === "cardPower" || typeName === "cardChart" || typeName === "cardLChart") {
      const entry = typeName === "cardPower" ? (0, import_adminShareConfig.findPowerEntryForScript)(updatedPages, uniqueName) : (0, import_adminShareConfig.findChartEntryForScript)(updatedPages, uniqueName);
      if (!entry) {
        skip(uniqueName, typeName, "adminEntryMissing", "no admin entry with this name");
        return;
      }
      const navigated = typeName === "cardPower" ? (0, import_adminShareConfig.isScriptNavigatedPower)(entry) : (0, import_adminShareConfig.isScriptNavigatedChart)(entry);
      if (!navigated) {
        if (source && source.kind !== "linked") {
          return;
        }
        plan.pages.push({
          uniqueName,
          type: typeName,
          card: entry.card,
          itemCount: 0,
          navigation: {},
          action: "removeReference",
          reason: "adminAlreadyNavigated",
          ...source ? { global: true } : {}
        });
        remove(uniqueName, isSub, source);
        return;
      }
      try {
        checkReferencePage(page, entry);
        if (explicitNavigation.has(uniqueName)) {
          throw new ConvertError(
            "fieldNotSupported",
            "navigation: the script overrides the links of the page"
          );
        }
        const navigation = pageNavigation(page, isSub);
        const assignment = { topic: panel.topic, navigation };
        const assigned = (0, import_adminShareConfig.dropScriptNavigation)({
          ...entry,
          navigationAssignment: [...(_a = entry.navigationAssignment) != null ? _a : [], assignment]
        });
        updatedPages = updatedPages.map((e) => e === entry ? assigned : e);
        if (!isSub) {
          ringAssignments.set(uniqueName, assignment);
        }
        plan.pages.push({
          uniqueName,
          type: typeName,
          card: entry.card,
          itemCount: 0,
          navigation,
          action: "assignNavigation",
          ...source ? { global: true } : {}
        });
        remove(uniqueName, isSub, source);
      } catch (error) {
        if (error instanceof ConvertError) {
          skip(uniqueName, typeName, error.reason, error.detail);
          return;
        }
        throw error;
      }
      return;
    }
    if (typeName !== "cardGrid" && typeName !== "cardGrid2" && typeName !== "cardGrid3" && typeName !== "cardEntities" && typeName !== "cardSchedule" && typeName !== "cardThermo" && typeName !== "cardThermo2" && typeName !== "cardMedia") {
      skip(uniqueName, typeName, "unsupportedPageType");
      return;
    }
    if (source) {
      const existing = updatedPages.find((e) => e.uniqueName === uniqueName);
      if (existing) {
        handleExistingGlobal(page, isSub, typeName, uniqueName, existing, source);
        return;
      }
    }
    let storedAs;
    if (usedNames.has(uniqueName)) {
      if (uniqueName !== import_default_pages.mainPageName || mainPageCovered) {
        skip(uniqueName, typeName, "nameExists");
        return;
      }
      storedAs = `${import_default_pages.mainPageName}_${panel.name.replace(/[^A-Za-z0-9_-]/g, "_")}`;
      if (usedNames.has(storedAs)) {
        skip(uniqueName, typeName, "nameExists", `${storedAs} exists as well`);
        return;
      }
    }
    try {
      const { entry, common, rawItems, longPressDropped } = convertPage(page, isSub, typeName, uniqueName);
      if (storedAs !== void 0) {
        entry.uniqueName = storedAs;
        entry.isMainPage = true;
      }
      newPages.push(entry);
      updatedPages.push(entry);
      usedNames.add(entry.uniqueName);
      remove(uniqueName, isSub, source);
      if (!isSub && entry.navigationAssignment) {
        ringAssignments.set(uniqueName, entry.navigationAssignment[0]);
      }
      const planned = {
        uniqueName,
        type: typeName,
        card: entry.card,
        itemCount: ("pageItems" in entry ? entry.pageItems : []).filter((i) => !!i && !isEmptyAdminItem(i)).length,
        navigation: common.navigation,
        action: "create"
      };
      if (storedAs !== void 0) {
        planned.storedAs = storedAs;
      }
      if (source) {
        planned.global = true;
      }
      if (rawItems.length) {
        planned.rawItems = rawItems;
      }
      if (longPressDropped.length) {
        planned.longPressDropped = longPressDropped;
      }
      plan.pages.push(planned);
    } catch (error) {
      if (error instanceof ConvertError) {
        skip(uniqueName, typeName, error.reason, error.detail);
        return;
      }
      throw error;
    }
  };
  for (const page of pages) {
    handlePage(page, false);
  }
  for (const [uniqueName, assignment] of ringAssignments) {
    const links = ringLinks(uniqueName, survivingRing, (name) => !removedPages.has(name));
    assignment.navigation = links;
    const planned = plan.pages.find((p) => p.uniqueName === uniqueName);
    if (planned) {
      planned.navigation = links;
    }
  }
  for (const page of subPages) {
    handlePage(page, true);
  }
  const screensaver = convertScreensaver(
    merged ? { ...input, raw: { ...raw, nativePageItems: merged.nativePageItems } } : input
  );
  let screensaverEntry;
  let newNotify = [];
  if ("skipped" in screensaver) {
    plan.screensaverSkipped = screensaver.skipped;
  } else {
    screensaverEntry = screensaver.entry;
    newNotify = screensaver.notify;
    const entry = screensaver.entry;
    const count = (list) => list.filter((i) => !!i).length;
    plan.screensaver = {
      name: entry.name,
      mode: entry.mode,
      itemCount: (entry.favorit ? 1 : 0) + (entry.alternate ? 1 : 0) + count(entry.left) + count(entry.bottom) + count(entry.indicator) + (entry.mrIcon1 ? 1 : 0) + (entry.mrIcon2 ? 1 : 0),
      notifyCount: newNotify.length
    };
    if (screensaver.rawItems.length) {
      plan.screensaver.rawItems = screensaver.rawItems;
    }
  }
  const buttons = {};
  const clearButtonsInScript = [];
  for (const [side, scriptValue, adminValue] of [
    ["left", raw.buttonLeft, panel.buttonLeft],
    ["right", raw.buttonRight, panel.buttonRight]
  ]) {
    try {
      const action = convertButton(scriptValue);
      if (action === void 0) {
        continue;
      }
      if (adminValue !== void 0) {
        plan.buttonsSkipped.push({ side, reason: "buttonConfigured" });
        continue;
      }
      buttons[side] = action;
      plan.buttons[side] = action;
      clearButtonsInScript.push(side);
    } catch (error) {
      if (error instanceof ConvertError) {
        plan.buttonsSkipped.push({ side, reason: error.reason, detail: error.detail });
        continue;
      }
      throw error;
    }
  }
  const cleanedRaw = structuredClone(raw);
  const keep = (removed) => (page) => {
    const link = globalLinkName(page);
    if (link !== "") {
      return !removedLinks.has(link);
    }
    return !(isDict(page) && page.type !== void 0 && removed.has(scriptPageId(page)));
  };
  cleanedRaw.pages = rawPages.filter(keep(removedPages));
  cleanedRaw.subPages = rawSubPages.filter(keep(removedSubPages));
  const clearScreensaverInScript = !!screensaverEntry;
  if (clearScreensaverInScript) {
    cleanedRaw.favoritScreensaverEntity = [];
    cleanedRaw.alternateScreensaverEntity = [];
    cleanedRaw.leftScreensaverEntity = [];
    cleanedRaw.bottomScreensaverEntity = [];
    cleanedRaw.indicatorScreensaverEntity = [];
    cleanedRaw.mrIcon1ScreensaverEntity = emptyMrIcon();
    cleanedRaw.mrIcon2ScreensaverEntity = emptyMrIcon();
    delete cleanedRaw.notifyScreensaverEntity;
    cleanedRaw.weatherAddDefaultItems = false;
    if (cleanedRaw.advancedOptions) {
      cleanedRaw.advancedOptions = {
        ...cleanedRaw.advancedOptions,
        screensaverSwipe: false,
        screensaverIndicatorButtons: false
      };
    }
  }
  for (const side of clearButtonsInScript) {
    cleanedRaw[side === "left" ? "buttonLeft" : "buttonRight"] = null;
  }
  if (conflicts.length > 0) {
    plan.conflicts = conflicts;
  }
  plan.nothingToDo = plan.pages.length === 0 && !screensaverEntry && buttons.left === void 0 && buttons.right === void 0;
  return {
    plan,
    newPages,
    updatedPages,
    screensaverEntry,
    newNotify,
    buttons,
    cleanedRaw,
    removedFromScript,
    clearScreensaverInScript,
    clearButtonsInScript
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  planScriptToAdmin
});
//# sourceMappingURL=script-to-admin.js.map
