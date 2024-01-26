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
var pageMedia_exports = {};
__export(pageMedia_exports, {
  PageMedia1: () => PageMedia1,
  commands: () => commands
});
module.exports = __toCommonJS(pageMedia_exports);
var import_Page = require("./Page");
const commands = {
  cardMedia: {
    on: "1374",
    pause: "65535"
  }
};
const messageItemDefault = {
  event: "input_sel",
  pageId: "",
  icon: "",
  color: "",
  name: "",
  ident: ""
};
class PageMedia1 extends import_Page.Page {
  constructor(adapter, panel, card, name) {
    super(adapter, panel.panelSend, card, name);
  }
  getBottomMessages(msg) {
    if (!msg || !msg.pageId || !msg.icon || msg.event === "")
      return "~~~~~~";
    msg.event = msg.event === void 0 ? "input_sel" : msg.event;
    msg.pageId = `${msg.pageId}?${msg.mode}`;
    const iconNumber = msg.iconNumber;
    const temp = msg;
    delete temp.mode;
    delete temp.iconNumber;
    msg.ident = msg.ident || "media0";
    const message = Object.assign(messageItemDefault, temp);
    switch (iconNumber) {
      case 0: {
        message.ident = "media0";
        break;
      }
      case 1: {
        message.ident = "media1";
        break;
      }
      case 2: {
        message.ident = "media2";
        break;
      }
      case 3: {
        message.ident = "media3";
        break;
      }
      case 4: {
        message.ident = "media4";
        break;
      }
      case 5: {
        message.ident = "media5";
        break;
      }
    }
    return this.getPayload(message.event, message.pageId, message.icon, message.color, message.name, message.ident);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PageMedia1,
  commands
});
//# sourceMappingURL=pageMedia.js.map
