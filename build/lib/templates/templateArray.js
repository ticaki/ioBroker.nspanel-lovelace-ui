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
var templateArray_exports = {};
__export(templateArray_exports, {
  pageItemTemplates: () => pageItemTemplates
});
module.exports = __toCommonJS(templateArray_exports);
var import_button = require("./button");
var import_light = require("./light");
var import_shutter = require("./shutter");
var import_text = require("./text");
const pageItemTemplates = Object.assign(import_text.textTemplates, import_shutter.shutterTemplates, import_light.lightTemplates, import_button.buttonTemplates);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  pageItemTemplates
});
//# sourceMappingURL=templateArray.js.map
