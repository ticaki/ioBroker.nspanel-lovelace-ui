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
var config_manager_exports = {};
__export(config_manager_exports, {
  ConfigManager: () => ConfigManager
});
module.exports = __toCommonJS(config_manager_exports);
var import_library = require("../classes/library");
class ConfigManager extends import_library.BaseClass {
  //private test: ConfigManager.DeviceState;
  constructor(adapter) {
    super(adapter, "config-manager");
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigManager
});
//# sourceMappingURL=config-manager.js.map
