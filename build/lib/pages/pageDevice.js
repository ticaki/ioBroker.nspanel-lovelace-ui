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
  return !!config && (config.card === "cardDevice1" || config.card === "cardDevice2" || config.card === "cardDevice3");
}
class PageDevice extends import_Page.Page {
  headline;
  slotCount;
  layout;
  /** index of the slots (0 = slot 1) that show an alias channel */
  channelSlots;
  /** the status text the parts were made of; undefined until the page has sent one since it became visible */
  statusText = void 0;
  /** the parts of the status text, shown one after the other */
  statusParts = [""];
  /** the part that is shown */
  statusIndex = 0;
  /** the interval that shows the next part; only while there is more than one */
  statusTimer = void 0;
  constructor(config, options) {
    var _a;
    super(config, options);
    const card = options.config;
    if (!isCardDeviceConfig(card)) {
      throw new Error("PageDevice: invalid config card");
    }
    const layout = Number(card.card.slice("cardDevice".length));
    this.layout = (0, import_deviceDetails.isDevicePageLayout)(layout) ? layout : 1;
    const headline = card.data.headline;
    this.headline = headline.type === "const" && typeof headline.constVal === "string" ? headline.constVal : "";
    this.slotCount = import_deviceDetails.DEVICE_PAGE_LAYOUTS[this.layout].length;
    this.channelSlots = new Set((_a = card.channelSlots) != null ? _a : []);
    this.minUpdateInterval = 1e3;
  }
  /**
   * @param index number of a page item
   * @returns its payload as element, the empty element without item or for an empty item
   */
  async elementAt(index) {
    const item = this.itemAt(index);
    if (!item) {
      return import_device_page.DEVICE_PAGE_EMPTY_ELEMENT;
    }
    return await item.getPageItemPayload() || import_device_page.DEVICE_PAGE_EMPTY_ELEMENT;
  }
  /**
   * @param index number of a page item
   * @returns the page item, undefined when there is none or it is empty (empty slot, no info, no status line)
   */
  itemAt(index) {
    var _a, _b;
    const item = (_a = this.pageItems) == null ? void 0 : _a[index];
    return item && ((_b = item.config) == null ? void 0 : _b.type) !== "empty" ? item : void 0;
  }
  /** Stops the rotation of the parts of the status text. */
  stopStatusRotation() {
    if (this.statusTimer) {
      this.adapter.clearInterval(this.statusTimer);
      this.statusTimer = void 0;
    }
  }
  /**
   * Takes the status text of an update: another text than before is split anew, starts with its first part and
   * restarts the rotation (stopped when one part is enough); the same text changes nothing.
   *
   * @param status the status text
   * @returns the part to show
   */
  statusPartOf(status) {
    var _a;
    if (status !== this.statusText) {
      this.statusText = status;
      this.statusParts = (0, import_device_page.splitDevicePageStatus)(status, this.layout, this.basePanel.info.nspanel.model);
      this.statusIndex = 0;
      this.stopStatusRotation();
      if (this.statusParts.length > 1 && !this.unload && !this.adapter.unload) {
        this.statusTimer = this.adapter.setInterval(
          () => this.showNextStatusPart(),
          import_deviceDetails.DEVICE_PAGE_STATUS_INTERVAL_MS
        );
      }
    }
    return (_a = this.statusParts[this.statusIndex]) != null ? _a : "";
  }
  /**
   * The next part of the status text, sent as the short message that only replaces the status line. Nothing is sent
   * (and the part stays) while the page is not shown: hidden, or a popup is open on it (sleep).
   */
  showNextStatusPart() {
    if (this.unload || this.adapter.unload) {
      this.stopStatusRotation();
      return;
    }
    if (!this.visibility || this.sleep || this.statusParts.length < 2) {
      return;
    }
    this.statusIndex = (this.statusIndex + 1) % this.statusParts.length;
    this.sendToPanelClass((0, import_device_page.devicePageStatusMessage)(this.statusParts[this.statusIndex]), false);
  }
  /**
   * A hidden page stops the rotation; shown again it starts with the first part of the status text.
   *
   * @param val true: the page becomes visible
   */
  async onVisibilityChange(val) {
    if (!val) {
      this.stopStatusRotation();
    }
    this.statusText = void 0;
    await super.onVisibilityChange(val);
  }
  async delete() {
    this.stopStatusRotation();
    await super.delete();
  }
  async update() {
    if (!this.visibility) {
      return;
    }
    await super.update();
    const statusItem = this.itemAt(this.slotCount + 2);
    const status = statusItem ? (0, import_device_page.optionalValueOf)(await statusItem.getPageItemPayload()) : "";
    const mainItem = this.itemAt(0);
    const elements = [];
    const kinds = import_deviceDetails.DEVICE_PAGE_LAYOUTS[this.layout];
    const onOff = (on) => this.library.getTranslation(on ? "on" : "off");
    for (let index = 1; index <= this.slotCount + 1; index++) {
      let element = await this.elementAt(index);
      const kind = kinds[index - 1];
      if (kind && this.channelSlots.has(index - 1)) {
        element = (0, import_device_page.devicePageChannelElement)(kind, element, onOff);
      }
      elements.push(kind === "status" ? (0, import_device_page.devicePageStatusIconElement)(element) : (0, import_device_page.devicePageClampElement)(element));
    }
    this.sendToPanel(
      (0, import_device_page.devicePagePayload)(
        (0, import_tools.getPayload)(
          (0, import_tools.getPayloadRemoveTilde)("entityUpd", this.shortHeadline(this.library.getTranslation(this.headline))),
          this.getNavigation()
        ),
        mainItem ? await mainItem.getPageItemPayload() : "",
        elements,
        this.statusPartOf(status),
        this.layout,
        this.basePanel.info.nspanel.model
      ),
      false
    );
  }
  /**
   * A long press on an element: a slot runs the long press of its page item (the action configured for the slot, a
   * channel item what it does on cardGrid). main and the info icon have none - they keep the device part of the
   * item, whose long press would open the detail page from here. Without an action nothing happens: the press is
   * always handled, the caller (Panel) never treats it as a tap.
   *
   * @param id number of the element
   * @param popup popup of the event
   * @param action action of the event
   * @param value value of the event
   * @param event the event
   * @returns true
   */
  async onButtonPress3(id, popup, action, value, event = null) {
    const index = typeof id === "number" ? id : parseInt(id);
    if (index >= 1 && index <= this.slotCount) {
      await super.onButtonPress3(id, popup, action, value, event);
    }
    return true;
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
