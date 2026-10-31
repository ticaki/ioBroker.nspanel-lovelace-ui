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
var global_config_merge_exports = {};
__export(global_config_merge_exports, {
  mergeGlobalConfig: () => mergeGlobalConfig
});
module.exports = __toCommonJS(global_config_merge_exports);
var import_config_manager_const = require("../const/config-manager-const");
function mergeGlobalConfig(config, globalRaw, options = {}) {
  var _a, _b, _c;
  if (!globalRaw || !(0, import_config_manager_const.isGlobalConfig)(globalRaw)) {
    return void 0;
  }
  const random = (_a = options.random) != null ? _a : Math.random;
  const globalConfig = structuredClone(globalRaw);
  const pages = [...(_b = config.pages) != null ? _b : []];
  const subPages = [...(_c = config.subPages) != null ? _c : []];
  const messages = [];
  const warnings = [];
  const globalPageIds = /* @__PURE__ */ new Set();
  const sources = /* @__PURE__ */ new Map();
  const copies = /* @__PURE__ */ new Map();
  const insertedLinks = /* @__PURE__ */ new Set();
  const navigationAdjustRun = (oldUniqueName, newUniqueName, list, renamedPages, maxRun = 3, indexRun = 0, runPrefix = "") => {
    if (!oldUniqueName || !newUniqueName || oldUniqueName === newUniqueName) {
      return list;
    }
    if (indexRun++ > maxRun) {
      warnings.push(
        `navigationAdjustRun for ${oldUniqueName} to ${newUniqueName} aborted - maxRun ${maxRun} reached!`
      );
      return list;
    }
    const pageIndex = list.findIndex((item) => item.uniqueName === oldUniqueName);
    if (pageIndex === -1) {
      return list;
    }
    let page = list[pageIndex];
    if (!page) {
      return list;
    }
    renamedPages[oldUniqueName] = newUniqueName;
    page = { ...structuredClone(page), uniqueName: newUniqueName };
    list.push(page);
    if ("items" in page && page.items) {
      for (let i = 0; i < page.items.length; i++) {
        const item = page.items[i];
        if (item && item.navigate && item.targetPage) {
          const origin = item.targetPage;
          for (const key in renamedPages) {
            const value = renamedPages[key];
            if (origin === value) {
              item.targetPage = value;
              continue;
            }
          }
          if (renamedPages[item.targetPage]) {
            item.targetPage = renamedPages[item.targetPage];
            continue;
          }
          const newName = `${runPrefix}_${item.targetPage}_copy_nav_${Math.floor(random() * 1e5)}`;
          copies.set(newName, runPrefix);
          if (list.findIndex((it) => it.uniqueName === newName) === -1) {
            list = navigationAdjustRun(
              item.targetPage,
              newName,
              list,
              renamedPages,
              maxRun,
              indexRun,
              runPrefix
            );
          }
          item.targetPage = newName;
        }
      }
    }
    for (const t of ["next", "prev", "home", "parent"]) {
      const tag = t;
      if (page[tag] === oldUniqueName) {
        for (const key in renamedPages) {
          const value = renamedPages[key];
          if (page[tag] === value) {
            continue;
          }
        }
        if (renamedPages[page[tag]]) {
          page[tag] = renamedPages[page[tag]];
          continue;
        }
        const newName = `${runPrefix}_${page[tag]}_copy_nav_${Math.floor(random() * 1e5)}`;
        copies.set(newName, runPrefix);
        if (list.findIndex((it) => it.uniqueName === newName) === -1) {
          list = navigationAdjustRun(page[tag], newName, list, renamedPages, maxRun, indexRun, runPrefix);
        }
        page[tag] = newName;
      }
    }
    return list;
  };
  globalConfig.maxNavigationAdjustRuns = globalConfig.maxNavigationAdjustRuns && globalConfig.maxNavigationAdjustRuns > 0 ? globalConfig.maxNavigationAdjustRuns : 3;
  const removeGlobalPageIndexs = /* @__PURE__ */ new Set();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page && "globalLink" in page && page.globalLink) {
      const gIndex = globalConfig.subPages.findIndex((item) => item.uniqueName === page.globalLink);
      const gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : void 0;
      if (gPage) {
        for (const t of ["next", "prev"]) {
          const tag = t;
          if (gPage[tag] != null) {
            const gIndex2 = globalConfig.subPages.findIndex((item) => item.uniqueName === gPage[tag]);
            const index = pages.findIndex(
              (item) => "globalLink" in item && item.globalLink === gPage[tag] || item.uniqueName === gPage[tag]
            );
            if (gIndex2 !== -1 && index === -1) {
              let msg = `Global page ${gPage.uniqueName} ${tag} link to subPage ${gPage[tag]}. `;
              if (tag === "next") {
                msg += `Remove ${gPage[tag]} from subPages and add to pages at index ${i + 1}!`;
              } else {
                msg += `This is not recommended! Prev navigation will "randomly" change the order of pages! Consider to remove it!`;
              }
              messages.push(msg);
              const link = { globalLink: gPage[tag] };
              insertedLinks.add(link);
              pages.splice(i + 1, 0, link);
            }
          }
        }
      }
    }
  }
  for (let i = pages.length - 1; i >= 0; i--) {
    const page = pages[i];
    if (page && "globalLink" in page && page.globalLink) {
      const gIndex = globalConfig.subPages.findIndex((item) => item.uniqueName === page.globalLink);
      let gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : void 0;
      if (gPage) {
        if (page.uniqueName != null && page.uniqueName !== gPage.uniqueName) {
          globalConfig.subPages = navigationAdjustRun(
            gPage.uniqueName,
            page.uniqueName,
            globalConfig.subPages,
            {},
            globalConfig.maxNavigationAdjustRuns,
            0,
            page.uniqueName
          );
          const index = globalConfig.subPages.findIndex((p) => p.uniqueName === page.uniqueName);
          if (index !== -1) {
            gPage = globalConfig.subPages[index];
            gPage.uniqueName = page.uniqueName;
          }
        } else {
          removeGlobalPageIndexs.add(gIndex);
        }
        const merged = {
          ...gPage,
          prev: void 0,
          next: void 0,
          home: void 0,
          parent: void 0
        };
        if (page.heading) {
          merged.heading = page.heading;
        }
        pages[i] = merged;
        sources.set(merged, {
          kind: insertedLinks.has(page) ? "inserted" : "linked",
          globalName: page.globalLink
        });
        if (merged.uniqueName) {
          globalPageIds.add(merged.uniqueName);
        }
      } else {
        pages.splice(i, 1);
        const msg = `Global page with uniqueName ${page.globalLink} not found!`;
        messages.push(msg);
        warnings.push(msg);
      }
    }
  }
  for (let i = subPages.length - 1; i >= 0; i--) {
    const page = subPages[i];
    if (page && "globalLink" in page && page.globalLink) {
      const gIndex = globalConfig.subPages.findIndex((item) => item.uniqueName === page.globalLink);
      let gPage = gIndex !== -1 ? globalConfig.subPages[gIndex] : void 0;
      if (gPage) {
        if (page.uniqueName != null && page.uniqueName !== gPage.uniqueName) {
          globalConfig.subPages = navigationAdjustRun(
            gPage.uniqueName,
            page.uniqueName,
            globalConfig.subPages,
            {},
            globalConfig.maxNavigationAdjustRuns,
            0,
            page.uniqueName
          );
          const index = globalConfig.subPages.findIndex((p) => p.uniqueName === page.uniqueName);
          if (index !== -1) {
            gPage = globalConfig.subPages[index];
            gPage.uniqueName = page.uniqueName;
          }
        } else {
          removeGlobalPageIndexs.add(gIndex);
        }
        const existNav = page.prev != null || page.parent != null || page.next != null || page.home != null;
        const merged = {
          ...gPage,
          prev: existNav ? page.prev : gPage.prev,
          parent: existNav ? page.parent : gPage.parent,
          next: existNav ? page.next : gPage.next,
          home: existNav ? page.home : gPage.home
        };
        if (page.heading) {
          merged.heading = page.heading;
        }
        subPages[i] = merged;
        sources.set(merged, { kind: "linked", globalName: page.globalLink });
        if (merged.uniqueName) {
          globalPageIds.add(merged.uniqueName);
        }
      } else {
        subPages.splice(i, 1);
        const msg = `Global page with uniqueName ${page.globalLink} not found!`;
        messages.push(msg);
        warnings.push(msg);
      }
    }
  }
  for (const index of Array.from(removeGlobalPageIndexs).sort((a, b) => b - a)) {
    globalConfig.subPages.splice(index, 1);
  }
  for (const page of globalConfig.subPages || []) {
    if (!page) {
      continue;
    }
    sources.set(
      page,
      page.uniqueName && copies.has(page.uniqueName) ? { kind: "navigationCopy", globalName: page.uniqueName } : { kind: "unlinked", globalName: page.uniqueName }
    );
    if (page.uniqueName && pages.findIndex((p) => p && p.uniqueName === page.uniqueName) === -1) {
      globalPageIds.add(page.uniqueName);
    }
  }
  const mergedSubPages = subPages.concat(globalConfig.subPages || []);
  return {
    pages,
    subPages: mergedSubPages,
    navigation: (config.navigation || []).concat(globalConfig.navigation || []),
    nativePageItems: (config.nativePageItems || []).concat(globalConfig.nativePageItems || []),
    globalPageIds,
    messages,
    warnings,
    sources,
    copyRoots: new Set(copies.values())
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mergeGlobalConfig
});
//# sourceMappingURL=global-config-merge.js.map
