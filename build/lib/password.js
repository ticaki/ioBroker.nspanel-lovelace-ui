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
var password_exports = {};
__export(password_exports, {
  mqttconfigPrivat: () => mqttconfigPrivat
});
module.exports = __toCommonJS(password_exports);
const mqttconfigPrivat = {
  ip: "mosquitto",
  port: 1883,
  username: "iobroker",
  password: "117!ZomtrQ7",
  name: "B\xFCro",
  topic: "SmartHome/NSPanel_1"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mqttconfigPrivat
});
//# sourceMappingURL=password.js.map
