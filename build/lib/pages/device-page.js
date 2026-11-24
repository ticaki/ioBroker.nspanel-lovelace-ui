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
  DEVICE_PAGE_PREFIX: () => DEVICE_PAGE_PREFIX,
  cardDeviceOf: () => cardDeviceOf,
  cutToBytes: () => cutToBytes,
  devicePageChannelAdminItem: () => devicePageChannelAdminItem,
  devicePageChannelElement: () => devicePageChannelElement,
  devicePageChannelSlotItem: () => devicePageChannelSlotItem,
  devicePageChannels: () => devicePageChannels,
  devicePageClampElement: () => devicePageClampElement,
  devicePageElements: () => devicePageElements,
  devicePageInfoItem: () => devicePageInfoItem,
  devicePageMainElement: () => devicePageMainElement,
  devicePageMainItem: () => devicePageMainItem,
  devicePageMaxPayloadBytes: () => devicePageMaxPayloadBytes,
  devicePageNavigationSlotItem: () => devicePageNavigationSlotItem,
  devicePagePageConfig: () => devicePagePageConfig,
  devicePagePayload: () => devicePagePayload,
  devicePageSlotItem: () => devicePageSlotItem,
  devicePageStatusIconElement: () => devicePageStatusIconElement,
  devicePageStatusIconItem: () => devicePageStatusIconItem,
  devicePageStatusItem: () => devicePageStatusItem,
  devicePageStatusMessage: () => devicePageStatusMessage,
  optionalValueOf: () => optionalValueOf,
  reportMissingDevicePageTarget: () => reportMissingDevicePageTarget,
  splitDevicePageStatus: () => splitDevicePageStatus,
  supportsCardDevice: () => supportsCardDevice,
  withDevicePageSlotLook: () => withDevicePageSlotLook
});
module.exports = __toCommonJS(device_page_exports);
var import_Color = require("../const/Color");
var import_definition = require("../const/definition");
var import_text_width = require("../const/text-width");
var import_tools = require("../const/tools");
var import_adminShareConfig = require("../types/adminShareConfig");
var import_deviceDetails = require("../types/deviceDetails");
var import_device_details = require("./device-details");
const DEVICE_PAGE_PREFIX = "dp_";
const CARD_DEVICE_MIN_TFT = "6.2.0";
const CARD_DEVICE_MODELS = /* @__PURE__ */ new Set(["eu", "web-l"]);
const DEVICE_PAGE_EMPTY_ELEMENT = "~~~~~";
function supportsCardDevice(target) {
  if (!CARD_DEVICE_MODELS.has(target.model)) {
    return false;
  }
  if (target.isVirtual) {
    return true;
  }
  return !!target.displayVersion && (0, import_tools.isVersionGreaterOrEqual)(target.displayVersion, CARD_DEVICE_MIN_TFT);
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
  const width = import_deviceDetails.DEVICE_PAGE_FIELDS[layout].status;
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
function devicePageMaxPayloadBytes(layout) {
  return Math.min(import_deviceDetails.DEVICE_PAGE_RECEIVE_BYTES[layout], import_definition.MAX_PANEL_PAYLOAD_BYTES);
}
function devicePagePayload(head, mainPayload, elements, status, layout, model) {
  const build = (field) => [head, devicePageMainElement(mainPayload, field), ...elements].join("~");
  const payload = build(status);
  const over = byteLength(payload) - devicePageMaxPayloadBytes(layout);
  if (over <= 0) {
    return payload;
  }
  return build(cutToBytesWithEllipsis(status, Math.max(0, byteLength(status) - over), statusEllipsis(model)));
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
  if ((page.shortPress === "state" || page.shortPress === "none") && (source.type === "button" || source.type === "switch" || source.type === "text")) {
    const item = structuredClone(source);
    item.deviceDetails = deviceDetails;
    delete item.devicePageChannels;
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
  const data = source.data;
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
async function devicePageChannels(page, getRole, convert) {
  const channels = {};
  const errors = [];
  const kinds = import_deviceDetails.DEVICE_PAGE_LAYOUTS[page.layout];
  for (let i = 0; i < kinds.length; i++) {
    const ref = page.slots[i];
    if (!ref || ref.custom !== "channel" || ref.id === "") {
      continue;
    }
    const where = `Device page slot ${i + 1} (${kinds[i]}): channel ${ref.id}`;
    try {
      const role = await getRole(ref.id);
      if (role === void 0) {
        errors.push(`${where} not found!`);
        continue;
      }
      if (!(0, import_deviceDetails.devicePageSlotAcceptsChannel)(kinds[i], role)) {
        errors.push(`${where} with role ${role || "(none)"} does not fit the slot!`);
        continue;
      }
      const item = await convert(devicePageChannelAdminItem(ref, role));
      if (!item || "template" in item && item.template) {
        errors.push(`${where} gives no page item!`);
        continue;
      }
      channels[i] = { role, item };
    } catch (e) {
      errors.push(`${where}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { channels, errors };
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
function withDevicePageSlotLook(item, ref, common) {
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
  if (item.type === "text" || item.type === "button" || item.type === "switch") {
    if (!((_a = item.data) == null ? void 0 : _a.icon)) {
      return item;
    }
    applySlotLook(item.data.icon, look, isBoolean);
    if (look.scale && common.type === "number" && !item.data.entity1) {
      item.data.entity1 = { value: { type: "triggered", dp: ref.id } };
    }
    if (look.longPress && item.type !== "text") {
      item.data.longPress = { type: "state", dp: look.longPress };
    }
  } else if (item.type === "input_sel" && ((_b = item.data) == null ? void 0 : _b.icon)) {
    applySlotLook(item.data.icon, look, isBoolean);
  }
  return item;
}
function devicePageSlotItem(deviceId, kind, entry, common, name) {
  const target = (0, import_deviceDetails.devicePageSlotTargetOf)(entry);
  const item = devicePageStateSlotItem(deviceId, kind, entry, common, name, target !== "");
  if (!item) {
    return void 0;
  }
  const withLook = withDevicePageSlotLook(item, entry, common);
  return target ? { ...withLook, devicePageTarget: target } : withLook;
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
  return {
    type: "text",
    role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
    dpInit: "",
    devicePageTarget: target,
    data: {
      icon: { true: { value: icon, color }, false: { value: icon, color } },
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
async function devicePageElements(source, details, page, getObject, translate, language) {
  var _a, _b, _c;
  const device = await getObject(details.deviceId);
  const headline = (0, import_device_details.nameOfCommon)((_a = device == null ? void 0 : device.common) == null ? void 0 : _a.name, language) || details.deviceId.split(".").pop() || "";
  const kinds = import_deviceDetails.DEVICE_PAGE_LAYOUTS[page.layout];
  const skipped = [];
  const readCommon = async (ref) => {
    if (!ref) {
      return void 0;
    }
    const obj = await getObject(ref.id);
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
    const ref = (_b = page.slots[i]) != null ? _b : null;
    if ((ref == null ? void 0 : ref.custom) === "navigation") {
      slots[i] = devicePageNavigationSlotItem(kinds[i], ref);
      continue;
    }
    if ((ref == null ? void 0 : ref.custom) === "channel") {
      const channel = (_c = source.devicePageChannels) == null ? void 0 : _c[i];
      const item = channel ? devicePageChannelSlotItem(kinds[i], channel) : void 0;
      if (item) {
        const target = (0, import_deviceDetails.devicePageChannelTakesNavigation)(channel == null ? void 0 : channel.role) ? (0, import_deviceDetails.devicePageSlotTargetOf)(ref) : "";
        if (target) {
          item.devicePageTarget = target;
        }
        slots[i] = item;
        channelSlots.push(i);
      } else {
        skipped.push(ref.id);
      }
      continue;
    }
    const common = await readCommon(ref);
    if (ref && common) {
      present.push({ index: i, entry: ref, common });
    }
  }
  const named = present.filter((p) => kinds[p.index] !== "status" && !p.entry.name);
  const names = (0, import_device_details.deviceDetailRowNames)(
    details.deviceId,
    named.map((p) => p.entry),
    named.map((p) => p.common),
    translate,
    language,
    null
  );
  present.forEach((p) => {
    var _a2;
    const n = named.indexOf(p);
    const name = kinds[p.index] !== "status" && p.entry.name || (n >= 0 ? (_a2 = names[n]) != null ? _a2 : "" : "");
    const item = devicePageSlotItem(details.deviceId, kinds[p.index], p.entry, p.common, name);
    if (!item) {
      skipped.push(p.entry.id);
    }
    slots[p.index] = item;
  });
  const statusRef = page.status && page.status.id !== "" ? page.status : null;
  const statusCommon = await readCommon(statusRef);
  const status = statusRef && statusCommon ? devicePageStatusItem(details.deviceId, statusRef, statusCommon) : void 0;
  return {
    headline,
    slotCount: kinds.length,
    elements: [
      devicePageMainItem(source, details, page, headline),
      ...slots,
      page.showInfo ? devicePageInfoItem(details) : void 0,
      status
    ],
    skipped,
    channelSlots
  };
}
function devicePagePageConfig(uniqueID, layout, alwaysOn, content) {
  var _a;
  return {
    uniqueID,
    alwaysOn,
    dpInit: "",
    pageItems: [],
    config: {
      card: cardDeviceOf(layout),
      data: { headline: { type: "const", constVal: content.headline } },
      slotCount: content.slotCount,
      elements: content.elements,
      channelSlots: (_a = content.channelSlots) != null ? _a : []
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CARD_DEVICE_MIN_TFT,
  CARD_DEVICE_MODELS,
  DEVICE_PAGE_EMPTY_ELEMENT,
  DEVICE_PAGE_PREFIX,
  cardDeviceOf,
  cutToBytes,
  devicePageChannelAdminItem,
  devicePageChannelElement,
  devicePageChannelSlotItem,
  devicePageChannels,
  devicePageClampElement,
  devicePageElements,
  devicePageInfoItem,
  devicePageMainElement,
  devicePageMainItem,
  devicePageMaxPayloadBytes,
  devicePageNavigationSlotItem,
  devicePagePageConfig,
  devicePagePayload,
  devicePageSlotItem,
  devicePageStatusIconElement,
  devicePageStatusIconItem,
  devicePageStatusItem,
  devicePageStatusMessage,
  optionalValueOf,
  reportMissingDevicePageTarget,
  splitDevicePageStatus,
  supportsCardDevice,
  withDevicePageSlotLook
});
//# sourceMappingURL=device-page.js.map
