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
  formatInSelText: () => formatInSelText,
  getDecfromHue: () => getDecfromHue,
  getDecfromRGBThree: () => getDecfromRGBThree,
  getEntryColor: () => getEntryColor,
  getIconEntryColor: () => getIconEntryColor,
  getIconEntryValue: () => getIconEntryValue,
  getTranslation: () => getTranslation,
  getValueEntryBoolean: () => getValueEntryBoolean,
  getValueEntryNumber: () => getValueEntryNumber,
  getValueEntryString: () => getValueEntryString,
  getValueEntryTextOnOff: () => getValueEntryTextOnOff
});
module.exports = __toCommonJS(tools_exports);
var import_Color2 = require("./Color");
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
async function getIconEntryValue(i, on, def, defOff = null) {
  var _a, _b, _c;
  on = on != null ? on : true;
  if (!i)
    return on ? def : defOff != null ? defOff : def;
  const icon = i.true.value && await i.true.value.getString();
  if (!on) {
    return (_c = (_b = (_a = i.false.value && await i.false.value.getString()) != null ? _a : defOff) != null ? _b : icon) != null ? _c : def;
  }
  return icon != null ? icon : def;
}
async function getIconEntryColor(i, on, def, defOff = null) {
  var _a, _b, _c;
  on = on != null ? on : true;
  if (typeof def === "number")
    def = String(def);
  else if (typeof def !== "string")
    def = String((0, import_Color2.rgb_dec565)(def));
  if (typeof defOff === "number")
    defOff = String(def);
  else if (defOff === null)
    defOff = null;
  else if (typeof defOff !== "string")
    defOff = String((0, import_Color2.rgb_dec565)(defOff));
  if (!i)
    return def;
  const icon = i.true.color && await i.true.color.getRGBDec();
  if (!on) {
    return (_c = (_b = (_a = i.false.color && await i.false.color.getRGBDec()) != null ? _a : defOff) != null ? _b : icon) != null ? _c : def;
  }
  return icon != null ? icon : def;
}
async function getEntryColor(i, value, def) {
  var _a, _b;
  if (typeof def === "number")
    def = String(def);
  else if (typeof def !== "string")
    def = String((0, import_Color2.rgb_dec565)(def));
  if (!i)
    return def;
  const icon = i.true && await i.true.getRGBDec();
  if (!value) {
    return (_b = (_a = i.false && await i.false.getRGBDec()) != null ? _a : icon) != null ? _b : def;
  }
  return icon != null ? icon : def;
}
async function getValueEntryTextOnOff(i, on) {
  var _a, _b;
  if (!i)
    return null;
  const value = i.true && await i.true.getString();
  if (!(on != null ? on : true)) {
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
const getDecfromRGBThree = async (item) => {
  var _a, _b, _c;
  if (!item)
    return String((0, import_Color2.rgb_dec565)(import_Color2.White));
  const red = (_a = item.data.Red && await item.data.Red.getNumber()) != null ? _a : -1;
  const green = (_b = item.data.Green && await item.data.Green.getNumber()) != null ? _b : -1;
  const blue = (_c = item.data.Blue && await item.data.Blue.getNumber()) != null ? _c : -1;
  if (red === -1 || blue === -1 || green === -1)
    return null;
  return String((0, import_Color2.rgb_dec565)({ red, green, blue }));
};
const getDecfromHue = async (item) => {
  var _a;
  if (!item || !item.data.hue)
    return null;
  const hue = await item.data.hue.getNumber();
  let saturation = Math.abs((_a = item.data.saturation && await item.data.saturation.getNumber()) != null ? _a : 1);
  if (saturation > 1)
    saturation = 1;
  if (hue === null)
    return null;
  const arr = (0, import_Color2.hsv2rgb)(hue, saturation, 1);
  return String((0, import_Color2.rgb_dec565)({ red: arr[0], green: arr[1], blue: arr[2] }));
};
function formatInSelText(Text) {
  let splitText = Text;
  if (!Array.isArray(splitText))
    splitText = splitText.split(" ");
  let lengthLineOne = 0;
  const arrayLineOne = [];
  for (let i = 0; i < splitText.length; i++) {
    lengthLineOne += splitText[i].length + 1;
    if (lengthLineOne > 12) {
      break;
    } else {
      arrayLineOne[i] = splitText[i];
    }
  }
  const textLineOne = arrayLineOne.join(" ");
  const arrayLineTwo = [];
  for (let i = arrayLineOne.length; i < splitText.length; i++) {
    arrayLineTwo[i] = splitText[i];
  }
  let textLineTwo = arrayLineTwo.join(" ");
  if (textLineTwo.length > 12) {
    textLineTwo = textLineTwo.substring(0, 9) + "...";
  }
  if (textLineOne.length != 0) {
    return textLineOne + "\r\n" + textLineTwo.trim();
  } else {
    return textLineTwo.trim();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatInSelText,
  getDecfromHue,
  getDecfromRGBThree,
  getEntryColor,
  getIconEntryColor,
  getIconEntryValue,
  getTranslation,
  getValueEntryBoolean,
  getValueEntryNumber,
  getValueEntryString,
  getValueEntryTextOnOff
});
//# sourceMappingURL=tools.js.map
