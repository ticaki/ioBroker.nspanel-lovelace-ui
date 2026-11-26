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
var nspanelts_import_exports = {};
__export(nspanelts_import_exports, {
  NSPANELTS_MAX_VERSION: () => NSPANELTS_MAX_VERSION,
  NSPANELTS_MIN_VERSION: () => NSPANELTS_MIN_VERSION,
  NSPANELTS_SERVICE_PAGES: () => NSPANELTS_SERVICE_PAGES,
  convertNsPanelTs: () => convertNsPanelTs,
  inspectNsPanelTs: () => inspectNsPanelTs,
  isSupportedNsPanelTsVersion: () => isSupportedNsPanelTsVersion,
  stripTypes: () => stripTypes,
  topicFromMqttState: () => topicFromMqttState
});
module.exports = __toCommonJS(nspanelts_import_exports);
var nodeModule = __toESM(require("node:module"));
var vm = __toESM(require("node:vm"));
var import_script_source = require("./script-source");
const NSPANELTS_MIN_VERSION = "v4.4";
const NSPANELTS_MAX_VERSION = "v5.1.1";
const SCRIPT_VERSION_RE = /\bconst\s+scriptVersion\s*(?::\s*string\s*)?=\s*(['"])([^'"\n]*)\1/;
const RECEIVE_TOPIC_RE = /\bconst\s+NSPanelReceiveTopic\s*(?::\s*string\s*)?=\s*(['"])([^'"\n]*)\1/;
const SEND_TOPIC_RE = /\bconst\s+NSPanelSendTopic\s*(?::\s*string\s*)?=\s*(['"])([^'"\n]*)\1/;
function versionParts(version) {
  const m = /^v?(\d+(?:\.\d+)*)$/.exec(version.trim());
  return m ? m[1].split(".").map((p) => parseInt(p, 10)) : void 0;
}
function compareParts(a, b, length) {
  var _a, _b;
  const n = length != null ? length : Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const d = ((_a = a[i]) != null ? _a : 0) - ((_b = b[i]) != null ? _b : 0);
    if (d !== 0) {
      return d;
    }
  }
  return 0;
}
function isSupportedNsPanelTsVersion(version) {
  const v = versionParts(version);
  const min = versionParts(NSPANELTS_MIN_VERSION);
  const max = versionParts(NSPANELTS_MAX_VERSION);
  if (!v || !min || !max) {
    return false;
  }
  return compareParts(v, min) >= 0 && compareParts(v, max, max.length) <= 0;
}
function topicFromMqttState(state) {
  const m = /^mqtt\.\d+\.(.+)\.(?:tele\.RESULT|cmnd\.CustomSend)$/.exec(state.trim());
  return m ? m[1].replace(/\./g, "/") : void 0;
}
function inspectNsPanelTs(source) {
  var _a;
  const versionMatch = SCRIPT_VERSION_RE.exec(source);
  const isNsPanelTs = /\bNSPanelReceiveTopic\b/.test(source) || versionMatch !== null && /zur Steuerung des SONOFF NSPanel/.test(source);
  if (!isNsPanelTs) {
    return { isNsPanelTs: false, supported: false };
  }
  const receive = RECEIVE_TOPIC_RE.exec(source);
  const send = SEND_TOPIC_RE.exec(source);
  const topic = (_a = receive ? topicFromMqttState(receive[2]) : void 0) != null ? _a : send ? topicFromMqttState(send[2]) : void 0;
  const base = { isNsPanelTs: true, supported: false, ...topic ? { topic } : {} };
  if (!versionMatch) {
    return { ...base, reason: "noVersion" };
  }
  const version = versionMatch[2];
  if (!isSupportedNsPanelTsVersion(version)) {
    return { ...base, version, reason: "version" };
  }
  if (!(0, import_script_source.locateConfigObject)(source)) {
    return { ...base, version, reason: "noConfig" };
  }
  return { ...base, version, supported: true };
}
const NSPANELTS_SERVICE_PAGES = [
  "Unlock_Service",
  "NSPanel_Service",
  "NSPanel_Service_SubPage",
  "NSPanel_Infos",
  "NSPanel_Wifi_Info_1",
  "NSPanel_Wifi_Info_2",
  "NSPanel_Sensoren",
  "NSPanel_Hardware",
  "NSPanel_IoBroker",
  "NSPanel_Einstellungen",
  "NSPanel_Screensaver",
  "NSPanel_ScreensaverDimmode",
  "NSPanel_ScreensaverBrightness",
  "NSPanel_ScreensaverLayout",
  "NSPanel_ScreensaverWeather",
  "NSPanel_ScreensaverDateformat",
  "NSPanel_ScreensaverIndicators",
  "NSPanel_ScreensaverOther",
  "NSPanel_Relays",
  "NSPanel_Script",
  "NSPanel_Firmware",
  "NSPanel_FirmwareTasmota",
  "NSPanel_FirmwareBerry",
  "NSPanel_FirmwareNextion"
];
function isRecord(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function getStripFunction() {
  const mod = { ...nodeModule };
  const fn = mod.stripTypeScriptTypes;
  if (typeof fn !== "function") {
    return void 0;
  }
  return (code, options) => {
    const r = Reflect.apply(fn, nodeModule, [code, options]);
    return typeof r === "string" ? r : "";
  };
}
function stripTypes(code) {
  const strip = getStripFunction();
  if (!strip) {
    throw new Error(
      `This Node.js version (${process.version}) cannot strip TypeScript types (node:module stripTypeScriptTypes is missing, Node.js >= 22.13 needed)`
    );
  }
  const original = process.emitWarning;
  process.emitWarning = (warning, ...rest) => {
    const text = typeof warning === "string" ? warning : warning.message;
    const kind = typeof rest[0] === "string" ? rest[0] : isRecord(rest[0]) ? rest[0].type : void 0;
    if (kind === "ExperimentalWarning" && /strip|typescript/i.test(text)) {
      return;
    }
    Reflect.apply(original, process, [warning, ...rest]);
  };
  try {
    return strip(code, { mode: "strip" });
  } finally {
    process.emitWarning = original;
  }
}
function configPart(source) {
  const loc = (0, import_script_source.locateConfigObject)(source);
  if (!loc) {
    return void 0;
  }
  let end = loc.close + 1;
  const semi = /^\s*;/.exec(loc.blank.slice(end));
  if (semi) {
    end += semi[0].length;
  }
  const code = source.slice(0, end).replace(/^(\s*)export\s+(?=(?:const|let|var)\s)/gm, "$1");
  const blank = loc.blank.slice(0, end);
  const names = /* @__PURE__ */ new Set();
  let depth = 0;
  const re = /[{}()[\]]|\b(?:let|const|var)\s+([A-Za-z_$][\w$]*)/g;
  for (const m of blank.matchAll(re)) {
    const t = m[0];
    if (t === "{" || t === "(" || t === "[") {
      depth++;
    } else if (t === "}" || t === ")" || t === "]") {
      depth--;
    } else if (depth === 0 && m[1]) {
      names.add(m[1]);
    }
  }
  return { code, names: [...names] };
}
function evaluate(source) {
  const part = configPart(source);
  if (!part) {
    throw new Error("no `config` object found");
  }
  const js = stripTypes(part.code);
  const collect = part.names.filter((n) => n !== "config").map((n) => `${JSON.stringify(n)}: typeof ${n} === 'undefined' ? undefined : ${n}`).join(",\n");
  const code = `${js}
;globalThis.__nspanelts = { config: typeof config === 'undefined' ? undefined : config, vars: {
${collect}
} };`;
  const sandbox = {
    findLocaleServMenu: (key) => key,
    getState: () => ({ val: null, ack: true, ts: 0, lc: 0 }),
    existsState: () => false,
    existsObject: () => false,
    getObject: () => null,
    log: () => void 0
  };
  const ctx = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  vm.runInContext(code, ctx, { timeout: 2e3, filename: "NSPanelTs-config.js" });
  const out = sandbox.__nspanelts;
  if (!isRecord(out) || !isRecord(out.config)) {
    throw new Error("the configuration part did not produce a `config` object");
  }
  const vars = /* @__PURE__ */ new Map();
  if (isRecord(out.vars)) {
    for (const [k, v] of Object.entries(out.vars)) {
      vars.set(k, v);
    }
  }
  return { config: out.config, vars };
}
function quote(s) {
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\r/g, "\\r").replace(/\n/g, "\\n")}'`;
}
function keyText(k) {
  return /^[A-Za-z_$][\w$]*$/.test(k) ? k : quote(k);
}
function toNode(v) {
  if (v === null) {
    return { t: "lit", s: "null" };
  }
  if (typeof v === "string") {
    return { t: "lit", s: quote(v) };
  }
  if (typeof v === "number") {
    return { t: "lit", s: Number.isFinite(v) ? String(v) : "null" };
  }
  if (typeof v === "boolean") {
    return { t: "lit", s: String(v) };
  }
  if (Array.isArray(v)) {
    return { t: "arr", e: v.map((x) => {
      var _a;
      return { v: (_a = toNode(x)) != null ? _a : { t: "lit", s: "null" }, c: [] };
    }) };
  }
  if (isRecord(v)) {
    const e = [];
    for (const [k, x] of Object.entries(v)) {
      const n = toNode(x);
      if (n) {
        e.push({ k, v: n, c: [] });
      }
    }
    return { t: "obj", e };
  }
  return void 0;
}
function hasComments(n) {
  return (n.t === "obj" || n.t === "arr") && n.e.some((x) => x.c.length > 0 || x.v !== void 0 && hasComments(x.v));
}
function inline(n) {
  switch (n.t) {
    case "lit":
    case "ref":
      return n.s;
    case "arr":
      return `[${n.e.map((x) => x.v ? inline(x.v) : "null").join(", ")}]`;
    case "obj":
      return n.e.length === 0 ? "{}" : `{ ${n.e.filter((x) => x.v).map((x) => {
        var _a;
        return `${keyText((_a = x.k) != null ? _a : "")}: ${x.v ? inline(x.v) : ""}`;
      }).join(", ")} }`;
  }
}
const MAX_LINE = 120;
function render(n, indent) {
  var _a;
  if (n.t === "lit" || n.t === "ref") {
    return n.s;
  }
  const one = inline(n);
  if (!hasComments(n) && indent.length + one.length <= MAX_LINE) {
    return one;
  }
  const inner = `${indent}    `;
  const lines = [];
  for (const x of n.e) {
    for (const c of x.c) {
      lines.push(`${inner}${c}`);
    }
    if (x.v) {
      const value = render(x.v, inner);
      lines.push(n.t === "obj" ? `${inner}${keyText((_a = x.k) != null ? _a : "")}: ${value},` : `${inner}${value},`);
    }
  }
  const [open, close] = n.t === "obj" ? ["{", "}"] : ["[", "]"];
  return lines.length === 0 ? `${open}${close}` : `${open}
${lines.join("\n")}
${indent}${close}`;
}
function show(v) {
  const n = toNode(v);
  return n ? inline(n) : String(v);
}
const CARD_TYPES = {
  cardEntities: "PageEntities",
  cardSchedule: "PageSchedule",
  cardGrid: "PageGrid",
  cardGrid2: "PageGrid2",
  cardGrid3: "PageGrid3",
  cardThermo: "PageThermo",
  cardMedia: "PageMedia"
};
const ADMIN_ONLY_CARDS = {
  cardAlarm: "create it in the admin (tab PageConfig, type alarm)",
  cardUnlock: "create it in the admin (tab PageConfig, type unlock)",
  cardQR: "create it in the admin (tab PageConfig, type QR)",
  cardPower: "create it in the admin (tab PageConfig, type power)",
  cardChart: "create it in the admin (tab PageConfig, type chart)",
  cardLChart: "create it in the admin (tab PageConfig, type chart)",
  cardThermo2: "the thermostat list (thermoItems) of the old script has no unambiguous form in the adapter - create it in the admin (tab PageConfig, type thermostat 2) or as script page with thermoItems"
};
const ITEM_COPY = /* @__PURE__ */ new Set([
  "id",
  "icon",
  "icon2",
  "icon3",
  "onColor",
  "offColor",
  "minValueBrightness",
  "maxValueBrightness",
  "minValueColorTemp",
  "maxValueColorTemp",
  "minValueLevel",
  "maxValueLevel",
  "minValueTilt",
  "maxValueTilt",
  "minValue",
  "maxValue",
  "stepValue",
  "prefixName",
  "suffixName",
  "name",
  "secondRow",
  "buttonText",
  "unit",
  "colormode",
  "modeList",
  "useValue",
  "shutterIcons",
  "sliderItems",
  "fontSize",
  "alwaysOnDisplay",
  "role",
  "uniqueName",
  "popupVersion",
  "autoCreateALias",
  // in the script configuration, but not evaluated by the adapter - copied plus TODO
  "iconArray",
  "customIcons",
  "actionStringArray",
  "inSel_ChoiceState",
  "hidePassword",
  "monobutton",
  "shutterType",
  "yAxis",
  "yAxisTicks",
  "xAxisDecorationId"
]);
const THERMO_ITEM_COPY = /* @__PURE__ */ new Set(["popupThermoMode1", "popupThermoMode2", "popupThermoMode3", "setThermoAlias"]);
const ITEM_NOT_EVALUATED = /* @__PURE__ */ new Set([
  "iconArray",
  "customIcons",
  "actionStringArray",
  "inSel_ChoiceState",
  "hidePassword",
  "monobutton",
  "shutterType",
  "yAxis",
  "yAxisTicks",
  "xAxisDecorationId",
  "popUpThermoName",
  "setThermoDestTemp2"
]);
const PAGE_COPY = /* @__PURE__ */ new Set([
  "heading",
  "subPage",
  "parentIcon",
  "parentIconColor",
  "prevIcon",
  "prevIconColor",
  "nextIcon",
  "nextIconColor",
  "homeIcon",
  "homeIconColor",
  "hiddenByTrigger",
  "alwaysOnDisplay"
]);
const PAGE_NAV = ["parent", "prev", "next", "home"];
const MEDIA_COPY = /* @__PURE__ */ new Set([
  "name",
  "colorMediaIcon",
  "colorMediaArtist",
  "colorMediaTitle",
  "speakerList",
  "playList",
  "equalizerList",
  "repeatList",
  "globalTracklist",
  "minValue",
  "maxValue"
]);
const SCREENSAVER_COPY = /* @__PURE__ */ new Set([
  "ScreensaverEntity",
  "ScreensaverEntityText",
  "ScreensaverEntityFactor",
  "ScreensaverEntityDecimalPlaces",
  "ScreensaverEntityDateFormat",
  "ScreensaverEntityIconOn",
  "ScreensaverEntityIconOff",
  "ScreensaverEntityUnitText",
  "ScreensaverEntityIconColor",
  "ScreensaverEntityOnColor",
  "ScreensaverEntityOffColor",
  "ScreensaverEntityOnText",
  "ScreensaverEntityOffText",
  "ScreensaverEntityIconSelect"
]);
const MR_COPY = /* @__PURE__ */ new Set([
  "ScreensaverEntity",
  "ScreensaverEntityIconOn",
  "ScreensaverEntityIconSelect",
  "ScreensaverEntityIconOff",
  "ScreensaverEntityValue",
  "ScreensaverEntityValueDecimalPlace",
  "ScreensaverEntityValueUnit",
  "ScreensaverEntityOnColor",
  "ScreensaverEntityOffColor"
]);
const OWN_ALIAS_FOLDERS = [
  "autoUpdate",
  "Berry_Driver",
  "Config",
  "Dimmode",
  "Display",
  "Display_Firmware",
  "IoBroker",
  "ipAddress",
  "Relay",
  "ScreensaverInfo",
  "Sensor",
  "Tasmota",
  "Tasmota_Firmware"
];
const WEATHER_ADAPTERS = ["accuweather", "brightsky", "openweathermap", "pirate-weather"];
const CONFIG_KNOWN = /* @__PURE__ */ new Set([
  "pages",
  "subPages",
  "leftScreensaverEntity",
  "bottomScreensaverEntity",
  "indicatorScreensaverEntity",
  "mrIcon1ScreensaverEntity",
  "mrIcon2ScreensaverEntity",
  "button1",
  "button2",
  "panelRecvTopic",
  "panelSendTopic",
  "weatherEntity",
  "defaultOffColor",
  "defaultOnColor",
  "defaultColor",
  "defaultBackgroundColor"
]);
class Converter {
  constructor(ev) {
    this.ev = ev;
    for (const [name, v] of ev.vars) {
      if (isRecord(v) && typeof v.type === "string" && v.type.startsWith("card")) {
        this.pageVars.set(name, v);
        if (!this.byObject.has(v)) {
          this.byObject.set(v, name);
        }
      }
    }
    const path = ev.vars.get("NSPanel_Path");
    this.ownPath = typeof path === "string" && path.length > 8 ? path : void 0;
    const alias = ev.vars.get("AliasPath");
    this.aliasPath = typeof alias === "string" && alias.length > 8 ? alias : void 0;
  }
  todos = [];
  errors = [];
  discarded = [];
  byObject = /* @__PURE__ */ new Map();
  pageVars = /* @__PURE__ */ new Map();
  pages = /* @__PURE__ */ new Map();
  order = [];
  /** folder of the states of the old script (`NSPanel_Path`) */
  ownPath;
  /** alias folder of the old script (`AliasPath`) - only its own sub folders count, `usr` etc. belong to the user */
  aliasPath;
  todo(page, text) {
    this.todos.push(page ? { page, text } : { text });
    return `// TODO: ${text}`;
  }
  /**
   * Collects the pages: `pages`, `subPages` and the pages only reached by references; service pages dropped.
   */
  collectPages() {
    const add = (v, main, referencedOnly) => {
      const varName = this.byObject.get(v);
      if (!varName || !isRecord(v)) {
        this.errors.push(`a page in ${main ? "pages" : "subPages"} is no page variable: ${show(v)}`);
        return;
      }
      if (NSPANELTS_SERVICE_PAGES.includes(varName)) {
        if (!this.discarded.includes(varName)) {
          this.discarded.push(varName);
        }
        return;
      }
      if (this.pages.has(varName)) {
        return;
      }
      const info = { varName, uniqueName: varName, page: v, main, referencedOnly };
      this.pages.set(varName, info);
      this.order.push(info);
    };
    const list = (key) => {
      const v = this.ev.config[key];
      return Array.isArray(v) ? v.filter((x) => x != null) : [];
    };
    for (const p of list("pages")) {
      add(p, true, false);
    }
    for (const p of list("subPages")) {
      add(p, false, false);
    }
    for (let i = 0; i < this.order.length; i++) {
      for (const name of this.referencedNames(this.order[i].page)) {
        const v = this.pageVars.get(name);
        if (v && !this.pages.has(name) && !NSPANELTS_SERVICE_PAGES.includes(name)) {
          add(v, false, true);
        }
      }
    }
    for (const ss of ["leftScreensaverEntity", "bottomScreensaverEntity", "indicatorScreensaverEntity"]) {
      for (const e of list(ss)) {
        if (isRecord(e) && e.ScreensaverEntityNaviToPage) {
          const name = this.byObject.get(e.ScreensaverEntityNaviToPage);
          if (name && !this.pages.has(name) && !NSPANELTS_SERVICE_PAGES.includes(name)) {
            add(e.ScreensaverEntityNaviToPage, false, true);
          }
        }
      }
    }
    for (const b of ["button1", "button2"]) {
      const btn = this.ev.config[b];
      if (isRecord(btn) && btn.mode === "page" && btn.page) {
        const name = this.byObject.get(btn.page);
        if (name && !this.pages.has(name) && !NSPANELTS_SERVICE_PAGES.includes(name)) {
          add(btn.page, false, true);
        }
      }
    }
    const first = this.order.find((p) => p.main && this.isScriptCard(p.page));
    const clash = this.order.find((p) => p.varName === "main" && p !== first);
    if (clash) {
      clash.uniqueName = "main_page";
      this.todo(
        clash.uniqueName,
        `page variable 'main' renamed to uniqueName 'main_page' (main is the start page)`
      );
    }
    if (first) {
      first.uniqueName = "main";
    }
  }
  referencedNames(page) {
    const out = [];
    for (const k of PAGE_NAV) {
      const v = page[k];
      if (typeof v === "string") {
        out.push(v);
      } else if (v) {
        const n = this.byObject.get(v);
        if (n) {
          out.push(n);
        }
      }
    }
    if (Array.isArray(page.items)) {
      for (const it of page.items) {
        if (isRecord(it)) {
          if (typeof it.targetPage === "string") {
            out.push(it.targetPage);
          }
          if (it.navigate === true && typeof it.id === "string" && it.targetPage === void 0) {
            out.push(it.id);
          }
        }
      }
    }
    return out;
  }
  isScriptCard(page) {
    return typeof page.type === "string" && page.type in CARD_TYPES && this.mediaId(page) !== void 0;
  }
  /**
   * Name of a page reference (variable name or page object) in the new script.
   *
   * @param ref the reference
   * @param page page the reference is in
   * @param what field for the TODO text
   * @param comments comments of the place
   * @returns the uniqueName, undefined when the reference is dropped
   */
  pageRef(ref, page, what, comments) {
    let name;
    if (typeof ref === "string") {
      name = ref;
    } else if (ref) {
      name = this.byObject.get(ref);
      if (!name) {
        comments.push(this.todo(page, `${what}: no page variable found for ${show(ref)}`));
        return void 0;
      }
    } else {
      return void 0;
    }
    if (NSPANELTS_SERVICE_PAGES.includes(name)) {
      comments.push(this.todo(page, `${what} '${name}' pointed to a service page of the old script - dropped`));
      return void 0;
    }
    const info = this.pages.get(name);
    if (info) {
      return info.uniqueName;
    }
    if (this.pageVars.has(name)) {
      return name;
    }
    comments.push(
      this.todo(page, `${what} '${name}': no page with this name in the old script - check the target`)
    );
    return name;
  }
  /**
   * Whether the id is one of the states / aliases the old script creates itself.
   *
   * @param id state id
   * @returns true for `NSPanel_Path…` and the own sub folders of `AliasPath`
   */
  isOwnState(id) {
    if (typeof id !== "string") {
      return false;
    }
    if (this.ownPath && id.startsWith(this.ownPath)) {
      return true;
    }
    if (this.aliasPath && id.startsWith(this.aliasPath)) {
      const rest = id.slice(this.aliasPath.length);
      return OWN_ALIAS_FOLDERS.some((f) => rest === f || rest.startsWith(`${f}.`));
    }
    return false;
  }
  /**
   * a page item
   *
   * @param item the item of the old script
   * @param page uniqueName of the page
   * @param thermo item of a cardThermo
   * @returns the entry
   */
  item(item, page, thermo) {
    var _a;
    const c = [];
    if (!isRecord(item)) {
      return { v: (_a = toNode(item)) != null ? _a : { t: "lit", s: "null" }, c };
    }
    const e = [];
    const navigateById = item.navigate === true && item.targetPage === void 0 && typeof item.id === "string";
    for (const [k, v] of Object.entries(item)) {
      if (v === void 0) {
        continue;
      }
      const ec = [];
      if (k === "navigate") {
        e.push({ k, v: toNode(v), c: ec });
        continue;
      }
      if (k === "id" && navigateById) {
        continue;
      }
      if (k === "targetPage") {
        const t = this.pageRef(v, page, "targetPage", c);
        if (t !== void 0) {
          e.push({ k, v: toNode(t), c: ec });
        }
        continue;
      }
      if (k === "colorScale") {
        ec.push(
          this.todo(
            page,
            `colorScale: the old script used its own 11-step palette green \u2192 red, the adapter scales between onColor and offColor (or colorScale.mode) - check the colors`
          )
        );
        e.push({ k, v: toNode(v), c: ec });
        continue;
      }
      if (k === "useColor" || k === "interpolateColor") {
        if (k === "useColor" && v !== true || k === "interpolateColor" && v === true) {
          e.push({ c: [this.todo(page, `${k}: ${show(v)} - not evaluated by the adapter`)] });
        }
        continue;
      }
      if (ITEM_COPY.has(k) || thermo && THERMO_ITEM_COPY.has(k) || thermo && ITEM_NOT_EVALUATED.has(k)) {
        if (ITEM_NOT_EVALUATED.has(k)) {
          ec.push(this.todo(page, `${k} is not evaluated by the adapter`));
        }
        if (k === "id" && this.isOwnState(v)) {
          ec.push(
            this.todo(
              page,
              `id ${show(v)} is a state the old script created itself - the adapter does not update it, choose another state`
            )
          );
        }
        const n = toNode(v);
        if (!n) {
          ec.push(this.todo(page, `${k} is no plain value and was dropped`));
          e.push({ c: ec });
          continue;
        }
        e.push({ k, v: n, c: ec });
        continue;
      }
      e.push({ c: [this.todo(page, `${k}: ${show(v)} - no counterpart in the adapter`)] });
    }
    if (navigateById && typeof item.id === "string") {
      const t = this.pageRef(item.id, page, "navigation target (id)", c);
      if (t !== void 0) {
        e.push({ k: "targetPage", v: toNode(t), c: [] });
      }
    }
    return { v: { t: "obj", e }, c };
  }
  /**
   * id of the media device for the adapter, undefined when the player cannot be mapped
   *
   * @param page media page
   * @returns the id, or the page itself is no media page: ''
   */
  mediaId(page) {
    if (page.type !== "cardMedia") {
      return "";
    }
    const item = Array.isArray(page.items) ? page.items[0] : void 0;
    if (!isRecord(item) || typeof item.adapterPlayerInstance !== "string") {
      return void 0;
    }
    const instance = item.adapterPlayerInstance.replace(/\.+$/, "");
    const adapter = instance.split(".")[0];
    const device = typeof item.mediaDevice === "string" ? item.mediaDevice : "";
    const folder = { alexa2: "Echo-Devices", sonos: "root", squeezeboxrpc: "Players" };
    if (adapter in folder) {
      return device ? `${instance}.${folder[adapter]}.${device}` : void 0;
    }
    if (adapter === "mpd" || adapter === "spotify-premium") {
      return instance;
    }
    return void 0;
  }
  media(page, name) {
    var _a;
    const c = [];
    const item = Array.isArray(page.items) && isRecord(page.items[0]) ? page.items[0] : {};
    const e = [{ k: "id", v: toNode((_a = this.mediaId(page)) != null ? _a : ""), c: [] }];
    if (typeof item.id === "string") {
      c.push(`// alias of the old script ${quote(item.id)} is not needed any more`);
    }
    for (const [k, v] of Object.entries(item)) {
      if (v === void 0 || ["id", "adapterPlayerInstance", "mediaDevice", "autoCreateALias", "alwaysOnDisplay"].includes(k)) {
        continue;
      }
      if (MEDIA_COPY.has(k)) {
        e.push({ k, v: toNode(v), c: [] });
        continue;
      }
      c.push(this.todo(name, `media ${k}: ${show(v)} - no counterpart in the adapter`));
    }
    return { k: "media", v: { t: "obj", e }, c };
  }
  /**
   * a page as `const <var>: ScriptConfig.<Type> = { … };` or as TODO block
   *
   * @param info the page
   * @returns source text
   */
  pageSource(info) {
    var _a;
    const { page, uniqueName } = info;
    const type = typeof page.type === "string" ? page.type : "";
    const head = [];
    if (info.referencedOnly) {
      head.push(
        this.todo(
          uniqueName,
          `page '${info.varName}' was not listed in pages/subPages of the old script, only referenced - added to subPages, check it`
        )
      );
    }
    if (typeof page.uniqueName === "string" && page.uniqueName !== uniqueName) {
      head.push(
        this.todo(
          uniqueName,
          `uniqueName of the old script ${quote(page.uniqueName)} replaced by ${quote(uniqueName)}`
        )
      );
    }
    const mediaId = this.mediaId(page);
    if (!(type in CARD_TYPES) || mediaId === void 0) {
      const reason = (_a = ADMIN_ONLY_CARDS[type]) != null ? _a : type === "cardMedia" ? "the player of this media page (adapterPlayerInstance / mediaDevice) is not supported by the adapter - only alexa2, sonos, squeezeboxrpc, mpd and spotify-premium" : `card type ${quote(type)} is unknown`;
      head.push(this.todo(uniqueName, `${type} page '${uniqueName}': ${reason}. Original of the old script:`));
      const orig = this.pageEntries(info, true);
      const text2 = render({ t: "obj", e: orig }, "");
      const block = `const ${info.varName} = ${text2};`.split("\n").map((l) => `    // ${l}`);
      return [...head.map((l) => `    ${l}`), ...block].join("\n");
    }
    const e = this.pageEntries(info, false);
    const text = render({ t: "obj", e }, "    ");
    return [
      ...head.map((l) => `    ${l}`),
      `    const ${info.varName}: ScriptConfig.${CARD_TYPES[type]} = ${text};`
    ].join("\n");
  }
  pageEntries(info, original) {
    var _a;
    const { page, uniqueName } = info;
    const type = typeof page.type === "string" ? page.type : "";
    const e = [
      { k: "type", v: toNode(type), c: [] },
      { k: "uniqueName", v: toNode(uniqueName), c: [] }
    ];
    const sink = (list) => original ? [] : list;
    for (const [k, v] of Object.entries(page)) {
      if (v === void 0 || k === "type" || k === "uniqueName" || k === "items") {
        continue;
      }
      const c = [];
      if (PAGE_NAV.includes(k)) {
        const before = this.todos.length;
        const name = this.pageRef(v, uniqueName, k, c);
        if (original) {
          this.todos.length = before;
        }
        if (name !== void 0) {
          e.push({ k, v: toNode(name), c: sink(c) });
        } else {
          e.push({ c: sink(c) });
        }
        continue;
      }
      if (original) {
        const n = toNode(v);
        if (n) {
          e.push({ k, v: n, c: [] });
        }
        continue;
      }
      if (PAGE_COPY.has(k)) {
        e.push({ k, v: toNode(v), c });
        continue;
      }
      if (k === "useColor") {
        if (v !== true && type !== "cardThermo" && type !== "cardMedia") {
          c.push(this.todo(uniqueName, `useColor: ${show(v)} - the adapter always uses the colors`));
          e.push({ c });
        }
        continue;
      }
      if (k === "showOnlyPlayerHeadline") {
        c.push(
          this.todo(
            uniqueName,
            `showOnlyPlayerHeadline: ${show(v)} - in the adapter the headline of a media page is set in the admin (headline mode)`
          )
        );
        e.push({ c });
        continue;
      }
      c.push(this.todo(uniqueName, `${k}: ${show(v)} - no counterpart in the adapter`));
      e.push({ c });
    }
    const items = Array.isArray(page.items) ? page.items : [];
    if (original) {
      e.push({ k: "items", v: (_a = toNode(items)) != null ? _a : { t: "arr", e: [] }, c: [] });
      return e;
    }
    const first = items[0];
    if ((type === "cardThermo" || type === "cardMedia") && isRecord(first) && first.alwaysOnDisplay !== void 0 && page.alwaysOnDisplay === void 0) {
      e.push({ k: "alwaysOnDisplay", v: toNode(first.alwaysOnDisplay), c: [] });
    }
    if (type === "cardMedia") {
      e.push(this.media(page, uniqueName));
      if (items.length > 1) {
        e.push({
          c: [
            this.todo(
              uniqueName,
              `items after the player of the old media page dropped: ${show(items.slice(1))}`
            )
          ]
        });
      }
      e.push({ k: "items", v: { t: "arr", e: [] }, c: [] });
      return e;
    }
    e.push({
      k: "items",
      v: {
        t: "arr",
        e: items.filter((it) => it != null).map((it) => this.item(it, uniqueName, type === "cardThermo"))
      },
      c: []
    });
    return e;
  }
  /**
   * a screensaver element
   *
   * @param el the element
   * @param where name of the list
   * @param mr mrIcon element
   * @returns the entry
   */
  screensaver(el, where, mr) {
    if (el == null) {
      return { v: { t: "lit", s: "null" }, c: [] };
    }
    const c = [];
    if (!isRecord(el)) {
      c.push(this.todo(void 0, `${where}: ${show(el)} is no screensaver element - dropped`));
      return { c };
    }
    const e = [{ k: "type", v: toNode("script"), c: [] }];
    const copy = mr ? MR_COPY : SCREENSAVER_COPY;
    for (const [k, v] of Object.entries(el)) {
      if (v === void 0) {
        continue;
      }
      const ec = [];
      if (k === "ScreensaverEntityNaviToPage" && !mr) {
        const name = this.pageRef(v, void 0, `${where} ScreensaverEntityNaviToPage`, ec);
        if (name !== void 0) {
          e.push({ k, v: toNode(name), c: ec });
        } else {
          e.push({ c: ec });
        }
        continue;
      }
      if (!copy.has(k)) {
        c.push(this.todo(void 0, `${where} ${k}: ${show(v)} - no counterpart in the adapter`));
        continue;
      }
      let value = v;
      if (k === "ScreensaverEntity" && typeof v === "string") {
        const relay = /\.(Relay\.[12])$/.exec(v);
        if (mr && relay && this.isOwnState(v)) {
          value = relay[1];
        } else if (this.isOwnState(v)) {
          ec.push(
            this.todo(
              void 0,
              `${where}: ${show(v)} is a state the old script created itself - the adapter does not update it, choose another state`
            )
          );
        }
      }
      e.push({ k, v: toNode(value), c: ec });
    }
    return { v: { t: "obj", e }, c };
  }
  screensaverList(key, keepEmpty) {
    const v = this.ev.config[key];
    const list = Array.isArray(v) ? v : [];
    const entries = list.map((x, i) => this.screensaver(x, `${key}[${i}]`, false)).filter((x) => {
      var _a;
      return keepEmpty || ((_a = x.v) == null ? void 0 : _a.t) !== "lit";
    });
    return { k: key, v: { t: "arr", e: entries }, c: [] };
  }
  button(key, target) {
    const b = this.ev.config[key];
    const c = [];
    if (!isRecord(b) || b.mode == null) {
      return { k: target, v: { t: "lit", s: "null" }, c };
    }
    if (b.mode === "page") {
      const name = this.pageRef(b.page, void 0, `${key} page`, c);
      if (name !== void 0) {
        return { k: target, v: toNode({ mode: "page", page: name }), c };
      }
    } else if (b.mode === "toggle" && typeof b.entity === "string" && b.entity) {
      return { k: target, v: toNode({ mode: "switch", state: b.entity }), c };
    } else {
      c.push(
        this.todo(
          void 0,
          `${key} of the old script ${show({ mode: b.mode, entity: b.entity, setValue: b.setValue })} has no counterpart - configure the button in the admin`
        )
      );
    }
    return { k: target, v: { t: "lit", s: "null" }, c };
  }
  /**
   * the configuration object and the pages
   *
   * @param panelTopic topic of the target panel
   * @returns source text of the configuration part (inside `configuration()`)
   */
  body(panelTopic) {
    var _a;
    const cfg = this.ev.config;
    const pageTexts = this.order.map((p) => this.pageSource(p));
    const scriptPages = this.order.filter((p) => this.isScriptCard(p.page));
    const ref = (p) => ({ v: { t: "ref", s: p.varName }, c: [] });
    const e = [];
    const topicComments = [];
    if (typeof cfg.panelRecvTopic === "string") {
      topicComments.push(`// old script: panelRecvTopic ${quote(cfg.panelRecvTopic)}`);
    }
    e.push({ k: "panelTopic", v: toNode(panelTopic), c: topicComments });
    const weatherInstance = this.ev.vars.get("weatherAdapterInstance");
    const wc = [];
    if (typeof cfg.weatherEntity === "string") {
      wc.push(
        `// old script: weatherEntity ${quote(cfg.weatherEntity)} (alias of the old script, not needed any more)`
      );
    }
    let weather = "";
    if (typeof weatherInstance === "string" && weatherInstance) {
      weather = weatherInstance.endsWith(".") ? weatherInstance : `${weatherInstance}.`;
      if (!WEATHER_ADAPTERS.includes(weather.split(".")[0])) {
        wc.push(
          this.todo(
            void 0,
            `weather adapter ${quote(weather)} is not supported by the screensaver of the adapter (only ${WEATHER_ADAPTERS.join(", ")})`
          )
        );
      }
    } else {
      wc.push(
        this.todo(void 0, "no weatherAdapterInstance found in the old script - set the weather adapter")
      );
    }
    e.push({ k: "weatherEntity", v: toNode(weather), c: wc });
    e.push({ k: "weatherAddDefaultItems", v: toNode(false), c: [] });
    for (const k of ["defaultOffColor", "defaultOnColor", "defaultColor", "defaultBackgroundColor"]) {
      const n = toNode(cfg[k]);
      if (n && cfg[k] !== void 0) {
        e.push({ k, v: n, c: [] });
      }
    }
    e.push({
      k: "pages",
      v: { t: "arr", e: scriptPages.filter((p) => p.main).map(ref) },
      c: ["// Hauptseiten / Mainpages"]
    });
    e.push({
      k: "subPages",
      v: { t: "arr", e: scriptPages.filter((p) => !p.main).map(ref) },
      c: ["// Unterseiten / Subpages"]
    });
    e.push({ k: "favoritScreensaverEntity", v: { t: "arr", e: [] }, c: [] });
    e.push({ k: "alternateScreensaverEntity", v: { t: "arr", e: [] }, c: [] });
    e.push(this.screensaverList("leftScreensaverEntity", true));
    e.push(this.screensaverList("bottomScreensaverEntity", false));
    e.push(this.screensaverList("indicatorScreensaverEntity", true));
    for (const k of ["mrIcon1ScreensaverEntity", "mrIcon2ScreensaverEntity"]) {
      const r = this.screensaver(cfg[k], k, true);
      e.push({ k, v: (_a = r.v) != null ? _a : { t: "lit", s: "null" }, c: r.c });
    }
    e.push(this.button("button1", "buttonLeft"));
    e.push(this.button("button2", "buttonRight"));
    for (const [k, v] of Object.entries(cfg)) {
      if (!CONFIG_KNOWN.has(k) && v !== void 0) {
        e.push({ c: [this.todo(void 0, `${k}: ${show(v)} - no counterpart in the adapter`)] });
      }
    }
    const lines = [];
    lines.push("    const overrideConfig: Partial<ScriptConfig.Config> = {");
    lines.push(
      "        // hier k\xF6nnen Werte von unten \xFCberschrieben werden / values from below can be overridden here"
    );
    lines.push("    };");
    lines.push("");
    for (const t of pageTexts) {
      lines.push(t, "");
    }
    lines.push(`    const config: ScriptConfig.Config = ${render({ t: "obj", e }, "    ")};`);
    lines.push("");
    return lines.join("\n");
  }
  get scriptPageNames() {
    return this.order.filter((p) => this.isScriptCard(p.page)).map((p) => p.uniqueName);
  }
  get todoPageNames() {
    return this.order.filter((p) => !this.isScriptCard(p.page)).map((p) => p.uniqueName);
  }
}
function convertNsPanelTs(input) {
  var _a, _b, _c;
  const result = { todos: [], pages: [], todoPages: [], discarded: [], errors: [] };
  const info = inspectNsPanelTs(input.source);
  result.version = info.version;
  if (!info.isNsPanelTs) {
    result.errors.push("the script is no NSPanelTs script");
    return result;
  }
  if (!info.supported) {
    result.errors.push(
      info.reason === "noVersion" ? "no scriptVersion found in the script" : info.reason === "noConfig" ? "no `config` object found in the script" : `script version ${(_a = info.version) != null ? _a : "?"} is not supported (supported: ${NSPANELTS_MIN_VERSION} \u2026 ${NSPANELTS_MAX_VERSION}.x)`
    );
    return result;
  }
  const tokenAt = input.template.indexOf(input.endToken);
  const commentAt = tokenAt === -1 ? -1 : input.template.lastIndexOf("/**", tokenAt);
  if (commentAt === -1) {
    result.errors.push("the END STOP block was not found in the template");
    return result;
  }
  let ev;
  try {
    ev = evaluate(input.source);
  } catch (e) {
    result.errors.push(
      `the configuration part of the script cannot be evaluated: ${e instanceof Error ? e.message : String(e)}`
    );
    return result;
  }
  const conv = new Converter(ev);
  conv.collectPages();
  let body;
  try {
    body = conv.body(input.panelTopic);
  } catch (e) {
    result.errors.push(`conversion failed: ${e instanceof Error ? e.message : String(e)}`);
    return result;
  }
  result.todos = conv.todos;
  result.pages = conv.scriptPageNames;
  result.todoPages = conv.todoPageNames;
  result.discarded = conv.discarded;
  result.errors.push(...conv.errors);
  const header = [
    "/*",
    ` * Converted by ${input.namespace} on ${input.today} from the NSPanelTs script ${input.sourceScriptId} (${(_b = info.version) != null ? _b : "?"}).`,
    ` * ${result.todos.length} TODO(s): search for "TODO" - these settings could not be taken over 1:1.`,
    ` * Stop the old script ${input.sourceScriptId} before you activate this script!`,
    " *",
    ` * Umgewandelt von ${input.namespace} am ${input.today} aus dem NSPanelTs-Skript ${input.sourceScriptId} (${(_c = info.version) != null ? _c : "?"}).`,
    ` * ${result.todos.length} TODO(s): nach "TODO" suchen - diese Einstellungen lie\xDFen sich nicht 1:1 \xFCbernehmen.`,
    ` * Das alte Skript ${input.sourceScriptId} vor dem Aktivieren dieses Skripts stoppen!`,
    " */",
    ""
  ].join("\n");
  const tail = input.template.slice(commentAt).replace(
    /await sendToAsync\('nspanel-lovelace-ui\.0', 'ScriptConfig',/,
    `await sendToAsync('${input.namespace}', 'ScriptConfig',`
  );
  result.scriptSource = `${header}async function configuration (): Promise<void> {
${body}
    ${tail}`;
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  NSPANELTS_MAX_VERSION,
  NSPANELTS_MIN_VERSION,
  NSPANELTS_SERVICE_PAGES,
  convertNsPanelTs,
  inspectNsPanelTs,
  isSupportedNsPanelTsVersion,
  stripTypes,
  topicFromMqttState
});
//# sourceMappingURL=nspanelts-import.js.map
