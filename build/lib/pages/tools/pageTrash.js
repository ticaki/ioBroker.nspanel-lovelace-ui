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
var fs = __toESM(require("node:fs"));
var import_node_ical = __toESM(require("node-ical"));
async function getTrashDataFromState(trashJSON, trashtype1 = "", trashtype2 = "", trashtype3 = "", trashtype4 = "", trashtype5 = "", trashtype6 = "", customTrash1 = "", customTrash2 = "", customTrash3 = "", customTrash4 = "", customTrash5 = "", customTrash6 = "", iconColor1 = "", iconColor2 = "", iconColor3 = "", iconColor4 = "", iconColor5 = "", iconColor6 = "") {
  var _a;
  const items = [];
  const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
  const customTrash = [customTrash1, customTrash2, customTrash3, customTrash4, customTrash5, customTrash6];
  const iconColor = [iconColor1, iconColor2, iconColor3, iconColor4, iconColor5, iconColor6];
  const currentDate = /* @__PURE__ */ new Date();
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
      const eventDatum = ((_a = trashObject.date) == null ? void 0 : _a.trim()) || "";
      const eventStartdatum = new Date(trashObject._date);
      if (currentDate.getTime() > eventStartdatum.getTime()) {
        continue;
      }
      const day = String(eventStartdatum.getDate()).padStart(2, "0");
      const month = String(eventStartdatum.getMonth() + 1).padStart(2, "0");
      const year = String(eventStartdatum.getFullYear()).slice(-2);
      const eventDatumFormatted = `${day}.${month}.${year}`;
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
          color: import_Color.Color.ConvertHexToRgb(iconColor[trashIndex]),
          text: customTrash[trashIndex] && customTrash[trashIndex] !== "" ? customTrash[trashIndex] : trashTypes[trashIndex],
          text1: eventDatum,
          text2: eventDatumFormatted
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
async function getTrashDataFromFile(trashFile = "", trashtype1 = "", trashtype2 = "", trashtype3 = "", trashtype4 = "", trashtype5 = "", trashtype6 = "", customTrash1 = "", customTrash2 = "", customTrash3 = "", customTrash4 = "", customTrash5 = "", customTrash6 = "", iconColor1 = "", iconColor2 = "", iconColor3 = "", iconColor4 = "", iconColor5 = "", iconColor6 = "") {
  const items = [];
  const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
  const customTrash = [customTrash1, customTrash2, customTrash3, customTrash4, customTrash5, customTrash6];
  const iconColor = [iconColor1, iconColor2, iconColor3, iconColor4, iconColor5, iconColor6];
  try {
    if (!fs.existsSync(trashFile)) {
      console.warn(`.ics file ${trashFile} does not exist.`);
      return { messages: items, error: new Error(`File ${trashFile} does not exist`) };
    }
    let fileData;
    try {
      fileData = fs.readFileSync(trashFile, "utf-8");
    } catch (readError) {
      console.error(`Error reading ${trashFile}:`, readError);
      return { messages: items, error: readError };
    }
    const data = import_node_ical.default.parseICS(fileData);
    const arrayData = Object.values(data).filter(
      (entry) => entry && typeof entry === "object" && entry.type === "VEVENT" && new Date(entry.start).getTime() > Date.now()
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
        const day = String(eventStartdatum.getDate()).padStart(2, "0");
        const month = String(eventStartdatum.getMonth() + 1).padStart(2, "0");
        const year = String(eventStartdatum.getFullYear()).slice(-2);
        const eventDatumFormatted = `${day}.${month}.${year}`;
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
            color: import_Color.Color.ConvertHexToRgb(iconColor[trashIndex]),
            text: customTrash[trashIndex] && customTrash[trashIndex] !== "" ? customTrash[trashIndex] : trashTypes[trashIndex],
            text1: eventStartdatum.toLocaleString("de-DE", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit"
            }),
            text2: eventDatumFormatted
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
