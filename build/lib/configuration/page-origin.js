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
var page_origin_exports = {};
__export(page_origin_exports, {
  PageOriginTracker: () => PageOriginTracker
});
module.exports = __toCommonJS(page_origin_exports);
class PageOriginTracker {
  classified = /* @__PURE__ */ new WeakSet();
  origins = /* @__PURE__ */ new Map();
  /**
   * Assigns `origin` to every page that has not been classified yet.
   *
   * @param pages Current page list of the panel configuration
   * @param origin Origin of the phase that just ran
   */
  classify(pages, origin) {
    for (const page of pages) {
      if (!page || this.classified.has(page)) {
        continue;
      }
      this.classified.add(page);
      if (page.uniqueID) {
        this.origins.set(page.uniqueID, origin);
      }
    }
  }
  /**
   * Assigns `origin` to the pages named in `ids`, skipping everything already classified.
   *
   * Used for origins that are not tied to a phase of `Panel.preInit()` but reported by the
   * configuration converter, like the pages a panel receives from the global script config.
   *
   * @param pages Current page list of the panel configuration
   * @param ids Page ids that belong to `origin`
   * @param origin Origin to record for those pages
   */
  classifyIds(pages, ids, origin) {
    if (ids.length === 0) {
      return;
    }
    const wanted = new Set(ids);
    for (const page of pages) {
      if (!page || this.classified.has(page) || !page.uniqueID || !wanted.has(page.uniqueID)) {
        continue;
      }
      this.classified.add(page);
      this.origins.set(page.uniqueID, origin);
    }
  }
  /**
   * Origin of a page.
   *
   * @param pageId Page id as used in the navigation
   * @returns The recorded origin, `undefined` for a page that was never classified
   */
  get(pageId) {
    return this.origins.get(pageId);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageOriginTracker
});
//# sourceMappingURL=page-origin.js.map
