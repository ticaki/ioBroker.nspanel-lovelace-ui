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
  alignText: () => alignText,
  deepAssign: () => deepAssign,
  formatInSelText: () => formatInSelText,
  getDecfromHue: () => getDecfromHue,
  getDecfromRGBThree: () => getDecfromRGBThree,
  getEntryColor: () => getEntryColor,
  getEntryTextOnOff: () => getEntryTextOnOff,
  getIconEntryColor: () => getIconEntryColor,
  getIconEntryValue: () => getIconEntryValue,
  getInternalDefaults: () => getInternalDefaults,
  getItemMesssage: () => getItemMesssage,
  getPayload: () => getPayload,
  getPayloadArray: () => getPayloadArray,
  getRGBfromRGBThree: () => getRGBfromRGBThree,
  getRegExp: () => getRegExp,
  getScaledNumber: () => getScaledNumber,
  getSliderCTFromValue: () => getSliderCTFromValue,
  getTemperaturColorFromValue: () => getTemperaturColorFromValue,
  getTranslation: () => getTranslation,
  getValueAutoUnit: () => getValueAutoUnit,
  getValueEntryBoolean: () => getValueEntryBoolean,
  getValueEntryNumber: () => getValueEntryNumber,
  getValueEntryString: () => getValueEntryString,
  getVersionAsNumber: () => getVersionAsNumber,
  ifValueEntryIs: () => ifValueEntryIs,
  insertLinebreak: () => insertLinebreak,
  isValidDate: () => isValidDate,
  isVersionGreaterOrEqual: () => isVersionGreaterOrEqual,
  messageItemDefault: () => messageItemDefault,
  setHuefromRGB: () => setHuefromRGB,
  setRGBThreefromRGB: () => setRGBThreefromRGB,
  setScaledNumber: () => setScaledNumber,
  setSliderCTFromValue: () => setSliderCTFromValue,
  setTriggeredToState: () => setTriggeredToState,
  setValueEntry: () => setValueEntry
});
module.exports = __toCommonJS(tools_exports);
var import_data_item = require("../classes/data-item");
var import_Color = require("../const/Color");
var import_icon_mapping = require("./icon_mapping");
var import_types = require("../types/types");
const messageItemDefault = {
  type: "input_sel",
  intNameEntity: "",
  icon: "",
  iconColor: "",
  displayName: "",
  optionalValue: ""
};
function ifValueEntryIs(i, type) {
  if (i && i.value && i.value.type) {
    return i.value.type === type;
  }
  return false;
}
async function setValueEntry(i, value, sca = true) {
  var _a;
  if (!i || !i.value) {
    return;
  }
  let res = value;
  if (typeof value === "number") {
    res = value / ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
    if (sca && i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        res = Math.round(import_Color.Color.scale(res, 0, 100, min, max));
      }
    }
  }
  if (i.set && i.set.writeable) {
    await i.set.setStateAsync(res);
  } else if (i.value.writeable) {
    await i.value.setStateAsync(res);
  } else if (i.set || i.value) {
    const t = i.set || i.value;
    t.log.warn(t.name || "??? is not writeable");
  }
}
async function getValueEntryNumber(i, s = true, options) {
  var _a, _b;
  if (!i) {
    return null;
  }
  const nval = i.value && await i.value.getNumber();
  if (nval !== null && nval !== void 0) {
    let res = nval * ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
    if (s && i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        res = import_Color.Color.scale(res, min, max, 0, 100);
      }
    }
    const d = (_b = "decimal" in i && i.decimal && await i.decimal.getNumber()) != null ? _b : null;
    if (!(options == null ? void 0 : options.ignoreDecimal) && d !== null && d !== false) {
      res = Math.round(res * 10 ** d) / 10 ** d;
    }
    if ("negate" in i && i.negate) {
      const reverse = await i.negate.getBoolean();
      if (reverse != null && reverse) {
        res = -res;
      }
    }
    return res;
  }
  return null;
}
function getScaledNumberRaw(n, min, max, oldValue = null) {
  if (min !== null && max !== null) {
    if (oldValue === null) {
      n = Math.round(import_Color.Color.scale(n, min, max, 0, 100));
    } else {
      n = import_Color.Color.scale(n, 0, 100, min, max);
      if (oldValue !== false) {
        if (oldValue >= n) {
          n = Math.floor(n);
        } else {
          n = Math.ceil(n);
        }
      } else {
        n = Math.round(n);
      }
    }
  }
  return n;
}
async function getScaledNumber(i) {
  var _a;
  if (!i) {
    return null;
  }
  let nval = i.value && await i.value.getNumber();
  if (nval != null) {
    nval = nval * ((_a = i.factor && await i.factor.getNumber()) != null ? _a : 1);
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      nval = getScaledNumberRaw(nval, min, max);
    }
    if ("negate" in i && i.negate) {
      const reverse = await i.negate.getBoolean();
      if (reverse != null && reverse) {
        nval = -nval;
      }
    }
    return nval;
  }
  return null;
}
async function getTemperaturColorFromValue(i, dimmer = 100) {
  if (!i) {
    return null;
  }
  const nval = i.value && await i.value.getNumber();
  const mode = i.mode && await i.mode.getString();
  let kelvin = 3500;
  if (nval !== null && nval !== void 0) {
    if (mode === "mired") {
      kelvin = 10 ** 6 / nval;
    } else {
      kelvin = nval;
    }
    let r = import_Color.Color.kelvinToRGB[Math.trunc(kelvin / 100) * 100];
    if (r) {
      r = import_Color.Color.brightness(r, import_Color.Color.scale(dimmer, 0, 100, 0.3, 1));
    }
    return r ? String(import_Color.Color.rgb_dec565(r)) : null;
  }
  return null;
}
async function getSliderCTFromValue(i) {
  if (!i) {
    return null;
  }
  const nval = i.value && await i.value.getNumber();
  const mode = i.mode && await i.mode.getString();
  let r = 3500;
  if (nval !== null && nval !== void 0) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      const min = await i.minScale.getNumber();
      const max = await i.maxScale.getNumber();
      if (min !== null && max !== null) {
        if (mode === "mired") {
          r = Math.round(import_Color.Color.scale(nval, min, max, 0, 100));
        } else {
          r = Math.round(import_Color.Color.scale(nval, min, max, 100, 0));
        }
      }
    } else if (i.value && i.value.common && i.value.common.min !== void 0 && i.value.common.max !== void 0) {
      if (mode === "mired") {
        r = Math.round(import_Color.Color.scale(nval, i.value.common.min, i.value.common.max, 0, 100));
      } else {
        r = Math.round(import_Color.Color.scale(nval, i.value.common.min, i.value.common.max, 100, 0));
      }
    } else {
      if (mode === "mired") {
        r = Math.round(import_Color.Color.scale(nval, 153, 500, 0, 100));
      } else {
        r = Math.round(import_Color.Color.scale(nval, 2200, 6500, 100, 0));
      }
    }
    return r !== null ? String(r) : null;
  }
  return null;
}
async function setSliderCTFromValue(i, value) {
  if (!i || !i.value) {
    return;
  }
  const mode = i.mode && await i.mode.getString();
  let r = value;
  if (i.minScale !== void 0 && i.maxScale !== void 0) {
    const min = await i.minScale.getNumber();
    const max = await i.maxScale.getNumber();
    if (min !== null && max !== null) {
      if (mode === "mired") {
        r = Math.round(import_Color.Color.scale(r, 0, 100, min, max));
      } else {
        r = Math.round(import_Color.Color.scale(r, 0, 100, max, min));
      }
    }
  } else if (i.value && i.value.common && i.value.common.min !== void 0 && i.value.common.max !== void 0) {
    if (mode === "mired") {
      r = Math.round(import_Color.Color.scale(r, 0, 100, i.value.common.max, i.value.common.min));
    } else {
      r = Math.round(import_Color.Color.scale(r, 0, 100, i.value.common.min, i.value.common.max));
    }
  } else {
    if (mode === "mired") {
      r = Math.round(import_Color.Color.scale(r, 0, 100, 153, 500));
    } else {
      r = Math.round(import_Color.Color.scale(r, 0, 100, 6500, 2200));
    }
  }
  if (i.set && i.set.writeable) {
    await i.value.setStateAsync(r);
  } else {
    await i.value.setStateAsync(r);
  }
}
async function setScaledNumber(i, value) {
  var _a;
  if (!i || !i.value) {
    return;
  }
  const nval = (_a = await i.value.getNumber()) != null ? _a : null;
  if (nval !== null) {
    if (i.minScale !== void 0 && i.maxScale !== void 0) {
      value = getScaledNumberRaw(value, await i.minScale.getNumber(), await i.maxScale.getNumber(), value);
    }
    if (i.set && i.set.writeable) {
      await i.set.setStateAsync(value);
    } else if (i.value.writeable && nval !== value) {
      await i.value.setStateAsync(value);
    }
  }
}
async function getIconEntryValue(i, on, def, defOff = null, getText = false) {
  if (i === void 0) {
    return "";
  }
  on = on != null ? on : true;
  if (!i) {
    return import_icon_mapping.Icons.GetIcon(on ? def : defOff || def);
  }
  const text = getText ? i.true && i.true.text && await getValueEntryString(i.true.text) || null : null;
  if (text !== null) {
    const textFalse = i.false && i.false.text && await getValueEntryString(i.false.text) || null;
    if (typeof on === "number" && textFalse !== null) {
      const scale = i.scale && await i.scale.getObject();
      if ((0, import_types.isPartialColorScaleElement)(scale)) {
        if (scale.val_min && scale.val_min >= on || scale.val_max && scale.val_max <= on) {
          return text;
        }
        textFalse;
      }
    }
    if (!on) {
      return textFalse || text;
    }
    return text;
  }
  const icon = i.true && i.true.value && await i.true.value.getString() || null;
  const scaleM = i.scale && await i.scale.getObject();
  if (typeof on === "boolean") {
    const scale = (0, import_types.isPartialIconSelectScaleElement)(scaleM) ? scaleM : { valIcon_min: 0, valIcon_max: 1 };
    if (scale.valIcon_min === 1 && scale.valIcon_max === 0) {
      on = !on;
    }
    if (scale.valIcon_best !== void 0 && scale.valIcon_best == 0) {
      on = !on;
    }
    if (!on) {
      return import_icon_mapping.Icons.GetIcon(
        i.false && i.false.value && await i.false.value.getString() || defOff || icon || def
      );
    }
  } else if (typeof on === "number") {
    const scale = (0, import_types.isPartialIconSelectScaleElement)(scaleM) ? scaleM : { valIcon_min: 0, valIcon_max: 1 };
    const swap = scale.valIcon_min > scale.valIcon_max;
    const min = swap ? scale.valIcon_max : scale.valIcon_min;
    const max = swap ? scale.valIcon_min : scale.valIcon_max;
    if (min < on && max > on) {
      return import_icon_mapping.Icons.GetIcon(
        i.unstable && i.unstable.value && await i.unstable.value.getString() || icon || def
      );
    } else if (!swap && max > on || swap && min < on) {
      return import_icon_mapping.Icons.GetIcon(
        i.false && i.false.value && await i.false.value.getString() || defOff || icon || def
      );
    }
  }
  return import_icon_mapping.Icons.GetIcon(icon != null ? icon : def);
}
async function getIconEntryColor(i, value, def, defOff = null) {
  var _a, _b, _c, _d;
  value = value != null ? value : true;
  if (typeof def === "number") {
    def = import_Color.Color.decToRgb(def);
  } else if (typeof def === "string") {
    def = import_Color.Color.decToRgb(parseInt(def));
  }
  if (typeof defOff === "number") {
    defOff = import_Color.Color.decToRgb(defOff);
  } else if (defOff === null) {
    defOff = null;
  } else if (typeof defOff === "string") {
    defOff = import_Color.Color.decToRgb(parseInt(defOff));
  }
  if (!i) {
    return String(import_Color.Color.rgb_dec565(def));
  }
  if (typeof value === "boolean") {
    const color = i.true && i.true.color && await i.true.color.getRGBDec();
    const scale = i.scale && await i.scale.getObject();
    if (scale) {
      if ((0, import_types.isIconColorScaleElement)(scale)) {
        if (scale.val_min === 1 && scale.val_max === 0) {
          value = !value;
        }
        if (scale.val_best !== void 0 && scale.val_best == 0) {
          value = !value;
        }
      }
    }
    if (!value) {
      return (_c = (_b = (_a = i.false && i.false.color && await i.false.color.getRGBDec()) != null ? _a : defOff && String(import_Color.Color.rgb_dec565(defOff))) != null ? _b : color) != null ? _c : String(import_Color.Color.rgb_dec565(def));
    }
    return color != null ? color : String(import_Color.Color.rgb_dec565(def));
  } else if (typeof value === "number") {
    let cto = i.true && i.true.color && await i.true.color.getRGBValue();
    let cfrom = i.false && i.false.color && await i.false.color.getRGBValue();
    const scale = i.scale && await i.scale.getObject();
    if ((!cto || !cfrom) && (0, import_types.isIconColorScaleElement)(scale)) {
      switch (scale.mode) {
        case "hue":
        case "cie":
        case "mixed": {
          break;
        }
        case "triGrad":
        case "triGradAnchor":
        case "quadriGrad":
        case "quadriGradAnchor": {
          cto = cto || import_Color.Color.HMIOn;
          cfrom = cfrom || import_Color.Color.HMIOff;
        }
      }
    }
    if (cto && cfrom && scale) {
      let rColor = cto;
      if ((0, import_types.isIconColorScaleElement)(scale)) {
        let swap = false;
        let vMin = scale.val_min;
        let vMax = scale.val_max;
        if (vMax < vMin) {
          const temp = vMax;
          vMax = vMin;
          vMin = temp;
          const temp2 = cto;
          cto = cfrom;
          cfrom = temp2;
          swap = true;
        }
        vMin = vMin < value ? vMin : value;
        vMax = vMax > value ? vMax : value;
        let vBest = (_d = scale.val_best) != null ? _d : void 0;
        vBest = vBest !== void 0 ? Math.min(vMax, Math.max(vMin, vBest)) : void 0;
        let factor = 1;
        let func = import_Color.Color.mixColor;
        switch (scale.mode) {
          case "hue":
            func = import_Color.Color.mixColorHue;
            break;
          case "cie":
            func = import_Color.Color.mixColorCie;
            break;
          case "mixed":
            func = import_Color.Color.mixColor;
            break;
          case "triGradAnchor":
            if (scale.val_best !== void 0) {
              func = import_Color.Color.triGradAnchor;
              break;
            }
          // eslint-disable-next-line no-fallthrough
          case "triGrad":
            func = import_Color.Color.triGradColorScale;
            break;
          case "quadriGradAnchor":
            if (scale.val_best !== void 0) {
              func = import_Color.Color.quadriGradAnchor;
              break;
            }
          // eslint-disable-next-line no-fallthrough
          case "quadriGrad":
            func = import_Color.Color.quadriGradColorScale;
            break;
        }
        if (vMin == vMax) {
          rColor = cto;
        } else if (vBest === void 0) {
          factor = (value - vMin) / (vMax - vMin);
          factor = Math.min(1, Math.max(0, factor));
          factor = getLogFromIconScale(scale, factor);
          rColor = func(cfrom, cto, factor, { swap });
        } else if (value >= vBest) {
          cfrom = scale.val_best !== void 0 && scale.color_best ? scale.color_best : cfrom;
          factor = 1 - (value - vBest) / (vMax - vBest);
          factor = Math.min(1, Math.max(0, factor));
          factor = getLogFromIconScale(scale, factor);
          rColor = func(cfrom, cto, factor, { swap, anchorHigh: true });
        } else {
          cto = scale.val_best !== void 0 && scale.color_best ? scale.color_best : cto;
          factor = (value - vMin) / (vBest - vMin);
          factor = Math.min(1, Math.max(0, factor));
          factor = 1 - getLogFromIconScale(scale, 1 - factor);
          rColor = func(cfrom, cto, factor, { swap });
        }
        return String(import_Color.Color.rgb_dec565(rColor));
      } else if ((0, import_types.isPartialColorScaleElement)(scale)) {
        if (scale.val_min && scale.val_min >= value || scale.val_max && scale.val_max <= value) {
          return String(import_Color.Color.rgb_dec565(cto));
        }
        String(import_Color.Color.rgb_dec565(cfrom));
      }
    }
    if (value) {
      if (cto) {
        return String(import_Color.Color.rgb_dec565(cto));
      }
    } else if (cfrom) {
      return String(import_Color.Color.rgb_dec565(cfrom));
    } else if (cto) {
      return String(import_Color.Color.rgb_dec565(cto));
    }
  }
  return String(import_Color.Color.rgb_dec565(def));
}
function getLogFromIconScale(i, factor) {
  if (i.log10 !== void 0) {
    if (i.log10 === "max") {
      factor = factor * (90 / 10) + 1;
      factor = factor < 1 ? 1 : factor > 10 ? 10 : factor;
      factor = Math.log10(factor);
    } else {
      factor = (1 - factor) * (90 / 10) + 1;
      factor = factor < 1 ? 1 : factor > 10 ? 10 : factor;
      factor = Math.log10(factor);
      factor = 1 - factor;
    }
  }
  return factor;
}
async function GetIconColor(item, value, min = null, max = null, offColor = null) {
  var _a, _b;
  if (item === void 0) {
    return "";
  }
  if (import_Color.Color.isRGB(item)) {
    const onColor2 = item;
    if (typeof value === "number") {
      let val = typeof value === "number" ? value : 0;
      const maxValue = max != null ? max : 100;
      const minValue = min != null ? min : 0;
      val = val > maxValue ? maxValue : val;
      val = val < minValue ? minValue : val;
      return String(
        import_Color.Color.rgb_dec565(
          !offColor ? import_Color.Color.darken(onColor2 ? onColor2 : import_Color.Color.HMIOn, import_Color.Color.scale(val, maxValue, minValue, 0, 1)) : import_Color.Color.Interpolate(
            offColor,
            onColor2 ? onColor2 : import_Color.Color.HMIOn,
            import_Color.Color.scale(val, maxValue, minValue, 0, 1)
          )
        )
      );
    }
    if (value) {
      return String(import_Color.Color.rgb_dec565(onColor2 ? onColor2 : import_Color.Color.HMIOn));
    }
    return String(import_Color.Color.rgb_dec565(offColor ? offColor : import_Color.Color.HMIOff));
  }
  const onColor = item.true && item.true.color && await item.true.color.getRGBValue();
  offColor = item.false && item.false.color && await item.false.color.getRGBValue() || null;
  if (typeof value === "number") {
    let val = typeof value === "number" ? value : 0;
    const maxValue = (_a = item.maxBri && await item.maxBri.getNumber() || max) != null ? _a : 100;
    const minValue = (_b = item.minBri && await item.minBri.getNumber() || min) != null ? _b : 0;
    val = val > maxValue ? maxValue : val;
    val = val < minValue ? minValue : val;
    return String(
      import_Color.Color.rgb_dec565(
        !offColor ? import_Color.Color.darken(onColor ? onColor : import_Color.Color.HMIOn, import_Color.Color.scale(val, maxValue, minValue, 0, 1)) : import_Color.Color.Interpolate(
          offColor,
          onColor ? onColor : import_Color.Color.HMIOn,
          import_Color.Color.scale(val, maxValue, minValue, 0, 1)
        )
      )
    );
  }
  if (value) {
    return String(import_Color.Color.rgb_dec565(onColor ? onColor : import_Color.Color.HMIOn));
  }
  return String(import_Color.Color.rgb_dec565(offColor ? offColor : import_Color.Color.HMIOff));
}
async function getEntryColor(i, value, def) {
  var _a, _b;
  if (i === void 0) {
    return "";
  }
  if (typeof def === "number") {
    def = String(def);
  } else if (typeof def !== "string") {
    def = String(import_Color.Color.rgb_dec565(def));
  }
  if (!i) {
    return def;
  }
  const color = i.true && await i.true.getRGBDec();
  if (!value) {
    return (_b = (_a = i.false && await i.false.getRGBDec()) != null ? _a : color) != null ? _b : def;
  }
  return color != null ? color : def;
}
async function getEntryTextOnOff(i, on, useCommon = false) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
  if (!i) {
    return null;
  }
  if (typeof on === "number") {
    on = on > 0;
  }
  let value = "";
  let v = null;
  if (!(0, import_data_item.isDataItem)(i)) {
    if ((0, import_data_item.isDataItem)(i.true)) {
      v = (_a = i.true && await i.true.getString()) != null ? _a : null;
      if (useCommon) {
        const states = (_b = i.true && i.true.common && i.true.common.states) != null ? _b : null;
        if (states && v !== null && typeof states === "object") {
          if (!Array.isArray(states)) {
            v = (_c = states[v]) != null ? _c : v;
          } else if (!isNaN(Number(v))) {
            v = (_d = states[Number(v)]) != null ? _d : v;
          }
        }
      }
      value = v != null ? v : "";
    } else {
      value = (_e = i.true && i.true.prefix && await i.true.prefix.getString()) != null ? _e : "";
      v = (_f = i.true && i.true.value && await i.true.value.getString()) != null ? _f : null;
      value += v != null ? v : "";
      value += (_g = i.true && i.true.suffix && await i.true.suffix.getString()) != null ? _g : "";
    }
    if (!(on != null ? on : true)) {
      let value2 = "";
      let v2 = null;
      if ((0, import_data_item.isDataItem)(i.false)) {
        v2 = (_h = i.false && await i.false.getString()) != null ? _h : null;
        if (useCommon) {
          const states = (_i = i.false && i.false.common && i.false.common.states) != null ? _i : null;
          if (states && v2 !== null && typeof states === "object") {
            if (!Array.isArray(states)) {
              v2 = (_j = states[v2]) != null ? _j : v2;
            } else if (!isNaN(Number(v2))) {
              v2 = (_k = states[Number(v2)]) != null ? _k : v2;
            }
          }
        }
        value2 = v2 != null ? v2 : "";
      } else {
        value2 = (_l = i.false && i.false.prefix && await i.false.prefix.getString()) != null ? _l : "";
        v2 = (_m = i.false && i.false.value && await i.false.value.getString()) != null ? _m : null;
        value2 += v2 != null ? v2 : "";
        value2 += (_n = i.false && i.false.suffix && await i.false.suffix.getString()) != null ? _n : "";
      }
      return v2 === null ? v === null ? null : value : value2;
    }
    return v === null ? null : value;
  }
  return (_o = await i.getString()) != null ? _o : null;
}
async function getValueEntryBoolean(i) {
  if (!i) {
    return null;
  }
  const nval = i.value && await i.value.getBoolean();
  if (nval !== void 0) {
    return nval;
  }
  return null;
}
function isTextSizeEntryType(F) {
  return "textSize" in F;
}
async function getValueEntryString(i, v = null) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  if (!i || !i.value) {
    return null;
  }
  const nval = v !== null ? v : await getValueEntryNumber(i);
  const format = (_a = i.dateFormat && await i.dateFormat.getObject()) != null ? _a : null;
  if (nval !== null && nval !== void 0) {
    let res2 = "";
    if ((0, import_types.isValueDateFormat)(format)) {
      if (nval <= 0) {
        return null;
      }
      const temp = new Date(nval);
      if (isValidDate(temp)) {
        res2 = temp.toLocaleString(format.local, format.format);
      }
    } else {
      const d = (_b = "decimal" in i && i.decimal && await i.decimal.getNumber()) != null ? _b : null;
      if (d !== null && d !== false) {
        res2 = nval.toFixed(d);
      } else {
        res2 = String(nval);
      }
    }
    res2 = res2 + ((_d = (_c = i.unit && await i.unit.getString()) != null ? _c : i.value.common.unit) != null ? _d : "");
    let opt2 = "";
    if (isTextSizeEntryType(i)) {
      opt2 = String((_e = i.textSize && await i.textSize.getNumber()) != null ? _e : "");
    }
    return res2 + (opt2 ? `\xAC${opt2}` : "");
  }
  let res = await i.value.getString();
  let opt = "";
  if (res != null) {
    if ((0, import_types.isValueDateFormat)(format)) {
      const temp = new Date(res);
      if (isValidDate(temp)) {
        res = temp.toLocaleString(format.local, format.format);
      }
    }
    res += (_g = (_f = i.unit && await i.unit.getString()) != null ? _f : i.value.common.unit) != null ? _g : "";
    if (isTextSizeEntryType(i)) {
      opt = String((_h = i.textSize && await i.textSize.getNumber()) != null ? _h : "");
    }
    res += opt ? `\xAC${opt}` : "";
  }
  return res;
}
function alignText(text, size, align) {
  if (text.length >= size) {
    return text;
  }
  let text2 = "";
  const diff = size - text.length;
  if (align === "left") {
    text2 = text + " ".repeat(diff);
  } else if (align === "right") {
    text2 = " ".repeat(diff) + text;
  } else if (align === "center") {
    const right = Math.floor(diff / 2);
    const left = diff - right;
    text2 = " ".repeat(left) + text + " ".repeat(right);
  }
  return text2;
}
async function getValueAutoUnit(i, v, space, unit = null, startFactor = null, minFactor = 0) {
  var _a, _b, _c;
  if (!i || !i.value) {
    return {};
  }
  const siPrefixes = [
    // Unterhalb von 0
    { prefix: "f", name: "femto", factor: -5 },
    { prefix: "p", name: "pico", factor: -4 },
    { prefix: "n", name: "nano", factor: -3 },
    { prefix: "\u03BC", name: "micro", factor: -2 },
    { prefix: "m", name: "milli", factor: -1 },
    // Oberhalb von 0
    { prefix: "k", name: "kilo", factor: 1 },
    { prefix: "M", name: "mega", factor: 2 },
    { prefix: "G", name: "giga", factor: 3 },
    { prefix: "T", name: "tera", factor: 4 },
    { prefix: "P", name: "peta", factor: 5 }
  ];
  if (v != null && unit == null || v == null && unit != null) {
    throw new Error("v and unit must be both null or both not null");
  }
  let value = v != null ? v : await getValueEntryNumber(i, void 0, { ignoreDecimal: true });
  const cUnit = ((_b = (_a = i.unit && await i.unit.getString()) != null ? _a : i.value.common.unit) != null ? _b : "").trim();
  const decimal = (_c = "decimal" in i && i.decimal && await i.decimal.getNumber()) != null ? _c : null;
  const fits = false;
  let res = "";
  let unitFactor = startFactor != null ? startFactor : 0;
  if (value !== null && value !== void 0) {
    const isNegativ = value < 0;
    value = Math.abs(value);
    let factor = 0;
    if (unit == null && cUnit !== null) {
      for (const p of siPrefixes) {
        if (cUnit.startsWith(p.prefix)) {
          unit = cUnit.substring(p.prefix.length);
          factor = p.factor;
          break;
        }
      }
      if (unit === null) {
        unit = cUnit;
      }
    }
    value *= 10 ** (3 * factor);
    let tempValue = value / 10 ** (3 * unitFactor);
    let d = decimal != null && decimal !== false ? decimal : 1;
    const calSpace = space - (d ? d + 1 : 0);
    d = calSpace > 3 ? d : d - (3 - calSpace);
    d = d < 0 ? 0 : d;
    let endlessCouter = 0;
    while (!fits) {
      if (unitFactor > 5 || unitFactor < minFactor || endlessCouter++ > 10) {
        res = unitFactor < minFactor ? (value / 10 ** d / 10 ** (3 * ++unitFactor)).toFixed(d) : "error";
        break;
      }
      tempValue = Math.round(tempValue * 10 ** d) / 10 ** d;
      if (Math.round(tempValue * 10 ** d) === 0 || tempValue < 1 * 10 ** (Math.floor(calSpace / 2) - 1)) {
        tempValue = value / 10 ** (3 * --unitFactor);
        continue;
      }
      res = tempValue.toFixed(d);
      if (res.length > space) {
        if (tempValue >= 10 ** calSpace) {
          tempValue = value / 10 ** (3 * ++unitFactor);
          continue;
        }
      } else {
        break;
      }
    }
    res = isNegativ ? `-${res}` : res;
  }
  const index = siPrefixes.findIndex((a) => a.factor === unitFactor);
  unit = index !== -1 ? siPrefixes[index].prefix + unit : unit;
  return { value: res, unit, endFactor: unitFactor };
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
  if (!item) {
    return import_Color.Color.White;
  }
  const red = (_a = item.Red && await item.Red.getNumber()) != null ? _a : -1;
  const green = (_b = item.Green && await item.Green.getNumber()) != null ? _b : -1;
  const blue = (_c = item.Blue && await item.Blue.getNumber()) != null ? _c : -1;
  if (red === -1 || blue === -1 || green === -1) {
    return null;
  }
  return { r: red, g: green, b: blue };
};
const getDecfromRGBThree = async (item) => {
  const rgb = await getRGBfromRGBThree(item);
  if (!rgb) {
    return null;
  }
  return String(import_Color.Color.rgb_dec565(rgb));
};
const setRGBThreefromRGB = async (item, c) => {
  if (!item || !item.Red || !item.Green || !item.Blue) {
    return;
  }
  await item.Red.setStateAsync(c.r);
  await item.Green.setStateAsync(c.g);
  await item.Blue.setStateAsync(c.b);
};
const getDecfromHue = async (item) => {
  var _a;
  if (!item || !item.hue) {
    return null;
  }
  const hue = await item.hue.getNumber();
  let saturation = Math.abs((_a = item.saturation && await item.saturation.getNumber()) != null ? _a : 1);
  if (saturation > 1) {
    saturation = 1;
  }
  if (hue === null) {
    return null;
  }
  const arr = import_Color.Color.hsv2rgb(hue, saturation, 1);
  return String(import_Color.Color.rgb_dec565({ r: arr[0], g: arr[1], b: arr[2] }));
};
const setHuefromRGB = async (item, c) => {
  if (!item || !item.hue || !import_Color.Color.isRGB(c)) {
    return;
  }
  if (!item.hue.writeable) {
    return;
  }
  const hue = import_Color.Color.getHue(c.r, c.g, c.b);
  await item.hue.setStateAsync(hue);
};
function formatInSelText(Text) {
  if (Text === void 0 || Text === null) {
    return `error`;
  }
  let splitText = Text;
  if (typeof splitText === "string") {
    splitText = splitText.replaceAll("?", " ").replaceAll("__", "_").replaceAll("_", " ").split(" ");
  }
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
    textLineTwo = `${textLineTwo.substring(0, 9)}...`;
  }
  if (textLineOne.length != 0) {
    return `${textLineOne}\r
${textLineTwo.trim()}`;
  }
  return textLineTwo.trim();
}
function getItemMesssage(msg) {
  var _a, _b, _c, _d, _e, _f;
  if (!msg || !msg.intNameEntity || !msg.type) {
    return "~~~~~";
  }
  const id = [];
  if (msg.mainId) {
    id.push(msg.mainId);
  }
  if (msg.subId) {
    id.push(msg.subId);
  }
  if (msg.intNameEntity) {
    id.push(msg.intNameEntity);
  }
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
      if (source[k] === null || def[k] === null) {
        source[k] = void 0;
        def[k] = void 0;
      } else if (source[k] !== void 0) {
        def[k] = deepAssign(def[k], source[k]);
      } else if (def[k] !== void 0) {
        source[k] = def[k];
      }
    } else if (source[k] === void 0) {
      source[k] = def[k];
    } else if (def[k] === void 0) {
      def[k] = source[k];
    }
  }
  for (const k in source) {
    if (typeof source[k] === "object" && k in source) {
      if (source[k] === null) {
        source[k] = void 0;
        def[k] = void 0;
      } else if (def[k] === void 0) {
        def[k] = source[k];
      }
    }
  }
  return Object.assign(def, source);
}
function getInternalDefaults(type, role, write = true) {
  return {
    name: "",
    type,
    role,
    read: true,
    write
  };
}
function setTriggeredToState(theObject, exclude) {
  if (theObject instanceof Array) {
    for (let i = 0; i < theObject.length; i++) {
      setTriggeredToState(theObject[i], exclude);
    }
  } else {
    for (const prop in theObject) {
      if (exclude.indexOf(prop) !== -1) {
        continue;
      }
      if (prop == "type") {
        if (theObject[prop] === "triggered") {
          theObject[prop] = "state";
        }
      }
      if (theObject[prop] instanceof Object || theObject[prop] instanceof Array) {
        setTriggeredToState(theObject[prop], exclude);
      }
    }
  }
}
function getRegExp(s) {
  if (!s.startsWith("/")) {
    return null;
  }
  const i = s.lastIndexOf("/");
  const reg = s.slice(1, i);
  const arg = s.slice(i + 1);
  if (!reg) {
    return null;
  }
  return new RegExp(reg, arg ? arg : void 0);
}
function insertLinebreak(text, lineLength) {
  let counter = 0;
  let a = 0;
  let olda = a;
  while (counter++ < 30) {
    if (a + lineLength >= text.length) {
      break;
    }
    const n = text.lastIndexOf("\n", lineLength + a);
    if (n > a) {
      a = n;
      continue;
    }
    a = text.lastIndexOf(" ", lineLength + a);
    if (olda === a) {
      break;
    }
    olda = a;
    text = `${text.slice(0, a)}
${text.slice(++a)}`;
  }
  return text;
}
function isValidDate(d) {
  if (!d) {
    return false;
  }
  return d instanceof Date && !isNaN(d.getTime());
}
function getVersionAsNumber(version) {
  return version.split(".").map((item, i) => parseInt(item) * Math.pow(1e3, 2 - i)).reduce((a, b) => a + b);
}
function isVersionGreaterOrEqual(a, b) {
  const aNum = getVersionAsNumber(a);
  const bNum = getVersionAsNumber(b);
  return aNum >= bNum;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GetIconColor,
  alignText,
  deepAssign,
  formatInSelText,
  getDecfromHue,
  getDecfromRGBThree,
  getEntryColor,
  getEntryTextOnOff,
  getIconEntryColor,
  getIconEntryValue,
  getInternalDefaults,
  getItemMesssage,
  getPayload,
  getPayloadArray,
  getRGBfromRGBThree,
  getRegExp,
  getScaledNumber,
  getSliderCTFromValue,
  getTemperaturColorFromValue,
  getTranslation,
  getValueAutoUnit,
  getValueEntryBoolean,
  getValueEntryNumber,
  getValueEntryString,
  getVersionAsNumber,
  ifValueEntryIs,
  insertLinebreak,
  isValidDate,
  isVersionGreaterOrEqual,
  messageItemDefault,
  setHuefromRGB,
  setRGBThreefromRGB,
  setScaledNumber,
  setSliderCTFromValue,
  setTriggeredToState,
  setValueEntry
});
//# sourceMappingURL=tools.js.map
