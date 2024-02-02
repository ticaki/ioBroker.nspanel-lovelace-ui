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
  mqttPassword: "5*qzx>-y73|?%]=|pKh2b>kB,W*Ar*6>nF5|EM[V<BJz8qR5./saDQRuThK|H<_",
  mqttUsername: "mqttuser",
  mqttIp: "mqtt.kiemen.com",
  mqttPort: 1883,
  topic: "nspanel/ns_panel2",
  name: "Wohnzimmer"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mqttconfigPrivat
});
//# sourceMappingURL=password.js.map
