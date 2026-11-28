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
var deviceDetails_exports = {};
__export(deviceDetails_exports, {
  DEFAULT_DEVICE_DETAIL_STATE_DEPTH: () => DEFAULT_DEVICE_DETAIL_STATE_DEPTH,
  DEVICE_DETAIL_NAME_PREFIX: () => DEVICE_DETAIL_NAME_PREFIX,
  DEVICE_DETAIL_ROW_ROLE: () => DEVICE_DETAIL_ROW_ROLE,
  DEVICE_PAGE_CHANNEL_ITEM_FIELDS: () => DEVICE_PAGE_CHANNEL_ITEM_FIELDS,
  DEVICE_PAGE_CHANNEL_ROLES: () => DEVICE_PAGE_CHANNEL_ROLES,
  DEVICE_PAGE_EXTRA_SLOTS: () => DEVICE_PAGE_EXTRA_SLOTS,
  DEVICE_PAGE_FIELDS: () => DEVICE_PAGE_FIELDS,
  DEVICE_PAGE_FIELDS_BY_MODEL: () => DEVICE_PAGE_FIELDS_BY_MODEL,
  DEVICE_PAGE_FIELDS_US_P: () => DEVICE_PAGE_FIELDS_US_P,
  DEVICE_PAGE_FIELDS_WEB_L: () => DEVICE_PAGE_FIELDS_WEB_L,
  DEVICE_PAGE_FIELDS_WEB_P: () => DEVICE_PAGE_FIELDS_WEB_P,
  DEVICE_PAGE_ICONS_COMMAND: () => DEVICE_PAGE_ICONS_COMMAND,
  DEVICE_PAGE_INFO_ROLE: () => DEVICE_PAGE_INFO_ROLE,
  DEVICE_PAGE_LAYOUTS: () => DEVICE_PAGE_LAYOUTS,
  DEVICE_PAGE_NAVIGATION_ICON: () => DEVICE_PAGE_NAVIGATION_ICON,
  DEVICE_PAGE_PROGRESS_ROLE: () => DEVICE_PAGE_PROGRESS_ROLE,
  DEVICE_PAGE_RECEIVE_BYTES: () => DEVICE_PAGE_RECEIVE_BYTES,
  DEVICE_PAGE_SLOT_LOOK_FIELDS: () => DEVICE_PAGE_SLOT_LOOK_FIELDS,
  DEVICE_PAGE_STAGE_CAPACITY: () => DEVICE_PAGE_STAGE_CAPACITY,
  DEVICE_PAGE_STAGE_HIDDEN_SLOTS: () => DEVICE_PAGE_STAGE_HIDDEN_SLOTS,
  DEVICE_PAGE_STATUS_COMMAND: () => DEVICE_PAGE_STATUS_COMMAND,
  DEVICE_PAGE_STATUS_INTERVAL_MS: () => DEVICE_PAGE_STATUS_INTERVAL_MS,
  DEVICE_PAGE_STATUS_MAX_BYTES: () => DEVICE_PAGE_STATUS_MAX_BYTES,
  DEVICE_PAGE_STATUS_MAX_PARTS: () => DEVICE_PAGE_STATUS_MAX_PARTS,
  DEVICE_PAGE_STATUS_SLOTS: () => DEVICE_PAGE_STATUS_SLOTS,
  DEVICE_PAGE_STATUS_SLOTS_MAX: () => DEVICE_PAGE_STATUS_SLOTS_MAX,
  DEVICE_PAGE_TEXT_FONT: () => DEVICE_PAGE_TEXT_FONT,
  DEVICE_PAGE_TEXT_MAX_BYTES: () => DEVICE_PAGE_TEXT_MAX_BYTES,
  SENDTO_GET_DEVICE_DETAILS_COMMAND: () => SENDTO_GET_DEVICE_DETAILS_COMMAND,
  buildDeviceDetailRows: () => buildDeviceDetailRows,
  defaultDevicePageConfig: () => defaultDevicePageConfig,
  defaultDevicePageSlots: () => defaultDevicePageSlots,
  deviceDetailEntriesOfRows: () => deviceDetailEntriesOfRows,
  deviceDetailEntryByKey: () => deviceDetailEntryByKey,
  deviceDetailEntryOfRow: () => deviceDetailEntryOfRow,
  deviceDetailEntryOfState: () => deviceDetailEntryOfState,
  deviceDetailGroupColorKey: () => deviceDetailGroupColorKey,
  deviceDetailIdentifier: () => deviceDetailIdentifier,
  deviceDetailMaskOf: () => deviceDetailMaskOf,
  deviceDetailMasks: () => import_deviceDetailMasks2.deviceDetailMasks,
  deviceDetailNameKey: () => deviceDetailNameKey,
  deviceDetailRowKind: () => deviceDetailRowKind,
  deviceDetailRuleMatches: () => deviceDetailRuleMatches,
  deviceDetailSubNameTokens: () => deviceDetailSubNameTokens,
  deviceDetailSubNames: () => deviceDetailSubNames,
  deviceDetailsAdapter: () => deviceDetailsAdapter,
  deviceDetailsLearnedOf: () => deviceDetailsLearnedOf,
  deviceDetailsRuntimeOf: () => deviceDetailsRuntimeOf,
  devicePageChannelItemFieldsOf: () => devicePageChannelItemFieldsOf,
  devicePageChannelTakesLongPress: () => devicePageChannelTakesLongPress,
  devicePageChannelTakesNavigation: () => devicePageChannelTakesNavigation,
  devicePageConfigOf: () => devicePageConfigOf,
  devicePageConfigSlotKinds: () => devicePageConfigSlotKinds,
  devicePageExtraSlotCount: () => devicePageExtraSlotCount,
  devicePageExtraSlotKinds: () => devicePageExtraSlotKinds,
  devicePageFields: () => devicePageFields,
  devicePageHasStatusIcons: () => devicePageHasStatusIcons,
  devicePageProgressPercent: () => devicePageProgressPercent,
  devicePageSlotAccepts: () => devicePageSlotAccepts,
  devicePageSlotAcceptsChannel: () => devicePageSlotAcceptsChannel,
  devicePageSlotAcceptsNavigation: () => devicePageSlotAcceptsNavigation,
  devicePageSlotCount: () => devicePageSlotCount,
  devicePageSlotFields: () => devicePageSlotFields,
  devicePageSlotHasLook: () => devicePageSlotHasLook,
  devicePageSlotHiddenByStage: () => devicePageSlotHiddenByStage,
  devicePageSlotLookOf: () => devicePageSlotLookOf,
  devicePageSlotTakesLongPress: () => devicePageSlotTakesLongPress,
  devicePageSlotTakesNavigation: () => devicePageSlotTakesNavigation,
  devicePageSlotTakesTextSize: () => devicePageSlotTakesTextSize,
  devicePageSlotTargetOf: () => devicePageSlotTargetOf,
  devicePageStageOf: () => devicePageStageOf,
  devicePageStatusCapacity: () => devicePageStatusCapacity,
  deviceSelectionError: () => deviceSelectionError,
  deviceShortPressOf: () => deviceShortPressOf,
  exchangeDeviceDetailRowState: () => exchangeDeviceDetailRowState,
  fitDevicePageSlots: () => fitDevicePageSlots,
  generalDeviceDetailMask: () => import_deviceDetailMasks2.generalDeviceDetailMask,
  hasCommonStatesList: () => hasCommonStatesList,
  hasOwnDeviceDetailMask: () => hasOwnDeviceDetailMask,
  isDeviceDetailState: () => isDeviceDetailState,
  isDeviceDetailsConfig: () => isDeviceDetailsConfig,
  isDevicePageLayout: () => isDevicePageLayout,
  isDevicePageStatusStage: () => isDevicePageStatusStage,
  isDeviceShortPressState: () => isDeviceShortPressState,
  tickDeviceDetailRow: () => tickDeviceDetailRow,
  tickedDeviceDetailRowsFirst: () => tickedDeviceDetailRowsFirst,
  updatedDeviceDetailsLearned: () => updatedDeviceDetailsLearned
});
module.exports = __toCommonJS(deviceDetails_exports);
var import_adminShareConfig = require("./adminShareConfig");
var import_deviceDetailMasks = require("./deviceDetailMasks");
var import_deviceDetailMasks2 = require("./deviceDetailMasks");
const SENDTO_GET_DEVICE_DETAILS_COMMAND = "getDeviceDetails";
const DEVICE_DETAIL_ROW_ROLE = "deviceDetail";
const DEVICE_PAGE_INFO_ROLE = "devicePageInfo";
const DEVICE_DETAIL_NAME_PREFIX = "deviceDetail_";
const deviceDetailGroupColorKey = {
  energy: "deviceEnergy",
  climate: "temperature",
  connection: "deviceConnection",
  info: "deviceInfo"
};
function isDeviceShortPressState(state) {
  return state.type === "boolean" && state.write;
}
function deviceShortPressOf(config) {
  switch (config.shortPress) {
    case "none":
    case "navigation":
    case "popup":
    case "devicePage":
      return config.shortPress;
    default:
      return "state";
  }
}
const DEVICE_PAGE_LAYOUTS = {
  /** "Steuern" (control): the status icons are no slots, they come with devIcons ({@link DEVICE_PAGE_STATUS_SLOTS}) */
  1: ["info", "info", "button", "button", "button", "button"],
  /** "Fortschritt" (progress) */
  2: ["value", "progress", "info", "info", "info", "button"],
  /** "Werte" (values) */
  3: ["info", "info", "info", "info", "info", "info", "switch", "switch"]
};
const DEVICE_PAGE_STATUS_SLOTS = {
  1: 16,
  2: 0,
  3: 8
};
const DEVICE_PAGE_STATUS_SLOTS_MAX = 16;
const DEVICE_PAGE_STAGE_CAPACITY = {
  1: [0, 6, 10, 16],
  2: [0],
  3: [0, 4, 8]
};
const DEVICE_PAGE_STAGE_HIDDEN_SLOTS = {
  1: [[], [], [], [0, 1]],
  2: [[]],
  3: [[], [0], [0, 1]]
};
function isDevicePageStatusStage(value) {
  return value === 0 || value === 1 || value === 2 || value === 3;
}
function devicePageStageOf(layout, stage) {
  const max = DEVICE_PAGE_STAGE_CAPACITY[layout].length - 1;
  const value = isDevicePageStatusStage(stage) ? stage : 0;
  const out = Math.min(value, max);
  return isDevicePageStatusStage(out) ? out : 0;
}
function devicePageStatusCapacity(layout, stage) {
  var _a;
  return (_a = DEVICE_PAGE_STAGE_CAPACITY[layout][devicePageStageOf(layout, stage)]) != null ? _a : 0;
}
function devicePageSlotHiddenByStage(layout, stage, slot) {
  var _a;
  return ((_a = DEVICE_PAGE_STAGE_HIDDEN_SLOTS[layout][devicePageStageOf(layout, stage)]) != null ? _a : []).includes(slot);
}
const DEVICE_PAGE_EXTRA_SLOTS = {
  /** "Steuern": 6 buttons */
  1: ["button", "button"],
  /** "Fortschritt": 4 infos, 3 buttons */
  2: ["info", "button", "button"],
  /** "Werte": 8 infos, 3 switches */
  3: ["info", "info", "switch"]
};
function devicePageExtraSlotKinds(layout, model) {
  return (0, import_adminShareConfig.isWebPanelModel)(model) ? DEVICE_PAGE_EXTRA_SLOTS[layout] : [];
}
function devicePageExtraSlotCount(layout, model) {
  return devicePageExtraSlotKinds(layout, model).length;
}
function devicePageConfigSlotKinds(layout) {
  return [...DEVICE_PAGE_LAYOUTS[layout], ...DEVICE_PAGE_EXTRA_SLOTS[layout]];
}
const DEVICE_PAGE_TEXT_FONT = 0;
const DEVICE_PAGE_STATUS_MAX_BYTES = 63;
const DEVICE_PAGE_STATUS_COMMAND = "devStatus";
const DEVICE_PAGE_ICONS_COMMAND = "devIcons";
const DEVICE_PAGE_STATUS_MAX_PARTS = 3;
const DEVICE_PAGE_STATUS_INTERVAL_MS = 3e3;
const DEVICE_PAGE_RECEIVE_BYTES = {
  1: 703,
  2: 775,
  3: 959
};
const DEVICE_PAGE_TEXT_MAX_BYTES = 31;
const DEVICE_PAGE_FIELDS = {
  1: {
    mainName: 110,
    status: 390,
    slots: { info: { name: 164, value: 110 }, button: { name: 104 } },
    // the status grid right of the big icon: stage 1 set B (icon, name 43 px, the value of set A), stage 2 set C
    // (icon and value 81 px, no name), stage 3 no info rows
    slotsByStage: { 1: { info: { name: 43, value: 110 } }, 2: { info: { name: 0, value: 81 } } }
  },
  2: {
    mainName: 96,
    status: 390,
    slots: {
      value: { name: 190, value: 190, valueFont: 4 },
      progress: { name: 429 },
      info: { name: 104, value: 104 },
      button: { name: 100 }
    }
  },
  3: {
    mainName: 100,
    status: 390,
    slots: { info: { name: 125, value: 125 }, switch: { name: 125 } }
  }
};
const DEVICE_PAGE_FIELDS_US_P = {
  1: {
    mainName: 150,
    status: 262,
    slots: { info: { name: 156, value: 104 }, button: { name: 148 } },
    // the status grid where the info rows are, the rows right of the big icon as set C (icon, value 106 px) in
    // stages 1 and 2, none in stage 3; us-p has no set B
    slotsByStage: { 1: { info: { name: 0, value: 106 } }, 2: { info: { name: 0, value: 106 } } }
  },
  2: {
    mainName: 90,
    status: 262,
    slots: {
      value: { name: 172, value: 172, valueFont: 4 },
      progress: { name: 300 },
      info: { name: 156, value: 104 },
      button: { name: 300 }
    }
  },
  3: {
    mainName: 300,
    status: 262,
    slots: { info: { name: 112, value: 112 }, switch: { name: 212 } }
  }
};
const DEVICE_PAGE_FIELDS_WEB_L = {
  1: {
    mainName: 110,
    status: 580,
    slots: { info: { name: 354, value: 110 }, button: { name: 100 } },
    slotsByStage: { 1: { info: { name: 233, value: 110 } }, 2: { info: { name: 0, value: 271 } } }
  },
  2: {
    mainName: 96,
    status: 580,
    slots: {
      value: { name: 190, value: 190, valueFont: 4 },
      progress: { name: 620 },
      info: { name: 104, value: 104 },
      button: { name: 96 }
    }
  },
  3: {
    mainName: 100,
    status: 580,
    slots: { info: { name: 125, value: 125 }, switch: { name: 125 } }
  }
};
const DEVICE_PAGE_FIELDS_WEB_P = {
  1: DEVICE_PAGE_FIELDS_US_P[1],
  2: {
    ...DEVICE_PAGE_FIELDS_US_P[2],
    slots: { ...DEVICE_PAGE_FIELDS_US_P[2].slots, button: { name: 96 } }
  },
  3: DEVICE_PAGE_FIELDS_US_P[3]
};
const DEVICE_PAGE_FIELDS_BY_MODEL = {
  eu: DEVICE_PAGE_FIELDS,
  "us-l": DEVICE_PAGE_FIELDS,
  "us-p": DEVICE_PAGE_FIELDS_US_P,
  "web-l": DEVICE_PAGE_FIELDS_WEB_L,
  "web-p": DEVICE_PAGE_FIELDS_WEB_P
};
function devicePageFields(layout, model) {
  return DEVICE_PAGE_FIELDS_BY_MODEL[model][layout];
}
function devicePageSlotCount(layout) {
  return DEVICE_PAGE_LAYOUTS[layout].length;
}
function devicePageHasStatusIcons(config) {
  var _a;
  const capacity = devicePageStatusCapacity(config.layout, devicePageStageOf(config.layout, config.statusStage));
  return ((_a = config.statusSlots) != null ? _a : []).slice(0, capacity).some((slot) => !!slot);
}
function devicePageSlotFields(layout, kind, stage, model = "eu") {
  var _a, _b;
  const fields = devicePageFields(layout, model);
  if (stage > 0) {
    const staged = (_b = (_a = fields.slotsByStage) == null ? void 0 : _a[stage]) == null ? void 0 : _b[kind];
    if (staged) {
      return staged;
    }
  }
  return fields.slots[kind];
}
function devicePageSlotAccepts(kind, state) {
  const writable = state.write !== false;
  const button = state.read === false;
  switch (kind) {
    case "info":
    case "value":
    case "status":
      return true;
    case "button":
      return button || state.type === "boolean" && writable;
    case "switch":
      return !button && state.type === "boolean" && writable;
    case "progress":
      return !button && state.type === "number";
  }
}
const CHANNEL_SENSOR_ROLES = [
  "temperature",
  "value.temperature",
  "humidity",
  "value.humidity",
  "thermostat",
  "airCondition",
  "motion",
  "door",
  "window",
  "info",
  "warning"
];
const CHANNEL_SWITCH_ROLES = ["socket", "light", "dimmer", "hue", "rgb", "rgbSingle", "ct", "level.mode.fan"];
const CHANNEL_NUMBER_ROLES = ["slider", "volume"];
const CHANNEL_NO_VALUE_ROLES = ["button", "blind", "gate", "lock"];
const CHANNEL_TEXT_ROLES = ["select", "level.timer"];
const DEVICE_PAGE_CHANNEL_ROLES = {
  info: [
    ...CHANNEL_SWITCH_ROLES,
    ...CHANNEL_NUMBER_ROLES,
    ...CHANNEL_TEXT_ROLES,
    ...CHANNEL_NO_VALUE_ROLES,
    ...CHANNEL_SENSOR_ROLES
  ],
  value: [...CHANNEL_SENSOR_ROLES, ...CHANNEL_NUMBER_ROLES, ...CHANNEL_TEXT_ROLES, ...CHANNEL_SWITCH_ROLES],
  progress: CHANNEL_NUMBER_ROLES,
  button: [
    ...CHANNEL_SWITCH_ROLES,
    ...CHANNEL_NUMBER_ROLES,
    ...CHANNEL_TEXT_ROLES,
    ...CHANNEL_NO_VALUE_ROLES,
    ...CHANNEL_SENSOR_ROLES
  ],
  switch: CHANNEL_SWITCH_ROLES,
  status: [
    ...CHANNEL_SWITCH_ROLES,
    ...CHANNEL_NUMBER_ROLES,
    ...CHANNEL_TEXT_ROLES,
    ...CHANNEL_NO_VALUE_ROLES,
    ...CHANNEL_SENSOR_ROLES
  ]
};
function devicePageChannelTakesLongPress(role) {
  return role === "button" || role === "socket";
}
function devicePageSlotTakesLongPress(kind, ref, channelRole) {
  if (!ref) {
    return false;
  }
  return ref.custom === "channel" ? devicePageChannelTakesLongPress(channelRole) : kind === "button" || kind === "switch";
}
function devicePageSlotAcceptsChannel(kind, role) {
  return typeof role === "string" && DEVICE_PAGE_CHANNEL_ROLES[kind].includes(role);
}
const DEVICE_PAGE_PROGRESS_ROLE = "devicePageProgress";
function devicePageProgressPercent(value, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }
  let percent = value;
  if (typeof min === "number" && typeof max === "number" && max > min) {
    percent = (value - min) / (max - min) * 100;
  }
  return Math.min(100, Math.max(0, Math.round(percent)));
}
const DEVICE_PAGE_CHANNEL_ITEM_FIELDS = [
  "useValue",
  "useValueConditions",
  "valueEntry",
  "inSel_Alias",
  "modeList",
  "minValue",
  "maxValue",
  "secondRow",
  "useScreensaverTimer",
  "minValueBrightness",
  "maxValueBrightness",
  "minValueColorTemp",
  "maxValueColorTemp",
  "colormode"
];
const DEVICE_PAGE_SLOT_LOOK_FIELDS = [
  "trueIcon",
  "falseIcon",
  "trueColor",
  "falseColor",
  "longPress",
  "name"
];
function devicePageSlotTakesTextSize(kind) {
  return kind !== "status" && kind !== "progress";
}
const DEVICE_PAGE_NAVIGATION_ICON = "gesture-tap-button";
function devicePageSlotAcceptsNavigation(kind) {
  return kind === "info" || kind === "button" || kind === "status";
}
const CHANNEL_POPUP_ON_TAP_ROLES = ["blind", "gate", "lock", "select", "level.timer"];
function devicePageChannelTakesNavigation(role) {
  return typeof role === "string" && DEVICE_PAGE_CHANNEL_ROLES.info.includes(role) && !CHANNEL_POPUP_ON_TAP_ROLES.includes(role);
}
function devicePageSlotTakesNavigation(ref, channelRole) {
  if (!ref) {
    return false;
  }
  return ref.custom === "channel" ? devicePageChannelTakesNavigation(channelRole) : true;
}
function devicePageSlotTargetOf(ref) {
  var _a;
  if (!ref) {
    return "";
  }
  return ref.custom === "navigation" || ref.isNavigation ? (_a = ref.targetPage) != null ? _a : "" : "";
}
function devicePageSlotLookOf(ref, withOlderIcon = true) {
  var _a;
  const legacy = !withOlderIcon || ref.trueIcon || ref.falseIcon ? "" : (_a = ref.icon) != null ? _a : "";
  const look = {};
  const trueIcon = ref.trueIcon || legacy;
  const falseIcon = ref.falseIcon || legacy;
  if (trueIcon) {
    look.trueIcon = trueIcon;
  }
  if (falseIcon) {
    look.falseIcon = falseIcon;
  }
  if (ref.trueColor) {
    look.trueColor = ref.trueColor;
  }
  if (ref.falseColor) {
    look.falseColor = ref.falseColor;
  }
  if (ref.scale) {
    look.scale = ref.scale;
  }
  if (ref.longPress) {
    look.longPress = ref.longPress;
  }
  if (ref.name) {
    look.name = ref.name;
  }
  if (ref.textSize !== void 0) {
    look.textSize = ref.textSize;
  }
  if (ref.isNavigation && ref.custom !== "navigation") {
    look.isNavigation = true;
    if (ref.targetPage) {
      look.targetPage = ref.targetPage;
    }
  }
  return ref.custom === "channel" ? { ...look, ...devicePageChannelItemFieldsOf(ref) } : look;
}
function devicePageSlotHasLook(ref) {
  return !!ref && Object.keys(devicePageSlotLookOf(ref)).length > 0;
}
function fitDevicePageSlots(slots, layout, from) {
  const fit = (slot, kind) => {
    if (!slot) {
      return null;
    }
    const out = { ...slot };
    if (kind !== "status") {
      delete out.icon;
    }
    return out;
  };
  const fromCount = DEVICE_PAGE_LAYOUTS[from].length;
  const fitted = DEVICE_PAGE_LAYOUTS[layout].map((kind, i) => fit(i < fromCount ? slots[i] : null, kind));
  const extras = DEVICE_PAGE_EXTRA_SLOTS[layout].map((kind, k) => fit(slots[fromCount + k], kind));
  return extras.some((slot) => slot !== null) ? [...fitted, ...extras] : fitted;
}
function defaultDevicePageSlots(entries, layout) {
  const rows = entries.filter((e) => e.id !== "");
  let next = 0;
  return DEVICE_PAGE_LAYOUTS[layout].map((kind) => {
    if ((kind === "info" || kind === "value") && next < rows.length) {
      return { ...rows[next++] };
    }
    return null;
  });
}
function defaultDevicePageConfig(entries, layout = 1) {
  return { layout, slots: defaultDevicePageSlots(entries, layout), showInfo: true };
}
function isDevicePageLayout(value) {
  return value === 1 || value === 2 || value === 3;
}
function devicePageStateRefOf(value, keepIcon) {
  var _a;
  if (!isDeviceDetailEntryConfig(value) || value.id === "") {
    return null;
  }
  const ref = { key: value.key, id: value.id };
  const subName = (_a = value.subName) == null ? void 0 : _a.trim();
  if (subName) {
    ref.subName = subName;
  }
  const icon = keepIcon && "icon" in value && typeof value.icon === "string" ? value.icon.trim() : "";
  if (icon) {
    ref.icon = icon;
  }
  return ref;
}
function fieldOf(value, key) {
  var _a;
  return (_a = Object.entries(value).find(([k]) => k === key)) == null ? void 0 : _a[1];
}
function trimmedField(value, key) {
  const found = fieldOf(value, key);
  return typeof found === "string" ? found.trim() : "";
}
function numberField(value, key) {
  const found = fieldOf(value, key);
  return typeof found === "number" && Number.isFinite(found) ? found : void 0;
}
function devicePageChannelItemFieldsOf(value) {
  const out = {};
  for (const key of ["useValue", "useScreensaverTimer", "colormode"]) {
    if (fieldOf(value, key) === true) {
      out[key] = true;
    }
  }
  for (const key of ["useValueConditions", "inSel_Alias", "secondRow"]) {
    const text = trimmedField(value, key);
    if (text) {
      out[key] = text;
    }
  }
  for (const key of [
    "minValue",
    "maxValue",
    "minValueBrightness",
    "maxValueBrightness",
    "minValueColorTemp",
    "maxValueColorTemp"
  ]) {
    const n = numberField(value, key);
    if (n !== void 0) {
      out[key] = n;
    }
  }
  const modeList = fieldOf(value, "modeList");
  if (Array.isArray(modeList)) {
    const entries = modeList.filter((e) => typeof e === "string" && e !== "");
    if (entries.length > 0) {
      out.modeList = entries;
    }
  }
  const valueEntry = fieldOf(value, "valueEntry");
  if (valueEntry && typeof valueEntry === "object") {
    const entry = (0, import_adminShareConfig.normalizeChannelId)(valueEntry);
    if (entry.valueStateId.trim() !== "") {
      out.valueEntry = entry;
    }
  }
  return out;
}
function devicePageSlotRefOf(value, kind) {
  if (!isDeviceDetailEntryConfig(value)) {
    return null;
  }
  let ref;
  const custom = "custom" in value ? value.custom : void 0;
  const targetPage = trimmedField(value, "targetPage");
  if (custom === "navigation") {
    ref = { key: "", id: "", custom };
    if (targetPage) {
      ref.targetPage = targetPage;
    }
  } else if (custom === "state" || custom === "channel") {
    ref = { key: "", id: value.id.trim(), custom };
  } else {
    ref = devicePageStateRefOf(value, kind === "status");
  }
  if (!ref) {
    return null;
  }
  for (const field of DEVICE_PAGE_SLOT_LOOK_FIELDS) {
    const text = trimmedField(value, field);
    if (text && (!field.endsWith("Color") || /^#[0-9a-f]{6}$/i.test(text))) {
      ref[field] = text;
    }
  }
  if (ref.trueIcon || ref.falseIcon) {
    delete ref.icon;
  }
  const textSize = fieldOf(value, "textSize");
  if ((0, import_adminShareConfig.isHmiTextSize)(textSize)) {
    ref.textSize = textSize;
  }
  if (ref.custom === "channel") {
    Object.assign(ref, devicePageChannelItemFieldsOf(value));
  }
  const scale = "scale" in value ? value.scale : void 0;
  if ((0, import_adminShareConfig.isIconColorScaleElement)(scale)) {
    ref.scale = { ...scale };
  }
  if (ref.custom !== "navigation" && "isNavigation" in value && value.isNavigation === true) {
    ref.isNavigation = true;
    if (targetPage) {
      ref.targetPage = targetPage;
    }
  }
  return ref;
}
function devicePageStatusRefOf(value) {
  if (isDeviceDetailEntryConfig(value) && "custom" in value && value.custom === true) {
    return { key: "", id: value.id.trim(), custom: true };
  }
  return devicePageStateRefOf(value, false);
}
function devicePageConfigOf(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return void 0;
  }
  const layout = "layout" in value && isDevicePageLayout(value.layout) ? value.layout : 1;
  const rawSlots = "slots" in value && Array.isArray(value.slots) ? value.slots : [];
  const slots = [];
  DEVICE_PAGE_LAYOUTS[layout].forEach((kind, i) => {
    slots.push(devicePageSlotRefOf(rawSlots[i], kind));
  });
  const extras = DEVICE_PAGE_EXTRA_SLOTS[layout].map(
    (kind, k) => devicePageSlotRefOf(rawSlots[slots.length + k], kind)
  );
  if (extras.some((slot) => slot !== null)) {
    slots.push(...extras);
  }
  const config = {
    layout,
    slots,
    showInfo: !("showInfo" in value) || value.showInfo !== false
  };
  if ("webExtras" in value && value.webExtras === true) {
    config.webExtras = true;
  }
  const statusStage = "statusStage" in value ? value.statusStage : void 0;
  if (isDevicePageStatusStage(statusStage) && statusStage > 0) {
    config.statusStage = statusStage;
  }
  const rawStatus = "statusSlots" in value && Array.isArray(value.statusSlots) ? value.statusSlots : [];
  const statusSlots = rawStatus.slice(0, DEVICE_PAGE_STATUS_SLOTS_MAX).map((slot) => devicePageSlotRefOf(slot, "status"));
  while (statusSlots.length > 0 && statusSlots[statusSlots.length - 1] === null) {
    statusSlots.pop();
  }
  if (statusSlots.length > 0) {
    config.statusSlots = statusSlots;
  }
  const icon = "icon" in value && typeof value.icon === "string" ? value.icon.trim() : "";
  if (icon) {
    config.icon = icon;
  }
  const status = "status" in value ? devicePageStatusRefOf(value.status) : null;
  if (status) {
    config.status = status;
  }
  return config;
}
function hasCommonStatesList(states) {
  if (Array.isArray(states)) {
    return states.length > 0;
  }
  return !!states && typeof states === "object" && Object.keys(states).length > 0;
}
function deviceDetailRowKind(common) {
  const writable = common.write !== false;
  if (common.read === false) {
    return "button";
  }
  if (common.type === "boolean") {
    return writable ? "switch" : "boolean";
  }
  if (writable && (common.type === "number" || common.type === "string") && hasCommonStatesList(common.states)) {
    return "select";
  }
  if (common.type === "number") {
    return "number";
  }
  return "text";
}
function deviceDetailsAdapter(id) {
  var _a;
  return (_a = id.split(".")[0]) != null ? _a : "";
}
function deviceDetailMaskOf(deviceId) {
  var _a;
  const adapter = deviceDetailsAdapter(deviceId);
  return (_a = import_deviceDetailMasks.deviceDetailMasks.find((m) => m.adapter === adapter)) != null ? _a : import_deviceDetailMasks.generalDeviceDetailMask;
}
function hasOwnDeviceDetailMask(deviceId) {
  return deviceDetailMaskOf(deviceId) !== import_deviceDetailMasks.generalDeviceDetailMask;
}
function deviceSelectionError(id, type) {
  if (type === void 0) {
    return "notFound";
  }
  if (type !== "device" && type !== "channel") {
    return "type";
  }
  const parts = id.split(".");
  const level = parts.length;
  if (level < 3) {
    return "root";
  }
  if (level === 3 && parts[2] === "info") {
    return "info";
  }
  const mask = deviceDetailMaskOf(id);
  if (mask.deviceLevel !== void 0 && mask.deviceLevel !== level) {
    return "level";
  }
  return void 0;
}
const DEFAULT_DEVICE_DETAIL_STATE_DEPTH = 2;
function isDeviceDetailState(deviceId, stateId) {
  var _a;
  if (!deviceId || !stateId.startsWith(`${deviceId}.`)) {
    return false;
  }
  const depth = (_a = deviceDetailMaskOf(deviceId).stateDepth) != null ? _a : DEFAULT_DEVICE_DETAIL_STATE_DEPTH;
  const rest = stateId.slice(deviceId.length + 1).split(".");
  return rest.length >= 1 && rest.length <= depth && rest.every((part) => part !== "");
}
function deviceDetailRuleMatches(rule, state) {
  if (rule.role === void 0 && rule.dp === void 0 && rule.unit === void 0) {
    return false;
  }
  if (rule.role !== void 0) {
    const roles = typeof rule.role === "string" ? [rule.role] : rule.role;
    if (!roles.includes(state.role)) {
      return false;
    }
  }
  if (rule.dp !== void 0 && !state.id.endsWith(rule.dp)) {
    return false;
  }
  if (rule.unit !== void 0 && state.unit !== rule.unit) {
    return false;
  }
  return true;
}
function deviceDetailEntryOfState(mask, state) {
  return mask.entries.find((entry) => entry.rules.some((rule) => deviceDetailRuleMatches(rule, state)));
}
function deviceDetailEntryByKey(deviceId, key) {
  var _a;
  if (!key) {
    return void 0;
  }
  return (_a = deviceDetailMaskOf(deviceId).entries.find((e) => e.key === key)) != null ? _a : import_deviceDetailMasks.generalDeviceDetailMask.entries.find((e) => e.key === key);
}
function deviceDetailEntryOfRow(deviceId, key, state) {
  var _a;
  return (_a = deviceDetailEntryByKey(deviceId, key)) != null ? _a : state ? deviceDetailEntryOfState(import_deviceDetailMasks.generalDeviceDetailMask, state) : void 0;
}
function deviceDetailNameKey(key) {
  return `${DEVICE_DETAIL_NAME_PREFIX}${key}`;
}
function deviceDetailIdentifier(deviceId, row) {
  if (row.key) {
    return row.key;
  }
  return `~${row.id.startsWith(`${deviceId}.`) ? row.id.slice(deviceId.length + 1) : row.id}`;
}
function buildDeviceDetailRows(deviceId, states, saved, learned) {
  var _a;
  const mask = deviceDetailMaskOf(deviceId);
  const own = states.filter((s) => isDeviceDetailState(deviceId, s.id)).sort((a, b) => a.id.localeCompare(b.id));
  const byEntry = /* @__PURE__ */ new Map();
  const rest = [];
  for (const state of own) {
    const entry = deviceDetailEntryOfState(mask, state);
    if (entry) {
      const list = (_a = byEntry.get(entry.key)) != null ? _a : [];
      list.push(state);
      byEntry.set(entry.key, list);
    } else {
      rest.push(state);
    }
  }
  const candidates = [];
  for (const entry of mask.entries) {
    const found = byEntry.get(entry.key);
    if (found && found.length > 0) {
      for (const state of found) {
        candidates.push({ key: entry.key, id: state.id, enabled: false });
      }
    } else if (mask !== import_deviceDetailMasks.generalDeviceDetailMask) {
      candidates.push({ key: entry.key, id: "", enabled: false });
    }
  }
  for (const state of rest) {
    candidates.push({ key: "", id: state.id, enabled: false });
  }
  const same = (a, b) => a.key === b.key && a.id === b.id;
  if (saved && saved.length > 0) {
    const first = [];
    for (const s of saved) {
      if (s.id !== "" && !first.some((f) => f.id === s.id)) {
        first.push(
          s.subName ? { key: s.key, id: s.id, enabled: true, subName: s.subName } : { key: s.key, id: s.id, enabled: true }
        );
      }
    }
    const others = [];
    for (const c of candidates) {
      if (first.some((f) => same(f, c))) {
        continue;
      }
      const row = c.id !== "" && first.some((f) => f.id === c.id) ? { ...c, id: "" } : c;
      if (row.id === "" && (row.key === "" || others.some((r) => same(r, row)) || first.some((f) => f.key === row.key))) {
        continue;
      }
      others.push(row);
    }
    return [...first, ...others];
  }
  if (learned !== void 0) {
    const first = [];
    for (const ident of learned) {
      for (const c of candidates) {
        if (c.id && deviceDetailIdentifier(deviceId, c) === ident && !first.some((f) => same(f, c))) {
          first.push({ ...c, enabled: true });
        }
      }
    }
    return [...first, ...candidates.filter((c) => !first.some((f) => same(f, c)))];
  }
  return candidates.map((c) => ({ ...c, enabled: c.key !== "" && c.id !== "" }));
}
function deviceDetailEntriesOfRows(rows) {
  var _a;
  const out = [];
  for (const r of rows) {
    if (r.enabled && r.id !== "" && !out.some((o) => o.id === r.id)) {
      const subName = (_a = r.subName) == null ? void 0 : _a.trim();
      out.push(subName ? { key: r.key, id: r.id, subName } : { key: r.key, id: r.id });
    }
  }
  return out;
}
function exchangeDeviceDetailRowState(rows, index, id, change = {}) {
  const row = rows[index];
  if (!row) {
    return [...rows];
  }
  const old = row.id;
  const out = [];
  rows.forEach((r, i) => {
    if (i === index) {
      out.push({ ...r, ...change, id, enabled: id !== "" && (r.enabled || old === "") });
    } else if (id !== "" && r.id === id) {
      if (old !== "") {
        out.push({ ...r, id: old });
      } else if (r.key !== "") {
        out.push({ ...r, id: "", enabled: false });
      }
    } else {
      out.push(r);
    }
  });
  return out;
}
function tickedDeviceDetailRowsFirst(rows) {
  return [...rows.filter((r) => r.enabled), ...rows.filter((r) => !r.enabled)];
}
function tickDeviceDetailRow(rows, index, enabled) {
  const row = rows[index];
  if (!row) {
    return [...rows];
  }
  const others = tickedDeviceDetailRowsFirst(rows.filter((_r, i) => i !== index));
  const border = others.filter((r) => r.enabled).length;
  return [...others.slice(0, border), { ...row, enabled }, ...others.slice(border)];
}
function isDeviceDetailEntryConfig(value) {
  return !!value && typeof value === "object" && "key" in value && typeof value.key === "string" && "id" in value && typeof value.id === "string" && (!("subName" in value) || value.subName === void 0 || typeof value.subName === "string");
}
function isDeviceDetailsConfig(value) {
  return !!value && typeof value === "object" && "deviceId" in value && typeof value.deviceId === "string" && value.deviceId !== "" && "entries" in value && Array.isArray(value.entries) && value.entries.every(isDeviceDetailEntryConfig);
}
function deviceDetailsRuntimeOf(config) {
  if (!isDeviceDetailsConfig(config)) {
    return void 0;
  }
  const runtime = {
    deviceId: config.deviceId,
    entries: config.entries.filter((e) => e.id !== "").map((e) => {
      var _a;
      const subName = (_a = e.subName) == null ? void 0 : _a.trim();
      return subName ? { key: e.key, id: e.id, subName } : { key: e.key, id: e.id };
    })
  };
  const page = devicePageConfigOf(config.devicePage);
  if (page) {
    const kinds = devicePageConfigSlotKinds(page.layout);
    const slots = page.slots.map((slot, i) => {
      if (!slot) {
        return null;
      }
      if (slot.custom === "navigation") {
        const kind = kinds[i];
        return slot.targetPage && kind && devicePageSlotAcceptsNavigation(kind) ? slot : null;
      }
      return slot.id !== "" ? slot : null;
    });
    const count = DEVICE_PAGE_LAYOUTS[page.layout].length;
    const withExtras = page.webExtras === true && slots.slice(count).some((slot) => slot !== null);
    const devicePage = {
      layout: page.layout,
      slots: withExtras ? slots : slots.slice(0, count),
      // without rows the detail page would be empty: no info icon
      showInfo: page.showInfo && runtime.entries.length > 0,
      shortPress: deviceShortPressOf(config)
    };
    const statusStage = devicePageStageOf(page.layout, page.statusStage);
    if (statusStage > 0) {
      devicePage.statusStage = statusStage;
    }
    const statusCount = DEVICE_PAGE_STATUS_SLOTS[page.layout];
    if (statusCount > 0 && page.statusSlots) {
      const statusSlots = page.statusSlots;
      devicePage.statusSlots = Array.from({ length: statusCount }, (_v, i) => {
        const slot = statusSlots[i];
        if (!slot) {
          return null;
        }
        if (slot.custom === "navigation") {
          return slot.targetPage && devicePageSlotAcceptsNavigation("status") ? slot : null;
        }
        return slot.id !== "" ? slot : null;
      });
    }
    if (page.icon) {
      devicePage.icon = page.icon;
    }
    if (page.status && page.status.id !== "") {
      devicePage.status = page.status;
    }
    runtime.devicePage = devicePage;
  }
  return runtime;
}
function deviceDetailsLearnedOf(value) {
  const out = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return out;
  }
  for (const [adapter, list] of Object.entries(value)) {
    if (Array.isArray(list) && list.every((v) => typeof v === "string")) {
      out[adapter] = [...list];
    }
  }
  return out;
}
function updatedDeviceDetailsLearned(learned, before, after, edited) {
  if (!after.deviceId || !edited) {
    return void 0;
  }
  const identifiers = (config) => config.entries.map((e) => deviceDetailIdentifier(config.deviceId, e));
  const now = identifiers(after);
  if (before && before.deviceId === after.deviceId && JSON.stringify(identifiers(before)) === JSON.stringify(now)) {
    return void 0;
  }
  const adapter = deviceDetailsAdapter(after.deviceId);
  if (JSON.stringify(learned[adapter]) === JSON.stringify(now)) {
    return void 0;
  }
  return { ...learned, [adapter]: now };
}
function restOfId(deviceId, id) {
  return id.startsWith(`${deviceId}.`) ? id.slice(deviceId.length + 1) : id;
}
function deviceDetailSubNameTokens(rest) {
  var _a, _b;
  const parts = rest.split(".");
  const end = (_a = parts[parts.length - 1]) != null ? _a : "";
  const folders = parts.slice(0, -1).filter(Boolean);
  return [...folders, ...(_b = end.match(new RegExp("\\p{Lu}+(?!\\p{Ll})|\\p{Lu}?\\p{Ll}+|\\p{L}+|\\d+", "gu"))) != null ? _b : []];
}
function groupSubNames(rests) {
  const tokens = rests.map(deviceDetailSubNameTokens);
  const sets = tokens.map((t) => new Set(t));
  const texts = tokens.map((t) => t.filter((token) => !sets.every((s) => s.has(token))).join(" "));
  return texts.map(
    (text, index) => !text || texts.some((other, i) => i !== index && other === text) ? rests[index] : text
  );
}
function deviceDetailSubNames(deviceId, rows) {
  const groups = /* @__PURE__ */ new Map();
  rows.forEach((r, index) => {
    var _a;
    return groups.set(r.name, [...(_a = groups.get(r.name)) != null ? _a : [], index]);
  });
  const autos = rows.map((r) => restOfId(deviceId, r.id));
  for (const members of groups.values()) {
    if (members.length > 1) {
      const texts = groupSubNames(members.map((i) => autos[i]));
      members.forEach((rowIndex, i) => {
        autos[rowIndex] = texts[i];
      });
    }
  }
  return rows.map((r, index) => {
    var _a, _b, _c, _d;
    const duplicate = ((_b = (_a = groups.get(r.name)) == null ? void 0 : _a.length) != null ? _b : 0) > 1;
    const auto = autos[index];
    const own = (_d = (_c = r.subName) == null ? void 0 : _c.trim()) != null ? _d : "";
    return { duplicate, auto, text: own || (duplicate ? auto : "") };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_DEVICE_DETAIL_STATE_DEPTH,
  DEVICE_DETAIL_NAME_PREFIX,
  DEVICE_DETAIL_ROW_ROLE,
  DEVICE_PAGE_CHANNEL_ITEM_FIELDS,
  DEVICE_PAGE_CHANNEL_ROLES,
  DEVICE_PAGE_EXTRA_SLOTS,
  DEVICE_PAGE_FIELDS,
  DEVICE_PAGE_FIELDS_BY_MODEL,
  DEVICE_PAGE_FIELDS_US_P,
  DEVICE_PAGE_FIELDS_WEB_L,
  DEVICE_PAGE_FIELDS_WEB_P,
  DEVICE_PAGE_ICONS_COMMAND,
  DEVICE_PAGE_INFO_ROLE,
  DEVICE_PAGE_LAYOUTS,
  DEVICE_PAGE_NAVIGATION_ICON,
  DEVICE_PAGE_PROGRESS_ROLE,
  DEVICE_PAGE_RECEIVE_BYTES,
  DEVICE_PAGE_SLOT_LOOK_FIELDS,
  DEVICE_PAGE_STAGE_CAPACITY,
  DEVICE_PAGE_STAGE_HIDDEN_SLOTS,
  DEVICE_PAGE_STATUS_COMMAND,
  DEVICE_PAGE_STATUS_INTERVAL_MS,
  DEVICE_PAGE_STATUS_MAX_BYTES,
  DEVICE_PAGE_STATUS_MAX_PARTS,
  DEVICE_PAGE_STATUS_SLOTS,
  DEVICE_PAGE_STATUS_SLOTS_MAX,
  DEVICE_PAGE_TEXT_FONT,
  DEVICE_PAGE_TEXT_MAX_BYTES,
  SENDTO_GET_DEVICE_DETAILS_COMMAND,
  buildDeviceDetailRows,
  defaultDevicePageConfig,
  defaultDevicePageSlots,
  deviceDetailEntriesOfRows,
  deviceDetailEntryByKey,
  deviceDetailEntryOfRow,
  deviceDetailEntryOfState,
  deviceDetailGroupColorKey,
  deviceDetailIdentifier,
  deviceDetailMaskOf,
  deviceDetailMasks,
  deviceDetailNameKey,
  deviceDetailRowKind,
  deviceDetailRuleMatches,
  deviceDetailSubNameTokens,
  deviceDetailSubNames,
  deviceDetailsAdapter,
  deviceDetailsLearnedOf,
  deviceDetailsRuntimeOf,
  devicePageChannelItemFieldsOf,
  devicePageChannelTakesLongPress,
  devicePageChannelTakesNavigation,
  devicePageConfigOf,
  devicePageConfigSlotKinds,
  devicePageExtraSlotCount,
  devicePageExtraSlotKinds,
  devicePageFields,
  devicePageHasStatusIcons,
  devicePageProgressPercent,
  devicePageSlotAccepts,
  devicePageSlotAcceptsChannel,
  devicePageSlotAcceptsNavigation,
  devicePageSlotCount,
  devicePageSlotFields,
  devicePageSlotHasLook,
  devicePageSlotHiddenByStage,
  devicePageSlotLookOf,
  devicePageSlotTakesLongPress,
  devicePageSlotTakesNavigation,
  devicePageSlotTakesTextSize,
  devicePageSlotTargetOf,
  devicePageStageOf,
  devicePageStatusCapacity,
  deviceSelectionError,
  deviceShortPressOf,
  exchangeDeviceDetailRowState,
  fitDevicePageSlots,
  generalDeviceDetailMask,
  hasCommonStatesList,
  hasOwnDeviceDetailMask,
  isDeviceDetailState,
  isDeviceDetailsConfig,
  isDevicePageLayout,
  isDevicePageStatusStage,
  isDeviceShortPressState,
  tickDeviceDetailRow,
  tickedDeviceDetailRowsFirst,
  updatedDeviceDetailsLearned
});
//# sourceMappingURL=deviceDetails.js.map
