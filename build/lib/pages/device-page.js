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
  devicePageElements: () => devicePageElements,
  devicePageInfoItem: () => devicePageInfoItem,
  devicePageMainElement: () => devicePageMainElement,
  devicePageMainItem: () => devicePageMainItem,
  devicePagePageConfig: () => devicePagePageConfig,
  devicePageSlotItem: () => devicePageSlotItem,
  devicePageStatusItem: () => devicePageStatusItem,
  fitDevicePageStatus: () => fitDevicePageStatus,
  optionalValueOf: () => optionalValueOf,
  supportsCardDevice: () => supportsCardDevice
});
module.exports = __toCommonJS(device_page_exports);
var import_Color = require("../const/Color");
var import_text_width = require("../const/text-width");
var import_tools = require("../const/tools");
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
function fitDevicePageStatus(text, layout, model) {
  var _a;
  const flat = text.replace(/[\r\n]+/g, " ");
  let out = (0, import_text_width.fitText)(flat, import_deviceDetails.DEVICE_PAGE_TEXT_FONT, model, import_deviceDetails.DEVICE_PAGE_FIELDS[layout].status);
  if (Buffer.byteLength(out, "utf8") <= import_deviceDetails.DEVICE_PAGE_STATUS_MAX_BYTES) {
    return out;
  }
  const ellipsis = (0, import_text_width.hasGlyph)((_a = import_text_width.ELLIPSIS.codePointAt(0)) != null ? _a : 0, import_deviceDetails.DEVICE_PAGE_TEXT_FONT, model) ? import_text_width.ELLIPSIS : import_text_width.ELLIPSIS_FALLBACK;
  const chars = Array.from(flat);
  for (let n = chars.length - 1; n > 0; n--) {
    out = `${chars.slice(0, n).join("").trimEnd()}${ellipsis}`;
    if (Buffer.byteLength(out, "utf8") <= import_deviceDetails.DEVICE_PAGE_STATUS_MAX_BYTES) {
      return out;
    }
  }
  return "";
}
function devicePageMainElement(mainPayload, status) {
  const fields = mainPayload ? mainPayload.split("~") : [];
  const head = fields.length >= 6 ? fields.slice(0, 5) : ["", "", "", "", ""];
  return [...head, status.replace(/~/g, "")].join("~");
}
function optionalValueOf(payload) {
  var _a;
  return (_a = payload.split("~")[5]) != null ? _a : "";
}
function withIcon(icon, name) {
  const value = { type: "const", constVal: name };
  return { ...icon, true: { ...icon == null ? void 0 : icon.true, value }, false: { ...icon == null ? void 0 : icon.false, value } };
}
function devicePageMainItem(source, details, page) {
  const deviceDetails = { deviceId: details.deviceId, entries: details.entries };
  if ((page.shortPress === "state" || page.shortPress === "none") && (source.type === "button" || source.type === "switch" || source.type === "text")) {
    const item = structuredClone(source);
    item.deviceDetails = deviceDetails;
    item.dpInit = "";
    if (page.icon) {
      item.data.icon = withIcon(item.data.icon, page.icon);
    }
    return item;
  }
  const data = source.data;
  const text = data && "text" in data && data.text ? structuredClone(data.text) : data && "headline" in data && data.headline ? { true: structuredClone(data.headline), false: structuredClone(data.headline) } : void 0;
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
function devicePageSlotItem(deviceId, kind, entry, common, name) {
  if (!(0, import_deviceDetails.devicePageSlotAccepts)(kind, common)) {
    return void 0;
  }
  const nameItem = { type: "const", constVal: name };
  const value = { type: "triggered", dp: entry.id };
  switch (kind) {
    case "info":
      return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name, "keepSelect"), dpInit: "" };
    case "value":
      return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name, "all"), dpInit: "" };
    case "switch":
      return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, name), dpInit: "" };
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
      const icon = { type: "const", constVal: look.icon };
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
function devicePageStatusItem(deviceId, entry, common) {
  return { ...(0, import_device_details.deviceDetailRowItem)(deviceId, entry, common, "", "all"), dpInit: "" };
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
  for (let i = 0; i < kinds.length; i++) {
    const ref = (_b = page.slots[i]) != null ? _b : null;
    const common = await readCommon(ref);
    if (ref && common) {
      present.push({ index: i, entry: ref, common });
    }
  }
  const names = (0, import_device_details.deviceDetailRowNames)(
    details.deviceId,
    present.map((p) => p.entry),
    present.map((p) => p.common),
    translate,
    language,
    null
  );
  const slots = kinds.map(() => void 0);
  present.forEach((p, n) => {
    var _a2;
    const item = devicePageSlotItem(details.deviceId, kinds[p.index], p.entry, p.common, (_a2 = names[n]) != null ? _a2 : "");
    if (!item) {
      skipped.push(p.entry.id);
    }
    slots[p.index] = item;
  });
  const statusCommon = await readCommon((_c = page.status) != null ? _c : null);
  const status = page.status && statusCommon ? devicePageStatusItem(details.deviceId, page.status, statusCommon) : void 0;
  return {
    headline,
    slotCount: kinds.length,
    elements: [
      devicePageMainItem(source, details, page),
      ...slots,
      page.showInfo ? devicePageInfoItem(details) : void 0,
      status
    ],
    skipped
  };
}
function devicePagePageConfig(uniqueID, layout, alwaysOn, content) {
  return {
    uniqueID,
    alwaysOn,
    dpInit: "",
    pageItems: [],
    config: {
      card: cardDeviceOf(layout),
      data: { headline: { type: "const", constVal: content.headline } },
      slotCount: content.slotCount,
      elements: content.elements
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
  devicePageElements,
  devicePageInfoItem,
  devicePageMainElement,
  devicePageMainItem,
  devicePagePageConfig,
  devicePageSlotItem,
  devicePageStatusItem,
  fitDevicePageStatus,
  optionalValueOf,
  supportsCardDevice
});
//# sourceMappingURL=device-page.js.map
