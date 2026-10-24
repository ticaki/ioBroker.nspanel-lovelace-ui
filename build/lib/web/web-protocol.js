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
var web_protocol_exports = {};
__export(web_protocol_exports, {
  parseClientFrame: () => parseClientFrame
});
module.exports = __toCommonJS(web_protocol_exports);
function parseClientFrame(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return void 0;
  }
  if (!data || typeof data !== "object" || !("t" in data)) {
    return void 0;
  }
  const frame = data;
  if (frame.t === "ack") {
    return { t: "ack" };
  }
  if (frame.t === "recv" && typeof frame.p === "string" && frame.p) {
    return { t: "recv", p: frame.p };
  }
  return void 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseClientFrame
});
//# sourceMappingURL=web-protocol.js.map
