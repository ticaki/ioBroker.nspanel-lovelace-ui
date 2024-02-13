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
  GetIconColor: () => GetIconColor,
  formatInSelText: () => formatInSelText,
  getDecfromHue: () => getDecfromHue,
  getDecfromRGBThree: () => getDecfromRGBThree,
  getEntryColor: () => getEntryColor,
  getEntryTextOnOff: () => getEntryTextOnOff,
  getIconEntryColor: () => getIconEntryColor,
  getIconEntryValue: () => getIconEntryValue,
  getItemMesssage: () => getItemMesssage,
  getPayload: () => getPayload,
  getPayloadArray: () => getPayloadArray,
  getRGBfromRGBThree: () => getRGBfromRGBThree,
  getScaledNumber: () => getScaledNumber,
  getTranslation: () => getTranslation,
  getValueEntryBoolean: () => getValueEntryBoolean,
  getValueEntryNumber: () => getValueEntryNumber,
  getValueEntryString: () => getValueEntryString,
  messageItemDefault: () => messageItemDefault,
  setHuefromRGB: () => setHuefromRGB,
  setRGBThreefromRGB: () => setRGBThreefromRGB,
  setScaledNumber: () => setScaledNumber
});
module.exports = __toCommonJS(tools_exports);
var import_Color2 = require("./Color");
var import_icon_mapping = require("./icon_mapping");
const messageItemDefault = {
  type: "input_sel",
  intNameEntity: "",
  icon: "",
  iconColor: "",
  displayName: "",
  optionalValue: ""
};
async function getValueEntryNumber(i) {
  var _a;
  if (!i)
    return null;
  const nval = i.value && await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    let res = nval * ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        res = (0, import_Color2.scale)(res, min, max, 0, 100);
      }
    }
    return res;
  }
  return null;
}
async function getScaledNumber(i) {
  if (!i)
    return null;
  let nval = i.value && await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        nval = Math.round((0, import_Color2.scale)(nval, min, max, 0, 100));
      }
    }
    return nval;
  }
  return null;
}
async function setScaledNumber(i, value) {
  var _a;
  if (!i || !i.value)
    return;
  const nval = (_a = await i.value.getNumber()) != null ? _a : null;
  if (nval !== null) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        value = (0, import_Color2.scale)(value, 0, 100, min, max);
        if (nval > value)
          value = Math.floor(value);
        else
          value = Math.ceil(value);
      }
    }
    if (nval !== value)
      await i.value.setStateAsync(value);
  }
}
async function getIconEntryValue(i, on, def, defOff = null) {
  var _a, _b, _c;
  if (i === void 0)
    return "";
  on = on != null ? on : true;
  if (!i)
    return import_icon_mapping.Icons.GetIcon(on ? def : defOff != null ? defOff : def);
  const icon = i.true.value && await i.true.value.getString();
  if (!on) {
    return import_icon_mapping.Icons.GetIcon((_c = (_b = (_a = i.false.value && await i.false.value.getString()) != null ? _a : defOff) != null ? _b : icon) != null ? _c : def);
  }
  return import_icon_mapping.Icons.GetIcon(icon != null ? icon : def);
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
async function GetIconColor(item, value, min = null, max = null, offColor = null) {
  var _a, _b;
  if (item === void 0)
    return "";
  if ((0, import_Color2.isRGB)(item)) {
    const onColor = item;
    if (typeof value === "number") {
      let val = typeof value === "number" ? value : 0;
      const maxValue = max != null ? max : 100;
      const minValue = min != null ? min : 0;
      val = val > maxValue ? maxValue : val;
      val = val < minValue ? minValue : val;
      return String(
        (0, import_Color2.rgb_dec565)(
          (0, import_Color2.Interpolate)(
            offColor != null ? offColor : { red: 100, green: 100, blue: 100 },
            onColor ? onColor : import_Color2.HMIOn,
            (0, import_Color2.scale)(100 - val, minValue, maxValue, 0, 1)
          )
        )
      );
    }
    if (value) {
      return String((0, import_Color2.rgb_dec565)(onColor ? onColor : import_Color2.HMIOn));
    }
    return String((0, import_Color2.rgb_dec565)(offColor ? offColor : import_Color2.HMIOff));
  } else {
    const onColor = item.true.color && await item.true.color.getRGBValue();
    const offColor2 = item.false.color && await item.false.color.getRGBValue();
    if (typeof value === "number") {
      let val = typeof value === "number" ? value : 0;
      const maxValue = (_a = item.maxBri && await item.maxBri.getNumber() || max) != null ? _a : 100;
      const minValue = (_b = item.minBri && await item.minBri.getNumber() || min) != null ? _b : 0;
      val = val > maxValue ? maxValue : val;
      val = val < minValue ? minValue : val;
      return String(
        (0, import_Color2.rgb_dec565)(
          (0, import_Color2.Interpolate)(
            offColor2 ? offColor2 : { red: 100, green: 100, blue: 100 },
            onColor ? onColor : import_Color2.HMIOn,
            (0, import_Color2.scale)(100 - val, minValue, maxValue, 0, 1)
          )
        )
      );
    }
    if (value) {
      return String((0, import_Color2.rgb_dec565)(onColor ? onColor : import_Color2.HMIOn));
    }
    return String((0, import_Color2.rgb_dec565)(offColor2 ? offColor2 : import_Color2.HMIOff));
  }
}
async function getEntryColor(i, value, def) {
  var _a, _b;
  if (i === void 0)
    return "";
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
async function getEntryTextOnOff(i, on) {
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
  const nval = await getValueEntryNumber(i);
  if (nval !== null && nval !== void 0) {
    const d = (_a = i.decimal && await i.decimal.getNumber()) != null ? _a : null;
    let result = String(nval);
    if (d !== null) {
      result = nval.toFixed(d);
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
const getRGBfromRGBThree = async (item) => {
  var _a, _b, _c;
  if (!item)
    return import_Color2.White;
  const red = (_a = item.Red && await item.Red.getNumber()) != null ? _a : -1;
  const green = (_b = item.Green && await item.Green.getNumber()) != null ? _b : -1;
  const blue = (_c = item.Blue && await item.Blue.getNumber()) != null ? _c : -1;
  if (red === -1 || blue === -1 || green === -1)
    return null;
  return { red, green, blue };
};
const getDecfromRGBThree = async (item) => {
  const rgb = await getRGBfromRGBThree(item);
  if (!rgb)
    return null;
  return String((0, import_Color2.rgb_dec565)(rgb));
};
const setRGBThreefromRGB = async (item, c) => {
  if (!item || !item.Red || !item.Green || !item.Blue)
    return;
  await item.Red.setStateAsync(c.red);
  await item.Green.setStateAsync(c.green);
  await item.Blue.setStateAsync(c.blue);
};
const getDecfromHue = async (item) => {
  var _a;
  if (!item || !item.hue)
    return null;
  const hue = await item.hue.getNumber();
  let saturation = Math.abs((_a = item.saturation && await item.saturation.getNumber()) != null ? _a : 1);
  if (saturation > 1)
    saturation = 1;
  if (hue === null)
    return null;
  const arr = (0, import_Color2.hsv2rgb)(hue, saturation, 1);
  return String((0, import_Color2.rgb_dec565)({ red: arr[0], green: arr[1], blue: arr[2] }));
};
const setHuefromRGB = async (item, c) => {
  if (!item || !item.hue || !(0, import_Color2.isRGB)(c))
    return;
  if (!item.hue.writeable) {
    return;
  }
  const hue = (0, import_Color2.getHue)(c.red, c.green, c.blue);
  await item.hue.setStateAsync(hue);
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
function getItemMesssage(msg) {
  var _a, _b, _c, _d, _e, _f;
  if (!msg || !msg.intNameEntity || !msg.type)
    return "~~~~~";
  const id = [];
  if (msg.mainId)
    id.push(msg.mainId);
  if (msg.subId)
    id.push(msg.subId);
  if (msg.intNameEntity)
    id.push(msg.intNameEntity);
  return getPayload(
    (_a = msg.type) != null ? _a : messageItemDefault.type,
    (_b = id.join("?")) != null ? _b : messageItemDefault.intNameEntity,
    (_c = msg.icon) != null ? _c : messageItemDefault.icon,
    (_d = msg.iconColor) != null ? _d : messageItemDefault.iconColor,
    (_e = msg.displayName) != null ? _e : messageItemDefault.displayName,
    (_f = msg.optionalValue) != null ? _f : messageItemDefault.optionalValue
  );
}
function getPayloadArray(s) {
  return s.join("~");
}
function getPayload(...s) {
  return s.join("~");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GetIconColor,
  formatInSelText,
  getDecfromHue,
  getDecfromRGBThree,
  getEntryColor,
  getEntryTextOnOff,
  getIconEntryColor,
  getIconEntryValue,
  getItemMesssage,
  getPayload,
  getPayloadArray,
  getRGBfromRGBThree,
  getScaledNumber,
  getTranslation,
  getValueEntryBoolean,
  getValueEntryNumber,
  getValueEntryString,
  messageItemDefault,
  setHuefromRGB,
  setRGBThreefromRGB,
  setScaledNumber
});
//# sourceMappingURL=tools.js.map
