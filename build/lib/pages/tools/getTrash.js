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
var getTrash_exports = {};
__export(getTrash_exports, {
  getPageTrash: () => getPageTrash
});
module.exports = __toCommonJS(getTrash_exports);
const PageTrashMessageDefault = {
  event: "entityUpd",
  headline: "Trash Page",
  navigation: "button~bSubPrev~~~~~button~bSubNext~~~~",
  icon1: "",
  trashType1: "",
  trashDate1: "",
  icon2: "",
  trashType2: "",
  trashDate2: "",
  icon3: "",
  trashType3: "",
  trashDate3: "",
  icon4: "",
  trashType4: "",
  trashDate4: "",
  icon5: "",
  trashType5: "",
  trashDate5: "",
  icon6: "",
  trashType6: "",
  trashDate6: ""
};
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
async function getPageTrash(trashJSON, leftChar, rightChar, trashtype1 = "", trashtype2 = "", trashtype3 = "", trashtype4 = "", trashtype5 = "", trashtype6 = "", customEventName1 = "test", customEventName2 = "test2", customEventName3 = "test3", customEventName4 = "", customEventName5 = "", customEventName6 = "") {
  var _a;
  const messages = [];
  const pageTrashMessage = { ...PageTrashMessageDefault };
  try {
    let trashData;
    if (typeof trashJSON === "string") {
      trashData = JSON.parse(trashJSON);
    } else if (Array.isArray(trashJSON)) {
      trashData = trashJSON;
    } else {
      return { messages: [], error: new Error("trashJSON must be a string or array ") };
    }
    if (!Array.isArray(trashData)) {
      return { messages: [], error: new Error("trashData is not an array") };
    }
    const currentDate = /* @__PURE__ */ new Date();
    let entryCount = 0;
    for (const trashObject of trashData) {
      let eventName = trashObject.event;
      if (!eventName) {
        continue;
      }
      if (leftChar > 0 || rightChar > 0) {
        const endPos = rightChar > 0 ? eventName.length - rightChar : eventName.length;
        eventName = eventName.substring(leftChar, endPos);
      }
      eventName = eventName.trim();
      const eventDatum = ((_a = trashObject.date) == null ? void 0 : _a.trim()) || "";
      const eventStartdatum = new Date(trashObject._date);
      if (currentDate.getTime() > eventStartdatum.getTime()) {
        continue;
      }
      const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
      const customNames = [
        customEventName1,
        customEventName2,
        customEventName3,
        customEventName4,
        customEventName5,
        customEventName6
      ];
      let trashIndex = -1;
      for (let i = 0; i < trashTypes.length; i++) {
        if (trashTypes[i] && trashTypes[i].trim() !== "" && trashTypes[i].includes(eventName)) {
          trashIndex = i;
          break;
        }
      }
      if (trashIndex !== -1) {
        entryCount++;
        pageTrashMessage[`icon${entryCount}`] = "trash_can";
        pageTrashMessage[`trashType${entryCount}`] = customNames[trashIndex] && customNames[trashIndex] !== "" ? customNames[trashIndex] : eventName;
        pageTrashMessage[`trashDate${entryCount}`] = eventDatum;
        if (entryCount >= 6) {
          break;
        }
      }
    }
    messages.push(JSON.stringify(pageTrashMessage));
    return { messages };
  } catch (error) {
    return { messages: [], error };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getPageTrash
});
//# sourceMappingURL=getTrash.js.map
