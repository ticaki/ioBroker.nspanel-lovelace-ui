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
var pageChartPie_exports = {};
__export(pageChartPie_exports, {
  PCHART_OTHER_KEY: () => PCHART_OTHER_KEY,
  PageChartPie: () => PageChartPie,
  buildPChartPageConfig: () => buildPChartPageConfig,
  isPChartDetailsExternal: () => isPChartDetailsExternal
});
module.exports = __toCommonJS(pageChartPie_exports);
var import_tools = require("../const/tools");
var import_adminShareConfig = require("../types/adminShareConfig");
var import_pageChart = require("./pageChart");
var import_pie_scale = require("./pie-scale");
const PCHART_OTHER_KEY = "pchart_other";
const PIE_DB_REFRESH_INTERVAL = 5 * 6e4;
function buildPChartPageConfig(entry) {
  var _a, _b, _c;
  const d = import_adminShareConfig.pchartDefaults;
  const scriptSource = entry.selInstanceDataSource === import_adminShareConfig.PCHART_SOURCE_SCRIPT;
  const rangeKey = (0, import_adminShareConfig.isPChartRangeKey)(entry.rangeKey) ? entry.rangeKey : "current";
  let dbData;
  if (!scriptSource && rangeKey !== "current") {
    dbData = { instance: entry.selInstance || "", rangeKey };
    if (rangeKey === "custom") {
      dbData.hours = entry.rangeHours && entry.rangeHours > 0 ? entry.rangeHours : 1;
    }
  }
  let slices;
  if (!scriptSource) {
    slices = [];
    ((_a = entry.slots) != null ? _a : []).forEach((slot, index) => {
      if (!slot || !slot.state || slices.length >= import_adminShareConfig.PCHART_MAX_SLICES) {
        return;
      }
      slices.push({
        name: slot.name ? { type: "const", constVal: slot.name } : void 0,
        value: dbData ? { type: "state", dp: slot.state } : { type: "triggered", dp: slot.state },
        unit: slot.unit ? { type: "const", constVal: slot.unit } : void 0,
        color: { type: "const", constVal: slot.color || d.slotColors[index % d.slotColors.length] }
      });
    });
  }
  return {
    card: "cardPChart",
    data: {
      headline: { type: "const", constVal: entry.headline || "Page PChart" },
      legendMode: { type: "const", constVal: (0, import_pie_scale.pieLegendMode)((_b = entry.legendMode) != null ? _b : d.legendMode) },
      decimals: { type: "const", constVal: (_c = entry.decimals) != null ? _c : d.decimals },
      value: scriptSource ? { type: "triggered", dp: entry.setStateForValues || "" } : void 0,
      slices,
      dbData: dbData ? { type: "const", constVal: JSON.stringify(dbData) } : void 0
    }
  };
}
class PageChartPie extends import_pageChart.PageChart {
  pieItems;
  /** set when the slot values are averaged over a range */
  pieDetails;
  /** true = the page reads the finished text of the script data point */
  scriptSource = false;
  /** name and unit of the slot states (`common.name` / `common.unit`), read once per state */
  sliceMeta = /* @__PURE__ */ new Map();
  /** states (or the instance) a warning was logged for - logged once until a value arrives again */
  warned = /* @__PURE__ */ new Set();
  constructor(config, options) {
    super(config, options);
  }
  async init() {
    var _a, _b;
    const config = structuredClone(this.config);
    this.scriptSource = !!(config && config.card === "cardPChart" && config.data.value);
    const tempItem = await this.basePanel.statesControler.createDataItems(config, this);
    if (tempItem) {
      tempItem.card = "cardPChart";
      this.log.debug(`init Card: ${this.card}`);
    }
    this.pieItems = tempItem;
    const dbData = (_b = (_a = this.pieItems) == null ? void 0 : _a.data) == null ? void 0 : _b.dbData;
    if (dbData) {
      const details = await dbData.getObject();
      if (isPChartDetailsExternal(details)) {
        this.pieDetails = details;
        this.refreshInterval = PIE_DB_REFRESH_INTERVAL;
      }
    }
    await super.init();
  }
  async getUpdateMessage() {
    var _a, _b, _c;
    const message = {
      navigation: this.getNavigation(),
      headline: this.name,
      // field 14 is not read by the panel for this card
      color: "",
      text: String((0, import_pie_scale.pieLegendMode)(import_adminShareConfig.pchartDefaults.legendMode)),
      ticks: [],
      value: ""
    };
    const data = (_a = this.pieItems) == null ? void 0 : _a.data;
    if (!data) {
      return message;
    }
    message.headline = (_b = data.headline && await data.headline.getTranslatedString()) != null ? _b : this.name;
    message.text = String((0, import_pie_scale.pieLegendMode)((_c = data.legendMode && await data.legendMode.getNumber()) != null ? _c : null));
    message.value = (0, import_pie_scale.pieSlicesToPayload)((0, import_pie_scale.finishPieSlices)(await this.getPieSlices()));
    return message;
  }
  /**
   * The slices in legend order with their unscaled numbers. Script source: the parsed text of the
   * data point, more than six entries are summed up as "Other". Slot source: one slice per configured
   * state, current value or average over the range; a slot without a value shows 0.
   */
  async getPieSlices() {
    var _a, _b, _c, _d, _e, _f;
    const data = (_a = this.pieItems) == null ? void 0 : _a.data;
    if (!data) {
      return [];
    }
    const otherName = this.library.getTranslation(PCHART_OTHER_KEY);
    if (this.scriptSource) {
      const text = data.value ? await data.value.getString() : null;
      return (0, import_pie_scale.parsePieScriptString)(text, otherName);
    }
    const decimals = (_b = data.decimals && await data.decimals.getNumber()) != null ? _b : import_adminShareConfig.pchartDefaults.decimals;
    const dbAlive = this.pieDetails ? await this.isDbAlive(this.pieDetails.instance) : false;
    const result = [];
    for (const slice of (_c = data.slices) != null ? _c : []) {
      if (!slice || !slice.value) {
        continue;
      }
      const meta = await this.getSliceMeta(slice.value);
      const name = slice.name && await slice.name.getTranslatedString() || meta.name;
      const unit = (_d = slice.unit && await slice.unit.getString()) != null ? _d : meta.unit;
      const color = (_e = slice.color && await slice.color.getRGBDec()) != null ? _e : (0, import_pie_scale.pieColorToDec)(void 0);
      const value = this.pieDetails ? await this.getSliceAverage(slice.value, this.pieDetails, dbAlive) : (_f = await slice.value.getNumber()) != null ? _f : 0;
      result.push({ name, value, text: (0, import_pie_scale.formatPieValueText)(value, decimals, unit), color });
    }
    return (0, import_pie_scale.mergePieRest)(result, otherName);
  }
  /**
   * Average of a slot state over the configured range via getHistory: the window comes from
   * resolveRange (rolling ranges end now, calendar ranges have a fixed start and end). Without a usable
   * value (instance not alive, no rows, timeout) the slice shows 0 and a warning is logged once for that state.
   *
   * @param item value item of the slice (its dp is queried)
   * @param details DB instance and range
   * @param dbAlive result of the alive check of this refresh
   */
  async getSliceAverage(item, details, dbAlive) {
    const dp = dpOf(item);
    if (!dp || !dbAlive) {
      return 0;
    }
    try {
      const { start, end } = (0, import_adminShareConfig.resolveRange)(details.rangeKey, Date.now(), details.hours);
      const rows = await this.getDataFromDBWindow(dp, start, end, details.instance, {
        aggregate: "average",
        count: 1,
        removeBorderValues: true,
        round: 6
      });
      const values = (rows != null ? rows : []).map((row) => row && typeof row === "object" && "val" in row ? Number(row.val) : NaN).filter((v) => Number.isFinite(v));
      if (values.length > 0) {
        this.warned.delete(dp);
        return values.reduce((a, b) => a + b, 0) / values.length;
      }
      this.warnOnce(dp, `PageChartPie: ${this.name} - no history value for ${dp} in ${details.instance}`);
    } catch (error) {
      this.warnOnce(dp, `PageChartPie: ${this.name} - history of ${dp} failed: ${String(error)}`);
    }
    return 0;
  }
  /**
   * True if the DB instance runs; logs once if not (the slots then show 0 instead of an error page).
   *
   * @param instance `influxdb.0` or `system.adapter.influxdb.0`
   */
  async isDbAlive(instance) {
    if (!instance) {
      this.warnOnce("instance", `PageChartPie: ${this.name} - a range is set but no DB instance`);
      return false;
    }
    const instanceId = instance.startsWith("system.adapter.") ? instance : `system.adapter.${instance}`;
    const alive = await this.adapter.getForeignStateAsync(`${instanceId}.alive`);
    if (!alive || !alive.val) {
      this.warnOnce("instance", `PageChartPie: ${this.name} - DB instance ${instance} is not alive`);
      return false;
    }
    this.warned.delete("instance");
    return true;
  }
  warnOnce(key, text) {
    if (this.warned.has(key)) {
      return;
    }
    this.warned.add(key);
    this.log.warn(text);
  }
  /**
   * `common.name` (in the adapter language, translated) and `common.unit` of the state behind a value item.
   *
   * @param item value item of the slice
   */
  async getSliceMeta(item) {
    const dp = dpOf(item);
    const cached = this.sliceMeta.get(dp);
    if (cached) {
      return cached;
    }
    const meta = { name: "", unit: "" };
    if (dp) {
      const obj = await this.adapter.getForeignObjectAsync(dp);
      if (obj && obj.common) {
        const name = obj.common.name ? (0, import_tools.getStringFromStringOrTranslated)(this.adapter, obj.common.name) : "";
        meta.name = name ? this.library.getTranslation(name) : "";
        meta.unit = typeof obj.common.unit === "string" ? obj.common.unit : "";
      }
      this.sliceMeta.set(dp, meta);
    }
    return meta;
  }
}
function dpOf(item) {
  return "dp" in item.options && typeof item.options.dp === "string" ? item.options.dp : "";
}
function isPChartDetailsExternal(obj) {
  if (!obj || typeof obj !== "object") {
    return false;
  }
  const o = obj;
  return typeof o.instance === "string" && (0, import_adminShareConfig.isPChartRangeKey)(o.rangeKey) && o.rangeKey !== "current" && (o.hours === void 0 || typeof o.hours === "number");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PCHART_OTHER_KEY,
  PageChartPie,
  buildPChartPageConfig,
  isPChartDetailsExternal
});
//# sourceMappingURL=pageChartPie.js.map
