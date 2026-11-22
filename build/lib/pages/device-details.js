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
var device_details_exports = {};
__export(device_details_exports, {
  DEVICE_DETAIL_PAGE_PREFIX: () => DEVICE_DETAIL_PAGE_PREFIX,
  beginDeviceDetailsRun: () => beginDeviceDetailsRun,
  deviceDetailGroupColor: () => deviceDetailGroupColor,
  deviceDetailPageConfig: () => deviceDetailPageConfig,
  deviceDetailRowItem: () => deviceDetailRowItem,
  deviceDetailRowNames: () => deviceDetailRowNames,
  deviceDetailRows: () => deviceDetailRows,
  isLatestDeviceDetailsRun: () => isLatestDeviceDetailsRun
});
module.exports = __toCommonJS(device_details_exports);
var import_Color = require("../const/Color");
var import_deviceDetails = require("../types/deviceDetails");
const DEVICE_DETAIL_PAGE_PREFIX = "dd_";
const deviceDetailsRuns = /* @__PURE__ */ new WeakMap();
function beginDeviceDetailsRun(panel) {
  var _a;
  const run = ((_a = deviceDetailsRuns.get(panel)) != null ? _a : 0) + 1;
  deviceDetailsRuns.set(panel, run);
  return run;
}
function isLatestDeviceDetailsRun(panel, run) {
  return deviceDetailsRuns.get(panel) === run;
}
const fallbackIcon = {
  button: "gesture-tap-button",
  switch: "toggle-switch",
  boolean: "toggle-switch",
  select: "format-list-bulleted",
  number: "numeric",
  text: "information-outline"
};
function deviceDetailGroupColor(group) {
  switch (group) {
    case "energy":
      return import_Color.Color.deviceEnergy;
    case "climate":
      return import_Color.Color.temperature;
    case "connection":
      return import_Color.Color.deviceConnection;
    case "info":
      return import_Color.Color.deviceInfo;
  }
}
function nameOfCommon(name, language) {
  var _a, _b;
  if (typeof name === "string") {
    return name;
  }
  if (name && typeof name === "object") {
    return (_b = (_a = name[language]) != null ? _a : name.en) != null ? _b : "";
  }
  return "";
}
function deviceDetailRowNames(deviceId, entries, commons, translate, language) {
  const rows = entries.map((e, index) => {
    var _a, _b;
    return {
      id: e.id,
      name: e.key ? translate((0, import_deviceDetails.deviceDetailNameKey)(e.key)) : nameOfCommon((_a = commons[index]) == null ? void 0 : _a.name, language) || ((_b = e.id.split(".").pop()) != null ? _b : e.id),
      subName: e.subName
    };
  });
  const subs = (0, import_deviceDetails.deviceDetailSubNames)(deviceId, rows);
  return rows.map((r, index) => {
    var _a, _b;
    const text = (_b = (_a = subs[index]) == null ? void 0 : _a.text) != null ? _b : "";
    return text ? `${r.name} ${text}` : r.name;
  });
}
function deviceDetailRowItem(deviceId, entry, common, name) {
  var _a, _b, _c;
  const kind = (0, import_deviceDetails.deviceDetailRowKind)(common);
  const maskEntry = (0, import_deviceDetails.deviceDetailEntryOfRow)(deviceId, entry.key, {
    id: entry.id,
    role: (_a = common.role) != null ? _a : "",
    unit: common.unit
  });
  const icon = { type: "const", constVal: (_b = maskEntry == null ? void 0 : maskEntry.icon) != null ? _b : fallbackIcon[kind] };
  const valueColor = {
    type: "const",
    constVal: deviceDetailGroupColor((_c = maskEntry == null ? void 0 : maskEntry.group) != null ? _c : "info")
  };
  const nameItem = { type: "const", constVal: name };
  const text = { true: nameItem, false: nameItem };
  const value = { type: "triggered", dp: entry.id };
  switch (kind) {
    case "switch":
      return {
        type: "switch",
        role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
        data: {
          icon: {
            true: { value: icon, color: { type: "const", constVal: import_Color.Color.activated } },
            false: { value: icon, color: { type: "const", constVal: import_Color.Color.deactivated } }
          },
          entity1: { value },
          text
        }
      };
    case "boolean":
      return {
        type: "text",
        role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
        data: {
          icon: {
            true: { value: icon, color: { type: "const", constVal: import_Color.Color.activated } },
            false: { value: icon, color: { type: "const", constVal: import_Color.Color.deactivated } }
          },
          entity1: { value },
          text,
          text1: { true: { type: "const", constVal: "on" }, false: { type: "const", constVal: "off" } }
        }
      };
    case "button":
      return {
        type: "button",
        role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
        data: {
          icon: {
            true: { value: icon, color: { type: "const", constVal: import_Color.Color.activated } },
            false: { value: icon, color: { type: "const", constVal: import_Color.Color.activated } }
          },
          entity1: { set: { type: "state", dp: entry.id } },
          text,
          text1: { true: { type: "const", constVal: "press" }, false: { type: "const", constVal: "press" } }
        }
      };
    case "select":
      return {
        type: "input_sel",
        role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
        data: {
          icon: { true: { value: icon, color: valueColor }, false: { value: icon, color: valueColor } },
          // the list of popupInSel comes from common.states (PageItem.getListFromStates), the choice writes
          // its key (PageItem.setListCommand)
          entityInSel: { value },
          headline: nameItem,
          // the row shows the text of the current value: the input_sel row looks it up in common.states
          text: { true: value }
        }
      };
    case "number":
    case "text":
      return {
        type: "text",
        role: import_deviceDetails.DEVICE_DETAIL_ROW_ROLE,
        data: {
          icon: { true: { value: icon, color: valueColor }, false: { value: icon, color: valueColor } },
          entity2: (0, import_deviceDetails.hasCommonStatesList)(common.states) ? {
            // the text of the value in common.states (an unknown value as it is), no unit behind
            value: { ...value, commonStates: { mode: "text", keepValue: true } },
            unit: { type: "const", constVal: "" }
          } : { value },
          text
        }
      };
  }
}
function deviceDetailPageConfig(uniqueID, headline, alwaysOn, rows) {
  return {
    uniqueID,
    alwaysOn,
    dpInit: "",
    pageItems: rows,
    config: {
      card: "cardEntities",
      scrollPresentation: "classic",
      scrollType: "page",
      data: { headline: { type: "const", constVal: headline } }
    }
  };
}
async function deviceDetailRows(details, getObject, translate, language) {
  var _a;
  const device = await getObject(details.deviceId);
  const headline = nameOfCommon((_a = device == null ? void 0 : device.common) == null ? void 0 : _a.name, language) || details.deviceId.split(".").pop() || "";
  const entries = [];
  const commons = [];
  for (const entry of details.entries) {
    const obj = await getObject(entry.id);
    if ((obj == null ? void 0 : obj.type) !== "state") {
      continue;
    }
    entries.push(entry);
    commons.push(obj.common);
  }
  const names = deviceDetailRowNames(details.deviceId, entries, commons, translate, language);
  const rows = entries.map(
    (entry, index) => deviceDetailRowItem(details.deviceId, entry, commons[index], names[index])
  );
  return { headline, rows };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEVICE_DETAIL_PAGE_PREFIX,
  beginDeviceDetailsRun,
  deviceDetailGroupColor,
  deviceDetailPageConfig,
  deviceDetailRowItem,
  deviceDetailRowNames,
  deviceDetailRows,
  isLatestDeviceDetailsRun
});
//# sourceMappingURL=device-details.js.map
