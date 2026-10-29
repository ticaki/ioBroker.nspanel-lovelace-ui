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
var admin_media_exports = {};
__export(admin_media_exports, {
  mediaPlayerInfo: () => mediaPlayerInfo
});
module.exports = __toCommonJS(admin_media_exports);
var import_config_manager = require("../classes/config-manager");
var import_tools = require("../const/tools");
var import_pageMedia = require("../pages/pageMedia");
var import_adminShareConfig = require("../types/adminShareConfig");
async function childNames(adapter, type, prefix) {
  var _a;
  const depth = prefix.split(".").length + 1;
  const view = await adapter.getObjectViewAsync("system", type, {
    startkey: `${prefix}.`,
    endkey: `${prefix}.\u9999`
  });
  const names = ((_a = view == null ? void 0 : view.rows) != null ? _a : []).filter((row) => (row == null ? void 0 : row.id) && row.id.split(".").length === depth && row.value).map((row) => (0, import_tools.getStringFromStringOrTranslated)(adapter, row.value.common.name, row.id.split(".").pop()));
  return [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
async function stateTexts(adapter, id) {
  const obj = await adapter.getForeignObjectAsync(id);
  const states = (obj == null ? void 0 : obj.common) && "states" in obj.common ? obj.common.states : void 0;
  if (Array.isArray(states)) {
    return states.filter((s) => typeof s === "string" && !!s);
  }
  if (states && typeof states === "object") {
    return Object.values(states).filter((s) => typeof s === "string" && !!s);
  }
  if (typeof states === "string") {
    return states.split(";").map((s) => s.split(":").slice(1).join(":")).filter(Boolean);
  }
  return [];
}
async function squeezeboxFavorites(adapter, inst) {
  var _a, _b;
  const states = await adapter.getForeignStatesAsync(`${inst}.Favorites.*`);
  const favorites = {};
  for (const id in states) {
    const parts = id.split(".");
    if (parts.length !== 5) {
      continue;
    }
    const fav = favorites[parts[3]] = (_a = favorites[parts[3]]) != null ? _a : {};
    const val = (_b = states[id]) == null ? void 0 : _b.val;
    if (parts[4] === "Name" && typeof val === "string") {
      fav.name = val;
    } else if (parts[4] === "isaudio") {
      fav.audio = val === 1 || val === "1" || val === true;
    }
  }
  return Object.values(favorites).filter((f) => f.audio && f.name).map((f) => f.name);
}
async function squeezeboxPlaylists(adapter, inst) {
  let response;
  try {
    response = await adapter.sendToAsync(
      inst,
      "cmdGeneral",
      { playerid: "", cmdArray: ["playlists", "0", "999", "tags:u"] },
      { timeout: 3e3 }
    );
  } catch {
    return [];
  }
  const loopOf = (data) => !data || typeof data !== "object" ? void 0 : "playlists_loop" in data ? data.playlists_loop : "result" in data ? loopOf(data.result) : void 0;
  const loop = loopOf(response);
  if (!Array.isArray(loop)) {
    return [];
  }
  return loop.map(
    (entry) => entry && typeof entry === "object" && "playlist" in entry && typeof entry.playlist === "string" ? entry.playlist : ""
  ).filter(Boolean);
}
async function mediaListOptions(adapter, id) {
  const parts = id.split(".");
  const inst = parts.slice(0, 2).join(".");
  const options = { speakerList: [], playList: [], favoriteList: [] };
  switch ((0, import_adminShareConfig.mediaBackendOf)(id)) {
    case "alexa2":
      options.speakerList = await childNames(adapter, "device", `${inst}.Echo-Devices`);
      break;
    case "sonos": {
      options.speakerList = await childNames(adapter, "channel", `${inst}.root`);
      const fav = await adapter.getForeignStateAsync(`${parts.slice(0, 4).join(".")}.favorites_list`);
      if (typeof (fav == null ? void 0 : fav.val) === "string") {
        options.favoriteList = fav.val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      break;
    }
    case "spotify-premium":
      options.speakerList = await stateTexts(adapter, `${inst}.devices.deviceList`);
      options.playList = await stateTexts(adapter, `${inst}.playlists.playlistList`);
      break;
    case "squeezeboxrpc":
      options.speakerList = await childNames(adapter, "device", `${inst}.Players`);
      options.favoriteList = await squeezeboxFavorites(adapter, inst);
      options.playList = await squeezeboxPlaylists(adapter, inst);
      break;
    case "mpd":
    case void 0:
      break;
  }
  return options;
}
async function mediaPlayerInfo(adapter, rawId) {
  const id = typeof rawId === "string" ? rawId.trim() : "";
  const options = { speakerList: [], playList: [], favoriteList: [] };
  const backend = (0, import_adminShareConfig.mediaBackendOf)(id);
  if (!backend) {
    return { ok: false, messages: [], options };
  }
  const page = {
    type: "cardMedia",
    uniqueName: "admin-check",
    heading: "",
    media: { id },
    items: []
  };
  const gridItem = {
    uniqueID: "admin-check",
    dpInit: "",
    template: void 0,
    alwaysOn: "none",
    pageItems: [],
    config: { card: "cardMedia", data: {} }
  };
  let messages = [];
  try {
    ({ messages } = await import_pageMedia.PageMedia.getPage(new import_config_manager.ConfigManager(adapter), page, gridItem, [], true));
  } catch (e) {
    messages = [String(e)];
  }
  const ok = messages[0] === "done";
  return {
    ok,
    backend,
    messages: ok ? [] : messages,
    options: ok ? await mediaListOptions(adapter, page.media.id) : options
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mediaPlayerInfo
});
//# sourceMappingURL=admin-media.js.map
