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
var device_page_exports = {};
__export(device_page_exports, {
  CARD_DEVICE_MIN_TFT: () => CARD_DEVICE_MIN_TFT,
  CARD_DEVICE_MODELS: () => CARD_DEVICE_MODELS,
  DEVICE_PAGE_EMPTY_ELEMENT: () => DEVICE_PAGE_EMPTY_ELEMENT,
  buildDevicePage: () => buildDevicePage,
  cardDeviceOf: () => cardDeviceOf,
  cutToBytes: () => cutToBytes,
  devicePageChannelAdminItem: () => devicePageChannelAdminItem,
  devicePageChannelElement: () => devicePageChannelElement,
  devicePageChannelSlotItem: () => devicePageChannelSlotItem,
  devicePageClampElement: () => devicePageClampElement,
  devicePageIconsMessage: () => devicePageIconsMessage,
  devicePageInfoElement: () => devicePageInfoElement,
  devicePageInfoItem: () => devicePageInfoItem,
  devicePageMainElement: () => devicePageMainElement,
  devicePageMainItem: () => devicePageMainItem,
  devicePageMaxPayloadBytes: () => devicePageMaxPayloadBytes,
  devicePageName: () => devicePageName,
  devicePageNavigationSlotItem: () => devicePageNavigationSlotItem,
  devicePageNumberedElement: () => devicePageNumberedElement,
  devicePageOfModel: () => devicePageOfModel,
  devicePagePayload: () => devicePagePayload,
  devicePageSlotItem: () => devicePageSlotItem,
  devicePageSlotItemIndex: () => devicePageSlotItemIndex,
  devicePageStatusIconElement: () => devicePageStatusIconElement,
  devicePageStatusIconItem: () => devicePageStatusIconItem,
  devicePageStatusItem: () => devicePageStatusItem,
  devicePageStatusItemIndex: () => devicePageStatusItemIndex,
  devicePageStatusMessage: () => devicePageStatusMessage,
  devicePageTypeNumber: () => devicePageTypeNumber,
  isCardDeviceConfig: () => isCardDeviceConfig,
  layoutOfCardDevice: () => layoutOfCardDevice,
  optionalValueOf: () => optionalValueOf,
  reportMissingDevicePageTarget: () => reportMissingDevicePageTarget,
  splitDevicePageStatus: () => splitDevicePageStatus,
  supportsCardDevice: () => supportsCardDevice,
  withDevicePageNavigation: () => withDevicePageNavigation,
  withDevicePageSlotLook: () => withDevicePageSlotLook,
  withoutDevicePages: () => withoutDevicePages
});
module.exports = __toCommonJS(device_page_exports);
var import_Color = require("../const/Color");
var import_definition = require("../const/definition");
var import_text_width = require("../const/text-width");
var import_tools = require("../const/tools");
var import_function_and_const = require("../types/function-and-const");
var import_adminShareConfig = require("../types/adminShareConfig");
var import_deviceDetails = require("../types/deviceDetails");
var import_device_details = require("./device-details");
function devicePageName(pageName, deviceId) {
  return `device-${pageName}-${deviceId}`;
}
const CARD_DEVICE_MIN_TFT = "6.3.0";
const CARD_DEVICE_MODELS = /* @__PURE__ */ new Set([
  "eu",
  "us-l",
  "us-p",
  "web-l",
  "web-p"
]);
const DEVICE_PAGE_EMPTY_ELEMENT = "~~~~~";
const DEVICE_PAGE_TYPE_NUMBERS = {
  delete: 0,
  shutter: 2,
  shutter2: 3,
  input_sel: 4,
  timer: 5,
  light: 6,
  light2: 7,
  fan: 8,
  number: 9
};
function devicePageTypeNumber(type) {
  var _a;
  if (type === "") {
    return "";
  }
  return String((_a = DEVICE_PAGE_TYPE_NUMBERS[type]) != null ? _a : 1);
}
function devicePageNumberedElement(element) {
  const at = element.indexOf("~");
  if (at < 0) {
    return element;
  }
  return devicePageTypeNumber(element.slice(0, at)) + element.slice(at);
}
function supportsCardDevice(target) {
  if (!CARD_DEVICE_MODELS.has(target.model)) {
    return false;
  }
  if (target.isVirtual) {
    return true;
  }
  return !!target.displayVersion && (0, import_tools.isVersionGreaterOrEqual)(target.displayVersion, CARD_DEVICE_MIN_TFT);
}
function withoutDevicePages(pages, navigation) {
  var _a;
  const devicePages = /* @__PURE__ */ new Set();
  for (const page of pages) {
    if (page && (0, import_function_and_const.isCardDeviceType)((_a = page.config) == null ? void 0 : _a.card)) {
      devicePages.add(page.uniqueID);
    }
  }
  if (devicePages.size === 0) {
    return { pages, navigation };
  }
  return {
    pages: pages.filter((p) => !p || !devicePages.has(p.uniqueID)),
    navigation: navigation.filter((n) => !n || !devicePages.has(n.name))
  };
}
function cardDeviceOf(layout) {
  switch (layout) {
    case 1:
      return "cardDevice1";
    case 2:
      return "cardDevice2";
    case 3:
      return "cardDevice3";
  }
}
function byteLength(text) {
  return Buffer.byteLength(text, "utf8");
}
function cutToBytes(text, maxBytes) {
  if (byteLength(text) <= maxBytes) {
    return text;
  }
  let out = "";
  let bytes = 0;
  for (const char of text) {
    bytes += byteLength(char);
    if (bytes > maxBytes) {
      break;
    }
    out += char;
  }
  return out;
}
function cutToBytesWithEllipsis(text, maxBytes, ellipsis) {
  if (byteLength(text) <= maxBytes) {
    return text;
  }
  const head = cutToBytes(text, maxBytes - byteLength(ellipsis)).trimEnd();
  return head ? `${head}${ellipsis}` : "";
}
function statusEllipsis(model) {
  var _a;
  return (0, import_text_width.hasGlyph)((_a = import_text_width.ELLIPSIS.codePointAt(0)) != null ? _a : 0, import_deviceDetails.DEVICE_PAGE_TEXT_FONT, model) ? import_text_width.ELLIPSIS : import_text_width.ELLIPSIS_FALLBACK;
}
const STATUS_BREAK_AFTER = /* @__PURE__ */ new Set([",", ".", ";", "\u2013", "\u2014"]);
function isStatusBreak(chars, at) {
  return STATUS_BREAK_AFTER.has(chars[at - 1]) && !/\d/.test(chars[at]);
}
function splitDevicePageStatus(text, layout, model) {
  const flat = text.replace(/[\r\n]+/g, " ").replaceAll("~", "");
  const width = (0, import_deviceDetails.devicePageFields)(layout, model).status;
  const fits = (part) => (0, import_text_width.textWidth)(part, import_deviceDetails.DEVICE_PAGE_TEXT_FONT, model) <= width && byteLength(part) <= import_deviceDetails.DEVICE_PAGE_STATUS_MAX_BYTES;
  if (fits(flat)) {
    return [flat];
  }
  const chars = Array.from(flat.trim());
  const parts = [];
  let start = 0;
  while (start < chars.length) {
    if (parts.length === import_deviceDetails.DEVICE_PAGE_STATUS_MAX_PARTS - 1) {
      const rest = chars.slice(start).join("");
      const ellipsis = statusEllipsis(model);
      parts.push(
        cutToBytesWithEllipsis(
          (0, import_text_width.fitText)(rest, import_deviceDetails.DEVICE_PAGE_TEXT_FONT, model, width, { ellipsis }),
          import_deviceDetails.DEVICE_PAGE_STATUS_MAX_BYTES,
          ellipsis
        )
      );
      break;
    }
    let end = start;
    let part = "";
    while (end < chars.length && fits(part + chars[end])) {
      part += chars[end];
      end++;
    }
    if (end < chars.length && chars[end] !== " ") {
      let at = end;
      while (at > start && chars[at] !== " " && !isStatusBreak(chars, at)) {
        at--;
      }
      end = at > start ? at : Math.max(end, start + 1);
    }
    parts.push(chars.slice(start, end).join("").trimEnd());
    start = end;
    while (chars[start] === " ") {
      start++;
    }
  }
  return parts;
}
function devicePageStatusMessage(part) {
  return `${import_deviceDetails.DEVICE_PAGE_STATUS_COMMAND}~${part.replaceAll("~", "")}`;
}
function devicePageMainElement(mainPayload, status) {
  const fields = mainPayload ? mainPayload.split("~") : [];
  const head = fields.length >= 6 ? fields.slice(0, 5) : ["", "", "", "", ""];
  head[4] = cutToBytes(head[4], import_deviceDetails.DEVICE_PAGE_TEXT_MAX_BYTES);
  return [...head, status.replace(/~/g, "")].join("~");
}
function devicePageClampElement(element) {
  const fields = element.split("~");
  if (fields.length !== 6) {
    return element;
  }
  fields[4] = cutToBytes(fields[4], import_deviceDetails.DEVICE_PAGE_TEXT_MAX_BYTES);
  fields[5] = cutToBytes(fields[5], import_deviceDetails.DEVICE_PAGE_TEXT_MAX_BYTES);
  return fields.join("~");
}
function devicePageMaxPayloadBytes(layout, model) {
  if ((0, import_tools.isWebModel)(model)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.min(import_deviceDetails.DEVICE_PAGE_RECEIVE_BYTES[layout], import_definition.MAX_PANEL_PAYLOAD_BYTES);
}
function devicePagePayload(head, mainPayload, elements, status, layout, model) {
  const numbered = elements.map(devicePageNumberedElement);
  const build = (field) => [head, devicePageNumberedElement(devicePageMainElement(mainPayload, field)), ...numbered].join("~");
  const payload = build(status);
  const over = byteLength(payload) - devicePageMaxPayloadBytes(layout, model);
  if (over <= 0) {
    return payload;
  }
  return build(cutToBytesWithEllipsis(status, Math.max(0, byteLength(status) - over), statusEllipsis(model)));
}
function devicePageInfoElement(payload, layout, stage) {
  const element = devicePageClampElement(payload || DEVICE_PAGE_EMPTY_ELEMENT);
  if (import_deviceDetails.DEVICE_PAGE_STATUS_SLOTS[layout] === 0) {
    return element;
  }
  const fields = element.split("~");
  const own = fields.length === 6 ? fields : DEVICE_PAGE_EMPTY_ELEMENT.split("~");
  const shown = (0, import_deviceDetails.devicePageStageOf)(layout, stage);
  own[5] = shown > 0 ? String(shown) : "";
  return own.join("~");
}
function devicePageIconsMessage(elements, layout) {
  const count = import_deviceDetails.DEVICE_PAGE_STATUS_SLOTS[layout];
  const cells = [];
  for (const element of elements) {
    const fields = element.split("~");
    if (fields.length < 4 || !fields[0]) {
      continue;
    }
    cells.push(devicePageNumberedElement(fields.slice(0, 4).join("~")));
  }
  const out = cells.slice(0, count);
  while (out.length < count) {
    out.push("~~~");
  }
  return [import_deviceDetails.DEVICE_PAGE_ICONS_COMMAND, ...out].join("~");
}
function devicePageSlotItemIndex(layout, slot) {
  const count = import_deviceDetails.DEVICE_PAGE_LAYOUTS[layout].length;
  return slot < count ? slot + 1 : slot + 3 + import_deviceDetails.DEVICE_PAGE_STATUS_SLOTS[layout];
}
function devicePageStatusItemIndex(layout, place) {
  return import_deviceDetails.DEVICE_PAGE_LAYOUTS[layout].length + 3 + place;
}
function isCardDeviceConfig(config) {
  return !!config && (0, import_function_and_const.isCardDeviceType)(config.card);
}
function layoutOfCardDevice(card) {
  switch (card) {
    case "cardDevice1":
      return 1;
    case "cardDevice2":
      return 2;
    case "cardDevice3":
      return 3;
  }
}
function devicePageOfModel(page, model) {
  if ((0, import_tools.isWebModel)(model) || !isCardDeviceConfig(page.config) || !page.pageItems) {
    return page;
  }
  const layout = layoutOfCardDevice(page.config.card);
  const count = import_deviceDetails.DEVICE_PAGE_LAYOUTS[layout].length;
  const items = count + 3 + import_deviceDetails.DEVICE_PAGE_STATUS_SLOTS[layout];
  if (page.pageItems.length <= items) {
    return page;
  }
  const config = { ...page.config };
  if (config.channelSlots) {
    config.channelSlots = config.channelSlots.filter((slot) => slot < count);
  }
  return { ...page, pageItems: page.pageItems.slice(0, items), config };
}
function devicePageStatusIconElement(payload) {
  const fields = payload ? payload.split("~") : [];
  if (fields.length < 6 || !fields[0]) {
    return DEVICE_PAGE_EMPTY_ELEMENT;
  }
  return [...fields.slice(0, 4), "", ""].join("~");
}
function optionalValueOf(payload) {
  var _a;
  return (_a = payload.split("~")[5]) != null ? _a : "";
}
function withIcon(icon, name) {
  const value = { type: "const", constVal: name };
  return { ...icon, true: { ...icon == null ? void 0 : icon.true, value }, false: { ...icon == null ? void 0 : icon.false, value } };
}
function devicePageMainItem(source, details, page, name) {
  const nameItem = { type: "const", constVal: name };
  const text = { true: nameItem, false: nameItem };
  const deviceDetails = { deviceId: details.deviceId, entries: details.entries };
  if (source && (page.shortPress === "state" || page.shortPress === "none") && (source.type === "button" || source.type === "switch" || source.type === "text")) {
    const item = structuredClone(source);
    item.deviceDetails = deviceDetails;
    delete item.devicePageName;
    item.dpInit = "";
    item.data.text = text;
    if (item.role === "text.states") {
      delete item.role;
    }
    if (page.icon) {
      item.data.icon = withIcon(item.data.icon, page.icon);
    }
    return item;
  }
  const data = source == null ? void 0 : source.data;
  const icon = data && "icon" in data && data.icon ? structuredClone(data.icon) : void 0;
  const entity1 = data && "entity1" in data && data.entity1 ? structuredClone(data.entity1) : void 0;
  return {
    type: "text",
    dpInit: "",
    deviceDetails,
    data: {
      icon: page.icon ? withIcon(icon, page.icon) : icon,
      text,
      entity1
    }
  };
}
function devicePageInfoItem(details) {
  const icon = { type: "const", constVal: "information-outline" };
  const color = { type: "const", constVal: import_Color.Color.deviceInfo };
  const name = { type: "const", constVal: "" };
  return {
    type: "button",
    role: import_deviceDetails.DEVICE_PAGE_INFO_ROLE,
    dpInit: "",
    deviceDetails: { deviceId: details.deviceId, entries: details.entries },
    data: {
      icon: { true: { value: icon, color }, false: { value: icon, color } },
      text: { true: name, false: name }
    }
  };
}
function devicePageChannelAdminItem(ref, role) {
  const {
    longPress,
    isNavigation: _isNavigation,
    targetPage: _targetPage,
    ...look
  } = (0, import_deviceDetails.devicePageSlotLookOf)(ref, false);
  const item = { channelId: (0, import_adminShareConfig.emptyChannelValueConfig)(ref.id), ...look };
  if (longPress && (0, import_deviceDetails.devicePageChannelTakesLongPress)(role)) {
    item.longPress = longPress;
  }
  return item;
}
function devicePageChannelSlotItem(kind, channel) {
  var _a, _b;
  if (!(0, import_deviceDetails.devicePageSlotAcceptsChannel)(kind, channel.role)) {
    return void 0;
  }
  const item = structuredClone(channel.item);
  if (item.type === "text" && ((_a = item.data) == null ? void 0 : _a.icon) && (kind === "info" || kind === "value" || kind === "status")) {
    const icon = item.data.icon;
    const valueText = (_b = icon.true) == null ? void 0 : _b.text;
    if (kind !== "status" && (valueText == null ? void 0 : valueText.value) && !item.data.entity2 && !item.data.text1) {
      item.data.entity2 = { value: valueText.value, unit: valueText.unit };
    }
    if (icon.true) {
      delete icon.true.text;
    }
    if (icon.false) {
      delete icon.false.text;
    }
  }
  return item;
}
function devicePageChannelElement(kind, payload, onOff) {
  const fields = payload.split("~");
  if (fields.length < 6 || !fields[0]) {
    return payload;
  }
  const type = fields[0];
  const raw = fields[5];
  let value = "";
  switch (kind) {
    case "info":
    case "value":
      switch (type) {
        case "text":
        case "input_sel":
        case "timer":
          value = raw;
          break;
        case "number":
          value = raw.split("|")[0];
          break;
        case "light":
        case "light2":
        case "switch":
        case "fan":
          value = onOff(raw === "1");
          break;
      }
      break;
    case "progress": {
      const [current, min, max] = raw.split("|").map((part) => part === "" ? NaN : Number(part));
      value = String(
        (0, import_deviceDetails.devicePageProgressPercent)(
          current,
          Number.isFinite(min) ? min : void 0,
          Number.isFinite(max) ? max : void 0
        )
      );
      break;
    }
    case "switch":
      value = raw === "1" ? "1" : "0";
      break;
    case "button":
      value = raw === "0" || raw === "1" ? raw : "";
      break;
    case "status":
      break;
  }
  return [...fields.slice(0, 5), value.replace(/~/g, "")].join("~");
}
function colorItem(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) {
    return void 0;
  }
  return { type: "const", constVal: import_Color.Color.ConvertHexToRgb(hex) };
}
function slotTextSizeItem(kind, look) {
  return look.textSize !== void 0 && (0, import_deviceDetails.devicePageSlotTakesTextSize)(kind) ? { type: "const", constVal: look.textSize } : void 0;
}
function applySlotLook(icon, look, isBoolean) {
  const branches = [
    { key: "true", name: look.trueIcon, color: look.trueColor },
    { key: "false", name: isBoolean ? look.falseIcon : look.trueIcon, color: look.falseColor }
  ];
  for (const branch of branches) {
    const color = branch.color ? colorItem(branch.color) : void 0;
    if (!branch.name && !color) {
      continue;
    }
    const entry = { ...icon[branch.key] };
    if (branch.name) {
      entry.value = { type: "const", constVal: branch.name };
    }
    if (color) {
      entry.color = color;
    }
    icon[branch.key] = entry;
  }
  if (look.scale) {
    icon.scale = { type: "const", constVal: look.scale };
  }
}
function withDevicePageSlotLook(item, ref, common, kind) {
  var _a, _b;
  const {
    isNavigation: _isNavigation,
    targetPage: _targetPage,
    name: _name,
    ...look
  } = (0, import_deviceDetails.devicePageSlotLookOf)(ref, false);
  if (Object.keys(look).length === 0) {
    return item;
  }
  const isBoolean = common.type === "boolean";
  const textSize = slotTextSizeItem(kind, look);
  if (item.type === "text" || item.type === "button" || item.type === "switch") {
    if (!((_a = item.data) == null ? void 0 : _a.icon)) {
      return item;
    }
    applySlotLook(item.data.icon, look, isBoolean);
    if (textSize) {
      item.data.icon.textSize = textSize;
    }
    if (look.scale && common.type === "number" && !item.data.entity1) {
      item.data.entity1 = { value: { type: "triggered", dp: ref.id } };
    }
    if (look.longPress && item.type !== "text") {
      item.data.longPress = { type: "state", dp: look.longPress };
    }
  } else if (item.type === "input_sel" && ((_b = item.data) == null ? void 0 : _b.icon)) {
    applySlotLook(item.data.icon, look, isBoolean);
    if (textSize) {
      item.data.icon.textSize = textSize;
    }
  }
  return item;
}
function devicePageSlotItem(deviceId, kind, entry, common, name) {
  const target = (0, import_deviceDetails.devicePageSlotTargetOf)(entry);
  const item = devicePageStateSlotItem(deviceId, kind, entry, common, name, target !== "");
  if (!item) {
    return void 0;
  }
  return withDevicePageNavigation(withDevicePageSlotLook(item, entry, common, kind), target);
}
function withDevicePageNavigation(item, target) {
  const out = structuredClone(item);
  if (target && out.data) {
    const setNavi = { type: "const", constVal: target };
    Object.assign(out.data, { setNavi });
  }
  return out;
}
function devicePageNavigationSlotItem(kind, ref) {
  var _a;
  const target = ref.custom === "navigation" ? (0, import_deviceDetails.devicePageSlotTargetOf)(ref) : "";
  if (!target || !(0, import_deviceDetails.devicePageSlotAcceptsNavigation)(kind)) {
    return void 0;
  }
  const icon = { type: "const", constVal: ref.trueIcon || import_deviceDetails.DEVICE_PAGE_NAVIGATION_ICON };
  const color = (_a = ref.trueColor ? colorItem(ref.trueColor) : void 0) != null ? _a : {
    type: "const",
    constVal: import_Color.Color.deviceInfo
  };
  const name = { type: "const", constVal: ref.name || target };
  const textSize = slotTextSizeItem(kind, ref);
  return {
    type: "text",
    role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
    dpInit: "",
    data: {
      setNavi: { type: "const", constVal: target },
      icon: {
        true: { value: icon, color },
        false: { value: icon, color },
        ...textSize ? { textSize } : {}
      },
      text: { true: name, false: name }
    }
  };
}
function devicePageStateSlotItem(deviceId, kind, entry, common, name, navigates = false) {
  if (!(0, import_deviceDetails.devicePageSlotAccepts)(kind, common)) {
    return void 0;
  }
  const nameItem = { type: "const", constVal: name };
  const value = { type: "triggered", dp: entry.id };
  switch (kind) {
    case "info":
      return {
        ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name, navigates ? "all" : "keepSelect"),
        dpInit: ""
      };
    case "value":
      return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name, "all"), dpInit: "" };
    case "switch":
      return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name), dpInit: "" };
    case "status":
      return devicePageStatusIconItem(deviceId, entry, common);
    case "button": {
      if (common.read === false) {
        return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name), dpInit: "" };
      }
      const look = (0, import_device_details.deviceDetailRowLook)(deviceId, entry, common, (0, import_deviceDetails.deviceDetailRowKind)(common));
      const icon = { type: "const", constVal: look.icon };
      return {
        type: "button",
        role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
        dpInit: "",
        data: {
          icon: {
            true: { value: icon, color: { type: "const", constVal: import_Color.Color.activated } },
            false: { value: icon, color: { type: "const", constVal: import_Color.Color.deactivated } }
          },
          entity1: { value },
          text: { true: nameItem, false: nameItem }
        }
      };
    }
    case "progress": {
      const look = (0, import_device_details.deviceDetailRowLook)(deviceId, entry, common, "number");
      const icon = (0, import_device_details.deviceDetailRowIcon)(look, entry.id);
      const color = { type: "const", constVal: look.color };
      return {
        type: "text",
        role: import_deviceDetails.DEVICE_PAGE_PROGRESS_ROLE,
        dpInit: "",
        data: {
          icon: { true: { value: icon, color }, false: { value: icon, color } },
          entity2: { value },
          text: { true: nameItem, false: nameItem }
        }
      };
    }
  }
}
function devicePageStatusIconItem(deviceId, entry, common) {
  var _a;
  const row = (0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, "", "all", (_a = entry.icon) != null ? _a : "");
  if (row.type === "text" && row.data) {
    delete row.data.entity2;
    delete row.data.text1;
  }
  return { ...row, dpInit: "" };
}
function devicePageStatusItem(deviceId, entry, common) {
  return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, "", "all"), dpInit: "" };
}
const missingDevicePageTargets = /* @__PURE__ */ new WeakMap();
function reportMissingDevicePageTarget(panel, target) {
  var _a;
  const reported = (_a = missingDevicePageTargets.get(panel)) != null ? _a : /* @__PURE__ */ new Set();
  missingDevicePageTargets.set(panel, reported);
  if (reported.has(target)) {
    return false;
  }
  reported.add(target);
  return true;
}
const EMPTY_DEVICE_PAGE_ITEM = { type: "empty", data: void 0 };
async function devicePageChannelSlot(kind, ref, ctx) {
  var _a;
  const where = `channel ${ref.id}`;
  try {
    const obj = await ctx.getObject(ref.id);
    if (!obj) {
      return { error: `${where} not found!` };
    }
    const rawRole = (_a = obj.common) == null ? void 0 : _a.role;
    const role = typeof rawRole === "string" ? rawRole : "";
    if (!(0, import_deviceDetails.devicePageSlotAcceptsChannel)(kind, role)) {
      return { error: `${where} with role ${role || "(none)"} does not fit the slot!` };
    }
    const item = await ctx.pageItemOf(devicePageChannelAdminItem(ref, role));
    const slotItem = item && !("template" in item && item.template) ? devicePageChannelSlotItem(kind, { role, item }) : void 0;
    if (!slotItem) {
      return { error: `${where} gives no page item!` };
    }
    const target = (0, import_deviceDetails.devicePageChannelTakesNavigation)(role) ? (0, import_deviceDetails.devicePageSlotTargetOf)(ref) : "";
    return { item: withDevicePageNavigation(slotItem, target) };
  } catch (e) {
    return { error: `${where}: ${e instanceof Error ? e.message : String(e)}` };
  }
}
async function buildDevicePage(uniqueID, alwaysOn, source, ctx) {
  var _a, _b;
  const { deviceId, page } = source;
  const details = { deviceId, entries: source.entries };
  const device = await ctx.getObject(deviceId);
  const headline = (0, import_device_details.nameOfCommon)((_a = device == null ? void 0 : device.common) == null ? void 0 : _a.name, ctx.language) || deviceId.split(".").pop() || "";
  const layoutKinds = import_deviceDetails.DEVICE_PAGE_LAYOUTS[page.layout];
  const extraKinds = page.slots.length > layoutKinds.length ? import_deviceDetails.DEVICE_PAGE_EXTRA_SLOTS[page.layout] : [];
  const stage = (0, import_deviceDetails.devicePageStageOf)(page.layout, page.statusStage);
  const statusCount = import_deviceDetails.DEVICE_PAGE_STATUS_SLOTS[page.layout];
  const capacity = (0, import_deviceDetails.devicePageStatusCapacity)(page.layout, stage);
  const firstStatus = layoutKinds.length + extraKinds.length;
  const kinds = [
    ...layoutKinds,
    ...extraKinds,
    ...Array.from({ length: statusCount }, () => "status")
  ];
  const refs = kinds.map((_kind, i) => {
    var _a2, _b2, _c;
    if (i >= firstStatus) {
      const place = i - firstStatus;
      return place < capacity ? (_b2 = (_a2 = page.statusSlots) == null ? void 0 : _a2[place]) != null ? _b2 : null : null;
    }
    if (i < layoutKinds.length && (0, import_deviceDetails.devicePageSlotHiddenByStage)(page.layout, stage, i)) {
      return null;
    }
    return (_c = page.slots[i]) != null ? _c : null;
  });
  const label = (i) => i >= firstStatus ? `status icon ${i - firstStatus + 1}` : `slot ${i + 1} (${kinds[i]})`;
  const messages = [];
  const skipped = [];
  const readCommon = async (ref) => {
    if (!ref) {
      return void 0;
    }
    const obj = await ctx.getObject(ref.id);
    if ((obj == null ? void 0 : obj.type) !== "state") {
      skipped.push(ref.id);
      return void 0;
    }
    return obj.common;
  };
  const present = [];
  const slots = kinds.map(() => void 0);
  const channelSlots = [];
  for (let i = 0; i < kinds.length; i++) {
    const ref = refs[i];
    if ((ref == null ? void 0 : ref.custom) === "navigation") {
      slots[i] = devicePageNavigationSlotItem(kinds[i], ref);
      continue;
    }
    if ((ref == null ? void 0 : ref.custom) === "channel") {
      const channel = await devicePageChannelSlot(kinds[i], ref, ctx);
      if (channel.item) {
        slots[i] = channel.item;
        if (i < firstStatus) {
          channelSlots.push(i);
        }
      } else {
        messages.push(`Device page ${label(i)}: ${(_b = channel.error) != null ? _b : ref.id}`);
      }
      continue;
    }
    const common = await readCommon(ref);
    if (ref && common) {
      present.push({ index: i, entry: ref, common });
    }
  }
  const named = present.filter((p) => kinds[p.index] !== "status" && !p.entry.name);
  const namesOf = (rows) => (0, import_device_details.deviceDetailRowNames)(
    deviceId,
    rows.map((p) => p.entry),
    rows.map((p) => p.common),
    ctx.translate,
    ctx.language,
    null
  );
  const layoutNamed = named.filter((p) => p.index < layoutKinds.length);
  const layoutNames = namesOf(layoutNamed);
  const allNames = layoutNamed.length < named.length ? namesOf(named) : layoutNames;
  present.forEach((p) => {
    var _a2;
    const n = p.index < layoutKinds.length ? layoutNamed.indexOf(p) : named.indexOf(p);
    const auto = p.index < layoutKinds.length ? layoutNames : allNames;
    const name = kinds[p.index] !== "status" && p.entry.name || (n >= 0 ? (_a2 = auto[n]) != null ? _a2 : "" : "");
    const item = devicePageSlotItem(deviceId, kinds[p.index], p.entry, p.common, name);
    if (!item) {
      skipped.push(p.entry.id);
    }
    slots[p.index] = item;
  });
  const statusRef = page.status && page.status.id !== "" ? page.status : null;
  const statusCommon = await readCommon(statusRef);
  const status = statusRef && statusCommon ? devicePageStatusItem(deviceId, statusRef, statusCommon) : void 0;
  if (skipped.length > 0) {
    messages.push(
      `Device page of ${deviceId}: missing state or not fitting its slot, left empty: ${skipped.join(", ")}`
    );
  }
  const elements = [
    devicePageMainItem(source.main, details, page, headline),
    ...slots.slice(0, layoutKinds.length),
    page.showInfo ? devicePageInfoItem(details) : void 0,
    status,
    // a fixed block per layout: the numbers of its items do not depend on the stage
    ...slots.slice(firstStatus),
    // appended: the numbers of the items above never change
    ...slots.slice(layoutKinds.length, firstStatus)
  ];
  const config = {
    card: cardDeviceOf(page.layout),
    data: { headline: { type: "const", constVal: headline } },
    channelSlots
  };
  if (stage > 0) {
    config.statusStage = stage;
  }
  return {
    page: {
      uniqueID,
      alwaysOn,
      dpInit: "",
      pageItems: elements.map((item) => item != null ? item : EMPTY_DEVICE_PAGE_ITEM),
      config
    },
    messages
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CARD_DEVICE_MIN_TFT,
  CARD_DEVICE_MODELS,
  DEVICE_PAGE_EMPTY_ELEMENT,
  buildDevicePage,
  cardDeviceOf,
  cutToBytes,
  devicePageChannelAdminItem,
  devicePageChannelElement,
  devicePageChannelSlotItem,
  devicePageClampElement,
  devicePageIconsMessage,
  devicePageInfoElement,
  devicePageInfoItem,
  devicePageMainElement,
  devicePageMainItem,
  devicePageMaxPayloadBytes,
  devicePageName,
  devicePageNavigationSlotItem,
  devicePageNumberedElement,
  devicePageOfModel,
  devicePagePayload,
  devicePageSlotItem,
  devicePageSlotItemIndex,
  devicePageStatusIconElement,
  devicePageStatusIconItem,
  devicePageStatusItem,
  devicePageStatusItemIndex,
  devicePageStatusMessage,
  devicePageTypeNumber,
  isCardDeviceConfig,
  layoutOfCardDevice,
  optionalValueOf,
  reportMissingDevicePageTarget,
  splitDevicePageStatus,
  supportsCardDevice,
  withDevicePageNavigation,
  withDevicePageSlotLook,
  withoutDevicePages
});
//# sourceMappingURL=device-page.js.map
