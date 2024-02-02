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
var tools_exports = {};
__export(tools_exports, {
  getIconEntryColor: () => getIconEntryColor,
  getIconEntryValue: () => getIconEntryValue,
  getTranslation: () => getTranslation,
  getValueEntryBoolean: () => getValueEntryBoolean,
  getValueEntryNumber: () => getValueEntryNumber,
  getValueEntryString: () => getValueEntryString,
  getValueEntryTextOnOff: () => getValueEntryTextOnOff
});
module.exports = __toCommonJS(tools_exports);
async function getValueEntryNumber(i) {
  var _a;
  if (!i)
    return null;
  const nval = i.value && await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    return nval * ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
  }
  return null;
}
async function getIconEntryValue(i, on, def) {
  var _a, _b;
  if (!i)
    return def;
  const icon = i.true.value && await i.true.value.getString();
  if (!on) {
    return (_b = (_a = i.false.value && await i.false.value.getString()) != null ? _a : icon) != null ? _b : def;
  }
  return icon != null ? icon : def;
}
async function getIconEntryColor(i, on, def) {
  var _a, _b;
  if (!i)
    return def;
  const icon = i.true.color && await i.true.color.getRGBDec();
  if (!on) {
    return (_b = (_a = i.false.color && await i.false.color.getRGBDec()) != null ? _a : icon) != null ? _b : def;
  }
  return icon != null ? icon : def;
}
async function getValueEntryTextOnOff(i, on) {
  var _a, _b;
  if (!i)
    return null;
  const value = i.true && await i.true.getString();
  if (!on) {
    return (_b = (_a = i.false && await i.false.getString()) != null ? _a : value) != null ? _b : null;
  }
  return value != null ? value : null;
}
async function getValueEntryBoolean(i) {
  if (!i)
    return null;
  const nval = i.value && await i.value.getBoolean();
  if (nval !== void 0) {
    return nval;
  }
  return null;
}
async function getValueEntryString(i) {
  var _a, _b, _c;
  if (!i || !i.value)
    return null;
  const nval = await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    const res2 = nval * ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
    const d = i.decimal && await i.decimal.getNumber();
    let result = String(res2);
    if (d || d === 0) {
      result = res2.toFixed(d);
    }
    return result + ((_b = i.unit && await i.unit.getString()) != null ? _b : "");
  }
  const res = await i.value.getString();
  if (res != null)
    res + ((_c = i.unit && await i.unit.getString()) != null ? _c : "");
  return res;
}
function getTranslation(library, key1, key2) {
  let result = key2 != null ? key2 : key1;
  if (key2 !== void 0) {
    result = library.getLocalTranslation(key1, key2);
  }
  result = library.getTranslation(result || key1);
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getIconEntryColor,
  getIconEntryValue,
  getTranslation,
  getValueEntryBoolean,
  getValueEntryNumber,
  getValueEntryString,
  getValueEntryTextOnOff
});
//# sourceMappingURL=tools.js.map
