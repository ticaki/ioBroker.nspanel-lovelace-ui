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
  processPanels(options) {
    for (const option of options) {
      this.processentrys(option);
    }
    return options;
  }
  /**
   * Process configurable pages from adapter config and build navigation entries.
   * Supports ALL_PANELS_SPECIAL_ID for applying pages to all panels at once,
   * then allows individual panel overrides or exclusions.
   *
   * Logic:
   * - First pass: If ALL_PANELS_SPECIAL_ID assignment exists, apply to all panels
   * - Second pass: Process panel-specific assignments
   *   - Empty navigation with prior ALL = exclude this panel from that page
   *   - Empty navigation without ALL = default to home:'main'
   *
   * Supported card types: cardAlarm (unlock/alarm), cardQR, and more in the future.
   *
   * @param option - Panel configuration partial containing pages and navigation arrays
   */
  processentrys(option) {
    var _a, _b;
    const entries = this.pageConfig;
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
        default: {
          this.log.warn(`Unsupported card 1type '${entry.card}' for page '${entry.uniqueName}', skipping!`);
          continue;
        }
      }
      if (option.pages.find((a) => a.uniqueID === newPage.uniqueID)) {
        this.log.warn(`Page with name ${newPage.uniqueID} already exists, skipping!`);
        continue;
      }
      option.pages.push(newPage);
      const navigation = navAssign.navigation;
      if (!navigation) {
        continue;
      }
      const navigationEntry = {
        name: newPage.uniqueID,
        page: newPage.uniqueID,
        right: { single: void 0, double: void 0 },
        left: { single: void 0, double: void 0 }
      };
      if (!navigation.prev && !navigation.next && !navigation.home && !navigation.parent) {
        navigation.home = "main";
      }
      let overrwriteNext = false;
      if (navigation.prev) {
        navigationEntry.left.single = navigation.prev;
        const index = option.navigation.findIndex(
          (b) => b && b.name === navigation.prev
        );
        if (index !== -1 && option.navigation[index]) {
          const oldNext = (_a = option.navigation[index].right) == null ? void 0 : _a.single;
          if (oldNext && oldNext !== newPage.uniqueID) {
            overrwriteNext = true;
            option.navigation[index].right = option.navigation[index].right || {};
            option.navigation[index].right.single = newPage.uniqueID;
            navigationEntry.right.single = oldNext;
            const nextIndex = option.navigation.findIndex(
              (b) => b && b.name === oldNext
            );
            if (nextIndex !== -1 && option.navigation[nextIndex]) {
              option.navigation[nextIndex].left = option.navigation[nextIndex].left || {};
              option.navigation[nextIndex].left.single = newPage.uniqueID;
            }
          } else if (!oldNext) {
            option.navigation[index].right = { single: newPage.uniqueID };
          }
        }
      }
      if (!overrwriteNext && navigation.next) {
        navigationEntry.right.single = navigation.next;
        const index = option.navigation.findIndex(
          (b) => b && b.name === navigation.next
        );
        if (index !== -1 && option.navigation[index]) {
          const oldPrev = (_b = option.navigation[index].left) == null ? void 0 : _b.single;
          if (oldPrev && oldPrev !== newPage.uniqueID) {
            option.navigation[index].left = option.navigation[index].left || {};
            option.navigation[index].left.single = newPage.uniqueID;
            navigationEntry.left.single = oldPrev;
            const prevIndex = option.navigation.findIndex(
              (b) => b && b.name === oldPrev
            );
            if (prevIndex !== -1 && option.navigation[prevIndex]) {
              option.navigation[prevIndex].right = option.navigation[prevIndex].right || {};
              option.navigation[prevIndex].right.single = newPage.uniqueID;
            }
          } else if (!oldPrev) {
            option.navigation[index].left = { single: newPage.uniqueID };
          }
        }
      }
      if (navigation.home) {
        navigationEntry.left.double = navigation.home;
      }
      if (navigation.parent) {
        navigationEntry.right.double = navigation.parent;
      }
      option.navigation.push(navigationEntry);
    }
    return option;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AdminConfiguration
});
//# sourceMappingURL=admin.js.map
