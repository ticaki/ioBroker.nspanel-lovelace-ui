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
var admin_exports = {};
__export(admin_exports, {
  AdminConfiguration: () => AdminConfiguration
});
module.exports = __toCommonJS(admin_exports);
var import_library = require("../controller/library");
var ShareConfig = __toESM(require("../types/adminShareConfig"));
var import_function_and_const = require("../types/function-and-const");
function shallowDescribe(value) {
  if (value === null) {
    return "null";
  }
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  if (typeof value === "object") {
    const obj = value;
    const keys = Object.keys(obj);
    const entries = keys.map((k) => {
      const v = obj[k];
      if (Array.isArray(v)) {
        return `${k}: Array(${v.length})`;
      }
      if (v !== null && typeof v === "object") {
        return `${k}: {${Object.keys(v).join(", ")}}`;
      }
      return `${k}: ${JSON.stringify(v)}`;
    });
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(value);
}
class AdminConfiguration extends import_library.BaseClass {
  pageConfig = [];
  constructor(adapter) {
    super(adapter, "AdminConfiguration");
    this.adapter = adapter;
    this.pageConfig = this.adapter.config.pageConfig || [];
  }
  /**
   * Process configurable pages from adapter config and build navigation entries.
   * Orchestrates page creation (phase 1) and deferred navigation chain resolution (phase 2).
   *
   * @param option - Panel configuration partial containing pages and navigation arrays
   */
  async processentrys(option) {
    var _a, _b;
    try {
      const pendingNavs = await this.createPagesFromConfig(option);
      this.applyPendingNavigations(option, pendingNavs);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? (_a = error.stack) != null ? _a : "no stack" : "no stack";
      this.log.error(
        `[processentrys] Failed to process panel "${(_b = option.name) != null ? _b : shallowDescribe(option)}": ${msg}
Option: ${shallowDescribe(option)}
Stack: ${stack}`
      );
    }
    return option;
  }
  /**
   * Phase 1: create all pages from admin config, push stub navigation entries, and collect
   * pending prev/next chain assignments for deferred resolution.
   * home/parent links are applied immediately since they carry no chain dependency.
   *
   * @param option - Panel configuration partial
   */
  async createPagesFromConfig(option) {
    var _a, _b;
    const entries = this.pageConfig;
    const pendingNavs = [];
    for (const entry of entries) {
      if (!entry.navigationAssignment || !entry.card) {
        continue;
      }
      const allPanelsAssignment = entry.navigationAssignment.find(
        (a) => a.topic === ShareConfig.ALL_PANELS_SPECIAL_ID
      );
      const panelAssignment = entry.navigationAssignment.find((a) => a.topic === option.topic);
      let navAssign;
      if (panelAssignment) {
        if (!panelAssignment.navigation && allPanelsAssignment) {
          continue;
        }
        navAssign = panelAssignment;
      } else if (allPanelsAssignment) {
        navAssign = allPanelsAssignment;
      } else {
        continue;
      }
      let newPage;
      switch (entry.card) {
        case "cardAlarm": {
          if (!isAlwaysOnMode(entry.alwaysOn)) {
            entry.alwaysOn = "none";
          }
          newPage = {
            uniqueID: entry.uniqueName,
            hidden: !!entry.hidden,
            alwaysOn: entry.alwaysOn,
            dpInit: "",
            config: {
              card: "cardAlarm",
              data: {
                alarmType: { type: "const", constVal: entry.alarmType || "unlock" },
                headline: { type: "const", constVal: entry.headline || "Unlock" },
                button1: entry.button1 ? { type: "const", constVal: entry.button1 } : void 0,
                button2: entry.button2 ? { type: "const", constVal: entry.button2 } : void 0,
                button3: entry.button3 ? { type: "const", constVal: entry.button3 } : void 0,
                button4: entry.button4 ? { type: "const", constVal: entry.button4 } : void 0,
                button5: entry.button1 ? { type: "const", constVal: entry.button5 } : void 0,
                button6: entry.button2 ? { type: "const", constVal: entry.button6 } : void 0,
                button7: entry.button3 ? { type: "const", constVal: entry.button7 } : void 0,
                button8: entry.button4 ? { type: "const", constVal: entry.button8 } : void 0,
                pin: entry.pin != null ? { type: "const", constVal: String(entry.pin) } : void 0,
                approved: { type: "const", constVal: !!entry.approved },
                global: { type: "const", constVal: !!entry.global },
                setNavi: entry.setNavi ? { type: "const", constVal: entry.setNavi } : void 0
              }
            },
            pageItems: []
          };
          break;
        }
        case "cardQR": {
          if (!isAlwaysOnMode(entry.alwaysOn)) {
            entry.alwaysOn = "none";
          }
          newPage = {
            uniqueID: entry.uniqueName,
            hidden: !!entry.hidden,
            alwaysOn: entry.alwaysOn,
            dpInit: "",
            config: {
              card: "cardQR",
              data: {
                headline: { type: "const", constVal: entry.headline || "Page QR" },
                selType: { type: "const", constVal: entry.selType || 0 },
                ssidUrlTel: { type: "const", constVal: entry.ssidUrlTel || "" },
                wlantype: { type: "const", constVal: entry.wlantype || "WPA" },
                wlanhidden: { type: "const", constVal: !!entry.wlanhidden || false },
                password: { type: "const", constVal: entry.qrPass || "" },
                pwdhidden: { type: "const", constVal: !!entry.pwdhidden || false },
                setState: entry.setState ? { type: "triggered", dp: entry.setState } : void 0
              }
            },
            pageItems: []
          };
          break;
        }
        case "cardTrash": {
          if (!isAlwaysOnMode(entry.alwaysOn)) {
            entry.alwaysOn = "none";
          }
          newPage = dataForcardTrash(entry);
          this.log.debug(`Generated trash 1page for '${entry.uniqueName}'`);
          break;
        }
        case "cardPower": {
          if (!isAlwaysOnMode(entry.alwaysOn)) {
            entry.alwaysOn = "none";
          }
          newPage = dataForCardPower(entry, this.adapter);
          this.log.debug(`Generated cardPower page for '${entry.uniqueName}'`);
          break;
        }
        case "cardGrid":
        case "cardGrid2":
        case "cardGrid3": {
          if (!isAlwaysOnMode(entry.alwaysOn)) {
            entry.alwaysOn = "none";
          }
          newPage = {
            uniqueID: entry.uniqueName,
            hidden: !!entry.hidden,
            alwaysOn: entry.alwaysOn,
            dpInit: "",
            config: {
              card: entry.card,
              scrollPresentation: entry.scrollPresentation || "classic",
              data: {
                headline: { type: "const", constVal: entry.headline || entry.uniqueName }
              }
            },
            pageItems: []
          };
          if (entry.pageItems) {
            let start = false;
            for (let index = entry.pageItems.length - 1; index >= 0; index--) {
              let item = entry.pageItems[index];
              if (!item && !start) {
                continue;
              }
              start = true;
              if (!item) {
                item = { channelId: ShareConfig.emptyChannelValueConfig("empty") };
              } else {
                item = { ...item, channelId: ShareConfig.normalizeChannelId(item.channelId) };
              }
              const result = await this.adapter.convertAdminPageItemToPageItemConfig(
                item,
                { card: entry.card, uniqueName: entry.uniqueName },
                []
              );
              if (!result.error && result.pageItem) {
                newPage.pageItems = (_a = newPage.pageItems) != null ? _a : [];
                newPage.pageItems.unshift(result.pageItem);
              } else if (result.error) {
                this.log.warn(
                  `Error processing1 page item ${index} for page '${entry.uniqueName}': ${result.error}`
                );
              }
            }
          }
          break;
        }
        case "cardEntities":
        case "cardSchedule": {
          if (!isAlwaysOnMode(entry.alwaysOn)) {
            entry.alwaysOn = "none";
          }
          newPage = {
            uniqueID: entry.uniqueName,
            hidden: !!entry.hidden,
            alwaysOn: entry.alwaysOn,
            dpInit: "",
            config: {
              card: entry.card,
              data: {
                headline: { type: "const", constVal: entry.headline || entry.uniqueName }
              }
            },
            pageItems: []
          };
          if (entry.pageItems) {
            let start = false;
            for (let index = entry.pageItems.length - 1; index >= 0; index--) {
              let item = entry.pageItems[index];
              if (!item && !start) {
                continue;
              }
              start = true;
              if (!item) {
                item = { channelId: ShareConfig.emptyChannelValueConfig("empty") };
              } else {
                item = { ...item, channelId: ShareConfig.normalizeChannelId(item.channelId) };
              }
              const result = await this.adapter.convertAdminPageItemToPageItemConfig(
                item,
                { card: entry.card, uniqueName: entry.uniqueName },
                []
              );
              if (!result.error && result.pageItem) {
                newPage.pageItems = (_b = newPage.pageItems) != null ? _b : [];
                newPage.pageItems.unshift(result.pageItem);
              } else if (result.error) {
                this.log.warn(
                  `Error processing page item ${index} for page '${entry.uniqueName}': ${result.error}`
                );
              }
            }
          }
          break;
        }
        default: {
          this.log.warn(`Unsupported card type '${entry.card}' for page '${entry.uniqueName}', skipping!`);
          continue;
        }
      }
      if (!this.adapter.config.adminOverridesScriptPages) {
        if (option.pages.find((a) => a.uniqueID === newPage.uniqueID)) {
          this.log.warn(`Page with name ${newPage.uniqueID} already exists, skipping!`);
          continue;
        }
      } else {
        option.pages = option.pages.filter((a) => a.uniqueID !== newPage.uniqueID);
        option.navigation = option.navigation.filter(
          (b) => b && b.name !== newPage.uniqueID
        );
        option.navigation.forEach((b) => {
          var _a2, _b2;
          if (b) {
            if (this.pageConfig.find((e) => e.uniqueName === b.name)) {
            } else {
              if (((_a2 = b.left) == null ? void 0 : _a2.single) === newPage.uniqueID) {
                b.left.single = void 0;
              }
              if (((_b2 = b.right) == null ? void 0 : _b2.single) === newPage.uniqueID) {
                b.right.single = void 0;
              }
            }
          }
        });
      }
      option.pages.push(newPage);
      const navigationEntry = {
        name: newPage.uniqueID,
        page: newPage.uniqueID,
        right: { single: void 0, double: void 0 },
        left: { single: void 0, double: void 0 }
      };
      option.navigation.push(navigationEntry);
      const navigation = navAssign.navigation;
      if (!navigation) {
        continue;
      }
      const nav = { ...navigation };
      if (!nav.prev && !nav.next && !nav.home && !nav.parent) {
        nav.home = "main";
      }
      if (nav.home) {
        navigationEntry.right.double = nav.home;
      }
      if (nav.parent) {
        navigationEntry.left.double = nav.parent;
      }
      if (nav.prev !== void 0 || nav.next !== void 0) {
        pendingNavs.push({
          pageId: newPage.uniqueID,
          prev: nav.prev,
          next: nav.next
        });
      }
    }
    return pendingNavs;
  }
  /**
   * Phase 2: wire prev/next navigation by building full chains and splicing
   * them into the existing navigation, preserving existing connections.
   *
   * Algorithm:
   * 1. Apply each page's own left/right pointers from its explicit prev/next.
   * 2. Group all pages by their declared `prev` target.
   * 3. Find root insertion points (prevTarget is NOT a pending page) and build
   *    full chains by recursively following sub-groups.
   * 4. Splice each full chain after its prevTarget: if prevTarget had an existing
   *    right pointer, it is moved to the end of the chain (preserving the topology).
   * 5. Handle remaining groups (prevTarget is a pending page not reached from any root).
   * 6. For pages that only declare `next` (no prev), splice before next target,
   *    inheriting the target's old left pointer.
   *
   * @param option - Panel configuration partial
   * @param pendingNavs - Pending navigation entries collected in phase 1
   */
  applyPendingNavigations(option, pendingNavs) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    if (!pendingNavs.length) {
      return;
    }
    const pendingMap = /* @__PURE__ */ new Map();
    for (const p of pendingNavs) {
      pendingMap.set(p.pageId, p);
    }
    for (const pending of pendingNavs) {
      const pageEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.pageId);
      if (!pageEntry) {
        continue;
      }
      if (pending.prev !== void 0) {
        pageEntry.left = { ...(_a = pageEntry.left) != null ? _a : {}, single: pending.prev };
      }
      if (pending.next !== void 0) {
        pageEntry.right = { ...(_b = pageEntry.right) != null ? _b : {}, single: pending.next };
      }
    }
    const byPrev = /* @__PURE__ */ new Map();
    for (const pending of pendingNavs) {
      if (pending.prev !== void 0) {
        const list = (_c = byPrev.get(pending.prev)) != null ? _c : [];
        list.push(pending.pageId);
        byPrev.set(pending.prev, list);
      }
    }
    const processedGroups = /* @__PURE__ */ new Set();
    for (const [prevTarget] of byPrev) {
      if (pendingMap.has(prevTarget)) {
        continue;
      }
      const fullChain = this.buildFullChain(prevTarget, byPrev, pendingMap, processedGroups);
      if (fullChain.length) {
        this.spliceChainAfter(prevTarget, fullChain, pendingMap, option);
      }
    }
    for (const [prevTarget] of byPrev) {
      if (processedGroups.has(prevTarget)) {
        continue;
      }
      const fullChain = this.buildFullChain(prevTarget, byPrev, pendingMap, processedGroups);
      if (fullChain.length) {
        this.spliceChainAfter(prevTarget, fullChain, pendingMap, option);
      }
    }
    for (const pending of pendingNavs) {
      if (pending.next === void 0 || pending.prev !== void 0) {
        continue;
      }
      const nextEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.next);
      if (!nextEntry) {
        continue;
      }
      const pageEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.pageId);
      if (!pageEntry) {
        continue;
      }
      const oldLeft = (_d = nextEntry.left) == null ? void 0 : _d.single;
      nextEntry.left = { ...(_e = nextEntry.left) != null ? _e : {}, single: pending.pageId };
      if (oldLeft !== void 0 && oldLeft !== pending.pageId && !((_f = pageEntry.left) == null ? void 0 : _f.single)) {
        pageEntry.left = { ...(_g = pageEntry.left) != null ? _g : {}, single: oldLeft };
        const oldLeftEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === oldLeft);
        if (((_h = oldLeftEntry == null ? void 0 : oldLeftEntry.right) == null ? void 0 : _h.single) === pending.next) {
          oldLeftEntry.right = { ...(_i = oldLeftEntry.right) != null ? _i : {}, single: pending.pageId };
        }
      }
    }
    for (const pending of pendingNavs) {
      if (pending.prev !== void 0 && !option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.prev)) {
        this.log.warn(`Navigation unresolved for '${pending.pageId}': prev page '${pending.prev}' not found.`);
      }
      if (pending.next !== void 0 && !option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.next)) {
        this.log.warn(`Navigation unresolved for '${pending.pageId}': next page '${pending.next}' not found.`);
      }
    }
  }
  /**
   * Splice a chain of pages after prevTarget, preserving existing connections.
   * If prevTarget.right was already set, the old target is moved to the end
   * of the chain (provided the last element has no explicit next declaration).
   *
   * @param prevTarget - Name of the page to insert after
   * @param fullChain - Ordered list of page IDs to insert
   * @param pendingMap - Lookup map from pageId to PendingNavEntry
   * @param option - Panel configuration partial
   */
  spliceChainAfter(prevTarget, fullChain, pendingMap, option) {
    var _a, _b, _c, _d, _e, _f, _g;
    const prevEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === prevTarget);
    const oldRight = (_a = prevEntry == null ? void 0 : prevEntry.right) == null ? void 0 : _a.single;
    if (prevEntry) {
      prevEntry.right = { ...(_b = prevEntry.right) != null ? _b : {}, single: fullChain[0] };
    }
    const firstEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === fullChain[0]);
    if (firstEntry) {
      firstEntry.left = { ...(_c = firstEntry.left) != null ? _c : {}, single: prevTarget };
    }
    for (let i = 1; i < fullChain.length; i++) {
      const curr = option.navigation.find((b) => (b == null ? void 0 : b.name) === fullChain[i]);
      const prev = option.navigation.find((b) => (b == null ? void 0 : b.name) === fullChain[i - 1]);
      if (curr) {
        curr.left = { ...(_d = curr.left) != null ? _d : {}, single: fullChain[i - 1] };
      }
      if (prev) {
        const prevPending = pendingMap.get(fullChain[i - 1]);
        const hasExternalNext = (prevPending == null ? void 0 : prevPending.next) !== void 0 && prevPending.next !== fullChain[i];
        if (!hasExternalNext) {
          prev.right = { ...(_e = prev.right) != null ? _e : {}, single: fullChain[i] };
        }
      }
    }
    if (oldRight !== void 0 && !fullChain.includes(oldRight)) {
      const lastId = fullChain[fullChain.length - 1];
      const lastPending = pendingMap.get(lastId);
      const lastEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === lastId);
      if (lastEntry && !(lastPending == null ? void 0 : lastPending.next)) {
        lastEntry.right = { ...(_f = lastEntry.right) != null ? _f : {}, single: oldRight };
        const oldRightEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === oldRight);
        if (oldRightEntry) {
          oldRightEntry.left = { ...(_g = oldRightEntry.left) != null ? _g : {}, single: lastId };
        }
      }
    }
  }
  /**
   * Recursively build a complete chain starting from pages grouped by prevTarget,
   * following sub-groups where a chain member is itself the prevTarget of another group.
   *
   * @param prevTarget - The prevTarget whose group to process
   * @param byPrev - Mapping from prevTarget to list of page IDs
   * @param pendingMap - Lookup map from pageId to PendingNavEntry
   * @param processedGroups - Set of already processed prevTargets (prevents cycles)
   */
  buildFullChain(prevTarget, byPrev, pendingMap, processedGroups) {
    const pageIds = byPrev.get(prevTarget);
    if (!pageIds || processedGroups.has(prevTarget)) {
      return [];
    }
    processedGroups.add(prevTarget);
    const groupChain = this.buildChainFromGroup(pageIds, pendingMap);
    const result = [];
    for (const pageId of groupChain) {
      result.push(pageId);
      if (byPrev.has(pageId) && !processedGroups.has(pageId)) {
        const subChain = this.buildFullChain(pageId, byPrev, pendingMap, processedGroups);
        result.push(...subChain);
      }
    }
    return result;
  }
  /**
   * Build an ordered chain from a group of pages that share the same `prev` target.
   * Pages connected via intra-group `next` pointers are ordered first;
   * remaining pages are appended in their original definition order.
   *
   * @param pageIds - Page IDs in the group (definition order)
   * @param pendingMap - Lookup map from pageId to PendingNavEntry
   */
  buildChainFromGroup(pageIds, pendingMap) {
    const pageSet = new Set(pageIds);
    const nextInGroup = /* @__PURE__ */ new Map();
    for (const id of pageIds) {
      const p = pendingMap.get(id);
      if ((p == null ? void 0 : p.next) !== void 0 && pageSet.has(p.next)) {
        nextInGroup.set(id, p.next);
      }
    }
    const hasIncoming = new Set(nextInGroup.values());
    const starts = pageIds.filter((id) => !hasIncoming.has(id));
    const result = [];
    const visited = /* @__PURE__ */ new Set();
    for (const start of starts) {
      let curr = start;
      while (curr !== void 0 && pageSet.has(curr) && !visited.has(curr)) {
        visited.add(curr);
        result.push(curr);
        curr = nextInGroup.get(curr);
      }
    }
    for (const id of pageIds) {
      if (!visited.has(id)) {
        result.push(id);
      }
    }
    return result;
  }
}
function isAlwaysOnMode(F) {
  const R = F;
  switch (R) {
    case "always":
    case "none":
    case "ignore":
    case "action":
      return true;
    default:
      (0, import_function_and_const.exhaustiveCheck)(R);
      return false;
  }
}
function mapPowerTargetUnit(unit) {
  switch (unit) {
    case "kW":
      return 1;
    case "MW":
      return 2;
    case "W":
      return 0;
    default:
      return void 0;
  }
}
function buildPowerSlotData(slot) {
  var _a, _b, _c;
  const s = slot != null ? slot : {};
  const stateId = (s.state || "").trim();
  const useColorScale = !!s.useColorScale;
  const iconColor = useColorScale ? "" : s.iconColor || "";
  const unitSuffix = s.valueUnit ? ` ${s.valueUnit}` : "";
  const icon = {
    true: {
      value: { type: "const", constVal: s.icon || "" },
      color: { type: "const", constVal: iconColor }
    },
    false: void 0
  };
  if (useColorScale && typeof s.minColorScale === "number" && typeof s.maxColorScale === "number") {
    icon.scale = {
      type: "const",
      constVal: {
        val_min: s.minColorScale,
        val_max: s.maxColorScale,
        val_best: typeof s.bestColorScale === "number" ? s.bestColorScale : s.minColorScale,
        mode: "triGrad"
      }
    };
  }
  const value = stateId ? {
    value: { type: "triggered", dp: stateId },
    decimal: { type: "const", constVal: (_a = s.valueDecimal) != null ? _a : 0 },
    unit: { type: "const", constVal: unitSuffix }
  } : void 0;
  const speed = stateId ? {
    value: { type: "triggered", dp: stateId },
    minScale: { type: "const", constVal: (_b = s.minSpeedScale) != null ? _b : 0 },
    maxScale: { type: "const", constVal: (_c = s.maxSpeedScale) != null ? _c : 1e4 },
    negate: { type: "const", constVal: !!s.reverse }
  } : void 0;
  const targetUnit = mapPowerTargetUnit(s.valueUnit);
  return {
    icon,
    value,
    speed,
    text: { true: { type: "const", constVal: s.entityHeadline || "" } },
    targetUnit: targetUnit ? { type: "const", constVal: targetUnit } : void 0
  };
}
function dataForCardPower(entry, adapter) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B;
  const cfg = adapter.config || {};
  if (!Array.isArray(cfg.pagePowerdata)) {
    cfg.pagePowerdata = [];
  }
  const slotMap = [
    [1, entry.leftTop],
    [2, entry.leftMiddle],
    [3, entry.leftBottom],
    [4, entry.rightTop],
    [5, entry.rightMiddle],
    [6, entry.rightBottom]
  ];
  const synth = {
    pageName: entry.uniqueName,
    headline: entry.headline || "",
    alwaysOnDisplay: entry.alwaysOn === "always",
    hiddenByTrigger: !!entry.hidden,
    power7_state: ((_a = entry.homeTop) == null ? void 0 : _a.state) || "",
    power7_valueDecimal: (_c = (_b = entry.homeTop) == null ? void 0 : _b.valueDecimal) != null ? _c : 0,
    power7_valueUnit: ((_d = entry.homeTop) == null ? void 0 : _d.valueUnit) || "W",
    power8_state: ((_e = entry.homeBot) == null ? void 0 : _e.state) || "",
    power8_valueDecimal: (_g = (_f = entry.homeBot) == null ? void 0 : _f.valueDecimal) != null ? _g : 0,
    power8_valueUnit: ((_h = entry.homeBot) == null ? void 0 : _h.valueUnit) || "W",
    power8_selInternalCalculation: !!((_i = entry.homeBot) == null ? void 0 : _i.selInternalCalculation),
    power8_selPowerSupply: Array.isArray((_j = entry.homeBot) == null ? void 0 : _j.selPowerSupply) ? entry.homeBot.selPowerSupply : []
  };
  for (const [i, s] of slotMap) {
    const cur = s != null ? s : {};
    synth[`power${i}_state`] = cur.state || "";
    synth[`power${i}_icon`] = cur.icon || "";
    synth[`power${i}_iconColor`] = cur.iconColor || "";
    synth[`power${i}_valueDecimal`] = (_k = cur.valueDecimal) != null ? _k : 0;
    synth[`power${i}_valueUnit`] = cur.valueUnit || "W";
    synth[`power${i}_entityHeadline`] = cur.entityHeadline || "";
    synth[`_power${i}_useColorScale`] = !!cur.useColorScale;
    synth[`power${i}_minColorScale`] = (_l = cur.minColorScale) != null ? _l : 0;
    synth[`power${i}_maxColorScale`] = (_m = cur.maxColorScale) != null ? _m : 1e4;
    synth[`power${i}_bestColorScale`] = (_n = cur.bestColorScale) != null ? _n : 0;
    synth[`power${i}_minSpeedScale`] = (_o = cur.minSpeedScale) != null ? _o : 0;
    synth[`power${i}_maxSpeedScale`] = (_p = cur.maxSpeedScale) != null ? _p : 1e4;
    synth[`power${i}_reverse`] = !!cur.reverse;
  }
  const existingIdx = cfg.pagePowerdata.findIndex(
    (p) => p && typeof p === "object" && p.pageName === entry.uniqueName
  );
  let index;
  if (existingIdx >= 0) {
    cfg.pagePowerdata[existingIdx] = synth;
    index = existingIdx;
  } else {
    index = cfg.pagePowerdata.length;
    cfg.pagePowerdata.push(synth);
  }
  const homeBotInternal = !!((_q = entry.homeBot) == null ? void 0 : _q.selInternalCalculation);
  const homeBotState = (((_r = entry.homeBot) == null ? void 0 : _r.state) || "").trim();
  const homeBotUnitSuffix = ((_s = entry.homeBot) == null ? void 0 : _s.valueUnit) ? ` ${entry.homeBot.valueUnit}` : "";
  const homeValueBot = homeBotInternal ? {
    value: { type: "internal", dp: `///${entry.uniqueName}/powerSum` },
    decimal: { type: "const", constVal: (_u = (_t = entry.homeBot) == null ? void 0 : _t.valueDecimal) != null ? _u : 0 },
    unit: { type: "const", constVal: homeBotUnitSuffix }
  } : homeBotState ? {
    value: { type: "triggered", dp: homeBotState },
    decimal: { type: "const", constVal: (_w = (_v = entry.homeBot) == null ? void 0 : _v.valueDecimal) != null ? _w : 0 },
    unit: { type: "const", constVal: homeBotUnitSuffix }
  } : void 0;
  const homeTopState = (((_x = entry.homeTop) == null ? void 0 : _x.state) || "").trim();
  const homeTopUnitSuffix = ((_y = entry.homeTop) == null ? void 0 : _y.valueUnit) ? ` ${entry.homeTop.valueUnit}` : "";
  const homeValueTop = homeTopState ? {
    value: { type: "triggered", dp: homeTopState },
    decimal: { type: "const", constVal: (_A = (_z = entry.homeTop) == null ? void 0 : _z.valueDecimal) != null ? _A : 0 },
    unit: { type: "const", constVal: homeTopUnitSuffix }
  } : void 0;
  return {
    uniqueID: entry.uniqueName,
    hidden: !!entry.hidden,
    alwaysOn: (_B = entry.alwaysOn) != null ? _B : "none",
    dpInit: "",
    config: {
      card: "cardPower",
      index,
      data: {
        headline: { type: "const", constVal: entry.headline || entry.uniqueName },
        homeIcon: { true: { value: { type: "const", constVal: "home" } }, false: void 0 },
        homeValueTop,
        homeValueBot,
        leftTop: buildPowerSlotData(entry.leftTop),
        leftMiddle: buildPowerSlotData(entry.leftMiddle),
        leftBottom: buildPowerSlotData(entry.leftBottom),
        rightTop: buildPowerSlotData(entry.rightTop),
        rightMiddle: buildPowerSlotData(entry.rightMiddle),
        rightBottom: buildPowerSlotData(entry.rightBottom)
      }
    },
    pageItems: []
  };
}
function dataForcardTrash(entry) {
  let newPage;
  const pageItems = Array.from({ length: entry.countItems }, (_, i) => {
    return {
      id: `pageItem${i}`,
      role: "text.list",
      type: "text",
      data: {
        icon: {
          true: {
            value: {
              type: "internal",
              dp: `///pageTrash_${entry.uniqueName}`,
              read: `return val[${i}].icon;`
            },
            color: {
              type: "internal",
              dp: `///pageTrash_${entry.uniqueName}`,
              read: `return val[${i}].color;`
            }
          }
        },
        entity1: {
          value: { type: "const", constVal: true }
        },
        text: {
          true: {
            type: "internal",
            dp: `///pageTrash_${entry.uniqueName}`,
            read: `return val[${i}].text;`
          },
          false: void 0
        },
        text1: {
          true: {
            type: "internal",
            dp: `///pageTrash_${entry.uniqueName}`,
            read: `return val[${i}].text1;`
          },
          false: void 0
        }
      }
    };
  });
  if (entry.countItems < 1 || entry.countItems > 6) {
    entry.countItems = 6;
  }
  if (entry.countItems < 6) {
    newPage = {
      uniqueID: entry.uniqueName,
      hidden: !!entry.hidden,
      alwaysOn: entry.alwaysOn,
      dpInit: "",
      template: "entities.waste-calendar",
      config: {
        card: "cardEntities",
        data: {
          headline: { type: "const", constVal: entry.headline || "Trash" }
        }
      },
      pageItems
    };
  } else {
    newPage = {
      uniqueID: entry.uniqueName,
      hidden: !!entry.hidden,
      alwaysOn: entry.alwaysOn,
      dpInit: "",
      template: "entities.waste-calendar",
      config: {
        card: "cardSchedule",
        data: {
          headline: { type: "const", constVal: entry.headline || "Trash" }
        }
      },
      pageItems
    };
  }
  return newPage;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminConfiguration
});
//# sourceMappingURL=admin.js.map
