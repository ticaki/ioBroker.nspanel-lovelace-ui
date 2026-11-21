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
var admin_device_details_exports = {};
__export(admin_device_details_exports, {
  deviceDetailsInfo: () => deviceDetailsInfo,
  deviceStateInfoOf: () => deviceStateInfoOf
});
module.exports = __toCommonJS(admin_device_details_exports);
var import_tools = require("../const/tools");
var import_deviceDetails = require("../types/deviceDetails");
function deviceStateInfoOf(adapter, obj) {
  var _a, _b, _c;
  const common = obj.common;
  const name = (_a = obj._id.split(".").pop()) != null ? _a : obj._id;
  const info = {
    id: obj._id,
    name: common.name ? (0, import_tools.getStringFromStringOrTranslated)(adapter, common.name, name) : name,
    role: (_b = common.role) != null ? _b : "",
    type: (_c = common.type) != null ? _c : "",
    read: common.read !== false,
    write: common.write !== false
  };
  if (common.unit) {
    info.unit = common.unit;
  }
  if (typeof common.min === "number") {
    info.min = common.min;
  }
  if (typeof common.max === "number") {
    info.max = common.max;
  }
  if (typeof common.step === "number") {
    info.step = common.step;
  }
  return info;
}
async function deviceDetailsInfo(adapter, rawId) {
  var _a;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  const result = { ok: false, adapter: (0, import_deviceDetails.deviceDetailsAdapter)(id), name: "", states: [] };
  if (!id) {
    result.error = "notFound";
    return result;
  }
  const obj = await adapter.getForeignObjectAsync(id);
  const error = (0, import_deviceDetails.deviceSelectionError)(id, obj == null ? void 0 : obj.type);
  if (error || !obj) {
    result.error = error != null ? error : "notFound";
    return result;
  }
  result.name = (0, import_tools.getStringFromStringOrTranslated)(adapter, obj.common.name, id.split(".").pop());
  const view = await adapter.getObjectViewAsync("system", "state", { startkey: `${id}.`, endkey: `${id}.\u9999` });
  for (const row of (_a = view == null ? void 0 : view.rows) != null ? _a : []) {
    if ((row == null ? void 0 : row.value) && row.value.type === "state" && (0, import_deviceDetails.isDeviceDetailState)(id, row.id)) {
      result.states.push(deviceStateInfoOf(adapter, row.value));
    }
  }
  result.states.sort((a, b) => a.id.localeCompare(b.id));
  result.ok = true;
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  deviceDetailsInfo,
  deviceStateInfoOf
});
//# sourceMappingURL=admin-device-details.js.map
