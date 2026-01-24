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
var pageTrash_exports = {};
__export(pageTrash_exports, {
  getTrash: () => getTrash
});
module.exports = __toCommonJS(pageTrash_exports);
var import_Color = require("../../const/Color");
const data = [
  {
    date: "Heute  ",
    event: "Welsestra\xDFe - Gelber Sack",
    _class: "ical_Abfall ical_today",
    _date: "2026-01-12T23:00:00.000Z",
    _end: "2026-01-13T23:00:00.000Z",
    _IDID: "593336@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "593336@mymuell.de",
      summary: "Welsestra\xDFe - Gelber Sack",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-01-12T23:00:00.000Z",
      datetype: "date",
      end: "2026-01-13T23:00:00.000Z"
    }
  },
  {
    date: "In einer Woche  ",
    event: "Welsestra\xDFe - Hausm\xFCll",
    _class: "ical_Abfall ical_oneweek",
    _date: "2026-01-19T23:00:00.000Z",
    _end: "2026-01-20T23:00:00.000Z",
    _IDID: "377046@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "377046@mymuell.de",
      summary: "Welsestra\xDFe - Hausm\xFCll",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-01-19T23:00:00.000Z",
      datetype: "date",
      end: "2026-01-20T23:00:00.000Z"
    }
  },
  {
    date: "23.01.2026  ",
    event: "Welsestra\xDFe - Biom\xFCll",
    _class: "ical_Abfall ",
    _date: "2026-01-22T23:00:00.000Z",
    _end: "2026-01-23T23:00:00.000Z",
    _IDID: "401187@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "401187@mymuell.de",
      summary: "Welsestra\xDFe - Biom\xFCll",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-01-22T23:00:00.000Z",
      datetype: "date",
      end: "2026-01-23T23:00:00.000Z"
    }
  },
  {
    date: "03.02.2026  ",
    event: "Welsestra\xDFe - Papier",
    _class: "ical_Abfall ",
    _date: "2026-02-02T23:00:00.000Z",
    _end: "2026-02-03T23:00:00.000Z",
    _IDID: "591845@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "591845@mymuell.de",
      summary: "Welsestra\xDFe - Papier",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-02-02T23:00:00.000Z",
      datetype: "date",
      end: "2026-02-03T23:00:00.000Z"
    }
  },
  {
    date: "03.02.2026  ",
    event: "Welsestra\xDFe - Gelber Sack",
    _class: "ical_Abfall ",
    _date: "2026-02-02T23:00:00.000Z",
    _end: "2026-02-03T23:00:00.000Z",
    _IDID: "405421@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "405421@mymuell.de",
      summary: "Welsestra\xDFe - Gelber Sack",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-02-02T23:00:00.000Z",
      datetype: "date",
      end: "2026-02-03T23:00:00.000Z"
    }
  },
  {
    date: "06.02.2026  ",
    event: "Welsestra\xDFe - Biom\xFCll",
    _class: "ical_Abfall ",
    _date: "2026-02-05T23:00:00.000Z",
    _end: "2026-02-06T23:00:00.000Z",
    _IDID: "862129@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "862129@mymuell.de",
      summary: "Welsestra\xDFe - Biom\xFCll",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-02-05T23:00:00.000Z",
      datetype: "date",
      end: "2026-02-06T23:00:00.000Z"
    }
  },
  {
    date: "10.02.2026  ",
    event: "Welsestra\xDFe - Hausm\xFCll",
    _class: "ical_Abfall ",
    _date: "2026-02-09T23:00:00.000Z",
    _end: "2026-02-10T23:00:00.000Z",
    _IDID: "651257@mymuell.de",
    _allDay: true,
    _private: false,
    _rule: " ",
    location: "",
    _calName: "Abfall",
    _calColor: "#000000",
    _object: {
      type: "VEVENT",
      params: [],
      uid: "651257@mymuell.de",
      summary: "Welsestra\xDFe - Hausm\xFCll",
      dtstamp: "2025-12-23T23:53:02.000Z",
      start: "2026-02-09T23:00:00.000Z",
      datetype: "date",
      end: "2026-02-10T23:00:00.000Z"
    }
  }
];
async function getTrash(trashJSON, trashtype1 = "", trashtype2 = "", trashtype3 = "", trashtype4 = "", trashtype5 = "", trashtype6 = "", customTrash1 = "", customTrash2 = "", customTrash3 = "", customTrash4 = "", customTrash5 = "", customTrash6 = "", iconColor1 = "", iconColor2 = "", iconColor3 = "", iconColor4 = "", iconColor5 = "", iconColor6 = "") {
  var _a;
  const items = [];
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
    const currentDate = /* @__PURE__ */ new Date();
    let entryCount = 0;
    for (const trashObject of trashData) {
      const eventName = trashObject.event;
      if (!eventName) {
        continue;
      }
      const eventDatum = ((_a = trashObject.date) == null ? void 0 : _a.trim()) || "";
      const eventStartdatum = new Date(trashObject._date);
      if (currentDate.getTime() > eventStartdatum.getTime()) {
        continue;
      }
      const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
      const customTrash = [customTrash1, customTrash2, customTrash3, customTrash4, customTrash5, customTrash6];
      const iconColor = [iconColor1, iconColor2, iconColor3, iconColor4, iconColor5, iconColor6];
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
          text1: eventDatum
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getTrash
});
//# sourceMappingURL=pageTrash.js.map
