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
var pageTrash_exports = {};
__export(pageTrash_exports, {
  getTrashDataFromFile: () => getTrashDataFromFile,
  getTrashDataFromState: () => getTrashDataFromState
});
module.exports = __toCommonJS(pageTrash_exports);
var import_Color = require("../../const/Color");
var import_node_ical = __toESM(require("node-ical"));
async function getTrashDataFromState(trashJSON, entry, trashTypes = [], customTrash = [], iconColors = []) {
  var _a, _b;
  const items = [];
  const currentDate = /* @__PURE__ */ new Date();
  const countItems = (_a = entry.countItems) != null ? _a : 6;
  try {
    let trashData;
    if (typeof trashJSON === "string") {
      trashData = JSON.parse(trashJSON);
    } else if (Array.isArray(trashJSON)) {
      trashData = trashJSON;
    } else {
      return { messages: items, error: new Error("trashJSON must be a string or array ") };
    }
    if (!Array.isArray(trashData)) {
      return { messages: items, error: new Error("trashData is not an  array") };
    }
    let entryCount = 0;
    for (const trashObject of trashData) {
      const eventName = trashObject.event;
      if (!eventName || eventName.trim() === "") {
        continue;
      }
      const eventStartdatum = new Date(trashObject._date);
      if (currentDate.getTime() > eventStartdatum.getTime()) {
        continue;
      }
      let eventDatum = "";
      const tempDate = new Date(eventStartdatum).setHours(0, 0, 0, 0);
      if (tempDate === (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) {
        eventDatum = "today";
      } else if (tempDate === new Date(Date.now() + 24 * 60 * 60 * 1e3).setHours(0, 0, 0, 0)) {
        eventDatum = "tomorrow";
      } else {
        eventDatum = ((_b = trashObject.date) == null ? void 0 : _b.trim()) || "";
      }
      let trashIndex = -1;
      for (let i = 0; i < trashTypes.length; i++) {
        if (trashTypes[i] && trashTypes[i].trim() !== "" && eventName.includes(trashTypes[i])) {
          trashIndex = i;
          break;
        }
      }
      if (trashIndex !== -1) {
        items.push({
          icon: "trash-can",
          color: import_Color.Color.ConvertHexToRgb(iconColors[trashIndex]),
          text: customTrash[trashIndex] && customTrash[trashIndex] !== "" ? customTrash[trashIndex] : trashTypes[trashIndex],
          text1: countItems < 6 ? eventDatum : eventStartdatum.toLocaleString("de-DE", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit"
          })
        });
        entryCount++;
        if (entryCount >= 6) {
          break;
        }
      }
    }
    return { messages: items };
  } catch (error) {
    return { messages: items, error };
  }
}
async function getTrashDataFromFile(entry, trashTypes = [], customTrash = [], iconColors = [], adapter) {
  var _a;
  const items = [];
  const trashFile = entry.trashFile;
  const countItems = (_a = entry.countItems) != null ? _a : 6;
  try {
    if (!await adapter.fileExistsAsync(adapter.namespace, trashFile)) {
      return { messages: items, error: `File ${trashFile} does not exist in ioBroker files` };
    }
    let fileData;
    try {
      fileData = (await adapter.readFileAsync(adapter.namespace, trashFile)).file.toString("utf-8");
    } catch (readError) {
      console.error(`Error reading ${trashFile} from ioBroker files:`, readError);
      return { messages: items, error: readError };
    }
    const data = import_node_ical.default.parseICS(fileData);
    const arrayData = Object.values(data).filter(
      (entry2) => entry2 && typeof entry2 === "object" && entry2.type === "VEVENT" && new Date(entry2.start).getTime() > Date.now()
    );
    arrayData.sort((a, b) => {
      const dateA = new Date(a.start).getTime();
      const dateB = new Date(b.start).getTime();
      return dateA - dateB;
    });
    let entryCount = 0;
    for (const event of arrayData) {
      if (event.type === "VEVENT") {
        const eventName = event.summary;
        if (!eventName || eventName.trim() === "") {
          continue;
        }
        const eventStartdatum = new Date(event.start);
        let eventDatum = "";
        const tempDate = new Date(eventStartdatum).setHours(0, 0, 0, 0);
        if (tempDate === (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) {
          eventDatum = "today";
        } else if (tempDate === new Date(Date.now() + 24 * 60 * 60 * 1e3).setHours(0, 0, 0, 0)) {
          eventDatum = "tomorrow";
        } else {
          eventDatum = (countItems < 6 ? eventStartdatum.toLocaleString("de-DE", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit"
          }) : eventStartdatum.toLocaleString("de-DE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          })) || "";
        }
        let trashIndex = -1;
        for (let i = 0; i < trashTypes.length; i++) {
          if (trashTypes[i] && trashTypes[i].trim() !== "" && eventName.includes(trashTypes[i])) {
            trashIndex = i;
            break;
          }
        }
        if (trashIndex !== -1) {
          items.push({
            icon: "trash-can",
            color: import_Color.Color.ConvertHexToRgb(iconColors[trashIndex]),
            text: customTrash[trashIndex] && customTrash[trashIndex] !== "" ? customTrash[trashIndex] : trashTypes[trashIndex],
            text1: eventDatum
          });
          entryCount++;
          if (entryCount >= 6) {
            break;
          }
        }
      }
    }
    return { messages: items };
  } catch (error) {
    console.error("Error in getTrashDataFromFile:", error);
    return { messages: items, error };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTrashDataFromFile,
  getTrashDataFromState
});
//# sourceMappingURL=pageTrash.js.map
