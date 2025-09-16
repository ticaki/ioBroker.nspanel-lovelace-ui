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
var import_fs = require("fs");
var path = __toESM(require("path"));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const esc = (s) => (s != null ? s : "").replace(/\|/g, "\\|");
async function generateAliasDocumentation() {
  const checkPath = ".dev-data";
  if (!fs.existsSync(checkPath)) {
    return;
  }
  const header = "| Channel role | State ID | common.type | common.role | required | common.write | description |\n| :---: | :--- | :--- | :--- | :---: | :---: | :--- |\n";
  let toc = "# Table of contents\n";
  let body = "";
  toc += `* [Remarks](#${slug("Remarks")})
`;
  const folders = Object.keys(import_config_manager_const.requiredScriptDataPoints).sort();
  for (const folder of folders) {
    const data = import_config_manager_const.requiredScriptDataPoints[folder];
    const sectionAnchor = slug(folder);
    toc += `* [${folder}](#${sectionAnchor})
`;
    body += `
### ${folder}
${header}`;
    const keys = Object.keys(data.data).sort();
    let firstRow = true;
    for (const key of keys) {
      const row = data.data[key];
      if (!row) {
        continue;
      }
      const channelCol = firstRow ? `**${folder}**` : '"';
      firstRow = false;
      body += `| ${channelCol} | ${row.useKey ? esc(key) : `~~${esc(key)}~~`} | ${esc(getStringOrArray(row.type))} | ${esc(
        getStringOrArray(row.role)
      )} | ${row.required ? "X" : ""} | ${row.writeable ? "X" : ""} | ${esc(row.description)} |
`;
    }
  }
  body = `
## Remarks

- (not fully implemented) Crossed out DPs can be named arbitrarily. Use the struck key only for questions in issues or in the forum.

${body}`;
  const out = `${toc}
${body}`;
  await import_fs.promises.writeFile(path.join(process.cwd(), "doc/de/ALIAS.md"), out, "utf8");
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
