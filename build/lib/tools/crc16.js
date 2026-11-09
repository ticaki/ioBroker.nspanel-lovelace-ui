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
var crc16_exports = {};
__export(crc16_exports, {
  crc16Modbus: () => crc16Modbus,
  crcPrefix: () => crcPrefix,
  panelFrameCrc: () => panelFrameCrc
});
module.exports = __toCommonJS(crc16_exports);
const POLY = 40961;
const TABLE = (() => {
  const table = new Uint16Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? crc >>> 1 ^ POLY : crc >>> 1;
    }
    table[i] = crc;
  }
  return table;
})();
const FRAME_HEADER = [85, 187];
function crc16Modbus(data, crc = 65535) {
  for (let i = 0; i < data.length; i++) {
    crc = crc >>> 8 ^ TABLE[(crc ^ data[i]) & 255];
  }
  return crc;
}
function panelFrameCrc(payload) {
  const body = Buffer.from(payload, "utf8");
  const length = body.length & 65535;
  let crc = crc16Modbus([...FRAME_HEADER, length & 255, length >>> 8]);
  crc = crc16Modbus(body, crc);
  return crc;
}
function crcPrefix(crc) {
  return `^${(crc & 65535).toString(16).toUpperCase().padStart(4, "0")}^`;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  crc16Modbus,
  crcPrefix,
  panelFrameCrc
});
//# sourceMappingURL=crc16.js.map
