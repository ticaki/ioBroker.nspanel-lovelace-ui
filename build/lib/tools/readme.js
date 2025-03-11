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
  generateAliasDocumentation: () => generateAliasDocumentation,
  getStringOrArray: () => getStringOrArray
});
module.exports = __toCommonJS(readme_exports);
var fs = __toESM(require("fs"));
var import_config_manager_const = require("../const/config-manager-const");
async function generateAliasDocumentation() {
  const checkPath = ".dev-data";
  let header = `| Channel role | State ID | common.type | common.role | required | common.write | description |  
`;
  header += `| :---: | :--- | :--- | :--- | :---: | :---: | :--- |  
`;
  if (fs.existsSync(checkPath)) {
    let lastFolder = "";
    let table = "# Table of contents\n";
    let readme = "";
    table += `* [Remarks](#feature-${"Remarks".toLowerCase().replace(/[^a-z0-9]+/g, "")})
`;
    for (const f in import_config_manager_const.requiredScriptDataPoints) {
      const folder = f;
      const data = import_config_manager_const.requiredScriptDataPoints[folder];
      readme += `### ${folder}
`;
      readme += header;
      table += `* [${folder}](#${folder.toLowerCase().replace(/[^a-z0-9]+/g, "")})
`;
      for (const k in data.data) {
        const key = k;
        const row = data.data[key];
        if (row === void 0) {
          continue;
        }
        readme += `| **${folder == lastFolder ? '"' : folder}** | ${row.useKey ? key : `~~${key}~~`} | ${row.type}| ${getStringOrArray(row.role)}  | ${row.required ? "X" : ""} | ${row.writeable ? "X" : ""} | ${row.description ? row.description : ""} | 
`;
        lastFolder = folder;
      }
    }
    table += `## Remarks
`;
    table += "\n -(not fully implemented) Crossed out DPs can be called whatever you want, only use the name if you have questions in issues or in the forum. \n";
    fs.writeFileSync("ALIAS.md", table + readme);
  }
}
function getStringOrArray(item) {
  if (Array.isArray(item)) {
    return item.join(", ") || "";
  }
  return item;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateAliasDocumentation,
  getStringOrArray
});
//# sourceMappingURL=readme.js.map
