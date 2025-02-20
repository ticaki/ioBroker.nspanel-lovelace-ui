"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var readme_exports = {};
__export(readme_exports, {
  generateAliasDocumentation: () => generateAliasDocumentation
});
module.exports = __toCommonJS(readme_exports);
var fs = __toESM(require("fs"));
var import_config_manager_const = require("../const/config-manager-const");
async function generateAliasDocumentation() {
  const checkPath = ".dev-data";
  let readme = `| Channel role | State ID | common.type | common.role | required | common.write | description |  
`;
  readme += `| --- | :--- | :--- | :--- | --- | --- | :--- |  
`;
  let test = fs.readdirSync("./");
  if (test) {
    test = [""];
  }
  if (fs.existsSync(checkPath)) {
    let lastFolder = "";
    for (const folder in import_config_manager_const.requiredOutdatedDataPoints) {
      const data = import_config_manager_const.requiredOutdatedDataPoints[folder];
      for (const key in data) {
        const row = data[key];
        readme += `| ${folder == lastFolder ? '"' : folder} | ${key} | ${row.type}| ${row.role}  | ${row.required ? "X" : ""} | ${row.writeable ? "X" : ""} | ${row.description ? row.description : ""} | 
`;
        lastFolder = folder;
      }
    }
    fs.writeFileSync("ALIAS.md", readme);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateAliasDocumentation
});
//# sourceMappingURL=readme.js.map
