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
  deepAssign: () => deepAssign,
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
  getSliderCTFromValue: () => getSliderCTFromValue,
  getTemperaturColorFromValue: () => getTemperaturColorFromValue,
  getTranslation: () => getTranslation,
  getValueEntryBoolean: () => getValueEntryBoolean,
  getValueEntryNumber: () => getValueEntryNumber,
  getValueEntryString: () => getValueEntryString,
  ifValueEntryIs: () => ifValueEntryIs,
  messageItemDefault: () => messageItemDefault,
  setHuefromRGB: () => setHuefromRGB,
  setRGBThreefromRGB: () => setRGBThreefromRGB,
  setScaledNumber: () => setScaledNumber,
  setSliderCTFromValue: () => setSliderCTFromValue,
  setValueEntryNumber: () => setValueEntryNumber
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
function ifValueEntryIs(i, type) {
  if (i && i.value && i.value.type)
    return i.value.type === type;
  return false;
}
async function setValueEntryNumber(i, value, s = true) {
  var _a;
  if (!i || !i.value)
    return;
  let res = value / ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
  if (s && i.minScale !== void 0 && i.maxScale !== void 0) {
    const min = await i.minScale.getNumber();
    const max = await i.maxScale.getNumber();
    if (min !== null && max !== null) {
      res = Math.round((0, import_Color2.scale)(res, 100, 0, min, max));
    }
  }
  if (i.set && i.set.writeable)
    await i.set.setStateAsync(res);
  else
    await i.value.setStateAsync(res);
}
async function getValueEntryNumber(i, s = true) {
  var _a;
  if (!i)
    return null;
  const nval = i.value && await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    let res = nval * ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
    if (s && i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        res = (0, import_Color2.scale)(res, max, min, 0, 100);
      }
    }
    return res;
  }
  return null;
}
function getScaledNumberRaw(n, min, max, oldValue = null) {
  if (min !== null && max !== null) {
    if (oldValue === null) {
      n = Math.round((0, import_Color2.scale)(n, max, min, 0, 100));
    } else {
      n = (0, import_Color2.scale)(n, 100, 0, min, max);
      if (oldValue !== false) {
        if (oldValue >= n)
          n = Math.floor(n);
        else
          n = Math.ceil(n);
      } else {
        n = Math.round(n);
      }
    }
  }
  return n;
}
async function getScaledNumber(i) {
  if (!i)
    return null;
  let nval = i.value && await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      nval = getScaledNumberRaw(nval, min, max);
    }
    return nval;
  }
  return null;
}
async function getTemperaturColorFromValue(i, dimmer = 100) {
  if (!i)
    return null;
  let nval = i.value && await i.value.getNumber();
  const mode = i.mode && await i.mode.getString();
  let kelvin = 3500;
  if (nval !== null && nval !== void 0) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      nval = getScaledNumberRaw(nval, min, max);
    }
    if (mode === "mired") {
      kelvin = 10 ** 6 / nval;
    } else {
      kelvin = nval;
    }
    kelvin = kelvin > 7e3 ? 7e3 : kelvin < 1800 ? 1800 : kelvin;
    let r = import_Color2.kelvinToRGB[Math.trunc(kelvin / 100) * 100];
    r = (0, import_Color2.darken)(r, (0, import_Color2.scale)(dimmer, 100, 0, 0, 1));
    return r ? String((0, import_Color2.rgb_dec565)(r)) : null;
  }
  return null;
}
async function getSliderCTFromValue(i) {
  if (!i)
    return null;
  let nval = i.value && await i.value.getNumber();
  const mode = i.mode && await i.mode.getString();
  let r = 3500;
  if (nval !== null && nval !== void 0) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null)
        nval = Math.round((0, import_Color2.scale)(nval, max, min, 1800, 7e3));
    }
    if (mode === "mired") {
      r = 10 ** 6 / nval;
    } else {
      r = nval;
    }
    r = r > 7e3 ? 7e3 : r < 1800 ? 1800 : r;
    r = getScaledNumberRaw(r, 1800, 7e3);
    return r !== null ? String(r) : null;
  }
  return null;
}
async function setSliderCTFromValue(i, value) {
  var _a;
  if (!i || !i.value)
    return;
  const nval = (_a = i.value && await i.value.getNumber()) != null ? _a : null;
  const mode = i.mode && await i.mode.getString();
  if (nval !== null) {
    let r = getScaledNumberRaw(value, 1800, 7e3, false);
    r = r > 7e3 ? 7e3 : r < 1800 ? 1800 : r;
    if (mode === "mired") {
      r = 10 ** 6 / r;
    }
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null)
        r = Math.round((0, import_Color2.scale)(nval, 7e3, 1800, min, max));
    }
    if (i.set && i.set.writeable)
      await i.value.setStateAsync(r);
    else if (nval !== value)
      await i.value.setStateAsync(r);
  }
}
async function setScaledNumber(i, value) {
  var _a;
  if (!i || !i.value)
    return;
  const nval = (_a = await i.value.getNumber()) != null ? _a : null;
  if (nval !== null) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      value = getScaledNumberRaw(value, await i.minScale.getNumber(), await i.maxScale.getNumber(), value);
    }
    if (i.set && i.set.writeable)
      await i.value.setStateAsync(value);
    else if (nval !== value)
      await i.value.setStateAsync(value);
  }
}
async function getIconEntryValue(i, on, def, defOff = null) {
  var _a, _b, _c, _d, _e, _f;
  if (i === void 0)
    return "";
  on = on != null ? on : true;
  if (!i)
    return import_icon_mapping.Icons.GetIcon(on ? def : defOff != null ? defOff : def);
  const text = (_a = i.true && i.true.text && await i.true.text.getString()) != null ? _a : null;
  if (text !== null) {
    if (!on)
      return (_b = i.false && i.false.text && await i.false.text.getString()) != null ? _b : text;
    return text;
  }
  const icon = (_c = i.true && i.true.value && await i.true.value.getString()) != null ? _c : null;
  if (!on) {
    return import_icon_mapping.Icons.GetIcon((_f = (_e = (_d = i.false && i.false.value && await i.false.value.getString()) != null ? _d : defOff) != null ? _e : icon) != null ? _f : def);
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
  const icon = i.true && i.true.color && await i.true.color.getRGBDec();
  if (!on) {
    return (_c = (_b = (_a = i.false && i.false.color && await i.false.color.getRGBDec()) != null ? _a : defOff) != null ? _b : icon) != null ? _c : def;
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
          !offColor ? (0, import_Color2.darken)(onColor ? onColor : import_Color2.HMIOn, (0, import_Color2.scale)(val, maxValue, minValue, 0, 1)) : (0, import_Color2.Interpolate)(offColor, onColor ? onColor : import_Color2.HMIOn, (0, import_Color2.scale)(val, maxValue, minValue, 0, 1))
        )
      );
    }
    if (value) {
      return String((0, import_Color2.rgb_dec565)(onColor ? onColor : import_Color2.HMIOn));
    }
    return String((0, import_Color2.rgb_dec565)(offColor ? offColor : import_Color2.HMIOff));
  } else {
    const onColor = item.true && item.true.color && await item.true.color.getRGBValue();
    const offColor2 = item.false && item.false.color && await item.false.color.getRGBValue();
    if (typeof value === "number") {
      let val = typeof value === "number" ? value : 0;
      const maxValue = (_a = item.maxBri && await item.maxBri.getNumber() || max) != null ? _a : 100;
      const minValue = (_b = item.minBri && await item.minBri.getNumber() || min) != null ? _b : 0;
      val = val > maxValue ? maxValue : val;
      val = val < minValue ? minValue : val;
      return String(
        (0, import_Color2.rgb_dec565)(
          !offColor2 ? (0, import_Color2.darken)(onColor ? onColor : import_Color2.HMIOn, (0, import_Color2.scale)(val, maxValue, minValue, 0, 1)) : (0, import_Color2.Interpolate)(offColor2, onColor ? onColor : import_Color2.HMIOn, (0, import_Color2.scale)(val, maxValue, minValue, 0, 1))
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
  const color = i.true && await i.true.getRGBDec();
  if (!value) {
    return (_b = (_a = i.false && await i.false.getRGBDec()) != null ? _a : color) != null ? _b : def;
  }
  return color != null ? color : def;
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
async function getValueEntryString(i, v = null) {
  var _a, _b, _c;
  if (!i || !i.value)
    return null;
  const nval = v !== null ? v : await getValueEntryNumber(i);
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
  return { r: red, g: green, b: blue };
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
  await item.Red.setStateAsync(c.r);
  await item.Green.setStateAsync(c.g);
  await item.Blue.setStateAsync(c.b);
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
  return String((0, import_Color2.rgb_dec565)({ r: arr[0], g: arr[1], b: arr[2] }));
};
const setHuefromRGB = async (item, c) => {
  if (!item || !item.hue || !(0, import_Color2.isRGB)(c))
    return;
  if (!item.hue.writeable) {
    return;
  }
  const hue = (0, import_Color2.getHue)(c.r, c.g, c.b);
  await item.hue.setStateAsync(hue);
};
function formatInSelText(Text) {
  if (Text === void 0 || Text === null)
    return `error`;
  let splitText = Text;
  if (typeof splitText === "string")
    splitText = splitText.replaceAll("__", "_").replaceAll("_", " ").split(" ");
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
function deepAssign(def, source, level = 0) {
  if (level++ > 20) {
    throw new Error("Max level reached! Circulating object is suspected!");
  }
  for (const k in def) {
    if (typeof def[k] === "object") {
      if (source[k] !== void 0) {
        def[k] = deepAssign(def[k], source[k]);
      } else if (def[k] !== void 0) {
        source[k] = Object.assign(def[k]);
      }
    }
  }
  for (const k in source) {
    if (typeof source[k] === "object" && source[k] !== void 0) {
      if (!def) {
        if (Array.isArray(source))
          def = [];
        else if (typeof source === "object")
          def = {};
      }
      def[k] = deepAssign(def[k], source[k]);
    }
  }
  if (!def) {
    if (Array.isArray(source))
      def = [];
    else if (typeof source === "object")
      def = {};
  }
  return Object.assign(def, source);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GetIconColor,
  deepAssign,
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
  getSliderCTFromValue,
  getTemperaturColorFromValue,
  getTranslation,
  getValueEntryBoolean,
  getValueEntryNumber,
  getValueEntryString,
  ifValueEntryIs,
  messageItemDefault,
  setHuefromRGB,
  setRGBThreefromRGB,
  setScaledNumber,
  setSliderCTFromValue,
  setValueEntryNumber
});
//# sourceMappingURL=tools.js.map
