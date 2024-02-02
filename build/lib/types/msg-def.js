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
var msg_def_exports = {};
__export(msg_def_exports, {
  weatherUpdateTestArray: () => weatherUpdateTestArray
});
module.exports = __toCommonJS(msg_def_exports);
const weatherUpdateTestArray = {
  advanced: [
    { icon: true, iconColor: true, optionalValue: true },
    { icon: true, iconColor: true, optionalValue: true },
    { icon: true, iconColor: true, optionalValue: true },
    { icon: true, iconColor: true, optionalValue: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true },
    { icon: true, iconColor: true },
    { icon: true, iconColor: true },
    { icon: true, iconColor: true },
    { icon: true, iconColor: true }
  ],
  standard: [
    { icon: true, iconColor: true, optionalValue: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true }
  ],
  alternate: [
    { icon: true, iconColor: true, optionalValue: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: true, iconColor: true, optionalValue: true, displayName: true },
    { icon: false, iconColor: false, optionalValue: false, displayName: false },
    { icon: true, iconColor: true, optionalValue: true }
  ]
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  weatherUpdateTestArray
});
//# sourceMappingURL=msg-def.js.map
