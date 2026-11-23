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
var pageDevice_exports = {};
__export(pageDevice_exports, {
  PageDevice: () => PageDevice
});
module.exports = __toCommonJS(pageDevice_exports);
var import_Page = require("../classes/Page");
var import_tools = require("../const/tools");
var import_deviceDetails = require("../types/deviceDetails");
var import_device_page = require("./device-page");
function isCardDeviceConfig(config) {
  return !!config && (config.card === "cardDevice1" || config.card === "cardDevice2" || config.card === "cardDevice3") && "elements" in config;
}
class PageDevice extends import_Page.Page {
  headline;
  slotCount;
  layout;
  constructor(config, options) {
    super(config, options);
    const card = options.config;
    if (!isCardDeviceConfig(card)) {
      throw new Error("PageDevice: invalid config card");
    }
    const layout = Number(card.card.slice("cardDevice".length));
    this.layout = (0, import_deviceDetails.isDevicePageLayout)(layout) ? layout : 1;
    const headline = card.data.headline;
    this.headline = headline.type === "const" && typeof headline.constVal === "string" ? headline.constVal : "";
    this.slotCount = card.slotCount;
    this.pageItemConfig = [...card.elements];
    this.minUpdateInterval = 1e3;
  }
  /**
   * @param index number of a page item
   * @returns its payload as element, the empty element without item
   */
  async elementAt(index) {
    var _a;
    const item = (_a = this.pageItems) == null ? void 0 : _a[index];
    if (!item) {
      return import_device_page.DEVICE_PAGE_EMPTY_ELEMENT;
    }
    return await item.getPageItemPayload() || import_device_page.DEVICE_PAGE_EMPTY_ELEMENT;
  }
  async update() {
    var _a, _b;
    if (!this.visibility) {
      return;
    }
    await super.update();
    const statusIndex = this.slotCount + 2;
    const statusItem = (_a = this.pageItems) == null ? void 0 : _a[statusIndex];
    const status = statusItem ? (0, import_device_page.fitDevicePageStatus)(
      (0, import_device_page.optionalValueOf)(await statusItem.getPageItemPayload()),
      this.layout,
      this.basePanel.info.nspanel.model
    ) : "";
    const mainItem = (_b = this.pageItems) == null ? void 0 : _b[0];
    const elements = [(0, import_device_page.devicePageMainElement)(mainItem ? await mainItem.getPageItemPayload() : "", status)];
    for (let index = 1; index <= this.slotCount + 1; index++) {
      elements.push(await this.elementAt(index));
    }
    this.sendToPanel(
      (0, import_tools.getPayload)(
        (0, import_tools.getPayloadRemoveTilde)("entityUpd", this.shortHeadline(this.library.getTranslation(this.headline))),
        this.getNavigation(),
        (0, import_tools.getPayloadArray)(elements)
      ),
      false
    );
  }
  /**
   * No long press on the device page: the caller (Panel) treats the press as a tap.
   *
   * @returns false
   */
  async onButtonPress3() {
    return Promise.resolve(false);
  }
  async onButtonEvent(_event) {
  }
  async onStateTrigger() {
    await this.update();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageDevice
});
//# sourceMappingURL=pageDevice.js.map
