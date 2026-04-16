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
class AdminConfiguration extends import_library.BaseClass {
  pageConfig = [];
  constructor(adapter) {
    super(adapter, "AdminConfiguration");
    this.adapter = adapter;
    this.pageConfig = this.adapter.config.pageConfig || [];
  }
  async processPanels(options) {
    for (const option of options) {
      await this.processentrys(option);
    }
    return options;
  }
  /**
   * Process configurable pages from adapter config and build navigation entries.
   * Orchestrates page creation (phase 1) and deferred navigation chain resolution (phase 2).
   *
   * @param option - Panel configuration partial containing pages and navigation arrays
   */
  async processentrys(option) {
    const pendingNavs = await this.createPagesFromConfig(option);
    this.applyPendingNavigations(option, pendingNavs);
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
        navigationEntry.left.double = nav.home;
      }
      if (nav.parent) {
        navigationEntry.right.double = nav.parent;
      }
      if (nav.prev !== void 0 || nav.next !== void 0) {
        pendingNavs.push({
          pageId: newPage.uniqueID,
          prev: nav.prev,
          next: nav.next,
          prevDone: false,
          nextDone: false,
          rightSetByPrev: false
        });
      }
    }
    return pendingNavs;
  }
  /**
   * Phase 2: apply pending prev/next chain assignments in repeated iterations until
   * stable (nothing changes). Handles forward-references where a referenced page was
   * not yet present in option.navigation when the referencing entry was first processed.
   *
   * @param option - Panel configuration partial
   * @param pendingNavs - Pending navigation entries collected in phase 1
   */
  applyPendingNavigations(option, pendingNavs) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    let changed = true;
    while (changed) {
      changed = false;
      for (const pending of pendingNavs) {
        if (pending.prevDone && (pending.nextDone || pending.next === void 0 || pending.rightSetByPrev)) {
          continue;
        }
        const pageEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.pageId);
        if (!pageEntry) {
          continue;
        }
        if (pending.prev !== void 0 && !pending.prevDone) {
          const prevEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.prev);
          if (prevEntry) {
            pageEntry.left = { ...(_a = pageEntry.left) != null ? _a : {}, single: pending.prev };
            const oldNext = (_b = prevEntry.right) == null ? void 0 : _b.single;
            if (oldNext && oldNext !== pending.pageId) {
              this.log.debug(
                `Navigation: '${pending.prev}' already points to '${oldNext}', inserting '${pending.pageId}' between them.`
              );
              prevEntry.right = { ...(_c = prevEntry.right) != null ? _c : {}, single: pending.pageId };
              if (!((_d = pageEntry.right) == null ? void 0 : _d.single)) {
                pageEntry.right = { ...(_e = pageEntry.right) != null ? _e : {}, single: oldNext };
                pending.rightSetByPrev = true;
              }
              const oldNextEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === oldNext);
              if (oldNextEntry) {
                oldNextEntry.left = { ...(_f = oldNextEntry.left) != null ? _f : {}, single: pending.pageId };
              }
            } else if (!oldNext) {
              prevEntry.right = { ...(_g = prevEntry.right) != null ? _g : {}, single: pending.pageId };
            }
            pending.prevDone = true;
            changed = true;
          }
        }
        if (pending.next !== void 0 && !pending.nextDone && !pending.rightSetByPrev) {
          const nextEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === pending.next);
          if (nextEntry) {
            pageEntry.right = { ...(_h = pageEntry.right) != null ? _h : {}, single: pending.next };
            const oldPrev = (_i = nextEntry.left) == null ? void 0 : _i.single;
            if (oldPrev && oldPrev !== pending.pageId) {
              nextEntry.left = { ...(_j = nextEntry.left) != null ? _j : {}, single: pending.pageId };
              if (!((_k = pageEntry.left) == null ? void 0 : _k.single)) {
                pageEntry.left = { ...(_l = pageEntry.left) != null ? _l : {}, single: oldPrev };
              }
              const oldPrevEntry = option.navigation.find((b) => (b == null ? void 0 : b.name) === oldPrev);
              if (oldPrevEntry) {
                oldPrevEntry.right = { ...(_m = oldPrevEntry.right) != null ? _m : {}, single: pending.pageId };
              }
            } else if (!oldPrev) {
              nextEntry.left = { ...(_n = nextEntry.left) != null ? _n : {}, single: pending.pageId };
            }
            pending.nextDone = true;
            changed = true;
          }
        }
      }
    }
    for (const pending of pendingNavs) {
      if (pending.prev !== void 0 && !pending.prevDone) {
        this.log.warn(`Navigation unresolved for '${pending.pageId}': prev page '${pending.prev}' not found.`);
      }
      if (pending.next !== void 0 && !pending.nextDone && !pending.rightSetByPrev) {
        this.log.warn(`Navigation unresolved for '${pending.pageId}': next page '${pending.next}' not found.`);
      }
    }
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
